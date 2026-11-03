// Ehrliche Bildprüfung: echte Pixelbreite der geladenen Datei gegen die
// dargestellte CSS-Breite (devicePixelRatio 1) — unabhängig von der
// density-normierten naturalWidth-Angabe des Browsers.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ROOT = 'C:/Users/mas/Arbeit/esow-rad-t_878c59c7';
const SITE = join(ROOT, 'dist', 'Esoterik-Welt');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
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
const BASE = `http://127.0.0.1:${server.address().port}/Esoterik-Welt`;

const routes = [
  ['topic-radiasthesie', '/#pendeln/radiasthesie'], ['topic-pendeln', '/#pendeln/pendeln'], ['topic-orakel', '/#pendeln/orakel'],
  ['doc-radiasthesie', '/radiasthesie/radiasthesie.html'], ['doc-pendeln', '/radiasthesie/pendeln.html'], ['doc-orakel', '/radiasthesie/orakel.html'],
];
const widths = (process.env.WIDTHS || '320,375,414,640,768,900,1024,1440').split(',').map(Number);
const out = { base: BASE, runs: [], upscaled: [] };
const browser = await chromium.launch({ headless: true });
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  for (const [name, path] of routes) {
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(300);
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    const rec = await page.evaluate(async () => {
      const rows = [];
      for (const p of document.querySelectorAll('picture')) {
        const img = p.querySelector('img');
        if (!img || !img.currentSrc) continue;
        const real = await new Promise((resolve) => {
          const probe = new Image();
          probe.onload = () => resolve({ w: probe.naturalWidth, h: probe.naturalHeight });
          probe.onerror = () => resolve({ w: 0, h: 0 });
          probe.src = img.currentSrc;
        });
        rows.push({
          file: img.currentSrc.split('/').slice(-2).join('/'),
          realPx: real.w,
          cssWidth: Math.round(img.getBoundingClientRect().width),
          ratio: real.w ? +(img.getBoundingClientRect().width / real.w).toFixed(3) : null,
          sizes: (p.querySelector('source') || {}).getAttribute?.('sizes') || null,
        });
      }
      return rows;
    });
    out.runs.push({ width, route: name, pictures: rec });
    for (const r of rec) if (r.ratio && r.ratio > 1.02) out.upscaled.push({ width, route: name, ...r });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await new Promise((r) => server.close(r));
const tag = process.env.TAG || 'out';
writeFileSync(`${ROOT}/probe-t_b1641fc1/real-${tag}.json`, JSON.stringify(out, null, 1));
for (const run of out.runs) console.log(run.width, run.route, JSON.stringify(run.pictures.map((p) => `${p.cssWidth}/${p.realPx}=${p.ratio} ${p.file}`)));
console.log('UEBERSKALIERT (>1.02):', out.upscaled.length);
for (const u of out.upscaled) console.log(' ', u.width, u.route, u.file, u.cssWidth, '/', u.realPx, '=', u.ratio);
