#!/usr/bin/env node
/**
 * Prüft den Migrationsbuild gegen die Abnahmekriterien.
 *
 * Geprüft wird der *tatsächliche* Build (`dist/`), nicht die Absicht im Code:
 *   1. Routenabdeckung — jede Adresse der Altlink-Map hat eine Datei,
 *      Kapitelanker sind vorhanden.
 *   2. Mengenparität — Anzahl Seiten je Bereich gegen die Datenmodule.
 *   3. SEO-Parität — Titel, Description und Canonical der zwölf Dokumente
 *      gegen die Bestandsdokumente (Marke/Origin normalisiert).
 *   4. Link-Check — jede interne `href`/`src` zeigt auf eine existierende Datei.
 *   5. Sitemap / robots — jede `<loc>` löst auf, robots verweist auf die Sitemap.
 *   6. Kopfprüfung — Title, Description und Canonical auf jeder Seite.
 *
 * Ergebnis: `docs/verifikation-migration.md`, Exit-Code 1 bei Fehlern.
 * Aufruf: node scripts/verify-migration.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const ORIGIN = 'https://velarkana.de';
const LEGACY_ORIGIN = 'https://ingbms.github.io/Esoterik-Welt/';

const problems = [];
const notes = [];
const sections = [];

/**
 * `dist/Esoterik-Welt/` ist die Vorschau-Ausgabe des Legacy-Builds
 * (`npm run build:legacy`), nicht Teil der Astro-Seite. Sie wird von den
 * Prüfungen ausgenommen — sonst würden Alt-Artefakte (z. B. Platzhalter in
 * `Lokal.html`) als Befunde der Migration erscheinen.
 */
const LEGACY_DIST = path.join(dist, 'Esoterik-Welt');

function fail(section, message) {
  problems.push({ section, message });
}

function section(title, rows) {
  sections.push({ title, rows });
}

function walk(dir, predicate, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (full === LEGACY_DIST) continue;
    if (entry.isDirectory()) walk(full, predicate, acc);
    else if (predicate(full)) acc.push(full);
  }
  return acc;
}

const rel = (file) => path.relative(dist, file).split(path.sep).join('/');

