# Datenverträge RAD-03 — Taxonomie, Experimente, Journal

Vertragsstand **1.0** (`CONTRACT_VERSION`), Speicher-/Exportumschlag **1**
(`STORAGE_SCHEMA`). Verbindlich für Inhalte, Generator und die Werkstatt-Karten
RAD-07 bis RAD-10.

## 1. Geltungsbereich

Dieses Paket **ersetzt** das bestehende Artikel- und Quellenmodell nicht. Es
ergänzt es um sieben Entitätstypen und um die Laufzeitverträge für
Experimentläufe und Tagebucheinträge.

| Datei | Rolle |
| --- | --- |
| `docs/radiasthesie-konzept/daten/taxonomie.json` | Redaktionelle Quelle der Wahrheit, versioniert |
| `js/modules/radiasthesie-vertraege.js` | Prüfung und Laufzeitverträge (ESM, ohne DOM) |
| `js/data/radiasthesie.js` | Generiert; enthält `schemaVersion` und `taxonomie` additiv |
| `js/data/radiasthesie-werkstatt.js` | Eingefrorene Fassade für RAD-07–RAD-10 |
| `tests/radiasthesie-vertraege.mjs` | 19 Vertragstests (`node --test`) |
| `scripts/generate-radiasthesie-data.cjs` | Validiert die Taxonomie vor dem Schreiben |

Nicht Teil dieses Pakets: die Statistik-Rechenkerne (exakter Binomialtest,
Wilson-Intervall) und die Speicherimplementierung. Beide gehören zu RAD-09
(`KOMPONENTENGRENZEN.md` §4/§6); hier werden nur ihre Eingaben erzwungen.

## 2. Entitätsvertrag

Jede Entität trägt die Basisfelder der Originalanforderung:

| Feld | Typ | Regel |
| --- | --- | --- |
| `id`, `slug` | Slug | `^[a-z0-9]+(-[a-z0-9]+)*$`, `id === slug`, global eindeutig |
| `title` | Text | 3–120 Zeichen |
| `category` | Text | 3–60 Zeichen (Anzeigekategorie, z. B. „Instrument“, „Forschung“) |
| `summary` | Text | 20–400 Zeichen, keine Steuerzeichen |
| `body` | Text | 0–4000 Zeichen, Mehrzeiler erlaubt |
| `tags` | Slug-Liste | 1–8, eindeutig |
| `relatedTopics` | Enum-Liste | Teilmenge von `radiasthesie`, `pendeln`, `orakel`, 1–3 |
| `references` | Qxx-Liste | jede ID muss im Quellenverzeichnis existieren, 0–20 |
| `images` | ID-Liste | jede ID muss in `medien` existieren, 0–6 |
| `evidenceStatus` | Enum | `A`–`E` (bestehende Evidenzstufen) |
| `reviewStatus` | Enum | `draft`, `reviewed`, `approved` |
| `lastReviewed` | Datum | `YYYY-MM-DD`, echtes Kalenderdatum |

Typspezifische Pflichtfelder:

| Typ | Zusatzfelder |
| --- | --- |
| `instrument` | `instrumentType` (`rute`, `winkelrute`, `einhandrute`, `biotensor`, `pendel`, `tafel`, `skala`), `material[1..6]`, `usage` 3–200, `assessment` 20–400 |
| `methode` | `methodType` (`feldmutung`, `pendeln`, `tafelarbeit`, `kartenpendeln`, `diagnostik`, `pruefung`), `procedure[1..8]`, `assessment` |
| `ereignis` | `year` (int oder `null`) **oder** `period`; `place`, `actors[]`, `dateDispute` (boolean), bei `dateDispute: true` ein `dateNote` 10–300 |
| `erklaerungsmodell` | `modelType` (`physiologisch`, `psychologisch`, `statistisch`, `geologisch`), `explains[1..6]`, `assessment` |
| `studie` | `studyType`, `year` (oder `yearNote`), `authors[1..8]`, `design`, `result`, `limits`, `peerReviewed`, `sourceId` (muss in `references` stehen) |
| `medium` | `mediaType` (`svg`/`photo`), `status` (`available`/`planned`), `file`, `alt`, `caption`, `creator`, `license`, `sourceUrl`, `sourceNote`, `widths[]`, `ratio` |
| `experiment` | `testType`, `k` 2–10, `n` 10–200, `baseProbability`, `stopRule`, `analysis[]`, `hypothesis`, `instructions`, `mode: "test"` |

