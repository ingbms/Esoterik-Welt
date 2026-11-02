// Prüft die Sichtbefunde aus Review t_385afa1e im Browser:
//   P1.2  Links im Impressum (#kristalle-fotos) sind unterstrichen, nicht nur farbig
//   P2.3  Der vollständige Änderungsnachweis ist im Dialog bei 360 px ohne Scrollen sichtbar
//   P2.1  Innenkante der Bildplatte (Museumstafel) ist gerendert
//
// Voraussetzung: statischer Server auf dist/ (Seitenlayout /Esoterik-Welt/).
//   python -m http.server 8188 --directory dist
//   node docs/kristalle/scripts/verify-a11y-fixes.cjs [baseUrl] [outDir]

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8188/Esoterik-Welt';
const OUT = path.resolve(
  process.argv[3] || path.join(__dirname, '..', '..', '..', 'evidence', 'kristalle-fixes-t_b53c4f5a')
);

function decode(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { base: BASE, checks: {} };

  // --- P1.2 Impressum-Links -------------------------------------------------
  for (const width of [1440, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`${BASE}/impressum.html#kristalle-fotos`, { waitUntil: 'networkidle' });
    const data = await page.evaluate(() => {
      const link = document.querySelector('.crystal-credits a');
      const item = document.querySelector('.crystal-credits li');
      if (!link) return { found: false };
      const style = getComputedStyle(link);
      const itemStyle = getComputedStyle(item);
      return {
        found: true,
        links: document.querySelectorAll('.crystal-credits a').length,
        entries: document.querySelectorAll('.crystal-credits li').length,
        decoration: style.textDecorationLine,
        offset: style.textUnderlineOffset,
        linkColor: style.color,
        textColor: itemStyle.color,
        underlinePx: style.textDecorationThickness,
      };
    });
    report.checks[`impressum-${width}`] = data;
    await page.locator('#kristalle-fotos').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(OUT, `impressum-links-${width}.png`),
      fullPage: false,
      clip: { x: 0, y: 0, width, height: 900 },
    });
    await context.close();
  }

  // --- P2.3 Dialog 360 px ---------------------------------------------------
  for (const height of [900, 640]) {
    const context = await browser.newContext({ viewport: { width: 360, height }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`${BASE}/index.html#crystals`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#crystalGrid .crystal-details-btn');
    // crys-05 hat den längsten Nachweis (Freistellung + ShareAlike).
    const card = page.locator('#crystalGrid .crystal-card').filter({ hasText: 'Lapis' }).first();
    await card.locator('.crystal-details-btn').click();
    await page.waitForSelector('#crystalModal .crystal-detail-credit', { state: 'visible' });
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => {
      // Scrollbehälter ist die Dialogplatte selbst (.modal, overflow: auto).
      const panel = document.querySelector('#crystalModal .modal');
      const credit = document.querySelector('#crystalModal .crystal-detail-credit');
      const image = document.querySelector('#crystalModal .crystal-detail-image');
      const last = credit ? credit.lastElementChild : null;
      const panelRect = panel.getBoundingClientRect();
      const lastRect = last ? last.getBoundingClientRect() : null;
      return {
        imageWidth: image ? Math.round(image.getBoundingClientRect().width) : null,
        panelClientHeight: panel.clientHeight,
        panelScrollHeight: panel.scrollHeight,
        panelScrollTop: Math.round(panel.scrollTop),
        lastLineBottom: lastRect ? Math.round(lastRect.bottom) : null,
        panelBottom: Math.round(panelRect.bottom),
        lastLineVisible: lastRect ? lastRect.bottom <= panelRect.bottom + 0.5 : null,
        changesText: last ? last.textContent.length : 0,
      };
    });
    data.excessBelowPanel = data.lastLineBottom == null ? null : data.lastLineBottom - data.panelBottom;
    report.checks[`dialog-360x${height}`] = data;
    await page.screenshot({ path: path.join(OUT, `dialog-360x${height}.png`) });
    await context.close();
  }

  // --- P2.1 Innenkante der Bildplatte --------------------------------------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`${BASE}/index.html#crystals`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#crystalGrid img.crystal-photo');
    await page.waitForTimeout(600);
    report.checks.plate = await page.evaluate(() => {
      const plate = document.querySelector('#crystalGrid .crystal-image');
      const after = getComputedStyle(plate, '::after');
      return {
        position: getComputedStyle(plate).position,
        overlayShadow: after.boxShadow,
        overlayInset: [after.top, after.right, after.bottom, after.left].join(','),
        photos: document.querySelectorAll('#crystalGrid img.crystal-photo').length,
      };
    });
    await page.evaluate(() => {
      const grid = document.getElementById('crystalGrid');
      window.scrollTo(0, grid.getBoundingClientRect().top + window.scrollY - 8);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'grid-1440.png') });
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1) + '\n');
  console.log(JSON.stringify(report, null, 1));
  const p12 = [1440, 360].every(
    (w) => report.checks[`impressum-${w}`]?.decoration === 'underline'
  );
  const dialogChecks = ['dialog-360x900', 'dialog-360x640'].map((key) => report.checks[key]);
  const p23 = dialogChecks.every((entry) => entry.lastLineVisible && entry.panelScrollTop === 0);
  console.log(`P1.2 unterstrichen: ${p12 ? 'PASS' : 'FAIL'}`);
  console.log(
    `P2.3 ohne Scrollen: ${p23 ? 'PASS' : 'FAIL'} ` +
      dialogChecks.map((entry) => `(${entry.imageWidth}px Platte, Überstand ${entry.excessBelowPanel}px)`).join(' ')
  );
  if (!p12 || !p23) process.exitCode = 1;
})();
