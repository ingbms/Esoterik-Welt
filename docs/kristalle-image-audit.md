# Kristalle-Sektion — Bildinventar und Integrationspunkte

Stand: 02.11.2026 · Arbeitsbaum `C:/Users/mas/Arbeit/Esoterik-Welt` (Branch `main`, inkl. noch nicht
committeter Änderungen anderer Läufe) · Autor: Audit-Lauf `t_121a9c84`
Art: reine Dokumentation — **keine** Änderung an Produktivcode, Daten oder Assets.

## 1. Zweck und Methode

Diese Datei ist die Grundlage für die Bebilderung der Kristalle-Sektion. Sie beantwortet vier Fragen:

1. **Welche** Kristalle brauchen ein Bild? (§4, 30 Einträge)
2. **Wo** im Code wird ein Bild heute gerendert bzw. müsste es gerendert werden? (§3, §5)
3. **Wie** werden Bilder im Projekt heute eingebunden (Formate, `srcset`/`sizes`, Lazy Loading,
   Alt-Text, Styles, Build)? (§6, §7)
4. **Welche Attributionspflichten** bestehen im Projekt bereits? (§8)

Erhoben durch Quelltextlesen **und** Laufzeitprüfung: die Seite wurde über einen lokalen
HTTP-Server unter `http://127.0.0.1:8100/Esoterik-Welt/` geöffnet und das Raster im Browser
vermessen (Chromium, `#crystals`). Die Messwerte in §7 sind echte `getBoundingClientRect()`-Werte,
keine Schätzungen.

Wichtig für alle folgenden Abschnitte: `index.html` enthält seit dem Routing-Fix
`<base href="/Esoterik-Welt/" />` (Zeile 39). Alle relativen Pfade — auch Bildpfade — werden also
gegen `/Esoterik-Welt/` aufgelöst. Root-absolute Pfade (`/assets/...`) sind im Projekt **falsch**.

## 2. Kurzbefund

- Die Kristalle-Sektion enthält **30 Kristalle** (`crys-01` … `crys-30`). **Keiner** hat ein Foto;
  alle 30 rendern ein Emoji als Platzhalter (`.crystal-glyph`). Live verifiziert: 30 Karten,
  **0 `<img>`-Elemente**, 30 Glyphen im Raster.
- Jeder Datensatz besitzt bereits ein Feld `image_placeholder` mit dem **geplanten** Zielpfad
  (`assets/crystals/<slug>.jpg`). Das Verzeichnis `assets/crystals/` existiert **nicht**.
- Das Modul liest dieses Feld bewusst **nicht**: `js/modules/crystals.js:53` sagt
  „image_placeholder describes an asset that has not been shipped“, `:54` liest nur `c.image`,
  `:65` fällt sonst auf `emojiForName()` zurück. Ein Bild wird also erst gerendert, wenn ein
  Datensatz ein Feld `image` mit einem Pfad beginnend mit `assets/` (oder `http`) erhält.
- Bilder werden derzeit **ohne** `srcset`/`sizes` eingebunden, mit `alt=""` (dekorativ) und
  `width`/`height` = 320/320. Der Tarot-Bereich im selben Projekt macht es bereits besser und ist
  die maßgebliche Referenz (§6.3).
- Für Kristallbilder existiert **kein** Attributionsfeld, keine Caption und kein Bildnachweis.
  Attributionspflichten entstehen im Projekt bisher nur aus Tarot-Deck und Mineralfotos (§8).
- Offline-Build-Falle: `scripts/build-local.cjs` bricht ab, sobald eine CSS-Datei ein `url(...)`
  außer Fonts enthält (`:61-62`). Kristallbilder dürfen deshalb **nicht** als CSS-`background-image`
  referenziert werden, sondern nur als `<img>` im gerenderten Markup.

## 3. Datenfluss und Einbaustellen (Ist-Zustand)

