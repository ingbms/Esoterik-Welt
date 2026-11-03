// Zeigt ausgewählte Notizen aus tools.json.
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const keys = process.argv.slice(3);
for (const key of keys) console.log(`### ${key}\n${JSON.stringify(data.notes[key], null, 2).slice(0, 3500)}\n`);
