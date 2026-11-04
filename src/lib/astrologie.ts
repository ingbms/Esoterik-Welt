/**
 * Gemeinsame Bausteine der Astrologie-Seiten.
 *
 * Die Bereichsnavigation stand im Bestand in `js/modules/astrologie-views.js`
 * (`renderViewNav`); hier ist sie eine Konstante, die Hub und Unterseiten teilen
 * — eine Änderung, eine Stelle.
 */

export const ASTROLOGIE_NAV = [
  { href: '/astrologie/', label: 'Hub' },
  { href: '/astrologie/lernpfad/', label: 'Lernpfad' },
  { href: '/astrologie/zeichen/', label: 'Zeichen' },
  { href: '/astrologie/faktoren/', label: 'Faktoren' },
  { href: '/astrologie/haeuser/', label: 'Häuser' },
  { href: '/astrologie/aspekte/', label: 'Aspekte' },
  { href: '/astrologie/grundlagen/', label: 'Grundlagen' },
  { href: '/astrologie/beispiele/', label: 'Beispiele' },
  { href: '/astrologie/faq.html', label: 'FAQ' },
  { href: '/astrologie/glossar.html', label: 'Glossar' },
  { href: '/astrologie/quellen.html', label: 'Quellen' },
  { href: '/astrologie/methodik.html', label: 'Methodik' },
  { href: '/astrologie/suche.html', label: 'Suche' },
];

/** Brotkrumen für eine Detailseite der Astrologie. */
export function astrologieTrail(familyLabel: string, familyHref: string, entryTitle: string) {
  return [
    { label: 'Start', href: '/' },
    { label: 'Astrologie', href: '/astrologie/' },
    { label: familyLabel, href: familyHref },
    { label: entryTitle },
  ];
}

/** Beschreibung aus dem Kurztext bauen — kein zu langer Satz für Suchmaschinen. */
export function metaDescription(short: string, max = 155): string {
  const clean = String(short ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).trimEnd()} …`;
}
