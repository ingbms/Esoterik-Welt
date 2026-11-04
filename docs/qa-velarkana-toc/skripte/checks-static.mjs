/**
 * Statische Strukturprüfung des Builds (unabhängig von den Skripten des
 * Implementierers): Inventar aller HTML-Dateien, TOC-Markup, Überschriften,
 * doppelte IDs, bestehende TOCs.
 *
 * Ausgabe: evidence/qa-toc-436eeffb/static-inventory.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { DIST, ROOT, ensureDir, EVID, launchChromium, writeJson } from './lib.mjs';

const PILOT = 'frequenzen/quellen.html';
const label = process.argv[2] || 'pilot';

function listHtml(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listHtml(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith('.html')) out.push(rel);
  }
  return out.sort();
}

const files = listHtml(DIST);
const payload = files.map((rel) => ({ rel, html: fs.readFileSync(path.join(DIST, rel), 'utf8') }));

const browser = await launchChromium();
const page = await browser.newPage();
await page.setContent('<!doctype html><title>parser</title>');

const results = [];
const BATCH = 12;
for (let i = 0; i < payload.length; i += BATCH) {
  const batch = payload.slice(i, i + BATCH);
  const parsed = await page.evaluate((items) => {
    const out = [];
    for (const item of items) {
      const doc = new DOMParser().parseFromString(item.html, 'text/html');
      const tocAside = doc.querySelectorAll('aside.page-toc');
      const tocNav = doc.querySelectorAll('nav[aria-label="Inhaltsverzeichnis"]');
      const ids = [...doc.querySelectorAll('[id]')].map((el) => el.id);
      const counts = new Map();
      for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1);
      const dupIds = [...counts.entries()].filter(([, n]) => n > 1).map(([id, n]) => ({ id, n }));
      const scope = doc.querySelector('[data-toc-scope]') || doc.querySelector('main article') || doc.querySelector('article');
      const headings = scope
        ? [...scope.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => ({
            tag: h.tagName.toLowerCase(),
            id: h.id || null,
            text: (h.textContent || '').replace(/\s+/g, ' ').trim(),
            className: h.className || '',
          }))
        : [];
      // Bestehende Inhaltsverzeichnisse (Radiästhesie) unabhängig vom neuen Markup zählen
      const radiasthesieToc = doc.querySelectorAll('.astro-aside a, aside:not(.page-toc) a').length;
      const tocLinks = [...tocAside].map((aside) => aside.querySelectorAll('a').length);
      const firstTocEntry = tocAside[0]?.querySelector('a')?.textContent?.replace(/\s+/g, ' ').trim() || null;
      out.push({
        rel: item.rel,
        tocAside: tocAside.length,
        tocNav: tocNav.length,
        tocLinks,
        firstTocEntry,
        dupIds,
        headingCount: headings.length,
        h2: headings.filter((h) => h.tag === 'h2').length,
        h3: headings.filter((h) => h.tag === 'h3').length,
        h4plus: headings.filter((h) => ['h4', 'h5', 'h6'].includes(h.tag)).length,
        headingsWithoutId: headings.filter((h) => !h.id).length,
        headings,
        radiasthesieAsideLinks: radiasthesieToc,
        hasDetailsToc: doc.querySelectorAll('details.page-toc__details').length,
        tocSummaryText: tocAside[0]?.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim() || null,
        tocBodyOverflow: tocAside[0]?.getAttribute('data-toc-body') ?? null,
      });
    }
    return out;
  }, batch);
  results.push(...parsed);
}

await browser.close();

// --- Soll-Liste aus der Spezifikation (§14.1) maschinell lesen -------------
const specPath = path.join(ROOT, 'docs/velarkana-toc/spezifikation.md');
const expected = [];
if (fs.existsSync(specPath)) {
  const spec = fs.readFileSync(specPath, 'utf8');
  const section = spec.split('### 14.1')[1].split('### 14.2')[0];
  for (const line of section.split('\n')) {
    const m = /^\|\s*(\d{2})\s*\|\s*(h[2-6])\s*\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
    if (m) expected.push({ index: Number(m[1]), tag: m[2], id: m[3], text: m[4].trim() });
  }
}

const pilot = results.find((r) => r.rel === PILOT);
const report = {
  generatedAt: new Date().toISOString(),
  dist: DIST,
  htmlFiles: results.length,
  pages: results.length,
  withToc: results.filter((r) => r.tocAside > 0).map((r) => r.rel),
  expectedFromSpec: expected.length,
  pilot: {
    rel: PILOT,
    tocAside: pilot.tocAside,
    tocNav: pilot.tocNav,
    tocLinks: pilot.tocLinks,
    headingCount: pilot.headingCount,
    h2: pilot.h2,
    h3: pilot.h3,
    h4plus: pilot.h4plus,
    headingsWithoutId: pilot.headingsWithoutId,
    dupIds: pilot.dupIds,
    headings: pilot.headings,
    expected,
  },
  // Seiten ohne bzw. mit sehr wenigen Überschriften (Leerzustand / kurze Seite)
  fewHeadings: results
    .filter((r) => r.headingCount < 3)
    .map((r) => ({ rel: r.rel, headingCount: r.headingCount, tocAside: r.tocAside })),
  emptyHeadings: results.filter((r) => r.headingCount === 0).map((r) => r.rel),
  dups: results.filter((r) => r.dupIds.length > 0).map((r) => ({ rel: r.rel, dupIds: r.dupIds })),
  radiasthesie: results
    .filter((r) => r.rel.startsWith('radiasthesie/'))
    .map((r) => ({ rel: r.rel, asideLinks: r.radisthesieAsideLinks ?? r.radiasthesieAsideLinks })),
  farbweltenIndex: results.find((r) => r.rel === 'farbwelten/index.html')
    ? {
        rel: 'farbwelten/index.html',
        headings: results.find((r) => r.rel === 'farbwelten/index.html').headings.length,
        tocAside: results.find((r) => r.rel === 'farbwelten/index.html').tocAside,
        dupIds: results.find((r) => r.rel === 'farbwelten/index.html').dupIds,
        firstHeading: results.find((r) => r.rel === 'farbwelten/index.html').headings[0] || null,
      }
    : null,
  pages_detail: results.map((r) => ({
    rel: r.rel,
    tocAside: r.tocAside,
    tocNav: r.tocNav,
    tocLinks: r.tocLinks,
    headingCount: r.headingCount,
    dupIds: r.dupIds,
    radiasthesieAsideLinks: r.radisthesieAsideLinks,
  })),
};

writeJson(`static-inventory-${label}.json`, report);
ensureDir(EVID);

// Soll/Ist-Vergleich der Pilotliste
const actual = pilot.headings.filter((h) => ['h2', 'h3'].includes(h.tag));
const diffs = [];
const max = Math.max(expected.length, actual.length);
for (let i = 0; i < max; i += 1) {
  const e = expected[i];
  const a = actual[i];
  if (!e || !a || e.id !== a.id || e.text !== a.text || e.tag !== a.tag) {
    diffs.push({ index: i + 1, expected: e || null, actual: a || null });
  }
}

const summary = {
  htmlFiles: results.length,
  pagesWithToc: report.withToc,
  pilotEntries: actual.length,
  expectedEntries: expected.length,
  listDiffs: diffs,
  headingsWithoutId: pilot.headingsWithoutId,
  pilotDupIds: pilot.dupIds,
  emptyHeadingPages: report.emptyHeadings,
  fewHeadingPages: report.fewHeadings.length,
  dupsBuild: report.dups,
  radiasthesie: report.radisthesie,
  farbweltenIndex: report.farbweltenIndex,
  tocMarkupOnOtherPages: results.filter((r) => r.rel !== PILOT && (r.tocAside > 0 || r.tocNav > 0)).map((r) => r.rel),
};
writeJson(`static-summary-${label}.json`, summary);
console.log(JSON.stringify(summary, null, 2));

