// Radiästhesie-Modul — Suchmaschinen-Metadaten und statische Adressen.
//
// Eine Quelle für: Dokumentadressen, Canonicals, Sitemap-Einträge und die
// Titelgrenze. Der statische Generator (scripts/generate-radiasthesie-pages.cjs),
// der Browser (js/modules/radiasthesie.js) und die Prüfungen lesen dieselbe
// Liste — so kann keine Adresse auseinanderlaufen.
//
// Grundsatz: Hash-Routen sind Ansichten von index.html, keine Dokumente. Sie
// bekommen weder Canonical noch Sitemap-Eintrag. Die indexierbaren Dokumente
// dieses Bereichs sind die Dateien unter radiasthesie/.

export const SITE_ORIGIN = 'https://ingbms.github.io';
export const SITE_PATH = '/Esoterik-Welt/';
export const SITE_BASE = SITE_ORIGIN + SITE_PATH;
export const SITE_NAME = 'Esoterik-Welt';

// Titelgrenze: Google kürzt Titel nach Pixelbreite, nicht nach Zeichen. 60
// Zeichen sind eine Näherung für ~600 px bei 16 px Schrift; sie ist hier als
// Projektgrenze gesetzt und wird zusätzlich im Browser gemessen
// (tests/radiasthesie-statisch.spec.js). Kein hartes Limit von Google.
export const TITLE_LIMIT = 60;

// Meta-Description: maximal 160 Zeichen (bestehender Generator-Grenzwert).
export const DESCRIPTION_LIMIT = 160;
export const DESCRIPTION_MIN = 100;

export const TOPIC_SLUGS = ['radiasthesie', 'pendeln', 'orakel'];

// Die indexierbaren Dokumente. `url` ist die kanonische Adresse unter SITE_BASE,
// `file` der Pfad im Repository bzw. in dist/Esoterik-Welt.
export const STATIC_DOCS = [
  {
    id: 'landing',
    kind: 'landing',
    route: '#pendeln',
    url: 'radiasthesie/',
    file: 'radiasthesie/index.html',
    nav: 'Übersicht',
  },
  {
    id: 'radiasthesie',
    kind: 'topic',
    slug: 'radiasthesie',
    route: '#pendeln/radiasthesie',
    url: 'radiasthesie/radiasthesie.html',
    file: 'radiasthesie/radiasthesie.html',
    nav: 'Radiästhesie',
  },
  {
    id: 'pendeln',
    kind: 'topic',
    slug: 'pendeln',
    route: '#pendeln/pendeln',
    url: 'radiasthesie/pendeln.html',
    file: 'radiasthesie/pendeln.html',
    nav: 'Pendeln',
  },
  {
    id: 'orakel',
    kind: 'topic',
    slug: 'orakel',
    route: '#pendeln/orakel',
    url: 'radiasthesie/orakel.html',
    file: 'radiasthesie/orakel.html',
    nav: 'Orakel',
  },
  {
    id: 'glossar',
    kind: 'glossar',
    route: '#pendeln/glossar',
    url: 'radiasthesie/glossar.html',
    file: 'radiasthesie/glossar.html',
    nav: 'Glossar',
  },
  {
    id: 'quellen',
    kind: 'quellen',
    route: '#pendeln/quellen',
    url: 'radiasthesie/quellen.html',
    file: 'radiasthesie/quellen.html',
    nav: 'Quellen',
  },
  {
    id: 'methodik',
    kind: 'methodik',
    route: '#pendeln/methodik',
    url: 'radiasthesie/methodik.html',
    file: 'radiasthesie/methodik.html',
    nav: 'Methodik',
  },
];

// Dokumente außerhalb des Themenmoduls. `lastmod` wird nur dort gepflegt, wo
// sich die Datei tatsächlich ändert — keine erfundenen Änderungsdaten.
export const ROOT_DOCS = [
  { id: 'home', url: '', file: 'index.html', lastmod: '2026-11-02' },
  { id: 'impressum', url: 'impressum.html', file: 'impressum.html', lastmod: '2026-11-01' },
  { id: 'datenschutz', url: 'datenschutz.html', file: 'datenschutz.html', lastmod: '2026-11-01' },
  { id: 'haftung', url: 'haftung.html', file: 'haftung.html', lastmod: '2026-11-01' },
];

/** Absolute Adresse eines Dokumentpfads relativ zur Projektbasis. */
export function absoluteUrl(url = '') {
  return SITE_BASE + url;
}

/**
 * BreadcrumbList ohne Fragmentadressen. Die aktuelle Seite trägt `url: null`
 * und damit keine `item`-Eigenschaft; alle anderen Einträge müssen auf ein
 * echtes Dokument zeigen. Eine Hash-Adresse ist hier ein Fehler, kein Detail:
 * Suchmaschinen ignorieren Fragmente und lesen sie als dieselbe Seite.
 */
export function breadcrumbList(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: (trail || []).map((entry, index) => {
      const item = entry.url == null ? null : absoluteUrl(entry.url);
      if (item && item.includes('#')) {
        throw new Error(`BreadcrumbList enthält eine Fragmentadresse: ${item}`);
      }
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: entry.label,
        ...(item ? { item } : {}),
      };
    }),
  };
}

/**
 * Titel mit Markensuffix, aber nur solange die Projektgrenze hält. Der
 * Markenname ist auf der Startseite sinnvoll; auf Unterseiten kostet er
 * Zeichen, die der eigentliche Titel besser nutzt.
 */
export function pageTitle(viewTitle, { siteName = SITE_NAME, limit = TITLE_LIMIT } = {}) {
  const base = String(viewTitle || '').trim();
  if (!base) return siteName;
  const branded = `${base} | ${siteName}`;
  return branded.length <= limit ? branded : base;
}

/** Dokument zu einer Modulroute (Ergebnis von model.resolve) oder null. */
export function docForRoute(route) {
  if (!route || !route.view) return null;
  if (route.view === 'landing') return STATIC_DOCS.find((doc) => doc.kind === 'landing') || null;
  if (route.view === 'topic') {
    const slug = route.topic && route.topic.slug;
    return STATIC_DOCS.find((doc) => doc.kind === 'topic' && doc.slug === slug) || null;
  }
  if (['glossar', 'quellen', 'methodik'].includes(route.view)) {
    return STATIC_DOCS.find((doc) => doc.kind === route.view) || null;
  }
  return null;
}

/**
 * Canonical einer Modulansicht. Gibt es ein statisches Dokument, ist es die
 * kanonische Adresse; Werkzeuge und Suche bleiben Teil von index.html.
 */
export function canonicalForRoute(route) {
  const doc = docForRoute(route);
  return doc ? absoluteUrl(doc.url) : SITE_BASE;
}

/** Alle indexierbaren Dokumente in Sitemap-Reihenfolge. */
export function sitemapDocs(generatedLastmod) {
  return [
    ...ROOT_DOCS,
    ...STATIC_DOCS.map((doc) => ({
      id: doc.id,
      url: doc.url,
      file: doc.file,
      lastmod: generatedLastmod,
    })),
  ];
}
