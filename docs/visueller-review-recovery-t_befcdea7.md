# Esoterik-Welt – unabhängiger visueller Recovery-Review / t_befcdea7

**Reviewphase abgeschlossen; M1–M5 lokal bestätigt. Keine mängelfreie Gesamt- oder Produktionsfreigabe.** Im geprüften Umfang **0 Critical, 2 offene Major (M6/M7), 3 offene Minor (N3/N5/N6)**. Die neuen technischen Restmängel sind an **t_44b8b6dd / coding_debug** übergeben. Die bestehende Gesamtkonsolidierung **t_6d900985** erhält diesen Bericht. Das ursprüngliche Reviewdokument bleibt als historischer Befund unverändert erhalten.

## 1. Prüfobjekt und Freigabegrenzen

- Ausschließlich `C:/Users/mas/Arbeit/Esoterik-Welt`; Remote `https://github.com/ingbms/Esoterik-Welt.git`. Kein Router-/Plugin-Worktree verändert.
- Gegenstand ist die **lokale technische Korrektur nach t_ddfe7b03**, nicht eine Nachtatelier-Migration. Datei-Einstieg `file:///C:/Users/mas/Arbeit/Esoterik-Welt/index.html` → `Lokal.html`, außerdem lokale Produktionsvorschau aus `dist/Esoterik-Welt/` auf automatisch zugeteiltem Loopback-Port und korrekter Basis `/Esoterik-Welt/`.
- Quelle und Vorschau in neun relevanten Dateien bytegleich bestätigt (`confirm/source-build.json`), einschließlich CSS, Dialogcontroller, Kristalle/Blog und Lokal.html. Kein Neubau oder Eingriff in fremde Quellen nötig.
- Produktionsadresse frisch per `gh api repos/ingbms/Esoterik-Welt/pages`: **https://ingbms.github.io/Esoterik-Welt/**, `built`, `legacy/main/`. HEAD und Remote-main `24d8053ebc1bc4438a35a1c52b5d6f8c1718594e`. Drei ausgelieferte Kernquellen stimmen nach Zeilenendennormalisierung mit diesem Commit, aber **nicht** mit dem lokalen korrigierten Stand überein (`production-separation.json`, 2026-11-01T15:22:13Z). Das ist ein Quellenabgleich, keine neue produktive Sichtfreigabe.
- **Neuester Nutzerentscheid:** Veröffentlichung nach bestandenem Review ist bereits genehmigt. Eigene Releasekarte nach Gesamtkonsolidierung; keine erneute pauschale Freigabefrage nötig. Hier wurde nicht veröffentlicht. Nachtatelier-Stilpaket und Tarot-Mustersatz sind separat freigegeben; deren Umsetzung ist weiterhin nicht Gegenstand dieser Reparaturprüfung.
- Keine genehmigte historische Design-Sollbaseline vorhanden. Vorherbilder sind diagnostische Fehlerzustände, niemals ein akzeptiertes Soll. Diese Lücke verhindert weder einen sachlichen Fehlervergleich noch die M1–M5-Nachprüfung.

## 2. Tatsächlich ausgeführte unabhängige Prüfung

Chromium **156.0.8078.4**, Windows, Headless, DPR1, **375/768/1440 ×900**, **Normal Motion**, frische Dokumentaufrufe, blockierte Service Worker. Datei-Kontexte tatsächlich `offline:true`; keine Browser-Sicherheitsflags. Theme erst nach 650ms Beruhigung gemessen. Tastaturereignisse mit Playwright `keyboard.press`, nicht per DOM-Keysimulation. Keine menschliche Realgeräte-/Safari-Prüfung behauptet.

