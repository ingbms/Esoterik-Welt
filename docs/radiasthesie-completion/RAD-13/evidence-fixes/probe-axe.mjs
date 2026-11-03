// axe-core-Prüfung der 12 RAD-13-Ansichten (Nachbau qa-rad13/rad13-a11y.mjs)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { writeFileSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ROOT = 'C:/Users/mas/Arbeit/esow-rad-t_878c59c7';
const SITE = join(ROOT, 'dist', 'Esoterik-Welt');
const AXE = readFileSync('C:/Users/mas/Arbeit/esow-qa-rad13/node_modules/axe-core/axe.min.js', 'utf8');
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
  ['module-landing', '/#pendeln'], ['topic-pendeln', '/#pendeln/pendeln'], ['quellen', '/#pendeln/quellen'],
  ['glossar', '/#pendeln/glossar'], ['methodik', '/#pendeln/methodik'], ['labor', '/#pendeln/labor'],
  ['studio', '/#pendeln/studio'], ['experiment', '/#pendeln/experiment'], ['journal', '/#pendeln/journal'],
  ['doc-index', '/radiasthesie/'], ['doc-pendeln', '/radiasthesie/pendeln.html'], ['doc-quellen', '/radiasthesie/quellen.html'],
  // zusätzlich die weiteren statischen Dokumente, damit keine Lücke bleibt
  ['doc-radiasthesie', '/radiasthesie/radiasthesie.html'], ['doc-orakel', '/radiasthesie/orakel.html'],
  ['doc-glossar', '/radiasthesie/glossar.html'], ['doc-methodik', '/radiasthesie/methodik.html'],
];
const widths = (process.env.WIDTHS || '1440,375').split(',').map(Number);
const out = { axeVersion: null, widths, runs: [], violations: [] };
const browser = await chromium.launch({ headless: true });
const p0 = await browser.newPage();
await p0.addScriptTag({ content: AXE });
out.axeVersion = await p0.evaluate(() => window.axe.version);
await p0.close();
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  for (const [name, path] of routes) {
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(600);
    await page.addScriptTag({ content: AXE });
    const res = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
        resultTypes: ['violations', 'incomplete'],
      });
      return {
        violations: r.violations.map((v) => ({
          id: v.id, impact: v.impact, count: v.nodes.length,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 200) })),
        })),
        incomplete: r.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })),
      };
    });
    out.runs.push({ width, route: name, path, violations: res.violations.map((v) => ({ id: v.id, count: v.count })), incomplete: res.incomplete });
    for (const v of res.violations) for (const n of v.nodes) out.violations.push({ width, route: name, id: v.id, impact: v.impact, target: n.target, summary: n.summary });
    if (res.violations.length) console.log(width, name, JSON.stringify(res.violations.map((v) => `${v.id}:${v.count}`)));
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await new Promise((r) => server.close(r));
const tag = process.env.TAG || 'out';
writeFileSync(`${ROOT}/probe-t_b1641fc1/axe-${tag}.json`, JSON.stringify(out, null, 1));
console.log('axe', out.axeVersion, 'Verstöße (Knoten):', out.violations.length);
const byId = {};
for (const v of out.violations) byId[v.id] = (byId[v.id] || 0) + 1;
console.log('nach Regel:', JSON.stringify(byId));
for (const v of out.violations.filter((x) => x.id === 'link-in-text-block')) console.log(' LITB', v.width, v.route, JSON.stringify(v.target));
