/**
 * Unit-Tests für `src/lib/toc.ts` (Kanban `t_3c130426`).
 *
 * Warum ein Übersetzungsschritt vor dem Import: Das Projekt ist CommonJS
 * (`"type": "commonjs"`), die Bibliothek ist TypeScript. Node behandelt `.ts`
 * in einem CommonJS-Paket als CommonJS und kann die ESM-Syntax darin nicht
 * laden. Der Test übersetzt die echte Quelldatei deshalb mit dem bereits
 * vorhandenen TypeScript (`devDependencies`) nach ESM in `test-results/` und
 * importiert genau diese Ausgabe — geprüft wird also der Produktionscode, nicht
 * eine Nachbildung. Kein zusätzliches Paket, kein Netzwerk.
 *
 * Abdeckung: Spezifikation §6.1–§6.3, §6.6, §14.3 sowie Testfälle TF-04,
 * TF-06, TF-11, TF-12, TF-13 aus §8.
 *
 * Aufruf: `npm run test:toc` (oder `node --test tests/toc-unit.mjs`).
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const buildDir = join(root, 'test-results', 'toc-unit');
mkdirSync(buildDir, { recursive: true });

const sourcePath = join(root, 'src', 'lib', 'toc.ts');
const compiledPath = join(buildDir, 'toc.mjs');

const transpiled = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    isolatedModules: true,
  },
  fileName: 'toc.ts',
  reportDiagnostics: true,
});

const errors = (transpiled.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
);
assert.equal(errors.length, 0, `TypeScript meldet Syntaxfehler in toc.ts: ${JSON.stringify(errors)}`);
writeFileSync(compiledPath, transpiled.outputText, 'utf8');

const toc = await import(pathToFileURL(compiledPath).href);

/**
 * Sollzustand der Pilotseite `/frequenzen/quellen.html` — wörtlich aus
 * Spezifikation §14.1 (dort am Build `9d14d37` gemessen). Zugleich Testvektor
 * für TF-05 und Grundlage der Ebenen- und Verschachtelungstests.
 */
const QUELLEN_HEADINGS = [
  [2, 'frequenzen-quellen-evidenzstatus-und-methodik', 'Frequenzen: Quellen, Evidenzstatus und Methodik'],
  [2, '1-zweck-und-geltungsbereich', '1. Zweck und Geltungsbereich'],
  [2, '2-suchstrategie-und-aufnahmekriterien', '2. Suchstrategie und Aufnahmekriterien'],
  [2, '3-evidenzstatus-im-einzelnen', '3. Evidenzstatus im Einzelnen'],
  [2, '4-datenschema', '4. Datenschema'],
  [2, '5-claim-quelle-matrix', '5. Claim-Quelle-Matrix'],
  [3, '51-physikalisch--physiologisch', '5.1 Physikalisch / physiologisch'],
  [3, '52-esoterisch--traditionell', '5.2 Esoterisch / traditionell'],
  [2, '6-einzelprüfungen', '6. Einzelprüfungen'],
  [3, '61-eeg-bänder-warum-bereiche-und-keine-punktwerte', '6.1 EEG-Bänder: Warum Bereiche und keine Punktwerte'],
  [3, '62-hörbereich-und-infraschall', '6.2 Hörbereich und Infraschall'],
  [3, '63-stimmton-historie', '6.3 Stimmton-Historie'],
  [
    3,
    '64-schwebung-binaurale-beats-und-die-entrainment-frage',
    '6.4 Schwebung, binaurale Beats und die Entrainment-Frage',
  ],
  [3, '65-solfeggio-primärquelle-und-beweislage', '6.5 Solfeggio: Primärquelle und Beweislage'],
  [
    3,
    '66-planetenfrequenzen-rechnung-nachvollziehbar-deutung-nicht',
    '6.6 Planetenfrequenzen: Rechnung nachvollziehbar, Deutung nicht',
  ],
  [3, '67-432-hz-kleiner-effekt-keine-gesundheitswirkung', '6.7 432 Hz: kleiner Effekt, keine Gesundheitswirkung'],
  [3, '68-40-hz-mausmodell--therapie', '6.8 40 Hz: Mausmodell ≠ Therapie'],
  [3, '69-rife-und-bioresonanz-zahlen-ohne-wirknachweis', '6.9 Rife und Bioresonanz: Zahlen ohne Wirknachweis'],
  [
    3,
    '610-cymatics-und-chladni-figuren-figur-statt-frequenz',
    '6.10 Cymatics und Chladni-Figuren: Figur statt Frequenz',
  ],
  [3, '611-klangschalen-mantras-chakren', '6.11 Klangschalen, Mantras, Chakren'],
  [3, '612-solfeggio-erweiterungen-174285963-hz', '6.12 Solfeggio-Erweiterungen 174/285/963 Hz'],
  [2, '7-bewusst-nicht-aufgenommene-einträge', '7. Bewusst nicht aufgenommene Einträge'],
  [
    3,
    '71-bewusst-aufgenommene-grenzfälle-nachtrag-zu-befund-b2',
    '7.1 Bewusst aufgenommene Grenzfälle (Nachtrag zu Befund B2)',
  ],
  [2, '8-widersprüche-grenzen-offene-punkte', '8. Widersprüche, Grenzen, offene Punkte'],
  [2, '9-disclaimer-verbindlicher-text', '9. Disclaimer (verbindlicher Text)'],
  [2, '10-reproduktion-und-prüfung', '10. Reproduktion und Prüfung'],
  [2, '11-hinweise-für-ui-und-audio-engine', '11. Hinweise für UI und Audio-Engine'],
  [2, '12-quellenverzeichnis', '12. Quellenverzeichnis'],
  [2, '13-änderungslog', '13. Änderungslog'],
].map(([depth, slug, text]) => ({ depth, slug, text }));