| Prüfung | Unabhängiges Ergebnis |
|---|---|
| Zehn Templates × drei Breiten × Dark/Light × HTTP/Offline | **120 Ansichten**, kein gemessener horizontaler Dokumentoverflow |
| Hauptmatrix | **324/324 Assertions bestanden**; Rohdaten getrennt `http/results.json`, `file/results.json` |
| M1 Karten-/Textinnenoverflow | 48 Assertions über Start, Tarot, Kristalle und Wissen; keine erfassten überbreiten Textknoten |
| M2 Dialoginnenoverflow | 24 geöffnete Dialoge, alle ohne gemessenen horizontalen Innenoverflow |
| M3 404 | 12 Dark/Light-/Breiten-/Zugangsprüfungen mit gemeinsamer Palette/Fontfamilie, Card16px/Button8px |
| M4 | 360 Sekundärbadge-Messungen; Minimum Dark **8,526:1**, Light **5,754:1**; Anforderung4,5:1 |
| M5 | 24 Flows: frischer Aufruf → Enter →1800ms→Tab→Shift+Tab→Escape, Inert/Restore/Cleanup jeweils korrekt |
| Hauptnavigation | 36 tatsächliche Navigationsklicks über die drei Breiten und beide Zugänge |
| Axe WCAG2A/2AA/2.1AA | **40 Scans** bei375, alle zehn Templates in Dark/Light über beide Zugänge, keine gemeldeten Verstöße dieser Regeln. Incomplete-Regeln in Rohdaten; kein WCAG-Zertifikat |
| Zusätzliche Ursachenprüfung | 18 kalte Direktaufrufe in jeweils neuen Kontexten,12 erneut geöffnete Dialoge inkl. Geometrie und tatsächlichem Scroll bis zum Artikelende |
| Originale | **218 neue Browser-PNGs**:88 HTTP+88 Offline+42 Bestätigungen; keine alten Bilder überschrieben |
| Tatsächliche Bildsicht | **20 erfolgreiche vision_analyze-Aufrufe**:16 Kontakt-/Vergleichsblätter plus vier Originalaufnahmen; beobachtete Ergebnisse in `vision-observations.json` |

**Wichtig:** 324 grüne Assertions sind keine Fehlerfreiheit. Das ursprüngliche Layouttestkonzept prüft scrollWidth, nicht überlappende Geschwisterrechtecke. M6 wurde erst durch echte Bildsicht plus Geometrie nachgewiesen; M7 durch isolierten Cold-Start statt bloßer Navigationsklicks. Die Prüfungen ergänzen sich.

### Transparente Harnesskorrekturen

Der erste eigene Lauf erwartete für 404-Light irrtümlich `rgb(248,245,255)` statt des vorhandenen Tokens `#f8f5fc`/`rgb(248,245,252)`; deshalb drei M3-Fehlassertions pro Zugang. Außerdem konnte eine naive RGB-Zahlparserroutine `color(srgb …)` aus CSS color-mix nicht richtig skalieren; ihre ersten Kontrastzahlen werden verworfen. Jetzt CSS-Farben per Canvas/sRGB dekodiert und mit Alpha durch tatsächliche Vorfahrenflächen zusammengesetzt. Initiale Nullfontwerte entstanden durch einen falschen Logo-Selektor; der korrigierte CDP-Nachweis nutzt `.logo`. Frühe N4-Messung traf den main-Wrapper; wiederholt am tatsächlichen `main .card`. Vollständige Matrix nach Korrekturen erneut ausgeführt, **324/324**. Erste JSONs als `first-run-results.json` unverändert erhalten. Keine Produktanforderung abgeschwächt, kein Websitecode geändert.

## 3. M1–M5: getrennte Vorher-/Nachher-Abnahme

Die Galerie [comparison.html](../evidence/t_befcdea7/recovery-20261101/comparison.html) enthält **48 diagnostische Vorher/aktuell-Paare** von der lokalen Vor-Reparatur-Serie aus t_ddfe7b03 zu den eigenen neuen HTTP-Aufnahmen. Darunter30 Templates,12 Dialoge und6 Kristall-Dark/Light-Zustände. Alle drei Breiten enthalten. Zusätzlich vier ausdrücklich als **noch offen** gekennzeichnete Restbefundvergleiche. Sie sind kein Reparaturnachweis.

