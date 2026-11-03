# Kristalle-Galerie — visuelle und technische Spezifikation

Stand: 02.11.2026 · Karte `t_5ca258cb` (Profil `design_web_layout`) · Grundlage: `docs/kristalle-image-audit.md`
(`t_121a9c84`) und `docs/kristalle/image-sources.json` (Bildrecherche `t_75514188`, Stand 02.11.2026)
· Arbeitsbaum `C:/Users/mas/Arbeit/Esoterik-Welt`

Art: **Spezifikation**. Keine Änderung an Produktivcode, Daten oder Assets. Der Prototyp in
`docs/kristalle-gallery-spec/` ist Prüfmittel, nicht Lieferstand.

---

## 0. Lesart dieses Dokuments

Jede Entscheidung steht als **E1–E12** und ist mit *Begründung* und *Prüfung* versehen. Abschnitte 1–9
sind verbindlich für die Umsetzung (`t_12a8db50`), Abschnitt 10 enthält die messbaren
Abnahmekriterien, Abschnitt 11 die Umsetzungsschritte, Abschnitt 12 die Grenzen dieser Arbeit.

Zahlen sind gemessen, nicht geschätzt. Messumgebung: Chromium, `Emulation.setDeviceMetricsOverride`,
`devicePixelRatio = 2`, lokaler Server unter `http://127.0.0.1:8104/Esoterik-Welt/` (Repo-Root unter
`/Esoterik-Welt/`, damit `<base href="/Esoterik-Welt/">` greift). Rohdaten:
`docs/kristalle-gallery-spec/evidence/measurements.json`.

> **Messregel (wichtig, sonst falsche Zahlen):** Jede Breite in einem **frisch geladenen** Dokument
> messen. Wird nur die Viewport-Größe in einem bereits geladenen Dokument geändert, löst Chrome
> `var(--gutter)` in media-query-abhängigen Deklarationen nicht neu auf; gemessen blieb `.container`
> dann bei `padding: 64px`, obwohl `--gutter` bereits `24px` war. Folge: eine Scheinkontraktion der
> Kartenbreite und falsche `sizes`-Werte. Der Audit (`t_121a9c84`) nennt für 640 px eine Bildfläche von
> 510 px; korrekt sind **282 px** (2 Spalten). Diese Spec verwendet ausschließlich die neu gemessenen
> Werte.

---

## 1. Ziel und Nicht-Ziele

**Ziel.** 30 Bilder wirken als *eine* Galerie: gleiche Plattengeometrie, gleiche Bildregie, ruhige
Farbfolge, ein Bildnachweis, der Lizenzpflichten erfüllt, ohne die Karten zu überladen.

**Nicht-Ziele (bewusst ausgeschlossen).**

| Nicht im Scope | Grund |
|---|---|
| Lightbox, Zoom, Vollbild, Karussell | Der Dialog ist bereits die Detailansicht; ein zweiter Overlay-Pfad verdoppelt Fokus- und Stacking-Logik ohne Nutzen für 30 Standbilder. |
| Masonry / variable Kachelhöhen | Zerstört die ruhige Plattenreihe (STYLEGUIDE: keine Dashboard-Ästhetik) und erschwert `srcset`-Kalkulation. |
| Bildfilter per CSS (`saturate`, `mix-blend-mode`) | 30 heterogene Fremdfotos würden ungleichmäßig reagieren; der Hero nutzt `screen` nur, weil *ein* Foto einen rein schwarzen Grund hat. Angleichung gehört in die Produktion, nicht in den Browser (§3). |
| Hover-Zoom, Lift, Schatten, Glow | STYLEGUIDE §4/§7: keine UI-Schlagschatten, keine Bewegung nötig. |
| Bildrecherche und Lizenzprüfung | Karte `t_75514188`; diese Spec definiert nur, *wo* und *wie* die Nachweise erscheinen. |

---

## 2. Entscheidungen im Überblick

| # | Entscheidung | Kurzbegründung |
|---|---|---|
| **E1** | Platte ist **quadratisch (1:1)** und wird **vollflächig produziert**: quadratische Bilddatei, Motiv mit ≥ 6 % Rand, Hintergrund auf `#0b1012` eingebacken. | `contain`/`cover` werden damit zur reinen Sicherung; kein Beschnitt von Spitzen (Art Direction: „keine Spitzen kappen“). |
| **E2** | Rendering: `object-fit: contain`, `object-position: center`, **kein** CSS-Filter, **kein** Blend-Mode. | Sicherheitsnetz für nicht-quadratische Zulieferung; keine zweite, browserabhängige Farbkorrektur. |
| **E3** | Vier Asset-Stufen **320 / 640 / 960 / 1280 px** Breite als **WebP** (q 78–82, sRGB). | DPR 2 verlangt bis 1162 px (Einspaltenfall bei 631 px); 320/640/1280 allein erzwingen auf fast allen Handys das größte Bild. |
| **E4** | Reihenfolge = **Chakra-Abstieg** (Krone → Wurzel), innerhalb einer Stufe Farbton aufsteigend, helle/neutrale Steine als Ruhepunkte. | Die Sektion ist ein Katalog, kein Zufallsstapel; die Leiter ist inhaltlich begründet (Chakra-Badges) und optisch ein ruhiger Farbverlauf. |
| **E5** | Jede Karte trägt **eine** sichtbare Nachweiszeile (13 px, Sekundärtext): `Foto: <Urheber> · <Lizenz>`. Kein Link in der Karte. | Lizenzpflicht am Ort der Anzeige, ohne 30 zusätzliche Linkziele in einem klickbaren `<article>`. |
| **E6** | Der Dialog trägt den **vollständigen Nachweis** in drei Blöcken: Urheber + Lizenz (verlinkt), Quelle + Abrufdatum (verlinkt), Änderungen. | TASL vollständig, ein Klick entfernt; `figcaption` statt Freitext. |
| **E7** | Zusätzlich: Impressum-Abschnitt `#kristalle-fotos` und `assets/crystals/manifest.json` + `docs/kristalle/QUELLEN-RECHTS-MANIFEST.md`. | Projektkonvention (Tarot/Mineral), dauerhafte Sammelstelle. |
| **E8** | Raster-Alt im Grid/List: `alt=""`; Dialogbild: beschreibendes Alt aus `image_alt`. | Der Kartenname steht als `<h2>` direkt am Bild (Tarot-Konvention, testgestützt); doppelte Vorlesung vermeiden. |
| **E9** | Kein `tabindex` auf `<article>`; Tastaturpfad ist die vorhandene Schaltfläche „Details anzeigen“; Karte reagiert zusätzlich per `:focus-within`. | Ein klickbares `<article>` mit verschachtelten Buttons/Links ist kein gültiges Bedienelement; die Schaltfläche existiert bereits und ist 44 px hoch. |
| **E10** | Dialog: `max-width: min(92vw, 880px)`, Bildspalte `5fr / 7fr` → **336 px** statt heute 215 px. | 215 px ist für ein Foto zu klein; 336 px bei 880 px Modalbreite hält Textspalte bei 470 px. |
| **E11** | Fokus-Rückgabe nach Schließen an die **auslösende** Schaltfläche; `focusInitial` bleibt beim Schließen-Knopf des Dialogs. | Heute landet der Fokus bei Mausklick auf `body` (Trigger = `document.activeElement`). |
| **E12** | Druck: komplette Figur (Bild **und** Nachweis) ausblenden. | Sonst druckt ein Nachweis ohne Bild. |

---

## 3. Bildproduktion, Beschnitt, Hintergrund, Farbe

Verbindlich für die Bildaufbereitung (Karte `t_75514188`/`t_12a8db50`), nicht für CSS.

### 3.1 Geometrie

