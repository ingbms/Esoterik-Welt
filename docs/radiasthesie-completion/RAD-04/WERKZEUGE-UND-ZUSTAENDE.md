# Werkzeuge und Zustände

Vier Werkzeuge, ein gemeinsamer Rahmen. Jede Ansicht hat **genau eine**
Live-Region (`#wsStatus`, `role="status"`, `aria-live="polite"`); alle
Rückmeldungen laufen über diesen einen Kanal. Kein Werkzeug öffnet ein zweites
Statusfeld, kein Werkzeug schreibt in die Region eines anderen.

Gemeinsamer Rahmen (in allen vier Zuständen identisch):

```
Brotkrümel   Start › Pendeln › Werkstatt › <Werkzeug>        (nav, aria-label="Brotkrümelnavigation")
Kicker       „Werkstatt · Werkzeug n von 4“                  (p.rad-ws-kicker)
H1           <Werkzeugname>                                  (tabindex="-1", Fokus-Ziel)
Lead         2–3 Sätze: was das Werkzeug tut und was es NICHT tut
Einordnung   Band „Ein Werkzeug zum Ausprobieren, kein Messgerät.“ + Link zur Methodik
Werkzeugnavigation  4 Kacheln, aria-current="page" am aktiven Werkzeug
Status       role="status", aria-live="polite"  ← genau eine Region
Inhalt       Werkzeugpanel
```

Der Einordnungsband ist **nicht** wegklickbar und nicht zustandsabhängig. Er
steht in jedem Zustand vor dem Werkzeug.

---

## 1 · Simulator („Pendelsimulator“)

**Zweck.** Fadenlänge, Anfangsauslenkung und Dämpfung einstellen und die
Schwingungsdauer gegen die klassische Formel 2π√(L/g) stellen. Das Werkzeug
rechnet ein Modell; es sagt nichts über Antworten, Ausschläge oder Fragen.

**Route (Vorschlag):** `#pendeln/werkstatt/simulator`

### Zustände

| Zustand | Auslöser | Stage | Messwerte | Aktionen | Statuszeile (Live-Region) |
|---|---|---|---|---|---|
| `bereit` | Einstieg, „Zurücksetzen“ | Pendel in Ruhelage, Ruhelage gestrichelt | Periode, Theorie, Abweichung, ζ | Start, Zurücksetzen | „Bereit. Das Pendel steht in der Ruhelage.“ |
| `laeuft` | „Start“ (`aria-pressed` wechselt auf `true`) | Pendel schwingt (2,6 s, ease-in-out) | werden bei jeder Regleränderung neu berechnet | Start (Umschalten), Zurücksetzen | „Simulation läuft. Periode und Abweichung werden mit jedem Durchlauf neu berechnet.“ |
| `reduziert` | `prefers-reduced-motion: reduce` **und** Start | Pendel bleibt in Ruhelage gezeichnet | unverändert ablesbar | wie `laeuft`, aber ohne Bewegung | „Reduzierte Bewegung aktiv: keine Animation, Werte bleiben ablesbar.“ |
| `fehler` | Regler außerhalb des Bereichs (programmatisch/assistiv) | unverändert | **nie** „NaN“; der begrenzte Wert wird angezeigt | Zurücksetzen | „Eingabe begrenzt: Fadenlänge auf 0,05 m gesetzt. Es wird kein ungültiger Wert gezeigt.“ |

```
        ┌──────────┐  Start   ┌──────────┐
        │  bereit  │─────────▶│  laeuft  │
        └──────────┘◀─────────└──────────┘
             │  Zurücksetzen        │ Start
             │                      ▼
             │               ┌──────────────┐
             │               │  reduziert   │  (prefers-reduced-motion)
             │               └──────────────┘
             ▼
        ┌──────────┐
        │  fehler  │  Grenzwert überschritten → Wert begrenzt, Zustand meldet es
        └──────────┘
```

**Regeln.**

- Die Messwerte sind **immer** sichtbar, auch in `reduziert` und `fehler`. Es
  gibt keinen Zustand, in dem die Zahlen verschwinden.
- `fehler` ist ein Eingabefehler, kein Systemfehler: das Feld zeigt den
  gültigen Wert, die Statuszeile nennt die Begrenzung im Klartext.
