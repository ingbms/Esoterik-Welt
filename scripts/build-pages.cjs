// GitHub Pages publishes the repository root, not the old public/ placeholder.
// Package exactly those static sources for a matching local production preview.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist', 'Esoterik-Welt');
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const entry of [
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
]) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), {
    recursive: true,
    filter: (source) => !/\.bak\d*$/.test(source) && !path.basename(source).startsWith('_'),
  });
}
// Das Quellendokument des Frequenzbereichs liegt im Repository unter docs/ und
// wird einzeln ausgeliefert: die Ansicht #frequenzen/quellen lädt es per fetch,
// und der Link auf die Markdown-Datei muss im Preview antworten. Bewusst keine
// Kopie des ganzen docs/-Baums (ADRs, Reviews, Konzepte bleiben intern).
const documentSources = ['docs/frequenz-quellen.md'];
for (const source of documentSources) {
  const from = path.join(root, source);
  if (!fs.existsSync(from)) throw new Error(`Quellendokument fehlt: ${source}`);
  const to = path.join(output, source);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to);
}

const { buildLocal } = require('./build-local.cjs');
buildLocal(output)
  .then(() => {
    console.log(
      'Static production build ready: dist/Esoterik-Welt/ (canonical Pages sources; no public/ placeholder).'
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
