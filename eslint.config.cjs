// ESLint flat config for the CommonJS pages project.
// Generated / third-party / vendored trees are ignored; application sources
// and repository scripts are linted for real.
const js = require('@eslint/js');
const globals = require('globals');

// Globals used inside page.evaluate() callbacks (they execute in the browser,
// not in the Node process that runs the test file).
const evaluateGlobals = {
  document: 'readonly',
  window: 'readonly',
  location: 'readonly',
  getComputedStyle: 'readonly',
  innerWidth: 'readonly',
  innerHeight: 'readonly',
  Image: 'readonly',
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'evidence/**',
      'test-results/**',
      '.lighthouseci/**',
      'coverage/**',
      'docs/**',
      'public/**',
      // Archived legacy module: underscore prefix = not part of the build
      // (build-pages/verify ignore it the same way).
      'js/modules/_*.js',
      'Lokal*.html',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    // Browser application modules (ES modules, loaded via <script type="module">).
    // .mjs kennzeichnet die reine Rechenmodule, die auch von node --test
    // importiert werden (data/moon-astro.mjs).
    files: ['js/**/*.js', 'data/**/*.js', 'data/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    // Playwright specs are ES modules executed by the Playwright runner.
    files: ['tests/**/*.spec.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...evaluateGlobals },
    },
  },
  {
    // node:test files and page-driving scripts: browser globals only inside
    // page.evaluate callbacks.
    files: ['tests/**/*.cjs', 'scripts/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...evaluateGlobals },
    },
  },
  {
    // Jest unit/API tests.
    files: ['tests/**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    rules: {
      // Empty catch blocks are a deliberate pattern in the legacy feature modules.
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none' }],
    },
  },
];
