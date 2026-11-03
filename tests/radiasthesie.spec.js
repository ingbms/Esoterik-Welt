// Themenmodul „Radiästhesie, Pendeln und Orakel“ — Browsertests.
//
// Deckt die Abnahmekriterien der Karte ab: Navigationseintrag, Landingpage,
// drei Themenseiten, Glossar, Quellen, Methodik, Suche, Fehleransicht,
// Metadaten je Route, Überläufe an den definierten Breakpoints, Konsole ohne
// Fehler, keine externen Requests und Tastaturbedienbarkeit.

const { test, expect } = require('playwright/test');

// Der Modulbereich lebt unter dem Pages-Basispfad. Die Tests laden deshalb
// dieselbe Adresse wie die Veröffentlichung (siehe playwright.config.cjs).
const { E2E_BASE_URL: BASE } = require('./helpers/e2e-target.cjs');
const url = (hash = '') => `${BASE}/${hash}`;

const ROUTES = [
  { hash: '#pendeln', h1: 'Radiästhesie, Pendeln und Orakel', title: /Tradition und Prüfstand/ },
  { hash: '#pendeln/radiasthesie', h1: 'Radiästhesie', title: /^Radiästhesie — Ruten, Geschichte/ },
  { hash: '#pendeln/pendeln', h1: 'Pendeln', title: /^Pendeln — Arten/ },
  { hash: '#pendeln/orakel', h1: 'Orakel', title: /^Orakel — Pendelorakel/ },
  { hash: '#pendeln/glossar', h1: 'Glossar', title: /^Glossar —/ },
  { hash: '#pendeln/quellen', h1: 'Quellen & Belege', title: /^Quellen und Belege/ },
  { hash: '#pendeln/methodik', h1: 'Methodik & Grenzen', title: /^Methodik und Grenzen/ },
  { hash: '#pendeln/journal', h1: 'Pendeltagebuch', title: /^Pendeltagebuch —/ },
  { hash: '#pendeln/suche?q=bovis', h1: 'Suche im Modul', title: /^Suche: bovis/ },
];

function collect(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const external = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('data:')) external.push(url);
  });
  return { consoleErrors, pageErrors, external };
}

test('Navigationsziel öffnet das Modul und setzt Route, Titel und Fokus', async ({ page }) => {
  const log = collect(page);
  await page.goto(url());
  await page.locator('.nav-link[data-page="pendeln"]').click();
  await expect(page).toHaveURL(/#pendeln$/);
  await expect(page.locator('#pendeln.active')).toBeVisible();
  await expect(page.locator('#pendelnRoot h1#pendeln-title')).toHaveText('Radiästhesie, Pendeln und Orakel');
  await expect(page.locator('.nav-link[data-page="pendeln"]')).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveTitle(/Radiästhesie, Pendeln und Orakel/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /ohne Wirkungsversprechen/);
  expect(log.pageErrors).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
  expect(log.external).toEqual([]);
});

test('Landingpage: Hero, Einordnungsband, drei Themen, fünf Stufen, Werkstatt', async ({ page }) => {
  await page.goto(url('#pendeln'));
  const root = page.locator('#pendelnRoot');
  await expect(root.locator('.rad-hero-title')).toBeVisible();
  await expect(root.locator('.rad-status')).toContainText('nicht belegt');
  await expect(root.locator('.rad-topic')).toHaveCount(3);
  await expect(root.locator('.rad-level')).toHaveCount(5);
  await expect(root.locator('.rad-werk')).toHaveCount(4);
  await expect(root.locator('.rad-disclaimer')).toContainText('Was hier nicht behauptet wird');
  await expect(root.locator('h1')).toHaveCount(1);
  for (const name of ['Radiästhesie', 'Pendeln', 'Orakel']) {
    await expect(root.locator('.rad-topic-title', { hasText: name })).toHaveCount(1);
  }
});

test('Jede Route hat genau eine H1, keine Sprünge und vollständige Metadaten', async ({ page }) => {
  const log = collect(page);
  for (const route of ROUTES) {
    await page.goto(url(route.hash));
    const root = page.locator('#pendelnRoot');
    await expect(root.locator('h1')).toHaveCount(1, { timeout: 15000 });
    await expect(root.locator('h1')).toHaveText(route.h1);
    await expect(page).toHaveTitle(route.title);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description.length).toBeGreaterThan(60);
    expect(description.length).toBeLessThanOrEqual(165);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', route.title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', route.title);
    // Überschriftenordnung: keine Stufe wird übersprungen.
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
    // BreadcrumbList ist vorhanden und gültig.
    const ld = await page.locator('#pendeln-breadcrumb-ld').textContent();
    const parsed = JSON.parse(ld);
    expect(parsed['@type']).toBe('BreadcrumbList');
    expect(parsed.itemListElement.length).toBeGreaterThanOrEqual(2);
  }
  expect(log.pageErrors).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
  expect(log.external).toEqual([]);
});

