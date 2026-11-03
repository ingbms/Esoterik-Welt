// Pendeltafel-Studio (RAD-08) — Browsertests der echten Route #pendeln/studio.
//
// Geprüft werden die Abnahmekriterien der Karte: erreichbare Route, alle
// Vorlagen, freie Beschriftungen mit Umlauten, vier Farbstile, SVG- und
// JSON-Export mit Reimport, XSS-Abwehr über Tippen und Import, Importgrenzen,
// Druckansicht und PDF-Ausgabe über den Browser, Tastatur, mobile Überläufe,
// der file://-Build und die Werkstatt-Karte der Startseite.
//
// Die PDF-Prüfung ist bewusst eine echte Ausgabe: Chromium druckt die
// Druckansicht über page.pdf() in eine Datei; geprüft werden Dateisignatur,
// Seitengröße und Seitenzahl. Ein separater Screenshot mit print-Medien zeigt,
// was gedruckt wird.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('playwright/test');

const BASE = process.env.E2E_BASE || `http://127.0.0.1:${process.env.E2E_PORT || 3100}/Esoterik-Welt`;
const url = (hash = '') => `${BASE}/${hash}`;
const STUDIO = '#pendeln/studio';
const LABEL_LIMIT = 32 * 1024;
const EVIDENCE = path.join(__dirname, '..', 'docs', 'radiasthesie-completion', 'RAD-08', 'evidence');

function collect(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const external = [];
  const dialogs = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
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
  return { consoleErrors, pageErrors, external, dialogs };
}

const previewTexts = (page) =>
  page.locator('#ptfPreview svg text').evaluateAll((nodes) => nodes.map((node) => node.textContent));

const openStudio = async (page) => {
  await page.goto(url(STUDIO));
  await expect(page.locator('#pendeltafelStudio')).toBeVisible();
  await expect(page.locator('#ptfPreview svg')).toBeVisible();
};

// Komponentenaufnahme des Bedienfeldes. Für das Bild werden die klebende
// Vorschauspalte und der seitenweite Kopf auf statisch gestellt; sonst ragen
// sie beim Scrollen in die Elementaufnahme. Das ändert nur die Aufnahme,
// nicht die geprüfte Funktion.
async function shotStudio(page, name) {
  await page.addStyleTag({
    content:
      '.ptf-preview{position:static !important} .header{position:static !important} .skip-link{display:none !important}',
  });
  await page.locator('#pendeltafelStudio').screenshot({ path: path.join(EVIDENCE, name) });
}

const downloadOf = async (page, selector) => {
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator(selector).click()]);
  const file = await download.path();
  return { download, file, name: download.suggestedFilename(), text: fs.readFileSync(file, 'utf8') };
};

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCE, { recursive: true });
});

test('Route #pendeln/studio rendert das Studio ohne Konsolenfehler', async ({ page }) => {
  const log = collect(page);
  await page.goto(url(STUDIO));
  const root = page.locator('#pendelnRoot');
  await expect(root.locator('h1')).toHaveCount(1);
  await expect(root.locator('h1')).toHaveText('Pendeltafel-Studio');
  await expect(page).toHaveTitle('Pendeltafel-Studio — Tafeln beschriften und exportieren | Esoterik-Welt');
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description.length).toBeGreaterThan(80);
  expect(description.length).toBeLessThanOrEqual(180);

  await expect(page.locator('#ptfPreview svg')).toBeVisible();
  await expect(page.locator('#ptfSheetBoard svg')).toBeVisible();
  await expect(page.locator('.rad-disclaimer')).toContainText('Keine Messung');

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

  // Ein SVG, zwei Orte: Vorschau und Druckansicht zeigen dieselbe Zeichnung.
  // Die Druckansicht lässt nur die im Bild eingebackene Überschrift und
  // Fußzeile weg — beides steht dort als HTML, damit es nicht doppelt erscheint.
  const previewLabels = await previewTexts(page);
  const sheetLabels = await page
    .locator('#ptfSheetBoard svg text')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent));
  const labelOnly = previewLabels.slice(1, -2);
  expect(sheetLabels).toEqual(labelOnly);
  await expect(page.locator('#ptfSheetTitle')).toHaveText('Ja/Nein-Tafel');
  expect(sheetLabels).toEqual(['JA', 'NEIN']);
  const previewMarkup = await page.locator('#ptfPreview svg').innerHTML();
  const sheetMarkup = await page.locator('#ptfSheetBoard svg').innerHTML();
  expect(previewMarkup).not.toMatch(/<script/i);
  expect(sheetMarkup).not.toMatch(/<script/i);
  expect(sheetMarkup).not.toMatch(/\son[a-z]+\s*=/i);
  const previewRect = await page.locator('#ptfPreview svg rect').first().getAttribute('fill');
  const sheetRect = await page.locator('#ptfSheetBoard svg rect').first().getAttribute('fill');
  expect(sheetRect).toBe(previewRect);

  await shotStudio(page, 'desktop-studio-ja-nein.png');
  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
  expect(log.external).toEqual([]);
});

