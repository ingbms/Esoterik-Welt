#!/usr/bin/env node
/**
 * Kopiert die Bild- und Schrift-Assets des Bestands in Astros Static-Verzeichnis.
 *
 * Warum kopieren und nicht einchecken: `assets/` umfasst 644 Dateien / 94 MB.
 * Sie ein zweites Mal ins Repository zu legen, würde das Repo verdoppeln und
 * jede Änderung doppelt pflegen lassen. `public/assets/` ist deshalb
 * gitignoriert und wird vor `dev`/`build` erzeugt — die Quelle bleibt `assets/`.
 *
 * Bewusst ausgelassen: `assets/radiasthesie/media/original/` (27 MB
 * unbearbeitete Originale, laut Inventar nur Quelle für Ableitungen) und
 * `assets/tarot/<deck>/manifest.json` bleibt enthalten (Deck-Metadaten).
 *
 * Aufruf: node scripts/sync-public-assets.cjs [--quiet]
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets');
const target = path.join(root, 'public/assets');
const quiet = process.argv.includes('--quiet');

/** Was tatsächlich ausgeliefert wird — je Eintrag eine Quelle und ein Ziel. */
const TREES = [
  { from: 'fonts', to: 'fonts' },
  { from: 'crystals', to: 'crystals' },
  { from: 'mineral', to: 'mineral' },
  { from: 'cosmos', to: 'cosmos' },
  { from: 'tarot', to: 'tarot' },
  { from: 'radiasthesie/media/520', to: 'radiasthesie/media/520' },
  { from: 'radiasthesie/media/1040', to: 'radiasthesie/media/1040' },
  { from: 'radiasthesie/media/ATTRIBUTION.md', to: 'radiasthesie/media/ATTRIBUTION.md' },
  { from: 'radiasthesie/media/bildnachweis.html', to: 'radiasthesie/media/bildnachweis.html' },
  { from: 'radiasthesie/media/media-manifest.json', to: 'radiasthesie/media/media-manifest.json' },
];

const FILES = [{ from: 'favicon.svg', to: 'favicon.svg' }];

function copyRecursive(from, to) {
  const stats = fs.statSync(from);
  if (stats.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    let count = 0;
    for (const entry of fs.readdirSync(from)) {
      count += copyRecursive(path.join(from, entry), path.join(to, entry));
    }
    return count;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return 1;
}

let copied = 0;
const skipped = [];
fs.mkdirSync(target, { recursive: true });

for (const tree of TREES) {
  const from = path.join(source, tree.from);
  if (!fs.existsSync(from)) {
    skipped.push(tree.from);
    continue;
  }
  copied += copyRecursive(from, path.join(target, tree.to));
}

for (const file of FILES) {
  const from = path.join(source, file.from);
  if (!fs.existsSync(from)) {
    skipped.push(file.from);
    continue;
  }
  copied += copyRecursive(from, path.join(target, file.to));
}

// Zeichnungen liegen direkt unter assets/radiasthesie/*.svg
const drawingsDir = path.join(source, 'radiasthesie');
if (fs.existsSync(drawingsDir)) {
  for (const entry of fs.readdirSync(drawingsDir)) {
    if (!entry.endsWith('.svg')) continue;
    copied += copyRecursive(path.join(drawingsDir, entry), path.join(target, 'radiasthesie', entry));
  }
}

if (!quiet) {
  console.log(JSON.stringify({ copied, target: 'public/assets', skipped }, null, 2));
}
