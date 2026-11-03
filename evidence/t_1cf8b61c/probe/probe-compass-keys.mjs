// Prüft die Tastaturbedienung des Kompass über alle zwölf Optionen.
// Aufruf: node probe-compass-keys.mjs <root> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/compass-keys.json';
const { server, base } = await startServer(rootDir, 3284);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error).slice(0, 160)));
await page.goto(`${base}/#farbwelten/kompass`);
await page.waitForTimeout(300);
await page.locator('input[name="fwCompassColor"]').first().focus();
const steps = [];
for (let index = 0; index < 11; index += 1) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(90);
  steps.push(
    await page.evaluate(() => ({
      checked: document.querySelector('input[name="fwCompassColor"]:checked')?.value,
      focused: document.activeElement?.value,
      panelName: document.getElementById('fwCompassName')?.textContent.trim(),
      panelMeta: document.querySelector('.fw-kompass__meta')?.textContent.trim(),
    }))
  );
}
await browser.close();
server.close();
const summary = { steps, errors, mismatches: steps.filter((step) => step.panelName?.toLowerCase() !== step.checked?.slice(0, 4)) };
fs.writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
