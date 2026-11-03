# Wissensbasis: Radiästhesie, Pendeln und Orakel

**Task:** ESOW-RAD-02 / Kanban `t_0fe70b63`
**Projekt:** Esoterik Welt (Master-Task ESOW-RAD-000)
**Stand:** 2. November 2026
**Status:** Recherche abgeschlossen, Quellen geprüft, Glossar und Content-Outline fertig – übergabefertig an Redaktion (ESOW-RAD-06) und UX (ESOW-RAD-04)

Maschinenlesbare Quellenliste: [`quellen.json`](./quellen.json) (33 Einträge, IDs `Q01`–`Q33`)

---

## 1. Auftrag, Scope und Methode

### 1.1 Was dieses Dokument leistet

Es liefert die belegbare Grundlage für ein Themenmodul, das drei Cluster verbindet: **Radiästhesie** (Wünschelrute, Erdstrahlen-/Störfeldkonzepte), **Pendeln** (Instrumente, Technik, Einsatzfelder) und **Orakel** (Tarot, I Ging, Runen, Orakelkarten, antike Orakelstätten). Es enthält:

1. eine geprüfte Quellenbibliothek mit mindestens zwölf nachprüfbaren Einträgen (tatsächlich: 33),
2. eine Trennung von historischem Befund, Tradition, Hypothese, geprüftem Befund und widerlegter Behauptung,
3. eine Claim-Quelle-Matrix, in der jede tragende Aussage auf eine Quelle zeigt,
4. ein deutsches Glossar der zentralen Begriffe,
5. eine abschnittsweise Content-Outline mit Längenbudget und Quellenzuordnung,
6. ableitbare Falsifikationstests für die prüfbaren Wirkungsbehauptungen,
7. eine offene Lückenliste (was **nicht** belegt werden konnte).

### 1.2 Such- und Auswahlkriterien

**Aufgenommen** wurden Quellen, die (a) eine prüfbare bibliografische Identität besitzen (DOI, ISBN oder dauerhafte URL), (b) im Volltext tatsächlich abgerufen wurden oder über eine bibliografische Datenbank (Crossref, Bibliothekskatalog) verifiziert sind und (c) mindestens einem der drei Cluster zugeordnet werden können. Bewusst gemischt wurden: Behörden- und Museumsquellen, peer-reviewte Fachaufsätze, Fachbücher, journalistische Überblicke, Befürworter- und Skeptikerliteratur.

**Ausgeschlossen** wurden: Händler- und Kursanbieterseiten (kommerzielles Interesse, keine Prüfbarkeit), Social-Media-Beiträge, KI-generierte Zusammenfassungsseiten ohne Autorenschaft, Foren. Einzelne Anbieterseiten wurden nur dann herangezogen, wenn sie die *Praxisbeschreibung* tragen und im Dossier ausdrücklich als Traditionsquelle markiert sind.

**Grundsatz:** Esoterische Behauptungen werden als Behauptungen referiert (Klasse B), nicht als Naturgesetz. Umgekehrt werden skeptische Positionen nicht als Beweis behandelt, sondern als Position mit Quelle (Klasse D oder E, je nachdem, ob eine kontrollierte Untersuchung dahintersteht).

### 1.3 Kennzeichnung: die fünf Evidenzklassen

Das Master-Task verlangt eine Trennung in A–E. Diese Klassen werden im gesamten Modul verwendet und sollten auch in der Oberfläche sichtbar sein (Badge an Absätzen oder Abschnittsköpfen):

| Klasse | Bedeutung | Beispiel im Modul |
|---|---|---|
| **A** | Historische Tatsache / nachweisbare Überlieferung | Tarot ist ab den 1440er-Jahren in Norditalien als Stichspiel belegt [Q16] |
| **B** | Traditionelle Vorstellung, Anwenderbericht, Praxisliteratur – kein Wirknachweis | „Das Pendel antwortet rechts für Ja“ – Zuordnung ist individuell und variabel [Q09] |
| **C** | Hypothese zu einem Wirkmechanismus, prüfbar, nicht etabliert | Ethylen-Ausgasung als Erklärung der Pythia-Trance [Q25] |
| **D** | Experimentell geprüfter Befund (kontrollierte Studie, Review) | Wünschelruten treffen in kontrollierten Tests nicht besser als der Zufall [Q01], [Q02], [Q05] |
| **E** | Unbelegte oder widerlegte Behauptung | „Erdstrahlen“ als Gesundheitsursache; „Bovis-Einheiten“ als Messgröße [Q08], [Q12] |

Zusätzlich trägt jede Quelle einen **Interessenvermerk** (Behörde, Museum, Verein, Skeptikerorganisation, kommerzieller Autor, Befürworter). Das ist keine Abwertung, sondern Kontext: Ein Verein für Anomalistik und eine Skeptikerorganisation berichten über dasselbe Thema aus unterschiedlicher Richtung.

### 1.4 Prüfverfahren (reproduzierbar)

| Prüfschritt | Werkzeug | Ergebnis |
|---|---|---|
| Bibliografie der DOI-Quellen | Crossref REST API (`api.crossref.org/works/<DOI>`, `query.bibliographic`) | Titel, Autoren, Jahr, Band, Seiten maschinell bestätigt für Q02, Q03, Q04, Q20, Q25, Q26, Q27, Q29 |
| Volltextabruf | `web_extract`, `browser` (nur wo Extraktion unvollständig war) | Q01, Q05–Q19, Q21, Q22, Q24, Q28, Q32, Q33 gelesen |
| ISBN / Publikationsdaten | Bibliothekskatalog lobid/hbz (`lobid.org/resources/...`) | Q31 bestätigt |
| ISBN aus Sekundärquelle | Enzyklopädie-Bibliografie, ausdrücklich markiert | Q23, Q30 |
| Datumsprüfung journalistischer Quellen | Seitenabruf | Q13, Q14 ohne Datum → als „o. J.“ geführt |

Nicht jeder Eintrag konnte gleich tief geprüft werden. Die Spalte „Prüfstatus“ in Abschnitt 2 sagt für jeden Eintrag, *wie* er geprüft wurde – das ist der Unterschied zwischen „zitiert“ und „verifiziert“.

---

## 2. Quellenbibliothek (33 Einträge)

Legende Prüfstatus: **CR** = Crossref/DOI bestätigt · **VL** = Volltext geladen · **BK** = Bibliothekskatalog · **SQ** = ISBN aus Sekundärquelle (nicht separat geprüft)

¹ Bei Q02 ist der DOI bibliografisch registriert (Crossref, OpenAlex), die Verlagsseite liefert am 2.11.2026 jedoch HTTP 404. Der Inhalt der Kritik wird deshalb über Q05 referiert; der Aufsatz selbst ist über Bibliothek/Fernleihe zu beschaffen. Diese Einschränkung gilt für alle Aussagen, die sich auf Enrights Argumentation im Detail beziehen.

### 2.1 Radiästhesie und Wünschelrute

| ID | Autor/Jahr | Titel | Ort | Prüf | Klasse | Interesse |
|---|---|---|---|---|---|---|
| Q01 | USGS, o. J. | Water Dowsing | usgs.gov/water-science-school/science/water-dowsing | VL | D, E | Staatliche Geologie |
| Q02 | Enright 1995 | Water Dowsing: the Scheunen Experiments | Naturwissenschaften 82(8), 360–369, doi:10.1007/s001140050198 | CR¹ | D | Methodenkritik |
| Q04 | Betz, Kulzer, König, Tritschler, Wagner 1996 | Dowsing reviewed – the effect persists | Naturwissenschaften 83(6), 272–275, doi:10.1007/BF01149600 | CR | C, D | **Befürworter** |
| Q05 | Mayer 2003 | Rutengehen – Wie ist der Forschungsstand? | anomalistik.de/aktuell/sdm/rutengehen-wie-ist-der-forschungsstand | VL | D, C | Anomalistik-Verein |
| Q06 | Wikipedia (de) | Radiästhesie | de.wikipedia.org/wiki/Radiästhesie | VL | B, A, E | Enzyklopädie |
| Q07 | Wikipedia (de) | Wünschelrute | de.wikipedia.org/wiki/Wünschelrute | VL | A, E | Enzyklopädie |
| Q08 | Wikipedia (de) | Erdstrahlen | de.wikipedia.org/wiki/Erdstrahlen | VL | B, E | Enzyklopädie |
| Q10 | Wikipédia (fr) | Radiesthésie | fr.wikipedia.org/wiki/Radiesthésie | VL | A, E | Enzyklopädie |
| Q11 | Harder 2013 | Warum Wünschelrutengehen keine Wissenschaft ist | blog.gwup.net (17.11.2013) | VL | E, D | **Skeptiker** |
| Q12 | Psiram | Bovis-Einheit | psiram.com/de/index.php/Bovis-Einheit | VL | E | **Skeptiker-Wiki** |
| Q13 | SZ (o. J.) | Radiästhesie – Mit Pendel und Wünschelrute | sueddeutsche.de, Wissen | VL | B, E | Tageszeitung |
| Q14 | haus.de (o. J.) | Wasseradern und Erdstrahlen – eine Glaubenssache? | haus.de/haushalt/... | VL | B, E | Verbraucherschutz-O-Ton |
| Q17 | Britannica | Dowsing | britannica.com/topic/dowsing | VL | A, B | Enzyklopädie |
| Q30 | Prokop & Wimmer 1985 | Wünschelrute, Erdstrahlen, Radiästhesie | Thieme, 5. Aufl., ISBN 978-3-432-84473-2 | SQ | D | Rechtsmedizin |
| Q31 | Lambeck 2003 | Irrt die Physik? | C.H. Beck, ISBN 978-3-406-69119-5 | BK | D | Physik |
| Q32 | Wikipedia (en) | Dowsing | en.wikipedia.org/wiki/Dowsing | VL | A, E | Enzyklopädie |

