// Probe für das umgesetzte Themenmodul gegen die gebaute Seite.
//
// Startet den Projektserver (dist/Esoterik-Welt) auf einem freien Port und
// prüft: HTTP-Status, fehlende Ressourcen, Konsolenfehler, Fokus nach
// Kapitel-Deep-Link und Überläufe an den Breakpoints.
//
// Aufruf: node docs/radiasthesie-konzept/scripts/probe-modul.cjs [--shots]

const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../../..');
process.env.PORT = process.env.PORT || '3121';

const routes = [
  '#pendeln',
  '#pendeln/radiasthesie',
  '#pendeln/pendeln',
  '#pendeln/orakel',
  '#pendeln/glossar',
  '#pendeln/quellen',
  '#pendeln/methodik',
  '#pendeln/suche?q=bovis',
  '#pendeln/gibtsnicht',
];

(async () => {
  const app = require(path.join(root, 'index.js'));
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/Esoterik-Welt/`;
  const shots = process.argv.includes('--shots');
  const shotDir = path.join(root, 'docs/radiasthesie-konzept/messung/modul');
  if (shots) fs.mkdirSync(shotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error}`));
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => problems.push(`failed ${request.url()}`));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('data:')) problems.push(`external ${url}`);
  });

  for (const hash of routes) {
    problems.length = 0;
    await page.goto(base + hash, { waitUntil: 'load' });
    await page.locator('#pendelnRoot h1').first().waitFor({ timeout: 15000 });
    const info = await page.evaluate(() => ({
      h1: document.querySelector('#pendelnRoot h1')?.textContent?.trim(),
      chars: document.querySelector('#pendelnRoot')?.textContent?.length,
      active: document.activeElement?.id || document.activeElement?.tagName,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      desc: document.querySelector('meta[name="description"]')?.getAttribute('content')?.length,
    }));
    console.log(
      `${hash}: ${info.h1} (${info.chars} Zeichen, Fokus ${info.active}, Überlauf ${info.overflow}, Desc ${info.desc})`
    );
    if (problems.length) console.log(`  Befunde: ${[...new Set(problems)].join(' | ')}`);
    if (shots) {
      const name = hash.replace(/[#/?=&]/g, '_');
      await page.screenshot({ path: path.join(shotDir, `${name}-1440.png`), fullPage: false });
    }
  }

  if (shots) {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const hash of ['#pendeln', '#pendeln/radiasthesie', '#pendeln/glossar']) {
      await page.goto(base + hash, { waitUntil: 'load' });
      await page.locator('#pendelnRoot h1').waitFor();
      await page.screenshot({ path: path.join(shotDir, `${hash.replace(/[#/?=&]/g, '_')}-390.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }

  // Startseite plus Navigationsklick: prüft, ob der Wechsel selbst Ressourcen
  // nachlädt, die es nicht gibt.
  problems.length = 0;
  await page.goto(base, { waitUntil: 'load' });
  await page.locator('.nav-link[data-page="pendeln"]').click();
  await page.locator('#pendelnRoot h1').waitFor();
  console.log(`Startseite -> Pendeln: ${problems.length ? [...new Set(problems)].join(' | ') : 'keine Befunde'}`);

  // Fokus nach Kapitel-Deep-Link
  await page.goto(base + '#pendeln/radiasthesie', { waitUntil: 'load' });
  await page.locator('#pendelnRoot h1').waitFor();
  await page.locator('.astro-toc a[href="#pendeln/radiasthesie/instrumente"]').click();
  await page.waitForTimeout(800);
  console.log(
    'Deep-Link:',
    JSON.stringify(
      await page.evaluate(() => ({
        hash: location.hash,
        tag: document.activeElement.tagName,
        id: document.activeElement.id,
        inView: (() => {
          const r = document.getElementById('instrumente').getBoundingClientRect();
          return Math.round(r.top);
        })(),
      }))
    )
  );

  // Überläufe je Breite, je Breite frisch geladen
  const widths = [320, 360, 390, 700, 768, 781, 900, 1024, 1200, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const line = [];
    for (const hash of ['#pendeln', '#pendeln/radiasthesie', '#pendeln/glossar', '#pendeln/quellen']) {
      await page.goto(base + hash, { waitUntil: 'load' });
      await page.locator('#pendelnRoot h1').waitFor();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      line.push(`${hash}=${overflow}`);
    }
    console.log(`${width}px Überlauf: ${line.join(', ')}`);
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});