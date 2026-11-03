/** Screenshots für den Prüfnachweis (nur Chromium — kein Safari-Ersatz). */
import { chromium } from 'playwright';
import fs from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3333/Esoterik-Welt';
const dir = process.argv[3] || 'evidence/t_4a8106de';
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
await page.waitForSelector('#fqFreqRange');
await page.screenshot({ path: `${dir}/chromium-lab-1440.png`, fullPage: false });

// Fehlerzustand: ungültige Frequenz
await page.fill('#fqFreqNumber', '0');
await page.dispatchEvent('#fqFreqNumber', 'change');
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/chromium-lab-error.png`, fullPage: false });

// Mobile Viewport (Chromium, keine iOS-Emulation der Audio-API)
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mobile.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
await mobile.waitForSelector('#fqFreqRange');
await mobile.screenshot({ path: `${dir}/chromium-lab-390.png`, fullPage: false });

// Hub mit Evidenz-Badges
await page.goto(`${baseUrl}/#frequenzen`, { waitUntil: 'networkidle' });
await page.waitForSelector('.fq-badge');
await page.screenshot({ path: `${dir}/chromium-hub-1440.png`, fullPage: false });

await browser.close();
console.log('screenshots ok');
