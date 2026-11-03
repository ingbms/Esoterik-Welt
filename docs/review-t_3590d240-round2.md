# Review Runde 2 — t_3590d240 (Tarot, Nachtatelier-Deck)

Datum: 2. November 2026, ~02:00 · Reviewer: `design_critique` · Linse: **Ausführung**
Bezug: `docs/review-t_3590d240-round1.md` (Runde 1, Artefakt-Linse), `docs/tarot-integration-t_3590d240-round2.md`
Ergebnis: **bestanden** — beide Runde-1-Befunde sind an der Ursache behoben und unabhängig nachgemessen.
Keine Lieferdatei vom Reviewer geändert (nur Review-Artefakte in `docs/` und `evidence/t_3590d240-review-r2/`).

Review-Stand: HEAD `1f2726c` (unverändert, kein Commit), Build frisch über `npm run build` erzeugt,
Prüfung in der HTTP-Ausgabe (`/Esoterik-Welt/`) und im echten `file://`-Einstieg (`Lokal.html`), Chromium.

---

## 1. Selbst gefahrene Gates (nicht übernommen)

| Gate | Befehl | Ergebnis |
|---|---|---|
| Lint | `npm run lint` | exit 0, keine Warnungen |
| Format | `npm run format:check` | alle Dateien konform |
| Jest | `npx jest` | 2 / 2 |
| Tarot-Suite | `npm run test:tarot` | 10 / 10 (u. a. alle 78 Karten in HTTP **und** `file://`, Filter 22/56/14, Legungen, Deck-Fallback, Payload) |
| Seiten | `npm run test:pages` | 6 / 6 |
| Offline | `npm run test:offline` | 2 / 2 |
| Lokal + Seiten | `npm run test:local` | 12 pass / 0 fail / 2 vorbestehende Skips |
| Build-Prüfung | `npm run verify:build` | 30 Seiten/Viewports, 0 Fehler |
| Playwright | `npx playwright test` | 56 / 56 |

Build-Ausgabe: `dist/Esoterik-Welt/` und `Lokal.html` neu erzeugt; `dist` entspricht damit dem Quellstand.

## 2. Befund B1 (Runde 1, Blocker) — nachgemessen

Eigene Messung mit eigenem Probe-Skript (`evidence/t_3590d240-review-r2/probe.cjs`, Ergebnis `probe.json`),
frischer Aufruf je Viewport, `#tarot`, 250 ms nach Hashwechsel:

| Breite × Höhe | `.tarot-controls` | `.tarot-filter-row` | Feld-Wrapper | Abstand Feld→Select | Select-Oberkante | erste Karte | im Erstaufbau |
|---|---|---|---|---|---|---|---|
| 320 × 568 | **232 px** | 112 px (`flex-basis: auto`) | **50 px** | **12 px** | 611 | 745 | nein (Fenster zu kurz, s. u.) |
| 375 × 812 | **232 px** | 112 px | **50 px** | **12 px** | **584** | **718** | **ja** |
| 414 × 896 | 232 px | 112 px | 50 px | 12 px | 584 | 718 | ja |
| 480 × 812 | 232 px | 112 px | 50 px | 12 px | 520 | 654 | ja |
| 481 × 812 | 110 px | 50 px (`flex-basis: 360px`, Zeile) | 50 px | −50 px (Zeile) | 398 | 532 | ja |
| 768 × 800 | 110 px | 50 px | 50 px | −50 px (Zeile) | 410 | 545 | ja |
| `file://` 375 × 812 | 232 px | 112 px | 50 px | 12 px | 584 | 718 | ja |

Damit ist die Ursache aus Runde 1 real behoben (`.tarot-filter-row`/`.tarot-search` flexen im
≤ 480-px-Block nicht mehr in Spaltenrichtung), der 260-px-Leerraum existiert nicht mehr, und ab 481 px ist
das Layout unverändert. Bildsicht: `my-gallery-375.png`, `my-gallery-320.png`, `my-gallery-480.png`,
`my-file-gallery-375.png` — Suchfeld, Select, Zähler und erste Kartenzeile stehen ohne Leerraum untereinander.

Anmerkung zur Handoff-Tabelle: die Zeile „320 → erste Karte 745, im Erstaufbau sichtbar: ja“ gilt für 812 px
Fensterhöhe. Bei 320 × 568 liegt die erste Karte bei 745 und ist naturgemäß nicht im ersten Bild — das ist
Fensterhöhe, nicht der Filterblock (die Kontrollgruppe `.tarot-controls` ist dort ebenfalls 232 px).

## 3. Befund B2 (Runde 1, erheblich) — nachgemessen

Gleiches Skript, Klick auf die erste Karte, dann Klick auf „Vergrößern“; „vorher“ = 600er-Ansicht,
„nachher“ = nach dem Klick (Werte aus `probe.json`):

