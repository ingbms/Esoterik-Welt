/**
 * Unabhängige Messreihe für die QA-Abnahme (t_835bd1e9).
 * Läuft in Chromium, Firefox und WebKit gegen einen bereits laufenden Build.
 *
 * Aufruf: QA_BASE=http://127.0.0.1:3321/Esoterik-Welt node evidence/t_835bd1e9/scripts/measure.cjs
 * Ergebnis: evidence/t_835bd1e9/measurements.json + Screenshots.
 */
const fs = require('fs');
const path = require('path');
const { chromium, firefox, webkit } = require('playwright');

const BASE = process.env.QA_BASE || 'http://127.0.0.1:3321/Esoterik-Welt';
const OUT = path.join(__dirname, '..');
const results = { generatedAt: new Date().toISOString(), base: BASE, browsers: {} };

const RENDER = async ({ base, freq, seconds, gainDb }) => {
  const module = await import(`${base}/js/modules/frequenz-engine.js`);
  const sampleRate = 48000;
  const context = new OfflineAudioContext(2, Math.round(sampleRate * seconds), sampleRate);
  const engine = module.createFrequencyEngine({ audioContextFactory: () => context });
  if (typeof gainDb === 'number') engine.setGain(gainDb);
  await engine.play(freq);
  const buffer = await context.startRendering();
  const samples = buffer.getChannelData(0);
  let mean = 0;
  for (let i = 0; i < samples.length; i += 1) mean += samples[i];
  mean /= samples.length;
  const from = Math.floor(sampleRate * 0.15);
  const to = Math.floor(sampleRate * 0.85);
  const crossings = [];
  for (let i = from + 1; i < to; i += 1) {
    const a = samples[i - 1] - mean;
    const b = samples[i] - mean;
    if (a < 0 && b >= 0) crossings.push((i - 1 + -a / (b - a)) / sampleRate);
  }
  const zeroCrossHz = (crossings.length - 1) / (crossings[crossings.length - 1] - crossings[0]);
  const goertzel = (target) => {
    const coeff = 2 * Math.cos((2 * Math.PI * target) / sampleRate);
    let s0 = 0;
    let s1 = 0;
    let s2 = 0;
    for (let i = from; i < to; i += 1) {
      s0 = samples[i] - mean + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    return s1 * s1 + s2 * s2 - coeff * s1 * s2;
  };
  let best = { hz: 0, power: -Infinity };
  for (let f = freq - 8; f <= freq + 8; f += 0.05) {
    const power = goertzel(f);
    if (power > best.power) best = { hz: f, power };
  }
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i]));
    sum += samples[i] * samples[i];
  }
  return {
    requestedHz: freq,
    zeroCrossHz: Number(zeroCrossHz.toFixed(4)),
    errorHz: Number((zeroCrossHz - freq).toFixed(4)),
    goertzelHz: Number(best.hz.toFixed(2)),
    peakAmplitude: Number(peak.toFixed(5)),
    rms: Number(Math.sqrt(sum / samples.length).toFixed(5)),
    seconds,
  };
};

const CONTRAST = (selectors) => {
  const parse = (value) => {
    const match = /rgba?\(([^)]+)\)/.exec(value || '');
    if (!match) return null;
    const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const c = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
  };
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  return selectors.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) return { selector, error: 'nicht gefunden' };
    const style = getComputedStyle(element);
    const layers = [];
    let node = element;
    while (node) {
      const color = parse(getComputedStyle(node).backgroundColor);
      if (color && color.a > 0) {
        layers.push(color);
        if (color.a === 1) break;
      }
      node = node.parentElement;
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i -= 1) bg = over(layers[i], bg);
    const fg = over(parse(style.color), bg);
    const l1 = lum(fg);
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(style.fontSize);
    const big = size >= 24 || (Number(style.fontWeight) >= 700 && size >= 18.66);
    return {
      selector,
      ratio: Number(ratio.toFixed(2)),
      fontSizePx: size,
      required: big ? 3 : 4.5,
      text: (element.textContent || '').trim().slice(0, 30),
    };
  });
};

