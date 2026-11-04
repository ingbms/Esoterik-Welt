/**
 * Vergleichsmessung für einen Build (Pilot oder Baseline):
 * CLS nach dem Laden, axe-Verstöße der Seite, Überlauf bei 390/320 px,
 * TOC-Vorhandensein, Konsolenfehler.
 *
 * Aufruf: node qa-toc-436eeffb/baseline-probe.mjs <label>
 */
import fs from 'node:fs';
import { DIST, launchChromium, startServer, writeJson } from './lib.mjs';

const label = process.argv[2] || 'pilot';
const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const browser = await launchChromium();

const axeSource = fs.readFileSync(new URL('../../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const out = { label, generatedAt: new Date().toISOString() };

/* Desktop 1440: CLS + axe + TOC */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
await page.addInitScript(() => {
  window.__entries = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__entries.push({ v: Number(e.value.toFixed(4)), hadInput: e.hadRecentInput, t: Math.round(e.startTime), sources: (e.sources || []).map((s) => (s.node ? `${s.node.nodeName}.${s.node.className || ''}` : '?')) });
  }).observe({ type: 'layout-shift', buffered: true });
});
await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.waitForTimeout(3000);
out.desktop = await page.evaluate(() => ({
  cls: Number(window.__entries.filter((e) => !e.hadInput).reduce((a, e) => a + e.v, 0).toFixed(4)),
  clsEntries: window.__entries,
  tocAside: document.querySelectorAll('aside.page-toc').length,
  tocLinks: document.querySelectorAll('.page-toc__link').length,
  docHeight: document.documentElement.scrollHeight,
  proseWidth: document.querySelector('.page-body--toc > .prose')?.getBoundingClientRect().width ?? document.querySelector('article.prose')?.getBoundingClientRect().width ?? null,
}));
await page.addScriptTag({ content: axeSource });
out.axe = await page.evaluate(async () => {
  const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
  return {
    violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) })),
    passes: r.passes.length,
  };
});
await page.screenshot({ path: `evidence/qa-toc-436eeffb/${label}-1440.png` });
out.consoleErrors = errors;
await ctx.close();

/* Mobil 390 / 320: Überlauf */
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const mp = await mctx.newPage();
await mp.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await mp.waitForTimeout(600);
out.mobile = {};
for (const width of [390, 320]) {
  await mp.setViewportSize({ width, height: 844 });
  await mp.waitForTimeout(400);
  out.mobile[width] = await mp.evaluate(() => {
    const widest = [...document.querySelectorAll('body *')]
      .map((el) => ({ tag: el.tagName, cls: typeof el.className === 'string' ? el.className.slice(0, 60) : '', right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width) }))
      .filter((e) => e.right > innerWidth + 1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 5);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      innerWidth,
      tocAside: document.querySelectorAll('aside.page-toc').length,
      widest,
    };
  });
  await mp.screenshot({ path: `evidence/qa-toc-436eeffb/${label}-${width}.png` });
}
await mctx.close();
await browser.close();
await server.close();

writeJson(`baseline-probe-${label}.json`, out);
console.log(JSON.stringify({ label, cls: out.desktop.cls, axe: out.axe.violations.map((v) => v.id), mobile: { 390: out.mobile[390].scrollWidth, 320: out.mobile[320].scrollWidth }, tocLinks: out.desktop.tocLinks, errors: out.consoleErrors.length }, null, 2));
