# Tokens, Typografie und die vier SVGs

Regel von oben: **Bestehende Design-Tokens und visuelle Regeln haben Vorrang.**
Der Gestaltungsvorschlag des Originalauftrags (Nachtblau, gedämpftes Violett,
Messing/Gold, Pergament) ist im Projekt bereits als **Nachtatelier** umgesetzt —
`css/design-system.css` ist die verbindliche Quelle, nicht der Auftragstext.

## 1 · Tokenbindung

Das Mockup lädt die drei echten Projektdateien und definiert **keine** eigenen
Farben:

```html
<link rel="stylesheet" href="../../../../css/design-system.css">
<link rel="stylesheet" href="../../../../css/main.css">
<link rel="stylesheet" href="../../../../css/radiasthesie.css">
<link rel="stylesheet" href="werkstatt.css">   <!-- nur Werkstatt-Regeln -->
```

`werkstatt.css` (1351 Zeilen) verwendet **35** verschiedene `var(--…)`-Tokens
(nachgezählt in diesem Lauf: `grep -o "var(--[a-z0-9-]*)" mockup/werkstatt.css |
sort -u | wc -l`); die häufigsten: `--space-2` (30 Verwendungen),
`--color-primary` (26), `--color-text-primary` (24), `--space-4` (22),
`--color-text-secondary` (22), `--space-3` (17), `--radius-sm` (17),
`--text-sm` (16), `--font-mono` (16), `--color-line-strong` (16), `--text-xs`
(15), `--color-border` (11), `--space-6` (10). Rohwerte gibt es als
1-px-Haarlinien, Prozentwerte und SVG-Koordinaten — und als Papierwerte
(`#000`, `#fff`, `#777`, `#999`, `#444`, `#111`) ausschließlich im
`@media print`-Block ab Zeile 1194, der die Bildschirmfarben für Papier
überschreibt.

### 1.1 Normative Palette (8 Werte, unverändert)

| Token | Wert | Verwendung in der Werkstatt |
|---|---|---|
| `--color-bg-deep` | `#0b1012` | Seitenhintergrund, Bühne, Tafelfläche (Stil `gold`), Feldfläche |
| `--color-bg-card` | `#141c1f` | Panels, Karten, Journal-Einträge, Tafelfläche (Stil `violett`) |
| `--color-text-primary` | `#eae6dc` | Überschriften, Messwerte, Eingabetext |
| `--color-text-secondary` | `#babdb7` | Hinweise, Legenden, Sekundärtext |
| `--color-primary` | `#c6b38e` | Sand: Primärknopf, Fokusring, Regler, „01“-Nummern, Tusche der Tafellinien |
| `--color-hover` | `#d5c4a2` | Hover der Primäraktion |
| `--color-border` | `#3c484b` | dekorative 1-px-Trenner |
| `--color-line-strong` | `#82928e` | funktionale Rahmen, Bühnenrahmen, Feldrahmen |

Funktionale Zusatztöne (nur Bedeutung, nie Dekoration): `--color-accent-rose`
`#c09489` (Löschen/Verkehrt), `--color-accent-emerald` `#9db3a4` (Aufrecht).

### 1.2 Typografie

| Rolle | Token | Gemessen |
|---|---|---|
| Fließtext | `--text-base` 16 px, `--font-body` (Manrope) | 16 px |
| Hinweis/Caption | `--text-sm` 14 px | 14 px |
| Label, Mono-Zeile | `--text-xs` 13 px, `--font-mono` | **13 px Minimum**, in allen 52 Messpunkten eingehalten (`minFontSize = 13`, `smallTargets = []`) |
| Werkzeugtitel H1 | `clamp()` auf `--text-page-title` | 44 px @1440, 30,72 px @768, 30 px @375/320 |
| Messwert groß | `--text-2xl`/Display | 28–34 px |
| Panel-Überschrift | `--text-xl` 20 px, `--font-display` (Fraunces) | 20 px |

Kein Text unter 13 px. Keine dekorative Schrift, keine Versalien-Läufe über
mehrere Zeilen, kein `letter-spacing` unter 0,02 em bei Mono-Labels.

### 1.3 Raum, Form, Tiefe

- 4-px-Raster: `--space-1…--space-24` (4/8/12/16/20/24/32/40/48/64/80/96).
  Gemessene Außenränder: 24 px (≤ 700), 32 px (≤ 1100), 64 px (darüber) —
  exakt die `--gutter`-Stufen.
- Radien: `--radius-sm` 2 px. **Keine Pillen**, `--radius-full` ist bewusst 2 px.
- Schatten: alle `--shadow-*` sind `none`. Tiefe entsteht über Fläche + 1-px-Linie,
  nicht über Glow.
- Übergänge: 120 / 200 / 300 ms. In der Werkstatt wird nur
  `--transition-fast` (120 ms) für Hover/Fokus genutzt.

## 2 · Die vier eigenen SVGs

