# Review t_f7b2af0a — Mondphasen-Bereich (Runde 1, Linse: Artefakt)

Reviewerin: `design_critique` · Datum: 02.11.2026 · Prüfstand: HEAD `1f2726c`, Arbeitsbaum uncommitted
(Lieferstand von `coding_debug`), Build frisch aus `npm run build` / `npm run build:local`.
Verdict: **Änderungen erforderlich** (drei reproduzierbare Defekte, davon einer blockierend für Kriterium 3).

Prüfprinzip: Zuerst Code und Rohdaten gelesen, dann eigene Messungen — die Handoff-Behauptungen
wurden nicht als Beleg übernommen. Alle Zahlen unten stammen aus eigenen Läufen; Skripte liegen in
`evidence/t_f7b2af0a-review/`.

---

## 1. Was unabhängig bestätigt ist (positiv)

### 1.1 Astronomische Rechnung

| Prüfung | Verfahren | Ergebnis |
| --- | --- | --- |
| Phasenzeiten | eigene Neuimplementierung des Vergleichs gegen die **Rohantworten** `evidence/t_f7b2af0a-moon/sources/usno-phases-2024..2027.json` (nicht die Fixtures) | 192/192 Referenzen, **max. 44 s**, Mittel 16 s, 0 fehlend |
| Beleuchtungsgrad | eigener Parser der Rohdateien `horizons-illu-2025.txt` / `-2026.txt` (Spalte 1 = Illu %, nicht S.T.O.) | 732/732 Zeilen, **max. 0,324 pp**, Mittel 0,093 pp |
| Lebendabgleich Quelle | `aa.usno.navy.mil` live abgerufen (02.11.2026) für November 2026 | Letztes Viertel 01.11. 20:28 UT, Neumond 09.11. 07:02 UT, Erstes Viertel 17.11. 11:48 UT, Vollmond 24.11. 14:53 UT — Modul zeigt 21:28 / 08:01 / 12:47 / 15:53 MEZ, also 0–1 min daneben (deklariert ±1 min) |
| Meeus-Umsetzung | Zeile-für-Zeile-Abgleich Kap. 49 (Tafeln 49.A/49.B), 48.4, ΔT Espenak/Meeus | Koeffizienten, Vorzeichen, W-Term (+ erstes / − letztes Viertel) und A1–A14 vollständig und korrekt |
| Monatsraster 2020–2050 | 372 Monate, 11 323 Tage | 0 Abweichungen: Tagesanzahl, erster Wochentag, lückenlose Wochentagsfolge, kein Neumond > 2,5 %, kein Vollmond < 97,5 %, jedes Ereignis genau einem Tag zugeordnet |
| Zeitzone/DST | 9 Grenzfälle + Kürzel | alle korrekt, u. a. 29.06.2026 23:56 UTC → 30.06. 01:56; 02.11. 22:59/23:00 UTC → 23:59 / 03.11. 00:00; DST-Ende 25.10. 01:00 UTC → 02:00 MEZ; DST-Start 29.03. 01:00 UTC → 03:00 MESZ; MEZ/MESZ |

### 1.2 SVG-Geometrie (kein Opacity-Trick)

Flächenanteil der beleuchteten Pfadfläche per Punktsampling (`isPointInFill`) gegen die angezeigte
Prozentzahl gemessen, 29 Kalenderzellen + große Scheibe:

- Mittel |Δ| = 0,35 pp, Maximum 0,45 pp über alle Zellen außer der exakten Viertelzelle.
- Große Scheibe: angezeigt 48 %, gemessene Fläche 47,63 %.
- Spiegelung folgt der Wachstumsrichtung, nicht dem Namen: Tage 1–8 (abnehmend) gespiegelt, 10–24
  (zunehmend) nicht, 25–30 wieder gespiegelt — physikalisch korrekt.
- Neumondzelle (0 %) zeichnet bewusst keine Fläche, Zelle trägt Zahl + `aria-label`.
- Textalternative vorhanden: `role="img"` + `aria-label` „Mondphase: Letztes Viertel, 48 Prozent
  beleuchtet, abnehmend, Licht von links“.

### 1.3 Struktur, Inhalt, Bedienung

- Heute-Überblick: Datum + Uhrzeit + Kürzel + Zone, Phase, Prozent, Richtung, Mondalter,
  Zyklusposition, nächstes Ereignis mit Datum/Uhrzeit/Relativtag — vorhanden und gefüllt.
