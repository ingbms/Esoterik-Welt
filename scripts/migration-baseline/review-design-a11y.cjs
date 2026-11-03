'use strict';
// Unabhaengige Usability- und Barrierefreiheitspruefung der ausgelieferten Baseline.
// Gehoert zur Karte "Design-Katalog auf Usability und Barrierefreiheit pruefen".
//
//   node scripts/migration-baseline/review-design-a11y.cjs [--quick]
//
// Das Skript benutzt bewusst NICHT measure-design.cjs: eigener Statikserver, eigene
// Kontrast-, Fokus-, Zielgroessen- und Reflow-Messung. Ergebnis:
//   docs/migration-baseline/evidence/design-review/a11y-messung.json
//   docs/migration-baseline/evidence/design-review/*.png
//
// Grundsaetze der Messung:
//  - Kontrast wird aus gerenderten Computed Styles berechnet, nicht aus Token-Werten.
//    Flaechen mit background-image (Verlaeufe) werden als "ungeprueft" markiert, nicht geschaetzt.
//  - Ein Fokusring gilt nur als vorhanden, wenn outline oder box-shadow am fokussierten
//    Element tatsaechlich gesetzt ist (per Tastatur erreicht, also :focus-visible-Pfad).
//  - Zielgroessen werden nach WCAG 2.5.8 (24x24) und 2.5.5 (44x44) getrennt gezaehlt;
//    Inline-Links im Fliesstext sind nach der Inline-Ausnahme ausgenommen und werden separat gezaehlt.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'design-review');
const PREFIX = '/Esoterik-Welt';
const QUICK = process.argv.includes('--quick');

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

const MAIN_PAGES = [
  ['home', ''],
  ['tarot', '#tarot'],
  ['crystals', '#crystals'],
  ['moon', '#moon'],
  ['astrologie', '#astrologie'],
  ['frequenzen', '#frequenzen'],
  ['runes', '#runes'],
  ['pendeln', '#pendeln'],
  ['farbwelten', '#farbwelten'],
  ['blog', '#blog'],
];

const FARBWELTEN = [
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
  'lichtmedizin',
  'farbpsychologie',
  'farbtherapie',
];

const DOCS = [
  'impressum.html',
  'datenschutz.html',
  'haftung.html',
  'radiasthesie/index.html',
  'radiasthesie/radiasthesie.html',
  'radiasthesie/pendeln.html',
  'radiasthesie/orakel.html',
  'radiasthesie/glossar.html',
  'radiasthesie/quellen.html',
  'radiasthesie/methodik.html',
];

const PENDELN_SUB = [
  ['pendeln-studio', '#pendeln/studio'],
  ['pendeln-journal', '#pendeln/journal'],
  ['pendeln-labor', '#pendeln/labor'],
  ['pendeln-experiment', '#pendeln/experiment'],
  ['pendeln-glossar', '#pendeln/glossar'],
  ['pendeln-quellen', '#pendeln/quellen'],
  ['pendeln-methodik', '#pendeln/methodik'],
];

const ROUTES = [
  ...MAIN_PAGES.map(([id, hash]) => ({ id, url: hash, kind: 'spa' })),
  ...PENDELN_SUB.map(([id, hash]) => ({ id, url: hash, kind: 'spa' })),
  ...FARBWELTEN.map((name) => ({ id: `fw-${name}`, url: `#farbwelten/${name}`, kind: 'farbwelt' })),
  ...DOCS.map((doc) => ({ id: `doc-${doc.replace(/[\\/.]/g, '-')}`, url: doc, kind: 'doc' })),
];

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

// ---------------------------------------------------------------- Seitenmessung

