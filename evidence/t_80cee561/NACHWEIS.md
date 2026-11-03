# NACHWEIS t_80cee561 — Sync-Guard gegen abweichende Quellenlabels je Kennung

**Karte:** t_80cee561 · **Basis:** `66d25fe` (Branch `esoterik-welt/t_6dc6b194-…`) · **Branch:**
`esoterik-welt/t_80cee561-farbwelten-sync-guard-gegen-abweichende` · kein Push, kein Deploy, eigener Worktree.

## Anlass

`registerSources` in `scripts/generate-farbwelten-data.cjs` bewertet je Kennung `[n]` alle
Fassungen aus allen Seiten mit `(url ? 100000 : 0) + label.length` und übernimmt stillschweigend
den höchsten Score. Gleiche URL-Präsenz heißt: **die längere Zeichenkette gewinnt** — die
sachlich falschere Fassung kann das Register überschreiben. `verify-farbwelten-sync.cjs` hat das
nicht bemerkt, weil es nur zählt (15 Quellen, 16 Registereinträge), nicht vergleicht. Belegt durch
`[24]/[31]` (`t_e3ecc54e`) und `[19]` (`t_6dc6b194`).

## Änderungen

| Datei | Art | Inhalt |
| --- | --- | --- |
| `scripts/lib/farbwelten-sources.cjs` | neu | Quellenabgleich: sammelt je Kennung alle bibliografischen Einträge aus allen `content/farbwelten/*.md`, normalisiert `(Label, URL)` und klassifiziert Abweichungen. Rein lesend. |
| `scripts/verify-farbwelten-sync.cjs` | erweitert | Ruft den Abgleich auf, meldet Fehler als Fehler und Hinweise getrennt, schreibt `measurements.sourceConsistency` in den `--json`-Bericht. Neuer Schalter `--strict-labels`. |
| `tests/farbwelten-sources.mjs` | neu | 12 Tests: echter Bestand, `[19]`-/`[24]`-Muster, Jahreskonflikt, Label-Variante, Normalisierung, Verweisketten, Gleichstand, veraltetes Register. |
| `package.json` | erweitert | `test:farbwelten` hängt den neuen Test ein; `verify:sync` als Alias für `scripts/verify-farbwelten-sync.cjs`. |

`content/farbwelten/*.md` und `js/data/farbwelten.js` sind **unverändert** (`git status` nach
Regeneration leer, siehe unten). Die Generator-Heuristik wurde nicht angefasst.

## Klassifikation: was ist ein Fehler, was ein Hinweis

Fehler (Exit 1):

- `url-konflikt` — dieselbe Kennung mit verschiedenen normalisierten URLs (auch: URL vs. keine URL).
  Genau die Klasse von `[24]` und `[19]`: die Seiten behaupten unterschiedliche Dokumente.
- `identitaetskonflikt` — gleiche URL, aber abweichende Jahres-, Band- oder ISBN-Angabe
  (`IARC (2023)` vs. `IARC 2012`).
- `register-abweichung` — `js/data/farbwelten.js` führt nicht den vollständigsten Kandidaten der
  Dokumente (veraltete Daten nach einer Textkorrektur).
- `register-fremd` — Registerfassung (Label + URL) kommt in keinem Dokument vor.

Hinweis (gezählt und ausgegeben, Exit 0):

- `label-variante` — gleiche URL, nur unterschiedlich ausführliche Schreibweise. Bei identischer
  URL zeigen alle Seiten dasselbe Dokument; der Tie-Break wählt deterministisch die ausführlichste
  Fassung. `--strict-labels` wertet auch das als Fehler.
- `gleichstand` — zwei Kandidaten mit identischem Score. Der Generator entscheidet dann über die
  Einfügereihenfolge; das wird gemeldet, nicht stillschweigend hingenommen.
- `kettung` — `- [1][2][3] – siehe …` ist keine bibliografische Angabe und zählt nicht als Fassung
  (der Generator überspringt sie ebenfalls, sonst gäbe es Fehlalarme).

Vergleichsnormalisierung: Groß-/Kleinschreibung, Anführungszeichen, Gedankenstriche (`–`/`—`/`-`),
Auslassungspunkte, Markdown-Betonung, Satzzeichen am Rand sowie `www.`, Fragment und abschließender
Schrägstrich in der URL sind keine Abweichung. Protokoll, Host und Pfad bleiben unterscheidend.

## Nachweise (a) — Guard schlägt auf künstlicher Divergenz an

`node evidence/t_80cee561/divergenz-probe.cjs` ändert je Fall **eine Zeile in einer Kopie** von
`content/farbwelten` (Temp-Verzeichnis), nie im Repo:

```
## [19] Altseite zurück auf IARC (2023) mit iarc.who.int-URL
   ERGEBNIS: erkannt als url-konflikt für [19]
## [24] Altseite ohne URL (längeres Label)
   ERGEBNIS: erkannt als url-konflikt für [24]
## [19] gleiche URL, abweichendes Jahr (2023 statt 2012)
   ERGEBNIS: erkannt als identitaetskonflikt für [19]
Alle 3 Divergenzfälle erkannt; content/farbwelten/*.md blieb unverändert.
```

