// Regression tests for F4.1–F4.6 fixes (diagnosis REPORT_site-audit.md)
// Reference: base href / publicPath (P1), routes (P2), assets (P1), 404 (P0)
import { test, expect } from 'playwright/test';

// Parameterised target: default is the local Pages build (npm run test:e2e).
// Set BASE_URL to run the same suite against a deployment.
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/Esoterik-Welt';

test.describe('Routing / asset fixes', () => {
  test('Root loads with <base> and correct canonical', async ({ page }) => {
    await page.goto(BASE + '/');
    await expect(page.locator('base[href="/Esoterik-Welt/"]')).toHaveCount(1);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('ingbms.github.io/Esoterik-Welt');
  });

  test('CSS asset loads (F4.3)', async ({ page }) => {
    await page.goto(BASE + '/css/design-system.css');
    await expect(page.locator('body')).toContainText(''); // 200 = CSS text
    const resp = await page.request.get(BASE + '/css/design-system.css');
    expect(resp.status()).toBe(200);
  });

  test('Legal routes resolve with .html (F4.4)', async ({ page }) => {
    for (const p of ['/impressum.html', '/datenschutz.html', '/haftung.html']) {
      const r = await page.request.get(BASE + p);
      expect(r.status(), p + ' should 200').toBe(200);
    }
  });

  test('404 fallback works and links to #home (F4.4/F4.1)', async ({ page }) => {
    const r = await page.request.get(BASE + '/nonexistent');
    expect(r.status()).toBe(404);
    // GitHub Pages serves 404.html; verify content contains start link
    await page.goto(BASE + '/nonexistent');
    // The 404 page ships <base href="/Esoterik-Welt/">, so its home links are
    // absolute inside the project base (the old "/#home" assumption predates
    // the base-href fix and never matched this page).
    await expect(page.locator('a[href="/Esoterik-Welt/#home"]')).toBeVisible();
  });

  test('Favicon asset exists (P1)', async ({ page }) => {
    const r = await page.request.get(BASE + '/assets/favicon.svg');
    expect(r.status()).toBe(200);
  });

  test('Root page loads design-system.css stylesheet (P1 divergence)', async ({ page }) => {
    // Verify the design-system.css stylesheet is referenced
    await page.goto(BASE + '/');
    const link = await page.locator('link[rel="stylesheet"][href="css/design-system.css"]');
    await expect(link).toHaveCount(1);
  });
});
