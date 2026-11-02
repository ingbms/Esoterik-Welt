const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/mas/Arbeit/Esoterik-Welt/node_modules/playwright');

const BASE = 'http://127.0.0.1:8188/Esoterik-Welt/';
const OUT = 'C:/Users/mas/AppData/Local/hermes/profiles/reviewer/cache/scratch/evidence';
fs.mkdirSync(OUT, { recursive: true });

const data = JSON.parse(fs.readFileSync('C:/Users/mas/Arbeit/Esoterik-Welt/data/crystals.json', 'utf8'));
const crystals = data.crystals || data;
const shortById = Object.fromEntries(crystals.map((c) => [c.id, c.attribution_text_short]));

function lum(rgb) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}
function ratio(c1, c2) {
  const a = lum(c1), b = lum(c2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const parseRGB = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);

(async () => {
  const browser = await chromium.launch();
  const report = { viewports: {}, dialog: {}, loading: {}, a11y: {}, console: [] };

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) consoleMsgs.push(`${m.type()}: ${m.text()}`);
  });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  const imgRequests = [];
  page.on('request', (r) => {
    if (/\.(webp|jpe?g|png|avif)(\?|$)/.test(r.url())) imgRequests.push(r.url());
  });

  await page.goto(BASE + '#crystals', { waitUntil: 'load' });
  await page.waitForSelector('#crystals:not([hidden])', { timeout: 15000 });
  await page.waitForSelector('#crystalGrid .crystal-card', { timeout: 15000 });
  await page.waitForTimeout(1200);
  report.loading.initialImageRequests = imgRequests.length;
  report.loading.initialImageFiles = imgRequests.map((u) => u.split('/').slice(-2).join('/'));

  const cardCount = await page.locator('#crystalGrid .crystal-card').count();
  const totalImages = await page.locator('#crystalGrid img.crystal-photo').count();
  report.counts = { cards: cardCount, images: totalImages };

  for (const w of [360, 390, 480, 640, 768, 1024, 1280, 1440, 1920, 2560]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(350);
    // scroll through so lazy images load
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#crystalGrid .crystal-card')];
      const credits = [...document.querySelectorAll('#crystalGrid .crystal-credit')];
      const creditsVisible = credits.filter((c) => {
        const r = c.getBoundingClientRect();
        const cs = getComputedStyle(c);
        return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
      });
      const imgs = [...document.querySelectorAll('#crystalGrid img.crystal-photo')];
      const plate = imgs[0] ? imgs[0].closest('.crystal-image') || imgs[0].parentElement : null;
      const pr = plate ? plate.getBoundingClientRect() : null;
      // clipped credit text? compare scrollHeight to clientHeight and detect ellipsis
      const clipped = credits.filter((c) => c.scrollHeight > c.clientHeight + 1).map((c) => c.textContent.trim().slice(0, 40));
      const truncated = credits.filter((c) => getComputedStyle(c).textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth + 1);
      const innerOverflow = [...document.querySelectorAll('#crystalGrid .crystal-card')]
        .filter((c) => c.scrollWidth > c.clientWidth + 1).length;
      // rows
      const tops = {};
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        const key = Math.round(r.top);
        tops[key] = (tops[key] || 0) + 1;
      });
      return {
        viewport: window.innerWidth,
        docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        plate: pr ? { w: Math.round(pr.width), h: Math.round(pr.height) } : null,
        visibleCredits: creditsVisible.length,
        clippedCredits: clipped,
        ellipsisTruncated: truncated.length,
        cardInnerOverflow: innerOverflow,
        firstRowCards: Math.max(...Object.values(tops)),
        rows: Object.keys(tops).length,
        imgLoaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
        imgNatural: imgs.slice(0, 3).map((i) => `${i.naturalWidth}x${i.naturalHeight}`),
        chosen: imgs.slice(0, 3).map((i) => i.currentSrc.split('/').slice(-2).join('/')),
        sizes: imgs[0] ? imgs[0].getAttribute('sizes') : null,
        alts: [...new Set(imgs.map((i) => i.getAttribute('alt')))],
        creditFont: credits[0] ? getComputedStyle(credits[0]).fontSize : null,
        creditMaxHeight: credits.length ? Math.max(...credits.map((c) => c.getBoundingClientRect().height)) : null,
        creditMinHeight: credits.length ? Math.min(...credits.map((c) => c.getBoundingClientRect().height)) : null,
      };
    });
    // credit text equals data
    const creditTexts = await page.locator('#crystalGrid .crystal-credit').allTextContents();
    const cardIds = await page.locator('#crystalGrid .crystal-card').evaluateAll((els) => els.map((e) => e.dataset.id || null));
    let mismatch = 0;
    creditTexts.forEach((t, i) => {
      const id = cardIds[i];
      if (id && shortById[id] && t.trim() !== shortById[id].trim()) mismatch++;
    });
    m.creditTextMismatch = mismatch;
    m.cardIdsPresent = cardIds.filter(Boolean).length;
    report.viewports[w] = m;

    if ([390, 768, 1440].includes(w)) {
      await page.evaluate(() => document.querySelector('#crystalGrid').scrollIntoView());
      await page.waitForTimeout(300);
      const sec = await page.locator('#crystals, section:has(#crystalGrid)').first();
      await sec.screenshot({ path: path.join(OUT, `grid-${w}.png`) }).catch(async () => {
        await page.screenshot({ path: path.join(OUT, `grid-${w}.png`), fullPage: false });
      });
    }
  }

  // contrast of credit line
  await page.setViewportSize({ width: 1440, height: 900 });
  const contrast = await page.evaluate(() => {
    const el = document.querySelector('#crystalGrid .crystal-credit');
    if (!el) return null;
    const cs = getComputedStyle(el);
    let bgEl = el;
    let bg = 'rgba(0, 0, 0, 0)';
    while (bgEl && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
      bg = getComputedStyle(bgEl).backgroundColor;
      bgEl = bgEl.parentElement;
    }
    return { color: cs.color, bg, fontSize: cs.fontSize, lineHeight: cs.lineHeight };
  });

  // ---- keyboard + dialog ----
  await page.evaluate(() => document.querySelector('#crystalGrid').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  const firstBtn = page.locator('#crystalGrid .crystal-details-btn').first();
  await firstBtn.focus();
  const focusBefore = await page.evaluate(() => document.activeElement?.className || '');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  const dialog = await page.evaluate(() => {
    const modal = document.getElementById('crystalModal');
    const body = document.getElementById('crystalModalBody');
    const img = body?.querySelector('img');
    const credit = body?.querySelector('.crystal-detail-credit');
    const links = credit ? [...credit.querySelectorAll('a')].map((a) => ({ text: a.textContent.trim(), href: a.href, rel: a.rel })) : [];
    const cs = modal ? getComputedStyle(modal) : null;
    const r = modal ? modal.getBoundingClientRect() : null;
    return {
      open: !!modal && (modal.classList.contains('active') || cs.display !== 'none'),
      display: cs ? cs.display : null,
      modalRect: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
      imgAlt: img ? img.getAttribute('alt') : null,
      imgSrc: img ? img.currentSrc.split('/').slice(-2).join('/') : null,
      imgBox: img ? { w: Math.round(img.getBoundingClientRect().width), h: Math.round(img.getBoundingClientRect().height) } : null,
      imgNatural: img ? `${img.naturalWidth}x${img.naturalHeight}` : null,
      creditText: credit ? credit.innerText.replace(/\s+/g, ' ').trim() : null,
      links,
      creditClipped: credit ? credit.scrollHeight > credit.clientHeight + 1 : null,
      focusInside: !!modal && modal.contains(document.activeElement),
      activeEl: document.activeElement ? (document.activeElement.tagName + '.' + (document.activeElement.className || '')) : null,
      role: modal ? modal.getAttribute('role') : null,
      ariaModal: modal ? modal.getAttribute('aria-modal') : null,
      ariaLabelledby: modal ? modal.getAttribute('aria-labelledby') : null,
    };
  });
  await page.screenshot({ path: path.join(OUT, 'dialog-1440.png') });

  // tab cycle inside modal
  const tabOrder = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    tabOrder.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        const inModal = document.getElementById('crystalModal').contains(el);
        return `${inModal ? 'IN' : 'OUT'}:${el.tagName}:${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}`;
      })
    );
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  const afterEscape = await page.evaluate(() => {
    const modal = document.getElementById('crystalModal');
    const cs = getComputedStyle(modal);
    return {
      modalHidden: cs.display === 'none' || !modal.classList.contains('active'),
      focusReturnedTo: document.activeElement ? (document.activeElement.className || document.activeElement.tagName) : null,
      focusIsDetailsBtn: document.activeElement?.classList?.contains('crystal-details-btn') || false,
      bodyOverflow: getComputedStyle(document.body).overflow,
      ariaHidden: modal.getAttribute('aria-hidden'),
    };
  });

  // list view: attribution present + not clipped
  await page.locator('#viewListBtn').click().catch(() => {});
  await page.waitForTimeout(600);
  const listView = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#crystalGrid .crystal-card')];
    const inline = [...document.querySelectorAll('#crystalGrid .crystal-credit-inline')];
    const visibleInline = inline.filter((c) => c.getBoundingClientRect().width > 0);
    return {
      isList: !!document.querySelector('#crystalGrid .crystal-list') || cards.some((c) => c.closest('.crystal-list')),
      cards: cards.length,
      inlineCredits: inline.length,
      visibleInline: visibleInline.length,
      sample: visibleInline[0] ? visibleInline[0].textContent.trim() : null,
      clipped: inline.filter((c) => c.scrollHeight > c.clientHeight + 1).length,
    };
  });
  await page.screenshot({ path: path.join(OUT, 'list-1440.png'), fullPage: false });

  // section footer credits link
  const footer = await page.evaluate(() => {
    const a = document.querySelector('.crystal-sources a');
    return a ? { text: a.textContent.trim(), href: a.href, visible: a.getBoundingClientRect().height > 0 } : null;
  });

  report.contrast = contrast;
  report.contrastRatio = contrast ? ratio(parseRGB(contrast.color), parseRGB(contrast.bg)) : null;
  report.dialog = dialog;
  report.dialogTabOrder = tabOrder;
  report.afterEscape = afterEscape;
  report.focusBeforeDialog = focusBefore;
  report.listView = listView;
  report.sectionFooterLink = footer;
  report.console = consoleMsgs.slice(0, 10);
  report.pageErrors = pageErrors;

  fs.writeFileSync(path.join(OUT, 'browser-report.json'), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})();
