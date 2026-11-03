# Review Runde 1 — t_3590d240 (Tarot: 78 Nachtatelier-Karten)

Reviewer: `design_critique` (unabhängiger Lauf, Run 261) · Datum: 2. November 2026, 01:2x
Linse dieser Runde: **Artefakt** (Deliverable zuerst kalt gelesen, dann gegen den Handoff-Text geprüft)
Ergebnis: **Änderungen erforderlich** — 2 korrigierbare Befunde (B1 Blocker, B2 erheblich). Alles andere bestanden.

Keine Lieferdatei wurde vom Reviewer verändert. Eigene Belege liegen in `evidence/t_3590d240-review/`.

---

## 1. Befunde

### B1 — Leerer 260-px-Block zwischen Suche und Filter bei ≤ 480 px; Filter und erste Karte liegen unter dem Fold

**Reproduktion (HTTP, `#tarot`, 375 × 812):**

| Messpunkt | Wert |
|---|---|
| `.tarot-controls` | y 402–882, Höhe **480 px** |
| `#tarotSearch` (sichtbares Feld) | y 522–572, Höhe 50 px |
| `.tarot-search` (Wrapper) | y 522–820, Höhe **298 px** |
| `#arcanaFilter` | y **832–882** (also unterhalb des 812-px-Viewports) |
| sichtbarer Leerraum zwischen Feld und Select | **260 px** |
| erste Karte `#tarotGrid` | y **966** — im Erstaufbau ist keine einzige Karte sichtbar |

Gleiche Werte bei 320, 414 und 480 px (jeweils `.tarot-controls` 480 px hoch, `.tarot-search` 298 px, Select am unteren Rand). Ab 481 px ist die Zeile korrekt 50 px hoch.

**Ursache:** `css/main.css:496` setzt `.tarot-filter-row { flex: 1 1 360px }`. Im `@media (max-width: 480px)`-Block (`css/main.css:1480`) wird `.tarot-controls` auf `column` gestellt; damit wird die 360-px-`flex-basis` der Zeile zu einer **360 px hohen Box**. Die dort gesetzte Regel `.tarot-search { flex: 1 1 auto }` (`css/main.css:1489`) lässt das Suchfeld-Wrapper auf 298 px wachsen und drückt das Select an den unteren Rand der Box. Der Kommentar an dieser Stelle nennt den Mechanismus („flex-basis würde in Spaltenrichtung eine 220-px-Zeile“), überschreibt aber nur die Basis des Kindes, nicht die der Zeile selbst.

**Warum das die Abnahme verletzt:** Die Karte verlangt gute Lesbarkeit bei 375 px und einen funktionierenden Suche/Filter-Bereich; der Handoff (§6 und Kommentar 2) behauptet, genau dieser Block sei korrigiert. Der Befund reproduziert am aktuellen Stand (CSS-mtime 01:01, Screenshot des Implementierers 01:15 zeigt ihn ebenfalls) — die Sichtprüfung der eigenen Endfassung hat den Befund nicht erfasst.

**Minimale Abhilfe:** im ≤-480-Block zusätzlich `.tarot-filter-row { flex: 0 0 auto; }` (und `.tarot-search { flex: 0 0 auto }`). Erwartung danach bei 375 px: Select-Oberkante ≈ 572 + 12 = 584, `.tarot-controls` ≈ 232 px hoch, erste Karte ≈ y 700; Abstand Feld→Select = 12 px (der `gap` der Zeile).

### B2 — „Vergrößern“ vergrößert bei 375 px nichts

**Reproduktion:** 375 × 812, beliebige Karte öffnen, auf das Bild tippen.

| | vorher | nachher |
|---|---|---|
| `.tarot-detail-image` | 275 × 458 | **275 × 458** (Δ 0) |
| `.tarot-detail-figure` | 277 px | 277 px |
| `naturalWidth/Height` | 600 × 1000 | 1200 × 2000 |
| Hinweis | „Vergrößern“ | „Verkleinern“ |
| `aria-pressed` | false | true |
| `aria-label` | „Karte vergrößern: Der Stern“ | unverändert |

