// Pendeltagebuch (RAD-10) — Browsertests der echten Route #pendeln/journal.
//
// Geprüft werden die Abnahmekriterien der Karte: erreichbare Route, CRUD über
// die Oberfläche, Pflichtfelder und Grenzen, literale Anzeige von Markup,
// Export (JSON/CSV) mit anschließendem Import, atomare Ablehnung eines
// defekten Imports, bestätigte vollständige Löschung aller `esot_rad_`-Schlüssel,
// die Übernahme eines abgeschlossenen Laufs aus RAD-09, mobile Darstellung,
// ein gesperrter Speicher (In-Memory-Fallback) und der file://-Build.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('playwright/test');

const BASE = process.env.E2E_BASE || `http://127.0.0.1:${process.env.E2E_PORT || 3100}/Esoterik-Welt`;
const url = (hash = '') => `${BASE}/${hash}`;
const ROUTE = '#pendeln/journal';
const JOURNAL_KEY = 'esot_rad_journal_v1';
const EXPERIMENT_KEY = 'esot_rad_experiment_v1';
const EVIDENCE = path.join(__dirname, '..', 'docs', 'radiasthesie-completion', 'RAD-10', 'evidence');
fs.mkdirSync(EVIDENCE, { recursive: true });

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

const openJournal = async (page) => {
  await page.goto(url(ROUTE));
  await expect(page.locator('#pendelJournal')).toBeVisible();
  await expect(page.locator('#jrForm')).toBeVisible();
};

const fillForm = async (page, fields = {}) => {
  const {
    date = '2026-11-02',
    question = 'Trifft das Pendel das verdeckte Ziel häufiger als der Zufall?',
    prediction = 'Ja, etwa sieben von zehn Versuchen.',
    method = 'pendeln',
    confidence = '4',
    result = 'Sechs von zehn Versuchen.',
    review = 'Die Frage war zu weit gefasst.',
  } = fields;
  if (date) await page.locator('#jrDate').fill(date);
  if (question) await page.locator('#jrQuestion').fill(question);
  if (method) await page.locator('#jrMethod').selectOption(method);
  if (confidence) await page.locator('#jrConfidence').selectOption(confidence);
  if (prediction) await page.locator('#jrPrediction').fill(prediction);
  if (result) await page.locator('#jrResult').fill(result);
  if (review) await page.locator('#jrReview').fill(review);
};

const save = async (page) => {
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrStatus')).not.toHaveText(/^Bereit\./);
};

const storedJournal = (page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return { schema: parsed.schema, savedAt: parsed.savedAt, entries: parsed.data };
    } catch {
      return { error: true, raw };
    }
  }, JOURNAL_KEY);

const downloadOf = async (page, selector) => {
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator(selector).click()]);
  const file = await download.path();
  return { name: download.suggestedFilename(), text: fs.readFileSync(file, 'utf8') };
};

test('Route, Formular und ehrlicher Leerzustand', async ({ page }) => {
  const log = collect(page);
  await openJournal(page);

  await expect(page.locator('#pendeln-title')).toHaveText('Pendeltagebuch');
  await expect(page).toHaveTitle(/^Pendeltagebuch —/);
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);
  await expect(page.locator('#jrEmpty')).toBeVisible();

  // Alle Pflichtfelder der Anforderung sind vorhanden und beschriftet.
  for (const [id, label] of [
    ['jrDate', 'Datum'],
    ['jrQuestion', 'Frage oder Versuch'],
    ['jrMethod', 'Verwendete Methode'],
    ['jrPrediction', 'Eigene Vorhersage'],
    ['jrConfidence', 'Subjektive Sicherheit'],
    ['jrResult', 'Tatsächliches Ergebnis'],
    ['jrReview', 'Spätere Bewertung'],
  ]) {
    await expect(page.locator(`label[for="${id}"]`)).toHaveText(new RegExp(label));
  }

  await expect(page.locator('#jrExportJson')).toBeDisabled();
  await expect(page.locator('#jrExportCsv')).toBeDisabled();
  await expect(page.locator('#jrExportRuns')).toBeDisabled();
  await expect(page.locator('#jrDeleteAll')).toBeVisible();
  await expect(page.locator('#jrStorageNote')).toContainText('0 von 500');
  await expect(page.locator('#pendelnRoot')).toContainText('ohne Konto');
  await expect(page.locator('#pendelnRoot')).toContainText('Kein Nachweis');

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
  expect(log.external).toEqual([]);
  await page.screenshot({ path: path.join(EVIDENCE, 'desktop-leerzustand.png'), fullPage: false });
});

