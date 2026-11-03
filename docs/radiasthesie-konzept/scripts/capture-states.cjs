// Zustandsbelege: Fokus, Hover, geöffnetes Mobilmenü, geöffnetes Quellenpanel.
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));

const root = path.resolve(__dirname, '..');
const base = 'file:///' + path.join(root, 'mockup', 'index.html').replace(/\\/g, '/');
const out = path.join(root, 'messung', 'zustaende');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const report = {};

  // 1) Fokus auf dem aktiven Navigationsziel (Desktop)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}?view=landing&bare=1&state=focus`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // Fokus direkt setzen (gleiche Darstellung wie per Tab, ohne 9 Tastendrücke)
    await page.focus('a.nav-link.active');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return { text: el.textContent.trim(), outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`, offset: s.outlineOffset };
    });
    report.fokus = info;
    await page.locator('.header').screenshot({ path: path.join(out, 'fokus-nav-1440.png') });
    await context.close();
  }

  // 2) Hover auf einer Themenkarte
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}?view=landing&bare=1&state=hover`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator('.rad-topic').first();
    await card.hover();
    await page.waitForTimeout(250);
    const border = await card.evaluate((el) => getComputedStyle(el).borderColor);
    report.hover = { borderColor: border };
    await card.screenshot({ path: path.join(out, 'karte-hover-1440.png') });
    await context.close();
  }

  // 3) Mobilmenü geöffnet
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${base}?view=landing&bare=1&state=menu`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.click('.nav-toggle');
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => {
      const nav = document.querySelector('.nav');
      const toggle = document.querySelector('.nav-toggle');
      return {
        open: nav.classList.contains('open'),
        expanded: toggle.getAttribute('aria-expanded'),
        label: toggle.getAttribute('aria-label'),
        listDisplay: getComputedStyle(document.querySelector('.nav-list')).display,
        listHeight: Math.round(document.querySelector('.nav-list').getBoundingClientRect().height),
      };
    });
    report.menue = state;
    await page.screenshot({ path: path.join(out, 'menue-offen-390.png') });
    await context.close();
  }

  // 4) Quellenpanel geöffnet (Themenseite)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const page = await context.newPage();
    await page.goto(`${base}?view=thema&bare=1&state=sources`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#quellen > summary').click();
    await page.waitForTimeout(200);
    const open = await page.evaluate(() => document.getElementById('quellen').open);
    report.quellen = { open };
    await page.locator('#quellen').screenshot({ path: path.join(out, 'quellen-offen-1440.png') });
    await context.close();
  }

  fs.writeFileSync(path.join(out, 'zustaende.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  process.exit(0);
})();
