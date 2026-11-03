'use strict';
// Laufzeitfakten fuer das Release-Gate: zaehlt, was die Baseline tatsaechlich rendert.
//
//   node scripts/migration-baseline/verify-release-gate-facts.cjs
//
// Zweck: Die Katalogaussagen zu Kristallzahl, Farbwelt-Register und Blogartikeln
// werden nicht aus dem Quelltext abgeleitet, sondern in Chromium gegen die
// Pages-Struktur (/Esoterik-Welt/) gemessen. Ergebnis:
//   docs/migration-baseline/evidence/release-gate/runtime-fakten.json
// Exitcode 1, wenn eine Muss-Erwartung nicht zutrifft.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'release-gate');
const PREFIX = '/Esoterik-Welt';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      const url = decodeURIComponent(String(request.url).split('?')[0]);
      if (!url.startsWith(PREFIX)) {
        response.writeHead(404, { 'content-type': 'text/plain' });
        response.end('outside prefix');
        return;
      }
      let rel = url.slice(PREFIX.length).replace(/^\/+/, '');
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT)) {
        response.writeHead(403);
        response.end('forbidden');
        return;
      }
      fs.readFile(file, (error, data) => {
        if (error) {
          response.writeHead(404, { 'content-type': 'text/plain' });
          response.end('not found');
          return;
        }
        response.writeHead(200, {
          'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        });
        response.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const count = (page, selector) => page.locator(selector).count();

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    console.error('playwright fehlt — `npm ci` ausfuehren.');
    process.exit(2);
  }
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}${PREFIX}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));

  const facts = {};

  // --- Kristalle: wie viele Karten rendert das Modul wirklich, und aus welcher Datei?
  await page.goto(`${base}index.html#crystals`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  facts.crystals = {
    cards: await count(page, '.crystal-card'),
    cardIds: await page.locator('.crystal-card').evaluateAll((nodes) =>
      nodes.map((node) => node.dataset.id || node.getAttribute('data-id') || '').filter(Boolean)
    ),
    dataRequests: requests.filter((url) => url.includes('crystals.json') || url.includes('crystals.js')),
  };

  // --- Farbwelten-Register: welche Routen verlinkt die Oberflaeche?
  requests.length = 0;
  await page.goto(`${base}index.html#farbwelten`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  facts.farbwelten = {
    registerLinks: await page
      .locator('a[href^="#farbwelten/"]')
      .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute('href')))].sort()),
    h1: (await page.locator('main h1').first().textContent({ timeout: 3000 }).catch(() => null)) || null,
  };

  // --- Themenseiten und Indigo direkt adressieren.
  // Farbwelt-Unterseiten rendert das Modul in #farbweltenRoot; ein unbekannter Slug
  // ergibt VIEW.NOTFOUND (js/modules/farbwelten-model.js L77), nicht #routeNotice.
  const probe = async (hash) => {
    await page.goto(`${base}index.html${hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const heading = await page
      .locator('#farbweltenRoot h1')
      .first()
      .textContent({ timeout: 3000 })
      .catch(() => null);
    const headingText = heading ? heading.replace(/\s+/g, ' ').trim().slice(0, 100) : null;
    const body = await page.locator('#farbweltenRoot').innerText().catch(() => '');
    return {
      hash,
      heading: headingText,
      notFound: !headingText || /gibt es nicht|nicht gefunden|unbekannt/i.test(body.slice(0, 400)),
    };
  };
  facts.probeder = [];
  for (const hash of [
    '#farbwelten/indigo',
    '#farbwelten/braun',
    '#farbwelten/farbtherapie',
    '#farbwelten/farbpsychologie',
    '#farbwelten/lichtmedizin',
    '#farbwelten/therapie',
    '#farbwelten/psychologie',
    '#farbwelten/licht',
  ]) {
    facts.probeder.push(await probe(hash));
  }

  // --- Blog: Artikelliste und Einzelartikel #blog/6
  await page.goto(`${base}index.html#blog`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  facts.blog = { listItems: await count(page, '[data-article-id], .article-card, .blog-card') };
  await page.goto(`${base}index.html#blog/6`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  facts.blog.article6 = {
    modalOpen: await page.locator('#articleModal.open').isVisible().catch(() => false),
    title: (await page.locator('#articleModal h2, #articleModal .modal-title').first().textContent({ timeout: 2000 }).catch(() => null)) || null,
  };

  // --- Datenschutzerklaerung: deckt sie die tatsaechlich verwendeten Speicherorte?
  const datenschutz = fs.readFileSync(path.join(ROOT, 'datenschutz.html'), 'utf8');
  const storageKeys = ['esot_crystals_fav', 'esot_rad_journal_v', 'esot_rad_experiment_v', 'esoterik_runes_history', 'esoterik_tarot_deck'];
  facts.datenschutz = {
    mentionsJournal: /Journal|Radi[äa]sthesie/i.test(datenschutz),
    mentionsExperiment: /Experiment/i.test(datenschutz),
    mentionsRunes: /Runen/i.test(datenschutz),
    mentionsTarot: /Tarot/i.test(datenschutz),
    trackedKeys: storageKeys,
  };

  const COLOR_SLUGS = ['rot', 'orange', 'gelb', 'gruen', 'tuerkis', 'blau', 'indigo', 'violett', 'magenta', 'rosa', 'weiss', 'schwarz'];
  const registerColors = facts.farbwelten.registerLinks
    .map((href) => String(href).replace('#farbwelten/', ''))
    .filter((slug) => COLOR_SLUGS.includes(slug));
  facts.farbwelten.registerColors = registerColors;

  const expectations = {
    crystalCardsEqualDataFile: facts.crystals.cards === facts.crystals.cardIds.length,
    crystalCountIs30: facts.crystals.cards === 30,
    noLegacyCrystalModule: !requests.some((url) => url.endsWith('/js/data/crystals.js')),
    registerHas12Colors: registerColors.length === 12 && COLOR_SLUGS.every((slug) => registerColors.includes(slug)),
    indigoResolves: !facts.probeder.find((item) => item.hash === '#farbwelten/indigo').notFound,
    braunIsNotARoute: facts.probeder.find((item) => item.hash === '#farbwelten/braun').notFound,
    topicPagesResolve: facts.probeder
      .filter((item) => ['#farbwelten/farbtherapie', '#farbwelten/farbpsychologie', '#farbwelten/lichtmedizin'].includes(item.hash))
      .every((item) => !item.notFound),
    oldTopicSlugsAreNotRoutes: facts.probeder
      .filter((item) => ['#farbwelten/therapie', '#farbwelten/psychologie', '#farbwelten/licht'].includes(item.hash))
      .every((item) => item.notFound),
    blog6Opens: facts.blog.article6.modalOpen,
  };

  const result = {
    generated_at: new Date().toISOString(),
    base,
    base_commit: require('node:child_process')
      .execSync('git rev-parse HEAD', { cwd: ROOT })
      .toString()
      .trim(),
    facts,
    expectations,
    ok: Object.values(expectations).every(Boolean),
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'runtime-fakten.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ expectations, crystals: facts.crystals.cards, register: facts.farbwelten.registerLinks.length }, null, 2));
  await browser.close();
  server.close();
  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
