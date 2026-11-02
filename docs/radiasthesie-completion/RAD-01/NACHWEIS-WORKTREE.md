# Nachweis: Worktree-Kontinuität und unveränderte Fremdarbeit

Stand: 3. November 2026, 00:50 CET · Basis-Commit `e44fa5c54c80cb39383fa4177aa587236dc87596`
(unverändert) · Ergebnis: eigener Commit auf `feature/radiasthesie-modul`, ausschließlich
`docs/radiasthesie-completion/RAD-01/`.

## 1. Identität des Arbeitsbaums

| Punkt | Wert |
| --- | --- |
| Arbeitsbaum | `C:/Users/mas/Arbeit/esow-rad-t_878c59c7` (Karten-Workspace, `workspace_kind: dir`) |
| Branch | `feature/radiasthesie-modul` |
| Basis-Commit | `e44fa5c54c80cb39383fa4177aa587236dc87596` (vor und nach diesem Lauf unverändert) |
| Ergebnis-Commit | eigener Commit mit 8 Dateien; `git show --stat HEAD` weist ausschließlich RAD-01 aus |
| Kanonisches Repository | `C:/Users/mas/Arbeit/Esoterik-Welt`, Branch `feature/farbwelten-modul` — **nur lesend** benutzt |
| Parallel genutzter Fremdbaum | Farbwelten arbeitet im kanonischen Repository; dort wurde nichts geschrieben und kein Branch gewechselt |
| Kein `hermes-adaptive-router/.worktrees` | bestätigt, dieser Lauf hat dort nichts angefasst |

## 2. Kontinuität des Moduls (kein Neustart)

Der vorhandene Stand ist unverändert vorhanden und wird von diesem Lauf nur
beschrieben:

| Artefakt | Nachweis |
| --- | --- |
| 3 Themenseiten, 30 Kapitel | `js/data/radiasthesie.js` (`counts: {topics:3, chapters:30, levels:5, sources:33, glossary:13}`) |
| 7 Routen + Fehleransicht | `js/main.js:37,127,431`; `js/modules/radiasthesie-model.js:84-110` |
| 33 Quellen | `docs/radiasthesie-konzept/recherche/quellen.json` (Q01–Q33) |
| Glossar/Suche/Methodik | `js/modules/radiasthesie-views.js:354,519,592` |
| 4 eigene SVGs | `assets/radiasthesie/{pendel-geometrie,winkelrute,pendeltafel,orakel-karten}.svg` |
| Design-/Implementierungsdokumentation | `docs/radiasthesie-konzept/{ia-konzept,komponenten-specs,IMPLEMENTIERUNG,a11y-checkliste,responsive-checkliste,asset-liste}.md` |

Historische Karten `t_0fe70b63`, `t_f5d8a1a4`, `t_059ba08e`, `t_8c0cbe98`,
`t_d84585a8` wurden **nicht** neu erzeugt und nicht überschrieben.

## 3. Was dieser Lauf geschrieben hat

Ausschließlich neue Dateien unter `docs/radiasthesie-completion/RAD-01/`:

| Datei | Zweck |
| --- | --- |
| `README.md` | Auftrag, Lesart, Kurzbefund, offene Voraussetzungen |
| `BESTANDSAUFNAHME.md` | acht Prüfdimensionen mit Datei-/Zeilenbelegen |
| `MATRIX-14-PAKETE.md` | Ist/Soll/Evidenz für 14 Pakete, Status, Lücken |
| `INTEGRATIONSPUNKTE.md` | Datei-/Router-/Build-Einbaupunkte je Paket |
| `KOMPONENTENGRENZEN.md` | Grenzen 07–10 + Speicher-/Export-/Validierungsvertrag |
| `REIHENFOLGE.md` | Wellen, Single-Writer-Regel, Kollisionskarte |
| `NACHWEIS-WORKTREE.md` | dieser Nachweis |
| `CHECKPOINT.md` | Stand/Dateien/Tests/Restpunkte/nächster Schritt |

Kein Produktionscode, keine CSS-, JS-, HTML- oder Testdatei geändert. Kein
`git add -A`, kein `git stash`, kein `git checkout`, kein `git reset`.

## 4. Fremdarbeit im Arbeitsbaum — unverändert

### 4.1 Verfolgte, uncommittete Änderungen (QAFIX `t_d81baa74`)

