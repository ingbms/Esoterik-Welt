// Chladni-Muster als idealisiertes Modell (P9, ADR-Nachtrag §13).
//
// Modellfamilie: f(u, v) = cos(nπu)·cos(mπv) − cos(mπu)·cos(nπv) auf dem
// Einheitsquadrat. Das ist die verbreitete Näherung für die Knotenlinien
// frei schwingender quadratischer Platten; sie beschreibt die FORM einer
// Mode, nicht ihre Frequenz.
//
// Bewusste Grenzen (fachlich verbindlich):
//  - Die Funktion ist kein Eigenwertlöser. Sie liefert keine Frequenz zu einer
//    Mode; Material, Dicke, Halterung und Plattengröße gehen nicht ein.
//  - Deshalb gibt es hier keine Zuordnung „Frequenz X → Muster Y“. Die
//    Oberfläche lässt ausschließlich die Modenzahlen n und m wählen.
//  - n = m ist in dieser Differenzform entartet (f ≡ 0) und wird abgelehnt.
//
// Das Modul ist DOM-frei und ohne Browser-API testbar (tests/frequenz-chladni.mjs).

/** Kennung des Modells; wird in Doku, UI und Tests gemeinsam verwendet. */
export const CHLADNI_MODEL_ID = 'rect-free-edge-difference-v1';

/** Menschenlesbare Kurzbezeichnung des Modells. */
export const CHLADNI_MODEL_LABEL = 'idealisiertes Rechteckmodell, freie Ränder (Differenzform)';

export const MIN_MODE = 1;
export const MAX_MODE = 12;

export const DEFAULT_MODE_A = Object.freeze({ n: 2, m: 3 });
export const DEFAULT_MODE_B = Object.freeze({ n: 3, m: 4 });

/** Ganzzahlig, im erlaubten Bereich und nicht entartet. */
export function isValidMode(n, m) {
  const integer = (value) => Number.isInteger(value) && value >= MIN_MODE && value <= MAX_MODE;
  return integer(n) && integer(m) && n !== m;
}

/**
 * Prüft eine Mode und wirft bei Verstoß einen RangeError mit deutschem Text.
 * Der Text ist für die Oberfläche gedacht und nennt den Grund.
 */
export function assertMode(n, m) {
  if (!Number.isInteger(n) || !Number.isInteger(m)) {
    throw new RangeError('Die Modenzahlen n und m müssen ganze Zahlen sein.');
  }
  if (n < MIN_MODE || n > MAX_MODE || m < MIN_MODE || m > MAX_MODE) {
    throw new RangeError(`Die Modenzahlen liegen zwischen ${MIN_MODE} und ${MAX_MODE}.`);
  }
  if (n === m) {
    throw new RangeError('n = m ist in dieser Modellfamilie entartet: das Feld ist überall null.');
  }
  return Object.freeze({ n, m });
}

/** Feldwert an der Stelle (u, v) im Einheitsquadrat. */
export function modeValue(n, m, u, v) {
  const nu = Math.PI * n * u;
  const mv = Math.PI * m * v;
  const mu = Math.PI * m * u;
  const nv = Math.PI * n * v;
  return Math.cos(nu) * Math.cos(mv) - Math.cos(mu) * Math.cos(nv);
}

/**
 * Abtastung des Feldes auf einem (resolution+1)²-Raster.
 * `values` ist auf das Maximum normiert, damit die Darstellung unabhängig von
 * n und m vergleichbar bleibt. `range` nennt das unnormierte Maximum.
 */
export function buildField(n, m, resolution = 200) {
  assertMode(n, m);
  const cells = Math.max(2, Math.min(600, Math.floor(resolution)));
  const size = cells + 1;
  const values = new Float32Array(size * size);
  let peak = 0;
  for (let j = 0; j < size; j += 1) {
    const v = j / cells;
    for (let i = 0; i < size; i += 1) {
      const value = modeValue(n, m, i / cells, v);
      if (Math.abs(value) > peak) peak = Math.abs(value);
      values[j * size + i] = value;
    }
  }
  const norm = peak > 0 ? peak : 1;
  for (let index = 0; index < values.length; index += 1) values[index] /= norm;
  return Object.freeze({ n, m, cells, size, values, range: peak });
}

