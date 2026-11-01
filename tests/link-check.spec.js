// Comprehensive internal link check
import { test, expect } from 'playwright/test';

// Parameterised target: default is the local Pages build (npm run test:e2e).
// Set BASE_URL to run the same suite against a deployment.
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/Esoterik-Welt';

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
