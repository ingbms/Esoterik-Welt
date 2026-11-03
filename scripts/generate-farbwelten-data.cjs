// Farbwelten — Redaktionsquelle → Datensatz.
//
// Die Texte liegen als Markdown unter content/farbwelten/ (Redaktionsstand
// Task 3). Dieses Skript übersetzt sie einmalig in js/data/farbwelten.js.
// Damit steht im Modul kein Redaktionstext und im Markup keine Prosa.
//
// Aufruf:  node scripts/generate-farbwelten-data.cjs
//
// Vertrag (docs/farbwelten-konzept/08-umsetzungsleitfaden.md §4/§6):
//   H2            → Abschnittsschlüssel über SECTION_MAP
//   Absatz        → {type:'p', text}
//   "- "          → {type:'list', items:[]}
//   "| … |"       → {type:'table', head:[], rows:[[]]}
//   "> "          → {type:'quote', text, title?}
//   "### "        → {type:'h3', text}
//
// Inline-Auszeichnung bleibt als Markdown-lite im Text (**fett**, *kursiv*,
// [Text](url)); der Renderer setzt sie mit textContent zusammen, nie als HTML.

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content', 'farbwelten');
const target = path.join(root, 'js', 'data', 'farbwelten.js');

const C_LIGHT = 299792458; // m/s
const PLANCK_EV_NM = 1239.841984; // eV·nm

const COLOR_FILES = [
  'rot',
  'orange',
  'gelb',
  'gruen',
  'tuerkis',
  'blau',
  'indigo',
  'violett',
  'magenta',
  'rosa',
  'weiss',
  'schwarz',
];

// Verbindliche Wellenlängenbereiche aus docs/farbwelten-konzept/02 §10 und
// mockup/index.html. Grenzen sind konventionelle Näherungen.
const WAVELENGTHS = {
  rot: [620, 750],
  orange: [590, 620],
  gelb: [570, 590],
  gruen: [490, 570],
  // Türkis ist Spektralfarbe, liegt aber als Übergangsbereich zwischen Grün
  // (bis 490 nm im Datenbestand) und Blau und überschneidet beide Grenzen.
  // 490–520 nm ist eine Konvention, keine Naturkante.
  tuerkis: [490, 520],
  blau: [450, 490],
  indigo: [425, 450],
  violett: [380, 425],
};

// Farbtyp nach §13.2 des Master-Auftrags. Der Typ entscheidet, ob eine
// Wellenlänge, Frequenz und Photonenenergie überhaupt angegeben werden dürfen.
const COLOR_TYPES = {
  rot: 'spectral',
  orange: 'spectral',
  gelb: 'spectral',
  gruen: 'spectral',
  tuerkis: 'spectral',
  blau: 'spectral',
  indigo: 'spectral',
  violett: 'spectral',
  magenta: 'non-spectral',
  rosa: 'non-spectral',
  weiss: 'neutral',
  schwarz: 'neutral',
};

const TYPE_LABELS = {
  spectral: 'Spektralfarbe',
  'non-spectral': 'nicht spektral',
  neutral: 'Neutralfarbe',
};

// Einordnung der Seite als Spektralbereich. Fehlt eine Zuordnung, bricht der
// Generator ab — es gibt keinen stillen Standardwert.
const SPECTRAL = Object.fromEntries(COLOR_FILES.map((id) => [id, COLOR_TYPES[id] === 'spectral']));

// Verwandtschaften für das Register. Physikalische Nachbarschaft im Spektrum
// bzw. bei Mischfarben die beteiligten Grundfarben.
const RELATED_COLORS = {
  rot: ['orange', 'magenta', 'rosa'],
  orange: ['rot', 'gelb'],
  gelb: ['orange', 'gruen'],
  gruen: ['gelb', 'tuerkis', 'blau'],
  tuerkis: ['gruen', 'blau'],
  blau: ['tuerkis', 'indigo'],
  indigo: ['blau', 'violett'],
  violett: ['indigo', 'magenta'],
  magenta: ['rot', 'blau', 'violett'],
  rosa: ['rot', 'weiss'],
  weiss: ['schwarz', 'rosa'],
  schwarz: ['weiss'],
};

// Abschnittsschlüssel der Farbdetailseiten (Skelett A–H, IA §5).
const SECTION_ORDER = [
  { key: 'erleben', label: 'Die Farbe erleben', anchor: 'erleben' },
  { key: 'physik', label: 'Physikalische Eigenschaften', anchor: 'physik' },
  { key: 'psychologie', label: 'Farbpsychologie', anchor: 'psychologie' },
  { key: 'tradition', label: 'Spirituelle Bedeutung', anchor: 'tradition' },
  { key: 'anwendung', label: 'Farbtherapeutische Anwendung', anchor: 'anwendung' },
  { key: 'geschichte', label: 'Kultur und Geschichte', anchor: 'geschichte' },
  { key: 'uebung', label: 'Entdecken und ausprobieren', anchor: 'uebung' },
  { key: 'quellen', label: 'Quellen und verwandte Themen', anchor: 'quellen' },
];

