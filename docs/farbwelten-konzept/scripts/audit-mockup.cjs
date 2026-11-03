// Prueft das gerenderte Mockup im echten Browser: aufgeloeste Tokens,
// gemessene Textkontraste, Ueberlauf, Fokus, Tastaturbedienung,
// reduced-motion und Konsolenfehler. Screenshots je Breite.
//
// Aufruf: node docs/farbwelten-konzept/scripts/audit-mockup.cjs [baseUrl]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base =
  process.argv[2] || 'http://127.0.0.1:8138/Esoterik-Welt/docs/farbwelten-konzept/mockup/index.html';
const outDir = path.resolve('docs/farbwelten-konzept/messung');
const shotDir = path.join(outDir, 'mockup');
const widths = [1440, 1100, 900, 768, 390, 320];

const contrastScript = () => {
  const toRgb = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((n) => parseFloat(n.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => {
    const la = lum(a);
    const lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  const effectiveBg = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        return { type: 'gradient', value: style.backgroundImage };
      }
      const rgb = toRgb(style.backgroundColor);
      if (rgb && rgb.a > 0.98) return { type: 'color', value: rgb };
      node = node.parentElement;
    }
    return { type: 'color', value: { r: 11, g: 16, b: 18, a: 1 } };
  };

  const samples = [
    ['h1', 'h1'],
    ['.fw-hero__lede', 'Hero-Lede'],
    ['.fw-register__name', 'Register-Name'],
    ['.fw-register__meta', 'Register-Metadaten'],
    ['.fw-register__chakra', 'Register-Chakra'],
    ['.fw-register__arrow', 'Register-Pfeil'],
    ['.fw-card__text', 'Kartentext'],
    ['.fw-card__title', 'Kartentitel'],
    ['.fw-chakra__panel h3', 'Chakra-Titel'],
    ['.fw-chakra__sanskrit', 'Chakra-Sanskrit'],
    ['.fw-chakra__list dd', 'Chakra-Wert'],
    ['.fw-compare__col p', 'Vergleichstext'],
    ['.fw-compare__foot', 'Vergleichs-Fussnote'],
    ['.fw-detail__band h2', 'Detail-H2'],
    ['.fw-detail__band p:last-child', 'Detail-Lede'],
    ['.fw-detail__body p', 'Detail-Absatz'],
    ['.fw-note', 'Fussnote'],
    ['.fw-tafel__name', 'Tafel-Name'],
    ['.fw-tafel__nm', 'Tafel-Wellenlaenge'],
    ['.fw-node', 'Chakra-Knoten (Zahl)'],
    ['.astro-badge--historisch', 'Badge historisch'],
    ['.astro-badge--empirie', 'Badge Empirie'],
    ['.astro-badge--deutungstradition', 'Badge Deutungstradition'],
  ];

  const results = [];
  for (const [selector, label] of samples) {
    const el = document.querySelector(selector);
    if (!el) {
      results.push({ selector, label, found: false });
      continue;
    }
    const style = getComputedStyle(el);
    const fg = toRgb(style.color);
    const bg = effectiveBg(el);
    results.push({
      selector,
      label,
      found: true,
      fontSize: style.fontSize,
      color: style.color,
      background: bg.type === 'color' ? `rgb(${bg.value.r}, ${bg.value.g}, ${bg.value.b})` : 'gradient',
      backgroundType: bg.type,
      ratio: bg.type === 'color' && fg ? Math.round(ratio(fg, bg.value) * 100) / 100 : null,
    });
  }
  return results;
};