### 2.2 Pendeln

| ID | Autor/Jahr | Titel | Ort | Prüf | Klasse | Interesse |
|---|---|---|---|---|---|---|
| Q03 | Cantergi, Awasthi, Friedman 2021 | Moving objects by imagination? … Chevreul pendulum illusion | Human Movement Science 80, 102879, doi:10.1016/j.humov.2021.102879 | CR | D | Bewegungsforschung |
| Q09 | Wikipedia (de) | Siderisches Pendel | de.wikipedia.org/wiki/Siderisches_Pendel | VL | B, A, E | Enzyklopädie |
| Q15 | Schellinger, Anton, Schetsche 2010 | Zwischen Szientismus und Okkultismus … deutsche Marine im Zweiten Weltkrieg | Zeitschrift für Anomalistik 10, 287–321 | VL | A | Archivarbeit |
| Q28 | Ernst 2005 | Komplementärmedizinische Diagnoseverfahren | Dtsch Arztebl 102(44), A-3034 | VL | D | Medizinjournal |
| Q29 | Forer 1949 | The fallacy of personal validation | J Abnorm Soc Psychol 44(1), 118–123, doi:10.1037/h0059240 | CR | D | Psychologie |

### 2.3 Orakel

| ID | Autor/Jahr | Titel | Ort | Prüf | Klasse | Interesse |
|---|---|---|---|---|---|---|
| Q16 | Husband 2016 | Before Fortune-Telling: The History and Structure of Tarot Cards | metmuseum.org/perspectives/tarot-2 (08.04.2016) | VL | A | Museum |
| Q18 | Parlett, o. J. | Tarot | britannica.com/topic/tarot | VL | A | Spielehistoriker |
| Q19 | Wikipedia (de) | Wahrsagekarten | de.wikipedia.org/wiki/Wahrsagekarten | VL | A | Enzyklopädie |
| Q20 | Lavin 2021 | On Spiritualist Workers | J Contemp Ethnogr 50(3), 317–340, doi:10.1177/0891241620964951 | CR | D, B | Ethnografie |
| Q21 | Wikipedia (en) | I Ching | en.wikipedia.org/wiki/I_Ching | VL | A | Enzyklopädie |
| Q22 | Wikipedia (en) | Runic magic | en.wikipedia.org/wiki/Runic_magic | VL | A, B | Enzyklopädie (belegschwach) |
| Q23 | Blum 1982 | The Book of Runes | St. Martin's Press, ISBN 0-312-09758-1 | SQ | A | **kommerzieller Esoterikmarkt** |
| Q24 | Wikipedia (en) | Pythia | en.wikipedia.org/wiki/Pythia | VL | A | Enzyklopädie |
| Q25 | de Boer, Hale, Chanton 2001 | New evidence for the geological origins of the ancient Delphic oracle | Geology 29(8), 707–710, doi:10.1130/0091-7613(2001)029<0707:NEFTGO>2.0.CO;2 | CR | C, D | Geologie |
| Q26 | Lehoux 2007 | Drugs and the Delphic Oracle | Classical World 101(1), 41–56, doi:10.1353/clw.2007.0094 | CR | D | Altertumswissenschaft |
| Q27 | Foster & Lehoux 2007 | The Delphic Oracle and the ethylene-intoxication hypothesis | Clinical Toxicology 45(1), 85–89, doi:10.1080/15563650601120800 | CR | D | Toxikologie |
| Q33 | Wikipedia (de) | Runen | de.wikipedia.org/wiki/Runen | VL | A | Enzyklopädie |

**Zählung:** 33 Einträge in sieben Gruppen: 8 peer-reviewte Zeitschriftenaufsätze mit DOI (Q02, Q03, Q04, Q20, Q25, Q26, Q27, Q29), 3 Bücher mit ISBN (Q23, Q30, Q31), 4 Behörden-, Museums- und Fachzeitschriftenquellen (Q01, Q15, Q16, Q28), 13 Enzyklopädieartikel (Q06–Q10, Q17–Q19, Q21, Q22, Q24, Q32, Q33), 2 journalistische Quellen (Q13, Q14), 2 Skeptiker-Webquellen (Q11, Q12) und 1 fachliche Online-Übersicht (Q05). Die Anforderung „mindestens 12 verwertbare, nachprüfbare Quellen“ ist damit deutlich übererfüllt; für die Redaktion sind die DOI- und Behördenquellen die tragenden Belege, die Enzyklopädien nur Wegweiser. Q04 ist zugleich DOI-Quelle und Befürworterposition – der Interessenvermerk steht in der Tabelle.

**Erfüllung des Formal-Kriteriums (Titel, Autor, Jahr, URL/ISBN):** 16 Einträge tragen ein gesichertes Erscheinungsjahr (Q02, Q03, Q04, Q05, Q11, Q15, Q16, Q20, Q23, Q25, Q26, Q27, Q28, Q29, Q30, Q31). Die übrigen 17 sind Enzyklopädie-, Presse- oder Webseiten ohne belastbares Datum; sie sind mit „o. J.“ und Abrufdatum geführt statt mit einem geschätzten Jahr. Für eine Publikation, die ausschließlich datierte Belege zulässt, stehen damit 16 statt der geforderten 12 zur Verfügung.

---

## 3. Befunde nach Themencluster

### 3.1 Radiästhesie

#### 3.1.1 Begriff und Konzeptlandkarte

„Radiästhesie“ (von lat. *radius*, Strahl, und griech. *aisthesis*, Wahrnehmung) bezeichnet die Vorstellung, Lebewesen könnten von Objekten oder Orten ausgehende Strahlungen wahrnehmen und mit Rute oder Pendel in Bewegung umsetzen; die Naturwissenschaften führen sie als Para- oder Pseudowissenschaft [Q06]. Die Praxis unterscheidet eine *physikalische* Richtung (Minerale, Metalle, Pflanzen, Lecher-Rute) und eine *mentale* Richtung (Auren, „Feinstoffliches“, Fernwirkungen) [Q06]. Der Vorgang des Aufspürens heißt in der Szene *Mutung* [Q06].

**Klassifikation:** B (Binnensicht) mit E-Anteil (behauptete Strahlungen). Wichtig für die Redaktion: Die deutsche Bezeichnung ist jung – sie entstand im Umfeld der französischen „radiesthésie“ [Q06], [Q10].

#### 3.1.2 Geschichte – was tatsächlich dokumentiert ist

