// ESOW-RAD-13 — Barrierefreiheit: axe-core, Tastatur, reduzierte Bewegung
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from './server.mjs';

const ROOT = 'C:/Users/mas/Arbeit/esow-qa-rad13';
const OUT = 'C:/Users/mas/AppData/Local/hermes/cache/scratch/rad13-evidence/a11y-probe.json';
const srvHttp = await startServer(0);
const PORT = srvHttp.port;
const BASE = `http://127.0.0.1:${PORT}/Esoterik-Welt`;
const AXE = readFileSync(`${ROOT}/node_modules/axe-core/axe.min.js`, 'utf8');

const srv = { kill: () => srvHttp.close() };
async function waitHealth() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/api/health`)).ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const routes = [
  ['module-landing', '/#pendeln'],
  ['topic-pendeln', '/#pendeln/pendeln'],
  ['quellen', '/#pendeln/quellen'],
  ['glossar', '/#pendeln/glossar'],
  ['methodik', '/#pendeln/methodik'],
  ['labor', '/#pendeln/labor'],
  ['studio', '/#pendeln/studio'],
  ['experiment', '/#pendeln/experiment'],
  ['journal', '/#pendeln/journal'],
  ['doc-index', '/radiasthesie/'],
  ['doc-pendeln', '/radiasthesie/pendeln.html'],
  ['doc-quellen', '/radiasthesie/quellen.html'],
];
const width = Number(process.env.A11Y_WIDTH || 1440);

const result = { axeVersion: null, width, runs: [], findings: [] };
const browser = await chromium.launch({ headless: true });
if (!(await waitHealth())) { console.log('SERVER FEHLT'); srv.kill(); process.exit(1); }
result.axeVersion = await (async () => {
  const p = await browser.newPage();
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(() => window.axe.version);
  await p.close();
  return v;
})();

const ctx = await browser.newContext({ viewport: { width, height: 900 } });
for (const [name, path] of routes) {
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(600);

  // ---- axe ----
  await page.addScriptTag({ content: AXE });
  const axeRes = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      resultTypes: ['violations', 'incomplete'],
    });
    return {
      violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => ({ target: n.target, summary: (n.failureSummary || '').slice(0, 160) })) , count: v.nodes.length })),
      incomplete: r.incomplete.map((v) => ({ id: v.id, count: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target) })),
      passes: r.passes.length,
    };
  });

  // ---- Tastatur ----
  const kb = await page.evaluate(() => {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const visible = (el) => {
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return st.display !== 'none' && st.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const all = [...document.querySelectorAll(sel)].filter(visible);
    window.__focusables = all.map((el, i) => {
      el.setAttribute('data-qa-focus-index', String(i));
      return { i, tag: el.tagName.toLowerCase(), id: el.id || null, text: (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40) };
    });
    return { count: all.length };
  });
  const reached = [];
  let outlineMissing = [];
  for (let i = 0; i < Math.min(kb.count + 8, 160); i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const st = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const hasOutline = (st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0) || st.boxShadow !== 'none';
      return {
        idx: el.getAttribute('data-qa-focus-index'),
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40),
        visible: st.visibility !== 'hidden' && rect.width > 0,
        hasOutline,
      };
    });
    if (!f) continue;
    reached.push(f);
    if (!f.hasOutline) outlineMissing.push(f);
    if (reached.length >= kb.count) break;
  }
  const distinct = [...new Set(reached.map((r) => r.idx).filter(Boolean))];

  // ---- Skip-Link real ausloesen (Tastatur) ----
  let skipResult = null;
  try {
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName.toLowerCase(), cls: String(el.className), href: el.getAttribute('href'), text: (el.textContent || '').trim().slice(0, 50) } : null;
    });
    const urlBefore = page.url();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    let state = null;
    for (let i = 0; i < 3; i++) {
      try {
        state = await page.evaluate(() => ({
          active: document.activeElement?.id || document.activeElement?.tagName || null,
          activeText: (document.activeElement?.textContent || '').trim().slice(0, 60),
          hash: location.hash,
          h1: [...document.querySelectorAll('h1')]
            .filter((h) => h.getBoundingClientRect().width > 0)
            .map((h) => h.textContent.trim().slice(0, 60)),
        }));
        break;
      } catch {
        await page.waitForTimeout(500);
      }
    }
    skipResult = { firstFocus, urlBefore, urlAfter: page.url(), navigated: page.url() !== urlBefore, state };
    if (!state) throw new Error('kein Zustand lesbar');
  } catch (e) {
    skipResult = { error: String(e).slice(0, 200) };
  }
  const afterSkip = skipResult?.state || {};
  const firstFocus = skipResult?.firstFocus || null;

  // ---- reduzierte Bewegung ----
  const reduceCtx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const rp = await reduceCtx.newPage();
  await rp.goto(BASE + path, { waitUntil: 'load' });
  await rp.waitForTimeout(700);
  const motion = await rp.evaluate(() => {
    const max = { transition: 0, animation: 0 };
    let worst = null;
    for (const el of document.querySelectorAll('*')) {
      const st = getComputedStyle(el);
      const t = (st.transitionDuration || '0s').split(',').map((x) => parseFloat(x) * (x.includes('ms') ? 0.001 : 1));
      const a = (st.animationDuration || '0s').split(',').map((x) => parseFloat(x) * (x.includes('ms') ? 0.001 : 1));
      const tm = Math.max(0, ...t.filter((n) => !Number.isNaN(n)));
      const am = Math.max(0, ...a.filter((n) => !Number.isNaN(n)));
      if (tm > max.transition) max.transition = tm;
      if (am > max.animation) { max.animation = am; worst = el.tagName + '.' + (el.className || '').toString().slice(0, 40); }
    }
    return { ...max, worst, mediaReduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
  });
  await reduceCtx.close();

  const rec = { route: name, path, axe: axeRes, focusables: kb.count, reached: distinct.length, outlineMissing: outlineMissing.slice(0, 6), firstFocus, afterSkip, motion };
  result.runs.push(rec);
  if (axeRes.violations.length)
    for (const v of axeRes.violations) result.findings.push({ severity: v.impact === 'critical' || v.impact === 'serious' ? 'fail' : 'warn', id: 'AXE:' + v.id, route: name, detail: { impact: v.impact, count: v.count, nodes: v.nodes } });
  if (distinct.length < kb.count) result.findings.push({ severity: 'warn', id: 'KB-UNREACHED', route: name, detail: { focusables: kb.count, reached: distinct.length } });
  if (outlineMissing.length) result.findings.push({ severity: 'fail', id: 'FOCUS-VISIBLE', route: name, detail: outlineMissing.slice(0, 5) });
  if (motion.transition > 0.05 || motion.animation > 0.05) result.findings.push({ severity: 'fail', id: 'REDUCED-MOTION', route: name, detail: motion });
  await page.close();
}
await ctx.close();
await browser.close();
srv.kill();
writeFileSync(OUT, JSON.stringify(result, null, 1));

console.log('axe', result.axeVersion, 'Breite', width);
for (const r of result.runs) {
  console.log(
    `${r.route}: axeViol=${r.axe.violations.length} incomplete=${r.axe.incomplete.length} passes=${r.axe.passes} focusables=${r.focusables} erreicht=${r.reached} ohneRing=${r.outlineMissing.length} skip->${r.afterSkip.active} motionT=${r.motion.transition} motionA=${r.motion.animation}`
  );
  for (const v of r.axe.violations) console.log('   VIOL', v.id, v.impact, v.count, JSON.stringify(v.nodes[0]?.target || ''));
  for (const v of r.axe.incomplete.filter((x) => x.id === 'color-contrast')) console.log('   INCOMPLETE color-contrast', v.count, JSON.stringify(v.targets));
}
console.log('FAILS', result.findings.filter((f) => f.severity === 'fail').length, 'WARN', result.findings.filter((f) => f.severity === 'warn').length);
