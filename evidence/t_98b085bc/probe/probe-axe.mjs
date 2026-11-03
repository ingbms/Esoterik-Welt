// Nachweis B2: axe-core (Chromium) auf den drei Themenseiten und dem Kompass.
// Aufruf: node probe-axe.mjs <base-url> <ausgabe.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const base = process.argv[2] || 'http://127.0.0.1:8137/Esoterik-Welt/';
const output = process.argv[3] || 'evidence/t_98b085bc/axe.json';
const ROUTES = [
  'farbwelten/farbtherapie',
  'farbwelten/farbpsychologie',
  'farbwelten/lichtmedizin',
  'farbwelten/kompass',
  'farbwelten/tuerkis',
];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

const report = { axeVersion: null, runs: [], errors, failures: [] };
for (const route of ROUTES) {
  await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async (tags) => {
    const axe = window.axe;
    const outcome = await axe.run(document, {
      runOnly: { type: 'tag', values: tags },
      resultTypes: ['violations'],
    });
    return {
      version: axe.version,
      violations: outcome.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.length,
        targets: violation.nodes.map((node) => node.target.join(' ')),
      })),
    };
  }, TAGS);
  report.axeVersion = result.version;
  report.runs.push({ route, violations: result.violations });
  for (const violation of result.violations) {
    report.failures.push(`${route}: ${violation.id} (${violation.impact}) an ${violation.nodes} Knoten`);
  }
}

// Zusätzlich: berechnete Darstellung der Fließtext-Links (WCAG 1.4.1).
const linkStyles = [];
for (const route of ROUTES.slice(0, 3)) {
  await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
  const found = await page.evaluate(() =>
    [...document.querySelectorAll('#farbweltenRoot a.fw-inline-link')].map((node) => {
      const style = getComputedStyle(node);
      return {
        text: node.textContent.trim().slice(0, 50),
        color: style.color,
        decoration: style.textDecorationLine,
        thickness: style.textDecorationThickness,
      };
    })
  );
  for (const link of found) linkStyles.push({ route, ...link });
}
report.linkStyles = linkStyles;

await browser.close();
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      axeVersion: report.axeVersion,
      runs: report.runs.map((run) => ({ route: run.route, violations: run.violations })),
      linkStyles: report.linkStyles.length,
      underlines: report.linkStyles.filter((link) => link.decoration.includes('underline')).length,
      errors: report.errors,
      failures: report.failures,
    },
    null,
    2
  )
);
if (report.failures.length || report.errors.length) process.exitCode = 1;
