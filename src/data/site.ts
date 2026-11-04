/**
 * Stammdaten und Navigation der Website — eine Quelle für Kopfzeile, Fußzeile
 * und Titelbildung.
 *
 * Markenname: Der veröffentlichte Bestand (Commit 9f58439) rendert
 * „Esoterik-Welt“. Die Umbenennung auf VELARKANA ist die offene Entscheidung
 * F1 im Migrationsplan und nicht Teil dieser Karte; hier steht deshalb genau
 * der veröffentlichte Name, damit der Side-by-Side-Vergleich tragfähig bleibt.
 * Ein Wechsel ist eine Änderung an genau einer Stelle: `SITE.name`.
 *
 * Ziele der Navigation: Die `href`-Werte sind die in `docs/migration-plan.md`
 * §2 festgelegten Astro-Zielrouten (u. a. `/tarot.html`, `/wissen/`). Diese
 * Seiten entstehen erst mit der Inhaltsmigration (t_a3fc82b3 / P2–P4); bis
 * dahin laufen die Links im Dev-Server bewusst ins Leere (Astro-404), statt
 * auf die alten `#`-Routen zurückzugreifen, die es in Astro nicht mehr gibt.
 */

export interface NavItem {
  /** Stabile Kennung; entspricht dem bisherigen `data-page`-Wert. */
  readonly id: string;
  readonly label: string;
  /** Zielroute im Astro-Projekt. */
  readonly href: string;
  /**
   * Pfade (Präfixe), unter denen der Eintrag als aktuell gilt — nötig, weil
   * eine Rubrik später mehrere Routen hat (z. B. `/astrologie/zeichen/…`).
   */
  readonly matches: readonly string[];
}

export interface FooterLink {
  readonly label: string;
  readonly href: string;
}

export interface FooterColumn {
  readonly heading: string;
  readonly links: readonly FooterLink[];
}

export const SITE = {
  /** Anzeigename; erscheint im Logo, im Fußzeilen-Lockup und als Titel-Suffix. */
  name: 'Esoterik-Welt',
  language: 'de',
  ogLocale: 'de_DE',
  /** Trennzeichen zwischen Seitentitel und Marke im `<title>`. */
  titleSeparator: ' — ',
  footerNote: '© 2025 Esoterik-Welt — Statische Website, keine Tracker, keine Cookies.',
  repositoryUrl: 'https://github.com/ingbms/Esoterik-Welt',
  repositoryLabel: 'Open Source auf GitHub',
  /** Skip-Link-Text, wörtlich aus dem Bestand. */
  skipLinkLabel: 'Zum Hauptinhalt springen',
  /** Ziel des Skip-Links. */
  mainId: 'main',
} as const;

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Start', href: '/', matches: ['/'] },
  { id: 'tarot', label: 'Tarot', href: '/tarot.html', matches: ['/tarot.html'] },
  { id: 'crystals', label: 'Kristalle', href: '/kristalle.html', matches: ['/kristalle.html'] },
  { id: 'moon', label: 'Mondphasen', href: '/mondphasen.html', matches: ['/mondphasen.html'] },
  { id: 'astrologie', label: 'Astrologie', href: '/astrologie/', matches: ['/astrologie/'] },
  { id: 'frequenzen', label: 'Frequenzen', href: '/frequenzen/', matches: ['/frequenzen/'] },
  { id: 'runes', label: 'Runen', href: '/runen.html', matches: ['/runen.html'] },
  { id: 'pendeln', label: 'Pendeln', href: '/radiasthesie/', matches: ['/radiasthesie/'] },
  { id: 'farbwelten', label: 'Farben', href: '/farbwelten/', matches: ['/farbwelten/'] },
  { id: 'blog', label: 'Wissen', href: '/wissen/', matches: ['/wissen/'] },
];

export const FOOTER_BRAND_TEXT =
  'Eine Sammlung esoterischer Werkzeuge und Wissens für moderne Suchende. Kein Dogma — nur Werkzeuge für deine eigene Reise.';

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: 'Tools',
    links: [
      { label: 'Tarot-Karten', href: '/tarot.html' },
      { label: 'Kristall-Katalog', href: '/kristalle.html' },
      { label: 'Mondkalender', href: '/mondphasen.html' },
      { label: 'Frequenzlabor', href: '/frequenzen/labor.html' },
      { label: 'Runen-Wurf', href: '/runen.html' },
    ],
  },
  {
    heading: 'Wissen',
    links: [
      { label: 'Astrologie-Bereich', href: '/astrologie/' },
      { label: 'Radiästhesie & Pendeln', href: '/radiasthesie/' },
      { label: 'Farbwelten & Farben', href: '/farbwelten/' },
      { label: 'Artikel-Archiv', href: '/wissen/' },
      // Bestand: „Einsteiger-Guide“ zeigte auf #blog/6. Die Artikelrouten
      // entstehen mit eigener Slug-Entscheidung (Plan §9, offene Frage F4);
      // bis dahin zeigt der Eintrag auf die Artikelliste.
      { label: 'Einsteiger-Guide', href: '/wissen/' },
    ],
  },
  {
    heading: 'Rechtliches',
    links: [
      { label: 'Impressum', href: '/impressum.html' },
      { label: 'Datenschutz', href: '/datenschutz.html' },
      { label: 'Haftungsausschluss', href: '/haftung.html' },
      { label: 'Bild- & Schriftennachweise', href: '/impressum.html#bildnachweise' },
    ],
  },
];

/** Fußzeilen-Zeile der Rechtsseiten (Bestand: nur Pflichtlinks). */
export const LEGAL_FOOTER_LINKS: readonly FooterLink[] = [
  { label: 'Startseite', href: '/' },
  { label: 'Impressum', href: '/impressum.html' },
  { label: 'Datenschutz', href: '/datenschutz.html' },
  { label: 'Haftungsausschluss', href: '/haftung.html' },
];

/** Prüft, ob ein Navigationseintrag für den angegebenen Pfad aktiv ist. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const path = pathname.replace(/index\.html$/, '');
  return item.matches.some((match) => (match === '/' ? path === '/' : path.startsWith(match)));
}
