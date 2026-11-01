// Comprehensive smoke test for production
import { test, expect } from 'playwright/test';

// Parameterised target: default is the local Pages build (npm run test:e2e).
// Set BASE_URL to run the same suite against a deployment.
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/Esoterik-Welt';

test.describe('Production smoke test', () => {
  test('Home page loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('All hash routes navigate correctly', async ({ page }) => {
    const routes = ['#home', '#tarot', '#crystals', '#moon', '#runes', '#blog'];

    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    for (const route of routes) {
      await page.goto(BASE + '/' + route);
      await page.waitForLoadState('networkidle');

      // Check that the corresponding section is visible
      const sectionId = route.replace('#', '');
      const section = page.locator(`section[id="${sectionId}"]`);
      await expect(section).toBeVisible();
    }
  });

  test('Navigation links work', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    const navLinks = [
      { selector: 'a[data-page="home"]', target: '#home' },
      { selector: 'a[data-page="tarot"]', target: '#tarot' },
      { selector: 'a[data-page="crystals"]', target: '#crystals' },
      { selector: 'a[data-page="moon"]', target: '#moon' },
      { selector: 'a[data-page="runes"]', target: '#runes' },
      { selector: 'a[data-page="blog"]', target: '#blog' },
    ];

    for (const link of navLinks) {
      await page.click(link.selector);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(link.target);
    }
  });

  test('Legal pages accessible', async ({ page }) => {
    const legalPages = ['/impressum.html', '/datenschutz.html', '/haftung.html'];

    for (const legalPage of legalPages) {
      const response = await page.goto(BASE + legalPage);
      expect(response.status()).toBe(200);
      // main/article/body all match the markup; a multi-element locator is a
      // strict-mode violation. Assert body and the content container.
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('main#main')).toBeVisible();
    }
  });

  test('404 page works and has home link', async ({ page }) => {
    const response = await page.goto(BASE + '/nonexistent-page');
    expect(response.status()).toBe(404);
    // The 404 page ships <base href="/Esoterik-Welt/">, so its home links are
    // absolute inside the project base (the old "/#home" assumption predates
    // the base-href fix and never matched this page).
    await expect(page.locator('a[href="/Esoterik-Welt/#home"]')).toBeVisible();
  });

  test('Assets load correctly', async ({ page }) => {
    const assets = ['/css/design-system.css', '/css/main.css', '/assets/favicon.svg', '/js/main.js'];

    for (const asset of assets) {
      const response = await page.request.get(BASE + asset);
      expect(response.status(), asset + ' should return 200').toBe(200);
    }
  });

  test('External links have correct attributes', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    const externalLinks = await page.locator('a[href^="http"]').all();

    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel');

      // External links should have target="_blank" and rel="noopener"
      if (href && !href.includes('ingbms.github.io')) {
        expect(target).toBe('_blank');
        expect(rel).toContain('noopener');
      }
    }
  });

  test('Tarot card draw functionality', async ({ page }) => {
    await page.goto(BASE + '/#tarot');
    await page.waitForLoadState('networkidle');

    // Click draw card button
    await page.click('#drawCardBtn');
    await page.waitForTimeout(1000); // Wait for animation

    // Check drawn card container appears
    await expect(page.locator('#drawnCardContainer')).toBeVisible();
  });

  test('Crystal filters work', async ({ page }) => {
    await page.goto(BASE + '/#crystals');
    await page.waitForLoadState('networkidle');

    // Test chakra filter
    await page.selectOption('#chakraFilter', 'heart');
    await page.waitForTimeout(500);

    // Test color filter
    await page.selectOption('#colorFilter', 'green');
    await page.waitForTimeout(500);

    // Test search
    await page.fill('#crystalSearch', 'quarz');
    await page.waitForTimeout(500);

    // Reset
    await page.selectOption('#chakraFilter', 'all');
    await page.selectOption('#colorFilter', 'all');
    await page.fill('#crystalSearch', '');
  });

  test('Moon phase displays', async ({ page }) => {
    await page.goto(BASE + '/#moon');
    await page.waitForLoadState('networkidle');

    // Check moon phase name is loaded
    await expect(page.locator('#moonPhaseName')).not.toHaveText('Lade...');
    await expect(page.locator('#moonIllumination')).not.toHaveText('Beleuchtung: —%');
  });

  test('Rune casting works', async ({ page }) => {
    await page.goto(BASE + '/#runes');
    await page.waitForLoadState('networkidle');

    // Cast single rune
    await page.click('#castSingleRuneBtn');
    await page.waitForTimeout(1000);
    await expect(page.locator('#runeCastResult')).toBeVisible();

    // Cast 3 runes
    await page.click('#castRunesBtn');
    await page.waitForTimeout(1000);
    await expect(page.locator('#castRunes')).toBeVisible();
  });

  test('Blog filters and search work', async ({ page }) => {
    await page.goto(BASE + '/#blog');
    await page.waitForLoadState('networkidle');

    // Test category filter
    await page.selectOption('#categoryFilter', 'tarot');
    await page.waitForTimeout(500);

    // Test search
    await page.fill('#articleSearch', 'tarot');
    await page.waitForTimeout(500);

    // Reset
    await page.selectOption('#categoryFilter', 'all');
    await page.fill('#articleSearch', '');
  });

  test('Footer legal links work', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    // Footer links are relative to <base href="/Esoterik-Welt/">; the old
    // root-absolute "href=/impressum.html" form never matched this markup.
    const legalLinks = [
      { selector: 'a[href="impressum.html"]', target: '/impressum.html' },
      { selector: 'a[href="datenschutz.html"]', target: '/datenschutz.html' },
      { selector: 'a[href="haftung.html"]', target: '/haftung.html' },
    ];

    for (const link of legalLinks) {
      await page.goto(BASE + '/');
      await page.waitForLoadState('networkidle');
      await page.click(link.selector);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(link.target);
    }
  });

  test('Skip link works', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    // Tab to skip link and activate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Main should be focused
    await expect(page.locator('#main')).toBeFocused();
  });
});