| ID | Vorherbeleg | Unabhängiges Nachher und Bildurteil | Status |
|---|---|---|---|
| M1 Major | Kristallformel170/84px; Blogtitel163/84px, Zweispaltenkarten mobil | Einspaltige Inhaltskarten bei375, keine erfassten inneren Textüberläufe in beiden Themes/Zugängen. Bildsicht bestätigt dieselben ersten Kristallkarten und lesbare Blogzeilen; Bilder sind teilweise verschieden gescrollt und als Ausschnitte gekennzeichnet. | **Bestanden**, keine globale Garantie sinnvoller Worttrennung: N5 bleibt |
| M2 Major | Runendialog375:345/325px, rechte Deutung abgeschnitten |375 jetzt325/325px, mobile Deutungen untereinander; beide vollständig lesbar. Bei768/1440 ebenfalls kein Innenoverflow. | **Bestanden** |
| M3 Major | 404 Gold/Cormorant/Pills, Card24px | Gemeinsame Purple-Palette, Cinzel-Familie, Card16px/Button8px, Dark und Light. Bildsicht bestätigt sichtbaren Anschluss; reduzierter 404-Shell ohne Logo ist eine zulässige Sonderform, nicht erneut als Major gezählt. | **Bestanden** |
| M4 Major | Lightbadge Axe1,58:1,30 Knoten | Nach stabilem Theme mindestens5,754:1,Dark8,526:1; Axe ohne Kontrastverstöße. Badge-Änderung in verkleinerter Bildsicht nicht zuverlässig quantifizierbar, daher Messung und nicht Pixelbehauptung. | **Bestanden** |
| M5 Major | Kristalle/Runen/Wissen Fokus hinter Overlay; Tarot im stabilen Vorretest korrekt | Alle vier Familien halten initial,Tab,Shift+Tab den Fokus innen; Hintergrund inert;Escape schließt und stellt Auslöser wieder her. Sichtbare türkisfarbene Fokusringe in aktuellen Dialogbildern. | **Bestanden**, Tarot nicht nachträglich zum früheren stabilen Fehler umdeuten |

N1 ebenfalls behoben: reale CDP-Plattformfonts auf den drei Rechteseiten **Cinzel/Inter** über HTTP, im echten Dateimodus bewusst einheitlich **Georgia/Segoe UI** ohne Netzwerkfonts. Das unterschiedliche Offline-Schriftbild ist kein neuer Fontausfall. N2 Token-Dokumentation korrigiert. N4 tatsächliche Impressum-Card hover bei allen Breiten/Zugängen `transform:none`. Historische Messungen stehen im unveränderten alten Bericht.

## 4. Verbleibende Mängelliste

Critical = zentrale Nutzung flächig unmöglich. Major = erheblicher systematischer Layout-/Lesbarkeitsfehler. Minor = begrenzte Typografie-/Inhaltsdarstellungs-/Bildsprachabweichung. Deduplizierte Ursachen, nicht Elementanzahl.

### M6 – Major: Kristalldialog-Bild überlagert Informationen

- **Route/Element:** `#crystals` → Amethyst → „Details anzeigen“; `.modal-body`-Grid in `js/modules/crystals.js:318–319`. HTTP und Offline, alle drei Breiten.
- **Reproduktion:** frischer Aufruf, ersten Detailbutton mit Enter öffnen,1800ms warten. Kein spezieller Zoom nötig.
- **Geometrie:** bei375 Spalten84,328/168,672px, Bild wegen aspect-ratio1 und min-height240 tatsächlich240px breit; Bildx49..289, Textspalte abx157. **131,672×240px Überlappung**. Bei768/1440 noch40,672×240px. Info ist sichtbar über Herz/Bildfläche gesetzt; Formel-/Label-Lesbarkeit beeinträchtigt. Kein horizontaler scrollWidth-Overflow: alter Test hätte diesen Mangel übersehen.
- **Vorher/aktuell:** `evidence/t_ddfe7b03/before-local/crystals-modal-375.png` → `recovery-20261101/http/crystals-modal-375.png`; separater Wiederholungsbeleg `confirm/http-crystals-modal-375.png`. **Weiterhin fehlerhaft, kein korrigiertes Nachher.**
- **Korrektur:** responsives Grid mit mobiler Einspaltigkeit; Bild an verfügbare Spaltenbreite statt min-heightgetriebener intrinsischer Verbreiterung binden; Rechteck-Nichtüberlagerung ausdrücklich testen. Kein Ausblenden wichtiger Texte.
- **Rückgabe:** t_44b8b6dd.

