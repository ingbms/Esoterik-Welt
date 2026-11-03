# Runner-/Discovery-Trennung und reproduzierbare CI-Gates (t_774c3023)

Stand: 2026-11-01, Workspace `C:/Users/mas/Arbeit/Esoterik-Welt` (CommonJS, HEAD 24d8053).
Kein Commit, kein Push, kein Deploy. Keine Produkt-, Design- oder Deckänderung durch diese Karte.

## 1. Ausgangsbefund (unabhängig reproduziert)

```
$ node node_modules/jest/bin/jest.js --runInBand          # vor der Korrektur
FAIL tests/capture-screenshots.spec.js
  SyntaxError: Cannot use import statement outside a module
Test Suites: 7 failed, 1 passed, 8 total
Tests:       2 passed, 2 total
EXIT=1
```
Log: `evidence/t_774c3023/repro-jest-before.log`.

Ursache: Es gab weder `jest.config.*` noch `playwright.config.*`. Jest nutzt ohne Konfiguration
sein Default-Discovery-Muster und sammelt damit auch die sieben Playwright-Spezifikationen
(`tests/*.spec.js`). Diese sind ES-Module (`import ... from '@playwright/test'`, jetzt
`playwright/test`) und laufen unter CommonJS-Jest nicht. Zusätzlich war `@playwright/test` gar
nicht installiert; das bereits gepinnte Paket `playwright@1.64.1` exportiert `playwright/test`
inklusive Runner (`playwright test`), deshalb ist keine neue Abhängigkeit nötig.

Damit war `npm test` – der von der CI aufgerufene Befehl – dauerhaft rot, obwohl die zwei echten
API-Tests grün waren. Der technische Gate war blockiert.

## 2. Umsetzung

### 2.1 Getrennte Runner-Discovery (Kern der Karte)

| Datei | Zweck |
|---|---|
| `jest.config.cjs` (neu) | `testMatch: ['<rootDir>/tests/**/*.test.js']`, `testEnvironment: node`. Jest sammelt ausschließlich echte Unit-/API-Tests. Projekt bleibt CommonJS. |
| `playwright.config.cjs` (neu) | `testDir: ./tests`, `testMatch: '**/*.spec.js'`, Chromium, `workers: 1`, `webServer: node index.js` (Port 3100), `BASE_URL` überschreibbar. |
| `tests/offline-file.cjs` (neu) | `node:test`-Lauf gegen die echte Offline-Datei `file://…/Lokal.html` (Doppelklick-Pfad). |

Keine Spezifikation wurde gelöscht. `tests/` enthält unverändert 7 Playwright-Suiten mit
zusammen 56 Tests; Jest sieht davon 0.

### 2.2 npm-Scripts (`package.json`)

```json
"test": "jest",                                  // CI-Gate: nur Unit/API
"test:unit": "jest",
"lint": "eslint . --max-warnings 0",
"format:check": "prettier --check \"**/*.{js,cjs,html,css}\" --ignore-unknown",
"test:pages": "node --test tests/pages-regression.cjs",
"test:e2e": "npm run build && playwright test",
"test:offline": "npm run build:local && node --test tests/offline-file.cjs",
"test:all": "npm run test:unit && npm run test:pages && npm run test:offline && npm run test:e2e",
"verify:build": "node scripts/verify-build.cjs"
```
`test:local` und `verify:pages` bleiben unverändert erhalten.

### 2.3 Browser-Suiten auf reproduzierbarer Basis

Alle sieben Suiten hatten `const BASE = 'https://ingbms.github.io/Esoterik-Welt'` (eine:
`http://localhost:8080`) fest verdrahtet und damit gegen die Live-Seite bzw. einen nicht
existierenden Server getestet. Jetzt:

```js
// Parameterised target: default is the local Pages build (npm run test:e2e).
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/Esoterik-Welt';
```
Der Pfad `/Esoterik-Welt/` entspricht exakt der Pages-Auslieferung; `BASE_URL` erlaubt weiterhin
einen Lauf gegen eine Veröffentlichung. Keine Assertion wurde entfernt oder abgeschwächt.

