// Struktur- und A11y-Audit des Mockups (ohne axe): Überschriftenordnung,
// doppelte IDs, Alt-Texte, Linktexte, Formularlabels, aria-Attribute, lang.
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));

const root = path.resolve(__dirname, '..');
const base = 'file:///' + path.join(root, 'mockup', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const view of ['landing', 'thema', 'glossar']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto(`${base}?view=${view}&bare=1&audit=1`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    report[view] = await page.evaluate(() => {
      const scope = [...document.querySelectorAll('.page')].find((s) => !s.hidden);
      const all = [...document.querySelectorAll('*')];
      const ids = all.map((el) => el.id).filter(Boolean);
      const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
      const headings = [...scope.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
        level: Number(h.tagName[1]),
        text: h.textContent.trim().slice(0, 60),
      }));
      let lastLevel = 0;
      const headingJumps = [];
      for (const h of headings) {
        if (lastLevel && h.level > lastLevel + 1) headingJumps.push(`${lastLevel} → ${h.level}: ${h.text}`);
        lastLevel = h.level;
      }
      const images = [...scope.querySelectorAll('img')].map((img) => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        hasAlt: img.hasAttribute('alt'),
        natural: img.naturalWidth,
        width: img.getAttribute('width'),
        height: img.getAttribute('height'),
      }));
      const emptyLinks = [...scope.querySelectorAll('a')]
        .filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label') && !a.querySelector('img[alt]'))
        .map((a) => a.getAttribute('href'));
      const badTargetBlank = [...scope.querySelectorAll('a[target="_blank"]')].filter(
        (a) => !(a.getAttribute('rel') || '').includes('noopener')
      ).length;
      const inputs = [...scope.querySelectorAll('input, select, textarea')].map((el) => ({
        type: el.type,
        id: el.id,
        hasLabel: Boolean(el.id && scope.querySelector(`label[for="${el.id}"]`)) || Boolean(el.getAttribute('aria-label')),
      }));
      const ariaCurrent = [...scope.querySelectorAll('[aria-current]')].map((el) => ({
        tag: el.tagName.toLowerCase(),
        value: el.getAttribute('aria-current'),
        text: el.textContent.trim().slice(0, 40),
      }));
      const landmarks = {
        header: document.querySelectorAll('header').length,
        nav: document.querySelectorAll('nav').length,
        main: document.querySelectorAll('main').length,
        footer: document.querySelectorAll('footer').length,
        h1: scope.querySelectorAll('h1').length,
      };
      const summaryWithoutDetails = [...scope.querySelectorAll('summary')].filter((s) => !s.closest('details')).length;
      const tabindexPositive = [...scope.querySelectorAll('[tabindex]')]
        .filter((el) => Number(el.getAttribute('tabindex')) > 0)
        .map((el) => el.outerHTML.slice(0, 60));
      const lang = document.documentElement.getAttribute('lang');
      const skipLink = document.querySelector('.skip-link');
      const skipTarget = skipLink ? document.querySelector(skipLink.getAttribute('href')) : null;
      return {
        lang,
        duplicateIds,
        headingCount: headings.length,
        h1Count: landmarks.h1,
        headingJumps,
        images,
        emptyLinks,
        badTargetBlank,
        inputs,
        ariaCurrent,
        landmarks,
        summaryWithoutDetails,
        tabindexPositive,
        skipLinkTargetExists: Boolean(skipTarget),
        skipLinkTargetTabIndex: skipTarget ? skipTarget.getAttribute('tabindex') : null,
      };
    });
    await context.close();
  }
  fs.writeFileSync(path.join(root, 'messung', 'struktur-audit.json'), JSON.stringify(report, null, 2));
  for (const [view, r] of Object.entries(report)) {
    console.log('\n##', view);
    console.log('lang', r.lang, '| h1', r.h1Count, '| headings', r.headingCount, '| jumps', r.headingJumps.length, '| dup-ids', r.duplicateIds.length);
    console.log('images', r.images.length, 'ohne alt', r.images.filter((i) => i.alt === null).length, '| leere Links', r.emptyLinks.length, '| target=_blank ohne noopener', r.badTargetBlank);
    console.log('inputs ohne Label', r.inputs.filter((i) => !i.hasLabel).length, '| aria-current', r.ariaCurrent.map((a) => a.value + ':' + a.text).join(', '));
    console.log('summary ohne details', r.summaryWithoutDetails, '| tabindex>0', r.tabindexPositive.length, '| skiplink', r.skipLinkTargetExists, r.skipLinkTargetTabIndex);
    if (r.headingJumps.length) console.log('Sprung:', r.headingJumps);
    if (r.duplicateIds.length) console.log('doppelte IDs:', r.duplicateIds);
  }
  await browser.close();
  process.exit(0);
})();
