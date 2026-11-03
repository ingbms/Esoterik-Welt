#!/usr/bin/env node
// Unabhängige Abnahme des Medien-Katalogs.
//
// Prüft die Akzeptanzkriterien der Karte t_7dfb0683 am tatsächlichen Ergebnis:
//   1. Kopfzeile exakt wie §8 / MEDIA_COLUMNS
//   2. 644 Zeilen, lückenlose IDs MED-0001..MED-0644
//   3. jede Datei existiert; bytes und sha256 werden neu gerechnet und verglichen
//   4. assets/tarot/ vollständig: Dateizahl und Byte-Summe gegen das Dateisystem
//   5. jede Zeile mit license_status=ungeklaert steht in medien-katalog-luecken.md
//   6. die Medienprüfung meldet für die Datei 0 Fehler
//   7. Negativfälle: Rasterformat ohne Maße wird abgelehnt, Textformat ohne Maße
//      angenommen, falsche Kopfzeile abgelehnt
//
// Aufruf: node scripts/migration-baseline/verify-media-catalog.cjs [--json]

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const lib = require('./lib/catalog.cjs');

const ROOT = lib.ROOT;
const CSV = path.join(ROOT, 'docs', 'migration-baseline', 'media-catalog.csv');
const GAPS = path.join(ROOT, 'docs', 'migration-baseline', 'medien-katalog-luecken.md');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  if (!process.argv.includes('--json')) console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

function walk(relDir) {
  const out = [];
  const step = (abs) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const child = path.join(abs, entry.name);
      if (entry.isDirectory()) step(child);
      else if (entry.isFile()) out.push(path.relative(ROOT, child).split(path.sep).join('/'));
    }
  };
  step(path.join(ROOT, relDir));
  return out;
}

