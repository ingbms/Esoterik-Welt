# Checkpoint RAD-04

**Paket:** ESOW-RAD-04 — UX/UI-Design, Delta um die vier Werkzeuge
**Karte:** `t_5877e027` · **Profil:** design_web_layout · **Modell:** deepseek/deepseek-flash
**Arbeitsbaum:** `C:/Users/mas/Arbeit/esow-rad-t_878c59c7` · Branch `feature/radiasthesie-modul`
**Basis:** `e44fa5c` (Modul) / `092add2` (QAFIX-Checkpoint) · **Datum:** 2026-11-03
**Scope:** nur `docs/radiasthesie-completion/RAD-04/` — keine Produktionsdatei geändert.
**Messlauf dieses Stands:** `2026-11-03T01:55Z` (Chrome 155.0.8059.85, Node v24.13.0).

## 1 · Stand

| Teil | Zustand | Beleg |
|---|---|---|
| Zustände der vier Werkzeuge | spezifiziert **und** gerendert | 22 Zustände (4 Grund + 18 weitere), 16 Grundbilder + 36 Zustandsbilder, 0 Überlauf |
| Schnittstellen | spezifiziert, im Mockup geprüft | `window.RadWerkstatt` (7 Funktionen), Storage-Keys, JSON-Schemata |
| Wireframes 1440/768/375/320 | geliefert, mit Messwerten | `WIREFRAMES.md` + Tabelle A in `MESSUNG.md` |
| Tastatur | gemessen | 8 Protokolle à 16 Schritten, **126 von 126** Element-Schritten mit Sand-Ring (nach P4; vorher 124) |
| Fokus im Datumsfeld (P4) | **Befund reproduziert, Ursache belegt, behoben** | 3 Runden, `messung/diag/datum-fokus.json`, Vorher-/Nachher-Bilder |
| reduced-motion | gemessen | `animationName = none`, Werte bleiben ablesbar |
| Fehler-/Leerzustände | gerendert | Studio, Simulator, Labor, Journal (je ≥ 1 Fehler- und Leerzustand) |
| Druck | **gemessen, 3 Fehler behoben** | 4 Druckbilder + 3 Vorher-Bilder |
| SVG | geprüft | deterministisch, 1097 Byte, 0 externe Referenzen, escaped; 4 Projekt-SVGs eigenständig geprüft (viewBox 520×400, `<title>`/`<desc>`, kein `<script>`) |
| PDF | Regel + Beleg | nur Browser-Druckdialog, `@page 14mm` |
| Datenschutz | belegt | 0 externe Anfragen über 52 Messpunkte |
| Tokens / 4 SVGs | gebunden | drei echte CSS-Dateien geladen, **35** verschiedene Tokens, Rohfarben nur im `@media print`-Block |
| Produktionseinbau | **nicht ausgeführt** (Scope) | Vertrag in `SCHNITTSTELLEN.md` §6 |

## 2 · Dateien (SHA-256, Stand nach diesem Lauf)

Hashes über die Dateien im Arbeitsbaum (UTF-8, LF) am 2026-11-03; sie sind
identisch mit den Blob-Hashes des Commits. **Hinweis:** das Repository setzt
`core.autocrlf=true`, deshalb konvertiert ein frischer Windows-Checkout
Textdateien nach CRLF und ändert damit diese Hashes — die Prüfung gilt für den
Arbeitsbaum bzw. die Blobs, nicht für einen neu ausgecheckten CRLF-Stand.

