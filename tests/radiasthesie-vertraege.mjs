// Radiästhesie — Vertragstests für Taxonomie, Experimentläufe, Journal und
// JSON-Import/Export. Reine Node-Tests ohne Browser und ohne Netzwerk.
//
// Geprüft wird die Kette: redaktionelle Taxonomie → generierte Daten
// (js/data/radiasthesie.js) → Werkstatt-Fassade → Lauf-/Journal-Lebenszyklus.
// Die Statistik selbst (Binomialtest, Wilson-Intervall) ist RAD-09 und wird
// hier nur als Protokollanforderung geprüft.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (relative) => import(pathToFileURL(path.join(root, relative)).href);

const contracts = await load('js/modules/radiasthesie-vertraege.js');
const dataModule = await load('js/data/radiasthesie.js');
const werkstattModule = await load('js/data/radiasthesie-werkstatt.js');

const { RADIASTHESIE } = dataModule;
const { WERKSTATT } = werkstattModule;
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

function experiment(id, overrides = {}) {
  const base = RADIASTHESIE.taxonomie.experimente.find((entry) => entry.id === id);
  assert.ok(base, `Experiment ${id} fehlt`);
  return { ...clone(base), ...overrides };
}

async function completeRun(run, rng, clock, hitPlan = null) {
  let current = run;
  for (let index = 1; index <= run.protocol.n; index += 1) {
    const started = await contracts.beginTrial(current, { rng, now: clock });
    current = started.run;
    const answer = hitPlan ? hitPlan[index - 1] : started.secret.targetIndex;
    current = contracts.lockPrediction(current, index, answer, { now: clock });
    current = (await contracts.revealResult(current, index, started.secret, { now: clock })).run;
  }
  return current;
}

// --- Katalog --------------------------------------------------------------

test('Taxonomie und Gesamtdatensatz sind vertragskonform', () => {
  const result = contracts.validateDataset(RADIASTHESIE);
  assert.equal(result.ok, true, JSON.stringify(result.errors.slice(0, 3), null, 2));
  assert.equal(RADIASTHESIE.schemaVersion, contracts.CONTRACT_VERSION);
  assert.equal(RADIASTHESIE.taxonomie.$schema_version, contracts.CONTRACT_VERSION);
  assert.deepEqual(result.counts, {
    instrumente: 7,
    methoden: 6,
    ereignisse: 12,
    erklaerungsmodelle: 6,
    studien: 7,
    medien: 10,
    experimente: 3,
  });
});

test('bestehendes Artikel- und Quellenmodell bleibt unverändert nutzbar', () => {
  assert.deepEqual(Object.keys(RADIASTHESIE.topics).sort(), ['orakel', 'pendeln', 'radiasthesie']);
  assert.equal(
    Object.values(RADIASTHESIE.topics).reduce((sum, topic) => sum + topic.sections.length, 0),
    31
  );
  assert.equal(RADIASTHESIE.sources.length, 66);
  assert.equal(
    RADIASTHESIE.glossary.reduce((sum, group) => sum + group.terms.length, 0),
    17
  );
  assert.deepEqual(
    RADIASTHESIE.levels.map((level) => level.key),
    ['A', 'B', 'C', 'D', 'E']
  );
});

test('jede Entität verweist nur auf vorhandene Quellen, Themen und Medien', () => {
  const sourceIds = new Set(RADIASTHESIE.sources.map((source) => source.id));
  const mediaIds = new Set(RADIASTHESIE.taxonomie.medien.map((medium) => medium.id));
  const topicIds = Object.keys(RADIASTHESIE.topics);
  for (const key of Object.keys(contracts.COLLECTIONS)) {
    for (const entity of RADIASTHESIE.taxonomie[key]) {
      for (const reference of entity.references) {
        assert.ok(sourceIds.has(reference), `${key}/${entity.id}: Quelle ${reference} fehlt`);
      }
      for (const image of entity.images) {
        assert.ok(mediaIds.has(image), `${key}/${entity.id}: Medium ${image} fehlt`);
      }
      for (const topic of entity.relatedTopics) {
        assert.ok(topicIds.includes(topic), `${key}/${entity.id}: Thema ${topic} fehlt`);
      }
    }
  }
});

