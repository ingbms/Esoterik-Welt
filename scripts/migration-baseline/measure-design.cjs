'use strict';
// Erhebt das tatsaechlich gerenderte Layout der Baseline und legt die Nachweise des
// Design-Katalogs ab: Screenshots je Viewport sowie messung.json / messung-seiten.json.
//
//   node scripts/migration-baseline/measure-design.cjs
//
// Voraussetzungen: playwright (devDependency) mit installiertem Chromium. Das Skript startet
// einen eigenen Statikserver auf einem freien Port und bildet /Esoterik-Welt/ auf das
// Repository-Wurzelverzeichnis ab — dieselbe URL-Struktur wie GitHub Pages, damit das
// <base href="/Esoterik-Welt/"> der Seiten greift.
//
// Ergebnis (nicht von Hand bearbeiten):
//   docs/migration-baseline/evidence/design/home-{1440,1024,780,390}.png
//   docs/migration-baseline/evidence/design/modal-tarot-1440.png
//   docs/migration-baseline/evidence/design/nav-offen-390.png
//   docs/migration-baseline/evidence/design/focus-skiplink-1440.png
//   docs/migration-baseline/evidence/design/farbwelten-rot-{1440,390}.png
//   docs/migration-baseline/evidence/design/frequenzlabor-1440.png
//   docs/migration-baseline/evidence/design/radiasthesie-glossar-1440.png
//   docs/migration-baseline/evidence/design/messung.json
//   docs/migration-baseline/evidence/design/messung-seiten.json

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'design');
const PREFIX = '/Esoterik-Welt';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ttf': 'font/ttf',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '780', width: 780, height: 900 },
  { name: '390', width: 390, height: 844 },
];

const PAGES = [
  { file: 'farbwelten-rot-1440.png', hash: '#farbwelten/rot', width: 1440, height: 900, wait: 1500 },
  { file: 'frequenzlabor-1440.png', hash: '#frequenzen', width: 1440, height: 900, wait: 1500 },
  { file: 'radiasthesie-glossar-1440.png', hash: 'radiasthesie/glossar.html', width: 1440, height: 900, wait: 800 },
  { file: 'farbwelten-rot-390.png', hash: '#farbwelten/rot', width: 390, height: 844, wait: 1500 },
];

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      const url = decodeURIComponent(request.url.split('?')[0]);
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

