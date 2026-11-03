# Prüfbericht Farbwelten – acht neue Redaktionsseiten (t_207023c2)

Stand: 2026-11-03 · Prüfer: fact_checking · Basis: `fcfe190` (`feature/farbwelten-modul`)
Urteil: **nicht freigabefähig** — 10 blockierende Befunde, 11 Soll-Befunde, generierte Daten/Routen nicht prüfbar.

## 1. Prüfgegenstand

Die acht Dateien lagen in den Eltern-Worktrees als **untracked** Dateien und wurden byte-identisch in den Prüf-Worktree kopiert (`cmp` je Datei: identisch).

| Datei | Quelle | sha256 (12) | Zeilen | Wörter (Prosa, inkl. Quellenblock) |
|---|---|---|---|---|
| `content/farbwelten/tuerkis.md` | t_3a707386 | `760b79bd378e` | 66 | 875 |
| `content/farbwelten/magenta.md` | t_3a707386 | `483562bd3b96` | 65 | 882 |
| `content/farbwelten/rosa.md` | t_3a707386 | `c7d03da18536` | 67 | 966 |
| `content/farbwelten/weiss.md` | t_3a707386 | `a9ee47c8e72b` | 68 | 947 |
| `content/farbwelten/schwarz.md` | t_3a707386 | `7f4f4124cf18` | 68 | 926 |
| `content/farbwelten/farbtherapie.md` | t_1693c780 | `467be1f27271` | 69 | 1363 |
| `content/farbwelten/farbpsychologie.md` | t_1693c780 | `41956fabccd2` | 66 | 1216 |
| `content/farbwelten/lichtmedizin.md` | t_1693c780 | `54d615247ca3` | 84 | 1174 |

Referenz für Prüfpunkte 3 und 4: `evidenzreport-farbwelten.md` §5.1–§8, §12 (Pfad `C:/Users/mas/Arbeit/hermes-adaptive-router/.worktrees/t_2dd7d588/farbwelten/`) und `ledger.json` (32 Kennungen).

## 2. Ausgeführte Prüfungen (reproduzierbar)

| Prüfung | Verfahren | Ergebnis |
|---|---|---|
| H2-Skelett, leere Abschnitte, Platzhalter | `review_check.py` (Parser gegen die in den Elternkarten vorgegebenen Überschriften) | 8/8 vollständig, 0 leer, 0 Platzhalter |
| `zitiert ⊆ gelistet` | dito, Textteil gegen `## Quellen` | 7/8 konform; `farbtherapie.md` verletzt (B3) |
| Disclaimer-Position | dito, Blöcke nach dem letzten `Health-Disclaimer` | 3/8 konform; 5 Farbseiten verletzen (B4) |
| Titel/Description-Längen | dito, Frontmatter | Farbseiten 41–48 / 74–130 ✓; Themenseiten 66–83 / 188–238 ✗ (S1) |
| nm/THz/eV-Vorkommen | Regex je Datei mit Zeilennummern | 5 Farbseiten je 1–3 Treffer, 2 Themenseiten (S9) |
| DOI-Auflösung | Crossref `api.crossref.org/works/<doi>`, 15 DOIs | 14 × HTTP 200 mit passendem Titel; `10.1177/0004-285X` → **404** (B2) |
| URL-Erreichbarkeit | HTTP GET, 12 URLs | 11 × 200, 1 × 404 (= B2); ANSES leitet auf `/en/article/leds-blue-light` um |
| Zahlen gegen Original | Abstract [3]/[4] über Crossref, Evidenzreport §5.3/§6.1 | [3]: 132 Artikel, 42.266, 64 Länder ✓; SMD −0,37 ✓; RR 0,64 falsch belegt (B1); OSTEBA 201/20 ✓ |
| Duplikatprüfung | 8-Wort-Shingles der Themenseiten gegen die 10 Bestandsseiten | 0 gemeinsame Shingles; nur 3 Standard-Sätze in den Farbseiten |
| Heilaussagen / rote Aussagen | Grep über `heilt\|wirkt gegen\|hilft bei\|senkt den\|…` | 0 bejahte Heilversprechen, 0 wörtliche rote Aussagen |

