#!/usr/bin/env node
/**
 * Build-Prüfung des automatischen Seiten-Inhaltsverzeichnisses (Kanban `t_3c130426`).
 *
 * Prüft die **gebaute** Ausgabe gegen die Spezifikation
 * `docs/velarkana-toc/spezifikation.md` (Karten `t_5edc1d8c`, `t_fd9d97f0`):
 *
 *  - AK-A1/A2/A5: genau ein `aside.page-toc` und ein
 *    `nav[aria-label="Inhaltsverzeichnis"]` auf der Pilotseite, keines auf den
 *    übrigen Seiten; Werkzeugseiten des Frequenzbereichs bleiben ohne TOC.
 *  - AK-B1/B2/B5/B6: 29 Einträge in der Reihenfolge aus §14.1, keine h1-,
 *    sr-only- oder Footer-Überschrift, valide `ol`-Verschachtelung.
 *  - AK-C1/C2: jedes `href="#…"` löst im selben Dokument auf; die vorhandenen
 *    Überschriften-IDs sind gegenüber der Baseline unverändert.
 *  - AK-D1/G4: im ausgelieferten HTML steht **kein** `aria-current` (das setzt
 *    erst das Skript); die Liste ist vollständig serverseitig vorhanden.
 *  - AK-E8/A3: `details` kommt offen aus dem Server (No-JS), das TOC liegt im
 *    Druck nicht vor; mit `--expect-disabled` wird der Notaus geprüft.
 *
 * Bewusste Grenze: Das Skript liest HTML per regulärem Ausdruck (kein
 * DOM-Parser, keine neue Abhängigkeit). Interaktion, Scroll-Spy, Layout und
 * Tastatur prüft `scripts/toc/verify-browser.mjs`.
 *
 * Aufruf:
 *   node scripts/toc/verify-toc.cjs dist
 *   node scripts/toc/verify-toc.cjs dist --json evidence/velarkana-toc/build-check.json
 *   node scripts/toc/verify-toc.cjs dist --expect-disabled      # nach TOC_DISABLED=1 npm run build
 *   node scripts/toc/verify-toc.cjs dist --write-baseline=<html>
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith('--'));
const root = path.resolve(rootArg ?? 'dist');
const jsonTarget = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const expectDisabled = args.includes('--expect-disabled');
const writeBaselineArg = args.find((arg) => arg.startsWith('--write-baseline='));

const SPEC = path.join(__dirname, '..', '..', 'docs', 'velarkana-toc', 'spezifikation.md');
const PILOT = 'frequenzen/quellen.html';
const BASELINE = path.join(__dirname, '..', '..', 'evidence', 'velarkana-toc', 'baseline-heading-ids.json');

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', shy: '\u00ad' };
const decode = (text) =>
  text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body) => {
    const lower = body.toLowerCase();
    if (lower.startsWith('#x')) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    return Object.prototype.hasOwnProperty.call(ENTITIES, lower) ? ENTITIES[lower] : match;
  });

const cleanText = (html) =>
  decode(html.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
const read = (file) => fs.readFileSync(file, 'utf8');
const count = (html, pattern) => (html.match(pattern) ?? []).length;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_astro' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Sollzustand aus §14.1 der Spezifikation lesen — die Tabelle ist der Testvektor. */
function expectedPilotList() {
  const rows = [];
  for (const line of read(SPEC).split(/\r?\n/)) {
    const match = /^\|\s*\d{2}\s*\|\s*h([2-6])\s*\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
    if (match) rows.push({ depth: Number(match[1]), slug: match[2], text: match[3] });
  }
  if (rows.length === 0) throw new Error(`Keine TOC-Tabelle in ${SPEC} gefunden`);
  return rows;
}

function pageHeadingIds(html) {
  const ids = [];
  const regex = /<h([2-6])\b([^>]*)>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const id = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(match[2] ?? '');
    if (id) ids.push(id[1] ?? id[2]);
  }
  return ids;
}

