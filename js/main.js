// Esoterik-Welt — Main Entry Point
// Initializes the app, handles routing, and coordinates modules

import { TarotModule } from './modules/tarot.js';
import { initCrystalsModule } from './modules/crystals.js';
import { MoonModule } from './modules/moon.js';
import { RunesModule } from './modules/runes.js';
import { BlogModule } from './modules/blog.js';
import { AstrologieModule } from './modules/astrologie.js';
import { DialogController } from './dialog.js';

// --- State ---
const state = {
  currentPage: 'home',
  modules: {},
};

// --- Routes ---
// Only these ids are pages. #main is the skip target inside the document and
// must never become a page id; unknown fragments must never hide every section.
const MAIN_PAGES = ['home', 'tarot', 'crystals', 'moon', 'runes', 'astrologie', 'blog'];
const PAGE_IDS = new Set(MAIN_PAGES);
const SKIP_ANCHOR = 'main';
const ARTICLE_ROUTE = /^blog\/([^/]+)$/;
// The astrology area is one page with its own sub-routes:
// #astrologie, #astrologie/zeichen, #astrologie/zeichen/widder,
// #astrologie/suche?q=mond … Everything after "astrologie" is handed to the
// area module, which answers unknown slugs with its own in-area error view
// instead of the site-wide route notice.
const ASTROLOGIE_ROUTE = /^astrologie(?:\/([^?]*))?(?:\?(.*))?$/;

// --- Per-route metadata ---
// Every view lives in one document, so the title and the description have to
// follow the active route instead of claiming the start page on all of them.
const SITE_NAME = 'Esoterik-Welt';
const PAGE_META = {
  home: {
    title: 'Esoterik-Welt | Tarot, Kristalle, Runen, Mondphasen & Mehr',
    description: 'Esoterik-Welt — Deine Pforte zu Tarot, Kristallen, Runen, Mondphasen und esoterischem Wissen.',
  },
  tarot: {
    title: 'Tarot — 78 Karten, Tageskarte & Legungen | Esoterik-Welt',
    description:
      'Tarot-Karten ziehen und deuten: 78 Karten der Major und Minor Arcana, Tageskarte und 3-Karten-Legung.',
  },
  crystals: {
    title: 'Kristalle & Steine — Chakra, Farbe, Wirkung | Esoterik-Welt',
    description: 'Kristall-Katalog mit Chakra-, Farb- und Wirkungsfilter: Steine im Überblick, Details und Favoriten.',
  },
  moon: {
    title: 'Mondphasen, Kalender & Deutung | Esoterik-Welt',
    description:
      'Aktuelle Mondphase mit Beleuchtungsgrad, Zeitachse der vier Hauptphasen, Monatskalender mit Tagesdetails und iCal-Export.',
  },
  runes: {
    title: 'Runen — Das ältere Futhark | Esoterik-Welt',
    description: '24 Runen des älteren Futhark: 3-Runen-Wurf, Einzelrune, Deutung und Wurf-Historie.',
  },
  astrologie: {
    title: 'Astrologie — Zeichen, Faktoren, Häuser, Aspekte | Esoterik-Welt',
    description:
      'Astrologie lernen und nachschlagen: zwölf Zeichen, zehn Faktoren, zwölf Häuser, fünf Hauptaspekte, Lernpfad, Glossar und FAQ — ohne Berechnung, ohne Geburtsdaten.',
  },
  blog: {
    title: 'Wissen & Artikel — Esoterik, Rituale, Geschichte | Esoterik-Welt',
    description:
      'Artikel zu Esoterik, Spiritualität und alter Weisheit: Tarot, Kristalle, Runen, Mondzyklen und Rituale.',
  },
};

function setMetaContent(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.setAttribute('content', value);
}

// An open article is its own route, so its title replaces the list title.
function applyRouteMeta(pageId, article = null) {
  const meta = PAGE_META[pageId] || PAGE_META.home;
  const title = article ? `${article.title} — ${SITE_NAME}` : meta.title;
  const description = article ? String(article.excerpt || meta.description) : meta.description;
  document.title = title;
  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[name="twitter:title"]', title);
  setMetaContent('meta[name="twitter:description"]', description);
}

// A dialog close may only rewrite history when it was not itself caused by a
// route change (history traversal or an unknown-route fallback).
let suppressArticleUrlSync = false;

