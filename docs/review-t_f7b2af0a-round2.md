# Review Runde 2 — Mondbereich (t_f7b2af0a)

Prüfstand: HEAD `1f2726c` (unverändert), frischer `npm run build`, HTTP
`http://127.0.0.1:4197/Esoterik-Welt/` und echtes `file:///C:/Users/mas/Arbeit/Esoterik-Welt/Lokal.html`.
Browser: Chromium (Playwright 1.64.1, headless). Viewports 375×812, 768×1024, 1440×900 sowie 720×900 (200 %).
Linse dieser Runde: **Ausführung** (Runde 2 = 1× `changes_requested` + 1). Alle Zahlen sind eigene Messungen,
keine Übernahmen aus dem Handoff. Bericht des Implementierers: `docs/mond-t_f7b2af0a-round2.md`.

## 1. Ergebnis

**Bestanden.** Die drei blockierenden Befunde aus Runde 1 sind unabhängig nachgestellt und behoben; die
übrigen Abnahmekriterien sind unverändert belegt (Runde 1) und in dieser Runde an den berührten Flächen
nachgeprüft. Keine Lieferdatei vom Reviewer verändert.

## 2. Runde-1-Befunde, selbst reproduziert

| Befund | Messung nach dem Fix | Status |
| --- | --- | --- |
| B1 Takt setzt geblätterten Monat zurück | Uhr auf 02.11.2026 23:59 MEZ, 3× „Nächster Monat“ → **Februar 2027**; nach `clock.runFor(70 000)` und `(120 000)` weiterhin Februar 2027; zusätzlich **echte 65 015 ms** Wartezeit ohne Fake-Timer → Februar 2027; 14 Wechsel vor und zurück → Januar 2028 / November 2026 jeweils korrekt | behoben |
| B2 keine Auswahl, Raster nicht per Tab erreichbar | In allen Zuständen (initial, nach 3×/14× Blättern, nach Takten, nach Pfeiltaste, nach „Heute“) genau **1×** `aria-pressed=true`, **1×** `tabindex="0"`, **1×** `is-selected`; Detailtitel passt zur Auswahl (z. B. „Montag, 01. Februar 2027“); `Tab` von `#moonNextMonth` landet auf `BUTTON[data-day=2027-02-01]` (tabIndex 0) | behoben |
| B3 Relativtage aus Stunden | 02.11. 02:45 MEZ: „Letztes Viertel am **01. November 2026** · 21:28 MEZ · **gestern**“ (Zeitachse ebenfalls „gestern“); 16.11. 23:30 → **morgen**; 17.11. 00:30 → **heute**; Datum und Relativlabel stimmen in allen drei Fällen überein | behoben |

Zusatzprüfung des neuen Verhaltens (nicht im Handoff gefordert): ohne Blättern zieht der Takt über
Mitternacht korrekt weiter — 30.11. 23:59 → nach 120 s „Dezember 2026“, Auswahl `2026-12-01`, heute-Marker
`2026-12-01`, Detail „Dienstag, 01. Dezember 2026“.

## 3. Regressionsprüfung (Ausführungslinse)

- **Gates selbst gelaufen** (frischer Build, aktueller Stand): lint exit 0 · `format:check` pass · Jest 2/2 ·
  `test:moon` 14/14 · `test:pages` 6/6 · `test:offline` 2/2 · `test:tarot` 10/10 · `test:local` 12 pass /
  0 fail / 2 vorbestehende Skips · `verify:build` 30/30 · Playwright **59/59** (43,6 s).
- **Neue Regressionstests geprüft**: `tests/moon-calendar.spec.js` prüft Verhalten (Zustand nach Takten,
  Fokus, Relativtexte), keine Quelltext-Snapshots; `red-legacy-injection.log` zeigt 3 failed gegen die alte
  Logik, `green-fixed.log` 3 passed gegen den Fix. Unabhängig davon habe ich dieselben Symptome in eigenen
  Probes nachgestellt (oben).
- **Kalenderbedienung**: Pfeiltasten (rechts/runter/hoch), `Home`/`End`, Klick und „Heute“ funktionieren;
  Auswahl bleibt über weitere Takte erhalten (02.02.2027 nach 120 s unverändert).
- **Inhalte/Struktur unverändert vollständig**: 8 Phasenkarten mit Text/Geometrie/Deutung (131–231 Zeichen
  je Feld), 4 `<details>` mit echten Texten (748–938 Zeichen), 3 Quellen mit Links, 2 Reflexionsideen,
  5 Zeitachsenpunkte, 4 Legendenpunkte, keine leeren Detailkörper.