test('alle sechs Vorlagen füllen Beschriftungen und Zeichnung', async ({ page }) => {
  await openStudio(page);
  const presets = [
    { id: 'zahlenkreis', count: 10, first: '0' },
    { id: 'buchstaben', count: 26, first: 'A' },
    { id: 'segmente4', count: 4, first: 'JA' },
    { id: 'segmente6', count: 6, first: '1' },
    { id: 'segmente12', count: 12, first: '1' },
    { id: 'janain', count: 2, first: 'JA' },
  ];
  for (const preset of presets) {
    await page.locator('#ptfPreset').selectOption(preset.id);
    await expect(page.locator('#ptfPreview svg text')).toHaveCount(preset.count + 3);
    const texts = await previewTexts(page);
    expect(texts[1]).toBe(preset.first);
    const lines = (await page.locator('#ptfLabels').inputValue()).split('\n');
    expect(lines.length).toBe(preset.count);
    await expect(page.locator('#ptfStatus')).toContainText('Vorlage');
    await expect(page.locator('#ptfLabels')).not.toHaveAttribute('aria-invalid', 'true');
  }
  await page.locator('#ptfPreset').selectOption('buchstaben');
  await expect(page.locator('#ptfPreview svg')).toBeVisible();
  await shotStudio(page, 'desktop-studio-buchstaben.png');
});

test('freie Beschriftungen mit Umlauten und Sonderzeichen erscheinen korrekt', async ({ page }) => {
  const log = collect(page);
  await openStudio(page);
  await page.locator('#ptfLabels').fill('Nord\nOst\nSüd & West\nÜber\n„offen“\n50 %');
  await expect(page.locator('#ptfPreview svg text')).toHaveCount(9);
  await expect(page.locator('#ptfTitle')).toBeVisible();
  const texts = await previewTexts(page);
  expect(texts).toContain('Süd & West');
  expect(texts).toContain('„offen“');
  expect(texts).toContain('50 %');
  const markup = await page.locator('#ptfPreview svg').innerHTML();
  expect(markup).toContain('Süd &amp; West');
  expect(markup).not.toContain('Süd & West<');
  // Der Status bleibt ruhig; kein Fehler, kein aria-invalid.
  await expect(page.locator('#ptfLabels')).not.toHaveAttribute('aria-invalid', 'true');
  expect(log.consoleErrors).toEqual([]);
  await shotStudio(page, 'desktop-studio-umlaute.png');
});

test('Farbstil wechselt Zeichnung, Vorschau und Druckfläche', async ({ page }) => {
  await openStudio(page);
  const sheet = page.locator('#ptfSheet');
  await expect(sheet).toHaveAttribute('data-ptf-palette', 'messing');
  const messingFill = await page.locator('#ptfPreview svg rect').first().getAttribute('fill');
  expect(messingFill).toBe('#141c1f');

  await page.locator('input[name="ptfPalette"][value="papier"]').check();
  await expect(sheet).toHaveAttribute('data-ptf-palette', 'papier');
  const papierFill = await page.locator('#ptfPreview svg rect').first().getAttribute('fill');
  expect(papierFill).toBe('#fbf9f4');
  const background = await sheet.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(background).toBe('rgb(251, 249, 244)');

  await page.locator('input[name="ptfPalette"][value="salbei"]').check();
  expect(await page.locator('#ptfPreview svg rect').first().getAttribute('fill')).toBe('#101a17');
  await page.locator('input[name="ptfPalette"][value="nacht"]').check();
  expect(await page.locator('#ptfPreview svg rect').first().getAttribute('fill')).toBe('#0d141b');
  await shotStudio(page, 'desktop-studio-nachtrose.png');
});

