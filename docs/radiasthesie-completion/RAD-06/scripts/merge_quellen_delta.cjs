// RAD-06 — Quellenbasis zusammenführen (Q01–Q33 + Delta Q34–Q66).
//
// Schreibt docs/radiasthesie-konzept/recherche/quellen.json neu, ohne die
// Bestandseinträge stillschweigend zu verändern. Zwei Änderungen am Bestand
// sind aus RAD-02 (KORREKTUREN.md K03, K04) ausdrücklich beauftragt und werden
// unten einzeln protokolliert; alle übrigen Bestandseinträge müssen bytegleich
// bleiben, sonst bricht das Skript ab.
//
// Aufruf: node docs/radiasthesie-completion/RAD-06/scripts/merge_quellen_delta.cjs

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../../../..');
const registryFile = path.join(root, 'docs/radiasthesie-konzept/recherche/quellen.json');
const deltaFile = path.join(root, 'docs/radiasthesie-completion/RAD-02/quellen-delta.json');
const reportFile = path.join(root, 'docs/radiasthesie-completion/RAD-06/quellen-merge-report.json');

const fail = (message) => {
  console.error('FEHLER: ' + message);
  process.exit(1);
};

const sha = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
const delta = JSON.parse(fs.readFileSync(deltaFile, 'utf8'));

if (registry.sources.length !== 33) fail(`Bestand hat ${registry.sources.length} statt 33 Quellen`);
if (delta.sources.length !== 33) fail(`Delta hat ${delta.sources.length} statt 33 Quellen`);

const expectedBase = Array.from({ length: 33 }, (_, index) => `Q${String(index + 1).padStart(2, '0')}`);
const baseIds = registry.sources.map((source) => source.id);
if (baseIds.join(',') !== expectedBase.join(',')) fail('Bestand ist nicht Q01–Q33 in Reihenfolge');
const deltaIds = delta.sources.map((source) => source.id);
const expectedDelta = Array.from({ length: 33 }, (_, index) => `Q${String(index + 34).padStart(2, '0')}`);
if (deltaIds.join(',') !== expectedDelta.join(',')) fail('Delta ist nicht Q34–Q66 in Reihenfolge');

// --- Verifikationsstufen -------------------------------------------------
// Das Delta verwendet feinere Stufen als der Bestand. Wo die Bedeutung
// identisch ist, wird auf den vorhandenen Schlüssel abgebildet; wo sie es
// nicht ist, kommt ein eigener, ehrlicher Schlüssel dazu (keine Aufwertung).
const VERIFIED_MAP = {
  page_loaded: 'page_loaded',
  full_text: 'page_loaded',
  crossref: 'crossref',
  metadata_doi_csl: 'crossref',
  library_record: 'library_record',
  secondary_isbn: 'secondary_isbn',
  full_text_partial: 'full_text_partial',
  abstract: 'abstract',
  metadata_openalex: 'metadata_openalex',
};

const NEW_LEVELS = {
  full_text_partial: 'Volltext nur teilweise geprüft (Auszug, Vorschau oder einzelne Kapitel)',
  abstract: 'Nur Abstract geprüft, kein Volltext',
  metadata_openalex: 'Metadaten über OpenAlex geprüft, kein Volltext',
};

const LEVEL_SOURCE = {
  full_text_partial: 'RAD-02 (Q34–Q66), dort als full_text_partial geführt',
  abstract: 'RAD-02 (Q34–Q66), dort als abstract geführt',
  metadata_openalex: 'RAD-02 (Q34–Q66), dort als metadata_openalex geführt',
};

const changes = [];

// --- Delta-Einträge in das Bestandsschema überführen ---------------------
const deltaSources = delta.sources.map((source) => {
  const verifiedRaw = source.verified;
  const verified = VERIFIED_MAP[verifiedRaw];
  if (!verified) fail(`${source.id}: unbekannte Verifikationsstufe '${verifiedRaw}'`);
  if (verified !== verifiedRaw) {
    changes.push({
      kind: 'verification_mapped',
      id: source.id,
      from: verifiedRaw,
      to: verified,
      reason: 'Delta-Stufe hat im Bestandsschema dieselbe Bedeutung',
    });
  }
  if (!Array.isArray(source.authors) || !source.authors.length) fail(`${source.id}: authors fehlt`);
  if (!source.title) fail(`${source.id}: title fehlt`);
  if (!source.interest_note) fail(`${source.id}: interest_note fehlt`);
  if (!/^https?:\/\//i.test(String(source.locator || '')) && !/^ISBN/i.test(String(source.locator || ''))) {
    fail(`${source.id}: locator ist weder URL noch ISBN: ${source.locator}`);
  }
  if (!Array.isArray(source.topics) || !source.topics.length) fail(`${source.id}: topics fehlt`);
  for (const topic of source.topics) {
    if (!['radiasthesie', 'pendeln', 'orakel'].includes(topic)) fail(`${source.id}: unbekanntes Thema ${topic}`);
  }
  if (!Array.isArray(source.evidence_use) || !source.evidence_use.length) fail(`${source.id}: evidence_use fehlt`);
  for (const level of source.evidence_use) {
    if (!/^[A-E]$/.test(level)) fail(`${source.id}: ungültige Evidenzstufe ${level}`);
  }

  return {
    id: source.id,
    type: source.type,
    title: source.title,
    authors: source.authors,
    year: source.year == null ? null : source.year,
    year_note: source.year_note || (source.year ? `Erscheinungsjahr laut Quelle (RAD-02)` : 'Ohne belastbare Jahresangabe; Stand der Abfrage 2026-11-03'),
    container: source.container || '',
    locator: source.locator,
    isbn: source.isbn || null,
    verified,
    verified_source: verifiedRaw,
    evidence_use: source.evidence_use,
    interest_note: source.interest_note,
    topics: source.topics,
    // Zusatzangaben aus dem Delta, die eine Bewertung tragen: Herkunft,
    // Prüfumfang, Datenqualität und die zugeordneten Aussagen.
    access_note: source.access_note || '',
    language: source.language || '',
    region: source.region || '',
    data_quality: source.data_quality || null,
    delta_role: source.delta_role || [],
    claims: source.claims || [],
    delta: 'RAD-02 (ESOW-RAD-02), übernommen in RAD-06',
  };
});

