// Generate the browser/offline data module for the astrology area from the
// approved content package (docs/astrologie-konzept/content/*.json).
//
// Why a generator instead of fetch(): the file:// edition must work without any
// network request, so the website cannot load the JSON at runtime. The module
// emitted here is plain ES module data, imported by js/modules/astrologie.js
// (lazily on HTTP, eagerly inlined by the webpack offline bundle).
//
// The generator also re-asserts the contract the content package promised
// (counts, unique ids/slugs, resolvable cross references, resolvable sources
// and inline markers) and fails hard instead of shipping a half dataset.
//
// Usage:
//   node scripts/generate-astrologie-data.cjs           # write js/data/astrologie.js
//   node scripts/generate-astrologie-data.cjs --check    # fail if the file is stale
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'docs', 'astrologie-konzept', 'content');
const target = path.join(root, 'js', 'data', 'astrologie.js');

const EXPECTED = {
  zeichen: 12,
  faktoren: 10,
  haeuser: 12,
  aspekte: 5,
  grundlagen: 24,
  beispiele: 4,
  faq: 15,
  glossar: 65,
  lernpfad: 6,
  quellen: 25,
  claims: 28,
};

// Every reference field that must resolve inside the dataset.
const REF_FIELDS = ['cross_refs', 'see_also', 'related', 'refs'];
// Inline source markers such as "… [S11][S17]." inside long texts.
const MARKER = /\[(S\d{2})\]/g;

function fail(message) {
  const error = new Error(message);
  error.name = 'AstrologieDataError';
  throw error;
}

function readDataset(file) {
  const full = path.join(contentDir, file);
  if (!fs.existsSync(full)) fail(`missing dataset: ${file}`);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (error) {
    fail(`${file}: invalid JSON (${error.message})`);
  }
  if (!data || !Array.isArray(data.items)) fail(`${file}: no items[]`);
  return data;
}

