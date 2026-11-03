// Messung: reale Layoutbreite der Radiästhesie-Fotos und Auswahl der srcset-Variante
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ROOT = 'C:/Users/mas/Arbeit/esow-rad-t_878c59c7';
const SITE = join(ROOT, 'dist', 'Esoterik-Welt');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    let p = decodeURIComponent(url.pathname);
    if (p === '/api/health') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"status":"ok"}'); }
    if (p === '/' || p === '') p = '/Esoterik-Welt/';
    if (!p.startsWith('/Esoterik-Welt/')) { res.writeHead(404); return res.end(''); }
    let rel = p.slice('/Esoterik-Welt/'.length);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = join(SITE, rel);
    try { await stat(file); } catch { res.writeHead(404); return res.end(''); }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'content-length': body.length });
    res.end(body);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}/Esoterik-Welt`;

const routes = [
  ['topic-radiasthesie', '/#pendeln/radiasthesie'],
  ['topic-pendeln', '/#pendeln/pendeln'],
  ['topic-orakel', '/#pendeln/orakel'],
  ['doc-radiasthesie', '/radiasthesie/radiasthesie.html'],
  ['doc-pendeln', '/radiasthesie/pendeln.html'],
  ['doc-orakel', '/radiasthesie/orakel.html'],
];
const widths = (process.env.WIDTHS || '320,360,375,414,640,768,900,1024,1440').split(',').map(Number);
const dpr = Number(process.env.DPR || 1);
const out = { base: BASE, dpr, widths, runs: [], undersized: [] };

const browser = await chromium.launch({ headless: true });
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: dpr });
  for (const [name, path] of routes) {
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(700);
    const pics = await page.evaluate(() =>
      [...document.querySelectorAll('picture')].map((p) => {
        const img = p.querySelector('img');
        const src = p.querySelector('source[type="image/avif"]') || p.querySelector('source');
        const rect = img ? img.getBoundingClientRect() : { width: 0 };
        return {
          src: (img?.currentSrc || '').split('/').slice(-2).join('/'),
          sizes: src?.getAttribute('sizes') || null,
          dw: Math.round(rect.width),
          nw: img?.naturalWidth || 0,
        };
      })
    );
    // Vue: figure container width for context
    const fig = await page.evaluate(() => [...document.querySelectorAll('figure.rad-plate--photo')].map((f) => Math.round(f.getBoundingClientRect().width)));
    out.runs.push({ width, route: name, pictures: pics, figureWidths: fig });
    for (const p of pics) {
      if (p.nw > 0 && p.nw + 8 < p.dw * dpr) out.undersized.push({ width, route: name, ...p });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await new Promise((r) => server.close(r));
writeFileSync(process.env.OUT || `${ROOT}/probe-t_b1641fc1/measure.json`, JSON.stringify(out, null, 1));
for (const r of out.runs) {
  console.log(r.width, r.route, JSON.stringify(r.pictures.map((p) => `${p.dw}px<-${p.nw}w`)), 'figure', JSON.stringify(r.figureWidths));
}
console.log('UNTERGROESSE:', out.undersized.length, JSON.stringify(out.undersized.slice(0, 6)));
