#!/usr/bin/env node
// Zeilenbereiche einzelner Deklarationen ausgeben:
//   node scripts/migration-baseline/ranges.cjs js/main.js parseRoute applyRoute
'use strict';
const fs = require('fs');
const path = require('path');
const { findBlockEnd } = require('./lib/js-blocks.cjs');
const ROOT = path.resolve(__dirname, '..', '..');

const [file, ...names] = process.argv.slice(2);
if (!file) {
  console.error('Aufruf: node scripts/migration-baseline/ranges.cjs <datei> [name ...]');
  process.exit(2);
}
const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
const pattern = /^(\s*)(export\s+)?(?:async\s+)?(function\*?|class)\s+([A-Za-z_$][\w$]*)/;
const found = new Map();
lines.forEach((line, i) => {
  const m = pattern.exec(line);
  if (!m) return;
  const end = findBlockEnd(lines, i);
  if (names.length && !names.includes(m[4])) return;
  found.set(m[4], `L${i + 1}-L${end}`);
});
for (const [name, range] of found) console.log(`${name} ${range}`);
