/** Direkter Sprung auf ~29.800 px: Verhalten über die Zeit. */
import { DIST, launchChromium, startServer } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const browser = await launchChromium();

for (const stub of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  if (stub) {
    await page.addInitScript(() => {
      HTMLElement.prototype.scrollIntoView = function () {
        window.__calls = (window.__calls || 0) + 1;
      };
    });
  }
  await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const out = await page.evaluate(async () => {
    document.querySelector('[data-toc-details]').open = true;
    await new Promise((r) => setTimeout(r, 200));
    document.documentElement.style.scrollBehavior = 'auto';
    const target = 29812;
    const heights = {
      doc: document.documentElement.scrollHeight,
      body: document.body.scrollHeight,
      maxScroll: document.documentElement.scrollHeight - innerHeight,
      innerHeight,
    };
    const samples = [];
    window.scrollTo(0, target);
    samples.push({ t: 0, y: window.scrollY });
    for (const ms of [50, 150, 400, 900, 1500]) {
      await new Promise((r) => setTimeout(r, ms - (samples.at(-1)?.t || 0)));
      samples.push({ t: ms, y: window.scrollY, calls: window.__calls || 0, active: document.querySelector('.page-toc__link[aria-current]')?.getAttribute('href') || null });
    }
    return { heights, samples, finalY: window.scrollY, doc: document.documentElement.scrollHeight };
  });
  console.log(stub ? 'STUB' : 'NORMAL', JSON.stringify(out));
  await ctx.close();
}
await browser.close();
await server.close();
