// Farbwelten — Browserprüfung für die gebaute Fassung.
//
// Prüft je Route und Breite: genau eine H1, keine Überschriften-Sprünge,
// vollständiges A–H-Skelett, keinen horizontalen Überlauf, keine
// Konsolenfehler, messbare AA-Kontraste und die Tastaturbedienung von
// Chakra-Auswahl und Spektrum-Slider. Schreibt JSON + Markdown + Screenshots
// in das Ausgabeverzeichnis.
//
// Aufruf:
//   node scripts/verify-farbwelten.cjs [base-url] [ausgabe]
// Standard: http://127.0.0.1:8099/Esoterik-Welt/ evidence/farbwelten

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base = process.argv[2] || 'http://127.0.0.1:8099/Esoterik-Welt/';
const output = path.resolve(process.argv[3] || 'evidence/farbwelten');
const SECTION_IDS = ['erleben', 'physik', 'psychologie', 'tradition', 'anwendung', 'geschichte', 'uebung', 'quellen'];
const COLOURS = ['rot', 'orange', 'gelb', 'gruen', 'blau', 'indigo', 'violett'];
const ROUTES = [
  { hash: 'farbwelten', kind: 'landing' },
  ...COLOURS.map((id) => ({ hash: `farbwelten/${id}`, kind: 'color' })),
  { hash: 'farbwelten/chakren', kind: 'chakren' },
  { hash: 'farbwelten/lichtfrequenzen', kind: 'light' },
  { hash: 'farbwelten/rot/physik', kind: 'color', anchor: 'physik' },
];
const WIDTHS = [1440, 1100, 900, 390, 320];

