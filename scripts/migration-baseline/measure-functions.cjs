#!/usr/bin/env node
/**
 * measure-functions.cjs — erhebt den Funktions-Bestand der Baseline fuer den
 * Funktions-Katalog (docs/migration-baseline/funktionen-katalog.md).
 *
 * Das Skript rekonstruiert nichts: es liest nur Dateien des Release-Stands und
 * schreibt die Messwerte nach docs/migration-baseline/evidence/functions/.
 * Mit --check wird die vorhandene Messung gegen eine neue Erhebung geprueft
 * (Exit 1 bei Abweichung). Der Commit-Hash wird beim Vergleich ignoriert, weil
 * er sich mit jedem Commit aendert.
 *
 * Aufruf: node scripts/migration-baseline/measure-functions.cjs [--check]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { findBlockEnd } = require('./lib/js-blocks.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'functions');
const OUT_FILE = path.join(OUT_DIR, 'functions-baseline.json');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function lineOf(re, text) {
  const idx = text.search(re);
  return idx < 0 ? null : text.slice(0, idx).split('\n').length;
}

/** Liefert Definitionen (Funktion/Klasse/Methode) mit geprueftem Zeilenbereich. */
function extractDeclarations(rel) {
  const lines = read(rel).split(/\r?\n/);
  const decls = [];
  const re = /^(\s*)(export\s+)?(?:async\s+)?(function\*?|class)\s+([A-Za-z_$][\w$]*)\s*[({<]/;
  for (let i = 0; i < lines.length; i += 1) {
    const m = re.exec(lines[i]);
    if (!m) continue;
    const end = findBlockEnd(lines, i);
    decls.push({
      name: m[4],
      kind: m[3].startsWith('function') ? 'function' : 'class',
      exported: Boolean(m[2]),
      top_level: m[1].length === 0,
      line: i + 1,
      end_line: end,
      lines: end ? end - i : null,
    });
  }
  // Methoden der Klassen (Ebene 2) — nur Namen und Zeilenbereiche.
  const classMethods = [];
  for (const decl of decls) {
    if (decl.kind !== 'class') continue;
    const methodRe = /^ {2}(?:async\s+|static\s+|get\s+|set\s+)*([A-Za-z_$][\w$]*)\s*\(/;
    const bodyEnd = decl.end_line || lines.length;
    for (let i = decl.line; i < bodyEnd; i += 1) {
      const mm = methodRe.exec(lines[i]);
      if (!mm) continue;
      if (['if', 'for', 'while', 'switch', 'catch'].includes(mm[1])) continue;
      const end = findBlockEnd(lines, i);
      classMethods.push({ class: decl.name, name: mm[1], line: i + 1, end_line: end });
    }
  }
  return { decls, classMethods };
}

const MODULE_DIR = 'js/modules';
const modules = fs
  .readdirSync(path.join(ROOT, MODULE_DIR))
  .filter((f) => f.endsWith('.js') || f.endsWith('.d.ts'))
  .sort();

const moduleFacts = modules.map((file) => {
  const rel = `${MODULE_DIR}/${file}`;
  const text = read(rel);
  const lines = text.split(/\r?\n/);
  const imports = [];
  const importRe = /^import\s+(?:(\{[^}]*\})|([\w$]+)|\*\s+as\s+([\w$]+))\s+from\s+'([^']+)'/gm;
  let m;
  while ((m = importRe.exec(text))) {
    imports.push({
      specifier: m[4],
      names: m[1]
        ? m[1]
            .replace(/[{}]/g, '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [m[2] || m[3]].filter(Boolean),
      line: text.slice(0, m.index).split('\n').length,
    });
  }
  const { decls, classMethods } = extractDeclarations(rel);
  return {
    path: rel,
    lines: lines.length,
    bytes: fs.statSync(path.join(ROOT, rel)).size,
    classes: decls.filter((d) => d.kind === 'class' && d.top_level),
    functions: decls.filter((d) => d.kind === 'function' && d.top_level),
    class_methods: classMethods,
    imports,
  };
});

// --- Routen -----------------------------------------------------------------
const mainText = read('js/main.js');

const routes = {
  main_pages: [],
  skip_anchor: null,
  article_route: null,
  area_routes: [],
  aliases: [],
  page_meta: [],
};

const mainPagesBlock = /const MAIN_PAGES = \[([\s\S]*?)\];/.exec(mainText);
if (mainPagesBlock) {
  const blockStart = mainText.slice(0, mainPagesBlock.index).split('\n').length;
  mainPagesBlock[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean)
    .forEach((id, i) => {
      routes.main_pages.push({ id, line: blockStart + 1 + i });
    });
}
routes.skip_anchor = {
  value: /const SKIP_ANCHOR = '([^']+)'/.exec(mainText)?.[1] || null,
  line: lineOf(/const SKIP_ANCHOR =/, mainText),
};
routes.article_route = {
  pattern: /const ARTICLE_ROUTE = (\/.*\/);/.exec(mainText)?.[1] || null,
  line: lineOf(/const ARTICLE_ROUTE =/, mainText),
};

