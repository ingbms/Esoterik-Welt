# CHECKPOINT RAD-05 — Bildbibliothek und Rechtebelege

| Feld | Wert |
| --- | --- |
| Paket | ESOW-RAD-05 — Bildbibliothek und Lizenzen (Stufe W5a: Beschaffung und Nachweis) |
| Kanban-Karte | `t_187d5f52`, Master `t_878c59c7` / ESOW-RAD-000 |
| Profil / Modell | `deep_research_rag` / deepseek-flash |
| Arbeitsbaum | `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul` |
| Basis-Commit | `e44fa5c` |
| Stand | 2026-11-02T23:27:43Z (UTC), Quellen abgerufen am 2026-11-03 |
| Status | **abgeschlossen für W5a** — Beschaffung, Varianten, Manifest, Nachweisseite, Validierung |
| Nicht enthalten | Einbau in `js/data/radiasthesie.js`, Attributionsroute, `<picture>`-Markup (= RAD-06 / W5b) |

## Ergebnis

Sechs Motive beschafft, an der Originalquelle geprüft, bytegenau gegen die dort gemeldete
Prüfsumme abgeglichen, als Original archiviert und in 24 optimierte Varianten überführt.
Je Motiv liegen Alt-Text, Bildunterschrift, Urheber, Lizenz mit URL, Änderungs-, Länder- und
Markenhinweis sowie fertige Attributionszeile in `media-manifest.json`. Die Bildnachweisseite
und `ATTRIBUTION.md` werden aus dem Manifest erzeugt, nicht daneben gepflegt.

**Keine der sechs Quellen musste ersetzt werden.** Alle sechs sind rechtssicher verwendbar
(4× gemeinfrei bzw. CC0, 2× CC BY-SA 3.0 mit Attributions- und ShareAlike-Pflicht).

## Prüfung der sechs Dateiseiten

Grundlage: MediaWiki-API (`action=query`, `prop=imageinfo`, `extmetadata`) **und** der Wikitext
der Dateiseite im Originalwortlaut. Beides liegt unter `evidence/commons-raw.json` und
`evidence/commons-wikitext.json`.

| Motiv | Dateiseite (revid) | Lizenzbaustein | Urheber | Original | SHA-1 gegen Quelle |
| --- | --- | --- | --- | --- | --- |
| Klassisches Pendel | `Radiesthetic_pendulum.jpg` (904548060) | `{{self\|cc-by-sa-3.0\|GFDL}}` | Carivaldi | 1784×1468, 168.315 B | stimmt |
| Universalpendel | `Universal_pendulum_E.jpg` (1211018461) | `{{self\|cc-by-sa-3.0}}` | Wouter Hagens | 2108×1776, 1.655.496 B | stimmt |
| Radiästhesierute | `Varilla_de_radiestesia.JPG` (1141593234) | `{{self\|Cc-zero}}` | José Antonio Agraz Sandoval | 566×425, 335.929 B | stimmt |
| Historische Wünschelrute | `Divining_Rod.jpg` (1207052185) | `{{PD-old}}` | Thomas Pennant (1726–1798) | 1232×741, 1.110.391 B | stimmt |
| Tarot | `Tarot_cards_-_3_card_spread_with_candles.jpg` (1219272290) | `{{self\|cc-zero}}` | Nosferattus | 3200×2400, 1.861.604 B | stimmt |
| Historisches Ouija-Brett | `Ouija_board_-_Kennard_Novelty_Company.png` (1207650742) | `{{PD-Art\|PD-old-70-1923}}` | Elijah Bond, Charles Kennard | 4928×3290, 22.414.749 B | stimmt |

## Befunde, die von der Ausgangsliste abweichen

1. **Ouija-Brett:** Die Ausgangsliste nennt „Public Domain Mark“. Die Dateiseite trägt tatsächlich
   `{{PD-Art|PD-old-70-1923}}`, also keinen PDM-Baustein. Beide Wege führen zu gemeinfrei; der
   genaue Baustein ist aber `PD-old-70-1923`. Zusätzlich: „Ouija“ ist eine Marke (Hasbro) —
   die Gemeinfreiheit des historischen Bretts berührt das Markenrecht nicht. Beides steht im
   Manifest; die Bildunterschrift enthält den Markenhinweis.
