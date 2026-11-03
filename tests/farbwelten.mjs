// Farbwelten — Daten-, Vertrags- und Rechentests ohne Browser.
//
// Node behandelt .js in diesem Paket als CommonJS; die Browser-Module sind ESM.
// Deshalb werden die unveränderten Dateien in ein temporäres Verzeichnis mit
// eigener package.json ("type":"module") kopiert und von dort importiert
// (gleiches Verfahren wie tests/astrologie.mjs).
//
// Geprüft wird, was der Browser unverändert lädt:
//   1. zwölf Farbwelten mit Typ (spektral / nicht spektral / neutral),
//      belegten Wellenlängen/Frequenzen und keine Messwerte für Misch- und
//      Neutralfarben,
//   2. vollständiges A–H-Skelett je Farbseite und bekannte Blocktypen,
//   3. Quellenauflösung ohne offene Verweise,
//   4. Spektrum-Stützwerte (650/530/420 nm),
//   5. Routenauflösung inkl. Anker und Unbekannt-Ansicht,
//   6. Chakren- und Lichtseite vollständig,
//   7. Redaktionstexte nicht im Markup, SEO-Längen, kein HTML in Daten,
//   8. Registereinträge mit Route, Kurzbeschreibung, Typ-Label und
//      Verwandtschaften.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MODULE_FILES = ['js/modules/farbwelten-model.js', 'js/data/farbwelten.js', 'js/data/chakren.js'];

// Sollzustand je Farbe: [min, max, Frequenzlabel] oder null für Farben ohne
// eigene Wellenlänge.
const WAVELENGTHS = {
  rot: [620, 750, '400–484 THz'],
  orange: [590, 620, '484–508 THz'],
  gelb: [570, 590, '508–526 THz'],
  gruen: [490, 570, '526–612 THz'],
  tuerkis: [490, 520, '577–612 THz'],
  blau: [450, 490, '612–666 THz'],
  indigo: [425, 450, '666–705 THz'],
  violett: [380, 425, '705–789 THz'],
  magenta: null,
  rosa: null,
  weiss: null,
  schwarz: null,
};

const TYPES = {
  rot: 'spectral',
  orange: 'spectral',
  gelb: 'spectral',
  gruen: 'spectral',
  tuerkis: 'spectral',
  blau: 'spectral',
  indigo: 'spectral',
  violett: 'spectral',
  magenta: 'non-spectral',
  rosa: 'non-spectral',
  weiss: 'neutral',
  schwarz: 'neutral',
};

const TYPE_LABELS = { spectral: 'Spektralfarbe', 'non-spectral': 'nicht spektral', neutral: 'Neutralfarbe' };

const CHAKRA_BY_ID = {
  rot: 'root',
  orange: 'sacral',
  gelb: 'solar',
  gruen: 'heart',
  blau: 'throat',
  indigo: 'third-eye',
  violett: 'crown',
};

const SECTION_KEYS = ['erleben', 'physik', 'psychologie', 'tradition', 'anwendung', 'geschichte', 'uebung', 'quellen'];

const BLOCK_TYPES = new Set(['p', 'list', 'facts', 'table', 'quote', 'h3', 'timeline', 'swatch', 'gap']);

// Themenseiten (FW-10/FW-11): eigene Redaktionsseiten ohne A–H-Skelett.
const TOPIC_SLUGS = ['farbtherapie', 'farbpsychologie', 'lichtmedizin'];
const TOPIC_BLOCK_TYPES = new Set([...BLOCK_TYPES, 'sources']);

