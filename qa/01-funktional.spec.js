/**
 * QA-Abnahme Frequenzlabor — funktionale Prüfungen (t_835bd1e9).
 *
 * Unabhängig von der Feature-Suite: eigene Selektoren, eigene Messroutinen,
 * eigene Toleranzen. Gemessen wird, was die Seite tatsächlich tut:
 *  - Realtime-Pfad: ein Init-Skript protokolliert jede AudioContext-Konstruktion
 *    und jeden Oszillator samt kommandierter Frequenz. Damit ist belegt, welche
 *    Frequenz die UI an die Engine übergibt.
 *  - Signalpfad: die Engine wird im dokumentierten Testmodus (ADR §4.8) mit
 *    einem echten OfflineAudioContext gerendert und die Ausgabe mit eigener
 *    Nulldurchgangs- und Goertzel-Analyse ausgewertet. Der AnalyserNode
 *    (fftSize 2048 ≈ 23,4 Hz Bin-Breite) wird bewusst NICHT als Messgerät
 *    verwendet.
 */
import { test, expect } from 'playwright/test';

const BASE = process.env.BASE_URL || `http://127.0.0.1:${process.env.QA_PORT || 3320}/Esoterik-Welt`;

// Playwrights WebKit-Build für Windows enthält keine Web-Audio-API
// (AudioContext/OfflineAudioContext fehlen). Audiofälle werden deshalb dort
// als "nicht prüfbar" übersprungen, nicht als Fehler gewertet. Echte Safari-
// und iOS-Prüfung bleibt ausdrücklich offen (siehe QA-Bericht, Restrisiko R-1).
const AUDIO_SKIP = 'Playwright-WebKit (Windows) hat keine Web-Audio-API – Audio nicht prüfbar.';

async function openNavArea(page, pageId) {
  const link = page.locator(`.nav-link[data-page="${pageId}"]`);
  if (!(await link.isVisible())) {
    await page.locator('#navToggle').click();
    await expect(page.locator('#navToggle')).toHaveAttribute('aria-expanded', 'true');
  }
  await link.click();
}

const TAP = () => {
  window.__qaContexts = [];
  window.__qaOscillators = [];
  const Orig = window.AudioContext;
  if (!Orig) return;
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
    const stop = osc.stop.bind(osc);
    osc.stop = function trackedStop(...stopArgs) {
      osc.__qaStopped = true;
      return stop(...stopArgs);
    };
    window.__qaOscillators.push(osc);
    return osc;
  };
};

const readState = (page) => page.evaluate(() => window.EsoterikWelt.frequenz.getState());
const readOscillators = (page) =>
  page.evaluate(() =>
    window.__qaOscillators.map((osc) => ({
      freq: osc.frequency.value,
      type: osc.type,
      contextState: osc.context.state,
      stopped: Boolean(osc.__qaStopped),
    }))
  );

function watchConsole(page) {
  const problems = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  return problems;
}

async function openHub(page) {
  await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
  await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
}

async function openLab(page) {
  await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  await expect(page.locator('#fqPlay')).toBeVisible();
}

/**
 * Rendert einen Ton über die echte Engine in einem echten OfflineAudioContext
 * und misst Frequenz, Spitzenpegel und RMS im stationären Fenster (15–85 %).
 * Rückgabe in Hz bzw. linearer Amplitude.
 */
