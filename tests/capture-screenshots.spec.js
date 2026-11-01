// Screenshot capture for F4 fixes verification
import { test } from 'playwright/test';

// Parameterised target: default is the local Pages build (npm run test:e2e).
// Set BASE_URL to run the same suite against a deployment.
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/Esoterik-Welt';

test.describe('Screenshots for F4 verification', () => {
  test('Home page screenshot', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/home-page.png', fullPage: true });
  });

  test('Tarot page screenshot', async ({ page }) => {
    await page.goto(BASE + '/#tarot');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/tarot-page.png', fullPage: true });
  });

  test('Crystals page screenshot', async ({ page }) => {
    await page.goto(BASE + '/#crystals');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/crystals-page.png', fullPage: true });
  });

  test('Moon page screenshot', async ({ page }) => {
    await page.goto(BASE + '/#moon');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/moon-page.png', fullPage: true });
  });

  test('Runes page screenshot', async ({ page }) => {
    await page.goto(BASE + '/#runes');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/runes-page.png', fullPage: true });
  });

  test('Blog page screenshot', async ({ page }) => {
    await page.goto(BASE + '/#blog');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/blog-page.png', fullPage: true });
  });

  test('Impressum page screenshot', async ({ page }) => {
    await page.goto(BASE + '/impressum.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/impressum-page.png', fullPage: true });
  });

  test('Datenschutz page screenshot', async ({ page }) => {
    await page.goto(BASE + '/datenschutz.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/datenschutz-page.png', fullPage: true });
  });

  test('Haftung page screenshot', async ({ page }) => {
    await page.goto(BASE + '/haftung.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/haftung-page.png', fullPage: true });
  });

  test('404 page screenshot', async ({ page }) => {
    await page.goto(BASE + '/nonexistent');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/404-page.png', fullPage: true });
  });
});
