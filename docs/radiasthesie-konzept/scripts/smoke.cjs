const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch();
  const out = path.join(root, 'messung', 'zustaende');
  fs.mkdirSync(out, { recursive: true });

  // Mockup mit Bedienleiste
  const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p1 = await c1.newPage();
  const errors = [];
  p1.on('pageerror', (e) => errors.push(String(e)));
  await p1.goto('file:///' + path.join(root, 'mockup', 'index.html').replace(/\\/g, '/'), { waitUntil: 'load' });
  await p1.evaluate(() => document.fonts.ready);
  await p1.screenshot({ path: path.join(out, 'mockup-mit-leiste-1440.png') });
  // Umschalter testen
  await p1.click('.mockbar a[data-view="thema"]');
  const viewAfter = await p1.evaluate(() => ({
    themaHidden: document.getElementById('thema').hidden,
    landingHidden: document.getElementById('landing').hidden,
    title: document.title,
  }));
  await p1.click('.mockbar a[data-view="glossar"]');
  const viewAfter2 = await p1.evaluate(() => ({
    glossarHidden: document.getElementById('glossar').hidden,
    title: document.title,
  }));
  await c1.close();

  // Wireframes
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await c2.newPage();
  await p2.goto('file:///' + path.join(root, 'wireframes', 'index.html').replace(/\\/g, '/'), { waitUntil: 'load' });
  const wfDefault = await p2.evaluate(() => !document.getElementById('landing').hidden);
  await p2.click('.wf-viewbar a[data-wf="thema"]');
  const wfThema = await p2.evaluate(() => !document.getElementById('thema').hidden);
  await c2.close();

  console.log(JSON.stringify({ errors, viewAfter, viewAfter2, wfDefault, wfThema }, null, 2));
  await browser.close();
  process.exit(0);
})();
