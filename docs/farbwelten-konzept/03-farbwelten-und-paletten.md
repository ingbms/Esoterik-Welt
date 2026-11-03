# Farbwelten — Paletten, Rollen und geprüfte Kontraste

Stand: 2. November 2026 · Grundlage: `scripts/generate-palette.py`,
`messung/palette.json`, `messung/palette-tabellen.md` (automatisch erzeugt).

Geltungsbereich: **zwölf Farbwelten** in der Reihenfolge des Master-Auftrags §5 —
acht Spektralfarben (rot, orange, gelb, grün, **türkis**, blau, indigo, violett),
zwei nichtspektrale Mischfarben (magenta, rosa) und zwei Neutralfarben
(weiß, schwarz). Nichtspektrale und neutrale Farben haben keine Wellenlänge;
für sie werden keine Messwerte erfunden.

## 1. Gestaltungsprinzip

Die Sektion bleibt Nachtatelier: dunkler Raum, Sand als einzige Aktion, große
Fraunces-Typografie. Farbe kommt als **Pigmentfläche** ins Bild, nicht als
Leuchtreklame. Drei Regeln halten das zusammen:

1. **Kein Neon.** Chroma ist je Rolle gedeckelt (`core` ≤ 0,15 OKLCH-Chroma).
   Die gesättigte Fläche ist maximal ein Drittel einer Karte, nie der Grund
   für Pflichttext.
2. **Text steht nie auf `core` oder `soft`.** Pflichttext nutzt
   `--color-text-primary`/`-secondary` auf `#0b1012`, `#141c1f` oder dem
   getönten `-deep` einer Farbwelt. Farbige Schrift nur als `-ink` auf diesen
   drei dunklen Flächen.
3. **Farbe ist nie das einzige Merkmal.** Jede Farbfläche trägt Namen und
   Wellenlänge als Text; Chakra-Punkte tragen Nummer und Namen; Evidenzstufen
   tragen Buchstabe/Wort, nicht nur Farbe.

## 2. Rollen je Farbwelt

| Rolle | Aufgabe | Konstruktion | Verbot |
| --- | --- | --- | --- |
| `-core` | Pigmentfläche, Farbfeld, Diagrammfläche | OKLCH L 0,56, Chroma ≤ 0,15 | kein Text, keine 1-px-Linie darauf |
| `-core-deep` | Verlaufstiefe, Rand einer Fläche | L 0,44, Chroma ≤ 0,11 | kein Text |
| `-soft` | heller Verlaufsanfang, dezente Fläche | L 0,74, Chroma ≤ 0,075 | kein Text |
| `-deep` | getönte dunkle Fläche (Hero-Band, Labelplatte) | L 0,225, Chroma 0,028 | nur mit geprüftem Text |
| `-deep-alt` | Verlaufstiefe im Hero | L 0,19, Chroma 0,022 | nur Fläche |
| `-line` | funktionale Linie/Rahmen in der Farbwelt | L ≈ 0,55, ≥ 3:1 auf `-deep` | nicht dekorativ einsetzen |
| `-ink` | farbige Schrift (Labels, Zwischentitel, Links) | L so niedrig wie möglich, aber ≥ 4,6:1 auf allen drei dunklen Flächen | nie auf `core`/`soft` |

Die Helligkeitsabstände sind bewusst klein: Die zwölf Welten sollen sich im
Ton unterscheiden, nicht in der Lautstärke.

## 3. Paletten (verbindlich)

<!-- Tabelle A aus messung/palette-tabellen.md, Werte unverändert übernommen -->

| Farbwelt | `-ink` Text | `-core` Fläche | `-core-deep` | `-soft` | `-line` | `-deep` Fläche | `-deep-alt` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rot | `#cf6a60` | `#bc4a41` | `#853630` | `#d69991` | `#985c55` | `#281715` | `#1d100e` |
| Orange | `#c77434` | `#ad5c13` | `#7a4213` | `#d09f7d` | `#936240` | `#26180f` | `#1c110a` |
| Gelb | `#a08b32` | `#887315` | `#605213` | `#b9ab74` | `#786c3a` | `#201c0c` | `#171408` |
| Grün | `#4da15d` | `#1d8b3d` | `#1b622d` | `#8bb890` | `#47764e` | `#131f14` | `#0d170e` |
| Türkis | `#389d9d` | `#1b8585` | `#185e5e` | `#6fbab9` | `#3f7776` | `#0a2020` | `#071717` |
| Blau | `#4391d7` | `#1678c3` | `#15568a` | `#85afd8` | `#447098` | `#111d28` | `#0c151d` |
| Indigo | `#857fd7` | `#6e64c8` | `#4d478c` | `#a5a5d9` | `#6a689c` | `#1a1a28` | `#13121d` |
| Violett | `#ad71bf` | `#9853ad` | `#6b3c79` | `#bf9cca` | `#82608d` | `#211824` | `#18111a` |
| Magenta | `#c3699e` | `#af4a88` | `#7b3660` | `#ce98b6` | `#905b79` | `#25161f` | `#1b1016` |
| Rosa | `#c9899c` | `#a15c72` | `#714251` | `#c59fa9` | `#8e6973` | `#23181b` | `#191113` |
| Weiß | `#c9c4b5` | `#f1ebda` | `#d9d4c8` | `#fbf8f0` | `#95928a` | `#1e1c14` | `#16140e` |
| Schwarz | `#b0ab9c` | `#383225` | `#201d13` | `#55524b` | `#6f6c64` | `#1e1c14` | `#16140e` |

