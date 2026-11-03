# RAD-11 — Themenvernetzung: Integrationsstand und Zielentscheidungen

Karte: t_6955196e · Branch: `feature/radiasthesie-modul` · Stand: 3. November 2026
Grundlage: `docs/radiasthesie-recovery/MASTERPROMPT-ORIGINAL.md`, Auftrag
ESOW-RAD-11, Delta-Auftrag dieser Karte.

## 1. Was diese Karte leistet

Die acht im Auftrag genannten Themenfelder sind auf der Startseite vollständig
verortet: sieben mit einem funktionierenden internen Link, zwei ohne Bestand als
benannte Lücke mit dokumentierter Zielentscheidung. Jede Themenseite verlinkt
mindestens zwei fremde Module mit einem Abgrenzungssatz (IA §9). Die
Verknüpfung wiederholt keinen Kapiteltext: Sie zeigt auf vorhandene Kapitel und
sagt in einem Satz, was das Ziel **nicht** ist.

Neu ist ein Grenzkapitel auf der Radiästhesie-Seite („Frequenz, Schwingung,
Skala“), das die drei Kategorien trennt, ohne vorhandene Kapitel zu duplizieren:
Pendelfrequenz (Physik, Kapitel „Mechanismen“), Bovis-Skala (Kapitel 8) und
Metapher (neues Kapitel) bleiben getrennte Gegenstände mit Querverweis.

## 2. Matrix der acht Auftragsthemen

| Auftragsthema | Ziel im Bestand | Zustand | Abgrenzung |
| --- | --- | --- | --- |
| Frequenzen und Schwingungen | `#pendeln/radiasthesie/frequenz` (neu) | verlinkt | Hertz = Physik, „Schwingung“ = Metapher, Bovis = Szeneskala; nicht gleichgesetzt |
| Geomantie | — | **Lücke**, kein Link | Erdstrahlen/Gitter sind keine Geomantie; keine Route erfunden |
| Kraftorte | — | **Lücke**, kein Link | Delphi ist Orakelort, kein energetischer Kraftort |
| Chakren | `#crystals` (Chakra-Filter) | verlinkt | Überlieferte Ordnungskategorie, kein Nachweis von Energiezentren |
| Tarot | `#tarot` (+ Kapitel `tarot-1…3`) | verlinkt | Spiel des 15. Jh.; Wahrsagepraxis des 19. Jh. |
| Runen | `#runes` (+ Kapitel `runen`, `runen-20`) | verlinkt | Runen-Divination ist eine Erfindung des 20. Jh. |
| I Ging | `#pendeln/orakel/iging` | verlinkt | Keine eigene Route; Kapitel auf der Orakelseite |
| Spirituelle/historische Deutungssysteme | `#astrologie`, `#pendeln/orakel/delphi` | verlinkt | Getrennte Symbolsysteme; Orakelort ≠ Kraftort |

Quelle der Liste: `docs/radiasthesie-konzept/daten/taxonomie.json` →
`vernetzung` (9 Einträge; 7 verfügbar, 2 offen). Der Generator
(`scripts/generate-radiasthesie-data.cjs`) löst jede Route gegen die
vorhandenen Kapitel auf und bricht bei einem toten Anker ab. Pflicht-IDs sind
im Generator hinterlegt; ein fehlendes Auftragsthema bricht den Lauf ab.

## 3. Duplikatprüfung

| Thema | Vorhandener Text | Warum kein neuer Text |
| --- | --- | --- |
| Tarot | Orakel-Kapitel 2–4 | Geschichte und Praxis stehen dort; die Startseite verlinkt nur |
| Runen | Orakel-Kapitel 7–8 | dito |
| I Ging | Orakel-Kapitel 5–6 | dito, inklusive West-Rezeption |
| Chakren | Kristall-Katalog (`#crystals`) | dort bereits Filter und Zuordnung; das Modul behauptet keine Chakren-Lehre |
| Frequenzen | Radiästhesie-Kapitel 8 (Bovis), Pendeln-Kapitel 8 (Mechanik), Labor | neues Kapitel verweist dorthin, statt Formeln oder Skalen zu wiederholen |
| Delphi | Orakel-Kapitel 10–11 | wird als historischer Orakelort geführt, nicht dupliziert |

Auf den Themenseiten erscheint jedes verwandte Thema genau einmal; die Liste
„Weiterlesen“ enthält drei bis fünf Karten (verknüpfte Themen, ein
Nachbarthema, Glossar). Auf der Startseite stehen alle neun Einträge einmal.

## 4. Frequenz, Schwingung, Bovis — die Trennregel

Das Kapitel `#pendeln/radiasthesie/frequenz` (Klasse A/D, Quellen Q51, Q12)
stellt drei Kategorien nebeneinander:

1. **Physikalische Frequenz:** Schwingungsdauer eines Fadenpendels, Kehrwert in
   Hertz, abhängig von Länge und Erdbeschleunigung; im Pendellabor nachvollziehbar.
2. **Symbolische Schwingung:** Qualitätsmetapher ohne Einheit, Nullpunkt und
   Messvorschrift; keine Übersetzung in Hertz.
