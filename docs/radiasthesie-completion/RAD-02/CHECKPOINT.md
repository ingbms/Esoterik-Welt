# CHECKPOINT — ESOW-RAD-02 (Delta)

Karte: `t_54bbde93` · Master: `t_878c59c7`
Arbeitsbaum: `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`
Branch: `feature/radiasthesie-modul` · Basis-Commit: `e44fa5c54c80cb39383fa4177aa587236dc87596`
Stand: **2026-11-03, 00:45 CET** · Status: **abgeschlossen, 16/16 Prüfungen bestanden**

---

## 1. Stand

Die vorhandene Quellenbibliothek (33 Quellen, Q01-Q33) wurde nicht neu erstellt, sondern gezielt ergänzt:
**33 neue Quellen (Q34-Q66)**, **30 Claims (C01-C30)** mit Quelle, Locator und wörtlichem Zitat,
**6 Korrekturen (K01-K06)** am Bestand, **8 offene Lücken**. Das Delta ist maschinenlesbar (`quellen-delta.json`, `quellen-delta.csv`)
und lesbar (`QUELLEN-DELTA.md`, `CLAIM-QUELLE-MATRIX.md`) vorhanden; RAD-06 integriert es.

Geschrieben wurde ausschließlich `docs/radiasthesie-completion/RAD-02/`. Keine Produktionsdatei, kein Branch-Wechsel,
kein Commit, kein Push, kein Deployment. Der kanonische Arbeitsbaum wurde nicht verändert.

## 2. Dateien und SHA-256

| Datei | Bytes | SHA-256 (gekürzt) |
| --- | --- | --- |
| `quellen-delta.json` | 79.085 | `99081f6b4860a062` |
| `quellen-delta.csv` | 12.815 | `9ce88978b6717272` |
| `QUELLEN-DELTA.md` | 13.424 | `b54fcaeda62f27db` |
| `CLAIM-QUELLE-MATRIX.md` | 25.609 | `2d9a2b59f759ca69` |
| `KORREKTUREN.md` | 3.946 | `6d31d75dd92a258d` |
| `RETRIEVAL-BELEGE.md` | 12.724 | `17267fa9544af58c` |
| `README.md` | 5.781 | `2fe6fd02c47bcf1f` |
| `scripts/build_delta.py` | 7.866 | `12394376e1972edd` |
| `scripts/check_links.py` | 1.081 | `edc1ffad6a6374f0` |
| `scripts/verify_delta.py` | 5.571 | `b83e8031201b98d1` |
| `scripts/parts/*.json` (7 Dateien) | — | siehe `SHA256SUMS.txt` |

Vollständige Liste: `SHA256SUMS.txt` (enthält `CHECKPOINT.md` nicht, um Selbstreferenz zu vermeiden).

## 3. Ausgeführte Tests (real, mit Exitcode)

```bash
cd C:/Users/mas/Arbeit/esow-rad-t_878c59c7
export TMPDIR="C:/Users/mas/AppData/Local/hermes/cache/scratch"
python docs/radiasthesie-completion/RAD-02/scripts/build_delta.py   # Exit 0
python docs/radiasthesie-completion/RAD-02/scripts/verify_delta.py  # Exit 0
python docs/radiasthesie-completion/RAD-02/scripts/check_links.py   # Exit 0 (Ergebnisse in scripts/parts/http-check.json)
```

`build_delta.py` prüft beim Bauen: ID-Fortlauf Q34-Q66, Claim-Fortlauf C01-C30, Pflichtfelder, bekannte Verifikationsniveaus,
Locator-URLs, Claim→Quellen-Referenzen, Zitatlänge, **Unverändertheit der Bestandsbibliothek** (exakt 33 Quellen Q01-Q33).

`verify_delta.py` (16 Prüfungen, alle bestanden):

