const fs = require('node:fs');
const path = require('node:path');
const rows = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'messung', 'nav-8-ziele.json'), 'utf8'));
for (const r of rows) {
  if (![781, 860, 1024, 1120, 1121, 1440].includes(r.width)) continue;
  console.log('\n# width', r.width, '| inner', r.headerInner.clientWidth, '| pad', r.paddingLeft, r.paddingRight, '| gap', r.innerGap);
  for (const l of r.links) console.log('   ', l.text.padEnd(12), 'w=' + l.w, 'h=' + l.h);
}
