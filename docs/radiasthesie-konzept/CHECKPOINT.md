# CHECKPOINT — UX/UI-Konzept Themenmodul (Karte t_f5d8a1a4, ESOW-RAD-04)

Stand: 2. November 2026, 22:20 CET · Status: **Designphase abgeschlossen, Übergabe bereit**
Nächste Karte: `t_8c0cbe98` (technische Implementierung, Profil `coding_agent`)

## 1. Fertig und geprüft

| Artefakt | Umfang | Prüfnachweis |
| --- | --- | --- |
| `ia-konzept.md` | 365 Zeilen | Navigationsmessung über 19 Breiten, Router-Einfügepunkte gegen `js/main.js` geprüft |
| `komponenten-specs.md` | 613 Zeilen | jede Maßangabe aus `messung/mockup-messung.json` |
| `a11y-checkliste.md` | 161 Zeilen | Kontrast-, Struktur-, Tastatur-, Reflow-, Textabstands-Messung |
| `responsive-checkliste.md` | 102 Zeilen | 11 Breiten × 3 Ansichten, 0 Überläufe |
| `asset-liste.md` | 130 Zeilen | 4 eigene SVGs dokumentiert, 6 Fotos als „offen“ markiert |
| `mockup/index.html` + `rad.css` | 897 + 964 Zeilen | 15 Screenshots, 0 Konsolenfehler, 0 externe Requests |
| `wireframes/index.html` + `wire.css` | 430 + 426 Zeilen | 6 Wireframe-Exporte (1440/390 je Ansicht), 0 Überläufe |
| `messung/` | 2,4 MB | Mess-JSON, Kontrast, Audit, 15 Mockup-, 6 Wireframe-, 4 Zustands-Screenshots |

**Verifiziert (nicht behauptet):**

- Layout bei 1440, 1280, 1024, 900, 840, 800, 781, 768, 390, 360 px je Ansicht,
  je Breite frisch geladen → `overflowX = 0`, `consoleErrors = 0`,
  `externalRequests = 0`.
- Kontrast: 22 Paare gerechnet, alle Textpaare ≥ 6,45:1, Fokusring 9,33:1.
- Tastatur: Reihenfolge und Fokusring (2 px Sand, Offset 4 px) bei 1440 und 390
  protokolliert; Mobilmenü per Tastatur bedienbar (`aria-expanded` wechselt).
- Struktur: 1 H1 je Ansicht, 0 Überschriften-Sprünge, 0 doppelte IDs, 0 Bilder
  ohne Alt, 0 Formularfelder ohne Label.
- Reflow 320 px: 0 Überlauf; Textabstände nach 1.4.12: 0 Überläufe, 0 Clipping.
- Druck: Einordnungsband sichtbar, Inhaltsverzeichnis ausgeblendet; reduzierte
  Bewegung: Übergänge 0,00001 s.

## 2. Entscheidungen (mit Begründung)

| Nr. | Entscheidung | Begründung |
| --- | --- | --- |
| D1 | Navigationslabel **„Pendeln“**, Position nach „Runen“ | Acht Ziele passen nur mit kurzem Label; „Radiästhesie“ (12 Zeichen) sprengt 781 px. „Pendeln“ ist die bekanntere Praxis. |
| D2 | **Sieben Routen** im bestehenden Hash-Router, Kapitel als Anker | Keine dünnen Einzelseiten, keine zweite Navigation; Muster des Astrologiebereichs. |
| D3 | **Wiederverwendung** der `.astro-*`-Primitives, nur `.rad-*` neu | Kein Refactoring, eine visuelle Sprache, ~600 Zeilen Duplikat vermieden. |
| D4 | **Fünf Evidenzstufen A–E** als Textmarke | Auftrag verlangt Trennung von Tradition/Befund; Farbe allein wäre nicht barrierefrei. |
| D5 | **Einordnung nicht schließbar** (Band + Kasten + Chips) | Auftrag §4 verlangt explizites Einordnungselement; schließbar würde es weggeklickt. |
| D6 | **Instrumente als eigene SVGs**, Fotos nur mit Lizenz | Keine Scheinbeweise, keine ungeklärten Rechte, sofort lauffähig. |
| D7 | **60 ch Fließtext** statt 72 ch | Gemessen: 72 ch ergeben 86 Zeichen/Zeile — zu lang. 60 ch ergeben 69. |
| D8 | **Keine neuen Farben** außer zwei vorhandenen Funktionsfarben (`#c0a889`, `#9db3c4`) | Palette bleibt Nachtatelier; beide sind bereits im Astrologie-Modul im Einsatz. |
| D9 | **Zwei Regeln in gemeinsamen Dateien** (Kopfzeile, Mobilmenü) | Ohne sie läuft die Kopfzeile bei 781 px um 21 px über bzw. das Mobilmenü bleibt zentriert. |
| D10 | **Seitenleiste im DOM vor dem Text** | Lesereihenfolge = visuelle Reihenfolge (WCAG 1.3.2), ohne doppeltes Inhaltsverzeichnis. |

