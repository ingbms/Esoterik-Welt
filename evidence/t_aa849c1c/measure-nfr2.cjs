// Misst NFR-2 (Feature-JS gesamt) auf drei Auscheck-Basen:
//  (a) Arbeitsbaum, wie er auf der Platte liegt
//  (b) frischer Klon mit core.autocrlf=true  -> alle Dateien CRLF
//  (c) frische CI-Auscheckung (LF, so wie die Blobs im Index)
// Regel wie scripts/check-frequenz-budget.cjs: alle js/modules/frequenz*.js
// alphabetisch sortiert, konkateniert, gzip -9.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = process.argv[2] || process.cwd();
const dir = path.join(root, 'js/modules');
const files = fs
  .readdirSync(dir)
  .filter((name) => /^frequenz.*\.js$/.test(name) && !name.endsWith('.d.ts'))
  .sort();

const toCrlf = (buffer) => Buffer.from(buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'), 'utf8');
const toLf = (buffer) => Buffer.from(buffer.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');

const gzip = (buffer) => zlib.gzipSync(buffer, { level: 9 }).length;
const report = (label, buffers) => {
  const raw = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  console.log(`${label.padEnd(34)} ${String(raw).padStart(7)} B roh ${String(gzip(Buffer.concat(buffers))).padStart(7)} B gz  (${files.length} Dateien)`);
};

const asIs = files.map((name) => fs.readFileSync(path.join(dir, name)));
report('(a) Arbeitsbaum', asIs);
report('(b) frischer Klon, CRLF (Windows)', asIs.map(toCrlf));
report('(c) CI-Auscheckung, LF', asIs.map(toLf));

const lfTotal = asIs.map(toLf).reduce((sum, buffer) => sum + buffer.length, 0);
console.log(`Kontrollsumme: LF-Bytes ${lfTotal}`);
