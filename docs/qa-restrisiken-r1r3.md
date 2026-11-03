# Restrisiken R-1 bis R-3: Prüfprotokoll und Ergebnis

Ticket: `t_4a8106de` (Auflage A5 aus dem Abschlussreview `t_a0f14bb2`)
Prüfstand: `71b895c` (Branch `fix/frequenzlabor-qa-m1`, gestapelt auf `docs/qa-frequenzlabor`)
Datum der Erhebung: 2026-11-03, 02:45–03:10 CET
Keine Produktänderungen: der Diff dieses Branches enthält ausschließlich Dokumentation, Evidenz und Sonden unter `evidence/t_4a8106de/`.

## 1. Kurzfassung

| Punkt | Ergebnis | Kurzbegründung |
| --- | --- | --- |
| R-1 Safari/iOS | **nicht geprüft** | Kein Apple-Gerät und kein macOS auf dem Prüfhost; der WebKit-Build unter Windows hat keine Web-Audio-API und ist kein Safari-Ersatz. Statische Vorprüfung und WebKit-Näherung liegen vor. |
| R-2 manueller Screenreader | **nicht geprüft**, ein **Major-Befund** | NVDA ist nicht installiert, VoiceOver setzt iOS/macOS voraus. Der Accessibility-Baum wurde stattdessen vollständig ausgelesen; dabei fällt ein echter Wertfehler am Frequenz-Slider auf (R2-1). |
| R-3 Hörtest | **nicht geprüft** (subjektiv), objektive Teile **bestanden** | Wahrnehmung („leise“, „keine Knackser“, „Differenz hörbar“) kann nur ein Mensch beurteilen. Pegeldeckel, Startpegel, Kanaltrennung und Resttonfreiheit wurden stattdessen gemessen. |

Damit ist **A5 nicht erfüllt**. Die Auflage verlangt Nachweise auf echter Hardware; dieser Lauf liefert die reproduzierbaren Protokollbögen und alles, was ohne diese Hardware maschinell belegbar ist. Die drei offenen Blöcke sind in Abschnitt 4.3, 5.3 und 6.2 so vorbereitet, dass sie in rund 20 Minuten je Gerät abgehakt werden können.

## 2. Umgebung und Grenzen

| Element | Wert |
| --- | --- |
| Host | `Mini_IT12`, Windows 11, Benutzer `mas` |
| Node / npm | Node v24.13.0, npm 11.8.0 |
| Browser (Playwright 1.64.1) | Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2 |
| Mobile Emulation | Chromium, 390 × 844, Touch, DPR 3 (keine iOS-Emulation der Audio-API) |
| Aufbau | `npm ci`, `npm run build`, `PORT=3333 node index.js` → `http://127.0.0.1:3333/Esoterik-Welt/` |
| Datensatz | `data/frequencies.json`, 32 Einträge |
| Nicht vorhanden | macOS, iOS-Gerät, NVDA, VoiceOver, Audiogerät mit Loopback (kein „Stereomix“ in DirectShow), menschlicher Hörer |

Geprüfte Abwesenheiten (nicht behauptet, sondern nachgesehen):

- `C:\Program Files (x86)\NVDA` und `C:\Program Files\NVDA` existieren nicht.
- `ffmpeg -f dshow -list_devices` listet nur Mikrofone, SPDIF und Line-In, kein Loopback-Gerät. Eine Aufnahme des tatsächlichen Ausgangssignals ist damit auf diesem Host nicht möglich.

## 3. Ergebnis je Prüfpunkt