const structureScript = () => {
  const nodes = [...document.querySelectorAll('.fw-node')];
  const cards = [...document.querySelectorAll('.fw-card')];
  const rows = [...document.querySelectorAll('.fw-register__link')];
  return {
    docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => `${h.tagName}:${h.textContent.trim().slice(0, 48)}`),
    h1Count: document.querySelectorAll('h1').length,
    cardHeights: cards.map((c) => Math.round(c.getBoundingClientRect().height)),
    cardTops: cards.map((c) => Math.round(c.getBoundingClientRect().top)),
    rowHeights: rows.map((r) => Math.round(r.getBoundingClientRect().height)),
    nodeSizes: nodes.map((n) => Math.round(n.getBoundingClientRect().width)),
    navLinkCount: document.querySelectorAll('.nav-list .nav-link').length,
    lastNavRight: (() => {
      const links = document.querySelectorAll('.nav-list .nav-link');
      const last = links[links.length - 1];
      return last ? Math.round(last.getBoundingClientRect().right) : null;
    })(),
    headerInnerRight: Math.round(
      document.querySelector('.header-inner').getBoundingClientRect().right -
        parseFloat(getComputedStyle(document.querySelector('.header-inner')).paddingRight)
    ),
    imagesWithoutAlt: [...document.querySelectorAll('img')].filter((img) => !img.alt).length,
    svgTitle: Boolean(document.querySelector('.fw-figure svg title')),
    pressedCount: nodes.filter((n) => n.getAttribute('aria-pressed') === 'true').length,
  };
};

