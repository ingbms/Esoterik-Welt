// Erzeugt eine lesbare Übersicht aus messung/mockup-messung.json.
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'messung', 'mockup-messung.json'), 'utf8'));
const contrast = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'messung', 'kontrast.json'), 'utf8'));

const rows = [...data.results].sort((a, b) => a.view.localeCompare(b.view) || b.width - a.width);
const lines = [];
lines.push('# Messübersicht (erzeugt aus mockup-messung.json)');
lines.push('');
lines.push('Jede Zeile entsteht aus einem frisch geladenen Dokument bei der jeweiligen Breite.');
lines.push('');
lines.push('| Ansicht | Breite | H1 | Container-Pad | Spalten | Kartenbreiten | Nav-Reserve | Überläufe | Konsole | Extern | Zeichen/Zeile |');
lines.push('| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |');
for (const r of rows) {
  lines.push(
    `| ${r.view} | ${r.width} | ${r.h1.fontSize} | ${r.container.paddingLeft} | ${(r.gridColumns || '–').split(' ').length} | ${r.topics.map((t) => t.w).join(' / ') || '–'} | ${r.header.navReserve} | ${r.doc.overflowX} | ${r.consoleErrors.length} | ${r.externalRequests.length} | ${r.text.prose ? r.text.prose.charsPerLine : '–'} |`
  );
}
lines.push('');
lines.push('## Kontrast (Auszug)');
lines.push('');
lines.push('| Fläche | Vordergrund | Verhältnis | AA Text |');
lines.push('| --- | --- | ---: | :---: |');
for (const c of contrast.results) {
  lines.push(`| ${c.surface} | ${c.foreground} | ${c.ratio}:1 | ${c.aa_text ? 'ja' : 'nein (3:1-Ziel)'} |`);
}
lines.push('');
lines.push('## Tastaturreihenfolge');
lines.push('');
for (const run of data.keyboard || []) {
  lines.push(`**Breite ${run.width}:** ` + run.order.filter(Boolean).map((s, i) => `${i + 1}. ${String(s.text).trim().slice(0, 24) || s.tag}`).join(' · '));
  lines.push('');
}
fs.writeFileSync(path.join(__dirname, '..', 'messung', 'uebersicht.md'), lines.join('\n'));
console.log(lines.join('\n'));
