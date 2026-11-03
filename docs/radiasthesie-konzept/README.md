# Radiästhesie, Pendeln und Orakel — UX/UI-Konzept (ESOW-RAD-04)

Stand: 2. November 2026 · Status: **Entwurfsfassung zur Umsetzung freigegeben** (keine Produktivänderung in diesem Paket)
Projekt: Esoterik Welt · Master-Task ESOW-RAD-000 · Karten-ID t_f5d8a1a4

Dieses Paket ist die Vorlage für die Implementierung des Themenmoduls. Es enthält
Wireframes, einen lauffähigen HTML-Mockup mit den echten Projektdesign-Tokens,
eine CSS-Ergänzung, gemessene Layout- und Kontrastwerte und die Prüfchecklisten.
Alles, was hier als Zahl steht, ist am gerenderten Dokument gemessen; die
Messdateien liegen in `messung/`.

## 1. Was in diesem Paket liegt

| Datei / Ordner | Inhalt |
| --- | --- |
| `README.md` | Dieses Dokument: Umfang, Entscheidungen, Prüfstand, Grenzen |
| `ia-konzept.md` | Informationsarchitektur, Navigationsentscheidung, Routen, Router-Integration, Seitenvorlagen |
| `komponenten-specs.md` | 16 Komponenten mit Markup, CSS, Abständen, Zuständen, Breakpoints, Messwerten |
| `a11y-checkliste.md` | WCAG-2.2-AA-Checkliste mit Messwerten und offenen Punkten |
| `responsive-checkliste.md` | Breakpoint-Tabelle mit gemessenen Werten und Überlaufprüfung |
| `asset-liste.md` | Vorhandene SVGs, geplante Fotos samt Lizenzstatus, Alt-Text-Regeln |
| `CHECKPOINT.md` | Arbeitsstand, Entscheidungen, Risiken, nächster Schritt |
| `mockup/index.html` | Lauffähiger Mockup: Landingpage, Themenseite, Glossar (`?view=`) |
| `mockup/rad.css` | Modul-CSS (Endzustand); nutzt ausschließlich bestehende Tokens |
| `wireframes/index.html`, `wireframes/wire.css` | Graustufen-Wireframes (Desktop/Mobil) mit nummerierten Erläuterungen |
| `assets/*.svg` | Vier eigene Instrumententafeln (Pendelgeometrie, Winkelrute, Pendeltafel, Orakel) |
| `messung/` | Mess-JSON, Kontrastwerte, Screenshots (Mockup, Wireframes, Zustände), Messübersicht |
| `scripts/` | Reproduzierbare Mess-, Screenshot- und Audit-Skripte (Node + Playwright aus dem Projekt) |

## 2. So öffnet man die Artefakte

```bash
# Mockup (drei Ansichten, Umschalter unten)
docs/radiasthesie-konzept/mockup/index.html?view=landing
docs/radiasthesie-konzept/mockup/index.html?view=thema
docs/radiasthesie-konzept/mockup/index.html?view=glossar
# mit ?bare=1 ohne Bedienleiste (so entstehen die Screenshots)

# Wireframes
docs/radiasthesie-konzept/wireframes/index.html?view=landing   # thema | glossar

# Exporte
messung/mockup/{landing,thema,glossar}-{1440,1024,900,768,390}.png
messung/wireframes/{landing,thema,glossar}-{1440,390}.png
messung/zustaende/{fokus-nav-1440,karte-hover-1440,menue-offen-390,quellen-offen-1440}.png
```

Die Dateien laufen über `file://`; CSS, Schriften und SVGs liegen lokal im
Projekt, es gibt keine externen Requests (gemessen: 0 pro Ansicht und Breite).

## 3. Entscheidungen in Kürze

1. **Navigationseintrag „Pendeln“**, nicht „Radiästhesie“. Acht Ziele passen nur
   mit dem kürzeren Label in die Kopfzeile; die Messung und die zwei nötigen
   CSS-Regeln stehen in `ia-konzept.md` §3.
2. **Ein Modul mit sieben Routen** (`#pendeln`, drei Themen, Glossar, Quellen,
   Methodik) im bestehenden Hash-Router — dieselbe Bauweise wie der
   Astrologiebereich, keine neuen Seiten, keine zweite Navigation.
3. **Wiederverwendung des Wissensbereich-Baukastens** (`.astro-*`): Brotkrümel,
   Seitenkopf, Inhaltsverzeichnis, Fließtext, Hinweisboxen, Quellenpanel,
   Glossar. Neu sind nur `.rad-*`-Bausteine (Hero, Instrumententafel,
   Einordnungsband, Themenkarten, Evidenztafel, Werkstatt, Einordnungskasten).
4. **Fünf Evidenzstufen A–E** mit Textmarke in jeder Zeile; Farbe ist nie das
   einzige Unterscheidungsmerkmal. Kontraste 6,45:1 bis 8,82:1 auf Kartenfläche.