| Ebene | Datei / Ort | Rolle |
|---|---|---|
| Kanonische Daten | `data/crystals.json` (Zeilen 3–32) | 30 Objekte, Felder `id, name, chemical_formula, hardness, chakra, color, effect, description, image_placeholder, rarity` |
| Datenladen (HTTP) | `js/modules/crystals.js:28-40` | `fetch('./data/crystals.json')`, Fallback auf eingebettetes JSON |
| Datenladen (file://) | `scripts/build-local.cjs:38`, `:78-84` | JSON wird als `<script id="local-crystals-data" type="application/json">` in `Lokal.html` eingebettet |
| Normalisierung | `js/modules/crystals.js:42-68` | `image = c.image || emojiForName(name)`; Emoji-Map `:98-113` |
| Raster-/Listen-Rendering | `js/modules/crystals.js:288-372` | `renderGrid()`, Bildmarkup `:299-303`, Liste `:305-314`, Grid `:316-325` |
| Lazy Loading | `js/modules/crystals.js:329-350` | `data-src` → `src` per `IntersectionObserver` (200 px Vorlauf) bzw. sofort |
| Detail-Dialog | `js/modules/crystals.js:383-418` | Bildbereich `:401-403`, Öffnen `:417` |
| Markup-Anker | `index.html:328-421` (Sektion), `:419` (`#crystalGrid`), `:736-751` (`#crystalModal` / `#crystalModalBody`) | statisches Gerüst; Karten entstehen ausschließlich per JS |
| Styles | `css/design-system.css:403-405` (`.grid-auto`), `:697-706` (`.crystal-card-interactive`); `css/main.css:1025-1123`, `:2530-2551` | Rasterbreite, Karten, Bildfläche, Glyph |
| Build/Publish | `scripts/build-pages.cjs` | kopiert u. a. `assets/`, `css/`, `js/`, `data/` nach `dist/Esoterik-Welt/`, dann `buildLocal()` |

### 3.1 Zwei weitere Kristall-Datenquellen, die **nicht** produktiv sind

| Datei | Inhalt | Status |
|---|---|---|
| `js/data/crystals.js` | 36 Kristalle, IDs wie `amethyst`, `rose-quartz`, `pyrite`, `shungite`; Feld `image` enthält Emojis | **toter Code**: von keiner Anwendung importiert. Nur `tests/f4-fixes-verification.spec.js:32` prüft, dass die Datei als statische Ressource `200` liefert. Wer hier Bilder einträgt, ändert nichts am sichtbaren Ergebnis. |
| `public/js/…`, `public/js/data/crystals.js` | ältere Kopien der Module/Daten | **Legacy-Platzhalter**: `scripts/build-pages.cjs` publiziert ausdrücklich den Repo-Root („no `public/` placeholder“); `index.html` referenziert `public/` nicht. |

Maßgeblich ist ausschließlich `data/crystals.json` → `js/modules/crystals.js`.
Die 36 IDs aus `js/data/crystals.js` sind **keine** gültigen Slugs für dieses Inventar.

## 4. Inventar: 30 Kristalle

Spalten: **ID** = `id` in `data/crystals.json` · **Bild heute** = existiert eine Bilddatei?
**Zielpfad** = bereits hinterlegter `image_placeholder` (Empfehlung: unverändert übernehmen).
Einbaustelle ist für **alle** Einträge identisch und wird in §5 aufgeschlüsselt:
Grid-Karte (`renderGrid`), Listen-Karte (`renderGrid`, `viewMode='list'`) und Detail-Dialog
(`openCrystalModal`).

| # | ID | Anzeigename | Chakra | Farbe | Seltenheit | Bild heute | Zielpfad (`assets/crystals/…`) |
|---|---|---|---|---|---|---|---|
| 1 | `crys-01` | Amethyst | Kronen- & Drittes Auge | Violett | häufig | nein | `amethyst.jpg` |
| 2 | `crys-02` | Quarz (Rosenquarz) | Herz | Rosa | häufig | nein | `rosenquarz.jpg` |
| 3 | `crys-03` | Zitrin | Solare Plexus | Gelb-Gold | selten | nein | `zitrin.jpg` |
| 4 | `crys-04` | Obsidian (Schwarzer Obsidian) | Wurzel | Schwarz | häufig | nein | `obsidian.jpg` |
| 5 | `crys-05` | Lapis Lazuli | Drittes Auge | Dunkelblau / Gold | selten | nein | `lapis.jpg` |
| 6 | `crys-06` | Malachit | Herz | Grün | selten | nein | `malachit.jpg` |
| 7 | `crys-07` | Citrin (Wille) | Solarplexus | Gold-Gelb | häufig | nein | `citrin-wille.jpg` |
| 8 | `crys-08` | Fluorit | Drittes Auge | Violett / Grün | selten | nein | `fluorit.jpg` |
| 9 | `crys-09` | Selenit | Kronen | Weiß / Perlmutter | häufig | nein | `selenit.jpg` |
| 10 | `crys-10` | Schwarzer Turmalin | Wurzel | Schwarz | selten | nein | `schwarzer-turmalin.jpg` |
| 11 | `crys-11` | Aventurin (Grün) | Herz | Grün | häufig | nein | `aventurin.jpg` |
| 12 | `crys-12` | Karneol | Sakral | Orange / Rot | häufig | nein | `karneol.jpg` |
| 13 | `crys-13` | Tigerauge | Solarplexus | Gold / Braun | häufig | nein | `tigerauge.jpg` |
| 14 | `crys-14` | Labradorit | Drittes Auge | Schwarz / Blau / Gold | selten | nein | `labradorit.jpg` |
| 15 | `crys-15` | Petrified Wood | Wurzel | Braun / Rot | selten | nein | `steinholz.jpg` |
| 16 | `crys-16` | Bernstein | Solarplexus | Gelb / Orange | selten | nein | `bernstein.jpg` |
| 17 | `crys-17` | Moonstone (Mondstein) | Herz / Sakral | Weiß / Blau / Pfirsich | häufig | nein | `moonstone.jpg` |
| 18 | `crys-18` | Celestit | Hals / Drittes Auge | Hellblau | selten | nein | `celestit.jpg` |
| 19 | `crys-19` | Granat (Edelstein) | Wurzel / Sakral | Rot / Grün / Gelb | häufig | nein | `granat.jpg` |
| 20 | `crys-20` | Smaragd | Herz | Grün | sehr selten | nein | `smaragd.jpg` |
| 21 | `crys-21` | Rosenquarz (Milch) | Herz | Rosa / Milchig | häufig | nein | `rosenquarz-milch.jpg` |
| 22 | `crys-22` | Amazonit | Herz / Hals | Türkis | selten | nein | `amazonit.jpg` |
| 23 | `crys-23` | Hematit | Wurzel | Metallisch / Schwarz | häufig | nein | `hematit.jpg` |
| 24 | `crys-24` | Kristallquarz (Klare) | Kronen / Alle | Klar | häufig | nein | `quarz-klar.jpg` |
| 25 | `crys-25` | Peridot | Solarplexus | Grün-Gelb | selten | nein | `peridot.jpg` |
| 26 | `crys-26` | Kunzit | Herz | Rosa / Violett | selten | nein | `kunzit.jpg` |
| 27 | `crys-27` | Roter Jaspis | Wurzel / Sakral | Rot / Braun | häufig | nein | `roter-jaspis.jpg` |
| 28 | `crys-28` | Opal (Feueropal) | Kronen | Orange / Rot / Feuer | sehr selten | nein | `feueropal.jpg` |
| 29 | `crys-29` | Aquamarin | Hals / Drittes Auge | Hellblau / Türkis | selten | nein | `aquamarin.jpg` |
| 30 | `crys-30` | Rauchquarz | Wurzel | Graubraun / Rauch | häufig | nein | `rauchquarz.jpg` |

**Summe: 30 von 30 ohne Bild.** Doppelte Motive, die bei der Bildauswahl beachtet werden sollten:
`crys-02` (Rosenquarz) vs. `crys-21` (Milch-Rosenquarz); `crys-03` (Zitrin) vs. `crys-07`
(Citrin/Wille) — beide Paare sind mineralogisch identisch und brauchen bewusst unterschiedliche
Bildmotive (z. B. geschliffen vs. Rohstufe), sonst wirkt der Katalog doppelt.

Zwei Anzeigenamen sind noch englisch (`Petrified Wood`, `Moonstone (Mondstein)`); das ist ein
Text-Thema, kein Bild-Thema, und hier nur notiert.

## 5. Einbaustellen im Detail

Alle drei Darstellungen werden **ausschließlich** in `js/modules/crystals.js` erzeugt. Es gibt kein
statisches Kristall-Markup in `index.html`.

### 5.1 Grid-Karte (Standardansicht)

```js
// js/modules/crystals.js:299-303  (Bildteil, von Grid und Liste geteilt)
const imgPart = c.image
  ? c.image.startsWith('assets/') || c.image.startsWith('http')
    ? `<img data-src="${c.image}" alt="" loading="lazy" decoding="async"
            width="320" height="320"
            style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : `<div class="crystal-glyph">${c.image}</div>`
  : '';
```

```html
<!-- js/modules/crystals.js:316-325 — Karte im Raster -->
<article class="card crystal-card crystal-card-interactive" data-id="crys-01">
  <div class="crystal-image" style="aspect-ratio:1;overflow:hidden;background:var(--color-bg-deep);
       display:flex;align-items:center;justify-content:center;">…imgPart…</div>
  <div class="crystal-content">
    <div class="flex justify-between items-start gap-2">
      <h2 class="crystal-name">Amethyst</h2>
      <button … class="btn btn-ghost btn-sm favorite-btn" aria-label="Als Favorit speichern" data-id="crys-01">♡</button>
    </div>
    <div class="crystal-meta">…Chakra-Badges… <span class="badge badge-secondary">Violett</span></div>
    <p class="crystal-desc">…</p>
    <button … class="btn btn-secondary btn-sm crystal-details-btn">Details anzeigen</button>
    <div class="text-muted" style="font-size:.75rem;margin-top:.25rem;">SiO₂ · Härte 7</div>
  </div>
</article>
```

Beobachtet am 02.11.2026 im Browser: `<article class="card crystal-card crystal-card-interactive"
data-id="crys-01">` mit `<div class="crystal-glyph">💜</div>` in `.crystal-image`.

### 5.2 Listen-Karte

`js/modules/crystals.js:305-314` — dieselbe `imgPart`, aber Bildfläche als
`<div class="crystal-thumb" style="flex:0 0 120px;min-height:120px;…border-radius:var(--radius-md);overflow:hidden;">`.
Bildgröße dort: 120 × 120 CSS px (Desktop), auf schmalen Viewports volle Breite × 200 px Höhe
(`css/main.css:2406-2414`).

### 5.3 Detail-Dialog

```js
// js/modules/crystals.js:399-404
<div class="crystal-detail-layout">
  <div class="crystal-detail-image">
    ${c.image && c.image.startsWith('assets/')
      ? `<img src="${c.image}" alt="" decoding="async" width="320" height="320">`
      : `<div class="crystal-glyph crystal-glyph--large">${c.image}</div>`}
    ${c.image && c.image.startsWith('assets/')
      ? ''
      : '<p class="crystal-glyph-note">Platzhalter-Symbol · kein Foto im Projekt</p>'}
  </div>
  …
```

- Die Honesty-Notiz „Platzhalter-Symbol · kein Foto im Projekt“ verschwindet automatisch, sobald
  `image` mit `assets/` beginnt. Sie darf nicht manuell entfernt werden, solange Platzhalter läuft.
- Der Dialog hat **keine** Zoom-Funktion (anders als Tarot, siehe §6.3) und **keinen** Bildnachweis.
- Der Dialogkörper ist ein Container (`#crystalModalBody { container-type: inline-size }`,
  `css/main.css:1074-1076`); ab 36 rem Containerbreite zweispaltig `1fr / 2fr`
  (`css/main.css:1102-1106`). Gemessen bei 1440 px Viewport: Modal 720 px, Bildspalte **215 px**.

