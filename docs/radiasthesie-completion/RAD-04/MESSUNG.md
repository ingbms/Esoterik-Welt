# Messung

Rohdaten: `messung/werkstatt-messung.json` (52 Messpunkte, 36 Zustandsbilder),
`messung/kontrast.json` (Kontrastpaare), `messung/funktionen.json` (Export- und
Rechenprüfungen), `messung/diag/` (Fokusdiagnose Datumsfeld). Skript:
`scripts/measure-werkstatt.cjs`, Hilfsskripte `scripts/diag-*.cjs`.

**Lauf dieses Stands:** `2026-11-03T01:55Z` (eigener Lauf nach der P4-Korrektur,
`meta.generatedAt` im JSON). Vorgängerläufe und ihre Werte sind nicht
übernommen, sondern neu erhoben.

Umgebung: Chrome 155.0.8059.85, Node v24.13.0, Windows 11, Ziel
`file:///…/docs/radiasthesie-completion/RAD-04/mockup/index.html`;
`TMP/TEMP/TMPDIR` = `C:/Users/mas/AppData/Local/hermes/cache/scratch`.

## 1 · Protokoll

1. Chrome mit `--remote-debugging-port=9337` starten, Ziel über
   `/json/version` abwarten, WebSocket-Sitzung aufbauen (kein Playwright: das
   Skript nutzt die in Node eingebaute `WebSocket`-Klasse).
2. **Vor** jeder Navigation: `Emulation.setDeviceMetricsOverride` mit der
   Zielbreite (Höhe 900) und `Emulation.setEmulatedMedia` zurücksetzen.
3. Navigation mit Cache-Buster (`&cb=<timestamp>`) — media-query-abhängige
   Custom Properties lösen damit frisch auf (Skill-Pitfall).
4. Messung im gerenderten Dokument: Dokumenthöhe/-breite, Rand (`padding-left`
   der Shell), H1-Größe, Panel, Stage, Instrument, Messwertraster,
   Navigationsreserve, kleinste Schriftgröße, Ziele < 44 px, Überlauf,
   Kontrastpaare, Struktur (H1-Anzahl, Überschriften-Sprünge, Bilder ohne `alt`,
   Live-Regionen, unbeschriftete Felder).
5. Überlauf wird **nicht** über `scrollWidth == clientWidth` am Flex-Container
   geprüft, sondern über `scrollWidth − clientWidth` am Dokument **und** die
   rechte Kante jedes sichtbaren Kindes.
6. Tastatur: 16 × `Tab` ab `body`, je Schritt `activeElement` mit Größe, Kontur,
   Sichtbarkeit (Punktprobe mit `elementFromPoint`).
7. `prefers-reduced-motion: reduce` setzen, `animationName/Duration/transform`
   lesen; Vergleichslauf ohne `reduce`.
8. Druck: `Emulation.setEmulatedMedia('print')`, je Werkzeug Sichtbarkeit der
   Teile, Tafelfarben, Journal-Körper, Bühnenkontrast; danach Screenshot des
   kompletten Dokuments (Viewport = Dokumenthöhe, **ohne** `clip`).
9. Netzwerk: `Network.requestWillBeSent` mitschneiden, alles außer
   `file:`/`data:`/`blob:` als externe Anfrage werten; `Runtime.consoleAPICalled`
   und `Network.loadingFailed` mitzählen.
10. Ergebnis schreiben, Exitcode 0 nur wenn der Lauf durchläuft.

## 2 · Grundzustand je Werkzeug × Breite (Tabelle A)

