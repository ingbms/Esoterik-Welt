// Comprehensive internal link check
import { test, expect } from 'playwright/test';

// Parameterised target: default is the local Pages build (npm run test:e2e).
// Set BASE_URL to run the same suite against a deployment.
import { E2E_BASE_URL as BASE } from './helpers/e2e-target.cjs';

test.describe('Internal link verification', () => {
  test('All internal links from home page return 200', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('domcontentloaded');

    // Get all links
    const links = await page.locator('a[href]').all();
    const urls = new Set();

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        // Resolve relative URLs
        let fullUrl;
        if (href.startsWith('/')) {
          fullUrl = BASE + href;
        } else if (href.startsWith('#')) {
          fullUrl = BASE + '/' + href;
        } else {
          fullUrl = BASE + '/' + href;
        }
        urls.add(fullUrl);
      }
    }

    // Check each unique URL
    const results = [];
    for (const url of urls) {
      try {
        const resp = await page.request.get(url);
        results.push({ url, status: resp.status(), ok: resp.ok() });
        if (!resp.ok()) {
          console.log(`FAIL: ${url} -> ${resp.status()}`);
        }
      } catch (e) {
        results.push({ url, status: 'ERROR', ok: false, error: e.message });
        console.log(`ERROR: ${url} -> ${e.message}`);
      }
    }

    // Report failures
    const failures = results.filter((r) => !r.ok);
    if (failures.length > 0) {
      console.log('Failed links:', JSON.stringify(failures, null, 2));
    }

    // All internal links should return 200 or be hash routes (which are handled by SPA)
    // For hash routes, we check the base page returns 200
    expect(failures.length).toBe(0);
  });

  test('All legal page links return 200', async ({ page }) => {
    const legalPages = ['/impressum.html', '/datenschutz.html', '/haftung.html'];

    for (const legalPage of legalPages) {
      await page.goto(BASE + legalPage);
      await page.waitForLoadState('domcontentloaded');

      const links = await page.locator('a[href]').all();
      const urls = new Set();

      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
          let fullUrl;
          if (href.startsWith('/')) {
            fullUrl = BASE + href;
          } else if (href.startsWith('#')) {
            fullUrl = BASE + '/' + href;
          } else {
            fullUrl = BASE + '/' + href;
          }
          urls.add(fullUrl);
        }
      }

      for (const url of urls) {
        const resp = await page.request.get(url);
        expect(resp.ok(), `${url} from ${legalPage} should return 200`).toBeTruthy();
      }
    }
  });

  test('404 page links return 200', async ({ page }) => {
    const doc = await page.goto(BASE + '/nonexistent');
    expect(doc.status()).toBe(404);
    await page.waitForLoadState('domcontentloaded');

    const links = await page.locator('a[href]').all();
    const urls = new Set();

    // The 404 page ships <base href="/Esoterik-Welt/">, so its links are
    // project-absolute. Resolve against document.baseURI instead of
    // concatenating BASE + href (which produced /Esoterik-Welt/Esoterik-Welt/).
    const documentBase = await page.evaluate(() => document.baseURI);
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:')) continue;
      urls.add(new URL(href, documentBase).href);
    }

    for (const url of urls) {
      const resp = await page.request.get(url);
      expect(resp.ok(), `${url} from 404 should return 200`).toBeTruthy();
    }
  });
});

test.describe('Frequenzbereich: interne Verlinkung und Quellendokument (P11)', () => {
  // Der Hub ist der Einstieg; ohne die Bibliothek ist die Ansicht nicht fertig
  // gerendert und jeder Link-Check würde nur das Ladegerüst prüfen.
  async function openHub(page) {
    await page.goto(BASE + '/#frequenzen', { waitUntil: 'load' });
    await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
  }

  test('kontextuelle Links führen nach Astrologie, Kristalle und Wissensbereich', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await openHub(page);

    // Inhaltliche Nachbarschaft statt globaler Navigation: je Link prüfen,
    // dass er im Frequenzbereich steht, Text trägt und die Zielansicht öffnet.
    const cases = [
      ['#astrologie', 'astrologie'],
      ['#crystals', 'crystals'],
      ['#blog/3', 'blog'],
    ];
    for (const [href, target] of cases) {
      const link = page.locator(`#frequenzen a[href="${href}"]`).first();
      await expect(link, `${href} muss im Frequenzbereich verlinkt sein`).toBeVisible();
      expect((await link.textContent()).trim().length, `${href} braucht Linktext`).toBeGreaterThan(3);
      await link.click();
      await expect(page.locator(`#${target}.active:not([hidden])`)).toBeVisible();
      await openHub(page);
    }
    expect(errors).toEqual([]);
  });

  test('das Quellendokument ist im Build ausgeliefert und antwortet', async ({ page }) => {
    const response = await page.request.get(`${BASE}/docs/frequenz-quellen.md`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^text\/(plain|markdown)/);
    expect(await response.text()).toContain('# Frequenzen: Quellen, Evidenzstatus und Methodik');
  });

  test('#frequenzen/quellen rendert das Dokument lesbar statt als Roh-Markdown', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`${BASE}/#frequenzen/quellen`, { waitUntil: 'load' });
    const body = page.locator('#fqQuellenBody');
    await expect(body.locator('h2').first()).toHaveText(/Quellen, Evidenzstatus und Methodik/);
    expect(await body.locator('h3').count()).toBeGreaterThanOrEqual(10);
    expect(await body.locator('table').count()).toBeGreaterThanOrEqual(5);
    expect(await body.locator('th[scope="col"]').count()).toBeGreaterThanOrEqual(15);

    // Roh-Markdown darf nur innerhalb der Codeblöcke stehen (dort sind `#`-
    // Kommentare und `**`-Beispiele legitimer Inhalt).
    const text = await body.evaluate((root) => {
      const clone = root.cloneNode(true);
      clone.querySelectorAll('pre').forEach((node) => node.remove());
      return clone.textContent;
    });
    expect(text, 'keine Überschriften-Marker').not.toMatch(/#{2,}\s/);
    expect(text, 'keine rohe H1-Zeile').not.toContain('# Frequenzen: Quellen');
    expect(text, 'keine Tabellen-Trenner').not.toContain('|---');
    expect(text, 'keine Fett-Marker').not.toContain('**');

    // Genau ein aktueller Eintrag in der Bereichsnavigation, eigener Titel.
    await expect(page.locator('.fq-nav [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.fq-nav [aria-current="page"]')).toHaveText('Quellen & Methodik');
    expect(await page.title()).toContain('Quellen');

    // Der Link auf die Rohdatei antwortet im Build.
    const raw = page.locator('#frequenzen a[href="docs/frequenz-quellen.md"]').first();
    await expect(raw).toBeVisible();
    const rawResponse = await page.request.get(`${BASE}/docs/frequenz-quellen.md`);
    expect(rawResponse.status()).toBe(200);
    expect(errors).toEqual([]);
  });

  test('das Labor verlinkt das Quellendokument und die Ansicht bleibt erreichbar', async ({ page }) => {
    await page.goto(`${BASE}/#frequenzen/labor`, { waitUntil: 'load' });
    await expect(page.locator('#fqPlay')).toBeVisible();
    const link = page.locator('#frequenzen a[href="#frequenzen/quellen"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.locator('#fqQuellenBody h2').first()).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#frequenzen/quellen');
    // Zurück zur Bibliothek über die Bereichsnavigation.
    await page.locator('.fq-nav a[href="#frequenzen"]').click();
    await expect(page.locator('#fqLibrary .fq-entry').first()).toBeVisible();
  });
});
