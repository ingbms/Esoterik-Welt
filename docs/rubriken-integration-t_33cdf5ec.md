# Rubriken-Integration: Pendeln und Farben zurück in `main` (t_33cdf5ec)

Stand: 2026-11-03 · Basis: `origin/main` `47981b4` · Branch: `feature/rubriken-vollstaendig`

## 1. Befund

Die Live-Seite (GitHub Pages aus `main`) führte acht Navigationsziele; `#pendeln` und
`#farbwelten` fehlten vollständig, ebenso `js/data/radiasthesie.js`,
`js/data/radiasthesie-werkstatt.js`, `js/data/farbwelten.js` und `js/data/chakren.js`.
Ursache war kein Lösch-Commit, sondern eine never-merged-Integration: der
Frequenzstand (`integrate/frequenzlabor-final` → `47981b4`) zweigte von `b18bdb3` ab,
die freigegebenen Branches `feature/radiasthesie-modul` (`ea08d07`, ESOW-RAD-000) und
`feature/farbwelten-modul` (`30a2f62`, Abnahme `t_aa938907`) wurden nie nach `main`
gemergt.

## 2. Merge-Reihenfolge

1. `feature/rubriken-vollstaendig` von `origin/main` (`47981b4`) — nicht vom lokalen `main` (`5d327ed`).
2. `git merge --no-ff feature/radiasthesie-modul` → `8 Konflikte` (Lokal.html, index.html, js/main.js, package.json, scripts/build-pages.cjs, scripts/verify-pages.cjs, tests/local-entry.cjs, tests/offline-file.cjs). Commit `a7dad07`.
3. `git merge --no-ff feature/farbwelten-modul` → `5 Konflikte` (.gitattributes, js/main.js, package.json, scripts/verify-pages.cjs, tests/offline-file.cjs); `index.html` fusionierte automatisch, weil beide Branches auf demselben Sektionsmuster aufsetzten.

Konfliktregel war durchgehend Union; keine Auflösung mit `--ours`/`--theirs`.

## 3. Konfliktentscheidungen

| Datei | Entscheidung |
|---|---|
| `index.html` | Beide Stylesheets (`frequenzlabor.css`, `radiasthesie.css`, `farbwelten.css`); Navigation und Sektionen sind Union. Ergebnis: 10 Ziele, 10 Sektionen, 3 Roots (`astrologieRoot`, `frequenzlaborRoot`, `pendelnRoot`, `farbweltenRoot`). Footer beider Seiten zusammengeführt. |
| `js/main.js` | `MAIN_PAGES` als Union in Zielreihenfolge; `PAGE_META` mit `frequenzen`, `frequenzenQuellen`, `pendeln`, `farbwelten`; `FREQUENZ_ROUTE`/`FREQUENZ_ALIAS`, `PENDELN_ROUTE`, `FARBWELTEN_ROUTE` + Aliase gleichzeitig; `applyRoute` mit beiden Bereichszweigen; `navigateTo` mit `metaPage` **und** `deepLinkFocus`. Beim Init-Settle wurde die Hash-Vergleichslogik des Frequenzstands behalten und um den Farbwelten-Kaltstart plus Anker-Ausnahme ergänzt. |
| `package.json` | Alle Skripte beider Seiten plus Frequenzskripte; `test:all` als Union-Kette (unit, pages, crystals, frequencies, frequenz, frequenz-budget, astrologie, radiasthesie + sechs Teil-Suiten, farbwelten, tarot, tarot:decks, moon, offline, e2e). |
| `scripts/build-pages.cjs` | Struktur des Radiästhesie-Stands (`buildStaticPages()` → Kopie → `buildLocal`) übernommen und die Kopie des Frequenz-Quellendokuments `docs/frequenz-quellen.md` dort eingehängt. Zusätzlich `content` in den Entries, damit die Vorschau denselben Dokumentbestand hat wie Pages (Pages liefert das Repo-Wurzelverzeichnis). |
| `scripts/verify-pages.cjs` | Ein Routenlauf für alle Bereiche, `featureCount` 9, `activePage` mit `route.split('/')[0]` (Farbwelten-Unterrouten). |
| `tests/local-entry.cjs`, `tests/offline-file.cjs` | Beide Testwelten erhalten (Pendeln- und Farbwelten-Deep-Links, `module`-Liste inkl. `frequenz`, `pendeln`, `farbwelten`), Kartenzahl 9. |
| `Lokal.html` | Build-Artefakt. Konflikt nicht von Hand aufgelöst, sondern nach den Merges mit `npm run build:local` aus den Quellen neu erzeugt (Union per Konstruktion). |
| `.gitattributes` | Beide `-text`-Einträge (`js/data/astrologie.js`, `assets/tarot/nachtatelier-v1/manifest.json`, `js/data/farbwelten.js`). |

