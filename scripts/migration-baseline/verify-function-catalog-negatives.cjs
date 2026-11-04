#!/usr/bin/env node
/**
 * verify-function-catalog-negatives.cjs — beweist, dass der Katalogpruefer
 * falsche Eingaben ablehnt. Ohne diesen Nachweis belegt ein gruener Lauf nur,
 * dass das Skript nicht abstuerzt.
 *
 * Jeder Fall kopiert den echten Katalog, mutiert genau eine Stelle und erwartet
 * Exit 1 mit einer bestimmten Meldung. Das Original bleibt unberuehrt.
 *
 * Aufruf: node scripts/migration-baseline/verify-function-catalog-negatives.cjs
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DOC = path.join(ROOT, 'docs', 'migration-baseline', 'funktionen-katalog.md');
const CHECKER = path.join(ROOT, 'scripts', 'migration-baseline', 'verify-function-catalog.cjs');
const source = fs.readFileSync(DOC, 'utf8');

const tmpDir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'fcat-'));

const cases = [
  {
    name: 'falscher Zeilenbereich',
    mutate: (text) => text.replace('`renderGrid` · L174-L188', '`renderGrid` · L174-L999'),
    expect: /Zeilenbereich|endet in/,
  },
  {
    name: 'nicht existierender Testpfad',
    mutate: (text) => text.replace('`tests/tarot-decks-v2.cjs`', '`tests/gibt-es-nicht.spec.js`'),
    expect: /Testpfad fehlt/,
  },
  {
    name: 'unbekannter Owner',
    mutate: (text) =>
      text.replace(
        '| final | must | architect | `tests/pages-regression.cjs` |',
        '| final | must | chief | `tests/pages-regression.cjs` |'
      ),
    expect: /unzulässiger Owner/,
  },
  {
    name: 'fehlende Tabellenzeile',
    mutate: (text) => text.replace(/\| FUN-KRY-006 \|[^\n]*\n/, ''),
    expect: /§9\.3 nennt 96 Funktionen/,
  },
  {
    name: 'falscher Spaltenkopf',
    mutate: (text) =>
      text.replace(
        '| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |',
        '| ID | Funktion | Auslöser | Quelle | Zustand | Prüfkriterium | Status | Release | Owner | Nachweis |'
      ),
    expect: /Spaltenkopf weicht ab/,
  },
  {
    name: 'fehlender Pflichtbefund',
    mutate: (text) => text.replace(/docs\/tarot-deck-nachtatelier/g, 'docs/tarot-deck'),
    expect: /Pflichtbefund/,
  },
  {
    name: 'Quelle zeigt auf falsche Datei',
    mutate: (text) => text.replace('`js/modules/tarot.js` · `renderGrid`', '`js/modules/moon.js` · `renderGrid`'),
    expect: /nennt „renderGrid“ nicht/,
  },
];

let failed = 0;
for (const testCase of cases) {
  const mutated = testCase.mutate(source);
  if (mutated === source) {
    console.error(`FEHLER: Mutation „${testCase.name}“ hat nichts geändert`);
    failed += 1;
    continue;
  }
  const file = path.join(tmpDir, `mut-${failed}-${cases.indexOf(testCase)}.md`);
  fs.writeFileSync(file, mutated);
  const result = spawnSync(process.execPath, [CHECKER, file], { cwd: ROOT, encoding: 'utf8' });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (result.status === 0) {
    console.error(`FEHLER: „${testCase.name}“ wurde akzeptiert`);
    failed += 1;
  } else if (!testCase.expect.test(output)) {
    console.error(`FEHLER: „${testCase.name}“ scheiterte, aber nicht mit der erwarteten Meldung`);
    console.error(output.split('\n').slice(0, 6).join('\n'));
    failed += 1;
  } else {
    console.log(`OK: ${testCase.name} abgelehnt`);
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true });

if (failed) {
  console.error(`${failed} von ${cases.length} Negativfällen fehlgeschlagen`);
  process.exit(1);
}
console.log(`OK: ${cases.length}/${cases.length} Negativfälle abgelehnt.`);
