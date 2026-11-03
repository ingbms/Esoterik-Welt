const path = require('node:path');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));
const base = 'file:///' + path.join(__dirname, '..', 'mockup', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  for (const view of ['landing', 'thema', 'glossar']) {
    const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
    const page = await context.newPage();
    await page.goto(`${base}?view=${view}&bare=1&probe=320`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const info = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const all = [...document.querySelectorAll('.page:not([hidden]) *')];
      const edges = all
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter((x) => x.r.width > 0)
        .sort((a, b) => b.r.right - a.r.right)
        .slice(0, 6)
        .map((x) => ({
          tag: x.el.tagName.toLowerCase(),
          cls: String(x.el.className).slice(0, 50),
          left: Math.round(x.r.left),
          right: Math.round(x.r.right),
          width: Math.round(x.r.width),
        }));
      return {
        vw,
        docScroll: document.documentElement.scrollWidth,
        bodyScroll: document.body.scrollWidth,
        edges,
      };
    });
    console.log('\n#', view, JSON.stringify(info, null, 2));
    await context.close();
  }
  await browser.close();
  process.exit(0);
})();
