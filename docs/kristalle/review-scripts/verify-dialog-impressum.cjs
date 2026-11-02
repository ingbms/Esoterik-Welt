const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/mas/Arbeit/Esoterik-Welt/node_modules/playwright');

const BASE = 'http://127.0.0.1:8188/Esoterik-Welt/';
const OUT = 'C:/Users/mas/AppData/Local/hermes/profiles/reviewer/cache/scratch/evidence';
const man = JSON.parse(fs.readFileSync('C:/Users/mas/Arbeit/Esoterik-Welt/assets/crystals/manifest.json', 'utf8'));
const byId = Object.fromEntries(man.images.map((e) => [e.id, e]));

(async () => {
  const browser = await chromium.launch();
  const out = { dialogs: {}, impressum: {}, perf: {} };

  for (const vp of [{ w: 360, h: 640 }, { w: 390, h: 844 }, { w: 768, h: 900 }, { w: 1440, h: 900 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__cls = 0;
      window.__shifts = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (!e.hadRecentInput) {
            window.__cls += e.value;
            window.__shifts.push({ v: e.value, t: Math.round(e.time) });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(BASE + '#crystals', { waitUntil: 'load' });
    await page.waitForSelector('#crystals:not([hidden])');
    await page.waitForSelector('#crystalGrid .crystal-details-btn');
    await page.waitForTimeout(800);
    await page.locator('#crystalGrid .crystal-details-btn').first().click();
    await page.waitForTimeout(900);
    const d = await page.evaluate(() => {
      const modal = document.getElementById('crystalModal');
      const inner = modal.querySelector('.modal');
      const body = document.getElementById('crystalModalBody');
      const img = body.querySelector('img');
      const credit = body.querySelector('.crystal-detail-credit');
      const ir = inner.getBoundingClientRect();
      const br = body.getBoundingClientRect();
      const cr = credit.getBoundingClientRect();
      const iR = img.getBoundingClientRect();
      return {
        innerRect: { x: Math.round(ir.x), y: Math.round(ir.y), w: Math.round(ir.width), h: Math.round(ir.height) },
        innerFitsViewport: ir.x >= -1 && ir.y >= -1 && ir.right <= window.innerWidth + 1 && ir.bottom <= window.innerHeight + 1,
        innerScrollsY: inner.scrollHeight > inner.clientHeight + 1,
        innerScrollsX: inner.scrollWidth > inner.clientWidth + 1,
        bodyScrollsY: body.scrollHeight > body.clientHeight + 1,
        imgBox: { w: Math.round(iR.width), h: Math.round(iR.height) },
        imgSame: Math.abs(iR.width - iR.height) < 1.5,
        imgFullyVisible: iR.top >= -1 && iR.left >= -1 && iR.right <= window.innerWidth + 1,
        creditRect: { y: Math.round(cr.y), h: Math.round(cr.height) },
        creditFullyVisible: cr.bottom <= inner.getBoundingClientRect().bottom + 1 || inner.scrollHeight > inner.clientHeight,
        creditClipped: credit.scrollHeight > credit.clientHeight + 1,
        creditCss: { fs: getComputedStyle(credit).fontSize, lh: getComputedStyle(credit).lineHeight },
        docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    out.dialogs[vp.w] = d;
    await page.screenshot({ path: path.join(OUT, `dialog-${vp.w}.png`) });
    out.dialogs[vp.w].cls = await page.evaluate(() => Math.round(window.__cls * 10000) / 10000);
    await ctx.close();
  }

  // BY-SA dialog detail
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '#crystals', { waitUntil: 'load' });
    await page.waitForSelector('#crystals:not([hidden])');
    await page.waitForSelector('#crystalGrid .crystal-details-btn');
    await page.waitForTimeout(600);
    const res = {};
    for (const id of ['crys-17', 'crys-18', 'crys-05', 'crys-15']) {
      const card = page.locator(`#crystalGrid .crystal-card[data-id="${id}"] .crystal-details-btn`);
      await card.click();
      await page.waitForTimeout(500);
      res[id] = await page.evaluate(() => {
        const body = document.getElementById('crystalModalBody');
        const credit = body.querySelector('.crystal-detail-credit');
        return {
          text: credit.innerText.replace(/\s+/g, ' ').trim(),
          links: [...credit.querySelectorAll('a')].map((a) => `${a.textContent.trim()} -> ${a.href}`),
          alt: body.querySelector('img')?.getAttribute('alt'),
          img: body.querySelector('img')?.currentSrc.split('/').slice(-2).join('/'),
        };
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(350);
    }
    out.bySaDialogs = res;
    await ctx.close();
  }

  // impressum page
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(BASE + 'impressum.html#kristalle-fotos', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const imp = await page.evaluate(() => {
      const sec = document.querySelector('#kristalle-fotos');
      const items = sec ? [...sec.querySelectorAll('li')] : [];
      const anchors = items.map((li) => {
        const a = [...li.querySelectorAll('a')].map((x) => x.href);
        return { id: (li.textContent.match(/crys-\d+/) || [''])[0], hrefs: a, textLen: li.textContent.trim().length };
      });
      const r = sec ? sec.getBoundingClientRect() : null;
      const first = items[0] ? getComputedStyle(items[0]).fontSize : null;
      return {
        sectionFound: !!sec,
        entries: items.length,
        firstFontSize: first,
        sectionTop: r ? Math.round(r.top) : null,
        clipped: items.filter((li) => li.scrollHeight > li.clientHeight + 1).length,
        allHave2Links: anchors.every((a) => a.hrefs.length >= 2),
        anchors,
        docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    out.impressum = imp;
    out.impressum.pageErrors = errs;

    // compare link sets against manifest
    const licSet = new Set(man.images.map((e) => e.credit.license_url));
    const srcSet = new Set(man.images.map((e) => e.credit.source_url));
    const licMissing = [];
    const srcMissing = [];
    for (const e of man.images) {
      const a = imp.anchors.find((x) => x.id === e.id);
      if (!a) { licMissing.push(e.id + ':no-entry'); continue; }
      const norm = a.hrefs.map((h) => h.replace(/\/$/, ''));
      if (!norm.includes(e.credit.license_url.replace(/\/$/, ''))) licMissing.push(e.id);
      if (!norm.includes(decodeURI(e.credit.source_url).replace(/\/$/, '')) && !norm.includes(e.credit.source_url)) srcMissing.push(e.id);
    }
    out.impressum.missingLicenseLinks = licMissing;
    out.impressum.missingSourceLinks = srcMissing;
    await page.screenshot({ path: path.join(OUT, 'impressum-kristalle-1440.png') });
    await ctx.close();
  }

  fs.writeFileSync(path.join(OUT, 'dialog-impressum-report.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
