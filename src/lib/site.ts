/**
 * Eine Quelle für Marke, Origin und Titelregeln.
 *
 * Warum eine Konstantendatei: Im Bestand stand die Adresse
 * `https://ingbms.github.io/Esoterik-Welt/` in 19 Dateien (sitemap.xml,
 * js/main.js, js/modules/farbwelten.js, js/modules/radiasthesie-seo.js,
 * scripts/generate-radiasthesie-pages.cjs …). Ein Domainwechsel war damit ein
 * Suchen-und-Ersetzen mit Restrisiko. Entscheidung E4 des Migrationsplans
 * verlangt genau eine Konstante; `Astro.site` (aus `astro.config.mjs`,
 * überschreibbar per `ASTRO_SITE`) ist ihre Laufzeitform.
 *
 * Marke: Der Bestand A (live) trägt „Esoterik-Welt“, das Arbeitsprojekt B
 * „VELARKANA“ (Migrationsplan §11.5). Migriert wird auf B; die SEO-Baseline in
 * §6.1 ist deshalb mit `SITE_NAME_LEGACY` = „Esoterik-Welt“ zitiert und wird
 * für Paritätsprüfungen über `withBaselineBrand()` vergleichbar gemacht.
 */

/** Marke der Migration (Stand B, Migrationsplan §0.1/E5). */
export const SITE_NAME = 'VELARKANA';

/** Marke der veröffentlichten Baseline (Stand A, Migrationsplan §6.1). */
export const SITE_NAME_LEGACY = 'Esoterik-Welt';

/** Beschreibung der Startseite, wörtlich aus der SEO-Baseline §6.1. */
export const SITE_DESCRIPTION =
  'VELARKANA — Deine Pforte zu Tarot, Kristallen, Runen, Mondphasen und esoterischem Wissen.';

/** Projektgrenze für Titel (Näherung an ~600 px, Migrationsplan §6.2). */
export const TITLE_LIMIT = 60;

/**
 * Titel mit Markensuffix — aber nur, solange die Projektgrenze hält.
 * Regel wörtlich aus `js/modules/radiasthesie-seo.js#pageTitle`, damit Titel
 * nicht durch die Migration länger oder kürzer werden.
 */
export function pageTitle(viewTitle: string, siteName: string = SITE_NAME, limit: number = TITLE_LIMIT): string {
  const base = String(viewTitle ?? '').trim();
  if (!base) return siteName;
  const branded = `${base} | ${siteName}`;
  return branded.length <= limit ? branded : base;
}

/**
 * Absolute Adresse für Canonical, OpenGraph und JSON-LD.
 *
 * `build.format: 'file'` erzeugt Dateien wie `/wissen/foo.html`; die
 * Verzeichnisform `/` bleibt kanonisch (kein `index.html` in der URL).
 */
export function absoluteUrl(pathname: string, origin: URL | string): string {
  const base = typeof origin === 'string' ? origin : origin.href;
  const url = new URL(pathname.replace(/index\.html$/, ''), base.endsWith('/') ? base : `${base}/`);
  return url.href;
}

/** Pfad ohne `index.html`-Segment — Grundlage aller Canconicals. */
export function canonicalPath(pathname: string): string {
  return pathname.replace(/index\.html$/, '');
}

/**
 * Ersetzt in einem Baseline-Text die Marke A durch die Marke B.
 * Nur für Vergleiche und Dokumentation gedacht, nicht für die Ausgabe.
 */
export function withBaselineBrand(text: string): string {
  return text.split(SITE_NAME_LEGACY).join(SITE_NAME);
}