Medienregel: `status: "available"` verlangt einen lokalen Pfad unter
`assets/radiasthesie/` und eine existierende Datei (der Generator prüft das
Dateisystem). `status: "planned"` verlangt `file: ""` — ein geplantes Medium darf
keinen Pfad vortäuschen. Lizenzangaben geplanter Fotos sind als „laut Auftrag,
ungeprüft“ gekennzeichnet; die Prüfung bleibt RAD-05.

## 3. Experimentprotokoll

Die statistische Auswertung ist nur zulässig, wenn das Protokoll vor dem ersten
Versuch feststeht:

| Feld | Regel | Grund |
| --- | --- | --- |
| `testType` | `jaNein`, `richtung`, `zahl`, `symbol` | Testart |
| `k` | ganze Zahl 2–10 | Zielraum |
| `n` | ganze Zahl 10–200 | feste Fallzahl |
| `stopRule` | ausschließlich `fixed-n` | keine optionale Nachlese |
| `analysis` | enthält `binomial-exact`, optional `wilson-95` | Testart der Auswertung |
| `baseProbability` | `1/k` auf 1e-9 genau | Zufallserwartung, nicht frei wählbar |

Ein Verstoß ist ein Validierungsfehler, kein Hinweis. `validateProtocol()` ist
auch für Laufzeitläufe zuständig, damit ein gespeicherter Lauf nicht nachträglich
ein anderes Protokoll behaupten kann.

## 4. Laufvertrag (RAD-09)

```json
{
  "schema": 1,
  "runId": "run-20261103100000-a1b2c3",
  "experimentId": "exp-ja-nein-20",
  "protocol": { "testType": "jaNein", "k": 2, "n": 20, "stopRule": "fixed-n",
                "analysis": ["binomial-exact", "wilson-95"], "baseProbability": 0.5 },
  "mode": "test",
  "batchId": "lokal",
  "createdAt": "2026-11-03T10:00:00.000Z",
  "status": "running",
  "trials": [
    {
      "index": 1,
      "targetCommitment": { "algorithm": "sha256", "digest": "…64 hex…", "committedAt": "…" },
      "predictionLocked": { "answerIndex": 0, "lockedAt": "…", "locked": true },
      "resultRevealed": { "targetIndex": 1, "revealedAt": "…", "hit": false }
    }
  ]
}
```

Verbindliche Regeln:

1. **Reihenfolge**: `beginTrial` → `lockPrediction` → `revealResult`. Eine
   Enthüllung ohne gesperrte Vorhersage wirft; eine zweite Sperre wirft.
2. **Kein Ziel vor der Enthüllung**: Das gezogene Ziel steht weder im Lauf noch
   im Speicher noch im DOM. Gespeichert wird nur
   `sha256(runId|trialIndex|salt|targetIndex)`. Das Salt lebt ausschließlich im
   Rückgabewert `secret` und im Modulspeicher; es wird nie persistiert.
3. **Unveränderlichkeit**: `predictionLocked.locked === true`. Ein gesperrter
   Versuch wird nicht korrigiert und nicht gelöscht; gelöscht wird nur ein
   ganzer Lauf (RAD-09).
4. **Versuchsreihenfolge**: Nummern lückenlos ab 1, nur der aktuelle Versuch ist
   beantwortbar, enthüllt wird in Reihenfolge.
5. **Status**: `complete` genau dann, wenn alle `n` Versuche enthüllt sind.
6. **Treffer**: `hit === (predictionLocked.answerIndex === resultRevealed.targetIndex)`.
   Ein widersprüchlicher gespeicherter Lauf ist ungültig.
