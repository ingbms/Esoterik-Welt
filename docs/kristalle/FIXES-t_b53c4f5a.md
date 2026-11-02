# Behebung der Review-Befunde `t_385afa1e` (Kristalle)

**Task:** `t_b53c4f5a` · **Branch:** `feature/kristalle-review-fixes` · **Datum:** 2026-11-02
**Basis:** `main` @ `5d327ed` · **Commits:** `948e361` (Code/Bilder), `4de2131` (Nachweise/Doku), dieser Bericht
**Prüfobjekt:** `C:/Users/mas/Arbeit/Esoterik-Welt` (Arbeitsbaum, Branch `feature/kristalle-review-fixes`)

## 1. Ergebnis auf einen Blick

| Befund | Status | Beleg |
|---|---|---|
| **P0** Arbeitsstand nicht committet | **behoben** | `git ls-files assets/crystals` → 121 (120 WebP + Manifest); Clean-Clone baut 120 WebP nach `dist/`; CI grün |
| **P1.1** `attribution_text_required` falsch (11 Bilder) | **behoben** | Text wird aus `credit.changes` + `production` erzeugt; 30/30 deckungsgleich; `npm run test:crystals` 8/8 |
| **P1.2** Impressum-Links nur farblich unterschieden | **behoben** | `.crystal-credits a { text-decoration: underline; text-underline-offset: 2px }`; im Browser 1440 und 360 gemessen |
| **P2.1** helle Fotoplatten / kontrastarme Kacheln | **teilweise, begründet** | Museumstafel-Entscheidung dokumentiert + einheitliche Innenkante; kein Freistellen, keine Ersatzmotive |
| **P2.2** Alt-Texte mit falschem Grund | **behoben / teils widerlegt** | `crys-28` korrigiert; `crys-18` nach Messung korrekt (Begründung unten) |
| **P2.3** Dialog 360 px scrollpflichtig | **behoben** | Platte 240 px bei ≤ 380 px; Nachweiszeile bei 360 × 640 vollständig sichtbar (−37 px Reserve) |
| **P3** Doku-Ungenauigkeiten | **behoben** (zwei Punkte bewusst offen) | Impressum/Index/INTEGRATION präzisiert, `adaptation_license` im Manifest |

## 2. P0 — Versionierung und Clean-Clone-Gegenprobe

**Änderung:** `assets/crystals/**` (120 WebP, `manifest.json`) sowie `data/crystals.json`,
`js/modules/crystals.js`, `js/dialog.js`, `css/main.css`, `css/design-system.css`, `index.html`,
`impressum.html`, `scripts/verify-crystals.cjs` sind in `948e361` versioniert; Nachweise und
Doku in `4de2131`.

**Gegenprobe (frischer Clone von `origin/feature/kristalle-review-fixes` @ `4de2131`):**

```bash
git clone --depth 1 -b feature/kristalle-review-fixes https://github.com/ingbms/Esoterik-Welt.git
cd Esoterik-Welt && npm ci && npm run build
```

| Prüfung | Ergebnis |
|---|---|
| `git ls-files assets/crystals` | 121 Dateien (120 WebP + `manifest.json`) |
| WebP je Stufe in `dist/Esoterik-Welt/assets/crystals/` | 30 / 30 / 30 / 30 (320/640/960/1280) = **120** |
| `dist/Esoterik-Welt/index.html` verweist auf `assets/crystals/` | ja (Sektionsfuß nennt das Verzeichnis) |
| `dist/…/impressum.html#kristalle-fotos` | **30** Einträge, je Lizenz- und Quelllink |
| `dist/…/data/crystals.json` | 0 × `image_placeholder`, 30 Bildpfade |
| Browser (Chromium, 1440 px) auf dem Clone-Build | 30 Karten, 30 `img.crystal-photo`, 0 Glyph-Fallbacks, 0 fehlerhafte Bildantworten, 30 verschiedene WebP-Anfragen |
| `npm run build` im Clone | Exit 0 |

**CI** (`ci.yml`, Push-Trigger): Lauf `41503773053` auf `4de2131` — Lint ✓, Unit Tests ✓
(inkl. neuem `test:crystals`), Static Build ✓, Browser E2E ✓. Der erste Lauf (`41503101011`,
`948e361`) schlug fehl, weil der Regressionstest den Sammelnachweis liest, der erst mit dem
Doku-Commit vorlag — die Abhängigkeit ist mit `4de2131` aufgelöst; der Branch-Stand ist grün.

## 3. P1.1 — Lizenztexte aus einer Quelle der Wahrheit

