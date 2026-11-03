// Abnahme t_1cf8b61c — Prüfpunkt 5: Responsive, Touch-Ziele, Mobilmenü.
// Aufruf: node probe-responsive.mjs <root> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/responsive.json';
const { server, base } = await startServer(rootDir, 3293);

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
const WIDTHS = [320, 390, 768, 1024, 1440];

const browser = await chromium.launch();
const findings = [];
const record = (id, severity, message, repro) => findings.push({ id, severity, message, repro });
const rows = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    hasTouch: width < 1024,
    isMobile: false,
  });
  const page = await context.newPage();
  for (const hash of ROUTES) {
    await page.goto(`${base}/${hash}`);
    await page.waitForTimeout(240);
    const info = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowElements = [...document.querySelectorAll('#farbweltenRoot *')]
        .filter((node) => {
          if (!node.getClientRects().length) return false;
          const rect = node.getBoundingClientRect();
          return rect.right > doc.clientWidth + 1 || rect.left < -1;
        })
        .slice(0, 6)
        .map((node) => ({
          tag: node.tagName,
          cls: typeof node.className === 'string' ? node.className.slice(0, 40) : '',
          right: Math.round(node.getBoundingClientRect().right),
          left: Math.round(node.getBoundingClientRect().left),
        }));
      const controls = [...document.querySelectorAll('#farbweltenRoot a, #farbweltenRoot button, #farbweltenRoot input, #farbweltenRoot summary, #farbweltenRoot select')]
        .filter((node) => node.getClientRects().length && !node.disabled)
        .map((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            tag: node.tagName,
            type: node.type || '',
            text: (node.textContent || node.getAttribute('aria-label') || '').trim().slice(0, 30),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            display: style.display,
            inline: style.display === 'inline' && ['P', 'LI', 'SPAN', 'TD', 'DD', 'EM', 'CITE'].includes(node.parentElement?.tagName || ''),
          };
        });
      // WCAG 2.5.8: Inline-Ziele im Fließtext sind ausgenommen (Größe durch
      // Zeilenhöhe bestimmt). Bewertet werden Bedienelemente und eigenständige
      // Links.
      const smallTargets = controls.filter((control) => !control.inline && (control.h < 32 || control.w < 32));
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        overflow: doc.scrollWidth - doc.clientWidth,
        overflowElements,
        smallTargets: smallTargets.slice(0, 8),
        inlineExempt: controls.filter((control) => control.inline).length,
        controlCount: controls.length,
        smallestControls: controls
          .filter((control) => !control.inline)
          .sort((a, b) => Math.min(a.h, a.w) - Math.min(b.h, b.w))
          .slice(0, 5),
      };
    });
    rows.push({ width, hash, ...info });
    if (info.overflow > 0)
      record('P5-1', 'blocking', `${width}px ${hash}: ${info.overflow}px horizontaler Überlauf`, hash);
    if (info.overflowElements.length)
      record(
        'P5-1b',
        'major',
        `${width}px ${hash}: Elemente über den Rand (${info.overflowElements.map((e) => `${e.tag}.${e.cls}@${e.left}..${e.right}`).join(', ')})`,
        hash
      );
    for (const target of info.smallTargets)
      record(
        'P5-2',
        'major',
        `${width}px ${hash}: Touch-Ziel ${target.tag}${target.type ? `[${target.type}]` : ''} „${target.text}“ ${target.w}×${target.h}`,
        hash
      );
  }
  await context.close();
}

// Mobilmenü: Burger öffnet neun Ziele, unverändert gegenüber der Kernseite.
const mobile = {};
for (const width of [390, 768]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${base}/#farbwelten/kompass`);
  await page.waitForTimeout(300);
  const burger = page.locator('#mobileMenuButton, .mobile-menu-button, [aria-controls="mobileNav"], .nav-toggle').first();
  const exists = (await burger.count()) > 0;
  if (exists) {
    await burger.click();
    await page.waitForTimeout(250);
  }
  mobile[width] = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.nav-link')].filter((node) => node.getClientRects().length);
    const nav = document.querySelector('#mobileNav, .mobile-nav, .nav-menu, nav');
    return {
      visibleLinks: links.map((node) => (node.textContent || '').trim()),
      navLinks: links.length,
      navVisible: nav ? nav.getBoundingClientRect().height > 0 : null,
      expanded: document.querySelector('[aria-expanded]')?.getAttribute('aria-expanded') || null,
    };
  });
  await context.close();
}
for (const [width, info] of Object.entries(mobile)) {
  if (info.navLinks !== 9)
    record('P5-3', 'major', `${width}px: ${info.navLinks} sichtbare Navigationsziele statt 9 (${info.visibleLinks.join(', ')})`, 'Mobilmenü');
}

// Desktop-Navigation: neun Ziele ab 901 px.
const desktop = {};
for (const width of [1024, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/#farbwelten/zeitleiste`);
  await page.waitForTimeout(300);
  desktop[width] = await page.evaluate(() =>
    [...document.querySelectorAll('.nav-link')]
      .filter((node) => node.getClientRects().length)
      .map((node) => (node.textContent || '').trim())
  );
  await context.close();
  if (desktop[width].length !== 9)
    record('P5-4', 'major', `${width}px: ${desktop[width].length} Navigationsziele statt 9`, 'Kopfzeile');
}

await browser.close();
server.close();
const summary = {
  cells: rows.length,
  overflow: rows.filter((row) => row.overflow > 0).length,
  maxOverflow: Math.max(...rows.map((row) => row.overflow)),
  touchTargetViolations: rows.reduce((sum, row) => sum + row.smallTargets.length, 0),
  inlineExempt: rows.reduce((sum, row) => sum + row.inlineExempt, 0),
  smallestControls: rows
    .filter((row) => (row.width === 320 || row.width === 390) && row.smallestControls.length)
    .map((row) => ({ width: row.width, hash: row.hash, smallest: row.smallestControls[0] }))
    .slice(0, 8),
  mobile,
  desktop,
  findings,
  blocking: findings.filter((entry) => entry.severity === 'blocking').length,
};
fs.writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
console.log(JSON.stringify({ ...summary, findings: findings.slice(0, 40) }, null, 2));
