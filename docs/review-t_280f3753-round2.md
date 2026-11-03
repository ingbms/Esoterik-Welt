# Review Runde 2 — t_280f3753 (Linse: Ausführung)

Datum: 2026-11-02, Prüfer: design_critique (unabhängiger Reviewlauf, Run 257)
Gegenstand: Nacharbeit B1–B4 aus Review Runde 1 am Build des Arbeitsbaums
(`C:/Users/mas/Arbeit/Esoterik-Welt`, HEAD `1f2726c`, kein Commit/Push/Deploy).

**Verdikt: freigegeben.** Alle vier Runde-1-Befunde sind am aktuellen Stand
unabhängig reproduziert und behoben; alle Gates sind von mir selbst erneut
ausgeführt; keine Regression in 33 Messläufen. Ich habe **keine** Lieferdatei
geändert. Eigene Evidenz: `evidence/t_280f3753-review/round2/` (Proben,
`probe-round2.json`, `phase-cell.json`, `probe-addendum.json`,
`skip-test-clean.json`, `probe-dialog2.json`, Screenshots).

## 1. Nachprüfung der vier Befunde (Ausführungslinse)

| Nr. | Befund Runde 1 | Messung Runde 2 (eigene Probe, aktueller Build) | Status |
| --- | --- | --- | --- |
| B1 | `.nav-toggle` als Reihe, drei Balken auf einer y-Position → 66-px-Linie | `display:flex`, `flex-direction:column`, Button **48×48**, Balken y = 31,8 / 41,3 / 50,8 (3 Reihen, je 22×1,5), x identisch 233,2 — bei 375 **und** 768, HTTP **und** `file://`. Screenshot `menu-open-375.png`: Hamburger sichtbar, Menü vollständig lesbar, `aria-expanded` false→true | behoben |
| B2 | Mondphasen-Emoji unentsättigt (Violett-Akzent) | `filter: saturate(0.4)` an der Phase-Zelle. A/B am **selben** Build (Filter per injiziertem Style aus): höchste Sättigung über Luma 60 = **0,59** `rgb(96,55,134)` → **0,33** `rgb(87,69,103)` (375 und 1440 identisch). Restviolett: 12 Pixel von 12 769 im 113×113-Zellbild, Sättigung 0,25–0,30 (Glyphenkante), Phase zusätzlich als `aria-label` und im Textblock | behoben |
| B3 | Ziele < 44 px, Handoff-Angabe „0 Ausnahmen“ zu weit | Alle `a[href], button, input, select, textarea, [role=button], [tabindex=0]` über **10 Seiten × 375/768/1440 + 3 `file://`-Läufe = 33 Läufe**: **0** Nicht-Fließtext-Ziele < 44 px. Logo 151,9×**44** (min-height 44 px, 375/768/1440), Footer-Navigation der Rechtsseiten 4×**44**, „Open Source auf GitHub“ 148×**44**, Footer-Linkliste 10×44. Verbleibend: 2 Quellen-/Lizenzlinks im Impressum mit 22 px Höhe, beide Inline im Fließtext (`<li>Quelle: <a>`) — WCAG-2.5.8-Inline-Ausnahme, in `docs/design-nachtatelier-t_280f3753.md` §5/§5a/§12 ausdrücklich so benannt | behoben, Aussage korrigiert |
| B4 | `.day-name` 11 px, `.day-number` 12 px | Beide **13 px** (`var(--text-xs)`) bei 375/768/1440; `.day-name` mobil wieder **sichtbar** (`display:block`), „Mo“ 19×15,6 px in 39,6-px-Zelle; Tageszelle 375 px 39,6×**48,1**, 0 Zellenüberlauf (scrollWidth = clientWidth), 0 Überlauf im Grid (809/809) | behoben |

## 2. Selbst ausgeführte Gates (aktueller Build)

| Gate | Ergebnis |
| --- | --- |
| `npm run build` / `npm run build:local` | ok (dist/, Lokal.html neu erzeugt) |
| `npm run lint` | exit 0 |
| `npm run format:check` | „All matched files use Prettier code style!“ |
| `npx jest` | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 |
| `npm run test:local` | 12 pass, 0 fail, 2 vorbestehende Skips |
| `npm run verify:build` | 30 Seiten/Viewports, 0 Fehler |
| `npx playwright test` | **56/56** |

## 3. Regressionen und erhaltene Eigenschaften

