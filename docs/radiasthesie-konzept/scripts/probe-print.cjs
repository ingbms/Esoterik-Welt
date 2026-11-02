const path = require('node:path');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));
const base = 'file:///' + path.join(__dirname, '..', 'mockup', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}?view=thema&bare=1&printprobe=1`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const info = await page.evaluate(() => {
    const section = document.getElementById('thema');
    const status = section.querySelector('.rad-status');
    const chain = [];
    let el = status;
    while (el && el !== document.documentElement) {
      const s = getComputedStyle(el);
      chain.push({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 30), display: s.display, h: Math.round(el.getBoundingClientRect().height) });
      el = el.parentElement;
    }
    return chain;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
  process.exit(0);
})();