### 2.4 CI (`/.github/workflows/ci.yml`)

- Lint: `npx eslint …` / `npx prettier …` ersetzt durch `npm run lint` / `npm run format:check`.
  Damit läuft kein `npx`-Download von "latest" mehr; die Tools sind exakt gepinnt
  (`eslint 9.39.1`, `@eslint/js 9.39.1`, `globals 16.5.0`, `prettier 3.6.2`) und es existieren
  echte Konfigurationen (`eslint.config.cjs`, `.prettierrc.json`, `.prettierignore`).
- `unit-test`: `npm test` (jetzt korrekt begrenzt), `npm run test:pages`, neu `npm run test:offline`
  inkl. `npx playwright install --with-deps chromium` (gepinnte lokale Playwright-Version).
- `needs: lint` aus `unit-test` entfernt und `build` hängt nur noch an `unit-test`: der rote
  Format-/Lint-Gate soll die inzwischen funktionierenden Runner-Gates nicht mehr verdecken.
  Alle Checks laufen weiterhin und posten ihre eigenen Statuskontexte; nichts wurde abgeschaltet.
- `build`: `node scripts/verify-pages.cjs` (ohne Argumente) prüfte in Wahrheit die **Live-Seite**
  und schrieb in fremdes Evidence. Ersetzt durch `npm run verify:build`
  (`scripts/verify-build.cjs`): startet den lokalen `index.js`-Server, prüft den frisch gebauten
  `dist/`-Artefaktstand und schreibt nach `test-results/verify-pages`.
- Neuer Job `browser-e2e`: `npm run test:e2e` gegen lokalen Build, Report als Artefakt,
  Statuskontext `ci/browser-e2e`.

## 3. Ausgeführte Prüfungen (reale Läufe, nach `npm ci` aus dem Lockfile)

| # | Befehl | Exit | Ergebnis |
|---|---|---|---|
| 1 | `npm ci` | 0 | Lockfile-Installation sauber (`evidence/t_774c3023/npm-ci-clean.log`) |
| 2 | `npm test` | 0 | 1 Suite, 2 Tests grün, **0** Playwright-Suiten gesammelt |
| 3 | `npx jest --listTests` | 0 | genau `tests/api.test.js` |
| 4 | `npm run test:pages` | 0 | 6/6 `node:test` grün |
| 5 | `npm run test:offline` | 0 | 2/2 grün, `file://`-Lauf ohne Netzwerk, ohne Konsolenfehler |
| 6 | `npm run test:e2e` | 0 | 56/56 Browser-Tests, 7 Suiten |
| 7 | `npm run build` | 0 | `dist/Esoterik-Welt/` neu gebaut |
| 8 | `npm run verify:build` | 1 | 30 Seiten/Viewports, **1 Fehler** – siehe 5.3 |
| 9 | `npm run lint` | **1** | 2 Fehler (siehe 5.1) |
| 10 | `npm run format:check` | **1** | 37 Dateien (siehe 5.2) |

Logs liegen vollständig unter `evidence/t_774c3023/`.

### 3.1 Playwright pro Suite (separate Kommandos)

```
npx playwright test tests/<suite>.spec.js --reporter=line
```
Log: `evidence/t_774c3023/playwright-per-suite.log`.

| Suite | Tests | Exit |
|---|---|---|
| capture-screenshots.spec.js | 10 | 0 |
| console-check.spec.js | 3 | 0 |
| f4-fixes-verification.spec.js | 14 | 0 |
| link-check.spec.js | 3 | 0 |
| regression-f4-links.spec.js | 6 | 0 |
| regression-f4-links-staging.spec.js | 6 | 0 |
| smoke-test-production.spec.js | 14 | 0 |
| **Summe** | **56** | **alle 0** |