- **Layout:** 33 Läufe (8 Router-Ansichten/Dokumentvarianten × 3 Breiten, `file://`
  zusätzlich): 0 Dokumentüberlauf, 0 innerer Komponentenüberlauf, 0 defekte
  Bilder, 0 Konsolenfehler, 0 fehlgeschlagene Requests, genau 1 sichtbare `h1`
  je Ansicht, `main`-Textlänge unverändert (1744 Zeichen Startseite).
- **Kontraste** (eigene Rechnung, zusammengesetzte Vordergrundflächen):
  Kalender-Wochentag 10,07:1 · Tageszahl 9,33:1 · Logo 15,36:1 ·
  Footer-Navigation 9,33:1 · Nav-Link 9,09–10,07:1 · Primärbutton 9,33:1.
  Kein Paar unter 9,09:1; die 13-px-Anhebung hat den Kontrast nicht verschlechtert.
- **Tastatur:** Auf **sauberer URL** (ohne Hash) ist der Skip-Link die erste
  Tab-Station bei 375/768/1440 (211×48, Outline 2 px Sand). Enter → Fokus auf
  `<main>`, Textlänge und aktive Seite unverändert (1744, `home`), kein
  Hashrouter-Verschlucken.
  *Messhinweis:* mit `#home` in der URL beginnt Chromium die Tab-Reihenfolge
  hinter dem Fragment (erste Station = Hero-CTA „Karte ziehen“). Das ist
  Browser-Standardverhalten für Fragmentnavigation, kein Regress dieser Karte;
  die Dokumentangabe „erste Tab-Station = Skip-Link“ gilt für den Seiteneinstieg.
- **Dialoge/Module:** Blog-Artikel öffnet per Klick (`articleModal` 375×900,
  820 Zeichen, Fokus `BUTTON.modal-close`), Escape schließt und gibt den Fokus
  auf den Artikel zurück (nicht `#main`). Tarot-Kartenziehen liefert real
  „1 der Münzen — Aufrecht“, 78 Karten im Raster. Keine Konsolenfehler.

## 4. Nicht blockierende Befunde (vorbestehend, nicht durch diese Karte verursacht)

1. **Mondkalender deklariert jeden Tag als „Neumond“.** Alle 30 Tageszellen
   tragen `aria-label="Neumond — <x>% Beleuchtung"` und das Glyph 🌑, obwohl die
   Beleuchtungswerte korrekt variieren (60 % am 1.11. … 1 % am 10.11. … 98 % am
   25.11.). Ursache: `data/moon-phases.js` liefert deutsche Phasen-Keys
   (`neumond`, `zunehmend`, …), `js/modules/moon.js:86-99` sucht sie in
   `js/data/moon.js` mit englischen Keys (`new`, `waxing-crescent`, …) und fällt
   deshalb immer auf `phases[0]` zurück. `js/modules/moon.js` und `data/` sind
   gegenüber HEAD (`1f2726c`, ausgelieferter Stand) **unverändert** — der Fehler
   ist im Live-Stand genauso vorhanden.
2. **Wochentagszuordnung um eins versetzt.** `getMonthCalendar` nutzt
   `first.getUTCDay()` (0 = Sonntag), die Kopfzeile beginnt aber mit „Mo“.
   1.11.2026 ist ein Sonntag, steht im gerenderten Kalender jedoch unter „Mo“.
   Gleiche Datei, gleiche Vorbestehenslage.
3. **Toter Text „Nächste: —“** aus `index.html:405` (`#moonNextPhase`) wird von
   keinem Modul gefüllt und steht sichtbar in der Mondkarte.
4. Zwölf leere gerahmte Kalenderzellen (6 führend + 6 folgend, 42-Zellen-Raster),
   Bildunterschrift/`contain`-Versatz (~78–81 px), Tarot-/Runen-/Artikelbilder
   weiterhin Platzhalter (t_3590d240), nur Chromium, kein axe-/Lighthouse-Lauf,
   keine Druckfreigabe.

Punkte 1–3 sind Inhalt/Logik des Mondmoduls, nicht Stil dieser Karte; sie sind
durch die offene Karte **t_f7b2af0a** („Mondphasen: übersichtlicher,
aussagekräftiger Bereich mit verlässlichen Daten“, coding_debug, todo) abgedeckt
und dort mit Ursache und Reproduktion hinterlegt.

## 5. Abgrenzung

- Kein Commit, kein Push, kein Deploy durch diese Karte; Release bleibt bei
  t_3ad4ec40.
- Geschützte Fremddateien unverändert: `js/modules/_tarot_old.js`
  `91f2425b…0935d1`, `docs/ci-cd-pipeline.md` `673cce50…bbb7d3`.
- Reviewer hat keine Lieferdatei editiert (nur `evidence/t_280f3753-review/` und
  dieses Dokument).