function parseRoute(hash) {
  const raw = String(hash == null ? '' : hash)
    .replace(/^#/, '')
    .trim();
  if (!raw) return { type: 'page', page: 'home', raw };
  if (raw === SKIP_ANCHOR) return { type: 'skip', raw };
  const article = ARTICLE_ROUTE.exec(raw);
  if (article) return { type: 'article', page: 'blog', id: article[1], raw };
  // Astrology sub-routes carry their own query (?q=, ?element=…) so filters and
  // search results survive reload, deep links and Back/Forward.
  const astrologie = ASTROLOGIE_ROUTE.exec(raw);
  if (astrologie) {
    return {
      type: 'astrologie',
      page: 'astrologie',
      segments: String(astrologie[1] || '')
        .split('/')
        .filter(Boolean),
      query: astrologie[2] || '',
      raw,
    };
  }
  if (PAGE_IDS.has(raw)) return { type: 'page', page: raw, raw };
  return { type: 'unknown', raw };
}

function resolveArticle(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return null;
  const blog = state.modules.blog;
  return blog && typeof blog.findArticle === 'function' ? blog.findArticle(numeric) : null;
}

// --- DOM Elements ---
const elements = {
  header: document.getElementById('header'),
  nav: document.getElementById('nav'),
  navList: document.getElementById('navList'),
  navToggle: document.getElementById('navToggle'),
  pages: document.querySelectorAll('.page'),
  navLinks: document.querySelectorAll('.nav-link'),
  routeNotice: document.getElementById('routeNotice'),
  routeNoticeText: document.getElementById('routeNoticeText'),
  routeNoticeLink: document.getElementById('routeNoticeLink'),
  modals: {
    card: document.getElementById('cardModal'),
    crystal: document.getElementById('crystalModal'),
    rune: document.getElementById('runeModal'),
    article: document.getElementById('articleModal'),
  },
  modalCloses: {
    card: document.getElementById('closeCardModal'),
    crystal: document.getElementById('closeCrystalModal'),
    rune: document.getElementById('closeRuneModal'),
    article: document.getElementById('closeArticleModal'),
  },
};

// --- Initialize ---
async function init() {
  // Setup navigation
  setupNavigation();

  // Setup modal close handlers
  setupModals();

  // Initialize all modules
  state.modules.tarot = new TarotModule(
    elements.modals.card,
    document.getElementById('cardModalBody'),
    elements.modalCloses.card
  );
  await initCrystalsModule();
  state.modules.moon = new MoonModule();
  state.modules.runes = new RunesModule(
    elements.modals.rune,
    document.getElementById('runeModalBody'),
    elements.modalCloses.rune
  );
  state.modules.blog = new BlogModule(
    elements.modals.article,
    document.getElementById('articleModalBody'),
    elements.modalCloses.article
  );
  // The astrology area renders into its own container. Its content module is
  // loaded lazily (see modules/astrologie.js): on HTTP the data file is only
  // fetched when the area is opened, offline webpack inlines it.
  state.modules.astrologie = new AstrologieModule(document.getElementById('astrologieRoot'));
  // A card-opened article becomes its own history entry, so Back/Forward,
  // reload and the dialog close action stay consistent with the address bar.
  state.modules.blog.onArticleOpened = (id) => {
    const target = `#blog/${id}`;
    const article = resolveArticle(id);
    if (article) applyRouteMeta('blog', article);
    if (location.hash === target) return;
    history.pushState({ page: 'blog', article: id, articleEntry: true }, '', target);
  };

  await Promise.all([
    state.modules.tarot.init(),
    state.modules.moon.init(),
    state.modules.runes.init(),
    state.modules.blog.init(),
  ]);

  // File bundles initialize before the browser's load-time fragment scroll;
  // HTTP modules usually initialize afterwards. Let that native phase finish
  // before establishing the SPA route, then settle without animated scrolling.
  if (document.readyState !== 'complete') {
    await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
  }
  // Apply whatever fragment the address bar carried (page, article deep link,
  // skip anchor or unknown fragment) instead of using it as a page id blindly.
  const initialRoute = parseRoute(location.hash);
  // A cold deep link into the astrology area must render real content before
  // the route settles, so the data module is fetched first (once).
  if (initialRoute.type === 'astrologie') {
    try {
      await state.modules.astrologie.load();
    } catch (error) {
      console.error('Astrologie-Daten nicht verfügbar', error); // the module shows its own error view
    }
  }
  applyRoute(initialRoute, { instant: true, silent: true });
  if (initialRoute.type !== 'skip') settleRouteScroll(state.currentPage);

  // Populate home feature grid
  populateFeatureGrid();

  // Handle scroll effects on header
  window.addEventListener('scroll', onScroll, { passive: true });

  console.log('Esoterik-Welt initialized');
}

// --- Navigation ---
function setupNavigation() {
  // Nav link clicks
  elements.navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
    });
  });

  // Mobile toggle
  elements.navToggle.addEventListener('click', () => {
    const isOpen = elements.nav.classList.toggle('open');
    elements.navToggle.setAttribute('aria-expanded', String(isOpen));
    elements.navToggle.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
  });
  elements.navToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      elements.navToggle.click();
    }
  });

  // Close mobile nav on link click
  elements.navList.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
      elements.nav.classList.remove('open');
      elements.navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close mobile nav on outside click
  document.addEventListener('click', (e) => {
    if (!elements.header.contains(e.target)) {
      elements.nav.classList.remove('open');
      elements.navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Route transitions own scroll position; native restoration would race with
  // showing a previously hidden section. Traversal must not push a new entry.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const restoreRoute = () => {
    const route = parseRoute(location.hash);
    applyRoute(route, { fromHistory: true, instant: true });
    if (route.type !== 'skip') settleRouteScroll(state.currentPage);
  };
  window.addEventListener('popstate', restoreRoute);
  window.addEventListener('hashchange', restoreRoute);

  // The skip link is an in-page anchor (#main), never a route. Activating it
  // must keep the visible section and only move focus into the main region.
  document.querySelectorAll('.skip-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (parseRoute(link.getAttribute('href')).type !== 'skip') return;
      event.preventDefault();
      clearRouteNotice();
      focusMain();
    });
  });
}