| Merkmal | Vorgabe | Prüfung |
|---|---|---|
| Endformat | **1:1**, Kantenlänge 1280 px (Master), daraus 960 / 640 / 320 | `identify`/`ImageMagick` oder `sharp().metadata()`: `width === height` |
| Motivrand | **≥ 6 %** der Kantenlänge an allen vier Seiten (≈ 77 px bei 1280) | Sichtprüfung + Messung der Motiv-Bounding-Box (Alpha- oder Helligkeitsschwelle); Wert im Manifest (`subject_bbox`) |
| Hintergrund | flächig **`#0b1012`** (Basalt), keine Vignette, kein Verlauf, kein Boden-Schatten über die Plattenkante | 5 Stichproben an den Ecken und in der Mitte: je Kanal ± 4/255 zu `#0b1012` |
| Beschnitt | **kein** Beschnitt der Silhouette; fehlende Fläche wird mit Hintergrund aufgefüllt, nicht durch Abschneiden erzeugt | Spitzen/Enden vollständig im Bild (Sichtprüfung gegen das Quellbild) |
| Typografie im Bild | keine Buchstaben, Zahlen, Wasserzeichen, Rahmen | Sichtprüfung |

**Drei Motive sind laut Bildrecherche nur „bedingt“ 1:1-fähig** – `crys-09` Selenit, `crys-17` Moonstone,
`crys-30` Rauchquarz (`square_crop: "bedingt"` in `docs/kristalle/image-sources.json`). Für diese drei
gilt zwingend: **quadratische Leinwand mit Hintergrund auffüllen, nicht mittig beschneiden**. Ein
zentrischer 1:1-Beschnitt kappt bei ihnen die Spitzen bzw. den Körper – genau der Fehler, den die Art
Direction ausschließt. Alle übrigen 27 Motive sind laut Manifest „gut“ 1:1-fähig, werden aber
trotzdem nach derselben Regel mit ≥ 6 % Rand gesetzt (einheitliche Plattenwirkung).

Warum eingebackener Hintergrund: nur so verschwindet die Kante zwischen Bild und Platte
(`--color-bg-deep`) vollständig; ein JPEG-Rechteck mit abweichendem Schwarz wäre als helleres Feld
sichtbar und `contain` würde bei nicht-quadratischer Zulieferung ein sichtbares Band erzeugen.

### 3.2 Farbe und Licht

- Einheitliche Lichtrichtung **links oben** (35–55° seitlich, 25–45° oberhalb), wie STYLEGUIDE §5.
- Weißabgleich auf **ca. 4300 K** ziehen, neutrale bis leicht warme Reflexe; kein violetter Randnebel.
- Tonwertangleichung **in der Produktion** (Kurven/HSL), Ergebnis in der Datei; **kein** CSS-Filter
  (E2). Jede Angleichung ist eine Bearbeitung und gehört in `changes` des Nachweises.
- Keine künstliche Sättigung, kein HDR-Halo, keine „Glow“-Kanten; Riefen, Trübungen, Einschlüsse
  bleiben sichtbar (Materiallesbarkeit ist das Qualitätsmerkmal, nicht Politur).

### 3.3 Motiv-Differenzierung der Doppelpärchen (Pflicht)

| Paar | Vorgabe | Warum |
|---|---|---|
| `crys-02` Quarz (Rosenquarz) vs. `crys-21` Rosenquarz (Milch) | 02 = **Rohstufe/Bruchstück** mit Matrix, 21 = **Trommelstein/geschliffen**, matt-milchig | mineralogisch identisch; ohne Motivunterschied wirkt der Katalog doppelt |
| `crys-03` Zitrin vs. `crys-07` Citrin (Wille) | 03 = **geschliffene Facette** (klare Kanten), 07 = **Rohstufe/Cluster** | wie oben; zusätzlich unterscheidet die Bildform die beiden Einträge auf einen Blick |

Diese Vorgabe ist Prüfkriterium (A26): die vier Dateien dürfen nicht aus derselben Aufnahmeserie
stammen und müssen sich in Motivtyp *und* Silhouette unterscheiden.

---

## 4. Dateiformat, Stufen, Budget, Manifest

### 4.1 Format

**WebP**, Qualität 78–82, sRGB, keine Alpha-Kante (Hintergrund ist deckend), `sharp`/`cwebp` mit
4:2:0. Begründung: das Projekt verlangt bereits `aspect-ratio`, Container Queries, `:focus-visible`
und `IntersectionObserver`; WebP ist auf jeder Plattform verfügbar, die diese Website trägt. Ein
JPEG-Fallback via `<picture>` würde die Dateizahl verdoppeln und die `srcset`-Pflege erschweren –
**nur** falls eine Lizenz ausdrücklich ein bestimmtes Format verlangt, wird auf JPEG q 82 mit
identischen Stufennamen ausgewichen (dann `type`-Angabe im `<source>`).

### 4.2 Ablage und Stufen

```
assets/crystals/
  320/<slug>.webp
  640/<slug>.webp
  960/<slug>.webp
  1280/<slug>.webp
  manifest.json
```

`<slug>` = Dateiname aus `image_placeholder` ohne Endung (`amethyst`, `rosenquarz`,
`citrin-wille`, …). Ordnerstruktur wie Tarot (`assets/tarot/<deck>/{300,600,1200}/`), Pfade immer
**relativ** beginnend mit `assets/` – `/assets/…` bricht wegen `<base href="/Esoterik-Welt/">`.

### 4.3 Budget je Datei (Obergrenze, gemessen am Ist der Datei)

| Stufe | max. Bytes | typisch |
|---|---:|---:|
| 320 | 25 KB | 12–20 KB |
| 640 | 60 KB | 35–50 KB |
| 960 | 110 KB | 65–95 KB |
| 1280 | 180 KB | 110–160 KB |

Gesamtbild: alle 30 Karten gleichzeitig auf 960 px ≈ **2,0–2,4 MB**; durch `loading="lazy"` lädt der
erste Bildschirm nur die sichtbaren 4–8 Bilder (≤ 0,8 MB). Wird eine Stufe im Schnitt > 120 % des
Budgets, Qualität senken (nicht die Stufe streichen).

### 4.4 `manifest.json` (abgeleitet aus der Bildrecherche)

Die Bildrecherche (`t_75514188`) liefert bereits `docs/kristalle/image-sources.json` – je Kristall ein
gewählter Kandidat mit `source.page_url`, `source.renditions` (320/640/1280 inkl. `sha256` und
`bytes`), `author`, `license { name, version, class, url, share_alike }`, `retrieved_at`,
`attribution_text_short`, `attribution_text_required`, `visual_note`, `square_crop`. Diese Datei ist
die **Quelle der Wahrheit**; `assets/crystals/manifest.json` ist das **ausgelieferte Derivat** und
wird daraus erzeugt (kein zweites Buch führen, keine handgepflegten Doppeltexte).

```json
{
  "package": "crystals-v1",
  "generated_from": "docs/kristalle/image-sources.json",
  "generated": "2026-11-02",
  "license_policy": "nur PD / CC0 / CC BY / CC BY-SA, keine NC/ND",
  "images": [
    {
      "id": "crys-01",
      "slug": "amethyst",
      "levels": { "320": "320/amethyst.webp", "640": "640/amethyst.webp",
                  "960": "960/amethyst.webp", "1280": "1280/amethyst.webp" },
      "size": [1280, 1280],
      "bytes": { "320": 15380, "640": 41220, "960": 78340, "1280": 131880 },
      "sha256": { "320": "…", "640": "…", "960": "…", "1280": "…" },
      "source_sha256": "a87bb13b835745a6b6cf9178620f1dd8f85d880eb47f1ccc458b8c320bb58e9b",
      "subject_bbox": [78, 82, 1202, 1198],
      "attribution_text_short": "Foto: CopyrightFreePhotos CopyrightFreePhotos.HQ101.com · Public domain",
      "attribution_text_required": "„Amethyst Quartz Crystals“ – CopyrightFreePhotos … (Public Domain, PD-self). Quelle: https://commons.wikimedia.org/wiki/File:…",
      "credit": {
        "author": "CopyrightFreePhotos CopyrightFreePhotos.HQ101.com",
        "source_label": "Wikimedia Commons",
        "source_url": "https://commons.wikimedia.org/wiki/File:Amethyst_Quartz_Crystals.jpg",
        "license": "Public Domain (PD-self)",
        "license_url": "https://commons.wikimedia.org/wiki/Template:PD-self",
        "share_alike": false,
        "retrieved": "2026-11-02",
        "changes": "1:1-Leinwand mit Rand, Hintergrund auf #0b1012 vereinheitlicht, Skalierung auf 1280/960/640/320 px",
        "alt": "Amethyst — violette Rohstufe vor dunklem Grund, vollständig im Bild, Spitzen und Bruchflächen sichtbar"
      }
    }
  ]
}
```

