// Ad-hoc-Verifikation der Kristalle-Galerie gegen die Spezifikation (A1-A16).
// Ausfuehren: node scripts/verify-crystals.cjs [baseUrl]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.argv[2] || 'http://127.0.0.1:8104/Esoterik-Welt/';
const OUT = path.resolve(__dirname, '..', 'evidence', 'kristalle');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [360, 390, 480, 640, 768, 1024, 1280, 1440, 1920];

(async () => {
  const browser = await chromium.launch();
  const report = { base: BASE, viewports: {}, checks: {}, images: [], requests: { initial: [] } };

  for (const width of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + '#crystals', { waitUntil: 'networkidle' });
    await page.waitForSelector('#crystalGrid .crystal-card');
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => {
      const plates = [...document.querySelectorAll('#crystalGrid .crystal-image')];
      const cards = [...document.querySelectorAll('#crystalGrid .crystal-card')];
      const h2 = [...document.querySelectorAll('#crystalGrid .crystal-name')].map((h) =>
        Math.round(h.getBoundingClientRect().top)
      );
      const rows = {};
      h2.forEach((y) => (rows[y] = (rows[y] || 0) + 1));
      const firstY = h2[0];
      const firstRow = h2.filter((y) => Math.abs(y - firstY) < 2).length;
      return {
        cards: cards.length,
        glyphs: document.querySelectorAll('#crystalGrid .crystal-glyph').length,
        photos: document.querySelectorAll('#crystalGrid img.crystal-photo').length,
        credits: document.querySelectorAll('#crystalGrid .crystal-credit').length,
        plateWidth: plates.length ? Math.round(plates[0].getBoundingClientRect().width) : null,
        plateHeight: plates.length ? Math.round(plates[0].getBoundingClientRect().height) : null,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        rows: Object.keys(rows).length,
        firstRowCards: firstRow,
        creditHeights: [...document.querySelectorAll('#crystalGrid .crystal-credit')]
          .slice(0, 8)
          .map((c) => Math.round(c.getBoundingClientRect().height)),
        nameTopsFirstRow: h2.slice(0, firstRow),
        objectFit: plates.length ? getComputedStyle(plates[0].querySelector('img') || plates[0]).objectFit : null,
      };
    });
    report.viewports[width] = data;
    if ([390, 640, 1024, 1440].includes(width)) {
      await page.evaluate(() => {
        const grid = document.getElementById('crystalGrid');
        window.scrollTo(0, grid.getBoundingClientRect().top + window.scrollY - 8);
      });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, `grid-${width}.png`) });
    }
    await ctx.close();
  }

  // Netzwerk/Lazy-Loading + srcset + Credits + Dialog
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const imageRequests = [];
  const badResponses = [];
  page.on('request', (r) => {
    if (/assets\/crystals\/.*\.webp$/.test(r.url())) imageRequests.push(r.url().split('/Esoterik-Welt/')[1]);
  });
  page.on('response', (r) => {
    if (/assets\/crystals\/.*\.webp$/.test(r.url()) && r.status() >= 400) badResponses.push([r.url(), r.status()]);
  });
  await page.goto(BASE + '#crystals', { waitUntil: 'networkidle' });
  await page.waitForSelector('#crystalGrid img.crystal-photo');
  await page.waitForTimeout(600);
  report.requests.initial = imageRequests;
  report.requests.count = imageRequests.length;
  report.requests.badResponses = badResponses;

  report.images = await page.evaluate(() =>
    [...document.querySelectorAll('#crystalGrid .crystal-card')].map((card) => {
      const img = card.querySelector('img.crystal-photo');
      const credit = card.querySelector('.crystal-credit');
      return {
        id: card.dataset.id,
        src: img?.getAttribute('src') || null,
        srcsetSteps: img
          ? (img.getAttribute('srcset') || img.getAttribute('data-srcset') || '').split(',').filter(Boolean).length
          : 0,
        updated: Boolean(img?.getAttribute('srcset')),
        sizes: img?.getAttribute('sizes') || null,
        alt: img?.getAttribute('alt'),
        width: img?.getAttribute('width'),
        height: img?.getAttribute('height'),
        loading: img?.getAttribute('loading'),
        credit: credit?.textContent.trim() || null,
        natural: img ? [img.naturalWidth, img.naturalHeight] : null,
      };
    })
  );

  // A6: Nachweiszeile der Karte == attribution_text_short des Manifests
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'assets', 'crystals', 'manifest.json'), 'utf8')
  );
  const byId = Object.fromEntries(manifest.images.map((i) => [i.id, i]));
  report.checks.attribution = report.images.map((img) => ({
    id: img.id,
    match: byId[img.id] ? byId[img.id].attribution_text_short === img.credit : false,
    srcsetOk: img.srcsetSteps === 4,
    ratioOk: img.width === img.height,
    altEmpty: img.alt === '',
    expected: byId[img.id]?.attribution_text_short,
    actual: img.credit,
  }));
  report.checks.attributionFailures = report.checks.attribution.filter(
    (a) => !a.match || !a.srcsetOk || !a.ratioOk || !a.altEmpty
  );

  // Dialog
  await page.locator('#crystalGrid .crystal-card').first().click();
  await page.waitForSelector('#crystalModal:not([hidden])');
  await page.waitForTimeout(300);
  report.checks.dialog = await page.evaluate(() => {
    const modal = document.querySelector('#crystalModal .modal');
    const plate = document.querySelector('#crystalModal .crystal-detail-image');
    const credit = document.querySelector('#crystalModal .crystal-detail-credit');
    const img = document.querySelector('#crystalModal .crystal-detail-image img');
    const links = [...document.querySelectorAll('#crystalModal .crystal-detail-credit a')].map((a) => a.href);
    return {
      modalWidth: Math.round(modal.getBoundingClientRect().width),
      plate: plate
        ? [Math.round(plate.getBoundingClientRect().width), Math.round(plate.getBoundingClientRect().height)]
        : null,
      creditHeight: credit ? Math.round(credit.getBoundingClientRect().height) : null,
      creditText: credit?.innerText || null,
      links,
      alt: img?.getAttribute('alt') || null,
      src: img?.getAttribute('src') || null,
    };
  });
  await page.screenshot({ path: path.join(OUT, 'dialog-1440.png') });

  // Fokus-Rueckgabe: Escape schliesst, Fokus liegt auf der Details-Schaltflaeche
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  report.checks.focusReturn = await page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el.tagName, cls: el.className, text: (el.textContent || '').trim().slice(0, 40) };
  });

  // Listenansicht
  await page.locator('#viewListBtn').click();
  await page.waitForTimeout(400);
  report.checks.list = await page.evaluate(() => {
    const fig = document.querySelector('#crystalGrid .crystal-figure');
    const img = document.querySelector('#crystalGrid .crystal-image');
    const inline = document.querySelector('#crystalGrid .crystal-credit-inline');
    const credit = document.querySelector('#crystalGrid .crystal-credit');
    return {
      gridClass: document.getElementById('crystalGrid').className,
      figureWidth: fig ? Math.round(fig.getBoundingClientRect().width) : null,
      plate: img
        ? [Math.round(img.getBoundingClientRect().width), Math.round(img.getBoundingClientRect().height)]
        : null,
      creditDisplay: credit ? getComputedStyle(credit).display : null,
      inlineCredit: inline?.textContent.trim() || null,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  await page.screenshot({ path: path.join(OUT, 'list-1440.png') });
  await page.locator('#viewGridBtn').click();

  // Fehlerzustand: fehlende Datei
  report.checks.errorState = await page.evaluate(async () => {
    const img = document.querySelector('#crystalGrid img.crystal-photo');
    const card = img.closest('.crystal-card');
    img.dispatchEvent(new Event('error'));
    await new Promise((r) => setTimeout(r, 100));
    return {
      isMissing: card.querySelector('.crystal-image').classList.contains('is-missing'),
      glyph: !!card.querySelector('.crystal-glyph'),
      credit: card.querySelector('.crystal-credit')?.textContent.trim(),
      imgRemoved: !card.querySelector('img'),
    };
  });

  // Sammelnachweis im Impressum
  await page.goto(BASE + 'impressum.html#kristalle-fotos', { waitUntil: 'networkidle' });
  report.checks.impressum = await page.evaluate(() => {
    const sec = document.querySelector('#kristalle-fotos');
    const items = sec ? sec.parentElement.querySelectorAll('ul.crystal-credits li') : [];
    const links = sec
      ? [...sec.parentElement.querySelectorAll('ul.crystal-credits a')].map((a) => a.getAttribute('href'))
      : [];
    return {
      heading: sec?.textContent.trim() || null,
      items: items.length,
      linkSample: links.slice(0, 4),
      licenseLinks: links.filter((l) => l.includes('creativecommons') || l.includes('wiki/Template')).length,
    };
  });

  await ctx.close();
  await browser.close();

  const jsonPath = path.join(OUT, 'report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