| Zeit | Befund | Klasse | Quelle |
|---|---|---|---|
| um 1430 | Ältester bekannter Beleg für die Vorstellung, eine Rute reagiere auf Metallausstrahlung (Goslarer Bergmeister Andreas de Solea) | A | [Q07] |
| 15. Jh. | Erste Anleitungen zur Herstellung und Nutzung, teils mit Beschwörungstexten | A | [Q07] |
| 1518 | Martin Luther führt die Metallsuche mit der Rute als Verstoß gegen das erste Gebot; die katholische Kirche hatte die Praxis verboten | A | [Q32] |
| 1556 | Agricola beschreibt das Rutengehen in *De re metallica* als verbreitete, nach Hölzern differenzierte, aber bereits umstrittene Bergmannstechnik | A | [Q07], [Q32] |
| 1568 | Früheste überlieferte Schilderung einer *Wassersuche* mit der Rute (Teresa von Ávila über einen Laienbruder) | A | [Q32] |
| 1662 | Der Jesuit Gaspar Schott nennt das Rutenweissagen „abergläubisch, ja satanisch“ | A | [Q32] |
| 1692 | Jacques Aymar erregt in Lyon Aufsehen; Versuche unter Aufsicht des Prince de Condé mit gezielter Täuschung sollen die Methode falsifiziert haben | A | [Q07] |
| 19. Jh. | Moriz Benedikt setzt Ruten zum Aufspüren „pathogener Orte“ ein | A | [Q06] |
| 1913 / 1923 / 1926 / 1928 | Internationale Kongresse (Paris, Algier) institutionalisieren die Praxis; 1929 Gründung eines Verbands durch Abbé Bouly | A | [Q10] |
| 1929 | Gustav Freiherr von Pohl führt das Konzept „Erdstrahlen“ ein (unterirdische Wasseradern als Strahlungsquelle) | A | [Q06] |
| 1930–1945 | Hochphase der „Strahlungssucherei“; Bouly prägt den Begriff Radiästhesie in einem um 1931 erschienenen Werk | A | [Q06] |
| 1942 | Die deutsche Kriegsmarine betreibt eine Experimentalgruppe, die mit dem „Siderischen Pendel“ feindliche U-Boote orten soll | A | [Q15] |
| 23.03.1950 | Beschluss der Direktorenkonferenz der Geologischen Landesämter der Bundesrepublik: ein Zusammenhang zwischen Rutenausschlag und Untergrund ist nicht erwiesen; die Rute sei „völlig unbrauchbar“ | A | [Q07], [Q08] |
| 1952–1954 | Curry-Netz (Publikation Curry 1952, Vorarbeit Wittmann), Benker-Kubensystem (1953), Hartmann-Gitter (1954/1964) werden als „Störfelder“ eingeführt | A | [Q06] |
| 1986–1988 | Münchner Großexperiment („Scheunenversuche“) | A | [Q10], [Q05] |
| 1989 | Der „Wünschelruten-Report“ (Betz/König) erscheint; die Autoren deuten ihre Ergebnisse als Effektnachweis | A/B | [Q04], [Q05] |
| 1995 | Enright bestreitet die Auswertung statistisch-methodisch (referiert bei Mayer 2003) | D | [Q02], [Q05] |
| 1996 | Betz u. a. halten dagegen („the effect persists“); eine Einigung wird nicht erzielt | C/D | [Q04], [Q05] |
| seit 2004 | Jährliche Psi-Tests der GWUP; bis 2010 keine über den Zufall hinausgehenden Ergebnisse berichtet | D | [Q12] |

**Datierungskonflikt, offen ausgewiesen:** Die deutschsprachige Darstellung datiert die Begriffsprägung durch Bouly auf ein „um 1931“ erschienenes Werk [Q06], die französischsprachige auf 1926 [Q10]. Beide berufen sich auf französische Literatur. Für Redaktionstexte gilt: **„in den 1920er/1930er Jahren geprägt“** schreiben, nicht ein exaktes Jahr behaupten, ohne die Quelle zu nennen.

#### 3.1.3 Erdstrahlen, Wasseradern, „Störfelder“ – die Behauptungen

Behauptet wird ein ganzes Bündel: Wasseradern, geologische Verwerfungen, „Gitternetze“ (Hartmann, Curry, Benker, Globalnetzgitter) und daraus folgende „Erdstrahlung“, die Schlafplätze schädige, Krankheiten, Verhaltensauffälligkeiten und verzögerte Wundheilung verursache; dagegen werden Entstörgeräte und Amulette angeboten [Q08]. Die Stärke der angeblichen „Lebensenergie“ wird in Bovis-Einheiten angegeben [Q08], [Q12]. Für Schlafplätze wird in der Szene auch das Konzept des „guten Ortes“ vertreten (Käthe Bachler) [Q06].

**Klassifikation:** B für die Binnensicht, E für die Wirkbehauptungen. Es gibt weder für die postulierte Strahlung noch für ihre Gesundheitswirkungen wissenschaftlich anerkannte Belege [Q08].

**Gegenbefunde – drei unabhängige Ebenen:**

1. **Geologie:** Grundwasser fließt in den jungen Lockersedimenten weiter Teile Deutschlands diffus und homogen, nicht in „Adern“; die Ader-Vorstellung ist damit für die meisten Regionen unplausibel [Q06], [Q08].
2. **Wahrscheinlichkeit von Treffern:** In Regionen mit ausreichendem Niederschlag und günstiger Geologie ist es schwer, beim Bohren *kein* Wasser zu finden – der scheinbare Erfolg vieler Rutengänger ist damit erklärt, ohne eine Rutenwirkung zu benötigen [Q01].
3. **Wahrnehmungspsychologie:** Der Rutenausschlag wird durch unwillkürliche Muskelbewegungen erklärt (Carpenter-/ideomotorischer Effekt), bei Zweihandruten zusätzlich durch den Kohnstamm-Effekt (Muskelklonus bei angespannter Haltung) [Q07], [Q13], [Q32].

**Verbraucherschutz-Position:** Die Verbraucherzentrale Hamburg hält schon die Begrifflichkeit für unseriös („Wasser im Boden ist fast überall vorhanden“) und bezweifelt, dass Schlafstörungen auf „Wasseradern“ zurückzuführen sind – ohne zu bestreiten, dass einzelne Menschen empfindlicher auf physikalische Gegebenheiten reagieren [Q14]. Diese Doppelbewegung (Kritik der Behauptung, Offenheit für Empirie) ist ein gutes Vorbild für den Ton des Moduls.

**Physikalische Prüfbarkeit:** Lambeck formuliert in *Irrt die Physik?* mehrere Tests, mit denen sich Erdstrahlen nachweisen ließen, wenn es sie gäbe [Q06], [Q31]. Das ist der Ansatzpunkt für das geplante Experimentiermodul: nicht „glauben oder nicht“, sondern „so würde man es prüfen“.

#### 3.1.4 Bovis-Einheiten – warum sie keine Messgröße sind

Bovis-Einheiten sind keine physikalische Einheit; der Wert ist intuitiv und hängt vom Mutenden ab, es gibt kein Messgerät und keine Falsifizierbarkeit [Q06]. Aus Skeptikersicht wird zusätzlich kritisiert, dass die Einheit mit Ångström gleichgesetzt wird, was physikalisch in die Irre führt (längere Wellenlänge = niedrigere Frequenz = geringere Energie – der behauptete Zusammenhang ist umgekehrt) und dass die Zahlen nicht reproduzierbar sind [Q12]. Eine medizinische Verwendung zur Krankheitsdiagnose ist nicht validiert [Q12].

**Für die Redaktion:** Bovis darf als *historisches Ordnungsschema der Szene* erklärt werden (Klasse B), niemals als Messwert (Klasse E). Formulierungshilfe: „Die Skala ordnet Eindrücke; sie misst nichts.“

### 3.2 Pendeln

#### 3.2.1 Geschichte und Instrumente

Das Pendel ist das zweite klassische Instrument der Radiästhesie. Die früheste bekannte Verwendungsschilderung stammt von Ammianus Marcellinus für das Jahr 371: Verschwörer gegen Kaiser Valens nutzten Faden und Ring über einer Schale, auf deren Außenseite die 24 Buchstaben des Alphabets graviert waren [Q09]. Das ist ein sauberer A-Beleg dafür, dass das Muster „Pendel + Buchstabentafel“ antik ist – über die Wirksamkeit sagt er nichts.

Ein typisches Esoterik-Pendel besteht aus einem etwa 2–3 cm langen kegelförmigen Metallkörper an einer ca. 20 cm langen Schnur; verbreitet sind Tropfen-, Isis-, Perl-, Resonanz- und Triangelpendel, Materialien sind überwiegend Messing und Kupfer, daneben Edelsteine [Q09]. Anwenderinnen und Anwender „eichen“ ihr Pendel vor der Nutzung, um die Bewegungsrichtung zu interpretieren; das ist kein technisches Kalibrierverfahren [Q09]. Entscheidend für die Aussagekraft: **Welche Bewegung welche Antwort bedeutet, ist individuell festlegbar und kann sich von Sitzung zu Sitzung ändern** [Q09]. Das ist der wichtigste Punkt für die Wissenschaftsseite des Moduls, weil er die Nachprüfbarkeit strukturell erschwert.

