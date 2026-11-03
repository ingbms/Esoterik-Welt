# Mondphasen — Neustrukturierung und verlässliche Daten (t_f7b2af0a)

Stand: 02.11.2026 (Lauf, lokaler Stand ohne Commit/Push/Deploy).
Scope: `C:/Users/mas/Arbeit/Esoterik-Welt`, Remote `ingbms/Esoterik-Welt`.

> **Runde 2 (nach Review B1–B3):** `docs/mond-t_f7b2af0a-round2.md`. Dort stehen die drei
> Korrekturen am Kalender (Minutentakt, Auswahl-Invariante, Kalendertag-Relativtage), die neuen
> Regressionstests (`tests/moon-calendar.spec.js`, 3 Fälle) und der RED/GREEN-Nachweis. Die
> Testzahlen unten sind auf dieser Seite bereits auf 14/14 bzw. 59/59 aktualisiert.

## 1. Auftrag in einem Satz

Der Mondbereich war unübersichtlich und rechnerisch falsch: alle Kalendertage wurden als „Neumond“
ausgegeben, die Wochentagszuordnung war um einen Tag versetzt, die Phasenzeiten kamen aus einer
linearen Mittelwertformel, und das „Mond im Zeichen" war aus Kalendermonat und Tag geraten.
Die Karte verlangt eine neue Struktur (Heute-Überblick, Zeitachse, Kalender mit Tagesdetails,
acht Phasen erklärt, getrennte Deutung, Quellen) **mit belegten Daten**.

## 2. Datenherkunft und Genauigkeit (gemessen, nicht behauptet)

| Was | Verfahren | Referenz | Ergebnis |
| --- | --- | --- | --- |
| Zeiten der vier Hauptphasen | Meeus, *Astronomical Algorithms* 2. Aufl., Kap. 49 (Tafeln 49.A/49.B), ΔT nach Espenak/Meeus | USNO-API, 192 Phasen 2024–2027 | max. **44 s**, Mittel 16 s, alle 192 innerhalb 60 s |
| Beleuchtungsgrad | Meeus Kap. 48, Phasenwinkel 48.4, k = (1+cos i)/2 | NASA/JPL Horizons (DE441), 732 Tageswerte 2025–2026 | max. **0,324 Prozentpunkte**, Mittel 0,093 |
| Mondalter, Zyklusposition | aus den berechneten Hauptphasen interpoliert | — | Konsistenztest gegen Kalender und Ereignisliste |
| Zeitzone | `Intl.DateTimeFormat` mit `Europe/Berlin`, UTC als Speicherformat | DST-Regeln 2026 | 4/4 Umrechnungen, MEZ/MESZ korrekt |

Rohantworten der Quellen liegen unverändert in `evidence/t_f7b2af0a-moon/sources/`
(`usno-phases-2024..2027.json`, `horizons-illu-2025.txt`, `horizons-illu-2026.txt`).
`scripts/build-moon-fixtures.cjs` erzeugt daraus mechanisch die Test-Fixtures in
`tests/fixtures/moon/`; im Test steht kein von Hand eingetragener Zahlenwert.

Folge der Genauigkeit: Anzeige auf die Minute. Gegenüber USNO kann eine Uhrzeit um eine Minute
abweichen (USNO gibt auf die Minute gerundet aus, die Rechnung liegt bis 44 s daneben).
Das ist im Interface als „Genauigkeit etwa ±1 Minute" ausgewiesen.

## 3. Architektur

```
data/moon-astro.mjs        reine Rechnung, kein DOM, keine Abhängigkeit
js/modules/moon.js         Rendering + Bedienung (Kalender, Tastatur, iCal)
js/data/moon.js            nur Inhalte: 8 Phasentexte, Reflexionsideen, Vertiefung, Quellen
css/main.css               Mondblock (Grid, Kalender, Phasenkarten, Deutungsblock)
index.html                 Sektion #moon
tests/moon-astro.cjs       13 Berechnungstests gegen die Fixtures
scripts/build-moon-fixtures.cjs   Fixture-Generator (USNO/Horizons → JSON)
```

`data/moon-phases.js` (alte Mittelwertformel, `SYNODIC`-Konstante, deutsche Phasen-Keys) ist
**entfernt**; einziger Importeur war `js/modules/moon.js`. `js/data/moon.js` enthält keine
Rechenlogik mehr — die alten Funktionen `calculateMoonPhase`, `getMoonZodiac`,
`getDaysUntilNextPhase`, `getMoonCalendar` und das Array `zodiacSigns` sind weg, weil sie
Scheinwerte erzeugt haben. Originale liegen als Beweis in `evidence/t_f7b2af0a-moon/original-*.js`.

`.mjs` ist neu im ESLint-Scope (`eslint.config.cjs`) und im Prettier-Glob
(`package.json → format:check`), damit die Rechenmodule nicht aus den Gates fallen.

## 4. Fachliche Entscheidungen (und ihre Begründung)

