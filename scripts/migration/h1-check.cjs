/** Gibt die gerenderten <h1> einer Seite aus. */
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch();
  for (const url of process.argv.slice(2)) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const h1 = await page.evaluate(() => [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()));
    console.log(url, JSON.stringify(h1));
    await page.close();
  }
  await browser.close();
}

main();
