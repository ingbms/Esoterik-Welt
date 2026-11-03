# CHECKPOINT RAD-03 — Taxonomie und Datenverträge

## 1. Stand

| Punkt | Wert |
| --- | --- |
| Arbeitsbaum | `C:/Users/mas/Arbeit/esow-rad-t_878c59c7` |
| Branch | `feature/radiasthesie-modul` |
| Basis-Commit | `092add2b9a5d498ff37a1c4d895eb5b73f459746` (QAFIX, ohne Push) |
| Commit | `66439e5` — 11 eigene Dateien, 0 fremde; kein Push |
| Kanban-Karte | `t_02211b50`, Modell `deepseek/deepseek-flash` |
| Ergebnis | **umgesetzt und verifiziert** — additive Taxonomie, versionierte Verträge, Lauf-/Journal-Lebenszyklus, Import/Export |
| Push/Deploy | **keiner** |

Vorhandenes Modell bei Arbeitsbeginn: `js/data/radiasthesie.js` (1514 Z.,
generiert) mit `module`, `counts`, `levels[5]`, `topics{3}` (30 Kapitel),
`glossary` (13), `sources` (33), `landing`, `legal`.

## 2. Datei-Allowlist (vor der ersten Änderung festgelegt)

**Neu und committet:**

| Datei | Zweck | SHA-256 |
| --- | --- | --- |
| `docs/radiasthesie-konzept/daten/taxonomie.json` | Redaktionelle Quelle der Wahrheit, `$schema_version: "1.0"` | `662fd1e7…a9` |
| `js/modules/radiasthesie-vertraege.js` | Prüfung, Lauf-/Journal-Lebenszyklus, Import/Export (ESM, ohne DOM) | `59bbb526…79` |
| `js/data/radiasthesie-werkstatt.js` | Eingefrorene Fassade für RAD-07–RAD-10 | `cc183e04…bd` |
| `js/package.json` | `{"type":"module"}` für `js/**/*.js` (Node = ESM, wie im Browser) | `6dc1b06d…d1` |
| `tests/radiasthesie-vertraege.mjs` | 19 Vertragstests | `84c1ffe7…5c` |
| `docs/radiasthesie-completion/RAD-03/CHECKPOINT.md` | dieser Bericht | — |
| `docs/radiasthesie-completion/RAD-03/VERTRAEGE.md` | Vertragsdokumentation inkl. Anschluss 07–10 | `6e791103…50` |

**Geändert, additiv:**

| Datei | Änderung | SHA-256 |
| --- | --- | --- |
| `js/data/radiasthesie.js` | generiert; **nur** `schemaVersion` + `taxonomie` ergänzt (1195 Zeilen, 0 Löschungen) | `1880fddd…19` |
| `scripts/generate-radiasthesie-data.cjs` | lädt/validiert `taxonomie.json`, prüft Mediendateien, schreibt Zusatzfelder, `main()` async | `29d7b271…3c` |
| `package.json` | `test:radiasthesie:vertraege`, Aufnahme in `test:all`, `npx prettier` im Daten-Skript | `0b032e95…aa` |
| `Lokal.html` | Offline-Build mit eingebetteten Daten, 1 Zeile | `41c22de1…b7` |

**Nicht angefasst:** `js/modules/radiasthesie-views.js`, `radiasthesie-model.js`,
CSS/HTML außer dem generierten `Lokal.html`, redaktionelle Markdown-Quellen,
`.github/`, `assets/radiasthesie/media/`,
`docs/radiasthesie-completion/{RAD-02,RAD-04,RAD-05}/`, `evidence/`.

## 3. Umsetzung

- **Sieben Entitätstypen** mit den Basisfeldern der Originalanforderung
  (`id`, `slug`, `title`, `category`, `summary`, `body`, `tags`, `relatedTopics`,
  `references`, `images`, `evidenceStatus`, `reviewStatus`, `lastReviewed`) plus
  typspezifischen Pflichtfeldern: 7 Instrumente, 6 Methoden, 12 Ereignisse,
  6 Erklärungsmodelle, 7 Studien, 10 Medien, 3 Experimente.
- **Additiv**: `RADIASTHESIE.schemaVersion` und `RADIASTHESIE.taxonomie`;
  Artikel-/Quellenmodell unverändert (16 Bestandstests grün).
- **Referenzielle Integrität**: Quellen `Qxx` müssen im Verzeichnis stehen,
  `relatedTopics` in den drei Themen, `images` in den Medien; `id`/`slug` global
  eindeutig; Studien-`sourceId` muss in `references` stehen.
- **Medien**: 4 verfügbare eigene SVGs (Dateiexistenz im Generator geprüft),
  6 geplante Fotos als `planned` mit `file: ""` und ungeprüfter Lizenz (RAD-05).
- **Experimentprotokoll**: `k` 2–10, `n` 10–200, `stopRule: fixed-n`,
  `analysis` enthält `binomial-exact`, `baseProbability === 1/k`.
- **Laufvertrag**: `experimentId` (Katalog) + `runId` (Lauf); je Versuch
  `targetCommitment` (SHA-256, Salt nur im Speicher), `predictionLocked`
  (unveränderlich), `resultRevealed`. Reihenfolge und Trefferformel erzwungen;
  `publicSnapshot` enthält kein Ziel vor der Enthüllung.
