# Frequenzlabor — UI-Umsetzung, Messungen und Prüfnachweis

Stand: 2026-11-02 · Ticket: Kanban `t_6b8164b3` · Basis: `origin/main` @ `b18bdb3`
Nachtrag: 2026-11-03 · Ticket `t_9564a3d5` (P11: interne Verlinkung, Quellendokument im Build, Landingpage-Entscheidung) · siehe §12
Verbindlich: [`docs/adr-frequenzlabor.md`](adr-frequenzlabor.md) (ADR-0001), Datenvertrag: [`data/frequencies.json`](../data/frequencies.json), Quellen: [`docs/frequenz-quellen.md`](frequenz-quellen.md)

Dieses Dokument beschreibt, **was gebaut wurde**, **wie es gemessen wurde** und **wo die Umsetzung bewusst vom ADR abweicht**. Alle Zahlen sind mit den unten genannten Befehlen erhoben, nicht geschätzt.

---

## 1. Umfang

Die Kategorie „Frequenzen & Schwingungen“ besteht aus fünf Ansichten derselben Seite:

| Route | Ansicht | Inhalt |
| --- | --- | --- |
| `#frequenzen` | Hub | Erklärstück „Was ist Schwingung?“ (366 Wörter, gemessen am gerenderten Abschnitt), Frequenzbibliothek mit 41 Einträgen, Quellen, dauerhafter Disclaimer |
| `#frequenzen/labor` | Werkzeug | Frequenz-Slider + Zahlenfeld, Wellenform, Pegel mit sichtbarem Deckel, Play/Pause/Weiter/Stopp, Sweep, Schwebung, Presets, binaurale Demo, 432/440-Vergleich, Oszillogramm |
| `#frequenzen/quellen` | Dokument | rendert `docs/frequenz-quellen.md` lesbar (Überschriften, Tabellen, Codeblöcke, Quellenverzeichnis); Rohdatei bleibt verlinkt |
| `#frequenzen/cymatics` | Folgestufe P9 | Chladni-Muster für zwei Modenpaare, Knotenlinien, Textentsprechung, Modellgrenzen — siehe [frequenzlabor-p9-p10.md](frequenzlabor-p9-p10.md) |
| `#frequenzen/meditation` | Folgestufe P10 | Meditationssitzung mit Dauer, Preset, Fades, Timer, lokalen Favoriten und Wiederaufnahme — siehe [frequenzlabor-p9-p10.md](frequenzlabor-p9-p10.md) |
| `#frequenzlabor` | Alias | wird per `history.replaceState()` auf `#frequenzen/labor` normalisiert — beim Kaltstart, bei In-Document-Sprüngen und bei Back/Forward |

Navigation, Footer und Startseiten-Register (jetzt sieben Karten) verlinken den Bereich; zusätzlich verlinkt der Hub kontextuell in Astrologie, Kristalle und Wissensbereich (§12).

## 2. Dateien

