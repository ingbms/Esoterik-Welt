// Abnahme t_1cf8b61c — Prüfpunkt 3 (A11y) und 7 (Kontrast-Basis):
// axe-core auf allen neuen Ansichten, Kontrastmessung der Farbpaletten,
// Fokus-Sichtbarkeit, Beschriftung von Slider und Buttons, aria-live-Prüfung.
// Aufruf: node probe-a11y.mjs <root> <out.json>
import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { startServer, contrastRatio } from './lib.mjs';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/a11y.json';
const { server, base } = await startServer(rootDir, 3292);

const NEW_VIEWS = [
  { id: 'landing', hash: '#farbwelten' },
  { id: 'tuerkis', hash: '#farbwelten/tuerkis' },
  { id: 'magenta', hash: '#farbwelten/magenta' },
  { id: 'rosa', hash: '#farbwelten/rosa' },
  { id: 'weiss', hash: '#farbwelten/weiss' },
  { id: 'schwarz', hash: '#farbwelten/schwarz' },
  { id: 'farbtherapie', hash: '#farbwelten/farbtherapie' },
  { id: 'farbpsychologie', hash: '#farbwelten/farbpsychologie' },
  { id: 'lichtmedizin', hash: '#farbwelten/lichtmedizin' },
  { id: 'kompass', hash: '#farbwelten/kompass' },
  { id: 'farbmeditation', hash: '#farbwelten/farbmeditation' },
  { id: 'zeitleiste', hash: '#farbwelten/zeitleiste' },
];

const findings = [];
const record = (id, severity, message, repro) => findings.push({ id, severity, message, repro });

async function runAxe(page, label) {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () => {
    const axe = window.axe;
    const outcome = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    });
    return {
      violations: outcome.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.slice(0, 5).map((node) => ({
          target: node.target,
          summary: (node.failureSummary || '').split('\n').slice(0, 2).join(' '),
        })),
        count: violation.nodes.length,
      })),
      incomplete: outcome.incomplete.map((entry) => ({ id: entry.id, count: entry.nodes.length })),
      passes: outcome.passes.length,
    };
  });
  return { label, ...result };
}

const axeResults = [];
const engines = { chromium, firefox, webkit };
const engineSummary = {};
for (const [engineName, engine] of Object.entries(engines)) {
  let browser;
  try {
    browser = await engine.launch();
  } catch (error) {
    engineSummary[engineName] = { launched: false, error: String(error).slice(0, 200) };
    continue;
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push({ url: page.url(), text: m.text().slice(0, 200) });
  });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push({ url: page.url(), text: String(e).slice(0, 200) }));
  const views = engineName === 'chromium' ? NEW_VIEWS : NEW_VIEWS.filter((view) => ['kompass', 'farbmeditation', 'zeitleiste', 'tuerkis', 'schwarz'].includes(view.id));
  for (const view of views) {
    await page.goto(`${base}/${view.hash}`);
    await page.waitForTimeout(320);
    const result = await runAxe(page, `${engineName}:${view.id}`);
    axeResults.push(result);
    for (const violation of result.violations)
      record(
        'P3-axe',
        violation.impact === 'critical' || violation.impact === 'serious' ? 'blocking' : 'major',
        `${engineName}/${view.id}: ${violation.id} (${violation.impact}, ${violation.count} Knoten) – ${violation.nodes[0]?.target}`,
        view.hash
      );
  }
  engineSummary[engineName] = { launched: true, views: views.length, consoleErrors, pageErrors };
  await browser.close();
}

