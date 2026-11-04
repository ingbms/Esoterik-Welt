#!/usr/bin/env node
/**
 * Heading-Inventar für den TOC-Piloten (VELARKANA).
 *
 * Liest eine gebaute `dist/`-Ausgabe und meldet je HTML-Seite:
 * Anzahl h1–h6, fehlende IDs, doppelte IDs, doppelte Überschriftentexte,
 * Nicht-ASCII-Überschriften und die längste Überschrift. Damit lassen sich
 * Kandidatenseiten für ein Inhaltsverzeichnis und die Testvektoren aus
 * `docs/velarkana-toc/spezifikation.md` reproduzierbar prüfen.
 *
 * Bewusste Grenzen: Die Überschriften werden per regulärem Ausdruck aus dem
 * ausgelieferten HTML gelesen (kein DOM-Parser, keine neuen Abhängigkeiten).
 * Das genügt für Inventar und Regression, ersetzt aber keinen Browser-Test:
 * clientseitig erzeugte Überschriften sind hier nicht enthalten.
 *
 * Aufruf:
 *   node scripts/toc/heading-inventory.cjs dist
 *   node scripts/toc/heading-inventory.cjs dist --json
 *   node scripts/toc/heading-inventory.cjs dist --page frequenzen/quellen.html
 *   node scripts/toc/heading-inventory.cjs dist --min 8
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith('--'));
if (!root) {
  console.error(
    'Aufruf: node scripts/toc/heading-inventory.cjs <dist-verzeichnis> [--json] [--page <rel>] [--min <n>]'
  );
  process.exit(2);
}
const asJson = args.includes('--json');
const pageArg = args.includes('--page') ? args[args.indexOf('--page') + 1] : null;
const minArg = args.includes('--min') ? Number(args[args.indexOf('--min') + 1]) : 3;

const HEADING_RE = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const ID_RE = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
const TAG_RE = /<[^>]+>/g;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', shy: '\u00ad' };

function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body) => {
    const lower = body.toLowerCase();
    if (lower.startsWith('#x')) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return Object.prototype.hasOwnProperty.call(ENTITIES, lower) ? ENTITIES[lower] : match;
  });
}

function cleanText(html) {
  return decodeEntities(html.replace(TAG_RE, '')).replace(/\s+/g, ' ').trim();
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_astro' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function headingList(html) {
  const list = [];
  HEADING_RE.lastIndex = 0;
  let match;
  while ((match = HEADING_RE.exec(html)) !== null) {
    const attrs = match[2] || '';
    const idMatch = ID_RE.exec(attrs);
    list.push({
      level: Number(match[1]),
      id: idMatch ? (idMatch[1] ?? idMatch[2] ?? '') : null,
      text: cleanText(match[3] || ''),
      srOnly: /\bclass\s*=\s*["'][^"']*\bsr-only\b/i.test(attrs),
      hidden: /\bhidden\b|\baria-hidden\s*=\s*["']true["']/i.test(attrs),
    });
  }
  return list;
}

/**
 * Nur der Hauptinhalt zählt für ein Seiten-Inhaltsverzeichnis. Kopf- und
 * Fußzeile tragen eigene Überschriften (Tools/Wissen/Rechtliches); sie sind
 * keine Abschnitte des Artikels und dürfen die Kandidatenzahl nicht verfälschen.
 */
function mainContent(html) {
  const match = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  return match ? match[1] : html;
}

function duplicates(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

const files = walk(root, []).sort();
const pages = [];

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const headings = headingList(mainContent(html));
  if (pageArg && path.relative(root, file).replace(/\\/g, '/') !== pageArg) continue;
  const ids = headings.map((h) => h.id).filter(Boolean);
  const texts = headings.map((h) => h.text).filter(Boolean);
  pages.push({
    page: path.relative(root, file).replace(/\\/g, '/'),
    total: headings.length,
    counts: [1, 2, 3, 4, 5, 6].reduce((acc, level) => {
      acc[level] = headings.filter((h) => h.level === level).length;
      return acc;
    }, {}),
    candidates: headings.filter((h) => h.level >= 2 && !h.srOnly && !h.hidden).length,
    missingIds: headings.filter((h) => h.level >= 2 && !h.id).length,
    srOnly: headings.filter((h) => h.srOnly).length,
    duplicateIds: duplicates(ids),
    duplicateTexts: duplicates(texts),
    nonAscii: headings.filter((h) => /[^\x20-\x7e\u00a0-\u00ff]/.test(h.text) || /[äöüß]/i.test(h.text)).length,
    maxTextLength: headings.reduce((max, h) => Math.max(max, h.text.length), 0),
    headings: pageArg ? headings : undefined,
  });
}

const summary = {
  root,
  files: pages.length,
  headings: pages.reduce((sum, p) => sum + p.total, 0),
  candidates: pages.reduce((sum, p) => sum + p.candidates, 0),
  missingIds: pages.reduce((sum, p) => sum + p.missingIds, 0),
  duplicateIdPages: pages.filter((p) => p.duplicateIds.length > 0).map((p) => p.page),
  duplicateTextPages: pages.filter((p) => p.duplicateTexts.length > 0).map((p) => p.page),
  h4plus: pages.reduce((sum, p) => sum + p.counts[4] + p.counts[5] + p.counts[6], 0),
  pagesWithoutHeadings: pages.filter((p) => p.total === 0).map((p) => p.page),
};

if (asJson) {
  console.log(JSON.stringify({ summary, pages }, null, 2));
  process.exit(0);
}

console.log(`# Heading-Inventar ${root}`);
console.log('');
console.log(`- HTML-Dateien: ${summary.files}`);
console.log(`- Überschriften h1–h6: ${summary.headings}`);
console.log(`- TOC-Kandidaten (h2–h6, ohne sr-only/hidden): ${summary.candidates}`);
console.log(`- Kandidaten ohne ID: ${summary.missingIds}`);
console.log(`- h4–h6 gesamt: ${summary.h4plus}`);
console.log(`- Seiten mit doppelten IDs: ${summary.duplicateIdPages.length}`);
console.log(`- Seiten mit doppelten Überschriftentexten: ${summary.duplicateTextPages.length}`);
console.log(`- Seiten ohne Überschriften: ${summary.pagesWithoutHeadings.join(', ') || '—'}`);
console.log('');

if (pageArg) {
  const page = pages[0];
  if (!page) {
    console.error(`Seite nicht gefunden: ${pageArg}`);
    process.exit(1);
  }
  console.log(`## ${page.page}`);
  for (const [index, h] of page.headings.entries()) {
    console.log(
      `${String(index + 1).padStart(2, '0')} h${h.level} ${h.id ? `#${h.id}` : '(ohne ID)'}${h.srOnly ? ' [sr-only]' : ''} | ${h.text}`
    );
  }
  process.exit(0);
}

const table = pages.filter((p) => p.candidates >= minArg).sort((a, b) => b.candidates - a.candidates);
console.log(`## Seiten mit mindestens ${minArg} Kandidaten (${table.length})`);
console.log('');
console.log('| Seite | h2 | h3 | h4+ | ohne ID | doppelte IDs | längste Überschrift |');
console.log('|---|---:|---:|---:|---:|---:|---:|');
for (const p of table) {
  console.log(
    `| ${p.page} | ${p.counts[2]} | ${p.counts[3]} | ${p.counts[4] + p.counts[5] + p.counts[6]} | ${p.missingIds} | ${p.duplicateIds.length} | ${p.maxTextLength} |`
  );
}
