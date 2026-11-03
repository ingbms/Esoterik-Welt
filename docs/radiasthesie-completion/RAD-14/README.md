# ESOW-RAD-14 — Dokumentation und Übergabe

**Projekt:** Esoterik Welt · Themenmodul Radiästhesie, Pendeln und Orakel
**Master:** `t_878c59c7` / ESOW-RAD-000 · **Paket:** RAD-14 (Dokumentation und Übergabe)
**Arbeitsbaum:** `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul`
**Datenstand dieser Dokumentation:** Kandidat `ceddc84cfca44d53f1995dfd0981b7d70a554724`; Erstübergabe `1f78942`.
**Status:** F1/F2 unabhängig bestätigt behoben; Übergabe aktualisiert. Kein Gesamt- oder Veröffentlichungsrecht. Siehe [Nachabnahme](NACHABNAHME.md) und [Release-Kandidat](../RELEASE-CANDIDATE.md).

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
| `AENDERUNGEN.md` | Kandidatenumfang (31 Commits), historische Detailgruppen und aktuelles F1/F2-Delta | Änderungsübersicht |
| `GRENZEN.md` | Verblindung, Speicher, Forschung, Browser, Barrierefreiheit, Betrieb | bekannte Einschränkungen |
| `AUSBAUSTUFEN.md` | Vorschläge mit Aufwand und Risiko | Vorschläge für weitere Ausbaustufen |
| `PAKETMATRIX.md` | 14 Zeilen, Evidenzlinks, Reviewer-Verdikt | Paketmatrix |
| `scripts/build-uebersichten.cjs` | erzeugt `QUELLENBIBLIOTHEK.md` und `MEDIEN-LIZENZEN.md` aus den Daten | Reproduzierbarkeit |
| `../RELEASE-CANDIDATE.md` | Freigabekandidat mit Bedingungen und Verdict | Übergabe |
| [NACHABNAHME.md](NACHABNAHME.md) | aktueller F1/F2-Review, erneute Tests, Rohlogs, Reproduktion, Provenienz | Abschlussdelta |
| [SHA256SUMS.txt](SHA256SUMS.txt) | Fingerabdrücke der aktuellen Übergabedateien | Integrität |
| [scripts/verify-handoff.py](scripts/verify-handoff.py) | Matrix, Tabellen, lokale Verweise, Hashes und ZIP prüfen | Validierung |
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
- **Keine Messung ohne Lauf.** Historischer RAD-14-Erstlauf auf `5fe5301`,
  unabhängige Nachabnahme und erneute Autorenläufe auf `ceddc84` sind getrennt
  zugeordnet. Auch der erste fehlgeschlagene `test:all`-Versuch bleibt sichtbar.
  Aktuelle Rohlogs: [NACHABNAHME.md](NACHABNAHME.md).

## 3. Lesereihenfolge

1. `../RELEASE-CANDIDATE.md` — darf das raus? (Antwort: derzeit nein, und warum)
2. `PAKETMATRIX.md` — welches Paket steht worauf
3. `GRENZEN.md` — was das Modul bewusst nicht kann
4. `ARCHITEKTUR.md` und `DATENMODELL.md` — wie es gebaut ist
5. `SEITEN.md` und die vier Bedienungsanleitungen — was Nutzer sehen
6. `TESTPROTOKOLLE.md` und `AENDERUNGEN.md` — was geprüft und was geändert wurde
