# Frequenzen: Quellen, Evidenzstatus und Methodik

Stand: 2026-11-02 · Datenbestand: [`data/frequencies.json`](../data/frequencies.json) · Vertragstest: [`tests/frequencies-data.cjs`](../tests/frequencies-data.cjs)

Dieses Dokument belegt für jeden Eintrag des Frequenzlabors, **woher die Zahl kommt**, **was genau behauptet wird** und **wie belastbar diese Behauptung ist**. Es ist die Prüfspur zum Datensatz, nicht die Nutzeroberfläche: Die UI zeigt `beschreibung_kurz`, `evidenzstatus`, `quelle_url` und den Disclaimer; die vollständige Herleitung steht hier.

---

## 1. Zweck und Geltungsbereich

Der Datenbestand versorgt das interaktive Frequenzlabor mit Presets. Er trennt strikt zwei Dinge, die in Esoterik-Angeboten üblicherweise vermischt werden:

| Kategorie | Bedeutung | Beispiel |
|---|---|---|
| `physikalisch` | Akustisch, physiologisch oder metrologisch messbar; durch Norm, Lehrbuch oder begutachtete Primärliteratur gestützt | Hörbereich, EEG-Bänder, ISO-16-Stimmton, Schwebung |
| `esoterisch` | Überlieferte, numerologisch hergeleitete oder kommerziell populär gewordene Zuordnung | Solfeggio-Skala, Planetenfrequenzen, 432 Hz |

Die Kategorie sagt **nichts über die Wirksamkeit** aus. Auch ein physikalisch belegter Wert (z. B. 7,83 Hz Schumann-Resonanz) ist keine Aussage darüber, dass seine Wiedergabe gesundheitlich wirkt. Umgekehrt ist ein esoterischer Wert nicht automatisch „falsch“ – er ist nur nicht empirisch begründet, und genau das steht in `evidenzstatus`.

**Nicht enthalten** sind Heilversprechen, Wirkaussagen oder Anwendungsempfehlungen. Der Vertragstest erzwingt das (siehe § 10).

---

## 2. Suchstrategie und Aufnahmekriterien

**Prüfdatum:** 2026-11-02 (alle URLs an diesem Tag abgerufen und auf Inhalt geprüft).

**Quellentypen, in dieser Rangfolge:**

1. Normen und Behörden (ISO, NIH/NIBIB, WHO, NASA)
2. Begutachtete Primärliteratur (Nature, PLOS ONE, Frontiers, Springer, PubMed/PMC)
3. Lehrbücher mit offener Lizenz (OpenStax College Physics 2e, University Physics Vol. 1)
4. Primärtexte der Esoterik-Szene selbst (das Buch von 1999, Coustos Originalbroschüre) – für die Frage, *was* behauptet wird
5. Musikhistorische Nachschlagewerke (Concise Oxford Dictionary of Music) für Stimmton-Historie

**Aufnahmekriterien je Eintrag:**

- Der Wert ist eine konkrete Frequenz oder ein klar begrenzter Bereich.
- Es existiert eine Quelle, die den Wert **selbst** nennt – nicht nur eine Sekundärmeldung über ihn.
- Die Kurzbeschreibung ist ohne Wirkversprechen formulierbar.
- Wo eine Wirkung behauptet wird, ist der Status `nicht belegt`, `plausibel` oder `traditionell` und die behauptende Quelle ist genannt.

**Ausschlusskriterien:**

- Werte ohne auffindbare Primärquelle (siehe § 7).
- Werte, die nur als Werbeversprechen existieren (z. B. „111 Hz – Klang der Tempel von Malta“).
- Doppelte Einträge mit identischem Zahlenwert und identischer Aussage.

**Bewertungsregel für `nicht belegt`:** Der Status bedeutet „in der geprüften Literatur keine kontrollierte Evidenz für die konkrete Behauptung gefunden“. Das ist eine Negativfeststellung über den Suchstand, keine Widerlegung. Deshalb nennt § 5 bei diesen Einträgen zusätzlich, welche Studien es *gibt* und warum sie nicht tragen.

---

## 3. Evidenzstatus im Einzelnen

| Status | Entscheidungsregel | Im Datensatz |
|---|---|---|
| `belegt` | Norm, Lehrbuch oder begutachtete Studie stützt die Aussage direkt; bei Messwerten reproduzierbar | 16 Einträge |
| `plausibel` | Erste empirische Hinweise (Pilotstudien, Tiermodelle), aber keine belastbare Bestätigung am Menschen | 2 Einträge |
| `nicht belegt` | Behauptung existiert, kontrollierte Evidenz fehlt | 6 Einträge |
| `traditionell` | Zuordnung ist überliefert/gesetzt; Rechenregel nachvollziehbar, Bedeutung esoterisch | 8 Einträge |

Summe: 32 Einträge, davon 17 `physikalisch` und 15 `esoterisch`.

