# Implementierung — Themenmodul „Radiästhesie, Pendeln und Orakel“

Karte: `t_8c0cbe98` (ESOW-RAD-000, Umsetzung und Integration)
Stand: 2. November 2026 · Status: **umgesetzt, Build und Tests grün**
Vorgaben: `ia-konzept.md`, `komponenten-specs.md`, `a11y-checkliste.md`,
`responsive-checkliste.md` (Karte `t_f5d8a1a4`) und die freigegebenen Texte
(Karte `t_059ba08e`).

## 1. Was jetzt läuft

Sieben Routen im bestehenden Hash-Router, erreichbar über das achte
Hauptnavigationsziel „Pendeln“ (zwischen „Runen“ und „Wissen“) und den
Footer-Link „Radiästhesie & Pendeln“:

| Route | Ansicht | Inhalt |
| --- | --- | --- |
| `#pendeln` | Landingpage | Hero, Einordnungsband, drei Themenkarten, Stufenlegende, offene Fragen, Werkstatt-Teaser, verwandte Bereiche, Einordnungskasten |
| `#pendeln/radiasthesie` | Themenseite | 8 Kapitel (Begriff, Geschichte I–III, Instrumente, Erdstrahlen, Geologie, Bovis) |
| `#pendeln/pendeln` | Themenseite | 10 Kapitel (Praxis, Geschichte, Arten, Lernen, Tafeln, Biotensor, Karten, Mechanik, Forschungsstand, Selbsttest) |
| `#pendeln/orakel` | Themenseite | 12 Kapitel (Divination, Tarot I–III, I Ging, I Ging im Westen, Runen, Runen im 20. Jh., Orakelkarten, Delphi, Ethylen, Forer) |
| `#pendeln/glossar` | Glossar | 13 Begriffe, Live-Suche, Buchstabenleiste, `?b=R` als Filter |
| `#pendeln/quellen` | Quellen | 33 Quellen mit Typ, Jahr, Prüftiefe, Interessenvermerk, Rückverweis auf die Seiten |
| `#pendeln/methodik` | Methodik | Arbeitsannahme, Kennzeichnung A–E, Prüfung, Grenzen, Quelleninteressen, Datenschutz, rechtlicher Hinweis |
| `#pendeln/suche?q=…` | Suche | Themen, Kapitel, Glossar und Quellen; leere Suche und Fehleransicht mit Vorschlägen |
| `#pendeln/gibtsnicht` | Fehleransicht | bereichsintern, drei Wege zurück, Fokus auf die H1 |

Kapitel sind eigene Deep-Links (`#pendeln/radiasthesie/instrumente`), Quellen
ebenfalls (`#pendeln/quellen/Q06`). Damit bleiben Kapitel und Belege teilbar,
obwohl die Seite eine Einzeldokument-SPA mit nur einem Hash ist.

## 2. Dateien

**Neu**

| Datei | Zweck |
| --- | --- |
| `docs/radiasthesie-konzept/inhalte/*.md` | freigegebene Texte als Quelle der Wahrheit (7 Dateien) |
| `scripts/generate-radiasthesie-data.cjs` | Markdown → `js/data/radiasthesie.js`; bricht bei unerwartetem Markup ab |
| `js/data/radiasthesie.js` | generierte Daten (81 kB): Themen, Kapitel, Blöcke, Stufen, Glossar, Quellen, Rechtstext |
| `js/modules/radiasthesie-format.js` | reine Formatierung: Escaping, `**fett**`, `*kursiv*`, `[Qxx]`-Links, Routen, Chips |
| `js/modules/radiasthesie-model.js` | Route auflösen, Suche, Glossarfilter, Quellenzuordnung |
| `js/modules/radiasthesie-views.js` | Ansichten als reine Funktionen (Daten → HTML + Titel) |
| `js/modules/radiasthesie.js` | Controller: rendern, Metadaten, Fokus, JSON-LD, Filterzustand |
| `css/radiasthesie.css` | Modul-CSS aus dem Mockup (`.rad-*`) plus fünf Ergänzungen der Umsetzung |
| `assets/radiasthesie/*.svg` | vier eigene Instrumentenzeichnungen (Pendelgeometrie, Winkelrute, Pendeltafel, Orakelkarten) |
| `tests/radiasthesie.mjs` | 16 Tests ohne Browser (Daten, Routen, Ansichten, Escaping, JSON-LD) |
| `tests/radiasthesie.spec.js` | 12 Browsertests (Navigation, Routen, Deep-Links, Filter, Breakpoints, Tastatur, Metadaten) |
| `docs/radiasthesie-konzept/scripts/probe-modul.cjs` | Messlauf gegen den Build (Status, Konsole, Fokus, Überläufe) |