function main() {
  if (!fs.existsSync(CSV)) {
    check('media-catalog.csv existiert', false, CSV);
    return finish();
  }
  const rows = lib.parseCsv(fs.readFileSync(CSV, 'utf8'));
  const header = rows[0];
  const data = rows.slice(1).map((cells) => Object.fromEntries(header.map((column, index) => [column, cells[index]])));

  check(
    'Kopfzeile exakt wie MEDIA_COLUMNS',
    JSON.stringify(header) === JSON.stringify(lib.MEDIA_COLUMNS),
    `${header.length} Spalten`
  );

  const diskFiles = walk('assets');
  check(
    'Zeilenzahl gleich Dateizahl unter assets/',
    data.length === diskFiles.length,
    `${data.length} Zeilen, ${diskFiles.length} Dateien`
  );
  check('Zeilenzahl 644', data.length === 644, String(data.length));

  const ids = data.map((row) => row.id);
  const expectedIds = data.map((_, index) => `MED-${String(index + 1).padStart(4, '0')}`);
  check(
    'IDs lückenlos MED-0001 aufsteigend',
    JSON.stringify(ids) === JSON.stringify(expectedIds),
    `${ids[0]} … ${ids[ids.length - 1]}`
  );
  check('IDs eindeutig', new Set(ids).size === ids.length, `${new Set(ids).size} verschiedene`);

  const paths = new Set(data.map((row) => row.path));
  const missingRows = diskFiles.filter((file) => !paths.has(file));
  check('jede Datei unter assets/ hat eine Zeile', missingRows.length === 0, missingRows.slice(0, 5).join(', '));

  let badPath = 0;
  let badBytes = 0;
  let badSha = 0;
  for (const row of data) {
    const abs = path.join(ROOT, row.path);
    if (!fs.existsSync(abs)) {
      badPath += 1;
      continue;
    }
    const buf = lib.canonicalBytes(row.path);
    if (buf.length !== Number(row.bytes)) badBytes += 1;
    if (crypto.createHash('sha256').update(buf).digest('hex') !== row.sha256) badSha += 1;
  }
  check('alle Pfade existieren', badPath === 0, `${badPath} fehlend`);
  check('bytes gegen Datei geprüft', badBytes === 0, `${badBytes} Abweichungen`);
  check('sha256 gegen Datei geprüft', badSha === 0, `${badSha} Abweichungen`);

  const tarotRows = data.filter((row) => row.path.startsWith('assets/tarot/'));
  const tarotFiles = diskFiles.filter((file) => file.startsWith('assets/tarot/'));
  const tarotBytes = tarotRows.reduce((sum, row) => sum + Number(row.bytes), 0);
  const tarotDiskBytes = tarotFiles.reduce((sum, file) => sum + fs.statSync(path.join(ROOT, file)).size, 0);
  check(
    'assets/tarot/ vollständig erfasst',
    tarotRows.length === tarotFiles.length,
    `${tarotRows.length} Zeilen, ${tarotFiles.length} Dateien`
  );
  check('assets/tarot/ Byte-Summe stimmt', tarotBytes === tarotDiskBytes, `${tarotBytes} Byte`);

  const openRows = data.filter((row) => row.license_status === 'ungeklaert');
  const gaps = fs.existsSync(GAPS) ? fs.readFileSync(GAPS, 'utf8') : '';
  const missingInGaps = openRows.filter((row) => !gaps.includes(row.id) || !gaps.includes(row.path));
  check(
    'jede ungeklärte Zeile steht in der Lückenliste',
    missingInGaps.length === 0,
    `${openRows.length} ungeklärt, ${missingInGaps.length} fehlen`
  );
  const mustOpen = openRows.filter((row) => row.release_relevance === 'must');
  check(
    'ungeklärte must-Medien sind als Gate-Punkt benannt',
    mustOpen.length === 0 || gaps.includes('Gate-Punkt'),
    `${mustOpen.length} must`
  );

  const validation = lib.validateMedia(rows, { fs: true });
  check(
    'validateMedia: 0 Fehler',
    validation.errors.length === 0,
    `${validation.errors.length} Fehler, ${validation.warnings.length} Warnungen`
  );

  // Negativfälle: die Prüfung muss falsche Zeilen weiterhin ablehnen.
  const png = 'assets/radiasthesie/media/520/ouija-historisch.png';
  const md = 'assets/radiasthesie/media/ATTRIBUTION.md';
  const synthetic = (file, format, width, height) =>
    [
      'MED-9999',
      file,
      'Testfall',
      width,
      height,
      format,
      String(fs.statSync(path.join(ROOT, file)).size),
      'Test-Alt',
      '',
      'Esoterik-Welt (Projekt)',
      'nicht_erforderlich (Testfall)',
      'nicht_erforderlich',
      lib.sha256(file),
      'final',
      'none',
      'shipped',
    ].join(',');

  const negative = lib.validateMedia(
    lib.parseCsv([lib.MEDIA_COLUMNS.join(','), synthetic(png, 'png', 'n/a', 'n/a')].join('\n')),
    { fs: true }
  );
  check(
    'Negativfall: PNG ohne Maße wird abgelehnt',
    negative.errors.filter((error) => error.code === 'DIMENSION_MISSING').length === 2,
    negative.errors.map((error) => error.code).join(',')
  );

  const positiveMd = lib.validateMedia(
    lib.parseCsv([lib.MEDIA_COLUMNS.join(','), synthetic(md, 'md', 'n/a', 'n/a')].join('\n')),
    { fs: true }
  );
  check(
    'Textformat md ohne Maße wird angenommen',
    positiveMd.errors.length === 0,
    `${positiveMd.errors.length} Fehler`
  );

  const badHeader = lib.validateMedia(
    lib.parseCsv(
      [lib.MEDIA_COLUMNS.join(',').replace('delivery', 'auslieferung'), synthetic(png, 'png', '520', '400')].join('\n')
    ),
    { fs: false }
  );
  check(
    'Negativfall: falsche Kopfzeile wird abgelehnt',
    badHeader.errors.some((error) => error.code === 'MEDIA_HEADER'),
    badHeader.errors.map((error) => error.code).join(',')
  );

  finish();
}

function finish() {
  const failed = results.filter((result) => !result.ok);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ checks: results, failed: failed.length }, null, 2));
  } else {
    console.log('');
    console.log(
      `${results.length - failed.length}/${results.length} Prüfungen bestanden${failed.length ? ` — ${failed.length} FEHLGESCHLAGEN` : ''}`
    );
  }
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main();