| Werkzeug | px | docH | Rand | H1 | Panel w×h | Stage w×h | Instrument | Messwerte | Nav (Reihen/Reserve) | min. Schrift | Ziele < 44 px | Überlauf |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Simulator | 320 | 2838 | 24 | 30 | 272×871 | 272×391 | 238×179 | 1 Spalte | 2 / – | 13 | 0 | 0 |
| Simulator | 375 | 2601 | 24 | 30 | 327×871 | 327×391 | 293×220 | 2 Spalten | 2 / – | 13 | 0 | 0 |
| Simulator | 768 | 2308 | 32 | 30,72 | 704×693 | 704×436 | 662×320 | 4 Spalten | 2 / – | 13 | 0 | 0 |
| Simulator | 1440 | 1652 | 64 | 44 | 468×701 | 820×533 | 778×437 | 4 Spalten | 1 / 0 | 13 | 0 | 0 |
| Studio | 320 | 2999 | 24 | 30 | 272×1461 | 272×388 | 238×238 | – | 2 / – | 13 | 0 | 0 |
| Studio | 375 | 2802 | 24 | 30 | 327×1403 | 327×401 | 293×293 | – | 2 / – | 13 | 0 | 0 |
| Studio | 768 | 2329 | 32 | 30,72 | 704×985 | 704×516 | 420×420 | – | 2 / – | 13 | 0 | 0 |
| Studio | 1440 | 1836 | 64 | 44 | 468×1096 | 820×736 | 640×640 | – | 1 / 0 | 13 | 0 | 0 |
| Labor | 320 | 2600 | 24 | 30 | 272×686 | 272×372 | 238×180 | – | 2 / – | 13 | 0 | 0 |
| Labor | 375 | 2319 | 24 | 30 | 327×665 | 327×330 | 293×180 | – | 2 / – | 13 | 0 | 0 |
| Labor | 768 | 1880 | 32 | 30,72 | 704×490 | 704×316 | 560×220 | – | 2 / – | 13 | 0 | 0 |
| Labor | 1440 | 1301 | 64 | 44 | 468×540 | 820×316 | 560×220 | – | 1 / 0 | 13 | 0 | 0 |
| Journal | 320 | 2995 | 24 | 30 | 272×1406 | – | – | – | 2 / – | 13 | 0 | 0 |
| Journal | 375 | 2769 | 24 | 30 | 327×1384 | – | – | – | 2 / – | 13 | 0 | 0 |
| Journal | 768 | 2273 | 32 | 30,72 | 704×1109 | – | – | – | 2 / – | 13 | 0 | 0 |
| Journal | 1440 | 1910 | 64 | 44 | 468×1199 | – | – | – | 1 / 0 | 13 | 0 | 0 |

Lesart: „Panel“ ist der Bedienblock (rechts ab 1440 px, unter der Stage darunter),
„Stage“ die Bühne (Instrument/Diagramm bzw. Tafel). Ab 1440 px zweispaltig
(Stage 820 + 24 px Abstand + Panel 468 = 1312 = 1440 − 2 × 64).
Bei 768 px einspaltig 704 px, bei 375 px 327 px, bei 320 px 272 px — jeweils
exakt Breite minus zweimal `--gutter` (32 / 24 / 24).

**Überlauf: 0** an allen 16 Grundpunkten und an allen 36 Zustandsbildern.
**Rand: 24 / 24 / 32 / 64 px** — deckungsgleich mit den `--gutter`-Stufen.

**Korrektur in diesem Lauf:** die vier Journal-Zeilen lauteten vorher
`2743/2517/2021/1659` (docH) und `272×1154`, `327×1132`, `704×858`, `468×948`
(Panel). Diese Werte stammten aus einem älteren Mockup-Stand ohne die Felder
Ergebnis, Bewertung, Sicherheit und Export. Neu gemessen (siehe JSON) und hier
ersetzt; die Differenz ist in `messung/diag/journal-panel.json` zusätzlich
aufgeschlüsselt (Summe der Kinder + Innenabstand + Zeilenabstände).

## 3 · Zustandsbilder

36 Bilder (Werkzeug × Zustand × {375, 1440}), zusätzlich 320/768 für je einen
Grundzustand, plus 4 Druckbilder = **56 PNG**.

| Werkzeug | Zustände | Breiten |
|---|---|---|
| Simulator | bereit, laeuft, reduziert, fehler | bereit 320/375/768/1440, übrige 375/1440 |
| Studio | standard, leer, fehler, violett, pergament | standard 320/375/768/1440, übrige 375/1440 |
| Labor | vorbereitet, verdeckt, antwort, enthuellt, abgeschlossen, leer, demo | verdeckt 320/375/768/1440, übrige 375/1440 |
| Journal | liste, leer, fehler, voll, bestaetigung, geloescht | liste 320/375/768/1440, übrige 375/1440 |

Alle 36 Zustandsbilder: `overflowX = 0`.

## 4 · Navigation

| Breite | Reihen | Kachelbreite | Kachelhöhe | Reserve in der Reihe |
|---|---|---|---|---|
| 320 | 2 | 136 | 56 | – |
| 375 | 2 | 164 | 56 (63 bei zweizeiligem Label) | – |
| 768 | 2 | 352 | 56 | – |
| 1440 | 1 | 328 | 56 | **0** (Summe 1312 = Innenbreite) |

Reserve wird aus Kindbreiten + Abständen gegen die Innenbreite gerechnet, nicht
aus `scrollWidth == clientWidth` (Skill-Pitfall). Bei 1440 px ist die Reserve
exakt 0 — die vier Kacheln füllen die Zeile ohne Überlauf.

## 5 · Kontrast (Bildschirm, 1440 px, gerendert)