| Test | Inhalt | Ergebnis |
| --- | --- | --- |
| T1 | JSON-Struktur vollständig | OK |
| T2 | Quellen-IDs exakt Q34-Q66 (33) | OK |
| T3 | Claim-IDs exakt C01-C30 (30) | OK |
| T4 | Jeder Claim: Quelle + Locator + Zitat ≥15 Zeichen | OK |
| T5 | Verifikationsniveaus definiert | OK |
| T6 | Zählwerte konsistent (66 gesamt, 25/2/3) | OK |
| T7 | CSV 34 Zeilen × 13 Spalten | OK |
| T8 | Claim-Matrix enthält alle 30 Claims | OK |
| T9 | Quellen-Delta enthält alle 33 Quellen | OK |
| T10 | Bestandsbibliothek unverändert (33, Q01-Q33; SHA `c09cbcf6…`) | OK |
| T11 | Keine ID-Überschneidung Bestand/Delta | OK |
| T12 | Pflichtfelder je Quelle | OK |
| T13 | Alle Locators http(s) | OK |
| T14 | Interessenvermerk je Quelle | OK |
| T15 | Keine neuen Dateien in Produktions-/Konzeptpfaden | OK |
| T16 | Delta als neue Dateigruppe sichtbar | OK |

Linkprüfung (`check_links.py`): 24 Locators HTTP 200; 7 Locators HTTP 403 (Publisher-Bot-Schutz, DOI jeweils HTTP 302);
1 Locator HTTP 406 nur mit Standard-User-Agent (mit Browser-UA 200). Zwei fehlerhafte Locators (Q59 konstruierter DOI 404,
Q60 ohne URL) wurden **vor** Abschluss korrigiert und erneut geprüft.

## 4. Inhaltliche Kurzbilanz

- **Historisch**: Agricola 1556 (erste gedruckte Beschreibung, bereits mechanische Erklärung), Ellis 1917 (USGS-Bilanz), Freiberg 18./19. Jh., Institutionalisierung 1926/1929/1933/1961.
- **Experimentell**: München 843 Tests / 43 aus 500 Rutengängern, doppelblind, 400.000 DM — positive Deutung (Betz) vs. Reanalyse (Enright), bis heute Streit; britische Militärtests zur Fernmutung (Foulkes 1971) negativ; Archäologie gemischt; Forensik negativ; Biotensor-Test 0/13.
- **Mechanismus**: Ideomotorik/Chevreul-Pendel und klassische Pendelmechanik erklären die Bewegung ohne angenommenes Feld; physikalische „dowsing field“-Behauptungen sind unrepliziert.
- **International**: Estland, Marokko, Palästina, Russland, USA, Frankreich, UK — je mit eigenem Interessen- und Datenqualitätsvermerk.

## 5. Restpunkte / Risiken

1. **Nicht beschafft**: Münchner Schlussbericht (Wagner/Betz/König 1990), Betz & König (1989), Enright 1995/1996 im Volltext, Betz et al. 1996 im Volltext. Die Aufbaudaten stützen sich auf die Reanalyse Q42.
2. **Nur über Q05 bekannt**: Walach & Schmidt (1997), Houtkooper & Vaitl (1997), Ertel (1991/1993).
3. **Keine unabhängige Replikation** der Positivbefunde (Q47) und der physikalischen Feldbehauptungen (Q49/Q50) gefunden — Suche auf OpenAlex/Crossref beschränkt.
4. **ASD-Gründung 1961** nur tertiär belegt (Q66), ASD-Website blockierte den Abruf.
5. **NS-Zeit 1933-1945** nicht mit neuer Primärquelle abgedeckt; Q15 bleibt Referenz.
6. **Sprachgrenzen**: arabische/russische Abstracts sinngemäß übersetzt (als eigene Übersetzung markiert); keine systematische Suche in Spanisch/Portugiesisch/Afrika außer Marokko.
7. **Q47** (20/20-Positivbefund) ist bewusst als `niedrig` konfident geführt; eine Verwendung als Wirkbeleg wäre unzulässig.

## 6. Nächster Schritt

**RAD-06 (Integration)**: Q34-Q66 in `docs/radiasthesie-konzept/recherche/quellen.json` aufnehmen, K01-K06 anwenden,
Claims C01-C30 in die Claim-Quelle-Matrix des Moduls übernehmen und `unbelegt` sichtbar kennzeichnen.
**RAD-07/QA**: stichprobenartige Gegenprüfung von fünf Claims (C01, C05, C07, C12, C20) gegen die in `RETRIEVAL-BELEGE.md`
genannten Primär-URLs; dabei besonders prüfen, ob Q42-Zahlen (843/104/43/500) mit dem Schlussbericht 1990 übereinstimmen,
falls dieser per Fernleihe beschafft wird.