// Zuordnung der gelieferten H2-Überschriften auf das A–H-Skelett. Alles, was
// hier nicht greift, bricht den Generator ab — keine stillen Textverluste.
const SECTION_MAP = [
  // Muss vor /^tradition/ stehen: „Traditionshistorische Einordnung" ist ein
  // Geschichtsabschnitt, kein zweiter Traditionsblock.
  { key: 'geschichte', test: /^traditionshistorisch/i },
  { key: 'tradition', test: /^tradition/i },
  { key: 'tradition', test: /^ergänzende anmerkung zur tradition/i },
  { key: 'tradition', test: /^physikalisch und traditionell/i },
  { key: 'psychologie', test: /^farbpsycholog/i },
  { key: 'anwendung', test: /^anwendung/i },
  { key: 'anwendung', test: /^was nicht verwendet/i },
  { key: 'anwendung', test: /^was wissenschaft sagt/i },
  { key: 'anwendung', test: /^was die studienlage/i },
  { key: 'anwendung', test: /^health-disclaimer/i },
  { key: 'anwendung', test: /^blaulicht/i },
  { key: 'geschichte', test: /^(interkulturell|traditionshistorisch)/i },
  { key: 'uebung', test: /^(praktische übung|übung)/i },
  { key: 'quellen', test: /^quellen/i },
];

// Meta-Abschnitte: Aussagen über den Aufbau der Seite, nicht über die Farbe.
const DROP_SECTIONS = [/^anmerkung zur ehrlichen einordnung/i];

// Traditionelle Zuordnung je Farbwelt, wörtlich aus dem jeweiligen
// Traditionsabschnitt (Task 3) — Grundlage des Kastens „Tradition und
// Forschung“ (docs/farbwelten-konzept/05 §6).
const TRADITION_CLAIM = {
  rot: 'Lebensenergie, Stabilität und das Element Erde',
  orange: 'Kreativität, Geselligkeit und das Element Wasser',
  gelb: 'Willenskraft, Selbstvertrauen und das Feuer',
  gruen: 'Natur, Harmonie und Heilung',
  tuerkis: 'Klarheit, Offenheit und den Übergang zwischen zwei Polen',
  blau: 'Kommunikation, Ruhe und Ausdruck',
  indigo: 'Intuition',
  violett: 'Spiritualität',
  magenta: 'Übergang, Veränderung und die Spannung zwischen Leidenschaft und Tiefe',
  rosa: 'Sanftmut und Fürsorge als abgedämpfte Form des Rot',
  weiss: 'Reinigung und die höchste Schwingung der modernen Regensymbolik',
  schwarz: 'Schutz, das Unbekannte und Transformation durch Dunkelheit',
};

const RESEARCH_CLAIM = {
  rot: 'Photobiomodulation mit rotem bis nahinfrarotem Licht ist bei einzelnen Indikationen untersucht — mit niedriger bis moderater Evidenzsicherheit.',
  orange:
    'Photobiomodulation arbeitet mit rotem bis nahinfrarotem Licht; für Orange als eigene medizinische Wellenlänge gibt es kein Protokoll.',
  gelb: 'Photobiomodulation arbeitet mit rotem bis nahinfrarotem Licht; Gelb spielt in medizinischen Protokollen keine eigene Rolle.',
  gruen:
    'Photobiomodulation arbeitet mit rotem bis nahinfrarotem Licht; für Grün gibt es kein eigenes medizinisches Protokoll.',
  tuerkis:
    'Für Türkis gibt es keine eigene, von Blau und Grün getrennte emotionale Kategorie; die Studienlage führt nur eine gemeinsame Kategorie GREEN–BLUE.',
  blau: 'Untersucht ist die Rolle von Blaulicht für die innere Uhr und, bei hoher Dosis, Retina und Rhythmus; ein Heilverfahren „Blau“ gibt es nicht.',
  indigo:
    'Für Indigo existiert kein medizinisches Lichtprotokoll; Indigo ist ein fließender Übergang zwischen Blau und Violett.',
  violett:
    'Für Violett existiert kein medizinisches Lichtprotokoll; UV-Strahlung liegt außerhalb des sichtbaren Bereichs.',
  magenta:
    'Für Magenta gibt es keine von Rot und Blau unabhängige Effektsignatur; Studien führen es als Bildschirm-Mix unter „purple / violet“.',
  rosa: 'Rosa hat keine eigene Wellenlänge: Studien beschreiben es als Rotvariante mit reduzierter Sättigung, ohne spezifische therapeutische Evidenz.',
  weiss:
    'Weißes Licht ist in der Phototherapie nur Träger definierter Spektren; Photobiomodulation arbeitet mit rotem bis nahinfrarotem Licht.',
  schwarz:
    'Für Schwarz als Farbkategorie existiert kein Lichtprotokoll; untersucht werden Intensität und Wellenlänge von Licht, nicht die Abwesenheit von Reiz.',
};

const HEALTH_NOTE =
  'Diese Inhalte ersetzen keine medizinische Diagnose oder Behandlung. Farbtherapie als Krankheitsbehandlung ist medizinisch nicht belegt [9].';
const COMPARE_NOTE =
  'Die Evidenzlage ist nicht symmetrisch: Die Tradition beschreibt eine Bedeutung, die Forschung untersucht Lichtwirkungen — nicht die Farbe als Heilmittel.';

