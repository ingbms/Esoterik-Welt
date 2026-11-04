/**
 * Browser-Prüfung des automatischen Seiten-Inhaltsverzeichnisses (Kanban `t_3c130426`).
 *
 * Warum ein eigenes Skript statt einer Playwright-Spec: Die Suite in
 * `playwright.config.cjs` startet `index.js`, das die **Legacy**-Ausgabe unter
 * `/Esoterik-Welt` ausliefert; die Astro-Seiten liegen direkt in `dist/`. Dieses
 * Skript startet deshalb einen eigenen statischen Server über `dist/` auf einem
 * freien Port und fährt die Prüfungen mit Chromium.
 *
 * Geprüft werden die Abnahmekriterien aus `docs/velarkana-toc/spezifikation.md`
 * §7.4–§7.7, die ohne manuellen Screenreader-Lauf (TF-22) automatisierbar sind,
 * sowie die Messwerte aus `docs/velarkana-toc/01-design.md` §4/§6. Der Bericht
 * (JSON) und die Screenshots landen in `evidence/velarkana-toc/`.
 *
 * Aufruf:
 *   npm run build && node scripts/toc/verify-browser.mjs
 *   node scripts/toc/verify-browser.mjs --dist dist --out evidence/velarkana-toc
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const DIST = resolve(readArg('--dist', 'dist'));
const OUT = resolve(readArg('--out', 'evidence/velarkana-toc'));
const PILOT = '/frequenzen/quellen.html';
const SPY_EXTRA = 24;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function startServer(root) {
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const target = normalize(join(root, pathname));
      if (!target.startsWith(root)) {
        response.writeHead(403).end('forbidden');
        return;
      }
      const file = await readFile(target).catch(() => null);
      if (!file) {
        response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
        response.end('not found');
        return;
      }
      response.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' });
      response.end(file);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => done({ server, port: server.address().port }));
  });
}

const checks = [];
const check = (id, description, ok, detail) => {
  checks.push({ id, description, ok: Boolean(ok), detail });
  console.log(`${ok ? '✔' : '✖'} ${id} — ${description}${ok ? '' : ` ${JSON.stringify(detail)}`}`);
};

/** Wartet, bis das native Ankerspringen (inkl. Smooth-Scrolling) zur Ruhe gekommen ist. */
async function waitForAnchor(page, id) {
  const deadline = Date.now() + 8000;
  let last = null;
  while (Date.now() < deadline) {
    const state = await page.evaluate((target) => {
      const heading = document.getElementById(target);
      const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
      return { top: heading.getBoundingClientRect().top, header, y: Math.round(window.scrollY) };
    }, id);
    last = state;
    if (state.top >= state.header && state.top <= state.header + 40) return state;
    await page.waitForTimeout(120);
  }
  return last;
}

