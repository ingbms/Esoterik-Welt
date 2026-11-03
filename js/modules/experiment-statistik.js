// Experimentierlabor (RAD-09) — Statistik und Auswertung ohne DOM.
//
// Dieses Modul enthält die gesamte Mathematik des Labors und ist damit ohne
// Browser prüfbar (tests/experiment-statistik.mjs). Es kennt weder DOM noch
// Speicher und trifft keine Annahmen über die Oberfläche.
//
// Verfahren (vor dem Start im Protokoll festgelegt, nicht nachträglich wählbar):
//   * Basiswahrscheinlichkeit p = 1/k bei k gleich wahrscheinlichen Zielen,
//   * Trefferzahl h, Erwartung n/k,
//   * exakter zweiseitiger Binomialtest: Summe der Wahrscheinlichkeiten aller
//     Ausgänge i mit P(X=i) <= P(X=h); keine Normalapproximation,
//   * Wilson-95-%-Intervall für den Anteil h/n (ohne Stetigkeitskorrektur).
//
// Die Zahlen sind bewusst konservativ: Ein p-Wert über 0,05 ist kein Beweis
// für Unfähigkeit, ein p-Wert darunter ist kein Nachweis einer Fähigkeit.

export const STATISTIK_SCHEMA = 'esow.experiment-statistik/1';

/** Zweiseitiges 95-%-Quantil der Standardnormalverteilung. */
export const Z_95 = 1.959963984540054;

/** Feste Entscheidungsschwelle; steht im Protokoll und wird nicht angepasst. */
export const ALPHA = 0.05;

/** Grenzen des Protokollvertrags (RAD-03): Zielraum und geplante Fallzahl. */
export const TRIAL_LIMITS = { minK: 2, maxK: 10, minN: 10, maxN: 200 };

const LOG_FACTORIAL = (() => {
  const table = [0];
  for (let index = 1; index <= 400; index += 1) table[index] = table[index - 1] + Math.log(index);
  return table;
})();

function logFactorial(value) {
  if (!Number.isInteger(value) || value < 0) throw new RangeError('logFactorial erwartet eine ganze Zahl >= 0');
  if (value < LOG_FACTORIAL.length) return LOG_FACTORIAL[value];
  let sum = LOG_FACTORIAL[LOG_FACTORIAL.length - 1];
  for (let index = LOG_FACTORIAL.length; index <= value; index += 1) sum += Math.log(index);
  return sum;
}

function assertCounts(hits, n, k) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n muss eine ganze Zahl >= 0 sein');
  if (!Number.isInteger(hits) || hits < 0 || hits > n)
    throw new RangeError('h muss eine ganze Zahl zwischen 0 und n sein');
  if (!Number.isInteger(k) || k < TRIAL_LIMITS.minK || k > TRIAL_LIMITS.maxK) {
    throw new RangeError(`k muss eine ganze Zahl zwischen ${TRIAL_LIMITS.minK} und ${TRIAL_LIMITS.maxK} sein`);
  }
}

/** Wahrscheinlichkeitsfunktion der Binomialverteilung, über Logarithmen stabil. */
export function binomialPmf(hits, n, p) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n muss eine ganze Zahl >= 0 sein');
  if (!Number.isInteger(hits) || hits < 0 || hits > n)
    throw new RangeError('h muss eine ganze Zahl zwischen 0 und n sein');
  if (!(p >= 0) || !(p <= 1) || !Number.isFinite(p)) throw new RangeError('p muss in [0,1] liegen');
  if (p === 0) return hits === 0 ? 1 : 0;
  if (p === 1) return hits === n ? 1 : 0;
  const logPmf =
    logFactorial(n) - logFactorial(hits) - logFactorial(n - hits) + hits * Math.log(p) + (n - hits) * Math.log1p(-p);
  return Math.min(1, Math.exp(logPmf));
}

/**
 * Exakter zweiseitiger Binomialtest.
 *
 * Definition (steht so im Protokoll): p-Wert = Summe von P(X = i) über alle
 * i mit P(X = i) <= P(X = h), gekappt bei 1. Diese "Methode der kleinen
 * p-Werte" ist bei p = 0,5 exakt symmetrisch und benötigt keine
 * Normalapproximation. Die relative Toleranz von 1e-9 fängt Rundungsfehler
 * der Logarithmen ein, damit spiegelbildliche Ausgänge nicht herausfallen.
 */