Abweichungen zur Recherche, bewusst und begründet:

| Punkt | Recherche/Manifest | Spec | Grund |
|---|---|---|---|
| Stufen | 320 / 640 / 1280 | **320 / 640 / 960 / 1280** | DPR 2 verlangt bis 1162 px (Einspaltenfall 631 px); ohne 960 lädt fast jedes Handy das 1280er |
| Zielpfad | `assets/crystals/<slug>.jpg` (flach) | `assets/crystals/{320,640,960,1280}/<slug>.webp` | Tarot-Konvention (Ordner je Breite), WebP statt JPEG |
| „delivered_width_px“ 330/960/1280 | Wikimedia-Rundung der *Quellanfrage* | unerheblich für die Ausgabe | wir schneiden selbst auf exakte Zielbreiten |

Die Lizenzlage ist heterogen (Manifest-Statistik: 6 Public Domain, 12 CC0, 12 mit Namensnennungspflicht
über CC BY 2.0/3.0/4.0 und CC BY-SA 2.5/3.0/4.0, davon 6 share-alike). Deshalb:

- **Ebene 1** (Karte) nutzt **exakt** `attribution_text_short` – die Recherche hat das Kürzel je Bild
  schon in der Zielform „Foto: Urheber · Lizenz“ geliefert.
- **Ebene 2** (Dialog) nutzt `attribution_text_required` als Grundlage für Quelle/Urheber/Lizenz und
  ergänzt Abrufdatum und Änderungen.
- **Ebene 3** (Impressum) übernimmt `attribution_text_required` wörtlich und weist bei `share_alike:
  true` zusätzlich die Lizenz der bearbeiteten Fassung aus (Muster `impressum.html:106-110`).

---

## 5. Reihenfolge

### 5.1 Regel

1. **Primär (hart, geprüft):** Chakra-Stufe **absteigend** (Krone → Wurzel). Maßgeblich ist die
   **erste** genannte Chakra-Angabe in `data/crystals.json` (`"Kronen- & Drittes Auge"` → Krone,
   `"Herz / Sakral"` → Herz, `"Solare Plexus"` → Solarplexus). Innerhalb einer Stufe bleiben die
   Steine zusammen – die Stufe wechselt genau einmal je Gruppe.
2. **Sekundär (weich, Begründung):** Innerhalb einer Stufe Farbton aufsteigend, also von kühl nach
   warm bzw. von gesättigt nach neutral. Neutrale/helle Steine bilden Ruhepunkte – gebündelt
   (Krone: Selenit + Klarquarz) oder als Auslauf (Wurzel: Hematit → Obsidian → Turmalin).
   **Bewusst zulässig** sind dadurch Farbblöcke von vier bis fünf Steinen (Grün 10–13, Gelb/Warm
   18–22, Abdunklung 27–30): Das ist der ruhige Verlauf, den die Galerie zeigen soll, kein Fehler.
3. **Hart (geprüft):** Die Doppelmotive stehen **nicht** nebeneinander – `crys-02` (Rosenquarz) nicht
   neben `crys-21` (Milch-Rosenquarz), `crys-03` (Zitrin) nicht neben `crys-07` (Citrin); je ein
   anderer Stein liegt dazwischen. Erste Karte ist `crys-01` (Amethyst) als erkennbarer Einstieg.
4. Die Array-Reihenfolge **ist** die Anzeige-Reihenfolge (`renderGrid` rendert `this.filtered`
   unverändert). Filter und Suche ändern nur die Auswahl, nie die relative Ordnung.

Begründung: Der Katalog liest sich als Abstieg vom Licht ins Erdige – Amethyst/Selenit/Klarquarz
oben (erkennbare Einstiegssteine), Grün-und-Rosa-Block in der Mitte, Gelb/Orange, dann Rotbraun und
die dunklen Wurzelsteine als bewusster Auslauf. Das ist ein Verlauf, keine Sortierung nach Zufall
oder Alphabet.

### 5.2 Verbindliche Sequenz

| Pos | ID | Anzeigename | Chakra-Stufe |
|----:|----|-------------|--------------|
| 1 | `crys-01` | Amethyst | Krone |
| 2 | `crys-09` | Selenit | Krone |
| 3 | `crys-24` | Kristallquarz (Klare) | Krone |
| 4 | `crys-28` | Opal (Feueropal) | Krone |
| 5 | `crys-08` | Fluorit | Drittes Auge |
| 6 | `crys-05` | Lapis Lazuli | Drittes Auge |
| 7 | `crys-14` | Labradorit | Drittes Auge |
| 8 | `crys-18` | Celestit | Hals |
| 9 | `crys-29` | Aquamarin | Hals |
| 10 | `crys-11` | Aventurin (Grün) | Herz |
| 11 | `crys-06` | Malachit | Herz |
| 12 | `crys-20` | Smaragd | Herz |
| 13 | `crys-22` | Amazonit | Herz |
| 14 | `crys-26` | Kunzit | Herz |
| 15 | `crys-02` | Quarz (Rosenquarz) | Herz |
| 16 | `crys-17` | Moonstone (Mondstein) | Herz |
| 17 | `crys-21` | Rosenquarz (Milch) | Herz |
| 18 | `crys-25` | Peridot | Solarplexus |
| 19 | `crys-03` | Zitrin | Solarplexus |
| 20 | `crys-13` | Tigerauge | Solarplexus |
| 21 | `crys-07` | Citrin (Wille) | Solarplexus |
| 22 | `crys-16` | Bernstein | Solarplexus |
| 23 | `crys-12` | Karneol | Sakral |
| 24 | `crys-27` | Roter Jaspis | Wurzel |
| 25 | `crys-15` | Petrified Wood | Wurzel |
| 26 | `crys-30` | Rauchquarz | Wurzel |
| 27 | `crys-19` | Granat (Edelstein) | Wurzel |
| 28 | `crys-23` | Hematit | Wurzel |
| 29 | `crys-04` | Obsidian (Schwarzer Obsidian) | Wurzel |
| 30 | `crys-10` | Schwarzer Turmalin | Wurzel |

Hinweise zur Tabelle: `crys-02` und `crys-21` stehen bewusst **nicht** nebeneinander (Moonstone liegt
dazwischen), ebenso `crys-03` und `crys-07` (Tigerauge dazwischen) – sonst wirken die Doppelmotive wie
Dubletten. Der Schluss (Granat → Hematit → Obsidian → Turmalin) ist eine bewusste Abdunklung, kein
Sortierrest. Die Farbblöcke (Grün 10–13, Gelb/Warm 18–22) sind gewollt: sie erzeugen den ruhigen
Verlauf, den eine Materialtafel braucht.

### 5.3 Prüfung

`node docs/kristalle-gallery-spec/check-order.cjs [pfad]` – vergleicht `data/crystals.json` (oder eine
übergebene Kopie) mit der Sequenz aus §5.2 und prüft:

1. alle 30 IDs in genau dieser Reihenfolge,
2. Chakra-Stufe monoton fallend (Krone → Wurzel),
3. `crys-02`/`crys-21` und `crys-03`/`crys-07` nicht benachbart,
4. erste Karte ist `crys-01`.

Das Skript liegt im Repo und **schlägt auf dem heutigen Datenstand absichtlich fehl** (Ist-Reihenfolge
= Nummernfolge `crys-01…crys-30`). Gegen eine nach §5.2 sortierte Kopie wurde es geprüft:
`Reihenfolge konform: 30 Einträge, Chakra-Abstieg Krone -> Wurzel.` (Exit 0, 02.11.2026).

---

## 6. Raster, Breakpoints, Abstände

### 6.1 Gemessenes Ist (Produktivseite, `#crystalGrid`, `.grid-auto`)