/** H2-Überschriften einer Redaktionsdatei, in Dokumentreihenfolge. */
function headingsFromSource(slug) {
  const source = fs.readFileSync(path.join(root, 'content', 'farbwelten', `${slug}.md`), 'utf8').replace(/\r\n/g, '\n');
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
  return [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
}

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

test('zwölf Farbwelten mit Typ, belegten Wellenlängen und Frequenzbereichen', () => {
  assert.equal(data.FARBWELTEN.length, 12);
  assert.deepEqual(
    data.FARBWELTEN.map((world) => world.id),
    Object.keys(WAVELENGTHS)
  );
  for (const world of data.FARBWELTEN) {
    const expected = WAVELENGTHS[world.id];
    assert.equal(world.type, TYPES[world.id], `${world.id}: Typ`);
    assert.equal(world.typeLabel, TYPE_LABELS[TYPES[world.id]], `${world.id}: Typ-Label`);
    assert.equal(world.spectral, TYPES[world.id] === 'spectral', `${world.id}: spektral`);
    assert.equal(world.chakra, CHAKRA_BY_ID[world.id] ?? null, `${world.id}: Chakra`);
    if (expected) {
      const [min, max, frequency] = expected;
      assert.equal(world.wavelength.min, min, `${world.id}: min`);
      assert.equal(world.wavelength.max, max, `${world.id}: max`);
      assert.equal(world.wavelength.label, `${min}–${max} nm`, `${world.id}: label`);
      assert.equal(world.frequency.label, frequency, `${world.id}: Frequenz`);
      assert.ok(world.photonEv.min > 1.5 && world.photonEv.max < 3.4, `${world.id}: Photonenenergie`);
    } else {
      // Nichtspektrale und neutrale Farben tragen keine Messwerte.
      assert.equal(world.wavelength, null, `${world.id}: keine Wellenlänge`);
      assert.equal(world.frequency, null, `${world.id}: keine Frequenz`);
      assert.equal(world.photonEv, null, `${world.id}: keine Photonenenergie`);
      assert.equal(world.chakra, null, `${world.id}: kein Chakra`);
    }
  }
  // Türkis ist Spektralfarbe im Übergangsbereich zwischen Grün und Blau.
  const tuerkis = data.FARBWELTEN.find((world) => world.id === 'tuerkis');
  assert.equal(tuerkis.type, 'spectral');
  assert.deepEqual([tuerkis.wavelength.min, tuerkis.wavelength.max], [490, 520]);
});

test('Misch- und Neutralfarben erfinden keine Messwerte im Physikabschnitt', () => {
  for (const world of data.FARBWELTEN) {
    if (world.wavelength) continue;
    const facts = world.sections.physik.find((block) => block.type === 'facts');
    assert.ok(facts, `${world.id}: Physik-Fakten fehlen`);
    const labels = facts.rows.map(([label]) => label);
    assert.equal(labels.includes('Wellenlängenbereich'), false, `${world.id}: Wellenlängenzeile verboten`);
    assert.equal(labels.includes('Frequenz'), false, `${world.id}: Frequenzzeile verboten`);
    assert.equal(labels.includes('Photonenenergie'), false, `${world.id}: Energiezeile verboten`);
    for (const [, value] of facts.rows) {
      assert.doesNotMatch(String(value), /\d+\s*(?:–|-|bis)\s*\d+\s*nm/, `${world.id}: nm-Bereich erfunden`);
      assert.doesNotMatch(String(value), /THz|eV/, `${world.id}: Messwert erfunden`);
    }
    // Der Abschnitt erklärt stattdessen Mischfarbe/Additivität/Remission.
    const text = JSON.stringify(world.sections.physik);
    assert.match(text, /Mischung|Remission|Absorption|Superposition/i, `${world.id}: Erklärung fehlt`);
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
  assert.equal(data.LANDING.worlds.length, 12);
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
  // Alle zwölf Farben sind echte Routen — auch die nichtspektralen.
  for (const id of Object.keys(WAVELENGTHS)) {
    const route = model.resolveView([id], worlds, anchors);
    assert.equal(route.view, 'color', `${id}: keine Route`);
    assert.equal(route.world.id, id, `${id}: falsche Farbe`);
    assert.equal(model.ROUTE.color(id), `#farbwelten/${id}`);
  }
  assert.equal(model.resolveView(['tuerkis'], worlds, anchors).view, 'color');
  assert.equal(model.resolveView(['magenta', 'physik'], worlds, anchors).anchor, 'physik');
  assert.equal(model.resolveView(['quatsch'], worlds, anchors).view, 'notfound');
  assert.equal(model.ROUTE.color('rot', 'physik'), '#farbwelten/rot/physik');
  assert.equal(model.ROUTE.landing('register'), '#farbwelten/register');
});

test('Registereinträge tragen Route, Kurzbeschreibung, Typ-Label und Verwandtschaften', () => {
  for (const world of data.FARBWELTEN) {
    const entry = world.register;
    assert.ok(entry, `${world.id}: Registereintrag fehlt`);
    assert.equal(entry.id, world.id);
    assert.equal(entry.name, world.name);
    assert.equal(entry.route, `#farbwelten/${world.id}`);
    assert.equal(entry.typLabel, TYPE_LABELS[world.type]);
    assert.ok(entry.kurz.length >= 20, `${world.id}: Kurzbeschreibung zu kurz`);
    assert.ok(Array.isArray(entry.verwandt) && entry.verwandt.length > 0, `${world.id}: Verwandtschaften fehlen`);
    for (const id of entry.verwandt) {
      assert.ok(
        data.FARBWELTEN.some((other) => other.id === id),
        `${world.id}: Verwandtschaft ${id} existiert nicht`
      );
      assert.notEqual(id, world.id, `${world.id}: verweist auf sich selbst`);
    }
  }
  assert.equal(data.FARBWELTEN.filter((world) => world.register.typLabel === 'nicht spektral').length, 2);
  assert.equal(data.FARBWELTEN.filter((world) => world.register.typLabel === 'Neutralfarbe').length, 2);
});

test('Themenseiten: Reihenfolge, Kennungen und zitiert ⊆ gelistet', () => {
  assert.deepEqual(
    data.TOPIC_PAGES.map((page) => page.slug),
    TOPIC_SLUGS
  );

  for (const page of data.TOPIC_PAGES) {
    // Struktur: H1 als Titel, Lede, H2-Abschnitte in der Reihenfolge der Datei.
    assert.ok(page.title.length > 3, `${page.slug}: H1 fehlt`);
    assert.ok(page.lede.length > 200, `${page.slug}: Lede zu kurz`);
    assert.deepEqual(
      page.sections.map((section) => section.heading),
      headingsFromSource(page.slug),
      `${page.slug}: Abschnittsreihenfolge weicht von der Redaktionsdatei ab`
    );
    assert.equal(page.sections.at(-1).anchor, 'quellen', `${page.slug}: Quellen sind nicht der letzte Abschnitt`);

    const anchors = page.sections.map((section) => section.anchor);
    assert.equal(new Set(anchors).size, anchors.length, `${page.slug}: doppelte Sprungmarke`);
    for (const anchor of anchors) assert.match(anchor, /^[a-z0-9-]+$/, `${page.slug}: Sprungmarke ${anchor}`);

    // Abschnittstypen: nur was der Generator und Renderer kennen.
    for (const section of page.sections) {
      assert.ok(section.blocks.length > 0, `${page.slug}/${section.anchor}: leer`);
      for (const block of section.blocks)
        assert.ok(TOPIC_BLOCK_TYPES.has(block.type), `${page.slug}/${section.anchor}: unbekannter Block ${block.type}`);
    }

    // Quellen: Bibliografie als Liste mit Kennung, Label und optionaler URL.
    const sources = page.sections.flatMap((section) => section.blocks).filter((block) => block.type === 'sources');
    assert.equal(sources.length, 1, `${page.slug}: genau eine Quellenliste erwartet`);
    for (const entry of sources[0].items) {
      assert.match(entry.id, /^\d{1,2}$/, `${page.slug}: Kennung ${entry.id}`);
      assert.ok(entry.label.length > 10, `${page.slug}: Quelle [${entry.id}] ohne belastbares Label`);
    }

    // zitiert ⊆ gelistet: jeder Verweis im Text steht in der Quellenliste.
    const listed = new Set(sources[0].items.map((entry) => entry.id));
    assert.deepEqual([...listed].sort(), [...page.listed].sort(), `${page.slug}: listed weicht von der Liste ab`);
    const bodyText = JSON.stringify(page.sections.filter((section) => section.anchor !== 'quellen'));
    const cited = new Set([...bodyText.matchAll(/\[(\d{1,2})\]/g)].map((match) => match[1]));
    for (const id of cited) assert.ok(listed.has(id), `${page.slug}: [${id}] zitiert, aber nicht gelistet`);
    assert.deepEqual(
      [...cited].sort((a, b) => a - b),
      [...page.listed].filter((id) => cited.has(id)).sort((a, b) => a - b)
    );

    // Health-Disclaimer bleibt der letzte Block der Seite.
    const last = page.sections.at(-1).blocks.at(-1);
    assert.equal(last.type, 'p', `${page.slug}: letzter Block ist kein Absatz`);
    const disclaimer = last.text.replace(/\*\*/g, '');
    assert.match(disclaimer, /^Health-Disclaimer:/, `${page.slug}: Health-Disclaimer fehlt am Seitenende`);
    assert.match(disclaimer, /medizinische Diagnose oder Behandlung/, `${page.slug}: Disclaimer ohne Diagnosehinweis`);
  }
});

test('Themenseiten: Titel, Beschreibungen und Routen', () => {
  const titles = data.TOPIC_PAGES.map((page) => page.meta.title);
  assert.equal(new Set(titles).size, titles.length, 'Titel sind nicht eindeutig');
  for (const page of data.TOPIC_PAGES) {
    assert.ok(page.meta.title.length <= 60, `${page.slug}: Title ${page.meta.title.length} > 60`);
    assert.ok(page.meta.description.length <= 155, `${page.slug}: Description ${page.meta.description.length} > 155`);
    assert.match(page.meta.title, /\| Esoterik-Welt$/);
    assert.ok(page.meta.teaser.length >= 60, `${page.slug}: Kartenansprache fehlt`);
  }

  const anchors = data.SECTION_ORDER.map((section) => section.anchor);
  const topics = data.TOPIC_PAGES;
  for (const page of topics) {
    const route = model.resolveView([page.slug], data.FARBWELTEN, anchors, topics);
    assert.equal(route.view, 'topic', `${page.slug}: Route nicht erkannt`);
    assert.equal(route.topic.slug, page.slug);
    assert.equal(route.anchor, '');
    const section = page.sections[1];
    assert.equal(
      model.resolveView([page.slug, section.anchor], data.FARBWELTEN, anchors, topics).anchor,
      section.anchor
    );
    assert.equal(model.resolveView([page.slug, 'quatsch'], data.FARBWELTEN, anchors, topics).anchor, '');
    assert.equal(model.ROUTE.topic(page.slug), `#farbwelten/${page.slug}`);
    assert.equal(model.ROUTE.topic(page.slug, section.anchor), `#farbwelten/${page.slug}/${section.anchor}`);
  }
  // Die Themenseiten dürfen die Farbseiten nicht verdrängen.
  assert.equal(model.resolveView(['rot'], data.FARBWELTEN, anchors, topics).view, 'color');
});

test('SEO-Titel und Beschreibungen bleiben im Rahmen der IA', () => {
  const entries = [
    data.LANDING.meta,
    data.CHAKREN_PAGE.meta,
    data.LIGHT_PAGE.meta,
    ...data.FARBWELTEN.map((world) => world.meta),
    ...data.TOPIC_PAGES.map((page) => page.meta),
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
  // Die Datendatei ist die einzige Quelle der Texte — auch für die Themenseiten.
  const module = fs.readFileSync(path.join(root, 'js/modules/farbwelten.js'), 'utf8');
  for (const needle of [
    'Sat-cakra-nirupana',
    'Melanopsin',
    'OSTEBA',
    'Photobiomodulation',
    'Jonauskaite',
    'Bilirubin',
  ]) {
    assert.equal(module.includes(needle), false, `Modul enthält Redaktionstext: ${needle}`);
  }
});

// --- P2-Werkzeuge: Farben-Kompass, Farbmeditation, Zeitleiste --------------

test('Farben-Kompass deckt alle sieben Farbwelten ab und nennt Quellen', () => {
  assert.equal(data.COMPASS.title, 'Farben-Kompass');
  assert.deepEqual(Object.keys(data.COMPASS.worlds).sort(), data.FARBWELTEN.map((world) => world.id).sort());
  for (const world of data.FARBWELTEN) {
    const entry = data.COMPASS.worlds[world.id];
    assert.ok(Array.isArray(entry.associations) && entry.associations.length >= 1, `${world.id}: Assoziationen`);
    for (const label of entry.associations) assert.ok(label.length > 2, `${world.id}: leere Assoziation`);
    assert.ok(entry.kulturell.length > 25, `${world.id}: kulturelle Variante fehlt`);
    assert.equal(entry.hinweis === null || typeof entry.hinweis === 'string', true, `${world.id}: Hinweis`);
    assert.deepEqual(entry.quellen, ['3', '4'], `${world.id}: Assoziationsquellen`);
  }
  assert.match(data.COMPASS.note, /nicht, was eine Farbe über eine Person aussagt/);
  assert.match(data.COMPASS.note, /nicht belegt \[3\]\[9\]/);
});

test('Zeitleiste: chronologisch, jede Station mit Registerquelle', () => {
  assert.ok(data.TIMELINE.events.length >= 15, `nur ${data.TIMELINE.events.length} Ereignisse`);
  const strands = new Set(data.TIMELINE.strands.map((strand) => strand.id));
  assert.equal(strands.size, data.TIMELINE.strands.length);
  let previous = -Infinity;
  for (const event of data.TIMELINE.events) {
    assert.ok(Number.isInteger(event.year), `${event.title}: Jahr`);
    assert.ok(event.year >= previous, `nicht chronologisch: ${event.title}`);
    previous = event.year;
    assert.ok(strands.has(event.strand), `${event.title}: unbekannter Strang ${event.strand}`);
    assert.ok(event.label && event.title && event.text.length > 30, `${event.title}: Felder`);
    assert.ok(Array.isArray(event.sources) && event.sources.length >= 1, `${event.title}: Quelle fehlt`);
    for (const id of event.sources) {
      assert.ok(data.SOURCES[id], `${event.title}: Quelle [${id}] fehlt im Register`);
      assert.ok(data.TIMELINE.sources.includes(id), `${event.title}: [${id}] fehlt in der Quellenliste`);
    }
  }
  assert.equal(data.TIMELINE.events[0].year, 1577);
  assert.equal(data.TIMELINE.events[data.TIMELINE.events.length - 1].year, 2025);
  // Keine Station ohne datierten Beleg (Newton/Goethe sind nicht im Register).
  assert.equal(
    data.TIMELINE.events.some((event) => /newton|goethe/i.test(`${event.title} ${event.text}`)),
    false,
    'Zeitleiste nennt Quellen, die nicht im Register stehen'
  );
});

test('Zeitleisten-Struktur deckt alle fünf Themenstränge ab', () => {
  const used = new Set(data.TIMELINE.events.map((event) => event.strand));
  assert.deepEqual([...used].sort(), data.TIMELINE.strands.map((strand) => strand.id).sort());
  for (const strand of data.TIMELINE.strands) {
    assert.ok(strand.label.length > 3, `${strand.id}: Label`);
    assert.ok(
      data.TIMELINE.events.some((event) => event.strand === strand.id),
      `${strand.id}: leer`
    );
  }
});

test('Farbmeditation: Dauerbereich, Einordnung und Quellen', () => {
  const { min, max, default: preset, step } = data.MEDITATION.dauer;
  assert.equal(min, 1);
  assert.equal(max, 20);
  assert.ok(preset >= min && preset <= max);
  assert.equal(step, 1);
  assert.match(data.MEDITATION.einordnung, /keine Behandlung/);
  assert.match(data.MEDITATION.einordnung, /keine Musik/);
  assert.match(data.MEDITATION.disclaimer, /medizinische Diagnose oder Behandlung/);
  for (const id of data.MEDITATION.sources) assert.ok(data.SOURCES[id], `Quelle [${id}] fehlt`);
});

test('P2-Texte zitieren ausschließlich Nummern des Registers', () => {
  for (const [name, payload] of [
    ['COMPASS', data.COMPASS],
    ['MEDITATION', data.MEDITATION],
    ['TIMELINE', data.TIMELINE],
  ]) {
    const text = JSON.stringify(payload);
    const cited = [...new Set([...text.matchAll(/\[(\d{1,2})\]/g)].map((match) => match[1]))];
    for (const id of cited) {
      assert.ok(data.SOURCES[id], `${name}: [${id}] ohne Registereintrag`);
      assert.ok(payload.sources.includes(id), `${name}: [${id}] zitiert, aber nicht in der Quellenliste`);
    }
    for (const id of payload.sources) assert.ok(data.SOURCES[id], `${name}: Quelle [${id}] fehlt im Register`);
  }
});

test('P2-Metadaten bleiben im Rahmen der IA', () => {
  for (const [name, meta] of [
    ['KOMPASS', data.COMPASS.meta],
    ['MEDITATION', data.MEDITATION.meta],
    ['TIMELINE', data.TIMELINE.meta],
  ]) {
    assert.ok(meta.title.length <= 80, `${name}: Titel zu lang (${meta.title.length})`);
    assert.ok(meta.description.length <= 160, `${name}: Description zu lang (${meta.description.length})`);
    assert.match(meta.title, /\| Esoterik-Welt$/);
  }
});

test('Routen der P2-Werkzeuge und Zeitformat', () => {
  const worlds = data.FARBWELTEN;
  const anchors = data.SECTION_ORDER.map((section) => section.anchor);
  assert.equal(model.resolveView(['kompass'], worlds, anchors).view, 'kompass');
  assert.equal(model.resolveView(['farbmeditation'], worlds, anchors).view, 'meditation');
  assert.equal(model.resolveView(['zeitleiste'], worlds, anchors).view, 'zeitleiste');
  assert.equal(model.resolveView(['kompass', 'extra'], worlds, anchors).view, 'kompass');
  assert.equal(model.resolveView(['unbekannt'], worlds, anchors).view, 'notfound');
  assert.equal(model.ROUTE.compass(), '#farbwelten/kompass');
  assert.equal(model.ROUTE.meditation(), '#farbwelten/farbmeditation');
  assert.equal(model.ROUTE.timeline(), '#farbwelten/zeitleiste');
  for (const page of ['kompass', 'farbmeditation', 'zeitleiste']) {
    assert.ok(model.VIRTUAL_PAGES.includes(page), `${page} fehlt in VIRTUAL_PAGES`);
  }

  assert.equal(model.formatClock(0), '00:00');
  assert.equal(model.formatClock(59), '00:59');
  assert.equal(model.formatClock(60), '01:00');
  assert.equal(model.formatClock(300), '05:00');
  assert.equal(model.formatClock(1200), '20:00');
  assert.equal(model.formatClock(59.4), '00:59');
  assert.equal(model.formatClock(-5), '00:00');
  assert.equal(model.formatClock(Number.NaN), '00:00');
  assert.equal(model.formatClock(undefined), '00:00');
});
