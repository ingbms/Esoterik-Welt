/** Nennt die URLs, die auf einer Seite mit 404 antworten. */
const { chromium } = require('playwright');

const URL = process.argv[2] || 'http://127.0.0.1:4402/frequenzen/labor.html';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const missing = [];
  page.on('response', (response) => {
    if (response.status() === 404) missing.push(response.url());
  });
  page.on('requestfailed', (request) => missing.push(`${request.url()} (${request.failure()?.errorText})`));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log(JSON.stringify([...new Set(missing)], null, 2));
  await browser.close();
}

main();
