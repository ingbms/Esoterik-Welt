// Frequenzdaten: Laden, Validieren, Wiedergabe-Mapping und lokale Präferenzen.
// Diese Datei kennt kein DOM außer dem optionalen, eingebetteten Datenskript des
// Offline-Builds und keine UI. Sie darf von Node-Tests importiert werden; alle
// Browser-APIs sind injizierbar.
//
// Vertrag: docs/adr-frequenzlabor.md §8 (Datenvertrag und Wiedergabe-Mapping).

/** Evidenzstufen mit Anzeigetext. Der Text ist Teil der Barrierefreiheit: der
 *  Status wird nie nur über Farbe transportiert. */
export const EVIDENZ_STUFEN = Object.freeze({
  belegt: Object.freeze({ label: 'Belegt', kurz: 'durch Norm, Lehrbuch oder begutachtete Primärliteratur gestützt' }),
  plausibel: Object.freeze({
    label: 'Plausibel',
    kurz: 'erste Hinweise, aber keine belastbare Bestätigung am Menschen',
  }),
  'nicht belegt': Object.freeze({
    label: 'Nicht belegt',
    kurz: 'keine kontrollierte Evidenz gefunden; populäre oder numerologische Herkunft',
  }),
  traditionell: Object.freeze({
    label: 'Traditionell',
    kurz: 'überlieferte Zuordnung; die Rechenregel kann nachvollziehbar sein, die Bedeutung nicht',
  }),
});

export const KATEGORIEN = Object.freeze(['physikalisch', 'esoterisch']);

/** Hörbare Einzeltöne ohne `playback`-Feld (ADR §8.2, enge Allowlist). */
export const TONE_ALLOWLIST_HZ = Object.freeze([174, 285, 396, 417, 528, 639, 741, 852, 963, 432, 440]);

/** Binaurale Demonstrations-Presets (ADR §8.3). EEG-Bezug ist Konvention, keine Wirkaussage. */
export const BINAURAL_PRESETS = Object.freeze([
  Object.freeze({ id: 'delta', label: 'Delta (2 Hz)', carrierHz: 200, deltaHz: 2 }),
  Object.freeze({ id: 'theta', label: 'Theta (6 Hz)', carrierHz: 200, deltaHz: 6 }),
  Object.freeze({ id: 'alpha', label: 'Alpha (10 Hz)', carrierHz: 200, deltaHz: 10 }),
  Object.freeze({ id: 'beta', label: 'Beta (20 Hz)', carrierHz: 200, deltaHz: 20 }),
]);

/**
 * Einzige UI-seitige Abweichung von der reinen Allowlist: Der Datensatz
 * beschreibt diesen Eintrag ausdrücklich als kanalgetrennte Wiedergabe
 * („440 Hz links, 444 Hz rechts“). Ein Summenton mit 4 Hz Schwebung wäre eine
 * andere Demonstration als die beschriebene, deshalb wird hier binaural
 * gespielt. Alles andere folgt ausschließlich den Daten.
 */
const ID_PLAYBACK = Object.freeze({
  'binaurale-schwebung': Object.freeze({ mode: 'binaural', carrierHz: 440, deltaHz: 4 }),
});

const MAX_TEXT = 500;
const MAX_NAME = 120;

