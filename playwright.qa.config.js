/**
 * QA-Konfiguration für die unabhängige Abnahme des Frequenzlabors (t_835bd1e9).
 *
 * Bewusst getrennt von playwright.config.js:
 *  - drei echte Browser-Engines (Chromium, Firefox, WebKit) als Projekte,
 *  - eigener Port und `reuseExistingServer: false`, damit niemals ein fremder
 *    oder veralteter Entwicklungsserver die Ergebnisse verfälscht,
 *  - eigener Testordner, damit die Feature-Suite (tests/*.spec.js) unverändert
 *    bleibt und beide Sätze getrennt berichtet werden können.
 *
 * Der Serverstart läuft wie bei der Feature-Suite über `scripts/serve-e2e.cjs`:
 * ein belegter Port bricht mit eindeutiger Meldung ab, statt still einen fremden
 * Server zu übernehmen (QA-Befund m-3).
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
    command: 'node scripts/serve-e2e.cjs',
    url: `${BASE_URL.replace(/\/Esoterik-Welt$/, '')}/api/health`,
    env: { E2E_PORT: String(PORT) },
    reuseExistingServer: false,
    // Servermeldungen (Port, Abbruch bei Kollision) gehören ins CI-Log.
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60000,
  },
});
