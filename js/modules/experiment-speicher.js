// Experimentierlabor (RAD-09) — Speicher für Experimentläufe.
//
// Vertrag (RAD-01 §6, RAD-03): Schlüssel `esot_rad_experiment_v1`, Umschlag
// `{ schema: 1, savedAt, data: [...] }`, höchstens 2.000 Antworten gesamt.
// Gelesen wird defensiv: Ein defekter Umschlag wird gesichert und geleert,
// ein höheres Schema wird NICHT überschrieben. Fehlt localStorage (Datei-
// Edition, privater Modus), arbeitet das Labor im Speicher weiter und sagt das
// sichtbar — es gibt keinen stillen Datenverlust und keinen Throw in die UI.
//
// Enthalten sind nur Läufe nach dem Vertrag: Commitments, gesperrte Antworten
// und enthüllte Ergebnisse. Salt und Ziel eines noch nicht enthüllten Versuchs
// stehen nie in diesem Speicher.

export const STORAGE_KEY = 'esot_rad_experiment_v1';
export const STORAGE_SCHEMA = 1;
export const MAX_ANSWERS = 2000;

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

export function countAnswers(runs) {
  if (!Array.isArray(runs)) return 0;
  return runs.reduce(
    (sum, run) => sum + (Array.isArray(run.trials) ? run.trials.filter((trial) => trial.predictionLocked).length : 0),
    0
  );
}

export function upsertRun(runs, run) {
  const list = Array.isArray(runs) ? runs : [];
  const next = list.filter((entry) => entry && entry.runId !== run.runId);
  next.push(run);
  return next;
}

export function removeRun(runs, runId) {
  return (Array.isArray(runs) ? runs : []).filter((entry) => entry && entry.runId !== runId);
}

export function findRun(runs, runId) {
  return (Array.isArray(runs) ? runs : []).find((entry) => entry && entry.runId === runId) || null;
}

function isRunArray(value) {
  return Array.isArray(value) && value.every((entry) => entry && typeof entry === 'object' && !Array.isArray(entry));
}

/**
 * Liest alle Läufe.
 * @returns {{runs: Array, state: 'empty'|'ok'|'corrupt'|'future'|'unavailable', message: string, backupKey: string|null}}
 */
export function readRuns(storage, { now = () => new Date() } = {}) {
  if (!storage) {
    return {
      runs: [],
      state: 'unavailable',
      message: 'Kein lokaler Speicher verfügbar. Läufe gelten nur für diese Sitzung.',
      backupKey: null,
    };
  }
  let raw = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      runs: [],
      state: 'unavailable',
      message: 'Der lokale Speicher ist gesperrt. Läufe gelten nur für diese Sitzung.',
      backupKey: null,
    };
  }
  if (raw === null || raw === undefined || raw === '') {
    return { runs: [], state: 'empty', message: '', backupKey: null };
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
        runs: [],
        state: 'future',
        message: `Der gespeicherte Stand stammt aus einer neueren Version (Schema ${parsed.schema}). Er wird nicht überschrieben.`,
        backupKey: null,
      };
    }
    return backup(storage, raw, now, `Der gespeicherte Stand hat ein unbekanntes Schema (${String(parsed.schema)}).`);
  }
  if (!isRunArray(parsed.data)) {
    return backup(storage, raw, now, 'Der gespeicherte Stand enthielt keine Lauf-Liste.');
  }
  return { runs: parsed.data.slice(), state: parsed.data.length ? 'ok' : 'empty', message: '', backupKey: null };
}

function backup(storage, raw, now, reason) {
  const stamp = safeStamp(now);
  const backupKey = `esot_rad_corrupt_${STORAGE_KEY}_${stamp}`;
  try {
    storage.setItem(backupKey, raw);
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Auch das Sichern kann scheitern (Quota). Der Aufrufer erhält trotzdem
    // eine Meldung und keinen Throw; der Rohwert bleibt dann im Speicher.
    return { runs: [], state: 'corrupt', message: `${reason} Sichern war nicht möglich.`, backupKey: null };
  }
  return {
    runs: [],
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
 * Schreibt die Läufe atomar im Umschlag.
 * @returns {{ok: boolean, message: string}}
 */
export function writeRuns(storage, runs, { now = () => new Date() } = {}) {
  if (!storage) return { ok: false, message: 'Kein lokaler Speicher verfügbar.' };
  if (!Array.isArray(runs)) return { ok: false, message: 'Interner Fehler: Läufe sind keine Liste.' };
  let savedAt;
  try {
    savedAt = now().toISOString();
  } catch {
    savedAt = new Date().toISOString();
  }
  const payload = JSON.stringify({ schema: STORAGE_SCHEMA, savedAt, data: runs });
  try {
    storage.setItem(STORAGE_KEY, payload);
    return { ok: true, message: '' };
  } catch (error) {
    const quota = error && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);
    return {
      ok: false,
      message: quota
        ? 'Der lokale Speicher ist voll. Läufe exportieren und alte Läufe löschen.'
        : 'Der Lauf konnte nicht gespeichert werden. Er gilt nur für diese Sitzung.',
    };
  }
}

/** Prüft nach dem Schreiben, ob der Lauf tatsächlich gespeichert ist. */
export function verifyStored(storage, runId, trialIndex, { now = () => new Date() } = {}) {
  const state = readRuns(storage, { now });
  const run = findRun(state.runs, runId);
  if (!run) return { ok: false, message: 'Der Lauf ist nach dem Schreiben nicht auffindbar.' };
  const trial = (run.trials || []).find((entry) => entry && entry.index === trialIndex);
  if (!trial || !trial.predictionLocked || trial.predictionLocked.locked !== true) {
    return { ok: false, message: 'Die gesperrte Antwort ist nicht gespeichert.' };
  }
  return { ok: true, message: '' };
}
