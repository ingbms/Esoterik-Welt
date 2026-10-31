// Crystals Module — Kristall-Katalog (Task 5) mit Filter, Grid/List, Favoriten, Detail-Modal
export class CrystalsModule {
  constructor() {
    this.crystals = [];
    this.filtered = [];
    this.viewMode = 'grid';
    this.favIds = new Set();
    this.filters = { chakras: new Set(), colors: new Set(), effects: new Set(), query: '', favOnly: false };
    this.modal = document.getElementById('crystalModal');
    this.modalBody = document.getElementById('crystalModalBody');
    this.closeBtn = document.getElementById('closeCrystalModal');
    this.gridEl = document.getElementById('crystalGrid');
    this.searchEl = document.getElementById('crystalSearch');
    this.favCounterEl = null;
    this.debounceTimer = null;
  }

  async init() {
    await this.loadData();
    this.loadFavorites();
    this.buildFilterUI();
    this.renderFilterChips();
    this.renderGrid();
    this.setupEventListeners();
    this.updateFavCounter();
  }

  async loadData() {
    try {
      const res = await fetch('./data/crystals.json');
      const data = await res.json();
      const list = (data && data.crystals) ? data.crystals : (Array.isArray(data) ? data : []);
      this.crystals = list.map(c => this.normalize(c));
      this.filtered = [...this.crystals];
    } catch (e) {
      console.error('Crystals data load failed:', e);
      this.crystals = [];
    }
  }

  normalize(c) {
    const name = c.name || '—';
    const colorRaw = (c.color || '').trim();
    const color = this.mapColor(colorRaw);
    const chakraStr = (c.chakra || '').trim();
    const chakras = chakraStr ? [chakraStr] : [];
    const effectStr = (c.effect || c.tags || c.keywords || '').toString();
    const effects = effectStr.split(',').map(s => s.trim()).filter(Boolean);
    // image_placeholder describes an asset that has not been shipped.
    const img = c.image || null;
    return {
      id: c.id || ('crys-' + Math.random().toString(36).slice(2, 9)),
      name,
      chemical_formula: c.chemical_formula || '',
      hardness: c.hardness != null ? c.hardness : '',
      chakra: chakras,
      colorRaw,
      color,
      effect: effects,
      description: c.description || '',
      image: img || this.emojiForName(name),
      rarity: c.rarity || '',
    };
  }

  mapColor(s) {
    const m = {
      'violett': 'purple', 'lila': 'purple', 'violet': 'purple',
      'rosa': 'pink', 'pink': 'pink',
      'rot': 'red', 'red': 'red',
      'orange': 'orange', 'gelb-gold': 'yellow', 'gelb': 'yellow', 'yellow': 'yellow',
      'grün': 'green', 'green': 'green',
      'blau': 'blue', 'blau / gold': 'blue', 'dunkelblau / gold': 'blue',
      'schwarz': 'black', 'black': 'black',
      'weiß': 'white', 'weiss': 'white', 'white': 'white',
    };
    const k = (s || '').toLowerCase();
    return m[k] || k || 'primary';
  }

  emojiForName(name) {
    const map = { 'Amethyst': '💜', 'Quarz': '💎', 'Zitrin': '💛', 'Obsidian': '🖤', 'Lapis Lazuli': '💙', 'Karneol': '🧡', 'Avaventurin': '💚', 'Labradorit': '🔮', 'Mondstein': '🌙', 'Granat': '🔴' };
    for (const [k, v] of Object.entries(map)) if (name.toLowerCase().includes(k.toLowerCase())) return v;
    return '💎';
  }

