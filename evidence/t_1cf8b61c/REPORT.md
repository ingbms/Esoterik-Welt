# Technische Abnahme: Farbwelten (Karte t_1cf8b61c)

**Urteil: NICHT ABGENOMMEN** — 2 blockierende Befunde (B1, B2), 1 kleiner Befund (B3),
1 Prozessbefund zur Arbeitsbasis (B4). Kein Push, kein Deployment.

| Feld | Wert |
| --- | --- |
| Arbeitsbaum | `C:\Users\mas\Arbeit\Esoterik-Welt\.worktrees\t_1cf8b61c` |
| Branch | `esoterik-welt/t_1cf8b61c-farbwelten-technische-abnahme-der-neuen` |
| Stand unter Test | `b3a76fe` (eigener Integrations-Commit, s. B4) |
| Basis für Regression | `e44fa5c` (eigener Detached-Worktree `.worktrees/t_1cf8b61c-base`) |
| Umgebung | Windows 11, Node v24.13.0, npm 11.8.0, Playwright 1.64.1 (Chromium/Firefox/WebKit), axe-core 4.14.0, Lighthouse 12.6.1 |
| Eigene Sonden | `evidence/t_1cf8b61c/probe/*.mjs` (kein Code aus den Implementierungskarten übernommen) |
| Screenshots | `evidence/t_1cf8b61c/screens/` (24 Bilder, 390 und 1440 px je neuer Ansicht) + ZIP-Anhang |

## B4 — Arbeitsbasis: kein integrierter Stand vorhanden (Prozessbefund)

Die drei Implementierungskarten liegen auf drei getrennten Branches, alle von
`30a2f62` bzw. `fcfe190` abzweigend; `feature/farbwelten-modul` steht weiterhin
auf `30a2f62` (also **vor** allen drei Karten):

| Karte | Commit | Dateien |
| --- | --- | --- |
| t_747ba46a (fünf Farben) | `c2b70f4` | 22 |
| t_9da9c0a3 (drei Themenseiten) | `dbcf249` | 37 |
| t_bd5c13db (P2-Werkzeuge) | `8ae012b` | 25 |

Ein Stand „nach den drei Karten" existierte damit nicht. Für diese Abnahme habe
ich die drei Branches in **meinem** Worktree zusammengeführt (kein Push):
`d099cd1` (1/3), `29c7c67` (2/3), `b3a76fe` (3/3). 15 Konflikte in 8 Dateien,
alle als **Vereinigung beider Seiten** aufgelöst (Routenlisten, `VIEW`/`ROUTE`,
Renderer-Importe, Breadcrumb-Trail, Generator-Exporte, Interaktionsprüfungen);
`npm run data:farbwelten` neu ausgeführt (12 Farbwelten, 3 Themenseiten,
16 Registereinträge). Konfliktdateien: `js/data/farbwelten.js`,
`js/modules/farbwelten-model.js`, `js/modules/farbwelten.js`,
`scripts/generate-farbwelten-data.cjs`, `scripts/verify-farbwelten*.cjs`,
`tests/farbwelten.mjs`, `tests/farbwelten.spec.js`.

Folge: Fünf Zählannahmen der mitgelieferten Prüfungen beschreiben den
**Vor**-Integrationsstand und schlagen jetzt fehl (Register 15 statt 12/10;
Kompass 7). Das ist Test-/Skriptseite, kein Produktfehler — muss aber im
Rework mitgezogen werden (B4).

## Prüfpunkte mit Messwerten

### 1. Routen — bestanden

31 Routen gerendert (Einstieg, 12 Farben, Chakren, Lichtfrequenzen, 3 Themen,
3 Werkzeuge, 8 Kernseiten, 2 unbekannte Routen):

