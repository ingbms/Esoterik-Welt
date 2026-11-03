// Zeigt einen Eintrag aus einem Sonden-JSON.
// Aufruf: node show-result.mjs <datei.json> [id]
import fs from 'node:fs';
const [file, id] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (id) {
  const hit = (data.results || []).find((entry) => entry.id === id);
  console.log(JSON.stringify(hit ? { ...hit, text: undefined } : null, null, 2));
  if (hit) console.log('TEXT:', hit.text);
} else {
  console.log(JSON.stringify(data.summary ? data.summary : data, null, 2).slice(0, 4000));
}
