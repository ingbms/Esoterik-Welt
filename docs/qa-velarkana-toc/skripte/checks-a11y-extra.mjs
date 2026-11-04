/**
 * Ergänzende A11y-/Layoutprüfungen: Fokusring-Kontrast, axe bei 390 px
 * (zu/offen), 1024 px Aufklapper, Überlappung bei 1199 px offen,
 * AX-Exposition von aria-current.
 *
 * Ausgabe: evidence/qa-toc-436eeffb/a11y-extra.json
 */
import fs from 'node:fs';
import { DIST, EVID, CONTRAST_FN, axTree, launchChromium, startServer, writeJson } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const results = [];
const check = (id, name, ok, detail) => results.push({ id, name, ok: ok === true, detail });

const server = await startServer(DIST);
const browser = await launchChromium();
const axeSource = fs.readFileSync(new URL('../../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

/* Desktop: Fokusring-Kontrast -------------------------------------------- */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.waitForTimeout(600);
await page.addScriptTag({ content: CONTRAST_FN });
const ring = await page.evaluate(() => {
  const link = document.querySelectorAll('.page-toc__link')[4];
  link.focus();
  const cs = getComputedStyle(link);
  const bgInfo = window.__qaContrast(link);
  // Ringfarbe als Farbe auf einem Hilfselement parsen
  const probe = document.createElement('span');
  probe.style.color = cs.outlineColor;
  document.body.appendChild(probe);
  const ringColor = getComputedStyle(probe).color;
  probe.remove();
  // Kontrast Ringfarbe vs. Seitenhintergrund
  const probe2 = document.createElement('span');
  probe2.style.color = ringColor;
  probe2.style.backgroundColor = bgInfo.bg;
  document.body.appendChild(probe2);
  const ratio = window.__qaContrast(probe2).ratio;
  probe2.remove();
  return {
    outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
    outlineOffset: cs.outlineOffset,
    background: bgInfo.bg,
    textColor: cs.color,
    ringContrast: ratio,
    focusVisible: link.matches(':focus-visible'),
  };
});
check('AK-F3b2', 'Fokusring 2 px mit Kontrast ≥ 3:1', parseFloat(ring.outline.split(' ')[0]) >= 2 && ring.ringContrast >= 3, ring);

/* AX-Exposition von aria-current prüfen ---------------------------------- */
const nodes = await axTree(page);
const active = nodes.filter((n) => n.role?.value === 'link' && (n.properties || []).some((p) => String(p.name).toLowerCase().includes('current')));
const allPropNames = [...new Set(nodes.filter((n) => n.role?.value === 'link').flatMap((n) => (n.properties || []).map((p) => p.name)))];
const ariaCurrentInDom = await page.evaluate(() => document.querySelectorAll('.page-toc__link[aria-current="location"]').length);
check('AK-D1c', 'aria-current im DOM gesetzt; AX-Exposition in Chromium-CDP nicht auslesbar', ariaCurrentInDom === 1, {
  ariaCurrentInDom,
  axPropertiesOnLinks: allPropNames,
  axNodesWithCurrent: active.length,
  note: 'CDP Accessibility.getFullAXTree führt für Links nur focusable/url; aria-current ist nicht als AX-Property sichtbar. Die Exposition ist damit nicht widerlegt, aber auch nicht belegt.',
});

/* 1024 px: Aufklapper ---------------------------------------------------- */
await page.setViewportSize({ width: 1024, height: 800 });
await page.waitForTimeout(400);
const at1024 = await page.evaluate(async () => {
  const details = document.querySelector('[data-toc-details]');
  const summary = document.querySelector('.page-toc__summary');
  const before = details.open;
  const header = document.querySelector('header').getBoundingClientRect();
  summary.click();
  await new Promise((r) => setTimeout(r, 300));
  const open = details.open;
  const aside = document.querySelector('aside.page-toc').getBoundingClientRect();
  const prose = document.querySelector('.page-body--toc > .prose').getBoundingClientRect();
  return {
    before,
    open,
    summaryHeight: Math.round(summary.getBoundingClientRect().height),
    asideTop: Math.round(aside.top),
    asideBottom: Math.round(aside.bottom),
    proseTop: Math.round(prose.top),
    headerBottom: Math.round(header.bottom),
    overlapsHeader: aside.top < header.bottom - 1,
    overlapsProse: aside.bottom > prose.top + 1,
    overflowX: document.documentElement.scrollWidth > innerWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    innerWidth,
  };
});
check('AK-E6b', '1024 px: Panel klappt auf, keine Überlappung mit Header/Artikel, kein Überlauf', at1024.before === false && at1024.open === true && !at1024.overlapsHeader && !at1024.overlapsProse && !at1024.overflowX, at1024);
check('AK-E4c', '1024 px: Summary ≥ 44 px', at1024.summaryHeight >= 44, at1024);
await page.screenshot({ path: `${EVID}/1024-offen.png` });
await ctx.close();

/* Mobil: axe bei 390 px, zu und offen ------------------------------------ */
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const mp = await mctx.newPage();
await mp.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await mp.waitForTimeout(500);
await mp.addScriptTag({ content: axeSource });
const axeClosed = await mp.evaluate(async () => {
  const r = await window.axe.run(document.querySelector('.page-toc'), { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] });
  return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) })), incomplete: r.incomplete.map((v) => v.id) };
});
await mp.click('.page-toc__summary');
await mp.waitForTimeout(300);
const axeOpen = await mp.evaluate(async () => {
  const r = await window.axe.run(document.querySelector('.page-toc'), { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] });
  return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) })), incomplete: r.incomplete.map((v) => v.id) };
});
check('AXE-TOC-M', 'axe-core 390 px (zu und offen) ohne Verstöße im TOC', axeClosed.violations.length === 0 && axeOpen.violations.length === 0, { axeClosed, axeOpen });
await mp.screenshot({ path: `${EVID}/390-offen.png` });
await mctx.close();

const failed = results.filter((r) => !r.ok);
writeJson('a11y-extra.json', { generatedAt: new Date().toISOString(), results, ring, at1024, axeClosed, axeOpen });
console.log(`extra checks: ${results.length}, failed: ${failed.length}`);
for (const f of failed) console.log('FAIL', f.id, JSON.stringify(f.detail).slice(0, 600));
await browser.close();
await server.close();
