// Vertragstests des Frequenzlabors für Daten-Mapping, Flags und Präferenzen
// (ADR §9.2, P1–P8). Kein Browser nötig: fetch, DOM und Storage sind injizierbar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BINAURAL_PRESETS,
  EVIDENZ_STUFEN,
  STORAGE_KEY,
  TONE_ALLOWLIST_HZ,
  createPreferenceStore,
  formatHz,
  loadFrequencies,
  normalizeEntry,
  parseFrequencyFile,
  resolvePlayback,
  safeSourceUrl,
} from '../js/modules/frequenz-presets.js';
import { FEATURES, resolveFeatures } from '../js/modules/frequenz-flags.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'data/frequencies.json'), 'utf8'));

test('P1: der Datenbestand wird vollständig normalisiert', () => {
  const data = parseFrequencyFile(raw);
  assert.equal(data.error, null);
  assert.equal(data.entries.length, 41);
  assert.equal(data.rejected, 0);
  for (const entry of data.entries) {
    assert.ok(entry.id && entry.name, 'id und name sind Pflicht');
    assert.ok(['physikalisch', 'esoterisch'].includes(entry.kategorie));
    assert.ok(EVIDENZ_STUFEN[entry.evidenzstatus], `unbekannter Status: ${entry.evidenzstatus}`);
    assert.ok(entry.beschreibung.length <= 500);
    assert.ok(entry.rangeHzMax >= entry.rangeHzMin);
    if (entry.hz !== null) assert.ok(entry.hz >= entry.rangeHzMin && entry.hz <= entry.rangeHzMax);
    // Quellen sind nur als https-Link verwendbar; alles andere bleibt Text.
    if (entry.quelleUrl !== null) assert.match(entry.quelleUrl, /^https:\/\//);
  }
  assert.equal(data.entries.filter((entry) => entry.hz === null).length, 14);
  assert.ok(data.disclaimer.kurz.includes('kein Medizinprodukt'));
});

test('P2: nur die Allowlist und Partner-Töne werden abgespielt', () => {
  const data = parseFrequencyFile(raw);
  const playable = data.entries.filter((entry) => entry.playback.mode !== 'none');
  assert.equal(playable.length, 13);
  for (const entry of playable) {
    if (entry.playback.mode === 'tone' && !entry.playback.partnerHz) {
      assert.ok(TONE_ALLOWLIST_HZ.includes(entry.playback.hz), `${entry.hz} fehlt in der Allowlist`);
    }
  }
  const solfeggio = playable.filter((entry) => entry.id.startsWith('solfeggio-'));
  assert.equal(solfeggio.length, 9);
  for (const entry of solfeggio) assert.equal(entry.playback.mode, 'tone');
});

test('P3: Schumann, EEG-Bänder und andere Zahlen bleiben ohne Ton', () => {
  const data = parseFrequencyFile(raw);
  const byId = new Map(data.entries.map((entry) => [entry.id, entry]));
  assert.equal(byId.get('schumann-783').playback.mode, 'none');
  assert.equal(byId.get('schumann-783').warnhinweis, true);
  assert.equal(byId.get('eeg-alpha').playback.mode, 'none');
  assert.equal(byId.get('gamma-40-stimulation').playback.mode, 'none');
  assert.equal(byId.get('harmonische-obertonreihe').playback.mode, 'none');
  assert.equal(byId.get('ultraschall-medizin').playback.mode, 'none');
  // Pflichtthemen aus Master-Auftrag §3.1 bleiben ohne hörbare Wiedergabe (ADR §8.2).
  for (const id of [
    'rife-frequenz-727',
    'bioresonanz-geraete',
    'cymatics-chladni',
    'klangschale-obertoene',
    'mantra-om',
    'chakra-frequenzzuordnungen',
  ]) {
    assert.ok(byId.has(id), `${id} fehlt im Datensatz`);
    assert.equal(byId.get(id).playback.mode, 'none', `${id} darf nicht hörbar sein`);
  }
});

test('P4: ein gültiges playback-Feld gewinnt gegen die Allowlist', () => {
  const entry = normalizeEntry({
    id: 'test-playback',
    name: 'Test',
    hz: 528,
    range_hz_min: 528,
    range_hz_max: 528,
    kategorie: 'esoterisch',
    evidenzstatus: 'nicht belegt',
    beschreibung_kurz: 'Testeintrag',
    quelle_url: 'https://example.org/quelle',
    partner_hz: null,
    warnhinweis: true,
    playback: { mode: 'tone', hz: 512, partner_hz: 516 },
  });
  assert.deepEqual(entry.playback, { mode: 'tone', hz: 512, partnerHz: 516 });
  const binaural = normalizeEntry({
    id: 'test-binaural',
    name: 'Test binaural',
    hz: null,
    range_hz_min: 200,
    range_hz_max: 210,
    kategorie: 'physikalisch',
    evidenzstatus: 'belegt',
    beschreibung_kurz: 'Testeintrag',
    quelle_url: null,
    partner_hz: null,
    warnhinweis: false,
    playback: { mode: 'binaural', carrier_hz: 200, delta_hz: 10 },
  });
  assert.deepEqual(binaural.playback, { mode: 'binaural', carrierHz: 200, deltaHz: 10 });
});

test('P5: defekte Daten führen zu einem sichtbaren Fehlerzustand, nicht zum Absturz', () => {
  assert.equal(parseFrequencyFile('kein json').entries.length, 0);
  assert.ok(parseFrequencyFile('kein json').error);
  const broken = parseFrequencyFile({ frequencies: [{ id: 'x' }, { id: 'y', name: 'Y' }, null] });
  assert.equal(broken.entries.length, 0);
  assert.equal(broken.rejected, 3);
  const partial = parseFrequencyFile({
    frequencies: [
      {
        id: 'ok',
        name: 'OK',
        hz: 440,
        range_hz_min: 440,
        range_hz_max: 440,
        kategorie: 'physikalisch',
        evidenzstatus: 'belegt',
        beschreibung_kurz: 'ok',
      },
      {
        id: 'bad-hz',
        name: 'Bad',
        hz: -5,
        range_hz_min: -5,
        range_hz_max: 5,
        kategorie: 'physikalisch',
        evidenzstatus: 'belegt',
      },
    ],
  });
  assert.equal(partial.entries.length, 1);
  assert.equal(partial.rejected, 1);
});

test('P6: blockierter localStorage bricht die Seite nicht', () => {
  const store = createPreferenceStore({
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });
  assert.equal(store.read().freqHz, null);
  assert.equal(store.write({ freqHz: 440 }), false);
  assert.equal(createPreferenceStore(null).read().view, null);
});

test('P7: unbekannte Speicherversion wird ignoriert und überschrieben', () => {
  const map = new Map();
  const storage = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };
  map.set(STORAGE_KEY, JSON.stringify({ version: 99, freqHz: 999 }));
  const store = createPreferenceStore(storage);
  assert.equal(store.read().freqHz, null);
  assert.equal(store.write({ freqHz: 432, waveform: 'sine', gainDb: -24 }), true);
  const saved = JSON.parse(map.get(STORAGE_KEY));
  assert.equal(saved.version, 1);
  assert.equal(store.read().freqHz, 432);
  assert.equal(store.read().gainDb, -24);
});