test('verfügbare Medien zeigen auf existierende Dateien, geplante nicht', () => {
  for (const medium of RADIASTHESIE.taxonomie.medien) {
    if (medium.status === 'available') {
      assert.ok(fs.existsSync(path.join(root, medium.file)), `${medium.id}: Datei fehlt (${medium.file})`);
      assert.match(medium.file, /^assets\/radiasthesie\/[a-z0-9-]+\.svg$/);
    } else {
      assert.equal(medium.file, '', `${medium.id}: geplantes Medium darf keinen Pfad haben`);
      assert.equal(medium.reviewStatus, 'draft');
    }
  }
});

test('Werkstatt-Fassade liefert eingefrorene, aufgelöste Konfiguration', () => {
  assert.equal(Object.isFrozen(WERKSTATT), true);
  assert.equal(WERKSTATT.contractVersion, contracts.CONTRACT_VERSION);
  assert.equal(WERKSTATT.storageSchema, contracts.STORAGE_SCHEMA);
  assert.equal(WERKSTATT.experimentById('exp-ja-nein-20').k, 2);
  assert.equal(WERKSTATT.experimentById('gibtsnicht'), null);
  assert.equal(WERKSTATT.instrumentById('winkelrute').instrumentType, 'winkelrute');
  assert.equal(WERKSTATT.mediumById('rad-pendeltafel').status, 'available');
  assert.equal(WERKSTATT.availableMedia.length, 4);
  assert.equal(WERKSTATT.journalMethods.length, 6);
});

// --- Negativfälle der Katalogvalidierung --------------------------------

function datasetWith(mutate) {
  const copy = clone(RADIASTHESIE);
  mutate(copy.taxonomie);
  return contracts.validateDataset(copy);
}

test('unbekannte Quelle, doppelte id und doppelter slug werden abgelehnt', () => {
  const unknownSource = datasetWith((taxonomie) => {
    taxonomie.instrumente[0].references.push('Q99');
  });
  assert.equal(unknownSource.ok, false);
  assert.ok(unknownSource.errors.some((error) => error.rule === 'reference' && error.path.includes('references')));

  const doubleId = datasetWith((taxonomie) => {
    taxonomie.methoden[1].id = taxonomie.methoden[0].id;
    taxonomie.methoden[1].slug = taxonomie.methoden[0].slug;
  });
  assert.equal(doubleId.ok, false);
  assert.ok(doubleId.errors.some((error) => error.rule === 'duplicate'));

  const doubleSlug = datasetWith((taxonomie) => {
    taxonomie.medien[1].slug = taxonomie.medien[0].slug;
  });
  assert.equal(doubleSlug.ok, false);
  assert.ok(doubleSlug.errors.some((error) => error.rule === 'duplicate' && error.path.includes('slug')));
});

test('ungültige Felder, Daten und Zustände werden abgelehnt', () => {
  const badDate = datasetWith((taxonomie) => {
    taxonomie.instrumente[0].lastReviewed = '2026-02-30';
  });
  assert.equal(badDate.ok, false);
  assert.ok(badDate.errors.some((error) => error.rule === 'date'));

  const badEvidence = datasetWith((taxonomie) => {
    taxonomie.studien[0].evidenceStatus = 'F';
  });
  assert.equal(badEvidence.ok, false);
  assert.ok(badEvidence.errors.some((error) => error.rule === 'enum' && error.path.includes('evidenceStatus')));

  const plannedWithFile = datasetWith((taxonomie) => {
    taxonomie.medien[4].file = 'assets/radiasthesie/fake.svg';
  });
  assert.equal(plannedWithFile.ok, false);
  assert.ok(plannedWithFile.errors.some((error) => error.rule === 'state'));

  const availableWithoutFile = datasetWith((taxonomie) => {
    taxonomie.medien[0].file = '';
  });
  assert.equal(availableWithoutFile.ok, false);
  assert.ok(availableWithoutFile.errors.some((error) => error.rule === 'format' && error.path.includes('.file')));

  const badTopic = datasetWith((taxonomie) => {
    taxonomie.instrumente[0].relatedTopics = ['geomantie'];
  });
  assert.equal(badTopic.ok, false);
  assert.ok(badTopic.errors.some((error) => error.path.includes('relatedTopics')));
});

