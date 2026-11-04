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
  // Redaktionsquellen der Farbwelten (content/farbwelten/*.md). GitHub Pages
  // liefert das Repository-Wurzelverzeichnis aus, also gehören sie auch in die
  // Produktionsvorschau, damit build und Pages denselben Dokumentbestand haben.
  'content',
];

async function main() {
  await buildStaticPages();
  // Nur das eigene Ausgabeverzeichnis leeren, nicht das ganze dist/: Seit der
  // Astro-Migration liegt der Astro-Build direkt in dist/ (dist/index.html,
  // dist/astrologie/…). Ein `rm -rf dist` würde ihn beim Legacy-Build löschen —
  // Reihenfolge build → build:legacy hätte dann still eine leere Astro-Site.
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  for (const entry of ENTRIES) {
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
  await buildLocal(output);
  console.log(
    'Static production build ready: dist/Esoterik-Welt/ (canonical Pages sources; static module documents included).'
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
