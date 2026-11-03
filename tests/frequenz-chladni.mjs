// Modelltests der Chladni-Ansicht (P9, ADR-Nachtrag §13).
//
// Geprüft werden die Eigenschaften, die das Modell behauptet: Antisymmetrie,
// Spiegelsymmetrie, Normierung, die analytisch bekannten Nulldurchgänge der
// Mittelachsen und die Lage der Knotenlinien. Kein Browser nötig.
//
// Node behandelt .js in diesem Paket als CommonJS; das Modul wird deshalb –
// wie in tests/frequenz-engine.mjs – in ein temporäres Verzeichnis mit eigener
// package.json ("type":"module") kopiert.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let tmp;
let chladni;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frequenz-chladni-'));
  fs.mkdirSync(path.join(tmp, 'js/modules'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }));
  fs.copyFileSync(path.join(root, 'js/modules/frequenz-chladni.js'), path.join(tmp, 'js/modules/frequenz-chladni.js'));
  chladni = await import(pathToFileURL(path.join(tmp, 'js/modules/frequenz-chladni.js')).href);
});

after(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('C1: gültige Moden werden akzeptiert, entartete und ungültige abgelehnt', () => {
  assert.deepEqual({ ...chladni.assertMode(2, 3) }, { n: 2, m: 3 });
  assert.equal(chladni.isValidMode(1, 12), true);
  assert.equal(chladni.isValidMode(2, 2), false, 'n = m ist entartet');
  assert.equal(chladni.isValidMode(0, 3), false);
  assert.equal(chladni.isValidMode(13, 2), false);
  assert.equal(chladni.isValidMode(2.5, 3), false);
  assert.throws(() => chladni.assertMode(3, 3), /entartet/);
  assert.throws(() => chladni.assertMode(0, 1), /zwischen 1 und 12/);
});

test('C2: das Feld ist punktsymmetrisch und 180°-drehsymmetrisch', () => {
  const n = 3;
  const m = 5;
  for (const [u, v] of [
    [0.1, 0.27],
    [0.42, 0.63],
    [0.77, 0.15],
  ]) {
    const forward = chladni.modeValue(n, m, u, v);
    assert.ok(Math.abs(forward + chladni.modeValue(n, m, v, u)) < 1e-12, 'f(v,u) = −f(u,v)');
    assert.ok(Math.abs(Math.abs(forward) - Math.abs(chladni.modeValue(n, m, 1 - u, 1 - v))) < 1e-12);
  }
});

test('C3: gleiche Parität ist spiegelsymmetrisch, ungleiche nicht', () => {
  assert.equal(chladni.modeSymmetry(2, 4).mirrorSymmetric, true);
  assert.equal(chladni.modeSymmetry(3, 5).mirrorSymmetric, true);
  assert.equal(chladni.modeSymmetry(2, 3).mirrorSymmetric, false);
  // Spiegelung an der Mittelachse: f(1−u,v) = ±f(u,v) nur bei gleicher Parität.
  const near = chladni.modeValue(2, 4, 0.1, 0.3);
  assert.ok(Math.abs(near - chladni.modeValue(2, 4, 0.9, 0.3)) < 1e-12);
  assert.ok(Math.abs(chladni.modeValue(2, 3, 0.1, 0.3) - chladni.modeValue(2, 3, 0.9, 0.3)) > 0.01);
});

test('C4: das Feld ist auf sein Maximum normiert und vollständig', () => {
  const field = chladni.buildField(2, 3, 60);
  assert.equal(field.size, 61);
  assert.equal(field.values.length, 61 * 61);
  const peak = field.values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  assert.ok(Math.abs(peak - 1) < 1e-9, `Maximum ${peak}`);
  assert.ok(field.range > 0);
});

test('C5: Nulldurchgänge der Mittelachsen stimmen mit der Analytik überein', () => {
  // n gerade, m ungerade: cos(mπ/2) = 0 → f(u, ½) = ∓cos(mπu) → m Nullstellen.
  assert.deepEqual(
    { ...chladni.midlineCrossings(2, 3) },
    { horizontal: 3, vertical: 3, horizontalIsNodeLine: false, verticalIsNodeLine: false }
  );
  assert.deepEqual(
    { ...chladni.midlineCrossings(4, 7) },
    { horizontal: 7, vertical: 7, horizontalIsNodeLine: false, verticalIsNodeLine: false }
  );
  // Beide ungerade: die Mittelachsen liegen vollständig auf Knotenlinien.
  const odd = chladni.midlineCrossings(3, 5);
  assert.equal(odd.horizontalIsNodeLine, true);
  assert.equal(odd.verticalIsNodeLine, true);
  assert.equal(odd.horizontal, 0);
});

test('C6: die textliche Entsprechung nennt Moden, nicht Frequenzen', () => {
  const description = chladni.describeMode(2, 3);
  assert.match(description.label, /Modus n = 2, m = 3/);
  assert.match(description.text, /Nulldurchgänge auf der waagerechten Mittelachse/);
  assert.match(description.text, /spiegelsymmetrisch/);
  assert.doesNotMatch(description.text, /\bHz\b/, 'keine Frequenzaussage im Text');
  assert.match(chladni.describeMode(3, 5).text, /vollständig auf einer Knotenlinie/);
});

test('C7: Knotenlinien liegen auf dem Nullniveau und im Einheitsquadrat', () => {
  const field = chladni.buildField(2, 3, 160);
  const segments = chladni.nodeSegments(field);
  assert.ok(segments.length > 200, `nur ${segments.length} Strecken`);
  const valueAt = (x, y) => {
    const i = Math.min(field.cells, Math.round(x * field.cells));
    const j = Math.min(field.cells, Math.round(y * field.cells));
    return Math.abs(field.values[j * field.size + i]);
  };
  for (const segment of segments) {
    for (const [x, y] of [
      [segment.x1, segment.y1],
      [segment.x2, segment.y2],
    ]) {
      assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `Koordinate ${x}/${y}`);
      assert.ok(valueAt(x, y) < 0.02, `Knotenlinie bei ${x}/${y} hat Wert ${valueAt(x, y)}`);
    }
  }
});

test('C8: das Modul nennt keine Frequenzzuordnung und keine Wirkaussage', () => {
  assert.equal(chladni.CHLADNI_MODEL_ID, 'rect-free-edge-difference-v1');
  assert.doesNotMatch(chladni.CHLADNI_MODEL_LABEL, /Hz|Frequenz/);
  assert.equal(typeof chladni.buildField, 'function');
  // Ein Modus ohne Frequenzbezug: die Feldfunktion hat nur n, m, u, v.
  assert.equal(chladni.modeValue.length, 4);
});
