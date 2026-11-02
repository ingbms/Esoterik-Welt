// Tarot Module — gallery, search/filter, detail dialog, draws and history.
//
// Cards and interpretations come from js/data/tarot.js (generated from the
// approved Nachtatelier deck), images from the deck registry in
// js/data/tarot-decks.js. Nothing here hardcodes a file path or a deck id, so a
// future deck only has to be added to the registry.
import {
  tarotCards,
  getRandomCards,
  getMajorArcana,
  getCardsBySuit,
  SUIT_LABELS,
  TAROT_DISCLAIMER,
} from '../data/tarot.js';
import {
  DEFAULT_DECK_ID,
  backAssetPath,
  cardAssetPath,
  getDeck,
  readStoredDeckId,
  storeDeckId,
} from '../data/tarot-decks.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ESCAPES[character]);

const GRID_SIZES = '(min-width: 1024px) 200px, (min-width: 640px) 26vw, 46vw';

function arcanaLabel(card) {
  if (card.arcana === 'major') return 'Große Arkana';
  const suit = SUIT_LABELS[card.suit] || 'Kleine Arkana';
  return `Kleine Arkana · ${suit}`;
}

function matchesQuery(card, query) {
  if (!query) return true;
  const haystack = [card.name, card.numeral, arcanaLabel(card), ...(card.keywords || [])].join(' ').toLowerCase();
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export class TarotModule {
  constructor(modal, modalBody, closeBtn) {
    this.modal = modal;
    this.modalBody = modalBody;
    this.closeBtn = closeBtn;
    this.cards = tarotCards || [];
    this.deck = getDeck(DEFAULT_DECK_ID);
    this.history = [];
    this.filterValue = 'all';
    this.searchQuery = '';
    this.currentCardId = null;
    this.currentReversed = false;
    this.previouslyFocused = null;
  }

  async init() {
    this.deck = getDeck(readStoredDeckId());
    storeDeckId(this.deck.id);
    this.loadHistory();
    this.renderGrid();
    this.setupEventListeners();
    this.setupModalAccessibility();
  }

  // --- Gallery ------------------------------------------------------------

  renderGrid() {
    const grid = document.getElementById('tarotGrid');
    if (!grid) return;
    const cards = this.getFilteredCards();
    if (this.imageObserver) this.imageObserver.disconnect();
    grid.innerHTML = cards.map((card) => this.cardMarkup(card)).join('');
    this.observeImages(grid);
    this.updateResultStatus(cards.length);
  }

  cardMarkup(card) {
    const thumb = cardAssetPath(this.deck, card.id, 'thumb');
    const detail = cardAssetPath(this.deck, card.id, 'detail');
    const label = `${card.name} · ${card.numeral} · ${arcanaLabel(card)}`;
    return `<button class="tarot-card" type="button" data-id="${card.id}" aria-label="${esc(label)}">
        <span class="tarot-media">
          <img class="tarot-image" data-src="${esc(thumb)}" data-srcset="${esc(thumb)} 300w, ${esc(detail)} 600w"
            sizes="${GRID_SIZES}" width="300" height="500" loading="lazy" decoding="async" alt="" />
        </span>
        <span class="tarot-overlay">
          <span class="tarot-numeral" aria-hidden="true">${esc(card.numeral)}</span>
          <span class="tarot-name">${esc(card.name)}</span>
          <span class="tarot-arcana">${esc(arcanaLabel(card))}</span>
        </span>
      </button>`;
  }

  // The grid only fetches artwork for cards that are about to become visible:
  // `data-src` is promoted to `src` by an IntersectionObserver with a 400 px
  // margin. Without observer support (or without JS) the source is set at once,
  // so the gallery never stays empty.
  //
  // Loading and failure states follow the real image event, never a timer: a card
  // is only marked ready once the bitmap decoded, and a missing file is named
  // instead of leaving an empty frame.
  observeImages(root) {
    const images = [...root.querySelectorAll('.tarot-image[data-src]')];
    if (!images.length) return;
    const load = (image) => {
      if (!image.dataset.src) return;
      image.src = image.dataset.src;
      if (image.dataset.srcset) image.srcset = image.dataset.srcset;
      image.removeAttribute('data-src');
      image.removeAttribute('data-srcset');
    };
    for (const image of images) {
      const card = image.closest('.tarot-card');
      const settle = (state) => {
        if (card) {
          card.classList.remove('is-loading');
          card.classList.toggle('is-missing', state === 'error');
        }
        if (state === 'error') {
          image.hidden = true;
          if (!card || card.querySelector('.tarot-image-fallback')) return;
          const fallback = document.createElement('span');
          fallback.className = 'tarot-image-fallback';
          fallback.textContent = 'Bild nicht verfügbar';
          image.after(fallback);
        }
      };
      if (card) card.classList.add('is-loading');
      image.addEventListener('load', () => settle('loaded'), { once: true });
      image.addEventListener('error', () => settle('error'), { once: true });
    }
    if (typeof IntersectionObserver !== 'function') {
      images.forEach(load);
      return;
    }
    if (!this.imageObserver) {
      this.imageObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            this.imageObserver.unobserve(entry.target);
            load(entry.target);
          }
        },
        { rootMargin: '400px 0px' }
      );
    }
    images.forEach((image) => this.imageObserver.observe(image));
  }

  getFilteredCards() {
    let cards = this.cards;
    if (this.filterValue === 'major') cards = getMajorArcana();
    else if (this.filterValue === 'minor') cards = this.cards.filter((card) => card.arcana === 'minor');
    else if (Object.prototype.hasOwnProperty.call(SUIT_LABELS, this.filterValue))
      cards = getCardsBySuit(this.filterValue);
    return cards.filter((card) => matchesQuery(card, this.searchQuery));
  }

  setSearch(value) {
    this.searchQuery = String(value || '')
      .trim()
      .toLowerCase();
    this.renderGrid();
  }

  filterCards() {
    const select = document.getElementById('arcanaFilter');
    if (select) this.filterValue = select.value;
    this.renderGrid();
  }

  updateResultStatus(count) {
    const status = document.getElementById('tarotResultCount');
    if (status) {
      const total = this.cards.length;
      const parts = [count === total ? `${total} Karten` : `${count} von ${total} Karten`];
      if (this.filterValue !== 'all') parts.push('gefiltert');
      if (this.searchQuery) parts.push(`Suche „${this.searchQuery}“`);
      status.textContent = parts.join(' · ');
    }
    const empty = document.getElementById('tarotEmptyState');
    if (empty) {
      empty.hidden = count > 0;
      if (count === 0)
        empty.textContent =
          'Keine Karte passt zu dieser Auswahl. Filter zurücksetzen oder einen anderen Begriff suchen.';
    }
  }

  // --- Detail dialog ------------------------------------------------------

  openModalById(id, { reversed = false, record = false } = {}) {
    const card = this.cards.find((entry) => entry.id === id);
    if (!card) return;
    this.currentCardId = card.id;
    // The gallery opens a card upright; the reversed reading is an explicit
    // choice (toggle) or the orientation that was actually drawn.
    this.currentReversed = Boolean(reversed);
    this.previouslyFocused = document.activeElement;
    this.renderDetail(card);
    this.modal.dialogController.open();
    if (record) {
      this.addHistory({
        id: card.id,
        name: card.name,
        reversed: this.currentReversed,
        timestamp: new Date().toISOString(),
        arcana: card.arcana,
        suit: card.suit || null,
        deck: this.deck.id,
      });
      this.renderHistory();
    }
  }

  renderDetail(card) {
    const isReversed = this.currentReversed;
    // A re-render (orientation toggle) always returns to the normal view: the
    // zoom layout belongs to the 1200px master that is replaced here.
    const detailPanel = this.modal ? this.modal.querySelector('.modal') : null;
    if (detailPanel) detailPanel.classList.remove('is-zoomed');
    const detailImage = cardAssetPath(this.deck, card.id, 'detail');
    const zoomImage = cardAssetPath(this.deck, card.id, 'zoom');
    const badgeOrientation = isReversed
      ? '<span class="badge badge-reversed">Umgekehrt</span>'
      : '<span class="badge badge-upright">Aufrecht</span>';
    const meanings = [
      ['Deutung aufrecht', card.meaning_up, !isReversed],
      ['Deutung umgekehrt', card.meaning_rev, isReversed],
    ]
      .map(
        ([heading, text, isActive]) =>
          `<section class="tarot-meaning${isActive ? ' is-active' : ''}">
            <h5>${esc(heading)}${isActive ? ' <span class="tarot-meaning-flag">aktuell</span>' : ''}</h5>
            <p>${esc(text)}</p>
          </section>`
      )
      .join('');

    this.modalBody.innerHTML = `<div class="tarot-detail">
        <figure class="tarot-detail-figure">
          <button type="button" class="tarot-detail-zoom" aria-pressed="false"
            aria-label="Karte vergrößern: ${esc(card.name)}" data-zoom-src="${esc(zoomImage)}">
            <img class="tarot-detail-image" src="${esc(detailImage)}" width="600" height="1000"
              decoding="async" alt="${esc(card.name)} · ${esc(card.numeral)} — Karte des Nachtatelier-Decks" />
            <span class="tarot-detail-hint" aria-hidden="true">Vergrößern</span>
          </button>
          <figcaption class="tarot-detail-caption">${esc(card.numeral)} · ${esc(arcanaLabel(card))} · 3:5</figcaption>
        </figure>
        <div class="tarot-detail-text">
          <p class="tarot-detail-kicker">${esc(arcanaLabel(card))}</p>
          <h4 class="tarot-detail-name">${esc(card.name)}</h4>
          <div class="tarot-detail-badges">
            <span class="badge badge-primary">${esc(card.numeral)}</span>
            ${badgeOrientation}
            <button type="button" class="badge badge-toggle" data-orientation-toggle="true"
              aria-pressed="${isReversed}" aria-label="Deutung auf ${isReversed ? 'aufrecht' : 'umgekehrt'} umschalten">
              ${isReversed ? 'Aufrecht deuten' : 'Umgekehrt deuten'}
            </button>
          </div>
          <h5>Stichwörter</h5>
          <ul class="tarot-tags">${(card.keywords || [])
            .map((keyword) => `<li class="badge">${esc(keyword)}</li>`)
            .join('')}</ul>
          <h5>Bildsprache</h5>
          <p class="tarot-symbolism">${esc(card.symbolism)}</p>
          ${meanings}
          ${
            card.deep
              ? card.deep
                  .split(/\n{2,}/)
                  .map(
                    (paragraph, index) =>
                      `<section class="tarot-deep"><h5>${
                        index === 0 ? 'Ausführliche Deutung' : 'Ausführliche Deutung (Fortsetzung)'
                      }</h5><p>${esc(paragraph)}</p></section>`
                  )
                  .join('')
              : ''
          }
          <p class="tarot-disclaimer">${esc(TAROT_DISCLAIMER)}</p>
        </div>
      </div>`;
    document.getElementById('cardModalTitle').textContent = card.name + (isReversed ? ' (umgekehrt)' : '');
    this.bindDetailControls();
  }

  bindDetailControls() {
    const zoomButton = this.modalBody.querySelector('.tarot-detail-zoom');
    if (zoomButton) zoomButton.addEventListener('click', () => this.toggleZoom(zoomButton));
    const orientation = this.modalBody.querySelector('[data-orientation-toggle]');
    if (orientation) {
      orientation.addEventListener('click', () => {
        const card = this.cards.find((entry) => entry.id === this.currentCardId);
        if (!card) return;
        this.currentReversed = !this.currentReversed;
        this.renderDetail(card);
        const again = this.modalBody.querySelector('[data-orientation-toggle]');
        if (again) again.focus();
      });
    }
  }

  toggleZoom(button) {
    const image = button.querySelector('.tarot-detail-image');
    if (!image) return;
    const panel = button.closest('.modal');
    const hint = button.querySelector('.tarot-detail-hint');
    const card = this.cards.find((entry) => entry.id === this.currentCardId);
    const label = card ? card.name : '';
    const zoomed = button.getAttribute('aria-pressed') === 'true';
    if (zoomed) {
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `Karte vergrößern: ${label}`);
      image.src = cardAssetPath(this.deck, this.currentCardId, 'detail');
      if (panel) panel.classList.remove('is-zoomed');
      if (hint) hint.textContent = 'Vergrößern';
      return;
    }
    // The 1200 px master is fetched on this explicit action only — never with the
    // first view of the gallery.
    image.src = button.dataset.zoomSrc;
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-label', `Karte verkleinern: ${label}`);
    if (panel) panel.classList.add('is-zoomed');
    if (hint) hint.textContent = 'Verkleinern';
  }

  // --- Draws --------------------------------------------------------------

  drawCard() {
    this.runDraw(1, 'drawCardBtn');
  }

  drawThree() {
    this.runDraw(3, 'drawThreeBtn');
  }

  runDraw(count, buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }
    const cards = getRandomCards(count, true);
    this.showDrawnCards(cards, true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(
      () => {
        this.showDrawnCards(cards, false);
        if (button) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        }
        setTimeout(
          () => this.openModalById(cards[0].id, { reversed: cards[0].reversed, record: true }),
          reduced ? 0 : 250
        );
      },
      reduced ? 0 : 1200
    );
  }

  showDrawnCards(cards, shuffling = false) {
    const container = document.getElementById('drawnCardContainer');
    const drawn = document.getElementById('drawnCards');
    if (!container || !drawn) return;
    container.hidden = false;
    const back = backAssetPath(this.deck, 'thumb');
    drawn.innerHTML = cards
      .map((card, index) => {
        const thumb = shuffling ? back : cardAssetPath(this.deck, card.id, 'thumb');
        const state = shuffling ? 'Karte wird gezogen' : `${card.name} — ${card.reversed ? 'umgekehrt' : 'aufrecht'}`;
        const reading = shuffling ? 'Rückseite' : card.reversed ? card.meaning_rev : card.meaning_up;
        return `<button class="drawn-card card${shuffling ? ' is-shuffling' : ''}" type="button" data-id="${card.id}"
            data-reversed="${card.reversed ? 'true' : 'false'}"
            aria-label="Karte ${index + 1}: ${esc(state)}">
            <img class="tarot-image" src="${esc(thumb)}" width="300" height="500" loading="lazy" decoding="async" alt="" />
            <span class="drawn-card-text">
              <span class="drawn-card-index">Karte ${index + 1}</span>
              <span class="drawn-card-name">${shuffling ? 'Rückseite' : esc(card.name)}</span>
              <span class="drawn-card-meaning">${esc(reading)}</span>
            </span>
          </button>`;
      })
      .join('');
    drawn.querySelectorAll('.drawn-card').forEach((element) => {
      element.addEventListener('click', () => {
        if (shuffling) return;
        this.openModalById(Number(element.dataset.id), {
          reversed: element.dataset.reversed === 'true',
          record: false,
        });
      });
    });
    container.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'nearest',
    });
  }

  // --- History ------------------------------------------------------------

  loadHistory() {
    try {
      const raw = localStorage.getItem('esoterik_tarot_history');
      const parsed = raw ? JSON.parse(raw) : [];
      this.history = Array.isArray(parsed) ? parsed.filter((entry) => entry && Number.isInteger(entry.id)) : [];
    } catch {
      this.history = [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('esoterik_tarot_history', JSON.stringify(this.history.slice(0, 50)));
    } catch {
      /* Storage can be unavailable (private mode); history stays session-only. */
    }
  }

  addHistory(entry) {
    this.history.unshift(entry);
    if (this.history.length > 50) this.history = this.history.slice(0, 50);
    this.saveHistory();
  }

  renderHistory() {
    const box = document.getElementById('tarotHistoryBox');
    if (!box) return;
    if (!this.history.length) {
      box.innerHTML =
        '<h4>Ziehungsverlauf</h4><p class="tarot-history-empty">Noch keine Ziehung in diesem Browser.</p>';
      return;
    }
    box.innerHTML =
      '<h4>Ziehungsverlauf</h4><ul class="tarot-history-list">' +
      this.history
        .slice(0, 12)
        .map((entry) => {
          // Entries keep their stored id; the display name is resolved from the
          // current data so old records show the corrected card name.
          const card = this.cards.find((item) => item.id === entry.id);
          const name = card ? card.name : entry.name || `Karte ${entry.id}`;
          const date = new Date(entry.timestamp || Date.now());
          return `<li><span class="tarot-history-name">${esc(name)}</span>
            <span class="tarot-history-orientation">${entry.reversed ? 'umgekehrt' : 'aufrecht'}</span>
            <span class="tarot-history-time">${esc(
              date.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
            )}</span></li>`;
        })
        .join('') +
      '</ul>';
  }

  // --- Dialog plumbing ----------------------------------------------------

  setupModalAccessibility() {
    if (this.modal.dialogController) return; // The shared controller owns the complete lifecycle.
    this.modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeModal();
      }
    });
    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal || event.target.closest('.modal-backdrop') === this.modal) this.closeModal();
    });
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
  }

  closeModal() {
    const panel = this.modal.querySelector('.modal');
    if (panel) panel.classList.remove('is-zoomed');
    if (this.modal.dialogController) {
      this.modal.dialogController.close();
      this.previouslyFocused = null;
      return;
    }
    this.modal.classList.remove('open');
    this.modal.hidden = true;
    document.body.style.overflow = '';
    const previouslyFocused = this.previouslyFocused;
    if (previouslyFocused && previouslyFocused.focus) setTimeout(() => previouslyFocused.focus(), 50);
    this.previouslyFocused = null;
  }

  setupEventListeners() {
    // Delegated once on the persistent grid: the card buttons are rebuilt on
    // every filter/search change.
    document.getElementById('tarotGrid')?.addEventListener('click', (event) => {
      const card = event.target.closest('.tarot-card');
      if (!card) return;
      this.openModalById(Number(card.dataset.id));
    });
    document.getElementById('drawCardBtn')?.addEventListener('click', () => this.drawCard());
    document.getElementById('drawThreeBtn')?.addEventListener('click', () => this.drawThree());
    document.getElementById('arcanaFilter')?.addEventListener('change', () => this.filterCards());
    const search = document.getElementById('tarotSearch');
    if (search) {
      search.addEventListener('input', () => this.setSearch(search.value));
      search.addEventListener('search', () => this.setSearch(search.value));
    }
    const reset = document.getElementById('tarotResetFilters');
    if (reset) {
      reset.addEventListener('click', () => {
        if (search) search.value = '';
        const select = document.getElementById('arcanaFilter');
        if (select) select.value = 'all';
        this.filterValue = 'all';
        this.searchQuery = '';
        this.renderGrid();
        if (search) search.focus();
      });
    }
    if (!document.getElementById('tarotHistoryBox')) {
      const section = document.getElementById('tarot');
      if (section) {
        const aside = document.createElement('aside');
        aside.id = 'tarotHistoryBox';
        aside.className = 'tarot-history';
        aside.setAttribute('aria-label', 'Tarot-Ziehungsverlauf');
        section.querySelector('.container').appendChild(aside);
      }
    }
    this.renderHistory();
    window.tarotMod = this;
  }

  onShow() {
    this.renderGrid();
    this.renderHistory();
  }
}
