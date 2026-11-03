#!/usr/bin/env node
/**
 * render-module-index.cjs — erzeugt den Anhang „Modulübersicht“ des
 * Funktions-Katalogs aus der Messung. Damit gibt es zu jeder der 42
 * ausgelieferten Moduldateien eine Zeile mit Einstiegspunkt, Abhängigkeiten und
 * Testbezug, ohne dass die Tabelle von Hand gepflegt werden muss.
 *
 * Aufruf:
 *   node scripts/migration-baseline/render-module-index.cjs           # Tabelle ausgeben
 *   node scripts/migration-baseline/render-module-index.cjs --write   # in das Dokument schreiben
 *   node scripts/migration-baseline/render-module-index.cjs --check   # Dokument gegen Messung prüfen
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const EVIDENCE = path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'functions', 'functions-baseline.json');
const DOC = path.join(ROOT, 'docs', 'migration-baseline', 'funktionen-katalog.md');
const START = '<!-- MODULE-INDEX:START -->';
const END = '<!-- MODULE-INDEX:END -->';

const data = JSON.parse(fs.readFileSync(EVIDENCE, 'utf8'));

const testsByModule = new Map();
for (const test of data.tests) {
  for (const specifier of test.imports) {
    const target = specifier.replace(/^\.\.\//, '');
    if (!testsByModule.has(target)) testsByModule.set(target, []);
    testsByModule.get(target).push(test.path);
  }
}

function entryPoint(mod) {
  if (mod.classes.length) {
    const cls = mod.classes[0];
    return `class ${cls.name} (L${cls.line})`;
  }
  const exported = mod.functions.filter((fn) => fn.exported);
  if (exported.length) return `${exported[0].name}() (L${exported[0].line})`;
  if (mod.functions.length) return `${mod.functions[0].name}() (L${mod.functions[0].line})`;
  return 'Hilfsmodul ohne Deklaration';
}

function dependencies(mod) {
  const names = mod.imports.map((entry) => entry.specifier.replace(/^\.\//, '../').replace(/^\.\.\/\.\.\//, '../../'));
  if (!names.length) return 'keine';
  // Nur Dateinamen, damit die Spalte schmal bleibt; der Pfad steht in der Quelle.
  return [...new Set(names)].map((name) => name.split('/').pop()).sort().join(', ');
}

function evidence(mod) {
  const tests = testsByModule.get(mod.path) || [];
  if (tests.length) return tests.join(', ');
  return '`cmd:`-Nachweis in Kapitel 2';
}

const rows = data.modules
  .filter((mod) => mod.path.endsWith('.js'))
  // Altdateien mit führendem Unterstrich werden von build-pages.cjs nicht
  // ausgeliefert (Kapitel 8) und gehören nicht in eine Übersicht der
  // ausgelieferten Module.
  .filter((mod) => !path.basename(mod.path).startsWith('_'))
  .map(
    (mod) =>
      `| \`${mod.path}\` | ${mod.lines} | ${entryPoint(mod)} | ${dependencies(mod)} | ${evidence(mod)} |`
  );

const table = [
  '| Modul | Zeilen | Einstiegspunkt (Klasse oder erste Deklaration) | Importiert | Nachweis |',
  '| --- | --- | --- | --- | --- |',
  ...rows,
].join('\n');

const block = `${START}\n${table}\n${END}`;

if (process.argv.includes('--write')) {
  const text = fs.readFileSync(DOC, 'utf8');
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (!pattern.test(text)) {
    console.error('Marken nicht gefunden; Anhang bitte einmal von Hand anlegen.');
    process.exit(1);
  }
  fs.writeFileSync(DOC, text.replace(pattern, block));
  console.log(`geschrieben: Modulübersicht mit ${rows.length} Zeilen`);
} else if (process.argv.includes('--check')) {
  const text = fs.readFileSync(DOC, 'utf8');
  const found = new RegExp(`${START}[\\s\\S]*?${END}`).exec(text);
  if (!found) {
    console.error('FEHLT: Modulübersicht im Dokument');
    process.exit(1);
  }
  if (found[0] !== block) {
    console.error('ABWEICHUNG: Modulübersicht weicht von der Messung ab.');
    process.exit(1);
  }
  console.log(`OK: Modulübersicht deckungsgleich (${rows.length} Module).`);
} else {
  console.log(block);
}