Gegenprobe vor der Korrektur: `npx playwright test` war nicht ausführbar (kein Konfigurationspfad,
`@playwright/test` nicht installiert); alle sieben Suiten scheiterten bereits in Jest an ESM.

## 4. Geprüfte Altannahmen (keine blinden Snapshot-Updates)

Sechs Assertions waren nicht "kaputt", sondern beschrieben einen Stand vor dem `<base>`-Fix
(`/Esoterik-Welt/`) bzw. vor bewusst getroffenen Produktentscheidungen. Jede wurde am echten DOM
verifiziert und dann präzisiert:

| Fund | Alter Stand | Tatsächlicher Stand | Änderung |
|---|---|---|---|
| 404-Link (`f4-fixes`, `regression-f4-links`, `-staging`, `smoke`) | `a[href="/#home"]` | `a[href="/Esoterik-Welt/#home"]` (404.html trägt `<base>`) | Selektor auf realen Link; zusätzlich `expect(doc.status()).toBe(404)` |
| Footer-Rechtslinks (`f4-fixes`, `smoke`) | `a[href="/impressum.html"]` | `href="impressum.html"` relativ zur `<base>` | Selektor korrigiert; Klickziel weiterhin `/impressum.html` |
| `link-check` 404-Links | naive Verkettung `BASE + href` → `/Esoterik-Welt/Esoterik-Welt/` | Links sind projektabsolut | Auflösung über `document.baseURI` (`new URL(href, baseURI)`) |
| `console-check` 404-Konsole | `errors.length === 0` | Chromium protokolliert den absichtlichen 404 des **Dokuments** selbst (per Probe belegt: einzige Meldung, einzige ≥400-Antwort ist das Dokument) | Genau 1 erwartete Navigationsmeldung, alle übrigen Konsolenfehler und **alle** fehlgeschlagenen Subressourcen müssen leer sein |
| `regression-f4-links-staging` Stylesheet | `link[rel=stylesheet]` `.first()` | Google-Fonts-Link steht vor `design-system.css` | expliziter Selektor + Auflösung gegen `baseURI` |
| `smoke` Legal-Seiten | `locator('main, article, body')` | drei Treffer → Strict-Mode-Fehler | `body` **und** `main#main` sichtbar |
| OG/Twitter-Metas (`f4-fixes`) | `og:image`/`twitter:image` zeigen auf Domain | Entscheidung L3 (t_b5861420): kaputtes `og-preview.png` entfernt | `og:url`/`canonical` korrekt, `og:image`/`twitter:image` **müssen fehlen**, `twitter:card=summary` |

Die 404-Konsolenhypothese wurde nicht angenommen, sondern gemessen:
`evidence/t_774c3023/probe-404-console.json` (einzige Konsolenmeldung = Dokument-404,
`failedResponses` = genau ein `document`-404, keine Subressource).

## 5. CI-Pflichtwege: grün vs. explizit rot

### 5.0 Ablauf der Build-Verifikation (zeitliche Einordnung)

`verify:build` lief zweimal mit unterschiedlichem Ergebnis, weil die parallel laufende Karte
`t_f81e9094` während dieser Karte `css/main.css` (19:24) und `js/main.js` (19:26) verändert hat:

- Lauf 1 (19:2x, vor der CSS-Änderung): `30 pages/viewports checked; 0 failures`, Exit 0
  (`evidence/t_774c3023/ci-verify-build.log`).
- Lauf 2 und 3 (nach der Änderung, reproduziert): `30 pages/viewports checked; 1 failures`, Exit 1
  (`ci-verify-build-snapshot.log`, `ci-verify-build-run3.log`).

### 5.3 Build-Gate rot: Überlauf der Mondseite bei 375 px (fremde Ursache)

