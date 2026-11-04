/** Kompakte Übersicht aller Prüfergebnisse aus den Evidence-Dateien. */
import fs from 'node:fs';
import path from 'node:path';
import { EVID } from './lib.mjs';

const files = ['browser-desktop.json', 'nojs.json', 'fixtures-result.json', 'unit.json', 'a11y-extra.json'];
for (const file of files) {
  const p = path.join(EVID, file);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const rows = data.results || [];
  console.log(`\n## ${file} — ${rows.filter((r) => r.ok).length}/${rows.length} ok`);
  for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} — ${r.name}`);
}
const bd = JSON.parse(fs.readFileSync(path.join(EVID, 'browser-desktop.json'), 'utf8'));
const detail = (id) => bd.results.find((r) => r.id === id)?.detail;
console.log('\n## Ausgewählte Messwerte');
console.log('E1', JSON.stringify(detail('AK-E1')));
console.log('E2', JSON.stringify(detail('AK-E2')));
console.log('E3a', JSON.stringify(detail('AK-E3a')));
console.log('F4', JSON.stringify(detail('AK-F4')));
console.log('D5', JSON.stringify(detail('AK-D5')));
console.log('D5b', JSON.stringify(detail('AK-D5b')));
console.log('E6', JSON.stringify(detail('AK-E6')));
