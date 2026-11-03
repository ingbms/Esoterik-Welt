# Wireframes

Alle Maße sind **gemessen** (`messung/werkstatt-messung.json`, Chrome
155.0.8059.85, 2026-11-03T01:55Z), nicht geschätzt. Raster: 4-px-Token aus
`css/design-system.css`; Ränder 24 / 24 / 32 / 64 px bei 320 / 375 / 768 / 1440.

## 0 · Gemeinsamer Rumpf

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Start › Pendeln › Werkstatt › Pendelsimulator                                │  Brotkrümel, 13 px
├──────────────────────────────────────────────────────────────────────────────┤
│ WERKSTATT · WERKZEUG 1 VON 4                                                 │  Mono 13 px, Sand
│ Pendelsimulator                                                              │  Fraunces 44 px (1440)
│ Länge, Auslenkung und Dämpfung einstellen und sehen, wie sich die            │  Manrope 16 px
│ Schwingungsdauer verhält. Das Modell rechnet mit der klassischen             │
│ Pendelformel — es sagt nichts über Antworten oder Ausschläge auf Fragen.     │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ EINORDNUNG ]  Ein Werkzeug zum Ausprobieren, kein Messgerät.  Wie die      │  1-px-Rahmen, Sand-Label
│                 Kennzeichnung funktioniert →                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ 01 Simulator │ 02 Tafel-Studio │ 03 Test/Demo-Labor │ 04 Journal             │  4 Kacheln, 56 px hoch
├──────────────────────────────────────────────────────────────────────────────┤
│ Bereit. Das Pendel steht in der Ruhelage.                                    │  Live-Region, 14 px
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                            WERKZEUGINHALT                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Die Werkzeugnavigation ist **eine** Liste von vier Links, keine Registerleiste
mit `role="tablist"`: jeder Wechsel ist eine echte Navigation mit eigener
Adresse. Auf 1440 px stehen vier Kacheln à 328 × 56 px in einer Reihe
(Reserve 0 px, gemessen); darunter zwei Reihen à 2 Kacheln (136 / 164 / 352 px
breit, 56 px hoch). Das Label „Test/Demo-Labor“ bricht bei 375 px auf zwei
Zeilen (63 px Höhe) — die Kachel wächst, der Text wird nicht abgeschnitten.

---

## 1 · Simulator

### 1440 px — zweispaltig, 6,4 : 3,7

```
┌─ 820 px ────────────────────────────────────────┐  24  ┌─ 468 px ──────────┐
│ ┌─────────────────────────────────────────────┐ │      │ EINSTELLUNGEN     │
│ │              Aufhängung                     │ │      │                   │
│ │        ┆                                    │ │      │ Fadenlänge 0,25 m │
│ │        ┆  (gestrichelt = Ruhelage)          │ │      │ ├──────●──────────│
│ │         ╲                                   │ │      │ 0,05 bis 1,00 m   │
│ │          ●                                  │ │      │ Anfangsauslenkung │
│ │                                             │ │      │ ├───●─────────────│
│ │  Schematische Darstellung. Der Pendelkörper │ │      │ 2 bis 30°         │
│ │  ist eine Zeichnung, kein Foto.             │ │      │ Dämpfung 0,04     │
│ └─────────────────────────────────────────────┘ │      │ ├──●──────────────│
│ ┌─────────────────────────────────────────────┐ │      │ Darstellung       │
│ │  ╱╲    ╱╲     ╱╲      ╱╲        ╱╲          │ │      │ ( ) Scheibe       │
│ │ ╱  ╲  ╱  ╲   ╱  ╲    ╱  ╲      ╱  ╲         │ │      │ ( ) Kegel ( ) Ring│
│ │ 0 s              5 s            10 s        │ │      │ [ Start ] [Reset ]│
│ └─────────────────────────────────────────────┘ │      │ · Ruhelage        │
│ ┌───────────┬───────────┬───────────┬─────────┐ │      └───────────────────┘
│ │ PERIODE   │ THEORIE   │ ABWEICHUNG│ DÄMPFUNG│ │       468 × 701 px
│ │ 1,00 s    │ 1,00 s    │ 0,1 %     │ 0,04    │ │
│ └───────────┴───────────┴───────────┴─────────┘ │
└─────────────────────────────────────────────────┘
```

### 768 px — einspaltig

```
┌─ 704 px ────────────────────────────────────────────────┐
│ Stage 704 × 436 (16:9, Instrument 662 × 320)             │
│ Diagramm 704 × 160                                       │
│ Messwerte: 4 Spalten                                     │
│ Einstellungen 704 × 693 (Regler über volle Breite)       │
└──────────────────────────────────────────────────────────┘
```

