/**
 * E2E-Abnahme der Folgestufe P9 (Chladni/Cymatics) und P10 (Meditation).
 *
 * Geprüft wird im echten Build gegen den lokalen Pages-Server: Routing,
 * Flag-Verhalten, Zeichnung, Timer, Favoriten, Wiederaufnahme, Tastatur und
 * Barrierefreiheit (axe-core, WCAG 2.1 AA). Die Unit-Tests der Modelle liegen
 * in tests/frequenz-chladni.mjs und tests/frequenz-meditation.mjs.
 */
import { test, expect } from 'playwright/test';
import path from 'node:path';

// Playwright lädt .spec.js in diesem Paket als CommonJS; `import.meta` ist
// deshalb nicht verfügbar. axe-core liegt als Dev-Abhängigkeit im Projekt.
const AXE_PATH = path.resolve('node_modules/axe-core/axe.min.js');
const BASE = process.env.BASE_URL || `http://127.0.0.1:${process.env.E2E_PORT || 3100}/Esoterik-Welt`;

async function openRoute(page, route, search = '') {
  await page.goto(`${BASE}/${search}#${route}`, { waitUntil: 'load' });
  // Die Ansicht wird lazy nachgeladen; erst wenn ihr Wurzelelement steht, sind
  // Messungen aussagekräftig.
  if (route.startsWith('frequenzen/cymatics')) await expect(page.locator('#fqCyCanvasA')).toBeVisible();
  else if (route.startsWith('frequenzen/meditation')) await expect(page.locator('#fqMedStart')).toBeVisible();
  else if (route === 'frequenzen/labor') await expect(page.locator('#fqPlay')).toBeVisible();
  else await expect(page.locator('#fqLibrary')).toBeVisible();
}

/** Zählt helle Pixel (Knotenlinien) und liefert die Bildsumme des Canvas. */
async function canvasStats(page, selector) {
  return page.evaluate((target) => {
    const canvas = document.querySelector(target);
    if (!canvas) return null;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let bright = 0;
    let sum = 0;
    for (let index = 0; index < data.length; index += 4) {
      const value = data[index] + data[index + 1] + data[index + 2];
      sum += value;
      if (value > 300) bright += 1;
    }
    return { bright, sum, pixels: data.length / 4 };
  }, selector);
}