3. **Bovis-Skala:** Ordnungsschema der Szene, keine Einheit, kein Nullpunkt,
   kein Kalibrierprotokoll, keine SI-Größe (Kapitel 8, Q12).

Die Regel steht wörtlich im Kapitel: „Physikalische Frequenz, symbolische
Schwingung und Szeneskala werden nicht gleichgesetzt.“ Zwei Tests sichern das:
ein Inhaltstest (Kapitel vorhanden, Formulierungen vorhanden, Deep-Link löst
auf) und ein Absatztest, der Bovis und `Hz`/`Hertz`/`Tesla` im selben Absatz
ablehnt.

## 5. Navigation, Zugang, Offline, Attributionen

| Prüfpunkt | Ergebnis |
| --- | --- |
| Startseitenzugang | Hauptnavigation „Pendeln“ (8. Ziel) und Footer-Link „Radiästhesie & Pendeln“ unverändert; Themenvernetzung im Abschnitt 05 der Landingpage |
| Brotkrümel | je Themenseite „Pendeln / Thema“, unverändert |
| Zurück/Vorwärts | Browsertest: Weiterlesen → Astrologie → zurück → vorwärts, Adresse und Ansicht synchron |
| Deep-Links | `#pendeln/radiasthesie/frequenz` und `#pendeln/orakel/iging` rendern kalt, scrollen auf 116 px unter der Kopfzeile und fokussieren die Ziel-H2 |
| Kaltstart-Fokus | Router: `deepLinkFocus` für Pendeln-Unterrouten; vorher blieb der Fokus auf `<body>` (IA §8 verlangt Fokus nach dem Rendern) |
| Offline (`Lokal.html`) | `#pendeln/radiasthesie` und `#pendeln/radiasthesie/frequenz` rendern aus der Datei; Querverweise `#astrologie`, `#crystals` vorhanden; keine Netzabrufe |
| Attributionen | unverändert: sechs Fotos mit Urheber, Lizenz, Änderung und Share-Alike-Absatz; vier eigene Zeichnungen |
| Fremdmodule | nicht verändert; die Rückrichtung trägt der websiteweite Footer. Kein Cherry-Pick fremder Branches |

## 6. Integration anderer Branches (nicht übernommen)

Nicht übernommen und nicht geprüft: `feature/farbwelten-modul` (Farb-,
Chakren- und Lichtfrequenzseiten) sowie die `feature/frequenzlabor-*`-Branches.
Sie liegen auf eigenen Arbeitsständen; ein Cherry-Pick hätte Inhalte ohne
Prüfung in dieses Modul gezogen. Der Anschluss bleibt eine Zielentscheidung.

**Gemeinsame Dateien mit `feature/farbwelten-modul`** (Basis `e44fa5c`,
Stand `30a2f62`, geprüft am 3. November 2026):

| Datei | Berührung |
| --- | --- |
| `js/main.js` | Farbwelten ergänzt `FARBWELTEN_ROUTE`, Seitenliste, `initialAreaAnchor`/`isAnchorRoute`; RAD-11 ergänzt `deepLinkFocus` in `navigateTo`. Beim Merge **eine** Anker-/Fokusmechanik zusammenführen, nicht beide parallel lassen |
| `index.html` | Farbwelten ergänzt neuntes Navigationsziel und Abschnitt; RAD-11 ändert dort nichts |
| `css/design-system.css` | Farbwelten ergänzt Regeln; RAD-11 ändert dort nichts |
| `tests/radiasthesie.spec.js` | Farbwelten erwartet neun Navigationszeilen (`rows.length === 9`); auf diesem Branch sind es acht. Nach dem Merge Zählung und Kopfzeilenmessung (IA §3.2: 31,8 px Reserve bei 781 px für acht Ziele) neu messen |
| `package.json`, `.gitattributes` | additive Skript-/Attributänderungen; kein inhaltlicher Konflikt erwartet |

**Merge-Reihenfolge (Empfehlung):** zuerst Farbwelten nach `main`, dann diesen
Branch rebasen. Nach dem Merge:

1. `vernetzung.chakren` von `#crystals` auf `#farbwelten/chakren` umstellen —
   **nur** nach Inhaltsprüfung der Chakren-Seite (keine Wirkversprechen).
2. `vernetzung.frequenzen` um `#farbwelten/lichtfrequenzen` ergänzen, sofern die
   Seite physikalische und symbolische Frequenzbegriffe trennt; sonst Lücke
   benennen statt verlinken.
3. Die neun Navigationsziele messen; die Regel aus IA §3.2 gilt für acht Ziele.
4. `tests/radiasthesie.spec.js` auf neun Zeilen ziehen.

## 7. Nicht-Ziele dieser Karte

Kein Geomantie-, Kraftort- oder I-Ging-Modul; keine neuen Routen; keine
Übernahme fremder Branch-Inhalte; kein Push, keine Veröffentlichung, kein
Deployment; keine Änderung an Zugangsdaten oder Profilkonfiguration.
