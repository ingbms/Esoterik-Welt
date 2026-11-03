// Pendeltagebuch (RAD-10) — Speicher, Export, Import, vollständige Löschung.
//
// Vertrag (KOMPONENTENGRENZEN.md §5/§6, RAD-03): Schlüssel
// `esot_rad_journal_v1`, Umschlag `{ schema: 1, savedAt, data: [...] }`,
// höchstens 500 Einträge. Gelesen wird defensiv: Ein defekter Umschlag wird
// unter `esot_rad_corrupt_<key>_<stamp>` gesichert und der Schlüssel geleert,
// ein höheres Schema wird NICHT überschrieben. Fehlt localStorage (Datei-
// Edition, privater Modus), arbeitet die Oberfläche im Speicher weiter und
// sagt das sichtbar — kein stiller Datenverlust, kein Throw in die UI.
//
// Dieses Modul kennt weder DOM noch Ansicht: Es arbeitet auf Einträgen nach
// dem Journalvertrag aus radiasthesie-vertraege.js und ist in Node prüfbar.

import {
  JOURNAL_LIMITS,
  createEntry,
  importEnvelope,
  serializeEnvelope,
  validateJournalEntry,
} from './radiasthesie-vertraege.js';

export const STORAGE_KEY = 'esot_rad_journal_v1';
export const STORAGE_SCHEMA = 1;
export const MAX_ENTRIES = 500;
/** Präfix aller Schlüssel dieses Moduls; „alles löschen“ entfernt genau diese. */
export const STORAGE_PREFIX = 'esot_rad_';
export const MAX_IMPORT_BYTES = 1024 * 1024;
export const FILTERS = ['all', 'experiment'];
export const CONFIDENCE_LABELS = {
  1: 'sehr unsicher',
  2: 'eher unsicher',
  3: 'unentschieden',
  4: 'eher sicher',
  5: 'sehr sicher',
};

/** „4 von 5 · eher sicher“ — Text statt Farbe, damit die Skala lesbar bleibt. */
export function confidenceLabel(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 5) return '';
  return `${number} von 5 · ${CONFIDENCE_LABELS[number]}`;
}

export { JOURNAL_LIMITS };

/** localStorage defensiv holen: Zugriff kann in privaten Modi werfen. */
export function getLocalStorage(scope = globalThis) {
  try {
    const storage = scope && scope.localStorage;
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') return null;
    return storage;
  } catch {
    return null;
  }
}

// --- Listenoperationen ----------------------------------------------------

