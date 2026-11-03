# Paketmatrix — 14 Pakete mit Evidenz und Reviewer-Verdikt

**Kandidat:** `ceddc84cfca44d53f1995dfd0981b7d70a554724`.
**Prüfgrundlage:** [RAD-13-Vollumfangsbericht](../RAD-13/TESTBERICHT.md) auf
`9bf5f73` (`t_29535d62`) plus [gezieltes unabhängiges F1/F2-Verdikt](evidence/REVIEW-F1-F2.md)
auf dem Kandidaten (`t_b1641fc1`). Rohbelege und Nachtest: [NACHABNAHME.md](NACHABNAHME.md).

## 1. Lesart

- Die Matrix enthält exakt 14 Pakete. Der Stand nennt die historische
  unabhängige Paketbewertung; F1/F2 wurden anschließend bestätigt behoben.
- Das historische Gesamtverdikt **NICHT ABGENOMMEN** wird nicht umgeschrieben.
  Das bestätigte spätere Verdikt lautet **F1/F2 freigegeben, keine Gesamt- oder
  Veröffentlichungsfreigabe**. Es hebt genau diese zwei Befunde auf.
- Für RAD-01…03 und RAD-06…12 gilt die ursprüngliche Paketbewertung, nicht eine
  erfundene erneute Einzelabnahme. RAD-04/05 erhalten das ergänzende F1/F2-Verdikt.
- RAD-14 ist geliefert und maschinell geprüft, jedoch nicht rückwirkend durch
  den früheren RAD-13-Lauf unabhängig gegengelesen. Der bestehende Master muss
  die abschließende DoD entscheiden.

## 2. Matrix

| Nr. | Paket | Kernartefakt | Evidenz | Stand (RAD-13) | Offen |
| --- | --- | --- | --- | --- | --- |
| 01 | Bestandsaufnahme und Architektur | `RAD-01/` mit Ist/Soll-Matrix, Integrationspunkten, Komponentengrenzen | [README](../RAD-01/README.md), `RAD-01/MATRIX-14-PAKETE.md`, `RAD-01/NACHWEIS-WORKTREE.md` | **Pass** | – |
| 02 | Fachrecherche und Quellenbibliothek | 66 Quellen mit Prüftiefe, Interessenvermerk, Claim-Matrix | [Checkpoint](../RAD-02/CHECKPOINT.md), `RAD-02/CLAIM-QUELLE-MATRIX.md`, `RAD-02/quellen-delta.json`, `RAD-02/SHA256SUMS.txt` | **Pass** | externe Erreichbarkeit nicht neu geprüft |
| 03 | Taxonomie und Datenmodell | 7 Entitätstypen, Verträge, Generator-Validierung | [Checkpoint](../RAD-03/CHECKPOINT.md), `RAD-03/VERTRAEGE.md`, `tests/radiasthesie-vertraege.mjs` | **Pass** | Taxonomie wird mitgeladen (~93 kB) |
| 04 | UX/UI-Design | gemessenes Mockup, 22 Zustände, Tastatur, Druck, Tokens | [Messung](../RAD-04/MESSUNG.md), `RAD-04/WERKZEUGE-UND-ZUSTAENDE.md`, `RAD-04/messung/kontrast.json` | **Pass; F1 danach unabhängig freigegeben** ([Verdikt](evidence/REVIEW-F1-F2.md)) | A-2/F4, R-7 bleiben offen |
| 05 | Bildbibliothek und Lizenzen | 6 Fotos, 24 Varianten, Manifest, Attributionsseite | [Checkpoint](../RAD-05/CHECKPOINT.md), `assets/radiasthesie/media/media-manifest.json`, `RAD-05/CHECKSUMMEN.sha256` | **Pass; F2 danach unabhängig freigegeben** ([Verdikt](evidence/REVIEW-F1-F2.md)) | R-1/R-3 bleiben offen |
| 06 | Redaktionelle Themenseiten | 3 Themen, 32 Kapitel, 6 346 Wörter, Fotos eingebunden | [Checkpoint](../RAD-06/CHECKPOINT.md), `RAD-06/INHALT-QUELLEN-BILD-MATRIX.md`, `RAD-06/matrix.json` | **Pass** | Orakel-Cluster dünn (R-6) |
| 07 | Interaktiver Pendelsimulator | `#pendeln/labor`, nichtlineares Modell, 21+11 Tests | [Checkpoint](../RAD-07/CHECKPOINT.md), `RAD-07/MODELL.md`, `tests/radiasthesie-simulator.mjs` | **Pass** | kein Screenreader, kein Firefox |
| 08 | Pendeltafel-Studio | `#pendeln/studio`, 6 Vorlagen, SVG/JSON/Druck, 37+17 Tests | [Checkpoint](../RAD-08/CHECKPOINT.md), `RAD-08/EXPORTE.md`, `RAD-08/evidence/pendeltafel-studio-druck.pdf` | **Pass** | interaktiver Druckdialog nicht bedient |
| 09 | Verblindetes Experimentierlabor | `#pendeln/experiment`, Commitment, exakte Statistik, 24+7 Tests | [Checkpoint](../RAD-09/CHECKPOINT.md), `tests/experiment-statistik.mjs` | **Pass** | clientseitige Verblindung (F-1), Quota nur simuliert |
| 10 | Pendeltagebuch | `#pendeln/journal`, Felder, Export/Import, Löschung, 26+10 Tests | [Checkpoint](../RAD-10/CHECKPOINT.md), `tests/journal-speicher.mjs` | **Pass** | unverschlüsselt (S-1), kein Tab-Sync (S-2) |
| 11 | Integration mit verwandten Themen | 9 Vernetzungseinträge, 7 Links, 2 Lücken, Frequenzkapitel | [Checkpoint](../RAD-11/CHECKPOINT.md), `RAD-11/INTEGRATION.md`, `RAD-11/evidence/browser/` | **Pass** | Geomantie/Kraftorte offen, Farbwelten-Merge offen |
| 12 | SEO, GEO, strukturierte Daten | 7 statische Dokumente, Sitemap, Canonical, BreadcrumbList | [Checkpoint](../RAD-12/CHECKPOINT.md), `RAD-12/ENTSCHEIDUNGEN.md`, `tests/radiasthesie-statisch.mjs` | **Pass mit offenem B7** | `og:image` fehlt (F3/B7) |
| 13 | Qualitätskontrolle | unabhängige Abnahme mit 21 Gate-Logs, 6 JSON-Sonden, Prüfskripten | [Testbericht](../RAD-13/TESTBERICHT.md), `RAD-13/evidence/`, `RAD-13/scripts/` | **Vollumfang geprüft, F1/F2 gezielt nachabgenommen** ([Verdikt](evidence/REVIEW-F1-F2.md)) | kein neues Gesamtverdikt; F3/F4 und Prüfgrenzen bleiben |
| 14 | Dokumentation und Übergabe | diese Sammlung: Architektur, Seiten, Datenmodell, Quellen, Medien, 4 Anleitungen, Protokolle, Änderungen, Grenzen, Ausbaustufen | [Index](README.md), [Nachabnahme](NACHABNAHME.md), [Release-Kandidat](../RELEASE-CANDIDATE.md), [Checkpoint](CHECKPOINT.md) | **geliefert**, aktueller Nachtest belegt; in RAD-13 historisch ausstehend | kein separates unabhängiges RAD-14-Inhaltsverdikt; Master-DoD ausstehend |