7. **Demo vs. Test**: `mode: "demo"` ist erlaubt, zählt aber nicht in die
   Auswertung; Katalogexperimente sind `test`.
8. **`experimentId`** verweist immer auf ein Katalogexperiment (`exp-…`),
   **`runId`** auf den konkreten Lauf (`run-…`).

`publicSnapshot(run)` liefert die UI-Sicht ohne Ziel vor der Enthüllung.
`runSummary(run)` liefert `planned`, `answered`, `revealed`, `hits`,
`expectedHits`, `baseProbability`, `testType`, `stopRule`, `analysis`,
`complete`, `evaluable`. Die Signifikanzrechnung bleibt RAD-09.

## 5. Journalvertrag (RAD-10)

| Feld | Pflicht | Regel |
| --- | --- | --- |
| `id` | ja | stabiler Slug, von `createEntry` erzeugt (`jr-…`) |
| `date` | ja | `YYYY-MM-DD`, gültiges Kalenderdatum |
| `question` | ja | 3–200 Zeichen, keine Steuerzeichen |
| `prediction` | ja | 1–200 Zeichen |
| `method` | nein | 1–60 Zeichen; bei übergebener `methodIds`-Liste nur Katalog-IDs |
| `confidence` | nein | ganze Zahl 1–5 |
| `result` | nein | ≤ 500 Zeichen, Mehrzeiler erlaubt |
| `review` | nein | ≤ 500 Zeichen, Mehrzeiler erlaubt |
| `experimentId` | nein | `exp-…`, muss zum Lauf passen |
| `runId` | nein | `run-…`; erfordert `experimentId` |
| `createdAt` | nein | ISO-Zeitstempel |

Journalbezug: `entryFromRun(run, …)` übernimmt nur **vollständig enthüllte**
Läufe und setzt `experimentId` + `runId`. Die Vorhersage ist das vorregistrierte
Protokoll (`Vorregistriert: exp-…, n=…, k=…, p=…`), das Ergebnis die Trefferquote
gegen die Zufallserwartung — die Einzelantworten bleiben ausschließlich im Lauf
und werden nicht dupliziert. §5 von `KOMPONENTENGRENZEN.md` nennt nur
`experimentId`; `runId` ist die additive, eindeutige Präzisierung, die die
Konsistenzforderung dieser Karte verlangt.

Regel `runId ⇒ experimentId`: verhindert einen Journalbezug, der einem Lauf
widerspricht. Bei übergebenem `runs`-Kontext prüft der Validator die Referenz.

## 6. Import und Export

Umschlag (§7.1 der Komponentengrenzen):

```json
{ "schema": 1, "app": "esoterik-welt", "kind": "journal",
  "exportedAt": "2026-11-03T10:00:00.000Z", "data": [] }
```

| Regel | Durchsetzung |
| --- | --- |
| `kind` | `journal`, `experiment` oder `tafel` |
| `schema` | exakt `1`; höhere Stände werden abgelehnt, nicht überschrieben |
| `app` | exakt `esoterik-welt` |
| Größe | ≤ 1 MiB (1 048 576 Bytes, UTF-8) |
| Inhalt | `journal`/`experiment` als Array, `tafel` als Objekt |
| Atomarität | ein ungültiger Eintrag ⇒ `ok: false`, `value: null`, kein Teilschreibvorgang |
| Unbekannte Felder | werden ignoriert (Vorwärtskompatibilität) |
| Fehlerform | `{ path, rule, message }`, z. B. `data[1].date: …` |

`exportEnvelope`/`serializeEnvelope` prüfen vor dem Schreiben und verweigern
ungültige Daten. CSV-Import ist nicht vorgesehen (Typverlust); CSV-Export bleibt
RAD-10.

## 7. Prüf-API

```js
import {
  CONTRACT_VERSION, STORAGE_SCHEMA, COLLECTIONS, JOURNAL_LIMITS,
  validateEntity, validateProtocol, validateTaxonomie, validateDataset,
  validateRun, validateJournalEntry,
  createRun, beginTrial, lockPrediction, revealResult,
  publicSnapshot, runSummary,
  createEntry, entryFromRun,
  exportEnvelope, serializeEnvelope, importEnvelope, journalMethods,
} from '../modules/radiasthesie-vertraege.js';
```