| Datei | Verantwortung |
| --- | --- |
| `js/modules/frequenzlabor.js` | Controller/View: Rendering der fünf Ansichten, Events, Fokus, Fehlertexte, Pause/Weiter, Sweep-Fortschritt, `halt()` beim Ansichtswechsel |
| `js/modules/markdown-lite.js` | 275-Zeilen-Markdown-Leser für `#frequenzen/quellen`: escapter Text, nur sichere Linkziele, Tabellen/Zitate/Codeblöcke |
| `js/modules/frequenz-presets.js` | Laden (HTTP `fetch` / eingebettetes JSON), Validierung, Wiedergabe-Mapping, Präferenzen |
| `js/modules/frequenz-visualisierung.js` | Canvas-Renderer, rAF nur bei laufendem Ton, statische Welle bei reduzierter Bewegung |
| `js/modules/frequenz-flags.js` | Feature-Flags mit lokalem URL-Override (`?fq=+cymatics,-binaural`); `cymatics`/`meditation` sind seit dem ADR-Nachtrag §13 ausgeliefert |
| `js/modules/frequenzlabor-loader.js` | 30-Zeilen-Lazy-Proxy, einziger statischer Import im Initialpfad |
| `css/frequenzlabor.css` | `.fq-*`-Styles, ausschließlich Design-Tokens (3.951 B gzip im integrierten Build, Grenze 6.000 B) |
| `scripts/check-frequenz-budget.cjs` | Budget-Gate NFR-1/2/3 |
| `tests/frequenz-presets.mjs` | 13 Vertragstests für Mapping, Flags, Storage, Laden |
| `tests/markdown-lite.mjs` | 15 Vertragstests für den Markdown-Leser (inkl. Render des echten Quellendokuments) |
| `tests/link-check.spec.js` | Interne Linkprüfung; um vier Fälle für Frequenzverlinkung und Quellendokument erweitert (P11) |
| `tests/frequenzlabor.spec.js` | 16 Playwright-Fälle U1–U16 (U15/U16 aus der M-1- und der Pause-Nachbesserung) |
| `js/modules/frequenz-chladni.js`, `js/modules/frequenz-meditation-model.js` | Folgestufe P9/P10 (DOM-frei) |
| `js/modules/frequenz-cymatics-view.js`, `js/modules/frequenz-meditation-view.js` | Folgestufe P9/P10 (Ansichten, lazy) |
| `tests/frequenz-chladni.mjs`, `tests/frequenz-meditation.mjs`, `tests/frequenzlabor-p9-p10.spec.js` | Tests der Folgestufe (C1–C8, M1–M9, Browserfälle) |

Zehn bestehende Teststellen zählten sechs Startseiten-Karten; sie erwarten jetzt sieben und führen `frequenzen` in der Modul- und Routenliste (ADR §6.6). `tests/astrologie.spec.js` nutzt außerdem wie `playwright.config.cjs` den `E2E_PORT`, statt fest auf 3100 zu zeigen.

### 2.1 Budget und Reserve (bewusst überwacht)

NFR-1 (initialer statischer JS-Graph) ist mit **85.822 B von 86.275 B** gzip-9 zu **99,5 %** ausgelastet; die Reserve beträgt nur **453 B**. Das Gate in `scripts/check-frequenz-budget.cjs` schlägt bei Überschreitung fehl (Exitcode 1). Zusätzlich gibt es seit dem QA-Befund m-5 eine **Warnschwelle bei 95 % Auslastung** (`WARN_RATIO`): Bleibt das Budget eingehalten, aber die Reserve unter 5 %, zeigt die Tabelle `WARN`, das Skript schreibt eine Warnzeile ins Log und der Lauf bleibt grün — so wird die Warnung nicht als Fehlschlag umgangen und trotzdem sichtbar.

Die Reserve ist damit bewusst klein und dauerhaft beobachtet: Jede weitere statische Zeile im Initialpfad (`js/main.js` und dessen statische Importe) muss gegen diese 453 B gerechnet werden. Feature-Code gehört in die Lazy-Module (`js/modules/frequenz*.js`, NFR-2 hat großen Abstand). Aufruf: `npm run check:frequenz-budget`, im CI-Job `unit-test` verankert.

### 2.2 Testinfrastruktur: dedizierter Port, kein Server-Reuse

Seit der Härtung aus QA-Befund m-3 beziehen **alle** Browser-Specs Port und Basis-URL aus `tests/helpers/e2e-target.cjs`: Standardport ist **3310** (nicht der Vorschau-Port 3100), `E2E_PORT`/`BASE_URL` bleiben als Overrides erhalten. `playwright.config.cjs` und `playwright.qa.config.js` setzen `reuseExistingServer: false` auch lokal und starten `scripts/serve-e2e.cjs`; das Skript bricht mit eindeutiger Meldung ab, wenn der Port belegt ist, statt einen fremden oder veralteten Server zu übernehmen.

## 3. Interaktion und Zustand