function documentIds(html) {
  const ids = new Set();
  const regex = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = regex.exec(html)) !== null) ids.add(match[1] ?? match[2]);
  return ids;
}

if (writeBaselineArg) {
  const source = writeBaselineArg.slice('--write-baseline='.length);
  const ids = pageHeadingIds(read(path.resolve(source)));
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(
    BASELINE,
    `${JSON.stringify({ source: path.basename(source), note: 'Überschriften-IDs der Pilotseite vor der TOC-Integration (Build 9d14d37)', ids }, null, 2)}\n`,
    'utf8'
  );
  console.log(`Baseline geschrieben: ${BASELINE} (${ids.length} IDs)`);
  process.exit(0);
}

const checks = [];
const check = (id, description, ok, detail) => checks.push({ id, description, ok: Boolean(ok), detail });

const files = walk(root).sort();
if (files.length === 0) {
  console.error(`Keine HTML-Dateien unter ${root} — zuerst "npm run build" ausführen.`);
  process.exit(2);
}

const pilotPath = path.join(root, PILOT);
if (!fs.existsSync(pilotPath)) {
  console.error(`Pilotseite fehlt: ${pilotPath}`);
  process.exit(2);
}
const pilot = read(pilotPath);
const tocBlock = /<aside[^>]*class="[^"]*\bpage-toc\b[^"]*"[\s\S]*?<\/aside>/.exec(pilot)?.[0] ?? '';

/**
 * Seiten mit einem **bereits vorhandenen** `nav[aria-label="Inhaltsverzeichnis"]`
 * (Radiästhesie-Fragmente und ein manuelles Verzeichnis im Artikel
 * `wissen/01-…`). Gemessen am Build `9d14d37` vor der Integration; sie bleiben
 * unangetastet (AK-A2, AK-H5).
 */
const PAGES_WITH_LEGACY_TOC = [
  'radiasthesie/orakel.html',
  'radiasthesie/pendeln.html',
  'radiasthesie/radiasthesie.html',
  'wissen/01-die-78-tarot-karten-eine.html',
];

/* --- AK-A1: genau ein TOC auf der Pilotseite ------------------------------ */
const expected = expectedPilotList();
const asides = count(pilot, /<aside[^>]*class="[^"]*\bpage-toc\b[^"]*"/g);
const navs = count(pilot, /<nav[^>]*aria-label="Inhaltsverzeichnis"/g);

if (expectDisabled) {
  check('AK-A3', 'TOC_DISABLED=1: kein TOC auf der Pilotseite', asides === 0 && navs === 0, { asides, navs });
} else {
  check('AK-A1', 'genau ein aside.page-toc auf der Pilotseite', asides === 1, { asides });
  check('AK-F1', 'genau ein nav[aria-label="Inhaltsverzeichnis"]', navs === 1, { navs });
}

/* --- AK-B1/B2: Einträge, Reihenfolge, Texte ------------------------------- */
const links = [];
{
  const regex = /<a class="page-toc__link" href="([^"]*)">([\s\S]*?)<\/a>/g;
  let match;
  while ((match = regex.exec(pilot)) !== null) links.push({ href: match[1], text: cleanText(match[2]) });
}

check('AK-B1', `Pilotseite hat ${expected.length} Einträge`, links.length === expected.length, {
  expected: expected.length,
  actual: links.length,
});

const mismatches = [];
expected.forEach((wanted, index) => {
  const actual = links[index];
  if (!actual) {
    mismatches.push(`#${index + 1} fehlt (erwartet ${wanted.slug})`);
    return;
  }
  if (actual.href !== `#${wanted.slug}` || actual.text !== wanted.text) {
    mismatches.push(
      `#${index + 1}: ${JSON.stringify(actual)} ≠ ${JSON.stringify({ href: `#${wanted.slug}`, text: wanted.text })}`
    );
  }
});
check('AK-B2', 'Reihenfolge und Texte entsprechen §14.1', mismatches.length === 0, mismatches.slice(0, 5));