- je genau **1 sichtbare H1** (31/31), Hash bleibt erhalten (29/29 gültige Routen)
- **0** Platzhalter, Markdown-Reste (`**`, `](…)`, Tabellen), `undefined`, `[object Object]`
- **0** Konsolenfehler und **0** Seitenfehler beim Laden der 31 Routen
- unbekannte Route `#farbwelten/gibtsnicht`: eigener NotFound-View („Diese Farbwelt
  gibt es nicht", Titel „Unbekannte Farbwelt")
- unbekannte Route `#gibtsnicht`: site-weite Meldung „gehört zu keiner Seite dieser
  Website" + Startseite — **identisch zu `e44fa5c`** (keine Regression)

Evidenz: `probe/render.json`, `probe/render-base.json`.

### 2. Physik — bestanden, mit Ausnahme über den Kompass (B1)

- Magenta/Rosa: `Einordnung: nicht spektral`, `Wellenlänge: keine eigene Wellenlänge`;
  Weiß/Schwarz: `Neutralfarbe`, ebenfalls ohne Messwertzeile. Keine nm-/THz-/eV-Zahl
  in den Faktenzeilen (Prosa nennt Bereiche nur erklärend).
- Register/Typ-Label: 2× „nicht spektral", 2× „Neutralfarbe" (12 Farbwelten gesamt).
- Spektrum-Explorer: `min=380`, `max=780`; Achsentext enthält **keinen** Farbnamen;
  Off-Axis-Liste verlinkt magenta, rosa, weiss, schwarz; Türkis ist im Explorer-Text
  und in den Fakten als „Übergangsbereich … ca. 490–520 nm (Konvention)" markiert.
- Slider (f = c/λ, E = hc/λ):

| λ | angezeigt | Soll | Abweichung |
| --- | --- | --- | --- |
| 420 nm | 713,8 THz / 2,95 eV | 713,79 THz / 2,952 eV | ≤ 0,01 % |
| 530 nm | 565,6 THz / 2,34 eV | 565,65 THz / 2,339 eV | ≤ 0,01 % |
| 650 nm | 461,2 THz / 1,91 eV | 461,22 THz / 1,907 eV | ≤ 0,02 % |

**Gegenbefund:** Der Farben-Kompass zeigt für fünf Farbwelten die Messwerte der
Farbe Rot an (B1) — auf der Kompass-Seite stehen damit falsche nm/THz-Werte.

Evidenz: `probe/tools.json` (`notes.physics`, `notes.explorer`, `notes.slider`).

### 3. Barrierefreiheit — nicht bestanden (B2)

- axe-core 4.14.0, **22 Läufe** (Chromium 12 Ansichten, Firefox 5, WebKit 5,
  Tags wcag2a/2aa/21a/21aa/best-practice): **1 Verstoß**
  `link-in-text-block` (serious, 3 Knoten, `#farbwelten/farbtherapie`).
  Firefox/WebKit: 0 Verstöße, 0 Konsolenfehler.
- Textkontrast **im Browser gemessen** (2.195 Textknoten über 12 Ansichten):
  Minimum **5,32:1** (`#farbwelten/magenta`), 0 Verstöße.
- Paletten (WCAG-Formel, Token aus `design-system.css`): Text `-ink` auf `-deep`
  **4,81–9,78:1**; Linien `-line` auf `-deep` **3,22–5,49:1**; `-line` auf
  `-deep-alt` **3,46–5,92:1**. Funktionale Linie `--color-line-strong` auf
  Hintergrund **5,31:1**.