// Titel und Beschreibungen: verbindlich aus docs/farbwelten-konzept/02 §10.
// Sie ersetzen die kürzeren Frontmatter-Zeilen der Redaktionsdateien, weil die
// IA-Länge (≤60/≤155 Zeichen) und die Suchintention dort festgelegt sind.
const META = {
  rot: {
    title: 'Rot — Licht, Wirkung und Bedeutung | Esoterik-Welt',
    description:
      'Rot zwischen 620 und 750 nm: Physik, Farbpsychologie, kulturelle Symbolik, Chakra-Zuordnung und die Grenzen farbtherapeutischer Behauptungen.',
  },
  orange: {
    title: 'Orange — Licht, Wirkung und Bedeutung | Esoterik-Welt',
    description:
      'Orange zwischen 590 und 620 nm: Wahrnehmung, Assoziationen, kulturelle Bedeutung, Sakralchakra und der Unterschied zwischen Tradition und Befund.',
  },
  gelb: {
    title: 'Gelb — Licht, Wirkung und Bedeutung | Esoterik-Welt',
    description:
      'Gelb zwischen 570 und 590 nm: Helligkeitswirkung, Assoziationen, Symbolik, Solarplexuschakra und die Grenzen der Farbpsychologie.',
  },
  gruen: {
    title: 'Grün — Licht, Wirkung und Bedeutung | Esoterik-Welt',
    description:
      'Grün zwischen 490 und 570 nm: Wahrnehmung, Beruhigungsassoziationen, Natur- und Herzsymbolik, Forschungslage und offene Fragen.',
  },
  blau: {
    title: 'Blau — Licht, Wirkung und Bedeutung | Esoterik-Welt',
    description:
      'Blau zwischen 450 und 490 nm: Physik, Farbpsychologie, Halschakra und die gut untersuchte Rolle von Licht für die innere Uhr.',
  },
  indigo: {
    title: 'Indigo — Licht, Wirkung und Bedeutung | Esoterik-Welt',
    description:
      'Indigo zwischen 425 und 450 nm: schmaler Spektralbereich, kulturelle Deutungen, Stirnchakra und die Herkunft der modernen Zuordnung.',
  },
  violett: {
    title: 'Violett — Licht, Wirkung und Bedeutung | Esoterik-Welt',
    description:
      'Violett zwischen 380 und 425 nm: kurzwelliges Licht, Symbolik, Kronenchakra, Abgrenzung zu Magenta und der Stand der Forschung.',
  },
  tuerkis: {
    title: 'Türkis (Cyan) — Übergang zwischen Grün und Blau | Esoterik-Welt',
    description:
      'Türkis (Cyan) als Übergangsbereich um 490–520 nm (Konvention): Physik, Assoziationen, Tradition und die Grenzen der Farbtherapie.',
  },
  magenta: {
    title: 'Magenta — Mischfarbe aus Rot und Blau | Esoterik-Welt',
    description:
      'Magenta ist nicht spektral: additiver Rot-Blau-Mix, Physik, Farbpsychologie, Symbolik und die Grenzen therapeutischer Behauptungen.',
  },
  rosa: {
    title: 'Rosa — Mischfarbe aus Rot und Weiß | Esoterik-Welt',
    description:
      'Rosa als Rot-Weiß-Mischung: Sättigung, Helligkeit, kulturelle Bedeutung und die Grenzen der Farbpsychologie — ohne Heilversprechen.',
  },
  weiss: {
    title: 'Weiß — Neutralfarbe aus allen Wellenlängen | Esoterik-Welt',
    description:
      'Weiß als Superposition und Remission: warum es keine eigene Wellenlänge hat, was die Forschung sagt und was Tradition bleibt.',
  },
  schwarz: {
    title: 'Schwarz — Neutralfarbe ohne Lichtreiz | Esoterik-Welt',
    description:
      'Schwarz als Absorption ohne Lichtreiz: Physik, kulturelle Deutungen, Farbpsychologie und die klaren Grenzen der Farbtherapie.',
  },
};

const META_PAGES = {
  landing: {
    title: 'Farbwelten — Bedeutung, Physik und Tradition der Farben | Esoterik-Welt',
    description:
      'Zwölf Farbwelten zwischen Licht, Wahrnehmung und Tradition: Wellenlängen, Assoziationen, Chakren und Forschungsstand differenziert erklärt.',
  },
  chakren: {
    title: 'Chakren und Farben — Zuordnung und Herkunft | Esoterik-Welt',
    description:
      'Die sieben Chakren, ihre Farbzuordnung und die Geschichte des Regenbogenmodells — als Tradition gekennzeichnet, wissenschaftlich eingeordnet.',
  },
  light: {
    title: 'Lichtfrequenzen und wissenschaftliche Einordnung | Esoterik-Welt',
    description:
      'Wellenlänge, Frequenz und Photonenenergie berechnen; Lichttherapie und Photobiologie mit Quellen und klaren Evidenzgrenzen.',
  },
};
// Kurzverweise, die im Redaktionsstand nur als Nummer erscheinen. Keine
// erfundenen bibliografischen Angaben: Label nennt nur, wofür die Quelle im
// gelieferten Text steht, und verweist auf den Evidenzreport.
const SHORT_REFS = {
  14: 'ANSES — Bewertung zu Blaulicht und LED',
  17: 'Phototherapie bei Neugeborenenikterus',
  18: 'NB-UVB bei Psoriasis',
  19: 'IARC — UV-Strahlung als Gruppe-1-Karzinogen',
};

