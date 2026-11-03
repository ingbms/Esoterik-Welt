// Abnahme t_1cf8b61c — Screenshots der neuen Ansichten (390 und 1440 px).
// Aufruf: node probe-screens.mjs <root> <zielverzeichnis>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const outDir = path.resolve(process.argv[3] || 'evidence/t_1cf8b61c/screens');
fs.mkdirSync(outDir, { recursive: true });
const { server, base } = await startServer(rootDir, 3290);
const ROUTES = [
  ['farbwelten', '#farbwelten'],
  ['tuerkis', '#farbwelten/tuerkis'],
  ['magenta', '#farbwelten/magenta'],
  ['rosa', '#farbwelten/rosa'],
  ['weiss', '#farbwelten/weiss'],
  ['schwarz', '#farbwelten/schwarz'],
  ['farbtherapie', '#farbwelten/farbtherapie'],
  ['farbpsychologie', '#farbwelten/farbpsychologie'],
  ['lichtmedizin', '#farbwelten/lichtmedizin'],
  ['kompass', '#farbwelten/kompass'],
  ['farbmeditation', '#farbwelten/farbmeditation'],
  ['zeitleiste', '#farbwelten/zeitleiste'],
];

const browser = await chromium.launch();
const shots = [];
for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const [name, hash] of ROUTES) {
    await page.goto(`${base}/${hash}`);
    await page.waitForTimeout(320);
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(outDir, `${name}-${width}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const size = fs.statSync(file).size;
    shots.push({ name, width, file, bytes: size });
  }
  await context.close();
}
await browser.close();
server.close();
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(shots, null, 2));
console.log(JSON.stringify({ screenshots: shots.length, dir: outDir, minBytes: Math.min(...shots.map((s) => s.bytes)) }, null, 2));
