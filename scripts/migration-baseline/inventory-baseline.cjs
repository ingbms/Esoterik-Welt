'use strict';
// Erhebt den Ist-Bestand des Release-Stands fuer docs/migration-baseline/00-schema-und-scope.md.
// Jede Zahl der Scope-Abgrenzung muss mit diesem Skript reproduzierbar sein.
//
//   node scripts/migration-baseline/inventory-baseline.cjs            # JSON nach stdout
//   node scripts/migration-baseline/inventory-baseline.cjs --write    # zusaetzlich nach docs/migration-baseline/inventory-baseline.json
//   node scripts/migration-baseline/inventory-baseline.cjs --check    # Exit 1, wenn die Datei abweicht
//
// Bewusst ohne Abhaengigkeiten und ohne Git-Aufruf: der Commit wird aus der
// Umgebungsvariable GIT_COMMIT uebernommen, damit das Ergebnis nicht davon
// abhaengt, ob git im PATH liegt.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_FILE = path.join(ROOT, 'docs', 'migration-baseline', 'inventory-baseline.json');

// Muss mit scripts/build-pages.cjs ENTRIES uebereinstimmen; wird unten geprueft.
const SHIPPED_ENTRIES = [
  'index.html',
  'impressum.html',
  'datenschutz.html',
  'haftung.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'css',
  'js',
  'data',
  'assets',
  'radiasthesie',
  'content',
];
const SHIPPED_SINGLE_DOCUMENTS = ['docs/frequenz-quellen.md'];
const BUILT_BY = 'scripts/generate-radiasthesie-pages.cjs';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// Titel werden im Scope-Dokument zitiert; Entities wie &amp; oder &shy; gehoeren nicht in den Katalogtext.
function decodeEntities(text) {
  return text
    .replace(/&shy;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

function cleanText(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function walk(rel, filter) {
  const out = [];
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return out;
  const stack = [rel];
  while (stack.length) {
    const current = stack.pop();
    for (const item of fs.readdirSync(path.join(ROOT, current), { withFileTypes: true })) {
      const child = `${current}/${item.name}`;
      if (item.isDirectory()) stack.push(child);
      else if (!filter || filter(child)) out.push(child);
    }
  }
  return out.sort();
}

function lineOf(text, needle) {
  const index = text.indexOf(needle);
  if (index < 0) return null;
  return text.slice(0, index).split('\n').length;
}

// --- Seiten und Navigation -------------------------------------------------

function pages() {
  const indexHtml = read('index.html');
  const mainJs = read('js/main.js');

  const mainPagesBlock = /const MAIN_PAGES = \[([\s\S]*?)\];/.exec(mainJs);
  const mainPages = mainPagesBlock
    ? [...mainPagesBlock[1].matchAll(/'([a-z-]+)'/g)].map((match) => match[1])
    : [];

  const navBlock = /<nav class="nav"[\s\S]*?<\/nav>/.exec(indexHtml);
  const nav = navBlock
    ? [...navBlock[0].matchAll(/<a href="#([a-z-]+)"[^>]*data-page="([a-z-]+)">([^<]+)<\/a>/g)].map((match) => ({
        route: `#${match[1]}`,
        page: match[2],
        label: match[3],
      }))
    : [];

  // Nur die Rubrik-<section>, nicht die inneren Bausteine.
  const sections = [];
  const sectionRe = /<section id="([a-z-]+)" class="page[^"]*"[^>]*>/g;
  let match;
  while ((match = sectionRe.exec(indexHtml)) !== null) {
    sections.push({
      id: match[1],
      line: indexHtml.slice(0, match.index).split('\n').length,
    });
  }

  const headings = [];
  const h1Re = /<h1 id="([a-z-]+)"[^>]*>([\s\S]*?)<\/h1>/g;
  while ((match = h1Re.exec(indexHtml)) !== null) {
    headings.push({
      id: match[1],
      line: indexHtml.slice(0, match.index).split('\n').length,
      text: cleanText(match[2]),
    });
  }

  return {
    main_pages: mainPages,
    main_pages_count: mainPages.length,
    nav_entries: nav,
    nav_entries_count: nav.length,
    page_sections: sections,
    h1_headings: headings,
    index_html_lines: indexHtml.split('\n').length,
  };
}

// --- Statische Dokumente ---------------------------------------------------

function staticDocuments() {
  const docs = [];
  for (const file of ['impressum.html', 'datenschutz.html', 'haftung.html', '404.html']) {
    if (!exists(file)) continue;
    const html = read(file);
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
    docs.push({
      path: file,
      title: h1 ? cleanText(h1[1]) : null,
      h1_line: h1 ? lineOf(html, h1[0]) : null,
      bytes: fs.statSync(path.join(ROOT, file)).size,
    });
  }
  const radiasthesie = walk('radiasthesie', (file) => file.endsWith('.html')).map((file) => {
    const html = read(file);
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
    return {
      path: file,
      title: h1 ? cleanText(h1[1]) : null,
      h1_line: h1 ? lineOf(html, h1[0]) : null,
    };
  });
  const sitemap = read('sitemap.xml');
  return {
    root_documents: docs,
    radiasthesie_documents: radiasthesie,
    radiasthesie_documents_count: radiasthesie.length,
    sitemap_urls: [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
    generated_by: BUILT_BY,
  };
}

// --- Farbwelten -----------------------------------------------------------

function farbwelten() {
  const source = read('js/data/farbwelten.js');
  const between = (startMarker, endMarker) => {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker);
    if (start < 0 || end < 0 || end <= start) return '';
    return source.slice(start, end);
  };
  const farbBlock = between('export const FARBWELTEN = [', 'export const LANDING');
  const topicBlock = between('export const TOPIC_PAGES = [', 'export const COMPASS');

  const colours = [...farbBlock.matchAll(/\n    id: '([a-z]+)',\n    name: '([^']+)',\n    route: '#([^']+)',/g)].map((match) => ({
    id: match[1],
    name: match[2],
    route: `#${match[3]}`,
  }));
  const topics = [...topicBlock.matchAll(/\n    slug: '([a-z-]+)',\n    title: '([^']+)',/g)].map((match) => ({
    slug: match[1],
    title: match[2],
    route: `#farbwelten/${match[1]}`,
  }));
  const mdFiles = walk('content/farbwelten', (file) => file.endsWith('.md')).map((file) => {
    const text = read(file);
    const slug = /^slug: (.+)$/m.exec(text);
    const type = /^seite: (.+)$/m.exec(text);
    return { path: file, slug: slug ? slug[1].trim() : null, seite: type ? type[1].trim() : null };
  });

  return {
    data_module: 'js/data/farbwelten.js',
    generated_by: 'scripts/generate-farbwelten-data.cjs',
    colours,
    colours_count: colours.length,
    topic_pages: topics,
    topic_pages_count: topics.length,
    has_landing: source.includes('export const LANDING'),
    has_chakren_page: source.includes('export const CHAKREN_PAGE'),
    has_light_page: source.includes('export const LIGHT_PAGE'),
    markdown_sources: mdFiles,
    markdown_sources_count: mdFiles.length,
  };
}

