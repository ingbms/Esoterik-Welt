'use strict';
// Unabhaengige Master-Nachpruefung des Katalogpakets.
//
//   node scripts/migration-baseline/crosscheck-master-package.cjs [--expect-hashes <datei>]
//
// Bewusst OHNE lib/catalog.cjs, ohne validate-*.cjs und ohne verify-*.cjs: eigener
// CSV-Leser, eigene Hash-Rechnung, eigene Quellenpruefung ueber `git cat-file`
// gegen den Baseline-Commit. Zweck ist nicht, die Projektpruefer zu wiederholen,
// sondern auszuschliessen, dass ein Validator nur sich selbst bestaetigt.
//
// Geprueft wird:
//   1. beide JSON-Kataloge lesbar, IDs eindeutig, Typverteilung vollstaendig
//   2. jede entry.source.path existiert im Baseline-Commit
//   3. jeder Claim mit verification=verified hat eine citation
//   4. Medien-CSV: Spalten vorhanden, jede Zeile mit SHA-256 und Bytezahl
//      bitgenau gegen die Datei, offene Lizenzen gezaehlt
//   5. Produktdateien (index.html, css, js, data, assets, dist, public) sind
//      gegenueber der Baseline unveraendert
//   6. optional: behauptete Datei-Hashes einer Vorlage stimmen (--expect-hashes)
//
// Exitcode 1 bei jedem Fehler. Ausgabe ist JSON auf stdout.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const MB = path.join(ROOT, 'docs', 'migration-baseline');
const BASE = '9f584397f8cc86a261fccdfc36dfbb8999f55ea7';
const PRODUCT_PATHS = ['index.html', 'css', 'js', 'data', 'assets', 'dist', 'public'];
const OPEN_LICENSE = new Set(['ungeklaert', 'ungeklärt', 'unklar', 'unknown', 'offen', '']);

const errors = [];
const err = (message) => errors.push(message);

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(MB, name), 'utf8'));
}

// Eigener CSV-Leser (RFC-4180-nah): Anfuehrungszeichen, "" als Escape, Felder mit Komma/Zeilenumbruch.
function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell !== ''));
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function existsInBase(relative) {
  const clean = relative.replace(/^\.\//, '');
  const result = spawnSync('git', ['-C', ROOT, 'cat-file', '-e', `${BASE}:${clean}`], { encoding: 'utf8' });
  return result.status === 0;
}

function checkCatalog(name, requiredField) {
  const data = readJson(name);
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const ids = entries.map((entry) => entry.id);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) err(`${name}: doppelte IDs ${JSON.stringify(duplicates)}`);
  const types = {};
  const missingSource = [];
  for (const entry of entries) {
    types[entry.type] = (types[entry.type] || 0) + 1;
    if (!entry[requiredField]) err(`${name}: Eintrag ohne ${requiredField}`);
    const sourcePath = entry.source && entry.source.path;
    if (!sourcePath) {
      missingSource.push(`${entry.id} ohne source.path`);
    } else if (!existsInBase(sourcePath)) {
      missingSource.push(`${entry.id} -> ${sourcePath}`);
    }
  }
  if (missingSource.length) {
    err(
      `${name}: ${missingSource.length} Quellen fehlen im Baseline-Commit: ${JSON.stringify(missingSource.slice(0, 5))}`
    );
  }
  return { file: name, entries: entries.length, types, sources_checked: entries.length - missingSource.length };
}