5. **Einordnung ist Pflicht und nicht schließbar**: Band direkt unter dem Kopf
   auf jeder Modulseite, Kasten am Artikelende, zusätzlich Stufen-Chips im Kopf.
6. **Instrumente als eigene SVG-Tafeln**, keine Stockfotos als Beweis. Fotos
   nur als Materialaufnahme mit vollständiger Lizenzangabe (siehe `asset-liste.md`).
7. **Lesbarkeit vor Dekoration**: 16 px Fließtext, 1,65 Zeilenhöhe, 60 ch
   (gemessen 69 Zeichen je Zeile), mindestens 13 px für jede Schriftgröße,
   keine Schatten, keine Animation außer 120-ms-Farbwechseln.

## 4. Prüfstand (was tatsächlich gemessen wurde)

- **Layout**: elf Breiten (320, 360, 390, 768, 781, 800, 840, 900, 1024, 1280, 1440)
  je Ansicht, frisch geladen, kein horizontaler Überlauf, keine Konsolenfehler,
  keine externen Requests. Werte in `messung/uebersicht.md`.
- **Kontrast**: 22 Farbpaare nach WCAG-Formel gerechnet, alle Textpaare ≥ 4,5:1
  (`messung/kontrast.json`). Fokusring 9,33:1 gegen Hintergrund (3:1 gefordert).
- **Tastatur**: Fokusreihenfolge Skip-Link → Logo → acht Navigationsziele →
  Inhalte; jeder Fokusring 2 px Sand, Offset 4 px (`messung/zustaende/zustaende.json`).
- **Struktur**: je Ansicht genau eine H1, keine Sprünge in der
  Überschriftenordnung, keine doppelten IDs, alle Bilder mit Alt-Text, alle
  Formularfelder mit Label (`messung/struktur-audit.json`).
- **Reflow/Textabstände**: 320 px ohne Überlauf, WCAG-Textabstände ohne Clipping
  (`messung/a11y-zusatz.json`).
- **Zustände**: Hover (Rahmen `#82928e`), Fokus, geöffnetes Mobilmenü
  (Zeilen 342 × 48 px), geöffnetes Quellenpanel — als Screenshots belegt.

Nicht geprüft (ehrlich benannt): kein Screenreader-Test, kein axe-Lauf, kein
Lighthouse-Lauf, keine echten Nutzertests. Diese Punkte stehen in
`a11y-checkliste.md` §6 als offene Posten.

## 5. Was die Implementierung tun muss

1. `mockup/rad.css` als neuen Abschnitt in `css/main.css` übernehmen
   (Reihenfolge: nach dem Astrologie-Block, vor `@media print`).
2. Die zwei Kopfzeilen-Regeln aus `rad.css` (§ „Kopfzeile mit acht
   Navigationszielen“) an die dort genannten Stellen in `css/main.css` und
   `css/design-system.css` setzen.
3. Navigationseintrag und `<section id="pendeln">` in `index.html` ergänzen,
   Router in `js/main.js` um `PENDELN_ROUTE` erweitern, Modul
   `js/modules/radiasthesie.js` nach dem Muster von `astrologie.js` anlegen.
   Konkrete Einfügepunkte: `ia-konzept.md` §4.
4. Inhalte aus den Redaktionsdateien rendern; Quellenmarker `[Sxx]` als Links
   auf `#pendeln/quellen` auszeichnen (`komponenten-specs.md` C12).
5. Prüfungen aus `responsives`/`a11y`-Checkliste vor der Freigabe wiederholen.

## 6. Grenzen dieses Pakets

- Die Texte im Mockup sind **Mustertexte zur Maßprüfung**, keine
  Veröffentlichungstexte. Sie sind im Seitenkopf als solche gekennzeichnet.
- Die geplanten Fotos (Wikimedia-Quellen aus ESOW-RAD-05) sind **nicht**
  eingebunden. Ihre Lizenzprüfung gehört zum Medien-Task; der Mockup nutzt
  ausschließlich eigene SVGs.
- Die Routen sind Hash-Routen einer Einzeldokument-SPA. Suchmaschinen sehen
  eine URL; für einzeln indexierbare Themenseiten wäre ein anderes
  Auslieferungsmodell nötig (siehe `ia-konzept.md` §7 „Grenze der Hash-Routen“).
- Zahlen zu Fließtextlänge und Kartenbreiten gelten für die Manrope/Fraunces-
  Auslieferung des Projekts; bei Schriftwechsel neu messen.

## 7. Nächster Schritt

Inhalte (ESOW-RAD-02/06) und Implementierung (Karte `t_8c0cbe98`) können
parallel starten; die Schnittstelle ist `komponenten-specs.md`. Nach der
Implementierung: Messskripte aus `scripts/` gegen die echte Seite laufen lassen
und die Werte in `messung/uebersicht.md` ersetzen — die Skripte erwarten nur
den Pfad zur Seite.