/* ------------------------------------------------------------------------- */
/* §14.3 — normative Slug-Vektoren (TF-11, AK-C3)                            */
/* ------------------------------------------------------------------------- */

test('Slug-Vektoren aus §14.3 werden exakt erzeugt', () => {
  const vectors = [
    ['6. Einzelprüfungen', '6-einzelprüfungen'],
    ['6.1 EEG-Bänder: Warum Bereiche und keine Punktwerte', '61-eeg-bänder-warum-bereiche-und-keine-punktwerte'],
    ['5.1 Physikalisch / physiologisch', '51-physikalisch--physiologisch'],
    ['Einführung: Warum Farben uns berühren', 'einführung-warum-farben-uns-berühren'],
    [
      'Lichtmedizin und Chromotherapie – der entscheidende Unterschied',
      'lichtmedizin-und-chromotherapie--der-entscheidende-unterschied',
    ],
    ['40 Hz: Mausmodell ≠ Therapie', '40-hz-mausmodell--therapie'],
    ['«Café» & Crème — 100 %', 'café--crème--100-'],
    ['Straße/Öl (2026)', 'straßeöl-2026'],
  ];
  for (const [input, expected] of vectors) {
    assert.equal(toc.slugifyHeading(input), expected, `Vektor "${input}"`);
  }
});

test('Umlaute und Sonderzeichen werden nicht transliteriert (AK-C3)', () => {
  assert.equal(toc.slugifyHeading('6. Einzelprüfungen'), '6-einzelprüfungen');
  assert.equal(toc.slugifyHeading('Widersprüche, Grenzen'), 'widersprüche-grenzen');
});

test('gleiche Texte werden durchnummeriert, auch gegen vorhandene IDs (TF-12, AK-C4)', () => {
  const slugger = toc.createTocSlugger(['wissen']);
  assert.equal(slugger.slugFor('Wissen', 1), 'wissen-1');
  assert.equal(slugger.slugFor('Wissen', 2), 'wissen-2');
  assert.equal(slugger.slugFor('Wissen', 3), 'wissen-3');

  const fresh = toc.createTocSlugger();
  assert.equal(fresh.slugFor('Wissen', 1), 'wissen');
  assert.equal(fresh.slugFor('Wissen', 2), 'wissen-1');
  assert.equal(fresh.slugFor('Wissen', 3), 'wissen-2');
});