### 5.4 Auswahl/Filter (nicht bildrelevant, aber Falle)

`index.html:337-368` enthält die `<select id="chakraFilter">` / `<select id="colorFilter">`. Diese
beiden Elemente werden von `js/modules/crystals.js` **nicht** verdrahtet — das Modul baut seine
eigene Filter-UI in `#crystalFilterContainer` (`:159-221`). Nur `tests/smoke-test-production.spec.js:126-139`
bedient die Selects. Wer die Sektion anfasst, sollte sich nicht auf diese Selects verlassen.

## 6. Wie Bilder heute eingebunden werden

### 6.1 Ist-Zustand in der Kristalle-Sektion

| Aspekt | Ist | Bewertung |
|---|---|---|
| Format | `.jpg` (nur im Platzhalterpfad; real kein Bild vorhanden) | Tarot liefert ebenfalls JPEG |
| Responsive | **kein** `srcset`, **kein** `sizes`; ein fester Pfad | Für 230–510 px breite Boxen mit DPR 2 unzureichend |
| Lazy Loading | `data-src` + `loading="lazy"` + `IntersectionObserver` (200 px), Fallback sofortiges Laden (`:329-350`) | gut, aber `srcset` müsste im Observer mitgesetzt werden (Tarot macht das, §6.3) |
| Intrinsische Maße | `width="320" height="320"` fest | verhindert CLS, passt aber nicht zur echten Zielbreite (bei DPR 2 bis 1020 px nötig) |
| Alt-Text | `alt=""` (dekorativ) in Grid, Liste **und** Dialog | **Lücke**: das Bild ist der Inhalt der Karte, nicht Dekoration |
| Caption/Attribution | keine | **Lücke** (siehe §8) |
| Fallback | Emoji-Glyph, entsättigt (`filter:saturate(.4)`, `css/main.css:2530-2535`) | bewusste, dokumentierte Übergangslösung (QA-Grenze „N3“) |
| Fehlerfall | kein `error`-Handler; ein fehlendes Bild hinterlässt leere Fläche | Tarot hat dafür `is-missing` + Textersatz (§6.3) |

