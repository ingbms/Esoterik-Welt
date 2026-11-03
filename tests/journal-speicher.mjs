// Pendeltagebuch (RAD-10) — deterministische Tests ohne Browser.
//
// Geprüft werden:
//   * Speicher: leerer Stand, Rundlauf, defektes JSON, falscher Umschlag,
//     neueres Schema, Quota, fehlender Speicher — jeweils ohne Throw,
//   * vollständige Löschung aller `esot_rad_`-Schlüssel (inklusive
//     Sicherungskopien) und die Abgrenzung zu fremden Schlüsseln,
//   * CSV (BOM, Semikolon, Quoting, CRLF) und JSON-Export/-Import samt
//     atomarer Ablehnung, Größen- und Mengengrenze,
//   * Zusammenführung (gleiche Kennung ersetzt), Bearbeitung mit erhaltener
//     Kennung und geleerten optionalen Feldern,
//   * Validierung (Pflichtfelder, Längen, Steuerzeichen, Methode, Laufbezug)
//     und die Übernahme eines abgeschlossenen Laufs aus RAD-09,
//   * Route #pendeln/journal, Ansicht und Werkstatt-Karte.
//
// Läufe entstehen über den echten Vertrag (Commit → Sperre → Enthüllung) mit
// deterministischem Zufall und fester Uhr; es gibt keine Attrappen-Daten.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ROUTE } from '../js/modules/radiasthesie-format.js';
import { createModel } from '../js/modules/radiasthesie-model.js';
import { renderJournal, renderLanding } from '../js/modules/radiasthesie-views.js';
import RADIASTHESIE from '../js/data/radiasthesie.js';
import { WERKSTATT } from '../js/data/radiasthesie-werkstatt.js';
import {
  beginTrial,
  createRun,
  entryFromRun,
  lockPrediction,
  revealResult,
  runSummary,
} from '../js/modules/radiasthesie-vertraege.js';
import {
  CONFIDENCE_LABELS,
  MAX_ENTRIES,
  MAX_IMPORT_BYTES,
  STORAGE_KEY,
  buildEntry,
  confidenceLabel,
  countExperimentEntries,
  deleteAllStoredData,
  filterEntries,
  findEntry,
  formatDateDe,
  listStoredKeys,
  mergeEntries,
  parseImport,
  readEntries,
  removeEntry,
  sortEntries,
  toCsv,
  toJsonText,
  upsertEntry,
  writeEntries,
} from '../js/modules/journal-speicher.js';

const model = createModel(RADIASTHESIE);
const methodIds = WERKSTATT.methoden.map((method) => method.id);

function mulberry32(seed) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fixedClock(start = '2026-11-03T10:00:00.000Z') {
  let time = new Date(start).getTime();
  return () => new Date((time += 1000));
}

async function completeRun(id, { seed = 4711 } = {}) {
  const rng = mulberry32(seed);
  const clock = fixedClock();
  let run = await createRun(WERKSTATT.experimentById(id), { rng, now: clock, batchId: 'test-sitzung' });
  for (let index = 1; index <= run.protocol.n; index += 1) {
    const started = await beginTrial(run, { rng, now: clock });
    run = started.run;
    run = lockPrediction(run, index, started.secret.targetIndex, { now: clock });
    run = (await revealResult(run, index, started.secret, { now: clock })).run;
  }
  return run;
}

async function incompleteRun(id, { seed = 99 } = {}) {
  const rng = mulberry32(seed);
  const clock = fixedClock();
  let run = await createRun(WERKSTATT.experimentById(id), { rng, now: clock });
  const started = await beginTrial(run, { rng, now: clock });
  run = started.run;
  run = lockPrediction(run, 1, 0, { now: clock });
  return run;
}

/** Speicher-Attrappe nach dem Web-Storage-Interface, inklusive Aufzählung. */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
    _map: map,
  };
}

const fixedNow = () => new Date('2026-11-03T12:00:00.000Z');

