/** Vergleicht Höhen/Abstände der Startseiten-Blöcke zwischen Bestand und Astro. */
const { chromium } = require('playwright');

const LEGACY_URL = process.env.LEGACY_URL || 'http://localhost:4401/Esoterik-Welt/';
const ASTRO_URL = process.env.ASTRO_URL || 'http://localhost:4402/';
const SELECTORS = [
  '.hero',
  '.section-lede',
  '#featureGrid',
  '.feature-list',
  '.feature-list > *',
  '.feature-card',
  '.material-grid',
  '.cosmos-grid',
];

async function probe(browser, url, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const data = await page.evaluate((selectors) => {
    const result = {};
    for (const selector of selectors) {
      result[selector] = [...document.querySelectorAll(selector)].map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          top: Math.round(rect.top + window.scrollY),
          height: Math.round(rect.height),
          paddingTop: style.paddingTop,
          paddingBottom: style.paddingBottom,
          marginTop: style.marginTop,
          marginBottom: style.marginBottom,
        };
      });
    }
    return result;
  }, SELECTORS);
  await context.close();
  return data;
}

async function main() {
  const browser = await chromium.launch();
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    console.log(`\n=== ${viewport.width} ===`);
    const legacy = await probe(browser, `${LEGACY_URL}`, viewport);
    const astro = await probe(browser, `${ASTRO_URL}`, viewport);
    for (const selector of SELECTORS) {
      console.log(selector);
      console.log('  legacy', JSON.stringify(legacy[selector]));
      console.log('  astro ', JSON.stringify(astro[selector]));
    }
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
