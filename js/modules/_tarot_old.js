// Tarot Module — Interactive Card System
export class TarotModule {
  constructor(modal, modalBody, closeBtn) {
    this.modal = modal;
    this.modalBody = modalBody;
    this.closeBtn = closeBtn;
    this.cards = window.tarotCards || [];
  }

  async init() {
    await import('../data/tarot.js');
    this.cards = window.tarotCards || [];
    this.renderGrid();
    this.setupEventListeners();
  }

  renderGrid() {
    const grid = document.getElementById('tarotGrid');
    if (!grid || !this.cards.length) return;

    grid.innerHTML = this.cards.map(card => `
      <div class="tarot-card" data-id="${card.id}" data-reversed="false" tabindex="0" role="button" aria-label="${card.name}">
        <div class="tarot-image" style="background: linear-gradient(135deg, #2d1b47, #5b2d91); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 2.5rem; color: var(--color-primary-light); text-shadow: 0 0 20px rgba(187,134,252,0.5);">
          ${card.arcana === 'major' ? card.id < 5 ? '✦' : card.id < 10 ? '✦' : card.id < 15 ? '✦' : card.id < 22 ? '✦✦' : '★' : card.number < 10 ? '◆' : '◆◆'}
        </div>
        <div class="tarot-overlay">
          <h4 class="tarot-name">${card.name}</h4>
          <p class="tarot-arcana">${card.arcana === 'major' ? 'Major Arcana' : card.suit ? 'Minor — ' + card.suit : 'Minor Arcana'} · ${card.number || ''}</p>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.tarot-card').forEach(card => {
      card.addEventListener('click', () => this.openCardModal(parseInt(card.dataset.id)));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openCardModal(parseInt(card.dataset.id));
        }
      });
    });
  }

  openCardModal(id) {
    const card = this.cards.find(c => c.id === id);
    if (!card) return;
    this.modalBody.innerHTML = `
      <h3 style="font-family: var(--font-display); color: var(--color-primary); margin-bottom: var(--space-2);">${card.name}</h3>
      <div class="flex gap-3 mb-4 flex-wrap">
        <span class="badge badge-primary">${card.arcana}</span>
        ${card.number ? `<span class="badge">Nummer: ${card.number}</span>` : ''}
      </div>
      <div class="modal-card-detail">
        <div class="tarot-image" style="background: linear-gradient(135deg, #1a102d, #3a1a5c); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 3rem; color: var(--color-primary-light); min-height: 280px; box-shadow: var(--shadow-glow);">
          ${card.arcana === 'major' ? '✦' : '◆'}
        </div>
        <div>
          <h4>Schlüsselwörter</h4>
          <div class="modal-card-keywords mb-4">
            ${card.keywords.map(k => `<span class="badge">${k}</span>`).join('')}
          </div>
          <h4>Aufrecht</h4>
          <p style="color: var(--color-text-secondary); font-size: var(--text-sm); line-height: 1.6; margin-bottom: var(--space-4);">${card.meaning_up}</p>
          <h4>Verkehrt</h4>
          <p style="color: var(--color-text-muted); font-size: var(--text-sm); line-height: 1.6;">${card.meaning_rev}</p>
        </div>
      </div>
    `;
    document.getElementById('cardModalTitle').textContent = card.name;
    this.modal.hidden = false;
    requestAnimationFrame(() => this.modal.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }

  setupEventListeners() {
    document.getElementById('drawCardBtn')?.addEventListener('click', () => {
      const card = getRandomCards(1)[0];
      this.showDrawnCards([card]);
    });
    document.getElementById('drawThreeBtn')?.addEventListener('click', () => {
      const cards = getRandomCards(3);
      this.showDrawnCards(cards);
    });
    document.getElementById('arcanaFilter')?.addEventListener('change', () => this.filterCards());
  }

  showDrawnCards(cards) {
    const container = document.getElementById('drawnCardContainer');
    const drawnCards = document.getElementById('drawnCards');
    container.hidden = false;
    drawnCards.innerHTML = cards.map((c, i) => `
      <div class="drawn-card card" style="animation-delay: ${i * 150}ms;">
        <div class="tarot-image" style="background: linear-gradient(135deg, #1a102d, #3a1a5c); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 3rem; color: var(--color-primary-light); height: 100%; border-radius: var(--radius-lg);">
          ${c.arcana === 'major' ? '✦' : '◆'}
        </div>
        <div style="padding: var(--space-3); text-align: center;">
          <h4 style="font-family: var(--font-display); font-size: var(--text-base); margin-bottom: var(--space-1);">${c.name}</h4>
          <span style="font-size: var(--text-xs); color: var(--color-text-muted);">${c.reversed ? 'Verkehrt — ' + c.meaning_rev : 'Aufrecht — ' + c.meaning_up}</span>
        </div>
      </div>
    `).join('');
  }

  filterCards() {
    const filter = document.getElementById('arcanaFilter').value;
    const cards = filter === 'all' ? this.cards :
      filter === 'major' ? getMajorArcana() :
      filter === 'minor' ? this.cards.filter(c => c.arcana === 'minor') :
      filter === 'wands' ? getCardsBySuit('wands') :
      filter === 'cups' ? getCardsBySuit('cups') :
      filter === 'swords' ? getCardsBySuit('swords') :
      getCardsBySuit('pentacles');
    // Note: getCardsBySuit/getMajorArcana/getRandomCards come from tarot.js import
    this.cards = cards;
    this.renderGrid();
  }

  onShow() {
    // Refresh grid if needed
  }
}