const sampleFields = (overrides = {}) => ({
  date: '2026-11-02',
  question: 'Trifft das Pendel das verdeckte Ziel?',
  prediction: 'Ja, etwa sieben von zehn Versuchen.',
  method: 'pendeln',
  confidence: '4',
  result: 'Sechs von zehn Versuchen.',
  review: 'Die Frage war zu weit gefasst.',
  ...overrides,
});

// --- Speicher -------------------------------------------------------------

test('Speicher: leerer Stand und Rundlauf mit Sortierung nach Datum', () => {
  const storage = fakeStorage();
  const leer = readEntries(storage, { now: fixedNow });
  assert.equal(leer.state, 'empty');
  assert.deepEqual(leer.entries, []);

  const first = buildEntry({ ...sampleFields({ date: '2026-10-01' }) }, { now: fixedNow, methodIds }).entry;
  const second = buildEntry({ ...sampleFields({ date: '2026-11-02' }) }, { now: fixedNow, methodIds }).entry;
  const written = writeEntries(storage, [first, second], { now: fixedNow });
  assert.equal(written.ok, true);

  const read = readEntries(storage, { now: fixedNow });
  assert.equal(read.state, 'ok');
  assert.equal(read.entries.length, 2);
  const sorted = sortEntries(read.entries);
  assert.equal(sorted[0].date, '2026-11-02', 'neuestes Datum zuerst');
  assert.equal(sorted[1].date, '2026-10-01');
  assert.equal(sortEntries([first])[0].id, first.id);
});

test('Speicher: defektes JSON wird gesichert und geleert, ohne Throw', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{kaputt' });
  const result = readEntries(storage, { now: fixedNow });
  assert.equal(result.state, 'corrupt');
  assert.match(result.message, /JSON-Fehler/);
  assert.ok(result.backupKey, 'Sicherungsschlüssel fehlt');
  assert.equal(storage.getItem(STORAGE_KEY), null, 'defekter Schlüssel bleibt stehen');
  assert.equal(storage.getItem(result.backupKey), '{kaputt');
  assert.ok(result.backupKey.startsWith('esot_rad_corrupt_'));
});

test('Speicher: falscher Umschlag und fehlende Liste werden gesichert', () => {
  for (const raw of ['[]', '"text"', '{"schema":1,"data":{}}', '{"schema":1,"data":[null]}']) {
    const storage = fakeStorage({ [STORAGE_KEY]: raw });
    const result = readEntries(storage, { now: fixedNow });
    assert.equal(result.state, 'corrupt', `nicht erkannt: ${raw}`);
    assert.ok(result.backupKey);
    assert.equal(storage.getItem(STORAGE_KEY), null);
  }
});

test('Speicher: neueres Schema wird gemeldet, aber nicht überschrieben', () => {
  const raw = JSON.stringify({ schema: 2, savedAt: fixedNow().toISOString(), data: [{ id: 'jr-zukunft' }] });
  const storage = fakeStorage({ [STORAGE_KEY]: raw });
  const result = readEntries(storage, { now: fixedNow });
  assert.equal(result.state, 'future');
  assert.match(result.message, /Schema 2/);
  assert.equal(storage.getItem(STORAGE_KEY), raw, 'neuere Version darf nicht überschrieben werden');
});

test('Speicher: Quota und fehlender Speicher liefern eine Meldung statt Throw', () => {
  const quota = fakeStorage();
  quota.setItem = () => {
    const error = new Error('voll');
    error.name = 'QuotaExceededError';
    throw error;
  };
  const entry = buildEntry(sampleFields(), { now: fixedNow, methodIds }).entry;
  const full = writeEntries(quota, [entry], { now: fixedNow });
  assert.equal(full.ok, false);
  assert.match(full.message, /Speicher ist voll/);
  assert.match(full.message, /exportieren/);

  const broken = fakeStorage();
  broken.setItem = () => {
    throw new Error('gesperrt');
  };
  const denied = writeEntries(broken, [entry], { now: fixedNow });
  assert.equal(denied.ok, false);
  assert.match(denied.message, /nur für diese Sitzung/);

  assert.equal(readEntries(null, { now: fixedNow }).state, 'unavailable');
  assert.equal(writeEntries(null, [entry], { now: fixedNow }).ok, false);
});

