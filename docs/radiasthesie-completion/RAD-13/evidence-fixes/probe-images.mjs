// Volle Bildmessung (lazy geladen) auf allen Radiästhesie-Routen, Nachbau der Prüffilter
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
  ['landing', '/'], ['module-landing', '/#pendeln'], ['topic-radiasthesie', '/#pendeln/radiasthesie'],
  ['topic-pendeln', '/#pendeln/pendeln'], ['topic-orakel', '/#pendeln/orakel'], ['quellen', '/#pendeln/quellen'],
  ['glossar', '/#pendeln/glossar'], ['methodik', '/#pendeln/methodik'], ['labor', '/#pendeln/labor'],
  ['studio', '/#pendeln/studio'], ['experiment', '/#pendeln/experiment'], ['journal', '/#pendeln/journal'],
  ['notfound', '/#pendeln/gibtsnicht'], ['doc-index', '/radiasthesie/'], ['doc-radiasthesie', '/radiasthesie/radiasthesie.html'],
  ['doc-pendeln', '/radiasthesie/pendeln.html'], ['doc-orakel', '/radiasthesie/orakel.html'],
  ['doc-glossar', '/radiasthesie/glossar.html'], ['doc-quellen', '/radiasthesie/quellen.html'], ['doc-methodik', '/radiasthesie/methodik.html'],
];
const widths = (process.env.WIDTHS || '320,375,768,1440').split(',').map(Number);
const out = { base: BASE, widths, runs: [], findings: [] };
const browser = await chromium.launch({ headless: true });
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  for (const [name, path] of routes) {
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(400);
    // alle lazy-Bilder laden
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
    const rec = await page.evaluate(() => {
      const pics = [...document.querySelectorAll('picture')].map((p) => {
        const img = p.querySelector('img');
        const src = p.querySelector('source[type="image/avif"]') || p.querySelector('source');
        return {
          currentSrc: (img?.currentSrc || '').split('/').slice(-2).join('/'),
          sizes: src?.getAttribute('sizes') || null,
          dw: img ? Math.round(img.getBoundingClientRect().width) : 0,
          nw: img?.naturalWidth || 0,
          hasSrcset: !!img?.getAttribute('srcset') || !!src,
        };
      });
      const imgs = [...document.images].map((i) => ({
        src: (i.currentSrc || i.src).split('/').slice(-2).join('/'),
        dw: Math.round(i.getBoundingClientRect().width),
        nw: i.naturalWidth,
        svg: /\.svg(\?|$)/i.test(i.currentSrc || i.src),
      }));
      return { pics, imgs };
    });
    out.runs.push({ width, route: name, path, ...rec });
    for (const p of rec.pics) {
      if (p.nw > 0 && p.dw > 0 && !/\.svg/.test(p.currentSrc) && p.nw + 8 < p.dw) {
        out.findings.push({ width, route: name, kind: 'picture', ...p });
      }
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await new Promise((r) => server.close(r));
writeFileSync(ROOT + '/probe-t_b1641fc1/images-' + (process.env.TAG || 'out') + '.json', JSON.stringify(out, null, 1));
console.log('Bilder mit Untergroesse:', out.findings.length);
for (const f of out.findings) console.log(' ', f.width, f.route, f.currentSrc, 'nw', f.nw, 'dw', f.dw, 'sizes', f.sizes);
const seen = new Map();
for (const r of out.runs) for (const p of r.pics) if (p.nw > 0) seen.set(p.currentSrc, `${p.nw}w @ sizes ${p.sizes}`);
console.log('--- geladene Fotos (eindeutig):');
for (const [k, v] of seen) console.log(' ', k, v);