## 4. Kontrastnachweis (gemessen, nicht geschätzt)

Methode: sRGB → lineare Kanäle → relative Luminanz nach WCAG 2.x;
Kontrast = (L1 + 0,05) / (L2 + 0,05). Alle Werte aus
`scripts/generate-palette.py`, Rohdaten in `messung/palette.json`.

| Farbwelt | Ink auf `#0b1012` | Ink auf `#141c1f` | Ink auf eigenem `-deep` | Text primär auf `-deep` | Text sekundär auf `-deep` | Linie auf `-deep` | Linie auf `#141c1f` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rot | 5,36:1 | 4,84:1 | 4,81:1 | 13,77:1 | 9,03:1 | 3,27:1 | 3,29:1 |
| Orange | 5,45:1 | 4,92:1 | 4,90:1 | 13,81:1 | 9,06:1 | 3,33:1 | 3,34:1 |
| Gelb | 5,68:1 | 5,13:1 | 5,06:1 | 13,67:1 | 8,96:1 | 3,25:1 | 3,29:1 |
| Grün | 5,99:1 | 5,41:1 | 5,33:1 | 13,66:1 | 8,96:1 | 3,22:1 | 3,27:1 |
| Türkis | 5,90:1 | 5,33:1 | 5,22:1 | 13,59:1 | 8,91:1 | 3,31:1 | 3,38:1 |
| Blau | 5,72:1 | 5,16:1 | 5,10:1 | 13,70:1 | 8,98:1 | 3,27:1 | 3,30:1 |
| Indigo | 5,48:1 | 4,95:1 | 4,92:1 | 13,79:1 | 9,04:1 | 3,33:1 | 3,35:1 |
| Violett | 5,37:1 | 4,85:1 | 4,83:1 | 13,80:1 | 9,05:1 | 3,28:1 | 3,30:1 |
| Magenta | 5,32:1 | 4,80:1 | 4,81:1 | 13,89:1 | 9,11:1 | 3,26:1 | 3,26:1 |
| Rosa | 6,87:1 | 6,20:1 | 6,19:1 | 13,84:1 | 9,07:1 | 3,63:1 | 3,63:1 |
| Weiß | 10,98:1 | 9,91:1 | 9,78:1 | 13,68:1 | 8,97:1 | 5,49:1 | 5,56:1 |
| Schwarz | 8,34:1 | 7,53:1 | 7,43:1 | 13,68:1 | 8,97:1 | 3,25:1 | 3,29:1 |

Zielwerte: Text ≥ 4,5:1 (AA), funktionale Linien ≥ 3:1, Buttonlabel ≥ 4,5:1.
Alle zwölf Paletten erfüllen jeden Prüfpunkt (`messung/palette.json` →
`checks`, alle `true`).

**Einordnung der Reserve:** Der engste Wert ist Magenta `-ink` auf `-deep` mit
4,81:1 (7 % über der Schwelle). Deshalb gilt: `-ink` nur für Labels ab 14 px
und für Zwischentitel; Fließtext bleibt bei `--color-text-secondary`
(9,03:1 auf `-deep`). Wer die Palette später heller oder bunter dreht, muss
`python docs/farbwelten-konzept/scripts/generate-palette.py` erneut ausführen —
der Lauf bricht mit Fehlercode ab, sobald eine Rolle die Schwelle reißt.

## 5. Nichtspektrale und neutrale Farben

Türkis, Magenta, Rosa, Weiß und Schwarz sind nach derselben Methode berechnet
und ausgeliefert. Drei Festlegungen gelten nur für sie:

1. **Türkis ist Spektralfarbe** im Übergangsbereich ca. 490–520 nm. Der Bereich
   ist Konvention, keine Naturkante; er überschneidet sich mit Grün und Blau und
   wird auf der Seite als Übergang benannt.
2. **Magenta und Rosa tragen keine Wellenlänge.** Magenta ist ein additiver
   Rot-Blau-Mix (Hue 345° statt 350°, damit es sich von Violett trennt), Rosa
   eine Rotvariante mit reduzierter Sättigung (Hue 0°, Chroma-Skala 0,62;
   `-ink` und `-line` eine Stufe heller, sonst wäre Rosa von Magenta nicht zu
   unterscheiden).
