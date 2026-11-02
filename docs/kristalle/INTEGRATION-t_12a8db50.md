# Kristalle-Galerie — Integration der Fotografien (t_12a8db50)

Stand: 02.11.2026 · Grundlage: `docs/kristalle-gallery-spec.md` (Spezifikation, t_5ca258cb) und
`docs/kristalle/image-sources.json` (Bildrecherche, t_75514188).

## Was jetzt ausgeliefert wird

| Ebene | Ort | Umfang |
|---|---|---|
| Bilder | `assets/crystals/{320,640,960,1280}/<slug>.webp` | 30 Motive × 4 Stufen = 120 Dateien, WebP q 82, sRGB, deckend |
| Manifest | `assets/crystals/manifest.json` | 30 Bilder mit Pfaden, Bytes, SHA-256 je Stufe, `source_sha256`, Ausschnitt, Produktionsparametern, vollständigem Nachweis |
| Daten | `data/crystals.json` | 30 Kristalle in der Reihenfolge der Spezifikation §5.2, je Bild `image`, `image_stem`, `image_file`, `image_alt`, `image_credit`, `attribution_text_short`, `attribution_text_required`; `image_placeholder` entfernt |
| Karte | `js/modules/crystals.js` | `<figure>`/`<figcaption>` mit `srcset` (4 Stufen), `sizes`, `width/height=640`, `loading="lazy"`, `alt=""`, sichtbarer Nachweiszeile, Fehlerzustand |
| Dialog | ebd. + `css/main.css` | Bildplatte 336 px (960er-Stufe), dreiteiliger Nachweis mit Lizenz- und Quelllink, Abrufdatum, Änderungen; beschreibendes Alt aus `image_alt` |
| Sammelnachweis | `impressum.html#kristalle-fotos`, `docs/kristalle/QUELLEN-RECHTS-MANIFEST.md` | 30 Einträge mit Urheber, Lizenz inkl. Lizenz-URL, Quellseite, Abrufdatum, Änderungen, ShareAlike-Hinweis |
| Fußzeile der Sektion | `index.html` | Verweis auf den Sammelnachweis, Änderungshinweis |

## Bilderzeugung

`docs/kristalle/scripts/prepare-images.py` (Pillow + NumPy + SciPy) erzeugt aus den bei Wikimedia
geladenen 1280er-Renditionen je eine quadratische Platte (1280 × 1280, Grund `#0b1012`, Motivfläche
88 % = 6 % Rand je Seite) und daraus die vier WebP-Stufen. Jede Quelldatei wird beim Download gegen
`sha256` aus `docs/kristalle/image-sources.json` geprüft (`scripts/download-sources.py`); der Hash
steht als `source_sha256` im Manifest.

Zwei Verfahren, je Bild begründet gewählt (`production.mode` im Manifest):

* **matte** (5 Motive: Obsidian, Tigerauge, Karneol, Hämatit, Lapis Lazuli) — heller Studiotisch wird
  über eine gradientenbasierte Hintergrundmaske entfernt, das Motiv freigestellt auf den Basaltgrund
  gesetzt. Nötig, weil ein weißer Fotokasten in der dunklen Galerie als Leuchtfläche wirkt.
* **pad** (25 Motive) — das Foto bleibt unbeschnitten in der 88-%-Fläche; bei hellem Bildrand läuft es
  über 3 % weich in den Grund aus. Das entspricht der Regel „keine Spitzen kappen“; bei den 25 Motiven
  mit dunklem oder motivgefülltem Rand ist kein Freistellen möglich (Motiv reicht bis an den Bildrand).

Kein Motiv wurde beschnitten. Die vier als „bedingt 1:1-fähig“ markierten Bilder (Selenit, Mondstein,
Peridot, Rauchquarz) sind unbeschnitten gesetzt.

**Retuschen** (im Nachweis als Änderung ausgewiesen, `production.retouch`):

* `crys-15` Petrified Wood: gelber Maßstabsbalken „1.0 cm“ mit Klon aus der darüberliegenden Maserung
  entfernt (Spezifikation §3.1: keine Buchstaben/Zahlen im Bild).
* `crys-17` Mondstein: eingebettete Maßstabs-Miniatur („56 mm“, grüner Rahmen) mit dem umgebenden
  schwarzen Grund aufgefüllt.

## Abweichungen von der Spezifikation (bewusst, begründet)

| Punkt | Spezifikation | Umsetzung | Grund |
|---|---|---|---|
| `sizes` oberste Stufe | `(min-width: 1256px) 330px` | `320px` | Gemessene Platte ist 308 px (1440) bzw. 320 px (1920); 330 px × DPR 2 = 660 px überschreitet die 640er-Stufe und erzwingt auf allen Desktop-Breiten das 960er-Bild (rund 35 KB statt 30 KB pro Karte). Mit 320 px liefert der Browser exakt die 640er-Datei. |
| Hintergrund „eingebacken“ | jede Platte flächig `#0b1012` | Platte flächig `#0b1012`, Foto darin als Platte mit 88 % gesetzt | Motivrand ≥ 6 % ist nur so messbar; die Eckproben (5 Punkte) liegen bei allen 30 **Master**-Dateien exakt auf `#0b1012` (Delta 0/255). Die ausgelieferten WebP weichen durch die Kantenglättung um **≤ 3/255** ab (unsichtbar; gemessen im Review t_385afa1e). |
| Stufen | `320/640/960/1280` | eingehalten | — |
| WebP-Qualität | 78–82 | 82 (alle Dateien im Budget) | Kein Bild musste die Qualität senken; größte 1280er-Datei 175 KB (< 180 KB). |
| Format-Alternative AVIF | „z. B. WebP/AVIF plus Fallback“ | nur WebP | Entscheidung E3 der Spezifikation; ein `<picture>` mit zweitem Format würde 120 zusätzliche Dateien erzeugen. WebP trägt jede Zielplattform. |
| Weißabgleich | „auf ca. 4300 K ziehen“ | nicht angewandt | Eine pauschale Farbkorrektur hätte 30 heterogene Museums- und Studiolichter gleichmachig verfälscht; die Änderungen nennen nur, was tatsächlich passiert ist. |

