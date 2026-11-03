# Korrekturen am Bestand (Quellenabgleich ESOW-RAD-02)

Karte `t_54bbde93` · Stand 2026-11-03
Diese Datei ändert **nichts** am Bestand. Sie listet Befunde, die RAD-06 beim Zusammenführen
von `quellen.json` (Q01-Q33) und `quellen-delta.json` (Q34-Q66) übernehmen oder verwerfen muss.
Jeder Befund ist mit Prüfweg belegt (Details in `RETRIEVAL-BELEGE.md`).

| Nr. | Ziel | Befund | Beleg | Empfehlung |
| --- | --- | --- | --- | --- |
| **K01** | `quellenverzeichnis.md`, Zeile Q05 | Q05 ist dort als **„Rutengehen — Forschungsstand (Betz 2003)“** geführt. Tatsächlich: **Gerhard Mayer, 10. Juni 2003**, Gesellschaft für Anomalistik (Studie des Monats). Betz wird auf der Seite nur zitiert. | Seitenkopf „Gerhard Mayer“, „10. Juni 2003“; `quellen.json` führt Mayer korrekt | Autorenangabe auf Mayer korrigieren; Typ „Fachliche Übersicht (Online)“ beibehalten |
| **K02** | Q02 Enright 1995 | Zwei DOIs im Umlauf: `10.1007/s001140050198` (Startquelle) und `10.1007/bf01134560`. Beide werden von OpenAlex unter demselben Titel/Jahr geführt. | OpenAlex-Suche „water dowsing“; Crossref-Abruf der Startquelle HTTP 200 | Startquelle unverändert lassen; Dublette im Feld `alt_doi` dokumentieren, nicht ersetzen |
| **K03** | Q01 USGS Water Dowsing | Kein Jahr im Datensatz. Die Webseite trägt den Stand **17. September 2026**; die zugehörige Druckpublikation ist **USGS GIP „Water Dowsing“ (1977)**, DOI `10.3133/7000104`. | USGS-Seite (Abruf 2026-11-03); OpenAlex/DOI 10.3133/7000104 | `year_note` ergänzen: „Webfassung, aktualisiert 2026-09-17; Printoriginal 1977“ |
| **K04** | Q30 Prokop/Wimmer 1985 | ISBN war nur aus Q06 übernommen (`secondary_isbn`). lobid bestätigt: 3. Aufl., Enke 1985, ISBN 3-432-84473-5, OCLC 1073947500. | lobid TT002048267 | Verifikationsstufe auf `library_record` heben |
| **K05** | Q05, Literaturangabe Betz & König 1989 | Q05 nennt **„Herold-Verlag, München“**; der Katalog nennt **„König und Betz“**. | lobid HT004087743: München: König und Betz, 1989, ISBN 3-923819-05-6 | Verlagsangabe präzisieren, als Selbstverlag kennzeichnen |
| **K06** | Kopfzeile `quellenverzeichnis.md` | Dort steht „Lücken: Enright (404)“. Der DOI ist registriert; nur die **Verlagsseite** lieferte 2026-11-02 HTTP 404. | Crossref 10.1007/s001140050198 → HTTP 200 (1.575 Bytes JSON) | Formulierung: „Volltext über Verlag nicht erreichbar“, nicht „404“ als Existenzzweifel |

---

## Nicht korrigiert, aber vermerkt

1. **Q10 (Bouly-Datierung 1926 vs. ~1931)** bleibt offen. Das Delta bringt mit Q64 (1926) und Q56 (1930) zwei weitere, ebenfalls sekundäre Datierungen. Eine Primärquelle von Bouly wurde nicht beschafft. Die Widersprüchlichkeit ist jetzt dreifach dokumentiert (Claim C29), nicht aufgelöst.
2. **Q02-Verifikation** bleibt `crossref`. Der Volltext ist weiterhin nicht beschafft; die inhaltliche Zusammenfassung stützt sich auf Q05 und Q42.
3. **Q06/Q07/Q08/Q09** (Wikipedia) bleiben als Sekundärquellen für Begriffs- und Institutionsgeschichte brauchbar, nicht für Wirkaussagen. Das Delta ändert daran nichts.
4. **Q17 („Dowsing“, en)** und **Q32 („Dowsing“)** sind zwei getrennte Enzyklopädieartikel; Q65 ergänzt die Definition der Teleradiästhesie, ersetzt Q17 aber nicht.

---

## Prüfregel für RAD-06

Beim Zusammenführen gilt:

- Q01-Q33: **unverändert übernehmen**, außer den unter K01-K06 genannten Feldkorrekturen.
- Q34-Q66: **neu aufnehmen**; `verified` und `access_note` unverändert übernehmen, damit die Unterscheidung Volltext/Abstract/Metadaten erhalten bleibt.
- Claims C01-C30: nur übernehmen, wenn die zitierte Quelle im Zielbestand vorhanden ist. Claims mit Status `unbelegt` dürfen **nicht** als Tatsachen in Themenseiten einfließen; sie sind als „Behauptung, nicht belegt“ zu kennzeichnen.
- Der Interessenvermerk ist beschreibend. Er darf nicht in ein Urteil über die Person umformuliert werden.
