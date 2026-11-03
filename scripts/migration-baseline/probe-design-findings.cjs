'use strict';
// Gezielte Nachmessung der drei Produktbefunde aus design-review (D-02, D-03) und der
// Verlaufs-Kontrastaussage. Ergaenzt review-design-a11y.cjs, weil Filterbadges erst nach
// einer Filteraktion existieren und der Verlaufskontrast nicht aus background-color folgt.
//   node scripts/migration-baseline/probe-design-findings.cjs
// Ergebnis: docs/migration-baseline/evidence/design-review/probe-befunde.json

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

const FW_ROUTES = [
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
];

async function main() {
  const { chromium } = require('playwright');
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}${PREFIX}`;
  const browser = await chromium.launch();
  const result = { generated_at: new Date().toISOString(), base, findings: {} };

  // ---- D-03: Filterbadge im gerenderten DOM -------------------------------------------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}/#crystals`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const controls = await page.evaluate(() => {
      const box = document.getElementById('crystalFilterContainer');
      if (!box) return { present: false, sample: [] };
      const nodes = [...box.querySelectorAll('button, input, select')].slice(0, 40);
      return {
        present: true,
        sample: nodes.map((el) => ({
          tag: el.tagName,
          type: el.getAttribute('type'),
          text: (el.textContent || '').trim().slice(0, 40),
          dataset: { ...el.dataset },
          id: el.id,
        })),
      };
    });
    const clicked = await page.evaluate(() => {
      const box = document.getElementById('crystalFilterContainer');
      if (!box) return null;
      const candidates = [...box.querySelectorAll('button, input[type=checkbox]')].filter(
        (el) => !el.disabled && el.getAttribute('type') !== 'reset'
      );
      for (const el of candidates) {
        if (el.tagName === 'INPUT' && el.type === 'checkbox') {
          el.click();
          return { kind: 'checkbox', label: el.value || el.dataset.value || el.id };
        }
        const text = (el.textContent || '').trim();
        if (text && !/alle|reset|zurücksetzen|filter/i.test(text)) {
          el.click();
          return { kind: 'button', label: text.slice(0, 40) };
        }
      }
      return null;
    });
    await page.waitForTimeout(700);
    const badge = await page.evaluate(() => {
      const wrap = document.getElementById('activeFilterBadges');
      const remove = wrap ? wrap.querySelector('.badge-remove') : null;
      const chip = remove ? remove.closest('.badge') : null;
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Number(r.width.toFixed(2)), h: Number(r.height.toFixed(2)) };
      };
      const cs = remove ? getComputedStyle(remove) : null;
      return {
        badgeWrapVisible: wrap ? getComputedStyle(wrap).display !== 'none' : false,
        badgeCount: wrap ? wrap.querySelectorAll('.badge').length : 0,
        chip: rect(chip),
        remove: rect(remove),
        removeStyle: cs
          ? {
              fontSize: cs.fontSize,
              lineHeight: cs.lineHeight,
              padding: cs.padding,
              minWidth: cs.minWidth,
              minHeight: cs.minHeight,
              border: cs.borderWidth,
              ariaLabel: remove.getAttribute('aria-label'),
            }
          : null,
        chipLabel: chip ? chip.textContent.trim().slice(0, 40) : null,
      };
    });
    if (badge.badgeCount) {
      await page.locator('#activeFilterBadges').screenshot({
        path: path.join(OUT, 'filterbadge-1440.png'),
      });
    }
    result.findings.D03_badgeRemove = { controls, clicked, ...badge };
    await page.close();
  }

  // ---- D-02 / D-01: Fehlerzustand Studio und Journal -----------------------------------
  const formState = async (route, selector, file) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const snap = (sel) =>
      page.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return null;
        el.setAttribute('aria-invalid', 'true');
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName,
          id: el.id,
          ariaInvalid: el.getAttribute('aria-invalid'),
          borderTopColor: cs.borderTopColor,
          borderTopWidth: cs.borderTopWidth,
          borderStyle: cs.borderTopStyle,
          outlineColor: cs.outlineColor,
          outlineWidth: cs.outlineWidth,
          outlineStyle: cs.outlineStyle,
          boxShadow: cs.boxShadow,
          describedBy: el.getAttribute('aria-describedby'),
        };
      }, sel);
    const before = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        borderTopColor: cs.borderTopColor,
        borderTopWidth: cs.borderTopWidth,
        outlineWidth: cs.outlineWidth,
        ariaInvalid: el.getAttribute('aria-invalid'),
        describedBy: el.getAttribute('aria-describedby'),
      };
    }, selector);
    const after = await snap(selector);
    const identity = await page.evaluate((s) => {
      const matches = document.querySelectorAll(s);
      const el = matches[0];
      return {
        count: matches.length,
        tag: el ? el.tagName : null,
        markup: el ? el.outerHTML.slice(0, 160) : null,
        label: el && el.labels && el.labels[0] ? el.labels[0].textContent.trim().slice(0, 60) : null,
      };
    }, selector);
    const el = await page.$(selector);
    if (el) {
      await el.scrollIntoViewIfNeeded();
      // Viewport-Aufnahme statt Elementausschnitt: der Fehlerzustand ist eine Aussage ueber
      // Feld plus Meldung; ein Elementbild schneidet die role=alert-Texte ab.
      await page.screenshot({ path: path.join(OUT, file) });
    }
    await page.close();
    return { route, selector, identity, before, after };
  };

  result.findings.D02_studioErrorState = await formState(
    '#pendeln/studio',
    '#ptfTitle',
    'studio-fehlerzustand-1440.png'
  );
  result.findings.D01_journalErrorState = await formState(
    '#pendeln/journal',
    '#jrDate',
    'journal-fehlerzustand-1440.png'
  );

  // ---- Verlaufskontrast der Farbwelten-Baender ----------------------------------------
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const perRoute = [];
    for (const slug of FW_ROUTES) {
      await page.goto(`${base}/#farbwelten/${slug}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      const measured = await page.evaluate(() => {
        const band = document.querySelector('.fw-detail__band');
        if (!band) return { slug: null, stops: [], worst: null, texts: 0 };
        const grad = getComputedStyle(band).backgroundImage;
        // Farbstops robust ueber Canvas normalisieren (auch color(srgb ...) und color-mix).
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');
        const toRgb = (token) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = '#000';
          ctx.fillStyle = token.trim();
          ctx.fillRect(0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          return { r: d[0], g: d[1], b: d[2], a: d[3] / 255, raw: token.trim() };
        };
        const stopTokens = [];
        const re = /(rgba?\([^)]*\)|color\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}|[a-z]+)(?=\s+\d+(?:\.\d+)?%|\s*$)/gi;
        let m;
        while ((m = re.exec(grad))) {
          const token = m[1];
          if (/gradient|to|deg|from|at|repeat/i.test(token)) continue;
          stopTokens.push(toRgb(token));
        }
        const lum = ({ r, g, b }) => {
          const f = (v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (a, b) => {
          const l1 = lum(a);
          const l2 = lum(b);
          const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
          return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
        };
        const parse = (value) => {
          const nums = String(value).match(/[\d.]+/g) || [];
          return {
            r: Number(nums[0]),
            g: Number(nums[1]),
            b: Number(nums[2]),
            a: nums[3] === undefined ? 1 : Number(nums[3]),
          };
        };
        const nodes = [...band.querySelectorAll('p, h1, h2, h3, span, a, li')].filter(
          (el) => el.getClientRects().length && (el.textContent || '').trim()
        );
        let worst = null;
        for (const el of nodes) {
          const cs = getComputedStyle(el);
          const fg = parse(cs.color);
          if (fg.a === 0) continue;
          const fs = parseFloat(cs.fontSize);
          const weight = Number(cs.fontWeight) || 400;
          const large = fs >= 24 || (fs >= 18.66 && weight >= 700);
          const required = large ? 3 : 4.5;
          for (const stop of stopTokens) {
            if (stop.a < 1) continue;
            const r = ratio(fg, stop);
            if (!worst || r < worst.ratio) {
              worst = {
                ratio: r,
                required,
                selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
                text: (el.textContent || '').trim().slice(0, 60),
                fg: cs.color,
                fontSize: cs.fontSize,
                weight,
                stop: stop.raw,
              };
            }
          }
        }
        return { gradient: grad.slice(0, 300), stops: stopTokens.map((s) => s.raw), texts: nodes.length, worst };
      });
      perRoute.push({ slug, ...measured });
    }
    const worstOverall =
      perRoute.flatMap((r) => (r.worst ? [{ slug: r.slug, ...r.worst }] : [])).sort((a, b) => a.ratio - b.ratio)[0] ||
      null;
    const failing = perRoute.flatMap((r) =>
      r.worst && r.worst.ratio < r.worst.required ? [{ slug: r.slug, ...r.worst }] : []
    );
    result.findings.gradientBand = { routes: perRoute, worstOverall, failing };
    await page.close();
  }

  await browser.close();
  server.close();
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'probe-befunde.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        D03: result.findings.D03_badgeRemove,
        D02: result.findings.D02_studioErrorState,
        D01: result.findings.D01_journalErrorState,
        gradientWorst: result.findings.gradientBand.worstOverall,
        gradientFailing: result.findings.gradientBand.failing.length,
        gradientTexts: result.findings.gradientBand.routes.reduce((s, r) => s + r.texts, 0),
      },
      null,
      1
    )
  );
}

main().catch((error) => {
  console.error('FEHLER', error);
  process.exit(1);
});
