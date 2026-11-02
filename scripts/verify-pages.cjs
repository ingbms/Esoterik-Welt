const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = process.argv[2] || 'https://ingbms.github.io/Esoterik-Welt/';
const output = path.resolve(process.argv[3] || 'evidence/t_9ff78898/live');
const baseline = process.argv.includes('--baseline');
const routes = [
  'home',
  'tarot',
  'crystals',
  'moon',
  'astrologie',
  'runes',
  'blog',
  'impressum.html',
  'datenschutz.html',
  'haftung.html',
  '404.html',
];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of [375, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const network = await context.newCDPSession(page);
      await network.send('Network.enable');
      await network.send('Network.setCacheDisabled', { cacheDisabled: true });
      let events = [];
      page.on('console', (msg) => {
        if (['error', 'warning'].includes(msg.type())) events.push({ type: msg.type(), text: msg.text() });
      });
      page.on('pageerror', (error) => events.push({ type: 'pageerror', text: error.message }));
      page.on('requestfailed', (req) =>
        events.push({ type: 'requestfailed', url: req.url(), text: req.failure()?.errorText })
      );
      page.on('response', (response) =>
        events.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          mime: response.headers()['content-type'],
          csp: response.headers()['content-security-policy'] || null,
        })
      );
      for (const route of routes) {
        await page.goto('about:blank');
        events = [];
        const url = base + (route.endsWith('.html') ? route : route === 'home' ? '' : '#' + route);
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
        const metrics = await page.evaluate(() => {
          // Resolve the expected background from the token, not from a literal.
          const probe = document.createElement('div');
          probe.style.backgroundColor = 'var(--color-bg-deep)';
          document.body.append(probe);
          const tokenBackground = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return {
            title: document.title,
            url: location.href,
            base: document.baseURI,
            background: getComputedStyle(document.body).backgroundColor,
            backgroundImage: getComputedStyle(document.body).backgroundImage,
            font: getComputedStyle(document.body).fontFamily,
            headingFont: document.querySelector('h1,h2')
              ? getComputedStyle(document.querySelector('h1,h2')).fontFamily
              : null,
            stylesheets: [...document.styleSheets].map((sheet) => ({
              href: sheet.href,
              rules: (() => {
                try {
                  return sheet.cssRules.length;
                } catch {
                  return null;
                }
              })(),
            })),
            activePage: document.querySelector('.page.active')?.id,
            featureCount: document.querySelector('#featureGrid')?.children.length,
            renderedCounts: Object.fromEntries(
              [
                'tarotGrid',
                'crystalGrid',
                'runeGrid',
                'articleGrid',
                'moonCalendar',
                'moonRituals',
                'astrologieRoot',
              ].map((id) => [id, document.getElementById(id)?.children.length || 0])
            ),
            navDisplay: document.querySelector('.nav')
              ? getComputedStyle(document.querySelector('.nav')).display
              : null,
            overflow: document.documentElement.scrollWidth > innerWidth,
            links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
            tokenBackground,
          };
        });
        const failures = [];
        try {
          assert.equal(response ? response.status() : 200, 200, 'document status');
          assert.ok(
            metrics.background !== 'rgba(0, 0, 0, 0)' || metrics.backgroundImage !== 'none',
            'missing page background'
          );
          assert.notEqual(metrics.background, 'rgb(255, 255, 255)', 'white unstyled background');
          if (route !== '404.html') {
            assert.equal(metrics.background, metrics.tokenBackground, 'design-system background not applied');
            assert.ok(
              metrics.stylesheets.some((s) => s.href?.endsWith('/css/design-system.css') && s.rules > 0),
              'design-system stylesheet missing'
            );
          }
          if (!route.endsWith('.html')) {
            assert.equal(metrics.activePage, route, 'navigation must reveal selected page');
            assert.equal(metrics.featureCount, 6, 'application initialization must populate six features');
            for (const [id, count] of Object.entries(metrics.renderedCounts)) {
              // The astrology container only renders while its own route is active.
              if (id === 'astrologieRoot' && route !== 'astrologie') continue;
              assert.ok(count > 0, `${id} must render its content`);
            }
          }
          for (const link of metrics.links) {
            if (new URL(link).origin === new URL(base).origin)
              assert.ok(link.startsWith(base), 'navigation outside project base: ' + link);
          }
          assert.equal(metrics.overflow, false, 'horizontal overflow');
        } catch (error) {
          failures.push(error.message);
        }
        for (const event of events) {
          if (['error', 'pageerror', 'requestfailed'].includes(event.type) || event.status >= 400)
            failures.push(JSON.stringify(event));
          if (event.type === 'response' && /\/(css|js)\//.test(event.url)) {
            if (!event.url.startsWith(base.split('#')[0])) failures.push('asset outside base: ' + event.url);
            if (/\.css(?:\?|$)/.test(event.url) && !event.mime?.includes('text/css'))
              failures.push('bad CSS MIME: ' + event.url);
            if (/\.js(?:\?|$)/.test(event.url) && !/javascript/.test(event.mime || ''))
              failures.push('bad JS MIME: ' + event.url);
          }
        }
        await page.screenshot({
          path: path.join(output, `${route.replace('.html', '')}-${width}.png`),
          fullPage: true,
        });
        results.push({ route, width, status: response?.status(), metrics, events: [...events], failures });
        console.log(`${failures.length ? 'FAIL' : 'PASS'} ${width} ${route}: ${failures.join('; ')}`);
      }
      // Exercise actual mobile/desktop navigation instead of only direct hashes.
      await page.goto(base, { waitUntil: 'networkidle' });
      for (const route of ['tarot', 'crystals', 'moon', 'astrologie', 'runes', 'blog', 'home']) {
        if (await page.locator('#navToggle').isVisible()) await page.locator('#navToggle').click();
        await page.locator(`.nav-link[data-page="${route}"]`).click();
        await page.locator(`#${route}.active:not([hidden])`).waitFor({ state: 'visible' });
      }
      await context.close();
    }
  } finally {
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify({ base, date: new Date().toISOString(), results }, null, 2)
    );
    await browser.close();
  }
  const failed = results.filter((r) => r.failures.length);
  console.log(`${results.length} pages/viewports checked; ${failed.length} failures`);
  if (failed.length && !baseline) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
