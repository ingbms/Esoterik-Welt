// Prüft die Farbwahl der Meditation über alle zwölf Farbwelten und alle
// Zeitleisten-Filter.
// Aufruf: node probe-more-tools.mjs <root> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/more-tools.json';
const { server, base } = await startServer(rootDir, 3286);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push({ page: page.url(), text: String(error).slice(0, 160) }));

const colours = ['rot', 'orange', 'gelb', 'gruen', 'tuerkis', 'blau', 'indigo', 'violett', 'magenta', 'rosa', 'weiss', 'schwarz'];
await page.goto(`${base}/#farbwelten/farbmeditation`);
await page.waitForTimeout(300);
const med = [];
for (const id of colours) {
  const result = await page.evaluate((colour) => {
    const input = document.querySelector(`input[name="fwMedColor"][value="${colour}"]`) || document.querySelector(`input[name="fwCompassColor"][value="${colour}"]`);
    if (!input) return { missing: true };
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return new Promise((resolve) =>
      requestAnimationFrame(() => {
        const root = document.getElementById('farbweltenRoot');
        const text = (root.querySelector('.fw-meditation')?.innerText || root.innerText || '').replace(/\s+/g, ' ');
        const heading = root.querySelector('.fw-meditation h3, .fw-meditation__title, #fwMedColorName')?.textContent.trim();
        resolve({ heading, snippet: text.slice(0, 180), timer: document.getElementById('fwMedTimer')?.textContent.trim() });
      })
    );
  }, id);
  med.push({ id, ...result });
}

await page.goto(`${base}/#farbwelten/zeitleiste`);
await page.waitForTimeout(300);
const strands = await page.evaluate(() =>
  [...document.querySelectorAll('.fw-tl-filter')].map((node) => node.dataset.strand)
);
const filters = [];
for (const strand of [...strands, 'alle']) {
  const result = await page.evaluate((value) => {
    const root = document.getElementById('farbweltenRoot');
    const button = value === 'alle' ? root.querySelector('.fw-tl-filter[data-strand="all"], .fw-tl-filter') : root.querySelector(`.fw-tl-filter[data-strand="${value}"]`);
    button.click();
    return new Promise((resolve) =>
      setTimeout(() => {
        const events = [...root.querySelectorAll('.fw-timeline__event')];
        resolve({
          pressed: [...root.querySelectorAll('.fw-tl-filter[aria-pressed="true"]')].map((node) => node.dataset.strand),
          visible: events.filter((node) => !node.hidden).length,
          total: events.length,
          status: document.getElementById('fwTimelineStatus')?.textContent.trim(),
        });
      }, 120)
    );
  }, strand);
  filters.push({ strand, ...result });
}

await browser.close();
server.close();
const summary = {
  meditation: med,
  meditationFailures: med.filter((entry) => entry.missing || !entry.heading || /undefined/.test(entry.snippet)),
  filters,
  errors,
};
fs.writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ meditation: med, filters, errors }, null, 2).slice(0, 4000));