Alle Validatoren liefern `{ ok, errors }` und werfen nicht bei Nutzdaten.
Lebenszyklusfunktionen (`createRun`, `beginTrial`, `lockPrediction`,
`revealResult`) werfen bei Vertragsbruch — das ist ein Programmierfehler, kein
Nutzereingabefall. `createRun`, `beginTrial`, `revealResult` sind asynchron
(SHA-256 über Web Crypto); `lockPrediction` ist synchron.

## 8. Anschluss der UI-Karten 07–10

```js
import WERKSTATT from '../data/radiasthesie-werkstatt.js';
import { createRun, beginTrial, lockPrediction, revealResult, runSummary }
  from '../modules/radiasthesie-vertraege.js';

const experiment = WERKSTATT.experimentById('exp-ja-nein-20');   // RAD-09
const protocol = WERKSTATT.validateProtocol(experiment);         // { ok, errors }

const methoden = WERKSTATT.journalMethods;                       // RAD-10
const tafelBild = WERKSTATT.mediumById('rad-pendeltafel');       // RAD-08
const pendelBild = WERKSTATT.mediumById('rad-pendel-geometrie'); // RAD-07
```

| Karte | Nutzt aus diesem Vertrag |
| --- | --- |
| RAD-07 Simulator | `instrumente` (`pendel`), `medien` (`rad-pendel-geometrie`), `erklaerungsmodelle` (Carpenter/Kohnstamm) |
| RAD-08 Tafel-Studio | `medien` (`rad-pendeltafel`), `instrumente` (`pendeltafel`), Exportkind `tafel` |
| RAD-09 Experimentierlabor | `experimente`, `validateProtocol`, `createRun`/`beginTrial`/`lockPrediction`/`revealResult`, `runSummary`, Exportkind `experiment` |
| RAD-10 Pendeltagebuch | `JOURNAL_LIMITS`, `journalMethods`, `createEntry`, `entryFromRun`, Exportkind `journal` |

Speicher: Schlüssel und Umschlag bleiben wie in `KOMPONENTENGRENZEN.md` §6
(`esot_rad_journal_v1`, `esot_rad_experiment_v1`, `esot_rad_studio_v1`) mit
`schema: 1`. Das Salt gehört **nicht** in den Speicher; ein Lauf ohne Antwort ist
nach einem Reload zu verwerfen (dokumentiertes Verhalten, kein Datenverlust, da
keine Vorhersage gesperrt wurde).

## 9. Änderungsverfahren

1. `taxonomie.json` bearbeiten (oder eine neue Entität ergänzen).
2. `npm run data:radiasthesie` — validiert, schreibt `js/data/radiasthesie.js`,
   formatiert mit Prettier.
3. `npm run test:radiasthesie:vertraege` und `npm run test:radiasthesie`.
4. Inkompatible Feldänderung ⇒ `CONTRACT_VERSION` und/oder `STORAGE_SCHEMA`
   erhöhen; alte Exporte werden dann abgelehnt statt still falsch gelesen.

Der Generator bricht mit Dateiname und Feldpfad ab, wenn eine Regel verletzt ist
oder eine als verfügbar markierte Mediendatei fehlt.

## 10. Offene Punkte (bewusst nicht in RAD-03)

- Exakter Binomialtest, Wilson-95-%-Intervall und `p`-Formatierung: RAD-09.
- Speicher-/Quota-Verhalten, Löschung, In-Memory-Fallback: RAD-09/RAD-10 nach §6.
- Tafel-Payload (Segmente, SVG): RAD-08; der Umschlag `tafel` wird hier nur
  formal geprüft.
- Lizenzprüfung der sechs geplanten Fotos: RAD-05. Die Medienliste führt sie als
  `planned` mit ungeprüfter Lizenz, damit kein Bild vor der Prüfung ausgeliefert
  wird.