test('XSS über das Textfeld wird abgelehnt und nicht ausgeführt', async ({ page }) => {
  const log = collect(page);
  await openStudio(page);
  const before = await page.locator('#ptfPreview svg').innerHTML();
  await page
    .locator('#ptfLabels')
    .fill('"><script>window.__ptfXss = 1</script>\n<img src=x onerror="window.__ptfXss = 2">');
  await expect(page.locator('#ptfLabelError')).toBeVisible();
  await expect(page.locator('#ptfLabelError')).toContainText('nicht erlaubt');
  await expect(page.locator('#ptfLabels')).toHaveAttribute('aria-invalid', 'true');
  // Vorschau bleibt beim letzten gültigen Stand.
  expect(await page.locator('#ptfPreview svg').innerHTML()).toBe(before);
  expect(await page.evaluate(() => window.__ptfXss)).toBeUndefined();
  expect(await page.locator('#ptfPreview svg script, #ptfPreview svg img').count()).toBe(0);
  expect(log.dialogs).toEqual([]);
  expect(log.pageErrors).toEqual([]);
  // Kein Download mit ungültigem Inhalt.
  await page.locator('#ptfDownloadSvg').click();
  await expect(page.locator('#ptfStatus')).toContainText('nicht gültig');
});

test('Import aus dem Textfeld übernimmt eine gültige Konfiguration', async ({ page }) => {
  const log = collect(page);
  await openStudio(page);
  const config = {
    schema: 'esow.pendeltafel/1',
    preset: 'segmente12',
    title: 'Farbkategorien & Maße',
    palette: 'salbei',
    labels: ['Rot', 'Orange', 'Gelb', 'Grün', 'Türkis', 'Blau', 'Violett', 'Rosa', 'Weiß', 'Grau', 'Schwarz', 'Gold'],
  };
  await page.locator('#ptf-import summary').click();
  await page.locator('#ptfImportText').fill(JSON.stringify(config, null, 2));
  await page.locator('#ptfImportApply').click();
  await expect(page.locator('#ptfStatus')).toContainText('Import aus Textfeld übernommen');
  await expect(page.locator('#ptfPreview svg text')).toHaveCount(15);
  await expect(page.locator('#ptfSheetTitle')).toHaveText('Farbkategorien & Maße');
  await expect(page.locator('#ptfSheet')).toHaveAttribute('data-ptf-palette', 'salbei');
  await expect(page.locator('input[name="ptfPalette"][value="salbei"]')).toBeChecked();
  expect(await page.locator('#ptfLabels').inputValue()).toContain('Türkis');
  expect(await page.locator('#ptfErrors').isHidden()).toBe(true);
  expect(log.consoleErrors).toEqual([]);
});

test('Import aus einer Datei wird geprüft und übernommen', async ({ page }) => {
  await openStudio(page);
  const config = {
    schema: 'esow.pendeltafel/1',
    preset: 'segmente6',
    title: 'Import aus Datei',
    palette: 'papier',
    labels: ['Nord', 'Ost', 'Süd', 'West', 'Oben', 'Unten'],
  };
  await page.locator('#ptf-import summary').click();
  await page.locator('#ptfImportFile').setInputFiles({
    name: 'tafel.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(config), 'utf8'),
  });
  await expect(page.locator('#ptfStatus')).toContainText('Import aus Datei „tafel.json“');
  await expect(page.locator('#ptfPreview svg text')).toHaveCount(9);
  await expect(page.locator('#ptfSheetTitle')).toHaveText('Import aus Datei');
  expect(await page.locator('#ptfLabels').inputValue()).toBe(config.labels.join('\n'));
});