// Zeitleiste der Chakra-Geschichte, wörtlich aus content/farbwelten/chakren.md.
const HISTORY_TIMELINE = [
  '1577: *Sat-cakra-nirupana* — sechs Zentren und das Sahasrāra; Zuordnung von Element- und Lotosfarben, keine Regenbogenfolge [1][2].',
  '1919: Woodroffe/Avalon — westliche Übersetzung, Autoritätsquelle für fast alle späteren Chakratexte [2].',
  '1920er: Theosophie und westliche Esoterik entwickeln Farbzuordnungen zu den Zentren [1].',
  '1977: Das Regenbogen-Chakramodell mit sieben Farben erscheint in dieser Kombination [1].',
];

function read(name) {
  return fs.readFileSync(path.join(contentDir, name), 'utf8').replace(/\r\n/g, '\n');
}

function parseFrontmatter(source) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split('\n')) {
    const field = /^([a-zA-Z_]+):\s*"?(.*?)"?\s*$/.exec(line);
    if (field) data[field[1]] = field[2];
  }
  return { data, body: source.slice(match[0].length) };
}

function inlineText(value) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\*\*(.+?)\*\*$/, '$1');
}

// Blockparser: bewusst klein und deterministisch. Unbekannte Zeilen werden zu
// Text — der Generator verliert nichts, der Renderer zeigt nur bekannte Typen.
function parseBlocks(lines) {
  const blocks = [];
  let paragraph = [];
  let list = null;
  let quote = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: 'p', text: inlineText(paragraph.join(' ')) });
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push({ type: 'list', items: list.map(inlineText) });
    list = null;
  };
  const flushQuote = () => {
    if (!quote) return;
    const text = inlineText(quote.join(' '));
    if (text) blocks.push({ type: 'quote', text });
    quote = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (/^\|/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      const rows = [];
      while (index < lines.length && /^\|/.test(lines[index].trim())) {
        const cells = lines[index]
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{2,}:?$/.test(cell))) rows.push(cells);
        index += 1;
      }
      index -= 1;
      if (rows.length) blocks.push({ type: 'table', head: rows[0], rows: rows.slice(1) });
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph();
      flushList();
      const content = trimmed.replace(/^>\s?/, '');
      // Die SEO- und Link-Zeilen des Redaktionsstands sind Metadaten, keine Zitate.
      if (/^(SEO|Links:|Interne Verlinkung)/i.test(content)) continue;
      if (!quote) quote = [];
      quote.push(content);
      continue;
    }

    if (/^-\s+/.test(trimmed)) {
      flushParagraph();
      flushQuote();
      if (!list) list = [];
      list.push(trimmed.replace(/^-\s+/, ''));
      continue;
    }

    if (!trimmed || /^---+$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  flushQuote();
  return blocks;
}

function mergeIntroHeading(document) {
  // Die Redaktionsdateien führen den Einstiegstext unter „## Einführung“.
  const index = document.sections.findIndex((section) => /^einführung$/i.test(section.heading || ''));
  if (index >= 0) {
    document.intro.push(...document.sections[index].blocks);
    document.sections.splice(index, 1);
  }
  return document;
}

function splitDocument(body) {
  const lines = body.split('\n');
  const titleLine = lines.find((line) => /^#\s+/.test(line));
  const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : '';
  const sections = [];
  let current = { heading: null, lines: [] };
  let started = false;

  for (const line of lines) {
    if (/^#\s+/.test(line)) continue;
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      if (started || current.lines.some((entry) => entry.trim())) sections.push(current);
      current = { heading: heading[1].trim(), lines: [] };
      started = true;
      continue;
    }
    current.lines.push(line);
  }
  if (started || current.lines.some((entry) => entry.trim())) sections.push(current);

  const introSection = sections.length && sections[0].heading === null ? sections.shift() : { lines: [] };
  return {
    title,
    intro: parseBlocks(introSection.lines),
    sections: sections.map((section) => ({ heading: section.heading, blocks: parseBlocks(section.lines) })),
  };
}

function frequencies([min, max]) {
  const low = C_LIGHT / (max * 1e-9) / 1e12;
  const high = C_LIGHT / (min * 1e-9) / 1e12;
  return { min: Math.round(low), max: Math.round(high), label: `${Math.round(low)}–${Math.round(high)} THz` };
}

function photonEnergies([min, max]) {
  const low = PLANCK_EV_NM / max;
  const high = PLANCK_EV_NM / min;
  const fmt = (value) => value.toFixed(2).replace('.', ',');
  return { min: Number(low.toFixed(3)), max: Number(high.toFixed(3)), label: `${fmt(low)}–${fmt(high)} eV` };
}

function collectSourceIds(text) {
  const ids = [];
  for (const match of text.matchAll(/\[(\d{1,2})\]/g)) {
    const id = match[1];
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function mapSections(document, id) {
  const sections = Object.fromEntries(SECTION_ORDER.map((section) => [section.key, []]));
  const mapped = [];

  for (const section of document.sections) {
    if (DROP_SECTIONS.some((pattern) => pattern.test(section.heading || ''))) {
      mapped.push({ heading: section.heading, key: null, reason: 'Meta-Abschnitt' });
      continue;
    }
    const rule = SECTION_MAP.find((entry) => entry.test.test(section.heading || ''));
    if (!rule) throw new Error(`${id}: keine Zuordnung für H2 „${section.heading}“`);
    const blocks = [...section.blocks];
    if (sections[rule.key].length && blocks.length) blocks.unshift({ type: 'h3', text: section.heading });
    sections[rule.key].push(...blocks);
    mapped.push({ heading: section.heading, key: rule.key });
  }
  return { sections, mapped };
}

function parseSourceEntry(item) {
  const match = /^\[(\d{1,2})\]\s*(.+)$/.exec(item);
  if (!match) return null;
  const [, id, rest] = match;
  const urlMatch = /(https?:\/\/\S+)$/.exec(rest);
  const url = urlMatch ? urlMatch[1].replace(/[).,;]+$/, '') : null;
  const label = (url ? rest.slice(0, rest.length - urlMatch[1].length) : rest)
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.\s]+$/, '');
  return { id, label, url };
}

