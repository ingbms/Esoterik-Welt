# Design-Katalog — unabhängige Prüfung auf Usability und Barrierefreiheit

**Karte:** `t_0c70fb30` — Design-Katalog auf Usability und Barrierefreiheit prüfen
**Baseline:** Tag `baseline/rubriken-2026-11-03`, Commit `9f584397f8cc86a261fccdfc36dfbb8999f55ea7`
**Geprüfter Arbeitsbaum:** `wt/t_cbbf71e0`, Eingangs-Commit `55c92bc611198bc2dd50af377cf254c5606b9623`
**Stand der Prüfung:** 2026-11-03
**Werkzeuge:** Node v24.13.0, Playwright 1.64.1 (Chromium aus diesem Paket), Windows 11
**Prüfgegenstand:** `docs/migration-baseline/design-catalog.json` (275 Einträge) und die tatsächlich ausgelieferte Oberfläche

---

## 0. Ergebnis in einem Satz

Der Design-Katalog ist **strukturell belastbar und unabhängig reproduzierbar** — 275 Einträge, 170 Tokens mit Wert und Zeile, 25/17 hartkodierte Farben und alle 13 Umbruchpunkte halten einer Gegenprüfung mit eigenen Parsern stand —, aber er ist **inhaltlich nicht in allen Punkten korrekt**: der P1-Befund L-03 („keine Regel für `aria-invalid`") ist falsch, L-08 beschreibt eine Komponente, die keine Seite rendert, und der Fehlerzustand des Pendeltafel-Studios ist trotz vorhandener Regel wirkungslos. Die Website selbst besteht die Messung ohne Kontrast-, Fokus-, Namens-, Alt-Text- oder Reflow-Fehler; ein WCAG-2.5.8-Verstoß (`.badge-remove` 13 × 15 px) und der wirkungslose Studio-Fehlerzustand bleiben offen. **Freigabeempfehlung: GO mit Auflagen für den Design-Teil; NO-GO für den Push, solange `content-catalog.json` das eigene Schema verletzt (70 Fehler).**

---

## 1. Prüfverfahren und Reproduzierbarkeit

Alle Messungen liefen gegen einen eigenen Statikserver, der die Pages-URL-Struktur (`/Esoterik-Welt/`) nachbildet, damit `<base href>` und alle relativen Pfade wie in der Auslieferung greifen.

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Katalog gegen CSS (eigene Parser) | `node scripts/migration-baseline/verify-design-catalog-independent.cjs` | 275 Einträge, 170/170 Tokens, 92 Nicht-Token-Einträge, 13 Umbruchpunkte: **0 Fehler, 0 Warnungen** |
| Negativkontrolle des Katalogprüfers | `… verify-design-catalog-independent.cjs --negative` | **4 von 4** künstlichen Fehlern erkannt |
| Selbsttest der Messdetektoren | `node scripts/migration-baseline/review-design-a11y.cjs --self-test` | **5 von 5** Kontrollen bestanden |
| Laufzeitmessung | `node scripts/migration-baseline/review-design-a11y.cjs` | 42 Routen × 2 Viewports = **84 Messungen**, 14.493 Textknoten, 0 Konsolenfehler |
| Detailprüfung | `node scripts/migration-baseline/check-design-details.cjs` | 17 Routen × 2 Viewports: Namen, Landmarks, Zielgrößen, doppelte IDs, Alt-Kontext |
| Nachmessung der Einzelbefunde | `node scripts/migration-baseline/probe-design-findings.cjs` | Filterbadge, Fehlerzustand Studio/Journal, Verlaufskontrast der 12 Farbwelten |
| Routen-Erreichbarkeit | `node scripts/migration-baseline/check-catalog-routes.cjs` | 28 katalogisierte Routen gegen die Oberfläche |
| Katalog-Gates (fremd) | `validate-catalogs.cjs`, `validate-schema.cjs`, `verify-design-catalog.cjs`, `render-catalogs.cjs --check`, `inventory-baseline.cjs --check` | Design-Katalog grün; **`content-catalog.json` rot** (siehe D-09/D-10) |

**Warum eigene Parser und eigene Detektoren:** `verify-design-catalog.cjs` und die Erhebung stammen aus derselben Karte. Ein Fehler in der Erhebung würde durch denselben Code „bestätigt". Die Gegenprüfung liest Katalog und CSS deshalb mit eigener Klammer- und Zeilenlogik. Die Messdetektoren wurden zusätzlich mit injizierten Fehlern geprüft (Kontrast, Zielgröße, Fokusring, Verlauf, geschlossenes `<details>`), damit ein Nullbefund nicht nur „Detektor hat nichts gefunden" bedeutet.

**Werkzeugkorrektur während dieser Prüfung:** Der Negativlauf von `verify-design-catalog-independent.cjs` schrieb sein mutiertes Ergebnis in dieselbe Belegdatei wie der saubere Lauf (`catalog-crosscheck.json`). Ein Leser hätte dort 279 Einträge und 4 Fehler gesehen und den Katalog für defekt gehalten. Der Negativlauf schreibt jetzt nach `catalog-crosscheck-negative.json`; der saubere Lauf bleibt der einzige Inhalt von `catalog-crosscheck.json`. Beide Läufe wurden danach neu ausgeführt.

**Stand der Messungen in dieser Fassung:** alle Zahlen wurden am 03.11.2026 zwischen 22:44 und 22:55 (Europe/Berlin) gegen Arbeitsbaum `wt/t_cbbf71e0` auf Eingangs-Commit `55c92bc` neu erhoben; `a11y-messung.json` trägt `generated_at 2026-11-03T21:44:39Z`, `probe-befunde.json` und `catalog-crosscheck.json` 21:51Z. Frühere Läufe derselben Skripte lagen zahlenmäßig gleich; abweichend war nur die Verlaufsangabe, die in dieser Fassung korrigiert ist.

**Grenzen, die ausdrücklich offen bleiben:**

- Keine Screenreader-Ausgabe (NVDA/JAWS/VoiceOver) geprüft — nur DOM-Semantik und Live-Regionen.
- Keine echten Geräte, kein 200-%-Zoom mit Textabstand (WCAG 1.4.12), keine Druckausgabe.
- Dynamische Zustände sind stichprobenartig geprüft (Dialog, mobiles Menü, Fehlerzustand, Filterbadge); nicht jede der 59 Komponenten wurde in jedem Zustand durchgespielt.
- Kontrast auf Verlaufsflächen ist rechnerisch aus den Farbstops bestimmt, nicht pixelweise gemessen (§7).
- Screenshots liegen nur als Belege einzelner Zustände vor, nicht als vollständige visuelle Referenz.

---

## 2. Bestätigte Messwerte (bestanden)

| Merkmal | Messwert | Beleg |
| --- | --- | --- |
| Routen / Messungen | 42 / 84 (1440 × 900, 390 × 844) | `evidence/design-review/a11y-messung.json` |
| Textknoten auf Kontrast geprüft | 14.493 (Summe über alle Messungen, Mehrfachzählung über Viewports) | ebd., `contrast.groups` |
| Kontrastverstöße (AA) | **0** | ebd., `contrast.failures` |
| Niedrigster Textkontrast | **6,45 : 1** (`p.fq-badge` 13 px, Rose auf Karte; `#jrDeleteAll` 15 px) — Anforderung 4,5 | ebd. |
| Zustandskontraste Ruhe/Hover | `.btn-primary` 9,33 → 11,16; `.nav-link` 9,33 → 9,33; `.feature-card` 15,36 → 15,36 | ebd., `interactions.states` |
| Platzhaltertexte < 4,5 : 1 | **0** | ebd., `placeholders` |
| Zielgrößen < 24 × 24 px (2.5.8) | **0** im Ausgangszustand der 84 Routenmessungen (Ausnahme nur im Filterzustand, siehe D-03) | ebd., `targets.violations` |
| Zielgrößen < 44 × 44 px (2.5.5, AAA) | 796 Nennungen über alle Messungen (informativ, kein AA-Verstoß) | ebd., `targets.below44` |
| Bilder ohne `alt` | **0** von 262 Bildnennungen | ebd., `images.missingAlt` |
| SVG ohne Namen und ohne `aria-hidden` | **0** | ebd., `svgUnlabelled` |
| Formularelemente ohne zugänglichen Namen | **0** von 78 | ebd., `controls.withoutName` |
| Reflow bei 320 × 640 (1.4.10) | **0** Überläufe, auch kein innerer Karten-/Panel-Überlauf | ebd., `reflow320` |
| Konsolen-/Seitenfehler | **0** in 84 Messungen | ebd., `consoleErrors` |
| Fokusring | **36 von 36** Tab-Stopps sichtbar (Outline ≥ 2 px oder Box-Shadow) | ebd., `interactions.focusTraversal` |
| Sprunglink mit echtem Enter | Fokus vorher auf `.skip-link` (2 px Outline, `transform: none`), nachher auf `<main id="main">`; alle Seiten bleiben sichtbar; `main` 2.140 Zeichen / 3.179 px; H1 nicht hinter dem Header | ebd., `interactions.skipLink` |
| Tarot-Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` gesetzt, Schließen 44 × 44 px, Fokus 14/14 Schritte im Dialog, Escape schließt, **Fokus kehrt auf die auslösende Karte zurück** | ebd., `interactions.modal` |
| `prefers-reduced-motion: reduce` | greift; keine Animation > 100 ms, Übergänge 1e-05 s | ebd., `interactions.reducedMotion` |
| Mobile Navigation | Toggle 48 × 48 px, erster Link 272 × 48 px, `aria-expanded="false"`, `aria-controls="navList"` | ebd., `interactions.mobile`, `detail-befunde.json` |
| Kristall-Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="crystalModalTitle"`, Fokus im Dialog, Bild-Alt vollständig („Amethyst — violette Kristallstufe …") | `detail-befunde.json`, `dialogs.crystal` |
| Landmarks | jede der 17 Detailrouten hat `<main>` | ebd., `landmarks.main` |

**Katalog-Gegenprüfung im Einzelnen:**

| Prüfung | Ergebnis |
| --- | --- |
| Token-Werte gegen `:root` | 170 von 170 identisch (normalisiert), Zeilenangabe trifft die Deklaration |
| Nicht-Token-Einträge (59 Komponenten, 10 Layouts, 5 Muster, 10 Zustände, 2 Icons, 6 Illustrationen) | 92 von 92: Quelldatei existiert, Selektor steht im angegebenen Zeilenfenster |
| Umbruchpunkte | 13 von 13 stehen in mindestens zwei CSS-Dateien **innerhalb einer Media-Query** |
| Hartkodierte Farben (eigene Zählung) | **25 Vorkommen in 17 Farben** — deckungsgleich mit L-02 |
| Negativkontrolle | fehlender Selektor, falscher Tokenwert, unbekannter Token, `999px`-Umbruch: alle vier erkannt |
| Verlaufsband der Farbwelten | 214 Textnennungen (Summe über alle Messungen) liegen auf `background-image` und sind aus `background-color` nicht bestimmbar. Gezielte Nachmessung über alle 12 Farbwelten-Seiten: 108 Textknoten im Band, je 2 Farbstops; **schlechtester Wert 4,80 : 1** (Label 13 px, Magenta, auf `rgb(20,28,31)`), Rot 4,81 : 1 — **0 Verstöße** gegen 4,5 : 1 |

---

## 3. Befunde

Schweregrad: **blocker** = verhindert die Freigabe des Katalogs bzw. des Pushs, **major** = muss vor dem nächsten Push behoben oder bewusst getragen werden, **minor** = Nachbesserung ohne Release-Wirkung.

### D-01 — blocker (Katalog): Befund L-03 ist sachlich falsch

**Befund.** `docs/migration-baseline/design-katalog-luecken.md` L-03 (P1) behauptet: „Es gibt keine Regel für `:invalid`, `[aria-invalid]`, `.is-error` oder `:disabled` an Feldern. Fehleingaben im Pendeltafel-Studio und im Journal sind damit nur über Fließtext erkennbar." Das ist widerlegt: `css/radiasthesie.css` L1502 (`.ptf-control [aria-invalid='true']`) und L2691–2695 (`.jr-control input[aria-invalid='true']` u. a.) stylen den Fehlerzustand, das Journal setzt zusätzlich einen 2-px-Umriss.

**Beleg.** Live gemessen: `#jrDate` mit `aria-invalid="true"` → `border-color: rgb(192, 148, 137)`, `outline: 2px solid rgb(192, 148, 137)`. `#ptfTitle` mit `aria-invalid="true"` → Rahmen bleibt `rgb(130, 146, 142)` (siehe D-02).

**Korrektur.** L-03 auf den tatsächlichen Umfang zurückschneiden: Die **generischen** Komponenten `.input`, `.select`, `.textarea` (design-system.css L1107–L1146) kennen keinen Fehler-/Deaktiviert-Zustand; die beiden Werkstätten haben eigene Regeln, von denen eine wirkungslos ist. Den Fehlerzustand zusätzlich als `DES-STA`-Eintrag katalogisieren (fehlt bisher, siehe D-07).

**Owner:** Katalog-Nachzug. **Termin:** vor der Freigabe des Katalogs im Release-Gate.

### D-02 — major (Produkt/A11y): Fehlerzustand des Pendeltafel-Studios ist wirkungslos

**Befund.** `.ptf-control [aria-invalid='true']` setzt nur `border-color`, verliert aber gegen `.ptf-control input[type='text']` (L1467–L1478), das den Rahmen als Shorthand setzt. Spezifität: (0,2,1) gegen (0,2,0). Ergebnis: `aria-invalid="true"` wird gesetzt, zwei `role="alert"`-Meldungen erscheinen, der Rahmen bleibt aber unverändert.

**Beleg.** `#ptfTitle` vor Fehler: `rgb(130, 146, 142)`; nach Fehler: `rgb(130, 146, 142)`; nach `blur()`: `rgb(130, 146, 142)` (Fokusring ausgeschlossen). Meldungen: „Überschrift darf nicht leer sein." (zweimal) und „Die Eingabe ist noch nicht gültig …". `aria-describedby` verweist nur auf `ptfTitleHint`, nicht auf die Fehlermeldung (`errorLinkedToField: false`).

**Wirkung.** Kein WCAG-Verstoß (3.3.1 ist durch Text erfüllt, 1.4.1 durch Text statt Farbe), aber der sichtbare Feldzustand fehlt und die beiden Werkstätten verhalten sich unterschiedlich.

**Fix.** Spezifität erhöhen, z. B. `.ptf-control input[type='text'][aria-invalid='true']` oder die Basisregel auf `:where()` umstellen und `outline: 2px solid var(--color-accent-rose)` wie im Journal ergänzen; Fehlermeldungs-ID in `aria-describedby` aufnehmen.

**Owner:** `design_web_layout`. **Termin:** vor dem nächsten Push.

### D-03 — major (Produkt/A11y): `.badge-remove` verletzt WCAG 2.5.8

**Befund.** Der Entfernen-Knopf in aktiven Filterbadges misst **13 × 15 px**; das Badge ist **27,5 px hoch** (Breite je Label, gemessen 115,13 px bei „Drittes Auge"). Anforderung 2.5.8 (AA): mindestens 24 × 24 px.

**Beleg.** Komponente wie in `js/modules/crystals.js` L258 gerendert, gemessen im gerenderten DOM nach einer Filteraktion (`design-system.css` L1193–L1204: `font-size: 15px; line-height: 1; padding: 0 0 0 4px; border: 0`). Werte in `evidence/design-review/probe-befunde.json` (`D03_badgeRemove`), Screenshot `filterbadge-1440.png`.

**Warum die Routenmessung das nicht findet.** Filterbadges existieren erst nach einer Filteraktion; die 84 Routenmessungen sehen den Ausgangszustand. Das ist eine belegte Abdeckungslücke der Messung, nicht ein Fehler des Befunds.

**Fix.** Trefferfläche auf ≥ 24 × 24 px bringen (Polster statt Schriftgröße, z. B. `padding: 4px 8px; min-width: 24px; min-height: 24px`), Katalognotiz in `DES-CMP-023` nachziehen. Bestätigt damit den bestehenden Befund L-07 — dessen Querverweis auf `DES-CMP-025` ist allerdings falsch (siehe D-12).

**Owner:** `design_web_layout`. **Termin:** vor dem nächsten Push.

### D-04 — minor (Produkt): doppelte IDs im Pendeltafel-Studio

**Befund.** `#ptf-title` und `#ptf-desc` existieren je zweimal auf `#pendeln/studio`.

**Beleg.** `js/modules/pendeltafel-model.js` L546–L548 erzeugt `<svg role="img" aria-labelledby="ptf-title ptf-desc"><title id="ptf-title">…</title><desc id="ptf-desc">…</desc>`. Die Funktion läuft für Vorschau und Druckblatt, beide bleiben im DOM.

**Wirkung.** Doppelte IDs sind ungültiges HTML; `aria-labelledby` löst auf das erste Vorkommen auf. Weil beide SVGs dieselbe Tafel zeigen, entsteht heute kein falscher Name — der Fehler ist aber latent.

**Fix.** ID-Präfix pro Instanz (`ptf-title`/`ptf-print-title`) und `aria-labelledby` mitgeben.

**Owner:** `design_web_layout`. **Termin:** mit dem nächsten Werkstatt-Umbau.

### D-05 — minor (Produkt): Überschriften-Sprung im Tarot-Bereich

**Befund.** Auf `#tarot` folgt auf `H2 „Deine Ziehung"` direkt `H4 „Ziehungsverlauf"`.

**Beleg.** `a11y-messung.json` → `tarot.headings.skips` bei 1440 und 390 px.

**Fix.** Zwischenüberschrift auf H3 setzen oder die H4-Ebene entfernen.

**Owner:** `design_web_layout`. **Termin:** nächste Tarot-Änderung.

### D-06 — minor (Produkt/A11y): Fehlermeldung doppelt angesagt, nicht mit dem Feld verknüpft

**Befund.** Dieselbe Meldung steht gleichzeitig in `#ptfLabelError` und `#ptfErrors` (beide `role="alert"`); das Feld referenziert sie nicht über `aria-describedby`.

**Beleg.** Live-Meldungen nach leerer Überschrift: zweimal „Überschrift darf nicht leer sein."; `#ptfTitle` → `aria-describedby="ptfTitleHint"`.

**Fix.** Eine Live-Region je Formular; die Feldfehlermeldung per `aria-describedby` (oder `aria-errormessage`) am Feld verknüpfen.

**Owner:** `design_web_layout`. **Termin:** mit D-02.

### D-07 — minor (Katalog): Zustandsliste ist unvollständig

**Befund.** Die 10 `DES-STA`-Einträge enthalten `.btn:disabled`, aber **keinen** Formular-Fehlerzustand (`aria-invalid`, `role="alert"`) und **keinen** Hover-Zustand — obwohl beide im Produkt existieren und für die Migration gebraucht werden.

**Beleg.** `design-catalog.json` → `DES-STA-001 … DES-STA-010`; Fehlerregeln in `radiasthesie.css` L1502/L2691; Hoverregeln u. a. `design-system.css` L871–L905.

**Fix.** Zwei Einträge ergänzen (Fehlerzustand Feld, Hover) und im Katalog als `must` führen.

**Owner:** Katalog-Nachzug. **Termin:** mit D-01.

### D-08 — minor (Katalog): `.tooltip` ist katalogisiert, wird aber nirgends gerendert

**Befund.** `DES-CMP-011` beschreibt den Tooltip als `should`/`shipped`; in allen 42 gemessenen Routen existiert **kein** Element mit `[data-tooltip]` oder `.tooltip`. Der P2-Befund L-08 beschreibt damit ein Risiko, das die ausgelieferte Oberfläche nicht hat.

**Beleg.** `a11y-messung.json` → `tooltips: 0` in allen Messungen; `grep -rn "data-tooltip" index.html js/ radiasthesie/` ohne Treffer.

**Fix.** Wie den Light-Block als reserviert/ungenutzt kennzeichnen (`release_relevance: none`, Status `veraltet`) oder die Regel entfernen; L-08 herabstufen.

**Owner:** Katalog-Nachzug. **Termin:** mit D-01.

### D-09 — blocker (fremder Katalog): `content-catalog.json` verletzt das eigene Schema

**Befund.** `validate-catalogs.cjs` meldet **70 Fehler und 11 Warnungen**, alle im Inhalts-Katalog; `validate-schema.cjs` meldet 1 Abweichung (16 Prüfungen). Der Design-Katalog ist in beiden Läufen fehlerfrei. Typische Fehler: fehlendes Pflichtfeld `acceptance_check` (u. a. CNT-PAG-005…011, CNT-GLO-002, CNT-SUB-102…), ungültige Enums (`CNT-LEG-002` status `fehlt`, delivery `missing`), ID-Muster (`CNT-UI-002`), `text_ref`-Format (`CNT-SUB-10x`).

**Beleg.** `node scripts/migration-baseline/validate-catalogs.cjs` → „Gesamt: 3 Datei(en), 70 Fehler, 11 Warnungen", Exitcode **1**; `node scripts/migration-baseline/validate-schema.cjs` → „content-catalog.json (Wurzel content) FEHLER …", 16 Prüfungen, 1 Abweichung, Exitcode **1**. Zum Vergleich: `verify-design-catalog.cjs`, `render-catalogs.cjs --check` und `inventory-baseline.cjs --check` enden mit 0. Fehlerverteilung der 70: 30 fehlende Pflichtfelder (davon 24 × `acceptance_check`: CNT-PAG-005…011, CNT-UI-002, CNT-GLO-002, CNT-SUB-102…112, CNT-TOP-201…203), 19 × `TEXT_REF_FORMAT` (CNT-SUB-10x ohne `#L…`-bzw. `#slug`-Suffix), 6 × `CLAIM_REF_PATTERN`, 5 × `ID_PATTERN`, 4 × `TYPE_UNKNOWN`, 3 × `ENUM` (u. a. `CNT-LEG-002` `status=fehlt`, `delivery=missing`).

**Wirkung.** Das Release-Gate kann den Katalogverbund nicht als geprüft ausweisen; die im Handoff gemeldeten „0 Fehler" galten für einen Stand ohne Medien- und Inhalts-Katalog.

**Owner:** Inhalts-Katalog / `review_approval` im Release-Gate. **Termin:** vor dem Push.

### D-10 — major (fremder Katalog): vier katalogisierte Routen existieren nicht, vier echte fehlen

**Befund.** `content-catalog.json` führt `#farbwelten/braun`, `#farbwelten/therapie`, `#farbwelten/psychologie`, `#farbwelten/licht`. Alle vier landen auf der Nicht-gefunden-Ansicht („Diese Farbwelt gibt es nicht", 153–159 Zeichen). Umgekehrt fehlen die real verlinkten Routen `#farbwelten/indigo`, `#farbwelten/lichtmedizin`, `#farbwelten/farbpsychologie`, `#farbwelten/farbtherapie` sowie `#blog/6`.

**Beleg.** `evidence/design-review/route-check.json`; das Farbregister der Oberfläche führt 12 Farben inklusive **Indigo** (kein Braun) und die drei Themenseiten `farbtherapie`, `farbpsychologie`, `lichtmedizin` (`js/data/farbwelten.js`, `TOPIC_PAGES`).

**Fix.** Routen im Inhalts-Katalog auf die tatsächlichen Slugs korrigieren; `#blog/6` ergänzen.

**Owner:** Inhalts-Katalog. **Termin:** vor dem Push.

### D-11 — Beobachtung (Inhalt/Recht): Datenschutz- und Haftungsseite sind sehr kurz

**Befund.** `datenschutz.html` hat 775 Zeichen sichtbaren Text, `haftung.html` 542 Zeichen — bei gleichzeitig vorhandener lokaler Speicherung (Favoriten, Journal, Experimentläufe) und ohne `prefers-color-scheme`-Umschaltung. Das deckt sich mit `CNT-LEG-002` (status `fehlt`) und `CLM-002/003` im Inhalts-Katalog.

**Einordnung.** Kein Design-Befund; als Risiko an das Release-Gate gemeldet, damit es nicht zwischen den Katalogen verloren geht.

### D-12 — minor (Katalog): Querverweis in L-07 zeigt auf die falsche Komponente

**Befund.** `design-katalog-luecken.md` L-07 belegt `.badge-remove` mit „`DES-CMP-025`". `DES-CMP-025` ist aber die **Wortmarke (`.logo`)**; die Entfernen-Schaltfläche ist `DES-CMP-023` („Entfernen-Schaltflaeche im Badge (.badge-remove)", `css/design-system.css` L1193–L1204).

**Beleg.** `design-catalog.json`: `DES-CMP-023` = `.badge-remove`, `DES-CMP-025` = `.logo`; L-07 in `design-katalog-luecken.md` L99.

**Wirkung.** Wer den Befund über den Querverweis nachzieht, ändert die Wortmarke statt des Badges. Kein Messfehler, aber ein falscher Verweis in einem Befund, der vor dem Push abgearbeitet werden soll.

**Fix.** L-07 auf `DES-CMP-023` umstellen (mit D-03 zusammen).

**Owner:** Katalog-Nachzug. **Termin:** mit D-01.

### Ohne Befund (bewusst entschieden)

- **Leerer `alt`-Text an 220 Bildern.** Die Kristallfotos stehen in Karten, deren Titel als H2 daneben steht; der Detaildialog liefert einen vollständigen Alternativtext. Die Tarot-Deckvorschauen stehen in einem beschrifteten Radio-Label. Das ist eine zulässige dekorative Auszeichnung — der Katalog sollte die Alt-Text-Politik trotzdem als Satz festhalten.
- **Kein `data-theme`.** Der Light-Block ist reserviert, aber nirgends aktiv; `prefers-color-scheme` wird nicht bedient. Im Katalog korrekt als nicht ausgeliefert dokumentiert.
- **796 Ziele unter 44 px.** Verstoß nur gegen 2.5.5 (AAA), nicht gegen AA.

---

## 4. Katalog-Genauigkeit: was trägt, was nicht

| Aussage des Katalogs | Prüfergebnis |
| --- | --- |
| 275 Einträge, 170 `:root`-Tokens, 13 Umbruchpunkte, 38 Präfixe | **bestätigt** |
| Jeder Token mit Wert und Zeile | **bestätigt** (170/170) |
| Jede Komponente mit existierender Quelle und Selektor im Zeilenfenster | **bestätigt** (92/92) |
| 25 hartkodierte Farben in 17 Farben | **bestätigt** (eigene Zählung, nach Kommentar- und ID-Bereinigung) |
| Kontrastwerte (`messung.json`) | **bestätigt und enger gefasst**: niedrigster Textwert 6,45 : 1; Verlaufsband nachgemessen 4,80 : 1 (0 Verstöße) |
| Fokus, Sprunglink, Dialog, mobile Navigation, Reduced Motion | **bestätigt**, zusätzlich Fokus-Rückkehr und Fokusfalle geprüft |
| L-01 (zwei Signalfarben ohne Token) | **bestätigt** (`#9db3c4`, `#c0a889` je zweimal) |
| L-07 (`.badge-remove` zu klein) | **bestätigt und präzisiert**: 13 × 15 px statt „15 px" |
| L-03 (kein Fehlerzustand an Feldern) | **widerlegt** für Studio und Journal (D-01); gilt nur für die generischen Komponenten |
| L-08 (Tooltip ohne SR-Bezug) | **gegenstandslos**: Komponente wird nicht gerendert (D-08) |
| Zustandsabdeckung (10 Zustände) | **unvollständig**: Fehler- und Hover-Zustand fehlen (D-07) |

---

## 5. Freigabeempfehlung

**Design-Teil des Katalogs: GO mit Auflagen.**

Der Katalog erfüllt, was er verspricht: Vollständigkeit der Tokens, belegbare Quellen, reproduzierbare Zählungen, unabhängig nachprüfbare Kontrast- und Laufzeitwerte. Er ist als Migrationsgrundlage brauchbar. Nicht freigabefähig ist er in fünf Textaussagen, weil sie die Migration in die Irre führen würden:

1. **D-01** L-03 korrigieren (Fehlerzustand existiert, aber einer ist wirkungslos).
2. **D-07** Fehler- und Hover-Zustand als `DES-STA` ergänzen.
3. **D-08** Tooltip als ungenutzt kennzeichnen, L-08 herabstufen.
4. **D-03** die 13 × 15 px des `.badge-remove` im Katalog als offenen AA-Verstoß führen.
5. **D-12** den Querverweis in L-07 von `DES-CMP-025` auf `DES-CMP-023` korrigieren.

**Website/Barrierefreiheit: kein Blocker in den gemessenen Zuständen, zwei Auflagen.**

- **D-03** (2.5.8, 13 × 15 px) ist ein echter AA-Verstoß und vor dem Push zu beheben.
- **D-02** ist kein WCAG-Verstoß, aber ein Design-System-Defekt: eine deklarierte Regel wirkt nicht, und die beiden Werkstätten verhalten sich unterschiedlich. Vor dem Push beheben oder bewusst als Restrisiko mit Owner tragen.

**Push: NO-GO, solange D-09 gilt.** Die Katalog-Suite ist rot — nicht wegen des Design-Katalogs, sondern wegen `content-catalog.json` (70 Fehler). D-10 (vier nicht existierende Routen) kommt hinzu. Beides gehört in die Konsolidierung/Freigabe, nicht in diese Karte.

**Was ausdrücklich nicht blockiert:** Kontrast, Fokus, Sprunglink, Dialog, Zielgrößen im Ausgangszustand, Alt-Texte, Formularnamen, Reflow bei 320 px, Reduced Motion, Konsolenfehler. Diese Punkte sind gemessen und in Ordnung; sie brauchen keine weitere Runde.

---

## 6. Offene Punkte für die Folgekarten

| Punkt | Ziel | Owner |
| --- | --- | --- |
| L-03, L-08, Fehler-/Hover-Zustand im Katalog korrigieren | `docs/migration-baseline/design-catalog.json`, `design-katalog-luecken.md` | Katalog-Nachzug (Konsolidierung) |
| L-07-Querverweis `DES-CMP-025` → `DES-CMP-023` | `docs/migration-baseline/design-katalog-luecken.md` L99 | Katalog-Nachzug (Konsolidierung) |
| Studio-Fehlerzustand reparieren (Spezifität, `aria-describedby`) | `css/radiasthesie.css`, `js/modules/radiasthesie-views.js` | `design_web_layout` |
| `.badge-remove` auf ≥ 24 × 24 px | `css/design-system.css` | `design_web_layout` |
| Doppelte IDs `ptf-title`/`ptf-desc` | `js/modules/pendeltafel-model.js` | `design_web_layout` |
| `content-catalog.json` schema-konform machen | `docs/migration-baseline/content-catalog.json` | Inhalts-Katalog / Release-Gate |
| Farbwelten-Routen im Inhalts-Katalog korrigieren | ebd. | Inhalts-Katalog |

---

## 7. Belege

| Datei | Inhalt |
| --- | --- |
| `docs/migration-baseline/evidence/design-review/a11y-messung.json` | 84 Routenmessungen, Kontrastgruppen, Zielgrößen, Bilder, Fokus, Dialog, Reduced Motion, Formularzustand, Reflow |
| `docs/migration-baseline/evidence/design-review/detail-befunde.json` | zugängliche Namen, Landmarks, doppelte IDs, Alt-Kontext, Dialoge |
| `docs/migration-baseline/evidence/design-review/route-check.json` | 28 katalogisierte Routen, Nicht-gefunden-Ansichten, Registerlinks |
| `docs/migration-baseline/evidence/design-review/catalog-crosscheck.json` | Token-/Selektor-/Umbruchprüfung, hartkodierte Farben (sauberer Lauf) |
| `docs/migration-baseline/evidence/design-review/catalog-crosscheck-negative.json` | Negativlauf: vier künstliche Fehler, alle erkannt |
| `docs/migration-baseline/evidence/design-review/probe-befunde.json` | Filterbadge 13 × 15 px, Fehlerzustand Studio/Journal, Verlaufskontrast je Farbwelt |
| `docs/migration-baseline/evidence/design-review/*.png` | Sprunglink nach Enter, Dialogfokus, Fehlerzustand Studio/Journal, Filterbadge, mobile Navigation, 320-px-Reflow |
| `scripts/migration-baseline/review-design-a11y.cjs` | Messung inkl. `--self-test` und `--quick` |
| `scripts/migration-baseline/check-design-details.cjs` | Detailprüfung |
| `scripts/migration-baseline/check-catalog-routes.cjs` | Routen-Erreichbarkeit |
| `scripts/migration-baseline/probe-design-findings.cjs` | Nachmessung der Einzelbefunde |
| `scripts/migration-baseline/verify-design-catalog-independent.cjs` | unabhängige Katalog-Gegenprüfung inkl. `--negative` |

Die Messung ist wiederholbar: gleiche Baseline, gleiches Skript, gleiche Zahlen. Abweichungen nach Produktänderungen sind erwartbar und gehören in einen neuen Lauf, nicht in eine Textkorrektur dieses Berichts.
