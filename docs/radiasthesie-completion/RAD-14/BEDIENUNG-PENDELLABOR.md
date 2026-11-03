# Bedienungsanleitung — Pendellabor

**Route:** `#pendeln/labor` · **Paket:** RAD-07 · **Modell:** nichtlineares Fadenpendel, RK4
**Voraussetzungen:** JavaScript aktiv, ein aktueller Browser. Kein Konto, keine Anmeldung, keine Netzverbindung nötig.

## 1. Wozu das Werkzeug da ist

Das Pendellabor zeigt, **wie ein Pendel schwingt** — nicht, wie man mit einem Pendel
„Antworten“ erhält. Länge, Anfangsauslenkung und Dämpfung sind einstellbar; das
Labor rechnet die Bewegungsschritte und zeigt die gemessene Schwingungsdauer neben
dem Wert der Kleinwinkelformel. Damit lässt sich der Unterschied zwischen
Modell und Näherung selbst nachvollziehen.

Was es **nicht** tut: Es misst keine radiästhetische Wirkung, keine „Energie“ und
keine Antwort. Es ist ein Physikmodell mit denselben Gleichungen wie ein reales
Fadenpendel.

## 2. Aufbau der Seite

1. **Bühne** mit der Pendelzeichnung (drei Darstellungen: Klassisch — Faden und
   Messingkegel, Kugel — Faden und Stahlkugel, Ring — Faden und Metallring).
   Die Darstellung ändert nur die Zeichnung, nicht die Physik.
2. **Regler** für Pendellänge L (5–200 cm), Anfangsauslenkung θ₀ (0–80°) und
   Dämpfungsgrad ζ (0–0,200). Jeder Regler hat eine Beschriftung, eine
   Wertanzeige und einen Hinweistext.
3. **Schaltflächen:** `Start` (wird im Lauf zu `Pause`, mit `aria-pressed`
   gekennzeichnet), `Zurücksetzen`.
4. **Messwerte:** simulierte Zeit, aktuelle Auslenkung, gemessene
   Schwingungsdauer (aus Nulldurchgängen, interpoliert) und T₀ der
   Kleinwinkelformel.
5. **Modellabschnitt** mit Bewegungsgleichung, Gültigkeitsbereich und dem, was
   die Simulation nicht leistet.

## 3. Erste Schritte

1. `#pendeln/labor` öffnen (Startseite → Werkstatt → „Pendellabor“).
2. L = 25 cm, θ₀ = 2°, ζ = 0 stehen lassen — das ist der Vergleichsfall zur
   Kleinwinkelformel.
3. `Start` drücken. Die Bühne bewegt sich, die Messwerte laufen mit.
4. Nach einigen Schwingungen ablesen: „Schwingungsdauer gemessen“ und
   „Schwingungsdauer T₀ (Kleinwinkel)“ liegen fast gleichauf.
5. `Stop` drücken, dann θ₀ auf 60° stellen und erneut starten. Jetzt weicht die
   gemessene Dauer sichtbar nach oben ab — die Näherung gilt nur für kleine
   Winkel.
6. `Zurücksetzen` bringt Zeit, Auslenkung und Messung in den Ausgangszustand;
   die Regler bleiben stehen.

## 4. Die drei Stellgrößen

| Regler | Bereich | Wirkung |
| --- | --- | --- |
| Pendellänge L | 5–200 cm | längere Fäden schwingen langsamer; T₀ wächst mit √L |
| Anfangsauslenkung θ₀ | 0–80° | größere Winkel → längere Dauer; die Kleinwinkelformel wird zunehmend ungenau |
| Dämpfungsgrad ζ | 0–0,200 | bremst die Bewegung; die gedämpfte Periode ist geringfügig länger als T₀ |

Die gedämpfte Periode folgt `T_ζ = 2π / (ω₀ · √(1 − ζ²))`; bei ζ = 0,05 liegt der
Unterschied im Millisekundenbereich.

## 5. Was die Zahlen bedeuten (belegte Werte aus RAD-07)

| Fall | Wert |
| --- | --- |
| T₀ bei L = 0,25 m | 1,003033 s |
| gemessen bei θ₀ = 2° | 1,003108 s (Abweichung −0,0002 %) |
| exakte Periode bei 60° (AGM-Referenz) | 1,076437 s |
| gemessen bei 60° | 1,076434 s |
| Abweichung der Kleinwinkelformel | +1,203 % (25°), +7,318 % (60°), +13,749 % (80°) |
| ζ = 0,05 | gemessen 1,555843 s, Formel 1,555839 s |

Diese Werte sind Modellnachweise, keine Messung an einem echten Pendel.

## 6. Reduzierte Bewegung

Ist im Betriebssystem „Bewegung reduzieren“ gesetzt, läuft keine Endlosschleife.
Statt `Start` erscheint `Schritt 0,5 s`: Jeder Klick rechnet 0,5 Sekunden weiter.
Die Zahlen bleiben ablesbar; nur die Animation entfällt.

## 7. Bedienung ohne Maus

- `Tab` erreicht nacheinander die drei Regler und die Schaltflächen; die
  Reihenfolge folgt der Lesereihenfolge.
- Pfeiltasten ändern den fokussierten Regler; `Pos1`/`Ende` springen an den
  Bereichsrand (Browserstandard für `input type="range"`).
- `Leertaste` oder `Enter` löst `Start`/`Stop` und `Zurücksetzen` aus.
- Der Statusbereich (`role="status"`, `aria-live="polite"`) meldet Zustände wie
  „Ruhelage bei 25,0°“.

## 8. Grenzen

- **Kein Messgerät.** Die Simulation ist deterministisch aus den Reglern; Zufall
  gibt es nicht und wird nicht gebraucht.
- **Kleinwinkelformel nur als Vergleich.** Sie gilt für kleine Auslenkungen; das
  Labor zeigt die Abweichung, statt sie zu verstecken.
- **Nur Chromium geprüft** (Playwright 1.64/Chromium 155). Firefox und Safari
  wurden nicht gefahren.
- **Kein Screenreader-Lauf.** Struktur, Labels und Live-Region sind geprüft, die
  Ansage selbst nicht.
- **Kein Druck/PDF-Nachweis** für diese Seite.
- **Kein Speichern.** Einstellungen gehen beim Verlassen der Route verloren; das
  ist Absicht (keine Adresse, kein Zustand, keine Wiederherstellung eines
  „Versuchs“).

## 9. Wenn etwas nicht funktioniert

| Beobachtung | Ursache / Abhilfe |
| --- | --- |
| Bühne steht still, `Start` reagiert nicht | JavaScript blockiert oder Modul nicht geladen; Seite neu laden, Konsole prüfen |
| `Start` fehlt, nur `Schritt 0,5 s` | reduzierte Bewegung ist aktiv — so gewollt |
| Messwert „—“ | es sind noch keine zwei Nulldurchgänge gelaufen; länger laufen lassen |
| Bewegung läuft nach Routenwechsel weiter | Fehler; `destroy()` sollte die Schleife beenden (RAD-07 getestet) — Seite neu laden und melden |

## 10. Datenschutz

Das Pendellabor schreibt **nichts** in den Browser-Speicher, setzt keine Cookies
und stellt keine Netzwerkanfrage. Es gibt keine Auswertung außerhalb der Seite.
