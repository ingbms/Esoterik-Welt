// Viewport-Screenshots (nicht fullPage) für die Sichtprüfung.
// Aufruf: node probe-shots-viewport.mjs <root> <outdir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const outDir = path.resolve(process.argv[3] || 'evidence/t_1cf8b61c/screens/viewport');
fs.mkdirSync(outDir, { recursive: true });
const { server, base } = await startServer(rootDir, 3288);
const CASES = [
  ['kompass', '#farbwelten/kompass', 390, 900],
  ['kompass-panel', '#farbwelten/kompass', 1440, 900],
  ['zeitleiste', '#farbwelten/zeitleiste', 390, 900],
  ['farbmeditation', '#farbwelten/farbmeditation', 390, 900],
  ['tuerkis', '#farbwelten/tuerkis', 390, 900],
  ['farbtherapie', '#farbwelten/farbtherapie', 1440, 900],
];
const browser = await chromium.launch();
const out = [];
for (const [name, hash, width, height] of CASES) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/${hash}`);
  await page.waitForTimeout(350);
  // Beim Panel-Screenshot das Panel in den Blick holen.
  if (name === 'kompass-panel') await page.locator('.fw-kompass__panel').scrollIntoViewIfNeeded();
  const file = path.join(outDir, `${name}-${width}.png`);
  await page.screenshot({ path: file, fullPage: false });
  out.push({ name, file, bytes: fs.statSync(file).size });
  await context.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(out, null, 2));