### M7 – Major: kalter Datei-Deep-Link verdeckt Bereichstitel

- **Route:** echter Explorer-/Adressleistenpfad `file:///C:/Users/mas/Arbeit/Esoterik-Welt/index.html#blog` → `Lokal.html#blog`, ebenso #crystals/#runes. Frischer Kontext, normale Bewegung,1800ms warten, kein Tab/Scroll.
- **Messung:** alle neun geprüften Datei-Kaltaufrufe `scrollY72`, Sticky-Header y0..72, Bereichstitel ab **y48**. **24px verdeckt**. Die neun entsprechenden HTTP-Kontexte:scrollY0,Titel y120. Sichtprüfung des Originalbildes bestätigt verdeckten Bereichstitel; nicht mit dem Artikelkartentitel verwechseln.
- **Vorher/aktuell:** Parent-Reparaturaufnahme `evidence/t_ddfe7b03/after-file/blog-375.png` → eigene `confirm/file-blog-cold-375.png`. Der Parentstand ist hier nur diagnostischer früherer Messzustand. **Kein korrigiertes Nachher, keine freigegebene Sollbaseline.**
- **Korrektur:** native Fragment-/Scrollinitialisierung nach Offline-Weiterleitung untersuchen und nach stabilem Init korrekte Position gewährleisten; Normal/Reduced Motion, Back/Forward und Fokus erhalten. Header nicht entfernen, keine Browser-Sicherheit abschalten.
- **Rückgabe:** t_44b8b6dd.

### Minor-Reste

| ID | Seite/Komponente | Beobachtete Abweichung / Vergleich | Konkrete Maßnahme |
|---|---|---|---|
| N3 | Tarot/Kristalle/Wissen, Bildsprache | Symboltafeln und browserabhängige Emoji neben kleinen UI-SVGs. Unterschiedliche semantische Bildklassen sind dokumentiert, individuelle Illustrationen weiterhin nicht in der technischen Alt-UI umgesetzt. Vorher/aktuell in Tarot-/Kristall-/Blog-Galeriepaaren. | Separat freigegebene Nachtatelier-/Tarot-Umsetzung nutzen; hier keine Bilderzeugung oder kostenpflichtige API. |
| N5 | mobile Rechtstitel und Tarotnamen | HTTP375 „Haftungsausschluss“ mit isoliertem „ss“, „Datenschutzerklärung“ intern gebrochen; Tarot „Die Hohepriesterin“ endet mit einzelnem „N“. Kein seitlicher Overflow, aber schlechter Satz. Dateifallback verändert konkrete Umbrüche. Eltern-Vorherbilder und aktuelle `http/{haftung,datenschutz}-dark-375.png`, `http/tarot-catalog-375.png` dokumentieren den noch offenen Zustand. | Gezielte responsive Titel-/Trennregeln, kein Ellipsieren oder Redesign; t_44b8b6dd. |
| N6 | Wissensdialog, erster Artikel | Rohes `##`, `###`, `**…**`, doppelte Titelausgabe. Ursache `js/modules/blog.js:62` ersetzt nur Newlines durch br. Vorher `before-local/blog-modal-375.png`, aktuell `confirm/http-blog-modal-375.png` und `…-bottom-375.png`. | Sichere erlaubte Textauszeichnung in semantisches HTML, Titel einmal mit korrektem Dialoglabel; t_44b8b6dd. |