- Der Regler `#simLaenge` hat `min=5 max=100 step=1` (Anzeige 0,05–1,00 m),
  `#simAmp` 2–30°, `#simDaempfung` 0–0,20. Die Zahlen werden mit deutschem
  Dezimalkomma ausgegeben (`fmt()` → `toFixed().replace('.', ',')`), geprüft:
  „1,00 s“, „0,1 %“, „0,04“.
- Bei Auslenkung > 8° nennt der Hinweistext die Grenze der Kleinwinkel-Näherung.
  Das ist Inhalt, keine Deko: die Abweichungsspalte zeigt die Folge.

**Gespeichert wird nichts.** Der Simulator schreibt keinen Speicher.

---

## 2 · Tafel-Studio („Tafel-Studio“)

**Zweck.** Tafeltyp wählen, Beschriftungen eintragen, Farbstil festlegen, als
eigenständige SVG sichern oder über den Druckdialog als PDF ausgeben.

**Route (Vorschlag):** `#pendeln/werkstatt/studio`

### Zustände

| Zustand | Auslöser | Vorschau | Export/Druck | Statuszeile |
|---|---|---|---|---|
| `standard` | Einstieg, ≥ 2 gültige Beschriftungen | Tafel 1:1 | beide frei | „Tafel mit 2 Segmenten. Export und Druck sind verfügbar.“ |
| `leer` | < 2 Beschriftungen | Leerzustand statt Vorschau | **gesperrt**, Grund als Text am Knopf (`aria-describedby`) | „Keine Tafel: weniger als zwei Beschriftungen. Export gesperrt, Grund steht am Knopf.“ |
| `fehler` | Validierung schlägt fehl (leeres Label, Titel > 60 Zeichen, > 24 Labels, Label > 40 Zeichen) | Vorschau bleibt stehen | beide frei, aber Fehlerzusammenfassung zuerst | „Zwei Eingaben brauchen eine Korrektur. Die Zusammenfassung steht über der Vorschau.“ |
| `violett` | Farbstil „Gedämpftes Violett“ | Tafel in `color-mix` aus zwei Tokens | wie `standard` | „Farbstil ‚Gedämpftes Violett‘ aktiv. Kontrast gemessen.“ |
| `pergament` | Farbstil „Pergament“ | helle Fläche, dunkle Tusche | wie `standard` | „Farbstil ‚Pergament‘ aktiv: dunkle Tusche auf heller Fläche.“ |

```
   leer ◀── Beschriftung entfernt (< 2) ──▶ standard ──▶ violett
    │                                          │  ▲        │
    │ 2. Beschriftung eingetragen              │  └────────┘
    ▼                                          ▼
  standard                                  fehler ──(korrigiert)──▶ standard
```

**Regeln.**

- Die Fehlerzusammenfassung (`role="alert"`, `tabindex="-1"`) steht **über** der
  Vorschau, nicht darunter: sie ist der erste Inhalt, den man nach dem Absenden
  sieht, und wird per Skript fokussiert.
- Jeder Fehler ist ein Link auf das betroffene Feld (`href="#studioLabels"`,
  `href="#studioTitelFeld"`). Kein Fehler ohne Sprungziel.
- Der gesperrte Export ist **kein** stumm ausgegrauter Knopf: daneben steht der
  Grund als Text (`#studioLeerGrund`).
- Beschriftungsliste: 2–24 Einträge, je ≤ 40 Zeichen; Duplikate sind erlaubt und
  werden durchnummeriert. Der Zähler `#studioCount` wechselt bei Überschreitung
  auf `data-over="true"`.
- Der Titel (≤ 60 Zeichen) steht im Export, im Druck und im Dateinamen.

**Gespeichert** wird die zuletzt genutzte Tafel unter `esot_rad_studio_v1`
(Abschnitt „Schnittstellen“). Ein Import ist über „Tafel laden (JSON)“ möglich;
ungültige Dateien landen in `fehler`, nicht in einem stillen Nichts.

---

## 3 · Test- und Demo-Labor („Test- und Demo-Labor“)

