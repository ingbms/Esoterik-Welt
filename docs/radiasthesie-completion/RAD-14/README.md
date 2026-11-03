# ESOW-RAD-14 — Dokumentation und Übergabe

**Projekt:** Esoterik Welt · Themenmodul Radiästhesie, Pendeln und Orakel
**Master:** `t_878c59c7` / ESOW-RAD-000 · **Paket:** RAD-14 (Dokumentation und Übergabe)
**Arbeitsbaum:** `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul`
**Datenstand dieser Dokumentation:** Commit `5fe5301` (`docs(radiasthesie): unabhaengige Abnahme RAD-13 — Bericht, Checkpoint und Evidenz`)
**Freigabestatus:** **nicht freigegeben** — siehe `../RELEASE-CANDIDATE.md`. Die unabhängige Abnahme von RAD-01…12 endete mit **NICHT ABGENOMMEN** (Befund F1, Korrekturkarte `t_b1641fc1`).

## 1. Was hier steht

Diese Sammlung führt den Projektstand zusammen: Architektur, Seiten, Datenmodell,
Quellen, Medien und Lizenzen, Bedienung der vier interaktiven Werkzeuge,
Testprotokolle, Änderungen, Grenzen, Ausbaustufen und die Paketmatrix.

| Datei | Inhalt | Originalanforderung RAD-14 |
| --- | --- | --- |
| `ARCHITEKTUR.md` | Schichten, Datenfluss, Build, Router, Module, Grenzen | Architekturübersicht |
| `SEITEN.md` | sieben statische Dokumente, Modulrouten, Kapitelstruktur | Übersicht der neuen Seiten |
| `DATENMODELL.md` | Datenmodell, Taxonomie, Verträge, Speicher, Exportformate | Content- und Datenmodelldokumentation |
| `QUELLENBIBLIOTHEK.md` | 66 Quellen, Prüftiefen, Stufen, was nicht belegt ist (erzeugt) | Quellenbibliothek |
| `MEDIEN-LIZENZEN.md` | 6 Fotos, 4 eigene SVGs, Lizenzregel, offene Punkte (erzeugt) | Medien- und Lizenzverzeichnis |
| `BEDIENUNG-PENDELLABOR.md` | Bedienungsanleitung `#pendeln/labor` | Bedienungsanleitungen für interaktive Module |
| `BEDIENUNG-TAFEL-STUDIO.md` | Bedienungsanleitung `#pendeln/studio` | dito |
| `BEDIENUNG-EXPERIMENTIERLABOR.md` | Bedienungsanleitung `#pendeln/experiment` | dito |
| `BEDIENUNG-PENDELTAGEBUCH.md` | Bedienungsanleitung `#pendeln/journal` | dito |
| `TESTPROTOKOLLE.md` | Befehle, Ergebnisse, Umgebung, exakte SHAs, was fehlt | Testprotokolle |
| `AENDERUNGEN.md` | 28 Commits, Dateigruppen, Was sich für Nutzer ändert | Änderungsübersicht |
| `GRENZEN.md` | Verblindung, Speicher, Forschung, Browser, Barrierefreiheit, Betrieb | bekannte Einschränkungen |
| `AUSBAUSTUFEN.md` | Vorschläge mit Aufwand und Risiko | Vorschläge für weitere Ausbaustufen |
| `PAKETMATRIX.md` | 14 Zeilen, Evidenzlinks, Reviewer-Verdikt | Paketmatrix |
| `scripts/build-uebersichten.cjs` | erzeugt `QUELLENBIBLIOTHEK.md` und `MEDIEN-LIZENZEN.md` aus den Daten | Reproduzierbarkeit |
| `../RELEASE-CANDIDATE.md` | Freigabekandidat mit Bedingungen und Verdict | Übergabe |
| `../CHECKPOINT.md` | Stand, Dateien, SHA, Tests, Restpunkte, nächster Schritt | Checkpoint |

## 2. Was diese Dokumentation nicht ist

- **Keine Freigabe.** Aus der Existenz dieser Dateien folgt kein Veröffentlichungs-,
  Push- oder Deployment-Recht. Der Branch ist nicht gepusht, `main` unberührt.
- **Keine Abnahme.** Die Paketmatrix nennt den Stand der unabhängigen Prüfung,
  nicht eine Selbstbewertung. Wo ein Befund offen ist, steht er als offen.
- **Keine zweite Quelle der Wahrheit.** Quellen- und Medienverzeichnis sind aus
  den Daten erzeugt; Redaktionsquelle bleibt
  `docs/radiasthesie-konzept/` (Inhalte, `recherche/quellen.json`,
  `daten/taxonomie.json`) und `assets/radiasthesie/media/media-manifest.json`.
- **Keine Messung ohne Lauf.** Alle Zahlen in `TESTPROTOKOLLE.md` stammen aus
  Läufen, die in dieser Sitzung auf `5fe5301` ausgeführt wurden; was nicht
  gelaufen ist, steht als „nicht ausgeführt“ dort.

## 3. Lesereihenfolge

1. `../RELEASE-CANDIDATE.md` — darf das raus? (Antwort: derzeit nein, und warum)
2. `PAKETMATRIX.md` — welches Paket steht worauf
3. `GRENZEN.md` — was das Modul bewusst nicht kann
4. `ARCHITEKTUR.md` und `DATENMODELL.md` — wie es gebaut ist
5. `SEITEN.md` und die vier Bedienungsanleitungen — was Nutzer sehen
6. `TESTPROTOKOLLE.md` und `AENDERUNGEN.md` — was geprüft und was geändert wurde