| Viewport | Bild vorher | Bild nachher | Faktor | Panel | Position | Lesetext | Bildunterschrift |
|---|---|---|---|---|---|---|---|
| 320 × 568 | 220 × 366,7 | **297,6 × 496** | **1,35 ×** | 320 × 568 | `fixed` | aus | aus |
| 375 × 812 | 275 × 458,3 | **375 × 625** | **1,36 ×** | 375 × 812 | `fixed` | aus | aus |
| 414 × 896 | 314 × 523,3 | **414 × 690** | **1,32 ×** | 414 × 896 | `fixed` | aus | aus |
| 480 × 812 | 380 × 633,3 | **444 × 740** | **1,17 ×** | 480 × 812 | `fixed` | aus | aus |
| 768 × 800 | 298 × 496,7 | **436,8 × 728** | **1,47 ×** | 768 × 800 | `fixed` | aus | aus |
| 1024 × 768 | 298 × 496,7 | **332,8 × 554,7** | **1,12 ×** | 976 × 720 | `relative` | an | an |
| 1440 × 900 | 298 × 496,7 | **412 × 686,7** | **1,38 ×** | 1080 × 852 | `relative` | an | an |
| `file://` 375 × 812 | 275 × 458,3 | **375 × 625** | **1,36 ×** | 375 × 812 | `fixed` | aus | aus |

Zusätzlich gemessen:

- **Kein Beschnitt, keine Überlappung:** Kopfzeile 60 px, Body beginnt exakt bei 60 px (Überlappung 0), Bildunterkante
  562/748,5/806/794 px bei 568/812/812/800 px Panelhöhe → vollständig sichtbar; `scrollHeight == clientHeight`
  im Vollbild (kein Scrollzwang).
- **Lange Kartennamen** („Ritter der Schwerter“, ID 61): Kopfzeile bleibt 60 px, Titel einzeilig, Bild vollständig
  sichtbar bei 320 × 568, 375 × 812, 900 × 700, 812 × 375 (Querformat), 901 × 700 und 1440 × 900
  (`edge-cases.json`, `my-edge-*.png`).
- **Medienbruch 900/901 px** verhält sich wie dokumentiert: 900 px = Vollbild (`fixed`, Text aus, 376,8 px),
  901 px = Dialog (`relative`, Text an, 292 px).
- **1200er-Master nur auf Klick:** 0 B vor dem Klick, **317 055 B** danach (`naturalWidth` 600 → 1200);
  in der Erstansicht 0 Anfragen der Stufen 600/1200, alle Galeriebilder kommen aus `300/`
  (`payload-state.json`, `probe-requests.cjs`).
- **Fokusfalle im Vollbild:** Zyklus ausschließlich Schließen (44 × 44) ↔ Kartenfläche (375 × 625), `Shift+Tab`
  bleibt im Dialog; Escape schließt, Fokus kehrt auf die auslösende Karte (`data-id="0"`) zurück, Scrollposition
  bleibt erhalten (243 → 243), `body`-Overflow ist während des Dialogs `hidden` (Mausrad scrollt die Seite nicht).
  Schließen funktioniert per Maus **und** per Enter auf dem Schließen-Knopf (`probe-close.cjs`).
- **Zustandslogik:** `aria-pressed`/`aria-label` folgen dem Zustand („Karte vergrößern: …“ ↔ „Karte verkleinern: …“),
  Hinweistext wechselt; ein Orientierungswechsel setzt `is-zoomed` zurück (1440: 412 px/1200er → 298 px/600er,
  Label wieder „vergrößern“, Fokus bleibt auf dem Umschalter).
- **Bildsicht:** `my-zoomed-375x812.png`, `my-zoomed-480x812.png`, `my-zoomed-768x800.png`, `my-zoomed-1440x900.png`
  zeigen die Karte randlos, vollständig, 3:5 unbeschnitten, Titel/Numeral lesbar, Schließen und Hinweis sichtbar.

Ehrliche Grenze (deckt sich mit dem Handoff): auf kurzen Fenstern ist die Höhe bindend — 480 × 812 = 1,17 ×,
1024 × 768 = 1,12 ×. Größer ginge nur mit Beschnitt oder Drehung. Die Runde-1-Forderung (≥ 1,3 × unter 720 px
oder Bedienelement entfernen) ist bei 320/375/414 erfüllt; 480 px ist der einzige schmale Fall unter 1,3 ×.

## 4. Erhalt des bisherigen Verhaltens (Stichproben, unabhängig)

- **Inhalte/Identitäten:** ID 0 „Der Narr“ (Numeral 0), ID **23 „2 der Stäbe“** (Numeral 2 — der ursprüngliche
  Generatorfehler ist auch im Dialog weg), ID 77 „König der Münzen“ (Numeral KÖNIG); je eigene Keywords,
  Bildsprache, aufrechte und umgekehrte Deutung, Alttext `Name · Numeral — Karte des Nachtatelier-Decks`,
  600er-Detailbild; Disclaimer „Symbolische, traditionelle Deutung … keine Vorhersage und kein Heil- oder
  Wirkversprechen“ in jeder geprüften Karte (`payload-state.json`).
