// ESLint flat config for the CommonJS pages project.
// Generated / third-party / vendored trees are ignored; application sources
// and repository scripts are linted for real.
const js = require('@eslint/js');
const globals = require('globals');
const astro = require('eslint-plugin-astro');
const tseslint = require('typescript-eslint');

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
      // Generiertes Deployment-Artefakt (dist + Pfadumschreibung).
      '.deploy/**',
      // Einmalige Migrations-/Prüfwerkzeuge (werden über npm-Skripte
      // aufgerufen, nicht als Anwendungscode gepflegt).
      'scripts/migration/**',
      // Archivierter Vor-Astro-Platzhalter (siehe legacy/public/README.md).
      'legacy/**',
      // Astro generiert Typen und Content-Collection-Typen nach .astro/.
      '.astro/**',
      'src/env.d.ts',
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
    // `qa/**` enthält die unabhängige Abnahme-Suite (eigene Konfiguration).
    files: ['tests/**/*.spec.js', 'qa/**/*.spec.js'],
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
    // node:test files in ESM (tests/*.mjs) laufen im Node-Prozess; sie
    // brauchen neben den Browser-Modulen auch Node-Globals wie setTimeout.
    files: ['tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
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
  // --- Astro/TypeScript (VELARKANA-Migration) -----------------------------
  // eslint-plugin-astro 1.7 ist die letzte Version mit ESLint-9-Peer; die
  // Legacy-Lint-Kette bleibt auf ESLint 9.39.1 gepinnt. Der Umstieg auf
  // ESLint 10 + eslint-plugin-astro 3.x ist ein eigener Schritt.
  ...astro.configs['flat/recommended'],
  {
    files: ['src/**/*.astro'],
    // Astro-Frontmatter ist TypeScript; der Astro-Parser reicht das an
    // typescript-eslint weiter, damit .ts-Syntax typgeprüft lintbar ist.
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  // TypeScript: empfohlener Regelsatz plus Regeln gegen unsaubere Typen.
  // Die TS-Configs werden auf src/**/*.ts begrenzt: der typescript-eslint-
  // Basiseintrag aktiviert sonst Regeln wie no-require-imports auch für die
  // CommonJS-Legacy-Dateien. Legacy-.d.ts in js/ bleibt wie bisher außen vor.
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['src/**/*.ts'] })),
  {
    files: ['src/**/*.ts'],
    rules: {
      // Die Basis-Regel kennt keine Typdeklarationen; TS-Variante übernimmt.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  // Node-Globals für Build-Konfigurationen (astro.config.mjs liest process.env)
  // und für eigene Astro-Integrationen (astro-plugins/*.mjs).
  {
    files: ['*.mjs', 'astro-plugins/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
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
