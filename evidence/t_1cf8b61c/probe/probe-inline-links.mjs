// Prüft die Darstellung der Inline-Links im Fließtext der Themenseiten.
// Aufruf: node probe-inline-links.mjs <root> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence_tmp';
const { server, base } = await startServer(rootDir, 3287);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const rows = [];
for (const hash of ['#farbwelten/farbtherapie', '#farbwelten/farbpsychologie', '#farbwelten/lichtmedizin']) {
  await page.goto(`${base}/${hash}`);
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const links = [...document.querySelectorAll('#farbweltenRoot p a, #farbweltenRoot li a')].filter(
      (node) => node.getClientRects().length
    );
    const parse = (value) => value.match(/[\d.]+/g)?.map(Number) || [];
    const lum = ([r, g, b]) =>
      [r, g, b]
        .map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    return links.slice(0, 12).map((node) => {
      const style = getComputedStyle(node);
      const parentStyle = getComputedStyle(node.parentElement);
      const fg = lum(parse(style.color));
      const bg = lum(parse(parentStyle.color));
      const [hi, lo] = fg >= bg ? [fg, bg] : [bg, fg];
      return {
        text: node.textContent.trim().slice(0, 40),
        href: node.getAttribute('href'),
        color: style.color,
        textColor: parentStyle.color,
        decoration: style.textDecorationLine,
        borderBottom: style.borderBottomWidth,
        fontWeight: style.fontWeight,
        contrastToText: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100,
        parent: node.parentElement.tagName,
      };
    });
  });
  rows.push({ hash, links: info });
}
await browser.close();
server.close();
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.log(JSON.stringify(rows, null, 2).slice(0, 4000));