/** Pfad (URL-Form) → Datei in dist, oder null. */
function resolveDistPath(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0].split('#')[0]);
  if (clean === '/' || clean === '') return path.join(dist, 'index.html');
  if (clean.endsWith('/')) return path.join(dist, clean, 'index.html');
  const direct = path.join(dist, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  const withHtml = `${direct}.html`;
  if (fs.existsSync(withHtml)) return withHtml;
  return null;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function meta(html, pattern) {
  const match = pattern.exec(html);
  return match ? match[1].trim() : null;
}

const titleOf = (html) => meta(html, /<title>([\s\S]*?)<\/title>/i);
const descriptionOf = (html) => meta(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
const canonicalOf = (html) => meta(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
const robotsOf = (html) => meta(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);

/** Marke und Origin des Bestands auf den Migrationsstand normalisieren. */
function normalize(text) {
  if (!text) return text;
  // Erst Origin, dann Marke: umgekehrt würde die Markenersetzung auch die
  // Adresse verändern (`.../Esoterik-Welt/` → `.../VELARKANA/`) und der
  // Canonical-Vergleich schlüge falsch fehl.
  return text
    .split(LEGACY_ORIGIN)
    .join(`${ORIGIN}/`)
    .split('https://ingbms.github.io/Esoterik-Welt')
    .join(ORIGIN)
    .split('Esoterik-Welt')
    .join('VELARKANA');
}

function decodeEntities(text) {
  return String(text ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

// ---------------------------------------------------------------------------
// 1. Routenabdeckung über die Altlink-Map
// ---------------------------------------------------------------------------
function checkLegacyRoutes(htmlFiles) {
  const mapSource = read(path.join(root, 'src/lib/legacy-routes.generated.ts'));
  const entries = [...mapSource.matchAll(/^\s*"([^"]+)": "([^"]+)",$/gm)].map((match) => ({
    hash: match[1],
    target: match[2],
  }));
  const rows = [];
  let missingTargets = 0;
  let missingAnchors = 0;
  let checkedAnchors = 0;

  for (const entry of entries) {
    const [pathname, anchor] = entry.target.split('#');
    const file = resolveDistPath(pathname);
    if (!file) {
      missingTargets += 1;
      fail('Routen', `#${entry.hash} → ${entry.target}: Datei fehlt`);
      continue;
    }
    if (anchor) {
      checkedAnchors += 1;
      const html = read(file);
      if (!new RegExp(`id="${anchor}"`).test(html)) {
        missingAnchors += 1;
        fail('Routen', `#${entry.hash} → ${entry.target}: Anker #${anchor} fehlt in ${rel(file)}`);
      }
    }
  }

  const families = new Map();
  for (const entry of entries) {
    const key = entry.hash.includes('/') ? entry.hash.split('/')[0] : '(Bereiche)';
    families.set(key, (families.get(key) ?? 0) + 1);
  }
  for (const [key, count] of [...families.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    rows.push([`#${key}`, String(count), '']);
  }

  rows.unshift([
    'Altadressen gesamt',
    String(entries.length),
    missingTargets === 0 ? 'alle auflösbar' : `${missingTargets} fehlen`,
  ]);
  rows.push([
    'Kapitelanker geprüft',
    String(checkedAnchors),
    missingAnchors === 0 ? 'alle vorhanden' : `${missingAnchors} fehlen`,
  ]);
  rows.push(['HTML-Dateien im Build', String(htmlFiles.length), '']);
  section('1. Routenabdeckung (Altlink-Map → Build)', rows);
  notes.push(`Altlink-Map: ${entries.length} Adressen, ${checkedAnchors} davon mit Anker.`);
}

// ---------------------------------------------------------------------------
// 2. Mengenparität gegen die Datenmodule
// ---------------------------------------------------------------------------
async function checkCounts() {
  const dataUrl = (file) => pathToFileURL(path.join(root, 'js/data', file)).href;
  const astro = await import(dataUrl('astrologie.js'));
  const rad = await import(dataUrl('radiasthesie.js'));
  const crystals = JSON.parse(read(path.join(root, 'data/crystals.json')));
  const frequencies = JSON.parse(read(path.join(root, 'data/frequencies.json')));

  const countFiles = (dir) => {
    const full = path.join(dist, dir);
    if (!fs.existsSync(full)) return 0;
    return fs.readdirSync(full).filter((name) => name.endsWith('.html')).length;
  };

  const expectations = [
    ['Zeichen (12 + Index)', 'astrologie/zeichen', astro.ZEICHEN.length + 1],
    ['Faktoren (10 + Index)', 'astrologie/faktoren', astro.FAKTOREN.length + 1],
    ['Häuser (12 + Index)', 'astrologie/haeuser', astro.HAEUSER.length + 1],
    ['Aspekte (5 + Index)', 'astrologie/aspekte', astro.ASPEKTE.length + 1],
    ['Grundlagen (24 + Index)', 'astrologie/grundlagen', astro.GRUNDLAGEN.length + 1],
    ['Lehrbeispiele (4 + Index)', 'astrologie/beispiele', astro.BEISPIELE.length + 1],
    ['Lernpfad (6 + Index)', 'astrologie/lernpfad', astro.LERNPFAD.length + 1],
    ['Farbwelten (18 Collection + 3 Werkzeuge)', 'farbwelten', 18 + 3],
    ['Artikel', 'wissen', readDirCount(path.join(root, 'src/content/articles')) + 1],
    ['Radiästhesie-Dokumente', 'radiasthesie', Object.keys(rad.RADIASTHESIE.topics).length + 4],
    ['Frequenzen (5)', 'frequenzen', 5],
    ['Pendeln-Werkzeuge (5)', 'pendeln', 5],
  ];

  function readDirCount(dir) {
    return fs.readdirSync(dir).filter((name) => name.endsWith('.md')).length;
  }

  const rows = [];
  for (const [label, dir, expected] of expectations) {
    const actual = countFiles(dir);
    const ok = actual === expected;
    if (!ok) fail('Mengen', `${label}: erwartet ${expected}, gebaut ${actual}`);
    rows.push([label, String(expected), String(actual), ok ? 'ok' : 'ABWEICHUNG']);
  }

  rows.push([
    'Kristalle (Datenbestand)',
    '30',
    String(crystals.crystals.length),
    crystals.crystals.length === 30 ? 'ok' : 'ABWEICHUNG',
  ]);
  rows.push([
    'Frequenzeinträge (Datenbestand)',
    '41',
    String(frequencies.frequencies.length),
    frequencies.frequencies.length === 41 ? 'ok' : 'ABWEICHUNG',
  ]);
  section('2. Mengenparität (Datenmodule → Build)', rows);
}

// ---------------------------------------------------------------------------
// 3. SEO-Parität der zwölf Dokumente
// ---------------------------------------------------------------------------
function checkSeoParity() {
  const documents = [
    ['index.html', 'index.html'],
    ['404.html', '404.html'],
    ['impressum.html', 'impressum.html'],
    ['datenschutz.html', 'datenschutz.html'],
    ['haftung.html', 'haftung.html'],
    ['radiasthesie/index.html', 'radiasthesie/index.html'],
    ['radiasthesie/radiasthesie.html', 'radiasthesie/radiasthesie.html'],
    ['radiasthesie/pendeln.html', 'radiasthesie/pendeln.html'],
    ['radiasthesie/orakel.html', 'radiasthesie/orakel.html'],
    ['radiasthesie/glossar.html', 'radiasthesie/glossar.html'],
    ['radiasthesie/quellen.html', 'radiasthesie/quellen.html'],
    ['radiasthesie/methodik.html', 'radiasthesie/methodik.html'],
  ];

  const rows = [];
  for (const [legacyPath, nextPath] of documents) {
    const legacyFile = path.join(root, legacyPath);
    const nextFile = path.join(dist, nextPath);
    if (!fs.existsSync(legacyFile)) {
      fail('SEO', `Bestandsdokument fehlt: ${legacyPath}`);
      continue;
    }
    if (!fs.existsSync(nextFile)) {
      fail('SEO', `Zieldokument fehlt im Build: ${nextPath}`);
      continue;
    }
    const legacyHtml = read(legacyFile);
    const nextHtml = read(nextFile);

    const checks = [
      ['Titel', decodeEntities(titleOf(legacyHtml)), decodeEntities(titleOf(nextHtml))],
      ['Description', decodeEntities(descriptionOf(legacyHtml)), decodeEntities(descriptionOf(nextHtml))],
      ['Canonical', canonicalOf(legacyHtml), canonicalOf(nextHtml)],
    ];

    for (const [field, legacyValue, nextValue] of checks) {
      const expected = normalize(legacyValue);
      let actual = nextValue;
      if (field === 'Canonical' && actual) {
        // Kanonische Adresse der Verzeichnisroute ohne index.html vergleichen.
        actual = actual.replace(/index\.html$/, '');
      }
      const ok =
        field === 'Canonical'
          ? normalize(expected) === normalize(actual) || (expected == null && actual == null)
          : expected === actual;
      if (!ok) {
        fail('SEO', `${nextPath}: ${field} weicht ab\n  Bestand: ${expected}\n  Build:   ${actual}`);
      }
      rows.push([nextPath, field, ok ? 'gleich' : 'ABWEICHUNG', ok ? '' : `${expected ?? '—'} → ${actual ?? '—'}`]);
    }
  }
  section('3. SEO-Parität der zwölf Dokumente', rows);
  notes.push(
    'Vergleich normalisiert Marke (Esoterik-Welt → VELARKANA) und Origin (' +
      `${LEGACY_ORIGIN} → ${ORIGIN}/): der Domainwechsel ist Entscheidung E5/F1, keine Textänderung.`
  );
}

// ---------------------------------------------------------------------------
// 4. Link-Check auf dem Build
// ---------------------------------------------------------------------------
function checkLinks(htmlFiles) {
  let checked = 0;
  const broken = new Map();
  const ignored = { mailto: 0, tel: 0, external: 0, fragment: 0, data: 0 };

  for (const file of htmlFiles) {
    const html = read(file);
    const pageUrl = `/${rel(file)}`.replace(/index\.html$/, '');
    for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const raw = decodeEntities(match[1]);
      if (!raw) continue;
      if (raw.startsWith('#')) {
        ignored.fragment += 1;
        continue;
      }
      if (raw.startsWith('mailto:')) {
        ignored.mailto += 1;
        continue;
      }
      if (raw.startsWith('tel:')) {
        ignored.tel += 1;
        continue;
      }
      if (raw.startsWith('data:')) {
        ignored.data += 1;
        continue;
      }
      if (/^https?:\/\//.test(raw)) {
        if (raw.startsWith(ORIGIN)) {
          // Absolute eigene Adresse: als interner Link prüfen.
        } else {
          ignored.external += 1;
          continue;
        }
      }
      checked += 1;
      const url = /^https?:\/\//.test(raw) ? new URL(raw).pathname : new URL(raw, `https://x${pageUrl}`).pathname;
      const target = resolveDistPath(url);
      if (!target) {
        const key = `${url}`;
        if (!broken.has(key)) broken.set(key, []);
        broken.get(key).push(rel(file));
      }
    }
  }

  for (const [url, pages] of broken) {
    fail(
      'Links',
      `${url} fehlt (verlinkt von ${[...new Set(pages)].slice(0, 3).join(', ')}${pages.length > 3 ? ' …' : ''})`
    );
  }

  section('4. Link-Check', [
    ['geprüfte interne Verweise', String(checked), ''],
    ['externe Verweise (nicht geprüft)', String(ignored.external), ''],
    ['Fragment-/mailto-/data-Verweise', String(ignored.fragment + ignored.mailto + ignored.data), ''],
    ['tote interne Ziele', String(broken.size), broken.size === 0 ? 'keine' : 'siehe Befunde'],
  ]);
}

// ---------------------------------------------------------------------------
// 5. Sitemap, robots, Kopfprüfung
// ---------------------------------------------------------------------------
function checkSitemapAndHeads(htmlFiles) {
  const sitemapFile = path.join(dist, 'sitemap-0.xml');
  let locs = [];
  if (!fs.existsSync(sitemapFile)) {
    fail('Sitemap', 'dist/sitemap-0.xml fehlt');
  } else {
    locs = [...read(sitemapFile).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    let unresolved = 0;
    for (const loc of locs) {
      const url = new URL(loc);
      if (url.pathname.endsWith('/')) {
        if (!resolveDistPath(url.pathname)) {
          unresolved += 1;
          fail('Sitemap', `${loc} hat keine Datei`);
        }
      } else if (!resolveDistPath(url.pathname)) {
        unresolved += 1;
        fail('Sitemap', `${loc} hat keine Datei`);
      }
    }
    section('5. Sitemap und robots', [
      ['`<loc>`-Einträge', String(locs.length), unresolved === 0 ? 'alle auflösbar' : `${unresolved} offen`],
      [
        'Sitemap-Datei',
        'dist/sitemap-0.xml',
        fs.existsSync(path.join(dist, 'sitemap-index.xml')) ? 'index vorhanden' : 'index fehlt',
      ],
    ]);
  }

  const robotsFile = path.join(dist, 'robots.txt');
  if (!fs.existsSync(robotsFile)) {
    fail('robots', 'dist/robots.txt fehlt');
  } else {
    const robots = read(robotsFile);
    if (!/Sitemap:\s*https?:\/\//.test(robots)) fail('robots', 'robots.txt nennt keine Sitemap');
    if (/Disallow:\s*\/[^/\s]/.test(robots.replace(/Disallow:\s*$/gm, ''))) {
      notes.push('robots.txt enthält Disallow-Regeln — prüfen, ob sie Website-Inhalte treffen.');
    }
  }

  // Kopfprüfung: jede Seite braucht Titel und Description; Canonical außer 404.
  let missingTitle = 0;
  let missingDescription = 0;
  let missingCanonical = 0;
  for (const file of htmlFiles) {
    const name = rel(file);
    if (name.startsWith('assets/')) continue;
    const html = read(file);
    if (!titleOf(html)) {
      missingTitle += 1;
      fail('Kopf', `${name}: <title> fehlt`);
    }
    if (!descriptionOf(html)) {
      missingDescription += 1;
      fail('Kopf', `${name}: meta description fehlt`);
    }
    if (name !== '404.html' && !canonicalOf(html)) {
      missingCanonical += 1;
      fail('Kopf', `${name}: canonical fehlt`);
    }
    if (name === '404.html' && robotsOf(html) && !/noindex/.test(robotsOf(html))) {
      notes.push('404.html sollte noindex tragen (ist gesetzt: ' + robotsOf(html) + ').');
    }
  }
  section('5b. Kopfprüfung aller Seiten', [
    ['Seiten ohne <title>', String(missingTitle), missingTitle === 0 ? 'keine' : 'siehe Befunde'],
    ['Seiten ohne Description', String(missingDescription), missingDescription === 0 ? 'keine' : 'siehe Befunde'],
    ['Seiten ohne Canonical (außer 404)', String(missingCanonical), missingCanonical === 0 ? 'keine' : 'siehe Befunde'],
  ]);
}

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
function writeReport(htmlFiles) {
  const lines = [
    '# Verifikation der Astro-Migration',
    '',
    'Automatisch erzeugt von `scripts/verify-migration.cjs` gegen `dist/`.',
    'Nicht von Hand bearbeiten — Skript erneut ausführen.',
    '',
    `- Basis-Commit: siehe \`git log -1\``,
    `- Geprüfte HTML-Dateien: ${htmlFiles.length}`,
    `- Befunde: ${problems.length}`,
    '',
  ];

  for (const { title, rows } of sections) {
    lines.push(`## ${title}`, '');
    lines.push('| Gegenstand | Erwartet | Gebaut | Status |');
    lines.push('|---|---|---|---|');
    for (const row of rows) lines.push(`| ${row.join(' | ')} |`);
    lines.push('');
  }

  if (notes.length) {
    lines.push('## Hinweise', '');
    for (const note of notes) lines.push(`- ${note}`);
    lines.push('');
  }

  lines.push('## Befunde', '');
  if (problems.length === 0) {
    lines.push('Keine. Alle geprüften Kriterien sind erfüllt.');
  } else {
    for (const problem of problems) {
      lines.push(`### ${problem.section}`, '', '```', problem.message, '```', '');
    }
  }
  lines.push('');

  fs.writeFileSync(path.join(root, 'docs/verifikation-migration.md'), lines.join('\n'), 'utf8');
}

(async () => {
  if (!fs.existsSync(dist)) {
    console.error('dist/ fehlt — zuerst `npm run build` ausführen.');
    process.exit(1);
  }
  const htmlFiles = walk(dist, (file) => file.endsWith('.html'));
  checkLegacyRoutes(htmlFiles);
  await checkCounts();
  checkSeoParity();
  checkLinks(htmlFiles);
  checkSitemapAndHeads(htmlFiles);
  writeReport(htmlFiles);

  console.log(`Geprüft: ${htmlFiles.length} HTML-Dateien, ${problems.length} Befunde.`);
  if (problems.length > 0) {
    for (const problem of problems.slice(0, 40)) console.log(`- [${problem.section}] ${problem.message}`);
    process.exit(1);
  }
  console.log('Alle Kriterien erfüllt. Bericht: docs/verifikation-migration.md');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
