// Pendeltagebuch (RAD-10) — Bedienung.
//
// Trennung wie bei den anderen Werkstätten: Speicher, Export, Import und
// Löschung sind DOM-frei in journal-speicher.js und werden dort geprüft. Dieses
// Modul verbindet die von radiasthesie-views.js gerenderte Oberfläche mit dem
// Journalvertrag aus radiasthesie-vertraege.js.
//
// Datenschutz: Es gibt kein Konto, keinen Server und keine Netzwerkanfrage.
// Einträge werden ausschließlich mit textContent ins Dokument geschrieben —
// nie als HTML —, damit Eingaben literal erscheinen und nichts ausgeführt wird.
//
// Zusammenarbeit mit RAD-09: Abgeschlossene Läufe aus `esot_rad_experiment_v1`
// werden gelesen und können als Eintrag übernommen werden. Der Lauf selbst
// wird dabei nicht verändert; der Eintrag trägt experimentId und runId.

import { WERKSTATT } from '../data/radiasthesie-werkstatt.js';
import {
  entryFromRun,
  runSummary,
  serializeEnvelope,
  validateJournalEntry,
  validateRun,
} from './radiasthesie-vertraege.js';
import { exportFileName, formatNumber, formatPercent } from './experiment-statistik.js';
import { readRuns } from './experiment-speicher.js';
import {
  MAX_ENTRIES,
  MAX_IMPORT_BYTES,
  buildEntry,
  confidenceLabel,
  countExperimentEntries,
  deleteAllStoredData,
  filterEntries,
  findEntry,
  formatDateDe,
  getLocalStorage,
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
} from './journal-speicher.js';

const DELETE_CONFIRM_MS = 6000;
const RUN_METHOD = 'verblindeter-selbsttest';
const FIELD_BY_PATH = {
  date: 'jrDate',
  question: 'jrQuestion',
  method: 'jrMethod',
  prediction: 'jrPrediction',
  confidence: 'jrConfidence',
  result: 'jrResult',
  review: 'jrReview',
  id: 'jrQuestion',
  runId: 'jrRunLink',
  experimentId: 'jrRunLink',
  createdAt: 'jrDate',
};