## 3. Befunde am Bestand (nicht durch das Modul verursacht)

1. **Kopfzeile bei 320 px:** Produktivseite läuft um **19 px** über (`scrollWidth
   339` bei `clientWidth 320`, Favoritenzähler sichtbar) — `probe-live-header.cjs`.
   Empfohlene, optionale Korrektur in `rad.css` (`≤ 360 px`: Logo 22 px,
   Abstand 8 px) beseitigt den Überlauf; sie ist als global markiert, weil sie
   alle Seiten betrifft.
2. **Zeilenlänge:** Die bestehende Regel „72 ch“ in `.astro-text` ergibt 86
   Zeichen je Zeile. Das Modul korrigiert das `.rad`-skopiert auf 60 ch; der
   Astrologiebereich bleibt unverändert (nicht Teil dieses Auftrags).
3. **Mobilmenü:** `.nav-list` erbt `align-items: center`, wodurch Ziele im
   gestapelten Menü auf Textbreite schrumpfen. Korrektur als Patch dokumentiert.

## 4. Während der Arbeit behobene eigene Fehler

| Fehler | Wirkung | Behebung |
| --- | --- | --- |
| Doppeltes Inhaltsverzeichnis (einmal im Text, einmal in der Leiste) | Verwirrung, zwei „Auf dieser Seite“ | Inline-TOC entfernt; nur die Leiste bleibt |
| Ungleiche Kartenhöhen bei 1024 px (579/579/601) | unruhige Unterkanten | `.rad-topic { height: 100% }` |
| Instrumententafel blieb auf 520 px Naturalgröße | leere Fläche im Rahmen | `.rad-plate img { width: 100%; height: auto }` |
| Dritte Karte allein in zweiter Reihe (701–900 px) | Rasterloch | Umbau auf Listenkarten mit Bild links |
| Einordnungs-Chip lief mobil über die volle Breite | wirkte wie ein Balken | `justify-self: start` |
| Suchfeld 1100 px breit | unruhige Zeile | `max-width: 560px` |

## 5. Offene Punkte und Risiken

| Risiko | Auswirkung | Umgang |
| --- | --- | --- |
| Hash-Routen sind nicht einzeln indexierbar | SEO für Themenseiten begrenzt | in `ia-konzept.md` §7 offen benannt; Entscheidung über statische Seiten vor Content-Produktion |
| Screenreader-/axe-Prüfung fehlt | A11y-Nachweis unvollständig | als offener Posten in `a11y-checkliste.md` §7; nach Implementierung nachholen |
| Fotos noch nicht lizenzgeprüft | keine Bildwirkung im Modul | SVGs tragen den Entwurf; Fotos als „offen“ markiert |
| Mockuptexte sind Muster | dürfen nicht veröffentlicht werden | im Seitenkopf als „Mustertext zur Maßprüfung“ gekennzeichnet |
| Textzoom (nur Schrift) skaliert nicht | 1.4.4 teilweise | Systementscheidung (px-Typografie), nicht im Modul lösbar |
| Redaktion entscheidet über Kapitelausgliederung | Routen können wachsen | Regel in `ia-konzept.md` §6 (ab 1.500 Wörtern eigene Route) |

## 6. Nächster Schritt

1. **Implementierung** (`t_8c0cbe98`): `rad.css` übernehmen, zwei Kopfzeilen-Regeln
   setzen, Router erweitern, Modul `js/modules/radiasthesie.js` nach
   `astrologie.js`-Muster anlegen. Reihenfolge und Einfügepunkte:
   `ia-konzept.md` §4.
2. **Inhalte** (Writer-Karte): Kapitelinventar `ia-konzept.md` §6, Stufen und
   Quellenformat `komponenten-specs.md` C6/C7/C12.
3. **Nach der Implementierung:** Messskripte gegen die echte Seite laufen lassen
   und `messung/uebersicht.md` ersetzen; Screenreader- und axe-Lauf nachholen.

## 7. Wiederaufnahme

```bash
cd ~/Arbeit/Esoterik-Welt
node docs/radiasthesie-konzept/scripts/capture.cjs all all      # Messung + Screenshots
node docs/radiasthesie-konzept/scripts/report.cjs              # messung/uebersicht.md
node docs/radiasthesie-konzept/scripts/audit-structure.cjs
node docs/radiasthesie-konzept/scripts/audit-a11y-extra.cjs
node docs/radiasthesie-konzept/scripts/contrast.cjs
```

Alle Skripte brauchen nur `node` und das im Projekt installierte Playwright
(`node_modules/playwright`, Chromium vorhanden). Sie schreiben ausschließlich
nach `docs/radiasthesie-konzept/messung/`.

## 8. Umfang dieses Laufs (nicht überschritten)

Geändert wurde ausschließlich `docs/radiasthesie-konzept/`. Keine Änderung an
`index.html`, `css/`, `js/`, `scripts/` des Projekts, keine Commits, kein Push,
kein Deployment.