const AREA_ROUTES = [
  ['astrologie', 'ASTROLOGIE_ROUTE'],
  ['frequenzen', 'FREQUENZ_ROUTE'],
  ['frequenzlabor', 'FREQUENZ_ALIAS'],
  ['pendeln', 'PENDELN_ROUTE'],
  ['farbwelten', 'FARBWELTEN_ROUTE'],
];
for (const [area, name] of AREA_ROUTES) {
  const re = new RegExp(`const ${name} = (/.+/);`);
  const hit = re.exec(mainText);
  routes.area_routes.push({
    area,
    name,
    pattern: hit ? hit[1] : null,
    line: hit ? mainText.slice(0, hit.index).split('\n').length : null,
  });
}

const aliasLine = lineOf(/const FARBWELTEN_ALIASES =/, mainText);
const aliasBlock = /const FARBWELTEN_ALIASES = new Set\(\[([^\]]*)\]\);/.exec(mainText);
if (aliasBlock) {
  aliasBlock[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean)
    .forEach((a) => routes.aliases.push({ alias: a, target_area: 'farbwelten', line: aliasLine }));
}

const pageMetaBlock = /const PAGE_META = \{([\s\S]*?)\n\};/.exec(mainText);
if (pageMetaBlock) {
  const base = mainText.slice(0, pageMetaBlock.index).split('\n').length;
  const keyRe = /^ {2}([\w]+):\s*\{/gm;
  let km;
  while ((km = keyRe.exec(pageMetaBlock[1]))) {
    const chunk = pageMetaBlock[1].slice(km.index, km.index + 900);
    const t = /title:\s*\n?\s*'([^']*)'|title:\s*"([^"]*)"/.exec(chunk);
    routes.page_meta.push({
      key: km[1],
      title: t ? t[1] || t[2] : null,
      line: base + pageMetaBlock[1].slice(0, km.index).split('\n').length,
    });
  }
}

// --- Sichtbare Ansichten je Bereich ----------------------------------------
// Die Ansichtsnamen sind die tatsaechlichen Routen-Bausteine. Wo ein Modul
// keine `case`-Liste fuehrt, wird die Quelle ausdruecklich genannt:
//   pendeln    -> switch in radiasthesie-model.js (resolveRoute in createModel)
//   farbwelten -> VIEW-Konstanten in farbwelten-model.js
//   frequenzen -> `known`-Liste in frequenzlabor.js plus Standard 'hub'
const VIEW_SOURCE = {
  astrologie: { module: 'js/modules/astrologie.js', kind: 'case' },
  pendeln: { module: 'js/modules/radiasthesie-model.js', kind: 'case' },
  farbwelten: { module: 'js/modules/farbwelten-model.js', kind: 'view-const' },
  frequenzen: { module: 'js/modules/frequenzlabor.js', kind: 'known-list' },
};
const subroutes = {};
for (const [area, source] of Object.entries(VIEW_SOURCE)) {
  const text = read(source.module);
  const lines = text.split(/\r?\n/);
  const views = [];
  if (source.kind === 'case') {
    lines.forEach((line, i) => {
      const m = /^\s*case '([^']+)':/.exec(line);
      if (m) views.push({ value: m[1], line: i + 1, kind: 'case' });
    });
  } else if (source.kind === 'view-const') {
    const block = /export const VIEW = \{([\s\S]*?)\};/.exec(text);
    if (block) {
      const base = text.slice(0, block.index).split('\n').length;
      const re = /([A-Z]+):\s*'([^']+)'/g;
      let m;
      while ((m = re.exec(block[1]))) {
        views.push({ value: m[2], line: base + block[1].slice(0, m.index).split('\n').length, kind: 'view-const' });
      }
    }
  } else if (source.kind === 'known-list') {
    const m = /const known = \[([^\]]*)\]/.exec(text);
    if (m) {
      const base = text.slice(0, m.index).split('\n').length;
      m[1]
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean)
        .forEach((value, i) => views.push({ value, line: base + i, kind: 'known-list' }));
    }
    views.unshift({ value: 'hub', line: lineOf(/this\.view = 'hub'/, text), kind: 'default' });
  }
  subroutes[area] = { module: source.module, kind: source.kind, views };
}

