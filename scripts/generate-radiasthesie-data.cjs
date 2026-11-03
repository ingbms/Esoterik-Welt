// Erzeugt js/data/radiasthesie.js aus den redaktionellen Markdown-Quellen.
//
// Quelle der Wahrheit sind die freigegebenen Texte unter
// docs/radiasthesie-konzept/inhalte/. Dieses Skript parst sie in eine
// strukturierte Form (Abschnitte, Blöcke, Evidenzstufen, Glossar, Quellen),
// damit die Ansichten in js/modules/radiasthesie-views.js reine Funktionen
// bleiben und in Node ohne Browser geprüft werden können (tests/radiasthesie.mjs).
//
// Bewusst konservativ: Es werden nur die tatsächlich verwendeten Markdown-
// Elemente unterstützt (H1/H2, Absätze, Listen, Blockzitate, Fett, Kursiv,
// Quellenmarker [Qxx], Tabellen im Quellenverzeichnis). Alles andere bricht
// den Lauf mit einer Meldung ab, statt still etwas zu verlieren.
//
// Aufruf: node scripts/generate-radiasthesie-data.cjs

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'docs/radiasthesie-konzept/inhalte');
const sourcesFile = path.join(root, 'docs/radiasthesie-konzept/recherche/quellen.json');
const taxonomieFile = path.join(root, 'docs/radiasthesie-konzept/daten/taxonomie.json');
const contractFile = path.join(root, 'js/modules/radiasthesie-vertraege.js');
const outputFile = path.join(root, 'js/data/radiasthesie.js');
const UPDATED = '2026-11-02';