(async () => {
  fs.mkdirSync(shotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = {
    base,
    // Bleibt bei einer Neumessung stehen: das Mockup zeigt die erste Ausbaustufe.
    stand:
      'Messung erste Ausbaustufe (7 Farbwelten) — historischer Messstand, nicht Referenz für den Zwölf-Farben-Stand (02, 03, 06)',
    measured_at: new Date().toISOString(),
    viewports: [],
    failures: [],
  };
  try {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: width >= 900 ? 1000 : 844 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const errors = [];
      const failedRequests = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('requestfailed', (req) => failedRequests.push(`${req.url()} ${req.failure()?.errorText}`));
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);

      const structure = await page.evaluate(structureScript);
      const contrast = await page.evaluate(contrastScript);
      const tokens = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const probe = document.querySelector('.fw-register__field');
        return {
          rotCore: root.getPropertyValue('--fw-rot-core').trim(),
          rotInk: root.getPropertyValue('--fw-rot-ink').trim(),
          probeBackground: probe ? getComputedStyle(probe).backgroundColor : null,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          bodyFont: getComputedStyle(document.body).fontFamily,
          transition: getComputedStyle(document.querySelector('.fw-node')).transitionDuration,
        };
      });

      // Fokusring per Tastatur anfahren (nicht per programmatischem Fokus).
      await page.evaluate(() => document.body.focus());
      let focused = null;
      for (let i = 0; i < 40; i += 1) {
        await page.keyboard.press('Tab');
        focused = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || !el.classList || !el.classList.contains('fw-node')) return null;
          const s = getComputedStyle(el);
          return {
            outlineWidth: s.outlineWidth,
            outlineColor: s.outlineColor,
            outlineOffset: s.outlineOffset,
          };
        });
        if (focused) break;
      }
      const focus = focused || { outlineWidth: '0px', outlineColor: 'none', outlineOffset: '0px' };

      // Tastatur: Pfeil abwaerts waehlt das naechste Chakra.
      const before = await page.evaluate(() => document.querySelector('.fw-node[aria-pressed="true"]').dataset.chakra);
      await page.keyboard.press('ArrowDown');
      const after = await page.evaluate(() => ({
        pressed: document.querySelector('.fw-node[aria-pressed="true"]').dataset.chakra,
        name: document.getElementById('chakra-name').textContent,
        link: document.getElementById('chakra-link').getAttribute('href'),
      }));

      const viewportResult = { width, structure, tokens, contrast, focus, keyboard: { before, after }, errors, failedRequests };
      report.viewports.push(viewportResult);

      if (structure.docOverflowX !== 0) report.failures.push(`${width}px: horizontaler Ueberlauf ${structure.docOverflowX}px`);
      if (structure.h1Count !== 1) report.failures.push(`${width}px: ${structure.h1Count} H1-Elemente`);
      if (structure.pressedCount !== 1) report.failures.push(`${width}px: ${structure.pressedCount} gedrueckte Chakra-Knoten`);
      // Karten muessen je Zeile gleich hoch sein; unterschiedliche Zeilen duerfen
      // sich unterscheiden, wenn das Raster stapelt.
      const byRow = new Map();
      structure.cardTops.forEach((top, index) => {
        const key = Math.round(top / 2);
        if (!byRow.has(key)) byRow.set(key, []);
        byRow.get(key).push(structure.cardHeights[index]);
      });
      for (const [row, heights] of byRow) {
        if (Math.max(...heights) - Math.min(...heights) > 1)
          report.failures.push(`${width}px: Kartenhoehen in Zeile ${row} differieren (${heights.join('/')})`);
      }
      if (Math.min(...structure.nodeSizes) < 24) report.failures.push(`${width}px: Chakra-Ziel < 24px`);
      if (errors.length) report.failures.push(`${width}px: Konsolenfehler ${errors.join(' | ')}`);
      if (failedRequests.length) report.failures.push(`${width}px: fehlgeschlagene Requests ${failedRequests.join(' | ')}`);
      if (!tokens.rotCore || tokens.probeBackground === 'rgba(0, 0, 0, 0)')
        report.failures.push(`${width}px: Palettenvariablen nicht aufgeloest`);
      if (focus.outlineWidth === '0px') report.failures.push(`${width}px: kein Fokusring am Chakra-Knoten`);
      if (after.pressed === before) report.failures.push(`${width}px: Pfeiltaste wechselt Chakra nicht`);
      for (const sample of contrast) {
        if (sample.found && sample.backgroundType === 'color' && sample.ratio < 4.5)
          report.failures.push(`${width}px: Kontrast ${sample.label} ${sample.ratio}:1 < 4.5`);
      }

      // Export ohne klebende Kopfzeile und ohne Skip-Link (beide wuerden im
      // Ganzseitenbild genau einmal an ihrer Viewport-Position erscheinen).
      await page.evaluate(() => {
        const header = document.querySelector('.header');
        const skip = document.querySelector('.skip-link');
        if (header) header.style.display = 'none';
        if (skip) skip.style.display = 'none';
      });
      await page.screenshot({ path: path.join(shotDir, `farbwelten-${width}.png`), fullPage: true });
      await page.evaluate(() => {
        const header = document.querySelector('.header');
        const skip = document.querySelector('.skip-link');
        if (header) header.style.display = '';
        if (skip) skip.style.display = '';
        window.scrollTo(0, 0);
      });
      await page.screenshot({ path: path.join(shotDir, `farbwelten-${width}-viewport.png`) });
      await context.close();
    }
  } finally {
    // Zusatzmessung ohne reduced-motion: Dort greift die Autor-Regel
    // (2px Sand, 4px Offset). Unter reduzierter Bewegung zeichnet Chromium
    // zusaetzlich seinen nativen Fokusring; beide sind sichtbar.
    if (!report.focusDefault) report.focusDefault = null;
  }

  // Zweiter Durchlauf ohne reduced-motion fuer den Fokus-Nachweis.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.body.focus());
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const hit = await page.evaluate(() => {
        const el = document.activeElement;
        return Boolean(el && el.classList && el.classList.contains('fw-node'));
      });
      if (hit) break;
    }
    report.focusDefault = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return {
        active: el.className,
        outlineWidth: s.outlineWidth,
        outlineStyle: s.outlineStyle,
        outlineColor: s.outlineColor,
        outlineOffset: s.outlineOffset,
      };
    });
    const box = await page.locator('.fw-figure').boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(shotDir, 'fokus-chakra-1440.png'),
        clip: {
          x: Math.max(box.x - 8, 0),
          y: Math.max(box.y - 8, 0),
          width: Math.min(box.width + 16, 1440),
          height: Math.min(box.height + 16, 1000),
        },
      });
    }
    await context.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(outDir, 'mockup-audit.json'), JSON.stringify(report, null, 2) + '\n');
  const first = report.viewports[0];
  console.log('Messpunkte:', report.viewports.map((v) => v.width).join(', '));
  console.log('Kontraste (1440 px):');
  first.contrast.forEach((s) => {
    console.log(`  ${String(s.label).padEnd(28)} ${s.backgroundType === 'color' ? String(s.ratio) + ':1' : 'Verlauf'}  ${s.color} auf ${s.background}`);
  });
  console.log('Fokus:', JSON.stringify(first.focus));
  console.log('Tastatur:', JSON.stringify(first.keyboard));
  console.log('Kartenhoehen:', report.viewports.map((v) => v.structure.cardHeights.join('/')).join(' | '));
  console.log('Ueberlauf:', report.viewports.map((v) => `${v.width}:${v.structure.docOverflowX}`).join(' '));
  console.log('Fehler:', report.failures.length ? report.failures : 'keine');
  if (report.failures.length) process.exitCode = 1;
})();
