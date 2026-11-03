# Release t_3ad4ec40 — Nachtatelier, 78er-Tarot, Mond, Astrologie

Stand: 02.11.2026 · Release-Karte `t_3ad4ec40` · Profil `coding_debug` · Modellroute `deepseek/deepseek-flash`
Freigabegrundlage: unabhängige Gesamt-QA `t_60bec033` (Urteil „passed", HEAD `1f2726c`, Prüfstand = Arbeitsbaum mit 93 uncommitteten Einträgen).

## 1. Ergebnis in einer Zeile

Der geprüfte Stand ist als **Commit `6a3eee1`** auf `main` veröffentlicht, der Pages-Build ist **erfolgreich durchgelaufen**, und die Produktion liefert nachweislich die neuen Inhalte: 7 Hauptbereiche inkl. Astrologie, 78 Tarotkarten mit 237 Bildern (alle SHA-identisch), Mond-Modul, Rechtstexte und echter 404 — geprüft bei 375/768/1440 px.

| Feld | Wert |
| --- | --- |
| URL | https://ingbms.github.io/Esoterik-Welt/ |
| Commit | `6a3eee159bddd012ecced612d79ebd96c5058811` (Elterncommit `1f2726c`) |
| Umfang | 310 Einträge, 46.155 Insertions, 8.331 Deletions, 39,1 MB Nutzdaten |
| CI-Pflichtlauf | [Run 41385375525](https://github.com/ingbms/Esoterik-Welt/actions/runs/41385375525) — **success**, 4/4 Jobs |
| Pages-Deploy | Run 41385375824 — **success**; Pages-Build `1333896860`, Status `built`, 03:52:50 UTC |
| Live-`Last-Modified` | `Mon, 02 Nov 2026 03:52:50 GMT` |
| Hosting | unverändert GitHub Pages, Legacy-Build aus `main` / `/` — keine Migration, kein Force-Push |

## 2. Was veröffentlicht wurde (Commit-Allowlist)

Die Allowlist wurde per Skript erzeugt (`evidence/t_3ad4ec40/build-allowlist.cjs` → `allowlist.json`, `allowlist.txt`), nicht per `git add -A`. Enthalten sind ausschließlich Dateien, die Build, Tests oder die Dateimodus-Ausgabe tatsächlich lesen:

- **Produkt:** `index.html`, `404.html`, Rechtstexte, `Lokal*.html`, `css/`, `js/` (inkl. `js/data/{tarot,moon,astrologie,tarot-decks}.js` und `js/modules/astrologie*.js`), `data/moon-astro.mjs`, `assets/{tarot,fonts,cosmos,mineral}/`, `robots.txt`, `sitemap.xml` (unverändert).
- **Werkzeuge/Tests:** `scripts/{build-local,verify-pages,generate-astrologie-data,generate-tarot-data,sync-tarot-assets,build-moon-fixtures}.cjs`, `tests/{astrologie.mjs,astrologie.spec.js,tarot-deck.cjs,moon-astro.cjs,moon-calendar.spec.js,local-entry.cjs,offline-file.cjs}`, `tests/fixtures/moon/`.
- **Quelle der Astrologiedaten:** `docs/astrologie-konzept/{content,manifest.json,schema,ia-konzept.md}` — zwingend, weil `tests/astrologie.mjs` das Datenmodul aus `content/*.json` neu generiert und byteweise vergleicht; ohne diese Dateien wäre der CI-Job auf einem frischen Checkout rot.
- **Dokumentation:** `docs/design-tokens.md`, `docs/ci-cd-pipeline.md` (beide bereits vorher getrackt, inhaltlich aktualisiert).
- **Neu:** `.gitattributes` mit `js/data/astrologie.js -text` (siehe §3).
- **Gelöscht:** `data/moon-phases.js` (durch `data/moon-astro.mjs` ersetzt).

Ausdrücklich **nicht** veröffentlicht (bleibt lokal, in `allowlist.json` als Ausschlussliste dokumentiert): `evidence/` (1,5 GB Prüfnachweise), die Deck-/Stil-Werkstattordner `docs/tarot-deck-*`, `docs/tarot-stilvorlagen/`, `docs/stilkonzepte-*`, `docs/art-direction-nachtatelier/`, `docs/kanban-recovery-20261101/`, `docs/ref-workflows/`, alle Prozess-Notizen `docs/{qa,review,reparatur,plan,release}-*.md`, `docs/LOKAL-STARTEN.md` sowie die Streukopie `build-local.cjs` im Wurzelverzeichnis.

**Datenschutz-Scan vor dem Commit** (`privacy-scan.cjs`, 308 Dateien): 0 Treffer für Windows-/Home-Pfade, Tokens, Schlüssel, E-Mails. Ein Treffer (absoluter Pfad `C:/Users/mas` in `docs/astrologie-konzept/README.md`) führte zum Ausschluss genau dieser Datei statt zu einer stillen Textänderung.

**Deck V2 ist nicht enthalten** — im Baum existiert nur `assets/tarot/nachtatelier-v1`, die Registry `js/data/tarot-decks.js` registriert genau ein Deck; die V2-Gatekarte `t_937ab9cf` bleibt von dieser Veröffentlichung unberührt.

## 3. Abweichung vom QA-Stand: eine Zeile `.gitattributes`

Der erste Clean-Room-Lauf des Commits war **rot**: `tests/astrologie.mjs` vergleicht `js/data/astrologie.js` byteweise mit einer frischen Generierung, und `core.autocrlf=true` auf diesem Windows-Rechner wandelt das LF-Blob beim Checkout in CRLF. Auf Linux-CI wäre der Test grün geblieben, auf einem Windows-Clone nicht.

Behoben mit `.gitattributes` → `js/data/astrologie.js -text` (Datei wird verbatim gespeichert und ausgecheckt). Das ist die einzige Änderung gegenüber dem QA-Stand; sie betrifft weder Laufzeitverhalten noch Darstellung, und der komplette Gate-Satz wurde danach in einem **neuen** Clean-Room-Lauf erneut ausgeführt (§4).

## 4. Clean-Room-Verifikation des veröffentlichten Commits

Frischer `git clone` von `6a3eee1` (kein `dist/`, keine `node_modules`, keine lokalen `docs/`-Werkstätten), `npm ci`, dann alle Pflichtgates:

| Gate | Ergebnis | Log |
| --- | --- | --- |
| `npm run build` | exit 0, `dist/Esoterik-Welt` 38 MB | `cleanroom2/01-build.log` |
| `npm run lint` | exit 0 | `cleanroom2/02-lint.log` |
| `npm run format:check` | exit 0 | `cleanroom2/03-format.log` |
| `npm test` (Jest) | 2/2 | `cleanroom2/04-jest.log` |
| `npm run test:pages` | 6/6 | `cleanroom2/05-pages.log` |
| `npm run test:astrologie` | 21/21 | `cleanroom2/06-astrologie.log` |
| `npm run test:tarot` | 10/10 | `cleanroom2/07-tarot.log` |
| `npm run test:moon` | 14/14 | `cleanroom2/08-moon.log` |
| `npm run test:offline` | 2/2 | `cleanroom2/09-offline.log` |
| `npm run verify:build` | 33 Seiten/Viewports, 0 Fehler | `cleanroom2/10-verify.log` |
| `npx playwright test` | **74/74** | `cleanroom2/11-playwright.log` |

Damit ist der veröffentlichte Stand nicht nur „auf dem Entwicklerrechner grün", sondern aus einem reinen Checkout reproduzierbar.

## 5. Was die Produktion tatsächlich ausliefert

### 5.1 Tarot — 78 Karten, 237 Bilder, byteweise geprüft

Ausgeliefertes Manifest (`assets/tarot/nachtatelier-v1/manifest.json`) ist SHA-identisch mit dem lokalen: `e3d0548a…`. Jede der **237** JPEG-Dateien wurde einzeln heruntergeladen und gegen die lokale Datei geprüft:

| Stufe | Dateien | geliefert | SHA-identisch | Bytes | falscher MIME |
| --- | --- | --- | --- | --- | --- |
| 300 px | 79 | 79 | 79 | 1.943.805 | 0 |
| 600 px | 79 | 79 | 79 | 6.796.579 | 0 |
| 1200 px | 79 | 79 | 79 | 26.293.316 | 0 |
| **Summe** | **237** | **237** | **237** | **35.033.700** | **0** |

78 eindeutige Karten-IDs (plus Rückseite je Stufe). Bildmaße direkt aus den SOF-Markern der gelieferten Dateien gelesen (`live/image-dimensions.json`): 79× `300x500`, 79× `600x1000`, 79× `1200x2000`, **0 Abweichungen**. Content-Type `image/jpeg`.

Beleg: `live/live-http.json`, `live/image-dimensions.json`.

### 5.2 Quellen gegen SHA

21 ausgelieferte Dateien (HTML, CSS, JS, Datenmodule, Fonts, `sitemap.xml`, `robots.txt`) wurden geholt und mit dem Blob bei HEAD verglichen: **21/21 byte-identisch**, u. a. `js/data/tarot.js` `99f6d262…`, `js/data/astrologie.js` `db09e2f3…`, `Lokal.html` `65bd27d4…`. `Lokal.html` ist zusätzlich identisch mit der Datei, die die QA per Doppelklick geprüft hat. MIME: `text/css`, `application/javascript`, `image/jpeg`, `font/ttf` — jeweils korrekt.

### 5.3 Alle neuen Bereiche + Recht + 404 bei 375/768/1440 px

11 Ziele × 3 Viewports = **33 Läufe**, jeweils echte Chromium-Navigation (`live/live-browser.json`):

- je Ziel genau **1 sichtbare h1** mit passendem Text (`Entdecke die verborgene Sprache des Universums`, `Tarot — Der Spiegel der Seele`, `Kristalle & Steine`, `Mondphasen`, `Astrologie verstehen`, `Runen — Das ältere Futhark`, `Wissen & Artikel`, `Impressum`, `Datenschutzerklärung`, `Haftungsausschluss`, `404`),
- **0** Dokumentüberlauf (`scrollWidth == innerWidth`) bei allen 33 Läufen,
- **0** echter Komponentenüberlauf (der einzige Treffer ist ein `.sr-only`-Label mit `clientWidth: 1` — die übliche Unsichtbar-Technik, kein Layoutfehler),
- **7** Navigationsziele auf allen Innenseiten, **1** auf den Rechtstexten (deren eigene Navigation),
- Body-Hintergrund `rgb(11, 16, 18)` (Basalt), Schrift `Manrope`/`Fraunces`, `document.fonts.status = loaded` — also keine Fallback-Schrift,
- **0** externe Requests, **0** Pageerrors; die einzige Konsolenmeldung je Viewport stammt aus meinem eigenen absichtlichen 404-Aufruf und ist in einem separaten Lauf ohne 404-Navigation mit **0** Konsolenfehlern bestätigt (`live/live-extra.json`).

404: echter HTTP-**404**-Status mit HTML-Fehlerseite und h1 „404" bei allen drei Breiten.

### 5.4 Deeplinks

Neun Kaltstart-Deeplinks in jeweils frischem Browserkontext, je genau 1 sichtbare h1 und 0 Fehler (`live/live-extra.json`):

| Hash | sichtbare h1 | Text |
| --- | --- | --- |
| `#astrologie/zeichen/widder` | ♈︎ Widder | 5.562 Zeichen |
| `#astrologie/quellen` | Quellen und Claims | 25.605 Zeichen |
| `#astrologie/glossar` | Glossar | 12.720 Zeichen |
| `#astrologie/suche` | Suche | — |
| `#tarot` / `#moon` / `#crystals` / `#runes` / `#blog` | jeweiliger Bereich | 1.818–9.607 Zeichen |

### 5.5 Repräsentative intensive Flows (Produktion, 1440 px)

- **Tarot:** 78 Karten in `#tarotGrid`; Karte „Der Narr" öffnet den Dialog mit `600/00.jpg` (600×1000), Fokus im Dialog; Zoom lädt **erst jetzt** `1200/00.jpg` (1200×2000, `aria-pressed=true`); Escape schließt den Dialog (`visible: false`) und gibt den Fokus auf die auslösende Karte zurück.
- **Astrologie:** 12 Zeichenkarten; Suche „Widder" → „1 von 12 Zeichen"; Unsinnsquery → Leerzustand „0 von 12 Zeichen" sichtbar; Gesamtsuche „Mond" → **11 Treffer** in 7 Gruppen; Filter-Chip „Feuer" → „3 von 12 Zeichen", `aria-current="true"`, Hash `#astrologie/zeichen?element=element-feuer`.
- **Mond:** November 2026 mit 30 Tagen, „Letztes Viertel", „47 % beleuchtet · abnehmend", Mondalter „22,5 Tage seit Neumond"; Monatswechsel → Dezember 2026 mit 31 Tagen; Tagesauswahl aktualisiert Phase/Beleuchtung.
- **Reduced Motion:** 0 laufende Keyframe-Animationen, 0 Transitions > 0,5 s, `scroll-behavior: auto`.

Belege: `live/live-browser.json`, `live/live-extra.json`, Screenshots in `live/shots/`.

## 6. Offlinepaket zur selben Revision

Aus demselben Arbeitsbaum gebaut (`npm run build`), kopiert nach `evidence/t_3ad4ec40/package/Esoterik-Welt` und als `Esoterik-Welt-6a3eee1.tar.gz` gepackt:

- **SHA-256 des Archivs:** `0340869cab2998068e28c62b670202dc179b3e8ba43d57993643758886ee6788` (`package/package-sha256.txt`)
- 301 Dateien, 239 JPEG, 10 HTML, 38 MB; **kein** `docs/`, `evidence/`, `node_modules/`, `.git`.
- `Lokal.html`, `index.html`, `Lokal-impressum.html` im Paket sind **byte-identisch** mit HEAD und mit der ausgelieferten Datei — das Paket ist also nicht nur „dieselbe Revision", sondern derselbe Inhalt.
- Doppelklick-Einstieg `file://…/index.html` landet auf `Lokal.html`: 7 Navigationsziele, alle 7 Bereiche, **78 Tarotkarten**, Mond 30 Zellen, Astrologie-Deeplink „♈︎ Widder" (5.562 Zeichen, 13 Quellenmarker), 600-px-Karte dekodiert offline.
- Über alle drei Viewports: **0** Nicht-`file://`-Requests, **0** Konsolenfehler, **0** fehlgeschlagene Requests (`live/package-verify.json`, `live/shots/package-*.png`).

## 7. Rückfallanleitung

**Fall A — Website auf den vorherigen Stand zurück (empfohlen, ohne Force-Push):**

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
git revert --no-edit 6a3eee1
git push origin main
```

Pages (Legacy-Build aus `main`) baut automatisch neu; der vorherige Live-Stand entspricht `1f2726c`. Danach `Last-Modified` und die sieben Navigationsziele prüfen — der Altstand hat sechs Ziele und keinen Astrologiebereich, das ist das sichere Erkennungsmerkmal.

**Fall B — nur lokal zurück (Produktion unverändert lassen):**

```bash
git switch --detach 1f2726c   # oder: git reset --hard 1f2726c
```

Achtung: `Lokal*.html` und `dist/` danach mit `npm run build` neu erzeugen, sonst bleibt die Dateimodus-Ausgabe auf dem neuen Stand.

**Kein Force-Push, keine Hostermigration, kein Eingriff in die Pages-Konfiguration** (`build_type: legacy`, Branch `main`, Pfad `/`) — unverändert.

## 8. Beobachtungen ohne Blockwirkung (für die Folgekarte)

1. **`build-local.cjs` im Wurzelverzeichnis** ist eine Streukopie von `scripts/build-local.cjs` mit falschem `__dirname`-Bezug und bleibt bewusst untracked. Aufräumen empfohlen, damit niemand sie versehentlich aufruft.
2. **`Lokal.html` ist nicht bit-reproduzierbar über Plattformen:** Ein Checkout mit CRLF-Eingaben erzeugt ein anderes Bundle als einer mit LF. Verhalten identisch, Byte-Hash verschieden. Wenn Reproduzierbarkeit gewünscht ist, gehört `Lokal*.html` aus der Versionierung oder ein `.gitattributes`-Eintrag für die Build-Eingaben dazu.
3. **Sichtbarer Fokusrahmen um die Bereichs-H1** nach Hash-Navigation (programmatischer Fokus für Screenreader). Funktional korrekt, optisch auffällig — Gestaltungsentscheidung, nicht Teil dieses Releases.
4. **`npm run test:moon` läuft weiterhin nicht in der CI** (QA-Befund F3) — bereits als `t_67334ff1` verknüpft, zusammen mit F1 (Tarot-Dialog-Bildfehler) und F2 (Mond-Trenner bei 375 px).
5. `naturalWidth` der Galerie-Thumbnails meldet 200×333 statt 300×500 — das ist die spec-konforme Dichte-Korrektur aus `srcset`/`sizes`, kein Bildfehler; die Dateien selbst wurden direkt aus den JPEG-Headern mit 300×500 gemessen.

## 9. Grenzen dieser Abnahme

- Nur Chromium (Playwright 1.64.1, headless); kein Firefox/Safari, kein Screenreader-/axe-Lauf, kein 200-%-Textzoom.
- Kontrast wurde hier nicht neu berechnet — die QA hat min. 9,33 : 1 am selben Stand gemessen; die ausgelieferten CSS-Dateien sind byte-identisch mit dem Prüfstand.
- Keine Druckfreigabe, kein CMYK/ICC-Proof.
- Keine Nutzertests, keine neue Rechtsprüfung.
- Live geprüft wurde der ausgelieferte Stand; CDN-/Provider-Störungen nach dem Prüfzeitpunkt sind nicht abgedeckt.

## 10. Belege

- `evidence/t_3ad4ec40/allowlist.json`, `allowlist.txt`, `privacy-scan.json`, `pre-state-git-status.txt`, `pre-state-hashes.txt`
- `evidence/t_3ad4ec40/cleanroom2/*.log` — alle Gates am veröffentlichten Commit aus frischem Clone
- `evidence/t_3ad4ec40/live/live-http.json` — Manifest, 237 Bilder, 21 Quellen, MIME, 404
- `evidence/t_3ad4ec40/live/live-browser.json` — 33 Bereichsläufe, Deeplinks, Flows
- `evidence/t_3ad4ec40/live/live-extra.json` — sichtbare H1 je Deeplink, Filter, Dialog, Konsole
- `evidence/t_3ad4ec40/live/package-verify.json` — Offlinepaket
- `evidence/t_3ad4ec40/live/image-dimensions.json` — echte Bildmaße je Stufe
- `evidence/t_3ad4ec40/live/shots/*.png` — Screenshots 375/768/1440, Deeplinks, Flows, Paket
- `evidence/t_3ad4ec40/package/` — Offlinepaket samt `package-sha256.txt`
- `evidence/t_3ad4ec40/summary.json` — maschinenlesbare Zusammenfassung
