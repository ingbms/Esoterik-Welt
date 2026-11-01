// Tarot Module — Full Interactive Card Gallery + Draw + History + Accessibility
import { tarotCards, getRandomCards, getMajorArcana, getCardsBySuit } from '../data/tarot.js';

export class TarotModule {
  constructor(modal, modalBody, closeBtn) {
    this.modal = modal;
    this.modalBody = modalBody;
    this.closeBtn = closeBtn;
    this.cards = tarotCards || [];
    this.history = [];
    this.filterValue = 'all';
    this.previouslyFocused = null;
  }

  async init() {
    this.loadHistory();
    this.renderGrid();
    this.setupEventListeners();
    this.setupModalAccessibility();
  }

  renderGrid() {
    const grid = document.getElementById('tarotGrid');
    if (!grid) return;
    const cards = this.getFilteredCards();
    grid.innerHTML = cards
      .map(
        (card) => `
      <button class="tarot-card" data-id="${card.id}" data-arcana="${card.arcana}" data-suit="${card.suit || ''}" tabindex="0" aria-label="${card.name}, ${card.arcana === 'major' ? 'Major Arcana' : card.suit ? 'Minor — ' + card.suit : 'Minor Arcana'}" role="button">
        <div class="tarot-image" aria-hidden="true" loading="lazy" style="background: linear-gradient(135deg, var(--color-border), var(--color-border-glow)); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:var(--text-3xl); color:var(--color-primary-light); text-shadow:0 0 20px rgba(187,134,252,0.5);"><span>${card.arcana === 'major' ? (card.number < 22 ? '★' : '✦') : card.suit ? '◆' : '◆'}</span></div>
        <div class="tarot-overlay"><h2 class="tarot-name">${card.name}</h2><p class="tarot-arcana">${card.arcana === 'major' ? 'Major Arcana' : card.suit ? 'Minor — ' + card.suit : 'Minor Arcana'}${card.number != null ? ' · ' + card.number : ''}</p></div>
      </button>`
      )
      .join('');
    grid.querySelectorAll('.tarot-card').forEach((btn) => {
      btn.addEventListener('click', () => this.openModalById(parseInt(btn.dataset.id)));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openModalById(parseInt(btn.dataset.id));
        }
      });
    });
  }

  getFilteredCards() {
    if (this.filterValue === 'all') return this.cards;
    if (this.filterValue === 'major') return getMajorArcana();
    if (this.filterValue === 'minor') return this.cards.filter((c) => c.arcana === 'minor');
    if (['wands', 'cups', 'swords', 'pentacles'].includes(this.filterValue)) return getCardsBySuit(this.filterValue);
    return this.cards;
  }

  filterCards() {
    const sel = document.getElementById('arcanaFilter');
    if (sel) this.filterValue = sel.value;
    this.renderGrid();
  }

  openModalById(id) {
    const card = this.cards.find((c) => c.id === id);
    if (!card) return;
    const reversed = Math.random() < 0.5;
    this.previouslyFocused = document.activeElement;
    const meaningUp = card.meaning_up || card.meaning_upright || '';
    const meaningRev = card.meaning_rev || card.meaning_reversed || '';
    this.modalBody.innerHTML = `<div role="document" aria-label="${card.name} Detail"><h3 style="font-family:var(--font-display); color:var(--color-primary); margin-bottom:var(--space-2); font-size:var(--text-2xl);">${card.name}</h3><div class="flex gap-3 mb-4 flex-wrap"><span class="badge badge-primary">${card.arcana === 'major' ? 'Major Arcana' : card.suit ? 'Minor — ' + card.suit : 'Minor Arcana'}</span>${card.number != null ? `<span class="badge">Nummer ${card.number}</span>` : ''}<span class="badge ${reversed ? 'badge-reversed' : 'badge-upright'}">${reversed ? 'Umgekehrt' : 'Aufrecht'}</span></div><div class="modal-card-detail flex flex-wrap gap-6"><div class="tarot-image" aria-hidden="true" style="background:linear-gradient(135deg,var(--color-bg-card),var(--color-primary-dark)); border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:var(--text-4xl); color:var(--color-primary-light); min-height:320px; min-width:260px; box-shadow:var(--shadow-glow);"><span>${reversed ? '↻' : '✦'}</span></div><div style="flex:1; min-width:260px;"><h4>Schlüsselwörter</h4><div class="modal-card-keywords mb-4" style="display:flex; flex-wrap:wrap; gap:0.35rem;">${(card.keywords || []).map((k) => `<span class="badge" style="font-size:var(--text-xs);">${k}</span>`).join('')}</div><h4>Bedeutung — ${reversed ? 'Umgekehrt' : 'Aufrecht'}</h4><p style="color:var(--color-text-secondary); font-size:var(--text-sm); line-height:1.7; margin-bottom:var(--space-4);">${reversed ? meaningRev : meaningUp}</p><h4>Bedeutung — ${reversed ? 'Aufrecht' : 'Umgekehrt'}</h4><p style="color:var(--color-text-muted); font-size:var(--text-sm); line-height:1.7;">${reversed ? meaningUp : meaningRev}</p></div></div></div>`;
    document.getElementById('cardModalTitle').textContent = card.name + (reversed ? ' (Umgekehrt)' : '');
    this.modal.dialogController.open();
    this.addHistory({
      id: card.id,
      name: card.name,
      reversed,
      timestamp: new Date().toISOString(),
      arcana: card.arcana,
      suit: card.suit || null,
    });
    this.renderHistory();
  }

  drawCard() {
    const btn = document.getElementById('drawCardBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    const cards = getRandomCards(1, true);
    this.showDrawnCards(cards, true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(
      () => {
        this.showDrawnCards(cards, false);
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        setTimeout(() => this.openModalById(cards[0].id), reduced ? 0 : 300);
      },
      reduced ? 0 : 1500
    );
  }

  drawThree() {
    const btn = document.getElementById('drawThreeBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    const cards = getRandomCards(3, true);
    this.showDrawnCards(cards, true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(
      () => {
        this.showDrawnCards(cards, false);
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        setTimeout(() => this.openModalById(cards[0].id), reduced ? 0 : 300);
      },
      reduced ? 0 : 1500
    );
  }

  showDrawnCards(cards, shuffling = false) {
    const container = document.getElementById('drawnCardContainer');
    const drawn = document.getElementById('drawnCards');
    if (!container || !drawn) return;
    container.hidden = false;
    drawn.innerHTML = cards
      .map(
        (c, i) =>
          `<button class="drawn-card card" onclick="if(window.tarotMod&&window.tarotMod.openModalById)window.tarotMod.openModalById(${c.id})" style="animation:fadeUp 0.6s ease ${i * 120}ms both; animation-delay:${i * 120}ms;" role="button" aria-label="${c.name}, ${c.reversed ? 'Umgekehrt' : 'Aufrecht'}" tabindex="0"><div class="tarot-image" aria-hidden="true" style="background:linear-gradient(135deg,var(--color-bg-card),var(--color-primary-dark)); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:var(--text-3xl); color:var(--color-primary-light); height:100%; border-radius:var(--radius-lg);"><span>${c.reversed ? '↻' : '✦'}</span></div><div style="padding:var(--space-3); text-align:center;"><h3 style="font-family:var(--font-display); font-size:var(--text-base); margin-bottom:var(--space-1);">${c.name}</h3><span style="font-size:var(--text-xs); color:var(--color-text-muted);">${c.reversed ? 'Umgekehrt — ' + (c.meaning_rev || '') : 'Aufrecht — ' + (c.meaning_up || '')}</span></div></button>`
      )
      .join('');
    drawn.style.opacity = shuffling ? '0.6' : '1';
    drawn.style.pointerEvents = shuffling ? 'none' : 'auto';
    container.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'nearest',
    });
  }

  loadHistory() {
    try {
      const raw = localStorage.getItem('esoterik_tarot_history');
      this.history = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(this.history)) this.history = [];
    } catch {
      this.history = [];
    }
  }
  saveHistory() {
    try {
      localStorage.setItem('esoterik_tarot_history', JSON.stringify(this.history.slice(0, 50)));
    } catch {}
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
      box.innerHTML = '<p style="color:var(--color-text-muted); font-size:var(--text-sm);">Noch keine Ziehungen.</p>';
      return;
    }
    box.innerHTML =
      `<h4 style="font-family:var(--font-display); margin-bottom:var(--space-2);">Verlauf</h4><ul style="list-style:none; padding:0; margin:0; max-height:320px; overflow-y:auto;">` +
      this.history
        .slice(0, 12)
        .map((h) => {
          const d = new Date(h.timestamp || Date.now());
          return `<li style="padding:0.5rem 0; border-bottom:1px solid var(--color-border); font-size:var(--text-sm);"><strong>${h.name}</strong> <span style="color:var(--color-text-muted);">${h.reversed ? 'Umgekehrt' : 'Aufrecht'}</span><div style="font-size:var(--text-xs); color:var(--color-text-muted);">${d.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</div></li>`;
        })
        .join('') +
      '</ul>';
  }

  setupModalAccessibility() {
    if (this.modal.dialogController) return; // The shared controller owns the complete lifecycle.
    this.modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeModal();
      }
    });
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.closest('.modal-backdrop') === this.modal) this.closeModal();
    });
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
  }
  closeModal() {
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
  setupFocusTrap() {
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      );
      if (!focusables.length) return;
      const first = focusables[0],
        last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    this.modal.addEventListener('keydown', trap);
  }

  setupEventListeners() {
    document.getElementById('drawCardBtn')?.addEventListener('click', () => this.drawCard());
    document.getElementById('drawThreeBtn')?.addEventListener('click', () => this.drawThree());
    document.getElementById('arcanaFilter')?.addEventListener('change', () => this.filterCards());
    if (!document.getElementById('tarotHistoryBox')) {
      const sec = document.getElementById('tarot');
      if (sec) {
        const aside = document.createElement('aside');
        aside.id = 'tarotHistoryBox';
        aside.setAttribute('aria-label', 'Tarot-Ziehungs-Verlauf');
        aside.style.cssText =
          'margin-top:var(--space-6); padding:var(--space-4); background:var(--surface-ghost); border-radius:var(--radius-lg); border:1px solid var(--border-glow-subtle);';
        sec.querySelector('.container').appendChild(aside);
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
