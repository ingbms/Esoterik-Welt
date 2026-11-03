# ESOW-RAD-QAFIX — Checkpoint (Lauf 316 fortgesetzt)

**Karte:** `t_d81baa74` (ESOW-RAD-QAFIX)
**Arbeitsbaum:** `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul`
**Basis:** `e44fa5c` (Modul) + `82136f5` (RAD-01-Dokumentation)
**Datum:** 03.11.2026, Europe/Berlin
**Anspruch:** QAFIX-Teilumfang (B1–B5, B9, B10 prüfen; B2 ursächlich lösen). **Keine** Abnahme der 14 Arbeitspakete, kein Push, kein Deployment.

## 1. Stand

| Befund | Status nach dieser Karte | Beleg |
|---|---|---|
| B1 Bovis „6.500 = gut“ | **behoben** — Text, Glossar, Datendatei und Test auf die belegte Lesart („Bezugswert 6.500 = neutral“, nur noch [Q12]) umgestellt | `inhalte/radiaesthesie.md`, `inhalte/glossar.md`, `js/data/radiasthesie.js`, Node-Test „Themenseiten …“ |
| B2 Kopfzeilen-Sprung (Burger) | **ursächlich behoben** — `#favCounter` steht statisch im Markup von `index.html`, Mindestbreite reserviert; kein Test-Warten mehr | Abschnitt 4, `tests/radiasthesie.spec.js` |
| B3 H1→H3 auf der Fehleransicht | **behoben** — drei Ziele als `<h2>` (CSS-Regeln für `h2` ergänzt) | `js/modules/radiasthesie-views.js`, `css/radiasthesie.css`, `tests/radiasthesie.mjs` |
| B4 ISBN/Jahr/Kataloglink | **behoben** — `locator` wird als Metazeile gerendert, ISBN ist Linkziel-frei sichtbar, Q30/Q31 mit ISBN/Jahr | `radiasthesie-views.js`, `generate-radiasthesie-data.cjs`, Quellenverzeichnis |
| B5 Quellen ohne Seitenzuordnung | **behoben** — nicht zitierte Referenzliteratur wird als „Nicht im Fließtext zitiert“ gekennzeichnet, Beschreibung entsprechend präzisiert | `radiasthesie-views.js` |
| B9 `tarot-decks-v2` CRLF | **behoben** — Checkout-Artefakt der V1-Manifestdatei auf die im Index/HEAD hinterlegten Bytes normalisiert, `.gitattributes` verhindert Wiederholung | Abschnitt 3 |
| B10 Glossar-Frontmatter 15 vs. 13 | **behoben** — Frontmatter nennt 13 Begriffe | `inhalte/glossar.md` |
| B6 Indexierung/Sitemap | **offen, RAD-12 zugeordnet** — nicht Teil dieser Karte | — |
| B7 `og:image` | **offen** — projektweit in keiner HTML-Datei vorhanden (`grep og:image` = 0 Treffer in `index.html`, `impressum.html`, `datenschutz.html`, `haftung.html`, `404.html`); gehört zur SEO-Gesamtintegration (RAD-12) | — |
| B8 Titellängen | **offen** — `seoTitle` 52–59 Zeichen, `applyMeta` hängt `" | Esoterik-Welt"` (+17) an ⇒ effektiv 69–76 Zeichen; gehört zu RAD-12 | — |
| B11 unbekannter Kapitel-Slug | **offen, dokumentiert** — `resolve()` setzt bei unbekanntem Kapitel `anchor: ''` und rendert still die Themenseite (`radiasthesie-model.js:84–95`). Verhalten unverändert, keine Fehlermeldung | — |

## 2. Eigene Änderungen (nur diese Dateien committet)

