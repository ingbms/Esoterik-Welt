/**
 * Prüft die gebaute Ausgabe auf die im Review genannten Strukturmängel:
 * mehrere <h1>, mehrere WebPage-Knoten, sichtbare Migrationshinweise,
 * fehlende .nojekyll.
 */
const fs = require('node:fs');
const path = require('node:path');

const DIST = process.argv[2] || 'dist';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(DIST);
const problems = { multipleH1: [], multipleWebPage: [], migrationNotes: [], noNojekyll: false };

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(DIST, file).replace(/\\/g, '/');
  const h1 = (html.match(/<h1\b/g) || []).length;
  if (h1 !== 1) problems.multipleH1.push(`${rel} (${h1})`);
  const webPages = (html.match(/"@type"\s*:\s*"WebPage"/g) || []).length;
  if (webPages > 1) problems.multipleWebPage.push(`${rel} (${webPages})`);
  if (/ersetzt die (Ansicht|Dialogansicht)|Client-Insel des Bestands/.test(html) && !rel.includes('migration')) {
    problems.migrationNotes.push(rel);
  }
}

problems.noNojekyll = !fs.existsSync(path.join(DIST, '.nojekyll'));

console.log(`Geprüft: ${files.length} HTML-Dateien`);
console.log('Mehr als ein <h1>:', problems.multipleH1.length, problems.multipleH1.slice(0, 10));
console.log('Mehr als ein WebPage-Knoten:', problems.multipleWebPage.length, problems.multipleWebPage.slice(0, 10));
console.log('Sichtbare Migrationshinweise:', problems.migrationNotes.length, problems.migrationNotes.slice(0, 10));
console.log('.nojekyll fehlt:', problems.noNojekyll);
const failed =
  problems.multipleH1.length || problems.multipleWebPage.length || problems.migrationNotes.length || problems.noNojekyll;
if (failed) process.exitCode = 1;
