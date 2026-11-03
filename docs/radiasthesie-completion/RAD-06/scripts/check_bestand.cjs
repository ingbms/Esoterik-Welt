// RAD-06 — Belegt, dass die Vorfassung der Themenseiten erhalten geblieben ist.
//
// Vergleicht die Sätze der drei Themenseiten in HEAD~1 (Stand vor dieser Karte)
// mit dem Arbeitsstand und meldet Sätze, die nicht mehr wortgleich vorkommen.
// Kein Ersatz für redaktionelles Lesen, aber ein Nachweis gegen stilles
// Umschreiben: Jede Abweichung muss im Checkpoint begründet sein.
//
// Aufruf: node docs/radiasthesie-completion/RAD-06/scripts/check_bestand.cjs

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../..');
const files = [
  'docs/radiasthesie-konzept/inhalte/radiaesthesie.md',
  'docs/radiasthesie-konzept/inhalte/pendeln.md',
  'docs/radiasthesie-konzept/inhalte/orakel.md',
];

const norm = (value) =>
  value
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const sentences = (text) =>
  norm(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 45);

let total = 0;
let kept = 0;
const lost = [];

for (const file of files) {
  const before = execFileSync('git', ['show', `HEAD~1:${file}`], { cwd: root, encoding: 'utf8' });
  const after = norm(fs.readFileSync(path.join(root, file), 'utf8'));
  for (const sentence of sentences(before.split('---').slice(2).join('---'))) {
    total += 1;
    if (after.includes(sentence)) kept += 1;
    else lost.push(`${path.basename(file)}: ${sentence.slice(0, 90)}…`);
  }
}

console.log(`Sätze der Vorfassung: ${total}, unverändert enthalten: ${kept}, nicht gefunden: ${lost.length}`);
for (const entry of lost) console.log('  - ' + entry);
process.exitCode = lost.length ? 1 : 0;
