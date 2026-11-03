// Sitzungsmodell der Meditation (P10, ADR-Nachtrag §13).
//
// Das Modul enthält die gesamte prüfbare Logik ohne DOM und ohne Audio:
// Preset-Liste, Validierung, Countdown-Arithmetik, Fade-Hüllkurve und der
// versionierte lokale Speicher für Favoriten und Wiederaufnahme.
//
// Datenschutz (verbindlich): Es gibt keine Registrierung, keine Cloud und
// keine Übertragung von Nutzungsdaten. Gespeichert werden ausschließlich die
// vom Nutzer ausdrücklich angelegten Favoriten und die zuletzt unterbrochene
// Sitzung – im localStorage dieses Browsers, ohne Zeitstempel und ohne
// Verlaufsdaten. Fehlt oder blockiert localStorage, bleibt die Sitzung
// benutzbar; nur Speichern und Fortsetzen entfallen.

export const MEDITATION_STORAGE_KEY = 'esoterik-welt:frequenzlabor:meditation:v1';
export const MEDITATION_VERSION = 1;
export const MAX_FAVORITES = 8;
export const MAX_NAME_LENGTH = 60;

/** Sitzungsdauern in Minuten (Auswahl in der Oberfläche). */
export const DURATION_OPTIONS = Object.freeze([3, 5, 10, 15, 20, 30, 45]);

/** Ein- und Ausblendzeiten in Sekunden. 0 bedeutet harter Schnitt. */
export const FADE_OPTIONS = Object.freeze([0, 2, 5, 10]);

/**
 * Klangpresets. Die Töne stammen ausschließlich aus der Allowlist des ADR
 * (§8.2): Solfeggio 174–963 Hz sowie die Referenztöne 432 und 440 Hz. Die
 * binauralen Einträge sind Differenzfrequenzen zur Demonstration, keine
 * Wirkaussage; Kopfhörer sind dafür nötig.
 */
export const SESSION_PRESETS = Object.freeze([
  Object.freeze({ id: 'tone-174', label: 'Sinus 174 Hz', mode: 'tone', hz: 174 }),
  Object.freeze({ id: 'tone-285', label: 'Sinus 285 Hz', mode: 'tone', hz: 285 }),
  Object.freeze({ id: 'tone-396', label: 'Sinus 396 Hz', mode: 'tone', hz: 396 }),
  Object.freeze({ id: 'tone-417', label: 'Sinus 417 Hz', mode: 'tone', hz: 417 }),
  Object.freeze({ id: 'tone-432', label: 'Sinus 432 Hz', mode: 'tone', hz: 432 }),
  Object.freeze({ id: 'tone-440', label: 'Sinus 440 Hz', mode: 'tone', hz: 440 }),
  Object.freeze({ id: 'tone-528', label: 'Sinus 528 Hz', mode: 'tone', hz: 528 }),
  Object.freeze({ id: 'tone-639', label: 'Sinus 639 Hz', mode: 'tone', hz: 639 }),
  Object.freeze({ id: 'tone-741', label: 'Sinus 741 Hz', mode: 'tone', hz: 741 }),
  Object.freeze({ id: 'tone-852', label: 'Sinus 852 Hz', mode: 'tone', hz: 852 }),
  Object.freeze({ id: 'tone-963', label: 'Sinus 963 Hz', mode: 'tone', hz: 963 }),
  Object.freeze({
    id: 'bin-delta',
    label: 'Binaural Delta, 2 Hz Differenz',
    mode: 'binaural',
    carrierHz: 200,
    deltaHz: 2,
  }),
  Object.freeze({
    id: 'bin-theta',
    label: 'Binaural Theta, 6 Hz Differenz',
    mode: 'binaural',
    carrierHz: 200,
    deltaHz: 6,
  }),
  Object.freeze({
    id: 'bin-alpha',
    label: 'Binaural Alpha, 10 Hz Differenz',
    mode: 'binaural',
    carrierHz: 200,
    deltaHz: 10,
  }),
  Object.freeze({
    id: 'bin-beta',
    label: 'Binaural Beta, 20 Hz Differenz',
    mode: 'binaural',
    carrierHz: 200,
    deltaHz: 20,
  }),
]);