| Bedienelement | Verhalten | Tastatur |
| --- | --- | --- |
| Frequenz-Slider (`#fqFreqRange`) | logarithmisch 20–20.000 Hz, 1.000 Schritte; koppelt Zahlenfeld und Readout | Pfeiltasten (nativ), Home/End |
| Zahlenfeld (`#fqFreqNumber`) | `change` klemmt auf 20–20.000, ungültige Eingabe stellt den letzten Wert wieder her und meldet den Fehlertext | Tab, Tippen |
| Wellenform (`#fqWaveform`) | Sinus/Dreieck/Rechteck/Sägezahn; Rechteck und Sägezahn erhalten −6 dB Trim (Engine) | natives `<select>` |
| Pegel (`#fqGainRange`) | −60 … −6 dBFS, Start −20 dBFS; Deckel als eigenes Label sichtbar; die Engine klemmt zusätzlich selbst | Pfeiltasten |
| Ton starten / Stopp | `engine.play()` im Klick-Handler (kein `await` davor), Stopp blendet 20 ms aus | Enter/Leertaste |
| Pause / Weiter (`#fqPause`, ein Umschaltknopf) | „Pause“ ruft `stop()` und merkt den Pause-Zustand im Controller, „Weiter“ ruft `play()` mit den dort gehaltenen Werten; kein dritter Audiozustand, Ansage über `#fqStatus`; „Stopp“ löscht den Pause-Zustand (ADR §4.4, NFR-27) | Enter/Leertaste |
| Sweep | von/bis/Dauer (0,1–60 s), exponentiell, Fortschrittsbalken mit `role="progressbar"` | Enter auf Start/Abbrechen |
| Schwebung | Grundton + Differenz → `playTones([f, f+Δ])`, zwei Stimmen mit halbiertem Gain | Enter auf „Schwebung hören“ |
| Preset-Auswahl | nur hörbare Einträge, Format „Name — Hz (Status)“ | natives `<select>` |
| Binaural | vier Band-Presets, Träger + Differenz, Hinweis „Kopfhörer nötig“ | Enter |
| 432/440 | zwei Einzeltöne mit gleichem Pegel; Beschriftung sagt ausdrücklich „einzelne Sinustöne, keine Stimmungen“ | Enter |
| Ansichtswechsel | `show()` rendert, fokussiert die H1 (`tabindex="-1"`), `onHide()` stoppt Audio | Tab-Reihenfolge, sichtbarer Fokus |

Zusätzlich stoppt Audio bei `visibilitychange → hidden` und `pagehide`. Ein blockierter `AudioContext` erzeugt eine sichtbare, wiederholbare Fehlermeldung (`role="alert"`), keinen stillen Fehlschlag.

## 4. Wiedergabe-Mapping

Reihenfolge (ADR §8.2 plus Datenhinweis aus `t_2b60eff1`):

1. gültiges `playback`-Feld am Datensatz,
2. `partner_hz` → zwei Stimmen im selben Kanal (Schwebung), Gain je 1/n (die Engine teilt durch die Stimmenzahl),
3. Allowlist hörbarer Einzeltöne: 9 Solfeggio-Werte + 432 + 440 Hz,
4. sonst `mode: "none"` mit dem Text „Nicht abspielbar: Zahlenwert zur Einordnung.“

Ergebnis für den gelieferten Datensatz: **13 von 41 Einträgen hörbar** (9 Solfeggio inklusive 174/285/963 Hz, 440, 432, 440+444 Schwebung, binaurale Schwebung). Schumann (7,83 Hz), EEG-Bänder, 40-Hz-Stimulation, Obertonreihe (110 Hz), Infraschall und Ultraschall sowie die neuen Themen Rife 727 Hz, Bioresonanz, Chladni/Cymatics, Klangschalen, Mantra „Om“ und Chakren bleiben ausdrücklich ohne Ton — die letzten sechs tragen dafür `playback: {"mode": "none"}` im Datensatz.

## 5. Gestaltung

