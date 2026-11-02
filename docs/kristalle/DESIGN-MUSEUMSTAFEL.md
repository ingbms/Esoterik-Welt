# Gestaltungsentscheidung: Museumstafel statt Freistellung

**Bezug:** Review `t_385afa1e`, Befund **P2.1** (visuelle Kohärenz)
**Status:** bewusst beibehaltene Entscheidung, ergänzt um eine einheitliche Innenkante
**Datum:** 2026-11-02

## Befund

18 der 30 Kacheln zeigen das Foto als Rechteck im Basaltgrund (Modus `pad`), 5 sind
freigestellt (`matte`: `crys-04`, `crys-05`, `crys-12`, `crys-13`, `crys-23`), 7 haben
einen neutralen Grund. Zehn Motive haben mehr als 15 % helle Bildfläche und wirken im
dunklen Raster als helle Panels:

| Bild | helle Fläche | Bild | helle Fläche |
|---|---|---|---|
| `crys-21` | 54,9 % | `crys-02` | 32,0 % |
| `crys-16` | 42,1 % | `crys-06` | 27,4 % |
| `crys-18` | 37,5 % | `crys-03` | 25,6 % |
| `crys-24` | 36,0 % | `crys-01` | 21,9 % |
| `crys-15` | 34,1 % | `crys-28` | 20,9 % |

Zusätzlich sind `crys-04` (Schneeflockenobsidian) und `crys-10` (Schörl) schwarz auf
schwarz nahezu strukturlos; `crys-24` (Kristallquarz) bleibt blass.

## Entscheidung

**Die Fotoplatte bleibt.** Die Sektion ist als *Museumstafel* konzipiert: das Objekt
steht als gerahmte Aufnahme im Basaltgrund, nicht als freigestelltes Produktbild. Dafür
spricht:

1. **Lizenz und Belegbarkeit.** Freistellen ist eine Bearbeitung; bei den 11
   namensnennungspflichtigen Bildern müsste jede Maske dokumentiert und bei CC BY-SA als
   Änderung benannt werden. Die vorhandenen Masken der 5 `matte`-Motive sind visuell
   geprüft, nicht algorithmisch — eine Ausdehnung auf 10 weitere Motive würde das
   Risiko erhöhen, ohne den Lizenznachweis zu verbessern.
2. **Motivtreue.** Die Spezifikation fordert „keine Spitzen kappen" (E1). Ein Freistellen
   heller Studiofotos (`crys-21`, `crys-16`, `crys-24`, `crys-28`) schneidet in
   Aufnahmen mit weichem Schattenwurf hart am Motiv und erzeugt einen zweiten, unruhigen
   Bildrand.
3. **Konsistenz.** 25 der 30 Motive sind unbeschnitten; ein Teil-Freistellen erzeugt
   genau den Bruch, den der Review benennt („zwei Bildklassen").

**Umsetzung:** Alle Kacheln erhalten eine einheitliche, weiche Innenkante
(`.crystal-image::after`: 1 px Rahmen `rgba(186,189,183,.12)` plus Innenvignette
`rgba(11,16,18,.55)`, 26 px). Sie bindet die helle Fotokante an den Grund, ohne das Motiv
zu verändern — `object-fit: contain`, keine Filter, keine Beschnittänderung. Die
Messwerte und die Bilddateien bleiben unverändert (120 Dateien, SHA-256 wie im Manifest).

**Nicht umgesetzt:** Ersatzmotive für `crys-04`/`crys-10` und eine Freistellung der
hellen Motive. Beides würde die Provenienzkette (SHA-256, Quellrenditionen) neu aufrollen
und ist für die Abnahme nicht erforderlich; die Strukturarmut der beiden schwarzen Steine
ist eine Eigenschaft des Motivs, nicht der Aufbereitung.

## Prüfung

* Sichtprüfung im gebauten Stand bei 1440 px (`evidence/kristalle-fixes-t_b53c4f5a/grid-1440.png`).
* Die Innenkante ist im gerenderten CSS nachweisbar:
  `node docs/kristalle/scripts/verify-a11y-fixes.cjs` gibt `plate.overlayShadow` aus.
* Kein Bild wurde neu kodiert; `npm run test:crystals` prüft Bytes und SHA-256 aller
  120 Dateien gegen das Manifest.