SHA-256 **vor** dem ersten Schreibvorgang dieses Laufs und **nach** dem letzten
identisch (zweimal gemessen, keine Abweichung):

| SHA-256 | Datei |
| --- | --- |
| `5bbcd763cc3f5499751d4e9dd4789a12f3b27e307809d33ae55c19806bd454e5` | `.gitattributes` |
| `9d05ddd66997e33df123211ba39bd656f9cda24909e2e8424b4af29f2409105e` | `Lokal-404.html` |
| `6ca6cf9e8b0916093470d32b2d198c5bea64c7b02db3f4a02e24bf1106ac6ee1` | `Lokal-datenschutz.html` |
| `e5af80ebcc4f3ee4e578e7724caf322b6010f5acd0009d3fac4b6b8d2fd16292` | `Lokal-haftung.html` |
| `c3c18de594564c6c83edf308790d53a8846a0e1f0d96336640e033a195250c33` | `Lokal-impressum.html` |
| `a8017413aef4b2eb2d09f476e1a448e4328ce45ea63bec81ab752ca14c39b36c` | `Lokal.html` |
| `f48379137b46453f99b8d54a6a741f2607aab622da7a27935ff90fece6dbff97` | `css/radiasthesie.css` |
| `20cc63d73e203bf18c821c5239b0de4b8815be4d8dbeff4962e0d8fe3a42a6fe` | `docs/radiasthesie-konzept/inhalte/glossar.md` |
| `a2dcba93eb01c66d615f04788c7c6b920db3c9525b795847cc890c3df667ba9e` | `docs/radiasthesie-konzept/inhalte/quellenverzeichnis.md` |
| `ca89fbba424eaf4a419c9c4e5ddf6439a63f4ed8fffb73a64b8b384b5702bd30` | `docs/radiasthesie-konzept/inhalte/radiaesthesie.md` |
| `9b7b8f15682fcc15db47d6ff0bcf9a1b545c0b39e1d95f4316cdedf04330d53f` | `js/data/radiasthesie.js` |
| `4d22e1732fbbeb6edba34e56d4b649771b11820a37b1dae3b7bfc8cc581e77be` | `js/modules/radiasthesie-views.js` |
| `29c9a41de9929fe750b14a38117fe367139050424d6a80e4c697379f6f6a5a3b` | `scripts/generate-radiasthesie-data.cjs` |
| `560f00c9233a15182a2768343f74d1fdaab6d900fd745ca80cb071c9cbd06391` | `tests/radiasthesie.mjs` |
| `86c11f5ee8185ac7d88b10d7730591c720ae5f2535f987e84601a986162dbfde` | `tests/radiasthesie.spec.js` |

Mtime dieser Dateien: 2. November 2026, 23:43–23:55 — also **vor** Beginn dieses
Laufs (3. November, 00:13). Sie stammen aus dem unterbrochenen Lauf 316 und
gehören zur QAFIX-Karte `t_d81baa74` (`coding_debug`), die ein **Kind dieser
Karte** ist.

### 4.2 Während dieses Laufs entstandene parallele Arbeit (RAD-05, `t_187d5f52`)

Neu und **nicht von mir**: `assets/radiasthesie/media/` (untracked), angelegt
00:20–00:32, mit `media-manifest.json` (Selbstauskunft: „Kanban-Task
t_187d5f52 / ESOW-RAD-05“), `ATTRIBUTION.md`, `bildnachweis.html`, Varianten in
`520/` und `1040/`, `original/`. Ich habe diese Dateien nicht verändert,
verschoben oder gelöscht; ich habe ihr Vorhandensein nur für diesen Nachweis
festgestellt.

**Konsequenz für die Matrix:** RAD-05 bleibt im *committeten* Stand `OFFEN`;
die laufende Parallelarbeit ist kein Nachweis und kein Bestandteil dieses Laufs.
Das ist zugleich ein Beleg für die Single-Writer-Regel in `REIHENFOLGE.md`:
Zwei Karten schreiben gleichzeitig in denselben Arbeitsbaum (docs/ vs. assets/),
was nur solange gutgeht, wie die Pfade disjunkt bleiben.

## 5. Ausgeführte Prüfungen (reale Läufe, keine Behauptungen)

Umgebung: Windows 11, Node v24.13.0, npm 11.8.0, git 2.53.0.
`TMPDIR`/`TMP`/`TEMP` explizit auf `C:/Users/mas/AppData/Local/hermes/cache/scratch`
gesetzt; Exitcodes ohne Pipe-Maskierung ausgelesen.