async function openPilot(context, { hash = '', width = 1440, height = 900 } = {}) {
  const page = await context.newPage();
  const consoleErrors = [];
  const requests = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('request', (request) => requests.push(new URL(request.url())));
  await page.setViewportSize({ width, height });
  await page.goto(`${process.env.TOC_BASE_URL ?? ''}${PILOT}${hash}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  return { page, consoleErrors, requests };
}

const activeLabel = (page) =>
  page.evaluate(() => {
    const links = [...document.querySelectorAll('.page-toc__link')];
    const active = links.filter((link) => link.getAttribute('aria-current') === 'location');
    return {
      count: active.length,
      href: active[0]?.getAttribute('href') ?? null,
      classed: links.filter((link) => link.classList.contains('is-active')).length,
      total: links.length,
    };
  });

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const { server, port } = await startServer(DIST);
  process.env.TOC_BASE_URL = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });
  const shots = [];
  const metrics = {};

  try {
    /* ------------------------------ Desktop 1440 -------------------------- */
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const { page, consoleErrors, requests } = await openPilot(desktop);

    const layout = await page.evaluate(() => {
      const aside = document.querySelector('aside.page-toc');
      const prose = document.querySelector('.prose');
      const body = document.querySelector('[data-toc-body]');
      const asideBox = aside.getBoundingClientRect();
      const proseBox = prose.getBoundingClientRect();
      return {
        asideWidth: asideBox.width,
        asideLeft: asideBox.left,
        proseWidth: proseBox.width,
        proseRight: proseBox.right,
        gap: asideBox.left - proseBox.right,
        asideHeight: asideBox.height,
        bodyScroll: body.scrollHeight,
        bodyClient: body.clientHeight,
        sticky: getComputedStyle(aside).position,
        alignSelf: getComputedStyle(aside).alignSelf,
        headerHeight: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
        docHeight: document.documentElement.scrollHeight,
      };
    });
    metrics.desktop = layout;

    check(
      'AK-E1',
      'Randspalte 240–280 px, Prose 718–722 px, Abstand ≥ 32 px',
      layout.asideWidth >= 240 &&
        layout.asideWidth <= 280 &&
        layout.proseWidth >= 718 &&
        layout.proseWidth <= 722 &&
        layout.gap >= 32,
      layout
    );
    check(
      'AK-E2a',
      'Randspalte klebt (position: sticky, align-self: start)',
      layout.sticky === 'sticky' && layout.alignSelf === 'start',
      { sticky: layout.sticky, alignSelf: layout.alignSelf }
    );
    check(
      'AK-E3',
      'TOC-Höhe im Budget (vh − Header − 96 px)',
      layout.asideHeight <= 900 - layout.headerHeight - 96 + 1,
      { asideHeight: layout.asideHeight, budget: 900 - layout.headerHeight - 96 }
    );

    await page.screenshot({ path: join(OUT, '1440-start.png'), fullPage: false });
    shots.push('1440-start.png');

    const initial = await activeLabel(page);
    check('AK-D1', 'nach dem Laden genau ein aria-current', initial.count === 1 && initial.classed === 1, initial);
    check(
      'AK-D2',
      'ohne Hash ist der erste Eintrag aktiv',
      initial.href === '#frequenzen-quellen-evidenzstatus-und-methodik',
      initial
    );

    // Sticky-Verhalten nach 1.500 px Scroll.
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    await page.waitForTimeout(200);
    const sticky = await page.evaluate(() => {
      const aside = document.querySelector('aside.page-toc');
      const box = aside.getBoundingClientRect();
      return { top: box.top, height: box.height, viewport: window.innerHeight };
    });
    metrics.sticky = sticky;
    const header = layout.headerHeight;
    check(
      'AK-E2b',
      'nach 1.500 px Scroll: TOC-Oberkante = Header + 24 ± 2 px, nicht gestreckt',
      Math.abs(sticky.top - (header + SPY_EXTRA)) <= 2 && sticky.height < 1000,
      sticky
    );
    await page.screenshot({ path: join(OUT, '1440-sticky-aktiv.png') });
    shots.push('1440-sticky-aktiv.png');

    // Scroll-Spy an drei Positionen (abwärts), dann aufwärts, dann Dokumentende.
    const samples = ['4-datenschema', '6-einzelprüfungen', '11-hinweise-für-ui-und-audio-engine'];
    const spyResults = [];
    for (const id of samples) {
      await page.evaluate((target) => {
        const heading = document.getElementById(target);
        const offset = Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--header-height')
        );
        // Überschrift 4 px über die Scroll-Linie (Header + 24) setzen — dann ist
        // sie die letzte Überschrift „auf oder oberhalb der Linie“ (§6.5 Nr. 2).
        window.scrollTo({
          top: heading.getBoundingClientRect().top + window.scrollY - offset - 20,
          behavior: 'instant',
        });
      }, id);
      await page.waitForTimeout(200);
      spyResults.push({ id, result: await activeLabel(page) });
    }
    check(
      'AK-D3a',
      'Abwärts: aktiver Eintrag folgt der Überschrift',
      spyResults.every((entry) => entry.result.href === `#${entry.id}`),
      spyResults
    );

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);
    const upTop = await activeLabel(page);
    check(
      'AK-D3b',
      'Aufwärts an den Seitenanfang: erster Eintrag aktiv',
      upTop.href === '#frequenzen-quellen-evidenzstatus-und-methodik',
      upTop
    );

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(250);
    const bottom = await activeLabel(page);
    check('AK-D4', 'Dokumentende: letzter Eintrag aktiv', bottom.href === '#13-änderungslog', bottom);

    // Ankersprung per Klick (natives Scrollen, Header-Offset aus CSS).
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(150);
    await page.click('.page-toc__link[href="#6-einzelprüfungen"]');
    await waitForAnchor(page, '6-einzelprüfungen');
    const clickTarget = await page.evaluate(() => {
      const heading = document.getElementById('6-einzelprüfungen');
      return {
        top: heading.getBoundingClientRect().top,
        hash: decodeURIComponent(window.location.hash),
        active: document.querySelector('.page-toc__link[aria-current="location"]')?.getAttribute('href') ?? null,
      };
    });
    check(
      'AK-D5',
      'Klick springt zum Ziel im Offsetfenster [header+4, header+40] und setzt den Hash',
      clickTarget.top >= header + 4 && clickTarget.top <= header + 40 && clickTarget.hash === '#6-einzelprüfungen',
      { ...clickTarget, header }
    );

    // Prozentkodierter Hash (AK-C6).
    await page.goto(`${process.env.TOC_BASE_URL}${PILOT}#6-einzelpr%C3%BCfungen`, { waitUntil: 'load' });
    await waitForAnchor(page, '6-einzelprüfungen');
    const encoded = await page.evaluate(() => ({
      top: document.getElementById('6-einzelprüfungen').getBoundingClientRect().top,
      active: document.querySelector('.page-toc__link[aria-current="location"]')?.getAttribute('href') ?? null,
    }));
    check(
      'AK-C6',
      'prozentkodierter Hash trifft dasselbe Ziel und markiert denselben Eintrag',
      encoded.active === '#6-einzelprüfungen' && encoded.top >= header && encoded.top <= header + 64,
      { ...encoded, header }
    );

    // hashchange ohne Reload (AK-D6).
    const hashChange = await page.evaluate(async () => {
      window.location.hash = '#4-datenschema';
      await new Promise((resolveWait) => setTimeout(resolveWait, 400));
      return document.querySelector('.page-toc__link[aria-current="location"]')?.getAttribute('href') ?? null;
    });
    check('AK-D6', 'hashchange aktualisiert die Aktivierung ohne Neuladen', hashChange === '#4-datenschema', {
      hashChange,
    });

    // Tastatur: Summary ist auf dem Desktop ausgeblendet — dort zählt der Link.
    const keyboard = await page.evaluate(() => {
      const links = [...document.querySelectorAll('.page-toc__link')];
      links[2].focus();
      const style = getComputedStyle(links[2]);
      return {
        focused: document.activeElement === links[2],
        outlineWidth: Number.parseFloat(style.outlineWidth),
        minHeight: links[2].getBoundingClientRect().height,
      };
    });
    check(
      'AK-F3a',
      'Links sind fokussierbar, Fokusring ≥ 2 px, Zielhöhe ≥ 24 px',
      keyboard.focused && keyboard.outlineWidth >= 2 && keyboard.minHeight >= 24,
      keyboard
    );

    const truncation = await page.evaluate(
      () =>
        [...document.querySelectorAll('.page-toc__link')].filter((link) => link.scrollWidth > link.clientWidth + 1)
          .length
    );
    check('AK-B7', 'kein Eintrag wird abgeschnitten (scrollWidth = clientWidth)', truncation === 0, { truncation });

    const contrast = await page.evaluate(() => {
      const parse = (value) =>
        value
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number);
      const luminance = ([r, g, b]) => {
        const channel = (value) => {
          const scaled = value / 255;
          return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const ratio = (foreground, background) => {
        const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        return (light + 0.05) / (dark + 0.05);
      };
      const link = document.querySelector('.page-toc__link');
      const background = getComputedStyle(document.body).backgroundColor;
      const parseBackground = background === 'rgba(0, 0, 0, 0)' ? [11, 16, 18] : parse(background);
      const active = document.querySelector('.page-toc__link[aria-current="location"]') ?? link;
      return {
        resting: ratio(parse(getComputedStyle(link).color), parseBackground),
        active: ratio(parse(getComputedStyle(active).color), parseBackground),
      };
    });
    check(
      'AK-F4',
      'Kontrast Link und aktiver Link ≥ 4,5:1',
      contrast.resting >= 4.5 && contrast.active >= 4.5,
      contrast
    );

    const external = [...new Set(requests.map((url) => url.origin))].filter(
      (origin) => !origin.startsWith(process.env.TOC_BASE_URL)
    );
    check('AK-H2b', 'keine externen Netzwerk-Anfragen', external.length === 0, external);
    // Der Slug-Algorithmus liegt in einem dynamischen Import (nur für `dynamic`).
    // Der Pilot darf ihn nicht laden: sonst wäre das JS-Budget von 5 KB gerissen.
    const lazyChunks = requests.map((url) => url.pathname).filter((path) => /\/toc\.[^/]+\.js$/.test(path));
    check('AK-H2c', 'Pilot lädt den dynamischen Chunk (Slug-Bibliothek) nicht', lazyChunks.length === 0, lazyChunks);
    check('AK-H4b', 'keine Konsolenfehler', consoleErrors.length === 0, consoleErrors.slice(0, 5));

    // Druck: TOC ausgeblendet (AK-E8).
    await page.emulateMedia({ media: 'print' });
    const print = await page.evaluate(() => getComputedStyle(document.querySelector('.page-toc')).display);
    await page.emulateMedia({ media: 'screen' });
    check('AK-E8', 'im Druck ist das TOC ausgeblendet', print === 'none', { display: print });

    // Reduzierte Bewegung (AK-F5): keine erzwungene Bewegung.
    const noMotion = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const noMotionPage = await noMotion.newPage();
    await noMotionPage.goto(`${process.env.TOC_BASE_URL}${PILOT}`, { waitUntil: 'load' });
    const scrollBehavior = await noMotionPage.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    const tocTransition = await noMotionPage.evaluate(
      () => getComputedStyle(document.querySelector('.page-toc__link')).transitionDuration
    );
    check(
      'AK-F5',
      'prefers-reduced-motion: scroll-behavior auto, keine Transition',
      scrollBehavior === 'auto' && (tocTransition === '0s' || tocTransition === ''),
      { scrollBehavior, tocTransition }
    );
    await noMotion.close();
    await desktop.close();

    /* ------------------------------ Breakpoint 1200/1199 ------------------ */
    for (const width of [1200, 1199, 1024]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const { page: breakpointPage } = await openPilot(context, { width, height: 800 });
      const state = await breakpointPage.evaluate(() => {
        const aside = document.querySelector('aside.page-toc');
        const prose = document.querySelector('.prose');
        const details = document.querySelector('[data-toc-details]');
        const box = aside.getBoundingClientRect();
        return {
          position: getComputedStyle(aside).position,
          open: details.open,
          top: box.top,
          asideLeft: box.left,
          proseTop: prose.getBoundingClientRect().top,
          asideBottom: box.bottom,
          docScrollWidth: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
        };
      });
      metrics[`breakpoint-${width}`] = state;
      if (width === 1200) {
        check(
          'AK-E6a',
          '1200 px: Randspalte rechts, sticky, offen',
          state.position === 'sticky' && state.open === true && state.asideLeft > 700,
          state
        );
        await breakpointPage.screenshot({ path: join(OUT, '1200-rail.png') });
        shots.push('1200-rail.png');
      }
      if (width === 1199) {
        check(
          'AK-E6b',
          '1199 px: Block über dem Artikel, geschlossen, kein Überlauf',
          state.position === 'static' &&
            state.open === false &&
            state.asideBottom <= state.proseTop &&
            state.docScrollWidth <= state.viewport + 1,
          state
        );
      }
      if (width === 1024) {
        check('AK-E4a', '1024 px: TOC steht vor dem Artikel', state.asideBottom <= state.proseTop, state);
        await breakpointPage.screenshot({ path: join(OUT, '1024-offen.png') });
        shots.push('1024-offen.png');
      }
      await context.close();
    }

    /* ------------------------------ Mobil 390 ---------------------------- */
    // Bewusst ohne Playwright-`isMobile`: die Pilotseite hat bei 390 px einen
    // vorbestehenden horizontalen Überlauf (R-1, scrollWidth 540). Chromium
    // bläht im Mobil-Emulationsmodus das Layout-Viewport auf 540 px auf und
    // verschiebt das visuelle Viewport (offsetTop 325) — dann messen Anker und
    // Höhen falsch. Gemessen wird deshalb im 390-px-Viewport mit Touch; das
    // Verhalten von `<details>`, Targets und Scroll-Spy ist dort identisch.
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const { page: mobilePage, consoleErrors: mobileErrors } = await openPilot(mobile, { width: 390, height: 844 });
    const mobileState = await mobilePage.evaluate(() => {
      const aside = document.querySelector('aside.page-toc');
      const details = document.querySelector('[data-toc-details]');
      const summary = document.querySelector('.page-toc__summary');
      const prose = document.querySelector('.prose');
      const box = aside.getBoundingClientRect();
      return {
        open: details.open,
        summaryHeight: summary.getBoundingClientRect().height,
        asideBottom: box.bottom,
        proseTop: prose.getBoundingClientRect().top,
        asideScrollWidth: aside.scrollWidth,
        asideClientWidth: aside.clientWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      };
    });
    metrics.mobile = mobileState;
    check(
      'AK-E4b',
      '390 px: Block über dem Artikel, geschlossen, Summary ≥ 44 px',
      mobileState.open === false && mobileState.asideBottom <= mobileState.proseTop && mobileState.summaryHeight >= 44,
      mobileState
    );
    check(
      'AK-E5',
      '390 px: kein zusätzlicher Überlauf durch das TOC (Ausgangswert 540 px)',
      mobileState.asideScrollWidth <= mobileState.asideClientWidth + 1 && mobileState.docScrollWidth <= 540,
      mobileState
    );
    await mobilePage.screenshot({ path: join(OUT, '390-zu.png') });
    shots.push('390-zu.png');

    await mobilePage.click('.page-toc__summary');
    await mobilePage.waitForTimeout(200);
    const opened = await mobilePage.evaluate(() => {
      const details = document.querySelector('[data-toc-details]');
      const body = document.querySelector('[data-toc-body]');
      return {
        open: details.open,
        bodyHeight: body.getBoundingClientRect().height,
        bodyOverflow: body.scrollHeight > body.clientHeight + 1,
        docScrollWidth: document.documentElement.scrollWidth,
      };
    });
    check(
      'AK-E4c',
      '390 px: Summary öffnet die Liste, eigener Scrollbereich, kein neuer Überlauf',
      opened.open === true && opened.bodyHeight > 0 && opened.docScrollWidth <= 540,
      opened
    );
    await mobilePage.screenshot({ path: join(OUT, '390-offen.png') });
    shots.push('390-offen.png');

    // Klick im offenen Panel: Panel schließt vor dem Sprung, Ziel sitzt richtig.
    await mobilePage.click('.page-toc__link[href="#11-hinweise-für-ui-und-audio-engine"]');
    await waitForAnchor(mobilePage, '11-hinweise-für-ui-und-audio-engine');
    const mobileJump = await mobilePage.evaluate(() => ({
      open: document.querySelector('[data-toc-details]').open,
      top: document.getElementById('11-hinweise-für-ui-und-audio-engine').getBoundingClientRect().top,
      header: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
    }));
    check(
      'AK-G2',
      'Klick auf Mobil: Panel zu, Ziel unter dem Header',
      mobileJump.open === false && mobileJump.top >= mobileJump.header && mobileJump.top <= mobileJump.header + 40,
      mobileJump
    );
    await mobilePage.screenshot({ path: join(OUT, '390-nach-klick.png') });
    shots.push('390-nach-klick.png');
    check('AK-H4c', 'keine Konsolenfehler auf Mobil', mobileErrors.length === 0, mobileErrors.slice(0, 5));
    await mobile.close();

    /* ------------------------------ 320 px ------------------------------- */
    const narrow = await browser.newContext({ viewport: { width: 320, height: 640 }, hasTouch: true });
    const { page: narrowPage } = await openPilot(narrow, { width: 320, height: 640 });
    const narrowState = await narrowPage.evaluate(() => {
      const summary = document.querySelector('.page-toc__summary');
      const aside = document.querySelector('aside.page-toc');
      return {
        summaryHeight: summary.getBoundingClientRect().height,
        asideScrollWidth: aside.scrollWidth,
        asideClientWidth: aside.clientWidth,
        docScrollWidth: document.documentElement.scrollWidth,
      };
    });
    metrics.narrow = narrowState;
    check(
      'AK-E7',
      '320 px: TOC ohne Clipping und ohne eigenen Überlauf',
      narrowState.asideScrollWidth <= narrowState.asideClientWidth + 1 && narrowState.summaryHeight >= 44,
      narrowState
    );
    await narrow.close();

    /* ------------------------------ No-JS -------------------------------- */
    const noJs = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const noJsPage = await noJs.newPage();
    await noJsPage.goto(`${process.env.TOC_BASE_URL}${PILOT}`, { waitUntil: 'load' });
    const noJsState = await noJsPage.evaluate(() => ({
      links: document.querySelectorAll('.page-toc__link').length,
      open: document.querySelector('[data-toc-details]').open,
      current: document.querySelectorAll('.page-toc [aria-current]').length,
    }));
    check('AK-G1', 'ohne JavaScript: alle 29 Links im HTML', noJsState.links === 29, noJsState);
    check(
      'AK-G3',
      'ohne JavaScript: details offen, kein aria-current',
      noJsState.open === true && noJsState.current === 0,
      noJsState
    );
    await noJsPage.click('.page-toc__link[href="#4-datenschema"]');
    await noJsPage.waitForTimeout(400);
    const noJsJump = await noJsPage.evaluate(() => ({
      hash: decodeURIComponent(window.location.hash),
      top: document.getElementById('4-datenschema').getBoundingClientRect().top,
    }));
    check(
      'AK-G2b',
      'ohne JavaScript: Ankerlink springt korrekt',
      noJsJump.hash === '#4-datenschema' && noJsJump.top >= 40,
      noJsJump
    );
    await noJsPage.screenshot({ path: join(OUT, '390-nojs.png') });
    shots.push('390-nojs.png');
    await noJs.close();

    /* ------------------------------ Übersicht ---------------------------- */
    const report = {
      generatedAt: new Date().toISOString(),
      dist: DIST,
      pilot: PILOT,
      metrics,
      screenshots: shots,
      checks,
      summary: {
        total: checks.length,
        passed: checks.filter((entry) => entry.ok).length,
        failed: checks.filter((entry) => !entry.ok).length,
      },
    };
    writeFileSync(join(OUT, 'browser-check.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`\n${report.summary.passed}/${report.summary.total} Browser-Prüfungen bestanden`);
    console.log(`Bericht: ${join(OUT, 'browser-check.json')}`);
    process.exitCode = report.summary.failed === 0 ? 0 : 1;
  } finally {
    await browser.close();
    server.close();
  }
};

await main();