| Viewport | Gutter | Spalten | Rasterbreite | Karte | **Bildplatte** |
|---:|---:|---:|---:|---:|---:|
| 360 | 24 | 1 | 312 | 312 | **310** |
| 390 | 24 | 1 | 342 | 342 | **340** |
| 480 | 24 | 1 | 432 | 432 | **430** |
| 631 | 24 | 1 | 583 | 583 | **581** ← größter Einspaltenfall |
| 640 | 24 | 2 | 592 | 284 | **282** |
| 700 | 24 | 2 | 652 | 314 | **312** |
| 768 | 32 | 2 | 704 | 340 | **338** |
| 900 | 32 | 2 | 836 | 406 | **404** |
| 1024 | 32 | 3 | 960 | 304 | **302** |
| 1280 | 64 | 3 | 1152 | 368 | **366** |
| 1440 | 64 | 4 | 1312 | 310 | **308** |
| 1920 | 64 | 4 | 1360 | 322 | **320** |

Das Raster selbst bleibt **unverändert** (`.grid-auto: repeat(auto-fill, minmax(min(100%, 280px), 1fr))`,
Lücke `--space-6` = 24 px, Gutter 24/32/64). Die Spec ändert nur, was *in* der Karte passiert –
plus eine Korrektur an der Platte (§7.1).

Die Tabelle ist **ohne reservierte Scrollbar** gemessen (Overlay-Scrollbar). Mit klassischer
15-px-Scrollbar wird der Inhalt um 15 px schmaler; bei 4 Spalten sinkt die Platte dann um 4 px
(gemessen 1440 px: 308 → 304), bei 3 Spalten um 5 px, bei 1 Spalte um 15 px. Für Abnahmeprüfungen
deshalb Toleranz **± 16 px** oder besser die Formel:

```
Platte = (min(Viewport, 1488) − 2 × Gutter − (Spalten − 1) × 24 − 2) / Spalten
```

**Einordnung der Spaltenumbrüche** (rechnerisch, deckt sich mit der Messung): 2 Spalten ab
Container ≥ 584 px (Viewport ≈ 632), 3 Spalten ab ≥ 888 px (Viewport ≈ 952 bei Gutter 32),
4 Spalten ab ≥ 1192 px (Viewport ≈ 1256 bei Gutter 64).

### 6.2 Abstände in der Karte (4-px-Raster, bestehende Tokens)

| Stelle | Wert |
|---|---|
| Platte → Nachweiszeile | `--space-2` (8 px) oben |
| Nachweiszeile → Trennlinie | `--space-3` (12 px) unten |
| Trennlinie → Karteninhalt | `--space-4` (16 px) (bestehendes `padding` in `.crystal-content`) |
| Karteninhalt intern | `--space-2` (8 px) (bestehend) |
| Kartenlücke im Raster | `--space-6` (24 px) (bestehend) |
| Nachweiszeile, reservierte Höhe | ≥ 632 px Viewport: `calc(3 * 1.4 * var(--text-xs) + var(--space-2) + var(--space-3))` = **75 px**; darunter: automatisch (38 px bei einer Zeile, bis 75 px bei drei) |

Die reservierte Höhe verhindert, dass Karten mit kurzem Nachweis gegenüber Karten mit langem um eine
Zeile springen; die Kartennamen stehen dadurch in einer Zeile auf gleicher Höhe. **Warum drei Zeilen
und nicht zwei:** Die echten Nachweise sind nicht kurz – `crys-01` lautet
„Foto: CopyrightFreePhotos CopyrightFreePhotos.HQ101.com · Public domain“ (73 Zeichen) und belegt bei
282 px Kartenbreite drei Zeilen. Mit einer Zwei-Zeilen-Reserve stand der Name dieser Karte 19 px tiefer
als der ihrer Nachbarn (im Prototyp gemessen: 56 px vs. 75 px). Unter 632 px steht nur eine Karte pro
Zeile, dort ist gleiche Höhe irrelevant und die Reserve entfällt – gemessen bei 360 px: 38–75 px,
kein Abschneiden.

---

## 7. Karte (Raster und Liste)

### 7.1 Markup (Grid) — ersetzt den `imgPart` in `js/modules/crystals.js:299-303`

```html
<article class="card crystal-card crystal-card-interactive" data-id="crys-01">
  <figure class="crystal-figure">
    <div class="crystal-image">
      <img class="crystal-photo"
           data-src="assets/crystals/640/amethyst.webp"
           data-srcset="assets/crystals/320/amethyst.webp 320w,
                        assets/crystals/640/amethyst.webp 640w,
                        assets/crystals/960/amethyst.webp 960w,
                        assets/crystals/1280/amethyst.webp 1280w"
           sizes="(min-width: 1256px) 330px, (min-width: 952px) 30vw,
                  (min-width: 632px) 51vw, (min-width: 380px) 94vw, 88vw"
           width="640" height="640" loading="lazy" decoding="async" alt="">
    </div>
    <figcaption class="crystal-credit">Foto: CopyrightFreePhotos CopyrightFreePhotos.HQ101.com
      &middot; Public domain</figcaption>
  </figure>
  <div class="crystal-content">
    <!-- unverändert: h2.crystal-name, Favoriten-Button, Chakra-Badges, Beschreibung,
         „Details anzeigen“, Formel/Härte-Zeile -->
  </div>
</article>
```

Regeln zum Markup:

- `<figure>`/`<figcaption>` sind **semantisch** der Bildnachweis; kein `<div class="caption">`.
- `width`/`height` = **640/640** (Verhältnis 1:1) → Browser reserviert die Höhe, kein Layout-Sprung.
  Die absolute Zahl ist nur das Verhältnis; die echte Auflösung liefert `srcset`.
- `alt=""` im Grid (E8) – der Kartenname steht als `<h2>` unmittelbar darunter.
- Der Nachweis ist **Text, kein Link** (E5). Damit enthält die klickbare Karte genau zwei Bedienelemente
  (Favorit, Details) – kein verschachteltes Linkziel, das den Kartenklick abfangen müsste.
- `data-src`/`data-srcset` + `sizes`: der bestehende `IntersectionObserver`
  (`js/modules/crystals.js:329-350`) muss **beides** promovieren, sonst bleibt `srcset` wirkungslos:

```js
const load = (img) => {
  img.src = img.dataset.src;
  if (img.dataset.srcset) img.srcset = img.dataset.srcset;
  img.removeAttribute('data-src');
  img.removeAttribute('data-srcset');
};
```

### 7.2 CSS — ersetzt `css/main.css:1032-1038` (`.crystal-image`)

```css
/* Bildplatte: quadratisch, Basaltgrund, ganze Silhouette (Spec §3/E1/E2) */
.crystal-figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--color-border);
}
.crystal-image {
  width: 100%;
  aspect-ratio: 1;
  background: var(--color-bg-deep);
  overflow: hidden;
  border-bottom: 0; /* Linie sitzt jetzt am figure-Element */
}
.crystal-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;      /* Sicherheitsnetz; produziert wird bereits 1:1 */
  object-position: center;
}
.crystal-credit {
  padding: var(--space-2) var(--space-4) var(--space-3);
  min-height: 0;
  font-size: var(--text-xs);      /* 13 px – kleinste zulässige Stufe */
  line-height: 1.4;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;        /* lange Urhebernamen brechen, statt überzulaufen */
}
/* Ab zwei Spalten: Nachweisblock auf drei Zeilen reservieren, damit die Kartennamen
   trotz langer Urhebernamen (crys-01: 73 Zeichen) auf gleicher Höhe stehen. */
@media (min-width: 632px) {
  .crystal-credit {
    min-height: calc(3 * 1.4 * var(--text-xs) + var(--space-2) + var(--space-3)); /* 75 px */
  }
}
```

Zusätzlich in `css/design-system.css:697-706` (Karten-Zustände):

```css
.crystal-card-interactive:hover,
.crystal-card-interactive:focus-within {
  border-color: var(--color-line-strong);
}
```

### 7.3 Zustände

