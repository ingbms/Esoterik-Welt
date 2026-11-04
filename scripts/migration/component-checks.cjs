/**
 * Funktions- und A11y-Prüfung der Astro-Komponenten (t_2d9fbecf).
 *
 * Prüft am gebauten Stand:
 *  - Skip-Link wird beim ersten Tab sichtbar und fokussiert.
 *  - Burger öffnet das gestapelte Menü, setzt aria-expanded, Escape schließt
 *    und gibt den Fokus an den Schalter zurück.
 *  - Fokusring ist auf Navigationslinks vorhanden (outline).
 *  - Favoritenzähler liest den Bestandsschlüssel aus dem lokalen Speicher.
 *  - Die Prüfseite /komponenten.html rendert alle Komponenten.
 *
 * Aufruf: node scripts/migration/component-checks.cjs [basis-url] [ausgabeverzeichnis]
 */
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const BASE_URL = process.argv[2] || process.env.ASTRO_URL || 'http://localhost:4404/';
const OUT_DIR = process.argv[3] || 'C:/Users/mas/AppData/Local/Temp/component-checks-t_2d9fbecf';

const results = [];
function check(name, passed, detail) {
  results.push({ name, passed, detail });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  // --- Mobilmenü + Skip-Link ---
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await mobile.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('esot_crystals_fav', JSON.stringify(['amethyst', 'quarz'])));

  await page.keyboard.press('Tab');
  const skipState = await page.evaluate(() => {
    const link = document.querySelector('.skip-link');
    const rect = link.getBoundingClientRect();
    return { focused: document.activeElement === link, top: Math.round(rect.top), text: link.textContent.trim() };
  });
  check('Skip-Link erhält den ersten Tab-Fokus und ist sichtbar', skipState.focused && skipState.top < 60, skipState);

  const toggle = page.locator('[data-nav-toggle]');
  await toggle.click();
  const opened = await page.evaluate(() => {
    const nav = document.querySelector('[data-site-nav]');
    const list = document.querySelector('[data-nav-list]');
    const toggleButton = document.querySelector('[data-nav-toggle]');
    return {
      navOpen: nav.classList.contains('open'),
      expanded: toggleButton.getAttribute('aria-expanded'),
      label: toggleButton.getAttribute('aria-label'),
      listVisible: getComputedStyle(list).display,
    };
  });
  check(
    'Burger öffnet das Menü (aria-expanded=true, Liste sichtbar)',
    opened.navOpen && opened.expanded === 'true' && opened.label === 'Menü schließen' && opened.listVisible === 'flex',
    opened
  );
  await page.screenshot({ path: path.join(OUT_DIR, 'mobile-menu-open.png'), fullPage: false });

  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => {
    const nav = document.querySelector('[data-site-nav]');
    const toggleButton = document.querySelector('[data-nav-toggle]');
    return {
      navOpen: nav.classList.contains('open'),
      expanded: toggleButton.getAttribute('aria-expanded'),
      focusOnToggle: document.activeElement === toggleButton,
    };
  });
  check(
    'Escape schließt das Menü und gibt den Fokus zurück',
    !closed.navOpen && closed.expanded === 'false' && closed.focusOnToggle,
    closed
  );

  // Fokusring nur über echte Tastaturbedienung prüfen: `element.focus()` löst
  // in Chromium nicht zuverlässig `:focus-visible` aus.
  await page.evaluate(() => document.querySelector('.logo').focus());
  await page.keyboard.press('Tab');
  const focusRing = await page.evaluate(() => {
    const active = document.activeElement;
    const style = getComputedStyle(active);
    return {
      tag: active.tagName,
      text: (active.textContent || '').trim(),
      hasFocusVisible: active.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    };
  });
  check(
    'Navigationslink hat einen sichtbaren Fokusring',
    focusRing.hasFocusVisible && focusRing.outlineStyle !== 'none' && parseFloat(focusRing.outlineWidth) >= 2,
    focusRing
  );

  const counter = await page.evaluate(() => {
    const element = document.querySelector('#favCounter');
    return { text: element.textContent.trim(), label: element.getAttribute('aria-label') };
  });
  await page.reload({ waitUntil: 'networkidle' });
  const counterAfterReload = await page.evaluate(() => document.querySelector('#favCounter').textContent.trim());
  check('Favoritenzähler liest den lokalen Speicherstand', counterAfterReload === '♥ 2', {
    vorReload: counter,
    nachReload: counterAfterReload,
  });

  const landmarks = await page.evaluate(() => ({
    header: document.querySelectorAll('body > header').length,
    main: document.querySelectorAll('main#main[tabindex="-1"]').length,
    footer: document.querySelectorAll('body > footer').length,
    navLabel: document.querySelector('nav[aria-label="Hauptnavigation"]') !== null,
    headings: [...document.querySelectorAll('h1')].map((heading) => heading.textContent.trim()),
  }));
  check(
    'Semantische Landmarks (header/main/footer, benannte Navigation, eine H1)',
    landmarks.header === 1 &&
      landmarks.main === 1 &&
      landmarks.footer === 1 &&
      landmarks.navLabel &&
      landmarks.headings.length === 1,
    landmarks
  );

  await mobile.close();

  // --- Prüfseite ---
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const componentsPage = await desktop.newPage();
  const consoleErrors = [];
  componentsPage.on('pageerror', (error) => consoleErrors.push(String(error)));
  componentsPage.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await componentsPage.goto(`${BASE_URL}komponenten.html`, { waitUntil: 'networkidle' });
  await componentsPage.evaluate(() => document.fonts.ready);
  await componentsPage.screenshot({ path: path.join(OUT_DIR, 'komponenten-desktop.png'), fullPage: true });

  const gallery = await componentsPage.evaluate(() => ({
    buttons: document.querySelectorAll('.btn').length,
    badges: document.querySelectorAll('.badge').length,
    cards: document.querySelectorAll('.card').length,
    fields: document.querySelectorAll('.field').length,
    textFields: document.querySelectorAll('.field input.input').length,
    selectFields: document.querySelectorAll('.field select.select').length,
    textLinks: document.querySelectorAll('.textlink').length,
    hero: document.querySelectorAll('.hero').length,
    noindex: document.querySelector('meta[name="robots"]').getAttribute('content'),
    labelledFields: [...document.querySelectorAll('.field input, .field select')].every((field) => {
      const label = document.querySelector(`label[for="${field.id}"]`);
      return Boolean(label) || Boolean(field.getAttribute('aria-label'));
    }),
  }));
  check(
    'Prüfseite rendert alle Komponenten und ist noindex',
    gallery.buttons >= 7 &&
      gallery.badges >= 5 &&
      gallery.cards === 3 &&
      gallery.textFields >= 4 &&
      gallery.selectFields === 1 &&
      gallery.textLinks >= 1 &&
      gallery.hero === 1 &&
      gallery.noindex.includes('noindex'),
    gallery
  );
  check('Alle Felder der Prüfseite sind beschriftet', gallery.labelledFields === true, gallery.labelledFields);
  check('Keine Konsolenfehler auf der Prüfseite', consoleErrors.length === 0, consoleErrors);

  await desktop.close();
  await browser.close();

  const failed = results.filter((result) => !result.passed);
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'}  ${result.name}`);
    if (!result.passed) console.log('      ', JSON.stringify(result.detail));
  }
  console.log(`\n${results.length - failed.length}/${results.length} Prüfungen bestanden (Ausgabe: ${OUT_DIR})`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