test('Speicher: Obergrenze von 500 Einträgen wird nicht überschritten', () => {
  const storage = fakeStorage();
  const entries = Array.from({ length: MAX_ENTRIES + 1 }, (_, index) => ({
    id: `jr-test-${String(index).padStart(4, '0')}`,
    date: '2026-11-02',
    question: 'Frage',
    prediction: 'Vorhersage',
    createdAt: fixedNow().toISOString(),
  }));
  const result = writeEntries(storage, entries, { now: fixedNow });
  assert.equal(result.ok, false);
  assert.match(result.message, /500/);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('vollständige Löschung entfernt alle esot_rad_-Schlüssel, fremde bleiben', () => {
  const storage = fakeStorage({
    [STORAGE_KEY]: '{"schema":1,"data":[]}',
    esot_rad_experiment_v1: '{"schema":1,"data":[]}',
    esot_rad_studio_v1: '{"schema":1,"data":{}}',
    esot_rad_corrupt_esot_rad_journal_v1_20261103: '{"kaputt":true}',
    anderer_anbieter: 'bleibt',
  });
  const keys = listStoredKeys(storage).sort();
  assert.deepEqual(keys, [
    'esot_rad_corrupt_esot_rad_journal_v1_20261103',
    'esot_rad_experiment_v1',
    STORAGE_KEY,
    'esot_rad_studio_v1',
  ]);

  const result = deleteAllStoredData(storage);
  assert.equal(result.ok, true);
  assert.equal(result.removed, 4);
  assert.equal(storage.length, 1);
  assert.equal(storage.getItem('anderer_anbieter'), 'bleibt');
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem('esot_rad_corrupt_esot_rad_journal_v1_20261103'), null);
});

test('Löschung meldet Schlüssel, die sich nicht entfernen lassen', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{"schema":1,"data":[]}', esot_rad_studio_v1: '{}' });
  storage.removeItem = () => {
    throw new Error('gesperrt');
  };
  const result = deleteAllStoredData(storage);
  assert.equal(result.ok, false);
  assert.equal(result.removed, 0);
  assert.equal(result.failed.length, 2);
  assert.match(result.message, /0 von 2/);
});

// --- Listenoperationen ----------------------------------------------------

test('Listen: ergänzen, ersetzen, entfernen, filtern, zählen', () => {
  const a = buildEntry(sampleFields({ question: 'Erste Frage', experimentId: 'exp-ja-nein-20' }), {
    now: fixedNow,
    methodIds,
  }).entry;
  const b = buildEntry(sampleFields({ question: 'Zweite Frage' }), { now: fixedNow, methodIds }).entry;
  let list = upsertEntry([], a);
  list = upsertEntry(list, b);
  assert.equal(list.length, 2);
  const replaced = { ...a, question: 'Erste Frage, korrigiert' };
  list = upsertEntry(list, replaced);
  assert.equal(list.length, 2);
  assert.equal(findEntry(list, a.id).question, 'Erste Frage, korrigiert');
  assert.equal(countExperimentEntries([a, b]), 1);
  assert.equal(filterEntries([a, b], 'experiment').length, 1);
  assert.equal(filterEntries([a, b], 'all').length, 2);
  assert.equal(removeEntry(list, a.id).length, 1);
  assert.equal(removeEntry(list, 'gibt-es-nicht').length, 2);
  assert.equal(findEntry(list, 'gibt-es-nicht'), null);
});

test('Datum und Sicherheit werden deutsch formatiert, Unbekanntes bleibt sichtbar', () => {
  assert.equal(formatDateDe('2026-11-02'), '02.11.2026');
  assert.equal(formatDateDe(''), '—');
  assert.equal(formatDateDe(null), '—');
  assert.equal(formatDateDe('02.11.2026'), '—');
  assert.equal(confidenceLabel(4), '4 von 5 · eher sicher');
  assert.equal(confidenceLabel(1), `1 von 5 · ${CONFIDENCE_LABELS[1]}`);
  assert.equal(confidenceLabel(0), '');
  assert.equal(confidenceLabel('x'), '');
});

// --- Eintrag bauen --------------------------------------------------------

