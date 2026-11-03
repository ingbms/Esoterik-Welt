/**
 * Sonde 2 (Ticket t_4a8106de):
 *  A) WebKit ohne Web-Audio: Was sieht der Nutzer nach "Ton starten"?
 *  B) Status-Timeline für Sweep-Start/-Ende (wird die Startansage sichtbar?
 *     oder überschreibt das Ende sie?).
 *  C) Binaurale Kanaltrennung, gemessen im echten Audio-Graph (Goertzel auf
 *     linkem und rechtem Analysator-Kanal).
 *
 * Aufruf: node evidence/t_4a8106de/probes/probe2.mjs <baseUrl> <outFile>
 */
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3333/Esoterik-Welt';
const outFile = process.argv[3] || 'evidence/t_4a8106de/probe2.json';
const result = {};

/* ---------------------------------------------------------------- A) WebKit */
{
  const browser = await webkit.launch({ headless: true });
  const page = await browser.newPage();
  const consoleMessages = [];
  page.on('console', (m) => consoleMessages.push(`${m.type()}: ${m.text()}`));
  await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqFreqRange', { timeout: 20000 });
  const before = await page.evaluate(() => ({
    AudioContext: typeof window.AudioContext,
    webkitAudioContext: typeof window.webkitAudioContext,
    playDisabled: document.getElementById('fqPlay').disabled,
    stopDisabled: document.getElementById('fqStop').disabled,
    status: document.getElementById('fqStatus').textContent,
  }));
  await page.click('#fqPlay');
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({
    status: document.getElementById('fqStatus').textContent,
    error: document.getElementById('fqError').textContent,
    errorHidden: document.getElementById('fqError').hidden,
    notice: document.getElementById('fqNotice').textContent,
    noticeHidden: document.getElementById('fqNotice').hidden,
    playDisabled: document.getElementById('fqPlay').disabled,
    stopDisabled: document.getElementById('fqStop').disabled,
    liveStatus: document.getElementById('fqLiveStatus').textContent,
    engineState: window.EsoterikWelt && window.EsoterikWelt.frequenz ? window.EsoterikWelt.frequenz.getState() : null,
  }));
  result.webkitNoWebAudio = { browserVersion: browser.version(), before, after, console: consoleMessages };
  await browser.close();
}

/* ------------------------------------------- B) Sweep-Status-Timeline (Chrom) */
{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqSweepStart', { timeout: 20000 });
  await page.evaluate(() => {
    window.__statusLog = [];
    const el = document.getElementById('fqStatus');
    const push = () => window.__statusLog.push({ t: Math.round(performance.now()), text: el.textContent });
    push();
    new MutationObserver(push).observe(el, { childList: true, characterData: true, subtree: true });
  });
  await page.fill('#fqSweepSeconds', '3');
  await page.click('#fqSweepStart');
  await page.waitForTimeout(4200);
  const log = await page.evaluate(() => window.__statusLog);
  const progress = await page.evaluate(() => {
    const el = document.getElementById('fqSweepProgress');
    return { valueNow: el.getAttribute('aria-valuenow'), wrapHidden: document.getElementById('fqSweepWrap').hidden };
  });
  result.sweepTimeline = { statusTimeline: log, progressAfterEnd: progress };
  await browser.close();
}