test('falscher Vertragsstand wird abgelehnt', () => {
  const copy = clone(RADIASTHESIE);
  copy.schemaVersion = '2.0';
  copy.taxonomie.$schema_version = '2.0';
  const result = contracts.validateDataset(copy);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.rule === 'version' && error.path === 'data.schemaVersion'));
  assert.ok(result.errors.some((error) => error.rule === 'version' && error.path.includes('$schema_version')));
});

// --- Experimentprotokolle ------------------------------------------------

test('alle Katalogprotokolle haben feste Fallzahl, Abbruchregel und Basiswahrscheinlichkeit 1/k', () => {
  for (const entry of RADIASTHESIE.taxonomie.experimente) {
    const protocol = contracts.validateProtocol(entry);
    assert.equal(protocol.ok, true, `${entry.id}: ${JSON.stringify(protocol.errors)}`);
    assert.equal(entry.stopRule, 'fixed-n');
    assert.equal(entry.baseProbability, 1 / entry.k);
    assert.ok(entry.analysis.includes('binomial-exact'));
    assert.ok(entry.n >= 10 && entry.n <= 200);
  }
});

test('unvollständige oder widersprüchliche Protokolle werden abgelehnt', () => {
  const tooFew = contracts.validateProtocol({
    testType: 'jaNein',
    k: 2,
    n: 5,
    stopRule: 'fixed-n',
    analysis: ['binomial-exact'],
    baseProbability: 0.5,
  });
  assert.equal(tooFew.ok, false);
  assert.ok(tooFew.errors.some((error) => error.path.endsWith('.n')));

  const badStopRule = contracts.validateProtocol({
    testType: 'jaNein',
    k: 2,
    n: 20,
    stopRule: 'bis-erreicht',
    analysis: ['binomial-exact'],
    baseProbability: 0.5,
  });
  assert.equal(badStopRule.ok, false);
  assert.ok(badStopRule.errors.some((error) => error.path.endsWith('.stopRule')));

  const badAnalysis = contracts.validateProtocol({
    testType: 'jaNein',
    k: 2,
    n: 20,
    stopRule: 'fixed-n',
    analysis: ['t-test'],
    baseProbability: 0.5,
  });
  assert.equal(badAnalysis.ok, false);
  assert.ok(badAnalysis.errors.some((error) => error.path.includes('analysis')));

  const wrongProbability = contracts.validateProtocol({
    testType: 'jaNein',
    k: 2,
    n: 20,
    stopRule: 'fixed-n',
    analysis: ['binomial-exact'],
    baseProbability: 0.4,
  });
  assert.equal(wrongProbability.ok, false);
  assert.ok(wrongProbability.errors.some((error) => error.rule === 'consistency'));
});

// --- Lauf-Lebenszyklus ---------------------------------------------------

test('Lauf: Commitment ohne Ziel, Sperre vor Enthüllung, Treffer wird berechnet', async () => {
  const rng = mulberry32(42);
  const clock = fixedClock();
  const run = await contracts.createRun(experiment('exp-ja-nein-20'), { rng, now: clock, runId: 'run-test-0001' });
  assert.equal(run.status, 'running');
  assert.equal(run.trials.length, 0);
  assert.equal(run.protocol.baseProbability, 0.5);

  const started = await contracts.beginTrial(run, { rng, now: clock });
  assert.equal(started.run.trials.length, 1);
  assert.match(started.run.trials[0].targetCommitment.digest, /^[0-9a-f]{64}$/);
  assert.equal(started.run.trials[0].predictionLocked, null);
  assert.equal(started.run.trials[0].resultRevealed, null);
  assert.equal(Object.isFrozen(started.run), true);

  // Vor der Sperre darf kein Ziel im serialisierten Lauf stehen.
  assert.equal(JSON.stringify(started.run).includes('"targetIndex"'), false);
  assert.equal(JSON.stringify(contracts.publicSnapshot(started.run)).includes('"targetIndex"'), false);

  const answered = contracts.lockPrediction(started.run, 1, started.secret.targetIndex, { now: clock });
  assert.equal(answered.trials[0].predictionLocked.locked, true);
  assert.equal(answered.trials[0].predictionLocked.answerIndex, started.secret.targetIndex);
  assert.throws(() => contracts.lockPrediction(answered, 1, 0, { now: clock }), /bereits gesperrt/);

  const revealed = await contracts.revealResult(answered, 1, started.secret, { now: clock });
  assert.equal(revealed.hit, true);
  assert.equal(revealed.run.trials[0].resultRevealed.hit, true);
  assert.equal(revealed.run.trials[0].resultRevealed.targetIndex, started.secret.targetIndex);
  assert.equal(contracts.validateRun(revealed.run).ok, true);
  await assert.rejects(contracts.revealResult(revealed.run, 1, started.secret, { now: clock }), /bereits enthüllt/);
});

