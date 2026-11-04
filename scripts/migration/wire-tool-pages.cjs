/**
 * Ergänzt die Werkzeugseiten um eingebettete Frequenzdaten bzw. Asset-Rebasing.
 * Einmaliger Codemod; die Änderungen sind danach normaler Quelltext.
 */
const fs = require('node:fs');

const freqPages = [
  'src/pages/frequenzen/index.astro',
  'src/pages/frequenzen/labor.astro',
  'src/pages/frequenzen/cymatics.astro',
  'src/pages/frequenzen/meditation.astro',
];

for (const file of freqPages) {
  let astro = fs.readFileSync(file, 'utf8');
  if (!astro.includes("EmbeddedJson")) {
    astro = astro.replace(
      "import body from '../../content/tools/frequenzen.html?raw';",
      "import body from '../../content/tools/frequenzen.html?raw';\nimport EmbeddedJson from '../../components/EmbeddedJson.astro';\nimport frequenciesJson from '../../../data/frequencies.json';"
    );
    astro = astro.replace(
      '  <Fragment set:html={body} />',
      '  <Fragment set:html={body} />\n  <EmbeddedJson id="local-frequencies-data" data={frequenciesJson} />'
    );
    fs.writeFileSync(file, astro, 'utf8');
    console.log('frequenzen aktualisiert:', file);
  }
}

const pendelPages = [
  'src/pages/pendeln/labor.astro',
  'src/pages/pendeln/studio.astro',
  'src/pages/pendeln/experiment.astro',
  'src/pages/pendeln/journal.astro',
];

for (const file of pendelPages) {
  let astro = fs.readFileSync(file, 'utf8');
  if (!astro.includes('rebaseAssets')) {
    astro = astro.replace(
      '  import { RadiasthesieLoader } from',
      '  import { rebaseAssets } from "../../lib/rebase-assets";\n  import { RadiasthesieLoader } from'
    );
    // Nach dem Rendern rebasen (die Ansicht entsteht erst in show()).
    astro = astro.replace(/(\n    await loader\.show\(\[[^\]]*\]\);)/, '$1\n    rebaseAssets(root);');
    fs.writeFileSync(file, astro, 'utf8');
    console.log('pendeln aktualisiert:', file);
  }
}