test.describe('P9 — Chladni-Muster', () => {
  test('C1: die Ansicht rendert zwei Muster mit textlicher Entsprechung', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await openRoute(page, 'frequenzen/cymatics');
    await expect(page.locator('#fqCyCanvasA')).toBeVisible();
    await expect(page.locator('#fqCyCanvasB')).toBeVisible();
    await expect(page.locator('#fqCyTextA')).toContainText('Modus n = 2, m = 3');
    await expect(page.locator('#fqCyTextB')).toContainText('Modus n = 3, m = 4');
    await expect(page.locator('#fqCyNA')).toHaveAccessibleName(/n \(A\)/);
    await expect(page.locator('#fqCyCanvasA')).toHaveAttribute('aria-hidden', 'true');

    const stats = await canvasStats(page, '#fqCyCanvasA');
    expect(stats.bright, 'Knotenlinien sind gezeichnet').toBeGreaterThan(500);
    expect(errors, `Konsolenfehler: ${errors.join(' | ')}`).toEqual([]);
  });

  test('C2: ein Moduswechsel zeichnet neu und aktualisiert den Text', async ({ page }) => {
    await openRoute(page, 'frequenzen/cymatics');
    await expect(page.locator('#fqCyTextA')).toContainText('Modus n = 2, m = 3');
    const before = await canvasStats(page, '#fqCyCanvasA');
    await page.locator('#fqCyNA').selectOption('4');
    await expect(page.locator('#fqCyTextA')).toContainText('Modus n = 4, m = 3');
    const after = await canvasStats(page, '#fqCyCanvasA');
    expect(after.sum).not.toBe(before.sum);

    await page.locator('#fqCyNodes').uncheck();
    const withoutNodes = await canvasStats(page, '#fqCyCanvasA');
    expect(withoutNodes.bright, 'ohne Knotenlinien bleibt nur das Feld').toBeLessThan(after.bright);
  });

  test('C3: n = m wird als entartet gemeldet statt still gezeichnet', async ({ page }) => {
    await openRoute(page, 'frequenzen/cymatics');
    await page.locator('#fqCyMA').selectOption('2');
    await expect(page.locator('#fqCyError')).toBeVisible();
    await expect(page.locator('#fqCyError')).toContainText('entartet');
    await expect(page.locator('#fqCyTextA')).toContainText('Kein Bild');
    const cleared = await canvasStats(page, '#fqCyCanvasA');
    expect(cleared.sum, 'kein Bild bei entarteter Mode').toBe(0);
    // Rückkehr zu einem gültigen Modus räumt die Meldung wieder ab.
    await page.locator('#fqCyMA').selectOption('5');
    await expect(page.locator('#fqCyError')).toBeHidden();
    await expect(page.locator('#fqCyTextA')).toContainText('Modus n = 2, m = 5');
  });

  test('C4: die Ansicht erzeugt keinen AudioContext und keine rAF-Schleife', async ({ page }) => {
    await page.addInitScript(() => {
      window.__audioContexts = 0;
      window.__raf = 0;
      const Original = window.AudioContext || window.webkitAudioContext;
      if (Original) {
        const Counted = function Counted(...args) {
          window.__audioContexts += 1;
          return new Original(...args);
        };
        Counted.prototype = Original.prototype;
        window.AudioContext = Counted;
        window.webkitAudioContext = Counted;
      }
      const originalRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = function counted(callback) {
        window.__raf += 1;
        return originalRaf.call(this, callback);
      };
    });
    await openRoute(page, 'frequenzen/cymatics');
    await expect(page.locator('#fqCyCanvasA')).toBeVisible();
    await page.locator('#fqCyNB').selectOption('5');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__audioContexts), 'kein AudioContext im Cymatics-Bereich').toBe(0);
    expect(await page.evaluate(() => window.__raf), 'keine Animationsschleife').toBeLessThan(5);
  });

  test('C5: prefers-reduced-motion ist statisch und nennt den Grund', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openRoute(page, 'frequenzen/cymatics');
    await expect(page.locator('#fqCyMotionNote')).toBeVisible();
    await expect(page.locator('#fqCyCanvasA')).toBeVisible();
    const stats = await canvasStats(page, '#fqCyCanvasA');
    expect(stats.bright).toBeGreaterThan(0);
  });

  test('C6: das Flag schaltet die Ansicht lokal ab, ohne das Modul zu laden', async ({ page }) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(`${BASE}/?fq=-cymatics#frequenzen/cymatics`, { waitUntil: 'load' });
    await expect(page.locator('#fqLibrary')).toBeVisible();
    await expect(page.locator('#fqNotice')).toContainText('nicht aktiviert');
    await expect(page.locator('a[href="#frequenzen/cymatics"]')).toHaveCount(0);
    expect(requests.filter((url) => url.includes('frequenz-cymatics-view.js'))).toEqual([]);
  });
});

