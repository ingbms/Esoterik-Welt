/**
 * Mobil (390 px): CLS beim Laden (JS schließt das serverseitig offene Panel)
 * und Landeposition bei Deep-Links mit/ohne Prozentkodierung.
 */
import { DIST, launchChromium, startServer, writeJson } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const browser = await launchChromium();

const rows = [];
for (let run = 0; run < 3; run += 1) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__e = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__e.push({
          v: Number(e.value.toFixed(4)),
          hadInput: e.hadRecentInput,
          t: Math.round(e.startTime),
          sources: (e.sources || []).map((s) => (s.node ? `${s.node.nodeName}.${(typeof s.node.className === 'string' ? s.node.className : '').split(' ')[0]}` : '?')),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => ({
    cls: Number(window.__e.filter((e) => !e.hadInput).reduce((a, e) => a + e.v, 0).toFixed(4)),
    entries: window.__e,
    detailsOpen: document.querySelector('[data-toc-details]').open,
    proseTop: Math.round(document.querySelector('.page-body--toc > .prose').getBoundingClientRect().top),
  }));
  rows.push(data);
  await ctx.close();
}
console.log('MOBIL CLS:', JSON.stringify(rows.map((r) => r.cls)), 'details', rows.map((r) => r.detailsOpen), 'sources', JSON.stringify(rows[0].entries));

/* Deep-Link-Landeposition mobil ------------------------------------------ */
const deep = [];
for (const hash of ['#10-reproduktion-und-pr%C3%BCfung', '#10-reproduktion-und-prüfung', '#12-quellenverzeichnis']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${server.base}${PILOT}${hash}`, { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  const res = await page.evaluate(() => {
    const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
    const id = decodeURIComponent(location.hash.slice(1));
    const el = document.getElementById(id);
    const active = [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href'));
    return {
      hash: location.hash,
      id,
      top: el ? Math.round(el.getBoundingClientRect().top) : null,
      header,
      inWindow: el ? el.getBoundingClientRect().top >= header - 2 && el.getBoundingClientRect().top <= header + 60 : false,
      active,
      detailsOpen: document.querySelector('[data-toc-details]').open,
      scrollY: Math.round(window.scrollY),
    };
  });
  deep.push(res);
  await ctx.close();
}
console.log('DEEP:', JSON.stringify(deep, null, 1));

writeJson('mobile-cls-deeplink.json', { generatedAt: new Date().toISOString(), clsRuns: rows, deep });
await browser.close();
await server.close();
