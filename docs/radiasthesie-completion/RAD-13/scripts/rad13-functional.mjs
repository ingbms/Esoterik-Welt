// Funktions- und Sicherheitsprobe: Skip-Link, Journal-XSS/Export/Loeschung, Studio-Import, Statistik
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from './server.mjs';
import {
  binomialExactTwoSided,
  wilsonInterval,
  analyseCounts,
} from '../js/modules/experiment-statistik.js';

const OUT = 'C:/Users/mas/AppData/Local/hermes/cache/scratch/rad13-evidence/functional-probe.json';
const srvHttp = await startServer(0);
const BASE = `http://127.0.0.1:${srvHttp.port}/Esoterik-Welt`;
const out = { checks: [], findings: [] };
const add = (id, ok, detail) => {
  out.checks.push({ id, ok, detail });
  if (!ok) out.findings.push({ id, detail });
};

// ---------- unabhaengige Statistik-Referenz (exakte Bruchrechnung) ----------
function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
function binomCoeff(n, k) { let r = 1n; for (let i = 0n; i < BigInt(k); i++) r = (r * (BigInt(n) - i)) / (i + 1n); return r; }
function exactTwoSided(hits, n, k) {
  // gemeinsamer Nenner k^n
  const denom = BigInt(k) ** BigInt(n);
  const pmf = (i) => binomCoeff(n, i) * BigInt(k - 1) ** BigInt(n - i);
  const obs = pmf(hits);
  let acc = 0n;
  for (let i = 0; i <= n; i++) if (pmf(i) <= obs) acc += pmf(i);
  return Number(acc) / Number(denom);
}
function wilson(hits, n, z = 1.959963984540054) {
  const p = hits / n;
  const d = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / d;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [centre - half, centre + half];
}
const refCases = [
  [15, 20, 2],
  [5, 16, 8],
  [8, 25, 5],
  [10, 20, 2],
  [3, 16, 8],
  [13, 20, 2],
  [0, 25, 5],
  [25, 25, 5],
];
const statsCompare = [];
for (const [h, n, k] of refCases) {
  const impl = binomialExactTwoSided(h, n, 1 / k);
  const ref = exactTwoSided(h, n, k);
  const implW = wilsonInterval(h, n);
  const refW = wilson(h, n);
  const dP = Math.abs(impl - ref);
  const dW = Math.max(Math.abs(implW[0] - refW[0]), Math.abs(implW[1] - refW[1]));
  statsCompare.push({ h, n, k, impl, ref, delta: dP, wilsonImpl: implW, wilsonRef: refW, wilsonDelta: dW });
}
const maxDelta = Math.max(...statsCompare.map((s) => Math.max(s.delta, s.wilsonDelta)));
add('STATISTIK-REFERENZ', maxDelta < 1e-12, { maxDelta, cases: statsCompare.length });

// Konfidenzintervall-Eigenschaften
const props = [];
for (let n = 10; n <= 200; n += 7) {
  for (let h = 0; h <= n; h += Math.max(1, Math.floor(n / 5))) {
    const iv = wilsonInterval(h, n);
    if (!(iv[0] <= h / n + 1e-12 && h / n - 1e-12 <= iv[1] && iv[0] >= -1e-12 && iv[1] <= 1 + 1e-12 && iv[0] <= iv[1])) props.push({ h, n, iv });
  }
}
add('STATISTIK-INTERVALL-EIGENSCHAFTEN', props.length === 0, { verletzungen: props.slice(0, 5) });

// Analyse eines synthetischen Laufs (konsistente Ableitung)
const synth = analyseCounts(15, 20, 2);
add('STATISTIK-ANALYSE-KONSISTENZ', (() => {
  const p = binomialExactTwoSided(15, 20, 0.5);
  return synth && Math.abs((synth.pValue ?? synth.p ?? NaN) - p) < 1e-9;
})(), { analyse: synth });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });

// ---------- Skip-Link auf SPA-Routen ----------
for (const path of ['/#pendeln/quellen', '/#pendeln/labor', '/#pendeln/journal', '/radiasthesie/quellen.html']) {
  const page = await ctx.newPage();
  const before = [];
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const h1Before = await page.evaluate(() => [...document.querySelectorAll('h1')].filter((h) => h.getBoundingClientRect().width > 0).map((h) => h.textContent.trim().slice(0, 50)));
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => ({ tag: document.activeElement?.tagName, cls: String(document.activeElement?.className), href: document.activeElement?.getAttribute('href') }));
  const urlBefore = page.url();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    hash: location.hash,
    active: document.activeElement?.id || document.activeElement?.tagName,
    h1: [...document.querySelectorAll('h1')].filter((h) => h.getBoundingClientRect().width > 0).map((h) => h.textContent.trim().slice(0, 50)),
    scrollY: Math.round(window.scrollY),
  })).catch(() => ({ error: 'kontext verloren' }));
  await page.screenshot({ path: `C:/Users/mas/AppData/Local/hermes/cache/scratch/rad13-evidence/skip-${path.replace(/[^a-z0-9]+/gi, '_')}.png` });
  after.url = page.url();
  const ok = after.active === 'main' || after.active === 'MAIN' || (after.h1.join() === h1Before.join() && after.hash !== '#main' && !after.url.endsWith('#main'));
  add('SKIP-LINK:' + path, ok, { focused, urlBefore, after, h1Before });
  await page.close();
}

// ---------- Journal: XSS, Export, vollstaendige Loeschung ----------
{
  const page = await ctx.newPage();
  await page.goto(BASE + '/#pendeln/journal', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const fields = await page.evaluate(() => [...document.querySelectorAll('#pendelnRoot input, #pendelnRoot textarea, #pendelnRoot select, #pendelnRoot button')].map((el) => ({ id: el.id, tag: el.tagName, type: el.type, label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40) })));
  const hostile = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  let filled = { fields };
  try {
    await page.fill('#jrQuestion', `Test ${hostile}`);
    await page.fill('#jrPrediction', 'Vorhersage <b>fett</b>');
    const saveBtn = page.locator('#pendelnRoot button', { hasText: /Speichern|Eintrag speichern|Hinzufügen/ }).first();
    await saveBtn.click();
    await page.waitForTimeout(600);
    const state = await page.evaluate(() => ({
      xss: window.__xss ?? null,
      htmlHasImg: !!document.querySelector('#pendelnRoot img[src="x"]'),
      textVisible: (document.querySelector('#pendelnRoot')?.innerText || '').includes('onerror='),
      stored: Object.keys(localStorage).filter((k) => k.includes('journal') || k.includes('esot_rad')),
      storageSize: JSON.stringify(localStorage).length,
    }));
    add('JOURNAL-XSS', state.xss === null && !state.htmlHasImg && state.textVisible, state);
    filled = { ...filled, state };

    // Export JSON
    const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    const exportBtn = page.locator('#pendelnRoot button', { hasText: /Export|JSON/ }).first();
    await exportBtn.click();
    const download = await dl;
    if (download) {
      const p = await download.path();
      const content = readFileSync(p, 'utf8');
      const parsed = JSON.parse(content);
      const raw = JSON.stringify(parsed);
      filled.exportName = download.suggestedFilename();
      filled.exportHasHostileEscaped = raw.includes('onerror=') && !raw.includes('<img src=x');
      filled.exportKeys = Object.keys(parsed);
      add('JOURNAL-EXPORT', filled.exportHasHostileEscaped, { name: download.suggestedFilename(), bytes: content.length, keys: Object.keys(parsed) });
    } else {
      add('JOURNAL-EXPORT', false, { error: 'kein Download ausgeloest' });
    }

    // vollstaendige Loeschung
    const before = await page.evaluate(() => JSON.stringify(localStorage).length);
    page.once('dialog', (d) => d.accept());
    const delBtn = page.locator('#pendelnRoot button', { hasText: /löschen|Löschen|Alles/ }).last();
    await delBtn.click();
    await page.waitForTimeout(700);
    page.once('dialog', (d) => d.accept());
    const confirm = page.locator('#pendelnRoot button', { hasText: /Ja|Endgültig|Bestätigen|löschen/i }).last();
    if (await confirm.count()) { await confirm.click().catch(() => {}); await page.waitForTimeout(500); }
    const afterDel = await page.evaluate(() => ({
      keys: Object.keys(localStorage).filter((k) => k.includes('journal') || k.includes('esot_rad')),
      size: JSON.stringify(localStorage).length,
      entriesVisible: (document.querySelector('#pendelnRoot')?.innerText || '').includes('Test <img'),
    }));
    add('JOURNAL-LOESCHUNG', afterDel.keys.filter((k) => k.includes('journal')).length === 0 && !afterDel.entriesVisible, { before, afterDel });
    await page.close().catch(() => {});
  } catch (e) {
    add('JOURNAL-FLOW', false, { error: String(e).slice(0, 200), fields });
    await page.close().catch(() => {});
  }
}

