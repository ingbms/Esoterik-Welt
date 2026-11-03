// Abnahme t_1cf8b61c — Prüfpunkt 6: Regression der Kernseiten gegen e44fa5c.
// Vergleicht axe-core-Befunde und Sichtbarkeit der neun Navigationsziele auf
// den acht Kernseiten zwischen Basisstand und integriertem Stand.
// Aufruf: node probe-regression.mjs <integriert-root> <basis-root> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { startServer } from './lib.mjs';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const [rootNew, rootOld] = process.argv.slice(2);
const out = process.argv[4] || 'evidence/t_1cf8b61c/probe/regression.json';
const neu = await startServer(rootNew, 3295);
const alt = await startServer(rootOld, 3296);

const PAGES = ['#home', '#tarot', '#crystals', '#moon', '#runes', '#astrologie', '#blog', '#pendeln'];
const browser = await chromium.launch();

async function audit(base, hash) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
  await page.goto(`${base}/${hash}`);
  await page.waitForTimeout(400);
  await page.addScriptTag({ path: axePath });
  const axe = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target.join(' ')),
    }));
  });
  const nav = await page.evaluate(() =>
    [...document.querySelectorAll('.nav-link')].filter((node) => node.getClientRects().length).map((node) => (node.textContent || '').trim())
  );
  const heading = await page.evaluate(() => {
    const h1 = [...document.querySelectorAll('h1')].filter((node) => node.getClientRects().length);
    return h1.map((node) => node.textContent.trim());
  });
  await page.close();
  return { axe, nav, heading, consoleErrors, pageErrors };
}

const rows = [];
for (const hash of PAGES) {
  const before = await audit(alt.base, hash);
  const after = await audit(neu.base, hash);
  const newViolations = after.axe.filter((violation) => !before.axe.some((entry) => entry.id === violation.id));
  const moreNodes = after.axe
    .map((violation) => {
      const previous = before.axe.find((entry) => entry.id === violation.id);
      const previousNodes = new Set(previous ? previous.nodes : []);
      const added = violation.nodes.filter((node) => !previousNodes.has(node));
      return added.length ? { id: violation.id, added } : null;
    })
    .filter(Boolean);
  rows.push({
    hash,
    before: { violations: before.axe.map((entry) => `${entry.id}:${entry.nodes.length}`), nav: before.nav.length, heading: before.heading },
    after: { violations: after.axe.map((entry) => `${entry.id}:${entry.nodes.length}`), nav: after.nav.length, heading: after.heading },
    newViolations: newViolations.map((entry) => `${entry.id} (${entry.nodes.length})`),
    moreNodes,
    consoleErrors: { before: before.consoleErrors.length, after: after.consoleErrors.length },
    pageErrors: { before: before.pageErrors.length, after: after.pageErrors.length },
  });
}

// Neun Navigationsziele: dieselben Beschriftungen in beiden Ständen.
const navBefore = (await audit(alt.base, '#home')).nav;
const navAfter = (await audit(neu.base, '#home')).nav;

await browser.close();
neu.server.close();
alt.server.close();
const regressions = rows.filter(
  (row) => row.newViolations.length || row.moreNodes.length || row.after.nav < row.before.nav || row.after.heading.length !== 1
);
const summary = {
  pages: rows.length,
  regressions,
  navBefore,
  navAfter,
  rows,
};
fs.writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ pages: rows.length, regressions, navBefore, navAfter, table: rows.map((row) => ({ hash: row.hash, before: row.before.violations, after: row.after.violations, nav: `${row.before.nav}→${row.after.nav}` })) }, null, 2));
