// Experimentierlabor (RAD-09) — deterministische Tests ohne Browser.
//
// Geprüft werden:
//   * Binomialtest und Wilson-Intervall gegen unabhängig gerechnete
//     Referenzwerte (exakte Bruchrechnung in Python, siehe unten),
//   * Grenzfälle h = 0, h = n, n = 0 und ungültige Eingaben,
//   * Formatierung und Einordnung in deutscher Schreibweise,
//   * der vollständige Lauf über den Vertrag (Commit → Sperre → Enthüllung),
//     inklusive Leckfreiheit, Unveränderlichkeit und Auswertung,
//   * CSV-Rohdaten (BOM, Semikolon, Quoting, CRLF),
//   * Speicher (Umschlag, defekte Daten, neueres Schema, Quota),
//   * Route, Ansicht und Werkstatt-Karte,
//   * die Zufallsquelle (Web Crypto, Rejection Sampling, kein Math.random).
//
// Die Referenzwerte wurden mit rationaler Arithmetik (Python, fractions)
// berechnet, nicht mit dieser Implementierung:
//   p(15|20, 1/2)   = 5425/131072        = 0,04138946533203125
//   p(5|16, 1/8)    = 11445304706347/281474976710656 = 0,04066189058827874
//   p(8|25, 1/5)    = 8136780357103009/59604644775390625 = 0,1365125215956743
//   p(9|10, 1/2)    = 11/512             = 0,021484375
//   Wilson(15,20)   = [0,531299122381256, 0,8881382985923343]

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALPHA,
  TRIAL_LIMITS,
  analyseCounts,
  analyseRun,
  answerLabels,
  binomialExactTwoSided,
  binomialPmf,
  exportFileName,
  formatInterval,
  formatNumber,
  formatPercent,
  formatPValue,
  interpretation,
  multipleTestingNote,
  runsToCsv,
  testTypeLabel,
  trialRows,
  wilsonInterval,
} from '../js/modules/experiment-statistik.js';
import { createCryptoRng, cryptoAvailable, drawIndex, randomToken } from '../js/modules/experiment-zufall.js';
import {
  MAX_ANSWERS,
  STORAGE_KEY,
  countAnswers,
  getLocalStorage,
  readRuns,
  removeRun,
  upsertRun,
  verifyStored,
  writeRuns,
} from '../js/modules/experiment-speicher.js';
import { ROUTE } from '../js/modules/radiasthesie-format.js';
import { createModel } from '../js/modules/radiasthesie-model.js';
import { renderExperiment, renderLanding } from '../js/modules/radiasthesie-views.js';
import RADIASTHESIE from '../js/data/radiasthesie.js';
import { WERKSTATT } from '../js/data/radiasthesie-werkstatt.js';
import {
  beginTrial,
  createRun,
  importEnvelope,
  lockPrediction,
  revealResult,
  serializeEnvelope,
  validateRun,
} from '../js/modules/radiasthesie-vertraege.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => readFileSync(path.join(here, '..', relative), 'utf8');
const model = createModel(RADIASTHESIE);
const clone = (value) => JSON.parse(JSON.stringify(value));

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

const experiment = (id) => WERKSTATT.experimentById(id);

async function completeRun(id, { seed = 4711, hitPlan = null } = {}) {
  const rng = mulberry32(seed);
  const clock = fixedClock();
  let run = await createRun(experiment(id), { rng, now: clock, batchId: 'test-sitzung' });
  for (let index = 1; index <= run.protocol.n; index += 1) {
    const started = await beginTrial(run, { rng, now: clock });
    run = started.run;
    const answer = hitPlan ? hitPlan(index, started.secret.targetIndex, run.protocol.k) : started.secret.targetIndex;
    run = lockPrediction(run, index, answer, { now: clock });
    run = (await revealResult(run, index, started.secret, { now: clock })).run;
  }
  return run;
}

/** Speicher-Attrappe nach dem Web-Storage-Interface. */
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

// --- Statistik ------------------------------------------------------------