Historisch-politisch bemerkenswert: 1942 richtete die deutsche Kriegsmarine eine interdisziplinäre Experimentalgruppe ein, die mit dem „Siderischen Pendel“ und anderen grenzwissenschaftlichen Methoden feindliche U-Boote und Geleitzüge orten sollte [Q15]. Das ist ein starkes Erzählstück für die Geschichtsseite – staatliche Stellen haben die Methode unter Kriegsbedingungen tatsächlich geprüft.

#### 3.2.2 Technik und Einsatzfelder (Binnensicht)

Beschrieben werden: Frage formulieren, Pendel ruhig halten, Bewegung beobachten, Antwort über vereinbarte Konventionen lesen; für mehr Antwortmöglichkeiten dienen **Pendeldiagramme/Pendeltafeln** (Ja/Nein, Zahlenkreis, Buchstabenfeld, Segmenttafeln) [Q09]. Einsatzfelder in der Szene: Radiästhesie (Erdstrahlen, Wasseradern), Alternativmedizin (Einhandrute/Biotensor zum „Abtasten“ von Meridianen, Akupunkturpunkten, Aura) [Q13], Entscheidungshilfen und „Fernmutung“ per Karte [Q17].

**Klassifikation:** B. Die Beschreibung der Praxis ist belegbar; die behauptete Informationsübertragung ist es nicht.

#### 3.2.3 Forschungsstand

- Die Mehrzahl der Studien spricht gegen eine Verwendung des Pendelns in der komplementärmedizinischen Diagnostik [Q09], [Q28].
- Der Pendelausschlag ist experimentell als ideomotorisches Phänomen zugänglich: In der Chevreul-Pendeltäuschung hängt der Erfolg (also ob sich das Pendel wie vorgestellt bewegt) vom Ausmaß der Fingerbewegung und von der Pendellänge ab [Q03]. Damit ist ein Mechanismus benannt, der die Beobachtung vollständig erklärt, ohne externe Information.
- Für Pendeln gilt dasselbe wie für die Rute: Kontrollierte Prüfungen mit verdecktem Ziel sind möglich und wurden für Rutengehen durchgeführt; die Trefferquoten blieben im Zufallsbereich [Q02], [Q05], [Q12].

**Klassifikation:** D für die Befunde, E für die Behauptung, das Pendel liefere unbekannte Informationen.

### 3.3 Orakel

#### 3.3.1 Divination als Oberbegriff – und die Abgrenzung zum Modul „Radiästhesie & Pendeln“

Radiästhesie ist eine Instrumentalpraxis, Divination der größere Bereich mantischer Verfahren. Beide teilen die Grundfigur „verdeckte Information wird über ein Hilfsmittel lesbar“, unterscheiden sich aber in der Behauptung: Die Radiästhesie behauptet *physikalische* Strahlung, die Orakelpraxis behauptet *Zeichenhaftigkeit* (Los, Karte, Text). Diese Unterscheidung sollte in der Informationsarchitektur sichtbar bleiben und nicht zu einer Seite verschmolzen werden.

#### 3.3.2 Tarot

**Gesicherte Geschichte:** Die frühesten Belege für Tarot stammen aus den 1440er- und 1450er-Jahren und liegen im Viereck Venedig–Mailand–Florenz–Urbino; das Deck umfasste 56 Farbkarten (Kelche, Schwerter, Stäbe, Münzen), 21 Trumpfkarten und den Narren. Tarot ist ein Stichspiel; die heutige Verbindung mit Wahrsagerei und Okkultismus kam erst im 19. Jahrhundert auf und hat mit den mittelalterlichen Karten nichts zu tun [Q16]. Erhalten sind drei Luxusdecks, darunter der Visconti-Tarot (69 Karten, Beinecke Library) und der Visconti-Sforza-Tarot (u. a. Morgan Library) [Q16]. Tarot gehört zur Familie der Tarock-Spielkarten; die Entwicklung verläuft bis Ende des 18. Jahrhunderts parallel, danach entstehen speziell für Wahrsagezwecke gestaltete Sätze mit esoterischen Inhalten [Q19].

**Kartomantie:** Erste Formen im frühen Buchdruck um 1480–1505, ein frühes literarisches Zeugnis ist das in Mainz gedruckte *Eyn loszbuch ausz der Karten gemacht* (1505–1510). Um 1800 wird Kartenlegen in Paris Mode; die Namen Etteilla und Lenormand stehen für eigene Systeme [Q19].

**Klassifikation:** A für die Spielkarten- und Druckgeschichte. Die Behauptung, Tarot enthalte ein „uraltes ägyptisches Geheimwissen“, ist E – sie ist eine Zuschreibung des 18./19. Jahrhunderts.

**Moderne Nutzung:** Ethnografisch dokumentiert sind professionelle Kartenlegerinnen und -leger auf Esoterikmessen und in privater Praxis, die Lesungen als Form von Selbsthilfe und Beratung organisieren und dabei ethische und interaktionale Grenzen aushandeln [Q20]. Das ist die beste verfügbare Quelle für „wie wird es heute tatsächlich gemacht“ – und sie beschreibt Praxis, nicht Trefferquote.

#### 3.3.3 I Ging

Der Kern ist ein Wahrsagetext aus der Westlichen Zhou-Zeit (*Zhou yi*); die Zusammenstellung in der heutigen Form wird in die Zeit zwischen dem 10. und 4. Jahrhundert v. Chr. datiert, nach Edward Shaughnessys sprachvergleichender Arbeit ins letzte Viertel des 9. Jahrhunderts v. Chr. [Q21]. Das Textkorpus umfasst 64 Hexagramme aus sechs durchgezogenen oder gebrochenen Linien mit Hexagramm- und Linienaussagen; die divinatorische Praxis war kleromantisch (Schafgarbenstängel), die Zuordnung von Zahlen zu Linien ist in der späteren Großen Abhandlung beschrieben [Q21]. Die „Zehn Flügel“ sind deutlich jünger (ca. 300 v. Chr. für die Große Abhandlung) und wurden lange Confucius zugeschrieben, was die Forschung nicht stützt [Q21]. 136 v. Chr. erhob Kaiser Wu von Han den Text zum „Ersten der Klassiker“ [Q21].

**Rezeptionsgeschichte West:** Die wirkmächtigste Übersetzung ist Richard Wilhelms deutsche Fassung (1923), die 1950 von Cary Baynes ins Englische übertragen wurde (Bollingen Series XIX, mit Einleitung von C. G. Jung); ältere Übersetzungen stammen von Legge (1882) und anderen [Q21].

**Klassifikation:** A für Text-, Datierungs- und Rezeptionsgeschichte. Die Behauptung, das I Ging sage Zukunft voraus, ist B (Tradition) bzw. E (als Tatsachenbehauptung).

#### 3.3.4 Runen

Runen sind die alten Schriftzeichen der Germanen; sie waren vom 2. bis 14. Jahrhundert überwiegend für geritzte und gravierte Inschriften in Gebrauch und dienten als Lautzeichen, als Begriffsträger, für Zahlen und als magische Zeichen [Q33]. Für die Divination relevant ist Tacitus, *Germania* 10 (98 n. Chr.): Lose aus Zweigen eines Nussbaums, mit Zeichen versehen, auf ein weißes Tuch geworfen, drei davon gezogen und gedeutet [Q22]. Ob die „Zeichen“ Runen waren, ist ausdrücklich umstritten – Tacitus sagt es nicht [Q22]. Archäologisch gibt es nicht-sprachliche Inschriften und das Wort *alu* sowie den *erilaz* als runenkundige Figur [Q22].

