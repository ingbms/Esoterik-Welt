/** Ursache des Mobil-Scrollsprungs prüfen: scrollIntoView des aktiven TOC-Links. */
import { DIST, launchChromium, startServer } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const browser = await launchChromium();

async function probe(open, patchScrollIntoView) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  if (patchScrollIntoView) {
    await page.addInitScript(() => {
      HTMLElement.prototype.scrollIntoView = function () {
        window.__scrollIntoViewCalls = (window.__scrollIntoViewCalls || 0) + 1;
      };
    });
  }
  await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const out = await page.evaluate(async (openPanel) => {
    if (openPanel) {
      document.querySelector('[data-toc-details]').open = true;
      await new Promise((r) => setTimeout(r, 200));
    }
    document.documentElement.style.scrollBehavior = 'auto';
    const body = document.querySelector('[data-toc-body]');
    const before = { y: window.scrollY, bodyClient: body.clientHeight, bodyScroll: body.scrollHeight };
    const steps = [];
    for (const target of [1500, 3000, 6000]) {
      window.scrollTo(0, target);
      await new Promise((r) => setTimeout(r, 700));
      steps.push({ target, y: window.scrollY, active: document.querySelector('.page-toc__link[aria-current]')?.getAttribute('href') || null, calls: window.__scrollIntoViewCalls || 0 });
    }
    return { open: openPanel, before, steps, finalY: window.scrollY, docHeight: document.documentElement.scrollHeight };
  }, open);
  await ctx.close();
  return out;
}

console.log('closed, normal :', JSON.stringify(await probe(false, false)));
console.log('open, normal   :', JSON.stringify(await probe(true, false)));
console.log('open, scrollIntoView gestubbt:', JSON.stringify(await probe(true, true)));
console.log('closed, scrollIntoView gestubbt:', JSON.stringify(await probe(false, true)));

await browser.close();
await server.close();