test('Enthüllung ohne Sperre und mit manipuliertem Secret ist nicht zulässig', async () => {
  const rng = mulberry32(7);
  const clock = fixedClock();
  const run = await contracts.createRun(experiment('exp-acht-orte-16'), { rng, now: clock, runId: 'run-test-0002' });
  const started = await contracts.beginTrial(run, { rng, now: clock });
  await assert.rejects(
    contracts.revealResult(started.run, 1, started.secret, { now: clock }),
    /ohne gesperrte Vorhersage/
  );

  const answered = contracts.lockPrediction(started.run, 1, 0, { now: clock });
  const forged = { ...started.secret, targetIndex: (started.secret.targetIndex + 1) % 8 };
  await assert.rejects(contracts.revealResult(answered, 1, forged, { now: clock }), /Commitment-Prüfung/);
});

test('manipulierte gespeicherte Läufe werden erkannt', async () => {
  const rng = mulberry32(11);
  const clock = fixedClock();
  const run = await contracts.createRun(experiment('exp-ja-nein-20'), { rng, now: clock, runId: 'run-test-0003' });
  let current = run;
  for (let index = 1; index <= 2; index += 1) {
    const started = await contracts.beginTrial(current, { rng, now: clock });
    current = contracts.lockPrediction(started.run, index, 0, { now: clock });
    current = (await contracts.revealResult(current, index, started.secret, { now: clock })).run;
  }
  assert.equal(contracts.validateRun(current).ok, true);

  const tamperedHit = clone(current);
  tamperedHit.trials[0].resultRevealed.hit = !tamperedHit.trials[0].resultRevealed.hit;
  const hitCheck = contracts.validateRun(tamperedHit);
  assert.equal(hitCheck.ok, false);
  assert.ok(hitCheck.errors.some((error) => error.rule === 'consistency'));

  const leakedTarget = clone(current);
  leakedTarget.trials[1].targetIndex = 1;
  const leakCheck = contracts.validateRun(leakedTarget);
  assert.equal(leakCheck.ok, false);
  assert.ok(leakCheck.errors.some((error) => error.rule === 'forbidden'));

  const reversed = clone(current);
  reversed.trials[0].predictionLocked.lockedAt = '2026-11-03T09:00:00.000Z';
  const orderCheck = contracts.validateRun(reversed);
  assert.equal(orderCheck.ok, false);
  assert.ok(orderCheck.errors.some((error) => error.rule === 'sequence'));
});

test('vollständiger Lauf endet mit Status complete und auswertbarer Zusammenfassung', async () => {
  const rng = mulberry32(2026);
  const clock = fixedClock();
  const protocol = { ...experiment('exp-ja-nein-20'), n: 10 };
  const run = await contracts.createRun(protocol, { rng, now: clock, runId: 'run-test-0004', batchId: 'test-1' });
  const complete = await completeRun(run, rng, clock, Array(10).fill(0));
  assert.equal(complete.trials.length, 10);
  assert.equal(complete.status, 'complete');
  assert.equal(contracts.validateRun(complete).ok, true);
  const summary = contracts.runSummary(complete);
  assert.equal(summary.planned, 10);
  assert.equal(summary.revealed, 10);
  assert.equal(summary.evaluable, true);
  assert.equal(summary.stopRule, 'fixed-n');
  assert.equal(summary.testType, 'jaNein');
  assert.ok(summary.hits >= 0 && summary.hits <= 10);
  assert.equal(summary.expectedHits, 5);

  const serialized = JSON.stringify(complete);
  assert.equal(serialized.includes('"salt"'), false, 'Salt darf nicht im Lauf gespeichert werden');
});