test.describe('P10 — Meditationssitzung', () => {
  test('M1: Sitzung startet erst auf Klick, zählt herunter und stoppt', async ({ page }) => {
    await page.addInitScript(() => {
      window.__audioContexts = 0;
      const Original = window.AudioContext || window.webkitAudioContext;
      if (Original) {
        const Counted = function Counted(...args) {
          window.__audioContexts += 1;
          return new Original(...args);
        };
        Counted.prototype = Original.prototype;
        window.AudioContext = Counted;
        window.webkitAudioContext = Counted;
      }
    });
    await openRoute(page, 'frequenzen/meditation');
    await expect(page.locator('#fqMedStart')).toBeVisible();
    await expect(page.locator('#fqMedTimer')).toHaveText('10:00');
    expect(await page.evaluate(() => window.__audioContexts), 'kein AudioContext vor dem Klick').toBe(0);

    await page.locator('#fqMedDuration').selectOption('3');
    await expect(page.locator('#fqMedTimer')).toHaveText('03:00');
    await page.locator('#fqMedStart').click();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('running');
    expect(await page.evaluate(() => window.__audioContexts)).toBeGreaterThan(0);
    await expect(page.locator('#fqMedStart')).toBeDisabled();
    await expect(page.locator('#fqMedStop')).toBeEnabled();

    const first = await page.locator('#fqMedTimer').textContent();
    await page.waitForTimeout(1500);
    const second = await page.locator('#fqMedTimer').textContent();
    expect(second, `Timer läuft (${first} → ${second})`).not.toBe(first);

    await page.locator('#fqMedStop').click();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('idle');
    await expect(page.locator('#fqMedStart')).toBeEnabled();
    await expect(page.locator('#fqMedStatus')).toContainText('beendet');
  });

  test('M2: Favoriten werden lokal gespeichert, geladen und entfernt', async ({ page }) => {
    await openRoute(page, 'frequenzen/meditation');
    await page.locator('#fqMedDuration').selectOption('5');
    await page.locator('#fqMedPreset').selectOption('tone-528');
    await page.locator('#fqMedFavName').fill('Abend');
    await page.locator('#fqMedFavSave').click();
    await expect(page.locator('#fqMedFavorites')).toContainText('Abend — 5 Minuten, Sinus 528 Hz');

    const stored = await page.evaluate(() => window.localStorage.getItem('esoterik-welt:frequenzlabor:meditation:v1'));
    expect(stored).toBeTruthy();
    expect(stored).not.toMatch(/timestamp|startedAt|createdAt|20\d\d-\d\d-\d\d/);

    // Nach dem Neuladen bleiben Favoriten erhalten (localStorage).
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#fqMedFavorites')).toContainText('Abend');
    await page.locator('#fqMedDuration').selectOption('15');
    await page.locator('[data-fav-load]').first().click();
    await expect(page.locator('#fqMedDuration')).toHaveValue('5');
    await expect(page.locator('#fqMedPreset')).toHaveValue('tone-528');

    await page.locator('[data-fav-delete]').first().click();
    await expect(page.locator('#fqMedFavoritesEmpty')).toBeVisible();
    const afterDelete = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('esoterik-welt:frequenzlabor:meditation:v1'))
    );
    expect(afterDelete.favorites).toEqual([]);
  });

  test('M3: eine unterbrochene Sitzung lässt sich fortsetzen', async ({ page }) => {
    await openRoute(page, 'frequenzen/meditation');
    await page.locator('#fqMedDuration').selectOption('10');
    await page.locator('#fqMedStart').click();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('running');
    await page.waitForTimeout(1200);

    // Tabwechsel/Verlassen: der Controller stoppt Audio und sichert die Restzeit.
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('idle');
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#fqMedResume')).toBeVisible();
    await expect(page.locator('#fqMedResumeText')).toContainText('übrig');

    await page.locator('#fqMedResumeStart').click();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('running');
    await expect(page.locator('#fqMedResume')).toBeHidden();
    await page.locator('#fqMedStop').click();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('idle');
  });

  test('M4: ein binaurales Preset nennt die Kopfhörerpflicht', async ({ page }) => {
    await openRoute(page, 'frequenzen/meditation');
    await page.locator('#fqMedPreset').selectOption('bin-alpha');
    await expect(page.locator('#fqMedPresetNote')).toContainText('Kopfhörer');
    await page.locator('#fqMedStart').click();
    await expect
      .poll(async () => await page.evaluate(() => window.EsoterikWelt.frequenz.getState().status))
      .toBe('running');
    const state = await page.evaluate(() => window.EsoterikWelt.frequenz.getState());
    expect(state.mode).toBe('binaural');
    expect(state.binaural.leftHz).toBe(200);
    expect(state.binaural.rightHz).toBe(210);
    await page.locator('#fqMedStop').click();
  });

  test('M5: das Flag schaltet die Ansicht lokal ab', async ({ page }) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(`${BASE}/?fq=-meditation#frequenzen/meditation`, { waitUntil: 'load' });
    await expect(page.locator('#fqLibrary')).toBeVisible();
    await expect(page.locator('#fqNotice')).toContainText('nicht aktiviert');
    expect(requests.filter((url) => url.includes('frequenz-meditation-view.js'))).toEqual([]);
  });

  test('M6: Verlassen der Ansicht stoppt den Ton sofort und sichert genau einmal', async ({ page }) => {
    // Zählt jeden Schreibzugriff auf den Meditations-Schlüssel: die Restzeit
    // darf beim Ansichtswechsel genau einmal gesichert werden (R1).
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    await page.addInitScript(() => {
      window.__medWrites = [];
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'esoterik-welt:frequenzlabor:meditation:v1') window.__medWrites.push(String(value));
        return original.call(this, key, value);
      };
    });
    const status = () => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status);
    const medWrites = () =>
      page.evaluate(() =>
        window.__medWrites
          .map((text) => {
            try {
              return JSON.parse(text).resume;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      );

    await openRoute(page, 'frequenzen/meditation');
    await page.locator('#fqMedDuration').selectOption('3');
    await page.locator('#fqMedFadeIn').selectOption('0');
    await page.locator('#fqMedStart').click();
    await expect.poll(status).toBe('running');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.EsoterikWelt.frequenz.getState().gainDb)).toBe(-20);

    // Wechsel in die Schwesteransicht: Ton endet sofort, kein Bedienelement zurück.
    await page.locator('.fq-nav a[href="#frequenzen/cymatics"]').click();
    await expect(page.locator('#fqCyCanvasA')).toBeVisible();
    await expect.poll(status).toBe('idle');
    expect(await page.locator('#fqMedStop').count(), 'kein Stopp-Knopf in der Zielansicht').toBe(0);

    const saved = await medWrites();
    expect(saved.length, 'Restzeit genau einmal gesichert').toBe(1);
    expect(saved[0].remainingSeconds).toBeGreaterThan(170);
    expect(saved[0].remainingSeconds).toBeLessThanOrEqual(180);

    // Gleiches Verhalten beim Wechsel in den Hub.
    await page.locator('.fq-nav a[href="#frequenzen/meditation"]').click();
    await expect(page.locator('#fqMedStart')).toBeVisible();
    await page.locator('#fqMedStart').click();
    await expect.poll(status).toBe('running');
    await page.locator('.fq-nav a[href="#frequenzen"]').click();
    await expect(page.locator('#fqLibrary')).toBeVisible();
    await expect.poll(status).toBe('idle');
    // Die Statusmeldung wird mit bis zu 1 s Verzögerung angewendet; erst danach
    // wäre ein Timer-Fehler aus der abgebauten Ansicht sichtbar.
    await page.waitForTimeout(1200);
    expect(errors, `Fehler beim Ansichtswechsel: ${errors.join(' | ')}`).toEqual([]);
  });

  test('M7: die Rückkehr zeigt keine laufende Sitzung und setzt genau einmal fort', async ({ page }) => {
    const status = () => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status);
    await openRoute(page, 'frequenzen/meditation');
    await page.locator('#fqMedDuration').selectOption('3');
    await page.locator('#fqMedFadeIn').selectOption('0');
    await page.locator('#fqMedStart').click();
    await expect.poll(status).toBe('running');
    await page.waitForTimeout(700);

    await page.locator('.fq-nav a[href="#frequenzen/cymatics"]').click();
    await expect(page.locator('#fqCyCanvasA')).toBeVisible();
    await expect.poll(status).toBe('idle');

    await page.locator('.fq-nav a[href="#frequenzen/meditation"]').click();
    await expect(page.locator('#fqMedStart')).toBeVisible();
    // Kein „Start“-Knopf bei laufender Engine: Status und Bedienzustand passen zusammen.
    expect(await status()).toBe('idle');
    await expect(page.locator('#fqMedStart')).toBeEnabled();
    await expect(page.locator('#fqMedStop')).toBeDisabled();
    await expect(page.locator('#fqMedResume')).toBeVisible();
    await expect(page.locator('#fqMedResumeText')).toContainText('übrig');

    await page.locator('#fqMedResumeStart').click();
    await expect.poll(status).toBe('running');
    await expect(page.locator('#fqMedResume')).toBeHidden();
    await expect(page.locator('#fqMedStop')).toBeEnabled();
    await page.locator('#fqMedStop').click();
    await expect.poll(status).toBe('idle');
  });

  test('M8: das Ausblenden springt nicht über den aktuellen Pegel', async ({ page }) => {
    const status = () => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status);
    await openRoute(page, 'frequenzen/meditation');
    await page.locator('#fqMedDuration').selectOption('3');
    await page.locator('#fqMedFadeIn').selectOption('10');
    await page.locator('#fqMedFadeOut').selectOption('2');
    await page.locator('#fqMedStart').click();
    await expect.poll(status).toBe('running');
    await page.waitForTimeout(1500);

    // Messreihe im Browser: 25-ms-Abtastung erfasst jeden 100-ms-Blendschritt.
    // Referenzpegel und Klick liegen in derselben Aufgabe, sonst läuft die
    // Einblendung zwischen Referenzmessung und Klick weiter und die Zusicherung
    // „kein Wert über dem Ausgangspegel“ würde unter Last fälschlich scheitern.
    const before = await page.evaluate(() => {
      const engine = window.EsoterikWelt.frequenz;
      window.__gains = [];
      window.__sampler = window.setInterval(() => {
        window.__gains.push(engine.getState().gainDb);
      }, 25);
      const reference = engine.getState().gainDb;
      document.querySelector('#fqMedStop').click();
      return reference;
    });
    expect(before, 'Pegel liegt nach 1,5 s Einblendung deutlich unter dem Ziel').toBeLessThan(-28);

    await expect.poll(status).toBe('idle');
    const gains = await page.evaluate(() => {
      window.clearInterval(window.__sampler);
      return window.__gains;
    });
    expect(gains.length).toBeGreaterThan(20);
    expect(Math.max(...gains), `Reihe: ${gains.join(', ')}`).toBeLessThanOrEqual(before + 0.5);
    const distinct = gains.filter((value, index) => index === 0 || value !== gains[index - 1]);
    for (let index = 1; index < distinct.length; index += 1) {
      expect(distinct[index], `Sprung in ${distinct.join(', ')}`).toBeLessThanOrEqual(distinct[index - 1] + 1e-6);
    }
    expect(distinct[distinct.length - 1], 'Ausblenden endet bei der Hörschwelle').toBeLessThan(-55);
  });

  test('M11: jeder Ansichtswechsel während einer Ansage wirft keinen Fehler', async ({ page }) => {
    // D1: `announce()` plant die Statusmeldung mit bis zu 1 s Verzögerung ein.
    // Wer die Ansicht in dieser Zeit verlässt, darf keinen TypeError aus dem
    // Timer bekommen — weder als pageerror noch als console.error.
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    const status = () => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status);

    const cases = [
      { dwell: 300, hash: '#frequenzen/cymatics', marker: '#fqCyCanvasA', label: 'Cymatics' },
      { dwell: 700, hash: '#frequenzen', marker: '#fqLibrary', label: 'Hub' },
      { dwell: 300, hash: '#frequenzen/labor', marker: '#fqPlay', label: 'Labor' },
      { dwell: 700, hash: '#home', marker: '#home-title', label: 'andere Kategorie' },
    ];

    for (const item of cases) {
      await openRoute(page, 'frequenzen/meditation');
      await page.locator('#fqMedDuration').selectOption('3');
      await page.locator('#fqMedFadeIn').selectOption('0');
      await page.locator('#fqMedStart').click();
      await expect.poll(status).toBe('running');
      // Verweildauer so wählen, dass die Ansage noch aussteht (1-s-Drosselung).
      await page.waitForTimeout(item.dwell);

      const mark = errors.length;
      await page.evaluate((hash) => {
        window.location.hash = hash;
      }, item.hash);
      await expect(page.locator(item.marker).first()).toBeVisible();
      // Länger als die Drosselung warten: der ehemals offene Timer wäre jetzt fällig.
      await page.waitForTimeout(1300);

      expect(await status(), `${item.label}: Audio endet beim Wechsel`).toBe('idle');
      expect(errors.slice(mark), `${item.label} nach ${item.dwell} ms: ${errors.slice(mark).join(' | ')}`).toEqual([]);
    }
  });
});

