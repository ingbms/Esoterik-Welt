# Frequenzlabor P9/P10 — Chladni-Muster und Meditationssitzungen

Stand: 2026-11-03 · Ticket: Kanban `t_aa849c1c` · Branch `feature/frequenzlabor-p9-p10`, aufgesetzt auf `fix/frequenzlabor-qa-m1` (`71b895c`)
Verbindlich: [ADR-0001](adr-frequenzlabor.md) mit [Nachtrag §13](adr-frequenzlabor.md#13-nachtrag-p9p10--chladni-muster-und-meditationssitzungen) · Vorgänger: [UI-Dokument](frequenzlabor-ui.md), [QA-Bericht](qa-frequenzlabor.md), [Abschlussreview](review-frequenzlabor.md)

Dieses Dokument beschreibt die zweite Ausbaustufe: **P9 Chladni/Cymatics** und **P10 Meditationssitzungen**. Es nennt, was gebaut wurde, wie es gemessen wurde und wo die Grenzen liegen. Alle Zahlen sind mit den unten genannten Befehlen erhoben.

---

## 1. Umfang und Routen

| Route | Ansicht | Inhalt |
| --- | --- | --- |
| `#frequenzen/cymatics` | Chladni-Muster | zwei Vergleichsmuster A/B, Modenwahl n und m, Knotenlinien, Textentsprechung, Modellgrenzen |
| `#frequenzen/meditation` | Meditationssitzung | Dauer, Klangpreset, Ein-/Ausblendung, Timer, lokale Favoriten, Wiederaufnahme |

Beide Ansichten sind Sub-Routen derselben Kategorie. `js/main.js` bleibt unverändert: `FREQUENZ_ROUTE` liefert die Segmente bereits an `FrequenzlaborModule.show()`. Ein unbekanntes Segment führt wie bisher zum Hub mit Hinweis; ein bekanntes, aber per Flag deaktiviertes Segment ebenfalls, mit dem Zusatz „ist in diesem Build nicht aktiviert“.

Die Bereichsnavigation (Hub, Labor, Cymatics, Meditation) zeigt einen Link nur, wenn das Flag des Features aktiv ist. Die aktuelle Ansicht erscheint als Text mit `aria-current="page"`, nicht als Link auf sich selbst.

---

## 2. Dateien

| Datei | Verantwortung | DOM |
| --- | --- | --- |
| `js/modules/frequenz-chladni.js` | Feldfunktion, Normierung, Nulldurchgänge, Symmetrie, Knotenlinien per Marching Squares; keine Frequenz, keine Zeit | nein |
| `js/modules/frequenz-meditation-model.js` | Presets, Validierung, Countdown-Arithmetik, Fade-Hüllkurve, versionierter Speicher | nein |
| `js/modules/frequenz-cymatics-view.js` | Canvas-Darstellung, Modenwahl, Fehlerfall, Textalternative | ja |
| `js/modules/frequenz-meditation-view.js` | Formular, Timer, Favoriten, Engine-Steuerung, Wiederaufnahme | ja |
| `js/modules/frequenzlabor.js` | +24 Zeilen Routing: Segmentwahl, dynamischer Import, `disposeFeatureView()`, `onInterrupt()` in `halt()` | ja |
| `js/modules/frequenz-flags.js` | `cymatics`/`meditation` auf `true`; Kommentar zum Kill-Switch | – |
| `css/frequenzlabor.css` | +86 Zeilen `.fq-figures`, `.fq-square`, `.fq-med*`, `.fq-favorite` | – |
| `tests/frequenz-chladni.mjs` | 8 Modelltests (C1–C8) | – |
| `tests/frequenz-meditation.mjs` | 9 Vertragstests (M1–M9) | – |
| `tests/frequenzlabor-p9-p10.spec.js` | 15 Browserfälle (C1–C6, M1–M5, A1–A4) | – |
| `tests/frequenz-presets.mjs` | Flag-Test auf ausgelieferten Zustand und Kill-Switch erweitert | – |

Die beiden Modelle sind DOM-frei und werden in `node --test` als echte ES-Module geprüft (Kopie in ein temporäres Verzeichnis mit eigener `package.json`, wie bei der Engine).

---

## 3. P9 — Chladni-Muster

### 3.1 Modell

Gezeichnet werden Knotenlinien der Familie

```
f(u, v) = cos(nπu)·cos(mπv) − cos(mπu)·cos(nπv),   u, v ∈ [0,1],   1 ≤ n, m ≤ 12, n ≠ m
```

(Kennung `rect-free-edge-difference-v1`). Das ist eine idealisierte Näherung für die Knotenlinien einer quadratischen Platte mit freien Rändern. Die historische Referenz für das Phänomen ist Ernst Chladni („Die Akustik“, 1802); der Code bildet eine idealisierte Modellfamilie ab und zitiert keine Messreihe.

Warum diese Form:

- Sie erzeugt die klassischen, diagonal versetzten Knotenlinien und ist ohne Eigenwertlöser exakt auswertbar.
- Ihre Eigenschaften sind analytisch prüfbar (Antisymmetrie, Spiegelsymmetrie, Nulldurchgänge der Mittelachsen) — der Test kann also das Modell prüfen, nicht nur die Zeichnung.
- `n = m` ist entartet (`f ≡ 0`). Die Ansicht behandelt das als Eingabefehler und zeichnet nichts.

### 3.2 Was die Ansicht zeigt — und was nicht

| Zeigt | Zeigt ausdrücklich nicht |
| --- | --- |
| Modenform für gewählte n, m | keine Frequenz zu einer Mode |
| berechnete Knotenlinien (Marching Squares, Nullniveau) | keine gemessene Platte, kein Material, keine Dicke, keine Halterung |
| Nulldurchgänge der Mittelachsen und Symmetrieklasse als Text | keine Aussage „Frequenz X erzeugt Muster Y“ |
| zwei Vergleichsslots A/B derselben Familie | keine künstlerische Partikelsimulation |

Die Oberfläche bietet **keine Frequenzwahl**; das ist die strukturelle Absicherung gegen die im Auftrag verbotene Aussage. Der Text unter jedem Bild nennt die Moden, die Anzahl der Nulldurchgänge auf waagerechter und senkrechter Mittelachse und die Symmetrie. Bei zwei ungeraden Moden liegt die Mittelachse vollständig auf einer Knotenlinie; das wird so benannt statt als „0 Nulldurchgänge“ fehlgedeutet.

### 3.3 Darstellung und reduzierte Bewegung

- Feld als 200 × 200-Raster, auf das Maximum normiert (Vergleichbarkeit zwischen Moden), weich auf die Canvas-Größe skaliert; Knotenlinien als 1–2 px breite Strecken in der Sandfarbe.
- Canvas-Bitmap = CSS-Breite × `min(devicePixelRatio, 2)`.
- **Keine Animationsschleife.** Neu gezeichnet wird nur bei Moduswechsel, Umschalten der Knotenlinien oder Größenänderung (entprellt, 150 ms). `prefers-reduced-motion` ist damit strukturell erfüllt; die Ansicht zeigt zusätzlich einen Hinweis, dass nie animiert wird.
- Das Canvas ist `aria-hidden="true"`; die Information steht als Text im DOM.

---

## 4. P10 — Meditationssitzungen

### 4.1 Sitzungssemantik

Eine Sitzung ist ein Timer über ein Klangpreset der ADR-§8.2-Allowlist mit Ein- und Ausblendung.

| Bedienelement | Werte | Verhalten |
| --- | --- | --- |
| Dauer | 3, 5, 10, 15, 20, 30, 45 Minuten | Timer startet mit der vollen Dauer; der Timer zeigt vor dem Start die Sollzeit |
| Klangpreset | 11 Einzeltöne (174, 285, 396, 417, 432, 440, 528, 639, 741, 852, 963 Hz), 4 binaurale Differenzen (2, 6, 10, 20 Hz auf 200 Hz) | Preset-Hinweis nennt bei binaural die Kopfhörerpflicht und dass keine EEG-Wirkung belegt ist |
| Einblenden | 0, 2, 5, 10 s | amplitudenlinear von −60 dBFS auf −20 dBFS |
| Ausblenden | 0, 2, 5, 10 s | umgekehrt, danach `engine.stop()` |
| Start / Beenden | – | Start nur im Klick (kein Autoplay); Beenden blendet aus |
| Timer | `mm:ss` | `role="timer"`, `aria-live="off"`; Ansage nur bei Start, bei einer Minute Restzeit und am Ende |

Während einer Sitzung sind Dauer, Preset und Fades gesperrt; das verhindert, dass die laufende Sitzung unbemerkt andere Parameter erhält.

### 4.2 Fades ohne Änderung des Engine-Vertrags

`play()` blendet höchstens 1000 ms ein (`fadeInMs`), `setGain()` rampt 25 ms. Eine Blende über 10 Sekunden wird deshalb als Folge von `setGain()`-Schritten im Abstand von 100 ms ausgeführt: Start bei `−60 dBFS` (Hörschwelle des Labors), dann amplitudenlinear bis `−20 dBFS`; Ausblenden in umgekehrter Richtung, danach `stop()`. Die Hüllkurve wird im Modell berechnet (`fadeGainSteps`) und in `tests/frequenz-meditation.mjs` auf Monotonie, Endpunkte und Amplitudenlinearität geprüft (M4).

Damit bleibt ADR §4 unverändert. Insbesondere entsteht kein dritter Audiozustand: die offene Auflage „Pause/Weiter in der Engine“ (`t_f2a0868c`) berührt P10 nicht, weil die Meditation weder pausiert noch die Engine erweitert.

### 4.3 Unterbrechung und Wiederaufnahme

| Ereignis | Verhalten |
| --- | --- |
| Tabwechsel (`visibilitychange → hidden`), `pagehide`, Verlassen der Ansicht | Audio stoppt sofort; die Restzeit wird lokal gesichert; bei Rückkehr erscheint „Unterbrochene Sitzung: 07:12 übrig“ mit „Fortsetzen“ und „Verwerfen“ |
| „Fortsetzen“ | startet Audio und Countdown mit der gesicherten Restzeit, löscht den gesicherten Eintrag |
| „Sitzung beenden“ oder reguläres Ende | löscht den gesicherten Eintrag; keine Wiederaufnahme eines bewusst beendeten Laufs |

### 4.4 Lokaler Speicher

Schlüssel: `esoterik-welt:frequenzlabor:meditation:v1` (getrennt vom Labor-Schlüssel `…:frequenzlabor:v1`, damit Labor- und Sitzungsdaten sich nicht gegenseitig überschreiben).

```json
{
  "version": 1,
  "favorites": [
    {
      "id": "fav-1",
      "name": "Abend",
      "durationSeconds": 600,
      "presetId": "tone-432",
      "fadeInSeconds": 5,
      "fadeOutSeconds": 5
    }
  ],
  "resume": {
    "durationSeconds": 600,
    "presetId": "tone-432",
    "fadeInSeconds": 5,
    "fadeOutSeconds": 5,
    "remainingSeconds": 305
  }
}
```

Regeln: maximal 8 Favoriten, Name ≤ 60 Zeichen, Dauer ganzzahlig 60–2700 s, Preset aus der Allowlist, Fades aus {0, 2, 5, 10}. Es gibt **keine Zeitstempel, keinen Verlauf, keine Zählung**. Unbekannte Versionen werden ignoriert und beim nächsten Schreiben überschrieben; defekte Einträge werden beim Lesen verworfen. Bei blockiertem `localStorage` bleiben Sitzung und Timer nutzbar, Favoriten und Wiederaufnahme entfallen mit sichtbarem Hinweis.

### 4.5 Datenschutz

Keine Registrierung, keine Cloud, keine Übertragung von Nutzungsdaten, keine Cookies, keine Analytics, keine externen Requests. Die Sitzung erzeugt ausschließlich Oszillatoren über die vorhandene Engine. Die Datenschutzseite nennt die lokale Speicherung von Favoriten und Wiederaufnahme.

---

## 5. Flags, Lazy Loading und Initialgraph

- `cymatics` und `meditation` stehen auf `true` (ausgeliefert). Der lokale Kill-Switch (`?fq=-cymatics`, `?fq=-meditation`) bleibt; in Produktion wird der Override ignoriert.
- Beide Ansichten werden ausschließlich per dynamischem `import()` aus `frequenzlabor.js` geladen — erst wenn die Route sie anfordert und das Flag aktiv ist.
- `js/main.js` und alles, was es statisch importiert, bleiben unverändert. Der Initialgraph ist deshalb **byte-identisch** zur Kernversion: 85.613 B gzip (17 Dateien).
- Bei deaktiviertem Flag entsteht **kein Request** auf `frequenz-cymatics-view.js` bzw. `frequenz-meditation-view.js` (E2E C6/M5).

---

## 6. Barrierefreiheit

| Prüfung | Ergebnis |
| --- | --- |
| axe-core, WCAG 2.0/2.1 A + AA, auf `#frequenzen` in beiden Ansichten | **0 Verstöße** (auch `color-contrast`) |
| Kontrast (berechnet aus computed styles) | 9,09 : 1 bis 15,36 : 1; gefordert 4,5 : 1 (große Schrift 3 : 1) |
| Tastatur | alle Formularelemente, Start/Beenden, Favoritenaktionen und Modenwahl sind native `<button>`/`<select>`/`<input>` und per Tab erreichbar (A2) |
| Canvas | `aria-hidden="true"`; Textentsprechung im DOM (Moden, Nulldurchgänge, Symmetrie) |
| Timer | `role="timer"` mit `aria-live="off"`; Statusmeldungen über `role="status"` mit Drosselung auf eine Ansage pro Sekunde |
| Fehler | `role="alert"` (entartete Mode, blockierter Speicher, Audiofehler) |
| `prefers-reduced-motion` | keine rAF-Schleife; Messung im Cymatics-Test: < 5 Aufrufe insgesamt, 0 AudioContext |
| 360 px | kein horizontaler Scroll in beiden Ansichten (`scrollWidth 360 = innerWidth 360`); Formularziele 44–50 px (A3) |
| Fokus | nach dem Ansichtswechsel auf der H1 (`tabindex="-1"`, `preventScroll`), sichtbarer Fokusring |

Nicht maschinell geprüft: manueller Screenreader-Durchlauf, Safari/iOS und ein Hörtest — das bleibt bei der Auflage A5 (`t_4a8106de`).

---

## 7. Budget und Offline-Build

`npm run check:frequenz-budget` (gzip -9):

| Kennzahl | Wert | Grenze | Veränderung zur Kernversion |
| --- | --- | --- | --- |
| NFR-1 Initialgraph (statisch) | 85.613 B, 17 Dateien (291.343 B roh) | 86.275 B | **0 B** |
| NFR-2 Feature-JS | 43.390 B, 10 Dateien (163.826 B roh) | 100.000 B | +15.223 B |
| NFR-3 Feature-CSS | 3.338 B (16.795 B roh) | 6.000 B | +435 B |

Der Offline-Build (`scripts/build-local.cjs`, `dynamicImportMode: 'eager'`) bündelt beide Ansichten in `local.js`; `Lokal.html` wächst von 790.818 B auf 825.909 B. Geprüft mit Chromium über `file://`: Bibliothek mit 32 Einträgen, Cymatics zeichnet Knotenlinien, Meditation startet (Timer 02:59 nach einer Sekunde), `localStorage` funktioniert.

---

## 8. Testmatrix (tatsächliche Ergebnisse)

| Suite | Befehl | Ergebnis |
| --- | --- | --- |
| Modelle + Engine + Presets/Flags | `npm run test:frequenz` | **51 pass, 0 fail** (34 bestehend + 8 Chladni + 9 Meditation) |
| Neue Browserfälle | `npx playwright test tests/frequenzlabor-p9-p10.spec.js` | **15 pass, 0 fail** (C1–C6, M1–M5, A1–A4) |
| Volle Browser-Suite | `E2E_PORT=<frei> CI=1 npx playwright test` | **104 pass, 0 fail** (1,9 min; inkl. U1–U15, Astrologie, Mond, Tarot, Smoke) |
| Bestehende Frequenzlabor-UI | Teil der vollen Suite | **U1–U15 pass** |
| Seiten-/Offline-Regression | `npm run test:pages`, `npm run test:local`, `npm run test:offline` | 6 / 12+2 skip / 2 pass |
| Budget | `npm run check:frequenz-budget` | NFR-1 85.613 / 86.275 · NFR-2 43.390 / 100.000 · NFR-3 3.338 / 6.000 |
| Lint/Format | `npm run lint`, `npm run format:check` | 0 Fehler, alle Dateien formatiert |

Modelltests im Detail: C1 Gültigkeit/Entartung, C2 Antisymmetrie und 180°-Drehung, C3 Spiegelsymmetrie nur bei gleicher Parität, C4 Normierung und Rastergröße, C5 analytische Nulldurchgänge (n=2,m=3 → 3/3; n=4,m=7 → 7/7; n=3,m=5 → Mittelachsen vollständig Knotenlinie), C6 Text ohne Hz-Aussage, C7 Knotenlinien auf dem Nullniveau, C8 keine Frequenzzuordnung im Modul.
Sitzungstests: M1 Allowlist, M2 Validierung, M3 Uhr/Restzeit, M4 Fade-Hüllkurve, M5 Speicher-Versionierung, M6 blockierter Speicher, M7 Favoriten-IDs/Obergrenze, M8 Wiederaufnahme, M9 Dauern/Fades.

Rohdaten und Screenshots: `evidence/t_aa849c1c/` (`measurements.json` mit axe-Ergebnissen, Kontrastwerten, Canvas-Messwerten, Touch-Zielen und Modul-Requests; vier Screenshots bei 1440 px und 360 px; Messskript `measure-p9-p10.cjs`).

---

## 9. Bewusste Entscheidungen

1. **Flags auf `true`.** Die Folgestufe ist damit ausgeliefert, nicht nur vorbereitet. Der Kill-Switch bleibt lokal wirksam; ein Rückbau ist eine Konstante in `frequenz-flags.js`.
2. **Fades über `setGain()`-Schritte statt neuer Engine-Methode.** Hält ADR §4 unverändert und vermeidet eine Kollision mit der Pause/Weiter-Auflage `t_f2a0868c`.
3. **Eigener Speicherschlüssel für die Meditation.** Der Labor-Schlüssel bleibt unverändert; Sitzungsdaten können die Laborpräferenzen nicht beschädigen und umgekehrt.
4. **Keine Animation der Muster.** `prefers-reduced-motion` ist nicht als Sonderfall implementiert, sondern als einziger Zustand; das ist die ehrlichste Umsetzung der Anforderung und spart rAF-Last.
5. **Entartete Moden sind ein Fehler.** Ein leeres Bild mit „n = m“ wäre eine stille Falschdarstellung; die Ansicht erklärt stattdessen, warum nichts gezeichnet wird.
6. **Kein Frequenzbezug in P9.** Die Modenwahl ist die einzige Eingabe; damit ist die verbotene Aussage konstruktiv ausgeschlossen, nicht nur textlich verboten.

---

## 10. Offene Grenzen

- Das Modell ist keine Eigenwertlösung: es nennt keine Frequenz zu einer Mode und trifft keine Aussage über reale Platten (Dicke, Material, Halterung, Anregungspunkt).
- Reale Chladni-Figuren weichen von der idealisierten Familie ab; das steht in der Ansicht und in diesem Dokument.
- Binaurale Differenzen sind eine Hördemonstration; eine EEG-Wirkung ist nicht belegt und wird nicht behauptet.
- Manuelle Screenreader-, Safari/iOS- und Hörtests stehen aus (Auflage A5, `t_4a8106de`).
- Die Flags sind ein Übergang; nach zwei Releases werden sie nach AD-5 entfernt.