| Nr. | Prüfpunkt | Status | Beleg |
| --- | --- | --- | --- |
| R-1.1 | `#frequenzen/labor` lädt in Safari/iOS | nicht geprüft | — |
| R-1.2 | Ton startet per Nutzer-Geste, `webkitAudioContext` | nicht geprüft | statische Vorprüfung: 4.1 |
| R-1.3 | 440 Hz / 1000 Hz korrekt | nicht geprüft | Frequenzmessung in Chromium: `docs/qa-frequenzlabor.md`; in dieser Runde nicht wiederholt |
| R-1.4 | Stopp ohne Nachklang | nicht geprüft | Handler-Beleg Chromium: 6.1 |
| R-1.5 | Binaurale Kanaltrennung mit Kopfhörer | nicht geprüft (Gehör) | Kanaltrennung gemessen: 6.1 |
| R-1.6 | Verhalten nach `visibilitychange` | nicht geprüft (Safari) | Handler-Beleg Chromium: 4.2, Probe 4 |
| R-1.7 | Pegeldeckel −6 dBFS | nicht geprüft (Safari) | in Chromium exakt eingehalten: 6.1 |
| R-2.1 | Ansage Start/Stopp | nicht geprüft | Text vorhanden: 5.1 |
| R-2.2 | Slider + Zahlenfeld | nicht geprüft | **Befund R2-1** |
| R-2.3 | Sweep-Start/-Ende | nicht geprüft | Textfolge belegt: 5.1 |
| R-2.4 | Fehlermeldung `role=alert` | nicht geprüft | AX-Exposition belegt: 5.1, Befund R2-3 |
| R-2.5 | Evidenz-Badges als Text | nicht geprüft | 32 Badges mit Text: 5.1 |
| R-3.1 | Startpegel −20 dBFS wirkt leise | nicht geprüft (Gehör) | Pegel gemessen: 6.1 |
| R-3.2 | keine Knackser bei Start/Stopp/Sweep | nicht geprüft (Gehör) | 20-ms-Fade im Code und in Engine-Tests; Gehörprüfung offen |
| R-3.3 | kein Hintergrundton nach Navigation/Tab-Wechsel | nicht geprüft (Gehör) | Analysator nach Stopp bei 0: 6.1 |
| R-3.4 | binaurale Differenz hörbar | nicht geprüft (Gehör) | Kanaltrennung 10×/23×: 6.1 |

## 4. R-1 Safari/iOS

### 4.1 Statische Vorprüfung am Code (kein Gerätenachweis)

| Frage | Befund | Stelle |
| --- | --- | --- |
| Wird der Safari-Konstruktor genutzt? | Ja: `window.AudioContext \|\| window.webkitAudioContext` | `js/modules/frequenz-engine.js:84`, `:311` |
| Entsteht der Kontext synchron in der Nutzer-Geste? | Ja. Alle Startpfade (`play`, `playTones`, `playBinaural`, `sweep`) rufen `#requestContextStart()` vor dem ersten `await` und vor `#enqueue` auf; `#ensureContext()` erzeugt Kontext und Graph synchron | `frequenz-engine.js:382`, `:654`, `:721`, `:957` |
| Ist das für Safari relevant? | Ja. MDN/Browser-Compat-Data vermerkt für Safari 14.1: „New audio contexts are suspended until the `resume()` method is called via user action, such as the `click` event.“ `resume()` wird ebenfalls synchron aufgerufen (`:382`) | `evidence/t_4a8106de/bcd-audiocontext.json` |
| Gibt es einen Fallback für `createStereoPanner()`? | Nein. Die binaurale Demo setzt `StereoPannerNode` voraus; laut Browser-Compat-Data ab Safari 14.1 / iOS 14.5. Auf älteren Geräten ist die binaurale Wiedergabe damit voraussichtlich nicht verfügbar | `frequenz-engine.js:489`, `bcd-stereopanner.json` |
| Wird ohne Web Audio sauber degradiert? | Ja, mit Meldung „Dieser Browser unterstützt die Web Audio API nicht…“; der Startknopf bleibt aber aktiv (Befund R2-4) | Probe 2, `webkitNoWebAudio` |
| Reagiert die Seite auf Tab-Wechsel? | Ja: `visibilitychange` → `halt()`, `pagehide` → `halt()`, plus `onHide()` | `frequenzlabor.js:161`, `:205`, `:227` |