test('Binomialtest trifft unabhängig gerechnete Referenzwerte', () => {
  assert.ok(Math.abs(binomialPmf(15, 20, 0.5) - 15504 / 1048576) < 1e-15);
  const cases = [
    [15, 20, 0.5, 5425 / 131072],
    [5, 16, 0.125, 11445304706347 / 281474976710656],
    [8, 25, 0.2, 0.1365125215956743],
    [9, 10, 0.5, 11 / 512],
    [1, 10, 0.5, 11 / 512],
    [20, 20, 0.5, 1 / 524288],
    [0, 20, 0.5, 1 / 524288],
    [10, 20, 0.5, 1],
    [5, 25, 0.2, 1],
    [2, 16, 0.125, 1],
  ];
  for (const [hits, n, p, expected] of cases) {
    const actual = binomialExactTwoSided(hits, n, p);
    assert.ok(Math.abs(actual - expected) < 1e-12, `p(${hits}|${n},${p}) = ${actual}, erwartet ${expected}`);
  }
});

test('Binomialtest ist symmetrisch und bleibt im gültigen Bereich', () => {
  for (let hits = 0; hits <= 20; hits += 1) {
    const low = binomialExactTwoSided(hits, 20, 0.5);
    const high = binomialExactTwoSided(20 - hits, 20, 0.5);
    assert.ok(Math.abs(low - high) < 1e-12);
    assert.ok(low >= 0 && low <= 1);
  }
  assert.equal(binomialExactTwoSided(0, 0, 0.5), 1);
});

test('ungültige Eingaben für die Statistik werfen RangeError', () => {
  assert.throws(() => binomialPmf(-1, 10, 0.5), RangeError);
  assert.throws(() => binomialPmf(11, 10, 0.5), RangeError);
  assert.throws(() => binomialPmf(1, 10, 1.2), RangeError);
  assert.throws(() => binomialExactTwoSided(1, 10, 0), RangeError);
  assert.throws(() => binomialExactTwoSided(1, 10, 1), RangeError);
  assert.throws(() => wilsonInterval(3, 2), RangeError);
  assert.throws(() => analyseCounts(5, 4, 2), RangeError);
  assert.throws(() => analyseCounts(1, 10, 1), RangeError);
  assert.throws(() => analyseCounts(1, 10, 11), RangeError);
});

test('Wilson-Intervall trifft Referenzwerte und bleibt in [0,1]', () => {
  const cases = [
    [15, 20, 0.531299122381256, 0.8881382985923343],
    [5, 16, 0.14164643854782039, 0.5559564416525933],
    [8, 25, 0.17205190306907978, 0.5158973072689775],
    [9, 10, 0.5958499732047615, 0.9821237869049271],
  ];
  for (const [hits, n, low, high] of cases) {
    const interval = wilsonInterval(hits, n);
    assert.ok(Math.abs(interval.low - low) < 1e-12, `low(${hits},${n}) = ${interval.low}`);
    assert.ok(Math.abs(interval.high - high) < 1e-12, `high(${hits},${n}) = ${interval.high}`);
    assert.equal(interval.confidence, 0.95);
  }
  const none = wilsonInterval(0, 20);
  assert.equal(none.low, 0);
  assert.ok(none.high > 0 && none.high < 1);
  const all = wilsonInterval(20, 20);
  assert.equal(all.high, 1);
  assert.deepEqual(wilsonInterval(0, 0), { low: 0, high: 1, confidence: 0.95, method: 'wilson' });
});

test('analyseCounts rechnet Erwartung, Quote und Schwelle aus dem Protokoll', () => {
  const analysis = analyseCounts(15, 20, 2);
  assert.equal(analysis.baseProbability, 0.5);
  assert.equal(analysis.expected, 10);
  assert.equal(analysis.expectedRounded, 10);
  assert.equal(analysis.hitRate, 0.75);
  assert.equal(analysis.alpha, ALPHA);
  assert.equal(analysis.meetsAlpha, true);
  assert.equal(analysis.method, 'binomial-exact + wilson-95');

  const eight = analyseCounts(3, 16, 8);
  assert.equal(eight.baseProbability, 0.125);
  assert.equal(eight.expected, 2);
  assert.equal(eight.meetsAlpha, false);

  const empty = analyseCounts(0, 0, 2);
  assert.equal(empty.pValue, 1);
  assert.equal(empty.meetsAlpha, false);
});

