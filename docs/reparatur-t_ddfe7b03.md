# Esoterik-Welt: lokale Korrektur M1–M5 / t_ddfe7b03

**Implementierung technisch geprüft, unveröffentlicht. Keine unabhängige Schlussfreigabe.** Die vorgegebene nachgelagerte Karte t_befcdea7 prüft diesen lokalen Stand; kein Same-Card-Review und keine neue Fixkarte. Prüfung am 2026-11-01T14:52:08.753Z.

## Scope und erhaltene Eingänge

Ausschließlich C:/Users/mas/Arbeit/Esoterik-Welt. HEAD und frisch gelesener Remote-main bleiben 24d8053ebc1bc4438a35a1c52b5d6f8c1718594e. Pages-API: https://ingbms.github.io/Esoterik-Welt/, legacy/main/; built. Produktion bleibt der separat reproduzierte alte Fehlerzustand. **Kein Commit, Stage, Push oder Deploy**, keine Pipelineänderung, keine Stilkonzeptmigration oder Bildproduktion.

Verbindliche Eingaben gelesen: docs/visueller-review-t_befcdea7.md und evidence/t_befcdea7/comparison.html, token-layout.json, interactions.json, retest.json, axe-source.json, contrast.json. Bestehende Offline-Einstiegslösung einschließlich eingebettetem Kristall-JSON und vorangegangener Tarot-Restore-Korrektur übernommen. Vorherstatus, Diff und Originalquellen in evidence/t_ddfe7b03/{initial-manifest.json,initial-diff.patch,original/}.

4250 vorbestehende geänderte/unversionierte Dateien manifestiert; außerhalb der expliziten Quellen-/Lokal-Ausgabe-Allowlist **0 Änderungen**. Insbesondere alle 11 manifestierten vorbestehenden unversionierten Tests/Testresultate bytegleich. Kein Router-/Plugin-Worktree geändert. Testläufe schreiben ausschließlich unter eigener Evidenz, nicht in fremde Testresultate.

## Reproduktion, Hypothesen und ursächliche Korrekturen

Die fünf gelieferten Ursachen wurden zunächst real auf Produktion und im lokalen Produktionsbuild reproduziert; beide Serien enthalten je 48 Original-Chromium-PNGs bei 375/768/1440 × 900. Vorher ist ein diagnostischer Fehlerzustand, **kein genehmigtes Design-Soll**. Keine historische Sollbaseline erfunden.