```
FAIL 375 moon: horizontal overflow
```
Messung (`evidence/t_774c3023/probe-moon-detail.json`, `probe-overflow-moon-375.json`):
`innerWidth 375`, `document.documentElement.scrollWidth 421`. Nur die Route `#moon` betroffen;
`#home`, `#tarot`, `#crystals`, `#runes`, `#blog` messen exakt 375.
Verursacher: die Karte „Monatsübersicht" (`clientWidth 341`, `scrollWidth 404`) mit dem
7-spaltigen `#moonCalendar`-Grid, das bei 375 px nicht schrumpft.
Diese Änderung stammt aus `t_f81e9094` (CSS/JS nach 19:24), nicht aus dieser Karte; ein
App-/Styling-Fix ist hier ausdrücklich nicht Teil des Auftrags. Handoff: `#moonCalendar` unter
375 px spaltenschrumpfend machen (bzw. `overflow-x` kontrollieren) und `npm run verify:build`
erneut ausführen — der neue Gate erkennt genau diesen Fall.

### 5.1 ESLint — rot, 2 Fehler, außerhalb der Schreib-Allowlist

```
js/main.js:496            error  'debounce' is defined but never used        no-unused-vars
scripts/build-local.cjs:42 error  Unnecessary escape character: \"           no-useless-escape
```
`js/main.js` ist Produktcode (tote Hilfsfunktion aus einem Refactoring), `scripts/build-local.cjs`
ist fremde uncommittete Arbeit. Beides wird hier **nicht** angefasst (Kartengrenze: keine
App-Änderung). Fixhandoff: 4 Zeilen toten `debounce`-Helper in `js/main.js` entfernen, Escape in
`scripts/build-local.cjs:42` auflösen. Danach ist `npm run lint` grün.
Konfiguriert wurden nur sachfremde Fehlalarme: Browser-Globals in `page.evaluate`-Callbacks,
Jest-Globals in `*.test.js`, archiviertes `js/modules/_tarot_old.js` (nicht im Build enthalten,
`dist/` enthält es nicht) sowie vendored `docs/**`.
Zwischenschritte: 149 → 40 → 9 → 2 Fehler (`eslint-check*.log`).

### 5.2 Prettier — rot, 37 Dateien

`npm run format:check` meldet 37 unformatierte Dateien (Liste:
`evidence/t_774c3023/prettier-drift-files.txt`), darunter `index.html`, `css/*.css`,
`js/*.js`, `scripts/*.cjs`, `tests/*.cjs`. Das ist der im Kartentext genannte Fall
"breiter Bestandslint weicht stark ab": Ein `prettier --write` würde praktisch alle Produktdateien
kosmetisch umschreiben — unautorisierte Massenreformatierung und Kollisionsfläche mit den parallel
laufenden Produktkarten. Deshalb **kein** Reformat.
Konfiguriert wurde nur, was nicht formatiert werden soll (Build-Output, Evidence, vendored
`docs/**`, generierte `Lokal*.html`, Lockfile) — die Prüfmenge selbst bleibt vollständig.
Fixhandoff: eigene Format-Baseline-Karte (`prettier --write` auf die 37 Dateien, danach
Sichtprüfung/Regressionslauf), erst danach kann `ci/lint` grün werden.

## 6. Geänderte Dateien (Allowlist dieser Karte)

Neu:
- `jest.config.cjs`, `playwright.config.cjs`, `eslint.config.cjs`
- `.prettierrc.json`, `.prettierignore`
- `scripts/verify-build.cjs`, `tests/offline-file.cjs`

Geändert:
- `package.json` (Scripts + gepinnte devDependencies), `package-lock.json` (Lockfile-Refresh)
- `.github/workflows/ci.yml` (Lint-Pinning, Job-Abhängigkeiten, Offline-Step, `verify:build`, `browser-e2e`)
- `.gitignore` (`test-results/`, `playwright-report/` – verhindert 24 MB Testartefakte im Repo)
- `tests/capture-screenshots.spec.js`, `tests/console-check.spec.js`,
  `tests/f4-fixes-verification.spec.js`, `tests/link-check.spec.js`,
  `tests/regression-f4-links.spec.js`, `tests/regression-f4-links-staging.spec.js`,
  `tests/smoke-test-production.spec.js` (Imports, BASE-Parametrisierung, Altannahmen aus Abschnitt 4)

