# Asset-Liste und Bildsprache — Themenmodul „Radiästhesie, Pendeln und Orakel“

Stand: 2. November 2026 · Geltung: Entwurf; Fotos werden erst nach Lizenzprüfung
durch den Medien-Task (ESOW-RAD-05) eingebunden.

## 1. Bildsprache in drei Sätzen

1. **Instrumente werden gezeichnet, nicht fotografiert.** Die vier Tafeln in
   `assets/` sind technische Schemata: 1-px-Linien, Mono-Beschriftung, Sand als
   einziger Akzent. Sie zeigen Geometrie und Handhabung, nicht „Energie“.
2. **Fotos zeigen Material, nicht Wirkung.** Wo Fotos eingesetzt werden, sind es
   Nahaufnahmen realer Objekte (Pendel, Rute, Tafel) mit neutralem Hintergrund,
   ohne Hände in Aktion, ohne Leuchteffekte, ohne montierte Strahlen.
3. **Ein Bild pro Blick.** Hero und Artikel tragen genau eine Tafel; Karten tragen
   je ein Instrument. Keine Collagen, keine Hintergrundmuster, keine Emojis als
   Schmuck.

Verboten: Glitzer, Lens Flares, Aura-Grafiken, „Energiefeld“-Renderings,
KI-Bilder ohne Kennzeichnung, Screenshots fremder Websites, Händlerbilder.

## 2. Vorhandene Assets in diesem Paket (eigene Werke)

Alle vier Dateien sind eigene SVG-Zeichnungen, 520 × 400 viewBox, ohne externe
Referenzen, ohne eingebettete Schriften (System-Monospace als Fallback).

| Datei | Größe | Verwendung | Alt-Text (verbindlich) |
| --- | ---: | --- | --- |
| `assets/pendel-geometrie.svg` | 2,7 KB | Hero der Landingpage, Karte „Orakel“ | „Schematische Zeichnung eines Pendels: Aufhängepunkt, Faden der Länge L, ausgelenkter Pendelkörper und der Winkel Alpha zwischen Ruhelage und Faden.“ |
| `assets/winkelrute.svg` | 1,8 KB | Karte „Radiästhesie“, Artikelkapitel „Wie die Rute geführt wird“ | „Schematische Aufsicht einer Winkelrute: zwei Ruten laufen vom Griffpunkt in einem Winkel von etwa 40 Grad auseinander, ein gestrichelter Pfeil deutet die Ausschlagrichtung an.“ |
| `assets/pendeltafel.svg` | 2,2 KB | Karte „Pendeln“ | „Schematische Pendeltafel mit zwölf Segmenten: links JA, rechts NEIN, dazwischen die Ziffern 1 bis 10.“ |
| `assets/orakel-karten.svg` | 1,5 KB | Karte „Orakel“ | „Drei gefächerte Karten mit Kreis, Dreieck und Linien als abstrakte Zeichen für Bild- und Zeichenorakel.“ |

Jede Tafel trägt im SVG `<title>` und `<desc>` (für den Fall, dass das SVG inline
eingebettet wird) **und** einen Alt-Text am `<img>` (für den Fall der Einbindung
per `src`). Beides ist Pflicht, weil dieselbe Datei in beiden Formen verwendet
werden kann.

**Bildunterschriften** nennen immer drei Dinge: was zu sehen ist, welches Maß
gilt, was das Bild **nicht** belegt. Beispiel:

> **Pendelgeometrie.** Länge L, Auslenkung α, Schwingungsdauer T. Eigene
> Zeichnung, kein Messgerät und kein Beleg für eine Fernwirkung.

## 3. Geplante Fotos (aus ESOW-RAD-05, noch nicht eingebunden)

Status: **nicht geprüft, nicht heruntergeladen.** Die Lizenzangaben stammen aus
dem Master-Auftrag; jede Dateiseite ist vor dem Import erneut zu prüfen
(Urheber, Lizenz, Lizenzversion, Länderhinweise, Bearbeitungsverbote). Bis dahin
bleibt der Mockup bei den SVG-Tafeln.

| Motiv | Quelle (Dateiseite) | Urheber | Lizenz laut Auftrag | Einsatzort | Prüfstatus |
| --- | --- | --- | --- | --- | --- |
| Klassisches Pendel | `File:Radiesthetic_pendulum.jpg` (Wikimedia Commons) | Carivaldi | CC BY-SA 3.0 | Artikel „Pendeln“, Kapitel „Arten“ | offen |
| Universalpendel | `File:Universal_pendulum_E.jpg` | Wouter Hagens | CC BY-SA 3.0 | Artikel „Pendeln“, Kapitel „Arten“ | offen |
| Radiästhesierute | `File:Varilla_de_radiestesia.JPG` | José Antonio Agraz Sandoval | CC0 1.0 | Artikel „Radiästhesie“, Kapitel „Instrumente“ | offen |
| Historische Wünschelrute | `File:Divining_Rod.jpg` | – | gemeinfrei (historisch) | Artikel „Radiästhesie“, Kapitel „Geschichte“ | offen |
| Tarot, drei Karten mit Kerzen | `File:Tarot_cards_-_3_card_spread_with_candles.jpg` | Nosferattus | CC0 1.0 | Artikel „Orakel“ | offen |
| Historisches Ouija-Brett | `File:Ouija_board_-_Kennard_Novelty_Company.png` | Kennard Novelty Company | Public Domain Mark (länderspezifisch prüfen) | Artikel „Orakel“, Kapitel „Historische Tafeln“ | offen |

