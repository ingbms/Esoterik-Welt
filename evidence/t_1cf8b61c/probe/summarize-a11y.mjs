// Fasst a11y.json zusammen: Verstöße, Kontraste, Fokus, Labels, Live-Regionen.
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const s = data.summary;
console.log('### axe');
console.log(JSON.stringify({ runs: s.axe.runs, violations: s.axe.violations, byEngine: Object.fromEntries(Object.entries(s.axe.byEngine).map(([k, v]) => [k, { launched: v.launched, views: v.views, violations: v.violations, consoleErrors: v.consoleErrors.length, pageErrors: v.pageErrors }])) }, null, 2));
console.log('### axe-Verstoesse im Detail');
for (const run of data.axeResults) {
  if (!run.violations.length) continue;
  console.log(run.label, JSON.stringify(run.violations, null, 2));
}
console.log('### Kontrast Paletten');
for (const row of s.contrast) console.log(JSON.stringify(row));
console.log('### gemessener Textkontrast');
for (const row of s.measuredText) console.log(JSON.stringify(row));
console.log('### Fokus');
for (const row of s.focus) console.log(JSON.stringify(row));
console.log('### Labels (Auszug)');
for (const [view, controls] of Object.entries(s.labels)) console.log(view, JSON.stringify(controls.slice(0, 10)));
console.log('### Live-Regionen');
for (const [view, regions] of Object.entries(s.liveRegions)) console.log(view, JSON.stringify(regions));
console.log('### Ueberschriften');
console.log(JSON.stringify(s.headingSkips));
console.log('### Findings');
console.log(JSON.stringify(s.findings, null, 2));
