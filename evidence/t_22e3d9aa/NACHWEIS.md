# Nachweis t_22e3d9aa — sechs Kennungen auf kanonische Bibliografie-Fassung

**Aufgabe:** `[1]`, `[2]`, `[3]`, `[4]`, `[5]`, `[7]` in allen 15 Redaktionsseiten
zeichengleich auf die Vollfassung bringen, die im Register steht.
**Branch:** `esoterik-welt/t_22e3d9aa-farbwelten-sechs-kennungen-1---5-7-auf-e`
**Basis:** `6414d59` (Guard aus t_80cee561). Kein Push, kein Deploy.

## Ausgangsstand und Basis-Korrektur

Der Worktree wurde vom Projekt-Standardbranch (`30a2f62`) angelegt und enthielt
den Guard-Commit des Parents **nicht** (nur 10 statt 15 Farbseiten, kein
`scripts/lib/farbwelten-sources.cjs`). Der Branch hatte keine eigenen Commits;
er wurde deshalb per `git merge --ff-only 6414d59` auf den im Kartenkopf
genannten Ausgangsstand gebracht (Fast-Forward, kein Konflikt, kein
`reset --hard`). Erst danach lief die Messung.

Ausgangsmessung auf `6414d59`:

```
$ node scripts/verify-farbwelten-sync.cjs --strict-labels
Farbwelten-Sync: 15 Quellen, 16 Registereinträge, 6 Fehler, 0 Hinweise     (Exit 1)
$ node scripts/verify-farbwelten-sync.cjs
Farbwelten-Sync: 15 Quellen, 16 Registereinträge, 0 Fehler, 6 Hinweise     (Exit 0)
```

Alle sechs Fehler waren `label-variante` bei identischer URL — genau die in der
Karte genannten Kennungen.

## Entscheidung

Kanonisch ist die Vollfassung des Registers (`SOURCES[n].label`). Sie wurde in
allen 15 Seiten zeichengleich gesetzt; die Registerfassung entsteht danach neu
aus den Dokumenten (`npm run data:farbwelten`).

