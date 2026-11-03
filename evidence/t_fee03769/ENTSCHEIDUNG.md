# Entscheidung t_fee03769 — Farbwelten-Datenmodul 153 KB

**Entscheidung: (B) Richtwert anheben** — die Auslagerung auf `data/farbwelten/*.json` mit `fetch`
wird **nicht** umgesetzt. Der Richtwert in `08` §9.2 wird durch einen gemessenen, größenrichtigen
Wert ersetzt; die Auslieferung bleibt ein ES-Modul.

Datum: 2026-11-03 · Basis: `90767c8` · Profil: orchestrator · kein Push, kein Deploy.

---

## 1. Frage der Karte

`js/data/farbwelten.js` ist mit dem Zwölf-Farben-Stand 153.413 Byte groß. `08` §9.2 Punkt 2
(Satz 226–228) nennt einen Richtwert von 150 KB und verlangt darüber den Wechsel auf
`data/farbwelten/*.json` mit `fetch` plus Ladezustand (`aria-busy`). Zu entscheiden war:
(A) auslagern oder (B) Richtwert anheben.

## 2. Arbeitsbasis (wichtig für die Nachvollziehbarkeit)

Der Worktree dieser Karte wurde vom Projekt-Hauptstand `30a2f62` angelegt — das ist der
**Sieben-Farben-Stand** mit `js/data/farbwelten.js` = 84.407 Byte. Die Elternkarte `t_360cab76`
endet jedoch auf `90767c8`; nur dort stehen zwölf Farbwelten und die 153.413 Byte.

Der Worktree wurde deshalb vor jeder Messung per `git merge --ff-only 90767c8` auf den
Elternstand gezogen (`HEAD` = `90767c8`, Modul 153.413 Byte). Alle Zahlen unten gelten für
diesen Stand. Ohne diesen Schritt wäre die Karte am falschen Datenstand entschieden worden.

## 3. Messungen

Alle Rohdaten und Skripte liegen in `evidence/t_fee03769/`; jedes Ergebnis ist mit dem
genannten Befehl reproduzierbar.

### 3.1 Größe und Kodierung

| Darstellung | roh | gzip | brotli (q11) |
| --- | ---: | ---: | ---: |
| ES-Modul `js/data/farbwelten.js` (Ist) | 153.413 B | 26.198 B (`gzip -9`) / 26.393 B (zlib 9) | 21.843 B |
| derselbe Inhalt als kompaktes JSON | 133.357 B | 25.526 B (zlib 9) | 21.200 B |
| Differenz (gleicher Kompressor, zlib 9) | −13,1 % | **−867 B (−3,3 %)** | −643 B (−2,9 %) |

`node evidence/t_fee03769/measure-json-vs-module.mjs`

Die beiden gzip-Programme unterscheiden sich um 195 B (Header/Strategie), nicht der Inhalt;
für den Vergleich zählen deshalb nur Zahlen desselben Kompressors. Der Formatwechsel
(JS → JSON) spart **867 Byte gzip**. Das ist der gesamte Effekt der
Auslagerung auf der Leitung; der Inhalt bleibt derselbe. Von den 153.413 Rohbytes sind
17.774 B (11,6 %) reine Einrückung — die Rohgröße misst zu einem Achtel die Formatierung
von Prettier, nicht die Nutzlast. Das Kompressionsverhältnis liegt bei 5,8 : 1, weil sich
zwölf Mal dieselbe Abschnittsstruktur wiederholt.

### 3.2 Ladezeit des Moduls

| Messung | Ergebnis |
| --- | --- |
| Kalter Import in Node (3 Läufe, frischer Prozess) | 3,37 / 3,87 / 4,45 ms |
| Auswertung im Browser, Median aus 5 Läufen | 6,3 ms |
| Auswertung im Browser, 4× CPU-Drosselung | 8,3 ms |
| Kontrolle: `astrologie.js` (271 KB) im Browser | 7,7 ms / 9,9 ms (4×) |

`node evidence/t_fee03769/measure-import.mjs js/data/farbwelten.js` ·
`node evidence/t_fee03769/measure-module-eval.cjs dist`

Das Modul kostet einstellige Millisekunden. Die 4×-Drosselung ändert kaum etwas, weil
das Kompilieren nicht auf dem gedrosselten Hauptthread lastet — die Zahl ist deshalb als
Untergrenze zu lesen.

### 3.3 Was der Erstaufruf tatsächlich lädt (gzip-Server, Chromium)

| Kennzahl Startseite | Wert |
| --- | --- |
| Requests / übertragen | 38 / **1.694,8 KB** |
| davon Schriften `.ttf` | 918,9 KB |
| davon Bilder `.jpg` | 568,5 KB |
| davon JavaScript (`.js` + `.mjs`) | 163,8 KB |
| davon `js/data/farbwelten.js` | **26,1 KB = 1,5 % der Seite** |
| DOMContentLoaded / load | 21,9 ms / 50 ms |
| Feature-Grid vollständig | 334 ms |
| Kaltstart `#farbwelten/rot` bis H1 sichtbar | 325 ms |
| Navigation Startseite → `#farbwelten/rot` (warmer Cache) | 66 ms |