Umfang der Aussagenprüfung: **358 Prosasätze**, davon **167 mit Quellenkennung** (274 Marker), jede Seite einzeln gelesen; 15 DOIs und 12 URLs live geprüft.

## 3. Blockierende Befunde

### B1 – Präventionsbefund der SAD-Lichttherapie falscher Quelle zugeschrieben
`content/farbwelten/lichtmedizin.md:20`, Quellenzeile `:74`

> „Ein Cochrane-Befund [11] (Hamblin 2018) nennt eine relative Risikoreduktion von RR 0,64 …"

[11] ist laut Ledger und laut eigener Quellenzeile **Hamblin 2018, „Mechanisms and Mitochondrial Redox Signaling in Photobiomodulation"** (DOI 10.1111/php.12864, live 200) — keine Cochrane-Arbeit und ohne SAD-Daten. RR 0,64 (95 %-KI 0,30–1,38), eine Studie, 46 Teilnehmende, sehr niedrige Evidenzqualität stehen im Evidenzreport §5.3 als **[16] Nussbaumer-Streit et al. 2019, Cochrane CD011269** (DOI 10.1002/14651858.CD011269.pub3, live 200). [16] fehlt auf der Seite vollständig; Prüfpunkt 4 (CI und Stichprobe) ist damit nicht erfüllt.

Korrektur: Satz ersetzen durch „Für die Vorbeugung existiert nur eine kleine Studie mit 46 Teilnehmenden und sehr niedriger Evidenzqualität (RR 0,64; 95 %-KI 0,30–1,38) [16]." Quellenzeile [11] auf den Mechanismus beschränken, [16] aufnehmen.

### B2 – Nicht existierende DOI
`content/farbwelten/farbtherapie.md:63`, `content/farbwelten/lichtmedizin.md:82`

`DOI: 10.1177/0004-285X` → Crossref **404**, `https://doi.org/10.1177/0004-285X` **404**. Ledger [27] führt für dieselbe Arbeit (Riera et al., Sao Paulo Med J) die URL `https://www.scielo.br/j/spmj/a/wBgZ7MLg7VmNTBYdLMFXJMg/?lang=en` (live 200).

Korrektur: DOI-Angabe streichen, Ledger-URL einsetzen.

### B3 – `zitiert ⊄ gelistet` in farbtherapie
`content/farbwelten/farbtherapie.md:52` zitiert `[10]`, der Quellenblock (`:58–67`) listet [3], [6], [9], [23], [26], [27], [1], [2], [29], [28] — kein [10].

Korrektur: Zeile „- [10] Son et al. 2025, *Photobiomodulation umbrella review.* Syst Rev 14:160. DOI: 10.1186/s13643-025-02902-3." ergänzen oder den Satz ohne [10] formulieren.

### B4 – Gesundheitshinweis nicht am Seitenende (5 Seiten)
`tuerkis.md:64→66`, `magenta.md:63→65`, `rosa.md:65→67`, `weiss.md:66→68`, `schwarz.md:66→68`

Der Disclaimer steht jeweils vor einem Fließtextabsatz „Farbspezifische Ergänzung: …". Prüfpunkt 5 verlangt ausdrücklich, dass kein Fließtext folgt.

Korrektur: den Absatz vor `## Quellen` ziehen (inhaltlich ist er dort ohnehin Dublette des Einführungsteils) oder streichen; Disclaimer als letzten Block belassen.

### B5 – Kennungen [19], [24], [31] lösen nicht auf den geprüften Bestand auf (alle fünf Farbseiten)
`tuerkis.md:60–62`, `magenta.md:59–61`, `rosa.md:61–63`, `weiss.md:62–64`, `schwarz.md:62–64`

