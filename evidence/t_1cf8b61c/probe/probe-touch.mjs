// Abnahme t_1cf8b61c — Touch-Ziele (effektive Trefferfläche) auf den neuen
// Ansichten. Radiogruppen werden über ihr <label> gemessen, Inline-Links im
// Fließtext sind nach WCAG 2.5.8 (Inline-Ausnahme) ausgenommen.
// Aufruf: node probe-touch.mjs <root> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/touch.json';
const { server, base } = await startServer(rootDir, 3294);
const ROUTES = [
  '#farbwelten',
  '#farbwelten/tuerkis',
  '#farbwelten/magenta',
  '#farbwelten/rosa',
  '#farbwelten/weiss',
  '#farbwelten/schwarz',
  '#farbwelten/farbtherapie',
  '#farbwelten/farbpsychologie',
  '#farbwelten/lichtmedizin',
  '#farbwelten/kompass',
  '#farbwelten/farbmeditation',
  '#farbwelten/zeitleiste',
];

const browser = await chromium.launch();
const rows = [];
for (const width of [320, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  for (const hash of ROUTES) {
    await page.goto(`${base}/${hash}`);
    await page.waitForTimeout(240);
    const info = await page.evaluate(() => {
      const measured = [];
      const taken = new Set();
      const controls = [...document.querySelectorAll('#farbweltenRoot button, #farbweltenRoot input, #farbweltenRoot summary, #farbweltenRoot select, #farbweltenRoot a')];
      for (const node of controls) {
        if (!node.getClientRects().length || node.disabled) continue;
        if (node.tagName === 'A' && node.closest('p, li, dd') && node.getBoundingClientRect().height < 24) {
          continue; // Inline-Link im Fließtext (WCAG 2.5.8 Ausnahme)
        }
        let target = node;
        if ((node.type === 'radio' || node.type === 'checkbox') && node.closest('label')) target = node.closest('label');
        if (taken.has(target)) continue;
        taken.add(target);
        const rect = target.getBoundingClientRect();
        measured.push({
          tag: target.tagName,
          type: target.type || node.type || '',
          name:
            (target.textContent || node.getAttribute('aria-label') || node.id || '').replace(/\s+/g, ' ').trim().slice(0, 40),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
      return { measured, slider: (() => {
        const slider = document.querySelector('#fwWavelength');
        if (!slider) return null;
        const rect = slider.getBoundingClientRect();
        return { w: Math.round(rect.width), h: Math.round(rect.height) };
      })() };
    });
    const tooSmall = info.measured.filter((entry) => entry.w < 32 || entry.h < 32);
    rows.push({ width, hash, count: info.measured.length, min: Math.min(...info.measured.map((entry) => Math.min(entry.w, entry.h))), tooSmall, slider: info.slider });
  }
  await context.close();
}
await browser.close();
server.close();
const summary = {
  cells: rows.length,
  min: Math.min(...rows.map((row) => row.min)),
  violations: rows.reduce((sum, row) => sum + row.tooSmall.length, 0),
  byRoute: rows.map((row) => ({ width: row.width, hash: row.hash, count: row.count, min: row.min, tooSmall: row.tooSmall.length })),
  small: rows.flatMap((row) => row.tooSmall.map((entry) => ({ width: row.width, hash: row.hash, ...entry }))).slice(0, 20),
};
fs.writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
console.log(JSON.stringify(summary, null, 2));