### 6.2 Styles, die das Bild bestimmen

```css
/* css/main.css:1032-1038 */
.crystal-image { width:100%; aspect-ratio:1; object-fit:cover; background:var(--color-bg-deep); border-bottom:1px solid var(--color-border); }
/* css/main.css:1086-1101 */
.crystal-detail-image { width:100%; aspect-ratio:1; border:1px solid var(--color-border); background:var(--color-bg-deep); display:flex; align-items:center; justify-content:center; }
.crystal-detail-image img { display:block; width:100%; height:100%; min-width:0; object-fit:cover; }
/* css/main.css:2530-2551 — Glyph + Honesty-Notiz */
.crystal-glyph { font-size:2.25rem; line-height:1; filter:saturate(0.4); opacity:0.85; }
```

Zusätzlich: `object-fit: cover` plus quadratische Fläche heißt **harter Beschnitt**. Die
Art-Direction des Projekts verlangt das Gegenteil („keine Spitzen kappen“,
`docs/art-direction-nachtatelier/index.html`, Referenzboard DO/DON'T). Für Kristallfotos ist
`contain` mit ruhigem Hintergrund oder ein bewusst quadratisch produziertes Motiv die
projekttreue Lösung — das ist eine Design-Entscheidung, die die Spec-Karte treffen muss.

Druck: `css/main.css:2467-2470` blendet `.crystal-image` im Druck komplett aus. Ein Bildnachweis
in der Karte ist damit nicht druckrelevant.

### 6.3 Referenz im selben Projekt: Tarot (maßgebliche Konvention)

```js
// js/modules/tarot.js:29
const GRID_SIZES = '(min-width: 1024px) 200px, (min-width: 640px) 26vw, 46vw';
// js/modules/tarot.js:190-205
<img class="tarot-image" data-src="${thumb}" data-srcset="${thumb} 300w, ${detail} 600w"
     sizes="${GRID_SIZES}" width="300" height="500" loading="lazy" decoding="async" alt="" />
// js/modules/tarot.js:218-224 — Observer setzt src UND srcset
image.src = image.dataset.src;
if (image.dataset.srcset) image.srcset = image.dataset.srcset;
image.removeAttribute('data-src'); image.removeAttribute('data-srcset');
// js/modules/tarot.js:354-367 — Detail mit beschreibendem Alt-Text und figcaption
<img class="tarot-detail-image" src="${detailImage}" width="600" height="1000" decoding="async"
     alt="${esc(card.name)} · ${esc(card.numeral)} — Karte aus dem Deck „${esc(this.deck.label)}“" />
<figcaption class="tarot-detail-caption">${esc(card.numeral)} · ${esc(arcanaLabel(card))} · ${esc(this.deck.aspect)}</figcaption>
```

Konvention daraus: **Thumbnails `alt=""`** (der umgebende Button/Karte trägt den Namen),
**Detailbild mit sprechendem Alt-Text**; Tests erzwingen das (`tests/tarot-deck.cjs:179,210`,
`tests/tarot-decks-v2.cjs:368,393`).

## 7. Gemessene Bildflächen und empfohlene `srcset`-Stufen

Gemessen mit `getBoundingClientRect()` (CSS px) im Raster, `devicePixelRatio = 2`:

| Viewport | Spalten | Kartenbreite | Bildfläche (quadratisch) | benötigte Intrinsic-Breite @2× |
|---|---|---|---|---|
| 360 | 1 | 232 | 230 | 460 |
| 480 | 1 | 352 | 350 | 700 |
| 640 | 1 | 512 | 510 | **1020** |
| 768 | 2 | 308 | 306 | 612 |
| 1024 | 3 | 283 | 281 | 562 |
| 1280 | 3 | 368 | 366 | 732 |
| 1440 | 4 | 310 | 308 | 616 |
| 1920 | 4 | 322 | 320 | 640 |
| Dialog 1440 | – | – | 215 | 430 |
| Liste (Desktop) | – | – | 120 × 120 | 240 |

Daraus abgeleitet (Vorschlag, in der Spec-Karte zu bestätigen):

- **Drei Stufen** genügen: `320w` (Liste/1×), `640w` (2× Raster, Dialog 2×), `1280w`
  (breiteste Einzelspalte bei 2×, Reserve für Zoom). Damit ist der Worst Case 640/1020 px gedeckt,
  ohne je ein 2400-px-Foto in den Katalog zu laden.
- `sizes` passend zur gemessenen Rasterlogik (`.grid-auto` = `auto-fill minmax(min(100%,280px),1fr)`,
  `css/design-system.css:403-405`, Lücke 24 px, Container max. 1360 px + Gutter):

```
sizes="(min-width: 1440px) 320px, (min-width: 1024px) 29vw, (min-width: 768px) 42vw,
       (min-width: 480px) 92vw, 66vw"
```

- `width`/`height` sollten die **echte** Zielgröße der größten Stufe oder ein konsistentes
  Seitenverhältnis abbilden (z. B. `width="640" height="640"` für 1:1) — nicht 320, wenn 510 CSS px
  erreicht werden. Das Seitenverhältnis muss 1:1 bleiben, sonst springt das Raster (CLS).
- Wenn die Motive nicht 1:1 produziert werden, ist `object-fit` die Stellschraube:
  `cover` = Beschnitt (heute), `contain` = vollständige Silhouette auf `--color-bg-deep`.

## 8. Attributionsanforderungen im Projekt (Ist-Zustand)

Es gibt **keine** zentrale Bildrechte-Richtlinie, aber vier gelebte Muster, die eine
Kristall-Bebilderung erfüllen muss.

**a) Bildnachweis direkt am Bild (Startseite).**
`index.html:120-132` (Hero) und `:153-163` (Materialstudie):

