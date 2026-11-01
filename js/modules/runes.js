// Runes Module
export class RunesModule {
  constructor(modal, modalBody, closeBtn) {
    this.modal = modal;
    this.modalBody = modalBody;
    this.closeBtn = closeBtn;
    this.runes = [];
    this.historyKey = 'esoterik_runes_history';
  }
  async init() {
    const mod = await import('../data/runes.js');
    this.runes = (mod.runes || []).slice();
    this.runes.forEach((r) => {
      if (!r.symbol) r.symbol = this._sym(r.name);
    });
    this.renderGrid();
    this.setupEventListeners();
    this.setupKeyboard();
    this.renderHistory();
    window._runemodule = this;
  }
  _sym(n) {
    const M = {
      Fehu: 'ᚠ',
      Uruz: 'ᚢ',
      Thurisaz: 'ᚦ',
      Ansuz: 'ᚨ',
      Raido: 'ᚱ',
      Kenaz: 'ᚲ',
      Gebo: 'ᚷ',
      Wunjo: 'ᚹ',
      Hagalaz: 'ᚺ',
      Nauthiz: 'ᚾ',
      Isa: 'ᛁ',
      Jera: 'ᛃ',
      Eihwaz: 'ᛇ',
      Pertho: 'ᛈ',
      Algiz: 'ᛉ',
      Sowilo: 'ᛊ',
      Tiwaz: 'ᛏ',
      Berkano: 'ᛒ',
      Ehwaz: 'ᛖ',
      Mannaz: 'ᛘ',
      Laguz: 'ᛚ',
      Ingwaz: 'ᛞ',
      Othala: 'ᛟ',
      Dagaz: 'ᛡ',
    };
    return M[n] || 'ᚠ';
  }
  shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }
  renderGrid() {
    const g = document.getElementById('runeGrid');
    if (!g || !this.runes.length) return;
    g.innerHTML = this.runes
      .map(
        (r) =>
          `<article class="rune-card" data-id="${r.id}" tabindex="0" role="button" aria-label="${r.name} — ${r.meaning}" onclick="window._runemodule?.openRuneModal(${r.id})"><div class="rune-symbol" aria-hidden="true">${r.symbol}</div><h2 class="rune-name">${r.name}</h2><p class="rune-phonetic">${r.phonetic || ''}</p><p class="rune-meaning">${(r.meaning || '').substring(0, 70)}${(r.meaning || '').length > 70 ? '…' : ''}</p></article>`
      )
      .join('');
    g.querySelectorAll('.rune-card').forEach((c) =>
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openRuneModal(parseInt(c.dataset.id));
        }
      })
    );
  }
  openRuneModal(id) {
    const r = this.runes.find((x) => x.id === id || x.id === String(id));
    if (!r) return;
    this.modalBody.innerHTML = `<div style="text-align:center;padding:var(--space-4);"><div class="rune-symbol" style="font-size:5rem;margin-bottom:var(--space-4);" aria-hidden="true">${r.symbol}</div><h3 style="font-family:var(--font-display);margin-bottom:var(--space-2);">${r.name}</h3><p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);">${r.phonetic || ''} · ${r.meaning || ''}</p><div class="rune-modal-interpretations"><div class="card"><h5 style="color:var(--color-accent-emerald);">Aufrecht</h5><p style="font-size:var(--text-sm);">${r.meaning_upright || r.divinatory_meaning || ''}</p></div><div class="card"><h5 style="color:var(--color-accent-rose);">Verkehrt</h5><p style="font-size:var(--text-sm);">${r.meaning_reversed || ''}</p></div></div></div>`;
    document.getElementById('runeModalTitle').textContent = r.name + ' — Deutung';
    this.modal.dialogController.open();
  }
  setupEventListeners() {
    const b3 = document.getElementById('castRunesBtn');
    if (b3) b3.addEventListener('click', () => this.castThree());
    const b1 = document.getElementById('castSingleRuneBtn');
    if (b1) b1.addEventListener('click', () => this.castSingle());
    document.addEventListener('click', (e) => {
      if (e.target.closest('#rerunBtn')) {
        e.preventDefault();
        this.castThree();
      }
    });
  }
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      const a = document.activeElement;
      if (!a) return;
      if ((e.key === 'Enter' || e.key === ' ') && (a.id === 'castRunesBtn' || a.id === 'castSingleRuneBtn')) {
        e.preventDefault();
        if (a.id === 'castRunesBtn') this.castThree();
        else this.castSingle();
      }
    });
  }
  castThree() {
    if (!this.runes.length) return;
    const p = this.shuffle(this.runes)
      .slice(0, 3)
      .map((r) => ({ ...r, reversed: Math.random() < 0.3 }));
    this.showSpread(p);
    this.saveHistory(p, document.getElementById('runeNote')?.value || '');
  }
  castSingle() {
    if (!this.runes.length) return;
    const s = this.shuffle(this.runes)
      .slice(0, 1)
      .map((r) => ({ ...r, reversed: Math.random() < 0.3 }));
    this.showSpread(s, true);
    this.saveHistory(s, document.getElementById('runeNote')?.value || '');
  }
  showSpread(runes, isSingle = false) {
    const c = document.getElementById('runeCastResult'),
      a = document.getElementById('castRunes'),
      i = document.getElementById('runeInterpretation');
    if (!c || !a) return;
    c.hidden = false;
    a.innerHTML = runes
      .map(
        (r, idx) =>
          `<article class="cast-rune" style="animation:slideIn 0.6s ease-out ${idx * 180}ms both;" role="region" aria-label="${isSingle ? 'Einzel-Rune' : 'Position ' + (idx + 1)}">${!isSingle ? `<div class="position-label">${idx === 0 ? 'Vergangenheit' : idx === 1 ? 'Gegenwart' : 'Zukunft'}</div>` : ''}<div class="rune-symbol" aria-hidden="true">${r.symbol}</div><h3 class="rune-name">${r.name}</h3><p class="rune-position-meaning">${r.reversed ? r.meaning_reversed || r.divinatory_meaning || '' : r.meaning_upright || r.divinatory_meaning || ''}</p>${r.reversed ? '<span class="badge" style="background:var(--color-accent-rose);color:var(--color-text-on-primary);">Verkehrt</span>' : ''}</article>`
      )
      .join('');
    if (!isSingle) {
      i.innerHTML = `<h3 style="font-family:var(--font-display);color:var(--color-primary);margin-bottom:var(--space-4);">Deutung — 3-Runen-Wurf</h3><div class="interpretation-section"><h4>Vergangenheit</h4><p>${runes[0]?.reversed ? runes[0].meaning_reversed || '' : runes[0].meaning_upright || ''}</p></div><div class="interpretation-section"><h4>Gegenwart</h4><p>${runes[1]?.reversed ? runes[1].meaning_reversed || '' : runes[1].meaning_upright || ''}</p></div><div class="interpretation-section"><h4>Zukunft</h4><p>${runes[2]?.reversed ? runes[2].meaning_reversed || '' : runes[2].meaning_upright || ''}</p></div><div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid var(--color-border);"><strong>Kombinierte Deutung</strong><p style="font-size:var(--text-sm);">Vergangenheit, Gegenwart und Zukunft bilden einen Spannungsbogen; Widersprüche zwischen aufrecht und verkehrt markieren Wendepunkte.</p></div><button id="rerunBtn" class="btn btn-secondary" style="margin-top:var(--space-4);">Neu werfen</button>`;
    } else {
      i.innerHTML = `<h3 style="font-family:var(--font-display);color:var(--color-primary);margin-bottom:var(--space-4);">Einzeldeutung</h3><p>${runes[0]?.reversed ? runes[0].meaning_reversed || '' : runes[0].meaning_upright || ''}</p><button id="rerunBtn" class="btn btn-secondary" style="margin-top:var(--space-4);">Neuwerfen</button>`;
    }
    if (!document.getElementById('runeNote')) {
      i.insertAdjacentHTML(
        'beforeend',
        `<div style="margin-top:var(--space-3);"><label for="runeNote" class="text-sm" style="display:block;margin-bottom:var(--space-1);">Notiz</label><textarea id="runeNote" rows="2" style="width:100%;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-bg-card);color:var(--color-text);" placeholder="Deine Notiz zum Wurf..."></textarea><button onclick="window._runemodule.saveNoteFromForm()" class="btn btn-secondary" style="margin-top:var(--space-2);">Speichern</button></div>`
      );
    }
  }
  saveHistory(runes, note) {
    try {
      const a = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
      a.unshift({
        date: new Date().toISOString(),
        runes: runes.map((r) => ({ id: r.id, name: r.name, symbol: r.symbol, reversed: !!r.reversed })),
        note: note || '',
      });
      if (a.length > 20) a.length = 20;
      localStorage.setItem(this.historyKey, JSON.stringify(a));
      this.renderHistory();
    } catch (e) {}
  }
  saveNoteFromForm() {
    try {
      const a = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
      if (a.length) a[0].note = document.getElementById('runeNote')?.value || '';
      localStorage.setItem(this.historyKey, JSON.stringify(a));
      this.renderHistory();
    } catch (e) {}
  }
  renderHistory() {
    const el = document.getElementById('runesHistory');
    if (!el) return;
    try {
      const a = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
      if (!a.length) {
        el.innerHTML = '<p class="text-muted">Noch keine Würfe gespeichert.</p>';
        return;
      }
      el.innerHTML =
        '<h2>Verlauf (letzte 20)</h2><div class="history-list">' +
        a
          .map(
            (h, idx) =>
              `<article class="history-item card" style="margin-bottom:var(--space-2);padding:var(--space-3);border:1px solid var(--color-border);border-radius:var(--radius-md);"><div style="display:flex;justify-content:space-between;align-items:center;"><span><strong>${new Date(h.date).toLocaleString('de-DE')}</strong></span><button onclick="window._runemodule.deleteHistory(${idx})" class="btn btn-small" style="background:var(--color-accent-rose);color:var(--color-text-on-primary);border:none;padding:var(--space-1) var(--space-2);border-radius:var(--radius-sm);cursor:pointer;">Löschen</button></div><div style="display:flex;gap:var(--space-3);margin-top:var(--space-1);font-size:1.3rem;">${h.runes.map((r) => `<span title="${r.name}">${r.symbol}</span>`).join('')}</div><p class="text-sm" style="margin-top:var(--space-1);color:var(--color-text-muted);">${h.note || ''}</p></article>`
          )
          .join('') +
        '</div>';
    } catch (e) {
      el.innerHTML = '<p class="text-muted">Geschichte nicht verfügbar.</p>';
    }
  }
  deleteHistory(idx) {
    try {
      const a = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
      a.splice(idx, 1);
      localStorage.setItem(this.historyKey, JSON.stringify(a));
      this.renderHistory();
    } catch (e) {}
  }
}
window._runemodule = null;