**Phasenname aus dem Beleuchtungsband, nicht aus acht gleich langen Abschnitten.**
Ein Octant-Modell (3,7 Tage pro Name) hätte Tage mit 9 % Beleuchtung „Neumond" und Tage mit 43 %
„Letztes Viertel" genannt — genau der Widerspruch zwischen Name und Zahl, der den Bereich
unverständlich macht. Deshalb: Neumond < 2 %, Viertel im Fenster 45–55 % um den exakten Punkt,
Vollmond ≥ 98 %, dazwischen Sichel bzw. Gibbous, getrennt bei 50 %. Der Test
`Phasenname folgt dem Beleuchtungsband …` prüft für einen ganzen Monat, dass kein Tageswert seinen
eigenen Namen widerlegt. Die Texte der acht Phasen nennen die Bänder mit.

**Kein Mondzeichen.** Für ein belastbares „Mond im Zeichen" braucht es die geozentrische
ekliptikale Länge des Mondes aus einer geprüften Ephemeride — plus Angabe des Systems (tropisch
oder siderisch, Unterschied ca. 24°). Beides ist im Projekt nicht vorhanden. Statt einer geratenen
Zahl steht im Bereich ein erklärender Absatz („Warum hier kein Mondzeichen steht"); das frühere
Badge `#moonZodiac` ist entfernt.

**Kein Mondauf-/-untergang, keine Finsternisse.** Auf-/Untergang ist standortabhängig; ohne
Standort wäre jede Zeit geraten, und die Seite fragt bewusst keine Standortdaten ab. Finsternisse
brauchen Knotenlage und Entfernungen — eigene Rechnung, nicht Teil dieser Karte. Beides steht
sichtbar als Grenze im Bereich „Woher die Zahlen kommen".

**Zeitzone Europe/Berlin als offen dokumentierte Startannahme.** Intern wird ausschließlich mit
UTC-Instanten gerechnet, die Anzeige geht durch `Intl` (DST-fest). Der iCal-Export schreibt
UTC-Zeitstempel (`DTSTART:...Z`), damit kein `VTIMEZONE`-Block nötig ist und jeder Kalender den
Termin in seiner eigenen Zone zeigt.

**SVG mit echter Terminator-Geometrie.** Die beleuchtete Fläche ist ein Pfad aus Limbus-Bogen und
Terminator-Ellipse mit der Halbachse r·|1−2k|; abnehmende Phasen werden gespiegelt (Licht links).
Kein Vollscheiben-Opacity-Trick. Jede Scheibe hat `role="img"` und ein `aria-label` mit Phase,
Prozent und Lichtseite; die Kalenderglyphen sind `aria-hidden` (die Zelle trägt den Text).

## 5. Die drei vorbestehenden Defekte aus dem Stil-Review (design_critique)

| Befund | Ursache | Stand |
| --- | --- | --- |
| Alle 30 Tage als „Neumond" | `item.phase` (deutsche Keys) wurde gegen `moonPhases` (englische Keys) gesucht, `find()` schlug fehl, Fallback `phases[0]` | behoben — November 2026 zeigt alle **8** Phasennamen (`uniquePhases` im UI-Report) |
| Wochentag um eins versetzt | `getUTCDay()` (0 = Sonntag) gegen Montag-Kopfzeile | behoben — `(day + 6) % 7`; 1.11.2026 steht jetzt in Spalte „So" (6 Leerzellen davor) |
| Toter Text „Nächste: —" | `#moonNextPhase` wurde von keinem Modul gefüllt | behoben — Zeile zeigt „Zuletzt: …" und „Nächstes: …" mit Datum, Uhrzeit, Zeitzone, Relativtag |

## 6. Aufbau der Sektion (Reihenfolge = mobile Lesereihenfolge)

1. **Heute** — Datum, Uhrzeit, Zeitzone (MEZ/MESZ), Phase, Prozentbeleuchtung, zunehmend/abnehmend,
   Mondalter, Zyklusposition, nächstes Ereignis mit Datum/Uhrzeit; Mondbild mit Lichtgeometrie.
2. **Zeitachse** — die letzten zwei und nächsten drei Hauptphasen mit exakter Zeit, Relativtag,
   Markierung „nächste Hauptphase"; auf Mobil vertikal.
3. **Monatskalender** — Monatswechsel (‹ ›), „Heute", Legende, Tageszellen mit Zahl, Geometrie-Glyphe,
   Prozentwert, Punkt für Hauptphasen; Tagesdetails rechts (Desktop) bzw. darunter (Mobil).
   Tastatur: Pfeile, Home/End, Enter/Space; ein Tab-Stop pro Raster (roving tabindex).
4. **Acht Phasen** — je Karte: Geometrie-Glyphe, Name, Zahlenband, Erscheinung, Lichtgeometrie,
   getrennt gekennzeichnete Deutung. Darunter zwei Vertiefungen (Lichtgeometrie, Phase ≠ Finsternis).
5. **Deutung** — als Block mit Label „Deutung · kulturell & astrologisch — keine Messwerte":
   Reflexionsideen zur aktuellen Phase, Deutungstext, Vertiefung zu Deutungstradition und Mondzeichen.
6. **Quellen** — Register mit Links und Genauigkeitsangaben, Grenzen des Bereichs, iCal-Export.

Kein Accordion ohne Inhalt: alle `<details>` enthalten 4 bzw. 3 Absätze Fließtext
(Test: `emptyDetails === 0`).

## 7. Nachweise (alle lokal ausgeführt)

Reproduktion von Null:

```bash
npm run build
PORT=4193 node index.js &                     # Produktionsbasis /Esoterik-Welt/
npm run test:moon                             # 13 Berechnungstests
node evidence/t_f7b2af0a-moon/validate-astro.mjs
BASE_URL=http://127.0.0.1:4193/Esoterik-Welt/ node evidence/t_f7b2af0a-moon/probe-ui.cjs
PROBE_TAG=file BASE_URL="file:///C:/.../Lokal.html" node evidence/t_f7b2af0a-moon/probe-ui.cjs
node evidence/t_f7b2af0a-moon/probe-error-state.cjs
node evidence/t_f7b2af0a-moon/probe-contrast.cjs
node evidence/t_f7b2af0a-moon/probe-disc.cjs
node evidence/t_f7b2af0a-moon/shots.cjs
```

Die Probes brauchen einen laufenden Server auf `PORT=4193` (bzw. für die Dateivariante
`Lokal.html` im Repo-Wurzelverzeichnis, entsteht bei `npm run build`).

Berechnung/Browser (Skripte in `evidence/t_f7b2af0a-moon/`):

- `node --test tests/moon-astro.cjs` → **14/14** (Phasenzeiten, Beleuchtung, Reihenfolge,
  Jahresgrenze, DST, Tagesgrenze, Monatsraster, Namensband, Zustand, Kalendertag-Differenz, iCal).
- `node evidence/t_f7b2af0a-moon/validate-astro.mjs` → `validation.json` (192 + 732 Stichproben).
- `node evidence/t_f7b2af0a-moon/probe-ui.cjs` mit `BASE_URL=…/Esoterik-Welt/` → **14/14**,
  identisch mit `BASE_URL=file:///…/Lokal.html` (`ui-report-http.json`, `ui-report-file.json`).
- `node evidence/t_f7b2af0a-moon/probe-disc.cjs` → 9 Zeitpunkte, `disc-geometry.json`; Sicheln
  rechts/links, Gibbous, Vollmond, Neumond visuell geprüft (`disc-*.png`).
- `node evidence/t_f7b2af0a-moon/probe-contrast.cjs` → 32 Textstellen, **alle ≥ 8,42:1**
  (`contrast.json`), kleinste Schrift 13 px.
- `node evidence/t_f7b2af0a-moon/shots.cjs` → Sektion bei 375/768/1440 plus Ausschnitte
  (`section-http-*.png`, `detail-http-*.png`, Dateivariante mit `PROBE_TAG=file`).

Repository-Gates (unverändert grün):

| Gate | Ergebnis |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm run format:check` | alle Dateien konform |
| `npx jest` | 2/2 |
| `npm run test:moon` (neu) | 14/14 (13 Berechnungstests + Kalendertag-Differenz) |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 |
| `npm run test:tarot` | 10/10 |
| `npm run test:local` | 12 pass, 0 fail, 2 vorbestehende Skips |
| `npm run verify:build` | 30/30, 0 Fehler |
| `npx playwright test` | 59/59 (56 vorbestehend + 3 neue Mond-Regressionstests) |

## 8. Grenzen und offene Punkte

- **Genauigkeit ±1 Minute** je Phase gegenüber USNO; angezeigt wird die berechnete Minute.
  Kein Anspruch auf Sekundengenauigkeit, kein Anspruch auf Übereinstimmung mit anderen
  Kalenderdrucken.
- **Kein Screenreader-/Axe-Lauf, kein 200-%-Textzoom, keine Druckfreigabe.** Geprüft wurden
  Chromium, Tastaturbedienung, `aria-label`/`aria-pressed`/`aria-live`, Fokusführung im Raster,
  Kontraste und Überläufe bei 375/768/1440 px. Druck ist nicht Teil der Abnahme.
- **320 px** ist nicht gefordert; unter 360 px wird die Prozentzeile der Kalenderzelle ausgeblendet
  (Wert bleibt im `aria-label`), damit nichts überläuft.
- Der Skip-Link erscheint auf Element-Screenshots als Overlay; er liegt im Normalzustand bei
  `y = −84` (gemessen, `probe-skiplink.cjs`) und ist damit ein Artefakt der Aufnahme, kein Fehler.
- Element-Screenshots können fixe Overlays mit abbilden — Bewertung der Optik daher an
  `section-*.png` und `detail-*.png` zusammen.

## 9. Nicht getan (bewusst)

Kein Commit, kein Push, kein Deploy. Die Karte liefert lokal zur unabhängigen Prüfung;
Veröffentlichung gehört auf eine Releasekarte.
