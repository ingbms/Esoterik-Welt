# RAD-06 — Redaktionelle Themenseiten (Delta)

Diese Karte hat die drei vorhandenen Themenseiten erweitert, die Quellenbasis von
33 auf 66 Einträge gezogen und die sechs Fotos aus RAD-05 eingebunden. Sie hat
**nicht** neu geschrieben, was schon da war, und **nicht** getan, was RAD-12
gehört.

## Ergebnis in Zahlen (aus dem Generator, nicht geschätzt)

- 3 Themen, **31 Kapitel** (vorher 30; neu: `befunde` auf der Radiästhesie-Seite)
- **66 Quellen** (33 Bestand + 33 Delta), 17 Glossarbegriffe (vorher 13)
- **6 Fotos** + 4 eigene Zeichnungen, je mit Alt-Text, Maßen und Attribution
- 6.140 Wörter Fließtext: Radiästhesie 2.928 · Pendeln 2.170 · Orakel 1.042
- 13 offene Fragen im Einstiegstext (vorher 6)

## Dateien in diesem Ordner

| Datei | Inhalt |
|---|---|
| `CHECKPOINT.md` | Stand, Dateien mit SHA-256, Tests, Entscheidungen, Restpunkte, nächster Schritt |
| `INHALT-QUELLEN-BILD-MATRIX.md` | generierte Matrizen: Auftragsfragen → Kapitel, C01–C30 → Kapitel, Fotos → Einsatzort, interne Links |
| `matrix.json` | dieselben Daten maschinenlesbar |
| `HANDOFF-RAD-12.md` | gemessener Ist-Zustand der statischen Ausgabe und der Vertrag für RAD-12 |
| `quellen-merge-report.json` | Protokoll des Quellenzusammenführens (unveränderte Bestandseinträge, Korrekturen K03/K04, Stufen-Abbildungen) |
| `scripts/merge_quellen_delta.cjs` | reproduzierbares Zusammenführen von `quellen.json` und RAD-02-Delta |
| `scripts/verify_rad06.cjs` | 211 Prüfungen über Datensatz, Quellen, Aussagen, Bilder, Links, Kerntext |
| `scripts/check_bestand.cjs` | Satzvergleich gegen die Vorfassung: 185 von 203 Sätzen wortgleich, 18 begründete Abweichungen |
| `CHECKSUMMEN.sha256` | Prüfsummen der gelieferten Dateien |

## Reproduktion

```
node docs/radiasthesie-completion/RAD-06/scripts/merge_quellen_delta.cjs   # nur einmalig, idempotent nicht
node scripts/generate-radiasthesie-data.cjs
node docs/radiasthesie-completion/RAD-06/scripts/verify_rad06.cjs
node --test tests/radiasthesie.mjs tests/radiasthesie-vertraege.mjs
```

`merge_quellen_delta.cjs` erwartet den Ausgangsstand (33 Quellen). Nach dem
Zusammenführen ist er nicht erneut ausführbar — das ist Absicht: Er prüft die
Bestandseinträge gegen den damaligen Schnappschuss.
