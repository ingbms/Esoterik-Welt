# CHECKPOINT — ESOW-RAD Gesamtstand (Übergabe)

| Feld | Wert |
| --- | --- |
| Vorhaben | ESOW-RAD-000 · Radiästhesie, Pendeln und Orakel (14 Pakete) |
| Master | `t_878c59c7` |
| Arbeitsbaum | `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul` |
| Bezugsstand | `ceddc84cfca44d53f1995dfd0981b7d70a554724` |
| Abnahmestand | Vollumfang `9bf5f73`; gezielter F1/F2-Review auf `ceddc84`, unabhängig freigegeben |
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
| RAD-04 | Pass; F1 danach unabhängig bestätigt behoben |
| RAD-05 | Pass; F2 danach unabhängig bestätigt behoben |
| RAD-12 | Pass mit offenem B7 (`og:image`) |
| RAD-13 | historisches negatives Vollumfangsverdikt; ergänzend F1/F2 gezielt freigegeben auf `ceddc84` |
| RAD-14 | Übergabe aktualisiert, Nachtest belegt; abschließende Master-DoD ausstehend |

Details, Evidenzlinks und Bedingungen: `RAD-14/PAKETMATRIX.md`.

## 3. Ausgeführte Prüfungen

**Aktuell auf `ceddc84cfca44d53f1995dfd0981b7d70a554724`:** Lint/Format/Build,
verify:build 36/36 + 7/7, 167 Modultests bestanden. Vollständiger `test:all`-
Nachlauf: Jest 2/2, Node 242/242, Playwright 147/147. Erster Gesamtlauf mit
Tarot-Fokus-Timeout bleibt offengelegt, Folgekarte `t_73ccd862`.
Unabhängig bestätigt: F1/F2 freigegeben, 32 axe-Läufe und 60 Bildläufe ohne
entsprechenden Befund. [Nachabnahme mit Rohlogs](RAD-14/NACHABNAHME.md).

Historischer Erstlauf auf `5fe5301` (nicht auf den Kandidaten umetikettiert):

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

1. **F1/F2 sind unabhängig bestätigt behoben**; gezielter Review auf dem Kandidaten,
   keine pauschale Gesamtfreigabe daraus abgeleitet.
2. **F3/B7** (`og:image`) und **F4** (Kontrast „incomplete“) sowie frühere
   Nicht-F1/F2-Restpunkte bleiben offen.
3. **Rechtlich:** keine `LICENSE`-Datei (R-1) und die Datenschutzerklärung nennt die lokalen Speicher nicht (R-7) — Eigentümerentscheidungen.
4. **Betrieb:** CI ruft die Radiästhesie-Suiten nicht auf (T-1); kein Deployment.
5. **Nicht gemessen:** Firefox/Safari, Screenreader, Lighthouse, echter Druck, tatsächlich volle Speicherquota.
6. **Forschungsgrenzen** sind keine Mängel, sondern Eigenschaften: clientseitige Verblindung ist umgehbar, Fallzahlen sind didaktisch (`RAD-14/GRENZEN.md` §1).

## 5. Nächster Schritt

1. Die Übergabe ist auf den unabhängig nachgeprüften Kandidaten aktualisiert;
   [Paketmatrix](RAD-14/PAKETMATRIX.md), [Fingerabdrücke](RAD-14/SHA256SUMS.txt)
   und [Review](RAD-14/evidence/REVIEW-F1-F2.md) liegen vor.
2. Bestehender Master `t_878c59c7` entscheidet die finale DoD aller 14 Pakete;
   kein separates unabhängiges RAD-14-Inhaltsverdikt wird behauptet.
3. Folgekarte `t_73ccd862` untersucht den sporadischen Tarot-Fokus-Timeout.
4. Gemeinsame PDF/PNG-Testartefakte und unversioniertes `evidence/` bleiben
   unbereinigt erhalten. Tests können selbst diese Änderungen erzeugen;
   ein sauberer Reviewer-Checkout ist nicht dasselbe wie ein sauberer gemeinsamer Baum.
5. Veröffentlichung nur nach ausdrücklicher Eigentümerentscheidung; aus der
   Dokumentation folgt kein Push-/Deployment-Recht.
