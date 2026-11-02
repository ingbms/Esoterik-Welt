// Astrologie — reine Formatierungsbausteine.
//
// Dieses Modul kennt kein DOM und keine Daten: Es erzeugt aus geprüften Texten
// HTML-Zeichenketten. Deshalb lässt es sich in Node ohne Browser prüfen
// (tests/astrologie.mjs) und im Browser unverändert verwenden.
//
// Textformat der Inhalte (docs/astrologie-konzept): Absätze durch Leerzeilen,
// **fett**, Quellenmarker [Sxx]. Alles andere wird escaped — kein innerHTML mit
// ungeprüften Daten.

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

// --- Routen ---------------------------------------------------------------
// Ein Ort für alle Hashes: Der Router in js/main.js versteht genau dieses
// Vokabular, und Querverweise können nie versehentlich eine fremde Route bauen.
export const ROUTE = {
  hub: '#astrologie',
  lernpfad: (slug) => (slug ? `#astrologie/lernpfad/${slug}` : '#astrologie/lernpfad'),
  zeichen: (slug) => (slug ? `#astrologie/zeichen/${slug}` : '#astrologie/zeichen'),
  faktoren: (slug) => (slug ? `#astrologie/faktoren/${slug}` : '#astrologie/faktoren'),
  haeuser: (slug) => (slug ? `#astrologie/haeuser/${slug}` : '#astrologie/haeuser'),
  aspekte: (slug) => (slug ? `#astrologie/aspekte/${slug}` : '#astrologie/aspekte'),
  grundlagen: (slug) => (slug ? `#astrologie/grundlagen/${slug}` : '#astrologie/grundlagen'),
  beispiele: (slug) => (slug ? `#astrologie/beispiele/${slug}` : '#astrologie/beispiele'),
  faq: (slug) => (slug ? `#astrologie/faq/${slug}` : '#astrologie/faq'),
  glossar: (slug) => (slug ? `#astrologie/glossar/${slug}` : '#astrologie/glossar'),
  quellen: (quelle) => (quelle ? `#astrologie/quellen?quelle=${encodeURIComponent(quelle)}` : '#astrologie/quellen'),
  methodik: '#astrologie/methodik',
  suche: (q) => (q ? `#astrologie/suche?q=${encodeURIComponent(q)}` : '#astrologie/suche'),
};

// --- Kennzeichnung --------------------------------------------------------
// Die Evidenz-/Traditionskennzeichnung ist Pflicht und wird als Text-Badge
// gerendert (nie nur als Farbe).
const KENNZEICHNUNG_LABEL = {
  deutungstradition: 'Deutungstradition',
  astronomie: 'Astronomie',
  konvention: 'Konvention',
  empirie: 'Empirie',
  historisch: 'Historisch',
  gemischt: 'Gemischt',
};

export const kennzeichnungLabel = (typ) => KENNZEICHNUNG_LABEL[typ] || 'Ohne Kennzeichnung';

export function kennzeichnung(item) {
  const typ = item && item.kennzeichnung ? item.kennzeichnung.typ : null;
  if (!typ) return '';
  const hinweis = item.kennzeichnung.hinweis || '';
  return `<p class="astro-kennzeichnung">
    <span class="astro-badge astro-badge--${escapeHtml(typ)}">${escapeHtml(kennzeichnungLabel(typ))}</span>
    <span class="astro-kennzeichnung-text">${escapeHtml(hinweis)}</span>
  </p>`;
}

// --- Fließtext ------------------------------------------------------------
function sourceMarker(id) {
  return `<a class="astro-marker" href="${ROUTE.quellen(id)}" aria-label="Quelle ${escapeHtml(id)} im Quellenverzeichnis">[${escapeHtml(id)}]</a>`;
}

/** Einzelner Absatz: escapes, dann **fett** und [Sxx]-Marker auszeichnen. */
export function inlineText(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(S\d{2})\]/g, (_, id) => sourceMarker(id));
}

/** Mehrere Absätze, getrennt durch Leerzeilen. */
export function richText(value) {
  return String(value == null ? '' : value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${inlineText(paragraph)}</p>`)
    .join('');
}

export const paragraph = (value) => `<p>${inlineText(value)}</p>`;

export function bulletList(values, className = 'astro-list') {
  if (!values || !values.length) return '';
  return `<ul class="${className}">${values.map((value) => `<li>${inlineText(value)}</li>`).join('')}</ul>`;
}

export function numberedList(values) {
  if (!values || !values.length) return '';
  return `<ol class="astro-list astro-list--ordered">${values.map((value) => `<li>${inlineText(value)}</li>`).join('')}</ol>`;
}

// --- Struktur -------------------------------------------------------------
export function metaList(rows) {
  const filled = (rows || []).filter((row) => row && row.value);
  if (!filled.length) return '';
  return `<dl class="astro-meta">${filled
    .map(
      (row) =>
        `<div class="astro-meta-row"><dt>${escapeHtml(row.label)}</dt><dd>${
          row.html ? row.value : inlineText(row.value)
        }</dd></div>`
    )
    .join('')}</dl>`;
}

export function details(summary, body, { open = false, className = '' } = {}) {
  return `<details class="astro-details ${className}"${open ? ' open' : ''}>
    <summary>${inlineText(summary)}</summary>
    <div class="astro-details-body">${body}</div>
  </details>`;
}

export function badge(text, variant = 'neutral') {
  return `<span class="astro-badge astro-badge--${escapeHtml(variant)}">${escapeHtml(text)}</span>`;
}

export function chip(href, text, { active = false } = {}) {
  return `<a class="astro-chip${active ? ' is-active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}>${escapeHtml(text)}</a>`;
}

export function breadcrumb(trail) {
  if (!trail || !trail.length) return '';
  const parts = trail.map((entry, index) => {
    const isLast = index === trail.length - 1;
    const label = escapeHtml(entry.label);
    if (isLast || !entry.href) return `<span aria-current="page">${label}</span>`;
    return `<a href="${entry.href}">${label}</a>`;
  });
  return `<nav class="astro-breadcrumb" aria-label="Brotkrümelnavigation"><ol>${parts
    .map((part) => `<li>${part}</li>`)
    .join('')}</ol></nav>`;
}

export function sourcesPanel(item) {
  const ids = (item && item.sources) || [];
  const claims = (item && item.claims) || [];
  return { ids, claims };
}

/** Symbol als dekoratives Zeichen; der Name steht immer als Text daneben. */
export function glyph(symbol, className = 'astro-glyph') {
  if (!symbol) return '';
  const value = typeof symbol === 'string' ? symbol : symbol.glyph;
  return value ? `<span class="${className}" aria-hidden="true">${escapeHtml(value)}</span>` : '';
}

// Unicode-Zeichen wie ♈ oder ☌ haben in vielen Systemen eine farbige
// Emoji-Darstellung. U+FE0E (Variation Selector 15) erzwingt die Textform,
// damit die Symbole in der Nachtatelier-Palette bleiben.
export const textGlyph = (value) => (value ? `${value}\uFE0E` : '');
