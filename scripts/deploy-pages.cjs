/**
 * Bereitet den Astro-Build für GitHub Pages (Projektadresse) auf und prüft das
 * öffentliche Artefakt.
 *
 * Warum ein eigener Schritt: Der Build ist für die Domain `velarkana.de`
 * erzeugt (Canonicals, Sitemap, OpenGraph). Solange die Domain nicht
 * konnektiert ist, muss die Projektadresse funktionieren:
 *   https://ingbms.github.io/velarkana/
 * GitHub Pages liefert Projektseiten unter einem Pfadpräfix aus; absolute
 * Wurzelpfade (`/assets/…`, `/tarot.html`) würden dort ins Leere zeigen.
 * Dieses Skript
 *   1. kopiert `dist/` in ein isoliertes Deployment-Verzeichnis,
 *   2. ersetzt `https://velarkana.de/` durch die Projektadresse,
 *   3. präfixiert wurzelabsolute `href`/`src`/`url()` mit `/velarkana/`,
 *   4. prüft, dass jede interne Adresse im Artefakt auflösbar ist,
 *   5. bricht bei Entwicklungsdateien (Quellcode, Tests, Docs) ab.
 *
 * Aufruf:
 *   node scripts/deploy-pages.cjs            # nur vorbereiten und prüfen
 *   node scripts/deploy-pages.cjs --push     # zusätzlich nach velarkana pushen
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, '.deploy', 'velarkana');
const SITE = 'https://velarkana.de/';
const PAGES = 'https://ingbms.github.io/velarkana/';
const PREFIX = '/velarkana/';
const REPO = 'https://github.com/ingbms/velarkana.git';

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.css', '.js', '.txt', '.json', '.svg']);
const FORBIDDEN = [/^src\//, /^tests\//, /^docs\//, /^scripts\//, /^qa\//, /\.ts$/, /\.astro$/, /^package(-lock)?\.json$/];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function rewrite(html) {
  let out = html.split(SITE).join(PAGES);
  // Wurzelabsolute Pfade präfixen; Protokoll-relative (//) bleiben unberührt.
  out = out.replace(/(href|src|poster|content)="\/(?!\/|velarkana\/)/g, `$1="${PREFIX}`);
  out = out.replace(/url\(\/(?!\/|velarkana\/)/g, `url(${PREFIX}`);
  // Dynamische Importe und Asset-Strings in gebündeltem JavaScript
  // (`import("/_astro/…")`, `new URL("/assets/…")`).
  out = out.replace(/(["'`])\/(_astro|assets)\//g, `$1${PREFIX}$2/`);
  // Preload-Karte von Vite: Deps stehen ohne führenden Schrägstrich, der
  // Preload-Helfer setzt `/` davor. Deshalb hier das Präfix ohne `/`.
  out = out.replace(/(["'`])_astro\//g, `$1${PREFIX.slice(1)}_astro/`);
  // Bereits präfixierte Adressen nicht doppelt präfixen.
  out = out.split(`${PREFIX}velarkana/`).join(PREFIX);
  return out;
}

function resolves(target) {
  const clean = target.split('#')[0].split('?')[0];
  if (!clean.startsWith(PREFIX)) return true; // extern, Mail, Telefon
  const rel = clean.slice(PREFIX.length);
  if (rel === '') return true;
  const full = path.join(OUT, decodeURIComponent(rel));
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return true;
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
    return fs.existsSync(path.join(full, 'index.html'));
  }
  // Dateien ohne Endung können Verzeichnisadressen sein.
  return fs.existsSync(path.join(full, 'index.html'));
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ fehlt — zuerst `npm run build` ausführen.');
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.cpSync(DIST, OUT, { recursive: true });

  const files = walk(OUT);
  let changed = 0;
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const before = fs.readFileSync(file, 'utf8');
    const after = rewrite(before);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      changed += 1;
    }
  }

  // Pflichtdateien für Pages.
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '', 'utf8');
  if (!fs.existsSync(path.join(OUT, '404.html'))) {
    console.error('404.html fehlt im Artefakt.');
    process.exit(1);
  }

  const problems = [];
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  let checkedLinks = 0;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const attrs = [...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map((match) => match[1]);
    for (const target of attrs) {
      if (!target.startsWith('/') || target.startsWith('//')) continue;
      checkedLinks += 1;
      if (!resolves(target)) problems.push(`${path.relative(OUT, file)} → ${target}`);
    }
  }

  for (const file of walk(OUT)) {
    const rel = path.relative(OUT, file).replace(/\\/g, '/');
    if (FORBIDDEN.some((pattern) => pattern.test(rel))) problems.push(`Verbotene Datei: ${rel}`);
  }

  const leftover = walk(OUT).filter((file) => {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) return false;
    return fs.readFileSync(file, 'utf8').includes(SITE);
  });

  if (leftover.length) problems.push(`Alte Domain in ${leftover.length} Dateien`);
  if (problems.length) {
    console.error('Artefaktprüfung fehlgeschlagen:');
    for (const problem of problems.slice(0, 30)) console.error('  -', problem);
    process.exit(1);
  }

  console.log(`Artefakt bereit: ${path.relative(ROOT, OUT)}`);
  console.log(`  HTML-Dateien: ${htmlFiles.length}`);
  console.log(`  umgeschriebene Dateien: ${changed}`);
  console.log(`  geprüfte interne Verweise: ${checkedLinks}`);
  console.log(`  alte Domain: 0`);
  console.log(`  verbotene Dateien: 0`);
  console.log(`  .nojekyll: vorhanden`);

  if (process.argv.includes('--push')) {
    const run = (args) => execFileSync('git', args, { cwd: OUT, stdio: 'inherit' });
    if (!fs.existsSync(path.join(OUT, '.git'))) {
      run(['init', '-b', 'main']);
      run(['config', 'user.name', 'Hermes Agent']);
      run(['config', 'user.email', 'hermes@localhost']);
    }
    run(['add', '-A']);
    run(['commit', '-m', `deploy: Astro-Build ${new Date().toISOString()}`]);
    try {
      run(['remote', 'get-url', 'origin']);
    } catch {
      run(['remote', 'add', 'origin', REPO]);
    }
    run(['push', '-u', 'origin', 'main']);
    console.log('Push nach', REPO, 'abgeschlossen.');
  }
}

main();