function focusMain() {
  const main = document.getElementById('main');
  if (!main) return;
  main.focus({ preventScroll: true });
  const offset = elements.header ? elements.header.getBoundingClientRect().height : 0;
  const top = main.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
}

function showRouteNotice(text, actionLabel, actionHash) {
  const notice = elements.routeNotice;
  if (!notice) return;
  if (elements.routeNoticeText) elements.routeNoticeText.textContent = text;
  if (elements.routeNoticeLink) {
    elements.routeNoticeLink.textContent = actionLabel;
    elements.routeNoticeLink.setAttribute('href', actionHash);
  }
  notice.hidden = false;
}

function clearRouteNotice() {
  if (elements.routeNotice) elements.routeNotice.hidden = true;
}

function isArticleDialogOpen() {
  return !!elements.modals.article && elements.modals.article.classList.contains('open');
}

// Closing a dialog because the route changed must not touch the URL again.
function closeArticleDialogQuietly() {
  if (!isArticleDialogOpen()) return;
  suppressArticleUrlSync = true;
  try {
    elements.modals.article.dialogController.close();
  } finally {
    suppressArticleUrlSync = false;
  }
}

function handleArticleDialogClosed() {
  if (suppressArticleUrlSync) return;
  if (parseRoute(location.hash).type !== 'article') return;
  // Card-opened dialogs are their own history entry: closing returns to #blog.
  // A deep link that already existed keeps its entry and is rewritten instead.
  if (history.state && history.state.articleEntry) history.back();
  else {
    history.replaceState({ page: 'blog' }, '', '#blog');
    applyRouteMeta('blog');
  }
}

function settleRouteScroll(pageId) {
  // Fragment jumps happen after route activation in the same navigation task.
  // Do not move focus, change the hash, or disturb a later route transition.
  requestAnimationFrame(() => {
    if (state.currentPage === pageId) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      onScroll();
    }
  });
}

function applyRoute(route, { fromHistory = false, instant = false, replace = false, silent = false } = {}) {
  if (route.type === 'skip') {
    clearRouteNotice();
    focusMain();
    return;
  }

  const article = route.type === 'article' ? resolveArticle(route.id) : null;
  if (!article) closeArticleDialogQuietly();

  if (route.type === 'page') {
    clearRouteNotice();
    navigateTo(route.page, replace, { fromHistory, instant, silent });
    return;
  }

  if (route.type === 'article') {
    navigateTo('blog', replace, { fromHistory, instant, silent, hash: `#blog/${route.id}` });
    if (article) {
      clearRouteNotice();
      state.modules.blog.openArticleModal(article.id, { updateUrl: false });
      applyRouteMeta('blog', article);
    } else {
      showRouteNotice(`Der Artikel „#blog/${route.id}“ existiert nicht.`, 'Alle Artikel ansehen', '#blog');
    }
    return;
  }

  // The astrology area owns its sub-routes. The router reveals the page and
  // hands the segments over; the area module renders content, title and focus.
  if (route.type === 'astrologie') {
    clearRouteNotice();
    navigateTo('astrologie', replace, {
      fromHistory,
      instant,
      silent,
      hash: `#${route.raw}`,
      subroute: { segments: route.segments, query: route.query },
    });
    return;
  }

  // Unknown fragment: keep a readable page and explain the dead link instead of
  // hiding every section, which left the site looking empty.
  const page = PAGE_IDS.has(state.currentPage) ? state.currentPage : 'home';
  navigateTo(page, false, { fromHistory, instant, silent: true });
  showRouteNotice(`„#${route.raw}“ gehört zu keiner Seite dieser Website.`, 'Zur Startseite', '#home');
}

