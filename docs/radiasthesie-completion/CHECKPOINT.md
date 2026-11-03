# CHECKPOINT — ESOW-RAD Gesamtstand (Übergabe)

| Feld | Wert |
| --- | --- |
| Vorhaben | ESOW-RAD-000 · Radiästhesie, Pendeln und Orakel (14 Pakete) |
| Master | `t_878c59c7` |
| Arbeitsbaum | `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul` |
| Bezugsstand | `5fe5301` |
| Abnahmestand | `9bf5f73` (unabhängige Abnahme `t_29535d62`) |
| Stand | 3. November 2026 |
| Freigabe | **nicht erteilt** — siehe `RELEASE-CANDIDATE.md` |
| Push / Deployment | keiner; `main` unberührt |

## 1. Wo der Stand dokumentiert ist

- **Übergabe vollständig:** `RAD-14/README.md` (Index), `ARCHITEKTUR.md`, `SEITEN.md`, `DATENMODELL.md`, `QUELLENBIBLIOTHEK.md`, `MEDIEN-LIZENZEN.md`, vier `BEDIENUNG-*.md`, `TESTPROTOKOLLE.md`, `AENDERUNGEN.md`, `GRENZEN.md`, `AUSBAUSTUFEN.md`, `PAKETMATRIX.md`, `RAD-14/CHECKPOINT.md`.
- **Freigabeentscheidung:** `RELEASE-CANDIDATE.md`.
- **Paketnachweise:** `RAD-01/` … `RAD-13/` (Checkpoints, Berichte, Evidenz, Prüfskripte).
- **Redaktion und Konzept (außerhalb dieses Ordners):** `docs/radiasthesie-konzept/` (Inhalte, Quellenregister, Taxonomie, IA, Komponenten-Specs, Messung).

## 2. Stand der 14 Pakete (Kurzfassung)

| Pakete | Stand |
| --- | --- |
| RAD-01, 02, 03, 06, 07, 08, 09, 10, 11 | Pass (unabhängige Abnahme) |
| RAD-04 | Pass mit blockierendem F1 (WCAG 1.4.1, Link-Erkennbarkeit) |
| RAD-05 | Pass mit F2 (Foto-`sizes`) |
| RAD-12 | Pass mit offenem B7 (`og:image`) |
| RAD-13 | Abnahmelauf; Urteil **NICHT ABGENOMMEN** |
| RAD-14 | Übergabe geliefert; Abnahme nach F1-Nachtest offen |

Details, Evidenzlinks und Bedingungen: `RAD-14/PAKETMATRIX.md`.

## 3. Ausgeführte Prüfungen (RAD-14, Bezugsstand `5fe5301`)

| Prüfung | Ergebnis |
| --- | --- |
| 7 Node-Suiten | 164/164, 0 Fehler |
| `npm run build` | 7 Dokumente, Sitemap 11, `Lokal.html`, `dist/` |
| `npm run verify:build` | 36 Seiten/Viewports + 7 Dokumente, 0 Fehler |
| `CI=1 E2E_PORT=3455 npx playwright test` | 147/147 (2,1 min) |
| `npm run lint` | 0 Fehler (vor Erscheinen fremder Probenskripte) |
| Generator `build-uebersichten.cjs` | deterministisch, 66 Quellen / 6 Fotos / 4 SVGs |
| Markdown-Struktur | 68 Tabellen auf gleiche Spaltenzahl geprüft; **nicht** in einem Renderer dargestellt (kein Docs-Renderer im Projekt) |

Vollständige Befehle, Umgebung und Datei-Fingerabdrücke: `RAD-14/TESTPROTOKOLLE.md`.

## 4. Offene Risiken und Entscheidungen

1. **F1 blockiert die Abnahme** (P2, WCAG 1.4.1, 7/12 Ansichten); Korrektur in `t_b1641fc1`, uncommittet im Arbeitsbaum.
2. **F2** (Foto-`sizes`) und **F3** (`og:image`) offen; F3 bewusst, weil kein freigegebenes Rastermotiv existiert.
3. **Rechtlich:** keine `LICENSE`-Datei (R-1) und die Datenschutzerklärung nennt die lokalen Speicher nicht (R-7) — Eigentümerentscheidungen.
4. **Betrieb:** CI ruft die Radiästhesie-Suiten nicht auf (T-1); kein Deployment.
5. **Nicht gemessen:** Firefox/Safari, Screenreader, Lighthouse, echter Druck, tatsächlich volle Speicherquota.
6. **Forschungsgrenzen** sind keine Mängel, sondern Eigenschaften: clientseitige Verblindung ist umgehbar, Fallzahlen sind didaktisch (`RAD-14/GRENZEN.md` §1).

## 5. Nächster Schritt

1. `t_b1641fc1` abschließen und die Nachabnahme durch `tester` durchführen lassen.
2. Danach `RAD-14/TESTPROTOKOLLE.md` (§2, §6) und `RAD-14/PAKETMATRIX.md` auf den neuen Commit nachziehen.
3. Master `t_878c59c7` erst nach belegter DoD aller 14 Pakete schließen.
4. Veröffentlichung nur als ausdrückliche Eigentümerentscheidung; aus dieser Dokumentation folgt kein Recht dazu.
