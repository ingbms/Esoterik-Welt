// Listet die Touch-Ziel-Befunde gruppiert nach Element/Text.
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const groups = new Map();
for (const row of data.rows)
  for (const target of row.smallTargets) {
    const key = `${target.tag}${target.type ? `[${target.type}]` : ''}|${target.text}|${target.w}x${target.h}`;
    const entry = groups.get(key) || { ...target, count: 0, widths: new Set() };
    entry.count += 1;
    entry.widths.add(row.width);
    groups.set(key, entry);
  }
const list = [...groups.values()].sort((a, b) => b.count - a.count);
console.log(`Gruppen: ${list.length}, Zellen mit Befund: ${data.rows.filter((r) => r.smallTargets.length).length}`);
for (const entry of list.slice(0, 25))
  console.log(`${entry.count}× [${[...entry.widths].join(',')}] ${entry.tag}${entry.type ? `[${entry.type}]` : ''} „${entry.text}“ ${entry.w}×${entry.h} (${entry.display})`);