test('CRUD: anlegen, lesen, bearbeiten, einzeln löschen — über Reload hinweg', async ({ page }) => {
  const log = collect(page);
  await openJournal(page);

  await fillForm(page);
  await save(page);
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#jrStatus')).toContainText('Eintrag gespeichert');
  await expect(page.locator('.jr-entry summary')).toContainText('Trifft das Pendel');

  // Details lesen: Datum, Methode, Sicherheit, Ergebnis, Bewertung.
  await page.locator('.jr-entry summary').click();
  await expect(page.locator('.jr-entry')).toContainText('02.11.2026');
  await expect(page.locator('.jr-entry')).toContainText('Pendeln');
  await expect(page.locator('.jr-entry')).toContainText('4 von 5 · eher sicher');
  await expect(page.locator('.jr-entry')).toContainText('Sechs von zehn Versuchen.');
  await expect(page.locator('.jr-entry')).toContainText('Die Frage war zu weit gefasst.');
  await page.screenshot({ path: path.join(EVIDENCE, 'desktop-eintrag.png'), fullPage: false });

  const first = await storedJournal(page);
  expect(first.schema).toBe(1);
  expect(first.entries).toHaveLength(1);
  const id = first.entries[0].id;
  expect(first.entries[0]).toMatchObject({
    date: '2026-11-02',
    method: 'pendeln',
    confidence: 4,
    result: 'Sechs von zehn Versuchen.',
  });

  await page.reload();
  await expect(page.locator('#pendelJournal')).toBeVisible();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1);

  // Bearbeiten: Kennung und Erstellzeit bleiben, geleerte Felder verschwinden.
  await page.locator('.jr-entry summary').click();
  await page.locator('button[data-action="edit"]').click();
  await expect(page.locator('#jr-form-title')).toHaveText('Eintrag bearbeiten');
  await expect(page.locator('#jrSave')).toHaveText('Änderungen speichern');
  await expect(page.locator('#jrQuestion')).toHaveValue(/Trifft das Pendel/);
  await page.locator('#jrQuestion').fill('Trifft das Pendel das verdeckte Ziel?');
  await page.locator('#jrResult').fill('');
  await page.locator('#jrReview').fill('Im Rückblick war die Frage zu weit gefasst.');
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrStatus')).toContainText('aktualisiert');

  const edited = await storedJournal(page);
  expect(edited.entries).toHaveLength(1);
  expect(edited.entries[0].id).toBe(id);
  expect(edited.entries[0].createdAt).toBe(first.entries[0].createdAt);
  expect(edited.entries[0].question).toBe('Trifft das Pendel das verdeckte Ziel?');
  expect(edited.entries[0].result).toBeUndefined();
  expect(edited.entries[0].review).toBe('Im Rückblick war die Frage zu weit gefasst.');

  await page.reload();
  await expect(page.locator('.jr-entry')).toContainText('Im Rückblick war die Frage');

  // Einzeln löschen: erster Klick schaltet scharf, zweiter löscht.
  await page.locator('.jr-entry summary').click();
  await page.locator('button[data-action="delete"]').click();
  await expect(page.locator('button[data-action="delete"]')).toHaveText('Wirklich löschen?');
  expect(await page.locator('#jrEntries .jr-entry').count()).toBe(1);
  await page.locator('button[data-action="delete"]').click();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);
  await expect(page.locator('#jrStatus')).toContainText('Eintrag gelöscht');

  await page.reload();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);
  expect((await storedJournal(page)).entries).toHaveLength(0);

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
});

test('Pflichtfelder, Grenzen und Markup werden literal behandelt', async ({ page }) => {
  const log = collect(page);
  await openJournal(page);

  // Datum leeren: kein stilles „heute“, sondern ein Fehler am Feld.
  await page.locator('#jrDate').fill('');
  await page.locator('#jrQuestion').fill('Gültige Frage');
  await page.locator('#jrPrediction').fill('Gültige Vorhersage');
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrError')).toBeVisible();
  await expect(page.locator('#jrError')).toContainText(/Datum|date/i);
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);
  await expect(page.locator('#jrDate')).toHaveAttribute('aria-invalid', 'true');

  // Zu kurze Frage wird abgelehnt.
  await page.locator('#jrDate').fill('2026-11-02');
  await page.locator('#jrQuestion').fill('ab');
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrError')).toContainText(/Frage/);
  await expect(page.locator('#jrQuestion')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);

  // Fehlende Vorhersage wird abgelehnt.
  await page.locator('#jrQuestion').fill('Gültige Frage');
  await page.locator('#jrPrediction').fill('');
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrError')).toContainText(/Vorhersage/);
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);

  // Markup bleibt Text: es wird angezeigt, nicht ausgeführt.
  const payload = '<script>window.__jrXss = 1</script>';
  await page.locator('#jrPrediction').fill('Vorhersage mit Markup');
  await page.locator('#jrQuestion').fill(payload);
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1);
  await expect(page.locator('.jr-entry summary')).toContainText('<script>window.__jrXss = 1</script>');
  expect(await page.evaluate(() => window.__jrXss)).toBeUndefined();
  const summaryHtml = await page.locator('.jr-entry summary').innerHTML();
  expect(summaryHtml).toContain('&lt;script&gt;');
  expect(summaryHtml).not.toContain('<script>window.__jrXss');

  const stored = await storedJournal(page);
  expect(stored.entries[0].question).toBe(payload);

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
});

