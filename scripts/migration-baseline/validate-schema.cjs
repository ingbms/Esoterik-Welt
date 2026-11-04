'use strict';
// Unabhaengige Gegenprobe zum handgeschriebenen Pruefer: validiert die Kataloge
// gegen docs/migration-baseline/schema/catalog.schema.json mit einem echten
// JSON-Schema-Validator (ajv, draft 2020-12) und belegt mit Negativfaellen,
// dass das Schema nicht alles durchlaesst.
//
//   node scripts/migration-baseline/validate-schema.cjs            # Beispiele + echte Kataloge
//   node scripts/migration-baseline/validate-schema.cjs --examples # nur Beispiele
//   node scripts/migration-baseline/validate-schema.cjs --negativ  # nur Negativfaelle
//
// Exit 1 bei einem positiven Fall, der nicht validiert, oder einem Negativfall,
// der faelschlich durchgeht.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const CATALOG_DIR = path.join(ROOT, 'docs', 'migration-baseline');
const SCHEMA_FILE = path.join(CATALOG_DIR, 'schema', 'catalog.schema.json');

function loadAjv() {
  // ajv liegt als transitive Abhaengigkeit der Testwerkzeuge vor. Fehlt es,
  // ist das ein Hinweis, kein Fehler: der handgeschriebene Pruefer laeuft ohne.
  try {
    const Ajv2020 = require('ajv/dist/2020');
    return { Ajv2020, available: true };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function positives(options) {
  const files = [];
  if (options.examples) {
    files.push(
      path.join(CATALOG_DIR, 'examples', 'design-catalog.example.json'),
      path.join(CATALOG_DIR, 'examples', 'content-catalog.example.json')
    );
  } else {
    files.push(path.join(CATALOG_DIR, 'design-catalog.json'), path.join(CATALOG_DIR, 'content-catalog.json'));
  }
  return files.filter((file) => fs.existsSync(file));
}

// Jeder Fall muss vom Schema ABGELEHNT werden.
function negatives() {
  const baseDesign = readJson(path.join(CATALOG_DIR, 'examples', 'design-catalog.example.json'));
  const baseContent = readJson(path.join(CATALOG_DIR, 'examples', 'content-catalog.example.json'));
  const clone = (doc) => JSON.parse(JSON.stringify(doc));

  const cases = [];
  const push = (name, mutate) => {
    const doc = mutate();
    cases.push({ name, doc });
  };

  push('Design ohne base_commit', () => {
    const doc = clone(baseDesign);
    delete doc.base_commit;
    return doc;
  });
  push('Design mit unbekanntem owner', () => {
    const doc = clone(baseDesign);
    doc.entries[0].owner = 'irgendein_profil';
    return doc;
  });
  push('Design-Token ohne value', () => {
    const doc = clone(baseDesign);
    delete doc.entries[0].value;
    return doc;
  });
  push('Design mit falschem ID-Muster', () => {
    const doc = clone(baseDesign);
    doc.entries[0].id = 'DES-FALSCH-1';
    return doc;
  });
  push('Design mit unbekanntem Typ', () => {
    const doc = clone(baseDesign);
    doc.entries[0].type = 'token-erfunden';
    return doc;
  });
  push('Design mit unbekanntem Zusatzfeld', () => {
    const doc = clone(baseDesign);
    doc.entries[0].erfundenes_feld = 'x';
    return doc;
  });
  push('Design mit ungueltigem Status', () => {
    const doc = clone(baseDesign);
    doc.entries[0].status = 'fertig';
    return doc;
  });
  push('Inhalt ohne text_ref', () => {
    const doc = clone(baseContent);
    delete doc.entries[0].text_ref;
    return doc;
  });
  push('Inhalt mit fremder Sprache', () => {
    const doc = clone(baseContent);
    doc.entries[0].language = 'en';
    return doc;
  });
  push('Inhalt mit kaputter Route', () => {
    const doc = clone(baseContent);
    doc.entries[0].route = 'home ohne raute';
    return doc;
  });
  push('Inhalt mit freistehendem Punkt-Pfad', () => {
    const doc = clone(baseContent);
    doc.entries[0].source = { path: '../ausserhalb.md' };
    return doc;
  });
  push('Claim verified ohne citation', () => {
    const doc = clone(baseContent);
    delete doc.claims[0].citation;
    return doc;
  });
  push('Katalog ohne entries', () => {
    const doc = clone(baseContent);
    doc.entries = [];
    return doc;
  });
  push('Design-Katalog mit claims-Array', () => {
    const doc = clone(baseDesign);
    doc.claims = [];
    return doc;
  });

  return cases;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Validiert die Kataloge gegen catalog.schema.json. Optionen: --examples --negativ');
    return;
  }
  const options = { examples: argv.includes('--examples') };
  const onlyNegatives = argv.includes('--negativ');
  const ajvModule = loadAjv();

  if (!ajvModule.available) {
    console.error(`HINWEIS: ajv nicht verfuegbar (${ajvModule.reason}).`);
    console.error('Ohne ajv bleibt die Pruefung bei scripts/migration-baseline/validate-catalogs.cjs.');
    process.exit(2);
  }

  const schema = readJson(SCHEMA_FILE);
  const ajv = new ajvModule.Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(schema);
  // Gegen die konkrete Wurzel validieren, nicht gegen oneOf: sonst mischt ajv die
  // Fehler beider Zweige und meldet am Design-Zweig, was am Inhalts-Zweig fehlt.
  const validators = {
    design: ajv.compile({ $ref: `${schema.$id}#/$defs/designCatalog` }),
    content: ajv.compile({ $ref: `${schema.$id}#/$defs/contentCatalog` }),
  };
  const check = (doc) => {
    const kind = doc && doc.catalog === 'content' ? 'content' : 'design';
    const validate = validators[kind];
    const ok = validate(doc);
    return { ok, kind, errors: validate.errors || [] };
  };
  let failures = 0;
  let checks = 0;

  if (!onlyNegatives) {
    for (const file of positives(options)) {
      checks += 1;
      const result = check(readJson(file));
      if (result.ok) {
        console.log(`OK         ${rel(file)} (Wurzel ${result.kind})`);
      } else {
        failures += 1;
        console.log(`FEHLER     ${rel(file)} (Wurzel ${result.kind})`);
        for (const error of result.errors) console.log(`           ${error.instancePath || '/'} ${error.message}`);
      }
    }
  }

  if (onlyNegatives || options.examples === false) {
    for (const testCase of negatives()) {
      checks += 1;
      const result = check(testCase.doc);
      if (result.ok) {
        failures += 1;
        console.log(`DURCHGELASSEN (unerwartet) ${testCase.name}`);
      } else {
        const deepest = result.errors.reduce(
          (best, error) => (error.instancePath.length > best.instancePath.length ? error : best),
          result.errors[0]
        );
        console.log(`abgelehnt  ${testCase.name} — ${deepest.instancePath || '/'} ${deepest.message}`);
      }
    }
  }

  if (!checks) {
    console.log('Kein Katalog gefunden. Erwartet: design-catalog.json und content-catalog.json im Katalogordner.');
    process.exit(2);
  }

  console.log('');
  console.log(`Gesamt: ${checks} Pruefungen, ${failures} Abweichung(en)`);
  process.exit(failures ? 1 : 0);
}

main();