// --- Themenkonfiguration ---------------------------------------------------
// Feste Oberflächentexte, die nicht im Fließtext der Quellen stehen: kurzer
// Seitentitel (der Markdown-H1 bleibt der SEO-Titel), Untertitel, Metazeile
// und Instrumententafel. Alle inhaltlichen Aussagen kommen aus den Markdown-
// Dateien; hier stehen nur Beschriftungen und Bildtexte.
const TOPICS = [
  {
    slug: 'radiasthesie',
    file: 'radiaesthesie.md',
    title: 'Radiästhesie',
    eyebrow: 'Radiästhesie · Instrument und Geste',
    subtitle: 'Oberbegriff für Ruten- und Pendelpraxis',
    metaLine: 'Thema 1 · Instrument',
    status:
      'Die beschriebenen Anzeigen sind nicht naturwissenschaftlich belegt. Der Ausschlag von Rute und Pendel lässt sich durch unwillkürliche Handbewegungen erklären; blinde Feldtests erbrachten keine Treffer über dem Zufall.',
    cardText:
      'Rute, Winkelrute und Biotensor: wie sie geführt werden, welche Formen überliefert sind und was Feldversuche dazu ergeben haben.',
    facts: ['Rute, Winkelrute, Biotensor', 'Geschichte seit dem Bergbau', 'Feldtests und Ideomotorik'],
    figure: {
      src: 'assets/radiasthesie/winkelrute.svg',
      alt: 'Schematische Aufsicht einer Winkelrute: zwei Ruten laufen vom Griffpunkt im Winkel von etwa 40 Grad auseinander.',
      caption:
        'Winkelrute in Aufsicht. Der Winkel zwischen den Ruten wird als Ausschlag gedeutet — eigene Zeichnung, keine Messung.',
    },
    sections: [
      'was',
      'geschichte-1',
      'geschichte-2',
      'geschichte-3',
      'instrumente',
      'erdstrahlen',
      'geologie',
      'bovis',
      'einordnung',
    ],
    seoTitle: 'Radiästhesie — Ruten, Geschichte und Forschungsstand',
    seoDescription:
      'Radiästhesie: Begriffsgeschichte, Instrumente, Erdstrahlen und Forschungsstand — mit Evidenzstufen A–E und offenem Datierungskonflikt.',
  },
  {
    slug: 'pendeln',
    file: 'pendeln.md',
    title: 'Pendeln',
    eyebrow: 'Pendeln · Praxis und Mechanik',
    subtitle: 'Frage, Eichung, Antwort — und was die Mechanik erklärt',
    metaLine: 'Thema 2 · Praxis',
    status:
      'Ein Pendel bewegt sich — aber nicht durch verborgene Information. Carpenter-, Kohnstamm-Effekt und Chevreul-Täuschung erklären die Bewegung; kontrollierte Tests zeigen keine Abweichung vom Zufall.',
    cardText:
      'Pendelarten, Materialien, Tafeln und Skalen. Woher die Bovis-Skala kommt, warum sie keine SI-Einheit ist und wie ein Pendel mechanisch schwingt.',
    facts: ['Pendelarten und Materialien', 'Pendeltafeln und Bovis-Skalen', 'Pendellabor und Tafel-Studio'],
    figure: {
      src: 'assets/radiasthesie/pendeltafel.svg',
      alt: 'Schematische Pendeltafel mit zwölf Segmenten: links JA, rechts NEIN, dazwischen die Ziffern 1 bis 10.',
      caption:
        'Pendeltafel als Ordnungsschema. Die Bedeutung der Segmente wird vorher festgelegt — die Tafel misst nichts.',
    },
    sections: [
      'was',
      'geschichte',
      'arten',
      'lernen',
      'tafeln',
      'biotensor',
      'karten',
      'mechanismen',
      'forschung',
      'labor',
      'einordnung',
    ],
    seoTitle: 'Pendeln — Arten, Materialien, Tafeln und Bovis-Skalen',
    seoDescription:
      'Pendeln: Geschichte seit 371 n. Chr., Arten, Antwortkonventionen und Mechanik — kontrollierte Tests und offene Fragen, ohne Wirkungsversprechen.',
  },
  {
    slug: 'orakel',
    file: 'orakel.md',
    title: 'Orakel',
    eyebrow: 'Orakel · Zeichen und Deutung',
    subtitle: 'Tarot, I Ging, Runen und Delphi — Geschichte und Grenzen',
    metaLine: 'Thema 3 · Deutung',
    status:
      'Orakel sind Kulturphänomene, keine Messinstrumente. Tarot, I Ging und Runen haben belegbare Geschichten; eine Prognosefähigkeit ist nicht nachgewiesen, der Forer-Effekt erklärt die gefühlte Treffsicherheit.',
    cardText:
      'Vom Pendelorakel zu Tarot, Runen und I Ging: was mantische Verfahren verbindet, was sie unterscheidet und welche Erklärungen es für ihre Wirkung gibt.',
    facts: ['Pendel- und Tafelorakel', 'Tarot, Runen, I Ging', 'Psychologische Erklärungen'],
    figure: {
      src: 'assets/radiasthesie/orakel-karten.svg',
      alt: 'Drei gefächerte Karten mit Kreis, Dreieck und Linien als abstrakte Zeichen für Bild- und Zeichenorakel.',
      caption: 'Abstrakte Kartenzeichen. Die Zeichnung zeigt die Form, nicht eine Deutung.',
    },
    sections: [
      'divination',
      'tarot-1',
      'tarot-2',
      'tarot-3',
      'iging',
      'iging-west',
      'runen',
      'runen-20',
      'orakelkarten',
      'delphi',
      'delphi-ethylen',
      'forer',
      'einordnung',
    ],
    seoTitle: 'Orakel — Pendelorakel, Tarot, Runen und I Ging im Vergleich',
    seoDescription:
      'Orakel: Tarot seit den 1440ern, I Ging, Runen und Delphi — Geschichte, Praxis und Forschungslage, ohne Prognoseversprechen.',
  },
];

// Die fünf Stufen sind Pflicht (Auftrag §3). Kurzlabel aus dem Design,
// Langfassung aus dem redaktionellen Einstiegstext.
const LEVEL_LABELS = {
  A: 'Historisch',
  B: 'Tradition',
  C: 'Hypothese',
  D: 'Befund',
  E: 'Widerlegt',
};

