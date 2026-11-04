/**
 * CLS-Wiederholungsmessung: n Messungen mit frischem Kontext, Summe und
 * Quellen der Verschiebungen. Aufruf: node qa-toc-436eeffb/cls-repeat.mjs <label> [n]
 */
import { DIST, launchChromium, startServer, writeJson } from './lib.mjs';

const label = process.argv[2] || 'pilot';
const runs = Number(process.argv[3] || 5);
const server = await startServer(DIST);
const browser = await launchChromium();
const samples = [];

for (let i = 0; i < runs; i += 1) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__e = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__e.push({
          v: Number(e.value.toFixed(4)),
          hadInput: e.hadRecentInput,
          t: Math.round(e.startTime),
          sources: (e.sources || []).map((s) => ({
            node: s.node ? `${s.node.nodeName}${s.node.className && typeof s.node.className === 'string' ? '.' + s.node.className.split(' ').slice(0, 2).join('.') : ''}` : null,
            prev: s.previousRect ? `${Math.round(s.previousRect.x)},${Math.round(s.previousRect.y)} ${Math.round(s.previousRect.width)}x${Math.round(s.previousRect.height)}` : null,
            cur: s.currentRect ? `${Math.round(s.currentRect.x)},${Math.round(s.currentRect.y)} ${Math.round(s.currentRect.width)}x${Math.round(s.currentRect.height)}` : null,
          })),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(`${server.base}/frequenzen/quellen.html`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const data = await page.evaluate(() => ({
    total: Number(window.__e.filter((e) => !e.hadInput).reduce((a, e) => a + e.v, 0).toFixed(4)),
    entries: window.__e,
  }));
  samples.push(data);
  await ctx.close();
}

const totals = samples.map((s) => s.total).sort((a, b) => a - b);
const median = totals[Math.floor(totals.length / 2)];
const sourceTags = {};
for (const s of samples) for (const e of s.entries) for (const src of e.sources) {
  const key = src.node || 'unbekannt';
  sourceTags[key] = (sourceTags[key] || 0) + 1;
}
writeJson(`cls-${label}.json`, { label, runs, samples, totals, median, sourceTags });
console.log(label, 'totals', JSON.stringify(totals), 'median', median, 'sources', JSON.stringify(sourceTags));
await browser.close();
await server.close();