| Datei | SHA-256 (Arbeitsstand) |
|---|---|
| `index.html` | `b12231ff7c5d08799d9a04399f10146fcc87bcb2e2ec6d2e479d74bf169235fe` |
| `css/design-system.css` | `11039164d8e8935549528eebf893a917ced89139a039aebf2829ef557bc04d0d` |
| `css/radiasthesie.css` | `f48379137b46453f99b8d54a6a741f2607aab622da7a27935ff90fece6dbff97` |
| `js/data/radiasthesie.js` | `9b7b8f15682fcc15db47d6ff0bcf9a1b545c0b39e1d95f4316cdedf04330d53f` |
| `js/modules/radiasthesie-views.js` | `4d22e1732fbbeb6edba34e56d4b649771b11820a37b1dae3b7bfc8cc581e77be` |
| `scripts/generate-radiasthesie-data.cjs` | `29c9a41de9929fe750b14a38117fe367139050424d6a80e4c697379f6f6a5a3b` |
| `tests/radiasthesie.mjs` | `d7cbb1dbbfd964234b1790e13f7579ec622817e2d39a491ab358e05be2f4780e` |
| `tests/radiasthesie.spec.js` | `1fa5ac17e928125f80d809272f4790f897acfe2fff10161f99c6efc76a89afc4` |
| `docs/radiasthesie-konzept/inhalte/glossar.md` | `20cc63d73e203bf18c821c5239b0de4b8815be4d8dbeff4962e0d8fe3a42a6fe` |
| `docs/radiasthesie-konzept/inhalte/quellenverzeichnis.md` | `a2dcba93eb01c66d615f04788c7c6b920db3c9525b795847cc890c3df667ba9e` |
| `docs/radiasthesie-konzept/inhalte/radiaesthesie.md` | `ca89fbba424eaf4a419c9c4e5ddf6439a63f4ed8fffb73a64b8b384b5702bd30` |
| `.gitattributes` | `5bbcd763cc3f5499751d4e9dd4789a12f3b27e307809d33ae55c19806bd454e5` |
| `Lokal.html`, `Lokal-404.html`, `Lokal-impressum.html`, `Lokal-datenschutz.html`, `Lokal-haftung.html` | generiert; `Lokal.html` = `d0712eb5b2ca4026cfc01fe2a8a27c67e78e0ad8adc8138145f33769990cff03` (dreimal reproduziert) |

**Eingangsversionen** (vor dem Eingriff) liegen byte-genau unter `evidence/before/` (`index.html`, `css/design-system.css`, `tests/radiasthesie.mjs`, `tests/radiasthesie.spec.js`) samt `SHA256.txt`; die beiden Testdateien sind dort die uncommittete Lauf-316-Fassung.

**Mess- und Testbelege** liegen unter `evidence/measure/` (Messskript, Messläufe alt/neu) und `evidence/belege/` (Node-Tests grün, Playwright 13/13, Repeat-Lauf, Gesamtsuite 87/87, Negativkontrolle, Offline, Tarot-Decks vorher/nachher, Format-Sichtprüfung, Build, Exitcode-Liste). Die Belegdateien tragen `.log.txt`, weil `.gitignore` `*.log` ausschließt.

**Nicht angefasst** (Parallelarbeit):

- `assets/radiasthesie/media/**` (RAD-05, fremd, untracked),
- `docs/radiasthesie-completion/RAD-02/`, `RAD-04/`, `RAD-05/` (fremd, untracked),
- `assets/tarot/nachtatelier-v1/manifest.json`: Inhalt unverändert; nur das CRLF-Checkout-Artefakt im Arbeitsbaum wurde auf die im Index hinterlegten Bytes zurückgeführt (`git status` clean, kein Staging-Inhalt).

## 3. Ausgeführte Prüfungen (nur wirklich gelaufen)

TMP/TEMP/TMPDIR jeweils `C:/Users/mas/AppData/Local/hermes/cache/scratch`; Exitcodes ohne Pipe-Maskierung erfasst.

