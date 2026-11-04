# Medien-Katalog: Lückenliste und Risiken

Stand: Baseline `9f58439` (`baseline/rubriken-2026-11-03`), Branch `wt/t_cbbf71e0`.
Erzeugt mit `node scripts/migration-baseline/build-media-catalog.cjs`; alle Zahlen sind am
Dateibaum gemessen, nicht geschätzt. Prüfung: `node scripts/migration-baseline/validate-catalogs.cjs`
und `node scripts/migration-baseline/verify-media-catalog.cjs` (17 Abnahmeprüfungen).

## 1. Umfang

- Zeilen im Katalog: **644** (eine Zeile je Datei unter `assets/`, §3.2/§8 Regel 1).
- Gesamtgröße: **96.960.064 Byte** (92,5 MiB).
- `license_status`: geklaert 637 · nicht_erforderlich 6 · ungeklaert 1
- `release_relevance`: should 242 · none 14 · must 388
- `delivery`: alle 644 Dateien `shipped` (Pages liefert die Repository-Wurzel aus, §2.9).

### 1.1 Gewicht je Gruppe

| Gruppe | Dateien | Byte | Anteil |
| --- | ---: | ---: | ---: |
| `assets/tarot` | 476 | 58.231.562 | 60.1 % |
| `assets/radiasthesie` | 37 | 30.590.241 | 31.5 % |
| `assets/crystals` | 121 | 6.603.196 | 6.8 % |
| `assets/fonts` | 5 | 948.822 | 1.0 % |
| `assets/mineral` | 2 | 581.529 | 0.6 % |
| `assets/cosmos` | 2 | 4.464 | 0.0 % |
| `assets/favicon.svg` | 1 | 250 | 0.0 % |

## 2. Ungeklärte Lizenzen — jede Zeile einzeln

**1 Zeile(n)** mit `license_status: ungeklaert`, davon **1** mit
`release_relevance: must` — das ist laut §8 Regel 3 ein Gate-Punkt vor dem nächsten Push.

| ID | Pfad | Verwendung | Relevanz | Eigentümer | Nächster Schritt |
| --- | --- | --- | --- | --- | --- |
| MED-0130 | `assets/mineral/mineral-detail-1000.jpg` | #home (Startseite, Abschnitt Material) | must | Eigentümer (Markus/ingbms) | Quelle und Lizenz im Impressum belegen oder Bild ersetzen; danach `license`/`license_status` im Katalog nachziehen |

## 3. Rechte-Risiken bei formal geklärten Zeilen

Diese Zeilen sind `geklaert`, weil ein Nachweis im Repository existiert. Der Nachweis ist aber
unvollständig — bewusst als Risiko geführt, nicht als stille Annahme:

| Befund | Betroffene Zeilen | Eigentümer | Nächster Schritt |
| --- | --- | --- | --- |
| `README.md` nennt MIT „siehe `LICENSE`“; eine `LICENSE`-Datei existiert im Baseline-Commit nicht (auch nicht in der Git-Historie). Projekt-eigene Dateien hängen damit an einer Textaussage ohne Lizenzdatei. | 5 (Favicon und die 4 eigenen Radiästhesie-Zeichnungen) | Eigentümer | `LICENSE` (MIT) anlegen oder README korrigieren; danach Lizenzangabe auf die Datei stützen |
| `assets/radiasthesie/media/ATTRIBUTION.md` führt als offenen Punkt: „Keine LICENSE-Datei im Repository: die Lizenz der eigenen SVGs und der Projektinhalte ist nicht formal festgelegt.“ Das widerspricht der MIT-Angabe im README. | 4 eigene Zeichnungen | Eigentümer | Widerspruch zugunsten einer Quelle auflösen (LICENSE-Datei) |
| Gartenbrevier: „Eine über die Nutzung auf dieser Website hinausgehende Weiterlizenzierung der V2-Motive ist … nicht erklärt“ (`impressum.html#tarot-decks`). Für die Auslieferung geklärt, für Dritte nicht. | 238 | Eigentümer | Entscheiden, ob die V2-Motive auslizenzierbar sein sollen |
| Mineral-Detailfoto: Figcaption nennt Urheber und Lizenz (Didier Descouens, CC BY-SA 4.0), das Impressum dokumentiert aber nur „Quartz Brésil“ (Hero). Ohne Quellen-URL ist die Attribution für CC BY-SA unvollständig. | 1 | Eigentümer | Quelle im Impressum ergänzen oder Bild durch eine belegte Fassung ersetzen |

## 4. Technische Risiken am Medienbestand

