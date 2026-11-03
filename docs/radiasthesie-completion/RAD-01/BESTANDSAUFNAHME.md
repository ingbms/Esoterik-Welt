# Bestandsaufnahme — acht Prüfdimensionen des Originalauftrags

Basis: Commit `e44fa5c54c80cb39383fa4177aa587236dc87596`, Branch
`feature/radiasthesie-modul`, Arbeitsbaum `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`.
Zeilenangaben beziehen sich auf diesen Stand. Kursiv gesetzte Befunde sind
Abweichungen oder Risiken, keine Bewertung des Moduls.

## 1. Bestehender Quellcode

| Baustein | Umfang | Rolle |
| --- | --- | --- |
| `js/main.js` | 580 Z. | Einstieg, Hash-Router, `PAGE_META`, Modulverdrahtung, Kaltstart |
| `js/modules/radiasthesie.js` | 252 Z. | Bereichs-Controller: `load()`, `show(segments, query, {focus})`, Metadaten, JSON-LD, Fokus |
| `js/modules/radiasthesie-views.js` | 714 Z. | reine Funktionen `Daten → HTML` je Ansicht |
| `js/modules/radiasthesie-model.js` | 225 Z. | Route auflösen, Suche, Glossarfilter, Quellenzuordnung |
| `js/modules/radiasthesie-format.js` | 193 Z. | Escaping, Inline-Markup, `ROUTE`-Vokabular, Stufen-Chips |
| `js/data/radiasthesie.js` | 1.514 Z. (81 kB) | generierte Daten; **nicht** von Hand editieren |
| `scripts/generate-radiasthesie-data.cjs` | 707 Z. | Markdown → Datendatei; bricht bei unerwartetem Markup ab |
| `css/radiasthesie.css` | 1.005 Z. | `.rad-*`-Modul-CSS, ergänzt `design-system.css` (1.391 Z.) und `main.css` (3.876 Z.) |

Bestand außerhalb des Moduls: `tarot`, `crystals`, `moon`, `runes`, `blog`,
`astrologie` als eigene Module in `js/modules/`; Astrologie ist das
Referenzmuster für Bereichsmodule mit Unterrouten. Kein Framework, keine
Bundler-Abhängigkeit im Seitenbetrieb (ESM direkt), Webpack **nur** für die
Offline-Edition. Lokal läuft Node v24.13.0, CI pinnt Node 20
(`.github/workflows/ci.yml`).

## 2. Ordner- und Komponentenstruktur

```
/index.html            eine SPA, acht <section class="page">
/css                   design-system.css (Tokens) · main.css (Layout) · radiasthesie.css
/js/main.js            Router + Module
/js/modules/*.js       ein Modul je Bereich (radiasthesie*.js = Controller/Model/View/Format)
/js/data/*.js          generierte bzw. gepflegte Datenmodule
/assets/               fonts/ (lokal, SIL OFL) · radiasthesie/ (4 SVG) · tarot/ · crystals/ · …
/data/                 Auslieferungsdaten (crystals.json)
/scripts/*.cjs         Generatoren, Build (build-pages.cjs, build-local.cjs), Prüfskripte
/tests/*.mjs|cjs|js    node:test-Suiten + Playwright-Specs
/dist/Esoterik-Welt/   Build-Ausgabe (gitignored)
/public/               Altbestand/Platzhalter, vom Build **nicht** verwendet
/docs/                 Konzept, Recherche, Messung, QA, ab hier auch completion/
```

Komponentenvertrag des Bereichsmoduls: Der Router übergibt `segments` und
`query`, das Modul rendert in `#pendelnRoot`, setzt `document.title`/
`description`/`og:*`, verschiebt den Fokus und schreibt **nie** selbst in
`history` (nur `replaceState` für Filter- und Suchzustand).
Belege: `js/modules/radiasthesie.js:79-99` (`show`), `:104-125` (`resolveView`),
`:126-158` (`applyMeta`, `placeStructuredData`), `:159-198` (Fokus/Scroll).