| Zustand | Aussehen | Vorgabe |
|---|---|---|
| Standard | Karte `--color-bg-card`, 1 px `--color-border`; Platte `--color-bg-deep`; Nachweis 13 px Sekundärtext | Kontrast Nachweis/Karte **9,09:1** (gemessen) |
| Hover (Zeiger) | nur `border-color: --color-line-strong`; **kein** Lift, Schatten, Zoom, Filter | STYLEGUIDE §4; Zustand ist ohne Animation erkennbar |
| Tastaturfokus | Fokusring der Schaltfläche: 2 px `--color-primary`, 4 px Offset (global vorhanden); zusätzlich Karte `border-color: --color-line-strong` über `:focus-within` | gemessen: `rgb(198,179,142) solid 2px`, Offset `4px` |
| Nachweis | **immer sichtbar**, keine Hover-Einblendung, kein `line-clamp`/Ellipsis | Lizenzangabe darf nicht von Zeigegeräten abhängen |
| Laden | Platte zeigt `--color-bg-deep`; kein Skeleton, kein Shimmer | Platte ist selbst die ruhige Fläche |
| Fehler | `.crystal-image.is-missing` + Glyph (Emoji, entsättigt) + Nachweiszeile ersetzt durch „Bild nicht verfügbar“ | kein leerer Kasten (Audit §6.1) |
| Druck | Figur komplett ausblenden (Bild + Nachweis) | kein Nachweis ohne Bild |

Fehlerzustand konkret (Muster wie `js/modules/tarot.js:227-243`):

```js
img.addEventListener('error', () => {
  img.remove();
  plate.classList.add('is-missing');
  plate.insertAdjacentHTML('beforeend', `<span class="crystal-glyph" aria-hidden="true">${emoji}</span>`);
  credit.textContent = 'Bild nicht verfügbar';
}, { once: true });
```

### 7.4 Listenansicht

`.crystal-list` (bestehend, `css/main.css:1108-1123`, Mobil `:2406-2414`) behält die 120 × 120-Platte.
Der Nachweis wandert aus der Figur in die Textzeile, damit die 120-px-Zeile nicht umbricht:

```css
.crystal-list .crystal-figure {
  flex: 0 0 120px;
  border-bottom: 0;
  border-right: 1px solid var(--color-border);
}
.crystal-list .crystal-image { width: 120px; height: 120px; aspect-ratio: 1; }
.crystal-list .crystal-credit { display: none; }
.crystal-list .crystal-credit-inline {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
```

Markup-Ergänzung nur im Listen-Zweig (`js/modules/crystals.js:305-314`): dieselbe `figure`-Struktur wie
im Raster, aber ohne sichtbaren `figcaption`, dafür nach der Formelzeile
`<p class="crystal-credit-inline">Foto: … · CC BY-SA 4.0</p>`.

**Befund F1 (im Ist-Zustand):** Der Listen-Zweig rendert `<div class="crystal-thumb" style="flex:0 0 120px;
…">`; die vorhandenen Regeln `.crystal-list .crystal-image` (`css/main.css:1108-1123`, `:2406-2414`)
treffen ins Leere. Die Umsetzung vereinheitlicht auf `figure.crystal-figure > .crystal-image` und
entfernt die Inline-Styles – dann greifen die Listenregeln wieder, statt toter CSS zuzusehen.

### 7.5 Befunde am Ist-Zustand (Grundlage der Änderungen)

| # | Befund | Beleg | Wirkung |
|---|---|---|---|
| F1 | Listen-Styles zielen auf `.crystal-image`, gerendert wird `.crystal-thumb` | `js/modules/crystals.js:305-314` vs. `css/main.css:1108-1123` | Listenansicht ist nur über Inline-Styles gestylt |
| F2 | `object-fit: cover` auf quadratischer Platte | `css/main.css:1032-1038` | harter Beschnitt, widerspricht „keine Spitzen kappen“ |
| F3 | `alt=""` in Raster **und** Dialog | `js/modules/crystals.js:299-303`, `:401` | Dialogbild ohne Textalternative |
| F4 | kein `srcset`/`sizes`, feste `width/height=320` | ebd. | auf DPR-2-Displays unscharf, falsche Reservierung |
| F5 | Dialogbild nur 215 px breit | gemessen bei 1440: Modal 720, Spalte 215,3 | Foto wirkt wie ein Vorschaubild |
| F6 | Druck blendet `.crystal-image` aus, ein künftiger Nachweis bliebe stehen | `@media print`, `css/main.css` (`.crystal-image { display:none }`) | Nachweis ohne Bild im Ausdruck |
| F7 | Fokus-Rückgabe fehlt: `trigger = document.activeElement` ist beim Mausklick `body` | `js/dialog.js` `open()` | Tastaturnutzer landen nach dem Schließen im Nichts |

---

## 8. Detaildialog

### 8.1 Geometrie (gemessen im Prototyp)

| Größe | Ist (Produktion) | **Spec** |
|---|---:|---:|
| Modalbreite | 720 | **min(92vw, 880)** |
| Bildspalte | 215,3 | **336** |
| Textspalte | 430,7 | **470** |
| Bildplatte | 215 × 215 | **336 × 336** (1:1) |
| Nachweis | fehlt | 3 Zeilen, 13 px, 64 px hoch |

```css
/* css/main.css, Block Kristalle */
#crystalModal .modal { max-width: min(92vw, 880px); }
@container (min-width: 36rem) {
  .crystal-detail-layout { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); }
}
.crystal-detail-image img { object-fit: contain; }
.crystal-detail-credit {
  margin: var(--space-3) 0 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--text-xs);
  line-height: 1.55;
  color: var(--color-text-secondary);
}
.crystal-detail-credit a { color: var(--color-primary); } /* 8,42:1 auf Karte */
.crystal-detail-credit .credit-label { color: var(--color-text-primary); }
```

Unter 36 rem Containerbreite bleibt der Dialog einspaltig (gemessen bei 390 px: Bild 292 px, keine
Überläufe). Das Bild nutzt die Stufe **960** als einzelne `src` (672 px bei DPR 2 – gedeckt), kein
`srcset` im Dialog: ein Pfad, ein Fehlerfall, ein Caching-Eintrag.

### 8.2 Markup — ersetzt den Bildteil in `js/modules/crystals.js:399-404`

```html
<div class="crystal-detail-layout">
  <figure class="crystal-detail-figure">
    <div class="crystal-detail-image">
      <img src="assets/crystals/960/amethyst.webp" width="960" height="960" decoding="async"
           alt="Amethyst — violette Rohstufe vor dunklem Grund, vollständig im Bild,
                Spitzen und Bruchflächen sichtbar">
    </div>
    <figcaption class="crystal-detail-credit">
      <span class="credit-line"><span class="credit-label">Foto:</span> CopyrightFreePhotos
        CopyrightFreePhotos.HQ101.com &middot;
        <a href="https://commons.wikimedia.org/wiki/Template:PD-self" rel="noopener">Public domain (PD-self)</a></span>
      <span class="credit-line"><a href="https://commons.wikimedia.org/wiki/File:Amethyst_Quartz_Crystals.jpg">Quelle: Wikimedia Commons</a>
        &middot; abgerufen 02.11.2026</span>
      <span class="credit-line credit-meta">Änderungen: 1:1-Leinwand mit Rand, Hintergrund vereinheitlicht, Skalierung</span>
    </figcaption>
  </figure>
  <div><!-- bestehender Textblock: Name, Badges, Formel, Härte, Wirkung, Beschreibung, Verwandte --></div>
</div>
```

- Die **Honesty-Notiz** „Platzhalter-Symbol · kein Foto im Projekt“ bleibt stehen, solange kein Bild
  existiert (Audit §5.3). Sie verschwindet automatisch mit dem Bild.
- Drei Blöcke statt einer Zeile: Urheber + Lizenz, Quelle + Abrufdatum, Änderungen (2–5 Zeilen je nach Namenslänge). Ein Fließtext mit vier
  `·`-Trennern war bei 336 px nachweislich unruhig (4 Zeilen, Umbruch mitten in der Lizenz).
- **Lizenzkürzel statt Volltext** in Zeile 1 (`CC BY-SA 3.0`, `CC0 1.0`, `Public domain (PD-self)`) und
  als Link auf `license.url`. Der vollständige Lizenzname steht in Ebene 3 – sonst bricht der
  Dialognachweis bei langen Namen wie „Creative Commons Namensnennung – Weitergabe unter gleichen
  Bedingungen 3.0“ auf fünf Zeilen.