| Prüfung | Kommando | Ergebnis | Exit |
|---|---|---|---|
| Roter Test vorher | `node --test tests/radiasthesie.mjs` | 15/16, `model.topics.radiaesthesie` undefined (Zeile 236) | 1 |
| Modultests nachher | `node --test tests/radiasthesie.mjs` | 16/16 | 0 |
| Browsertests Modul | `npx playwright test tests/radiasthesie.spec.js` (Port 3317) | 13/13 | 0 |
| Wiederholung Mobilmenü + B2 | `… --grep "Mobilmenü|Kopfzeilen-Layout" --repeat-each=6` | 12/12 | 0 |
| Vollständige Browsersuite | `npx playwright test` | 87/87 | 0 |
| Lint | `npm run lint` | 0 Fehler | 0 |
| Format (getrackte Dateien) | `prettier --check` über 125 `git ls-files` | alle konform | 0 |
| Format (Gesamtbefehl) | `npm run format:check` | **1 Befund: `assets/radiasthesie/media/bildnachweis.html`** (fremde Datei aus RAD-05, nicht angefasst) | 1 |
| Offline-Ausgabe | `npm run test:offline` | 2/2 | 0 |
| Weitere Suiten | `test:unit`, `test:pages`, `test:crystals`, `test:astrologie`, `test:tarot`, `test:tarot:decks`, `test:moon` | alle grün (`test:tarot:decks` 12/12 erst nach der CRLF-Normalisierung) | je 0 |
| Build | `npm run build` (3×) | grün, Ausgabe byte-identisch | 0 |
| Generatordeterminismus | `node scripts/generate-radiasthesie-data.cjs` + `npx prettier --write js/data/radiasthesie.js` | `js/data/radiasthesie.js` danach hashgleich (`9b7b8f15…`) | 0 |

**B9-Detail:** `npm run test:tarot:decks` war zunächst rot (`V1 manifest is byte-identical …`, `f50f46ef…` statt `e3d0548a…`). Ursache: der Arbeitsbaum enthielt die Datei mit CRLF (Checkout-Artefakt), während Index/HEAD die LF-Bytes führen. Nach Zurückführen der Arbeitsbaumdatei auf die Index-Bytes (`git show HEAD:<pfad> > <pfad>`, danach `git add` ohne Inhaltsänderung) ist der Test 12/12 grün und `git status` für die Datei clean; gestageter Inhalt: keiner.

**Umgebungsabweichung, ehrlich benannt:**

1. `node_modules` war im Arbeitsbaum leer; `npm ci` war nötig (852 Pakete, Exit 0, `node_modules/` ist ignoriert).
2. `npm run data:radiasthesie` endet mit Exit 1, weil das npm-Skript `prettier` nicht im PATH findet („Der Befehl prettier … konnte nicht gefunden werden“), obwohl die Datendatei korrekt geschrieben wird. Workaround: `npx prettier --write js/data/radiasthesie.js`; Ergebnis byte-identisch zum Vorzustand. Das ist ein Umgebungs-/Skriptproblem, keine Inhaltsabweichung.
3. Auf Port 3100 lief ein fremder Server (Seite mit `data-page="farbwelten"`, 9 Nav-Links). Der erste Playwright-Lauf traf diesen Fremdstand (2 Fehlschläge) und ist **verworfen**; alle gültigen Läufe nutzen den eigenen Port 3317 gegen `dist/Esoterik-Welt` aus diesem Arbeitsbaum.

## 4. B2 — Ursache und Nachweis

**Ursache:** `js/modules/crystals.js:157–174` hängte `span#favCounter` erst nach dem asynchronen Laden von `data/crystals.json` an `.header-inner`. Der Burger saß vorher bei x = 318 px, danach bei x = 226 px. Ein Tap, dessen Koordinate vor der Verschiebung berechnet wurde, traf die Kopfzeile statt des Buttons.

**Lösung (im echten Markup, nicht im Test):**

- `index.html`: `<span id="favCounter" class="badge badge-primary" aria-label="Anzahl Kristall-Favoriten" aria-live="polite">♥ 0</span>` als drittes Kind von `.header-inner` — Platz ist ab dem ersten Paint reserviert, `updateFavCounter()` findet das Element vor und fügt nichts mehr ein.
- `css/design-system.css`: `#favCounter { min-width: 3rem; justify-content: center; font-variant-numeric: tabular-nums; }` — auch ein zweistelliger Zähler verschiebt nichts mehr.
- `tests/radiasthesie.spec.js`: defensives `waitForFunction` **entfernt** (der Klick erfolgt wieder ohne Wartezeit); neuer Regressionstest „Kopfzeilen-Layout: Burger verschiebt sich nicht mehr (B2)“:
  1. Kontext ohne JavaScript: `#favCounter` muss mit Text `♥ 0` existieren (alter Zustand: Element fehlt),
  2. `data/crystals.json` wird per `route` verzögert → Messung **vor** der Initialisierung,
  3. nach `window.crystalsModule.favCounterEl` erneut messen: Position und Breite unverändert,
  4. `♥ 30` setzen: Breite unverändert, kein horizontaler Überlauf.

