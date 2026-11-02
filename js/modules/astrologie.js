// Astrologie — Bereichsmodul (Anzeige, Filter, Suche, Fokus).
//
// Dieses Modul rendert in den Container #astrologieRoot. Es entscheidet anhand
// der vom Router übergebenen Segmente, welche Ansicht gilt, und bindet die
// Interaktionen (Suche, Sprungmarken). Der Router selbst bleibt in js/main.js:
// Hier wird nie history.pushState auf eine fremde Route geschrieben.

import { ROUTE } from './astrologie-format.js';
import { createModel } from './astrologie-model.js';
import {
  renderAspekteDetail,
  renderAspekteIndex,
  renderFaktorenDetail,
  renderFaktorenIndex,
  renderHaeuserDetail,
  renderHaeuserIndex,
  renderHub,
  renderLernpfadDetail,
  renderLernpfadIndex,
  renderZeichenDetail,
  renderZeichenIndex,
} from './astrologie-views.js';
import {
  renderBeispieleDetail,
  renderBeispieleIndex,
  renderFaq,
  renderFailure,
  renderGlossar,
  renderGrundlagenDetail,
  renderGrundlagenIndex,
  renderMethodik,
  renderNotFound,
  renderQuellen,
  renderSuche,
} from './astrologie-views-reference.js';

const BASE_HASH = ROUTE.hub;

// Kleiner Debounce für die Live-Filterung: Bei jedem Tastendruck neu zu
// rendern wäre auf schwachen Geräten unnötig, und der Fokus müsste öfter
// wiederhergestellt werden.
function debounce(fn, ms = 120) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
}

export class AstrologieModule {
  constructor(root) {
    this.root = root;
    this.model = null;
    this.loading = null;
    this.renderToken = 0;
    this.lastQuery = '';
  }

  /**
   * Lädt das Datengenerat genau einmal. Der Import ist bewusst dynamisch:
   * unter HTTP wird das Datenmodul erst beim ersten Aufruf geholt, im Offline-
   * Build inlined webpack es (dynamicImportMode eager) in die eine Datei.
   * Scheitert der Import, bleibt nur dieser Bereich defekt.
   */
  async load() {
    if (this.model) return this.model;
    if (!this.loading) {
      this.loading = import('../data/astrologie.js')
        .then((data) => {
          this.model = createModel(data);
          return this.model;
        })
        .catch((error) => {
          this.loading = null;
          throw error;
        });
    }
    return this.loading;
  }

  /**
   * @param {string[]} segments Pfadsegmente hinter #astrologie
   * @param {string} query    Query-String ohne '?' (Filter, Suchbegriff)
   * @param {{focus?: boolean}} options
   */
  async show(segments = [], query = '', { focus = false } = {}) {
    if (!this.root) return;
    const token = ++this.renderToken;
    this.lastQuery = query;
    let view;
    try {
      const ctx = await this.load();
      if (token !== this.renderToken) return;
      view = this.resolveView(ctx, segments, query);
      this.model = ctx;
    } catch (error) {
      if (token !== this.renderToken) return;
      console.error('Astrologiebereich konnte nicht geladen werden', error);
      view = renderFailure('Die Inhaltsdaten konnten nicht geladen werden.');
    }
    this.root.innerHTML = view.html;
    document.title = view.title;
    this.bind(view);
    if (focus) this.focusTitle();
  }

  onShow() {
    return this.show([], '', { focus: false });
  }

  focusTitle() {
    const title = this.root.querySelector('#astro-title');
    if (!title) return;
    title.focus({ preventScroll: true });
  }

  resolveView(ctx, segments, query) {
    const params = new URLSearchParams(query || '');
    const [area, slug] = segments;
    const raw = ['astrologie', ...segments].join('/') + (query ? `?${query}` : '');

    switch (area) {
      case undefined:
        return renderHub(ctx);
      case 'lernpfad': {
        if (!slug) return renderLernpfadIndex(ctx);
        const stage = ctx.findBySlug('lernpfad', slug);
        return stage ? renderLernpfadDetail(ctx, stage) : renderNotFound(ctx, raw);
      }
      case 'zeichen': {
        if (!slug) {
          return renderZeichenIndex(ctx, {
            element: params.get('element') || 'all',
            modality: params.get('modality') || 'all',
            q: params.get('q') || '',
          });
        }
        const item = ctx.findBySlug('zeichen', slug);
        return item ? renderZeichenDetail(ctx, item) : renderNotFound(ctx, raw);
      }
      case 'faktoren': {
        if (!slug) return renderFaktorenIndex(ctx, { q: params.get('q') || '' });
        const item = ctx.findBySlug('faktoren', slug);
        return item ? renderFaktorenDetail(ctx, item) : renderNotFound(ctx, raw);
      }
      case 'haeuser': {
        if (!slug) return renderHaeuserIndex(ctx);
        const item = ctx.findBySlug('haeuser', slug);
        return item ? renderHaeuserDetail(ctx, item) : renderNotFound(ctx, raw);
      }
      case 'aspekte': {
        if (!slug) return renderAspekteIndex(ctx);
        const item = ctx.findBySlug('aspekte', slug);
        return item ? renderAspekteDetail(ctx, item) : renderNotFound(ctx, raw);
      }
      case 'grundlagen': {
        if (!slug) {
          return renderGrundlagenIndex(ctx, { level: params.get('ebene') || 'all', q: params.get('q') || '' });
        }
        const item = ctx.findBySlug('grundlagen', slug);
        return item ? renderGrundlagenDetail(ctx, item) : renderNotFound(ctx, raw);
      }
      case 'beispiele': {
        if (!slug) return renderBeispieleIndex(ctx);
        const item = ctx.findBySlug('beispiele', slug);
        return item ? renderBeispieleDetail(ctx, item) : renderNotFound(ctx, raw);
      }
      case 'faq':
        return renderFaq(ctx, slug || '');
      case 'glossar':
        return renderGlossar(ctx, { q: params.get('q') || '', selectedSlug: slug || '' });
      case 'quellen':
        return renderQuellen(ctx, { quelle: params.get('quelle') || '', claim: params.get('claim') || '' });
      case 'methodik':
        return renderMethodik(ctx);
      case 'suche':
        return renderSuche(ctx, params.get('q') || '');
      default:
        return renderNotFound(ctx, raw);
    }
  }

