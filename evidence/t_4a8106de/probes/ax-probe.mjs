/**
 * AX-/DOM-Sonde für die Restrisiken R-1..R-3 (Ticket t_4a8106de).
 *
 * Zweck: maschinenlesbar festhalten, WAS Browser und Accessibility-Baum
 * exponieren (Rollen, Namen, Werte, Live-Regionen) und wie die Status-/Fehler-
 * ansagen im DOM wechseln. Das ist ausdrücklich KEIN Screenreader-Test:
 * NVDA/VoiceOver sprechen aus dem Accessibility-Baum, aber Aussprache,
 * Reihenfolge, Unterbrechungen und Fokusführung sind nur manuell prüfbar.
 *
 * Aufruf: node evidence/t_4a8106de/probes/ax-probe.mjs <baseUrl> <outFile>
 */
import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3333/Esoterik-Welt';
const outFile = process.argv[3] || 'evidence/t_4a8106de/ax-probe.json';

const SELECTORS = [
  '#fqPlay',
  '#fqStop',
  '#fqFreqRange',
  '#fqFreqNumber',
  '#fqFreqReadout',
  '#fqGainRange',
  '#fqGainReadout',
  '#fqSweepStart',
  '#fqSweepCancel',
  '#fqSweepProgress',
  '#fqStatus',
  '#fqError',
];

async function axFor(page, selector, cdp) {
  const out = { selector };
  if (cdp) {
    try {
      const doc = await cdp.send('DOM.getDocument', { depth: -1 });
      const found = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector });
      if (!found.nodeId) return { ...out, error: 'node not found' };
      const tree = await cdp.send('Accessibility.getPartialAXTree', {
        nodeId: found.nodeId,
        fetchRelatives: false,
      });
      const node = (tree.nodes || [])[0] || {};
      out.role = node.role && node.role.value;
      out.name = node.name && node.name.value;
      out.value = node.value && node.value.value;
      out.description = node.description && node.description.value;
      out.properties = Object.fromEntries(
        (node.properties || [])
          .filter((p) => ['valuemin', 'valuemax', 'valuetext', 'live', 'atomic', 'relevant', 'invalid', 'focusable', 'disabled', 'hidden'].includes(p.name))
          .map((p) => [p.name, p.value && p.value.value])
      );
      out.invalid = node.ignored ? 'ignored' : undefined;
      return out;
    } catch (error) {
      return { ...out, error: String(error) };
    }
  }
  try {
    out.ariaSnapshot = await page.locator(selector).ariaSnapshot();
  } catch (error) {
    out.ariaSnapshot = `ERROR: ${error.message}`;
  }
  return out;
}

