/**
 * Sonde 4 (Ticket t_4a8106de): Verhalten bei echtem Tab-/Fensterwechsel.
 *
 * Drei Strategien, damit belegbar ist, welche davon den echten
 * visibilitychange-Pfad auslöst:
 *  S1 CDP Target.activateTarget auf eine zweite Seite (echter Tabwechsel)
 *  S2 CDP Browser.setWindowBounds "minimized" (Fenster minimieren)
 *  S3 gestubbter visibilitychange (nur Handler-Verdrahtung, kein Browserpfad)
 *
 * Aufruf: node evidence/t_4a8106de/probes/probe4.mjs <baseUrl> <outFile>
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3333/Esoterik-Welt';
const outFile = process.argv[3] || 'evidence/t_4a8106de/probe4.json';

const url = `${baseUrl}/#frequenzen/labor`;

async function readState(page) {
  return page.evaluate(() => {
    const handle = window.EsoterikWelt.frequenz;
    const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    return {
      visibility: document.visibilityState,
      hidden: document.hidden,
      hasFocus: document.hasFocus(),
      status: handle.getState().status,
      statusText: document.getElementById('fqStatus').textContent,
      liveStatus: document.getElementById('fqLiveStatus').textContent,
      mixRms: rms(Array.from(handle.getAnalyserData('mix'))),
    };
  });
}

const result = {};

const browser = await chromium.launch({
  headless: false,
  args: ['--window-position=-32000,-32000', '--window-size=1024,768', '--mute-audio'],
});
const context = await browser.newContext({ viewport: { width: 900, height: 700 } });

/* S1: echter Tabwechsel */
{
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqPlay', { timeout: 20000 });
  await page.click('#fqPlay');
  await page.waitForTimeout(800);
  const before = await readState(page);

  const other = await context.newPage();
  await other.goto('about:blank');
  const browserCdp = await browser.newBrowserCDPSession();
  const targets = await browserCdp.send('Target.getTargets');
  const otherTarget = targets.targetInfos.find((t) => t.type === 'page' && t.url === 'about:blank');
  let activated = null;
  if (otherTarget) {
    const res = await browserCdp.send('Target.activateTarget', { targetId: otherTarget.targetId });
    activated = otherTarget.targetId;
  }
  await page.waitForTimeout(1800);
  const during = await readState(page);
  const otherState = await other.evaluate(() => ({ visibility: document.visibilityState, hasFocus: document.hasFocus() }));
  await page.bringToFront();
  await page.waitForTimeout(900);
  const after = await readState(page);
  result.S1_activateTarget = { before, during, after, otherState, activated };
  await other.close();
  await page.close();
}

/* S2: Fenster minimieren */
try {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqPlay', { timeout: 20000 });
  await page.click('#fqPlay');
  await page.waitForTimeout(800);
  const before = await readState(page);
  const browserCdp = await browser.newBrowserCDPSession();
  const allTargets = await browserCdp.send('Target.getTargets');
  const myTarget = allTargets.targetInfos.find((t) => t.type === 'page' && t.url.includes('frequenzen'));
  const { windowId, bounds } = await browserCdp.send('Browser.getWindowForTarget', {
    targetId: myTarget ? myTarget.targetId : undefined,
  });
  const min = await browserCdp.send('Browser.setWindowBounds', {
    windowId,
    bounds: { windowState: 'minimized' },
  }).then(() => 'ok').catch((e) => String(e));
  await page.waitForTimeout(2000);
  const during = await readState(page);
  await browserCdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } }).catch(() => {});
  await page.waitForTimeout(600);
  const after = await readState(page);
  result.S2_minimize = { before, during, after, windowId, boundsBefore: bounds, minimize: min };
  await page.close();
} catch (error) {
  result.S2_minimize = { error: String(error) };
}

/* S3: gestubbter visibilitychange (nur Handler-Verdrahtung) */
{
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqPlay', { timeout: 20000 });
  await page.click('#fqPlay');
  await page.waitForTimeout(800);
  const before = await readState(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(700);
  const during = await readState(page);
  result.S3_stubbed = { before, during };
  await page.close();
}

await browser.close();
fs.mkdirSync(outFile.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
process.exit(0);