test('buildEntry erzeugt Kennung und Erstellzeit und trimmt Rand-Leerzeichen', () => {
  const trimmed = buildEntry(sampleFields({ question: '  Frage mit Rand  ' }), { now: fixedNow, methodIds });
  assert.equal(trimmed.ok, true);
  assert.equal(trimmed.entry.question, 'Frage mit Rand', 'Rand-Leerzeichen werden entfernt, nicht gespeichert');

  const clean = buildEntry(sampleFields(), { now: fixedNow, methodIds });
  assert.equal(clean.ok, true);
  assert.match(clean.entry.id, /^jr-\d{14}-[a-f0-9]{4}$/);
  assert.equal(clean.entry.createdAt, fixedNow().toISOString());
  assert.equal(clean.entry.date, '2026-11-02');
  assert.equal(clean.entry.confidence, 4);
  assert.equal(clean.entry.method, 'pendeln');
  assert.equal(Object.isFrozen(clean.entry), true);
});

test('buildEntry lehnt ungültige Felder mit Feldnamen ab', () => {
  const cases = [
    [{ date: '' }, 'date'],
    [{ date: '2026-13-01' }, 'date'],
    [{ question: 'ab' }, 'question'],
    [{ prediction: '' }, 'prediction'],
    [{ confidence: '9' }, 'confidence'],
    [{ confidence: '2.5' }, 'confidence'],
    [{ method: 'gibtsnicht' }, 'method'],
    [{ result: `a${String.fromCharCode(7)}b` }, 'result'],
    [{ review: 'x'.repeat(501) }, 'review'],
  ];
  for (const [overrides, path] of cases) {
    const result = buildEntry(sampleFields(overrides), { now: fixedNow, methodIds });
    assert.equal(result.ok, false, `akzeptiert: ${JSON.stringify(overrides)}`);
    assert.equal(result.errors[0].path, path, `falscher Pfad für ${JSON.stringify(overrides)}`);
  }
});

test('buildEntry: Bearbeitung behält Kennung und Erstellzeit, leert optionale Felder', () => {
  const original = buildEntry(sampleFields(), { now: fixedNow, methodIds }).entry;
  const edited = buildEntry(
    {
      date: '2026-11-03',
      question: 'Neue Frage',
      prediction: 'Neue Vorhersage',
      method: '',
      confidence: '',
      result: '',
      review: '',
    },
    { existing: original, now: () => new Date('2026-11-04T09:00:00.000Z'), methodIds }
  );
  assert.equal(edited.ok, true);
  assert.equal(edited.entry.id, original.id);
  assert.equal(edited.entry.createdAt, original.createdAt, 'Erstellzeit bleibt erhalten');
  assert.equal(edited.entry.date, '2026-11-03');
  assert.equal(edited.entry.method, undefined);
  assert.equal(edited.entry.confidence, undefined);
  assert.equal(edited.entry.result, undefined);
  assert.equal(edited.entry.review, undefined);
});

test('Laufbezug: runId erfordert experimentId und einen bekannten Lauf', async () => {
  const run = await completeRun('exp-ja-nein-20');
  const orphan = buildEntry(sampleFields({ runId: run.runId, experimentId: '' }), {
    now: fixedNow,
    methodIds,
    runs: [run],
  });
  assert.equal(orphan.ok, false);
  assert.equal(orphan.errors[0].path, 'experimentId');

  const unknownRun = buildEntry(sampleFields({ runId: 'run-unbekannt-123456', experimentId: 'exp-ja-nein-20' }), {
    now: fixedNow,
    methodIds,
    runs: [run],
  });
  assert.equal(unknownRun.ok, false);
  assert.equal(unknownRun.errors[0].path, 'runId');

  const wrongExperiment = buildEntry(sampleFields({ runId: run.runId, experimentId: 'exp-acht-orte-16' }), {
    now: fixedNow,
    methodIds,
    runs: [run],
  });
  assert.equal(wrongExperiment.ok, false);
  assert.equal(wrongExperiment.errors[0].path, 'experimentId');

  const good = buildEntry(sampleFields({ runId: run.runId, experimentId: run.experimentId }), {
    now: fixedNow,
    methodIds,
    runs: [run],
  });
  assert.equal(good.ok, true);
});