/** Datum absteigend, dann Erstellzeit absteigend; gleiche Einträge stabil. */
export function sortEntries(entries) {
  const list = Array.isArray(entries) ? entries.filter((entry) => entry && typeof entry === 'object') : [];
  return list.slice().sort((a, b) => {
    const byDate = String(b.date || '').localeCompare(String(a.date || ''));
    if (byDate !== 0) return byDate;
    const byCreated = String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    if (byCreated !== 0) return byCreated;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

export function filterEntries(entries, mode = 'all') {
  const list = Array.isArray(entries) ? entries : [];
  if (mode === 'experiment') return list.filter((entry) => entry && entry.experimentId);
  return list.slice();
}

export function countExperimentEntries(entries) {
  return filterEntries(entries, 'experiment').length;
}

export function findEntry(entries, id) {
  return (Array.isArray(entries) ? entries : []).find((entry) => entry && entry.id === id) || null;
}

/**
 * Nur die Felder des Journalvertrags (§5). Alles andere wird nicht
 * gespeichert und nicht exportiert — Datensparsamkeit gilt auch für
 * eingeschmuggelte Zusatzfelder aus einem Import.
 */
export const ENTRY_FIELDS = [
  'id',
  'date',
  'question',
  'method',
  'prediction',
  'confidence',
  'result',
  'review',
  'experimentId',
  'runId',
  'createdAt',
];

export function sanitizeEntry(entry) {
  const clean = {};
  if (!entry || typeof entry !== 'object') return clean;
  for (const key of ENTRY_FIELDS) {
    if (entry[key] !== undefined) clean[key] = entry[key];
  }
  return clean;
}

export function upsertEntry(entries, entry) {
  const list = Array.isArray(entries) ? entries : [];
  return [...list.filter((candidate) => candidate && candidate.id !== entry.id), entry];
}

export function removeEntry(entries, id) {
  return (Array.isArray(entries) ? entries : []).filter((entry) => entry && entry.id !== id);
}

/** Datum als `TT.MM.JJJJ`; alles andere wird als `—` gezeigt, nie geraten. */
export function formatDateDe(value) {
  const text = String(value == null ? '' : value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : '—';
}

// --- Lesen und Schreiben --------------------------------------------------

function isEntryArray(value) {
  return Array.isArray(value) && value.every((entry) => entry && typeof entry === 'object' && !Array.isArray(entry));
}

/**
 * Liest alle Einträge ungeprüft (die Prüfung braucht Methoden- und Laufbezug
 * und gehört damit in die Oberfläche).
 * @returns {{entries: Array, state: 'empty'|'ok'|'corrupt'|'future'|'unavailable', message: string, backupKey: string|null}}
 */
export function readEntries(storage, { now = () => new Date() } = {}) {
  if (!storage) {
    return {
      entries: [],
      state: 'unavailable',
      message: 'Kein lokaler Speicher verfügbar. Einträge gelten nur für diese Sitzung.',
      backupKey: null,
    };
  }
  let raw = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      entries: [],
      state: 'unavailable',
      message: 'Der lokale Speicher ist gesperrt. Einträge gelten nur für diese Sitzung.',
      backupKey: null,
    };
  }
  if (raw === null || raw === undefined || raw === '') {
    return { entries: [], state: 'empty', message: '', backupKey: null };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return backup(storage, raw, now, 'Der gespeicherte Stand war nicht lesbar (JSON-Fehler).');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return backup(storage, raw, now, 'Der gespeicherte Stand hatte keinen gültigen Umschlag.');
  }
  if (parsed.schema !== STORAGE_SCHEMA) {
    if (Number.isInteger(parsed.schema) && parsed.schema > STORAGE_SCHEMA) {
      return {
        entries: [],
        state: 'future',
        message: `Der gespeicherte Stand stammt aus einer neueren Version (Schema ${parsed.schema}). Er wird nicht überschrieben.`,
        backupKey: null,
      };
    }
    return backup(storage, raw, now, `Der gespeicherte Stand hat ein unbekanntes Schema (${String(parsed.schema)}).`);
  }
  if (!isEntryArray(parsed.data)) {
    return backup(storage, raw, now, 'Der gespeicherte Stand enthielt keine Eintragsliste.');
  }
  if (parsed.data.length > MAX_ENTRIES) {
    return {
      entries: parsed.data.slice(0, MAX_ENTRIES),
      state: 'corrupt',
      message: `Der gespeicherte Stand enthielt mehr als ${MAX_ENTRIES} Einträge. Es werden nur die ersten ${MAX_ENTRIES} geladen.`,
      backupKey: null,
    };
  }
  return { entries: parsed.data.slice(), state: parsed.data.length ? 'ok' : 'empty', message: '', backupKey: null };
}

function backup(storage, raw, now, reason) {
  const stamp = safeStamp(now);
  const backupKey = `esot_rad_corrupt_${STORAGE_KEY}_${stamp}`;
  try {
    storage.setItem(backupKey, raw);
    storage.removeItem(STORAGE_KEY);
  } catch {
    return { entries: [], state: 'corrupt', message: `${reason} Sichern war nicht möglich.`, backupKey: null };
  }
  return {
    entries: [],
    state: 'corrupt',
    message: `${reason} Der Rohwert wurde gesichert und der Schlüssel geleert.`,
    backupKey,
  };
}

function safeStamp(now) {
  try {
    const value = now();
    if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().replace(/[-:.TZ]/g, '');
  } catch {
    // Fallback unten
  }
  return String(Date.now());
}

/**
 * Schreibt alle Einträge im Umschlag.
 * @returns {{ok: boolean, message: string}}
 */
export function writeEntries(storage, entries, { now = () => new Date() } = {}) {
  if (!storage) return { ok: false, message: 'Kein lokaler Speicher verfügbar.' };
  if (!Array.isArray(entries)) return { ok: false, message: 'Interner Fehler: Einträge sind keine Liste.' };
  if (entries.length > MAX_ENTRIES) {
    return {
      ok: false,
      message: `Es sind höchstens ${MAX_ENTRIES} Einträge vorgesehen. Bitte zuerst exportieren und löschen.`,
    };
  }
  let savedAt;
  try {
    savedAt = now().toISOString();
  } catch {
    savedAt = new Date().toISOString();
  }
  const payload = JSON.stringify({ schema: STORAGE_SCHEMA, savedAt, data: entries.map(sanitizeEntry) });
  try {
    storage.setItem(STORAGE_KEY, payload);
    return { ok: true, message: '' };
  } catch (error) {
    const quota = error && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);
    return {
      ok: false,
      message: quota
        ? 'Der lokale Speicher ist voll. Einträge exportieren und alte Einträge löschen.'
        : 'Der Eintrag konnte nicht gespeichert werden. Er gilt nur für diese Sitzung.',
    };
  }
}

// --- Eintrag bauen --------------------------------------------------------

function trimmed(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

/**
 * Baut einen Eintrag aus Formularfeldern. Neu: `createEntry` (erzeugt id und
 * createdAt). Bearbeitung: id und createdAt bleiben erhalten, geleerte
 * optionale Felder verschwinden wirklich. Vor beiden Wegen wird derselbe
 * Vertrag geprüft — auch ein explizit geleertes Datum fällt auf, statt still
 * auf „heute“ zu springen.
 * @returns {{ok: boolean, entry: object|null, errors: Array}}
 */
export function buildEntry(
  fields,
  { existing = null, now = () => new Date(), rng, methodIds = null, runs = null } = {}
) {
  const source = fields && typeof fields === 'object' ? fields : {};
  let stamp;
  try {
    stamp = now();
    if (!(stamp instanceof Date) || !Number.isFinite(stamp.getTime())) throw new Error('ungültige Uhr');
  } catch {
    stamp = new Date();
  }
  const confidence =
    source.confidence === '' || source.confidence === null || source.confidence === undefined
      ? undefined
      : Number(source.confidence);
  const base = {
    date: trimmed(source.date),
    question: trimmed(source.question),
    prediction: trimmed(source.prediction),
  };
  const optional = {
    method: trimmed(source.method) || undefined,
    confidence,
    result: trimmed(source.result) || undefined,
    review: trimmed(source.review) || undefined,
    experimentId: trimmed(source.experimentId) || undefined,
    runId: trimmed(source.runId) || undefined,
  };
  const present = {};
  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined && value !== null && value !== '') present[key] = value;
  }
  const candidate = existing
    ? { id: existing.id, ...base, ...present, createdAt: existing.createdAt }
    : { id: 'jr-vorpruefung-1', ...base, ...present, createdAt: stamp.toISOString() };
  const check = validateJournalEntry(candidate, { methodIds, runs, requireId: true });
  if (!check.ok) return { ok: false, entry: null, errors: check.errors };
  if (existing) return { ok: true, entry: Object.freeze(candidate), errors: [] };
  return createEntry({ ...base, ...present }, { now: () => stamp, rng, methodIds, runs });
}

