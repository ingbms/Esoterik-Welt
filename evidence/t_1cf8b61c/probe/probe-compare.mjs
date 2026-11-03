// Vergleicht zwei Builds auf unbekannten Routen und nichtspektralen Farben.
// Aufruf: node probe-compare.mjs <rootA> <rootB>
import { chromium } from 'playwright';
import { startServer } from './lib.mjs';

const [rootA, rootB] = process.argv.slice(2);
const a = await startServer(rootA, 3281);
const b = await startServer(rootB, 3282);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const report = {};
for (const [label, base] of [
  ['integriert', a.base],
  ['basis-e44fa5c', b.base],
]) {
  report[label] = {};
  for (const hash of ['#gibtsnicht', '#farbwelten/gibtsnicht', '#farbwelten/tuerkis', '#farbwelten/kompass']) {
    await page.goto(`${base}/${hash}`);
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const root = document.getElementById('farbweltenRoot');
      const h1 = [...document.querySelectorAll('h1')].filter((n) => n.getClientRects().length);
      return {
        title: document.title,
        h1: h1.map((n) => n.textContent.trim()),
        h1Id: h1.map((n) => n.id),
        rootData: root ? { ...root.dataset } : null,
        rootChildren: root ? root.children.length : 0,
        text: (main.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 320),
      };
    });
    report[label][hash] = info;
  }
}
await browser.close();
a.server.close();
b.server.close();
console.log(JSON.stringify(report, null, 2));