Zwei Regeln, die der Test maschinell prüft:

- Ein Eintrag der Kategorie `esoterisch` darf **nie** `belegt` sein.
- Jeder Eintrag mit `plausibel`, `nicht belegt` oder `traditionell` muss `warnhinweis: true` tragen.

---

## 4. Datenschema

```json
{
  "id": "string, eindeutig, slug",
  "name": "Anzeigename",
  "hz": 440,
  "range_hz_min": 440,
  "range_hz_max": 440,
  "kategorie": "physikalisch | esoterisch",
  "unterkategorie": "hoeren | eeg | stimmton | akustik | resonanz | solfeggio | planetarisch",
  "evidenzstatus": "belegt | plausibel | nicht belegt | traditionell",
  "beschreibung_kurz": "max. 200 Zeichen, ohne Wirkversprechen",
  "quelle_titel": "Kurzzitat der Quelle",
  "quelle_url": "https://…",
  "partner_hz": null,
  "warnhinweis": true
}
```

Konventionen:

- **Einzelton:** `hz` gesetzt, `range_hz_min = range_hz_max = hz`.
- **Bereich:** `hz = null`, Grenzen gesetzt (Hörbereich, EEG-Bänder, historische Kammertöne).
- **Schwebungs-Demo:** `hz` ist der Grundton, `range_hz_max` und `partner_hz` der zweite Ton; die Differenz ist die Schwebungsfrequenz (440/444 → 4 Hz).
- `warnhinweis` markiert Einträge, bei denen die UI den Hinweis „keine Wirkaussage“ bzw. einen Lautstärkehinweis einblenden muss.

---

## 5. Claim-Quelle-Matrix

Legende: **Q** = Quelle im Datensatz, **Prüfung** = was beim Abruf tatsächlich im Text stand.

### 5.1 Physikalisch / physiologisch

| id | Behauptung | Status | Q | Prüfung / Anmerkung |
|---|---|---|---|---|
| `hoerbereich-mensch` | 20 Hz–20 kHz Hörbereich; darunter Infraschall, darüber Ultraschall | belegt | [1] | Wörtlich: „Normal human hearing encompasses frequencies from 20 to 20,000 Hz… Sounds below 20 Hz are called infrasound, whereas those above 20,000 Hz are ultrasound.“ |
| `infraschall` | < 20 Hz ist bei hohen Pegeln hörbar | belegt | [2] | „infrasound is audible as well, provided that the sound level is high enough“; Schwellen ~86–90 dB bei 16 Hz, ~101–104 dB bei 8 Hz. |
| `ultraschall-medizin` | > 20 kHz, medizinische Wandler im MHz-Bereich | belegt | [3] | „frequencies above the threshold of human hearing (above 20KHz), but most transducers … operate at much higher frequencies (in the megahertz (MHz) range)“ |
| `eeg-delta` | 0,5–4 Hz | belegt | [4] | Review nennt Delta-Start 0–2 Hz, Ende 3,5–6 Hz; empfiehlt < 4 Hz. Grenzen sind konsensual, nicht genormt. |
| `eeg-theta` | 4–8 Hz | belegt | [4] | Typisch 4–7,5 Hz; einzelne Arbeiten 2,5–8 Hz. |
| `eeg-alpha` | 8–13 Hz | belegt | [4] | 85 % der Studien nutzen 8–13 Hz; Streuung 6–14 Hz. |
| `eeg-beta` | 13–30 Hz | belegt | [4] | Beginn 12–15 Hz, Ende 20–50 Hz. |
| `eeg-gamma` | 30–45 Hz | belegt | [4] | Typisch 30–40 Hz, Bereich bis 100 Hz; Grenze am uneinheitlichsten. |
| `schwebung-440-444` | Schwebungsfrequenz = Differenz der Töne | belegt | [5] | „f_B = \|f_1 − f_2\|“; Lautstärke schwankt mit dieser Rate. |
| `binaurale-schwebung` | Getrennte Ohren → Differenzton (4 Hz) | belegt | [6] | Definition im Review; **Wahrnehmung** belegt, **Wirkung** umstritten (§ 6.4). |
| `harmonische-obertonreihe` | Ganzzahlige Vielfache des Grundtons | belegt | [7] | „resonant frequencies that are integral multiples of the fundamental are collectively called harmonics“ |
| `kammerton-440` | A4 = 440 Hz ± 0,5 Hz | belegt | [8] | ISO-16-Abstract wörtlich: „shall be 440 Hz … within an accuracy of 0,5 Hz“; 2022 bestätigt. |
| `orchesterstimmung-442` | Viele europäische Orchester: 442 Hz | belegt | [9] | „most symphony orchestras on the European continent today use 442 Hz“ (ISO Focus 2012). |
| `kammerton-historisch` | 1700–1850: A zwischen 415 und 429 Hz | belegt | [10] | „Between 1700 and 1850, the note A varied between 415 and 429.“ |
| `kammerton-435` | 1859 Paris: 435 Hz (diapason normal) | belegt | [10] | „the standard of 435 (diapason normal) fixed in Paris in 1859 and confirmed in Vienna in 1885“ |
| `schumann-783` | 1. Modus bei 7,83 Hz; Frequenz schwankt | belegt | [11] | „Their frequencies lie at 7.83 Hz (fundamental), 14.3, 20.8, 27.3 and 33.8 Hz“; „vary from day to day, even hourly“. Kein Hörschall. |
| `gamma-40-stimulation` | 40 Hz reduziert Amyloid **im Mausmodell** | plausibel | [12] | Mausstudie (optogenetisch und 40-Hz-Flimmern); **keine** belegte Therapie am Menschen. |

