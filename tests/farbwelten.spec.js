// Farbwelten & Farbtherapie — Browsertests.
//
// Deckt die Abnahmekriterien der Karte ab: Navigationsziel, Einstieg,
// sieben Farbseiten mit A–H-Skelett, Chakren-Explorer per Tastatur,
// Spektrum-Stützwerte, Alias-Routen, Metadaten, Überläufe, Konsole und
// externe Requests. Läuft gegen die gebaute Fassung (playwright.config.cjs).

const { test, expect } = require('playwright/test');

const BASE = process.env.E2E_BASE || `http://127.0.0.1:${process.env.E2E_PORT || 3100}/Esoterik-Welt`;
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
    for (const hash of [
      '#farbwelten',
      '#farbwelten/rot',
      '#farbwelten/chakren',
      '#farbwelten/lichtfrequenzen',
      '#farbwelten/kompass',
      '#farbwelten/farbmeditation',
      '#farbwelten/zeitleiste',
    ]) {
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
        if (links !== 9) failures.push(`${width}px: ${links} sichtbare Navigationsziele`);
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

// --- P2-Werkzeuge: Farben-Kompass, Farbmeditation, Zeitleiste --------------

const TOOLS = [
  ['kompass', 'Farben-Kompass', /^Farben-Kompass — Assoziation, Tradition und Einordnung/],
  ['farbmeditation', 'Farbmeditation', /^Farbmeditation — ruhige Visualisierungsübung/],
  ['zeitleiste', 'Zeitleiste der Farbforschung', /^Zeitleiste — Farbforschung/],
];

for (const [slug, heading, title] of TOOLS) {
  test(`P2-Route ${slug}: eine H1, Titel, keine Fremdrequests`, async ({ page }) => {
    const log = collect(page);
    await page.goto(url(`#farbwelten/${slug}`));
    const root = page.locator('#farbweltenRoot');
    await expect(root.locator('h1')).toHaveCount(1);
    await expect(root.locator('h1')).toHaveText(heading);
    await expect(page).toHaveTitle(title);
    await expect(root.locator('.fw-breadcrumb')).toContainText('Farben');
    await expect(root.locator('#quellen .fw-sources li')).not.toHaveCount(0);
    expect(log.consoleErrors).toEqual([]);
    expect(log.pageErrors).toEqual([]);
    expect(log.external).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
      0
    );
  });
}

test('Farben-Kompass: Pfeiltasten wechseln Farbwelt, Panel und Status folgen', async ({ page }) => {
  await page.goto(url('#farbwelten/kompass'));
  const root = page.locator('#farbweltenRoot');
  await expect(root.locator('input[name="fwCompassColor"]')).toHaveCount(7);
  await expect(root.locator('.fw-kompass__block')).toHaveCount(5);
  // Grenze von Assoziationen ist Pflichtinhalt und steht vor der Auswahl.
  await expect(root.locator('.astro-callout')).toContainText('nicht, was eine Farbe über eine Person aussagt');
  const text = await root.innerText();
  expect(text).not.toMatch(/bedeutet (bei )?dir\b|dein Farbtyp|das sagt deine Farbe/i);

  await root.locator('input[name="fwCompassColor"]').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(root.locator('input[name="fwCompassColor"][value="orange"]')).toBeChecked();
  await expect(root.locator('input[name="fwCompassColor"][value="orange"]')).toBeFocused();
  await expect(root.locator('#fwCompassName')).toHaveText('Orange');
  await expect(root.locator('#fwCompassPanel')).toContainText('Begeisterung');
  await expect(root.locator('#fwCompassSummary')).toContainText('Orange: Begeisterung');
  await expect(root.locator('#fwCompassPanel a[href="#farbwelten/orange"]')).toHaveCount(1);

  await root.locator('input[name="fwCompassColor"][value="indigo"]').check();
  await expect(root.locator('#fwCompassName')).toHaveText('Indigo');
  await expect(root.locator('.fw-kompass__block').first()).toContainText('nicht als eigene emotionale Kategorie');
  await expect(root.locator('#fwCompassPanel a[href="#farbwelten/chakren"]')).not.toHaveCount(0);
});

