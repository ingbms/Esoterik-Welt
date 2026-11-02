// Astrologie — Datenmodell ohne DOM.
//
// Baut aus dem generierten Datenmodul (js/data/astrologie.js) die Nachschlage-
// indizes, die Querverweis-Auflösung, die Suche und die Filter. Bewusst frei von
// Browser-APIs, damit die Vollständigkeit und die Trefferlogik in Node prüfbar
// sind. Der Router bleibt in js/main.js; hier entstehen nur Ziele, keine
// Navigation.

import { ROUTE } from './astrologie-format.js';

// Anzeigenamen für die in den Daten verwendeten IDs. Keine Ableitung aus den
// Zieltexten: Die Beschriftung muss auch dann stimmen, wenn ein Zieltext fehlt.
export const LABEL = {
  'element-feuer': 'Feuer',
  'element-erde': 'Erde',
  'element-luft': 'Luft',
  'element-wasser': 'Wasser',
  'modalitaet-kardinal': 'Kardinal',
  'modalitaet-fix': 'Fix',
  'modalitaet-veraenderlich': 'Veränderlich',
  yang: 'Yang',
  yin: 'Yin',
  leuchtkoerper: 'Leuchtkörper',
  planet: 'Planet',
  zwergplanet: 'Zwergplanet',
  winkelhaus: 'Winkelhaus',
  sukzedentenhaus: 'Sukzedentenhaus',
  kadentenhaus: 'Kadentenhaus',
  unter_dem_horizont: 'Unter dem Horizont',
  ueber_dem_horizont: 'Über dem Horizont',
  grundlagen: 'Grundlagen',
  vertiefung: 'Vertiefung',
  nachschlagen: 'Nachschlagen',
  traditionell: 'traditionell',
  modern: 'modern',
};

export const label = (key) => LABEL[key] || key || '';

// Bereich, in dem ein Datensatz angezeigt wird. Bestimmt Zielroute, Kategorie-
// text und Reihenfolge der Suche.
export const CATEGORY = {
  zeichen: { title: 'Zeichen', route: ROUTE.zeichen, plural: 'Zeichen' },
  faktoren: { title: 'Faktoren', route: ROUTE.faktoren, plural: 'Faktoren' },
  haeuser: { title: 'Häuser', route: ROUTE.haeuser, plural: 'Häuser' },
  aspekte: { title: 'Aspekte', route: ROUTE.aspekte, plural: 'Aspekte' },
  grundlagen: { title: 'Grundlagen', route: ROUTE.grundlagen, plural: 'Grundlagen' },
  beispiele: { title: 'Synthesebeispiele', route: ROUTE.beispiele, plural: 'Beispiele' },
  faq: { title: 'FAQ', route: ROUTE.faq, plural: 'Fragen' },
  glossar: { title: 'Glossar', route: ROUTE.glossar, plural: 'Begriffe' },
  lernpfad: { title: 'Lernpfad', route: ROUTE.lernpfad, plural: 'Stufen' },
  quellen: { title: 'Quellen', route: ROUTE.quellen, plural: 'Quellen' },
  claims: { title: 'Claims', route: ROUTE.quellen, plural: 'Claims' },
};

export const itemTitle = (dataset, item) => {
  if (!item) return '';
  switch (dataset) {
    case 'beispiele':
      return item.titel;
    case 'faq':
      return item.frage;
    case 'glossar':
      return item.term;
    case 'lernpfad':
      return item.title;
    case 'quellen':
      return `${item.id} · ${item.titel}`;
    case 'claims':
      return `Claim ${item.id}`;
    default:
      return item.name || item.title || item.id;
  }
};

export const itemShort = (dataset, item) => {
  if (!item) return '';
  switch (dataset) {
    case 'beispiele':
      return item.synthese;
    case 'faq':
      return item.short_answer;
    case 'glossar':
      return item.definition;
    case 'lernpfad':
      return item.goal;
    case 'quellen':
      return item.kurzzitat || item.herausgeber;
    case 'claims':
      return item.aussage;
    default:
      return item.short || '';
  }
};