**Zweck.** Verblindeter Ablauf: Ziel ziehen → Antwort festhalten → speichern →
aufdecken. Am Ende steht eine Trefferquote mit Zufallserwartung, exaktem
Binomial-p und Wilson-Intervall — ohne Aussage darüber, ob Pendeln funktioniert.

**Route (Vorschlag):** `#pendeln/werkstatt/experiment`

### Zustände

| Zustand | Auslöser | Bühne | Ergebnis/Statistik | Aktionen | Statuszeile |
|---|---|---|---|---|---|
| `vorbereitet` | Einstieg, „Neuer Lauf“ | „Noch kein Ziel gezogen“ | keine | Ziel ziehen | „Protokoll noch nicht gestartet. Testart, Zielraum und Versuchszahl sind einstellbar.“ |
| `verdeckt` | „Ziel ziehen“ | Ziel gezogen, **verdeckt** (`?`) | keine | Antwort 1–4, Ziel ziehen | „Ziel gezogen und verdeckt. Antwort erfassen, dann speichern.“ |
| `antwort` | Antwort gewählt/gespeichert | Ziel weiter verdeckt | keine | Ziel ziehen (= aufdecken) | „Antwort gespeichert und gesperrt. Ziel kann jetzt aufgedeckt werden.“ |
| `enthuellt` | Aufdecken | Ziel sichtbar | Treffer/Nicht-Treffer | nächster Versuch | „Ziel aufgedeckt. Treffer oder Nicht-Treffer steht im Ergebnis.“ |
| `abgeschlossen` | letzter Versuch erreicht | Ziel sichtbar | Statistik + Hinweis auf Mehrtests | Neuer Lauf, Export | „Lauf abgeschlossen: 40 von 40 Versuchen. Auswertung und Export verfügbar.“ |
| `leer` | noch kein Lauf | Platzhalter | **keine** Statistik | Neuer Lauf | „Noch kein Lauf abgeschlossen. Es gibt keine Statistik.“ |
| `demo` | Modus „Demo“ | wie `verdeckt` | keine Statistik, kein Export | Ziel ziehen | „Demo-Modus: frei spielbar, nicht in der Statistik, kein Export.“ |

```
vorbereitet ──Ziel ziehen──▶ verdeckt ──Antwort──▶ antwort ──Aufdecken──▶ enthuellt
     ▲                            ▲                                          │
     │                            └──────── nächster Versuch ◀───────────────┘
     │                                          │ n erreicht
     └──────── Neuer Lauf ◀── abgeschlossen ◀───┘
leer ──(erster Lauf)──▶ vorbereitet
demo ──(frei spielbar, ohne Wertung)──▶ verdeckt ⇄ antwort
```

**Regeln.**

- **Reihenfolge ist Teil des Protokolls.** Vor dem Speichern steht das Ziel weder
  im Dokument noch im Speicher. Aufdecken ist erst nach gespeicherter Antwort
  möglich; sonst meldet die Live-Region: „Zuerst eine Antwort wählen. Ohne
  gespeicherte Antwort wird nicht aufgedeckt.“
- **Sperren:** Während eines Laufs sind Testart, Zielraum und Versuchszahl
  gesperrt (`#expSperre` erklärt warum). Der Abbruch ist der Ausweg, nicht ein
  heimlich änderbares Feld.
- **Statistik** erscheint erst in `abgeschlossen`: Treffer, Erwartung (n/4),
  p (exakt), 95-%-Intervall (Wilson). Beispiel aus dem Messlauf: 12/40,
  Erwartung 10,0, p = 0,4668, Intervall 0,18–0,45.
- **Mehrfachläufe** werden benannt, nicht korrigiert: der Hinweis sagt, dass
  zwanzig Läufe und der beste Lauf die 5-%-Schwelle zerstören.
- Der Demo-Modus ist sichtbar getrennt (eigene Statuszeile, kein Export).

**Gespeichert** wird ein abgeschlossener Lauf unter `esot_rad_experiment_v1`;
der Export ist JSON (Ergebnis + Rohdaten), nie ein Bild.

---

## 4 · Journal („Pendeltagebuch“)

**Zweck.** Frage, Vorhersage, Methode, Sicherheit und späteres Ergebnis
notieren. Alles bleibt auf dem Gerät.

**Route (Vorschlag):** `#pendeln/werkstatt/journal`

