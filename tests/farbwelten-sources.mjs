// Farbwelten — Guard gegen abweichende Quellenfassungen je Kennung.
//
// Fehlerklasse aus t_e3ecc54e ([24]/[31]) und t_6dc6b194 ([19]): Altseiten und
// neue Seiten führen dieselbe Kennung mit unterschiedlichem Label oder
// unterschiedlicher URL. `registerSources` in
// scripts/generate-farbwelten-data.cjs nimmt dann stillschweigend den
// höchsten Score `(url ? 100000 : 0) + label.length` — die sachlich falsche
// Fassung kann das Register überschreiben, ohne dass ein Test anschlägt.
//
// Geprüft wird:
//   1. echter Bestand content/farbwelten/*.md: keine divergierende Kennung,
//      Register (js/data/farbwelten.js) führt je Kennung den vollständigsten
//      Kandidaten der Dokumente,
//   2. künstliche Divergenzfälle ([19]- und [24]-Muster) schlagen an,
//   3. Gleichstand und abweichende Jahres-/Bandangabe werden erkannt,
//   4. Vergleichsnormalisierung erzeugt keine Fehlalarme,
//   5. Verweisketten („- [1][2][3] – siehe …") zählen nicht als Fassung.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const {
  loadDocuments,
  analyseDocuments,
  checkRegister,
  normalizeLabel,
  normalizeUrl,
  parseEntry,
  topicRegisters,
} = require('../scripts/lib/farbwelten-sources.cjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content', 'farbwelten');

// Zwei Seiten mit derselben Kennung: `quellen` ist der Bibliografieblock.
function page(name, quellen) {
  return {
    name,
    source: `---\ntitle: "${name}"\n---\n\n# ${name}\n\nEin Absatz [1].\n\n## Quellen und verwandte Themen\n\n${quellen.join('\n')}\n`,
  };
}

const LEDGER_19 =
  '- [19] IARC 2012, Monographs Vol. 100D Radiation. https://publications.iarc.who.int/Book-And-Report-Series/Radiation-2012';
const ALT_19 = '- [19] IARC (2023). Monograph on artificial optical radiation. https://www.iarc.who.int';
const LEDGER_24 = '- [24] NIST SP 330, SI-Broschüre. https://www.nist.gov/pml/special-publication-330/sp-330-section-2';
const ALT_24 = '- [24] NIST / CIE. SI-Werte und Lichtgeschwindigkeit (c = 299 792 458 m/s).';

let data;
let tmp;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'farbwelten-sources-'));
  fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
  fs.copyFileSync(path.join(root, 'js', 'data', 'farbwelten.js'), path.join(tmp, 'farbwelten.js'));
  data = await import(pathToFileURL(path.join(tmp, 'farbwelten.js')).href);
});

