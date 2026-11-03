// Browser-Abnahme des Frequenzlabors (ADR §9.3, U1–U16).
//
// Die Tests prüfen die gerenderte Seite, nicht die Engine-Interna: der
// read-only Debug-Handle (window.EsoterikWelt.frequenz) liefert Zustand und
// Analysatordaten. Audio läuft in Chromium headless ohne Gerät; gemessen wird
// der Zustand der Engine, nicht die Lautstärke im Raum.
import { test, expect } from 'playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Port und Basis-URL kommen aus tests/helpers/e2e-target.cjs (eine Quelle für
// Konfiguration und Specs). Der lokale Build läuft auf dem dedizierten
// E2E-Port 3310; BASE_URL zeigt die Suite auf ein Deployment.
import { E2E_BASE_URL as BASE } from './helpers/e2e-target.cjs';
// Playwright runs with the repository root as working directory.
const root = process.cwd();

async function openHub(page) {
  await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
  await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
}

async function openLab(page) {
  await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
  await expect(page.locator('#fqPlay')).toBeVisible();
}
function watchConsole(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('U1: #frequenzen zeigt die Bibliothek mit einem H1 und ohne Konsolenfehler', async ({ page }) => {
  const errors = watchConsole(page);
  await openHub(page);
  await expect(page.locator('#frequenzen')).toBeVisible();
  expect(await page.locator('#frequenzen h1:visible').count()).toBe(1);
  await expect(page.locator('#frequenzen-title')).toHaveText(/Frequenzen/);
  await expect(page.locator('.nav-link[data-page="frequenzen"]')).toHaveAttribute('aria-current', 'page');
  expect(await page.locator('#fqLibrary .fq-entry').count()).toBe(41);
  expect(await page.locator('.fq-badge').first().textContent()).not.toBe('');
  expect(await page.title()).toContain('Frequenzen');
  await expect(page.locator('#fqDisclaimerKurz')).toContainText('kein Medizinprodukt');
  await expect(page.locator('#fqDisclaimerLang')).toContainText('kein Medizinprodukt');
  await expect(page.locator('#fq-quellen')).toBeVisible();
  expect(errors).toEqual([]);
});

test('U2: der Alias #frequenzlabor wird auf #frequenzen/labor normalisiert', async ({ page }) => {
  await page.goto(`${BASE}/#frequenzlabor`, { waitUntil: 'load' });
  await expect(page.locator('#fqPlay')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#frequenzen/labor');
  await expect(page.locator('#fqPresetSelect option')).not.toHaveCount(0);
});

test('U3: vor dem ersten Klick existiert kein AudioContext', async ({ page }) => {
  await page.addInitScript(() => {
    window.__audioContexts = 0;
    const Original = window.AudioContext;
    if (Original) {
      window.AudioContext = class extends Original {
        constructor(...args) {
          super(...args);
          window.__audioContexts += 1;
        }
      };
    }
  });
  await openLab(page);
  expect(await page.evaluate(() => window.__audioContexts)).toBe(0);
  await page.locator('#fqPlay').click();
  await expect.poll(() => page.evaluate(() => window.__audioContexts), { timeout: 5000 }).toBeGreaterThan(0);
  await page.locator('#fqStop').click();
});

test('U4: Play startet, Stop beendet und räumt alle Stimmen ab', async ({ page }) => {
  await openLab(page);
  await page.locator('#fqPlay').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('running');
  const running = await page.evaluate(() => window.EsoterikWelt.frequenz.getState());
  expect(running.frequenciesHz.length).toBe(1);
  expect(running.freqHz).toBe(440);
  await page.locator('#fqStop').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('idle');
  const stopped = await page.evaluate(() => window.EsoterikWelt.frequenz.getState());
  expect(stopped.frequenciesHz.length).toBe(0);
});

test('U5: Slider und Zahlenfeld sind synchron, klemmen und nennen die Einheit', async ({ page }) => {
  await openLab(page);
  await page.locator('#fqFreqNumber').fill('1000');
  await page.locator('#fqFreqNumber').dispatchEvent('change');
  await expect(page.locator('#fqFreqReadout')).toHaveText('1.000 Hz');
  expect(await page.locator('#fqFreqRange').inputValue()).not.toBe('0');

  await page.locator('#fqFreqNumber').fill('5');
  await page.locator('#fqFreqNumber').dispatchEvent('change');
  await expect(page.locator('#fqFreqReadout')).toHaveText('20 Hz');
  await expect(page.locator('#fqFreqRange')).toHaveJSProperty('value', '0');

  await page.locator('#fqFreqNumber').fill('25000');
  await page.locator('#fqFreqNumber').dispatchEvent('change');
  await expect(page.locator('#fqFreqReadout')).toHaveText('20.000 Hz');

  await page.locator('#fqFreqRange').fill('500');
  await page.locator('#fqFreqRange').dispatchEvent('input');
  await expect(page.locator('#fqFreqReadout')).toContainText('Hz');
  await expect(page.locator('#fqReadPeriod')).toContainText('ms');

  // Gegenrichtung Slider → Zahlenfeld (Befund M-1, t_b78a89a5): beide
  // Bedienelemente müssen jederzeit denselben Wert zeigen (U5/NFR-14).
  const parseReadout = (text) =>
    Number(
      text
        .replace(/\s*Hz$/, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );
  const readoutHz = parseReadout(await page.locator('#fqFreqReadout').textContent());
  const fieldHz = Number(await page.locator('#fqFreqNumber').inputValue());
  expect(Math.abs(fieldHz - readoutHz), `Zahlenfeld ${fieldHz} Hz vs. Anzeige ${readoutHz} Hz`).toBeLessThan(1);
  expect(await page.evaluate(() => window.EsoterikWelt.frequenz.getState().freqHz)).toBeCloseTo(readoutHz, 0);

  // Ein `change` im Zahlenfeld darf den zuletzt per Slider gesetzten Ton nicht
  // auf einen alten Wert zurücksetzen.
  const readoutText = await page.locator('#fqFreqReadout').textContent();
  await page.locator('#fqFreqNumber').dispatchEvent('change');
  await expect(page.locator('#fqFreqReadout')).toHaveText(readoutText);
});

test('U6: der Pegel endet hart bei −6 dBFS und der Deckel ist sichtbar', async ({ page }) => {
  await openLab(page);
  expect(await page.locator('#fqGainRange').getAttribute('max')).toBe('-6');
  expect(Number(await page.locator('#fqGainRange').inputValue())).toBe(-20);
  await expect(page.locator('.fq-gain-cap')).toContainText('−6 dBFS');
  await page.evaluate(() => {
    const slider = document.querySelector('#fqGainRange');
    slider.value = '0';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const gain = await page.evaluate(() => window.EsoterikWelt.frequenz.getState().gainDb);
  expect(gain).toBe(-6);
  await expect(page.locator('#fqGainReadout')).toHaveText('−6 dBFS');
});

test('U7: ein Preset aus der Bibliothek startet genau seine Frequenz', async ({ page }) => {
  await openHub(page);
  await page.locator('[data-play-id="solfeggio-528"]').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().freqHz), { timeout: 5000 })
    .toBe(528);
  await expect(page.locator('#fqHubPlayback')).toBeVisible();
  await page.locator('#fqHubStop').click();
});

test('U8: Schumann-Einträge haben keinen Abspielknopf, aber einen Hinweis', async ({ page }) => {
  await openHub(page);
  const card = page.locator('.fq-entry').filter({ hasText: 'Schumann-Resonanz' });
  await expect(card).toHaveCount(1);
  await expect(card.locator('button')).toHaveCount(0);
  await expect(card).toContainText('Nicht abspielbar');
  await expect(card).toContainText('keine belegte Wirkung');
  await expect(card.locator('.fq-badge')).toHaveText('Belegt');
  await expect(card.locator('.fq-source-link')).toHaveAttribute('rel', 'noopener noreferrer');
});

test('U9: Tastaturbedienung und Fokus nach dem Ansichtswechsel', async ({ page }) => {
  await openHub(page);
  if (await page.locator('#navToggle').isVisible()) await page.locator('#navToggle').click();
  await page.locator('.nav-link[data-page="frequenzen"]').click();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('frequenzen-title');

  await page.locator('.fq-nav a[href="#frequenzen/labor"]').click();
  await expect(page.locator('#fqPlay')).toBeVisible();
  await page.locator('#fqPlay').focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('running');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.id);
  expect(focused).not.toBe('');
  await page.locator('#fqStop').click();
});

test('U10: prefers-reduced-motion zeichnet statisch und startet keine Animationsschleife', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.__rafCount = 0;
    const original = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      window.__rafCount += 1;
      return original.call(window, callback);
    };
  });
  await openLab(page);
  await page.locator('#fqPlay').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('running');
  await page.evaluate(() => {
    window.__rafCount = 0;
  });
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__rafCount)).toBe(0);
  await expect(page.locator('#fqMotionNote')).toBeVisible();
  await page.locator('#fqStop').click();
});

