// Statische Themenseiten — Browsertest ohne JavaScript.
//
// Der Kern der Abnahme: Die Dokumente unter radiasthesie/ müssen ihre Inhalte
// ohne Skriptausführung zeigen. Deshalb laufen diese Prüfungen mit
// javaScriptEnabled:false: Titel, Canonical, strukturierte Daten, Kapiteltext,
// Bilder und interne Navigation müssen aus dem ausgelieferten HTML kommen.
//
// Zusätzlich wird die Titelgrenze nicht nur gezählt, sondern gemessen: 60
// Zeichen sind eine Näherung; die Pixelbreite bei 16 px Arial entscheidet in
// der Ergebnisliste. Die Messung ist ein Proxy, keine Google-Zusage.

const { test, expect } = require('playwright/test');

const { E2E_BASE_URL: BASE } = require('./helpers/e2e-target.cjs');
const SITE = 'https://ingbms.github.io/Esoterik-Welt/';

const DOCS = [
  {
    id: 'landing',
    route: 'radiasthesie/',
    title: 'Radiästhesie, Pendeln und Orakel — Tradition und Prüfstand',
    h1: 'Radiästhesie, Pendeln und Orakel',
    probe: 'Drei Zugänge, ein Zusammenhang',
    type: 'CollectionPage',
  },
  {
    id: 'radiasthesie',
    route: 'radiasthesie/radiasthesie.html',
    title: 'Radiästhesie — Ruten, Geschichte und Forschungsstand',
    h1: 'Radiästhesie',
    probe: 'Was ist Radiästhesie?',
    type: 'WebPage',
  },
  {
    id: 'pendeln',
    route: 'radiasthesie/pendeln.html',
    title: 'Pendeln — Arten, Materialien, Tafeln und Bovis-Skalen',
    h1: 'Pendeln',
    probe: 'Was ein Pendel in der Praxis tun soll',
    type: 'WebPage',
  },
  {
    id: 'orakel',
    route: 'radiasthesie/orakel.html',
    title: 'Orakel — Pendelorakel, Tarot, Runen und I Ging im Vergleich',
    h1: 'Orakel',
    probe: 'Divination: Warum Menschen Zeichen lesen',
    type: 'WebPage',
  },
  {
    id: 'glossar',
    route: 'radiasthesie/glossar.html',
    title: 'Glossar — Radiästhesie, Pendeln und Orakel von A bis Z',
    h1: 'Glossar',
    probe: 'Biotensor',
    type: 'WebPage',
  },
  {
    id: 'quellen',
    route: 'radiasthesie/quellen.html',
    title: 'Quellen und Belege — Radiästhesie und Pendeln',
    h1: 'Quellen & Belege',
    probe: 'Wie geprüft wurde',
    type: 'WebPage',
  },
  {
    id: 'methodik',
    route: 'radiasthesie/methodik.html',
    title: 'Methodik und Grenzen — wie dieser Bereich prüft',
    h1: 'Methodik & Grenzen',
    probe: 'Arbeitsannahme',
    type: 'WebPage',
  },
];

const url = (route) => `${BASE}/${route}`;

