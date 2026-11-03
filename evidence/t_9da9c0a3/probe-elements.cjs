// Elementbezogene Aufnahmen für die Sichtprüfung (Registergruppe, Einstiege, TOC, 390 px).
const { chromium } = require('playwright');

const base = 'http://127.0.0.1:8099/Esoterik-Welt/';
const out = 'C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_9da9c0a3/evidence/t_9da9c0a3/';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${base}#farbwelten`, { waitUntil: 'networkidle' });
  await page.locator('#einstiege').screenshot({ path: `${out}einstiege-1440.png` });
  await page.locator('#register').screenshot({ path: `${out}register-1440.png` });

  await page.setViewportSize({ width: 390, height: 900 });
  for (const route of ['farbwelten/farbtherapie', 'farbwelten/lichtmedizin']) {
    await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    console.log(route, 'overflow 390:', overflow, 'toc summary visible:', await page.locator('.fw-toc > summary').isVisible());
    await page.screenshot({ path: `${out}${route.split('/')[1]}-390.png`, fullPage: true });
  }
  await browser.close();
})();
