# ESOW-RAD-01 — Bestandsaufnahme und Architektur (Delta-Lauf)

Karte: `t_a077bd83` · Master: `t_878c59c7` / ESOW-RAD-000
Branch: `feature/radiasthesie-modul` · Ausgangscommit: `e44fa5c54c80cb39383fa4177aa587236dc87596`
Stand: 3. November 2026 · Status: **Integrationsplan vollständig, 14/14 Pakete zugeordnet**

## 1. Was dieser Lauf ist — und was nicht

Dies ist die **Fortsetzung** des bestehenden Themenmoduls, kein Neustart. Der
erste Teilumfang (drei Themenseiten, 30 Kapitel, 33 Quellen, Glossar, Suche,
Methodik, vier eigene SVGs) ist mit `e44fa5c` implementiert und durch
`docs/radiasthesie-konzept/qa-t_d84585a8/TESTBERICHT.md` geprüft — dieser
Bericht ist ausdrücklich **keine** Abnahme der 14 Pakete.

Geschrieben wurde ausschließlich dieses Verzeichnis
(`docs/radiasthesie-completion/RAD-01/`). Kein Produktionscode, keine
Design-Tokens, keine Tests, kein Build, kein Commit fremder Dateien, kein Push,
kein Deployment.

## 2. Dokumente

| Datei | Inhalt | Abnahmebezug |
| --- | --- | --- |
| `BESTANDSAUFNAHME.md` | Ist-Zustand über die acht Prüfdimensionen des Originalauftrags, je mit Datei-/Zeilenbeleg | „Prüfe: Quellcode, Struktur, Routing, Inhalte, Gestaltung, Assets, SEO, Tests/Deployment“ |
| `MATRIX-14-PAKETE.md` | Ist/Soll/Evidenz für **alle 14** Pakete, Status ERLEDIGT/TEILWEISE/OFFEN | „Alle vorgesehenen Erweiterungen besitzen konkrete Integrationspunkte“ |
| `INTEGRATIONSPUNKTE.md` | Konkrete Datei-, Router- und Build-Einbaupunkte je Paket mit Zeilenankern | dito, technisch ausführbar |
| `KOMPONENTENGRENZEN.md` | Grenzen für Simulator, Studio, Experimente, Journal + Speicher-/Export-/Eingabevalidierungsvertrag | „Unbekannte Voraussetzungen sind gekennzeichnet“ |
| `REIHENFOLGE.md` | Abarbeitungsreihenfolge mit Single-Writer-Begründung und Dateikollisionskarte | Abschlussvorgabe der Karte |
| `NACHWEIS-WORKTREE.md` | Kontinuität des Worktrees, Fremdarbeit unverändert (SHA-256), ausgeführte Testläufe | Abschlussvorgabe der Karte |
| `CHECKPOINT.md` | Stand/Dateien/SHA/Tests/Restpunkte/Nächster Schritt | Checkpoint-Vorgabe |

## 3. Kurzbefund

- **Zwei Pakete sind vollständig erfüllt** (01, 02). RAD-01 ist dieser Plan;
  RAD-02 ist die geprüfte Quellenbasis (33 Einträge, alle vier Startquellen,
  dokumentierte Lücken).
- **Sieben Pakete sind Teilumfänge** (03, 04, 06, 11, 12, 13, 14). Vorhanden sind
  ein tragfähiges Datenmodell ohne Instrument-/Studien-/Experiment-Entitäten,
  ein geprüftes visuelles System **ohne Werkstatt-UX**, 30 redaktionelle Kapitel
  **ohne indexierbares HTML**, eine Teilvernetzung, dynamische Metadaten,
  ein QA-Bericht mit offenen Befunden und eine Übergabe ohne Medienverzeichnis.
- **Fünf Pakete sind offen** (05, 07, 08, 09, 10): Bildbibliothek/Lizenzen sowie
  die vier Werkstatt-Module. Sie sind auf der Landingpage als „In Vorbereitung“
  gekennzeichnet — der Text behauptet keine Funktion.
- **Diese Matrix ist keine Abnahme.** RAD-04 gilt nicht als erledigt, solange die
  Werkstatt-UX fehlt; RAD-06 nicht, solange B1 ungeheilt und der Text nicht
  indexierbar ist; RAD-12 nicht durch Bestätigung der alten B6-Entscheidung,
  sondern nur durch additive statische HTML-Ausgabe aus derselben Datenquelle
  (Karte `t_9e4cd9bb`), ohne den Hash-Router zu ersetzen.
- **Ein akuter Befund außerhalb meines Schreibrechts:** Im Arbeitsbaum liegen 15
  uncommittete Fremdänderungen aus der QAFIX-Karte `t_d81baa74` (Kind dieser
  Karte). Eine davon bricht `tests/radiasthesie.mjs` (Tippfehler
  `model.topics.radiaesthesie` statt `radiasthesie`). Der committete Stand
  `e44fa5c` ist mit 16/16 grün. Details und SHAs: `NACHWEIS-WORKTREE.md` §4.
- **CI führt die Radiästhesie-Suite nicht aus.** `.github/workflows/ci.yml` ruft
  `npm run test:radiasthesie` nicht auf, obwohl das Skript in `package.json:25`
  existiert. Dadurch wäre der rote Test oben in der Pipeline unsichtbar — ein
  konkreter Einbaupunkt für RAD-13.

## 4. Unbekannte Voraussetzungen (Kurzliste, Details in `MATRIX-14-PAKETE.md` §3)

| ID | Offene Voraussetzung | Blockiert |
| --- | --- | --- |
| U1 | Fertigstellung der QAFIX-Karte `t_d81baa74` (B1–B5, B9, B10, B2 ursprünglich) | RAD-06, RAD-13 |
| U2 | PDF-Ausgabe: keine PDF-Bibliothek in `package.json`; Browser-Druck ist der einzige abhängigkeitsfreie Weg | RAD-08 |
| U3 | Lizenzprüfung der sechs Commons-Fotos je Originaldateiseite (CC BY-SA 3.0 = Namensnennung + Share-alike) | RAD-05, RAD-14 |
| U4 | Zielentscheidung Frequenzen/Geomantie/Kraftorte/Chakren: Lücke dokumentieren, keine Routen erfinden | RAD-11 |
| U5 | Screenreader-/axe-Lauf ist im Prüfumfeld nicht verfügbar | RAD-13 |
| U6 | Performance von Canvas/SVG-Animationen auf niedrig getakteten Mobilgeräten ist ungemessen | RAD-07, RAD-13 |
| U7 | Granularität der statischen Ausgabe (je Thema vs. je Kapitel) und Pfadlayout | RAD-12 |

## 5. Kontext, der nur im kanonischen Repository liegt

`docs/radiasthesie-recovery/` (Originalauftrag, 14 Paketdateien) und
`docs/radiasthesie-konzept/qa-t_d84585a8/` (Prüfbericht) existieren **nicht** im
Arbeitsbaum `esow-rad-t_878c59c7`, sondern nur unter
`C:/Users/mas/Arbeit/Esoterik-Welt/` (Branch `feature/farbwelten-modul`, dort
parallel genutzt). Beide wurden read-only gelesen; im kanonischen Baum wurde
nichts geschrieben und kein Branch gewechselt.
