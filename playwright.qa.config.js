/**
 * QA-Konfiguration für die unabhängige Abnahme des Frequenzlabors (t_835bd1e9).
 *
 * Bewusst getrennt von playwright.config.js:
 *  - drei echte Browser-Engines (Chromium, Firefox, WebKit) als Projekte,
 *  - eigener Port und `reuseExistingServer: false`, damit niemals ein fremder
 *    oder veralteter Entwicklungsserver die Ergebnisse verfälscht,
 *  - eigener Testordner, damit die Feature-Suite (tests/*.spec.js) unverändert
 *    bleibt und beide Sätze getrennt berichtet werden können.
 */
const { defineConfig, devices } = require('playwright/test');

const PORT = Number(process.env.QA_PORT || 3320);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}/Esoterik-Welt`;

module.exports = defineConfig({
  testDir: './qa',
  testMatch: '**/*.spec.js',
  outputDir: './test-results/qa',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.QA_JSON_REPORT || 'test-results/qa-report.json' }],
    ['html', { outputFolder: 'test-results/qa-html', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], browserName: 'chromium' } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], browserName: 'firefox' } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], browserName: 'webkit' } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'node index.js',
    url: `${BASE_URL.replace(/\/Esoterik-Welt$/, '')}/api/health`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 60000,
  },
});
