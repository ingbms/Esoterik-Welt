/**
 * Strukturierte Daten (JSON-LD) aus einer Quelle.
 *
 * Warum überhaupt: Der Bestand erzeugte JSON-LD nur in den sieben statischen
 * Radiästhesie-Dokumenten (und dort mit einem beschädigten `@context`:
 * `"@context":"https://***@graph"` statt `https://schema.org`). Startseite und
 * Astrologie hatten kein JSON-LD, Farbwelten nur clientseitig. Hier entstehen
 * die Knoten einmal, typisiert und ohne Fragmentadressen — Fragmente sind für
 * Suchmaschinen dieselbe Seite (Migrationsplan §6.3).
 */

export interface TrailEntry {
  label: string;
  href?: string;
}

function absolute(origin: URL | string, path: string): string {
  const base = typeof origin === 'string' ? origin : origin.href;
  return new URL(path, base.endsWith('/') ? base : `${base}/`).href;
}

/**
 * `BreadcrumbList` ohne Fragmentadressen. Die aktuelle Seite trägt kein `item`
 * — dieselbe Regel wie `js/modules/radiasthesie-seo.js#breadcrumbList`.
 */
export function breadcrumbList(trail: TrailEntry[], origin: URL | string): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((entry, index) => {
      const item = entry.href ? absolute(origin, entry.href) : null;
      if (item && item.includes('#')) {
        throw new Error(`BreadcrumbList enthält eine Fragmentadresse: ${item}`);
      }
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: entry.label,
        ...(item ? { item } : {}),
      };
    }),
  };
}

export interface WebPageInput {
  url: string;
  name: string;
  description?: string;
  lastmod?: string;
  kind?: 'WebPage' | 'CollectionPage' | 'Article' | 'FAQPage';
}

/** `WebPage`/`CollectionPage` mit Sitebezug. */
export function webPage({ url, name, description, lastmod, kind = 'WebPage' }: WebPageInput): Record<string, unknown> {
  const origin = new URL(url).origin;
  return {
    '@type': kind,
    '@id': `${url}#webpage`,
    url,
    name,
    ...(description ? { description } : {}),
    inLanguage: 'de',
    isPartOf: { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'VELARKANA' },
    ...(lastmod ? { dateModified: lastmod } : {}),
  };
}

/** Glossar als `DefinedTermSet` (Radiästhesie-Glossar, Astrologie-Glossar). */
export function definedTermSet(input: {
  url: string;
  name: string;
  terms: { term: string; definition: string }[];
}): Record<string, unknown> {
  return {
    '@type': 'DefinedTermSet',
    '@id': `${input.url}#glossary`,
    name: input.name,
    hasDefinedTerm: input.terms.map((entry) => ({
      '@type': 'DefinedTerm',
      name: entry.term,
      description: entry.definition,
    })),
  };
}

/** Artikel als `Article` — Datum aus dem Bestand, kein erfundenes Veröffentlichungsdatum. */
export function articleNode(input: {
  url: string;
  headline: string;
  description: string;
  datePublished: string;
  section: string;
}): Record<string, unknown> {
  return {
    '@type': 'Article',
    '@id': `${input.url}#article`,
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    articleSection: input.section,
    inLanguage: 'de',
    isPartOf: { '@id': `${input.url}#webpage` },
  };
}

/** Alle Knoten in einen `@graph` legen — ein Block, klare Referenzen. */
export function graph(nodes: Record<string, unknown>[]): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
