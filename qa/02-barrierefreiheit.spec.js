/**
 * QA-Abnahme Frequenzlabor — Barrierefreiheit, Kontrast, mobile Ansicht.
 * Messungen laufen im echten DOM (computed styles, Accessibility-API), nicht
 * gegen Behauptungen aus der Umsetzungsdoku.
 */
import { test, expect } from 'playwright/test';

const BASE = process.env.BASE_URL || `http://127.0.0.1:${process.env.QA_PORT || 3320}/Esoterik-Welt`;
const AUDIO_SKIP = 'Playwright-WebKit (Windows) hat keine Web-Audio-API – Audio nicht prüfbar.';

const CONTRAST_HELPER = () => {
  const parse = (value) => {
    const match = /rgba?\(([^)]+)\)/.exec(value || '');
    if (!match) return null;
    const parts = match[1]
      .split(/[ ,/]+/)
      .filter(Boolean)
      .map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const luminance = ({ r, g, b }) => {
    const channel = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const composite = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const background = (element) => {
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
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i -= 1) base = composite(layers[i], base);
    return base;
  };
  window.__qaContrast = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return { selector, error: 'nicht gefunden' };
    const style = getComputedStyle(element);
    const fg = parse(style.color);
    const bg = background(element);
    const fgOver = composite(fg, bg);
    const l1 = luminance(fgOver);
    const l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const fontSize = parseFloat(style.fontSize);
    const bold = Number(style.fontWeight) >= 700;
    const large = fontSize >= 24 || (bold && fontSize >= 18.66);
    return {
      selector,
      ratio: Number(ratio.toFixed(2)),
      fontSize,
      bold,
      large,
      required: large ? 3 : 4.5,
      text: (element.textContent || '').trim().slice(0, 40),
    };
  };
};

async function openLab(page) {
  await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  await expect(page.locator('#fqPlay')).toBeVisible();
}

test.describe('Frequenzlabor — Tastaturbedienung', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  test('alle Kernbedienelemente sind ohne Maus erreichbar und bedienbar', async ({ page }) => {
    // Fokus nach Ansichtswechsel (NFR-17): Hub → Labor über den Link.
    await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
    await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
    await page.locator('a[href="#frequenzen/labor"]').first().click();
    await expect(page.locator('#fqPlay')).toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.id), 'Fokus nach Ansichtswechsel auf der H1').toBe(
      'frequenzen-title'
    );

    // Stopp ist im Leerlauf deaktiviert und damit korrekt nicht tabbar:
    // für die Reihenfolge zuerst den Ton starten.
    await page.locator('#fqPlay').click();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('running');
    await page.locator('#frequenzen-title').focus();

    const stops = [];
    for (let i = 0; i < 22; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        const ring =
          (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
          (style.boxShadow && style.boxShadow !== 'none');
        return { id: el.id || el.getAttribute('data-play-id') || el.tagName, ring, tag: el.tagName };
      });
      if (!info) continue;
      stops.push(info);
    }

    const ids = stops.map((stop) => stop.id);
    for (const required of [
      'fqStop',
      'fqFreqRange',
      'fqFreqNumber',
      'fqWaveform',
      'fqGainRange',
      'fqSweepStart',
      'fqPresetSelect',
    ]) {
      expect(ids, `${required} muss per Tab erreichbar sein (Reihenfolge: ${ids.join(' → ')})`).toContain(required);
    }
    const withoutRing = stops.filter((stop) => !stop.ring && stop.tag !== 'BODY');
    expect(withoutRing, 'jedes fokussierte Element zeigt einen Fokusring').toEqual([]);

    // Leertaste auf dem Startknopf startet ebenfalls (native Button-Semantik).
    await page.locator('#fqStop').focus();
    await page.keyboard.press('Enter');
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('idle');
    await page.locator('#fqPlay').focus();
    await page.keyboard.press('Space');
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('running');
  });

  test('Slider und Zahlenfeld bleiben per Tastatur synchron', async ({ page }) => {
    // U5/NFR-14: Slider und Zahlenfeld zeigen jederzeit denselben Wert.
    // Befund M-1 (t_835bd1e9) ist mit t_b78a89a5 behoben.
    await openLab(page);
    await page.locator('#fqFreqRange').focus();
    const before = await page.locator('#fqFreqRange').inputValue();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const after = await page.locator('#fqFreqRange').inputValue();
    expect(Number(after)).toBeGreaterThan(Number(before));

    const readout = (await page.locator('#fqFreqReadout').textContent()).replace(/[^\d,.]/g, '').replace(',', '.');
    const numberValue = Number(await page.locator('#fqFreqNumber').inputValue());
    expect(
      Math.abs(numberValue - Number(readout)),
      `Zahlenfeld ${numberValue} Hz vs. Anzeige ${readout} Hz`
    ).toBeLessThan(1);
  });

  test('Zahlenfeld klemmt auf 20 und 20.000 Hz', async ({ page }) => {
    await openLab(page);
    await page.locator('#fqFreqNumber').fill('99999');
    await page.locator('#fqFreqNumber').blur();
    expect(Number(await page.locator('#fqFreqNumber').inputValue())).toBe(20000);
    await page.locator('#fqFreqNumber').fill('1');
    await page.locator('#fqFreqNumber').blur();
    expect(Number(await page.locator('#fqFreqNumber').inputValue())).toBe(20);
  });
});