export const STORAGE_KEY = 'esoterik-welt:frequenzlabor:v1';
export const STORAGE_VERSION = 1;

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function text(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

/** Nur absolute https-URLs werden verlinkt; alles andere bleibt Text. */
export function safeSourceUrl(value) {
  const raw = text(value, MAX_TEXT);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function normalizePlayback(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const mode = raw.mode;
  if (mode === 'none') return Object.freeze({ mode: 'none' });
  if (mode === 'binaural') {
    if (!isFiniteNumber(raw.carrier_hz) || raw.carrier_hz <= 0) return null;
    if (!isFiniteNumber(raw.delta_hz) || raw.delta_hz <= 0) return null;
    return Object.freeze({ mode: 'binaural', carrierHz: raw.carrier_hz, deltaHz: raw.delta_hz });
  }
  if (mode === 'tone') {
    if (!isFiniteNumber(raw.hz) || raw.hz <= 0) return null;
    const partner = isFiniteNumber(raw.partner_hz) && raw.partner_hz > 0 ? raw.partner_hz : null;
    return Object.freeze({ mode: 'tone', hz: raw.hz, partnerHz: partner });
  }
  return null;
}

/**
 * Wiedergabe-Mapping eines Eintrags (ADR §8.2 + Datenhinweis aus t_2b60eff1).
 * Reihenfolge: gültiges `playback` → UI-Override für die binaurale Demo →
 * `partner_hz` (Schwebung) → Allowlist hörbarer Einzeltöne → `none`.
 */
export function resolvePlayback(entry) {
  if (!entry || typeof entry !== 'object') return Object.freeze({ mode: 'none' });
  const explicit = normalizePlayback(entry.playback);
  if (explicit) return explicit;
  const override = ID_PLAYBACK[entry.id];
  if (override) return override;
  const hz = entry.hz;
  if (!isFiniteNumber(hz) || hz <= 0) return Object.freeze({ mode: 'none' });
  const partnerValue = isFiniteNumber(entry.partnerHz) ? entry.partnerHz : entry.partner_hz;
  const partner = isFiniteNumber(partnerValue) && partnerValue > 0 ? partnerValue : null;
  if (partner) return Object.freeze({ mode: 'tone', hz, partnerHz: partner });
  if (TONE_ALLOWLIST_HZ.includes(hz)) return Object.freeze({ mode: 'tone', hz, partnerHz: null });
  return Object.freeze({ mode: 'none' });
}

/** Normalisiert einen Datensatz-Eintrag; `null` heißt: verwerfen. */
export function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = text(raw.id, MAX_NAME);
  const name = text(raw.name, MAX_NAME);
  if (!id || !name) return null;
  const hz = isFiniteNumber(raw.hz) && raw.hz > 0 ? raw.hz : null;
  const min = isFiniteNumber(raw.range_hz_min) ? raw.range_hz_min : hz;
  const max = isFiniteNumber(raw.range_hz_max) ? raw.range_hz_max : hz;
  if (min === null || max === null || min <= 0 || max < min) return null;
  if (hz !== null && (hz < min || hz > max)) return null;
  const kategorie = KATEGORIEN.includes(raw.kategorie) ? raw.kategorie : null;
  if (!kategorie) return null;
  const evidenzstatus = EVIDENZ_STUFEN[raw.evidenzstatus] ? raw.evidenzstatus : null;
  if (!evidenzstatus) return null;
  const entry = {
    id,
    name,
    hz,
    rangeHzMin: min,
    rangeHzMax: max,
    kategorie,
    unterkategorie: text(raw.unterkategorie, 40) || 'sonstiges',
    evidenzstatus,
    beschreibung: text(raw.beschreibung_kurz, MAX_TEXT),
    quelleTitel: text(raw.quelle_titel, MAX_NAME + 40),
    quelleUrl: safeSourceUrl(raw.quelle_url),
    partnerHz: isFiniteNumber(raw.partner_hz) && raw.partner_hz > 0 ? raw.partner_hz : null,
    warnhinweis: raw.warnhinweis === true,
  };
  entry.playback = resolvePlayback({ ...entry, playback: raw.playback });
  return entry;
}

/** Formatiert eine Frequenz mit deutscher Schreibweise und Einheit. */
export function formatHz(value) {
  if (!isFiniteNumber(value) || value <= 0) return '—';
  const digits = value >= 1000 ? 0 : value >= 100 ? 1 : 2;
  return `${value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: digits })} Hz`;
}

export function formatRange(entry) {
  if (!entry) return '—';
  if (entry.hz !== null) return formatHz(entry.hz);
  return `${formatHz(entry.rangeHzMin)} – ${formatHz(entry.rangeHzMax)}`;
}

/**
 * Parst den Datenbestand und gibt immer ein nutzbares Objekt zurück.
 * Ungültige Einträge werden gezählt, nicht verschwiegen.
 */
export function parseFrequencyFile(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      return { entries: [], rejected: 0, error: `JSON ungültig: ${error.message}`, disclaimer: null, definitions: {} };
    }
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.frequencies)) {
    return { entries: [], rejected: 0, error: 'Datenbestand ohne Frequenzliste', disclaimer: null, definitions: {} };
  }
  const entries = [];
  const seen = new Set();
  let rejected = 0;
  for (const item of data.frequencies) {
    const entry = normalizeEntry(item);
    if (!entry || seen.has(entry.id)) {
      rejected += 1;
      continue;
    }
    seen.add(entry.id);
    entries.push(entry);
  }
  const disclaimer = data.disclaimer && typeof data.disclaimer === 'object' ? data.disclaimer : null;
  return {
    entries,
    rejected,
    error: null,
    disclaimer,
    definitions: data.evidenzstatus_definitionen || {},
    stand: text(data.stand, 40),
    schemaVersion: text(data.schema_version, 20),
  };
}