test('P8: unsichere Quellen-URLs werden nicht verlinkt', () => {
  assert.equal(safeSourceUrl('javascript:alert(1)'), null);
  assert.equal(safeSourceUrl('data:text/html,<script>'), null);
  assert.equal(safeSourceUrl('http://example.org'), null);
  assert.equal(safeSourceUrl('https://example.org/quelle'), 'https://example.org/quelle');
  const entry = normalizeEntry({
    id: 'unsafe',
    name: 'Unsafe',
    hz: null,
    range_hz_min: 1,
    range_hz_max: 2,
    kategorie: 'physikalisch',
    evidenzstatus: 'belegt',
    beschreibung_kurz: 'x',
    quelle_titel: 'Unsichere Quelle',
    quelle_url: 'javascript:alert(1)',
    partner_hz: null,
    warnhinweis: false,
  });
  assert.equal(entry.quelleUrl, null);
  assert.equal(entry.quelleTitel, 'Unsichere Quelle');
});

test('Partner-Ton erzeugt zwei Stimmen, binauraler Eintrag bleibt kanalgetrennt', () => {
  const data = parseFrequencyFile(raw);
  const beat = data.entries.find((entry) => entry.id === 'schwebung-440-444');
  assert.deepEqual(beat.playback, { mode: 'tone', hz: 440, partnerHz: 444 });
  const binaural = data.entries.find((entry) => entry.id === 'binaurale-schwebung');
  assert.deepEqual(binaural.playback, { mode: 'binaural', carrierHz: 440, deltaHz: 4 });
  assert.equal(resolvePlayback(binaural).mode, 'binaural');
});