// --- Export ---------------------------------------------------------------

const CSV_HEADER = [
  'Datum',
  'Frage',
  'Methode',
  'Vorhersage',
  'Sicherheit',
  'Ergebnis',
  'Bewertung',
  'Experiment',
  'Lauf',
  'Erstellt am',
];

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV aller Einträge: UTF-8 mit BOM, Semikolon, RFC-4180-Quoting, CRLF.
 * `methodLabel`/`experimentLabel` übersetzen Kennungen für Menschen; die
 * Kennung bleibt in der JSON-Ausgabe erhalten.
 */
export function toCsv(entries, { methodLabel = (id) => id, experimentLabel = (id) => id } = {}) {
  const list = sortEntries(entries);
  const lines = [CSV_HEADER.map(csvCell).join(';')];
  for (const entry of list) {
    lines.push(
      [
        entry.date,
        entry.question,
        entry.method ? methodLabel(entry.method) : '',
        entry.prediction,
        entry.confidence === undefined ? '' : `${entry.confidence} von 5`,
        entry.result || '',
        entry.review || '',
        entry.experimentId ? experimentLabel(entry.experimentId) : '',
        entry.runId || '',
        entry.createdAt || '',
      ]
        .map(csvCell)
        .join(';')
    );
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** JSON-Umschlag nach §7.1; wirft bei ungültigen Einträgen nichts, sondern meldet. */
export function toJsonText(entries, { now = () => new Date(), methodIds = null, runs = null } = {}) {
  const list = sortEntries(entries).map(sanitizeEntry);
  return serializeEnvelope('journal', list, { now, methodIds, runs });
}

/**
 * Liest einen JSON-Import atomar: ein einziger ungültiger Eintrag führt dazu,
 * dass nichts übernommen wird (§7.3). CSV ist bewusst nicht vorgesehen.
 */
export function parseImport(text, { methodIds = null, runs = null } = {}) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, entries: [], errors: [{ path: 'text', rule: 'required', message: 'Import ist leer.' }] };
  }
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) {
    return {
      ok: false,
      entries: [],
      errors: [{ path: 'text', rule: 'maxBytes', message: 'Import ist größer als 1 MiB.' }],
    };
  }
  const result = importEnvelope(text, { kind: 'journal', maxBytes: MAX_IMPORT_BYTES, methodIds, runs });
  if (!result.ok) return { ok: false, entries: [], errors: result.errors };
  const entries = result.value.data;
  if (entries.length > MAX_ENTRIES) {
    return {
      ok: false,
      entries: [],
      errors: [
        {
          path: 'data',
          rule: 'maxEntries',
          message: `Der Import enthält ${entries.length} Einträge; vorgesehen sind höchstens ${MAX_ENTRIES}.`,
        },
      ],
    };
  }
  return { ok: true, entries: entries.map(sanitizeEntry), errors: [] };
}