**Messung mit identischem Verfahren (`qafix-measure.cjs`, 390×844, verzögerte Daten):**

| Stand | toggleX vor Init | toggleX nach Init | Verschiebung | Zählerbreite |
|---|---|---|---|---|
| ohne statisches Markup (alter Zustand, `dist`-Kopie bereinigt) | 318 | 226 | **−92 px** | 48 px |
| mit statischem Markup (dieser Stand) | 226 | 226 | **0 px** | 48 px |

**Negativkontrolle:** Mit aus `dist/Esoterik-Welt/index.html` entferntem statischem Zähler schlägt der neue Test fehl (`#favCounter` nicht gefunden, Exit 1) — der Test erkennt den alten Zustand also wirklich. Die `dist`-Datei wurde danach aus der Sicherung byte-identisch wiederhergestellt (SHA `b12231ff…`).

## 5. Generierte Dateien

`Lokal*.html` wurden ausschließlich über `npm run build` erzeugt und geprüft:

- Root- und `dist`-Kopie je Datei byte-identisch (`sha256sum -c`),
- drei Build-Läufe erzeugen identische Bytes (`sha256sum -c` je Lauf),
- Stichproben im generierten Stand: `Bezugswert ist 6.500 Bovis-Einheiten` vorhanden, `6.500 = gut` in `Lokal.html`, `dist/Esoterik-Welt/index.html` und `js/data/radiasthesie.js` **0 Treffer**, `ISBN 978-3-406-69119-5` sichtbar, `Nicht im Fließtext zitiert` vorhanden, Fehlerseite rendert `<h2>`, `id="favCounter"` im Markup.

## 6. Restpunkte / nächster Schritt

1. **B6** Sitemap/Indexierbarkeit → RAD-12 (statische HTML-Ausgabe, `t_9e4cd9bb`), nicht hier gelöst.
2. **B7** `og:image` fehlt projektweit; **B8** effektive Titel 69–76 Zeichen → RAD-12/SEO.
3. **B11** unbekannter Kapitel-Slug fällt still auf die Themenseite zurück — Verhalten dokumentiert, Entscheidung offen (Fehlerseite oder Hinweis).
4. **CI-Lücke:** `.github/workflows/ci.yml` ruft `npm run test:radiasthesie` nicht auf (nur pages, crystals, astrologie, offline, tarot, tarot:decks, moon, e2e). Die 16 Modultests laufen dort nicht mit — eigener kleiner CI-Schritt nötig.
5. `npm run format:check` bleibt rot, solange `assets/radiasthesie/media/bildnachweis.html` (RAD-05) unformatiert ist; nicht von dieser Karte angefasst.
6. Kein Push, kein Deployment, keine Gesamtabnahme der 14 Pakete.

## 7. Nachtrag — Prüfung nach dem Commit

Commit `d1c5ea0` (35 Dateien). Direkt danach aus dem committeten Stand erneut ausgeführt:

| Prüfung | Ergebnis | Exit |
|---|---|---|
| `node --test tests/radiasthesie.mjs` | 16/16 | 0 |
| `npm run build` + `git status --porcelain` | Build grün, **keine** Änderung an `Lokal*.html`/`index.html` ⇒ Quellen und generierte Dateien stimmen überein | 0 |
| `npx playwright test tests/radiasthesie.spec.js` (Port 3317) | 13/13 | 0 |

Belege: `evidence/belege/node-tests-nach-commit.log.txt`, `build-nach-commit.log.txt`, `playwright-modul-13-nach-commit.log.txt`. Der Arbeitsbaum enthält danach nur noch fremde, nicht angefasste Verzeichnisse (`assets/radiasthesie/media/`, `docs/radiasthesie-completion/RAD-02|04|05/`).