test.describe('Frequenzlabor — Screenreader-Stichprobe', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  test('Bedienelemente haben sprechende Namen, Canvas ist verborgen', async ({ page }) => {
    await openLab(page);
    const transport = await page.locator('.fq-transport').ariaSnapshot();
    expect(transport).toContain('button "Ton starten"');
    expect(transport).toContain('button "Stopp"');

    await expect(page.locator('#fqFreqRange')).toHaveAccessibleName(/Frequenz, logarithmisch/);
    await expect(page.locator('#fqFreqNumber')).toHaveAccessibleName(/Frequenz in Hz/);
    await expect(page.locator('#fqGainRange')).toHaveAccessibleName(/Lautstärke/);
    await expect(page.locator('#fqWaveform')).toHaveAccessibleName(/Wellenform/);
    await expect(page.locator('#fqPresetSelect')).toHaveAccessibleName(/Hörbares Preset/);

    await expect(page.locator('#fqCanvas')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#fqReadFreq')).toBeVisible();
    await expect(page.locator('#fqStatus')).toHaveAttribute('aria-live', 'polite');

    // Statusansage nach Start: role=status mit Text, nicht nur Farbe.
    await page.locator('#fqPlay').click();
    await expect.poll(async () => (await page.locator('#fqStatus').textContent()).trim().length).toBeGreaterThan(0);
    await expect(page.locator('#fqReadState')).toContainText(/läuft|spielt|Ton/i);
  });

  test('Evidenzstatus ist immer Text, nicht nur Farbe', async ({ page }) => {
    await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
    await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
    const badges = await page
      .locator('.fq-badge')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()).filter(Boolean));
    expect(badges.length).toBeGreaterThanOrEqual(32);
    for (const label of new Set(badges)) {
      expect(['Belegt', 'Plausibel', 'Nicht belegt', 'Traditionell']).toContain(label);
    }
  });
});