/**
 * Führt Import und Bestand zusammen: gleiche id wird ersetzt, alles andere
 * ergänzt. Die Obergrenze gilt für das Ergebnis, nicht für die Datei allein.
 */
export function mergeEntries(current, imported, { maxEntries = MAX_ENTRIES } = {}) {
  const existing = Array.isArray(current) ? current : [];
  const incoming = Array.isArray(imported) ? imported : [];
  let merged = existing.slice();
  let added = 0;
  let replaced = 0;
  for (const entry of incoming) {
    const before = merged.length;
    merged = upsertEntry(merged, entry);
    if (merged.length > before) added += 1;
    else replaced += 1;
  }
  merged = sortEntries(merged);
  if (merged.length > maxEntries) {
    return {
      ok: false,
      entries: existing,
      added: 0,
      replaced: 0,
      message: `Zusammen sind das ${merged.length} Einträge; vorgesehen sind höchstens ${maxEntries}. Nichts wurde übernommen.`,
    };
  }
  return { ok: true, entries: merged, added, replaced, message: '' };
}

// --- Vollständige Löschung ------------------------------------------------

/** Alle eigenen Schlüssel dieses Moduls (inklusive Sicherungskopien). */
export function listStoredKeys(storage) {
  if (!storage) return [];
  const keys = [];
  try {
    if (typeof storage.key === 'function' && Number.isFinite(storage.length)) {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (typeof key === 'string' && key.startsWith(STORAGE_PREFIX)) keys.push(key);
      }
      return keys;
    }
  } catch {
    return [];
  }
  // Ohne Aufzählung bleiben nur die bekannten Schlüssel; das wird ehrlich
  // gemeldet, statt eine Vollständigkeit zu behaupten, die nicht prüfbar ist.
  return [STORAGE_KEY].filter((key) => {
    try {
      return storage.getItem(key) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * Löscht alle Schlüssel mit Präfix `esot_rad_` — Tagebuch, Experimentläufe,
 * Tafelkonfiguration und Sicherungskopien. Kein Server, kein Konto, keine
 * Kopie: Danach ist lokal nichts mehr vorhanden.
 * @returns {{ok: boolean, removed: number, keys: string[], failed: string[], message: string}}
 */
export function deleteAllStoredData(storage) {
  if (!storage) {
    return { ok: false, removed: 0, keys: [], failed: [], message: 'Kein lokaler Speicher verfügbar.' };
  }
  const keys = listStoredKeys(storage);
  const failed = [];
  let removed = 0;
  for (const key of keys) {
    try {
      storage.removeItem(key);
      removed += 1;
    } catch {
      failed.push(key);
    }
  }
  const ok = failed.length === 0;
  return {
    ok,
    removed,
    keys,
    failed,
    message: ok
      ? `${removed} gespeicherte(r) Schlüssel wurde(n) gelöscht.`
      : `${removed} von ${keys.length} Schlüsseln gelöscht; ${failed.length} ließen sich nicht entfernen.`,
  };
}