export function binomialExactTwoSided(hits, n, p) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n muss eine ganze Zahl >= 0 sein');
  if (!Number.isInteger(hits) || hits < 0 || hits > n)
    throw new RangeError('h muss eine ganze Zahl zwischen 0 und n sein');
  if (!(p > 0) || !(p < 1) || !Number.isFinite(p)) {
    throw new RangeError('p muss echt zwischen 0 und 1 liegen');
  }
  if (n === 0) return 1;
  const observed = binomialPmf(hits, n, p);
  const threshold = observed * (1 + 1e-9);
  let total = 0;
  for (let index = 0; index <= n; index += 1) {
    const probability = binomialPmf(index, n, p);
    if (probability <= threshold) total += probability;
  }
  return Math.min(1, total);
}

/** Wilson-Score-Intervall für einen Anteil; Grenzen werden auf [0,1] gekappt. */
export function wilsonInterval(hits, n, z = Z_95) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n muss eine ganze Zahl >= 0 sein');
  if (!Number.isInteger(hits) || hits < 0 || hits > n)
    throw new RangeError('h muss eine ganze Zahl zwischen 0 und n sein');
  if (!(z > 0) || !Number.isFinite(z)) throw new RangeError('z muss eine positive Zahl sein');
  if (n === 0) return { low: 0, high: 1, confidence: 0.95, method: 'wilson' };
  const rate = hits / n;
  const denominator = 1 + (z * z) / n;
  const centre = (rate + (z * z) / (2 * n)) / denominator;
  const half = (z / denominator) * Math.sqrt((rate * (1 - rate)) / n + (z * z) / (4 * n * n));
  return {
    low: Math.max(0, centre - half),
    high: Math.min(1, centre + half),
    confidence: 0.95,
    method: 'wilson',
  };
}

/**
 * Wertet Trefferzahlen aus. k ist der Zielraum des Protokolls; p = 1/k ist
 * keine freie Wahl, sondern folgt aus der Anzahl gleich wahrscheinlicher Ziele.
 */
export function analyseCounts(hits, n, k) {
  assertCounts(hits, n, k);
  const baseProbability = 1 / k;
  const expected = n / k;
  const interval = wilsonInterval(hits, n);
  const pValue = n === 0 ? 1 : binomialExactTwoSided(hits, n, baseProbability);
  return {
    schema: STATISTIK_SCHEMA,
    hits,
    n,
    k,
    baseProbability,
    expected,
    expectedRounded: Math.round(expected * 100) / 100,
    hitRate: n === 0 ? 0 : hits / n,
    pValue,
    alpha: ALPHA,
    meetsAlpha: n > 0 && pValue < ALPHA,
    interval,
    method: 'binomial-exact + wilson-95',
  };
}

/** Liest die enthüllten Versuche eines Laufs und liefert die Auswertung. */
export function analyseRun(run) {
  if (!run || !Array.isArray(run.trials) || !run.protocol) throw new TypeError('analyseRun erwartet einen Lauf');
  const protocol = run.protocol;
  const revealed = run.trials.filter((trial) => trial.resultRevealed);
  const hits = revealed.filter((trial) => trial.resultRevealed.hit).length;
  const analysis = analyseCounts(hits, revealed.length, protocol.k);
  return {
    ...analysis,
    runId: run.runId,
    experimentId: run.experimentId,
    planned: protocol.n,
    started: run.trials.length,
    revealed: revealed.length,
    complete: revealed.length === protocol.n,
    status: run.status,
    testType: protocol.testType,
    stopRule: protocol.stopRule,
    analysisMethods: [...protocol.analysis],
  };
}

/** Flache Zeilen für Tabelle und CSV — nur enthüllte Versuche enthalten ein Ziel. */
export function trialRows(run) {
  if (!run || !Array.isArray(run.trials)) throw new TypeError('trialRows erwartet einen Lauf');
  return run.trials.map((trial) => ({
    index: trial.index,
    answerIndex: trial.predictionLocked ? trial.predictionLocked.answerIndex : null,
    lockedAt: trial.predictionLocked ? trial.predictionLocked.lockedAt : '',
    targetIndex: trial.resultRevealed ? trial.resultRevealed.targetIndex : null,
    hit: trial.resultRevealed ? trial.resultRevealed.hit : null,
    revealedAt: trial.resultRevealed ? trial.resultRevealed.revealedAt : '',
  }));
}

