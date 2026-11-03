# Paketmatrix — 14 Pakete mit Evidenz und Reviewer-Verdikt

**Bezugsstand:** `5fe5301` · **Prüfgrundlage:** unabhängige Abnahme `t_29535d62` auf `9bf5f73`
Bericht: `docs/radiasthesie-completion/RAD-13/TESTBERICHT.md` · Checkpoint: `docs/radiasthesie-completion/RAD-13/CHECKPOINT.md` · Evidenz: `docs/radiasthesie-completion/RAD-13/evidence/`

## 1. Lesart

- **Stand** ist die Paketbewertung aus der unabhängigen Abnahme (RAD-13), nicht
  eine Selbstbewertung. „Pass mit F1“ heißt: das Paket ist inhaltlich erfüllt,
  aber ein offener Befund verhindert die Gesamtabnahme.
- **Verdikt** ist das Urteil des Reviewers über den Gesamtstand: **NICHT
  ABGENOMMEN**. Es gilt für alle 14 Zeilen gemeinsam; ein „Pass“ in einer Zeile
  ist keine Teilfreigabe.
- RAD-14 war zum Zeitpunkt der Abnahme ausstehend („offen/ausstehend“). Diese
  Dokumentation füllt das Paket inhaltlich; die Abnahme selbst bleibt offen,
  solange F1 nicht behoben und nachgetestet ist.

## 2. Matrix

| Nr. | Paket | Kernartefakt | Evidenz | Stand (RAD-13) | Offen |
| --- | --- | --- | --- | --- | --- |
| 01 | Bestandsaufnahme und Architektur | `RAD-01/` mit Ist/Soll-Matrix, Integrationspunkten, Komponentengrenzen | `RAD-01/README.md`, `RAD-01/MATRIX-14-PAKETE.md`, `RAD-01/NACHWEIS-WORKTREE.md` | **Pass** | – |
| 02 | Fachrecherche und Quellenbibliothek | 66 Quellen mit Prüftiefe, Interessenvermerk, Claim-Matrix | `RAD-02/CHECKPOINT.md`, `RAD-02/CLAIM-QUELLE-MATRIX.md`, `RAD-02/quellen-delta.json`, `RAD-02/SHA256SUMS.txt` | **Pass** | externe Erreichbarkeit nicht neu geprüft |
| 03 | Taxonomie und Datenmodell | 7 Entitätstypen, Verträge, Generator-Validierung | `RAD-03/CHECKPOINT.md`, `RAD-03/VERTRAEGE.md`, `tests/radiasthesie-vertraege.mjs` | **Pass** | Taxonomie wird mitgeladen (~93 kB) |
| 04 | UX/UI-Design | gemessenes Mockup, 22 Zustände, Tastatur, Druck, Tokens | `RAD-04/MESSUNG.md`, `RAD-04/WERKZEUGE-UND-ZUSTAENDE.md`, `RAD-04/messung/kontrast.json` | **Pass mit F1** | **F1 blockierend** (Link-Erkennbarkeit), A-2/F4, R-7 |
| 05 | Bildbibliothek und Lizenzen | 6 Fotos, 24 Varianten, Manifest, Attributionsseite | `RAD-05/CHECKPOINT.md`, `assets/radiasthesie/media/media-manifest.json`, `RAD-05/CHECKSUMMEN.sha256` | **Pass mit F2** | F2 (`sizes`), R-1/R-3 |
| 06 | Redaktionelle Themenseiten | 3 Themen, 32 Kapitel, 6 346 Wörter, Fotos eingebunden | `RAD-06/CHECKPOINT.md`, `RAD-06/INHALT-QUELLEN-BILD-MATRIX.md`, `RAD-06/matrix.json` | **Pass** | Orakel-Cluster dünn (R-6) |
| 07 | Interaktiver Pendelsimulator | `#pendeln/labor`, nichtlineares Modell, 21+11 Tests | `RAD-07/CHECKPOINT.md`, `RAD-07/MODELL.md`, `tests/radiasthesie-simulator.mjs` | **Pass** | kein Screenreader, kein Firefox |
| 08 | Pendeltafel-Studio | `#pendeln/studio`, 6 Vorlagen, SVG/JSON/Druck, 37+17 Tests | `RAD-08/CHECKPOINT.md`, `RAD-08/EXPORTE.md`, `RAD-08/evidence/pendeltafel-studio-druck.pdf` | **Pass** | interaktiver Druckdialog nicht bedient |
| 09 | Verblindetes Experimentierlabor | `#pendeln/experiment`, Commitment, exakte Statistik, 24+7 Tests | `RAD-09/CHECKPOINT.md`, `tests/experiment-statistik.mjs` | **Pass** | clientseitige Verblindung (F-1), Quota nur simuliert |
| 10 | Pendeltagebuch | `#pendeln/journal`, Felder, Export/Import, Löschung, 26+10 Tests | `RAD-10/CHECKPOINT.md`, `tests/journal-speicher.mjs` | **Pass** | unverschlüsselt (S-1), kein Tab-Sync (S-2) |
| 11 | Integration mit verwandten Themen | 9 Vernetzungseinträge, 7 Links, 2 Lücken, Frequenzkapitel | `RAD-11/CHECKPOINT.md`, `RAD-11/INTEGRATION.md`, `RAD-11/evidence/browser/` | **Pass** | Geomantie/Kraftorte offen, Farbwelten-Merge offen |
| 12 | SEO, GEO, strukturierte Daten | 7 statische Dokumente, Sitemap, Canonical, BreadcrumbList | `RAD-12/CHECKPOINT.md`, `RAD-12/ENTSCHEIDUNGEN.md`, `tests/radiasthesie-statisch.mjs` | **Pass mit offenem B7** | `og:image` fehlt (F3/B7) |
| 13 | Qualitätskontrolle | unabhängige Abnahme mit 21 Gate-Logs, 6 JSON-Sonden, Prüfskripten | `RAD-13/TESTBERICHT.md`, `RAD-13/evidence/`, `RAD-13/scripts/` | **dieser Lauf** | Urteil **NICHT ABGENOMMEN** |
| 14 | Dokumentation und Übergabe | diese Sammlung: Architektur, Seiten, Datenmodell, Quellen, Medien, 4 Anleitungen, Protokolle, Änderungen, Grenzen, Ausbaustufen | `RAD-14/` (15 Markdown-Dateien + 1 Generator), `../RELEASE-CANDIDATE.md`, `../CHECKPOINT.md` | **offen/ausstehend** (RAD-13); inhaltlich geliefert | Abnahme nach F1-Nachtest |