### Zustände

| Zustand | Auslöser | Liste | Formular | Statuszeile |
|---|---|---|---|---|
| `liste` | Einstieg, ≥ 1 Eintrag | Einträge, neueste zuerst, aufklappbar | bereit | „3 Einträge, neueste zuerst.“ |
| `leer` | keine Einträge | Leerzustand mit Speicherhinweis | bereit | „Noch kein Eintrag. Das Formular ist bereit.“ |
| `fehler` | Pflichtfeld leer (Frage, Vorhersage) | unverändert | Fehlerzusammenfassung über den Feldern, `role="alert"` | „Zwei Pflichtfelder fehlen. Die Zusammenfassung steht über den Feldern.“ |
| `voll` | `QuotaExceededError` beim Speichern | unverändert | Eingaben **bleiben stehen** | „Speicher voll: Eintrag nicht gespeichert. Eingaben bleiben im Formular.“ |
| `bestaetigung` | „Alle Einträge löschen“ | abgedunkelt, Dialog offen | gesperrt | „Sicherheitsabfrage offen: alle lokalen Einträge löschen?“ |
| `geloescht` | „Endgültig löschen“ | Leerzustand | bereit | „Alle lokalen Einträge wurden gelöscht.“ |

```
liste ⇄ leer            (Speichern des ersten Eintrags / Löschen des letzten)
liste ──Speichern mit fehlenden Pflichtfeldern──▶ fehler ──korrigiert──▶ liste
liste ──QuotaExceededError──▶ voll ──Export/Löschen──▶ liste
liste ──„Alle löschen“──▶ bestaetigung ──Abbrechen──▶ liste
                                   └──„Endgültig löschen“──▶ geloescht
```

**Regeln.**

- Pflichtfelder: **Frage** und **Vorhersage**. Datum, Methode und Sicherheit
  (1–5) sind vorbelegt, nicht Pflicht.
- Die Löschbestätigung ist ein `<dialog>` im Betrieb: Fokus bleibt im Dialog,
  Escape schließt, der Fokus kehrt zum Auslöser zurück. Der Dialog nennt
  **was** gelöscht wird (Einträge, Experimentläufe, zuletzt genutzte Tafel) und
  dass es nicht rückgängig zu machen ist.
- Bei `voll` wird **nichts** still verworfen: der Text sagt ausdrücklich
  „nicht gespeichert“, die Eingaben bleiben im Formular, der Export bleibt
  erreichbar.
- Ein Eintrag zeigt zusammengeklappt Datum + Frage; aufgeklappt Methode,
  Vorhersage, Sicherheit, Ergebnis und ggf. den Experimentbezug. Der
  Aufklapp-Zustand ist ein `<details>` mit sichtbarem `+`/`−`, nicht nur der
  native Marker.
- Zeichenzähler: Frage 0/200 (`aria-describedby`), Vorhersage max. 200.

**Gespeichert** unter `esot_rad_journal_v1`; Export als JSON und CSV.

---

## 5 · Querschnittsregeln für alle vier Werkzeuge

1. **Eine Live-Region.** Jede Zustandsänderung, die nicht ohnehin den Fokus
   verschiebt, schreibt genau einen Satz in `#wsStatus`.
2. **Fokus nach Aktion.** Fehlerzusammenfassungen sind fokussierbar
   (`tabindex="-1"`) und werden fokussiert; der H1 ist Fokusziel beim
   Werkzeugwechsel; der Dialog gibt den Fokus zurück.
3. **Kein stiller Fehler.** Jeder gesperrte Knopf hat einen Grund als Text, jede
   Begrenzung wird benannt, jeder Speicherfehler wird gemeldet.
4. **Kein Zustand ohne Ausweg.** Aus `fehler`, `voll` und `bestaetigung` führt
   immer eine benannte Aktion heraus (Korrigieren, Exportieren/Löschen,
   Abbrechen).
5. **Zahlen mit deutschem Komma**, Einheiten mit geschütztem Leerzeichen
   (`1,00 s`, `0,04`, `0,1 %`).
6. **Keine Dauer-Animation** außer der Pendelbewegung im Zustand `laeuft`; sie
   ist die einzige Animation im ganzen Werkstattbereich.