  loadFavorites() {
    try {
      const raw = localStorage.getItem('esot_crystals_fav');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.slice(0, 100).forEach(id => this.favIds.add(id));
      }
    } catch (e) { }
  }

  saveFavorites() {
    try {
      const arr = Array.from(this.favIds).slice(-100);
      localStorage.setItem('esot_crystals_fav', JSON.stringify(arr));
    } catch (e) { }
  }

  toggleFavorite(id) {
    if (this.favIds.has(id)) this.favIds.delete(id); else this.favIds.add(id);
    this.saveFavorites();
    this.renderGrid();
    this.updateFavCounter();
  }

  updateFavCounter() {
    if (!this.favCounterEl) {
      this.favCounterEl = document.getElementById('favCounter');
      if (!this.favCounterEl) {
        const headerInner = document.querySelector('.header-inner');
        if (headerInner) {
          const span = document.createElement('span');
          span.id = 'favCounter';
          span.className = 'badge badge-primary';
          span.setAttribute('aria-label', 'Anzahl Kristall-Favoriten');
          span.setAttribute('aria-live', 'polite');
          headerInner.appendChild(span);
          this.favCounterEl = span;
        }
      }
    }
    if (this.favCounterEl) this.favCounterEl.textContent = `♥ ${this.favIds.size}`;
  }

  buildFilterUI() {
    const container = document.getElementById('crystalFilterContainer');
    if (!container) return;
    const allChakras = [...new Set(this.crystals.flatMap(c => c.chakra))].sort();
    const allColors = [...new Set(this.crystals.map(c => c.colorRaw || c.color))].sort();
    const allEffects = [...new Set(this.crystals.flatMap(c => c.effect))].sort();

    const makeGroup = (label, values) => {
      const div = document.createElement('div');
      div.className = 'filter-group mb-3';
      const h4 = document.createElement('h4');
      h4.textContent = label; h4.style.fontSize = 'var(--text-sm)'; h4.style.margin = 'var(--space-1) 0';
      div.appendChild(h4);
      const btns = document.createElement('div');
      btns.className = 'flex flex-wrap gap-2';
      values.forEach(v => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost btn-sm';
        btn.textContent = v;
        btn.dataset.value = v;
        btn.addEventListener('click', () => {
          if (label.includes('Chakra')) {
            this.filters.chakras.has(v) ? this.filters.chakras.delete(v) : this.filters.chakras.add(v);
          } else if (label.includes('Farbe')) {
            this.filters.colors.has(v) ? this.filters.colors.delete(v) : this.filters.colors.add(v);
          } else if (label.includes('Wirkung')) {
            this.filters.effects.has(v) ? this.filters.effects.delete(v) : this.filters.effects.add(v);
          }
          this.applyFilters();
        });
        btns.appendChild(btn);
      });
      div.appendChild(btns);
      return div;
    };

    container.innerHTML = '';
    if (allChakras.length) container.appendChild(makeGroup('Chakra', allChakras));
    if (allColors.length) container.appendChild(makeGroup('Farbe', allColors));
    if (allEffects.length) container.appendChild(makeGroup('Wirkung', allEffects));

    const favToggle = document.createElement('button');
    favToggle.type = 'button';
    favToggle.id = 'favOnlyBtn';
    favToggle.className = 'btn btn-secondary btn-sm';
    favToggle.textContent = 'Nur Favoriten';
    favToggle.setAttribute('aria-pressed', 'false');
    favToggle.addEventListener('click', () => {
      const active = favToggle.getAttribute('aria-pressed') === 'true';
      favToggle.setAttribute('aria-pressed', String(!active));
      favToggle.classList.toggle('btn-primary', !active);
      favToggle.classList.toggle('btn-secondary', active);
      this.filters.favOnly = !active;
      this.applyFilters();
    });
    const favWrap = document.createElement('div');
    favWrap.className = 'mt-2';
    favWrap.appendChild(favToggle);
    container.appendChild(favWrap);
  }

  renderFilterChips() {
    const el = document.getElementById('activeFilterBadges');
    if (!el) return;
    const items = [];
    this.filters.chakras.forEach(v => items.push({ label: v, type: 'chakra' }));
    this.filters.colors.forEach(v => items.push({ label: v, type: 'color' }));
    this.filters.effects.forEach(v => items.push({ label: v, type: 'effect' }));
    if (this.filters.query) items.push({ label: `Suche: ${this.filters.query}`, type: 'query' });
    if (this.filters.favOnly) items.push({ label: 'Nur Favoriten', type: 'fav' });
    if (!items.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = items.map(it => `<span class="badge badge-primary">${it.label} <button type="button" aria-label="Entfernen" class="badge-remove" data-type="${it.type}" data-val="${it.label}">×</button></span>`).join(' ');
    el.querySelectorAll('.badge-remove').forEach(b => {
      b.addEventListener('click', () => {
        const t = b.dataset.type; const v = b.dataset.val;
        if (t === 'chakra') this.filters.chakras.delete(v);
        else if (t === 'color') this.filters.colors.delete(v);
        else if (t === 'effect') this.filters.effects.delete(v);
        else if (t === 'query') this.filters.query = '';
        if (t === 'fav') { this.filters.favOnly = false; const btn = document.getElementById('favOnlyBtn'); if (btn) { btn.setAttribute('aria-pressed','false'); btn.classList.remove('btn-primary'); btn.classList.add('btn-secondary'); } }
        this.searchEl.value = this.filters.query;
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    this.filters.query = (this.searchEl ? this.searchEl.value : '').trim();
    let out = this.crystals;
    if (this.filters.favOnly) out = out.filter(c => this.favIds.has(c.id));
    if (this.filters.chakras.size) out = out.filter(c => c.chakra.some(ch => this.filters.chakras.has(ch)));
    if (this.filters.colors.size) out = out.filter(c => this.filters.colors.has(c.colorRaw || c.color));
    if (this.filters.effects.size) out = out.filter(c => c.effect.some(e => this.filters.effects.has(e)));
    if (this.filters.query) {
      const q = this.filters.query.toLowerCase();
      out = out.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.chemical_formula.toLowerCase().includes(q));
    }
    this.filtered = out;
    this.renderFilterChips();
    this.renderGrid();
  }

  renderGrid() {
    if (!this.gridEl) return;
    if (!this.filtered.length) {
      this.gridEl.innerHTML = '<p class="text-center text-muted">Keine Kristalle gefunden.</p>';
      return;
    }
    const isList = this.viewMode === 'list';
    const html = this.filtered.map(c => {
      const fav = this.favIds.has(c.id) ? '♥' : '♡';
      const chord = c.chakra.map(ch => `<span class="badge badge-chakra">${ch}</span>`).join('');
      const imgPart = c.image ? (c.image.startsWith('assets/') || c.image.startsWith('http')
        ? `<img data-src="${c.image}" alt="" loading="lazy" decoding="async" width="320" height="320" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
        : `<div style="font-size:2.5rem;line-height:1;">${c.image}</div>`) : '';
      if (isList) {
        return `<article class="card crystal-card crystal-card-interactive crystal-list-row" data-id="${c.id}">
          <div class="crystal-thumb" style="flex:0 0 120px;min-height:120px;background:linear-gradient(135deg,var(--color-border-glow),var(--color-border));display:flex;align-items:center;justify-content:center;border-radius:var(--radius-md);overflow:hidden;">${imgPart}</div>
          <div class="crystal-content" style="flex:1;min-width:0;">
            <div class="flex justify-between items-start gap-2"><h3 class="crystal-name" style="margin:0;font-size:1.15rem;">${c.name}</h3><button type="button" class="btn btn-ghost btn-sm favorite-btn" aria-label="${this.favIds.has(c.id) ? 'Favorit entfernen' : 'Als Favorit speichern'}" data-id="${c.id}">${fav}</button></div>
            <div class="crystal-meta">${chord} <span class="badge badge-secondary">${c.colorRaw || c.color}</span></div>
            <p class="crystal-desc" style="margin:.25rem 0 0;">${c.description.substring(0, 160)}${c.description.length > 160 ? '...' : ''}</p>
            <button type="button" class="btn btn-secondary btn-sm crystal-details-btn" aria-label="Details zu ${c.name} öffnen">Details anzeigen</button>
            <div class="text-muted" style="font-size:.8rem;">Formel: ${c.chemical_formula || '—'} · Härte: ${c.hardness != null ? c.hardness + ' Mohs' : '—'} · ${c.rarity || ''}</div>
          </div>
        </article>`;
      }
      return `<article class="card crystal-card crystal-card-interactive" data-id="${c.id}">
        <div class="crystal-image" style="aspect-ratio:1;overflow:hidden;background:linear-gradient(135deg,var(--color-border-glow),var(--color-border));display:flex;align-items:center;justify-content:center;">${imgPart}</div>
        <div class="crystal-content">
          <div class="flex justify-between items-start gap-2"><h3 class="crystal-name">${c.name}</h3><button type="button" class="btn btn-ghost btn-sm favorite-btn" aria-label="${this.favIds.has(c.id) ? 'Favorit entfernen' : 'Als Favorit speichern'}" data-id="${c.id}">${fav}</button></div>
          <div class="crystal-meta">${chord} <span class="badge badge-secondary">${c.colorRaw || c.color}</span></div>
          <p class="crystal-desc">${c.description.substring(0, 120)}${c.description.length > 120 ? '...' : ''}</p>
          <button type="button" class="btn btn-secondary btn-sm crystal-details-btn" aria-label="Details zu ${c.name} öffnen">Details anzeigen</button>
          <div class="text-muted" style="font-size:.75rem;margin-top:.25rem;">${c.chemical_formula ? c.chemical_formula + ' · ' : ''}Härte ${c.hardness != null ? c.hardness : '—'}</div>
        </div>
      </article>`;
    }).join('');
    this.gridEl.innerHTML = html;
    this.imageObserver?.disconnect();
    const images = this.gridEl.querySelectorAll('img[data-src]');
    const load = img => { img.src = img.dataset.src; delete img.dataset.src; };
    if ('loading' in HTMLImageElement.prototype || !('IntersectionObserver' in window)) {
      images.forEach(load);
    } else {
      this.imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { load(entry.target); this.imageObserver.unobserve(entry.target); }
        });
      }, { rootMargin: '200px' });
      images.forEach(img => this.imageObserver.observe(img));
    }
    this.gridEl.className = isList ? 'crystal-list' : 'grid grid-auto';
    if (isList) { this.gridEl.style.gridTemplateColumns = '1fr'; } else { this.gridEl.style.gridTemplateColumns = ''; }

    this.gridEl.querySelectorAll('.crystal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-btn')) return;
        this.openCrystalModal(card.dataset.id);
      });

    });
    this.gridEl.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.toggleFavorite(id);
        [...this.gridEl.querySelectorAll('.favorite-btn')].find(b => b.dataset.id === id)?.focus();
      });
    });
  }

  setViewMode(mode) {
    this.viewMode = mode;
    const gb = document.getElementById('viewGridBtn'), lb = document.getElementById('viewListBtn');
    if (gb) gb.setAttribute('aria-pressed', mode === 'grid' ? 'true' : 'false');
    if (lb) lb.setAttribute('aria-pressed', mode === 'list' ? 'true' : 'false');
    this.renderGrid();
  }

  openCrystalModal(id) {
    const c = this.crystals.find(x => x.id === id); if (!c) return;
    const related = this.crystals.filter(x => x.id !== id && (x.color === c.color || x.chakra.some(ch => c.chakra.includes(ch)))).slice(0, 3);
    const relatedHtml = related.length ? `<div class="mt-4"><h4 style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-2);">Verwandte Steine</h4><div class="flex flex-wrap gap-2">` + related.map(r => `<button type="button" class="btn btn-ghost btn-sm" onclick="window.crystalsModule.openCrystalModal('${r.id}')">${r.name}</button>`).join('') + `</div></div>` : '';
    this.modalBody.innerHTML = `
      <div style="display:grid;gap:var(--space-6);grid-template-columns:1fr 2fr;align-items:start;">
        <div style="aspect-ratio:1;border-radius:var(--radius-lg);background:linear-gradient(135deg,var(--color-border-glow),var(--color-border));display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:240px;">
          ${c.image && c.image.startsWith('assets/') ? `<img src="${c.image}" alt="" decoding="async" width="320" height="320" style="width:100%;height:100%;object-fit:cover;">` : `<div style="font-size:4rem;">${c.image}</div>`}
        </div>
        <div>
          <h3 style="font-family:var(--font-display);color:var(--color-primary);margin-bottom:var(--space-1);font-size:1.6rem;">${c.name}</h3>
          <div class="flex flex-wrap gap-2 mb-3">${c.chakra.map(ch => `<span class="badge badge-chakra">${ch}</span>`).join('')} <span class="badge badge-secondary">${c.colorRaw || c.color}</span></div>
          <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-muted);margin-bottom:var(--space-1);">Chemische Formel</h4><p style="font-family:var(--font-mono);color:var(--color-text-secondary);margin:0 0 var(--space-3);">${c.chemical_formula || '—'}</p>
          <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-muted);margin-bottom:var(--space-1);">Härte</h4><p style="color:var(--color-text-secondary);margin:0 0 var(--space-3);">${c.hardness != null ? c.hardness + ' (Mohs)' : '—'}</p>
          <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-muted);margin-bottom:var(--space-1);">Wirkt auf</h4><p style="color:var(--color-text-secondary);margin:0 0 var(--space-3);">${c.effect.join(', ') || '—'}</p>
          <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-muted);margin-bottom:var(--space-1);">Beschreibung</h4><p style="line-height:1.7;color:var(--color-text-secondary);margin:0 0 var(--space-2);">${c.description}</p>
          ${relatedHtml}
        </div>
      </div>
    `;
    document.getElementById('crystalModalTitle').textContent = c.name;
    this.modal.hidden = false;
    requestAnimationFrame(() => this.modal.classList.add('open'));
    document.body.style.overflow = 'hidden';
    this.trapFocus();
    setTimeout(() => { try { document.getElementById('closeCrystalModal').focus(); } catch(e){} }, 50);
  }

  closeCrystalModal() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
    setTimeout(() => { this.modal.hidden = true; document.body.style.overflow = ''; this.restoreFocus(); }, 250);
  }

  trapFocus() {
    this.previouslyFocused = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this.closeCrystalModal(); return; }
      if (e.key === 'Tab') {
        const focusables = Array.from(this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
        if (!focusables.length) return;
        const first = focusables[0]; const last = focusables[focusables.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    this._keyHandler = onKey;
    document.addEventListener('keydown', onKey);
  }

  restoreFocus() {
    document.removeEventListener('keydown', this._keyHandler);
    try { if (this.previouslyFocused && this.previouslyFocused.focus) this.previouslyFocused.focus(); } catch(e){}
  }

  setupEventListeners() {
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeCrystalModal());
    if (this.modal) this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeCrystalModal(); });
    if (this.searchEl) {
      this.searchEl.addEventListener('input', () => { clearTimeout(this.debounceTimer); this.debounceTimer = setTimeout(() => this.applyFilters(), 150); });
    }
    document.getElementById('viewGridBtn')?.addEventListener('click', () => this.setViewMode('grid'));
    document.getElementById('viewListBtn')?.addEventListener('click', () => this.setViewMode('list'));
  }
}

window.crystalsModule = null;
export function initCrystalsModule() {
  window.crystalsModule = new CrystalsModule();
  window.crystalsModule.init();
}
