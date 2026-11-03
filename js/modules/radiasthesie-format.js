// Radiästhesie-Modul — reine Formatierungsbausteine.
//
// Dieses Modul kennt weder DOM noch Daten: Es erzeugt aus geprüften Texten
// HTML-Zeichenketten. Dadurch ist es in Node ohne Browser prüfbar
// (tests/radiasthesie.mjs) und im Browser unverändert nutzbar.
//
// Textformat der Inhalte: Absätze durch Leerzeilen, **fett**, *kursiv*,
// Quellenmarker [Qxx]. Alles andere wird escaped — kein innerHTML mit
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
// Ein Ort für alle Hashes: js/main.js versteht genau dieses Vokabular, und
// Querverweise können nie versehentlich eine fremde Route bauen.
export const ROUTE = {
  base: '#pendeln',
  topic: (slug, anchor) => (anchor ? `#pendeln/${slug}/${anchor}` : `#pendeln/${slug}`),
  glossar: (letter) => (letter ? `#pendeln/glossar?b=${encodeURIComponent(letter)}` : '#pendeln/glossar'),
  quellen: (id) => (id ? `#pendeln/quellen/${id}` : '#pendeln/quellen'),
  methodik: '#pendeln/methodik',
  suche: (q) => (q ? `#pendeln/suche?q=${encodeURIComponent(q)}` : '#pendeln/suche'),
  // Werkstatt Pendellabor (RAD-07). Reine Seite, kein Query-Zustand.
  labor: '#pendeln/labor',
  // Werkstatt Pendeltafel-Studio (RAD-08). Reine Seite, kein Query-Zustand:
  // die Tafel wird im Browser zusammengestellt und nicht in die Adresse
  // geschrieben.
  studio: '#pendeln/studio',
  // Werkstatt Experimentierlabor (RAD-09). Ebenfalls ohne Query-Zustand: Ein
  // Deep-Link darf weder einen laufenden Versuch noch ein Ziel vortäuschen.
  experiment: '#pendeln/experiment',
};

// --- Kennzeichnung --------------------------------------------------------
// Die fünf Stufen sind Pflicht. Textmarke zuerst, Farbe nur als Zusatz.
export const LEVEL_TEXT = {
  A: 'Historisch',
  B: 'Tradition',
  C: 'Hypothese',
  D: 'Befund',
  E: 'Widerlegt',
};

export function levelChip(key, { short = false } = {}) {
  const letter = String(key || '')
    .trim()
    .toUpperCase();
  if (!LEVEL_TEXT[letter]) return '';
  const label = LEVEL_TEXT[letter];
  return `<span class="rad-chip rad-chip--${letter.toLowerCase()}">${
    short ? escapeHtml(letter) : `${escapeHtml(letter)} · ${escapeHtml(label)}`
  }</span>`;
}

export function levelChips(keys, options) {
  return (keys || []).map((key) => levelChip(key, options)).join('');
}

// --- Fließtext ------------------------------------------------------------

function citation(id) {
  const value = escapeHtml(id);
  return `<a class="rad-cite" href="${ROUTE.quellen(id)}" title="Quelle ${value} im Quellenverzeichnis">[${value}]</a>`;
}

/**
 * Einzelner Absatz: escapes, dann **fett**, *kursiv* und [Qxx]-Marker
 * auszeichnen. Interne Dossier-Verweise werden auf die Methodik-Seite
 * umgebogen, weil das redaktionelle Dossier nicht veröffentlicht wird.
 */
export function inlineText(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[(Q\d{2}(?:\s*[,/]\s*Q\d{2})*)\]/g, (_, ids) =>
      ids
        .split(/[,/]/)
        .map((id) => id.trim())
        .filter(Boolean)
        .map(citation)
        .join(', ')
    )
    .replace(/\[Dossier[^\]]*\]/g, `<a class="rad-cite" href="${ROUTE.methodik}">siehe Methodik</a>`);
}

/** Mehrere Absätze, getrennt durch Leerzeilen. */
export function richText(value) {
  return String(value == null ? '' : value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p class="astro-text">${inlineText(paragraph)}</p>`)
    .join('');
}

export const paragraph = (value) => `<p class="astro-text">${inlineText(value)}</p>`;

export function bulletList(values, className = 'astro-list') {
  if (!values || !values.length) return '';
  return `<ul class="${className}">${values.map((value) => `<li>${inlineText(value)}</li>`).join('')}</ul>`;
}

// --- Blöcke aus den Quelldateien -----------------------------------------

/** Rendert einen Datenblock (p | ul | callout) aus js/data/radiasthesie.js. */
export function renderBlock(block) {
  if (!block) return '';
  switch (block.type) {
    case 'ul':
      return bulletList(block.items);
    case 'callout':
      return `<div class="astro-callout">${(block.paragraphs || [])
        .map((text) => `<p>${inlineText(text)}</p>`)
        .join('')}</div>`;
    case 'p':
    default:
      return paragraph(block.text);
  }
}

export function renderBlocks(blocks) {
  return (blocks || []).map(renderBlock).join('');
}

// --- Struktur -------------------------------------------------------------

export function section(id, title, body, { kicker = '', level = 2, headingId = '' } = {}) {
  if (!body) return '';
  const tag = `h${level}`;
  const idAttr = headingId || `${id}-title`;
  return `<section class="astro-section" id="${id}" aria-labelledby="${idAttr}">
    ${kicker ? `<p class="rad-kicker">${escapeHtml(kicker)}</p>` : ''}
    <${tag} id="${idAttr}" tabindex="-1">${escapeHtml(title)}</${tag}>
    ${body}
  </section>`;
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

export function statusBand(text, { id = 'rad-status-label', link = true } = {}) {
  // Der erste Satz wird hervorgehoben; kein Lookbehind-Regex, damit auch
  // ältere Browser die Datei überhaupt parsen können.
  const source = String(text);
  const cut = source.indexOf('. ');
  const lead = cut > 0 ? source.slice(0, cut + 1) : '';
  const rest = cut > 0 ? source.slice(cut + 2) : source;
  return `<aside class="rad-status" aria-labelledby="${id}">
    <span class="rad-status-label" id="${id}">Einordnung</span>
    <p class="rad-status-body">
      ${lead ? `<strong>${escapeHtml(lead)}</strong> ` : ''}${escapeHtml(rest)}${
        link ? ` <a class="rad-status-link" href="${ROUTE.methodik}">So funktioniert die Kennzeichnung</a>.` : ''
      }
    </p>
  </aside>`;
}

export function disclaimerBox({ title, paragraphs, id }) {
  return `<aside class="rad-disclaimer" aria-labelledby="${id}">
    <h2 class="rad-disclaimer-title" id="${id}">${escapeHtml(title)}</h2>
    ${(paragraphs || [])
      .filter((entry) => entry.text)
      .map((entry) => `<p><strong>${escapeHtml(entry.label)}:</strong> ${inlineText(entry.text)}</p>`)
      .join('')}
  </aside>`;
}

export function relatedList(items) {
  if (!items || !items.length) return '';
  return `<ul class="rad-related">${items
    .map(
      (item) => `<li class="rad-related-item">
      <span class="rad-related-type">${escapeHtml(item.type)}</span>
      <h3><a href="${item.href}">${escapeHtml(item.title)}</a></h3>
      <p>${inlineText(item.text)}</p>
    </li>`
    )
    .join('')}</ul>`;
}

export function metaList(items) {
  if (!items || !items.length) return '';
  return `<ul class="rad-meta">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}