// Jede Redaktionsseite führt ihre eigene Bibliografie. Für das Quellenregister
// zählt der vollständigste Eintrag (URL vor ohne URL, danach das längere Label).
// Nur so erscheinen auch Quellen, die ausschließlich eine Unterseite zitiert
// (z. B. [20] auf rot/gruen), im gerenderten Modul als vollständige Angabe.
function registerSources(document, registry) {
  const quellen = document.sections.find((section) => /^quellen/i.test(section.heading || ''));
  for (const block of quellen?.blocks || []) {
    if (block.type !== 'list') continue;
    for (const item of block.items) {
      const entry = parseSourceEntry(item);
      if (!entry) continue;
      // Ketten wie „- [1][2][3] – siehe Einstiegsseite" sind keine bibliografische
      // Angabe und dürfen das Register nicht mit einem falschen Label füllen.
      if (/^\[\d{1,2}\]/.test(entry.label) || entry.label.length < 10) continue;
      const candidate = { id: entry.id, label: entry.label, url: entry.url, shortRef: false };
      const score = (value) => (value.url ? 100000 : 0) + value.label.length;
      const existing = registry.get(entry.id);
      if (!existing || score(candidate) > score(existing)) registry.set(entry.id, candidate);
    }
  }
}

function readDocument(name) {
  const parsed = parseFrontmatter(read(`${name}.md`));
  return { parsed, document: mergeIntroHeading(splitDocument(parsed.body)) };
}

// --- Farbtyp-abhängige Abschnitte -----------------------------------------

const CHAKRA_BY_ID = {
  rot: 'root',
  orange: 'sacral',
  gelb: 'solar',
  gruen: 'heart',
  blau: 'throat',
  indigo: 'third-eye',
  violett: 'crown',
};

const CHAKRA_TITLE = {
  rot: 'Wurzelchakra',
  orange: 'Sakralchakra',
  gelb: 'Solarplexuschakra',
  gruen: 'Herzchakra',
  blau: 'Kehlkopfchakra',
  indigo: 'Stirnchakra',
  violett: 'Kronenchakra',
};

const SPECTRAL_NOTE =
  'Die Grenzen zu den Nachbarfarben sind konventionell und fließend. Ein Bildschirm erzeugt Metamere, kein monochromatisches Licht der angegebenen Wellenlänge [24][31].';

// Nichtspektrale und neutrale Farben haben keine Wellenlänge. Der Abschnitt
// nennt deshalb keine Messwerte, sondern erklärt Mischfarbe, Additivität und
// Remission — dieselbe Quellenlage wie die Redaktionsseiten.
const PHYSICS = {
  'non-spectral': {
    rows: [
      ['Einordnung', 'nicht spektral — keine eigene Wellenlänge'],
      ['Zustandekommen', 'additive Mischung aus Rot und Blau (Licht) bzw. Remission bei Pigmenten'],
    ],
    text: 'Für diese Farbe lässt sich keine Wellenlänge angeben: Sie existiert im Spektrum nicht als Reinstoff, sondern nur als Mischung. Bildschirme erzeugen sie als RGB-Mix, Pigmente durch Remission; zwei physikalisch verschiedene Proben können dabei identisch aussehen [24][31].',
  },
  neutral: {
    weiss: {
      rows: [
        ['Einordnung', 'Neutralfarbe — keine eigene Wellenlänge'],
        ['Zustandekommen', 'Superposition aller sichtbaren Wellenlängen (Licht) bzw. breite Remission (Oberfläche)'],
      ],
      text: 'Weiß ist keine Wellenlänge, sondern ein Zustand: alle sichtbaren Wellenlängen gemeinsam (Licht) oder eine breite, gleichmäßige Remission (Oberfläche). Ein Bildschirm mischt Weiß aus seinen Primärvalenzen; das Ergebnis ist ein Metamer, kein weißes Reinstofflicht [24][31].',
    },
    schwarz: {
      rows: [
        ['Einordnung', 'Neutralfarbe — keine eigene Wellenlänge'],
        ['Zustandekommen', 'nahezu vollständige Absorption des sichtbaren Lichts, minimale Remission'],
      ],
      text: 'Schwarz ist keine Wellenlänge, sondern das Fehlen remittierten Lichts: Eine Oberfläche absorbiert nahezu das gesamte sichtbare Spektrum. Ein Bildschirm erzeugt Schwarz durch Abschalten der Kanäle — ein Reiz entsteht dabei nicht [24][31].',
    },
  },
};

