# ESOW-RAD-02 — Quellenbibliothek, Delta-Lauf

Karte: `t_54bbde93` · Master: `t_878c59c7` / ESOW-RAD-000 · Vorgänger: `t_0fe70b63`
Arbeitsbaum: `C:/Users/mas/Arbeit/esow-rad-t_878c59c7` · Branch `feature/radiasthesie-modul` · Basis `e44fa5c`
Stand: 3. November 2026 · Status: **Delta vollständig geliefert; 33 neue Quellen, 30 Claims, 6 Korrekturen**

## 1. Was dieser Lauf ist — und was nicht

Dies ist die **Fortsetzung** der Quellenarbeit aus `t_0fe70b63`, kein Neustart. Die 33 vorhandenen
Quellen (Q01-Q33) und ihre Q-IDs bleiben unverändert; geprüft wurde nur, wo echte Lücken bestanden.
Das Ergebnis ist ein **Delta**, das RAD-06 in die Gesamtbibliothek integriert — keine neue Parallelbibliothek.

Nicht getan: keine Produktionsdateien geändert, keine Themenseiten umgeschrieben, kein Commit, kein Push,
kein Deployment. Geschrieben wurde ausschließlich `docs/radiasthesie-completion/RAD-02/`.
Der kanonische Arbeitsbaum (`C:/Users/mas/Arbeit/Esoterik-Welt`) wurde nicht angefasst.

## 2. Abnahmekriterien und ihr Nachweis

| Kriterium (Delta-Auftrag) | Nachweis |
| --- | --- |
| 33 vorhandene Quellen und Q-IDs erhalten | `scripts/build_delta.py` bricht ab, wenn die Bestandsdatei nicht exakt Q01-Q33 mit 33 Einträgen enthält; Delta beginnt bei Q34 |
| Nur echte Lücken recherchiert | `coverage_map` in `quellen-delta.json`; `gaps_remaining` benennt, was offen bleibt |
| Vier Original-Startquellen vollständig berücksichtigt (bes. Gesellschaft für Anomalistik) | `RETRIEVAL-BELEGE.md` §1; GfA-Seite im Volltext gelesen, Autorschaft/Datum korrigiert (K01) |
| Primärtext- und Metadatenprüfung getrennt | `verified` je Quelle: `full_text`, `full_text_partial`, `abstract`, `metadata_*`, `library_record`, `page_loaded`; `access_note` sagt, was fehlt |
| Claims, Interessen, Datenqualität, Gegenpositionen ergänzt | `CLAIM-QUELLE-MATRIX.md` (30 Claims, je mit Gegenbefund); `interest_note`/`data_quality` je Quelle |
| Biotensoren, Fernmutung, internationale/historische Unterschiede, Experimentspezifik | Claims C07/C08 (Fernmutung), C11-C13 (Biotensor), C20-C27 (international), C04/C05/C07 (Experimentspezifik) |
| Nicht erreichbare Volltexte nicht als gelesen ausgegeben | `verified` + `access_note`; `RETRIEVAL-BELEGE.md` §4/§6 |
| Quellen-/Claim-Delta maschinenlesbar | `quellen-delta.json` (Schema 1.1-delta) und `quellen-delta.csv` |
| Keine erfundenen Fundstellen | Jeder Claim trägt Locator + wörtliches Zitat; Linkprüfung in §5 der Retrieval-Belege |

## 3. Dateien