## 3. Navigation und Routing

- Acht Hauptziele in der Kopfzeile, `index.html:70-77`; „Pendeln“ steht zwischen
  „Runen“ und „Wissen“ (`data-page="pendeln"`, `index.html:76`).
- `MAIN_PAGES` mit acht IDs: `js/main.js:22`; `PAGE_IDS` als `Set` daraus.
- Bereichsrouten als Regex: Astrologie `js/main.js:30`, Pendeln
  `js/main.js:37` (`/^pendeln(?:\/([^?]*))?(?:\?(.*))?$/`).
- `parseRoute` (`js/main.js:105-140`) liefert `type` ∈ `page|article|astrologie|pendeln|skip|unknown`;
  der Pendeln-Zweig steht ab `:127`.
- `applyRoute` (`js/main.js:388-448`) reicht Unterrouten an `navigateTo`
  (`:450`) weiter; `navigateTo` ruft `module.show(segments, query, {focus})`.
- Modulregistrierung `js/main.js:206`, Kaltstart-Laden `:244-250`.
- Unbekannte Fragmente fallen **nicht** auf eine leere Seite, sondern auf die
  letzte Seite plus Routenhinweis (`js/main.js:440-447`); innerhalb des Bereichs
  antwortet `renderNotFound`.
- Sieben nutzbare Routen: `#pendeln`, `#pendeln/{radiasthesie|pendeln|orakel}`,
  Kapitel-Deep-Links, `#pendeln/glossar[?b=R]`, `#pendeln/quellen[/Qxx]`,
  `#pendeln/methodik`, `#pendeln/suche?q=…`.
- *Grenze des Bestands:* Hash-Routen sind keine Dokumente. Canonical ist heute
  für alle Ansichten die Startseite (`index.html:18`), die Sitemap enthält keine
  Fragmente (`sitemap.xml`). Das ist der **Ist-Zustand** und zugleich die Lücke,
  die RAD-12 schließen muss: additive statische HTML-Seiten aus derselben
  Datenquelle (Karte `t_9e4cd9bb`), Hash-Router bleibt für Interaktion und
  Offline erhalten.

## 4. Vorhandene Inhalte und Taxonomie

| Ebene | Ist-Stand | Quelle der Wahrheit |
| --- | --- | --- |
| Themen | 3: Radiästhesie, Pendeln, Orakel | `js/data/radiasthesie.js:61,242,464` |
| Kapitel | 30 (8 / 10 / 12), je mit `id`, `number`, `title`, `chips` (A–E), `blocks[]`, `words` | `js/data/radiasthesie.js:86-241` u. a. |
| Glossar | 13 Begriffe in Buchstabengruppen, je `definition`, `levels`, `sources` | `js/data/radiasthesie.js:813-941` |
| Quellen | 33 (`Q01`–`Q33`) mit `type`, `year`, `locator`, `levels`, `verification`, `note`, `interestNote` | `docs/radiasthesie-konzept/recherche/quellen.json` (Schema 1.0) |
| Evidenzstufen | A Historisch · B Tradition · C Hypothese · D Befund · E Widerlegt | `js/data/radiasthesie.js:28-59` |
| Redaktion | 7 Markdown-Dateien mit Frontmatter | `docs/radiasthesie-konzept/inhalte/` |

Die Quellenbasis ist belastbarer als der Seitentext: `quellen.json` führt
zusätzlich `evidence_use`, `verified` (`page_loaded` 22, `crossref` 8,
`secondary_isbn` 2, `library_record` 1), `interest_note` und vier dokumentierte
`coverage_gaps` (u. a. offener Datierungskonflikt 1926 vs. 1931, keine
deutschsprachige kontrollierte Pendelstudie). Alle vier im Auftrag genannten
Startquellen (Cantergi 2021, Enright 1995, USGS, Gesellschaft für Anomalistik)
sind enthalten und mit DOI/URL belegt — geprüft in diesem Lauf.

