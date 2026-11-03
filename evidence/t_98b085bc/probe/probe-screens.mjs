// Belegbilder der Rework-Karte t_98b085bc (Kompass und Themenseiten).
// Aufruf: node probe-screens.mjs <base-url> <ausgabeverzeichnis>
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:8237/Esoterik-Welt/';
const output = path.resolve(process.argv[3] || 'evidence/t_98b085bc/screens');
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch();
const shots = [
  { hash: 'farbwelten/kompass', suffix: 'kompass' },
  { hash: 'farbwelten/farbtherapie', suffix: 'farbtherapie' },
  { hash: 'farbwelten/farbpsychologie', suffix: 'farbpsychologie' },
  { hash: 'farbwelten/lichtmedizin', suffix: 'lichtmedizin' },
  { hash: 'farbwelten', suffix: 'landing' },
];
for (const shot of shots) {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${base}#${shot.hash}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(output, `${shot.suffix}-${width}.png`), fullPage: true });
    await context.close();
  }
}

// Kompass-Panel je Farbwelt (nur der Panelbereich, 1440 px).
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
await page.goto(`${base}#farbwelten/kompass`, { waitUntil: 'networkidle' });
for (const id of ['tuerkis', 'magenta', 'rosa', 'weiss', 'schwarz']) {
  await page.locator(`input[name="fwCompassColor"][value="${id}"]`).check();
  await page.waitForTimeout(80);
  await page.locator('#fwCompassPanel').screenshot({ path: path.join(output, `panel-${id}.png`) });
}
await context.close();
await browser.close();
console.log(`Screenshots geschrieben: ${output}`);
