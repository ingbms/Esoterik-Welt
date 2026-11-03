// Abnahme t_1cf8b61c — Prüfpunkt 6b: Offline-Edition Lokal.html.
// Öffnet die Datei über file:// und prüft die neuen Routen ohne Netzzugriff.
// Aufruf: node probe-offline.mjs <pfad-zu-Lokal.html> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const file = path.resolve(process.argv[2] || 'Lokal.html');
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/offline.json';
const ROUTES = [
  { hash: '#farbwelten', expect: 'Farbwelten' },
  { hash: '#farbwelten/tuerkis', expect: 'Türkis' },
  { hash: '#farbwelten/magenta', expect: 'Magenta' },
  { hash: '#farbwelten/rosa', expect: 'Rosa' },
  { hash: '#farbwelten/weiss', expect: 'Weiß' },
  { hash: '#farbwelten/schwarz', expect: 'Schwarz' },
  { hash: '#farbwelten/farbtherapie', expect: 'Farbtherapie' },
  { hash: '#farbwelten/farbpsychologie', expect: 'Farbpsychologie' },
  { hash: '#farbwelten/lichtmedizin', expect: 'Lichtmedizin' },
  { hash: '#farbwelten/kompass', expect: 'Farben-Kompass' },
  { hash: '#farbwelten/farbmeditation', expect: 'Farbmeditation' },
  { hash: '#farbwelten/zeitleiste', expect: 'Zeitleiste' },
  { hash: '#farbwelten/lichtfrequenzen', expect: 'Lichtfrequenzen' },
  { hash: '#farbwelten/chakren', expect: 'Chakren' },
];

const base = pathToFileURL(file).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const requests = [];
const errors = [];
page.on('request', (request) => {
  const url = request.url();
  if (!url.startsWith('file:') && !url.startsWith('data:') && !url.startsWith('blob:')) requests.push({ page: page.url(), url });
});
page.on('requestfailed', (request) => {
  const url = request.url();
  if (!url.startsWith('file:') && !url.startsWith('data:') && !url.startsWith('blob:')) requests.push({ page: page.url(), url, failed: true });
});
page.on('pageerror', (error) => errors.push({ page: page.url(), text: String(error).slice(0, 200) }));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push({ page: page.url(), text: message.text().slice(0, 200) });
});

const rows = [];
for (const route of ROUTES) {
  await page.goto(`${base}${route.hash}`);
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const root = document.getElementById('farbweltenRoot');
    const h1 = [...document.querySelectorAll('h1')].filter((node) => node.getClientRects().length);
    const main = document.querySelector('main') || document.body;
    return {
      h1: h1.map((node) => node.textContent.trim()),
      textLength: (main.innerText || '').length,
      rootChildren: root ? root.children.length : 0,
      fetchUsed: typeof fetch === 'function' ? 'vorhanden' : 'fehlt',
      moduleScripts: [...document.querySelectorAll('script')].map((node) => node.src || 'inline').slice(0, 6),
      title: document.title,
    };
  });
  rows.push({ ...route, ...info });
}

await browser.close();
const findings = rows.filter((row) => row.h1.length !== 1 || row.textLength < 200 || !row.h1[0]?.includes(row.expect));
const summary = {
  file: base,
  routes: rows.length,
  externalRequests: requests,
  consoleAndPageErrors: errors,
  failures: findings.map((row) => ({ hash: row.hash, h1: row.h1, textLength: row.textLength })),
  rows: rows.map((row) => ({ hash: row.hash, h1: row.h1[0], textLength: row.textLength, rootChildren: row.rootChildren })),
};
fs.writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, rows: undefined }, null, 2));