Der Klick tauscht nur das Bitmap (600 → 1200), die Anzeigegröße bleibt identisch; bei 275 CSS-px Anzeige ist der Unterschied nicht wahrnehmbar. Die Bedienfläche verspricht eine Vergrößerung, liefert keine und lädt dafür 317 kB nach (gemessen: 1200er-Stufe erst nach dem Klick). Bei 768/1440 wächst das Bild nur um Faktor 1,16 bzw. 1,34 (298 → 347/400 px).

**Ursache:** `.modal.is-zoomed .tarot-detail-figure { width: min(100%, calc((100vh - 230px) * 0.6)) }` (`css/main.css:663`). Bei 375 px ist `100%` = 277 px bereits kleiner als `(812 − 230) × 0,6` = 349 px, also ändert `min()` nichts; der Dialog ist ohnehin schon einspaltig und voll breit.

**Minimale Abhilfe:** unter 720 px den Zoom als echte Vollbildansicht ausführen (Figure auf Viewportbreite, Text ausblenden), z. B. `width: min(100vw, calc((100vh - 48px) * 0.6))` mit `max-width: 100vw`/`padding: 0` für `.modal.is-zoomed` — bei 375 × 812 ergäbe das 375 statt 277 px (+35 %). Alternativ das Zoom-Bedienelement unterhalb der Schwelle entfernen; dann darf es aber nicht „Vergrößern“ heißen.

---

## 2. Bestanden (unabhängig nachgeprüft, nicht aus dem Handoff übernommen)

**Deck- und Identitätsprüfung** (`evidence/t_3590d240-review/probe-static.cjs`, `static.json`): 78 Einträge, IDs exakt 0–77, 22 Major / 4 × 14 Minor, Namen und Numerale zeichengleich mit `manifest.json` für alle 78 Karten, kanonische Namen unabhängig neu abgeleitet (Ass/n der Farbe/Bube–König) — 0 Abweichungen. ID 23 = „2 der Stäbe“ ist auch **im Motiv** eingedruckt (eigene Bildsicht auf `crop-23.png`), ebenso Stichproben „Bube der Stäbe“ (ID 32) und „5 der Münzen“ (ID 68) — die Hofkarten-/Farbzuordnung ist nicht verschoben.

**Inhalte:** 78 individuelle Stichwortlisten, 78 individuelle Bildsprachen, 78 individuelle aufrechte und 78 individuelle umgekehrte Deutungen; kein generischer Farbsatz; Mindestlängen 3 Keywords / 46 / 38 / 71 Zeichen; Disclaimer überall „keine Vorhersage und kein Heil- oder Wirkversprechen“; Mond (ID 18) mit drei Abschnitten Tiefentext (512 + 461 + 317 Zeichen, im Dialog als „Ausführliche Deutung“ gerendert).

**Assets:** 237 Dateien (79 je Stufe inkl. Rückseite), 35 033 700 Byte, alle SHA256, Byte-Stände und Pixelmaße (300 × 500 / 600 × 1000 / 1200 × 2000) nachgerechnet; keine nicht deklarierte und keine fehlende Datei im Deckordner.

**Gates selbst gefahren:** `build` ok, `build:local` ok, `verify:build` 30/30, `test:tarot` 10/10 (auch gegen frisch gebautes `Lokal.html`), `test:offline` 2/2, `test:pages` 6/6, Jest 2/2, `lint` exit 0, `format:check` pass, Playwright 56/56.

**UI-Messung** (`probe-ui.cjs`, `ui.json`, 375/768/1440): Medienbox exakt 3:5 (0,600), `object-fit: contain`, Bild vollständig innerhalb der Medienbox, 0 Namens-/Arkana-Clipping, 0 Dokumentüberlauf, 0 breite Elemente, 0 Innenüberlauf im Dialog, 0 Konsolenfehler. Dialog bleibt im Viewport (375: 327 × 764), Inhalt scrollbar, Disclaimer am Ende erreichbar.

**Payload:** 375 = 2 Thumbs / 51 238 B, 768 = 6 / 166 306 B, 1440 = 12 / 326 448 B, jeweils **0 × 600 und 0 × 1200** im Erstaufbau — deckt sich exakt mit §5 des Handoffs. Nach Scrollen 18 Thumbs, keine 600er vor dem ersten Dialog.

