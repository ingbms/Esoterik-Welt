# ESOW Design-Katalog — Lücken, Risiken und Ausschlüsse

**Stand:** 2026-11-03
**Baseline:** Tag `baseline/rubriken-2026-11-03` — Commit `9f584397f8cc86a261fccdfc36dfbb8999f55ea7`
**Katalog:** `docs/migration-baseline/design-catalog.json` (275 Einträge)
**Prüfwerkzeuge:** `scripts/migration-baseline/validate-catalogs.cjs`, `scripts/migration-baseline/validate-schema.cjs`, `scripts/migration-baseline/verify-design-catalog.cjs`, `scripts/migration-baseline/render-catalogs.cjs`

Dieses Dokument ist die zweite Hälfte des Design-Katalogs: der Katalog sagt, **was** es gibt,
hier steht, **was fehlt, was driftet und was vor dem nächsten Push entschieden werden muss**.
Jeder Befund nennt Belegstelle und Messung; Behauptungen ohne Nachweis stehen hier nicht.

---

## 1. Kennzahlen der Erhebung

| Merkmal | Wert | Nachweis |
| --- | --- | --- |
| Katalogeinträge gesamt | **275** | `validate-catalogs.cjs` |
| Token-Einträge (`:root`) | **170** | `verify-design-catalog.cjs` — jede Custom Property genau einmal |
| davon Farbwelt-Tokens `--fw-*` | 84 | 12 Farben × 7 Rollen |
| Komponenten | 59 | 30 Design-System + 29 Bereichs-Stylesheets |
| Layouts | 10 | Grundgerüst, Rahmen, Raster, Seitenvorlagen |
| Muster | 5 | Einfahranimation, Staffelung, aktive Farbwelt, kursives Titelwort, Sternkarte |
| Zustände | 10 | global und bereichsübergreifend |
| Icons / Illustrationen | 2 / 6 | Inline-Symbole, Favicon, fünf Werkzeugzeichnungen, Monddiagramm |
| Umbruchpunkte | 13 | Breiten in ≥ 2 CSS-Dateien (Abschnitt 6.3 der Scope-Datei) |
| Status | 268 `final`, 7 `veraltet` | Katalog |
| Release-Relevanz | 140 `must`, 107 `should`, 28 `none` | Katalog |
| Auslieferung | 275 `shipped` | alle Quellen liegen unter der Pages-Wurzel |

### Konventionen

1. **Umschrift.** Die JSON-Felder des Katalogs schreiben Umlaute als `ae/oe/ue/ss`
   (`Flaechen`, `Pruefkriterium`); dieses Dokument behält Umlaute. Grund: die Beispiele der
   Struktur-Karte sind ebenfalls in Umschrift, und so bleibt der Katalog unabhängig von der
   Kodierung der Werkzeugkette. Keine inhaltliche Aussage ändert sich dadurch.
2. **Zeilen sind baseline-gebunden.** Jede Zeilenangabe bezieht sich auf `9f58439`.
   `verify-design-catalog.cjs` prüft, dass der Selektor im angegebenen Bereich steht — nach
   jeder Produktänderung müssen die Zeilen neu erhoben werden.
3. **Nur Existierendes.** `source.path` zeigt ausschließlich auf Dateien, die im
   Baseline-Commit liegen. Unversionierte Entwürfe aus dem Haupt-Arbeitsbaum sind
   Herkunftshinweise, keine Quellen.

---

## 2. Ausschlüsse (jedes der 38 Klassen-Präfixe ist entschieden)

Die Vollständigkeitsregel aus Abschnitt 6.1 der Scope-Datei verlangt für jedes der 38
Klassen-Präfixe aus `inventory-baseline.json` eine Entscheidung. 22 Präfixe sind
katalogisiert (als Komponente, Layout, Muster oder Zustand — darunter `container`, `section`,
`grid`, `skip`, `sr`, `animate`, `stagger`, `italic`, `crystal`), die folgenden 16 sind
**begründet ausgeschlossen**:

