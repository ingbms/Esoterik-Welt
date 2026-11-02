// Offline-entry regression: the double-click file build (Lokal.html) must run
// from file:// with no network requests, no console errors and working routes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const localEntry = path.join(root, 'Lokal.html');
const localUrl = pathToFileURL(localEntry).href;

test('Lokal.html exists (npm run build:local)', () => {
  assert.ok(fs.existsSync(localEntry), 'Lokal.html is missing — run npm run build:local');
});

test('offline file entry serves every route without network access', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, offline: true });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push('console.error: ' + msg.text());
  });
  page.on('pageerror', (error) => problems.push('pageerror: ' + error.message));
  page.on('requestfailed', (request) => problems.push('requestfailed: ' + request.url()));
  page.on('request', (request) => {
    if (/^https?:/i.test(request.url())) problems.push('network request: ' + request.url());
  });

  await page.goto(localUrl, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#featureGrid > *').length === 6, { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const startup = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--color-bg-deep)';
    document.body.append(probe);
    const tokenBackground = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      url: location.href,
      background: getComputedStyle(document.body).backgroundColor,
      tokenBackground,
      features: document.querySelectorAll('#featureGrid > *').length,
      tarotCards: document.querySelectorAll('#tarotGrid > *').length,
      crystals: document.querySelectorAll('#crystalGrid > *').length,
      runes: document.querySelectorAll('#runeGrid > *').length,
      articles: document.querySelectorAll('#articleGrid > *').length,
      fonts: {
        fraunces: document.fonts.check('400 40px Fraunces'),
        manrope: document.fonts.check('400 16px Manrope'),
      },
    };
  });

  assert.match(startup.url, /^file:\/\//, 'must run from file://');
  assert.equal(startup.background, startup.tokenBackground, 'design-system background must be applied offline');
  assert.equal(startup.features, 6);
  assert.equal(startup.fonts.fraunces, true, 'Fraunces must load from the local font files offline');
  assert.equal(startup.fonts.manrope, true, 'Manrope must load from the local font files offline');
  for (const key of ['tarotCards', 'crystals', 'runes', 'articles']) {
    assert.ok(startup[key] > 0, `${key} must render offline`);
  }

  for (const route of ['tarot', 'crystals', 'moon', 'astrologie', 'runes', 'blog', 'home']) {
    await page.click(`.nav-link[data-page="${route}"]`);
    await page.locator(`#${route}.active:not([hidden])`).waitFor({ state: 'visible', timeout: 10000 });
    assert.equal(new URL(page.url()).hash, '#' + route, `${route} route hash`);
  }

  // The astrology area must work from the double-clicked file, including a
  // cold deep link into a detail page (data is inlined, never fetched).
  await page.goto(localUrl + '#astrologie/zeichen/widder', { waitUntil: 'load' });
  await page.locator('#astrologieRoot h1#astro-title').waitFor({ state: 'visible', timeout: 10000 });
  assert.match(await page.locator('#astrologieRoot h1#astro-title').textContent(), /Widder/);

  // Deep link cold start must open the article dialog from the file itself.
  await page.goto(localUrl + '#blog/1', { waitUntil: 'load' });
  await page.locator('#articleModal.open').waitFor({ state: 'visible', timeout: 10000 });
  const articleTitle = (await page.locator('#articleModalTitle').textContent()).trim();
  assert.ok(articleTitle.length > 0, 'deep link must show an article title');
  await page.locator('#closeArticleModal').click();

  // Skip link must keep the page visible and focus the main region.
  await page.goto(localUrl, { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#main').evaluate((node) => node === document.activeElement), true);
  const mainText = (await page.locator('#main').textContent()).trim();
  assert.ok(mainText.length > 0, 'skip link must not blank the page');

  assert.deepEqual(problems, [], 'offline run must be free of console/page/network problems');
});