function erlebenFacts(id, type, range) {
  if (!range) {
    return [
      ['Einordnung', TYPE_LABELS[type]],
      ['Wellenlänge', 'keine eigene Wellenlänge'],
    ];
  }
  const [min, max] = range;
  return [
    ['Wellenlängenbereich', id === 'tuerkis' ? `${min}–${max} nm (Übergangsbereich, Konvention)` : `${min}–${max} nm`],
    [
      'Einordnung',
      id === 'tuerkis'
        ? 'Spektralfarbe im Übergangsbereich zwischen Grün und Blau'
        : 'Spektralfarbe im sichtbaren Bereich',
    ],
  ];
}

function physikSection(id, type, range, frequency, photonEv) {
  if (range) {
    const [min, max] = range;
    return [
      {
        type: 'facts',
        rows: [
          [
            'Wellenlängenbereich',
            id === 'tuerkis'
              ? `${min}–${max} nm (Übergangsbereich, Konvention)`
              : `${min}–${max} nm (konventionelle Näherung)`,
          ],
          ['Frequenz', frequency.label],
          ['Photonenenergie', `ca. ${photonEv.label}`],
          [
            'Entstehung',
            id === 'tuerkis'
              ? 'Spektralfarbe im Übergangsbereich zwischen Grün und Blau; die Grenzen 490 und 520 nm sind Konvention'
              : 'Spektralfarbe innerhalb des sichtbaren Bereichs',
          ],
        ],
      },
      { type: 'p', text: SPECTRAL_NOTE },
    ];
  }
  const detail = type === 'neutral' ? PHYSICS.neutral[id] : PHYSICS[type];
  return [
    { type: 'facts', rows: detail.rows },
    { type: 'p', text: detail.text },
  ];
}

