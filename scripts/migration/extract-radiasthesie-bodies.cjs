/**
 * Extrahiert die Inhaltsfragmente der sieben statischen Radiästhesie-Dokumente.
 *
 * Warum: Die Astro-Neuimplementierung der Bereichsseiten ließ Text weg
 * (Review B-2: −15 % bis −40 %, fehlende Abschnitte, fehlendes
 * Inhaltsverzeichnis). Die Dokumente werden im Bestand aus
 * `js/data/radiasthesie.js` erzeugt; der Generator
 * (`scripts/generate-radiasthesie-pages.cjs`) liegt unverändert vor. Statt die
 * Redaktionsstruktur ein zweites Mal nachzubauen, übernimmt Astro den
 * erzeugten Inhaltsblock 1:1 als Content-Fragment — dieselbe Vorgehensweise
 * wie bei den Rechtstexten (`src/content/legal/`).
 *
 * Entfernt werden nur Gerüstteile, die das Astro-Layout liefert:
 * Brotkrumen-Navigation (BaseLayout rendert sie aus `trail`) und der
 * umschließende `<main>`-Rahmen.
 *
 * Aufruf:
 *   node scripts/migration/extract-radiasthesie-bodies.cjs           # schreiben
 *   node scripts/migration/extract-radiasthesie-bodies.cjs --check   # prüfen
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT, 'radiasthesie');
const TARGET_DIR = path.join(ROOT, 'src', 'content', 'radiasthesie');
const DOCS = ['index', 'radiasthesie', 'pendeln', 'orakel', 'glossar', 'quellen', 'methodik'];

/** Inhaltsblock einer Bestandsseite: `<main>` ohne Brotkrumen-Navigation. */
function extractBody(html) {
  const match = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  if (!match) throw new Error('Kein <main>-Element gefunden');
  let body = match[1];
  body = body.replace(/<nav class="astro-breadcrumb"[\s\S]*?<\/nav>/i, '');
  return `${body.trim()}\n`;
}

function main() {
  const check = process.argv.includes('--check');
  const problems = [];
  let written = 0;

  for (const doc of DOCS) {
    const source = path.join(SOURCE_DIR, `${doc}.html`);
    const target = path.join(TARGET_DIR, `${doc}.body.html`);
    if (!fs.existsSync(source)) {
      problems.push(`Quelle fehlt: ${path.relative(ROOT, source)}`);
      continue;
    }
    const body = extractBody(fs.readFileSync(source, 'utf8'));
    if (check) {
      const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
      if (current !== body) problems.push(`Fragment veraltet: ${path.relative(ROOT, target)}`);
    } else {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
      fs.writeFileSync(target, body, 'utf8');
      written += 1;
    }
  }

  if (check) {
    if (problems.length) {
      console.error(problems.join('\n'));
      process.exit(1);
    }
    console.log(`Radiästhesie-Fragmente aktuell (${DOCS.length} Dokumente).`);
    return;
  }
  console.log(`Radiästhesie-Fragmente geschrieben: ${written} Dokumente in ${path.relative(ROOT, TARGET_DIR)}.`);
}

main();