| Paar | Vordergrund auf Hintergrund | Verhältnis |
|---|---|---|
| Fließtext (Lead) auf Seitenhintergrund | `#babdb7` auf `#0b1012` | **10,07** |
| Hinweistext 13 px auf Karte | `#babdb7` auf `#141c1f` | **9,09** |
| Sand-Akzent (Wert/Label) | `#c6b38e` auf `#0b1012` | **9,33** |
| Messwert groß | `#eae6dc` auf `#0b1012` | **15,36** |
| Primärknopf-Beschriftung | `#0b1012` auf `#c6b38e` | **9,33** |
| Chip-Text | `#babdb7` auf `#141c1f` | **9,09** |
| Navigationsziel | `#eae6dc` auf `#141c1f` | **13,86** |
| Eingabetext auf Feldfläche | `#eae6dc` auf `#0b1012` | **15,36** |
| Eingabefeldrahmen (nicht-textlich) | `#82928e` auf `#0b1012` | **5,88** |
| Tafeltext gegen Tafelfläche (Studio) | `#eae6dc` auf `#0b1012` | **15,36** |
| Tafellinien | `#c6b38e` auf `#0b1012` | **9,33** |
| Fokusring (gerechnet) | `#c6b38e` auf `#141c1f` | **8,42** |
| Fehler-Chip im Zustand „Simulator fehler“ | `#c09489` auf `#141c1f` | **6,45** |
| Tafellinien, Tafelstil violett | `#aa938b` auf `#141c1f` | **5,97** |
| Tafellinien, Tafelstil pergament | `#524c3c` auf `#eae6dc` | **6,86** |

**Umfang:** 124 Paare über 22 Werkzeug-/Zustandskombinationen bei 1440 px,
davon 11 verschiedene Paare. Der kleinste gemessene Wert ist **5,88**
(Feldrahmen, nicht-textlich), der kleinste **Text**wert **6,45** (Fehler-Chip
`#c09489` auf Karte). Beide liegen über 3:1 bzw. 4,5:1; eine Aussage über
WCAG-Konformität ist damit nicht verbunden (siehe §12).

## 6 · Druck

| Prüfung | Ergebnis |
|---|---|
| Bedienpanel sichtbar | nein (alle vier Werkzeuge) |
| Werkzeugnavigation sichtbar | nein |
| Statuszeile sichtbar | nein |
| Einordnungsband sichtbar | **ja** |
| Studio: Blatt vorhanden / Titel | ja / „Pendeltafel“ |
| Studio: Tafelbreite | 567 px |
| Studio: Fläche / Tusche / Kontrast | `rgb(255,255,255)` / `rgb(0,0,0)` / **21,00** |
| Simulator: Diagramm / Messwerte | ja / ja |
| Simulator: Animation | `none`, Periode „1,00 s“ |
| Labor: Statistik / Ergebnis sichtbar | ja / ja |
| Labor: Aktionen sichtbar | nein |
| Labor: Bühne Kontrast | **21,00** |
| Journal: Einträge / Körper sichtbar | 3 / **3** |
| Journal: Filter sichtbar / Aufklapp-Zeichen | nein / `none` |

## 7 · Funktionen

| Prüfung | Ergebnis |
|---|---|
| SVG deterministisch | ja |
| SVG-Größe | 1097 Byte |
| `title` / `desc` / `xmlns` | ja / ja / ja |
| externe Referenzen im SVG | 0 |
| `<script>` im SVG | nein |
| Text escaped (kein rohes Tag) | ja |
| `validateTafel`: leer / Label > 40 / Steuerzeichen / Titel > 60 | je 1 Fehler, `ok` nur im Gutfall |
| Simulator: Theorie 0,25 m | 1,003 s, angezeigt „1,00 s“ |
| Binomial p (12/40, p=¼) | 0,46681 |
| Wilson 12/40 | 0,1807 – 0,4543 |
| Wilson 30/40 | 0,5981 – 0,8581 |

## 8 · reduzierte Bewegung

| Fall | animationName | Dauer | transform |
|---|---|---|---|
| Ruhe | `none` | `0s` | Ruhelage |
| `reduce` + Start | `none` | `0s` | statisch |
| ohne `reduce` + Start | `radSwing` | `2,6 s` | animiert |

## 9 · Fehler und Netzwerk

`errors = { console: [], externalRequests: [], failedRequests: [] }` — über alle
52 Messpunkte. Kein Konsolenfehler, keine externe Anfrage, keine
fehlgeschlagene Anfrage.

## 10 · Reproduktion