test.describe('Frequenzlabor — Kontrast', () => {
  test('Textkontrast erfüllt WCAG AA auf Hub und Labor', async ({ page }) => {
    await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
    await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
    await page.addScriptTag({ content: `(${CONTRAST_HELPER.toString()})()` });

    const selectors = [
      '#frequenzen-title',
      '.fq-lede',
      '.fq-entry-title',
      '.fq-entry-desc',
      '.fq-entry-hz',
      '.fq-badge',
      '.fq-source-link',
      '#fqDisclaimerKurz',
      '#fqDisclaimerLang',
      '#fq-quellen-title',
    ];
    const hub = await page.evaluate((list) => list.map((selector) => window.__qaContrast(selector)), selectors);
    const failures = hub.filter((item) => item.error || item.ratio < item.required);
    expect(failures, `Kontrastfehler Hub: ${JSON.stringify(failures)}`).toEqual([]);

    await openLab(page);
    await page.addScriptTag({ content: `(${CONTRAST_HELPER.toString()})()` });
    const labSelectors = [
      '#frequenzen-title',
      '.fq-note',
      '#fqGainReadout',
      '.fq-gain-cap',
      '#fqStatus',
      '#fqReadGain',
      '.fq-panel-title',
      '#fqDisclaimerKurz',
      '.btn-primary',
      '.btn-secondary',
    ];
    const lab = await page.evaluate((list) => list.map((selector) => window.__qaContrast(selector)), labSelectors);
    const labFailures = lab.filter((item) => item.error || item.ratio < item.required);
    expect(labFailures, `Kontrastfehler Labor: ${JSON.stringify(labFailures)}`).toEqual([]);

    // Messwerte für den Bericht protokollieren.
    console.log('KONTRAST_HUB=' + JSON.stringify(hub));
    console.log('KONTRAST_LAB=' + JSON.stringify(lab));
  });
});

test.describe('Frequenzlabor — reduzierte Bewegung', () => {
  test.use({ reducedMotion: 'reduce' });
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  test('keine rAF-Animation, statische Erklärung sichtbar', async ({ page }) => {
    await page.addInitScript(() => {
      window.__qaRaf = 0;
      const original = window.requestAnimationFrame;
      window.requestAnimationFrame = function counted(callback) {
        window.__qaRaf += 1;
        return original.call(this, callback);
      };
    });
    await openLab(page);
    await page.locator('#fqPlay').click();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('running');
    await expect(page.locator('#fqMotionNote'), 'Hinweis zur reduzierten Bewegung ist sichtbar').toBeVisible();
    const before = await page.evaluate(() => window.__qaRaf);
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => window.__qaRaf);
    // 60-fps-Schleife wären ~60 Aufrufe; erlaubt sind nur einzelne Auslöser.
    expect(after - before, 'bei reduzierter Bewegung läuft keine Animationsschleife').toBeLessThan(15);
    await expect(page.locator('#fqReadPeriod')).not.toHaveText('—');
  });
});

test.describe('Frequenzlabor — mobile Ansicht 360 px', () => {
  test.use({ hasTouch: true, viewport: { width: 360, height: 640 } });
  // eslint-disable-next-line no-empty-pattern -- Playwright verlangt Destrukturierung
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-desktop', AUDIO_SKIP);
  });

  test('kein horizontaler Überlauf und bedienbare Touch-Ziele', async ({ page }) => {
    await openLab(page);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth, 'kein horizontaler Scroll').toBeLessThanOrEqual(overflow.innerWidth + 1);

    const sizes = await page.evaluate(() => {
      const selectors = [
        '#fqPlay',
        '#fqStop',
        '#fqSweepStart',
        '#fqSweepCancel',
        '#fqPresetPlay',
        '#fqGainRange',
        '#fqFreqRange',
      ];
      return selectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return { selector, missing: true };
        const rect = element.getBoundingClientRect();
        return { selector, width: Math.round(rect.width), height: Math.round(rect.height) };
      });
    });
    const tooSmall = sizes.filter((item) => item.missing || item.height < 44);
    expect(tooSmall, `Touch-Ziele unter 44 px: ${JSON.stringify(tooSmall)}`).toEqual([]);

    await page.locator('#fqPlay').tap();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('running');
    await page.locator('#fqStop').tap();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('idle');
  });

  test('Bibliothek bleibt bei 360 px lesbar', async ({ page }) => {
    await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
    await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
  });
});