// ---------- Studio: Import-Validierung + SVG-Export ----------
{
  const page = await ctx.newPage();
  await page.goto(BASE + '/#pendeln/studio', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const ids = await page.evaluate(() => [...document.querySelectorAll('#pendelnRoot input, #pendelnRoot textarea, #pendelnRoot button, #pendelnRoot select')].map((el) => ({ id: el.id, tag: el.tagName, type: el.type })));
  const results = { ids };
  const tryImport = async (payload, label) => {
    const input = page.locator('#pendelnRoot input[type=file]').first();
    if (!(await input.count())) return { label, error: 'kein Datei-Input' };
    await input.setInputFiles({ name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(payload) });
    await page.waitForTimeout(500);
    return page.evaluate((l) => ({
      label: l,
      invalid: [...document.querySelectorAll('#pendelnRoot [aria-invalid="true"]')].map((e) => e.id),
      alerts: [...document.querySelectorAll('#pendelnRoot [role=alert], #pendelnRoot .rad-error, #pendelnRoot .form-error')].map((e) => e.textContent.trim().slice(0, 120)),
      title: document.querySelector('#ptfTitle')?.value ?? null,
      segments: document.querySelectorAll('#pendelnRoot [data-segment]').length,
    }), label);
  };
  results.invalidJson = await tryImport('{ kaputt', 'ungueltig');
  results.oversized = await tryImport('{"title":"' + 'A'.repeat(40 * 1024) + '"}', 'zu gross');
  results.hostile = await tryImport(JSON.stringify({ title: '<img src=x onerror="window.__xss=3">', segments: ['a', '<script>x</script>', 'c'] }), 'hostil');
  results.xss = await page.evaluate(() => window.__xss ?? null);
  results.svgInDom = await page.evaluate(() => {
    const svg = document.querySelector('#ptfPreview svg');
    return svg ? { text: svg.textContent.replace(/\s+/g, ' ').slice(0, 200), hasScript: !!svg.querySelector('script'), hasImg: !!svg.querySelector('img') } : null;
  });
  add('STUDIO-IMPORT-INVALID', (results.invalidJson.alerts?.length || results.invalidJson.invalid?.length) > 0, results.invalidJson);
  add('STUDIO-IMPORT-GRENZE', (results.oversized.alerts?.length || results.oversized.invalid?.length) > 0, results.oversized);
  add('STUDIO-IMPORT-ESCAPE', results.xss === null && results.svgInDom && !results.svgInDom.hasScript, { xss: results.xss, svg: results.svgInDom, hostile: results.hostile });

  // SVG-Export
  const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  const exportBtn = page.locator('#pendelnRoot button', { hasText: /SVG/ }).first();
  if (await exportBtn.count()) {
    await exportBtn.click();
    const d = await dl;
    if (d) {
      const svg = readFileSync(await d.path(), 'utf8');
      results.svgFile = { name: d.suggestedFilename(), bytes: svg.length, hasScript: /<script/i.test(svg), hasOnAttr: /\son\w+=/i.test(svg), wellFormed: svg.trim().startsWith('<svg') };
      add('STUDIO-SVG-EXPORT', results.svgFile.wellFormed && !results.svgFile.hasScript && !results.svgFile.hasOnAttr, results.svgFile);
    } else add('STUDIO-SVG-EXPORT', false, { error: 'kein Download' });
  } else add('STUDIO-SVG-EXPORT', false, { error: 'kein SVG-Button' });
  out.studio = results;
  await page.close().catch(() => {});
}

await ctx.close();
await browser.close();
await srvHttp.close();
writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const c of out.checks) console.log(c.ok ? 'PASS' : 'FAIL', c.id, JSON.stringify(c.detail).slice(0, 400));
console.log('FAILS', out.findings.length);
