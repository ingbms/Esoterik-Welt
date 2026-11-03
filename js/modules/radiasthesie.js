// Radiästhesie, Pendeln und Orakel — Bereichsmodul.
//
// Dieses Modul rendert in den Container #pendelnRoot. Es entscheidet anhand
// der vom Router übergebenen Segmente, welche Ansicht gilt, hängt sie ins
// Dokument und setzt Titel, Beschreibung und Fokus. Der Router bleibt in
// js/main.js: Hier wird nur für Filter- und Suchzustand replaceState benutzt,
// damit Zurück zur vorigen Seite führt und nicht zum vorigen Tastendruck.

import { ROUTE } from './radiasthesie-format.js';
import { createModel } from './radiasthesie-model.js';
import { breadcrumbList, canonicalForRoute, pageTitle } from './radiasthesie-seo.js';
import { mountPendulumSimulator } from './pendel-simulator.js';
import { mountPendeltafelStudio } from './pendeltafel-studio.js';
import { mountExperimentLabor } from './experiment-labor.js';
import { mountPendelJournal } from './pendel-journal.js';
import {
  renderExperiment,
  renderFailure,
  renderGlossar,
  renderJournal,
  renderLabor,
  renderLanding,
  renderMethodik,
  renderNotFound,
  renderQuellen,
  renderStudio,
  renderSuche,
  renderTopic,
} from './radiasthesie-views.js';

const JSON_LD_ID = 'pendeln-breadcrumb-ld';

function debounce(fn, ms = 150) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
}

function setMeta(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute('content', value);
}

export class RadiasthesieModule {
  constructor(root) {
    this.root = root;
    this.model = null;
    this.loading = null;
    this.renderToken = 0;
    this.view = null;
    this.simulator = null;
    this.studio = null;
    this.experiment = null;
    this.journal = null;
    this.bound = false;
    if (root) this.bind();
  }

