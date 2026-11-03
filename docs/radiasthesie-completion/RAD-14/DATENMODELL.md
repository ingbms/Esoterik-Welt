# Content- und Datenmodelldokumentation

**Stand:** Commit `5fe5301` · Schema `1.0` (`RADIASTHESIE.schemaVersion`), Taxonomie `$schema_version 1.0`, Speicher-/Export-Schema `STORAGE_SCHEMA = 1`
**Vertragsdokument:** `docs/radiasthesie-completion/RAD-03/VERTRAEGE.md` (verbindlich) · diese Datei beschreibt den ausgelieferten Stand.

## 1. Zwei Datenebenen

| Ebene | Ort | Zweck |
| --- | --- | --- |
| Redaktionsquellen | `docs/radiasthesie-konzept/inhalte/*.md`, `recherche/quellen.json`, `daten/taxonomie.json`, `assets/radiasthesie/media/media-manifest.json` | werden von Menschen gepflegt |
| Auslieferung | `js/data/radiasthesie.js` (generiert, 255 kB) | wird vom Browser gelesen; einzige Wahrheit zur Laufzeit |

`js/data/radiasthesie.js` trägt den Kopf „AUTO-GENERIERT — nicht direkt bearbeiten“.
Änderungen gehören in die Quellen, danach `npm run data:radiasthesie`.

## 2. Wurzelobjekt `RADIASTHESIE`

| Feld | Typ | Inhalt im Stand `5fe5301` |
| --- | --- | --- |
| `generatedAt` | String | `2026-11-03` |
| `generatedFrom` | String | `docs/radiasthesie-konzept/inhalte/` |
| `schemaVersion` | String | `1.0` |
| `module` | Objekt | `id`, `base` (`#pendeln`), `title`, `eyebrow`, `lead`, `status`, `seoTitle`, `seoDescription` |
| `counts` | Objekt | `topics 3`, `chapters 32`, `levels 5`, `sources 66`, `glossary 17`, `photos 6`, `ownDrawings 4` |
| `levels` | Array[5] | `key`, `label`, `definition`, `examples` |
| `topics` | Objekt | drei Themen, Schlüssel `radiasthesie`, `pendeln`, `orakel` |
| `introduction` | Objekt | Einstiegstext des Moduls |
| `landing` | Objekt | `topics`, `workshop` (4 Karten), `disclaimer` |
| `glossary` | Array | Buchstabengruppen mit `terms` |
| `sources` | Array[66] | Quellenregister |
| `sourceLegend` | Array | Erklärung von Prüftiefe und Interessenvermerk |
| `vernetzung` | Array[9] | Themenvernetzung, 7 verlinkt, 2 Lücken |
| `media` | Objekt | `items` (6 Fotos), `ownAssets` (4 SVGs), `figureSlot`, `openIssues`, `retrievedAt`, `manifest` |
| `legal` | Objekt | rechtlicher Hinweis (Titel + Absätze) |
| `taxonomie` | Objekt | sieben Entitätstypen, siehe §5 |
| `updated` | String | `2026-11-03` |

## 3. Kennzeichnung A–E

Die Stufe gilt **je Aussage**, nicht je Quelle. Textmarke zuerst, Farbe nur als Zusatz
(`levelChip` in `radiasthesie-format.js`); die Chips tragen das Kürzel und das Wort.

| Stufe | Label | Definition (Wortlaut im Datenmodell) |
| --- | --- | --- |
| A | Historisch | Historische Tatsache / nachweisbare Überlieferung |
| B | Tradition | Praxisbeschreibung / Tradition |
| C | Hypothese | Fachliche Einordnung / kontrovers |
| D | Befund | Kontrollierte Untersuchungen / wissenschaftliche Einordnung |
| E | Widerlegt | Behauptungen ohne Bestätigung / pseudowissenschaftlich eingeordnet |

## 4. Thema und Kapitel

Ein Thema (`topics.<slug>`) hat:

