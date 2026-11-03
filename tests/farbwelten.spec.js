// Farbwelten & Farbtherapie — Browsertests.
//
// Deckt die Abnahmekriterien der Karte ab: Navigationsziel, Einstieg,
// sieben Farbseiten mit A–H-Skelett, Chakren-Explorer per Tastatur,
// Spektrum-Stützwerte, Alias-Routen, Metadaten, Überläufe, Konsole und
// externe Requests. Läuft gegen die gebaute Fassung (playwright.config.cjs).

const { test, expect } = require('playwright/test');

const { E2E_BASE_URL: BASE } = require('./helpers/e2e-target.cjs');
const url = (hash = '') => `${BASE}/${hash}`;

const COLOURS = [
  ['rot', 'Rot', /^Rot — Licht, Wirkung und Bedeutung/],
  ['orange', 'Orange', /^Orange — Licht, Wirkung und Bedeutung/],
  ['gelb', 'Gelb', /^Gelb — Licht, Wirkung und Bedeutung/],
  ['gruen', 'Grün', /^Grün — Licht, Wirkung und Bedeutung/],
  ['blau', 'Blau', /^Blau — Licht, Wirkung und Bedeutung/],
  ['indigo', 'Indigo', /^Indigo — Licht, Wirkung und Bedeutung/],
  ['violett', 'Violett', /^Violett — Licht, Wirkung und Bedeutung/],
];
const SECTIONS = ['erleben', 'physik', 'psychologie', 'tradition', 'anwendung', 'geschichte', 'uebung', 'quellen'];

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

test('Navigationsziel öffnet die Sektion mit Titel, H1 und Fokus', async ({ page }) => {
  const log = collect(page);
  await page.goto(url());
  await page.locator('.nav-link[data-page="farbwelten"]').click();
  await expect(page).toHaveURL(/#farbwelten$/);
  await expect(page.locator('.nav-link[data-page="farbwelten"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#farbweltenRoot h1')).toHaveText('Farbwelten');
  await expect(page.locator('#farbweltenRoot h1')).toBeFocused();
  await expect(page).toHaveTitle(/^Farbwelten — Bedeutung, Physik und Tradition der Farben/);
  await expect(page.locator('.fw-register__row')).toHaveCount(7);
  await expect(page.locator('.fw-tafel__band')).toHaveCount(7);
  expect(log.consoleErrors).toEqual([]);
  expect(log.pageErrors).toEqual([]);
  expect(log.external).toEqual([]);
});

for (const [id, name, title] of COLOURS) {
  test(`Farbseite ${name}: A–H-Skelett, eine H1, Metadaten`, async ({ page }) => {
    const log = collect(page);
    await page.goto(url(`#farbwelten/${id}`));
    const root = page.locator('#farbweltenRoot');
    await expect(root.locator('h1')).toHaveCount(1);
    await expect(root.locator('h1')).toHaveText(name);
    await expect(page).toHaveTitle(title);
    for (const section of SECTIONS) await expect(root.locator(`#${section}`)).toBeVisible();
    await expect(root.locator('.fw-compare')).toHaveCount(1);
    await expect(root.locator('.fw-sources li')).not.toHaveCount(0);
    await expect(root.locator('.fw-node')).toHaveCount(0);
    expect(log.consoleErrors).toEqual([]);
    expect(log.external).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
      0
    );
  });
}

test('Einstieg: Hauptaktion führt zum Farbregister', async ({ page }) => {
  await page.goto(url('#farbwelten'));
  await page.getByRole('link', { name: 'Farbwelten entdecken' }).click();
  await expect(page).toHaveURL(/#farbwelten\/register$/);
  await expect(page.locator('#register h2')).toBeFocused();
  await expect(page.locator('.fw-register__row').first()).toBeInViewport();
});

test('Chakren: sieben Knoten, Pfeiltasten wechseln Auswahl und Panel', async ({ page }) => {
  await page.goto(url('#farbwelten/chakren'));
  const root = page.locator('#farbweltenRoot');
  await expect(root.locator('h1')).toHaveText('Chakren & Farben');
  await expect(root.locator('.fw-node')).toHaveCount(7);
  await expect(root.locator('.fw-node[aria-pressed="true"]')).toHaveCount(1);
  await expect(root.locator('table caption')).toContainText('Zuordnung der sieben Chakren');
  await root.locator('.fw-node[data-chakra="root"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect(root.locator('.fw-node[data-chakra="sacral"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('#fwChakraName')).toContainText('Svādhiṣṭhāna');
  await expect(root.locator('#fwChakraLink')).toHaveAttribute('href', '#farbwelten/orange');
  await expect(root.locator('.fw-node[data-chakra="sacral"]')).toBeFocused();
});

test('Lichtfrequenzen: Slider rechnet 650/530/420 nm korrekt', async ({ page }) => {
  await page.goto(url('#farbwelten/lichtfrequenzen'));
  const root = page.locator('#farbweltenRoot');
  const slider = root.locator('#fwWavelength');
  await expect(slider).toHaveAttribute('aria-valuetext', /530 Nanometer, Grün, 565,6 Terahertz/);
  await expect(root.locator('#fwSpectrumReadout')).toContainText('565,6 Terahertz');
  for (const [nm, expected] of [
    [650, '461,2 Terahertz'],
    [530, '565,6 Terahertz'],
    [420, '713,8 Terahertz'],
  ]) {
    await root.locator('#fwWavelength').evaluate((input, value) => {
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, nm);
    await expect(root.locator('#fwSpectrumReadout')).toContainText(expected);
  }
  await expect(root.locator('#disclaimer blockquote')).toContainText('keine medizinische Diagnose');
});

test('Alias-Routen ersetzen die Adresse durch die kanonische Route', async ({ page }) => {
  await page.goto(url('#chakren'));
  await expect(page).toHaveURL(/#farbwelten\/chakren$/);
  await expect(page.locator('#farbweltenRoot h1')).toHaveText('Chakren & Farben');
  await page.goto(url('#lichtfrequenzen'));
  await expect(page).toHaveURL(/#farbwelten\/lichtfrequenzen$/);
  await expect(page.locator('#farbweltenRoot #spektrum')).toBeVisible();
});

test('Kein Überlauf an den Breakpoints 320/390/781/900/901/1440', async ({ page }) => {
  const failures = [];
  for (const width of [320, 390, 781, 900, 901, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const hash of ['#farbwelten', '#farbwelten/rot', '#farbwelten/chakren', '#farbwelten/lichtfrequenzen']) {
      await page.goto(url(hash));
      await page.locator('#farbweltenRoot h1').waitFor();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (overflow > 0) failures.push(`${width}px ${hash}: ${overflow}px`);
      if (width >= 901) {
        const links = await page
          .locator('.nav-link')
          .evaluateAll((nodes) => nodes.filter((n) => n.offsetParent).length);
        if (links !== 10) failures.push(`${width}px: ${links} sichtbare Navigationsziele`);
      }
    }
  }
  expect(failures).toEqual([]);
});

test('Sitemap bleibt bei den echten Dokumenten (keine Fragment-URLs)', async ({ request }) => {
  const sitemap = await (await request.get(`${BASE}/sitemap.xml`)).text();
  expect(sitemap).not.toContain('farbwelten');
  expect(sitemap).toContain('https://ingbms.github.io/Esoterik-Welt/</loc>');
});