// --- Artikel --------------------------------------------------------------

function articles() {
  const source = read('js/data/articles.js');
  const ids = [...source.matchAll(/^    id: ([0-9]+),$/gm)].map((match) => Number(match[1]));
  const rendered = ids.length;
  const markdown = walk('data/articles', (file) => file.endsWith('.md'));
  return {
    rendered_source: 'js/data/articles.js',
    rendered_count: rendered,
    rendered_ids: ids,
    markdown_source_dir: 'data/articles',
    markdown_count: markdown.length,
    markdown_files: markdown,
    markdown_read_by_blog_module: /article-0?\d+\.md/.test(read('js/modules/blog.js')),
  };
}

// --- Design-Tokens --------------------------------------------------------

function designTokens() {
  const css = read('css/design-system.css');
  const rootStart = css.indexOf(':root {');
  const lightStart = css.indexOf("[data-theme='light'] {");
  const rootBlock = css.slice(rootStart, lightStart > rootStart ? lightStart : undefined);
  const lightEnd = lightStart >= 0 ? css.indexOf('\n}', lightStart) : -1;
  const lightBlock = lightStart >= 0 ? css.slice(lightStart, lightEnd >= 0 ? lightEnd : undefined) : '';

  const names = (block) => [...block.matchAll(/^\s{2}(--[a-z0-9-]+):/gm)].map((match) => match[1]);

  const rootNames = names(rootBlock);
  const lightNames = names(lightBlock);
  const families = {};
  for (const name of rootNames) {
    const family = /^--(color|space|radius|font|text|line|weight|transition|shadow|z|container|dur|ease|tracking|breakpoint)/.exec(name);
    const key = family ? family[1] : 'sonstige';
    families[key] = (families[key] || 0) + 1;
  }

  const lightOnly = lightNames.filter((name) => !rootNames.includes(name));
  const shadows = [...new Set(lightNames.filter((name) => rootNames.includes(name)))];

  // Klassen-Selektoren auf oberster Ebene = Komponentenkandidaten.
  const selectors = [...css.matchAll(/^\.([a-z][a-z0-9-]*)(?:[,:.\s{])/gm)].map((match) => match[1]);
  const classes = [...new Set(selectors)].sort();
  // Erster Namensbestandteil vor dem ersten Bindestrich. Die Klassennamen folgen
  // keinem BEM-Muster mit __, deshalb ist das Praefix (btn, card, badge, nav, ...)
  // die naechstliegende Naeherung an eine Komponente — bewusst als Pruefliste,
  // nicht als fertige Komponentenliste.
  const classPrefixes = [...new Set(classes.map((name) => name.split('-')[0]))].sort();

  return {
    file: 'css/design-system.css',
    total_lines: css.split('\n').length,
    root_block_line: lineOf(css, ':root {'),
    light_block_line: lightStart >= 0 ? lineOf(css, "[data-theme='light'] {") : null,
    root_token_count: rootNames.length,
    root_tokens: rootNames,
    root_token_families: families,
    light_block_token_count: lightNames.length,
    light_block_overrides_root: shadows,
    light_block_only: lightOnly,
    class_selectors_count: classes.length,
    class_selectors: classes,
    class_prefixes_count: classPrefixes.length,
    class_prefixes: classPrefixes,
    light_theme_used_by_html: /data-theme=/.test(read('index.html')),
  };
}

// --- Breakpoints ----------------------------------------------------------

function breakpoints() {
  const files = walk('css', (file) => file.endsWith('.css'));
  const perFile = {};
  const counts = {};
  const fileSets = {};
  for (const file of files) {
    const css = read(file);
    const values = [...css.matchAll(/@media[^{]*?\((?:max|min)-width:\s*([0-9.]+px)\)/g)].map((match) => match[1]);
    if (!values.length) continue;
    perFile[file] = values.length;
    for (const value of values) {
      counts[value] = (counts[value] || 0) + 1;
      fileSets[value] = fileSets[value] || new Set();
      fileSets[value].add(file);
    }
  }
  const sorted = Object.entries(counts).sort(
    (a, b) => b[1] - a[1] || Number.parseFloat(a[0]) - Number.parseFloat(b[0])
  );
  const sharedAcrossFiles = sorted
    .filter(([width]) => fileSets[width].size >= 2)
    .map(([width, count]) => ({ width, occurrences: count, files: [...fileSets[width]].sort() }));
  return {
    files_with_media_queries: perFile,
    distinct_widths_count: sorted.length,
    distinct_widths_by_frequency: sorted.map(([width, count]) => ({
      width,
      count,
      files: fileSets[width].size,
    })),
    widths_used_in_two_or_more_files: sharedAcrossFiles,
    widths_used_in_two_or_more_files_count: sharedAcrossFiles.length,
    most_frequent_width: sorted.length ? sorted[0][0] : null,
    main_700px_line: lineOf(read('css/main.css'), '@media (max-width: 700px)'),
  };
}

// --- Assets und Daten -----------------------------------------------------

function assets() {
  const files = walk('assets');
  const byDir = {};
  const byExt = {};
  let bytes = 0;
  for (const file of files) {
    const top = file.split('/').slice(0, 2).join('/');
    byDir[top] = (byDir[top] || 0) + 1;
    const ext = (path.extname(file).slice(1) || 'ohne').toLowerCase();
    byExt[ext] = (byExt[ext] || 0) + 1;
    bytes += fs.statSync(path.join(ROOT, file)).size;
  }
  const decks = {};
  for (const deck of ['nachtatelier-v1', 'gartenbrevier-v2']) {
    const dir = `assets/tarot/${deck}`;
    decks[deck] = exists(dir) ? walk(dir).length : 0;
  }
  return {
    files_total: files.length,
    bytes_total: bytes,
    by_top_directory: Object.fromEntries(Object.entries(byDir).sort()),
    by_extension: Object.fromEntries(Object.entries(byExt).sort((a, b) => b[1] - a[1])),
    tarot_decks: decks,
    tarot_decks_registry: 'js/data/tarot-decks.js',
  };
}

function dataFiles() {
  const files = walk('data', (file) => !file.includes('/articles/'));
  return files.map((file) => ({
    path: file,
    bytes: fs.statSync(path.join(ROOT, file)).size,
  }));
}

function jsModules() {
  const modules = walk('js/modules', (file) => file.endsWith('.js') && !file.endsWith('.bak') && !file.endsWith('.bak2'));
  const data = walk('js/data', (file) => file.endsWith('.js') && !file.endsWith('.bak') && !file.endsWith('.bak2'));
  return {
    modules_count: modules.length,
    modules,
    data_modules_count: data.length,
    data_modules: data,
  };
}

// --- Abgrenzung ----------------------------------------------------------

function scope() {
  const check = (rel) => ({
    path: rel,
    exists: exists(rel),
    in_baseline_commit: null, // wird nur mit git beantwortet; hier bewusst offen gelassen
  });
  return {
    shipped_entries_from_build_pages: SHIPPED_ENTRIES,
    shipped_single_documents: SHIPPED_SINGLE_DOCUMENTS,
    not_shipped_candidates: ['docs', 'evidence', 'public', 'scripts', 'tests', 'qa', 'node_modules', 'dist'].map(check),
    legacy_public_placeholder: {
      path: 'public',
      exists: exists('public'),
      reason: 'build-pages.cjs kopiert public/ nicht; der Ordner ist ein alter Platzhalter (public/index.html, public/styles.css) und wird nicht ausgeliefert.',
      file_count: exists('public') ? walk('public').length : 0,
    },
  };
}

// --- Zusammenbau ----------------------------------------------------------

function hashDir(rel) {
  const files = walk(rel);
  const hash = crypto.createHash('sha256');
  for (const file of files) hash.update(`${file}\n`).update(fs.readFileSync(path.join(ROOT, file)));
  return { files: files.length, sha256: hash.digest('hex') };
}

function collect() {
  return {
    $comment:
      'Erzeugt von scripts/migration-baseline/inventory-baseline.cjs. Zahlen sind Messwerte des Arbeitsbaums, nicht Behauptungen. base_commit ist der Commit, gegen den der Katalog erhoben wird.',
    schema_version: '1.0.0',
    scope_document: 'docs/migration-baseline/00-schema-und-scope.md',
    base_commit: process.env.GIT_COMMIT || null,
    base_tag: process.env.GIT_TAG || null,
    collected_at: new Date().toISOString(),
    pages: pages(),
    static_documents: staticDocuments(),
    farbwelten: farbwelten(),
    articles: articles(),
    design_tokens: designTokens(),
    breakpoints: breakpoints(),
    assets: assets(),
    data_files: dataFiles(),
    js: jsModules(),
    scope: scope(),
    hashes: {
      css: hashDir('css'),
      js: hashDir('js'),
      'js/data': hashDir('js/data'),
      content: hashDir('content'),
      radiasthesie: hashDir('radiasthesie'),
    },
  };
}

function main() {
  const argv = process.argv.slice(2);
  const inventory = collect();
  const json = `${JSON.stringify(inventory, null, 2)}\n`;

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Erhebt den Ist-Bestand des Release-Stands. Optionen: --write, --check, --summary');
    return;
  }
  if (argv.includes('--check')) {
    const existing = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : null;
    if (existing === null) {
      console.error(`ABWEICHUNG ${path.relative(ROOT, OUT_FILE).split(path.sep).join('/')} fehlt.`);
      process.exit(1);
    }
    const current = JSON.parse(existing);
    const strip = (doc) => {
      const copy = { ...doc };
      delete copy.collected_at;
      delete copy.base_commit;
      delete copy.base_tag;
      delete copy.hashes;
      return JSON.stringify(copy, null, 2);
    };
    if (strip(current) !== strip(inventory)) {
      console.error('ABWEICHUNG: inventory-baseline.json ist nicht mehr aktuell. Bitte mit --write neu erzeugen.');
      process.exit(1);
    }
    console.log('OK: inventory-baseline.json entspricht dem Arbeitsbaum (Zeitstempel, Commit und Hashes ausgenommen).');
    return;
  }
  if (argv.includes('--summary')) {
    const p = inventory.pages;
    console.log(`Hauptseiten:            ${p.main_pages_count} (${p.main_pages.join(', ')})`);
    console.log(`Startseitenzugaenge:    ${p.nav_entries_count}`);
    console.log(`Farbwelten:             ${inventory.farbwelten.colours_count}`);
    console.log(`Farbwelten-Themenseiten:${inventory.farbwelten.topic_pages_count} (${inventory.farbwelten.topic_pages.map((t) => t.slug).join(', ')})`);
    console.log(`Markdown-Farbquellen:   ${inventory.farbwelten.markdown_sources_count}`);
    console.log(`Radiasthesie-Dokumente: ${inventory.static_documents.radiasthesie_documents_count}`);
    console.log(`Artikel gerendert:      ${inventory.articles.rendered_count}`);
    console.log(`Artikel als Markdown:   ${inventory.articles.markdown_count}`);
    console.log(`CSS-Tokens (:root):     ${inventory.design_tokens.root_token_count}`);
    console.log(`Klassen-Selektoren:     ${inventory.design_tokens.class_selectors_count}`);
    console.log(`Klassen-Praefixe:      ${inventory.design_tokens.class_prefixes_count}`);
    console.log(`Umbruchpunkte:          ${inventory.breakpoints.distinct_widths_count} verschiedene Breiten`);
    console.log(`Assets:                 ${inventory.assets.files_total} Dateien, ${Math.round(inventory.assets.bytes_total / 1024)} KiB`);
    return;
  }
  if (argv.includes('--write')) {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, json, 'utf8');
    console.log(`geschrieben ${path.relative(ROOT, OUT_FILE).split(path.sep).join('/')}`);
    return;
  }
  process.stdout.write(json);
}

main();
