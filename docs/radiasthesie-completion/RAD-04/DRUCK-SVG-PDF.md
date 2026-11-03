# Druck, SVG und PDF

Druck ist der Bereich, den der Vorgängerstand nur beschrieben hat. Hier ist er
gemessen — und drei Fehler sind dabei aufgefallen und behoben worden.

## 1 · Druckregeln

### 1.1 Papier statt Nacht

Der Druckblock setzt innerhalb von `.rad-ws` eigene Werte, **ohne** die globalen
Tokens zu verändern:

```css
@media print {
  .rad-ws {
    --color-text-primary: #000;
    --color-text-secondary: #111;
    --color-primary: #000;
    --color-hover: #000;
    --color-line-strong: #444;
    --color-border: #999;
    background: #fff;
  }
  @page { margin: 14mm; }
}
```

### 1.2 Was im Druck verschwindet

| Element | Druck | Grund |
|---|---|---|
| Werkzeugnavigation | aus | vier Routen, auf Papier wertlos |
| Bedienpanel (`Einstellungen`, `Tafel einrichten`, `Protokoll`) | aus | Regler und Knöpfe sind nicht bedienbar |
| Werkzeug-Aktionen (Start, Export, Neuer Lauf) | aus | keine Aktion auf Papier |
| Statuszeile (Live-Region) | aus | flüchtig |
| Journal-Filter | aus | Interaktion |
| Sprunglink, Brotkrümel | aus | Navigation |
| Fortschrittsbalken-Fläche | transparent, Rahmen bleibt | Tinte sparen, Wert steht als Text |

### 1.3 Was im Druck bleibt

| Element | Druck | Beleg |
|---|---|---|
| Einordnungsband („kein Messgerät“) | **bleibt** | `print.studio.einordnung = true` |
| Kicker, H1, Lead | bleibt | Screenshots |
| Bühne/Instrument, Diagramm | bleibt als Strichzeichnung | `print.simulator.chart = true` |
| Messwerte (Periode, Theorie, Abweichung, ζ) | bleibt | `print.simulator.readout = true` |
| Ergebnis + Statistik des Labors | bleibt | `print.experiment.stats/result = true` |
| Journal-Einträge **vollständig** | bleibt | `print.journal.bodiesVisible = 3` |
| Tafel im Studio | bleibt als Papierfassung | `print.studio.printSheet = true` |
| Animation | steht (`animationName = none`, Arm auf −12°) | `print.simulator.animationName = none` |

### 1.4 Titel und Blatt

- Studio druckt **nur** das Blatt: `#studioPrintTitel` (Tafel-Titel, 18 pt,
  Fraunces) + Tafel, Breite 567 px (≈ 150 mm bei 96 dpi), zentriert.
- Die Bildschirm-Vorschau wird beim Studio im Druck ausgeblendet (sonst stünde
  die Tafel zweimal auf dem Blatt).
- Kopf- und Fußzeile des Browsers (URL, Datum) sind **abzuschalten** — sie
  stehen nicht im Blatt und würden die Seitenzahl unkontrollierbar machen.

## 2 · Die drei behobenen Druckfehler

Vorher-Bilder: `messung/vorher/`, Nachher: `messung/screens/druck-*.png`.
Die Vorher-Werte sind aus den CSS-Werten gerechnet (die alte Messung erhob
diesen Kontrast nicht); die Nachher-Werte sind am gerenderten Druckbild gemessen.

### P1 — Tafel druckte schwarz mit dunkler Tusche

| | Vorher | Nachher |
|---|---|---|
| Fläche | `#000` (`--plate-face: var(--color-text-primary)`, im Druck auf `#000` gesetzt) | `rgb(255,255,255)` |
| Tusche | `#0b1012` | `rgb(0,0,0)` |
| Kontrast | **1,10:1** | **21,00:1** |

Ursache: Der Pergament-Stil leitet die Fläche aus `--color-text-primary` ab; der
Druckblock setzt dieses Token auf `#000` — die Tafel wurde schwarz, die Tusche
blieb Nachtblau. Fix: im Druck eine explizite Papierfassung für **jeden** Stil
(`.rad-studio-plate[data-style]` mit `--plate-face: #fff`, `--plate-ink: #000`,
`--plate-line: #4a4a4a`). Der Bildschirmstil bleibt unberührt.

### P2 — Bühne des Test-Labors druckte als schwarzer Kasten

| | Vorher | Nachher |
|---|---|---|
| Grund | `#0b1012` (`--color-bg-deep`, im Druck nicht überschrieben) | transparent → Papier `rgb(255,255,255)` |
| Text | `#111` | `rgb(0,0,0)` |
| Kontrast | **1,01:1** | **21,00:1** |