**Geändert**

| Datei | Änderung |
| --- | --- |
| `index.html` | Navigationsziel `data-page="pendeln"`, Abschnitt `#pendeln` mit `<noscript>`-Kurzfassung, Stylesheet-Verweis, Footer-Link |
| `js/main.js` | `PENDELN_ROUTE`, `parseRoute`-Zweig, `applyRoute`-Zweig, `PAGE_META.pendeln`, Modul-Init, Kaltstart-Laden |
| `css/main.css` | Kopfzeilen-Regel 781–900 px (Logo 24 px, Listenabstand 4 px), ≤360-px-Reflow-Regel |
| `css/design-system.css` | `align-items: stretch` für das gestapelte Mobilmenü |
| `sitemap.xml` | `lastmod` der Startseite, Kommentar zur Fragment-Grenze |
| `tests/local-entry.cjs`, `tests/offline-file.cjs`, `scripts/verify-pages.cjs` | Erwartungen um das neue Modul und die Route `pendeln` erweitert (keine Testabschwächung) |

Nicht geändert: Design-Tokens, Schriften, bestehende `.astro-*`-Regeln,
Startseiten-Kachelraster (bleibt bei sechs Karten), übrige Module.

## 3. Wie die Inhalte hereinkommen

1. Redaktion schreibt Markdown in `docs/radiasthesie-konzept/inhalte/`.
2. `node scripts/generate-radiasthesie-data.cjs` parst Frontmatter, Kapitel,
   Listen, Hinweisboxen, Stufenklammern und das Quellenverzeichnis.
3. Ergebnis ist `js/data/radiasthesie.js` — reines Datenmodul, kein HTML.
4. Die Ansichten escapen jeden Text und zeichnen nur `**fett**`, `*kursiv*`
   und `[Qxx]` aus. Unbekanntes Markup bricht den Generator ab, statt still
   zu verschwinden.

Damit ist die Redaktion von der Darstellung getrennt: Texte ändern heißt
Markdown ändern und neu generieren, nicht HTML in JavaScript schreiben.
`tests/radiasthesie.mjs` prüft den erzeugten Stand (Kapitelzahl, auflösbare
Quellen, keine Platzhalter, Escaping).

Quellen: Maßgeblich ist `docs/radiasthesie-konzept/recherche/quellen.json`
(33 geprüfte Einträge, Locator/DOI/ISBN). Die redaktionelle Tabelle im
Quellenverzeichnis liefert Kurznamen und Anmerkungen.

## 4. Abweichungen von der Vorlage (bewusst, mit Grund)

| # | Vorlage | Umsetzung | Grund |
| --- | --- | --- | --- |
| A1 | Anker `#was`, `#instrumente`, `#geschichte`, `#befunde` | `was`, `instrumente`, `geschichte-1…3`, `erdstrahlen`, `geologie`, `bovis` | Der Text hat drei Geschichtskapitel und kein Kapitel „Befunde“ auf der Radiästhesie-Seite. Anker folgen dem Inhalt, nicht dem Wunschraster; Deep-Links bleiben stabil. |
| A2 | Evidenztafel C7 mit Aussagen-IDs (H-01, T-04 …) | Stufen-Chips je Kapitel; Erklärungen auf der Methodik-Seite | Die freigegebenen Texte liefern keine Aussagen-IDs. Eine Tabelle hätte Aussagen neu erfinden müssen. |
| A3 | Kapitel als reine `<section id>`-Anker | zusätzlich als Route `#pendeln/<thema>/<kapitel>` | Ein Hash kann nicht zwei Sprungziele tragen; so sind Kapitel teilbar und der Router bleibt zuständig. |
| A4 | Quellenmarker als `[Sxx]` mit Anker `#quelle-Sxx` | `[Qxx]` → `#pendeln/quellen/Qxx` | IDs der Quellenbasis sind Q01–Q33; der Deeplink hebt die Zeile hervor und setzt den Fokus. |
| A5 | Landingpage ohne Abschnitt „offene Fragen“ | Abschnitt „Was offen bleibt“ (03) | Der Auftrag verlangt benannte Lücken; der Text liefert sie (§5). Die Struktur-Tabelle aus dem Einstiegstext bleibt unveröffentlicht. |
| A6 | „Redaktions-Hinweis“ als letztes Kapitel | Einordnungskasten (C13) mit Tradition / Evidenz / Konsequenz | Ein Meta-Abschnitt mitten im Artikel liest sich als Betriebsanleitung. Aussage bleibt vollständig. |
| A7 | Wortbudget 800–1.200 W je Themenseite | 8–12 Kapitel, rund 13.000 Zeichen je Seite | Der freigegebene Text ist länger; Kapitel statt Kürzung. |
| A8 | Sitemap-Einträge je Themenseite | keine Fragment-Einträge, Canonical bleibt die Startseite | Hash-Routen sind keine Dokumente; ein Eintrag wäre falsch. Offen benannt in `ia-konzept.md` §7 und im Sitemap-Kommentar. |
| A9 | Startseiten-Kachelraster | unverändert sechs Karten, Modul über Navigation und Footer | Das Raster ist auf sechs Karten ausgelegt; ein siebtes hätte zwei bestehende Tests und das Layout verändert, ohne Nutzen. |

