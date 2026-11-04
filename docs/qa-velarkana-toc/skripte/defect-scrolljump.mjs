/**
 * Befund D-1: Auf Viewports < 1200 px zieht der Scroll-Spy die Seite zum
 * Verzeichnis zurück, sobald der aktive Eintrag außerhalb des TOC-Scrollbereichs
 * liegt (scrollIntoView des aktiven Links scrollt auch das Fenster).
 *
 * Nachweis: identischer Ablauf mit und ohne gestubbte scrollIntoView-Methode.
 * Ausgabe: evidence/qa-toc-436eeffb/defect-scrolljump.json
 */
import { DIST, launchChromium, startServer, writeJson } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const browser = await launchChromium();

async function run({ width, stub, open }) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: width < 1200 });
  const page = await ctx.newPage();
  if (stub) {
    await page.addInitScript(() => {
      window.__svCalls = [];
      HTMLElement.prototype.scrollIntoView = function (arg) {
        window.__svCalls.push({ tag: this.tagName, cls: this.className, arg: arg ? JSON.stringify(arg) : null });
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
    const target = 29812;
    const before = { y: window.scrollY, x: window.scrollX, docHeight: document.documentElement.scrollHeight };
    window.scrollTo(0, target);
    const immediate = window.scrollY;
    const samples = [];
    for (const ms of [100, 500, 1200]) {
      await new Promise((r) => setTimeout(r, ms));
      samples.push({
        t: ms,
        y: window.scrollY,
        x: window.scrollX,
        active: document.querySelector('.page-toc__link[aria-current]')?.getAttribute('href') || null,
        calls: (window.__svCalls || []).length,
      });
    }
    return {
      before,
      target,
      immediate,
      samples,
      finalY: window.scrollY,
      jump: target - samples.at(-1).y,
      calls: (window.__svCalls || []).slice(0, 3),
      tocBlockTop: document.querySelector('aside.page-toc').getBoundingClientRect().top,
      detailsOpen: document.querySelector('[data-toc-details]').open,
    };
  }, open);
  await ctx.close();
  return out;
}

const runs = {
  '390-panel-open': await run({ width: 390, stub: false, open: true }),
  '390-panel-open-stubbed': await run({ width: 390, stub: true, open: true }),
  '390-panel-closed': await run({ width: 390, stub: false, open: false }),
  '1199-panel-open': await run({ width: 1199, stub: false, open: true }),
  '1440-desktop': await run({ width: 1440, stub: false, open: false }),
};

writeJson('defect-scrolljump.json', { generatedAt: new Date().toISOString(), runs });
for (const [name, r] of Object.entries(runs)) {
  console.log(name, 'target', r.target, 'final', r.finalY, 'jump', r.jump, 'active', r.samples.at(-1).active, 'calls', r.samples.at(-1).calls);
}
await browser.close();
await server.close();