test('Formatierung nutzt deutsche Schreibweise und vier p-Nachkommastellen', () => {
  assert.equal(formatPercent(0.5), '50,0 %');
  assert.equal(formatPercent(0.125, 1), '12,5 %');
  assert.equal(formatPercent(0.04138946533203125, 2), '4,14 %');
  assert.equal(formatNumber(10, 2), '10,00');
  assert.equal(formatPValue(0.04138946533203125), 'p = 0,0414');
  assert.equal(formatPValue(0.00001), 'p < 0,0001');
  assert.equal(formatPValue(1), 'p = 1,0000');
  assert.equal(formatInterval({ low: 0.531299122381256, high: 0.8881382985923343 }), '53,1 % bis 88,8 %');
  assert.equal(formatPValue(Number.NaN), '—');
});

test('Einordnung bleibt zurückhaltend und nennt Zwischenstand und Schwelle', () => {
  const complete = analyseRun({ protocol: { k: 2, n: 20, analysis: [], testType: 'jaNein' }, trials: [] });
  assert.equal(interpretation(complete).level, 'leer');
  assert.match(interpretation(complete).headline, /Noch keine auswertbaren Versuche/);

  const partial = analyseRun({
    protocol: { k: 2, n: 20, analysis: [], testType: 'jaNein' },
    trials: [{ index: 1, resultRevealed: { hit: true, targetIndex: 0 } }],
  });
  assert.equal(interpretation(partial).level, 'zwischenstand');
  assert.match(interpretation(partial).headline, /Versuch 1 von 20/);

  const notable = interpretation(analyseCounts(15, 20, 2));
  assert.equal(notable.level, 'auffaellig');
  assert.match(notable.headline, /^Über der Zufallserwartung/);
  assert.match(notable.text, /kein Nachweis/);
  assert.match(notable.text, /jedem 20\. Fall/);

  // Zweiseitig: 5 von 20 ist genauso auffällig, aber in die andere Richtung.
  const below = interpretation(analyseCounts(5, 20, 2));
  assert.equal(below.level, 'auffaellig');
  assert.match(below.headline, /^Unter der Zufallserwartung/);
  assert.match(below.text, /unter der Erwartung/);

  const compatible = interpretation(analyseCounts(10, 20, 2));
  assert.equal(compatible.level, 'vereinbar');
  assert.match(compatible.text, /kein Beweis/);
  assert.match(multipleTestingNote({ storedRuns: 3 }), /3 Läufe bekannt/);
  assert.match(multipleTestingNote({ storedRuns: 1 }), /einzelner Lauf/);
});

test('Beschriftungen decken alle Testarten und k Ziele ab', () => {
  assert.deepEqual(answerLabels('jaNein', 2), ['Ja', 'Nein']);
  assert.deepEqual(answerLabels('zahl', 5), ['1', '2', '3', '4', '5']);
  assert.equal(answerLabels('richtung', 8).length, 8);
  assert.equal(answerLabels('richtung', 8)[7], 'Ort 8');
  assert.equal(answerLabels('symbol', 3).length, 3);
  assert.equal(testTypeLabel('jaNein'), 'Ja/Nein');
  assert.equal(testTypeLabel('unbekannt'), 'Unbekannte Testart');
  assert.throws(() => answerLabels('jaNein', 0), RangeError);
});

test('Grenzen des Protokolls sind 2–10 Ziele und 10–200 Versuche', () => {
  assert.deepEqual(TRIAL_LIMITS, { minK: 2, maxK: 10, minN: 10, maxN: 200 });
  for (const entry of WERKSTATT.experimente) {
    assert.ok(entry.k >= TRIAL_LIMITS.minK && entry.k <= TRIAL_LIMITS.maxK, entry.id);
    assert.ok(entry.n >= TRIAL_LIMITS.minN && entry.n <= TRIAL_LIMITS.maxN, entry.id);
    assert.equal(entry.baseProbability, 1 / entry.k);
  }
});

// --- Lauf, Verblindung, Auswertung ---------------------------------------

test('vollständiger Lauf: Sperre vor Enthüllung, Auswertung stimmt mit den Versuchen', async () => {
  // Ohne hitPlan antwortet der Lauf jeweils mit dem gezogenen Ziel: 20 Treffer.
  const run = await completeRun('exp-ja-nein-20');
  assert.equal(validateRun(run).ok, true, JSON.stringify(validateRun(run).errors.slice(0, 2)));
  assert.equal(run.trials.length, 20);
  assert.equal(run.status, 'complete');
  const analysis = analyseRun(run);
  assert.equal(analysis.revealed, 20);
  assert.equal(analysis.hits, 20);
  assert.equal(analysis.complete, true);
  assert.equal(analysis.expected, 10);
  assert.equal(analysis.pValue, 1 / 524288);
  assert.equal(interpretation(analysis).level, 'auffaellig');
});