export const DEFAULT_SESSION = Object.freeze({
  durationSeconds: 600,
  presetId: 'tone-432',
  fadeInSeconds: 5,
  fadeOutSeconds: 5,
});

const PRESET_BY_ID = new Map(SESSION_PRESETS.map((preset) => [preset.id, preset]));

/** Liefert das Preset oder null (kein Wurf – Aufrufer entscheidet über UI-Text). */
export function findPreset(presetId) {
  return PRESET_BY_ID.get(presetId) || null;
}

/** Kopfhörerhinweis gehört zum Preset, nicht zur Sitzung. */
export function presetNeedsHeadphones(preset) {
  return Boolean(preset && preset.mode === 'binaural');
}

function integerBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Normalisiert eine Sitzungskonfiguration. Ungültige Werte werden nicht
 * stillschweigend ersetzt, sondern als Fehler gemeldet; die Oberfläche zeigt
 * den Text und behält die vorherige Einstellung.
 */
export function validateSession(input = {}) {
  const durationSeconds = Number(input.durationSeconds);
  if (!integerBetween(durationSeconds, 60, 45 * 60)) {
    throw new RangeError('Die Sitzungsdauer muss zwischen 1 und 45 Minuten liegen.');
  }
  const preset = findPreset(input.presetId);
  if (!preset) throw new RangeError('Dieses Klangpreset ist nicht verfügbar.');
  const fadeInSeconds = Number(input.fadeInSeconds);
  const fadeOutSeconds = Number(input.fadeOutSeconds);
  if (!FADE_OPTIONS.includes(fadeInSeconds) || !FADE_OPTIONS.includes(fadeOutSeconds)) {
    throw new RangeError('Ein- und Ausblendung müssen 0, 2, 5 oder 10 Sekunden betragen.');
  }
  return Object.freeze({ durationSeconds, presetId: preset.id, fadeInSeconds, fadeOutSeconds });
}

/** Verbleibende Sekunden, nie negativ, nie über der Dauer. */
export function remainingSeconds(startedAtMs, durationSeconds, nowMs) {
  const elapsed = Math.max(0, (nowMs - startedAtMs) / 1000);
  return Math.max(0, Math.min(durationSeconds, Math.round(durationSeconds - elapsed)));
}

