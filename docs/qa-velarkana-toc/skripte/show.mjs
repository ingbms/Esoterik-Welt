/** Zeigt ausgewählte Felder eines Evidence-JSON (Aufruf: node qa-toc-436eeffb/show.mjs <datei> <pfad...>). */
import fs from 'node:fs';
import path from 'node:path';
import { EVID } from './lib.mjs';

const [file, ...paths] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(path.join(EVID, file), 'utf8'));
for (const p of paths) {
  const value = p.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), data);
  console.log(`--- ${p} ---`);
  console.log(JSON.stringify(value, null, 2));
}