async function renderTone(page, { freq, seconds = 1.5, gainDb, waveform }) {
  return page.evaluate(
    async ({ base, freq, seconds, gainDb, waveform }) => {
      const module = await import(`${base}/js/modules/frequenz-engine.js`);
      const sampleRate = 48000;
      const context = new OfflineAudioContext(2, Math.round(sampleRate * seconds), sampleRate);
      const engine = module.createFrequencyEngine({ audioContextFactory: () => context });
      if (typeof gainDb === 'number') engine.setGain(gainDb);
      if (waveform) engine.setWaveform(waveform);
      await engine.play(freq);
      const buffer = await context.startRendering();

      const analyse = (samples, expected) => {
        const from = Math.floor(sampleRate * 0.15);
        const to = Math.floor(sampleRate * 0.85);
        const window_ = samples.subarray(from, to);
        let mean = 0;
        for (let i = 0; i < window_.length; i += 1) mean += window_[i];
        mean /= window_.length;

        let peak = 0;
        let energy = 0;
        for (let i = 0; i < window_.length; i += 1) {
          const value = window_[i] - mean;
          peak = Math.max(peak, Math.abs(window_[i]));
          energy += value * value;
        }
        const rms = Math.sqrt(energy / window_.length);

        // Nulldurchgänge mit linearer Interpolation (sub-sample-genau).
        const crossings = [];
        for (let i = 1; i < window_.length; i += 1) {
          const a = window_[i - 1] - mean;
          const b = window_[i] - mean;
          if (a < 0 && b >= 0) crossings.push((i - 1 + -a / (b - a)) / sampleRate);
        }
        const zeroCrossHz =
          crossings.length > 1 ? (crossings.length - 1) / (crossings[crossings.length - 1] - crossings[0]) : 0;

        // Goertzel-Scan in 0,05-Hz-Schritten um die Sollfrequenz.
        const goertzel = (target) => {
          const coeff = 2 * Math.cos((2 * Math.PI * target) / sampleRate);
          let s0 = 0;
          let s1 = 0;
          let s2 = 0;
          for (let i = 0; i < window_.length; i += 1) {
            s0 = window_[i] - mean + coeff * s1 - s2;
            s2 = s1;
            s1 = s0;
          }
          return s1 * s1 + s2 * s2 - coeff * s1 * s2;
        };
        let bestHz = 0;
        let bestPower = -Infinity;
        for (let f = Math.max(1, expected - 8); f <= expected + 8; f += 0.05) {
          const power = goertzel(f);
          if (power > bestPower) {
            bestPower = power;
            bestHz = f;
          }
        }
        let peakAll = 0;
        for (let i = 0; i < samples.length; i += 1) peakAll = Math.max(peakAll, Math.abs(samples[i]));
        return { zeroCrossHz, goertzelHz: bestHz, peak, peakAll, rms, crossings: crossings.length };
      };

      return {
        sampleRate,
        length: buffer.length,
        durationS: buffer.duration,
        left: analyse(buffer.getChannelData(0), freq),
        right: analyse(buffer.getChannelData(1), freq),
      };
    },
    { base: BASE, freq, seconds, gainDb, waveform }
  );
}