test('ohne enthülltes Ziel enthält der Lauf weder Zielindex noch Salt', async () => {
  const rng = mulberry32(99);
  const clock = fixedClock();
  let run = await createRun(experiment('exp-acht-orte-16'), { rng, now: clock });
  const started = await beginTrial(run, { rng, now: clock });
  run = started.run;
  const serialized = JSON.stringify(run);
  assert.equal(serialized.includes('salt'), false);
  assert.equal(serialized.includes('targetIndex'), false);
  assert.equal(serialized.includes('"secret"'), false);
  // Das Secret lebt nur im Rückgabewert von beginTrial.
  assert.equal(typeof started.secret.targetIndex, 'number');
  assert.equal(serialized.includes(started.secret.salt), false);
});

test('Sperre ist unveränderlich und die Reihenfolge ist Vertrag', async () => {
  const rng = mulberry32(1234);
  const clock = fixedClock();
  let run = await createRun(experiment('exp-zahl-1-5-25'), { rng, now: clock });
  const started = await beginTrial(run, { rng, now: clock });
  run = started.run;
  assert.throws(() => lockPrediction(run, 2, 0), /existiert nicht/);
  const locked = lockPrediction(run, 1, 3, { now: clock });
  assert.equal(Object.isFrozen(locked), true);
  assert.throws(() => lockPrediction(locked, 1, 4, { now: clock }), /bereits gesperrt/);
  assert.throws(() => lockPrediction(locked, 1, 9, { now: clock }), /bereits gesperrt/);
  const revealed = await revealResult(locked, 1, started.secret, { now: clock });
  assert.throws(() => lockPrediction(revealed.run, 1, 0, { now: clock }), /nach der Enthüllung/);
  const tampered = { ...started.secret, targetIndex: (started.secret.targetIndex + 1) % run.protocol.k };
  await assert.rejects(revealResult(locked, 1, tampered, { now: clock }), /Commitment/);
  await assert.rejects(revealResult(revealed.run, 1, started.secret, { now: clock }), /bereits enthüllt/);
  await assert.rejects(revealResult(run, 1, started.secret, { now: clock }), /ohne gesperrte Vorhersage/);
});

test('CSV-Export: BOM, Semikolon, CRLF, Quoting und nur enthüllte Ziele', async () => {
  const rng = mulberry32(555);
  const clock = fixedClock();
  const full = await completeRun('exp-ja-nein-20', { seed: 555 });
  const csv = runsToCsv([full]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.ok(csv.startsWith('\uFEFFLauf;Experiment;Modus;Basiswahrscheinlichkeit;'));
  assert.ok(csv.includes('\r\n'));
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 21);
  assert.ok(lines[1].includes('exp-ja-nein-20'));
  assert.ok(lines[1].includes(';test;'));
  assert.ok(lines[1].includes('0,5'));
  assert.ok(lines[1].includes(';ja;') || lines[1].includes(';nein;'));

  // Ein Lauf mit gesperrter, aber nicht enthüllter Antwort: Ziel bleibt leer.
  let partial = await createRun(experiment('exp-ja-nein-20'), { rng, now: clock });
  const started = await beginTrial(partial, { rng, now: clock });
  partial = lockPrediction(started.run, 1, 0, { now: clock });
  const partialCsv = runsToCsv([partial]);
  const row = partialCsv.trim().split('\r\n')[1];
  const cells = row.split(';');
  assert.equal(cells[7], '');
  assert.equal(cells[8], '');
  assert.equal(cells[9], '');
  assert.equal(trialRows(partial)[0].targetIndex, null);

  assert.throws(() => runsToCsv('nein'), TypeError);
  assert.equal(
    exportFileName('experiment', 'json', new Date('2026-11-03T12:00:00Z')),
    'radiasthesie-experiment-2026-11-03.json'
  );
});