  // --- Interaktion ------------------------------------------------------

  /**
   * Schreibt den Filterzustand in die Adresse, ohne einen Verlaufseintrag zu
   * erzeugen: Zurück soll zur vorigen Seite führen, nicht zum vorigen
   * Tastendruck — der Zustand bleibt trotzdem teilbar und überlebt Reload.
   */
  syncState(hash) {
    if (location.hash === hash) return;
    history.replaceState(history.state || { page: 'astrologie' }, '', hash);
  }

  /** Aktuelle Segment-/Query-Kombination aus der Adresse, damit Filter auf der richtigen Seite landen. */
  currentRoute() {
    const raw = String(location.hash || '').replace(/^#/, '');
    const [path] = raw.split('?');
    return path || 'astrologie';
  }

  bind() {
    const root = this.root;
    if (!root) return;

    // Suche/Filter: Live-Filterung mit Fokus- und Cursor-Erhalt.
    root.querySelectorAll('[data-astro-form]').forEach((form) => {
      const kind = form.getAttribute('data-astro-form');
      const input = form.querySelector('input[type="search"]');
      if (!input) return;

      const apply = () => {
        const params = new URLSearchParams();
        const value = input.value.trim();
        if (value) params.set('q', value);
        if (kind === 'zeichen') {
          const current = new URLSearchParams(String(location.hash).split('?')[1] || '');
          const element = current.get('element');
          const modality = current.get('modality');
          if (element && element !== 'all') params.set('element', element);
          if (modality && modality !== 'all') params.set('modality', modality);
        }
        const path =
          kind === 'suche' ? 'astrologie/suche' : kind === 'grundlagen' ? 'astrologie/grundlagen' : this.currentRoute();
        const query = params.toString();
        this.syncState(`#${path}${query ? `?${query}` : ''}`);
        this.rerenderPreservingFocus();
      };

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        apply();
        if (kind === 'suche') {
          const value = input.value.trim();
          if (location.hash === ROUTE.suche(value)) this.rerenderPreservingFocus();
        }
      });
      input.addEventListener('input', debounce(apply));
    });

    // Inhaltsverzeichnis und Buchstabensprung: kein Hash-Wechsel, damit der
    // Router nicht auf eine unbekannte Route läuft.
    root.querySelectorAll('[data-astro-scroll]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('data-astro-scroll');
        const target = targetId ? document.getElementById(targetId) : null;
        if (!target) return; // Fallback: der Link ist eine gültige Route
        event.preventDefault();
        target.setAttribute('tabindex', '-1');
        target.scrollIntoView({ block: 'start', behavior: 'auto' });
        target.focus({ preventScroll: true });
      });
    });
    root.querySelectorAll('[data-astro-letter]').forEach((button) => {
      button.addEventListener('click', () => {
        const letter = button.getAttribute('data-astro-letter');
        const target = document.getElementById(`glossar-${letter}`);
        if (!target) return;
        target.setAttribute('tabindex', '-1');
        target.scrollIntoView({ block: 'start', behavior: 'auto' });
        target.focus({ preventScroll: true });
      });
    });

    // Ziel aus dem Quellenverzeichnis (:target-Ersatz ohne Hash-Kollision).
    const target = root.querySelector('.is-target');
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'auto' }));
    }
  }

  /** Neu rendern, aber Fokus und Cursor im Suchfeld halten. */
  rerenderPreservingFocus() {
    const active = document.activeElement;
    const isSearch = active && active.tagName === 'INPUT' && active.type === 'search';
    const caret = isSearch ? active.selectionStart : null;
    const name = isSearch ? active.getAttribute('id') : null;

    const raw = String(location.hash || '').replace(/^#/, '');
    const [path, query = ''] = raw.split('?');
    const segments = path.split('/').filter(Boolean).slice(1); // 'astrologie' entfernen
    const token = ++this.renderToken;
    const ctx = this.model;
    if (!ctx) return;
    const view = this.resolveView(ctx, segments, query);
    this.root.innerHTML = view.html;
    document.title = view.title;
    this.bind(view);

    if (name) {
      const next = this.root.querySelector(`#${name}`);
      if (next) {
        next.focus({ preventScroll: true });
        if (caret != null && typeof next.setSelectionRange === 'function') {
          try {
            next.setSelectionRange(caret, caret);
          } catch {
            /* type=search erlaubt setSelectionRange nicht in jedem Browser */
          }
        }
      }
    }
    if (token !== this.renderToken) return;
  }
}

export { BASE_HASH };
