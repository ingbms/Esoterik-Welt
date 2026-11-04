/**
 * Messung Bestand ↔ Astro für die im Review genannten Kennzahlen.
 *
 * Erwartet zwei laufende statische Server:
 *   LEGACY_URL (Default http://127.0.0.1:4401/Esoterik-Welt/)
 *   ASTRO_URL  (Default http://127.0.0.1:4402/)
 *
 * Gemessen werden Dokumenthöhe, Header-/Footerhöhe, horizontaler Überlauf,
 * <h1>-Anzahl und die Zahl der Formularelemente. Die Bestandsadressen sind
 * teils Hash-Routen der SPA, die Astro-Adressen echte Dokumente.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const LEGACY = process.env.LEGACY_URL || 'http://127.0.0.1:4401/Esoterik-Welt/';
const ASTRO = process.env.ASTRO_URL || 'http://127.0.0.1:4402/';
const OUT = process.argv[2] || path.join(process.cwd(), 'test-results', 'measure-parity');

const PAIRS = [
  { name: 'start', legacy: '', astro: '' },
  { name: 'tarot', legacy: '#tarot', astro: 'tarot.html' },
  { name: 'kristalle', legacy: '#crystals', astro: 'kristalle.html' },
  { name: 'mondphasen', legacy: '#moon', astro: 'mondphasen.html' },
  { name: 'runen', legacy: '#runes', astro: 'runen.html' },
  { name: 'wissen', legacy: '#blog', astro: 'wissen/' },
  { name: 'farbwelten', legacy: '#farbwelten', astro: 'farbwelten/' },
  { name: 'radiasthesie', legacy: 'radiasthesie/index.html', astro: 'radiasthesie/' },
  { name: 'pendeln-dok', legacy: 'radiasthesie/pendeln.html', astro: 'radiasthesie/pendeln.html' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

async function metrics(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    return {
      documentHeight: document.documentElement.scrollHeight,
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
      footerHeight: footer ? Math.round(footer.getBoundingClientRect().height) : null,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      h1: document.querySelectorAll('h1').length,
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input, select, textarea').length,
      buttons: document.querySelectorAll('button').length,
      footerColumns: document.querySelectorAll('.footer-column').length,
      mainText: document.querySelector('main')?.innerText.length ?? 0,
    };
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const rows = [];
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    for (const pair of PAIRS) {
      const result = { page: pair.name, viewport: viewport.name };
      for (const [side, base, suffix] of [
        ['legacy', LEGACY, pair.legacy],
        ['astro', ASTRO, pair.astro],
      ]) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(String(error)));
        await page.goto(base + suffix, { waitUntil: 'networkidle' });
        if (suffix.startsWith('#')) await page.waitForTimeout(600);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(async () => {
          const step = window.innerHeight;
          for (let offset = 0; offset < document.body.scrollHeight; offset += step) {
            window.scrollTo(0, offset);
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(400);
        result[side] = await metrics(page);
        result[`${side}Errors`] = errors;
        await page.close();
      }
      rows.push(result);
    }
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'measure.json'), JSON.stringify(rows, null, 2));
  for (const row of rows) {
    const l = row.legacy;
    const a = row.astro;
    console.log(
      `${row.page.padEnd(14)} ${row.viewport.padEnd(8)} Höhe ${String(l.documentHeight).padStart(5)}/${String(
        a.documentHeight
      ).padStart(5)}  Header ${String(l.headerHeight).padStart(4)}/${String(a.headerHeight).padStart(
        4
      )}  Footer ${String(l.footerHeight).padStart(5)}/${String(a.footerHeight).padStart(5)}  Breite ${String(
        l.scrollWidth
      ).padStart(4)}/${String(a.scrollWidth).padStart(4)}  h1 ${l.h1}/${a.h1}  Text ${l.mainText}/${a.mainText}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