// --- Journal --------------------------------------------------------------

test('Tagebucheintrag: Pflichtfelder, Grenzen, Steuerzeichen und Datum', () => {
  const clock = fixedClock();
  const rng = mulberry32(99);
  const ok = contracts.createEntry(
    { question: 'Trifft die Antwort das Ziel?', prediction: 'Ja', method: 'pendeln', confidence: 3 },
    { now: clock, rng, methodIds: WERKSTATT.journalMethods }
  );
  assert.equal(ok.ok, true, JSON.stringify(ok.errors));
  assert.match(ok.entry.id, /^jr-/);
  assert.equal(ok.entry.date, '2026-11-03');
  assert.equal(Object.isFrozen(ok.entry), true);

  const missing = contracts.createEntry({ prediction: 'Ja' }, { now: clock, rng });
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.some((error) => error.path === 'question'));

  const tooLong = contracts.createEntry({ question: 'x'.repeat(201), prediction: 'Ja' }, { now: clock, rng });
  assert.equal(tooLong.ok, false);
  assert.ok(tooLong.errors.some((error) => error.rule === 'maxLength'));

  const control = contracts.createEntry({ question: 'Frage\u0007', prediction: 'Ja' }, { now: clock, rng });
  assert.equal(control.ok, false);
  assert.ok(control.errors.some((error) => error.rule === 'controlChars'));

  const badDate = contracts.createEntry(
    { date: '2026-02-31', question: 'Frage', prediction: 'Ja' },
    { now: clock, rng }
  );
  assert.equal(badDate.ok, false);
  assert.ok(badDate.errors.some((error) => error.rule === 'date'));

  for (const confidence of [0, 6, 2.5]) {
    const invalid = contracts.createEntry({ question: 'Frage', prediction: 'Ja', confidence }, { now: clock, rng });
    assert.equal(invalid.ok, false, `confidence ${confidence} muss abgelehnt werden`);
  }

  const unknownMethod = contracts.createEntry(
    { question: 'Frage', prediction: 'Ja', method: 'gibtsnicht' },
    { now: clock, rng, methodIds: WERKSTATT.journalMethods }
  );
  assert.equal(unknownMethod.ok, false);
  assert.ok(unknownMethod.errors.some((error) => error.path === 'method'));
});

test('Journalbezug zum Lauf ist referenziell geprüft', async () => {
  const rng = mulberry32(5);
  const clock = fixedClock();
  const protocol = { ...experiment('exp-ja-nein-20'), n: 10 };
  const run = await contracts.createRun(protocol, { rng, now: clock, runId: 'run-test-0005' });

  const tooEarly = contracts.entryFromRun(run, { question: 'Frage' }, { now: clock, rng });
  assert.equal(tooEarly.ok, false);
  assert.ok(tooEarly.errors.some((error) => error.rule === 'state'));

  const complete = await completeRun(run, rng, clock, Array(10).fill(1));
  const entry = contracts.entryFromRun(
    complete,
    { question: 'Trifft die Antwort das Ziel?', method: 'pendeln' },
    {
      now: clock,
      rng,
      methodIds: WERKSTATT.journalMethods,
    }
  );
  assert.equal(entry.ok, true, JSON.stringify(entry.errors));
  assert.equal(entry.entry.experimentId, 'exp-ja-nein-20');
  assert.equal(entry.entry.runId, 'run-test-0005');
  assert.match(entry.entry.prediction, /Vorregistriert: exp-ja-nein-20, n=10, k=2, p=0.5/);
  assert.match(entry.entry.result, /\d+\/10 Treffer/);
  assert.equal(
    contracts.validateJournalEntry(entry.entry, { methodIds: WERKSTATT.journalMethods, runs: [complete] }).ok,
    true
  );

  const wrongRun = { ...entry.entry, runId: 'run-gibtsnicht' };
  const mismatch = contracts.validateJournalEntry(wrongRun, { runs: [complete] });
  assert.equal(mismatch.ok, false);
  assert.ok(mismatch.errors.some((error) => error.rule === 'reference'));
});