  /**
   * Lädt den Datensatz genau einmal. Der Import ist bewusst dynamisch: unter
   * HTTP wird die Datei erst beim ersten Aufruf geholt, im Offline-Build
   * inlined webpack sie (dynamicImportMode eager) in die eine Datei.
   */
  async load() {
    if (this.model) return this.model;
    if (!this.loading) {
      this.loading = import('../data/radiasthesie.js')
        .then((module) => {
          this.model = createModel(module.RADIASTHESIE || module.default);
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
   * @param {string[]} segments Pfadsegmente hinter #pendeln
   * @param {string} query     Query-String ohne '?'
   * @param {{focus?: boolean}} options
   */
  async show(segments = [], query = '', { focus = false } = {}) {
    if (!this.root) return;
    const token = ++this.renderToken;
    let view;
    let route;
    try {
      const model = await this.load();
      if (token !== this.renderToken) return;
      route = model.resolve(segments, query);
      this.routeInfo = route;
      view = this.resolveView(model, route);
    } catch (error) {
      if (token !== this.renderToken) return;
      console.error('Radiästhesie-Inhalte nicht verfügbar', error);
      view = renderFailure('Die Datendatei des Moduls konnte nicht geladen werden.');
    }
    this.teardownSimulator();
    this.teardownStudio();
    this.teardownExperiment();
    this.teardownJournal();
    this.root.innerHTML = view.html;
    this.view = view;
    // Das Pendellabor hängt seine Physik erst nach dem Einsetzen ins Dokument
    // an. Ein vorheriger Lauf wird vorher beendet, damit nie zwei Schleifen
    // auf denselben Container zeigen.
    if (view.simulator) {
      this.simulator = mountPendulumSimulator(this.root.querySelector('#pendelLabor'));
    }
    if (view.studio) {
      this.studio = mountPendeltafelStudio(this.root.querySelector('#pendeltafelStudio'));
    }
    if (view.experiment) {
      // Das Labor hält Lauf und Secret im Modulspeicher. destroy() verwirft
      // beides, damit ein Routenwechsel kein verdecktes Ziel weiterleben lässt.
      this.experiment = mountExperimentLabor(this.root.querySelector('#experimentLabor'));
    }
    if (view.journal) {
      // Das Tagebuch liest den lokalen Speicher beim Einsetzen neu und hängt
      // alle Zuhörer an den Container. destroy() entfernt sie samt Timern.
      this.journal = mountPendelJournal(this.root.querySelector('#pendelJournal'));
    }
    this.applyMeta(view);
    this.placeStructuredData(view);
    if (focus) this.focusTarget(view);
    else this.scrollToTarget(view);
  }

  onShow() {
    return this.show([], '', { focus: false });
  }

  /** Beendet eine laufende Simulation, bevor das DOM ersetzt wird. */
  teardownSimulator() {
    if (this.simulator) {
      this.simulator.destroy();
      this.simulator = null;
    }
  }

  /** Beendet das Tafel-Studio: Entpreller und Listener, bevor neu gerendert wird. */
  teardownStudio() {
    if (this.studio) {
      this.studio.destroy();
      this.studio = null;
    }
  }

  /** Beendet das Experimentierlabor und verwirft Lauf samt geheimem Ziel. */
  teardownExperiment() {
    if (this.experiment) {
      this.experiment.destroy();
      this.experiment = null;
    }
  }

  /** Beendet das Pendeltagebuch: Listener und Lösch-Timer. */
  teardownJournal() {
    if (this.journal) {
      this.journal.destroy();
      this.journal = null;
    }
  }

  resolveView(model, route) {
    switch (route.view) {
      case 'topic':
        return renderTopic(model, route.topic, { anchor: route.anchor });
      case 'glossar':
        return renderGlossar(model, { letter: route.letter || '', query: route.params.get('q') || '' });
      case 'quellen':
        return renderQuellen(model, { sourceId: route.sourceId || '' });
      case 'methodik':
        return renderMethodik(model);
      case 'labor':
        return renderLabor();
      case 'studio':
        return renderStudio();
      case 'experiment':
        return renderExperiment();
      case 'journal':
        return renderJournal();
      case 'suche':
        return renderSuche(model, route.q || '');
      case 'notfound':
        return renderNotFound(model, route.slug || '');
      case 'landing':
      default:
        return renderLanding(model);
    }
  }

  /**
   * Titel, Beschreibung und Open-Graph/Twitter folgen der aktiven Route.
   * Canonical und og:url zeigen auf das indexierbare Dokument: die statische
   * Themenseite, sonst auf die Startseite. Eine Hash-Adresse ist nie
   * Dokumentidentität — sie wird hier nicht mehr ausgegeben.
   */
  applyMeta(view) {
    const title = pageTitle(view.title || '');
    const canonical = canonicalForRoute(this.routeInfo);
    document.title = title;
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute('href', canonical);
    setMeta('meta[name="description"]', view.description || '');
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', view.description || '');
    setMeta('meta[property="og:url"]', canonical);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', view.description || '');
    setMeta('meta[name="twitter:url"]', canonical);
  }

  /**
   * BreadcrumbList als strukturierte Daten, ohne Fragmentadressen. Die
   * statischen Dokumente unter radiasthesie/ tragen dieselbe Hierarchie; die
   * Ansicht in index.html nennt für sich selbst keine Adresse. Kein Article
   * (kein belegtes Veröffentlichungsdatum), kein FAQ (keine FAQ-Seite).
   */
  placeStructuredData(view) {
    const previous = document.getElementById(JSON_LD_ID);
    if (previous) previous.remove();
    const moduleTitle = (this.model && this.model.data.module.title) || 'Radiästhesie, Pendeln und Orakel';
    const trail =
      this.routeInfo && this.routeInfo.view === 'landing'
        ? [
            { label: 'Start', url: '' },
            { label: moduleTitle, url: null },
          ]
        : [
            { label: 'Start', url: '' },
            { label: moduleTitle, url: 'radiasthesie/' },
            { label: view.h1 || view.title || 'Modul', url: null },
          ];
    const data = { '@context': 'https://schema.org', ...breadcrumbList(trail) };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSON_LD_ID;
    script.textContent = JSON.stringify(data);
    this.root.append(script);
  }

  focusTarget(view) {
    const anchor = view.anchor || (view.target ? `quelle-${view.target}` : '');
    if (anchor) {
      this.scrollToTarget(view);
      const target = document.getElementById(anchor);
      const heading = target && (target.querySelector('h2, h3') || target);
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
        return;
      }
    }
    const title = this.root.querySelector('#pendeln-title');
    if (title) title.focus({ preventScroll: true });
  }

  scrollToTarget(view) {
    const anchor = view.anchor || (view.target ? `quelle-${view.target}` : '');
    if (!anchor) return;
    const target = document.getElementById(anchor);
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      if (view.target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  }

  /** Aktuelle Modulroute als Hash, damit Filter auf der richtigen Seite landen. */
  currentHash() {
    const raw = String(location.hash || '').replace(/^#/, '');
    return raw.startsWith('pendeln') ? `#${raw}` : ROUTE.base;
  }

  /**
   * Delegierte Handler: Sie überleben jedes Neu-Rendern, weil sie am
   * Container hängen und nicht an den erzeugten Knoten.
   */
  bind() {
    if (this.bound) return;
    this.bound = true;
    const root = this.root;

    const applyGlossarFilter = () => {
      if (!this.model) return;
      const input = root.querySelector('#glossarSuche');
      if (!input) return;
      const value = input.value.trim();
      const route = this.model.resolve(['glossar'], new URLSearchParams(location.hash.split('?')[1] || '').toString());
      const letter = route.letter || '';
      const view = renderGlossar(this.model, { letter, query: value });
      // Fokus und Cursor bleiben beim Tippen im Feld.
      const selection = input.selectionStart;
      root.innerHTML = view.html;
      this.view = view;
      const next = root.querySelector('#glossarSuche');
      if (next) {
        next.focus({ preventScroll: true });
        if (typeof selection === 'number') next.setSelectionRange(selection, selection);
      }
      const params = new URLSearchParams();
      if (value) params.set('q', value);
      if (letter) params.set('b', letter);
      const hash = `#pendeln/glossar${params.toString() ? `?${params.toString()}` : ''}`;
      if (location.hash !== hash) history.replaceState(history.state || { page: 'pendeln' }, '', hash);
    };
    const debounced = debounce(applyGlossarFilter, 150);

    root.addEventListener('input', (event) => {
      if (!event.target.matches('#glossarSuche')) return;
      debounced();
    });

    root.addEventListener('submit', (event) => {
      const form = event.target.closest('[data-rad-form]');
      if (!form) return;
      event.preventDefault();
      const input = form.querySelector('input[type="search"]');
      const value = input ? input.value.trim() : '';
      const kind = form.getAttribute('data-rad-form');
      if (kind === 'glossar') {
        const letter = new URLSearchParams(location.hash.split('?')[1] || '').get('b') || '';
        const params = new URLSearchParams();
        if (value) params.set('q', value);
        if (letter) params.set('b', letter);
        location.hash = `#pendeln/glossar${params.toString() ? `?${params.toString()}` : ''}`;
        return;
      }
      location.hash = value ? `#pendeln/suche?q=${encodeURIComponent(value)}` : '#pendeln/suche';
    });
  }
}
