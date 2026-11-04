/** Prüft alle Werkzeug-Inseln: DOM-Zähler, Renderergebnis, Konsolenfehler. */
const { chromium } = require('playwright');

const BASE = process.env.ASTRO_URL || 'http://127.0.0.1:4402/';
const PAGES = [
  ['tarot', 'tarot.html', '#tarotGrid', 10],
  ['kristalle', 'kristalle.html', '#crystalGrid', 10],
  ['mondphasen', 'mondphasen.html', '#moonCalendar', 5],
  ['runen', 'runen.html', '#runeGrid', 10],
  ['frequenzen', 'frequenzen/', '#frequenzlaborRoot', 3],
  ['frequenz-labor', 'frequenzen/labor.html', '#frequenzlaborRoot', 3],
  ['cymatics', 'frequenzen/cymatics.html', '#frequenzlaborRoot', 3],
  ['meditation', 'frequenzen/meditation.html', '#frequenzlaborRoot', 3],
  ['pendel-labor', 'pendeln/labor.html', '#pendelnRoot', 2],
  ['pendel-studio', 'pendeln/studio.html', '#pendelnRoot', 2],
  ['pendel-experiment', 'pendeln/experiment.html', '#pendelnRoot', 2],
  ['pendel-journal', 'pendeln/journal.html', '#pendelnRoot', 2],
];

async function main() {
  const browser = await chromium.launch();
  const results = [];
  for (const [name, url, selector, minChildren] of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const data = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return {
        title: document.title,
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input, select, textarea').length,
        buttons: document.querySelectorAll('button').length,
        targetChildren: el ? el.children.length : null,
        targetText: el ? el.innerText.length : null,
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      };
    }, selector);
    const ok = data.targetChildren !== null && data.targetChildren >= minChildren;
    results.push({ name, ok, ...data, errors });
    await page.close();
  }
  await browser.close();
  for (const row of results) {
    console.log(
      `${row.ok ? 'OK  ' : 'FAIL'} ${row.name.padEnd(18)} Kinder ${String(row.targetChildren).padStart(4)} Text ${String(
        row.targetText
      ).padStart(6)} input ${String(row.inputs).padStart(3)} button ${String(row.buttons).padStart(3)} h1 ${row.h1.length} Fehler ${row.errors.length}`
    );
    if (row.errors.length) console.log('     ', row.errors.slice(0, 3).join(' | '));
  }
  if (results.some((row) => !row.ok || row.errors.length)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
