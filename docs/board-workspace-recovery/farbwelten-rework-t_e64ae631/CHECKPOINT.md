# Farbwelten — Rework zu t_d12db88e (Karte t_e64ae631)

Stand: 2026-11-03, Branch `feature/farbwelten-modul`, Ausgangs-Commit `4f4b8ae`
(Prüfgegenstand der Nachprüfung `t_d12db88e`). Kein Push, kein Deployment.

## Ergebnis

Die vier blockierenden Befunde und alle sieben Pflichtkorrekturen der Nachprüfung sind
umgesetzt; die Kette **Quelle → `content/farbwelten` → `js/data/farbwelten.js` →
gerendert** ist erneut belegt (Abschnitt 5). Zwei Hinweise sind mit umgesetzt
([14], [31], Wellenlängen, CHECKPOINT-Liste), einer bewusst offen gelassen
(Disclaimer-Position, Begründung in §4).

## 1. Blockierende Befunde

### 1.1 Falsche DOI für [11]/[16] (`lichtfrequenzen.md`)

| | vorher | nachher |
|---|---|---|
| [11] | „Light therapy for SAD — Cochrane Review", `10.1002/14651858.CD012345.pub3` | Nussbaumer-Streit, Forneris, Morgan et al. (2019). *Light therapy for **preventing** seasonal affective disorder.* Cochrane Database Syst Rev 2019(3), CD011269. `10.1002/14651858.CD011269.pub3` |
| [16] | Dublette derselben Quelle | gestrichen |
| SAD-Zeile | „Grenzen: Heterogenität, Dosierung wichtig [16]" | „moderate Heterogenität der Studien und mittleres bis hohes Verzerrungsrisiko [15]" |
| Chromotherapie-Absatz | „keine belastbare Evidenz [9][11]" | „keine belastbare Evidenz [9]" |

Live geprüft (Crossref CSL-JSON + PubMed 30883670, 2026-11-03): Der DOI `CD011269.pub3`
löst auf Nussbaumer-Streit et al. 2019, *Light therapy for preventing seasonal affective
disorder*, auf; Abstract: eine geeignete Studie, 46 Teilnehmende, RR 0,64 (95 %-CI
0,30–1,38), „very low-quality evidence". Der falsche DOI `CD012345.pub3` kommt im
Repository nicht mehr vor.

Weil [11] nach den Vorgaben an keiner der beiden alten Stellen mehr trägt, wäre der
Eintrag sonst zur Waise geworden. Deshalb steht die Präventionsaussage jetzt als eigener
Absatz in „Belegte Lichtmedizin" — mit der Evidenzsicherheit der Quelle, also ausdrücklich
als *sehr unsicher* und getrennt von der Akutbehandlung:

> Davon zu trennen ist die Vorbeugung: Die Cochrane-Review zur Prävention bei Menschen mit
> SAD-Vorgeschichte stützt sich auf eine einzige geeignete Studie mit 46 Teilnehmenden und
> bewertet die Evidenz als sehr unsicher (RR 0,64; 95 %-CI 0,30–1,38) [11].

Die SAD-Kennzahlen der Akut-Meta-Analyse wurden an das Abstract angeglichen: 19
eingeschlossene Studien, SMD −0,37 (95 %-CI −0,63 bis −0,12).

### 1.2 Violett-Aussage durch die eigene Quelle widerlegt (`violett.md:24`, `:30`)

