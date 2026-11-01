// Blog Module
import { renderArticleContent } from '../article-content.js';
export class BlogModule {
  constructor(modal, modalBody, closeBtn) {
    this.modal = modal;
    this.modalBody = modalBody;
    this.closeBtn = closeBtn;
    this.articles = [];
    this.onArticleOpened = null;
  }

  async init() {
    const mod = await import('../data/articles.js');
    this.articles = mod.articles || mod.default || [];
    this.renderGrid();
    this.setupEventListeners();
  }

  renderGrid() {
    if (!this.articles.length) return;
    this.renderCards(this.articles);
    this.syncArticleStatus(this.articles.length);
  }

  renderCards(list) {
    const grid = document.getElementById('articleGrid');
    if (!grid) return;
    grid.innerHTML = list
      .map(
        (a) => `
      <article class="card article-card" data-id="${a.id}" tabindex="0" role="button" aria-label="Artikel: ${a.title}">
        <div class="article-image article-placeholder" aria-hidden="true">📜</div>
        <div class="article-content">
          <div class="article-meta">
            <span class="badge badge-primary">${a.category}</span>
            <span class="text-xs">${a.date}</span>
            <span class="text-xs">⏱ ${a.readTime}</span>
          </div>
          <h2 class="article-title">${a.title}</h2>
          <p class="article-excerpt">${a.excerpt}</p>
          <div class="article-footer">
            <div class="flex gap-2 flex-wrap">
              ${a.tags.map((t) => `<span class="badge">${t}</span>`).join('')}
            </div>
          </div>
        </div>
      </article>
    `
      )
      .join('');

    grid.querySelectorAll('.article-card').forEach((card) => {
      card.addEventListener('click', () => this.openArticleModal(parseInt(card.dataset.id)));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openArticleModal(parseInt(card.dataset.id));
        }
      });
    });
  }

  // Every published article is rendered at once: there is no second page of
  // articles, so a "load more" control would only re-render the same cards.
  syncArticleStatus(shown) {
    const total = this.articles.length;
    const button = document.getElementById('loadMoreArticles');
    const status = document.getElementById('articleListStatus');
    if (button) {
      button.hidden = true;
      button.disabled = true;
    }
    if (status) {
      status.hidden = !total;
      status.textContent = !total
        ? ''
        : shown === total
          ? `Alle ${total} Artikel werden angezeigt.`
          : `${shown} von ${total} Artikeln werden angezeigt.`;
    }
  }

  findArticle(id) {
    return this.articles.find((a) => a.id === id) || null;
  }

  openArticleModal(id, { updateUrl = true } = {}) {
    const article = this.findArticle(id);
    if (!article) return false;
    const metadata = document.createElement('div');
    metadata.className = 'flex gap-3 mb-4 flex-wrap';
    const badge = (text, className = 'badge') => {
      const span = document.createElement('span');
      span.className = className;
      span.textContent = text;
      return span;
    };
    metadata.append(badge(article.category, 'badge badge-primary'));
    metadata.append(badge(`${article.date} · ⏱ ${article.readTime}`, 'text-xs text-muted'));
    const tags = document.createElement('div');
    tags.className = 'flex gap-1 flex-wrap';
    for (const tag of article.tags) tags.append(badge(tag));
    metadata.append(tags);
    const prose = document.createElement('div');
    prose.className = 'article-prose';
    prose.append(renderArticleContent(article.content || article.excerpt || ''));
    this.modalBody.replaceChildren(metadata, prose);
    document.getElementById('articleModalTitle').textContent = article.title;
    this.modal.dialogController.open();
    if (updateUrl && typeof this.onArticleOpened === 'function') this.onArticleOpened(article.id);
    return true;
  }

  setupEventListeners() {
    document.getElementById('categoryFilter')?.addEventListener('change', () => this.filterArticles());
    document.getElementById('articleSearch')?.addEventListener('input', () => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => this.filterArticles(), 300);
    });
  }

  filterArticles() {
    const category = document.getElementById('categoryFilter').value;
    const query = document.getElementById('articleSearch')?.value || '';

    let filtered = this.articles;
    if (category !== 'all') filtered = filtered.filter((a) => a.category === category);
    if (query)
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      );
    this.filters = { category, query, filtered };
    this.updateGrid(filtered);
  }

  updateGrid(filtered) {
    const grid = document.getElementById('articleGrid');
    if (!grid) return;
    if (!filtered || !filtered.length) {
      grid.innerHTML = '<p class="text-center text-muted">Keine Artikel gefunden.</p>';
      this.syncArticleStatus(0);
      return;
    }
    this.renderCards(filtered);
    this.syncArticleStatus(filtered.length);
  }

  onShow() {}
}