async function runBrowser(name, type) {
  const browser = await type.launch();
  const data = { engine: name, browserVersion: browser.version(), checks: {}, frequencies: [], consoleProblems: [] };
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => data.consoleProblems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') data.consoleProblems.push(`console: ${message.text()}`);
  });

  // Autoplay-Zähler
  await page.addInitScript(() => {
    window.__qaContexts = [];
    const Orig = window.AudioContext;
    if (!Orig) return;
    window.AudioContext = new Proxy(Orig, {
      construct(target, args) {
        const ctx = Reflect.construct(target, args);
        window.__qaContexts.push(ctx);
        return ctx;
      },
    });
  });

  await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
  await page.locator('#fqLibrary .fq-entry').first().waitFor();
  data.checks.contextsBeforeInteraction = await page.evaluate(() => window.__qaContexts.length);
  data.checks.libraryEntries = await page.locator('#fqLibrary .fq-entry').count();
  data.checks.sourceLinks = await page.locator('#fqLibrary .fq-source-link').count();
  data.checks.badges = await page.locator('.fq-badge').count();
  data.checks.disclaimerHub = (await page.locator('#fqDisclaimerKurz').textContent()).trim();
  data.contrastHub = await page.evaluate(CONTRAST, [
    '#frequenzen-title',
    '.fq-entry-title',
    '.fq-entry-desc',
    '.fq-badge',
    '.fq-source-link',
    '#fqDisclaimerLang',
  ]);
  await page.screenshot({ path: path.join(OUT, `screens/${name}-hub-1440.png`), fullPage: false });

  // Labor
  await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  await page.locator('#fqPlay').waitFor();
  data.checks.contextsAfterLoad = await page.evaluate(() => window.__qaContexts.length);
  const audioSupported = await page.evaluate(
    () => typeof window.AudioContext === 'function' && typeof window.OfflineAudioContext === 'function'
  );
  data.checks.audioSupported = audioSupported;
  if (!audioSupported) data.checks.audio = 'nicht verfügbar (Browser-Build ohne Web-Audio-API)';
  data.contrastLab = await page.evaluate(CONTRAST, [
    '.fq-panel-title',
    '.fq-note',
    '.fq-gain-cap',
    '#fqGainReadout',
    '#fqStatus',
    '.btn-primary',
  ]);
  await page.screenshot({ path: path.join(OUT, `screens/${name}-lab-1440.png`), fullPage: false });

  if (audioSupported) {
    // Start/Stop
    await page.locator('#fqPlay').click();
    await page.waitForFunction(() => window.EsoterikWelt.frequenz.getState().status === 'running', null, { timeout: 15000 });
    data.checks.playState = await page.evaluate(() => window.EsoterikWelt.frequenz.getState());
    data.checks.contextsAfterPlay = await page.evaluate(() => window.__qaContexts.length);
    await page.waitForTimeout(400);
    data.checks.analyserPeak = await page.evaluate(() => {
      const spectrum = window.EsoterikWelt.frequenz.getAnalyserData('mix');
      let peak = 0;
      for (let i = 0; i < spectrum.length; i += 1) peak = Math.max(peak, Math.abs(spectrum[i]));
      return Number(peak.toFixed(4));
    });
    await page.locator('#fqStop').click();
    await page.waitForFunction(() => window.EsoterikWelt.frequenz.getState().status === 'idle', null, { timeout: 15000 });
    data.checks.stopState = await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status);
    data.checks.stopDisabledWhenIdle = await page.locator('#fqStop').isDisabled();

    // Sweep-Laufzeit
    await page.locator('#fqSweepFrom').fill('200');
    await page.locator('#fqSweepTo').fill('800');
    await page.locator('#fqSweepSeconds').fill('1.5');
    const t0 = Date.now();
    await page.locator('#fqSweepStart').click();
    await page.waitForFunction(() => window.EsoterikWelt.frequenz.getState().sweep === null, null, { timeout: 20000 });
    data.checks.sweepElapsedMs = Date.now() - t0;
    data.checks.sweepEndHz = await page.evaluate(() => window.EsoterikWelt.frequenz.getState().freqHz);
    await page.locator('#fqStop').click();
    await page.waitForTimeout(300);

    // Offline-Signal (unabhängige Messung, echter OfflineAudioContext)
    for (const freq of [20, 100, 440, 528, 1000, 5000]) {
      const seconds = freq <= 20 ? 3 : 2;
      const measurement = await page.evaluate(RENDER, { base: BASE, freq, seconds });
      data.frequencies.push(measurement);
    }
    data.checks.capPeak = (await page.evaluate(RENDER, { base: BASE, freq: 880, seconds: 1.5, gainDb: 12 })).peakAmplitude;
  }

  // Reduzierte Bewegung
  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const reducedPage = await reduced.newPage();
  await reducedPage.addInitScript(() => {
    window.__qaRaf = 0;
    const original = window.requestAnimationFrame;
    window.requestAnimationFrame = function counted(cb) {
      window.__qaRaf += 1;
      return original.call(this, cb);
    };
  });
  await reducedPage.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  if (audioSupported) {
    await reducedPage.locator('#fqPlay').click();
    await reducedPage.waitForFunction(() => window.EsoterikWelt.frequenz.getState().status === 'running');
    await reducedPage.waitForTimeout(500);
  }
  const rafBefore = await reducedPage.evaluate(() => window.__qaRaf);
  await reducedPage.waitForTimeout(1000);
  data.checks.reducedMotion = await reducedPage.evaluate((before) => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    rafPerSecond: window.__qaRaf - before,
    noteVisible: !document.getElementById('fqMotionNote').hidden,
  }), rafBefore);
  await reducedPage.screenshot({ path: path.join(OUT, `screens/${name}-lab-reduced-motion.png`) });
  await reduced.close();

  // Mobiler Viewport
  const mobile = await browser.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: name === 'chromium' });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  await mobilePage.locator('#fqPlay').waitFor();
  data.checks.mobile = await mobilePage.evaluate(() => {
    const selectors = ['#fqPlay', '#fqStop', '#fqSweepStart', '#fqPresetPlay', '#fqGainRange'];
    return {
      overflowPx: document.documentElement.scrollWidth - window.innerWidth,
      targets: selectors.map((selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { selector, h: Math.round(rect.height), w: Math.round(rect.width) };
      }),
    };
  });
  if (audioSupported) {
    await mobilePage.locator('#fqPlay').tap();
    await mobilePage.waitForFunction(() => window.EsoterikWelt.frequenz.getState().status === 'running', null, { timeout: 15000 });
    data.checks.mobileTapPlay = await mobilePage.evaluate(() => window.EsoterikWelt.frequenz.getState().status);
  }
  await mobilePage.screenshot({ path: path.join(OUT, `screens/${name}-lab-360.png`), fullPage: false });
  await mobile.close();

  // Tastaturumlauf
  await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  await page.locator('#fqPlay').waitFor();
  const stops = [];
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press('Tab');
    stops.push(await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
  }
  data.checks.tabStops = stops;

  await browser.close();
  return data;
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'screens'), { recursive: true });
  for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
    try {
      results.browsers[name] = await runBrowser(name, type);
      console.log(`${name}: ok`);
    } catch (error) {
      results.browsers[name] = { engine: name, error: error.message.split('\n')[0] };
      console.log(`${name}: FEHLER ${error.message.split('\n')[0]}`);
    }
  }
  fs.writeFileSync(path.join(OUT, 'measurements.json'), JSON.stringify(results, null, 2));
  console.log('geschrieben:', path.join(OUT, 'measurements.json'));
})();