| Ursache / falsifizierbare Vorhersage | Korrektur und überprüftes Resultat |
|---|---|
| M1: Zu dichte globale Raster plus doppelte Karten-/Contentpolster lassen lange Wörter/Formeln überlaufen. Ein nur auf Dokumentbreite prüfender Test bleibt grün. Größere Inhaltskarten und echter Umbruch müssen den inneren Overflow beseitigen. | Inhaltsraster minmax(min(100%,280px),1fr); kompakte Raster nur bei Tarot/Runen. Kristall-/Artikel-Outerpadding entfernt, ein Contentinset; min-width:0 und overflow-wrap:anywhere. Mobil eine Inhaltsspalte, keine zusätzliche Abschneide-/Ellipsenlösung. 14/14 M1-Assertions pro HTTP-/Dateimatrix grün; sämtliche erfassten Kartenüberschriften, Beschreibungen und Formeln ohne horizontalen inneren Overflow. Vorher Lapisformel 170/84px. |
| M2: Zweispaltige inline Runendeutung erzwingt auf Mobile überbreite intrinsische Spalten. Einspaltiger Reflow muss Dialog-scrollWidth auf clientWidth reduzieren. | Eigene responsive .rune-modal-interpretations mit minmax(0,1fr), mobil eine Spalte, kontrollierter Umbruch. Erster Runendialog bei375 vorher 345/325px, nachher 325/325px. Alle vier Dialogfamilien in drei Breiten ohne gemessenen horizontalen Innenoverflow. |
| M3: Inline-404 enthält eigene Gold-/Cormorant-/Radiuswerte. Einbinden gemeinsamer Tokens muss die tatsächlichen berechneten Marken-/Komponentenwerte vereinheitlichen. | 404 an css/design-system.css + main.css angeschlossen; Purple/Cinzel, Card16px, Buttons8px. Projektbasis und beide Rücklinks erhalten. 3/3 je HTTP/Datei bestanden; verschachtelte echte 404 separat getestet. |
| M4: Türkistext ist im optionalen Light-State auf dem transluzenten Türkisbadge zu hell. Ein eigener dunkler Texttoken muss AA über dem tatsächlich zusammengesetzten Hintergrund erreichen. | --color-secondary-text: Dark unverändert, Light #006b61. Nach Abwarten der Theme-Transition je30 Badges pro Theme/Breite geprüft: Light mindestens 5.75:1, Dark 8.53:1 im Canvas-/sRGB-Kompositverfahren. Axe vorher30 Kontrastknoten, nachher0. Unterschiede zur historischen 8,47-/1,58-Axe-Rechnung durch Rundung/Alpha-Verfahren offen, kein pixelbasiertes Kontrastversprechen. |
| M5: Module öffnen/verschließen mit unabhängigen RAF-/Timeout-/Trap-Implementierungen; Kristalle initialisieren Fokus vor sicher sichtbarem Dialog, Runen/Wissen ohne Fokusmanagement, Hauptcode und Module haben doppelte Closepfade. Ein gemeinsamer sichtbarkeitsunabhängiger Lifecycle muss sofort fokussieren, Tab zirkulieren, Hintergrund inert setzen und den ursprünglichen Auslöser wiederherstellen. | Neuer DialogController in js/dialog.js, vor Modulen registriert. Alle vier Familien nutzen ihn: sichtbar schalten vor Fokus, dynamische sichtbare/aktive Fokusziele, Capture-Tab/Escape, Focusguard, bestehende inert-/Overflowzustände sichern und zurücksetzen, Close ohne konkurrierende Timer. Aktualisierung verwandter Kristalle behält den ursprünglichen Auslöser. Vorhandene Tarot-Restorekorrektur bleibt auch im isolierten Legacy-Regressionstest erhalten. 12/12 stabile Reload→Enter→1800ms→Tab/Shift+Tab→Escape/Restore-Flows je Matrix grün, zusätzlich Wiederholungs-/Randfälle unten. |

Die dokumentierten Tarot-Ergebnisse älterer stabiler Retests werden nicht in einen genehmigten Fehlerzustand umgedeutet. Die neue strengere Vorhermatrix fordert zusätzlich inert für alle Familien; deshalb dürfen deren aggregierte roten M5-Assertions nicht pauschal als zwölf neue Fokusursachen gezählt werden. Rohfokuswerte sind erhalten. Tarot ist nach der gemeinsamen Umstellung in Reduced und Normal Motion explizit regressionsgeprüft.

## Minor-Scope

- N1: Drei Rechteseiten laden für HTTP exakt dieselbe bestehende Google-Fonts-URL wie die App. CDP bestätigt tatsächlich **Cinzel/Inter** statt Georgia/Segoe UI. Keine inhaltliche Änderung der Datenschutzaussagen; dies ist keine Datenschutzfreigabe. Offline bleiben bewusst überall System-Fallbacks ohne Fontrequests.
- N2: Muted-Token-Dokumentation auf #a99bbd und tatsächlich vorhandene 4px-Schritte aktualisiert.
- N3: Emoji-/Symboltafeln und UI-SVGs als unterschiedliche Bildklassen dokumentiert. Individuelle redaktionelle Illustrationen fehlen weiterhin; keine neue Bildproduktion oder Nachtatelier-Migration.
- N4: Hoverbewegung nur an interaktiven/semantischen Aktionscards. Drei Rechtskarten vorher transformY(-4px), nachher none; vorhandene interaktive Cards behalten Feedback.

## Tatsächlich ausgeführte Prüfungen

