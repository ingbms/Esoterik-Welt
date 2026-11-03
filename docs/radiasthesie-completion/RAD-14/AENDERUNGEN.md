# Änderungsübersicht

**Basis:** `e44fa5c` (erster Teilumfang: 3 Themenseiten, 30 Kapitel, 33 Quellen, Glossar/Suche/Methodik, 4 SVGs)
**Ziel:** `ceddc84cfca44d53f1995dfd0981b7d70a554724` (unabhängig geprüfter Kandidat)
**Kandidatenumfang:** 463 Dateien, +107 893 / −665 Zeilen, 31 Commits · **kein Push, kein Deployment**

Die folgenden Detailgruppen und ersten 28 Commitzeilen sind die historische
Aufstellung bis `5fe5301`. Aktuelles Delta zum Kandidaten: zusätzlich `1f78942`
(erste RAD-14-Übergabe), `b420a79` (F1/F2-Fix) und `ceddc84` (Nachtest-Evidenz).
Die aktuelle Dokumentationsfortschreibung kommt danach und ist nicht in den
Kandidatenzahlen enthalten.

## 1. Was sich für Nutzer ändert

| Vorher | Nachher |
| --- | --- |
| Landingpage kündigte vier Werkzeuge als „in Vorbereitung“ an | vier Werkzeuge sind verfügbar und verlinkt: Pendellabor, Tafel-Studio, Experimentierlabor, Pendeltagebuch |
| 33 Quellen | 66 Quellen mit Prüftiefe, Interessenvermerk und Aussagenzuordnung |
| 30 Kapitel, nur im Browser lesbar | 32 Kapitel; sieben statische, ohne JavaScript lesbare und indexierbare Dokumente |
| Glossar mit 13 Begriffen | 17 Begriffe |
| keine Fotos im Modul | 6 Commons-Fotos mit `<picture>` (AVIF/WebP), Alt-Text, Bildunterschrift und Lizenzzeile |
| keine Werkstatt-UX-Spezifikation | gemessenes Mockup über 22 Zustände, 4 Breiten, Tastatur und Druck |
| keine Themenvernetzung | 7 verlinkte Anschlüsse, 2 benannte Lücken (Geomantie, Kraftorte), Grenzkapitel Frequenz/Schwingung/Bovis |
| keine strukturierten Daten | BreadcrumbList, Canonical, `og:*`, Sitemap ohne Fragmente |
| Seiten-Metadaten nur im Browser | Titel, Beschreibung, Canonical auch im statischen HTML |

## 2. Dateigruppen (Diff gegen `e44fa5c`)

| Bereich | Dateien | Zeilen +/− | Inhalt |
| --- | --- | --- | --- |
| `docs/radiasthesie-completion/` | 328 | +70 118 / ±0 | Checkpoints, Berichte, Evidenz (Screenshots, JSON-Sonden, Gate-Logs), Prüfskripte |
| `assets/` | 33 | +1 154 | 6 Originale, 24 Varianten, Manifest, Attributionsseite, eigene SVGs unverändert |
| `js/` | 19 | +10 035 / −185 | Datenmodul, Ansichten, Verträge, vier Werkzeuge, Router-Korrektur |
| `tests/` | 15 | +5 353 / −23 | 7 Node-Suiten, 6 neue Browserspecs, Anpassungen bestehender Specs |
| `docs/radiasthesie-konzept/` | 11 | +3 303 / −207 | Inhalte, Quellenregister, Taxonomie, IA- und Umsetzungsdokumentation |
| `radiasthesie/` | 7 | +2 117 | erzeugte statische Dokumente |
| `scripts/` | 5 | +1 015 / −57 | Datengenerator, Seitengenerator, Build, Offline-Build |
| `css/` | 3 | +2 254 | `radiasthesie.css`, `radiasthesie-statisch.css`, kleine Ergänzung im Design-System |
| `sitemap.xml` | 1 | +10 / −6 | 11 Dokumente, keine Fragmente |
| `package.json` | 1 | +8 / −2 | sieben neue Testskripte, `test:all` erweitert |
| `Lokal*.html` | 5 | +4 602 / −184 | Offline-Build neu erzeugt |
| `index.html`, `.prettierignore`, `.gitattributes` | 3 | +14 | Markensuffix-Regel, Ignore für erzeugte Seiten, Zeilenenden |

## 3. Commits in Reihenfolge