Damit sind die typischen Safari-Stolpersteine im Code adressiert. Das ist eine Vorprüfung, kein Nachweis: Ob Safari die Geste tatsächlich als Nutzer-Task wertet, ob `resume()` durchläuft und ob die Wiedergabe nach dem Zurückwechseln sauber neu startet, lässt sich nur auf dem Gerät zeigen.

### 4.2 WebKit-Näherung unter Windows: was sie belegt und was nicht

Der WebKit-Build 27.2 hat unter Windows keine Web-Audio-API (`AudioContext` und `webkitAudioContext` beide `undefined`). Er belegt deshalb nur den Degradationspfad:

- Nach Klick auf „Ton starten“ erscheint die Meldung im Status **und** im Alert, die Live-Anzeige wechselt auf „ohne Ton“, der Engine-Status ist `unsupported`.
- Der Startknopf bleibt aktiv; ein zweiter Klick erzeugt dieselbe Meldung erneut und eine zweite Konsolenwarnung.

Nicht belegt: Audio-Ausgabe, Geste, Kanaltrennung, Pegel, `visibilitychange`-Verhalten von Safari. Der Windows-WebKit ist ausdrücklich **kein** Safari-Ersatz.

### 4.3 Protokollbogen macOS-Safari und iOS-Safari

Vorbereitung: `npm ci && npm run build && PORT=3333 node index.js`, dann im WLAN `http://192.168.0.14:3333/Esoterik-Welt/#frequenzen/labor` öffnen (IP beim Start prüfen). Für macOS-Safari reicht `http://127.0.0.1:3333/Esoterik-Welt/#frequenzen/labor`.

| # | Schritt | Erwartung | Ergebnis (ausfüllen) |
| --- | --- | --- | --- |
| 1 | Seite laden, DevTools-Konsole öffnen | keine Fehler, Labor rendert, Status „bereit“ | |
| 2 | „Ton starten“ antippen | Ton hörbar, Status „Ton läuft: 440 Hz, −20 dBFS.“, Kontext `running` | |
| 3 | Frequenzfeld auf 1000 setzen | Ton wird höher, Readout 1.000 Hz | |
| 4 | „Stopp“ | Ton endet ohne Nachklang, Status „Ton gestoppt.“ | |
| 5 | Binaural: Träger 200 Hz, Differenz 8 Hz, Kopfhörer | links tief, rechts leicht höher, langsames Schwellen | |
| 6 | Tab wechseln (andere App / anderer Tab), 5 s warten, zurück | Ton ist aus, Status „Seite im Hintergrund — Ton gestoppt.“ | |
| 7 | Erneut starten, dann Bildschirm sperren (iOS) | Ton endet, kein Weiterlaufen im Hintergrund | |
| 8 | Lautstärke auf Maximum | Pegelanzeige endet bei −6 dBFS, keine Übersteuerung | |
| 9 | Seiten-Quelltext: `new AudioContext()` im Konsolen-Protokoll | kein Hinweis auf blockierten Kontext | |

Zu notieren: Gerät, iOS-/macOS-Version, Safari-Version, Datum, Abweichung mit exakter Schrittnummer.

## 5. R-2 Manueller Screenreader

### 5.1 Was der Accessibility-Baum exponiert (Chromium 156, AX-Baum via CDP)

