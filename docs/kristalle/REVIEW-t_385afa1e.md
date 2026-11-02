# Review: Kristalle-Sektion — Lizenzen, Attribution, Bildwirkung, Build-Qualität

**Task:** `t_385afa1e` · **Rolle:** unabhängiger Reviewer · **Datum:** 2026-11-02
**Prüfobjekt:** `C:/Users/mas/Arbeit/Esoterik-Welt` (Arbeitsstand, Branch `main`, HEAD `5d327ed`)
**Prüfgegenstand:** `assets/crystals/**` (120 WebP + `manifest.json`), `data/crystals.json`, `js/modules/crystals.js`,
`js/dialog.js`, `css/main.css`, `css/design-system.css`, `index.html`, `impressum.html#kristalle-fotos`,
`docs/kristalle/QUELLEN-RECHTS-MANIFEST.md`

## 1. Gesamturteil

**Keine Freigabe — 1 Blocker (P0), 2 Mängel (P1) und 3 Qualitätsbefunde (P2).**

Die Lizenz- und Attributionsarbeit selbst ist inhaltlich **vollständig und nachvollziehbar belegt**: 30/30 Lizenzen
stimmen mit Wikimedia Commons überein, 30/30 Quelldateien sind per SHA-256 reproduzierbar, 120/120 ausgelieferte
Dateien sind integer, und alle 30 Nachweise sind im gerenderten Ergebnis sichtbar, korrekt verlinkt und ungeschnitten.
Der Blocker liegt außerhalb der Bildinhalte: **der gesamte Arbeitsstand ist nicht committet** (Bilder untracked),
womit die Sektion in einem Clean-Checkout bzw. auf GitHub Pages keine Fotos hätte. Zusätzlich beschreibt das
ausgelieferte Manifest-Feld `attribution_text_required` für alle 11 namensnennungspflichtigen Bilder die vorgenommenen
Änderungen falsch.

## 2. Abnahmekriterien und Ergebnis

| # | Kriterium (aus dem Task) | Ergebnis | Beleg |
|---|---|---|---|
| A1 | Quelle, Autor, Lizenz, Lizenz-URL, Attributionstext je Bild vollständig und korrekt | **PASS** | 30/30 gegen Commons-`extmetadata` geprüft; Autoren 30/30 zeichengleich |
| A2 | Lizenz erlaubt die projektseitige Nutzung | **PASS** (Allowlist PD/CC0/BY/BY-SA, keine NC/ND; 5× ShareAlike mit SA-Erklärung im Impressum) | Abschnitt 5 |
| A3 | Attributionen sichtbar, korrekt verlinkt, nicht abgeschnitten | **PASS** (30/30 Karten, Dialog, Impressum; Links == Manifest) | Abschnitt 6 |
| A4 | Jede Lizenz nachvollziehbar belegt | **PASS** (Lizenz-URLs HTTP 200, Quellseiten HTTP 200, Rendition-SHA-256 identisch) | Abschnitt 5 |
| A5 | Keine offenen Lizenz-/Attributionsprobleme | **FAIL (P1)** — falsche Änderungsangaben in `attribution_text_required` (11 Bilder), fehlende Retusche-Angabe bei `crys-17` | Abschnitt 9, P1.1 |
| A6 | Visuelle Kohärenz, Ausschnitte, keine Verzerrung | **TEILWEISE (P2)** — keine Verzerrung, kein Beschnitt, aber 10 helle Fotoplatten als Leuchtflächen, 2 nahezu kontrastlose Kacheln | Abschnitt 8 |
| A7 | Responsive Darstellung, Alt-Texte, Tastaturbedienung, Ladeverhalten | **PASS mit Auflage (P1.2/P2.2)** — Impressum-Links nur farblich unterschieden (WCAG 1.4.1), 2 Alt-Texte mit falschem Grund | Abschnitte 7–9 |
| A8 | Build/Tests ausgeführt, Screenshots als Evidenz | **PASS** | Abschnitt 3, `evidence/` |
| A9 | Freigabe oder eindeutige Mängelliste liegt vor | **PASS** — diese Mängelliste | Abschnitt 9 |

## 3. Methode (ausgeführt, nicht behauptet)

Umgebung: Windows 11, Node v24.13.0, npm 11.8.0, Python 3.14.9, Chromium (Playwright 1.64), statischer Server
`python -m http.server 8188` auf `dist/Esoterik-Welt/` (entspricht dem Pages-Layout `/Esoterik-Welt/`).