// Kontrast der Paletten: Text (≥4,5:1) und Linien (≥3:1) je Farbwelt.
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/#farbwelten`);
await page.waitForTimeout(300);
const palette = await page.evaluate(() => {
  const ids = [
    'rot',
    'orange',
    'gelb',
    'gruen',
    'tuerkis',
    'blau',
    'indigo',
    'violett',
    'magenta',
    'rosa',
    'weiss',
    'schwarz',
  ];
  const style = getComputedStyle(document.documentElement);
  const read = (name) => style.getPropertyValue(name).trim();
  return ids.map((id) => ({
    id,
    ink: read(`--fw-${id}-ink`),
    core: read(`--fw-${id}-core`),
    soft: read(`--fw-${id}-soft`),
    line: read(`--fw-${id}-line`),
    deep: read(`--fw-${id}-deep`),
    deepAlt: read(`--fw-${id}-deep-alt`),
  }));
});
const parseHex = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
};
const contrast = palette.map((entry) => {
  const deep = parseHex(entry.deep);
  const deepAlt = parseHex(entry.deepAlt || entry.deep);
  const ink = parseHex(entry.ink);
  const line = parseHex(entry.line);
  const soft = parseHex(entry.soft || entry.ink);
  const core = parseHex(entry.core);
  const row = {
    id: entry.id,
    inkOnDeep: contrastRatio(ink, deep),
    inkOnDeepAlt: contrastRatio(ink, deepAlt),
    softOnDeep: contrastRatio(soft, deep),
    lineOnDeep: contrastRatio(line, deep),
    lineOnDeepAlt: contrastRatio(line, deepAlt),
    coreOnDeep: contrastRatio(core, deep),
  };
  if (row.inkOnDeep < 4.5) record('P3-contrast', 'blocking', `${entry.id}: Text ${row.inkOnDeep}:1 auf -deep`, `Palette ${entry.id}`);
  if (row.lineOnDeep < 3) record('P3-contrast', 'blocking', `${entry.id}: Linie ${row.lineOnDeep}:1 auf -deep`, `Palette ${entry.id}`);
  if (row.lineOnDeepAlt < 3) record('P3-contrast', 'major', `${entry.id}: Linie ${row.lineOnDeepAlt}:1 auf -deep-alt`, `Palette ${entry.id}`);
  return row;
});

// Gemessene Textfarben im Browser je neuer Ansicht (nicht nur Tokens).
const measuredText = [];
for (const view of NEW_VIEWS) {
  await page.goto(`${base}/${view.hash}`);
  await page.waitForTimeout(260);
  const worst = await page.evaluate(() => {
    const parse = (value) => value.match(/[\d.]+/g)?.map(Number) || [];
    const lum = ([r, g, b]) =>
      [r, g, b]
        .map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const bgOf = (node) => {
      let current = node;
      while (current) {
        const background = getComputedStyle(current).backgroundColor;
        const rgb = parse(background);
        if (rgb.length >= 3 && !/rgba\(0, 0, 0, 0\)/.test(background)) return rgb;
        current = current.parentElement;
      }
      return [10, 10, 12];
    };
    const candidates = [...document.querySelectorAll('#farbweltenRoot *')].filter((node) => {
      if (!node.textContent.trim()) return false;
      const style = getComputedStyle(node);
      return style.visibility !== 'hidden' && style.display !== 'none' && node.getClientRects().length;
    });
    const rows = candidates.map((node) => {
      const style = getComputedStyle(node);
      const fg = parse(style.color);
      const bg = bgOf(node);
      const l1 = lum(fg);
      const l2 = lum(bg);
      const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
      return {
        ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100,
        size: Number.parseFloat(style.fontSize),
        weight: style.fontWeight,
        text: node.textContent.trim().slice(0, 40),
        tag: node.tagName,
        cls: typeof node.className === 'string' ? node.className.slice(0, 40) : '',
      };
    });
    const large = (row) => row.size >= 24 || (row.size >= 18.66 && Number(row.weight) >= 700);
    const failures = rows.filter((row) => row.ratio < (large(row) ? 3 : 4.5));
    return { checked: rows.length, failures: failures.slice(0, 8), min: Math.min(...rows.map((row) => row.ratio)) };
  });
  measuredText.push({ view: view.id, ...worst });
  for (const failure of worst.failures)
    record(
      'P3-text',
      'blocking',
      `${view.id}: „${failure.text}“ (${failure.tag}.${failure.cls}) ${failure.ratio}:1`,
      view.hash
    );
}

// Fokus-Sichtbarkeit per Tastatur auf den neuen Ansichten.
const focusRows = [];
for (const view of NEW_VIEWS) {
  await page.goto(`${base}/${view.hash}`);
  await page.waitForTimeout(260);
  const focus = [];
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const node = document.activeElement;
      if (!node || node === document.body) return null;
      const style = getComputedStyle(node);
      const label = node.closest('label');
      const labelStyle = label ? getComputedStyle(label) : null;
      return {
        tag: node.tagName,
        text: (node.textContent || node.getAttribute('aria-label') || '').trim().slice(0, 30),
        outline: `${style.outlineStyle} ${style.outlineWidth}`,
        shadow: style.boxShadow,
        labelShadow: labelStyle ? labelStyle.boxShadow : null,
        labelOutline: labelStyle ? `${labelStyle.outlineStyle} ${labelStyle.outlineWidth}` : null,
      };
    });
    if (info) focus.push(info);
  }
  const invisible = focus.filter(
    (entry) =>
      entry.outline.startsWith('none') &&
      (!entry.shadow || entry.shadow === 'none') &&
      (!entry.labelShadow || entry.labelShadow === 'none') &&
      (!entry.labelOutline || entry.labelOutline.startsWith('none'))
  );
  focusRows.push({ view: view.id, count: focus.length, invisible });
  for (const entry of invisible)
    record('P3-focus', 'major', `${view.id}: kein sichtbarer Fokus an ${entry.tag} „${entry.text}“`, view.hash);
}

