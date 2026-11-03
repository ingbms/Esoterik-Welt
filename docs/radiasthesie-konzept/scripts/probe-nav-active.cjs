const path = require('node:path');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));
const base = 'file:///' + path.join(__dirname, '..', 'mockup', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${base}?view=landing&bare=1&probe=active`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.click('.nav-toggle');
  const info = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.nav-link')];
    return links.map((el) => {
      const s = getComputedStyle(el);
      return {
        text: el.textContent.trim(),
        active: el.classList.contains('active'),
        color: s.color,
        borderBottom: s.borderBottomWidth + ' ' + s.borderBottomStyle + ' ' + s.borderBottomColor,
        height: Math.round(el.getBoundingClientRect().height),
        width: Math.round(el.getBoundingClientRect().width),
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
  process.exit(0);
})();
