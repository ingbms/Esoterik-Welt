// Experimentierlabor (RAD-09) — Bedienung.
//
// Trennung wie bei Labor und Studio: Statistik (experiment-statistik.js),
// Speicher (experiment-speicher.js) und Zufall (experiment-zufall.js) sind
// DOM-frei und einzeln geprüft. Dieses Modul verbindet die von
// radiasthesie-views.js gerenderte Oberfläche mit dem Vertrag aus
// radiasthesie-vertraege.js.
//
// Zwei Modi, strikt getrennt:
//   * Testmodus — vorregistriertes Experiment, jede Antwort wird gesperrt und
//     gespeichert, bevor das Ziel enthüllt wird; Auswertung und Export.
//   * Spielmodus — sofortiges Feedback, keine Speicherung, keine Statistik.
//
// Verblindung: Das Ziel lebt nur im Secret des laufenden Versuchs (Modul-
// speicher). Es wird weder ins DOM geschrieben noch gespeichert; gespeichert
// wird ausschließlich das SHA-256-Commitment. Diese Grenze ist clientseitig:
// Entwicklerwerkzeuge können sie umgehen. Das steht auch auf der Seite.

import { WERKSTATT } from '../data/radiasthesie-werkstatt.js';
import {
  beginTrial,
  createRun,
  lockPrediction,
  revealResult,
  serializeEnvelope,
  validateRun,
} from './radiasthesie-vertraege.js';
import { createCryptoRng, cryptoAvailable, drawIndex, randomToken } from './experiment-zufall.js';
import {
  answerLabels,
  analyseRun,
  exportFileName,
  formatInterval,
  formatNumber,
  formatPercent,
  formatPValue,
  interpretation,
  multipleTestingNote,
  runsToCsv,
  trialRows,
} from './experiment-statistik.js';
import {
  MAX_ANSWERS,
  countAnswers,
  getLocalStorage,
  readRuns,
  removeRun,
  upsertRun,
  verifyStored,
  writeRuns,
} from './experiment-speicher.js';

const DELETE_CONFIRM_MS = 6000;
const ISO_DATE = (date) => (date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : '');

