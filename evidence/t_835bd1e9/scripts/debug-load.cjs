// Debug: Route laden und Konsolen-/Netzwerkfehler sichtbar machen.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (m) => console.log('[console.' + m.type() + ']', m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('requestfailed', (r) => console.log('[requestfailed]', r.url(), r.failure() && r.failure().errorText));
  page.on('response', (r) => { if (r.status() >= 400) console.log('[http ' + r.status() + ']', r.url()); });
  await page.goto('http://127.0.0.1:3201/Esoterik-Welt/#frequenzen', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  console.log('HASH:', await page.evaluate(() => location.hash));
  console.log('MAIN VISIBLE:', await page.evaluate(() => !!document.querySelector('#frequenzen')));
  console.log('LIBRARY:', await page.evaluate(() => document.querySelectorAll('#fqLibrary .fq-entry').length));
  console.log('DEBUG HANDLE:', await page.evaluate(() => typeof (window.EsoterikWelt && window.EsoterikWelt.frequenz)));
  console.log('SCRIPT TAGS:', await page.evaluate(() => Array.from(document.querySelectorAll('script[src]')).map((s) => s.src)));
  await browser.close();
})();