```
e4205dcc1efade2b36cc3b6b2cbc14801ad729a6401fa6b272c6bd4f424d7b9d  DATENSCHUTZ.md
ac733f29fcfc4c30ca3588ce35089975f4056c7bf1d639506608a6c958e1d768  DRUCK-SVG-PDF.md
21def882b2f125c74d6bd35f5994c0e12feead96c5f34f53f4e1d1886088a787  MESSUNG.md
fe59e388fa9148f674077bce36fe210b5674a9d514e1635278548ecc64da2997  README.md
c26c9b80211124c1c5c1951d29e1b8da7413dd0e4b5584de70adfaf7c5e7f015  SCHNITTSTELLEN.md
0e757da45f3a80c3d49e3bc3520ad8a26883f21ee5edfe1ac6a7bd63c31d03f4  TASTATUR-FOKUS-MOTION.md
becfd4ea9e4ecab0fbdb1c28e78ad6bcca14e73f494c2fbf334dd21c6f7e6e79  TYPO-TOKENS-UND-SVGS.md
61ff8179f47fc43b4e3736feef339acaa7d3ae503db2a655f60c9df1a3911532  WERKZEUGE-UND-ZUSTAENDE.md
f85d19959547a086f6ac652e9d4d0039fa7ab5523c449a01d6a741eb15bbf00b  WIREFRAMES.md
2c285c98580e8d0afdf4330ca0b8e84453179cc0b9b40095253fc09b1ed1b293  mockup/index.html
294f95d1bc337f8e0ce1707819fa29c2a84d040ba69c98cc3e6d912b4d8ccc9e  mockup/werkstatt.css
bc0c1f2a450d21ff6c31719689ac8cbd943250ddc6c7e0189de37502b2ffd715  mockup/werkstatt.js
9b270854ec7e88568dab6d12c061faa4b36a060318ef12f8509feadb9c2e31a1  scripts/measure-werkstatt.cjs
1d9745bf143245314ff7fa06be631cf05b0b6c706bba60c7d95a1efa06261a7a  scripts/diag-datum-fokus.cjs
d4cc4d2b12333a4e0875f863893b792b16f2fd7e43eb48e43037510bafdc8cee  scripts/diag-fokus-datum.cjs
1529c1d966201c742da519af1c12deeea198b938123e2ec0c3d898265ab8f349  scripts/diag-motion.cjs
87bd45e62cf7f3e9dc85236c8712930312d9d8f2c67420355094de8b1d607d88  scripts/diag-widths.cjs
af7f32b93a776d756a052fc83916e26afe5480959896fd8fe2bbc10f0467d847  scripts/diag-journal-panel.cjs
e8e5dc05a66bc3dfd40fe3775e1fdf41327fd967fe7d9a1a78707e6cc0954c3f  messung/funktionen.json
9a8e94d9627742f05906f750709d23986ba8b4660e315730843c8723f17a93d3  messung/kontrast.json
c31ca7a4d5675a1bb595973983a7474d77f45b66dd23292375c7438569330275  messung/werkstatt-messung.json
283ea5593e0d1c7c6f81fad65ad64f7afad23b5f490d20df3e2815a99069a5fc  messung/diag/datum-fokus.json
36a3d27617d66db6960b219833fa7694509121de0402b2461cdc2d09aa210db4  messung/diag/journal-panel.json
5292d90a5938b083823b68b0d5bebd5a33ed6cba96e1ff2a229792879c6b299a  messung/diag/fokus-datum.json
28afdf25880fdd706286ec43d029ef17dd62d8c933b2f4323a908fb34905be63  messung/diag/fokus-datum-vorlauf-0132.json
```

Screenshots (PNG). Aggregat = `ls <dir>/*.png | sort | xargs sha256sum | sha256sum`
(aus dem Ordner `docs/radiasthesie-completion/RAD-04/` ausgeführt; 2026-11-03):

| Verzeichnis | Anzahl | Aggregat |
|---|---|---|
| `messung/screens/` | 56 | `c61233e9a35129d20b41162b33dfc83be0a79c9f3d8d131e6dd20dcb8840270a` |
| `messung/vorher/` (Druck, P1–P3) | 3 | `c84965a53a077032f8bf92426fa8b614c66756461a092883233dbad456aab70d` |
| `messung/diag/` (P4) | 19 | `0ada121d79949009311c435e7b9fcbc538d18271bbb4161393d0952d50dbe02e` |
| `messung/diag/vorher/` (P4) | 3 | `7c1bf35e9e20c00cd5951343ed616b4cd488d848ed53e0318afaffaa37955285` |

## 3 · Ausgeführte Prüfungen (dieser Lauf)

| Befehl | Exit | Ergebnis |
|---|---|---|
| `node docs/…/scripts/measure-werkstatt.cjs` (voll, mit PNG) | **0** | „Messpunkte: 52, PNG: 52“, „Überlauf > 0: keiner“, „Konsolenfehler: 0 · externe Anfragen: 0 · fehlgeschlagene Anfragen: 0“ |
| derselbe Lauf ein zweites Mal nach der P4-Korrektur | **0** | gleiche Struktur, 52/52; JSON-Zeitstempel `2026-11-03T01:55Z` |
| `node docs/…/scripts/diag-datum-fokus.cjs` | **0** | 3 Runden à 4 Datums-Schritte; Schritt 13 `outline: solid 2px rgb(198, 179, 142) / offset 4px` |
| `node docs/…/scripts/diag-fokus-datum.cjs` | **0** | reproduziert den Ausgangsbefund: Schritt 13 `:focus false`, Host-`outline: none` |
| Kontrastrechnung aus den Tokens (Node, WCAG-Formel) | 0 | Sand/deep 9,33 · Sand/card 8,42 · Sand/hover 7,72 · Feldrahmen 5,88 |
| Kontrastauswertung `messung/kontrast.json` | 0 | 124 Paare über 22 Zustände, 11 verschiedene; kleinster Textwert 6,45 |
| SVG-Prüfung der 4 Projektdateien (`grep`) | 0 | je `viewBox="0 0 520 400"`, 1 × `<title>`, 1 × `<desc>`, 0 × `<script>` |
| Tokenzählung `werkstatt.css` (`grep -o … | sort -u | wc -l`) | 0 | 35 verschiedene `var(--…)` |
| `sha256sum` aller in §2 gelisteten Dateien | 0 | Werte oben; nach dem Schreiben dieses Checkpoints erneut geprüft |
| Sichtprüfung der P4-Bilder (Bildanalyse) | – | vorher: kein Ring, nur UA-Kasten am Kalendersymbol; nachher: Sand-Ring um das Feld |

