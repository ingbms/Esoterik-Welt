// Misst die kalte Import-Zeit (Datei lesen + parsen + auswerten) eines Datenmoduls.
// Jeder Aufruf startet in einem frischen Node-Prozess; das Modul wird vorher
// unverändert in ein temporäres Verzeichnis mit eigener package.json
// ("type":"module") kopiert — dasselbe Verfahren wie tests/farbwelten.mjs, weil
// dieses Paket .js als CommonJS behandelt.
// Aufruf: node evidence/t_fee03769/measure-import.mjs <pfad-zu-modul>
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

if (!process.argv[2]) {
  console.error('usage: node measure-import.mjs <module.js>');
  process.exit(2);
}
const target = path.resolve(process.argv[2]);
const bytes = fs.statSync(target).size;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fw-measure-'));
const copy = path.join(dir, 'module.js');
fs.copyFileSync(target, copy);
fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}');

const t0 = performance.now();
const mod = await import(pathToFileURL(copy).href);
const t1 = performance.now();
const heapMb = process.memoryUsage().heapUsed / 1048576;
fs.rmSync(dir, { recursive: true, force: true });
console.log(
  JSON.stringify({
    module: target.split(/[\\/]/).slice(-2).join('/'),
    bytes,
    importMs: +(t1 - t0).toFixed(2),
    exports: Object.keys(mod).length,
    heapUsedMB: +heapMb.toFixed(1),
  })
);
