# Quellenbibliothek — Radiästhesie, Pendeln und Orakel

Stand: 2026-11-03 · erzeugt aus `js/data/radiasthesie.js` (Schema 1.0) · Generator: `scripts/build-uebersichten.cjs`

## 1. Woher diese Liste kommt

Diese Datei ist **keine** zweite Quelle der Wahrheit. Sie ist eine aus den Daten
erzeugte Lesefassung des Bestands, der auch die Seite `radiasthesie/quellen.html`
und die Modulroute `#pendeln/quellen` speist:

| Ebene | Datei | Rolle |
| --- | --- | --- |
| Redaktion | `docs/radiasthesie-konzept/recherche/quellen.json` | Quelldatei mit bibliografischen Angaben und Prüfvermerken (RAD-02) |
| Erzeugung | `scripts/generate-radiasthesie-data.cjs` | prüft Pflichtfelder, Referenzen und Stufen, schreibt das Datenmodul |
| Auslieferung | `js/data/radiasthesie.js` | `sources` im ausgelieferten Datenmodul |
| Anzeige | `#pendeln/quellen`, `radiasthesie/quellen.html` | Quellenverzeichnis mit Filter und Interessenvermerk |

## 2. Bestand in Zahlen

- **66 Quellen** (Q01–Q66).
- Prüftiefe: VL 28 · DOI/CF 7 · VL / HTTP 1 · ISBN / VL 2 · ISBN 1 · VL / Reg.-Schranke 1 · ISBN/Katalog 3 · ISBN / Katalog 1 · VL-T 3 · AB 17 · OA-Meta 2.
- Stufenverweise: A 25 · B 20 · C 12 · D 28 · E 9 (eine Quelle kann mehrere Stufen tragen).
- Typen: 37 verschiedene Angaben, von Behördenpublikation bis Vereinsseite.

Die Stufe gilt **je Aussage**, nicht je Quelle; dieselbe Quelle kann eine
historische Tatsache (A) belegen und eine Bewertung (D) tragen. Die
Bedeutung der Kürzel steht auf `#pendeln/methodik` und in
`docs/radiasthesie-konzept/inhalte/modul-einstieg.md`.

## 3. Verzeichnis