test.describe('Frequenzlabor — Wiedergabe und Autoplay', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  test('kein AudioContext vor Interaktion, Start/Stopp korrekt, idempotentes Stopp', async ({ page }) => {
    const problems = watchConsole(page);
    await page.addInitScript(TAP);
    await openLab(page);

    expect(
      await page.evaluate(() => window.__qaContexts.length),
      'Vor jeder Interaktion darf kein AudioContext existieren'
    ).toBe(0);
    expect((await readState(page)).status).toBe('idle');

    await page.locator('#fqPlay').click();
    await expect.poll(async () => (await readState(page)).status, { timeout: 10000 }).toBe('running');

    const afterStart = await readState(page);
    expect(afterStart.freqHz).toBe(440);
    expect(afterStart.gainDb).toBe(-20);
    expect(await page.evaluate(() => window.__qaContexts.length)).toBe(1);

    const oscillators = await readOscillators(page);
    expect(oscillators.length, 'genau eine Stimme je Start').toBe(1);
    expect(oscillators[0].freq).toBeCloseTo(440, 3);
    expect(oscillators[0].type).toBe('sine');
    expect(oscillators[0].contextState).toBe('running');

    await page.locator('#fqStop').click();
    await expect.poll(async () => (await readState(page)).status, { timeout: 10000 }).toBe('idle');

    // Ein zweiter Stoppversuch ist nicht möglich: der Knopf ist deaktiviert,
    // nicht etwa ein stiller Fehlschlag.
    await expect(page.locator('#fqStop')).toBeDisabled();
    expect((await readState(page)).status).toBe('idle');
    expect(problems, 'keine Konsolen- oder Seitenfehler').toEqual([]);
  });

  test('erneutes Starten nach Stopp nutzt keinen zweiten Oszillatorsatz', async ({ page }) => {
    await page.addInitScript(TAP);
    await openLab(page);
    await page.locator('#fqPlay').click();
    await expect.poll(async () => (await readState(page)).status).toBe('running');
    await page.locator('#fqStop').click();
    await expect.poll(async () => (await readState(page)).status).toBe('idle');
    await page.locator('#fqPlay').click();
    await expect.poll(async () => (await readState(page)).status).toBe('running');
    const oscillators = await readOscillators(page);
    expect(oscillators.filter((osc) => !osc.stopped).length, 'genau ein aktiver Oszillatorsatz').toBe(1);
    expect(oscillators.length, 'der alte Satz wurde nicht neu aufgebaut').toBe(2);
    expect(oscillators[0].stopped, 'der erste Satz ist explizit gestoppt').toBe(true);
    expect(oscillators[1].freq).toBeCloseTo(440, 3);
  });

  test('blockierter AudioContext erzeugt eine sichtbare, wiederholbare Fehlermeldung', async ({ page }) => {
    await page.addInitScript(() => {
      const Base = window.AudioContext;
      if (!Base) return;
      // Zustand "suspended" erzwingen, damit die Engine resume() versucht,
      // und resume() wie eine Autoplay-Sperre ablehnen.
      let proto = Base.prototype;
      while (proto && !Object.getOwnPropertyDescriptor(proto, 'state')) proto = Object.getPrototypeOf(proto);
      if (proto) {
        Object.defineProperty(proto, 'state', { configurable: true, get: () => 'suspended' });
      }
      Base.prototype.resume = function blockedResume() {
        return Promise.reject(new DOMException('Autoplay blocked (QA simulation)', 'NotAllowedError'));
      };
    });
    await openLab(page);
    await page.locator('#fqPlay').click();

    const error = page.locator('#fqError');
    await expect(error).toBeVisible({ timeout: 10000 });
    await expect(error).toHaveAttribute('role', 'alert');
    const text = await error.textContent();
    expect(text.trim().length, 'Fehlertext darf nicht leer sein').toBeGreaterThan(5);
    expect((await readState(page)).status).toBe('error');

    // Wiederholbar: erneuter Klick zeigt die Meldung erneut.
    await page.locator('#fqPlay').click();
    await expect(error).toBeVisible();
  });
});

test.describe('Frequenzlabor — Signalgenauigkeit', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  const CASES = [
    { freq: 20, seconds: 3 },
    { freq: 100, seconds: 2 },
    { freq: 432, seconds: 2 },
    { freq: 440, seconds: 2 },
    { freq: 528, seconds: 2 },
    { freq: 1000, seconds: 2 },
    { freq: 5000, seconds: 2 },
  ];

  for (const testCase of CASES) {
    test(`Sinus ${testCase.freq} Hz liegt innerhalb ±1 Hz`, async ({ page }) => {
      await openLab(page); // stellt den Seitenkontext für das dynamische Importieren her
      const result = await renderTone(page, testCase);
      expect(result.length).toBe(Math.round(48000 * testCase.seconds));

      const measured = result.left.zeroCrossHz;
      expect(
        Math.abs(measured - testCase.freq),
        `Nulldurchgangsmessung: ${measured.toFixed(3)} Hz statt ${testCase.freq} Hz`
      ).toBeLessThanOrEqual(1);

      expect(
        Math.abs(result.left.goertzelHz - testCase.freq),
        `Goertzel-Peak: ${result.left.goertzelHz} Hz statt ${testCase.freq} Hz`
      ).toBeLessThanOrEqual(1);

      // Startpegel −20 dBFS ⇒ Spitzenamplitude 0,1 (±0,005).
      expect(Math.abs(result.left.peak - 0.1)).toBeLessThan(0.006);
    });
  }

  test('Realtime-Pfad kommandiert die in der UI gewählte Frequenz', async ({ page }) => {
    await page.addInitScript(TAP);
    await openLab(page);
    await page.locator('#fqFreqNumber').fill('528');
    await page.locator('#fqFreqNumber').blur();
    await expect(page.locator('#fqFreqNumber')).toHaveValue('528');
    await page.locator('#fqPlay').click();
    await expect.poll(async () => (await readState(page)).status).toBe('running');
    const state = await readState(page);
    expect(state.freqHz).toBe(528);
    const oscillators = await readOscillators(page);
    expect(oscillators[oscillators.length - 1].freq).toBeCloseTo(528, 3);
  });
});