test('leerer Slug wird zu abschnitt-<n>, Kollisionen bleiben eindeutig (AK-C7)', () => {
  const slugger = toc.createTocSlugger();
  assert.equal(slugger.slugFor('???', 4), 'abschnitt-4');
  assert.equal(slugger.slugFor('!!!', 5), 'abschnitt-5');
  assert.equal(slugger.slugFor('???', 4), 'abschnitt-4-1');
});

test('Textnormalisierung entfernt Inline-Markup, löst Entitäten und faltet Whitespace', () => {
  assert.equal(
    toc.normalizeTocText('  <em>40 Hz</em>:   Mausmodell\n&#8800;  Therapie '),
    '40 Hz: Mausmodell ≠ Therapie'
  );
  assert.equal(toc.normalizeTocText('A &amp; B'), 'A & B');
  assert.equal(toc.normalizeTocText('x&#160;&#160;y'), 'x y');
  assert.equal(toc.normalizeTocText('   '), '');
});

/* ------------------------------------------------------------------------- */
/* Auswahl, Ebenen, Leerzustand (§6.1, §6.6; TF-04, TF-06)                   */
/* ------------------------------------------------------------------------- */

test('Pilotseite ergibt 29 Einträge in Dokumentreihenfolge (AK-B1, AK-B2)', () => {
  const tree = toc.buildTocTree(QUELLEN_HEADINGS);
  assert.ok(tree, 'Verzeichnis muss entstehen');
  assert.equal(tree.count, 29);
  const flat = toc.flattenToc(tree.items);
  assert.deepEqual(
    flat.map((node) => [node.depth, node.slug, node.text]),
    QUELLEN_HEADINGS.map(({ depth, slug, text }) => [depth, slug, text])
  );
});

test('levels=[2] ergibt 14 Einträge, levels=[2,3,4] bleibt bei 29 (AK-B3, AK-B4)', () => {
  const onlyH2 = toc.buildTocTree(QUELLEN_HEADINGS, { levels: [2] });
  assert.ok(onlyH2);
  assert.equal(onlyH2.count, 14);
  assert.ok(toc.flattenToc(onlyH2.items).every((node) => node.depth === 2));

  const withH4 = toc.buildTocTree(QUELLEN_HEADINGS, { levels: [2, 3, 4] });
  assert.ok(withH4);
  assert.equal(withH4.count, 29);
});

test('unter minHeadings entsteht kein Verzeichnis (AK-A4, TF-04)', () => {
  assert.equal(toc.buildTocTree([]), null);
  assert.equal(toc.buildTocTree(undefined), null);
  assert.equal(toc.buildTocTree(null), null);
  assert.equal(toc.buildTocTree(QUELLEN_HEADINGS.slice(0, 1)), null);
  assert.equal(toc.buildTocTree(QUELLEN_HEADINGS.slice(0, 2)), null);
  assert.ok(toc.buildTocTree(QUELLEN_HEADINGS.slice(0, 3)));

  // minHeadings=0 hebt die Schwelle auf, erfindet aber kein Markup:
  // ohne Einträge bleibt es beim Leerzustand.
  assert.equal(toc.buildTocTree([], { minHeadings: 0 }), null);
  assert.equal(toc.buildTocTree(QUELLEN_HEADINGS.slice(0, 2), { minHeadings: 0 })?.count, 2);
});

test('h1, sr-only/hidden und leere Texte werden übersprungen (AK-B5, AK-D12)', () => {
  const headings = [
    { depth: 1, slug: 'seitentitel', text: 'Seitentitel' },
    { depth: 2, slug: 'eins', text: 'Eins' },
    { depth: 3, slug: 'entries-title', text: 'Zwölf Farbwelten', skip: true },
    { depth: 2, slug: 'zwei', text: 'Zwei' },
    { depth: 2, slug: 'leer', text: '   ' },
    { depth: 2, slug: 'drei', text: 'Drei' },
  ];
  const tree = toc.buildTocTree(headings);
  assert.ok(tree);
  assert.equal(tree.count, 3);
  assert.deepEqual(
    toc.flattenToc(tree.items).map((node) => node.slug),
    ['eins', 'zwei', 'drei']
  );
});

