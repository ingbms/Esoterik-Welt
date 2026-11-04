/**
 * Automatisches Seiten-Inhaltsverzeichnis — Datenmodell und reine Logik.
 *
 * Grundlage: `docs/velarkana-toc/spezifikation.md` (Karte `t_5edc1d8c`) und
 * `docs/velarkana-toc/02-komponenten-spezifikation.md` (Karte `t_fd9d97f0`).
 *
 * Dieses Modul enthält **keine** DOM- oder Astro-Abhängigkeit außer dem
 * Slug-Algorithmus (`github-slugger` 2.0.0, dieselbe Regel, die Astro für
 * Markdown-Überschriften verwendet). Dadurch sind Filterung, Verschachtelung,
 * Slug-Erzeugung und Markup-Erzeugung ohne Browser unit-testbar
 * (`tests/toc-unit.mjs`) und werden serverseitig wie clientseitig
 * (`dynamic`, siehe §6.11) identisch angewendet.
 *
 * Vertrag in Kurzform:
 *  - Ebenen kommen aus `levels` (Default [2, 3]); h1 ist nie enthalten.
 *  - Bestehende IDs bleiben unverändert; fehlende entstehen deterministisch
 *    über github-slugger, Kollisionen werden wie bei GitHub durchnummeriert.
 *  - Verschachtelung folgt der Dokumentreihenfolge; `level` ist die
 *    strukturelle Tiefe (2 = oberste Liste), nicht die h-Ebene, damit eine
 *    übersprungene Ebene keine doppelte Einrückung erzeugt (§6.2 Nr. 3).
 *  - Unter `minHeadings` Einträgen liefert der Aufbau `null`; die Komponente
 *    rendert dann nichts (§6.6).
 */
import GithubSlugger, { slug as baseSlug } from 'github-slugger';

/** Überschrift, wie sie in die Komponente geht (Astro-`headings`-Form). */
export interface TocHeadingInput {
  /** h-Ebene 2–6. */
  depth: number;
  /** Vorhandene ID der Überschrift; leer, wenn sie erzeugt werden muss. */
  slug?: string | null;
  /** Sichtbarer Text (darf Inline-Markup enthalten, wird normalisiert). */
  text: string;
  /**
   * Von der Quelle bereits als ungeeignet markiert (`sr-only`, `hidden`,
   * `aria-hidden="true"`, `[data-toc-skip]`, §6.1 Nr. 3). Im SSR-Pfad liefert
   * Astro nur `depth`/`slug`/`text`; die Filterung greift im `dynamic`-Pfad
   * (DOM) und in Tests.
   */
  skip?: boolean;
}

/** Ein Eintrag des fertigen Verzeichnisses. */
export interface TocNode {
  /** h-Ebene des Ziels (2–6). */
  depth: number;
  /** Strukturelle Tiefe für die Einrückung; 2 = oberste Ebene. */
  level: number;
  /** ID des Ziels und Anker des Links (unverändert oder erzeugt). */
  slug: string;
  /** Normalisierter, ungekürzter Text. */
  text: string;
  children: TocNode[];
}

export interface TocTree {
  items: TocNode[];
  /** Anzahl der enthaltenen Einträge (alle Ebenen). */
  count: number;
}

export interface TocOptions {
  /** Sichtbarer Titel; das Landmark-Label bleibt fest „Inhaltsverzeichnis“. */
  title: string;
  /** Einzubeziehende h-Ebenen, aufsteigend und ohne Duplikate. */
  levels: number[];
  /** Unter dieser Anzahl wird kein Verzeichnis gerendert. */
  minHeadings: number;
  /** CSS-Ausdruck für `top` der klebenden Randspalte. */
  stickyOffset: string;
  /** Liste clientseitig aus dem DOM aufbauen (§6.11, außerhalb des Piloten). */
  dynamic: boolean;
}

export const TOC_DEFAULTS: TocOptions = {
  title: 'Auf dieser Seite',
  levels: [2, 3],
  minHeadings: 3,
  stickyOffset: 'calc(var(--header-height) + var(--space-6))',
  dynamic: false,
};

const MIN_LEVEL = 2;
const MAX_LEVEL = 6;

