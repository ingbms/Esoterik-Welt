// Messung: Passt die Hauptnavigation mit acht Zielen in die Kopfzeile?
// Eine frische Seite und ein frischer Dokumentzustand pro Breite, damit
// media-query-abhängige Custom Properties neu aufgelöst werden.
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));

const root = path.resolve(__dirname, '..');
const probe = 'file:///' + path.join(root, 'mockup', '_navprobe.html').replace(/\\/g, '/');
const widths = [780, 781, 800, 840, 860, 880, 900, 960, 1024, 1080, 1100, 1110, 1120, 1121, 1200, 1280, 1366, 1440, 1600];

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
    await page.goto(probe + '?w=' + width, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const row = await page.evaluate(() => {
      const inner = document.getElementById('headerInner');
      const nav = document.getElementById('navList');
      const logo = document.querySelector('.logo');
      const fav = document.getElementById('favCounter');
      const toggle = document.getElementById('navToggle');
      const links = [...document.querySelectorAll('.nav-link')];
      const ir = inner.getBoundingClientRect();
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return {
          x: Math.round(r.x * 10) / 10,
          right: Math.round(r.right * 10) / 10,
          w: Math.round(r.width * 10) / 10,
          h: Math.round(r.height * 10) / 10,
        };
      };
      const innerStyle = getComputedStyle(inner);
      const rightLimit = ir.right - parseFloat(innerStyle.paddingRight);
      const favVisible = fav && getComputedStyle(fav).display !== 'none';
      const toggleVisible = getComputedStyle(toggle).display !== 'none';
      const lastEdge = toggleVisible ? rect(toggle).right : favVisible ? rect(fav).right : rect(nav).right;
      const gapPx = parseFloat(innerStyle.gap) || 0;
      const visibleChildren = [logo, nav, favVisible ? fav : null, toggleVisible ? toggle : null].filter(Boolean);
      const usedWidth = visibleChildren.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);
      const reserve = Math.round((ir.width - parseFloat(innerStyle.paddingLeft) - parseFloat(innerStyle.paddingRight) - usedWidth - gapPx * (visibleChildren.length - 1)) * 10) / 10;
      return {
        reserve,
        reservePerGap: reserve,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
        headerInner: { w: Math.round(ir.width), scrollWidth: inner.scrollWidth, clientWidth: inner.clientWidth },
        paddingLeft: innerStyle.paddingLeft,
        paddingRight: innerStyle.paddingRight,
        innerGap: innerStyle.gap,
        logo: rect(logo),
        navList: { ...rect(nav), gap: getComputedStyle(nav).gap },
        fav: favVisible ? rect(fav) : null,
        toggle: toggleVisible ? rect(toggle) : null,
        rightLimit: Math.round(rightLimit * 10) / 10,
        lastEdge,
        freeSpace: Math.round((rightLimit - lastEdge) * 10) / 10,
        linkCount: links.length,
        linkWidths: links.map((a) => Math.round(a.getBoundingClientRect().width * 10) / 10),
        linkHeights: links.map((a) => Math.round(a.getBoundingClientRect().height)),
      };
    });
    rows.push({ width, ...row, consoleErrors });
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(root, 'messung', 'nav-8-ziele.json'), JSON.stringify(rows, null, 2));
  console.table(
    rows.map((r) => ({
      width: r.width,
      toggle: r.toggle ? 'ja' : 'nein',
      logo: r.logo.w,
      nav: Math.round(r.navList.w),
      gap: r.navList.gap,
      fav: r.fav ? r.fav.w : '–',
      free: r.freeSpace,
      reserve: r.reserve,
      linkH: [...new Set(r.linkHeights)].join('/'),
      docOverflow: r.docScrollWidth - r.docClientWidth,
      errors: r.consoleErrors.length,
    }))
  );
  console.log('Datei: docs/radiasthesie-konzept/messung/nav-8-ziele.json');
})();
