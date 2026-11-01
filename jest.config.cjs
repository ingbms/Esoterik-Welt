/**
 * Jest runner — unit and API tests only (CommonJS).
 *
 * The project is CommonJS (`"type": "commonjs"`). Browser end-to-end specs are
 * ES modules that import `playwright/test`; they must be executed by the
 * Playwright test runner (`playwright.config.cjs`, `npm run test:e2e`).
 * Jest's default discovery pattern also collects the browser specs in tests/,
 * which previously produced seven red suites with
 * "Cannot use import statement outside a module". Discovery is therefore
 * restricted here instead of relaxing the project to ESM.
 */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test-results/'],
  moduleFileExtensions: ['js', 'cjs', 'json'],
  verbose: true,
};
