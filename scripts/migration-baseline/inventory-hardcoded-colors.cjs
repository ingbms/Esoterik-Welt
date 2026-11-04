'use strict';
// Erhebt hartkodierte Farbwerte in den ausgelieferten Stylesheets, die nicht als Token
// hinterlegt sind. Grundlage der Befunde L-01/L-02 in
// docs/migration-baseline/design-katalog-luecken.md.
//
// Bewertet werden nur Werte AUSSERHALB von :root und [data-theme='light'] — dort stehen die
// Token-Definitionen. Ausgenommen sind zusätzlich:
//   * alle Werte im @media print-Block (Druckfarben, bewusst hartkodiert),
//   * die vier Mondfarben aus js/modules/moon.js, die als physikalische Darstellung
//     im CSS-Kommentar dokumentiert sind.
//
//   node scripts/migration-baseline/inventory-hardcoded-colors.cjs
//   node scripts/migration-baseline/inventory-hardcoded-colors.cjs --json
//
// Das Skript ändert nichts und beendet immer mit Exit 0: es ist eine Erhebung, kein Gate.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = [
  'css/design-system.css',
  'css/main.css',
  'css/farbwelten.css',
  'css/frequenzlabor.css',
  'css/radiasthesie.css',
  'css/radiasthesie-statisch.css',
];
const DOCUMENTED = new Set(['#f7f4ea', '#ddd8c9', '#b3ada0', '#20282a']);
const SKIP_BLOCKS = [/^:root$/, /^\[data-theme='light'\]$/, /@media print/];

function scan(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return { file: rel, missing: true };
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  const stack = [];
  const found = [];
  let inComment = false;
  lines.forEach((rawLine, index) => {
    // Blockkommentare ueber mehrere Zeilen entfernen, sonst zaehlen Farbwerte aus Kommentaren mit.
    let line = '';
    let rest = rawLine;
    while (rest.length) {
      if (inComment) {
        const end = rest.indexOf('*/');
        if (end < 0) {
          rest = '';
        } else {
          rest = rest.slice(end + 2);
          inComment = false;
        }
        continue;
      }
      const start = rest.indexOf('/*');
      if (start < 0) {
        line += rest;
        rest = '';
      } else {
        line += rest.slice(0, start);
        rest = rest.slice(start + 2);
        inComment = true;
      }
    }
    let buffer = '';
    for (const char of line) {
      if (char === '{') {
        stack.push(buffer.trim().replace(/\s+/g, ' '));
        buffer = '';
      } else if (char === '}') {
        stack.pop();
        buffer = '';
      } else {
        buffer += char;
      }
    }
    buffer = '';
    const inTokenBlock = stack.some((head) => SKIP_BLOCKS.some((pattern) => pattern.test(head)));
    if (inTokenBlock) return;
    for (const match of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      found.push({ value: match[0].toLowerCase(), line: index + 1, context: stack[stack.length - 1] || '(top level)' });
    }
  });
  const documented = found.filter((entry) => DOCUMENTED.has(entry.value));
  const open = found.filter((entry) => !DOCUMENTED.has(entry.value));
  return { file: rel, total: found.length, documented: documented.length, open: open.length, values: open };
}

const results = FILES.map(scan);
const open = results.flatMap((result) => (result.values || []).map((value) => ({ file: result.file, ...value })));
const summary = {
  files: results.map((result) => ({
    file: result.file,
    total: result.total,
    documented: result.documented,
    open: result.open,
  })),
  open_total: open.length,
  distinct_open: [...new Set(open.map((entry) => entry.value))].sort(),
  entries: open,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log('Hartkodierte Farben ausserhalb von :root, Light-Block und Druckblock');
  for (const file of summary.files) {
    if (file.total === undefined) {
      console.log(`  ${file.file}: FEHLT`);
      continue;
    }
    console.log(`  ${file.file}: ${file.open} offen · ${file.documented} dokumentiert (Mond) · ${file.total} gesamt`);
  }
  console.log(`\n  Offene Werte: ${summary.open_total} Vorkommen, ${summary.distinct_open.length} verschiedene Farben`);
  console.log(`  ${summary.distinct_open.join(', ')}`);
  for (const entry of open) console.log(`  ${entry.file} L${entry.line} ${entry.value} — ${entry.context}`);
}

process.exit(0);