// --- Import / Export ------------------------------------------------------

test('Journal-Export und -Import sind verlustfrei und schemafest', () => {
  const clock = fixedClock();
  const rng = mulberry32(1234);
  const first = contracts.createEntry({ question: 'Erste Frage', prediction: 'Ja' }, { now: clock, rng });
  const second = contracts.createEntry({ question: 'Zweite Frage', prediction: 'Nein' }, { now: clock, rng });
  assert.equal(first.ok && second.ok, true);

  const exported = contracts.serializeEnvelope('journal', [first.entry, second.entry], { now: clock });
  assert.equal(exported.ok, true, JSON.stringify(exported.errors));
  const parsed = JSON.parse(exported.text);
  assert.equal(parsed.schema, contracts.STORAGE_SCHEMA);
  assert.equal(parsed.app, 'esoterik-welt');
  assert.equal(parsed.kind, 'journal');

  const imported = contracts.importEnvelope(exported.text, { kind: 'journal' });
  assert.equal(imported.ok, true, JSON.stringify(imported.errors));
  assert.deepEqual(imported.value.data, [first.entry, second.entry]);
});

test('Import lehnt falsches Schema, falsche App, falsche Art und ungültige Einträge atomar ab', () => {
  const rng = mulberry32(77);
  const clock = fixedClock();
  const entry = contracts.createEntry({ question: 'Frage', prediction: 'Ja' }, { now: clock, rng }).entry;
  const envelope = contracts.exportEnvelope('journal', [entry], { now: clock }).envelope;

  const wrongSchema = JSON.stringify({ ...envelope, schema: 2 });
  const schemaResult = contracts.importEnvelope(wrongSchema);
  assert.equal(schemaResult.ok, false);
  assert.equal(schemaResult.value, null);
  assert.ok(schemaResult.errors.some((error) => error.rule === 'version'));

  const wrongApp = JSON.stringify({ ...envelope, app: 'fremd' });
  const appResult = contracts.importEnvelope(wrongApp);
  assert.equal(appResult.ok, false);
  assert.equal(appResult.value, null);
  assert.ok(appResult.errors.some((error) => error.path === 'app'));

  const wrongKind = JSON.stringify({ ...envelope, kind: 'experiment' });
  assert.equal(contracts.importEnvelope(wrongKind, { kind: 'journal' }).ok, false);

  const invalidJson = contracts.importEnvelope('{"schema":1,');
  assert.equal(invalidJson.ok, false);
  assert.equal(invalidJson.value, null);
  assert.ok(invalidJson.errors.some((error) => error.rule === 'json'));

  const oneBad = JSON.stringify({ ...envelope, data: [entry, { id: 'jr-bad', date: '2026-01-01' }] });
  const atomic = contracts.importEnvelope(oneBad);
  assert.equal(atomic.ok, false);
  assert.equal(atomic.value, null, 'bei Teilfehlern darf nichts übernommen werden');
  assert.ok(atomic.errors.some((error) => error.path.startsWith('data[1].')));

  const tooLarge = contracts.importEnvelope('x'.repeat(contracts.MAX_IMPORT_BYTES + 1));
  assert.equal(tooLarge.ok, false);
  assert.ok(tooLarge.errors.some((error) => error.rule === 'maxBytes'));
});

test('Export verweigert ungültige Daten statt sie zu schreiben', () => {
  const clock = fixedClock();
  const rng = mulberry32(3);
  const entry = contracts.createEntry({ question: 'Frage', prediction: 'Ja' }, { now: clock, rng }).entry;
  const broken = { ...entry, date: '2026-13-01' };
  const result = contracts.serializeEnvelope('journal', [broken], { now: clock });
  assert.equal(result.ok, false);
  assert.equal(result.text, '');
  assert.ok(result.errors.some((error) => error.rule === 'date'));

  assert.equal(contracts.exportEnvelope('unbekannt', [], { now: clock }).ok, false);
  assert.equal(contracts.exportEnvelope('tafel', [], { now: clock }).ok, false);
});
