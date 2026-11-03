# Retrieval-Belege ESOW-RAD-02 (Delta)

Karte `t_54bbde93` · Arbeitsbaum `C:/Users/mas/Arbeit/esow-rad-t_878c59c7` · Stand **2026-11-03, 00:15-00:45 CET**
Alle Abrufe erfolgten aus diesem Arbeitsbaum mit `curl` bzw. über die Werkzeuge `web_extract`/`web_search`.
`TMPDIR` war explizit `C:/Users/mas/AppData/Local/hermes/cache/scratch`.

Zweck: Nachweis, **was tatsächlich abgerufen** wurde — getrennt nach Volltext, Abstract und Metadaten.
Wo ein Volltext nicht beschafft wurde, steht das hier und in `quellen-delta.json` (`access_note`).

---

## 1. Startquellen (vier Vorgaben des Originalauftrags)

| Quelle | Prüfschritt | Ergebnis |
| --- | --- | --- |
| Cantergi, Awasthi & Friedman 2021 | `curl https://api.crossref.org/works/10.1016/j.humov.2021.102879` | **HTTP 200**; Titel, `Human Movement Science`, Bd. 80, Art. 102879, issued 2021-12, Autoren Cantergi/Awasthi/Friedman |
| Enright 1995 | `curl https://api.crossref.org/works/10.1007/s001140050198` | **HTTP 200**; `Naturwissenschaften` 82(8):360-369, issued 1995-08-01 |
| USGS Water Dowsing | `web_extract https://www.usgs.gov/water-science-school/science/water-dowsing` | Seite geladen; Datumszeile **„September 17, 2026“**; Textabschnitt „What does science say about dowsing?“ gelesen |
| Gesellschaft für Anomalistik | `curl -A "Mozilla/5.0 ..." https://www.anomalistik.de/aktuell/sdm/rutengehen-wie-ist-der-forschungsstand` | **HTTP 200, 32.844 Bytes**; Autorenzeile **„Gerhard Mayer“**, Datum **„10. Juni 2003“**, Volltext gelesen |

Auszug GfA-Seite (wörtlich, für die Korrektur K01 entscheidend):

> „Rutengehen - Wie ist der Forschungsstand? … Gerhard Mayer … 10. Juni 2003 … Bei sorgfältiger und unvoreingenommener Abwägung aller bislang dazu vorliegender wissenschaftlicher Studien … lautet das Urteil nämlich entgegen allen Apologeten pro und contra nach wie vor: Unentschieden!“

Die Seite referiert Hansen (1982), Betz & König (1989), König/Moll/Sarma (1991), Walach & Schmidt (1997), Ertel (1991, 1993), Houtkooper & Vaitl (1997), Knoblauch (1991). **Diese Referenzen wurden nicht einzeln beschafft** (siehe `gaps_remaining`).

---

## 2. Metadatenprüfungen (maschinell, reproduzierbar)

Verfahren: DOI-Content-Negotiation (`Accept: application/vnd.citationstyles.csl+json`) und OpenAlex `works/https://doi.org/<DOI>`.

| ID | DOI | Prüfergebnis |
| --- | --- | --- |
| Q41 | 10.1007/BF01149601 | HTTP 200; `Dowsers lost in a Barn`, Naturwissenschaften 83(6):275-277, 1996-06, ISSN 0028-1042 |
| Q47 | 10.24411/2226-7271-2018-11092 | HTTP 200; Container **„Пространство и Время“**, 2018, kein Volumen/keine Seiten in den CSL-Daten |
| Q48 | 10.17485/ijst/2010/v3i1.11 | HTTP 200; Indian Journal of Science and Technology 3(1):54-57, 2010-01-20 |
| Q61 | 10.47874/aqupp:88-99 | HTTP 200; Al-Quds University Journal 4(4):88-99, 2025-05-01 |
| Q46 | 10.5744/fa.2020.0024 | HTTP 200; Forensic Anthropology, 2021-06-28, University Press of Florida |

Bibliothekskatalog (lobid/hbz, JSON):

- `https://lobid.org/resources/HT004087743` → „Erdstrahlen? Der Wünschelruten-Report“, **1989**, München: **König und Betz**, ISBN 3-923819-05-6.
- `https://lobid.org/resources/HT003976043` → Knoblauch, „Die Welt der Wünschelrutengänger und Pendler“, **1991**, Campus, ISBN 3-593-34575-7, OCLC 611627271.
- `https://lobid.org/resources/TT002048267` → Prokop/Wimmer, „Wünschelrute, Erdstrahlen, Radiästhesie“, 3. Aufl. **1985**, Enke, ISBN 3-432-84473-5 (Korrektur K04).

OpenAlex-Suche `biotensor` (12 Treffer, 2026-11-03): **kein einschlägiger Treffer** zu Radiästhesie-Biotensoren; die Treffer betreffen Tensordekomposition, Spiking-Neuronen und Tiermedizin. Das ist eine negative Recherche, kein Existenzbeweis (so in `gaps_remaining` vermerkt).