```html
<figure class="specimen">
  <img class="mineral" src="assets/mineral/quartz-light-2400.jpg" width="2400" height="2045"
       alt="Räumliche Bergkristallgruppe vor dunklem Grund: … vollständig im Bild" />
  <figcaption class="caption">
    Bergkristall · Fotografie: Didier Descouens · CC BY-SA 4.0<br />
    Gewachsene Form, gerichtete Reflexe, echte Einschlüsse.
  </figcaption>
</figure>
```

Muster: `Fotografie: <Urheber> · <Lizenz>` in einer `figcaption.caption`, dazu ein
beschreibender Alt-Text und ein dekorationsfreies, vollständig sichtbares Motiv.

**b) Sammelnachweis im Impressum.** `impressum.html:80-138` (`#tarot-decks`) listet je Deck
Bildvorlagen, Quelle/Abrufdatum, Urheber, Lizenz(-link), **Art der Änderungen**, Lizenz der
bearbeiteten Fassung und eine „Empfohlene Namensnennung“. Das ist der Ort für einen Abschnitt
„Kristallfotografien“.

**c) Quellen-/Rechtemanifest je Bildpaket.** `docs/tarot-deck-v2/QUELLEN-RECHTS-MANIFEST.md`
(Abschnitte Bildmotive / Schriften / Kartenidentitäten, mit SHA-256 der Quelldaten) und
`docs/tarot-deck-nachtatelier/QUELLEN-RECHTS-MANIFEST.md`. Für Kristalle das Gegenstück:
`docs/kristalle/QUELLEN-RECHTS-MANIFEST.md`.

