// Sonde: bricht das Instrumentieren von AudioContext die Wiedergabe?
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('console', (m) => m.type() === 'error' && console.log('[console.error]', m.text()));
  await page.addInitScript(() => {
    window.__qaContexts = [];
    const Orig = window.AudioContext;
    window.AudioContext = new Proxy(Orig, {
      construct(target, args) {
        const ctx = Reflect.construct(target, args);
        window.__qaContexts.push(ctx);
        return ctx;
      },
    });
    const createOscillator = Orig.prototype.createOscillator;
    Orig.prototype.createOscillator = function patched(...args) {
      const osc = createOscillator.apply(this, args);
      (window.__qaOscillators = window.__qaOscillators || []).push(osc);
      return osc;
    };
  });
  await page.goto('http://127.0.0.1:3320/Esoterik-Welt/#frequenzen/labor', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  console.log('CTX0:', await page.evaluate(() => window.__qaContexts.length));
  const t0 = Date.now();
  try {
    await page.locator('#fqPlay').click({ timeout: 15000 });
    console.log('CLICK_OK_MS:', Date.now() - t0);
  } catch (error) {
    console.log('CLICK_FAIL:', error.message.split('\n')[0]);
  }
  await page.waitForTimeout(800);
  console.log('STATE:', await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status));
  console.log('CTX:', await page.evaluate(() => window.__qaContexts.length));
  console.log('OSC:', await page.evaluate(() => (window.__qaOscillators || []).map((o) => ({ f: o.frequency.value, s: o.context.state }))));
  await browser.close();
})();
