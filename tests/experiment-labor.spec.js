// Experimentierlabor (RAD-09) — Browsertests der echten Route #pendeln/experiment.
//
// Geprüft werden die Abnahmekriterien der Karte: erreichbare Route, strikt
// getrennte Modi, verdecktes Ziel ohne Leck in DOM/Speicher/Titel, Sperre vor
// Enthüllung, Unveränderlichkeit, Doppelklick, Moduswechsel, Reload mit und
// ohne gesperrte Antwort, vollständiger Lauf mit Auswertung, JSON- und
// CSV-Rohdaten, mobile Darstellung, der file://-Build und die Werkstatt-Karte.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('playwright/test');

const { E2E_BASE_URL: BASE } = require('./helpers/e2e-target.cjs');
const url = (hash = '') => `${BASE}/${hash}`;
const ROUTE = '#pendeln/experiment';
const STORAGE_KEY = 'esot_rad_experiment_v1';
const EVIDENCE = path.join(__dirname, '..', 'docs', 'radiasthesie-completion', 'RAD-09', 'evidence');

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
    if (
      !target.startsWith('http://127.0.0.1') &&
      !target.startsWith('data:') &&
      !target.startsWith('blob:') &&
      !target.startsWith('file:')
    ) {
      external.push(target);
    }
  });
  return { consoleErrors, pageErrors, external };
}

const openLab = async (page) => {
  await page.goto(url(ROUTE));
  await expect(page.locator('#experimentLabor')).toBeVisible();
  await expect(page.locator('#expStart')).toBeVisible();
};

const storedRun = (page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return { savedAt: parsed.savedAt, schema: parsed.schema, runs: parsed.data };
    } catch {
      return { error: true, raw };
    }
  }, STORAGE_KEY);

const chooseAnswer = async (page, index = 0) => {
  await page.locator('#expAnswers .exp-answer').nth(index).click();
  await expect(page.locator('#expAnswers .exp-answer').nth(index)).toHaveAttribute('aria-pressed', 'true');
};

const lockAnswer = async (page) => {
  await page.locator('#expLock').click();
  await expect(page.locator('#expReveal')).toBeVisible();
};

const completeTrial = async (page, index = 0, { next = true } = {}) => {
  await chooseAnswer(page, index);
  await lockAnswer(page);
  if (next) await page.locator('#expNext').click();
};

const downloadOf = async (page, selector) => {
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator(selector).click()]);
  const file = await download.path();
  return { name: download.suggestedFilename(), text: fs.readFileSync(file, 'utf8') };
};