**Nicht als weitere Fehler gezählt:** Bildsicht vermutete Kollision von Artikelmodal-Titel und Closebutton. Nachmessung375 zeigt Titelx49..282 und Buttonx282..326: benachbart, keine Rechtecküberlagerung. Artikelende wird nach Dialogscroll erreicht (clientHeight808/scrollHeight1416 mobil); Standbildanschnitt ist kein nachgewiesener unerreichbarer Inhalt. Kleine Schriften in Desktop-Kontaktkopien sind nicht pauschal Kontrastfehler;40 Axe-Scans und aktuelle Messwerte werden nicht durch Bildverkleinerung widerlegt.

## 5. Designsystem, Komponenten und Rhythmus

Styleguide `docs/design-tokens.md`, ausführbare Quelle `css/design-system.css`, Ergänzung `css/main.css`; aktuelle Snapshots `tokens.json` sowie Theme-/Komponentenwerte in Hauptmatrix.

- **Palette:** Dark Deep#0a0512,Card#120a1f,Purple#bb86fc,Muted#a99bbd. Light Deep#f8f5fc und korrigierter Secondary-Text#006b61. Die echten Lightaufnahmen sind absichtlich hell und **nicht** der ungestylte weiße Fehlerzustand. Dateiausgabe zeigt auf allen zehn Templates vorhandene CSS-Gestaltung.
- **Typografie:** Cinzel/Inter online, gemeinsame Systemfallbacks offline tatsächlich gerendert. Keine bloße font-family-Liste als Ladebeweis. Die fehlerhaften mobilen Wortumbrüche werden separat N5 gezählt.
- **Spacing:** 4px-Schritte mit überwiegend8px-Rhythmus, Standardcard24px, Contentinset16px, Containermax1200px, Header72px. Inhaltsraster jetzt geräumiger, kompakte Symbolraster dürfen andere Spaltendichte nutzen. Kontaktkopien zeigen keine generelle Marken-/Whitespace-Entgleisung. Kristallfilter sind weiterhin sehr dicht und verdrängen Katalogbeginn: Usabilityempfehlung, kein zusätzlich erfundener Major ohne konkreten Bedienblocker.
- **Radien/Schatten:** Buttons8px,Cards/Modals16px,Tarot/Runentiles12px plausible Varianten.404 war der systemische Ausreißer und ist korrigiert. Schatten-/Glowtokens teilen die Purple-Familie. Keine Bewegung an nichtinteraktiver Impressum-Card.
- **Buttons/Forms:** gefüllte primäre und umrandete sekundäre Aktionen über Seiten wiedererkennbar; Such-/Selectfamilie konsistent, reale Headernavigation mobil/Desktop ausgeführt. Native Select-Popups nicht browserübergreifend visuell abgenommen. Beschriftungen „Zurück“/„Zur Startseite“ sind Copy-Harmonisierungsoption, nicht automatisch Funktionsfehler.
- **Modals:** gemeinsame dunkle Fläche und Fokusringe; Runenreflow korrekt. Kristall-Bild/Textlayout ist M6, nicht durch funktionierenden Dialogfokus geheilt.
- **Bildverhältnisse/Iconografie:** beabsichtigte Tarot2:3,Kristalle1:1,Artikel16:9 für unterschiedliche Inhalte sinnvoll; keine gestreckten Fotos behauptet. M6 zeigt gerade, warum eine CSS-aspect-ratio allein keine sichere Layoutabnahme ist. UI-SVGs und redaktionelle Platzhalter unterscheiden; kein fremdes Markensystem kopiert.
- **Tables:** keine table-/role=table-Komponente in den geprüften zehn Templates; Mondkalender ist ein Grid. Keine erfundene Tabellenabnahme.

## 6. Abnahmeentscheidung und Grenzen

