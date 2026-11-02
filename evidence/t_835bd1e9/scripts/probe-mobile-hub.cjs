// Sonde: Hub-Preset-Klick im mobilen Kontext.
const { chromium, devices } = require('playwright');
const BASE = 'http://127.0.0.1:3321/Esoterik-Welt';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['Pixel 5']);
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
  await page.locator('#fqLibrary .fq-entry').first().waitFor();
  const button = page.locator('[data-play-id="solfeggio-528"]');
  await button.scrollIntoViewIfNeeded();
  console.log('BBOX:', await button.boundingBox());
  await button.click();
  await page.waitForTimeout(1500);
  console.log('STATE:', await page.evaluate(() => ({
    state: window.EsoterikWelt.frequenz.getState(),
    error: document.getElementById('fqError')?.textContent,
    errHidden: document.getElementById('fqError')?.hidden,
    notice: document.getElementById('fqNotice')?.textContent,
  })));
  await browser.close();
})();
