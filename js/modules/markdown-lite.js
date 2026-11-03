// Kleiner Markdown-Leser für das Quellendokument (docs/frequenz-quellen.md).
//
// Bewusst kein vollständiger CommonMark-Parser: unterstützt werden genau die
// Konstrukte, die das Dokument verwendet (ATX-Überschriften, Absätze, Listen,
// Tabellen, Codeblöcke, Zitate, Trennlinien sowie inline Code, Fett, Kursiv und
// Links). Nicht unterstützte Blöcke bleiben unveränderter Text, damit ein
// späterer Redaktionsstand nichts stillschweigend verschluckt.
//
// Sicherheit: Jeder Text wird escaped, bevor Markup entsteht. Links werden nur
// für relative Ziele und http(s)/mailto/tel ausgegeben; alles andere
// (javascript:, data:, vbscript:) bleibt Text. Das Dokument stammt zwar aus dem
// eigenen Repository, die Ansicht darf aber auch bei einem manipulierten
// Dokument kein Skript ausführen.

const ESCAPES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });
// Private-Use-Zeichen als Platzhalter: kein Steuerzeichen (ESLint) und in
// Markdown-Text praktisch nicht vorhanden.
const SLOT_TEST = /\uE000\d+\uE000/;
const SLOT = /\uE000(\d+)\uE000/g;

export function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

// Relative Ziele, Fragmente und die drei erlaubten absoluten Schemata.
function safeHref(href) {
  const value = String(href == null ? '' : href).trim();
  if (!value) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return /^(?:https?|mailto|tel):/i.test(value) ? value : null;
  return value;
}