**d) Maschinenlesbares Asset-Manifest.** `assets/tarot/nachtatelier-v1/manifest.json`:
`deck_id`, `levels {thumb,detail,zoom}`, je Datei `path`, `bytes`, `sha256`, `size [w,h]`.
Dasselbe Schema passt 1:1 auf `assets/crystals/manifest.json`.

**Konkrete Pflichten, die sich daraus ergeben:**

1. Bei CC BY / CC BY-SA: Urheber, Quellseite, Lizenzname **und** Lizenz-URL, Abrufdatum,
   sowie „Änderungen“ (Beschnitt, Skalierung, Farbton), wenn bearbeitet wurde.
2. CC BY-SA ist **ShareAlike**: bearbeitete Bildfassungen müssen unter CC BY-SA weitergegeben
   werden; das ist im Impressum auszuweisen (`impressum.html:106-110` macht das für die Textur vor).
3. Public Domain/CC0: Herkunftsnachweis bleibt sinnvoll (Projektstandard), Lizenzlink optional.
4. Keine NC-/ND-Lizenzen ohne ausdrückliche Projektfreigabe (so fordert es auch die
   Bildrecherche-Karte `t_75514188`).
5. Der Footer der Produktivseiten enthält **keinen** Link „Bildnachweise“ (nur der
   Art-Direction-Entwurf `docs/art-direction-nachtatelier/index.html` hatte einen). Ein
   Impressum-Anker (`impressum.html#kristalle-fotos`) ist der kleinste Eingriff.