1. **Lizenz-Gegenprüfung an der Originalquelle** (nicht gegen die Projektdateien): MediaWiki-API
   `action=query&prop=imageinfo&iiprop=extmetadata|url|size` für alle 30 Dateien; Vergleich von
   `LicenseShortName`, `License`, `LicenseUrl`, `Artist`, `AttributionRequired`, `Restrictions` gegen Manifest/Datenmodell.
2. **Provenienz**: alle 30 in der Recherche genutzten 1280-px-Renditionen erneut geladen, SHA-256, Bytezahl und Maße
   gegen `source_sha256`, `bytes`, `delivered_*` verglichen.
3. **Dateiintegrität**: alle 120 WebP einzeln gehasht (SHA-256, Bytes) gegen Manifest.
4. **Geometrie/Verzerrung**: Inhalts-Bounding-Box je 320- und 1280-Datei, Seitenverhältnis gegen das Quellbild,
   Eck- und Randpixel gegen `#0b1012`.
5. **Build/Tests**: `npm run build`, `npm run lint`, `npm run format:check`, `npm test`, `npm run test:pages`,
   `npm run test:offline`, `npx playwright test`.
6. **Eigenes Browser-Script** (unabhängig vom Prüfskript des Implementierers): 10 Viewports (360–2560 px), Sichtbarkeit
   und Beschnitt der Nachweiszeilen, Textgleichheit mit `data/crystals.json`, `srcset`/`sizes`/gewählte Stufe,
   Seitenüberlauf, Zeilenbündigkeit, Konsole/Netzwerk, CLS; Tastaturbedienung (Tab/Enter/Escape, Fokus-Rückgabe,
   Fokusfalle); Dialog 360/390/768/1440; Listenansicht; Impressum; Fehlerzustand (Bild-Requests blockiert).
7. **Sichtprüfung**: Kontaktbogen aller 30 Motive, Rasterausschnitte 1440/390, Dialog 1440/360, Liste, Impressum,
   Zoom auf Linkdarstellung.

## 4. Prüfobjekt: Stand und Blocker P0

| Fakt | Nachweis |
|---|---|
| `assets/crystals/` ist **untracked** | `git ls-files assets/crystals` → 0 Dateien; `git status` → `?? assets/crystals/` |
| Code-/Daten-/HTML-Änderungen sind **uncommittet** | `M data/crystals.json`, `M impressum.html`, `M index.html`, `M js/modules/crystals.js`, `M js/dialog.js`, `M css/main.css`, `M css/design-system.css` |
| Ein Checkout von HEAD enthält die Sektion **nicht** | `git archive HEAD` → `assets/crystals` fehlt, `index.html` enthält 0 Verweise auf `assets/crystals`, `data/crystals.json` enthält 30× `image_placeholder` |

**Folge:** Die von t_12a8db50 gemeldeten „grünen" Tests liefen gegen den dirty working tree. Ein Clean-Checkout,
CI-Lauf (`ci.yml` baut mit `npm run build`) oder Pages-Deploy aus dem Repository würde eine Kristalle-Sektion ohne
Fotografien erzeugen (Glyph-Fallbacks bzw. 404) — und die gesamte Lizenzarbeit wäre nicht versioniert.
Zusätzlich war der diesem Review zugewiesene Workspace ein Worktree von `hermes-adaptive-router` (ohne Website),
weshalb die Prüfung im realen Projektverzeichnis erfolgen musste; dieser Dispatch-Fehler hat den fehlenden Commit
begünstigt.

**Fix (P0):** Branch anlegen, `assets/crystals/**` (120 WebP + manifest) sowie die 7 geänderten Dateien committen,
pushen, CI grün; Gegenprobe in einem frischen Clone: `git clone` → `npm ci` → `npm run build` → `assets/crystals/1280/*.webp`
vorhanden und `dist/Esoterik-Welt/index.html` referenziert sie.

## 5. Lizenzprüfung im Detail (30/30)

Spalte „URL" = deklarierte Lizenz-URL gleich Commons-`LicenseUrl` (bei den 7 PD-Dateien führt Commons kein
`LicenseUrl`; dort verweist das Manifest auf `Template:PD-self`, HTTP 200). „Autor" = Zeichengleichheit mit dem
Commons-`Artist`-Feld. „Prov." = erneut geladene Rendition, SHA-256 identisch.