## 3. Verdikt im Wortlaut

> **NICHT ABGENOMMEN**
>
> Blockierend: F1 (P2) — axe-core 4.14.0 meldet `link-in-text-block` (WCAG 1.4.1)
> in 7 von 12 Ansichten; Korrekturkarte `t_b1641fc1`.
> Dazu F2 (P3, Foto-`sizes`) und F3 (P3, `og:image` fehlt).

Quelle: `RAD-13/TESTBERICHT.md` bzw. Handoff der Karte `t_29535d62`
(abgeschlossen mit `verdict: "NICHT ABGENOMMEN"`).

Grün belegt sind in derselben Abnahme: Build/Lint/Format, 249 Node-Tests,
147/147 Playwright, `verify:build` 36/36 + 7/7, 80 Breiten-Läufe ohne Überlauf,
0 Konsolen-/Netzfehler, 0 externe Requests, 604 interne Links ohne totes Ziel,
Statistik gegen unabhängige BigInt-Referenz (max. 2,0e-15), Journal-XSS,
Studio-Import, SVG-Export, Löschung und reduzierte Bewegung.

## 4. Was „Pass“ hier nicht bedeutet

1. **Keine Freigabe.** Das Gesamturteil ist negativ; einzelne „Pass“-Zeilen sind
   Zwischenstände.
2. **Keine Wiederholung der Tests.** RAD-14 hat 164 Node-Tests und 147
   Browsertests auf `5fe5301` erneut ausgeführt (§2 in `TESTPROTOKOLLE.md`), aber
   die axe-Prüfung und die 80 Breitenläufe nicht wiederholt.
3. **Keine Aussage über RAD-14-Inhalt durch den Reviewer.** Die Übergabe wurde
   nach dem Abnahmelauf erstellt; sie ist noch nicht gegengelesen.
4. **Keine Aussage zu Firefox, Safari, Screenreader, Lighthouse oder Druck** —
   diese Prüfungen fehlen projektweit (`GRENZEN.md` §3–§4).

## 5. Bedingungen für ein positives Verdikt

1. F1 behoben (Links im Fließtext zusätzlich zur Farbe erkennbar) und per
   axe-Lauf über die 12 Ansichten ohne `link-in-text-block` belegt.
2. F2 behoben (`sizes` an die gemessene Layoutbreite angepasst, Bildmessung
   wiederholt).
3. Regression: `CI=1 npx playwright test` 147/147, `npm run test:all` grün,
   Arbeitsbaum sauber.
4. Nachabnahme durch `tester` auf dem neuen Commit; danach Aktualisierung von
   `TESTPROTOKOLLE.md` §2/§6 und dieser Matrix.
5. Erst dann darf der Master `t_878c59c7` geschlossen werden; Veröffentlichung
   bleibt eine separate Eigentümerentscheidung.