async function runEngine(name, launcher, options = {}) {
  const browser = await launcher.launch({ headless: true });
  const context = await browser.newContext(options.contextOptions || {});
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  let cdp = null;
  if (name === 'chromium') {
    cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('Accessibility.enable');
  }

  const result = {
    engine: name,
    browserVersion: browser.version(),
    userAgent: await page.evaluate(() => navigator.userAgent),
    webAudio: await page.evaluate(() => ({
      AudioContext: typeof window.AudioContext,
      webkitAudioContext: typeof window.webkitAudioContext,
      OfflineAudioContext: typeof window.OfflineAudioContext,
      StereoPanner: typeof (window.AudioContext || window.webkitAudioContext)
        ? undefined
        : 'no-context-ctor',
    })),
    steps: {},
  };

  await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqFreqRange', { timeout: 20000 });
  await page.waitForTimeout(400);

  result.steps.initial = {};
  for (const selector of SELECTORS) result.steps.initial[selector] = await axFor(page, selector, cdp);
  result.steps.initial.dom = await page.evaluate(() => ({
    sliderMin: document.getElementById('fqFreqRange')?.min,
    sliderMax: document.getElementById('fqFreqRange')?.max,
    sliderStep: document.getElementById('fqFreqRange')?.step,
    sliderValue: document.getElementById('fqFreqRange')?.value,
    sliderAriaValueText: document.getElementById('fqFreqRange')?.getAttribute('aria-valuetext'),
    sliderAriaDescribedby: document.getElementById('fqFreqRange')?.getAttribute('aria-describedby'),
    numberValue: document.getElementById('fqFreqNumber')?.value,
    numberInputmode: document.getElementById('fqFreqNumber')?.getAttribute('inputmode'),
    numberType: document.getElementById('fqFreqNumber')?.type,
    gainMin: document.getElementById('fqGainRange')?.min,
    gainMax: document.getElementById('fqGainRange')?.max,
    gainValue: document.getElementById('fqGainRange')?.value,
    gainAriaValueText: document.getElementById('fqGainRange')?.getAttribute('aria-valuetext'),
    statusRole: document.getElementById('fqStatus')?.getAttribute('role'),
    statusLive: document.getElementById('fqStatus')?.getAttribute('aria-live'),
    errorRole: document.getElementById('fqError')?.getAttribute('role'),
    errorHidden: document.getElementById('fqError')?.hidden,
    playDisabled: document.getElementById('fqPlay')?.disabled,
    labels: Array.from(document.querySelectorAll('#fqFreqRange, #fqFreqNumber, #fqGainRange')).map((el) => ({
      id: el.id,
      label: el.labels && el.labels[0] ? el.labels[0].textContent.trim() : null,
    })),
  }));

  // Start -> Statusansage
  await page.click('#fqPlay');
  await page.waitForTimeout(1200);
  result.steps.afterPlay = {
    status: await page.textContent('#fqStatus'),
    error: await page.textContent('#fqError'),
    errorHidden: await page.evaluate(() => document.getElementById('fqError').hidden),
    engineState: await page.evaluate(() => {
      const handle = window.EsoterikWelt && window.EsoterikWelt.frequenz;
      return handle ? handle.getState() : null;
    }),
    leftRms: await page.evaluate(() => {
      const handle = window.EsoterikWelt && window.EsoterikWelt.frequenz;
      if (!handle) return null;
      const data = handle.getAnalyserData('left');
      let sum = 0;
      for (const v of data) sum += v * v;
      return Math.sqrt(sum / data.length);
    }),
  };

  // Stopp -> Statusansage
  await page.click('#fqStop');
  await page.waitForTimeout(1200);
  result.steps.afterStop = {
    status: await page.textContent('#fqStatus'),
    errorHidden: await page.evaluate(() => document.getElementById('fqError').hidden),
    engineState: await page.evaluate(() => {
      const handle = window.EsoterikWelt && window.EsoterikWelt.frequenz;
      return handle ? handle.getState() : null;
    }),
  };

  // Slider per Tastatur -> Zahlenfeld/Readout/AX-Wert
  await page.focus('#fqFreqRange');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  result.steps.sliderKeys = {
    sliderValue: await page.evaluate(() => document.getElementById('fqFreqRange').value),
    numberValue: await page.evaluate(() => document.getElementById('fqFreqNumber').value),
    readout: await page.textContent('#fqFreqReadout'),
    ax: await axFor(page, '#fqFreqRange', cdp),
  };

  // Sweep-Start -> Ansage
  await page.fill('#fqSweepSeconds', '1');
  await page.click('#fqSweepStart');
  await page.waitForTimeout(1300);
  result.steps.sweepStart = {
    status: await page.textContent('#fqStatus'),
    progress: await page.evaluate(() => {
      const el = document.getElementById('fqSweepProgress');
      return el ? { valueNow: el.getAttribute('aria-valuenow'), wrapHidden: document.getElementById('fqSweepWrap').hidden } : null;
    }),
    ax: await axFor(page, '#fqSweepProgress', cdp),
  };
  await page.waitForTimeout(1500);
  result.steps.sweepEnd = { status: await page.textContent('#fqStatus') };

  // Fehlermeldung: ungültige Zahl
  await page.fill('#fqFreqNumber', '0');
  await page.dispatchEvent('#fqFreqNumber', 'change');
  await page.waitForTimeout(600);
  result.steps.invalidNumber = {
    status: await page.textContent('#fqStatus'),
    error: await page.textContent('#fqError'),
    errorHidden: await page.evaluate(() => document.getElementById('fqError').hidden),
    numberValue: await page.evaluate(() => document.getElementById('fqFreqNumber').value),
    ax: await axFor(page, '#fqError', cdp),
  };

  // Bibliothek: Evidenz-Badges als Text?
  await page.goto(`${baseUrl}/#frequenzen`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.fq-badge', { timeout: 20000 });
  result.steps.hub = {
    badgeCount: await page.locator('.fq-badge').count(),
    badges: await page.locator('.fq-badge').evaluateAll((nodes) => nodes.slice(0, 6).map((n) => n.textContent.trim())),
    badgeColorOnly: await page.evaluate(() => {
      const badge = document.querySelector('.fq-badge');
      if (!badge) return null;
      const style = getComputedStyle(badge);
      return { color: style.color, backgroundColor: style.backgroundColor, hasText: badge.textContent.trim().length > 0 };
    }),
    firstEntryAx: cdp ? await axFor(page, '.fq-badge', cdp) : null,
  };

  result.console = consoleMessages;
  result.pageErrors = pageErrors;
  await browser.close();
  return result;
}

const results = [];
for (const [name, launcher, options] of [
  ['chromium', chromium, { contextOptions: {} }],
  ['firefox', firefox, { contextOptions: {} }],
  ['webkit', webkit, { contextOptions: {} }],
  ['chromium-mobile', chromium, { contextOptions: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } }],
]) {
  try {
    results.push(await runEngine(name, launcher, options));
  } catch (error) {
    results.push({ engine: name, fatal: String(error && error.stack ? error.stack : error) });
  }
}

fs.mkdirSync(outFile.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
console.log(`written: ${outFile}`);
for (const r of results) {
  console.log(`\n== ${r.engine} ${r.browserVersion || ''} ${r.fatal ? 'FATAL' : ''}`);
  if (r.fatal) console.log(r.fatal.slice(0, 500));
  if (r.steps) {
    console.log('webAudio:', JSON.stringify(r.webAudio));
    console.log('initial slider dom:', JSON.stringify(r.steps.initial.dom.sliderValue), 'aria-valuetext:', JSON.stringify(r.steps.initial.dom.sliderAriaValueText));
    console.log('slider AX:', JSON.stringify(r.steps.initial['#fqFreqRange']));
    console.log('afterPlay:', JSON.stringify(r.steps.afterPlay));
    console.log('afterStop status:', JSON.stringify(r.steps.afterStop.status));
    console.log('sliderKeys:', JSON.stringify({ numberValue: r.steps.sliderKeys.numberValue, readout: r.steps.sliderKeys.readout }));
    console.log('sweepStart status:', JSON.stringify(r.steps.sweepStart.status));
    console.log('invalidNumber:', JSON.stringify(r.steps.invalidNumber));
    console.log('console errors:', JSON.stringify(r.console));
    console.log('pageErrors:', JSON.stringify(r.pageErrors));
  }
}