- [19] „IARC (2023). Monograph on artificial optical radiation. https://www.iarc.who.int" ≠ Ledger [19]: IARC 2012, *Monographs Vol. 100D Radiation*, `https://publications.iarc.who.int/…/Radiation-2012` (live 200). Jahr, Titel und URL falsch, Domain nicht auf die Monographie auflösbar.
- [24] „NIST / CIE. SI-Werte und Lichtgeschwindigkeit (c = 299 792 458 m/s)." — **keine URL**, kein auflösbarer Beleg. Ledger [24]: NIST SP 330 Section 2 (live 200).
- [31] nennt „Wyszecki & Stiles (2000), Color Science … ISBN 978-0-471-39918-6" — Ledger [31] ist das **MIT Vision Book, Color** (`https://visionbook.mit.edu/color.html`, live 200). Andere Publikation, andere Aussage (Metamerie/nichtspektrale Farben).

Korrektur: die drei Zeilen je Seite wörtlich durch die Ledger-Angaben ersetzen.

### B6 – [10] als Beleg für Farbmetrik/Weißlicht
`tuerkis.md:17, :40, :66`; `weiss.md:39, :49`; `schwarz.md:41, :49`

[10] ist der PBM-Umbrella-Review (Son et al. 2025) und enthält weder Wellenlängen-Konventionen (490–520 nm) noch Aussagen zu weißem Licht oder Schwarz. Die Kennung löst zwar auf, belegt aber die jeweilige Aussage nicht.

Korrektur: für Konventionen [24]/[31] (bzw. [23]); [10] nur für PBM-Aussagen.

### B7 – Falsche Physik: UV-C als ionisierende Strahlung
`content/farbwelten/lichtmedizin.md:32`

> „UV-C ist ionisierend und in der Natur nicht vorhanden, wird aber sterilisiert."

UV-C (100–280 nm, 4,4–12,4 eV) liegt unter der Ionisationsschwelle (ca. 10 eV / 124 nm) und ist nicht ionisierend; der Satz ist zudem grammatisch defekt.

Korrektur: „UV-C (100–280 nm) wird von der Atmosphäre zurückgehalten und technisch zur Desinfektion genutzt; ionisierend ist UV-C nicht."

### B8 – Photobiomodulation mit weißem Licht gleichgesetzt
`content/farbwelten/weiss.md:39`, `:49`

> „Farbtherapie mit Weiß … hat medizinische Anwendungen in der Photobiomodulation …" / „Lichttherapie mit weißem Licht hat medizinische Anwendungen … [10]"

PBM ist definiert über rotes bis nahinfrarotes Licht (600–1000 nm); die Seite widerspricht damit `lichtmedizin.md:26` und der zitierten Quelle [10].

Korrektur: Satz streichen; falls nötig: „Weißes Licht ist in der Phototherapie nur Träger definierter Spektren; PBM arbeitet mit rotem bis nahinfrarotem Licht [10]."

### B9 – Quelle falsch charakterisiert und falsch zugeordnet
`content/farbwelten/farbpsychologie.md:38`: „Die große Meta-Analyse von Jonauskaite et al. 2020 [4]" — [4] ist eine Querschnittsstudie mit 4.598 Teilnehmenden aus 30 Nationen (Abstract, Crossref live), keine Meta-Analyse.
`content/farbwelten/farbpsychologie.md:18`: „380 bis 750 nm; … höchste Empfindlichkeit bei etwa 555 nm … [10][24]" — [10] ist der PBM-Review, [24] die SI-Broschüre; keiner der beiden belegt die Empfindlichkeitskurve.

Korrektur: „Die große Querschnittsstudie … [4]"; für 380–750 nm und 555 nm [31] (bzw. [23]) zitieren.

### B10 – Kernaussage der Türkis-Seite durch die zitierte Quelle widerlegt
`content/farbwelten/tuerkis.md:29`

> „Die systematischen Reviews zu Farbemotionen [3][4] führen ‚cyan / turquoise' nicht als eigenständige Kategorie mit eigenem Effektsignatur."

Das Abstract von [3] berichtet ausdrücklich „(iv) BLUE, GREEN, **GREEN–BLUE**, and WHITE with positive, low arousal emotions" — GREEN–BLUE ist die Türkis-Kategorie. Die Seite stützt ihre Argumentation („keine eigene Studie") auf eine Prämisse, die die Quelle selbst widerlegt.