Hashes vorher/nachher der Spezifikationen:

| Datei | vorher | nachher |
|---|---|---|
| capture-screenshots.spec.js | 7a11ca65784e | 25d7de884d30 |
| console-check.spec.js | cd60ba6819fe | 749fe76c66a6 |
| f4-fixes-verification.spec.js | ed1775f7c2b7 | 9a92c607f833 |
| link-check.spec.js | 482abd45a284 | d265666692cc |
| regression-f4-links.spec.js | 8ce694f2861f | c5839cb22b38 |
| regression-f4-links-staging.spec.js | 2ce3a71318df | 3f1b1b88b140 |
| smoke-test-production.spec.js | 4b4490c30148 | a9123b833772 |

## 7. Geschützte Dateien

Unverändert (Hash-Vergleich vor/nach, `evidence/t_774c3023/`):
`docs/ci-cd-pipeline.md`, `404.html`, `scripts/build-pages.cjs`, `scripts/build-local.cjs`,
`scripts/verify-pages.cjs`, `tests/api.test.js`, `tests/local-entry.cjs`, `tests/pages-regression.cjs`,
`robots.txt`, `sitemap.xml`, `data/*`.

Die drei bereits gelöschten Workflows (`deploy-production.yml`, `deploy-staging.yml`,
`test-broken-notification.yml`) bleiben gelöscht; ihre Referenzfassungen unter `docs/ref-workflows/`
wurden nicht angefasst.

`Lokal.html` und die vier `Lokal-*.html` wurden durch `npm run build:local` neu erzeugt und sind
**bytegleich** zum vorherigen Stand (`lokal-hash-before.txt` vs. `lokal-hash-after.txt`).

**Wichtig:** Während dieses Laufs hat die parallel laufende Karte `t_f81e9094` Produktdateien
verändert (`index.html`, `css/main.css`, `css/design-system.css`, `js/main.js`; eigenes
`evidence/t_f81e9094/` ab 19:22). Diese Änderungen stammen nicht aus dieser Karte und wurden
weder übernommen noch zurückgesetzt. Die Prüfungen dieser Karte liefen gegen den zu diesem
Zeitpunkt gültigen Stand; `snapshot-pre.txt`/`snapshot-post.txt` dokumentieren die Hash-Stabilität
während des letzten Durchlaufs, `snapshot-drift.log` die Abweichungen.

## 8. Grenzen

- Windows/Chromium 156, keine Cross-Browser-/Realgeräteprüfung (wie in den Vorgängerkarten).
- `ci/lint` bleibt rot (5.1/5.2); `ci/build` ist aktuell rot wegen des fremden Mond-Überlaufs
  (5.3). Runner-Gates `ci/unit-test` und `ci/browser-e2e` sind lokal vollständig reproduziert und
  grün, auch auf dem von `t_f81e9094` veränderten Produktstand.
- GitHub-Actions-Lauf nicht ausgeführt (kein Push); die Job-Definitionen sind YAML-validiert und
  ihre Kommandos lokal identisch ausgeführt (`npm ci` + dieselben Scripts).
- Während des Laufs hat `t_f81e9094` Produktdateien geändert (`snapshot-drift.log`: `js/main.js`
  zwischen Start und Ende des letzten E2E-Laufs). Der Durchlauf blieb 56/56 grün, ist aber ein
  bewegtes Ziel; die QA-Karte muss auf einem ruhenden Stand erneut messen.
- `regression-f4-links-staging.spec.js` ist inhaltlich weiterhin ein Duplikat von
  `regression-f4-links.spec.js`; beide laufen gegen dieselbe lokale Basis. Zusammenlegen wäre eine
  Testentfernung und ist hier bewusst unterblieben.
- Keine Produkt-/Designfreigabe. Technisches Gate bleibt `t_676d2563`, Release `t_32e80593`.