test.describe('Frequenzlabor — Lautstärke-Deckel', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  test('Engine klemmt auf −6 dBFS und der Offline-Pegel bleibt darunter', async ({ page }) => {
    await openLab(page);
    const result = await renderTone(page, { freq: 440, seconds: 1.5, gainDb: 12 });
    expect(result.left.peakAll).toBeLessThanOrEqual(0.5015);
    expect(result.left.peakAll).toBeGreaterThan(0.49);
  });

  test('UI-Slider endet bei −6 dBFS, Anzeige nennt den Deckel, Startpegel −20 dBFS', async ({ page }) => {
    await openLab(page);
    await expect(page.locator('#fqGainRange')).toHaveAttribute('max', '-6');
    await expect(page.locator('#fqGainRange')).toHaveAttribute('min', '-60');
    await expect(page.locator('.fq-gain-cap')).toContainText('−6');
    await expect(page.locator('#fqGainReadout')).toContainText('−20');
    // Slider bis Anschlag: Engine-Zustand darf nicht über −6 gehen.
    await page.locator('#fqGainRange').fill('-6');
    await page.locator('#fqGainRange').dispatchEvent('input');
    await page.locator('#fqGainRange').dispatchEvent('change');
    await expect(page.locator('#fqGainReadout')).toContainText('−6');
  });

  test('Startpegel und Deckel gelten auch nach einem Preset-Start', async ({ page }) => {
    await page.addInitScript(TAP);
    await openLab(page);
    await page.locator('#fqPresetSelect').selectOption('solfeggio-528');
    await page.locator('#fqPresetPlay').click();
    await expect.poll(async () => (await readState(page)).status).toBe('running');
    const state = await readState(page);
    expect(state.gainDb).toBeLessThanOrEqual(-6);
    expect(state.gainDb).toBeGreaterThanOrEqual(-60);
  });
});

test.describe('Frequenzlabor — Sweep', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  test('Sweep läuft die eingestellte Dauer, endet am Ziel und meldet das', async ({ page }) => {
    await openLab(page);
    await page.locator('#fqSweepFrom').fill('200');
    await page.locator('#fqSweepTo').fill('800');
    await page.locator('#fqSweepSeconds').fill('2');
    const started = Date.now();
    await page.locator('#fqSweepStart').click();
    await expect(page.locator('#fqSweepProgress')).toBeVisible();
    await page.waitForTimeout(700);
    const midProgress = Number(await page.locator('#fqSweepProgress').getAttribute('aria-valuenow'));
    expect(midProgress, 'Fortschritt läuft während des Sweeps').toBeGreaterThan(0);
    expect(midProgress).toBeLessThan(100);
    // Der Sweep ist beendet, wenn die Engine den Sweep-Zustand freigibt.
    await expect.poll(async () => (await readState(page)).sweep, { timeout: 15000 }).toBe(null);
    const elapsed = Date.now() - started;
    expect(elapsed, `Sweep dauerte ${elapsed} ms statt ~2000 ms`).toBeGreaterThan(1400);
    expect(elapsed).toBeLessThan(3200);
    // Design: der Ton läuft nach dem Sweep am Ziel weiter (kein stiller Abriss).
    const state = await readState(page);
    expect(state.status).toBe('running');
    expect(state.freqHz).toBe(800);
    await expect(page.locator('#fqStatus')).toContainText('Sweep beendet');
    await expect(page.locator('#fqSweepProgress')).toBeHidden();
  });

  test('Sweep-Abbruch beendet den Sweep und meldet den Abbruch', async ({ page }) => {
    await openLab(page);
    await page.locator('#fqSweepSeconds').fill('8');
    await page.locator('#fqSweepStart').click();
    await expect.poll(async () => (await readState(page)).sweep, { timeout: 10000 }).not.toBeNull();
    await expect(page.locator('#fqSweepCancel')).toBeEnabled();
    await page.locator('#fqSweepCancel').click();
    await expect.poll(async () => (await readState(page)).sweep, { timeout: 10000 }).toBe(null);
    await expect(page.locator('#fqStatus')).toContainText('Sweep abgebrochen');
    await expect(page.locator('#fqSweepCancel')).toBeDisabled();
    // Kein Sweep mehr aktiv: der Ton bleibt als stehender Ton stehen.
    expect((await readState(page)).status).toBe('running');
  });
});

