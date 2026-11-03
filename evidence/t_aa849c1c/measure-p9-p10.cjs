// Messskript der Folgestufe P9/P10 (Ticket t_aa849c1c).
//
// Erhebt die Werte, die in docs/frequenzlabor-p9-p10.md und im ADR-Nachtrag §13
// genannt sind, gegen einen laufenden lokalen Vorschauserver:
//
//   npm run build
//   PORT=3902 node index.js
//   node evidence/t_aa849c1c/measure-p9-p10.cjs
//
// Ergebnisse: evidence/t_aa849c1c/measurements.json und vier Screenshots.
// Das Skript steuert nichts im Produkt; es liest DOM, Canvas und Netzwerk.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3902}/Esoterik-Welt`;
const OUT = __dirname;

const CONTRAST_HELPER = () => {
  const parse = (value) => {
    const match = /rgba?\(([^)]+)\)/.exec(value || '');
    if (!match) return null;
    const parts = match[1]
      .split(/[ ,/]+/)
      .filter(Boolean)
      .map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const luminance = ({ r, g, b }) => {
    const channel = (value) => {
      const s = value / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const composite = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const background = (element) => {
    const layers = [];
    let node = element;
    while (node) {
      const color = parse(getComputedStyle(node).backgroundColor);
      if (color && color.a > 0) {
        layers.push(color);
        if (color.a === 1) break;
      }
      node = node.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let index = layers.length - 1; index >= 0; index -= 1) base = composite(layers[index], base);
    return base;
  };
  window.__contrast = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return { selector, error: 'nicht gefunden' };
    const style = getComputedStyle(element);
    const foreground = composite(parse(style.color), background(element));
    const ratio =
      (Math.max(luminance(foreground), luminance(background(element))) + 0.05) /
      (Math.min(luminance(foreground), luminance(background(element))) + 0.05);
    const size = parseFloat(style.fontSize);
    const bold = Number(style.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    return { selector, ratio: Number(ratio.toFixed(2)), required: large ? 3 : 4.5 };
  };
};

async function canvasStats(page, selector) {
  return page.evaluate((target) => {
    const canvas = document.querySelector(target);
    if (!canvas) return null;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let bright = 0;
    let sum = 0;
    for (let index = 0; index < data.length; index += 4) {
      sum += data[index] + data[index + 1] + data[index + 2];
      if (data[index] + data[index + 1] + data[index + 2] > 300) bright += 1;
    }
    return { width: canvas.width, bright, sum };
  }, selector);
}

async function measureContrast(page, selectors) {
  await page.addScriptTag({ content: `(${CONTRAST_HELPER.toString()})()` });
  return page.evaluate((list) => list.map((selector) => window.__contrast(selector)), selectors);
}

async function axeAudit(page) {
  await page.addScriptTag({ path: path.join(process.cwd(), 'node_modules/axe-core/axe.min.js') });
  return page.evaluate(async () => {
    const result = await window.axe.run(document.getElementById('frequenzen'), {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    }));
  });
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const report = { generatedAt: new Date().toISOString(), base: BASE, views: {} };

  for (const [name, route] of [
    ['cymatics', 'frequenzen/cymatics'],
    ['meditation', 'frequenzen/meditation'],
  ]) {
    const page = await context.newPage();
    const requests = [];
    const errors = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`${BASE}/#${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const entry = { route, axe: await axeAudit(page), consoleErrors: errors };
    if (name === 'cymatics') {
      entry.canvasA = await canvasStats(page, '#fqCyCanvasA');
      await page.locator('#fqCyNA').selectOption('4');
      entry.canvasAAfterModeChange = await canvasStats(page, '#fqCyCanvasA');
      entry.contrast = await measureContrast(page, [
        '#fqCyTitle',
        '#fqCyTextA',
        '.fq-figcaption',
        '.fq-note',
        '.fq-figure-title',
      ]);
      entry.moduleRequests = requests.filter((url) => /frequenz[^/]*\.js/.test(url));
    } else {
      entry.contrast = await measureContrast(page, [
        '#fqMedTitle',
        '#fqMedTimer',
        '#fqMedPresetNote',
        '#fqMedStatus',
      ]);
      entry.touchTargets = await page.evaluate(() =>
        ['#fqMedStart', '#fqMedStop', '#fqMedDuration', '#fqMedPreset', '#fqMedFavSave'].map((selector) => {
          const rect = document.querySelector(selector).getBoundingClientRect();
          return { selector, height: Math.round(rect.height) };
        })
      );
      entry.moduleRequests = requests.filter((url) => /frequenz[^/]*\.js/.test(url));
    }
    report.views[name] = entry;
    await page.close();
  }

  // 360 px: kein horizontaler Überlauf in beiden Ansichten.
  const mobile = await browser.newPage({ viewport: { width: 360, height: 720 } });
  report.mobile = {};
  for (const route of ['frequenzen/cymatics', 'frequenzen/meditation']) {
    await mobile.goto(`${BASE}/#${route}`, { waitUntil: 'load' });
    await mobile.waitForTimeout(700);
    report.mobile[route] = await mobile.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
  }
  await mobile.close();

  // Screenshots für den Bericht.
  for (const [label, route, viewport] of [
    ['p9-cymatics-desktop', 'frequenzen/cymatics', { width: 1440, height: 1000 }],
    ['p10-meditation-desktop', 'frequenzen/meditation', { width: 1440, height: 1000 }],
    ['p9-cymatics-mobile', 'frequenzen/cymatics', { width: 360, height: 760 }],
    ['p10-meditation-mobile', 'frequenzen/meditation', { width: 360, height: 760 }],
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${BASE}/#${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: label.endsWith('desktop') });
    await page.close();
  }

  fs.writeFileSync(path.join(OUT, 'measurements.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