// Kontrast nach WCAG 2.x im Browser berechnen.
const CONTRAST_HELPER = `
  function candidateHex(color) {
    return '#' + [color.r, color.g, color.b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('');
  }
  function measureContrast(selector) {
    const parse = (value) => {
      const match = /rgba?\\(([^)]+)\\)/.exec(value || '');
      if (!match) return null;
      const parts = match[1].split(',').map((entry) => parseFloat(entry.trim()));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    const luminance = ({ r, g, b }) => {
      const channel = (value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const element = document.querySelector(selector);
    if (!element) return { selector, missing: true };
    const style = getComputedStyle(element);
    let node = element;
    let background = null;
    while (node && node !== document.documentElement) {
      const candidate = getComputedStyle(node);
      if (candidate.backgroundImage && candidate.backgroundImage !== 'none') return { selector, skipped: 'gradient' };
      const color = parse(candidate.backgroundColor);
      if (color && color.a > 0.95) { background = color; break; }
      node = node.parentElement;
    }
    if (!background) return { selector, skipped: 'no-solid-background' };
    const foreground = parse(style.color);
    if (!foreground) return { selector, skipped: 'no-color' };
    const l1 = luminance(foreground);
    const l2 = luminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(style.fontSize);
    const weight = parseInt(style.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    return {
      selector,
      ratio: Number(ratio.toFixed(2)),
      size,
      weight,
      large,
      required: large ? 3 : 4.5,
      pass: ratio >= (large ? 3 : 4.5),
      foreground: style.color,
      background: candidateHex(background),
    };
  }
  measureContrast
`;

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const headerResults = [];
  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const events = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning')
          events.push({ type: message.type(), text: message.text() });
      });
      page.on('pageerror', (error) => events.push({ type: 'pageerror', text: error.message }));

      for (const route of ROUTES) {
        events.length = 0;
        await page.goto('about:blank');
        await page.goto(`${base}#${route.hash}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(220);
        const metrics = await page.evaluate((sectionIds) => {
          const headings = [...document.querySelectorAll('main h1, main h2, main h3, main h4')]
            .filter((node) => node.closest('.page:not([hidden])'))
            .map((node) => ({ level: Number(node.tagName.slice(1)), text: node.textContent.trim().slice(0, 70) }));
          const skips = [];
          for (let index = 1; index < headings.length; index += 1) {
            if (headings[index].level - headings[index - 1].level > 1)
              skips.push(`${headings[index - 1].level}→${headings[index].level} bei „${headings[index].text}“`);
          }
          return {
            hash: location.hash,
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
            ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
            ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
            twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content || '',
            jsonLd: [...document.querySelectorAll('#farbweltenRoot script[type="application/ld+json"]')].length,
            activePage: document.querySelector('.page.active')?.id,
            rootChildren: document.getElementById('farbweltenRoot')?.children.length || 0,
            h1Count: document.querySelectorAll('#farbweltenRoot h1').length,
            headings,
            skips,
            sectionIds: [...document.querySelectorAll('#farbweltenRoot [id]')].map((node) => node.id),
            visibleSections: sectionIds.filter((id) => {
              const node = document.getElementById(id);
              return node && node.offsetParent !== null;
            }),
            docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
            contrast: [],
            focus: (() => {
              const link = document.querySelector('.nav-link');
              link.focus();
              const style = getComputedStyle(link);
              return {
                outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
                offset: style.outlineOffset,
              };
            })(),
            pressedCount: document.querySelectorAll('.fw-node[aria-pressed="true"]').length,
            nodeCount: document.querySelectorAll('.fw-node').length,
            svgTitle: Boolean(document.querySelector('.fw-figure svg title')),
            imagesWithoutAlt: [...document.querySelectorAll('img:not([alt])')].length,
            slider: (() => {
              const input = document.getElementById('fwWavelength');
              if (!input) return null;
              return {
                value: input.value,
                min: input.min,
                max: input.max,
                step: input.step,
                valueText: input.getAttribute('aria-valuetext'),
                label: document.querySelector('label[for="fwWavelength"]')?.textContent.trim(),
              };
            })(),
            spectrumText: document.getElementById('fwSpectrumReadout')?.textContent.trim() || '',
          };
        }, SECTION_IDS);
        // Kontrastmessung: Helferfunktion wird im Seitenkontext definiert.
        metrics.contrast = await page.evaluate((helper) => {
          const measure = new Function(`${helper}; return measureContrast;`)();
          return [
            '#farbweltenRoot h1',
            '#farbweltenRoot p',
            '#farbweltenRoot .fw-register__meta',
            '#farbweltenRoot .fw-register__name',
            '#farbweltenRoot .fw-card__text',
            '#farbweltenRoot .fw-breadcrumb a',
            '#farbweltenRoot .fw-toc a',
            '#farbweltenRoot .fw-quote p',
            '#farbweltenRoot .fw-facts dt',
            '#farbweltenRoot .fw-facts dd',
            '#farbweltenRoot .astro-badge',
          ].map((selector) => measure(selector));
        }, CONTRAST_HELPER);

        const failures = [];
        if (metrics.activePage !== 'farbwelten') failures.push(`aktive Seite: ${metrics.activePage}`);
        if (!metrics.rootChildren) failures.push('kein Inhalt gerendert');
        if (metrics.h1Count !== 1) failures.push(`H1-Anzahl: ${metrics.h1Count}`);
        if (metrics.skips.length) failures.push(`Überschriftsprünge: ${metrics.skips.join('; ')}`);
        if (metrics.docOverflowX > 0) failures.push(`horizontaler Überlauf: ${metrics.docOverflowX}px`);
        if (!metrics.description || metrics.description.length < 50) failures.push('Meta-Description fehlt/kurz');
        if (metrics.ogTitle !== metrics.title) failures.push('og:title weicht vom Dokumenttitel ab');
        if (metrics.ogDescription !== metrics.description) failures.push('og:description weicht ab');
        if (metrics.twitterTitle !== metrics.title) failures.push('twitter:title weicht ab');
        if (metrics.jsonLd !== 1) failures.push(`JSON-LD-Blöcke: ${metrics.jsonLd}`);
        if (route.kind === 'color') {
          const missing = SECTION_IDS.filter((id) => !metrics.visibleSections.includes(id));
          if (missing.length) failures.push(`fehlende Abschnitte: ${missing.join(', ')}`);
          if (route.anchor && !metrics.hash.endsWith(`/${route.anchor}`)) failures.push('Ankerroute verloren');
        }
        if (route.kind === 'chakren') {
          if (metrics.nodeCount !== 7) failures.push(`Chakra-Knoten: ${metrics.nodeCount}`);
          if (metrics.pressedCount !== 1) failures.push(`aria-pressed aktiv: ${metrics.pressedCount}`);
          if (!metrics.svgTitle) failures.push('SVG ohne Titel');
        }
        if (route.kind === 'light') {
          if (!metrics.slider) failures.push('Spektrum-Slider fehlt');
          else {
            if (!metrics.slider.valueText) failures.push('aria-valuetext fehlt');
            if (!/530 Nanometer/.test(metrics.slider.valueText)) failures.push('Startwert 530 nm fehlt');
            if (!/565,6 Terahertz/.test(metrics.spectrumText)) failures.push('Frequenz 530 nm falsch');
          }
        }
        for (const check of metrics.contrast) {
          if (check.missing || check.skipped) continue;
          if (!check.pass) failures.push(`Kontrast ${check.selector}: ${check.ratio}:1 < ${check.required}:1`);
        }
        if (metrics.imagesWithoutAlt) failures.push(`Bilder ohne Alt: ${metrics.imagesWithoutAlt}`);
        for (const event of events) {
          if (event.type === 'error' || event.type === 'pageerror') failures.push(`${event.type}: ${event.text}`);
        }
        results.push({ route: route.hash, kind: route.kind, width, metrics, events: [...events], failures });
        console.log(
          `${failures.length ? 'FAIL' : 'PASS'} ${width} #${route.hash}${failures.length ? ' — ' + failures.join(' | ') : ''}`
        );
      }

      // Bedienprüfung: Chakra-Auswahl per Tastatur, Slider-Stützwerte, Alias.
      if (width === 1440) {
        await page.goto('about:blank');
        await page.goto(`${base}#farbwelten/chakren`, { waitUntil: 'networkidle' });
        await page.locator('.fw-node').first().focus();
        await page.keyboard.press('ArrowDown');
        const chakraState = await page.evaluate(() => ({
          pressed: document.querySelector('.fw-node[aria-pressed="true"]')?.dataset.chakra,
          name: document.getElementById('fwChakraName')?.textContent,
          link: document.getElementById('fwChakraLink')?.getAttribute('href'),
          focus: document.activeElement?.dataset.chakra,
        }));
        const chakraFailures = [];
        if (chakraState.pressed !== 'sacral') chakraFailures.push(`Pfeiltaste: ${chakraState.pressed}`);
        if (!/Svādhiṣṭhāna/.test(chakraState.name || '')) chakraFailures.push('Panel nicht aktualisiert');
        if (chakraState.link !== '#farbwelten/orange') chakraFailures.push(`Link: ${chakraState.link}`);
        if (chakraState.focus !== 'sacral') chakraFailures.push('Fokus folgt nicht');

        await page.goto('about:blank');
        await page.goto(`${base}#farbwelten/lichtfrequenzen`, { waitUntil: 'networkidle' });
        const spectrum = [];
        for (const nm of [650, 530, 420]) {
          await page.evaluate((value) => {
            const input = document.getElementById('fwWavelength');
            input.value = String(value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }, nm);
          spectrum.push(
            await page.evaluate(() => ({
              nm: document.getElementById('fwWavelength').value,
              readout: document.getElementById('fwSpectrumReadout').textContent.trim(),
            }))
          );
        }
        const spectrumFailures = [];
        if (!/461,2 Terahertz/.test(spectrum[0].readout)) spectrumFailures.push(`650 nm: ${spectrum[0].readout}`);
        if (!/565,6 Terahertz/.test(spectrum[1].readout)) spectrumFailures.push(`530 nm: ${spectrum[1].readout}`);
        if (!/713,8 Terahertz/.test(spectrum[2].readout)) spectrumFailures.push(`420 nm: ${spectrum[2].readout}`);

        await page.goto('about:blank');
        await page.goto(`${base}#chakren`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(150);
        const aliasHash = await page.evaluate(() => location.hash);
        const aliasFailures = aliasHash === '#farbwelten/chakren' ? [] : [`Alias: ${aliasHash}`];

        results.push({
          route: 'interaktion',
          width,
          chakraState,
          spectrum,
          aliasHash,
          failures: [...chakraFailures, ...spectrumFailures, ...aliasFailures],
        });
        console.log(
          `${results[results.length - 1].failures.length ? 'FAIL' : 'PASS'} 1440 Interaktion (Pfeiltasten, Spektrum, Alias)${
            results[results.length - 1].failures.length ? ' — ' + results[results.length - 1].failures.join(' | ') : ''
          }`
        );
      }
      await context.close();
    }

    // Kopfzeile: neun Ziele ab 901 px, Burger darunter, kein Überlauf.
    for (const width of [1440, 1120, 901, 900, 781, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => {
        const links = [...document.querySelectorAll('.nav-link')];
        return {
          visibleLinks: links.filter((link) => link.offsetParent !== null).length,
          burgerVisible: document.getElementById('navToggle')?.offsetParent !== null,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          navReserve: (() => {
            const inner = document.querySelector('.header-inner');
            if (!inner) return null;
            const style = getComputedStyle(inner);
            const children = [...inner.children].filter((node) => node.offsetParent !== null);
            const used = children.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0);
            const gaps = parseFloat(style.columnGap || style.gap || 0) * Math.max(0, children.length - 1);
            return Number((inner.clientWidth - used - gaps).toFixed(2));
          })(),
        };
      });
      const failures = [];
      if (metrics.overflow > 0) failures.push(`Überlauf ${metrics.overflow}px`);
      if (width >= 901) {
        if (metrics.visibleLinks !== 9) failures.push(`${metrics.visibleLinks} sichtbare Ziele`);
        if (metrics.burgerVisible) failures.push('Burger sichtbar');
        if (metrics.navReserve !== null && metrics.navReserve < 20) failures.push(`Reserve ${metrics.navReserve}px`);
      } else if (!metrics.burgerVisible) failures.push('Burger fehlt');
      headerResults.push({ width, metrics, failures });
      console.log(`${failures.length ? 'FAIL' : 'PASS'} Kopfzeile ${width}: ${JSON.stringify(metrics)}`);
      await context.close();
    }

    // Screenshots für den Nachweis.
    for (const [hash, suffix] of [
      ['farbwelten', 'landing'],
      ['farbwelten/rot', 'rot'],
      ['farbwelten/chakren', 'chakren'],
      ['farbwelten/lichtfrequenzen', 'lichtfrequenzen'],
    ]) {
      for (const width of [1440, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto(`${base}#${hash}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(output, `${suffix}-${width}.png`), fullPage: true });
        await context.close();
      }
    }
  } finally {
    const failed = results.filter((entry) => entry.failures && entry.failures.length);
    const headerFailed = headerResults.filter((entry) => entry.failures.length);
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify({ base, date: new Date().toISOString(), results, headerResults }, null, 2)
    );
    const lines = [
      '# Farbwelten — Browserprüfung',
      '',
      `Basis: ${base}`,
      `Datum: ${new Date().toISOString()}`,
      '',
      `Prüfungen: ${results.length}, fehlgeschlagen: ${failed.length}`,
      `Kopfzeilen-Breiten: ${headerResults.length}, fehlgeschlagen: ${headerFailed.length}`,
      '',
      '| Route | Breite | H1 | Abschnitte | Überlauf | Kontraste | min. Kontrast | Ergebnis |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
      ...results.map((entry) => {
        const measured = (entry.metrics?.contrast || []).filter((check) => !check.missing && !check.skipped);
        const min = measured.length ? Math.min(...measured.map((check) => check.ratio)) : null;
        return `| #${entry.route} | ${entry.width} | ${entry.metrics?.h1Count ?? '–'} | ${
          entry.kind === 'color' ? `${entry.metrics?.visibleSections?.length ?? '–'}/8` : '–'
        } | ${entry.metrics?.docOverflowX ?? '–'} | ${measured.filter((check) => check.pass).length}/${
          measured.length
        } | ${min === null ? '–' : min + ':1'} | ${entry.failures.length ? 'FAIL: ' + entry.failures.join('; ') : 'PASS'} |`;
      }),
      '',
      '## Kopfzeile',
      '',
      '| Breite | sichtbare Ziele | Burger | Reserve | Ergebnis |',
      '| ---: | ---: | --- | ---: | --- |',
      ...headerResults.map(
        (entry) =>
          `| ${entry.width} | ${entry.metrics.visibleLinks} | ${entry.metrics.burgerVisible ? 'ja' : 'nein'} | ${
            entry.metrics.navReserve ?? '–'
          } | ${entry.failures.length ? 'FAIL: ' + entry.failures.join('; ') : 'PASS'} |`
      ),
    ];
    fs.writeFileSync(path.join(output, 'report.md'), lines.join('\n') + '\n');
    await browser.close();
    if (failed.length || headerFailed.length) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