test('Export (JSON/CSV) und Import: Rundlauf, Atomarität, Dateiimport', async ({ page }) => {
  const log = collect(page);
  await openJournal(page);
  await fillForm(page, { question: 'Erste Frage zum Pendeln', result: 'Erstes Ergebnis; mit Semikolon' });
  await save(page);
  await fillForm(page, {
    date: '2026-11-01',
    question: 'Zweite Frage mit "Anführungszeichen"',
    prediction: 'Vorhersage zwei',
    result: 'Zeile eins\nZeile zwei',
    method: 'tafelarbeit',
    confidence: '2',
  });
  await save(page);
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(2);

  const json = await downloadOf(page, '#jrExportJson');
  expect(json.name).toMatch(/^radiasthesie-journal-\d{4}-\d{2}-\d{2}\.json$/);
  const envelope = JSON.parse(json.text);
  expect(envelope.kind).toBe('journal');
  expect(envelope.app).toBe('esoterik-welt');
  expect(envelope.schema).toBe(1);
  expect(envelope.data).toHaveLength(2);

  const csv = await downloadOf(page, '#jrExportCsv');
  expect(csv.name).toMatch(/^radiasthesie-journal-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(csv.text.charCodeAt(0)).toBe(0xfeff);
  const lines = csv.text.replace(/^\uFEFF/, '').split('\r\n');
  expect(lines[0]).toBe('Datum;Frage;Methode;Vorhersage;Sicherheit;Ergebnis;Bewertung;Experiment;Lauf;Erstellt am');
  expect(csv.text).toContain(';Pendeln;');
  expect(csv.text).toContain('"Zweite Frage mit ""Anführungszeichen"""');
  expect(csv.text).toContain('"Zeile eins\nZeile zwei"');

  // Bestand lokal leeren, dann den Export wieder einlesen.
  await page.evaluate((key) => localStorage.removeItem(key), JOURNAL_KEY);
  await page.reload();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);

  await page.locator('.jr-import summary').click();
  await page.locator('#jrImportText').fill(json.text);
  await page.locator('#jrImportApply').click();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(2, { timeout: 5000 });
  await expect(page.locator('#jrStatus')).toContainText('hinzugefügt');

  // Atomare Ablehnung: ein ungültiger Eintrag, nichts wird übernommen.
  const broken = JSON.parse(json.text);
  broken.data[1].question = '';
  await page.locator('#jrImportText').fill(JSON.stringify(broken));
  await page.locator('#jrImportApply').click();
  await expect(page.locator('#jrError')).toContainText(/Frage/);
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(2);
  await expect(page.locator('#jrStatus')).toContainText('Nichts importiert');

  // Dateiimport: Inhalt leeren und dieselbe Datei über den Dateiwähler laden.
  await page.evaluate((key) => localStorage.removeItem(key), JOURNAL_KEY);
  await page.reload();
  await page.locator('.jr-import summary').click();
  await page.locator('#jrImportFile').setInputFiles({
    name: 'tagebuch.json',
    mimeType: 'application/json',
    buffer: Buffer.from(json.text, 'utf8'),
  });
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(2, { timeout: 5000 });

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
});