## 4. Integrationsentscheidungen

1. **Startseite:** `pendeln` und `farbwelten` als Karten 07 und 08 aufgenommen, `blog` bleibt 09; Label „Neun Zugänge“; `populateFeatureGrid()` nummeriert 01–09. Die Frequenzkarte bleibt.
2. **Initialer JS-Graph:** Beide neuen Bereiche laden über je einen kleinen Lazy-Proxy (`js/modules/radiasthesie-loader.js`, `js/modules/farbwelten-loader.js`, Muster von `frequenzlabor-loader.js`). Ohne diesen Schritt zog allein `js/data/radiasthesie.js` (259 KB roh) über `radiasthesie-werkstatt.js` in den Initialpfad: 289.718 B gzip statt 88.912 B.
3. **Kopfzeile:** Mit zehn Zielen reichte das kompakte Band des Farbwelten-Stands (901–1120 px, 8 px Abstand) nicht mehr: 901 px lief 7 px über, und oberhalb von 1120 px kippte die Zeile bei 1121–1150 px (29 px Überlauf bei 1121 px). Die Regel gilt jetzt für 901–1165 px; der schmalste Bereich 901–1000 px nutzt 4-px-Abstände (Reserve 88,63 px bei 901 px). Alle Messungen: `evidence/rubriken-integration/`.
4. **Sitemap:** `radiasthesie/*.html` bleibt vollständig; Farbwelten-Routen wurden **nicht** als Fragment-URLs ergänzt. Die Sitemap enthält bewusst nur echte Dokumente (Kopfkommentar der Datei, `tests/farbwelten.spec.js` prüft genau das), Frequenzen sind aus demselben Grund nicht enthalten. `content/farbwelten/*.md` wird über Pages (Repo-Wurzel) und jetzt auch in `dist/` ausgeliefert.
5. **Testinfrastruktur (notwendig für grüne Suiten):**
   - Acht Browser-Specs aus den beiden Modul-Branches bildeten ihre Basis-URL selbst mit Default-Port **3100** und ignorierten `tests/helpers/e2e-target.cjs`; sie liefen damit gegen einen fremden/stalen Server (56 Fehlschläge, 7 Timeouts). Alle acht nutzen jetzt den gemeinsamen Helper (Port 3310, `BASE_URL` überschreibt).
   - `jest.config.cjs`: `testMatch` relativ statt absolut, sonst findet Jest in Worktree-Pfaden mit Sonderzeichen (`.worktrees\t_…`) keine Datei und `npm run test:unit` bricht ab.

## 5. Tests (lokal, Node 24.13 / npm 11.8, Windows)