```bash
cd C:/Users/mas/Arbeit/esow-rad-t_878c59c7
export TMP="C:/Users/mas/AppData/Local/hermes/cache/scratch"; export TEMP="$TMP" TMPDIR="$TMP"
node docs/radiasthesie-completion/RAD-04/scripts/measure-werkstatt.cjs
# → EXIT=0
# "Fertig. Messpunkte: 52, PNG: 52"
# "Überlauf > 0: keiner"
# "Konsolenfehler: 0 · externe Anfragen: 0 · fehlgeschlagene Anfragen: 0"

node docs/radiasthesie-completion/RAD-04/scripts/diag-datum-fokus.cjs
# → EXIT=0, 3 Runden, je 4 Datums-Schritte, Schritt 13 mit
#   "solid 2px rgb(198, 179, 142) / offset 4px"
```

Teilläufe: `--only=simulator,journal` und `--shots=0` (ohne PNG, schneller).

Exitcode wird **nicht** durch `| head`/`| tail` maskiert. Fehlt Chrome unter
`C:/Program Files/Google/Chrome/Application/chrome.exe`, bricht das Skript mit
Fehler ab — es gibt keinen stillen Erfolg.

## 11 · Was sich gegenüber dem Vorgängerstand änderte

Aus dem Vorgängerlauf übernommen und hier nachgeprüft (nicht neu behauptet):

1. **Sprunglink** ergänzt → Tab-Protokoll hat 16 statt 14 Schritte und beginnt
   mit „Direkt zum Werkzeug“ (167 × 50 px). Im JSON nachgezählt.
2. **Druckmessung erweitert**: Tafelfläche/-tusche und ihr Kontrast, Anzahl
   sichtbarer Journal-Körper, Bühnenkontrast mit Papierweiß-Ersatz bei
   transparentem Grund.
3. **Drei Druckfehler behoben** (P1–P3, siehe `DRUCK-SVG-PDF.md`); Vorher-Bilder
   liegen in `messung/vorher/`.

In diesem Lauf zusätzlich:

4. **P4 behoben — Fokusring im Datumsfeld.** In Chromium liegt der Tastaturfokus
   für Tag/Monat/Jahr/Kalenderknopf im Shadow-Tree; `:focus-visible` greift am
   Host dann nicht (gemessen: `:focus` false, Host-`outline: none`, sichtbar nur
   der UA-Kasten am Kalendersymbol). Ergänzt wurde
   `.rad-ws-input:focus-within` in `mockup/werkstatt.css`. Vorher/Nachher-Bilder:
   `messung/diag/vorher/datum-schritt13-ohne-sandring.png` und
   `messung/diag/datum-fix-schritt13.png`, Werte in `messung/diag/datum-fokus.json`.
5. **Tab-Zählung korrigiert.** Die Doku nannte „62 von 63 Element-Schritten“;
   tatsächlich sind es 8 Protokolle (4 Werkzeuge × 1440/375) mit zusammen
   **126 Element-Schritten** (Simulator je 15, weil der Lauf mit `body` endet).
   Nach P4: **126 von 126 mit Sand-Ring**, vorher 124.
6. **Journal-Zeilen der Tabelle A korrigiert** (siehe §2), weil sie aus einem
   älteren Mockup-Stand stammten.

## 12 · Grenzen der Messung

1. **Nur Chromium.** Kein Firefox, kein Safari, kein echter Screenreader.
2. **Druck über Medienemulation**, nicht über einen Druckertreiber oder eine
   PDF-Datei.
3. **Scrollbalken ausgeblendet** (`::-webkit-scrollbar { display: none }`), damit
   Breiten reproduzierbar sind. Reale Breiten können um die Scrollbalkenbreite
   (ca. 15 px) abweichen — Prüfkriterien deshalb mit Toleranz lesen.
4. **Kein Test bei 200 % Zoom**, kein Forced-Colors-Modus, kein
   `prefers-contrast`.
5. **Kontrast ist gerechnet nach WCAG-Formel** aus gerenderten `rgb()`-Werten;
   Verläufe und Bilder mit Hintergrund gibt es nicht, daher ist die Rechnung
   hier ausreichend.
6. **Keine Aussage über WCAG-Konformität.** Gemessen sind benannte Paare in
   benannten Zuständen.
7. **Geclippte Screenshots sind hier unbrauchbar.** `Page.captureScreenshot`
   mit `clip` lieferte gleichmäßige 881-Byte-Bilder (leer), obwohl der `clip`
   innerhalb des Viewports lag. Die Fokusdiagnose nutzt deshalb
   Vollbild-Aufnahmen (1440 × 900) und prüft die Feldregion im Bild; der
   Skill-Pitfall zu `clip` ist damit erneut bestätigt, nicht behoben.
8. **Sichtprüfung der Fokusbilder ist eine Bildprüfung**, keine Messung der
   Pixel*helligkeit*: belegt sind Bild-Hashes (vorher/nachher unterschiedlich),
   die berechneten `outline`-Werte und die Sichtprüfung der Aufnahmen.