test('Route, Modi und Protokoll sind getrennt sichtbar', async ({ page }) => {
  const log = collect(page);
  await openLab(page);

  await expect(page.locator('#pendeln-title')).toHaveText('Experimentierlabor');
  await expect(page.locator('input[name="expMode"][value="test"]')).toBeChecked();
  await expect(page.locator('[data-exp-panel="test"]')).toBeVisible();
  await expect(page.locator('[data-exp-panel="demo"]')).toBeHidden();

  // Drei vorregistrierte Experimente, jeweils mit Protokoll vor dem Start.
  await expect(page.locator('input[name="expExperiment"]')).toHaveCount(3);
  await expect(page.locator('[data-exp-protocol="exp-ja-nein-20"]')).toBeVisible();
  await expect(page.locator('[data-exp-protocol="exp-acht-orte-16"]')).toBeHidden();
  await expect(page.locator('[data-exp-protocol="exp-ja-nein-20"]')).toContainText('20 Versuche');
  await expect(page.locator('[data-exp-protocol="exp-ja-nein-20"]')).toContainText('Abbruchregel');
  await expect(page.locator('[data-exp-protocol="exp-ja-nein-20"]')).toContainText('Binomialtest');
  await expect(page.locator('[data-exp-protocol="exp-ja-nein-20"]')).toContainText('Wilson');

  await page.locator('input[name="expExperiment"][value="exp-acht-orte-16"]').check();
  await expect(page.locator('[data-exp-protocol="exp-acht-orte-16"]')).toBeVisible();
  await expect(page.locator('[data-exp-protocol="exp-ja-nein-20"]')).toBeHidden();
  await expect(page.locator('[data-exp-protocol="exp-acht-orte-16"]')).toContainText('12,5 %');

  // Spielmodus: sofortiges Feedback, keine Speicherung.
  await page.locator('input[name="expMode"][value="demo"]').check();
  await expect(page.locator('[data-exp-panel="demo"]')).toBeVisible();
  await expect(page.locator('[data-exp-panel="test"]')).toBeHidden();
  await expect(page.locator('.exp-badge')).toContainText('zählt nicht');
  await page.locator('#expDemoAnswers .exp-answer').first().click();
  await expect(page.locator('#expDemoCounter')).toContainText('1 Versuche');
  await expect(page.locator('#expDemoFeedback')).toContainText('Ziel');
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();

  await page.locator('#expDemoReset').click();
  await expect(page.locator('#expDemoCounter')).toContainText('0 Versuche');

  await page.locator('input[name="expMode"][value="test"]').check();
  await expect(page.locator('[data-exp-panel="test"]')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();

  // Die Werkstatt-Karte der Startseite verlinkt das Labor.
  await page.goto(url('#pendeln'));
  await expect(page.locator('a.rad-werk-link[href="#pendeln/experiment"]')).toHaveCount(1);

  await page.goto(url(ROUTE));
  await expect(page.locator('#experimentLabor')).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCE, 'desktop-moduswahl.png'), fullPage: false });

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
  expect(log.external).toEqual([]);
});

test('laufender Versuch: Ziel verdeckt, Sperre unveränderlich, Doppelklick zählt einmal', async ({ page }) => {
  const log = collect(page);
  await openLab(page);
  await page.locator('#expStart').click();
  await expect(page.locator('#expTrialPanel')).toBeVisible();
  await expect(page.locator('#expTrialCounter')).toHaveText('Versuch 1 von 20');
  await expect(page.locator('#expReveal')).toBeHidden();

  // Vor der Sperre: kein Ziel in DOM, Titel oder Speicher.
  const before = await page.evaluate(
    (key) => ({
      raw: localStorage.getItem(key),
      title: document.title,
      panel: document.querySelector('#expTrialPanel').textContent,
    }),
    STORAGE_KEY
  );
  expect(before.raw).toContain('targetCommitment');
  expect(before.raw).not.toContain('"salt"');
  expect(before.raw).not.toContain('"targetIndex"');
  expect(before.title).not.toContain('Ziel „');
  expect(before.panel).not.toContain('Ziel „');

  await page.screenshot({ path: path.join(EVIDENCE, 'desktop-versuch-verdeckt.png'), fullPage: false });

  await chooseAnswer(page, 1);
  // Zwei Klicks im selben Tick: Der zweite darf keinen zweiten Versuch anlegen.
  await page.evaluate(() => {
    const button = document.querySelector('#expLock');
    button.click();
    button.click();
  });
  await expect(page.locator('#expReveal')).toBeVisible();
  await expect(page.locator('#expRevealText')).toContainText(/Treffer|Kein Treffer/);
  await expect(page.locator('#expAnswers .exp-answer').first()).toBeDisabled();
  await expect(page.locator('#expLock')).toBeHidden();

  const after = await storedRun(page);
  expect(after.runs).toHaveLength(1);
  expect(after.runs[0].trials).toHaveLength(1);
  expect(after.runs[0].trials[0].predictionLocked.locked).toBe(true);
  expect(after.runs[0].trials[0].resultRevealed.targetIndex).toBeGreaterThanOrEqual(0);
  expect(JSON.stringify(after)).not.toContain('"salt"');

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
});