| Präfix | Art | Grund des Ausschlusses |
| --- | --- | --- |
| `absolute` | Utility | `.absolute { position: absolute }` — Layout-Hilfe ohne eigene Gestaltung; Wirkung steht in den Layouts, die sie nutzen |
| `fixed` | Utility | `.fixed { position: fixed }` — dito |
| `flex` | Utility | `.flex`, `.flex-col`, `.flex-wrap`, `.flex-1` — reine Anordnungs-Hilfen ohne Gestaltungsentscheidung |
| `gap` | Utility | `.gap-2/3/4/6` — Abstandswerte direkt aus dem Raster, ohne eigene Semantik |
| `h` | Utility | `.h-full` — Höhen-Hilfe |
| `inset` | Utility | `.inset-0` — Positionierungs-Hilfe |
| `items` | Utility | `.items-start/center/end` — Ausrichtungs-Hilfe |
| `justify` | Utility | `.justify-center/between` — Ausrichtungs-Hilfe |
| `mb` | Utility | `.mb-0 … .mb-8` — Aussenabstand, sieben Stufen ohne eigene Semantik |
| `mt` | Utility | `.mt-0 … .mt-8` — dito |
| `mx` | Utility | `.mx-auto` — Zentrierungs-Hilfe |
| `overflow` | Utility | `.overflow-hidden` — Beschneidungs-Hilfe |
| `relative` | Utility | `.relative { position: relative }` — Positionierungs-Hilfe |
| `rounded` | Utility | `.rounded`, `.rounded-lg/-xl/-full` — alle 2px bzw. 4px; die Radien sind als Tokens erfasst, die Hilfsklassen wiederholen sie nur |
| `text` | Utility | `.text-center/-muted/-primary/-secondary/-gold/-sm/-xs` — Typografie- und Farb-Hilfen; die Farben selbst sind als Tokens erfasst |
| `w` | Utility | `.w-full` — Breiten-Hilfe |

**Folge für die Umstellung (Befund L-04):** Diese 16 Präfixe sind der Grund, warum die
Gestaltung nicht vollständig über Komponenten beschreibbar ist. Wer eine Karte umbaut, findet
ihre Abstände nicht in der Komponente, sondern in `mt-*`/`gap-*` am Markup.

---

## 3. Lücken- und Risikoliste (priorisiert)

Priorität **P1** = blockiert die VELARKANA-Umstellung, **P2** = vor dem nächsten Push
entscheiden, **P3** = beobachten und im nächsten Katalog nachziehen.

### P1 — blockiert die Umstellung