after(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

test('echter Bestand: keine Kennung führt abweichende Fassungen', () => {
  const documents = loadDocuments(contentDir);
  assert.ok(documents.length >= 15, `nur ${documents.length} Dokumente gefunden`);
  const analysis = analyseDocuments(documents);
  assert.deepEqual(
    analysis.errors.map((error) => error.message),
    [],
    'Quellenabgleich meldet Fehler auf dem echten Bestand'
  );
  assert.ok(analysis.ids.length >= 16, `nur ${analysis.ids.length} Kennungen gefunden`);
  // Kein Dokument darf eine Kennung stillschweigend doppelt führen.
  const files = analysis.ids.flatMap((record) => record.files);
  assert.ok(files.includes('farbwelten') && files.includes('chakren') && files.includes('lichtfrequenzen'));
});

test('echter Bestand: Register führt je Kennung den vollständigsten Kandidaten', () => {
  const analysis = analyseDocuments(loadDocuments(contentDir));
  const result = checkRegister(analysis, data.SOURCES, topicRegisters(data.TOPIC_PAGES));
  assert.deepEqual(
    result.errors.map((error) => error.message),
    [],
    'Register und Dokumente laufen auseinander (Daten neu erzeugen?)'
  );
  assert.equal(Object.keys(data.SOURCES).length, 16);
});

test('[19]-Muster (IARC 2023 vs. 2012, verschiedene URLs) schlägt an', () => {
  const analysis = analyseDocuments([page('alt', [ALT_19]), page('neu', [LEDGER_19])]);
  assert.equal(analysis.errors.length, 1);
  const [error] = analysis.errors;
  assert.equal(error.code, 'url-konflikt');
  assert.equal(error.id, '19');
  assert.deepEqual(error.files.sort(), ['alt', 'neu']);
  assert.match(error.message, /alt/);
  assert.match(error.message, /neu/);
  assert.match(error.message, /IARC \(2023\)/);
  assert.match(error.message, /IARC 2012/);
});

test('[24]-Muster (URL vs. keine URL) schlägt an', () => {
  const analysis = analyseDocuments([page('alt', [ALT_24]), page('neu', [LEDGER_24])]);
  assert.equal(analysis.errors.length, 1);
  assert.equal(analysis.errors[0].code, 'url-konflikt');
  assert.equal(analysis.errors[0].id, '24');
  assert.match(analysis.errors[0].message, /ohne URL/);
});

test('gleiche URL, abweichendes Jahr ist ein Identitätskonflikt', () => {
  const documents = [
    page('a', ['- [19] IARC (2023). Monograph on artificial optical radiation. https://www.iarc.who.int/x']),
    page('b', ['- [19] IARC (2012). Monograph on artificial optical radiation. https://www.iarc.who.int/x']),
  ];
  const analysis = analyseDocuments(documents);
  assert.equal(analysis.errors.length, 1);
  assert.equal(analysis.errors[0].code, 'identitaetskonflikt');
});

test('gleiche URL mit kürzerem Label: Hinweis, unter --strict-labels Fehler', () => {
  const documents = [
    page('a', ['- [5] Jonauskaite, D. et al. (2020). "To see or not to see..." https://doi.org/10.1002/col.22490']),
    page('b', [
      '- [5] Jonauskaite, D. et al. (2020). "To see or not to see: Importance of color perception to color therapy." Color Research & Application 45(3), 450–464. https://doi.org/10.1002/col.22490',
    ]),
  ];
  const lax = analyseDocuments(documents);
  assert.equal(lax.errors.length, 0);
  assert.equal(lax.warnings.filter((warning) => warning.code === 'label-variante').length, 1);

  const strict = analyseDocuments(documents, { strictLabels: true });
  assert.equal(strict.errors.length, 1);
  assert.equal(strict.errors[0].code, 'label-variante');
  assert.equal(strict.errors[0].id, '5');
});

test('Schreibweisen derselben Fassung sind kein Fehler', () => {
  const documents = [
    page('a', [
      '- [31] Wyszecki, G. & Stiles, W. S. (2000). Color Science: Concepts and Methods, Quantitative Data and Formulae. 2. Aufl., Wiley Classics Library (Nachdruck). ISBN 978-0-471-39918-6',
    ]),
    page('b', [
      '- [31] **Wyszecki, G. & Stiles, W. S. (2000).** Color Science: Concepts and Methods, Quantitative Data and Formulae. 2. Aufl., Wiley Classics Library (Nachdruck). ISBN 978-0-471-39918-6.',
    ]),
    page('c', [
      '- [31] Wyszecki, G. & Stiles, W. S. (2000). Color Science: Concepts and Methods, Quantitative Data and Formulae. 2. Aufl., Wiley Classics Library (Nachdruck). ISBN 978–0–471–39918–6',
    ]),
  ];
  const analysis = analyseDocuments(documents);
  assert.deepEqual(analysis.errors, []);
  assert.deepEqual(analysis.warnings, []);
});

test('Verweisketten sind keine bibliografische Fassung', () => {
  const documents = [page('a', [LEDGER_19]), page('b', ['- [19][24][31] – siehe Quellenliste der Einstiegsseite'])];
  const analysis = analyseDocuments(documents);
  assert.deepEqual(analysis.errors, []);
  assert.equal(analysis.ids.find((record) => record.id === '19').files.join(','), 'a');
  assert.equal(analysis.chains.length, 1);
});

test('Gleichstand im Score wird gemeldet, nicht still entschieden', () => {
  const documents = [
    page('a', ['- [7] Gnambs, T. (2020). "Limited evidence A." Psychon Bull Rev 27. https://doi.org/10.3758/x']),
    page('b', ['- [7] Gnambs, T. (2020). "Limited evidence B." Psychon Bull Rev 27. https://doi.org/10.3758/x']),
  ];
  const analysis = analyseDocuments(documents);
  const gleichstand = analysis.warnings.filter((warning) => warning.code === 'gleichstand');
  assert.equal(gleichstand.length, 1);
  assert.match(gleichstand[0].message, /Gleichstand/);
});

test('veraltetes Register wird als Abweichung erkannt', () => {
  const documents = [
    page('a', [
      '- [2] Woodroffe, J. G. (1919) / Avalon, A. The Serpent Power. https://archive.org/details/the-serpent-power',
    ]),
    page('b', [
      '- [2] Woodroffe, J. G. (1919, Übers.) / Avalon, A. The Serpent Power. https://archive.org/details/the-serpent-power',
    ]),
  ];
  const analysis = analyseDocuments(documents);
  assert.deepEqual(analysis.errors, []);
  const stale = checkRegister(analysis, {
    2: {
      id: '2',
      label: 'Woodroffe, J. G. (1919) / Avalon, A. The Serpent Power',
      url: 'https://archive.org/details/the-serpent-power',
      shortRef: false,
    },
  });
  assert.equal(stale.errors.length, 1);
  assert.equal(stale.errors[0].code, 'register-abweichung');

  const fresh = checkRegister(analysis, {
    2: {
      id: '2',
      label: 'Woodroffe, J. G. (1919, Übers.) / Avalon, A. The Serpent Power',
      url: 'https://archive.org/details/the-serpent-power',
      shortRef: false,
    },
  });
  assert.deepEqual(fresh.errors, []);
});

test('Registerfassung ohne Entsprechung im Dokument wird erkannt', () => {
  const analysis = analyseDocuments([page('a', [LEDGER_19])]);
  const result = checkRegister(analysis, {
    19: {
      id: '19',
      label: 'IARC (2023). Monograph on artificial optical radiation',
      url: 'https://www.iarc.who.int',
      shortRef: false,
    },
  });
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].code, 'register-fremd');
});