function collectTexts(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => collectTexts(entry, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((entry) => collectTexts(entry, out));
  return out;
}

function build() {
  const zeichen = readDataset('zeichen.json');
  const faktoren = readDataset('faktoren.json');
  const haeuser = readDataset('haeuser.json');
  const aspekte = readDataset('aspekte.json');
  const grundlagen = readDataset('grundlagen.json');
  const beispiele = readDataset('beispiele.json');
  const faq = readDataset('faq.json');
  const glossar = readDataset('glossar.json');
  const lernpfad = readDataset('lernpfad.json');
  const quellenFile = JSON.parse(fs.readFileSync(path.join(contentDir, 'quellen.json'), 'utf8'));
  if (!Array.isArray(quellenFile.quellen) || !Array.isArray(quellenFile.claims))
    fail('quellen.json: quellen[]/claims[] missing');

  const sets = {
    zeichen: zeichen.items,
    faktoren: faktoren.items,
    haeuser: haeuser.items,
    aspekte: aspekte.items,
    grundlagen: grundlagen.items,
    beispiele: beispiele.items,
    faq: faq.items,
    glossar: glossar.items,
    lernpfad: lernpfad.items,
    quellen: quellenFile.quellen,
    claims: quellenFile.claims,
  };

  for (const [name, expected] of Object.entries(EXPECTED)) {
    if (sets[name].length !== expected) fail(`${name}: expected ${expected} entries, found ${sets[name].length}`);
  }

  // --- Unique ids across every dataset -------------------------------------
  const idToItem = new Map();
  const slugToItem = new Map();
  for (const [dataset, items] of Object.entries(sets)) {
    for (const item of items) {
      if (!item.id) fail(`${dataset}: entry without id`);
      if (idToItem.has(item.id)) fail(`duplicate id: ${item.id}`);
      idToItem.set(item.id, { dataset, item });
      if (item.slug) {
        if (!/^[a-z0-9-]+$/.test(item.slug)) fail(`invalid slug: ${dataset}/${item.slug}`);
        if (slugToItem.has(item.slug)) fail(`duplicate slug: ${item.slug}`);
        slugToItem.set(item.slug, { dataset, item });
      }
    }
  }
  // A reference may be written as id or as slug. If a key exists in both spaces
  // it must point at the same entry, otherwise resolution would be ambiguous.
  for (const [key, bySlug] of slugToItem) {
    const byId = idToItem.get(key);
    if (byId && byId.item !== bySlug.item) fail(`ambiguous reference key: ${key}`);
  }

  const resolveRef = (ref) => idToItem.get(ref) || slugToItem.get(ref);

  // --- Source ledger references -------------------------------------------
  const sourceIds = new Set(sets.quellen.map((entry) => entry.id));
  const claimIds = new Set(sets.claims.map((entry) => entry.id));
  for (const items of Object.values(sets)) {
    for (const item of items) {
      for (const source of item.sources || []) {
        if (!sourceIds.has(source)) fail(`${item.id}: unknown source ${source}`);
      }
      for (const claim of item.claims || []) {
        if (!claimIds.has(claim)) fail(`${item.id}: unknown claim ${claim}`);
      }
      // Inline [Sxx] markers must be backed by the item's own source panel,
      // otherwise the rendered marker would link to an unseen source.
      if (item.sources) {
        for (const text of collectTexts(item)) {
          for (const match of text.matchAll(MARKER)) {
            if (!item.sources.includes(match[1])) fail(`${item.id}: marker ${match[1]} missing in sources[]`);
          }
        }
      }
      for (const field of REF_FIELDS) {
        for (const ref of item[field] || []) {
          if (!resolveRef(ref)) fail(`${item.id}: unresolved ${field} reference ${ref}`);
        }
      }
      for (const step of [...(item.steps || []), ...(item.schritte || [])]) {
        for (const ref of step.refs || []) {
          if (!resolveRef(ref)) fail(`${item.id}: unresolved step reference ${ref}`);
        }
      }
    }
  }
  for (const claim of sets.claims) {
    for (const source of claim.quellen || []) {
      if (!sourceIds.has(source)) fail(`${claim.id}: unknown source ${source}`);
    }
  }

  // --- Placeholder / empty guards -----------------------------------------
  for (const items of Object.values(sets)) {
    for (const item of items) {
      const texts = collectTexts(item);
      const joined = texts.join('\n');
      if (/\b(TODO|TBD|Lorem ipsum|PLATZHALTER|FIXME)\b/i.test(joined)) fail(`${item.id}: placeholder text`);
      if (texts.length && texts.every((text) => !text.trim())) fail(`${item.id}: all texts empty`);
    }
  }

  const exported = {
    META: {
      stand: zeichen.stand,
      version: zeichen.version,
      arbeitsannahme: {
        zeichen: zeichen.arbeitsannahme,
        faktoren: faktoren.arbeitsannahme,
        haeuser: haeuser.arbeitsannahme,
        aspekte: aspekte.arbeitsannahme,
        grundlagen: grundlagen.arbeitsannahme,
        beispiele: beispiele.arbeitsannahme,
        faq: faq.arbeitsannahme,
        glossar: glossar.arbeitsannahme,
        lernpfad: lernpfad.arbeitsannahme,
        quellen: quellenFile.arbeitsannahme,
      },
      counts: Object.fromEntries(Object.entries(EXPECTED).map(([name, value]) => [name, value])),
    },
    LERNPFAD_INTRO: lernpfad.intro,
    ZEICHEN: sets.zeichen,
    FAKTOREN: sets.faktoren,
    HAEUSER: sets.haeuser,
    ASPEKTE: sets.aspekte,
    GRUNDLAGEN: sets.grundlagen,
    LERNPFAD: sets.lernpfad,
    BEISPIELE: sets.beispiele,
    FAQ: sets.faq,
    GLOSSAR: sets.glossar,
    QUELLEN: sets.quellen,
    CLAIMS: sets.claims,
  };

  const header = [
    '// GENERATED FILE — do not edit by hand.',
    '// Source of truth: docs/astrologie-konzept/content/*.json (approved content package).',
    '// Regenerate with: npm run data:astrologie',
    '// Check freshness with: node scripts/generate-astrologie-data.cjs --check',
    '',
  ].join('\n');
  const body = Object.entries(exported)
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)};\n`)
    .join('\n');
  return { source: header + body, counts: EXPECTED, idCount: idToItem.size };
}

function main() {
  const check = process.argv.includes('--check');
  let result;
  try {
    result = build();
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
    return;
  }
  if (check) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    if (current !== result.source) {
      console.error('FAIL js/data/astrologie.js is stale — run npm run data:astrologie');
      process.exitCode = 1;
      return;
    }
    console.log(`PASS js/data/astrologie.js is current (${result.idCount} ids, ${result.source.length} bytes)`);
    return;
  }
  fs.writeFileSync(target, result.source);
  console.log(
    `Wrote js/data/astrologie.js (${result.idCount} ids, ${result.source.length} bytes) from docs/astrologie-konzept/content/*.json`
  );
}

if (require.main === module) main();

module.exports = { build, target, contentDir, EXPECTED };
