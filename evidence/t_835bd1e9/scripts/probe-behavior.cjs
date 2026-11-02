// Gezielte Verhaltenssonden: Fokus, Preset-Klick, Sweep-Zustand, rAF/reduced motion.
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:3320/Esoterik-Welt';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('console', (m) => m.type() === 'error' && console.log('[console.error]', m.text()));

  await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  console.log('MATCH_REDUCED:', await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  console.log('MOTION_NOTE_HIDDEN:', await page.evaluate(() => document.getElementById('fqMotionNote')?.hidden));
  console.log('H1S:', await page.evaluate(() => Array.from(document.querySelectorAll('#frequenzlaborRoot h1, #frequenzen h1')).map((h) => ({ id: h.id, text: h.textContent.trim().slice(0, 40) }))));
  console.log('ACTIVE:', await page.evaluate(() => ({ id: document.activeElement?.id, tag: document.activeElement?.tagName })));
  console.log('STATE0:', await page.evaluate(() => window.EsoterikWelt.frequenz.getState()));

  // Slider-Sync pruefen
  await page.locator('#fqFreqRange').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  console.log('SLIDER:', await page.evaluate(() => ({
    slider: document.getElementById('fqFreqRange').value,
    number: document.getElementById('fqFreqNumber').value,
    readout: document.getElementById('fqFreqReadout').textContent,
    stateHz: window.EsoterikWelt.frequenz.getState().freqHz,
  })));

  // Play + Stop Verhalten ohne Proxy
  await page.locator('#fqPlay').click();
  await page.waitForTimeout(600);
  console.log('AFTER_PLAY:', await page.evaluate(() => ({ state: window.EsoterikWelt.frequenz.getState(), status: document.getElementById('fqStatus').textContent, live: document.getElementById('fqLiveStatus').textContent })));
  await page.locator('#fqStop').click();
  await page.waitForTimeout(400);
  console.log('AFTER_STOP:', await page.evaluate(() => window.EsoterikWelt.frequenz.getState()));

  // Sweep 1 s
  await page.locator('#fqSweepFrom').fill('200');
  await page.locator('#fqSweepTo').fill('400');
  await page.locator('#fqSweepSeconds').fill('1');
  await page.locator('#fqSweepStart').click();
  for (const delay of [200, 800, 1500, 2500]) {
    await page.waitForTimeout(delay === 200 ? 200 : 600);
    console.log('SWEEP@' + delay, await page.evaluate(() => ({
      state: window.EsoterikWelt.frequenz.getState(),
      status: document.getElementById('fqStatus').textContent,
      live: document.getElementById('fqLiveStatus').textContent,
      progressHidden: document.getElementById('fqSweepWrap').hidden,
      cancelDisabled: document.getElementById('fqSweepCancel').disabled,
    })));
  }

  // Hub: Preset-Klick
  const hub = await browser.newPage();
  hub.on('pageerror', (e) => console.log('[hub pageerror]', e.message));
  await hub.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
  await hub.waitForTimeout(800);
  const button = hub.locator('[data-play-id="solfeggio-528"]');
  console.log('HUB_BUTTON_COUNT:', await button.count());
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await hub.waitForTimeout(1500);
  console.log('HUB_AFTER_CLICK:', await hub.evaluate(() => ({
    hash: location.hash,
    state: window.EsoterikWelt.frequenz.getState(),
    status: document.getElementById('fqStatus')?.textContent,
    playingPanel: !!document.getElementById('fqPlay'),
  })));

  await browser.close();
})();
