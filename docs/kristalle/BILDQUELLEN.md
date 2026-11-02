# Kristalle — Bildquellen und Auswahlbegründung

Stand: 02.11.2026 · Task `t_75514188` (Profil `deep_research_rag`) · Grundlage:
`docs/kristalle-image-audit.md` (Inventar, Einbaustellen, Bildkonventionen)

Art: Recherche- und Nachweis-Dokument. **Keine** Bilddatei im Repository, **keine** Änderung an
Produktivcode oder Daten — die Einbindung erfolgt in Task `t_12a8db50` auf Basis dieses Manifests
und der Galerie-Spezifikation aus `t_5ca258cb`.

## 1. Ergebnis in einem Satz

Für alle **30** Kristalle (`crys-01`…`crys-30`) liegt je **ein vollständig dokumentierter
Bildkandidat** aus Wikimedia Commons vor, dessen Lizenz an der Originalquelle geprüft wurde:
30/30 dokumentiert, Lizenzklassen 12× CC0-1.0, 7× Public-Domain, 4× CC-BY-4.0, 2× CC-BY-SA-3.0, 2× CC-BY-SA-4.0, 1× CC-BY-SA-2.5, 1× CC-BY-3.0, 1× CC-BY-2.0,
davon 11 mit Attributionspflicht und
5 mit ShareAlike-Pflicht (CC BY-SA).

Maschinenlesbar: **`docs/kristalle/image-sources.json`** ·
Belege: **`docs/kristalle/image-sources.evidence.json`** ·
automatische Prüfung: **`docs/kristalle/image-sources.validation.json`** (0 Fehler, 0 Warnungen).

## 2. Lizenzpolitik

Zugelassen (Allowlist): Public Domain (inkl. `PD-self`), CC0 1.0, CC BY 2.0/3.0/4.0,
CC BY-SA 2.0/2.5/3.0/4.0.

Ausgeschlossen: CC BY-NC*, CC BY-ND*, CC BY-NC-ND*, GFDL-only, Fair Use, „alle Rechte
vorbehalten“, unklare oder fehlende Lizenzangaben.

Begründung: Die Seite ist öffentlich und nicht-kommerziell, eine spätere kommerzielle Nutzung
(Print, Shop, Sponsoring) ist aber nicht ausgeschlossen → **NC** scheidet aus. Bilder werden für
`srcset` beschnitten und skaliert → **ND** scheidet aus. **CC BY-SA** ist zugelassen, weil das
Projekt die ShareAlike-Pflicht im Impressum bereits für Tarot-Texturen ausweist
(`impressum.html:106-110`); die bearbeiteten Kristallfassungen müssen dann ebenfalls unter
CC BY-SA stehen. Bevorzugte Reihenfolge war PD → CC0 → CC BY → CC BY-SA, um Pflichten zu
minimieren.

## 3. Methode (reproduzierbar)