const EVALUATION = {
  title: 'Radiästhesie, Pendeln und Orakel',
  eyebrow: 'Themenmodul · Instrumente und Deutung',
  lead: 'Wie Rute, Pendel und Tafel gedeutet werden, was darüber dokumentiert ist — und wo die Grenze zwischen Erfahrung und Beleg verläuft.',
  status:
    'Alle Verfahren dieses Bereichs stammen aus Tradition und Anwenderberichten. Eine physikalische Wirkung ist nicht belegt; kontrollierte Tests fanden keine Treffer über dem Zufall. Jede Aussage ist nach Herkunft und Prüfstand gekennzeichnet.',
  seoTitle: 'Radiästhesie, Pendeln und Orakel — Tradition und Prüfstand',
  seoDescription:
    'Radiästhesie, Pendeln und Orakel: Instrumente, Geschichte und Forschungsstand — mit Kennzeichnung von Tradition und Befund, ohne Wirkungsversprechen.',
};

const WORKSHOP = [
  {
    title: 'Pendellabor',
    text: 'Länge, Auslenkung und Dämpfung einstellen; Schwingungsdauer ablesen und mit der Formel vergleichen.',
    state: 'Verfügbar',
    href: '#pendeln/labor',
  },
  {
    title: 'Pendeltafel-Studio',
    text: 'Tafeln beschriften, Farbstil wählen, als SVG oder Druckvorlage ausgeben.',
    state: 'Verfügbar',
    href: '#pendeln/studio',
  },
  {
    title: 'Experimentierlabor',
    text: 'Verblindete Testreihe mit festgelegtem Ziel, Zufallserwartung, Konfidenzintervall und Rohdatenexport.',
    state: 'Verfügbar',
    href: '#pendeln/experiment',
  },
];

const RELATED = [
  {
    type: 'Deutung',
    title: 'Tarot',
    href: '#tarot',
    text: 'Bildkarten und Legesysteme. Eigene Symbolsprache, eigene Geschichte.',
  },
  {
    type: 'System',
    title: 'Astrologie',
    href: '#astrologie',
    text: 'Tierkreiszeichen, Faktoren und Aspekte — mit eigener Evidenzdebatte.',
  },
  {
    type: 'Material',
    title: 'Kristalle',
    href: '#crystals',
    text: 'Mineralien, Farben und überlieferte Zuordnungen, ohne Heilversprechen.',
  },
];

// --- Hilfen ---------------------------------------------------------------

function fail(message) {
  const error = new Error(message);
  error.reported = true;
  console.error('FEHLER: ' + message);
  process.exitCode = 1;
  throw error;
}

function parseFrontmatter(raw, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(raw);
  if (!match) fail(`${file}: kein YAML-Frontmatter gefunden`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    meta[kv[1]] = kv[2].replace(/^"|"$/g, '');
  }
  return { meta, body: raw.slice(match[0].length) };
}

// Redaktionelle Fußnoten (SEO-Notizen, Nutzungshinweise) gehören nicht auf die
// Seite. Sie stehen in den Quellen als letzte kursive Absätze.
const EDITORIAL_FOOTER = /^\*(SEO|Hinweis zur Nutzung|SEO-Metadaten)[\s\S]*$/m;

function stripEditorialFooters(body) {
  return body
    .replace(EDITORIAL_FOOTER, '')
    .replace(/\n---\s*$/, '')
    .trim();
}

/**
 * Zerlegt einen Abschnittstext in Blöcke. Unterstützt genau die Formen, die in
 * den Quellen vorkommen; alles andere ist ein Fehler.
 */
function toBlocks(text, context, { skipTables = false } = {}) {
  const blocks = [];
  const chunks = text
    .split(/\r?\n\s*\r?\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    if (/^-{3,}$/.test(chunk)) continue;
    const lines = chunk.split(/\r?\n/).map((line) => line.trim());
    if (lines.every((line) => line.startsWith('- '))) {
      blocks.push({ type: 'ul', items: lines.map((line) => line.slice(2).trim()) });
      continue;
    }
    if (lines.every((line) => line.startsWith('> '))) {
      blocks.push({
        type: 'callout',
        paragraphs: lines.map((line) => line.slice(2).trim()).filter(Boolean),
      });
      continue;
    }
    if (lines.some((line) => line.startsWith('|'))) {
      // Tabellen sind nur im redaktionellen Einstiegstext bekannt; dort wird
      // die Tabelle nicht gerendert. Im Artikeltext wäre sie ein Fehler.
      if (skipTables) continue;
      fail(`${context}: unerwartete Tabelle im Fließtext`);
    }
    // Mehrzeilige Absätze sind im Markdown weiche Umbrüche.
    blocks.push({ type: 'p', text: lines.join(' ') });
  }
  return blocks;
}

