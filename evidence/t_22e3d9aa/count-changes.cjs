// Zählt die Änderungen aus apply.txt je Kennung (Belegzahlen für NACHWEIS.md).
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const text = fs.readFileSync(path.join(__dirname, 'apply.txt'), 'utf8');
const perId = new Map();
for (const match of text.matchAll(/^ÄNDERE (\S+?):\d+ \[(\d{1,2})\]$/gm)) {
  const [, file, id] = match;
  if (!perId.has(id)) perId.set(id, []);
  perId.get(id).push(file);
}
const ids = [...perId.keys()].sort((a, b) => Number(a) - Number(b));
for (const id of ids) {
  const files = perId.get(id);
  console.log(`[${id}] ${files.length} Seiten: ${files.map((f) => f.replace(/\.md$/, '')).join(', ')}`);
}
const total = ids.reduce((sum, id) => sum + perId.get(id).length, 0);
console.log(`gesamt: ${total} Zeilen in ${new Set([...perId.values()].flat()).size} Dateien`);