test('JSON-Export ist vertragskonform und wieder importierbar', async () => {
  const run = await completeRun('exp-acht-orte-16', { seed: 2026 });
  const exported = serializeEnvelope('experiment', [run], { now: () => new Date('2026-11-03T12:00:00Z') });
  assert.equal(exported.ok, true, JSON.stringify(exported.errors));
  assert.equal(exported.text.includes('salt'), false);
  const parsed = JSON.parse(exported.text);
  assert.equal(parsed.schema, 1);
  assert.equal(parsed.app, 'esoterik-welt');
  assert.equal(parsed.kind, 'experiment');
  assert.equal(parsed.data.length, 1);
  const imported = importEnvelope(exported.text, { kind: 'experiment' });
  assert.equal(imported.ok, true, JSON.stringify(imported.errors));
  assert.equal(imported.value.data[0].runId, run.runId);

  const broken = clone(run);
  broken.trials[0].resultRevealed.hit = !broken.trials[0].resultRevealed.hit;
  const rejected = serializeEnvelope('experiment', [broken]);
  assert.equal(rejected.ok, false);
  assert.ok(rejected.errors.length > 0);
});

// --- Speicher -------------------------------------------------------------

test('Speicher: leerer Stand, Rundlauf und belegte Antworten', async () => {
  const storage = fakeStorage();
  assert.equal(readRuns(storage).state, 'empty');
  const run = await completeRun('exp-ja-nein-20', { seed: 7 });
  const written = writeRuns(storage, [run], { now: () => new Date('2026-11-03T12:00:00Z') });
  assert.equal(written.ok, true);
  const raw = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(raw.schema, 1);
  assert.equal(raw.savedAt, '2026-11-03T12:00:00.000Z');
  assert.equal(raw.data.length, 1);
  assert.equal(countAnswers(raw.data), 20);
  const state = readRuns(storage);
  assert.equal(state.state, 'ok');
  assert.equal(state.runs[0].runId, run.runId);
  assert.equal(MAX_ANSWERS, 2000);
  assert.equal(countAnswers([]), 0);
  assert.equal(upsertRun([run], run).length, 1);
  assert.equal(removeRun([run], run.runId).length, 0);
});

test('Speicher: defekter Umschlag wird gesichert und geleert', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{kaputt' });
  const result = readRuns(storage, { now: () => new Date('2026-11-03T12:00:00Z') });
  assert.equal(result.state, 'corrupt');
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(result.backupKey, 'esot_rad_corrupt_esot_rad_experiment_v1_20261103120000000');
  assert.match(storage.getItem(result.backupKey), /kaputt/);
  assert.match(result.message, /gesichert/);

  const wrong = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schema: 1, data: 'keine Liste' }) });
  assert.equal(readRuns(wrong).state, 'corrupt');

  const noEnvelope = fakeStorage({ [STORAGE_KEY]: JSON.stringify([1, 2, 3]) });
  assert.equal(readRuns(noEnvelope).state, 'corrupt');
});

test('Speicher: neueres Schema wird nicht überschrieben', () => {
  const payload = JSON.stringify({ schema: 2, savedAt: '2026-11-03T12:00:00.000Z', data: [] });
  const storage = fakeStorage({ [STORAGE_KEY]: payload });
  const result = readRuns(storage);
  assert.equal(result.state, 'future');
  assert.equal(storage.getItem(STORAGE_KEY), payload);
  assert.match(result.message, /nicht überschrieben/);
});

test('Speicher: Quota und fehlender Speicher liefern eine Meldung statt Throw', () => {
  const full = {
    getItem: () => null,
    setItem: () => {
      const error = new Error('voll');
      error.name = 'QuotaExceededError';
      throw error;
    },
    removeItem: () => {},
  };
  const written = writeRuns(full, []);
  assert.equal(written.ok, false);
  assert.match(written.message, /Speicher ist voll/);
  assert.equal(writeRuns(null, []).ok, false);
  assert.equal(readRuns(null).state, 'unavailable');
  assert.match(readRuns(null).message, /nur für diese Sitzung/);
  assert.equal(getLocalStorage({}), null);
});