| Element | Rolle | Name | Wert / Eigenschaften |
| --- | --- | --- | --- |
| `#fqPlay` | button | „Ton starten“ | fokussierbar |
| `#fqStop` | button | „Stopp“ | `disabled` solange nichts läuft |
| `#fqFreqRange` | slider | „Frequenz, logarithmisch 20–20.000 Hz“ | Wert **447**, `valuemin 0`, `valuemax 1000`, `valuetext "447"` |
| `#fqFreqNumber` | spinbutton | „Frequenz in Hz“ | Wert 440, `valuemin 20`, `valuemax 20000` |
| `#fqGainRange` | slider | „Lautstärke“ | Wert **−20**, `valuemin −60`, `valuemax −6`, `valuetext "-20"` |
| `#fqGainReadout` | status | — | `live=polite`, `atomic` (jede Pegeländerung ist eine Live-Region) |
| `#fqSweepStart` / `#fqSweepCancel` | button | „Sweep starten“ / „Sweep abbrechen“ | abbrechen ist während des Sweeps aktiv |
| `#fqSweepProgress` | progressbar | „Sweep-Fortschritt“ | während des Sweeps `valuenow 24`, `valuemin 0`, `valuemax 100`; außerhalb `ignored` |
| `#fqStatus` | status | — | `live=polite`, `atomic` |
| `#fqError` | alert | — | `live=assertive`, `atomic`, `relevant=additions text` |

Textfolge der Live-Region `#fqStatus` (MutationObserver, Chromium):

| Zeit | Text | Auslöser |
| --- | --- | --- |
| 923 ms | „Sweep läuft: 200 → 800 Hz, 3 s.“ | Sweep-Start |
| 3 959 ms | „Sweep beendet bei 800 Hz.“ | Sweep-Ende |

Weitere belegte Ansagetexte: „Ton läuft: 440 Hz, −20 dBFS.“, „Ton gestoppt.“, „Sweep abgebrochen.“, „Binaural: 200 Hz links, 300 Hz rechts. Kopfhörer nötig.“, „Diese Frequenz ist ungültig. Erlaubt sind 20 bis 20.000 Hz.“

Evidenz-Badges: 32 Badges, jeweils mit Text („Belegt“, „Plausibel“, „Nicht belegt“, „Traditionell“), zusätzlich Farbklasse. Kein reiner Farbcode.

### 5.2 Befunde

#### R2-1 (Major): Frequenz-Slider exponiert die Reglerposition 0–1000 statt der Frequenz

Der Slider hat `min=0`, `max=1000`, `value=447` und keine `aria-valuetext`; der sichtbare Hz-Wert steht in einem separaten Absatz (`#fqFreqReadout`), der nicht mit dem Slider verknüpft ist. Ein Screenreader sagt damit „Frequenz, logarithmisch 20–20.000 Hz, Schieberegler, 447“ — eine Zahl ohne Einheit, die weder der Anzeige (440,0 Hz) noch einem hörbaren Wert entspricht.

Reproduktion (Chromium 156, AX-Baum oder NVDA):

1. `#frequenzen/labor` öffnen.
2. Bis zum Frequenz-Slider tabben.
3. Ansage: „Frequenz, logarithmisch 20–20.000 Hz, Schieberegler, **447**“; die Anzeige daneben nennt **440,0 Hz**.
4. Zweimal Pfeil rechts: Slider-Wert 449, Zahlenfeld 444,7, Anzeige 444,7 Hz — die Ansage nennt weiter nur „449“.

Erwartet: Der Wert wird in Hz angesagt, mindestens über `aria-valuetext` (z. B. „440 Hertz“), idealerweise zusätzlich `aria-describedby` auf die Anzeige.

Beleg: `evidence/t_4a8106de/ax-probe.json` (`#fqFreqRange`, `properties.valuetext`), `steps.sliderKeys`.

Auswirkung: Für Screenreader-Nutzer ist der Slider nicht sinnvoll bedienbar; sie müssen auf das Zahlenfeld ausweichen. NFR-14/U5 sind visuell erfüllt, für assistive Technik nicht. WCAG 2.1: 4.1.2 Name, Role, Value.

#### R2-2 (Minor): Lautstärke-Slider ohne Einheit