Chromium 156.0.8078.4, Windows, DPR1, 375/768/1440 ×900. Hauptmatrix Reduced Motion; zusätzliche Wiederholungsmatrix Normal Motion. Es sind Browser-/DOM-/Bildbelege, nicht bloße HTTP200-Abfragen.

| Lauf | Ergebnis |
|---|---|
| Frische HTTP-Produktionsvorschau | 102/102 Assertions; 30 Routenansichten; 18 echte Navigationsklicks; 12 Dialogflows; 48 PNGs; keine JS-/Requestfehler |
| Wirklich offline über file:// | 102/102 Assertions; dieselbe Zehn-Routen-/Drei-Breiten-Matrix, Navigation, Dialoge und Kontrast; 48 PNGs; keine JS-/Requestfehler |
| Normal Motion / HTTP und Offline | 373/373 Assertions. Je Familie/Breite drei Wiederöffnungen, Tab-/ShiftTab-Wrap, Mehrfachzyklen, Escape/Closebutton/Backdrop, innere Klicks, Restore/Inert-Cleanup; verwandter Kristall mit Mehrfachfokuszielen. |
| Datei-/Build-/HTTP-Regressionen (vorbestehende Tests als isolierte Kopien) | 12 bestanden, 0 fehlgeschlagen, 2 explizit externe optionale Fälle übersprungen; Offline-Ausgabe auch in isoliertem Verzeichnis, JSON/CSS eingebettet, Mond-ICS, Favoriten-/Dialogpfade und Tarot-Restore. |
| Katalog/Grid/List/Favoriten/Suche | 60/60 Assertions über HTTP und echte Offline-Datei, drei Breiten: Grid/List ohne erfassten inneren Overflow, Favoriten an/aus, Treffer/Leerzustand/Reset. |
| Bestehende API-Suite gezielt | tests/api.test.js: 2/2 bestanden |
| Axe WCAG2A/2AA/2.1AA, alle10 Templates bei375, Dark+Light | 20/20 Scans ohne gemeldete Verstöße dieser Regeln. Unvollständige Regeln stehen in axe-all.json; kein WCAG-Zertifikat. |
| Syntax/Security | Sechs browserseitige Module mit Node --input-type=module --check erfolgreich; neue Zeilen auf Secrets/eval/Shell-Exec geprüft, keine Musterfunde; git diff --check grün. Die Edit-Tool-CJS-Lintwarnungen zu ESM sind damit fachlich aufgelöst. |

**Explizite Testgrenze:** Ein zusätzlicher breiter Jest-Discovery-Lauf ist nicht grün: sieben bereits vorbestehende, bytegleiche Playwright-ESM-Specs werden fälschlich vom CommonJS-Jest eingesammelt und scheitern beim import-Parsing. API2/2 grün. Dies ist kein Lauf der Browser-Specs und wird nicht als deren Bestehen ausgegeben. Keine fremde Test-/CI-Konfiguration in dieser CSS-/Dialogkarte verändert. Vollständige Fehlermeldungen: regression/jest.log. Allgemeine Runner-/CI-Konsolidierung bleibt getrennt vom hier technisch bestandenen M1–M5-Scope.

Zwei Messharnesskorrekturen sind transparent: In der ersten Vorher-JSON-Serie heißt das zusammengesetzte clientWidth-Feld noch width und überschreibt das Viewportfeld innerhalb der Layoutobjekte; die Viewportzuordnung ist durch geordnete Dreiergruppen/Screenshotnamen erhalten und in summary.json explizit rekonstruiert. Die endgültigen Nachherläufe trennen width/clientWidth. Außerdem erfasst red-M4 den Kontrast nach400ms Theme-Beruhigung; früheste Vorher-Kompositwerte mitten in der Transition sind nicht die normative Kontrastreferenz. Ein Zusatztest erwartete zunächst verwandte Steine am eindeutigen Amethyst: auf Rosenquarz mit tatsächlich vorhandenen Beziehungen korrigiert und vollständig erfolgreich wiederholt. Kein Websitefix wurde durch Abschwächung einer fehlschlagenden Produktanforderung grün gemacht.

