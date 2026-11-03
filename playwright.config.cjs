/**
 * Playwright runner — browser specs only (tests, files ending in .spec.js).
 *
 * The specs target the same URL layout as the GitHub Pages deployment
 * (/Esoterik-Welt/), so they run against a local build served by index.js.
 * Set BASE_URL to point the suites at a deployment instead of the local build.
 *
 * Port hardening (QA finding m-3): the suite owns a dedicated port (3310) — not
 * the preview port 3100 — and never reuses a server that is already listening.
 * `scripts/serve-e2e.cjs` aborts the run with a clear message when the port is
 * taken, so a stale preview server can no longer be adopted and produce false
 * failures. `tests/helpers/e2e-target.cjs` is the single source for port and
 * base URL; every spec derives its base URL from it.
 */
const { defineConfig } = require('playwright/test');

const { E2E_PORT, E2E_BASE_URL } = require('./tests/helpers/e2e-target.cjs');

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
    baseURL: E2E_BASE_URL,
    browserName: 'chromium',
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: {
    command: 'node scripts/serve-e2e.cjs',
    url: `${E2E_BASE_URL.replace(/\/Esoterik-Welt$/, '')}/api/health`,
    env: { E2E_PORT: String(E2E_PORT) },
    reuseExistingServer: false,
    // Servermeldungen (Port, Abbruch bei Kollision) gehören ins CI-Log.
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 30000,
  },
});