function navigateTo(
  pageId,
  replace = false,
  { fromHistory = false, instant = false, silent = false, hash = null, subroute = null } = {}
) {
  // Update active states
  elements.pages.forEach((page) => {
    page.classList.toggle('active', page.id === pageId);
    page.hidden = page.id !== pageId;
  });
  elements.navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.page === pageId);
    if (link.dataset.page === pageId) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  state.currentPage = pageId;
  applyRouteMeta(pageId);

  // Scroll to top
  window.scrollTo({
    top: 0,
    behavior: instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });

  // Trigger module-specific work. Areas that render their own sub-views expose
  // show(segments, query); the remaining modules keep their onShow() hook.
  const module = state.modules[pageId];
  if (module && typeof module.show === 'function') {
    const pending = module.show(subroute ? subroute.segments : [], subroute ? subroute.query : '', {
      focus: !silent,
    });
    if (pending && typeof pending.catch === 'function') {
      pending.catch((error) => console.error('Ansicht konnte nicht gerendert werden', error));
    }
  } else if (module && module.onShow) {
    module.onShow();
  }

  // Update URL hash without scroll
  if (!fromHistory && !silent) {
    const target = hash || `#${pageId}`;
    if (replace) {
      history.replaceState({ page: pageId }, '', target);
    } else {
      history.pushState({ page: pageId }, '', target);
    }
  }
}

function onScroll() {
  if (window.scrollY > 50) {
    elements.header.classList.add('scrolled');
  } else {
    elements.header.classList.remove('scrolled');
  }
}

// --- Modals ---
function setupModals() {
  Object.keys(elements.modals).forEach((key) => {
    const modal = elements.modals[key];
    const closeBtn = elements.modalCloses[key];

    new DialogController(modal, closeBtn, key === 'article' ? { onClose: handleArticleDialogClosed } : {});
  });
}

function openModal(key) {
  elements.modals[key].dialogController.open();
}

function closeModal(key) {
  elements.modals[key].dialogController.close();
}

// --- Home Feature Grid (path register) ---
function populateFeatureGrid() {
  const grid = document.getElementById('featureGrid');
  if (!grid) return;

  // No emoji: the register is typographic, numbered 01–06 (Nachtatelier).
  const features = [
    { id: 'tarot', title: 'Tarot', desc: '78 Karten, Major & Minor Arcana, Tageskarte & Legungen' },
    { id: 'crystals', title: 'Kristalle', desc: '30+ Steine mit Chakra-Filter, Wirkungen & Details' },
    { id: 'moon', title: 'Mondphasen', desc: 'Heute-Überblick, Zeitachse, Kalender, acht Phasen & Deutung' },
    {
      id: 'astrologie',
      title: 'Astrologie',
      desc: '12 Zeichen, 10 Faktoren, 12 Häuser, 5 Aspekte, Lernpfad & Glossar',
    },
    { id: 'runes', title: 'Runen', desc: 'Älteres Futhark, 3-Runen-Wurf & Deutung' },
    { id: 'blog', title: 'Wissen', desc: 'Artikel zu Esoterik, Geschichte, Ritualen & Praxis' },
  ];

  grid.innerHTML = features
    .map(
      (f, i) => `
    <article class="feature-card" role="link" data-page="${f.id}">
      <span class="feature-icon" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <div class="feature-body">
        <h3 class="feature-title">${f.title}</h3>
        <p class="feature-desc">${f.desc}</p>
      </div>
      <span class="feature-arrow" aria-hidden="true">↗</span>
    </article>
  `
    )
    .join('');

  grid.querySelectorAll('.feature-card').forEach((card) => {
    card.addEventListener('click', () => navigateTo(card.dataset.page));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo(card.dataset.page);
      }
    });
    card.setAttribute('tabindex', '0');
  });
}

// --- Start ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging
window.EsoterikWelt = { state, navigateTo, openModal, closeModal };