const formatIsoDateTime = (value) => {
  if (typeof value !== 'string' || !value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export function mountPendelJournal(container, options = {}) {
  if (!container) return { destroy() {} };

  const { now = () => new Date() } = options;
  const storage = Object.prototype.hasOwnProperty.call(options, 'storage') ? options.storage : getLocalStorage();
  const methodIds = WERKSTATT.methoden.map((method) => method.id);
  const methodTitle = (id) => {
    const method = WERKSTATT.methoden.find((entry) => entry.id === id);
    return method ? method.title : id;
  };
  const experimentTitle = (id) => {
    const experiment = WERKSTATT.experimentById(id);
    return experiment ? experiment.title : id;
  };

  const q = (selector) => container.querySelector(selector);
  const refs = {
    form: q('#jrForm'),
    formTitle: q('#jr-form-title'),
    date: q('#jrDate'),
    question: q('#jrQuestion'),
    method: q('#jrMethod'),
    confidence: q('#jrConfidence'),
    prediction: q('#jrPrediction'),
    result: q('#jrResult'),
    review: q('#jrReview'),
    save: q('#jrSave'),
    reset: q('#jrReset'),
    cancelEdit: q('#jrCancelEdit'),
    error: q('#jrError'),
    runLink: q('#jrRunLink'),
    runLinkText: q('#jrRunLinkText'),
    runClear: q('#jrRunClear'),
    filterInputs: [...container.querySelectorAll('input[name="jrFilter"]')],
    storageNote: q('#jrStorageNote'),
    empty: q('#jrEmpty'),
    entries: q('#jrEntries'),
    exportJson: q('#jrExportJson'),
    exportCsv: q('#jrExportCsv'),
    exportRuns: q('#jrExportRuns'),
    status: q('#jrStatus'),
    importFile: q('#jrImportFile'),
    importText: q('#jrImportText'),
    importApply: q('#jrImportApply'),
    runs: q('#jrRuns'),
    runsNote: q('#jrRunsNote'),
    runsEmpty: q('#jrRunsEmpty'),
    deleteAll: q('#jrDeleteAll'),
    deleteAllHint: q('#jrDeleteAllHint'),
  };

  const state = {
    entries: [],
    runs: [],
    storageState: 'empty',
    storageMessage: '',
    storageDenied: false,
    dropped: 0,
    droppedRuns: 0,
    filter: 'all',
    editingId: null,
    runRef: null,
    pendingDeleteId: null,
    deleteTimer: null,
    pendingDeleteAll: false,
    deleteAllTimer: null,
    busy: false,
  };

  const announce = (message, { warn = false } = {}) => {
    if (!refs.status) return;
    refs.status.textContent = message;
    refs.status.dataset.state = warn ? 'warn' : '';
  };

  const showError = (message) => {
    if (!refs.error) return;
    refs.error.textContent = message || '';
    refs.error.hidden = !message;
  };

  const clearError = () => showError('');

  const friendlyError = (error) => {
    if (!error) return 'Unbekannter Fehler.';
    const message = String(error.message || '');
    const match = /^[A-Za-z[\].]+:\s*(.*)$/.exec(message);
    return match ? match[1] : message;
  };

  const focusField = (path) => {
    const id = FIELD_BY_PATH[path];
    const element = id ? container.querySelector(`#${id}`) : null;
    if (!element) return;
    if (typeof element.focus === 'function') element.focus({ preventScroll: false });
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' || element.tagName === 'SELECT') {
      element.setAttribute('aria-invalid', 'true');
    }
  };

  const clearInvalid = () => {
    for (const element of container.querySelectorAll('[aria-invalid="true"]')) element.removeAttribute('aria-invalid');
  };

  const todayIso = () => {
    try {
      const value = now();
      if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
    } catch {
      // Fallback unten
    }
    return new Date().toISOString().slice(0, 10);
  };

  // --- Laden -------------------------------------------------------------

  const load = () => {
    const runState = readRuns(storage, { now });
    const validRuns = [];
    let droppedRuns = 0;
    for (const run of runState.runs) {
      if (validateRun(run).ok) validRuns.push(run);
      else droppedRuns += 1;
    }
    state.runs = validRuns;

    const result = readEntries(storage, { now });
    const valid = [];
    let dropped = 0;
    for (const entry of result.entries) {
      // Beim Laden wird die Struktur geprüft, nicht die Existenz eines Laufs:
      // Ein Tagebuch muss auch dann lesbar bleiben, wenn der Lauf gelöscht
      // wurde oder die Datei von einem anderen Gerät stammt.
      if (validateJournalEntry(entry, { methodIds, runs: null }).ok) valid.push(entry);
      else dropped += 1;
    }
    state.entries = sortEntries(valid);
    state.storageState = result.state;
    state.storageMessage = result.message;
    state.storageDenied = result.state === 'unavailable';
    state.dropped = dropped;

    if (droppedRuns > 0) {
      state.droppedRuns = droppedRuns;
    } else {
      state.droppedRuns = 0;
    }
    if (state.storageState === 'corrupt' || state.storageState === 'future' || dropped > 0) {
      announce(
        [result.message, dropped > 0 ? `${dropped} Eintrag/Einträge war(en) ungültig und wurde(n) nicht geladen.` : '']
          .filter(Boolean)
          .join(' '),
        { warn: true }
      );
    }
    renderAll();
  };

  // --- Schreiben ---------------------------------------------------------

  const persist = (next) => {
    const written = writeEntries(storage, next, { now });
    state.entries = sortEntries(next);
    if (!written.ok) {
      announce(
        state.storageDenied
          ? 'Kein lokaler Speicher: Der Eintrag gilt nur für diese Sitzung.'
          : `${written.message} Der Eintrag gilt in dieser Ansicht, ist aber nicht dauerhaft gespeichert.`,
        { warn: true }
      );
    }
    return written.ok;
  };

  /**
   * Ein höheres Schema gehört einer neueren Version dieses Moduls. Es wird
   * weder überschrieben noch als leerer Bestand weitergeführt — sonst ginge
   * der neuere Stand beim ersten Speichern verloren.
   */
  const writesBlocked = () => {
    if (state.storageState !== 'future') return false;
    showError(
      'Der gespeicherte Stand stammt aus einer neueren Version dieses Moduls. Es wird nichts geschrieben, damit nichts verloren geht. Bitte die Seite neu laden.'
    );
    announce('Speichern blockiert: Im lokalen Speicher liegt ein neueres Schema.', { warn: true });
    return true;
  };

  // --- Darstellung -------------------------------------------------------

  const storageText = () => {
    const total = state.entries.length;
    const withRun = countExperimentEntries(state.entries);
    if (state.storageDenied)
      return state.storageMessage || 'Kein lokaler Speicher: Einträge gelten nur für diese Sitzung.';
    if (state.storageState === 'future') return state.storageMessage;
    const free = MAX_ENTRIES - total;
    return `${total} von ${MAX_ENTRIES} Einträgen belegt (${withRun} mit Experimentbezug) · ${free} frei · lokal in diesem Browser.`;
  };

  const addField = (list, label, value) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    if (value instanceof Node) dd.append(value);
    else dd.textContent = value === undefined || value === null || value === '' ? '—' : String(value);
    row.append(dt, dd);
    list.append(row);
    return row;
  };

  const entryNode = (entry) => {
    const item = document.createElement('li');
    item.className = 'jr-entry';
    item.dataset.entryId = entry.id;

    const details = document.createElement('details');
    const summary = document.createElement('summary');

    const date = document.createElement('span');
    date.className = 'jr-entry-date';
    date.textContent = formatDateDe(entry.date);

    const question = document.createElement('span');
    question.className = 'jr-entry-question';
    question.textContent = entry.question;

    const badges = document.createElement('span');
    badges.className = 'jr-entry-badges';
    const parts = [];
    if (entry.method) parts.push(methodTitle(entry.method));
    if (entry.confidence !== undefined) parts.push(`Sicherheit ${entry.confidence}/5`);
    if (entry.experimentId) parts.push('Experimentbezug');
    if (entry.runId) parts.push('Lauf');
    badges.textContent = parts.join(' · ');

    summary.append(date, question, badges);
    details.append(summary);

    const body = document.createElement('div');
    body.className = 'jr-entry-body';

    const list = document.createElement('dl');
    list.className = 'jr-entry-fields';
    addField(list, 'Frage oder Versuch', entry.question);
    addField(list, 'Verwendete Methode', entry.method ? methodTitle(entry.method) : '');
    addField(list, 'Eigene Vorhersage', entry.prediction);
    addField(list, 'Subjektive Sicherheit', entry.confidence !== undefined ? confidenceLabel(entry.confidence) : '');
    addField(list, 'Tatsächliches Ergebnis', entry.result || '');
    addField(list, 'Spätere Bewertung', entry.review || '');
    if (entry.experimentId) {
      const value = document.createElement('span');
      value.textContent = `${experimentTitle(entry.experimentId)} (${entry.experimentId})`;
      addField(list, 'Experiment', value);
    }
    if (entry.runId) {
      const value = document.createElement('span');
      const run = state.runs.find((candidate) => candidate.runId === entry.runId);
      value.textContent = run ? `${entry.runId} · im Labor vorhanden` : `${entry.runId} · Lauf nicht mehr vorhanden`;
      addField(list, 'Laufbezug', value);
    }
    addField(list, 'Eingetragen am', formatIsoDateTime(entry.createdAt));

    const actions = document.createElement('div');
    actions.className = 'jr-entry-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-secondary';
    edit.dataset.action = 'edit';
    edit.dataset.entryId = entry.id;
    edit.textContent = 'Bearbeiten';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn jr-danger-btn';
    remove.dataset.action = 'delete';
    remove.dataset.entryId = entry.id;
    remove.textContent = 'Eintrag löschen';
    actions.append(edit, remove);

    body.append(list, actions);
    details.append(body);
    item.append(details);
    return item;
  };

  const renderEntries = () => {
    const visible = filterEntries(state.entries, state.filter);
    if (refs.entries) refs.entries.replaceChildren(...visible.map(entryNode));
    if (refs.empty) {
      if (state.entries.length === 0) {
        refs.empty.textContent = 'Noch kein Eintrag gespeichert. Der erste Eintrag entsteht mit dem Formular.';
        refs.empty.hidden = false;
      } else if (visible.length === 0) {
        refs.empty.textContent = 'Kein Eintrag mit Experimentbezug. Der Filter lässt sich auf „alle“ stellen.';
        refs.empty.hidden = false;
      } else {
        refs.empty.hidden = true;
      }
    }
    if (refs.exportJson) refs.exportJson.disabled = state.entries.length === 0;
    if (refs.exportCsv) refs.exportCsv.disabled = state.entries.length === 0;
    if (refs.exportRuns) refs.exportRuns.disabled = state.runs.length === 0;
    if (refs.storageNote) refs.storageNote.textContent = storageText();
  };

  const renderRuns = () => {
    if (!refs.runs) return;
    const complete = state.runs.filter((run) => run && runSummary(run).complete);
    if (refs.runsEmpty) refs.runsEmpty.hidden = complete.length > 0;
    if (refs.runsNote) {
      const base =
        complete.length === 0
          ? 'Es werden nur vollständig enthüllte Läufe angeboten — ein abgebrochener Lauf ist nicht auswertbar.'
          : complete.length === 1
            ? '1 abgeschlossener Lauf aus dem Labor. Ein Lauf lässt sich nur einmal übernehmen.'
            : `${complete.length} abgeschlossene Läufe aus dem Labor. Ein Lauf lässt sich nur einmal übernehmen.`;
      refs.runsNote.textContent =
        state.droppedRuns > 0
          ? `${base} ${state.droppedRuns} gespeicherte(r) Lauf/Läufe war(en) ungültig und wird/werden nicht angeboten.`
          : base;
    }
    refs.runs.replaceChildren(
      ...complete.map((run) => {
        const summary = runSummary(run);
        const item = document.createElement('li');
        item.className = 'jr-run';
        item.dataset.runId = run.runId;

        const main = document.createElement('div');
        main.className = 'jr-run-main';
        const title = document.createElement('p');
        title.className = 'jr-run-title';
        title.textContent = `${experimentTitle(run.experimentId)} · ${run.runId}`;
        const meta = document.createElement('p');
        meta.className = 'jr-run-meta';
        meta.textContent = `${summary.hits}/${summary.planned} Treffer · Zufallserwartung ${formatNumber(
          summary.expectedHits,
          1
        )} · p = ${formatPercent(summary.baseProbability, 1)} je Versuch · abgeschlossen ${formatIsoDateTime(
          run.trials.length && run.trials[run.trials.length - 1].resultRevealed
            ? run.trials[run.trials.length - 1].resultRevealed.revealedAt
            : run.createdAt
        )}`;
        main.append(title, meta);
        item.append(main);
        const existing = state.entries.find((entry) => entry.runId === run.runId);
        if (existing) {
          const done = document.createElement('p');
          done.className = 'jr-run-done';
          done.textContent = `Bereits übernommen am ${formatDateDe(existing.date)}. Ein zweiter Eintrag zum selben Lauf ist nicht vorgesehen.`;
          item.append(done);
          return item;
        }

        const form = document.createElement('div');
        form.className = 'jr-run-form';
        const id = `jrRunQuestion-${run.runId}`;
        const label = document.createElement('label');
        label.setAttribute('for', id);
        label.textContent = 'Frage oder Versuch für den Eintrag';
        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.maxLength = 200;
        input.autocomplete = 'off';
        input.placeholder = 'z. B. Trifft das Pendel das verdeckte Ziel häufiger als der Zufall?';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary';
        button.dataset.action = 'take';
        button.dataset.runId = run.runId;
        button.textContent = 'Ins Tagebuch übernehmen';
        form.append(label, input, button);
        item.append(form);
        return item;
      })
    );
  };

  const renderAll = () => {
    renderEntries();
    renderRuns();
  };

  // --- Formular ----------------------------------------------------------

  const setRunRef = (run, experimentId) => {
    state.runRef = run ? { runId: run.runId, experimentId: experimentId || run.experimentId } : null;
    if (!refs.runLink) return;
    refs.runLink.hidden = !state.runRef;
    if (state.runRef && refs.runLinkText) {
      refs.runLinkText.textContent = `Bezug: ${experimentTitle(state.runRef.experimentId)} · Lauf ${state.runRef.runId}`;
    }
  };

  const fillForm = (entry) => {
    state.editingId = entry.id;
    refs.date.value = entry.date || todayIso();
    refs.question.value = entry.question || '';
    refs.method.value = entry.method || '';
    refs.confidence.value = entry.confidence === undefined ? '' : String(entry.confidence);
    refs.prediction.value = entry.prediction || '';
    refs.result.value = entry.result || '';
    refs.review.value = entry.review || '';
    setRunRef(entry.runId ? { runId: entry.runId, experimentId: entry.experimentId } : null);
    if (refs.formTitle) refs.formTitle.textContent = 'Eintrag bearbeiten';
    if (refs.save) refs.save.textContent = 'Änderungen speichern';
    if (refs.cancelEdit) refs.cancelEdit.hidden = false;
    clearError();
    clearInvalid();
    if (refs.formTitle) refs.formTitle.focus({ preventScroll: true });
    refs.form.scrollIntoView({ behavior: 'instant', block: 'start' });
    announce(`Eintrag vom ${formatDateDe(entry.date)} wird bearbeitet. Speichern ersetzt den vorhandenen Stand.`);
  };

  const resetForm = ({ announceReset = false } = {}) => {
    state.editingId = null;
    refs.form.reset();
    refs.date.value = todayIso();
    refs.confidence.value = '';
    setRunRef(null);
    if (refs.formTitle) refs.formTitle.textContent = 'Neuer Eintrag';
    if (refs.save) refs.save.textContent = 'Eintrag speichern';
    if (refs.cancelEdit) refs.cancelEdit.hidden = true;
    clearError();
    clearInvalid();
    if (announceReset) announce('Formular geleert. Es wurde nichts gespeichert.');
  };

  const readForm = () => ({
    date: refs.date ? refs.date.value : '',
    question: refs.question ? refs.question.value : '',
    method: refs.method ? refs.method.value : '',
    confidence: refs.confidence ? refs.confidence.value : '',
    prediction: refs.prediction ? refs.prediction.value : '',
    result: refs.result ? refs.result.value : '',
    review: refs.review ? refs.review.value : '',
    experimentId: state.runRef ? state.runRef.experimentId : '',
    runId: state.runRef ? state.runRef.runId : '',
  });

  const save = (event) => {
    if (event) event.preventDefault();
    if (state.busy) return;
    state.busy = true;
    clearError();
    clearInvalid();
    try {
      if (writesBlocked()) return;
      const existing = state.editingId ? findEntry(state.entries, state.editingId) : null;
      if (state.editingId && !existing) {
        showError('Der Eintrag ist nicht mehr vorhanden. Formular leeren und neu erfassen.');
        return;
      }
      if (!existing && state.entries.length >= MAX_ENTRIES) {
        showError(`Das Tagebuch ist voll (${MAX_ENTRIES} Einträge). Erst exportieren und alte Einträge löschen.`);
        return;
      }
      const result = buildEntry(readForm(), {
        existing,
        now,
        methodIds,
        // Ein neuer Bezug wird gegen die vorhandenen Läufe geprüft. Bearbeitet
        // jemand einen Eintrag, dessen Lauf inzwischen gelöscht wurde, bleibt
        // der historische Bezug als Text erhalten statt die Bearbeitung zu
        // blockieren — die Struktur wird weiterhin geprüft.
        runs:
          state.runRef && !state.runs.some((candidate) => candidate.runId === state.runRef.runId) ? null : state.runs,
      });
      if (!result.ok) {
        const first = result.errors[0];
        showError(`Eintrag nicht gespeichert — ${friendlyError(first)}`);
        focusField(first ? first.path : '');
        announce('Der Eintrag wurde nicht gespeichert. Die erste fehlerhafte Stelle ist markiert.', { warn: true });
        return;
      }
      const next = upsertEntry(state.entries, result.entry);
      const durable = persist(next);
      resetForm();
      renderAll();
      announce(
        durable
          ? existing
            ? 'Eintrag aktualisiert und lokal gespeichert.'
            : 'Eintrag gespeichert. Er bleibt in diesem Browser.'
          : existing
            ? 'Eintrag aktualisiert — nur für diese Sitzung, der lokale Speicher meldet ein Problem.'
            : 'Eintrag erfasst — nur für diese Sitzung, der lokale Speicher meldet ein Problem.',
        { warn: !durable }
      );
    } finally {
      state.busy = false;
    }
  };

  // --- Export ------------------------------------------------------------

  const download = (filename, blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    container.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  };

  const exportJson = () => {
    if (state.entries.length === 0) {
      announce('Kein Eintrag zum Exportieren.');
      return;
    }
    // runs bleiben beim Export bewusst ungeprüft: Ein Eintrag mit gelöschtem
    // Lauf muss trotzdem exportierbar sein — sonst wäre die eigene Datei
    // Geisel eines fremden Datensatzes.
    const result = toJsonText(state.entries, { now, methodIds, runs: null });
    if (!result.ok) {
      announce(`JSON-Export abgelehnt: ${friendlyError(result.errors[0])}`, { warn: true });
      return;
    }
    const filename = exportFileName('journal', 'json', now());
    download(filename, new Blob([result.text], { type: 'application/json;charset=utf-8' }));
    announce(`${state.entries.length} Einträge als JSON exportiert: ${filename}.`);
  };

  const exportCsv = () => {
    if (state.entries.length === 0) {
      announce('Kein Eintrag zum Exportieren.');
      return;
    }
    const filename = exportFileName('journal', 'csv', now());
    const text = toCsv(state.entries, {
      methodLabel: methodTitle,
      experimentLabel: (id) => `${experimentTitle(id)} (${id})`,
    });
    download(filename, new Blob([text], { type: 'text/csv;charset=utf-8' }));
    announce(`${state.entries.length} Einträge als CSV exportiert: ${filename}.`);
  };

  const exportRuns = () => {
    if (state.runs.length === 0) {
      announce('Keine gespeicherten Experimentläufe zum Exportieren.');
      return;
    }
    const result = serializeEnvelope('experiment', state.runs, { now });
    if (!result.ok) {
      announce(`Export der Läufe abgelehnt: ${friendlyError(result.errors[0])}`, { warn: true });
      return;
    }
    const filename = exportFileName('experiment', 'json', now());
    download(filename, new Blob([result.text], { type: 'application/json;charset=utf-8' }));
    announce(`${state.runs.length} Lauf/Läufe als JSON exportiert: ${filename}.`);
  };

  // --- Import ------------------------------------------------------------

  const applyImport = async (text, sourceLabel = 'Eingabe') => {
    if (writesBlocked()) return;
    const result = parseImport(text, { methodIds, runs: null });
    if (!result.ok) {
      const first = result.errors[0];
      showError(`Import abgelehnt — ${friendlyError(first)}`);
      announce('Nichts importiert. Die Datei wurde vollständig abgelehnt.', { warn: true });
      if (refs.importText) refs.importText.focus({ preventScroll: true });
      return;
    }
    const merged = mergeEntries(state.entries, result.entries);
    if (!merged.ok) {
      showError(merged.message);
      announce('Nichts importiert. Der Bestand bleibt unverändert.', { warn: true });
      return;
    }
    const durable = persist(merged.entries);
    if (refs.importText) refs.importText.value = '';
    if (refs.importFile) refs.importFile.value = '';
    clearError();
    renderAll();
    announce(
      `${sourceLabel}: ${merged.added} Eintrag/Einträge hinzugefügt, ${merged.replaced} ersetzt. ${
        durable ? 'Lokal gespeichert.' : 'Nur für diese Sitzung gespeichert.'
      }`,
      { warn: !durable }
    );
  };

  const importFromFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      showError(`Die Datei ist zu groß (${file.size} Bytes; erlaubt sind ${MAX_IMPORT_BYTES}).`);
      announce('Nichts importiert. Die Datei ist größer als 1 MiB.', { warn: true });
      return;
    }
    let text = '';
    try {
      text = await file.text();
    } catch {
      showError('Die Datei konnte nicht gelesen werden.');
      announce('Nichts importiert. Die Datei war nicht lesbar.', { warn: true });
      return;
    }
    await applyImport(text, file.name || 'Datei');
  };

  // --- Löschen -----------------------------------------------------------

  const resetArmed = () => {
    if (state.deleteTimer) clearTimeout(state.deleteTimer);
    state.deleteTimer = null;
    state.pendingDeleteId = null;
    for (const button of container.querySelectorAll('[data-armed="true"]')) {
      button.textContent = button.dataset.originalLabel || 'Eintrag löschen';
      delete button.dataset.armed;
      delete button.dataset.originalLabel;
    }
  };

  const requestDeleteEntry = (id, button) => {
    if (!button) return;
    if (state.pendingDeleteId === id) {
      resetArmed();
      const removed = findEntry(state.entries, id);
      const next = removeEntry(state.entries, id);
      const durable = persist(next);
      if (state.editingId === id) resetForm();
      renderAll();
      announce(
        `${durable ? 'Eintrag gelöscht.' : 'Eintrag in dieser Ansicht entfernt; der lokale Speicher meldet ein Problem.'} ${
          removed ? `„${removed.question.slice(0, 60)}${removed.question.length > 60 ? '…' : ''}“` : ''
        }`.trim(),
        { warn: !durable }
      );
      return;
    }
    resetArmed();
    state.pendingDeleteId = id;
    button.dataset.armed = 'true';
    button.dataset.originalLabel = button.textContent;
    button.textContent = 'Wirklich löschen?';
    state.deleteTimer = setTimeout(() => {
      resetArmed();
      announce('Löschung nicht bestätigt. Der Eintrag bleibt erhalten.');
    }, DELETE_CONFIRM_MS);
  };

  const requestDeleteAll = () => {
    if (!state.pendingDeleteAll) {
      state.pendingDeleteAll = true;
      if (refs.deleteAll) {
        refs.deleteAll.dataset.originalLabel = refs.deleteAll.textContent;
        refs.deleteAll.textContent = 'Wirklich alle eigenen Daten löschen?';
        refs.deleteAll.dataset.armed = 'true';
      }
      if (refs.deleteAllHint) {
        refs.deleteAllHint.textContent =
          'Scharf geschaltet: Der nächste Klick löscht Tagebuch, Experimentläufe, Tafelkonfiguration und Sicherungskopien endgültig.';
      }
      announce(
        'Löschung scharf geschaltet. Der nächste Klick entfernt alle lokal gespeicherten Daten dieses Bereichs endgültig.',
        { warn: true }
      );
      if (state.deleteAllTimer) clearTimeout(state.deleteAllTimer);
      state.deleteAllTimer = setTimeout(() => {
        state.pendingDeleteAll = false;
        if (refs.deleteAll) {
          refs.deleteAll.textContent = refs.deleteAll.dataset.originalLabel || 'Alle eigenen Daten löschen';
          delete refs.deleteAll.dataset.armed;
        }
        if (refs.deleteAllHint) {
          refs.deleteAllHint.textContent =
            'Zum Löschen zweimal klicken: Der erste Klick schaltet scharf, der zweite löscht. Nach sechs Sekunden ohne zweiten Klick bleibt alles erhalten.';
        }
        announce('Löschung nicht bestätigt. Es wurde nichts gelöscht.', { warn: true });
      }, DELETE_CONFIRM_MS);
      return;
    }

    state.pendingDeleteAll = false;
    if (state.deleteAllTimer) clearTimeout(state.deleteAllTimer);
    state.deleteAllTimer = null;
    if (refs.deleteAll) {
      refs.deleteAll.textContent = refs.deleteAll.dataset.originalLabel || 'Alle eigenen Daten löschen';
      delete refs.deleteAll.dataset.armed;
    }
    if (refs.deleteAllHint) {
      refs.deleteAllHint.textContent =
        'Zum Löschen zweimal klicken: Der erste Klick schaltet scharf, der zweite löscht. Nach sechs Sekunden ohne zweiten Klick bleibt alles erhalten.';
    }

    const before = listStoredKeys(storage).length;
    const result = deleteAllStoredData(storage);
    state.entries = [];
    state.runs = [];
    state.storageState = storage ? 'empty' : 'unavailable';
    state.storageMessage = storage ? '' : 'Kein lokaler Speicher verfügbar.';
    state.dropped = 0;
    state.droppedRuns = 0;
    resetForm();
    renderAll();
    announce(
      result.ok
        ? `Alle eigenen Daten gelöscht: ${result.removed} Schlüssel entfernt (${before} vorhanden). Es gibt keine Kopie.`
        : `${result.message} Bitte den Browser-Speicher für diese Seite manuell prüfen.`,
      { warn: !result.ok }
    );
  };

  // --- Übernahme aus dem Labor ------------------------------------------

  const takeOver = (runId, input, button) => {
    if (writesBlocked()) return;
    const run = state.runs.find((candidate) => candidate.runId === runId);
    if (!run) {
      announce('Der Lauf ist nicht mehr vorhanden. Die Liste wird neu geladen.', { warn: true });
      load();
      return;
    }
    if (state.entries.some((entry) => entry.runId === runId)) {
      announce('Dieser Lauf wurde bereits übernommen. Ein zweiter Eintrag ist nicht vorgesehen.');
      return;
    }
    if (state.entries.length >= MAX_ENTRIES) {
      announce(`Das Tagebuch ist voll (${MAX_ENTRIES} Einträge). Erst exportieren und alte Einträge löschen.`, {
        warn: true,
      });
      return;
    }
    const question = input ? input.value.trim() : '';
    if (!question) {
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.focus({ preventScroll: false });
      }
      announce('Für die Übernahme fehlt die Frage. Bitte eintragen, was geprüft wurde.', { warn: true });
      return;
    }
    if (input) input.removeAttribute('aria-invalid');

    const summary = runSummary(run);
    const prediction = `Vorregistriert: ${run.experimentId}, n=${summary.planned}, k=${
      run.protocol.k
    }, p=${formatPercent(summary.baseProbability, 1)}`;
    const result = `${summary.hits}/${summary.planned} Treffer bei Zufallserwartung ${formatNumber(
      summary.expectedHits,
      1
    )}`;
    const created = entryFromRun(
      run,
      { question, prediction, result, method: RUN_METHOD },
      { now, methodIds, runs: state.runs }
    );
    if (!created.ok) {
      announce(`Übernahme abgelehnt: ${friendlyError(created.errors[0])}`, { warn: true });
      return;
    }
    const durable = persist(upsertEntry(state.entries, created.entry));
    if (input) input.value = '';
    renderAll();
    announce(
      `Lauf ${run.runId} übernommen. Vorhersage und Ergebnis stammen aus dem Protokoll; Sicherheit und Bewertung lassen sich im Formular ergänzen. ${
        durable ? 'Lokal gespeichert.' : 'Nur für diese Sitzung.'
      }`,
      { warn: !durable }
    );
    if (button) button.focus({ preventScroll: true });
  };

  // --- Ereignisse --------------------------------------------------------

  const handlers = [];
  const on = (element, type, handler) => {
    if (!element) return;
    element.addEventListener(type, handler);
    handlers.push([element, type, handler]);
  };

  on(refs.form, 'submit', save);
  on(refs.reset, 'click', () => resetForm({ announceReset: true }));
  on(refs.cancelEdit, 'click', () => {
    resetForm();
    announce('Bearbeiten beendet. Der gespeicherte Stand bleibt unverändert.');
  });
  on(refs.runClear, 'click', () => {
    setRunRef(null);
    announce('Bezug zum Lauf entfernt. Der Eintrag zählt nicht mehr als Experimenteintrag.');
  });

  for (const input of refs.filterInputs) {
    on(input, 'change', () => {
      if (!input.checked) return;
      state.filter = input.value === 'experiment' ? 'experiment' : 'all';
      renderEntries();
      announce(
        state.filter === 'experiment'
          ? `Filter: nur Einträge mit Experimentbezug (${countExperimentEntries(state.entries)}).`
          : `Filter: alle Einträge (${state.entries.length}).`
      );
    });
  }

  const onEntriesClick = (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.dataset.entryId;
    if (button.dataset.action === 'edit') {
      const entry = findEntry(state.entries, id);
      if (entry) fillForm(entry);
      return;
    }
    if (button.dataset.action === 'delete') requestDeleteEntry(id, button);
  };
  on(refs.entries, 'click', onEntriesClick);

  const onRunsClick = (event) => {
    const button = event.target.closest('button[data-action="take"]');
    if (!button) return;
    // `.jr-run` ist die Zeile; `[data-run-id]` trifft auch die Schaltfläche
    // selbst und würde ein leeres Eingabefeld liefern.
    const item = button.closest('.jr-run');
    if (!item) return;
    takeOver(button.dataset.runId, item.querySelector('input'), button);
  };
  on(refs.runs, 'click', onRunsClick);

  on(refs.exportJson, 'click', exportJson);
  on(refs.exportCsv, 'click', exportCsv);
  on(refs.exportRuns, 'click', exportRuns);
  on(refs.deleteAll, 'click', requestDeleteAll);
  on(refs.importApply, 'click', () => {
    if (refs.importText) applyImport(refs.importText.value, 'Eingefügter JSON-Text');
  });
  on(refs.importFile, 'change', () => {
    const file = refs.importFile && refs.importFile.files ? refs.importFile.files[0] : null;
    if (file) importFromFile(file);
  });

  // Formular startet mit dem heutigen Datum; Einträge werden beim Einsetzen
  // gelesen, damit ein zweiter Aufruf (Routenwechsel) keinen alten Zustand zeigt.
  if (refs.date && !refs.date.value) refs.date.value = todayIso();
  if (refs.formTitle) refs.formTitle.textContent = 'Neuer Eintrag';
  load();

  return {
    destroy() {
      for (const [element, type, handler] of handlers) element.removeEventListener(type, handler);
      if (state.deleteTimer) clearTimeout(state.deleteTimer);
      if (state.deleteAllTimer) clearTimeout(state.deleteAllTimer);
      state.deleteTimer = null;
      state.deleteAllTimer = null;
    },
    /** Nur für Tests und Diagnose: aktueller Stand ohne DOM-Zugriff. */
    snapshot() {
      return {
        entries: state.entries.slice(),
        runs: state.runs.slice(),
        storageState: state.storageState,
        dropped: state.dropped,
      };
    },
  };
}