`node evidence/t_fee03769/measure-browser.cjs dist 3313 > evidence/t_fee03769/messung-ist.json` ·
`node evidence/t_fee03769/summarize.cjs evidence/t_fee03769/messung-ist.json`

`farbwelten.js` ist die größte einzelne JS-Datei, aber 1,5 % des Seitengewichts. Die
Schriften allein sind 35× größer. Eine 26-KB-Optimierung an dieser Stelle ist keine
Ladezeit-Maßnahme, solange 1,5 MB Schriften und Bilder ausgeliefert werden.

### 3.4 Vergleich der Datenmodule (roh / gzip) und ihre Ladeart

| Modul | roh | gzip | Ladeart heute |
| --- | ---: | ---: | --- |
| `astrologie.js` | 271.541 B | 75.257 B | dynamischer Import (`js/modules/astrologie.js:63`) |
| `farbwelten.js` | 153.413 B | 26.198 B | statischer Import |
| `radiasthesie.js` | 79.755 B | 21.453 B | dynamischer Import |
| `tarot.js` | 42.560 B | 12.232 B | statisch |
| `moon.js` | 17.242 B | 6.206 B | statisch |

Das größte Datenmodul des Repos (Astrologie, 73,5 KB gzip) wird bereits dynamisch geladen —
**ohne** `fetch`, **ohne** JSON-Dateien. Farbwelten ist mit 26 KB gzip nicht der Ausreißer,
der eine Architekturänderung begründet.

## 4. Bewertung der beiden Wege

### (A) Auslagern auf JSON + `fetch`

| Wirkung | Befund |
| --- | --- |
| Übertragung | −867 B gzip (−3,3 %) — gemessen, nicht geschätzt |
| Auf der Farbseite selbst | kein Gewinn: die Daten werden dort ohnehin gebraucht, `fetch` fügt einen zusätzlichen Roundtrip hinzu |
| Offline-Edition | **bricht die bestehende Invariante** (siehe unten) |
| Änderungsumfang | Generator, `verify-farbwelten-sync`, Datentests, Modul (async + `aria-busy`), Offline-Build (JSON einbetten), zwölf JSON-Dateien statt einer |

Die Offline-Invariante ist nicht bloß Konvention, sondern zweifach testgestützt:

- `tests/local-entry.cjs:231-236` ersetzt `window.fetch` durch eine Funktion, die wirft:
  „Any accidental fetch, even a caught failure, fails this check.“
- `tests/offline-file.cjs:84` prüft den Kaltstart `#farbwelten/rot` mit den Worten
  „its data module is inlined, never fetched“.
- `docs/astrologie-konzept/ia-konzept.md:125`: „Für den Offline-/`file://`-Build dürfen sie
  nicht per `fetch()` geladen werden.“

Weg (A) erzwänge eine zweite Datenquelle für `Lokal.html` (eingebettetes JSON) und damit zwei
Ladepfade mit zwei Fehlerbildern — für 867 Byte. Auf der Route, die die Daten braucht, bringt
`fetch` nichts; der einzige echte Hebel wäre, später zu laden, und das leistet der vorhandene
dynamische Import ohne Offline-Bruch.

### (B) Richtwert anheben

| Wirkung | Befund |
| --- | --- |
| Code | keine Änderung, kein Risiko für die Offline-Edition |
| Kosten, die bleiben | 26,1 KB gzip und ~6 ms beim Erstaufruf — gemessen, 1,5 % der Seite |
| Doku | ein Risikoabschnitt wird durch Messwerte ersetzt |

Die alte Regel misst das falsche Maß: Rohbytes, die zu 11,6 % aus Einrückung bestehen und
5,8-fach komprimierbar sind. Sie hätte bei 150 KB ausgelöst, obwohl die Nutzlast 26 KB
beträgt — und sie hätte umgekehrt bei einer Datei mit vielen kurzen Zeilen zu früh ausgelöst.

## 5. Entscheidung im Wortlaut (Vorschlag für `08` §9.2 Punkt 2)

> 2. **Datenmenge**: Datenmodule werden als ES-Modul ausgeliefert, nie per `fetch` — die
>    Offline-Edition (`Lokal.html`, `file://`) darf keinen Netzwerkzugriff auslösen
>    (`tests/local-entry.cjs` setzt `window.fetch` außer Kraft). Maßgeblich ist die
>    übertragene, komprimierte Größe, nicht die Rohgröße: Richtwert **50 KB gzip**
>    (beim Redaktionstext dieses Bereichs ≈ 300 KB roh). Darüber wird das Modul über einen
>    dynamischen Import geladen (Muster: `js/modules/astrologie.js`), dann ist ein Ladezustand
>    nötig (`aria-busy`). Stand 2026-11-03: `js/data/farbwelten.js` = 153.413 B roh,
>    26.198 B gzip, 21.843 B brotli; Erstaufruf-Kosten ~6 ms; Anteil am Seitengewicht 1,5 %.
>    Je Farbwelt wächst das Modul um ≈ 12,8 KB roh / ≈ 2,2 KB gzip; der Richtwert trägt
>    damit bis etwa 23 Farbwelten.