test.describe('Frequenzlabor — Presets und Bibliothek', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  test('Bibliotheks-Preset startet exakt seine Frequenz', async ({ page }) => {
    await page.addInitScript(TAP);
    await openHub(page);
    const button = page.locator('[data-play-id="solfeggio-528"]');
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect.poll(async () => (await readState(page)).status, { timeout: 10000 }).toBe('running');
    expect((await readState(page)).freqHz).toBe(528);
    const oscillators = await readOscillators(page);
    expect(oscillators[oscillators.length - 1].freq).toBeCloseTo(528, 3);
    // Ton für den nächsten Testfall beenden (gleiche Seite, kein Neuladen).
    await openNavArea(page, 'home');
    await expect.poll(async () => (await readState(page)).status).toBe('idle');
  });

  test('Labor-Preset-Auswahl listet nur hörbare Einträge und spielt die gewählte Frequenz', async ({ page }) => {
    await openLab(page);
    const options = await page
      .locator('#fqPresetSelect option')
      .evaluateAll((nodes) => nodes.map((node) => ({ value: node.value, text: node.textContent })));
    expect(options.length, 'hörbare Presets vorhanden').toBeGreaterThanOrEqual(9);
    for (const option of options) {
      expect(option.text).toMatch(/—.*Hz.*\(/);
    }
    const values = options.map((option) => option.value);
    expect(values).toContain('stimmton-432');
    expect(values).toContain('kammerton-440');
    // Schumann 7,83 Hz ist nicht hörbar und darf nicht als Preset erscheinen.
    expect(values).not.toContain('schumann-783');

    await page.addInitScript(TAP);
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#fqPlay')).toBeVisible();
    await page.locator('#fqPresetSelect').selectOption('kammerton-440');
    await page.locator('#fqPresetPlay').click();
    await expect.poll(async () => (await readState(page)).status).toBe('running');
    expect((await readState(page)).freqHz).toBe(440);
  });

  test('nicht abspielbare Einträge haben keinen Abspielknopf, aber einen Hinweis', async ({ page }) => {
    await openHub(page);
    const schumann = page.locator('#fqLibrary .fq-entry', { hasText: 'Schumann' }).first();
    await expect(schumann).toBeVisible();
    expect(await schumann.locator('button').count()).toBe(0);
    await expect(schumann.locator('.fq-entry-none')).toContainText('Nicht abspielbar');
  });
});