Korrektur: „[3] führt eine Kategorie GREEN–BLUE (positive, niedrig erregte Emotionen); eine türkis-spezifische Effektstärke getrennt von Blau und Grün wird nicht berichtet." Beleg [3] beibehalten.

## 4. Soll-Befunde (nicht blockierend, aber vor Veröffentlichung zu beheben)

- **S1 Titel/Description:** `farbtherapie.md:2–3` 66/197, `farbpsychologie.md:2–3` 69/188, `lichtmedizin.md:2–3` 83/238 Zeichen (Grenze 60/155). Der Generator überschreibt Frontmatter mit `META`; für die acht neuen Seiten existiert dort noch kein Eintrag.
- **S2 Kennung ohne Textbezug:** [17] steht nur im Quellenblock (`lichtmedizin.md:75`), die Neonaten-Phototherapie fehlt im Text — obwohl im Auftrag gefordert und im Evidenzreport §5.4 als stärkster Beleg geführt. Ebenfalls nur gelistet: lichtmedizin [12], [24], [27]; farbpsychologie [5], [14], [31]; farbtherapie [3], [28].
- **S3 Anwendungsvorgabe:** `lichtmedizin.md:22` „ca. 10.000 Lux, tägliche Anwendung über Wochen, meist morgens" — von der Karte ausgeschlossen („keine Anwendungsempfehlungen"), Zahl ohne [16] im Text.
- **S4 Historische Zuordnung:** `farbtherapie.md:26` führt „Auguste Rollier" als Vertreter farbiger Lichttherapie; Rollier ist der Heliotherapie-Pionier (Sonnenlicht). Babbitt/Rollier ohne Beleg ([25] nicht zitiert).
- **S5 Unbelegte Regulierungsaussage:** `farbtherapie.md:18` „in der EU fehlt eine einheitliche Regelung für chromotherapeutische Geräte".
- **S6 Unbelegte Alternsaussage:** `farbpsychologie.md:50` „Verringerung der Blauempfindlichkeit (Gelbverschiebung)" und „Die Forschung empfiehlt" ohne Quelle.
- **S7 Sprachfehler/Artefakte:** `farbtherapie.md:50` „Quietsch-Placebo"; `magenta.md:17` „als additiver Mischfarbe", „Aberration" statt gleichzeitiger Reizung; `farbpsychologie.md:32` „perceptioniert"; `weiss.md:25` „die Bedeutung von White"; `schwarz.md:19` „ein geschlossene Augenlider"; `lichtmedizin.md:20` „Ein Meta-Analyse".
- **S8 Korpus-Widerspruch bei den Wellenlängenbereichen:** `tuerkis.md:17` behauptet, der Bestand ordne „Blau 450–490 nm und Grün 490–570 nm" zu; `blau.md:16` nennt 450–495 nm, `gruen.md:16` 495–570 nm, der Generator-META 450–490/490–570. Bitte auf die Werte der Seiten angleichen (oder META und Seiten gemeinsam korrigieren).
- **S9 nm-Angaben auf Nicht-Spektralseiten:** `weiss.md:17/68` und `schwarz.md:17/68` nennen 380–750 nm und behaupten im selben Absatz „Keine nm-Angabe"; `rosa.md:17/67` ordnet Rosa „ca. 620–750 nm" zu. Prüfpunkt 1 verlangt nm-freie Darstellung — entweder Werte entfernen oder ausdrücklich als Komponenten-/Bereichsangabe kennzeichnen und den Satz „Keine nm-Angabe" streichen.
- **S10 Wortumfang:** rosa 966, weiss 947, schwarz 926 (Vorgabe 550–900); farbtherapie 1363, farbpsychologie 1216 (Vorgabe 700–1200). Jeweils inklusive Quellenblock gemessen.
- **S11 [7] als Allzweckbeleg und Kulturbelege ohne Deckung:** [7] (Gnambs, Meta-Analyse zum Roteffekt) wird auf allen fünf Farbseiten für Aussagen zu Kultur, Symbolik und Cyan zitiert (`tuerkis.md:25,31,48`; `magenta.md:25,31,48`; `rosa.md:25,27,33,50`; `weiss.md:25,33,50`; `schwarz.md:25,33,50`) — dort belegt es nichts. Ebenso sind die konkreten Symbolbehauptungen („Weiß = Trauer in Ostasien", „Rosa = Heilung in anderen Kulturen", „Schwarz = Fruchtbarkeit in afrikanischen Kontexten") nicht in [4] enthalten; [4] misst Assoziationen, keine Trauer-/Hochzeits-/Fruchtbarkeitssymbolik. Korrektur: [7] nur für den Rot-Effekt; Symbolik als Tradition kennzeichnen und ohne Kennung oder mit [1] führen.

## 5. Bestanden

- H2-Skelett auf allen acht Seiten vollständig und wortgleich; keine leeren Abschnitte, keine Platzhalter.
- Keine bejahten Heilversprechen, keine wörtlichen roten Aussagen (Ampelliste §8); Tradition ist durchgehend als Tradition markiert („In der Tradition …", „wird als Tradition gekennzeichnet").
- Health-Disclaimer-Wortlaut identisch mit dem Bestand (rot, blau, violett, farbwelten, chakren); Position nur auf den fünf Farbseiten fehlerhaft (B4).
- 14 von 15 geprüften DOIs lösen live auf und tragen den im Bericht genannten Titel; 11 von 12 URLs antworten 200.
- Zahlen gegen die Originale: 132 Artikel / 42.266 Teilnehmende / 64 Länder [3] ✓ (Abstract wörtlich geprüft), SMD −0,37 [15] ✓, OSTEBA 201 Publikationen / 20 Volltexte / alle ausgeschlossen [9] ✓ (gegen Evidenzreport §6.1), PBM „niedrig bis moderat" [10] ✓.
- Keine wörtliche Duplikation: die drei Themenseiten teilen 0 Acht-Wort-Shingles mit den Bestandsseiten; in den fünf Farbseiten stehen drei Standard-Sätze (u. a. „Unterhalb von 380 nm beginnt der UV-Bereich …", „Die klassischen Texte (Sat-cakra-nirupana 1577) …"), die aus dem Bestand übernommen sind — vertretbar, aber keine Eigenleistung.

## 6. Nicht prüfbar / offen

- **Generierte Daten und Routen:** Die Implementierungskarten haben noch nicht committet (`t_bd5c13db`: `js/data/farbwelten.js`, `js/modules/farbwelten*.js`, `scripts/generate-farbwelten-data.cjs` modifiziert, nicht committet). Für die acht Seiten existieren weder `META`-/`META_PAGES`-Einträge noch Routen; Prüfpunkt „generierte Daten und Routen" bleibt damit offen und ist nach der Integration nachzuziehen.
- **Volltexte:** [9] ist als PDF abrufbar (HTTP 200, 400 kB gelesen), wurde aber nicht inhaltlich ausgewertet; [10], [15], [16] wurden über Abstract und Evidenzreport geprüft, nicht im Volltext.
- **Reihenfolge:** Die Inhaltsfehler B1–B10 betreffen Dateien, die die Implementierungskarten unverändert einbinden würden. Eine Integration vor der Korrektur würde die Befunde veröffentlichen.

## 7. Reproduktion

```
python review_check.py     # Skelett, zitiert/gelistet, Disclaimer, nm, Titel, Wörter
python live_check.py       # 15 DOIs (Crossref), 12 URLs (HTTP)
python abstract_check.py   # Abstracts [3]/[4], Stichworte turquoise/pink/132/42.266
python count_claims.py     # 358 Sätze / 167 mit Kennung / 274 Marker
python overlap_check.py    # 8-Wort-Shingles gegen die 10 Bestandsseiten
```
Ergebnisse: `live_check.json` im Prüf-Worktree.