**Moderne Runen-Divination ist ein Produkt des 20. Jahrhunderts:** Systeme speisen sich aus Hermetik, klassischem Okkultismus und dem I Ging [Q22]; als populärer Startpunkt gilt Ralph Blums *The Book of Runes* (St. Martin's Press 1982), das mit einem Beutel Runensteine vermarktet wurde und seitdem lieferbar ist [Q22], [Q23].

**Klassifikation:** A für Schrift- und Nutzungsgeschichte, A für die Tacitus-Stelle, B für die moderne Deutungspraxis. Wichtig für die Redaktion: Die heute verbreiteten Bedeutungstabellen (24 oder 25 Runen, „Rune des Tages“) sind moderne Konstruktionen, keine überlieferte antike Systematik.

#### 3.3.5 Orakelkarten

Orakelkarten sind ein modernes Genre: Decks ohne feste 78-Karten-Struktur, häufig mit Engeln, Tieren, Pflanzen oder Affirmationen, die neben Tarot in zeitgenössischen esoterischen und neopaganen Praktiken verwendet werden [Q20]. Eine belastbare, kontrollierte Forschung zu Orakelkarten wurde in dieser Recherche **nicht** gefunden (siehe Lückenliste, Abschnitt 7). Für das Modul heißt das: als Phänomen des zeitgenössischen Marktes und der Selbsthilfekultur beschreiben (B), keine Wirkaussagen übernehmen (E), und offen sagen, dass hier Forschung fehlt.

#### 3.3.6 Historische Orakelstätten: Delphi

Die Pythia war die Oberpriesterin des Apollon-Tempels in Delphi; der Schrein bestand spätestens im 8. Jahrhundert v. Chr. (einzelne Schätzungen gehen bis 1400 v. Chr. zurück), sie war gegen Ende des 7. Jahrhunderts v. Chr. die führende Instanz und wurde bis ins späte 4. Jahrhundert n. Chr. befragt, bis Theodosius I. den Tempel zerstören ließ [Q24]. Delphi ist damit die am besten dokumentierte religiöse Institution der klassischen Griechen; genannt werden u. a. Herodot, Plutarch, Pausanias, Platon, Sophokles [Q24].

**Die Ethylen-Hypothese und ihre Widerlegung:** 2001 legten de Boer, Hale und Chanton geologische und geochemische Indizien vor, dass der Tempel über sich kreuzenden Verwerfungen liegt und Ethylen aus dem bituminösen Kalkstein austreten konnte – ein Gas, das in niedrigen Dosen Euphorie und Dissoziation erzeugt [Q25]. Die Hypothese wurde außerhalb der Altertumswissenschaft breit rezipiert, ist dort aber bestritten: Lehoux (2007) und Foster & Lehoux (2007) kritisieren Quellenbasis, Dosis-Wirkungs-Annahmen und die Vereinbarkeit mit den antiken Berichten [Q26], [Q27].

**Klassifikation:** A für Institution und Überlieferung, C für die Intoxikationshypothese, D für die Kritik daran. Für das Modul ist das ein Musterbeispiel dafür, wie eine naturwissenschaftlich elegante Erklärung an der Quellenlage scheitern kann – und deshalb als Lehrstück wertvoller als als „gelöstes Rätsel“.

#### 3.3.7 Warum Orakel „treffen“: der Forer-Effekt

Forer zeigte 1949, dass Personen eine allgemeine, für alle gleiche „Persönlichkeitsdiagnose“ als hoch zutreffend für sich selbst bewerteten [Q29]. Das erklärt einen großen Teil der gefühlten Treffsicherheit von Karten-, Pendel- und Orakelantworten, ohne dass eine Informationsübertragung nötig wäre: Der Text ist so allgemein, dass er auf fast alle passt, und die Leserin füllt die Lücken mit ihrem eigenen Kontext.

**Klassifikation:** D. Dieser Mechanismus sollte im Modul nicht als „Entlarvung“ auftreten, sondern als Erklärung, die gleichzeitig den subjektiven Nutzen verständlich macht (Selbstreflexion, Gesprächsanlass).

---

## 4. Claim-Quelle-Matrix

Jede Zeile ist eine Aussage, die im Modul vorkommen soll. „Klasse“ ist die Evidenzklasse, in der sie geschrieben werden darf; „Formulierung“ ist die redaktionell zulässige Fassung.

| Nr. | Aussage | Klasse | Quellen | Redaktionelle Formulierung |
|---|---|---|---|---|
| C01 | Die Vorstellung, eine Rute reagiere auf Metalle, ist ab etwa 1430 belegt | A | Q07 | „Ab dem 15. Jahrhundert…“ |
| C02 | Die katholische Kirche und Luther lehnten das Rutengehen ab | A | Q32 | „…wurde kirchlich als verboten eingestuft“ |
| C03 | Agricola beschreibt Rutengehen 1556 als verbreitete, umstrittene Bergmannstechnik | A | Q07, Q17 | „…beschreibt es als etablierte Praxis und Streitfall“ |
| C04 | 1950 erklärten die Geologischen Landesämter die Rute für unbrauchbar | A | Q07, Q08 | „…in einem veröffentlichten Beschluss“ |
| C05 | Die deutschen Gitterkonzepte (Curry, Benker, Hartmann) entstehen 1952–1954 | A | Q06 | „…wurden in den 1950er-Jahren eingeführt“ |
| C06 | 1986–1988 fanden die Münchner Scheunenversuche statt | A | Q05, Q10 | „…die später heftig umstrittene Studie“ |
| C07 | Enright bestritt 1995 die Auswertung; Betz u. a. widersprachen 1996 | D | Q02, Q04, Q05 | „…eine Einigung wurde nicht erzielt“ (Enright-Argumentation referiert nach Q05) |
| C08 | Kontrollierte Tests zeigen keine über dem Zufall liegende Trefferquote | D | Q01, Q02, Q05, Q12 | „…in den vorliegenden kontrollierten Tests“ |
| C09 | Grundwasser fließt überwiegend flächig, nicht in „Adern“ | D | Q06, Q08 | „…die Ader-Vorstellung ist geologisch nicht haltbar“ |
| C10 | Rutenausschläge lassen sich ideomotorisch erklären | D | Q07, Q13, Q32 | „…als unwillkürliche Muskelbewegung“ |
| C11 | Erdstrahlen und ihre Gesundheitswirkungen sind nicht belegt | E | Q08, Q31 | „…wissenschaftlich nicht nachgewiesen“ |
| C12 | Bovis-Einheiten sind keine physikalische Einheit | E | Q06, Q12 | „…eine Verhältnisskala ohne Messgerät“ |
| C13 | Pendeln über Buchstaben ist für 371 n. Chr. belegt | A | Q09 | „…überliefert bei Ammianus Marcellinus“ |
| C14 | 1942 prüfte die Kriegsmarine Pendel zur U-Boot-Ortung | A | Q15 | „…eine Experimentalgruppe der Marine“ |
| C15 | Antwortkonventionen beim Pendeln sind individuell und variabel | B | Q09 | „…in der Praxis vor der Sitzung festgelegt“ |
| C16 | Die Mehrzahl der Studien spricht gegen Pendeldiagnostik | D | Q09, Q28 | „…in der medizinischen Literatur überwiegend ablehnend bewertet“ |
| C17 | Der Pendelerfolg hängt von Fingerbewegung und Pendellänge ab | D | Q03 | „…im Experiment reproduzierbar“ |
| C18 | Tarot ist ab den 1440er-Jahren als Stichspiel in Norditalien belegt | A | Q16, Q18 | „…zunächst ein Spiel, keine Wahrsagepraxis“ |
| C19 | Die okkulte Aufladung des Tarot beginnt im 19. Jahrhundert | A | Q16 | „…eine Zuschreibung des 19. Jahrhunderts“ |
| C20 | Kartomantie ist ab ca. 1500 gedruckt belegt; Etteilla/Lenormand um 1800 | A | Q19 | „…frühe Losbücher, später Pariser Systeme“ |
| C21 | Das *Zhou yi* ist ein Wahrsagetext der Westlichen Zhou-Zeit (ca. 9. Jh. v. Chr.) | A | Q21 | „…nach Shaughnessy letztes Viertel des 9. Jahrhunderts“ |
| C22 | Wilhelms Übersetzung (1923/1950) prägte die westliche Rezeption | A | Q21 | „…wirkmächtigste Übertragung“ |
| C23 | Runen waren vom 2. bis 14. Jahrhundert in Gebrauch | A | Q33 | „…überwiegend für Inschriften“ |
| C24 | Tacitus beschreibt 98 n. Chr. ein Losorakel mit Zeichen auf Holzstücken | A | Q22 | „…ob es Runen waren, ist umstritten“ |
| C25 | Die moderne Runen-Divination beginnt 1982 mit Blum | A | Q22, Q23 | „…populär wurde sie durch…“ |
| C26 | Orakelkarten sind ein modernes Genre ohne historische Tradition | B | Q20 | „…eine Erscheinung des späten 20. Jahrhunderts“ |
| C27 | Delphi war spätestens ab dem 8. Jh. v. Chr. ein Orakelort | A | Q24 | „…bis ins 4. Jh. n. Chr. konsultiert“ |
| C28 | Die Ethylen-Erklärung ist eine umstrittene Hypothese | C | Q25, Q26, Q27 | „…geologisch plausibel, altertumswissenschaftlich bestritten“ |
| C29 | Der Forer-Effekt erklärt gefühlte Treffsicherheit | D | Q29 | „…eine gut belegte Wahrnehmungsverzerrung“ |

**Prüfregel für die Redaktion:** Jede Aussage, die nicht in dieser Matrix steht und nicht auf eine der 33 Quellen zurückgeführt werden kann, gilt als offene Frage und wird entweder gestrichen oder in Abschnitt 7 (Lücken) eingetragen.

---

## 5. Glossar (deutsch)

Die Definitionen sind für Laien formuliert und an die Quellen angebunden, wo sie Tatsachen behaupten. Begriffe, die nur die Binnensicht beschreiben, sind mit „(Szene)“ markiert.

| Begriff | Definition | Klasse | Quelle |
|---|---|---|---|
| **Radiästhesie** | Sammelbezeichnung für die Vorstellung, Lebewesen könnten Strahlungen von Objekten oder Orten wahrnehmen und über Rute/Pendel anzeigen; von der Wissenschaft als Para-/Pseudowissenschaft eingeordnet. | B/E | Q06 |
| **Wünschelrute** | Meist Y-förmige Astgabel oder gebogener Draht, der auf „Ausstrahlungen“ von Erzen, Wasser, Verwerfungen oder verborgenen Gegenständen reagieren soll. | B | Q07 |
| **Winkelrute** | L-förmige Metallrute, deren Schenkel lose in den Händen liegen und bei „Ausschlag“ nach innen oder außen schwenken. | B | Q07 |
| **Einhandrute / Tensor / Nicker** | Antennenförmige Rute mit Ring oder Kugel am Ende, einhändig geführt; in der Alternativmedizin gebräuchlich. | B | Q07, Q13 |
| **Biotensor** | Handelsübliche Einhandrute mit Griff aus Kristall, Holz oder Kork und flexibler Stahlfeder, die zum „Abtasten“ des Körpers dienen soll. | B | Q13 |
| **Mutung / muten** | Der Vorgang des Aufspürens mit Rute oder Pendel; in der Szene auch für das „Messen“ von Skalenwerten (etwa Bovis). | B | Q06, Q12 |
| **Siderisches Pendel** | Pendel (meist Kegelform, 2–3 cm Körper, ca. 20 cm Schnur), das als Instrument der Radiästhesie und verwandter Lehren dient. | B | Q09 |
| **Eichung (Szene)** | Vorab festgelegte Bedeutung der Pendelbewegungen; kein technisches Kalibrierverfahren, individuell und veränderlich. | B | Q09 |
| **Pendeltafel / Pendeldiagramm** | Gedruckte Skala (Ja/Nein, Zahlen, Buchstaben, Segmente), über der das Pendel gehalten wird, um mehr Antwortoptionen zu erhalten. | B | Q09 |
| **Erdstrahlen / Erdstrahlung** | In der esoterischen Radiästhesie behauptete, gesundheitsschädliche Strahlung aus Wasseradern, Verwerfungen oder Gitternetzen; naturwissenschaftlich nicht nachgewiesen. | E | Q08 |
| **Wasserader** | Behauptete unterirdische Wasserbahn; geologisch irreführend, weil Grundwasser überwiegend flächig fließt. | E | Q06, Q08 |
| **Störfeld / Reizzone** | Bereich, dem eine gesundheitliche Wirkung zugeschrieben wird; in der Szene auch „Reizwert“ genannt. | B | Q06 |
| **Hartmann-Gitter** | 1954/1964 von Ernst Hartmann beschriebenes Rechteckgitter (ca. 2 × 2,5 m) mit wechselnder Polarität; nicht bestätigt. | E | Q06 |
| **Curry-Netz** | 1952 von Manfred Curry publiziertes Diagonalgitter (Vorarbeit Wittmann, 1945–1951), Linienabstand ca. 3,6 m. | E | Q06 |
| **Benker-Kubensystem** | 1953 von Anton Benker postuliertes kubisches Gittersystem mit ca. 10 m Kantenlänge. | E | Q06 |
| **Geopathie** | Anfang des 20. Jahrhunderts eingeführter Begriff für die angeblich gesundheitsschädliche Wirkung bestimmter Orte. | B | Q06 |
| **Bovis-Einheit (BE)** | Skalenwert für eine behauptete „Lebensenergie“; keine physikalische Einheit, kein Messgerät, nicht falsifizierbar. | E | Q06, Q12 |
| **Carpenter-Effekt (ideomotorischer Effekt)** | Unwillkürliche Muskelbewegung, ausgelöst durch die bloße Vorstellung einer Bewegung; erklärt Ruten- und Pendelausschläge. | D | Q07, Q32 |
| **Kohnstamm-Effekt** | Muskelklonus bei angespannter, ungewohnter Haltung; verstärkt bei Zweihandruten die Ausschläge. | D | Q13 |
| **Placebo / Nocebo** | Erwartungsbedingte positive bzw. negative Wirkung ohne spezifischen Wirkstoff; Erklärungsansatz für berichtete Effekte von Entstörgeräten. | D | Q08 |
| **Divination** | Oberbegriff für mantische Verfahren, die verdeckte Information über Zeichen, Lose oder Bilder erschließen sollen. | A | Q20, Q24 |
| **Kleromantie** | Losorakel, bei dem Zufallsergebnisse (Stäbe, Steine, Münzen) gedeutet werden; Grundform des I Ging. | A | Q21 |
| **Kartomantie** | Wahrsagen mit Spielkarten; ab ca. 1500 gedruckt belegt, um 1800 in Paris als Modephänomen. | A | Q19 |
| **Tarot** | 78-Karten-Satz (56 Farbkarten, 21 Trümpfe, Narr), ursprünglich ein Stichspiel des 15. Jahrhunderts; okkulte Deutung erst ab dem 19. Jahrhundert. | A | Q16, Q19 |
| **Große / Kleine Arkana** | In esoterischen Decks: die 21 Trumpfkarten plus Narr bzw. die 56 Farbkarten. | B | Q16 |
| **I Ging (Yijing)** | Chinesischer Wahrsagetext mit 64 Hexagrammen; Kernbestand in der Westlichen Zhou-Zeit entstanden, ab 136 v. Chr. Klassiker. | A | Q21 |
| **Hexagramm** | Figur aus sechs Linien (durchgezogen/gebrochen), Grundeinheit des I Ging. | A | Q21 |
| **Runen** | Schriftzeichen der Germanen (2.–14. Jh.), zugleich Laut-, Begriffs- und magische Zeichen. | A | Q33 |
| **Elder Futhark** | Älteres Runenalphabet, Bezugssystem der modernen Runen-Divination. | A/B | Q22, Q33 |
| **Orakelkarten** | Modernes Deck-Genre ohne feste Struktur (Engel, Tiere, Pflanzen, Affirmationen), meist für Selbstreflexion genutzt. | B | Q20 |
| **Pythia** | Titel der Oberpriesterin des Apollon in Delphi, Orakelinstanz bis ins späte 4. Jh. n. Chr. | A | Q24 |
| **Forer-/Barnum-Effekt** | Überschätzung der Treffsicherheit allgemeiner Aussagen als persönlich zutreffend. | D | Q29 |

**Empfehlung für die Umsetzung:** 24 Begriffe ins Frontend-Glossar übernehmen (die 33 hier sind Rohbestand), jeweils mit Evidenz-Badge. Begriffe der Klasse E brauchen eine sichtbare Einordnung, sonst liest die Seite wie eine Bestätigung.

---

## 6. Content-Outline mit Längenbudget und Quellenzuordnung

Annahmen: Zielgruppe Einsteiger mit Interesse an Kulturgeschichte; Ton „Wissensmagazin/Museum“; jede Seite mit Evidenz-Badges, Quellenfuß und interner Verlinkung. Wortbudgets sind Richtwerte für den Fließtext ohne Quellenapparat.

### 6.1 Cluster A – Radiästhesie

| # | Abschnitt | Wörter | Quellen | Klasse | Interaktiv |
|---|---|---|---|---|---|
| A1 | „Was ist Radiästhesie?“ – Begriff, Binnensicht, wissenschaftliche Einordnung | 450 | Q06, Q08, Q10 | B/E | – |
| A2 | Geschichte I: Bergleute, Kirche, Aufklärung (1430–1700) | 700 | Q07, Q17, Q32 | A | Zeitstrahl |
| A3 | Geschichte II: Von der „Strahlenfühligkeit“ zur Radiästhesie (1800–1945) | 700 | Q06, Q10, Q15 | A | Zeitstrahl |
| A4 | Geschichte III: Nachkriegszeit, Gitterkonzepte, Münchner Experimente | 700 | Q05, Q06, Q07, Q10 | A/D | – |
| A5 | Wünschelrute, Winkelrute, Einhandrute – Instrumentenkunde | 600 | Q07, Q13, Q17 | B | SVG-Schema |
| A6 | Erdstrahlen, Wasseradern, Gitter – die Behauptungen im Detail | 750 | Q06, Q08 | B | Karte „Störfeld-Landkarte“ |
| A7 | Was die Geologie sagt | 500 | Q01, Q06, Q08 | D | – |
| A8 | Bovis-Skalen: Ordnungsschema oder Messung? | 450 | Q06, Q12 | E | Bovis-Skalen-Demo (klar als Spielmarke) |

**Cluster A gesamt:** ca. 4.850 Wörter.

### 6.2 Cluster B – Pendeln

| # | Abschnitt | Wörter | Quellen | Klasse | Interaktiv |
|---|---|---|---|---|---|
| B1 | Was ein Pendel ist und was es in der Praxis tun soll | 400 | Q09 | B | – |
| B2 | Geschichte: von Ammianus Marcellinus bis zur Kriegsmarine | 650 | Q09, Q15 | A | Zeitstrahl |
| B3 | Pendelarten und Materialien (Tropfen, Isis, Triangel, Resonanz) | 550 | Q09 | B | Galerie/SVG |
| B4 | Pendeln „lernen“: Ablauf, Eichung, Fragetechnik | 600 | Q09 | B | Schritt-für-Schritt |
| B5 | Pendeltafeln und Antwortskalen | 550 | Q09, Q12 | B/E | Tafel-Studio (ESOW-RAD-08) |
| B6 | Biotensor und Einhandrute in der Alternativmedizin | 500 | Q13 | B/E | – |
| B7 | Kartenpendeln und Fernmutung | 400 | Q17 | B | Karten-Demo |
| B8 | Der Mechanismus: Carpenter-, Kohnstamm-Effekt, Chevreul-Täuschung | 650 | Q03, Q07, Q13 | D | Pendelsimulator (ESOW-RAD-07) |
| B9 | Forschungsstand: was kontrollierte Tests zeigen | 600 | Q02, Q05, Q09, Q28 | D | – |
| B10 | Selbst testen: das verblindete Pendellabor | 350 | Q02, Q31 | D | Experimentlabor (ESOW-RAD-09) |

**Cluster B gesamt:** ca. 5.250 Wörter.

### 6.3 Cluster C – Orakel

| # | Abschnitt | Wörter | Quellen | Klasse | Interaktiv |
|---|---|---|---|---|---|
| C1 | Divination: warum Menschen Zeichen lesen | 450 | Q20, Q29 | A/D | – |
| C2 | Tarot I: ein Spiel des 15. Jahrhunderts | 600 | Q16, Q18 | A | Kartenvergleich historisch/modern |
| C3 | Tarot II: Kartomantie und Okkultismus (1780–1900) | 550 | Q16, Q19 | A | – |
| C4 | Tarot III: moderne Praxis und Selbsthilfe | 450 | Q20 | B | – |
| C5 | I Ging: Text, Hexagramme, Schafgarbenorakel | 700 | Q21 | A | Hexagramm-Explorer |
| C6 | I Ging: der Weg in den Westen (Wilhelm, Jung, 1960er) | 450 | Q21 | A | – |
| C7 | Runen: Schrift, Magie, Missverständnisse | 650 | Q22, Q33 | A | Runen-Steckbriefe |
| C8 | Runen: die Erfindung der Runen-Divination im 20. Jahrhundert | 450 | Q22, Q23 | A/B | – |
| C9 | Orakelkarten: ein Genre ohne Geschichte – und ohne Forschung | 400 | Q20 | B | – |
| C10 | Delphi: Institution, Ritual, Politik | 600 | Q24 | A | Karte/Zeitstrahl |
| C11 | Delphi: das Ethylen-Rätsel und warum es strittig bleibt | 550 | Q25, Q26, Q27 | C/D | Pro/Contra-Box |
| C12 | Warum Orakel treffen (und wann nicht) | 450 | Q29 | D | Forer-Demo |

**Cluster C gesamt:** ca. 6.300 Wörter.

### 6.4 Querschnittsseiten

| # | Abschnitt | Wörter | Quellen | Zweck |
|---|---|---|---|---|
| X1 | Modul-Einstieg/Landingpage | 400 | Q01, Q05, Q06, Q16, Q24 | Neugier + Einordnung |
| X2 | Methodik & Evidenzklassen (Transparenzseite) | 500 | dieses Dossier | Glaubwürdigkeit |
| X3 | Glossar | 700 | Abschnitt 5 | Orientierung |
| X4 | Quellen & Literatur | 300 + Liste | Q01–Q33 | Nachprüfbarkeit |
| X5 | Redaktioneller Hinweis (Disclaimer) | 200 | – | Recht/Sorgfalt |

**Gesamtumfang:** ca. 18.500 Wörter Fließtext. Bei 900–1.200 Wörtern je Themenseite (Vorgabe des Writer-Tasks) entspricht das etwa 16–20 Seiten; die Cluster sollten daher als je *eine* lange Seite plus Unterseiten geschnitten werden (Vorschlag: A in 3 Seiten, B in 3, C in 4).

### 6.5 Redaktionelle Leitplanken je Abschnitt

1. **Keine Wirkversprechen.** Formulierungen wie „hilft“, „heilt“, „schützt“ nur im Zitat und in Anführungszeichen, mit Klassenmarke B.
2. **Keine medizinischen, finanziellen oder sicherheitsbezogenen Empfehlungen** – auch nicht negativ formuliert („lassen Sie Ihr Bett nicht umstellen“ ist eine Empfehlung).
3. **Binnensicht zuerst, Einordnung danach.** Der Leser soll verstehen, was Praktizierende tun und warum, bevor er die Einordnung liest. Sonst wirkt die Seite wie eine Abwehr.
4. **Zahlen nur mit Quelle und Bezugsgröße.** Keine „Studien zeigen zu 95 %…“-Sätze ohne Studie.
5. **Datierungskonflikte benennen** statt glätten (Beispiel Bouly 1926/1931).
6. **Bild-/Rechtehinweis:** Für Bilder gilt der separate Medien-Task; dieses Dossier liefert keine Bildrechte.

---

## 7. Falsifikationstests für die prüfbaren Behauptungen

Das Master-Task verlangt, für überprüfbare Wirkungsbehauptungen geeignete Tests abzuleiten. Diese sechs Protokolle sind so formuliert, dass sie im geplanten Experimentiermodul (ESOW-RAD-09) umgesetzt werden können. Gemeinsame Regeln: Zielgröße, Abbruchregel und Auswertung **vor** dem ersten Versuch festlegen; Ziel verdeckt; Antwort vor Offenlegung speichern; alle Versuche zählen (keine Nachlese).

| Test | Behauptung | Design | Auswertung | Erwartung nach Evidenzlage |
|---|---|---|---|---|
| T1 | „Ich finde Wasser mit der Rute“ | 10 Behälter, einer mit Wasser, Position per Zufall; 20 Durchgänge, doppelblind | Trefferquote gegen 10 % (bzw. 1/10), Binomialtest, 95 %-KI | Kein Unterschied zu Zufall [Q01], [Q02] |
| T2 | „Mein Pendel antwortet richtig auf Ja/Nein“ | Zufallsgenerator stellt 30 Ja/Nein-Fragen mit verdecktem Ergebnis; Konvention vorher schriftlich fixiert | Trefferquote gegen 50 %, Binomialtest | Kein Unterschied [Q05], [Q09] |
| T3 | „Ich spüre Störfelder unter dem Bett“ | Zwei identisch präparierte Schlafplätze, einer mit Attrappe eines „Störfelds“ (z. B. Metallplatte), Position randomisiert, 12 Urteile | Trefferquote gegen 50 % | Kein Unterschied [Q08] |
| T4 | „Ich messe Bovis-Werte zuverlässig“ | Drei Mutende bewerten 10 Objekte je dreimal, verblindet gegeneinander | Interrater-Reliabilität (ICC) und Intrarater-Stabilität | Nach Konstruktion keine Messgröße, daher keine Stabilität zu erwarten [Q06], [Q12] |
| T5 | „Fernmutung über Karte funktioniert“ | 8 verdeckte Orte auf einer Karte, Ziel per Zufall, 16 Durchgänge | Trefferquote gegen 12,5 % | Kein Unterschied [Q17], [Q05] |
| T6 | „Das Orakel sagt Zukünftiges voraus“ | 20 konkrete, binäre Vorhersagen mit Frist; Auflösung nach Frist; Vergleich mit Basisrate | Kalibrierung (Brier-Score) statt nur Trefferzahl | Überschätzung der Treffer, Erklärung über Forer-Effekt [Q29] |

**Wichtig für die Umsetzung:** Ein Test, der „nichts zeigt“, ist kein Beweis, dass niemand etwas kann – er zeigt, dass die Behauptung in dieser Prüfung nicht sichtbar wurde. Diese Formulierung ist im UI zwingend, sonst entsteht eine Scheindiskussion.

---

## 8. Offene Fragen und Recherchelücken

1. **Datierung der Begriffsprägung „Radiästhesie“:** 1926 [Q10] gegen „um 1931“ [Q06]. Für eine belastbare Klärung wäre die französische Originalpublikation Boulys einzusehen (Fernleihe/Gallica). Bis dahin: ungenaue Formulierung verwenden.
2. **Deutschsprachige klinische Studien zu Pendeldiagnostik:** Keine peer-reviewte kontrollierte Studie gefunden; Q28 ist ein Übersichtsbeitrag mit Registrierungsschranke. Der Forschungsstand wird über Q09 und Q28 referiert, nicht über eine Primärstudie.
3. **Orakelkarten:** Keine kontrollierte Forschung gefunden. Die Aussage „hier fehlt Forschung“ ist selbst eine Recherche-Aussage dieses Dossiers (kein Zitat) und sollte im Text als solche kenntlich gemacht werden.
4. **Geschichte des Pendelns zwischen Antike und 19. Jahrhundert:** Die Darstellung springt von 371 [Q09] zur Neuzeit. Eine belastbare Überlieferungskette (Mittelalter, Frühe Neuzeit) konnte in dieser Recherche nicht belegt werden.
5. **Regionale Unterschiede der Praxis** (z. B. französische vs. deutsche Terminologie, Rolle der Wünschelrute in der Sowjetunion/den USA) sind nur angerissen; für einen eigenen Abschnitt fehlen Quellen.
6. **Zwei journalistische Quellen ohne Datum** (Q13, Q14). Verwendbar für Praxisbeschreibung und Verbraucherschutzposition, nicht für Historisches.
7. **Nicht geprüft:** Die englischsprachige Wikipedia-Quelle Q22 ist selbst mit Belegmängeln markiert; die Tacitus-Passage ist dort zitiert, die Übersetzung aber nicht gegen eine kritische Edition kollationiert.
8. **Enright (Q02) nicht im Volltext gelesen:** Der DOI ist registriert, die Verlagsseite liefert 404. Die Kritik an den Münchner Versuchen wird deshalb über Q05 referiert. Wer die Argumentation im Detail wiedergeben will (z. B. für einen eigenen Abschnitt „Die Scheunenversuche“), muss den Aufsatz über eine Bibliothek beschaffen.
9. **Keine Primärquelle zu den Münchner Versuchen selbst:** Der „Wünschelruten-Report“ (Betz/König 1989, Eigenverlag) wurde nicht beschafft; die Existenz und das Datum sind über Q05 und Q10 belegt, der Inhalt nicht.

---

## 9. Übergabehinweise für die Folgetasks

**Für ESOW-RAD-06 (Redaktion, `writer`):**
- Zitiere mit den IDs `[Q01]`…`[Q33]`; die Zuordnung steht in `quellen.json` und in Abschnitt 2. Übernimm keine Aussage, die nicht in Abschnitt 4 (Matrix) steht, ohne sie vorher zu belegen.
- Nutze die Wortbudgets aus Abschnitt 6; sie sind an die Vorgabe „800–1.200 Wörter je Themenseite“ angepasst.
- Jede Seite endet mit dem redaktionellen Hinweis (Tradition vs. Evidenz), nicht mit einer Wiederholung der Kritik.
- Keine erfundenen Quellen, keine erfundenen Seitenzahlen, keine „Studien“ ohne DOI.

**Für ESOW-RAD-04 (UX, `design_web_layout`):**
- Evidenz-Badges A–E aus Abschnitt 1.3 sind Teil der Komponentenbibliothek (Abschnittskopf oder Randnotiz).
- Der Interessenvermerk gehört in die Quellenbox, nicht in den Fließtext.
- Disziplin im Layout: Die Orakel-Seiten dürfen nicht wie die Radiästhesie-Seiten aussehen, sonst verschwimmt die Trennung von Instrument und Zeichen.

**Für ESOW-RAD-07/08/09 (Interaktive Module):**
- Die Tests T1–T6 (Abschnitt 7) sind die fachliche Spezifikation des Experimentlabors.
- Der Pendelsimulator darf keine Informationsausgabe suggerieren; er zeigt Mechanik (Q03), nicht Bedeutung.
- Das Tafel-Studio setzt Pendeldiagramme als Gestaltungselement um; die Beschriftung ist frei, die Semantik bleibt beim Nutzer [Q09].

**Für die QA (ESOW-RAD-13):**
- Prüfpunkte: Jede Behauptung hat eine ID; keine Klasse-E-Aussage steht ohne Einordnung; keine medizinische Empfehlung; Quellen-URLs erreichbar (Stichprobe); Datierungskonflikte sichtbar.

---

## 10. Prüf- und Änderungsprotokoll

| Zeitpunkt | Schritt | Ergebnis |
|---|---|---|
| 2026-11-02 | Crossref-Abfrage der beiden DOI-Anker aus dem Master-Task (Q02, Q03) | beide DOIs bestätigt, Titel/Autoren/Jahr/Band/Seiten übernommen |
| 2026-11-02 | Crossref-Abfragen zu Delphi-Kontroverse, Betz-Erwiderung, Forer, Lavin | Q04, Q25, Q26, Q27, Q29, Q20 bestätigt |
| 2026-11-02 | Volltextabruf USGS, anomalistik.de, GWUP-Blog, Psiram, Wikipedia (de/fr/en), Britannica, SZ, haus.de, Met, Zeitschrift für Anomalistik (PDF), Ärzteblatt | gelesen; Zitate und Datierungen aus diesen Seiten entnommen |
| 2026-11-02 | Bibliothekskatalog lobid/hbz | ISBN/Publikationsdaten für Q31 bestätigt |
| 2026-11-02 | Prüfung der journalistischen Datumsangaben | Q13/Q14 ohne Datum → als „o. J.“ geführt |
| 2026-11-02 | HTTP-Zugriffsprüfung der DOI-Links (`curl -L`) | Q03, Q04, Q26 liefern 200; Q20, Q27, Q29, Q25 liefern 403 (Verlags-Bot-Schutz, DOI dennoch registriert); Q02 liefert 404 beim Verlag → als Zugriffsproblem dokumentiert |
| 2026-11-02 | Konsistenzprüfung IDs | Alle im Text verwendeten IDs existieren in `quellen.json`; jede der 33 Quellen wird mindestens einmal zugeordnet. Prüfbefehl (bash, im Ordner `recherche`): `comm -13 <(grep -o '"id": "Q[0-9][0-9]"' quellen.json \| grep -o 'Q[0-9][0-9]' \| sort -u) <(grep -o 'Q[0-9][0-9]' 00-quellenbasis-radiaesthesie-pendeln-orakel.md \| sort -u)` – Ausgabe leer = keine Phantom-IDs; die Umkehrung (`comm -23`) ebenso leer = keine unzitierten Quellen. JSON-Syntax mit `python -m json.tool quellen.json` geprüft. |

**Reproduktion:** `quellen.json` ist die Single Source of Truth. Wer eine Quelle ergänzt, vergibt die nächste freie ID, trägt `verified` ein (nicht „true“, sondern *wie* geprüft wurde) und aktualisiert die Matrix in Abschnitt 4, falls eine neue Kernaussage entsteht.

**Bekannte Schwäche dieses Dossiers:** Es stützt sich für Ideen- und Institutionengeschichte der Radiästhesie streckenweise auf Enzyklopädien (Q06–Q10, Q32, Q33), weil die einschlägigen Fachbücher (Q30, Q31) im Volltext nicht vorlagen. Für die Publikation sollte mindestens Q30 (Prokop/Wimmer) im Lesesaal oder als Fernleihe gegengelesen werden; die Enzyklopädien sind Wegweiser, keine Endbelege.

---

*Ende des Dokuments. Quellenbasis: 33 Einträge – 8 peer-reviewte DOI-Aufsätze, 3 Bücher (ISBN), 4 Behörden-/Museums-/Fachzeitschriftenquellen, 13 Enzyklopädieartikel, 2 journalistische Quellen, 2 Skeptiker-Webquellen, 1 fachliche Online-Übersicht.*
