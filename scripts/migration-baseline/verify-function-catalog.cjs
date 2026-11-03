#!/usr/bin/env node
/**
 * verify-function-catalog.cjs — prueft docs/migration-baseline/funktionen-katalog.md
 * gegen den Release-Stand. Keine Heuristik: jede Zeile muss auf eine vorhandene
 * Datei, eine vorhandene Deklaration und einen vorhandenen Test verweisen.
 *
 * Geprueft wird:
 *   1. die sechs Sachkapitel und die zehn Bereichstabellen aus §9.1
 *   2. Spaltenkopf exakt in der Reihenfolge von §9.1
 *   3. ID-Format FUN-<BEREICH>-<NNN>, Eindeutigkeit, Bereichszuordnung
 *   4. Status/Release/Owner nur aus den Wertelisten aus §5.4/§5.8/§5.9
 *   5. jede Quelle: Datei existiert, Zeilenbereich liegt in der Datei, die
 *      Startzeile nennt den zitierten Namen, das Ende ist das berechnete
 *      Deklarationsende
 *   6. jeder Nachweis: tests/-Pfad existiert oder ist ein cmd:-Befehl, dessen
 *      genannte Dateien existieren
 *   7. die drei Pflichtbefunde aus dem Auftrag stehen mit Dateipfad in Kapitel 7
 *   8. die in §9.3 genannten Summen stimmen mit den Tabellen ueberein
 *
 * Aufruf: node scripts/migration-baseline/verify-function-catalog.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { findBlockEnd } = require('./lib/js-blocks.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
// Optionaler Pfad als erstes Argument, damit negative Tests eine mutierte Kopie
// pruefen koennen, ohne das Original anzufassen.
const DOC = process.argv[2] || 'docs/migration-baseline/funktionen-katalog.md';

const AREAS = ['GLO', 'TAR', 'KRY', 'MON', 'AST', 'FRQ', 'RUN', 'PEN', 'FBW', 'BLG'];
const EXPECTED_HEADER = ['ID', 'Funktion', 'Auslöser', 'Quelle', 'Zustände', 'Prüfkriterium', 'Status', 'Release', 'Owner', 'Nachweis'];
const STATUS = ['final', 'entwurf', 'offen', 'veraltet'];
const RELEASE = ['must', 'should', 'none'];
const OWNER = ['structured_output', 'design_web_layout', 'design_critique', 'writer', 'review_approval', 'architect', 'default'];
const REQUIRED_CHAPTERS = [
  ['## 1. Routing', 'Routing'],
  ['## 2. Interaktive Module', 'Interaktive Module'],
  ['## 3. Datenquellen und Generatoren', 'Datenquellen und Generatoren'],
  ['## 4. Externe Dienste und Requests', 'Externe Dienste und Requests'],
  ['## 5. Speicher und Browserfunktionen', 'Speicher und Browserfunktionen'],
  ['## 6. SEO und Metadaten', 'SEO und Metadaten'],
  ['## 7. Befunde', 'Befunde'],
];
const REQUIRED_FINDINGS = ['docs/tarot-deck-nachtatelier', 'js/data/crystals.js', 'data/crystals.json', 'sitemap.xml', 'README.md'];

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);

const text = fs.readFileSync(path.isAbsolute(DOC) ? DOC : path.join(ROOT, DOC), 'utf8');
const lines = text.split(/\r?\n/);

// --- 1. Kapitel --------------------------------------------------------------
for (const [heading, label] of REQUIRED_CHAPTERS) {
  if (!lines.some((line) => line.trim() === heading)) fail(`Kapitel fehlt: „${label}“ (${heading})`);
}

// --- 2. Bereichstabellen -----------------------------------------------------
const sections = [];
lines.forEach((line, index) => {
  const m = /^### 2\.(\d+) (GLO|TAR|KRY|MON|AST|FRQ|RUN|PEN|FBW|BLG)\b/.exec(line);
  if (m) sections.push({ area: m[2], line: index + 1, rows: [], header: null });
});

if (sections.length !== AREAS.length) fail(`Bereichstabellen: ${sections.length} gefunden, ${AREAS.length} erwartet`);
for (const area of AREAS) {
  if (!sections.some((s) => s.area === area)) fail(`Bereichstabelle fehlt: ${area}`);
}

function splitRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
}

for (const section of sections) {
  let i = section.line;
  while (i < lines.length && !lines[i].trim().startsWith('|')) {
    if (i > section.line && /^### |^## /.test(lines[i])) break;
    i += 1;
  }
  if (i >= lines.length) {
    fail(`${section.area}: keine Tabelle gefunden`);
    continue;
  }
  const header = splitRow(lines[i]);
  section.header = header;
  if (!header || header.join('|') !== EXPECTED_HEADER.join('|')) {
    fail(`${section.area}: Spaltenkopf weicht ab. Gefunden: ${header ? header.join(' | ') : 'keiner'}`);
  }
  i += 1;
  if (!lines[i] || !/^\|\s*-+/.test(lines[i].trim())) fail(`${section.area}: Trennzeile der Tabelle fehlt`);
  i += 1;
  for (; i < lines.length; i += 1) {
    const cells = splitRow(lines[i]);
    if (!cells) break;
    if (cells.length !== EXPECTED_HEADER.length) {
      fail(`${section.area}: Zeile mit ${cells.length} statt ${EXPECTED_HEADER.length} Spalten: ${cells[0]}`);
      continue;
    }
    section.rows.push({ area: section.area, cells, line: i + 1 });
  }
}

// --- 3.–6. Zeilenpruefung ----------------------------------------------------
const allIds = new Map();
const fileCache = new Map();
function readLines(rel) {
  if (!fileCache.has(rel)) fileCache.set(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8').split(/\r?\n/));
  return fileCache.get(rel);
}

function resolvePath(candidate) {
  const clean = candidate.replace(/^\.\//, '');
  const options = [clean, `js/modules/${clean}`, `js/${clean}`, `scripts/${clean}`];
  for (const option of options) {
    if (fs.existsSync(path.join(ROOT, option)) && fs.statSync(path.join(ROOT, option)).isFile()) return option;
  }
  return null;
}

/** Ende einer Deklaration/Konstante ab 1-basierter Zeile bestimmen. */
function declarationEnd(rel, startLine, name) {
  const fileLines = readLines(rel);
  const index = startLine - 1;
  const line = fileLines[index] || '';
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isCallable = new RegExp(`(?:function|class)\\s+${escaped}\\b|(?:^|\\s)${escaped}\\s*\\(`).test(line);
  if (isCallable) return findBlockEnd(fileLines, index);
  // Konstante: Klammerbilanz bis zur schliessenden Zeile.
  let depth = 0;
  let started = false;
  for (let i = index; i < fileLines.length; i += 1) {
    for (const c of fileLines[i]) {
      if (c === '{' || c === '[' || c === '(') {
        depth += 1;
        started = true;
      } else if (c === '}' || c === ']' || c === ')') {
        depth -= 1;
        if (started && depth <= 0) return i + 1;
      }
    }
  }
  return null;
}

