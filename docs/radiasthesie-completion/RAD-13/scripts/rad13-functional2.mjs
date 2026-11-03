// Nachprobe: Statistik-Referenz (korrekte Rückgabeformen), Skip-Link mit sauberem Fokusstart, Journal-Export
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from './server.mjs';
import { binomialExactTwoSided, wilsonInterval, analyseCounts } from '../js/modules/experiment-statistik.js';

const srvHttp = await startServer(0);
const BASE = `http://127.0.0.1:${srvHttp.port}/Esoterik-Welt`;
const out = { stats: [], skip: [], journal: {}, findings: [] };

function binomCoeff(n, k) { let r = 1n; for (let i = 0n; i < BigInt(k); i++) r = (r * (BigInt(n) - i)) / (i + 1n); return r; }
function exactTwoSided(hits, n, k) {
  const pmf = (i) => binomCoeff(n, i) * BigInt(k - 1) ** BigInt(n - i);
  const obs = pmf(hits);
  let acc = 0n;
  for (let i = 0; i <= n; i++) if (pmf(i) <= obs) acc += pmf(i);
  const denom = BigInt(k) ** BigInt(n);
  // exakte Dezimaldivision ueber BigInt-Skalierung, damit keine Float-Division grosser Zahlen noetig ist
  const scaled = (acc * 10n ** 30n) / denom;
  return Number(scaled) / 1e30;
}
function wilsonRef(hits, n, z = 1.959963984540054) {
  const p = hits / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z / d) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { low: Math.max(0, c - h), high: Math.min(1, c + h) };
}
const cases = [[15, 20, 2], [5, 16, 8], [8, 25, 5], [10, 20, 2], [3, 16, 8], [13, 20, 2], [0, 25, 5], [25, 25, 5], [2, 10, 2], [19, 25, 5]];
let maxDelta = 0;
for (const [h, n, k] of cases) {
  const implP = binomialExactTwoSided(h, n, 1 / k);
  const refP = exactTwoSided(h, n, k);
  const implW = wilsonInterval(h, n);
  const refW = wilsonRef(h, n);
  const dP = Math.abs(implP - refP);
  const dW = Math.max(Math.abs(implW.low - refW.low), Math.abs(implW.high - refW.high));
  maxDelta = Math.max(maxDelta, dP, dW);
  out.stats.push({ h, n, k, implP, refP, dP, implW, refW, dW });
}
out.statsMaxDelta = maxDelta;
if (!(maxDelta < 1e-9)) out.findings.push({ id: 'STATISTIK', detail: { maxDelta } });
const a = analyseCounts(15, 20, 2);
out.analyse = a;

// Wilson-Eigenschaften (korrekte Felder)
const bad = [];
for (let n = 10; n <= 200; n += 13) {
  for (let h = 0; h <= n; h += Math.max(1, Math.floor(n / 4))) {
    const iv = wilsonInterval(h, n);
    if (!(iv.low <= h / n + 1e-12 && h / n <= iv.high + 1e-12 && iv.low >= 0 && iv.high <= 1 && iv.low <= iv.high)) bad.push({ h, n, iv });
  }
}
out.wilsonViolations = bad;
if (bad.length) out.findings.push({ id: 'WILSON', detail: bad.slice(0, 3) });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });

for (const path of ['/#pendeln/quellen', '/#pendeln/methodik', '/#pendeln/labor', '/radiasthesie/quellen.html', '/radiasthesie/pendeln.html']) {
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  // Fokusstart sauber zuruecksetzen, damit der erste Tab wirklich am Dokumentanfang beginnt
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const h1Before = await page.evaluate(() => [...document.querySelectorAll('h1')].filter((h) => h.getBoundingClientRect().width > 0).map((h) => h.textContent.trim().slice(0, 40)));
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => ({ tag: document.activeElement?.tagName, cls: String(document.activeElement?.className), href: document.activeElement?.getAttribute('href'), text: (document.activeElement?.textContent || '').trim().slice(0, 40) }));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const afterEnter = await page.evaluate(() => ({ hash: location.hash, scrollY: Math.round(window.scrollY), focus: document.activeElement?.tagName }));
  // naechster Tab muss im Hauptinhalt landen
  await page.keyboard.press('Tab');
  const nextTab = await page.evaluate(() => {
    const el = document.activeElement;
    const main = document.querySelector('main');
    return {
      tag: el?.tagName,
      id: el?.id || null,
      text: (el?.textContent || '').trim().slice(0, 40),
      inMain: main ? main.contains(el) : null,
      visible: el ? el.getBoundingClientRect().width > 0 : false,
    };
  });
  const h1After = await page.evaluate(() => [...document.querySelectorAll('h1')].filter((h) => h.getBoundingClientRect().width > 0).map((h) => h.textContent.trim().slice(0, 40)));
  const urlAfter = page.url();
  const rec = { path, focused, afterEnter, nextTab, h1Before, h1After, urlAfter, ok: nextTab.inMain === true && h1After.join() === h1Before.join() };
  out.skip.push(rec);
  if (!rec.ok) out.findings.push({ id: 'SKIP-LINK', detail: rec });
  await page.close();
}

// Journal-Export inhaltlich pruefen (Text bleibt Text, kein HTML)
try {
  const page = await ctx.newPage();
  await page.goto(BASE + '/#pendeln/journal', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const hostile = '<img src=x onerror="window.__xss=1">';
  await page.fill('#jrQuestion', `Test ${hostile}`);
  await page.locator('#pendelnRoot button', { hasText: /Speichern|Eintrag speichern|Hinzufügen/ }).first().click();
  await page.waitForTimeout(500);
  const dlP = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await page.locator('#pendelnRoot button', { hasText: /Export|JSON/ }).first().click();
  const dl = await dlP;
  if (dl) {
    const json = JSON.parse(readFileSync(await dl.path(), 'utf8'));
    const text = JSON.stringify(json);
    out.journal = { keys: Object.keys(json), hasQuestion: text.includes('Test <img src=x'), xss: await page.evaluate(() => window.__xss ?? null), renderedHasImg: await page.evaluate(() => !!document.querySelector('#pendelnRoot img[src="x"]')) };
    if (!out.journal.hasQuestion || out.journal.xss !== null || out.journal.renderedHasImg) out.findings.push({ id: 'JOURNAL-EXPORT', detail: out.journal });
  } else out.findings.push({ id: 'JOURNAL-EXPORT', detail: 'kein Download' });
  await page.close();
} catch (e) {
  out.findings.push({ id: 'JOURNAL-FLOW', detail: String(e).slice(0, 300) });
}

await ctx.close();
await browser.close();
await srvHttp.close();
writeFileSync('C:/Users/mas/AppData/Local/hermes/cache/scratch/rad13-evidence/functional-probe2.json', JSON.stringify(out, null, 1));
console.log('Statistik maxDelta', maxDelta, 'Faelle', out.stats.length, 'Wilson-Verletzungen', bad.length);
console.log(JSON.stringify(out.stats.slice(0, 3)));
for (const s of out.skip) console.log('SKIP', s.path, s.focused.tag, s.focused.cls, '->', JSON.stringify(s.afterEnter), '=>', JSON.stringify(s.nextTab), 'ok=', s.ok);
console.log('Journal', JSON.stringify(out.journal));
console.log('FAILS', out.findings.length, JSON.stringify(out.findings).slice(0, 500));
