// Fasst eine Messdatei aus measure-browser.cjs kompakt zusammen.
// Aufruf: node evidence/t_fee03769/summarize.cjs evidence/t_fee03769/messung-ist.json
const fs = require('node:fs');
const file = process.argv[2];
if (!file) {
  console.error('usage: node summarize.cjs <messung.json>');
  process.exit(2);
}
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const kb = (n) => +(n / 1024).toFixed(1);
const total = d.home.resources.reduce((s, r) => s + r.transfer, 0);
const js = d.home.resources.filter((r) => /\.m?js$/.test(r.name));
const jsSum = js.reduce((s, r) => s + r.transfer, 0);
const data = d.home.resources.filter((r) => /^js\/data\//.test(r.name));
const dataSum = data.reduce((s, r) => s + r.transfer, 0);

console.log(`Startseite: ${d.home.resources.length} Requests, ${kb(total)} KB übertragen (gzip)`);
console.log(`  davon JS: ${js.length} Dateien, ${kb(jsSum)} KB`);
console.log(`  davon js/data/*: ${data.length} Dateien, ${kb(dataSum)} KB`);
console.log(`  Navigation: DOMContentLoaded ${d.home.nav.domContentLoadedMs} ms, load ${d.home.nav.loadEventMs} ms`);
console.log(`  Wanduhr bis Feature-Grid vollständig: ${d.home.loadWallMs} ms`);
console.log('  JS-Dateien mit den größten Übertragungen:');
for (const r of js.sort((a, b) => b.transfer - a.transfer).slice(0, 8)) {
  console.log(`    ${String(kb(r.transfer)).padStart(7)} KB  ${String(kb(r.decoded)).padStart(7)} KB roh  ${r.name}`);
}
console.log('  Größte Übertragungen insgesamt:');
for (const r of [...d.home.resources].sort((a, b) => b.transfer - a.transfer).slice(0, 6)) {
  console.log(`    ${String(kb(r.transfer)).padStart(7)} KB  ${r.name}`);
}
const byType = {};
for (const r of d.home.resources) {
  const ext = (r.name.match(/\.([a-z0-9]+)(?:$|\?)/) || [])[1] || 'other';
  byType[ext] = (byType[ext] || 0) + r.transfer;
}
console.log('  Übertragung nach Typ:');
for (const [ext, bytes] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(kb(bytes)).padStart(7)} KB  .${ext}`);
}
console.log(`  farbwelten.js auf der Startseite: ${d.home.farbweltenData ? kb(d.home.farbweltenData.transfer) + ' KB übertragen / ' + kb(d.home.farbweltenData.decoded) + ' KB roh' : 'nicht geladen'}`);
console.log('');
console.log(
  `Kaltstart #farbwelten/rot: h1 sichtbar nach ${d.coldColourPage.h1VisibleMs} ms, ${d.coldColourPage.requests} Requests, ${kb(d.coldColourPage.transferTotal)} KB, Titel "${d.coldColourPage.title}"`
);
console.log(`  farbwelten.js: ${d.coldColourPage.farbweltenData ? kb(d.coldColourPage.farbweltenData.transfer) + ' KB' : 'nicht geladen'}`);
console.log(`Navigation Startseite -> #farbwelten/rot (warmer Cache): ${d.warmColourNavigationMs} ms`);
