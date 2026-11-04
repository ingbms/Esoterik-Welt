/** Fasst die Diagnose-JSON aus parity-diagnostics.cjs zu einer Vergleichstabelle zusammen. */
const fs = require('node:fs');

const file = process.argv[2];
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const KEYS = ['h1', 'heroIntro', 'sectionHead', 'sectionLedger', 'featureTitle', 'featureRow', 'footer', 'navLink'];

for (const width of [...new Set(rows.map((row) => row.viewport.width))]) {
  const group = rows.filter((row) => row.viewport.width === width);
  const legacy = group.find((row) => row.label === 'legacy');
  const astro = group.find((row) => row.label === 'astro');
  console.log(`\n=== Viewport ${width} ===`);
  console.log(`docHeight        legacy ${legacy.docHeight} / astro ${astro.docHeight}`);
  for (const key of KEYS) {
    const a = legacy[key] || {};
    const b = astro[key] || {};
    const fields = ['width', 'height', 'fontSize', 'color'];
    const diff = fields.filter((field) => a[field] !== b[field]);
    const status = diff.length === 0 ? 'gleich' : `ABWEICHUNG (${diff.join(', ')})`;
    console.log(
      `${key.padEnd(16)} ${status}` +
        (diff.length
          ? ` — legacy ${diff.map((f) => `${f}=${a[f]}`).join(' ')} | astro ${diff.map((f) => `${f}=${b[f]}`).join(' ')}`
          : '')
    );
  }
  console.log(
    'Bilder legacy:',
    JSON.stringify(legacy.images.map((image) => [image.src, image.naturalWidth, image.rendered]))
  );
  console.log(
    'Bilder astro :',
    JSON.stringify(astro.images.map((image) => [image.src, image.naturalWidth, image.rendered]))
  );
  console.log('Blöcke legacy:', JSON.stringify(legacy.blocks));
  console.log('Blöcke astro :', JSON.stringify(astro.blocks));
}