- **Asset-Integrität (eigene Rechnung, `integrity.cjs`):** 78 IDs, 0 Duplikate, 234 deklarierte Kartenbilder
  (78 × 300/600/1200) vorhanden mit passendem SHA256, keine fehlende Datei, 0 Hash-Abweichungen;
  79 Dateien je Stufe (78 Karten + Rückseite), 237 Bilder = **35 033 700 B** (+ `manifest.json` 61 394 B
  = 35 095 094 B Verzeichnisgesamt), `manifest.json` selbst konsistent (`card_count` 78).
- **Deck-Registry:** genau ein Deck (`nachtatelier-v1`), kein V2-Eintrag, kein Deck-Umschalter;
  unbekannte gespeicherte ID wird auf v1 geheilt (durch `test:tarot` 10/10 mit abgedeckt).
- **Offline:** `Lokal.html` 223 661 B, **0** eingebettete Base64-Bilder (kein Inline-Master), 78 Karten im
  `file://`-Lauf geöffnet (Test-Suite) plus eigene Sichtprüfung bei 375 px.
- **Kein Scope-Drift:** Runde-2-Änderungen liegen in `css/main.css` (≤ 480-Block, ≤ 900-/Vollbild-Block) und
  `js/modules/tarot.js` (Zoom-Reset, ARIA-Label); die geschützten Fremddateien sind byte-gleich
  (`docs/ci-cd-pipeline.md` `673cce50…`, `js/modules/_tarot_old.js` `91f2425b…`).
- **Kein Commit/Push/Deploy:** HEAD unverändert `1f2726c`.

## 5. Nicht blockierende Befunde / offene Punkte

1. **320 px: Kopfzeilen-Überlauf (vorbestehend, nicht diese Karte).** `#favCounter` (♥-Zähler, gerendert von
   `js/modules/crystals.js`) ragt bei 320 px um ~19 px über den Viewport (`document.scrollWidth` 339 vs. 320),
   auf allen Routen (`#home`, `#tarot`, `#moon`, `#crystals`, `#runes`, `#blog`) und damit unabhängig vom
   Tarotdeck; Bildsicht `my-gallery-320.png` (Badge rechts angeschnitten). 320 px ist nicht geforderter
   Breakpoint (375/768/1440 sind sauber, `scrollWidth == clientWidth`), und die Datei gehört nicht zu diesem
   Änderungssatz — deshalb kein Review-Blocker, aber als echter Restfehler benannt (Kandidat für eine
   Header-/Favoriten-Karte).
2. **Handoff-Zahlen zur Erstlast leicht ungenau:** gemessen werden bei 375 × 812 **4** Thumbnails aus `300/`
   (nicht 2), bei 768 × 800 6 und bei 1440 × 900 12; entscheidend ist die belegte Aussage „0 × 600/1200 in der
   Erstansicht“, die stimmt. Meine Byte-Summen waren durch frühes Schließen der Seite unvollständig und werden
   hier bewusst nicht als Gegenmessung behauptet.
3. **Vollbild-Zoom blendet Lesetext und Orientierungsumschalter aus** (≤ 900 px). Damit ist die Aussage
   „Zoom-Zustand wird beim Orientierungswechsel zurückgesetzt“ nur für > 900 px prüfbar (dort verifiziert);
   im Vollbild ist der Umschalter `display:none` und nicht erreichbar. Kein Defekt, aber die Doku sollte den
   Geltungsbereich nennen.
4. **Nur Chromium geprüft**, kein Screenreader-/Axe-/200-%-Textlauf, keine Druckfreigabe — wie im Handoff
   deklariert, unverändert offen. Kontrastwerte der Runde 2 habe ich nicht neu berechnet (keine
   Farbänderung in dieser Runde); Titel/Hinweis sind im Vollbild visuell klar lesbar.

## 6. Urteil

**Bestanden.** Beide Runde-1-Befunde sind reproduzierbar behoben (B1 Layout, B2 echte Vergrößerung mit
Vollbild unter 900 px), das bisherige Verhalten ist erhalten (78 Karten, Inhalte, Filter, Legungen, Offline,
Deck-Fallback, Payload), alle Gates sind am aktuellen Quellstand selbst grün. Die Karte kann abgeschlossen
werden; die verbleibenden Punkte aus §5 sind nicht blockierend bzw. gehören anderen Karten.

## Belege

- `evidence/t_3590d240-review-r2/probe.cjs` + `probe.json` (Layout 320–768, Zoom 320–1440, HTTP)
- `evidence/t_3590d240-review-r2/payload-state.json`, `probe-requests.cjs` (Payload, Zustandslogik, 3 Karten)
- `evidence/t_3590d240-review-r2/probe4.cjs` + `edge-cases.json` (lange Namen, 900/901, Querformat, `file://`)
- `evidence/t_3590d240-review-r2/probe-close.cjs`, `probe-wheel.cjs` (Schließen per Maus/Enter, Scrollverhalten)
- `evidence/t_3590d240-review-r2/integrity.cjs` (Manifest/Hashes/Dateizahlen), `overflow320.cjs` (320-px-Überlauf)
- Screenshots: `my-gallery-{320,375,480}.png`, `my-file-gallery-375.png`, `my-zoomed-{375x812,480x812,768x800,1440x900}.png`, `my-edge-*.png`
