const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/mas/Arbeit/Esoterik-Welt/node_modules/playwright');

const BASE = 'http://127.0.0.1:8188/Esoterik-Welt/';
const OUT = 'C:/Users/mas/AppData/Local/hermes/profiles/reviewer/cache/scratch/evidence';
const man = JSON.parse(fs.readFileSync('C:/Users/mas/Arbeit/Esoterik-Welt/assets/crystals/manifest.json', 'utf8'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + 'impressum.html#kristalle-fotos', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const imp = await page.evaluate(() => {
    const h = document.getElementById('kristalle-fotos');
    const ul = h ? h.nextElementSibling?.classList.contains('crystal-credits') ? h.nextElementSibling : h.parentElement.querySelector('ul.crystal-credits') : null;
    const items = ul ? [...ul.querySelectorAll('li')] : [];
    const cs = items[0] ? getComputedStyle(items[0]) : null;
    return {
      headingFound: !!h,
      ulFound: !!ul,
      entries: items.length,
      fontSize: cs ? cs.fontSize : null,
      lineHeight: cs ? cs.lineHeight : null,
      color: cs ? cs.color : null,
      bg: cs ? getComputedStyle(document.body).backgroundColor : null,
      clipped: items.filter((li) => li.scrollHeight > li.clientHeight + 1).length,
      withTwoLinks: items.filter((li) => li.querySelectorAll('a').length >= 2).length,
      linksPerEntry: items.map((li) => [...li.querySelectorAll('a')].map((a) => a.href)),
      ids: items.map((li) => (li.textContent.match(/crys-\d+/) || [''])[0]),
      scrollAnchorTop: h ? Math.round(h.getBoundingClientRect().top) : null,
      docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  const missingLic = [];
  const missingSrc = [];
  imp.ids.forEach((id, i) => {
    const e = man.images.find((x) => x.id === id);
    if (!e) { missingLic.push(id + ':unknown'); return; }
    const norm = imp.linksPerEntry[i].map((h) => h.replace(/\/$/, ''));
    if (!norm.includes(e.credit.license_url.replace(/\/$/, ''))) missingLic.push(id);
    const src = decodeURI(e.credit.source_url).replace(/\/$/, '');
    if (!norm.includes(src) && !norm.includes(e.credit.source_url.replace(/\/$/, ''))) missingSrc.push(id);
  });
  imp.missingLicenseLinks = missingLic;
  imp.missingSourceLinks = missingSrc;
  await page.screenshot({ path: path.join(OUT, 'impressum-kristalle-1440.png') });
  fs.writeFileSync(path.join(OUT, 'impressum-report.json'), JSON.stringify(imp, null, 1));
  console.log(JSON.stringify({ ...imp, linksPerEntry: undefined, linksPerEntry0: imp.linksPerEntry[0] }, null, 1));
  await browser.close();
})();
