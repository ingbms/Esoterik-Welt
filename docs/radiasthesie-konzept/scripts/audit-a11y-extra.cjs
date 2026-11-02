// Zusatzprüfungen: Textabstände (1.4.12), Reflow (1.4.10), Zielgrößen (2.5.8),
// Fokus nicht verdeckt (2.4.11). Misst am gerenderten Mockup.
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));

const root = path.resolve(__dirname, '..');
const base = 'file:///' + path.join(root, 'mockup', 'index.html').replace(/\\/g, '/');
const out = {};

async function open(browser, width, view = 'landing') {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}?view=${view}&bare=1&a11y=${width}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

(async () => {
  const browser = await chromium.launch();

  // 1.4.12 Textabstände: 1,5 Zeilenhöhe, 0,12em Buchstaben-, 0,16em Wortabstand,
  // 2em Absatzabstand — danach darf nichts abgeschnitten oder überlaufen.
  for (const width of [1440, 390]) {
    const { context, page } = await open(browser, width);
    await page.addStyleTag({
      content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
                p, li, dd { margin-bottom: 2em !important; }`,
    });
    await page.waitForTimeout(150);
    out[`textspacing_${width}`] = await page.evaluate(() => {
      const clipped = [...document.querySelectorAll('.page:not([hidden]) *')].filter((el) => {
        const s = getComputedStyle(el);
        const hides = ['hidden', 'clip'].includes(s.overflowX) || s.overflow === 'hidden';
        return hides && el.scrollWidth > el.clientWidth + 2;
      }).length;
      return {
        docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        clippedElements: clipped,
      };
    });
    await context.close();
  }

  // 1.4.10 Reflow bei 320 CSS-Pixel (entspricht 400 % Zoom auf 1280 px)
  for (const view of ['landing', 'thema', 'glossar']) {
    const { context, page } = await open(browser, 320, view);
    out[`reflow_320_${view}`] = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll('.page:not([hidden]) *')]
        .filter((el) => el.getBoundingClientRect().width > vw + 1)
        .slice(0, 5)
        .map((el) => el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 40));
      return {
        docOverflowX: document.documentElement.scrollWidth - vw,
        tooWide: wide,
      };
    });
    await context.close();
  }

  // 2.5.8 Zielgröße: alle interaktiven Elemente ≥ 24 × 24 CSS-Pixel
  {
    const { context, page } = await open(browser, 1440);
    out.targets = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.page:not([hidden]) a, .page:not([hidden]) button, .page:not([hidden]) input, .page:not([hidden]) summary, .nav a, .nav button, .footer a')];
      const small = [];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.width < 24 || r.height < 24) {
          small.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
      return { total: els.length, under24: small };
    });
    await context.close();
  }

  // 2.4.11 Fokus nicht verdeckt: Fokus auf Sprungziele im Text, prüfen ob die
  // Kopfzeile das Ziel überdeckt.
  {
    const { context, page } = await open(browser, 1440, 'thema');
    out.focusObscured = await page.evaluate(async () => {
      const header = document.querySelector('.header').getBoundingClientRect().height;
      const targets = [...document.querySelectorAll('.astro-main a[href^="#"]')].slice(0, 8);
      const results = [];
      for (const el of targets) {
        el.focus();
        el.scrollIntoView({ block: 'center' });
        await new Promise((r) => setTimeout(r, 60));
        const r = el.getBoundingClientRect();
        results.push({ text: el.textContent.trim().slice(0, 24), top: Math.round(r.top), obscured: r.top < header });
      }
      return { headerHeight: Math.round(header), results };
    });
    await context.close();
  }

  fs.writeFileSync(path.join(root, 'messung', 'a11y-zusatz.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(0);
})();
