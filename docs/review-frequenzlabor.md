# Review — Frequenzen & interaktives Frequenzlabor

**Prüfobjekt:** `origin/feature/frequenzlabor-ui` @ `580ed539ac05d1724eda2b11e7453031a15ac2b0` (PR #6), QA-Stand `b1bf1dff77b100a0d0a1500da31b8a6b9f301a31` (PR #7)
**Basis:** `origin/main` @ `b18bdb34baffa5d245fd463af7d7203107ab50f`
**Auftrag:** Kanban `t_a0f14bb2`; Master-Auftrag `t_ffb2fea6`; ADR-0001 (`docs/adr-frequenzlabor.md`)
**Prüfer:** Reviewer-Profil, unabhängig von Daten-, Engine-, UI- und QA-Ticket
**Datum:** 2026-11-03
**Arbeitsbaum:** `C:\Users\mas\Arbeit\Esoterik-Welt-review`, Branch `docs/review-frequenzlabor`

---

## 0. Entscheidung

**APPROVE MIT AUFLAGEN.**

- **Keine Blocker.** Sicherheits-, Gehörschutz- und Evidenzanforderungen sind belegt; es gibt kein Heilversprechen, keinen Ton ohne Nutzerinteraktion und keinen Weg am −6-dBFS-Deckel vorbei.
- **Auflage A1 (vor Merge des UI-PR #6):** M-1 beheben — der Frequenz-Slider aktualisiert das Zahlenfeld nicht (unabhängig reproduziert: Readout 444,7 Hz, Feld 440). Ticket `t_b78a89a5` (läuft).
- **Auflage A2 (vor Merge der PRs #3 und #6):** Frequenzbibliothek um die im Master-Auftrag §3.1 ausdrücklich geforderten Themen ergänzen (Rife/Bioresonanz, Cymatics/Chladni, Klangschalen/Mantras, Chakren-Zuordnungen, Solfeggio 174/285/963). Ticket `t_1da0941f`.
- **Sofort mergebar:** PR #4 (ADR) und PR #5 (Engine). Beide sind ohne Auflage freigegeben.
- **Nach dem Merge zu erfüllen:** A3 (Pause/Weiter + ADR-Nachtrag, `t_f2a0868c`), A4 (P11: interne Verlinkung/Build-Link/SEO, `t_9564a3d5`), A5 (Restrisiken Safari/iOS, Screenreader, Hörtest, `t_4a8106de`) sowie die Testinfrastruktur `t_8e62434e`.
- **Der Master-Auftrag ist mit dem Merge allein nicht abgeschlossen.** Erst A1 und A2 plus die Nachweise aus A5 erfüllen die Definition of Done des Master-Auftrags (§12).

Begründung der Abstufung: Der Auftrag ist **nicht vollständig** umgesetzt (Befund B2); die Abweichung ist inhaltlicher Art und in `docs/frequenz-quellen.md` nur teilweise dokumentiert. Die technische Umsetzung selbst ist sauber und sicher, deshalb keine Ablehnung, sondern eine Freigabe mit klaren Vor-Merge-Auflagen.

---

## 1. Prüfmethode

Gelesen: Master-Auftrag, ADR-0001, `docs/frequenzlabor-ui.md`, `docs/frequenz-quellen.md`, `docs/qa-frequenzlabor.md`, `data/frequencies.json`, `js/modules/frequenz-engine.js`, `frequenzlabor.js`, `frequenz-presets.js`, `frequenz-visualisierung.js`, `frequenz-flags.js`, `frequenzlabor-loader.js`, `css/frequenzlabor.css`, `index.html`, `js/main.js`, Tests und CI-Konfiguration.

Selbst ausgeführt (nicht übernommen): Vertragstest, Engine-/Preset-Tests, Feature-E2E, Lint, Budget-Gate, Vertrags-Drift-Prüfung, Cousto-Nachrechnung, Quellen-Stichproben, Browser-Prüfung von Hub und Labor inkl. M-1-Repro, Screenshots. Befehle und Rohwerte: `evidence/t_a0f14bb2/pruefprotokoll.md`.

Umgebung: Windows 11, Node v24.13.0, npm 11.8.0, Playwright 1.64.1, Chromium (Playwright-Build), lokaler Build `dist/Esoterik-Welt/` via `node index.js`.

---

## 2. Prüfpunkt 1 — Auftrag, ADR und Umsetzung

### 2.1 Abgleich Master-Auftrag

| Auftragspunkt | Umsetzung | Bewertung |
| --- | --- | --- |
| §3 Hauptkategorie, Navigation, Startseite, `#frequenzen` | Eigene Route, Navi-Eintrag, siebte Startseitenkarte, Alias `#frequenzlabor` → `#frequenzen/labor` | erfüllt |
| §3.1 Bibliothek: Solfeggio, 432/440, Schumann, binaurale Beats, EEG-Bänder, Chakren, Klangschalen/Obertöne/Mantras, Cymatics/Chladni, Rife/Bioresonanz; je Eintrag Herkunft, Bedeutung, Verwendung, physikalische Einordnung, Evidenz, Quellen | 32 Einträge, Filter nach Kategorie/Evidenz, Evidenz-Badge als Text, Quelle je Eintrag, Disclaimer, Methodendokument | **teilweise** — Rife/Bioresonanz, Cymatics/Chladni, Klangschalen/Mantras, Chakren-Zuordnungen und Solfeggio 174/285/963 fehlen (B2). Die Tiefe je Eintrag ist auf ≤ 200 Zeichen Kurztext plus Methodendokument reduziert; das ist eine bewusste, im ADR §8.1 abgesegnete Datenentscheidung, deckt „historische Herkunft/praktische Verwendung" aber nicht systematisch ab |
| §3.2 Generator: Zahleneingabe, Slider, Presets, Sinus, weitere Wellenformen, Play/Pause/Stop, sichere Lautstärke, Fades, Hz-Anzeige, Tastatur, Mobil, Ressourcenfreigabe | Slider + Zahlenfeld, 10 Presets, Sinus Standard + Dreieck/Rechteck/Sägezahn, Play/Stop, −20 dBFS Start, 20-ms-Fades, Readout, Tastatur, 44-px-Ziele, `dispose`/`onHide` | **teilweise** — kein Pause-/Weiter-Bedienelement (B3), sonst erfüllt |
| §3.3 Binaural: Träger + Differenz, Delta/Theta/Alpha/Beta(/Gamma), Lautstärke, Play/Stop, echte Kanaltrennung, Kopfhörerhinweis, keine EEG-Behauptung | Vier Presets (Delta 2, Theta 6, Alpha 10, Beta 20 Hz), zwei Oszillatoren mit `StereoPanner` ±1, Hinweis „nur mit Kopfhörern", Text „keine belegte EEG-Wirkung" | erfüllt |
| §3.4 Visualisierung: Oszillogramm, Wellenform, Frequenz + Periodendauer, Vergleich zweier Töne, Überlagerung/Schwebung, Achsen/Einheiten; optional FFT, Harmonische, Lissajous; reduced motion statisch | Canvas-Oszillogramm, Textwerte für Frequenz/Periode/Wellenlänge/Pegel/Zustand, Schwebung 440+444, statische Welle bei reduzierter Bewegung (0 rAF) | erfüllt (FFT/Lissajous optional und nicht umgesetzt) |
| §3.5 432/440-Vergleich, gleiche Lautstärke/Dauer/Klangfarbe, korrekte Beschriftung, optional verdecktes A/B | Zwei Einzeltöne mit gleichem Pegel; Beschriftung „einzelne Sinustöne … keine vollständigen Stimmungen"; kein blindes A/B (optional) | erfüllt |
| §3.6 Cymatics/Chladni (zweite Ausbaustufe) | Nicht implementiert; Feature-Flag vorbereitet | bewusst außerhalb der ersten Stufe (ADR §1), **Bibliotheksthema fehlt dennoch** (B2) |
| §3.7 Meditation/Sitzungen (dritte Ausbaustufe) | Nicht implementiert | bewusst außerhalb der ersten Stufe; Folgeticket `t_aa849c1c` |
| §4 Design „Nachtatelier", Tokens, Mobile First, WCAG, keine Neonoptik | Ausschließlich Tokens, Fraunces/Manrope, 2-px-Radien, keine Fremdfarben; Screenshots 360/768/1440, Kontrast ≥ 7,75:1 | erfüllt |
| §5 Architektur: Hash-Routing, Back/Forward, ES-Module, AudioContext-Lebenszyklus, kein Doppel-AudioContext, Stopp bei Navigation, Fehlerbehandlung, CPU, `file://`, keine CDNs | Lazy-Loader, Singleton-Engine, `onHide` + `visibilitychange` + `pagehide`, sichtbarer `role="alert"`-Fehler, eingebettetes JSON für `file://`, keine externen Requests | erfüllt |
| §6 SEO/GEO: Titel/Description, semantisches HTML, interne Verlinkung, strukturierte Daten, Canonical/Sitemap, Landingpage bewerten | `PAGE_META.frequenzen`, ein H1, semantische Abschnitte; **keine inhaltlichen internen Links** zu Kristallen/Chakren/Astrologie/Wissen; Landingpage-Entscheidung offen (AD-8) | **teilweise** (B6) |
| §8 Tests: Funktion, Technik, Audio, Qualität; echte Ergebnisse; keine abgeschwächten Tests | Eigene Läufe grün (Abschnitt 6); Tests wurden erweitert, nicht entfernt | erfüllt, mit Lücke in der Themenabdeckung (B9) |
| §11 Git: Feature-Branch, keine Force-Pushes, keine Secrets | Getrennte Branches, keine Secrets im Baum, keine neuen Laufzeitabhängigkeiten | erfüllt |

### 2.2 Abgleich ADR

- **AD-1 bis AD-6, AD-8:** eingehalten (Web Audio direkt, CSR, Controller + Engine als autoritativer Zustand, localStorage versioniert, Feature-Flags, Routen, keine Landingpage in dieser Stufe).
- **AD-7 (`file://`):** eingehalten; `Lokal.html` enthält das eingebettete JSON, U13 grün.
- **Schnittstellenvertrag §4:** byte-gleich mit `js/modules/frequenz-engine.d.ts` (9 395 B, selbst geprüft). Keine Vertragsdrift.
- **Dokumentierte UI-Abweichungen** (`docs/frequenzlabor-ui.md` §9): Debug-Handle im Lazy-Modul (NFR-1), ID-Override für die binaurale Demo (fachlich korrekt, weil der Datensatz kanalgetrennt beschreibt), `js/modules/package.json` für Node-Tests, Sticky-Transport oben (gemessener Grund), nicht neu eingecheckte Rechtsseiten. Alle fünf sind begründet und vertretbar.
- **Nicht im ADR dokumentierte Engine-Abweichungen:** zweikanaliger `mixBus`, Setter werfen nach `dispose()`, `setFrequency` bricht einen laufenden Sweep ab, `getFrequencyEngine()` erzeugt nach `dispose()` eine frische Instanz. Der Vertrag bleibt unberührt, die Semantik weicht aber vom ADR-Text ab (B7).
- **ADR vs. Daten:** ADR §8.2 nennt Rife-Frequenzen ausdrücklich als nicht abspielbare Einträge; der Datensatz enthält keinen Rife-Eintrag. Die Allowlist in ADR §8.2 und `TONE_ALLOWLIST_HZ` enthält 174/285/963 Hz, die Daten nicht (B2).

**Fazit Prüfpunkt 1:** Der Auftrag ist **nicht vollständig** umgesetzt. Die technische Architektur folgt dem ADR; die Abweichungen sind überwiegend begründet, zwei Lücken sind es nicht (B2, B3).

---

## 3. Prüfpunkt 2 — Inhaltliche Risiken

### 3.1 Keine Heilversprechen

- Keyword-Scan über `data/frequencies.json`, die Frequenzmodule, `index.html` und `css/frequenzlabor.css` nach Heil-/Therapie-/Detox-/Krebs-/Schmerzformulierungen: nur **widerlegende** Treffer („keine belegte therapeutische Wirkung", „‚Entgiftung durch Töne' ist kein anerkannter physiologischer Vorgang", „DNA-Reparatur … unbelegt"). Keine positiven Wirkbehauptungen.
- Der Vertragstest `tests/frequencies-data.cjs` erzwingt zusätzlich ein Verbotmuster-Set und verlangt bei DNA-Aussagen eine Einordnung als Behauptung; er ist grün.
- Der Disclaimer ist zweistufig (kurz im Seitenkopf, lang im Abschnitt „Hinweis zur Nutzung"), datengesteuert (842 Zeichen, enthält WHO-80-dB-Hinweis und ärztliche Abklärung) und im gerenderten DOM sichtbar.

### 3.2 Evidenzstatus — Stichproben

| Eintrag | Status | Prüfung | Ergebnis |
| --- | --- | --- | --- |
| EEG-Band Alpha 8–13 Hz | belegt | Newson & Thiagarajan 2019, PMC6333694, im Volltext geprüft | bestätigt: „most frequently defined in the range of 8–13 Hz (85/84 % of studies)" |
| Binaurale Schwebung | belegt (Wahrnehmung) | Ingendoh et al. 2023, PLOS ONE, Abstract geprüft | bestätigt: Wahrnehmung belegt, Wirkungen „inconclusive at best" — Text sagt „Wirkungen umstritten" |
| Stimmton 432 Hz | plausibel | Calamassi & Pomponi 2019, PubMed 31031095 | bestätigt: Pilotstudie, 432 Hz senkt Herzfrequenz stärker als 440 Hz; Autoren fordern größere Stichprobe — Status „plausibel" korrekt |
| Cousto-Planetenfrequenzen | traditionell | alle acht Werte aus astronomischen Perioden mit `awk` nachgerechnet | exakt reproduziert (194,18 / 136,10 / 210,42 / 141,27 / 221,23 / 144,72 / 183,58 / 147,85 Hz) |
| Solfeggio 396–852 Hz | nicht belegt | Primärtext Horowitz & Puleo 1999 als Behauptungsquelle, Wirkung ausdrücklich als unbelegt | korrekt; die drei fehlenden Töne sind der Befund B2 |
| 40-Hz-Gamma-Stimulation | plausibel | Iaccarino 2016 (Mausmodell), Text nennt fehlende Übertragbarkeit auf Menschen | korrekt |
| Schumann 7,83 Hz | belegt (Frequenz) | NASA-White-Paper verlinkt und erreichbar; Text: „kein Hörschall, Wirkung nicht belegt" | korrekt |

Der Datensatz trennt durchgehend Physik, Tradition und Behauptung; esoterische Einträge sind nie „belegt" (Test erzwingt das). Die Aussage „Negativbefunde sind Suchstand, keine Widerlegung" steht in `docs/frequenz-quellen.md` §8.

### 3.3 Disclaimer und Gehörschutz

- Hub: Kurz-Disclaimer direkt unter der Kopfnavigation sichtbar; Lang-Disclaimer im Abschnitt „Hinweis zur Nutzung".
- Labor: Kurz-Disclaimer oben; Lang-Disclaimer unten; **Gehörschutz-Hinweis direkt am Pegelregler** („Startpegel −20 dBFS. Tief starten, Gehör schützen, Pausen machen."), sichtbares Label „Deckel: −6 dBFS".
- Kein Ton ohne Interaktion: 0 `AudioContext`-Konstruktionen vor dem Klick (U3 grün, selbst nachvollzogen); blockierter Context erzeugt sichtbare `role="alert"`-Meldung.
- **Befund B4:** `data/frequencies.json` → `disclaimer.lautstaerke` behauptet weiterhin eine harte Grenze von −20 dBFS (Zeile 9). Richtig sind Startpegel −20 dBFS und harte Grenze −6 dBFS. Das Feld wird nicht gerendert, ist aber als Datenbestand irreführend. Bereits in `t_b78a89a5` (m-2) erfasst.

### 3.4 Quellen

- 26 `https`-Quellenlinks, alle mit `target="_blank"` und `rel="noopener noreferrer"`; 6 Solfeggio-Einträge nutzen eine `http`-URL und werden deshalb ADR-konform nur als Text ausgegeben.
- Stichprobe der URLs: OpenStax (2×), PMC (3×), PubMed, NASA, NIBIB, planetware, encyclopedia.com → HTTP 200. ISO-Hauptseite und ISO-Focus-PDF antworten curl mit 403 (Bot-Schutz, kein toter Link); inhaltlich nicht maschinell nachprüfbar, die Aussagen (440 Hz, 442-Hz-Praxis) sind zusätzlich über die Musikgeschichte gedeckt.
- Der Solfeggio-Primärtext liegt auf einem Bibliotheks-Mirror (http, PDF). Das ist für die Frage „was wird behauptet" ausreichend, die URL ist aber fragil; als Risiko notiert, kein Befund.

**Fazit Prüfpunkt 2:** Inhaltlich sicher. Die Evidenzstände sind korrekt und nicht irreführend; Disclaimer und Gehörschutz sind sichtbar. Ein Datenfehler (B4) ist bereits ticketiert.

---

## 4. Prüfpunkt 3 — Code-Qualität (Stichprobe)

| Kriterium | Befund |
| --- | --- |
| Lesbarkeit | Klare Trennung: `frequenzlabor.js` (View/Controller), `frequenz-engine.js` (Audio), `frequenz-presets.js` (Daten/Mapping/Storage), `frequenz-visualisierung.js` (Canvas), Loader/Flags klein und dokumentiert. JSDoc an den öffentlichen Pfaden, erklärende Kommentare an den nicht offensichtlichen Stellen (Allowlist, Binaural-Override, mixBus). |
| Fehlerbehandlung | Klassifizierte Fehlercodes (`unsupported`, `context_blocked`, `context_closed`, `invalid_frequency`, `invalid_argument`), sichtbare `role="alert"`-Meldung, wiederholbar; Zahlenfelder klemmen auf 20–20 000; Daten werden normalisiert und bei Fehlern mit sichtbarem Hinweis verworfen. |
| Ressourcen | Singleton-Engine, FIFO-Serialisierung von Start/Stop/Sweep, `dispose()` schließt Context und leert Listener, `onHide`/`visibilitychange`/`pagehide` stoppen Audio, rAF nur bei laufendem Ton. |
| Injection/Secrets | Fachdaten werden mit `textContent` gerendert; `innerHTML` nur für statische Templates mit numerisch geklemmten Werten. Keine `eval`/`new Function`, keine Secrets (`git grep` nach Schlüssel-Mustern leer), keine externen Requests außer Quellenlinks. |
| Abhängigkeiten | Keine neue Laufzeitabhängigkeit; nur npm-Skripte und Dev-Tooling. |
| Reste | `js/modules/_tarot_old.js`, `runes.js.bak`, `runes.js.bak2` existieren, sind aber **bereits auf `origin/main`** vorhanden (`git ls-tree origin/main`) und nicht Teil dieser Änderung. Kein Befund gegen dieses Feature; Repo-Hygiene separat. |
| Assets/Lizenzen | Keine neuen Fremd-Assets. Canvas-Grafik ist eigener Code, Screenshots sind eigene Testartefakte, Quellen werden zitiert statt redistribuiert (Cousto-PDF CC BY-NC-ND nur verlinkt). |
| Tests | Engine E1–E20 und Presets P1–P8 sinnvoll (Fake-Context + OfflineAudioContext), E2E U1–U14 decken die Kernpfade. **Schwäche:** U5 prüft nur Zahlenfeld → Slider, nicht die Gegenrichtung; deshalb blieb M-1 unentdeckt. Der Datenvertragstest fordert ≥ 20 Einträge, aber keine Themenliste. |
| M-1-Ursache | Bestätigt: Slider-`input` → `setFrequency(hz, false)` → `syncFrequency(false)` schreibt `#fqFreqNumber` nicht (`js/modules/frequenzlabor.js`, Zeilen 781/895 ff.). |

**Fazit Prüfpunkt 3:** Sauberer, gut strukturierter Code ohne Sicherheits- oder Lizenzprobleme. Die Testlücke zu M-1 ist der einzige qualitative Schwachpunkt und wird mit der Auflage geschlossen.

---

## 5. Prüfpunkt 4 — Abgleich mit dem QA-Bericht

| QA-Befund | Unabhängige Prüfung | Status |
| --- | --- | --- |
| M-1 Slider/Zahlenfeld | im Browser reproduziert: Slider zweimal `→`, Readout „444,7 Hz", Feld „440", Sliderwert 449 | **bestätigt** |
| m-1 Sweep-Start ohne Ansage | Code: `startSweep()` announced nur das Ende; kein Aufruf beim Start | **bestätigt** |
| m-2 Disclaimer −20 dBFS | `data/frequencies.json` Zeile 9 | **bestätigt** |
| m-3 Server-Reuse | `playwright.config.cjs`: `reuseExistingServer: !process.env.CI`, Port 3100 | **bestätigt** |
| m-4 CRLF bei `test:tarot:decks` | Datei wird als Rohbyte-Hash geprüft; LF-Normalisierung fehlt; CI unter Linux grün | **plausibel bestätigt** |
| m-5 Budgetreserve 662 B | eigener Lauf: 85 613 / 86 275 B | **bestätigt** |

- **Offene Fragen aus dem QA-Bericht:** keine. Der Bericht enthält Restrisiken (R-1 bis R-5), keine unbeantworteten Rückfragen.
- **R-1 (Safari/iOS), R-2 (manueller Screenreader), R-3 (Hörtest):** nicht durch Tests abgedeckt → `t_4a8106de`.
- **R-4 (Hash-Routen nicht indexierbar):** bewusst (AD-8) → P11-Entscheidung in `t_9564a3d5`.
- **R-5 (Testserver-Übernahme):** siehe m-3 → `t_8e62434e`.
- **Doku-Ungenauigkeit:** Der QA-Bericht nennt in Zeile 7 „drei Minor-Befunde", listet in Abschnitt 8 aber fünf (m-1 bis m-5). Kein Sachfehler, aber zu korrigieren → `t_8e62434e`.

---

## 6. Eigene Messungen (Auszug)

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Datenvertrag | `npm run test:frequencies` | 12/12 pass, 0 fail |
| Engine + Presets | `npm run test:frequenz` | 34/34 pass, 0 fail |
| UI-E2E | `npx playwright test tests/frequenzlabor.spec.js` | 14/14 pass |
| Lint | `npm run lint` | 0 Fehler, `--max-warnings 0` |
| Budget | `npm run check:frequenz-budget` | NFR-1 85 613/86 275 B · NFR-2 27 882/100 000 B · NFR-3 2 903/6 000 B |
| Vertragsdrift | ADR-Block vs. `frequenz-engine.d.ts` | byte-gleich, 9 395 B |
| Cousto-Arithmetik | `awk`-Nachrechnung aus Perioden | 8/8 exakt |
| Hub-DOM | Browser | 32 Einträge, 10 hörbar, 26 Quellenlinks, Filter „nicht belegt" → 6 |
| Disclaimer | Browser | Kurztext sichtbar; Langtext 842 Zeichen inkl. „80 dB" (WHO) |
| Labor-DOM | Browser | „Deckel: −6 dBFS", Gehörschutz-Hinweis am Pegelregler, Kopfhörer-Hinweis binaural |
| M-1-Repro | Browser, 2× ArrowRight | Readout 444,7 Hz / Feld 440 — **Befund bestätigt** |
| Quellen-URLs | `curl` | 13 Kern-URLs geprüft: 11 × HTTP 200, 2 × HTTP 403 (ISO, Bot-Schutz) |
| Secrets | `git grep` Schlüsselmuster | keine Treffer |

---

## 7. Befunde

### Blocker

Keine.

### Major

**B1 — Frequenz-Slider aktualisiert das Zahlenfeld nicht (M-1 aus QA).**
Repro und Ursache siehe Abschnitt 5. Verletzt Auftrag §3.2 (gekoppelte Frequenzeingabe) und ADR U5/NFR-14. **Auflage A1**, Ticket `t_b78a89a5` (läuft).

**B2 — Pflichtthemen der Bibliothek fehlen.**
Rife-Frequenzen/Bioresonanz, Cymatics/Chladni, Klangschalen/Mantras, Chakren-Zuordnungen und Solfeggio 174/285/963 Hz sind im Master-Auftrag §3.1 ausdrücklich gefordert, im Datensatz aber nicht vorhanden. `docs/frequenz-quellen.md` §7 begründet nur die drei Solfeggio-Töne; die übrigen Auslassungen sind nicht dokumentiert. Zusätzlich inkonsistent zum ADR, das Rife-Einträge in §8.2 voraussetzt und 174/285/963 in der Allowlist führt. **Auflage A2**, Ticket `t_1da0941f`.

### Minor

**B3 — Kein Pause-/Weiter-Bedienelement.** Auftrag §3.2 fordert Play/Pause/Stop; ADR §4.4 beschreibt Pause/Weiter, die UI hat nur Start/Stopp (Start nach Stopp setzt mit gemerkten Parametern fort). Funktionale Auswirkung gering, Anforderungsabweichung dokumentiert. Ticket `t_f2a0868c`.

**B4 — Daten-Disclaimer nennt falsche harte Grenze (−20 dBFS statt −6 dBFS).** Nicht gerendert, aber irreführend; in `t_b78a89a5` (m-2) enthalten.

**B5 — Sweep-Start ohne Statusansage (m-1).** `aria-live` behält den alten Text; in `t_b78a89a5` enthalten.

**B6 — Interne Verlinkung und Quellendokument-Link.** Keine inhaltlichen Links zu Kristallen/Chakren/Astrologie/Wissen; `docs/frequenz-quellen.md` ist im gebauten Preview 404 und auf Pages rohes Markdown. Ticket `t_9564a3d5` (P11).

**B7 — ADR-Nachtrag für vier Engine-Semantikpunkte fehlt.** Vertrag unverändert, Semantik weicht ab; ADR verlangt eine begründete Ergänzung. Ticket `t_f2a0868c`.

**B8 — Testinfrastruktur:** Server-Reuse (m-3), CRLF (m-4), Budgetreserve ohne Warnschwelle (m-5). Ticket `t_8e62434e`.

**B9 — Testabdeckung der Anforderungen:** Datenvertragstest prüft nur „≥ 20 Einträge", nicht die Pflichtthemen; U5 prüft die Slider→Feld-Richtung nicht. Ticket `t_1da0941f` (Themenabdeckung) bzw. `t_b78a89a5` (U5).

**Info — QA-Bericht „drei" statt fünf Minor-Befunde.** In `t_8e62434e` zu korrigieren.

---

## 8. Auflagen

| ID | Auflage | Ticket | Fälligkeit |
| --- | --- | --- | --- |
| A1 | M-1 beheben, U5 um Slider→Zahlenfeld erweitern, m-1/m-2 mitnehmen | `t_b78a89a5` | **vor Merge #6** |
| A2 | Fehlende Pflichtthemen der Bibliothek ergänzen und Test um Themenabdeckung erweitern | `t_1da0941f` | **vor Merge #3/#6** |
| A3 | Pause/Weiter oder begründete ADR-Abweichung; ADR-Nachtrag Engine-Semantik | `t_f2a0868c` | nach Merge, vor Master-Abschluss |
| A4 | P11: interne Verlinkung, Quellendokument im Build, Landingpage-Entscheidung | `t_9564a3d5` | nach Merge, vor Master-Abschluss |
| A5 | Safari/iOS-, Screenreader- und Hörtest-Nachweise (R-1–R-3) | `t_4a8106de` | vor öffentlicher Release-Erklärung |
| — | Testinfrastruktur m-3/m-4/m-5 und QA-Bericht-Korrektur | `t_8e62434e` | Folgearbeit |

---

## 9. Merge-Reihenfolge

Voraussetzung: A1 und A2 sind in den Daten-/UI-Zweig eingearbeitet (Fix-Commit auf `feature/frequenzlabor-ui` bzw. Merge des Fix- und Daten-Branches in die UI-Branch), alle vier CI-Jobs grün.

1. **PR #3** `feature/frequenzdaten` → `main` (Daten, inkl. A2-Ergänzungen)
2. **PR #4** `docs/frequenzlabor-adr` → `main` (ADR; retargetet automatisch, sobald #3 gemergt ist)
3. **PR #5** `feature/frequenzlabor-engine` → `main` (stacked auf #4; nach #4 retargeten)
4. **PR #6** `feature/frequenzlabor-ui` → `main` (enthält #3–#5 als Merge-Eltern; nach #5 retargeten, Fix aus A1 enthalten)
5. **PR #7** `docs/qa-frequenzlabor` → `main` (QA-Bericht, Status M-1 nachgezogen)
6. **Fix-PR** aus `fix/frequenzlabor-qa-m1` nur falls A1 nicht bereits in #6 enthalten ist
7. **Dieser Review-PR** `docs/review-frequenzlabor` → `main` (Review-Dokument)

Nach dem Merge: Pages-Deployment beobachten, `https://ingbms.github.io/Esoterik-Welt/#frequenzen/labor` rauchtesten (Start/Stopp, Deckel, Disclaimer), dann A3–A5 abarbeiten und den Master-Auftrag erst danach schließen.

---

## 10. Release-Notiz (Vorschlag, Deutsch)

- **Neu: Frequenzen & Schwingungen** — eigene Kategorie mit quellenbasierter Bibliothek (32 Einträge), Evidenzstatus je Eintrag und dauerhaftem Hinweis „kein Medizinprodukt".
- **Interaktives Frequenzlabor** — Tongenerator mit logarithmischem Slider und Zahlenfeld, vier Wellenformen, Presets, Sweep, Schwebung, binaurale Demonstration und 432/440-Vergleich; Start erst per Klick.
- **Gehörschutz eingebaut** — Startpegel −20 dBFS, harter Deckel −6 dBFS (sichtbar), 20-ms-Fades gegen Knackser, Stopp bei Navigation/Tab-Wechsel.
- **Barrierefrei und schnell** — Tastaturbedienung, Kontrast ≥ 7,75:1, statische Darstellung bei reduzierter Bewegung, Lazy-Loading und eingehaltene Bundle-Budgets.
- **Wissenschaftlich eingeordnet** — jede Aussage mit Quelle und Status (belegt/plausibel/nicht belegt/traditionell); Schumann-Resonanzen, EEG-Bänder und Rife-Frequenzen werden nicht als hörbare Töne ausgegeben.

---

## 11. Restrisiken

1. **Inhaltliche Vollständigkeit** bleibt bis A2 offen; die Seite behauptet keine Vollständigkeit, ist aber schmaler als der Auftrag.
2. **Safari/iOS** ist nicht getestet (WebKit-Build ohne Web Audio); Autoplay-/Resume-Verhalten auf echten Geräten offen (A5).
3. **Kein manueller Screenreader-Test** und **kein Hörtest auf Hardware** (A5).
4. **Budgetreserve NFR-1** beträgt 662 B (0,8 %); jede weitere statische Zeile im Initialpfad sprengt das Gate (bewusst überwacht, `t_8e62434e`).
5. **Externe Quellen** können verschwinden (Solfeggio-PDF auf Bibliotheks-Mirror, ISO-Seiten mit Bot-Schutz); die Aussagen sind zusätzlich im Methodendokument belegt.
6. **Hash-Routen** bleiben nicht indexierbar (AD-8); eine Landingpage-Entscheidung steht aus (A4).

---

## 12. Prüfspur

- Protokoll mit Befehlen, Rohausgaben und DOM-Messwerten: `evidence/t_a0f14bb2/pruefprotokoll.md`
- Screenshots: `C:/tmp/review-hub-1440.png`, `C:/tmp/review-lab-1440.png` (nicht im Repo; die QA-Belege unter `evidence/t_835bd1e9/screens/` decken 360/768/1440 ab)
- Geprüfter Commit: `580ed53` (Produkt), `b1bf1df` (QA-Dokument); Arbeitsbaum `C:\Users\mas\Arbeit\Esoterik-Welt-review`
