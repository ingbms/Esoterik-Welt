/**
 * Cross-Browser-Smoke (Firefox, WebKit) auf der Pilotseite: Markup, Layout,
 * Klick, Scroll-Spy, Konsolenfehler — bewusst nur Smoke, keine Vollabnahme.
 * Ausgabe: evidence/qa-toc-436eeffb/crossbrowser.json
 */
import { DIST, EVID, launchChromium, startServer, writeJson } from './lib.mjs';
import { firefox, webkit } from 'playwright';

const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const results = [];

for (const [name, engine] of [['firefox', firefox], ['webkit', webkit]]) {
  let browser;
  try {
    browser = await engine.launch({ headless: true });
  } catch (error) {
    results.push({ engine: name, ok: false, error: `Start fehlgeschlagen: ${error.message.slice(0, 200)}` });
    continue;
  }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const desktop = await page.evaluate(async () => {
    const aside = document.querySelector('aside.page-toc');
    const links = [...document.querySelectorAll('.page-toc__link')];
    const prose = document.querySelector('.page-body--toc > .prose');
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 1500);
    await new Promise((r) => setTimeout(r, 400));
    const stickyTop = Math.round(aside.getBoundingClientRect().top);
    const current = [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href'));
    const link = links[9];
    link.click();
    await new Promise((r) => setTimeout(r, 700));
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const el = document.getElementById(id);
    const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
    return {
      tocLinks: links.length,
      asideWidth: Math.round(aside.getBoundingClientRect().width),
      proseWidth: Math.round(prose.getBoundingClientRect().width),
      stickyTop,
      position: getComputedStyle(aside).position,
      current,
      activeAfterScroll: current.length,
      clickTop: Math.round(el.getBoundingClientRect().top),
      clickWindowOk: el.getBoundingClientRect().top >= header - 2 && el.getBoundingClientRect().top <= header + 60,
      hash: decodeURIComponent(location.hash.slice(1)),
      header,
    };
  });
  await page.screenshot({ path: `${EVID}/${name}-1440.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  const mobile = await page.evaluate(async () => {
    const aside = document.querySelector('aside.page-toc');
    const prose = document.querySelector('.page-body--toc > .prose');
    const details = document.querySelector('[data-toc-details]');
    const summary = document.querySelector('.page-toc__summary');
    const closed = details.open;
    summary.click();
    await new Promise((r) => setTimeout(r, 300));
    return {
      closedInitially: closed === false,
      opened: details.open,
      asideBottom: Math.round(aside.getBoundingClientRect().bottom),
      proseTop: Math.round(prose.getBoundingClientRect().top),
      overlapsArticle: aside.getBoundingClientRect().bottom > prose.getBoundingClientRect().top + 1,
      summaryHeight: Math.round(summary.getBoundingClientRect().height),
      tocLinks: document.querySelectorAll('.page-toc__link').length,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  await page.screenshot({ path: `${EVID}/${name}-390.png` });
  await ctx.close();
  await browser.close();
  results.push({ engine: name, ok: true, version: browser.version?.() ?? null, desktop, mobile, errors });
}

writeJson('crossbrowser.json', { generatedAt: new Date().toISOString(), results });
for (const r of results) console.log(JSON.stringify(r).slice(0, 500));
await server.close();
