# ESOW-RAD-04 · Werkstatt-UX (Delta)

Stand: 2026-11-03 · Karte `t_5877e027` · Arbeitsbaum `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`
Branch `feature/radiasthesie-modul` · Basis `e44fa5c`, Vorgänger-Commit `092add2`
Mockup-Stand: `mockup/index.html`, `werkstatt.css`, `werkstatt.js` (gemessen 2026-11-03T01:55Z, Chrome/155.0.8059.85)

## Was diese Karte liefert

Das bestehende Nachtatelier-Wissensmodul bleibt unverändert. Ergänzt wird die
**Werkstatt**: vier Werkzeuge (Simulator, Tafel-Studio, Test-/Demo-Labor,
Journal) mit Zuständen, Schnittstellen, Wireframes, Messbelegen und den Regeln
für Tastatur, reduzierte Bewegung, Fehler/Leer, Druck/SVG/PDF und Datenschutz.

Geliefert wird **keine Produktionsimplementierung** — der Delta-Auftrag erlaubt
ausdrücklich nur Schreibzugriff auf `docs/radiasthesie-completion/RAD-04/`. Die
Integration in `js/`, `css/` und `index.html` ist als Schnittstellenvertrag
beschrieben und **nicht** ausgeführt (siehe „Restpunkte").

| Teil | Datei | Inhalt |
|---|---|---|
| Übersicht, Abnahme, Grenzen | `README.md` | diese Datei |
| Zustände je Werkzeug | `WERKZEUGE-UND-ZUSTAENDE.md` | Zustandsautomaten, Übergänge, Sperren |
| Schnittstellen | `SCHNITTSTELLEN.md` | DOM-Vertrag, Storage-Keys, JSON-Schemata, Router |
| Wireframes | `WIREFRAMES.md` | ASCII-Layouts 1440/768/375/320, Landing-Karten |
| Tokens und SVGs | `TYPO-TOKENS-UND-SVGS.md` | Tokenbindung, Einsatz der 4 SVGs, Verbote |
| Tastatur, Fokus, Bewegung | `TASTATUR-FOKUS-MOTION.md` | Fokusreihenfolge, Ring, reduced-motion |
| Druck, SVG, PDF | `DRUCK-SVG-PDF.md` | Druckregeln, 3 behobene Defekte, Exportvertrag |
| Datenschutz | `DATENSCHUTZ.md` | lokale Speicherung, kein Netz, Löschen |
| Messung | `MESSUNG.md` | Protokoll, Rohdaten, Screenshots, Grenzen |
| Fokusdiagnose (P4) | `messung/diag/` | Datumsfeld: 3 Runden, Vorher-/Nachher-Bilder, `datum-fokus.json` |
| Checkpoint | `CHECKPOINT.md` | Dateien, SHA-256, Tests, Restpunkte |

Lauffähiger Prototyp: `mockup/index.html` (lädt die echten Projektstylesheets
`css/design-system.css`, `css/main.css`, `css/radiasthesie.css`; Tokens werden
nicht nachgebaut). Zustände werden über die Adresse gewählt, nicht über
Speicherzugriffe — `.../mockup/index.html?tool=journal&state=voll&w=375`.

## Abnahmematrix des Delta-Auftrags

Legende: **belegt** = mit ausgeführtem Test/Messwert hinterlegt · **spezifiziert**
= Vertrag im Dokument, Umsetzung in Produktion offen (außerhalb des Schreibrechts).

| Anforderung (Delta) | Wo | Status | Beleg |
|---|---|---|---|
| Konkrete Zustände für Simulator | `WERKZEUGE-UND-ZUSTAENDE.md` §2 | belegt | 4 Zustände gerendert: `simulator-bereit/laeuft/reduziert/fehler` je 1440 + 375, `bereit` auch 320/768 |
| Konkrete Zustände für Tafel-Studio | §3 | belegt | 5 Zustände: `standard, leer, fehler, violett, pergament` (je 1440/375), `standard` auch 320/768 |
| Konkrete Zustände für Test-/Demo-Labor | §4 | belegt | 7 Zustände: `vorbereitet, verdeckt, antwort, enthuellt, abgeschlossen, leer, demo` (je 1440/375), `verdeckt` auch 320/768 |
| Konkrete Zustände für Journal | §5 | belegt | 6 Zustände: `liste, leer, fehler, voll, bestaetigung, geloescht` (je 1440/375), `liste` auch 320/768 |
| Schnittstellen | `SCHNITTSTELLEN.md` | spezifiziert + im Mockup belegt | `window.RadWerkstatt` (7 Funktionen), Storage-Keys, JSON-Schemata; Exportfunktionen in `funktionen.json` geprüft |
| Wireframes | `WIREFRAMES.md` | belegt | ASCII + gemessene Pixelmaße (Tabelle A in `MESSUNG.md`) |
| 320 px | `MESSUNG.md` §3 | belegt | 4 Werkzeuge × 320 px: `overflowX=0`, Ränder 24 px, min. Schrift 13 px |
| 375 px | §3 | belegt | 16 Grundmesspunkte + 18 Zustands-Screenshots, kein Überlauf |
| 768 px | §3 | belegt | einspaltig, Stage 704 px, Ränder 32 px |
| 1440 px | §3 | belegt | zweispaltig: Stage 820 px / Panel 468 px, Ränder 64 px |
| Tastatur | `TASTATUR-FOKUS-MOTION.md` §2 | belegt | 8 Tab-Protokolle (4 Werkzeuge × 375/1440), je 16 Schritte; **126 von 126** Element-Schritten mit `outline: solid 2px rgb(198,179,142)` (vor der P4-Korrektur 124) |
| reduced-motion | §4 | belegt | `runningReduced.animationName = none`, `runningNormal.animationName = radSwing 2.6s` |
| Fokus im Datumsfeld (P4) | `TASTATUR-FOKUS-MOTION.md` §6 | belegt + behoben | Schritt 13 (Kalenderknopf) vorher nur UA-Kasten, Host-`outline: none`; nach `.rad-ws-input:focus-within` Ring `2px` / `offset 4px`; 3 Runden, Vorher-/Nachher-Bilder in `messung/diag/` |
| Fehlerzustände | `WERKZEUGE-UND-ZUSTAENDE.md` | belegt | Studio-Eingabefehler, Simulator-Grenzwert, Journal-Pflichtfelder, Journal-Speicher voll |
| Leerzustände | ebd. | belegt | Studio ohne Tafel, Labor ohne Lauf, Journal ohne Eintrag, Journal nach Löschung |
| Druck | `DRUCK-SVG-PDF.md` §2 | belegt | 4 Druck-Screenshots (`messung/screens/druck-*.png`), Bedienpanels ausgeblendet, Tafel 21:1 |
| SVG | §3 | belegt | Export deterministisch, 1097 Byte, `xmlns`+`title`+`desc`, 0 externe Referenzen, kein `<script>`, Text escaped |
| PDF | §4 | belegt | ausschließlich Browser-Druckdialog; `@page { margin: 14mm }`, kein PDF-Paket im Projekt |
| Datenschutz | `DATENSCHUTZ.md` | belegt | 0 externe Anfragen, 0 fehlgeschlagene Anfragen, 0 Konsolenfehler über 52 Messpunkte; Keys `esot_rad_*_v1` |
| Bestehende Tokens | `TYPO-TOKENS-UND-SVGS.md` §1 | belegt | Mockup lädt die drei echten CSS-Dateien; 35 verschiedene `var(--…)`-Tokens in `werkstatt.css`, keine Rohfarben außer Haarlinien und Papierwerten im `@media print`-Block |
| 4 eigene SVGs | §2 | spezifiziert | Zuordnung der 4 Instrumente zu Werkzeugen und Themenkarten; die Simulator-Zeichnung ist eine neue schematische SVG im gleichen Strichvokabular |
| Kein Redesign des Wissensmoduls | `SCHNITTSTELLEN.md` §6 | spezifiziert | Nur additive Einbaupunkte (Route, Landing-Kachel, `#radWerkstatt`-Container); keine Änderung an `.astro-*`/`.rad-*` |
| Keine behauptete WCAG-Zertifizierung | `MESSUNG.md` §6 | belegt | Messwerte statt Zertifikat: 124 gemessene Paare über 22 Werkzeug-/Zustandskombinationen (11 verschiedene Paare), Fokusreihenfolge, Zielgrößen; kein Screenreader-Test, kein Safari/Firefox |

## Vier Befunde, die bei der Prüfung auffielen und behoben wurden

P1–P3 betrafen den Druck — den Bereich, den der Vorgängerstand nur behauptet,
nicht gemessen hatte; Vorher-Bilder in `messung/vorher/`. P4 kam in diesem Lauf
dazu (Fokus im Datumsfeld, Vorher-/Nachher-Bilder in `messung/diag/`).

| Nr. | Befund | Vorher | Nachher |
|---|---|---|---|
| P1 | Tafel druckte schwarz mit dunkler Tusche | Fläche `#000`, Tusche `#0b1012` → **1,10:1** (rechnerisch aus den CSS-Werten; Beleg `messung/vorher/druck-studio-1440.png`) | Fläche `#fff`, Tusche `#000` → **21,00:1** (gemessen) |
| P2 | Bühne des Test-Labors druckte als schwarzer Kasten | `#0b1012` mit Text `#111` → **1,01:1** | weiß mit `#000` → **21,00:1** (gemessen) |
| P3 | Journal druckte nur Datum und Frage | `<details>` geschlossen → 0 von 3 Körpern sichtbar | 3 von 3 Körpern sichtbar (Methode, Vorhersage, Sicherheit, Ergebnis, Experimentbezug) |
| P4 | Datumsfeld: vierter Tab-Stopp (Kalenderknopf) hatte keinen Sand-Ring | Host-`outline: none` (gemessen, 3 Runden), sichtbar nur der UA-Kasten am Symbol (`messung/diag/vorher/datum-schritt13-ohne-sandring.png`) | `.rad-ws-input:focus-within` → `outline: solid 2px rgb(198,179,142) / offset 4px` (`messung/diag/datum-fix-schritt13.png`) |

Ursache P1/P2: der Druckblock setzt `--color-text-primary: #000`; der
Pergament-Stil leitet `--plate-face` daraus ab, die Bühne behielt
`--color-bg-deep`. Ursache P3: `display: grid` am Kind genügt nicht, weil der
Browser den Inhalt über den Details-Slot ausblendet (`::details-content`).
Ursache P4: `:focus-visible` greift am Host nicht, wenn der Fokus im
Shadow-Tree des Datumsfelds liegt — `:focus-within` deckt diesen Fall ab.

## Reproduktion

```bash
cd C:/Users/mas/Arbeit/esow-rad-t_878c59c7
export TMP="C:/Users/mas/AppData/Local/hermes/cache/scratch"
export TEMP="$TMP" TMPDIR="$TMP"
node docs/radiasthesie-completion/RAD-04/scripts/measure-werkstatt.cjs
# EXIT=0, 52 Messpunkte, 52 PNG, "Überlauf > 0: keiner",
# "Konsolenfehler: 0 · externe Anfragen: 0 · fehlgeschlagene Anfragen: 0"
node docs/radiasthesie-completion/RAD-04/scripts/diag-datum-fokus.cjs
# EXIT=0, 3 Runden, Schritt 13 mit "solid 2px rgb(198, 179, 142) / offset 4px"
```

Das Skript spricht Chrome DevTools Protocol direkt an (kein Playwright-Zwang),
setzt die Metriken **vor** jeder Navigation und navigiert je Breite mit
Cache-Buster neu — die Auflösung media-query-abhängiger Custom Properties ist
damit frisch (Skill-Pitfall „Viewport-Messungen").

## Grenzen dieser Lieferung

1. **Keine Produktionsumsetzung.** Route, Landing-Kachel, Container und CSS der
   Werkstatt sind Vertrag, nicht Code. Kein Test der Produktionsseiten.
2. **Nur Chromium.** Kein Safari-, Firefox- oder echte Screenreader-Prüfung.
   `::details-content` (P3) ist in Chrome 155 vorhanden; ältere Browser brauchen
   den `beforeprint`-Weg, der im Mockup ebenfalls eingebaut ist.
3. **Kein echter Druckertreiber.** Druck wurde über
   `Emulation.setEmulatedMedia: print` geprüft, nicht über einen physischen
   Drucker oder eine PDF-Ausgabe.
4. **Zahlen sind Messwerte, keine Zertifizierung.** Die Kontrastwerte gelten für
   die gemessenen Paare in den gemessenen Zuständen.
5. **Landing-Raster mit vier Karten ist nicht gemessen** — die Produktionsseite
   zeigt heute drei Karten (`js/data/radiasthesie.js`, `workshop`), das Raster
   steht auf `repeat(3, …)`. Die vierte Karte ist spezifiziert, ihre Breiten
   müssen nach dem Einbau nachgemessen werden.

## Nächster Schritt

`CHECKPOINT.md` §5: Einbau in Produktion (Route + Container + Landing-Kachel +
CSS-Übernahme), danach dieselbe Messung gegen die Produktionsseite fahren und
die Werte aus `MESSUNG.md` gegenprüfen.