test('Binaural-Presets sind Konstanten und decken vier Bänder ab', () => {
  assert.equal(BINAURAL_PRESETS.length, 4);
  assert.deepEqual(
    BINAURAL_PRESETS.map((preset) => preset.id),
    ['delta', 'theta', 'alpha', 'beta']
  );
  for (const preset of BINAURAL_PRESETS) {
    assert.ok(preset.carrierHz >= 20 && preset.carrierHz <= 20000);
    assert.ok(preset.deltaHz >= 0.1 && preset.deltaHz <= 100);
  }
});

test('Frequenzformatierung nutzt deutsche Schreibweise und die Einheit Hz', () => {
  assert.equal(formatHz(440), '440 Hz');
  assert.equal(formatHz(7.83), '7,83 Hz');
  assert.equal(formatHz(1000), '1.000 Hz');
  assert.equal(formatHz(null), '—');
});

test('Feature-Flags: Produktion ignoriert den URL-Override, lokal gilt er', () => {
  // P9/P10 sind mit dem ADR-Nachtrag §13 ausgeliefert.
  assert.equal(FEATURES.cymatics, true);
  assert.equal(FEATURES.meditation, true);
  const prod = resolveFeatures('?fq=+cymatics,-binaural', { protocol: 'https:', hostname: 'ingbms.github.io' });
  assert.equal(prod, FEATURES);
  const local = resolveFeatures('?fq=+cymatics,-binaural', { protocol: 'http:', hostname: 'localhost' });
  assert.equal(local.cymatics, true);
  assert.equal(local.binaural, false);
  assert.equal(local.labor, true);
  const file = resolveFeatures('?fq=+meditation', { protocol: 'file:', hostname: '' });
  assert.equal(file.meditation, true);
  // Kill-Switch der Folgestufe: lokal abschaltbar, in Produktion nicht.
  const offLocal = resolveFeatures('?fq=-meditation,-cymatics', { protocol: 'http:', hostname: '127.0.0.1' });
  assert.equal(offLocal.meditation, false);
  assert.equal(offLocal.cymatics, false);
  const offProd = resolveFeatures('?fq=-meditation', { protocol: 'https:', hostname: 'ingbms.github.io' });
  assert.equal(offProd.meditation, true);
});

test('Datenladen nutzt das eingebettete JSON vor fetch (file://-Pfad)', async () => {
  const documentRef = {
    getElementById: (id) => (id === 'local-frequencies-data' ? { textContent: JSON.stringify(raw) } : null),
    baseURI: 'file:///C:/Esoterik-Welt/Lokal.html',
  };
  let fetched = 0;
  const data = await loadFrequencies({
    documentRef,
    fetchImpl: async () => {
      fetched += 1;
      return { ok: true, json: async () => raw };
    },
  });
  assert.equal(fetched, 0);
  assert.equal(data.entries.length, 41);
});
