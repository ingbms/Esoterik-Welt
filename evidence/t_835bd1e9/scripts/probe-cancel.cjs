// Sonde: Sweep-Abbruch, reduzierte Bewegung im laufenden Ton, Fokuswechsel.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:3321/Esoterik-Welt';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.addInitScript(() => {
    window.__qaRaf = 0;
    const original = window.requestAnimationFrame;
    window.requestAnimationFrame = function counted(cb) { window.__qaRaf += 1; return original.call(this, cb); };
  });
  await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // Fokus nach Ansichtswechsel: Hub -> Labor
  await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
  await page.locator('a[href="#frequenzen/labor"]').first().click();
  await page.waitForTimeout(500);
  console.log('FOCUS_AFTER_SWITCH:', await page.evaluate(() => ({ id: document.activeElement?.id, tag: document.activeElement?.tagName })));

  // reduzierte Bewegung + laufender Ton
  await page.locator('#fqPlay').click();
  await page.waitForTimeout(900);
  console.log('REDUCED:', await page.evaluate(() => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    raf: window.__qaRaf,
    noteHidden: document.getElementById('fqMotionNote').hidden,
    status: window.EsoterikWelt.frequenz.getState().status,
  })));

  // Sweep-Abbruch
  await page.locator('#fqSweepSeconds').fill('10');
  await page.locator('#fqSweepStart').click();
  await page.waitForTimeout(700);
  console.log('SWEEP_RUNNING:', await page.evaluate(() => ({ status: window.EsoterikWelt.frequenz.getState().status, sweep: !!window.EsoterikWelt.frequenz.getState().sweep, cancel: document.getElementById('fqSweepCancel').disabled })));
  await page.locator('#fqSweepCancel').click();
  await page.waitForTimeout(900);
  console.log('AFTER_CANCEL:', await page.evaluate(() => ({ status: window.EsoterikWelt.frequenz.getState().status, sweep: window.EsoterikWelt.frequenz.getState().sweep, msg: document.getElementById('fqStatus').textContent, live: document.getElementById('fqLiveStatus').textContent })));

  console.log('CONTRAST_IDS:', await page.evaluate(() => Array.from(document.querySelectorAll('[id]')).map((n) => n.id).filter((id) => /title|lede|disclaimer|status|readout|note|gain|hint/i.test(id)).slice(0, 40)));
  await browser.close();
})();