/**
 * Notaus ohne Codeänderung (§D-10): `TOC_DISABLED=1 npm run build`.
 *
 * `process` fehlt im Browser; der `typeof`-Test hält den Ausdruck auch dann
 * lauffähig, wenn das Modul im `dynamic`-Pfad clientseitig geladen wird.
 */
const ENV_DISABLED = typeof process === 'undefined' ? undefined : process.env?.TOC_DISABLED;
export const TOC_ENABLED = ENV_DISABLED !== '1';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: '\u00a0',
  quot: '"',
  shy: '\u00ad',
};

/** Löst HTML-Entitäten auf, ohne eine DOM-Abhängigkeit einzuführen. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
    const lower = body.toLowerCase();
    if (lower.startsWith('#x')) {
      const code = Number.parseInt(lower.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (lower.startsWith('#')) {
      const code = Number.parseInt(lower.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, lower) ? NAMED_ENTITIES[lower] : match;
  });
}

/**
 * Textnormalisierung nach §6.1 Nr. 4: Inline-Markup entfernen, Entitäten
 * auflösen, Whitespace-Folgen zu einem Leerzeichen, außen trimmen. Der Text
 * wird **nicht** gekürzt (§D-11).
 */
export function normalizeTocText(value: string): string {
  return decodeEntities(String(value ?? '').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Slug-Erzeuger nach §6.3: eine Instanz pro Dokument, alle bereits
 * vorhandenen IDs sind vorbelegt, damit erzeugte Anker nie mit vorhandenen
 * kollidieren. Die zweite Vergabe eines Slugs erhält `-1`, die dritte `-2`
 * (github-slugger-Verhalten).
 *
 * Als Klasse statt als Interface mit Funktionssignatur: die Parameter einer
 * reinen Typsignatur gelten der Lint-Regel `no-unused-vars` als unbenutzt.
 */
export class TocSlugger {
  private readonly slugger = new GithubSlugger();

  constructor(existingIds: Iterable<string> = []) {
    // github-slugger prüft die *Anwesenheit* eines Schlüssels und zählt beim
    // nächsten Treffer hoch; die Vorbelegung muss deshalb 0 sein (nicht 1),
    // damit der nächste gleiche Text `-1` erhält.
    for (const id of existingIds) {
      if (!id) continue;
      if (this.slugger.occurrences[id] === undefined) this.slugger.occurrences[id] = 0;
    }
  }

  /**
   * Slug für einen fehlenden Anker; leerer Text → `abschnitt-<n>`
   * (`position` = 1-basierter Index im Scope).
   */
  slugFor(text: string, position: number): string {
    // `baseSlug` ist zustandslos: nur so lässt sich erkennen, dass ein Text
    // keinen Slug ergibt. Ein leerer Slug darf nicht in den Slugger wandern,
    // sonst würde der zweite leere Text zu `-1` statt zu `abschnitt-<n>`.
    if (baseSlug(text)) return this.slugger.slug(text);
    return this.slugger.slug(`abschnitt-${position}`);
  }
}

/** Fabrik für den Slug-Erzeuger (bequemer Aufruf an den Aufbaustellen). */
export function createTocSlugger(existingIds: Iterable<string> = []): TocSlugger {
  return new TocSlugger(existingIds);
}

/** Einmaliger Slug ohne Dokumentbezug — für Tests und Einzelprüfungen. */
export function slugifyHeading(text: string): string {
  return createTocSlugger().slugFor(normalizeTocText(text), 1);
}

function normalizeLevels(levels: readonly number[] | undefined): number[] {
  const valid = (levels ?? TOC_DEFAULTS.levels)
    .filter((level) => Number.isInteger(level) && level >= MIN_LEVEL && level <= MAX_LEVEL)
    .sort((a, b) => a - b);
  const unique = [...new Set(valid)];
  return unique.length > 0 ? unique : [...TOC_DEFAULTS.levels];
}

/** Ergänzt Teilangaben zu vollständigen Optionen. */
export function resolveTocOptions(overrides: Partial<TocOptions> = {}): TocOptions {
  return {
    title: overrides.title?.trim() || TOC_DEFAULTS.title,
    levels: normalizeLevels(overrides.levels),
    minHeadings:
      typeof overrides.minHeadings === 'number' && overrides.minHeadings >= 0
        ? overrides.minHeadings
        : TOC_DEFAULTS.minHeadings,
    stickyOffset: overrides.stickyOffset?.trim() || TOC_DEFAULTS.stickyOffset,
    dynamic: overrides.dynamic === true,
  };
}

/**
 * Baut Liste und Verschachtelung aus den Überschriften (§6.1, §6.2).
 *
 * @param headings Überschriften in Dokumentreihenfolge.
 * @param overrides Optionen; fehlende Werte kommen aus `TOC_DEFAULTS`.
 * @param existingIds Weitere IDs des Dokuments, die nicht kollidieren dürfen.
 * @returns `null`, wenn weniger als `minHeadings` Einträge bleiben (§6.6).
 */
export function buildTocTree(
  headings: readonly TocHeadingInput[] | undefined | null,
  overrides: Partial<TocOptions> = {},
  existingIds: Iterable<string> = []
): TocTree | null {
  const options = resolveTocOptions(overrides);
  const levels = new Set(options.levels);

  const selected: { depth: number; slug: string; text: string }[] = [];
  for (const heading of headings ?? []) {
    if (!heading || heading.skip === true) continue;
    if (!Number.isInteger(heading.depth) || !levels.has(heading.depth)) continue;
    const text = normalizeTocText(heading.text);
    if (!text) continue;
    selected.push({ depth: heading.depth, slug: String(heading.slug ?? '').trim(), text });
  }

  // Leerzustand (§6.6): ohne Einträge entsteht kein Markup — auch dann, wenn
  // `minHeadings: 0` die Schwelle formal aufhebt.
  if (selected.length === 0 || selected.length < options.minHeadings) return null;

  const providedIds = selected.map((item) => item.slug).filter(Boolean);
  const slugger = createTocSlugger([...existingIds, ...providedIds]);

  const items: TocNode[] = [];
  const stack: TocNode[] = [];
  let count = 0;

  selected.forEach((entry, index) => {
    const slug = entry.slug || slugger.slugFor(entry.text, index + 1);
    while (stack.length > 0 && stack[stack.length - 1]!.depth >= entry.depth) stack.pop();
    const parent = stack.length > 0 ? stack[stack.length - 1]! : null;
    const node: TocNode = {
      depth: entry.depth,
      level: parent ? parent.level + 1 : MIN_LEVEL,
      slug,
      text: entry.text,
      children: [],
    };
    if (parent) parent.children.push(node);
    else items.push(node);
    stack.push(node);
    count += 1;
  });

  return { items, count };
}

/** Alle Einträge in Dokumentreihenfolge (Tiefensuche) — für Tests und Prüfungen. */
export function flattenToc(items: readonly TocNode[]): TocNode[] {
  const out: TocNode[] = [];
  for (const item of items) {
    out.push(item);
    out.push(...flattenToc(item.children));
  }
  return out;
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Verschachtelte `<ol>`-Liste des Verzeichnisses (§6.4).
 *
 * Wird serverseitig über `set:html` ausgegeben und im `dynamic`-Pfad
 * clientseitig nach dem Neuaufbau verwendet — deshalb wird hier zwingend
 * escaped: die Funktion ist die einzige Stelle, die Text in Markup setzt.
 */
export function renderTocList(items: readonly TocNode[]): string {
  const inner = items
    .map((node) => {
      const href = `#${escapeHtml(node.slug)}`;
      const children = node.children.length > 0 ? renderTocList(node.children) : '';
      return (
        `<li class="page-toc__item page-toc__item--${node.level}">` +
        `<a class="page-toc__link" href="${href}">${escapeHtml(node.text)}</a>` +
        `${children}</li>`
      );
    })
    .join('');
  return `<ol class="page-toc__list">${inner}</ol>`;
}

/** Anker-Ziel als URL-Fragment; keine Prozentkodierung (§6.3 Nr. 6). */
export function formatTocHref(slug: string): string {
  return `#${slug}`;
}