test('ungültige Importe werden mit konkreten Fehlern abgelehnt', async ({ page }) => {
  await openStudio(page);
  await page.locator('#ptf-import summary').click();
  const before = await page.locator('#ptfPreview svg').innerHTML();
  const cases = [
    {
      name: 'unbekanntes Feld',
      payload: {
        schema: 'esow.pendeltafel/1',
        preset: 'janain',
        title: 'T',
        palette: 'messing',
        labels: ['A', 'B'],
        onload: 'alert(1)',
      },
      expected: 'Unbekanntes Feld',
    },
    {
      name: 'falsches Schema',
      payload: { schema: 'esow.pendeltafel/9', preset: 'janain', title: 'T', palette: 'messing', labels: ['A', 'B'] },
      expected: 'schema',
    },
    {
      name: 'zu viele Segmente',
      payload: {
        schema: 'esow.pendeltafel/1',
        preset: 'segmente12',
        title: 'T',
        palette: 'messing',
        labels: Array.from({ length: 49 }, (_, index) => String(index + 1)),
      },
      expected: 'Höchstens 48 Segmente',
    },
    {
      name: 'Markup in der Beschriftung',
      payload: {
        schema: 'esow.pendeltafel/1',
        preset: 'janain',
        title: 'T',
        palette: 'messing',
        labels: ['<script>alert(1)</script>', 'B'],
      },
      expected: 'nicht erlaubt',
    },
    {
      name: 'kaputtes JSON',
      payload: '{"schema": ',
      expected: 'Kein gültiges JSON',
    },
  ];
  for (const item of cases) {
    const text = typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload);
    await page.locator('#ptfImportText').fill(text);
    await page.locator('#ptfImportApply').click();
    await expect(page.locator('#ptfErrors')).toBeVisible();
    await expect(page.locator('#ptfErrors')).toContainText(item.expected);
    await expect(page.locator('#ptfStatus')).toContainText('abgelehnt');
    expect(await page.locator('#ptfPreview svg').innerHTML()).toBe(before);
  }
  expect(await page.locator('#ptfPreview svg script').count()).toBe(0);
});

test('Importgrenze von 32 KiB wird vor dem Parsen geprüft', async ({ page }) => {
  await openStudio(page);
  await page.locator('#ptf-import summary').click();
  const oversized = `{"schema":"esow.pendeltafel/1","labels":["${'x'.repeat(LABEL_LIMIT + 512)}"]}`;
  expect(Buffer.byteLength(oversized)).toBeGreaterThan(LABEL_LIMIT);
  await page.locator('#ptfImportText').fill(oversized);
  await page.locator('#ptfImportApply').click();
  await expect(page.locator('#ptfErrors')).toContainText('erlaubt sind höchstens 32768 Bytes');
  await expect(page.locator('#ptfStatus')).toContainText('abgelehnt');
  // Auch die Dateiauswahl prüft die Größe, ohne die Datei zu lesen.
  await page.locator('#ptfImportFile').setInputFiles({
    name: 'zu-gross.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(LABEL_LIMIT + 1024, 0x20),
  });
  await expect(page.locator('#ptfErrors')).toContainText('Datei ist');
  await expect(page.locator('#ptfStatus')).toContainText('zu groß');
});