Zusätzlich am echten Pfad: `[19]` in `content/farbwelten/violett.md` **temporär** auf die alte
Fassung gestellt, `npm run verify:sync` → **Exit 1, 2 Fehler** (`live-divergenz-violett.txt`):

```
FEHLER Quellenabgleich: [19] verschiedene Dokumente: chakren/farbwelten/lichtfrequenzen/… →
  „IARC 2012, Monographs Vol. 100D Radiation" <…/Radiation-2012> | violett →
  „IARC (2023). Monograph on artificial optical radiation" <https://www.iarc.who.int>
FEHLER Quellenabgleich: [19] Register ist veraltet: führt „IARC 2012, …", vollständigster
  Kandidat der Dokumente ist „IARC (2023). Monograph on artificial optical radiation" (violett)
```

Der zweite Fehler ist der Kern der Karte: die falsche, aber längere Fassung würde das Register
übernehmen. Danach `git checkout -- content/farbwelten/violett.md`; `git status content/` leer,
`verify:sync` wieder Exit 0.

## Nachweise (b) — echter Bestand

`npm run verify:sync` (`verify-sync.txt`):

```
Farbwelten-Sync: 15 Quellen, 16 Registereinträge, 0 Fehler, 6 Hinweise
```

0 Fehler; die 6 Hinweise sind vorbestehende Label-Varianten bei identischer URL (siehe Befund).

## Nachweise (c) — Testläufe bleiben grün

| Befehl | Ergebnis |
| --- | --- |
| `npm run test:farbwelten` | `tests 24 / pass 24 / fail 0` (12 bisher + 12 neue) — `test-farbwelten.txt` |
| `npm run verify:sync` | 15 Quellen, 16 Registereinträge, **0 Fehler**, 6 Hinweise — Exit 0 |
| `npm run lint` | Exit 0 |
| `npx prettier --check` (geänderte Dateien) | „All matched files use Prettier code style!" |
| `npm run data:farbwelten` danach `git status js/data` | kein Tracked-Diff → Generator idempotent, Daten aktuell |

## Nachweise (d) — Kennzahlen unverändert

Register 16 Einträge, 12 Farbwelten, 15 Quellen (Ausgabe `verify:sync` und `data:farbwelten`:
„Quellen im Register: 16 / Farbwelten: 12"). `sync-report.json` (aus `--json`) bestätigt
`registryEntries: 16`, `sourceConsistency.documents: 15`, `ids: 16`, `errors: 0`, `warnings: 6`.

## Befund: 6 vorbestehende Label-Varianten (nicht die Gefahrenklasse)

Der Abgleich hat auf dem echten Bestand sechs Kennungen mit abweichenden, aber **URL-identischen**
Schreibweisen gefunden — sie waren bisher unsichtbar, sind aber keine falschen Quellen:

| Kennung | Vollfassung (u. a.) | Kurzfassung (u. a.) |
| --- | --- | --- |
| `[1]` | `chakren/farbwelten/gelb/rot` | `blau/gruen/indigo/magenta/orange/rosa/schwarz/tuerkis/violett/weiss` („…The Rainbow Body…") |
| `[2]` | `chakren/farbwelten/gelb/rot` („1919, Übers.") | zehn Farbseiten („1919") |
| `[3]` | `chakren/farbwelten/rot` (Volltitel) | zehn Farbseiten, `gelb` („Do we feel colours?") |
| `[4]` | 13 Seiten (Volltitel) | `gelb` („Universal Patterns of Colour-Emotion Associations.") |
| `[5]` | `gruen/rot` (Volltitel) | `farbwelten/gelb` („To see or not to see…") |
| `[7]` | zehn Farbseiten („Psychon Bull & Rev") | `farbwelten` („Limited evidence for the red effect."), `gelb/rot` („Psychon Bull Rev") |

Alle sechs führen dieselbe URL wie die Vollfassung; keine betrifft Jahres-, Band- oder
ISBN-Angaben. Sie werden als Hinweis geführt, nicht als Fehler — sonst wäre der Guard auf dem
Ausgangsstand dauerhaft rot und würde die tatsächliche Gefahrenklasse (URL-/Identitätskonflikt)
übertönen. `--strict-labels` zeigt die Grenze explizit: **6 Fehler, Exit 1**
(`strict-labels.txt`). Die redaktionelle Angleichung dieser sechs Kennungen ist als Folgekarte
angelegt und **nicht** Teil dieses Diffs (Hotspot `content/farbwelten/*.md`).

## Grenzen

- Der Guard prüft **Konsistenz**, nicht Wahrheit: eine inhaltlich falsche, aber auf allen Seiten
  gleichlautende Angabe bleibt unentdeckt.
- Keine HTTP-Prüfung der URLs (nur `t_6dc6b194` hat die Ledger-URL einmal geprüft).
- Geprüft wird nur `content/farbwelten/*.md` (Verzeichnis wird gelesen, neue Seiten wie
  `farbtherapie.md` sind automatisch erfasst). Andere Redaktionsbereiche führen kein Register.
- `verify:farbwelten-rendered`/Playwright wurden nicht erneut gefahren: keine Änderung an Content,
  Daten oder Renderer.