| # | Befehl | Ergebnis |
| --- | --- | --- |
| 1 | `git status --porcelain=v1`, `git rev-parse HEAD`, `git branch --show-current` | 15 modifizierte Fremddateien, HEAD `e44fa5c`, Branch `feature/radiasthesie-modul` |
| 2 | `node --test tests/radiasthesie.mjs` im **aktuellen** Arbeitsbaum | **Exit 1 · 15/16** — Fehler: `TypeError: Cannot read properties of undefined (reading 'slug')` in `radiasthesie-views.js:279`, ausgelöst von `tests/radiasthesie.mjs:236` (`model.topics.radiaesthesie` existiert nicht; der Slug heißt `radiasthesie`) |
| 3 | `git archive e44fa5c js tests package.json \| tar -x -C …/rad01-baseline-e44fa5c` + `node --test tests/radiasthesie.mjs` | **Exit 0 · 16/16** — der committete Stand ist grün; der Fehler stammt aus der uncommitteten Fremdänderung |
| 4 | Python-Read-only-Probe auf `recherche/quellen.json` | 33 Einträge, Schema 1.0, alle vier Startquellen und beide DOI vorhanden, `coverage_gaps` mit 4 Einträgen, `verified`-Verteilung 22/8/2/1 |
| 5 | `sha256sum` über die 15 Fremddateien, zweimal | identisch (§4.1) |
| 6 | `git diff --stat`, `git diff --name-only` | 15 Dateien, 2.622 Einfügungen / 220 Löschungen — **unverändert** gegenüber Laufbeginn |

### 5.1 Bewusst nicht ausgeführt

| Prüfung | Grund |
| --- | --- |
| `npm run build` | Der Build überschreibt `dist/` **und** `Lokal.html`; `Lokal.html` ist eine uncommittete Fremddatei der QAFIX-Karte. Ein Build hätte Fremdarbeit zerstört. |
| `npx playwright test` | Setzt Build + Server voraus (siehe oben) und würde `test-results/` schreiben. |
| `npm run lint` / `format:check` | Prüft Produktionsdateien, die dieser Lauf nicht ändert; irrelevant für einen reinen Doku-Beitrag. |
| `npm install` | Keine neuen Abhängigkeiten; `node_modules` unangetastet. |
| Schreibzugriff im kanonischen Repository | Dort arbeitet Farbwelten parallel; jede Schreibung wäre eine Fremdänderung. |

Diese Auslassungen sind **keine** Erfolgsmeldungen: Der Build- und Browserstand
dieses Arbeitsbaums ist mit den uncommitteten Fremdänderungen derzeit nicht
belastbar prüfbar. Genau deshalb ist U1 in `README.md` §4 als blockierend geführt.

## 6. Reproduktion

```bash
cd /c/Users/mas/Arbeit/esow-rad-t_878c59c7
export TMPDIR=/c/Users/mas/AppData/Local/hermes/cache/scratch
export TMP=$TMPDIR TEMP=$TMPDIR

git rev-parse HEAD && git status --porcelain=v1
node --test tests/radiasthesie.mjs; echo "EXIT=$?"

# committeter Stand isoliert prüfen, ohne den Arbeitsbaum anzufassen:
S=$TMPDIR/rad01-baseline-e44fa5c && mkdir -p "$S"
git archive e44fa5c js tests package.json | tar -x -C "$S"
(cd "$S" && node --test tests/radiasthesie.mjs; echo "EXIT=$?")
```

## 7. Ergebnis

- Der Arbeitsbaum ist derselbe, der HEAD ist derselbe, das Modul ist dasselbe.
- 15 Fremdänderungen sind byte-identisch geblieben; parallele RAD-05-Arbeit wurde
  nicht berührt.
- Der committete Stand ist mit 16/16 grün; der Arbeitsbaum ist es **nicht**, und
  zwar ausschließlich wegen der uncommitteten Fremdänderung aus `t_d81baa74`.
- Dieser Lauf hat nur `docs/radiasthesie-completion/RAD-01/` hinzugefügt und in
  einem eigenen Commit festgehalten (8 Dateien, keine Fremddatei). Der Nachweis
  oben wurde nach dem Commit erneut geführt: Fremd-Hashes identisch.
