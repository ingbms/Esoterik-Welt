// Browser-Regressionstest für den neuen Astrologiebereich.
//
// Geprüft wird das, was in Node nicht prüfbar ist: der echte Hash-Router
// (Kaltstart, Zurück/Vorwärts, Deep-Links), die Modulnavigation, Filter und
// Suche als echte Bedienung, Tastatur/Fokus, mobile Lesbarkeit ohne Überlauf
// und das bedarfsgerechte Laden des Datenmoduls.
//
// Kein Testwert ist geschätzt: Die erwarteten Zahlen stammen aus dem geprüften
// Inhaltsdatensatz (12/10/12/5, 4/15/65, 25 Quellen/28 Claims) und werden hier
// gegen das tatsächlich gerenderte DOM geprüft.
import { test, expect } from 'playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/Esoterik-Welt';

const AREAS = [
  { hash: '#astrologie/zeichen', selector: '.astro-card', count: 12, title: 'Die zwölf Zeichen' },
  { hash: '#astrologie/faktoren', selector: '.astro-card', count: 10, title: 'Die zehn Faktoren' },
  { hash: '#astrologie/haeuser', selector: '.astro-card', count: 12, title: 'Die zwölf Häuser' },
  { hash: '#astrologie/aspekte', selector: '.astro-card', count: 5, title: 'Die fünf Hauptaspekte' },
  { hash: '#astrologie/beispiele', selector: '.astro-card', count: 4, title: 'Synthese in Beispielen' },
  { hash: '#astrologie/faq', selector: '.astro-faq-item', count: 15, title: 'Häufige Fragen' },
  { hash: '#astrologie/glossar', selector: '.astro-term', count: 65, title: 'Glossar' },
  { hash: '#astrologie/lernpfad', selector: '.astro-stage', count: 6, title: 'Lernpfad' },
];

async function openArea(page, hash) {
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'load' });
  await page.locator('#astrologie.active:not([hidden])').waitFor({ state: 'visible' });
  await page.locator('#astrologieRoot h1#astro-title').waitFor({ state: 'visible' });
}

test.describe('Astrologie — Navigation und Deep-Links', () => {
  test('main navigation opens the area and keeps one visible h1', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.locator('#featureGrid > *').first().waitFor();
    expect(await page.locator('#featureGrid > *').count()).toBe(6);
    await page.locator('.nav-link[data-page="astrologie"]').click();
    await page.locator('#astrologie.active:not([hidden])').waitFor({ state: 'visible' });
    await expect(page.locator('#astrologieRoot h1#astro-title')).toContainText('Astrologie');
    expect(new URL(page.url()).hash).toBe('#astrologie');
    expect(await page.locator('#astrologieRoot h1:visible').count()).toBe(1);
    // Focus lands on the new heading so keyboard users continue in the area.
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('astro-title');
    expect(await page.title()).toContain('Astrologie');
    expect(errors).toEqual([]);
  });

  test('every index area renders its full catalogue on a cold deep link', async ({ page }) => {
    for (const area of AREAS) {
      await page.goto('about:blank');
      await openArea(page, area.hash);
      await expect(page.locator('#astrologieRoot .astro-title')).toContainText(area.title);
      const count = await page.locator(`#astrologieRoot ${area.selector}`).count();
      expect(count, `${area.hash} rendered ${count} of ${area.count}`).toBe(area.count);
    }
  });

  test('detail, back and forward keep the address and the content in sync', async ({ page }) => {
    await openArea(page, '#astrologie/zeichen');
    await page.locator('#astrologieRoot .astro-card-title a').first().click();
    await expect(page.locator('#astrologieRoot .astro-title')).toContainText('Widder');
    expect(new URL(page.url()).hash).toBe('#astrologie/zeichen/widder');
    expect((await page.locator('#astrologieRoot').textContent()).length).toBeGreaterThan(4000);

    await page.goBack();
    await expect(page.locator('#astrologieRoot .astro-title')).toContainText('Die zwölf Zeichen');
    expect(new URL(page.url()).hash).toBe('#astrologie/zeichen');

    await page.goForward();
    await expect(page.locator('#astrologieRoot .astro-title')).toContainText('Widder');
  });

  test('a cold link to every reference item renders that item', async ({ page }) => {
    const targets = [
      ['#astrologie/zeichen/fische', 'Fische'],
      ['#astrologie/faktoren/pluto', 'Pluto'],
      ['#astrologie/haeuser/zwoelftes-haus', '12. Haus'],
      ['#astrologie/aspekte/opposition', 'Opposition'],
      ['#astrologie/grundlagen/was-astrologie-ist', 'Was Astrologie ist'],
      ['#astrologie/beispiele/beispiel-mira', 'Mira'],
      ['#astrologie/lernpfad/orientierung', 'Stufe 1'],
      ['#astrologie/glossar/orbis', 'Orbis'],
      ['#astrologie/faq/ist-astrologie-wissenschaftlich', 'Ist Astrologie wissenschaftlich?'],
    ];
    for (const [hash, needle] of targets) {
      await page.goto('about:blank');
      await openArea(page, hash);
      const content = await page.locator('#astrologieRoot').textContent();
      expect(content, `${hash} must render "${needle}"`).toContain(needle);
    }
    // Glossary and FAQ keep their index page but must select the linked entry.
    await openArea(page, '#astrologie/glossar/orbis');
    await expect(page.locator('#astrologieRoot .astro-term--selected h2')).toContainText('Orbis');
    await openArea(page, '#astrologie/faq/ist-astrologie-wissenschaftlich');
    await expect(page.locator('#astrologieRoot details#faq-ist-astrologie-wissenschaftlich')).toHaveAttribute(
      'open',
      ''
    );
  });

  test('an unknown path stays inside the area and offers real exits', async ({ page }) => {
    await openArea(page, '#astrologie/zeichen/gibtesnicht');
    await expect(page.locator('#astrologieRoot h1#astro-title')).toContainText('gibt es nicht');
    await page.locator('#astrologieRoot a[href="#astrologie"]').first().click();
    await expect(page.locator('#astrologieRoot h1#astro-title')).toContainText('Astrologie');
    // No site-wide dead-link notice: the area answers for itself.
    await expect(page.locator('#routeNotice')).toBeHidden();
  });
});