- **Tokens:** ausschließlich `--color-*`, `--space-*`, `--text-*`, `--radius-*`, `--font-*` aus `css/design-system.css`; keine eigenen Farben, keine Schatten, 2-px-Radien, 4-px-Raster.
- **Typografie:** H1 `--text-page-title` (56 px, mobil 34 px), Abschnittstitel Fraunces 28 px, Panel-Titel Fraunces 20 px, Frequenzwerte in `--font-mono` mit `tabular-nums`, Fließtext Manrope 16 px.
- **Evidenz-Badges:** Text plus Farbe (WCAG 1.4.1), vier Stufen mit eigenen Rahmen: „Belegt“ (Emerald), „Plausibel“ (Sand), „Nicht belegt“ (Rose), „Traditionell“ (Textprimary + starke Linie).
- **Bibliothek:** einspaltiges Raster ab 360 px, zwei Spalten ab ~700 px, drei bis vier ab 1000 px (`auto-fill minmax(300px, 1fr)`), Karten mit `align-items: start`, damit kurze Einträge keine leeren Flächen erzeugen.
- **Labor:** zweispaltig ab 1024 px (Bedienung links, Oszillogramm rechts und sticky), darunter einspaltig.
- **Diagnose-Optik:** Das Oszillogramm ist eine 1-px-Rasterfläche in `--color-bg-deep` mit Sand-Wellenform; das Canvas trägt keine Beschriftung, alle Werte stehen als Text daneben.

## 6. Barrierefreiheit — gemessen

**Lighthouse 12.6.1** (Chromium, lokaler Build, 2026-11-02):

| URL | Kategorie | Score |
| --- | --- | --- |
| `#frequenzen` | Accessibility | **100** |
| `#frequenzen/labor` | Accessibility | **100** |

Rohdaten: `evidence/t_6b8164b3/lighthouse-hub-accessibility.json` und `…-lab-accessibility.json`. Vor der Underline-Korrektur lag der Lab-Score bei 97 (einziger Befund: `link-in-text-block` für „Quellendokument“); Fließtext-Links sind jetzt zusätzlich zur Farbe unterstrichen.

**Kontrast (berechnet, WCAG 2.1):**

| Vordergrund | auf `#141c1f` | auf `#0b1012` |
| --- | --- | --- |
| Text primär `#eae6dc` | 13,86:1 | 15,36:1 |
| Text sekundär `#babdb7` | 9,09:1 | 10,07:1 |
| Sand `#c6b38e` | 8,42:1 | 9,33:1 |
| Emerald `#9db3a4` | 7,75:1 | 8,58:1 |
| Rose `#c09489` | 6,45:1 | 7,14:1 |
| Linie stark `#82928e` | 5,31:1 | 5,88:1 |

Alle Text- und Badge-Kombinationen liegen über 4,5:1; die Sand-Schaltfläche (dunkler Text auf Sand) erreicht 9,33:1.

**Weitere Prüfungen:**

- **Tastatur:** alle Bedienelemente sind native `<button>`, `<input>`, `<select>`; Play per Enter (U9), Fokus nach Ansichtswechsel auf `#frequenzen-title`, sichtbarer Fokusring (1 px, 12 px Offset, damit er nicht wie ein Eingabefeld wirkt).
- **Live-Regionen:** `#fqStatus` (`role="status"`, `aria-live="polite"`) mit Drosselung auf maximal eine Ansage pro Sekunde; Slider-Eingaben lösen keine Ansage aus. Fehler laufen über `role="alert"`.
- **Canvas:** `aria-hidden="true"`; die Textentsprechung sind Frequenz, Periode, Wellenlänge, Pegel und Zustand als `<dl>`.
- **Reduzierte Bewegung:** `matchMedia('(prefers-reduced-motion: reduce)')` verhindert den Start der rAF-Schleife; das Canvas zeigt eine statische Welle, ein Hinweis erklärt das. Messung U10: **0 rAF-Aufrufe** in 600 ms bei laufendem Ton.
- **Touch-Ziele:** kleinste Höhe aller sichtbaren Buttons/Selects/Inputs im Labor bei 360 px: **44 px** (U11).
- **Kein horizontaler Scroll** bei 360/768/1440 px (`scrollWidth === innerWidth`, U11 und Messung §7).

