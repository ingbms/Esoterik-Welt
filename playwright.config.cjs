/**
 * Playwright runner — browser specs only (tests, files ending in .spec.js).
 *
 * The specs target the same URL layout as the GitHub Pages deployment
 * (/Esoterik-Welt/), so they run against a local build served by index.js.
 * Set BASE_URL to point the suites at a deployment instead of the local build.
 */
const { defineConfig } = require('playwright/test');

const PORT = Number(process.env.E2E_PORT || 3100);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}/Esoterik-Welt`;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  outputDir: './test-results/playwright',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_REPORT || 'test-results/playwright-report.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: {
    command: 'node index.js',
    url: `${BASE_URL.replace(/\/Esoterik-Welt$/, '')}/api/health`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