| ID | Slug | Datei (Commons) | Lizenz (Commons) | URL | Autor | Namensnennung | ShareAlike | Prov. |
|---|---|---|---|---|---|---|---|---|
| crys-01 | amethyst | [Amethyst Quartz Crystals.jpg](https://commons.wikimedia.org/wiki/File:Amethyst_Quartz_Crystals.jpg) | PD-self | Template:PD-self (200) | ✓ | nein | nein | ✓ |
| crys-09 | selenit | [Gypsum 7.jpg](https://commons.wikimedia.org/wiki/File:Gypsum_7.jpg) | PD-self | Template:PD-self (200) | ✓ | nein | nein | ✓ |
| crys-24 | quarz-klar | [2011-12-24 11-10-34-quartz-10f.jpg](https://commons.wikimedia.org/wiki/File:2011-12-24_11-10-34-quartz-10f.jpg) | CC BY 3.0 | identisch | ✓ | ja | nein | ✓ |
| crys-28 | feueropal | [Fire opal in matrix (Juniper Ridge, Lake County, Oregon, USA) 11.jpg](https://commons.wikimedia.org/wiki/File:Fire_opal_in_matrix_(Juniper_Ridge,_Lake_County,_Oregon,_USA)_11.jpg) | CC BY 2.0 | identisch | ✓ | ja | nein | ✓ |
| crys-08 | fluorit | [Fluorite Xianghuapu Minéraux SU.jpg](https://commons.wikimedia.org/wiki/File:Fluorite_Xianghuapu_Min%C3%A9raux_SU.jpg) | CC BY 4.0 | identisch | ✓ | ja | nein | ✓ |
| crys-05 | lapis | [Lapis-lazuli hg.jpg](https://commons.wikimedia.org/wiki/File:Lapis-lazuli_hg.jpg) | CC BY-SA 2.5 | identisch | ✓ | ja | ja | ✓ |
| crys-14 | labradorit | [Labradorite polie 1 (Madagascar).jpg](https://commons.wikimedia.org/wiki/File:Labradorite_polie_1_(Madagascar).jpg) | PD-self | Template:PD-self (200) | ✓ | nein | nein | ✓ |
| crys-18 | celestit | [Celestine - Sakoany deposit, Katsepy, Mitsinjo, Boeny, Madagascar.jpg](https://commons.wikimedia.org/wiki/File:Celestine_-_Sakoany_deposit,_Katsepy,_Mitsinjo,_Boeny,_Madagascar.jpg) | CC BY-SA 4.0 | identisch | ✓ | ja | ja | ✓ |
| crys-29 | aquamarin | [Aquamarine beryl-MCG 90158-P4150841-black.jpg](https://commons.wikimedia.org/wiki/File:Aquamarine_beryl-MCG_90158-P4150841-black.jpg) | CC BY-SA 3.0 fr | identisch | ✓ | ja | ja | ✓ |
| crys-11 | aventurin | [Aventurine 1.jpg](https://commons.wikimedia.org/wiki/File:Aventurine_1.jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-06 | malachit | [Malachite on dolomite (GeoDIL number - 759).jpg](https://commons.wikimedia.org/wiki/File:Malachite_on_dolomite_(GeoDIL_number_-_759).jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-20 | smaragd | [Béryl var. émeraude sur gangue (Muzo Mine Boyaca - Colombie) -2.jpg](https://commons.wikimedia.org/wiki/File:B%C3%A9ryl_var._%C3%A9meraude_sur_gangue_(Muzo_Mine_Boyaca_-_Colombie)_-2.jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-22 | amazonit | [Amazonite and smoky quartz Lake George Minéraux SU.jpg](https://commons.wikimedia.org/wiki/File:Amazonite_and_smoky_quartz_Lake_George_Min%C3%A9raux_SU.jpg) | CC BY 4.0 | identisch | ✓ | ja | nein | ✓ |
| crys-26 | kunzit | [Spodumene var. kunzite (Pakistan).jpg](https://commons.wikimedia.org/wiki/File:Spodumene_var._kunzite_(Pakistan).jpg) | PD-self | Template:PD-self (200) | ✓ | nein | nein | ✓ |
| crys-02 | rosenquarz | [Rose quartz (GeoDIL number - 2521).jpg](https://commons.wikimedia.org/wiki/File:Rose_quartz_(GeoDIL_number_-_2521).jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-17 | moonstone | [Kamień księżycowy (moonstone) - Larvik k. Oslo. Norwegia.jpg](https://commons.wikimedia.org/wiki/File:Kamie%C5%84_ksi%C4%99%C5%BCycowy_(moonstone)_-_Larvik_k._Oslo._Norwegia.jpg) | CC BY-SA 4.0 | identisch | ✓ | ja | ja | ✓ |
| crys-21 | rosenquarz-milch | [Stuk roze kwarts (2).jpg](https://commons.wikimedia.org/wiki/File:Stuk_roze_kwarts_(2).jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-25 | peridot | [Péridot (= olivine) (Pakistan) 1.jpg](https://commons.wikimedia.org/wiki/File:P%C3%A9ridot_(%3D_olivine)_(Pakistan)_1.jpg) | PD-self | Template:PD-self (200) | ✓ | nein | nein | ✓ |
| crys-03 | zitrin | [Citrine (GeoDIL number - 310).jpg](https://commons.wikimedia.org/wiki/File:Citrine_(GeoDIL_number_-_310).jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-13 | tigerauge | [Tigers eye egg shape.jpg](https://commons.wikimedia.org/wiki/File:Tigers_eye_egg_shape.jpg) | PD-self | Template:PD-self (200) | ✓ | nein | nein | ✓ |
| crys-07 | citrin-wille | [Citrine 1 (Russie).jpg](https://commons.wikimedia.org/wiki/File:Citrine_1_(Russie).jpg) | PD-self | Template:PD-self (200) | ✓ | nein | nein | ✓ |
| crys-16 | bernstein | [Amber Baltic MNHN Minéralogie.jpg](https://commons.wikimedia.org/wiki/File:Amber_Baltic_MNHN_Min%C3%A9ralogie.jpg) | CC BY 4.0 | identisch | ✓ | ja | nein | ✓ |
| crys-12 | karneol | [Carnelian (GeoDIL number - 781).jpg](https://commons.wikimedia.org/wiki/File:Carnelian_(GeoDIL_number_-_781).jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-27 | roter-jaspis | [Jasper (GeoDIL number - 2520).jpg](https://commons.wikimedia.org/wiki/File:Jasper_(GeoDIL_number_-_2520).jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-15 | steinholz | [Petrified wood close 052615.jpg](https://commons.wikimedia.org/wiki/File:Petrified_wood_close_052615.jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-30 | rauchquarz | [Smoky quartz Rio Doce MNHN Minéralogie.jpg](https://commons.wikimedia.org/wiki/File:Smoky_quartz_Rio_Doce_MNHN_Min%C3%A9ralogie.jpg) | CC BY 4.0 | identisch | ✓ | ja | nein | ✓ |
| crys-19 | granat | [Grossular (GeoDIL number - 303).jpg](https://commons.wikimedia.org/wiki/File:Grossular_(GeoDIL_number_-_303).jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-23 | hematit | [Hematite (20255007100).jpg](https://commons.wikimedia.org/wiki/File:Hematite_(20255007100).jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-04 | obsidian | [Snowflake obsidian with white background.jpg](https://commons.wikimedia.org/wiki/File:Snowflake_obsidian_with_white_background.jpg) | CC0 1.0 | gleichwertig | ✓ | nein | nein | ✓ |
| crys-10 | schwarzer-turmalin | [Tourmaline-MCG 79448-P4150859-black.jpg](https://commons.wikimedia.org/wiki/File:Tourmaline-MCG_79448-P4150859-black.jpg) | CC BY-SA 3.0 fr | identisch | ✓ | ja | ja | ✓ |

**Verteilung:** 7× Public Domain (PD-self), 12× CC0 1.0, 11× CC BY/BY-SA (davon 5 ShareAlike: `crys-05`, `crys-17`,
`crys-18`, `crys-29`, `crys-10`). Allowlist des Projekts (PD/CC0/BY/BY-SA, keine NC/ND) ist eingehalten; das
Commons-Feld `Restrictions` ist bei allen 30 Dateien leer (keine dokumentierten Persönlichkeits-/Markenrechte-Hinweise).

**Live-Prüfungen:** 8 eindeutige Lizenz-URLs → alle HTTP 200; 30 Quellseiten → alle HTTP 200; 30 Renditionen →
30× SHA-256, Bytezahl und Maße identisch (Byte-genau reproduzierbar). 120 ausgelieferte Dateien → 120× Bytes und
SHA-256 identisch mit dem Manifest.

**ShareAlike:** Für die 5 SA-Bilder nennt `impressum.html#kristalle-fotos` je Eintrag „Die bearbeitete Fassung steht
ebenfalls unter dieser Lizenz (ShareAlike)" mit verlinkter Lizenz; `docs/kristalle/QUELLEN-RECHTS-MANIFEST.md`
führt zusätzlich „Lizenz der bearbeiteten Fassung". Das erfüllt die Weitergabe-Pflicht dem Grunde nach.

## 6. Attribution im gerenderten Ergebnis

| Ebene | Befund |
|---|---|
| Karte (13 px, `figcaption`) | 30/30 sichtbar an allen 10 Viewports; 0 abgeschnittene oder mit Ellipse gekürzte Zeilen; Text zeichengleich mit `attribution_text_short` (0 Abweichungen); Kontrast 9,09:1; `overflow-wrap: anywhere` bricht lange Urhebernamen wie „CopyrightFreePhotos.HQ101.com" sauber |
| Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` gesetzt; Urheber, Lizenz (Link), Quelle (Link), Abrufdatum und Änderungen vollständig; Alt-Text beschreibend (z. B. Mondstein „angeschliffene Platte … blauer Schimmer und Vitrinenreflexe"); Fokus wandert hinein, Tab zirkuliert innen, Escape schließt und setzt den Fokus auf die auslösende „Details"-Schaltfläche zurück |
| Impressum `#kristalle-fotos` | 30 Einträge, je 2 Links (Lizenz + Quelle), 0 fehlende Links gegenüber Manifest, 16 px, kein Beschnitt, Ankersprung funktioniert; ShareAlike-Satz je SA-Bild |
| Sektions-Fußzeile | Link „Alle Bildnachweise und Lizenzen" sichtbar, Ziel `impressum.html#kristalle-fotos` |
| Raster-Alt | `alt=""` → im Accessibility-Tree **keine** Bildrollen im Raster (dekorativ, Name steht als Überschrift daneben); Dialogbild ist mit Alt-Text exponiert |

**Rechtliche Einordnung der 13-px-Zeile:** Die Karte nennt Urheber und Lizenz, aber ohne Link. Der vollständige
TASL-Nachweis ist einen Klick entfernt (Dialog) und dauerhaft im Impressum verlinkt. Für CC BY 4.0 ist die
Namensnennung „in reasonable manner" zulässig, die auch über einen Link auf eine Ressource mit den vollständigen
Angaben erfüllt werden kann (§3(a)(2)); das ist hier gegeben. **Restrisiko:** Ein sehr strenger Prüfer könnte für
BY-SA eine unmittelbar am Bild sichtbare Lizenzangabe verlangen; das ist mit dem Dialog ohne Layoutänderung
nachschärfbar.

## 7. Responsive, Ladeverhalten, Bedienbarkeit

| Viewport | Platte | Spalten | Zeilen | Überlauf x | Nachweise | beschnitten | geladene Stufe |
|---|---|---|---|---|---|---|---|
| 360 | 310×310 | 1 | 30 | 0 | 30/30 | 0 | 320 px |
| 390 | 340×340 | 1 | 30 | 0 | 30/30 | 0 | 640 px |
| 480 | 430×430 | 1 | 30 | 0 | 30/30 | 0 | 640 px |
| 640 | 282×282 | 2 | 15 | 0 | 30/30 | 0 | 640 px |
| 768 | 338×338 | 2 | 15 | 0 | 30/30 | 0 | 640 px |
| 1024 | 302×302 | 3 | 10 | 0 | 30/30 | 0 | 640 px |
| 1280 | 366×366 | 3 | 10 | 0 | 30/30 | 0 | 640 px |
| 1440 | 308×308 | 4 | 8 | 0 | 30/30 | 0 | 640 px |
| 1920 | 320×320 | 4 | 8 | 0 | 30/30 | 0 | 640 px |
| 2560 | 320×320 | 4 | 8 | 0 | 30/30 | 0 | 640 px |

* **Keine Verzerrung, kein Beschnitt:** Bei den 25 „pad"-Motiven entspricht das Seitenverhältnis der sichtbaren
  Bildfläche dem Quellbild (max. Abweichung 0,54 % bei 1280 px, 1,61 % bei 320 px durch WebP-Kantenglättung);
  Motivfläche 88 %, kein Randpixel enthält Motiv (Rand durchgehend Hintergrund) — die Aussage „kein Motiv beschnitten"
  ist damit **belegt**.
* **Ladeverhalten:** beim Erstaufbau 6 Bildanfragen, davon **4 Kristall-WebP** (amethyst, selenit, quarz-klar,
  feueropal); nach Scrollen 30/30 geladen, 0 fehlerhafte Antworten; CLS 0,0016–0,0119 (390/360/768/1440).
* **Fehlerzustand:** bei blockierten Bild-Requests bleibt die Platte 308 px hoch, Nachweiszeile bleibt sichtbar,
  kein Layout-Kollaps; als Platzhalter erscheint allerdings nur ein Emoji ohne erklärenden Text.
* **Konsole:** keine Fehler, keine `pageerror`-Einträge in allen Läufen.
* **Kontraste:** Nachweiszeile 9,09:1; Lizenz-/Quelllinks im Dialog 8,42:1 (unterstrichen), Impressum-Links 8,42:1
  (**nicht** unterstrichen, siehe P1.2).

## 8. Visuelle Kohärenz (Sichtprüfung + Messung)

Geprüft am Kontaktbogen aller 30 Motive und an Rasterausschnitten in Originalauflösung (1440/390), Dialog, Liste.

* **Positiv:** einheitliche 1:1-Platten, gleicher Basaltgrund, gleiche Motivfläche, keine verzerrten oder
  angeschnittenen Steine, keine sichtbaren Reste der retuschierten Maßstabsangaben (`crys-15` „1.0 cm",
  `crys-17` „56 mm" sind visuell entfernt), Motivzuordnung 30/30 plausibel zur Beschriftung.
* **Befund 1 — zwei Bildklassen:** 5 freigestellte Motive (`matte`) wirken „schwebend", 25 unbeschnittene Motive
  stehen als Fotorechteck im Grund. Das ist dokumentiert und als „Museumstafel" begründet, bleibt aber als
  Bruch sichtbar.
* **Befund 2 — Leuchtflächen:** 10 Kacheln haben >15 % helle Bildfläche (crys-21 54.9 %, crys-16 42.1 %, crys-18 37.5 %, crys-24 36.0 %, crys-15 34.1 %, crys-02 32.0 %, crys-06 27.4 %, crys-03 25.6 %, crys-01 21.9 %, crys-28 20.9 %) und wirken im dunklen Raster
  als helle Panels — genau die Wirkung, die das Freistellen der 5 anderen Motive vermeiden sollte.
* **Befund 3 — Kontrastarmut:** `crys-04` (Schneeflockenobsidian) und `crys-10` (Schörl) sind schwarz auf schwarz
  nahezu strukturlos; `crys-24` (Kristallquarz) bleibt blass (vom Recherche-Task bereits als Risiko benannt).

## 9. Mängelliste (priorisiert)

### P0 — Blocker: Arbeitsstand nicht committet
Siehe Abschnitt 4. Ohne Commit/Push existiert die Sektion nur lokal; Clean-Checkout/CI/Pages hätte keine Bilder.

### P1.1 — `attribution_text_required` beschreibt die Änderungen falsch (11 Bilder, lizenzrelevant)
Das Manifest-Feld (und identisch `data/crystals.json`) enthält für **alle 11 namensnennungspflichtigen** Bilder
denselben Textbaustein: „Änderungen: quadratischer Beschnitt, Skalierung auf 320/640/1280 px, Neukodierung als
WebP/JPEG." Das ist in drei Punkten unzutreffend; hinzu kommt ein verschwiegener Punkt:

1. **„Beschnitt"**: Es wurde nicht beschnitten (Beleg: Seitenverhältnis = Quelle, kein Randpixel mit Motiv;
   `docs/kristalle/INTEGRATION-t_12a8db50.md`: „Kein Motiv wurde beschnitten").
2. **„320/640/1280"**: Es werden vier Stufen ausgeliefert (320/640/960/1280).
3. **„WebP/JPEG"**: Es existiert kein JPEG.
4. **`crys-17` (CC BY-SA 4.0)** verschweigt zusätzlich die einzige inhaltliche Änderung — das Entfernen der
   eingebetteten Maßstabs-Miniatur „56 mm" (`production.retouch = "row_bg"`). Bei CC BY-SA 4.0 ist das Anzeigen
   von Änderungen Pflicht (§3(a)(1)(B)).

Betroffene IDs: crys-24, crys-28, crys-08, crys-05, crys-18, crys-29, crys-22, crys-17, crys-16, crys-30, crys-10. Die **gerenderten** Nachweise (Dialog/Impressum) sind korrekt, weil sie aus
`credit.changes` kommen; falsch ist das ausgelieferte Manifest-Feld, das als maschinenlesbarer Lizenznachweis
(`impressum.html`: „Maschinenlesbar: assets/crystals/manifest.json") und in `QUELLEN-RECHTS-MANIFEST.md` als
„Pflicht-Namensnennung" ausgewiesen ist.
**Fix:** `attribution_text_required` aus `credit.changes` generieren (eine Quelle der Wahrheit), Retusche und alle
vier Stufen aufnehmen, „JPEG" streichen; Regressionstest: `attribution_text_required` muss `credit.changes` und
`production.retouch`/`production.mode` enthalten.

### P1.2 — Impressum-Links nur farblich unterschieden (WCAG 1.4.1)
Für `.crystal-credits` existiert keine CSS-Regel; die Links im Impressum sind nicht unterstrichen. Linkfarbe
`rgb(198,179,142)` gegen Fließtext `rgb(186,189,183)` = **1,079:1** (Schwelle für „Farbe allein" wäre 3:1).
Im Dialog sind die Links korrekt unterstrichen.
**Fix:** `text-decoration: underline` (+ `text-underline-offset`) für `.crystal-credits a`, analog Dialog.

### P2.1 — Visuelle Kohärenz: helle Fotoplatten und zwei kontrastarme Kacheln
Siehe Abschnitt 8. **Fix-Optionen:** Freistellen auf die 4–5 hellsten Motive ausdehnen (24, 28, 21, 16, 15),
oder einheitliche Innenkante/Abdunklung der Fotoplatte, oder Ersatzmotive für `crys-04`/`crys-10`.

### P2.2 — Zwei Alt-Texte nennen den falschen Grund
`crys-28` („vor dunklem Grund", tatsächlich helle Studiofläche, Eckluminanz 0,36) und `crys-18` („vor dunklem Grund",
Rand bis 0,36) beschreiben das gelieferte Bild falsch; die übrigen 28 Alt-Texte passen zur Sichtprüfung.
**Fix:** Grundangabe aus gemessener Hintergrundhelligkeit erzeugen oder neutral formulieren („vor einfarbigem Grund").

### P2.3 — Dialog bei 360 px: Nachweis erst nach Scrollen vollständig
Die letzte Zeile der Änderungen liegt initial 26 px unter der Innenkante des Modals (scrollbar, Tastatur-Scrollen
funktioniert). **Fix:** Bildplatte unter 380 px auf ~240 px reduzieren oder Änderungstext kürzen.

### P3 — Dokumentation und Prozess
* `impressum.html:145` sagt „Bilder: quadratischer 1:1-**Zuschnitt** mit Rand" — irreführend, da nicht beschnitten
  (besser: „1:1-Leinwand mit 6 % Rand").
* README verweist auf `LICENSE` (MIT); eine `LICENSE`-Datei existiert nicht (vorbestehend, nicht durch diesen Task).
* Footer „© 2025 Esoterik-Welt" steht unkommentiert neben CC-BY-SA-Bearbeitungen; die SA-Erklärung steht im
  Bildnachweis-Abschnitt. Empfehlung: Fußnote „Bilder: siehe Bildnachweise" im Footer.
* Manifest enthält kein maschinenlesbares Feld für die Lizenz der bearbeiteten Fassung (nur Prosa im Impressum);
  Empfehlung: `adaptation_license` je SA-Bild.
* Die Aussage „Eckproben bei allen 30 exakt #0b1012" gilt für die Master, nicht für die ausgelieferten WebP:
  gemessene Eckabweichung 1–3/255 (unsichtbar, aber die Formulierung sollte „≤3/255" lauten).
* Task-Workspace zeigte auf `hermes-adaptive-router` statt auf das Projekt (Dispatch-Fehler, siehe Abschnitt 4).

## 10. Grenzen dieser Prüfung

* **Keine juristische Prüfung** — geprüft wurde die technische Erfüllung der Lizenzbedingungen (Allowlist,
  TASL-Bestandteile, Änderungsanzeige, ShareAlike-Aussage), nicht die rechtliche Endbewertung.
* **Kein Screenreader-Test** (NVDA/VoiceOver); geprüft wurden Accessibility-Tree, Rollen, Fokusführung und Kontraste.
* **Kein kalibrierter Monitor/Druckproof**; Kontraste rechnerisch aus gerenderten Farbwerten, Bildwirkung per Sichtprüfung.
* **Retusche visuell geprüft** (Maßstabsangaben nicht mehr sichtbar), keine forensische Pixelanalyse.
* **Qualität der Freistellungsmasken** nur visuell beurteilt, nicht algorithmisch.
* Commons-`Restrictions` ist bei allen 30 Dateien leer; zusätzliche Rechte Dritter (z. B. Museums-/Hausrecht)
  wurden nicht geprüft.
* Die 1280-px-Stufe enthält bei „pad"-Motiven maximal ~1126 px echte Bildinformation (Einpassung in 88 %); für die
  Darstellung ausreichend, für eine Hero-Nutzung nicht.

## 11. Reproduktion

```bash
# 1) Lizenz-Gegenprüfung an der Quelle (Commons-API) und Provenienz
python docs/kristalle/review-scripts/commons_verify.py      # 30 Seiten, extmetadata-Vergleich
python docs/kristalle/review-scripts/provenance_check.py    # 30 Renditionen: SHA-256/Bytes/Maße
python docs/kristalle/review-scripts/integrity.py           # 120 Dateien: Bytes+SHA-256 vs Manifest
python docs/kristalle/review-scripts/image_geometry.py      # 1:1, Ecken, Inhalts-BBox vs Quell-Seitenverhältnis

# 2) Build und Tests
npm run build && npm run lint && npm run format:check
npm test && npm run test:pages && npm run test:offline && npx playwright test

# 3) Gerendertes Ergebnis
python -m http.server 8188 --bind 127.0.0.1 --directory dist
node docs/kristalle/review-scripts/verify-browser.cjs        # 10 Viewports, Nachweise, Tastatur, Netzwerk
node docs/kristalle/review-scripts/verify-dialog-impressum.cjs
node docs/kristalle/review-scripts/verify-impressum.cjs
```

Testergebnisse dieses Laufs: `npm run build` Exit 0 · `npm run lint` 0 Warnungen · `format:check` grün ·
`npm test` 2/2 · `npm run test:pages` 6/6 · `npm run test:offline` 2/2 · `npx playwright test` **74/74**.

## 12. Evidenz

| Datei | Inhalt |
|---|---|
| `contact-sheet-320.png` | alle 30 Motive mit IDs (Sichtprüfung Motiv/Beschriftung, Kohärenz) |
| `grid-1440-crop0.png`, `grid-390-cardcrop0.png` | Raster in Originalauflösung (Nachweiszeile, Bündigkeit, Leuchtflächen) |
| `dialog-1440.png`, `dialog-360.png`, `dialog-360-scrolled.png` | vollständiger Nachweis, Fokus, Mobile-Scroll |
| `list-1440.png` | Listenansicht mit Inline-Nachweis |
| `impressum-kristalle-1440.png`, `impressum-zoom.png` | Sammelnachweis und Linkdarstellung |
| `errorstate-1440.png` | Fehlerzustand bei blockierten Bildern |
| `browser-report.json`, `dialog-impressum-report.json`, `impressum-report.json` | Messwerte je Viewport, Tastatur, Netzwerk, CLS |
| `commons_verify.json`, `provenance.json` | Rohdaten der Lizenz- und Provenienzprüfung |

---

**Freigabe:** nein. **Wiederfreigabe nach:** P0 (Commit/Push + CI-Grün), P1.1 (Manifest-Texte aus `credit.changes`
generieren), P1.2 (Link-Unterstreichung). P2-Befunde sind für die Freigabe nicht blockierend, sollten aber vor dem
Deploy adressiert oder ausdrücklich als bewusste Designentscheidung dokumentiert werden.