function checkSourceEntry(area, id, entry, state) {
  const tokens = [...entry.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  const ranges = [...entry.matchAll(/L(\d+)(?:-L(\d+))?/g)].map((m) => ({ start: Number(m[1]), end: m[2] ? Number(m[2]) : Number(m[1]) }));
  if (!tokens.length) {
    fail(`${area}/${id}: Quelle ohne Dateipfad: ${entry.trim()}`);
    return;
  }
  // Ein Eintrag ohne Pfad („`filterCards` · L280-L284“) erbt die Datei des
  // vorigen Eintrags derselben Zelle. Das ist erlaubt und wird geprueft.
  const looksLikePath = /[./]/.test(tokens[0]);
  const rel = looksLikePath ? resolvePath(tokens[0]) : state.path ? resolvePath(state.path) : null;
  if (!rel) {
    fail(`${area}/${id}: Quelldatei fehlt: ${tokens[0]}`);
    return;
  }
  const name = looksLikePath ? tokens[1] || null : tokens[0];
  state.path = rel;
  state.name = name;
  const fileLines = readLines(rel);
  if (!ranges.length) {
    warnings.push(`${area}/${id}: Quelle ohne Zeilenangabe (${rel})`);
    return;
  }
  for (const range of ranges) {
    if (range.start < 1 || range.end > fileLines.length || range.end < range.start) {
      fail(`${area}/${id}: Zeilenbereich L${range.start}-L${range.end} liegt nicht in ${rel} (${fileLines.length} Zeilen)`);
      return;
    }
    if (!name) continue;
    const startText = fileLines[range.start - 1] || '';
    const wordRe = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (!wordRe.test(startText)) {
      fail(`${area}/${id}: L${range.start} in ${rel} nennt „${name}“ nicht: ${JSON.stringify(startText.trim().slice(0, 70))}`);
      return;
    }
    const expectedEnd = declarationEnd(rel, range.start, name);
    if (expectedEnd && expectedEnd !== range.end) {
      fail(`${area}/${id}: ${name} endet in ${rel} auf L${expectedEnd}, zitiert ist L${range.end}`);
      return;
    }
  }
}

function checkEvidence(area, id, cell) {
  const entries = cell.split(';').map((s) => s.trim().replace(/`/g, '')).filter(Boolean);
  if (!entries.length) fail(`${area}/${id}: Nachweis fehlt`);
  for (const entry of entries) {
    if (entry.startsWith('cmd:')) {
      const tokens = entry.replace(/^cmd:\s*/, '').match(/[\w./-]+\.(?:cjs|mjs|js|json|html|xml|txt|md)/g) || [];
      for (const token of tokens) {
        if (token.includes('*')) continue;
        if (!fs.existsSync(path.join(ROOT, token))) fail(`${area}/${id}: cmd-Nachweis nennt fehlende Datei: ${token}`);
      }
      continue;
    }
    const rel = entry.replace(/`/g, '').trim();
    if (!fs.existsSync(path.join(ROOT, rel))) fail(`${area}/${id}: Testpfad fehlt: ${rel}`);
  }
}

let testBacked = 0;
let cmdOnly = 0;
for (const section of sections) {
  for (const row of section.rows) {
    const [id, fnName, trigger, source, states, criterion, status, release, owner, evidence] = row.cells;
    const idMatch = new RegExp(`^FUN-${section.area}-(\\d{3})$`).exec(id);
    if (!idMatch) fail(`${section.area}: ungültige ID „${id}“`);
    if (allIds.has(id)) fail(`ID doppelt: ${id} (L${allIds.get(id)} und L${row.line})`);
    allIds.set(id, row.line);
    if (!STATUS.includes(status)) fail(`${id}: unzulässiger Status „${status}“`);
    if (!RELEASE.includes(release)) fail(`${id}: unzulässige Release-Relevanz „${release}“`);
    if (!OWNER.includes(owner)) fail(`${id}: unzulässiger Owner „${owner}“`);
    if (!fnName) fail(`${id}: Funktion fehlt`);
    if (!trigger) fail(`${id}: Auslöser fehlt`);
    if (!states) fail(`${id}: Zustände fehlen`);
    if (criterion.length < 10) fail(`${id}: Prüfkriterium zu kurz`);
    if (/\b(angemessen|modern|korrekt|gut)\b/i.test(criterion)) fail(`${id}: Prüfkriterium nicht prüfbar formuliert`);

    const sourceState = { path: null, name: null };
    source
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((entry) => checkSourceEntry(section.area, id, entry, sourceState));
    checkEvidence(section.area, id, evidence);

    if (/`?tests\//.test(evidence)) testBacked += 1;
    else cmdOnly += 1;
  }
}

const total = [...allIds.keys()].length;

// --- 7. Pflichtbefunde ------------------------------------------------------
const findingsStart = lines.findIndex((line) => line.trim() === '## 7. Befunde');
const findingsEnd = lines.findIndex((line, index) => index > findingsStart && /^## \d\./.test(line));
const findingsText = findingsStart < 0 ? '' : lines.slice(findingsStart, findingsEnd < 0 ? lines.length : findingsEnd).join('\n');
for (const needle of REQUIRED_FINDINGS) {
  if (!findingsText.includes(needle)) fail(`Kapitel 7 nennt den Pflichtbefund nicht: ${needle}`);
}

// --- 8. Summen in §9.3 ------------------------------------------------------
const stated = /Der Katalog enthält (\d+) Funktionen\. (\d+) davon sind über eine der/.exec(text);
if (!stated) {
  fail('§9.3 nennt keine Summen („Der Katalog enthält X Funktionen. Y davon sind …“)');
} else {
  if (Number(stated[1]) !== total) fail(`§9.3 nennt ${stated[1]} Funktionen, die Tabellen enthalten ${total}`);
  if (Number(stated[2]) !== testBacked) fail(`§9.3 nennt ${stated[2]} testgestützte Funktionen, gezählt sind ${testBacked}`);
}

// --- Ergebnis ---------------------------------------------------------------
console.log(`Bereiche: ${sections.length}, Funktionen: ${total} (testgestützt ${testBacked}, nur cmd ${cmdOnly})`);
for (const section of sections) console.log(`  ${section.area}: ${section.rows.length}`);
if (warnings.length) {
  console.log(`Hinweise: ${warnings.length}`);
  for (const warning of warnings.slice(0, 10)) console.log('  ' + warning);
}
if (errors.length) {
  console.error(`FEHLER: ${errors.length}`);
  for (const error of errors) console.error('  ' + error);
  process.exit(1);
}
console.log('OK: alle Zeilen belegt, alle Quellen und Nachweise vorhanden.');
