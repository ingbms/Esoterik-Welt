# Responsive-Checkliste — Themenmodul „Radiästhesie, Pendeln und Orakel“

Stand: 2. November 2026 · Messgrundlage: `mockup/index.html` bei 1440, 1280, 1024,
900, 840, 800, 781, 768, 390, 360 und 320 px, je Breite **neu geladen**
(Cache-Buster), damit media-query-abhängige Custom Properties frisch aufgelöst
werden. Rohdaten: `messung/mockup-messung.json`, Tabelle: `messung/uebersicht.md`.

## 1. Breakpoints und was sie ändern

| Grenze | Gilt ab / bis | Änderung im Modul | Gemessen |
| --- | --- | --- | --- |
| ≥ 1201 px | Desktop | Artikellayout zweispaltig (Text + 280 px Seitenleiste), Leiste `sticky`, Gutter 64 px | 1440: Text 63–69 Zeichen/Zeile, Karten 421 px |
| 1101–1200 px | kleiner Desktop | Seitenleiste steht über dem Text, Kasten „Auf einen Blick“ entfällt, Gutter 64 px | 1280: H1 53,76 px, Karten 368 px |
| 901–1100 px | Tablet quer | Gutter 32 px, Navigationsabstand 8 px, Karten bleiben dreispaltig | 1024: Karten 304 px, H1 43,0 px |
| 781–900 px | Tablet hoch | Hero einspaltig, Themenkarten als Liste (Bild links 5fr / Text 7fr), Kopfzeile kompakt (Logo 24 px, Listenabstand 4 px) | 900: Karten 836 px; 781: Karten 717 px, Nav-Reserve 46,3 px |
| 701–780 px | kleines Tablet | Mobile Menü (Umschaltknopf), Kartenliste bleibt | 768: Karten 704 px, Menüzeilen 48 px |
| ≤ 700 px | Smartphone | Gutter 24 px, H1 34 px (Landing) / 30 px (Artikel), Einordnungsband einspaltig, Stufenlegende einspaltig, Werkstatt einspaltig | 390: Karten 342 px, Statusband 236 px hoch |
| ≤ 480 px | kleines Smartphone | Innenabstände 16 px, Evidenztafel dreizeilig gestapelt, Suchfeld und Button je 100 % | 390/360: keine Überläufe |
| ≤ 360 px | sehr schmal | Logo 22 px, Kopfzeilenabstand 8 px (Regel aus `rad.css`, empfohlen) | 320: 0 px Überlauf (mit Regel), ohne Regel 2 px |

Zusätzlich gilt unabhängig von der Breite: `prefers-reduced-motion` schaltet
Übergänge ab; `@media print` blendet Bedienoberflächen aus (siehe
`komponenten-specs.md` C18).

## 2. Messwerte je Ansicht und Breite

Auszug aus `messung/uebersicht.md` (vollständige Tabelle dort). „Überläufe“ =
Dokumentbreite minus Viewportbreite; „Reserve“ = freier Platz in der Kopfzeile
bei acht Zielen plus Favoritenzähler.

| Ansicht | Breite | H1 | Gutter | Spalten | Kartenbreiten | Reserve | Überläufe |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| Landing | 1440 | 56 px | 64 px | 3 | 421 / 421 / 421 | 421,8 | 0 |
| Landing | 1280 | 53,76 px | 64 px | 3 | 368 / 368 / 368 | 261,8 | 0 |
| Landing | 1024 | 43,0 px | 32 px | 3 | 304 / 304 / 304 | 239,8 | 0 |
| Landing | 900 | 37,8 px | 32 px | 1 (Liste) | 836 / 836 / 836 | 115,8 | 0 |
| Landing | 840 | 35,3 px | 32 px | 1 (Liste) | 776 / 776 / 776 | 105,3 | 0 |
| Landing | 800 | 34 px | 32 px | 1 (Liste) | 736 / 736 / 736 | 65,3 | 0 |
| Landing | 781 | 34 px | 32 px | 1 (Liste) | 717 / 717 / 717 | 46,3 | 0 |
| Landing | 390 | 34 px | 24 px | 1 | 342 / 342 / 342 | 120,3 | 0 |
| Thema | 1440 | 56 px | 64 px | 1 + Leiste | Text 63 Zeichen/Zeile, 69 im Fließtext | 421,8 | 0 |
| Thema | 1024 | 51,2 px | 32 px | 1 + Leiste oben | Leiste 960 px breit | 239,8 | 0 |
| Thema | 768 | 38,4 px | 32 px | 1 | – | 482,3 | 0 |
| Thema | 390 | 30 px | 24 px | 1 | – | 120,3 | 0 |
| Glossar | 1440 | 56 px | 64 px | 1 | Definitionen 75 Zeichen/Zeile | 421,8 | 0 |
| Glossar | 390 | 30 px | 24 px | 1 | – | 120,3 | 0 |

