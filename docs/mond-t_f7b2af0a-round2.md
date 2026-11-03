# Mondphasen — Runde 2: Behebung der Review-Befunde B1–B3 (t_f7b2af0a)

Stand: 02.11.2026, lokaler Stand ohne Commit/Push/Deploy. Prüfstand HEAD `1f2726c`.
Vorgängerbericht: `docs/mond-t_f7b2af0a.md` (Runde 1). Review: `docs/review-t_f7b2af0a-round1.md`.

## 1. Auftrag dieser Runde

Der Review verlangte drei blockierende Korrekturen und einen Regressionstest:

| Befund | Symptom | Ursache (bestätigt im Code) |
| --- | --- | --- |
| B1 | Nach „Nächster Monat“ sprang die Ansicht nach ≤ 60 s auf November 2026 zurück | `startClock()` verglich **Ansichtsmonat** gegen **aktuellen Monat**; die Bedingung war nach Nutzer-Blättern dauerhaft wahr |
| B2 | Danach 0 × `aria-pressed`, 0 × `tabindex="0"`, Raster per Tab nicht erreichbar, Detail zeigte „01. November 2026“ | `shiftMonth()` setzte `selectedKey = null`, `renderCalendar()` fiel auf `todayKey` zurück (nicht im Monat), `renderDayDetail()` auf `days[0]` |
| B3 | „01. November 2026 · heute“, „17.11. · morgen“, „17.11. · in 2 Tagen“ | `relativeDays()` rundete `(date − now) / 86400000` statt Kalendertage in Europe/Berlin zu vergleichen |

Alle drei sind nachgestellt und behoben; die Rechnung, Quellen, Kontraste, Offline- und
Fehlerverhalten wurden nicht angetastet.

## 2. Änderungen

### 2.1 B3 — Kalendertage statt Stunden

Neu in `data/moon-astro.mjs`: `calendarDayDifference(a, b, timeZone)` vergleicht die
`localDateKey`-Tage über `Date.UTC(...)/86400000`. `relativeDays()` in `js/modules/moon.js`
nutzt nur noch diese Funktion. Damit gilt überall dieselbe Regel (Heute-Karte, „Zuletzt/Nächstes“,
Zeitachse): 23:30 → 00:30 ist **ein** Tag.

Belegt am Modul (nicht am UI): 16.11. 23:30 MEZ → 17.11. 00:30 MEZ = 1; 01.11. 21:28 MEZ →
02.11. 02:45 MEZ = −1; 23 Stunden am selben Kalendertag = 0; DST-Ende 24./25.10.2026 = 1;
Jahresgrenze 31.12.2026/01.01.2027 = 1; echte Phasenzeiten aus `getState()` eingeschlossen.

### 2.2 B1 — Minutentakt folgt nur dem echten Mitternachtswechsel

`startClock()` ruft jetzt `syncClock(now)`. Der Takt rendert den Heute-Überblick weiterhin jede
Minute, fasst den Kalender aber nur an, wenn sich der **Kalendertag** geändert hat. Ein neues
Flag `followToday` (Konstruktor `true`, `shiftMonth()` → `false`, `goToday()` → `true`) entscheidet,
ob die Ansicht beim Tageswechsel in den aktuellen Monat wandert. Zeigt die Ansicht einen Monat, in
dem „heute“ nicht liegt, bleibt das Raster unangetastet — sonst ginge bei jedem Mitternachtswechsel
ein Tastaturfokus verloren. `onShow()` nutzt denselben Pfad.

### 2.3 B2 — Invariante: genau eine ausgewählte Zelle im angezeigten Monat

`renderCalendar()` erzwingt nach jedem Rendern: `selectedKey` liegt im Monat, sonst „heute“, sonst
der Erste. `shiftMonth()` setzt die Auswahl ausdrücklich auf „heute“ (wenn der Monat ihn enthält)
bzw. den 1. statt auf `null`. `selectDay()` ignoriert Tage außerhalb des Monats.
`renderDayDetail()` fällt nicht mehr stillschweigend auf `days[0]` zurück, sondern zeigt einen
Leertext, wenn der Schlüssel nicht zum Monat gehört (kann nach der Invariante nicht mehr eintreten).
`focusFirstDay()` fokussiert nur noch die Zelle mit `tabindex="0"`; zusätzlich stellt `syncClock()`
den Fokus nach einem Neuaufbau wieder her.

### 2.4 Nicht blockierende Hinweise (N1, N2) mitbehoben

- **N1:** `moonPath()` klemmt die Terminator-Halbachse nicht mehr auf 0,6 px. Bei exakt 50 %
  entartet der Bogen zur Geraden (SVG-Spezifikation), die Fläche ist dann genau die halbe Scheibe.
  Gemessen per Punktsampling (`isPointInFill`, Bezug Kreisfläche) über 87 Zellen aus drei Monaten:
  Maximalabweichung **0,57 pp**, Mittel 0,23 pp; die beiden 50-%-Zellen messen **50,00 %**
  (vorher 46,49 %).
- **N2:** Das Trennzeichen „·“ ist mit dem folgenden Wort durch ein geschütztes Leerzeichen
  verbunden. Bei 375 px steht es damit nie allein am Zeilenende; zeichenweise über
  `Range.getClientRects()` geprüft: `illumination` und Tagesdetail enden in keiner Zeile mit
  `·`, `—`, `–` oder `-`.
- **N3** („Zuletzt/Nächstes ohne Absatzabstand“) war bereits durch `.moon-next span { display:block }`
  plus `margin-bottom` auf `.moon-next-prev` gelöst; keine weitere Änderung.

## 3. Regressionstests (neu)

**`tests/moon-calendar.spec.js`** (Playwright, Uhr per `page.clock` gesteuert, 3 Tests):