- Zeitachse: 2 vergangene + 3 kommende Hauptphasen, „nächste Hauptphase“ markiert.
- Acht Phasenkarten: je Name, Band, Erscheinung, Lichtgeometrie, mit „DEUTUNG“ gekennzeichnete
  Interpretation; Höhen 463–553 px bei 375 px, also gleichmäßig, kein Textabbruch.
- Vier `<details>` mit 850 / 776 / 938 / 748 Zeichen — kein leerer Aufklapper; Enter öffnet
  (`details.open` false → true).
- Deutungsblock sichtbar abgesetzt („DEUTUNG · KULTURELL & ASTROLOGISCH — KEINE MESSWERTE“),
  inkl. Satz, dass es keine Evidenz für Wirkung auf menschliches Erleben gibt.
- Quellenregister mit 3 Quellen + Grenzen-Absatz (kein Auf-/Untergang, kein Mondzeichen, keine
  Finsternisse) — deckt die Kartenforderung „sauber weglassen statt raten“ ab.
- Tastatur: ein Tab-Stop pro Raster (roving tabindex), Pfeile/Home/End/Enter geprüft
  (11-01 → Rechts 11-02 → Runter 11-09 → End 11-30 → Home 11-01), Fokusring 2 px `rgb(198,179,142)`,
  Offset 4 px, zusätzlich Inset-Schatten.
- Kalenderzellen 45 × 52 px bei 375 px (Tap-Ziel ≥ 44), Raster 7 × 45 px + 2 px, 6 Leerzellen vor
  dem 1.11. (Sonntag) — der ursprüngliche Wochentagsversatz ist wirklich behoben.
- Überläufe: 0 bei 375/768/1440 und bei 720 px CSS-Breite (200-%-Zoom-Reflow); auch innere
  Komponenten (`scrollWidth > clientWidth`) 0.
- Kontrast: 38 Textstellen je Viewport gemessen (Farben über Canvas dekodiert, Hintergründe durch
  die Vorfahrenkette zusammengesetzt, Gradientstops einbezogen), **Minimum 9,21 : 1**, 0 unter
  Schwelle — die Behauptung „≥ 8,42 : 1“ ist damit eher konservativ als falsch.
- `file://`: `Lokal.html#moon` rendert vollständig (8 Phasennamen im November, 0 Überlauf,
  iCal-Download 49 Termine / 14 325 B), keine Konsolenfehler.
- Fehlerzustand: `moon-astro.mjs` blockiert → Fehlerbanner sichtbar, Phase „Berechnung nicht
  verfügbar“, Kalender- und Ritual-Leertext, 8 Phasenkarten + 3 Quellen bleiben stehen, Tarot (78)
  und Kristalle (30) rendern weiter, keine `pageerror`.
- Gates am frischen Build selbst: lint 0 · format pass · jest 2/2 · test:moon 13/13 · pages 6/6 ·
  offline 2/2 · tarot 10/10 · local 12/2 vorbestehende Skips · verify:build 30/30 · Playwright 56/56.

Damit sind Rechenqualität, Quellenbindung, Fehlerzustand, Offline-Fähigkeit, Kontraste und
Grundbedienung belegt. Die folgenden drei Defekte sind davon unabhängig und einzeln reproduzierbar.

---

## 2. Blockierende Befunde

### B1 — Der Kalender springt jede Minute in den aktuellen Monat zurück

**Reproduktion** (HTTP, 1440 px, `#moon`): „Nächster Monat“ 3× → Monatslabel „Februar 2027“.
70 s warten (der Bereich rendert im Minutentakt neu) → Monatslabel „November 2026“.

Gemessen in `probe-ui2.mjs` / `probe-tick.mjs`:

```
vor Monatswechsel   November 2026  pressed 2026-11-02  tabindex0 2026-11-02
nach 3× weiter      Februar 2027   pressed 2027-02-01  tabindex0 2027-02-01
nach 70 s           November 2026  pressed []         tabindex0 []
```

**Ursache** — `js/modules/moon.js`, `startClock()` (Zeilen 577–592):

```js
const parts = api.zonedParts(now, TZ);
if (!this.view || this.view.year !== parts.year || this.view.month !== parts.month) {
  this.view = { year: parts.year, month: parts.month };
  this.renderCalendar();
}
```

