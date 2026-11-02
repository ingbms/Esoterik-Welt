// Misst die Kopfzeile mit dem zusaetzlichen neunten Navigationsziel und
// fotografiert den Bestand. Jede Breite wird frisch geladen, damit
// media-query-abhaengige var()-Werte sicher neu aufgeloest werden.
//
// Reserve = Innenbreite des .header-inner (ohne Padding)
//           - Summe aller sichtbaren Kindbreiten - Zwischenabstaende.
// Damit zaehlt der Favoritenzaehler mit, den js/modules/crystals.js als
// zusaetzliches Kind in .header-inner haengt.
//
// Aufruf: node docs/farbwelten-konzept/scripts/measure-header.cjs [baseUrl]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base = process.argv[2] || 'http://127.0.0.1:8138/Esoterik-Welt/';
const outDir = path.resolve('docs/farbwelten-konzept/messung');
const shotDir = path.join(outDir, 'bestand');
const widths = [781, 800, 840, 900, 901, 920, 960, 1024, 1120, 1200, 1440];
const label = process.env.FW_LABEL || 'Farben';

async function measure(page, counterText) {
  return page.evaluate((value) => {
    if (value) {
      let counter = document.getElementById('favCounter');
      if (!counter) {
        counter = document.createElement('span');
        counter.id = 'favCounter';
        counter.className = 'badge badge-primary';
        counter.setAttribute('aria-label', 'Anzahl Kristall-Favoriten');
        document.querySelector('.header-inner').appendChild(counter);
      }
      counter.textContent = value;
    }
    const inner = document.querySelector('.header-inner');
    const style = getComputedStyle(inner);
    const padL = parseFloat(style.paddingLeft);
    const padR = parseFloat(style.paddingRight);
    const gap = parseFloat(style.columnGap || style.gap) || 0;
    const children = [...inner.children].filter(
      (el) => el.offsetParent !== null && getComputedStyle(el).position !== 'absolute'
    );
    const widthsOfChildren = children.map((el) => el.getBoundingClientRect().width);
    const used =
      widthsOfChildren.reduce((sum, w) => sum + w, 0) + gap * Math.max(children.length - 1, 0);
    const contentWidth = inner.clientWidth - padL - padR;
    const links = [...document.querySelectorAll('.nav-list .nav-link')];
    const counter = document.getElementById('favCounter');
    const navList = document.querySelector('.nav-list');
    return {
      viewport: window.innerWidth,
      navVisible: getComputedStyle(navList).display !== 'none',
      contentWidth: Math.round(contentWidth * 100) / 100,
      children: children.map((el) => el.className || el.tagName),
      childWidths: widthsOfChildren.map((w) => Math.round(w * 100) / 100),
      gap,
      used: Math.round(used * 100) / 100,
      reserve: Math.round((contentWidth - used) * 100) / 100,
      navLinkFontSize: links.length ? getComputedStyle(links[0]).fontSize : null,
      navGap: getComputedStyle(navList).columnGap,
      logoFontSize: getComputedStyle(document.querySelector('.logo')).fontSize,
      counterText: counter ? counter.textContent : null,
      argSeen: value || null,
      counterWidth: counter ? Math.round(counter.getBoundingClientRect().width * 100) / 100 : 0,
      linkCount: links.length,
      docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

// Jede Funktion ist selbststaendig: Playwright serialisiert nur den Quelltext,
// Referenzen auf Node-Variablen existieren im Browser nicht.
const ninthFn = function (text) {
  const list = document.getElementById('navList');
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = '#farbwelten';
  link.className = 'nav-link';
  link.dataset.page = 'farbwelten';
  link.textContent = text;
  li.appendChild(link);
  list.insertBefore(li, list.lastElementChild);
};

const counterFn = function (text) {
  const list = document.getElementById('navList');
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = '#farbwelten';
  link.className = 'nav-link';
  link.dataset.page = 'farbwelten';
  link.textContent = text;
  li.appendChild(link);
  list.insertBefore(li, list.lastElementChild);
  let counter = document.getElementById('favCounter');
  if (!counter) {
    counter = document.createElement('span');
    counter.id = 'favCounter';
    counter.className = 'badge badge-primary';
    counter.setAttribute('aria-label', 'Anzahl Kristall-Favoriten');
    document.querySelector('.header-inner').appendChild(counter);
  }
  counter.textContent = '♥ 128';
};

const compact1000Fn = function (text) {
  const list = document.getElementById('navList');
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = '#farbwelten';
  link.className = 'nav-link';
  link.dataset.page = 'farbwelten';
  link.textContent = text;
  li.appendChild(link);
  list.insertBefore(li, list.lastElementChild);
  const style = document.createElement('style');
  style.textContent =
    '@media (min-width: 781px) and (max-width: 1000px) {' +
    '.logo { font-size: 22px; } .nav-list { gap: 4px; }' +
    '.nav-link { font-size: 12px; padding: 0; } .header-inner { gap: 12px; } }';
  document.head.appendChild(style);
};

const compact900Fn = function (text) {
  const list = document.getElementById('navList');
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = '#farbwelten';
  link.className = 'nav-link';
  link.dataset.page = 'farbwelten';
  link.textContent = text;
  li.appendChild(link);
  list.insertBefore(li, list.lastElementChild);
  const counter = document.getElementById('favCounter');
  if (counter) counter.textContent = '♥ 128';
  const style = document.createElement('style');
  style.textContent =
    '@media (min-width: 781px) and (max-width: 900px) {' +
    '.logo { font-size: 22px; } .nav-list { gap: 4px; } .header-inner { gap: 12px; }' +
    '#favCounter { margin-left: 0; } }';
  document.head.appendChild(style);
};

const counterOnlyFn = function () {
  let counter = document.getElementById('favCounter');
  if (!counter) {
    counter = document.createElement('span');
    counter.id = 'favCounter';
    counter.className = 'badge badge-primary';
    counter.setAttribute('aria-label', 'Anzahl Kristall-Favoriten');
    document.querySelector('.header-inner').appendChild(counter);
  }
  counter.textContent = '♥ 128';
};

const ninthCounterFn = function (text) {
  const list = document.getElementById('navList');
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = '#farbwelten';
  link.className = 'nav-link';
  link.dataset.page = 'farbwelten';
  link.textContent = text;
  li.appendChild(link);
  list.insertBefore(li, list.lastElementChild);
  let counter = document.getElementById('favCounter');
  if (!counter) {
    counter = document.createElement('span');
    counter.id = 'favCounter';
    counter.className = 'badge badge-primary';
    document.querySelector('.header-inner').appendChild(counter);
  }
  counter.textContent = '♥ 128';
};

async function fresh(page, width, script, counterText) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(base + '?probe=' + width + '-' + Math.random().toString(36).slice(2), {
    waitUntil: 'load',
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  if (script) await page.evaluate(script);
  await page.waitForTimeout(150);
  return measure(page, counterText);
}

(async () => {
  fs.mkdirSync(shotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const results = {
    base,
    label,
    measured_at: new Date().toISOString(),
    withoutNinth: [],
    withNinth: [],
    withNinthCompacted: [],
    counter3: [],
    counter3Compacted: [],
    counterBaseline: [],
  };
  try {
    const call = (fn) => `(${fn.toString()})(${JSON.stringify(label)})`;
    for (const width of widths) {
      results.withoutNinth.push(await fresh(page, width, null));
      results.withNinth.push(await fresh(page, width, call(ninthFn)));
      results.withNinthCompacted.push(await fresh(page, width, call(compact1000Fn)));
      results.counter3.push(await fresh(page, width, call(ninthCounterFn)));
      results.counter3Compacted.push(await fresh(page, width, call(compact900Fn)));
      results.counterBaseline.push(await fresh(page, width, call(counterOnlyFn)));
    }

    // Bestandsaufnahme: Startseite und Kristalle-Modul.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(shotDir, 'start-1440.png') });
    await page.goto(base + '#crystals', { waitUntil: 'load' });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(shotDir, 'kristalle-1440.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '?m=390', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(shotDir, 'start-390.png') });
    // Mobilmenue mit neun Zielen: Zeilenhoehe, Ueberlauf, Menuehoehe.
    await page.evaluate(call(ninthFn));
    await page.click('#navToggle');
    await page.waitForTimeout(300);
    results.mobileMenu = await page.evaluate(() => {
      const list = document.querySelector('.nav-list');
      const links = [...list.querySelectorAll('.nav-link')];
      const heights = links.map((a) => Math.round(a.getBoundingClientRect().height));
      const listBox = list.getBoundingClientRect();
      return {
        viewport: window.innerWidth,
        linkCount: links.length,
        rowHeights: heights,
        minRowHeight: Math.min(...heights),
        listHeight: Math.round(listBox.height),
        viewportHeight: window.innerHeight,
        docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        activeLabel: (document.querySelector('.nav-link.active') || {}).textContent || null,
      };
    });
    await page.screenshot({ path: path.join(shotDir, 'mobil-menue-9-ziele-390.png') });
    results.consoleErrors = errors;

    fs.writeFileSync(
      path.join(outDir, `nav-9-ziele-${label.toLowerCase()}.json`),
      JSON.stringify(results, null, 2) + '\n'
    );
    const fmt = (r) =>
      `${String(r.viewport).padStart(4)} px | Ziele ${r.linkCount} | Reserve ${String(r.reserve).padStart(8)} px | Nav ${r.navLinkFontSize} | Logo ${r.logoFontSize} | Zaehler ${r.counterText || '-'} | Ueberlauf ${r.docOverflowX}`;
    const show = (title, rows) => {
      console.log(title);
      rows.forEach((r) => console.log(fmt(r)));
    };
    console.log(`=== Label "${label}" ===`);
    show('--- ohne neuntes Ziel ---', results.withoutNinth);
    show('--- Baseline ohne neuntes Ziel, dreistelliger Zaehler ---', results.counterBaseline);
    show('--- mit neuntem Ziel, bestehende Regeln ---', results.withNinth);
    show('--- mit neuntem Ziel + 12px-Regel 781-1000 (verworfen) ---', results.withNinthCompacted);
    show('--- mit neuntem Ziel + dreistelligem Zaehler ---', results.counter3);
    show('--- mit neuntem Ziel + Zaehler + Regel 781-900 (13px) ---', results.counter3Compacted);
  } finally {
    await browser.close();
  }
})();
