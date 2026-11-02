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
      // The generated file:// build embeds the canonical JSON; HTTP keeps loading it normally.
      const embedded = document.getElementById('local-crystals-data');
      const data = embedded ? JSON.parse(embedded.textContent) : await (await fetch('./data/crystals.json')).json();
      const list = data && data.crystals ? data.crystals : Array.isArray(data) ? data : [];
      this.crystals = list.map((c) => this.normalize(c));
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
    const effects = effectStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    // image describes a shipped asset; image_placeholder was the pre-integration marker.
    const img = c.image || null;
    const credit = c.image_credit || null;
    return {
      id: c.id || 'crys-' + Math.random().toString(36).slice(2, 9),
      name,
      chemical_formula: c.chemical_formula || '',
      hardness: c.hardness != null ? c.hardness : '',
      chakra: chakras,
      colorRaw,
      color,
      effect: effects,
      description: c.description || '',
      image: img || this.emojiForName(name),
      hasPhoto: Boolean(img && img.startsWith('assets/')),
      imageStem: c.image_stem || '',
      imageFile: c.image_file || '',
      imageAlt: c.image_alt || '',
      imageCredit: credit
        ? {
            author: credit.author || '',
            sourceLabel: credit.source_label || 'Wikimedia Commons',
            sourceUrl: credit.source_url || '',
            license: credit.license || '',
            licenseUrl: credit.license_url || '',
            retrieved: credit.retrieved || '',
            changes: credit.changes || '',
            short: c.attribution_text_short || credit.short || '',
          }
        : null,
      rarity: c.rarity || '',
    };
  }

  mapColor(s) {
    const m = {
      violett: 'purple',
      lila: 'purple',
      violet: 'purple',
      rosa: 'pink',
      pink: 'pink',
      rot: 'red',
      red: 'red',
      orange: 'orange',
      'gelb-gold': 'yellow',
      gelb: 'yellow',
      yellow: 'yellow',
      grün: 'green',
      green: 'green',
      blau: 'blue',
      'blau / gold': 'blue',
      'dunkelblau / gold': 'blue',
      schwarz: 'black',
      black: 'black',
      weiß: 'white',
      weiss: 'white',
      white: 'white',
    };
    const k = (s || '').toLowerCase();
    return m[k] || k || 'primary';
  }

  emojiForName(name) {
    const map = {
      Amethyst: '💜',
      Quarz: '💎',
      Zitrin: '💛',
      Obsidian: '🖤',
      'Lapis Lazuli': '💙',
      Karneol: '🧡',
      Avaventurin: '💚',
      Labradorit: '🔮',
      Mondstein: '🌙',
      Granat: '🔴',
    };
    for (const [k, v] of Object.entries(map)) if (name.toLowerCase().includes(k.toLowerCase())) return v;
    return '💎';
  }

  loadFavorites() {
    try {
      const raw = localStorage.getItem('esot_crystals_fav');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.slice(0, 100).forEach((id) => this.favIds.add(id));
      }
    } catch (e) {}
  }

  saveFavorites() {
    try {
      const arr = Array.from(this.favIds).slice(-100);
      localStorage.setItem('esot_crystals_fav', JSON.stringify(arr));
    } catch (e) {}
  }

  toggleFavorite(id) {
    if (this.favIds.has(id)) this.favIds.delete(id);
    else this.favIds.add(id);
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
    const allChakras = [...new Set(this.crystals.flatMap((c) => c.chakra))].sort();
    const allColors = [...new Set(this.crystals.map((c) => c.colorRaw || c.color))].sort();
    const allEffects = [...new Set(this.crystals.flatMap((c) => c.effect))].sort();

    const makeGroup = (label, values) => {
      const div = document.createElement('div');
      div.className = 'filter-group mb-3';
      const h4 = document.createElement('h2');
      h4.textContent = label;
      h4.style.fontSize = 'var(--text-sm)';
      h4.style.margin = 'var(--space-1) 0';
      div.appendChild(h4);
      const btns = document.createElement('div');
      btns.className = 'flex flex-wrap gap-2';
      values.forEach((v) => {
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
    this.filters.chakras.forEach((v) => items.push({ label: v, type: 'chakra' }));
    this.filters.colors.forEach((v) => items.push({ label: v, type: 'color' }));
    this.filters.effects.forEach((v) => items.push({ label: v, type: 'effect' }));
    if (this.filters.query) items.push({ label: `Suche: ${this.filters.query}`, type: 'query' });
    if (this.filters.favOnly) items.push({ label: 'Nur Favoriten', type: 'fav' });
    if (!items.length) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    el.innerHTML = items
      .map(
        (it) =>
          `<span class="badge badge-primary">${it.label} <button type="button" aria-label="Entfernen" class="badge-remove" data-type="${it.type}" data-val="${it.label}">×</button></span>`
      )
      .join(' ');
    el.querySelectorAll('.badge-remove').forEach((b) => {
      b.addEventListener('click', () => {
        const t = b.dataset.type;
        const v = b.dataset.val;
        if (t === 'chakra') this.filters.chakras.delete(v);
        else if (t === 'color') this.filters.colors.delete(v);
        else if (t === 'effect') this.filters.effects.delete(v);
        else if (t === 'query') this.filters.query = '';
        if (t === 'fav') {
          this.filters.favOnly = false;
          const btn = document.getElementById('favOnlyBtn');
          if (btn) {
            btn.setAttribute('aria-pressed', 'false');
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
          }
        }
        this.searchEl.value = this.filters.query;
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    this.filters.query = (this.searchEl ? this.searchEl.value : '').trim();
    let out = this.crystals;
    if (this.filters.favOnly) out = out.filter((c) => this.favIds.has(c.id));
    if (this.filters.chakras.size) out = out.filter((c) => c.chakra.some((ch) => this.filters.chakras.has(ch)));
    if (this.filters.colors.size) out = out.filter((c) => this.filters.colors.has(c.colorRaw || c.color));
    if (this.filters.effects.size) out = out.filter((c) => c.effect.some((e) => this.filters.effects.has(e)));
    if (this.filters.query) {
      const q = this.filters.query.toLowerCase();
      out = out.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.chemical_formula.toLowerCase().includes(q)
      );
    }
    this.filtered = out;
    this.renderFilterChips();
    this.renderGrid();
  }

  escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Vier Stufen wie im ausgelieferten Manifest (320/640/960/1280).
  levelPaths(c) {
    if (!c.imageStem || !c.imageFile) return [];
    return [320, 640, 960, 1280].map((w) => ({ width: w, path: `${c.imageStem}/${w}/${c.imageFile}` }));
  }

  // Bildplatte der Karte: 1:1, srcset/sizes, Lazy Loading, fester Rahmen.
  figureHtml(c) {
    if (!c.hasPhoto) {
      return `<div class="crystal-image"><span class="crystal-glyph" aria-hidden="true">${c.image}</span></div>`;
    }
    const levels = this.levelPaths(c);
    const fallback = levels[1] ? levels[1].path : c.image;
    const srcset = levels.map((l) => `${l.path} ${l.width}w`).join(', ');
    const sizes =
      '(min-width: 1256px) 320px, (min-width: 952px) 30vw, (min-width: 632px) 51vw, (min-width: 380px) 94vw, 88vw';
    const credit = c.imageCredit?.short
      ? `<figcaption class="crystal-credit">${this.escapeHtml(c.imageCredit.short)}</figcaption>`
      : '';
    return `<figure class="crystal-figure">
            <div class="crystal-image">
              <img class="crystal-photo" data-src="${fallback}" data-srcset="${srcset}" sizes="${sizes}"
                   width="640" height="640" loading="lazy" decoding="async" alt="">
            </div>
            ${credit}
          </figure>`;
  }

  renderGrid() {
    if (!this.gridEl) return;
    if (!this.filtered.length) {
      this.gridEl.innerHTML = '<p class="text-center text-muted">Keine Kristalle gefunden.</p>';
      return;
    }
    const isList = this.viewMode === 'list';
    const html = this.filtered
      .map((c) => {
        const fav = this.favIds.has(c.id) ? '♥' : '♡';
        const chord = c.chakra.map((ch) => `<span class="badge badge-chakra">${ch}</span>`).join('');
        const figure = this.figureHtml(c);
        const creditInline =
          isList && c.imageCredit?.short
            ? `<p class="crystal-credit-inline">${this.escapeHtml(c.imageCredit.short)}</p>`
            : '';
        if (isList) {
          return `<article class="card crystal-card crystal-card-interactive crystal-list-row" data-id="${c.id}">
          ${figure}
          <div class="crystal-content" style="flex:1;min-width:0;">
            <div class="flex justify-between items-start gap-2"><h2 class="crystal-name" style="margin:0;font-size:1.15rem;">${c.name}</h2><button type="button" class="btn btn-ghost btn-sm favorite-btn" aria-label="${this.favIds.has(c.id) ? 'Favorit entfernen' : 'Als Favorit speichern'}" data-id="${c.id}">${fav}</button></div>
            <div class="crystal-meta">${chord} <span class="badge badge-secondary">${c.colorRaw || c.color}</span></div>
            <p class="crystal-desc" style="margin:.25rem 0 0;">${c.description.substring(0, 160)}${c.description.length > 160 ? '...' : ''}</p>
            <button type="button" class="btn btn-secondary btn-sm crystal-details-btn" aria-label="Details zu ${c.name} öffnen">Details anzeigen</button>
            <div class="text-muted" style="font-size:.8rem;">Formel: ${c.chemical_formula || '—'} · Härte: ${c.hardness != null ? c.hardness + ' Mohs' : '—'} · ${c.rarity || ''}</div>
            ${creditInline}
          </div>
        </article>`;
        }
        return `<article class="card crystal-card crystal-card-interactive" data-id="${c.id}">
        ${figure}
        <div class="crystal-content">
          <div class="flex justify-between items-start gap-2"><h2 class="crystal-name">${c.name}</h2><button type="button" class="btn btn-ghost btn-sm favorite-btn" aria-label="${this.favIds.has(c.id) ? 'Favorit entfernen' : 'Als Favorit speichern'}" data-id="${c.id}">${fav}</button></div>
          <div class="crystal-meta">${chord} <span class="badge badge-secondary">${c.colorRaw || c.color}</span></div>
          <p class="crystal-desc">${c.description.substring(0, 120)}${c.description.length > 120 ? '...' : ''}</p>
          <button type="button" class="btn btn-secondary btn-sm crystal-details-btn" aria-label="Details zu ${c.name} öffnen">Details anzeigen</button>
          <div class="text-muted" style="font-size:.75rem;margin-top:.25rem;">${c.chemical_formula ? c.chemical_formula + ' · ' : ''}Härte ${c.hardness != null ? c.hardness : '—'}</div>
        </div>
      </article>`;
      })
      .join('');
    this.gridEl.innerHTML = html;
    this.imageObserver?.disconnect();
    const images = this.gridEl.querySelectorAll('img[data-src]');
    const load = (img) => {
      img.src = img.dataset.src;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      delete img.dataset.src;
      delete img.dataset.srcset;
    };
    // Fehlerzustand: keine leere Flaeche, sondern Glyph + ehrlicher Hinweis.
    images.forEach((img) => {
      img.addEventListener(
        'error',
        () => {
          const plate = img.closest('.crystal-image');
          const card = img.closest('.crystal-card');
          const crystal = this.crystals.find((x) => x.id === card?.dataset.id);
          img.remove();
          if (!plate) return;
          plate.classList.add('is-missing');
          plate.insertAdjacentHTML(
            'beforeend',
            `<span class="crystal-glyph" aria-hidden="true">${crystal ? this.emojiForName(crystal.name) : '💎'}</span>`
          );
          const credit = card?.querySelector('.crystal-credit');
          if (credit) credit.textContent = 'Bild nicht verfügbar';
        },
        { once: true }
      );
    });
    if (!('IntersectionObserver' in window)) {
      // Ohne Observer bleibt nur sofortiges Laden (alte Browser).
      images.forEach(load);
    } else {
      this.imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              load(entry.target);
              this.imageObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '200px' }
      );
      images.forEach((img) => this.imageObserver.observe(img));
    }
    this.gridEl.className = isList ? 'crystal-list' : 'grid grid-auto';
    if (isList) {
      this.gridEl.style.gridTemplateColumns = '1fr';
    } else {
      this.gridEl.style.gridTemplateColumns = '';
    }

    this.gridEl.querySelectorAll('.crystal-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-btn')) return;
        // Tastaturpfad: die Details-Schaltflaeche ist der Ausloeser fuer die
        // Fokus-Rueckgabe (Spec E11), auch beim Klick auf die Kartenflaeche.
        const trigger = card.querySelector('.crystal-details-btn') || card;
        this.openCrystalModal(card.dataset.id, trigger);
      });
    });
    this.gridEl.querySelectorAll('.crystal-details-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.crystal-card');
        this.openCrystalModal(card.dataset.id, btn);
      });
    });
    this.gridEl.querySelectorAll('.favorite-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.toggleFavorite(id);
        [...this.gridEl.querySelectorAll('.favorite-btn')].find((b) => b.dataset.id === id)?.focus();
      });
    });
  }

  setViewMode(mode) {
    this.viewMode = mode;
    const gb = document.getElementById('viewGridBtn'),
      lb = document.getElementById('viewListBtn');
    if (gb) gb.setAttribute('aria-pressed', mode === 'grid' ? 'true' : 'false');
    if (lb) lb.setAttribute('aria-pressed', mode === 'list' ? 'true' : 'false');
    this.renderGrid();
  }

  creditHtml(c) {
    const cr = c.imageCredit;
    if (!cr) return '';
    const license = cr.licenseUrl
      ? `<a href="${cr.licenseUrl}" rel="noopener">${this.escapeHtml(cr.license)}</a>`
      : this.escapeHtml(cr.license);
    const source = cr.sourceUrl
      ? `<a href="${cr.sourceUrl}" rel="noopener">Quelle: ${this.escapeHtml(cr.sourceLabel)}</a>`
      : `Quelle: ${this.escapeHtml(cr.sourceLabel)}`;
    return `<figcaption class="crystal-detail-credit">
            <span class="credit-line"><span class="credit-label">Foto:</span> ${this.escapeHtml(cr.author)} &middot; ${license}</span>
            <span class="credit-line">${source} &middot; abgerufen ${this.escapeHtml(cr.retrieved)}</span>
            <span class="credit-line credit-meta">&Auml;nderungen: ${this.escapeHtml(cr.changes)}</span>
          </figcaption>`;
  }

  figureDetailHtml(c) {
    if (!c.hasPhoto) {
      return `<div class="crystal-detail-image"><div class="crystal-glyph crystal-glyph--large">${c.image}</div><p class="crystal-glyph-note">Platzhalter-Symbol &middot; kein Foto im Projekt</p></div>`;
    }
    // Ein Pfad, ein Fehlerfall, ein Cache-Eintrag: 960 px deckt 336 px bei DPR 2.
    const src = c.imageStem && c.imageFile ? `${c.imageStem}/960/${c.imageFile}` : c.image;
    return `<figure class="crystal-detail-figure">
            <div class="crystal-detail-image">
              <img src="${src}" width="960" height="960" decoding="async" alt="${this.escapeHtml(c.imageAlt)}">
            </div>
            ${this.creditHtml(c)}
          </figure>`;
  }

  openCrystalModal(id, triggerEl = null) {
    const c = this.crystals.find((x) => x.id === id);
    if (!c) return;
    const related = this.crystals
      .filter((x) => x.id !== id && (x.color === c.color || x.chakra.some((ch) => c.chakra.includes(ch))))
      .slice(0, 3);
    const relatedHtml = related.length
      ? `<div class="mt-4"><h4 style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-2);">Verwandte Steine</h4><div class="flex flex-wrap gap-2">` +
        related
          .map(
            (r) =>
              `<button type="button" class="btn btn-ghost btn-sm" onclick="window.crystalsModule.openCrystalModal('${r.id}')">${r.name}</button>`
          )
          .join('') +
        `</div></div>`
      : '';
    this.modalBody.innerHTML = `
      <div class="crystal-detail-layout">
        ${this.figureDetailHtml(c)}
        <div>
          <h3 style="font-family:var(--font-display);color:var(--color-primary);margin-bottom:var(--space-1);font-size:1.6rem;">${c.name}</h3>
          <div class="flex flex-wrap gap-2 mb-3">${c.chakra.map((ch) => `<span class="badge badge-chakra">${ch}</span>`).join('')} <span class="badge badge-secondary">${c.colorRaw || c.color}</span></div>
          <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-muted);margin-bottom:var(--space-1);">Chemische Formel</h4><p style="font-family:var(--font-mono);color:var(--color-text-secondary);margin:0 0 var(--space-3);">${c.chemical_formula || '—'}</p>
          <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-muted);margin-bottom:var(--space-1);">Härte</h4><p style="color:var(--color-text-secondary);margin:0 0 var(--space-3);">${c.hardness != null ? c.hardness + ' (Mohs)' : '—'}</p>
          <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-muted);margin-bottom:var(--space-1);">Wirkt auf</h4><p style="color:var(--color-text-secondary);margin:0 0 var(--space-3);">${c.effect.join(', ') || '—'}</p>
          <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-muted);margin-bottom:var(--space-1);">Beschreibung</h4><p style="line-height:1.7;color:var(--color-text-secondary);margin:0 0 var(--space-2);">${c.description}</p>
          ${relatedHtml}
        </div>
      </div>
    `;
    document.getElementById('crystalModalTitle').textContent = c.name;
    this.modal.dialogController.open(triggerEl);
  }

  closeCrystalModal() {
    this.modal?.dialogController.close();
  }

  setupEventListeners() {
    if (this.searchEl) {
      this.searchEl.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.applyFilters(), 150);
      });
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