test.describe('Astrologie — Filter, Suche, Zustand', () => {
  test('element filter and search narrow the sign list and survive reload', async ({ page }) => {
    await openArea(page, '#astrologie/zeichen');
    await page.locator('#astrologieRoot a.astro-filter-chip', { hasText: 'Wasser' }).first().click();
    await expect(page.locator('#astrologieRoot .astro-card')).toHaveCount(3);
    expect(new URL(page.url()).hash).toContain('element=element-wasser');
    expect(await page.locator('#astrologieRoot .astro-result-count').textContent()).toContain('3 von 12');

    await page.reload({ waitUntil: 'load' });
    await page.locator('#astrologieRoot h1#astro-title').waitFor();
    await expect(page.locator('#astrologieRoot .astro-card')).toHaveCount(3);

    await page.locator('#astrologieRoot input[type="search"]').fill('zzzz');
    await expect(page.locator('#astrologieRoot #astro-empty')).toBeVisible();
    await expect(page.locator('#astrologieRoot .astro-card')).toHaveCount(0);
    // The input keeps focus while the list re-renders.
    expect(await page.evaluate(() => document.activeElement?.getAttribute('type'))).toBe('search');

    await page.locator('#astrologieRoot a', { hasText: 'Filter zurücksetzen' }).first().click();
    await expect(page.locator('#astrologieRoot .astro-card')).toHaveCount(12);
  });

  test('full-text search groups hits and shows a real empty state', async ({ page }) => {
    await openArea(page, '#astrologie/suche');
    await page.locator('#astrologieRoot form[data-astro-form="suche"] input').fill('mond');
    await page.locator('#astrologieRoot form[data-astro-form="suche"] button').click();
    await expect(page.locator('#astrologieRoot .astro-result-count')).toContainText('Treffer');
    expect(await page.locator('#astrologieRoot #astro-suche-faktoren').count()).toBe(1);
    expect(await page.locator('#astrologieRoot #astro-suche-glossar').count()).toBeGreaterThan(0);

    await page.locator('#astrologieRoot form[data-astro-form="suche"] input').fill('xyzzy');
    await page.locator('#astrologieRoot form[data-astro-form="suche"] button').click();
    await expect(page.locator('#astrologieRoot .astro-empty-state')).toBeVisible();
    await expect(page.locator('#astrologieRoot .astro-empty-suggestions a')).toHaveCount(3);
    // Diacritics do not matter: "gross" must find "groß".
    await page.locator('#astrologieRoot form[data-astro-form="suche"] input').fill('gross');
    await page.locator('#astrologieRoot form[data-astro-form="suche"] button').click();
    await expect(page.locator('#astrologieRoot .astro-result-count')).not.toContainText('Keine Treffer');
  });

  test('source markers lead into the ledger entry', async ({ page }) => {
    await openArea(page, '#astrologie/zeichen/widder');
    await page.locator('#astrologieRoot details.astro-details--sources summary').click();
    const marker = page.locator('#astrologieRoot a.astro-marker').first();
    await expect(marker).toBeVisible();
    const href = await marker.getAttribute('href');
    await marker.click();
    await page.locator('#astrologieRoot .astro-source-card.is-target').waitFor({ state: 'visible' });
    expect(new URL(page.url()).hash).toBe(href.replace(/^\//, ''));
    await expect(page.locator('#astrologieRoot .astro-title')).toContainText('Quellen und Claims');
  });
});

test.describe('Astrologie — Tastatur, Fokus, Dialogverhalten', () => {
  test('table of contents, details and letter jump are keyboard operable', async ({ page }) => {
    await openArea(page, '#astrologie/zeichen/widder');
    // TOC links must not change the hash (the router would treat them as routes).
    const hashBefore = new URL(page.url()).hash;
    await page.locator('#astrologieRoot .astro-toc a').first().focus();
    await page.keyboard.press('Enter');
    expect(new URL(page.url()).hash).toBe(hashBefore);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('astro-zeichen-bild');

    // Details open with the keyboard (the FAQ is a list of real <details>).
    await openArea(page, '#astrologie/faq');
    const details = page.locator('#astrologieRoot details.astro-faq-item').first();
    const summary = details.locator('summary');
    await summary.focus();
    const before = await details.evaluate((node) => node.open);
    await page.keyboard.press('Enter');
    expect(await details.evaluate((node) => node.open)).toBe(!before);

    await openArea(page, '#astrologie/glossar');
    await page.locator('#astrologieRoot button[data-astro-letter="O"]').click();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('glossar-O');
  });

  test('skip link keeps the astrology view visible and focuses main', async ({ page }) => {
    await page.goto('about:blank');
    await openArea(page, '#astrologie/zeichen');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('main');
    await expect(page.locator('#astrologie.active:not([hidden])')).toBeVisible();
    expect((await page.locator('#astrologieRoot').textContent()).length).toBeGreaterThan(2000);
  });
});

test.describe('Astrologie — Lesbarkeit und Payload', () => {
  for (const width of [375, 768, 1440]) {
    test(`no horizontal overflow at ${width}px in index, detail and glossary`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const hash of ['#astrologie', '#astrologie/zeichen', '#astrologie/zeichen/widder', '#astrologie/glossar']) {
        await page.goto('about:blank');
        await openArea(page, hash);
        const overflow = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth > window.innerWidth,
          components: [
            ...document.querySelectorAll(
              '#astrologieRoot .astro-card, #astrologieRoot .astro-meta, #astrologieRoot .astro-details, #astrologieRoot .astro-source-card'
            ),
          ]
            .filter((node) => node.scrollWidth > node.clientWidth + 1)
            .map((node) => node.className),
        }));
        expect(overflow.document, `${hash} at ${width}px overflows the document`).toBe(false);
        expect(overflow.components, `${hash} at ${width}px has inner overflow`).toEqual([]);
      }
    });
  }

  test('body text contrast meets 4.5:1 on the dark background', async ({ page }) => {
    await openArea(page, '#astrologie/zeichen/widder');
    const ratio = await page.evaluate(() => {
      const parse = (value) =>
        value
          .match(/\d+(\.\d+)?/g)
          .slice(0, 3)
          .map(Number);
      const luminance = ([r, g, b]) => {
        const channel = (c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const background = luminance(parse(getComputedStyle(document.body).backgroundColor));
      const sample = (selector) => {
        const node = document.querySelector(selector);
        const foreground = luminance(parse(getComputedStyle(node).color));
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      };
      return {
        text: sample('#astrologieRoot .astro-text'),
        meta: sample('#astrologieRoot .astro-meta dt'),
        title: sample('#astrologieRoot h1'),
      };
    });
    expect(ratio.text).toBeGreaterThanOrEqual(4.5);
    expect(ratio.meta).toBeGreaterThanOrEqual(4.5);
    expect(ratio.title).toBeGreaterThanOrEqual(4.5);
  });

  test('the data module is only fetched when the area is opened', async ({ page }) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    expect(requests.some((url) => url.endsWith('/js/data/astrologie.js'))).toBe(false);
    await page.locator('.nav-link[data-page="astrologie"]').click();
    await page.locator('#astrologieRoot h1#astro-title').waitFor();
    expect(requests.some((url) => url.endsWith('/js/data/astrologie.js'))).toBe(true);
  });
});
