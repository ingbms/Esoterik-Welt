import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync('C:/Users/mas/AppData/Local/hermes/cache/scratch/rad13-evidence/browser-routes.json', 'utf8'));
for (const w of [320, 375, 768, 1440]) {
  const run = r.runs.find((x) => x.width === w && x.route === 'doc-pendeln');
  console.log(w, JSON.stringify(run.pictures));
}
console.log('--- Untergroesse gesamt:', r.findings.filter((f) => f.id === 'IMG-RES').length);
console.log('--- SPA topic-pendeln 768 pics', JSON.stringify(r.runs.find((x) => x.width === 768 && x.route === 'topic-pendeln').pictures));
console.log('--- Bildanzahl je Route', JSON.stringify([...new Set(r.runs.map((x) => x.imgsWithSrc))].sort()));
