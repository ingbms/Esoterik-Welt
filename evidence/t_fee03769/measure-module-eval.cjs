// Misst die Auswertungszeit (parse + evaluate) eines Datenmoduls im Browser.
// Der HTTP-Cache ist warm, die Datei kommt also ohne Netzlaufzeit an; gemessen
// wird der Zeitraum vom Aufruf von import() bis zum aufgelösten Versprechen.
// Zusätzlich mit 4-facher CPU-Drosselung als Näherung an ein Mobilgerät.
// Aufruf: node evidence/t_fee03769/measure-module-eval.cjs [dist] [port]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || 3314);
const SITE = '/Esoterik-Welt/';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('not found');
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return +sorted[Math.floor(sorted.length / 2)].toFixed(2);
};

(async () => {
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}${SITE}index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#featureGrid > *').length === 6, null, { timeout: 15000 });

  const cdp = await context.newCDPSession(page);
  const targets = ['js/data/farbwelten.js', 'js/data/astrologie.js'];
  const result = {};

  for (const rate of [1, 4]) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    result[`cpu${rate}x`] = {};
    for (const target of targets) {
      const samples = [];
      for (let i = 0; i < 5; i += 1) {
        samples.push(
          await page.evaluate(async (url) => {
            const started = performance.now();
            await import(url + '?probe=' + Math.random().toString(36).slice(2));
            return performance.now() - started;
          }, `${SITE}${target}`)
        );
      }
      result[`cpu${rate}x`][target] = { samplesMs: samples.map((v) => +v.toFixed(1)), medianMs: median(samples) };
    }
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await browser.close();
  server.close();
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