// --- Speicher ---------------------------------------------------------------
// Alle Schluessel, die wirklich an getItem/setItem/removeItem gehen. Sie stehen
// teils als Literal, teils als Konstante (STORAGE_KEY) oder Klassenfeld
// (this.historyKey) im Code; beides wird aufgeloest, sonst fehlt der halbe
// Bestand (nachgewiesen: 4 statt 8 Schluessel bei reiner Literalsuche).
const storage = [];
const SOURCE_FILES = [
  ...modules.map((f) => `${MODULE_DIR}/${f}`),
  'js/main.js',
  'js/dialog.js',
  'js/data/tarot-decks.js',
].filter((rel) => exists(rel) && !rel.endsWith('.d.ts'));
const STORAGE_CONST = /(?:const|let|var)\s+([A-Za-z_$][\w$]*(?:KEY|Key))\s*=\s*['"]([^'"]+)['"]/g;
const STORAGE_FIELD = /this\.([A-Za-z_$][\w$]*(?:Key|KEY))\s*=\s*['"]([^'"]+)['"]/g;
const STORAGE_CALL = /(?:getItem|setItem|removeItem)\(\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$.]*))/;
const STORAGE_BACKUP = /`(esot_rad_corrupt_\$\{[^}]+\}_\$\{[^}]+\})`/;

for (const rel of SOURCE_FILES) {
  const text = read(rel);
  const lines = text.split(/\r?\n/);
  const symbols = new Map();
  let m;
  STORAGE_CONST.lastIndex = 0;
  while ((m = STORAGE_CONST.exec(text))) symbols.set(m[1], m[2]);
  STORAGE_FIELD.lastIndex = 0;
  while ((m = STORAGE_FIELD.exec(text))) symbols.set(m[1], m[2]);

  lines.forEach((line, i) => {
    const call = STORAGE_CALL.exec(line);
    if (call) {
      const literal = call[1] || call[2] || null;
      const symbol = (call[3] || '').replace(/^this\./, '');
      const key = literal || symbols.get(symbol) || null;
      storage.push({ file: rel, line: i + 1, key, resolved: Boolean(key) });
    }
    const backup = STORAGE_BACKUP.exec(line);
    if (backup) {
      storage.push({
        file: rel,
        line: i + 1,
        key: 'esot_rad_corrupt_*',
        resolved: true,
        pattern: 'esot_rad_corrupt_<STORAGE_KEY>_<stamp>',
      });
    }
  });
}

// --- Externe Requests -------------------------------------------------------
const requests = [];
for (const rel of [...modules.map((f) => `${MODULE_DIR}/${f}`), 'js/main.js']) {
  if (!exists(rel) || rel.endsWith('.d.ts')) continue;
  const text = read(rel);
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/\bfetch\s*\(|new\s+XMLHttpRequest|navigator\.sendBeacon\s*\(|new\s+WebSocket|new\s+EventSource/.test(line)) {
      requests.push({ file: rel, line: i + 1, snippet: line.trim().slice(0, 160) });
    }
  });
}