test.describe('statische Dokumente ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const doc of DOCS) {
    test(`${doc.id}: Kopf, Struktur und Kerntext ohne Skript`, async ({ page }) => {
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(String(error)));
      const response = await page.goto(url(doc.route), { waitUntil: 'load' });
      expect(response.status()).toBe(200);
      await expect(page).toHaveTitle(doc.title);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(doc.h1);
      await expect(page.locator('main')).toContainText(doc.probe);

      const head = await page.evaluate(() => ({
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
        scripts: [...document.querySelectorAll('script')].map((node) => node.getAttribute('type') || ''),
        ld: document.querySelector('script[type="application/ld+json"]')?.textContent || '',
        images: [...document.querySelectorAll('img')].map((img) => ({
          alt: img.getAttribute('alt'),
          src: img.getAttribute('src'),
          loaded: img.complete && img.naturalWidth > 0,
        })),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        wordBreaks: [...document.querySelectorAll('.astro-text')].every(
          (node) => node.getBoundingClientRect().right <= window.innerWidth + 1
        ),
        titleWidth: (() => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          context.font = '16px Arial';
          return context.measureText(document.title).width;
        })(),
        breadcrumb: [...document.querySelectorAll('.astro-breadcrumb li')].map((node) => node.textContent.trim()),
      }));

      expect(head.canonical).toBe(`${SITE}${doc.route}`);
      expect(head.ogUrl).toBe(head.canonical);
      expect(head.robots).toBe('index,follow');
      expect(head.description.length).toBeGreaterThanOrEqual(100);
      expect(head.description.length).toBeLessThanOrEqual(160);
      expect(doc.title.length).toBeLessThanOrEqual(60);
      // Gemessene Breite statt nur Zeichenzahl (Grenze ~600 px bei 16 px).
      expect(head.titleWidth).toBeLessThanOrEqual(600);
      // Nur JSON-LD, kein ausführbares Skript.
      expect(head.scripts).toEqual(['application/ld+json']);
      const json = JSON.parse(head.ld);
      const types = json['@graph'].map((node) => node['@type']);
      expect(types).toContain(doc.type);
      expect(types).toContain('BreadcrumbList');
      expect(types).not.toContain('Article');
      expect(types).not.toContain('FAQPage');
      expect(head.ld).not.toContain('"#pendeln');
      expect(head.breadcrumb.length).toBeGreaterThanOrEqual(2);
      expect(head.breadcrumb.at(-1)).toContain(doc.h1.split(' & ')[0]);
      for (const image of head.images) {
        expect(image.alt && image.alt.trim().length).toBeGreaterThan(20);
        expect(image.loaded, `Bild nicht geladen: ${image.src}`).toBe(true);
      }
      expect(head.overflow).toBe(0);
      expect(head.wordBreaks).toBe(true);
      expect(errors).toEqual([]);

      // Mobile: derselbe Inhalt, kein horizontales Scrollen.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload({ waitUntil: 'load' });
      await expect(page.locator('h1')).toHaveText(doc.h1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    });
  }

  test('interne Navigation funktioniert ohne JavaScript', async ({ page }) => {
    await page.goto(url('radiasthesie/'), { waitUntil: 'load' });
    // Brotkrümel zurück zur Startseite.
    await page.locator('.astro-breadcrumb a', { hasText: 'Start' }).click();
    await expect(page).toHaveTitle(/Esoterik-Welt/);

    await page.goto(url('radiasthesie/pendeln.html'), { waitUntil: 'load' });
    // Themennavigation: Radiästhesie → Quellenverzeichnis → zurück.
    await page.locator('.rad-static-nav a', { hasText: 'Radiästhesie' }).click();
    await expect(page).toHaveTitle('Radiästhesie — Ruten, Geschichte und Forschungsstand');
    await page.locator('.rad-static-nav a', { hasText: 'Quellen' }).click();
    await expect(page.locator('h1')).toHaveText('Quellen & Belege');
    // Quellenmarker im Text springen auf die Quelle.
    await page.goto(url('radiasthesie/pendeln.html'), { waitUntil: 'load' });
    await page.locator('.rad-cite').first().click();
    await expect(page.locator('h1')).toHaveText('Quellen & Belege');
    expect(page.url()).toMatch(/quellen\.html#quelle-Q\d{2}$/);
    await expect(page.locator('.astro-source-card.is-target, .astro-source-card:target').first()).toBeVisible();
    // Der Weg in die Anwendung bleibt ein echter Link (kein toter Hash).
    const appLink = await page.locator('.rad-static-app').getAttribute('href');
    expect(appLink).toBe('../#pendeln');
  });

  test('Sitemap und SPA-Canonical widersprechen sich nicht', async ({ browser, request }) => {
    // Dieser Test braucht JavaScript; er öffnet deshalb einen eigenen Kontext.
    const context = await browser.newContext({ javaScriptEnabled: true });
    const page = await context.newPage();
    const sitemap = await (await request.get(`${BASE}/sitemap.xml`)).text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs.length).toBe(11);
    expect(locs.every((loc) => !loc.includes('#'))).toBe(true);
    for (const doc of DOCS) expect(locs).toContain(`${SITE}${doc.route}`);

    // Die SPA-Ansicht nennt als Canonical das statische Dokument, nicht den Hash.
    await page.goto(`${BASE}/#pendeln/pendeln`, { waitUntil: 'networkidle' });
    await expect(page.locator('#pendelnRoot h1')).toHaveText('Pendeln');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE}radiasthesie/pendeln.html`);
    const ld = JSON.parse(await page.locator('#pendeln-breadcrumb-ld').textContent());
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(JSON.stringify(ld)).not.toMatch(/"#pendeln/);
    expect(ld.itemListElement.at(-1).item).toBeUndefined();

    // Zurück auf eine andere Seite: Canonical fällt auf das Einzeldokument zurück.
    await page.goto(`${BASE}/#tarot`, { waitUntil: 'networkidle' });
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(SITE);
    await context.close();
  });
});
