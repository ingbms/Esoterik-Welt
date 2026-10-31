// GitHub Pages publishes the repository root, not the old public/ placeholder.
// Package exactly those static sources for a matching local production preview.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist', 'Esoterik-Welt');
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'impressum.html', 'datenschutz.html', 'haftung.html', '404.html', 'robots.txt', 'sitemap.xml', 'css', 'js', 'data', 'assets']) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), {
    recursive: true,
    filter: source => !/\.bak\d*$/.test(source) && !path.basename(source).startsWith('_')
  });
}
console.log('Static production build ready: dist/Esoterik-Welt/ (canonical Pages sources; no public/ placeholder).');