## 9. Asset- und Build-Konventionen, die eingehalten werden müssen

1. **Ablageort:** `assets/<domäne>/…`, hier neu `assets/crystals/`. `scripts/build-pages.cjs`
   kopiert `assets/` rekursiv nach `dist/Esoterik-Welt/`; Dateien mit `_`-Präfix oder `.bak` werden
   ausgelassen. Alles außerhalb von `assets/` wird nicht ausgeliefert.
2. **Stufung wie Tarot:** Unterordner je Breite (`300/`, `600/`, `1200/`) oder flache Namen
   `<slug>-320.jpg` … — im Projekt ist die Ordnerstruktur
   (`assets/tarot/<deck>/{300,600,1200}/<id>.jpg`, `js/data/tarot-decks.js:25-26,94-101`)
   der eingeführte Weg. Empfehlung: `assets/crystals/{320,640,1280}/<slug>.jpg`.
3. **Pfadform:** immer relativ, **beginnend mit `assets/`**. Das Modul akzeptiert nur
   `startsWith('assets/')` oder `http` (`js/modules/crystals.js:300`); `<base href="/Esoterik-Welt/">`
   löst das korrekt auf, `/assets/…` würde brechen.
4. **Kein `url()` in CSS.** `scripts/build-local.cjs:61-62` wirft
   „Inline new CSS assets explicitly before shipping offline“, sobald eine eingebundene
   CSS-Datei ein `url(...)` außer Fonts enthält. Bilder gehören ins Markup, nicht in
   `background-image`.
5. **Offline-Edition:** `Lokal.html` bettet CSS/JS/JSON ein, **nicht** Bilder; relative
   `assets/…`-Pfade bleiben Dateiverweise neben `Lokal.html`
   (`scripts/build-local.cjs:57-60` legitimiert das für Fonts). `tests/offline-file.cjs:31`
   verbietet nur `http(s)`-Requests — lokale Bilddateien sind zulässig, müssen aber im
   `dist`-Paket neben der Datei liegen. Fehlt eine Datei, erzeugt `requestfailed` einen
   Testfehler: fehlende Kristallbilder fallen also im Offline-Test auf.
6. **Keine neuen Build-Schritte nötig:** `data/crystals.json` wird unverändert gelesen bzw.
   eingebettet; ein Bildfeld ist reine Datenänderung. `npm run build` (Seiten + Offline) bleibt
   der Prüfpfad, `npm run lint`/`format:check` betreffen `docs/` nicht (`.prettierignore`).
7. **Git:** `*.jpg` ist in `.prettierignore`; `.gitattributes` markiert keine Binärpfade,
   `core.autocrlf` ist für JPEG irrelevant. Große Masters nicht ins Repo — Tarot liefert nur
   Web-Derivate aus (`impressum.html:84-85`).

## 10. Integrationshinweise (Checkliste für die Umsetzung)

1. **Datenfeld einführen.** In `data/crystals.json` je Objekt `image` ergänzen (z. B.
   `"image": "assets/crystals/320/amethyst.jpg"` bzw. Basispfad + Stufen). `image_placeholder`
   erst löschen, wenn alle 30 Bilder liegen — das Feld ist der einzige dokumentierte Zielpfad.
   Das Modul braucht dafür **keine** Änderung (`c.image`, `:54`).
