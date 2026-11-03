// Farbwelten — Daten-, Vertrags- und Rechentests ohne Browser.
//
// Node behandelt .js in diesem Paket als CommonJS; die Browser-Module sind ESM.
// Deshalb werden die unveränderten Dateien in ein temporäres Verzeichnis mit
// eigener package.json ("type":"module") kopiert und von dort importiert
// (gleiches Verfahren wie tests/astrologie.mjs).
//
// Geprüft wird, was der Browser unverändert lädt:
//   1. sieben Farbwelten mit belegten Wellenlängen/Frequenzen,
//   2. vollständiges A–H-Skelett je Farbseite und bekannte Blocktypen,
//   3. Quellenauflösung ohne offene Verweise,
//   4. Spektrum-Stützwerte (650/530/420 nm),
//   5. Routenauflösung inkl. Anker und Unbekannt-Ansicht,
//   6. Chakren- und Lichtseite vollständig,
//   7. Redaktionstexte nicht im Markup, SEO-Längen, kein HTML in Daten.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MODULE_FILES = ['js/modules/farbwelten-model.js', 'js/data/farbwelten.js', 'js/data/chakren.js'];

const WAVELENGTHS = {
  rot: [620, 750, '400–484 THz'],
  orange: [590, 620, '484–508 THz'],
  gelb: [570, 590, '508–526 THz'],
  gruen: [490, 570, '526–612 THz'],
  blau: [450, 490, '612–666 THz'],
  indigo: [425, 450, '666–705 THz'],
  violett: [380, 425, '705–789 THz'],
};

const SECTION_KEYS = ['erleben', 'physik', 'psychologie', 'tradition', 'anwendung', 'geschichte', 'uebung', 'quellen'];

const BLOCK_TYPES = new Set(['p', 'list', 'facts', 'table', 'quote', 'h3', 'timeline', 'swatch', 'gap']);

let tmp;
let data;
let model;
let chakren;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'farbwelten-'));
  fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
  for (const file of MODULE_FILES) {
    const target = path.join(tmp, path.basename(file));
    fs.copyFileSync(path.join(root, file), target);
  }
  data = await import(pathToFileURL(path.join(tmp, 'farbwelten.js')).href);
  model = await import(pathToFileURL(path.join(tmp, 'farbwelten-model.js')).href);
  chakren = await import(pathToFileURL(path.join(tmp, 'chakren.js')).href);
});