test('SVG-Download erzeugt eine eigenständige, skriptfreie Datei', async ({ page }) => {
  await openStudio(page);
  await page.locator('#ptfTitle').fill('Größen & Maße');
  await page.locator('#ptfLabels').fill('JA\nNEIN');
  await expect(page.locator('#ptfStatus')).toBeVisible();
  const result = await downloadOf(page, '#ptfDownloadSvg');
  expect(result.name).toBe('pendeltafel-groessen-masse.svg');
  expect(result.text.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  expect(result.text).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(result.text).toContain('>JA</text>');
  expect(result.text).toContain('>NEIN</text>');
  expect(result.text).toContain('Größen &amp; Maße');
  expect(result.text).not.toMatch(/<script/i);
  expect(result.text).not.toMatch(/\son[a-z]+\s*=/i);
  expect(result.text).not.toMatch(/javascript:/i);
  expect(result.text).not.toMatch(/xlink:href/i);
  expect(result.text).not.toMatch(/<image|<foreignObject|<use\b/i);
  // Genau eine URL: der XML-Namespace.
  expect((result.text.match(/https?:\/\//g) || []).length).toBe(1);
  expect(fs.statSync(result.file).size).toBeGreaterThan(1500);
});

test('JSON-Export und Reimport ergeben dieselbe Tafel', async ({ page }) => {
  await openStudio(page);
  await page.locator('#ptfTitle').fill('Reimport-Tafel');
  await page.locator('#ptfLabels').fill('Eins\nZwei\nDrei\nVier\nFünf');
  await page.locator('input[name="ptfPalette"][value="nacht"]').check();
  const before = await page.locator('#ptfPreview svg').innerHTML();
  const exported = await downloadOf(page, '#ptfDownloadJson');
  expect(exported.name).toBe('pendeltafel-reimport-tafel.json');
  const parsed = JSON.parse(exported.text);
  expect(parsed.schema).toBe('esow.pendeltafel/1');
  expect(parsed.labels).toEqual(['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf']);
  expect(parsed.palette).toBe('nacht');

  // Etwas anderes einstellen und die exportierte Datei zurückholen.
  await page.locator('#ptfLabels').fill('A\nB');
  await page.locator('input[name="ptfPalette"][value="messing"]').check();
  await expect(page.locator('#ptfPreview svg text')).toHaveCount(5);
  await page.locator('#ptf-import summary').click();
  await page.locator('#ptfImportText').fill(exported.text);
  await page.locator('#ptfImportApply').click();
  await expect(page.locator('#ptfStatus')).toContainText('Import aus Textfeld übernommen');
  await expect(page.locator('input[name="ptfPalette"][value="nacht"]')).toBeChecked();
  expect(await page.locator('#ptfPreview svg').innerHTML()).toBe(before);
});

test('Druckknopf öffnet den Druckdialog, Druckansicht zeigt nur die Tafel', async ({ page }) => {
  await openStudio(page);
  // window.print wird ersetzt: geprüft wird der Aufruf, nicht ein Dialog.
  await page.evaluate(() => {
    window.__ptfPrintCalls = 0;
    window.print = () => {
      window.__ptfPrintCalls += 1;
    };
  });
  await page.locator('#ptfPrint').click();
  expect(await page.evaluate(() => window.__ptfPrintCalls)).toBe(1);
  await expect(page.locator('#ptfStatus')).toContainText('Druckdialog geöffnet');

  await page.emulateMedia({ media: 'print' });
  const visibility = await page.evaluate(() => ({
    editor: getComputedStyle(document.getElementById('pendeltafelStudio')).display,
    sheet: getComputedStyle(document.getElementById('ptfSheet')).display,
    board: getComputedStyle(document.getElementById('ptfSheetBoard')).display,
    header: getComputedStyle(document.querySelector('header.header')).display,
    activeMarker: document.documentElement.classList.contains('ptf-print-active'),
  }));
  expect(visibility.sheet).toBe('grid');
  expect(visibility.board).toBe('block');
  expect(visibility.editor).toBe('none');
  expect(visibility.header).toBe('none');
  expect(visibility.activeMarker).toBe(true);
  // Die Druckoptimierung des Hauptstylesheets darf die Tafel nicht schwarz
  // auf dunklem Grund setzen.
  const titleColor = await page.locator('#ptfSheetTitle').evaluate((node) => getComputedStyle(node).color);
  expect(titleColor).not.toBe('rgb(0, 0, 0)');
  const footColor = await page
    .locator('#ptfSheet .ptf-sheet-foot p')
    .first()
    .evaluate((node) => getComputedStyle(node).color);
  expect(footColor).not.toBe('rgb(0, 0, 0)');

  const box = await page.locator('#ptfSheet').boundingBox();
  expect(box.width).toBeGreaterThan(700);
  expect(Math.abs(box.width / box.height - 210 / 297)).toBeLessThan(0.02);
  await page.screenshot({ path: path.join(EVIDENCE, 'print-ansicht-a4.png'), fullPage: false });
  await page.locator('#ptfSheet').screenshot({ path: path.join(EVIDENCE, 'print-flaeche-a4.png') });
  await page.emulateMedia({ media: 'screen' });
  await expect(page.locator('#pendeltafelStudio')).toBeVisible();
});

test('PDF-Ausgabe über den Browserdruck ist eine echte A4-Seite', async ({ page }) => {
  await openStudio(page);
  await page.locator('#ptfTitle').fill('Vier Himmelsrichtungen');
  await page.locator('#ptfLabels').fill('Nord\nOst\nSüd\nWest');
  await page.locator('input[name="ptfPalette"][value="papier"]').check();
  await page.emulateMedia({ media: 'print' });
  const pdfPath = path.join(EVIDENCE, 'pendeltafel-studio-druck.pdf');
  await page.locator('#ptfSheet').screenshot({ path: path.join(EVIDENCE, 'print-flaeche-papier-a4.png') });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.emulateMedia({ media: 'screen' });

  const buffer = fs.readFileSync(pdfPath);
  expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(20000);
  const raw = buffer.toString('latin1');
  // A4 in PDF-Punkten (595 × 842) und genau eine Seite.
  expect(raw).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+59[45](\.\d+)?\s+84[12](\.\d+)?\s*\]/);
  const pageCount = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
  expect(pageCount).toBe(1);
});

test('mobile Ansicht bleibt ohne horizontalen Überlauf bedienbar', async ({ page }) => {
  const log = collect(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openStudio(page);
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    sheetRight: document.getElementById('ptfSheet').getBoundingClientRect().right,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.sheetRight).toBeLessThanOrEqual(metrics.innerWidth + 1);

  const targets = await page
    .locator('#ptfPreset, #ptfTitle, #ptfLabels, #ptfDownloadSvg, #ptfDownloadJson, #ptfPrint')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  for (const height of targets) expect(height).toBeGreaterThanOrEqual(44);

  // Auch bei 390 px bleibt die Zeichnung sichtbar und vollständig im Bild.
  const svg = await page.locator('#ptfPreview svg').boundingBox();
  expect(svg.width).toBeGreaterThan(200);
  await shotStudio(page, 'mobile-studio.png');
  expect(log.consoleErrors).toEqual([]);
});

test('Tastatur erreicht alle Regler, jedes Feld hat eine Beschriftung', async ({ page }) => {
  await openStudio(page);
  const unlabelled = await page.evaluate(
    () =>
      [
        ...document.querySelectorAll(
          '#pendeltafelStudio input, #pendeltafelStudio select, #pendeltafelStudio textarea'
        ),
      ].filter((control) => {
        if (control.type === 'radio') return !control.closest('label');
        const label = control.id && document.querySelector(`label[for="${control.id}"]`);
        return !label && !control.closest('label');
      }).length
  );
  expect(unlabelled).toBe(0);

  await page.locator('#ptfPreset').focus();
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const element = document.activeElement;
    return {
      tag: element ? element.tagName : '',
      inside: Boolean(element && element.closest('#pendeltafelStudio')),
      name: element ? element.getAttribute('name') : null,
    };
  });
  expect(focused.inside).toBe(true);
  expect(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY']).toContain(focused.tag);
  // Vorlage per Tastatur wechseln (Select unterstützt Pfeiltasten).
  await page.locator('#ptfPreset').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#ptfPreset')).not.toHaveValue('janain');
  const outline = await page.locator('#ptfPreset').evaluate((node) => getComputedStyle(node).outlineStyle);
  expect(outline).not.toBe('none');
});

test('Werkstatt-Karte der Startseite führt zum Studio', async ({ page }) => {
  await page.goto(url('#pendeln'));
  const card = page.locator('.rad-werk', { hasText: 'Pendeltafel-Studio' });
  await expect(card).toBeVisible();
  await expect(card.locator('.rad-werk-state')).toHaveText('Verfügbar');
  await card.locator('a.rad-werk-link').click();
  await expect(page).toHaveURL(/#pendeln\/studio$/);
  await expect(page.locator('#pendeltafelStudio')).toBeVisible();
});

test('offline-Build (file://) rendert das Studio ohne Netz', async ({ page }) => {
  const file = path.join(__dirname, '..', 'Lokal.html');
  test.skip(!fs.existsSync(file), 'Lokal.html fehlt — npm run build ausführen');
  const log = collect(page);
  await page.goto(`${pathToFileURL(file).href}${STUDIO.replace('#', '#')}`);
  await expect(page.locator('#pendeltafelStudio')).toBeVisible();
  await expect(page.locator('#ptfPreview svg')).toBeVisible();
  await page.locator('#ptfPreset').selectOption('zahlenkreis');
  await expect(page.locator('#ptfPreview svg text')).toHaveCount(13);
  const result = await downloadOf(page, '#ptfDownloadSvg');
  expect(result.text).toContain('<svg');
  expect(log.external).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
});
