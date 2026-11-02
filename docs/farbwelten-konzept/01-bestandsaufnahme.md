# Bestandsaufnahme — Esoterik-Welt vor dem Ausbau „Farbwelten“

Stand: 2. November 2026 · Grundlage: Arbeitsbaum `C:\Users\mas\Arbeit\Esoterik-Welt`
(Branch `feature/kristalle-review-fixes`, Commit `dcdb1cc`), gerendert über
`http://127.0.0.1:8138/Esoterik-Welt/`.

## 1. Technische Architektur

Die Website ist eine **Ein-Dokument-Anwendung**: `index.html` enthält alle
Modulansichten als `<section class="page">`, `js/main.js` schaltet sie über
Hash-Routen um. Dazu kommen statische Rechtsseiten (`impressum.html`,
`datenschutz.html`, `haftung.html`, `404.html`) und ein Offline-Build
(`Lokal-*.html`).

| Baustein | Umfang | Bedeutung für „Farbwelten“ |
| --- | ---: | --- |
| `index.html` | 817 Zeilen | Kopfzeile, Hauptnavigation, Seitencontainer, Modulmarkup |
| `css/design-system.css` | 1391 Zeilen | Tokens, Basis-Typografie, Layout, Buttons, Karten, Fokus, Navigation |
| `css/main.css` | 3876 Zeilen | Modul- und Komponentenstile inkl. `astro-*`-Bausteine |
| `js/main.js` | 580 Zeilen | Router (`parseRoute`, `applyRoute`, `navigateTo`), Meta, Fokus |
| `scripts/build-pages.cjs` | Kopierschritt | kopiert u. a. `index.html`, `css`, `js`, `data`, `assets` nach `dist/Esoterik-Welt` |
| `sitemap.xml` | 4 Dokumente | listet nur echte Dokumente, keine Hash-Ansichten |
| `tests/` + `scripts/verify-pages.cjs` | Playwright/Node | Route-, Konsolen- und Layoutprüfungen |

**Wichtig:** Es gibt keinen Router mit echten Pfaden. `/farbwelten` ist heute
kein Dokument, sondern nur als Fragment `#farbwelten` darstellbar. Die
Implementierung muss deshalb Hash-Routen anlegen (siehe `02-informationsarchitektur.md`).

## 2. Hauptnavigation (Ist-Zustand)

Acht Ziele, Label und Reihenfolge:

`Start · Tarot · Kristalle · Mondphasen · Astrologie · Runen · Pendeln · Wissen`

- Horizontal ab 781 px, darunter Burger-Menü (`@media (max-width: 780px)` in
  `css/design-system.css`).
- Zwischen 781 und 1120 px greift eine Kompaktregel (13 px Schrift, 8 px
  Listenabstand, 16 px Kopfzeilenabstand) in `css/main.css`.
- Zwischen 781 und 900 px zusätzlich: Logo 24 px, Listenabstand 4 px.
- Der Favoritenzähler (`#favCounter`, von `js/modules/crystals.js` in
  `.header-inner` gehängt) belegt zusätzlich Platz und ist im Betrieb sichtbar
  (`♥ 0` bis `♥ 128`).

Gemessene Reserve mit acht Zielen und dreistelligem Zähler: **31,80 px bei
781 px** (eigene Messung, `messung/nav-9-ziele-farben.json`, Serie
`counterBaseline`; die Reserve ist die Innenbreite der Kopfzeile minus aller
Kindbreiten und Zwischenabstände). Dieser Wert stimmt exakt mit der im
Radiästhesie-Konzept dokumentierten Reserve überein und validiert die
Messmethode. Für ein neuntes Ziel reicht diese Reserve nicht — Details und
Entscheidung in `02-informationsarchitektur.md` §3.

## 3. Designsystem „Nachtatelier“ (verbindlich)

Acht normative Farbwerte, lokal gehostete Variable Fonts, 4-px-Raster, 1-px-Rahmen,
2-px-Radien, **keine** Schlagschatten, Glows, Blur oder Pillenformen.

| Rolle | Token | Hex | Verwendung |
| --- | --- | --- | --- |
| Hintergrund | `--color-bg-deep` | `#0b1012` | gesamter Nachtraum |
| Oberfläche | `--color-bg-card` | `#141c1f` | zweite Ebene, Karten |
| Text | `--color-text-primary` | `#eae6dc` | Titel, Haupttext |
| Sekundärtext | `--color-text-secondary` | `#babdb7` | Legenden, Beschreibungen |
| Primär/Sand | `--color-primary` | `#c6b38e` | Hauptaktion, ein kursives Titelwort |
| Hover | `--color-hover` | `#d5c4a2` | aktivierte Hauptaktion |
| Linie dekorativ | `--color-border` | `#3c484b` | 1-px-Trenner |
| Linie funktional | `--color-line-strong` | `#82928e` | Rahmen, Diagrammlinien |

Typografie: `Fraunces` (Display, echtes Italic für **ein** betontes Wort),
`Manrope` (Fließtext), `ui-monospace` (Messwerte). H1 80/66/52/46 px,
H2 44 → 34 px mobil, H3 28 px, Body 16 px/1.7, Labels 13 px/0.08em uppercase.
Keine Pflichtinformation unter 13 px.

Layout: Inhalt max. 1360 px + 64 px Außenabstand (32 px ≤1100, 24 px ≤700),
Sektionen 64 px (mobil 48 px), Header 100/84 px.