/**
 * Lädt `data/frequencies.json` unter HTTP, liest im Offline-Build das
 * eingebettete Skript (ADR AD-7). Fehlt beides, bleibt der manuelle Generator
 * nutzbar; der Aufrufer zeigt den Fehler an.
 */
export async function loadFrequencies({ fetchImpl, documentRef, baseUrl } = {}) {
  const doc = documentRef || (typeof document === 'undefined' ? null : document);
  const embedded = doc && doc.getElementById ? doc.getElementById('local-frequencies-data') : null;
  if (embedded && embedded.textContent && embedded.textContent.trim()) {
    return parseFrequencyFile(embedded.textContent);
  }
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!doFetch) throw new Error('Frequenzdaten sind in dieser Umgebung nicht verfügbar');
  const base = baseUrl || (doc && doc.baseURI) || (typeof location === 'undefined' ? undefined : location.href);
  const response = await doFetch(new URL('data/frequencies.json', base));
  if (!response || response.ok !== true) {
    throw new Error(`Frequenzdaten konnten nicht geladen werden (HTTP ${response ? response.status : '—'})`);
  }
  return parseFrequencyFile(await response.json());
}

/** Präferenzspeicher (ADR AD-4): nur Skalare, versioniert, fehlertolerant. */
export function createPreferenceStore(storage) {
  const backend = storage || (typeof localStorage === 'undefined' ? null : localStorage);
  const empty = Object.freeze({
    freqHz: null,
    waveform: null,
    gainDb: null,
    presetId: null,
    view: null,
    binaural: null,
    sweep: null,
  });
  function read() {
    if (!backend) return empty;
    try {
      const raw = backend.getItem(STORAGE_KEY);
      if (!raw) return empty;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== STORAGE_VERSION) return empty;
      const binaural = parsed.binaural && typeof parsed.binaural === 'object' ? parsed.binaural : null;
      const sweep = parsed.sweep && typeof parsed.sweep === 'object' ? parsed.sweep : null;
      return Object.freeze({
        freqHz: isFiniteNumber(parsed.freqHz) && parsed.freqHz > 0 ? parsed.freqHz : null,
        waveform: ['sine', 'triangle', 'square', 'sawtooth'].includes(parsed.waveform) ? parsed.waveform : null,
        gainDb: isFiniteNumber(parsed.gainDb) ? parsed.gainDb : null,
        presetId: typeof parsed.presetId === 'string' ? parsed.presetId.slice(0, MAX_NAME) : null,
        view: parsed.view === 'labor' ? 'labor' : parsed.view === 'hub' ? 'hub' : null,
        binaural: binaural
          ? {
              carrierHz: isFiniteNumber(binaural.carrierHz) ? binaural.carrierHz : null,
              deltaHz: isFiniteNumber(binaural.deltaHz) ? binaural.deltaHz : null,
            }
          : null,
        sweep: sweep
          ? {
              seconds: isFiniteNumber(sweep.seconds) ? sweep.seconds : null,
              curve: sweep.curve === 'linear' ? 'linear' : 'exponential',
            }
          : null,
      });
    } catch {
      return empty;
    }
  }
  function write(prefs) {
    if (!backend || !prefs) return false;
    try {
      backend.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          freqHz: isFiniteNumber(prefs.freqHz) ? prefs.freqHz : null,
          waveform: prefs.waveform || null,
          gainDb: isFiniteNumber(prefs.gainDb) ? prefs.gainDb : null,
          presetId: prefs.presetId || null,
          view: prefs.view || null,
          binaural: prefs.binaural || null,
          sweep: prefs.sweep || null,
        })
      );
      return true;
    } catch {
      return false;
    }
  }
  return Object.freeze({ read, write, empty });
}