const PAGE_PROBE = () => {
  const parse = (value) => {
    const match = String(value).match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  };
  const over = (src, dst) => {
    const a = src[3] === undefined ? 1 : src[3];
    return [src[0] * a + dst[0] * (1 - a), src[1] * a + dst[1] * (1 - a), src[2] * a + dst[2] * (1 - a), 1];
  };
  const lum = (rgb) => {
    const channel = (part) => {
      const c = part / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  };
  const ratio = (a, b) => {
    const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  };
  const css = (el) => getComputedStyle(el);
  const label = (el) => {
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '';
    const id = el.id ? `#${el.id}` : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };
  const visible = (el) => {
    if (!el.getClientRects().length) return false;
    // checkVisibility erkennt auch content-visibility:hidden (geschlossene <details>):
    // solche Inhalte haben ein Layout-Rechteck, werden aber nicht gerendert.
    if (typeof el.checkVisibility === 'function') {
      return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true });
    }
    const style = css(el);
    if (style.visibility === 'hidden' || Number(style.opacity) < 0.05) return false;
    return true;
  };
  const backgroundOf = (el) => {
    const chain = [];
    let node = el;
    while (node && node.nodeType === 1) {
      chain.push(node);
      node = node.parentElement;
    }
    let acc = [255, 255, 255, 1];
    let image = null;
    for (let index = chain.length - 1; index >= 0; index -= 1) {
      const style = css(chain[index]);
      if (style.backgroundImage && style.backgroundImage !== 'none' && !image) {
        image = label(chain[index]);
      }
      const bg = parse(style.backgroundColor);
      if (bg) acc = over(bg, acc);
    }
    return { rgb: acc, image };
  };

  // ---- Kontrast aller sichtbaren Textknoten
  const failures = [];
  const uncertain = [];
  const seen = new Map();
  let textNodes = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeValue && node.nodeValue.trim().length > 1 && node.parentElement
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const textParents = new Set();
  while (walker.nextNode()) textParents.add(walker.currentNode.parentElement);
  for (const el of textParents) {
    if (!visible(el)) continue;
    const text = [...el.childNodes]
      .filter((node) => node.nodeType === 3)
      .map((node) => node.nodeValue.trim())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || text === '·' || text === '—' || text === '–' || text.length < 2) continue;
    textNodes += 1;
    const style = css(el);
    const fgRaw = parse(style.color);
    if (!fgRaw) continue;
    const bg = backgroundOf(el);
    const fg = over(fgRaw, bg.rgb);
    const value = ratio(fg, bg.rgb);
    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = large ? 3 : 4.5;
    const item = {
      selector: label(el),
      text: text.slice(0, 70),
      fg: `rgb(${fg.map((part) => Math.round(part)).join(',')})`,
      bg: `rgb(${bg.rgb.map((part) => Math.round(part)).join(',')})`,
      ratio: value,
      required,
      fontSize: style.fontSize,
      weight,
      opacity: style.opacity,
    };
    if (bg.image || bg.image === '') {
      // Verlauf/Hintergrundbild: kein belastbarer Flaechenwert.
      uncertain.push({ ...item, reason: `background-image an ${bg.image || 'Vorfahre'}` });
      continue;
    }
    const key = `${item.fg}|${item.bg}|${item.ratio}|${required}`;
    if (!seen.has(key)) seen.set(key, { ...item, count: 0, samples: [] });
    const group = seen.get(key);
    group.count += 1;
    if (group.samples.length < 3) group.samples.push(item.text.slice(0, 40));
    if (value + 0.001 < required) failures.push(item);
  }

  // ---- Zielgroessen (nur bei schmalen Viewports sinnvoll, hier immer erhoben)
  const targetSelectors =
    'a[href], button, [role="button"], select, input:not([type="hidden"]), textarea, summary, [tabindex]:not([tabindex="-1"])';
  const targets = [];
  const inlineExempt = [];
  for (const el of document.querySelectorAll(targetSelectors)) {
    if (!visible(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const style = css(el);
    // Wirksame Trefferflaeche: umschliessendes Label oder Labelflaeche vergroessert das Ziel.
    const labelEl = el.closest('label');
    const labelRect = labelEl ? labelEl.getBoundingClientRect() : null;
    const effective =
      labelRect && labelRect.width > 0
        ? {
            w: labelRect.width,
            h: labelRect.height,
            via: 'label',
          }
        : { w: rect.width, h: rect.height, via: 'element' };
    const data = {
      selector: label(el),
      text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
      w: Math.round(effective.w * 10) / 10,
      h: Math.round(effective.h * 10) / 10,
      elementW: Math.round(rect.width * 10) / 10,
      elementH: Math.round(rect.height * 10) / 10,
      via: effective.via,
      display: style.display,
    };
    if (el.tagName === 'A' && style.display === 'inline' && rect.height <= 24) {
      inlineExempt.push(data);
      continue;
    }
    if (effective.w < 24 || effective.h < 24) targets.push({ ...data, rule: '2.5.8' });
    else if (effective.w < 44 || effective.h < 44) targets.push({ ...data, rule: '2.5.5' });
  }

  // ---- Bilder und dekorative SVGs
  const images = [...document.images].filter(visible).map((img) => ({
    src: img.currentSrc || img.getAttribute('src'),
    alt: img.hasAttribute('alt') ? img.getAttribute('alt') : null,
    width: img.getBoundingClientRect().width,
    height: img.getBoundingClientRect().height,
  }));
  const svgs = [...document.querySelectorAll('svg')].filter(visible);
  const svgUnlabelled = svgs
    .filter(
      (svg) =>
        !svg.hasAttribute('aria-hidden') &&
        !svg.getAttribute('role') &&
        !svg.querySelector('title') &&
        !svg.getAttribute('aria-label')
    )
    .map((svg) => label(svg));

  // ---- Formularelemente ohne zugaenglichen Namen
  const controls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter(visible);
  const controlsWithoutName = controls
    .filter((control) => {
      if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return false;
      if (control.id) {
        const explicit = document.querySelector(`label[for="${CSS.escape(control.id)}"]`);
        if (explicit) return false;
      }
      return !control.closest('label');
    })
    .map((control) => label(control));

  // ---- Struktur
  const visiblePages = [...document.querySelectorAll('.page')].filter((section) => !section.hidden);
  const scope = visiblePages[0] || document.querySelector('main') || document.body;
  const headings = [...scope.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((heading) => ({
    tag: heading.tagName,
    text: heading.textContent.replace(/\s+/g, ' ').trim().slice(0, 60),
  }));
  const levels = headings.map((heading) => Number(heading.tag.slice(1)));
  const skips = [];
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] - levels[index - 1] > 1) {
      skips.push(
        `${headings[index - 1].tag} ${headings[index - 1].text} -> ${headings[index].tag} ${headings[index].text}`
      );
    }
  }
  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

  // ---- Platzhaltertexte: eigener Farbwert, eigene Kontrastanforderung
  const placeholders = [];
  for (const control of controls) {
    const style = css(control, '::placeholder');
    const placeholder = (control.getAttribute('placeholder') || '').trim();
    if (!placeholder || !style) continue;
    const fgRaw = parse(style.color);
    if (!fgRaw) continue;
    const bg = backgroundOf(control);
    if (bg.image) continue;
    const fg = over(fgRaw, bg.rgb);
    const value = ratio(fg, bg.rgb);
    if (value + 0.001 < 4.5) {
      placeholders.push({ selector: label(control), text: placeholder.slice(0, 40), ratio: value, color: style.color });
    }
  }

  return {
    title: document.title,
    lang: document.documentElement.getAttribute('lang'),
    activePages: visiblePages.map((page) => page.id),
    h1: scope.querySelector('h1')
      ? scope.querySelector('h1').textContent.replace(/\s+/g, ' ').trim().slice(0, 80)
      : null,
    textLength: (scope.innerText || '').trim().length,
    h2Count: scope.querySelectorAll('h2').length,
    docOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    containers: [...document.querySelectorAll('main, .container, .card, .feature-card, .astro-badge, .nav, .modal')]
      .filter(visible)
      .map((el) => ({ selector: label(el), scroll: el.scrollWidth, client: el.clientWidth }))
      .filter((item) => item.scroll > item.client + 1),
    textNodes,
    contrast: {
      failures: failures.sort((a, b) => a.ratio - b.ratio),
      groups: [...seen.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 40),
      uncertain: uncertain.slice(0, 10),
      uncertainCount: uncertain.length,
    },
    targets: {
      violations: targets.filter((item) => item.rule === '2.5.8'),
      below44: targets.filter((item) => item.rule === '2.5.5'),
      inlineExempt: inlineExempt.length,
    },
    images: {
      total: images.length,
      missingAlt: images.filter((image) => image.alt === null),
      emptyAlt: images.filter((image) => image.alt === ''),
    },
    placeholders,
    svgUnlabelled,
    controls: { total: controls.length, withoutName: controlsWithoutName },
    headings: { level1: headings.filter((heading) => heading.tag === 'H1').length, skips },
    duplicateIds,
    tooltips: document.querySelectorAll('[data-tooltip]').length,
    liveRegions: document.querySelectorAll('[aria-live], [role="status"], [role="alert"]').length,
    landmarks: {
      main: document.querySelectorAll('main').length,
      nav: document.querySelectorAll('nav').length,
    },
  };
};