*Nicht vorhanden:* eigene Entitäten für Instrumente, Methoden, historische
Ereignisse, Erklärungsmodelle, Studien, Medien und Experimente; Kapitel tragen
kein `slug`-Feld (die `id` übernimmt diese Rolle), kein `tags`, kein
`reviewStatus`, kein `lastReviewed`.

## 5. Visuelle Gestaltungsregeln

- Tokens in `css/design-system.css`: u. a. `--color-bg-deep`, `--color-bg-card`,
  `--color-primary|secondary|accent-gold`, `--color-text*`, `--space-0…20`,
  `--radius-sm…full`, `--shadow-*`, `--font-display|body|mono`,
  `--container-max`, `--header-height`, `--footer-height`.
- Schriften lokal: Fraunces + Manrope als `@font-face` (`design-system.css:18-38`),
  Dateien in `assets/fonts/` mit OFL-Texten; keine Google-Fonts-Anfrage.
- Modulklassen sind auf `.rad-*` skopiert; wiederverwendet werden `.astro-*`-
  Primitives (Callout, Details, Source, Panel) — kein Duplikat, kein Refactoring
  am Astrologie-Modul.
- Zeilenmaß 60 ch statt 72 ch (gemessen: 72 ch ⇒ 86 Zeichen/Zeile), Fokusring
  2 px Sand/Offset 4 px, Kontraste 6,45:1–8,42:1
  (`docs/radiasthesie-konzept/messung/kontrast.json`).
- Bewegung: keine neuen Animationen; die 120-ms-Kartenübergänge respektieren
  `prefers-reduced-motion`.
- Druck: Einordnungsband/-kasten mit Rahmen, Inhaltsverzeichnis aus.

## 6. Asset-Pipeline

| Pfad | Inhalt | Erzeugung |
| --- | --- | --- |
| `assets/radiasthesie/*.svg` | 4 eigene Zeichnungen (Pendelgeometrie, Winkelrute, Pendeltafel, Orakelkarten) | handgezeichnet, im Modul als `<img>` mit `title/desc` und `alt` |
| `docs/radiasthesie-konzept/assets/*.svg` | dieselben 4 Dateien, byte-identisch (SHA-256 geprüft) | Konzeptkopie für Mockup/Messung |
| `assets/fonts/` | Fraunces, Manrope + OFL | lokal, keine CDN-Anfrage |
| `assets/tarot/`, `assets/crystals/`, `assets/cosmos/`, `assets/mineral/` | Rasterbilder anderer Module | bestehende Skripte (`scripts/sync-*-assets.cjs`, `docs/kristalle/scripts/*`) |

- `scripts/build-pages.cjs:9-26` kopiert `index.html`, die vier Rechtsseiten,
  `robots.txt`, `sitemap.xml` sowie `css/`, `js/`, `data/`, `assets/` nach
  `dist/Esoterik-Welt/` und filtert `*.bak*`/`_*`.
- `scripts/build-local.cjs` baut zusätzlich die Datei-Edition `Lokal.html`:
  Webpack-IIFE aus `js/main.js` mit `dynamicImportMode: 'eager'`, CSS inline,
  Schriften relativ, Google-Fonts-Links entfernt, `data/crystals.json` als
  JSON eingebettet. **Konsequenz für neue Module:** Daten müssen als JS-Modul
  importierbar oder im Build explizit eingebettet sein; `fetch` auf lokale
  Dateien funktioniert unter `file://` nicht.
- *Fehlt für Radiästhesie:* eine Raster-/Varianten-Pipeline und ein
  `media-manifest.json`. Das Muster dafür existiert im Kristall-Modul
  (`docs/kristalle/image-sources.json`, `…/image-sources.evidence.json`,
  `scripts/sync-crystal-attribution.cjs`, `docs/kristalle/BILDQUELLEN.md`) und
  ist übertragbar.

## 7. SEO/GEO-Struktur