### 375 px — einspaltig, 2-spaltige Messwerte

```
┌─ 327 px ────────────────┐
│ Stage 327 × 391         │
│ Diagramm 327 × 160      │
│ PERIODE      THEORIE    │   2 Spalten
│ 1,00 s       1,00 s     │
│ ABWEICHUNG   DÄMPFUNG   │
│ 0,1 %        0,04       │
│ Einstellungen 327 × 871 │
│ [ Start ]   [ Reset ]   │   Knöpfe untereinander, 48 px
└─────────────────────────┘
```

### 320 px — wie 375, 1-spaltige Messwerte

```
┌─ 272 px ──────┐
│ Stage 272×391 │
│ PERIODE       │   1 Spalte (gemessen: readout cols = 1)
│ 1,00 s        │
│ THEORIE       │
│ 1,00 s        │
└───────────────┘
```

---

## 2 · Tafel-Studio

### 1440 px

```
┌─ 820 px ────────────────────────────────────────┐      ┌─ 468 px ──────────┐
│ Vorschau 1:1                                    │      │ TAFEL EINRICHTEN  │
│ ┌─────────────────────────────────────────────┐ │      │ Tafeltyp          │
│ │              ╭───────────────╮              │ │      │ (•) Ja/Nein       │
│ │             │   Ja    │   Nein │            │ │      │ ( ) Zahlenkreis   │
│ │             │   1 2 3 4 5 6  │              │ │      │ ( ) A–Z           │
│ │              ╰───────────────╯              │ │      │ ( ) Freie Segmente│
│ │      (Tafel 640 × 640, Stil gold)           │ │      │ Titel [Pendeltafel]│
│ └─────────────────────────────────────────────┘ │      │ Beschriftungen    │
│ Tafel enthält nur Ihre Beschriftungen.          │      │ 2 von 24          │
│                                                 │      │ [Ja        ][×]   │
│ (Druckblatt: nur Titel + Tafel, siehe Druck)    │      │ [Nein      ][×]   │
│                                                 │      │ Farbstil          │
│                                                 │      │ (•) Gold ( )Violett│
│                                                 │      │ [x] nummerieren   │
│                                                 │      │ [SVG herunterladen]│
│                                                 │      │ [Drucken / PDF]   │
│                                                 │      │ [Tafel laden(JSON)]│
└─────────────────────────────────────────────────┘      └───────────────────┘
```

Zustand `leer`: statt Vorschau eine Leerbox („Noch keine Tafel“), Exportknopf
gesperrt **mit** sichtbarem Grund darunter.
Zustand `fehler`: Fehlerzusammenfassung (role="alert") **über** der Vorschau.

### 768 / 375 / 320 px

```
┌─ 704 / 327 / 272 px ─────────────┐
│ (Fehlerzusammenfassung, falls)   │   nur in `fehler`, fokussiert
│ Vorschau quadratisch             │   704→420, 327→293, 272→238 (gemessen)
│ Caption                          │
│ Einstellungen untereinander      │   Regler/Knöpfe volle Breite
└──────────────────────────────────┘
```

---

## 3 · Test- und Demo-Labor

### 1440 px

```
┌─ 820 px ────────────────────────────────────────┐      ┌─ 468 px ──────────┐
│ Versuch 0 von 40            Testmodus·protokoll.│      │ PROTOKOLL         │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │      │ Modus             │
│ ┌─────────────────────────────────────────────┐ │      │ ( ) Demo          │
│ │                    ?                        │ │      │ (•) Test          │
│ │   Noch kein Ziel gezogen. Im Testmodus      │ │      │ Testart           │
│ │   wird das Ziel verdeckt gezogen …          │ │      │ (•) Richtung (4)  │
│ │                 (560 × 220)                 │ │      │ ( ) Zahl 1–4      │
│ └─────────────────────────────────────────────┘ │      │ ( ) Symbol (4)    │
│ Reihenfolge ist Teil des Protokolls: Ziel →     │      │ Versuche [40]     │
│ Antwort → speichern → aufdecken.                │      │ ├────●───────────│
│ [1] [2] [3] [4]                                 │      │ Protokoll gesperrt│
│ (Ergebnis + Statistik erst in `enthuellt` /     │      │ (Hinweis)         │
│  `abgeschlossen`)                               │      └───────────────────┘
│ [Ziel ziehen]  (abgeschlossen: [Neuer Lauf] [Export])                    │
└─────────────────────────────────────────────────┘
```

