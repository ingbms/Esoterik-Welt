'use strict';
// Detailpruefung zu Namen, Landmarks, Zielgroessen und doppelten IDs.
//   node scripts/migration-baseline/check-design-details.cjs
// Ergebnis: docs/migration-baseline/evidence/design-review/detail-befunde.json
//
// Ergaenzt review-design-a11y.cjs: dort werden Textkontrast, Fokus, Formularzustaende und
// Reflow gemessen; hier geht es um zugaengliche Namen von Links/Knoepfen, Landmarks,
// Trefferflaechen unter 44px, doppelte IDs und den Kontext leerer Alt-Texte.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'design-review');
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
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const ROUTES = [
  ['home', ''],
  ['tarot', '#tarot'],
  ['crystals', '#crystals'],
  ['moon', '#moon'],
  ['astrologie', '#astrologie'],
  ['frequenzen', '#frequenzen'],
  ['runes', '#runes'],
  ['pendeln-studio', '#pendeln/studio'],
  ['pendeln-journal', '#pendeln/journal'],
  ['pendeln-labor', '#pendeln/labor'],
  ['pendeln-experiment', '#pendeln/experiment'],
  ['farbwelten', '#farbwelten'],
  ['fw-rot', '#farbwelten/rot'],
  ['blog', '#blog'],
  ['radiasthesie-glossar', 'radiasthesie/glossar.html'],
  ['radiasthesie-index', 'radiasthesie/index.html'],
  ['datenschutz', 'datenschutz.html'],
];

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
      const file = path.join(ROOT, rel);
      fs.readFile(file, (error, data) => {
        if (error) {
          response.writeHead(404);
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

const PROBE = () => {
  const visible = (el) => {
    if (!el.getClientRects().length) return false;
    if (typeof el.checkVisibility === 'function') {
      return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true });
    }
    return getComputedStyle(el).visibility !== 'hidden';
  };
  const label = (el) => {
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '';
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls}`;
  };
  const name = (el) => {
    const aria = el.getAttribute('aria-label');
    if (aria && aria.trim()) return { value: aria.trim(), source: 'aria-label' };
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .map((ref) => ref.textContent.trim())
        .join(' ')
        .trim();
      if (text) return { value: text, source: 'aria-labelledby' };
    }
    const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (text) return { value: text, source: 'text' };
    const image = el.querySelector('img[alt]');
    if (image && image.getAttribute('alt').trim())
      return { value: image.getAttribute('alt').trim(), source: 'img-alt' };
    if (el.getAttribute('title')) return { value: el.getAttribute('title'), source: 'title' };
    return { value: '', source: null };
  };

  const interactive = [...document.querySelectorAll('a[href], button, summary, [role="button"]')].filter(visible);
  const nameless = interactive
    .map((el) => ({ selector: label(el), name: name(el) }))
    .filter((item) => !item.name.value);

  const small = interactive
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && rect.height <= 24) return false;
      const labelEl = el.closest('label');
      const box = labelEl ? labelEl.getBoundingClientRect() : rect;
      return box.width < 44 || box.height < 44;
    })
    .slice(0, 40)
    .map((el) => {
      const labelEl = el.closest('label');
      const box = labelEl ? labelEl.getBoundingClientRect() : el.getBoundingClientRect();
      return {
        selector: label(el),
        text: (el.getAttribute('aria-label') || el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        w: Math.round(box.width),
        h: Math.round(box.height),
      };
    });

  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].map((id) => {
    const owners = [...document.querySelectorAll(`[id="${CSS.escape(id)}"]`)].map((el) => label(el));
    return { id, owners };
  });

  const images = [...document.images]
    .filter(visible)
    .map((img) => {
      const owner = img.closest('a[href], button, [role="button"]');
      return {
        src: (img.currentSrc || img.getAttribute('src') || '').split('/Esoterik-Welt/').pop(),
        alt: img.getAttribute('alt'),
        role: img.getAttribute('role'),
        parentControl: owner ? { selector: label(owner), name: name(owner) } : null,
      };
    })
    .filter((image) => image.alt === '')
    .slice(0, 12);

  const navToggle = document.querySelector('.nav-toggle');
  return {
    landmarks: {
      main: document.querySelectorAll('main').length,
      nav: document.querySelectorAll('nav').length,
      header: document.querySelectorAll('header').length,
      footer: document.querySelectorAll('footer').length,
    },
    interactiveCount: interactive.length,
    nameless,
    small,
    duplicates,
    emptyAltImages: images,
    navToggle: navToggle
      ? {
          ariaLabel: navToggle.getAttribute('aria-label'),
          ariaExpanded: navToggle.getAttribute('aria-expanded'),
          ariaControls: navToggle.getAttribute('aria-controls'),
        }
      : null,
    h1Count: document.querySelectorAll('h1').length,
  };
};

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    console.error('playwright fehlt');
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}${PREFIX}/`;
  const browser = await chromium.launch();
  const results = [];
  const dialogs = {};
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Kristall-Detaildialog: Alternativtext des Bildes im Dialog.
    await page.goto(`${base}#crystals`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector('.crystal-details-btn')?.click());
    await page.waitForTimeout(900);
    dialogs.crystal = await page.evaluate(() => {
      const modal = document.getElementById('crystalModal');
      const body = document.getElementById('crystalModalBody');
      const image = body ? body.querySelector('img') : null;
      return {
        modalPresent: Boolean(modal),
        open: modal ? !modal.hidden && getComputedStyle(modal).display !== 'none' : false,
        role: modal ? modal.getAttribute('role') : null,
        ariaModal: modal ? modal.getAttribute('aria-modal') : null,
        ariaLabelledby: modal ? modal.getAttribute('aria-labelledby') || modal.getAttribute('aria-label') : null,
        dialogTitle: body ? (body.querySelector('h2, h3') || {}).textContent || null : null,
        imageAlt: image ? image.getAttribute('alt') : null,
        imageSrc: image ? (image.getAttribute('src') || '').split('/').pop() : null,
        focusInside: modal ? modal.contains(document.activeElement) : null,
      };
    });

    // Dieselbe Pruefung fuer den Tarot-Dialog.
    await page.goto(`${base}#tarot`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector('#tarotGrid .tarot-card')?.click());
    await page.waitForTimeout(800);
    dialogs.tarot = await page.evaluate(() => {
      const backdrop = document.querySelector('.modal-backdrop');
      const dialog = backdrop ? backdrop.querySelector('.modal') : null;
      const image = dialog ? dialog.querySelector('img') : null;
      return {
        open: backdrop ? backdrop.classList.contains('open') : false,
        imageAlt: image ? image.getAttribute('alt') : null,
        imageSrc: image ? (image.getAttribute('src') || '').split('/').pop() : null,
      };
    });

    // Importieren-Knoepfe: warum liefern sie keinen zugänglichen Namen?
    await page.goto(`${base}#pendeln/studio`, { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    dialogs.importButtons = await page.evaluate(() =>
      ['#ptfImportApply', '#ptfImportFile', '#ptfImportText'].map((selector) => {
        const el = document.querySelector(selector);
        if (!el) return { selector, present: false };
        const rect = el.getBoundingClientRect();
        const details = el.closest('details');
        return {
          selector,
          present: true,
          text: (el.textContent || '').trim().slice(0, 30),
          innerText: (el.innerText || '').trim().slice(0, 30),
          rect: { w: Math.round(rect.width), h: Math.round(rect.height) },
          display: getComputedStyle(el).display,
          visibility: getComputedStyle(el).visibility,
          detailsOpen: details ? details.open : null,
        };
      })
    );
    await context.close();
  }
  for (const viewport of [
    { name: '1440', width: 1440, height: 900 },
    { name: '390', width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const [id, route] of ROUTES) {
      await page.goto(`${base}${route}`, { waitUntil: 'load' });
      await page.waitForTimeout(route.startsWith('#pendeln/') ? 3500 : 1000);
      try {
        const data = await page.evaluate(PROBE);
        results.push({ route: id, viewport: viewport.name, data });
      } catch (error) {
        results.push({ route: id, viewport: viewport.name, error: error.message });
      }
    }
    await context.close();
  }
  await browser.close();
  server.close();

  const summary = {
    routes: results.length,
    nameless_interactive: results.reduce((sum, r) => sum + (r.data ? r.data.nameless.length : 0), 0),
    below_44: results.reduce((sum, r) => sum + (r.data ? r.data.small.length : 0), 0),
    duplicate_id_routes: results
      .filter((r) => r.data && r.data.duplicates.length)
      .map((r) => `${r.route}@${r.viewport}`),
    empty_alt_without_control_name: results.flatMap((r) =>
      r.data
        ? r.data.emptyAltImages
            .filter((image) => !image.parentControl || !image.parentControl.name.value)
            .map((image) => `${r.route}@${r.viewport} ${image.src}`)
        : []
    ),
    routes_without_main: results
      .filter((r) => r.data && r.data.landmarks.main === 0)
      .map((r) => `${r.route}@${r.viewport}`),
    navToggle: results.find((r) => r.data && r.data.navToggle)?.data.navToggle || null,
  };
  fs.writeFileSync(
    path.join(OUT, 'detail-befunde.json'),
    `${JSON.stringify({ generated_at: new Date().toISOString(), summary, dialogs, results }, null, 2)}\n`
  );
  console.log(JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ dialogs }, null, 2));
  console.log(
    JSON.stringify(
      {
        nameless: results
          .flatMap((r) => (r.data ? r.data.nameless.map((item) => `${r.route}: ${item.selector}`) : []))
          .slice(0, 10),
        duplicates: results.filter((r) => r.data && r.data.duplicates.length).map((r) => [r.route, r.data.duplicates]),
        smallExamples: results
          .filter((r) => r.data && r.data.small.length)
          .map((r) => [r.route, r.viewport, r.data.small.slice(0, 4)])
          .slice(0, 6),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('FEHLER', error);
  process.exit(1);
});
