'use strict';
// Prueft Design- und Inhalts-Katalog gegen die verbindliche Struktur aus
// docs/migration-baseline/00-schema-und-scope.md.
//
//   node scripts/migration-baseline/validate-catalogs.cjs              # echte Kataloge
//   node scripts/migration-baseline/validate-catalogs.cjs --examples   # Beispiele
//   node scripts/migration-baseline/validate-catalogs.cjs --no-fs      # ohne Dateipruefung
//
// Exit 1, sobald ein Fehler gefunden wird; Warnungen allein sind Exit 0.

const fs = require('node:fs');
const path = require('node:path');
const catalog = require('./lib/catalog.cjs');

const FILES = {
  design: 'design-catalog.json',
  content: 'content-catalog.json',
  media: 'media-catalog.csv',
};

function parseArgs(argv) {
  const options = { examples: false, fs: true, json: false, strict: false, input: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--examples') options.examples = true;
    else if (arg === '--no-fs') options.fs = false;
    else if (arg === '--json') options.json = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--input') {
      options.input = argv[i + 1];
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unbekannte Option: ${arg}`);
    }
  }
  return options;
}

function resolveDir(options) {
  if (options.input) return path.resolve(catalog.ROOT, options.input);
  if (options.examples) return path.join(catalog.CATALOG_DIR, 'examples');
  return catalog.CATALOG_DIR;
}

function fileNameFor(kind, options) {
  const base = FILES[kind];
  if (!options.examples) return base;
  const extension = path.extname(base);
  return `${path.basename(base, extension)}.example${extension}`;
}

function load(dir, kind, options, results, missing) {
  const file = path.join(dir, fileNameFor(kind, options));
  if (!fs.existsSync(file)) {
    missing.push(catalog.relToRoot(file));
    return null;
  }
  const label = path.relative(dir, file).split(path.sep).join('/');
  try {
    if (kind === 'media') {
      const rows = catalog.parseCsv(fs.readFileSync(file, 'utf8'));
      results.push({ label, kind, result: catalog.validateMedia(rows, { fs: options.fs }) });
    } else {
      const doc = catalog.readJson(file);
      const result =
        kind === 'design'
          ? catalog.validateDesign(doc, { fs: options.fs })
          : catalog.validateContent(doc, { fs: options.fs });
      results.push({ label, kind, result });
    }
  } catch (error) {
    results.push({
      label,
      kind,
      result: {
        total: 0,
        byStatus: {},
        byRelevance: {},
        byDelivery: {},
        byType: {},
        errors: [{ code: 'PARSE', where: label, message: error.message }],
        warnings: [],
        ok: false,
      },
    });
  }
  return file;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  if (options.help) {
    console.log('Prueft die ESOW-Kataloge. Optionen: --examples --input <dir> --no-fs --json --strict');
    return;
  }

  const dir = resolveDir(options);
  const results = [];
  const missing = [];
  for (const kind of ['design', 'content', 'media']) load(dir, kind, options, results, missing);

  const errors = results.reduce((sum, entry) => sum + entry.result.errors.length, 0);
  const warnings = results.reduce((sum, entry) => sum + entry.result.warnings.length, 0);

  if (options.json) {
    console.log(JSON.stringify({ dir: catalog.relToRoot(dir), missing, results, errors, warnings }, null, 2));
    process.exit(errors ? 1 : 0);
  }

  console.log(`ESOW-Katalogpruefung — ${catalog.relToRoot(dir)}`);
  console.log(`Struktur: ${catalog.SCOPE_DOCUMENT} (Version ${catalog.SCHEMA_VERSION})`);
  console.log('');
  for (const entry of results) catalog.printResult(entry.label, entry.result);

  if (missing.length) {
    const level = options.strict ? 'FEHLER' : 'HINWEIS';
    console.log('');
    console.log(`${level}: nicht vorhanden — ${missing.join(', ')}`);
  }
  if (!results.length) {
    console.error('Kein Katalog gefunden. Erwartet: design-catalog.json, content-catalog.json, media-catalog.csv.');
    process.exit(2);
  }
  const effectiveErrors = errors + (options.strict ? missing.length : 0);
  console.log('');
  console.log(`Gesamt: ${results.length} Datei(en), ${errors} Fehler, ${warnings} Warnungen`);
  process.exit(effectiveErrors ? 1 : 0);
}

main();