`#fqGainRange` exponiert `valuetext "-20"`; die Einheit dBFS steht nur in der visuellen Ausgabe („−20 dBFS“). Die Ausgabe ist als `role=status` eine Live-Region und kann bei jeder Reglerbewegung zusätzlich sprechen. Erwartet: `aria-valuetext` mit Einheit; Doppelansage prüfen.

#### R2-3 (Minor): Fehlertext steht gleichzeitig in `role=alert` und `role=status`

`showError()` schreibt den Text in `#fqError` (`role=alert`, assertive) **und** über `announce()` in `#fqStatus` (`role=status`, polite). Beide Regionen erhalten denselben Text; NVDA und VoiceOver können ihn doppelt ansagen. Zusätzlich wird der Alert-Text gesetzt, solange das Element `hidden` ist, und erst danach eingeblendet — ob das zuverlässig angesagt wird, ist screenreaderabhängig. Genau dieser Punkt ist im manuellen Test zu prüfen (Schritt 7 des Bogens).

#### R2-4 (Minor): Ohne Web Audio bleibt „Ton starten“ aktiv

Im WebKit ohne Audio-API bleibt der Startknopf bedienbar und erzeugt bei jedem Klick erneut Alert, Status und Konsolenwarnung. Erwartet: deaktivieren oder in einen dauerhaften Hinweis überführen.

### 5.3 Protokollbogen NVDA und VoiceOver

NVDA (Windows 11, Chromium und Firefox):

| # | Schritt | Erwartung | Ergebnis (ausfüllen) |
| --- | --- | --- | --- |
| 1 | Seite laden | Titel und Hauptbereich werden angesagt, kein leerer Fokus | |
| 2 | „Ton starten“ per Enter | Ansage „Ton läuft: 440 Hz, −20 dBFS.“ | |
| 3 | Tab auf Slider, Pfeiltasten | Wert wird **in Hz** angesagt (heute Befund R2-1) | |
| 4 | Zahlenfeld: 1000 eingeben, Enter | Ansage des neuen Werts, Ton höher | |
| 5 | „Stopp“ | Ansage „Ton gestoppt.“, keine Doppelansage | |
| 6 | Sweep starten (3 s) | Start- **und** Endansage, keine Unterbrechung | |
| 7 | Ungültige Frequenz (0) eingeben | Fehlermeldung genau **einmal** hörbar? (Befund R2-3) | |
| 8 | Lautstärke verstellen | Ansage mit Einheit, nicht doppelt (Befund R2-2) | |
| 9 | Bibliothek `#frequenzen` | Evidenz-Badge wird als Text vorgelesen | |
| 10 | Browser-Tab wechseln und zurück | Ansage beim Zurückkehren nachvollziehbar | |

VoiceOver (iOS-Safari, Rotor und Wischgesten):

| # | Schritt | Erwartung | Ergebnis |
| --- | --- | --- | --- |
| 1 | Seite laden, Rotor „Überschriften“ | Gliederung vollständig, keine Doppelüberschriften | |
| 2 | Startknopf doppeltippen | Ton startet, Ansage kommt | |
| 3 | Slider mit Wisch auf/ab | Wert in Hz, Schrittweite sinnvoll | |
| 4 | Zahlenfeld | Zifferntastatur (`inputmode=decimal`), Wert wird angesagt | |
| 5 | Sweep | Start- und Endansage | |
| 6 | Fehlerfall | Alert wird angesagt, Fokus bleibt bedienbar | |
| 7 | Badges | Evidenz als Text, nicht nur Farbe | |

## 6. R-3 Hörtest

### 6.1 Objektive Messungen (Chromium 156, echter Audio-Graph)