| Suite | Ergebnis |
|---|---|
| `npm run build` | grün (7 statische Dokumente, Sitemap 11 Einträge, offline + production build) |
| `npm run test:unit` | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:crystals` | 9/9 |
| `npm run test:frequencies` | 14/14 |
| `npm run test:frequenz` | 67/67 |
| `npm run check:frequenz-budget` | **NFR-1 rot**, NFR-2/NFR-3 grün — siehe Abschnitt 7 |
| `npm run test:astrologie` | 21/21 |
| `npm run test:radiasthesie` (+ statisch, vertraege, simulator, tafeln, experiment, journal) | 25 + 14 + 20 + 21 + 37 + 24 + 26 = 167/167 |
| `npm run test:farbwelten` | 10/10 |
| `npm run test:tarot` / `test:tarot:decks` / `test:moon` | 11/11 · 12/12 · 14/14 |
| `npm run test:offline` | 2/2 |
| `npx playwright test` (`test:e2e`) | 201/201 in 4,2 min |
| `npm run lint` / `npm run format:check` | 0 Fehler / Prettier clean |
| `npm run verify:pages` (lokaler Build) | 51 Seiten/Viewports, 0 Fehler; 7 statische Dokumente 0 Fehler; Sitemap 11 Einträge |
| `npm run verify:build` | 51 Seiten/Viewports, 0 Fehler |
| `npm run verify:farbwelten` (lokaler Build) | 56 Prüfungen, 0 fehlgeschlagen; Kopfzeile 10 Ziele ab 901 px, Reserve 88,63 px |
| `node scripts/verify-rubriken.cjs` | 18 Schritte, 0 Befunde, 0 Konsolenmeldungen |

Summe der Node-Suiten: 335 Tests grün, 1 Gate rot (NFR-1). Browser: 201 Fälle grün.

## 6. Browser-Nachweis

`scripts/verify-rubriken.cjs` prüft am gebauten Stand:

- 10 Navigationsziele in Zielreihenfolge (Start · Tarot · Kristalle · Mondphasen · Astrologie · Frequenzen · Runen · Pendeln · Farben · Wissen),
- 10 `<section class="page">`-IDs,
- 9 Startseitenkarten, Label „Neun Zugänge“, Nummerierung 01–09,
- Klick auf jedes der 10 Ziele: Hash korrekt, genau ein `aria-current="page"`,
- Kaltstart-Deep-Links `#pendeln`, `#pendeln/radiasthesie`, `#farbwelten`, `#farbwelten/rot`, `#frequenzen`, `#frequenzen/labor` rendern echten Inhalt,
- Mobilmenü (390 px) zeigt alle 10 Ziele,
- keine Konsolenfehler/-warnungen, keine fehlgeschlagenen Requests.

Screenshots und JSON: `evidence/rubriken-integration/` (`start-1440.png`, `pendeln-1440.png`, `farbwelten-1440.png`, `farbwelten-rot-1440.png`, `frequenzen-1440.png`, `frequenzen-labor-1440.png`, `start-390-menue.png`, `rubriken-smoke.json`).

## 7. Offener Punkt: NFR-1 des Frequenz-ADR

`npm run check:frequenz-budget` (CI-Schritt) meldet:

```
FAIL NFR-1 Initialgraph (statisch)  19 Dateien  296.520 B roh  88.912 B gz  Limit 86.275 B
ok   NFR-2 Feature-JS               46.884 B gz / 100.000 B
ok   NFR-3 Feature-CSS               3.951 B gz /   6.000 B
```

Basis vor dieser Karte: 85.822 B / Limit 86.275 B, also 453 B Reserve. Die zwei neuen
Rubriken kosten 3.090 B gzip: 2.013 B Router-/Meta-/Kartenzeilen in `js/main.js` und
1.077 B für die beiden Lazy-Proxy-Loader. Das ist bereits die im ADR vorgesehene
Minimalform („wächst nur um Loader und Router-Zeilen“); ohne die Loader wären es
+203.896 B.

Die Reserve war für eine Seite mit acht Rubriken kalibriert. Eine Entscheidung ist nötig:

- **A (empfohlen):** NFR-1-Basis im ADR um die zwei Rubriken anheben (86.275 → 89.400 B) und die Messung dokumentieren. Danach ist das Gate grün.
- **B:** Zusätzlich Datenmodule bestehender Rubriken (z. B. `js/data/tarot.js`, 12.294 B gz) hinter Lazy-Imports legen; das Gate wäre mit großem Abstand grün, ändert aber freigegebene Module außerhalb dieser Karte.
- **C:** NFR-1 als WARN statt FAIL führen — schwächt das Gate und wird nicht empfohlen.

Bis zur Entscheidung bleibt der CI-Schritt rot; alle anderen Suiten sind grün.