export function mountExperimentLabor(container, options = {}) {
  if (!container) return { destroy() {} };

  const { now = () => new Date(), cryptoObject = globalThis.crypto } = options;
  const storage = Object.prototype.hasOwnProperty.call(options, 'storage') ? options.storage : getLocalStorage();

  const q = (selector) => container.querySelector(selector);

  const refs = {
    modeInputs: [...container.querySelectorAll('input[name="expMode"]')],
    panels: [...container.querySelectorAll('[data-exp-panel]')],
    experimentInputs: [...container.querySelectorAll('input[name="expExperiment"]')],
    protocols: [...container.querySelectorAll('[data-exp-protocol]')],
    start: q('#expStart'),
    startError: q('#expStartError'),
    trialPanel: q('#expTrialPanel'),
    trialCounter: q('#expTrialCounter'),
    runLabel: q('#expRunLabel'),
    question: q('#expQuestion'),
    answers: q('#expAnswers'),
    lock: q('#expLock'),
    reveal: q('#expReveal'),
    revealText: q('#expRevealText'),
    next: q('#expNext'),
    status: q('#expStatus'),
    statHits: q('#expStatHits'),
    statExpected: q('#expStatExpected'),
    statRate: q('#expStatRate'),
    statInterval: q('#expStatInterval'),
    statP: q('#expStatP'),
    statStatus: q('#expStatStatus'),
    verdict: q('#expVerdict'),
    multiple: q('#expMultiple'),
    exportJson: q('#expExportJson'),
    exportCsv: q('#expExportCsv'),
    deleteRun: q('#expDeleteRun'),
    storageNote: q('#expStorageNote'),
    tableWrap: q('#expTableWrap'),
    tableBody: q('#expTrialBody'),
    runs: q('#expRuns'),
    resume: q('#expResume'),
    demoType: q('#expDemoType'),
    demoAnswers: q('#expDemoAnswers'),
    demoFeedback: q('#expDemoFeedback'),
    demoCounter: q('#expDemoCounter'),
    demoReset: q('#expDemoReset'),
  };

  const state = {
    mode: 'test',
    run: null,
    secrets: new Map(),
    selected: null,
    busy: false,
    demo: { type: 'jaNein', trials: 0, hits: 0 },
    stored: [],
    storageState: 'empty',
    storageMessage: '',
    pendingDelete: null,
    deleteTimer: null,
  };

  let batchId = 'sitzung-lokal';
  try {
    if (cryptoAvailable(cryptoObject)) batchId = `sitzung-${randomToken(cryptoObject, 4)}`;
  } catch {
    batchId = 'sitzung-lokal';
  }
  let rng = null;

  const experimentById = (id) => WERKSTATT.experimentById(id);
  const selectedExperiment = () => {
    const input = refs.experimentInputs.find((entry) => entry.checked);
    return (input && experimentById(input.value)) || null;
  };
  const secretKey = (runId, index) => `${runId}:${index}`;

  const announce = (message) => {
    if (state.mode === 'test' && refs.status) refs.status.textContent = message;
    if (state.mode === 'demo' && refs.demoFeedback && message) refs.demoFeedback.textContent = message;
  };

  const showStartError = (message) => {
    if (!refs.startError) return;
    refs.startError.textContent = message || '';
    refs.startError.hidden = !message;
  };

  const storageNote = (message, { alert = false } = {}) => {
    if (!refs.storageNote) return;
    refs.storageNote.textContent = message || '';
    refs.storageNote.dataset.state = alert ? 'warn' : '';
  };

  const loadStored = () => {
    const result = readRuns(storage, { now });
    const valid = [];
    let dropped = 0;
    for (const entry of result.runs) {
      if (validateRun(entry).ok) valid.push(entry);
      else dropped += 1;
    }
    state.stored = valid;
    state.storageState = result.state;
    state.storageMessage = result.message;
    if (dropped > 0)
      state.storageMessage = `${dropped} gespeicherte(r) Lauf/Läufe war(en) ungültig und wurde(n) nicht geladen.`;
    const base =
      result.state === 'unavailable'
        ? result.message
        : valid.length === 0 && result.state === 'empty'
          ? 'Noch kein Lauf gespeichert. Läufe liegen nur in diesem Browser.'
          : `${valid.length} gespeicherte(r) Lauf/Läufe · ${countAnswers(valid)} von ${MAX_ANSWERS} Antworten belegt.`;
    storageNote(
      [base, result.state === 'corrupt' || dropped > 0 ? state.storageMessage : ''].filter(Boolean).join(' ')
    );
  };

  /** Schreibt den Lauf und liefert, ob er dauerhaft liegt. */
  const persist = (value) => {
    if (!value) return false;
    const next = upsertRun(state.stored, value);
    const written = writeRuns(storage, next, { now });
    if (written.ok) {
      state.stored = next;
      if (!refs.storageNote || refs.storageNote.dataset.state !== 'warn') {
        storageNote(
          `${state.stored.length} gespeicherte(r) Lauf/Läufe · ${countAnswers(state.stored)} von ${MAX_ANSWERS} Antworten belegt.`
        );
      }
      return true;
    }
    state.stored = next;
    storageNote(written.message, { alert: true });
    return false;
  };

  // --- Darstellung -------------------------------------------------------

  const renderProtocols = () => {
    const selected = selectedExperiment();
    for (const block of refs.protocols) {
      block.hidden = !selected || block.dataset.expProtocol !== selected.id;
    }
  };

  const renderRunList = () => {
    if (!refs.runs) return;
    refs.runs.innerHTML = '';
    if (state.stored.length === 0) {
      const item = document.createElement('li');
      item.className = 'exp-runlist-empty';
      item.textContent = 'Keine Läufe gespeichert.';
      refs.runs.append(item);
      if (refs.resume) refs.resume.hidden = true;
      return;
    }
    for (const stored of [...state.stored].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
      const experiment = experimentById(stored.experimentId);
      const revealed = stored.trials.filter((trial) => trial.resultRevealed);
      const hits = revealed.filter((trial) => trial.resultRevealed.hit).length;
      const openTrial = stored.trials[stored.trials.length - 1];
      const broken = Boolean(openTrial && openTrial.predictionLocked && !openTrial.resultRevealed);
      const resumable = stored.status !== 'complete' && !broken;

      const item = document.createElement('li');
      item.className = 'exp-runlist-item';

      const title = document.createElement('p');
      title.className = 'exp-runlist-title';
      title.textContent = experiment ? experiment.title : stored.experimentId;
      item.append(title);

      const meta = document.createElement('p');
      meta.className = 'exp-runlist-meta';
      meta.textContent = [
        ISO_DATE(new Date(stored.createdAt)).slice(0, 10) || 'ohne Datum',
        stored.status === 'complete' ? 'abgeschlossen' : broken ? 'unterbrochen — nicht auswertbar' : 'offen',
        `${hits}/${stored.protocol.n} Treffer`,
        `${stored.trials.length} Versuche begonnen`,
      ].join(' · ');
      item.append(meta);

      const actions = document.createElement('div');
      actions.className = 'exp-runlist-actions';

      if (resumable) {
        const resume = document.createElement('button');
        resume.type = 'button';
        resume.className = 'btn btn-secondary';
        resume.textContent = 'Fortsetzen';
        resume.addEventListener('click', () => resumeRun(stored));
        actions.append(resume);
      }

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-secondary exp-danger';
      remove.textContent = 'Löschen';
      remove.addEventListener('click', () => requestDelete(stored.runId, remove));
      actions.append(remove);

      item.append(actions);
      refs.runs.append(item);
    }

    const latestOpen = state.stored
      .filter((stored) => {
        const last = stored.trials[stored.trials.length - 1];
        return stored.status !== 'complete' && !(last && last.predictionLocked && !last.resultRevealed);
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if (refs.resume) {
      refs.resume.hidden = !latestOpen || Boolean(state.run);
      refs.resume.onclick = latestOpen ? () => resumeRun(latestOpen) : null;
    }
  };

  const renderAnswers = () => {
    if (!refs.answers || !state.run) return;
    const trial = state.run.trials[state.run.trials.length - 1];
    const k = state.run.protocol.k;
    const labels = answerLabels(state.run.protocol.testType, k);
    refs.answers.innerHTML = '';
    const locked = Boolean(trial && trial.predictionLocked);
    for (let index = 0; index < k; index += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'exp-answer';
      button.dataset.index = String(index);
      button.textContent = labels[index];
      button.disabled = locked || state.busy || !trial;
      button.setAttribute('aria-pressed', String(state.selected === index));
      if (locked && trial.predictionLocked.answerIndex === index) button.classList.add('is-chosen');
      button.addEventListener('click', () => {
        if (state.busy || !state.run) return;
        state.selected = index;
        renderAnswers();
        if (refs.lock) refs.lock.disabled = false;
      });
      refs.answers.append(button);
    }
  };

  const renderTable = () => {
    if (!refs.tableBody || !refs.tableWrap) return;
    refs.tableBody.innerHTML = '';
    if (!state.run) {
      refs.tableWrap.hidden = true;
      return;
    }
    const labels = answerLabels(state.run.protocol.testType, state.run.protocol.k);
    const rows = trialRows(state.run).filter((row) => row.revealedAt);
    refs.tableWrap.hidden = rows.length === 0;
    for (const row of rows) {
      const tr = document.createElement('tr');
      const cells = [
        String(row.index),
        labels[row.answerIndex] || '—',
        labels[row.targetIndex] || '—',
        row.hit ? 'Treffer' : 'kein Treffer',
        row.revealedAt.slice(11, 19),
      ];
      for (const value of cells) {
        const cell = document.createElement('td');
        cell.textContent = value;
        tr.append(cell);
      }
      if (!row.hit) tr.classList.add('is-miss');
      refs.tableBody.append(tr);
    }
  };

  const renderStats = () => {
    if (!refs.statHits) return;
    if (!state.run) {
      refs.statHits.textContent = '—';
      refs.statExpected.textContent = '—';
      refs.statRate.textContent = '—';
      refs.statInterval.textContent = '—';
      refs.statP.textContent = '—';
      refs.statStatus.textContent = 'Noch kein Lauf';
      if (refs.verdict) refs.verdict.textContent = 'Sobald ein Versuch enthüllt ist, erscheint hier die Einordnung.';
      if (refs.multiple) refs.multiple.textContent = '';
      if (refs.exportJson) refs.exportJson.disabled = true;
      if (refs.exportCsv) refs.exportCsv.disabled = true;
      if (refs.deleteRun) refs.deleteRun.disabled = true;
      return;
    }
    const analysis = analyseRun(state.run);
    const verdict = interpretation(analysis);
    refs.statHits.textContent = `${analysis.hits} von ${analysis.revealed}`;
    refs.statExpected.textContent = `${formatNumber(analysis.expected, 2)} Treffer (${formatPercent(
      analysis.baseProbability
    )} je Versuch)`;
    refs.statRate.textContent = formatPercent(analysis.hitRate);
    refs.statInterval.textContent = formatInterval(analysis.interval);
    refs.statP.textContent = analysis.n === 0 ? '—' : formatPValue(analysis.pValue);
    refs.statStatus.textContent = analysis.complete
      ? `abgeschlossen (${analysis.planned} von ${analysis.planned} Versuchen)`
      : `läuft — ${analysis.revealed} von ${analysis.planned} Versuchen ausgewertet`;
    if (refs.verdict) {
      refs.verdict.textContent = `${verdict.headline}. ${verdict.text}`;
      refs.verdict.dataset.level = verdict.level;
    }
    if (refs.multiple) {
      refs.multiple.textContent = multipleTestingNote({
        storedRuns: state.stored.length,
        batchRuns: state.stored.filter((entry) => entry.batchId === state.run.batchId).length,
      });
    }
    const exportable = analysis.revealed > 0;
    if (refs.exportJson) refs.exportJson.disabled = !exportable;
    if (refs.exportCsv) refs.exportCsv.disabled = !exportable;
    if (refs.deleteRun) refs.deleteRun.disabled = false;
  };

  const renderTrial = () => {
    if (!refs.trialPanel) return;
    const run = state.run;
    const experiment = run ? experimentById(run.experimentId) : null;
    refs.trialPanel.hidden = !run;
    if (!run) {
      if (refs.trialCounter) refs.trialCounter.textContent = 'Versuch 1 von 20';
      if (refs.runLabel) refs.runLabel.textContent = 'Lauf —';
      if (refs.reveal) refs.reveal.hidden = true;
      if (refs.next) refs.next.hidden = true;
      return;
    }
    const trial = run.trials[run.trials.length - 1];
    const complete = run.status === 'complete';
    if (refs.trialCounter) {
      refs.trialCounter.textContent = complete
        ? `Alle ${run.protocol.n} Versuche abgeschlossen`
        : `Versuch ${run.trials.length} von ${run.protocol.n}`;
    }
    if (refs.runLabel) {
      refs.runLabel.textContent = `${experiment ? experiment.title : run.experimentId} · ${run.runId}`;
    }
    if (refs.question) {
      refs.question.textContent = complete ? 'Auswertung dieses Laufs' : 'Welches Ziel wurde gezogen?';
    }

    const locked = Boolean(trial && trial.predictionLocked);
    const revealed = Boolean(trial && trial.resultRevealed);
    renderAnswers();
    if (refs.lock) {
      refs.lock.disabled = state.busy || !trial || locked || state.selected === null;
      refs.lock.hidden = complete || (locked && revealed);
    }
    if (refs.reveal) refs.reveal.hidden = !revealed;
    if (refs.next) {
      refs.next.hidden = !revealed || complete;
      refs.next.disabled = state.busy;
    }
    if (revealed && refs.revealText) {
      const labels = answerLabels(run.protocol.testType, run.protocol.k);
      const answer = labels[trial.predictionLocked.answerIndex];
      const target = labels[trial.resultRevealed.targetIndex];
      refs.revealText.textContent = `${trial.resultRevealed.hit ? 'Treffer' : 'Kein Treffer'} — Antwort „${answer}“, Ziel „${target}“. Die Antwort war vor der Enthüllung gesperrt und gespeichert.`;
      refs.revealText.dataset.hit = String(trial.resultRevealed.hit);
    }
    if (locked && !revealed && refs.status) {
      refs.status.textContent =
        'Die Antwort ist gesperrt; das Ziel dieser Sitzung ist nicht mehr verfügbar. Der Lauf ist nicht auswertbar; nur der ganze Lauf lässt sich löschen.';
    }
  };

  const renderTest = () => {
    renderProtocols();
    const running = Boolean(state.run) && !canStartNew();
    if (refs.start) {
      refs.start.disabled = state.busy || running;
      refs.start.textContent = running ? 'Lauf läuft' : state.run ? 'Neuen Lauf starten' : 'Lauf starten';
    }
    if (refs.experimentInputs) {
      for (const input of refs.experimentInputs) input.disabled = state.busy || running;
    }
    renderTrial();
    renderTable();
    renderStats();
    renderRunList();
  };

  // --- Spielmodus --------------------------------------------------------

  const demoLabels = () => {
    const k = state.demo.type === 'richtung' ? 8 : state.demo.type === 'zahl' ? 5 : 2;
    return { k, labels: answerLabels(state.demo.type, k) };
  };

  const renderDemo = () => {
    if (!refs.demoAnswers) return;
    const { k, labels } = demoLabels();
    refs.demoAnswers.innerHTML = '';
    for (let index = 0; index < k; index += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'exp-answer';
      button.textContent = labels[index];
      button.addEventListener('click', () => playDemo(index));
      refs.demoAnswers.append(button);
    }
    if (refs.demoCounter) {
      refs.demoCounter.textContent = `${state.demo.trials} Versuche · ${state.demo.hits} Treffer · Spielstand ohne Auswertung`;
    }
  };

  const playDemo = (answerIndex) => {
    if (state.busy) return;
    if (!cryptoAvailable(cryptoObject)) {
      announce('Web Crypto ist nicht verfügbar — ohne echte Zufallsquelle startet der Spielmodus nicht.');
      return;
    }
    try {
      const { k, labels } = demoLabels();
      if (!rng) rng = createCryptoRng(cryptoObject);
      const target = drawIndex(k, rng);
      const hit = target === answerIndex;
      state.demo.trials += 1;
      if (hit) state.demo.hits += 1;
      announce(
        `${hit ? 'Treffer' : 'Kein Treffer'} — Antwort „${labels[answerIndex]}“, Ziel „${labels[target]}“. Spielmodus: nicht gespeichert.`
      );
      renderDemo();
    } catch (error) {
      announce(`Zufallsquelle fehlgeschlagen: ${error.message}`);
    }
  };

  // --- Testmodus ---------------------------------------------------------

  const currentTrial = () => (state.run ? state.run.trials[state.run.trials.length - 1] || null : null);

  /** Unterbrochener Lauf: Antwort gesperrt, Ziel nicht mehr enthüllbar. */
  const runBroken = (run) => {
    const last = run && run.trials[run.trials.length - 1];
    return Boolean(last && last.predictionLocked && !last.resultRevealed);
  };

  /** Ein neuer Lauf ist erlaubt, wenn keiner läuft oder der alte abgeschlossen/unterbrochen ist. */
  const canStartNew = () => !state.run || state.run.status === 'complete' || runBroken(state.run);

  const startRun = async () => {
    if (state.busy || !canStartNew()) return;
    showStartError('');
    const experiment = selectedExperiment();
    if (!experiment) {
      showStartError('Bitte ein vorregistriertes Experiment wählen.');
      return;
    }
    if (!cryptoAvailable(cryptoObject)) {
      showStartError(
        'Web Crypto (crypto.getRandomValues) ist nicht verfügbar. Ohne echte Zufallsquelle startet kein Test.'
      );
      return;
    }
    if (countAnswers(state.stored) + experiment.n > MAX_ANSWERS) {
      showStartError(
        `Der lokale Speicher fasst ${MAX_ANSWERS} Antworten. Bitte zuerst alte Läufe exportieren und löschen.`
      );
      return;
    }
    state.busy = true;
    renderTest();
    try {
      rng = createCryptoRng(cryptoObject);
      const run = await createRun(experiment, { mode: 'test', batchId, rng, now });
      state.run = run;
      state.secrets.clear();
      state.selected = null;
      persist(run);
      await nextTrial();
      announce(`Lauf gestartet: ${experiment.title}. Ziel gezogen und verdeckt; Antwort noch nicht gesperrt.`);
    } catch (error) {
      showStartError(`Der Lauf konnte nicht gestartet werden: ${error.message}`);
      state.run = null;
    } finally {
      state.busy = false;
      renderTest();
    }
  };

  const nextTrial = async () => {
    if (!state.run) return;
    if (!rng) {
      if (!cryptoAvailable(cryptoObject)) throw new Error('Web Crypto ist nicht verfügbar');
      rng = createCryptoRng(cryptoObject);
    }
    const started = await beginTrial(state.run, { rng, now });
    state.run = started.run;
    state.secrets.set(secretKey(started.run.runId, started.secret.trialIndex), started.secret);
    state.selected = null;
    persist(state.run);
  };

  const next = async () => {
    if (state.busy || !state.run || state.run.status === 'complete') return;
    state.busy = true;
    renderTest();
    try {
      await nextTrial();
      renderTest();
      if (refs.question) refs.question.focus({ preventScroll: true });
      announce(`Versuch ${state.run.trials.length} von ${state.run.protocol.n}: Ziel gezogen und verdeckt.`);
    } catch (error) {
      showStartError(`Der nächste Versuch konnte nicht angelegt werden: ${error.message}`);
    } finally {
      state.busy = false;
      renderTest();
    }
  };

  const lockAndReveal = async () => {
    if (state.busy || !state.run || state.selected === null) return;
    const trial = currentTrial();
    if (!trial || trial.predictionLocked) return;
    const trialIndex = trial.index;
    state.busy = true;
    if (refs.lock) refs.lock.disabled = true;
    renderAnswers();
    try {
      state.run = lockPrediction(state.run, trialIndex, state.selected, { now });
      const written = persist(state.run);
      const verified = written ? verifyStored(storage, state.run.runId, trialIndex, { now }).ok : false;
      if (!verified) {
        storageNote(
          'Die gesperrte Antwort liegt nur im Arbeitsspeicher dieser Sitzung — der Lauf ist nicht dauerhaft gespeichert.',
          { alert: true }
        );
      }
      const secret = state.secrets.get(secretKey(state.run.runId, trialIndex));
      if (!secret) throw new Error('Das geheime Ziel dieser Sitzung fehlt; der Versuch lässt sich nicht enthüllen.');
      const revealed = await revealResult(state.run, trialIndex, secret, { now });
      state.run = revealed.run;
      state.secrets.delete(secretKey(state.run.runId, trialIndex));
      persist(state.run);
      announce(
        `${revealed.hit ? 'Treffer' : 'Kein Treffer'} in Versuch ${trialIndex} von ${state.run.protocol.n}. Antwort gesperrt und gespeichert.`
      );
      state.selected = null;
    } catch (error) {
      announce(`Die Antwort konnte nicht abgeschlossen werden: ${error.message}`);
    } finally {
      state.busy = false;
      renderTest();
    }
  };

  const resumeRun = (stored) => {
    if (state.busy) return;
    const last = stored.trials[stored.trials.length - 1];
    const broken = Boolean(last && last.predictionLocked && !last.resultRevealed);
    // Ein gezogenes, aber nie beantwortetes Ziel lässt sich nach einem Reload
    // nicht mehr enthüllen (das Salt lag nur im Arbeitsspeicher). Da keine
    // Antwort gesperrt wurde, wird dieser Versuch verworfen, statt den Lauf
    // unvollendbar zu machen. Gesperrte Antworten bleiben unberührt.
    const base =
      last && !last.predictionLocked ? { ...stored, status: 'running', trials: stored.trials.slice(0, -1) } : stored;
    state.run = base;
    state.secrets.clear();
    state.selected = null;
    state.stored = upsertRun(state.stored, base);
    if (last && !last.predictionLocked) persist(base);
    showStartError('');
    renderTest();
    if (broken) {
      announce('Dieser Lauf wurde zwischen Sperre und Enthüllung unterbrochen und ist nicht auswertbar.');
      return;
    }
    if (base.status === 'complete') {
      announce('Lauf ist bereits abgeschlossen. Auswertung und Export stehen bereit.');
      return;
    }
    next().catch((error) => announce(`Fortsetzen fehlgeschlagen: ${error.message}`));
  };

  const requestDelete = (runId, button) => {
    if (state.pendingDelete === runId) {
      finishDelete(runId);
      return;
    }
    state.pendingDelete = runId;
    if (state.deleteTimer) clearTimeout(state.deleteTimer);
    const original = button.textContent;
    button.textContent = 'Wirklich löschen?';
    button.dataset.armed = 'true';
    state.deleteTimer = setTimeout(() => {
      state.pendingDelete = null;
      button.textContent = original;
      delete button.dataset.armed;
    }, DELETE_CONFIRM_MS);
  };

  const finishDelete = (runId) => {
    const remaining = removeRun(state.stored, runId);
    const written = writeRuns(storage, remaining, { now });
    if (written.ok) state.stored = remaining;
    else state.stored = remaining;
    if (state.run && state.run.runId === runId) {
      state.run = null;
      state.selected = null;
      state.secrets.clear();
    }
    state.pendingDelete = null;
    if (state.deleteTimer) clearTimeout(state.deleteTimer);
    state.deleteTimer = null;
    storageNote(
      written.ok
        ? `Lauf gelöscht. ${state.stored.length} gespeicherte(r) Lauf/Läufe · ${countAnswers(state.stored)} von ${MAX_ANSWERS} Antworten belegt.`
        : `${written.message} Der Lauf ist in dieser Ansicht entfernt.`,
      { alert: !written.ok }
    );
    renderTest();
    announce('Der Lauf wurde gelöscht. Einzelne Antworten lassen sich nicht löschen, nur ganze Läufe.');
  };

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
    if (!state.run) return;
    const result = serializeEnvelope('experiment', [state.run], { now });
    if (!result.ok) {
      announce(`JSON-Export abgelehnt: ${result.errors[0] ? result.errors[0].message : 'Lauf ungültig'}`);
      return;
    }
    const filename = exportFileName('experiment', 'json', now());
    download(filename, new Blob([result.text], { type: 'application/json;charset=utf-8' }));
    announce(`Rohdaten exportiert: ${filename} (${state.run.trials.length} Versuche, ohne Salt).`);
  };

  const exportCsv = () => {
    if (!state.run) return;
    const revealed = state.run.trials.filter((trial) => trial.resultRevealed).length;
    if (revealed === 0) {
      announce('CSV-Export erst nach dem ersten enthüllten Versuch — ohne Ziel gibt es keine Rohdaten.');
      return;
    }
    const filename = exportFileName('experiment', 'csv', now());
    download(filename, new Blob([runsToCsv([state.run])], { type: 'text/csv;charset=utf-8' }));
    announce(`Rohdaten exportiert: ${filename} (${revealed} enthüllte Versuche).`);
  };

  // --- Ereignisse --------------------------------------------------------

  const handlers = [];
  const on = (element, type, handler) => {
    if (!element) return;
    element.addEventListener(type, handler);
    handlers.push([element, type, handler]);
  };

  for (const input of refs.modeInputs) {
    on(input, 'change', () => {
      if (!input.checked) return;
      state.mode = input.value === 'demo' ? 'demo' : 'test';
      for (const panel of refs.panels) panel.hidden = panel.dataset.expPanel !== state.mode;
      if (state.mode === 'demo') {
        renderDemo();
        announce('Spielmodus: Antworten zählen nicht zur Statistik und werden nicht gespeichert.');
        if (refs.demoType) refs.demoType.focus({ preventScroll: true });
      } else {
        renderTest();
        announce(
          state.run
            ? 'Testmodus: Der begonnene Lauf bleibt erhalten; es wurde kein Versuch gezählt oder verändert.'
            : 'Testmodus: Protokoll wählen und Lauf starten.'
        );
        if (refs.start) refs.start.focus({ preventScroll: true });
      }
    });
  }

  for (const input of refs.experimentInputs) {
    on(input, 'change', () => {
      if (!input.checked) return;
      showStartError('');
      renderProtocols();
    });
  }

  on(refs.start, 'click', startRun);
  on(refs.lock, 'click', lockAndReveal);
  on(refs.next, 'click', next);
  on(refs.exportJson, 'click', exportJson);
  on(refs.exportCsv, 'click', exportCsv);
  on(refs.deleteRun, 'click', () => {
    if (state.run) requestDelete(state.run.runId, refs.deleteRun);
  });
  on(refs.demoType, 'change', () => {
    state.demo.type = refs.demoType.value;
    state.demo.trials = 0;
    state.demo.hits = 0;
    announce('Testart gewechselt. Der Spielstand beginnt bei null und wird nicht ausgewertet.');
    renderDemo();
  });
  on(refs.demoReset, 'click', () => {
    state.demo.trials = 0;
    state.demo.hits = 0;
    announce('Spielstand zurückgesetzt.');
    renderDemo();
  });

  loadStored();
  renderDemo();
  renderTest();

  return {
    destroy() {
      for (const [element, type, handler] of handlers) element.removeEventListener(type, handler);
      handlers.length = 0;
      if (state.deleteTimer) clearTimeout(state.deleteTimer);
      state.deleteTimer = null;
      state.secrets.clear();
      state.run = null;
    },
    get run() {
      return state.run;
    },
    get mode() {
      return state.mode;
    },
    get storedRuns() {
      return state.stored.slice();
    },
  };
}