// --- Beschriftungen -------------------------------------------------------
// Eine Quelle für Anzeige und Export: Die Antwortindizes des Laufs bleiben
// Zahlen; nur die Oberfläche und der CSV-Export übersetzen sie in Wörter.

const TEST_TYPE_LABELS = {
  jaNein: 'Ja/Nein',
  richtung: 'Ortung (acht Orte)',
  zahl: 'Zahlen',
  symbol: 'Symbole',
};

export function testTypeLabel(testType) {
  return TEST_TYPE_LABELS[testType] || 'Unbekannte Testart';
}

export function answerLabels(testType, k) {
  if (!Number.isInteger(k) || k < 1) throw new RangeError('k muss eine ganze Zahl >= 1 sein');
  const labels =
    testType === 'jaNein'
      ? ['Ja', 'Nein']
      : testType === 'zahl'
        ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        : testType === 'richtung'
          ? ['Ort 1', 'Ort 2', 'Ort 3', 'Ort 4', 'Ort 5', 'Ort 6', 'Ort 7', 'Ort 8']
          : Array.from({ length: 10 }, (_, index) => `Ziel ${index + 1}`);
  return labels.slice(0, k).map((label, index) => label || `Ziel ${index + 1}`);
}

// --- Formatierung ---------------------------------------------------------

const decimal = (digits) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** 0,75 → "75,0 %" (deutsche Schreibweise, eine Nachkommastelle). */
export function formatPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return '—';
  return `${decimal(digits).format(value * 100)} %`;
}

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return decimal(digits).format(value);
}

/** p auf vier Nachkommastellen; sehr kleine Werte werden nicht auf 0 gerundet. */
export function formatPValue(p) {
  if (!Number.isFinite(p) || p < 0) return '—';
  if (p < 0.0001) return 'p < 0,0001';
  return `p = ${decimal(4).format(p)}`;
}

export function formatInterval(interval) {
  if (!interval) return '—';
  return `${formatPercent(interval.low)} bis ${formatPercent(interval.high)}`;
}

/**
 * Einordnung in Worten. Bewusst zurückhaltend: Die Aussage bezieht sich nur
 * auf diesen Lauf, nicht auf die Fähigkeit einer Person.
 */
export function interpretation(analysis) {
  if (!analysis || !Number.isInteger(analysis.n)) throw new TypeError('interpretation erwartet eine Auswertung');
  if (analysis.n === 0) {
    return {
      level: 'leer',
      headline: 'Noch keine auswertbaren Versuche',
      text: 'Sobald der erste Versuch enthüllt ist, erscheinen Trefferzahl, Zufallserwartung und Intervall. Eine abschließende Aussage gibt es erst nach der vorab festgelegten Fallzahl.',
    };
  }
  const base = `${analysis.hits} von ${analysis.n} Treffern bei einer Erwartung von ${formatNumber(
    analysis.expected,
    2
  )} (${formatPercent(analysis.baseProbability)} je Versuch).`;
  if (analysis.complete === false) {
    return {
      level: 'zwischenstand',
      headline: `Zwischenstand: Versuch ${analysis.revealed} von ${analysis.planned}`,
      text: `${base} Das ist keine Auswertung: Die Fallzahl steht vor dem Start fest, ein Zwischenstand darf die Abbruchentscheidung nicht beeinflussen.`,
    };
  }
  const interval = `95-%-Wilson-Intervall für die Trefferquote: ${formatInterval(analysis.interval)}.`;
  if (analysis.meetsAlpha) {
    // Der Test ist zweiseitig: Auch eine Trefferzahl unter der Erwartung ist
    // auffällig. Die Formulierung muss die Richtung nennen, sonst behauptet
    // sie bei 5 von 20 Treffern fälschlich einen Überschuss.
    const direction =
      analysis.hits > analysis.expected ? 'über' : analysis.hits < analysis.expected ? 'unter' : 'genau auf';
    return {
      level: 'auffaellig',
      headline: `${direction === 'unter' ? 'Unter' : direction === 'über' ? 'Über' : 'Auf'} der Zufallserwartung — auffällig, aber kein Nachweis`,
      text: `${base} ${formatPValue(analysis.pValue)} im exakten zweiseitigen Binomialtest (Schwelle 0,05). ${interval} Die Trefferzahl liegt ${direction} der Erwartung; der Test prüft in beide Richtungen. Ein einzelner Lauf mit dieser Schwelle täuscht in etwa jedem 20. Fall; wer mehrere Läufe macht und den besten zeigt, erhöht diese Rate deutlich. Das bleibt ein Hinweis, kein Nachweis einer Fähigkeit.`,
    };
  }
  return {
    level: 'vereinbar',
    headline: 'Mit der Zufallserwartung vereinbar',
    text: `${base} ${formatPValue(analysis.pValue)} im exakten zweiseitigen Binomialtest (Schwelle 0,05). ${interval} Das ist kein Beweis, dass niemand etwas kann: Es zeigt nur, dass in dieser Prüfung kein Unterschied zum Zufall sichtbar wurde.`,
  };
}