/** Uhrdarstellung mm:ss (über einer Stunde h:mm:ss). */
export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const two = (value) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${two(minutes)}:${two(rest)}` : `${two(minutes)}:${two(rest)}`;
}

/**
 * Fade-Hüllkurve als Folge von dBFS-Werten für `engine.setGain()`.
 * Die Amplitude läuft linear von 0 auf den Zielwert (bzw. umgekehrt); in dB
 * ist das eine Kurve, nicht eine Gerade. Der erste Wert ist −60 dBFS
 * (Hörschwelle des Labors), der letzte exakt der Zielwert.
 */
export function fadeGainSteps({ targetDb, seconds, stepMs = 100, direction = 'in' } = {}) {
  if (typeof targetDb !== 'number' || !Number.isFinite(targetDb)) {
    throw new RangeError('Der Zielpegel muss eine endliche Zahl in dBFS sein.');
  }
  const fade = Math.max(0, Number(seconds) || 0);
  if (fade === 0) return Object.freeze([targetDb]);
  const steps = Math.max(1, Math.round((fade * 1000) / stepMs));
  const targetAmplitude = Math.pow(10, targetDb / 20);
  const values = [];
  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const amplitude = targetAmplitude * (direction === 'out' ? 1 - progress : progress);
    values.push(amplitude <= 0 ? -60 : Math.max(-60, 20 * Math.log10(amplitude)));
  }
  return Object.freeze(values);
}

/** Sprechender Name für eine gespeicherte Sitzung (Favoritenliste, Ansage). */
export function summarizeSession(session) {
  const preset = findPreset(session.presetId);
  const minutes = Math.round(session.durationSeconds / 60);
  return `${minutes} Minuten, ${preset ? preset.label : 'unbekanntes Preset'}`;
}

/** Nächste freie Favoriten-Kennung (deterministisch, ohne Zeitstempel). */
export function nextFavoriteId(favorites) {
  const used = new Set((favorites || []).map((favorite) => favorite.id));
  let index = 1;
  while (used.has(`fav-${index}`)) index += 1;
  return `fav-${index}`;
}

function cleanName(value) {
  if (typeof value !== 'string') return null;
  const name = value.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  return name.length ? name : null;
}

/** Prüft einen gespeicherten Favoriten; ungültige Einträge werden verworfen. */
export function sanitizeFavorite(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = cleanName(raw.name);
  if (!name) return null;
  let session;
  try {
    session = validateSession(raw);
  } catch {
    return null;
  }
  return Object.freeze({
    id: typeof raw.id === 'string' && /^fav-\d+$/.test(raw.id) ? raw.id : null,
    name,
    ...session,
  });
}

/** Prüft eine gespeicherte Wiederaufnahme; ohne gültige Dauer ist sie ungültig. */
export function sanitizeResume(raw) {
  if (!raw || typeof raw !== 'object') return null;
  let session;
  try {
    session = validateSession(raw);
  } catch {
    return null;
  }
  const remaining = Number(raw.remainingSeconds);
  if (!integerBetween(remaining, 1, session.durationSeconds)) return null;
  return Object.freeze({ ...session, remainingSeconds: remaining });
}

/**
 * Versionierter Speicher (ADR AD-4 gilt analog): ein Schlüssel, ein Objekt,
 * Lesen und Schreiben in try/catch. Unbekannte Versionen werden ignoriert und
 * beim nächsten Schreiben überschrieben. Kein Zeitstempel, kein Verlauf.
 */
export function createMeditationStore(storage) {
  const backend = storage || (typeof localStorage === 'undefined' ? null : localStorage);
  const empty = Object.freeze({ favorites: Object.freeze([]), resume: null, available: Boolean(backend) });

  function read() {
    if (!backend) return empty;
    try {
      const text = backend.getItem(MEDITATION_STORAGE_KEY);
      if (!text) return empty;
      const parsed = JSON.parse(text);
      if (!parsed || parsed.version !== MEDITATION_VERSION) return empty;
      const favorites = [];
      for (const raw of Array.isArray(parsed.favorites) ? parsed.favorites : []) {
        const favorite = sanitizeFavorite(raw);
        if (!favorite) continue;
        const id = favorite.id || nextFavoriteId(favorites);
        if (favorites.some((entry) => entry.id === id)) continue;
        favorites.push(Object.freeze({ ...favorite, id }));
        if (favorites.length >= MAX_FAVORITES) break;
      }
      return Object.freeze({
        favorites: Object.freeze(favorites),
        resume: sanitizeResume(parsed.resume),
        available: true,
      });
    } catch {
      return Object.freeze({ favorites: Object.freeze([]), resume: null, available: false });
    }
  }

  function write(state) {
    if (!backend || !state) return false;
    try {
      const favorites = [];
      for (const raw of (state.favorites || []).slice(0, MAX_FAVORITES)) {
        const favorite = sanitizeFavorite(raw);
        if (!favorite) continue;
        const id =
          favorite.id && !favorites.some((entry) => entry.id === favorite.id) ? favorite.id : nextFavoriteId(favorites);
        favorites.push({ ...favorite, id });
      }
      const resume = sanitizeResume(state.resume);
      backend.setItem(
        MEDITATION_STORAGE_KEY,
        JSON.stringify({ version: MEDITATION_VERSION, favorites, resume: resume || null })
      );
      return true;
    } catch {
      return false;
    }
  }

  function clear() {
    if (!backend) return false;
    try {
      backend.removeItem(MEDITATION_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  return Object.freeze({ read, write, clear, empty });
}