test('vollständiger Testlauf: 20 Versuche, Auswertung, JSON- und CSV-Export', async ({ page }) => {
  test.setTimeout(90000);
  const log = collect(page);
  await openLab(page);
  await page.locator('#expStart').click();
  await expect(page.locator('#expTrialCounter')).toHaveText('Versuch 1 von 20');

  // Erster Versuch ausführlich, danach bis zur festen Fallzahl durchziehen.
  await completeTrial(page, 0);
  for (let trial = 2; trial <= 20; trial += 1) {
    await expect(page.locator('#expTrialCounter')).toHaveText(`Versuch ${trial} von 20`);
    await chooseAnswer(page, trial % 2);
    await lockAnswer(page);
    if (trial < 20) await page.locator('#expNext').click();
  }

  await expect(page.locator('#expTrialCounter')).toHaveText('Alle 20 Versuche abgeschlossen');
  await expect(page.locator('#expAnswers .exp-answer').first()).toBeDisabled();
  await expect(page.locator('#expLock')).toBeHidden();
  await expect(page.locator('#expNext')).toBeHidden();

  const hits = await page.locator('#expStatHits').textContent();
  expect(hits).toMatch(/^\d+ von 20$/);
  await expect(page.locator('#expStatExpected')).toContainText('10,00 Treffer');
  await expect(page.locator('#expStatRate')).toContainText('%');
  await expect(page.locator('#expStatInterval')).toContainText('bis');
  await expect(page.locator('#expStatP')).toContainText('p');
  await expect(page.locator('#expStatStatus')).toContainText('abgeschlossen');
  await expect(page.locator('#expVerdict')).toContainText(/Zufall|auffällig/i);
  await expect(page.locator('#expMultiple')).toContainText('Lauf');
  await expect(page.locator('#expTrialBody tr')).toHaveCount(20);
  await expect(page.locator('#expExportJson')).toBeEnabled();
  await expect(page.locator('#expExportCsv')).toBeEnabled();

  const json = await downloadOf(page, '#expExportJson');
  expect(json.name).toMatch(/^radiasthesie-experiment-\d{4}-\d{2}-\d{2}\.json$/);
  const envelope = JSON.parse(json.text);
  expect(envelope.schema).toBe(1);
  expect(envelope.app).toBe('esoterik-welt');
  expect(envelope.kind).toBe('experiment');
  expect(envelope.data).toHaveLength(1);
  expect(envelope.data[0].trials).toHaveLength(20);
  expect(envelope.data[0].status).toBe('complete');
  expect(json.text).not.toContain('"salt"');
  expect(json.text).not.toContain('"secret"');

  const csv = await downloadOf(page, '#expExportCsv');
  expect(csv.name).toMatch(/^radiasthesie-experiment-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(csv.text.charCodeAt(0)).toBe(0xfeff);
  const lines = csv.text
    .replace(/^\uFEFF/, '')
    .trim()
    .split('\r\n');
  expect(lines).toHaveLength(21);
  expect(lines[0]).toBe(
    'Lauf;Experiment;Modus;Basiswahrscheinlichkeit;Versuch;Antwort;Antwortindex;Ziel;Zielindex;Treffer;Gesperrt am;Enthüllt am'
  );
  expect(lines[1]).toContain('exp-ja-nein-20;test;0,5;');

  await page.screenshot({ path: path.join(EVIDENCE, 'desktop-auswertung.png'), fullPage: false });

  // Nach dem Abschluss lässt sich ein neuer Lauf starten, der alte bleibt.
  await expect(page.locator('#expStart')).toHaveText('Neuen Lauf starten');
  await expect(page.locator('#expRuns .exp-runlist-item')).toHaveCount(1);

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
});

test('Reload: offener Lauf wird fortgesetzt, unterbrochener bleibt gesperrt und nicht auswertbar', async ({ page }) => {
  test.setTimeout(60000);
  await openLab(page);
  await page.locator('#expStart').click();
  await completeTrial(page, 0);
  await expect(page.locator('#expTrialCounter')).toHaveText('Versuch 2 von 20');

  await page.reload();
  await expect(page.locator('#experimentLabor')).toBeVisible();
  await expect(page.locator('#expTrialPanel')).toBeHidden();
  await expect(page.locator('#expResume')).toBeVisible();
  await page.locator('#expResume').click();
  await expect(page.locator('#expTrialCounter')).toHaveText('Versuch 2 von 20');

  // Zweiten Versuch sperren, dann einen Absturz zwischen Sperre und Enthüllung
  // nachstellen: gespeicherter Lauf behält die Sperre, verliert das Ergebnis.
  await chooseAnswer(page, 0);
  await page.locator('#expLock').click();
  await expect(page.locator('#expReveal')).toBeVisible();
  await page.evaluate((key) => {
    const parsed = JSON.parse(localStorage.getItem(key));
    const run = parsed.data[0];
    delete run.trials[1].resultRevealed;
    run.status = 'running';
    localStorage.setItem(key, JSON.stringify(parsed));
  }, STORAGE_KEY);

  await page.reload();
  await expect(page.locator('#expRuns')).toContainText('unterbrochen');
  await expect(page.locator('#expRuns')).toContainText('nicht auswertbar');
  await expect(page.locator('#expResume')).toBeHidden();

  const state = await storedRun(page);
  expect(state.runs[0].trials).toHaveLength(2);
  expect(state.runs[0].trials[1].predictionLocked.locked).toBe(true);
  expect(state.runs[0].trials[1].resultRevealed).toBeUndefined();
});

test('Moduswechsel mitten im Lauf verändert weder Zähler noch Statistik', async ({ page }) => {
  await openLab(page);
  await page.locator('#expStart').click();
  await completeTrial(page, 0);
  await expect(page.locator('#expTrialCounter')).toHaveText('Versuch 2 von 20');
  await expect(page.locator('#expStatHits')).toHaveText(/^\d+ von 1$/);

  await page.locator('input[name="expMode"][value="demo"]').check();
  for (let index = 0; index < 3; index += 1) {
    await page.locator('#expDemoAnswers .exp-answer').first().click();
  }
  await expect(page.locator('#expDemoCounter')).toContainText('3 Versuche');

  await page.locator('input[name="expMode"][value="test"]').check();
  await expect(page.locator('#expTrialCounter')).toHaveText('Versuch 2 von 20');
  await expect(page.locator('#expStatHits')).toHaveText(/^\d+ von 1$/);

  const state = await storedRun(page);
  expect(state.runs).toHaveLength(1);
  expect(state.runs[0].trials).toHaveLength(2);
  expect(state.runs[0].trials.filter((trial) => trial.resultRevealed)).toHaveLength(1);

  // Der unterbrochene Versuch 2 lässt sich weiterhin normal abschließen.
  await chooseAnswer(page, 0);
  await lockAnswer(page);
  await expect(page.locator('#expStatHits')).toHaveText(/^\d+ von 2$/);
});

test('mobile Darstellung ohne Überlauf und Start per Tastatur', async ({ page }) => {
  const log = collect(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openLab(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.locator('#expStart').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#expTrialPanel')).toBeVisible();
  const heights = await page
    .locator('#expAnswers .exp-answer')
    .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().height)));
  expect(heights.length).toBeGreaterThan(1);
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);

  await page.screenshot({ path: path.join(EVIDENCE, 'mobile-versuch.png'), fullPage: false });
  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
  expect(log.external).toEqual([]);
});

test('offline-Build (file://) rendert das Labor ohne Netz', async ({ page }) => {
  const file = path.join(__dirname, '..', 'Lokal.html');
  test.skip(!fs.existsSync(file), 'Lokal.html fehlt — npm run build:local ausführen');
  const log = collect(page);
  await page.goto(`${pathToFileURL(file).href}${ROUTE}`);
  await expect(page.locator('#experimentLabor')).toBeVisible();
  await page.locator('#expStart').click();
  await expect(page.locator('#expTrialCounter')).toHaveText('Versuch 1 von 20');
  await chooseAnswer(page, 0);
  await lockAnswer(page);
  await expect(page.locator('#expRevealText')).toContainText(/Treffer|Kein Treffer/);
  expect(log.external).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
});