test('Themenseiten: Kapitel, Inhaltsverzeichnis und auflösbare Quellenmarker', async ({ page }) => {
  for (const hash of ['#pendeln/radiasthesie', '#pendeln/pendeln', '#pendeln/orakel']) {
    await page.goto(url(hash));
    const root = page.locator('#pendelnRoot');
    await expect(root.locator('.astro-section').first()).toBeVisible();
    const chapterIds = await root
      .locator('.astro-main section.astro-section[id]')
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(chapterIds.length).toBeGreaterThanOrEqual(8);
    // Jedes Kapitel steht im Inhaltsverzeichnis und ist per Deep-Link erreichbar.
    const tocHrefs = await root
      .locator('.astro-toc a')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    for (const id of chapterIds) {
      if (id.startsWith('rad-')) continue;
      expect(tocHrefs).toContain(`${hash}/${id}`);
    }
    // Quellenmarker sind Links, keine Klartext-Klammern.
    const cites = root.locator('a.rad-cite');
    expect(await cites.count()).toBeGreaterThan(20);
    await expect(root.locator('.astro-details--sources')).toContainText('Quellen & Belege');
    await expect(root.locator('.rad-disclaimer')).toContainText('Einordnung dieser Seite');
    await expect(root.locator('.rad-status')).toBeVisible();
  }
});

test('Kapitel-Deep-Link scrollt zum Abschnitt und setzt den Fokus', async ({ page }) => {
  await page.goto(url('#pendeln/radiasthesie'));
  await expect(page.locator('#pendelnRoot h1')).toBeVisible();
  const link = page.locator('.astro-toc a[href="#pendeln/radiasthesie/instrumente"]');
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/#pendeln\/radiasthesie\/instrumente$/);
  const section = page.locator('#pendelnRoot #instrumente');
  await expect(section).toBeInViewport();
  await expect(section.locator('h2')).toBeFocused({ timeout: 10000 });
});

test('Glossar filtert beim Tippen und behält den Filter in der Adresse', async ({ page }) => {
  await page.goto(url('#pendeln/glossar'));
  const root = page.locator('#pendelnRoot');
  await expect(root.locator('.astro-term')).toHaveCount(17);
  const input = root.locator('#glossarSuche');
  await input.fill('bovis');
  await expect(root.locator('.astro-term')).toHaveCount(1);
  await expect(root.locator('.astro-term dt')).toContainText('Bovis');
  await expect(page).toHaveURL(/q=bovis/);
  await expect(root.locator('[data-rad-count]')).toContainText('1 Begriff');
  // Buchstabenleiste springt und grenzt ein.
  await root.locator('.astro-letter[href*="b=R"]').click();
  await expect(page).toHaveURL(/b=R/);
  await expect(root.locator('.astro-glossgroup')).toHaveCount(1);
  await expect(root.locator('.astro-term')).toHaveCount(3);
});

test('Quellen-Deeplink hebt die zitierte Quelle hervor', async ({ page }) => {
  await page.goto(url('#pendeln/radiasthesie'));
  await page.locator('#pendelnRoot a.rad-cite').first().click();
  await expect(page).toHaveURL(/#pendeln\/quellen\/Q\d{2}$/);
  const target = page.locator('#pendelnRoot .astro-source-card.is-target');
  await expect(target).toHaveCount(1);
  await expect(target).toBeInViewport();
  await expect(page.locator('#pendelnRoot .astro-source-card')).toHaveCount(66);
});

test('Suche, Fehleransicht und leere Suche führen zurück', async ({ page }) => {
  await page.goto(url('#pendeln/suche'));
  await expect(page.locator('#pendelnRoot')).toContainText('Bitte einen Suchbegriff');
  await page.locator('#pendelnRoot #radSuche').fill('wünschelrute');
  await page.locator('#pendelnRoot button[type="submit"]').click();
  await expect(page).toHaveURL(/q=w%C3%BCnschelrute|q=wünschelrute/);
  await expect(page.locator('#pendelnRoot .astro-text-list li').first()).toBeVisible();
  await expect(page.locator('#pendelnRoot [data-rad-count]')).toContainText('Treffer');

  await page.goto(url('#pendeln/gibtsnicht'));
  const root = page.locator('#pendelnRoot');
  await expect(root.locator('h1')).toHaveText('Diese Seite gibt es nicht');
  await expect(root.locator('.rad-related-item')).toHaveCount(3);
  await root.locator('.rad-related-item a[href="#pendeln"]').click();
  await expect(page).toHaveURL(/#pendeln$/);
});

test('Keine Überläufe an den definierten Breakpoints', async ({ page }) => {
  const widths = [320, 360, 390, 700, 768, 781, 900, 1024, 1200, 1440];
  const failures = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const hash of ['#pendeln', '#pendeln/radiasthesie', '#pendeln/glossar']) {
      await page.goto(url(hash));
      await page.locator('#pendelnRoot h1').waitFor();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (overflow > 0) failures.push(`${width}px ${hash}: ${overflow}px`);
    }
  }
  expect(failures).toEqual([]);
});