test.describe('Frequenzlabor — Quellen und Disclaimer', () => {
  test('Quellenlinks sind https, extern abgesichert und vollständig', async ({ page }) => {
    await openHub(page);
    const links = await page.locator('#fqLibrary .fq-source-link').evaluateAll((nodes) =>
      nodes.map((node) => ({
        href: node.getAttribute('href'),
        rel: node.getAttribute('rel'),
        target: node.getAttribute('target'),
        text: node.textContent.trim(),
      }))
    );
    expect(links.length, 'mindestens ein Quellenlink je belegtem Eintrag').toBeGreaterThanOrEqual(25);
    for (const link of links) {
      expect(link.href, `ungültige Quelle: ${link.href}`).toMatch(/^https:\/\//);
      expect(link.rel).toContain('noopener');
      expect(link.rel).toContain('noreferrer');
      expect(link.target).toBe('_blank');
      expect(link.text.length).toBeGreaterThan(0);
    }
    await expect(page.locator('#fq-quellen')).toBeVisible();
    await expect(page.locator('#fq-quellen a[href="docs/frequenz-quellen.md"]')).toBeVisible();
    await expect(page.locator('a[href="data/frequencies.json"]')).toBeVisible();
  });

  test('Disclaimer ist auf Hub und Labor sichtbar und nennt kein Medizinprodukt', async ({ page }) => {
    await openHub(page);
    await expect(page.locator('#fqDisclaimerKurz')).toBeVisible();
    await expect(page.locator('#fqDisclaimerKurz')).toContainText('kein Medizinprodukt');
    await expect(page.locator('#fqDisclaimerLang')).toBeVisible();
    await expect(page.locator('#fqDisclaimerLang')).toContainText('kein Medizinprodukt');
    await expect(page.locator('#fq-hinweis')).toContainText('kein Medizinprodukt');

    await openLab(page);
    await expect(page.locator('#fqDisclaimerKurz')).toBeVisible();
    await expect(page.locator('#fqDisclaimerKurz')).toContainText('kein Medizinprodukt');
    await expect(page.locator('.fq-controls')).toContainText('Gehör schützen');
    await expect(page.locator('.fq-note', { hasText: '20 kHz' }).first()).toBeVisible();
  });
});

test.describe('Frequenzlabor — Navigation', () => {
  test('Hauptnavigation öffnet den Bereich, Alias wird normalisiert', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await openNavArea(page, 'frequenzen');
    await expect(page.locator('#frequenzen')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#frequenzen');
    await expect(page.locator('#frequenzen h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('frequenzen-title');

    await page.goto(`${BASE}/#frequenzlabor`, { waitUntil: 'load' });
    await expect(page.locator('#fqPlay')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#frequenzen/labor');
    expect(problems).toEqual([]);
  });

  test('Browser-Zurück und -Vorwärts stellen die Ansicht wieder her', async ({ page }) => {
    await openHub(page);
    await page.locator('a[href="#frequenzen/labor"]').first().click();
    await expect(page.locator('#fqPlay')).toBeVisible();
    await page.goBack();
    await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
    await page.goForward();
    await expect(page.locator('#fqPlay')).toBeVisible();
  });

  test('Audio stoppt beim Verlassen der Seite', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
    await openLab(page);
    await page.locator('#fqPlay').click();
    await expect.poll(async () => (await readState(page)).status).toBe('running');
    await openNavArea(page, 'home');
    await expect(page.locator('#home')).toBeVisible();
    await expect.poll(async () => (await readState(page)).status, { timeout: 10000 }).toBe('idle');
  });

  test('pagehide stoppt laufendes Audio', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
    await openLab(page);
    await page.locator('#fqPlay').click();
    await expect.poll(async () => (await readState(page)).status).toBe('running');
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    await expect.poll(async () => (await readState(page)).status).toBe('idle');
  });
});

test.describe('Frequenzlabor — Ladeverhalten', () => {
  test('Engine wird erst mit der Kategorie geladen', async ({ page }) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    expect(
      requests.filter((url) => url.includes('frequenz-engine.js')).length,
      'vor der Navigation kein Engine-Request'
    ).toBe(0);
    await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
    await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
    expect(
      requests.filter((url) => url.includes('frequenz-engine.js')).length,
      'nach der Navigation genau ein Engine-Request'
    ).toBeGreaterThanOrEqual(1);
  });
});