async function probeRoute(browser, base, route, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 200));
  });
  page.on('pageerror', (error) => errors.push(`pageerror ${error.message}`.slice(0, 200)));
  const url = `${base}${route.url}`;
  await page.goto(url, { waitUntil: 'load' });
  // SPA-Routen und Module brauchen einen Moment; auf stabile Seite warten statt blind zu schlafen.
  await page.waitForTimeout(route.kind === 'spa' || route.kind === 'farbwelt' ? 1200 : 350);
  let data = null;
  let error = null;
  try {
    data = await page.evaluate(PAGE_PROBE);
  } catch (probeError) {
    error = probeError.message;
  }
  await context.close();
  return { route: route.id, url: route.url, viewport: viewport.name, data, error, consoleErrors: errors };
}

// ---------------------------------------------------------------- Interaktionen

async function interactions(browser, base) {
  const result = {};
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Sprunglink mit echtem Enter aktivieren.
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(150);
  const skipFocus = await page.evaluate(() => {
    const active = document.activeElement;
    const skip = document.querySelector('.skip-link');
    return {
      focused: active === skip,
      activeTag: active ? active.tagName : null,
      activeClass: active ? String(active.className).slice(0, 60) : null,
      text: skip ? skip.textContent.trim() : null,
      href: skip ? skip.getAttribute('href') : null,
      outline: skip ? getComputedStyle(skip).outline : null,
      transform: skip ? getComputedStyle(skip).transform : null,
    };
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const afterSkip = await page.evaluate(() => {
    const active = document.activeElement;
    const visible = [...document.querySelectorAll('.page')].filter((section) => !section.hidden);
    const main = document.querySelector('main');
    return {
      activeTag: active ? active.tagName : null,
      activeId: active ? active.id : null,
      hash: location.hash,
      visiblePages: visible.map((section) => section.id),
      mainTextLength: main ? main.innerText.trim().length : 0,
      mainHeight: main ? Math.round(main.getBoundingClientRect().height) : 0,
      scrollY: Math.round(window.scrollY),
      h1Visible: (() => {
        const heading = document.querySelector('.page:not([hidden]) h1, main h1');
        if (!heading) return null;
        const rect = heading.getBoundingClientRect();
        const header = document.querySelector('header');
        const headerRect = header ? header.getBoundingClientRect() : { bottom: 0 };
        return {
          text: heading.textContent.trim().slice(0, 50),
          top: Math.round(rect.top),
          hiddenBehindHeader: rect.top < headerRect.bottom - 1,
        };
      })(),
    };
  });
  await page.screenshot({ path: path.join(OUT, 'skiplink-nach-enter-1440.png') });
  result.skipLink = { beforeEnter: skipFocus, afterEnter: afterSkip };

  // Zustandskontraste (Ruhe und Hover) auf derselben Seite.
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  result.states = await stateContrasts(page);

  // Autoritative Farbwelten-Routen aus dem Register lesen (keine geratenen Slugs).
  await page.goto(`${base}#farbwelten`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  result.farbweltenRegister = await page.evaluate(() =>
    [...document.querySelectorAll('.fw-register__link')].map((link) => ({
      href: link.getAttribute('href'),
      text: link.textContent.replace(/\s+/g, ' ').trim().slice(0, 60),
    }))
  );

  // Tastaturfokus auf einer interaktionsreichen Seite: welcher Schritt hat einen sichtbaren Ring?
  await page.goto(`${base}#frequenzen`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const steps = [];
  for (let index = 0; index < (QUICK ? 18 : 36); index += 1) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(60);
    const step = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || active === document.body) return { tag: 'BODY', visible: false };
      const style = getComputedStyle(active);
      const outlineWidth = parseFloat(style.outlineWidth) || 0;
      return {
        tag: active.tagName,
        id: active.id || null,
        cls: String(active.className || '')
          .split(/\s+/)
          .slice(0, 2)
          .join('.'),
        text: (active.getAttribute('aria-label') || active.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
        boxShadow: style.boxShadow,
        visible: (style.outlineStyle !== 'none' && outlineWidth >= 1) || style.boxShadow !== 'none',
        rect: (() => {
          const rect = active.getBoundingClientRect();
          return { w: Math.round(rect.width), h: Math.round(rect.height) };
        })(),
      };
    });
    steps.push(step);
  }
  result.focusTraversal = {
    steps: steps.length,
    withoutIndicator: steps.filter((step) => step.visible === false),
  };

  // Tarot-Dialog: Rolle, Fokusfalle, Escape, Zielgroesse.
  await page.goto(`${base}#tarot`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  const trigger = await page.evaluate(() => {
    const card = document.querySelector('#tarotGrid .tarot-card');
    if (!card) return null;
    card.focus();
    const before = { focused: document.activeElement === card, tag: card.tagName, id: card.id || null };
    card.click();
    return before;
  });
  await page.waitForTimeout(700);
  const modalOpen = await page.evaluate(() => {
    const backdrop = document.querySelector('.modal-backdrop');
    const dialog = backdrop ? backdrop.querySelector('.modal') : null;
    const close = backdrop ? backdrop.querySelector('.modal-close') : null;
    const rect = close ? close.getBoundingClientRect() : null;
    return {
      present: Boolean(backdrop),
      open: backdrop ? backdrop.classList.contains('open') : false,
      role: backdrop ? backdrop.getAttribute('role') : null,
      ariaModal: backdrop ? backdrop.getAttribute('aria-modal') : null,
      ariaLabelledby: backdrop ? backdrop.getAttribute('aria-labelledby') || backdrop.getAttribute('aria-label') : null,
      focusInside: dialog ? dialog.contains(document.activeElement) : false,
      closeSize: rect ? { w: Math.round(rect.width), h: Math.round(rect.height) } : null,
      backgroundInert: [...document.body.children].filter(
        (child) => !child.classList.contains('modal-backdrop') && child.getAttribute('aria-hidden') === 'true'
      ).length,
    };
  });
  const trap = [];
  for (let index = 0; index < 14; index += 1) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);
    const inside = await page.evaluate(() => {
      const backdrop = document.querySelector('.modal-backdrop');
      return backdrop ? backdrop.contains(document.activeElement) : false;
    });
    trap.push(inside);
  }
  await page.screenshot({ path: path.join(OUT, 'modal-fokus-1440.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const modalClosed = await page.evaluate(() => {
    const backdrop = document.querySelector('.modal-backdrop');
    return backdrop ? !backdrop.classList.contains('open') : null;
  });
  result.modal = {
    open: modalOpen,
    focusTrapStays: trap.filter(Boolean).length,
    focusTrapSteps: trap.length,
    closedWithEscape: modalClosed,
    trigger,
    focusAfterClose: await page.evaluate((triggerInfo) => {
      const active = document.activeElement;
      return {
        tag: active ? active.tagName : null,
        id: active ? active.id || null : null,
        isTrigger: Boolean(triggerInfo) && active ? active.matches('.tarot-card') : false,
        insideTarotGrid: active ? Boolean(active.closest('#tarotGrid')) : false,
      };
    }, trigger),
  };

  // Reduced Motion: bleiben Animationen aktiv?
  const rmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(`${base}#frequenzen`, { waitUntil: 'load' });
  await rmPage.waitForTimeout(1500);
  const reduced = await rmPage.evaluate(() => {
    const animations = document.getAnimations ? document.getAnimations() : [];
    const longRuns = animations
      .map((animation) => ({
        name: animation.animationName || (animation.effect && animation.effect.getTiming().duration) || 'unbekannt',
        duration: animation.effect ? animation.effect.getTiming().duration : 0,
        playState: animation.playState,
      }))
      .filter((animation) => Number(animation.duration) > 100);
    const animated = [...document.querySelectorAll('.animate, .stagger, .hero-title, .card')].slice(0, 5).map((el) => ({
      selector: el.className.toString().split(/\s+/).slice(0, 2).join('.'),
      animation: getComputedStyle(el).animationName,
      animationDuration: getComputedStyle(el).animationDuration,
      transition: getComputedStyle(el).transitionDuration,
    }));
    return { mediaQuery: matchMedia('(prefers-reduced-motion: reduce)').matches, longRuns, animated };
  });
  await rmContext.close();
  result.reducedMotion = reduced;

  await context.close();

  // Fehler- und Deaktiviertzustand an Formularfeldern (Pendeltafel-Studio + Journal).
  const formContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const formPage = await formContext.newPage();
  const formErrors = [];
  formPage.on('pageerror', (error) => formErrors.push(error.message));
  await formPage.goto(`${base}#pendeln/studio`, { waitUntil: 'load' });
  await formPage.waitForTimeout(4000);
  const formProbe = await formPage.evaluate(() => {
    const cssRuleSearch = () => {
      const matches = [];
      for (const sheet of document.styleSheets) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch (error) {
          continue;
        }
        const walk = (list) => {
          for (const rule of list) {
            if (rule.cssRules) walk(rule.cssRules);
            const selector = rule.selectorText || '';
            if (/:invalid|\[aria-invalid|\.is-error|:user-invalid/.test(selector)) matches.push(selector);
          }
        };
        walk(rules);
      }
      return [...new Set(matches)];
    };
    const labels = (el) => {
      const cls =
        typeof el.className === 'string' && el.className.trim()
          ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
          : '';
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls}`;
    };
    const studio = document.querySelector('#pendeltafelStudio');
    const journal = document.querySelector('#pendelJournal');
    const inputs = [
      ...document.querySelectorAll(
        '#pendeltafelStudio input, #pendelJournal input, #pendeltafelStudio select, #pendeltafelStudio textarea'
      ),
    ].filter((el) => el.getClientRects().length);
    const fields = inputs.slice(0, 8).map((el) => ({
      selector: labels(el),
      type: el.type || el.tagName,
      hasAriaInvalid: el.hasAttribute('aria-invalid'),
      border: getComputedStyle(el).borderColor,
      outline: getComputedStyle(el).outline,
    }));
    const emptyRequired = [...document.querySelectorAll('input[required], select[required], textarea[required]')]
      .length;
    return {
      errorRules: cssRuleSearch(),
      studioPresent: Boolean(studio),
      journalPresent: Boolean(journal),
      fieldCount: inputs.length,
      fields,
      emptyRequired,
      alertsVisible: [...document.querySelectorAll('[role="alert"], .ptf-error, .journal-error, [aria-live]')]
        .filter((el) => el.getClientRects().length && el.textContent.trim())
        .map((el) => `${labels(el)}: ${el.textContent.trim().slice(0, 80)}`),
      disabledButtons: [...document.querySelectorAll('button:disabled')]
        .filter((el) => el.getClientRects().length)
        .map((el) => labels(el)),
      disabledButtonStyle: (() => {
        const button = document.querySelector('button:disabled');
        if (!button) return null;
        const style = getComputedStyle(button);
        return { opacity: style.opacity, cursor: style.cursor, borderColor: style.borderColor, color: style.color };
      })(),
    };
  });

  // Invalid-Zustand wirklich ausloesen: Ueberschrift leeren, Ausgabe anfordern.
  const invalidTest = await formPage.evaluate(() => {
    const container = document.querySelector('#pendeltafelStudio');
    if (!container) return { available: false, reason: 'Studio fehlt' };
    const input = container.querySelector('#ptfTitle');
    const trigger = container.querySelector('#ptfDownloadSvg');
    if (!input || !trigger) return { available: false, reason: 'Eingabe oder Ausgabe-Knopf fehlt' };
    const before = {
      border: getComputedStyle(input).borderColor,
      outline: getComputedStyle(input).outline,
      shadow: getComputedStyle(input).boxShadow,
      ariaInvalid: input.getAttribute('aria-invalid'),
    };
    input.focus();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    trigger.click();
    return {
      available: true,
      selector: '#ptfTitle',
      before,
      submitText: trigger.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
    };
  });
  if (invalidTest.available) {
    await formPage.waitForTimeout(700);
    invalidTest.after = await formPage.evaluate(() => {
      const active = document.activeElement;
      const input = document.querySelector('#ptfTitle') || document.querySelector('[aria-invalid="true"]');
      const message = [...document.querySelectorAll('[role="alert"], [aria-live]')]
        .filter((el) => el.getClientRects().length && el.textContent.trim())
        .map((el) => el.textContent.trim().slice(0, 120));
      const outlineWhileFocused = input ? getComputedStyle(input).outline : null;
      // Fokus entfernen: danach zeigt sich, ob der Fehlerzustand selbst (border-color) wirkt.
      if (input) input.blur();
      const borderAfterBlur = input ? getComputedStyle(input).borderColor : null;
      const describedBy = input ? input.getAttribute('aria-describedby') : null;
      const errorIds = [...document.querySelectorAll('[role="alert"]')].map((el) => el.id).filter(Boolean);
      return {
        focusedSelector: active ? `${active.tagName.toLowerCase()}#${active.id || ''}` : null,
        ariaInvalid: input ? input.getAttribute('aria-invalid') : null,
        border: input ? getComputedStyle(input).borderColor : null,
        borderAfterBlur,
        outlineWhileFocused,
        describedBy,
        errorIds,
        errorLinkedToField: Boolean(describedBy) && errorIds.some((id) => describedBy.split(/\s+/).includes(id)),
        liveMessages: message,
      };
    });
    await formPage.screenshot({ path: path.join(OUT, 'formular-fehler-1440.png') });
  }
  result.forms = { staticProbe: formProbe, invalidTest, pageErrors: formErrors };

  // Journal separat: hat es denselben Fehlerzustand und eine sichtbare Rueckmeldung?
  await formPage.goto(`${base}#pendeln/journal`, { waitUntil: 'load' });
  await formPage.waitForTimeout(4000);
  result.forms.journal = await formPage.evaluate(() => {
    const container = document.querySelector('#pendelJournal');
    if (!container) return { present: false };
    const field = container.querySelector(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea'
    );
    const buttons = [...container.querySelectorAll('button')].filter((el) => el.getClientRects().length);
    return {
      present: true,
      field: field ? { selector: `${field.tagName.toLowerCase()}#${field.id || ''}`, type: field.type } : null,
      buttons: buttons.map((el) => el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)),
      ariaInvalidStyle: field
        ? (() => {
            field.setAttribute('aria-invalid', 'true');
            const style = getComputedStyle(field);
            return { borderColor: style.borderColor, outline: style.outline, boxShadow: style.boxShadow };
          })()
        : null,
    };
  });
  await formPage.screenshot({ path: path.join(OUT, 'journal-unterbereich-1440.png') });

  // Mobile Navigation und Zielgroessen bei 320px.
  const mobileContext = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(base, { waitUntil: 'load' });
  await mobilePage.waitForTimeout(600);
  result.mobile = await mobilePage.evaluate(() => {
    const toggle = document.querySelector('.nav-toggle');
    const rect = toggle ? toggle.getBoundingClientRect() : null;
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      toggleSize: rect ? { w: Math.round(rect.width), h: Math.round(rect.height) } : null,
    };
  });
  await mobilePage.evaluate(() => document.querySelector('.nav-toggle')?.click());
  await mobilePage.waitForTimeout(400);
  result.mobile.navOpen = await mobilePage.evaluate(() => {
    const nav = document.querySelector('.nav');
    const link = document.querySelector('.nav-link');
    const rect = link ? link.getBoundingClientRect() : null;
    return {
      open: nav ? nav.classList.contains('open') : false,
      firstLink: rect ? { w: Math.round(rect.width), h: Math.round(rect.height) } : null,
    };
  });
  await mobilePage.screenshot({ path: path.join(OUT, 'nav-320.png') });
  await mobileContext.close();

  return result;
}