### 3.1 Technische Vorgaben für Fotos

| Punkt | Vorgabe |
| --- | --- |
| Formate | WebP als Auslieferung, Original zusätzlich als JPEG/PNG im Archiv |
| Breiten | 320, 640, 960, 1280 px; `srcset` + `sizes` (Karten: `(min-width: 901px) 33vw, (min-width: 701px) 45vw, 100vw`) |
| Seitenverhältnis | Karten 4:3 (fester Beschnitt), Artikel 3:2 oder 4:5, Hero 3:2 |
| Budget | ≤ 120 KB je Datei bei 1280 px, ≤ 40 KB bei 320 px |
| Farbe | neutrale Aufnahme; kein starker Farbstich; keine Sättigungserhöhung über +10 % |
| Hintergrund | ruhig, einfarbig oder dunkel; keine Hände mit Schmuck, keine Requisiten |
| EXIF | GPS und Kameradaten entfernen, Urheber- und Lizenzfeld setzen |
| Ablage | `assets/radiasthesie/<slug>-<breite>.webp` + `data/radiasthesie-media.json` |

### 3.2 Pflichtfelder je Bild (Manifest)

```json
{
  "id": "rad-pendel-01",
  "file": "assets/radiasthesie/pendel-klassisch-1280.webp",
  "widths": [320, 640, 960, 1280],
  "ratio": "4:3",
  "alt": "Klassisches Pendel aus Messing an einer Kette vor dunklem Grund.",
  "caption": "Klassisches Pendel. Aufnahme: Carivaldi, CC BY-SA 3.0, Bearbeitung: Beschnitt und Skalierung.",
  "creator": "Carivaldi",
  "license": "CC BY-SA 3.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
  "source": "https://commons.wikimedia.org/wiki/File:Radiesthetic_pendulum.jpg",
  "retrieved": "2026-11-02",
  "modified": true,
  "attributionRequired": true
}
```

`attributionRequired` steuert, ob die Bildnachweise im Footer der Sektion und im
Impressum erscheinen. CC0/PD-Bilder erscheinen im Sammelnachweis, aber nicht
zwingend im Footer.

## 4. Alt-Text- und Bildunterschriften-Regeln

1. **Alt-Text beschreibt das Sichtbare**, nicht die Bedeutung: „Zwei Ruten aus
   Metall, am Griffpunkt verbunden“ — nicht „Rute zeigt Wasserader an“.
2. **Keine Wiederholung der Bildunterschrift.** Alt-Text = Motiv, Bildunterschrift
   = Kontext + Maß + Grenze.
3. **Länge:** Alt-Text 40–120 Zeichen, eine Aussage; Bildunterschrift 1–2 Sätze.
4. **Dekorative Grafiken** bekommen `alt=""` und `aria-hidden="true"` — im Modul
   betrifft das nur Pfeile und Trennzeichen, keine Inhaltsbilder.
5. **Keine Textinformation nur im Bild.** Jede Zahl, jeder Zeitraum und jede
   Stufe steht als HTML-Text.
6. **Urheber und Lizenz** stehen in der Bildunterschrift oder im Sammelnachweis,
   nie nur im `title`-Attribut.

## 5. Schriften, Icons, Sonstiges

- **Schriften:** unverändert `Fraunces` (variabel, 100–900) und `Manrope`
  (200–800) aus `assets/fonts/`, SIL OFL 1.1. Keine Web-Font-Dienste, keine
  zusätzliche Display-Schrift für das Modul.
- **Icons:** keine Icon-Bibliothek. Vorhandene Zeichen sind Textzeichen
  (`→`, `↓`, `+`, `–`, `·`) und werden als Text gerendert, nicht als SVG-Sprite.
- **Stufen-Chips:** Text + Farbe, kein Icon. Damit entfällt eine Icon-Reihe, die
  ohnehin nicht barrierefrei unterscheidbar wäre.
- **Keine Hintergrundbilder, keine Muster, keine Verläufe** im Modul.

## 6. Offene Punkte

1. Lizenzprüfung und Download der sechs Fotos (ESOW-RAD-05) — nicht Teil dieses
   Laufs, im Manifest als „offen“ markiert.
2. Entscheidung, ob der Hero der Landingpage ein Foto statt der Pendelgeometrie
   erhält. Empfehlung: nein — die Zeichnung ist ehrlicher und schneller, ein Foto
   nur, wenn es die Materialwirkung wirklich trägt.
3. `data/radiasthesie-media.json` existiert noch nicht; das Schema in §3.2 ist
   der Vorschlag für die Implementierung.