test.describe('P9/P10 — Barrierefreiheit und Mobil', () => {
  test('A1: axe-core findet keine schwerwiegenden Verstöße (WCAG 2.1 AA)', async ({ page }) => {
    for (const route of ['frequenzen/cymatics', 'frequenzen/meditation']) {
      await openRoute(page, route);
      await page.addScriptTag({ path: AXE_PATH });
      const violations = await page.evaluate(async () => {
        if (typeof window.axe === 'undefined') return [{ id: 'axe-missing', impact: 'critical', nodes: 0 }];
        const result = await window.axe.run(document.getElementById('frequenzen'), {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        });
        return result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
          help: violation.help,
        }));
      });
      const severe = violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical'
      );
      expect(severe, `${route}: ${JSON.stringify(severe)}`).toEqual([]);
      console.log(`AXE_${route.replace('/', '_')}=${JSON.stringify(violations)}`);
    }
  });

  test('A2: Tastatur erreicht alle Bedienelemente der Sitzung', async ({ page }) => {
    await openRoute(page, 'frequenzen/meditation');
    await page.locator('#frequenzen-title').focus();
    const stops = [];
    for (let index = 0; index < 30; index += 1) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => document.activeElement?.id || null);
      if (id) stops.push(id);
    }
    for (const required of ['fqMedDuration', 'fqMedPreset', 'fqMedStart', 'fqMedFavName', 'fqMedFavSave']) {
      expect(stops, `Reihenfolge: ${stops.join(' → ')}`).toContain(required);
    }
  });

  test('A3: 360 px ohne horizontalen Scroll und mit 44-px-Zielen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    for (const route of ['frequenzen/cymatics', 'frequenzen/meditation']) {
      await openRoute(page, route);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth, `${route}: kein horizontaler Scroll`).toBeLessThanOrEqual(overflow.innerWidth + 1);
      const small = await page.evaluate(() => {
        const selectors = window.location.hash.includes('meditation')
          ? ['#fqMedStart', '#fqMedStop', '#fqMedFavSave', '#fqMedDuration', '#fqMedPreset']
          : ['#fqCyNA', '#fqCyMA'];
        return selectors
          .map((selector) => {
            const element = document.querySelector(selector);
            if (!element) return { selector, missing: true };
            const rect = element.getBoundingClientRect();
            return { selector, height: Math.round(rect.height) };
          })
          .filter((entry) => entry.missing || entry.height < 44);
      });
      expect(small, `${route}: Ziele unter 44 px`).toEqual([]);
    }
  });

  test('A4: die Folgestufe vergrößert den Initialgraphen nicht', async ({ page }) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await openRoute(page, 'frequenzen');
    await expect(page.locator('#fqLibrary')).toBeVisible();
    const featureModules = requests.filter((url) => /frequenz-(cymatics|meditation)(-view)?\.js/.test(url));
    expect(featureModules, 'kein P9/P10-Modul vor der Navigation').toEqual([]);
  });
});