Zusätzlich geprüft: **320 px** (entspricht 400 % Zoom) — 0 px Überlauf in allen
drei Ansichten nach der Kopfzeilen-Regel (`messung/a11y-zusatz.json`).

## 3. Regeln, die bei jeder Änderung gelten

1. **Kein horizontaler Scroll** bei 320, 360, 390, 768, 1024, 1440 px.
   Prüfbefehl: `node docs/radiasthesie-konzept/scripts/capture.cjs all 320,360,390,768,1024,1440`
   → Spalte `overflowX` muss überall 0 sein.
2. **Keine festen Breiten** außer dem Satzspiegel (1360 px) und der Seitenleiste
   (240–280 px). Karten und Bilder nutzen `fr`, `minmax()` und `aspect-ratio`.
3. **Bilder skalieren, ohne zu verzerren:** `width: 100%; height: auto` bzw.
   `object-fit: contain` mit `aspect-ratio` am Rahmen.
4. **Zeilenlänge:** Fließtext 60 ch (69 Zeichen bei 16 px), Definitionen 14 px
   (75 Zeichen). Bei Schriftwechsel neu messen (`text.prose.charsPerLine`).
5. **Trefferflächen:** Navigation und Buttons ≥ 48 px, Links in Listen ≥ 44 px,
   Buchstaben 44 × 44 px. Inline-Links im Satz sind von 2.5.8 ausgenommen.
6. **Fokusreihenfolge bleibt bei jeder Breite gleich** (Seitenleiste im DOM vor
   dem Text, auf Desktop per `grid-area` nach rechts).
7. **Text bricht um, statt zu überlaufen:** `overflow-wrap: anywhere` für URLs
   und lange Kennungen (Quellen, DOI), `hyphens: auto` nur in Überschriften.

## 4. Befunde und Korrekturen in diesem Lauf

| Befund | Wirkung | Behebung |
| --- | --- | --- |
| Drei Karten in zwei Spalten ließen die dritte Karte allein | unruhiges Raster bei 768–900 px | 701–900 px: Liste mit Bild links und Text rechts (gemessen 836/704 px Kartenbreite) |
| Kartenhöhen unterschieden sich bei 1024 px (579/579/601) | ungleiche Unterkanten | `.rad-topic { height: 100% }`; gemessen jetzt 601/601/601 |
| Instrumententafel war auf 520 px Naturalgröße begrenzt | leere Fläche im Rahmen | `.rad-plate img { width: 100%; height: auto }`; gemessen 540 × 416 (Hero) und 638 × 491 (Artikel) |
| Kopfzeile mit acht Zielen lief bei 781 px um 21 px über, sobald der Favoritenzähler sichtbar war | Überlappung Logo/Zähler | Regel `781–900 px`: Logo 24 px, Listenabstand 4 px → Reserve 31,8–46,3 px |
| Gestapeltes Mobilmenü zeigte zentrierte, schmale Ziele | schlechte Lesbarkeit, kleine Trefferfläche | `align-items: stretch` → Zeilen 342 × 48 px, linksbündig |
| Kopfzeile bei 320 px: 2 px Überlauf im Modul, **19 px auf der Produktivseite** (vor dem Modul) | horizontaler Scroll bei 400 % Zoom | empfohlene Regel `≤ 360 px` (Logo 22 px, Abstand 8 px) → 0 px |
| Fließtext bei 72 ch ergab 86 Zeichen/Zeile | zu lange Zeilen | modulweite Begrenzung auf 60 ch → 69 Zeichen |

## 5. Prüfablauf vor der Freigabe

```bash
# 1. Messung + Screenshots (frische Dokumente je Breite)
node docs/radiasthesie-konzept/scripts/capture.cjs all all

# 2. Reflow, Textabstände, Zielgrößen, Fokus
node docs/radiasthesie-konzept/scripts/audit-a11y-extra.cjs

# 3. Struktur (H1, IDs, Alt, Labels)
node docs/radiasthesie-konzept/scripts/audit-structure.cjs

# 4. Übersicht erzeugen und mit dieser Tabelle vergleichen
node docs/radiasthesie-konzept/scripts/report.cjs

# 5. Kopfzeile mit acht Zielen erneut prüfen (nach Nav-Änderungen)
node docs/radiasthesie-konzept/scripts/measure-nav.cjs && node docs/radiasthesie-konzept/scripts/report-nav.cjs

# 6. Smoke-Test: Ansichten umschalten, Seitentitel, keine Page-Errors
node docs/radiasthesie-konzept/scripts/smoke.cjs
```

Die Skripte schreiben nach `messung/`; Screenshots nach `messung/mockup/`.
Abweichungen von mehr als ±16 px bei Kartenbreiten sind zulässig (Scrollbarbreite
15 px auf Windows), Abweichungen bei Überläufen nicht.
