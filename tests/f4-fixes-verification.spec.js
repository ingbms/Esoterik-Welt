// Focused smoke test for F4.1-F4.6 fixes verification
import { test, expect } from 'playwright/test';

// Parameterised target: default is the local Pages build (npm run test:e2e).
// Set BASE_URL to run the same suite against a deployment.
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/Esoterik-Welt';

test.describe('F4 Fixes Verification (P0-P2)', () => {
  test('F4.1/F4.3: Root loads with <base> and correct canonical', async ({ page }) => {
    await page.goto(BASE + '/');
    await expect(page.locator('base[href="/Esoterik-Welt/"]')).toHaveCount(1);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('ingbms.github.io/Esoterik-Welt');
  });

  test('F4.3: CSS assets load (design-system.css, main.css)', async ({ page }) => {
    for (const asset of ['/css/design-system.css', '/css/main.css']) {
      const resp = await page.request.get(BASE + asset);
      expect(resp.status(), asset + ' should 200').toBe(200);
    }
  });

  test('F4.3: Favicon asset exists', async ({ page }) => {
    const resp = await page.request.get(BASE + '/assets/favicon.svg');
    expect(resp.status()).toBe(200);
  });

  test('F4.3: JS modules load', async ({ page }) => {
    const modules = [
      '/js/main.js',
      '/js/data/tarot.js',
      '/js/data/crystals.js',
      '/js/data/runes.js',
      '/js/data/moon.js',
      '/js/data/articles.js',
      '/js/modules/tarot.js',
      '/js/modules/crystals.js',
      '/js/modules/moon.js',
      '/js/modules/runes.js',
      '/js/modules/blog.js',
    ];
    for (const module of modules) {
      const resp = await page.request.get(BASE + module);
      expect(resp.status(), module + ' should 200').toBe(200);
    }
  });

  test('F4.4: Legal routes resolve with .html', async ({ page }) => {
    for (const p of ['/impressum.html', '/datenschutz.html', '/haftung.html']) {
      const r = await page.request.get(BASE + p);
      expect(r.status(), p + ' should 200').toBe(200);
    }
  });

  test('F4.4: Legal pages have content', async ({ page }) => {
    for (const p of ['/impressum.html', '/datenschutz.html', '/haftung.html']) {
      await page.goto(BASE + p);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('F4.4/F4.1: 404 fallback works and links to #home', async ({ page }) => {
    const r = await page.request.get(BASE + '/nonexistent');
    expect(r.status()).toBe(404);
    await page.goto(BASE + '/nonexistent');
    // The 404 page ships <base href="/Esoterik-Welt/">, so its home links are
    // absolute inside the project base (the old "/#home" assumption predates
    // the base-href fix and never matched this page).
    await expect(page.locator('a[href="/Esoterik-Welt/#home"]')).toBeVisible();
  });

  test('F4.1: Public/index.html has correct base and stylesheet', async ({ page }) => {
    await page.goto(BASE + '/');
    // Check base href exists
    await expect(page.locator('base[href="/Esoterik-Welt/"]')).toHaveCount(1);
    // Check design-system.css is referenced
    await expect(page.locator('link[rel="stylesheet"][href="css/design-system.css"]')).toHaveCount(1);
  });

  test('Navigation: All hash routes accessible via direct URL', async ({ page }) => {
    const routes = ['#home', '#tarot', '#crystals', '#moon', '#runes', '#blog'];
    for (const route of routes) {
      await page.goto(BASE + '/' + route);
      await page.waitForLoadState('domcontentloaded');
      const sectionId = route.replace('#', '');
      await expect(page.locator(`section[id="${sectionId}"]`)).toBeVisible();
    }
  });

  test('Navigation: Nav links update URL hash', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('domcontentloaded');

    const navLinks = [
      { selector: 'a[data-page="home"]', hash: '#home' },
      { selector: 'a[data-page="tarot"]', hash: '#tarot' },
      { selector: 'a[data-page="crystals"]', hash: '#crystals' },
      { selector: 'a[data-page="moon"]', hash: '#moon' },
      { selector: 'a[data-page="runes"]', hash: '#runes' },
      { selector: 'a[data-page="blog"]', hash: '#blog' },
    ];

    for (const link of navLinks) {
      await page.goto(BASE + '/');
      await page.waitForLoadState('domcontentloaded');
      await page.click(link.selector);
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain(link.hash);
    }
  });

  test('Footer: Legal links work', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('domcontentloaded');

    // Footer links are relative to <base href="/Esoterik-Welt/">; the old
    // root-absolute "href=/impressum.html" form never matched this markup.
    const legalLinks = [
      { selector: 'a[href="impressum.html"]', target: '/impressum.html' },
      { selector: 'a[href="datenschutz.html"]', target: '/datenschutz.html' },
      { selector: 'a[href="haftung.html"]', target: '/haftung.html' },
    ];

    for (const link of legalLinks) {
      await page.goto(BASE + '/');
      await page.waitForLoadState('domcontentloaded');
      await page.click(link.selector);
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain(link.target);
    }
  });

  test('External links have security attributes', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('domcontentloaded');

    const externalLinks = await page.locator('a[href^="http"]').all();

    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel');

      if (href && !href.includes('ingbms.github.io')) {
        expect(target).toBe('_blank');
        expect(rel).toContain('noopener');
      }
    }
  });

  test('Skip link navigates to main', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('domcontentloaded');

    // Focus skip link and activate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Main should be focused
    await expect(page.locator('#main')).toBeFocused();
  });

  test('OG/Twitter meta tags point to correct domain', async ({ page }) => {
    await page.goto(BASE + '/');

    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

    expect(ogUrl).toContain('ingbms.github.io/Esoterik-Welt');
    expect(canonical).toContain('ingbms.github.io/Esoterik-Welt');

    // Reviewed decision (t_b5861420, finding L3): assets/og-preview.png does not
    // exist, so the broken og:image / twitter:image references were removed
    // instead of shipping a 404 asset. Assert the surviving contract, not the
    // removed image URLs.
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(0);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  });
});
