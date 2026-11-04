/**
 * Extrahiert die Werkzeug-Abschnitte der Bestands-SPA (`index.html`) als
 * Astro-Fragmente.
 *
 * Warum: Die Werkzeuge (Tarot-Ziehung, Kristallfilter, Mondkalender,
 * Runenwurf, Frequenzlabor, Pendel-Werkzeuge) sind im Bestand fertige
 * Vanilla-Module, die einen bestimmten DOM erwarten. Die erste Astro-Fassung
 * hatte nur beschreibende Textseiten (Review B-7: 0 form/input/button). Statt
 * die Oberflächen neu zu bauen, übernimmt Astro das Bestandsmarkup 1:1 und
 * initialisiert dieselben Module als Inseln.
 *
 * Aufruf:
 *   node scripts/migration/extract-tools.cjs           # schreiben
 *   node scripts/migration/extract-tools.cjs --check   # prüfen
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE = path.join(ROOT, 'index.html');
const TARGET_DIR = path.join(ROOT, 'src', 'content', 'tools');
const SECTIONS = {
  tarot: 'tarot',
  kristalle: 'crystals',
  mondphasen: 'moon',
  runen: 'runes',
  frequenzen: 'frequenzen',
  pendeln: 'pendeln',
  astrologie: 'astrologie',
};

/** Schneidet einen `<section id="…">…</section>`-Block per Tiefenzählung aus. */
function sliceSection(html, id) {
  const open = new RegExp(`<section\\s+id="${id}"[^>]*>`, 'i').exec(html);
  if (!open) throw new Error(`Abschnitt #${id} nicht gefunden`);
  const start = open.index;
  let index = start + open[0].length;
  let depth = 1;
  const tag = /<(\/?)section\b[^>]*>/gi;
  tag.lastIndex = index;
  let match;
  while ((match = tag.exec(html))) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) {
      return {
        openTag: open[0],
        inner: html.slice(start + open[0].length, match.index),
        end: match.index + match[0].length,
      };
    }
  }
  throw new Error(`Abschnitt #${id} nicht geschlossen`);
}

function extract(html, id) {
  const { openTag, inner } = sliceSection(html, id);
  const cleanOpen = openTag
    .replace(/\s+class="[^"]*"/i, '')
    .replace(/\s+hidden(?:="[^"]*")?/i, '')
    .replace(/^<section/i, '<section');
  const body = inner
    .trim()
    // Redaktionsdokument liegt nicht im öffentlichen Build; die Quellenseite
    // des Bereichs ist die veröffentlichte Entsprechung.
    .replace(/href="docs\/frequenz-quellen\.md"/g, 'href="/frequenzen/quellen.html"');
  return `${cleanOpen}\n${body}\n</section>\n`;
}

function main() {
  const check = process.argv.includes('--check');
  const html = fs.readFileSync(SOURCE, 'utf8');
  const problems = [];
  let written = 0;
  for (const [name, id] of Object.entries(SECTIONS)) {
    const fragment = extract(html, id);
    const target = path.join(TARGET_DIR, `${name}.html`);
    if (check) {
      const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
      if (current !== fragment) problems.push(`Fragment veraltet: ${path.relative(ROOT, target)}`);
    } else {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
      fs.writeFileSync(target, fragment, 'utf8');
      written += 1;
    }
  }
  if (check) {
    if (problems.length) {
      console.error(problems.join('\n'));
      process.exit(1);
    }
    console.log(`Werkzeug-Fragmente aktuell (${Object.keys(SECTIONS).length} Abschnitte).`);
    return;
  }
  console.log(`Werkzeug-Fragmente geschrieben: ${written} in ${path.relative(ROOT, TARGET_DIR)}.`);
}

main();