2. **Wünschelrute:** Die Dateiseite nennt Thomas Pennant als Urheber, die Beschreibung spricht
   aber von Zeichnungen durch Moses Griffiths, Ingleby und weitere Künstler. Die Zuschreibung
   des konkreten Blattes ist unsicher. Die Bildunterschrift nennt deshalb die Publikation
   („A Tour in Wales“, Ausgabe 1781, National Library of Wales) und nicht einen Zeichner.
3. **Ouija-Logo:** Das ovale Herstellerlogo ist kursiv und schräg gedruckt und auch im
   Detailausschnitt nicht sicher zu entziffern. Der Alt-Text beschreibt es als „ovales
   Herstellerlogo mit Vogel-Emblem“ und erfindet keine Lesung.
4. **Tarot:** Das Foto ist CC0; die abgebildeten Kartenmotive sind Reproduktionen des
   1909 erschienenen Rider-Waite-Smith-Decks (Pamela Colman Smith, † 1951). Nach deutschem/EU-Recht
   endete die Schutzfrist Ende 2021, in den USA liegt Gemeinfreiheit vor. Der Länderhinweis steht
   im Manifest.
5. **Radiästhesierute:** Das Original ist nur 566 px breit. Es gibt deshalb **keine** 1040-px-Variante;
   hochskaliert wird nicht. Für grossformatige Verwendung ist das Bild nicht geeignet.
6. **Ouija-Transparenz:** Das PNG hat einen echten Alphakanal (0–255). Varianten behalten ihn;
   JPEG ist für dieses Motiv ausgeschlossen. Deshalb zusätzlich PNG-Fassungen.

## Dateien

Alle Pfade relativ zum Arbeitsbaum. Prüfsummen vollständig in `CHECKSUMMEN.sha256` (33 Dateien).

```
assets/radiasthesie/media/
  media-manifest.json          43 KB, SHA-256 98a2cd2808155091d2178b745b56585e49fc0dca34bd11a9f6464bd16c483217
  bildnachweis.html            generierte Nachweisseite (aus dem Manifest)
  ATTRIBUTION.md               generierte Attributionsliste (aus dem Manifest)
  original/                    6 Originale, unverändert wie geladen, 27 MB
  520/                         13 Varianten (WebP + AVIF, Ouija zusätzlich PNG), 740 KB
  1040/                        11 Varianten (WebP + AVIF, Ouija zusätzlich PNG), 2,2 MB
```

Vier bestehende eigene SVGs (`orakel-karten.svg`, `pendel-geometrie.svg`, `pendeltafel.svg`,
`winkelrute.svg`) sind **unverändert** und nur geprüft sowie im Manifest unter `own_assets` erfasst.

Neu unter `docs/radiasthesie-completion/RAD-05/`:

```
CHECKPOINT.md                  dieser Bericht
CHECKSUMMEN.sha256             SHA-256 aller 33 Mediendateien
evidence/commons-raw.json      API-Rohantwort je Dateiseite (Lizenz, Urheber, Credit, Masse)
evidence/commons-wikitext.json Wikitext der Dateiseiten im Wortlaut (Lizenzbausteine)
evidence/download-report.json  HTTP-Status, Bytes, SHA-1/SHA-256, MIME-Abgleich je Download
evidence/variant-report.json   EXIF-Befund, Alphawerte, je Variante Bytes und SHA-256
evidence/svg-report.json       Sicherheitsprüfung der vier eigenen SVGs
evidence/validation.json       Ergebnis der unabhängigen Validierung
scripts/                       16 Python-Skripte (Beschaffung, Varianten, Manifest, Prüfung)
```

## Ausgeführte Tests

Alle Befehle im Arbeitsbaum, `TMPDIR/TEMP/TMP` auf
`C:/Users/mas/AppData/Local/hermes/cache/scratch`. Exitcodes wurden nicht durch Pipes maskiert.