## Bilder und unabhängige Schlussabnahme

192 primäre, dekodierte und SHA256-manifestierte Original-PNGs: before-live48 + before-local48 + after-http48 + after-file48. Galerie comparison.html enthält48 lokale Vorher/Nachher-Paare. Alle M1–M5 sind auf375/768/1440 vor/nach enthalten; separate Dialog-/Tastatur- und Lightaufnahmen. Zusätzliche fokussierte Entwicklungs-/Minor-Aufnahmen sind nicht in diese192 eingerechnet.

Die reparierte vision_analyze-Route wurde tatsächlich benutzt, nicht historisch als defekt ausgegeben: Runendialog375 vollständig lesbar ohne sichtbaren horizontalen Überlauf; Blog375 zeigt einspaltiges lesbares Nachher; 404 wechselt sichtbar von Gold/Pills zu Purple/rechteckig gerundeten Buttons. Diese Stichproben sind keine unabhängige Gesamtfreigabe. Beim ersten Kristall-Ausschnitt war nur der Filterbereich sichtbar; danach auf den echten Katalogbeginn y1799 korrigiert. Vision bestätigt dort Raster-/Umbruchänderung, beurteilt die Badge-Textabdunklung jedoch nicht zuverlässig. M4 ist deshalb durch reale CSS-/Kompositmessung und Axe belegt, nicht durch eine erfundene Pixelbewertung.

**t_befcdea7 übernimmt jetzt unabhängig die Schlussprüfung.** Nicht geprüft: Safari/Realgeräte, vollständige semantische Sichtabnahme jeder Karte, historische Design-Sollregression. Bekannte Bestandsgrenzen (Footerplatzhalter/Mehr-laden/fehlendes OG-Bild, individuelle Illustration, frühe Kristall-Aufbaushifts) sind nicht als mitrepariert ausgegeben und bleiben für die vorhandene Gesamtkonsolidierung sichtbar.

## Reproduktion und Dateien

Vom Projektverzeichnis aus:

    npm run build
    node evidence/t_ddfe7b03/verify.cjs neuer-http-lauf
    node evidence/t_ddfe7b03/verify.cjs neuer-datei-lauf --file
    node evidence/t_ddfe7b03/extra.cjs
    node evidence/t_ddfe7b03/axe-all.cjs
    node evidence/t_ddfe7b03/regression.cjs
    node node_modules/jest/bin/jest.js --runTestsByPath tests/api.test.js --runInBand

Der regression.cjs-Gesamtlauf gibt wegen des transparent dokumentierten breiten Jest-Discovery-Konflikts nonzero zurück; die einzelnen Suiteausgaben unterscheiden. Vorhandene Ergebnisse nicht als Ziel neuer Wiederholungsläufe benutzen.

Geänderte kanonische Quellen:
- css/design-system.css
- css/main.css
- js/main.js
- js/dialog.js
- js/modules/crystals.js
- js/modules/tarot.js
- js/modules/runes.js
- js/modules/blog.js
- 404.html
- impressum.html
- datenschutz.html
- haftung.html
- docs/design-tokens.md

Zusätzlich die fünf generierten Lokal*.html-Dateien neu gebaut; nicht von Hand editiert. Buildausgabe dist/Esoterik-Welt enthält denselben Stand. Quellen, selbst ausführbare Regressionen, Rohmessungen, Ausgangsmanifest und Quellenpatch liegen dauerhaft unter evidence/t_ddfe7b03/. Originale und Gallery sind keine neue Designfreigabe. Sämtliche Elf Screenshot-ZIP-Teile sind in archives.json aufgeführt, einzeln unter25MB; zusammen entpacken, um die vollständige Galerie offline zu öffnen. Kompaktes Handoff mit sechs gekennzeichneten Bildausschnitten dient nur der Übersicht.
