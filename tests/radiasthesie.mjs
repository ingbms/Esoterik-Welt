// Radiästhesie-Modul — Vertrags-, Vollständigkeits- und Renderingtests ohne Browser.
//
// Die Ansichten sind reine Funktionen (Modell + Route hinein, HTML heraus).
// Damit lässt sich in Node prüfen, was tatsächlich gerendert wird: 31 Kapitel,
// 66 Quellen, 13 Glossarbegriffe, auflösbare Quellenmarker, genau eine H1 je
// Ansicht und keine Platzhalter.
//
// Node behandelt .js in diesem Paket als CommonJS; die Browser-Module sind ESM.
// Deshalb werden die unveränderten Dateien in ein temporäres Verzeichnis mit
// eigener package.json ("type":"module") kopiert und von dort importiert.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MODULE_FILES = [
  'js/modules/radiasthesie-format.js',
  'js/modules/radiasthesie-model.js',
  'js/modules/radiasthesie-views.js',
  'js/modules/radiasthesie-vertraege.js',
  'js/modules/pendeltafel-model.js',
  'js/modules/experiment-statistik.js',
  'js/modules/journal-speicher.js',
  'js/data/radiasthesie.js',
  'js/data/radiasthesie-werkstatt.js',
];

const TOPIC_SLUGS = ['radiasthesie', 'pendeln', 'orakel'];
const CHAPTER_COUNTS = { radiasthesie: 10, pendeln: 10, orakel: 12 };
const MAIN_ROUTES = new Set(['#tarot', '#crystals', '#moon', '#runes', '#astrologie', '#blog']);

let tmp;
let views;
let modelModule;
let data;
let model;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rad-views-'));
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }));
  for (const file of MODULE_FILES) {
    const target = path.join(tmp, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  views = await import(pathToFileURL(path.join(tmp, 'js/modules/radiasthesie-views.js')).href);
  modelModule = await import(pathToFileURL(path.join(tmp, 'js/modules/radiasthesie-model.js')).href);
  data = await import(pathToFileURL(path.join(tmp, 'js/data/radiasthesie.js')).href);
  model = modelModule.createModel(data.RADIASTHESIE);
});

