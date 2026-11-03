# RAD-12 — Checkpoint: indexierbares HTML, SEO/GEO und strukturierte Daten

**Stand:** 3. November 2026
**Arbeitsbaum:** `C:/Users/mas/Arbeit/esow-rad-t_878c59c7` (Branch `feature/radiasthesie-modul`)
**Basis:** `57bb442` (RAD-11) → **Umsetzung:** `476fcaf`
**Kein Push, kein Deployment.**

## Ergebnis

Der Bereich hat sieben echte, ohne JavaScript vollständig lesbare HTML-Dokumente.
Sie entstehen aus derselben Datendatei (`js/data/radiasthesie.js`) und denselben
Renderfunktionen (`js/modules/radiasthesie-views.js`) wie die Modulansicht. Der
Hash-Router und die Offline-Ausgabe bleiben unverändert; die Ausgabe ist additiv.

| Dokument | Adresse | Titel (Zeichen) |
| --- | --- | --- |
| Übersicht | `radiasthesie/` | Radiästhesie, Pendeln und Orakel — Tradition und Prüfstand (58) |
| Radiästhesie | `radiasthesie/radiasthesie.html` | Radiästhesie — Ruten, Geschichte und Forschungsstand (52) |
| Pendeln | `radiasthesie/pendeln.html` | Pendeln — Arten, Materialien, Tafeln und Bovis-Skalen (53) |
| Orakel | `radiasthesie/orakel.html` | Orakel — Pendelorakel, Tarot, Runen und I Ging im Vergleich (59) |
| Glossar | `radiasthesie/glossar.html` | Glossar — Radiästhesie, Pendeln und Orakel von A bis Z (54) |
| Quellen | `radiasthesie/quellen.html` | Quellen und Belege — Radiästhesie und Pendeln (45) |
| Methodik | `radiasthesie/methodik.html` | Methodik und Grenzen — wie dieser Bereich prüft (47) |

Gemessene Titelbreite (Chromium, 16 px / 20 px Arial): 341–419 px / 428–537 px —
alle unter der 600-px-Näherung. Beschreibungen 102–149 Zeichen.

## Geänderte Dateien

**Neu**

- `scripts/generate-radiasthesie-pages.cjs` — Generator für Dokumente und Sitemap
- `js/modules/radiasthesie-seo.js` — eine Quelle für Dokumentadressen, Canonicals,
  Titelgrenze und BreadcrumbList (von Modul, Generator und Prüfungen gelesen)
- `css/radiasthesie-statisch.css` — Rahmen der Dokumente (Tokens aus design-system)
- `radiasthesie/*.html` — sieben erzeugte Dokumente (versioniert, weil GitHub Pages
  das Wurzelverzeichnis veröffentlicht)
- `tests/radiasthesie-statisch.mjs` — 12 Prüfungen des erzeugten HTML ohne Server
- `tests/radiasthesie-statisch.spec.js` — 9 Browsertests, davon 7 mit deaktiviertem JavaScript

**Geändert**

- `scripts/build-pages.cjs` — erzeugt die Seiten vor dem Kopieren, nimmt `radiasthesie/` auf
- `scripts/build-local.cjs` — übernimmt die Dokumente in die Vorschau (kein Selbstkopieren)
- `scripts/verify-pages.cjs` — neue statische Phase über HTTP inkl. Sitemap
- `js/modules/radiasthesie.js` — Canonical/og:url auf das Dokument, JSON-LD ohne Fragmente
- `js/modules/radiasthesie-views.js` — `TITLES`/`DESCRIPTIONS` exportiert; alten
  `breadcrumbStructuredData` (erzeugte Fragment-URLs) entfernt