Damit bleibt der Schutzzweck der Regel erhalten (kein unbegrenztes Wachstum eines
Startlast-Moduls), die Schwelle ist aber an einer Größe gemessen, die der Nutzer tatsächlich
lädt. Sie ist mit dem Bestand selbst konsistent: das einzige heute dynamisch geladene
Datenmodul (Astrologie, 73,5 KB gzip) liegt über 50 KB, Farbwelten (26,2 KB) darunter.

## 6. Was daraus für die Umsetzung folgt

Dokukarte an `coder`, **keine Codeänderung**:

1. `docs/farbwelten-konzept/08-umsetzungsleitfaden.md` §9 Punkt 2 (Zeilen 226–228) durch die
   Fassung aus Abschnitt 5 ersetzen.
2. Dieselbe Datei, Zeilen 34–35 („ein separates `data/`-Verzeichnis wäre ebenfalls möglich
   (dann `fetch`)“) präzisieren: nur zulässig, wenn die Offline-Fassung die Daten eingebettet
   erhält; heute nicht vorgesehen.
3. `docs/farbwelten-umsetzung-t_2275e7ad.md`, offene Punkte Nr. 2 (Zeilen 311–313): die
   Aussage „die Auslagerung … ist damit fällig und offen“ ist durch den Entscheid überholt und
   muss auf „entschieden: kein Split, Richtwert ersetzt (t_fee03769)“ umgestellt werden.
4. Kein `fetch`, keine JSON-Dateien, keine Änderung an `js/data/farbwelten.js`,
   `scripts/build-pages.cjs`, `scripts/build-local.cjs` oder `scripts/generate-farbwelten-data.cjs`.

## 7. Nachweise (alle am Stand `90767c8` selbst gefahren)

| Prüfung | Ergebnis |
| --- | --- |
| `npm run test:farbwelten` | 12/12 pass, 0 fail |
| `npm run test:offline` | 2/2 pass, 4,48 s |
| `npm run build` | grün (`dist/Esoterik-Welt`, `Lokal*.html` danach zurückgesetzt) |
| `node scripts/verify-farbwelten.cjs <lokal>` | **87 PASS / 0 FAIL** |
| `node scripts/verify-pages.cjs <lokal>` | **66 Seiten/Viewports, 0 Fehler** (2. Lauf) |
| `node scripts/verify-farbwelten-sync.cjs` | 15 Redaktionsquellen, 16 Registereinträge, 0 Fehler |

Lokaler Server: `python evidence/t_fee03769/serve.py dist 3209` (ThreadingHTTPServer,
`http://127.0.0.1:3209/Esoterik-Welt/`).

## 8. Grenzen und Fehlerquellen dieser Messung

- **Port 3333/3456 sind durch fremde Server belegt** (ein Express-Vorschau-Server antwortet
  dort mit einem alten Stand ohne `#farbwelten`). Ein erster Prüflauf gegen 3333 war deshalb
  ungültig (alle Seiten „kein Inhalt gerendert“) und wurde verworfen; die gültigen Läufe stehen
  oben. Derselbe Grund erzwang den ThreadingHTTPServer: `http.server` mit einem Thread hat im
  ersten Lauf eine Verbindung abgelehnt (`ERR_CONNECTION_REFUSED`) und damit einen falschen
  FAIL in `verify-farbwelten` erzeugt (danach 87/0).
- `verify-pages` zeigte im ersten Lauf einen Fehler (`FAIL 768 astrologie: navigation must
  reveal selected page`), im zweiten Lauf 66/66 grün. Das ist zeitabhängiges Verhalten des
  dynamischen Astrologie-Imports, nicht Folge dieser Karte; als solches nicht behoben.
- Gemessen wurde lokal mit `gzip -9` bzw. zlib, nicht über GitHub Pages/CDN. Die absoluten
  Übertragungswerte hängen von der Kompressionsstufe des Hosts ab; die Relationen
  (26 KB gegenüber 1,7 MB Seitengewicht, −867 B durch JSON) sind davon unabhängig.
- Keine Netzwerkdrosselung: gemessen wurde CPU-gedrosselt (4×), nicht bei 3G/4G. Aussagen zur
  Ladezeit gelten für lokale Auslieferung.
- Die Browser-Auswertungszeit streut (5,4–12,6 ms bei 1×); angegeben ist der Median aus fünf
  Läufen.
- Kein Push, kein Deploy (Kartenauflage).
