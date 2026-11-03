// Misst, was der Browser beim Erstaufruf tatsächlich über die Leitung zieht:
// gzip-komprimierender Static-Server (wie GitHub Pages) + Playwright/Chromium.
//
// Messpunkte:
//   1. Startseite (index.html): alle Ressourcen mit transferSize/encodedBodySize,
//      darunter js/data/farbwelten.js — obwohl die Startseite keine Farbwelt rendert.
//   2. Kaltstart direkt auf #farbwelten/rot (eigener Context, leerer Cache).
//   3. Navigation Startseite -> #farbwelten/rot (warmer Modul-/HTTP-Cache).
//
// Aufruf: node evidence/t_fee03769/measure-browser.cjs [dist-verzeichnis] [port]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('playwright');

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || 3311);
// Die gebauten Seiten referenzieren /Esoterik-Welt/... absolut (GitHub-Pages-Basispfad),
// darum wird dist/ als Wurzel bedient.
const SITE = '/Esoterik-Welt/';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript)|image\/svg)/;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (url.pathname === '/' || url.pathname === '') file = path.join(root, 'index.html');
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  let body = fs.readFileSync(file);
  const headers = { 'content-type': type, 'cache-control': 'no-cache' };
  if (COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    body = zlib.gzipSync(body, { level: 9 });
    headers['content-encoding'] = 'gzip';
  }
  headers['content-length'] = body.length;
  res.writeHead(200, headers);
  res.end(body);
});

const collect = () =>
  performance
    .getEntriesByType('resource')
    .filter((e) => e.name.startsWith('http'))
    .map((e) => ({
      name: e.name.replace(/^https?:\/\/[^/]+\//, '').replace(/^Esoterik-Welt\//, ''),
      type: e.initiatorType,
      encoded: e.encodedBodySize,
      transfer: e.transferSize,
      decoded: e.decodedBodySize,
      durationMs: +e.duration.toFixed(1),
    }));

async function main() {
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${port}${SITE}`;
  const browser = await chromium.launch({ headless: true });
  const out = { base };

  // --- 1. Startseite, kalter Cache -----------------------------------------
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const started = Date.now();
    await page.goto(base + 'index.html', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelectorAll('#featureGrid > *').length === 6, null, {
      timeout: 15000,
    });
    out.home = {
      loadWallMs: Date.now() - started,
      nav: await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoadedMs: +n.domContentLoadedEventEnd.toFixed(1),
          loadEventMs: +n.loadEventEnd.toFixed(1),
          transferSize: n.transferSize,
        };
      }),
      resources: await page.evaluate(collect),
    };
    out.home.scriptSummary = out.home.resources
      .filter((r) => /\.m?js$/.test(r.name))
      .reduce(
        (acc, r) => {
          acc.files += 1;
          acc.encoded += r.encoded;
          acc.transfer += r.transfer;
          return acc;
        },
        { files: 0, encoded: 0, transfer: 0 }
      );
    out.home.farbweltenData = out.home.resources.find((r) => r.name.endsWith('js/data/farbwelten.js')) || null;
    await context.close();
  }

  // --- 2. Kaltstart direkt auf eine Farbseite -------------------------------
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const started = Date.now();
    await page.goto(base + 'index.html#farbwelten/rot', { waitUntil: 'load' });
    await page.locator('#farbweltenRoot h1').waitFor({ state: 'visible', timeout: 15000 });
    const h1VisibleMs = Date.now() - started;
    const title = (await page.locator('#farbweltenRoot h1').textContent()).trim();
    const resources = await page.evaluate(collect);
    out.coldColourPage = {
      h1VisibleMs,
      title,
      transferTotal: resources.reduce((sum, r) => sum + r.transfer, 0),
      requests: resources.length,
      farbweltenData: resources.find((r) => r.name.endsWith('js/data/farbwelten.js')) || null,
    };
    await context.close();
  }

  // --- 3. Startseite -> Farbseite (warmer Cache) ----------------------------
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + 'index.html', { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('#featureGrid > *').length === 6, null, {
      timeout: 15000,
    });
    const clicked = Date.now();
    await page.evaluate(() => {
      location.hash = '#farbwelten/rot';
    });
    await page.locator('#farbweltenRoot h1').waitFor({ state: 'visible', timeout: 15000 });
    out.warmColourNavigationMs = Date.now() - clicked;
    await context.close();
  }

  await browser.close();
  server.close();
  console.log(JSON.stringify(out, null, 2));
}

main().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
