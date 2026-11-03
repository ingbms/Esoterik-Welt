# Pendellabor — Modell, Rechnung, Grenzen (ESOW-RAD-07)

Stand: 3. November 2026 · Branch `feature/radiasthesie-modul` · Basis `bfca75b`

Dieses Dokument beschreibt, **was** der Simulator rechnet und **warum** die
Anzeige so aussieht. Es ist die technische Begründung zur Route
`#pendeln/labor`; die Bedienoberfläche selbst steht in
`js/modules/radiasthesie-views.js` (`renderLabor`), die Physik in
`js/modules/pendel-simulator.js`.

## 1. Zweck und Abgrenzung

Das Pendellabor zeigt die freie, gedämpfte Schwingung eines Fadenpendels. Es
ist ein Mechanik-Exponat der Werkstatt und ausdrücklich **kein** Instrument zur
Informationsgewinnung: Es beantwortet keine Fragen, zeigt keine Felder und
sagt nichts über Personen, Orte oder Ereignisse voraus. Diese Abgrenzung steht
nicht nur in der Dokumentation, sondern als „Was diese Simulation nicht tut“
auf der Seite selbst.

Die Seite ist eine echte Route im bestehenden `#pendeln`-Router, keine
Teaser-Attrappe. Die Werkstatt-Karte der Startseite trägt den Stand
„Verfügbar“ und verlinkt sie.

## 2. Modell

Bewegungsgleichung des nichtlinearen Fadenpendels mit viskoser Dämpfung:

```
θ″(t) = −(g/L)·sin θ(t) − 2ζω₀·θ′(t),      ω₀ = √(g/L)
```

| Symbol | Bedeutung | Einheit | Bereich | Standard |
| --- | --- | --- | --- | --- |
| `L` | Fadenlänge (Aufhängepunkt bis Schwerpunkt) | m | 0,05 – 2,00 | 0,25 |
| `θ₀` | Anfangsauslenkung gegen die Senkrechte | ° | 0 – 80 | 25 |
| `ζ` | Dämpfungsgrad (dimensionslos) | – | 0 – 0,20 | 0,02 |
| `g` | Fallbeschleunigung, fest gesetzt | m/s² | 9,81 | 9,81 |
| `θ` | Auslenkung | rad | folgt aus θ₀ | – |
| `θ′ = ω` | Winkelgeschwindigkeit | rad/s | – | 0 |
| `t` | simulierte Zeit | s | – | 0 |

Annahmen: Punktmasse am masselosen Faden, fester Aufhängepunkt, keine
Zwangsführung, keine Fadenmasse, keine elastische Aufhängung, Luftwiderstand
nur als viskoser Term proportional zu `θ′`. `g` ist bewusst nicht einstellbar:
Eine zweite Stellschraube würde die Nachvollziehbarkeit nicht erhöhen.

## 3. Warum die volle Gleichung statt der Kleinwinkelformel

Die Näherung `sin θ ≈ θ` führt auf `T₀ = 2π√(L/g)`. Sie steht auf der Seite als
**Vergleichswert**, wird aber nicht integriert. Die Abweichung wächst mit der
Auslenkung; Referenz ist das vollständige elliptische Integral erster Art,
hier über das arithmetisch-geometrische Mittel berechnet
(`T = 4√(L/g)·K(sin(θ₀/2))`):

| θ₀ | T₀ (Formel) | exakt (AGM) | Abweichung |
| --- | --- | --- | --- |
| 2° | 1,003033 s | 1,003110 s | +0,008 % |
| 25° | 1,003033 s | 1,015100 s | +1,203 % |
| 45° | 1,003033 s | 1,043128 s | +3,997 % |
| 60° | 1,003033 s | 1,076437 s | +7,318 % |
| 80° | 1,003033 s | 1,140943 s | +13,749 % |

(Alle Werte für `L = 0,25 m`, `g = 9,81 m/s²`.) Die Reihenentwicklung
`T ≈ T₀(1 + θ₀²/16 + 11θ₀⁴/3072)` liefert bei 80° +13,55 % und unterschätzt
damit die exakte Abweichung — ein Grund, im Test die exakte Referenz und nicht
die Reihe zu verwenden.

## 4. Integrator

