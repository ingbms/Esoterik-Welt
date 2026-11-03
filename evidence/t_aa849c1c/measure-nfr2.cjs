// Misst NFR-2 (Feature-JS gesamt, gzip -9) reproduzierbar.
//
//   node evidence/t_aa849c1c/measure-nfr2.cjs [<repo>] [<rev>]
//
// Ohne <rev>: drei Auscheck-Basen des Arbeitsbaums
//  (a) Arbeitsbaum, wie er auf der Platte liegt
//  (b) derselbe Inhalt als CRLF (frischer Klon mit core.autocrlf=true)
//  (c) derselbe Inhalt als LF (so liegen die Blobs im Index / auf der CI)
//
// Mit <rev>: die Bytes kommen direkt aus den Git-Blobs dieses Commits
// (`git ls-tree` + `git show`), unabhängig vom Arbeitsbaum. Damit sind die
// Zahlen an einen Commit gebunden und aus jedem Klon nachmessbar; die
// Zeilenenden-Varianten werden daraus abgeleitet.
//
// Regel wie scripts/check-frequenz-budget.cjs: alle js/modules/frequenz*.js
// alphabetisch sortiert, konkateniert, gzip -9.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');

const root = path.resolve(process.argv[2] || process.cwd());
const rev = process.argv[3] || null;
const dir = path.join(root, 'js/modules');
const isFeatureModule = (name) => /^frequenz.*\.js$/.test(name) && !name.endsWith('.d.ts');

const toCrlf = (buffer) => Buffer.from(buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'), 'utf8');
const toLf = (buffer) => Buffer.from(buffer.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');

const gzip = (buffer) => zlib.gzipSync(buffer, { level: 9 }).length;
const report = (label, count, buffers) => {
  const raw = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  console.log(
    `${label.padEnd(34)} ${String(raw).padStart(7)} B roh ${String(gzip(Buffer.concat(buffers))).padStart(7)} B gz  (${count} Dateien)`
  );
};

if (rev) {
  const listed = execFileSync('git', ['-C', root, 'ls-tree', '-r', '--name-only', rev, '--', 'js/modules'], {
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => isFeatureModule(path.basename(file)))
    .sort();
  if (listed.length === 0) {
    console.error(`Keine js/modules/frequenz*.js in ${rev} gefunden.`);
    process.exit(1);
  }
  const blobs = listed.map((file) =>
    execFileSync('git', ['-C', root, 'show', `${rev}:${file}`], { maxBuffer: 64 * 1024 * 1024 })
  );
  console.log(`Commit ${rev} (Git-Blobs, unabhängig vom Arbeitsbaum):`);
  report('  LF (CI-Basis)', listed.length, blobs.map(toLf));
  report('  CRLF (Windows-Klon)', listed.length, blobs.map(toCrlf));
  report('  Blob-Bytes unverändert', listed.length, blobs);
  const lfTotal = blobs.map(toLf).reduce((sum, buffer) => sum + buffer.length, 0);
  console.log(`Kontrollsumme: LF-Bytes ${lfTotal} in ${listed.length} Dateien`);
} else {
  const files = fs.readdirSync(dir).filter(isFeatureModule).sort();
  const asIs = files.map((name) => fs.readFileSync(path.join(dir, name)));
  report('(a) Arbeitsbaum', files.length, asIs);
  report('(b) frischer Klon, CRLF (Windows)', files.length, asIs.map(toCrlf));
  report('(c) CI-Auscheckung, LF', files.length, asIs.map(toLf));
  const lfTotal = asIs.map(toLf).reduce((sum, buffer) => sum + buffer.length, 0);
  console.log(`Kontrollsumme: LF-Bytes ${lfTotal}`);
}