function contrast(foreground, background) {
  const luminance = (hex) => {
    const match = String(hex)
      .trim()
      .match(/^#([0-9a-f]{6})$/i);
    if (!match) return null;
    const value = parseInt(match[1], 16);
    const channel = (part) => {
      const c = part / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel((value >> 16) & 255) + 0.7152 * channel((value >> 8) & 255) + 0.0722 * channel(value & 255);
  };
  const a = luminance(foreground);
  const b = luminance(background);
  if (a === null || b === null) return null;
  const [high, low] = a > b ? [a, b] : [b, a];
  return Math.round(((high + 0.05) / (low + 0.05)) * 100) / 100;
}

async function collect(page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const container = document.querySelector('main .container') || document.querySelector('.container');
    const heading = document.querySelector('.page:not([hidden]) h1, .page h1, h1');
    const card = document.querySelector('.card, .feature-card, .tarot-card');
    const button = document.querySelector('.btn');
    const active = document.activeElement;
    const skip = document.querySelector('.skip-link');
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyOverflowX: document.documentElement.scrollWidth > window.innerWidth,
      bodyBackground: body.backgroundColor,
      gutter: root.getPropertyValue('--gutter').trim(),
      textH1: root.getPropertyValue('--text-h1').trim(),
      textPageTitle: root.getPropertyValue('--text-page-title').trim(),
      headerHeight: root.getPropertyValue('--header-height').trim(),
      containerPaddingLeft: container ? getComputedStyle(container).paddingLeft : null,
      containerWidth: container ? Math.round(container.getBoundingClientRect().width) : null,
      h1FontSize: heading ? getComputedStyle(heading).fontSize : null,
      cardBorderRadius: card ? getComputedStyle(card).borderRadius : null,
      btnMinHeight: button ? getComputedStyle(button).minHeight : null,
      activeElement: active ? `${active.tagName.toLowerCase()}.${active.className || ''}` : null,
      skipTransform: skip ? getComputedStyle(skip).transform : null,
      dataTheme: document.documentElement.getAttribute('data-theme'),
      visiblePages: [...document.querySelectorAll('.page')]
        .filter((section) => !section.hidden)
        .map((section) => section.id),
    };
  });
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    console.error('playwright fehlt — `npm ci` ausfuehren. Ohne Browser bleibt die Messung offen.');
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}${PREFIX}/`;
  const browser = await chromium.launch();
  const result = {
    base,
    measured_at: new Date().toISOString(),
    viewports: {},
    tokens: {},
    interactions: {},
    contrast: {},
    consoleErrors: [],
  };
  const consoleErrors = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${viewport.name}: ${message.text()}`);
    });
    page.on('pageerror', (error) => consoleErrors.push(`${viewport.name}: pageerror ${error.message}`));
    // Jeder Umbruchpunkt wird als frisch geladenes Dokument gemessen (kein Resize eines geladenen Dokuments).
    await page.goto(`${base}?v=${viewport.name}`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    result.viewports[viewport.name] = await collect(page);
    await page.screenshot({ path: path.join(OUT, `home-${viewport.name}.png`) });

    if (viewport.name === '1440') {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(150);
      result.interactions.skipLink = await page.evaluate(() => {
        const skip = document.querySelector('.skip-link');
        return skip
          ? {
              focused: document.activeElement === skip,
              text: skip.textContent.trim(),
              transform: getComputedStyle(skip).transform,
              outline: getComputedStyle(skip).outline,
              rectTop: Math.round(skip.getBoundingClientRect().top),
            }
          : null;
      });
      await page.screenshot({ path: path.join(OUT, 'focus-skiplink-1440.png') });

      result.tokens = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const names = [
          '--color-bg-deep',
          '--color-bg-card',
          '--color-text-primary',
          '--color-text-secondary',
          '--color-primary',
          '--color-hover',
          '--color-border',
          '--color-line-strong',
          '--fw-rot-ink',
          '--fw-rot-core',
          '--fw-rot-deep',
          '--fw-rot-deep-alt',
          '--fw-rot-soft',
          '--radius-sm',
          '--space-3',
          '--container-max',
          '--color-accent-emerald',
          '--color-accent-rose',
        ];
        return Object.fromEntries(names.map((name) => [name, root.getPropertyValue(name).trim()]));
      });

      await page.goto(`${base}#tarot`, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      result.interactions.tarotGrid = await page.evaluate(() => ({
        cards: document.querySelectorAll('#tarotGrid .tarot-card').length,
        firstTag: document.querySelector('#tarotGrid .tarot-card')?.tagName || null,
      }));
      await page.evaluate(() => {
        document.querySelector('#tarotGrid .tarot-card')?.click();
      });
      await page.waitForSelector('.modal-backdrop.open', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);
      result.interactions.modal = await page.evaluate(() => {
        const backdrop = document.querySelector('.modal-backdrop');
        const dialog = backdrop ? backdrop.querySelector('.modal') : null;
        const close = backdrop ? backdrop.querySelector('.modal-close') : null;
        return {
          backdropPresent: Boolean(backdrop),
          open: backdrop ? backdrop.classList.contains('open') : false,
          dialogRole: backdrop ? backdrop.getAttribute('role') : null,
          ariaModal: backdrop ? backdrop.getAttribute('aria-modal') : null,
          closeSize: close
            ? {
                w: Math.round(close.getBoundingClientRect().width),
                h: Math.round(close.getBoundingClientRect().height),
              }
            : null,
          activeInDialog: dialog ? dialog.contains(document.activeElement) : false,
          bodyOverflow: getComputedStyle(document.body).overflow,
        };
      });
      await page.screenshot({ path: path.join(OUT, 'modal-tarot-1440.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      result.interactions.modalClosed = await page.evaluate(() => {
        const backdrop = document.querySelector('.modal-backdrop');
        return backdrop ? !backdrop.classList.contains('open') : null;
      });
    }

    if (viewport.name === '390') {
      await page.goto(`${base}#tarot`, { waitUntil: 'load' });
      await page.waitForTimeout(500);
      await page.evaluate(() => document.querySelector('.nav-toggle')?.click());
      await page.waitForTimeout(400);
      result.interactions.mobileNav = await page.evaluate(() => {
        const nav = document.querySelector('.nav');
        const list = document.querySelector('.nav-list');
        const link = document.querySelector('.nav-link');
        return {
          toggled: Boolean(nav && nav.classList.contains('open')),
          listDisplay: list ? getComputedStyle(list).display : null,
          linkHeight: link ? Math.round(link.getBoundingClientRect().height) : null,
        };
      });
      await page.screenshot({ path: path.join(OUT, 'nav-offen-390.png') });
    }
    await context.close();
  }

  const token = result.tokens;
  result.contrast = {
    'text-primary auf bg-deep': contrast(token['--color-text-primary'], token['--color-bg-deep']),
    'text-secondary auf bg-card': contrast(token['--color-text-secondary'], token['--color-bg-card']),
    'primary auf bg-deep': contrast(token['--color-primary'], token['--color-bg-deep']),
    'border auf bg-deep': contrast(token['--color-border'], token['--color-bg-deep']),
    'line-strong auf bg-deep': contrast(token['--color-line-strong'], token['--color-bg-deep']),
    'fw-rot-ink auf fw-rot-deep': contrast(token['--fw-rot-ink'], token['--fw-rot-deep']),
    'fw-rot-ink auf fw-rot-core': contrast(token['--fw-rot-ink'], token['--fw-rot-core']),
    'fw-rot-soft auf fw-rot-deep': contrast(token['--fw-rot-soft'], token['--fw-rot-deep']),
    'accent-emerald auf bg-card': contrast(token['--color-accent-emerald'], token['--color-bg-card']),
    'accent-rose auf bg-card': contrast(token['--color-accent-rose'], token['--color-bg-card']),
  };
  result.consoleErrors = consoleErrors;
  fs.writeFileSync(path.join(OUT, 'messung.json'), `${JSON.stringify(result, null, 2)}\n`);

  // Bereichsseiten: gleiche Messung, eigene Datei
  const pages = [];
  for (const target of PAGES) {
    const context = await browser.newContext({ viewport: { width: target.width, height: target.height } });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(`pageerror ${error.message}`));
    await page.goto(`${base}${target.hash}`, { waitUntil: 'load' });
    await page.waitForTimeout(target.wait);
    const data = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('.page')].find((section) => !section.hidden);
      const section = visible || document.body;
      return {
        title: document.title,
        activePage: visible ? visible.id : null,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        headings: [...section.querySelectorAll('h1, h2')]
          .slice(0, 6)
          .map((heading) => `${heading.tagName} ${heading.textContent.trim().slice(0, 60)}`),
        figures: section.querySelectorAll('figure, img, svg').length,
      };
    });
    await page.screenshot({ path: path.join(OUT, target.file) });
    pages.push({ file: target.file, url: `${base}${target.hash}`, ...data, consoleErrors: errors });
    await context.close();
  }
  fs.writeFileSync(
    path.join(OUT, 'messung-seiten.json'),
    `${JSON.stringify({ measured_at: new Date().toISOString(), pages }, null, 2)}\n`
  );

  await browser.close();
  server.close();

  const summary = Object.entries(result.viewports).map(([name, value]) => ({
    viewport: name,
    overflow: value.bodyOverflowX,
    gutter: value.gutter,
    textH1: value.textH1,
    containerPaddingLeft: value.containerPaddingLeft,
    h1FontSize: value.h1FontSize,
  }));
  console.log(
    JSON.stringify(
      {
        viewports: summary,
        interactions: result.interactions,
        contrast: result.contrast,
        pages: pages.map((page) => ({ file: page.file, overflow: page.overflow })),
        consoleErrors,
      },
      null,
      2
    )
  );
  if (consoleErrors.length) process.exit(1);
}

main().catch((error) => {
  console.error('FEHLER', error.message);
  process.exit(1);
});