test('Reihenfolge wird nicht sortiert', () => {
  const tree = toc.buildTocTree([
    { depth: 2, slug: 'z', text: 'Zebra' },
    { depth: 2, slug: 'a', text: 'Anfang' },
    { depth: 2, slug: 'm', text: 'Mitte' },
  ]);
  assert.ok(tree);
  assert.deepEqual(
    toc.flattenToc(tree.items).map((node) => node.slug),
    ['z', 'a', 'm']
  );
});

/* ------------------------------------------------------------------------- */
/* Verschachtelung (§6.2; AK-B6)                                             */
/* ------------------------------------------------------------------------- */

test('h3 wird Kind des vorangehenden h2, oberste Ebene ist level 2 (AK-B6)', () => {
  const tree = toc.buildTocTree(QUELLEN_HEADINGS);
  assert.ok(tree);
  assert.equal(tree.items.length, 14);
  const fifth = tree.items[5];
  assert.equal(fifth.slug, '5-claim-quelle-matrix');
  assert.deepEqual(
    fifth.children.map((child) => child.slug),
    ['51-physikalisch--physiologisch', '52-esoterisch--traditionell']
  );
  assert.ok(fifth.children.every((child) => child.level === 3));
  assert.ok(tree.items.every((item) => item.level === 2));
});

test('übersprungene Ebene erzeugt keine doppelte Einrückung (§6.2 Nr. 3)', () => {
  const tree = toc.buildTocTree(
    [
      { depth: 2, slug: 'kapitel', text: 'Kapitel' },
      { depth: 4, slug: 'unterabschnitt', text: 'Unterabschnitt' },
    ],
    { levels: [2, 4], minHeadings: 2 }
  );
  assert.ok(tree);
  const child = tree.items[0].children[0];
  assert.equal(child.depth, 4);
  assert.equal(child.level, 3, 'eine sichtbare Einrückungsstufe, nicht zwei');
});

test('beginnt der Artikel mit h3, steht der Eintrag auf oberster Ebene (§6.2 Nr. 4)', () => {
  const tree = toc.buildTocTree(
    [
      { depth: 3, slug: 'a', text: 'A' },
      { depth: 3, slug: 'b', text: 'B' },
    ],
    { minHeadings: 2 }
  );
  assert.ok(tree);
  assert.equal(tree.items.length, 2);
  assert.ok(tree.items.every((item) => item.level === 2));
});

/* ------------------------------------------------------------------------- */
/* Anker (§6.3; AK-C5, AK-C1)                                                */
/* ------------------------------------------------------------------------- */

test('fehlende IDs werden deterministisch erzeugt und kollidieren nicht (AK-C5)', () => {
  const headings = [
    { depth: 2, text: 'Gleicher Text' },
    { depth: 3, text: 'Gleicher Text' },
    { depth: 2, text: 'Anderer Text' },
  ];
  const first = toc.buildTocTree(headings, {}, ['gleicher-text']);
  const second = toc.buildTocTree(headings, {}, ['gleicher-text']);
  assert.ok(first && second);
  const firstSlugs = toc.flattenToc(first.items).map((node) => node.slug);
  assert.deepEqual(firstSlugs, ['gleicher-text-1', 'gleicher-text-2', 'anderer-text']);
  assert.deepEqual(
    toc.flattenToc(second.items).map((node) => node.slug),
    firstSlugs
  );
});

test('vorhandene IDs bleiben unverändert, auch wenn sie kollidieren würden (AK-C2)', () => {
  const tree = toc.buildTocTree([
    { depth: 2, slug: 'wissen', text: 'Wissen' },
    { depth: 2, slug: 'wissen', text: 'Wissen' },
    { depth: 2, text: 'Wissen' },
  ]);
  assert.ok(tree);
  assert.deepEqual(
    toc.flattenToc(tree.items).map((node) => node.slug),
    ['wissen', 'wissen', 'wissen-1']
  );
});

