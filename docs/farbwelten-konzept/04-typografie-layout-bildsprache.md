# Typografie, Raster, Bildsprache und Bewegung

Stand: 2. November 2026 · Referenz: `docs/art-direction-nachtatelier/STYLEGUIDE.md`,
`css/design-system.css`, `mockup/farbwelten.css`.

## 1. Typografie-Hierarchie

Keine neue Schrift, keine neuen Grade. Die Sektion nutzt ausschließlich die
bestehenden Tokens; hinzu kommt nur die Entscheidung, **was** welche Rolle trägt.

| Rolle | Element | Schrift | Größe (Desktop → ≤1100 → ≤700) | Zeilenhöhe | Farbe | Einsatz |
| --- | --- | --- | --- | --- | --- | --- |
| Bereichstitel | `h1` (Einstieg) | Fraunces 400 | 80 → 66 → 52 px (≤360: 46) | 1.02 | `--color-text-primary`, **ein** kursives Wort in Sand | Hero |
| Seitentitel | `h1` (Unterseite) | Fraunces 400 | `--text-page-title` 56 → 56 → 34 px | 1.05 | primär | Farbdetail, Chakren, Lichtfrequenzen |
| Bereichsabschnitt | `h2` | Fraunces 400 | 44 → 44 → 34 px | 1.12 | primär | Abschnittsköpfe |
| Abschnitt | `h3` | Fraunces 400 | 28 → 28 → 28 px | 1.15 | primär | Kapitel, Karten |
| Unterpunkt | `h4` | Manrope 600 | 20 px | 1.25 | primär | Kartenmetadaten, kleine Blöcke |
| Fließtext | `p` | Manrope 400 | 16 px | 1.7 | sekundär auf dunklen Flächen | Absätze, max. 62–72 ch |
| Lede | `p.fw-lede` | Manrope 400 | 18 px | 1.65 | sekundär | Hero-Unterzeile, max. 52 ch |
| Label/Augenbraue | `.label` | Manrope 500 | 13 px, `0.08em`, uppercase | 1.5 | Sand **oder** `--fw-current-ink` | Bereichsmarke, Spaltenköpfe |
| Messwert | `.fw-meta`, `.fw-tafel__nm` | Mono | 13 px, tabellarische Ziffern | 1.5 | sekundär | Wellenlänge, Frequenz, Energie |
| Bildunterschrift | `.caption` | Manrope 400 | 14 px | 1.55 | sekundär | Farbtafel, Figur, Quellen |
| Button | `.btn` | Manrope 600 | 15 px | 1.2 | `#0b1012` auf Sand | Hauptaktion |

Regeln:

- **Ein** kursives Wort pro Ansicht (Site-Regel). Auf Farbseiten ist das die
  Farbwelt selbst: „Rot — das *lange* Ende des Lichts“ ist erlaubt, zwei kursive
  Wörter nicht.
- Keine Pflichtinformation unter 13 px; Messwerte nie in Fließtextgröße
  verstecken, aber auch nicht als Mikroschrift.
- Frequenz-/Wellenlängenwerte immer mit Einheit und als Text, nie als
  eingebrannte Grafik.
- Zeilenlänge: Fließtext 62–72 ch, Lede 52 ch, Karten 40–48 ch.

## 2. Raster und Abstände

| Element | Desktop | ≤1100 | ≤700 |
| --- | --- | --- | --- |
| Inhalt | max. 1360 px + 64 px Außenabstand | 32 px | 24 px |
| Hero | 7 : 5 Spalten, 64 px Abstand, 96 px oben | einspaltig, 40 px | einspaltig, 48 px |
| Farbregister-Zeile | 96 px Feld · Name · Chakra · Pfeil, 96 px hoch | 72 px Feld (701–900, Chakra entfällt) | 72 px Feld, ab ≤400 56 px Feld und 80 px hoch |
| Farbkarten | 3 Spalten, 24 px Abstand | 2 Spalten | 1 Spalte |
| Chakra-Bereich | Figur max. 420 px + Text, 64 px Abstand | einspaltig | einspaltig |
| Tradition/Forschung | 2 Spalten, 1-px-Trenner | 2 Spalten | gestapelt |
| Farbdetail | Text + 280-px-Inhaltsspalte, 48 px Abstand | einspaltig | einspaltig |
| Sektionen | 64 px vertikal | 64 px | 48 px |

Raute: 4-px-Raster (4/8/12/16/24/32/48/64/96). Keine Zwischenwerte.

Gemessene Ist-Werte des Mockups (`messung/mockup-audit.json`):