test('vollständige Löschung: erst scharf, dann alle esot_rad_-Schlüssel weg', async ({ page }) => {
  const log = collect(page);
  await openJournal(page);
  await fillForm(page);
  await save(page);
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1);

  // Fremde und eigene Schlüssel anlegen: nur die eigenen dürfen verschwinden.
  await page.evaluate(
    ([journal, experiment]) => {
      localStorage.setItem(experiment, '{"schema":1,"savedAt":"2026-11-03T00:00:00.000Z","data":[]}');
      localStorage.setItem('esot_rad_studio_v1', '{"schema":1,"data":{}}');
      localStorage.setItem('esot_rad_corrupt_esot_rad_journal_v1_20261103', '{kaputt');
      localStorage.setItem('fremder_schluessel', 'bleibt');
      localStorage.setItem(journal, localStorage.getItem(journal));
    },
    [JOURNAL_KEY, EXPERIMENT_KEY]
  );

  // Erster Klick löscht nichts.
  await page.locator('#jrDeleteAll').click();
  await expect(page.locator('#jrDeleteAll')).toHaveText('Wirklich alle eigenen Daten löschen?');
  await expect(page.locator('#jrStatus')).toContainText('scharf geschaltet');
  await page.waitForTimeout(250); // Übergang für den Nachweis abwarten
  await page.screenshot({ path: path.join(EVIDENCE, 'desktop-loeschen-scharf.png'), fullPage: false });
  expect(await page.evaluate(() => localStorage.getItem('fremder_schluessel'))).toBe('bleibt');
  expect(await page.evaluate((key) => localStorage.getItem(key), JOURNAL_KEY)).not.toBeNull();

  // Zweiter Klick löscht alles mit Präfix esot_rad_.
  await page.locator('#jrDeleteAll').click();
  await expect(page.locator('#jrStatus')).toContainText('Alle eigenen Daten gelöscht');
  const remaining = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(remaining).toContain('fremder_schluessel');
  expect(remaining.filter((key) => key.startsWith('esot_rad_'))).toEqual([]);
  expect(remaining).not.toContain(JOURNAL_KEY);
  expect(remaining).not.toContain(EXPERIMENT_KEY);
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);
  await expect(page.locator('#jrStorageNote')).toContainText('0 von 500');
  await expect(page.locator('#jrRunsEmpty')).toBeVisible();
  await expect(page.locator('#jrRunsNote')).toContainText('nur vollständig enthüllte Läufe');

  await page.reload();
  await expect(page.locator('#pendelJournal')).toBeVisible();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
});

test('Interaktion Journal ↔ Labor: abgeschlossenen Lauf übernehmen, ohne ihn zu verändern', async ({ page }) => {
  test.setTimeout(180000);
  const log = collect(page);

  // Einen vollständigen, vorregistrierten Lauf im Labor durchführen.
  await page.goto(url('#pendeln/experiment'));
  await expect(page.locator('#experimentLabor')).toBeVisible();
  await page.locator('#expStart').click();
  for (let index = 1; index <= 20; index += 1) {
    await page.locator('#expAnswers .exp-answer').first().click();
    await page.locator('#expLock').click();
    await expect(page.locator('#expReveal')).toBeVisible();
    if (index < 20) await page.locator('#expNext').click();
  }
  await expect(page.locator('#expTrialCounter')).toHaveText(/Alle 20 Versuche abgeschlossen|Versuch 20 von 20/);
  const runBefore = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).data[0], EXPERIMENT_KEY);
  expect(runBefore.trials).toHaveLength(20);
  expect(runBefore.status).toBe('complete');

  // Tagbuch öffnen: der Lauf wird angeboten.
  await page.locator('#expStatus').waitFor();
  await page.goto(url(ROUTE));
  await expect(page.locator('#pendelJournal')).toBeVisible();
  await expect(page.locator('#jrRuns .jr-run')).toHaveCount(1);
  await expect(page.locator('#jrRuns .jr-run')).toContainText(runBefore.runId);
  await expect(page.locator('#jrRuns .jr-run')).toContainText(/\d+\/20 Treffer/);
  await expect(page.locator('#jrRuns .jr-run')).toContainText(/abgeschlossen \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
  await expect(page.locator('#jrRunsEmpty')).toBeHidden();

  // Ohne Frage keine Übernahme.
  await page.locator('button[data-action="take"]').click();
  await expect(page.locator('#jrStatus')).toContainText('fehlt die Frage');
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(0);

  await page.locator('#jrRuns .jr-run input').fill('Trifft das Pendel das verdeckte Ziel?');
  await page.locator('button[data-action="take"]').click();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#jrStatus')).toContainText('übernommen');
  await expect(page.locator('#jrRuns .jr-run')).toContainText('Bereits übernommen');
  await expect(page.locator('#jrRuns .jr-run')).not.toContainText('Ins Tagebuch übernehmen');
  await page.screenshot({ path: path.join(EVIDENCE, 'desktop-labor-uebernahme.png'), fullPage: false });

  const entries = (await storedJournal(page)).entries;
  expect(entries).toHaveLength(1);
  expect(entries[0].experimentId).toBe(runBefore.experimentId);
  expect(entries[0].runId).toBe(runBefore.runId);
  expect(entries[0].method).toBe('verblindeter-selbsttest');
  expect(entries[0].prediction).toContain('Vorregistriert');
  expect(entries[0].prediction).toContain('n=20');
  expect(entries[0].result).toContain('Treffer bei Zufallserwartung');

  await page.locator('.jr-entry summary').click();
  await expect(page.locator('.jr-entry')).toContainText(runBefore.experimentId);
  await expect(page.locator('.jr-entry')).toContainText('im Labor vorhanden');

  // Der Lauf bleibt unverändert — kein Feld des Labors wurde geschrieben.
  const runAfter = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).data[0], EXPERIMENT_KEY);
  expect(runAfter.trials).toHaveLength(runBefore.trials.length);
  expect(runAfter.trials.filter((trial) => trial.resultRevealed).length).toBe(20);
  expect(JSON.stringify(runAfter)).toBe(JSON.stringify(runBefore));

  // Nach Reload bleibt der Eintrag und der Lauf gilt weiter als übernommen.
  await page.reload();
  await expect(page.locator('#pendelJournal')).toBeVisible();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1);
  await expect(page.locator('#jrRuns .jr-run')).toContainText('Bereits übernommen');

  // Das Labor zeigt seinen Lauf weiterhin.
  await page.goto(url('#pendeln/experiment'));
  await expect(page.locator('#expRuns .exp-runlist-item')).toHaveCount(1);

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
  expect(log.external).toEqual([]);
});

