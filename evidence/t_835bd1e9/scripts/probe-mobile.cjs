// Sonde: Audio im mobilen Chromium-Kontext (Pixel 5) und Navigationsmenü.
const { chromium, devices } = require('playwright');
const BASE = 'http://127.0.0.1:3321/Esoterik-Welt';

(async () => {
  const browser = await chromium.launch();
  for (const [label, options] of [
    ['pixel5', devices['Pixel 5']],
    ['pixel5-noMobile', { ...devices['Pixel 5'], isMobile: false }],
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && console.log(`[${label} console]`, m.text()));
    await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    await page.locator('#fqPlay').click();
    await page.waitForTimeout(1200);
    console.log(label, await page.evaluate(() => ({
      state: window.EsoterikWelt.frequenz.getState(),
      error: document.getElementById('fqError').textContent,
      hidden: document.getElementById('fqError').hidden,
      ctxState: window.EsoterikWelt.frequenz.getState().contextState,
    })));
    await context.close();
  }

  // Menüzustand
  const context = await browser.newContext(devices['Pixel 5']);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  console.log('NAV:', await page.evaluate(() => {
    const link = document.querySelector('.nav-link[data-page="frequenzen"]');
    const style = getComputedStyle(link);
    const menu = document.querySelector('.nav-toggle, #navToggle, [aria-controls="mainNav"], .menu-toggle');
    return {
      linkVisible: link.getBoundingClientRect().width > 0,
      display: style.display,
      menu: menu ? { id: menu.id, cls: menu.className, label: menu.getAttribute('aria-label'), expanded: menu.getAttribute('aria-expanded') } : null,
    };
  }));
  await context.close();
  await browser.close();
})();
