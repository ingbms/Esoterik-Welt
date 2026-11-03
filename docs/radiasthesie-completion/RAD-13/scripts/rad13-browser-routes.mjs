// ESOW-RAD-13 — Browser-Grundprobe: Routen, 4 Breiten, Konsole, Requests, Bilder, sichtbare H1
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from './server.mjs';

const ROOT = 'C:/Users/mas/Arbeit/esow-qa-rad13';
const OUT = 'C:/Users/mas/AppData/Local/hermes/cache/scratch/rad13-evidence/browser-routes.json';
const srvHttp = await startServer(0);
const PORT = srvHttp.port;
const BASE = `http://127.0.0.1:${PORT}/Esoterik-Welt`;
const srv = { kill: () => srvHttp.close() };
async function waitHealth() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const routes = [
  ['landing', '/'],
  ['module-landing', '/#pendeln'],
  ['topic-radiasthesie', '/#pendeln/radiasthesie'],
  ['topic-pendeln', '/#pendeln/pendeln'],
  ['topic-orakel', '/#pendeln/orakel'],
  ['quellen', '/#pendeln/quellen'],
  ['glossar', '/#pendeln/glossar'],
  ['methodik', '/#pendeln/methodik'],
  ['labor', '/#pendeln/labor'],
  ['studio', '/#pendeln/studio'],
  ['experiment', '/#pendeln/experiment'],
  ['journal', '/#pendeln/journal'],
  ['notfound', '/#pendeln/gibtsnicht'],
  ['doc-index', '/radiasthesie/'],
  ['doc-radiasthesie', '/radiasthesie/radiasthesie.html'],
  ['doc-pendeln', '/radiasthesie/pendeln.html'],
  ['doc-orakel', '/radiasthesie/orakel.html'],
  ['doc-glossar', '/radiasthesie/glossar.html'],
  ['doc-quellen', '/radiasthesie/quellen.html'],
  ['doc-methodik', '/radiasthesie/methodik.html'],
];
const widths = [320, 375, 768, 1440];
const result = { base: BASE, runs: [], findings: [] };

const browser = await chromium.launch({ headless: true });
if (!(await waitHealth())) {
  console.log('SERVER NICHT ERREICHBAR');
  srv.kill();
  process.exit(1);
}

