// Blog Module
export class BlogModule {
  constructor(modal, modalBody, closeBtn) {
    this.modal = modal;
    this.modalBody = modalBody;
    this.closeBtn = closeBtn;
    this.articles = window.articles || [];
  }

  async init() {
    await import('../data/articles.js');
    this.articles = window.articles || [];
    this.renderGrid();
    this.setupEventListeners();
  }

  renderGrid() {
    const grid = document.getElementById('articleGrid');
    if (!grid || !this.articles.length) return;
    grid.innerHTML = this.articles.map(a => `
      <article class="card article-card" data-id="${a.id}" tabindex="0" role="button" aria-label="Artikel: ${a.title}">
        <img class="article-image" src="https://picsum.photos/seed/${a.id}/600/340" alt="Artikel Illustration" loading="lazy" onerror="this.style.background='linear-gradient(135deg,#120a1f,#2d1b47)'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center'; this.outerHTML='<div class=\'article-image\' style=\'background:linear-gradient(135deg,#120a1f,#2d1b47);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:3rem;color:var(--color-primary);\'>📜</div>';">
        <div class="article-content">
          <div class="article-meta">
            <span class="badge badge-primary">${a.category}</span>
            <span class="text-xs">${a.date}</span>
            <span class="text-xs">⏱ ${a.readTime}</span>
          </div>
          <h3 class="article-title">${a.title}</h3>
          <p class="article-excerpt">${a.excerpt}</p>
          <div class="article-footer">
            <div class="flex gap-2 flex-wrap">
              ${a.tags.map(t => `<span class="badge">${t}</span>`).join('')}
            </div>
          </div>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.article-card').forEach(card => {
      card.addEventListener('click', () => this.openArticleModal(parseInt(card.dataset.id)));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openArticleModal(parseInt(card.dataset.id));
        }
      });
    });
  }

  openArticleModal(id) {
    const article = this.articles.find(a => a.id === id);
    if (!article) return;
    this.modalBody.innerHTML = `
      <h2 style="font-family: var(--font-display); color: var(--color-primary); margin-bottom: var(--space-3);">${article.title}</h2>
      <div class="flex gap-3 mb-4 flex-wrap">
        <span class="badge badge-primary">${article.category}</span>
        <span class="text-xs text-muted">${article.date} · ⏱ ${article.readTime}</span>
        <div class="flex gap-1 flex-wrap">${article.tags.map(t => `<span class="badge">${t}</span>`).join('')}</div>
      </div>
      <div style="line-height: 1.75; color: var(--color-text-secondary); font-size: var(--text-base);">
        ${article.content ? article.content.replace(/\n/g, '<br>') : `<p style="color: var(--color-text-muted);">${article.excerpt}</p><p style="color: var(--color-text-muted); font-style: italic;">Vollständiger Artikel wird geladen...</p>`}
      </div>
    `;
    document.getElementById('articleModalTitle').textContent = article.title;
    this.modal.hidden = false;
    requestAnimationFrame(() => this.modal.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }

  setupEventListeners() {
    document.getElementById('categoryFilter')?.addEventListener('change', () => this.filterArticles());
    document.getElementById('articleSearch')?.addEventListener('input', () => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => this.filterArticles(), 300);
    });
    document.getElementById('loadMoreArticles')?.addEventListener('click', () => {
      // For demo: reload same articles
      this.renderGrid();
    });
  }

  filterArticles() {
    const category = document.getElementById('categoryFilter').value;
    const query = document.getElementById('articleSearch')?.value || '';

    let filtered = this.articles;
    if (category !== 'all') filtered = filtered.filter(a => a.category === category);
    if (query) filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
    );
    this.filters = { category, query, filtered };
    this.updateGrid(filtered);
  }

  updateGrid(filtered) {
    const grid = document.getElementById('articleGrid');
    if (!grid) return;
    if (!filtered || !filtered.length) {
      grid.innerHTML = '<p class="text-center text-muted">Keine Artikel gefunden.</p>';
      return;
    }
    const cards = grid.querySelectorAll('.article-card');
    // Re-render
    grid.innerHTML = filtered.map(a => `
      <article class="card article-card" data-id="${a.id}" tabindex="0" role="button" aria-label="Artikel: ${a.title}">
        <img class="article-image" src="https://picsum.photos/seed/${a.id}/600/340" alt="Artikel Illustration" loading="lazy" onerror="this.style.background='linear-gradient(135deg,#120a1f,#2d1b47)';this.style.display='flex';this.style.alignItems='center';this.style.justifyContent='center';this.style.fontFamily='var(--font-display)';this.style.fontSize='3rem';this.style.color='var(--color-primary)';this.innerHTML='📜';this.removeAttribute('onerror');this.style.height='100%';">
        <div class="article-content">
          <div class="article-meta">
            <span class="badge badge-primary">${a.category}</span>
            <span class="text-xs">${a.date}</span>
            <span class="text-xs">⏱ ${a.readTime}</span>
          </div>
          <h3 class="article-title">${a.title}</h3>
          <p class="article-excerpt">${a.excerpt}</p>
          <div class="article-footer">
            <div class="flex gap-2 flex-wrap">${a.tags.map(t => `<span class="badge">${t}</span>`).join('')}</div>
          </div>
        </div>
      </article>
    `).join('');
    grid.querySelectorAll('.article-card').forEach(card => {
      card.addEventListener('click', () => this.openArticleModal(parseInt(card.dataset.id)));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openArticleModal(parseInt(card.dataset.id));
        }
      });
    });
  }

  onShow() {}
}