// ---------------------------------------------------------------- Zustandskontraste

function parseRgb(value) {
  const match = String(value).match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
}

function contrastRatio(foreground, background) {
  const luminance = (rgb) => {
    const channel = (part) => {
      const c = part / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  };
  const a = luminance(foreground);
  const b = luminance(background);
  const [high, low] = a > b ? [a, b] : [b, a];
  return Math.round(((high + 0.05) / (low + 0.05)) * 100) / 100;
}

async function stateContrasts(page) {
  const selectors = ['.btn-primary', '.btn-secondary', '.btn-ghost', '.nav-link', '.feature-card', '.card'];
  const results = [];
  for (const selector of selectors) {
    const found = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el || !el.getClientRects().length) return null;
      const style = getComputedStyle(el);
      const chain = [];
      let node = el;
      while (node && node.nodeType === 1) {
        chain.push(node);
        node = node.parentElement;
      }
      let bg = [11, 16, 18];
      for (let index = chain.length - 1; index >= 0; index -= 1) {
        const bgColor = parseRgba(getComputedStyle(chain[index]).backgroundColor);
        if (bgColor && bgColor[3] > 0) {
          bg = [
            bgColor[0] * bgColor[3] + bg[0] * (1 - bgColor[3]),
            bgColor[1] * bgColor[3] + bg[1] * (1 - bgColor[3]),
            bgColor[2] * bgColor[3] + bg[2] * (1 - bgColor[3]),
          ];
        }
      }
      function parseRgba(value) {
        const match = String(value).match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1]
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number);
        return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
      }
      return {
        color: style.color,
        background: `rgb(${bg.map((part) => Math.round(part)).join(',')})`,
        fontSize: style.fontSize,
        weight: style.fontWeight,
      };
    }, selector);
    if (!found) continue;
    const normal = {
      ...found,
      ratio: contrastRatio(parseRgb(found.color), parseRgb(found.background)),
    };
    let hovered = null;
    try {
      if (await page.isVisible(selector).catch(() => false)) {
        await page.hover(selector, { timeout: 1500 });
        await page.waitForTimeout(300);
        hovered = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          const style = getComputedStyle(el);
          const chain = [];
          let node = el;
          while (node && node.nodeType === 1) {
            chain.push(node);
            node = node.parentElement;
          }
          let bg = [11, 16, 18];
          for (let index = chain.length - 1; index >= 0; index -= 1) {
            const raw = String(getComputedStyle(chain[index]).backgroundColor).match(/rgba?\(([^)]+)\)/);
            if (!raw) continue;
            const parts = raw[1]
              .split(/[\s,/]+/)
              .filter(Boolean)
              .map(Number);
            const alpha = parts.length > 3 ? parts[3] : 1;
            if (!alpha) continue;
            bg = [
              parts[0] * alpha + bg[0] * (1 - alpha),
              parts[1] * alpha + bg[1] * (1 - alpha),
              parts[2] * alpha + bg[2] * (1 - alpha),
            ];
          }
          return {
            color: style.color,
            background: `rgb(${bg.map((part) => Math.round(part)).join(',')})`,
          };
        }, selector);
        hovered.ratio = contrastRatio(parseRgb(hovered.color), parseRgb(hovered.background));
      }
    } catch (error) {
      hovered = { error: error.message.slice(0, 80) };
    }
    results.push({ selector, normal, hover: hovered });
  }
  return results;
}