test('lange Überschriften bleiben vollständig (AK-B7, R-8)', () => {
  const long = `Lang: ${'Wort '.repeat(46).trim()} Ende`;
  const tree = toc.buildTocTree([
    { depth: 2, slug: 'lang', text: long },
    { depth: 2, slug: 'zwei', text: 'Zwei' },
    { depth: 2, slug: 'drei', text: 'Drei' },
  ]);
  assert.ok(tree);
  const node = tree.items[0];
  assert.equal(node.text, long);
  assert.ok(node.text.length > 235);
  assert.ok(!node.text.endsWith('…'), 'keine Kürzung im DOM');
});

/* ------------------------------------------------------------------------- */
/* Markup (§6.4; AK-B6, AK-F2)                                               */
/* ------------------------------------------------------------------------- */

test('renderTocList erzeugt verschachtelte ol>li>a mit unveränderten IDs', () => {
  const tree = toc.buildTocTree(QUELLEN_HEADINGS);
  assert.ok(tree);
  const html = toc.renderTocList(tree.items);
  assert.equal((html.match(/<a class="page-toc__link"/g) ?? []).length, 29);
  // Eine Wurzel-Liste plus drei verschachtelte Listen (Kapitel 5, 6 und 7).
  assert.equal((html.match(/<ol class="page-toc__list">/g) ?? []).length, 4);
  assert.equal((html.match(/<li class="page-toc__item/g) ?? []).length, 29);
  assert.ok(html.includes('href="#6-einzelprüfungen"'));
  assert.ok(html.includes('class="page-toc__item page-toc__item--3"'));
  // Kein h1, keine sr-only-Überschrift, keine zweite Navigation.
  assert.ok(!html.includes('Quellen und Methodik</a>'));
  assert.ok(!html.includes('<nav'));
});

test('renderTocList escaped Text und Attribut', () => {
  const html = toc.renderTocList([
    { depth: 2, level: 2, slug: 'a-b', text: '<script>alert("x")</script> & Co', children: [] },
  ]);
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Co'));
  assert.ok(!html.includes('<script>'));
});

test('Anker werden nicht prozentkodiert (§6.3 Nr. 6)', () => {
  assert.equal(toc.formatTocHref('6-einzelprüfungen'), '#6-einzelprüfungen');
  assert.ok(!toc.formatTocHref('6-einzelprüfungen').includes('%'));
});

/* ------------------------------------------------------------------------- */
/* Feature-Schalter (§D-10; AK-A3)                                           */
/* ------------------------------------------------------------------------- */

test('TOC_DISABLED=1 schaltet das Verzeichnis ab (AK-A3)', () => {
  const probe = join(buildDir, 'enabled-probe.mjs');
  writeFileSync(
    probe,
    `import { TOC_ENABLED } from ${JSON.stringify(pathToFileURL(compiledPath).href)};\n` +
      'process.stdout.write(String(TOC_ENABLED));\n',
    'utf8'
  );
  const run = (env) => spawnSync(process.execPath, [probe], { env: { ...process.env, ...env }, encoding: 'utf8' });

  const enabled = run({ TOC_DISABLED: '' });
  assert.equal(enabled.status, 0, enabled.stderr);
  assert.equal(enabled.stdout, 'true');

  const disabled = run({ TOC_DISABLED: '1' });
  assert.equal(disabled.status, 0, disabled.stderr);
  assert.equal(disabled.stdout, 'false');
});

test('Optionen werden validiert und mit Defaults ergänzt', () => {
  const defaults = toc.resolveTocOptions();
  assert.equal(defaults.title, 'Auf dieser Seite');
  assert.deepEqual(defaults.levels, [2, 3]);
  assert.equal(defaults.minHeadings, 3);
  assert.equal(defaults.dynamic, false);

  const custom = toc.resolveTocOptions({ levels: [3, 1, 9, 3], title: '  Inhalt  ', minHeadings: -1 });
  assert.deepEqual(custom.levels, [3], 'nur gültige Ebenen 2–6, ohne Duplikate');
  assert.equal(custom.title, 'Inhalt');
  assert.equal(custom.minHeadings, 3, 'ungültige Schwelle fällt auf den Default zurück');

  assert.deepEqual(toc.resolveTocOptions({ levels: [] }).levels, [2, 3]);
});