| Datei | Inhalt |
| --- | --- |
| `quellen-delta.json` | Maschinenlesbare Fassung: 33 neue Quellen, 30 Claims, 6 Korrekturen, 8 offene Lücken, Coverage-Map, Zählwerte |
| `quellen-delta.csv` | Tabellenexport derselben Quellen (Semikolon, UTF-8) für Import/Review |
| `QUELLEN-DELTA.md` | Lesbare Quellentabelle mit Interessenvermerken und Datenqualitäts-Einschränkungen |
| `CLAIM-QUELLE-MATRIX.md` | 30 Claims mit Status, Quelle, Locator, wörtlichem Zitat und Gegenbefund |
| `KORREKTUREN.md` | Sechs Befunde am Bestand (Q01, Q02, Q05, Q30) mit Prüfweg und Empfehlung für RAD-06 |
| `RETRIEVAL-BELEGE.md` | Abrufprotokoll: HTTP-Status, API-Antworten, Volltextzitate, Grenzen |
| `CHECKPOINT.md` | Stand, Dateien, SHA-256, ausgeführte Tests, Restpunkte, nächster Schritt |
| `scripts/build_delta.py` | Baut JSON/CSV/MD aus den Teilen und prüft Struktur, ID-Fortlauf, Claim-Referenzen, Bestandsintegrität |
| `scripts/check_links.py` | Prüft alle Locators per HTTP und schreibt `scripts/parts/http-check.json` |
| `scripts/parts/*.json` | Quelldaten des Deltas (nachprüfbar, versionierbar) |

Reproduktion:

```bash
cd C:/Users/mas/Arbeit/esow-rad-t_878c59c7
export TMPDIR="C:/Users/mas/AppData/Local/hermes/cache/scratch"
python docs/radiasthesie-completion/RAD-02/scripts/build_delta.py
python docs/radiasthesie-completion/RAD-02/scripts/check_links.py
```

## 4. Ergebnis in Kürze

- **33 neue Quellen (Q34-Q66)**: 7 Publikationen mit Volltext (4 vollständig, 3 teilweise/OCR), 17 mit geprüftem Abstract, 3 nur über Metadaten (Q41, Q57, Q58), 2 nur katalogisiert (Q37, Q43), 4 Webseiten im Volltext (Q63-Q66).
- **30 Claims**: 25 belegt, 2 widersprüchlich, 3 unbelegt (Behauptungen, die ausdrücklich nicht als Tatsachen verwendet werden dürfen).
- **Zentrale Linie**: Die historische Kontroverse ist bis 1556 zurückverfolgbar (Agricola argumentiert bereits mechanisch); die aufwändigste Prüfung (München) wird bis heute gegensätzlich gedeutet; moderne Anwendungen (Biotensor, Fernmutung, Geopathie) haben keine belastbare Validierung, wohl aber dokumentierte Negativtests.
- **Neu erschlossen**: militärische Kartentests (Foulkes 1971), die Münchener Aufbaudaten und der statistische Streit (Enright 1999 vs. Betz 1996), die Biotensor-Praxis und ihr Negativtest (GWUP 2019), internationale Kontexte (Estland, Marokko, Palästina, Russland, USA, Frankreich, UK) sowie die Ideomotorik-Literatur zum Pendel.

## 5. Offene Punkte (bewusst nicht geglättet)

Siehe `gaps_remaining` in `quellen-delta.json`. Kurz: Münchner Schlussbericht und Betz & König (1989) nicht beschafft;
Walach & Schmidt (1997) und Houtkooper & Vaitl (1997) nur über Q05 bekannt; NS-Zeit nicht mit neuer Primärquelle abgedeckt;
keine unabhängige Replikation der Positivbefunde gefunden; ASD-Gründung nur tertiär belegt.

## 6. Was RAD-06 übernehmen muss

1. Q34-Q66 in `quellen.json` aufnehmen, `verified`/`access_note` unverändert.
2. K01-K06 anwenden (Autorschaft Q05, Dublette Q02, Jahr Q01, ISBN-Stufe Q30, Verlagsangabe Q43, Formulierung Kopfzeile).
3. Claims C01-C30 übernehmen, `unbelegt` nicht als Tatsache in Themenseiten schreiben.
4. Die acht offenen Lücken in der Methodik-Seite als offene Fragen führen, nicht als erledigt darstellen.