- **iCal**: 49 VEVENT, 14 325 B, `BEGIN:VCALENDAR`, 49× `DTSTART…Z`, 49 eindeutige UIDs, Statusmeldung sichtbar.
- **Fehlerzustand**: `moon-astro.mjs` blockiert → nur der Mondbereich degradiert („Berechnung nicht
  verfügbar“, Kalenderhinweis), Tarot 78 und Kristalle 30 rendern weiter, 0 `pageerror`.
- **file://**: November 2026 → Februar 2027 mit Auswahl, Tab und „Heute“ identisch zu HTTP, 0 `pageerror`,
  iCal-Blob 14 325 B.
- **Layout**: `scrollWidth == innerWidth` bei 375/768/1440 und 720 (200 %); keine inneren Überläufe in
  Kalenderzellen oder Containern.
- **SVG-Geometrie (Stichprobe)**: Flächenanteil per Punktsampling 0,25-px-Raster — 1 % → 0,55 %, 50 % → 48,97 %,
  98 % → 97,99 %, 100 % → 100 %; 0 % ohne Pfad. Die Abweichung bei 50 % ist Auflösungsfehler des Samplings
  (halbe Scheibe = exakt 50 %), nicht die frühere Terminator-Klemme.
- **Arbeitsstand**: HEAD weiterhin `1f2726c`; `index.html` (02:28) und `css/main.css` (02:32) sind älter als
  der Rundenbeginn (03:03) — die Angabe „in dieser Runde nicht angefasst“ stimmt; geändert wurden nur
  `data/moon-astro.mjs`, `js/modules/moon.js`, `tests/moon-calendar.spec.js`, `tests/moon-astro.cjs` und die
  beiden Mond-Dokumente. Kein Commit/Push/Deploy.

## 4. Nicht blockierende Beobachtungen

1. **Fokus wandert beim Monatswechsel ins Raster.** `Enter` auf „Nächster Monat“ setzt den Fokus auf
   `BUTTON[data-day=2026-12-01]`; für den nächsten Monat ist ein `Shift+Tab` zurück zum Knopf nötig
   (gemessen: genau 1 Schritt). Tastaturbedienung bleibt möglich, ist beim mehrfachen Blättern aber einen
   Tastendruck umständlicher als nötig. Vorschlag für später: Fokus auf dem Navigationsknopf lassen und nur
   bei Pfeiltasten/Klick in die Zelle setzen.
2. **Heute-Marker kann nach Mitternacht veralten**, wenn man in den aktuellen Monat zurückblättert: Uhr auf
   30.11. 23:59, „Nächster Monat“ → „Vorheriger Monat“ (zurück in November, `followToday=false`), nach
   Mitternacht bleibt `is-today` auf `2026-11-30`, während bereits der 1. Dezember ist. Das ist die bewusste
   Entscheidung „Raster bei fremdem Monat nicht anfassen“; Auswirkung rein kosmetisch (Ring + Legende).
3. **„· abnehmend“ kann bei 375 px am Zeilenanfang stehen** (N2-Fix verschiebt das Trennzeichen ans
   Folge wort, lässt aber kein Trennzeichen am Zeilenende). Typografische Kleinigkeit, kein Überlauf.
4. Unveränderte, deklarierte Grenzen: Genauigkeit ±1 min gegen USNO, Chromium only, kein Screenreader-/Axe-
   Lauf, kein 200-%-Textzoom-Nachweis über den hier gemessenen 720-px-Viewport hinaus, keine Druckfreigabe.

## 5. Belege

`evidence/t_f7b2af0a-review-r2/`: `probe-review-r2.mjs` + `probe.json` (B1/B2/B3, Mitternacht, Relativtage,
file://, Überläufe, SVG-Flächen, Echtzeit 65 s), `probe-keyboard.mjs` + `probe-keyboard.json`,
`probe-focus.mjs` (Fokusfluss), `probe-content.mjs` (Inhalte, iCal, Fehlerzustand), `probe-edge.mjs`
(Randfall Heute-Marker, 200 %), Screenshots `mine-1440-calendar-feb2027.png`, `mine-1440-today.png`,
`mine-375-calendar.png`, `mine-375-moonview.png`, `mine-768-calendar.png`, `realtime-375-after65s.png`,
`server.log`. Keine Implementierungsdatei verändert; Previewserver nach der Prüfung beendet.