Kontrastbasis (gemessen, `messung/palette.json` → `base_contrast`):

| Paar | Kontrast |
| --- | ---: |
| Text primär auf `#0b1012` | 15,36:1 |
| Text sekundär auf `#0b1012` | 10,07:1 |
| Sand auf `#0b1012` | 9,33:1 |
| Text primär auf `#141c1f` | 13,86:1 |
| Text sekundär auf `#141c1f` | 9,09:1 |
| Sand auf `#141c1f` | 8,42:1 |
| Funktionale Linie auf `#0b1012` | 5,88:1 |
| Dekorative Linie auf `#0b1012` | 2,02:1 (kein Bedienelement) |

Fokus: `outline: 2px solid #c6b38e; outline-offset: 4px` auf allen interaktiven
Elementen; `prefers-reduced-motion` setzt Animationen und Übergänge auf 0,01 ms.

## 4. Vorhandene Komponenten, die wiederverwendet werden

| Komponente | Klasse / Datei | Nutzung im neuen Bereich |
| --- | --- | --- |
| Container | `.container` | identischer Seitenrahmen |
| Abschnittskopf | `.fw-section__head` (neu) nach Muster `.section-head` | Bereichsköpfe |
| Karte | `.card` / `.astro-card` | Basis der Farbkarte |
| Kartengitter | `.astro-card-grid` (`minmax(260px, 1fr)`) | Vorbild für `.fw-card-grid` |
| Kennzeichnungs-Chips | `.astro-badge`, `--empirie`, `--historisch`, `--konvention`, `--deutungstradition` | Evidenzstufen |
| Hinweiskasten | `.astro-callout`, `--limit` | Disclaimer, Grenzen |
| Inhaltsverzeichnis | `.astro-toc` (`<details>`) | Farbdetailseite mobil |
| Metazeile | `.astro-kennzeichnung` | Evidenzzeile unter dem Titel |
| Button/Textlink | `.btn`, `.btn-primary`, `.textlink` | Hauptaktion, Weiterlesen |
| Fokus/Skip | `.skip-link`, globale `:focus-visible`-Regel | unverändert |
| Chakra-Farben als Datenpunkte | `--color-chakra-*` | nur kleine Punkte, nicht als UI-Fläche |

Die `astro-*`-Bausteine stammen aus dem Astrologie-Modul und sind bereits
modulübergreifend im Einsatz; sie werden **nicht** kopiert, sondern erweitert.

## 5. Vorhandene Inhalte mit Berührung zum neuen Bereich

- **Kristalle**: Chakra- und Farbfilter, `data/crystals.json`, Chakra-Farbtokens
  als Inhaltsdaten. Eine Farbwelt-Seite muss auf den Kristallkatalog verlinken,
  ohne dessen Datenmodell zu ändern.
- **Mond/Astrologie**: keine inhaltliche Überschneidung, aber dieselbe
  Kennzeichnungspraxis (Evidenz-Badges, Grenzen-Kästen).
- **Pendeln/Radiästhesie**: jüngstes Modul mit derselben Navigations- und
  Unterrouten-Logik (`#pendeln/<thema>`) — Vorbild für `#farbwelten/<farbe>`.
- **Wissen/Blog**: Artikelroute `#blog/<id>`; Farbwelten darf keine zweite
  Artikelliste aufbauen, sondern verlinkt in den Blog.

## 6. Beobachtete Grenzen und Risiken

1. **Kopfzeile**: neun Ziele passen bei 781 px nicht (siehe §2). Ohne Regel
   entsteht Überlauf; eine Lösung ist verbindlich (IA §3).
2. **Sitemap**: Hash-Ansichten sind keine Dokumente. Neue `<url>`-Einträge wären
   falsch; die Sektion erbt Canonical und Sitemap-Verhalten des Radiästhesie-Moduls.
3. **Kein Build für Inhalte**: Texte liegen heute in JS-Modulen/JSON. Für
   Farbwelten ist ein strukturiertes Datenmodell nötig, sonst duplizieren sich
   sieben Seiten mit identischen Absätzen.
4. **Farbe als Gestaltungsmittel**: Das System ist bewusst dunkel und gedeckt.
   Große gesättigte Flächen sind ein Bruch, wenn sie ungebremst eingesetzt
   werden; die Paletten in `03` halten Chroma und Helligkeit deshalb gedeckelt.
5. **Reduzierte Bewegung**: bestehende globale Regel greift; neue Animationen
   dürfen sich nicht darauf verlassen, sondern müssen auch ohne Animation
   vollständig verständlich sein.

## 7. Nachweise

| Nachweis | Datei |
| --- | --- |
| Startseite 1440 px | `messung/bestand/start-1440.png` |
| Startseite 390 px | `messung/bestand/start-390.png` |
| Kristalle-Modul 1440 px | `messung/bestand/kristalle-1440.png` |
| Mobilmenü mit neun Zielen 390 px | `messung/bestand/mobil-menue-9-ziele-390.png` |
| Kopfzeilenmessung | `messung/nav-9-ziele-farben.json`, `messung/nav-9-ziele-farbwelten.json` |
| Token-/Kontrastwerte | `messung/palette.json`, `messung/palette-tabellen.md` |
| Screenshots wurden mit Chromium (Playwright 1.64.1) erzeugt; Konsolenfehler: keine. | `messung/nav-9-ziele-farben.json` → `consoleErrors` |
