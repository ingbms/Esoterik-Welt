/**
 * Vertragstest für data/frequencies.json (Frequenzlabor-Datenbestand).
 *
 * Prüft die Abnahmekriterien der Recherche-Aufgabe maschinell:
 *  - valides JSON, mindestens 20 Einträge, eindeutige IDs
 *  - vollständige Felder, gültige Enum-Werte, Bereichslogik
 *  - beschreibung_kurz höchstens 200 Zeichen
 *  - jede Zeile hat Evidenzstatus und eine auflösbare Quelle
 *  - Disclaimer vorhanden und ohne Heilversprechen
 *  - keine unbelegten Gesundheitsbehauptungen im gesamten Datensatz
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FILE = path.join(__dirname, '..', 'data', 'frequencies.json');
const raw = fs.readFileSync(FILE, 'utf8');
const data = JSON.parse(raw);
const entries = data.frequencies;

const KATEGORIEN = ['physikalisch', 'esoterisch'];
const STATUS = ['belegt', 'plausibel', 'nicht belegt', 'traditionell'];
const REQUIRED = [
  'id',
  'name',
  'hz',
  'range_hz_min',
  'range_hz_max',
  'kategorie',
  'evidenzstatus',
  'beschreibung_kurz',
  'quelle_url',
  'warnhinweis',
];

test('Datei ist valides JSON mit Kopfbereich', () => {
  assert.ok(data && typeof data === 'object');
  assert.equal(typeof data.schema_version, 'string');
  assert.match(data.stand, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Array.isArray(entries));
});

test('mindestens 20 Einträge, beide Kategorien vertreten', () => {
  assert.ok(entries.length >= 20, `nur ${entries.length} Einträge`);
  const kategorien = new Set(entries.map((e) => e.kategorie));
  assert.deepEqual([...kategorien].sort(), ['esoterisch', 'physikalisch']);
  const status = new Set(entries.map((e) => e.evidenzstatus));
  assert.ok(status.size >= 3, 'zu wenige unterschiedliche Evidenzstufen');
});

test('jeder Eintrag hat alle Pflichtfelder mit korrektem Typ', () => {
  for (const e of entries) {
    for (const field of REQUIRED) {
      assert.ok(field in e, `${e.id}: Feld ${field} fehlt`);
    }
    assert.equal(typeof e.id, 'string');
    assert.match(e.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${e.id}: ID nicht slug-konform`);
    assert.ok(e.name.trim().length > 0, `${e.id}: Name leer`);
    assert.ok(e.hz === null || typeof e.hz === 'number', `${e.id}: hz muss number|null sein`);
    assert.equal(typeof e.range_hz_min, 'number', `${e.id}: range_hz_min`);
    assert.equal(typeof e.range_hz_max, 'number', `${e.id}: range_hz_max`);
    assert.ok(KATEGORIEN.includes(e.kategorie), `${e.id}: kategorie ${e.kategorie}`);
    assert.ok(STATUS.includes(e.evidenzstatus), `${e.id}: evidenzstatus ${e.evidenzstatus}`);
    assert.equal(typeof e.beschreibung_kurz, 'string');
    assert.equal(typeof e.quelle_url, 'string');
    assert.equal(typeof e.warnhinweis, 'boolean');
    assert.ok('partner_hz' in e, `${e.id}: partner_hz fehlt`);
  }
});

test('IDs sind eindeutig', () => {
  const ids = entries.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'doppelte IDs');
});

test('Bereiche sind logisch und Einzeltöne liegen im Bereich', () => {
  for (const e of entries) {
    assert.ok(e.range_hz_min > 0, `${e.id}: range_hz_min muss > 0 sein`);
    assert.ok(e.range_hz_max >= e.range_hz_min, `${e.id}: range_hz_max < range_hz_min`);
    if (e.hz !== null) {
      assert.ok(e.hz >= e.range_hz_min && e.hz <= e.range_hz_max, `${e.id}: hz liegt außerhalb des Bereichs`);
    }
    if (e.partner_hz !== null) {
      assert.equal(typeof e.partner_hz, 'number', `${e.id}: partner_hz`);
      assert.ok(e.partner_hz > e.hz, `${e.id}: partner_hz muss über hz liegen`);
    }
  }
});

test('beschreibung_kurz bleibt unter 200 Zeichen und nennt keine Wirkung', () => {
  for (const e of entries) {
    const text = e.beschreibung_kurz.trim();
    assert.ok(text.length > 20, `${e.id}: Beschreibung zu kurz`);
    assert.ok(text.length <= 200, `${e.id}: ${text.length} Zeichen (max. 200)`);
    assert.ok(!/\n/.test(text), `${e.id}: Zeilenumbruch in der Beschreibung`);
  }
});

test('jede Zeile verweist auf eine auflösbare Quelle', () => {
  for (const e of entries) {
    const url = new URL(e.quelle_url);
    assert.ok(['http:', 'https:'].includes(url.protocol), `${e.id}: Protokoll ${url.protocol}`);
    assert.ok(url.hostname.includes('.'), `${e.id}: Hostname unplausibel`);
    if ('quelle_titel' in e) {
      assert.ok(e.quelle_titel.trim().length > 5, `${e.id}: quelle_titel zu knapp`);
    }
  }
});

test('Disclaimer ist vorhanden, benennt Grenzen und Lautstärke', () => {
  const d = data.disclaimer;
  assert.ok(d && typeof d === 'object', 'disclaimer fehlt');
  const lang = d.lang || '';
  assert.ok(lang.length > 200, 'Disclaimer zu knapp');
  assert.match(lang, /keine? (Heil|Gesundheits)/i, 'kein Ausschluss von Heilversprechen');
  assert.match(lang, /kein Medizinprodukt/i);
  assert.match(lang, /ärztlich|Arzt|Ärztin/i, 'kein Hinweis auf ärztliche Abklärung');
  assert.match(lang, /80 dB/i, 'kein Lautstärkehinweis');
  assert.match(lang, /Pausen/i);
  assert.match(d.lautstaerke, /dBFS/i);
});

test('keine unbelegten Gesundheitsbehauptungen im Datensatz', () => {
  const verboten = [
    /\bheilt\b/i,
    /\bheilsam\b/i,
    /\btherapiert\b/i,
    /\bwirkt gegen\b/i,
    /\bhilft gegen\b/i,
    /\bheilt Krankheiten\b/i,
    /\b(?:senkt|reduziert) (?:den |die )?(?:Blutdruck|Entzündung|Schmerz)/i,
  ];
  const felder = ['name', 'beschreibung_kurz'];
  for (const e of entries) {
    for (const feld of felder) {
      const text = e[feld] || '';
      for (const muster of verboten) {
        assert.ok(!muster.test(text), `${e.id}.${feld}: Wirkbehauptung „${text.match(muster)}“`);
      }
    }
  }
  // Aussagen über DNA dürfen nur als widerlegte Behauptung vorkommen.
  for (const e of entries) {
    const text = e.beschreibung_kurz;
    if (/DNA/i.test(text)) {
      assert.match(text, /unbelegt|beworben|Behauptung/i, `${e.id}: DNA-Aussage ohne Einordnung`);
    }
  }
});

test('esoterische Einträge sind nie als „belegt“ eingestuft', () => {
  for (const e of entries) {
    if (e.kategorie === 'esoterisch') {
      assert.notEqual(e.evidenzstatus, 'belegt', `${e.id}: esoterisch + belegt`);
    }
  }
});

test('warnhinweis ist bei Wirkaussagen gesetzt', () => {
  for (const e of entries) {
    if (['nicht belegt', 'traditionell', 'plausibel'].includes(e.evidenzstatus)) {
      assert.equal(e.warnhinweis, true, `${e.id}: warnhinweis fehlt bei Status ${e.evidenzstatus}`);
    }
  }
});

// Coustos Planetenfrequenzen sind reine Oktavarithmetik: f = (1/T) * 2^n.
// Der Test rechnet sie aus astronomischen Perioden nach, damit im Datensatz
// kein abgetippter Zahlenwert steht, der sich nicht reproduzieren lässt.
test('Cousto-Frequenzen sind aus astronomischen Perioden reproduzierbar', () => {
  const DAY = 86400;
  const perioden = {
    'cousto-erdtag': 1 * DAY,
    'cousto-erdjahr': 365.242189 * DAY,
    'cousto-mond-synodisch': 29.530589 * DAY,
    'cousto-merkur': 87.9691 * DAY,
    'cousto-venus': 224.701 * DAY,
    'cousto-mars': 686.98 * DAY,
    'cousto-jupiter': 4332.589 * DAY,
    'cousto-saturn': 10759.22 * DAY,
  };
  const ziel = 170; // Coustos Bezugsbereich: Ton landet in der kleinen Oktave
  for (const [id, T] of Object.entries(perioden)) {
    const eintrag = entries.find((e) => e.id === id);
    assert.ok(eintrag, `${id} fehlt im Datensatz`);
    const f0 = 1 / T;
    const n = Math.round(Math.log2(ziel / f0));
    const f = f0 * 2 ** n;
    assert.ok(Math.abs(f - eintrag.hz) < 0.05, `${id}: berechnet ${f.toFixed(2)} Hz, im Datensatz ${eintrag.hz} Hz`);
  }
});