2. **Markup erweitern.** In `renderGrid` `data-srcset` und `sizes` ergänzen (Muster Tarot
   `:196-197`) und im Observer `srcset` mitpromoten (`:218-224`-Analogon in
   `js/modules/crystals.js:331-334`). Ohne diesen zweiten Schritt bleibt `srcset` wirkungslos.
3. **Alt-Texte.** Raster/Liste: `alt=""` beibehalten **nur** wenn der Kartenname das Motiv
   eindeutig benennt (er tut es: `h2.crystal-name`) — sonst sprechendes Alt. Dialog: sprechendes
   Alt nach Tarot-Vorbild (`Name · Farbe · Bildtyp`).
4. **Honesty-Notiz** nur im Platzhalterfall stehen lassen (`:403`), nicht vorab entfernen.
5. **Attribution.** Pro Karte eine knappe Caption im Dialog (`figcaption`-Muster) **plus**
   Impressum-Abschnitt `#kristalle-fotos` mit Urheber, Quelle, Lizenz-URL, Änderungen und
   empfohlener Namensnennung; zusätzlich `docs/kristalle/QUELLEN-RECHTS-MANIFEST.md` und
   `assets/crystals/manifest.json` (Schema aus `assets/tarot/nachtatelier-v1/manifest.json`).
6. **Fehlerfall.** `error`-Handler + `is-missing`-Zustand wie im Tarot-Modul
   (`js/modules/tarot.js:227-243`, „Bild nicht verfügbar“), damit
   ein fehlendes Foto nicht als leere Fläche erscheint, sondern als benannter Fehlzustand.
7. **Größen.** `width`/`height` auf die größte Stufe setzen, Seitenverhältnis 1:1 halten;
   `object-fit`-Entscheidung (`cover` vs. `contain`) in der Spec treffen.
8. **Offline prüfen.** `npm run build:local && node --test tests/offline-file.cjs` — fehlende
   Bilddateien schlagen hier als `requestfailed` auf.
9. **Keine Bildreferenzen in CSS** aufnehmen (Build-Guard, §9.4).
10. **Nicht anfassen:** `js/data/crystals.js` (toter Code, 36 fremde IDs), `public/` (Legacy),
    `<base href>` (Routing-Fix).

## 11. Offene Punkte für die Folgeschritte

- **Bildauswahl/Lizenzen:** Karte `t_75514188` (Manifest mit Urheber, Lizenz, URL, Abrufdatum).
- **Visuelle Kohärenz, Beschnitt, Caption-Platzierung, Alt-Text-Stil:** Karte `t_5ca258cb`
  (`docs/kristalle-gallery-spec.md`). Offen sind dort insbesondere: `cover` vs. `contain`,
  quadratische Produktion vs. Beschnitt, Ort der Attribution (Karte/Dialog/Impressum) und das
  Verhalten auf 640–767 px (eine Spalte, 510 px Bildfläche — größter Ladefall).
- **Rechtliche Prüfung** der gewählten Lizenzen vor Veröffentlichung (Projektstandard:
  keine Freigabe ohne dokumentierte Quelle, vgl. `impressum.html:80-138`).

## 12. Geprüfte Quellen (Belege)

`data/crystals.json:3-32` · `js/modules/crystals.js:28-40,42-68,98-113,288-372,383-418` ·
`index.html:39,328-421,736-751` · `css/main.css:1024-1123,2395-2434,2436-2480,2527-2551` ·
`css/design-system.css:383-405,692-706,758-766` · `scripts/build-local.cjs:38,57-71,78-84` ·
`scripts/build-pages.cjs` · `js/data/tarot-decks.js:14-47,94-117` · `js/modules/tarot.js:29,190-250,354-367` ·
`assets/tarot/nachtatelier-v1/manifest.json` · `impressum.html:80-138` ·
`docs/tarot-deck-v2/QUELLEN-RECHTS-MANIFEST.md` · `docs/art-direction-nachtatelier/HANDOFF-TAROT.md:15-18` ·
`tests/offline-file.cjs:29-32` · `tests/f4-fixes-verification.spec.js:26-45` ·
`tests/tarot-deck.cjs:179,210` · Laufzeitmessung Chromium, `#crystals`, 02.11.2026.