**Nicht maschinell geprüft:** manuelle Screenreader-Durchläufe (NVDA/VoiceOver) und echte Audiogeräte — das liegt beim QA-Ticket `t_835bd1e9`.

## 7. Responsive-Messungen

Erhoben mit 360 × 800, 768 × 900 und 1440 × 900 (Chromium, DPR 1):

| Breite | Bibliothek | Oszillogramm (CSS) | Transport | Überlauf |
| --- | --- | --- | --- | --- |
| 360 px | 1 Spalte, 284 px Karte | 284 × 138 px | sticky unter dem Header (sichtbar bei Scrollmitte) | nein |
| 768 px | 2 Spalten, 344 px Karte | 652 × 284 px | sticky unter dem Header | nein |
| 1440 px | 4 Spalten, 316 px Karte | 551 × 240 px | statisch (Oszillogramm sticky) | nein |

Das Canvas-Bitmap entspricht der CSS-Größe × `min(devicePixelRatio, 2)`; der DPR-Deckel greift, es wird pro Frame nur ein wiederverwendetes `Float32Array(2048)` beschrieben.

Screenshots: `hub-360/768/1440.png`, `lab-360/768/1440.png`, `lab-360-scrolled.png`, `lab-1440-reduced-motion.png`.

## 8. Testmatrix (tatsächliche Ergebnisse)

| Suite | Befehl | Ergebnis |
| --- | --- | --- |
| Engine + Presets/Flags + Modelle | `npm run test:frequenz` | **67 pass, 0 fail** (21 Engine E1–E20, 13 Presets P1–P8, 15 Markdown, 8 Chladni C1–C8, 10 Meditation M1–M9) |
| UI-Browserfälle | `npx playwright test tests/frequenzlabor.spec.js` | **16 pass, 0 fail** (U1–U16; U15/U16 kamen mit `t_b78a89a5`/`t_f2a0868c` hinzu) |
| Folgestufe P9/P10 (Browser) | `npx playwright test tests/frequenzlabor-p9-p10.spec.js` | **19 pass, 0 fail** |
| Vollständige Browser-Suite | `E2E_PORT=3441 CI=1 npm run test:e2e` | **113 pass, 0 fail** in 11 Dateien (inkl. Astrologie, Mond, Tarot, Smoke, Link-Check) |
| Offline-Datei | `npm run test:offline` | **2 pass** (inkl. eingebettetem `#local-frequencies-data` und Quellendokument) |
| Lokaler Einstieg | `node --test tests/local-entry.cjs` | **6 pass, 2 skip** (7 Karten, 6 Module) |
| Budget | `npm run check:frequenz-budget` | NFR-1 85.822 B / 86.275 B (**WARN**, 99,5 % Auslastung, Reserve 453 B) · NFR-2 47.002 B / 100.000 B · NFR-3 3.951 B / 6.000 B (integrierter Stand, §2.1) |
| Lint/Format | `npm run lint`, `npm run format:check` | 0 Fehler, Prettier clean |

Konsole: U1 prüft `console.error`/`pageerror` auf beiden Ansichten. Zusätzlich lief ein eigener Konsolen-Probe über beide Ansichten bei 360/768/1440 px mit Filterwechsel, Preset-Play, Sweep, Schwebung, Binaural, 432-Hz-Vergleich, Wellenform- und Pegelwechsel: **0 Meldungen** (`error`, `warning`, `pageerror`, `requestfailed`).

## 9. Bewusste Abweichungen vom ADR