| Test | Befehl | Ergebnis |
| --- | --- | --- |
| Download-Integrität | `python …/fetch_originals.py …` | 6/6 SHA-1 identisch mit Commons, MIME 6/6 korrekt, Exit 0 |
| Eigene SVGs | `python …/check_svgs.py …` | 4 Dateien, 0 Fehler, 0 Warnungen (keine Skripte, keine externen Referenzen, keine Entities, title/desc/viewBox vorhanden) |
| Manifest-Validierung | `python …/validate_media.py …` | 6 Motive, 6 Originale, 24 Varianten, 0 Fehler, 0 Warnungen, Exit 0 |
| Lizenz-URLs | in `validate_media.py` | 4/4 HTTP 200 (`CC BY-SA 3.0`, `CC0`, `Template:PD-old`, `Template:PD-Art`) |
| Nachweisseite im Browser | `file://…/bildnachweis.html` | 6/6 Bilder laden, Masse = Manifest (520×428, 438, 390, 313, 390, 347), Transparenz des Ouija-Bretts sichtbar erhalten |
| Negativkontrolle | `python …/negative_control.py …` | 3/3 absichtlich eingebaute Fehler erkannt (Byteänderung → SHA-256, gelöschte Datei → fehlt, Fremddatei → Waise), Exit 1 wie erwartet |

### Was die Negativkontrolle aufgedeckt hat

Der erste Lauf der Negativkontrolle ist **fehlgeschlagen** und hat damit einen echten Defekt des
Prüfskripts gezeigt: Manifestpfade wurden über das Arbeitsverzeichnis aufgelöst. Mit absolutem
Medienpfad prüfte die Validierung dadurch stillschweigend die Dateien des echten Bestands statt
der Kopie — sie war also vom Aufrufpfad abhängig und hätte einen falschen Bestand als „bestanden"
gemeldet. Behoben durch Auflösung relativ zur Projektwurzel; die Negativkontrolle läuft seither
mit 3/3 erkannter Fehler. Der zweite Fehlversuch betraf die Nachweisseite: Bildpfade waren
projektwurzel-relativ und hätten von `media/` aus ins Leere gezeigt (404 auf allen sechs Bildern).
Ebenfalls behoben und im Browser gegengeprüft.

Ohne diese beiden Gegenproben wären beide Fehler unentdeckt geblieben, obwohl die Validierung
vorher „0 Fehler" meldete. Das ist der Grund, warum die Negativkontrolle Teil des Nachweises ist.

## Abnahme gegen die Kartenkriterien

| Kriterium | Status | Beleg |
| --- | --- | --- |
| Dateien real vorhanden | erfüllt | 33 Dateien, `CHECKSUMMEN.sha256`, Validierung |
| Header/MIME stimmen | erfüllt | magic bytes je Datei gegen deklariertes Format, 30/30 Dateien |
| Masse stimmen | erfüllt | Pillow-Masse gegen Manifest, alle Varianten und Originale |
| Hashes stimmen | erfüllt | SHA-256 je Variante; SHA-1 der Originale gegen Commons |
| Manifestzählung stimmt | erfüllt | Manifest 6/24/4 = Zählung auf Platte |
| Alle verwendeten Medien mit Attribution | erfüllt | `attribution_text` je Motiv, in HTML und MD ausgespielt, im Browser geprüft |
| SVG sicher geprüft | erfüllt | `svg-report.json`, 0 Fehler |
| Nur rechtssicher verwendbare Originale | erfüllt | 2× CC BY-SA 3.0, 2× CC0, 2× gemeinfrei; nichts Unklares übernommen |
| Nicht nutzbare Quelle begründet ersetzen | nicht erforderlich | keine Quelle war unbrauchbar; Abweichungen stattdessen dokumentiert |
| Alt-Text und Bildunterschrift je Motiv | erfüllt | am geladenen Original visuell geprüft, nicht aus der Erwartung geschrieben |

## Restpunkte

1. **Kein Commit ausgeführt.** Die Karte verbietet parallele Git-Commits, und im Arbeitsbaum liegen
   fremde, uncommittete Änderungen (u. a. `.gitattributes`, `Lokal*.html`, `js/data/radiasthesie.js`).
   Zu committende Pfade, ausschliesslich eigene:
   `assets/radiasthesie/media/` und `docs/radiasthesie-completion/RAD-05/`.
