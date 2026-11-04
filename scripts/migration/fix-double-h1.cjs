/** Entfernt doppelte <h1> (Review M-2). */
const fs = require('node:fs');

for (const file of ['src/pages/impressum.astro', 'src/pages/datenschutz.astro', 'src/pages/haftung.astro']) {
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  text = text.replace(/\n\s*<h1 class="sr-only">[^<]*<\/h1>/, '');
  if (text === before) console.error('Kein sr-only-h1 in', file);
  else {
    fs.writeFileSync(file, text, 'utf8');
    console.log('h1 entfernt:', file);
  }
}

const md = 'src/content/dokumente/frequenz-quellen.md';
let doc = fs.readFileSync(md, 'utf8');
doc = doc.replace(
  /^# Frequenzen: Quellen, Evidenzstatus und Methodik/m,
  '## Frequenzen: Quellen, Evidenzstatus und Methodik'
);
fs.writeFileSync(md, doc, 'utf8');
console.log('Markdown-Titel auf h2 gesetzt:', md);
