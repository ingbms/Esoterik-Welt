const path = require('node:path');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));
const base = 'file:///' + path.join(__dirname, '..', 'mockup', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${base}?view=landing&bare=1&probe=content`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const info = await page.evaluate(() => {
    const rows = [];
    const walk = (el) => {
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
        rows.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className).slice(0, 46),
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
        });
      }
      for (const child of el.children) walk(child);
    };
    walk(document.body);
    return rows.slice(0, 20);
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
  process.exit(0);
})();