2. **Pfadabweichung zu RAD-01 §2.5:** Dort sind `assets/radiasthesie/fotos/` und
   `assets/radiasthesie/media-manifest.json` vorgesehen; diese Karte schreibt
   `assets/radiasthesie/media/` vor. Es bleibt bewusst bei **einer** Manifestdatei — eine zweite
   Kopie wäre eine zweite Wahrheit. RAD-06 muss `assets/radiasthesie/media/media-manifest.json` lesen.
3. **Keine LICENSE-Datei im Repository.** Die Lizenz der eigenen SVGs und der Projektinhalte ist
   nicht formal festgelegt; im Manifest als offener Punkt vermerkt, nicht eigenmächtig entschieden.
4. **ShareAlike sichtbar machen:** Für die zwei CC-BY-SA-3.0-Motive muss die Weitergabe unter
   gleichen Bedingungen im Impressum oder auf der Bildnachweisseite erscheinen.
5. **AVIF** ist erzeugt, wird aber von keiner Ansicht ausgeliefert; nötig wäre `<picture>/<source>`.
6. **Bildnachweisseite** liegt als generierte Datei unter `assets/radiasthesie/media/bildnachweis.html`;
   die Einbindung als Route (`#pendeln/bilder`) oder Abschnitt in `renderMethodik` ist eine
   Designentscheidung, die laut RAD-01 (§2.5, U3) noch offen ist.
7. **Repo-Gewicht:** Die Originale belegen 27 MB, davon 22 MB allein das Ouija-PNG. Bewusst
   unverändert abgelegt, damit die Prüfsumme gegen Commons nachweisbar bleibt. Falls das Projekt
   das nicht will, ist Git LFS oder ein Beleg-Downscale mit dokumentierter Abweichung die Alternative.

## Nächster Schritt (RAD-06 / W5b)

1. `media-manifest.json` lesen und je Thema `figure` in `js/data/radiasthesie.js` erzeugen
   (`web.src`, `web.srcset`, `width`, `height`, `alt`, `caption`); Höhe aus dem tatsächlichen
   Seitenverhältnis, `object-fit: cover` im bestehenden 520×400-Slot.
2. Bildnachweis als Route `#pendeln/bilder` oder Abschnitt in `renderMethodik` einhängen —
   Entscheidung U3 aus RAD-01 vorher treffen.
3. ShareAlike-Hinweis für Carivaldi und Wouter Hagens im Impressum ergänzen.
4. Erst danach AVIF über `<picture>` ausliefern.

## Reproduktion

```bash
cd C:/Users/mas/Arbeit/esow-rad-t_878c59c7
export TMPDIR=TEMP=TMP=C:/Users/mas/AppData/Local/hermes/cache/scratch
S=docs/radiasthesie-completion/RAD-05/scripts
E=docs/radiasthesie-completion/RAD-05/evidence
python $S/probe_commons.py   $E            # Lizenzen je Dateiseite (API)
python $S/probe_wikitext.py  $E            # Lizenzbausteine im Wortlaut
python $S/fetch_originals.py $E assets/radiasthesie/media
python $S/check_svgs.py      assets/radiasthesie $E
python $S/build_variants.py  assets/radiasthesie/media $E
python $S/build_manifest.py  $E assets/radiasthesie/media
python $S/build_attribution.py assets/radiasthesie/media
python $S/validate_media.py  assets/radiasthesie/media $E
python $S/negative_control.py assets/radiasthesie/media "$TMPDIR" $E
python $S/validate_media.py  assets/radiasthesie/media $E   # Stand nach der Negativkontrolle wiederherstellen
```

Werkzeuge: Python 3.14.9, Pillow 13.0.0 (WebP, AVIF, PNG), kein ImageMagick. Netz: Wikimedia-API
und `upload.wikimedia.org`. Der User-Agent muss eine Kontakt-URL enthalten, sonst antwortet
`upload.wikimedia.org` mit HTTP 429 — das ist die Ursache des ersten fehlgeschlagenen Downloads.

## Bewusst nicht getan

- Keine Produktionsdatei geändert (`js/`, `css/`, `*.html` im Wurzelverzeichnis, `tests/`, `scripts/`).
- Keine der vier eigenen SVGs verändert.
- Keine fremden Änderungen gestaged, resettet oder gestasht; kein `git add -A`; kein Commit, kein Push.
- Keine Lizenz erfunden, keine Zuschreibung geglättet, kein Bild hochskaliert, keines beschnitten.