/**
 * Mehrfachtest-Hinweis. Keine automatische Alpha-Korrektur: Das Modul
 * protokolliert die Läufe, es entscheidet nicht, welcher „zählt“.
 */
export function multipleTestingNote({ plannedRuns = 0, storedRuns = 0, batchRuns = 0 } = {}) {
  const runs = Math.max(plannedRuns, storedRuns, batchRuns);
  if (runs <= 1) {
    return 'Dies ist ein einzelner Lauf. Auch ein einzelner Lauf mit p unter 0,05 ist nur ein Hinweis: Bei einer Schwelle von 5 % ist etwa jeder zwanzigste reine Zufallslauf auffällig.';
  }
  return `Es sind ${runs} Läufe bekannt (Speicher und Sitzung zusammengezählt). Wer mehrere Läufe durchführt und nur den auffälligsten zeigt, vervielfacht die Fehlerrate; dieses Modul korrigiert dafür nicht. Eine Korrektur müsste vor der Auswertung festgelegt sein — nachträglich ist sie wertlos.`;
}

// --- CSV-Export -----------------------------------------------------------
// Vertrag §7.1: UTF-8 mit BOM, Trenner ";", Quoting nach RFC 4180, CRLF.

const CSV_HEADER = [
  'Lauf',
  'Experiment',
  'Modus',
  'Basiswahrscheinlichkeit',
  'Versuch',
  'Antwort',
  'Antwortindex',
  'Ziel',
  'Zielindex',
  'Treffer',
  'Gesperrt am',
  'Enthüllt am',
];

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvNumber(value) {
  return Number.isFinite(value) ? String(value).replace('.', ',') : '';
}

/**
 * Rohdatenexport aller übergebenen Läufe, eine Zeile je enthülltem Versuch.
 * Nicht enthüllte Versuche erscheinen ohne Ziel — ein Ziel gibt es im Export
 * erst nach der Enthüllung.
 */
export function runsToCsv(runs) {
  if (!Array.isArray(runs)) throw new TypeError('runsToCsv erwartet ein Array von Läufen');
  const lines = [CSV_HEADER.map(csvCell).join(';')];
  for (const run of runs) {
    const labels = answerLabels(run.protocol.testType, run.protocol.k);
    for (const row of trialRows(run)) {
      lines.push(
        [
          run.runId,
          run.experimentId,
          run.mode,
          csvNumber(run.protocol.baseProbability),
          row.index,
          row.answerIndex === null ? '' : labels[row.answerIndex],
          row.answerIndex === null ? '' : row.answerIndex,
          row.targetIndex === null ? '' : labels[row.targetIndex],
          row.targetIndex === null ? '' : row.targetIndex,
          row.hit === null ? '' : row.hit ? 'ja' : 'nein',
          row.lockedAt,
          row.revealedAt,
        ]
          .map(csvCell)
          .join(';')
      );
    }
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** Dateiname nach Vertrag §7.2: radiasthesie-<kind>-<YYYY-MM-DD>.<ext>. */
export function exportFileName(kind, extension, date = new Date()) {
  const iso = date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
  return `radiasthesie-${kind}-${iso.slice(0, 10)}.${extension}`;
}
