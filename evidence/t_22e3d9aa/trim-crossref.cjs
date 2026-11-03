// Fasst die abgerufenen Crossref-Antworten auf die bibliografisch relevanten
// Felder zusammen (Belegdatei, damit keine 100-KB-Rohantworten im Repo liegen).
// Aufruf: node evidence/t_22e3d9aa/trim-crossref.cjs
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const dir = __dirname;
const pairs = [
  ['1', null],
  ['3', 'crossref-10-3758-s13423-024-02615-z.json'],
  ['4', 'crossref-10-1177-0956797620948810.json'],
  ['5', 'crossref-10-1002-col-22490.json'],
  ['7', 'crossref-7.json'],
];

const out = { abgerufen: new Date().toISOString(), quelle: 'https://api.crossref.org/works/<DOI>', ids: {} };

for (const [id, file] of pairs) {
  if (!file) {
    out.ids[id] = { hinweis: 'kein DOI (Zeitschriftenartikel/Buch ohne DOI im Register) — Crossref nicht anwendbar' };
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')).message;
  out.ids[id] = {
    doi: raw.DOI,
    title: raw.title,
    containerTitle: raw['container-title'],
    shortContainerTitle: raw['short-container-title'],
    volume: raw.volume,
    issue: raw.issue,
    page: raw.page,
    publishedPrint: raw['published-print'] && raw['published-print']['date-parts'],
    authors: (raw.author || []).map((a) => `${a.family}, ${a.given}`),
  };
}

fs.writeFileSync(path.join(dir, 'crossref-fields.json'), `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`crossref-fields.json geschrieben (${Object.keys(out.ids).length} Kennungen)`);