test('Mobilmenü bleibt vollflächig bedienbar und die Kopfzeile passt', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('#pendeln'));
  await page.locator('#pendelnRoot h1').waitFor();

  // Kein Warten auf eine stabile Position: der Platz des Favoriten-Zählers steht
  // im Markup, der Burger darf sich nach dem Laden nicht mehr bewegen (B2).
  await page.locator('#navToggle').click();
  await expect(page.locator('#navToggle')).toHaveAttribute('aria-expanded', 'true');
  const rows = await page
    .locator('#navList .nav-link')
    .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().width)));
  expect(rows.length).toBe(10);
  expect(new Set(rows)).toEqual(new Set([342]));
  await expect(page.locator('#navList')).toBeVisible();
});

test('Kopfzeilen-Layout: Burger verschiebt sich nicht mehr (B2)', async ({ browser }) => {
  const toggleX = (page) => page.locator('#navToggle').evaluate((node) => Math.round(node.getBoundingClientRect().x));
  const counterWidth = (page) =>
    page.locator('#favCounter').evaluate((node) => Math.round(node.getBoundingClientRect().width));
  const viewport = { width: 390, height: 844 };

  // 1. Ohne JavaScript kommt der Zähler aus dem Markup. Hängt ihn erst die
  //    Kristalle-Sektion an (alter Zustand), fehlt das Element hier komplett.
  const ohneJs = await browser.newContext({ javaScriptEnabled: false, viewport });
  const ohneJsPage = await ohneJs.newPage();
  await ohneJsPage.goto(url('#pendeln'));
  await expect(ohneJsPage.locator('#favCounter')).toHaveText('♥ 0');
  await ohneJs.close();

  // 2. Die Kristalle-Daten werden gezielt verzögert: die Kopfzeile steht dann
  //    garantiert, während der Zähler noch nicht nachgezogen ist — genau das
  //    Zeitfenster, in dem der Burger früher um 83 px sprang.
  const seite = await browser.newPage({ viewport });
  let freigeben;
  const verzoegerung = new Promise((resolve) => (freigeben = resolve));
  await seite.route('**/data/crystals.json', async (route) => {
    await verzoegerung;
    await route.continue();
  });
  await seite.goto(url('#pendeln'), { waitUntil: 'domcontentloaded' });
  await expect(seite.locator('#favCounter')).toHaveText('♥ 0');
  const xVorInit = await toggleX(seite);
  const breiteVorInit = await counterWidth(seite);
  expect(breiteVorInit).toBeGreaterThanOrEqual(48);

  // 3. Nach abgeschlossener Initialisierung (updateFavCounter ist ihr letzter
  //    Schritt) sind Position und Breite unverändert.
  freigeben();
  await seite.waitForFunction(() => Boolean(window.crystalsModule?.favCounterEl));
  expect(await toggleX(seite)).toBe(xVorInit);
  expect(await counterWidth(seite)).toBe(breiteVorInit);

  // 4. Ein zweistelliger Zähler (Normalfall ab dem zehnten Favoriten) bleibt
  //    innerhalb der reservierten Mindestbreite.
  await seite.evaluate(() => {
    document.getElementById('favCounter').textContent = '♥ 30';
  });
  expect(await counterWidth(seite)).toBe(breiteVorInit);
  expect(await toggleX(seite)).toBe(xVorInit);

  const overflow = await seite.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBe(0);
  await seite.close();
});

test('Tastatur: Skip-Link, Fokusring und Esc-freie Navigation', async ({ page }) => {
  await page.goto(url());
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  const outline = await page.locator('.skip-link').evaluate((node) => getComputedStyle(node).outlineWidth);
  expect(parseFloat(outline)).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();

  // Über die Navigation ins Modul und weiter zum ersten Kapitel.
  await page.goto(url('#pendeln/radiasthesie'));
  await expect(page.locator('#pendelnRoot h1')).toBeFocused();
  await page.locator('#pendelnRoot .astro-toc a').first().focus();
  const tocOutline = await page
    .locator('#pendelnRoot .astro-toc a')
    .first()
    .evaluate((node) => getComputedStyle(node).outlineWidth);
  expect(parseFloat(tocOutline)).toBeGreaterThan(0);
});

test('Sitemap und Canonical bleiben ehrlich (keine Fragment-URLs)', async ({ request }) => {
  const sitemap = await (await request.get(`${BASE}/sitemap.xml`)).text();
  // Keine <loc>-Adresse darf ein Fragment enthalten (Suchmaschinen ignorieren es).
  expect(sitemap).not.toMatch(/<loc>[^<]*#/);
  expect(sitemap).toContain('https://ingbms.github.io/Esoterik-Welt/');
  const html = await (await request.get(`${BASE}/index.html`)).text();
  expect(html).toContain('<link rel="canonical" href="https://ingbms.github.io/Esoterik-Welt/"');
  expect(html).toContain('css/radiasthesie.css');
  expect(html).toContain('data-page="pendeln"');
});
