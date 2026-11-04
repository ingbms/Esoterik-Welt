/**
 * Legacy-Hash-Shim.
 *
 * Der Bestand routet über den URL-Hash (`#tarot`, `#astrologie/zeichen/widder`,
 * `#pendeln/glossar?b=R`). Fragmente erreichen keinen Server; sie können deshalb
 * weder per 301 noch per `_redirects` umgeleitet werden (Migrationsplan R1).
 * Der einzige Ort, der den Hash sieht, ist der Browser — hier wird er einmalig
 * auf die neue Adresse abgebildet.
 *
 * Zwei Aufgaben:
 * 1. Hash normalisieren (`#/`, leerer Hash, Groß-/Kleinschreibung).
 * 2. Alias-Fälle des Bestands abdecken (`#frequenzlabor`, `#chakren`,
 *    `#lichtfrequenzen`) — sie stehen in der generierten Map.
 */
import { LEGACY_ROUTE_MAP } from './legacy-routes.generated';

/** Entfernt führende `#`/`/`, Anker und Query — die Map kennt nur den Routenteil. */
export function normalizeLegacyHash(hash: string): string {
  return String(hash ?? '')
    .replace(/^#/, '')
    .replace(/^\/+/, '')
    .split('?')[0]
    .split('#')[0]
    .trim()
    .toLowerCase();
}

/**
 * Zieladresse für einen alten Hash — inklusive Query-Übernahme.
 * Gibt `null` zurück, wenn der Hash unbekannt ist (dann bleibt die Seite stehen;
 * im Bestand erschien dafür der `#routeNotice`-Hinweis).
 */
export function resolveLegacyHash(hash: string, search = ''): string | null {
  const key = normalizeLegacyHash(hash);
  if (!key) return null;
  const target = LEGACY_ROUTE_MAP[key];
  if (!target) return null;
  const query = search.startsWith('?') ? search : search ? `?${search}` : '';
  if (!query) return target;
  if (target.includes('#')) {
    const [path, fragment] = target.split('#');
    return `${path}${query}#${fragment}`;
  }
  return `${target}${query}`;
}

export { LEGACY_ROUTE_MAP };
