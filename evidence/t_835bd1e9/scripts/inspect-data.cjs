// QA-Dateninspektion: Schema, Playback-Mapping und Feldinhalte pruefen.
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '..', '..', 'data', 'frequencies.json');
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('Top-Level-Keys:', Object.keys(d));
const entries = d.entries || d.frequencies || [];
console.log('Eintraege:', entries.length);
console.log('Erster Eintrag:', JSON.stringify(entries[0], null, 1));
const modes = {};
for (const e of entries) {
  const m = (e.playback && e.playback.mode) || '(kein playback)';
  modes[m] = (modes[m] || 0) + 1;
}
console.log('Playback-Modi:', modes);
console.log('Disclaimer:', JSON.stringify(d.disclaimer, null, 1));
const withUrl = entries.filter((e) => e.quelleUrl);
console.log('Mit quelleUrl:', withUrl.length, 'ohne:', entries.length - withUrl.length);
const bad = entries.filter((e) => e.quelleUrl && !/^https:\/\//.test(e.quelleUrl));
console.log('Nicht-https-Quellen:', bad.map((e) => [e.id, e.quelleUrl]));
console.log('IDs:', entries.map((e) => e.id).join(','));
