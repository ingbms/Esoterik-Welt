/**
 * Sonde 3 (Ticket t_4a8106de):
 *  A) Binaurale Kanaltrennung mit ausreichender Frequenzauflösung:
 *     - Differenz 8 Hz: 30 Analysator-Frames (~1,3 s) verkettet, Scan 195–215 Hz.
 *     - Differenz 100 Hz (200/300 Hz): ein Frame genügt (Bin 23,4 Hz).
 *  B) Verhalten bei echtem Tab-Wechsel (visibilitychange):
 *     - echtes Fenster (offscreen positioniert), zweite Seite im Vordergrund,
 *     - Prüfung: Engine stoppt, Statusansage erscheint, Analysatoren bei 0.
 *     - Fallback, falls kein Fensterstart möglich: gestubbter visibilitychange.
 *
 * Aufruf: node evidence/t_4a8106de/probes/probe3.mjs <baseUrl> <outFile>
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3333/Esoterik-Welt';
const outFile = process.argv[3] || 'evidence/t_4a8106de/probe3.json';
const result = {};

const goertzelSrc = `
  window.goertzel = (data, freq, sampleRate) => {
    const k = Math.round((data.length * freq) / sampleRate);
    const w = (2 * Math.PI * k) / data.length;
    const coeff = 2 * Math.cos(w);
    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < data.length; i += 1) {
      s0 = data[i] + coeff * s1 - s2;
      s2 = s1; s1 = s0;
    }
    const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
    return Math.sqrt(Math.max(power, 0)) / data.length;
  };
  window.sampleRateOf = () => {
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const r = ctx.sampleRate; ctx.close(); return r; } catch (e) { return null; }
  };
  window.collectFrames = async (count) => {
    const handle = window.EsoterikWelt.frequenz;
    const left = [];
    const right = [];
    for (let i = 0; i < count; i += 1) {
      left.push(...handle.getAnalyserData('left'));
      right.push(...handle.getAnalyserData('right'));
      await new Promise((r) => setTimeout(r, 45));
    }
    return { left, right };
  };
  window.peakScan = (arr, from, to, step, sampleRate) => {
    const out = [];
    for (let f = from; f <= to; f += step) out.push({ hz: Number(f.toFixed(2)), amp: window.goertzel(arr, f, sampleRate) });
    out.sort((a, b) => b.amp - a.amp);
    return out.slice(0, 3).map((x) => ({ hz: x.hz, amp: Number(x.amp.toFixed(6)) }));
  };
`;

/* ------------------------------------------------------- A) Kanaltrennung */
{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqBinauralPlay', { timeout: 20000 });
  await page.evaluate(goertzelSrc);

  // 8-Hz-Differenz, verkettete Frames
  await page.fill('#fqCarrier', '200');
  await page.fill('#fqDelta', '8');
  await page.click('#fqBinauralPlay');
  await page.waitForTimeout(700);
  result.binaural8Hz = await page.evaluate(async () => {
    const sampleRate = window.sampleRateOf() || 48000;
    const { left, right } = await window.collectFrames(30);
    const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    return {
      sampleRate,
      samples: left.length,
      windowMs: Math.round((left.length / sampleRate) * 1000),
      resolutionHz: Number((sampleRate / left.length).toFixed(3)),
      leftRms: rms(left),
      rightRms: rms(right),
      leftPeak: window.peakScan(left, 195, 213, 0.5, sampleRate),
      rightPeak: window.peakScan(right, 195, 213, 0.5, sampleRate),
    };
  });
  await page.click('#fqStop');
  await page.waitForTimeout(300);

  // 100-Hz-Differenz, ein Frame
  await page.fill('#fqCarrier', '200');
  await page.fill('#fqDelta', '100');
  await page.click('#fqBinauralPlay');
  await page.waitForTimeout(700);
  result.binaural100Hz = await page.evaluate(() => {
    const sampleRate = window.sampleRateOf() || 48000;
    const handle = window.EsoterikWelt.frequenz;
    const left = Array.from(handle.getAnalyserData('left'));
    const right = Array.from(handle.getAnalyserData('right'));
    return {
      sampleRate,
      state: handle.getState(),
      leftAt200: Number(window.goertzel(left, 200, sampleRate).toFixed(6)),
      leftAt300: Number(window.goertzel(left, 300, sampleRate).toFixed(6)),
      rightAt200: Number(window.goertzel(right, 200, sampleRate).toFixed(6)),
      rightAt300: Number(window.goertzel(right, 300, sampleRate).toFixed(6)),
    };
  });
  await page.click('#fqStop');
  await page.waitForTimeout(500);
  result.afterStop = await page.evaluate(() => {
    const handle = window.EsoterikWelt.frequenz;
    const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    return {
      status: handle.getState().status,
      leftRms: rms(Array.from(handle.getAnalyserData('left'))),
      rightRms: rms(Array.from(handle.getAnalyserData('right'))),
      statusText: document.getElementById('fqStatus').textContent,
    };
  });
  await browser.close();
}

/* --------------------------------------------------------- B) Tab-Wechsel */
{
  let browser = null;
  let mode = 'headed';
  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--window-position=-32000,-32000', '--window-size=1024,768', '--mute-audio'],
    });
  } catch (error) {
    mode = 'headless-fallback';
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqPlay', { timeout: 20000 });
  await page.click('#fqPlay');
  await page.waitForTimeout(900);
  const before = await page.evaluate(() => ({
    visibility: document.visibilityState,
    status: window.EsoterikWelt.frequenz.getState().status,
    statusText: document.getElementById('fqStatus').textContent,
  }));

  if (mode === 'headed') {
    const other = await context.newPage();
    await other.goto('about:blank');
    await other.bringToFront();
    await page.waitForTimeout(1500);
  } else {
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(600);
  }
  const during = await page.evaluate(() => {
    const handle = window.EsoterikWelt.frequenz;
    const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    return {
      visibility: document.visibilityState,
      status: handle.getState().status,
      statusText: document.getElementById('fqStatus').textContent,
      liveStatus: document.getElementById('fqLiveStatus').textContent,
      leftRms: rms(Array.from(handle.getAnalyserData('left'))),
      rightRms: rms(Array.from(handle.getAnalyserData('right'))),
    };
  });
  await page.bringToFront();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({
    visibility: document.visibilityState,
    status: window.EsoterikWelt.frequenz.getState().status,
    statusText: document.getElementById('fqStatus').textContent,
  }));
  result.tabSwitch = { mode, before, during, after };
  await browser.close();
}

fs.mkdirSync(outFile.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
process.exit(0);
