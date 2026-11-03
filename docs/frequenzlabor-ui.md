# Frequenzlabor — UI-Umsetzung, Messungen und Prüfnachweis

Stand: 2026-11-02 · Ticket: Kanban `t_6b8164b3` · Basis: `origin/main` @ `b18bdb3`
Verbindlich: [`docs/adr-frequenzlabor.md`](adr-frequenzlabor.md) (ADR-0001), Datenvertrag: [`data/frequencies.json`](../data/frequencies.json), Quellen: [`docs/frequenz-quellen.md`](frequenz-quellen.md)

Dieses Dokument beschreibt, **was gebaut wurde**, **wie es gemessen wurde** und **wo die Umsetzung bewusst vom ADR abweicht**. Alle Zahlen sind mit den unten genannten Befehlen erhoben, nicht geschätzt.

---

## 1. Umfang

Die Kategorie „Frequenzen & Schwingungen“ besteht aus zwei Ansichten derselben Seite:

| Route | Ansicht | Inhalt |
| --- | --- | --- |
| `#frequenzen` | Hub | Erklärstück „Was ist Schwingung?“ (308 Wörter), Frequenzbibliothek mit 32 Einträgen, Quellen, dauerhafter Disclaimer |
| `#frequenzen/labor` | Werkzeug | Frequenz-Slider + Zahlenfeld, Wellenform, Pegel mit sichtbarem Deckel, Play/Pause/Weiter/Stopp, Sweep, Schwebung, Presets, binaurale Demo, 432/440-Vergleich, Oszillogramm |
| `#frequenzlabor` | Alias | wird per `history.replaceState()` auf `#frequenzen/labor` normalisiert — beim Kaltstart, bei In-Document-Sprüngen und bei Back/Forward |

Navigation, Footer und Startseiten-Register (jetzt sieben Karten) verlinken den Bereich.

## 2. Dateien

| Datei | Verantwortung |
| --- | --- |
| `js/modules/frequenzlabor.js` | Controller/View, 1.089 Zeilen: Rendering beider Ansichten, Events, Fokus, Fehlertexte, Pause/Weiter, Sweep-Fortschritt |
| `js/modules/frequenz-presets.js` | Laden (HTTP `fetch` / eingebettetes JSON), Validierung, Wiedergabe-Mapping, Präferenzen |
| `js/modules/frequenz-visualisierung.js` | Canvas-Renderer, rAF nur bei laufendem Ton, statische Welle bei reduzierter Bewegung |
| `js/modules/frequenz-flags.js` | Feature-Flags mit lokalem URL-Override (`?fq=+cymatics,-binaural`) |
| `js/modules/frequenzlabor-loader.js` | 30-Zeilen-Lazy-Proxy, einziger statischer Import im Initialpfad |
| `css/frequenzlabor.css` | `.fq-*`-Styles, ausschließlich Design-Tokens (2.883 B gzip) |
| `scripts/check-frequenz-budget.cjs` | Budget-Gate NFR-1/2/3 |
| `tests/frequenz-presets.mjs` | 13 Vertragstests für Mapping, Flags, Storage, Laden |
| `tests/frequenzlabor.spec.js` | 16 Playwright-Fälle U1–U16 |

Zehn bestehende Teststellen zählten sechs Startseiten-Karten; sie erwarten jetzt sieben und führen `frequenzen` in der Modul- und Routenliste (ADR §6.6). `tests/astrologie.spec.js` nutzt außerdem wie `playwright.config.cjs` den `E2E_PORT`, statt fest auf 3100 zu zeigen.

### 2.1 Budget und Reserve (bewusst überwacht)

NFR-1 (initialer statischer JS-Graph) ist mit **85.613 B von 86.275 B** gzip-9 zu **99,2 %** ausgelastet; die Reserve beträgt nur **662 B**. Das Gate in `scripts/check-frequenz-budget.cjs` schlägt bei Überschreitung fehl (Exitcode 1). Zusätzlich gibt es seit dem QA-Befund m-5 eine **Warnschwelle bei 95 % Auslastung** (`WARN_RATIO`): Bleibt das Budget eingehalten, aber die Reserve unter 5 %, zeigt die Tabelle `WARN`, das Skript schreibt eine Warnzeile ins Log und der Lauf bleibt grün — so wird die Warnung nicht als Fehlschlag umgangen und trotzdem sichtbar.

Die Reserve ist damit bewusst klein und dauerhaft beobachtet: Jede weitere statische Zeile im Initialpfad (`js/main.js` und dessen statische Importe) muss gegen diese 662 B gerechnet werden. Feature-Code gehört in die Lazy-Module (`js/modules/frequenz*.js`, NFR-2 hat großen Abstand). Aufruf: `npm run check:frequenz-budget`, im CI-Job `unit-test` verankert.

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

Ergebnis für den gelieferten Datensatz: **10 von 32 Einträgen hörbar** (6 Solfeggio, 440, 432, 440+444 Schwebung, binaurale Schwebung). Schumann (7,83 Hz), EEG-Bänder, 40-Hz-Stimulation, Obertonreihe (110 Hz), Infraschall und Ultraschall bleiben ausdrücklich ohne Ton.

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
| Engine + Presets/Flags | `npm run test:frequenz` | **34 pass, 0 fail** (21 Engine E1–E20, 13 Presets P1–P8) |
| UI-Browserfälle | `npx playwright test tests/frequenzlabor.spec.js` | **16 pass, 0 fail** (U1–U16; U15/U16 kamen mit `t_b78a89a5`/`t_f2a0868c` hinzu) |
| Vollständige Browser-Suite | `npm run test:e2e` (Port 3310, eigener Serverstart) | **89 pass, 0 fail** (inkl. Astrologie, Mond, Tarot, Smoke) |
| Offline-Datei | `npm run test:offline` | **2 pass** (inkl. eingebettetem `#local-frequencies-data`) |
| Lokaler Einstieg | `node --test tests/local-entry.cjs` | **6 pass, 2 skip** (7 Karten, 6 Module) |
| Budget | `npm run check:frequenz-budget` | NFR-1 85.613 B / 86.275 B (**WARN**, 99,2 % Auslastung) · NFR-2 28.843 B / 100.000 B · NFR-3 2.903 B / 6.000 B (Stand nach Pause-Ergänzung und Testinfra, §2.1) |
| Lint/Format | `npm run lint`, `npx prettier --check` | 0 Fehler |

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

- Kein Test auf echten Audiogeräten, in Safari/iOS oder mit manuellem Screenreader — QA-Ticket `t_835bd1e9`.
- Hash-Routen bleiben nicht indexierbar (ADR AD-8, P11 entscheidet über eine statische Landingpage).
- `localStorage` wird nur auf `change`/`blur` geschrieben; blockierte Speicherung deaktiviert die Persistenz, nicht das Labor.
- Die 1-Hz-Frequenzgenauigkeit ist keine UI-Eigenschaft; sie wird über `OfflineAudioContext` im Engine-Ticket gemessen (ADR §9.1/E18), nicht über den AnalyserNode.
