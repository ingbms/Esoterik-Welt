// Export der Wireframes als PNG (Desktop 1440, Mobil 390).
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));

const root = path.resolve(__dirname, '..');
const base = 'file:///' + path.join(root, 'wireframes', 'index.html').replace(/\\/g, '/');
const out = path.join(root, 'messung', 'wireframes');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  for (const view of ['landing', 'thema', 'glossar']) {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      await page.goto(`${base}?view=${view}&bare=1&w=${width}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);
      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      const file = path.join(out, `${view}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(view, width, 'overflowX=' + overflowX, path.relative(root, file).replace(/\\/g, '/'));
      await context.close();
    }
  }
  await browser.close();
  process.exit(0);
})();