test('Farbmeditation: Start, Pause, Beenden — ohne Netzwerk und Speicherung', async ({ page }) => {
  const log = collect(page);
  // Jeder Storage-Schreibzugriff wird protokolliert; die beim Seitenaufbau
  // gesetzten Schlüssel anderer Module werden vor der Messung verworfen.
  await page.addInitScript(() => {
    window.__storageWrites = [];
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      window.__storageWrites.push(key);
      return original.call(this, key, value);
    };
  });
  await page.goto(url('#farbwelten/farbmeditation'));
  const root = page.locator('#farbweltenRoot');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    window.__storageWrites = [];
  });
  const storageBefore = await page.evaluate(() => JSON.stringify({ ...localStorage }));

  await expect(root.locator('#fwMedTimer')).toHaveText('05:00');
  await expect(root.locator('#fwMedStatus')).toHaveText('Bereit — die Übung ist noch nicht gestartet.');
  await expect(root.locator('#fwMedPause')).toBeDisabled();
  await expect(root.locator('#fwMedStop')).toBeDisabled();
  await expect(root.locator('label[for="fwMedDuration"]')).toHaveText('Dauer in Minuten');

  // Dauer 1 Minute: Slider-Ereignis wie im Browser, ohne Tippen in ein Range-Feld.
  await root.locator('#fwMedDuration').evaluate((input) => {
    input.value = '1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(root.locator('#fwMedDurationOut')).toHaveText('1 Minute');
  await expect(root.locator('#fwMedTimer')).toHaveText('01:00');

  await root.locator('#fwMedStart').click();
  await expect(root.locator('#fwMedStatus')).toHaveText('Übung läuft.');
  await expect(root.locator('#fwMedStart')).toBeDisabled();
  await expect(root.locator('#fwMedPause')).toBeEnabled();
  await expect(root.locator('#fwMeditationStage')).toHaveClass(/is-running/);
  await expect(root.locator('#fwMedDuration')).toBeDisabled();
  await page.waitForTimeout(1300);
  await expect(root.locator('#fwMedTimer')).not.toHaveText('01:00');

  await root.locator('#fwMedPause').click();
  await expect(root.locator('#fwMedStatus')).toHaveText('Pausiert.');
  const paused = await root.locator('#fwMedTimer').textContent();
  await page.waitForTimeout(1200);
  await expect(root.locator('#fwMedTimer')).toHaveText(paused);
  await expect(root.locator('#fwMedStart')).toHaveText('Fortsetzen');

  await root.locator('#fwMedStop').click();
  await expect(root.locator('#fwMedStatus')).toHaveText('Übung beendet.');
  await expect(root.locator('#fwMedTimer')).toHaveText('01:00');
  await expect(root.locator('#fwMedStart')).toHaveText('Start');
  await expect(root.locator('#fwMedStart')).toBeEnabled();
  await expect(root.locator('#fwMeditationStage')).not.toHaveClass(/is-running/);

  const storageWrites = await page.evaluate(() => window.__storageWrites);
  expect(storageWrites).toEqual([]);
  const storageAfter = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(Object.keys(JSON.parse(storageAfter)).sort()).toEqual(Object.keys(JSON.parse(storageBefore)).sort());
  expect(log.external).toEqual([]);

  // Farbwechsel aktualisiert Fläche und Anregung, startet aber nichts.
  await root.locator('input[name="fwMedColor"][value="blau"]').check();
  await expect(root.locator('#fwMedColorName')).toHaveText('Gewählte Farbwelt: Blau');
  await expect(root.locator('#fwMedReflection')).toContainText(/blau/i);
  await expect(root.locator('#fwMedTimer')).toHaveText('01:00');
});

test('Reduced Motion: Meditationsfläche bleibt statisch', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url('#farbwelten/farbmeditation'));
  await page.locator('#fwMedStart').click();
  await expect(page.locator('#fwMeditationStage')).toHaveClass(/is-running/);
  const animation = await page.evaluate(() => {
    const stage = document.getElementById('fwMeditationStage');
    const style = getComputedStyle(stage);
    return {
      stage: style.animationName,
      after: getComputedStyle(stage, '::after').animationName,
      transition: style.transitionDuration,
    };
  });
  expect(animation.after).toBe('none');
  expect(animation.stage).toBe('none');
});

test('Zeitleiste: 17 belegte Ereignisse, Filter per Tastatur', async ({ page }) => {
  await page.goto(url('#farbwelten/zeitleiste'));
  const root = page.locator('#farbweltenRoot');
  await expect(root.locator('.fw-timeline__event')).toHaveCount(17);
  await expect(root.locator('.fw-tl-filter')).toHaveCount(6);
  await expect(root.locator('.fw-timeline__event').first()).toContainText('1577');
  await expect(root.locator('.fw-timeline__event').last()).toContainText('2025');
  for (const item of await root.locator('.fw-timeline__event').all()) {
    await expect(item.locator('.fw-timeline__source').first()).toBeAttached();
  }
  const psychologie = root.locator('.fw-tl-filter[data-strand="psychologie"]');
  await psychologie.focus();
  await page.keyboard.press('Enter');
  await expect(psychologie).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('.fw-timeline__event:not([hidden])')).toHaveCount(3);
  await expect(root.locator('#fwTimelineStatus')).toHaveText('3 von 17 Ereignissen');
  await expect(root.locator('.fw-tl-filter[data-strand="all"]')).toHaveAttribute('aria-pressed', 'false');

  await root.locator('.fw-tl-filter[data-strand="all"]').click();
  await expect(root.locator('.fw-timeline__event:not([hidden])')).toHaveCount(17);
  await expect(root.locator('#fwTimelineStatus')).toHaveText('17 von 17 Ereignissen');
});

test('Einstieg verlinkt die drei Werkzeuge, unbekannte Route bleibt sauber', async ({ page }) => {
  await page.goto(url('#farbwelten'));
  const tools = page.locator('#farbweltenRoot #werkzeuge');
  await expect(tools).toHaveCount(1);
  await expect(tools.locator('a')).toHaveCount(3);
  await tools.getByRole('link', { name: /Farben-Kompass/ }).click();
  await expect(page).toHaveURL(/#farbwelten\/kompass$/);
  await expect(page.locator('#farbweltenRoot h1')).toHaveText('Farben-Kompass');

  await page.goto(url('#farbwelten/quatsch'));
  const root = page.locator('#farbweltenRoot');
  await expect(root.locator('h1')).toHaveCount(1);
  await expect(root.locator('h1')).toHaveText('Diese Farbwelt gibt es nicht');
  await expect(root.getByRole('link', { name: 'Zum Farbregister' })).toBeVisible();
});