/* ---------------------------------------------- C) Binaurale Kanaltrennung */
{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqBinauralPlay', { timeout: 20000 });
  await page.evaluate(() => {
    window.sampleRateOf = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const rate = ctx.sampleRate;
        ctx.close();
        return rate;
      } catch (error) {
        return null;
      }
    };
    window.goertzel = (data, freq, sampleRate) => {
      const k = Math.round((data.length * freq) / sampleRate);
      const w = (2 * Math.PI * k) / data.length;
      const cw = Math.cos(w);
      const coeff = 2 * cw;
      let s0 = 0;
      let s1 = 0;
      let s2 = 0;
      for (let i = 0; i < data.length; i += 1) {
        s0 = data[i] + coeff * s1 - s2;
        s2 = s1;
        s1 = s0;
      }
      const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
      return Math.sqrt(Math.max(power, 0)) / data.length;
    };
  });
  await page.fill('#fqCarrier', '200');
  await page.fill('#fqDelta', '8');
  await page.click('#fqBinauralPlay');
  await page.waitForTimeout(900);
  const measurement = await page.evaluate(() => {
    const sampleRate = window.sampleRateOf() || 48000;
    const handle = window.EsoterikWelt.frequenz;
    const left = Array.from(handle.getAnalyserData('left'));
    const right = Array.from(handle.getAnalyserData('right'));
    const mix = Array.from(handle.getAnalyserData('mix'));
    const rms = (arr) => Math.sqrt(arr.reduce((acc, v) => acc + v * v, 0) / arr.length);
    const scan = (arr) => {
      const out = [];
      for (let f = 190; f <= 220; f += 0.5) out.push({ f, amp: window.goertzel(arr, f, sampleRate) });
      out.sort((a, b) => b.amp - a.amp);
      return out.slice(0, 3).map((x) => ({ hz: x.f, amp: Number(x.amp.toFixed(6)) }));
    };
    const state = handle.getState();
    return {
      engineState: state,
      sampleRate,
      leftRms: rms(left),
      rightRms: rms(right),
      mixRms: rms(mix),
      leftPeakScan: scan(left),
      rightPeakScan: scan(right),
      left200: window.goertzel(left, 200, sampleRate),
      left208: window.goertzel(left, 208, sampleRate),
      right200: window.goertzel(right, 200, sampleRate),
      right208: window.goertzel(right, 208, sampleRate),
      // Korrelation als Maß für "identische Kanäle"
      correlation: (() => {
        let num = 0;
        let dl = 0;
        let dr = 0;
        for (let i = 0; i < left.length; i += 1) {
          num += left[i] * right[i];
          dl += left[i] * left[i];
          dr += right[i] * right[i];
        }
        return num / Math.sqrt(dl * dr || 1);
      })(),
      frameMs: (left.length / sampleRate) * 1000,
    };
  });
  result.binaural = measurement;
  await page.click('#fqStop');
  await page.waitForTimeout(600);
  result.binauralAfterStop = await page.evaluate(() => {
    const handle = window.EsoterikWelt.frequenz;
    const rms = (arr) => Math.sqrt(arr.reduce((acc, v) => acc + v * v, 0) / arr.length);
    return {
      state: handle.getState().status,
      leftRms: rms(Array.from(handle.getAnalyserData('left'))),
      rightRms: rms(Array.from(handle.getAnalyserData('right'))),
    };
  });
  await browser.close();
}

/* ----------------------------------------- D) Pegeldeckel bei voller Lautstärke */
{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fqGainRange', { timeout: 20000 });
  // Deckel setzen: Slider auf Maximum (-6 dB) per Tastatur (End)
  await page.focus('#fqGainRange');
  await page.keyboard.press('End');
  await page.waitForTimeout(200);
  const gainUi = await page.evaluate(() => ({
    value: document.getElementById('fqGainRange').value,
    readout: document.getElementById('fqGainReadout').textContent,
    capLabel: document.querySelector('.fq-gain-cap').textContent,
  }));
  await page.click('#fqPlay');
  await page.waitForTimeout(900);
  const peak = await page.evaluate(() => {
    const handle = window.EsoterikWelt.frequenz;
    const data = Array.from(handle.getAnalyserData('mix'));
    const max = data.reduce((acc, v) => Math.max(acc, Math.abs(v)), 0);
    return { engineState: handle.getState(), peak: max, dbfs: 20 * Math.log10(max) };
  });
  result.levelCap = { gainUi, peak };
  await browser.close();
}

fs.mkdirSync(outFile.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
process.exit(0);