- Klassisches Runge-Kutta 4. Ordnung auf dem Zustand `(θ, ω)`.
- Fester Schritt `dt = 1/480 s` ≈ 2,08 ms.
- Akkumulator: `advance()` sammelt verstrichene Zeit in `carry` und führt nur
  ganze Schritte aus. Ein Aufruf verarbeitet höchstens 0,25 s, damit ein
  Tab-Wechsel keinen Sprung erzeugt; die Restzeit bleibt erhalten.
- Notbremse `maxSubSteps = 240` gegen fehlerhafte Aufrufe.
- Negative, `NaN`- oder `Infinity`-Zeiten zählen als 0.

Nachweis der Zeitunabhängigkeit (`tests/radiasthesie-simulator.mjs`):

- 2,0 s in Schritten von 1/60 s, 1/144 s und 0,25 s ergeben denselben Zustand
  (Abweichung < 1e-9; die Schrittfolge ist identisch, nur die Zustellung
  unterscheidet sich).
- `simulate()` mit 30 und 144 fps liefert nach 4 s dieselbe Auslenkung und
  Winkelgeschwindigkeit (< 1e-9).
- Energieerhaltung ohne Dämpfung über 30 s: relative Drift −1,21e-10.

## 5. Periodenanzeige

„Gemessen“ heißt: Dauer zwischen zwei **Aufwärts**-Nulldurchgängen der
berechneten Bewegung. Der Nulldurchgang wird zwischen zwei Abtastpunkten
linear interpoliert; ohne diese Interpolation hinge die Anzeige an der
Bildrate (bei 60 fps bis zu ±33 ms Fehler pro Periode).

| θ₀ | gemessen | exakt | Fehler |
| --- | --- | --- | --- |
| 2° | 1,003108 s | 1,003110 s | −0,0002 % |
| 25° | 1,015099 s | 1,015100 s | −0,0002 % |
| 45° | 1,043131 s | 1,043128 s | +0,0003 % |
| 60° | 1,076434 s | 1,076437 s | −0,0003 % |
| 80° | 1,140947 s | 1,140943 s | +0,0003 % |

Gedämpft gilt `T_ζ = 2π/(ω₀√(1−ζ²))`; gemessen für `L = 0,6 m`, `θ₀ = 5°`:

| ζ | gemessen | T_ζ | T₀ |
| --- | --- | --- | --- |
| 0,02 | 1,554298 s | 1,554203 s | 1,553893 s |
| 0,05 | 1,555843 s | 1,555839 s | 1,553893 s |
| 0,20 | 1,585926 s | 1,585935 s | 1,553893 s |

## 6. Dämpfung

Die Dämpfung wirkt als Drehmoment proportional zu `θ′`. Pro voller Periode
fällt die Amplitude um den Faktor `exp(−2πζ/√(1−ζ²))`; bei ζ = 0,05 sind das
rund 27 % Verlust, gemessen über die Wendepunkte innerhalb 1 % (Test
„logarithmisches Dekrement“). Ab ζ > 0 erkennt die Oberfläche die Ruhelage
(`|θ| < 0,0015 rad` und `|ω| < 0,01 rad/s`) und beendet die Schleife mit dem
Status „Zur Ruhe gekommen“.

## 7. Bedienung, Zustände, Lebenszyklus

| Zustand (`data-psim-state`) | Bedeutung |
| --- | --- |
| `idle` | Ruhelage in θ₀, noch keine Bewegung |
| `running` | Schleife läuft, `requestAnimationFrame` aktiv |
| `paused` | durch Stop angehalten, Frame-Schleife beendet |
| `settled` | gedämpft zur Ruhe gekommen, Schleife beendet |

- **Regler**: drei native `input[type=range]` mit `<label for>`, `<output for>`
  und `aria-describedby`-Hinweis. Länge in cm (5–200), Auslenkung in Grad
  (0–80), Dämpfung als ζ (0–0,200, Schritt 0,005).
- **Änderungen**: Länge und Anfangsauslenkung setzen den Lauf auf `t = 0`
  zurück (neue Anfangsbedingung), die Dämpfung wirkt sofort auf den laufenden
  Zustand.
- **Darstellungen**: Klassisch (Messingkegel), Kugel (Stahlkugel), Ring. Alle
  drei zeichnen dasselbe Modell; gewechselt wird nur die SVG-Gruppe.