Beide Sätze sind ersetzt. Neue Fassung: [3] führt „purple" sehr wohl als Kategorie — mit
bestärkenden („empowering") Emotionen —, meint damit aber den Alltags-/Bildschirmton als
Magenta-Mix aus Rot- und Blauanteilen [31], nicht spektrales Violett bei 380–425 nm
[10][24]. Eine Studie, die spektrales Violett von Blau und Magenta trennt, führen [3][4]
nicht. Die Pointe bleibt: „Violett fördert Spiritualität stärker als Blau" ist nicht
belegt; Assoziation ist nicht Wirkung [7].

`indigo.md:24` ist sachlich nicht betroffen (Indigo ist in [3] keine Kategorie), die
Aufzählung war aber unvollständig und ist jetzt neutral und vollständig: Rot, Gelb,
Orange, Blau, Grün, Blau-Grün, Rosa, Violett, dazu Hell/Dunkel, Grau, Schwarz, Weiß.

### 1.3 [5] war eine Dublette von [4] (`gruen.md:50`)

`- [5] Jonauskaite, D., Tremea, A., Bürki, L., Diouf, C. N. & Mohr, C. (2020). "To see or
not to see: Importance of color perception to color therapy." Color Research &
Application 45(3), 450–464. https://doi.org/10.1002/col.22490`

Live geprüft (Crossref, 2026-11-03): Titel, Journal, Band/Heft/Seiten und DOI stimmen.
[4] und [5] tragen jetzt unterschiedliche DOIs und unterschiedliche Titel.

### 1.4 Ampel-/Redaktionssprache im sichtbaren Text

- `blau.md:28`: letzter Satz („Diese Aussage ist grün (belegbar), aber nur mit dem
  Differenzierungs-Hinweis.") ersatzlos gestrichen.
- `rot.md:44-45`: „**Grün (belegbar):**" → „**Belegt:**", „**Gelb (Tradition):**" →
  „**Nur Tradition:**". Im gerenderten Abschnitt steht jetzt: „Belegt: … Nur Tradition: …
  Was die Studienlage nicht hergibt: …" (Screenshot `rot-was-wissenschaft-sagt.png`).

## 2. Pflichtkorrekturen

| Ort | Korrektur |
|---|---|
| `blau.md`, `gruen.md`, `orange.md`, `indigo.md`, `violett.md` | [4] = Jonauskaite et al. (2020), *Universal Patterns in Color-Emotion Associations Are Further Shaped by Linguistic and Geographic Proximity*, **Psychological Science 31(10), 1245–1260**; „Psychon Bull & Rev" entfernt. Nur [3] bleibt Psychon Bull Rev 32(4), 1457–1486 |
| `rot.md` | [9] mit vollständiger OSTEBA-URL; [1] als Vollzitat mit URL (vorher „Link siehe [Einstieg]"); [3]/[4]/[5]/[7] vollzitatlich; Quellenliste numerisch geordnet |
| `rot.md` | [20] gestrichen, die Aussage zu Durchblutung/Entzündungen stützt sich auf [9] |
| `farbwelten.md` | [1] trug bereits das Vollzitat mit URL (Befund war am Prüfstand `4f4b8ae` nicht mehr reproduzierbar); zusätzlich [3], [4], [15] vollzitatlich |
| `chakren.md` | „uralte indische Lehre – historisch nicht belegbar" jetzt [1][2] (nicht [9]) |
| `indigo.md` | „Farbspezifische Ergänzung" stützt Tradition auf [1], Photometrie auf [24] (nicht [19]) |
| `chakren.md` | [5], [7], [24] aus der Bibliografie entfernt (nie zitiert) |

Zwei Folgekorrekturen aus demselben Prinzip (sonst Waisen bzw. Dubletten):

- **[20] auch auf `gruen.md` entfernt** (`:28` [9][20] → [9], Eintrag `:51` gestrichen). Die
  Karte nannte nur `rot.md`; [20] ist aber auf keiner Seite ein eigenständiges Dokument,
  sondern eine Verweiskonstruktion auf [9].
- **[19] aus der indigo-Bibliografie entfernt**, nachdem die einzige Zitatstelle auf [24]
  umgestellt war. Die IARC-Monografie trägt in indigo keine Aussage mehr.

## 3. Umgesetzte Hinweise (fakultativ)

- **[14] ANSES:** Vollzitat mit Fundstelle statt Domain —
  „ANSES (2019). *Effets sur la santé humaine et sur l'environnement (faune et flore) des
  systèmes utilisant des diodes électroluminescentes (LED) – Avis et rapport.*
  https://www.anses.fr/system/files/AP2014SA0253Ra.pdf" (HTTP 200 geprüft; die ANSES-Seite
  weist die Veröffentlichung mit 14/05/2019 aus, daher Jahr 2019 statt 2020).
- **[31]:** Wyszecki, G. & Stiles, W. S. (2000). *Color Science: Concepts and Methods,
  Quantitative Data and Formulae.* 2. Aufl., Wiley Classics Library. ISBN 978-0-471-39918-6
  (Wiley-Produktseite: Paperback-Reprint August 2000, ISBN 978-0-471-39918-6).
- **Wellenlängen Indigo/Violett:** Prosa an die verbindlichen Werte aus
  `docs/farbwelten-konzept/02` §10 und `WAVELENGTHS` im Generator angeglichen — Indigo
  425–450 nm (666–706 THz), Violett 380–425 nm (706–789 THz). Vorher standen in der Prosa
  420–450 bzw. 380–450 nm, während die gerenderte Merkmalsliste 425–450 / 380–425 zeigte.
  Die Grenze ist im Violett-Intro ausdrücklich als konventionell und „je nach Einteilung
  bis etwa 450 nm" gekennzeichnet.
- **`CHECKPOINT.md` §3** (farbwelten-sync): Der entfernte H2 „Was nicht verwendet wird
  (Rot-Tabu)" auf indigo/violett ist in die Liste „bewusst nicht wiederhergestellt"
  aufgenommen (Substanz steht in „Was die Studienlage nicht hergibt").
- **`[24]`** bleibt wie geliefert („NIST / CIE. SI-Werte und Lichtgeschwindigkeit"), jetzt
  als einziger Eintrag ohne URL — bewusst nicht mit einer erfundenen Fundstelle versehen.

## 4. Bewusst offen gelassen

- **Disclaimer-Position.** Der S16-Block steht auf sieben Farbseiten weiterhin am Ende von
  „Anwendung und Grenzen", also vor „Geschichte"/„Übung". Ein Verschieben ans Seitenende
  ist keine Textänderung, sondern eine Renderer-Änderung: `generate-farbwelten-data.cjs`
  fügt den Block genau dann in `sections.anwendung` ein, wenn dort kein medizinischer
  Zitatblock steht; ein zusätzlicher Block am Seitenende würde den Disclaimer doppelt
  rendern und die S16-Zusage („genau 1× je Seite") brechen. Das ist ein eigener,
  rendererseitiger Schritt (Feld `world.disclaimer` + Ausgabe am Seitenende) und wurde für
  diese Rework-Karte nicht angefasst.
- **`[19]` IARC (2023), Monograph on artificial optical radiation** wurde nicht neu
  bewertet: Die Quelle trägt weiterhin die UV-/Gruppe-1-Aussage auf blau, violett,
  chakren, farbwelten und lichtfrequenzen und war nicht Gegenstand der Nachprüfung.

## 5. Ausgeführte Prüfungen (echte Läufe, 2026-11-03)

| Prüfung | Ergebnis |
|---|---|
| `node scripts/generate-farbwelten-data.cjs` | 86,4 KB, 16 Registereinträge, 8 Abschnitte je Farbseite |
| `node scripts/verify-farbwelten-sync.cjs` | „10 Quellen, 16 Registereinträge, **0 Fehler**" |
| `node check_rework.cjs` (eigenes Nachweis-Skript) | **45 Prüfungen bestanden, 0 Fehler**; Waisen je Seite: keine; Register: 16 Einträge, alle zitiert |
| `npm run build` | dist/Esoterik-Welt neu gebaut; Root-`Lokal*.html` wurden gesichert und danach bytegleich zurückgeschrieben (fremde Änderungen unberührt) |
| `sha256sum js/data/farbwelten.js dist/.../farbwelten.js` | identisch (`74b3371a…`) |
| `node scripts/verify-farbwelten-rendered.cjs` | **10 Routen, 0 Fehler** |
| `node check_rendered.cjs` (eigenes Skript, DOM-Text + Linkziele) | **90 Prüfungen, 0 Fehler**, keine Konsolenfehler |
| `node scripts/verify-farbwelten.cjs` | **56 Prüfungen, 0 fehlgeschlagen**, 6 Kopfzeilen-Breiten, min. Kontrast 9,09:1 — alle Routen × 5 Breiten PASS |
| `node --test tests/farbwelten.mjs` | **10/10** grün |

Die eigenen Skripte liegen als Anhang an der Karte `t_e64ae631`
(`check_rework.cjs`, `check_rendered.cjs`), die Messprotokolle in
`evidence/rendered.json`, `evidence/rendered-independent.json` und
`evidence/farbwelten/{results.json,report.md}`.

Belegt im gerenderten Modul (Auszug): Quelleneintrag [11] verlinkt `CD011269.pub3` und
zeigt den Präventionstitel; kein [16], kein [20], kein `CD012345`, kein „Link siehe" auf
allen zehn Routen; [4] zeigt auf fünf Seiten „Psychological Science 31(10)"; `gruen`
zeigt [5] als „To see or not to see … col.22490"; `violett` zeigt „empowering" +
Magenta-Mix und nicht mehr „keine eigene emotionale Kategorie"; `rot` zeigt
„Belegt:"/„Nur Tradition:"; S16 genau 1× je Seite.

## 6. Hashes (SHA-256, gekürzt)

| Datei | nach Rework |
|---|---|
| `content/farbwelten/blau.md` | f338f4c67ede |
| `content/farbwelten/chakren.md` | de6dbc5fab24 |
| `content/farbwelten/farbwelten.md` | d66bca9cb1c6 |
| `content/farbwelten/gelb.md` | bed6ba2defbb |
| `content/farbwelten/gruen.md` | 07fec71b8c5a |
| `content/farbwelten/indigo.md` | b56833912369 |
| `content/farbwelten/lichtfrequenzen.md` | 022782ac523a |
| `content/farbwelten/orange.md` | dc2622ebc53c |
| `content/farbwelten/rot.md` | 32e6c57fff14 |
| `content/farbwelten/violett.md` | 8fa63db32bc7 |
| `js/data/farbwelten.js` | 74b3371a734c |
| `scripts/generate-farbwelten-data.cjs` | 6ffa609c6fed |

## 7. Offene Punkte

1. Unabhängige Nachprüfung dieses Stands steht aus; diese Karte ist **keine** Freigabe.
2. Disclaimer-Position auf sieben Farbseiten (siehe §4) — braucht eine Renderer-Änderung.
3. `[19]` IARC (2023) nicht neu bewertet (siehe §4).
4. `[24]` bleibt ohne URL/ISBN (bewusst, siehe §3).
5. Kein Push, kein Deployment; `dist/` ist Build-Artefakt und nicht versioniert.
