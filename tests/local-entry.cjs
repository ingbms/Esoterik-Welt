const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'evidence/t_4f0ebfc2');

async function exercise(page, events, interactions = true) {
  await page.waitForFunction(() => document.querySelector('#featureGrid')?.children.length === 5, { timeout: 10000 });
  const metrics = await page.evaluate(() => ({
    url: location.href,
    base: document.baseURI,
    background: getComputedStyle(document.body).backgroundColor,
    counts: Object.fromEntries(
      ['featureGrid', 'tarotGrid', 'crystalGrid', 'runeGrid', 'articleGrid', 'moonCalendar', 'moonRituals'].map(
        (id) => [id, document.getElementById(id)?.children.length || 0]
      )
    ),
    modules: Object.keys(window.EsoterikWelt.state.modules),
  }));
  assert.equal(metrics.background, 'rgb(10, 5, 18)');
  assert.equal(metrics.counts.featureGrid, 5);
  assert.equal(metrics.counts.crystalGrid, 30);
  for (const [id, count] of Object.entries(metrics.counts)) assert.ok(count > 0, `${id} is empty`);
  assert.deepEqual(metrics.modules.sort(), ['blog', 'moon', 'runes', 'tarot']);
  for (const route of ['tarot', 'crystals', 'moon', 'runes', 'blog', 'home']) {
    if (await page.locator('#navToggle').isVisible()) await page.locator('#navToggle').click();
    await page.locator(`.nav-link[data-page="${route}"]`).click();
    await page.locator(`#${route}.active:not([hidden])`).waitFor({ state: 'visible' });
    assert.equal(new URL(page.url()).hash, '#' + route);
    if (!interactions) continue;
    if (route === 'tarot') {
      await page.locator('#drawThreeBtn').click();
      await page.locator('#cardModal:not([hidden])').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#drawnCards > *').count(), 3);
      await page.locator('#closeCardModal').click();
    } else if (route === 'crystals') {
      await page.locator('#crystalSearch').fill('Amethyst');
      await page.waitForFunction(() => document.querySelector('#crystalGrid')?.children.length === 1);
      await page.locator('#crystalGrid .crystal-card').first().click();
      await page.locator('#crystalModal:not([hidden])').waitFor({ state: 'visible' });
      await page.locator('#closeCrystalModal').click();
      await page.locator('#crystalSearch').fill('');
      await page.waitForFunction(() => document.querySelector('#crystalGrid')?.children.length === 30);
    } else if (route === 'moon') {
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#icalBtn').click()]);
      assert.equal(await download.failure(), null);
      const calendar = fs.readFileSync(await download.path(), 'utf8');
      assert.match(calendar, /BEGIN:VCALENDAR/);
      assert.match(calendar, /BEGIN:VEVENT/);
    } else if (route === 'runes') {
      await page.locator('#castRunesBtn').click();
      assert.equal(await page.locator('#castRunes > *').count(), 3);
    } else if (route === 'blog') {
      await page.locator('#articleGrid .article-card').first().click();
      await page.locator('#articleModal.open:not([hidden])').waitFor({ state: 'visible' });
      assert.ok((await page.locator('#articleModalBody').textContent()).length > 100);
      await page.locator('#closeArticleModal').click();
    }
  }
  assert.deepEqual(events, [], 'No console, page, request or HTTP errors');
  return metrics;
}

function watch(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push({ type: 'pageerror', text: e.message }));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push({ type: 'console', text: m.text() });
  });
  page.on('requestfailed', (r) => errors.push({ type: 'requestfailed', url: r.url(), text: r.failure()?.errorText }));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push({ type: 'http', status: r.status(), url: r.url() });
  });
  return errors;
}

test('Explorer index.html entry redirects to functional file application without CORS/asset errors', async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const width of [375, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
        offline: true,
      });
      const page = await context.newPage();
      const errors = watch(page);
      try {
        await page.goto(pathToFileURL(path.join(root, 'index.html')).href + '?local-test=1#crystals', {
          waitUntil: 'load',
        });
        await page.waitForURL(/\/Lokal\.html\?local-test=1#crystals$/, { timeout: 10000 });
        const metrics = await exercise(page, errors);
        await page.screenshot({ path: path.join(output, `file-${width}.png`), fullPage: true });
        results.push({ width, metrics, errors });
      } catch (error) {
        results.push({ width, url: page.url(), errors, failure: error.message });
        throw error;
      } finally {
        await context.close();
      }
    }
  } finally {
    fs.writeFileSync(
      path.join(output, 'file-results.json'),
      JSON.stringify({ chromium: browser.version(), results }, null, 2)
    );
    await browser.close();
  }
});

test('production package index.html opens the generated file app with normal motion', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ offline: true });
  const errors = watch(page);
  let metrics;
  try {
    await page.goto(pathToFileURL(path.join(root, 'dist/Esoterik-Welt/index.html')).href);
    await page.waitForURL(/\/dist\/Esoterik-Welt\/Lokal\.html$/);
    metrics = await exercise(page, errors);
  } finally {
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(
      path.join(output, 'production-file-results.json'),
      JSON.stringify({ chromium: browser.version(), metrics, errors }, null, 2)
    );
    await browser.close();
  }
});