### 5.2 Esoterisch / traditionell

| id | Behauptung | Status | Q | Prüfung / Anmerkung |
|---|---|---|---|---|
| `solfeggio-396` | „Ut“ 396 Hz, löst Schuld/Angst | nicht belegt | [13] | Wert und Zuschreibung stehen im Primärtext (Abb. 5.6, S. 177); Belege für die Wirkung fehlen. |
| `solfeggio-417` | „Re“ 417 Hz, Wandel/Reinigung | nicht belegt | [13] | Dito. |
| `solfeggio-528` | „Mi“ 528 Hz, DNA-Reparatur | nicht belegt | [13] | Primärtext: „the exact frequency used by genetic engineers … to repair DNA“ – unbelegt; einzige Studie ist Zellkultur (§ 6.5). |
| `solfeggio-639` | „Fa“ 639 Hz, Beziehungen | nicht belegt | [13] | Dito. |
| `solfeggio-741` | „Sol“ 741 Hz, Ausdruck/Entgiftung | nicht belegt | [13] | „Entgiftung durch Töne“ ist kein anerkannter physiologischer Vorgang. |
| `solfeggio-852` | „La“ 852 Hz, Intuition | nicht belegt | [13] | Dito. |
| `stimmton-432` | 432 Hz sei „natürlicher“/gesünder | plausibel (kleiner Effekt) | [14] | Autoren selbst: „no scientific studies that support this hypothesis“; ihre Pilotstudie: −4,79 bpm (p = 0,05), n klein. |
| `cousto-erdtag` | 194,18 Hz = Erdentag | traditionell | [15] | Rechnung reproduziert (§ 6.6); Deutung esoterisch. |
| `cousto-erdjahr` | 136,10 Hz = Erdjahr („Om“) | traditionell | [15] | Dito. |
| `cousto-mond-synodisch` | 210,42 Hz = synodischer Monat | traditionell | [15] | Dito. |
| `cousto-merkur` | 141,27 Hz | traditionell | [15] | Dito. |
| `cousto-venus` | 221,23 Hz | traditionell | [15] | Dito. |
| `cousto-mars` | 144,72 Hz | traditionell | [15] | Dito. |
| `cousto-jupiter` | 183,58 Hz | traditionell | [15] | Dito; der Shop führt abweichend 183,80 Hz (§ 6.6). |
| `cousto-saturn` | 147,85 Hz | traditionell | [15] | Dito. |

---

## 6. Einzelprüfungen

### 6.1 EEG-Bänder: Warum Bereiche und keine Punktwerte

Die Grenzen der EEG-Bänder sind **Konvention, nicht Messgröße**. Das Review [4] hat 184 Studien ausgewertet und zeigt: Die jeweils häufigste Definition deckt nur 30–50 % der Publikationen ab. Delta beginnt zwischen 0 und 2 Hz und endet zwischen 3,5 und 6 Hz; Beta endet zwischen 20 und 50 Hz. Empfohlen wird ein nicht überlappendes Schema (Delta < 4, Theta 4–7,5, Alpha 7,5–12,5, Beta 12,5–30, Gamma 30–40 Hz).

Der Datensatz nutzt die verbreitete Lehrbuchvariante (0,5–4 / 4–8 / 8–13 / 13–30 / 30–45 Hz) und benennt die Streuung in der Beschreibung. Ein Preset „Alpha 10 Hz“ ist damit ein **Beispielwert innerhalb** eines Bandes, keine Norm.

Wichtig für die UI: Die Zuordnung „Band X = Zustand Y“ ist eine statistische Korrelation über Gruppen, keine Steuerungsanweisung. Aus dem Abspielen von 10 Hz folgt keine Alpha-Aktivität (siehe 6.4).

### 6.2 Hörbereich und Infraschall

