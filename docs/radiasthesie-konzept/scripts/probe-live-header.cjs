const path = require('node:path');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));
const target = 'file:///' + path.join(__dirname, '..', '..', '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  for (const width of [320, 360, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await context.newPage();
    await page.goto(target + '?w=' + width, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const info = await page.evaluate(() => {
      const inner = document.querySelector('.header-inner');
      const nav = document.querySelector('.nav');
      return {
        headerInner: { client: inner.clientWidth, scroll: inner.scrollWidth },
        nav: nav ? { client: nav.clientWidth, scroll: nav.scrollWidth } : null,
        doc: { client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth },
        fav: document.getElementById('favCounter') ? 'vorhanden' : 'nicht vorhanden',
      };
    });
    console.log(width, JSON.stringify(info));
    await context.close();
  }
  await browser.close();
  process.exit(0);
})();