| Kriterium | Entscheidung |
|---|---|
| Keine Critical-Abweichungen | **Erfüllt im tatsächlich geprüften Umfang**; keine Behauptung für sämtliche Inhalte/Browser |
| Höchstens5 Major | **Erfüllt:2 offen**, M1–M5 bestanden |
| M1–M5 echte Vorher/Nachher-Nachweise | **Erfüllt**,48 Paare plus tatsächliche Bildsicht/Messung |
| Alle Befunde mit diagnostischem Vorher/aktuell-Vergleich dokumentiert | **Erfüllt**; vier zusätzliche Restbefundvergleiche ausdrücklich als unverändert/offen gekennzeichnet |
| Alle neu entdeckten Restmängel mit repariertem Nachher | **Noch nicht erfüllt**: M6/M7/N5/N6 sind unverändert dokumentiert und zur Behebung übergeben; keine erfundene Reparatur |
| Vollständige fehlerfreie Produkt-/Releasefreigabe | **Nicht erteilt**; eigene Konsolidierungs-/Restfix-/Releasephasen beachten |

Diese Karte schließt die **durchgeführte unabhängige Reviewphase**, nicht die Restimplementierung. Kein künstlicher Blocker wegen historischer Baseline oder früherem Visionfehler. Der Bildzugang funktioniert heute tatsächlich. Zwei klar eingegrenzte Major-Reste sind keine Geschmacksfrage; t_44b8b6dd enthält messbare Abnahmebedingungen. Vor Veröffentlichung nach der bereits erteilten Nutzerentscheidung diese Nachprüfung berücksichtigen.

Nicht neu ausgeführt: Lighthouse/Felddaten, Safari/Realgeräte, vollständige200%-Zoom-/Printprüfung und jedes einzelne Tarot-/Kristallobjekt. Kein Performancewert oder WCAG-Zertifikat. Elternberichte nennen zusätzliche Bestandsgrenzen (Footerplatzhalter, Mehr-laden ohne neue Artikel, fehlendes OG-Bild, frühe Kristall-Aufbaushifts und breiter Jest-/Playwright-Discoverykonflikt); diese werden nicht als mitrepariert ausgegeben und liegen der Gesamtkonsolidierung vor. Insbesondere rohe Shift-Summen nicht als Web-Vitals-CLS bezeichnen.

## 7. Erhaltung, Artefakte und Reproduktion

Zu Beginn **4583 bestehende geänderte/unversionierte Dateien** mit Hashes und git status gesichert. Abschließende Hashprüfung mit `preservation.py --verify`: **4583 geprüft, 0 verändert oder fehlend** (`preservation-result.json`). Nur neues Recovery-Evidenzverzeichnis und dieser neue Bericht geschrieben; alte Tests, test-results, historische Belege, Produktquellen und Workflows unberührt. Kein Commit,Push,Deploy oder API-/Profilwechsel.

Alle Skripte im Website-Projekt, neue Läufe nur mit eigenen Zielverzeichnissen ausführen, um diese Belege nicht zu überschreiben:

```text
node evidence/t_befcdea7/recovery-20261101/review.cjs http
node evidence/t_befcdea7/recovery-20261101/review.cjs file
node evidence/t_befcdea7/recovery-20261101/confirm.cjs
node evidence/t_befcdea7/recovery-20261101/tokens.cjs
python evidence/t_befcdea7/recovery-20261101/production.py
python evidence/t_befcdea7/recovery-20261101/preservation.py --verify
```

Einstieg `evidence/t_befcdea7/recovery-20261101/comparison.html`. Messungen `summary.json`, `http/results.json`, `file/results.json`, `confirm/results.json`, `tokens.json`, `vision-observations.json`, `production-separation.json`. Bilddateien mit SHA256 in `image-manifest.json`. Downloadpakete und deren exakte Größen/Hashes in `archives.json`; kompakter Bericht-/Vergleichsdownload enthält ausgewählte Originale und alle Sichtblätter. Vollständige Browseroriginale werden zusätzlich verlustfrei in nummerierten PNG-ZIP-Teilen ausgeliefert.