test('Übernahme aus dem Labor: nur vollständig enthüllte Läufe, Bezug bleibt stabil', async () => {
  const partial = await incompleteRun('exp-ja-nein-20');
  const rejected = entryFromRun(partial, { question: 'Frage zum Lauf' }, { now: fixedNow, methodIds });
  assert.equal(rejected.ok, false);
  assert.match(rejected.errors[0].message, /nicht vollständig enthüllt/);

  const run = await completeRun('exp-ja-nein-20');
  const summary = runSummary(run);
  assert.equal(summary.complete, true);
  const taken = entryFromRun(
    run,
    {
      question: 'Trifft das Pendel das verdeckte Ziel?',
      method: 'verblindeter-selbsttest',
      prediction: 'Vorregistriert: Testprotokoll, n=20.',
      result: '20/20 Treffer.',
    },
    { now: fixedNow, methodIds, runs: [run] }
  );
  assert.equal(taken.ok, true, JSON.stringify(taken.errors));
  assert.equal(taken.entry.experimentId, run.experimentId);
  assert.equal(taken.entry.runId, run.runId);
  assert.equal(taken.entry.date, '2026-11-03');
  assert.equal(taken.entry.method, 'verblindeter-selbsttest');
  assert.equal(taken.entry.prediction, 'Vorregistriert: Testprotokoll, n=20.');
  assert.equal(taken.entry.result, '20/20 Treffer.');
});

test('Bearbeitung mit gelöschtem Lauf: Struktur bleibt prüfbar, Bezug bleibt Text', async () => {
  const run = await completeRun('exp-ja-nein-20');
  const taken = entryFromRun(
    run,
    { question: 'Frage zum übernommenen Lauf' },
    { now: fixedNow, methodIds, runs: [run] }
  );
  assert.equal(taken.ok, true);
  const fields = {
    date: taken.entry.date,
    question: taken.entry.question,
    prediction: taken.entry.prediction,
    result: taken.entry.result,
    experimentId: taken.entry.experimentId,
    runId: taken.entry.runId,
  };
  // Der Aufrufer entscheidet: `runs: null` heißt „historischer Bezug, nicht
  // mehr prüfbar“ — die Bearbeitung bleibt möglich.
  const edited = buildEntry(
    { ...fields, review: 'Nachtrag nach dem Löschen des Laufs.' },
    {
      existing: taken.entry,
      now: fixedNow,
      methodIds,
      runs: null,
    }
  );
  assert.equal(edited.ok, true);
  assert.equal(edited.entry.runId, run.runId);
  assert.equal(edited.entry.review, 'Nachtrag nach dem Löschen des Laufs.');

  // Mit einer Lauf-Liste, die den Bezug nicht enthält, wird derselbe Eintrag
  // abgelehnt — so verhindert die Oberfläche neue, ungeprüfte Bezüge.
  const rejected = buildEntry(fields, { existing: taken.entry, now: fixedNow, methodIds, runs: [] });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.errors[0].path, 'runId');
});

// --- CSV ------------------------------------------------------------------

test('CSV: BOM, Semikolon, CRLF, Quoting und deutsche Spalten', () => {
  const entry = buildEntry(
    sampleFields({
      question: 'Frage mit "Anführungszeichen" und ; Semikolon',
      result: 'Zeile 1\nZeile 2',
    }),
    { now: fixedNow, methodIds }
  ).entry;
  const csv = toCsv([entry], {
    methodLabel: () => 'Pendeln (Praxis)',
    experimentLabel: (id) => `Experiment ${id}`,
  });
  assert.equal(csv.charCodeAt(0), 0xfeff, 'BOM fehlt');
  const body = csv.replace(/^\uFEFF/, '');
  assert.ok(body.endsWith('\r\n'));
  const lines = body.trimEnd().split('\r\n');
  assert.equal(lines[0], 'Datum;Frage;Methode;Vorhersage;Sicherheit;Ergebnis;Bewertung;Experiment;Lauf;Erstellt am');
  assert.ok(lines[1].startsWith('2026-11-02;'));
  assert.ok(lines[1].includes('"Frage mit ""Anführungszeichen"" und ; Semikolon"'));
  assert.ok(lines[1].includes('Pendeln (Praxis)'));
  assert.ok(lines[1].includes('4 von 5'));
  assert.ok(lines[1].includes('"Zeile 1\nZeile 2"'));
});