/**
 * Nulldurchgänge entlang der beiden Mittelachsen. Sind beide Modenzahlen
 * ungerade, liegt die gesamte Mittelachse auf einer Knotenlinie; dann ist
 * `…IsNodeLined` true und die Zählung 0.
 */
export function midlineCrossings(n, m, steps = 2048) {
  assertMode(n, m);
  const count = (sample) => {
    let crossings = 0;
    let previous = 0;
    let zerosOnly = true;
    for (let index = 0; index <= steps; index += 1) {
      const value = sample(index / steps);
      if (Math.abs(value) < 1e-12) continue;
      zerosOnly = false;
      const sign = value > 0 ? 1 : -1;
      if (previous !== 0 && sign !== previous) crossings += 1;
      previous = sign;
    }
    return { crossings, zerosOnly };
  };
  const horizontal = count((u) => modeValue(n, m, u, 0.5));
  const vertical = count((v) => modeValue(n, m, 0.5, v));
  return Object.freeze({
    horizontal: horizontal.crossings,
    vertical: vertical.crossings,
    horizontalIsNodeLine: horizontal.zerosOnly,
    verticalIsNodeLine: vertical.zerosOnly,
  });
}

/**
 * Symmetrieeigenschaften der Modellfamilie. Sie folgen aus
 * f(1−u, v) = (−1)^n cos(nπu)cos(mπv) − (−1)^m cos(mπu)cos(nπv):
 * bei gleicher Parität ist das Bild spiegelsymmetrisch, sonst nur
 * punktsymmetrisch. Die 180°-Drehung erhält das Bild immer.
 */
export function modeSymmetry(n, m) {
  assertMode(n, m);
  const sameParity = n % 2 === m % 2;
  return Object.freeze({
    mirrorSymmetric: sameParity,
    rotationSymmetric: true,
    label: sameParity
      ? 'spiegelsymmetrisch zu beiden Mittelachsen und 180°-drehsymmetrisch'
      : 'nicht spiegelsymmetrisch, aber 180°-drehsymmetrisch',
  });
}

/**
 * Textliche Entsprechung des Bildes für die Oberfläche (NFR-16: das Canvas ist
 * dekorativ, die Information steht im DOM). Die Zahlen sind gemessen, nicht
 * behauptet.
 */
export function describeMode(n, m) {
  assertMode(n, m);
  const symmetry = modeSymmetry(n, m);
  const midline = midlineCrossings(n, m);
  const axis = (isNodeLine, crossings, name) =>
    isNodeLine
      ? `die ${name} Mittelachse liegt vollständig auf einer Knotenlinie`
      : `${crossings} Nulldurchgänge auf der ${name}en Mittelachse`;
  return Object.freeze({
    n,
    m,
    symmetry,
    midline,
    label: `Modus n = ${n}, m = ${m}`,
    text: `Modus n = ${n}, m = ${m}: ${axis(midline.horizontalIsNodeLine, midline.horizontal, 'waagerecht')}, ${axis(
      midline.verticalIsNodeLine,
      midline.vertical,
      'senkrecht'
    )}; ${symmetry.label}.`,
  });
}

/**
 * Knotenlinien als Strecken im Einheitsquadrat (Marching Squares auf dem
 * Feld, Schwelle 0). Rückgabe ist eine flache Liste von Strecken
 * { x1, y1, x2, y2 } in Einheitskoordinaten; Zellen mit vier Schnittpunkten
 * werden paarweise verbunden (Sattelfall, für die Darstellung ausreichend).
 */
export function nodeSegments(field) {
  const { cells, size, values } = field;
  const segments = [];
  const at = (i, j) => values[j * size + i];
  for (let j = 0; j < cells; j += 1) {
    for (let i = 0; i < cells; i += 1) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const c = at(i + 1, j + 1);
      const d = at(i, j + 1);
      const points = [];
      if (a < 0 !== b < 0) points.push([i + a / (a - b), j]);
      if (b < 0 !== c < 0) points.push([i + 1, j + b / (b - c)]);
      if (d < 0 !== c < 0) points.push([i + d / (d - c), j + 1]);
      if (a < 0 !== d < 0) points.push([i, j + a / (a - d)]);
      for (let index = 0; index + 1 < points.length; index += 2) {
        segments.push({
          x1: points[index][0] / cells,
          y1: points[index][1] / cells,
          x2: points[index + 1][0] / cells,
          y2: points[index + 1][1] / cells,
        });
      }
    }
  }
  return segments;
}
