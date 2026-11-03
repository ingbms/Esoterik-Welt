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

const COLOR_FILES = ['rot', 'orange', 'gelb', 'gruen', 'blau', 'indigo', 'violett'];

// Verbindliche Wellenlängenbereiche aus docs/farbwelten-konzept/02 §10 und
// mockup/index.html. Grenzen sind konventionelle Näherungen.
const WAVELENGTHS = {
  rot: [620, 750],
  orange: [590, 620],
  gelb: [570, 590],
  gruen: [490, 570],
  blau: [450, 490],
  indigo: [425, 450],
  violett: [380, 425],
};

// Einordnung der Seite als Spektralbereich. Magenta u. Ä. sind nicht Teil
// dieser Ausbaustufe (docs/farbwelten-konzept/03 §5).
const SPECTRAL = {
  rot: true,
  orange: true,
  gelb: true,
  gruen: true,
  blau: true,
  indigo: true,
  violett: true,
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
  blau: 'Kommunikation, Ruhe und Ausdruck',
  indigo: 'Intuition',
  violett: 'Spiritualität',
};

const RESEARCH_CLAIM = {
  rot: 'Photobiomodulation mit rotem bis nahinfrarotem Licht ist bei einzelnen Indikationen untersucht — mit niedriger bis moderater Evidenzsicherheit.',
  orange:
    'Photobiomodulation arbeitet mit rotem bis nahinfrarotem Licht; für Orange als eigene medizinische Wellenlänge gibt es kein Protokoll.',
  gelb: 'Photobiomodulation arbeitet mit rotem bis nahinfrarotem Licht; Gelb spielt in medizinischen Protokollen keine eigene Rolle.',
  gruen:
    'Photobiomodulation arbeitet mit rotem bis nahinfrarotem Licht; für Grün gibt es kein eigenes medizinisches Protokoll.',
  blau: 'Untersucht ist die Rolle von Blaulicht für die innere Uhr und, bei hoher Dosis, Retina und Rhythmus; ein Heilverfahren „Blau“ gibt es nicht.',
  indigo:
    'Für Indigo existiert kein medizinisches Lichtprotokoll; Indigo ist ein fließender Übergang zwischen Blau und Violett.',
  violett:
    'Für Violett existiert kein medizinisches Lichtprotokoll; UV-Strahlung liegt außerhalb des sichtbaren Bereichs.',
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
};