| ID | Kurzname | Typ | Jahr | Stufen | Prüftiefe | Fundstelle |
| --- | --- | --- | --- | --- | --- | --- |
| Q01 | Water Dowsing (Behörde) | Behörde / Publikation | 1977 / 2026 | D | VL | https://www.usgs.gov/water-science-school/science/water-dowsing |
| Q02 | Enright 1995 — Scheunen Experiments | Zeitschrift / DOI | 1995 | D | DOI/CF | https://doi.org/10.1007/s001140050198 |
| Q03 | Finger movement / imagination | Zeitschrift / DOI | 2021 | D | DOI/CF | https://doi.org/10.1016/j.humov.2021.102879 |
| Q04 | Dowsing reviewed (Betz 1996) | Zeitschrift / DOI | 1996 | C, D | DOI/CF | https://doi.org/10.1007/BF01149600 |
| Q05 | Rutengehen — Forschungsstand (Mayer 2003) | Online-Übersicht | 2003 | D | VL / HTTP | https://www.anomalistik.de/aktuell/sdm/rutengehen-wie-ist-der-forschungsstand |
| Q06 | Radiästhesie (Wikipedia de) | Enzyklopädie | — | B, E | VL | https://de.wikipedia.org/wiki/Radi%C3%A4sthesie |
| Q07 | Wünschelrute (Wikipedia de) | Enzyklopädie | — | B | VL | https://de.wikipedia.org/wiki/W%C3%BCnschelrute |
| Q08 | Erdstrahlen (Wikipedia de) | Enzyklopädie | — | E | VL | https://de.wikipedia.org/wiki/Erdstrahlen |
| Q09 | Ammianus Marcellinus / Pendel (Enzyklopädie / Fach) | Enzyklopädie / Fach | — | A, B | VL | https://de.wikipedia.org/wiki/Siderisches_Pendel |
| Q10 | Bouly / Radiästhesie-Begriff | Fach / Buch | 1926 / ~31 | C, A | VL | https://fr.wikipedia.org/wiki/Radiesth%C3%A9sie |
| Q11 | Harder 2013 — Warum Wünschelrutengehen keine Wissenschaft ist | Blog (Skeptiker) | 2013 | E, D | VL | https://blog.gwup.net/2013/11/17/warum-wunschelrutengehen-keine-wissenschaft-ist/ |
| Q12 | Bovis-Skalen / Messung | Fach / Enzyklopädie | — | E | VL | https://www.psiram.com/de/index.php/Bovis-Einheit |
| Q13 | SZ — Radiästhesie / Pendel / Biotensor | Zeitung | o. J. | B, E | VL | https://www.sueddeutsche.de/wissen/teil-27-radiaesthesie-mit-pendel-und-wuenschelrute-1.796241 |
| Q14 | haus.de — Wasseradern und Erdstrahlen | Verbrauchermagazin | o. J. | B, E | VL | https://www.haus.de/haushalt/wasseradern-und-erdstrahlen-glaubenssache-oder-nicht-25706 |
| Q15 | Geschichte Radiästhesie (Fach) | Fach / Enzyklopädie | 2010 | A | VL | https://www.anomalistik.de/images/pdf/zfa/zfa2010_3_287_schellinger_anton_schetsche.pdf |
| Q16 | Tarot — 1440er / Visconti-Decks | Buch / Museum | 2016 | A | ISBN / VL | https://www.metmuseum.org/perspectives/tarot-2 |
| Q17 | Kartenpendeln / Fernmutung | Fach / Enzyklopädie | — | B | VL | https://www.britannica.com/topic/dowsing |
| Q18 | Parlett — Tarot (Britannica) | Enzyklopädie | — | A | VL | https://www.britannica.com/topic/tarot |
| Q19 | Tarot-Entwicklung / Tarock | Fach / Enzyklopädie | — | A | VL | https://de.wikipedia.org/wiki/Wahrsagekarten |
| Q20 | Orakelkarten / Divination | Enzyklopädie / Online | 2021 | B | VL | https://doi.org/10.1177/0891241620964951 |
| Q21 | I Ging / Wilhelm / Jung | Buch / Fach | 1924 / 1950er | A | ISBN / VL | https://en.wikipedia.org/wiki/I_Ching |
| Q22 | Runen (Wikipedia de, mit Belegmängeln) | Enzyklopädie | — | A, B | VL | https://en.wikipedia.org/wiki/Runic_magic |
| Q23 | Blum 1982 — The Book of Runes | Buch (kommerziell) | 1982 | B | ISBN | ISBN 0-312-09758-1 (10. Auflage 1993) |
| Q24 | Delphi / Pythia / Ausgrabungen | Behörde / Museum | — | A | VL | https://en.wikipedia.org/wiki/Pythia |
| Q25 | Ethylen-Rätsel (Fachjournal) | Fachjournal / DOI | 2003 | C, D | DOI/CF | https://doi.org/10.1130/0091-7613(2001)029%3C0707:NEFTGO%3E2.0.CO;2 |
| Q26 | Ethylen-Rätsel — Gegenargument | Fachjournal / DOI | 2006 | C, D | DOI/CF | https://doi.org/10.1353/clw.2007.0094 |
| Q27 | Ethylen — Skeptiker-Widerlegung | Skeptiker-Web | 2007 | C, D | VL | https://doi.org/10.1080/15563650601120800 |
| Q28 | Pendeldiagnostik — Übersichtsbeitrag | Online-Übersicht | 2005 | D | VL / Reg.-Schranke | https://www.aerzteblatt.de/archiv/48961 |
| Q29 | Forer 1949 — Persönlichkeitsdiagnose | Zeitschrift / DOI | 1949 | D | DOI/CF | https://doi.org/10.1037/h0059240 |
| Q30 | Prokop/Wimmer 1985 — Wünschelrute, Erdstrahlen, Radiästhesie | Buch (Fachliteratur) | 1985 | D | ISBN/Katalog | ISBN 978-3-432-84473-2 |
| Q31 | Lambeck 2003 — Irrt die Physik? | Buch (Fachliteratur) | 2003 | D | ISBN / Katalog | ISBN 978-3-406-69119-5; Katalogdatensatz https://lobid.org/resources/99375253231506441 |
| Q32 | Geschichte Wünschelrute (Enzyklopädie / Fach) | Enzyklopädie | — | A | VL | https://en.wikipedia.org/wiki/Dowsing |
| Q33 | Runen — Schrift / Magie (Fach) | Fach / Enzyklopädie | — | A | VL | https://de.wikipedia.org/wiki/Runen |
| Q34 | Agricola 1556 — De re metallica (Buch II) | Frühdruck / Übers. 1912 | 1556 | A | VL | https://www.gutenberg.org/ebooks/38015 |
| Q35 | Ellis 1917 — The Divining Rod (USGS WSP 416) | Behördenbericht | 1917 | A, D | VL-T | https://pubs.usgs.gov/wsp/0416/report.pdf |
| Q36 | Dym 2010 — The Electric Rod / Freiberg | Buchkapitel (Brill) | 2010 | A | AB | https://doi.org/10.1163/ej.9789004186422.i-218.40 |
| Q37 | Knoblauch 1991 — Welt der Wünschelrutengänger | Monografie (Soziologie) | 1991 | A, B | ISBN/Katalog | https://lobid.org/resources/HT003976043 |
| Q38 | Knoblauch 2026 — The world of divining rods | Monografie (Open Access) | 2026 | A, B | AB | https://doi.org/10.14279/depositonce-26541 |
| Q39 | Foulkes 1971 — Dowsing Experiments (Nature) | Zeitschrift | 1971 | D | VL-T | https://doi.org/10.1038/229163a0 |
| Q40 | Hansen 1982 — Dowsing: A Review | Reviewaufsatz | 1982 | D, A | VL-T | http://www.tricksterbook.com/ArticlesOnline/Dowsing-ReviewOfExperimetnalResearch-Hansen-JSPR-1982.pdf |
| Q41 | Enright 1996 — Dowsers lost in a Barn | Zeitschrift (Replik) | 1996 | D | DOI/CF | https://doi.org/10.1007/BF01149601 |
| Q42 | Enright 1999 — Testing Dowsing | Magazin (Volltext) | 1999 | D | VL | https://skepticalinquirer.org/1999/01/testing-dowsing-the-failure-of-the-munich-experiments/ |
| Q43 | Betz/König 1989 — Wünschelruten-Report | Forschungsbericht (Selbstverlag) | 1989 | C, D | ISBN/Katalog | https://lobid.org/resources/HT004087743 |
| Q44 | McCarney u. a. 2002 — Homeopaths Detect Medicines by Dowsing | Zeitschrift (peer review) | 2002 | D | AB | https://doi.org/10.1177/014107680209500406 |
| Q45 | Locock 1995 — Dowsing on historic garden sites | Zeitschrift (peer review) | 1995 | D | AB | https://doi.org/10.1002/1099-0763(199503)2:1<15::aid-arp6140020103>3.0.co;2-1 |
| Q46 | Easter u. a. 2021 — Dowsing for Bone | Zeitschrift (peer review) | 2021 | D | AB | https://doi.org/10.5744/fa.2020.0024 |
| Q47 | von Tscharner/Nigg 2018 — Repeatability at 'Active Sites' | Zeitschrift | 2018 | C, D | AB | https://doi.org/10.24411/2226-7271-2018-11092 |
| Q48 | Dharmadhikari 2010 — Geopathic stress, heart rate | Zeitschrift | 2010 | E, C | AB | https://doi.org/10.17485/ijst/2010/v3i1.11 |
| Q49 | Dodd u. a. 2002 — Towards a physics of dowsing | Zeitschrift | 2002 | C, E | AB | https://doi.org/10.1017/s0263593300000341 |
| Q50 | Reddish 1998 — Dowsing physics: interferometry | Zeitschrift | 1998 | C, E | AB | https://doi.org/10.1017/s0263593300002339 |
| Q51 | Irons 1990 — Forced spherical pendulum | Zeitschrift (Lehrbuchphysik) | 1990 | D, C | AB | https://doi.org/10.1088/0143-0807/11/2/009 |
| Q52 | Easton/Shor 1976 — Chevreul Pendulum Illusion | Zeitschrift | 1976 | D | AB | https://doi.org/10.1080/00221309.1976.9710871 |
| Q53 | Moga/Dienes 2022 — Unconscious knowledge, Chevreul | Zeitschrift (peer review) | 2022 | D | AB | https://doi.org/10.1080/00029157.2021.2010641 |
| Q54 | Montgomery/Kirsch 1996 — Arm position, Chevreul | Zeitschrift | 1996 | D | AB | https://doi.org/10.1080/00029157.1996.10403336 |
| Q55 | GWUP 2019 — Biotensor-Test Emil Siebke | Vereinspublikation | 2019 | D | VL | https://www.gwup.org/skeptiker-artikel/pseudo-parawissenschaften/ueberraschung-psi-tests-gwup/ |
| Q56 | Pickl 2009 — Medizinische Radiästhesie-Diagnostik | Heilpraktiker-Fachartikel | 2009 | B | VL | https://heilpraktikerverband.de/images/stories/heilpraktiker/fachartikel/0309_MRD.pdf |
| Q57 | Vogt/Hyman 1959 — Water Witching U.S.A. | Monografie (Soziologie) | 1959 | A, B | OA-Meta | https://doi.org/10.1525/aa.1960.62.6.02a00640 |
| Q58 | Vogt 1956 — Interviewing Water-Dowsers | Zeitschrift | 1956 | A | OA-Meta | https://doi.org/10.1086/221963 |
| Q59 | Kivari 2013 — Energy as Mediator | Zeitschrift (peer review, OA) | 2013 | A, B | AB | https://ojs.utlib.ee/index.php/JEF/article/view/22611 |
| Q60 | Maymoun/Boughaba 2026 — Water Dowsing, Chefchaouen | Zeitschrift (arabisch) | 2026 | B, C | AB | https://journals.imist.ma/index.php/index/article/view/6757 |
| Q61 | Al-Houdalieh/Jamal 2025 — Jinn and Dowsing Rods | Zeitschrift (peer review) | 2025 | A, B | AB | https://doi.org/10.47874/aqupp:88-99 |
| Q62 | Shuleikin/Zhigalin 2016 — Dowsing and geophysics | Zeitschrift (russisch) | 2016 | B, A | AB | https://doi.org/10.23671/vnc.2016.2.20813 |
| Q63 | British Society of Dowsers — History | Vereinswebsite | — | A, B | VL | https://britishdowsers.org/dowsers-history/ |
| Q64 | Radiesthésie (Wikipedia fr) | Enzyklopädie | — | A, B | VL | https://fr.wikipedia.org/wiki/Radiesth%C3%A9sie |
| Q65 | Radiesthesia (Wikipedia en) | Enzyklopädie | — | B | VL | https://en.wikipedia.org/wiki/Radiesthesia |
| Q66 | Dowsing (Encyclopedia.com / Gale) | Enzyklopädie (Tertiär) | — | A | VL | https://www.encyclopedia.com/philosophy-and-religion/other-religious-beliefs-and-general-terms/miscellaneous-religion/dowsing |

## 4. Was diese Bibliothek nicht belegt

1. **Keine neue Erreichbarkeitsprüfung.** Die Prüftiefen stammen aus RAD-02
   (Abruf 2026-11-03); RAD-14 hat keine URL erneut geöffnet. Ein `VL` heißt
   „Volltext zum Zeitpunkt der Recherche geprüft“, nicht „heute online“.
2. **Keine inhaltliche Bürgschaft.** Die Zuordnung Aussage → Quelle ist eine
   redaktionelle Leistung. Geprüft ist, dass die Hauptquelle im zugeordneten
   Kapitel zitiert wird (RAD-06, `verify_rad06.cjs`), nicht dass der Satz die
   Quelle erschöpfend wiedergibt.
3. **Widersprüche bleiben sichtbar.** RAD-02 markiert zwei Aussagen als
   widersprüchlich und drei als unbelegt; sie stehen so im Text, statt
   geglättet zu werden (RAD-02 `CLAIM-QUELLE-MATRIX.md`).
4. **Keine Lizenzprüfung der Quellen.** Es werden keine fremden Texte
   übernommen; Zitate sind kurz und belegt. Die Lizenz der eigenen Inhalte
   ist projektweit offen (siehe `MEDIEN-LIZENZEN.md` §5).