function sectionTitle(raw) {
  // "1. Was ist Radiästhesie? (A/B)" → { number, title, chips }
  // Die Stufe steht als letzte Klammergruppe, kann aber von einer
  // Zeitangabe gefolgt sein ("(A) — bis 1700"). Deshalb wird die letzte
  // gültige Stufenklammer entfernt und der Rest unverändert als Titel
  // übernommen — Gedankenstriche im Titel bleiben so erhalten.
  const match = /^(\d+)\.\s+(.+)$/.exec(raw);
  if (!match) fail(`Abschnittsüberschrift nicht lesbar: ${raw}`);
  let title = match[2].trim();
  let chips = [];
  const groups = [...title.matchAll(/\(([A-E](?:\s*\/\s*[A-E])*)\)/g)];
  const last = groups[groups.length - 1];
  if (last) {
    chips = last[1].split('/').map((value) => value.trim());
    title = `${title.slice(0, last.index)}${title.slice(last.index + last[0].length)}`.replace(/\s{2,}/g, ' ').trim();
  }
  return { number: Number(match[1]), title, period: '', chips };
}

function parseTopic(source) {
  const { meta, body } = parseFrontmatter(source, 'topic');
  const lines = stripEditorialFooters(body).split(/\r?\n/);

  let heading = '';
  const sections = [];
  let current = null;
  let buffer = [];

  const flush = () => {
    if (!current) return;
    current.blocks = toBlocks(buffer.join('\n'), current.title);
    sections.push(current);
    buffer = [];
  };

  for (const line of lines) {
    if (/^#\s+/.test(line)) {
      heading = line.replace(/^#\s+/, '').trim();
      continue;
    }
    if (/^##\s+/.test(line)) {
      flush();
      const parsed = sectionTitle(line.replace(/^##\s+/, '').trim());
      current = { ...parsed, text: [] };
      continue;
    }
    if (!current) continue;
    buffer.push(line);
  }
  flush();

  return { meta, heading, sections };
}

function wordsIn(blocks) {
  const text = blocks
    .map((block) =>
      block.type === 'ul' ? block.items.join(' ') : block.type === 'callout' ? block.paragraphs.join(' ') : block.text
    )
    .join(' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[*_`#]/g, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

function firstParagraph(sections) {
  for (const section of sections) {
    const paragraph = section.blocks.find((block) => block.type === 'p' && block.text.length > 80);
    if (paragraph) return paragraph.text;
  }
  fail('kein einleitender Absatz gefunden');
}

function metaDescription(value, max = 158) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).replace(/[,;:.–—-]$/, '')}…`;
}

// --- Einstiegstext --------------------------------------------------------

function parseIntroduction(source) {
  const { meta, body } = parseFrontmatter(source, 'modul-einstieg.md');
  const text = stripEditorialFooters(body);
  const sections = [];
  let current = null;
  let buffer = [];
  const flush = () => {
    if (!current) return;
    current.blocks = toBlocks(buffer.join('\n'), current.title, { skipTables: true });
    sections.push(current);
    buffer = [];
  };
  for (const line of text.split(/\r?\n/)) {
    if (/^#\s+/.test(line)) continue;
    if (/^##\s+/.test(line)) {
      flush();
      const parsed = sectionTitle(line.replace(/^##\s+/, ''));
      current = { ...parsed, text: [] };
      continue;
    }
    if (!current) continue;
    buffer.push(line);
  }
  flush();
  return { meta, sections };
}

function levelsFromIntro(intro) {
  const section = intro.sections.find((entry) => /Evidenzklassen/.test(`${entry.title} ${entry.period || ''}`));
  if (!section) fail('Evidenzklassen-Abschnitt im Einstiegstext fehlt');
  const list = section.blocks.find((block) => block.type === 'ul');
  if (!list) fail('Evidenzklassen-Liste fehlt');
  return list.items.map((item) => {
    const match = /^\*\*([A-E]) — (.+?)\*\* \((.+)\)$/.exec(item);
    if (!match) fail('Evidenzklasse nicht lesbar: ' + item.slice(0, 40));
    return {
      key: match[1],
      label: LEVEL_LABELS[match[1]],
      definition: match[2],
      examples: match[3],
    };
  });
}

function openQuestionsFromIntro(intro) {
  const section = intro.sections.find((entry) => /offen bleibt/i.test(entry.title));
  if (!section) fail('Abschnitt „Was zur Prüfung offen bleibt“ fehlt');
  const list = section.blocks.find((block) => block.type === 'ul');
  if (!list) fail('Liste der offenen Fragen fehlt');
  return list.items;
}

// --- Glossar --------------------------------------------------------------

function parseGlossar(source) {
  const { meta, body } = parseFrontmatter(source, 'glossar.md');
  const text = stripEditorialFooters(body).replace(/^#\s+.*$/m, '');
  const entries = [];
  for (const chunk of text.split(/\r?\n\s*\r?\n/)) {
    const value = chunk.trim();
    if (!value || value.startsWith('## ') || /^-{3,}$/.test(value) || value.startsWith('*Hinweis')) continue;
    const match = /^\*\*(.+?)\*\*\s+—\s+(.+?)\s*\*\*Klasse ([^*]+)\*\*\s*—\s*(.+?)\.?$/.exec(value);
    if (!match) fail('Glossareintrag nicht lesbar: ' + value.slice(0, 50));
    const levels = (match[3].match(/[A-E]/g) || []).filter((letter, index, all) => all.indexOf(letter) === index);
    const sources = (match[4].match(/Q\d{2}/g) || []).filter((id, index, all) => all.indexOf(id) === index);
    entries.push({
      term: match[1].trim(),
      definition: match[2].trim(),
      levels,
      sources,
      sortKey: match[1]
        .trim()
        .toUpperCase()
        .replace(/^[^A-ZÄÖÜ]/, ''),
    });
  }
  entries.sort((a, b) => a.term.localeCompare(b.term, 'de'));

  const groups = [];
  for (const entry of entries) {
    const letter = /^[A-ZÄÖÜ]/.test(entry.sortKey) ? entry.sortKey[0] : entry.term[0].toUpperCase();
    let group = groups.find((candidate) => candidate.letter === letter);
    if (!group) {
      group = { letter, terms: [] };
      groups.push(group);
    }
    group.terms.push({
      term: entry.term,
      definition: entry.definition,
      levels: entry.levels,
      sources: entry.sources,
    });
  }
  groups.sort((a, b) => a.letter.localeCompare(b.letter, 'de'));
  return { meta, groups, count: entries.length };
}

// --- Quellenverzeichnis ---------------------------------------------------

const VERIFIED_LABEL = {
  page_loaded: 'Volltext geprüft',
  crossref: 'Crossref-verifiziert',
  library_record: 'ISBN/Katalog geprüft',
  secondary_isbn: 'ISBN aus Sekundärquelle',
};

function parseSources(source, registry) {
  const { meta, body } = parseFrontmatter(source, 'quellenverzeichnis.md');
  const text = stripEditorialFooters(body);
  const rows = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!/^\|\s*Q\d{2}\s*\|/.test(line)) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length !== 8) fail(`Quellenzeile hat ${cells.length} statt 8 Spalten: ${line.slice(0, 40)}`);
    rows.set(cells[0], {
      shortName: cells[1],
      type: cells[2],
      year: cells[3],
      level: cells[4],
      interest: cells[5],
      verification: cells[6],
      note: cells[7],
    });
  }

  // Maßgeblich ist die geprüfte Quellenbasis (recherche/quellen.json, 33
  // Einträge). Die redaktionelle Tabelle liefert Kurznamen und Anmerkungen;
  // vier Einträge (Q11, Q14, Q18, Q30) fehlen dort und werden aus der
  // Quellenbasis ergänzt, statt sie stillschweigend zu unterschlagen.
  const sources = (registry.sources || []).map((entry) => {
    const row = rows.get(entry.id) || {};
    const authors = (entry.authors || []).join('; ');
    const year = entry.year ? ` (${entry.year})` : row.year && row.year !== '—' ? ` (${row.year})` : '';
    const container = entry.container ? `. ${entry.container}` : '';
    return {
      id: entry.id,
      citation: `${authors || row.shortName || entry.title}: ${entry.title}${year}${container}`,
      shortName: row.shortName || entry.title,
      title: entry.title,
      url: entry.locator || '',
      locator: entry.locator || '',
      type: row.type || entry.type,
      year: row.year && row.year !== '—' && row.year !== '' ? row.year : entry.year ? String(entry.year) : '—',
      levels:
        String(row.level || (entry.evidence_use || []).join('/'))
          .match(/[A-E]/g)
          ?.filter((value, index, all) => all.indexOf(value) === index) || [],
      verification: row.verification || VERIFIED_LABEL[entry.verified] || entry.verified || '—',
      note: row.note || '',
      interestNote: entry.interest_note || '',
      accessNote: entry.access_note || '',
    };
  });

  // Interessenvermerke dürfen auf eine andere Quelle verweisen ("Wie Q06.");
  // in der öffentlichen Liste steht sonst ein unverständlicher Satz.
  const notes = new Map(sources.map((source) => [source.id, source.interestNote]));
  for (const source of sources) {
    const reference = /^Wie\s+(Q\d{2})\.?$/.exec(source.interestNote.trim());
    if (reference && notes.get(reference[1])) source.interestNote = notes.get(reference[1]);
  }

  if (sources.length !== 33) fail(`Quellenbasis enthält ${sources.length} statt 33 Quellen`);

  // Spaltenlegende aus dem Quellenverzeichnis (letzter Abschnitt der Datei).
  const legend = [];
  for (const line of text.split(/\r?\n/)) {
    const item = /^-\s+\*\*(.+?):\*\*\s+(.+)$/.exec(line.trim());
    if (item) legend.push({ label: item[1], text: item[2] });
  }
  return { meta, sources, legend };
}

// --- Zusammenbau ----------------------------------------------------------

function buildTopic(config, parsed) {
  const sections = parsed.sections.map((section, index) => {
    const id = config.sections[index];
    if (!id) fail(`${config.file}: mehr Abschnitte als Anker (${index + 1})`);
    return {
      id,
      number: section.number,
      title: section.title,
      period: section.period,
      chips: section.chips,
      blocks: section.blocks,
      words: wordsIn(section.blocks),
    };
  });
  if (sections.length !== config.sections.length) {
    fail(`${config.file}: ${sections.length} Abschnitte, ${config.sections.length} Anker`);
  }

  const statusSection = sections.find(
    (section) =>
      /Einordnung/i.test(section.title) &&
      /Tradition/i.test(section.blocks.map((block) => (block.type === 'p' ? block.text : '')).join(' '))
  );
  if (!statusSection) fail(`${config.file}: Abschnitt „Einordnung (Tradition vs. Evidenz)“ fehlt`);
  const paragraphs = statusSection.blocks.filter((block) => block.type === 'p').map((block) => block.text);
  const pick = (label) => {
    const entry = paragraphs.find((text) => text.startsWith(`**${label}`));
    if (!entry) fail(`${config.file}: Absatz „${label}“ fehlt`);
    return entry.replace(/^\*\*[^*]+:\*\*\s*/, '').trim();
  };

  // Die Einordnung wird als Kasten (C13) gerendert, nicht als letztes Kapitel:
  // Ein „Redaktions-Hinweis“ mitten im Artikel liest sich als Meta-Text.
  const body = sections.filter((section) => section !== statusSection);
  const lead = firstParagraph(body);

  return {
    slug: config.slug,
    title: config.title,
    eyebrow: config.eyebrow,
    subtitle: config.subtitle,
    metaLine: config.metaLine,
    status: config.status,
    seoTitle: config.seoTitle,
    description: config.seoDescription || metaDescription(parsed.meta.meta_description),
    heading: parsed.heading,
    lead,
    wordCount: body.reduce((sum, section) => sum + section.words, 0),
    chapterCount: body.length,
    figure: config.figure,
    cardText: config.cardText,
    facts: config.facts,
    sections: body,
    disclaimer: {
      tradition: pick('Tradition'),
      evidenz: pick('Evidenz'),
      konsequenz: `Der Bereich dient der Bildung und der kritischen Einordnung. Er ersetzt keine fachliche Prüfung und keine medizinische Beratung.`,
      fazit: pick('Fazit'),
    },
  };
}

async function main() {
  const read = (file) => fs.readFileSync(path.join(contentDir, file), 'utf8');

  // Die Taxonomie ist eine eigene, versionierte Quelle. Sie wird vor dem
  // Schreiben gegen das Vertragsmodul geprüft; ein Fehler bricht den Lauf ab,
  // statt ungültige Daten in js/data/radiasthesie.js zu schreiben.
  const contracts = await import(pathToFileURL(contractFile).href);
  let taxonomie;
  try {
    taxonomie = JSON.parse(fs.readFileSync(taxonomieFile, 'utf8'));
  } catch (error) {
    fail(`taxonomie.json nicht lesbar: ${error.message}`);
  }

  const intro = parseIntroduction(read('modul-einstieg.md'));
  const levels = levelsFromIntro(intro);
  const openQuestions = openQuestionsFromIntro(intro);
  if (levels.length !== 5) fail(`erwartet 5 Evidenzstufen, gefunden ${levels.length}`);

  const topics = {};
  for (const config of TOPICS) {
    topics[config.slug] = buildTopic(config, parseTopic(read(config.file)));
  }

  const glossar = parseGlossar(read('glossar.md'));
  const registry = JSON.parse(fs.readFileSync(sourcesFile, 'utf8'));
  const quellen = parseSources(read('quellenverzeichnis.md'), registry);

  const taxonomieCheck = contracts.validateTaxonomie(taxonomie, {
    sourceIds: registry.sources.map((source) => source.id),
    topicIds: Object.keys(topics),
  });
  if (!taxonomieCheck.ok) {
    const detail = taxonomieCheck.errors
      .slice(0, 6)
      .map((error) => error.message)
      .join(' | ');
    fail(`Taxonomie ungültig (${taxonomieCheck.errors.length} Fehler): ${detail}`);
  }
  const missingMedia = taxonomie.medien.filter(
    (medium) => medium.status === 'available' && !fs.existsSync(path.join(root, medium.file))
  );
  if (missingMedia.length) {
    fail(`Mediendatei fehlt: ${missingMedia.map((medium) => medium.file).join(', ')}`);
  }
  const disclaimer = parseFrontmatter(read('disclaimer.md'), 'disclaimer.md');
  const legalSection = /##\s+Rechtlicher Haftungsausschluss[^\n]*\n([\s\S]*?)(?=\n---|\s*$)/.exec(
    stripEditorialFooters(disclaimer.body)
  );
  if (!legalSection) fail('Haftungsausschluss-Abschnitt fehlt');
  const legalParagraphs = toBlocks(legalSection[1], 'disclaimer')
    .filter((block) => block.type === 'p')
    .map((block) => block.text);

  const data = {
    generatedAt: UPDATED,
    generatedFrom: 'docs/radiasthesie-konzept/inhalte/',
    schemaVersion: contracts.CONTRACT_VERSION,
    module: {
      id: 'pendeln',
      base: '#pendeln',
      title: EVALUATION.title,
      eyebrow: EVALUATION.eyebrow,
      lead: EVALUATION.lead,
      status: EVALUATION.status,
      seoTitle: EVALUATION.seoTitle,
      seoDescription: metaDescription(EVALUATION.seoDescription),
    },
    counts: {
      topics: Object.keys(topics).length,
      chapters: Object.values(topics).reduce((sum, topic) => sum + topic.chapterCount, 0),
      levels: levels.length,
      sources: quellen.sources.length,
      glossary: glossar.count,
    },
    levels,
    topics,
    introduction: {
      title: intro.meta.titel,
      description: intro.meta.meta_description,
      openQuestions,
    },
    landing: {
      topics: TOPICS.map((config) => ({
        slug: config.slug,
        metaLine: config.metaLine,
        title: config.title,
        text: config.cardText,
        facts: config.facts,
        figure: config.figure,
        lead: topics[config.slug].lead,
      })),
      workshop: WORKSHOP.map((entry) => ({ state: 'In Vorbereitung', ...entry })),
      related: RELATED,
      disclaimer: {
        title: 'Einordnung dieses Bereichs',
        paragraphs: [
          {
            label: 'Was hier steht',
            text: 'Radiästhesie, Pendeln und Orakel sind kulturell überlieferte Praktiken. Sie werden beschrieben, historisch eingeordnet und in ihrer heutigen Verbreitung gezeigt.',
          },
          {
            label: 'Was hier nicht behauptet wird',
            text: 'Dass Ruten, Pendel oder Tafeln physikalische Felder, Wasseradern oder Krankheiten anzeigen. Es gibt keine belastbare Evidenz für eine solche Wirkung; wo Untersuchungen vorliegen, werden sie mit Methode und Grenzen genannt.',
          },
          {
            label: 'Wie Sie das prüfen können',
            text: 'Jede Seite führt Quellen mit Abrufdatum. Aussagen tragen eine Stufe von A bis E. Die Methodik-Seite erklärt die Regeln, nach denen Texte geprüft und freigegeben werden.',
          },
        ],
      },
    },
    glossary: glossar.groups,
    sources: quellen.sources,
    sourceLegend: quellen.legend,
    legal: {
      title: 'Rechtlicher Hinweis',
      paragraphs: legalParagraphs,
    },
    updated: UPDATED,
    taxonomie,
  };

  const banner = `// AUTO-GENERIERT — nicht direkt bearbeiten.\n// Quelle: docs/radiasthesie-konzept/inhalte/*.md\n// Erzeugt von scripts/generate-radiasthesie-data.cjs am ${UPDATED}.\n`;
  const tooLong = [
    ['landing', data.module.seoDescription],
    ...Object.values(data.topics).map((topic) => [topic.slug, topic.description]),
  ].filter(([, text]) => text.length > 160);
  if (tooLong.length) {
    fail(`Meta-Description zu lang (>160 Zeichen): ${tooLong.map(([slug]) => slug).join(', ')}`);
  }
  const output =
    banner +
    '\n// Fließtext-Markup: **fett**, *kursiv*, [Qxx]-Quellenmarker.\n' +
    'export const RADIASTHESIE = ' +
    JSON.stringify(data, null, 2) +
    ';\n\nexport default RADIASTHESIE;\n';

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, output, 'utf8');

  const kb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
  console.log(
    `js/data/radiasthesie.js geschrieben (${kb} kB): ` +
      `${data.counts.topics} Themen, ${data.counts.chapters} Kapitel, ` +
      `${data.counts.sources} Quellen, ${data.counts.glossary} Glossarbegriffe, ` +
      `${taxonomieCheck.counts.instrumente} Instrumente, ${taxonomieCheck.counts.methoden} Methoden, ` +
      `${taxonomieCheck.counts.ereignisse} Ereignisse, ${taxonomieCheck.counts.studien} Studien, ` +
      `${taxonomieCheck.counts.medien} Medien, ${taxonomieCheck.counts.experimente} Experimente.`
  );
}

if (require.main === module) {
  main().catch((error) => {
    if (!error || !error.reported) {
      console.error('FEHLER: ' + (error && error.message ? error.message : String(error)));
    }
    process.exitCode = 1;
  });
}

module.exports = { main };
