'use strict';
// Prueft, ob die im Inhalts-Katalog gefuehrten Routen tatsaechlich Inhalt zeigen.
//   node scripts/migration-baseline/check-catalog-routes.cjs
// Ergebnis: docs/migration-baseline/evidence/design-review/route-check.json
//
// Hintergrund: Der Design-Katalog beschreibt Bausteine, nicht Erreichbarkeit. Fuer das
// Release-Gate muss aber belegbar sein, dass eine katalogisierte Route nicht auf der
// "Unbekannte Farbwelt"-Ansicht landet. Dieses Skript oeffnet jede Route und vergleicht
// sie mit den Links, die die Oberflaeche selbst anbietet (Register, Navigation).

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'design-review');
const CATALOG = path.join(ROOT, 'docs', 'migration-baseline', 'content-catalog.json');
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
  '.ttf': 'font/ttf',
  '.md': 'text/markdown; charset=utf-8',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      const url = decodeURIComponent(String(request.url).split('?')[0]);
      if (!url.startsWith(PREFIX)) {
        response.writeHead(404);
        response.end('outside prefix');
        return;
      }
      let rel = url.slice(PREFIX.length).replace(/^\/+/, '');
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      fs.readFile(path.join(ROOT, rel), (error, data) => {
        if (error) {
          response.writeHead(404);
          response.end('not found');
          return;
        }
        response.writeHead(200, {
          'content-type': TYPES[path.extname(rel).toLowerCase()] || 'application/octet-stream',
        });
        response.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function toUrl(route) {
  if (!route) return null;
  if (route.startsWith('#')) return route;
  if (/\.html$/.test(route)) return route;
  return null;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    console.error('playwright fehlt');
    process.exit(2);
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const entries = catalog.entries || [];
  const routes = [
    ...new Set(
      entries
        .map((entry) => entry.route)
        .filter(Boolean)
        .map(toUrl)
        .filter(Boolean)
    ),
  ];

  fs.mkdirSync(OUT, { recursive: true });
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}${PREFIX}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const measured = [];
  for (const route of routes) {
    await page.goto(`${base}${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(route.startsWith('#') ? 1200 : 300);
    const data = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('.page')].filter((section) => !section.hidden);
      const scope = visible[0] || document.querySelector('main') || document.body;
      const heading = scope.querySelector('h1');
      const h1 = heading ? heading.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null;
      return {
        title: document.title,
        h1,
        textLength: (scope.innerText || '').trim().length,
        // Nur die echte Nicht-gefunden-Ansicht zaehlen: Titel und H1 sind dort eindeutig.
        notFound: /Unbekannte Farbwelt/.test(document.title) || h1 === 'Diese Farbwelt gibt es nicht',
      };
    });
    measured.push({ route, ...data });
  }

  // Von der Oberflaeche selbst angebotene Ziele (Register + Navigation).
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const linkedHome = await page.evaluate(() =>
    [...document.querySelectorAll('.nav-link, a[href^="#"]')]
      .map((link) => link.getAttribute('href'))
      .filter((href) => href && href.startsWith('#') && href !== '#main')
  );
  await page.goto(`${base}#farbwelten`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  const linkedRegister = await page.evaluate(() =>
    [...document.querySelectorAll('.fw-register__link')].map((link) => link.getAttribute('href')).filter(Boolean)
  );

  await context.close();
  await browser.close();
  server.close();

  const notFound = measured.filter((item) => item.notFound);
  const catalogSet = new Set(measured.map((item) => item.route));
  const linkedSet = new Set([...linkedHome, ...linkedRegister]);
  const missingFromCatalog = [...linkedSet].filter((href) => !catalogSet.has(href)).sort();

  const result = {
    generated_at: new Date().toISOString(),
    catalog: path.relative(ROOT, CATALOG).replace(/\\/g, '/'),
    routes_checked: measured.length,
    not_found: notFound.map((item) => item.route),
    measured,
    linked_but_not_cataloged: missingFromCatalog,
    register_links: [...new Set(linkedRegister)].sort(),
  };
  fs.writeFileSync(path.join(OUT, 'route-check.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        routes_checked: result.routes_checked,
        not_found: result.not_found,
        linked_but_not_cataloged: result.linked_but_not_cataloged,
        samples: measured.slice(0, 6),
      },
      null,
      2
    )
  );
  process.exit(notFound.length ? 1 : 0);
}

main().catch((error) => {
  console.error('FEHLER', error);
  process.exit(1);
});
