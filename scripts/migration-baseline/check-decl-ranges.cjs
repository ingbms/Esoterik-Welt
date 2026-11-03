#!/usr/bin/env node
// Selbstpruefung der Messung: jede Deklaration muss auf einer Zeile enden, die
// den Block schliesst, und die Startzeile muss den Namen enthalten. Meldet
// Abweichungen (exit 1), damit falsche Zeilenbereiche nicht in den Katalog gehen.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const data = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'functions', 'functions-baseline.json'), 'utf8')
);

let checked = 0;
const problems = [];

function check(modPath, entry, kind) {
  const lines = fs.readFileSync(path.join(ROOT, modPath), 'utf8').split(/\r?\n/);
  const start = lines[entry.line - 1] || '';
  const end = lines[(entry.end_line || 0) - 1] || '';
  checked += 1;
  if (!start.includes(entry.name)) problems.push(`${modPath}:L${entry.line} Startzeile nennt ${entry.name} nicht`);
  if (!/\}\s*;?\s*$/.test(end.trim())) {
    problems.push(`${modPath}:L${entry.end_line} Ende von ${kind} ${entry.name} schliesst nicht: ${JSON.stringify(end.trim().slice(0, 60))}`);
  }
  if (!entry.end_line || entry.end_line < entry.line) problems.push(`${modPath}:${entry.name} ohne gueltiges Ende`);
}

for (const mod of data.modules) {
  for (const c of mod.classes) check(mod.path, c, 'class');
  for (const f of mod.functions) check(mod.path, f, 'function');
  for (const m of mod.class_methods) check(mod.path, m, 'method');
}

console.log(`geprueft: ${checked} Deklarationen in ${data.modules.length} Modulen`);
if (problems.length) {
  console.error(`ABWEICHUNGEN: ${problems.length}`);
  for (const p of problems.slice(0, 40)) console.error('  ' + p);
  process.exit(1);
}
console.log('OK: alle Zeilenbereiche enden auf einer schliessenden Klammerzeile.');