after(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

const count = (html, pattern) => (html.match(pattern) || []).length;

// --- Datenbestand ---------------------------------------------------------

test('drei Themenseiten mit vollständigem Kapitelinventar', () => {
  assert.deepEqual(Object.keys(data.RADIASTHESIE.topics).sort(), [...TOPIC_SLUGS].sort());
  for (const slug of TOPIC_SLUGS) {
    const topic = data.RADIASTHESIE.topics[slug];
    assert.equal(topic.sections.length, CHAPTER_COUNTS[slug], `${slug}: Kapitelzahl`);
    const ids = topic.sections.map((section) => section.id);
    assert.equal(new Set(ids).size, ids.length, `${slug}: Anker müssen eindeutig sein`);
    for (const section of topic.sections) {
      assert.ok(section.title.length > 3, `${slug}/${section.id}: Titel fehlt`);
      assert.ok(section.blocks.length > 0, `${slug}/${section.id}: keine Blöcke`);
      assert.ok(section.chips.length > 0, `${slug}/${section.id}: keine Evidenzstufe`);
      for (const chip of section.chips) assert.match(chip, /^[A-E]$/);
    }
    assert.ok(
      topic.sections.some((section) => section.id === 'einordnung') === false,
      `${slug}: Einordnungs-Kapitel gehört in den Kasten`
    );
    assert.ok(topic.disclaimer.tradition.length > 40, `${slug}: Traditionstext fehlt`);
    assert.ok(topic.disclaimer.evidenz.length > 40, `${slug}: Evidenztext fehlt`);
    assert.match(topic.disclaimer.konsequenz, /keine medizinische Beratung/);
  }
});

test('jeder Quellenmarker im Text löst auf eine vorhandene Quelle auf', () => {
  const ids = new Set(data.RADIASTHESIE.sources.map((source) => source.id));
  assert.equal(ids.size, 66);
  const missing = new Set();
  const used = new Set();
  for (const topic of Object.values(data.RADIASTHESIE.topics)) {
    const text = [
      topic.lead,
      ...topic.sections.flatMap((section) =>
        section.blocks.flatMap((block) =>
          block.type === 'ul' ? block.items : block.type === 'callout' ? block.paragraphs : [block.text]
        )
      ),
    ].join(' ');
    for (const match of text.matchAll(/\[(Q\d{2}(?:\s*[,/]\s*Q\d{2})*)\]/g)) {
      for (const id of match[1].split(/[,/]/).map((value) => value.trim())) {
        used.add(id);
        if (!ids.has(id)) missing.add(id);
      }
    }
  }
  assert.equal(missing.size, 0, `unbekannte Quellen: ${[...missing].join(', ')}`);
  assert.ok(used.size >= 25, `zu wenige verwendete Quellen: ${used.size}`);
});

test('Quellenverzeichnis ist vollständig und ohne Platzhalter', () => {
  for (const source of data.RADIASTHESIE.sources) {
    assert.match(source.id, /^Q\d{2}$/);
    assert.ok(source.citation.length > 10, `${source.id}: Zitat fehlt`);
    assert.ok(source.type && source.type !== 'undefined', `${source.id}: Typ fehlt`);
    assert.ok(Array.isArray(source.levels) && source.levels.length > 0, `${source.id}: Stufe fehlt`);
    assert.ok(source.interestNote.length > 10, `${source.id}: Interessenvermerk fehlt`);
    assert.doesNotMatch(source.citation, /undefined|null/);
    assert.ok(source.url.startsWith('http') || source.url.startsWith('ISBN'), `${source.id}: Locator fehlt`);
  }
  // Die vier Quellen, die in der redaktionellen Tabelle fehlten, sind ergänzt.
  for (const id of ['Q11', 'Q14', 'Q18', 'Q30']) {
    assert.ok(
      data.RADIASTHESIE.sources.some((source) => source.id === id),
      `${id} fehlt`
    );
  }
  // Buchquellen: ISBN steht im Locator, Q31 trägt das belegte Erscheinungsjahr 2003.
  const q30 = data.RADIASTHESIE.sources.find((source) => source.id === 'Q30');
  assert.match(q30.locator, /ISBN 978-3-432-84473-2/);
  const q31 = data.RADIASTHESIE.sources.find((source) => source.id === 'Q31');
  assert.equal(q31.year, '2003');
  assert.match(q31.locator, /ISBN 978-3-406-69119-5/);
  assert.match(q31.locator, /lobid\.org/);
});

test('Glossar und Evidenzstufen sind vollständig', () => {
  assert.equal(
    data.RADIASTHESIE.glossary.reduce((sum, group) => sum + group.terms.length, 0),
    17
  );
  for (const group of data.RADIASTHESIE.glossary) {
    assert.match(group.letter, /^[A-Z]$/);
    for (const term of group.terms) {
      assert.ok(term.definition.length > 20, `${term.term}: Definition fehlt`);
      assert.ok(term.levels.length > 0, `${term.term}: Stufe fehlt`);
    }
  }
  assert.deepEqual(
    data.RADIASTHESIE.levels.map((level) => level.key),
    ['A', 'B', 'C', 'D', 'E']
  );
});

// --- Route und Modell -----------------------------------------------------

test('Router-Vokabular wird vollständig aufgelöst', () => {
  assert.equal(model.resolve([]).view, 'landing');
  assert.equal(model.resolve(['radiasthesie']).view, 'topic');
  assert.equal(model.resolve(['radiasthesie']).topic.slug, 'radiasthesie');
  assert.equal(model.resolve(['radiasthesie', 'was']).anchor, 'was');
  assert.equal(model.resolve(['radiasthesie', 'gibtsnicht']).anchor, '', 'unbekannter Anker darf nicht brechen');
  assert.equal(model.resolve(['glossar'], 'b=R').letter, 'R');
  assert.equal(model.resolve(['quellen', 'Q06']).sourceId, 'Q06');
  assert.equal(model.resolve(['quellen', 'Q99']).sourceId, '');
  assert.equal(model.resolve(['methodik']).view, 'methodik');
  assert.equal(model.resolve(['journal']).view, 'journal');
  assert.equal(model.resolve(['suche'], 'q=forer').q, 'forer');
  assert.equal(model.resolve(['gibtsnicht']).view, 'notfound');
});

test('Suche findet Themen, Kapitel, Glossar und Quellen — auch mit Umlauten', () => {
  assert.ok(model.search('').length === 0);
  const wuenschel = model.search('wünschelrute');
  assert.ok(wuenschel.length >= 3, 'Wünschelrute muss mehrere Treffer haben');
  assert.ok(wuenschel.every((result) => result.href.startsWith('#pendeln/')));
  const umlautFrei = model.search('wunschelrute');
  assert.ok(umlautFrei.length >= 3, 'Umlaut-Faltung muss greifen');
  const bovis = model.search('bovis');
  assert.ok(bovis.some((result) => result.type === 'Glossar'));
  const forer = model.search('forer');
  assert.ok(forer.some((result) => result.href.includes('/orakel/')));
  assert.ok(model.search('q').length <= 50);
});

test('Glossarfilter grenzt auf Buchstabe und Suchbegriff ein', () => {
  const r = model.glossary('', 'R');
  assert.equal(r.length, 1);
  assert.equal(r[0].letter, 'R');
  assert.ok(r[0].terms.length >= 3);
  const treffer = model.glossary('bovis', '');
  assert.equal(treffer.length, 1);
  assert.equal(treffer[0].terms[0].term, 'Bovis-Skalen');
  assert.deepEqual(model.glossary('zzz', ''), []);
});

// --- Ansichten ------------------------------------------------------------

function htmlOf(result) {
  return result.html;
}

test('Landingpage: eine H1, drei Themenkarten, Einordnungsband und Stufenlegende', () => {
  const view = views.renderLanding(model);
  const html = htmlOf(view);
  assert.equal(count(html, /<h1/g), 1);
  assert.equal(count(html, /class="rad-topic"/g), 3);
  assert.equal(count(html, /class="rad-status"/g), 1);
  assert.equal(count(html, /class="rad-level"/g), 5);
  assert.equal(count(html, /class="rad-werk"/g), 4);
  assert.ok(html.includes('Was offen bleibt'), 'offene Fragen müssen auf der Landingpage stehen');
  assert.match(view.title, /Radiästhesie, Pendeln und Orakel/);
  assert.ok(view.description.length > 80 && view.description.length <= 180);
  assert.doesNotMatch(html, /Mustertext|Lorem ipsum|TODO|XXX/);
});

test('Themenseiten: Kapitel, Inhaltsverzeichnis, Quellenpanel und Einordnungskasten', () => {
  for (const slug of TOPIC_SLUGS) {
    const topic = model.topics[slug];
    const html = htmlOf(views.renderTopic(model, topic));
    assert.equal(count(html, /<h1/g), 1, `${slug}: genau eine H1`);
    for (const section of topic.sections) {
      assert.ok(html.includes(`id="${section.id}"`), `${slug}: Kapitel ${section.id} fehlt`);
      assert.ok(html.includes(`href="#pendeln/${slug}/${section.id}"`), `${slug}: TOC-Link ${section.id} fehlt`);
    }
    assert.equal(count(html, /class="rad-chip/g) >= topic.sections.length, true, `${slug}: Stufen fehlen`);
    assert.ok(html.includes('Quellen &amp; Belege'), `${slug}: Quellenpanel fehlt`);
    assert.ok(html.includes('Einordnung dieser Seite'), `${slug}: Einordnungskasten fehlt`);
    assert.ok(html.includes('Weiterlesen'), `${slug}: Querverweise fehlen`);
    assert.equal(count(html, /id="pendeln-title"/g), 1);
    // Jeder Quellenmarker im Fließtext ist ein Link, kein Klartext.
    const markers = (html.match(/\[Q\d{2}\]/g) || []).length;
    const links = (html.match(/class="rad-cite"/g) || []).length;
    assert.ok(links > 0, `${slug}: Quellenlinks fehlen`);
    assert.equal(markers, links, `${slug}: Marker ohne Link`);
    // Kein Restmarkup aus den Quelldateien.
    assert.doesNotMatch(html, /\*\*/, `${slug}: ungeparstes Fettmarkup`);
    assert.doesNotMatch(html, /\[Dossier/, `${slug}: interner Dossier-Verweis`);
  }
  // Bovis-Zahlen sind an die belegte Lesart gebunden (6.500 = neutral, nicht "gut").
  const radiasthesieSeite = htmlOf(views.renderTopic(model, model.topics.radiasthesie));
  assert.match(radiasthesieSeite, /Bezugswert ist 6\.500 Bovis-Einheiten/);
  assert.doesNotMatch(radiasthesieSeite, /6\.500 = gut/);
});

test('Themenseite verlinkt nicht auf sich selbst als verwandt', () => {
  for (const slug of TOPIC_SLUGS) {
    const html = htmlOf(views.renderTopic(model, model.topics[slug]));
    const related = html.slice(html.indexOf('Weiterlesen'));
    assert.ok(!related.includes(`href="#pendeln/${slug}"`), `${slug}: Selbstverweis`);
    assert.ok(related.includes('href="#pendeln/glossar"'), `${slug}: Glossarverweis fehlt`);
  }
});

// --- Themenvernetzung (RAD-11) -------------------------------------------

test('Themenvernetzung: alle acht Auftragsthemen sind verortet oder als Lücke entschieden', () => {
  const network = data.RADIASTHESIE.vernetzung;
  const ids = network.map((entry) => entry.id);
  for (const required of ['frequenzen', 'geomantie', 'kraftorte', 'chakren', 'tarot', 'runen', 'iging', 'astrologie']) {
    assert.ok(ids.includes(required), `Auftragsthema ${required} fehlt in der Vernetzung`);
  }
  for (const entry of network) {
    assert.ok(entry.note.length > 20, `${entry.id}: Kurztext fehlt`);
    assert.ok(entry.abgrenzung.length > 20, `${entry.id}: Abgrenzung fehlt`);
    if (entry.status === 'offen') {
      assert.equal(entry.href, '', `${entry.id}: Lücke darf keine Route tragen`);
      assert.equal(entry.pending, true, `${entry.id}: Lücke muss als offen gerendert werden`);
      assert.ok(entry.decision.length > 20, `${entry.id}: Zielentscheidung fehlt`);
    } else {
      assert.match(entry.href, /^#[a-z0-9][a-z0-9/-]*$/i, `${entry.id}: Route fehlt`);
      assert.equal(entry.pending, false, `${entry.id}: verfügbarer Eintrag ist als Lücke markiert`);
    }
  }
});

test('jede verlinkte Vernetzungsroute löst auf und ist eindeutig', () => {
  const seen = new Set();
  for (const entry of data.RADIASTHESIE.vernetzung) {
    if (entry.status !== 'verfuegbar') continue;
    assert.ok(!seen.has(entry.href), `Route doppelt verlinkt: ${entry.href}`);
    seen.add(entry.href);
    if (MAIN_ROUTES.has(entry.href)) continue;
    const [path, query = ''] = entry.href.replace(/^#/, '').split('?');
    const segments = path.split('/').filter(Boolean);
    assert.equal(segments[0], 'pendeln', `${entry.id}: fremde Route ${entry.href}`);
    const route = model.resolve(segments.slice(1), query);
    assert.notEqual(route.view, 'notfound', `${entry.id}: ${entry.href} ist unbekannt`);
  }
});

test('Landingpage trennt vorhandene Anschlüsse von benannten Lücken', () => {
  const html = htmlOf(views.renderLanding(model));
  assert.ok(html.includes('Verwandte Themen'), 'Abschnitt fehlt');
  assert.ok(html.includes('Bewusste Lücken'), 'Lückenabschnitt fehlt');
  assert.ok(html.includes('href="#tarot"'), 'Tarot fehlt');
  assert.ok(html.includes('href="#pendeln/radiasthesie/frequenz"'), 'Frequenzkapitel fehlt');
  assert.ok(html.includes('Geomantie'), 'Geomantie fehlt');
  assert.ok(html.includes('Kraftorte'), 'Kraftorte fehlt');
  const gaps = data.RADIASTHESIE.vernetzung.filter((entry) => entry.pending);
  assert.equal(gaps.length, 2, 'genau zwei benannte Lücken');
  for (const gap of gaps) {
    assert.ok(!html.includes(`href="#${gap.id}"`), `${gap.id}: Lücke darf keinen Link haben`);
  }
  assert.match(html, /Nicht angeschlossen/);
});

test('jede Themenseite verlinkt mindestens zwei andere Module (IA §9)', () => {
  for (const slug of TOPIC_SLUGS) {
    const html = htmlOf(views.renderTopic(model, model.topics[slug]));
    const related = html.slice(html.indexOf('Weiterlesen'));
    const modules = new Set(
      [...related.matchAll(/href="#(tarot|crystals|moon|runes|astrologie|blog)"/g)].map((match) => match[1])
    );
    assert.ok(modules.size >= 2, `${slug}: nur ${[...modules].join(', ') || 'keine'} Fremdmodule verlinkt`);
    assert.ok(related.includes('Glossar'), `${slug}: Glossarverweis fehlt`);
    assert.ok(count(related, /class="rad-related-item"/g) <= 5, `${slug}: mehr als fünf Weiterlesen-Karten`);
  }
});

test('Frequenz, Schwingung und Bovis bleiben getrennt (Auftrag RAD-11)', () => {
  const page = htmlOf(views.renderTopic(model, model.topics.radiasthesie));
  assert.ok(page.includes('Frequenz, Schwingung, Skala'), 'Grenzkapitel fehlt');
  assert.match(page, /Frequenz in Hertz/);
  assert.match(page, /keine SI-Einheit/);
  assert.match(page, /nicht gleichgesetzt/);
  // Absatzweise: kein Absatz stellt Bovis und eine physikalische Einheit
  // nebeneinander — auch nicht über einen Absatzwechsel hinweg.
  const paragraphs = page.split(/<\/(?:p|li|dd)>/).map((chunk) => chunk.replace(/<[^>]+>/g, ' '));
  for (const paragraph of paragraphs) {
    if (!/Bovis/.test(paragraph)) continue;
    assert.doesNotMatch(
      paragraph,
      /\bHz\b|Hertz|Tesla/i,
      `Bovis im selben Absatz wie eine Einheit: ${paragraph.slice(0, 160)}`
    );
  }
  // Ein Deep-Link auf das neue Kapitel löst auf.
  const route = model.resolve(['radiasthesie', 'frequenz']);
  assert.equal(route.view, 'topic');
  assert.equal(route.anchor, 'frequenz');
});

test('Glossar: Buchstabenleiste, Suche und 17 Begriffe', () => {
  const html = htmlOf(views.renderGlossar(model));
  assert.equal(count(html, /class="astro-term"/g), 17);
  assert.equal(count(html, /<h1/g), 1);
  assert.ok(html.includes('id="glossarSuche"'), 'Suchfeld fehlt');
  assert.ok(html.includes('aria-live="polite"'), 'Trefferzahl braucht aria-live');
  assert.equal(
    count(html, /class="astro-letter is-empty"/g),
    26 - new Set(data.RADIASTHESIE.glossary.map((group) => group.letter)).size,
    'leere Buchstaben sind nicht fokussierbar'
  );
  const gefiltert = htmlOf(views.renderGlossar(model, { query: 'bovis' }));
  assert.equal(count(gefiltert, /class="astro-term"/g), 1);
});

test('Quellen: 66 Karten mit Sprungziel und Rückverweis', () => {
  const html = htmlOf(views.renderQuellen(model));
  assert.equal(count(html, /class="astro-source-card[ "]/g), 66);
  for (const source of data.RADIASTHESIE.sources) {
    assert.ok(html.includes(`id="quelle-${source.id}"`), `${source.id}: Anker fehlt`);
  }
  assert.ok(html.includes('Verwendet in'), 'Rückverweis auf die Seiten fehlt');
  assert.ok(
    html.includes('Nicht im Fließtext zitiert'),
    'Referenzliteratur ohne Seitenzuordnung ist nicht gekennzeichnet'
  );
  assert.ok(html.includes('ISBN 978-3-406-69119-5'), 'ISBN von Q31 fehlt');
  assert.ok(!html.includes('href="ISBN'), 'ISBN darf kein Linkziel sein');
  const target = htmlOf(views.renderQuellen(model, { sourceId: 'Q06' }));
  assert.ok(target.includes('id="quelle-Q06"') && target.includes('is-target'));
});

test('Methodik: Abschnitte inklusive Bildnachweise, keine Wirkversprechen', () => {
  const html = htmlOf(views.renderMethodik(model));
  for (const id of [
    'arbeitsannahme',
    'kennzeichnung',
    'pruefung',
    'grenzen',
    'quelleninteressen',
    'datenschutz',
    'bildnachweise',
    'rechtliches',
  ]) {
    assert.ok(html.includes(`id="${id}"`), `${id} fehlt`);
  }
  assert.match(html, /Keine Heil-, Therapie- oder Gesundheitsempfehlung/);
  // Datenschutz muss den lokalen Speicher des Tagebuchs benennen, nicht
  // behaupten, es werde nichts gespeichert (RAD-10 speichert lokal).
  assert.match(html, /lokalen Speicher des Browsers/);
  assert.match(html, /esot_rad_/);
  assert.doesNotMatch(html, /keine Speicherung von Eingaben/);
  assert.doesNotMatch(html, /heilt|garantiert|bewiesen wirksam/i);
});

test('Bildnachweise nennen alle sechs Fotos mit Lizenz und Share-Alike-Hinweis', () => {
  const html = htmlOf(views.renderMethodik(model));
  for (const item of data.RADIASTHESIE.media.items) {
    assert.ok(html.includes(`nachweis-${item.id}`), `${item.id}: Nachweis fehlt`);
    assert.ok(html.includes(item.attribution.slice(0, 40)), `${item.id}: Attributionszeile fehlt`);
    assert.ok(html.includes(item.license.url || item.license.short), `${item.id}: Lizenzlink fehlt`);
  }
  assert.match(html, /CC BY-SA 3\.0/);
  assert.match(html, /Weitergabe unter gleichen Bedingungen|Share-Alike/);
  assert.match(html, /keine LICENSE-Datei/);
});

test('Fotos stehen im passenden Kapitel und tragen Alt-Text, Maße und Attributionszeile', () => {
  const expected = { radiasthesie: 2, pendeln: 2, orakel: 2 };
  for (const slug of TOPIC_SLUGS) {
    const topic = data.RADIASTHESIE.topics[slug];
    const html = htmlOf(views.renderTopic(model, topic));
    assert.equal(count(html, /class="rad-plate rad-plate--photo"/g), expected[slug], `${slug}: Fotoanzahl`);
    const withPhoto = topic.sections.filter((section) => section.photos.length).map((section) => section.id);
    for (const anchor of withPhoto) {
      const start = html.indexOf(`id="${anchor}"`);
      assert.ok(start > -1, `${slug}/${anchor}: Kapitel fehlt`);
      const next = html.indexOf('<section class="astro-section"', start + 10);
      const chunk = html.slice(start, next === -1 ? undefined : next);
      assert.match(chunk, /<picture>/, `${slug}/${anchor}: kein <picture>`);
      assert.match(chunk, /type="image\/avif"/, `${slug}/${anchor}: keine AVIF-Quelle`);
      assert.match(chunk, /width="\d+" height="\d+"/, `${slug}/${anchor}: Maße fehlen`);
      assert.match(chunk, /class="rad-photo-credit"/, `${slug}/${anchor}: Attribution fehlt`);
    }
  }
});

test('Suche und Fehleransicht führen immer zurück', () => {
  const treffer = htmlOf(views.renderSuche(model, 'bovis'));
  assert.ok(treffer.includes('<h1'));
  assert.ok(treffer.includes('Treffer'));
  assert.ok(treffer.includes('href="#pendeln/quellen/Q'), 'Quellentreffer fehlen');
  const leer = htmlOf(views.renderSuche(model, ''));
  assert.ok(leer.includes('Bitte einen Suchbegriff'));
  const nichts = htmlOf(views.renderSuche(model, 'qqqq'));
  assert.ok(nichts.includes('Kein Treffer'));
  const fehler = htmlOf(views.renderNotFound(model, 'xyz'));
  assert.equal(count(fehler, /class="rad-related-item"/g), 3);
  assert.ok(fehler.includes('href="#pendeln"'));
  assert.doesNotMatch(fehler, /<h3/, 'Fehleransicht darf nicht von H1 auf H3 springen');
});

test('HTML wird escaped, Daten erscheinen nicht als Markup', async () => {
  const format = await import(pathToFileURL(path.join(tmp, 'js/modules/radiasthesie-format.js')).href);
  const html = format.inlineText('<script>alert(1)</script> **fett** [Q01]');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('<strong>fett</strong>'));
  assert.ok(html.includes('href="#pendeln/quellen/Q01"'));
});

test('BreadcrumbList ist gültiges JSON-LD', () => {
  const json = views.breadcrumbStructuredData([
    { label: 'Start', href: '#home' },
    { label: 'Pendeln', href: '#pendeln' },
    { label: 'Radiästhesie' },
  ]);
  const parsed = JSON.parse(JSON.stringify(json));
  assert.equal(parsed['@type'], 'BreadcrumbList');
  assert.equal(parsed.itemListElement.length, 2, 'das aktuelle Element trägt keine URL');
  assert.ok(parsed.itemListElement.every((entry) => entry.item.startsWith('https://')));
});
