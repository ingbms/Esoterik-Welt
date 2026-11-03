// Pendellabor (RAD-07) — Browsertests der echten Route #pendeln/labor.
//
// Geprüft werden die Abnahmekriterien der Karte: erreichbare Route, Regler mit
// Beschriftung, Start/Stop, mehrere Pendeldarstellungen, reale Zustands- und
// Periodenanzeige, beendete requestAnimationFrame-Schleife bei Stop und
// Routenwechsel, reduzierte Bewegung, Tastatur, Touch, mobile Überläufe und
// der file://-Build.

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('playwright/test');

const BASE = process.env.E2E_BASE || `http://127.0.0.1:${process.env.E2E_PORT || 3100}/Esoterik-Welt`;
const url = (hash = '') => `${BASE}/${hash}`;
const LAB = '#pendeln/labor';

function collect(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const external = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('request', (request) => {
    const target = request.url();
    if (!target.startsWith('http://127.0.0.1') && !target.startsWith('data:')) external.push(target);
  });
  return { consoleErrors, pageErrors, external };
}

// Zählt jeden Aufruf von requestAnimationFrame, bevor die Anwendung startet.
// Damit lässt sich belegen, dass Stop und Routenwechsel die Schleife wirklich
// beenden und nicht nur die Anzeige einfrieren.
async function countFrames(page) {
  await page.addInitScript(() => {
    window.__rafCount = 0;
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      window.__rafCount += 1;
      return original(callback);
    };
  });
}

const frames = (page) => page.evaluate(() => window.__rafCount);
const readNumber = async (page, selector) => {
  const text = (await page.locator(selector).textContent()) || '';
  const match = /(−?[\d.,]+)/.exec(text);
  if (!match) return Number.NaN;
  return Number(match[1].replace(/\./g, '').replace('−', '-').replace(',', '.'));
};

test('Route #pendeln/labor rendert eine echte Ansicht ohne Konsolenfehler', async ({ page }) => {
  const log = collect(page);
  await page.goto(url(LAB));
  const root = page.locator('#pendelnRoot');
  await expect(root.locator('#pendelLabor')).toBeVisible();
  await expect(root.locator('h1')).toHaveCount(1);
  await expect(root.locator('h1')).toHaveText('Pendellabor');
  await expect(page).toHaveTitle('Pendellabor — Mechanik des Fadenpendels | Esoterik-Welt');
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description.length).toBeGreaterThan(60);
  expect(description.length).toBeLessThanOrEqual(165);
  await expect(root.locator('.psim-readout')).toBeVisible();
  await expect(root.locator('#psimPeriodIdeal')).toHaveText('1,003 s');
  await expect(root.locator('.rad-disclaimer')).toContainText('Keine Informationsgewinnung');
  const breadcrumb = JSON.parse(await page.locator('#pendeln-breadcrumb-ld').textContent());
  expect(breadcrumb['@type']).toBe('BreadcrumbList');
  expect(breadcrumb.itemListElement.length).toBeGreaterThanOrEqual(2);

  // Überschriftenordnung ohne Sprünge (h1 → h2 → h3).
  const levels = await root
    .locator('h1,h2,h3')
    .evaluateAll((nodes) =>
      nodes.filter((node) => node.offsetParent !== null).map((node) => Number(node.tagName.slice(1)))
    );
  let previous = levels[0];
  for (const level of levels) {
    expect(level - previous).toBeLessThanOrEqual(1);
    previous = level;
  }

  // Kein horizontaler Überlauf auf Desktop.
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewport + 1);

  expect(log.pageErrors).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
  expect(log.external).toEqual([]);
});

