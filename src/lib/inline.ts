/**
 * Minimale Inline-Auszeichnung für übernommene Bestandstexte.
 *
 * Die Datenmodule des Bestands (js/data/*.js) enthalten Text mit
 * `**fett**`, `*kursiv*`, Zitationsmarkern (`[S06]`, `[Q02, Q05]`) und
 * gelegentlich nackten URLs. Astro rendert Strings escaped; damit die Texte
 * nicht als Rohtext mit Sternchen erscheinen, wird hier genau diese Teilmenge
 * in HTML übersetzt — mehr nicht, damit keine fremde Markdown-Engine
 * Verhalten einführt, das der Bestand nicht hatte.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** Nackte http(s)-Adressen als Link — nur wenn sie nicht schon in Markup stehen. */
function linkify(escaped: string): string {
  return escaped.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_match, prefix: string, url: string) => {
    return `${prefix}<a href="${url}" rel="noopener">${url}</a>`;
  });
}

/**
 * Übersetzt `**fett**`, `*kursiv*` und nackte URLs in HTML.
 * Eingabe wird zuerst escaped, danach werden nur die eigenen Marker ersetzt.
 */
export function formatInline(text: string): string {
  const escaped = escapeHtml(String(text ?? ''));
  const withLinks = linkify(escaped);
  return withLinks.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>');
}

/**
 * Zerlegt einen Fließtext in Absätze. Der Bestand trennt Absätze mit einer
 * Leerzeile (`\n\n`); Zeilenumbrüche innerhalb eines Absatzes bleiben Leerzeichen.
 */
export function toParagraphs(text: string): string[] {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 0);
}

/** Absätze als fertiges HTML (für `set:html`). */
export function renderParagraphs(text: string): string {
  return toParagraphs(text)
    .map((paragraph) => `<p>${formatInline(paragraph)}</p>`)
    .join('\n');
}

/** Kurztext für Listen/Teaser: erste Zeile, auf `max` Zeichen gekürzt. */
export function truncate(text: string, max = 180): string {
  const clean = String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()} …`;
}