test('tarot modal restores the captured focus after clearing its instance field', () => {
  const vm = require('node:vm');
  const source = fs
    .readFileSync(path.join(root, 'js/modules/tarot.js'), 'utf8')
    .replace(/^import .*;$/m, '')
    .replace('export class TarotModule', 'globalThis.TarotModule = class TarotModule');
  let delayed;
  const context = {
    tarotCards: [],
    document: { body: { style: {} } },
    setTimeout: (callback) => {
      delayed = callback;
    },
  };
  vm.runInNewContext(source, context);
  const modal = { classList: { remove() {} }, hidden: false };
  const tarot = new context.TarotModule(modal, null, null);
  let focused = false;
  tarot.previouslyFocused = {
    focus() {
      focused = true;
    },
  };
  tarot.closeModal();
  assert.equal(tarot.previouslyFocused, null);
  assert.equal(modal.hidden, true);
  delayed();
  assert.equal(focused, true);
});

test('generated local files match the production package', () => {
  for (const file of [
    'Lokal.html',
    'Lokal-impressum.html',
    'Lokal-datenschutz.html',
    'Lokal-haftung.html',
    'Lokal-404.html',
  ]) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(html, fs.readFileSync(path.join(root, 'dist/Esoterik-Welt', file), 'utf8'));
    assert.doesNotMatch(
      html,
      /<base\b|<script\b[^>]*(?:type="module"|src=)|<link\b[^>]*href="(?:css\/|assets\/|https:\/\/fonts)/i
    );
    assert.match(html, /GENERATED by npm run build/);
  }
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /<base href="\/Esoterik-Welt\/">/);
});

test('Lokal.html works offline in an isolated directory, including legal links and cold routes', async () => {
  fs.mkdirSync(output, { recursive: true });
  const isolated = fs.mkdtempSync(path.join(output, 'isolated-'));
  for (const file of [
    'Lokal.html',
    'Lokal-impressum.html',
    'Lokal-datenschutz.html',
    'Lokal-haftung.html',
    'Lokal-404.html',
  ])
    fs.copyFileSync(path.join(root, file), path.join(isolated, file));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ offline: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = watch(page);
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  // Any accidental fetch, even a caught failure, fails this check.
  await page.addInitScript(() => {
    window.fetch = () => {
      throw new Error('Offline build must not fetch');
    };
  });
  const url = pathToFileURL(path.join(isolated, 'Lokal.html')).href;
  const routes = [];
  try {
    await page.goto(url, { waitUntil: 'load' });
    await exercise(page, errors);
    for (const target of ['impressum', 'datenschutz', 'haftung']) {
      await page.locator(`footer a[href="Lokal-${target}.html"]`).click();
      await page.waitForURL(new RegExp(`/Lokal-${target}\\.html$`));
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(10, 5, 18)');
      await page.locator('.logo').click();
      await page.waitForURL(url);
      await page.waitForFunction(() => document.querySelector('#featureGrid')?.children.length === 5);
    }
    for (const route of ['tarot', 'crystals', 'moon', 'runes', 'blog']) {
      await page.goto('about:blank');
      await page.goto(url + '#' + route, { waitUntil: 'load' });
      await page.locator(`#${route}.active:not([hidden])`).waitFor({ state: 'visible' });
      routes.push(route);
    }
    await page.goto(pathToFileURL(path.join(isolated, 'Lokal-404.html')).href);
    await page.locator('a.home').click();
    await page.waitForURL(url);
    await page.waitForFunction(() => document.querySelector('#featureGrid')?.children.length === 5);
    assert.deepEqual(
      requests.filter((request) => !request.startsWith('file:')),
      []
    );
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, 'offline-isolated.png'), fullPage: true });
  } finally {
    fs.writeFileSync(
      path.join(output, 'offline-results.json'),
      JSON.stringify({ chromium: browser.version(), isolated, routes, requests, errors }, null, 2)
    );
    await browser.close();
    fs.rmSync(isolated, { recursive: true, force: true });
  }
});

async function verifyHTTP(name, base, interactions) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = watch(page);
  const assets = [];
  page.on('response', (response) => {
    if (/\/(?:css|js)\/.*\.(?:css|js)$/.test(response.url()))
      assets.push({ url: response.url(), status: response.status(), mime: response.headers()['content-type'] });
  });
  let metrics;
  try {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.goto(base, { waitUntil: 'networkidle' });
    metrics = await exercise(page, errors, interactions);
    assert.equal(metrics.base, base);
    for (const asset of assets) {
      assert.ok(asset.url.startsWith(base));
      assert.equal(asset.status, 200);
      assert.match(asset.mime, asset.url.endsWith('.css') ? /text\/css/ : /javascript/);
    }
    assert.ok(assets.some((asset) => asset.url.endsWith('/css/design-system.css')));
    await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  } finally {
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(
      path.join(output, `${name}-results.json`),
      JSON.stringify({ base, chromium: browser.version(), metrics, assets, errors }, null, 2)
    );
    await browser.close();
  }
}

test('production build HTTP preserves the Pages base and interactive modules', async () => {
  const server = require('../index.js').listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await verifyHTTP('production-http', `http://127.0.0.1:${server.address().port}/Esoterik-Welt/`, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('existing 4178 preview remains functional', { skip: !process.env.VERIFY_EXTERNAL }, async () => {
  await verifyHTTP('preview-4178', 'http://localhost:4178/Esoterik-Welt/', true);
});

test(
  'published GitHub Pages base remains functional (read-only navigation)',
  { skip: !process.env.VERIFY_EXTERNAL },
  async () => {
    await verifyHTTP('published-pages', 'https://ingbms.github.io/Esoterik-Welt/', false);
  }
);