/** Suchnormalisierung: Groß/Klein, Akzente, ß, Satzzeichen. */
export function normalize(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const SEARCH_FIELDS = [
  'zeichen',
  'faktoren',
  'haeuser',
  'aspekte',
  'grundlagen',
  'beispiele',
  'faq',
  'glossar',
  'lernpfad',
];

export function createModel(data) {
  const datasets = {
    zeichen: data.ZEICHEN,
    faktoren: data.FAKTOREN,
    haeuser: data.HAEUSER,
    aspekte: data.ASPEKTE,
    grundlagen: data.GRUNDLAGEN,
    beispiele: data.BEISPIELE,
    faq: data.FAQ,
    glossar: data.GLOSSAR,
    lernpfad: data.LERNPFAD,
    quellen: data.QUELLEN,
    claims: data.CLAIMS,
  };

  const byId = new Map();
  const bySlug = new Map();
  for (const [dataset, items] of Object.entries(datasets)) {
    for (const item of items) {
      if (byId.has(item.id)) throw new Error(`doppelte ID: ${item.id}`);
      byId.set(item.id, { dataset, item });
      if (item.slug) {
        if (bySlug.has(item.slug)) throw new Error(`doppelter Slug: ${item.slug}`);
        bySlug.set(item.slug, { dataset, item });
      }
    }
  }

  const hrefFor = (dataset, item) => {
    if (dataset === 'quellen') return ROUTE.quellen(item.id);
    if (dataset === 'claims') return `#astrologie/quellen?claim=${encodeURIComponent(item.id)}`;
    const entry = CATEGORY[dataset];
    return entry && item.slug ? entry.route(item.slug) : ROUTE.hub;
  };

  const find = (ref) => byId.get(ref) || bySlug.get(ref) || null;

  /** Querverweis auflösen. Unbekannte Ziele werden nicht verlinkt, sondern als Text geführt. */
  function resolve(ref) {
    const hit = find(ref);
    if (!hit) return { found: false, href: null, label: String(ref), dataset: null, item: null };
    return {
      found: true,
      href: hrefFor(hit.dataset, hit.item),
      label: itemTitle(hit.dataset, hit.item),
      dataset: hit.dataset,
      item: hit.item,
    };
  }

  function findBySlug(dataset, slug) {
    const hit = bySlug.get(slug);
    if (!hit || hit.dataset !== dataset) return null;
    return hit.item;
  }

  // --- Suchindex ---------------------------------------------------------
  const index = [];
  for (const dataset of SEARCH_FIELDS) {
    for (const item of datasets[dataset]) {
      const title = itemTitle(dataset, item);
      const short = itemShort(dataset, item);
      index.push({
        dataset,
        id: item.id,
        slug: item.slug,
        title,
        short,
        href: hrefFor(dataset, item),
        category: CATEGORY[dataset].title,
        haystack: normalize(
          [title, item.name, item.title, item.frage, item.term, short, (item.keywords || []).join(' ')].join(' ')
        ),
        titleKey: normalize(title),
      });
    }
  }

  /**
   * Suche über alle Wissensbereiche. Treffer werden nach Relevanz sortiert
   * (Titelanfang, Titel enthält, Stichwort/Text) und bei mehr als 50 Treffern
   * gekappt — der Aufrufer zeigt dann „Suche verfeinern“.
   */
  function search(query, { limit = 50 } = {}) {
    const q = normalize(query);
    if (!q) return { query: '', total: 0, results: [], truncated: false };
    const terms = q.split(' ').filter(Boolean);
    const hits = [];
    for (const entry of index) {
      if (!terms.every((term) => entry.haystack.includes(term))) continue;
      let score = 0;
      if (entry.titleKey === q) score = 100;
      else if (entry.titleKey.startsWith(q)) score = 80;
      else if (entry.titleKey.includes(q)) score = 60;
      else score = 30;
      if (entry.dataset === 'glossar') score -= 1;
      hits.push({ ...entry, score });
    }
    hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'de'));
    return { query, total: hits.length, results: hits.slice(0, limit), truncated: hits.length > limit };
  }

  // --- Zeichenfilter -----------------------------------------------------
  function filterZeichen({ element = 'all', modality = 'all', q = '' } = {}) {
    const needle = normalize(q);
    return datasets.zeichen.filter((item) => {
      if (element !== 'all' && item.element !== element) return false;
      if (modality !== 'all' && item.modality !== modality) return false;
      if (!needle) return true;
      return normalize([item.name, item.short, (item.keywords || []).join(' ')].join(' ')).includes(needle);
    });
  }

  function filterGlossar(q = '') {
    const needle = normalize(q);
    if (!needle) return datasets.glossar;
    return datasets.glossar.filter((item) => normalize(`${item.term} ${item.definition}`).includes(needle));
  }

  function filterGrundlagen(level = 'all', q = '') {
    const needle = normalize(q);
    return datasets.grundlagen.filter((item) => {
      if (level !== 'all' && item.level !== level) return false;
      if (!needle) return true;
      return normalize(`${item.name} ${item.title} ${item.short} ${(item.keywords || []).join(' ')}`).includes(needle);
    });
  }

  function filterFaktoren(q = '') {
    const needle = normalize(q);
    if (!needle) return datasets.faktoren;
    return datasets.faktoren.filter((item) =>
      normalize(`${item.name} ${item.short} ${(item.keywords || []).join(' ')}`).includes(needle)
    );
  }

  return {
    data,
    meta: data.META,
    datasets,
    byId,
    bySlug,
    find,
    resolve,
    findBySlug,
    hrefFor,
    search,
    filterZeichen,
    filterGlossar,
    filterGrundlagen,
    filterFaktoren,
    counts: {
      zeichen: datasets.zeichen.length,
      faktoren: datasets.faktoren.length,
      haeuser: datasets.haeuser.length,
      aspekte: datasets.aspekte.length,
      grundlagen: datasets.grundlagen.length,
      beispiele: datasets.beispiele.length,
      faq: datasets.faq.length,
      glossar: datasets.glossar.length,
      lernpfad: datasets.lernpfad.length,
      quellen: datasets.quellen.length,
      claims: datasets.claims.length,
    },
  };
}