---

## 3. Volltext-Belege mit Fundstelle

### Q34 Agricola 1556 (Hoover-Übersetzung 1912)
`curl -o agricola.txt https://www.gutenberg.org/files/38015/38015.txt` → **HTTP 200, 1.922.397 Bytes**; Treffer bei Zeile 3464.

> „It is a conspicuous fact that these cunning manipulators do not use a straight twig, but a forked one cut from a hazel bush … it must necessarily follow that the manipulation is the cause of the twig's twisting motion.“ (Buch II, S. 39-40)

> „So far as we are able to discover, this is the first published description of the divining rod as applied to minerals or water.“ (Fußnote [21], S. 38)

### Q35 Ellis 1917 (USGS WSP 416)
`web_extract https://pubs.usgs.gov/wsp/0416/report.pdf` → Titelseite + Introductory Note gelesen.

> „The use of a forked twig, or so-called divining rod … is a curious superstition that has been a subject of discussion since the middle of the sixteenth century …“ (Meinzer, Introductory Note, S. 5)

> „… will probably enable most honest inquirers to appreciate the practical uselessness of 'water witching' …“ (ebd.)

Inhaltsverzeichnis nennt u. a. „Chevreul and Faraday … 21“, „Scientific controversies … 18“, „Bibliography of 'water witching' … 26“.

### Q39 Foulkes 1971 (Nature)
`web_extract http://dowsing-research.net/dowsing/articles/Foulkes_Dowsing_experiments.pdf` → OCR-Transkript gelesen (Verlagskopie nicht beschafft).

> „Experiments organized by the British Army and Ministry of Defence suggest that results obtained by dowsing are no more reliable than a series of guesses.“ (Kopfspalte)

> „To sum up on map dowsing, the results from all the trials are really failures and there is no evidence that this is a practical method for locating mines.“ (Abschnitt „Map Dowsing“)

> „… a marked portion on the map, 3,400 feet long containing five mines“ (ebd.; die Serie mit 20 Attrappen-Minen und sieben Rutengängern referiert Q40)

### Q40 Hansen 1982 (JSPR)
`web_extract http://www.tricksterbook.com/ArticlesOnline/Dowsing-ReviewOfExperimetnalResearch-Hansen-JSPR-1982.pdf` → auszugsweise gelesen.

> „Of the tests reviewed, only three stand out as well conducted—the map dowsing tests of Cadoret, Osis, and Foulkes. Of these, only one produced significant results, and that barely significant.“

> „Ray Hyman and Evon Z. Vogt conducted several studies to determine why water witching was such a widespread and persistent practice.“

### Q42 Enright 1999 (Skeptical Inquirer, Volltext frei)
`web_extract https://skepticalinquirer.org/1999/01/testing-dowsing-the-failure-of-the-munich-experiments/` → vollständig gelesen.

> „… a ten-meter test line was established …“ / „… 843 single tests, grouped into 104 test-series …“ / „… some 500 candidate dowsers were recruited …“ / „… 400,000 German marks …“

> „… the Munich experiments constitute as decisive and complete a failure as can be imagined of dowsers to do what they claim.“

> „Those results from actual dowsing were on average 4 millimeters better than mid-line guesses would have been.“ (zu einem von sechs „besten“ Rutengängern)

### Q55 GWUP 2019 (Biotensor-Test)
`web_extract https://www.gwup.org/skeptiker-artikel/pseudo-parawissenschaften/ueberraschung-psi-tests-gwup/` → gelesen.

> „Emil Siebke (84) wollte mit einem so genannten Biotensor (einer Art Wünschelrute für eine Hand) vergiftete Lebensmittel aufspüren. Unter zehn Apfelhälften in gleich aussehenden verschlossenen Dosen wollte er diejenige finden, die mit dem Pflanzenschutzmittel Kiron behandelt war. Das gelang ihm jedoch bei keinem der 13 Durchgänge.“

### Q56 Pickl 2009 (Heilpraktiker-Fachartikel)
`curl https://heilpraktikerverband.de/images/stories/heilpraktiker/fachartikel/0309_MRD.pdf` → **HTTP 200**, gelesen.

> „Viele Heilpraktiker bevorzugen das Radiästhesie-Instrument Biotensor ®, eine Weiterentwicklung der Einhandrute.“

> „Wie Radiästhesie funktioniert, ist auch heute noch nicht wissenschaftlich bewiesen …“

### Q63 British Society of Dowsers
`curl -A "Mozilla/5.0 … Chrome/124" https://britishdowsers.org/dowsers-history/` → **HTTP 200** (mit Standard-User-Agent **HTTP 406**, daher Browser-UA nötig).

> „The British Society of Dowsers, founded, came to life on 4th May 1933.“ / „its founder … Arthur H. Bell, D.S.O., O.B.E … was a former army officer“

### Q64 Wikipédia (fr) „Radiesthésie“
`curl https://fr.wikipedia.org/wiki/Radiesth%C3%A9sie` → **HTTP 200, 187.082 Bytes**.