```
slug, title, eyebrow, subtitle, metaLine, status, seoTitle, description,
heading, lead, wordCount, chapterCount, figure, cardText, facts,
sections[], disclaimer, related[]
```

Ein Kapitel (`sections[]`) hat:

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `id` | String | Anker, z. B. `tafeln` → `#pendeln/pendeln/tafeln` |
| `number` | Number | laufende Nummer, zweistellig dargestellt |
| `title` | String | Kapitelüberschrift |
| `period` | String | optionaler Zeitraum (z. B. bei Geschichte) |
| `chips` | Array | Stufen A–E des Kapitels |
| `blocks` | Array | Absätze: `{type:"p",text}`, `{type:"ul",items}`, `{type:"callout",paragraphs}` |
| `photos` | Array | kapiteleigene Fotos (im Stand leer; Fotos hängen am Thema) |
| `words` | Number | Wortzahl des Kapitels |

**Fließtext-Markup.** Nur drei Auszeichnungen sind erlaubt und werden vom Renderer
bzw. Generator aufgelöst: `**fett**`, `*kursiv*`, `[Qxx]` → Link in das
Quellenverzeichnis. Alles andere ist Text und wird escaped.

## 5. Taxonomie — sieben additive Entitätstypen

Quelle: `docs/radiasthesie-konzept/daten/taxonomie.json` (`contract: "radiasthesie-taxonomie"`),
validiert gegen `js/modules/radiasthesie-vertraege.js`, ausgeliefert als `RADIASTHESIE.taxonomie`.

| Typ | Anzahl | Beispiel-ID |
| --- | --- | --- |
| `instrumente` | 7 | `winkelrute` |
| `methoden` | 6 | – |
| `ereignisse` | 12 | – |
| `erklaerungsmodelle` | 6 | – |
| `studien` | 7 | `enright-1995-reanalyse` |
| `medien` | 10 | – |
| `experimente` | 3 | – |
| `vernetzung` | 9 | `frequenz`, `geomantie` |

Basisfelder je Entität: `id`, `slug`, `title`, `category`, `summary`, `body`,
`tags`, `relatedTopics`, `references`, `images`, `evidenceStatus`, `reviewStatus`,
`lastReviewed`; dazu typspezifische Pflichtfelder (z. B. `k`, `n`, `stopRule`,
`analysis` bei Experimenten).

**Erzwungene Integrität** (Generator bricht sonst mit Exit 1 ab):

- jede `Qxx`-Referenz existiert im Quellenregister,
- `relatedTopics` zeigt auf eines der drei Themen,
- `images` zeigt auf ein Medium,
- `id` und `slug` sind global eindeutig,
- die `sourceId` einer Studie steht in ihren `references`,
- ein Experiment hat `k` 2–10, `n` 10–200, `stopRule: fixed-n` und `analysis` mit `binomial-exact` sowie `baseProbability === 1/k`,
- ein Vernetzungseintrag mit Status „offen“ darf **kein** `href` tragen (keine erfundenen Routen).

Die Fotos bleiben in der Taxonomie auf `planned`; maßgebliche Quelle für Fotos ist
das Medien-Manifest. Das ist eine bewusste Entscheidung (RAD-06, §4) statt einer
gelockerten Prüfung.

## 6. Quellen

| Feld | Bedeutung |
| --- | --- |
| `id` | `Q01`…`Q66` |
| `citation` | bibliografische Zeile |
| `shortName` | Kurzform für Tabellen |
| `title`, `url`, `locator` | Titel und Fundstelle |
| `type` | 37 verschiedene Typangaben (Behörde, Zeitschrift, Enzyklopädie, Monografie …) |
| `year` | Jahr oder Jahre |
| `levels` | getragene Stufen A–E |
| `verification` | Prüftiefe: `VL`, `VL-T`, `AB`, `DOI/CF`, `ISBN`, `ISBN/Katalog`, `OA-Meta` … |
| `note`, `interestNote`, `accessNote` | Anmerkung, Interessenvermerk, Zugangsvermerk |

