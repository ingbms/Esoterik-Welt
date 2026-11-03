// Bringt je Kennung 1-7 die Bibliografie-Zeile in allen 15 Redaktionsseiten
// auf eine kanonische Fassung. Ändert ausschließlich Zeilen der Form
// „- [n] …" im Abschnitt „## Quellen" — keine Prosa.
//
// Aufruf:  node evidence/t_22e3d9aa/apply-canonical.cjs [--dry]
//
// Kanonisch ist die Vollfassung, die im Register (js/data/farbwelten.js,
// SOURCES[n].label) steht. Zwei Abweichungen sind belegt korrigiert und in
// NACHWEIS.md begründet: [5] Autorinnenkürzel Tremea, I. (Crossref) und
// [7] Journalkürzel „Psychon Bull Rev" (Crossref short-container-title).
//
// Kursivdruck (…) um Journal-/Buchtitel ist Seitentypografie; der Abgleich
// normalisiert Markdown-Betonung weg, deshalb bleiben die beiden Seiten, die
// ihre gesamte Bibliografie so setzen (farbwelten, rot), dabei.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contentDir = path.join(root, 'content/farbwelten');
const dryRun = process.argv.includes('--dry');

const SPEC = {
  1: {
    plain: 'Leland, D. (2017). "The Rainbow Body: How the Western Chakra System Came to Be." Quest 105.2',
    emphasis:
      'Leland, D. (2017). "The Rainbow Body: How the Western Chakra System Came to Be." *Quest* 105.2',
  },
  2: {
    plain: 'Woodroffe, J. G. (1919, Übers.) / Avalon, A. The Serpent Power',
    emphasis: 'Woodroffe, J. G. (1919, Übers.) / Avalon, A. *The Serpent Power*',
  },
  3: {
    plain:
      'Jonauskaite, D. & Mohr, C. (2025). "Do we feel colours? A systematic review of 128 years of psychological research linking colours and emotions." Psychon Bull Rev 32(4), 1457–1486',
  },
  4: {
    plain:
      'Jonauskaite, D. et al. (2020). "Universal Patterns in Color-Emotion Associations Are Further Shaped by Linguistic and Geographic Proximity." Psychological Science 31(10), 1245–1260',
  },
  5: {
    plain:
      'Jonauskaite, D., Tremea, I., Bürki, L., Diouf, C. N. & Mohr, C. (2020). "To see or not to see: Importance of color perception to color therapy." Color Research & Application 45(3), 450–464',
  },
  7: {
    plain:
      'Gnambs, T. (2020). "Limited evidence for the effect of red color on cognitive performance: A meta-analysis." Psychon Bull Rev 27, 1374–1382',
  },
};

const ENTRY = /^(\s*-\s+)\[(\d{1,2})\]\s*(.*)$/;
const URL_AT_END = /(https?:\/\/\S+)\s*$/;

let changed = 0;
let unchanged = 0;
let failures = 0;

for (const file of fs.readdirSync(contentDir).filter((name) => name.endsWith('.md')).sort()) {
  const target = path.join(contentDir, file);
  const source = fs.readFileSync(target, 'utf8');
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.split(/\r?\n/);

  // Abschnitt „## Quellen" eingrenzen.
  const start = lines.findIndex((line) => /^##\s+quellen\b/i.test(line));
  if (start < 0) {
    console.log(`FEHLER ${file}: kein Abschnitt ## Quellen`);
    failures += 1;
    continue;
  }
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }

  for (let index = start; index < end; index += 1) {
    const match = ENTRY.exec(lines[index]);
    if (!match) continue;
    const id = Number(match[2]);
    const spec = SPEC[id];
    if (!spec) continue;

    const urlMatch = URL_AT_END.exec(match[3]);
    if (!urlMatch) {
      console.log(`FEHLER ${file} [${id}]: Bibliografie-Zeile ohne URL`);
      failures += 1;
      continue;
    }
    const url = urlMatch[1];
    // Kursivdruck nur dort weiterführen, wo die Zeile ihn schon hatte: er ist
    // Seitentypografie, keine bibliografische Angabe.
    const hadEmphasis = /\*[^*\n]+\*/.test(match[3]);
    const label = hadEmphasis && spec.emphasis ? spec.emphasis : spec.plain;
    const next = `${match[1]}[${id}] ${label}. ${url}`;
    if (next === lines[index]) {
      unchanged += 1;
      continue;
    }
    changed += 1;
    console.log(`${dryRun ? 'WÜRDE' : 'ÄNDERE'} ${file}:${index + 1} [${id}]`);
    console.log(`  alt: ${lines[index]}`);
    console.log(`  neu: ${next}`);
    lines[index] = next;
  }

  if (!dryRun) {
    const nextSource = lines.join(eol);
    if (nextSource !== source) fs.writeFileSync(target, nextSource, 'utf8');
  }
}

console.log(
  `\n${dryRun ? 'Probelauf' : 'Angewendet'}: ${changed} Zeilen geändert, ${unchanged} bereits kanonisch, ${failures} Fehler`
);
if (failures) process.exitCode = 1;
