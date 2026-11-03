const path = require('node:path');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));
const base = 'file:///' + path.join(__dirname, '..', 'mockup', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();

  // Reduzierte Bewegung
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}?view=landing&bare=1&reduce=1`, { waitUntil: 'load' });
  const motion = await page.evaluate(() => {
    const card = document.querySelector('.rad-topic');
    const s = getComputedStyle(card);
    return { transitionDuration: s.transitionDuration, animationDuration: getComputedStyle(document.body).animationDuration };
  });
  console.log('reduzierte Bewegung:', JSON.stringify(motion));
  await context.close();

  // Druck
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto(`${base}?view=thema&bare=1&print=1`, { waitUntil: 'load' });
  await page2.emulateMedia({ media: 'print' });
  const print = await page2.evaluate(() => {
    const toc = document.querySelector('.astro-toc');
    const status = document.querySelector('.rad-status');
    return {
      tocDisplay: getComputedStyle(toc).display,
      statusBorder: getComputedStyle(status).borderTopColor,
      statusVisible: status.getBoundingClientRect().height > 0,
    };
  });
  console.log('Druck:', JSON.stringify(print));
  await ctx2.close();

  await browser.close();
  process.exit(0);
})();
