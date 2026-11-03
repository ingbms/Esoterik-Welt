# Masterabschluss — Katalogpaket vor Release/Push

**Karte:** `t_04d92b4a` (Master) · **Branch:** `wt/t_cbbf71e0` · **PR:** [#19](https://github.com/ingbms/Esoterik-Welt/pull/19)
**Baseline:** Tag `baseline/rubriken-2026-11-03` → Commit `9f584397f8cc86a261fccdfc36dfbb8999f55ea7` (PR #18, live geprüft)
**Eingangs-Commit dieses Laufs:** `fdef1aa5fdff1efb54e81f2cc4ea3788d6cc50b6`
**Ausgangs-Commit:** der Commit, der diese Datei trägt (im Kanban-Handoff benannt)
**Entscheidung:** Katalogpaket **GO** für die PR-Konsolidierung — **keine** Produktfreigabe, **kein** direkter Push auf `main`

---

## 1. Was der Master entschieden hat

Das Katalogpaket wird als **Dokumentations-PR** konsolidiert. Es ändert keine Produktdatei, kein
Schema der Website und keine Route. Damit ist die Konsolidierung unabhängig von den offenen
Produktauflagen; diese bleiben bestehen und sind in Abschnitt 4 geführt.

Der PR bleibt **offen**. Der Master merged nicht selbst; die Zusammenführung nach `main` ist eine
Eigentümerentscheidung. Es gab keinen Push auf `main`, keine Umbenennung und keine Migration.

## 2. Was hier unabhängig geprüft wurde

Die Vorlage war die Freigabeempfehlung der Reparaturkarte `t_9c2a7824` — also der Instanz, die die
Reparaturen selbst ausgeführt hat. Diese Empfehlung wurde nicht übernommen, sondern nachgemessen.
Alle Angaben unten stammen aus Läufen dieses Masterlaufs auf `fdef1aa`, nicht aus den Handoffs.

| Prüfung | Werkzeug | Ergebnis |
| --- | --- | --- |
| Gesamturteil des Gates, ohne Abkürzung (`--fast` aus) | `verify-release-gate.cjs` | `ok: true`, `must_failed: []`, `structural_errors: 0`, 10/10 Muss-Kriterien, Exit 0 |
| Negativkontrolle des Gate-Prüfers | `verify-release-gate.cjs --self-test` | 5/5 künstliche Strukturfehler erkannt, `clean_run_errors: 0` |
| Eigener Gegenprüfer, unabhängig von `lib/` und allen `validate-*`/`verify-*` | `crosscheck-master-package.cjs` (neu) | 0 Fehler: 277 Design- und 54 Inhalts-Einträge, IDs eindeutig, **331** `source.path` im Baseline-Commit vorhanden |
| Medien-Katalog mit eigenem CSV-Leser, SHA-256 neu gerechnet | `crosscheck-master-package.cjs` | 644 Zeilen, **0** Hash- und **0** Byte-Abweichungen, **1** offene Lizenz (`MED-0130`) |
| Behauptete Datei-Hashes des Eltern-Handoffs | `crosscheck-master-package.cjs --expect-hashes` | **8 von 8** vergleichbaren Dateien bitgenau; die beiden übrigen hat der Master selbst geändert (B-1, Prettier-Formatierung) |
| Negativkontrolle des eigenen Gegenprüfers | derselbe Aufruf mit absichtlich falschem Hash | 1/1 erkannt, Exit 1 — der Prüfer meldet nicht bedingungslos „ok" |
| Produktdateien unberührt | `git diff 9f58439 -- index.html css js data assets dist public` | 0 Änderungen |
| Secret-Muster im Diff | Muster für Private Keys, API-Keys, Passwörter, Tokens | keine Treffer |
| Absolute Benutzerpfade in den Katalogdateien | `git grep` auf `C:/Users` | keine Treffer |
| CI-Lint des Repositories | `npm run lint` (ESLint) und `npm run format:check` (Prettier) | beide Exit 0 nach B-2 |
| Umfang des Diffs | `git diff --stat origin/main...HEAD` | 86 Dateien, 68 504 Zeilen; ausschließlich `docs/migration-baseline/`, `scripts/migration-baseline/`, vier Zeilen `.gitattributes` und drei Globals in `eslint.config.cjs` |

**Warum der eigene Gegenprüfer:** Projektprüfer und Katalog stammen aus derselben
Werkzeugkette. Ein zweiter Leser mit eigener Implementierung (eigener CSV-Leser, eigene
Hash-Rechnung, `git cat-file` gegen den Baseline-Commit) schließt aus, dass ein Validator nur sich
selbst bestätigt. Er prüft bewusst **nicht** die Design-Urteile nach — nur Vollständigkeit,
Quellenexistenz und Bitgenauigkeit.

### 2.1 Befund B-1 (in diesem Lauf gefunden und behoben)

`verify-release-gate.cjs` las `media-catalog.csv` mit `split(';')`. Die Datei ist
**komma**-separiert und enthält Kommas in Anführungszeichen; dadurch fiel die Spalte
`license_status` aus und die Belegdatei meldete „644 Medienzeilen, **0** ohne geklaerte Lizenz",
während `validate-catalogs` und `release-gate.md` korrekt **1** offene Lizenz (`MED-0130`) führen.
Die Kennzahl war nur `level: info` und beeinflusste das Gate-Urteil nicht, war aber in sich falsch
und widersprüchlich zur Freigabedokumentation.

Behoben: Der Gate-Prüfer nutzt jetzt den gemeinsamen `lib.parseCsv` und bricht ab, wenn die Spalte
fehlt. Nach dem Lauf steht in `pruefungen.json` „644 Medienzeilen, 1 ohne geklaerte Lizenz" —
deckungsgleich mit Auflage A-4. Der Vorlagen-Hash dieser Datei ist damit überholt; er ist in
`evidence/release-gate/parent-declared-hashes.json` unter `superseded` dokumentiert statt still
überschrieben.

### 2.2 Befund B-2 (in diesem Lauf gefunden und behoben)

Die CI des Repositories war auf diesem Branch rot, bevor der Master etwas geändert hat:
`npm run lint` meldete **17 ESLint-Fehler** in acht Werkzeugen des Katalogs, `npm run
format:check` wich in **18 Dateien** von Prettier ab. Kein Fehler betraf Produktcode, alle betrafen
`scripts/migration-baseline/`. Ursachen: fehlende Browser-Globals (`CSS`, `NodeFilter`,
`matchMedia`) in der ESLint-Konfiguration für `page.evaluate`-Blöcke, ungenutzte Variablen und
Regexe mit literalen Leerzeichen (`no-regex-spaces`).

Behoben: `eslint.config.cjs` deklariert die drei Globals in `evaluateGlobals` (der dafür vorgesehene
Ort), die ungenutzten Variablen sind entfernt, die Regexe nutzen `{2}`/`{4}`, und die 18 Dateien
sind mit Prettier formatiert. Nachweis, dass dabei keine Semantik verloren ging: ein
AST-Vergleich (acorn, ohne Positions- und Rohstring-Angaben) gegen den Eingangsstand zeigt 14 von
21 Dateien unverändert; die 7 abweichenden sind genau die 7 bewusst korrigierten. Danach:
`npm run lint` Exit 0, `npm run format:check` „All matched files use Prettier code style!".

**Belege:** `evidence/release-gate/pruefungen.json` und `evidence/release-gate/runtime-fakten.json`
wurden in diesem Lauf neu geschrieben (vorher auf `debd50e`, jetzt auf `fdef1aa`). Die
Katalogdateien selbst sind seit `fdef1aa` unverändert; nachweisbar mit
`git diff fdef1aa -- docs/migration-baseline scripts/migration-baseline` — dort stehen nur die
beiden Belegdateien, der Gate-Prüfer (B-1) und die neuen Master-Werkzeuge.

## 3. Konsolidierter Stand

| Bestand | Umfang |
| --- | --- |
| Design-Katalog | 277 Einträge: 170 Tokens (Farbe 114, Typografie 18, Abstand 14, Radius 6, Schatten 6, Bewegung 3, `z-index` 6, Größe 3), 59 Komponenten, 12 Zustände, 10 Layouts, 5 Muster, 2 Icons, 6 Illustrationen, 13 Umbruchpunkte |
| Inhalts-Katalog | 54 Einträge: 10 Seiten, 15 Unterrouten, 22 Artikel, 3 Rechtstexte, 2 UI-Texte, 2 Glossare; 6 Claims, davon 5 belegt und 1 offen (`CLM-003`) |
| Medien-Katalog | 644 Dateien, 388 davon `must`, 1 Lizenz offen (`MED-0130`) |
| Funktions-Katalog | 96 Funktionen in 10 Bereichen |
| Routen | 39 geprüft, 0 nicht gefunden, 0 verlinkt-aber-nicht-katalogisiert |
| Laufzeitfakten | 30 Kristallkarten aus `data/crystals.json`, 12 Farbwelten inkl. Indigo, drei Themenseiten lösen auf, alte Slugs nicht, `#blog/6` öffnet |

Commit-Kette des PR (Basis `main` = `9f58439`):

```
36bab35  Katalogstruktur und Scope
bc928dc  Design-Katalog
c59a074  Inhalts-Katalog
6baa269  Medien-Katalog
55c92bc  Funktions-Katalog
8892586  unabhängige Design-/A11y-Prüfung
627c463  Release-Gate
137375d  Belege auf 627c463
debd50e  Katalog-Metadaten außerhalb des Schemas
fdef1aa  Belege auf debd50e
eda2ba3  Masterabschluss und Belege auf fdef1aa
b40a753  Befunde B-1 und B-2 behoben, CI-Lint gruen
<dieser> Diffumfang auf den PR-Kopf nachgezogen
```

## 4. Offene Auflagen (unverändert aus dem Release-Gate)

| ID | Auflage | Owner | Termin | Blockiert |
| --- | --- | --- | --- | --- |
| A-1 | `.badge-remove` ≥ 24 × 24 px (WCAG 2.5.8, gemessen 13 × 15 px); `DES-CMP-023` nachziehen | `design_web_layout` | 2026-11-10 | Produkt-Push |
| A-2 | `CLM-003`: Quelle für 620–750 nm oder Kennzeichnung als physikalischer Standard | `writer` | 2026-11-10 | Katalog-`must` |
| A-3 | `datenschutz.html` um Radiästhesie-Journal und Experimentläufe ergänzen, rechtlich abnehmen | Eigentümer (`default`) | 2026-11-17 | VELARKANA-Go-live |
| A-4 | `MED-0130` (`assets/mineral/mineral-detail-1000.jpg`): Lizenz klären oder Bild aus dem Release nehmen | `architect` | 2026-11-10 | Medien-Push |
| A-5 | E-03 entschieden (2026-11-03, Variante A: veröffentlichen) und umgesetzt in `t_44e58074`: zwölf Markdown-Artikel als Blogartikel 11–22, Katalog `CNT-ART-011…022` auf `final`/`must`/`shipped` | Eigentümer (`default`) | 2026-11-17 | entfällt (erledigt 2026-11-03) |

## 5. Restrisiken, die bewusst getragen werden

| Risiko | Wirkung |
| --- | --- |
| Keine Screenreader-Ausgabe geprüft (nur DOM-Semantik und Live-Regionen) | Barrierefreiheit nicht vollständig abgenommen |
| Kontrast auf Verlaufsflächen rechnerisch, nicht pixelweise | schlechtester Wert 4,80 : 1, 0 Verstöße |
| Produktbefunde D-02/D-04/D-05/D-06 offen (1 unsichtbarer Fehlerzustand, 2 doppelte IDs, 1 Überschriftssprung) | Design-System-Defekt, kein WCAG-Blocker |
| 28 ungenutzte Tokens, 25 hartkodierte Farben, 22 Umbruchbreiten | Entscheidungen für die Migration, keine Release-Wirkung |
| Nur Deutsch, keine Übersetzungen | Lokalisierung dokumentiert (`content-catalog-meta.json`) |

## 6. Grenzen dieser Nachprüfung

- Die unabhängige Design-/A11y-Messung (84 Laufzeitmessungen, 14 493 Textknoten, Screenshots) wurde
  **nicht neu erhoben** — sie ist Beleg der Prüfkarte `t_0c70fb30` und bleibt an deren Commit
  gebunden. Neu gemessen wurden alle deterministischen Prüfungen und beide Browsermessungen des
  Gates.
- Keine echten Geräte, kein 200-%-Zoom, keine Druckausgabe.
- Der Master hat den PR nicht gemerged und nichts auf `main` gepusht.

## 7. Reproduktion

```bash
# Gesamturteil, 10 Muss-Kriterien inkl. beider Browsermessungen (rund 40 s)
node scripts/migration-baseline/verify-release-gate.cjs
node scripts/migration-baseline/verify-release-gate.cjs --self-test

# Unabhaengiger Gegenpruefer des Masters (eigener CSV-Leser, eigene Hash-Rechnung)
node scripts/migration-baseline/crosscheck-master-package.cjs \
  --expect-hashes docs/migration-baseline/evidence/release-gate/parent-declared-hashes.json
```

Alle Ausgaben beziehen sich auf den Commit, den `pruefungen.json` im Feld `head_commit` nennt.

## 8. Rückweg

Nur Dokumentation und Prüfwerkzeuge betroffen; keine Produktdatei, kein Deployment, keine
Datenbank, keine Zugangsdaten. PR schließen und Branch löschen genügt. Die Website auf `main`
bleibt unverändert `9f58439`.
