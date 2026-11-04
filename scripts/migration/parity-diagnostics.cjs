/**
 * Diagnose zum Screenshot-Vergleich: prüft Bilder, Schriftmetriken und
 * Rasterbreiten beider Stände und gibt sie als JSON aus.
 *
 * Aufruf: node scripts/migration/parity-diagnostics.cjs
 */
const { chromium } = require('playwright');

const LEGACY_URL = process.env.LEGACY_URL || 'http://localhost:4401/Esoterik-Welt/';
const ASTRO_URL = process.env.ASTRO_URL || 'http://localhost:4402/';

async function probe(browser, label, url, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Alle Bilder nachladen lassen, damit der Zustand nicht vom Lazy-Loading abhängt.
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(800);

  const data = await page.evaluate(() => {
    const pick = (selector) => document.querySelector(selector);
    const metrics = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        color: style.color,
        background: style.backgroundColor,
        textDecoration: style.textDecorationLine,
      };
    };
    return {
      images: [...document.images].map((image) => ({
        src: image.getAttribute('src'),
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        rendered: Math.round(image.getBoundingClientRect().width),
      })),
      h1: metrics(pick('h1')),
      heroIntro: metrics(pick('.hero-intro')),
      sectionHead: metrics(pick('.section-head h2')),
      sectionLedger: metrics(pick('.section-head .label')),
      featureTitle: metrics(pick('.feature-title')),
      featureRow: metrics(pick('.feature-card, #featureGrid > *')),
      footer: metrics(pick('.footer')),
      navLink: metrics(pick('.nav-link')),
      card: metrics(pick('.card')),
      blocks: [...document.body.children]
        .concat([...document.querySelectorAll('main > section')])
        .filter((element) => !['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK'].includes(element.tagName))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            cls: element.className || null,
            top: Math.round(rect.top + window.scrollY),
            height: Math.round(rect.height),
          };
        }),
      docHeight: document.documentElement.scrollHeight,
    };
  });

  await context.close();
  return { label, url, viewport, ...data };
}

async function main() {
  const browser = await chromium.launch();
  const output = [];
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    output.push(await probe(browser, 'legacy', LEGACY_URL, viewport));
    output.push(await probe(browser, 'astro', ASTRO_URL, viewport));
  }
  await browser.close();
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