**Regel** (`scripts/lib/crystal-attribution.cjs`): `attribution_text_required` wird aus
`credit.author`, `credit.license`, `credit.license_url`, `credit.source_url`, `credit.share_alike`
und **`credit.changes`** gebaut; `production.mode` (`matte` → „Motiv freigestellt") und
`production.retouch` werden ergänzt, falls `credit.changes` sie nicht schon nennt. Der Text der
Bildrecherche (`image-sources.json` → `.selection.json`) wird **nicht** mehr übernommen.

**Verteilung** (unverändert): 30 Bilder, davon 11 namensnennungspflichtig (BY/BY-SA) und
5 ShareAlike. Für alle 30 gilt jetzt: vier Stufen `320/640/960/1280 px (WebP)`, kein Beschnitt,
kein JPEG.

**Synchronisation:** `node scripts/sync-crystal-attribution.cjs` schreibt
`assets/crystals/manifest.json`, `data/crystals.json`, `docs/kristalle/QUELLEN-RECHTS-MANIFEST.md`
und spiegelt `credit.alt` → `image_alt`. `--check` meldet Abweichungen:

```text
$ node scripts/sync-crystal-attribution.cjs --check
OK: 30/30 attribution_text_required deckungsgleich.
```

**Regressionstest** `tests/crystals-attribution.cjs` (`npm run test:crystals`, 8 Tests, alle grün)
prüft unter anderem:

* 30 Bilder × 4 Stufen vorhanden, Bytes == Manifest;
* `checkAttributionText` → 0 Abweichungen (Text identisch mit der Ableitung);
* kein „Beschnitt/Zuschnitt", kein „JPEG", nicht „320/640/1280 px" (URLs werden vor der Prüfung entfernt);
* `credit.changes` **wörtlich** im Text enthalten; bei `production.retouch != null` ist die
  Retusche genannt (`retuschiert`/`entfernt`/`bereinigt`);
* 11 namensnennungspflichtige Bilder mit Lizenz und Quelle; 5 ShareAlike mit
  `adaptation_license` (Name + URL == `credit.license`);
* `data/crystals.json` und der Sammelnachweis stimmen zeichengleich mit dem Manifest überein.

**Beispiel `crys-17`** (CC BY-SA 4.0, Retusche `row_bg`), jetzt:

> „Kamień księżycowy (moonstone) - Larvik k. Oslo. Norwegia" – Lech Darski, lizenziert unter
> Creative Commons Namensnennung – Weitergabe unter gleichen Bedingungen 4.0 —
> https://creativecommons.org/licenses/by-sa/4.0. Quelle: <Quellseite>. Änderungen: 1:1-Leinwand
> mit 6 % Rand, Hintergrund auf #0b1012 vereinheitlicht, **eingebettete Maßstabs-Miniatur „56 mm"
> entfernt**, Skalierung auf 320/640/960/1280 px (WebP). Bearbeitete Bildfassungen werden unter
> derselben Lizenz weitergegeben (ShareAlike).

`crys-15` (CC0, Retusche `clone_up`) nennt jetzt ebenfalls den entfernten Maßstabsbalken.

**Generator nachgezogen:** `docs/kristalle/scripts/build-integration.py` ruft dieselbe Regel über
`scripts/lib/crystal-attribution.cjs` auf; ein Neuaufbau kann den Fehler nicht wiederholen.
Die 11 Attributionsentwürfe in `docs/kristalle/image-sources.json` sind korrigiert; der
Ableitungsweg `extract-selection.py → build-integration.py` bleibt gültig.

## 4. P1.2 — Links im Impressum (WCAG 1.4.1)

```css
/* css/main.css */
.crystal-credits a {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.crystal-sources a { …ebenfalls unterstrichen… }
```

Gemessen im gebauten Stand (`node docs/kristalle/scripts/verify-a11y-fixes.cjs`):

| Viewport | Links | `text-decoration-line` | `text-underline-offset` | Linkfarbe / Fließtext |
|---|---|---|---|---|
| 1440 px | 60 (30 × Lizenz + Quelle) | `underline` | `2px` | `rgb(198,179,142)` / `rgb(186,189,183)` |

Bei 360 px identisch; Screenshots `evidence/kristalle-fixes-t_b53c4f5a/impressum-links-{1440,360}.png`.
Das Kriterium „nicht allein durch Farbe" ist damit erfüllt, ohne die Farbwerte zu ändern.

## 5. P2.1 — Visuelle Kohärenz: Museumstafel

Entscheidung und Begründung: `docs/kristalle/DESIGN-MUSEUMSTAFEL.md`. Kurz: Die Fotoplatte
bleibt (kein nachträgliches Freistellen, keine Ersatzmotive — beides würde die SHA-256-Kette und
die dokumentierten Änderungen neu aufrollen), die Kacheln erhalten eine einheitliche weiche
Innenkante:

```css
.crystal-image::after { border: 1px solid rgba(186,189,183,.12);
                        box-shadow: inset 0 0 26px 12px rgba(11,16,18,.55); }
```

Sichtprüfung bei 1440 px: `evidence/kristalle-fixes-t_b53c4f5a/grid-1440.png`. Die zehn hellen
Motive (crys-21 54,9 % … crys-28 20,9 %) bleiben hell — sie werden gerahmt, nicht abgedunkelt.
`crys-04`/`crys-10` bleiben strukturschwach; das ist eine Eigenschaft der Motive.

## 6. P2.2 — Alt-Texte und gemessener Grund

Neues Messskript `docs/kristalle/scripts/measure-plate-ground.py` → `docs/kristalle/plate-ground.json`
(Randstreifen der Fotoplatte im gelieferten 1280er-WebP; Klassen: hell ≥ 0,30, dunkel ≤ 0,12).

* **`crys-28` korrigiert:** Randstreifen oben **0,496** (hell) — Alt-Text sagt jetzt
  „… vor hellem Studiohintergrund" statt „vor dunklem Grund".
* **`crys-18` geprüft, Befund trifft nicht zu:** oberer Randstreifen **0,024** (dunkel), nur der
  untere Rand erreicht 0,476, weil die Kristallgruppe selbst bis an die Bildkante reicht. Die
  Grundangabe „vor dunklem Grund" ist richtig; der Review-Messwert („Rand bis 0,36") misst das
  Motiv, nicht den Hintergrund. Der Alt-Text bleibt unverändert.
