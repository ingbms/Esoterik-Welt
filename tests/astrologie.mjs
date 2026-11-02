// Astrologie — Vertrags-, Vollständigkeits- und Renderingtests ohne Browser.
//
// Die Ansichten sind reine Funktionen (Modell + Zustand hinein, HTML heraus).
// Damit lässt sich in Node prüfen, was tatsächlich gerendert wird: alle zwölf
// Zeichen, zehn Faktoren, zwölf Häuser, fünf Aspekte, vier Beispiele, 15
// FAQ-Antworten, 65 Glossarbegriffe, 25 Quellen und 28 Claims — mit auflösbaren
// Querverweisen, Quellenlinks und ohne Platzhalter.
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
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generator = require('../scripts/generate-astrologie-data.cjs');

const MODULE_FILES = [
  'js/modules/astrologie-format.js',
  'js/modules/astrologie-model.js',
  'js/modules/astrologie-views.js',
  'js/modules/astrologie-views-reference.js',
  'js/data/astrologie.js',
];

let tmp;
let views;
let refViews;
let model;
let data;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-views-'));
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }));
  for (const file of MODULE_FILES) {
    const target = path.join(tmp, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  const load = (file) => import(pathToFileURL(path.join(tmp, file)).href);
  views = await load('js/modules/astrologie-views.js');
  refViews = await load('js/modules/astrologie-views-reference.js');
  const modelModule = await load('js/modules/astrologie-model.js');
  data = await load('js/data/astrologie.js');
  model = modelModule.createModel(data);
});