1. **B1/B2:** 02.11.2026 23:59 MEZ, 3× weiter → „Februar 2027“, genau eine Zelle
   (`aria-pressed`, `tabindex="0"`, `is-selected` = `2027-02-01`), Detailtitel „Montag, 01. Februar
   2027“; Tab von „Nächster Monat“ landet auf dieser Zelle; `runFor(70 s)` über Mitternacht →
   Monat und Auswahl unverändert; Pfeiltaste → `2027-02-02`, überlebt weitere Takte; „Heute“ →
   November 2026, Auswahl `2026-11-03`, Tagesmarkierung stimmt.
2. **B1 (Gegenrichtung):** 30.11.2026 23:59 MEZ → nach einem Takt „Dezember 2026“, Auswahl
   `2026-12-01`, Tagesmarkierung genau dort.
3. **B3:** 02.11. 02:45 MEZ → „Letztes Viertel am 01. November 2026 … gestern“ und die Zeitachse
   ebenfalls „gestern“; 16.11. 23:30 MEZ → „morgen“; 17.11. 00:30 MEZ → „heute“.

**`tests/moon-astro.cjs`**: neuer Test „Kalendertag-Differenz: 23:30 → 00:30 ist ein Tag, nicht
null“ (sieben Fälle, inkl. DST-Ende und Jahresgrenze, an echten `getState()`-Zeiten).

**RED/GREEN-Nachweis:** Die drei Browser-Tests laufen gegen die **alte** Logik (nur in den
Build-Artefakten `dist/` injiziert, Quellen unberührt) rot und gegen die neue Logik grün:

- `evidence/t_f7b2af0a-round2/red-legacy-injection.log` → **3 failed**, u. a. wörtlich
  „Zuletzt: Letztes Viertel am 01. November 2026 · 21:28 MEZ · **heute**“ (der Reviewer-Befund).
- `evidence/t_f7b2af0a-round2/green-fixed.log` → **3 passed**.

## 4. Eigene Messungen am frischen Build (keine Übernahme der Review-Zahlen)

`evidence/t_f7b2af0a-round2/probe-round2.mjs`, HTTP `/Esoterik-Welt/` und echtes `file://`:

| Prüfung | Ergebnis |
| --- | --- |
| B1 mit **echter** Wartezeit (kein Fake-Timer) | vor Wartezeit „Februar 2027“, nach **70 013 ms** weiterhin „Februar 2027“, Auswahl `2027-02-01`, `tabindex=0` 1×, Detail „Montag, 01. Februar 2027“, 0 `pageerror` |
| Monatsfolge vor/zurück (9 Wechsel) | jeder Monat genau eine Auswahl (`März 2027` → `2027-03-01`, `April 2027` → `2027-04-01`, … `November 2026` → `2026-11-02`), Detailtitel passt jeweils zum Monat |
| Tab von „Nächster Monat“ | `BUTTON[data-day=2027-02-01]`, `tabIndex 0` (vorher: Sprung zum ersten `<summary>`) |
| Tagesdetail per Klick/Pfeil/Home/End | 31.12. → 30.12. → 23.12. → 01.12. → 31.12., Titel folgen |
| „Heute“ | November 2026, `2026-11-02`, Detail „Montag, 02. November 2026“ |
| iCal nach dem Umbau | `mondphasen-2026.ics`, 49 Termine, 14 325 B, Statusmeldung sichtbar |
| `file://` | November 2026 / nach 3× weiter „Februar 2027“ mit Auswahl und `tabindex=0`, Tab landet auf der Zelle, „Heute“ zurück; **0** `pageerror` |
| Überläufe | 375/768/1440: `scrollWidth == innerWidth` (`screenshots`-Block im JSON) |
| Flächenanteil der Glyphen | 87 Zellen, max. 0,57 pp, Mittel 0,23 pp, 50-%-Zellen exakt 50,00 % (`area-round2.json`) |
| Zeilenumbruch 375 px | keine Zeile endet mit „·“ (`wrap-375.json`) |

Screenshots: `shot-{375,1440}-today.png`, `shot-{375,1440}-calendar-feb2027.png`,
`http-{375,768,1440}-moon-feb2027.png`, `http-{375,768,1440}-detail-feb2027.png`,
`file-375-moon.png`, `http-1440-after-70s.png`.

## 5. Gates (selbst gelaufen, frischer Build)

| Gate | Ergebnis |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm run format:check` | alle Dateien konform |
| `npx jest` | 2/2 |
| `npm run test:moon` | 14/14 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 |
| `npm run test:tarot` | 10/10 |
| `npm run test:local` | 12 pass, 0 fail, 2 vorbestehende Skips |
| `npm run verify:build` | 30/30, 0 Fehler |
| `npx playwright test` | 59/59 (56 + 3 neue) |

## 6. Geänderte Dateien dieser Runde

```
data/moon-astro.mjs          + calendarDayDifference()
js/modules/moon.js           relativeDays, renderCalendar-Invariante, shiftMonth,
                             focusFirstDay, selectDay, syncClock/startClock, onShow,
                             moonPath (N1), Prozentzeile (N2)
tests/moon-astro.cjs         + Kalendertag-Differenz-Test
tests/moon-calendar.spec.js  neu: 3 Browser-Regressionstests
docs/mond-t_f7b2af0a.md      Testzahlen aktualisiert (14/14, 59/59)
docs/mond-t_f7b2af0a-round2.md  dieser Bericht
```

Kein Commit, kein Push, kein Deploy. Grenzen unverändert: ±1 Minute Genauigkeit,
kein Screenreader-/Axe-Lauf, kein 200-%-Textzoom, keine Druckfreigabe, Chromium only.
