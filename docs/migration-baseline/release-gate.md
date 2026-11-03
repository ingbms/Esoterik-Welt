# Release-Gate — Katalogverbund gegen die Baseline `baseline/rubriken-2026-11-03`

**Karte:** `t_9c2a7824` — Release-Gate: Katalog konsolidieren und Push-Freigabe dokumentieren
**Baseline:** Tag `baseline/rubriken-2026-11-03`, Commit `9f584397f8cc86a261fccdfc36dfbb8999f55ea7` (PR #18, live geprüft)
**Arbeitsbaum:** `wt/t_cbbf71e0`, Eingangs-Commit `8892586ff4f4a5819a89607e2d1295cfb4ff1546`
**Stand der Prüfung:** 2026-11-03
**Werkzeuge:** Node v24.13.0, Playwright 1.64.1 (Chromium), Windows 11
**Prüfgegenstand:** `docs/migration-baseline/` (Design-, Inhalts-, Medien-, Funktions-Katalog) und `scripts/migration-baseline/`

---

## 0. Entscheidung

**GO mit Auflagen für das Katalog-Paket.**

Der Katalogverbund ist konsolidiert, schema-konform, vollständig belegt und gegen die ausgelieferte
Baseline reproduzierbar. Alle zehn Muss-Kriterien bestehen mit Nachweis (Abschnitt 2), der
Gate-Prüfer selbst hält einer Negativkontrolle mit 5 von 5 erkannten Fehlern stand (Abschnitt 8).

**Was ausdrücklich nicht freigegeben ist:**

- **Kein direkter Push auf `main`.** Die Konsolidierung erfolgt über einen separaten PR des Master
  (`t_04d92b4a`). Diese Karte erzeugt keine Veröffentlichung.
- **Keine Freigabe des Eingangsstands.** Commit `c59a074` (Inhalts-Katalog allein) war mit 70
  Schemafehlern und vier falschen Routen **nicht** freigabefähig. Der Befund D-09 der unabhängigen
  Design-Prüfung war korrekt und ist jetzt behoben — nicht wegdiskutiert.
- **Keine Produktänderung.** `index.html`, `css/`, `js/`, `data/`, `assets/` und `dist/` sind
  unberührt. Die Produktbefunde D-02, D-04, D-05 und D-06 bleiben offen (Abschnitt 5).

**Auflagen** (jede mit Owner und Termin, Abschnitt 4): A-1 bis A-5. Sie blockieren die
Katalogveröffentlichung nicht, weil der Katalog sie wahrheitsgemäß als offen führt; sie blockieren
den nächsten Produkt- bzw. VELARKANA-Push.

**Keine Selbstfreigabe:** Diese Empfehlung stammt von der Karte, die die Reparaturen ausgeführt hat.
Der Master muss `verify-release-gate.cjs` vor dem PR unabhängig erneut ausführen; das Ergebnis ist
als Datei hinterlegt, nicht als Behauptung.

---

## 1. Ausgangsstand und was daran repariert wurde

Beim Eingangs-Commit `8892586` war der Verbund **nicht** freigabefähig:

| Befund | Messwert am Eingang | Beleg |
| --- | --- | --- |
| Inhalts-Katalog verletzt das eigene Schema | 70 Fehler, 11 Warnungen (`validate-catalogs`), 1 Abweichung (`validate-schema`) | D-09 der Design-Prüfung |
| Vier katalogisierte Routen existieren nicht | `#farbwelten/braun`, `/therapie`, `/psychologie`, `/licht` → „Diese Farbwelt gibt es nicht" | D-10, `route-check.json` |
| Fünf reale Routen fehlen im Katalog | `indigo`, `farbtherapie`, `farbpsychologie`, `lichtmedizin`, `#blog/6` | D-10 |
| Design-Katalog mit falschen Aussagen | L-03 widerlegt, L-08 gegenstandslos, L-07 verweist auf die falsche Komponente | D-01, D-08, D-12 |
| Zustandsabdeckung unvollständig | Fehler- und Hover-Zustand fehlten als `DES-STA` | D-07 |

**Reparaturen in dieser Karte** (jede Änderung mit Vorher/Nachher, Regel und Begründung):

| Datei | Änderung | Beleg der Änderungen |
| --- | --- | --- |
| `content-catalog.json` | Sammel-Eintrag `CNT-CLAIMS` entfernt; 23 fehlende `acceptance_check` an Katalogeinträgen ergänzt (der entfernte Sammel-Eintrag war der 24.); `CNT-UI-002` → `CNT-STR-002`; Braun → Indigo; drei Themenseiten von `topic-page` auf `subroute` (IDs `CNT-SUB-201…203`) mit den echten Slugs; `CNT-LEG-002` auf `datenschutz.html` korrigiert; `CNT-LEG-003` (Haftung) ergänzt; neun gerenderte Artikel (002–010) und zwölf Markdown-Artikel (011–022) ergänzt; sechs Claims korrigiert und an Einträge gebunden | `evidence/release-gate/content-catalog-reparatur.json` (93 + 1 Einträge) |
| `content-catalog-meta.json` | Fünf Wurzel-Metadatenblöcke (Herkunft, Lokalisierung, Tonalität, Lücken) aus dem Katalog ausgelagert, weil das Schema an der Wurzel `additionalProperties: false` setzt | `content-catalog-reparatur.json`, Eintrag `ROOT_ADDITIONAL_PROPERTIES` |
| `design-catalog.json` | `DES-STA-011` (Formular-Fehlerzustand) und `DES-STA-012` (Hover) ergänzt; `DES-CMP-011` (Tooltip) auf `veraltet`/`none`; `DES-CMP-023` mit gemessenen 13 × 15 px auf `must` | `evidence/release-gate/design-katalog-nachzug.json` |
| `design-katalog-luecken.md` | L-03, L-07, L-08 korrigiert, Abschnitt 7 „Nachzug im Release-Gate" ergänzt | D-01, D-03, D-08, D-12 |

Der Inhalts-Katalog wächst damit von 33 auf **54 Einträge**, der Design-Katalog von 275 auf **277**.
Nichts wurde gelöscht, was Inhalt trug; der Sammel-Eintrag `CNT-CLAIMS` war ein Strukturfehler
(Claim-Objekte in einem `claims`-Array, das IDs verlangt) und ist in `claims[]` vollständig erhalten.

---

## 2. Gewichtete Go/No-Go-Checkliste

Gewicht: **5 = blockierend** (ein Fehlschlag verhindert die Freigabe), **3 = vor dem Push anzustreben**,
**1 = Nachbesserung ohne Release-Wirkung**. Nachweis je Kriterium als Datei oder Befehl.

### 2.1 Muss-Kriterien (Blocker)

| # | Gew. | Kriterium | Nachweis | Ergebnis |
| --- | --- | --- | --- | --- |
| M1 | 5 | Beide JSON-Kataloge entsprechen `schema/catalog.schema.json` (Wurzel und Einträge) | `node scripts/migration-baseline/validate-schema.cjs` → „16 Prüfungen, 0 Abweichungen", Exit 0 | **bestanden** |
| M2 | 5 | Alle Pflichtfelder, ID-Muster, Enums, Quellen und `text_ref`-Formate sind eingehalten | `validate-catalogs.cjs` → „0 Fehler", 3 benannte Warnungen, Exit 0 | **bestanden** |
| M3 | 5 | Generierte Artefakte (`design-system.md`, `design-tokens.json`, `content-catalog.md`) sind aktuell | `render-catalogs.cjs --check` → drei Mal OK, Exit 0 | **bestanden** |
| M4 | 5 | Jeder Design-Eintrag ist gegen das CSS nachprüfbar (Quelle existiert, Selektor im Zeilenfenster, Token-Wert identisch) | `verify-design-catalog.cjs` 0 Fehler/0 Warnungen **und** `verify-design-catalog-independent.cjs` 277 Einträge / 170 Tokens / 94 Nicht-Token / 13 Umbruchpunkte, 0 Fehler | **bestanden** |
| M5 | 5 | Medien-Katalog deckt jede Datei unter `assets/` ab, inklusive Bytes, Hashes und Lizenzstatus | `verify-media-catalog.cjs` → 17/17 Prüfungen, 644/644 Zeilen, 0 fehlende Dateien, 0 Hash-Abweichungen | **bestanden** |
| M6 | 5 | Funktions-Katalog ist vollständig belegt | `verify-function-catalog.cjs` → 10 Bereiche, 96 Funktionen, „alle Quellen und Nachweise vorhanden" | **bestanden** |
| M7 | 5 | Bestandsaufnahme entspricht dem Arbeitsbaum | `inventory-baseline.cjs --check` → OK, Exit 0 | **bestanden** |
| M8 | 5 | Jede katalogisierte Route existiert; jede verlinkte Route ist katalogisiert | `check-catalog-routes.cjs` → 39 Routen, **0** nicht gefunden, **0** verlinkt-aber-nicht-katalogisiert | **bestanden** |
| M9 | 5 | Laufzeitfakten stimmen mit dem Katalog überein | `verify-release-gate-facts.cjs` → 30 Kristallkarten (aus `data/crystals.json`, Legacy-Modul nicht geladen), 12 Farben inkl. Indigo, drei Themenseiten lösen auf, alte Slugs nicht, `#blog/6` öffnet | **bestanden** |
| M10 | 5 | Jeder Eintrag hat Quelle, Status, Owner, Release-Relevanz und Prüfkriterium; jede `text_ref` liegt im Datei- und Zeilenbereich; jede Claim-Referenz existiert | Struktur-Audit in `verify-release-gate.cjs` → 0 Fehler über 331 Einträge und 6 Claims | **bestanden** |

Zusammenfassung: `docs/migration-baseline/evidence/release-gate/pruefungen.json`
(`ok: true`, `must_failed: []`, `structural_errors: 0`).

### 2.2 Soll-Kriterien (Nachbesserung nach dem Push)

| # | Gew. | Kriterium | Status | Nachweis |
| --- | --- | --- | --- | --- |
| S1 | 3 | Jede Aussage mit `verification: verified` hat eine Zitatangabe | erfüllt (6/6) | `validate-catalogs.cjs` |
| S2 | 3 | Keine Aussage mit `release_relevance: must` bleibt unbelegt | **offen für CLM-003** (Auflage A-2) | `validate-catalogs.cjs`, Warnung `CLAIM_BLOCKER_UNBELEGT` |
| S3 | 3 | Kein `must`-Eintrag ohne Abnahme | **offen für `CNT-LEG-002`** (Auflage A-3) | ebd., Warnung `BLOCKER_NOT_FINAL` |
| S4 | 3 | Alle Medienlizenzen entschieden | **offen für `MED-0130`** (Auflage A-4) | ebd., Warnung `LICENSE_OPEN` |
| S5 | 3 | Keine ungenutzten oder veralteten Komponenten als „ausgeliefert" geführt | erfüllt (8 `veraltet`, 28 Tokens `none`) | `design-catalog.json` |
| S6 | 3 | Zielgrößen ≥ 24 × 24 px (WCAG 2.5.8) | **offen** (`.badge-remove` 13 × 15 px, Auflage A-1) | `probe-befunde.json` `D03_badgeRemove` |
| S7 | 3 | Schreib- und Fehlerzustände wirken in allen Werkstätten gleich | **offen** (Studio-Regel wirkungslos, D-02) | `probe-befunde.json` `D02_studio` |
| S8 | 1 | Keine doppelten IDs, keine Überschriften-Sprünge | offen (D-04, D-05), ohne Release-Wirkung | `detail-befunde.json`, `a11y-messung.json` |
| S9 | 1 | Entscheidung zu den zwölf Markdown-Artikeln | **entschieden und erledigt** (E-03/A-5: veröffentlicht als Blogartikel 11–22, `t_44e58074`) | `content-catalog.json` `CNT-ART-011…022` |
| S10 | 1 | Keine Altlasten im Auslieferungspfad | **erledigt**: `article-010.md.bak` entfernt; Artikelquellen sind über `_config.yml` aus dem Jekyll-Pfad ausgeschlossen (keine HTML-Doppelseite) | `git ls-files data/articles/`, `_config.yml`, `npm run test:offline` |

Die drei Warnungen aus M2 sind genau S2, S3 und S4 — dieselben drei Punkte, nicht mehr und nicht
weniger. Es gibt keinen unbenannten Rest.

---

## 3. Konsolidierte offene Punkte

### 3.1 Fehlende oder ungeklärte Assets

| Punkt | Umfang | Einordnung |
| --- | --- | --- |
| `MED-0130` `assets/mineral/mineral-detail-1000.jpg` | 1 von 644 Dateien (388 davon `must`) | Lizenz ungeklärt; als Gate-Punkt geführt, nicht als Katalogfehler |
| Zwölf Markdown-Artikel | 12 Dateien | **erledigt** (A-5): als Blogartikel 11–22 veröffentlicht, Routen `#blog/11`–`#blog/22` |
| `data/articles/article-010.md.bak` | 1 Datei | **entfernt** (E-04/S10) |

### 3.2 Fehlende Quellen und Claims

| Claim | Aussage | Status |
| --- | --- | --- |
| `CLM-002` | 30 Kristalle | **aufgelöst**: `data/crystals.json` = 30, im Browser 30 Karten gemessen; `js/data/crystals.js` (36) lädt keine Seite |
| `CLM-003` | Rot 620–750 nm | **offen**: Seite nennt den Wert ohne Quelle; physikalischer Standard, aber unbelegt (A-2) |
| `CLM-001/004/005/006` | Tarot-Karten, Artikelbestände, Farbwelten, Radiästhesie-Dokumente | belegt, `text_ref` auf konkrete Zeilen umgestellt |

### 3.3 Blocker aus dem Design-Review

| Befund | Zustand |
| --- | --- |
| D-09 (70 Schemafehler) | **behoben** — 0 Fehler, 0 Abweichungen |
| D-10 (vier falsche, fünf fehlende Routen) | **behoben** — 39/39 Routen, 0 Abweichungen |
| D-01, D-07, D-08, D-12 (Katalogaussagen) | **behoben** — siehe Abschnitt 1 |
| D-11 (Rechtsseiten sehr kurz) | **offen als Auflage A-3**, nicht als Katalogfehler |
| D-02, D-03, D-04, D-05, D-06 (Produkt) | **offen**, Owner `design_web_layout`, Auflagen A-1 und S7/S8 |

### 3.4 Platzhaltertexte

Keine. Geprüft gegen `index.html` und die Datenquellen; offene Punkte sind als `open_questions`
geführt, nicht als Blindtext.

---

## 4. Auflagen mit Owner und Termin

| ID | Auflage | Owner | Termin | Blockiert |
| --- | --- | --- | --- | --- |
| **A-1** | `.badge-remove` auf mindestens 24 × 24 px bringen (WCAG 2.5.8, gemessen 13 × 15 px); Katalognotiz `DES-CMP-023` nachziehen | `design_web_layout` | 2026-11-10 | nächsten Produkt-Push |
| **A-2** | `CLM-003`: Quellenangabe für 620–750 nm ergänzen oder den Wert als physikalischen Standard kennzeichnen | `writer` | 2026-11-10 | Katalog-`must`, nicht den PR |
| **A-3** | `datenschutz.html`: Radiästhesie-Journal (`esot_rad_journal_v`) und Experimentläufe (`esot_rad_experiment_v`) ergänzen; rechtliche Abnahme dokumentieren | Eigentümer (`default`) | 2026-11-17 | VELARKANA-Go-live |
| **A-4** | `MED-0130`: Lizenz klären oder Bild bewusst aus dem Release nehmen | `architect` | 2026-11-10 | nächsten Medien-Push |
| **A-5** | E-03 entschieden: zwölf Markdown-Artikel veröffentlichen oder entfernen (beides zugleich geht nicht) — **entschieden am 2026-11-03 (Variante A: veröffentlichen)**, umgesetzt in `t_44e58074`: Blogartikel 11–22, Katalog `CNT-ART-011…022` auf `final`/`must`/`shipped` | Eigentümer (`default`) | 2026-11-17 | entfällt (erledigt am 2026-11-03) |

Kein Blocker dieser Prüfung ist ohne Owner und Termin. Die Auflagen sind bewusst so formuliert, dass
sie den Katalog-PR nicht aufhalten: der Katalog beschreibt sie als offen, statt sie zu verschweigen.

---

## 5. Restrisiken (bewusst getragen)

| Risiko | Wirkung | Begründung |
| --- | --- | --- |
| Keine Screenreader-Ausgabe geprüft (nur DOM-Semantik und Live-Regionen) | Barrierefreiheit ist nicht vollständig abgenommen | Grenze der Messung, in der Design-Prüfung §1 benannt |
| Kontrast auf Verlaufsflächen rechnerisch, nicht pixelweise | Verlaufsbänder der Farbwelten | schlechtester Wert 4,80 : 1, 0 Verstöße; Annahme dokumentiert |
| Produktbefunde D-02/D-04/D-05/D-06 offen | 1 unsichtbarer Fehlerzustand, 2 doppelte IDs, 1 Überschriftssprung | keine WCAG-Blocker (3.3.1 durch Text erfüllt), aber Design-System-Defekt |
| 28 ungenutzte Tokens, 25 hartkodierte Farben, 22 Umbruchbreiten | Migration muss diese Entscheidungen treffen | Design-Schuld, keine Release-Wirkung |
| Nur Deutsch | keine Übersetzungen vorhanden | Lokalisierung dokumentiert (`content-catalog-meta.json`) |

---

## 6. Was ausgeliefert wird und was ausgenommen ist

Die Übergabe an den Push steht als eigenes, kurzes Dokument: **`docs/migration-baseline/push-handoff.md`**.
Kurzfassung:

- **Ausgeliefert** (dokumentarisch): vier Kataloge, ihre generierten Fassungen, das Schema, die
  Prüfwerkzeuge und die Belegdateien unter `docs/migration-baseline/` und `scripts/migration-baseline/`.
- **Bewusst ausgenommen:** Produktivcode (`index.html`, `css/`, `js/`, `data/`, `assets/`, `dist/`),
  `public/` (17 Dateien, von `build-pages.cjs` nicht kopiert), die fünf Altdateien (33 KB) und alle
  unversionierten Entwürfe außerhalb des Katalogordners. Die zwölf Markdown-Artikel sind seit A-5
  (`t_44e58074`) nicht mehr ausgenommen: Sie sind als Blogartikel 11–22 ausgeliefert.

---

## 7. Reproduktion

```bash
# Gesamturteil inklusive beider Browsermessungen (rund 90 s)
node scripts/migration-baseline/verify-release-gate.cjs

# Negativkontrolle des Gate-Pruefers: 5 kuenstliche Fehler muessen erkannt werden
node scripts/migration-baseline/verify-release-gate.cjs --self-test

# Einzelprüfungen
node scripts/migration-baseline/validate-schema.cjs
node scripts/migration-baseline/validate-catalogs.cjs
node scripts/migration-baseline/render-catalogs.cjs --check
node scripts/migration-baseline/verify-design-catalog.cjs
node scripts/migration-baseline/verify-design-catalog-independent.cjs [--negative]
node scripts/migration-baseline/verify-media-catalog.cjs
node scripts/migration-baseline/verify-function-catalog.cjs
node scripts/migration-baseline/inventory-baseline.cjs --check
node scripts/migration-baseline/check-catalog-routes.cjs
node scripts/migration-baseline/verify-release-gate-facts.cjs
```

Alle Ausgaben sind auf denselben Commit bezogen; `pruefungen.json` nennt ihn im Feld `head_commit`.

---

## 8. Belastbarkeit dieser Prüfung

- **Unabhängige Gegenprobe, nicht Selbstbestätigung:** Der Design-Katalog wird von zwei Prüfern
  gelesen — dem Katalogprüfer der Erhebung und einem eigenen Parser (`verify-design-catalog-independent.cjs`),
  der Katalog und CSS getrennt einliest.
- **Negativkontrollen statt Nullbefunde:** 5/5 künstliche Strukturfehler werden erkannt
  (`--self-test`), 4/4 künstliche Katalogfehler im Design (`--negative`), 5/5 Messdetektoren der
  A11y-Prüfung (`review-design-a11y.cjs --self-test`).
- **Laufzeit statt Quelltext:** Kristallzahl, Farbregister und `#blog/6` sind in Chromium gegen die
  Pages-Struktur gemessen (`runtime-fakten.json`), nicht aus dem Code abgeleitet.
- **Grenzen:** keine Screenreader, keine echten Geräte, kein 200-%-Zoom, keine Druckausgabe; die
  Zustände der 59 Komponenten und die 12 `DES-STA`-Einträge sind stichprobenartig, nicht vollständig
  durchgespielt.

**Empfehlung an den Master:** `verify-release-gate.cjs` auf dem PR-Kopf erneut ausführen. Ist
`ok: true`, ist der Katalog-PR freigabefähig; die Auflagen A-1 bis A-5 bleiben davon unberührt und
gehören in die VELARKANA-Planung.