after(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

const render = (view) => {
  assert.ok(view && typeof view.html === 'string' && view.html.length > 0, 'view must return html');
  assert.ok(view.title && view.title.length > 10, 'view must return a document title');
  return view.html;
};

// --- Datengrundlage -------------------------------------------------------

test('generated data module matches the approved content package byte for byte', () => {
  const built = generator.build();
  const shipped = fs.readFileSync(path.join(root, 'js/data/astrologie.js'), 'utf8');
  assert.equal(shipped, built.source, 'js/data/astrologie.js is stale — run npm run data:astrologie');
});

test('all required counts are present and rendered from the same data', () => {
  assert.deepEqual(model.counts, {
    zeichen: 12,
    faktoren: 10,
    haeuser: 12,
    aspekte: 5,
    grundlagen: 24,
    beispiele: 4,
    faq: 15,
    glossar: 65,
    lernpfad: 6,
    quellen: 25,
    claims: 28,
  });
});

test('every id, slug and cross reference resolves', () => {
  let checked = 0;
  for (const dataset of [
    'zeichen',
    'faktoren',
    'haeuser',
    'aspekte',
    'grundlagen',
    'beispiele',
    'faq',
    'glossar',
    'lernpfad',
  ]) {
    for (const item of model.datasets[dataset]) {
      assert.ok(item.slug, `${item.id} needs a slug`);
      for (const field of ['cross_refs', 'see_also', 'related', 'refs']) {
        for (const ref of item[field] || []) {
          const resolved = model.resolve(ref);
          assert.ok(resolved.found, `${item.id}: ${field} ${ref} does not resolve`);
          assert.match(resolved.href, /^#astrologie\//, `${item.id}: ${ref} must link into the area`);
          checked += 1;
        }
      }
      for (const step of [...(item.steps || []), ...(item.schritte || [])]) {
        for (const ref of step.refs || []) {
          assert.ok(model.resolve(ref).found, `${item.id}: step ref ${ref} does not resolve`);
          checked += 1;
        }
      }
    }
  }
  assert.ok(checked > 300, `expected a dense reference net, only checked ${checked}`);
});

test('every source reference and inline marker points at a real ledger entry', () => {
  const sourceIds = new Set(model.datasets.quellen.map((entry) => entry.id));
  const claimIds = new Set(model.datasets.claims.map((entry) => entry.id));
  for (const dataset of ['zeichen', 'faktoren', 'haeuser', 'aspekte', 'grundlagen', 'beispiele', 'faq', 'glossar']) {
    for (const item of model.datasets[dataset]) {
      for (const id of item.sources || []) assert.ok(sourceIds.has(id), `${item.id}: unknown source ${id}`);
      for (const id of item.claims || []) assert.ok(claimIds.has(id), `${item.id}: unknown claim ${id}`);
    }
  }
  // Rendered long texts must not leave a raw [Sxx] marker behind — every marker
  // has to be a link into the source ledger, not plain text.
  for (const item of model.datasets.zeichen) {
    const html = render(views.renderZeichenDetail(model, item));
    const withoutMarkerLinks = html
      .replace(/<p class="astro-panel-note">[\s\S]*?<\/p>/g, '')
      .replace(/<a class="astro-marker"[^>]*>\[S\d{2}\]<\/a>/g, '');
    assert.doesNotMatch(withoutMarkerLinks, /\[S\d{2}\]/, `${item.id}: raw source marker left in HTML`);
    for (const match of html.matchAll(/href="#astrologie\/quellen\?quelle=(S\d{2})"/g)) {
      assert.ok(sourceIds.has(match[1]), `${item.id}: marker link to unknown source ${match[1]}`);
    }
  }
});

// --- Hub ------------------------------------------------------------------

test('hub renders four entries, the legend and the no-calculation notice', () => {
  const html = render(views.renderHub(model));
  for (const text of ['Neu hier? Lernpfad', 'Etwas nachschlagen', 'Verstehen, warum', 'Vorsichtig lesen']) {
    assert.ok(html.includes(text), `hub entry missing: ${text}`);
  }
  for (const label of ['Deutungstradition', 'Astronomie', 'Konvention', 'Empirie', 'Historisch', 'Gemischt']) {
    assert.ok(html.includes(label), `legend entry missing: ${label}`);
  }
  assert.match(html, /Keine Berechnung, keine Geburtsdaten/);
  assert.match(html, /<h1 id="astro-title"/);
  assert.equal((html.match(/<h1/g) || []).length, 1, 'exactly one h1 per view');
});

// --- Lernpfad -------------------------------------------------------------

test('learning path renders six stages and every stage detail', () => {
  const index = render(views.renderLernpfadIndex(model));
  for (const stage of model.datasets.lernpfad) {
    assert.ok(index.includes(stage.title), `stage missing in index: ${stage.title}`);
    const detail = render(views.renderLernpfadDetail(model, stage));
    assert.ok(detail.includes(stage.goal.slice(0, 40)), `${stage.id}: goal missing`);
    for (const question of stage.check_questions) {
      assert.ok(detail.includes(question.slice(0, 25)), `${stage.id}: question missing`);
    }
    for (const step of stage.steps) assert.ok(detail.includes(step.title), `${stage.id}: step ${step.title} missing`);
  }
  assert.equal((index.match(/class="astro-stage"/g) || []).length, 6);
});

// --- Zeichen --------------------------------------------------------------

test('all twelve signs render fully in index and detail', () => {
  const index = render(views.renderZeichenIndex(model, { element: 'all', modality: 'all', q: '' }));
  assert.equal((index.match(/class="astro-card"/g) || []).length, 12);
  for (const sign of model.datasets.zeichen) {
    assert.ok(index.includes(sign.name), `sign missing in index: ${sign.name}`);
    const html = render(views.renderZeichenDetail(model, sign));
    assert.ok(html.includes(sign.name), `${sign.id}: name missing`);
    assert.ok(html.length > 4000, `${sign.id}: detail looks like a stub (${html.length} chars)`);
    for (const strength of sign.strengths)
      assert.ok(html.includes(strength.slice(0, 30)), `${sign.id}: strength missing`);
    for (const tension of sign.tensions) assert.ok(html.includes(tension.slice(0, 30)), `${sign.id}: tension missing`);
    for (const question of sign.reflection_questions)
      assert.ok(html.includes(question.slice(0, 25)), `${sign.id}: question missing`);
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.match(html, /astro-badge--(deutungstradition|gemischt|astronomie|konvention|empirie|historisch)/);
  }
});

test('sign filters and search return correct counts and an empty state', () => {
  const feuer = model.filterZeichen({ element: 'element-feuer' });
  assert.equal(feuer.length, 3);
  for (const sign of feuer) assert.equal(sign.element, 'element-feuer');
  assert.equal(model.filterZeichen({ modality: 'modalitaet-fix' }).length, 4);
  assert.equal(model.filterZeichen({ element: 'element-wasser', modality: 'modalitaet-kardinal' }).length, 1);
  assert.equal(model.filterZeichen({ q: 'mars' }).length > 0, true);

  const filtered = render(views.renderZeichenIndex(model, { element: 'element-wasser', modality: 'all', q: '' }));
  assert.equal((filtered.match(/class="astro-card"/g) || []).length, 3);

  const empty = render(views.renderZeichenIndex(model, { element: 'element-luft', modality: 'all', q: 'zzzz' }));
  assert.equal((empty.match(/class="astro-card"/g) || []).length, 0);
  assert.match(empty, /Keine Zeichen für diese Auswahl/);
  assert.match(empty, /id="astro-empty"/);
  assert.doesNotMatch(empty, /id="astro-empty" hidden/);
});

// --- Faktoren, Häuser, Aspekte -------------------------------------------

test('ten factors render with astronomy, themes and questions', () => {
  const index = render(views.renderFaktorenIndex(model, { q: '' }));
  assert.equal((index.match(/class="astro-card"/g) || []).length, 10);
  for (const factor of model.datasets.faktoren) {
    const html = render(views.renderFaktorenDetail(model, factor));
    assert.ok(html.includes(factor.name));
    assert.ok(html.includes(factor.astronomy.visibility.slice(0, 25)), `${factor.id}: astronomy missing`);
    for (const theme of factor.themes.slice(0, 3)) assert.ok(html.includes(theme), `${factor.id}: theme missing`);
    assert.ok(html.length > 3000, `${factor.id}: detail too short`);
  }
  for (const kind of ['leuchtkoerper', 'planet', 'zwergplanet']) {
    assert.ok(index.includes(`astro-faktoren-${kind}`), `group missing: ${kind}`);
  }
});

test('twelve houses render with themes, questions and the caution box', () => {
  const index = render(views.renderHaeuserIndex(model));
  assert.equal((index.match(/class="astro-card"/g) || []).length, 12);
  for (const house of model.datasets.haeuser) {
    const html = render(views.renderHaeuserDetail(model, house));
    assert.ok(html.includes(house.name), `${house.id}: name missing`);
    assert.ok(html.includes(house.caution.slice(0, 30)), `${house.id}: caution missing`);
    for (const question of house.questions)
      assert.ok(html.includes(question.slice(0, 25)), `${house.id}: question missing`);
  }
});

test('five aspects render with angle and orb conventions', () => {
  const index = render(views.renderAspekteIndex(model));
  assert.equal((index.match(/class="astro-card"/g) || []).length, 5);
  const angles = new Set();
  for (const aspect of model.datasets.aspekte) {
    angles.add(aspect.angle_deg);
    const html = render(views.renderAspekteDetail(model, aspect));
    assert.ok(html.includes(`${aspect.angle_deg} Grad`), `${aspect.id}: angle missing`);
    assert.ok(html.includes(aspect.orb.schulhinweis.slice(0, 30)), `${aspect.id}: orb note missing`);
    assert.ok(html.includes(aspect.common_misreading.slice(0, 30)), `${aspect.id}: misreading missing`);
  }
  assert.deepEqual(
    [...angles].sort((a, b) => a - b),
    [0, 60, 90, 120, 180]
  );
});

// --- Grundlagen, Beispiele, FAQ, Glossar --------------------------------

test('24 basics render grouped in three levels with core points', () => {
  const index = render(refViews.renderGrundlagenIndex(model, { level: 'all', q: '' }));
  for (const level of ['grundlagen', 'vertiefung', 'nachschlagen']) {
    assert.ok(index.includes(`astro-ebene-${level}`), `level group missing: ${level}`);
  }
  assert.equal((index.match(/<h3><a href="#astrologie\/grundlagen\//g) || []).length, 24);
  for (const item of model.datasets.grundlagen) {
    const html = render(refViews.renderGrundlagenDetail(model, item));
    assert.ok(html.includes(item.title || item.name), `${item.id}: title missing`);
    for (const point of item.key_points) assert.ok(html.includes(point.slice(0, 30)), `${item.id}: key point missing`);
    assert.ok(html.length > 3000, `${item.id}: detail too short`);
  }
});

test('four fictional examples render assumptions, steps, synthesis and limits', () => {
  const index = render(refViews.renderBeispieleIndex(model));
  assert.equal((index.match(/class="astro-card"/g) || []).length, 4);
  assert.match(index, /Fiktive Lehrbeispiele/);
  for (const example of model.datasets.beispiele) {
    const html = render(refViews.renderBeispieleDetail(model, example));
    assert.ok(html.includes(example.titel), `${example.id}: title missing`);
    assert.ok(html.includes(example.disclaimer.slice(0, 40)), `${example.id}: disclaimer missing`);
    assert.match(html, /Keine berechnete Radix, keine realen Personen, keine Gradangaben/);
    for (const assumption of example.annahmen)
      assert.ok(html.includes(assumption.slice(0, 30)), `${example.id}: assumption missing`);
    for (const step of example.schritte)
      assert.ok(html.includes(step.titel), `${example.id}: step ${step.titel} missing`);
    assert.ok(html.includes(example.synthese.slice(0, 40)), `${example.id}: synthesis missing`);
    assert.ok(html.includes(example.alternative_lesart.slice(0, 40)), `${example.id}: alternative reading missing`);
    for (const limit of example.grenzen) assert.ok(html.includes(limit.slice(0, 25)), `${example.id}: limit missing`);
  }
});

test('15 FAQ answers render with short and long answer and related links', () => {
  const html = render(refViews.renderFaq(model));
  assert.equal((html.match(/class="astro-details astro-faq-item"/g) || []).length, 15);
  for (const entry of model.datasets.faq) {
    assert.ok(html.includes(entry.frage.replace(/&/g, '&amp;')), `${entry.id}: question missing`);
    assert.ok(
      html.includes(entry.short_answer.slice(0, 40).replace(/&/g, '&amp;')),
      `${entry.id}: short answer missing`
    );
  }
  const selected = render(refViews.renderFaq(model, model.datasets.faq[0].slug));
  assert.match(selected, /class="astro-details astro-faq-item" id="faq-[a-z0-9-]+" open/);
});

test('65 glossary terms render alphabetically with see-also links', () => {
  const html = render(refViews.renderGlossar(model, { q: '' }));
  assert.equal((html.match(/id="gloss-[a-z0-9-]+"/g) || []).length, 65);
  for (const entry of model.datasets.glossar) {
    assert.ok(html.includes(entry.term.replace(/&/g, '&amp;')), `${entry.id}: term missing`);
  }
  const letters = [...html.matchAll(/id="glossar-([A-Z])"/g)].map((match) => match[1]);
  assert.deepEqual(letters, [...letters].sort(), 'glossary groups must be alphabetical');
  const filtered = render(refViews.renderGlossar(model, { q: 'orbis' }));
  assert.ok((filtered.match(/id="gloss-[a-z0-9-]+"/g) || []).length > 0);
  const empty = render(refViews.renderGlossar(model, { q: 'zzzzz' }));
  assert.match(empty, /Keine Begriffe für/);
  assert.doesNotMatch(empty, /id="gloss-[a-z0-9-]+"/);
});

// --- Quellen, Methodik, Suche, Fehler -----------------------------------

test('source ledger renders all 25 sources and 28 claims with fetch status', () => {
  const html = render(refViews.renderQuellen(model, {}));
  for (const source of model.datasets.quellen) {
    assert.ok(html.includes(`id="quelle-${source.id}"`), `source missing: ${source.id}`);
    assert.ok(html.includes(source.abrufstatus), `${source.id}: fetch status missing`);
    assert.ok(html.includes(source.rechte_hinweis.slice(0, 20)), `${source.id}: rights note missing`);
  }
  for (const claim of model.datasets.claims) {
    assert.ok(html.includes(`id="claim-${claim.id}"`), `claim missing: ${claim.id}`);
  }
  const targeted = render(refViews.renderQuellen(model, { quelle: 'S11' }));
  assert.match(targeted, /id="quelle-S11"/);
  assert.match(targeted, /astro-source-card is-target" id="quelle-S11"/);
});

test('method page states assumption, evidence, no-calculation and privacy', () => {
  const html = render(refViews.renderMethodik(model));
  for (const needle of ['Arbeitsannahme', 'Evidenzlage', 'Keine Berechnung', 'Keine Geburtsdaten', 'Datenschutz']) {
    assert.ok(html.includes(needle), `method page missing: ${needle}`);
  }
  assert.ok(html.includes(model.meta.arbeitsannahme.zeichen.slice(0, 40)));
});

test('search is diacritic-insensitive, grouped and has a real empty state', () => {
  assert.equal(model.search('gross').total, model.search('groß').total);
  assert.ok(model.search('mond').total > 3);
  const grouped = render(refViews.renderSuche(model, 'mond'));
  assert.match(grouped, /Treffer für/);
  assert.match(grouped, /id="astro-suche-/);
  for (const hit of model.search('mond').results) {
    assert.ok(grouped.includes(hit.title.replace(/&/g, '&amp;')), `search hit missing: ${hit.title}`);
  }
  const empty = render(refViews.renderSuche(model, 'xyzzy'));
  assert.match(empty, /Keine Treffer für/);
  assert.match(empty, /Suche zurücksetzen/);
  assert.equal(model.search('').total, 0);
  assert.equal(model.search('xyzzy').total, 0);
  assert.ok(model.search('e').results.length <= 50);
});

test('unknown sub-route renders an in-area error view with real links', () => {
  const html = render(refViews.renderNotFound(model, 'astrologie/zeichen/gibtesnicht'));
  assert.match(html, /Unbekannter Pfad/);
  assert.ok(html.includes('href="#astrologie"'));
  assert.ok(html.includes('href="#astrologie/suche"'));
  const failure = render(refViews.renderFailure('Testfehler'));
  assert.match(failure, /Testfehler/);
});

// --- Gemeinsame Qualitätsregeln -----------------------------------------

test('every view avoids placeholders, dead hashes and unsafe markup', () => {
  const rendered = [
    views.renderHub(model),
    views.renderLernpfadIndex(model),
    ...model.datasets.lernpfad.map((item) => views.renderLernpfadDetail(model, item)),
    views.renderZeichenIndex(model, {}),
    ...model.datasets.zeichen.map((item) => views.renderZeichenDetail(model, item)),
    views.renderFaktorenIndex(model, {}),
    ...model.datasets.faktoren.map((item) => views.renderFaktorenDetail(model, item)),
    views.renderHaeuserIndex(model),
    ...model.datasets.haeuser.map((item) => views.renderHaeuserDetail(model, item)),
    views.renderAspekteIndex(model),
    ...model.datasets.aspekte.map((item) => views.renderAspekteDetail(model, item)),
    refViews.renderGrundlagenIndex(model, {}),
    ...model.datasets.grundlagen.map((item) => refViews.renderGrundlagenDetail(model, item)),
    refViews.renderBeispieleIndex(model),
    ...model.datasets.beispiele.map((item) => refViews.renderBeispieleDetail(model, item)),
    refViews.renderFaq(model),
    refViews.renderGlossar(model, {}),
    refViews.renderQuellen(model, {}),
    refViews.renderMethodik(model),
    refViews.renderSuche(model, 'mond'),
    refViews.renderNotFound(model, 'astrologie/x'),
    refViews.renderFailure('Test'),
  ];
  for (const view of rendered) {
    const html = render(view);
    assert.doesNotMatch(html, /\b(undefined|NaN|\[object Object\])\b/, 'rendering artefact in output');
    assert.doesNotMatch(html, /href="#"/, 'empty hash link');
    assert.doesNotMatch(html, /href="javascript:/i, 'javascript: link');
    assert.doesNotMatch(html, /\bTODO\b|\bFIXME\b|Lorem ipsum/, 'placeholder text');
    assert.doesNotMatch(html, /<script/i, 'no scripts inside rendered content');
    assert.equal((html.match(/<h1/g) || []).length, 1, 'exactly one h1 per view');
  }
});

test('internal links only use known area routes', () => {
  const known = new Set([
    'lernpfad',
    'zeichen',
    'faktoren',
    'haeuser',
    'aspekte',
    'grundlagen',
    'beispiele',
    'faq',
    'glossar',
    'quellen',
    'methodik',
    'suche',
  ]);
  const rendered = [
    views.renderHub(model),
    views.renderZeichenIndex(model, {}),
    views.renderZeichenDetail(model, model.datasets.zeichen[0]),
    refViews.renderGlossar(model, {}),
    refViews.renderMethodik(model),
    refViews.renderSuche(model, 'mond'),
  ];
  for (const view of rendered) {
    const html = render(view);
    for (const match of html.matchAll(/href="#astrologie(?:\/([^"?#/]*))?([^"]*)"/g)) {
      const area = match[1];
      if (!area) continue;
      assert.ok(known.has(area), `unknown area route in link: #astrologie/${area}`);
    }
    // In-page anchors must never be plain hashes (the router would eat them).
    // Cross-area links are deliberate and limited to the astronomically
    // calculated moon area and the tarot area.
    const crossArea = new Set(['moon', 'tarot']);
    for (const match of html.matchAll(/href="#([^"]*)"/g)) {
      const target = match[1];
      if (target.startsWith('astrologie')) continue;
      assert.ok(crossArea.has(target), `unexpected hash link: #${target}`);
    }
  }
});
