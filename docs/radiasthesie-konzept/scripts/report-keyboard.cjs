const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'messung', 'mockup-messung.json'), 'utf8'));
for (const run of data.keyboard || []) {
  console.log('\n# Breite', run.width);
  run.order.forEach((s, i) => {
    console.log(String(i + 1).padStart(2), s ? `${s.tag.padEnd(7)} ${String(s.text).slice(0, 34).padEnd(36)} outline=${s.outline} offset=${s.offset} sichtbar=${s.visible}` : 'null');
  });
}