1. Suchbegriffe je Mineral auf Deutsch und Englisch inkl. Synonymen (Schörl, Selenit/Gips,
   Celestin/Célestine, Tiger's eye, Petrified wood) gegen die MediaWiki-API von Wikimedia
   Commons (`list=search`, Namespace 6, `filetype:bitmap`).
2. Automatischer Lizenzvorfilter (Allowlist oben), Mindestauflösung 1280×900 px — das deckt die
   größte im Audit gemessene Stufe (1280 px) ab.
3. Sichtprüfung: alle Shortlist-Kandidaten als Kontaktbogen gerendert (PIL) und nach Motivklarheit,
   Ausleuchtung, ruhigem Hintergrund, quadratischer Beschnittfähigkeit und Abgrenzbarkeit der
   Doppelmotive bewertet. Verworfen wurden u. a. Buchseiten-Scans, Schiffsfotos
   („Crystal Emerald“), Landschaftsaufnahmen, Schmuckstücke, Museumsvitrinen mit Etiketten und
   archäologische Artefakte.
4. Metadaten je Auswahl über `prop=imageinfo&iiprop=extmetadata|sha1|size|mime`:
   `LicenseShortName`, `LicenseUrl`, `Artist`, `Credit`, `UsageTerms`, `AttributionRequired`,
   `Restrictions`, `DateTimeOriginal`.
5. **Lizenzprüfung an der Originalquelle:** Wikitext der Dateibeschreibungsseite geladen
   (`action=parse&prop=wikitext`), Lizenzvorlagen extrahiert (z. B. `Cc-zero`, `PD-self`,
   `cc-by-3.0`) und SHA-256 des Wikitexts festgehalten — Snapshot in
   `image-sources.evidence.json`.
6. Lizenz-URLs per HTTP abgerufen (9 eindeutige URLs, alle HTTP 200).
7. Reproduzierbare Web-Renditions über `Special:FilePath?width=…` geladen, Maße und SHA-256
   gemessen. Wikimedia liefert gestufte Breiten: angefragt 320/640/1280 px, ausgeliefert
   330/960/1280 px (im Manifest als `delivered_width_px` festgehalten).

## 4. Auswahl je Kristall

Spalte „Hintergrund“ = gemessene Randluminanz des Bildes (dunkel < 70, neutral 70–180, hell > 180);
„Beschnitt“ = Eignung für den quadratischen Bildbereich der Karte.

| # | ID / Slug | Anzeigename | Urheber (laut Quelle) | Lizenz | Original | Hintergrund | Beschnitt | Quelle |
|---|---|---|---|---|---|---|---|---|
| 01 | `crys-01` `amethyst` | Amethyst | CopyrightFreePhotos CopyrightFreePhotos.HQ101.com | Public Domain (PD-self) | 3556×5352 JPEG | neutral | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Amethyst_Quartz_Crystals.jpg) |
| 02 | `crys-02` `rosenquarz` | Quarz (Rosenquarz) | Darla Sondrol | CC0 1.0 | 1708×1192 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Rose_quartz_(GeoDIL_number_-_2521).jpg) |
| 03 | `crys-03` `zitrin` | Zitrin | Shannon Heinle | CC0 1.0 | 2392×1776 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Citrine_(GeoDIL_number_-_310).jpg) |
| 04 | `crys-04` `obsidian` | Obsidian (Schwarzer Obsidian) | Bordercolliez | CC0 1.0 | 1900×1360 JPEG | hell | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Snowflake_obsidian_with_white_background.jpg) |
| 05 | `crys-05` `lapis` | Lapis Lazuli | Hannes Grobe | CC BY-SA 2.5 | 1958×1679 JPEG | neutral | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Lapis-lazuli_hg.jpg) |
| 06 | `crys-06` `malachit` | Malachit | Twyla Baker | CC0 1.0 | 2566×1860 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Malachite_on_dolomite_(GeoDIL_number_-_759).jpg) |
| 07 | `crys-07` `citrin-wille` | Citrin (Wille) | Parent Géry | Public Domain (PD-self) | 4288×2848 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Citrine_1_(Russie).jpg) |
| 08 | `crys-08` `fluorit` | Fluorit | Marie-Lan Taÿ Pamart | CC BY 4.0 | 8030×5353 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Fluorite_Xianghuapu_Min%C3%A9raux_SU.jpg) |
| 09 | `crys-09` `selenit` | Selenit | Géry PARENT | Public Domain (PD-self) | 2656×4000 JPEG | dunkel | bedingt | [Dateiseite](https://commons.wikimedia.org/wiki/File:Gypsum_7.jpg) |
| 10 | `crys-10` `schwarzer-turmalin` | Schwarzer Turmalin | Rama | CC BY-SA 3.0 | 4000×4000 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Tourmaline-MCG_79448-P4150859-black.jpg) |
| 11 | `crys-11` `aventurin` | Aventurin (Grün) | Bordercolliez | CC0 1.0 | 2232×1520 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Aventurine_1.jpg) |
| 12 | `crys-12` `karneol` | Karneol | Shannon Heinle | CC0 1.0 | 1772×1320 JPEG | hell | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Carnelian_(GeoDIL_number_-_781).jpg) |
| 13 | `crys-13` `tigerauge` | Tigerauge | Unnameduploads | Public Domain (PD-self) | 2138×1620 JPEG | hell | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Tigers_eye_egg_shape.jpg) |
| 14 | `crys-14` `labradorit` | Labradorit | Parent Géry | Public Domain (PD-self) | 4288×2848 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Labradorite_polie_1_(Madagascar).jpg) |
| 15 | `crys-15` `steinholz` | Petrified Wood | Wilson44691 | CC0 1.0 | 3736×2640 JPEG | neutral | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Petrified_wood_close_052615.jpg) |
| 16 | `crys-16` `bernstein` | Bernstein | Marie-Lan Taÿ Pamart | CC BY 4.0 | 4500×4500 JPEG | neutral | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Amber_Baltic_MNHN_Min%C3%A9ralogie.jpg) |
| 17 | `crys-17` `moonstone` | Moonstone (Mondstein) | Lech Darski | CC BY-SA 4.0 | 4753×3168 JPEG | dunkel | bedingt | [Dateiseite](https://commons.wikimedia.org/wiki/File:Kamie%C5%84_ksi%C4%99%C5%BCycowy_(moonstone)_-_Larvik_k._Oslo._Norwegia.jpg) |
| 18 | `crys-18` `celestit` | Celestit | Ivar Leidus | CC BY-SA 4.0 | 5400×4000 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Celestine_-_Sakoany_deposit,_Katsepy,_Mitsinjo,_Boeny,_Madagascar.jpg) |
| 19 | `crys-19` `granat` | Granat (Edelstein) | Nessa Eull | CC0 1.0 | 2080×1768 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Grossular_(GeoDIL_number_-_303).jpg) |
| 20 | `crys-20` `smaragd` | Smaragd | Géry PARENT | CC0 1.0 | 4288×2848 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:B%C3%A9ryl_var._%C3%A9meraude_sur_gangue_(Muzo_Mine_Boyaca_-_Colombie)_-2.jpg) |
| 21 | `crys-21` `rosenquarz-milch` | Rosenquarz (Milch) | Romaine | CC0 1.0 | 4032×3024 JPEG | hell | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Stuk_roze_kwarts_(2).jpg) |
| 22 | `crys-22` `amazonit` | Amazonit | Marie-Lan Taÿ Pamart | CC BY 4.0 | 5444×6805 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Amazonite_and_smoky_quartz_Lake_George_Min%C3%A9raux_SU.jpg) |
| 23 | `crys-23` `hematit` | Hematit | Joe deSousa | CC0 1.0 | 6016×4016 JPEG | hell | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Hematite_(20255007100).jpg) |
| 24 | `crys-24` `quarz-klar` | Kristallquarz (Klare) | Thomas Bresson | CC BY 3.0 | 3991×2441 JPEG | neutral | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:2011-12-24_11-10-34-quartz-10f.jpg) |
| 25 | `crys-25` `peridot` | Peridot | Parent Géry | Public Domain (PD-self) | 2598×2621 JPEG | dunkel | bedingt | [Dateiseite](https://commons.wikimedia.org/wiki/File:P%C3%A9ridot_(%3D_olivine)_(Pakistan)_1.jpg) |
| 26 | `crys-26` `kunzit` | Kunzit | Parent Géry | Public Domain (PD-self) | 4288×2848 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Spodumene_var._kunzite_(Pakistan).jpg) |
| 27 | `crys-27` `roter-jaspis` | Roter Jaspis | Darla Sondrol | CC0 1.0 | 1932×1384 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Jasper_(GeoDIL_number_-_2520).jpg) |
| 28 | `crys-28` `feueropal` | Opal (Feueropal) | James St. John | CC BY 2.0 | 3304×2016 JPEG | neutral | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Fire_opal_in_matrix_(Juniper_Ridge,_Lake_County,_Oregon,_USA)_11.jpg) |
| 29 | `crys-29` `aquamarin` | Aquamarin | Rama | CC BY-SA 3.0 | 4000×4000 JPEG | dunkel | gut | [Dateiseite](https://commons.wikimedia.org/wiki/File:Aquamarine_beryl-MCG_90158-P4150841-black.jpg) |
| 30 | `crys-30` `rauchquarz` | Rauchquarz | Marie-Lan Taÿ Pamart | CC BY 4.0 | 3333×5000 JPEG | neutral | bedingt | [Dateiseite](https://commons.wikimedia.org/wiki/File:Smoky_quartz_Rio_Doce_MNHN_Min%C3%A9ralogie.jpg) |

Details je Kristall (Motivnotiz, Auswahlgrund, vollständiger Attributionspflicht-Text,
Rendition-URLs mit SHA-256, Lizenzkompatibilitäts-Begründung) stehen in
`image-sources.json` unter `crystals[].candidates[0]`.

## 5. Warum diese Bilder zusammen funktionieren

- **Ruhige Objektfotografie statt Doku-Material.** Kein ausgewähltes Motiv enthält Personen,
  Etiketten oder Maßstäbe. Die meisten Bilder zeigen ein freigestelltes Einzelobjekt; wo Matrix
  bewusst Teil des Motivs bleibt (z. B. Amethyst, Malachit, Celestit, Smaragd, Feueropal), ist sie
  ruhig und ohne Störobjekte. Das trägt den Nachtatelier-Look (dunkler Grund, gerichtetes Licht)
  auch dort, wo der Fond hell ist. Verworfen wurden im Vorfeld Buchseiten-Scans, Schiffs- und
  Landschaftsfotos, Schmuckstücke sowie Museumsaufnahmen mit Beschriftung.
- **Gemessene Hintergründe statt Bauchgefühl.** Die Randluminanz ist je Bild im Manifest
  hinterlegt: 18 von 30 haben einen dunklen Fond, 12 einen neutralen oder hellen
  (hell: crys-04, crys-12, crys-13, crys-21, crys-23). Damit kann die Galerie-Spec die hellen Fonds gezielt behandeln — z. B.
  `object-fit: contain` auf `--color-bg-deep` oder eine einheitliche Bildfläche, statt einzelne
  Bilder zu retuschieren.
- **Farbtreue zum Datensatz.** Jede Auswahl wurde gegen die Felder `color` und `chakra` aus
  `data/crystals.json` geprüft (violetter Amethyst, türkiser Amazonit, hellblauer Celestit …).
- **4 Motive brauchen einen bewussten Beschnitt** (`square_crop: "bedingt"`):
  Selenit (`crys-09`), Moonstone (Mondstein) (`crys-17`), Peridot (`crys-25`), Rauchquarz (`crys-30`). Bei ihnen ist mittiger Beschnitt oder `contain` nötig, sonst kappt `cover` die
  Kristallspitzen (Art Direction: „keine Spitzen kappen“).
- **Doppelmotive bewusst entkoppelt:**
  - `crys-02` Rosenquarz = tiefrosa massiver Handstein auf **schwarzem** Grund;
    `crys-21` Milch-Rosenquarz = blassrosa, milchig-trüber Brocken auf **weißem** Grund.
  - `crys-03` Zitrin = **Rohstufe** mit Kristallspitzen;
    `crys-07` Citrin (Wille) = **geschliffener** Einzelkristall mit Facettenflächen.
  Ohne diese Trennung hätte der Katalog zwei sichtbar identische Kacheln.

## 6. Attributionspflichten für die Einbindung

- **11 Bilder** (CC BY / CC BY-SA) verlangen: Urheber,
  Quellseite, Lizenzname **und** Lizenz-URL sowie die Angabe der Änderungen (Beschnitt,
  Skalierung, Neukodierung). Der vollständige Pflichttext steht je Bild in
  `attribution_text_required`, die Kurzform für die Karte in `attribution_text_short`.
- **5 Bilder** sind **CC BY-SA**: bearbeitete Fassungen (also die
  Web-Derivate) müssen unter derselben Lizenz weitergegeben werden. Im Impressum muss das
  ausgewiesen werden.
- **19 Bilder** sind Public Domain/CC0: rechtlich keine
  Namensnennung nötig, Projektstandard ist die Quellenangabe trotzdem (Muster
  `index.html:120-132`).
- Ablageorte gemäß Projektmuster: Abschnitt `#kristalle-fotos` in `impressum.html`
  (Muster `impressum.html:80-138`) plus Kurz-Caption im Detail-Dialog. Der Footer enthält
  bislang keinen Bildnachweis-Link — der Impressum-Anker ist der kleinste Eingriff.

Beispiel (CC BY-SA 4.0, `crys-18` Celestit):

> „Celestine - Sakoany deposit, Katsepy, Mitsinjo, Boeny, Madagascar“ – Ivar Leidus, lizenziert
> unter Creative Commons Namensnennung – Weitergabe unter gleichen Bedingungen 4.0
> (<https://creativecommons.org/licenses/by-sa/4.0/>). Quelle:
> <https://commons.wikimedia.org/wiki/File:Celestine_-_Sakoany_deposit,_Katsepy,_Mitsinjo,_Boeny,_Madagascar.jpg>.
> Änderungen: quadratischer Beschnitt, Skalierung auf 320/640/1280 px, Neukodierung als
> WebP/JPEG.

> **Korrektur (Review t_385afa1e, P1.1).** Der obige Beispieltext stammt aus der Recherche und
> beschreibt die Produktion falsch: es wurde nicht beschnitten, es gibt vier Stufen
> (320/640/960/1280) und kein JPEG. Der ausgelieferte Text wird deshalb **nicht** aus diesem
> Dokument übernommen, sondern ausschließlich aus `credit.changes` + `production` erzeugt
> (`scripts/lib/crystal-attribution.cjs`); Nachweis: `npm run test:crystals`.

## 7. Grenzen und offene Punkte

1. **Keine Rechtsberatung.** „Kompatibel“ heißt: erfüllt die Projekt-Allowlist. Die
   ShareAlike-Frage (unter welcher Lizenz die Web-Derivate stehen) ist eine
   Veröffentlichungsentscheidung, keine Recherchefrage.
2. **Mondstein (`crys-17`)** ist in einer Vitrine aufgenommen; Reflexe der Scheibe sind im Bild.
   Vor der Einbindung enger beschneiden oder ein Ersatzmotiv wählen — dann muss das Manifest
   mitgezogen werden.
3. **Mineralogie vs. Handelsname.** „Zitrin“ ist meist erhitzter Amethyst, „Milch-Rosenquarz“
   ist keine eigene Mineralart. Die Bildbeschreibungen der Quelle wurden übernommen; das
   Manifest behauptet keine mineralogische Bestimmung.
4. **Bildqualität ist nicht überall Studio-Niveau.** Die GeoDIL-Serie (Rosenquarz, Citrin,
   Malachit, Karneol, Granat, Roter Jaspis) ist CC0 und sauber freigestellt, aber technisch
   älter (Kompaktkamera, 1700–2600 px). Für 320/640/1280 px reicht das; für einen späteren
   Hero-Einsatz nicht.
5. **Keine Alternativkandidaten im Manifest.** Pro Kristall ist genau ein Kandidat vollständig
   dokumentiert (Auftrag: „mindestens ein“). Verworfen wurde viel (u. a. Schiffs- und
   Buchseiten-Treffer bei „emerald“/„carnelian“) — die Screens der Recherche sind im Task-Lauf
   dokumentiert, aber nicht Teil des Repos.

## 8. Reproduktion

```bash
# Manifest automatisch prüfen (Pflichtfelder, Allowlist, target_path-Abgleich,
# Live-Lizenz-URLs, Rendition-SHA-256); schreibt image-sources.validation.json neu
python docs/kristalle/scripts/validate-image-sources.py            # mit Netzaufrufen
python docs/kristalle/scripts/validate-image-sources.py --offline  # rein lokal
```

```bash
# Lizenz und Maße einer Quelle erneut prüfen (Beispiel crys-18)
curl -s -A "Esoterik-Welt/1.0" \
  "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo\
&iiprop=url|size|mime|extmetadata|sha1&titles=File:Celestine%20-%20Sakoany%20deposit,%20Katsepy,%20Mitsinjo,%20Boeny,%20Madagascar.jpg"

# Web-Stufe laden und Hash gegen das Manifest prüfen
curl -L -A "Esoterik-Welt/1.0" -o /tmp/celestit.jpg \
  "$(python -c "import json;print(json.load(open('docs/kristalle/image-sources.json'))['crystals'][17]['candidates'][0]['source']['renditions']['w1280']['url'])")"
sha256sum /tmp/celestit.jpg
```

Die Datei `image-sources.validation.json` wird vom Prüfskript erzeugt und enthält Fehlerliste,
geprüfte Lizenz-URLs und das Ergebnis des Rendition-Hash-Vergleichs.

## 9. Dateien

| Datei | Inhalt |
|---|---|
| `docs/kristalle/image-sources.json` | Manifest: 30 Kristalle, je 1 dokumentierter Kandidat mit allen Pflichtfeldern, Lizenzkompatibilität und Auswahlgrund |
| `docs/kristalle/image-sources.evidence.json` | Beleg-Snapshot: API-Felder, Lizenzvorlagen aus dem Wikitext, Wikitext-SHA-256 |
| `docs/kristalle/image-sources.validation.json` | Ergebnis der automatischen Prüfung (0 Fehler) |
| `docs/kristalle/scripts/validate-image-sources.py` | Prüfskript: Pflichtfelder, Lizenz-Allowlist, `target_path` == `image_placeholder`, Live-Lizenz-URLs, Rendition-SHA-256 |
| `docs/kristalle/BILDQUELLEN.md` | dieses Dokument (Auswahlbegründung, Pflichten, Grenzen) |