20 Hz–20 kHz ist die übliche Lehrbuchangabe [1]. Die obere Grenze ist altersabhängig und individuell; die untere Grenze ist keine Hörschwelle, sondern eine Konvention: Unter 20 Hz existiert keine genormte Hörschwelle, und tiefe Töne sind bei ausreichendem Pegel hörbar [2]. Der Datensatz gibt Infraschall deshalb als Bereich 0,1–20 Hz mit `warnhinweis: true` aus – nicht weil Infraschall gefährlich wäre, sondern weil die Aussage „unhörbar“ falsch ist und die UI keine Körperempfindungs-Versprechen machen soll.

Pegelangaben (86–90 dB bei 16 Hz) stammen aus [2]; sie dienen der Einordnung, nicht als Einstellwert. Das Labor begrenzt die Ausgabe auf −20 dBFS und clampt auf 20–20.000 Hz – Infraschall und Ultraschall sind damit **nicht** abspielbar. Das ist beabsichtigt: Ein Browser-Lautsprecher kann diese Bereiche ohnehin nicht sauber wiedergeben, und die Daten dienen der Erklärung, nicht der Beschallung.

### 6.3 Stimmton-Historie

- **440 Hz** ist die einzige genormte Zahl: ISO 16:1975, 2022 bestätigt, Toleranz 0,5 Hz [8].
- **442 Hz** ist Praxis, nicht Norm: ISO beschreibt 2012, dass kontinentaleuropäische Sinfonieorchester höher stimmen, während UK/USA/Japan bei 440 Hz bleiben [9]. Die 2025er-Studie zu 432 Hz nennt für deutsche Berufsorchester 443 Hz [16] – die Angabe schwankt also je Orchester.
- **435 Hz** war die erste gesetzliche Festlegung (Paris 1859, Wien 1885) [10].
- **415–429 Hz** ist der historische Bereich für 1700–1850 [10]. Der Wert 415 Hz wird heute in der Alte-Musik-Praxis als Referenz verwendet; diese Konvention stammt aus dem 20. Jahrhundert und ist im Datensatz nur als Bereichsgrenze abgebildet, nicht als historische Messung.

Konsequenz für die UI: 440 Hz als „Standard“ kennzeichnen, 415/432/435/442 als historische bzw. alternative Stimmungen – ohne Wertung „richtig/falsch“.

### 6.4 Schwebung, binaurale Beats und die Entrainment-Frage

**Physik (belegt):** Zwei Töne mit den Frequenzen f₁ und f₂ erzeugen eine Amplitude, die mit |f₁ − f₂| schwillt [5]. Bei 440 + 444 Hz sind das 4 Schwellungen pro Sekunde. Das ist Addition von Wellen, keine Hirnleistung.

**Binaurale Beats (Wahrnehmung belegt, Wirkung offen):** Werden die Töne getrennt auf die Ohren gegeben, entsteht der Differenzton im Hörsystem [6]. Ob daraus eine messbare Veränderung der Hirnaktivität folgt („Brainwave Entrainment“), ist **nicht geklärt**: Das systematische Review [6] fand 14 geeignete Studien – 5 stützen die Entrainment-Hypothese, 8 widersprechen ihr, 1 gemischt. Für das Beta-Band fand keine Studie einen Effekt.

**Metastudien zu Wirkungen:** Eine Metaanalyse über 22 Studien berichtet einen mittleren Effekt (g = 0,45) auf Kognition, Angst und Schmerzwahrnehmung [17]; eine spätere Metaanalyse über 15 Studien kommt auf g = 0,40 für Gedächtnis und Aufmerksamkeit, betont aber heterogene Befunde [18]. Solche Effekte sind mit Erwartung, Entspannung und Studiendesign konfundiert. Der Datensatz führt deshalb **keinen** Eintrag „Beta-Beats verbessern Fokus“; die Schwebungs-Einträge beschreiben ausschließlich die Akustik.

### 6.5 Solfeggio: Primärquelle und Beweislage

**Herkunft.** Die sechs Töne stehen in Abb. 5.6 (S. 177) des Buches von 1999 [13], wörtlich:

> „1.Ut=396=9  2. Re =417 =3  3. Mi = 528 =6  4. Fa = 639 = 9  5. Sol =741 = 3  6. La = 852 = 6“

Die Herleitung ist im Buch selbst dokumentiert: Versnummern aus Numeri 7, 12–83, per „pythagoreischer“ Quersumme auf eine Ziffer reduziert, dann als Hertz gelesen. Es handelt sich also **nicht** um eine mittelalterliche Tonleiter, sondern um eine Konstruktion des 20. Jahrhunderts; die Silben Ut/Re/Mi/Fa/Sol/La stammen aus der Solmisation, die Zahlen nicht.

**Die 528-Hz-Behauptung.** Im selben Kapitel steht, 528 Hz sei „the exact frequency used by genetic engineers throughout the world to repair DNA“ [13]. Dafür wird keine Studie genannt. Die einzige experimentelle Arbeit, die regelmäßig als Beleg angeführt wird, ist eine Zellkultur-Studie an menschlichen Astrozyten unter Ethanolstress: Bei 528 Hz (80–120 dB) überlebten rund 20 % mehr Zellen [19]. Das ist kein DNA-Reparatur-Nachweis, keine Studie am Menschen und kein Beleg für eine frequenzspezifische Wirkung (Vergleichsfrequenzen fehlen).