- **Worst Case ist dokumentiert, nicht weggekürzt:** Bei sehr langen Urhebernamen (`crys-01`:
  „CopyrightFreePhotos CopyrightFreePhotos.HQ101.com“, 51 Zeichen) belegt der Nachweis unter dem
  336-px-Bild bis zu **5 Zeilen / 105 px** (gemessen). Das ist die Obergrenze; Kürzen von Urheber oder
  Lizenz ist keine Option, weil beide vollständig bleiben müssen. Bei den übrigen 29 Motiven sind es
  3–4 Zeilen (kurze Lizenzkürzel, kürzere Urhebernamen).

### 8.3 Fokusführung

Bestehendes `js/dialog.js` bleibt zuständig: `inert` auf allen Geschwistern, Tab-Falle, `Escape`,
`focusInitial()` → Schließen-Knopf. Ergänzungen:

1. **Fokus-Rückgabe an den Auslöser** (E11): `openCrystalModal(id, triggerEl)` speichert die
   auslösende Schaltfläche, `closeCrystalModal` fokussiert sie danach. Heute ist `trigger` bei
   Mausklick `body`; nach dem Schließen steht der Fokus dann nirgends.
2. Beim Öffnen per Karte (Klick auf die Fläche, nicht auf die Schaltfläche) wird die
   `crystal-details-btn` derselben Karte als Trigger übergeben.
3. Kein neues `tabindex` auf `<article>` (E9).

---

## 9. Bildnachweis, Alt-Texte, Datenmodell

### 9.1 Drei Ebenen

| Ebene | Ort | Inhalt | Sichtbarkeit |
|---|---|---|---|
| **1 · Karte** | `figcaption.crystal-credit` unter der Platte, 13 px | **exakt** `attribution_text_short` aus `docs/kristalle/image-sources.json` (Form „Foto: <Urheber> · <Lizenz>“) | immer, ohne Hover, ohne Link |
| **2 · Dialog** | `figcaption.crystal-detail-credit`, 13 px, 3 Blöcke (2–5 Zeilen) | Urheber + Lizenz (Lizenz-URL verlinkt) · Quelle (Dateiseite verlinkt) + Abrufdatum · Änderungen | beim Öffnen |
| **3 · Sammelnachweis** | `impressum.html#kristalle-fotos` (Muster: `impressum.html:80-138`) und `docs/kristalle/QUELLEN-RECHTS-MANIFEST.md` | je Bild: `attribution_text_required` wörtlich, Quelle/Abrufdatum, Lizenz + Lizenz-URL, Änderungen, Lizenz der bearbeiteten Fassung (bei `share_alike: true`), SHA-256 | dauerhaft verlinkt |

Ebene 1 ist eine Nachweiszeile im Sinne von „angemessene Namensnennung“ (TASL: Titel = Kartenname,
Urheber, Lizenz); Ebene 2 liefert Quell-URL, Lizenz-URL, Abrufdatum und Änderungen; Ebene 3 ist die
dauerhafte, verlinkbare Dokumentation. **Grenze:** Eine rein juristische Bewertung, ob die
13-px-Zeile auf der Karte für CC BY 4.0 ausreicht, ist hier nicht geleistet (Abschnitt 12); die
Architektur ist so gewählt, dass ein strengerer Nachweis durch *eine* zusätzliche Zeile in Ebene 1
erreichbar bleibt, ohne das Layout zu ändern (reservierte Höhe = 2 Zeilen).

**Lizenzklassen und ihre Folge für die Anzeige** (Zahlen aus dem Recherche-Manifest):

| Klasse | Anzahl | Ebene 1 | Ebene 2/3 |
|---|---:|---|---|
| Public Domain (PD-self) | 6 | Quelle wird aus Projektstandard genannt (`· Public domain`), rechtlich nicht gefordert | vollständiger Nachweis, Lizenz-URL = Commons-Template |
| CC0 1.0 | 12 | `· CC0` | Lizenz-URL `creativecommons.org/publicdomain/zero/1.0/` |
| CC BY 2.0/3.0/4.0 | 6 | Urheber + Lizenzkürzel | Lizenz-URL **und** Quell-URL Pflicht |
| CC BY-SA 2.5/3.0/4.0 | 6 (davon 6 share-alike) | Urheber + Lizenzkürzel | zusätzlich Lizenz der bearbeiteten Fassung ausweisen |

Konsequenz für die Umsetzung: Die Karte zeigt **immer** eine Zeile (auch bei PD/CC0), damit das Raster
gleichmäßig bleibt und die Herkunft nicht von der Lizenzklasse abhängt. Die Zeile ist bei PD/CC0 eine
Projektentscheidung zur Nachvollziehbarkeit, keine Lizenzpflicht – das ist im Impressum so zu
kennzeichnen.

### 9.2 Fußzeile der Sektion

Unter dem Raster, 1 px oberhalb (`--color-border`), 14 px Sekundärtext:

