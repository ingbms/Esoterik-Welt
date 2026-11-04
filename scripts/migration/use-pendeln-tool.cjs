const fs = require('node:fs');

const pages = {
  'src/pages/pendeln/labor.astro': { view: 'labor', title: 'Pendellabor' },
  'src/pages/pendeln/studio.astro': { view: 'studio', title: 'Pendeltafel-Studio' },
  'src/pages/pendeln/experiment.astro': { view: 'experiment', title: 'Experimentierlabor' },
  'src/pages/pendeln/journal.astro': { view: 'journal', title: 'Pendeltagebuch' },
};

for (const [file, { view, title }] of Object.entries(pages)) {
  let astro = fs.readFileSync(file, 'utf8');
  astro = astro.replace(
    "import body from '../../content/tools/pendeln.html?raw';",
    "import PendelnTool from '../../components/PendelnTool.astro';"
  );
  astro = astro.replace('  <Fragment set:html={body} />', `  <PendelnTool view="${view}" title="${title}" />`);
  astro = astro.replace(/\n\n<script>[\s\S]*?<\/script>\s*$/, '\n');
  fs.writeFileSync(file, astro, 'utf8');
  console.log('umgestellt:', file);
}