test('CSV: leere Liste erzeugt nur den Kopf, Sonderzeichen bleiben literal', () => {
  const csv = toCsv([], {});
  const lines = csv
    .replace(/^\uFEFF/, '')
    .trimEnd()
    .split('\r\n');
  assert.equal(lines.length, 1);
  assert.equal(lines[0].split(';').length, 10);

  const entry = buildEntry(sampleFields({ question: '<script>alert(1)</script>' }), { now: fixedNow, methodIds }).entry;
  const text = toCsv([entry], {});
  assert.ok(text.includes('<script>alert(1)</script>'), 'CSV ist Datenformat, kein HTML');
  assert.ok(!text.includes('&lt;script&gt;'));
});

// --- JSON -----------------------------------------------------------------

test('JSON-Export ist vertragskonform und wieder importierbar', () => {
  const entry = buildEntry(sampleFields(), { now: fixedNow, methodIds }).entry;
  const exported = toJsonText([entry], { now: fixedNow, methodIds, runs: null });
  assert.equal(exported.ok, true);
  const envelope = JSON.parse(exported.text);
  assert.equal(envelope.schema, 1);
  assert.equal(envelope.app, 'esoterik-welt');
  assert.equal(envelope.kind, 'journal');
  assert.equal(envelope.exportedAt, fixedNow().toISOString());
  assert.equal(envelope.data.length, 1);
  assert.equal(envelope.data[0].id, entry.id);

  const imported = parseImport(exported.text, { methodIds });
  assert.equal(imported.ok, true);
  assert.deepEqual(imported.entries, [entry]);
});

test('Import ist atomar: ein ungültiger Eintrag lehnt die ganze Datei ab', () => {
  const good = buildEntry(sampleFields(), { now: fixedNow, methodIds }).entry;
  const envelope = JSON.stringify({
    schema: 1,
    app: 'esoterik-welt',
    kind: 'journal',
    exportedAt: fixedNow().toISOString(),
    data: [good, { ...good, id: 'jr-kaputt-1', question: '' }],
  });
  const result = parseImport(envelope, { methodIds });
  assert.equal(result.ok, false);
  assert.deepEqual(result.entries, []);
  assert.ok(result.errors.length >= 1);
  assert.match(result.errors[0].message, /Frage/);
});

test('Import lehnt fremde Art, Schema, Größe und leeren Text ab', () => {
  const wrongKind = JSON.stringify({
    schema: 1,
    app: 'esoterik-welt',
    kind: 'experiment',
    exportedAt: fixedNow().toISOString(),
    data: [],
  });
  assert.equal(parseImport(wrongKind, { methodIds }).ok, false);
  assert.equal(parseImport('', { methodIds }).ok, false);
  assert.equal(parseImport('{kein json', { methodIds }).ok, false);
  const huge = 'x'.repeat(MAX_IMPORT_BYTES + 1);
  const tooLarge = parseImport(huge, { methodIds });
  assert.equal(tooLarge.ok, false);
  assert.match(tooLarge.errors[0].message, /1 MiB|zu groß|maxBytes/);
});

test('Import ignoriert unbekannte Felder und speichert sie nicht (Datensparsamkeit)', () => {
  const good = buildEntry(sampleFields(), { now: fixedNow, methodIds }).entry;
  const envelope = JSON.stringify({
    schema: 1,
    app: 'esoterik-welt',
    kind: 'journal',
    exportedAt: fixedNow().toISOString(),
    data: [{ ...good, fremdesFeld: 'wird ignoriert' }],
  });
  const result = parseImport(envelope, { methodIds });
  assert.equal(result.ok, true);
  assert.equal('fremdesFeld' in result.entries[0], false, 'Zusatzfeld darf nicht übernommen werden');
  assert.deepEqual(result.entries[0], good);
});