> Fotografien: Wikimedia Commons — Urheber und Lizenz je Bild unter der Karte ·
> [Alle Bildnachweise und Lizenzen](impressum.html#kristalle-fotos) ·
> Änderungen: quadratischer Zuschnitt, Skalierung auf 320/640/960/1280 px, Weißabgleich vereinheitlicht.

Damit ist der Sammelnachweis von der Galerie aus in einem Klick erreichbar, ohne dass im Footer aller
Seiten ein neuer Link nötig wird (Audit §8, Punkt 5).

### 9.3 Alt-Text-Stil

| Feld | Regel | Beispiel |
|---|---|---|
| Grid/Liste | `alt=""` (E8) | — |
| Dialog (`image_alt`) | Deutsch, ein Satz, ≤ 150 Zeichen, Muster: **Name — Motivtyp vor Grund, Vollständigkeit, zwei sichtbare Materialmerkmale** | „Amethyst — violette Rohstufe vor dunklem Grund, vollständig im Bild, Spitzen und Bruchflächen sichtbar“ |
| Verboten | „Bild von …“, Lizenz/Urheber im Alt, Werbewörter („wunderschön“, „kraftvoll“), erfundene Details (Fundort, Größe, Gewicht) | — |
| Pflicht | Motivtyp (Rohstufe/geschliffen/Trommelstein) muss im Alt stehen, wenn er nicht im Namen steckt | „Citrin — geschliffene Facette …“ vs. „Citrin — Rohstufe mit Matrix …“ |

Begründung `alt=""` im Grid: der Kartenname ist unmittelbar adjacent (`<h2>`), die Karte ist eine
Liste von 30 benannten Objekten; ein zweiter Name pro Kachel verdoppelt die Vorleselänge ohne
Informationsgewinn. Der informationshaltige Teil (Motivtyp) wird im Dialog gesprochen und ist dort
verlinkt erreichbar. Diese Entscheidung ist bewusst und nicht stillschweigend: sie folgt der
Tarot-Konvention (`alt=""` im Raster, sprechendes Alt im Detail, `tests/tarot-deck.cjs:179,210`).

### 9.4 Datenmodell in `data/crystals.json`

Die Felder werden **aus dem Manifest abgeleitet**, nicht frei erfunden:

| Feld in `data/crystals.json` | Quelle |
|---|---|
| `image` | `assets/crystals/640/<slug>.webp` (Standardpfad für Nicht-`srcset`-Fälle) |
| `image_stem`, `image_file` | `assets/crystals` + `<slug>.webp` (Modul baut die vier Stufen) |
| `image_alt` | `credit.alt` im ausgelieferten Manifest (aus `visual_note` + Motivtyp formuliert) |
| `image_credit.author` | `author` des gewählten Kandidaten |
| `image_credit.license` / `license_url` | `license.name` (Kurzform) / `license.url` |
| `image_credit.source_url` | `source.page_url` |
| `image_credit.retrieved` | `retrieved_at` |
| `image_credit.changes` | bei uns erzeugt: „1:1-Leinwand mit Rand, Hintergrund vereinheitlicht, Skalierung“ + ggf. „Weißabgleich“ |
| `attribution_text_short` / `required` | wörtlich aus `docs/kristalle/image-sources.json` (dort bereits gepflegt) |

```json
{
  "id": "crys-01",
  "name": "Amethyst",
  "image": "assets/crystals/640/amethyst.webp",
  "image_stem": "assets/crystals",
  "image_file": "amethyst.webp",
  "image_alt": "Amethyst — violette Rohstufe vor dunklem Grund, vollständig im Bild, Spitzen und Bruchflächen sichtbar",
  "image_credit": {
    "author": "CopyrightFreePhotos CopyrightFreePhotos.HQ101.com",
    "source_label": "Wikimedia Commons",
    "source_url": "https://commons.wikimedia.org/wiki/File:Amethyst_Quartz_Crystals.jpg",
    "license": "Public domain (PD-self)",
    "license_url": "https://commons.wikimedia.org/wiki/Template:PD-self",
    "share_alike": false,
    "retrieved": "2026-11-02",
    "changes": "1:1-Leinwand mit Rand, Hintergrund vereinheitlicht, Skalierung"
  }
}
```

- `image` bleibt als Feld erhalten, weil `normalize()` (`js/modules/crystals.js:53-65`) genau darauf
  prüft (`startsWith('assets/')`). Es zeigt auf die 640er-Stufe als Standard.
- `image_stem` + `image_file` bauen die vier `srcset`-Pfade im Modul zusammen – keine vier
  Pfadstrings je Datensatz.
- `image_placeholder` erst löschen, wenn alle 30 Bilder liegen (Audit §10.1).
- Doppelpflege vermeiden: `image_credit` und `image_alt` werden beim Integrationsschritt **generiert**
  (kleines Skript aus `image-sources.json` + Manifest), nicht per Hand getippt. Damit können
  Daten und Bildpaket nicht auseinanderlaufen (Prüfkriterium A9).

---

## 10. Messbare Abnahmekriterien

Alle Prüfungen sind automatisierbar (Playwright/JSDOM + `node`), sofern nicht anders vermerkt.
„Ist“ = heute gemessen, „Soll“ = nach Umsetzung.

### 10.1 Inhalt und Struktur

| # | Kriterium | Prüfmethode | Soll |
|---|---|---|---|
| A1 | Jede Karte hat ein Bild | `#crystalGrid img.crystal-photo` | 30, `.crystal-glyph` im Raster 0 |
| A2 | `srcset` mit vier Stufen, `sizes` gesetzt | je `img`: `srcset.split(',').length === 4`, Stufen 320/640/960/1280, `sizes` nicht leer | 30/30 |
| A3 | Intrinsisches Verhältnis 1:1 | `img.width === img.height` (Attribute) | 30/30 |
| A4 | Platte quadratisch | `plate.width / plate.height` bei 360/640/1024/1440 | 1,00 ± 0,005 |
| A5 | Kein Beschnitt | `getComputedStyle(img).objectFit` | `contain` |
| A6 | Nachweiszeile je Karte | `.crystal-figure figcaption.crystal-credit` | 30, Text **exakt** gleich `attribution_text_short` des jeweiligen Kristalls in `docs/kristalle/image-sources.json` |
| A7 | Dialognachweis vollständig | im offenen Dialog: Autor, Lizenz-Link (`license.url`), Quell-Link (`source.page_url`), `abgerufen`, `Änderungen` | alle fünf vorhanden, Links == Manifest-URLs |
| A8 | Sammelnachweis existiert | `impressum.html#kristalle-fotos` enthält 30 Einträge mit Urheber + Lizenz + Lizenz-URL | vorhanden, 30 |
| A9 | Manifest vollständig und konsistent | `assets/crystals/manifest.json`: 30 Bilder × 4 Stufen, `bytes` + `sha256` je Datei; `source_sha256` == `sha256` der jeweiligen `w1280`-Rendition in `image-sources.json` | 120 Dateien, 0 fehlend, 30/30 Hash-Treffer |
| A10 | Alt-Stil | `image_alt` matcht Muster „Name — … vollständig im Bild …“ | 30/30, keine „Bild von“-Formel |
| A25 | Reihenfolge | `node docs/kristalle-gallery-spec/check-order.cjs` | Exit 0 (Sequenz, Stufenabstieg, Doppelmotive nicht benachbart, Einstieg `crys-01`) |
| A26 | Doppelmotive unterscheidbar | Sichtprüfung der vier Dateien (`crys-02`, `crys-21`, `crys-03`, `crys-07`): Motivtyp und Silhouette unterschiedlich, keine gemeinsame Aufnahmeserie | erfüllt |

### 10.2 Layout und Responsive

| # | Kriterium | Prüfmethode | Soll |
|---|---|---|---|
| A11 | Bildplatte entspricht §6.1 | `getBoundingClientRect()` der Platte bei 360/480/640/768/1024/1280/1440/1920, jeweils **frisch geladen** | 310/430/282/338/302/366/308/320 **± 16 px** (Scrollbar) oder Formel aus §6.1 |
| A12 | Kein horizontaler Überlauf | `documentElement.scrollWidth − clientWidth` bei 320/360/390/480/640/768/1024/1440/1920 | 0 |
| A13 | Kein Layout-Sprung beim Nachladen | CLS aus PerformanceObserver beim Scrollen durch das Raster | < 0,02 |
| A14 | Nachweiszeile höhenstabil | `figcaption`-Höhe bei ≥ 632 px; erste Rasterzeile: alle `h2`-Oberkanten auf gleicher y-Position | 75 px ± 1, `new Set(rowY).size === 1`; unter 632 px ≤ 75 px, kein Abschneiden |
| A15 | Dialogbild groß genug | Bildplatte im Dialog bei 1440 | ≥ 300 px (Soll 336) |
| A16 | Dialog einspaltig auf Mobil | bei 390 px: `grid-template-columns: 1 Spalte`, Bild ≤ 342 px | erfüllt, kein Überlauf |
| A17 | Druck | `page.pdf()` / `emulateMedia({media:'print'})`: kein `figcaption.crystal-credit`, keine Platte | 0 sichtbar |

### 10.3 Barrierefreiheit

| # | Kriterium | Prüfmethode | Soll |
|---|---|---|---|
| A18 | Tastatur erreicht Detailansicht | Tab bis `crystal-details-btn`, `Enter` | Dialog offen |
| A19 | Fokusring sichtbar | `getComputedStyle(activeElement)` im Tastaturfokus | `2px solid #c6b38e`, Offset `4px` |
| A20 | Karte zeigt Fokuskontext | `card.matches(':focus-within')` + `borderColor` | `rgb(130,146,142)` |
| A21 | Escape schließt, Fokus kehrt zurück | Escape, danach `document.activeElement` | auslösende Schaltfläche |
| A22 | Touch-Ziele | Höhe von Favorit-, Detail-, Schließen-Schaltfläche | ≥ 44 px |
| A23 | Kontrast Nachweis/Links | berechnet nach WCAG 2.2 | ≥ 4,5:1 (Ist 9,09 bzw. 8,42) |
| A24 | Fehlerzustand sichtbar | `src` auf fehlende Datei setzen | `is-missing` + „Bild nicht verfügbar“, keine leere Fläche |

### 10.4 Technik und Budget

| # | Kriterium | Prüfmethode | Soll |
|---|---|---|---|
| A27 | Build | `npm run build` (Seiten + Offline) | Exit 0 |
| A28 | Offline-Test | `node --test tests/offline-file.cjs` | bestanden, keine `requestfailed`-Einträge für Kristallbilder |
| A29 | Lint/Format | `npm run lint`, `npm run format:check` | unverändert grün |
| A30 | Kein `url()` in CSS | `scripts/build-local.cjs`-Guard (wirft bei Bild-`url()`) + `grep -r "url(.*crystals" css/` | 0 Treffer |
| A31 | Lazy Loading wirkt | Netzwerk-Log nach Erstaufbau: nur sichtbare Bilder geladen | ≤ 8 Requests |
| A32 | Dateibudget | Summe `bytes` je Stufe im Manifest / 30 | 320 ≤ 25 KB, 640 ≤ 60 KB, 960 ≤ 110 KB, 1280 ≤ 180 KB |

---

## 11. Umsetzungsschritte für `t_12a8db50`

Reihenfolge so gewählt, dass nach jedem Schritt ein prüfbarer Zustand existiert.

1. **Bilder + Manifest** (nach `t_75514188`): 30 Motive × 4 Stufen nach §3/§4, `manifest.json` schreiben.
2. **Daten**: `image`, `image_stem`, `image_file`, `image_alt`, `image_credit` in `data/crystals.json`
   ergänzen; Array in die Sequenz aus §5.2 umsortieren; `image_placeholder` erst danach entfernen.
3. **CSS**: §7.2 (Karte) und §8.1 (Dialog) in `css/main.css` einsetzen; `:focus-within` in
   `css/design-system.css` ergänzen; Druckregel auf `.crystal-figure` erweitern.
4. **Markup** in `js/modules/crystals.js`: `imgPart` (§7.1), Observer-Promotion von `srcset`,
   Listen-Zweig (§7.4), Dialog-Figur (§8.2), Fehler-Handler (§7.3), Trigger-Übergabe (§8.3).
5. **Nachweise**: `impressum.html#kristalle-fotos` (Ebene 3), `docs/kristalle/QUELLEN-RECHTS-MANIFEST.md`,
   Fußzeile der Sektion (§9.2).
6. **Prüfen**: A1–A32; Messungen immer mit frisch geladenem Dokument (Messregel §0).
7. **Nicht anfassen**: `js/data/crystals.js` (toter Code), `public/` (Legacy), `<base href>`.

Risiken und Gegenmittel:

| Risiko | Gegenmittel |
|---|---|
| `sizes` passt nicht mehr, wenn `.grid-auto` oder `--gutter` geändert werden | §6.1 neu messen und `sizes` neu ableiten (Formel in A11); `sizes` bewusst großzügig, nie knapp |
| Nachweiszeile wird auf schmalen Karten 3-zeilig | zulässig; reservierte Höhe gilt erst ab 632 px, darunter frei wachsen |
| Lange Urhebernamen sprengen die Karte | `overflow-wrap: anywhere`, keine Ellipse; ggf. im Manifest eine zulässige Kurzform dokumentieren |
| CC-BY-SA-ShareAlike auf bearbeitete Fassungen | Änderungen im Nachweis benennen, Lizenz der bearbeiteten Fassung in Ebene 3 ausweisen (Muster `impressum.html:106-110`) |
| Tests hängen an altem Markup (`img`-Inline-Style, `alt=""`) | vor Schritt 3 `npm test` laufen lassen; `tests/local-entry.cjs:57` klickt die erste Karte und erwartet den Dialog – Figur ändert daran nichts |

---

## 12. Grenzen dieser Arbeit (nicht stillschweigend als erledigt ausgeben)

1. **Kein echtes Foto bewertet.** Der Prototyp nutzt Mock-Vektoren. Belegt sind Geometrie, Abstände,
   Kontraste, Fokus, Umbruch und Reihenfolge – **nicht** die Wirkung echter Fotos (Lichtstimmung,
   Hintergrundangleich, Motivlesbarkeit).
2. **Keine Screenreader-Prüfung.** Tastatur und Fokus wurden in Chromium geprüft; NVDA/VoiceOver,
   Vorlesereihenfolge und `alt`-Erfahrung sind offen.
3. **Kontraste rechnerisch**, nicht per Pixel-Stichprobe aus dem Screenshot.
4. **Druck** nur aus den CSS-Regeln abgeleitet, keine PDF-Ausgabe erzeugt.
5. **Lizenz- und Rechtsprüfung** der konkreten Bilder ist nicht Teil dieser Karte; Ebene 1 (13-px-Zeile)
   ist bewusst so gebaut, dass eine strengere Auslegung ohne Layoutänderung nachrüstbar ist.
6. **Reihenfolge** ist eine Designentscheidung, keine Messung; die Chakra-Stufen stammen aus den
   Datenstrings und sind inhaltlich nicht validiert.
7. **`sizes`-Werte** gelten für den heutigen Rastervertrag; jede Änderung an `.grid-auto`, `--gutter`
   oder Karten-Padding entwertet sie.
8. **Recherche-Manifest ist bewegt.** `docs/kristalle/image-sources.json` entstand parallel in
   `t_75514188` und kann sich noch ändern (Kandidaten, Texte). Diese Spec bindet sich an dessen
   *Schema* (`attribution_text_short`, `license.url`, `source.page_url`, `square_crop`), nicht an
   einzelne Inhalte; die Beispielwerte für `crys-01` sind der Stand vom 02.11.2026.
9. **Keine Aussage über Bildqualität oder Lizenzrichtigkeit** der Kandidaten – das ist Gegenstand von
   `t_75514188` und der Rechtsprüfung.

---

## 13. Anhang

### 13.1 Dateien dieses Arbeitspakets

| Datei | Zweck |
|---|---|
| `docs/kristalle-gallery-spec.md` | diese Spezifikation |
| `docs/kristalle-gallery-spec/prototype.html` | interaktiver Prototyp (30 Karten, Umschalter `contain`/`cover` und Reihenfolge) |
| `docs/kristalle-gallery-spec/prototype-dialog.html` | statische Dialogansicht (Screenshot-fähig) |
| `docs/kristalle-gallery-spec/check-order.cjs` | Prüfskript für §5.2/A25 |
| `docs/kristalle-gallery-spec/evidence/measurements.json` | alle Messwerte, Kontraste, Stufenrechnung |
| `docs/kristalle-gallery-spec/evidence/order-candidates.json` | Reihenfolge-Kandidat, Stufen, Kriterien |
| `docs/kristalle-gallery-spec/evidence/*.png` | Screenshots (§13.2) |

Prototyp öffnen: `python -m http.server 8102` im Repo-Root, dann
`http://127.0.0.1:8102/docs/kristalle-gallery-spec/prototype.html`. Die Seite ist nicht Teil des
Builds (`scripts/build-pages.cjs` kopiert nur `assets/`, `css/`, `js/`, `data/`), `npm run format:check`
lässt `docs/` aus (`.prettierignore`).

### 13.2 Belege

| Screenshot | Zeigt |
|---|---|
| `evidence/prototype-grid-1440.png` | Raster 1440: 4 Spalten, 308-px-Platten, einzeiliger Nachweis |
| `evidence/prototype-grid-390.png` | Raster 390: 1 Spalte, 340-px-Platte, zweizeiliger Nachweis, kein Überlauf |
| `evidence/prototype-dialog-1440.png` | Dialog 880 px, Bildspalte 336 px, dreizeiliger Nachweis |
| `evidence/prototype-dialog-390.png` | Dialog gestapelt, Bild 292 px |
| `evidence/prototype-focus-1440.png` | Tastaturfokus: 2 px Sand, 4 px Offset, Karte mit `line-strong` |
| `evidence/prototype-cover-crop-1440.png` | Gegenprobe `cover`: Motiv wird beschnitten (Basis abgeschnitten) |
| `evidence/live-ist-1440.png` | Ist-Zustand der Produktivseite: 30 Karten, 30 Glyphen, 0 Bilder |

### 13.3 Kurzfassung für die Umsetzung (eine Seite)

- Platte **1:1**, Bild **1:1** mit ≥ 6 % Rand auf `#0b1012`, `object-fit: contain`, keine Filter.
- **WebP 320/640/960/1280**, `srcset` + `sizes` (`(min-width:1256px) 330px, (min-width:952px) 30vw,
  (min-width:632px) 51vw, (min-width:380px) 94vw, 88vw`), `width/height=640`, `loading="lazy"`.
- **Nachweis**: Karte `Foto: Autor · Lizenz` (13 px, immer sichtbar, kein Link); Dialog drei Blöcke mit
  Lizenz-/Quell-Link, Abrufdatum, Änderungen; Impressum `#kristalle-fotos` + Manifest als Sammelnachweis.
- **Reihenfolge**: Chakra-Abstieg Krone → Wurzel gemäß §5.2, per `check-order.cjs` geprüft.
- **Tastatur**: Karte bleibt `article`, Pfad ist „Details anzeigen“; Fokusring 2/4 px Sand;
  Fokus kehrt nach dem Schließen zur auslösenden Schaltfläche zurück.
- **Nicht**: Cover-Beschnitt, CSS-Filter, Hover-Zoom, Lightbox, `tabindex` auf der Karte.