test('mobil: kein Überlauf, bedienbare Ziele und Tastaturfokus', async ({ page }) => {
  const log = collect(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openJournal(page);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  const heights = await page
    .locator('#jrForm input, #jrForm textarea, #jrForm select, #jrForm .btn')
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.offsetParent !== null && node.getBoundingClientRect().height > 0)
        .map((node) => Math.round(node.getBoundingClientRect().height))
    );
  expect(heights.length).toBeGreaterThan(6);
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);

  // Tastatur: Fokus läuft in DOM-Reihenfolge von der Frage zur Methode.
  // (Ein `input type="date"` hat interne Segmente; Tab bleibt dort zunächst
  // im Feld und ist als Reihenfolgetest ungeeignet.)
  await page.locator('#jrQuestion').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#jrMethod')).toBeFocused();

  await fillForm(page, { question: 'Mobile Frage zum Pendelversuch' });
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1);
  await page.screenshot({ path: path.join(EVIDENCE, 'mobile-tagebuch.png'), fullPage: false });

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
});

test('gesperrter Speicher: Eintrag gilt sichtbar nur für diese Sitzung', async ({ page }) => {
  const log = collect(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  await page.goto(url(ROUTE));
  await expect(page.locator('#pendelJournal')).toBeVisible();
  await expect(page.locator('#jrStorageNote')).toContainText(/nur für diese Sitzung|Kein lokaler Speicher/);

  await fillForm(page);
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#jrStatus')).toContainText(/nur für diese Sitzung/);

  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
});

test('file://: Tagebuch speichert oder sagt ehrlich, dass es nur die Sitzung gilt', async ({ page }) => {
  const file = path.join(__dirname, '..', 'Lokal.html');
  test.skip(!fs.existsSync(file), 'Lokal.html fehlt — npm run build:local ausführen');
  const log = collect(page);
  await page.goto(`${pathToFileURL(file).href}${ROUTE}`);
  await expect(page.locator('#pendelJournal')).toBeVisible();
  await expect(page.locator('#jr-speicher')).toContainText('file://');
  await expect(page.locator('#jr-speicher')).toContainText('nicht garantiert');

  await fillForm(page, { question: 'Offline-Frage zum Pendelversuch' });
  await page.locator('#jrSave').click();
  await expect(page.locator('#jrEntries .jr-entry')).toHaveCount(1, { timeout: 5000 });

  await page.reload();
  await expect(page.locator('#pendelJournal')).toBeVisible();
  const count = await page.locator('#jrEntries .jr-entry').count();
  if (count === 0) {
    // Chromium kann localStorage für file:// verweigern. Dann muss die Seite
    // das sichtbar sagen — ein stiller Verlust wäre der Fehler.
    await expect(page.locator('#jrStorageNote')).toContainText(/nur für diese Sitzung|Kein lokaler Speicher/);
  } else {
    expect(count).toBe(1);
  }
  await page.locator('#jrEntries').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(EVIDENCE, 'file-offline-tagebuch.png'), fullPage: false });

  expect(log.external).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
});