// --- Bestand prüfen und die zwei beauftragten Korrekturen anwenden -------
const baseSnapshot = new Map(registry.sources.map((source) => [source.id, JSON.parse(JSON.stringify(source))]));

const baseSources = registry.sources.map((source) => {
  const entry = JSON.parse(JSON.stringify(source));
  if (entry.id === 'Q01') {
    // K03: Webfassung und Printoriginal trennen, statt das Jahr leer zu lassen.
    entry.year_note =
      'Webfassung, aktualisiert 2026-09-17 (Abruf 2026-11-02); Printoriginal: USGS GIP „Water Dowsing“, 1977, DOI 10.3133/7000104';
    changes.push({
      kind: 'correction',
      id: 'Q01',
      code: 'K03',
      field: 'year_note',
      from: baseSnapshot.get('Q01').year_note,
      to: entry.year_note,
    });
  }
  if (entry.id === 'Q30') {
    // K04: ISBN über lobid bestätigt, Verifikationsstufe anheben.
    if (entry.verified !== 'secondary_isbn') fail(`Q30 hat unerwartete Stufe ${entry.verified}`);
    entry.verified = 'library_record';
    entry.isbn = '3-432-84473-5';
    changes.push({
      kind: 'correction',
      id: 'Q30',
      code: 'K04',
      field: 'verified',
      from: 'secondary_isbn',
      to: 'library_record',
      note: 'ISBN 3-432-84473-5 über lobid (TT002048267) bestätigt',
    });
  }
  return entry;
});

// --- Zusammenführen ------------------------------------------------------
const sources = [...baseSources, ...deltaSources];
if (sources.length !== 66) fail(`Ergebnis hat ${sources.length} statt 66 Quellen`);
const ids = sources.map((source) => source.id);
if (new Set(ids).size !== ids.length) fail('doppelte Quellen-IDs');

// Unveränderte Bestandseinträge nachweisen: nur Q01 (year_note) und
// Q30 (verified/isbn) dürfen vom Schnappschuss abweichen.
const unexpected = [];
for (const id of expectedBase) {
  const before = baseSnapshot.get(id);
  const after = sources.find((source) => source.id === id);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      const allowed = (id === 'Q01' && key === 'year_note') || (id === 'Q30' && (key === 'verified' || key === 'isbn'));
      if (!allowed) unexpected.push(`${id}.${key}`);
    }
  }
}
if (unexpected.length) fail(`unbeauftragte Änderungen am Bestand: ${unexpected.join(', ')}`);

const output = {
  ...registry,
  generated_at: '2026-11-03',
  generated_note:
    'Bestand Q01–Q33 unverändert übernommen (Ausnahmen: K03 an Q01.year_note, K04 an Q30.verified/isbn laut docs/radiasthesie-completion/RAD-02/KORREKTUREN.md). Delta Q34–Q66 aus docs/radiasthesie-completion/RAD-02/quellen-delta.json, in RAD-06 in das Bestandsschema überführt. Keine Quelle ohne Locator, Interessenvermerk und Evidenzstufe.',
  verification_levels: { ...registry.verification_levels, ...NEW_LEVELS },
  verification_level_sources: LEVEL_SOURCE,
  sources,
  coverage_gaps: [
    ...(registry.coverage_gaps || []),
    ...(delta.gaps_remaining || []),
  ],
  counts: { total: sources.length, base: 33, delta: 33 },
};

fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(registryFile, JSON.stringify(output, null, 2) + '\n', 'utf8');

const report = {
  generated_at: '2026-11-03',
  base_sources: 33,
  delta_sources: 33,
  total: sources.length,
  base_sha256_before: sha(registry.sources),
  full_registry_sha256_after: crypto
    .createHash('sha256')
    .update(fs.readFileSync(registryFile))
    .digest('hex'),
  changes,
  unchanged_base_entries: expectedBase.filter((id) => id !== 'Q01' && id !== 'Q30').length,
  verification_levels_used: [...new Set(sources.map((source) => source.verified))].sort(),
  topics: {
    radiasthesie: sources.filter((source) => source.topics.includes('radiasthesie')).length,
    pendeln: sources.filter((source) => source.topics.includes('pendeln')).length,
    orakel: sources.filter((source) => source.topics.includes('orakel')).length,
  },
};
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log(
  `quellen.json geschrieben: ${sources.length} Quellen (${report.unchanged_base_entries} Bestandseinträge unverändert, ` +
    `${changes.filter((entry) => entry.kind === 'correction').length} beauftragte Korrekturen, ` +
    `${changes.filter((entry) => entry.kind === 'verification_mapped').length} Stufen-Abbildungen)`
);
