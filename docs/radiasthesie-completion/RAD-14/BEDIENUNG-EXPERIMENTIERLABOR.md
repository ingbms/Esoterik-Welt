# Bedienungsanleitung — Experimentierlabor

**Route:** `#pendeln/experiment` · **Paket:** RAD-09 · **Statistik:** exakter zweiseitiger Binomialtest, Wilson-95-%-Intervall
**Voraussetzungen:** JavaScript aktiv, `crypto.getRandomValues` verfügbar (alle aktuellen Browser). Kein Konto, keine Netzverbindung.

## 1. Wozu das Werkzeug da ist

Das Labor führt eine **verblindete Testreihe** durch und wertet sie nach einem
Protokoll aus, das **vor** dem ersten Versuch feststeht. Es beantwortet die
Frage: „Treffe ich häufiger als der Zufall, wenn ich das Ziel nicht sehe?“ —
und es zeigt, wie schnell solche Reihen zufällig gut aussehen.

Was es **nicht** leistet: keinen Nachweis einer Fähigkeit. Die Seite sagt
ausdrücklich „Hinweis, kein Nachweis“. Clientseitige Verblindung ist begrenzt
(siehe §9).

## 2. Zwei Modi

| Modus | Verhalten |
| --- | --- |
| **Testmodus** | Protokoll vor dem Start sichtbar; Ziel verdeckt; Antwort gesperrt und gespeichert, **erst danach** enthüllt; Auswertung, Trial-Tabelle, JSON-/CSV-Export; Löschen nur ganzer Läufe |
| **Spielmodus (Demo)** | sofortiges Feedback, **kein** Speicher, **keine** Statistik, **kein** Export; sichtbar als „zählt nicht“ gekennzeichnet |

Ein Moduswechsel mitten im Lauf verändert weder Versuchszähler noch gespeicherte
Versuche (getestet). Der Spielmodus hat einen eigenen `Spielstand zurücksetzen`.

## 3. Die drei vorregistrierten Experimente

| Experiment | Zielraum k | Fallzahl n | Zufallserwartung p = 1/k |
| --- | --- | --- | --- |
| Verblindeter Ja/Nein-Test, 20 Versuche | 2 | 20 | 0,5 |
| Verblindeter Acht-Orte-Test, 16 Versuche | 8 | 16 | 0,125 |
| Verblindeter Zahlentest 1–5, 25 Versuche | 5 | 25 | 0,2 |

Abbruchregel ist überall `fixed-n`: genau die geplante Zahl, keine
Zwischenauswertung. Primäre Auswertung: exakter zweiseitiger Binomialtest
(Schwelle 5 %) plus Wilson-95-%-Intervall.

## 4. Ein Testlauf Schritt für Schritt

1. `#pendeln/experiment` öffnen (Startseite → Werkstatt → „Experimentierlabor“).
2. Modus **Testmodus** wählen und ein Experiment auswählen. Protokoll lesen:
   Zielraum, Fallzahl, Abbruchregel, primäre Auswertung.
3. `Lauf starten`. Damit stehen die vier Protokollpunkte fest; ein begonnener
   Lauf wird gespeichert.
4. Das Ziel wird gezogen und **nur als SHA-256-Commitment** gespeichert. Zielindex
   und Salt stehen vor der Enthüllung weder im DOM noch im Seitentitel noch im
   gespeicherten Lauf.
5. Antwort wählen (Knopf je möglichem Ziel).
6. `Antwort endgültig sperren`. Die Antwort wird gesperrt, gespeichert und gegen
   den gespeicherten Stand rückgelesen. Ein zweiter Klick, eine Korrektur oder
   eine Sperre nach der Enthüllung sind nicht möglich.
7. Erst jetzt wird das Ziel enthüllt; Treffer und Verlauf erscheinen.
8. `Nächster Versuch`, bis die Fallzahl erreicht ist. Danach steht die
   Abschlussauswertung: Treffer, Trefferquote, Erwartung bei Zufall, exakter
   p-Wert, Wilson-Intervall und eine Einordnung mit Richtung und
   Mehrfachtest-Hinweis.
9. `Rohdaten (JSON)` oder `Rohdaten (CSV)` exportieren, wenn die Versuche
   weiterverarbeitet werden sollen. `Lauf löschen` entfernt einen ganzen Lauf.

Ein **gezogenes, aber unbeantwortetes** Ziel wird beim Fortsetzen verworfen (ohne
Antwort und ohne Salt nicht enthüllbar). Eine **gesperrte, aber nicht enthüllte**
Antwort bleibt gesperrt; der Lauf ist dann „unterbrochen — nicht auswertbar“ und
nur ganz löschbar.

## 5. Gespeicherte Läufe

- `Gespeicherte Läufe` listet die Läufe dieses Browsers; `Gespeicherten Lauf
  fortsetzen` nimmt einen offenen Lauf wieder auf.
- Gespeichert wird unter `esot_rad_experiment_v1` im Umschlag
  `{schema:1, savedAt, data}`; höchstens 2 000 Antworten.
