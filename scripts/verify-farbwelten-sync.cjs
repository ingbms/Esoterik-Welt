// Farbwelten — Übergabeprüfung Quelle → generierte Daten.
//
// Prüft die fachlich bestätigten Korrekturen (B1, B4, B6, S16, N7, N8) zuerst
// in content/farbwelten/*.md und danach in js/data/farbwelten.js. Die
// Browser-Ebene prüft scripts/verify-farbwelten-rendered.cjs.
//
// Aufruf: node scripts/verify-farbwelten-sync.cjs [--json <datei>] [--strict-labels]
// Exit-Code 1 bei jedem Fehler. Keine stillen Warnungen: alles, was nicht
// belegbar ist, steht als Fehler im Bericht. Kennungen mit abweichenden
// Quellenfassungen (Label/URL je Seite) prüft der Quellenabgleich aus
// scripts/lib/farbwelten-sources.cjs; --strict-labels wertet auch
// unterschiedlich ausführliche Labels derselben URL als Fehler.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { loadDocuments, analyseDocuments, checkRegister, topicRegisters } = require('./lib/farbwelten-sources.cjs');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content', 'farbwelten');
const dataFile = path.join(root, 'js', 'data', 'farbwelten.js');

const COLOR_IDS = [
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
// Farbtyp nach §13.2: nur Spektralfarben dürfen Wellenlänge, Frequenz und
// Photonenenergie tragen.
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
const TYPE_LABELS = { spectral: 'Spektralfarbe', 'non-spectral': 'nicht spektral', neutral: 'Neutralfarbe' };
// Seiten mit A–H-Skelett und dem wortgleichen Vorgabe-Disclaimer (S16).
const CONTENT_FILES = ['farbwelten', ...COLOR_IDS, 'chakren', 'lichtfrequenzen'];
// Themenseiten (FW-10/FW-11): eigene Redaktionsseiten ohne Skelett, eigener
// Health-Disclaimer am Seitenende.
const TOPIC_FILES = ['farbtherapie', 'farbpsychologie', 'lichtmedizin'];
const ALL_FILES = [...CONTENT_FILES, ...TOPIC_FILES];

// Wortgleicher Vorgabetext (S16), siehe docs/farbwelten-konzept und
// NACHPRUEFBERICHT-2.md §2.
const DISCLAIMER =
  'Diese Inhalte ersetzen keine medizinische Diagnose oder Behandlung. Bei gesundheitlichen Beschwerden wenden Sie sich an eine medizinische Fachkraft. Farbtherapie als Krankheitsbehandlung ist medizinisch nicht belegt [9].';

// Wörtliche rote Aussagen, die nicht im indexierbaren Fließtext stehen dürfen.
const FORBIDDEN = [
  /heilt die Schilddrüse/i,
  /öffnet das dritte Auge/i,
  /Violett heilt/i,
  /Rot heilt/i,
  /Grün heilt das Herz/i,
  /Organfrequenz/i,
];

const failures = [];
const notes = [];
const measurements = {};

function fail(message) {
  failures.push(message);
}

function readPage(name) {
  const source = fs.readFileSync(path.join(contentDir, `${name}.md`), 'utf8').replace(/\r\n/g, '\n');
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
  const lines = body.split('\n');
  const sections = [];
  let current = { heading: null, lines: [] };
  for (const line of lines) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      sections.push(current);
      current = { heading: heading[1].trim(), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  sections.push(current);
  return { name, source, body, sections };
}

function textBeforeQuellen(page) {
  const index = page.sections.findIndex((section) => /^quellen/i.test(section.heading || ''));
  const bodySections = index >= 0 ? page.sections.slice(0, index) : page.sections;
  return bodySections.map((section) => [section.heading || '', ...section.lines].join('\n')).join('\n');
}

function quellenSection(page) {
  return page.sections.find((section) => /^quellen/i.test(section.heading || ''));
}

function idsIn(text) {
  return [...new Set([...text.matchAll(/\[(\d{1,2})\]/g)].map((match) => match[1]))].sort(
    (a, b) => Number(a) - Number(b)
  );
}

function listedIds(page) {
  const quellen = quellenSection(page);
  if (!quellen) return [];
  const text = quellen.lines.join('\n');
  return [...new Set([...text.matchAll(/^\s*-\s+\[(\d{1,2})\]/gm)].map((match) => match[1]))].sort(
    (a, b) => Number(a) - Number(b)
  );
}

// ---------------------------------------------------------------- Quelltexte

const pages = new Map(ALL_FILES.map((name) => [name, readPage(name)]));
const citedPerPage = {};
const listedPerPage = {};

for (const name of ALL_FILES) {
  const page = pages.get(name);
  if (!quellenSection(page)) {
    fail(`${name}: Abschnitt „## Quellen" fehlt`);
    continue;
  }
  const cited = idsIn(textBeforeQuellen(page));
  const listed = listedIds(page);
  citedPerPage[name] = cited;
  listedPerPage[name] = listed;
  const missing = cited.filter((id) => !listed.includes(id));
  if (missing.length)
    fail(`${name}: zitiert, aber nicht in ## Quellen gelistet: ${missing.map((id) => `[${id}]`).join(' ')}`);
}

// B1: Bibliografie-Format — mindestens fünf Einzeleinträge je Seite.
for (const name of ALL_FILES) {
  const entries = listedPerPage[name] || [];
  if (entries.length < 5) fail(`${name}: nur ${entries.length} Bibliografie-Einträge im Format „- [n]"`);
}

// B1: [10] trägt Journal (ausgeschrieben oder abgekürzt) und DOI.
for (const name of ALL_FILES) {
  const quellen = quellenSection(pages.get(name))?.lines.join('\n') || '';
  const entry = /^-\s+\[10\][^\n]*$/m.exec(quellen);
  if (entry) {
    if (!/10\.1186\/s13643-025-02902-3/.test(entry[0])) fail(`${name}: [10] ohne DOI 10.1186/s13643-025-02902-3`);
    if (!/Systematic Reviews|Syst\.? Rev/i.test(entry[0])) fail(`${name}: [10] ohne Journal „Systematic Reviews"`);
  }
}

// S16: Vorgabetext wortgleich genau einmal, nur ein Disclaimer-Block je Seite.
for (const name of CONTENT_FILES) {
  const source = pages.get(name).source.replace(/\s+/g, ' ');
  const hits = source.split(DISCLAIMER).length - 1;
  if (hits !== 1) fail(`${name}: S16-Vorgabetext ${hits}× statt 1×`);
  const disclaimerBlocks = (pages.get(name).source.match(/^>\s*\*\*[^\n]*\n?/gm) || []).filter((line) =>
    /Health-Disclaimer|medizinische Diagnose|medizinischer Behandlung|Diagnose oder Behandlung/i.test(line)
  );
  if (disclaimerBlocks.length !== 1)
    fail(`${name}: ${disclaimerBlocks.length} Disclaimer-Blöcke statt 1 (S16-Doppelung)`);
}

// Themenseiten: genau ein Health-Disclaimer, und zwar als letzter Block.
for (const name of TOPIC_FILES) {
  const raw = pages.get(name).source;
  const blocks = (raw.match(/^\*\*Health-Disclaimer:\*\*/gm) || []).length;
  if (blocks !== 1) fail(`${name}: ${blocks} Health-Disclaimer statt 1`);
  if (!/medizinische Diagnose oder Behandlung/.test(raw.replace(/\s+/g, ' ')))
    fail(`${name}: Health-Disclaimer ohne Hinweis auf medizinische Diagnose/Behandlung`);
  const lastParagraph = raw
    .trim()
    .split(/\n\s*\n/)
    .at(-1)
    .trim();
  if (!/^(\*\*)?Health-Disclaimer/.test(lastParagraph))
    fail(`${name}: Health-Disclaimer steht nicht am Seitenende (letzter Absatz: „${lastParagraph.slice(0, 60)}…“)`);
}

// B4: chakren 1577-Zeile trägt die bestätigte Fassung.
{
  const timeline = pages
    .get('chakren')
    .sections.find((section) => /geschichte der zentren/i.test(section.heading || ''));
  const line = timeline?.lines.find((entry) => /^\s*-\s*1577/.test(entry)) || '';
  if (!/Element- und Lotosfarben/i.test(line))
    fail(`chakren: 1577-Zeile ohne „Element- und Lotosfarben": ${line.trim()}`);
  if (!/keine Regenbogenfolge/i.test(line)) fail(`chakren: 1577-Zeile ohne „keine Regenbogenfolge": ${line.trim()}`);
  if (/ohne Farbzuordnung/i.test(pages.get('chakren').source))
    fail('chakren: „ohne Farbzuordnung" steht weiterhin im Text');
  measurements.b4_chakren_1577 = line.trim();
}

// B6: indigo ohne wörtliches Zitat, H2 als Evidenzformulierung.
{
  const indigo = pages.get('indigo');
  if (/dritte Auge/i.test(indigo.source) && /nicht verwendet/i.test(indigo.source))
    fail('indigo: wörtliche Rot-Aussage „drittes Auge … nicht verwendet" steht weiterhin');
  if (!/Was die Studienlage nicht hergibt/i.test(indigo.source))
    fail('indigo: H2 „Was die Studienlage nicht hergibt" fehlt');
}

// N8: Violett nennt Wellenlänge und Frequenz; N7: kein Indigo-Absatz.
{
  const violett = pages.get('violett');
  const intro = violett.sections[0]?.lines.join(' ') || '';
  if (!/3\d\d\s*(–|-|bis)\s*\d\d\d\s*nm/.test(violett.source)) fail('violett: keine Wellenlängenangabe (nm)');
  if (!/THz/.test(violett.source)) fail('violett: keine Frequenzangabe (THz)');
  if (/dritte Auge|Indigo-Bereich|420\s*(–|-|bis)\s*450/.test(intro)) fail('violett: Intro enthält Indigo-Text');
}

// N7/S3: keine zeichengleichen Absätze zwischen den Farbseiten.
{
  const seen = new Map();
  for (const name of COLOR_IDS) {
    for (const section of pages.get(name).sections) {
      const paragraphs = section.lines.join('\n').split(/\n\s*\n/);
      for (const paragraph of paragraphs) {
        const text = paragraph.replace(/\s+/g, ' ').trim();
        if (text.length < 150 || text.startsWith('-') || text.startsWith('|') || text.startsWith('>')) continue;
        const previous = seen.get(text);
        if (previous) fail(`zeichengleicher Absatz in ${previous} und ${name}: „${text.slice(0, 60)}…"`);
        else seen.set(text, name);
      }
    }
  }
}

// Wörtliche rote Aussagen.
for (const name of ALL_FILES) {
  for (const pattern of FORBIDDEN) {
    if (pattern.test(pages.get(name).source)) fail(`${name}: verbotene wörtliche Aussage ${pattern}`);
  }
}

// ------------------------------------------------------------ Generierte Daten

async function loadData() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'farbwelten-sync-'));
  try {
    fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
    fs.copyFileSync(dataFile, path.join(tmp, 'farbwelten.js'));
    return await import(pathToFileURL(path.join(tmp, 'farbwelten.js')).href);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function allText(world) {
  return [world.lede, JSON.stringify(world.sections), JSON.stringify(world.compare)].join('\n');
}

(async () => {
  const data = await loadData();

  if (data.FARBWELTEN.length !== COLOR_IDS.length)
    fail(`Daten: ${data.FARBWELTEN.length} Farbwelten statt ${COLOR_IDS.length}`);

  for (const world of data.FARBWELTEN) {
    // §13.2: Typ, Typ-Label, Route und Messwerte müssen zusammenpassen.
    const type = COLOR_TYPES[world.id];
    if (!type) fail(`Daten ${world.id}: unbekannte Farbwelt`);
    else {
      if (world.type !== type) fail(`Daten ${world.id}: Typ „${world.type}" statt „${type}"`);
      if (world.typeLabel !== TYPE_LABELS[type])
        fail(`Daten ${world.id}: Typ-Label „${world.typeLabel}" statt „${TYPE_LABELS[type]}"`);
    }
    if (world.route !== `#farbwelten/${world.id}`) fail(`Daten ${world.id}: Route „${world.route}"`);
    if (!world.register) fail(`Daten ${world.id}: Registereintrag fehlt`);
    else {
      if (world.register.route !== world.route) fail(`Daten ${world.id}: Registerroute abweichend`);
      if (!world.register.kurz || world.register.kurz.length < 20) fail(`Daten ${world.id}: Kurzbeschreibung fehlt`);
      if (!Array.isArray(world.register.verwandt) || !world.register.verwandt.length)
        fail(`Daten ${world.id}: Verwandtschaften fehlen`);
    }
    if (type === 'spectral') {
      if (!world.wavelength || !world.frequency || !world.photonEv)
        fail(`Daten ${world.id}: Spektralfarbe ohne Messwerte`);
    } else {
      if (world.wavelength || world.frequency || world.photonEv)
        fail(`Daten ${world.id}: ${TYPE_LABELS[type]} trägt erfundene Messwerte`);
      const facts = world.sections.physik.find((block) => block.type === 'facts');
      const labels = (facts?.rows || []).map(([label]) => label);
      for (const verboten of ['Wellenlängenbereich', 'Frequenz', 'Photonenenergie']) {
        if (labels.includes(verboten)) fail(`Daten ${world.id}: Physikzeile „${verboten}" unzulässig`);
      }
    }

    const text = allText(world);
    const cited = idsIn(text);
    const unresolved = cited.filter((id) => !data.SOURCES[id]);
    if (unresolved.length)
      fail(`Daten ${world.id}: Quellen ohne Registereintrag: ${unresolved.map((id) => `[${id}]`).join(' ')}`);
    if (world.shortRefs.length)
      fail(`Daten ${world.id}: Kurzverweise statt vollständiger Quellen: ${world.shortRefs.join(', ')}`);
    for (const id of world.sources) {
      const source = data.SOURCES[id];
      if (!source.label || source.label.length < 12) fail(`Daten ${world.id}: Quelle [${id}] ohne belastbares Label`);
    }
    if (!/medizinische Diagnose oder Behandlung/.test(text)) fail(`Daten ${world.id}: S16-Vorgabetext fehlt`);
    for (const pattern of FORBIDDEN) if (pattern.test(text)) fail(`Daten ${world.id}: verbotene Aussage ${pattern}`);
  }

  const chakrenTimeline = JSON.stringify(data.CHAKREN_PAGE.timeline);
  if (!/Element- und Lotosfarben/.test(chakrenTimeline))
    fail('Daten chakren: Zeitleiste ohne „Element- und Lotosfarben"');
  if (/ohne Farbzuordnung/.test(chakrenTimeline)) fail('Daten chakren: Zeitleiste weiter mit „ohne Farbzuordnung"');
  const worldTimeline = JSON.stringify(data.FARBWELTEN.map((world) => world.sections.geschichte));
  if (/sechs Zentren und das Sahasrāra, keine Farbzuordnung/.test(worldTimeline))
    fail('Daten Farbseiten: Zeitleiste weiter mit „keine Farbzuordnung"');

  for (const name of ['chakren', 'lichtfrequenzen']) {
    const page = name === 'chakren' ? data.CHAKREN_PAGE : data.LIGHT_PAGE;
    const cited = idsIn(JSON.stringify({ ...page, sources: undefined }));
    const unresolved = cited.filter((id) => !data.SOURCES[id]);
    if (unresolved.length)
      fail(`Daten ${name}: Quellen ohne Registereintrag: ${unresolved.map((id) => `[${id}]`).join(' ')}`);
  }

  // Themenseiten: Abschnittsfolge, Metadaten und zitiert ⊆ gelistet im
  // generierten Stand (die Redaktionsebene prüfen die Zeilen oben).
  if (!Array.isArray(data.TOPIC_PAGES) || data.TOPIC_PAGES.length !== TOPIC_FILES.length)
    fail(`Daten Themenseiten: ${data.TOPIC_PAGES ? data.TOPIC_PAGES.length : 0} statt ${TOPIC_FILES.length}`);
  for (const page of data.TOPIC_PAGES || []) {
    if (!page.sections.length) fail(`Daten ${page.slug}: keine Abschnitte`);
    if (page.sections.at(-1)?.anchor !== 'quellen') fail(`Daten ${page.slug}: Quellen sind nicht der letzte Abschnitt`);
    const entries = page.sections
      .flatMap((section) => section.blocks)
      .filter((block) => block.type === 'sources')
      .flatMap((block) => block.items);
    if (!entries.length) fail(`Daten ${page.slug}: keine Quellenliste gerendert`);
    const listed = new Set(entries.map((entry) => entry.id));
    const cited = idsIn(JSON.stringify(page.sections.filter((section) => section.anchor !== 'quellen')));
    const missing = cited.filter((id) => !listed.has(id));
    if (missing.length)
      fail(`Daten ${page.slug}: zitiert, aber nicht gelistet: ${missing.map((id) => `[${id}]`).join(' ')}`);
    for (const entry of entries) {
      if (!entry.label || entry.label.length < 12) fail(`Daten ${page.slug}: Quelle [${entry.id}] ohne Label`);
    }
    if (page.meta.title.length > 60) fail(`Daten ${page.slug}: Title ${page.meta.title.length} > 60`);
    if (page.meta.description.length > 155)
      fail(`Daten ${page.slug}: Description ${page.meta.description.length} > 155`);
    measurements[`topic_${page.slug}`] = {
      sections: page.sections.length,
      listed: [...listed],
      cited,
    };
  }

  // Jede Seite wird geprüft: Farbseiten im gemeinsamen Register, Themenseiten
  // in ihrer tatsächlich gerenderten eigenen Bibliografie. Keine Seite ausnehmen.
  const sourceDocuments = loadDocuments(contentDir);
  const sourceAnalysis = analyseDocuments(sourceDocuments, {
    strictLabels: process.argv.includes('--strict-labels'),
  });
  const sourceRegister = checkRegister(sourceAnalysis, data.SOURCES, topicRegisters(data.TOPIC_PAGES));
  const sourceErrors = [...sourceAnalysis.errors, ...sourceRegister.errors];
  const sourceWarnings = [...sourceAnalysis.warnings, ...sourceRegister.warnings];
  for (const error of sourceErrors) fail(`Quellenabgleich: ${error.message}`);
  for (const warning of sourceWarnings) notes.push(`Hinweis ${warning.message}`);

  measurements.sourceConsistency = {
    documents: sourceAnalysis.documents.length,
    ids: sourceAnalysis.ids.length,
    divergentIds: sourceAnalysis.ids.filter((record) => !record.identical).map((record) => record.id),
    errors: sourceErrors.length,
    warnings: sourceWarnings.length,
    strictLabels: sourceAnalysis.strictLabels,
    chains: sourceAnalysis.chains.length,
    details: {
      errors: sourceErrors.map(({ code, id, message }) => ({ code, id, message })),
      warnings: sourceWarnings.map(({ code, id, message }) => ({ code, id, message })),
    },
  };

  measurements.registry = Object.keys(data.SOURCES).length;

  measurements.cited = citedPerPage;
  measurements.listed = listedPerPage;

  const report = {
    checkedAt: new Date().toISOString(),
    files: ALL_FILES.length,
    registryEntries: measurements.registry,
    failures,
    measurements,
  };

  const jsonIndex = process.argv.indexOf('--json');
  if (jsonIndex >= 0 && process.argv[jsonIndex + 1]) {
    fs.mkdirSync(path.dirname(path.resolve(process.argv[jsonIndex + 1])), { recursive: true });
    fs.writeFileSync(path.resolve(process.argv[jsonIndex + 1]), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  console.log(
    `Farbwelten-Sync: ${ALL_FILES.length} Quellen, ${measurements.registry} Registereinträge, ${failures.length} Fehler, ${notes.length} Hinweise`
  );
  for (const note of notes) console.log(`  ${note}`);
  for (const failure of failures) console.log(`  FEHLER ${failure}`);
  if (failures.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
