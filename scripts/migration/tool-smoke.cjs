/** Prüft eine Werkzeugseite im Browser: DOM-Zähler, Galerie, Konsolenfehler. */
const { chromium } = require('playwright');

const URL = process.argv[2] || 'http://127.0.0.1:4402/tarot.html';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const result = await page.evaluate(() => {
    const grid = document.getElementById('tarotGrid');
    return {
      title: document.title,
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input, select, textarea').length,
      buttons: document.querySelectorAll('button').length,
      gridChildren: grid ? grid.children.length : null,
      images: document.querySelectorAll('#tarotGrid img').length,
      navToggleDisplay: getComputedStyle(document.getElementById('navToggle')).display,
      headerHeight: Math.round(document.querySelector('.header').getBoundingClientRect().height),
      docHeight: document.documentElement.scrollHeight,
      mainText: document.querySelector('main')?.innerText.length ?? 0,
    };
  });
  console.log(JSON.stringify({ result, errors }, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