Fix: Bühne transparent, Rahmen `#777`, Ziel und Text schwarz, Fortschrittsbalken
transparent mit schwarzem Füllstand.

### P3 — Journal druckte nur Datum und Frage

| | Vorher | Nachher |
|---|---|---|
| sichtbare Körper | **0 von 3** | **3 von 3** |
| Körperhöhe (Eintrag 1) | 0 | 148 px |
| Aufklapp-Zeichen im Druck | `+` | `none` |

Ursache: Die Einträge sind `<details>` und geschlossen; `display: grid` am Kind
genügt nicht, weil der Browser den Inhalt über den Details-Slot ausblendet.
Fix, zweigleisig:

```css
@media print {
  .rad-journal-entry::details-content { content-visibility: visible; display: block; }
  .rad-journal-entry .rad-journal-body { display: grid !important; }
}
```

```js
window.addEventListener('beforeprint', () => { /* alle details öffnen, Zustand merken */ });
window.addEventListener('afterprint',  () => { /* nur die gemerkten wieder schließen */ });
```

Der CSS-Weg deckt moderne Browser; der `beforeprint`-Weg fängt ältere ab und
stellt den Bildschirmzustand danach wieder her. Belegt ist der CSS-Weg (die
Druck-Screenshots entstehen über Medienemulation, ohne `beforeprint`).

## 3 · SVG-Export

Vertrag siehe `SCHNITTSTELLEN.md` §4.1. Gemessene Fakten
(`messung/funktionen.json`, Export einer Tafel „Ja/Nein“):

| Prüfung | Wert |
|---|---|
| `xmlns` vorhanden | ja |
| `<title>` / `<desc>` | ja / ja |
| Externe Referenzen (`http`, `xlink:href`, `url(`) | 0 |
| `<script>` im Export | nein |
| Text escaped (kein rohes `<b>`) | ja |
| Deterministisch (zwei Exporte byte-identisch) | ja |
| Größe | 1097 Byte |
| `role="img"`, `viewBox="0 0 600 600"` | ja |

Dateiname: `radiasthesie-tafel-<typ>-<YYYY-MM-DD>.svg`. Der Export enthält
**keine** Bildschirmfarben des Nachtateliers: die Tafel ist eine Zeichnung, die
auf Papier und in anderen Programmen funktionieren muss; Farben werden als
aufgelöste Werte geschrieben, nicht als `var(--…)`.

Der Export wird im Mockup nicht als Download ausgelöst (keine Schreibvorgänge im
Messlauf); geprüft wird die erzeugte Zeichenkette über `exportString()`.

## 4 · PDF

Es gibt **keine** PDF-Bibliothek im Projekt und es wird keine hinzugefügt. PDF
entsteht ausschließlich über den Druckdialog des Browsers („Als PDF speichern“):

- Seitengröße A4, Rand 14 mm (`@page`), keine Skalierung über 100 %.
- Tafel max. 150 mm breit, höhenautomatisch, `break-inside: avoid`.
- Journal-Einträge `break-inside: avoid`; ein Eintrag wird nicht über zwei
  Seiten zerrissen.
- Ergebnis/Statistik des Labors bleiben zusammen (ein Block).
- Dateiname beim Speichern: `radiasthesie-tafel-<typ>-<datum>.pdf` bzw.
  `pendeltagebuch-<datum>.pdf`.

Nicht geprüft: ein physischer Drucker, beidseitiger Druck, Schwärzungsverhalten
auf Recyclingpapier, PDF/A-Konformität.

## 5 · Belegbilder

| Datei | Zeigt |
|---|---|
| `messung/screens/druck-studio-1440.png` | Blatt mit Titel + Papier-Tafel, 21:1 |
| `messung/screens/druck-simulator-1440.png` | Diagramm, Messwerte, Einordnung; Arm steht |
| `messung/screens/druck-experiment-1440.png` | Bühne hell, Ergebnis + Statistik |
| `messung/screens/druck-journal-1440.png` | drei vollständige Einträge |
| `messung/vorher/druck-*.png` | dieselben drei Ansichten **vor** P1–P3 |

## 6 · Offene Punkte

1. Ein echter Drucklauf (Papier oder PDF-Datei) steht aus; geprüft ist die
   Druck-Medienemulation.
2. `print-color-adjust: exact` ist gesetzt, damit die Tafel im PDF nicht
   umgefärbt wird. Ob ein Druckertreiber das ignoriert, ist nicht getestet.
3. Der Mockup-Hinweis am Blattende existiert nur im Mockup; in der Produktion
   steht dort nichts.
