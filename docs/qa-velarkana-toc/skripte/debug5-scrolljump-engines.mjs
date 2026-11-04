/** Befund D-1 in Firefox und WebKit gegenprüfen. */
import { DIST, launchChromium, startServer } from './lib.mjs';
import { firefox, webkit } from 'playwright';

const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const browser = await launchChromium();
const out = {};

for (const [name, engine] of [['chromium', null], ['firefox', firefox], ['webkit', webkit]]) {
  const b = engine ? await engine.launch({ headless: true }) : browser;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const res = await page.evaluate(async () => {
    document.querySelector('[data-toc-details]').open = true;
    await new Promise((r) => setTimeout(r, 300));
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 29812);
    await new Promise((r) => setTimeout(r, 700));
    return { target: 29812, y: window.scrollY, active: document.querySelector('.page-toc__link[aria-current]')?.getAttribute('href') || null };
  });
  out[name] = res;
  await ctx.close();
  if (engine) await b.close();
}
await browser.close();
await server.close();
console.log(JSON.stringify(out, null, 2));