| Baustein | Ist | Beleg |
| --- | --- | --- |
| Titel/Description je Route | gesetzt vom Modul (`document.title`, `meta[name=description]`, `og:title/description/url`, `twitter:*`) | `js/modules/radiasthesie.js:126-158` |
| Beschreibungslänge | 102–149 Zeichen, Generator bricht bei >160 ab | `scripts/generate-radiasthesie-data.cjs` |
| Strukturierte Daten | `BreadcrumbList` je Ansicht, keine `Article`/`FAQPage`-Behauptung | `render*/breadcrumbStructuredData`, `js/modules/radiasthesie.js:143-158` |
| Canonical | `https://ingbms.github.io/Esoterik-Welt/` für alle Ansichten | `index.html:18` |
| Sitemap | 4 Dokumente (Startseite + 3 Rechtsseiten), **keine** Fragmente | `sitemap.xml` |
| Interne Links | 79 Ziele im QA-Lauf, 0 tote Ziele | `TESTBERICHT.md` §2 |
| Überschriften | genau eine H1 je Ansicht, keine Sprünge — außer Fehleransicht H1→H3 (B3) | `TESTBERICHT.md` B3 |

*Offen (Soll laut Delta-Karte RAD-12 / `t_9e4cd9bb`):* statische, ohne JS lesbare
HTML-Seiten aus derselben Datenquelle mit eigenen URLs, Canonicals, Sitemap-
Einträgen und `BreadcrumbList`-Zielen; `og:image` (B7); Titelbudget sachlich
geprüft (B8). Die bisherige B6-„Entscheidung“ (keine indexierbare Einzel-URL)
ist **kein** erledigter Punkt, sondern der zu behebende Mangel. GEO-Ziel
(zitierfähige, quellenbelegte Absätze) ist im Text durch Quellenmarker `[Qxx]`
und Methodik-Seite strukturell angelegt, aber ohne Dokument-URL nicht wirksam.

## 8. Bestehende Tests und Deployment-Prozesse

| Suite | Umfang | Aufruf |
| --- | --- | --- |
| Jest (unit/API) | `tests/**/*.test.js` | `npm test` |
| Seitenregression | `tests/pages-regression.cjs` | `npm run test:pages` |
| Kristall-Attribution | `tests/crystals-attribution.cjs` | `npm run test:crystals` |
| Astrologie | `tests/astrologie.mjs` | `npm run test:astrologie` |
| **Radiästhesie (Daten/Views)** | **16 Tests** | `npm run test:radiasthesie` |
| Tarot / Tarot-Decks / Mond | `.cjs`-Suiten | `test:tarot`, `test:tarot:decks`, `test:moon` |
| Offline-Edition (`file://`) | Chromium, Kaltstart `#pendeln/radiasthesie` | `npm run test:offline` |
| Browser-E2E | 12 Radiästhesie-Specs, gesamt 86 Specs | `npx playwright test`, `npm run test:e2e` |
| Lokaler Einstieg | `tests/local-entry.cjs` prüft Modulliste **exakt** | `npm run test:local` |
| Seitenprüfung live/Build | `scripts/verify-pages.cjs`, 12 Routen × 3 Breiten | `npm run verify:pages`, `verify:build` |

Deployment: GitHub Pages veröffentlicht das **Repository-Root**
(`scripts/build-pages.cjs:1-2`); `dist/Esoterik-Welt/` ist nur die lokale
Nachbildung. CI (`.github/workflows/ci.yml`) hat vier Jobs — `lint`,
`unit-test`, `build` (nach `unit-test`), `browser-e2e` (nach `unit-test`) — und
setzt Commit-Status `ci/lint`, `ci/unit-test`, `ci/build`, `ci/browser-e2e`.
*Befund:* Der Job `unit-test` ruft `npm run test:radiasthesie` **nicht** auf,
obwohl das Skript existiert (`package.json:25`); `test:all` enthält es
(`package.json:28`), die CI nutzt `test:all` aber nicht. Kein Deploy-Schritt in
der CI-Datei, kein Push-, Tag- oder Release-Automatismus.
