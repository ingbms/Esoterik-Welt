// Pendeltafel-Studio (RAD-08) — deterministische Tests ohne Browser.
//
// Geprüft werden:
//   * Vorlagen, Segmentgeometrie und Schriftgrößen,
//   * die vollständige Prüfung importierter Konfigurationen (Schema, Größe,
//     Zeichenlängen, Steuerzeichen, Markup),
//   * Escaping und Unbedenklichkeit der SVG-Ausgabe (kein Skript, kein
//     Eventhandler, keine externe Referenz),
//   * Export → Reimport → gleiche Zeichnung,
//   * Route, Ansicht und Werkstatt-Karte,
//   * Kontraste der Farbstile und die Druckregeln des Stylesheets.
//
// Das Modul ist reines ESM (js/package.json: type=module) und wird direkt
// importiert — kein Kopieren in ein temporäres Verzeichnis nötig.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BOARD_GEOMETRY,
  BOARD_LIMITS,
  BOARD_PRESETS,
  BOARD_SCHEMA,
  PALETTES,
  PALETTE_IDS,
  PRESET_IDS,
  BoardValidationError,
  buildSvg,
  chordFor,
  contrastRatio,
  defaultConfigForPreset,
  escapeXml,
  fileStem,
  labelFontSize,
  labelRadiusFor,
  layoutBoard,
  maxLabelLengthFor,
  parseBoardJson,
  presetById,
  serializeBoard,
  validateBoard,
} from '../js/modules/pendeltafel-model.js';
import { ROUTE } from '../js/modules/radiasthesie-format.js';
import { createModel } from '../js/modules/radiasthesie-model.js';
import { renderLanding, renderStudio } from '../js/modules/radiasthesie-views.js';
import RADIASTHESIE from '../js/data/radiasthesie.js';

const model = createModel(RADIASTHESIE);
const valid = (overrides = {}) => ({
  schema: BOARD_SCHEMA,
  preset: 'janain',
  title: 'Ja/Nein-Tafel',
  palette: 'messing',
  labels: ['JA', 'NEIN'],
  ...overrides,
});

// --- Vorlagen und Geometrie ------------------------------------------------

test('sechs Vorlagen mit erwarteten Segmentzahlen und Beschriftungen', () => {
  const counts = Object.fromEntries(BOARD_PRESETS.map((preset) => [preset.id, preset.labels.length]));
  assert.deepEqual(counts, {
    janain: 2,
    zahlenkreis: 10,
    buchstaben: 26,
    segmente4: 4,
    segmente6: 6,
    segmente12: 12,
  });
  assert.deepEqual([...presetById('janain').labels], ['JA', 'NEIN']);
  assert.deepEqual([...presetById('segmente12').labels].slice(0, 3), ['1', '2', '3']);
  assert.equal(presetById('gibtsnicht'), null);
});

test('Standardkonfiguration ist eingefroren und schema-konform', () => {
  const config = defaultConfigForPreset('zahlenkreis', 'salbei');
  assert.equal(config.schema, BOARD_SCHEMA);
  assert.equal(config.palette, 'salbei');
  assert.equal(config.labels.length, 10);
  assert.ok(Object.isFrozen(config));
  assert.ok(Object.isFrozen(config.labels));
  assert.ok(validateBoard(config).ok);
  // Unbekannte Palette fällt auf Messing zurück, statt eine fremde Farbe zu erfinden.
  assert.equal(defaultConfigForPreset('janain', 'neonpink').palette, 'messing');
});