test('Regler sind beschriftet und verändern die Anzeige', async ({ page }) => {
  await page.goto(url(LAB));
  const container = page.locator('#pendelLabor');

  for (const [id, name] of [
    ['psimLength', 'Pendellänge'],
    ['psimAmplitude', 'Anfangsauslenkung'],
    ['psimDamping', 'Dämpfungsgrad ζ'],
  ]) {
    const input = page.locator(`#${id}`);
    await expect(input).toBeVisible();
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toHaveText(name);
    const describedBy = await input.getAttribute('aria-describedby');
    await expect(page.locator(`#${describedBy}`)).toBeVisible();
  }

  // Vierfache Länge ⇒ doppelte Dauer: 1,00 m ergibt 2,006 s.
  await page.locator('#psimLength').evaluate((element) => {
    element.value = '100';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#psimLengthValue')).toHaveText('100 cm');
  await expect(page.locator('#psimPeriodIdeal')).toHaveText('2,006 s');

  await page.locator('#psimAmplitude').evaluate((element) => {
    element.value = '60';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#psimAmplitudeValue')).toHaveText('60,0°');
  await expect(page.locator('#psimTheta')).toHaveText('60,0°');

  await page.locator('#psimDamping').evaluate((element) => {
    element.value = '0.05';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#psimDampingValue')).toHaveText('0,050');
  await expect(container).toHaveAttribute('data-psim-state', 'idle');
});

test('Jede Pendeldarstellung ist wählbar und genau eine aktiv', async ({ page }) => {
  await page.goto(url(LAB));
  const container = page.locator('#pendelLabor');
  for (const style of ['klassisch', 'kugel', 'ring']) {
    await page.locator(`input[name="psimStyle"][value="${style}"]`).check();
    await expect(container).toHaveAttribute('data-psim-style', style);
    await expect(page.locator(`[data-psim-bob="${style}"]`)).toHaveAttribute('data-active', '');
    const active = await page.locator('[data-psim-bob][data-active]').count();
    expect(active).toBe(1);
  }
  await expect(page.locator('[data-psim-bob="ring"]')).toBeVisible();
  await expect(page.locator('[data-psim-bob="klassisch"]')).toBeHidden();
});

test('Start bewegt das Pendel, Stop friert Zustand und Frame-Schleife ein', async ({ page }) => {
  await countFrames(page);
  const log = collect(page);
  await page.goto(url(LAB));
  const container = page.locator('#pendelLabor');
  const toggle = page.locator('#psimToggle');

  const before = await frames(page);
  await expect(toggle).toHaveText('Start');
  await toggle.click();
  await expect(container).toHaveAttribute('data-psim-state', 'running');
  await expect(toggle).toHaveText('Pause');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await page.waitForTimeout(700);
  const whileRunning = await frames(page);
  expect(whileRunning).toBeGreaterThan(before + 10);
  const timeWhileRunning = await readNumber(page, '#psimTime');
  expect(timeWhileRunning).toBeGreaterThan(0.2);
  expect(Math.abs(await readNumber(page, '#psimTheta'))).toBeLessThan(25);

  await toggle.click();
  await expect(container).toHaveAttribute('data-psim-state', 'paused');
  await expect(page.locator('#psimStatus')).toContainText('Pausiert');
  await expect(toggle).toHaveText('Start');

  const afterStop = await frames(page);
  const timeAtStop = await page.locator('#psimTime').textContent();
  await page.waitForTimeout(600);
  // Kein weiterer Frame: Stop hat die Schleife beendet, nicht nur pausiert.
  expect(await frames(page)).toBe(afterStop);
  await expect(page.locator('#psimTime')).toHaveText(timeAtStop);
  expect(log.pageErrors).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
});

test('Routenwechsel beendet die Schleife und das Labor startet danach in Ruhe', async ({ page }) => {
  await countFrames(page);
  const log = collect(page);
  await page.goto(url(LAB));
  await page.locator('#psimToggle').click();
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    location.hash = '#pendeln/methodik';
  });
  await expect(page.locator('#pendelnRoot h1')).toHaveText('Methodik & Grenzen');

  const afterLeave = await frames(page);
  await page.waitForTimeout(600);
  expect(await frames(page)).toBe(afterLeave);

  await page.evaluate(() => {
    location.hash = '#pendeln/labor';
  });
  await expect(page.locator('#pendelnRoot h1')).toHaveText('Pendellabor');
  await expect(page.locator('#pendelLabor')).toHaveAttribute('data-psim-state', 'idle');
  await expect(page.locator('#psimTime')).toHaveText('0,00 s');
  await expect(page.locator('#psimPeriodMeasured')).toHaveText('—');
  expect(log.pageErrors).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
});

test('Gemessene Dauer stimmt mit der Formel überein', async ({ page }) => {
  await page.goto(url(LAB));
  await page.locator('#psimLength').evaluate((element) => {
    element.value = '100';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#psimAmplitude').evaluate((element) => {
    element.value = '5';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#psimDamping').evaluate((element) => {
    element.value = '0';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#psimToggle').click();
  await expect(page.locator('#psimPeriodMeasured')).not.toHaveText('—', { timeout: 8000 });
  const measured = await readNumber(page, '#psimPeriodMeasured');
  const formula = await readNumber(page, '#psimPeriodIdeal');
  expect(formula).toBeCloseTo(2.006, 2);
  expect(Math.abs(measured - formula) / formula).toBeLessThan(0.01);

  // Zeit läuft monoton weiter.
  const t1 = await readNumber(page, '#psimTime');
  await page.waitForTimeout(500);
  const t2 = await readNumber(page, '#psimTime');
  expect(t2).toBeGreaterThan(t1);
});

test('Tastatur: Leertaste auf der Bühne und Enter auf dem Startknopf', async ({ page }) => {
  await page.goto(url(LAB));
  const container = page.locator('#pendelLabor');
  const scene = page.locator('#psimScene');

  await scene.focus();
  await expect(scene).toBeFocused();
  await page.keyboard.press('Space');
  await expect(container).toHaveAttribute('data-psim-state', 'running');
  await page.keyboard.press('Space');
  await expect(container).toHaveAttribute('data-psim-state', 'paused');

  await page.locator('#psimToggle').focus();
  await page.keyboard.press('Enter');
  await expect(container).toHaveAttribute('data-psim-state', 'running');
  await page.locator('#psimToggle').focus();
  await page.keyboard.press('Space');
  await expect(container).toHaveAttribute('data-psim-state', 'paused');

  // Regler sind per Pfeiltaste bedienbar (natives range-Verhalten).
  await page.locator('#psimAmplitude').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#psimAmplitudeValue')).toHaveText('26,0°');
});

test('Reduzierte Bewegung: kein Dauerlauf, Schritte nur auf Klick', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await countFrames(page);
  await page.goto(url(LAB));
  const container = page.locator('#pendelLabor');

  await expect(container).toHaveAttribute('data-psim-motion', 'reduced');
  await expect(page.locator('#psimStep')).toBeVisible();
  await expect(page.locator('#psimStep')).toHaveText('Schritt 0,5 s');
  await expect(page.locator('#psimToggle')).toBeHidden();
  await expect(page.locator('#psimStatus')).toContainText('Reduzierte Bewegung');

  const before = await frames(page);
  await page.waitForTimeout(500);
  expect(await frames(page)).toBe(before);

  await page.locator('#psimStep').click();
  await expect(page.locator('#psimTime')).toHaveText('0,50 s');
  const angle1 = await readNumber(page, '#psimTheta');
  await page.locator('#psimStep').click();
  await expect(page.locator('#psimTime')).toHaveText('1,00 s');
  const angle2 = await readNumber(page, '#psimTheta');
  expect(angle1).not.toBe(angle2);
  expect(await frames(page)).toBe(before);
});

test.describe('mobile Bedienung', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('Touch: kein Überlauf, große Ziele, Start per Tap', async ({ page }) => {
    await page.goto(url(LAB));
    const overflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewport + 1);

    const box = await page.locator('#psimToggle').boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    const sceneBox = await page.locator('#psimScene').boundingBox();
    expect(sceneBox.width).toBeLessThanOrEqual(overflow.viewport);
    const sliderBox = await page.locator('#psimLength').boundingBox();
    expect(sliderBox.height).toBeGreaterThanOrEqual(44);

    await page.locator('#psimToggle').tap();
    await expect(page.locator('#pendelLabor')).toHaveAttribute('data-psim-state', 'running');
    await page.waitForTimeout(500);
    const angle = await readNumber(page, '#psimTheta');
    expect(Number.isFinite(angle)).toBe(true);
    await page.locator('#psimToggle').tap();
    await expect(page.locator('#pendelLabor')).toHaveAttribute('data-psim-state', 'paused');
  });
});

test('Werkstatt-Karte der Startseite führt ins Labor', async ({ page }) => {
  await page.goto(url('#pendeln'));
  const card = page.locator('.rad-werk', { hasText: 'Pendellabor' });
  await expect(card.locator('.rad-werk-state')).toHaveText('Verfügbar');
  await card.locator('.rad-werk-link').click();
  await expect(page).toHaveURL(/#pendeln\/labor$/);
  await expect(page.locator('#pendelnRoot h1')).toHaveText('Pendellabor');
  await expect(page.locator('#pendelLabor')).toBeVisible();
});

test('file://-Build: Pendellabor lädt offline und rechnet', async ({ page }) => {
  const localFile = path.resolve(__dirname, '..', 'Lokal.html');
  const requests = [];
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => {
    const target = request.url();
    if (/^https?:/i.test(target)) requests.push(target);
  });

  await page.goto(`${pathToFileURL(localFile).href}#pendeln/labor`);
  await expect(page.locator('#pendelnRoot h1')).toHaveText('Pendellabor');
  await expect(page.locator('#pendelLabor')).toBeVisible();
  await expect(page.locator('#psimPeriodIdeal')).toHaveText('1,003 s');

  await page.locator('#psimToggle').click();
  await page.waitForTimeout(600);
  expect(await readNumber(page, '#psimTime')).toBeGreaterThan(0.2);
  await page.locator('#psimToggle').click();

  expect(requests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