/* --- AK-C1: keine toten Anker --------------------------------------------- */
const ids = documentIds(pilot);
const dead = links.filter((link) => !link.href.startsWith('#') || !ids.has(decodeURIComponent(link.href.slice(1))));
check('AK-C1', 'alle TOC-Anker lösen im selben Dokument auf', dead.length === 0, dead.slice(0, 5));

/* --- AK-C2: bestehende IDs unverändert ------------------------------------ */
let baseline = null;
if (fs.existsSync(BASELINE)) {
  baseline = JSON.parse(read(BASELINE));
  const current = pageHeadingIds(pilot);
  const changed = current.length !== baseline.ids.length || current.some((id, index) => id !== baseline.ids[index]);
  check('AK-C2', 'Überschriften-IDs der Pilotseite unverändert gegenüber der Baseline', !changed, {
    baseline: baseline.ids.length,
    current: current.length,
  });
}

/* --- AK-B5: h1, Footer- und sr-only-Überschriften fehlen ------------------ */
const forbidden = ['Quellen und Methodik', 'Tools', 'Wissen', 'Rechtliches'];
const forbiddenHits = links.filter((link) => forbidden.includes(link.text));
check('AK-B5', 'keine h1-/Footer-Überschrift in der Liste', forbiddenHits.length === 0, forbiddenHits);

/* --- AK-B6: valide ol-Struktur -------------------------------------------- */
const rootLists = count(pilot, /<ol class="page-toc__list">/g);
const items2 = count(pilot, /class="page-toc__item page-toc__item--2"/g);
const items3 = count(pilot, /class="page-toc__item page-toc__item--3"/g);
const expectedH2 = expected.filter((row) => row.depth === 2).length;
const expectedH3 = expected.filter((row) => row.depth === 3).length;
check(
  'AK-B6',
  'ol-Verschachtelung entspricht den h2/h3-Gruppen',
  rootLists === 4 && items2 === expectedH2 && items3 === expectedH3,
  {
    rootLists,
    items2,
    items3,
    expectedH2,
    expectedH3,
  }
);

/* --- AK-D1/G4: kein aria-current im ausgelieferten TOC -------------------- */
check('AK-G4', 'kein aria-current im serverseitigen TOC-Markup', count(tocBlock, /aria-current/g) === 0, {
  found: count(tocBlock, /aria-current/g),
});

/* --- Zustände / Datenhaken (§6.4) ---------------------------------------- */
check(
  'AK-N1',
  'details kommt offen aus dem Server (No-JS)',
  /<details class="page-toc__details" data-toc-details open>/.test(pilot)
);
check(
  'AK-N2',
  'summary trägt id="page-toc-title", aside referenziert sie',
  /<summary class="page-toc__summary" id="page-toc-title">/.test(pilot) &&
    /aria-labelledby="page-toc-title"/.test(pilot)
);
check('AK-I3', 'data-toc-dynamic fehlt im Piloten', !/data-toc-dynamic/.test(pilot));
const duplicateIds = (() => {
  const seen = new Set();
  const twice = new Set();
  const regex = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = regex.exec(pilot)) !== null) {
    const id = match[1] ?? match[2];
    if (seen.has(id)) twice.add(id);
    seen.add(id);
  }
  return [...twice];
})();
check('AK-H6', 'keine doppelte ID im Dokument eingeführt', duplicateIds.length === 0, duplicateIds);