function checkMedia() {
  const table = parseCsv(fs.readFileSync(path.join(MB, 'media-catalog.csv'), 'utf8'));
  const header = table[0];
  const rows = table.slice(1).map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index]])));
  for (const column of ['path', 'bytes', 'sha256', 'license_status']) {
    if (!header.includes(column)) err(`media-catalog.csv: Spalte ${column} fehlt`);
  }
  if (errors.length) return { rows: rows.length, aborted: true };
  const hashMismatch = [];
  const sizeMismatch = [];
  const missing = [];
  let open = 0;
  const openSamples = [];
  for (const row of rows) {
    const file = path.join(ROOT, row.path.split('/').join(path.sep));
    if (!fs.existsSync(file)) {
      missing.push(row.path);
      continue;
    }
    if (sha256(file) !== row.sha256) hashMismatch.push(row.path);
    if (String(fs.statSync(file).size) !== String(row.bytes)) sizeMismatch.push(row.path);
    if (
      OPEN_LICENSE.has(
        String(row.license_status || '')
          .trim()
          .toLowerCase()
      )
    ) {
      open += 1;
      if (openSamples.length < 3) openSamples.push(row.path);
    }
  }
  if (missing.length)
    err(`media-catalog.csv: ${missing.length} Dateien fehlen, z. B. ${JSON.stringify(missing.slice(0, 3))}`);
  if (hashMismatch.length)
    err(
      `media-catalog.csv: ${hashMismatch.length} SHA-256-Abweichungen, z. B. ${JSON.stringify(hashMismatch.slice(0, 3))}`
    );
  if (sizeMismatch.length)
    err(
      `media-catalog.csv: ${sizeMismatch.length} Byte-Abweichungen, z. B. ${JSON.stringify(sizeMismatch.slice(0, 3))}`
    );
  return {
    rows: rows.length,
    hashes_checked: rows.length - missing.length,
    license_open: open,
    license_open_samples: openSamples,
  };
}

function checkClaims(content) {
  const claims = Array.isArray(content.claims) ? content.claims : [];
  const unbacked = claims
    .filter((claim) => claim.verification === 'verified' && !claim.citation)
    .map((claim) => claim.id);
  if (unbacked.length) err(`content-catalog: verifizierte Claims ohne citation ${JSON.stringify(unbacked)}`);
  return { claims: claims.length, verified: claims.filter((claim) => claim.verification === 'verified').length };
}

function checkProduct() {
  const result = spawnSync('git', ['-C', ROOT, 'diff', '--name-only', BASE, '--', ...PRODUCT_PATHS], {
    encoding: 'utf8',
  });
  const changed = String(result.stdout || '')
    .split('\n')
    .filter((line) => line.trim() !== '');
  if (changed.length) err(`Produktdateien gegenueber Baseline geaendert: ${JSON.stringify(changed.slice(0, 10))}`);
  return { product_changes: changed.length };
}

function checkExpectedHashes(file) {
  const declared = JSON.parse(fs.readFileSync(file, 'utf8'));
  const table = declared.hashes || declared;
  const superseded = declared.superseded || {};
  const mismatch = [];
  const skipped = Object.keys(superseded);
  let checked = 0;
  for (const [relative, want] of Object.entries(table)) {
    if (Object.prototype.hasOwnProperty.call(superseded, relative)) continue;
    const target = path.join(ROOT, relative.split('/').join(path.sep));
    if (!fs.existsSync(target)) {
      mismatch.push(`${relative}: fehlt`);
      continue;
    }
    checked += 1;
    const got = sha256(target);
    if (got !== want) mismatch.push(`${relative}: erwartet ${want.slice(0, 16)}, ist ${got.slice(0, 16)}`);
  }
  if (mismatch.length)
    err(
      `Vorlage-Hashes: ${mismatch.length} von ${Object.keys(table).length} weichen ab: ${JSON.stringify(mismatch.slice(0, 5))}`
    );
  return { declared: Object.keys(table).length, checked, superseded: skipped, mismatch };
}

function main() {
  const argv = process.argv.slice(2);
  const expectIndex = argv.indexOf('--expect-hashes');
  const expectFile = expectIndex >= 0 ? argv[expectIndex + 1] : null;

  const content = readJson('content-catalog.json');
  const report = {
    base_commit: BASE,
    design: checkCatalog('design-catalog.json', 'id'),
    content: checkCatalog('content-catalog.json', 'id'),
    claims: checkClaims(content),
    media: checkMedia(),
    product: checkProduct(),
    expected_hashes: expectFile ? checkExpectedHashes(expectFile) : 'nicht angefordert',
    errors,
    ok: errors.length === 0,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main();
