// Schreibt `attribution_text_required` aus der Ableitungsregel
// (scripts/lib/crystal-attribution.cjs) in alle ausgelieferten Stellen:
//
//   assets/crystals/manifest.json            maschinenlesbarer Lizenznachweis
//   data/crystals.json                       Datenmodell der Seite
//   docs/kristalle/QUELLEN-RECHTS-MANIFEST.md  "Pflicht-Namensnennung"
//
// Zusätzlich spiegelt das Skript `credit.alt` in `image_alt` und in die Zeile
// "Bildbeschreibung (Alt-Text)" des Sammelnachweises (Alt-Texte werden im
// Manifest gepflegt, nicht doppelt) und ergänzt `adaptation_license` für
// ShareAlike-Bilder.
//
//   node scripts/sync-crystal-attribution.cjs           # schreiben
//   node scripts/sync-crystal-attribution.cjs --check   # nur prüfen (Exit 1 bei Abweichung)

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildAttributionText, checkAttributionText } = require('./lib/crystal-attribution.cjs');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'assets', 'crystals', 'manifest.json');
const DATA = path.join(ROOT, 'data', 'crystals.json');
const LEDGER = path.join(ROOT, 'docs', 'kristalle', 'QUELLEN-RECHTS-MANIFEST.md');

const EOL = '\r\n';
const ALT_PREFIX = '- Bildbeschreibung (Alt-Text): ';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Manifest genau wie der Python-Generator (indent=1, abschließender Zeilenumbruch). */
function serializeManifest(manifest) {
  return (JSON.stringify(manifest, null, 1) + '\n').replace(/\r?\n/g, EOL);
}

/** data/crystals.json: ein Datensatz pro Zeile (Format des Generators). */
function serializeData(data) {
  const lines = data.crystals.map((crystal) => '    ' + JSON.stringify(crystal));
  return `{${EOL}  "crystals": [${EOL}${lines.join(',' + EOL)}${EOL}  ]${EOL}}${EOL}`;
}

/** Ersetzt in jeder crys-xx-Sektion die Zeile "Pflicht-Namensnennung" und
 *  führt nach den Prüfsummen die Zeile "Bildbeschreibung (Alt-Text)". */
function updateLedger(text, texts, alts) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let currentId = null;
  let replaced = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const sectionId = /^##\s+(crys-\d+)\b/.exec(line);
    if (sectionId) {
      currentId = sectionId[1];
      out.push(line);
      continue;
    }
    if (!currentId) {
      out.push(line);
      continue;
    }
    if (line === '') {
      // Leerzeile beendet den Abschnitt nicht (folgt direkt auf die Überschrift).
      out.push(line);
      continue;
    }
    if (line.startsWith('- Pflicht-Namensnennung: ')) {
      const next = `- Pflicht-Namensnennung: ${texts[currentId]}`;
      if (line !== next) replaced += 1;
      out.push(next);
      continue;
    }
    if (line.startsWith(ALT_PREFIX)) {
      const next = `${ALT_PREFIX}${alts[currentId]}`;
      if (line !== next) replaced += 1;
      out.push(next);
      continue;
    }
    if (line.startsWith('- Prüfsummen: ')) {
      out.push(line);
      // Alt-Zeile nur ergänzen, wenn die Sektion noch keine hat (idempotent).
      const boundary = lines.findIndex((later, index) => index > i && (later === '' || /^##\s+/.test(later)));
      const stop = boundary === -1 ? lines.length : boundary;
      const hasAlt = lines.slice(i + 1, stop).some((later) => later.startsWith(ALT_PREFIX));
      if (!hasAlt) {
        out.push(`${ALT_PREFIX}${alts[currentId]}`);
        replaced += 1;
      }
      continue;
    }
    out.push(line);
  }
  // Einheitliche Zeilenenden: der Sammelnachweis ist durchgehend CRLF.
  return { text: out.join(EOL), replaced };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const manifest = readJson(MANIFEST);
  const data = readJson(DATA);
  const rawData = fs.readFileSync(DATA, 'utf8');
  const ledger = fs.readFileSync(LEDGER, 'utf8');

  const texts = {};
  const originalTexts = {};
  const alts = {};
  const problems = [];
  for (const image of manifest.images) {
    texts[image.id] = buildAttributionText(image);
    originalTexts[image.id] = image.attribution_text_required;
    alts[image.id] = image.credit.alt;
    const deviations = checkAttributionText(image, image.attribution_text_required);
    if (deviations.length) {
      problems.push(`${image.id}: ${deviations.join('; ')}`);
    }
    image.attribution_text_required = texts[image.id];
    if (!Object.prototype.hasOwnProperty.call(image, 'adaptation_license')) {
      image.adaptation_license = image.credit.share_alike
        ? { name: image.credit.license, url: image.credit.license_url }
        : null;
    }
  }

  const byId = new Map(data.crystals.map((crystal) => [crystal.id, crystal]));
  for (const image of manifest.images) {
    const crystal = byId.get(image.id);
    if (!crystal) {
      problems.push(`${image.id}: fehlt in data/crystals.json`);
      continue;
    }
    crystal.attribution_text_required = texts[image.id];
    crystal.image_alt = image.credit.alt;
    if (crystal.image_credit) {
      crystal.image_credit.changes = image.credit.changes;
    }
  }

  const nextLedger = updateLedger(ledger, texts, alts);
  const missingSections = manifest.images.filter((image) => !ledger.includes(`## ${image.id} `));
  if (missingSections.length) {
    problems.push(`Ledger ohne Sektion: ${missingSections.map((i) => i.id).join(', ')}`);
  }

  const nextManifest = serializeManifest(manifest);
  const nextData = serializeData(data);

  if (checkOnly) {
    const stale = manifest.images.filter((image) => originalTexts[image.id] !== texts[image.id]);
    if (stale.length) problems.push(`Manifest veraltet: ${stale.map((i) => i.id).join(', ')}`);
    if (nextLedger.replaced) problems.push(`Ledger veraltet: ${nextLedger.replaced} Zeile(n)`);
    if (nextData !== rawData) problems.push('data/crystals.json veraltet');
    if (problems.length) {
      console.error('Abweichungen gefunden:');
      for (const problem of problems) console.error(' - ' + problem);
      process.exitCode = 1;
      return;
    }
    console.log(`OK: ${manifest.images.length}/${manifest.images.length} attribution_text_required deckungsgleich.`);
    return;
  }

  fs.writeFileSync(MANIFEST, nextManifest);
  fs.writeFileSync(DATA, nextData);
  fs.writeFileSync(LEDGER, nextLedger.text);
  console.log(`manifest: ${manifest.images.length} Texte geschrieben`);
  console.log(`data/crystals.json: ${data.crystals.length} Datensätze`);
  console.log(`Ledger: ${nextLedger.replaced} Zeile(n) aktualisiert`);
  if (problems.length) {
    for (const problem of problems) console.error('Hinweis: ' + problem);
    process.exitCode = 1;
  }
}

main();
