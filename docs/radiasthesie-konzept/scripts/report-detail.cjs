const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'messung', 'mockup-messung.json'), 'utf8'));
for (const r of data.results) {
  if (![1440, 1024, 390].includes(r.width)) continue;
  console.log('\n#', r.view, r.width, 'docHeight', r.doc.scrollHeight);
  console.log('  h1', r.h1.fontSize, 'lh', r.h1.lineHeight, 'rect', JSON.stringify({ y: r.h1.y, w: r.h1.w, h: r.h1.h }));
  console.log('  status', JSON.stringify(r.status), '| plate', JSON.stringify(r.plate), '| toc', JSON.stringify(r.toc));
  console.log('  topics', JSON.stringify(r.topics.map((t) => ({ w: t.w, h: t.h }))));
  console.log('  text.lead', JSON.stringify(r.text.lead), '| prose', JSON.stringify(r.text.prose));
  console.log('  header', JSON.stringify(r.header), '| container pad', r.container.paddingLeft, '| focusable', r.focusable);
}