**Folge für den Datensatz:** Status `nicht belegt`, `warnhinweis: true`, und die Beschreibung nennt die Behauptung ausdrücklich als unbelegt. Die Töne bleiben als Presets erhalten, weil sie das sind, was Nutzer suchen – aber mit korrektem Etikett.

### 6.6 Planetenfrequenzen: Rechnung nachvollziehbar, Deutung nicht

Coustos Verfahren [15] ist eine reine Oktavtransposition:

```
f₀ = 1 / T        (T = Periode in Sekunden)
f  = f₀ · 2^n     (n so, dass f im hörbaren Bezugsbereich liegt)
```

Ich habe alle acht Werte aus astronomischen Perioden nachgerechnet (Zielbereich 170 Hz; für alle acht Werte ergibt jede Zielvorgabe zwischen 128 und 256 Hz dieselbe Oktavzahl n):

| Objekt | Periode T | f₀ | n | f berechnet | Wert im Datensatz | Cousto [15] |
|---|---|---|---|---|---|---|
| Erdentag (synodisch) | 86.400 s | 1,1574e−5 Hz | 24 | **194,18 Hz** | 194,18 | 194,18 |
| Erdjahr (tropisch) | 31.556.925 s | 3,1688e−8 Hz | 32 | **136,10 Hz** | 136,10 | 136,10 |
| Mond (synodisch) | 29,530589 d | 3,9194e−7 Hz | 29 | **210,42 Hz** | 210,42 | 210,42 |
| Merkur | 87,9691 d | 1,3164e−7 Hz | 30 | **141,27 Hz** | 141,27 | 141,27 |
| Venus | 224,701 d | 5,1509e−8 Hz | 32 | **221,23 Hz** | 221,23 | 221,23 |
| Mars | 686,980 d | 1,6848e−8 Hz | 33 | **144,72 Hz** | 144,72 | 144,72 |
| Jupiter | 4.332,589 d | 2,6709e−9 Hz | 36 | **183,58 Hz** | 183,58 | 183,58 |
| Saturn | 10.759,22 d | 1,0757e−9 Hz | 37 | **147,85 Hz** | 147,85 | 147,85 |

Der Vertragstest `Cousto-Frequenzen sind aus astronomischen Perioden reproduzierbar` führt diese Rechnung bei jedem CI-Lauf aus. Damit ist belegt: Die Zahlen sind **korrekt oktavierte Perioden**, keine Messungen und keine Musiktheorie. Die Zuschreibungen („belebend“, „Sinnlichkeit“, „Om“) sind Marketing und Esoterik – dafür gibt es keine Studien, und der Status ist `traditionell`.

**Bekannte Unstimmigkeiten in Coustos eigenen Publikationen**, die hier nicht geglättet werden:

- Jupiter: 183,58 Hz in der Broschüre [15], 183,80 Hz im Shop.
- Pluto: 140,25 Hz (klassische Liste) vs. 140,64 Hz (überarbeitete Broschüre). Pluto ist deshalb **nicht** im Datensatz.
- Erdentag: 194,18 Hz (synodisch) vs. 194,71 Hz (siderisch) – beide Werte sind zulässig, je nach gewählter Periode. Der Datensatz nutzt den synodischen Wert und nennt ihn so.

### 6.7 432 Hz: kleiner Effekt, keine Gesundheitswirkung

Die bekannteste kontrollierte Arbeit [14] ist eine randomisierte Crossover-Pilotstudie mit Musik in 440 Hz vs. 432 Hz. Ergebnis: Herzfrequenz im Mittel −4,79 bpm (p = 0,05), Blutdruck und Atemfrequenz nicht signifikant. Die Autoren schreiben selbst, dass es für die Behauptung besserer Wirkung **keine** wissenschaftlichen Studien gab. Eine neuere randomisierte Crossover-Studie an Krebspatient:innen verglich 432 Hz mit 443 Hz und fand −3 bpm vs. −1 bpm (p = 0,04) [16].

Einordnung: Ein Unterschied von 2–5 Schlägen pro Minute bei kleinen Stichproben ist als physiologischer Effekt **plausibel**, aber empfindlich gegen Erwartungseffekte, Musikauswahl und Messzeitpunkt. Klinische Relevanz ist nicht gezeigt. Deshalb `plausibel`, `warnhinweis: true` und keine Aussage über Gesundheit.

### 6.8 40 Hz: Mausmodell ≠ Therapie