test('Import über 500 Einträge wird abgelehnt', () => {
  const entries = Array.from({ length: MAX_ENTRIES + 1 }, (_, index) => ({
    id: `jr-import-${String(index).padStart(4, '0')}`,
    date: '2026-11-02',
    question: 'Frage',
    prediction: 'Vorhersage',
    createdAt: fixedNow().toISOString(),
  }));
  const envelope = JSON.stringify({
    schema: 1,
    app: 'esoterik-welt',
    kind: 'journal',
    exportedAt: fixedNow().toISOString(),
    data: entries,
  });
  const result = parseImport(envelope, { methodIds });
  assert.equal(result.ok, false);
  assert.match(result.errors[0].message, /500/);
});

test('Zusammenführung: gleiche Kennung ersetzt, neue ergänzt, Grenze gilt fürs Ergebnis', () => {
  const existing = buildEntry(sampleFields({ question: 'Alter Stand' }), { now: fixedNow, methodIds }).entry;
  const replacement = { ...existing, question: 'Neuer Stand' };
  const fresh = buildEntry(sampleFields({ question: 'Zusätzlicher Eintrag', date: '2026-11-01' }), {
    now: fixedNow,
    methodIds,
  }).entry;
  const merged = mergeEntries([existing], [replacement, fresh]);
  assert.equal(merged.ok, true);
  assert.equal(merged.entries.length, 2);
  assert.equal(merged.added, 1);
  assert.equal(merged.replaced, 1);
  assert.equal(merged.entries.find((entry) => entry.id === existing.id).question, 'Neuer Stand');

  const overflow = mergeEntries([existing], [fresh], { maxEntries: 1 });
  assert.equal(overflow.ok, false);
  assert.deepEqual(overflow.entries, [existing], 'bei Überlauf bleibt der Bestand unverändert');
  assert.match(overflow.message, /höchstens 1/);
});

// --- Route und Ansicht ----------------------------------------------------

test('Route #pendeln/journal löst die Ansicht aus', () => {
  assert.equal(ROUTE.journal, '#pendeln/journal');
  const route = model.resolve(['journal']);
  assert.equal(route.view, 'journal');
  const view = renderJournal();
  assert.equal(view.journal, true);
  assert.equal(view.h1, 'Pendeltagebuch');
  assert.match(view.html, /id="pendelJournal"/);
  assert.match(view.html, /id="jrForm"/);
  assert.match(view.html, /id="jrEntries"/);
  assert.match(view.html, /id="jrDeleteAll"/);
  assert.match(view.html, /id="jrImportApply"/);
  assert.match(view.html, /esot_rad_journal_v1/);
  assert.match(view.html, /maxlength="200"/);
  assert.match(view.html, /type="date"/);
  for (const field of [
    'Datum',
    'Frage oder Versuch',
    'Verwendete Methode',
    'Eigene Vorhersage',
    'Subjektive Sicherheit',
    'Tatsächliches Ergebnis',
    'Spätere Bewertung',
  ]) {
    assert.ok(view.html.includes(field), `Feld fehlt: ${field}`);
  }
  for (const method of WERKSTATT.methoden) {
    assert.ok(view.html.includes(`value="${method.id}"`), `Methode fehlt: ${method.id}`);
  }
  assert.match(view.html, /kein Konto/);
  assert.match(view.html, /Kein Nachweis/);
  assert.equal(view.html.includes('onclick='), false);
  assert.equal(view.html.includes('<script'), false);
});

test('Werkstatt-Karte „Pendeltagebuch“ ist verfügbar und verlinkt', () => {
  const landing = renderLanding(model);
  assert.ok(landing.html.includes('Pendeltagebuch'));
  const workshop = model.data.landing.workshop;
  const entry = workshop.find((item) => item.title === 'Pendeltagebuch');
  assert.ok(entry, 'Werkstatt-Karte fehlt');
  assert.equal(entry.state, 'Verfügbar');
  assert.equal(entry.href, '#pendeln/journal');
  assert.equal(workshop.length, 4);
});
