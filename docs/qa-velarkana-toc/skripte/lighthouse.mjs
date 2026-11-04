/**
 * Lighthouse-Lauf (Accessibility + Performance) gegen die lokal ausgelieferte
 * Pilotseite. Aufruf: node qa-toc-436eeffb/lighthouse.mjs <label>
 * Ausgabe: evidence/qa-toc-436eeffb/lighthouse-<label>.json
 */
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { DIST, writeJson } from './lib.mjs';
import { startServer } from './lib.mjs';

const label = process.argv[2] || 'pilot';
const server = await startServer(DIST);
const url = `${server.base}/frequenzen/quellen.html`;

const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});
let result;
try {
  result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['accessibility', 'performance'],
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttlingMethod: 'simulate',
  });
} finally {
  await chrome.kill();
  await server.close();
}

const lhr = JSON.parse(result.report);
const auditRefs = lhr.categories.accessibility.auditRefs;
const failingA11y = auditRefs
  .map((ref) => lhr.audits[ref.id])
  .filter((a) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'informative')
  .map((a) => ({ id: a.id, title: a.title, score: a.score, nodes: (a.details?.items || []).map((i) => i.node?.selector || i.node?.snippet || '').slice(0, 6) }));

const summary = {
  label,
  url,
  generatedAt: new Date().toISOString(),
  lighthouseVersion: lhr.lighthouseVersion,
  scores: {
    accessibility: lhr.categories.accessibility.score,
    performance: lhr.categories.performance.score,
  },
  metrics: {
    cls: lhr.audits['cumulative-layout-shift']?.numericValue,
    lcp: lhr.audits['largest-contentful-paint']?.numericValue,
    tbt: lhr.audits['total-blocking-time']?.numericValue,
    fcp: lhr.audits['first-contentful-paint']?.numericValue,
    speedIndex: lhr.audits['speed-index']?.numericValue,
  },
  failingA11y,
  consoleErrors: (lhr.audits['errors-in-console']?.details?.items || []).length,
};
writeJson(`lighthouse-${label}.json`, summary);
console.log(JSON.stringify(summary, null, 2));