function trimUrl(raw) {
  let url = raw;
  let tail = '';
  while (url.endsWith(')')) {
    const open = (url.match(/\(/g) || []).length;
    const close = (url.match(/\)/g) || []).length;
    if (open >= close) break;
    tail = `)${tail}`;
    url = url.slice(0, -1);
  }
  const punctuation = /[.,;:!?'"]+$/.exec(url);
  if (punctuation) {
    tail = `${punctuation[0]}${tail}`;
    url = url.slice(0, -punctuation[0].length);
  }
  return [url, tail];
}

function renderEmphasis(escaped) {
  return escaped
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
}

export function renderInline(text, { resolveHref = (href) => href, autolink = true } = {}) {
  const slots = [];
  const stash = (html) => `\uE000${slots.push(html) - 1}\uE000`;
  const anchor = (labelHtml, href) => {
    const target = safeHref(resolveHref(href));
    if (!target) return labelHtml;
    const external = /^https?:\/\//i.test(target) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${target}"${external}>${renderEmphasis(labelHtml)}</a>`;
  };

  let out = escapeHtml(text);
  // Inline-Code zuerst: sein Inhalt darf keine weitere Auszeichnung erfahren.
  out = out.replace(/`([^`]+)`/g, (_, code) => stash(`<code>${code}</code>`));
  // [Text](Ziel) — Ziel ohne Leerzeichen, optionaler Titel wird verworfen.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => stash(anchor(label, href)));
  if (autolink) {
    // Nackte URLs im Quellenverzeichnis (§12) werden klickbar; schließende
    // Satzzeichen bleiben außerhalb des Links.
    out = out.replace(/\bhttps?:\/\/[^\s<]+/g, (raw) => {
      const [url, tail] = trimUrl(raw);
      return `${stash(anchor(url, url))}${tail}`;
    });
  }
  return restore(renderEmphasis(out), slots);
}

function restore(html, slots) {
  let out = html;
  for (let round = 0; round < 4 && SLOT_TEST.test(out); round += 1) {
    out = out.replace(SLOT, (_, index) => slots[Number(index)] || '');
  }
  return out;
}

const FENCE = /^\s*```([\w-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const QUOTE = /^\s*>\s?/;
const BULLET = /^(\s*)[-*+]\s+(.*)$/;
const NUMBERED = /^(\s*)(\d{1,3})[.)]\s+(.*)$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{1,}:?\s*(?:\|\s*:?-{1,}:?\s*)+\|?\s*$/;
const BLOCK_START = /^\s*(?:#{1,6}\s|>|```|-{3,}|\*{3,}|_{3,}|\||[-*+]\s|\d{1,3}[.)]\s)/;

function splitRow(line) {
  const cells = [];
  let cell = '';
  let inCode = false;
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  for (const char of trimmed) {
    if (char === '`') inCode = !inCode;
    if (char === '|' && !inCode) {
      cells.push(cell.trim());
      cell = '';
      continue;
    }
    cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function alignmentOf(cell) {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  if (left) return 'left';
  return null;
}

function plainText(cell) {
  return escapeHtml(
    String(cell || '')
      .replace(/[`*_]/g, '')
      .trim()
  );
}

function isTableStart(lines, index) {
  return lines[index].includes('|') && index + 1 < lines.length && TABLE_DIVIDER.test(lines[index + 1]);
}

/**
 * Rendert Markdown zu HTML.
 *
 * @param {string} markdown
 * @param {{headingOffset?: number, resolveHref?: (href: string) => string, autolink?: boolean}} [options]
 *   headingOffset hebt alle Überschriften um n Stufen an (die Ansicht liefert
 *   bereits ein H1 der Seite), resolveHref darf relative Ziele umschreiben.
 * @returns {string}
 */
export function renderMarkdown(markdown, options = {}) {
  const { headingOffset = 0, resolveHref = (href) => href, autolink = true } = options;
  const inline = (text) => renderInline(text, { resolveHref, autolink });
  const lines = String(markdown == null ? '' : markdown)
    .replace(/\r\n?/g, '\n')
    .split('\n');
  const out = [];
  let tableCount = 0;
  let index = 0;

  const renderList = (start, ordered) => {
    const pattern = ordered ? NUMBERED : BULLET;
    const first = pattern.exec(lines[start]);
    const baseIndent = first[1].length;
    const tag = ordered ? 'ol' : 'ul';
    const startNumber = ordered ? Number(first[2]) : 1;
    const items = [];
    let cursor = start;
    while (cursor < lines.length) {
      const match = pattern.exec(lines[cursor]);
      if (!match || match[1].length < baseIndent) break;
      if (match[1].length > baseIndent) {
        const [nested, next] = renderList(cursor, ordered);
        if (items.length) items[items.length - 1].nested += nested;
        cursor = next;
        continue;
      }
      const parts = [inline(ordered ? match[3] : match[2])];
      cursor += 1;
      // Fortsetzungszeilen eines Aufzählungspunkts gehören zum selben <li>.
      while (cursor < lines.length && lines[cursor].trim() && !BLOCK_START.test(lines[cursor])) {
        parts.push(inline(lines[cursor].trim()));
        cursor += 1;
      }
      items.push({ body: parts.join(' '), nested: '' });
    }
    const startAttr = ordered && startNumber !== 1 ? ` start="${startNumber}"` : '';
    const html = items.map((item) => `<li>${item.body}${item.nested}</li>`).join('');
    return [`<${tag}${startAttr}>${html}</${tag}>`, cursor];
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const fence = FENCE.exec(line);
    if (fence) {
      const body = [];
      index += 1;
      while (index < lines.length && !FENCE.test(lines[index])) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1; // schließender Zaun
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : '';
      out.push(`<pre class="fq-code" tabindex="0"><code${language}>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      const level = Math.min(6, heading[1].length + headingOffset);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }
    if (RULE.test(line)) {
      out.push('<hr>');
      index += 1;
      continue;
    }
    if (QUOTE.test(line)) {
      const body = [];
      while (index < lines.length && QUOTE.test(lines[index])) {
        body.push(lines[index].replace(QUOTE, ''));
        index += 1;
      }
      out.push(`<blockquote>${body.map((part) => `<p>${inline(part)}</p>`).join('')}</blockquote>`);
      continue;
    }
    if (isTableStart(lines, index)) {
      const header = splitRow(line);
      const alignments = splitRow(lines[index + 1]).map(alignmentOf);
      const cellClass = (column) => (alignments[column] ? ` class="fq-align-${alignments[column]}"` : '');
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitRow(lines[index]));
        index += 1;
      }
      tableCount += 1;
      const label = `Tabelle ${tableCount}: ${plainText(header[0])}`;
      const head = header.map((cell, column) => `<th scope="col"${cellClass(column)}>${inline(cell)}</th>`).join('');
      const body = rows
        .map((row) => {
          const cells = header.map(
            (_, column) => `<td${cellClass(column)}>${inline(row[column] == null ? '' : row[column])}</td>`
          );
          return `<tr>${cells.join('')}</tr>`;
        })
        .join('');
      out.push(
        `<div class="fq-table-scroll" role="region" tabindex="0" aria-label="${label}"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
      );
      continue;
    }
    if (BULLET.test(line) || NUMBERED.test(line)) {
      const [html, next] = renderList(index, !BULLET.test(line));
      out.push(html);
      index = next;
      continue;
    }
    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !BLOCK_START.test(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    out.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }

  return out.join('\n');
}
