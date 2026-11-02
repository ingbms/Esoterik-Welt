// Lighthouse-JSON zusammenfassen: Scores und verbleibende Befunde.
//
// Aufruf: node scripts/summarize-lighthouse.cjs evidence/farbwelten/lighthouse-rot.json
const fs = require('node:fs');

const file = process.argv[2];
if (!file) {
  console.error('Pfad zu einer Lighthouse-JSON-Datei angeben.');
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const categories = Object.fromEntries(
  Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)])
);
console.log('URL:', report.finalDisplayedUrl || report.finalUrl);
console.log('Lighthouse:', report.lighthouseVersion, '· Chrome:', report.environment?.hostUserAgent || '');
console.log('Scores:', JSON.stringify(categories));
const failing = Object.values(report.audits)
  .filter((audit) => audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== 'notApplicable')
  .filter((audit) => audit.scoreDisplayMode !== 'informative')
  .map((audit) => ({ id: audit.id, title: audit.title, score: audit.score }));
console.log(`Befunde unter 1,0: ${failing.length}`);
for (const audit of failing) console.log(`- ${audit.id} (${audit.score}): ${audit.title}`);