test('U11: 360 px ohne horizontalen Scroll und mit 44-px-Zielen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await openLab(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('#frequenzlaborRoot button, #frequenzlaborRoot select, #frequenzlaborRoot input')]
      .filter((element) => element.type !== 'range' && element.type !== 'number' && element.offsetParent !== null)
      .map((element) => ({ id: element.id, height: element.getBoundingClientRect().height }))
      .filter((item) => item.height < 44)
  );
  expect(small).toEqual([]);
  await openHub(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test('U12: Navigation verlässt die Seite und stoppt den Ton', async ({ page }) => {
  await openLab(page);
  await page.locator('#fqPlay').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('running');
  await page.evaluate(() => window.EsoterikWelt.navigateTo('home'));
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('idle');
});

test('U13: der Offline-Build spielt Presets aus dem eingebetteten JSON', async ({ page }) => {
  const local = path.join(root, 'Lokal.html');
  test.skip(!fs.existsSync(local), 'Lokal.html fehlt — npm run build ausführen');
  await page.goto(pathToFileURL(local).href + '#frequenzen/labor', { waitUntil: 'load' });
  await expect(page.locator('#fqPlay')).toBeVisible();
  await expect(page.locator('#fqPresetSelect option')).not.toHaveCount(0);
  expect(await page.evaluate(() => Boolean(document.getElementById('local-frequencies-data')))).toBe(true);
  await page.goto(pathToFileURL(local).href + '#frequenzen', { waitUntil: 'load' });
  await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
  await page.goto(pathToFileURL(local).href + '#frequenzen/labor', { waitUntil: 'load' });
  await expect(page.locator('#fqPlay')).toBeVisible();
  await page.locator('#fqPlay').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('running');
  await page.locator('#fqStop').click();
});

test('U14: die Engine wird erst mit der Kategorie geladen', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await expect(page.locator('#featureGrid > *')).toHaveCount(7);
  expect(requests.some((url) => url.includes('frequenz-engine.js'))).toBe(false);
  await page.goto(`${BASE}/#frequenzen`, { waitUntil: 'load' });
  await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
  expect(requests.some((url) => url.includes('frequenz-engine.js'))).toBe(true);
});