## 5. Korrekturen an den freigegebenen Texten

Beim Einbau sind offensichtliche Fehler und interne Verweise aufgefallen. Sie
wurden in der Quelldatei korrigiert (nicht im Generator kaschiert):

- Tippfehler: „Redaktionenlicher“ → „Redaktioneller“, „Verbbindung“ →
  „Verbindung“, „**z weitgehend**“ → „weitgehend“, „From einem Spalt“ →
  „aus einem Spalt“, „Rosenzweig“ → „Rosenkreuzer“, „Läsion selbst getestet“
  → „eigene Trefferquote getestet“.
- Interne Verweise („Dossier Abschnitt 8“, „Task t_…“, „ESOW-RAD-09“,
  „Profil writer“) aus dem öffentlichen Text entfernt bzw. auf die
  Methodik-Seite umgebogen. Ein Dossier-Verweis auf einer öffentlichen Seite
  ist für Leserinnen und Leser ohne Wert.
- **Falsche Feature-Behauptungen:** Die Texte sprachen von „interaktivem
  Tafel-Studio“, „Experimentierlabor“ und „Störfeld-Landkarte“ im Präsens.
  Diese Module (ESOW-RAD-07/08/09) sind nicht Teil dieser Karte und existieren
  nicht. Formuliert als „in Vorbereitung“ bzw. neutral beschrieben — sonst
  behauptet die Seite Funktionen, die sie nicht hat.
- Das Quellenverzeichnis listete 29 Zeilen, die Quellenbasis hat 33. Q11, Q14,
  Q18 und Q30 fehlten; sie werden aus `quellen.json` ergänzt. Der
  Interessenvermerk „Wie Q06.“ wird aufgelöst, statt auf der Seite zu stehen.
- Meta-Descriptions auf 120–160 Zeichen gekürzt (Generator bricht bei >160 ab).

## 6. Barrierefreiheit und Responsivität

Umgesetzt und gemessen:

- **Struktur:** genau eine H1 je Ansicht, keine Überschriften-Sprünge,
  Brotkrümel als `<nav aria-label="Brotkrümelnavigation">` mit `<ol>`,
  letztes Element ohne Link und mit `aria-current="page"`.
- **Stufen:** immer Textmarke („A · Historisch“), Farbe nur als Zusatz;
  Kontraste aus `messung/kontrast.json` (6,45:1 bis 8,42:1).
- **Einordnungsband:** `<aside>` mit `aria-labelledby`, nicht schließbar,
  direkt unter dem Kopf.
- **Fokus:** H1 erhält `tabindex="-1"` und Fokus nach Routenwechsel;
  Kapitel-Deep-Links fokussieren die H2; Quellen-Deeplinks die Quellenzeile.
  Fokusring 2 px Sand, Offset 4 px (bestehende Regel, nicht abgeschaltet).
- **Tastatur:** `details`/`summary` nativ, Buchstabenleiste nur für
  vorhandene Buchstaben ein Link, leere Buchstaben `aria-hidden` und nicht
  fokussierbar, Suchfeld mit `<label class="sr-only">`.
- **Live-Region:** Trefferzahl in `role="status" aria-live="polite"`.
- **Bilder:** vier eigene SVGs mit `<title>`/`<desc>`, Alt-Text beschreibt das
  Motiv; `width`/`height` gegen Layoutsprung.