Zwei Vollfassungen waren nachweislich falsch und wurden auf **allen** Seiten
korrigiert (Kartenausnahme „nachweislich falsch → korrekte Fassung überall,
begründet"):

| Kennung | Registerfassung (alt) | Korrektur | Beleg |
| --- | --- | --- | --- |
| `[5]` | `… Tremea, A., Bürki, L., …` | `Tremea, I.` | Crossref DOI `10.1002/col.22490`: Autorin „Tremea, Irina" (`crossref-fields.json`) |
| `[7]` | `… "Psychon Bull & Rev 27, 1374-1382"` | `Psychon Bull Rev 27, 1374–1382` | Crossref DOI `10.3758/s13423-020-01772-1`: `short-container-title` = `Psychon Bull Rev`, Band 27, Seiten 1374-1382 |

`[7]` war zusätzlich innerhalb einer Seite inkonsistent (zehn Seiten `&`,
`gelb`/`rot` ohne `&`); die falsche Variante hatte den längeren String und
damit den „längste gewinnt"-Tie-Break gewonnen.

Die übrigen vier Vollfassungen sind gegen die Quelle geprüft und unverändert
übernommen:

* `[1]` — die Verlagsseite selbst zitiert `"The Rainbow Body: How the Western
  Chakra System Came to Be" Quest 105.2 (Spring 2017): pg. 25-29`
  (`quest-zitat.txt`), also Titel, Jahr und Band/Heft der Vollfassung.
* `[3]` — Crossref: Titel, `Psychon Bull Rev` 32(4), 1457-1486, 2025.
* `[4]` — Crossref: Titel, `Psychological Science` 31(10), 1245-1260, 2020.
* `[2]` — Buch (Archive.org), keine DOI; Angabe unverändert übernommen.

Kursivdruck (`*Quest*`, `*The Serpent Power*`) ist Seitentypografie von
`farbwelten.md` und `rot.md` und bleibt dort erhalten; der Abgleich normalisiert
Markdown-Betonung weg (`normalizeLabel`), die bibliografische Fassung ist
identisch.

## Kanonische Zeilen (Endstand, in allen 15 Seiten gleich)

```
- [1] Leland, D. (2017). "The Rainbow Body: How the Western Chakra System Came to Be." Quest 105.2. <URL>
- [2] Woodroffe, J. G. (1919, Übers.) / Avalon, A. The Serpent Power. <URL>
- [3] Jonauskaite, D. & Mohr, C. (2025). "Do we feel colours? A systematic review of 128 years of psychological research linking colours and emotions." Psychon Bull Rev 32(4), 1457–1486. <URL>
- [4] Jonauskaite, D. et al. (2020). "Universal Patterns in Color-Emotion Associations Are Further Shaped by Linguistic and Geographic Proximity." Psychological Science 31(10), 1245–1260. <URL>
- [5] Jonauskaite, D., Tremea, I., Bürki, L., Diouf, C. N. & Mohr, C. (2020). "To see or not to see: Importance of color perception to color therapy." Color Research & Application 45(3), 450–464. <URL>
- [7] Gnambs, T. (2020). "Limited evidence for the effect of red color on cognitive performance: A meta-analysis." Psychon Bull Rev 27, 1374–1382. <URL>
```

## Umfang der Änderung

`node evidence/t_22e3d9aa/count-changes.cjs` (aus `apply.txt`):

| Kennung | geänderte Seiten | Seiten |
| --- | --- | --- |
| `[1]` | 10 | blau, gruen, indigo, magenta, orange, rosa, schwarz, tuerkis, violett, weiss |
| `[2]` | 10 | dieselben |
| `[3]` | 11 | dieselben + gelb (chakren/farbwelten/rot waren bereits voll) |
| `[4]` | 1 | gelb |
| `[5]` | 4 | farbwelten, gelb (Kurzform), gruen, rot (Autorinnenkürzel) |
| `[7]` | 12 | blau, farbwelten, gelb, gruen, indigo, magenta, orange, rosa, schwarz, tuerkis, violett, weiss |

**48 geänderte Zeilen in 13 Content-Dateien**, ausschließlich Zeilen der Form
`- [n] …` im Abschnitt `## Quellen`:

```
$ git diff -U0 -- content/ | grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' \
    | grep -vE '^[+-]\s*- \[[0-9]{1,2}\] '
(leer)
$ git diff -U0 -- content/ | grep -cE '^\+[^+]'
48
```

`chakren.md` und `lichtfrequenzen.md` bleiben unverändert: `chakren` führte
`[1]`–`[4]` bereits in der Vollfassung und zitiert `[5]`/`[7]` nicht;
`lichtfrequenzen` zitiert keine der sechs Kennungen.

## Prüfungen (alle ausgeführt, echte Ausgaben)

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Strenger Abgleich | `node scripts/verify-farbwelten-sync.cjs --strict-labels` | **0 Fehler, 0 Hinweise**, Exit 0 (`strict-labels.txt`, `sync-report-strict.json`) |
| Standardabgleich | `npm run verify:sync` | **0 Fehler, 0 Hinweise**, Exit 0 (`verify-sync.txt`) |
| Register neu erzeugt | `npm run data:farbwelten` | 15 Quellen, 16 Registereinträge, 12 Farbwelten (`data-run2.txt`) |
| Idempotenz | zweiter `npm run data:farbwelten`, Diff-Hash vorher/nachher | identisch (`dda97e55…`) — kein neuer Tracked-Diff |
| Idempotenz nach Commit | `npm run data:farbwelten` auf dem Commit, danach `git status --porcelain` | nur die Protokolldatei selbst (`data-post-commit.txt`), kein Tracked-Diff |
| Tests | `npm run test:farbwelten` | **24/24 pass**, 0 fail (`test-farbwelten.txt`) |
| Lint | `npm run lint` | Exit 0 |
| Format (Repo-Skript) | `npm run format:check` | konform (Markdown ist nicht Teil des Repo-Prettier-Skripts) |

Registerzahlen: 16 Einträge, 15 Quellen, 12 Farbwelten (Generator-Ausgabe
`Quellen im Register: 16` / `Farbwelten: 12`).

## Prosa-Prüfung

Die Angleichung ändert nur Bibliografie-Zeilen. Geprüft, dass keine
Prosa-Aussage durch die vollständigeren Titel/Jahre falsch wird:

* `[1]`/`[2]` — `chakren.md` nennt „Woodroffe/Avalon übersetzen dies 1919 als
  *The Serpent Power*" und „erst 1977"; beide Aussagen stimmen mit der
  Vollfassung (`1919, Übers.`, Leland 2017) überein.
* `[3]` — Prosa nennt die „große systematische Review" mit 132 Studien,
  42.266 Personen, 64 Ländern; der Volltitel („systematic review of 128 years")
  bestätigt das, statt ihm zu widersprechen.
* `[4]` — Prosa betont interkulturelle Ähnlichkeit mit Unterschieden; der
  Volltitel nennt genau diese Schichtung („Linguistic and Geographic Proximity").
* `[5]` — Prosa spricht von Farbwahrnehmung in der Farbtherapie; der Volltitel
  entspricht dem.
* `[7]` — Prosa verweist auf den „Rot-Effekt"; der alte Registertitel
  („Limited evidence for the red effect") war eine Kürzung, der Volltitel ist
  der echte Aufsatztitel. Kein Widerspruch.

## Grenzen

* Kein Push, kein Deploy (Kartenauflage); Änderung liegt ausschließlich im
  Worktree-Commit.
* `npm run verify:farbwelten` (Playwright, Standard-URL
  `http://127.0.0.1:8099/Esoterik-Welt/`) und `npm run verify:pages` wurden
  **nicht** als Nachweis verwendet: in diesem Worktree existiert kein
  `dist/`-Build und kein laufender Server. `verify:farbwelten` lief deshalb
  gegen eine Fehlerseite (`Meta-Description fehlt`, `fehlende Abschnitte`);
  `verify:pages` lief in den Timeout. Beide schreiben Artefakte in den
  Arbeitsbaum (`evidence/farbwelten/`, `evidence/t_9ff78898/live/`); diese
  wurden nach dem Lauf auf `HEAD` zurückgesetzt bzw. aus dem Baum entfernt und
  sind **nicht** Teil dieses Commits. Für eine reine Bibliografie-Angleichung
  sind die Läufe ohne Aussagekraft; wer die gerenderte Fassung sehen will, muss
  `npm run build` + Server + `verify:farbwelten` fahren.
* Der Guard prüft Konsistenz, nicht bibliografische Wahrheit; die sechs
  Fassungen sind zusätzlich extern belegt (`crossref-fields.json`,
  `quest-zitat.txt`), eine HTTP-Erreichbarkeitsprüfung aller URLs fand nicht
  statt.

## Reproduktion

```bash
git merge --ff-only 6414d59              # Ausgangsstand (nur falls Worktree älter)
node scripts/verify-farbwelten-sync.cjs --strict-labels   # muss 6 Fehler zeigen
node evidence/t_22e3d9aa/apply-canonical.cjs --dry        # 48 Zeilen, 0 Fehler
node evidence/t_22e3d9aa/apply-canonical.cjs
npm run data:farbwelten
node scripts/verify-farbwelten-sync.cjs --strict-labels   # 0 Fehler, 0 Hinweise
npm run verify:sync && npm run test:farbwelten && npm run lint
```

Dateien in diesem Verzeichnis: `apply-canonical.cjs` (Änderung, idempotent),
`inspect-forms.cjs` (Fassungsvergleich je Kennung), `count-changes.cjs`,
`trim-crossref.cjs`, `crossref-report.cjs`, `apply.txt` / `apply-dry.txt`
(Zeilenprotokoll), `count-changes.txt`, `crossref-fields.json`,
`crossref-report.txt`, `quest-zitat.txt`, `strict-labels.txt`,
`verify-sync.txt`, `sync-report-strict.json`, `test-farbwelten.txt`,
`data-run2.txt`, `data-post-commit.txt`.
