// Themenvernetzung (ESOW-RAD-11) — Browsertests.
//
// Geprüft werden die Punkte aus dem Delta-Auftrag: Startseitenzugang, die
// Anschlüsse an vorhandene Module, benannte Lücken ohne toten Link,
// Deep-Links, Zurück/Vorwärts und die Themenseiten-Verweise gegen den
// lokalen Build derselben Adresse wie die Veröffentlichung.

const { test, expect } = require('playwright/test');

const BASE = process.env.E2E_BASE || `http://127.0.0.1:${process.env.E2E_PORT || 3100}/Esoterik-Welt`;
const url = (hash = '') => `${BASE}/${hash}`;

const TOPICS = ['radiasthesie', 'pendeln', 'orakel'];
const MODULE_HREFS = new Set(['#tarot', '#crystals', '#moon', '#runes', '#astrologie', '#blog']);

test('Startseite: sieben Anschlüsse und zwei benannte Lücken ohne Link', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(url('#pendeln'));
  const section = page.locator('section[aria-labelledby="rad-verwandt-title"]');
  await expect(section.getByRole('heading', { name: 'Verwandte Themen' })).toBeVisible();

  const links = section.locator('.rad-related-item a');
  await expect(links).toHaveCount(7);
  const hrefs = await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
  expect(hrefs).toContain('#tarot');
  expect(hrefs).toContain('#runes');
  expect(hrefs).toContain('#astrologie');
  expect(hrefs).toContain('#crystals');
  expect(hrefs).toContain('#pendeln/radiasthesie/frequenz');
  expect(hrefs).toContain('#pendeln/orakel/iging');

  const gaps = section.locator('.rad-related-item--pending');
  await expect(gaps).toHaveCount(2);
  await expect(gaps.filter({ hasText: 'Geomantie' })).toHaveCount(1);
  await expect(gaps.filter({ hasText: 'Kraftorte' })).toHaveCount(1);
  for (const gap of await gaps.all()) await expect(gap.locator('a')).toHaveCount(0);
  await expect(gaps.first().locator('.rad-related-type')).toHaveText('Nicht angeschlossen');

  expect(errors).toEqual([]);
});

test('Weiterlesen jeder Themenseite führt in mindestens zwei fremde Module', async ({ page }) => {
  for (const slug of TOPICS) {
    await page.goto(url(`#pendeln/${slug}`));
    await expect(page.locator('section[aria-labelledby="rad-weiter-title"] .rad-related-item').first()).toBeVisible();
    const hrefs = await page
      .locator('.rad-related a')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    const modules = new Set(hrefs.filter((href) => MODULE_HREFS.has(href)));
    expect(modules.size, `${slug}: ${[...modules].join(', ')}`).toBeGreaterThanOrEqual(2);
    expect(hrefs.filter((href) => href === `#pendeln/${slug}`)).toEqual([]);
  }
});

test('Klick in ein Nachbarmodul, Zurück und Vorwärts erhalten den Ausgangspunkt', async ({ page }) => {
  await page.goto(url('#pendeln/radiasthesie'));
  const link = page.locator('.rad-related a[href="#astrologie"]').first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/#astrologie$/);
  await expect(page.locator('#astrologie.active')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#pendeln\/radiasthesie$/);
  await expect(page.locator('#pendelnRoot h1#pendeln-title')).toHaveText('Radiästhesie');

  await page.goForward();
  await expect(page).toHaveURL(/#astrologie$/);
  await expect(page.locator('#astrologie.active')).toBeVisible();
});

test('Deep-Link auf das Frequenzkapitel rendert kalt, scrollt und fokussiert', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(url('#pendeln/radiasthesie/frequenz'));
  await expect(page.locator('#pendelnRoot h1#pendeln-title')).toHaveText('Radiästhesie');
  await expect(page.locator('#frequenz .rad-section-levels')).toContainText('A');
  await expect(page.locator('#frequenz')).toContainText('Frequenz in Hertz');
  await expect(page.locator('#frequenz')).toContainText('keine SI-Einheit');
  await expect(page.locator('#frequenz-title')).toBeFocused();
  expect(errors).toEqual([]);
});

test('I-Ging-Verweis öffnet das Kapitel auf der Orakelseite', async ({ page }) => {
  await page.goto(url('#pendeln'));
  await page.locator('.rad-related a[href="#pendeln/orakel/iging"]').click();
  await expect(page).toHaveURL(/#pendeln\/orakel\/iging$/);
  await expect(page.locator('#iging')).toContainText('Hexagramm');
  await expect(page.locator('#iging-title')).toBeFocused();
});

test('mobile Startseite: Vernetzung ohne horizontalen Überlauf', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('#pendeln'));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('section[aria-labelledby="rad-verwandt-title"] .rad-related-item')).toHaveCount(9);
});