for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  for (const [name, path] of routes) {
    const page = await ctx.newPage();
    const consoleErrors = [];
    const consoleWarnings = [];
    const pageErrors = [];
    const badResponses = [];
    const failedRequests = [];
    const external = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
      if (m.type() === 'warning') consoleWarnings.push(m.text().slice(0, 200));
    });
    page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));
    page.on('response', (r) => {
      if (r.status() >= 400) badResponses.push({ status: r.status(), url: r.url().replace(BASE, '') });
    });
    page.on('requestfailed', (r) => failedRequests.push({ url: r.url().replace(BASE, ''), err: r.failure()?.errorText }));
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith(`http://127.0.0.1:${PORT}`) && !u.startsWith('data:') && !u.startsWith('blob:'))
        external.push(u.slice(0, 160));
    });
    let info = {};
    try {
      await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(700);
      info = await page.evaluate(() => {
        const de = document.documentElement;
        const visibleH1 = [...document.querySelectorAll('h1')].filter((h) => {
          const st = getComputedStyle(h);
          const r = h.getBoundingClientRect();
          return st.display !== 'none' && st.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        });
        const imgs = [...document.images];
        const withSrc = imgs.filter((i) => (i.getAttribute('src') || '').trim() !== '');
        const broken = withSrc
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => i.currentSrc || i.src);
        const small = withSrc
          .filter((i) => !/\.svg(\?|$)/i.test(i.currentSrc || i.src))
          .filter((i) => i.naturalWidth > 0 && i.getBoundingClientRect().width > 0)
          .map((i) => ({
            src: (i.currentSrc || i.src).split('/').pop(),
            nw: i.naturalWidth,
            dw: Math.round(i.getBoundingClientRect().width),
            dpr: Math.round(i.getBoundingClientRect().width * window.devicePixelRatio),
            hasSrcset: !!i.getAttribute('srcset'),
          }))
          .filter((i) => i.nw + 8 < i.dpr && !i.hasSrcset);
        const pics = [...document.querySelectorAll('picture')].map((p) => {
          const img = p.querySelector('img');
          const src = p.querySelector('source[type="image/avif"]') || p.querySelector('source');
          return {
            sizes: src?.getAttribute('sizes') || null,
            chosen: (img?.currentSrc || '').split('/').slice(-2).join('/'),
            dw: img ? Math.round(img.getBoundingClientRect().width) : 0,
            nw: img ? img.naturalWidth : 0,
          };
        });
        return {
          pictures: pics,
          title: document.title,
          h1: visibleH1.map((h) => h.textContent.trim().slice(0, 70)),
          overflow: de.scrollWidth - de.clientWidth,
          scrollWidth: de.scrollWidth,
          clientWidth: de.clientWidth,
          imgs: imgs.length,
          imgsWithSrc: withSrc.length,
          brokenImages: broken,
          undersized: small,
          lang: de.lang,
          canonical: document.querySelector('link[rel=canonical]')?.href || null,
          jsonldStatic: document.querySelectorAll('script[type="application/ld+json"]').length,
          mainLandmarks: document.querySelectorAll('main').length,
          skipLink: !!document.querySelector('.skip-link'),
          bodyTextLen: (document.querySelector('main')?.innerText || '').length,
        };
      });
    } catch (e) {
      info = { error: String(e).slice(0, 200) };
    }
    const rec = {
      width,
      route: name,
      path,
      ...info,
      consoleErrors,
      consoleWarnings: consoleWarnings.slice(0, 3),
      pageErrors,
      badResponses,
      failedRequests,
      external,
    };
    result.runs.push(rec);
    if (rec.overflow > 0) result.findings.push({ severity: 'fail', id: 'OVERFLOW', width, route: name, detail: `${rec.overflow}px` });
    if (consoleErrors.length) result.findings.push({ severity: 'fail', id: 'CONSOLE', width, route: name, detail: consoleErrors.slice(0, 2) });
    if (pageErrors.length) result.findings.push({ severity: 'fail', id: 'PAGEERROR', width, route: name, detail: pageErrors.slice(0, 2) });
    if (badResponses.length) result.findings.push({ severity: 'fail', id: 'HTTP>=400', width, route: name, detail: badResponses.slice(0, 4) });
    if (failedRequests.length) result.findings.push({ severity: 'fail', id: 'REQFAILED', width, route: name, detail: failedRequests.slice(0, 4) });
    if (external.length) result.findings.push({ severity: 'fail', id: 'EXTERNAL', width, route: name, detail: external.slice(0, 4) });
    if (rec.brokenImages?.length) result.findings.push({ severity: 'fail', id: 'IMG-BROKEN', width, route: name, detail: rec.brokenImages });
    if (rec.h1 && rec.h1.length !== 1) result.findings.push({ severity: 'fail', id: 'H1-VISIBLE', width, route: name, detail: rec.h1 });
    if (rec.undersized?.length) result.findings.push({ severity: 'warn', id: 'IMG-RES', width, route: name, detail: rec.undersized });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
srv.kill();
writeFileSync(OUT, JSON.stringify(result, null, 1));

const f = (id) => result.findings.filter((x) => x.id === id);
console.log('Laeufe:', result.runs.length);
console.log('Overflow-Faelle:', f('OVERFLOW').length, 'max:', Math.max(0, ...result.runs.map((r) => r.overflow || 0)));
console.log('Konsolenfehler:', f('CONSOLE').length, 'PageErrors:', f('PAGEERROR').length);
console.log('HTTP>=400:', f('HTTP>=400').length, 'ReqFailed:', f('REQFAILED').length, 'Extern:', f('EXTERNAL').length);
console.log('Defekte Bilder:', f('IMG-BROKEN').length, 'Untergroesse:', f('IMG-RES').length);
console.log('H1!=1:', f('H1-VISIBLE').length);
for (const x of result.findings.slice(0, 25)) console.log(' ', x.severity, x.id, x.width, x.route, JSON.stringify(x.detail).slice(0, 240));
const uniq = [...new Set(result.runs.map((r) => r.title).filter(Boolean))];
console.log('Titel (unique, n=' + uniq.length + '):');
for (const t of uniq) console.log('   -', t.length, t);