[12] zeigt im Mausmodell, dass 40-Hz-Stimulation (optogenetisch und als Lichtflimmern) Amyloid-β senkt und Mikroglia aktiviert. Das ist ein relevanter Grundlagenbefund, aber: Tiermodell, kein Audio, keine Übertragbarkeit belegt. Klinische Studien zu 40-Hz-Licht- und Tonstimulation beim Menschen liefern bislang uneinheitliche Ergebnisse. Status daher `plausibel` mit ausdrücklichem Hinweis, nicht `belegt`.

---

## 7. Bewusst nicht aufgenommene Einträge

| Nicht aufgenommen | Grund |
|---|---|
| **174 Hz, 285 Hz, 963 Hz** | Diese drei Töne sind spätere Erweiterungen der Solfeggio-Liste. Im Primärtext von 1999 [13] stehen ausschließlich die sechs Töne 396–852; für 174/285/963 ließ sich keine Primärquelle finden, nur Sekundärlisten unterschiedlicher Zusammensetzung. Ohne belastbare Quelle kein Eintrag – die Lücke ist dokumentiert statt gefüllt. |
| **Uranus, Neptun, Pluto (Cousto)** | Uranus/Neptun sind reine Wiederholungen des Verfahrens ohne zusätzlichen Erkenntniswert; Pluto hat in Coustos eigenen Publikationen zwei Werte (140,25/140,64 Hz, siehe 6.6). |
| **„111 Hz – Tempelresonanz“** | Populäre Behauptung ohne nachvollziehbare Messung; keine Primärquelle gefunden. |
| **„Beta-Beats für Fokus“, „Alpha für Entspannung“** | Das sind Wirkaussagen, nicht Frequenzen. Die Evidenzlage ist widersprüchlich [6]; solche Presets würden ein Versprechen in die UI tragen, das der Datensatz nicht deckt. |
| **Infraschall-/Ultraschall-Presets zum Abspielen** | Vom Labor nicht reproduzierbar (Clamp 20–20.000 Hz) und für Lautsprecher/Wiedergabe ungeeignet; die Bereiche bleiben als Erklärungseinträge erhalten. |

---

## 8. Widersprüche, Grenzen, offene Punkte

1. **Schumann-Resonanz:** Der Lehrbuchwert 7,83 Hz ist eine theoretische Näherung; kontinuierliche Messreihen (z. B. Tomsk) berichten ein Zentrum um 7,6 Hz mit ±0,3 Hz tages- und jahreszeitlicher Schwankung. Der Datensatz nennt 7,83 Hz als Modus und weist die Schwankung im Text aus. Die oft behauptete „Resonanz mit EEG-Bändern“ ist eine Zahlenähnlichkeit, kein nachgewiesener Kopplungsmechanismus.
2. **EEG-Bänder:** Es gibt kein normiertes Schema; jede Bandangabe ist eine Konvention. Der Datensatz dokumentiert die verwendete Konvention.
3. **ISO 16 vs. Orchesterpraxis:** Die Norm sagt 440 Hz, die Praxis großer Orchester 442–443 Hz. Beides ist im Datensatz getrennt ausgewiesen.
4. **Cousto-Versionen:** Die Broschüre von 2009 und die Shop-Liste weichen bei Jupiter und Pluto voneinander ab; Zahlen wurden nicht „harmonisiert“.
5. **Solfeggio-Literatur:** Es existiert eine kaum überschaubare Grauliteratur mit wechselnden Listen (sechs, sieben, neun Töne; teils 432 Hz mitten in der Reihe). Der Datensatz stützt sich ausschließlich auf den Primärtext und verzichtet auf nicht belegbare Erweiterungen.
6. **Negativbefunde sind Suchstand, kein Beweis.** „Nicht belegt“ heißt: In den geprüften Quellen fand sich keine kontrollierte Evidenz. Es heißt nicht, dass eine Wirkung mit Sicherheit ausgeschlossen ist.
7. **Sprachgrenze:** Die Recherche erfolgte überwiegend englischsprachig; deutschsprachige Fachliteratur zu Audiostimulation wurde nicht systematisch durchsucht.
8. **Keine Metaanalyse, keine GRADE-Bewertung.** Für die Statusvergabe wurde die jeweils stärkste gefundene Evidenz bewertet, nicht ein vollständiges systematisches Review erstellt.

---

## 9. Disclaimer (verbindlicher Text)

Der Text steht in `data/frequencies.json` unter `disclaimer.lang` und ist von der UI dauerhaft sichtbar zu halten. Volltext:

> Dieses Frequenzlabor ist ein Bildungs- und Experimentierangebot. Es ersetzt keine ärztliche Beratung, Diagnose oder Behandlung und ist kein Medizinprodukt. Aus der Wiedergabe von Tönen werden keine Heil-, Gesundheits- oder Wirkversprechen abgeleitet. Einträge mit dem Status „nicht belegt“ oder „traditionell“ geben überlieferte oder populäre Vorstellungen wieder, für die kein wissenschaftlicher Nachweis besteht; sie sind im Datenbestand ausdrücklich so gekennzeichnet. Höre nur bei angenehmer Lautstärke, beginne leise und mache regelmäßig Pausen: Die WHO empfiehlt für Freizeitbeschallung höchstens 80 dB(A) über 40 Stunden pro Woche. Wenn du einen Hörschaden, Tinnitus oder eine Erkrankung hast, bei der laute Geräusche oder bestimmte Töne Beschwerden auslösen, kläre die Nutzung vorab ärztlich ab und brich sie bei Unwohlsein sofort ab.