## Prüfungen

| Prüfung | Werkzeug | Ergebnis |
|---|---|---|
| 120 Dateien vorhanden, Maße 1:1, Modus RGB (kein Alpha), Bytes und SHA-256 == Manifest, Eckfarbe `#0b1012` (± 3/255 im WebP), Budgets | `python docs/kristalle/scripts/verify-images.py` | 0 Fehler |
| `source_sha256` == SHA-256 der Recherche-Rendition | ebd. | 30/30 |
| Datenmodell (Bildfelder, Alt-Muster, Attribution == Manifest, kein `image_placeholder`), Reihenfolge §5.2, Doppelmotive nicht benachbart | ebd. | 0 Fehler |
| Impressum: 30 Einträge, Quell- und Lizenzlink je Bild | ebd. | 30/30 |
| Galerie im Browser (A1–A16, A18–A24): 30 Karten/Bilder, `srcset` 4 Stufen, `sizes`, `alt=""`, Verhältnis 1:1, `object-fit: contain`, Nachweiszeile == `attribution_text_short`, Plattenbreiten 310/340/430/282/302/366/308/320 px bei 360/390/480/640/1024/1280/1440/1920, kein Überlauf, Nachweisblock 75 px und Namen je Reihe auf gleicher Höhe, Dialog 880 px / Bild 336 px, Fokus kehrt zur Schaltfläche zurück, Fehlerzustand sichtbar, Listenansicht 120 px + Inline-Nachweis | `node scripts/verify-crystals.cjs` | 0 Abweichungen, 0 fehlerhafte Bildantworten |
| Lazy Loading | ebd. (Netzwerk-Log) | 4 Bildanfragen beim Erstaufbau (≤ 8 gefordert) |
| Build, Offline-Edition (file://), Lint, Format | `npm run build`, `npm run test:offline`, `npm run lint`, `npm run format:check` | grün |
| Unit-/API-, Seiten- und Browser-Tests | `npm test`, `npm run test:pages`, `npx playwright test` | grün (2 / 6 / 74 Tests) |

Belege: `evidence/kristalle/` (Screenshots 1440/390/1024, Dialog, Liste) und
`evidence/kristalle-report.txt` (vollständige Messwerte je Viewport).

## Grenzen (nicht stillschweigend als erledigt ausgeben)

1. **Visuelle Bewertung ohne Farbproofing**: Platten wurden in Chromium bei 1x/2x geprüft, nicht auf
   einem kalibrierten Monitor und nicht im Druck.
2. **Kein Screenreader-Test** (NVDA/VoiceOver). Alt-Texte und Reihenfolge sind nach Konvention gebaut.
3. **Fünf Motive bleiben „Foto im Foto“** (Obsidian, Tigerauge, Karneol, Hämatit, Lapis sind
   freigestellt; die übrigen hellen Studios — Bernstein, Rosenquarz milch, Kristallquarz, Feueropal —
   stehen als Platte im Basaltrahmen). Ein sauberes Freistellen ist dort ohne Maskierungsdienst nicht
   möglich; die Wirkung ist als „Museumstafel“ beabsichtigt, nicht als nahtlose Collage.
4. **Rein rechtliche Bewertung** der Nachweisführung (13-px-Zeile auf der Karte) bleibt offen; die
   Architektur erlaubt eine strengere Fassung ohne Layoutänderung.
5. `crys-24` Kristallquarz ist kontrastarm (bekannt aus der Recherche) und bleibt der schwächste
   Kachel-Eindruck; ein Ersatzmotiv würde eine neue Lizenzprüfung erfordern.
6. Die Retusche zweier Maßstabsbalken ist eine Inhaltsänderung; sie ist im Nachweis benannt, aber nur
   visuell geprüft (keine forensische Prüfung des Ergebnisses).

## Reproduktion

```bash
python docs/kristalle/scripts/download-sources.py      # 30 Quellen, SHA-256-geprüft (Cache außerhalb des Repos)
python docs/kristalle/scripts/prepare-images.py        # 120 WebP-Dateien
python docs/kristalle/scripts/build-integration.py     # Manifest, data/crystals.json, Impressum-Abschnitt, Sammelnachweis
python docs/kristalle/scripts/verify-images.py         # Prüfungen, Exit 1 bei Fehlern
npm run build
python -m http.server 8104 --bind 127.0.0.1 --directory dist &   # muss VOR dem Build beendet sein (Windows lockt dist/)
node scripts/verify-crystals.cjs                       # Browser-Prüfung gegen http://127.0.0.1:8104/Esoterik-Welt/
```

Der Bildgenerator erwartet die Quellen unter
`%LOCALAPPDATA%\\hermes\\profiles\\coder\\cache\\scratch\\crystal-src` (Pfad oben im Skript
`SRC`); für eine andere Ablage dort anpassen.