- Ist der Speicher voll, erscheint eine Meldung; der Lauf gilt dann nur für die
  Sitzung. Scheitert die Speicherung vor der Enthüllung, wird das sichtbar
  gemeldet.
- Ein neueres Schema im Speicher wird **nicht** überschrieben.
- Ein Lauf lässt sich nur einmal in das Pendeltagebuch übernehmen (RAD-10).

## 6. Die Statistik lesen

| Anzeige | Bedeutung |
| --- | --- |
| Treffer | richtige Antworten |
| Trefferquote h/n | Anteil der Treffer |
| Erwartung bei Zufall n/k | was reines Raten im Mittel ergäbe |
| Exakter Binomialtest | zweiseitiger p-Wert ohne Normalapproximation, vier Nachkommastellen |
| Wilson-95-%-Intervall | Bereich, der mit 95 % Konfidenz die wahre Trefferquote deckt (ohne Stetigkeitskorrektur) |
| Einordnung | über/unter der Erwartung, Schwelle 0,05, Mehrfachtest-Hinweis, „Hinweis, kein Nachweis“ |

Beispielwerte aus den Tests (unabhängig mit exakter Bruchrechnung geprüft):
p(15|20, ½) = 5425/131072; p(5|16, ⅛) = 0,04066189058827874;
Wilson(15, 20) = [0,531299122381256, 0,8881382985923343].

**Mehrfachtests.** Wer mehrere Läufe macht, findet fast immer einen mit p < 0,05.
Das Labor nennt die Zahl bekannter Läufe, korrigiert aber nicht (bewusste
Entscheidung) — die Einordnung bleibt ein Hinweis, kein Nachweis.

## 7. Bedienung ohne Maus

- `Tab` erreicht Moduswahl, Experimentauswahl, Start, Antwortknöpfe, Sperren,
  Fortsetzen und Exporte in Lesereihenfolge.
- Antworten sind echte Knöpfe mit Beschriftung (keine Bildfläche).
- Statusmeldungen laufen über `role="status"`/`aria-live`, Fehler über
  `role="alert"`.
- Die Start- und Sperrknöpfe sind per Tastatur auslösbar; der Fokus bleibt nach
  dem Sperren im Ablauf.

## 8. Exportformate

| Export | Format | Inhalt |
| --- | --- | --- |
| `Rohdaten (JSON)` | JSON, Umschlag `{schema:1, app:"esoterik-welt", kind:"experiment", …}` | Lauf, Versuche, Zeitstempel, Auswertung |
| `Rohdaten (CSV)` | UTF-8 mit BOM, `;`, CRLF, RFC-4180-Quoting | eine Zeile je Versuch |

Die Auswertung ist im Export enthalten, damit ein Lauf ohne die Seite
nachvollziehbar bleibt.

## 9. Grenzen — bewusst und benannt

- **Clientseitige Verblindung ist umgehbar.** Entwicklerwerkzeuge können Skripte
  anhalten und den Speicher lesen. Das Labor verspricht **keine**
  manipulationssichere Prüfung; dieser Satz steht auf der Seite.
- **Kein Server, kein Zeitstempel von außen.** Wer die Uhr stellt oder den
  Speicher manipuliert, kann die Rohdaten verändern. Für belastbare
  Forschung wäre eine unabhängige Instanz nötig.
- **Zufall nur über Web Crypto.** Fehlt `crypto.getRandomValues`, startet kein
  Test; es gibt **keinen** `Math.random`-Fallback. Deterministische Folgen
  (mulberry32) existieren nur in Tests.
- **Quota** ist mit einer Speicher-Attrappe geprüft, nicht mit einem tatsächlich
  vollen Browser-Speicher.
- **Nur Chromium geprüft**, kein Screenreader-Lauf, kein Lighthouse.
- **Kein Forschungswerkzeug.** Die Fallzahlen (16–25) sind didaktisch, nicht
  inferenzstark; kleine p-Werte in kleinen Stichproben sind fragil.

## 10. Wenn etwas nicht funktioniert

| Beobachtung | Ursache / Abhilfe |
| --- | --- |
| `Lauf starten` startet nicht | Web Crypto fehlt oder Speicher gesperrt; Meldung im Fehlerbereich lesen |
| Warnung „nur für diese Sitzung“ | `localStorage` gesperrt (privat, `file://`); Export vor dem Schließen |
| Lauf „unterbrochen — nicht auswertbar“ | Antwort gesperrt, aber nicht enthüllt; nur ganz löschbar |
| Schaltflächen nach dem Sperren ohne Wirkung | gewollt: die Sperre ist unveränderlich |
| Neuer Lauf nicht möglich | ein offener Lauf existiert; abschließen oder unterbrechen |

## 11. Datenschutz

Gespeichert werden nur Laufdaten im Browser (`esot_rad_experiment_v1`), ohne
Konto, ohne Namen, ohne Gerätekennung, ohne Übertragung. „Alle eigenen Daten
löschen“ im Pendeltagebuch entfernt auch die Experimentläufe (Präfix `esot_rad_`).