3. **Weiß und Schwarz sind Neutralfarben** ohne Wellenlänge. Sie laufen mit
   Chroma-Skala 0,16 auf Hue 90° (warmes Grau des Systems). `-core` trägt dort
   den Farbeindruck: Weiß L 0,94 (16,08:1 auf `#0b1012`), Schwarz L 0,32
   (1,50:1). Für Schwarz ist gegen den fast schwarzen Grund keine 3:1-Trennung
   möglich; die Fläche wird durch den 1-px-Rahmen `--color-line-strong`
   (5,88:1) und das Typ-Label „Neutralfarbe“ getragen. Das ist dokumentiert und
   geprüft, keine Designlücke (`messung/palette-tabellen.md` → Abschnitt D).

## 6. Spektrum-Simulation

Für das Spektrumband (Hero, `#farbwelten/lichtfrequenzen`) wird eine
Wellenlängen→sRGB-Näherung (Bruton) verwendet, keine Kolorimetrie:

`380 nm #610061 · 400 nm #8300b5 · 420 nm #6a00ff · 440 nm #0000ff · 460 nm #007bff ·
480 nm #00d5ff · 500 nm #00ff92 · 520 nm #36ff00 · 540 nm #81ff00 · 560 nm #c3ff00 ·
580 nm #ffff00 · 600 nm #ffbe00 · 620 nm #ff7700 · 640 nm #ff2100 · 660 nm #ff0000 ·
680 nm #ff0000 · 700 nm #ff0000 · 720 nm #db0000 · 740 nm #b50000 · 760 nm #8d0000 ·
780 nm #610000`

Grenzen, die in die UI gehören (Text, nicht Kleingedrucktes): Ein Bildschirm
erzeugt kein monochromatisches Licht; Magenta ist keine Spektralfarbe; die
Grenzen der Farbnamen sind fließend. Das Band ist **Dekoration mit
Informationswert** — nie die einzige Quelle für einen Messwert.

## 7. Token-Ausgabe

`scripts/generate-palette.py` schreibt `mockup/palette.css`; diese Datei ist die
Vorlage für den Produktionsblock. Empfohlene Ablage: `css/design-system.css`
direkt nach den Chakra-Inhaltsdaten, damit alle Tokens an einer Stelle stehen.

```css
/* Farbwelten — Inhaltsfarben, aus docs/farbwelten-konzept/scripts/generate-palette.py.
   Nicht von Hand ändern; Kontraste sind in docs/farbwelten-konzept/03-... belegt. */
:root {
  --fw-rot-ink: #cf6a60;
  --fw-rot-core: #bc4a41;
  --fw-rot-core-deep: #853630;
  --fw-rot-soft: #d69991;
  --fw-rot-line: #985c55;
  --fw-rot-deep: #281715;
  --fw-rot-deep-alt: #1d100e;
  /* … elf weitere Welten analog (Türkis, Blau, Indigo, Violett, Magenta,
     Rosa, Weiß, Schwarz sowie Orange, Gelb, Grün) … */
}

/* Aktive Farbwelt: eine Zuweisung, keine Inline-Styles im Markup. */
[data-farbwelt='rot'] {
  --fw-current-ink: var(--fw-rot-ink);
  --fw-current-core: var(--fw-rot-core);
  --fw-current-core-deep: var(--fw-rot-core-deep);
  --fw-current-soft: var(--fw-rot-soft);
  --fw-current-line: var(--fw-rot-line);
  --fw-current-deep: var(--fw-rot-deep);
  --fw-current-deep-alt: var(--fw-rot-deep-alt);
}
```

Regeln für die Umsetzung:

- Keine `rgb()`-Literale in Komponenten — nur `var(--fw-current-*)`.
- Kein `opacity` auf Textcontainern, um Flächen abzudunkeln (Kontrast ändert
  sich dadurch unbemerkt).
- Keine neuen Farbverläufe außerhalb dieser Rollen; Verläufe immer zwischen
  zwei benannten Rollen derselben Welt (`soft → core → deep`).
- Die bestehenden `--color-chakra-*`-Werte bleiben unverändert: Sie sind
  Inhaltsdaten der Kristallzuordnung, keine UI-Farben. Die Farbwelten führen
  eigene, gedeckte Töne; eine Vermischung beider Sätze ist nicht zulässig.

## 8. Prüfbefehle

```bash
python docs/farbwelten-konzept/scripts/generate-palette.py   # rechnet alles neu, bricht bei Verstoß ab
python docs/farbwelten-konzept/scripts/render-tables.py      # schreibt die Tabellen neu
node docs/farbwelten-konzept/scripts/audit-mockup.cjs        # misst das gerenderte Mockup
```
