/**
 * Querverweise der Astrologie-Daten auflösen.
 *
 * Die Datensätze verweisen mit IDs aufeinander (`element-feuer`,
 * `faktor-mars`, `haus-1`, `zeichen-waage`). Im Bestand löste
 * `js/modules/astrologie.js` diese IDs zur Laufzeit auf; hier entsteht eine
 * statische Tabelle, damit Querverweise echte Links werden (SEO und A11y:
 * klickbare Beziehungen statt toter ID-Texte).
 */
import { ASPEKTE, BEISPIELE, FAKTOREN, GRUNDLAGEN, HAEUSER, ZEICHEN } from '../data/legacy';

const TARGETS = new Map<string, { href: string; label: string }>();

function register(id: string, href: string, label: string): void {
  if (!TARGETS.has(id)) TARGETS.set(id, { href, label });
}

for (const entry of GRUNDLAGEN) {
  register(entry.id, `/astrologie/grundlagen/${entry.slug}.html`, entry.name ?? entry.title);
}
for (const entry of FAKTOREN) {
  register(entry.id, `/astrologie/faktoren/${entry.slug}.html`, entry.name);
}
for (const entry of HAEUSER) {
  register(entry.id, `/astrologie/haeuser/${entry.slug}.html`, entry.name);
}
for (const entry of ZEICHEN) {
  register(entry.id, `/astrologie/zeichen/${entry.slug}.html`, entry.name);
}
for (const entry of ASPEKTE) {
  register(entry.id, `/astrologie/aspekte/${entry.slug}.html`, entry.name);
}
for (const entry of BEISPIELE) {
  register(entry.id, `/astrologie/beispiele/${entry.slug}.html`, entry.titel);
}

/** Ziel eines Querverweises oder `null`, wenn die ID nicht auflösbar ist. */
export function crossRefTarget(id: string): { href: string; label: string } | null {
  return TARGETS.get(id) ?? null;
}

/** Alle auflösbaren IDs — für den Abgleich in der Prüfung. */
export function crossRefIds(): string[] {
  return [...TARGETS.keys()];
}
