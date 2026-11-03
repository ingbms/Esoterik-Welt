// GitHub Pages publishes the repository root, not the old public/ placeholder.
// Package exactly those static sources for a matching local production preview.
//
// Zuerst werden die statischen Themenseiten aus derselben Datenquelle erzeugt
// (scripts/generate-radiasthesie-pages.cjs), damit dist/ nie eine veraltete
// Fassung der indexierbaren Dokumente enthält.
const fs = require('node:fs');
const path = require('node:path');
const { buildStaticPages } = require('./generate-radiasthesie-pages.cjs');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist', 'Esoterik-Welt');

const ENTRIES = [
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
];

async function main() {
  await buildStaticPages();
  fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  for (const entry of ENTRIES) {
    fs.cpSync(path.join(root, entry), path.join(output, entry), {
      recursive: true,
      filter: (source) => !/\.bak\d*$/.test(source) && !path.basename(source).startsWith('_'),
    });
  }
  const { buildLocal } = require('./build-local.cjs');
  await buildLocal(output);
  console.log(
    'Static production build ready: dist/Esoterik-Welt/ (canonical Pages sources; static module documents included).'
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