test('Normalisierung: URL und Label vergleichbar, Identität bleibt unterscheidend', () => {
  assert.equal(normalizeUrl('https://www.Example.org/a/'), normalizeUrl('https://example.org/a'));
  assert.notEqual(normalizeUrl('https://example.org/a'), normalizeUrl('https://example.org/b'));
  assert.equal(normalizeUrl(null), null);
  assert.equal(
    normalizeLabel('„Do we feel colours?“ – Meta-Analyse.'),
    normalizeLabel('"Do we feel colours?" - Meta-Analyse')
  );
  assert.notEqual(normalizeLabel('IARC (2012)'), normalizeLabel('IARC (2023)'));
});

test('URL/DOI vor einer Einordnung bleiben anklickbare Quellenadressen', () => {
  const url = parseEntry('[11] Hamblin 2018. URL: https://doi.org/10.1111/php.12864. (Mechanismus, kein SAD-Beleg.)');
  assert.equal(url.url, 'https://doi.org/10.1111/php.12864');
  assert.match(url.label, /Mechanismus, kein SAD-Beleg/);
  assert.doesNotMatch(url.label, /URL:|https:/);
  const doi = parseEntry('[17] Kumar 2022. DOI: 10.1002/14651858.CD007969.pub2. (Phototherapie.)');
  assert.equal(doi.url, 'https://doi.org/10.1002/14651858.CD007969.pub2');
  assert.match(doi.label, /Phototherapie/);
});

test('lokale Kennungen verdrängen keine globale Quelle; lokale Divergenz bleibt ein Fehler', () => {
  const global = page('lichtfrequenzen', ['- [11] Cochrane 2019. https://doi.org/10.1002/SAD']);
  const local = {
    ...page('lichtmedizin', ['- [11] Hamblin 2018. https://doi.org/10.1111/PBM']),
    sourceScope: 'lichtmedizin',
  };
  const analysis = analyseDocuments([global, local]);
  assert.deepEqual(analysis.errors, []);
  assert.equal(analysis.ids.length, 2);
  const globalEntry = parseEntry('[11] Cochrane 2019. https://doi.org/10.1002/SAD');
  const localEntry = parseEntry('[11] Hamblin 2018. https://doi.org/10.1111/PBM');
  assert.deepEqual(checkRegister(analysis, { 11: globalEntry }, { lichtmedizin: { 11: localEntry } }).errors, []);
  assert.ok(checkRegister(analysis, { 11: globalEntry }, { lichtmedizin: { 11: globalEntry } }).errors.length);
  assert.ok(checkRegister(analysis, { 11: globalEntry }).errors.some((error) => error.code === 'register-fehlt'));
  const conflict = {
    ...page('zweite-lokale-fassung', ['- [11] Falsche Quelle 2023. https://doi.org/10.1111/other']),
    sourceScope: 'lichtmedizin',
  };
  assert.ok(analyseDocuments([global, local, conflict]).errors.some((error) => error.code === 'url-konflikt'));
});

test('alle drei lokalen Bibliografien werden gegen ihre generierten Links geprüft', () => {
  const documents = loadDocuments(contentDir);
  assert.deepEqual(
    documents
      .filter((document) => document.sourceScope)
      .map((document) => document.name)
      .sort(),
    ['farbpsychologie', 'farbtherapie', 'lichtmedizin']
  );
  const analysis = analyseDocuments(documents);
  const registers = topicRegisters(data.TOPIC_PAGES);
  assert.deepEqual(checkRegister(analysis, data.SOURCES, registers).errors, []);
  assert.equal(registers.lichtmedizin['11'].url, 'https://doi.org/10.1111/php.12864');
  assert.notEqual(registers.lichtmedizin['11'].url, data.SOURCES['11'].url);
  assert.equal(Object.keys(registers).length, 3);
});