| Messung | Wert | Soll | Urteil |
| --- | --- | --- | --- |
| Pegeldeckel bei Regler-Endanschlag | Spitzenamplitude 0,501187 → **−6,000 dBFS** | −6 dBFS | bestanden (Abweichung 1,5 × 10⁻⁶ dB) |
| Startpegel −20 dBFS, ein Sinus | RMS 0,070481 → −23,039 dBFS RMS (Spitze 0,1 = −20 dBFS) | −20 dBFS Spitze | bestanden |
| Startpegel binaural, zwei Stimmen | je 1/n = 0,05 → RMS 0,035424 | 1/n-Regel | bestanden |
| Kanaltrennung 200 Hz links / 300 Hz rechts | links 200 Hz dominiert 10,4×, rechts 300 Hz 23,2×; Übersprechen 4,3 % / 9,6 % | deutliche Trennung | bestanden |
| Zustand nach „Stopp“ | Engine `idle`, beide Analysatoren RMS 0 | kein Restton im Graph | bestanden |
| `visibilitychange` (gestubbt) | Engine `idle`, RMS 0, Status „Seite im Hintergrund — Ton gestoppt.“ | Ton endet | Handler bestanden, Browserpfad offen |

Grenzen dieser Messungen:

- Gemessen wird der Graph im Browser, nicht der Weg über DAC, Verstärker und Kopfhörer. Knackser durch Hardware, Betriebssystem-Mixer oder Bluetooth sind damit nicht ausgeschlossen.
- Ein echter Tab-Wechsel ließ sich unter Automatisierung nicht auslösen: Weder `Target.activateTarget` noch das Minimieren des Fensters schalteten `document.visibilityState` auf `hidden`. Belegt ist deshalb nur die Verdrahtung des Handlers, nicht das Verhalten von Safari oder eines echten Nutzer-Tab-Wechsels.
- Die 8-Hz-Differenz ist mit dem Analysator-Fenster (2048 Samples, 23,4 Hz Binbreite) nicht auflösbar; die verkettete Auswertung über 1,28 s litt unter Lücken zwischen den Abfragen. Die Kanaltrennung ist deshalb über den 100-Hz-Fall belegt. Ein binauraler Schwebungseindruck entsteht ohnehin zentral und ist keine Amplitudenmodulation im Signal — er bleibt eine Gehörprüfung.
- Auf diesem Host gibt es kein Loopback-Aufnahmegerät; eine Aufnahme des tatsächlichen Ausgangssignals war nicht möglich.

### 6.2 Protokollbogen Hörtest

Material: geschlossene Kopfhörer, zusätzlich Lautsprecher, ruhiger Raum.

| # | Schritt | Erwartung | Ergebnis |
| --- | --- | --- | --- |
| 1 | Startpegel −20 dBFS, 440 Hz, Kopfhörer | leise, aber klar hörbar; kein Erschrecken | |
| 2 | Start/Stopp zehnmal | kein Knackser, kein Doppelklick, sauberes Ausklingen | |
| 3 | Sweep 200 → 2000 Hz, 6 s | gleichmäßig, kein Springen, kein Knacksen am Ende | |
| 4 | Lautstärke auf −6 dBFS | laut, aber unverzerrt; kein Schmerz | |
| 5 | Binaural 200/8 Hz mit Kopfhörer | links tief, rechts höher, deutliches Schwellen | |
| 6 | Binaural ohne Kopfhörer (Lautsprecher) | Differenz nicht hörbar — erwartetes Verhalten, kein Fehler | |
| 7 | Nach „Stopp“ 30 s warten | absolute Stille | |
| 8 | Navigation zu `#frequenzen`, zurück ins Labor | kein Ton im Hintergrund | |
| 9 | Tab wechseln und zurück | kein Ton, Status zeigt den Stopp | |
| 10 | Bildschirm sperren (iOS) | kein Ton nach dem Entsperren | |

## 7. Bewertung