**Warum diese Formulierungen:**

- **„kein Medizinprodukt“** – verhindert die Einordnung als Medizinprodukt im Sinne des MPG/MDR und die damit verbundenen Pflichten.
- **Keine Wirkaussagen** – § 3 HWG stellt irreführende Werbung unter Strafe, insbesondere wenn „Gegenständen … eine therapeutische Wirksamkeit oder Wirkungen beigelegt werden, die sie nicht haben“ [20]. Genau das wäre „528 Hz heilt DNA“.
- **Lautstärkehinweis mit Zahl** – die WHO-Grenze 80 dB(A) / 40 h pro Woche [21] ist die belastbare Referenz; sie macht den Hinweis prüfbar statt bloß gut gemeint.
- **Keine Heilversprechen, keine Anwendungsempfehlung** – der Text beschreibt, was das Angebot *ist*, nicht was es *bewirkt*.

Der Disclaimer ersetzt keine Rechtsberatung; vor einer Veröffentlichung mit Werbeaussagen ist eine juristische Prüfung sinnvoll.

---

## 10. Reproduktion und Prüfung

```bash
# Datenvertrag (Schema, Quellen, Disclaimer, Wirkbehauptungen, Cousto-Arithmetik)
node --test tests/frequencies-data.cjs

# bzw. über npm
npm run test:frequencies
```

Der Test prüft 12 Punkte, darunter:

- valides JSON, mindestens 20 Einträge, eindeutige IDs, beide Kategorien
- Pflichtfelder und Typen, Bereichslogik, `hz` innerhalb des Bereichs
- `beschreibung_kurz` ≤ 200 Zeichen
- jede Zeile mit `evidenzstatus` und auflösbarer `quelle_url`
- Disclaimer enthält „kein Medizinprodukt“, „keine Heil-/Gesundheitsversprechen“, 80 dB, Pausen, ärztliche Abklärung
- Blacklist gegen Wirkformulierungen („heilt“, „hilft gegen“, „senkt den Blutdruck“ …); DNA-Aussagen nur mit Einordnung „unbelegt/beworben/Behauptung“
- esoterische Einträge nie `belegt`; `warnhinweis` bei allen nicht-belegten Status gesetzt
- Cousto-Werte aus astronomischen Perioden nachgerechnet

**Manuelle Prüfungen, die der Test nicht leisten kann:** ob die Quelle den Wert tatsächlich nennt (Spalte „Prüfung“ in § 5), ob die Kurzbeschreibung den Quellinhalt verzerrt, und ob eine Quelle für die konkrete Behauptung taugt. Diese Prüfungen sind oben dokumentiert und bei Änderungen zu wiederholen.

---

## 11. Hinweise für UI und Audio-Engine

- **Statusanzeige:** `evidenzstatus` als Badge mit vier klar unterscheidbaren Zuständen; `nicht belegt`/`traditionell` nicht verstecken, sondern erklären.
- **Quellenlink:** `quelle_url` immer als externer Link mit `rel="noopener noreferrer"`, Ziel `_blank`, plus `quelle_titel` als Linktext (nicht „Quelle“).
- **Clamp:** 20–20.000 Hz; `hz === null` (Bereiche) nie direkt an den Oszillator geben, sondern einen Startwert innerhalb des Bereichs wählen.
- **Schwebung:** Bei gesetztem `partner_hz` zwei Oszillatoren mischen, Gain entsprechend halbieren (Summe zweier Vollausschläge sonst +6 dB).
- **Warnhinweis:** `warnhinweis: true` → Hinweis „Esoterische/traditionelle Zuordnung, keine belegte Wirkung – nicht zur Behandlung von Krankheiten“ in der Detailansicht.
- **Barrierefreiheit:** Status nicht nur über Farbe codieren (Text + Icon), Frequenzwert als Text ausgeben („440 Hz“), Screenreader-Ansage bei Presetwechsel.
- **Kein Autoplay**, AudioContext erst nach Nutzer-Interaktion; Hard-Cap bei −20 dBFS (siehe ADR).

---

## 12. Quellenverzeichnis

Alle URLs abgerufen am 2026-11-02.