1. **Debug-Handle im Lazy-Modul statt in `js/main.js` (ADR §6.2.8).** `window.EsoterikWelt.frequenz = { getState, getAnalyserData }` wird beim ersten Laden des Labors gesetzt. Ein statischer Engine-Import in `main.js` würde die Engine in den Initialgraphen ziehen und NFR-1/NFR-5 verletzen. Der Handle ist read-only und steuert nichts.
2. **ID-basierter Binaural-Override in `frequenz-presets.js`.** Der Datensatz beschreibt `binaurale-schwebung` ausdrücklich als kanalgetrennt („440 Hz links, 444 Hz rechts“). Die ADR-Allowlist hätte daraus einen Summenton gemacht, also eine andere Demonstration als die beschriebene. Der Override ist auf genau diese eine ID begrenzt und im Code kommentiert; alle anderen Einträge folgen ausschließlich den Daten.
3. **`js/modules/package.json` mit `{"type":"module"}`.** Ohne diese Datei kann `node --test` die Browser-ES-Module nicht importieren (`package.json` des Repos ist `commonjs`). Browser und Webpack sind davon unberührt; so konnten die Mapping- und Storage-Tests als echte node-Tests entstehen statt als Copy-Paste-Duplikate.
4. **Transportleiste sticky nach oben (`top: var(--header-height)`) statt unten.** `position: sticky; bottom: 0` bleibt bei einem Element am Seitenanfang wirkungslos (gemessen: `transportBottom = -2109` bei Scrollmitte). Mit `top` bleibt die Leiste ab 1024 px abwärts beim Scrollen unter dem Header erreichbar (NFR-22) und überdeckt keine fixierten Elemente.
5. **Generierte Rechtsseiten nicht neu eingecheckt.** `npm run build` regeneriert auch `Lokal-impressum.html` usw.; diese Dateien trugen bereits vor diesem Ticket veraltete CSS-Stände. Sie wurden bewusst nicht Teil des Diffs, um unrelated Rauschen zu vermeiden. `Lokal.html` ist neu erzeugt, weil dort die neue Seite, das Frequenz-JSON und das gebündelte Modul hineingehören.

## 10. Datenbefund für den Daten-Owner

`data/frequencies.json` → `disclaimer.lautstaerke` sagt: „Die Audio-Engine begrenzt die Ausgabe hart auf −20 dBFS“. Vertrag und Implementierung begrenzen hart auf **−6 dBFS**, der Startpegel ist −20 dBFS (ADR §4.2, NFR-7/8). Die UI rendert dieses Feld deshalb **nicht**, sondern zeigt die tatsächlich wirksamen Werte („Startpegel −20 dBFS“, „Deckel: −6 dBFS“). Der Text im Datensatz sollte auf „Startpegel −20 dBFS, harte Grenze −6 dBFS“ korrigiert werden; das ist eine Änderung am Datenbestand, nicht an der Oberfläche.

## 11. Offene Grenzen

- Kein Test auf echten Audiogeräten, in Safari/iOS oder mit manuellem Screenreader. Die Eigentümerabnahme A5 (`t_4a8106de`, 03.11.2026) erfolgte ausdrücklich als Betreiber-Freigabe ohne vollständige Protokollbögen; Belegklasse, Restrisiken und der offene Major-Befund R2-1 (`t_26387037`) stehen in [qa-restrisiken-r1r3.md](qa-restrisiken-r1r3.md) §10.
- Hash-Routen bleiben nicht indexierbar (ADR AD-8); die P11-Entscheidung dazu ist gefallen (keine statische Landingpage, ADR §10, Umsetzung §12).
- `localStorage` wird nur auf `change`/`blur` geschrieben; blockierte Speicherung deaktiviert die Persistenz, nicht das Labor.
- Die 1-Hz-Frequenzgenauigkeit ist keine UI-Eigenschaft; sie wird über `OfflineAudioContext` im Engine-Ticket gemessen (ADR §9.1/E18), nicht über den AnalyserNode.

## 12. Interne Verlinkung und Quellendokument (P11, `t_9564a3d5`)