**Zustände und Bedienung:** Ladezustand real (78 × `is-loading` mit `tarot-loading`-Animation während verzögerter Bildantwort, Abbau pro dekodiertem Bild); Fehlerzustand „Bild nicht verfügbar“ + `is-missing` + Bild ausgeblendet; Suche/Filter 22/56/14/14/14/14/78, Treffer über Name und Stichwort („königin“ → 4 Hofkarten), Leerzustand, Reset mit Fokusrückgabe; Tastatur: Enter öffnet, Fokus im Dialog, Tab/Shift-Tab zirkulieren im Dialog, Escape gibt den Fokus an die auslösende Karte zurück; Umgekehrt-Umschalter wechselt Badge, aktive Deutung, Titel und `aria-pressed`; Legung zeigt Rückseite in der Mischphase, danach 3 Karten mit gezogener Orientierung (3:5, kein Überlauf); Verlauf persistiert über Reload und löst alte Namen über die ID auf.

**Deck-Registry/Fallback:** genau ein Deck registriert, kein Umschalter, kein V2-Hinweis; gespeicherte ID `nachtatelier-v2-preview` wird auf `nachtatelier-v1` geheilt; Verlaufseintrag ID 23 mit altem Namen zeigt „2 der Stäbe“; ungültiger Eintrag (ID 999) bleibt erhalten statt zu crashen.

**file://-Einstieg:** frisch gebautes `Lokal.html` bei 375 und 1440 — 78 Karten, Thumbs geladen, Detailbild 600 × 1000 aus `file://`, 0 externe Skripte, 0 Konsolenfehler.

**Kontraste** (Canvas-Kompositing inkl. Alpha, 375/768/1440 identisch): Kartentitel 13,86 : 1, Arkana 9,09 : 1, Numeral 8,42 : 1, Ergebnistext/Reset/Deckhinweis 10,07 : 1, Dialogtitel 8,42 : 1, Fließtext 13,86 : 1, Disclaimer 9,09 : 1, Schlagwörter 9,09 : 1 — alle ≥ 4,5 : 1 (WCAG AA) bei 13–28 px.

**Fremde Arbeit:** `docs/ci-cd-pipeline.md` = `673cce50…7dbbb7d3`, `js/modules/_tarot_old.js` = `91f2425b…50935d1` — byte-gleich wie im Handoff deklariert. Kein Commit, kein Push, kein Deploy.

---

## 3. Nicht blockierende Beobachtungen

- Hover-Skalierung der Galerie (1,5 %) schneidet technisch 1,6–2,8 px je Seite ab; das eingedruckte Rahmenmotiv beginnt erst 10 px (3,3 %) vom Bildrand, der Beschnitt bleibt also im dunklen Rand und ist unkritisch.
- `.drawn-card-meaning` ist auf 4 Zeilen geklemmt (`-webkit-line-clamp: 4`) — Kürzung ohne Auslassungszeichen; die volle Deutung ist einen Klick entfernt. Bewusstes Teaser-Verhalten, kein Fehler.
- Der Zoom bei 1440 wächst nur auf 400 px in einem 1080-px-Dialog (höhenbegrenzt). Falls B2 über die volle Breite gelöst wird, sollte diese Grenze mit angepasst werden.
- „Heilung“ kommt als traditionelles Thema in zwei Karten (XIV, 3 der Schwerter) vor — als Deutung, nicht als Wirkversprechen; durch den Disclaimer gedeckt.
- Die Evidenz-Screenshots des Implementierers (`evidence/t_3590d240/gallery-top-375.png`, 01:15) zeigen B1 bereits; die Sichtprüfung der Endfassung hätte ihn finden müssen.

---

## 4. Retest-Kriterien für Runde 2

1. Bei 320/375/414/480 px: Abstand Suchfeld → Select ≈ 12 px, `.tarot-controls` ≤ 250 px hoch, erste Karte ohne Scrollen im 812-px-Viewport sichtbar; Screenshot je Breite.
2. Bei 375 px: Klick auf „Vergrößern“ vergrößert das Kartenbild messbar (≥ 1,3 × Anzeigebreite) und bleibt im Viewport; oder das Bedienelement entfällt samt `aria-label`.
3. Alle bisherigen Gates erneut grün; keine Regression bei 768/1440 (Dort darf sich nichts verschieben).
