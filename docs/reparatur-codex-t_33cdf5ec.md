# Abschluss der Rubriken-Reparatur — t_33cdf5ec

Datum: 3. November 2026. Bestehender PR: https://github.com/ingbms/Esoterik-Welt/pull/18.

## Ergebnis

Frequenzen, Pendeln/Radiästhesie und Farbwelten sind gemeinsam integriert. Die
Hauptnavigation hat zehn Ziele, die Startseite neun nummerierte Zugänge. Die
zwölf Farbseiten und die drei Themenseiten Farbtherapie, Farbpsychologie und
Lichtmedizin sind vorhanden. Alle elf vorgesehenen Datenmodule und sieben
indexierbare Radiästhesie-Dokumente sind enthalten. Die Sitemap enthält echte
Dokumente statt nicht indexierbarer Fragment-URLs.

Der bestehende Zweig `feature/rubriken-vollstaendig` wurde fortgeführt. Neben den
ursprünglich integrierten Ständen `ea08d07` und `30a2f62` enthält er die neuere
Farbwelten-Integration `228210d`, den Bibliografie-/Sync-Stand `3608eb0` und die
Restdokumentation/Datenkorrekturen `6cfe589`. Es wurde keine zweite Reparatur
implementiert und kein Direkt-Push auf `main` vorgenommen.

## Nachbesserungen

- **Vollständige Quellenprüfung:** Farbseiten teilen das globale Register. Die
  drei Themenseiten besitzen eigene Bibliografien, in denen eine identische
  Ziffer eine andere Quelle bezeichnen darf. Die Prüfung vergleicht alle
  18 Dokumente mit dem jeweils tatsächlich gerenderten Register. Der frühere
  vorbereitete Ausschluss der Themenseiten wurde verworfen.
- **Quellenlinks:** URL- und DOI-Angaben vor erläuternden Klammern werden als
  anklickbare Links ausgegeben; Erläuterungen bleiben erhalten. Gemeinsamer
  Parser für Generator und Prüfung. Drei Regressionstests sichern Links,
  lokale/global unterschiedliche Kennungen und echte lokale Divergenzen ab.
- **Reserve:** Das ausdrücklich freigegebene NFR-1-Gesamtlimit von 92.000 Byte
  ist in Gate und ADR §14 festgehalten. Aktuell 88.855 Byte gzip, Reserve
  3.145 Byte. NFR-2 46.884/100.000 Byte, NFR-3 3.951/6.000 Byte. Die Warnung
  bei weniger als fünf Prozent Reserve bleibt sichtbar; Überschreitung des
  Limits bleibt ein Fehler.
- **Startseite:** Die alte Angabe „Sieben Farbwelten“ nennt jetzt korrekt zwölf.
- **Dauerhafte Integrationstests:** CI führt sämtliche Radiästhesie-Verträge,
  Farbwelten-Tests und Quellenabgleich aus. Die Buildprüfung verlangt zusätzlich
  das gemeinsame Zielbild mit zehn Navigationseinträgen, zehn Sektionen und
  neun Startseitenkarten. Die Projektregeln stehen versioniert in `AGENTS.md`.

## Validierung

| Prüfung | Ergebnis |
|---|---|
| `npm run test:all` | vollständig grün |
| Jest plus Node-Verträge/Funktionstests | 361 bestanden |
| Playwright-Browsersuite | 224 bestanden, keine Flaky-/übersprungenen Fälle |
| Produktions- und Offline-Build | grün |
| Codeprüfung / Formatprüfung | grün |
| Quellenabgleich | alle 18 Dokumente, 0 Fehler, 0 Hinweise |
| Drei Größenlimits | eingehalten; NFR-1-Reservewarnung bleibt sichtbar |
| Seitenprüfung | 69 Seiten/Viewports, 0 Fehler; sieben statische Dokumente |
| Gemeinsamer Navigations-Smoke | 18 Schritte, 0 Befunde, 0 Konsolenmeldungen |
| Farbwelten-Rendering | alle zwölf Farben, Einstieg, Chakren, Lichtfrequenzen und drei Themenseiten |

Der vollständige lokale Testlauf war vor der abschließenden Änderung des
Startseitentextes grün. Danach wurden Build, Quellen-, Größen-, Code- und
Formatprüfung sowie der Navigations-Smoke erneut ausgeführt. Die GitHub-CI
prüft die vollständigen Suiten zusätzlich am exakten eingecheckten PR-Head.
Der maschinenlesbare Nachweis steht unter `evidence/reparatur-codex/`.

Die redaktionellen Markdown-Quellen wurden nicht verändert. Hashes aller
18 Farbwelten-Quelldateien und der geprüften Skripte stehen in
`pruefnachweis.json`. Die erzeugten `Lokal*.html` sind aus den integrierten
Quellen neu gebaut; historische Screenshotänderungen aus Testläufen gehören
nicht zur Produktänderung.

## Aufgaben und verbleibender Umfang

Die sechs automatisch erzeugten Unterkarten zur Reparatur werden anhand dieses
gemeinsamen Ergebnisses abgeschlossen: Integrationsbasis/Radiästhesie,
Farbwelten-Merge, Navigation/Startseite, Sitemap/Daten, QA und Merge-Review.
Anschließend wird die übergeordnete Reparaturkarte abgeschlossen. Der genaue
Abschlusscommit, CI-Lauf und Veröffentlichungsnachweis werden in den jeweiligen
Karten als strukturierter Handoff hinterlegt.

Katalog, VELARKANA und der separate allgemeine Releaseauftrag bleiben geparkt.
Eine neue Gesamtprüfung per Safari/iOS, manuellem Screenreader oder Hörtest wird
nicht behauptet; die bisherigen entsprechenden Auflagen bleiben separat
dokumentiert. Die vorhandenen lokalen Tarot-Änderungen im Hauptverzeichnis
werden bei dessen Aktualisierung gesichert und wieder angewendet.
