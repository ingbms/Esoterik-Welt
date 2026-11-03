// RAD-11 — Browser-Evidenz für die Themenvernetzung.
//
// Aufruf: BASE_URL=http://127.0.0.1:3191/Esoterik-Welt node docs/radiasthesie-completion/RAD-11/scripts/capture-evidence.cjs
// Schreibt Screenshots und ein Messprotokoll nach ../evidence/browser/.

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3191/Esoterik-Welt';
const outDir = path.resolve(__dirname, '..', 'evidence', 'browser');

async function measure(page, selector) {
  return page.locator(selector).evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  });
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = { base: BASE, generatedAt: new Date().toISOString(), views: {} };

  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(String(error)));

    await page.goto(`${BASE}/#pendeln`, { waitUntil: 'load' });
    const section = page.locator('section[aria-labelledby="rad-verwandt-title"]');
    await section.waitFor({ state: 'visible' });
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const links = await section.locator('.rad-related a').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href'))
    );
    const gaps = await section
      .locator('.rad-related-item--pending')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim().split('\n')[0]));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    await section.screenshot({ path: path.join(outDir, `landing-vernetzung-${width}.png`) });
    report.views[`landing-${width}`] = {
      links,
      gaps,
      overflow,
      box: await measure(page, 'section[aria-labelledby="rad-verwandt-title"]'),
      errors: [...errors],
    };

    await page.goto(`${BASE}/#pendeln/radiasthesie`, { waitUntil: 'load' });
    const related = page.locator('section[aria-labelledby="rad-weiter-title"]');
    await related.waitFor({ state: 'visible' });
    await related.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const topicLinks = await related.locator('a').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href'))
    );
    await related.screenshot({ path: path.join(outDir, `weiterlesen-radiasthesie-${width}.png`) });
    report.views[`weiterlesen-${width}`] = { links: topicLinks, errors: [...errors] };

    await page.goto(`${BASE}/#pendeln/radiasthesie/frequenz`, { waitUntil: 'load' });
    await page.locator('#frequenz').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    const focus = await page.evaluate(() => ({
      id: document.activeElement && document.activeElement.id,
      scrollY: Math.round(window.scrollY),
      top: Math.round(document.getElementById('frequenz').getBoundingClientRect().top),
    }));
    await page.locator('#frequenz').screenshot({ path: path.join(outDir, `deep-link-frequenz-${width}.png`) });
    report.views[`deep-link-${width}`] = { focus, errors: [...errors], overflow };

    await context.close();
  }

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