Vorhanden in `assets/radiasthesie/`, alle mit `viewBox="0 0 520 400"`,
`role="img"`, `<title>` und `<desc>` (geprüft in
`docs/radiasthesie-completion/RAD-05/evidence/svg-report.json`, 0 Befunde):

| Datei | Motiv | Titel laut Datei |
|---|---|---|
| `pendel-geometrie.svg` | Pendel mit Ruhelage, Auslenkung 28°, L, Formel | „Schematische Pendelgeometrie“ |
| `winkelrute.svg` | zwei Ruten aus einem Griffpunkt, ~40°, Ausschlagpfeil | „Schematische Winkelrute in Aufsicht“ |
| `pendeltafel.svg` | kreisrunde Tafel, 12 Segmente, JA/NEIN + 1–10 | „Schematische Pendeltafel mit zwölf Segmenten“ |
| `orakel-karten.svg` | drei gefächerte Karten mit Kreis/Dreieck/Linie | „Drei gefächerte Karten als Zeichen für Orakel“ |

### 2.1 Zuordnung

| Ort | SVG | Regel |
|---|---|---|
| Themenkarte Radiästhesie | `winkelrute.svg` | unverändert, als `<img>` mit `alt` aus dem Titel |
| Themenkarte Pendeln | `pendeltafel.svg` | unverändert |
| Themenkarte Orakel | `orakel-karten.svg` | unverändert |
| Artikelkopf / Instrumententafel | `pendel-geometrie.svg` | unverändert |
| Werkzeug 1 (Simulator) | `pendel-geometrie.svg` als **Vorbild** | Die Bühne zeigt eine **parametrische** Zeichnung (Arm dreht mit dem Modell). Kein zweites Standbild: die Bewegung ist der Inhalt. |
| Werkzeug 2 (Tafel-Studio) | `pendeltafel.svg` als **Vorbild** | Die Vorschau ist erzeugt (SVG 600 × 600), weil Segmentzahl und Labels variabel sind. Strichstärken, Segmentteilung und Typo folgen der Vorlage. |
| Werkzeug 3 (Test-Labor) | — | Kein Instrument: das Werkzeug zeigt Daten (Ziel, Antwort, Quote). Ein Instrumentenbild würde eine Messung suggerieren, die es nicht gibt. |
| Werkzeug 4 (Journal) | — | Kein Instrument: ein Notizbuch-Bild wäre Dekoration ohne Funktion. |
| Landing-Werkstattkarten | je Werkzeugkarte das zugehörige Instrument | Simulator → Pendelgeometrie, Studio → Pendeltafel, Labor → keine (Zahlensymbol), Journal → keine (Linien-Symbol) |

### 2.2 Strichvokabular (verbindlich für neue Zeichnungen)

- Rahmen/Trenner: 1 px `--color-line-strong`; dekorativ: 1 px `--color-border`.
- Instrumentenkontur: 1,5 px `--color-primary`.
- Füllung nur `--color-bg-deep` (oder `none`), nie Verlauf, nie Schatten, nie Glow.
- Beschriftung: `--font-mono`, 11–13 px, `--color-text-secondary`; nie kursiv.
- Gestrichelte Hilfslinie: `stroke-dasharray: 4 6` (Ruhelage), `3 4` (Innenkreis).
- Kein `<script>`, kein externer Verweis, `<title>` + `<desc>` Pflicht.

Die Simulator-Bühne (inline, `viewBox="0 0 400 300"`) hält diese Regeln ein:
Balken 2 px `--color-line-strong`, Ruhelage 1 px `--color-border` gestrichelt,
Arm/Körper 1,5 px `--color-primary`, Körperfüllung `--color-bg-deep`,
Label „Aufhängung“ in Mono 13 px `--color-text-secondary`.

## 3 · Was ausdrücklich nicht passiert

| Verbot (Originalauftrag) | Umsetzung |
|---|---|
| kein überladenes Glitzerdesign | keine Schatten, keine Glows, keine Verläufe, keine Partikel; `--shadow-* = none` |
| keine störenden Animationen | **eine** Animation im ganzen Bereich: Pendelschwingung 2,6 s im Zustand `laeuft`, abschaltbar; kein Parallax, kein Auto-Play, kein Karussell |
| keine schlechtere Lesbarkeit durch Deko | Text steht immer auf `--color-bg-deep`/`--color-bg-card`, nie auf Instrumentenlinien; gemessener Mindestkontrast 9,09:1 (Text) bzw. 5,88:1 (Feldrahmen) |
| Nachtblau / Violett / Messing / Pergament | als Nachtatelier-Palette vorhanden (Basalt/Kreide/Sand); „gedämpftes Violett“ existiert **nur** als Tafelstil `violett` (`color-mix` aus `--color-line-strong` 35 % + `--color-accent-rose`), nicht als neue Seitenfarbe; „Pergament“ nur als Tafelstil und als Papierfarbe im Druck |

Neue Farben sind nicht vorgesehen. Wer den Violett-Stil ändern will, ändert den
`color-mix` in `werkstatt.css` — und misst den Kontrast neu
(`measure-werkstatt.cjs` schreibt `kontrast.json`).