Die Bedingung vergleicht den **angezeigten** Monat mit dem **aktuellen** Monat. Sie ist deshalb bei
jedem Monatswechsel des Nutzers dauerhaft wahr und setzt die Ansicht beim nächsten Tick (≤ 60 s)
zurück. Ein Monatswechsel ist damit praktisch nicht benutzbar — genau das Kriterium 3 der Karte
(„klar bedienbarer Monatskalender mit Heute/Monatwechsel“).

**Erforderliche Korrektur:** Der Minutentakt darf nur dem Kalender folgen, wenn der Monatswechsel
durch Mitternacht ausgelöst wird, nicht durch Nutzernavigation. Z. B. den zuletzt gerenderten
„heute“-Monat mitschreiben und nur bei dessen Änderung nachziehen, oder ein Flag setzen, das
`shiftMonth()` löscht und `goToday()` wieder setzt.

### B2 — Nach dem Rückfall ist keine Zelle mehr ausgewählt und das Raster nicht mehr per Tab erreichbar

Direkt nach B1 gemessen (gleicher Lauf):

- `aria-pressed="true"`: **0** Zellen, `tabindex="0"`: **0** Zellen, `is-selected`: **0** Zellen.
- Das Tagesdetail zeigt trotzdem „Sonntag, 01. November 2026“, also einen Tag, der nirgends
  markiert ist.
- Tab-Reihenfolge von „Nächster Monat“ aus: vor dem Tick → Zelle `2027-02-01`; nach dem Tick →
  springt direkt zum ersten `<summary>`, **das gesamte Raster wird übersprungen**.

**Ursache:** `shiftMonth()` setzt `selectedKey = null`; `renderCalendar()` fällt dann auf `todayKey`
zurück. Liegt „heute“ nicht im angezeigten Monat, hat keine Zelle `is-selected`/`tabindex=0`;
`renderDayDetail()` fällt hilfsweise auf `days[0]` zurück. Beim Rückfall durch den Takt bleibt
zusätzlich ein `selectedKey` aus dem alten Monat stehen.

**Erforderliche Korrektur:** Nach jedem Rendern muss genau eine Zelle des angezeigten Monats
ausgewählt sein und `tabindex="0"` tragen (heute, wenn im Monat; sonst der 1.), und das Detailpanel
muss zu dieser Zelle passen. Zusätzlich: `selectedKey` beim Monatswechsel auf die neue Auswahl
setzen statt auf `null` zu lassen.

### B3 — „heute / morgen / in N Tagen“ widerspricht dem daneben gedruckten Datum

**Live am Prüfstand** (02.11.2026, 02:45 MEZ): Heute-Karte und Zeitachse zeigen
„Letztes Viertel am **01. November 2026** · 21:28 MEZ · **heute**“. Das Ereignis lag am Vortag.

Mit eingefrorener Uhr (Playwright `clock.install`) drei weitere Fälle:

| Jetzt (MEZ) | angezeigte Zeile | Widerspruch |
| --- | --- | --- |
| 16.11.2026 00:30 | „Nächstes: Erstes Viertel am **17. November 2026** · **in 2 Tagen**“ | Ereignis ist am Folgetag |
| 17.11.2026 00:30 | „Nächstes: Erstes Viertel am **17. November 2026** · **morgen**“ | Ereignis ist am selben Tag |
| 02.11.2026 02:45 | „Zuletzt: Letztes Viertel am **01. November 2026** · **heute**“ | Ereignis war gestern |

**Ursache** — `relativeDays()` in `js/modules/moon.js` (Zeilen 89–95) rundet die Differenz in
Millisekunden: `Math.round((date - now) / 86400000)`. Alles innerhalb ±12 h wird zu „heute“,
12–36 h zu „morgen“/„gestern“ — unabhängig davon, auf welchem Kalendertag das Ereignis in
Europe/Berlin liegt.

**Erforderliche Korrektur:** Kalendertage vergleichen (`api.localDateKey(date, TZ)` gegen
`api.localDateKey(now, TZ)`, Differenz in Tagen), nicht verstrichene Stunden. Das betrifft
`#moonDaysUntil`, `#moonNextPhase` und `renderTimeline()`.

### Erforderlicher Regressionstest