**Befund (Review `t_a0f14bb2`, B6):** Der Bereich verlinkte nur auf sich selbst, den Alias und die Rohdatei. `href="docs/frequenz-quellen.md"` lieferte auf GitHub Pages rohes Markdown und im gebauten Preview einen 404, weil `scripts/build-pages.cjs` `docs/` nicht kopierte (gemessen: `curl .../Esoterik-Welt/docs/frequenz-quellen.md` → 404).

**Interne Verlinkung — vier kontextuelle Links statt einer Linkliste:**

| Ort | Ziel | Linktext im Fließtext | Begründung |
| --- | --- | --- | --- |
| Hub, „Traditionelle Zuordnungen“ | `#astrologie` | „Astrologie-Bereich“ | Planetenfrequenzen sind oktavierte Umlaufperioden; die Deutung gehört in die Astrologie, nicht in die Akustik |
| dito | `#blog/3` | „Wissensartikel ‚Kristalle für jedes Chakra‘“ | Chakra-Zuordnungen sind der häufigste Anlass, Frequenzen zu suchen |
| dito | `#crystals` | „Kristall-Katalog“ | derselbe Steinbestand, gefiltert nach Chakra/Farbe |
| Abschnitt „Quellen und Methode“ | `#blog` | „Wissensbereich“ | Hintergrundartikel statt Rohdaten |

Die Links stehen in `.fq-prose`/`.fq-lede`/`.fq-note`, sind unterstrichen (WCAG 1.4.1, Farbe allein trägt nicht), haben beschreibenden Linktext und keine Wiederholung von Schlüsselwörtern. Die Bereichsnavigation führt die drei festen Einträge (`Bibliothek`, `Frequenzlabor`, `Quellen & Methodik`); bei aktiven Flags kommen `Chladni-Muster` und `Meditation` hinzu. Genau ein Eintrag trägt `aria-current="page"`.

**Quellendokument im Build:**

- `scripts/build-pages.cjs` kopiert `docs/frequenz-quellen.md` (31.220 B) einzeln nach `dist/Esoterik-Welt/docs/`; fehlt die Datei, bricht der Build mit einer Meldung ab. Der übrige `docs/`-Baum (ADRs, Reviews, Konzepte) bleibt bewusst intern.
- Neue Ansicht `#frequenzen/quellen` rendert dasselbe Dokument über `js/modules/markdown-lite.js` (275 Zeilen): Ausgabe wird zuerst escaped, Links sind auf `http(s)`/`mailto`/`tel`/relative Ziele begrenzt, Unbekanntes bleibt Text. Gemessen im Build: 1 H2 (Dokumenttitel), 13 H3, 10 H4, 7 Tabellen mit 27 `th scope="col"`, 12 Listen, 3 Codeblöcke, 3.718 Wörter, 24 Links.
- Tabellen sind als `role="region" tabindex="0"` mit `aria-label="Tabelle n: <erste Kopfzelle>"` waagerecht scrollbar und per Tastatur erreichbar (WCAG 2.1.1); Codeblöcke sind ebenfalls fokussierbar.
- Der Link auf die Rohdatei bleibt erhalten („Markdown-Datei“ im Hub, „Markdown-Datei im Projekt“ in der Ansicht) und antwortet im Preview mit `200` und `text/markdown; charset=UTF-8`.
- Im Offline-Exemplar ist das Markdown als `<script id="local-frequenz-quellen" type="text/plain">` eingebettet (`scripts/build-local.cjs`); dort entfällt der Rohdatei-Link. Über `file://` geprüft: 7 Tabellen, kein Fehlertext, keine Konsolenmeldung.
- Die Ansicht setzt eigene Metadaten (`PAGE_META.frequenzenQuellen` in `js/main.js`); Canonical bleibt `https://ingbms.github.io/Esoterik-Welt/`, `sitemap.xml` ist unverändert (ADR §10).
- `tests/link-check.spec.js` wertet jetzt wie `playwright.config.cjs` `E2E_PORT` aus. Vorher prüfte die Suite fest Port 3100 und konnte dort einen fremden Vorschauserver treffen (QA-Befund m-3); das war beim ersten Lauf dieses Tickets reproduzierbar.

