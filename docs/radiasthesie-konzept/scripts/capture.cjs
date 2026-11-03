// Messung und Screenshots des Radiästhesie-Mockups.
// Je Auflösung wird die Seite NEU geladen (Cache-Buster), damit
// media-query-abhängige Custom Properties frisch aufgelöst werden.
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));

const root = path.resolve(__dirname, '..');
const base = 'file:///' + path.join(root, 'mockup', 'index.html').replace(/\\/g, '/');
const shots = path.join(root, 'messung', 'mockup');
fs.mkdirSync(shots, { recursive: true });

const views = ['landing', 'thema', 'glossar'];
const widths = [1440, 1280, 1024, 900, 768, 390, 360];
const shotWidths = [1440, 1024, 900, 768, 390];
const runViews = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : views;
const runWidths = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',').map(Number) : widths;
const outFile = path.join(root, 'messung', 'mockup-messung.json');

function linesOf(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    const tops = [...new Set(rects.map((r) => Math.round(r.top)))];
    const chars = el.textContent.replace(/\s+/g, ' ').trim().length;
    return { lines: tops.length, chars, charsPerLine: tops.length ? Math.round(chars / tops.length) : null };
  }, selector);
}

(async () => {
  const browser = await chromium.launch();
  let previous = { results: [], keyboard: [] };
  try {
    previous = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  } catch {
    previous = { results: [], keyboard: [] };
  }
  const results = (previous.results || []).filter(
    (r) => !(runViews.includes(r.view) && runWidths.includes(r.width))
  );
  for (const view of runViews) {
    for (const width of runWidths) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const consoleErrors = [];
      const externalRequests = [];
      page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
      page.on('request', (req) => {
        const url = req.url();
        if (!url.startsWith('file://') && !url.startsWith('data:')) externalRequests.push(url);
      });
      await page.goto(`${base}?view=${view}&bare=1&w=${width}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);

      const data = await page.evaluate(() => {
        const px = (el, prop) => (el ? getComputedStyle(el)[prop] : null);
        const r = (el) => {
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return { x: Math.round(b.x), y: Math.round(b.y + window.scrollY), w: Math.round(b.width), h: Math.round(b.height) };
        };
        const section = [...document.querySelectorAll('.page')].find((s) => !s.hidden);
        const container = section ? section.querySelector('.container') : document.querySelector('.container');
        const h1 = section ? section.querySelector('h1') : null;
        const topics = [...document.querySelectorAll('.page:not([hidden]) .rad-topic')];
        const status = section ? section.querySelector('.rad-status') : null;
        const toc = section ? section.querySelector('.astro-aside') : null;
        const plate = section ? section.querySelector('.rad-plate svg, .rad-plate img') : null;
        const gridEl = section ? section.querySelector('.rad-topics') : null;
        const headerInner = document.querySelector('.header-inner');
        const navList = document.querySelector('.nav-list');
        const logo = document.querySelector('.logo');
        const fav = document.getElementById('favCounter');
        const gi = getComputedStyle(headerInner);
        const children = [logo, navList, fav].filter((el) => el && getComputedStyle(el).display !== 'none');
        const used = children.reduce((s, el) => s + el.getBoundingClientRect().width, 0);
        const gap = parseFloat(gi.gap) || 0;
        const contentWidth = headerInner.clientWidth - parseFloat(gi.paddingLeft) - parseFloat(gi.paddingRight);
        const navReserve = Math.round((contentWidth - used - gap * (children.length - 1)) * 10) / 10;
        const overflowEls = [...document.querySelectorAll('.page:not([hidden]) *')]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.width > 0 && (b.right > document.documentElement.clientWidth + 1 || b.left < -1);
          })
          .slice(0, 8)
          .map((el) => ({ tag: el.tagName.toLowerCase(), class: el.className && String(el.className).slice(0, 60), right: Math.round(el.getBoundingClientRect().right) }));
        const images = [...document.querySelectorAll('.page:not([hidden]) img')].map((img) => ({
          src: img.getAttribute('src'),
          natural: img.naturalWidth + 'x' + img.naturalHeight,
          rendered: r(img),
          alt: img.getAttribute('alt'),
        }));
        return {
          viewport: { w: innerWidth, h: innerHeight },
          container: { ...r(container), paddingLeft: px(container, 'paddingLeft'), paddingRight: px(container, 'paddingRight') },
          h1: { ...r(h1), fontSize: px(h1, 'fontSize'), lineHeight: px(h1, 'lineHeight'), text: h1 ? h1.textContent.trim() : null },
          status: { ...r(status) },
          topics: topics.map((el) => r(el)),
          gridColumns: gridEl ? getComputedStyle(gridEl).gridTemplateColumns : null,
          plate: r(plate),
          toc: { ...r(toc), position: px(toc, 'position') },
          header: { navReserve, gap: gi.gap, navGap: getComputedStyle(navList).gap, height: Math.round(document.querySelector('.header').getBoundingClientRect().height) },
          doc: {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            scrollHeight: document.documentElement.scrollHeight,
            overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          },
          overflowEls,
          images,
          focusable: [...document.querySelectorAll('.page:not([hidden]) a[href], .page:not([hidden]) button, .page:not([hidden]) input, .page:not([hidden]) summary')].length,
        };
      });

      data.text = {
        lead: await linesOf(page, '.page:not([hidden]) .rad-hero-lead, .page:not([hidden]) .astro-lead'),
        prose: await linesOf(page, '.page:not([hidden]) .astro-text'),
      };

      if (shotWidths.includes(width)) {
        const file = path.join(shots, `${view}-${width}.png`);
        await page.screenshot({ path: file, fullPage: true });
        data.screenshot = path.relative(root, file).replace(/\\/g, '/');
      }

      results.push({ view, width, ...data, consoleErrors, externalRequests });
      fs.writeFileSync(outFile, JSON.stringify({ erzeugt: new Date().toISOString(), results, keyboard: previous.keyboard || [] }, null, 2));
      await context.close();
    }
  }

  // Tastaturprüfung auf der Landingpage (Desktop und Mobil)
  const keyboard = [];
  if (process.argv[4] === 'keyboard') {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}?view=landing&bare=1&w=${width}&kb=1`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const order = [];
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const s = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || el.getAttribute('aria-label') || el.id || '').trim().slice(0, 40),
          outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor,
          offset: s.outlineOffset,
          visible: el.getBoundingClientRect().width > 0,
        };
      });
      order.push(info);
    }
    keyboard.push({ width, order });
    await context.close();
  }
  }

  const keyboardOut = keyboard.length ? keyboard : previous.keyboard || [];
  fs.writeFileSync(outFile, JSON.stringify({ erzeugt: new Date().toISOString(), results, keyboard: keyboardOut }, null, 2));

  console.table(
    results.map((r) => ({
      view: r.view,
      width: r.width,
      h1: r.h1.fontSize,
      container: r.container.w,
      pad: r.container.paddingLeft,
      grid: (r.gridColumns || '').split(' ').length + ' Sp.',
      cards: r.topics.map((t) => t.w).join('/'),
      navReserve: r.header.navReserve,
      overflowX: r.doc.overflowX,
      overflows: r.overflowEls.length,
      errors: r.consoleErrors.length,
      external: r.externalRequests.length,
      charsLine: r.text.prose ? r.text.prose.charsPerLine : null,
    }))
  );
  console.log('Screenshots:', shots);
  await browser.close();
  process.exit(0);
})();