after(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

test('sieben Farbwelten mit belegten Wellenlängen- und Frequenzbereichen', () => {
  assert.equal(data.FARBWELTEN.length, 7);
  assert.deepEqual(
    data.FARBWELTEN.map((world) => world.id),
    Object.keys(WAVELENGTHS)
  );
  for (const world of data.FARBWELTEN) {
    const [min, max, frequency] = WAVELENGTHS[world.id];
    assert.equal(world.wavelength.min, min, `${world.id}: min`);
    assert.equal(world.wavelength.max, max, `${world.id}: max`);
    assert.equal(world.wavelength.label, `${min}–${max} nm`, `${world.id}: label`);
    assert.equal(world.frequency.label, frequency, `${world.id}: Frequenz`);
    assert.equal(world.spectral, true, `${world.id}: spektral`);
    assert.ok(world.photonEv.min > 1.5 && world.photonEv.max < 3.4, `${world.id}: Photonenenergie`);
    assert.equal(
      world.chakra,
      ['root', 'sacral', 'solar', 'heart', 'throat', 'third-eye', 'crown'][data.FARBWELTEN.indexOf(world)]
    );
  }
});

test('jede Farbseite trägt das vollständige A–H-Skelett', () => {
  for (const world of data.FARBWELTEN) {
    assert.deepEqual(Object.keys(world.sections), SECTION_KEYS, `${world.id}: Reihenfolge`);
    for (const key of SECTION_KEYS) {
      const blocks = world.sections[key];
      assert.ok(Array.isArray(blocks), `${world.id}/${key}: fehlt`);
      if (key === 'quellen') {
        // Die Quellenliste wird aus dem Register gerendert; bei zwei Seiten
        // enthält die Redaktionsdatei nur die Nummern.
        assert.ok(world.sources.length > 0, `${world.id}: keine Quellen`);
        continue;
      }
      assert.ok(blocks.length > 0, `${world.id}/${key}: leer`);
      for (const block of blocks) {
        assert.ok(BLOCK_TYPES.has(block.type), `${world.id}/${key}: unbekannter Block ${block.type}`);
      }
    }
    assert.ok(world.lede.length > 40, `${world.id}: Lede fehlt`);
    assert.ok(
      world.sections.tradition.some((block) => block.type === 'p'),
      `${world.id}: Tradition fehlt`
    );
    assert.ok(
      world.sections.anwendung.some((block) => block.type === 'quote' && /medizin/i.test(block.text)),
      `${world.id}: Health-Disclaimer fehlt`
    );
    assert.ok(
      world.sections.geschichte.some((block) => block.type === 'timeline'),
      `${world.id}: Geschichtszeitleiste fehlt`
    );
  }
});

test('kein Text enthält HTML oder Skriptfragmente', () => {
  const source = JSON.stringify(data.FARBWELTEN) + JSON.stringify(data.LANDING);
  assert.doesNotMatch(source, /<\s*(script|iframe|img|style)\b/i);
  assert.doesNotMatch(source, /javascript:/i);
});

test('alle Quellenverweise sind aufgelöst', () => {
  for (const world of data.FARBWELTEN) {
    const text = JSON.stringify(world.sections) + world.lede + JSON.stringify(world.compare);
    const cited = [...text.matchAll(/\[(\d{1,2})\]/g)].map((match) => match[1]);
    for (const id of new Set(cited)) {
      assert.ok(
        world.sources.includes(id) || world.shortRefs.includes(id),
        `${world.id}: Quelle [${id}] nicht gemeldet`
      );
    }
    for (const id of world.sources) assert.ok(data.SOURCES[id], `${world.id}: Quelle [${id}] fehlt im Register`);
  }
});

test('Einstieg, Chakren- und Lichtseite sind vollständig', () => {
  assert.equal(data.LANDING.title, 'Farbwelten');
  assert.ok(data.LANDING.lede.length > 80);
  assert.equal(data.LANDING.sections.length, 5);
  for (const section of data.LANDING.sections) assert.ok(section.blocks.length > 0, section.key);
  assert.equal(data.LANDING.worlds.length, 7);
  assert.ok(data.LANDING.sources.includes('1') && data.LANDING.sources.includes('3'));

  assert.equal(data.CHAKREN_PAGE.table.rows.length, 7);
  assert.equal(data.CHAKREN_PAGE.table.head.length, 5);
  assert.ok(data.CHAKREN_PAGE.table.caption.length > 20);
  assert.ok(data.CHAKREN_PAGE.timeline.length > 0);
  assert.ok(data.CHAKREN_PAGE.science.length > 0);
  assert.ok(data.CHAKREN_PAGE.lede.length > 100);

  assert.equal(data.LIGHT_PAGE.sections.length, 4);
  const disclaimer = data.LIGHT_PAGE.sections.find((section) => section.key === 'disclaimer');
  assert.ok(disclaimer.blocks.some((block) => block.type === 'quote' && /medizinische Diagnose/.test(block.text)));
});

test('Chakren-Daten sind vollständig und als Tradition gekennzeichnet', () => {
  assert.equal(chakren.CHAKREN.length, 7);
  for (const [index, entry] of chakren.CHAKREN.entries()) {
    assert.equal(entry.number, index + 1);
    assert.ok(entry.name && entry.sanskrit && entry.position);
    assert.ok(entry.themes.length >= 1);
    assert.match(entry.einordnung, /Deutungstradition, keine medizinische Größe/);
    assert.ok(
      data.FARBWELTEN.some((world) => world.id === entry.colorId),
      `${entry.id}: Farbwelt fehlt`
    );
    assert.equal(typeof chakren.CHAKRA_POSITIONS[entry.id], 'number');
  }
});

test('Spektrumrechnung trifft die dokumentierten Stützwerte', () => {
  const cases = [
    [650, 461.2, 'Rot', 1.91],
    [530, 565.6, 'Grün', 2.34],
    [420, 713.8, 'Violett', 2.95],
  ];
  for (const [nm, frequency, band, energy] of cases) {
    const value = model.spectrumAt(nm);
    assert.equal(value.wavelength, nm);
    assert.ok(Math.abs(value.frequency - frequency) < 0.06, `${nm} nm: ${value.frequency}`);
    assert.equal(value.band.name, band);
    assert.ok(Math.abs(value.energy - energy) < 0.006, `${nm} nm: ${value.energy}`);
    assert.match(value.valueText, new RegExp(`${nm} Nanometer, ${band}`));
  }
  assert.equal(model.spectrumAt(380).hex, '#610061');
  assert.equal(model.spectrumAt(700).band.id, 'rot');
  assert.equal(model.bandFor(360).spectral, false);
  assert.equal(model.bandFor(800).spectral, false);
});

test('Routenauflösung: Einstieg, Farben, Anker, Unbekanntes', () => {
  const worlds = data.FARBWELTEN;
  const anchors = data.SECTION_ORDER.map((section) => section.anchor);
  assert.equal(model.resolveView([], worlds, anchors).view, 'landing');
  assert.equal(model.resolveView(['register'], worlds, anchors).anchor, 'register');
  const rot = model.resolveView(['rot'], worlds, anchors);
  assert.equal(rot.view, 'color');
  assert.equal(rot.world.id, 'rot');
  assert.equal(model.resolveView(['rot', 'physik'], worlds, anchors).anchor, 'physik');
  assert.equal(model.resolveView(['rot', 'quatsch'], worlds, anchors).anchor, '');
  assert.equal(model.resolveView(['chakren'], worlds, anchors).view, 'chakren');
  assert.equal(model.resolveView(['lichtfrequenzen'], worlds, anchors).view, 'light');
  assert.equal(model.resolveView(['tuerkis'], worlds, anchors).view, 'notfound');
  assert.equal(model.ROUTE.color('rot', 'physik'), '#farbwelten/rot/physik');
  assert.equal(model.ROUTE.landing('register'), '#farbwelten/register');
});

test('SEO-Titel und Beschreibungen bleiben im Rahmen der IA', () => {
  const entries = [
    data.LANDING.meta,
    data.CHAKREN_PAGE.meta,
    data.LIGHT_PAGE.meta,
    ...data.FARBWELTEN.map((world) => world.meta),
  ];
  for (const meta of entries) {
    assert.ok(meta.title.length <= 80, `Titel zu lang: ${meta.title} (${meta.title.length})`);
    assert.ok(meta.description.length <= 160, `Description zu lang: ${meta.description.length}`);
    assert.match(meta.title, /\| Esoterik-Welt$/);
  }
});

test('Redaktionstexte stehen nicht im Markup', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const needle of ['Sat-cakra-nirupana', 'Mūlādhāra', 'Metamerie', 'Photobiomodulation']) {
    assert.equal(html.includes(needle), false, `index.html enthält Redaktionstext: ${needle}`);
  }
  // Die Datendatei ist die einzige Quelle der Texte.
  const module = fs.readFileSync(path.join(root, 'js/modules/farbwelten.js'), 'utf8');
  assert.equal(module.includes('Sat-cakra-nirupana'), false, 'Modul enthält Redaktionstext');
});