const META_PAGES = {
  landing: {
    title: 'Farbwelten — Bedeutung, Physik und Tradition der Farben | Esoterik-Welt',
    description:
      'Sieben Farbwelten zwischen Licht, Wahrnehmung und Tradition: Wellenlängen, Assoziationen, Chakren und Forschungsstand differenziert erklärt.',
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

// ---------------------------------------------------------------------------
// P2-Werkzeuge (FW-12): Farben-Kompass, Farbmeditation, Zeitleiste.
//
// Diese Konstanten sind hier kuratiert, weil sie nicht aus den Redaktions-
// dateien stammen: Sie fassen bereits belegte Aussagen der Farbseiten zusammen
// und verweisen ausschließlich auf Nummern des Registers. Der Generator prüft
// beim Lauf, dass jede genannte Nummer existiert (assertSources).
// ---------------------------------------------------------------------------

const TOOL_META = {
  kompass: {
    title: 'Farben-Kompass — Assoziation, Tradition und Einordnung | Esoterik-Welt',
    description:
      'Sieben Farbwelten vergleichen: häufige Assoziationen, kulturelle Varianten, traditionelle Bedeutung und Forschungsstand — ohne Diagnose.',
  },
  meditation: {
    title: 'Farbmeditation — ruhige Visualisierungsübung | Esoterik-Welt',
    description:
      'Farbmeditation als ruhige Visualisierungsübung: Farbwelt wählen, Dauer einstellen, bewusst starten. Ohne Musik, ohne Blinken, ohne Datenspeicherung.',
  },
  timeline: {
    title: 'Zeitleiste — Farbforschung, Chromotherapie und Lichtmedizin | Esoterik-Welt',
    description:
      'Belegte Stationen von 1577 bis 2025: Chakra-Geschichte, Farbpsychologie, Chromotherapie und Lichtmedizin — jedes Ereignis mit Quelle.',
  },
};

// Häufige Assoziationen und kulturelle Varianten: verdichtete Aussagen aus den
// Farbpsychologie-Abschnitten der Farbseiten [3][4]. Keine Wirkaussage.
const COMPASS_ASSOCIATIONS = {
  rot: ['Erregung', 'Aufmerksamkeit', 'Gefahr oder Leidenschaft (in vielen Kulturen)'],
  orange: ['Begeisterung', 'Spaß', 'Lebensfreude'],
  gelb: ['Freude', 'Optimismus', 'Energie'],
  gruen: ['Ruhe', 'Ausgewogenheit', 'Naturverbundenheit'],
  blau: ['Ruhe', 'Vertrauen', 'Konzentration'],
  indigo: ['Ruhe (Blautöne)', 'Vertrauen (Blautöne)'],
  violett: ['bestärkend („purple“)'],
};

const COMPASS_CULTURE = {
  rot: 'In vielen Kulturen mit Gefahr oder Leidenschaft verbunden; die Assoziation ist robust, aber kulturabhängig [3][4].',
  orange: 'Westlich oft Energie und Freundlichkeit; in anderen Kontexten Warnung, etwa auf Verkehrsschildern [3][4].',
  gelb: 'In manchen Kulturen Glück, in anderen Vorsicht [4].',
  gruen: 'Interkulturell ähnlich, aber die Varianz zwischen Kulturen ist bei Grün besonders ausgeprägt [4].',
  blau: 'Ruhe und Vertrauen erscheinen interkulturell ähnlich; die Varianz zwischen Probandengruppen bleibt hoch [4].',
  indigo:
    'Keine eigene emotionale Kategorie in der Forschung; Deutungen stammen aus Blautönen oder aus kultureller Tradition [3][4].',
  violett:
    '„Purple“ erscheint in der Forschung als eigene Kategorie; spektrales Violett wird davon nicht getrennt untersucht [3][4].',
};

const COMPASS_HINTS = {
  indigo: 'Indigo wird in den großen Reviews nicht als eigene emotionale Kategorie geführt.',
  violett: 'Für spektrales Violett gibt es keine eigene emotionale Kategorie in der Forschung.',
};

const COMPASS = {
  title: 'Farben-Kompass',
  seoTitle: TOOL_META.kompass.title,
  meta: TOOL_META.kompass,
  lede: 'Farben sind mit Emotionen assoziiert — über Kulturen hinweg ähnlich, aber nicht identisch [3][4]. Der Kompass stellt diese Assoziationen neben die Tradition und den Forschungsstand. Er ist kein Test, keine Typologie und keine Diagnose.',
  note: 'Assoziationen beschreiben, wie Farben in Studien und Kulturen verstanden werden — nicht, was eine Farbe über eine Person aussagt. Eine medizinische Wirkung von Farben als Behandlung ist nicht belegt [3][9].',
  worlds: Object.fromEntries(
    Object.keys(COMPASS_ASSOCIATIONS).map((id) => [
      id,
      {
        associations: COMPASS_ASSOCIATIONS[id],
        kulturell: COMPASS_CULTURE[id],
        hinweis: COMPASS_HINTS[id] || null,
        quellen: ['3', '4'],
      },
    ])
  ),
  sources: ['1', '2', '3', '4', '9'],
};

const MEDITATION = {
  title: 'Farbmeditation',
  seoTitle: TOOL_META.meditation.title,
  meta: TOOL_META.meditation,
  lede: 'Eine ruhige Visualisierungsübung mit einer Farbe Ihrer Wahl. Wählen Sie eine Farbwelt und eine Dauer zwischen einer und zwanzig Minuten; gestartet wird nur auf Ihren Klick.',
  einordnung:
    'Entspannungs- und Visualisierungsübung, keine Behandlung. Es gibt keine Musik, kein Blinken und keinen Autoplay; die Übung speichert keine personenbezogenen Daten.',
  ablauf: [
    'Bequem sitzen und ruhig atmen.',
    'Die Farbfläche betrachten, ohne ein Ergebnis zu erwarten.',
    'Jederzeit über „Beenden“ abbrechen.',
  ],
  reflexionHinweis: 'Optional: Notieren Sie nach der Übung eine Beobachtung — ohne sie zu deuten.',
  dauer: { min: 1, max: 20, default: 5, step: 1 },
  disclaimer: HEALTH_NOTE,
  sources: ['9'],
};

const TIMELINE = {
  title: 'Zeitleiste der Farbforschung',
  seoTitle: TOOL_META.timeline.title,
  meta: TOOL_META.timeline,
  lede: 'Jede Station ist mindestens einer Quelle aus dem Register dieser Sektion zugeordnet: Chakra-Geschichte, Farbpsychologie, Chromotherapie, Lichtmedizin und Farbmetrik.',
  hinweis:
    'Aufgenommen sind nur Ereignisse, die im Quellenregister belegt sind. Für ältere Farbtheorien liegt hier keine eigene Quelle vor; sie werden deshalb nicht datiert aufgeführt.',
  fallback:
    'Die Liste ist chronologisch geordnet und vollständig. Die Filterleiste blendet lediglich Einträge aus; sie ist keine Voraussetzung, um die Zeitleiste zu lesen.',
  strands: [
    { id: 'chakra', label: 'Chakra-Geschichte' },
    { id: 'psychologie', label: 'Farbpsychologie' },
    { id: 'chromotherapie', label: 'Chromotherapie' },
    { id: 'lichtmedizin', label: 'Lichtmedizin' },
    { id: 'spektrum', label: 'Spektrum & Farbmetrik' },
  ],
  events: [
    {
      year: 1577,
      label: '1577',
      strand: 'chakra',
      title: 'Sat-cakra-nirupana',
      text: 'Der klassische Text beschreibt sechs Zentren und das Sahasrāra; zugeordnet werden Element- und Lotosfarben, keine Regenbogenfolge.',
      sources: ['1', '2'],
    },
    {
      year: 1919,
      label: '1919',
      strand: 'chakra',
      title: 'Woodroffe/Avalon: The Serpent Power',
      text: 'Die westliche Übersetzung wird zur Autoritätsquelle für fast alle späteren Chakratexte.',
      sources: ['2'],
    },
    {
      year: 1920,
      label: '1920er',
      strand: 'chakra',
      title: 'Theosophie und westliche Esoterik',
      text: 'Theosophie und westliche Esoterik entwickeln Farbzuordnungen zu den Zentren.',
      sources: ['1'],
    },
    {
      year: 1977,
      label: '1977',
      strand: 'chakra',
      title: 'Regenbogen-Chakramodell',
      text: 'Das Modell mit sieben Farben von Rot bis Violett erscheint in dieser Kombination.',
      sources: ['1'],
    },
    {
      year: 2000,
      label: '2000',
      strand: 'spektrum',
      title: 'Color Science (Wyszecki & Stiles)',
      text: 'Das Standardwerk zur Farbmetrik beschreibt Metamerie und die Grenzen der Farbmessung.',
      sources: ['31'],
    },
    {
      year: 2011,
      label: '2011',
      strand: 'lichtmedizin',
      title: 'Leitlinie zur Neonaten-Phototherapie',
      text: 'Die Leitlinie beschreibt Phototherapie zur Vorbeugung schwerer Hyperbilirubinämie bei Neugeborenen ab 35 Wochen.',
      sources: ['17'],
    },
    {
      year: 2019,
      label: '2019',
      strand: 'lichtmedizin',
      title: 'Leitlinie zur Psoriasis-Phototherapie',
      text: 'Die gemeinsame Leitlinie bewertet NB-UVB-Phototherapie bei Psoriasis.',
      sources: ['18'],
    },
    {
      year: 2019,
      label: '2019',
      strand: 'lichtmedizin',
      title: 'Cochrane-Review zur Prävention',
      text: 'Zur Vorbeugung bei SAD-Vorgeschichte stützt sich die Review auf eine geeignete Studie mit 46 Teilnehmenden; die Evidenz ist sehr unsicher.',
      sources: ['11'],
    },
    {
      year: 2019,
      label: '2019',
      strand: 'lichtmedizin',
      title: 'ANSES-Bewertung zu Blaulicht und LED',
      text: 'Die Bewertung ordnet Blaulicht-Risiken nach Dosis und Expositionszeitpunkt ein.',
      sources: ['14'],
    },
    {
      year: 2020,
      label: '2020',
      strand: 'psychologie',
      title: 'Farb-Emotionen über 64 Länder',
      text: 'Die Studie zeigt: Assoziationen sind interkulturell ähnlich, aber durch Sprache und geografische Nähe geprägt.',
      sources: ['4'],
    },
    {
      year: 2020,
      label: '2020',
      strand: 'psychologie',
      title: 'Meta-Analyse zum Rot-Effekt',
      text: 'Für einen Effekt roter Farbe auf kognitive Leistung findet die Meta-Analyse keine belastbare Evidenz.',
      sources: ['7'],
    },
    {
      year: 2020,
      label: '2020',
      strand: 'chromotherapie',
      title: 'Farbwahrnehmung und Farbtherapie',
      text: 'Die Untersuchung zeigt, dass Entspannungseffekte auch ohne sichtbare Farbe auftreten können.',
      sources: ['5'],
    },
    {
      year: 2020,
      label: '2020',
      strand: 'lichtmedizin',
      title: 'Meta-Analyse zur SAD-Lichttherapie',
      text: '19 Studien, SMD −0,37 (95 %-CI −0,63 bis −0,12); Heterogenität und Verzerrungsrisiko bleiben Grenzen.',
      sources: ['15'],
    },
    {
      year: 2023,
      label: '2023',
      strand: 'lichtmedizin',
      title: 'IARC-Monographie zu optischer Strahlung',
      text: 'UV-Strahlung wird als Gruppe-1-Karzinogen geführt.',
      sources: ['19'],
    },
    {
      year: 2025,
      label: '2025',
      strand: 'psychologie',
      title: 'Systematische Review über 128 Jahre',
      text: '132 Studien, 42.266 Personen und 64 Länder: Farb-Emotions-Assoziationen sind robust — aber Assoziationen.',
      sources: ['3'],
    },
    {
      year: 2025,
      label: '2025',
      strand: 'chromotherapie',
      title: 'OSTEBA-HTA zur Chromotherapie',
      text: 'Für Chromotherapie als Krankheitsbehandlung fand die Bewertung keine geeignete randomisierte Studie oder systematische Review und stufte sie als Pseudotherapie ein.',
      sources: ['9'],
    },
    {
      year: 2025,
      label: '2025',
      strand: 'lichtmedizin',
      title: 'Umbrella-Review zur Photobiomodulation',
      text: 'Photobiomodulation ist bei einzelnen Indikationen untersucht — mit niedriger bis moderater Evidenzsicherheit.',
      sources: ['10'],
    },
  ].sort((a, b) => a.year - b.year),
  sources: ['1', '2', '3', '4', '5', '7', '9', '10', '11', '14', '15', '17', '18', '19', '31'],
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

  for (const id of COLOR_FILES) {
    const { parsed, document } = documents.get(id);
    const { sections, mapped } = mapSections(document, id);

    const [min, max] = WAVELENGTHS[id];
    const frequency = frequencies([min, max]);
    const photonEv = photonEnergies([min, max]);

    // Abschnitt A: Farbfläche, Nuancen, Wellenlängenbereich und Einordnung.
    // Der erste Einstiegsabsatz steht als Lede im Seitenkopf (IA §5 A, §6).
    const introBlocks = document.intro.filter((block) => block.type === 'p');
    const lede = introBlocks[0]?.text || parsed.data.description || '';
    sections.erleben = [
      { type: 'swatch' },
      {
        type: 'facts',
        rows: [
          ['Wellenlängenbereich', `${min}–${max} nm`],
          ['Einordnung', SPECTRAL[id] ? 'Spektralfarbe im sichtbaren Bereich' : 'Mischfarbe'],
        ],
      },
      ...introBlocks.slice(1),
    ];

    sections.physik = [
      {
        type: 'facts',
        rows: [
          ['Wellenlängenbereich', `${min}–${max} nm (konventionelle Näherung)`],
          ['Frequenz', frequency.label],
          ['Photonenenergie', `ca. ${photonEv.label}`],
          ['Entstehung', SPECTRAL[id] ? 'Spektralfarbe innerhalb des sichtbaren Bereichs' : 'Mischfarbe'],
        ],
      },
      {
        type: 'p',
        text: 'Die Grenzen zu den Nachbarfarben sind konventionell und fließend. Ein Bildschirm erzeugt Metamere, kein monochromatisches Licht der angegebenen Wellenlänge [24][31].',
      },
    ];

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
      traditionTitle: `${document.title} und das ${id === 'rot' ? 'Wurzelchakra' : 'zu geordnete Zentrum'}`,
      traditionText: `In der Tradition steht ${document.title} für ${TRADITION_CLAIM[id]}. Die Regenbogenzuordnung der Chakren ist eine moderne Zusammenführung; sie erscheint in dieser Kombination erst 1977 [1][2].`,
      traditionChips: ['Deutungstradition'],
      researchTitle: 'Was tatsächlich untersucht ist',
      researchText: RESEARCH_CLAIM[id],
      researchChips: ['Empirie begrenzt'],
      note: COMPARE_NOTE,
    };

    if (!sections.anwendung.some((block) => block.type === 'quote' && /medizin/i.test(block.text))) {
      sections.anwendung.push({ type: 'quote', text: HEALTH_NOTE });
    }

    const allText = JSON.stringify({ intro: document.intro, sections });
    const cited = collectSourceIds(allText).sort((a, b) => Number(a) - Number(b));
    const sources = cited.filter((sourceId) => sourceRegistry.has(sourceId));
    const shortRefs = cited.filter((sourceId) => !sourceRegistry.has(sourceId));

    worlds.push({
      id,
      name: document.title,
      spectral: SPECTRAL[id],
      wavelength: { min, max, label: `${min}–${max} nm` },
      frequency,
      photonEv,
      chakra:
        id === 'rot'
          ? 'root'
          : id === 'orange'
            ? 'sacral'
            : id === 'gelb'
              ? 'solar'
              : id === 'gruen'
                ? 'heart'
                : id === 'blau'
                  ? 'throat'
                  : id === 'indigo'
                    ? 'third-eye'
                    : 'crown',
      summary: parsed.data.description || '',
      seoTitle: parsed.data.title || document.title,
      meta: META[id],
      lede,
      intro: introBlocks,
      sections,
      compare,
      sources,
      shortRefs,
      related: ['chakren', 'lichtfrequenzen', 'crystals'],
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

function assertToolSources(name, payload, sourceObject) {
  const text = JSON.stringify(payload);
  const cited = [...new Set([...text.matchAll(/\[(\d{1,2})\]/g)].map((match) => match[1]))];
  const missing = cited.filter((id) => !sourceObject[id]);
  if (missing.length)
    throw new Error(`${name}: Quellen ohne Registereintrag: ${missing.map((id) => `[${id}]`).join(' ')}`);
  for (const id of payload.sources || []) {
    if (!sourceObject[id]) throw new Error(`${name}: Quelle [${id}] fehlt im Register`);
  }
}

function assertTimeline() {
  const strands = new Set(TIMELINE.strands.map((strand) => strand.id));
  let previous = -Infinity;
  for (const event of TIMELINE.events) {
    if (!strands.has(event.strand)) throw new Error(`Zeitleiste: unbekannter Strang „${event.strand}“`);
    if (!event.sources.length) throw new Error(`Zeitleiste: Ereignis ohne Quelle: ${event.title}`);
    if (event.year < previous) throw new Error(`Zeitleiste: nicht chronologisch bei „${event.title}“`);
    previous = event.year;
  }
}

function main() {
  const { worlds, sourceRegistry, reports, landingDoc } = buildColors();
  const landingPage = buildLanding(landingDoc, worlds);
  const chakrenPage = buildChakrenPage(worlds.map((world) => world.id));
  const lightPage = buildLightPage();

  const sourceObject = Object.fromEntries(
    [...sourceRegistry.values()].sort((a, b) => Number(a.id) - Number(b.id)).map((entry) => [entry.id, entry])
  );

  assertToolSources('COMPASS', COMPASS, sourceObject);
  assertToolSources('MEDITATION', MEDITATION, sourceObject);
  assertToolSources('TIMELINE', TIMELINE, sourceObject);
  assertTimeline();
  for (const id of Object.keys(COMPASS.worlds)) {
    if (!worlds.some((world) => world.id === id)) throw new Error(`Kompass: unbekannte Farbwelt ${id}`);
  }

  const banner = `// AUTO-GENERATED — nicht von Hand bearbeiten.
// Quelle: content/farbwelten/*.md (Redaktionsstand Task 3)
// Erzeugt von scripts/generate-farbwelten-data.cjs.
// Neu erzeugen: node scripts/generate-farbwelten-data.cjs
//
// COMPASS, MEDITATION und TIMELINE sind kuratierte Konstanten des Generators:
// Sie fassen bereits belegte Aussagen der Farbseiten zusammen und verweisen
// ausschließlich auf Nummern des Registers (Prüfung beim Erzeugen).
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
    `export const COMPASS = ${JSON.stringify(COMPASS, null, 2)};`,
    '',
    `export const MEDITATION = ${JSON.stringify(MEDITATION, null, 2)};`,
    '',
    `export const TIMELINE = ${JSON.stringify(TIMELINE, null, 2)};`,
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
  if (worlds.length !== 7) throw new Error('Es müssen sieben Farbwelten sein.');
}

main();
