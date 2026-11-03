// Liest je Kennung 1-7 alle Fassungen aus den 15 Dokumenten und die
// Registerfassung aus js/data/farbwelten.js. Reine Anzeige, keine Änderung.
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { loadDocuments, readDocument, analyseDocuments } = require('../../scripts/lib/farbwelten-sources.cjs');

const root = path.resolve(__dirname, '../..');
const directory = path.join(root, 'content/farbwelten');
const documents = loadDocuments(directory);
const analysis = analyseDocuments(documents, { strictLabels: true });
const IDs = ['1', '2', '3', '4', '5', '7'];

// Register ist ESM (js/data/farbwelten.js), das Projekt selbst CJS — wie in
// scripts/verify-farbwelten-sync.cjs über ein temporäres Paket laden.
async function loadRegister() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'farbwelten-inspect-'));
  try {
    fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
    fs.copyFileSync(path.join(root, 'js/data/farbwelten.js'), path.join(tmp, 'farbwelten.js'));
    return await import(pathToFileURL(path.join(tmp, 'farbwelten.js')).href);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

(async () => {
  const data = await loadRegister();
  const sources = data.SOURCES;

  for (const id of IDs) {
    const record = analysis.ids.find((entry) => entry.id === id);
    console.log(`\n=== [${id}] ===`);
    if (!record) {
      console.log('  (kommt in keinem Dokument vor)');
      continue;
    }
    record.forms.forEach((form, index) => {
      const score = (form.rawUrl ? 100000 : 0) + form.rawLabel.length;
      console.log(`  FASSUNG ${index + 1} score=${score} (${form.files.length} Dateien: ${form.files.join(', ')})`);
      console.log(`    label: ${JSON.stringify(form.rawLabel)}`);
      console.log(`    url  : ${JSON.stringify(form.rawUrl)}`);
    });
    console.log(`  register.label: ${JSON.stringify(sources[id] && sources[id].label)}`);
    console.log(`  register.url  : ${JSON.stringify(sources[id] && sources[id].url)}`);
    console.log(`  codes: ${record.codes.join(', ') || '-'}`);
  }

  console.log('\n\n=== ROHZEILEN ===');
  for (const document of documents) {
    const parsed = readDocument(document.name, document.source);
    const relevant = parsed.entries.filter((entry) => IDs.includes(entry.id));
    if (!relevant.length) continue;
    console.log(`--- ${document.name}.md`);
    for (const entry of relevant) {
      console.log(`  ${entry.line}: ${entry.raw}`);
    }
  }
})();
