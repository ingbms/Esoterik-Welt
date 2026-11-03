// Zeigt die bibliografisch relevanten Crossref-Felder der abgerufenen DOIs.
// Reine Anzeige, keine Änderung.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const files = process.argv.slice(2);
for (const file of files) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const m = json.message;
  console.log(`\n=== ${path.basename(file)} (DOI ${m.DOI}) ===`);
  console.log('  title               :', (m.title || []).join(' | '));
  console.log('  container-title     :', (m['container-title'] || []).join(' | '));
  console.log('  short-container     :', (m['short-container-title'] || []).join(' | '));
  console.log('  volume/issue/page   :', `${m.volume || '-'} / ${m.issue || '-'} / ${m.page || '-'}`);
  console.log('  published-print     :', m['published-print'] && m['published-print']['date-parts']);
  console.log('  published-online    :', m['published-online'] && m['published-online']['date-parts']);
  console.log(
    '  authors             :',
    (m.author || []).map((a) => `${a.family}, ${a.given}`).join('; ')
  );
}