- **Journalvertrag**: Pflichtfelder `date`/`question`/`prediction`, Grenzen
  200/200/500/500, `confidence` 1–5, `experimentId` + `runId` referenziell
  geprüft; `entryFromRun` nur für vollständig enthüllte Läufe.
- **Import/Export**: Umschlag `{schema:1, app:"esoterik-welt", kind, exportedAt, data}`,
  ≤ 1 MiB, atomar, unbekannte Felder ignoriert, Fehler mit Feldpfad.

## 4. Ausgeführte Tests

| Prüfung | Kommando | Ergebnis |
| --- | --- | --- |
| Bestandsmodul | `node --test tests/radiasthesie.mjs` | **16/16**, Exit 0 |
| Neue Verträge | `node --test tests/radiasthesie-vertraege.mjs` | **19/19**, Exit 0 |
| Lint | `npm run lint` | **0 Fehler**, Exit 0 |
| Format | `npx prettier --check` (5 geänderte JS/MJS/CJS-Dateien) | alle konform, Exit 0 |
| Seitenmodule | `npm run test:pages` | **6/6**, Exit 0 |
| Build | `npm run build` | Exit 0, `Lokal.html` +1/−1 Zeile |
| Offline | `npm run test:offline` | **2/2**, Exit 0 |
| Lokale Seitenprüfung | `verify-pages.cjs http://localhost:3411/Esoterik-Welt/` | **36/36** Seiten/Viewports, 0 Fehler |
| Build-Prüfung | `npm run verify:build` | **36/36**, 0 Fehler |
| Browser Modul | `E2E_PORT=3417 npx playwright test tests/radiasthesie.spec.js` | **13/13**, Exit 0 |
| Browser gesamt | `E2E_PORT=3418 npx playwright test` | **87/87**, Exit 0 |
| Generator idempotent | `npm run data:radiasthesie` (2×) | Daten-Hash `1880fddd…` unverändert |
| Generator-Negativpfad | Q99 injiziert, Generator | **Exit 1**: `FEHLER: Taxonomie ungültig (1 Fehler): instrumente[0].references: unbekannte Quelle: Q99`; Datenhash danach unverändert, Quelle wiederhergestellt |

Hinweise zur Reproduktion:

- `E2E_PORT` ist nötig, weil auf Port 3100 ein fremder Server eines anderen
  Arbeitsbaums läuft (9 Navigationseinträge, kein `#favCounter`); mit
  `reuseExistingServer` würde Playwright sonst den falschen Build prüfen.
- `verify-pages.cjs` ohne URL-Argument prüft die **Live-Seite**
  (`ingbms.github.io`), nicht den Arbeitsbaum. Lokal ist der URL-Parameter Pflicht.
- `TMP`/`TEMP`/`TMPDIR` waren für alle Läufe auf
  `C:/Users/mas/AppData/Local/hermes/cache/scratch` gesetzt.
- Ein erster Commit-Versuch enthielt über den Index unbeabsichtigt fremde
  `docs/radiasthesie-completion/RAD-04/`-Dateien. Er wurde vor dem Push
  verworfen (`git reset --soft HEAD~1` + `git reset`, Dateien unverändert) und
  durch `66439e5` mit ausschließlich eigenen Pfaden (`git commit --only`)
  ersetzt. Die fremden Dateien sind weiterhin untracked und unangetastet.

## 5. Restpunkte

| Punkt | Zuständig |
| --- | --- |
| Statistik-Rechenkerne (exakter Binomialtest, Wilson-95-%, `p`-Formatierung) | RAD-09; Eingaben hier erzwungen |
| Speicher, Quota, Löschung, In-Memory-Fallback, Salt-Verwurf beim Reload | RAD-09/RAD-10 (Vertrag in `KOMPONENTENGRENZEN.md` §6, hier als Verhalten dokumentiert) |
| Tafel-Payload/SVG und Import eigener Tafeldateien | RAD-08; Umschlag `tafel` hier nur formal geprüft |
| Lizenzprüfung der 6 geplanten Fotos | RAD-05; bleiben `planned`, `file: ""` |
| `test:radiasthesie` und `test:radiasthesie:vertraege` in CI | RAD-13 (CI ruft derzeit keinen der beiden auf) |
| Nutzlast: `js/data/radiasthesie.js` wuchs von ca. 55 kB auf 148,9 kB (Taxonomie ~93 kB), wird nur mit dem Modul geladen | optional später: Taxonomie separat lazy laden; Vertragsfassade bleibt stabil |

## 6. Nächster Schritt

RAD-09 und RAD-10 implementieren gegen `js/data/radiasthesie-werkstatt.js` und
`js/modules/radiasthesie-vertraege.js` (`VERTRAEGE.md` §8). RAD-09 beginnt mit
`createRun`/`beginTrial`/`lockPrediction`/`revealResult`; RAD-10 mit
`createEntry`/`entryFromRun` und dem Journal-Export. Vor der Abnahme der 14
Pakete bleiben RAD-05, RAD-07–RAD-10, RAD-12 und RAD-13 offen.
