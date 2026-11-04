/**
 * Screenshot-Vergleich Bestand vs. Astro (t_2d9fbecf).
 *
 * Aufruf:
 *   node scripts/migration/screenshot-parity.cjs <ausgabeverzeichnis>
 *
 * Erwartet zwei laufende Server:
 *   Bestand:   http://localhost:4401/Esoterik-Welt/  (dist/ per statischem Server)
 *   Astro:     http://localhost:4402/                (astro dev)
 * Beide Adressen sind per Umgebungsvariable überschreibbar.
 *
 * Zusätzlich werden Konsolenfehler der Astro-Seite gesammelt und ausgegeben:
 * ein Fehler im gebündelten Header-Skript soll den Vergleich nicht unbemerkt
 * überstehen.
 */
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const OUT_DIR = process.argv[2] || path.join(process.cwd(), 'test-results', 'parity');
const LEGACY_URL = process.env.LEGACY_URL || 'http://localhost:4401/Esoterik-Welt/';
const ASTRO_URL = process.env.ASTRO_URL || 'http://localhost:4402/';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const TARGETS = [
  { name: 'legacy', url: LEGACY_URL },
  { name: 'astro', url: ASTRO_URL },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const problems = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });

    for (const target of TARGETS) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(String(error)));

      await page.goto(target.url, { waitUntil: 'networkidle' });
      // Schriften abwarten, damit der Vergleich nicht auf Fallback-Metriken läuft.
      await page.evaluate(() => document.fonts.ready);
      // Seitenweise durchscrollen: `loading="lazy"`-Bilder unterhalb des
      // Viewports werden sonst im Full-Page-Screenshot nicht gezeichnet und der
      // Vergleich meldete Lücken, die es im Layout nicht gibt.
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let offset = 0; offset < document.body.scrollHeight; offset += step) {
          window.scrollTo(0, offset);
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT_DIR, `${target.name}-${viewport.name}.png`), fullPage: true });

      const metrics = await page.evaluate(() => {
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');
        const navLinks = document.querySelectorAll('.nav-link');
        return {
          title: document.title,
          headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
          footerHeight: footer ? Math.round(footer.getBoundingClientRect().height) : null,
          navLinks: navLinks.length,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });

      console.log(JSON.stringify({ target: target.name, viewport: viewport.name, metrics, errors }, null, 2));
      if (errors.length > 0) problems.push({ target: target.name, viewport: viewport.name, errors });
      await page.close();
    }
    await context.close();
  }

  await browser.close();

  if (problems.length > 0) {
    console.error('Konsolenfehler:', JSON.stringify(problems, null, 2));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