/* --- AK-A2/A5: keine zusätzlichen TOCs auf den übrigen Seiten ------------- */
const offenders = [];
const foreignNav = [];
for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (rel === PILOT) continue;
  const html = read(file);
  if (/<aside[^>]*class="[^"]*\bpage-toc\b/.test(html)) offenders.push(rel);
  if (/<nav[^>]*aria-label="Inhaltsverzeichnis"/.test(html) && !PAGES_WITH_LEGACY_TOC.includes(rel)) {
    foreignNav.push(rel);
  }
}
check('AK-A2', 'kein aside.page-toc auf den übrigen Seiten', offenders.length === 0, offenders.slice(0, 5));
check(
  'AK-A5',
  'kein zusätzliches nav "Inhaltsverzeichnis" auf den übrigen Seiten',
  foreignNav.length === 0,
  foreignNav.slice(0, 5)
);

const legacyPages = PAGES_WITH_LEGACY_TOC.map((rel) => {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return { rel, navs: null, asides: null };
  const html = read(file);
  return {
    rel,
    navs: count(html, /<nav[^>]*aria-label="Inhaltsverzeichnis"/g),
    asides: count(html, /<aside[^>]*class="[^"]*\bpage-toc\b/g),
  };
});
check(
  'AK-H5',
  'bestehende Verzeichnisse behalten genau ein nav und erhalten kein page-toc',
  legacyPages.every((page) => page.navs === 1 && page.asides === 0),
  legacyPages
);

const legacyTocPath = path.join(root, 'radiasthesie', 'pendeln.html');
if (fs.existsSync(legacyTocPath)) {
  const legacy = read(legacyTocPath);
  const block = /<details class="astro-toc"[\s\S]*?<\/details>/.exec(legacy);
  const legacyLinks = block ? count(block[0], /<a [^>]*href="#/g) : 0;
  check('AK-H5b', 'bestehendes Radiästhesie-TOC bleibt bei 10 Links', legacyLinks === 10, { legacyLinks });
}

const emptyPages = ['404.html', 'frequenzen/labor.html'];
const tocOnEmpty = emptyPages.filter((rel) => {
  const file = path.join(root, rel);
  return fs.existsSync(file) && /page-toc/.test(read(file));
});
check('AK-B8', 'Leerzustand: 404 und labor.html ohne TOC', tocOnEmpty.length === 0, tocOnEmpty);

/* --- Bericht -------------------------------------------------------------- */
// Im Notaus-Modus (`TOC_DISABLED=1`) werden nur die Kriterien bewertet, die dort
// überhaupt eine Aussage haben: der Schalter selbst und die Abgrenzung zu den
// übrigen Seiten. Die Inhalts- und Ankerprüfungen setzen ein TOC voraus.
const DISABLED_MODE_IDS = new Set(['AK-A3', 'AK-A2', 'AK-A5', 'AK-H5', 'AK-H5b', 'AK-B8']);
const evaluated = expectDisabled ? checks.filter((entry) => DISABLED_MODE_IDS.has(entry.id)) : checks;
const failed = evaluated.filter((entry) => !entry.ok);
const report = {
  generatedAt: new Date().toISOString(),
  root: path.relative(process.cwd(), root) || root,
  expectDisabled,
  pages: files.length,
  checks: evaluated,
  skipped: checks.filter((entry) => !evaluated.includes(entry)).map((entry) => entry.id),
  summary: { total: evaluated.length, passed: evaluated.length - failed.length, failed: failed.length },
};

console.log(`# TOC-Build-Prüfung (${report.pages} HTML-Dateien)${expectDisabled ? ' — Notaus TOC_DISABLED=1' : ''}`);
for (const entry of evaluated) {
  console.log(`${entry.ok ? '✔' : '✖'} ${entry.id} — ${entry.description}`);
  if (!entry.ok) console.log(`   ${JSON.stringify(entry.detail)}`);
}
console.log(`\n${report.summary.passed}/${report.summary.total} Prüfungen bestanden`);

if (jsonTarget) {
  const target = path.resolve(jsonTarget);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Bericht: ${path.relative(process.cwd(), target)}`);
}

process.exit(failed.length === 0 ? 0 : 1);