## 3. Historisches Verdikt im Wortlaut (`9bf5f73`)

> **NICHT ABGENOMMEN**
>
> Blockierend: F1 (P2) — axe-core 4.14.0 meldet `link-in-text-block` (WCAG 1.4.1)
> in 7 von 12 Ansichten; Korrekturkarte `t_b1641fc1`.
> Dazu F2 (P3, Foto-`sizes`) und F3 (P3, `og:image` fehlt).

Quelle: [Testbericht](../RAD-13/TESTBERICHT.md) bzw. Handoff der Karte `t_29535d62`
(abgeschlossen mit `verdict: "NICHT ABGENOMMEN"`).

Grün belegt sind in derselben Abnahme: Build/Lint/Format, 249 Node-Tests,
147/147 Playwright, `verify:build` 36/36 + 7/7, 80 Breiten-Läufe ohne Überlauf,
0 Konsolen-/Netzfehler, 0 externe Requests, 604 interne Links ohne totes Ziel,
Statistik gegen unabhängige BigInt-Referenz (max. 2,0e-15), Journal-XSS,
Studio-Import, SVG-Export, Löschung und reduzierte Bewegung.

## 4. Ergänzendes bestätigtes Verdict und Grenzen

> **F1/F2 freigegeben. Keine Gesamt- oder Veröffentlichungsfreigabe. RAD-14 bleibt offen.**

Quelle: [unabhängiger Review](evidence/REVIEW-F1-F2.md), `t_b1641fc1`,
auf `ceddc84cfca44d53f1995dfd0981b7d70a554724`. Belegt: 32 axe-Läufe ohne
Verstoß; 60 Bildläufe mit 120 geladenen Fotos ohne IMG-RES/Hochskalierung;
Jest 2/2, Node 242/242, Playwright 147/147, Build/Lint/Format/verify grün.
RAD-14 wiederholte die Gates; erster Gesamtlauf mit Tarot-Fokus-Timeout,
Wiederholung komplett grün. Logs: [NACHABNAHME.md](NACHABNAHME.md).

## 5. Noch zu entscheiden

1. F1/F2 sind **erledigt und unabhängig bestätigt**, nicht mehr Blocker.
2. F3/B7, F4 und die dokumentierten Rechts-/CI-/Browser-/Forschungsgrenzen
   bleiben offen; keine Behauptung vollständiger WCAG-AA-Konformität.
3. RAD-14-Inhalt ist geliefert und selbst geprüft. Es liegt kein separates
   unabhängiges Dokumentationsverdikt vor. Der Master `t_878c59c7` muss die
   Paket-DoD anhand dieser Nachweise abschließend entscheiden.
4. Der Reviewer-Checkout war sauber; der gemeinsame Baum enthält weiterhin
   separat zu bewahrende Testartefakte. Kein pauschales Clean-Verdikt dafür.
5. Eigentümerentscheidung zu Lizenz, Datenschutz, CI-Risiko und Veröffentlichung
   bleibt erforderlich. Diese Karte schließt weder Master noch Release.
