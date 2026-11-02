# QA-Abnahme — Frequenzen & interaktives Frequenzlabor

Stand: 2026-11-02 · Ticket: Kanban `t_835bd1e9` · Prüfobjekt: `origin/feature/frequenzlabor-ui` @ `580ed53` (Basis `origin/main` @ `b18bdb3`, PR #6)
Auftrag: unabhängige Qualitätssicherung gegen Auftrag und [ADR-0001](adr-frequenzlabor.md).
Methode: eigener Testplan, eigene Messroutinen, echte Browser — keine Übernahme der Umsetzer-Tests als Nachweis.

**Ergebnis: keine Blocker. Ein Major-Befund (M-1), drei Minor-Befunde. Freigabeempfehlung mit Auflage: M-1 vor dem Merge beheben.**

---

## 1. Prüfumgebung

| Punkt | Wert |
| --- | --- |
| Arbeitsbaum | `C:\Users\mas\Arbeit\Esoterik-Welt-qa`, detached HEAD `580ed53`, `git diff origin/main` für Produktdateien leer |
| Build | `npm run build` (statischer Build `dist/Esoterik-Welt/`, Offline-Datei `Lokal.html`) |
| Server | `node index.js` auf isoliertem Port (QA-Config `reuseExistingServer: false`) |
| Betriebssystem | Windows 11 |
| Node / npm | v24.13.0 / 11.8.0 |
| Playwright | 1.64.1 |
| Browser | Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2 (Playwright-Builds) |
| Viewports | 1440×900 Desktop, 393×851 (Pixel 5), 360×640 Touch |
| Audio | Headless ohne Audiogerät; gemessen wird der Signalpfad (OfflineAudioContext) und der Engine-/Graphzustand, nicht der Schalldruck im Raum |

**Wichtiger Umgebungsbefund:** Auf Port 3100 lief ein fremder, veralteter Vorschauserver (`main` ohne Frequenzbereich). Der erste Suite-Lauf mit `reuseExistingServer: !CI` hat diesen Server übernommen und dadurch 14 Fälle falsch als „failed" gemeldet. Die QA-Konfiguration nutzt deshalb einen eigenen Port und `reuseExistingServer: false`; der ungültige Lauf ist als `evidence/t_835bd1e9/protokolle/playwright-chromium-stale-server-invalid.txt` archiviert, der saubere Lauf als `playwright-chromium.txt` (88/88).

## 2. Reproduktion

```bash
# 1. Prüfstand aufsetzen
git worktree add C:/Users/mas/Arbeit/Esoterik-Welt-qa origin/feature/frequenzlabor-ui --detach
cd C:/Users/mas/Arbeit/Esoterik-Welt-qa
npm ci && npx playwright install firefox webkit
npm run build

# 2. Unabhängige QA-Suite (35 Fälle × 4 Projekte: Chromium, Firefox, WebKit, mobiles Chromium)
QA_PORT=3326 npx playwright test --config=playwright.qa.config.js

# 3. Messreihe (Frequenz, Pegel, Sweep, Kontrast, rAF, Mobil) + Screenshots
QA_BASE=http://127.0.0.1:3321/Esoterik-Welt node evidence/t_835bd1e9/scripts/measure.cjs

# 4. Regressionen und Budget
npm run lint && npx prettier --check "**/*.{js,cjs,mjs,html,css}" --ignore-unknown
npm run test:pages && npm run test:crystals && npm run test:frequencies && npm run test:frequenz
npm run test:astrologie && npm run test:tarot && npm run test:tarot:decks && npm run test:moon
npm run test:offline && npm run test:local && npx jest --silent
E2E_PORT=3310 npm run test:e2e
npm run check:frequenz-budget
```

Die QA-Suite liegt unter `qa/` und ist von der Feature-Suite getrennt (`playwright.qa.config.js`), damit beide Sätze unabhängig berichtet werden können.

## 3. Testmatrix mit Traceability

Anforderung → Testfall → Ergebnis. „Bestanden" heißt: in Chromium **und** Firefox (und, wo zutreffend, im mobilen Kontext) tatsächlich ausgeführt und grün.

| Nr. | Anforderung (Quelle) | Testfall | Ergebnis | Beleg |
| --- | --- | --- | --- | --- |
| T1 | Wiedergabe startet und stoppt korrekt (Auftrag; ADR U4) | QF-01, QF-02 | **bestanden** — 0 `AudioContext` vor Interaktion, Start → `running` (440 Hz), Stopp → `idle`, Stopp-Knopf deaktiviert, kein doppelter Oszillatorsatz | `01-funktional.spec.js`, `measurements.json` |
| T2 | Frequenzgenauigkeit ≤ 1 Hz bei Sinus (Auftrag; ADR §9.1/E18) | QF-10 … QF-16, QM-01 | **bestanden** — größte Abweichung 0,0007 Hz (Chromium 0,0006 Hz bei 5 kHz) | Tab. 4.1 |
| T3 | Lautstärke-Cap greift (Auftrag; NFR-7/8, U6) | QF-18, QF-19, QF-20 | **bestanden** — Wunsch +12 dBFS → Spitze 0,50119 (−6,00 dBFS), Slider max −6, Label „Deckel: −6 dBFS" | Tab. 4.2 |
| T4 | Sweep-Laufzeit (Auftrag; E8) | QF-21, QF-22 | **bestanden** — 1,5 s Sweep: 1577 ms (Chromium) / 1627 ms (Firefox), Endfrequenz 800 Hz, Abbruch meldet „Sweep abgebrochen." | Tab. 4.3 |
| T5 | Preset-Auswahl (Auftrag; U7, P2) | QF-23, QF-24, QF-25 | **bestanden** — Bibliothek „solfeggio-528" spielt 528,000 Hz, Labor-Preset „kammerton-440" spielt 440,000 Hz; 10 hörbare Presets, Schumann nicht dabei | `01-funktional.spec.js` |
| T6 | Quellenlinks (Auftrag; §8, P8) | QF-27 | **bestanden** — 26 Quellenlinks, alle `https://`, `target="_blank"`, `rel="noopener noreferrer"`; 6 Einträge ohne Link mit Quellentext; `#fq-quellen` verlinkt Quellendokument und Datensatz | Tab. 4.5 |
| T7 | Disclaimer sichtbar (Auftrag; NFR-11) | QF-28 | **bestanden** — Hub und Labor: „kein Medizinprodukt", Gehörschutz-Hinweis, 20-kHz-Hinweis sichtbar | `01-funktional.spec.js` |
| T8 | Navigation erreichbar (Auftrag; U1/U2/U12) | QF-29 … QF-32 | **bestanden** — Navi-Link öffnet `#frequenzen`, Alias `#frequenzlabor` → `#frequenzen/labor`, Zurück/Vorwärts, Audio stoppt beim Verlassen und bei `pagehide` | `01-funktional.spec.js` |
| T9 | Zwei Browser + mobiler Viewport, Autoplay/AudioContext-Sperre (Auftrag) | QM-01, QF-03, QF-33 | **bestanden für Chromium + Firefox + mobiles Chromium**; blockierter Context erzeugt sichtbare `role="alert"`-Meldung und Status `error`. **WebKit nicht prüfbar** (Build ohne Web Audio), Safari/iOS offen | Abschnitt 5, R-1 |
| T10 | Reine Tastaturbedienung (Auftrag; NFR-13/U9) | QA-01, QA-02, QA-03 | **bestanden** — alle Kernbedienelemente per Tab erreichbar, sichtbarer Fokusring, Enter/Leertaste starten/stoppen, Pfeiltasten bewegen den Slider, Zahlenfeld klemmt auf 20/20 000 | `02-barrierefreiheit.spec.js` |
| T11 | Screenreader-Stichprobe: Labels werden vorgelesen (Auftrag; NFR-14/15/16) | QA-04, QA-05 | **bestanden auf Accessibility-Baum-Ebene** — sprechende Namen für Start/Stopp, Slider, Zahlenfeld, Pegel, Wellenform, Preset; Canvas `aria-hidden`; Status `role="status" aria-live="polite"`; Evidenzstatus immer als Text. Manueller NVDA-/VoiceOver-Test **nicht** durchgeführt | `02-barrierefreiheit.spec.js` |
| T12 | Kontrastmessung (Auftrag; NFR-19) | QA-06 | **bestanden** — kleinster gemessener Wert 7,75:1 (Badge), Labor min. 8,42:1; gefordert 4,5:1 | Tab. 4.4 |
| T13 | Reduzierte Bewegung (Auftrag; NFR-18) | QA-07 | **bestanden** — `prefers-reduced-motion: reduce`: 0 rAF-Aufrufe/s bei laufendem Ton, statischer Hinweis sichtbar, Messwerte im DOM | Tab. 4.6 |
| T14 | Regressionen grün, Bundle-Budget (Auftrag; NFR-1/2/3) | QR-01 … QR-09 | **bestanden mit einem plattformbedingten Ausreißer** — 88/88 Browser-E2E, alle Node-Suiten grün außer `test:tarot:decks` (CRLF, s. m-4); Budgets eingehalten | Abschnitt 7 |
| T15 | QA-Dokument mit Evidenz und Befundliste (Auftrag) | — | **erfüllt** — dieses Dokument + `evidence/t_835bd1e9/` | — |

Zusätzlich geprüft (nicht im Auftrag, aber im ADR gefordert): Lazy-Loading (NFR-5) — vor der Navigation kein `frequenz-engine.js`-Request, danach genau einer; Zahlenfeld-Klemmen (NFR-14); Statusansage nach Start (NFR-15).

## 4. Messergebnisse

Alle Werte mit `evidence/t_835bd1e9/scripts/measure.cjs` erzeugt (`measurements.json`), nicht geschätzt.

### 4.1 Frequenzgenauigkeit (OfflineAudioContext 48 kHz, Nulldurchgang + Goertzel-Scan 0,05 Hz)

| Soll | Chromium Ist | Abweichung | Firefox Ist | Abweichung | Spitze |
| --- | --- | --- | --- | --- | --- |
| 20 Hz (3 s) | 20,0000 | 0,0000 | 19,9997 | −0,0003 | 0,100 |
| 100 Hz | 100,0000 | 0,0000 | 100,0003 | +0,0003 | 0,100 |
| 440 Hz | 440,0000 | 0,0000 | 439,9998 | −0,0002 | 0,100 |
| 528 Hz | 528,0000 | 0,0000 | 528,0000 | 0,0000 | 0,100 |
| 1000 Hz | 1000,0000 | 0,0000 | 1000,0005 | +0,0005 | 0,100 |
| 5000 Hz | 4999,9994 | −0,0006 | 4999,9993 | −0,0007 | 0,100 |

Toleranz ≤ 1 Hz: **eingehalten mit Faktor > 1000 Reserve.** Der Goertzel-Peak liegt in allen Fällen exakt auf der Sollfrequenz. Der `AnalyserNode` (fftSize 2048, Bin-Breite ≈ 23,4 Hz) wurde auftragsgemäß **nicht** als Messgerät verwendet.

Zusätzlich belegt: die UI kommandiert die gewählte Frequenz wirklich an den Graph (Oszillator-Tap: 440 → 528 Hz exakt), und der Graph läuft nach dem Klick (`contextState: running`).

### 4.2 Pegel und Deckel

| Prüfung | Ergebnis |
| --- | --- |
| Startpegel | −20 dBFS (Spitze 0,100) in beiden Browsern |
| Wunsch +12 dBFS (Engine-Setter) | geklemmt auf −6 dBFS, Spitze **0,50119** = −6,00 dBFS |
| UI-Slider | `min=-60`, `max=-6`, Anzeige „Deckel: −6 dBFS", Startanzeige „−20 dBFS" |
| Zwei Stimmen (Preset/Schwebung) | Voice-Gain 1/n, Summe bleibt unter dem Deckel (Engine-Test E19 zusätzlich grün) |

### 4.3 Sweep

| Messung | Chromium | Firefox |
| --- | --- | --- |
| Soll 1,5 s, 200 → 800 Hz | 1577 ms | 1627 ms |
| Endfrequenz | 800 Hz | 800 Hz |
| Status nach Ende | „Sweep beendet bei 800 Hz." | dito |
| Fortschrittsbalken | `aria-valuenow` steigt, nach Ende ausgeblendet | dito |
| Abbruch | „Sweep abgebrochen.", Sweep-Zustand `null` | dito |

Die Überschreitung von 5–8 % ist Mess- und Poll-Overhead (Klick → Statusabfrage), nicht die Rampendauer: Die Engine plant die Rampe exakt auf `start + seconds`.

### 4.4 Kontrast (WCAG 2.1 AA, berechnet aus computed styles)

| Element | Verhältnis | Gefordert |
| --- | --- | --- |
| H1 „Frequenzen & Schwingungen" (56 px) | 15,36:1 | 3,0 |
| Fließtext `.fq-lede` | 10,07:1 | 4,5 |
| Eintragstitel | 13,86:1 | 4,5 |
| Eintragsbeschreibung | 9,09:1 | 4,5 |
| Evidenz-Badge | 7,75:1 | 4,5 |
| Quellenlink | 8,42:1 | 4,5 |
| Disclaimer (kurz/lang) | 9,09 / 10,07:1 | 4,5 |
| Pegel-Deckel `.fq-gain-cap` | 8,42:1 | 4,5 |
| Panel-Titel | 13,86:1 | 4,5 |

### 4.5 Inhalte und Quellen (DOM-Messung)

| Größe | Wert |
| --- | --- |
| Bibliothekseinträge | 32 |
| Evidenz-Badges (jeder Eintrag, Text + Farbe) | 32 |
| Quellenlinks (`https`, `noopener noreferrer`, neues Fenster) | 26 |
| Einträge ohne Link, aber mit Quellentext | 6 |
| Hörbare Presets | 10 von 32 |
| Nicht abspielbare Einträge mit Hinweis statt Knopf | 22 |

### 4.6 Bewegung, Mobile, Tastatur

| Messung | Ergebnis |
| --- | --- |
| rAF-Aufrufe/s bei reduzierter Bewegung und laufendem Ton | 0 (Chromium, Firefox) |
| Horizontaler Überlauf bei 360 px (Hub und Labor) | 0 px |
| Touch-Ziele | Start 48 px, Stopp 48 px, Sweep 44 px, Preset 44 px, Pegel-Slider 44 px |
| Tap auf „Ton starten" (mobiler Kontext) | `running` |
| Tab-Reihenfolge ab H1 | Skip-Link → Start → Stopp → Frequenz-Slider → Zahlenfeld → Wellenform → Pegel → Sweep-Felder → Sweep-Start → … → Preset; jedes Element mit Fokusring |
| Fokus nach Ansichtswechsel | `#frequenzen-title` (H1, `tabindex="-1"`) |

### 4.7 Bundle-Budget (`npm run check:frequenz-budget`)

| ID | Ist (gzip -9) | Limit | Reserve |
| --- | --- | --- | --- |
| NFR-1 Initialgraph (17 Dateien, 291 343 B roh) | 85 613 B | 86 275 B | 662 B (0,8 %) |
| NFR-2 Feature-JS (6 Dateien, 108 533 B roh) | 27 882 B | 100 000 B | 72 118 B |
| NFR-3 Feature-CSS | 2 903 B | 6 000 B | 3 097 B |

## 5. Browser- und Plattformmatrix

| Prüfung | Chromium 156 | Firefox 157 | WebKit 27.2 (Windows-Build) | Mobiles Chromium (Pixel 5) |
| --- | --- | --- | --- | --- |
| Seite rendert, 32 Einträge | ja | ja | ja | ja |
| Autoplay: 0 `AudioContext` vor Interaktion | ja | ja | nicht prüfbar (keine Web-Audio-API) | ja |
| Start → `running`, Stopp → `idle` | ja | ja | nicht prüfbar | ja |
| Offline-Signal ±1 Hz | ja (≤0,0006 Hz) | ja (≤0,0007 Hz) | nicht prüfbar | nicht erneut gemessen (gleiche Engine) |
| Deckel 0,50119 | ja | ja | nicht prüfbar | — |
| Sweep-Zeit | 1577 ms | 1627 ms | nicht prüfbar | — |
| Blockierter Context → sichtbarer Fehler | ja | ja | nicht prüfbar | — |
| Tastatur/Fokus | ja | ja | ja (ohne Audio-Teil) | — |
| Kontrast/Mobile/Touch | ja | ja | ja | ja |

**Autoplay- und Sperrverhalten:** In Chromium und Firefox wird der `AudioContext` erst im Klick-Handler erzeugt (0 Konstruktionen beim Laden, 1 nach dem Start). Ein simuliert blockierter Context (`state='suspended'`, `resume()` → `NotAllowedError`) führt zu einer sichtbaren Meldung in `#fqError` (`role="alert"`) und Status `error`, wiederholbar bei erneutem Klick — kein stiller Fehlschlag. Das entspricht ADR §7.3.

**WebKit-Hinweis:** Der Playwright-WebKit-Build für Windows enthält keine Web-Audio-API; die Audiofälle sind dort als „nicht prüfbar" übersprungen (29 Skips), nicht als Fehler gewertet. Ein echter Safari-/iOS-Test (inkl. Autoplay-Politik und `webkitAudioContext`) ist damit **nicht** abgedeckt (R-1).

## 6. Barrierefreiheit — praktisch geprüft

- **Tastatur:** kompletter Durchlauf ohne Maus; Slider und Zahlenfeld reagieren auf Pfeiltasten; Enter und Leertaste lösen Start/Stopp aus; der Fokus bleibt nach Ansichtswechsel auf der H1; Fokusring an jedem Element nachweisbar (`outline`/`box-shadow`).
- **Screenreader-Stichprobe:** Accessibility-Baum über `ariaSnapshot()` geprüft — „Ton starten", „Stopp", Slider „Frequenz, logarithmisch 20–20.000 Hz", „Frequenz in Hz", „Lautstärke", „Wellenform", „Hörbares Preset" werden als Namen exponiert. Canvas ist `aria-hidden="true"`; Frequenz, Periode, Wellenlänge, Pegel und Zustand stehen als Text daneben. Evidenzstatus ist Text („Belegt", „Plausibel", „Nicht belegt", „Traditionell"), nie nur Farbe. Ein manueller Test mit NVDA/VoiceOver wurde **nicht** durchgeführt (R-2).
- **Kontrast:** siehe 4.4, alle geprüften Paare ≥ 7,75:1.
- **Reduzierte Bewegung:** keine Animationsschleife, statische Erklärung, einmalige Messwerte (4.6).

## 7. Regressionen

| Prüfung | Ergebnis |
| --- | --- |
| `npm run lint` (eslint, 0 Warnungen) | bestanden |
| `npx prettier --check` | bestanden |
| `npm run test:pages` | 6/6 |
| `npm run test:crystals` | 9/9 |
| `npm run test:frequencies` | 12/12 |
| `npm run test:frequenz` (Engine + Presets) | 34/34 |
| `npm run test:astrologie` | 21/21 |
| `npm run test:tarot` | 11/11 |
| `npm run test:tarot:decks` | 11/12 — **einziger Fehlschlag, CRLF-bedingt** (m-4) |
| `npm run test:moon` | 14/14 |
| `npm run test:offline` | 2/2 |
| `npm run test:local` | bestanden |
| `npx jest` | 2/2 |
| `E2E_PORT=3310 npm run test:e2e` (Chromium, 88 Fälle) | 88/88 |
| `npm run check:frequenz-budget` | bestanden (4.7) |
| Unabhängige QA-Suite (`npx playwright test --config=playwright.qa.config.js`) | **111 bestanden, 0 fehlgeschlagen, 29 übersprungen** (WebKit ohne Web Audio); darunter 3 als bekannt markierte Expected-Failures für M-1 |

## 8. Befunde

### Blocker

Keine.

### Major

**M-1 — Der Frequenz-Slider aktualisiert das Zahlenfeld nicht (verletzt U5 / NFR-14).**
- Reproduktion: `#frequenzen/labor` öffnen, Slider `#fqFreqRange` fokussieren, zweimal `→` drücken. Anzeige `#fqFreqReadout` und Engine-Zustand stehen auf 444,66 Hz, das Zahlenfeld `#fqFreqNumber` zeigt weiterhin `440`. Ein anschließendes `change` im Zahlenfeld setzt den Ton auf 440 Hz zurück.
- Ursache (Code): `setFrequency(hz, fromNumberField)` ruft `syncFrequency(fromNumberField)`; beim Slider-`input` wird `false` übergeben, wodurch `refs.freqNumber.value` nicht geschrieben wird (`js/modules/frequenzlabor.js`, Slider-Handler und `syncFrequency`).
- Bewertung: Die beiden Bedienelemente zeigen unterschiedliche Werte für denselben Zustand; das ist genau die im ADR geforderte Kopplung. Der Umsetzer-Test U5 prüft nur den Readout, nicht das Zahlenfeld, und deckt den Fehler daher nicht auf.
- Nachweis: `qa/02-barrierefreiheit.spec.js` → „Slider und Zahlenfeld bleiben per Tastatur synchron" (`test.fail` mit Begründung); Messprotokoll `evidence/t_835bd1e9/protokolle/probe-behavior.txt`.
- Empfehlung: im Slider-Handler `syncFrequency(true)` bzw. `this.refs.freqNumber.value = ...` mitschreiben; U5 um die Gegenrichtung erweitern.

### Minor

**m-1 — Sweep-Start wird nicht angesagt; Statuszeile bleibt während des Sweeps auf dem alten Text.**
Nach „Sweep starten" läuft der Ton, `#fqStatus` (aria-live) zeigt aber weiterhin z. B. „Ton gestoppt.", bis der Sweep endet. Screenreader-Nutzer erhalten keine Startansage (nur die Progressbar). NFR-15 fordert Statusmeldungen über `role="status"`. Nachweis: `probe-behavior.txt` (SWEEP@200/800).

**m-2 — Datensatz-Disclaimer nennt falsche harte Grenze.**
`data/frequencies.json` → `disclaimer.lautstaerke`: „begrenzt die Ausgabe hart auf -20 dBFS". Tatsächlich ist −20 dBFS der Startpegel, −6 dBFS der harte Deckel (Engine-Konstante, ADR NFR-7/8). Die UI rendert dieses Feld nicht, daher kein sichtbarer Fehler — der Datensatz ist aber irreführend und sollte korrigiert werden.

**m-3 — Testkonfiguration kann einen fremden Server übernehmen.**
`playwright.config.js` setzt `reuseExistingServer: !process.env.CI`. Lokal führte ein veralteter Server auf Port 3100 zu 14 falschen Fehlschlägen (archiviert). Die QA-Konfiguration nutzt `false` und einen eigenen Port; für die Feature-Suite wäre dieselbe Härtung sinnvoll.

**m-4 — `test:tarot:decks` ist unter Windows CRLF-anfällig (kein Produktfehler).**
Der Test vergleicht den SHA-256 der Rohdatei mit einem LF-Baseline. Mit `core.autocrlf=true` enthält die Datei 3014 CRLF-Paare; der LF-normalisierte Hash ist exakt der erwartete (`e3d0548a…`), `git diff origin/main` für die Datei ist leer. CI unter Linux ist grün. Empfehlung: im Test `\r\n` → `\n` normalisieren.

**m-5 — Sehr kleine Reserve im Initialgraph.**
NFR-1 liegt bei 85 613 / 86 275 B (662 B, 0,8 %). Jede weitere statische Zeile im Initialpfad sprengt das Budget; das Gate schlägt dann zwar korrekt an, die Reserve sollte aber bewusst überwacht werden.

## 9. Entscheidung

**Freigabe empfohlen — mit Auflage M-1.**

- Alle sicherheits- und gehörschutzrelevanten Kriterien sind belegt: harter −6-dBFS-Deckel (0,50119 gemessen), kein Ton ohne Interaktion, sichtbarer Fehler bei blockiertem Context, dauerhafter Disclaimer, Quellen mit `noopener noreferrer`.
- Frequenzgenauigkeit liegt mit ≤ 0,0007 Hz weit innerhalb der 1-Hz-Toleranz; Sweep-Dauer, Preset-Mapping, Navigation und Lazy-Loading funktionieren.
- Barrierefreiheit ist auf Baum- und Messebene belegt (Kontrast ≥ 7,75:1, Tastatur vollständig, 0 rAF bei reduzierter Bewegung, 44-px-Ziele).
- **Auflage:** M-1 vor dem Merge beheben (kleiner, lokaler Fix) und U5 um die Slider→Zahlenfeld-Richtung erweitern. Ohne Behebung ist die Abnahme von U5/NFR-14 nicht vollständig.
- m-1 bis m-5 sind Minor und können als Folgearbeiten laufen; m-3/m-4 betreffen die Testinfrastruktur.

## 10. Restrisiken und nicht geprüfte Punkte

- **R-1 — Safari/iOS nicht geprüft.** Der WebKit-Build unter Windows hat keine Web-Audio-API; echte Safari-Autoplay-Politik (User-Gesture-Freigabe, `webkitAudioContext`) und iOS-Verhalten sind offen. Für die Freigabe sollte ein manueller Smoke-Test auf einem echten iOS-Gerät erfolgen (Start/Stop, Pegel, binaurale Kanaltrennung).
- **R-2 — Kein manueller Screenreader-Test.** Geprüft wurde der Accessibility-Baum (Namen, Rollen, Live-Regionen), nicht die tatsächliche Aussprache mit NVDA/VoiceOver.
- **R-3 — Kein Hörtest auf echter Hardware.** Gemessen wurde der Signalpfad; Klangqualität, Kanaltrennung bei binauralen Presets und Verhalten mit realen Audiogeräten (Bluetooth-Latenz) sind nicht bewertet.
- **R-4 — Hash-Routen bleiben nicht indexierbar** (ADR AD-8, bewusst).
- **R-5 — Testserver-Übernahme** (m-3) kann lokal weiterhin falsche Ergebnisse erzeugen, wenn die Feature-Suite auf einem belegten Port läuft.

## 11. Evidenzverzeichnis

| Datei | Inhalt |
| --- | --- |
| `evidence/t_835bd1e9/measurements.json` | alle Messwerte je Browser (Frequenz, Pegel, Sweep, Kontrast, rAF, Mobile, Tastatur) |
| `evidence/t_835bd1e9/screens/*.png` | Hub/Labor 1440 px, Labor 360 px, reduzierte Bewegung — Chromium, Firefox, WebKit |
| `evidence/t_835bd1e9/protokolle/playwright-chromium.txt` | vollständige Feature-E2E-Suite (88/88) auf isoliertem Port |
| `evidence/t_835bd1e9/protokolle/playwright-chromium-stale-server-invalid.txt` | verworfener Lauf mit fremdem Server (14 Falschmeldungen) |
| `evidence/t_835bd1e9/protokolle/qa-final-all-browsers.txt` | QA-Suite über alle vier Projekte |
| `evidence/t_835bd1e9/protokolle/qa-chromium.txt`, `qa-webkit-mobile.txt` | Iterationsläufe der QA-Suite |
| `evidence/t_835bd1e9/protokolle/probe-behavior.txt`, `probe-cancel.txt` | Sonden zu Fokus, Slider-Sync, Sweep, Preset-Klick |
| `evidence/t_835bd1e9/scripts/*.cjs` | Mess- und Sonden-Skripte (reproduzierbar) |
| `qa/01-funktional.spec.js`, `qa/02-barrierefreiheit.spec.js` | ausführbare QA-Fälle |
| `playwright.qa.config.js` | eigenständige Konfiguration (eigener Port, drei Engines, mobiles Profil) |
