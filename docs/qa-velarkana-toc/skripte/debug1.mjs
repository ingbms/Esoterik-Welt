/** Gezielte Nachmessung: AX-Baum bei 1440 (offen), CLS sauber, Mobil-Spy. */
import { DIST, launchChromium, startServer } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const browser = await launchChromium();

// --- AX bei 1440 -----------------------------------------------------------
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const cls = [];
await page.addInitScript(() => {
  window.__clsEntries = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__clsEntries.push({ v: e.value, hadInput: e.hadRecentInput, t: Math.round(e.startTime), sources: (e.sources || []).map((s) => s.node ? (s.node.nodeName + '.' + (s.node.className || '')) : '?') });
  }).observe({ type: 'layout-shift', buffered: true });
});
await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.waitForTimeout(3000);
const clsData = await page.evaluate(() => ({
  entries: window.__clsEntries,
  total: window.__clsEntries.filter((e) => !e.hadInput).reduce((a, e) => a + e.v, 0),
  detailsOpen: document.querySelector('[data-toc-details]').open,
  summaryDisplay: getComputedStyle(document.querySelector('.page-toc__summary')).display,
}));
console.log('CLS 1440 fresh:', JSON.stringify(clsData, null, 1).slice(0, 1200));

const client = await ctx.newCDPSession(page);
const { nodes } = await client.send('Accessibility.getFullAXTree');
const navs = nodes.filter((n) => n.role?.value === 'navigation');
const complement = nodes.filter((n) => n.role?.value === 'complementary');
const listNodes = nodes.filter((n) => n.role?.value === 'list');
const current = nodes.filter((n) => (n.properties || []).some((p) => p.name === 'current'));
const summaryNodes = nodes.filter((n) => n.role?.value === 'DisclosureTriangle' || (n.role?.value || '').toLowerCase().includes('disclosure'));
console.log('AX navs:', JSON.stringify(navs.map((n) => n.name?.value)));
console.log('AX complementary:', JSON.stringify(complement.map((n) => ({ name: n.name?.value, desc: n.description?.value }))));
console.log('AX lists:', listNodes.length, 'listitems:', nodes.filter((n) => n.role?.value === 'listitem').length);
console.log('AX link count total:', nodes.filter((n) => n.role?.value === 'link').length);
console.log('AX current:', JSON.stringify(current.map((n) => ({ name: n.name?.value, props: (n.properties || []).filter((p) => ['current', 'selected'].includes(p.name)).map((p) => [p.name, p.value?.value]) }))));
console.log('AX disclosure:', JSON.stringify(summaryNodes.map((n) => ({ role: n.role?.value, name: n.name?.value, props: (n.properties || []).map((p) => [p.name, p.value?.value]) }))).slice(0, 800));
await client.detach();

// --- Mobil-Spy -------------------------------------------------------------
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const mp = await mctx.newPage();
await mp.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await mp.evaluate(() => document.fonts.ready);
await mp.waitForTimeout(500);
const spy = await mp.evaluate(async () => {
  const details = document.querySelector('[data-toc-details]');
  details.open = true;
  await new Promise((r) => setTimeout(r, 200));
  const links = [...document.querySelectorAll('.page-toc__link')];
  const link = links[15];
  const id = decodeURIComponent(link.getAttribute('href').slice(1));
  const el = document.getElementById(id);
  const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
  const beforeY = window.scrollY;
  const targetTopDoc = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: targetTopDoc - header - 24, behavior: 'instant' });
  await new Promise((r) => setTimeout(r, 600));
  return {
    id,
    beforeY,
    targetTopDoc: Math.round(targetTopDoc),
    afterY: window.scrollY,
    docHeight: document.documentElement.scrollHeight,
    elTop: Math.round(el.getBoundingClientRect().top),
    header,
    active: [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href')),
    open: details.open,
  };
});
console.log('mobile spy:', JSON.stringify(spy, null, 1));

// 200 % Zoom / 320 px Nachmessung: Clip und Überlauf
for (const width of [390, 320, 160]) {
  await mp.setViewportSize({ width, height: 800 });
  await mp.waitForTimeout(300);
  const r = await mp.evaluate(() => {
    const aside = document.querySelector('aside.page-toc');
    const a = aside.getBoundingClientRect();
    return { width: innerWidth, asideLeft: Math.round(a.left), asideRight: Math.round(a.right), docScrollWidth: document.documentElement.scrollWidth, bodyScroll: document.body.scrollWidth };
  });
  console.log('viewport', JSON.stringify(r));
}

await browser.close();
await server.close();