| # | Commit | Art | Inhalt |
| --- | --- | --- | --- |
| 1 | `82136f5` | docs | Integrationsplan RAD-01: Ist/Soll-Matrix 14 Pakete, Einbaupunkte, Komponentenverträge |
| 2 | `d1c5ea0` | fix | QA-Befunde B1–B5, B9, B10 behoben, B2 am Markup gelöst |
| 3 | `092add2` | docs | QAFIX-Checkpoint nach dem Commit ergänzt |
| 4 | `66439e5` | feat | Datenverträge und Taxonomie für Instrumente, Studien, Experimente, Journal (RAD-03) |
| 5 | `71fc916` | docs | RAD-03-Checkpoint um Commit und Nachweise ergänzt |
| 6 | `bfca75b` | docs | RAD-04 Werkstatt-UX, gemessenes Mockup, P4-Fokusfix, korrigierte Messwerte |
| 7 | `fca1ffe` | feat | interaktives Pendellabor mit nichtlinearem Modell (RAD-07) |
| 8 | `3ef7939` | docs | RAD-07-Checkpoint um Commit und Nachweise ergänzt |
| 9 | `2d1a1de` | feat | Pendeltafel-Studio mit geprüften SVG- und Druckexporten (RAD-08) |
| 10 | `1e0d55f` | fix | Tafelbeschriftungen mit Randabstand, ehrliche Vorlagenanzeige (RAD-08) |
| 11 | `9a7a5db` | docs | RAD-08-Checkpoint, Exportdokumentation, Nachweise |
| 12 | `36fc605` | feat | verblindetes Experimentierlabor mit exakter Statistik (RAD-09) |
| 13 | `589a387` | docs | RAD-09-Checkpoint und Browser-Nachweise |
| 14 | `de93baa` | feat | lokales Pendeltagebuch mit Export und vollständiger Löschung (RAD-10) |
| 15 | `ac143e7` | docs | RAD-10-Checkpoint und Browser-Nachweise |
| 16 | `5a9b3e0` | fix | neueres Journal-Schema blockiert Schreiben statt zu überschreiben |
| 17 | `4f44b55` | docs | RAD-10-Checkpoint um Schema-Schutz und Testzahlen ergänzt |
| 18 | `88efdd7` | fix | Speicherhinweis nennt den optionalen Experimentbezug |
| 19 | `90704be` | docs | RAD-10-Checkpoint ohne veralteten View-Hash |
| 20 | `708ced9` | feat | Themenseiten erweitert, Delta-Quellen und Fotos eingebunden (RAD-06) |
| 21 | `8e3070e` | feat | Themenvernetzung, Frequenzgrenze, Deep-Link-Fokus (RAD-11) |
| 22 | `50c389f` | docs | RAD-11-Checkpoint, Integrationsmatrix, Browser-Evidenz |
| 23 | `e46e2dd` | fix | Einleitung der Themenvernetzung: sieben Anschlüsse, zwei Lücken |
| 24 | `57bb442` | docs | RAD-11-Checkpoint nennt alle drei Commits |
| 25 | `476fcaf` | feat | statische indexierbare Themenseiten und SEO-Daten (RAD-12) |
| 26 | `d695ad7` | docs | RAD-12-Checkpoint, Entscheidungen, Prüfevidenz |
| 27 | `9bf5f73` | test | Überschriftenordnung und eindeutige IDs der statischen Dokumente |
| 28 | `5fe5301` | test | unabhängige Abnahme RAD-13: Bericht, Checkpoint, Evidenz |

Die F1/F2-Korrektur ist im aktuellen Kandidaten enthalten: zusätzliche
Unterstreichung von Textlinks, responsive Foto-Slots, Begrenzung des einzigen
520er-Motivs und ergänzte Regressionstests. Die unabhängige Bestätigung ist in
[NACHABNAHME.md](NACHABNAHME.md) belegt.

## 4. Wesentliche technische Entscheidungen

| Entscheidung | Begründung | Ort |
| --- | --- | --- |
| Statische Dokumente aus denselben Renderfunktionen statt eigener Templates | eine Quelle für Browser und Crawler, kein zweiter Textbestand | RAD-12 |
| Hash-Router bleibt; statische Ausgabe ist additiv | kein Umbau der bestehenden Seite, kein Risiko für andere Module | RAD-12 |
| Werkzeuge ohne Query-Zustand | eine Adresse darf keinen Versuch, keine Tafel, kein fremdes Tagebuch vortäuschen | RAD-07…10 |
| SVG-Export selbst erzeugt, kein SVG-Import | fremdes SVG ist der gefährlichste Eingabepfad | RAD-08 |
| Verblindung über SHA-256-Commitment, Salt nur im Speicher | Ziel ist vor der Enthüllung nicht rekonstruierbar gespeichert | RAD-09 |
| exakter Binomialtest statt Normalapproximation | kleine Fallzahlen (16–25) verbieten die Näherung | RAD-09 |
| Web Crypto ohne `Math.random`-Fallback | ein Test ohne echten Zufall wäre wertlos | RAD-09 |
| Löschung nach Präfix `esot_rad_` | vollständige Löschung muss auch Experimentläufe und Sicherungen erfassen | RAD-10 |
| Fotos nicht in den 520×400-Zeichnungsslot zwingen | der Slot hätte beschnitten; Höhe folgt dem echten Seitenverhältnis | RAD-06 |
| Taxonomie-Fotos bleiben `planned` | Vertrag nicht lockern, Manifest bleibt maßgeblich | RAD-06 |

## 5. Was ausdrücklich nicht geändert wurde

- **Kein Push, kein Deployment, kein Branchwechsel** in `C:/Users/mas/Arbeit/Esoterik-Welt` (kanonisches Repository, parallel von Farbwelten genutzt).
- **Keine fremden Änderungen** gestaged, resettet oder gestasht; die im Arbeitsbaum liegenden Evidenzdateien aus RAD-08/09/10 (PDF, PNGs) und `evidence/` blieben unangetastet.
- **Keine Änderung an Nachbarmodulen**: Tarot, Runen, Kristalle, Mond, Astrologie, Blog, Rechtsseiten und `css/main.css`/`design-system.css` blieben unverändert (Ausnahme: Markensuffix-Regel in `js/main.js`, die alle Module betrifft, und die Fokus-Korrektur für Pendeln-Unterrouten).
- **Keine Lizenzentscheidung**: es wurde keine `LICENSE`-Datei angelegt und keine Lizenz erfunden.
- **Keine erfundenen Quellen, Routen oder Bilder**: fehlende Themen (Geomantie, Kraftorte) bleiben als Lücke ohne Link.
