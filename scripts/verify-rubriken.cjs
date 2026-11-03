// Rubriken-Smoke (Integrationsnachweis t_33cdf5ec).
//
// Prüft am gebauten Stand: zehn Navigationsziele, zehn Seitensektionen,
// neun Startseitenkarten, die Deep-Links #pendeln, #farbwelten, #frequenzen und
// #frequenzen/labor sowie ein leeres Konsolenprotokoll. Legt Screenshots und
// ein Ergebnis-JSON im Zielverzeichnis ab.
//
// Aufruf: node scripts/verify-rubriken.cjs <base-url> <ausgabeverzeichnis>
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base = process.argv[2] || 'http://127.0.0.1:8377/Esoterik-Welt/';
const output = path.resolve(process.argv[3] || 'evidence/rubriken-integration');

const EXPECTED_NAV = [
  ['home', 'Start'],
  ['tarot', 'Tarot'],
  ['crystals', 'Kristalle'],
  ['moon', 'Mondphasen'],
  ['astrologie', 'Astrologie'],
  ['frequenzen', 'Frequenzen'],
  ['runes', 'Runen'],
  ['pendeln', 'Pendeln'],
  ['farbwelten', 'Farben'],
  ['blog', 'Wissen'],
];
const EXPECTED_SECTIONS = [
  'home',
  'tarot',
  'crystals',
  'moon',
  'astrologie',
  'frequenzen',
  'runes',
  'pendeln',
  'farbwelten',
  'blog',
];
const DEEP_LINKS = [
  { hash: '#pendeln', selector: '#pendelnRoot h1', shot: 'pendeln' },
  { hash: '#pendeln/radiasthesie', selector: '#pendelnRoot h1', shot: 'pendeln-radiasthesie' },
  { hash: '#farbwelten', selector: '#farbweltenRoot h1', shot: 'farbwelten' },
  { hash: '#farbwelten/rot', selector: '#farbweltenRoot h1', shot: 'farbwelten-rot' },
  { hash: '#frequenzen', selector: '#fqLibrary .fq-entry', shot: 'frequenzen' },
  { hash: '#frequenzen/labor', selector: '#frequenzlaborRoot', shot: 'frequenzen-labor' },
];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const problems = [];
  const consoleEvents = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) consoleEvents.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => consoleEvents.push(`pageerror: ${error.message}`));
    page.on('requestfailed', (request) => consoleEvents.push(`requestfailed: ${request.url()}`));

    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelector('#featureGrid')?.children.length === 9, null, {
      timeout: 15000,
    });

    const nav = await page.evaluate(() =>
      [...document.querySelectorAll('#navList .nav-link')].map((link) => [link.dataset.page, link.textContent.trim()])
    );
    const sections = await page.evaluate(() => [...document.querySelectorAll('section.page')].map((s) => s.id));
    const cards = await page.evaluate(() => document.querySelectorAll('#featureGrid .feature-card').length);
    const label = await page.evaluate(() => document.querySelector('#pfade-title + .label')?.textContent.trim() ?? '');
    const numbers = await page.evaluate(() =>
      [...document.querySelectorAll('#featureGrid .feature-icon')].map((node) => node.textContent.trim())
    );

    if (JSON.stringify(nav) !== JSON.stringify(EXPECTED_NAV)) problems.push(`Navigation: ${JSON.stringify(nav)}`);
    if (JSON.stringify(sections) !== JSON.stringify(EXPECTED_SECTIONS))
      problems.push(`Sektionen: ${sections.join(',')}`);
    if (cards !== 9) problems.push(`Startseitenkarten: ${cards}`);
    if (label !== 'Neun Zugänge') problems.push(`Startseiten-Label: ${label}`);
    if (JSON.stringify(numbers) !== JSON.stringify(['01', '02', '03', '04', '05', '06', '07', '08', '09'])) {
      problems.push(`Nummerierung: ${numbers.join(',')}`);
    }
    await page.screenshot({ path: path.join(output, 'start-1440.png'), fullPage: true });
    results.push({ step: 'start', nav: nav.length, sections: sections.length, cards, label, numbers });

    // Jeden Navigationslink wirklich anklicken.
    for (const [id] of EXPECTED_NAV) {
      if (await page.locator('#navToggle').isVisible()) await page.locator('#navToggle').click();
      await page.locator(`.nav-link[data-page="${id}"]`).click();
      await page.locator(`#${id}.active:not([hidden])`).waitFor({ state: 'visible', timeout: 10000 });
      const current = await page.locator('#navList .nav-link[aria-current="page"]').count();
      const hash = new URL(page.url()).hash;
      results.push({ step: `nav:${id}`, hash, ariaCurrent: current });
      if (hash !== `#${id}`) problems.push(`${id}: Hash ${hash}`);
      if (current !== 1) problems.push(`${id}: ${current} aria-current-Markierungen`);
    }

    // Deep-Links aus einem frischen Aufruf heraus.
    for (const deepLink of DEEP_LINKS) {
      await page.goto(`${base.replace(/#.*$/, '')}${deepLink.hash}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator(deepLink.selector).first().waitFor({ state: 'visible', timeout: 15000 });
      const text = (await page.locator(deepLink.selector).first().textContent()).trim();
      await page.screenshot({ path: path.join(output, `${deepLink.shot}-1440.png`), fullPage: true });
      results.push({ step: `deep:${deepLink.hash}`, heading: text.slice(0, 80) });
      if (!text) problems.push(`${deepLink.hash}: leerer Inhalt`);
    }

    // Mobil: Burger öffnet zehn Ziele.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#navToggle').click();
    const mobile = await page.evaluate(
      () => [...document.querySelectorAll('#navList .nav-link')].filter((l) => l.offsetParent).length
    );
    await page.screenshot({ path: path.join(output, 'start-390-menue.png'), fullPage: false });
    results.push({ step: 'mobile-menu', visibleLinks: mobile });
    if (mobile !== 10) problems.push(`Mobilmenü: ${mobile} sichtbare Ziele`);

    for (const entry of consoleEvents) problems.push(`Konsole: ${entry}`);
  } finally {
    await browser.close();
  }

  const report = { base, date: new Date().toISOString(), results, consoleEvents, problems };
  fs.writeFileSync(path.join(output, 'rubriken-smoke.json'), JSON.stringify(report, null, 2));
  console.log(
    `Rubriken-Smoke: ${results.length} Schritte, ${problems.length} Befunde, ${consoleEvents.length} Konsolenmeldungen`
  );
  for (const step of results) console.log('  ' + JSON.stringify(step));
  for (const problem of problems) console.error('✗ ' + problem);
  if (problems.length) process.exitCode = 1;
})();
