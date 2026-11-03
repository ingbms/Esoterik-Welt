#!/usr/bin/env node
// Druckt die Messung kompakt: Deklarationen je Modul, Tests je Modul.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const data = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'functions', 'functions-baseline.json'),
    'utf8'
  )
);

const only = process.argv.slice(2);
const mods = only.length ? data.modules.filter((m) => only.some((o) => m.path.includes(o))) : data.modules;

for (const mod of mods) {
  console.log(`\n### ${mod.path} (${mod.lines} Zeilen)`);
  for (const d of mod.classes) console.log(`  class ${d.name}  L${d.line}-L${d.end_line}`);
  for (const f of mod.functions) console.log(`  fn ${f.name}  L${f.line}-L${f.end_line}`);
  if (process.env.METHODS && mod.class_methods.length) {
    for (const c of mod.class_methods) console.log(`    .${c.class}.${c.name}  L${c.line}-L${c.end_line}`);
  }
}

if (!only.length) {
  console.log('\n### Tests -> Module');
  for (const t of data.tests) console.log(`  ${t.path}  <- ${t.imports.join(', ') || '(nur Fixtures/Seiten)'}`);
}
