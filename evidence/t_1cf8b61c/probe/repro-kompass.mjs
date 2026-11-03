// Minimaler Repro für den Kompass-Befund (B1).
// Aufruf: node repro-kompass.mjs <root> <out.json> <out.png>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const outJson = process.argv[3] || 'evidence/t_1cf8b61c/probe/repro-kompass.json';
const outPng = process.argv[4] || 'evidence/t_1cf8b61c/screens/repro-kompass-1440.png';
const { server, base } = await startServer(rootDir, 3289);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
await page.goto(`${base}/#farbwelten/kompass`);
await page.waitForTimeout(300);

const before = await page.evaluate(() => ({
  radios: [...document.querySelectorAll('input[name="fwCompassColor"]')].map((node) => node.value),
  selected: document.querySelector('input[name="fwCompassColor"]:checked')?.value,
  panelName: document.getElementById('fwCompassName')?.textContent.trim(),
  sectionLabel: [...document.querySelectorAll('#kompass .label')].map((node) => node.textContent.trim()),
}));

await page.locator('input[name="fwCompassColor"][value="tuerkis"]').click();
await page.waitForTimeout(400);
const after = await page.evaluate(() => ({
  checked: document.querySelector('input[name="fwCompassColor"]:checked')?.value,
  panelName: document.getElementById('fwCompassName')?.textContent.trim(),
  panelMeta: document.querySelector('.fw-kompass__meta')?.textContent.trim(),
  status: document.querySelector('#fwCompassSummary')?.textContent.trim(),
  focus: document.activeElement?.value || document.activeElement?.id,
}));
await page.screenshot({ path: outPng, fullPage: false });

await browser.close();
server.close();
const result = { before, after, errors, repro: 'kompass → Türkis wählen' };
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