- Farbregister-Zeilen: **96 px** bei 1440 px (7 Zeilen).
- Farbkarten: **443 px** Höhe in einer Dreierreihe, differenzfrei.
- Chakra-Ziele: **44 px** ab 901 px, **36 px** bei 401–700 px, **32 px** bei
  ≤400 px (auch 390 px) — alle über der 24-px-Mindestgröße.
- Kopfzeile 1440 px (Mockup, neun Ziele, Zähler ♥12): letzter Navigationspunkt
  endet bei 1288 px, die Innenkante der Kopfzeile bei 1376 px; dazwischen
  liegen Zählerabstand und -breite.

## 3. Breakpoints (verbindlich)

| Breakpoint | Verhalten |
| --- | --- |
| ≥1121 px | volle Typografie, 14-px-Navigation, 20-px-Listenabstand |
| 901–1120 px | Navigation 13 px, Listenabstand 8 px, Kopfzeilenabstand 16 px |
| 781–900 px | **gestapeltes Menü** (neu, siehe `02` §3.4), Außenabstand 32 px |
| 701–780 px | gestapeltes Menü, Außenabstand 32 px |
| ≤700 px | Außenabstand 24 px, H1 52 px, Karten einspaltig, Chakra-Ziele 36 px |
| ≤400 px | Register 56 px Feld, Chakra-Ziele 32 px, H1 46 px |
| ≤360 px | H1 46 px, Kopfzeilenabstand 8 px (Bestand) |

Kein horizontales Scrollen bei 320 px (geprüft, siehe `07`).

## 4. Bildsprache

**Grundsatz:** Die Sektion erzeugt ihre Bilder aus Fläche, Licht und Typografie —
keine Stockfotos, keine generierten Kristallbilder, keine Regenbogen-Collagen.

| Motiv | Umsetzung | Warum |
| --- | --- | --- |
| Farbtafel im Hero | 7 Bänder, je `core → deep`, Beschriftung auf fester `deep`-Platte | zeigt alle Welten, ohne Text auf Farbe |
| Farbfeld in Karte/Detail | Verlauf `soft → core → deep`, 16:9 oder 4:3 | Pigmentwirkung statt Icon |
| Spektrumband | CSS-Verlauf aus den 21 Messpunkten, UV/IR als gedämpfte Randzonen | physikalische Anschauung, klar als Simulation markiert |
| Chakra-Figur | eigene SVG-Silhouette, 1,5-px-Linie `#82928e`, gestrichelte Positionslinien `#3c484b` | editierbar, keine Rechtefrage, keine Anatomiebehauptung |
| Evidenzstufen | Text-Chips (Buchstabe + Wort), keine Farbskala | Farbe nie allein |
| Quellen/Icons | keine dekorativen Icons; Textlinks mit Pfeil `↗` (aria-hidden) | ruhige Oberfläche |

Wenn später Fotos oder Fremdgrafiken dazukommen (z. B. CIE-Diagramm, Chakren-
Silhouetten aus dem Master-Auftrag §11), gelten die Beschaffungsregeln des
Master-Auftrags: Quelldatei prüfen, Lizenz und Urheber dokumentieren, lokal
ablegen, Alt-Text schreiben, Änderungen nachweisen. Für die sieben Farbwelten
ist **kein** Fremdbild nötig; die Flächen sind CSS.

Bildunterschriften nennen, was zu sehen ist, und — bei Simulationen — was sie
nicht sind („Bildschirmannäherung, kein monochromatisches Licht“).

## 5. Bewegung

- Es gibt **keine** Pflichtanimation. Alles ist ohne Bewegung verständlich.
- Erlaubt: Farbübergänge bei Hover/Fokus (`120 ms`), Einblenden des
  Chakra-Scheins (`200 ms`, einmalig, statisch danach).
- Verboten: dauerhaft pulsierende oder blinkende Elemente, automatisch
  wechselnde Verläufe, Parallaxe, mitlaufende Spektren.
- `prefers-reduced-motion: reduce`: Übergänge 0,01 ms (globale Regel),
  Auswahl springt sofort, keine Positionsanimation.
- Kein Autoplay von Audio, keine automatische Musik (Master §10 D).

## 6. Dichte und Rhythmus

- Maximal **eine** farbige Großfläche pro Viewport-Höhe; danach mindestens
  eine Textfläche oder ein 1-px-Trenner.
- Sieben Farbkarten stehen nie gleichzeitig als sieben gesättigte Flächen im
  Blick: Auf der Einstiegsseite trägt das Register die Übersicht, die Karten
  zeigen nur drei Beispiele.
- Jede Sektion beginnt mit Text (Label + H2), nicht mit einer Farbfläche.
- Der Sand-Ton bleibt die einzige Aktionsfarbe; `-ink` markiert Zugehörigkeit,
  nicht Interaktion. Interaktive Elemente behalten Sand als Fokus- und
  Hover-Farbe.