function buildColors() {
  const sourceRegistry = new Map();
  const worlds = [];
  const reports = [];

  // Zuerst die Einstiegsseite: sie trägt die kanonische Quellenliste.
  const landingSource = read('farbwelten.md');
  const landing = parseFrontmatter(landingSource);
  const landingDoc = splitDocument(landing.body);
  registerSources(landingDoc, sourceRegistry);
  // Danach alle Unterseiten, damit das Register jede zitierte Quelle auflöst.
  const documents = new Map();
  for (const id of COLOR_FILES) {
    const entry = readDocument(id);
    documents.set(id, entry);
    registerSources(entry.document, sourceRegistry);
  }
  for (const name of ['chakren', 'lichtfrequenzen']) {
    registerSources(splitDocument(parseFrontmatter(read(`${name}.md`)).body), sourceRegistry);
  }
  for (const [id, label] of Object.entries(SHORT_REFS)) {
    if (!sourceRegistry.has(id))
      sourceRegistry.set(id, {
        id,
        label: `${label} — Kurzverweis, vollständige Angabe im Evidenzreport t_2dd7d588`,
        url: null,
        shortRef: true,
      });
  }

  // Fehlende Zuordnungen brechen hart ab: kein stiller Textverlust, keine
  // erfundenen Messwerte, keine leeren Registerfelder.
  for (const id of COLOR_FILES) {
    for (const [name, table] of Object.entries({
      COLOR_TYPES,
      TRADITION_CLAIM,
      RESEARCH_CLAIM,
      META,
      RELATED_COLORS,
    })) {
      if (!table[id]) throw new Error(`${id}: keine Zuordnung in ${name}`);
    }
    const type = COLOR_TYPES[id];
    if (!TYPE_LABELS[type]) throw new Error(`${id}: unbekannter Farbtyp „${type}“`);
    if (type === 'spectral' && !WAVELENGTHS[id]) throw new Error(`${id}: Spektralfarbe ohne Wellenlängenbereich`);
    if (type !== 'spectral' && WAVELENGTHS[id])
      throw new Error(`${id}: ${TYPE_LABELS[type]} darf keinen Wellenlängenbereich tragen`);
  }

  for (const id of COLOR_FILES) {
    const { parsed, document } = documents.get(id);
    const { sections, mapped } = mapSections(document, id);
    const type = COLOR_TYPES[id];
    const range = WAVELENGTHS[id] || null;
    const frequency = range ? frequencies(range) : null;
    const photonEv = range ? photonEnergies(range) : null;

    // Abschnitt A: Farbfläche, Nuancen, Wellenlängenbereich und Einordnung.
    // Der erste Einstiegsabsatz steht als Lede im Seitenkopf (IA §5 A, §6).
    const introBlocks = document.intro.filter((block) => block.type === 'p');
    const lede = introBlocks[0]?.text || parsed.data.description || '';
    sections.erleben = [
      { type: 'swatch' },
      { type: 'facts', rows: erlebenFacts(id, type, range) },
      ...introBlocks.slice(1),
    ];

    sections.physik = physikSection(id, type, range, frequency, photonEv);

    if (!sections.psychologie.length) {
      sections.psychologie = [
        {
          type: 'gap',
          text: 'Für diese Farbwelt enthält der Redaktionsstand keinen Abschnitt zur Farbpsychologie. Die Seite nennt deshalb keine Assoziationen; die Ergänzung erfolgt redaktionell nach derselben Quellenlage wie bei den übrigen Farbwelten.',
        },
      ];
    }

    sections.geschichte.push({
      type: 'h3',
      text: 'Die Farbzuordnung der Chakren hat eine datierbare Geschichte',
    });
    sections.geschichte.push({ type: 'timeline', items: HISTORY_TIMELINE });

    const compare = {
      traditionTitle: CHAKRA_TITLE[id]
        ? `${document.title} und das ${CHAKRA_TITLE[id]}`
        : `${document.title} und die moderne Regenbogenzuordnung`,
      traditionText: `In der Tradition steht ${document.title} für ${TRADITION_CLAIM[id]}. Die Regenbogenzuordnung der Chakren ist eine moderne Zusammenführung; sie erscheint in dieser Kombination erst 1977 [1][2].`,
      traditionChips: ['Deutungstradition'],
      researchTitle: 'Was tatsächlich untersucht ist',
      researchText: RESEARCH_CLAIM[id],
      researchChips: ['Empirie begrenzt'],
      note: COMPARE_NOTE,
    };

    // Der Health-Disclaimer des Redaktionsstands steht als letzter Block der
    // Seite (nach ## Quellen). Er gehört inhaltlich in den Anwendungsabschnitt
    // und wird dort als letzter Block gerendert; aus dem Quellenabschnitt wird
    // er entfernt, damit er nicht doppelt in den Daten steht.
    const isDisclaimer = (block) =>
      block.type === 'quote' && /Health-Disclaimer|medizinische Diagnose oder Behandlung/i.test(block.text);
    const moved = sections.quellen.filter(isDisclaimer);
    if (moved.length) sections.quellen = sections.quellen.filter((block) => !isDisclaimer(block));
    const existingDisclaimer = sections.anwendung.find(
      (block) => block.type === 'quote' && /medizin/i.test(block.text)
    );
    if (!existingDisclaimer) {
      sections.anwendung.push(moved[0] || { type: 'quote', text: HEALTH_NOTE });
    }

    const allText = JSON.stringify({ intro: document.intro, sections });
    const cited = collectSourceIds(allText).sort((a, b) => Number(a) - Number(b));
    const sources = cited.filter((sourceId) => sourceRegistry.has(sourceId));
    const shortRefs = cited.filter((sourceId) => !sourceRegistry.has(sourceId));

    const summary = parsed.data.description || '';
    const route = `#farbwelten/${id}`;
    const verwandt = RELATED_COLORS[id];

    worlds.push({
      id,
      name: document.title,
      route,
      type,
      typeLabel: TYPE_LABELS[type],
      spectral: SPECTRAL[id],
      wavelength: range ? { min: range[0], max: range[1], label: `${range[0]}–${range[1]} nm` } : null,
      frequency,
      photonEv,
      chakra: CHAKRA_BY_ID[id] || null,
      summary,
      seoTitle: parsed.data.title || document.title,
      meta: META[id],
      lede,
      intro: introBlocks,
      sections,
      compare,
      sources,
      shortRefs,
      related: ['chakren', 'lichtfrequenzen', 'crystals'],
      verwandt,
      // Registereintrag: id, Name, Route, Kurzbeschreibung, Typ-Label,
      // Verwandtschaften — die Landing rendert ausschließlich daraus.
      register: {
        id,
        name: document.title,
        route,
        kurz: summary,
        typLabel: TYPE_LABELS[type],
        verwandt,
        chakra: CHAKRA_BY_ID[id] || null,
      },
    });
    reports.push({ id, mapped, dropped: mapped.filter((entry) => entry.key === null) });
  }

  return { worlds, sourceRegistry, reports, landingDoc, landing: landing.data };
}

function buildLanding(landingDoc, worlds) {
  const pick = (pattern) => landingDoc.sections.find((section) => pattern.test(section.heading || ''));
  const teilen = (section) => section?.blocks || [];
  return {
    title: 'Farbwelten',
    seoTitle: 'Farbwelten — Bedeutung, Physik und Tradition der Farben | Esoterik-Welt',
    meta: META_PAGES.landing,
    lede: landingDoc.intro[0]?.text || '',
    intro: landingDoc.intro.slice(1),
    sections: [
      { key: 'einfuehrung', title: 'Warum Farben uns berühren', blocks: teilen(pick(/^einführung/i)) },
      {
        key: 'regenbogen',
        title: 'Das Regenbogenmodell als moderne Zusammenführung',
        blocks: teilen(pick(/^das regenbogenmodell/i)),
      },
      {
        key: 'psychologie',
        title: 'Farbpsychologie: Assoziationen, nicht Ursachen',
        blocks: teilen(pick(/^farbpsychologie/i)),
      },
      {
        key: 'licht',
        title: 'Lichtmedizin und Chromotherapie — der Unterschied',
        blocks: teilen(pick(/^lichtmedizin/i)),
      },
      {
        key: 'uebung',
        title: 'Praktische Übung: Farbe als Alltagserfahrung',
        blocks: teilen(pick(/^praktische übung/i)),
      },
    ],
    sources: collectSourceIds(JSON.stringify(landingDoc)),
    worlds: worlds.map((world) => world.id),
  };
}