- Fokus: 12/12 Tabstopps je Ansicht sichtbar (0 ohne Outline/Schatten).
- Beschriftung: alle sichtbaren Bedienelemente benannt (u. a. Slider mit
  `aria-valuetext` „530 Nanometer, Grün, 565,6 Terahertz, 2,34 Elektronenvolt").
- `aria-live`: Timer `aria-live="off"` + `role="timer"`; Statuszeilen ≤ 76 Zeichen;
  keine große Live-Region.
- Überschriftenstruktur: keine Sprünge auf 12 Ansichten.

Evidenz: `probe/a11y.json`.

### 4. Reduced Motion, Autoplay, Speicherung — bestanden

- `prefers-reduced-motion: reduce`: Meditationsfläche `animation-name: none`
  (Element und `::after`), Zeitleiste 0 animierte Elemente, kein `<marquee>`,
  kein Blink-Keyframe; Timer läuft weiter, Status „Übung läuft."
- Kein `<audio>/<video>`, kein Autoplay, keine automatische Musik.
- Storage-Monitor (localStorage/sessionStorage gepatcht): während der Meditation
  **keine** Schreibzugriffe; die beobachteten Schreibzugriffe (Tarot-Deck,
  Kristall-Favoriten, Runen-Verlauf) stammen aus unveränderten Altmodulen
  (`js/modules/tarot.js|crystals.js|runes.js` seit `e44fa5c` unberührt).
- Netzwerk: **0** externe Requests auf fünf neuen Ansichten; Schriften lokal
  (`assets/fonts/Fraunces.ttf`, `Manrope.ttf`).

Evidenz: `probe/tools.json`, `probe/offline.json`.

### 5. Responsive — bestanden (mit B3)

- 12 neue Routen × 5 Breiten (320/390/768/1024/1440) = **60 Zellen**:
  horizontaler Überlauf **maximal 0 px**.
- Touch-Ziele (effektive Trefferfläche, Radiogruppen über `<label>`):
  24 Zellen, Minimum **32 px** — Ausnahme: ein Link **285×24 px** (B3).
- Mobilmenü 390/768: **9 Ziele** (Start, Tarot, Kristalle, Mondphasen, Astrologie,
  Runen, Pendeln, Farben, Wissen), `aria-expanded="true"` nach Klick.
- Kopfzeile 1024/1440: **9 Ziele** sichtbar.

Evidenz: `probe/responsive.json`, `probe/touch.json`.

### 6. Regression und Offline-Edition — bestanden

- 8 Kernseiten gegen `e44fa5c`, identische axe-Befundmengen vor/nach
  (home 0, pendeln 0, tarot 78, crystals 32, moon 31, runes 24, blog 10,
  astrologie 1 — `label-content-name-mismatch` bzw. `link-in-text-block`):
  **keine neue Regel, kein neuer Knoten**, 1 H1 je Seite.
- Navigationsziele: 8 → 9 (Farben neu) — gewollte Erweiterung, keine Verschlechterung.
- Offline-Edition, frisch über `npm run build:local` erzeugt: **14 Routen**
  (12 Farbwelten inkl. drei Themenseiten und drei Werkzeuge) rendern über
  `file://`, **0 externe Requests**, 0 Fehler.
- Hinweis: das **versionierte** `Lokal.html` im Branch enthält die neuen Routen
  noch nicht (enthält 0 Treffer für `kompass|farbmeditation|zeitleiste`); es wird
  laut Kartenlage erst im Release neu gebaut.

Evidenz: `probe/regression.json`, `probe/offline.json`.

### 7. Performance-Rahmen — bestanden

- **0** Drittanbieter-Requests, **0** externe Fonts (Netzwerkmonitor über fünf
  neue Ansichten, `third-party-summary` leer).
- Lighthouse 12.6.1 (Chromium headless, eigener Server):

| Ansicht | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- |
| `#farbwelten/kompass` | 100 | 100 | 100 |
| `#farbwelten/farbmeditation` | 100 | 100 | 100 |
| `#farbwelten/tuerkis` | 100 | 100 | 100 |

Evidenz: `lighthouse/*.json`.

### 8. Projekt-Suiten — 4 von 7 grün, 3 rot

| Befehl | Ist-Ergebnis |
| --- | --- |
| `npm run build` | grün (`dist/Esoterik-Welt` + `Lokal.html`) |
| `npm run lint` | grün, 0 Warnungen |
| `npm run format:check` | grün („All matched files use Prettier code style") |
| `npm run test:farbwelten` | **20/21 pass, 1 fail** — „Farben-Kompass deckt alle sieben Farbwelten ab": 7 statt 12 (B1) |
| `npm run test:pages` | 6/6 pass |
| `npm run test:offline` | 2/2 pass |
| `npx playwright test tests/farbwelten.spec.js` | **35/37 pass, 2 fail** — Registerzeilen 15 statt 10 (B4), Kompass 12 statt 7 (B1) |
| `node scripts/verify-farbwelten.cjs` | **112 PASS / 10 FAIL** — 5× Registerzeilen 15 statt 12 (B4), 5× Kompass-Auswahl 12 (B1) |
| `node scripts/verify-farbwelten-rendered.cjs` | 18 Routen, **1 Fehler** — Register 15 statt 12 (B4) |
| `node scripts/verify-farbwelten-sync.cjs` | 18 Quellen, 16 Registereinträge, **0 Fehler** |

## Befunde

### B1 — blockierend: Farben-Kompass bricht für fünf Farbwelten

**Route:** `#farbwelten/kompass`
**Repro (Maus):** Seite öffnen → „Türkis (Cyan)" wählen.
**Repro (Tastatur):** ersten Radio fokussieren → 4× `ArrowRight` (Rot → Orange →
Gelb → Grün → Türkis).
**Ist:** `TypeError: Cannot read properties of undefined (reading 'associations')`;
Panel bleibt auf der **vorherigen** Farbwelt stehen (bei Türkis: „Grün ·
Spektralfarbe · 490–570 nm · 526–612 THz", bei Magenta/Rosa/Weiß: „Violett ·
380–425 nm"), während Radio und Fokus auf der neuen Farbe stehen; die
Statuszeile (`role="status"`) meldet weiter die alte Farbe. Betroffen sind alle
fünf neuen Farbwelten.
**Erwartet:** Auswahl zeigt die gewählte Farbwelt; oder die Auswahl bietet nur
Farbwelten mit hinterlegten Kompass-Daten an. Kein Fall, in dem eine andere
Farbwelt mit fremden Messwerten angezeigt wird.
**Ursache:** `colorChoices('fwCompassColor', first.id)` iteriert alle
`FARBWELTEN` (12), `COMPASS.worlds` hat aber nur 7 Einträge
(`js/modules/farbwelten.js:1100` `compassPanel()`, `:1191`, `:1749`;
Daten in `js/data/farbwelten.js` `COMPASS.worlds`; Quelle der Konstante:
`scripts/generate-farbwelten-data.cjs`).
**Nebenbefunde im gleichen Block:** Abschnittslabel sagt „Sieben Farbwelten" bei
12 Optionen; `world.spectral ? 'Spektralfarbe' : 'Mischfarbe'` würde Weiß/Schwarz
als „Mischfarbe" ausgeben.
**Evidenz:** `probe/repro-kompass.json`, `probe/compass-keys.json`,
`screens/repro-kompass-1440.png`.

### B2 — blockierend: Inline-Links in Themenseiten nur über Farbe unterscheidbar

**Routen:** `#farbwelten/farbtherapie` (3 Links), `#farbwelten/farbpsychologie` (1),
`#farbwelten/lichtmedizin` (1)
**Repro:** `#farbwelten/farbtherapie` → Abschnitt „Was Farbtherapie ist" → Absatz 4:
„… Lichtmedizin und Photobiologie … Farbpsychologie …".
**Ist:** Linkfarbe `#c6b38e` gegen Fließtextfarbe `#babdb7` = **1,08:1**,
`text-decoration: none`, kein `border-bottom` → axe `link-in-text-block`
(serious). Die Links sind damit nur über die Farbe erkennbar (WCAG 1.4.1).
**Erwartet:** Unterstreichung (oder ein anderes nicht-farbliches Merkmal) für
Links im Fließtext der Themenseiten.
**Ursache:** Inline-Links aus Markdown werden ohne Klasse erzeugt
(`js/modules/farbwelten.js:92`), `css/farbwelten.css` hat keine Regel für
Fließtext-Links.
**Anmerkung:** Dieselbe Regel greift bereits im Altbestand (`#astrologie`,
1 Knoten, `e44fa5c`) — keine Regression, aber die Karte fordert 0 Verstöße auf
den neuen Ansichten.
**Evidenz:** `probe/a11y.json`, `probe/inline-links.json`.

### B3 — klein: Touch-Ziel unter 32 px

**Routen:** `#farbwelten/farbpsychologie`, `#farbwelten/lichtmedizin` bei 390 px
**Ist:** Link „Farbtherapie und Chromotherapie" **285×24 px** (Kartenvorgabe
≥ 32 px; das WCAG-2.5.8-Minimum von 24 px ist erfüllt).
**Evidenz:** `probe/touch.json` (`summary.small`).

### B4 — blockierend für die Arbeitsbasis: Integration und Zählannahmen

Siehe oben. Der Rework muss (a) die drei Branches tatsächlich zusammenführen,
(b) die Zählannahmen der mitgelieferten Prüfungen auf den integrierten Stand
heben (Register 15: `tests/farbwelten.spec.js:214`,
`scripts/verify-farbwelten.cjs` Registerprüfung,
`scripts/verify-farbwelten-rendered.cjs` Registerprüfung) und (c) den
Kompass-Datenbestand entscheiden (7 belegte Farben oder 12 mit Daten).

## Nicht geprüft / Grenzen

- Kein Screenreader-Lauf (Rollen/Namen geprüft, Ansagereihenfolge nicht).
- Keine echten Mobilgeräte, kein Safari/iOS (Playwright-WebKit ist kein Safari-Ersatz).
- Lighthouse nur auf drei neuen Ansichten, nur Chromium headless.
- Regressionsvergleich nur axe-Ebene, keine Pixel-/Layoutdiff-Geometrie.
- Das versionierte `Lokal.html` wurde nicht verändert geprüft (nur frisch gebaut).
- Keine inhaltliche Bewertung der Redaktionstexte (Karte fact_checking).

## Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_1cf8b61c
npm ci
npm run build
npm run lint && npm run format:check
npm run test:farbwelten && npm run test:pages && npm run test:offline
E2E_PORT=3299 CI=1 npx playwright test tests/farbwelten.spec.js
node evidence/t_1cf8b61c/probe/probe-render.mjs dist/Esoterik-Welt evidence/t_1cf8b61c/probe/render.json
node evidence/t_1cf8b61c/probe/probe-tools.mjs dist/Esoterik-Welt evidence/t_1cf8b61c/probe/tools.json
node evidence/t_1cf8b61c/probe/probe-a11y.mjs dist/Esoterik-Welt evidence/t_1cf8b61c/probe/a11y.json
node evidence/t_1cf8b61c/probe/probe-responsive.mjs dist/Esoterik-Welt evidence/t_1cf8b61c/probe/responsive.json
node evidence/t_1cf8b61c/probe/probe-touch.mjs dist/Esoterik-Welt evidence/t_1cf8b61c/probe/touch.json
node evidence/t_1cf8b61c/probe/probe-more-tools.mjs dist/Esoterik-Welt evidence/t_1cf8b61c/probe/more-tools.json
node evidence/t_1cf8b61c/probe/probe-offline.mjs Lokal.html evidence/t_1cf8b61c/probe/offline.json
node evidence/t_1cf8b61c/probe/repro-kompass.mjs dist/Esoterik-Welt evidence/t_1cf8b61c/probe/repro-kompass.json evidence/t_1cf8b61c/screens/repro-kompass-1440.png
bash evidence/t_1cf8b61c/probe/run-verify.sh        # 8099, eigener Server
bash evidence/t_1cf8b61c/probe/run-lighthouse.sh    # 3299, eigener Server
```

Alle Sonden starten ihren Static-Server im eigenen Prozess (kein fremder Server
auf dem Port, kein `reuseExistingServer`).