// ---------------------------------------------------------------- Selbsttest der Messlogik

async function selfTest(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const low = document.createElement('p');
    low.id = 'negcontrast';
    low.textContent = 'Negativkontrolle Kontrast';
    low.style.cssText = 'color:#151c1f;background-color:#0b1012;font-size:16px;margin:0';
    document.body.append(low);

    const small = document.createElement('button');
    small.id = 'negtarget';
    small.type = 'button';
    small.textContent = 'X';
    small.style.cssText = 'width:12px;height:12px;min-height:0;padding:0;border:0';
    document.body.append(small);

    const noRing = document.createElement('button');
    noRing.id = 'negfocus';
    noRing.type = 'button';
    noRing.textContent = 'ohne Ring';
    noRing.style.cssText = 'outline:none;box-shadow:none';
    document.body.append(noRing);

    const gradient = document.createElement('div');
    gradient.id = 'neggradient';
    gradient.style.cssText = 'background-image:linear-gradient(90deg,#0b1012,#c6b38e);padding:8px';
    const gradientText = document.createElement('span');
    gradientText.textContent = 'Text auf Verlauf';
    gradient.append(gradientText);
    document.body.append(gradient);

    // Geschlossenes <details>: Inhalt hat ein Layout-Rechteck, ist aber nicht gerendert.
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Zu';
    const hiddenButton = document.createElement('button');
    hiddenButton.id = 'neghidden';
    hiddenButton.type = 'button';
    hiddenButton.textContent = 'versteckt';
    hiddenButton.style.cssText = 'width:12px;height:12px;min-height:0;padding:0;border:0';
    const hiddenText = document.createElement('p');
    hiddenText.id = 'neghiddentext';
    hiddenText.textContent = 'Versteckter Text';
    hiddenText.style.cssText = 'color:#151c1f;background-color:#0b1012';
    details.append(summary, hiddenButton, hiddenText);
    document.body.append(details);
  });
  const probe = await page.evaluate(PAGE_PROBE);
  const focusProbe = await page.evaluate(() => {
    const button = document.querySelector('#negfocus');
    button.focus();
    const style = getComputedStyle(button);
    const outlineWidth = parseFloat(style.outlineWidth) || 0;
    return {
      outline: `${style.outlineStyle} ${style.outlineWidth}`,
      boxShadow: style.boxShadow,
      visible: (style.outlineStyle !== 'none' && outlineWidth >= 1) || style.boxShadow !== 'none',
    };
  });
  await context.close();
  const checks = {
    contrastDetectorFindsInjectedFailure: probe.contrast.failures.some((item) => item.selector.includes('negcontrast')),
    targetDetectorFindsInjectedSmallTarget: probe.targets.violations.some((item) =>
      item.selector.includes('negtarget')
    ),
    focusDetectorRejectsInvisibleRing: focusProbe.visible === false,
    gradientDetectorMarksUncertain: probe.contrast.uncertain.some(
      (item) => item.reason.includes('neggradient') || item.selector.includes('neggradient')
    ),
    closedDetailsContentIgnored:
      !probe.targets.violations.some((item) => item.selector.includes('neghidden')) &&
      !probe.contrast.failures.some((item) => item.selector.includes('neghiddentext')),
  };
  return { checks, ok: Object.values(checks).every(Boolean), focusProbe };
}