Die 13 Berechnungstests decken die Bedienlogik nicht ab — B1/B2 sind damit unentdeckt geblieben.
Bitte einen Browsertest ergänzen, der (a) Monat wechselt, (b) die Uhr um > 60 s vorspult (Playwright
`clock` oder injizierter Timer), und dann Monatslabel, ausgewählte Zelle, `tabindex=0` und den
Detailtitel prüft; plus einen Test für `relativeDays` an 23:30/00:30 in beiden Richtungen.

---

## 3. Nicht blockierende Beobachtungen

- **N1 (Genauigkeit der Viertelgrafik):** Bei exakt 50 % klemmt `moonPath()` die Terminator-Halbachse
  auf `rx ≥ 0,6`, gemessene Fläche 46,49 % statt 50 %. Optisch unauffällig, aber an dem Tag, an dem
  das Label „exakt um 12:47“ behauptet, zeichnet die Zelle 3,5 pp zu wenig. Wenn das Klemmen bleibt,
  besser im Kommentar benennen; sonst `rx` ohne Untergrenze zeichnen und den Pfad bei 0 durch eine
  Gerade ersetzen.
- **N2 (Typografie 375 px):** „48 % beleuchtet · abnehmend“ bricht so um, dass das Trennzeichen
  allein am Zeilenende steht. Ein geschütztes Leerzeichen vor „·“ oder zwei Spans beheben das.
- **N3 (Lesefluss):** „Zuletzt: …“ und „Nächstes: …“ stehen als zwei Zeilen ohne Absatzabstand
  direkt untereinander und wirken wie ein Satz. Ein `display:block` mit `margin-top` (oder eine
  Liste) macht die Zweiteilung sichtbar.
- **N4 (deklarierte Grenzen, unverändert gültig):** kein Screenreader-/Axe-Lauf, keine
  Druckfreigabe, 320 px nicht gefordert (unter 360 px entfällt die Prozentzeile der Zelle, der Wert
  bleibt im `aria-label`), Chromium-only.
- **N5 (fremde Flake-Beobachtung, nicht dieser Karte zuzuordnen):** `npm run test:tarot` schlug in
  meinem ersten Lauf einmal fehl (`actual: false, expected: true`), danach 3× hintereinander grün
  (10/10, u. a. direkt nach `test:pages`). Das Mondmodul wird vom Tarot-Test nicht importiert; ich
  werte es als transiente Port-/Ressourcenstörung, nicht als Regression dieser Karte — für die
  Release-Karte aber im Auge behalten.
- **Hotspot bestätigt:** `index.html` und `css/main.css` tragen weiterhin Änderungen früherer Karten.
  Die Mondänderungen liegen in `#moon` bzw. im Mondblock; ich habe keine fremde Arbeit überschrieben
  gefunden. Meine Prüfdateien liegen ausschließlich unter `evidence/t_f7b2af0a-review/`.

---

## 4. Urteil

Kriterium 3 („klar bedienbarer Monatskalender mit Heute/Monatwechsel/Legende und anwählbaren
Tagesdetails“) ist durch B1/B2 nicht erfüllt, und B3 widerspricht dem Kernversprechen der Karte
(„verlässliche Daten“) an einer sichtbaren Stelle. Rechnung, Quellenbindung, Struktur, Kontraste,
Offline- und Fehlerverhalten sind dagegen belegt in Ordnung.

**Änderungen erforderlich** mit den drei Korrekturen und dem Regressionstest oben; danach neuer
Reviewlauf (dann Linse Ausführung: Build, Tests, Browser-Nachmessung der drei Punkte).

### Prüfdateien

`probe-calc.mjs` / `probe-illum.mjs` (Phasen/Beleuchtung/Raster/Zeitzone/iCal), `probe-ui.mjs`, `probe-ui2.mjs`
(Interaktion, 70-s-Takt, Tastatur, Monatsgrenzen), `probe-tick.mjs` (B1/B2 präzise),
`probe-clock-geometry.mjs` (B3 + Glyphen-Bbox), `probe-area.mjs` (Flächenanteil SVG),
`probe-contrast.mjs`, `probe-shots.mjs`, `probe-marker.mjs`, `probe-text.mjs`, `probe-edge.mjs`
(Fehlerzustand, file://-iCal, Tab-Reihenfolge, 200-%-Reflow) — alle unter
`evidence/t_f7b2af0a-review/`, Ergebnisse als `r1-*.json`.
