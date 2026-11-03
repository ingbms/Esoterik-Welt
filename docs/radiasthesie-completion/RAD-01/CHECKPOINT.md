# CHECKPOINT — ESOW-RAD-01 (Karte `t_a077bd83`)

Stand: 3. November 2026, 00:55 CET · Status: **abgeschlossen, dokumentiert, geprüft**
Branch `feature/radiasthesie-modul` · Basis `e44fa5c54c80cb39383fa4177aa587236dc87596`
· eigener Commit auf diesem Branch, nur `docs/radiasthesie-completion/RAD-01/`

## 1. Stand

Der Integrationsplan für den Vollumfang der 14 Pakete liegt vor. Er ist
**Ist/Soll-Gegenüberstellung, keine Abnahme**: 2 Pakete sind im committeten Stand
vollständig erfüllt (01, 02), 7 sind Teilumfänge (03, 04, 06, 11, 12, 13, 14),
5 sind offen (05, 07, 08, 09, 10). Alle 14 sind einem Einbaupunkt zugeordnet.

## 2. Dateien (neu, nur dieses Verzeichnis)

| Datei | Zeilen | SHA-256 |
| --- | --- | --- |
| `README.md` | 79 | `da95b3d8bae9f86b6934fde897c12df82c8b3d5c5629f57cf9157fbd22eb4a46` |
| `BESTANDSAUFNAHME.md` | 186 | `75cdf9f9f28f03ec34301a4b794dd665c7e31305eb51d6ea5ddf716cbf7935b4` |
| `MATRIX-14-PAKETE.md` | 99 | `7ac1dc969ad4188159e3e44a98104822f3494af13e371f01383d109b92eb674d` |
| `INTEGRATIONSPUNKTE.md` | 235 | `e62a5cbc05094022e4f46accf6bd2b0fecf33e2fd64dd633fb5c4457b2847768` |
| `KOMPONENTENGRENZEN.md` | 227 | `e6535006e5775f3ef4978b2af78acb3dadfd96204330edf96b50e5240c51ed1d` |
| `REIHENFOLGE.md` | 114 | `25461ebfa3696a866ca43ad3a68bab92345a86257b19e21fcb4a07d1ac6e8b87` |
| `NACHWEIS-WORKTREE.md` | 153 | `2a2c13a38ba0ba99b9e94306c3bf68a9066da9529ea2817c4a79561918a02015` |
| `CHECKPOINT.md` | diese Datei | eigener Hash über den Commit nachweisbar |

Keine Datei außerhalb `docs/radiasthesie-completion/RAD-01/` wurde geschrieben.

## 3. Tests / Prüfungen (wirklich ausgeführt)

| Prüfung | Ergebnis |
| --- | --- |
| `node --test tests/radiasthesie.mjs` (Arbeitsbaum, mit Fremdänderungen) | **Exit 1 · 15/16** — `model.topics.radiaesthesie` undefined (`tests/radiasthesie.mjs:236`) |
| gleicher Test gegen `git archive e44fa5c` in `$TMPDIR` | **Exit 0 · 16/16** — committeter Stand grün |
| `sha256sum` der 15 Fremddateien, zweimal | identisch; keine Fremdänderung durch diesen Lauf |
| `git diff --stat` | 15 Dateien, 2.622+/220− — unverändert |
| Lese-Probe `recherche/quellen.json` | 33 Quellen, 4 Startquellen + 2 DOI vorhanden, 4 `coverage_gaps` |
| Datei-/Zeilenanker gegen `js/main.js`, `js/modules/*`, `index.html`, Build- und Testskripte | alle in `INTEGRATIONSPUNKTE.md` genannten Anker am Stand `e44fa5c` geprüft |

Bewusst **nicht** ausgeführt: `npm run build`, Playwright, ESLint/Prettier,
`npm install` — der Build würde die uncommittete Fremddatei `Lokal.html`
überschreiben. Begründung in `NACHWEIS-WORKTREE.md` §5.1.

## 4. Restpunkte

1. **U1 (blockierend für jede Abnahme):** QAFIX-Karte `t_d81baa74` muss B1–B5,
   B9, B10 fertigstellen und den roten Test beheben. Solange sie offen ist, ist
   der Arbeitsbaum nicht grün und kein Paket „abgenommen“.
2. **RAD-12 ist keine Bestätigung von B6.** Es braucht additive statische
   HTML-Seiten aus derselben Datenquelle (Karte `t_9e4cd9bb`), Canonical/Sitemap/
   No-JS-Nachweis. Der Hash-Router bleibt.
3. **RAD-04 bleibt Teilumfang**, bis die Werkstatt-UX für 07–10 existiert.
4. **RAD-06 bleibt Teilumfang**, bis B1/B5 gehoben und der Text indexierbar ist.
5. **CI-Lücke:** `test:radiasthesie` fehlt in `.github/workflows/ci.yml`.
6. **Kein Browser-/Build-Nachweis in diesem Lauf** — bewusst, siehe §3.

## 5. Nächster Schritt

Reihenfolge und Kollisionsregeln stehen in `REIHENFOLGE.md`:

1. **W1:** QAFIX `t_d81baa74` abschließen (U1), danach `node --test tests/radiasthesie.mjs` = 16/16.
2. **W2/W3:** RAD-06-Korrekturen (B1, B5), dann RAD-02-Ergänzungen — dieselbe Dateikette, strikt nacheinander.
3. **W6:** Werkstatt-Gerüst (eine Hand, fünf geteilte Dateien).
4. **W7–W10:** Simulator → Studio → Experimente → Journal.
5. **W11/W12:** Vernetzung, dann statische HTML-Ausgabe + SEO/GEO.
6. **W13/W14:** Qualitätskontrolle, Übergabe.

Es werden **keine** weiteren Karten angelegt: die 14 Delta-Karten existieren
bereits; diese Reihenfolge ist Ausführungs-, nicht Zerlegungsanweisung.

## 6. Wiederaufnahme

```bash
cd /c/Users/mas/Arbeit/esow-rad-t_878c59c7
export TMPDIR=/c/Users/mas/AppData/Local/hermes/cache/scratch
export TMP=$TMPDIR TEMP=$TMPDIR

git rev-parse HEAD && git status --porcelain=v1     # 15 Fremdänderungen erwartet
node --test tests/radiasthesie.mjs                  # derzeit 15/16 (U1)
git show --stat HEAD                                # dieser Commit: nur RAD-01
```

## 7. Umfang dieses Laufs (nicht überschritten)

Geändert wurde ausschließlich `docs/radiasthesie-completion/RAD-01/`. Kein
Produktionscode, keine Tests, kein Build, keine Fremddatei, kein `git add -A`,
kein Push, kein Deployment, keine Änderung im kanonischen Repository
(`C:/Users/mas/Arbeit/Esoterik-Welt`, Branch `feature/farbwelten-modul`).
