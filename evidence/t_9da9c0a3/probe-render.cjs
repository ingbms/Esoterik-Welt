// Schnelle Sichtprüfung der Themenseiten im gebauten Stand.
const { chromium } = require('playwright');

const base = 'http://127.0.0.1:8099/Esoterik-Welt/';
const routes = ['farbwelten/farbtherapie', 'farbwelten/farbpsychologie', 'farbwelten/lichtmedizin'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  for (const route of routes) {
    await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const info = await page.evaluate(() => ({
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      description: document.querySelector('meta[name="description"]')?.content.slice(0, 60),
      h1: [...document.querySelectorAll('#farbweltenRoot h1')].map((node) => node.textContent),
      headings: [...document.querySelectorAll('#farbweltenRoot h2')].map((node) => node.textContent),
      h3: [...document.querySelectorAll('#farbweltenRoot h3')].map((node) => node.textContent),
      toc: [...document.querySelectorAll('.fw-toc a')].map((node) => `${node.textContent} -> ${node.getAttribute('href')}`),
      breadcrumb: [...document.querySelectorAll('.fw-breadcrumb li')].map((node) => node.textContent.trim()),
      jsonLd: document.getElementById('farbwelten-breadcrumb-ld')?.textContent,
      sources: [...document.querySelectorAll('#quellen .fw-sources > li')].map((node) => node.id),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      focus: document.activeElement?.id,
      words: document.querySelector('#farbweltenRoot').innerText.split(/\s+/).length,
    }));
    console.log(route, JSON.stringify(info, null, 1).slice(0, 1800));
    await page.screenshot({ path: `C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_9da9c0a3/evidence/t_9da9c0a3/${route.split('/')[1]}-1440.png`, fullPage: true });
  }
  // Einstieg: Registergruppe und Karten
  await page.goto(`${base}#farbwelten`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const landing = await page.evaluate(() => ({
    registerRows: document.querySelectorAll('.fw-register__row').length,
    group: [...document.querySelectorAll('.fw-register__group')].map((node) => node.textContent),
    cards: [...document.querySelectorAll('.fw-card__title')].map((node) => node.textContent),
  }));
  console.log('landing', JSON.stringify(landing));
  await page.screenshot({ path: 'C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_9da9c0a3/evidence/t_9da9c0a3/landing-1440.png', fullPage: true });
  // Farbseite: Querverweise
  await page.goto(`${base}#farbwelten/rot`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const colorLinks = await page.evaluate(() =>
    [...document.querySelectorAll('#verwandt-title ~ ul a, .fw-detail__section[aria-labelledby="verwandt-title"] a')].map(
      (node) => `${node.textContent} -> ${node.getAttribute('href')}`
    )
  );
  console.log('rot related', JSON.stringify(colorLinks));
  console.log('console errors', errors);
  await browser.close();
})();