* Übrige 28 Alt-Texte: kein Widerspruch zur Messung; der Regressionstest
  (`Alt-Texte widersprechen der gemessenen Grundhelligkeit nicht`) hält das fest.

## 7. P2.3 — Dialog bei 360 px

```css
@media (max-width: 380px) { .crystal-detail-image { width: min(100%, 240px); margin-inline: auto; } }
```

Gemessen mit `verify-a11y-fixes.cjs` (Scrollbehälter ist die Dialogplatte, `overflow:auto`):

| Viewport | Plattenbreite | letzte Zeile der Änderungen | Panel-Unterkante | Reserve |
|---|---|---|---|---|
| 360 × 900 | 240 px | 579 px | 876 px | 297 px |
| 360 × 640 | 240 px | 579 px | 616 px | 37 px |

`panelScrollTop` ist in beiden Fällen 0 — der vollständige Nachweis (Urheber, Lizenz, Quelle,
Änderungen) steht ohne Scrollen. Screenshot: `dialog-360x640.png`.

## 8. P3 — Dokumentation

* `impressum.html` und `index.html`: „quadratischer 1:1-Zuschnitt" → **„1:1-Leinwand mit 6 % Rand"**,
  ergänzt „Kein Motiv wurde beschnitten"; Generator (`build-integration.py`) und
  `impressum-snippet.html` gleichlautend.
* `INTEGRATION-t_12a8db50.md`: Eckproben-Aussage präzisiert — **Master** exakt `#0b1012`,
  ausgelieferte WebP **≤ 3/255** (Kantenglättung).
* Manifest: neues Feld `adaptation_license` (Name + URL der bearbeiteten Fassung) für die
  5 ShareAlike-Bilder, `null` bei allen anderen; im Test geprüft.
* `docs/kristalle/.selection.json` ist eine abgeleitete Zwischendatei (aus `image-sources.json`)
  und wird nicht mehr versioniert (`.gitignore`), damit keine veralteten Lizenztexte im
  Repository stehen.
* **Bewusst nicht adressiert:** fehlende `LICENSE`-Datei und „© 2025" im Footer sind
  vorbestehend und nicht Teil dieses Tasks (siehe P3 des Reviews); eine Änderung wäre eine
  Projektentscheidung außerhalb der Kristalle-Sektion.

## 9. Abnahmelauf (lokal, Branch-Stand vor dem Doku-Commit)

| Befehl | Ergebnis |
|---|---|
| `npm run build` | Exit 0 |
| `npm run lint` | 0 Warnungen |
| `npm run format:check` | „All matched files use Prettier code style" |
| `npm test` | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 |
| `npm run test:crystals` | 8/8 |
| `npx playwright test` | 74/74 |
| `node scripts/sync-crystal-attribution.cjs --check` | 30/30 deckungsgleich |
| `node docs/kristalle/scripts/verify-a11y-fixes.cjs` | P1.2 PASS (1440/360), P2.3 PASS (360×900, 360×640) |
| CI `41503773053` | Lint ✓, Unit ✓, Static Build ✓, Browser E2E ✓ |

## 10. Grenzen

* Keine juristische Endbewertung; geprüft ist die technische Erfüllung (TASL-Bestandteile,
  Änderungsanzeige, ShareAlike-Hinweis).
* Kein Screenreader-Test; geprüft wurden DOM/CSS, Fokusverhalten (unverändert), Kontraste und
  Sichtbarkeit im Browser.
* P2.1 ist eine Gestaltungsentscheidung, keine Messgröße: die Bilder selbst sind unverändert
  (120 Dateien, Bytes/SHA-256 == Manifest).
* `evidence/` mit Screenshots ist bewusst nicht versioniert (Task-Vorgabe); die Pfade sind oben
  genannt und mit `verify-a11y-fixes.cjs` reproduzierbar.
