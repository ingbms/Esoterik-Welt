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
  'pendeln',
  'blog',
  'impressum.html',
  'datenschutz.html',
  'haftung.html',
  '404.html',
];

// --- Statische Dokumente ---------------------------------------------------
// Die SPA-Prüfung oben braucht JavaScript. Indexierbare Dokumente müssen
// dagegen schon im ausgelieferten HTML stehen. Diese Phase prüft sie über
// HTTP: Status, Kopfmetadaten, strukturierte Daten, Kerntext, interne Ziele,
// Bilder und Sitemap — ohne Browser und ohne JavaScript.

const STATIC_ROUTES = [
  'radiasthesie/',
  'radiasthesie/radiasthesie.html',
  'radiasthesie/pendeln.html',
  'radiasthesie/orakel.html',
  'radiasthesie/glossar.html',
  'radiasthesie/quellen.html',
  'radiasthesie/methodik.html',
];

const STATIC_CANONICAL = 'https://ingbms.github.io/Esoterik-Welt/';

async function get(url) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
  return { response, body: await response.text() };
}

async function verifyStaticDocuments(base, output) {
  const reports = [];
  const failures = [];
  const seen = new Set();
  const checkDocument = async (route) => {
    const url = new URL(route, base).href;
    const { response, body } = await get(url);
    const problems = [];
    const title = (/<title>([^<]+)<\/title>/.exec(body) || [])[1] || '';
    const canonical = (/<link rel="canonical" href="([^"]+)"/.exec(body) || [])[1] || '';
    const description = (/<meta name="description" content="([^"]+)"/.exec(body) || [])[1] || '';
    const h1 = (/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(body) || [])[1] || '';
    const scripts = [...body.matchAll(/<script\b([^>]*)>/g)].map((match) => match[1]);
    try {
      assert.equal(response.status, 200, 'Status');
      assert.ok(/text\/html/.test(response.headers.get('content-type') || ''), 'Content-Type');
      assert.ok(title.length > 10 && title.length <= 60, `Titel ${title.length} Zeichen`);
      assert.equal(canonical, new URL(route, STATIC_CANONICAL).href, 'Canonical');
      assert.ok(description.length >= 100 && description.length <= 160, `Description ${description.length}`);
      assert.equal(scripts.length, 1, 'genau ein Skript');
      assert.match(scripts[0] || '', /application\/ld\+json/, 'nur JSON-LD');
      assert.ok(!/<script\b(?![^>]*application\/ld\+json)/i.test(body), 'JavaScript im Dokument');
      assert.ok(h1.trim().length > 3, 'H1 fehlt');
      const raw = (/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(body) || [])[1];
      const json = JSON.parse(raw);
      const types = json['@graph'].map((node) => node['@type']);
      assert.ok(types.includes('BreadcrumbList'), 'BreadcrumbList fehlt');
      assert.ok(!JSON.stringify(json).includes('"#pendeln'), 'Hash-Adresse im JSON-LD');
      assert.ok(!types.includes('Article'), 'Article ohne Veröffentlichungsdatum');
      assert.ok(!types.includes('FAQPage'), 'FAQPage ohne FAQ-Inhalt');
      // Kerntext: die H1 steht als Text im HTML, nicht nur im JSON-LD.
      assert.ok(
        body
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .includes(h1.replace(/<[^>]+>/g, '').trim())
      );
      // Interne Ziele und Bilder.
      const pageUrl = new URL(url);
      const targets = new Set();
      const images = new Set();
      for (const match of body.matchAll(/\bhref="([^"]+)"/g)) {
        const href = match[1];
        if (/^(?:https?:|mailto:|tel:|data:)/.test(href) || href.startsWith('#')) continue;
        const target = new URL(href, pageUrl);
        target.hash = '';
        if (target.origin === pageUrl.origin) targets.add(target.href);
      }
      for (const match of body.matchAll(/<img\b[^>]*>/g)) {
        const tag = match[0];
        const src = (/\bsrc="([^"]+)"/.exec(tag) || [])[1];
        const alt = (/\balt="([^"]*)"/.exec(tag) || [])[1];
        assert.ok(alt && alt.trim().length > 20, `Alt-Text fehlt: ${src}`);
        const target = new URL(src, pageUrl);
        if (target.origin === pageUrl.origin) images.add(target.href);
      }
      for (const target of [...targets].slice(0, 80)) {
        if (seen.has(target)) continue;
        seen.add(target);
        const head = await fetch(target, { method: 'GET', signal: AbortSignal.timeout(20000) });
        assert.ok(head.ok, `internes Ziel ${target} → ${head.status}`);
      }
      for (const target of images) {
        if (seen.has(target)) continue;
        seen.add(target);
        const image = await fetch(target, { signal: AbortSignal.timeout(20000) });
        assert.ok(image.ok, `Bild ${target} → ${image.status}`);
        assert.ok(/^image\//.test(image.headers.get('content-type') || ''), `Bildtyp ${target}`);
      }
    } catch (error) {
      problems.push(error.message);
    }
    reports.push({
      route,
      url,
      status: response.status,
      title,
      canonical,
      descriptionLength: description.length,
      failures: problems,
    });
    for (const problem of problems) failures.push(`${route}: ${problem}`);
    console.log(`${problems.length ? 'FAIL' : 'PASS'} static ${route}: ${problems.join('; ')}`);
  };

  for (const route of STATIC_ROUTES) await checkDocument(route);

  // Sitemap: nur echte Dokumente, vollständig, ohne Fragmente.
  const sitemapUrl = new URL('sitemap.xml', base).href;
  const { body: sitemap } = await get(sitemapUrl);
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const sitemapProblems = [];
  try {
    assert.equal(locs.length, 11, `Sitemap-Einträge: ${locs.length}`);
    assert.equal(new Set(locs).size, locs.length, 'doppelte Einträge');
    for (const loc of locs) {
      assert.ok(loc.startsWith(STATIC_CANONICAL), `fremde Adresse: ${loc}`);
      assert.ok(!loc.includes('#'), `Fragment: ${loc}`);
      // Die Sitemap nennt Produktionsadressen. Geprüft wird das gerade
      // gebaute Artefakt — gleicher Pfad unter der lokalen Basis.
      const local = new URL(loc.slice(STATIC_CANONICAL.length), base).href;
      const head = await fetch(local, { signal: AbortSignal.timeout(20000) });
      assert.ok(head.ok, `Sitemap-Ziel ${loc} → ${head.status}`);
    }
    for (const route of STATIC_ROUTES) {
      assert.ok(locs.includes(new URL(route, STATIC_CANONICAL).href), `fehlt in Sitemap: ${route}`);
    }
  } catch (error) {
    sitemapProblems.push(error.message);
  }
  for (const problem of sitemapProblems) failures.push(`sitemap: ${problem}`);
  console.log(`${sitemapProblems.length ? 'FAIL' : 'PASS'} sitemap: ${sitemapProblems.join('; ')}`);

  const report = {
    base,
    date: new Date().toISOString(),
    documents: reports,
    sitemap: { url: sitemapUrl, entries: locs },
    failures,
  };
  fs.writeFileSync(path.join(output, 'static-results.json'), JSON.stringify(report, null, 2));
  console.log(`${reports.length} statische Dokumente geprüft; ${failures.length} Fehler`);
  return report;
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const staticReport = await verifyStaticDocuments(base, output);
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
                'pendelnRoot',
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
              // Area containers only render while their own route is active.
              if (id === 'astrologieRoot' && route !== 'astrologie') continue;
              if (id === 'pendelnRoot' && route !== 'pendeln') continue;
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
      for (const route of ['tarot', 'crystals', 'moon', 'astrologie', 'runes', 'pendeln', 'blog', 'home']) {
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
  console.log(
    `${results.length} pages/viewports checked; ${failed.length} failures; ` +
      `${staticReport.documents.length} statische Dokumente, ${staticReport.failures.length} Fehler`
  );
  if ((failed.length || staticReport.failures.length) && !baseline) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