- **Start/Stop** ist ein `<button>` mit `aria-pressed`; die Bühne ist per
  `tabindex="0"` fokussierbar und schaltet mit Leertaste/Eingabetaste.
- **rAF-Lebenszyklus**: `cancelAnimationFrame` bei Stop, `destroy()` beim
  Neu-Rendern der Modulansicht, bei `hashchange` weg von `#pendeln/labor` und
  bei `pagehide`. Kein Timer und kein Frame überlebt die Route.
- **Reduzierte Bewegung** (`prefers-reduced-motion: reduce`): keine Schleife,
  Start wird durch „Schritt 0,5 s“ ersetzt, jeder Klick rückt deterministisch
  um 0,5 s vor; Status und `aria-label` der Bühne werden angepasst. Ändert sich
  die Systemeinstellung zur Laufzeit, wird die laufende Animation angehalten.
- **Touch**: Ziele ≥ 44 px, native Regler, kein horizontales Überlaufen bei
  390 px Breite.
- **Zahlen**: deutsches Dezimalkomma, typografisches Minus (U+2212),
  `tabular-nums` gegen Zappeln.

## 8. Grenzen

| Grenze | Wert / Begründung |
| --- | --- |
| Modellgültigkeit | Punktmasse, masseloser Faden, viskose Dämpfung |
| Länge | 0,05–2,00 m; außerhalb wirft die API `RangeError` |
| Auslenkung | 0–80°; darüber wäre die Darstellung im Bildausschnitt nicht mehr sinnvoll und die Näherung weit weg |
| Dämpfung | 0–0,20; ζ ≥ 1 (aperiodischer Fall) ist nicht Teil des Modells |
| Fallbeschleunigung | fest 9,81 m/s², keine Ortsabhängigkeit |
| Nicht enthalten | Fadenmasse, Aufhängungselastizität, quadratischer Luftwiderstand, Antrieb, Chaos |
| Anzeige „gemessen“ | Dauer der **berechneten** Bewegung, kein physisches Pendel |

Ein von Hand gehaltenes Pendel folgt dieser Gleichung nicht allein:
Carpenter-Effekt (unwillkürliche Handbewegung durch Erwartung) und
Kohnstamm-Effekt (Muskelkontraktion nach Spannung und visueller Fixierung)
erklären den Ausschlag, ohne Information zu übertragen. Der Absatz steht mit
Quellenmarkern `[Q03, Q07]` auf der Seite und verlinkt ins Quellenverzeichnis.

## 9. Entscheidungen

| Nr. | Entscheidung | Begründung |
| --- | --- | --- |
| D1 | Kein Autoplay; Start erst auf Klick | Bewegung ohne Nutzerentscheidung ist auf einer Informationsseite unnötig und für `prefers-reduced-motion` heikel |
| D2 | Volle Gleichung integrieren, T₀ nur vergleichen | Die Anzeige soll die Näherung nicht als Wahrheit verkaufen |
| D3 | Kein Query-Zustand in der Route | Ein Deep-Link auf „60°, 1 m“ würde eine bestimmte Bewegung behaupten; die Regler sind die Quelle |
| D4 | „Gemessen“ = simuliert, im Text benannt | Vermeidet die Lesart, es werde ein physisches Pendel vermessen |
| D5 | Reduzierte Bewegung als Schrittmodus | Besser als eine eingefrorene, aber unbedienbare Bühne |
| D6 | Kein Laufzeit-Import von `WERKSTATT` | Die Fassade dient Journal/Experiment (RAD-09/10); der Simulator braucht keine Taxonomie zur Laufzeit. Die fachlichen Aussagen (Carpenter/Kohnstamm) stehen als geprüfter Text mit Q03/Q07 auf der Seite. Abweichung von `VERTRAEGE.md` §8, dort als „nutzt“ beschrieben |
| D7 | Statische SVG-Bühne, Rotation per `transform` | Skaliert verlustfrei, funktioniert ohne Canvas-Pixeltricks, bleibt im Druck lesbar |

## 10. Reproduktion

```bash
node --test tests/radiasthesie-simulator.mjs      # 21 Physik-/Ansichtstests
npx playwright test tests/radiasthesie-simulator.spec.js   # 11 Browsertests
npm run build && npm run verify:build              # Seite + file://-Build
```
