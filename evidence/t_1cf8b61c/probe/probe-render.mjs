// Abnahme t_1cf8b61c — Prüfpunkt 1: Routen, H1, Platzhalter, unbekannte Route.
// Aufruf: node probe-render.mjs <verzeichnis> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/render.json';
const { server, base } = await startServer(rootDir, 3298);

const COLOURS = [
  'rot',
  'orange',
  'gelb',
  'gruen',
  'tuerkis',
  'blau',
  'indigo',
  'violett',
  'magenta',
  'rosa',
  'weiss',
  'schwarz',
];
const TOPICS = ['farbtherapie', 'farbpsychologie', 'lichtmedizin'];
const TOOLS = ['kompass', 'farbmeditation', 'zeitleiste'];
// Bestehende Kernseiten der SPA (MAIN_PAGES in js/main.js) plus die
// statischen Rechtsseiten.
const EXISTING = ['#home', '#tarot', '#crystals', '#moon', '#runes', '#astrologie', '#blog', '#pendeln'];

const ROUTES = [
  { id: 'landing', hash: '#farbwelten', kind: 'landing' },
  ...COLOURS.map((id) => ({ id, hash: `#farbwelten/${id}`, kind: 'color' })),
  { id: 'chakren', hash: '#farbwelten/chakren', kind: 'chakren' },
  { id: 'lichtfrequenzen', hash: '#farbwelten/lichtfrequenzen', kind: 'light' },
  ...TOPICS.map((id) => ({ id, hash: `#farbwelten/${id}`, kind: 'topic' })),
  ...TOOLS.map((id) => ({ id, hash: `#farbwelten/${id}`, kind: 'tool' })),
  ...EXISTING.filter((hash) => !hash.startsWith('#farbwelten')).map((hash) => ({ id: hash.slice(1), hash, kind: 'core' })),
  { id: 'unbekannt', hash: '#farbwelten/gibtsnicht', kind: 'notfound' },
  { id: 'unbekannt-kern', hash: '#gibtsnicht', kind: 'notfound' },
];

const PLACEHOLDER = [
  /lorem ipsum/i,
  /TODO/,
  /\bTBD\b/,
  /Platzhalter/i,
  /\{\{[^}]+\}\}/,
  /^\s*\|.*\|\s*$/m,
  /\*\*[^*\n]{2,}\*\*/,
  /\]\([^)\s]+\)/,
  /&amp;(?:nbsp|shy);/,
  /undefined/,
  /\[object Object\]/,
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];
const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push({ url: page.url(), text: m.text() });
});
page.on('pageerror', (e) => pageErrors.push({ url: page.url(), text: String(e) }));

for (const route of ROUTES) {
  await page.goto(`${base}/${route.hash}`);
  await page.waitForTimeout(220);
  const info = await page.evaluate(() => {
    const root = document.getElementById('farbweltenRoot');
    const main = document.querySelector('main') || document.body;
    const visible = (node) => {
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
    };
    const h1s = [...document.querySelectorAll('h1')].filter(visible);
    const text = (main.innerText || '').replace(/\s+/g, ' ').trim();
    return {
      title: document.title,
      h1Count: h1s.length,
      h1Text: h1s.map((node) => node.textContent.trim()),
      rootExists: Boolean(root),
      rootChildCount: root ? root.children.length : 0,
      text,
      activeHash: location.hash,
      mainTextLength: text.length,
      hasMarkdownTable: /\|\s*-{2,}/.test(text),
    };
  });
  const problems = [];
  if (info.h1Count !== 1) problems.push(`H1: ${info.h1Count} (${info.h1Text.join(' / ')})`);
  if (info.mainTextLength < 120) problems.push(`Text zu kurz: ${info.mainTextLength}`);
  for (const pattern of PLACEHOLDER) {
    const found = pattern.exec(info.text);
    if (found) problems.push(`Platzhalter ${pattern}: „${found[0].slice(0, 60)}“`);
  }
  if (info.hasMarkdownTable) problems.push('Markdown-Tabellenrest');
  if (route.kind === 'notfound' && !/gibt es nicht|nicht vorhanden|nicht gefunden|gehört zu keiner Seite/i.test(info.text))
    problems.push('Unbekannte Route ohne saubere Meldung');
  if (route.kind !== 'notfound' && info.activeHash !== route.hash) problems.push(`Hash: ${info.activeHash}`);
  results.push({ ...route, ...info, text: info.text.slice(0, 400), problems });
}

await browser.close();
server.close();
const summary = {
  base,
  routes: results.length,
  failed: results.filter((r) => r.problems.length).map((r) => ({ id: r.id, hash: r.hash, problems: r.problems })),
  consoleErrors,
  pageErrors,
};
fs.writeFileSync(out, JSON.stringify({ summary, results }, null, 2));
console.log(
  JSON.stringify(
    {
      routes: results.length,
      failures: summary.failed,
      consoleErrors: consoleErrors.length,
      pageErrors: pageErrors.length,
      h1PerRoute: results.map((r) => `${r.id}:${r.h1Count}`).join(' '),
    },
    null,
    2
  )
);
