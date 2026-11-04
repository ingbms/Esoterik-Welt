/**
 * Retest des QA-Befunds D-1 (Scroll-Sprung bei < 1200 px mit offenem Panel)
 * über alle drei Playwright-Engines.
 *
 * Szenario (QA t_436eeffb): Seite laden, Verzeichnis öffnen, tief scrollen.
 * Erwartung: Die Seitenscrollposition bleibt erhalten (kein Rücksprung zum
 * Verzeichnis), genau ein Eintrag trägt `aria-current="location"`, und zwar
 * der Abschnitt an der Scroll-Linie.
 *
 * Aufruf:
 *   npm run build && node scripts/toc/verify-scrollspy-engines.mjs
 *   node scripts/toc/verify-scrollspy-engines.mjs --dist dist --out evidence/velarkana-toc-fix
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const DIST = resolve(readArg('--dist', 'dist'));
const OUT = resolve(readArg('--out', 'evidence/velarkana-toc-fix'));
const PILOT = '/frequenzen/quellen.html';
const TARGET_ID = '67-432-hz-kleiner-effekt-keine-gesundheitswirkung';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function startServer(root) {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = normalize(join(root, pathname));
    if (!target.startsWith(root)) return response.writeHead(403).end('forbidden');
    const file = await readFile(target).catch(() => null);
    if (!file) return response.writeHead(404).end('not found');
    response.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' });
    response.end(file);
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => done({ server, port: server.address().port }));
  });
}

const runCase = async (page, width, baseUrl) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${baseUrl}${PILOT}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  await page.click('.page-toc__summary');
  await page.waitForTimeout(200);
  const target = await page.evaluate((id) => {
    const heading = document.getElementById(id);
    const header =
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 100;
    return Math.round(heading.getBoundingClientRect().top + window.scrollY - header + 10);
  }, TARGET_ID);
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(600);
  return page.evaluate(
    ({ y, id }) => ({
      target: y,
      y: Math.round(window.scrollY),
      jump: Math.round(window.scrollY) - y,
      current: document.querySelectorAll('.page-toc [aria-current]').length,
      activeHref: document.querySelector('.page-toc [aria-current="location"]')?.getAttribute('href') ?? null,
      expectedHref: `#${id}`,
      detailsOpen: document.querySelector('[data-toc-details]').open,
      docHeight: Math.round(document.documentElement.scrollHeight),
    }),
    { y: target, id: TARGET_ID }
  );
};

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const { server, port } = await startServer(DIST);
  const baseUrl = `http://127.0.0.1:${port}`;
  const engines = { chromium, firefox, webkit };
  const report = { generatedAt: new Date().toISOString(), target: TARGET_ID, engines: {}, shots: [] };
  try {
    for (const [name, launcher] of Object.entries(engines)) {
      const browser = await launcher.launch({ headless: true });
      report.engines[name] = { version: browser.version(), cases: {} };
      try {
        for (const width of [390, 1024, 1199]) {
          const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 700 });
          const page = await context.newPage();
          try {
            const result = await runCase(page, width, baseUrl);
            result.ok =
              Math.abs(result.jump) <= 2 &&
              result.current === 1 &&
              result.activeHref === result.expectedHref &&
              result.detailsOpen === true;
            report.engines[name].cases[width] = result;
            if (name === 'chromium' && width === 390) {
              const shot = join(OUT, '390-offen-tief-aktiv.png');
              await page.screenshot({ path: shot });
              report.shots.push(shot);
            }
          } finally {
            await context.close();
          }
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    server.close();
  }
  const cases = Object.values(report.engines).flatMap((engine) => Object.values(engine.cases));
  report.summary = {
    total: cases.length,
    passed: cases.filter((entry) => entry.ok).length,
    failed: cases.filter((entry) => !entry.ok).length,
  };
  writeFileSync(join(OUT, 'scrollspy-engines.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`${report.summary.passed}/${report.summary.total} Engine-Fälle bestanden`);
  for (const [name, engine] of Object.entries(report.engines)) {
    for (const [width, entry] of Object.entries(engine.cases)) {
      console.log(
        `${entry.ok ? '✔' : '✖'} ${name} ${engine.version} @ ${width}: y=${entry.y} target=${entry.target} jump=${entry.jump} active=${entry.activeHref} current=${entry.current}`
      );
    }
  }
  console.log(`Bericht: ${join(OUT, 'scrollspy-engines.json')}`);
  process.exitCode = report.summary.failed === 0 ? 0 : 1;
};

await main();