test('Ja/Nein-Tafel: JA links, NEIN rechts, gleiche Winkel', () => {
  const layout = layoutBoard(defaultConfigForPreset('janain'));
  assert.equal(layout.segments, 2);
  const [ja, nein] = layout.entries;
  assert.equal(ja.label, 'JA');
  assert.equal(nein.label, 'NEIN');
  assert.ok(ja.x < BOARD_GEOMETRY.cx, 'JA steht links vom Mittelpunkt');
  assert.ok(nein.x > BOARD_GEOMETRY.cx, 'NEIN steht rechts vom Mittelpunkt');
  assert.ok(Math.abs(ja.y - BOARD_GEOMETRY.cy) < 0.01);
  assert.ok(Math.abs(nein.y - BOARD_GEOMETRY.cy) < 0.01);
  assert.equal(layout.step, 180);
});

test('Zahlenkreis: zehn Segmente, 0 oben, gleichmäßig verteilt', () => {
  const layout = layoutBoard(defaultConfigForPreset('zahlenkreis'));
  assert.equal(layout.segments, 10);
  assert.equal(layout.entries[0].label, '0');
  assert.ok(Math.abs(layout.entries[0].x - BOARD_GEOMETRY.cx) < 0.01);
  assert.ok(layout.entries[0].y < BOARD_GEOMETRY.cy);
  assert.equal(layout.step, 36);
  for (let index = 1; index < layout.entries.length; index += 1) {
    const delta = layout.entries[index].midAngle - layout.entries[index - 1].midAngle;
    assert.ok(Math.abs(delta - 36) < 1e-9);
  }
});

test('Buchstabentafel: 26 eigene Positionen, alle innerhalb der Fläche', () => {
  const layout = layoutBoard(defaultConfigForPreset('buchstaben'));
  assert.equal(layout.segments, 26);
  const positions = new Set(layout.entries.map((entry) => `${entry.x},${entry.y}`));
  assert.equal(positions.size, 26);
  for (const entry of layout.entries) {
    assert.ok(entry.x > 0 && entry.x < BOARD_GEOMETRY.width);
    assert.ok(entry.y > 0 && entry.y < BOARD_GEOMETRY.height);
    // Beschriftungen liegen im Kreis, nicht auf dem Rand.
    const distance = Math.hypot(entry.x - BOARD_GEOMETRY.cx, entry.y - BOARD_GEOMETRY.cy);
    assert.ok(Math.abs(distance - layout.labelRadius) < 0.02);
  }
});

test('Segmenttafel: zwölf Segmente im 30-Grad-Raster', () => {
  const layout = layoutBoard(defaultConfigForPreset('segmente12'));
  assert.equal(layout.segments, 12);
  assert.equal(layout.step, 30);
  assert.equal(layout.entries[0].label, '1');
  assert.ok(Math.abs(layout.entries[0].x - BOARD_GEOMETRY.cx) < 0.01);
});

test('Zeichenlängen-Grenze folgt der Segmentzahl', () => {
  assert.equal(maxLabelLengthFor(2), BOARD_LIMITS.maxLabelLength);
  assert.ok(maxLabelLengthFor(12) >= 10);
  assert.ok(maxLabelLengthFor(26) >= 5);
  assert.ok(maxLabelLengthFor(48) <= 4);
  // monoton fallend: mehr Segmente, weniger Platz
  const counts = [2, 4, 6, 12, 26, 48];
  for (let index = 1; index < counts.length; index += 1) {
    assert.ok(maxLabelLengthFor(counts[index]) <= maxLabelLengthFor(counts[index - 1]));
  }
  // Der Beschriftungsradius wächst mit der Segmentzahl, die Sehne schrumpft.
  assert.ok(labelRadiusFor(2) < labelRadiusFor(12));
  assert.ok(chordFor(48) < chordFor(12));
});

test('Schriftgröße bleibt im zulässigen Band und wird bei mehr Segmenten kleiner', () => {
  for (const preset of BOARD_PRESETS) {
    const longest = Math.max(...preset.labels.map((label) => label.length));
    const size = labelFontSize(preset.labels.length, longest);
    assert.ok(size >= BOARD_GEOMETRY.minFont, `${preset.id}: ${size} zu klein`);
    assert.ok(size <= BOARD_GEOMETRY.maxFont, `${preset.id}: ${size} zu groß`);
  }
  assert.ok(labelFontSize(4, 2) > labelFontSize(48, 2));
  // Lange Beschriftungen werden kleiner gesetzt, nicht abgeschnitten.
  assert.ok(labelFontSize(12, 12) < labelFontSize(12, 2));
});