test('U15: der Sweep-Start wird in der Live-Region angesagt (NFR-15)', async ({ page }) => {
  await openLab(page);
  await page.locator('#fqSweepFrom').fill('200');
  await page.locator('#fqSweepTo').fill('800');
  await page.locator('#fqSweepSeconds').fill('2');
  await page.locator('#fqSweepStart').click();
  // Die Startansage steht sofort an, nicht erst nach dem Sweep-Ende (Befund m-1).
  await expect(page.locator('#fqStatus')).toContainText('Sweep läuft: 200 → 800 Hz, 2 s');
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('running');
  await page.locator('#fqSweepCancel').click();
});

test('U16: Pause hält den Ton an, Weiter setzt mit denselben Werten fort (B3/NFR-27)', async ({ page }) => {
  await openLab(page);
  // Bewusst verstellte Werte, damit „dieselben Werte“ prüfbar ist.
  await page.locator('#fqFreqNumber').fill('528');
  await page.locator('#fqFreqNumber').dispatchEvent('change');
  await page.locator('#fqGainRange').fill('-14');
  await page.locator('#fqGainRange').dispatchEvent('input');
  await expect(page.locator('#fqGainReadout')).toHaveText('−14 dBFS');

  // Vor dem Start ist Pause nicht bedienbar, die Beschriftung bleibt „Pause“.
  await expect(page.locator('#fqPause')).toHaveText('Pause');
  await expect(page.locator('#fqPause')).toBeDisabled();

  await page.locator('#fqPlay').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('running');
  await expect(page.locator('#fqPause')).toBeEnabled();
  await expect(page.locator('#fqPause')).toHaveText('Pause');

  // Pause = stop(): Audio ist aus, die Einstellungen bleiben im Controller.
  await page.locator('#fqPause').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('idle');
  const halted = await page.evaluate(() => window.EsoterikWelt.frequenz.getState());
  expect(halted.frequenciesHz.length).toBe(0);
  expect(halted.freqHz).toBeCloseTo(528, 1);
  expect(halted.gainDb).toBe(-14);
  await expect(page.locator('#fqPause')).toHaveText('Weiter');
  await expect(page.locator('#fqPause')).toBeEnabled();
  await expect(page.locator('#fqStatus')).toContainText('Ton pausiert bei 528 Hz');
  // Kein dritter Audiozustand: die Live-Anzeige nennt weiterhin nur Engine-Zustände.
  await expect(page.locator('#fqLiveStatus')).toHaveText('bereit');
  await expect(page.locator('#fqFreqReadout')).toHaveText('528 Hz');

  // Weiter = play() mit den gemerkten Werten, per Tastatur bedient.
  await page.locator('#fqPause').focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('running');
  const resumed = await page.evaluate(() => window.EsoterikWelt.frequenz.getState());
  expect(resumed.freqHz).toBeCloseTo(528, 1);
  expect(resumed.gainDb).toBe(-14);
  expect(resumed.frequenciesHz.length).toBe(1);
  await expect(page.locator('#fqPause')).toHaveText('Pause');
  await expect(page.locator('#fqStatus')).toContainText('Weiter: Ton läuft: 528 Hz');

  // Stopp beendet die Pause-Bedienung; Pause ist danach wieder inaktiv.
  await page.locator('#fqPause').click();
  await expect
    .poll(() => page.evaluate(() => window.EsoterikWelt.frequenz.getState().status), { timeout: 5000 })
    .toBe('idle');
  await page.locator('#fqStop').click();
  await expect(page.locator('#fqPause')).toHaveText('Pause');
  await expect(page.locator('#fqPause')).toBeDisabled();
  await expect(page.locator('#fqStatus')).toContainText('Ton gestoppt.');
});