- **Responsiv:** 0 px Überlauf bei 320, 360, 390, 700, 768, 781, 900, 1024,
  1200 und 1440 px auf Landing, Themenseite, Glossar und Quellen (je Breite
  frisch geladen). Mobilmenü: acht Zeilen à 342 × 48 px, linksbündig.
- **Bewegung:** keine neuen Animationen; die 120-ms-Übergänge der Karten
  respektieren `prefers-reduced-motion` (bestehende Regel).
- **Druck:** Einordnungsband und -kasten mit Rahmen, Inhaltsverzeichnis aus.

## 7. SEO / GEO

- Titel und Beschreibung je Route (Modul setzt `document.title`,
  `meta[name=description]`, `og:title`, `og:description`, `og:url`,
  `twitter:title`, `twitter:description`).
- Beschreibungen 102–149 Zeichen, jeweils mit Prüfstand („ohne
  Wirkungsversprechen“).
- `BreadcrumbList` als JSON-LD je Ansicht. Kein `Article` (keine
  Veröffentlichungsinstanz), kein `FAQPage` (keine FAQ-Seite).
- Canonical bleibt `https://ingbms.github.io/Esoterik-Welt/`; Sitemap enthält
  keine Fragmente. Die Grenze ist in `ia-konzept.md` §7 offen benannt.

## 8. Nachweise

| Prüfung | Ergebnis |
| --- | --- |
| `npm run build` | grün, Offline-Build (`Lokal.html`) inklusive |
| `node --test tests/radiasthesie.mjs` | 16/16 |
| `npx playwright test tests/radiasthesie.spec.js` | 12/12 |
| `npm run test:unit` / `test:pages` / `test:crystals` / `test:astrologie` / `test:tarot` / `test:tarot:decks` / `test:moon` | alle grün |
| `npm run test:offline` | 2/2 (Datei-Edition, inkl. Kaltstart `#pendeln/radiasthesie`) |
| `npx playwright test` (gesamte Suite) | 86/86 |
| `node docs/radiasthesie-konzept/scripts/probe-modul.cjs` | 9 Routen ohne 404/Konsolenfehler/externe Requests, Fokus korrekt, 0 px Überlauf bei 10 Breiten |
| Screenshots | `docs/radiasthesie-konzept/messung/modul/` (9 × 1440 px, 3 × 390 px) |

## 9. Offen (nicht Teil dieser Karte)

1. **Screenreader- und axe-Lauf** fehlt weiterhin; die Struktur- und
   Fokusprüfungen sind automatisiert, ein NVDA/VoiceOver-Durchgang nicht.
2. **Lighthouse** wurde nicht gefahren (die Karte nennt einen Spotcheck; die
   Messung erfolgte über Überläufe, Kontraste und Konsolenfehler).
3. **Werkstatt-Module** ESOW-RAD-07/08/09 (Pendellabor, Tafel-Studio,
   Experimentierlabor) sind auf der Landingpage als „In Vorbereitung“
   gekennzeichnet und nicht implementiert.
4. **Fotos** der Instrumente fehlen; die Lizenzprüfung aus ESOW-RAD-05 steht
   aus. Vier eigene SVGs tragen die Darstellung.
5. **Hash-Routen** sind nicht einzeln indexierbar (Architekturentscheidung,
   siehe `ia-konzept.md` §7).
6. **Textzoom** (nur Schrift, 200 %) skaliert die px-Typografie des Bestands
   nicht — systemweite Entscheidung, nicht modulspezifisch.

## 10. Wiederaufnahme

```bash
cd ~/Arbeit/Esoterik-Welt
node scripts/generate-radiasthesie-data.cjs      # Texte → Datendatei
npm run build                                    # dist + Lokal.html
node --test tests/radiasthesie.mjs               # Daten und Ansichten
npx playwright test tests/radiasthesie.spec.js   # Browser
node docs/radiasthesie-konzept/scripts/probe-modul.cjs --shots
```

Rollback: `js/modules/radiasthesie*.js`, `js/data/radiasthesie.js`,
`css/radiasthesie.css`, `assets/radiasthesie/` entfernen, die fünf
Einfügepunkte in `index.html`/`js/main.js` zurücknehmen, die zwei
Kopfzeilen-Regeln und die `sitemap.xml`-Änderung zurücknehmen. Kein
Datenbankzustand, keine Migration.