// ---------------------------------------------------------------- Lauf

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    console.error('playwright fehlt — `npm ci` ausfuehren.');
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}${PREFIX}/`;
  const browser = await chromium.launch();
  if (process.argv.includes('--self-test')) {
    const outcome = await selfTest(browser, base);
    await browser.close();
    server.close();
    console.log(JSON.stringify(outcome, null, 2));
    process.exit(outcome.ok ? 0 : 1);
  }
  const result = {
    generated_at: new Date().toISOString(),
    base,
    head: null,
    routes: [],
    interactions: {},
    errors: [],
  };

  const routes = QUICK ? ROUTES.filter((route) => [...MAIN_PAGES.map(([id]) => id)].includes(route.id)) : ROUTES;
  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '390', width: 390, height: 844 },
  ];
  for (const route of routes) {
    for (const viewport of viewports) {
      try {
        const probe = await probeRoute(browser, base, route, viewport);
        result.routes.push(probe);
        if (probe.consoleErrors.length)
          result.errors.push({ route: route.id, viewport: viewport.name, consoleErrors: probe.consoleErrors });
      } catch (error) {
        result.errors.push({ route: route.id, viewport: viewport.name, error: error.message });
      }
    }
  }

  try {
    result.interactions = await interactions(browser, base);
  } catch (error) {
    result.errors.push({ section: 'interactions', error: error.message });
  }

  // 320px-Reflow fuer die zehn Hauptseiten (WCAG 1.4.10).
  result.reflow320 = [];
  const narrow = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const narrowPage = await narrow.newPage();
  for (const [id, hash] of MAIN_PAGES) {
    await narrowPage.goto(`${base}${hash}`, { waitUntil: 'load' });
    await narrowPage.waitForTimeout(hash ? 1200 : 400);
    const data = await narrowPage.evaluate(() => {
      const offenders = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          if (!rect.width) return false;
          const style = getComputedStyle(el);
          return rect.right > window.innerWidth + 1 && style.position !== 'fixed' && style.visibility !== 'hidden';
        })
        .slice(0, 5)
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${String(el.className || '')
              .split(/\s+/)
              .slice(0, 2)
              .join('.')} right=${Math.round(el.getBoundingClientRect().right)}`
        );
      const inner = [...document.querySelectorAll('.card, .feature-card, .fq-panel, .astro-section, .fw-tafel')]
        .filter((el) => el.getClientRects().length && el.scrollWidth > el.clientWidth + 1)
        .slice(0, 5)
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${String(el.className || '')
              .split(/\s+/)
              .slice(0, 2)
              .join('.')} scroll=${el.scrollWidth} client=${el.clientWidth}`
        );
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        offenders,
        innerOverflow: inner,
      };
    });
    result.reflow320.push({ route: id, ...data });
  }
  await narrowPage.screenshot({ path: path.join(OUT, 'reflow-320.png') });
  await narrow.close();

  await browser.close();
  server.close();

  const summary = {
    generated_at: result.generated_at,
    routes_measured: result.routes.length,
    console_error_routes: result.errors.filter((error) => error.consoleErrors).length,
    contrast_failures: result.routes.reduce(
      (sum, route) => sum + (route.data ? route.data.contrast.failures.length : 0),
      0
    ),
    target_violations: result.routes.reduce(
      (sum, route) => sum + (route.data ? route.data.targets.violations.length : 0),
      0
    ),
    images_without_alt: result.routes.reduce(
      (sum, route) => sum + (route.data ? route.data.images.missingAlt.length : 0),
      0
    ),
    reflow_overflows: result.reflow320.filter((route) => route.overflow).length,
    interaction_errors: result.errors.filter((error) => error.section === 'interactions').length,
    low_text_routes: result.routes
      .filter((route) => route.data && route.data.textLength < 800)
      .map((route) => `${route.route}@${route.viewport}=${route.data.textLength}`),
    missing_h1_routes: result.routes
      .filter((route) => route.data && !route.data.h1)
      .map((route) => `${route.route}@${route.viewport}`),
    state_contrast_below_45: (result.interactions?.states || []).flatMap((item) => {
      const entries = [];
      if (item.normal.ratio < 4.5) entries.push(`${item.selector} ruhe ${item.normal.ratio}`);
      if (item.hover && item.hover.ratio && item.hover.ratio < 4.5)
        entries.push(`${item.selector} hover ${item.hover.ratio}`);
      return entries;
    }),
    placeholder_failures: result.routes.reduce(
      (sum, route) => sum + (route.data ? route.data.placeholders.length : 0),
      0
    ),
    routes_with_heading_skips: result.routes
      .filter((route) => route.data && route.data.headings.skips.length)
      .map((route) => `${route.route}@${route.viewport}`),
    duplicate_id_routes: result.routes
      .filter((route) => route.data && route.data.duplicateIds.length)
      .map((route) => `${route.route}: ${route.data.duplicateIds.join(',')}`),
  };
  fs.writeFileSync(path.join(OUT, 'a11y-messung.json'), `${JSON.stringify({ summary, ...result }, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        focusWithoutIndicator: result.interactions?.focusTraversal?.withoutIndicator?.slice(0, 6) || [],
        skipLink: result.interactions?.skipLink || null,
        forms: result.interactions?.forms?.invalidTest || null,
        reflow: result.reflow320.filter((route) => route.overflow || route.innerOverflow.length),
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
