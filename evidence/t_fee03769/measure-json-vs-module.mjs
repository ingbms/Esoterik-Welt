// Vergleicht die Auslieferungsgröße von ES-Modul und JSON-Darstellung
// desselben Inhalts. Das Modul wird wie in tests/farbwelten.mjs über ein
// temporäres Verzeichnis mit eigener package.json importiert und danach als
// JSON serialisiert (kompakt, ohne Einrückung) und gzip-komprimiert.
// Aufruf: node evidence/t_fee03769/measure-json-vs-module.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

const source = path.resolve('js/data/farbwelten.js');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fw-json-'));
fs.copyFileSync(source, path.join(dir, 'module.js'));
fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}');
const mod = await import(pathToFileURL(path.join(dir, 'module.js')).href);
fs.rmSync(dir, { recursive: true, force: true });

const raw = fs.readFileSync(source);
const asJson = Buffer.from(JSON.stringify(mod));
const kb = (n) => +(n / 1024).toFixed(1);
const leadingWhitespace = raw
  .toString('utf8')
  .split('\n')
  .reduce((sum, line) => sum + (line.match(/^\s*/)[0].length || 0), 0);

console.log(
  JSON.stringify(
    {
      exports: Object.keys(mod),
      module: { bytes: raw.length, gzip: zlib.gzipSync(raw, { level: 9 }).length, brotli: zlib.brotliCompressSync(raw).length },
      asJson: {
        bytes: asJson.length,
        gzip: zlib.gzipSync(asJson, { level: 9 }).length,
        brotli: zlib.brotliCompressSync(asJson).length,
      },
      leadingWhitespaceBytes: leadingWhitespace,
      lines: raw.toString('utf8').split('\n').length,
    },
    null,
    2
  )
);