Verteilung: 28× `VL`, 17× `AB`, 7× `DOI/CF`, 3× `VL-T`, Rest ISBN-/Katalog- und Mischformen.
Vollständige Liste: `QUELLENBIBLIOTHEK.md`.

## 7. Glossar, Vernetzung, Rechtstext

- **Glossar:** `glossary[]` → `{letter, terms[]}`; ein Term hat `term`, `definition`, `levels[]`, `sources[]`.
- **Vernetzung:** `{id, type, title, href, pending, status, note, abgrenzung, decision, topics[], text}`. Startseite und Seitenenden lesen dieselbe Registry.
- **Rechtstext:** `legal = {title, paragraphs[]}`; wird auf der Methodik-Seite und im Modul ausgespielt.

## 8. Laufzeitverträge für die Werkzeuge

Aus `js/modules/radiasthesie-vertraege.js` (DOM-frei, von Node-Tests geprüft):

| Vertrag | Regel |
| --- | --- |
| `STORAGE_SCHEMA` | `1`; ein höheres Schema im Speicher wird **nicht** überschrieben |
| `EXPORT_KINDS` | `journal`, `experiment`, `tafel` |
| Lauf | `experimentId` + `runId`; je Versuch `targetCommitment` (SHA-256), `predictionLocked` (unveränderlich), `resultRevealed` |
| Reihenfolge | Ziel ziehen → Antwort → Sperre + Speicherung + Rückleseprüfung → enthüllen → auswerten |
| Journal | Pflicht `date`, `question` (3–200), `prediction` (1–200); optional `confidence` 1–5, `result`/`review` bis 500; `experimentId` + `runId` nur gemeinsam und nur auf vorhandenen Lauf |
| `entryFromRun` | nur für vollständig enthüllte Läufe; der Lauf bleibt byteweise unverändert |
| Umschlag | `{schema:1, app:"esoterik-welt", kind, exportedAt, data}` |
| Import | ≤ 1 MiB, ≤ 500 Einträge, atomar, unbekannte Felder werden verworfen |
| CSV | UTF-8 mit BOM, Trennzeichen `;`, RFC-4180-Quoting, CRLF |

## 9. Speicher

| Schlüssel | Inhalt | Geschrieben von |
| --- | --- | --- |
| `esot_rad_journal_v1` | Tagebucheinträge im Umschlag `{schema:1, savedAt, data}` | Pendeltagebuch |
| `esot_rad_experiment_v1` | bis zu 2 000 Antworten, Läufe | Experimentierlabor |
| `esot_rad_corrupt_<schlüssel>_<stempel>` | Sicherung eines defekten Rohwerts | beide |

Verhalten in Randfällen (getestet, RAD-09/RAD-10):

- defektes JSON → Rohwert sichern, Schlüssel leeren, Meldung in der Live-Region, kein Throw,
- Schema > 1 → Schreiben, Import und Laufübernahme blockiert, bis die neuere Fassung geladen ist,
- Quota voll → Meldung „Speicher voll — exportieren und alte Einträge löschen“, Eintrag gilt nur für die Sitzung,
- kein `localStorage` (privater Modus, gesperrtes `file://`) → In-Memory-Fallback mit sichtbarem Hinweis,
- „Alle eigenen Daten löschen“ entfernt jeden Schlüssel mit Präfix `esot_rad_`; fremde Schlüssel bleiben.

Es gibt **keine** Verschlüsselung, **kein** Konto, **keine** Synchronisierung und
**keine** Übertragung. Wer das Browserprofil lesen kann, liest die Einträge.

## 10. Erzeugen und Prüfen

```bash
npm run data:radiasthesie        # Quellen → js/data/radiasthesie.js (validiert, deterministisch)
node --test tests/radiasthesie.mjs tests/radiasthesie-vertraege.mjs
npm run build && npm run verify:build
```

Der Generator ist idempotent: zwei Läufe erzeugen byte-identische Dateien
(RAD-12). Ein Negativpfad ist belegt (RAD-03): eine injizierte unbekannte Quelle
`Q99` führt zu Exit 1 und unverändertem Datenstand.