**Umsetzungsentscheidung: gerenderte Ansicht statt nur Dateikopie.** Die Kopie der Markdown-Datei allein hätte den 404 behoben, aber rohes Markdown ausgeliefert. Deshalb liest `#frequenzen/quellen` dieselbe Datei und rendert sie; es entsteht keine zweite Textfassung, die driften könnte. Ein handgeschriebener Markdown-Leser statt einer neuen Abhängigkeit hält den Build offline-fähig und ohne Supply-Chain-Zuwachs (`dependencies` unverändert: nur `express`).

**Tests (tatsächliche Läufe des P11-Tickets am 2026-11-03, Chromium 156, Node 24.13 lokal / 20 in CI; integrierter Gesamtstand in §8):**

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Vertragstests inkl. Markdown-Leser | `npm run test:frequenz` | **49 pass, 0 fail** (21 Engine, 13 Presets, 15 Markdown) |
| Link- und Quellenfälle | `E2E_PORT=3501 CI=1 npx playwright test tests/link-check.spec.js` | **7 pass, 0 fail** (3 bestehende + 4 neue) |
| Vollständige Browser-Suite | `E2E_PORT=3512 CI=1 npm run test:e2e` | **92 pass, 0 fail** |
| Gebauter Build (Server + Routen) | `npm run verify:build` | **36 Seiten/Viewports, 0 Fehler** |
| Offline-Datei | `npm run test:offline` | **2 pass** (jetzt inkl. eingebettetem Quellendokument) |
| Budget | `npm run check:frequenz-budget` | NFR-1 85.822 B / 86.275 B · NFR-2 29.601 B / 100.000 B · NFR-3 3.521 B / 6.000 B |
| Lint/Format | `npm run lint`, `npm run format:check` | 0 Fehler, Prettier clean |
| Lighthouse Accessibility | `npx lighthouse … --only-categories=accessibility` | `#frequenzen` **100**, `#frequenzen/labor` **100**, `#frequenzen/quellen` **100** (jeweils 0 fehlgeschlagene Audits, Lighthouse 12.6.1) |

**Grenzen:** Der Markdown-Leser deckt die im Dokument verwendeten Konstrukte ab (Überschriften, Absätze, Listen, Tabellen, Codeblöcke, Zitate, Trennlinien, inline Code/Fett/Kursiv/Links, nackte URLs). Neue Konstrukte wie Bilder, Fußnoten oder Referenzlinks würden als Text erscheinen statt zu brechen; der Test „Das echte Quellendokument rendert vollständig“ schlägt fehl, sobald eine künftige Fassung Elemente einführt, die er nicht kennt.

## 13. Folgestufe P9/P10

Der ADR-Nachtrag §13 liefert die zweite Stufe aus: `#frequenzen/cymatics` (Chladni-Muster als idealisiertes Modell, ohne Frequenzzuordnung) und `#frequenzen/meditation` (Sitzung mit Timer, Fades, lokalen Favoriten und Wiederaufnahme). Beide Ansichten hängen an den vorhandenen Flags, werden per dynamischem `import()` geladen und verändern den Initialgraphen nicht (NFR-1 im integrierten Build 85.822 B; der Zuwachs gegenüber 85.613 B stammt aus P11, nicht aus P9/P10).

Umsetzung, Messwerte, Testmatrix und Grenzen stehen in [frequenzlabor-p9-p10.md](frequenzlabor-p9-p10.md). Für dieses Dokument ändern sich drei Punkte: die Kategorie hat fünf statt drei Ansichten, die Bereichsnavigation ergänzt bei aktiven Flags `Chladni-Muster` und `Meditation` (weiterhin genau ein `aria-current="page"`), und das Stylesheet wächst um die P9/P10-Regeln (im Build gemessen, Grenze 6.000 B).