// --- Prüfung importierter Konfigurationen ---------------------------------

test('gültige Konfiguration wird übernommen und getrimmt', () => {
  const result = validateBoard(valid({ title: '  Meine Tafel  ', labels: [' JA ', 'NEIN '] }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.value.title, 'Meine Tafel');
  assert.deepEqual([...result.value.labels], ['JA', 'NEIN']);
  assert.ok(Object.isFrozen(result.value));
});

test('Nicht-Objekte werden abgelehnt', () => {
  for (const input of [null, undefined, 'x', 42, ['JA', 'NEIN'], true]) {
    const result = validateBoard(input);
    assert.equal(result.ok, false);
    assert.equal(result.value, null);
    assert.ok(result.errors.length >= 1);
  }
});

test('falscher Schema-Bezeichner wird abgelehnt', () => {
  const result = validateBoard(valid({ schema: 'esow.pendeltafel/2' }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => message.includes(BOARD_SCHEMA)));
});

test('unbekannte Felder werden abgelehnt — auch onload, href und html', () => {
  for (const extra of [
    { onload: 'alert(1)' },
    { href: 'javascript:alert(1)' },
    { html: '<script>alert(1)</script>' },
    { ['__proto__']: { polluted: true } },
    { style: 'background:url(https://example.test/x.png)' },
  ]) {
    const result = validateBoard({ ...valid(), ...extra });
    assert.equal(result.ok, false, JSON.stringify(extra));
    assert.ok(result.errors.some((message) => message.includes('Unbekanntes Feld')));
  }
  assert.equal({}.polluted, undefined);
});

test('unbekannte Vorlage und unbekannter Farbstil werden abgelehnt', () => {
  const presetResult = validateBoard(valid({ preset: 'sonnenrad' }));
  assert.equal(presetResult.ok, false);
  assert.ok(presetResult.errors.some((message) => message.includes('preset')));
  const paletteResult = validateBoard(valid({ palette: '#ff0000' }));
  assert.equal(paletteResult.ok, false);
  assert.ok(paletteResult.errors.some((message) => message.includes('palette')));
  assert.deepEqual(PALETTE_IDS, ['messing', 'salbei', 'nacht', 'papier']);
  assert.deepEqual(PRESET_IDS, ['janain', 'zahlenkreis', 'buchstaben', 'segmente4', 'segmente6', 'segmente12']);
});

test('Segmentzahl außerhalb 2–48 wird abgelehnt', () => {
  for (const count of [0, 1, 49, 60]) {
    const labels = Array.from({ length: count }, (_, index) => String(index + 1));
    const result = validateBoard(valid({ labels }));
    assert.equal(result.ok, false, `Segmentzahl ${count}`);
    assert.ok(result.errors.some((message) => message.includes('Segmente')));
  }
  const notAList = validateBoard(valid({ labels: 'JA,NEIN' }));
  assert.equal(notAList.ok, false);
  assert.ok(notAList.errors.some((message) => message.includes('labels')));
});

test('leere und zu lange Beschriftungen werden abgelehnt', () => {
  const empty = validateBoard(valid({ labels: ['JA', '   '] }));
  assert.equal(empty.ok, false);
  assert.ok(empty.errors.some((message) => message.includes('Beschriftung 2 ist leer')));

  const tooLong = validateBoard(valid({ labels: ['A'.repeat(41), 'NEIN'] }));
  assert.equal(tooLong.ok, false);
  assert.ok(tooLong.errors.some((message) => message.includes('zu lang')));

  // Bei 48 Segmenten sind selbst 5 Zeichen zu viel; die Grenze ist geometrisch.
  const dense = validateBoard(valid({ preset: 'segmente12', labels: Array.from({ length: 48 }, () => 'ABCDE') }));
  assert.equal(dense.ok, false);
  assert.ok(dense.errors.some((message) => message.includes('bei 48 Segmenten')));

  const notString = validateBoard(valid({ labels: ['JA', 7] }));
  assert.equal(notString.ok, false);
  assert.ok(notString.errors.some((message) => message.includes('muss Text sein')));
});

test('Steuerzeichen und Zeilenumbrüche werden abgelehnt', () => {
  for (const label of ['JA\nNEIN', 'JA\tNEIN', 'JA\u0000NEIN', 'JA\u007fNEIN']) {
    const result = validateBoard(valid({ labels: [label, 'NEIN'] }));
    assert.equal(result.ok, false, JSON.stringify(label));
    assert.ok(result.errors.some((message) => message.includes('Steuerzeichen')));
  }
  const title = validateBoard(valid({ title: 'Zeile1\nZeile2' }));
  assert.equal(title.ok, false);
  assert.ok(title.errors.some((message) => message.includes('Steuerzeichen')));
});

test('Markup in Beschriftung und Überschrift wird abgelehnt', () => {
  const payloads = [
    '<script>alert(1)</script>',
    '"><svg onload=alert(1)>',
    '<img src=x onerror=alert(1)>',
    '</text><script>alert(1)</script>',
    '<foreignObject><body xmlns="http://www.w3.org/1999/xhtml">x</body></foreignObject>',
  ];
  for (const payload of payloads) {
    const labelResult = validateBoard(valid({ labels: [payload, 'NEIN'] }));
    assert.equal(labelResult.ok, false, payload);
    assert.ok(labelResult.errors.some((message) => message.includes('nicht erlaubt')));
    const titleResult = validateBoard(valid({ title: payload }));
    assert.equal(titleResult.ok, false, payload);
    assert.ok(titleResult.errors.some((message) => message.includes('nicht erlaubt')));
  }
});

test('Überschrift: leer und zu lang werden abgelehnt', () => {
  assert.equal(validateBoard(valid({ title: '   ' })).ok, false);
  const long = validateBoard(valid({ title: 'T'.repeat(BOARD_LIMITS.maxTitleLength + 1) }));
  assert.equal(long.ok, false);
  assert.ok(long.errors.some((message) => message.includes('zu lang')));
  assert.equal(validateBoard(valid({ title: 12 })).ok, false);
});

test('Umlaute und Sonderzeichen sind erlaubt und bleiben erhalten', () => {
  const labels = ['Grüße', 'ÄÖÜß', 'Ø 12 mm', '„offen“', 'A & B', '50 %', '+ / −', 'Größe: 3,5 cm'];
  const result = validateBoard(
    valid({ preset: 'segmente12', title: 'Tafel für Größen & Maße', labels: labels.slice(0, 8) })
  );
  assert.equal(result.ok, true, result.errors.join(' '));
  assert.deepEqual([...result.value.labels], labels);
  const svg = buildSvg(result.value);
  assert.ok(svg.includes('Grüße'));
  assert.ok(svg.includes('ÄÖÜß'));
  assert.ok(svg.includes('Tafel für Größen &amp; Maße'));
  assert.ok(svg.includes('A &amp; B'));
  assert.ok(!svg.includes('Tafel für Größen & Maße'), 'rohes & darf nicht im XML stehen');
});

test('doppelte Beschriftungen sind erlaubt, werden aber gemeldet', () => {
  const result = validateBoard(valid({ labels: ['JA', 'JA'] }));
  assert.equal(result.ok, true);
  assert.equal(result.warnings.length, 1);
  assert.ok(result.warnings[0].includes('mehrfach'));
});

test('Importgröße: mehr als 32 KiB werden vor dem Parsen abgelehnt', () => {
  const oversized = `{"schema":"${BOARD_SCHEMA}","labels":["${'x'.repeat(BOARD_LIMITS.maxBytes + 1)}"]}`;
  const result = parseBoardJson(oversized);
  assert.equal(result.ok, false);
  assert.ok(result.bytes > BOARD_LIMITS.maxBytes);
  assert.ok(result.errors.some((message) => message.includes('Bytes')));
});

test('JSON-Import: leer, kaputt und mit BOM', () => {
  assert.equal(parseBoardJson('').ok, false);
  assert.equal(parseBoardJson('   ').ok, false);
  const broken = parseBoardJson('{"schema": ');
  assert.equal(broken.ok, false);
  assert.ok(broken.errors[0].startsWith('Kein gültiges JSON'));

  const withBom = parseBoardJson(`\uFEFF${JSON.stringify(valid())}`);
  assert.equal(withBom.ok, true);
  assert.deepEqual([...withBom.value.labels], ['JA', 'NEIN']);
});

test('Export, Reimport und erneuter Export ergeben dieselbe Zeichnung', () => {
  const config = validateBoard(
    valid({
      preset: 'segmente6',
      title: 'Farbkategorien',
      palette: 'salbei',
      labels: ['Rot', 'Blau', 'Grün', 'Gelb', 'Weiß', 'Schwarz'],
    })
  ).value;
  const json = serializeBoard(config);
  const reimported = parseBoardJson(json);
  assert.equal(reimported.ok, true, reimported.errors.join(' '));
  assert.deepEqual([...reimported.value.labels], [...config.labels]);
  assert.equal(reimported.value.title, config.title);
  assert.equal(reimported.value.palette, config.palette);
  assert.equal(buildSvg(reimported.value), buildSvg(config));
  // Die JSON-Datei enthält Daten, keine Zeichnung und keine Funktionen.
  assert.ok(json.startsWith('{'));
  assert.ok(!json.includes('<svg'));
  assert.ok(!json.includes('function'));
});

test('ungültige Konfiguration lässt sich nicht serialisieren', () => {
  assert.throws(
    () => serializeBoard(valid({ labels: ['<script>alert(1)</script>', 'NEIN'] })),
    (error) => error instanceof BoardValidationError && error.errors.length > 0
  );
});

// --- SVG-Ausgabe -----------------------------------------------------------

test('SVG ist deterministisch und eigenständig', () => {
  const config = defaultConfigForPreset('zahlenkreis', 'nacht');
  const first = buildSvg(config);
  const second = buildSvg(config);
  assert.equal(first, second);
  assert.ok(first.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(first.includes(`viewBox="0 0 ${BOARD_GEOMETRY.width} ${BOARD_GEOMETRY.height}"`));
  assert.ok(first.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(first.includes('<title id="ptf-title">Zahlenkreis 0–9</title>'));
  assert.ok(first.includes('<desc id="ptf-desc">'));
  // Genau eine externe Referenz: der XML-Namespace. Kein Bild, kein Link.
  assert.equal((first.match(/https?:\/\//g) || []).length, 1);
});

test('SVG enthält keine Skripte, Eventhandler oder externen Verweise', () => {
  for (const preset of BOARD_PRESETS) {
    for (const palette of PALETTE_IDS) {
      const svg = buildSvg(defaultConfigForPreset(preset.id, palette));
      assert.ok(!/<script/i.test(svg), `${preset.id}/${palette}: script`);
      assert.ok(!/\son[a-z]+\s*=/i.test(svg), `${preset.id}/${palette}: Eventhandler`);
      assert.ok(!/javascript:/i.test(svg), `${preset.id}/${palette}: javascript-URL`);
      assert.ok(!/<foreignObject/i.test(svg), `${preset.id}/${palette}: foreignObject`);
      assert.ok(!/<image/i.test(svg), `${preset.id}/${palette}: image`);
      assert.ok(!/<use\b/i.test(svg), `${preset.id}/${palette}: use`);
      assert.ok(!/<style\b/i.test(svg), `${preset.id}/${palette}: style`);
      assert.ok(!/xlink:href/i.test(svg), `${preset.id}/${palette}: xlink`);
      assert.ok(!/@import/i.test(svg), `${preset.id}/${palette}: @import`);
      assert.ok(!/\bdata:/i.test(svg), `${preset.id}/${palette}: data-URL`);
    }
  }
});

test('jede Beschriftung steht genau einmal im SVG, dazu Titel und Fußzeile', () => {
  const config = defaultConfigForPreset('segmente12');
  const svg = buildSvg(config);
  assert.equal((svg.match(/<text /g) || []).length, config.labels.length + 3);
  for (const label of config.labels) {
    assert.ok(svg.includes(`>${escapeXml(label)}</text>`), `fehlt: ${label}`);
  }
  assert.ok(svg.includes('Die Tafel ordnet die Bedeutung der Segmente'));
});

test('escapeXml deckt alle fünf XML-Sonderzeichen ab', () => {
  assert.equal(escapeXml(`<&>"'`), '&lt;&amp;&gt;&quot;&apos;');
  assert.equal(escapeXml('Grüße & Maße'), 'Grüße &amp; Maße');
  assert.equal(escapeXml(null), '');
});

test('ungültige Eingaben werden auch beim Zeichnen abgelehnt', () => {
  assert.throws(
    () => buildSvg(valid({ labels: ['<script>alert(1)</script>', 'NEIN'] })),
    (error) => error instanceof BoardValidationError
  );
  assert.throws(() => buildSvg({}), BoardValidationError);
});

test('Farbstil ändert die Zeichnung, nicht die Geometrie', () => {
  const messing = buildSvg(valid({ palette: 'messing' }));
  const papier = buildSvg(valid({ palette: 'papier' }));
  assert.notEqual(messing, papier);
  assert.ok(messing.includes(PALETTES.messing.bg));
  assert.ok(papier.includes(PALETTES.papier.bg));
  assert.equal(
    layoutBoard(valid({ palette: 'messing' })).entries[0].x,
    layoutBoard(valid({ palette: 'papier' })).entries[0].x
  );
});

test('Farbstile erfüllen die Kontrastanforderungen', () => {
  for (const palette of Object.values(PALETTES)) {
    assert.ok(contrastRatio(palette.text, palette.disk) >= 4.5, `${palette.id}: Text auf Scheibe`);
    assert.ok(contrastRatio(palette.text, palette.bg) >= 4.5, `${palette.id}: Text auf Grund`);
    assert.ok(contrastRatio(palette.ring, palette.bg) >= 3, `${palette.id}: Ring auf Grund`);
    assert.ok(contrastRatio(palette.muted, palette.bg) >= 4.5, `${palette.id}: Fußtext auf Grund`);
  }
  // Gegenprobe: die Funktion unterscheidet hell und dunkel korrekt.
  assert.ok(contrastRatio('#ffffff', '#000000') > 20);
  assert.equal(contrastRatio('#777777', '#777777'), 1);
});

test('Dateiname wird aus der Überschrift gebildet und bleibt sicher', () => {
  assert.equal(fileStem('Ja/Nein-Tafel'), 'pendeltafel-ja-nein-tafel');
  assert.equal(fileStem('Größen & Maße'), 'pendeltafel-groessen-masse');
  assert.equal(fileStem('///'), 'pendeltafel-tafel');
  const stem = fileStem('<img src=x onerror=alert(1)>');
  assert.ok(!/[<>"'/\\]/.test(stem), stem);
});

// --- Route, Ansicht, Werkstatt --------------------------------------------

test('Route #pendeln/studio löst die Studio-Ansicht aus', () => {
  assert.equal(ROUTE.studio, '#pendeln/studio');
  const route = model.resolve(['studio'], '');
  assert.equal(route.view, 'studio');
  // Kein Query-Zustand: eine Tafel entsteht im Browser, nicht in der Adresse.
  const withQuery = model.resolve(['studio'], 'labels=JA');
  assert.equal(withQuery.view, 'studio');
  assert.equal(Object.prototype.hasOwnProperty.call(withQuery, 'labels'), false);
});

test('Studio-Ansicht enthält Bedienung, Vorschau und Druckansicht', () => {
  const view = renderStudio();
  assert.equal(view.studio, true);
  assert.equal(view.h1, 'Pendeltafel-Studio');
  assert.ok(view.title.includes('Pendeltafel-Studio'));
  assert.ok(view.description.length > 80 && view.description.length <= 180);
  for (const id of [
    'pendeltafelStudio',
    'ptfPreset',
    'ptfTitle',
    'ptfLabels',
    'ptfPreview',
    'ptfSheet',
    'ptfPrint',
    'ptfDownloadSvg',
    'ptfImportFile',
    'ptfErrors',
    'ptfStatus',
  ]) {
    assert.ok(view.html.includes(`id="${id}"`), `fehlt: ${id}`);
  }
  assert.equal((view.html.match(/name="ptfPalette"/g) || []).length, 4);
  assert.equal((view.html.match(/<option /g) || []).length, BOARD_PRESETS.length);
  assert.ok(view.html.includes('Druckansicht'));
  assert.ok(view.html.includes('32 KiB'));
  assert.ok(view.html.includes('Keine Messung'));
  assert.ok(view.html.includes('<noscript>'));
  // Keine ungeprüften Daten: das Markup enthält nur eigene, escaped Texte.
  assert.ok(!view.html.includes('<script'));
});

test('Werkstatt-Karte des Studios ist verfügbar und verlinkt', () => {
  const landing = renderLanding(model);
  const entry = model.data.landing.workshop.find((item) => item.title === 'Pendeltafel-Studio');
  assert.ok(entry, 'Werkstatt-Karte fehlt');
  assert.equal(entry.state, 'Verfügbar');
  assert.equal(entry.href, ROUTE.studio);
  assert.ok(landing.html.includes(`href="${ROUTE.studio}"`));
  assert.ok(landing.html.includes('Pendeltafel-Studio'));
});

test('Druckvariante enthält nur die Segmente, aber weiterhin Titel und Beschreibung', () => {
  const config = defaultConfigForPreset('segmente4', 'papier');
  const full = buildSvg(config);
  const board = buildSvg(config, { caption: false });
  assert.ok(full.includes('>Segmenttafel · vier Felder</text>'));
  assert.ok(!board.includes('>Segmenttafel · vier Felder</text>'));
  assert.ok(!board.includes('Esoterik-Welt · Pendeltafel-Studio</text>'));
  assert.equal((board.match(/<text /g) || []).length, 4);
  // Die zugängliche Beschreibung bleibt in beiden Fassungen.
  assert.ok(board.includes('<title id="ptf-title">Segmenttafel · vier Felder</title>'));
  assert.ok(board.includes('<desc id="ptf-desc">'));
  // Geometrie und Farben sind identisch; nur die Beschriftung des Bildes fehlt.
  assert.ok(board.includes(PALETTES.papier.bg));
  assert.equal(layoutBoard(config).entries[0].x, layoutBoard(config).entries[0].x);
});

test('Styleheet enthält die A4-Druckregeln für die Tafel', () => {
  const css = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'css', 'radiasthesie.css'),
    'utf8'
  );
  assert.ok(css.includes('@media print'));
  assert.ok(css.includes('size: A4 portrait'));
  assert.ok(css.includes('html.ptf-print-active .ptf-printblock > .ptf-sheet'));
  assert.ok(css.includes('display: none !important'));
  assert.ok(css.includes('print-color-adjust: exact'));
  // Die Druckregeln dürfen andere Seiten nicht treffen.
  assert.ok(css.includes('html.ptf-print-active body > *'));
});
