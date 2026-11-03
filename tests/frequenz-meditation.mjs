// Vertragstests der Meditationssitzung (P10, ADR-Nachtrag §13).
//
// Geprüft werden Preset-Allowlist, Validierung, Countdown-Arithmetik,
// Fade-Hüllkurve und der versionierte lokale Speicher – ohne Browser. Der
// Speicher wird mit einem Fake-Storage geprüft, auch im blockierten Fall.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Allowlist des ADR §8.2 – bewusst als Literal, damit der Test nicht gegen
// dieselbe Quelle prüft, die er absichern soll.
const ALLOWLIST_HZ = [174, 285, 396, 417, 528, 639, 741, 852, 963, 432, 440];

let tmp;
let model;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frequenz-meditation-'));
  fs.mkdirSync(path.join(tmp, 'js/modules'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }));
  const source = path.join(root, 'js/modules/frequenz-meditation-model.js');
  fs.copyFileSync(source, path.join(tmp, 'js/modules/frequenz-meditation-model.js'));
  model = await import(pathToFileURL(path.join(tmp, 'js/modules/frequenz-meditation-model.js')).href);
});

after(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

class FakeStorage {
  constructor() {
    this.map = new Map();
    this.writes = 0;
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.writes += 1;
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

const blockedStorage = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
  removeItem() {
    throw new Error('blocked');
  },
};

const SESSION = Object.freeze({
  durationSeconds: 600,
  presetId: 'tone-432',
  fadeInSeconds: 5,
  fadeOutSeconds: 5,
});

test('M1: Presets sind auf die Allowlist des ADR beschränkt', () => {
  assert.ok(model.SESSION_PRESETS.length >= 15);
  const tones = model.SESSION_PRESETS.filter((preset) => preset.mode === 'tone');
  const binaural = model.SESSION_PRESETS.filter((preset) => preset.mode === 'binaural');
  assert.equal(tones.length, ALLOWLIST_HZ.length);
  for (const preset of tones) assert.ok(ALLOWLIST_HZ.includes(preset.hz), `${preset.id} ist nicht erlaubt`);
  assert.equal(binaural.length, 4);
  for (const preset of binaural) {
    assert.ok(preset.deltaHz >= 0.1 && preset.deltaHz <= 100);
    assert.ok(preset.carrierHz + preset.deltaHz <= 20000);
    assert.equal(model.presetNeedsHeadphones(preset), true);
  }
  assert.equal(model.presetNeedsHeadphones(model.findPreset('tone-432')), false);
});

test('M2: ungültige Sitzungen werden mit deutschem Text abgelehnt', () => {
  assert.deepEqual({ ...model.validateSession(SESSION) }, SESSION);
  assert.throws(() => model.validateSession({ ...SESSION, durationSeconds: 30 }), /zwischen 1 und 45 Minuten/);
  assert.throws(() => model.validateSession({ ...SESSION, durationSeconds: 46 * 60 }), /zwischen 1 und 45 Minuten/);
  assert.throws(() => model.validateSession({ ...SESSION, durationSeconds: 601.5 }), /zwischen 1 und 45 Minuten/);
  assert.throws(() => model.validateSession({ ...SESSION, presetId: 'tone-1000' }), /preset ist nicht verfügbar/i);
  assert.throws(() => model.validateSession({ ...SESSION, fadeInSeconds: 3 }), /0, 2, 5 oder 10 Sekunden/);
  assert.throws(() => model.validateSession({ ...SESSION, fadeOutSeconds: -1 }), /0, 2, 5 oder 10 Sekunden/);
});

test('M3: Uhr und Restzeit rechnen ohne Drift über die Grenzen', () => {
  assert.equal(model.formatClock(600), '10:00');
  assert.equal(model.formatClock(0), '00:00');
  assert.equal(model.formatClock(59.6), '01:00');
  assert.equal(model.formatClock(3661), '1:01:01');
  assert.equal(model.remainingSeconds(1000, 600, 1000), 600);
  assert.equal(model.remainingSeconds(1000, 600, 31000), 570);
  assert.equal(model.remainingSeconds(1000, 600, 999999), 0);
  assert.equal(model.remainingSeconds(5000, 600, 1000), 600, 'negative Zeit wird geklemmt');
});

test('M4: die Fade-Hüllkurve ist amplitudenlinear und endet exakt am Zielpegel', () => {
  const fadeIn = model.fadeGainSteps({ targetDb: -20, seconds: 5, stepMs: 100, direction: 'in' });
  assert.equal(fadeIn.length, 51);
  assert.equal(fadeIn[0], -60);
  assert.ok(Math.abs(fadeIn[fadeIn.length - 1] + 20) < 1e-9);
  for (let index = 1; index < fadeIn.length; index += 1) {
    assert.ok(fadeIn[index] >= fadeIn[index - 1] - 1e-9, 'Einblendung ist monoton steigend');
  }
  // Amplitudenlinear: die Mitte der Zeit entspricht −26 dBFS (halbe Amplitude).
  assert.ok(Math.abs(fadeIn[25] + 26.02) < 0.05, `Mitte ${fadeIn[25]}`);

  const fadeOut = model.fadeGainSteps({ targetDb: -20, seconds: 2, stepMs: 100, direction: 'out' });
  assert.equal(fadeOut.length, 21);
  assert.ok(Math.abs(fadeOut[0] + 20) < 1e-9);
  assert.equal(fadeOut[fadeOut.length - 1], -60);
  for (let index = 1; index < fadeOut.length; index += 1) {
    assert.ok(fadeOut[index] <= fadeOut[index - 1] + 1e-9, 'Ausblendung ist monoton fallend');
  }

  assert.deepEqual([...model.fadeGainSteps({ targetDb: -20, seconds: 0 })], [-20]);
  assert.throws(() => model.fadeGainSteps({ targetDb: Number.NaN, seconds: 5 }), /endliche Zahl/);
});

test('M5: der Speicher ist versioniert und liest nur gültige Einträge', () => {
  const storage = new FakeStorage();
  const store = model.createMeditationStore(storage);
  const favorite = { id: 'fav-1', name: 'Abend', ...SESSION };
  assert.equal(store.write({ favorites: [favorite], resume: { ...SESSION, remainingSeconds: 300 } }), true);
  const read = store.read();
  assert.equal(read.favorites.length, 1);
  assert.equal(read.favorites[0].name, 'Abend');
  assert.equal(read.resume.remainingSeconds, 300);
  assert.equal(read.available, true);

  const raw = JSON.parse(storage.getItem(model.MEDITATION_STORAGE_KEY));
  assert.equal(raw.version, model.MEDITATION_VERSION);
  // Keine Zeitstempel, keine Verlaufsdaten.
  assert.doesNotMatch(JSON.stringify(raw), /timestamp|startedAt|createdAt|20\d\d-\d\d-\d\d/);

  // Unbekannte Version wird ignoriert (und beim Schreiben überschrieben).
  storage.setItem(model.MEDITATION_STORAGE_KEY, JSON.stringify({ ...raw, version: 99 }));
  assert.deepEqual(store.read().favorites, []);
  // Defekte Einträge werden verworfen, nicht übernommen.
  storage.setItem(
    model.MEDITATION_STORAGE_KEY,
    JSON.stringify({
      version: model.MEDITATION_VERSION,
      favorites: [
        { id: 'fav-1', name: 'ok', ...SESSION },
        { id: 'fav-2', name: '', ...SESSION },
        { id: 'fav-3', name: 'falsch', ...SESSION, presetId: 'tone-999' },
      ],
      resume: { ...SESSION, remainingSeconds: 0 },
    })
  );
  const filtered = store.read();
  assert.equal(filtered.favorites.length, 1);
  assert.equal(filtered.resume, null);
});

test('M6: blockierter Speicher bricht nichts', () => {
  const store = model.createMeditationStore(blockedStorage);
  const read = store.read();
  assert.deepEqual(read.favorites, []);
  assert.equal(read.resume, null);
  assert.equal(read.available, false, 'ein werfendes Backend gilt als nicht verfügbar');
  assert.equal(store.write({ favorites: [{ name: 'x', ...SESSION }], resume: null }), false);
  assert.equal(store.clear(), false);
  const withoutBackend = model.createMeditationStore(null);
  assert.equal(withoutBackend.read().available, false);
  assert.equal(withoutBackend.write({ favorites: [] }), false);
});

test('M7: Favoriten-IDs sind deterministisch, luckenschließend und maximal acht', () => {
  assert.equal(model.nextFavoriteId([]), 'fav-1');
  assert.equal(model.nextFavoriteId([{ id: 'fav-1' }, { id: 'fav-3' }]), 'fav-2');
  const favorites = Array.from({ length: 10 }, (_, index) => ({
    id: `fav-${index + 1}`,
    name: `Sitzung ${index + 1}`,
    ...SESSION,
  }));
  const storage = new FakeStorage();
  const store = model.createMeditationStore(storage);
  store.write({ favorites, resume: null });
  assert.equal(store.read().favorites.length, model.MAX_FAVORITES);
});

test('M8: Wiederaufnahme wird nur plausibel gespeichert und gelesen', () => {
  assert.deepEqual(
    { ...model.sanitizeResume({ ...SESSION, remainingSeconds: 1 }) },
    { ...SESSION, remainingSeconds: 1 }
  );
  assert.equal(model.sanitizeResume({ ...SESSION, remainingSeconds: 0 }), null);
  assert.equal(model.sanitizeResume({ ...SESSION, remainingSeconds: 601 }), null);
  assert.equal(model.sanitizeResume({ ...SESSION, remainingSeconds: 12.5 }), null);
  assert.equal(model.sanitizeResume({ ...SESSION, remainingSeconds: 60, presetId: 'gibt-es-nicht' }), null);
  assert.match(model.summarizeSession(SESSION), /10 Minuten, Sinus 432 Hz/);
});

test('M9: die Sitzungsdauern der Oberfläche sind gültig und aufsteigend', () => {
  assert.deepEqual(
    [...model.DURATION_OPTIONS],
    [...model.DURATION_OPTIONS].sort((a, b) => a - b)
  );
  for (const minutes of model.DURATION_OPTIONS) {
    assert.doesNotThrow(() => model.validateSession({ ...SESSION, durationSeconds: minutes * 60 }));
  }
  for (const fade of model.FADE_OPTIONS) {
    assert.doesNotThrow(() => model.validateSession({ ...SESSION, fadeInSeconds: fade, fadeOutSeconds: fade }));
  }
});