test('gesperrte Antwort ist nach dem Schreiben nachweisbar gespeichert', async () => {
  const storage = fakeStorage();
  const rng = mulberry32(4242);
  const clock = fixedClock();
  let run = await createRun(experiment('exp-ja-nein-20'), { rng, now: clock });
  const started = await beginTrial(run, { rng, now: clock });
  run = lockPrediction(started.run, 1, 1, { now: clock });
  assert.equal(writeRuns(storage, [run]).ok, true);
  assert.equal(verifyStored(storage, run.runId, 1).ok, true);
  assert.equal(verifyStored(storage, run.runId, 2).ok, false);
  writeRuns(storage, [{ ...run, trials: [] }]);
  assert.equal(verifyStored(storage, run.runId, 1).ok, false);
  assert.match(verifyStored(storage, run.runId, 1).message, /nicht gespeichert/);
});

// --- Zufall ---------------------------------------------------------------

test('Zufallsquelle nutzt Web Crypto und wirft ohne Crypto', () => {
  const values = [0, 2147483648, 4294967295];
  let index = 0;
  const fakeCrypto = {
    getRandomValues(buffer) {
      buffer[0] = values[index % values.length];
      index += 1;
      return buffer;
    },
  };
  assert.equal(cryptoAvailable(fakeCrypto), true);
  const rng = createCryptoRng(fakeCrypto);
  assert.equal(rng(), 0);
  assert.equal(rng(), 0.5);
  assert.ok(rng() > 0.999);
  assert.throws(() => createCryptoRng(null), /Web Crypto/);
  assert.equal(cryptoAvailable(null), false);
  assert.match(randomToken(fakeCrypto, 4), /^[0-9a-f]{8}$/);
});

test('drawIndex verwerfe unbrauchbare Rohwerte (Rejection Sampling)', () => {
  const limit = Math.floor(0x100000000 / 3) * 3;
  const sequence = [limit / 0x100000000, 0.5, 0.25];
  const calls = [];
  const rng = () => {
    const value = sequence[calls.length];
    calls.push(value);
    return value;
  };
  const result = drawIndex(3, rng);
  assert.equal(result, Math.floor(0.5 * 0x100000000) % 3);
  assert.equal(calls.length, 2);
  assert.throws(() => drawIndex(2, () => 1), /\[0,1\)/);
  assert.throws(() => drawIndex(2, () => -0.1), /\[0,1\)/);
  assert.throws(() => drawIndex(0, () => 0.5), RangeError);
});

test('Produktionsmodule enthalten keinen Math.random-Fallback', () => {
  for (const file of [
    'js/modules/experiment-statistik.js',
    'js/modules/experiment-zufall.js',
    'js/modules/experiment-speicher.js',
    'js/modules/experiment-labor.js',
  ]) {
    const source = read(file);
    assert.equal(/Math\.random\s*\(/.test(source), false, `${file} darf Math.random() nicht aufrufen`);
  }
});

// --- Route, Ansicht, Werkstatt -------------------------------------------

test('Route #pendeln/experiment löst die Ansicht aus', () => {
  assert.equal(ROUTE.experiment, '#pendeln/experiment');
  const route = model.resolve(['experiment']);
  assert.equal(route.view, 'experiment');
  const view = renderExperiment();
  assert.equal(view.experiment, true);
  assert.equal(view.h1, 'Experimentierlabor');
  assert.match(view.html, /id="experimentLabor"/);
  assert.match(view.html, /Vorregistriertes Protokoll/);
  assert.match(view.html, /exakter zweiseitiger Binomialtest/i);
  assert.match(view.html, /Wilson/);
  assert.match(view.html, /Mehrfachtests/);
  assert.match(view.html, /Entwicklerwerkzeuge/);
  assert.equal(view.html.includes('targetIndex'), false);
  assert.equal(view.html.includes('salt'), false);
  for (const entry of WERKSTATT.experimente) {
    assert.ok(view.html.includes(entry.id), `Protokoll für ${entry.id} fehlt`);
  }
});

test('Werkstatt-Karte „Experimentierlabor“ ist verfügbar und verlinkt', () => {
  const landing = renderLanding(model);
  assert.ok(landing.html.includes('Experimentierlabor'));
  const workshop = model.data.landing.workshop;
  assert.equal(workshop.length, 4);
  const entry = workshop.find((item) => item.title === 'Experimentierlabor');
  assert.equal(entry.state, 'Verfügbar');
  assert.equal(entry.href, '#pendeln/experiment');
});
