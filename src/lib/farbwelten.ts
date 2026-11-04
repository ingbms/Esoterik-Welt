/**
 * Adressen der Farbwelten.
 *
 * Das Datenmodul (`js/data/farbwelten.js`) führt `route` in der Form des
 * Bestands: `#farbwelten/rot`. In Astro ist daraus `/farbwelten/rot.html`
 * geworden. Diese beiden Helfer sind die einzige Stelle, die das umrechnet —
 * sonst entstehen genau die Adressen mit doppeltem Präfix, die ein Link-Check
 * zu Recht als tot meldet.
 */

/** Slug einer Farbwelt (`#farbwelten/rot` → `rot`). */
export function farbSlug(route: string): string {
  return String(route ?? '')
    .replace(/^#/, '')
    .replace(/^farbwelten\//, '');
}

/** Zieladresse einer Farbseite. */
export function farbHref(route: string): string {
  return `/farbwelten/${farbSlug(route)}.html`;
}