function buildChakrenPage(worldMap) {
  const parsed = parseFrontmatter(read('chakren.md'));
  const document = mergeIntroHeading(splitDocument(parsed.body));
  const find = (pattern) => document.sections.find((section) => pattern.test(section.heading || ''));
  const tableSection = find(/^tabelle/i);
  const table = tableSection?.blocks.find((block) => block.type === 'table') || { head: [], rows: [] };
  return {
    title: 'Chakren & Farben',
    seoTitle: 'Chakren und Farben — Zuordnung und Herkunft | Esoterik-Welt',
    meta: META_PAGES.chakren,
    lede: document.intro[0]?.text || '',
    intro: document.intro.slice(1),
    timeline: find(/^die geschichte der zentren/i)?.blocks || [],
    model: find(/^das regenbogenmodell/i)?.blocks || [],
    table: {
      caption: 'Zuordnung der sieben Chakren zu Farbwelten (modernes Regenbogenmodell)',
      head: table.head,
      rows: table.rows,
    },
    science: find(/^wissenschaftliche einordnung/i)?.blocks || [],
    sources: collectSourceIds(JSON.stringify(document)).filter((id) => Number(id) < 40),
    related: worldMap,
  };
}

function buildLightPage() {
  const parsed = parseFrontmatter(read('lichtfrequenzen.md'));
  const document = mergeIntroHeading(splitDocument(parsed.body));
  const find = (pattern) => document.sections.find((section) => pattern.test(section.heading || ''));
  return {
    title: 'Lichtfrequenzen und wissenschaftliche Einordnung',
    seoTitle: 'Lichtfrequenzen und wissenschaftliche Einordnung | Esoterik-Welt',
    meta: META_PAGES.light,
    lede: document.intro[0]?.text || '',
    intro: document.intro.slice(1),
    sections: [
      { key: 'belegt', title: 'Belegte Lichtmedizin', blocks: find(/^belegte lichtmedizin/i)?.blocks || [] },
      {
        key: 'chromotherapie',
        title: 'Chromotherapie: nicht belegt',
        blocks: find(/^chromotherapie/i)?.blocks || [],
      },
      {
        key: 'blaulicht',
        title: 'Blaulicht und UV — differenziert',
        blocks: find(/^blaulicht/i)?.blocks || [],
      },
      {
        key: 'disclaimer',
        title: 'Health-Disclaimer',
        blocks: find(/^health-disclaimer/i)?.blocks || [],
      },
    ],
    sources: collectSourceIds(JSON.stringify(document)),
  };
}

function main() {
  const { worlds, sourceRegistry, reports, landingDoc } = buildColors();
  const landingPage = buildLanding(landingDoc, worlds);
  const chakrenPage = buildChakrenPage(worlds.map((world) => world.id));
  const lightPage = buildLightPage();

  const sourceObject = Object.fromEntries(
    [...sourceRegistry.values()].sort((a, b) => Number(a.id) - Number(b.id)).map((entry) => [entry.id, entry])
  );

  const banner = `// AUTO-GENERATED — nicht von Hand bearbeiten.
// Quelle: content/farbwelten/*.md (Redaktionsstand Task 3)
// Erzeugt von scripts/generate-farbwelten-data.cjs.
// Neu erzeugen: node scripts/generate-farbwelten-data.cjs
//
// Texte sind Redaktionsinhalt und werden ausschließlich mit textContent
// gerendert (siehe js/modules/farbwelten.js). Inline-Formatierung:
// **fett**, *kursiv*, [Text](url) — keine HTML-Fragmente.
`;

  const body = [
    banner,
    `export const SOURCES = ${JSON.stringify(sourceObject, null, 2)};`,
    '',
    `export const SECTION_ORDER = ${JSON.stringify(SECTION_ORDER, null, 2)};`,
    '',
    `export const FARBWELTEN = ${JSON.stringify(worlds, null, 2)};`,
    '',
    `export const LANDING = ${JSON.stringify(landingPage, null, 2)};`,
    '',
    `export const CHAKREN_PAGE = ${JSON.stringify(chakrenPage, null, 2)};`,
    '',
    `export const LIGHT_PAGE = ${JSON.stringify(lightPage, null, 2)};`,
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body, 'utf8');

  const bytes = fs.statSync(target).size;
  console.log(`js/data/farbwelten.js geschrieben (${(bytes / 1024).toFixed(1)} KB)`);
  for (const report of reports) {
    const mapped = report.mapped
      .filter((entry) => entry.key)
      .map((entry) => `${entry.heading} → ${entry.key}`)
      .join('; ');
    console.log(`  ${report.id}: ${mapped}`);
    for (const entry of report.dropped) console.log(`    ausgelassen (${entry.reason}): ${entry.heading}`);
  }
  console.log(`Quellen im Register: ${Object.keys(sourceObject).length}`);
  console.log(`Farbwelten: ${worlds.length}, Abschnitte je Seite: ${SECTION_ORDER.length}`);
  if (worlds.length !== COLOR_FILES.length)
    throw new Error(`Es müssen ${COLOR_FILES.length} Farbwelten sein, erzeugt wurden ${worlds.length}.`);
}

main();