| Befund | Zahlen | Eigentümer | Nächster Schritt |
| --- | --- | --- | --- |
| Tarot-Decks dominieren die Auslieferung und liegen ausschließlich als JPEG vor (kein WebP/AVIF). | 476 Dateien, 58.231.562 Byte (55,5 MiB) | Eigentümer/Performance | Moderne Formate für die 300/600-Stufen prüfen; Byte-Effekt vor Umstellung messen |
| Quellfassungen der Radiästhesie-Fotos liegen unter `assets/radiasthesie/media/original/` und sind damit öffentlich abrufbar, obwohl keine Ansicht sie referenziert. | 6 Dateien, 27.546.484 Byte (26,3 MiB) | Eigentümer | Aus dem Auslieferungspfad nehmen (z. B. `docs/`) oder bewusst als Quellbeleg führen |
| `assets/radiasthesie/media/bildnachweis.html` und `ATTRIBUTION.md` stehen im Auslieferungspfad, sind aber aus der Navigation nicht verlinkt; die Pflicht-Namensnennung für CC BY-SA 3.0 (zwei Motive) hängt damit an einem unverlinkten Dokument und am Impressum. | 2 Dokumente, 2 CC-BY-SA-3.0-Motive | Eigentümer | Bildnachweis aus dem Impressum verlinken oder Motive tauschen |
| `README.md` verweist auf `assets/og-preview.png` als OG-Image; die Datei existiert im Baseline-Commit nicht. Im Markup (`index.html`) ist kein `og:image` gesetzt — die Dokumentation ist hier falsch, nicht die Auslieferung. | 0 Dateien betroffen | Eigentümer | README-Zeile korrigieren oder OG-Bild ergänzen |
| `assets/radiasthesie/media/ATTRIBUTION.md` sagt „Die Bilder sind noch nicht in `js/data/radiasthesie.js` eingebunden“ — das ist am Baseline-Stand falsch: alle sechs Motive sind als Figuren eingebunden (`js/data/radiasthesie.js`, u. a. Z. 175, 301, 622, 658, 995). | 6 Motive | Eigentümer | Nachweistext neu erzeugen, damit der Nachweis zum Stand passt |

## 5. Prüfmittel-Korrekturen

| Änderung | Grund | Nachweis |
| --- | --- | --- |
| `scripts/migration-baseline/lib/catalog.cjs`: `MEDIA_VECTOR_FORMATS` um `md` und `html` erweitert. | §8 verlangt `n/a` für Nicht-Rasterformate; der Prüfer kannte nur Vektor- und Schriftformate und verlangte für `ATTRIBUTION.md` und `bildnachweis.html` Pixelmaße (`DIMENSION_MISSING`). Die Erweiterung ändert nur Textformate; Rasterformate verlangen weiterhin Maße (Negativfall geprüft). | `node scripts/migration-baseline/validate-catalogs.cjs` |

## 6. Erfassungsregeln, die man beim Lesen kennen muss

| Regel | Warum | Nachweis |
| --- | --- | --- |
| Kristall-Stufen 320/640/1280 tragen den Alt-Text des Motivs, obwohl das Kartenraster `alt=""` rendert. | Der Raster-Alt ist bewusst leer, weil die Kartenüberschrift den Stein schon nennt; der beschreibende Alt existiert im Detaildialog desselben Motivs. Er wird wortgleich übernommen statt neu formuliert (§8 Regel 4). | `js/modules/crystals.js` figureHtml vs. figureDetailHtml; `data/crystals.json` `image_alt` |
| Tarot-Thumbnails sind als `dekorativ` geführt, Detail und Zoom mit beschreibendem Alt. | Im Raster ist `alt=""` gesetzt (der Link trägt den Namen), im Detaildialog steht „Name · Nummer — Karte aus dem Deck …“. | `js/modules/tarot.js` Z. 197, 356-360 |
| Quellfassungen unter `assets/radiasthesie/media/original/` stehen als `status: final`, `release_relevance: none`, `delivery: shipped`. | Sie sind fertige Belege, aber von keiner Ansicht referenziert — öffentlich abrufbar bleiben sie trotzdem. | `delivery` ist technisch (§5.10), nicht wertend |
| `used_on` nennt bei Radiästhesie-Fotos `#pendeln/<topic>`, auch wenn das `#pendeln/pendeln` ergibt. | Der Router baut die Route als `#pendeln/${topic.slug}`; der Themen-Slug heißt tatsächlich `pendeln`. | `js/modules/radiasthesie-model.js` Z. 173 |

## 7. Was dieser Katalog nicht leistet

- Keine juristische Freigabe. `geklaert` heißt: ein Nachweis im Repository existiert und ist hier verlinkt.
- Keine Bewertung der Bildqualität oder der Motivwahl, nur Erfassung und Rechte-Nachweis.
- Keine Messung der Ladezeit. Die Byte-Summen sind Dateigrößen; der Lighthouse-Wert ist eine getrennte Prüfung.

