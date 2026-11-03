// Nachweis-Stichprobe für t_80cee561: der Quellenabgleich muss auf einer
// künstlich erzeugten Divergenz anschlagen — und zwar auf einer Kopie, nie auf
// content/farbwelten (Kartenauflage: Hotspot unangetastet).
//
// Aufruf: node evidence/t_80cee561/divergenz-probe.cjs
// Exit 0 = Guard erkennt alle drei Muster; Exit 1 = mindestens ein Muster
// blieb unerkannt.

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const { loadDocuments, analyseDocuments } = require(path.join(root, 'scripts', 'lib', 'farbwelten-sources.cjs'));

const sourceDir = path.join(root, 'content', 'farbwelten');

function copyOf(contentDir) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'farbwelten-divergenz-'));
  for (const file of fs.readdirSync(contentDir)) fs.copyFileSync(path.join(contentDir, file), path.join(target, file));
  return target;
}

function replaceLine(contentDir, file, search, replacement) {
  const target = path.join(contentDir, file);
  const before = fs.readFileSync(target, 'utf8');
  const lines = before.replace(/\r\n/g, '\n').split('\n');
  const index = lines.findIndex((line) => line.includes(search));
  if (index < 0) throw new Error(`${file}: Zeile mit „${search}" nicht gefunden`);
  lines[index] = replacement;
  fs.writeFileSync(target, lines.join('\n'), 'utf8');
  return { file, before: before.split('\n').find((line) => line.includes(search)), after: replacement };
}

const ALT_19 =
  '- [19] IARC (2023). Monograph on artificial optical radiation. https://www.iarc.who.int';
const ALT_24 = '- [24] NIST / CIE. SI-Werte und Lichtgeschwindigkeit (c = 299 792 458 m/s).';

const scenarios = [
  {
    name: '[19] Altseite zurück auf IARC (2023) mit iarc.who.int-URL',
    file: 'violett.md',
    search: '- [19] IARC 2012',
    replacement: ALT_19,
    expect: { code: 'url-konflikt', id: '19' },
  },
  {
    name: '[24] Altseite ohne URL (längeres Label)',
    file: 'blau.md',
    search: '- [24] NIST SP 330',
    replacement: ALT_24,
    expect: { code: 'url-konflikt', id: '24' },
  },
  {
    name: '[19] gleiche URL, abweichendes Jahr (2023 statt 2012)',
    file: 'violett.md',
    search: '- [19] IARC 2012',
    replacement:
      '- [19] IARC 2023, Monographs Vol. 100D Radiation. https://publications.iarc.who.int/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Radiation-2012',
    expect: { code: 'identitaetskonflikt', id: '19' },
  },
];

let failed = 0;
for (const scenario of scenarios) {
  const dir = copyOf(sourceDir);
  try {
    const changed = replaceLine(dir, scenario.file, scenario.search, scenario.replacement);
    const analysis = analyseDocuments(loadDocuments(dir));
    const hit = analysis.errors.find(
      (error) => error.code === scenario.expect.code && error.id === scenario.expect.id
    );
    console.log(`\n## ${scenario.name}`);
    console.log(`   Kopie: ${dir} (Original unverändert)`);
    console.log(`   ${changed.file}: „${changed.before.trim()}"`);
    console.log(`   →      „${changed.after.trim()}"`);
    if (!hit) {
      failed += 1;
      console.log(`   ERGEBNIS: NICHT ERKANNT (erwartet ${scenario.expect.code} für [${scenario.expect.id}])`);
      for (const error of analysis.errors) console.log(`     unerwartet: ${error.message}`);
      continue;
    }
    console.log(`   ERGEBNIS: erkannt als ${hit.code} für [${hit.id}]`);
    console.log(`   Meldung: ${hit.message}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log(
  failed
    ? `\n${failed} von ${scenarios.length} Divergenzfällen blieben unerkannt.`
    : `\nAlle ${scenarios.length} Divergenzfälle erkannt; content/farbwelten/*.md blieb unverändert.`
);
process.exitCode = failed ? 1 : 0;
