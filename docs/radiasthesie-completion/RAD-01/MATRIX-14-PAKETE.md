# Ist/Soll/Evidenz-Matrix — alle 14 Pakete

Bezugsstand: `e44fa5c54c80cb39383fa4177aa587236dc87596`.

## 0. Lesart dieser Matrix (verbindlich)

Diese Matrix ist eine **Ist/Soll-Gegenüberstellung**, **keine Scope-Freigabe**.
Ein „ERLEDIGT“ bezieht sich ausschließlich auf den **Teilumfang, der im
committeten Stand tatsächlich nachweisbar ist** — nicht auf das Paket als Ganzes.
Die 14 Delta-Karten des Masters definieren den verbindlichen Soll-Zustand und
gehen alten Konzeptentscheidungen vor (insbesondere `ia-konzept.md` §7 und den
Sitemap-Kommentar zu B6).

Status: **ERLEDIGT** = Paket im committeten Stand vollständig erfüllt ·
**TEILWEISE** = Teilumfang vorhanden, Rest benannt (auch dann, wenn der
Teilumfang selbst geprüft ist) · **OFFEN** = nicht implementiert.
„Einbaupunkt“ verweist auf `INTEGRATIONSPUNKTE.md`.

## 1. Matrix

| # | Paket | Anforderung (Kurz) | Ist + Evidenz | Soll-Lücke | Status | Einbaupunkt | Offene Voraussetzung |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | Bestandsaufnahme & Architektur | Quellcode, Struktur, Routing, Inhalte, Gestaltung, Assets, SEO, Tests prüfen; Integrationsplan | `docs/radiasthesie-konzept/{ia-konzept,komponenten-specs,IMPLEMENTIERUNG}.md`; dieser Lauf: `BESTANDSAUFNAHME.md`, `MATRIX`, `INTEGRATIONSPUNKTE` | — (Plan liegt vor) | **ERLEDIGT** | Dieses Verzeichnis | — |
| 02 | Fachrecherche & Quellenbibliothek | Primärquellen, Studien, Kontroversen, Vertreter/Kritiker, Verfahren, Instrumente, kulturelle Unterschiede; strukturierte Bibliothek | `recherche/quellen.json` (33 Einträge, Schema 1.0) mit `evidence_use`, `verified`, `interest_note`, `coverage_gaps`; alle 4 Startquellen enthalten (Cantergi 2021, Enright 1995, USGS, Anomalistik); 22× Volltext, 8× Crossref, 3× ISBN | Tiefenprüfung von Q28 (nur registriert zugänglich); Datierungskonflikt 1926/1931 bleibt offen; keine deutschsprachige kontrollierte Pendelstudie gefunden | **ERLEDIGT** | §2.1 | Inhaltsentscheidung: Widerspruch offen dokumentieren (already in `coverage_gaps`) |
| 03 | Taxonomie & Datenmodell | Erweiterbares Modell für Themen, Instrumente, Methoden, Ereignisse, Erklärungsmodelle, Studien, Quellen, Medien, Experimente; Felder id/slug/title/…/reviewStatus | `js/data/radiasthesie.js`: `module`, `counts`, `levels[5]`, `topics{3}` → `sections[]` (`id`, `number`, `title`, `period`, `chips`, `blocks[]`, `words`), `glossary[]`, `sources[33]`, `landing`, `introduction`, `legal` | Keine eigenen Entitäten für Instrument/Methode/Ereignis/Erklärungsmodell/Studie/Medium/**Experiment**; kein `tags`, `reviewStatus`, `lastReviewed`; kein JSON-Schema und keine Schema-Validierung im Generator | **TEILWEISE** | §2.2 | Entscheidung: Erweiterung als **additive** Felder, damit 30 Kapitel und 16 Tests unverändert grün bleiben |
| 04 | UX/UI-Design | Hero, Themenkarten, Instrumentendarstellung, lesbare Artikel, visuelle Querverweise, responsiv, **mobil bedienbare interaktive Elemente**; Tokens haben Vorrang | Tokens unverändert; `.rad-*`-CSS 1.005 Z.; Mockup + Wireframes; 11 Breiten × 5 Ansichten 0 px Überlauf; Kontraste 6,45–8,42:1; Fokusring; Druck-Print-Styles | **Werkstatt-UX für RAD-07–10 fehlt vollständig** (Simulator, Studio, Experimente, Journal müssen mobil bedienbar werden); kein axe-/Lighthouse-Lauf; Textzoom 200 % skaliert px-Typografie nicht; Werkstatt-Komponentenspecs fehlen | **TEILWEISE** | §2.4 | U5, U6 (`README.md` §4) |
| 05 | Bildbibliothek & Lizenzen | 6 Commons-Fotos lizenzprüfen, laden, Varianten, Alt/Caption, Lizenzdaten, `media-manifest.json`, Attributionsseite; Tafeln bevorzugt eigene SVG | Nur 4 eigene SVGs (`assets/radiasthesie/`), byte-identisch zur Konzeptkopie; `asset-liste.md` markiert 6 Fotos als offen; **kein** `media-manifest.json`, keine Attributionsseite (Stand `e44fa5c`; parallele uncommittete Arbeit siehe U3) | Gesamte Pipeline fehlt: Dateiseiten-Prüfung, Download, Varianten (WebP/AVIF + Fallback), Alt/Caption-Daten, Manifest, Attributionsseite, Impressum-Snippet | **OFFEN** | §2.5 | U3 — Lizenz je Originaldateiseite; CC BY-SA 3.0 verlangt Namensnennung + Share-alike |
| 06 | Redaktionelle Themenseiten | Alle Hauptseiten der IA, Beispiele/Exkurse, **echter indexierbarer HTML-Text**, interne Verlinkung, sachliche Konsistenz | 3 Themenseiten, 30 Kapitel (8/10/12), ~13.000 Zeichen je Seite, 7 Routen, 33 Quellen mit Rückverweis, Methodik-Seite, Einordnungskasten — **aber ausschließlich als SPA-Ansicht** | **B1 Bovis-Schwellenwert falsch zugeschrieben** (Behebung uncommittet, Test derzeit rot); **B5** fünf Quellen ohne Seitenzuordnung; **kein ohne JavaScript lesbarer/indexierbarer Text** (Teil der RAD-12-Lücke); redaktionelle Gegenlesung Bovis/Forer/Delphi empfohlen | **TEILWEISE** | §2.6 | U1 — QAFIX-Karte `t_d81baa74` (Kind dieser Karte) muss B1/B5 fertigstellen; vorher keine Abnahme |
| 07 | Pendelsimulator | Länge, Anfangsauslenkung, Dämpfung, Start/Stopp, Pendelgrafiken, Bewegung + Schwingungsdauer, mechanische Erklärung; plausibel, reproduzierbar, keine Informationsbehauptung; Touch, Tastatur, reduzierte Animation | Nicht implementiert. Landingpage führt „Pendellabor“ als „In Vorbereitung“ (`js/data/radiasthesie.js:758-763`), Teaser ohne Link (`js/modules/radiasthesie-views.js:196-204`) | Gesamtes Modul: Physikmodell (T = 2π√(L/g), Dämpfungsterm), Rendering, Bedienung, Erklärtext, Tests | **OFFEN** | §2.7 | U6 — Animationsperformance mobil ungemessen |
| 08 | Pendeltafel-Studio | Ja/Nein-Tafel, Zahlenkreis, Buchstabentafel, Segmenttafeln, freie Beschriftung, Farbstile, SVG-Export, Druck/PDF; Eingaben escaped und beim Import validiert | Nicht implementiert; „Pendeltafel-Studio“ als „In Vorbereitung“ | Generator, vier Tafeltypen, Farbstile aus Tokens, SVG-Serialisierung, Druck-CSS, PDF-Weg, Import-Validierung | **OFFEN** | §2.8 | U2 — PDF nur über Browser-Druck (keine PDF-Abhängigkeit) |
| 09 | Verblindetes Experimentierlabor | Verdecktes Zufallsziel, Antwort **vor** Enthüllung endgültig gespeichert, Testarten, Zufallswahrscheinlichkeit, Zähler, Trefferquote, Zufallsvergleich, Konfidenzintervalle, Auswertung, Export, Protokoll; Demo vs. Testmodus getrennt | Nicht implementiert; „Experimentierlabor“ als „In Vorbereitung“ | Gesamtes Modul inkl. Statistik (exakter Binomialtest, Wilson-Intervall), Vorregistrierung, RNG, Persistenz, Export | **OFFEN** | §2.9 | Keine — Vertrag in `KOMPONENTENGRENZEN.md` §4 legt RNG/Statistik fest |
| 10 | Pendeltagebuch | Datum, Frage, Methode, Vorhersage, subjektive Sicherheit, Ergebnis, spätere Bewertung; datensparsam, lokal ohne Konto, Export + vollständige Löschung, Zusammenarbeit mit 09 | Nicht implementiert | Journal-Modul, lokale Speicherung, Export (JSON/CSV), „alles löschen“, Verknüpfung zu Experimentläufen | **OFFEN** | §2.10 | Keine — Vertrag in `KOMPONENTENGRENZEN.md` §5 |
| 11 | Integration verwandte Themen | Sinnvolle Verbindungen zu Frequenzen, Geomantie, Kraftorten, Chakren, Tarot, Runen, I Ging, historischen Deutungssystemen; physikalische Frequenz ≠ esoterische „Schwingung“; Bovis nicht SI; **vollständige Vernetzung ohne Duplikate** | `landing.related` verlinkt Tarot, Astrologie, Kristalle (`js/data/radiasthesie.js:775-796`); Textbezüge zu I Ging, Runen, Tarot in `orakel`; Bovis als Stufe B/E gekennzeichnet | Keine Verweise auf Frequenzen/Geomantie/Kraftorte/Chakren; diese Bereiche existieren als Seiten **nicht**; keine gemeinsamen Themenobjekte; Startseitenzugang, Nav, Deep-Links, Offline und Attributionen nicht als Ganzes geprüft | **TEILWEISE** | §2.11 | U4 — Lücke dokumentieren, keine Routen erfinden (Karte `t_6955196e`) |
| 12 | SEO, GEO, strukturierte Daten | URLs, Titel, Descriptions, Überschriften, Breadcrumbs, Canonical, interne Links, Entitäten, Quellen, Bildbeschreibungen, Sitemap; Article/BreadcrumbList passend; FAQ nur real; GEO: zitierfähig | Meta je Route (`radiasthesie.js:126-158`), BreadcrumbList-JSON-LD, Canonical Startseite, Sitemap ohne Fragmente, 79 interne Ziele ohne tote Links | **Kein indexierbares Dokument**: Inhalte existieren nur als Hash-Ansicht; **additive statische HTML-Ausgabe aus derselben Datenquelle fehlt** (Karte `t_9e4cd9bb`); `og:image` fehlt (B7); Titel 61–75 Zeichen (B8); B6 ist **nicht** durch Bestätigung erledigt | **TEILWEISE** | §2.12 | Statische Seiten sind Pflicht, nicht optional; Hash-Router bleibt für Interaktion/Offline |
| 13 | Qualitätskontrolle | Build, Routen, Links, Bilder/Lizenzen, Responsivität, Tastatur, A11y, reduzierte Bewegung, Performance, Statistik, Eingabesicherheit, Reproduzierbarkeit, Quellen, Konsistenz, Platzhalter, externe Requests, Regressionen; WCAG 2.2 AA | `TESTBERICHT.md` mit 6 Prüfpunkten und B1–B11; Build grün; Suiten grün außer `tarot-decks-v2` (CRLF, B9); 0 Konsolenfehler in 72 Läufen | Radiästhesie-Suite **nicht in CI**; kein axe/Screenreader; Statistik-/Eingabesicherheitsprüfung erst mit 09/10; kein No-JS-/Sitemap-/Canonical-Test für statische Seiten; aktueller Arbeitsbaum 1 roter Test | **TEILWEISE** | §2.13 | U5; U1 |
| 14 | Dokumentation & Übergabe | Architektur, Seitenübersicht, Datenmodell, Medien-/Lizenzverzeichnis, Quellenbibliothek, Bedienungsanleitungen, Testprotokolle, Änderungsübersicht, Einschränkungen, Ausbaustufen | `IMPLEMENTIERUNG.md`, `ia-konzept.md`, `komponenten-specs.md`, `a11y-checkliste.md`, `responsive-checkliste.md`, `asset-liste.md`, `CHECKPOINT.md`, QA-Bericht | Kein Medien-/Lizenzverzeichnis (RAD-05 fehlt); keine Bedienungsanleitungen für 07–10; keine Änderungsübersicht je Paket; keine Architekturübersicht über den Vollumfang (dieser Lauf liefert sie) | **TEILWEISE** | §2.14 | Abhängig von 05 und 07–10 |

**Zählung: 2 ERLEDIGT (01, 02) · 7 TEILWEISE (03, 04, 06, 11, 12, 13, 14) · 5 OFFEN (05, 07, 08, 09, 10) → 14/14 zugeordnet.**

## 2. Was „TEILWEISE“ konkret heißt

| Paket | Minimaler Rest für „erledigt“ | Aufwand |
| --- | --- | --- |
| 03 | Additive Felder `instrumente[]`, `methoden[]`, `studien[]`, `medien[]`, `experimente[]` + Schema-Datei + Generator-Validierung + 3–4 Tests | mittel (Generator 707 Z. mitprüfen) |
| 04 | Werkstatt-Komponentenspecs + UI für 07–10 (mobil, Tastatur, reduzierte Bewegung) + axe/Lighthouse-Nachweis | mittel–groß, an 07–10 gekoppelt |
| 06 | B1/B5 beheben (QAFIX `t_d81baa74`), indexierbaren Text über RAD-12 herstellen, redaktionelle Gegenlesung | klein–mittel, aber **Voraussetzung** jeder Abnahme |
| 11 | 4–6 Verweise mit Einordnungssatz + Lückenentscheidung dokumentieren, keine Routen erfinden | klein |
| 12 | **Statische HTML-Seiten aus derselben Quelle**, Sitemap/Canonical/JSON-LD real geprüft, `og:image`, Titelbudget sachlich geprüft | **groß** (neuer Build-Schritt + No-JS-Tests) |
| 13 | `test:radiasthesie` in CI, axe-Lauf, No-JS-/Sitemap-/Canonical-Prüfung, Statistikprüfung nach RAD-09 | mittel |
| 14 | Medienverzeichnis (nach 05), vier Bedienungsanleitungen (nach 07–10), Änderungsübersicht | mittel, **zuletzt** |

## 3. Detaillierte unbekannte Voraussetzungen

| ID | Voraussetzung | Warum unbekannt | Wirkung bei falscher Annahme |
| --- | --- | --- | --- |
| U1 | Fertigstellung der QAFIX-Karte `t_d81baa74` (Kind dieser Karte): B1/B3/B4/B5/B9/B10, B2 ursprünglich gelöst | 15 uncommittete Fremdänderungen, davon eine mit Tippfehler im Test (`model.topics.radiaesthesie`); Karte noch offen | Kein Paket kann auf „grün“ aufsetzen; ein Commit würde fremde Änderungen mitnehmen |
| U2 | PDF-Ausgabe ohne neue Abhängigkeit | `package.json` enthält keine PDF-Bibliothek; jsPDF/pdf-lib wäre eine neue Laufzeitabhängigkeit | PDF-Export wäre Dependency-Entscheidung oder nur Druckdialog |
| U3 | Lizenzstatus der sechs Commons-Fotos | Dateiseiten je Datei erneut zu prüfen; CC BY-SA 3.0 ist share-alike. Parallelarbeit `t_187d5f52` erzeugt derzeit uncommittet `assets/radiasthesie/media/` — **kein** Nachweis im committeten Stand | Falsche Attribution oder Lizenzverstoß |
| U4 | Zielentscheidung Frequenzen/Geomantie/Kraftorte/Chakren | RAD-11-Karte verlangt: keine Routen erfinden, Lücke dokumentieren | Konkurrierende Seiten ohne Redaktion; doppelte Navigation |
| U5 | Screenreader-/axe-Prüfung | Im Prüfumfeld nicht verfügbar (TESTBERICHT §5) | „WCAG 2.2 AA erfüllt“ bliebe unbelegt |
| U6 | Performanz von Animation/Canvas auf Mobilgeräten | Nicht gemessen; kein Gerät im Prüfumfeld | Ruckeln/Akkuverbrauch; `prefers-reduced-motion` deckt das nicht ab |
| U7 | Granularität der statischen Ausgabe (eine Seite je Thema vs. je Kapitel) und Pfadlayout | RAD-12 fordert „Landing-/Inhaltsseiten“, lässt die Granularität offen | Zu viele dünne Seiten (Duplicate Content) oder zu wenige (Kapitel nicht zitierfähig) |

## 4. Abgrenzung — korrigiert gegenüber der ersten Fassung

Was **nicht** zu den 14 Paketen gehört:

- Deployment, Push auf `main`, Veröffentlichung — von der Karte ausgeschlossen.
- Änderungen an `css/design-system.css`/`css/main.css` über die zwei dokumentierten
  Kopfzeilen-Regeln hinaus.
- Ein siebtes Startseiten-Kachelchen (bewusst bei sechs Karten, `IMPLEMENTIERUNG.md` A9).

Was **sehr wohl** dazugehört und in der ersten Fassung falsch abgegrenzt war:

- **Additive statische HTML-Ausgabe** für die Radiästhesie-Inhalte aus derselben
  Datenquelle. Der Bestand (nur Hash-Ansichten) ist ein **Mangel**, keine
  Entscheidung. Verbindlich ist Karte `t_9e4cd9bb`: „statische echte
  HTML-Landing-/Inhaltsseiten aus derselben Datenquelle erzeugen und korrekt in
  `build-pages`/`build-local`/`verify-pages` integrieren … Sitemap ohne
  Fragmente … Abnahme: erzeugtes HTML enthält Kerntexte ohne JS“.
- Der **Hash-Router bleibt** — für Interaktion, Werkzeuge (07–10) und die
  Offline-Edition. Statische Seiten sind **zusätzlich**, kein Ersatz. Damit
  entfällt die alte Formulierung „Sitemap-Entscheid bestätigen“ und „Ersatz der
  Hash-Routen ist nicht Teil der 14 Pakete“.
- **Indexierbarkeit ist Teil von RAD-06 und RAD-12**, kein SEO-Sonderfall: ohne
  statisches HTML existiert der redaktionelle Text für Suchmaschinen und
  KI-Antwortsysteme nicht — das GEO-Ziel des Auftrags wäre unerfüllt.

## 5. Verhältnis zu den Board-Karten

Der Master `t_878c59c7` und die Delta-Karten existieren bereits; diese Matrix
ist **Ausführungs- und Prüfgrundlage**, keine Zerlegung. Berücksichtigte Karten:

| Karte | Bezug in dieser Matrix |
| --- | --- |
| `t_a077bd83` | RAD-01 (dieser Lauf) |
| `t_d81baa74` | QAFIX zu RAD-06/B2–B5, Kind dieser Karte, `coding_debug` |
| `t_6955196e` | RAD-11 (Integration, keine erfundenen Routen) |
| `t_9e4cd9bb` | RAD-12 (statische Ausgabe, No-JS-Nachweis) |