1. OpenStax, *College Physics 2e*, Kap. 17.6 „Hearing“ — https://openstax.org/books/college-physics-2e/pages/17-6-hearing (CC BY-NC-SA; nur als Nachweis zitiert)
2. C. Kugler et al., „Temporal integration of infrasound at threshold“, *J. Assoc. Res. Otolaryngol.* (2023), PMC10389702 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10389702/
3. NIBIB (NIH), „Ultrasound“ — https://www.nibib.nih.gov/science-education/science-topics/ultrasound
4. J. J. Newson & R. Thiagarajan, „EEG Frequency Bands in Psychiatric Disorders: A Review of Resting State Studies“, *Front. Hum. Neurosci.* 12:521 (2019), PMC6333694 — https://pmc.ncbi.nlm.nih.gov/articles/PMC6333694/
5. OpenStax, *College Physics 2e*, Kap. 16.10 „Superposition and Interference“ — https://openstax.org/books/college-physics-2e/pages/16-10-superposition-and-interference
6. R. M. Ingendoh, E. S. Posny & A. Heine, „Binaural beats to entrain the brain? A systematic review“, *PLOS ONE* 18(5):e0286023 (2023) — https://pmc.ncbi.nlm.nih.gov/articles/PMC10198548/
7. OpenStax, *University Physics Vol. 1*, Kap. 17.4 „Normal Modes of a Standing Sound Wave“ — https://openstax.org/books/university-physics-volume-1/pages/17-4-normal-modes-of-a-standing-sound-wave
8. ISO 16:1975, *Acoustics — Standard tuning frequency (Standard musical pitch)*, bestätigt 2022 — https://www.iso.org/standard/3601.html
9. ISO, *ISO Focus*, Nov.–Dez. 2012, „Tuning up“ — https://www.iso.org/files/live/sites/isoorg/files/news/magazine/ISO%20Focus+%20(2010-2013)/en/2012/ISO%20Focus+,%20Nov.-Dec.%202012.pdf
10. *The Concise Oxford Dictionary of Music*, Stichwort „pitch“, via encyclopedia.com — https://www.encyclopedia.com/arts/dictionaries-thesauruses-pictures-and-press-releases/pitch
11. V. Stolc, M. Ohayon & F. Freund, „The Impact of the Schumann Resonances on Human and Mammalian Physiology“ (NASA-White-Paper) — https://science.nasa.gov/wp-content/uploads/2023/05/154_48a5766284d47dc2523cb38d856654f6_STOLCVIKTOR.pdf
12. H. F. Iaccarino et al., „Gamma frequency entrainment attenuates amyloid load and modifies microglia“, *Nature* 540:230–235 (2016), PMC5656389 — https://pmc.ncbi.nlm.nih.gov/articles/PMC5656389/
13. L. G. Horowitz & J. Puleo, *Healing Codes for the Biological Apocalypse*, Tetrahedron 1999, Abb. 5.6, S. 177 (Faksimile) — http://library.pyramidal-foundational-information.com/books/Healing%20Codes%20for%20the%20Biological%20Apocalypse%20Puleo.pdf (Bibliografie: https://openlibrary.org/books/OL8355690M)
14. D. Calamassi & G. P. Pomponi, „Music Tuned to 440 Hz Versus 432 Hz and the Health Effects: A Double-blind Cross-over Pilot Study“, *Explore (NY)* 15(4):283–290 (2019) — https://pubmed.ncbi.nlm.nih.gov/31031095/
15. H. Cousto, *The Cosmic Octave Tuning Forks* (Planetware, 2009, CC BY-NC-ND 4.0) — https://planetware.de/octave/The_CoOc_Tuning.pdf
16. „Differential effects of sound interventions tuned to 432 Hz or 443 Hz on cardiovascular parameters in cancer patients“, *BMC Complement Med Ther* (2025) — https://link.springer.com/article/10.1186/s12906-025-04758-5
17. M. Garcia-Argibay, M. A. Santed & J. M. Reales, „Efficacy of binaural auditory beats in cognition, anxiety, and pain perception: a meta-analysis“, *Psychological Research* 83:357–372 (2019) — https://link.springer.com/article/10.1007/s00426-018-1066-8
18. S. Basu & B. Banerjee, „Potential of binaural beats intervention for improving memory and attention“, *Psychological Research* 87:951–963 (2023) — https://pubmed.ncbi.nlm.nih.gov/35842538/
19. T. Babayi & G. H. Riazi, „The Effects of 528 Hz Sound Wave to Reduce Cell Death in Human Astrocyte Primary Cell Culture Treated with Ethanol“, *J. Addict. Res. Ther.* 8:335 (2017) — https://doi.org/10.4172/2155-6105.1000335
20. § 3 Heilmittelwerbegesetz (HWG) — https://www.gesetze-im-internet.de/heilmwerbg/__3.html
21. WHO, „Deafness and hearing loss: Safe listening“ — https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening

---

## 13. Änderungslog

| Datum | Änderung |
|---|---|
| 2026-11-02 | Erstfassung: 32 Einträge (17 physikalisch, 15 esoterisch), Schema, Vertragstest, Disclaimer |