**Nicht ausgeführt:** `npm run build`, `node --test tests/radiasthesie.mjs`,
Playwright/Jest, ESLint/Prettier, echter Drucker/PDF-Datei, Screenreader.
Grund: keine Produktionsdatei geändert; der Build überschreibt zudem die
uncommittete Fremddatei `Lokal.html` (QAFIX).

## 4 · Herkunft des Stands (Fortsetzung, kein Neustart)

Die Karte ist dreimal technisch abgebrochen (Gateway-/Worker-Fehler, keine
fachlichen Ergebnisse). Vorgefunden wurde ein weit ausgearbeiteter Stand
(Dokumentation, Mockup, Messskript, Messdaten, 56 Screenshots) sowie zwei
unfertige Diagnoseskripte (`diag-fokus-datum.cjs`, `diag-journal-panel.cjs`)
mit Teilergebnissen. Dieser Lauf hat:

1. den vorgefundenen Stand **neu gemessen** statt ihn zu übernehmen
   (`measure-werkstatt.cjs`, zwei vollständige Läufe, Exit 0);
2. alle SHA-256-Angaben des Vorgänger-Checkpoints gegen die Dateien geprüft:
   **6 von 18 wichen ab** (README, `mockup/index.html`, `mockup/werkstatt.css`,
   `funktionen.json`, `kontrast.json`, `werkstatt-messung.json`) — die
   Messdaten waren neuer als die Dokumentation;
3. den offenen P4-Befund zu Ende geführt: Ursache belegt (`:focus-visible`
   greift am Host nicht, Fokus im Shadow-Tree), Korrektur additiv im Mockup,
   Vorher-/Nachher-Bilder, 3 Wiederholungsrunden;
4. **vier Dokumentationsfehler korrigiert**, die nur durch Nachrechnen auffielen:
   Journal-Zeilen der Tabelle A (Panel 1406/1384/1109/1199 statt 1154/1132/858/948),
   Tab-Zählung (126 Element-Schritte statt „63“, 126/126 Ringe statt „62 von 63“),
   kleinster Textkontrast (6,45 statt 9,09), Tokenzahl (35 statt 30);
5. die Screenshots und JSON-Dateien in diesem Lauf neu erzeugt (Aggregate in §2).

## 5 · Restpunkte und nächster Schritt

**Offen (bewusst, außerhalb des Schreibrechts dieser Karte):**

1. **Produktionseinbau** — Route `#pendeln/werkstatt[/<id>]`, Container,
   Landing-Kachel (viertes Werkzeug fehlt in `landing.workshop`), CSS-Übernahme
   inklusive der P4-Regel. Vertrag: `SCHNITTSTELLEN.md` §6.
2. **Landing-Raster mit vier Karten** ist spezifiziert, aber **nicht gemessen** —
   die Produktionsseite hat heute drei Karten.
3. **`datenschutz.html`** nennt die drei Werkstatt-Schlüssel nicht.
4. **Echter Drucklauf** (Papier/PDF-Datei) und **Screenreader-Test** stehen aus.
5. **Browserbreite:** nur Chromium 155 geprüft; `::details-content` braucht dort
   den CSS-Weg, ältere Browser den `beforeprint`-Weg (beides eingebaut).
   Der UA-Kasten am Kalendersymbol (P4) ist Chromium-spezifisch und bleibt.
6. **CI** ruft `test:radiasthesie` nicht auf (bekannter Blocker aus RAD-01).

**Nächster Schritt:** Einbau nach `SCHNITTSTELLEN.md` §6 in einer eigenen Karte,
danach dieselbe Messung gegen die Produktionsseite fahren und die Werte aus
`MESSUNG.md` §2–§6 gegenprüfen. Für die Landing-Karten dabei die Kartenbreiten
bei 1440/1100/768 messen (die 316-px-Rechnung aus `WIREFRAMES.md` §5 ist eine
Herleitung, kein Messwert).

## 6 · Grenzen dieses Checkpoints

- Keine Abnahme der 14 Pakete. Diese Karte deckt RAD-04 (Werkstatt-UX) ab;
  RAD-04 bleibt in der Matrix von RAD-01 ein Teilumfang, bis der Einbau
  gemessen ist.
- Keine WCAG-Konformitätsaussage. Belegt sind benannte Paare, Zustände und
  Fokusreihenfolgen; kein Screenreader, kein Firefox/Safari, kein Zoom-/
  Forced-Colors-Test.
- Druck wurde über Medienemulation geprüft, nicht über einen Druckertreiber.
- Die P4-Bildbelege sind Vollbild-Aufnahmen; `clip`-Screenshots lieferten leere
  Bilder (881 Byte). Belegt sind berechnete `outline`-Werte und Sichtprüfung,
  nicht Pixelgleichheit über alle Runden (Runde 1 weicht vom ersten Paint ab).
- Keine Aussage über Verhalten unter Last, bei sehr langen Inhalten oder in
  anderen Browsern.
