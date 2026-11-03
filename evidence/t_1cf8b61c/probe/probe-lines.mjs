// Abnahme t_1cf8b61c — Linien-/Rahmenkontrast (≥3:1) auf den Farbseiten.
// Misst für jedes Element mit sichtbarem Rahmen das Verhältnis Rahmen ↔
// Hintergrund und meldet den kleinsten Wert je Seite.
// Aufruf: node probe-lines.mjs <root> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/lines.json';
const { server, base } = await startServer(rootDir, 3285);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const COLOURS = ['rot', 'orange', 'gelb', 'gruen', 'tuerkis', 'blau', 'indigo', 'violett', 'magenta', 'rosa', 'weiss', 'schwarz'];

const rows = [];
for (const id of COLOURS) {
  await page.goto(`${base}/#farbwelten/${id}`);
  await page.waitForTimeout(280);
  const info = await page.evaluate(() => {
    const parse = (value) => (value.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) =>
      [r, g, b]
        .map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const ratio = (a, b) => {
      const [hi, lo] = a >= b ? [a, b] : [b, a];
      return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
    };
    const backgroundOf = (node) => {
      let current = node.parentElement;
      while (current) {
        const background = getComputedStyle(current).backgroundColor;
        const rgb = parse(background);
        if (rgb.length >= 3 && !/rgba\(0, 0, 0, 0\)/.test(background)) return rgb;
        current = current.parentElement;
      }
      return [10, 10, 12];
    };
    const nodes = [...document.querySelectorAll('#farbweltenRoot *')].filter((node) => {
      if (!node.getClientRects().length) return false;
      const style = getComputedStyle(node);
      const widths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
      return widths.some((width) => Number.parseFloat(width) > 0);
    });
    return nodes.map((node) => {
      const style = getComputedStyle(node);
      const border = parse(style.borderTopColor);
      const bg = backgroundOf(node);
      return {
        cls: typeof node.className === 'string' ? node.className.slice(0, 40) : '',
        tag: node.tagName,
        width: style.borderTopWidth,
        ratio: border.length >= 3 ? ratio(lum(border), lum(bg)) : null,
        border: style.borderTopColor,
        background: `rgb(${bg.join(', ')})`,
      };
    }).filter((entry) => entry.ratio !== null);
  });
  info.sort((a, b) => a.ratio - b.ratio);
  rows.push({ id, checked: info.length, min: info[0]?.ratio ?? null, worst: info.slice(0, 3), belowThree: info.filter((entry) => entry.ratio < 3) });
}
await browser.close();
server.close();
const summary = {
  pages: rows.length,
  globalMin: Math.min(...rows.map((row) => row.min ?? 99)),
  belowThree: rows.flatMap((row) => row.belowThree.map((entry) => ({ page: row.id, ...entry }))).slice(0, 15),
  perPage: rows.map((row) => ({ id: row.id, checked: row.checked, min: row.min, worst: row.worst[0] })),
};
fs.writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
console.log(JSON.stringify(summary, null, 2).slice(0, 5000));