- **R-1:** nicht erfüllt. Ohne macOS-Safari oder iOS-Gerät gibt es keinen Nachweis. Die statische Vorprüfung zeigt keine strukturellen Blocker; die offene Frage ist das Gesten-/Resume-Verhalten und alles Hörbare.
- **R-2:** nicht erfüllt. Ohne NVDA/VoiceOver gibt es keinen Nachweis der Ansagen. Der AX-Baum zeigt einen Major-Befund (R2-1) und drei Minor-Punkte; R2-1 sollte vor der Release-Erklärung behoben werden, weil er die Bedienbarkeit mit Screenreader praktisch aufhebt.
- **R-3:** nicht erfüllt. Die technisch messbaren Anteile sind bestanden; die Wahrnehmungsanteile brauchen einen Menschen mit Kopfhörern.

Empfehlung: R2-1 vor der öffentlichen Release-Erklärung beheben (kleiner Eingriff, `aria-valuetext` in `syncFrequency`). R-1 und R-3 als Geräteabnahme durch den Betreiber nachholen; die Bögen oben sind dafür ausreichend.

## 8. Rohdaten, Sonden, Reproduktion

| Datei | Inhalt |
| --- | --- |
| `evidence/t_4a8106de/ax-probe.json` | AX-Baum, DOM-Zustände, Status-/Fehlertexte in Chromium, Firefox, WebKit, mobiler Chromium-Emulation |
| `evidence/t_4a8106de/probe2.json` | WebKit ohne Web-Audio, Sweep-Status-Timeline, Kanaltrennung, Pegeldeckel |
| `evidence/t_4a8106de/probe3.json` | Kanaltrennung 8 Hz/100 Hz, Zustand nach Stopp, Tab-Wechsel-Versuch |
| `evidence/t_4a8106de/probe4.json` | drei Strategien für den Tab-Wechsel (S1, S2, S3) |
| `evidence/t_4a8106de/probe5.json` | Sweep-Fortschritt im AX-Baum während und nach dem Sweep |
| `evidence/t_4a8106de/metrics.md` | abgeleitete Pegel- und Verhältniswerte |
| `evidence/t_4a8106de/bcd-*.json` | Browser-Compat-Data zu `AudioContext` und `StereoPannerNode` |
| `evidence/t_4a8106de/chromium-*.png` | Screenshots des Labors (1440/390), Fehlerzustand, Hub mit Badges — ausdrücklich Chromium, kein Safari |

Reproduktion:

```bash
npm ci
npm run build
PORT=3333 node index.js          # in einem zweiten Terminal
node evidence/t_4a8106de/probes/ax-probe.mjs "http://127.0.0.1:3333/Esoterik-Welt" "evidence/t_4a8106de/ax-probe.json"
node evidence/t_4a8106de/probes/probe2.mjs   "http://127.0.0.1:3333/Esoterik-Welt" "evidence/t_4a8106de/probe2.json"
node evidence/t_4a8106de/probes/probe3.mjs   "http://127.0.0.1:3333/Esoterik-Welt" "evidence/t_4a8106de/probe3.json"
node evidence/t_4a8106de/probes/probe4.mjs   "http://127.0.0.1:3333/Esoterik-Welt" "evidence/t_4a8106de/probe4.json"
node evidence/t_4a8106de/probes/probe5.mjs   "http://127.0.0.1:3333/Esoterik-Welt" "evidence/t_4a8106de/probe5.json"
node evidence/t_4a8106de/probes/metrics.mjs  evidence/t_4a8106de
```

## 9. Offene Punkte

1. R-1: macOS-Safari und iOS-Safari nach Protokoll 4.3 prüfen.
2. R-2: NVDA (Chromium und Firefox) und VoiceOver nach Protokoll 5.3 prüfen; R2-1 bis R2-4 gegenprüfen.
3. R-3: Hörtest nach Protokoll 6.2 durchführen.
4. R2-1 beheben (Ticket an `coder`), danach Protokoll 5.3 Schritt 3 erneut prüfen.
5. Mindestanforderung dokumentieren, falls binaurale Wiedergabe auf iOS unter 14.5 nicht unterstützt werden soll (`StereoPannerNode` fehlt dort).