| ID | Befund | Beleg | Empfehlung | Verantwortlich |
| --- | --- | --- | --- | --- |
| **L-01** | Zwei Signalfarben existieren nur als Hartwert: `#9db3c4` (Empirie/„Messwert") und `#c0a889` (Historisch). Beide stehen doppelt in zwei Dateien: `main.css` L2824–L2829 (`.astro-badge--empirie`, `.astro-badge--historisch`) und `radiasthesie.css` L496/L502 (`.rad-chip--a`, `.rad-chip--c`). `#9db3c4` weicht zudem um einen Kanal von `--color-accent-emerald` (`#9db3a4`) ab — echte Farbdrift. | `node scripts/migration-baseline/inventory-hardcoded-colors.cjs`; `grep -n "9db3c4\|c0a889" css/*.css` | Zwei Tokens (`--color-signal-empirie`, `--color-signal-historisch`) einführen und beide Stellen darauf umstellen; Abweichung zu `--color-accent-emerald` bewusst entscheiden | `design_web_layout` |
| **L-02** | 25 hartkodierte Farbwerte (17 verschiedene Farben) außerhalb von `:root` und Light-Block in Bereichs-Stylesheets, ohne den Druckblock und ohne die vier Mondfarben aus `js/modules/moon.js`: 4 in `main.css`, 21 in `radiasthesie.css`. Betroffen: die beiden Signalfarben (L-01), der Simulator-Verlauf (`#1b2629`, `#0e1517`, L1067), der Messing-Stroke (`#6f6042`, L1116) und zwölf Materialfarben der Pendeltafel-Schalter (L1586–L1602, L1735–L1751), die teils Tokens wiederholen (`#141c1f` = `--color-bg-card`, `#c6b38e` = `--color-primary`, `#eae6dc`/`#c09489`/`#9db3a4` = bestehende Tokens). | `node scripts/migration-baseline/inventory-hardcoded-colors.cjs` (Ausgabe listet jede Stelle mit Datei, Zeile und Selektor) | Materialpalette der Pendeltafel als Token-Familie aufnehmen oder als bewusst bereichslokal dokumentieren; Wiederholungen von Tokens durch `var()` ersetzen | `design_web_layout` |
| **L-03** | Die **generischen** Formular-Komponenten `.input`, `.select`, `.textarea` (L1107–L1146) kennen nur `default`, `hover`, `focus`, aber **keinen Fehler- und keinen Deaktiviert-Zustand**. Die beiden Werkstätten haben eigene Fehlerregeln: `.jr-control input[aria-invalid='true']` (L2691–L2695) ist wirksam und setzt Rahmen plus 2-px-Umriss; `.ptf-control [aria-invalid='true']` (L1502–L1504) setzt nur `border-color` und verliert gegen die Basisregel — der Fehlerzustand des Pendeltafel-Studios ist damit unsichtbar (gemessen, Befund D-02). | `grep -nE "aria-invalid\|:disabled" css/*.css`; `probe-befunde.json` (`D02_studio`, `D03_journal`) | Fehlerregel des Studios auf gleiche Spezifität wie das Journal bringen, `aria-describedby` um die Fehlermeldung ergänzen; Zustand ist als `DES-STA-011` katalogisiert | `design_web_layout` |
| **L-04** | 16 reine Utility-Präfixe (Abschnitt 2) tragen Gestaltung am Markup statt in Komponenten. Bei der Umstellung ist nicht entscheidbar, welche Abstände zu welcher Komponente gehören. | Abschnitt 2; `inventory-baseline.json` → `class_prefixes` | Beim Umbau je Bereich die Utilities in Komponenten-Regeln überführen; Reihenfolge in der Umstellungsplanung | `design_web_layout` |

### P2 — vor dem nächsten Push entscheiden

| ID | Befund | Beleg | Empfehlung | Verantwortlich |
| --- | --- | --- | --- | --- |
| **L-05** | **28 der 170 Tokens** werden von keiner ausgelieferten Deklaration verwendet: 7 Chakra-Farben (`--color-chakra-*`), 9 Legacy-Aliase (`--color-primary-light/-dark`, `--color-secondary*`, `--color-accent-gold`, `--border-glow-subtle` — nur noch in `_tarot_old.js`/`*.bak`), `--space-0`, `--space-20`, `--radius-xl`, `--radius-2xl`, `--shadow-sm/-md/-lg/-xl/-glow-strong`, `--z-modal`, `--footer-height`, `--font-weight-light/-bold`. 7 davon sind als `veraltet` geführt. | Katalog `release_relevance: none` (28 Einträge); `verify-design-catalog.cjs` zählt Verwendungen | Entfernen oder begründet behalten; die Chakra-Farben sind laut CSS-Kommentar Inhaltsdaten — dann als solche kennzeichnen statt als UI-Token führen | `design_web_layout` |
| **L-06** | `.btn-small` und `.btn-sm` sind zwei Namen für dieselbe Regel (L899–L905). Ein Name ist ein Rest aus einer früheren Fassung. | DES-CMP-005, `notes` | Einen Namen abschaffen, Markup und Katalog nachziehen | `design_web_layout` |
| **L-07** | `.badge-remove` ist **13 × 15 px** groß (gemessen), das umgebende Badge 27,5 px hoch. WCAG 2.5.8 (Minimum 24 × 24 px, AA) ist damit nicht erfüllt. Die Routenmessung findet das nicht, weil Filterbadges erst nach einer Filteraktion entstehen. | `DES-CMP-023`, `css/design-system.css` L1193–L1204; `probe-befunde.json` (`D03_badgeRemove`), `filterbadge-1440.png` | Trefferfläche auf mindestens 24 × 24 px erweitern (Polster statt Schriftgröße) | `design_web_layout` |
| **L-08** | **gegenstandslos für die ausgelieferte Oberfläche**: `.tooltip` ist als Komponente definiert und katalogisiert, aber in allen 42 gemessenen Routen existiert kein Element mit `[data-tooltip]`. Der ursprüngliche Befund (Tooltip-Inhalte nur in `data-tooltip`, kein Screenreader-Bezug) beschreibt ein Risiko, das die Baseline nicht hat. | `DES-CMP-011`, `css/design-system.css` L1065–L1101; `a11y-messung.json` (`tooltips: 0`); `grep -rn "data-tooltip" index.html js/ radiasthesie/` ohne Treffer | Komponente als reserviert/ungenutzt führen (`release_relevance: none`, Status `veraltet`); bei späterer Einführung `aria-describedby` einplanen | `design_web_layout` |
| **L-09** | 22 verschiedene Umbruchbreiten, davon 9 nur in einer Datei (380, 420, 520, 632, 701, 768, 781, 901, 1199px). Das ist keine gemeinsame Skala, sondern gewachsene Bereichsentscheidung. | `inventory-baseline.json` → `breakpoints`; Katalog DES-BP-001…013 | Vereinheitlichung ist eine Designänderung mit Regressionsrisiko — Entscheidung E-06 offen | `design_web_layout` |
| **L-10** | Die im Projekt dokumentierte „normative" Designquelle (`docs/art-direction-nachtatelier/` mit `STYLEGUIDE.md`, `DESIGN.md`, `tokens.json`) existiert im Baseline-Commit **nicht** (Verzeichnis fehlt im Arbeitsbaum vollständig). Der Katalog kann sich deshalb nur auf `css/design-system.css` stützen. | `ls docs/art-direction-nachtatelier` → nicht vorhanden; `docs/design-tokens.md` verweist darauf | Entscheidung E-01/E-02 faktisch beantwortet: Quelle ist das ausgelieferte CSS. Das Paket entweder versionieren und als Absichtsdokument führen oder den Verweis in `docs/design-tokens.md` korrigieren | `architect` |
| **L-11** | `--font-mono` verweist auf Systemschriften (`ui-monospace`, `SFMono-Regular`, `Cascadia Mono`, `Menlo`, `monospace`). Es wird keine Datei ausgeliefert; die Darstellung von Zahlenkolonnen ist plattformabhängig. | DES-TOK (Token `--font-mono`), `assets/fonts/` enthält nur Fraunces und Manrope | Entweder Monospace-Datei beilegen oder die Abhängigkeit als bewusst akzeptieren | `design_web_layout` |

### P3 — beobachten

| ID | Befund | Beleg | Empfehlung |
| --- | --- | --- | --- |
| **L-12** | Es gibt keine visuelle Regression. Die elf Screenshots in `evidence/design/` sind eine Momentaufnahme, kein Soll-Ist-Vergleich. | `docs/migration-baseline/evidence/design/*.png` | Screenshot-Vergleich (Playwright + Pixel-Diff) als CI-Schritt ergänzen, wenn die Umstellung beginnt |
| **L-13** | `--color-border` liegt mit 2,02:1 unter 3:1. Das ist zulässig, solange die Linie rein dekorativ ist; alle orientierungstragenden Linien nutzen `--color-line-strong` (5,88:1). | Messung `messung.json`; DES-TOK (`--color-border`) | Bei jeder neuen Verwendung prüfen, ob die Linie Information trägt — dann `--color-line-strong` |
| **L-14** | Druckfarben (`#000`, `#fff`, `#777`) sind hartkodiert, ebenso die vier Mondfarben in `js/modules/moon.js`, der Simulator-Verlauf und der Messing-Stroke. Für den Druck und die physikalische Darstellung ist das begründet und im CSS kommentiert. | Kommentarblock am Ende von `css/design-system.css`; L-02 | Kein Handlungsbedarf; bei der Umstellung nicht in Tokens zwingen |
| **L-15** | Zwei Klassennamen für eine Regel (`.btn-sm` und `.btn-small`) sowie der Druckzustand `.ptf-print-active` (Pendeltafel-Studio, `radiasthesie.css` L1886–L1920) sind Sonderfälle, die nur über Markup bzw. JavaScript-Marken wirken. | DES-STA-010; DES-CMP-005 | Beim Umbau der Pendeltafel mitführen, Altnamen bereinigen |

---

## 4. Status der offenen Eigentümerentscheidungen

Die Scope-Datei führt acht Entscheidungen (Abschnitt 11). Der Design-Katalog beantwortet
davon keine eigenmächtig — er hält fest, was der Beleg erzwingt, und was offen bleibt.

| ID | Frage | Status nach dieser Erhebung |
| --- | --- | --- |
| E-01 | Ist `docs/art-direction-nachtatelier/` die normative Quelle? | **Faktisch beantwortet, formal offen:** das Verzeichnis existiert im Baseline-Commit nicht (L-10). Der Katalog kann nur `css/*.css` belegen; ein Eintrag mit `source.path` auf ein nicht existierendes Paket wäre ein Fehler. |
| E-02 | `css/design-system.css` oder `tokens.json` als Quelle? | **Entschieden durch die Prüfregel:** `tokens.json` existiert im Release nicht, `SOURCE_NOT_FOUND` würde greifen. Alle 170 Tokens belegen `css/design-system.css` mit Zeile. |
| E-03 | Werden die 12 Markdown-Artikel veröffentlicht? | Offen — keine Designfrage, betrifft den Inhalts-Katalog. |
| E-04 | Bleibt der Restbestand öffentlich abrufbar? | Offen — Produktentscheidung; der Katalog führt die Aliase, die nur dort referenziert werden, als `veraltet` (L-05). |
| E-05 | Wird `public/` gelöscht? | Offen — `public/` ist in der Scope-Datei ausgeschlossen und im Katalog nicht erfasst. |
| E-06 | Sollen die 9 bereichslokalen Umbruchbreiten vereinheitlicht werden? | Offen — Befund L-09 dokumentiert die Abweichung, ändert aber nichts. |
| E-07 | `data/crystals.json` (30) oder `js/data/crystals.js` (36)? | Offen — Inhaltsfrage, nicht Design. |
| E-08 | Wie viele Komponenten umfasst das Designsystem? | **Beantwortet:** 59 katalogisierte Komponenten + 10 Layouts + 4 Muster; 16 der 38 Präfixe sind begründet ausgeschlossen (Abschnitt 2). Die Zahl ist eine Kurationsentscheidung, keine Messung — die Herleitung ist nachprüfbar. |

---

## 5. Grenzen dieser Erhebung (was der Katalog nicht leistet)

1. **Kein Figma, keine Designquelle außerhalb des Codes.** Es gibt keine Absichtsdatei im
   Release; der Katalog beschreibt den Ist-Stand, nicht die Absicht.
2. **Keine vollständige Erfassung aller 1.570 CSS-Blöcke.** Katalogisiert sind die
   wiederverwendbaren Bausteine, Layouts, Muster und Zustände; bereichslokale
   Unterelemente (z. B. `.fw-tafel__field`, `.ptf-control`, `.exp-mode-body`) sind über
   ihre Basis-Komponente erfasst und stehen nicht als eigener Eintrag.
3. **Zeilennummern veralten.** Sie sind gegen `9f58439` erhoben. Nach jeder CSS-Änderung
   meldet `verify-design-catalog.cjs` die betroffenen Einträge (`SELECTOR_RANGE`).
4. **`acceptance_check` ist ein Vorschlag, kein bestandener Test.** Ob das Kriterium die
   Sache trifft, entscheidet die Abnahme; das Skript prüft nur Länge und Zeichenvorrat.
5. **Elf Screenshots, vier Viewports, vier Seiten.** Gemessen wurden `#home` bei 1440/1024/780/390px,
   `#farbwelten/rot` bei 1440 und 390px, `#frequenzen` bei 1440px, `radiasthesie/glossar.html`
   bei 1440px sowie Dialog, Sprunglink und mobile Navigation. Nicht gemessen: alle übrigen Rubriken,
   Zwischenbreiten (z. B. 640/900px), Druckausgabe und Screenreader-Ausgabe.
6. **Kontraste sind aus den gerenderten Token-Werten berechnet**, nicht mit einem
   Farbmessgerät auf einem Bildschirm. Die Formel ist WCAG 2.x; die Werte stehen in
   `evidence/design/messung.json`.
7. **Keine Aussage über Gestaltungsqualität.** Der Katalog sagt, was existiert und ob es
   belegt ist — nicht, ob es gut aussieht.

---

## 6. Prüfnachweise

Alle Befehle wurden im Arbeitsbaum auf Branch `wt/t_cbbf71e0` über `9f58439` ausgeführt
(Node v24.13.0, Windows 11).

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Struktur und Enums | `node scripts/migration-baseline/validate-catalogs.cjs` | 275 Einträge, **0 Fehler, 0 Warnungen**, Exit 0. Hinweis: `content-catalog.json` und `media-catalog.csv` fehlen noch (Folgekarten) |
| Beispiele weiterhin gültig | `node scripts/migration-baseline/validate-catalogs.cjs --examples` | 3 Dateien, 0 Fehler, 2 beabsichtigte Warnungen, Exit 0 |
| JSON-Schema (ajv, draft 2020-12) | `node scripts/migration-baseline/validate-schema.cjs` | `design-catalog.json` OK gegen `#/$defs/designCatalog`; **14 von 14** Negativfällen abgelehnt; 15 Prüfungen, 0 Abweichungen |
| Vollständigkeit und Belegbarkeit | `node scripts/migration-baseline/verify-design-catalog.cjs` | 275 Einträge, 170 Tokens, 13 Umbruchpunkte, 38 Präfixe (16 ausgeschlossen): **0 Fehler, 0 Warnungen** |
| Lesbare Fassungen | `node scripts/migration-baseline/render-catalogs.cjs --check` | `design-tokens.json` OK, `design-system.md` OK; `content-catalog.md` übersprungen (Inhalts-Karte), Exit 0 |
| Ist-Bestand unverändert | `node scripts/migration-baseline/inventory-baseline.cjs --check` | OK — `inventory-baseline.json` entspricht dem Arbeitsbaum, Exit 0 |
| Hartkodierte Farben | `node scripts/migration-baseline/inventory-hardcoded-colors.cjs` | 25 Vorkommen in 17 Farben außerhalb der Token (Befunde L-01/L-02) |
| Gerendertes Layout | `node scripts/migration-baseline/measure-design.cjs` | 4 Viewports (1440/1024/780/390), 4 Bereichsseiten, **kein horizontaler Überlauf**, **0 Konsolenfehler**; 11 Screenshots + 2 Messdateien |

### Was die Laufzeitmessung belegt

| Beobachtung | Wert | Womit |
| --- | --- | --- |
| Seitenhintergrund | `rgb(11, 16, 18)` | `messung.json` → `viewports.*.bodyBackground` |
| Innenabstand des Rahmens | 64px bei 1440px, 32px bei 1024/780px, 24px bei 390px | identisch mit `--gutter`; kein hartkodierter Wert |
| H1-Größe | 80px / 66px / 66px / 52px | folgt `--text-h1` und den Media-Overrides |
| Kopfzeilenhöhe | 100px, bei 390px 84px | folgt `--header-height` |
| Kein horizontaler Überlauf | `scrollWidth == innerWidth` in allen 8 Messungen | `bodyOverflowX: false` |
| Sprunglink | erstes Tab-Ereignis fokussiert ihn, `transform: none`, Umriss 2px, y=12px | `interactions.skipLink` |
| Dialog | öffnet, `role="dialog"` und `aria-modal="true"` am Hintergrund, Schließen 44×44px, Fokus im Dialog, Hintergrundscrollen gesperrt, Escape schließt | `interactions.modal` / `modalClosed` |
| Mobile Navigation | Klick setzt `.nav.open`, Liste wird `flex`, Zielhöhe 48px | `interactions.mobileNav` |
| Kontraste | Text/Grund 15,36:1 · Sekundärtext/Karte 9,09:1 · Sand/Grund 9,33:1 · funktionale Linie 5,88:1 · dekorative Linie 2,02:1 · `--fw-rot-ink` auf Rot-Tiefe 4,81:1 | `contrast` in `messung.json` |
| Konsolenfehler | 0 in allen Läufen | `consoleErrors` |

**Nicht belegt:** Aussagen über die übrigen Rubriken, Zwischenbreiten (z. B. 640/900px),
Druckausgabe, Screenreader-Ausgabe und die Gestaltungsqualität. Diese Grenzen stehen in
Abschnitt 5.


---

## 7. Nachzug im Release-Gate (Karte `t_9c2a7824`, 2026-11-03)

Die unabhaengige Pruefung (`docs/migration-baseline/design-review-usability-a11y.md`, Commit `8892586`)
hat fuenf Aussagen dieser Liste korrigiert. Sie sind hier nachgezogen, damit die Lueckenliste
nicht hinter dem Katalog zurueckbleibt:

| Befund | Was falsch war | Nachzug |
| --- | --- | --- |
| L-03 | Behauptete, es gebe gar keine Fehlerregel an Feldern. Die Werkstaetten haben welche; die des Pendeltafel-Studios ist wirkungslos. | Text korrigiert, Zustand als `DES-STA-011` katalogisiert (D-01/D-07) |
| L-07 | Querverweis zeigte auf `DES-CMP-025` (Wortmarke). Groesse war mit „15px" statt 13 × 15 px angegeben. | Verweis auf `DES-CMP-023`, Messwert praezisiert, `release_relevance: must` fuer die Komponente (D-03/D-12) |
| L-08 | Beschrieb ein Tooltip-Risiko, das die Baseline nicht hat: die Komponente wird auf keiner Route gerendert. | Als gegenstandslos gekennzeichnet; `DES-CMP-011` auf `veraltet`/`none` gesetzt (D-08) |
| — | Fehler- und Hover-Zustand fehlten als `DES-STA`-Eintraege. | `DES-STA-011` (Fehlerzustand) und `DES-STA-012` (Hover) ergaenzt (D-07) |

Belegdatei der Aenderungen: `docs/migration-baseline/evidence/release-gate/design-katalog-nachzug.json`.
Der Katalog zaehlt damit 277 Eintraege (vorher 275).
