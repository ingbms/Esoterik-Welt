# Recherche: Radiästhesie, Pendeln und Orakel

Dieser Ordner enthält die Wissens- und Quellenbasis für das Themenmodul (Master-Task ESOW-RAD-000, Kanban `t_0fe70b63`).

| Datei | Inhalt | Zielgruppe |
|---|---|---|
| [`00-quellenbasis-radiaesthesie-pendeln-orakel.md`](./00-quellenbasis-radiaesthesie-pendeln-orakel.md) | Vollständiges Dossier: Methode, 33 Quellen mit Prüfstatus, Befunde je Cluster, Claim-Quelle-Matrix, Glossar, Content-Outline mit Wortbudgets, Falsifikationstests, Lücken, Übergabehinweise | Redaktion, UX, Entwicklung, QA |
| [`quellen.json`](./quellen.json) | Maschinenlesbare Quellenliste (IDs `Q01`–`Q33`) mit `verified`-Feld, Evidenzklassen, Interessenvermerken, Abdeckungslücken | Automatisierung, Prüfwerkzeuge |

## Kernaussagen in einem Satz

Die historische und kulturelle Überlieferung von Rute, Pendel und Orakel ist gut belegbar; die behauptete *Wirkung* von Radiästhesie und Pendeln ist es nicht – kontrollierte Tests zeigen keine über den Zufall hinausgehende Trefferquote, und die beobachteten Instrumentbewegungen sind über ideomotorische Effekte erklärt. Orakel wiederum sind als Zeichen- und Deutungspraxis dokumentiert, nicht als Prognoseinstrument.

## Regel für die Weiterarbeit

`quellen.json` ist die Single Source of Truth. Neue Quellen bekommen die nächste freie ID; das Feld `verified` sagt, **wie** geprüft wurde (`crossref`, `page_loaded`, `library_record`, `secondary_isbn`) – nicht bloß „true“. Jede neue Kernaussage gehört zusätzlich in die Claim-Quelle-Matrix (Abschnitt 4 des Dossiers).

Stand: 2. November 2026.