- `js/main.js` — Markensuffix-Regel, Canonical-Rücksetzung beim Seitenwechsel
- `sitemap.xml` — elf Dokumente, keine Fragmente
- `package.json` — `test:radiasthesie:statisch`, in `test:all` aufgenommen
- `.prettierignore` — `radiasthesie/` (erzeugt, wie `Lokal*.html`)
- `docs/radiasthesie-konzept/ia-konzept.md` §7 — SEO/GEO-Stand, alte Hash-Grenze ersetzt
- `docs/radiasthesie-konzept/IMPLEMENTIERUNG.md` — Entscheidung A8 ersetzt, Nachtrag §10
- `tests/radiasthesie.mjs` — Breadcrumb-Test auf fragmentfreie Implementierung umgestellt
- `tests/pendeltafel-studio.spec.js` — exakter Titel ohne Markensuffix (60-Zeichen-Regel)
- `Lokal.html` — aus den geänderten Quellen neu erzeugt

## Ausgeführte Prüfungen (echte Läufe)

| Prüfung | Ergebnis |
| --- | --- |
| `npm run lint` | 0 Fehler, 0 Warnungen |
| `npm run format:check` | alle Dateien konform |
| `node --test` (Radiästhesie, Verträge, Simulator, Tafeln, Experiment, Journal, statisch) | **164/164** |
| `npm run test:pages` | **6/6** |
| `npm run test:offline` | **2/2** |
| `npx playwright test` (gesamte Suite, Port 3402) | **147/147** |
| `node scripts/verify-build.cjs` | 36/36 Seitenansichten, **7/7 statische Dokumente**, Sitemap 11/11, 0 Fehler |
| Generator zweimal ausgeführt | byte-identisch (deterministisch) |
| Browser-Evidenz | `evidence/browser/report.json` + 14 Screenshots (1440/390, JS aus): 0 Overflow, 0 Konsolefehler, 0 fehlende Alt-Texte, 0 defekte Bilder |
| Titelbreite | `evidence/seo/titles.json` (341–419 px bei 16 px) |

Hinweis zur Umgebung: Port 3100 war auf diesem Rechner durch einen fremden,
veralteten Server belegt (lieferte eine alte `dist/`). Die Läufe nutzten deshalb
`E2E_PORT=3402`; das ist kein Projektfehler.

## Restpunkte

1. **`og:image` fehlt projektweit** (Befund B7 aus dem QA-Bericht). Die vier
   eigenen SVGs sind als Social-Preview ungeeignet; ein PNG ohne Freigabe zu
   erzeugen wäre eine unbelegte Zusage. Bleibt offen.
2. **`verify:pages` gegen die Produktions-URL** bleibt rot, bis die Seiten
   deployt sind — erwartet, da die Dokumente neu sind.
3. **Kein `Article`-Markup** — bewusst: kein belegtes Veröffentlichungsdatum und
   kein Redaktionskonto. **Kein `FAQPage`** — es gibt keine Frage-Antwort-Seite.
   Begründung in `ENTSCHEIDUNGEN.md`.
4. **Werkzeuge** (Pendellabor, Tafel-Studio, Experimentierlabor, Pendeltagebuch)
   haben keine statischen Dokumente; sie sind interaktive Werkzeuge und werden
   von den Seiten aus verlinkt. Ohne JavaScript bleiben sie erwartungsgemäß
   funktionslos; der Fuß jeder Seite sagt das.
5. **Nur Chromium** getestet (kein Firefox/Safari, kein Screenreader, kein Druck).
6. **Andere Module** (Tarot, Astrologie, Kristalle …) haben weiterhin lange
   Titel mit Markensuffix; RAD-12 ändert nur den Radiästhesie-Bereich.
7. **Fremde Änderungen** an `docs/radiasthesie-completion/RAD-08/09/10/evidence`
   und `evidence/` wurden nicht angefasst und nicht committet.

## Nächster Schritt

- Master: RAD-12 abnehmen; danach Deployment-Entscheidung, damit
  `verify:pages` gegen die Produktions-URL grün werden kann.
- Optional als eigene Karte: `og:image` (Raster-Motiv mit Freigabe) und
  Titel-/Meta-Angleichung der übrigen Module.