// --- Statische Seiten / SEO -------------------------------------------------
const seo = { sitemap_urls: 0, robots: null, html_files: [], jsonld_blocks: 0, og_tags: 0 };
if (exists('sitemap.xml')) {
  seo.sitemap_urls = (read('sitemap.xml').match(/<loc>/g) || []).length;
}
if (exists('robots.txt')) seo.robots = read('robots.txt').split(/\r?\n/)[0];
for (const file of fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'))
  .sort()) {
  const text = read(file);
  seo.html_files.push({
    file,
    bytes: fs.statSync(path.join(ROOT, file)).size,
    jsonld: (text.match(/application\/ld\+json/g) || []).length,
    og: (text.match(/property="og:/g) || []).length,
    twitter: (text.match(/name="twitter:/g) || []).length,
    canonical: /rel="canonical"/.test(text),
  });
  seo.jsonld_blocks += (text.match(/application\/ld\+json/g) || []).length;
  seo.og_tags += (text.match(/property="og:/g) || []).length;
}

// --- Build- und Datenquellen ------------------------------------------------
const pkg = JSON.parse(read('package.json'));
const buildScripts = Object.entries(pkg.scripts)
  .filter(([k, v]) => /^(build|data:|prestart|verify:)/.test(k) || /build-|generate-/.test(v))
  .map(([name, command]) => ({ name, command }));

const generators = fs
  .readdirSync(path.join(ROOT, 'scripts'))
  .filter((f) => /^generate-.*\.cjs$/.test(f))
  .sort()
  .map((file) => {
    const rel = `scripts/${file}`;
    const text = read(rel);
    const inputs = [...new Set(text.match(/(?:content|docs|assets)\/[\w./*-]+/g) || [])].sort();
    return { file: rel, bytes: fs.statSync(path.join(ROOT, rel)).size, path_literals: inputs };
  });

// --- Tests ------------------------------------------------------------------
const tests = fs
  .readdirSync(path.join(ROOT, 'tests'))
  .filter((f) => /\.(js|cjs|mjs)$/.test(f))
  .sort()
  .map((file) => {
    const rel = `tests/${file}`;
    const text = read(rel);
    const imports = [...text.matchAll(/from\s+'([^']+)'|require\('([^']+)'\)/g)]
      .map((m) => m[1] || m[2])
      .filter((s) => s && (s.startsWith('../js/') || s.startsWith('../scripts/')));
    return { path: rel, imports: [...new Set(imports)].sort() };
  });

const out = {
  schema: 'esow.migration-baseline.functions/1',
  measured_at_commit: require('child_process').execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(),
  counts: {
    modules: moduleFacts.length,
    modules_js: moduleFacts.filter((m) => m.path.endsWith('.js')).length,
    module_lines: moduleFacts.reduce((a, m) => a + m.lines, 0),
    exported_classes: moduleFacts.reduce((a, m) => a + m.classes.length, 0),
    exported_functions: moduleFacts.reduce((a, m) => a + m.functions.length, 0),
    storage_keys: new Set(storage.filter((s) => s.resolved && !s.pattern).map((s) => s.key)).size,
    storage_patterns: new Set(storage.filter((s) => s.pattern).map((s) => s.key)).size,
    external_request_sites: requests.length,
    tests: tests.length,
  },
  routes,
  subroutes,
  storage,
  requests,
  seo,
  build_scripts: buildScripts,
  generators,
  modules: moduleFacts,
  tests,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const serialized = `${JSON.stringify(out, null, 2)}\n`;

if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT_FILE)) {
    console.error(`FEHLT: ${path.relative(ROOT, OUT_FILE)}`);
    process.exit(1);
  }
  const current = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  // Der Commit-Hash aendert sich mit jedem Commit und ist kein Messwert.
  const comparable = `${JSON.stringify({ ...current, measured_at_commit: out.measured_at_commit }, null, 2)}\n`;
  if (comparable !== serialized) {
    console.error(
      'ABWEICHUNG: Messung weicht von docs/migration-baseline/evidence/functions/functions-baseline.json ab.'
    );
    process.exit(1);
  }
  console.log(`OK: ${path.relative(ROOT, OUT_FILE)} ist deckungsgleich (${serialized.length} Byte, Commit ignoriert).`);
} else {
  fs.writeFileSync(OUT_FILE, serialized);
  console.log(`geschrieben: ${path.relative(ROOT, OUT_FILE)} (${serialized.length} Byte)`);
  console.log(JSON.stringify(out.counts, null, 2));
}