Die Antwortknöpfe sind 199 × 56 px (1440) und 4-spaltig; bei 375 px stehen sie
als 2 × 2-Raster (`repeat(auto-fit, minmax(96px, 1fr))`).

### 768 / 375 / 320 px

```
┌─ 704 / 327 / 272 px ─────────────┐
│ Fortschritt + Zähler             │
│ Bühne (316 / 330 / 372 px hoch)  │
│ Caption                          │
│ Antwortknöpfe (2×2 bei ≤ 375)    │
│ Ergebnis / Statistik             │
│ Aktionen                         │
│ Protokoll-Panel darunter         │
└──────────────────────────────────┘
```

---

## 4 · Journal

### 1440 px — Formular **links**, Liste rechts

```
┌─ 468 px ──────────┐   24   ┌─ 820 px ───────────────────────────────────────┐
│ NEUER EINTRAG     │        │ (Hinweis „Speicher voll“ nur in `voll`)        │
│ Datum [2026-11-03]│        │ (Leerzustand nur in `leer` / `geloescht`)      │
│ Frage 0/200       │        │ Einträge filtern: (•) Alle ( ) Mit Experiment  │
│ [________________]│        │ ┌────────────────────────────────────────────┐ │
│ Methode [Pendel…] │        │ │ 2026-11-02                    +            │ │
│ Vorhersage        │        │ │ Finde ich den verlorenen Schlüssel im Flur?│ │
│ [________________]│        │ ├────────────────────────────────────────────┤ │
│ Sicherheit 1…5    │        │ │ Methode: Pendel über Tafel   (aufgeklappt)│ │
│ ( ) ( ) (•) ( ) ( )│       │ │ Vorhersage: Ja, im Flur                    │ │
│ [Eintrag speichern]│       │ │ Sicherheit: 4 von 5                        │ │
│ [JSON] [CSV]      │        │ │ Ergebnis: Nicht im Flur gefunden …         │ │
│ [Alle löschen]    │        │ └────────────────────────────────────────────┘ │
│ Speicherorte …    │        │ (Dialog „Alle lokalen Einträge löschen?“)      │
└───────────────────┘        └────────────────────────────────────────────────┘
```

Beim Löschdialog wird die Liste nicht ausgeblendet, aber abgedunkelt; der Dialog
steht im Fluss (kein Fixoverlay) und ist `aria-modal="false"` im Mockup, in der
Produktion ein `<dialog>`.

### 768 / 375 / 320 px

```
┌─ 704 / 327 / 272 px ─────────────┐
│ Formular (oben)                  │
│ Einträge (darunter)              │
│ Liste 704/327/272 × …            │
└──────────────────────────────────┘
```

Reihenfolge mobil: **Formular zuerst**, Liste danach. Wer mobil einen Eintrag
erfassen will, soll nicht an einer beliebig langen Liste vorbeiscrollen.

---

## 5 · Landing: Werkstatt mit vier Karten

Heute (Produktion, `js/data/radiasthesie.js` → `landing.workshop`): **drei**
Karten, Raster `repeat(3, minmax(0,1fr))`, alle mit Status „In Vorbereitung“.

```
Zielzustand ≥ 1101 px             701–1100 px           ≤ 700 px
┌────────┬────────┐               ┌────────┬────────┐   ┌──────────┐
│ 01 Sim.│ 02 Stu.│               │ 01     │ 02     │   │ 01       │
├────────┼────────┤               ├────────┼────────┤   ├──────────┤
│ 03 Exp.│ 04 Jrn.│               │ 03     │ 04     │   │ 02       │
└────────┴────────┘               └────────┴────────┘   └──────────┘
```

Begründung gegen `repeat(4, …)`: bei 1440 px und 64-px-Rändern bleiben
1312 px; vier Karten mit 3 × 16 px Abstand ergäben 316 px je Karte. Die
gemessene Mindestbreite für Instrument + Text in einer Karte liegt bei 272 px
(320-px-Ansicht), 316 px wäre knapp, aber die Karte trägt zusätzlich ein
Statusabzeichen und einen Instrumentenblock — deshalb 2 × 2.

Karteninhalt (Vertrag): Instrumenten-SVG, Statusabzeichen (`Fertig`,
`In Arbeit`, `Geplant`), Titel, ein Satz, Link auf
`#pendeln/werkstatt/<id>`. Nur `Geplant` bekommt den gestrichelten Rahmen
(`.rad-werk-state--planned`).