// Slider- und Button-Beschriftung.
const labels = {};
for (const view of ['landing', 'kompass', 'farbmeditation', 'zeitleiste']) {
  await page.goto(`${base}/${view === 'landing' ? '#farbwelten' : `#farbwelten/${view}`}`);
  await page.waitForTimeout(250);
  labels[view] = await page.evaluate(() => {
    const root = document.getElementById('farbweltenRoot');
    const controls = [...root.querySelectorAll('button, input, select, a.btn')];
    return controls
      .filter((node) => node.getClientRects().length)
      .map((node) => ({
        tag: node.tagName,
        type: node.type || '',
        name:
          node.getAttribute('aria-label') ||
          node.getAttribute('aria-labelledby') ||
          (node.id ? document.querySelector(`label[for="${node.id}"]`)?.textContent.trim() : '') ||
          node.textContent.trim().slice(0, 40),
        valueText: node.getAttribute('aria-valuetext'),
        min: node.getAttribute('min'),
        max: node.getAttribute('max'),
      }))
      .slice(0, 24);
  });
}
for (const [view, controls] of Object.entries(labels))
  for (const control of controls)
    if (!control.name) record('P3-label', 'blocking', `${view}: ${control.tag}${control.type ? `[${control.type}]` : ''} ohne Namen`, view);

// aria-live nur wo nötig: alle Live-Regionen und Statusrollen auflisten.
const liveRegions = {};
for (const view of ['landing', 'kompass', 'farbmeditation', 'zeitleiste', 'farbtherapie']) {
  await page.goto(`${base}/${view === 'landing' ? '#farbwelten' : `#farbwelten/${view}`}`);
  await page.waitForTimeout(250);
  liveRegions[view] = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="timer"]')].map((node) => ({
      tag: node.tagName,
      role: node.getAttribute('role'),
      live: node.getAttribute('aria-live'),
      id: node.id,
      textLength: node.textContent.trim().length,
    }))
  );
}
for (const [view, regions] of Object.entries(liveRegions))
  for (const region of regions)
    if (region.live === 'polite' && region.textLength > 600)
      record('P3-live', 'major', `${view}: große Live-Region (${region.textLength} Zeichen, #${region.id})`, view);

// Sprechende Überschriftenstruktur: keine Sprünge.
const headingSkips = [];
for (const view of NEW_VIEWS) {
  await page.goto(`${base}/${view.hash}`);
  await page.waitForTimeout(220);
  const levels = await page.evaluate(() =>
    [...document.querySelectorAll('#farbweltenRoot h1, #farbweltenRoot h2, #farbweltenRoot h3, #farbweltenRoot h4')]
      .filter((node) => node.getClientRects().length)
      .map((node) => Number(node.tagName.slice(1)))
  );
  const skip = levels.some((level, index) => index > 0 && level - levels[index - 1] > 1);
  headingSkips.push({ view: view.id, levels, skip });
  if (skip) record('P3-heading', 'major', `${view.id}: Überschriftensprung ${levels.join('→')}`, view.hash);
}

await browser.close();
server.close();

const summary = {
  axe: {
    runs: axeResults.length,
    violations: axeResults.reduce((sum, result) => sum + result.violations.length, 0),
    byEngine: Object.fromEntries(
      Object.entries(engineSummary).map(([engine, info]) => [
        engine,
        {
          launched: info.launched,
          views: info.views || 0,
          violations: axeResults
            .filter((result) => result.label.startsWith(`${engine}:`))
            .reduce((sum, result) => sum + result.violations.length, 0),
          incomplete: axeResults
            .filter((result) => result.label.startsWith(`${engine}:`))
            .flatMap((result) => result.incomplete),
          consoleErrors: info.consoleErrors || [],
          pageErrors: info.pageErrors || [],
        },
      ])
    ),
  },
  contrast,
  measuredText: measuredText.map((entry) => ({ view: entry.view, checked: entry.checked, min: entry.min, failures: entry.failures.length })),
  focus: focusRows.map((row) => ({ view: row.view, tabStops: row.count, invisible: row.invisible.length })),
  labels,
  liveRegions,
  headingSkips: headingSkips.map((row) => ({ view: row.view, skip: row.skip })),
  findings,
  blocking: findings.filter((entry) => entry.severity === 'blocking').length,
};
fs.writeFileSync(out, JSON.stringify({ summary, axeResults, focusRows }, null, 2));
console.log(JSON.stringify(summary, null, 2).slice(0, 6000));
