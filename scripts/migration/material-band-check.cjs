/** Vergleicht das Materialband im Detail (Sichtbarkeit, Blending, Filter). */
const { chromium } = require('playwright');
const path = require('node:path');

const LEGACY_URL = process.env.LEGACY_URL || 'http://localhost:4401/Esoterik-Welt/';
const ASTRO_URL = process.env.ASTRO_URL || 'http://localhost:4404/';
const OUT_DIR = process.argv[2] || 'C:/Users/mas/AppData/Local/Temp/parity-detail-t_2d9fbecf';

async function probe(browser, label, url) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const figure = page.locator('.material-figure');
  await figure.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await figure.screenshot({ path: path.join(OUT_DIR, `${label}-material.png`) });

  const info = await page.evaluate(() => {
    const image = document.querySelector('.material-figure img');
    const figureElement = document.querySelector('.material-figure');
    const pick = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        cls: element.className,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        filter: style.filter,
        mixBlendMode: style.mixBlendMode,
        isolation: style.isolation,
        background: style.backgroundColor,
        color: style.color,
        contentVisibility: style.contentVisibility,
      };
    };
    return {
      image: image ? pick(image) : null,
      figure: figureElement ? pick(figureElement) : null,
      parent: figureElement?.parentElement ? pick(figureElement.parentElement) : null,
      grandparent: figureElement?.parentElement?.parentElement ? pick(figureElement.parentElement.parentElement) : null,
      loaded: image
        ? { complete: image.complete, naturalWidth: image.naturalWidth, currentSrc: image.currentSrc }
        : null,
    };
  });
  await context.close();
  return info;
}

async function main() {
  const browser = await chromium.launch();
  const legacy = await probe(browser, 'legacy', LEGACY_URL);
  const astro = await probe(browser, 'astro', ASTRO_URL);
  await browser.close();
  console.log('legacy', JSON.stringify(legacy, null, 2));
  console.log('astro ', JSON.stringify(astro, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