> „Le terme « radiesthésie » est employé pour la première fois en 1926 par l'abbé Bouly“

> „L'abbé Bouly crée en 1929 l'Association française et internationale des amis de la radiesthésie …“

---

## 4. Abstrakt-Belege (Volltext nicht beschafft)

Für Q44, Q45, Q46, Q47, Q48, Q49, Q50, Q51, Q52, Q53, Q54, Q59, Q60, Q61, Q62 wurde das Abstract über OpenAlex (rekonstruiert aus `abstract_inverted_index`) gelesen. Beispiele mit wörtlicher Übernahme:

- Q44: „The homeopathic medicine Bryonia was correctly identified in 48.1% of bottle pairs (n=156; 95% confidence interval 40.2%, 56.0%; P=0.689). These results, wholly negative …“
- Q46: „Matthew's Correlation Coefficient –0.19 for the control group and 0.00 for the test group … p = 0.36 … dowsing was not found to be a reliable method of detecting buried bones.“
- Q47: „… in 20 out of 20 tests the dowsers' reactions were not at random positions.“
- Q48: „The observation indicates the change in blood pressure and heart rate in geopathic stress zones as compared to nonstress zones.“
- Q49: „… the inference that the field is not electromagnetic was confirmed by experiments carried out in an electromagnetically shielded laboratory …“
- Q50: „The existence of the patterns shows that the dowsing field is wave radiation.“
- Q51: „The study of the mechanically forced pendulum provides useful insight into the centuries-old problem concerning the dynamics of the hand-forced pendulum as employed by dowsers.“
- Q52: „… strong parametric influences of the pendulum's sinusoidal motion were isolated.“
- Q53: „… questions whose answer was previously rated as a guess, were answered equally well and at about chance levels by ideomotor action and verbal responses.“
- Q54: „… supporting the elbow does facilitate responding, but only on the initial trial.“
- Q59: „This article discusses contemporary vernacular theory about the elusive energies that emanate from the ground.“
- Q60 (ar, eigene Übersetzung): „أظهرت النتائج أن بعض الطرق التقليدية، رغم التشكيك في أساسها العلمي، تحقق نجاحات عملية ملحوظة“ — „Die Ergebnisse zeigen, dass einige traditionelle Methoden trotz Zweifeln an ihrer wissenschaftlichen Grundlage bemerkenswerte praktische Erfolge erzielen.“
- Q61: „… looters have increasingly relied on supernatural intermediaries, such as jinn and dowsing rods, to identify buried treasures …“
- Q62 (ru, eigene Übersetzung): „Секрет эффекта лозы до сих пор не раскрыт до конца“ — „Das Geheimnis des Ruteneffekts ist bis heute nicht vollständig geklärt.“

---

## 5. Linkprüfung (HTTP-Status, 2026-11-03)

Skript: `scripts/check_links.py` (Ergebnis in `scripts/parts/http-check.json`).

- **200**: Q34, Q35, Q36, Q37, Q38, Q39, Q40, Q41, Q42, Q43, Q46, Q47, Q48, Q49, Q50, Q51, Q55, Q56, Q61, Q62, Q63, Q64, Q65, Q66.
- **403 (Publisher-Bot-Schutz, DOI löst auf)**: Q44 (SAGE), Q45 (Wiley), Q52, Q53, Q54 (Taylor & Francis), Q57 (Univ. of California Press), Q58 (Univ. of Chicago Press). Gegenprobe mit `curl -sI https://doi.org/<DOI>` (ohne `-L`): jeweils **HTTP 302** → DOI ist registriert, nur der Verlagsabruf blockiert.
- **406**: Q63 mit Standard-User-Agent; mit Browser-UA 200 (dokumentiert).
- **Korrigiert vor Abschluss**: Q59 hatte zunächst einen konstruierten DOI (`10.7592/JEF2012.6.1`), der **HTTP 404** lieferte. Ersetzt durch die tatsächliche Verlagsseite `https://ojs.utlib.ee/index.php/JEF/article/view/22611` (OpenAlex W2992340880). Q60 erhielt den Locator `https://journals.imist.ma/index.php/index/article/view/6757` (OpenAlex W7220155682).

---

## 6. Was nicht geprüft wurde (Grenzen)

- Keine der 403er-Volltexte wurde gelesen; sie stützen nur Aussagen, die im Abstract stehen.
- Der Münchner Schlussbericht (Wagner/Betz/König 1990) und Betz & König (1989) wurden nicht beschafft.
- Walach & Schmidt (1997), Houtkooper & Vaitl (1997), Ertel (1991/1993), Hansen-Referenzen sind nur über Q05 bekannt.
- Keine Bibliotheksferleihe, kein Sci-Hub, keine Umgehung von Zugangsschranken.
- Die arabischen und russischen Abstracts wurden sinngemäß übersetzt; die Übersetzungen sind als eigene gekennzeichnet.
