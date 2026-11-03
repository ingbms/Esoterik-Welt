# Esoterik-Welt – Design-/Style-Consistency-Review

**Status: NICHT visuell freigegeben.** Technischer Review mit echtem Chromium-Rendering abgeschlossen; gestalterische Bildsicht und korrigierte Nachher-Belege für offene Mängel fehlen. **0 Critical beobachtet, 5 Major, 4 Minor** – keine Behauptung, dass eine vollständige Sichtprüfung weitere Critical ausschließt.

## 1. Prüfobjekt und belastbare Evidenz

- Ausschließlich `C:/Users/mas/Arbeit/Esoterik-Welt`, Remote `https://github.com/ingbms/Esoterik-Welt.git`. Keine Änderung am falsch zugeordneten Plugin-Worktree.
- Produktive URL per `gh api repos/ingbms/Esoterik-Welt/pages` ermittelt: **https://ingbms.github.io/Esoterik-Welt/**; Pages: `legacy`, `main`, `/`, Status `built`.
- Reparaturcommit: `24d8053ebc1bc4438a35a1c52b5d6f8c1718594e`. Sechs Live-Dateien bytegenau gegen `git show` dieses Commits bestätigt (`axe-source.json`). Erste Rohhash-Abweichungen zu lokalen Dateien waren **CRLF/LF**, keine fremde Veröffentlichung; normalisierte lokale Dateien stimmen ebenfalls überein.
- Eigene Messungen am 31.10.2026, UTC-Zeitstempel in den JSON-Dateien; Chromium **156.0.8078.4** unter Windows, Headless, DPR 1, Viewporthöhe 900, Breiten **375 / 768 / 1440 px**, `prefers-reduced-motion: reduce`.
- Styleguide: `docs/design-tokens.md`; ausführbare Tokenquelle: `css/design-system.css`; Ergänzungen: `css/main.css`. Kein genehmigtes historisches Screenshot-Soll vorhanden. Die drei Stilkonzepte sind ausdrücklich **keine** freigegebene neue Designbaseline.

### Abdeckung

| Template/Zustand | Routen | Prüfung |
|---|---|---|
| Start/Hero/Featurekarten | `/` | 3 Breiten, Dark/Light, Tastatur-Skip-Link, mobile Navigation |
| Tarot | `/#tarot` | Galerie, Controls, erster Detaildialog, Keyboard-Retest |
| Kristalle | `/#crystals` | Filter, Suche, Leerzustand, Raster/Liste, Detaildialog |
| Mond | `/#moon` | aktuelle Phase, Kalender und Ritualkarten, Druckdarstellung |
| Runen | `/#runes` | Galerie, Controls, erster Detaildialog |
| Wissen | `/#blog` | Artikelkarten, Suche/Leerzustand, erster Detaildialog |
| Rechteseiten | `impressum.html`, `datenschutz.html`, `haftung.html` | jeweils 3 Breiten, Dark/Light und tatsächlich gerenderte Fonts |
| Fehlerseite | `404.html` | jeweils 3 Breiten, eigener Farb-/Typografie-/Radius-Stil; direkter Templateaufruf |

**30/30** eigenständige Dark-Basisansichten ohne Testfehler; tatsächliche Hauptnavigation zusätzlich geklickt. **60** Dark/Light-Layout-/Tokenzustände: kein horizontaler **Dokument**overflow, keine erfassten JS-Pageerrors. Das schließt inneren Komponentenoverflow ausdrücklich nicht aus. **31** ergänzende Interaktionszustände erfasst; stabiler Tastatur-Retest zusätzlich separat dokumentiert. **20 Axe-Core-4.14.0-Scans** mit WCAG-2A/2AA/2.1AA-Tags bei 375 px: 30 beanstandete Kontrastknoten auf einer Route im Light-State, sonst keine Verstöße dieser ausgewählten Regeln. Kein vollständiges WCAG-Zertifikat.

**120 echte PNGs:** 30 von der Reparaturkarte kopierte Vorher-Dateien, 30 unabhängige neue Dark-Aufnahmen und 60 Light-/Interaktionsaufnahmen. Integrität/Hashes: `image-manifest.json`. Zehn bereits vorhandene unversionierte Tests/Testresultate stimmen mit dem vorgelagerten Erhaltungsmanifest überein; nichts davon gelöscht oder überschrieben.

## 2. Priorisierte Mängelliste

Schweregrad: **Critical** = zentrale Nutzung flächig unmöglich; **Major** = erhebliche Lesbarkeits-, Bedienungs- oder systematische Designabweichung; **Minor** = begrenzte Konsistenz-/Dokumentationsabweichung. Die Anzahl bezieht sich auf deduplizierte Ursachen, nicht auf jeden betroffenen Knoten.

### M1 – Major: zu dichte Inhaltsraster und innerer Textoverflow

- **Seiten/Komponenten:** Start/Featuretitel, Tarot-Kartentitel, Kristallkarten, Wissen/Artikelkarten; am stärksten 375 px, Reste auch 768/1440 px, in Dark und Light.
- **Reproduktion:** `/#blog` bzw. `/#crystals` direkt bei 375 × 900 öffnen, Initialisierung abwarten, Karteninhalt einschließlich langer Wörter/Formeln prüfen.
- **Messung:** mobil Rasterkarten nur ca. 166 px breit, Inhaltsbereich nach Karten- und Content-Padding ca. 84 px. Artikelüberschrift „Chakren & Kristalle … Energiezentrum“: `scrollWidth 163`, `clientWidth 84`. Lapis-Lazuli-Formel: `170/84`. Desktop dieselbe Formel `170/139`; die Artikelüberschrift ebenfalls noch `163/139`. Starttitel „Mondphasen“ `128/116`; Tarot „Die Hohepriesterin“ `138/132`.
- **Wirkung:** Text verlässt den vorgesehenen Inhaltsbereich, läuft in Padding oder benachbarte Karten. Ein grüner Dokumentoverflow-Test verdeckt diesen Mangel.
- **Korrektur:** inhaltsspezifische Raster statt globaler `minmax(160px, 1fr)`-Verdichtung; Kristalle/Artikel auf Mobile einspaltig, passende Mindestbreite für lange Überschriften, `min-width: 0` und kontrolliertes `overflow-wrap` für Formeln/lange Wörter. Doppelte Innenabstände gezielt reduzieren, nicht nur Text abschneiden.
- **Screenshotbelege:** `live/blog-375.png`, `live/crystals-375.png`, `live/crystals-1440.png`, dazu gleichnamige `before-repair/`-Dateien. **Nicht repariert; kein korrigiertes Nachher vorhanden.**

### M2 – Major: Runen-Detaildialog läuft auf Mobile intern horizontal über

- **Route/Element:** `/#runes` → erste Rune „Fehu“ → `#runeModal .modal`.
- **Reproduktion:** bei 375 × 900 erste Rune öffnen; Dialogtext und Interpretationsspalten prüfen.
- **Messung:** Dialog `scrollWidth 345`, `clientWidth 325` (**20 px** horizontaler Overflow). Innerer Interpretationsblock `305/245`. Bei 768/1440 px kein gemessener horizontaler Dialogoverflow.
- **Wirkung:** innere horizontale Scrollstrecke bzw. nicht vollständig in die Dialogbreite passender Text.
- **Korrektur:** Interpretationslayout am schmalen Breakpoint auf eine Spalte setzen; Mindestbreiten entfernen, Textumbruch und Dialog-Innenabstände prüfen.
- **Belege:** `states/runes-375-modal.png`, `states/runes-375-keyboard.png`, `interactions.json`. Für diesen Dialogzustand existiert kein historisches Vorher. **Aktueller Fehlerzustand dokumentiert; korrigiertes Nachher offen.**

### M3 – Major: 404-Template weicht vom bestehenden Designsystem ab

- **Route/Komponenten:** `/404.html`, gesamter Shell-/Card-/Action-Stil, alle drei Breiten.
- **Messung/Quellbefund:** separates Inline-Stylesheet mit Gold `#d4a843`, Hintergrund `#0b0c10`, `Cormorant Garamond` statt Purple `#bb86fc`, Hintergrund `#0a0512`, `Cinzel`. Cardradius 24 statt Standardcard 16 px; Actionradius 9999 statt Standardbutton 8 px; eigene Glows statt Tokenreferenzen. Light-Attribut ändert diese Seite nicht. Tatsächlich gerenderter Font per Chromium-CDP bestätigt.
- **Wirkung:** Fehlerzustand wirkt wie eine andere Marke; Komponentenvarianten und Themeverhalten sind nicht mit dem restlichen System geteilt.
- **Korrektur:** 404-Shell an vorhandene CSS-/Button-/Cardtokens anschließen. Bewusste Ausnahme wäre gesondert freizugeben; kein vollständiges Redesign erforderlich. Projektbasierte Rücklinks erhalten.
- **Belege/Vergleich:** `live/404-375.png` / `live/home-375.png` und `live/404-1440.png` / `live/home-1440.png`; echte zeitliche Paare auch in `before-repair/`. **Stilabweichung im aktuellen Build unverändert.**

### M4 – Major, nur optionaler Light-State: Sekundärbadges unzureichend lesbar

- **Route/Element:** `/#crystals`, `.badge-secondary`, alle Breiten mit `html[data-theme="light"]`.
- **Reproduktion:** Light-Attribut setzen, Farbbadge „Violett“ bzw. weitere Farbbadges betrachten/messen. Ein sichtbarer Theme-Umschalter wird hier nicht behauptet.
- **Messung:** Text `#03dac6`, effektiv etwa `#d9f9f6` Hintergrund, 11,2 px/Weight 500. Axe meldet **1,58:1**, gefordert **4,5:1**, **30 Knoten**. Separate WCAG-Luminanzrechnung mit ungerundetem 15-%-Alpha-SRGB ergibt **1,595:1**; Rundungs-/Implementierungsabweichung offen ausgewiesen, kein zweiter Fehler. Dark-State desselben Paares **8,47:1**.
- **Korrektur:** eigenen dunkleren Secondary-Texttoken für Light definieren; erneut über zusammengesetzten Badge-Hintergrund messen, nicht nur gegen Weiß.
- **Belege:** `states/crystals-375-light.png` versus `live/crystals-375.png`, `axe-source.json`, `contrast.json`. Dies ist ein **Themevergleich**, kein Nachweis einer bereits korrigierten Version. **Korrigiertes Nachher offen.**

### M5 – Major: Fokus bleibt bei drei Detaildialogen hinter dem Overlay

- **Routen:** Kristalle, Runen, Wissen; Modal-/Keyboardkonsistenz.
- **Stabile Reproduktion:** Seite frisch laden; ersten echten Detailauslöser mit Enter öffnen; **1800 ms** abwarten; Tab drücken.
- **Ergebnis bei 375 px:** Kristalle: Tab fokussiert `.favorite-btn` im Hintergrund; Runen: nächste `.rune-card`; Wissen: nächste `.article-card`; jeweils `inDialog=false`. **Tarot besteht den stabilen Retest:** initial `#closeCardModal`, Tab bleibt im Dialog. Frühere 300-ms-Samples zeigten auch Tarot außerhalb; diese werden ausdrücklich nicht als stabiler Tarotfehler gewertet.
- **Wirkung:** sichtbare Dialoge und tatsächlicher Keyboardfokus widersprechen sich; Overlay verhindert keine Hintergrundinteraktion.
- **Korrektur:** gemeinsame Initialfokus-/Trap-/Restore-Implementierung, Hintergrund `inert`, sichtbaren Fokus erhalten, Enter/Tab/Shift+Tab/Escape pro Dialog und Breite retesten. Nicht allein auf vorhandene Trap-Funktionen im Quelltext vertrauen.
- **Belege:** `retest.json`, `states/{crystals,runes,blog}-375-keyboard.png`, Vergleich zum funktionierenden `states/tarot-375-keyboard.png`. **Kein korrigiertes Nachher vorhanden.**

## 3. Minor-Befunde

| ID | Seite/Komponente | Nachweis und Auswirkung | Empfehlung / Retest |
|---|---|---|---|
| N1 | Drei Rechteseiten: Logo und Text | CDP meldet Georgia/Segoe UI statt Cinzel/Inter; CSS-Familien sind gesetzt, Fonts werden hier aber nicht geladen. Sichtbare Marken-/Satzabweichung, Fallback bleibt lesbar. Screenshots `live/{impressum,datenschutz,haftung}-375.png`. | dieselbe freigegebene Fontstrategie verwenden; Datenschutzwirkung externer Fonts separat beachten; tatsächliche Plattformfonts erneut messen |
| N2 | `docs/design-tokens.md` | `--color-text-muted` noch `#7a6a94`, ausgeführt `#a99bbd`; vermeintliche 8-px-Basis enthält tatsächlich 4-/12-/20-px-Schritte. Kein Anlass, den verbesserten Textkontrast zurückzusetzen. | Dokumentation nachführen, nicht die lesbarere Implementierung verschlechtern |
| N3 | Icon-/Bildsprache | Emoji-Platzhalter bei Kristallen/Wissen und Symboltafeln statt individueller Tarotillustrationen; UI-SVGs 18 px/Stroke 2 daneben. Browserabhängige Emoji-Optik, keine einheitliche Bildsprache. Kein defektes geladenes Foto behauptet. | dekorative Symbole, UI-Icons und noch fehlende redaktionelle Bildassets explizit unterscheiden; keine kostenpflichtigen Bilder ohne Freigabe |
| N4 | Nichtinteraktive Cards, z. B. Rechteseiten/Mond | `.card:hover` vererbt Translation -4 px und Schatten auch auf Inhaltscards ohne Aktion. Quellbeleg `css/design-system.css:407–410`; kein Pixel-Sichturteil. | Hoverbewegung auf `.card-interactive` begrenzen; Vorher/Nachher-Hoverbeleg nach Umsetzung erfassen |

## 4. Token-, Komponenten- und Rhythmusprüfung

- **Farben:** Hauptseiten teilen Dark-Body `rgb(10, 5, 18)`, Cards `rgb(18, 10, 31)`, Purple-/Türkistokens. Light liefert erwartete hellere Flächen; Secondary-Badges sind die gemessene Ausnahme. Reine Tokenpaar-Kontraste: Body Dark **16,74:1**, Sekundärtext/Card **10,04:1**, Muted/Card **7,45:1**; Light **14,31 / 7,79 / 5,61:1**. Das sind keine flächendeckenden Pixel-Kontrastmessungen über alle Gradienten.
- **Typografie:** Hauptlogo tatsächlich Cinzel, Home-Fließtext Inter. Legale Fallbacks und separate 404-Typografie siehe M3/N1. Größen werden überwiegend über `--text-*` gesteuert; Sondergrößen in Kristallmodals sind begrenzte Komponentenvarianten, nicht pauschal Fehler.
- **Spacing/Whitespace:** Header 72 px, Container maximal 1200 px, Standardcardpadding 24 px, Contentkarten zusätzlich 16 px. Gerade diese Kombination mit dichtem globalen Raster verursacht M1; Tokenverwendung allein garantiert keinen sinnvollen Rhythmus.
- **Radien/Schatten:** Standardbuttons 8 px, Cards/Modals 16 px, Tarot-/Runentiles 12 px als plausible Varianten; 404 ist der systemische Ausreißer. Hoverglows/Schatten tokenbasiert, N4 trennt Feedback von falscher Affordanz.
- **Buttons/Forms:** Primary-/Secondary-/Ghost-, Small-/Large-Varianten in berechneten Styles dokumentiert; Such-Leerzustände und Raster-/Listenumschaltung tatsächlich bedient. Labels per ARIA vorhanden, native Select-Popups nicht als plattformübergreifend identisch abgenommen.
- **Modals:** gemeinsame Cardfläche/16-px-Radien, max-height 90vh, Close-Targets 44 × 44 px; erster Vertreter aller vier Familien geöffnet. Runenreflow/Fokus bleiben offen. Es wurden nicht alle 78 Tarot- und alle Kristalldialoge einzeln abgenommen.
- **Tabellen:** keine `table`/`role=table` in den zehn geprüften Templates; Mondkalender ist CSS-Grid, nicht eine getestete native Tabelle. Keine erfundenen Table-Varianten.
- **Bildverhältnisse:** CSS-Verträge Tarot 2:3, Kristalle 1:1, Artikel 16:9 erfasst; überwiegend dekorative DIV-/Symbolflächen, keine echte fotografische Motiv-/Cropfreigabe. Listenmodus verwendet bewusst abweichende Maße. Icon-/Bildkonsistenz bleibt begrenzt durch N3.
- **Weitere Zustände:** mobile Menüs tatsächlich geöffnet/geschlossen über Navigation, Skip-Link über Tab angesprungen, Moon-Print-Screenshots erzeugt; Reduced Motion für reproduzierbare Aufnahmen aktiviert. Kein Performance-/Lighthousewert in diesem Review erhoben, kein Safari-/Realgerät-/200-%-Zoom-Nachweis.

## 5. Vorher/Nachher, Regression und Abnahme

`evidence/t_befcdea7/comparison.html` enthält **30 echte zeitliche Paare**: kopierter beobachteter Livezustand vor der separaten Reparatur und eigene Neuaufnahme nach Veröffentlichung. Vorher ist **ein Fehlerzustand, kein akzeptiertes Design-Soll**. Damit ist die Stylingreparatur belegbar; eine visuelle Regression gegenüber einer historisch freigegebenen Baseline lässt sich nicht behaupten oder ausschließen.

**Die offenen M1–M5 wurden nicht verändert.** Zeitliche Bilder oder Dark/Light-Vergleiche werden nicht als erfolgreiche Fehlerbehebung ausgegeben. Für jeden offenen Befund ist ein korrigiertes Nachher noch zu erzeugen. Keine Website-Codeänderung, kein Push, kein Redesign in dieser Reviewkarte.

| Akzeptanzkriterium | Ergebnis |
|---|---|
| Keine Critical-Abweichungen | Keine beobachtet, aber ohne Bildsicht nicht abschließend bestätigt |
| Höchstens 5 Major | Aktuell 5 deduplizierte, technisch belegte Befunde; M4 betrifft optionalen Light-State |
| Alle mit Vorher/Nachher dokumentiert | Reparaturvergleich vorhanden; korrigierte Nachher-Belege für M1–M5 fehlen → **nicht erfüllt** |
| Echter Browser / Screenshots | Erfüllt, 120 verifizierte PNG-Dateien |
| Systematische gestalterische Sichtprüfung | **Blockiert**: `vision_analyze` zweimal `model_not_found` (inkling-small mit Codex-Konto inkompatibel); alternative Delegation scheitert am fehlenden `model_map`-Backend |

**Nächster Schritt:** Bildzugang durch Betreiber reparieren oder menschliche Sichtprüfung der Galerie; offene Befunde gezielt an Implementierung übergeben, danach gleiche Viewports und Dialog-/Keyboardzustände mit korrigierten Nachher-Screenshots retesten. Keine Provider-/Kontokonfiguration eigenmächtig ändern. Auf diesen Stand wird keine endgültige visuelle Abnahme erteilt.

**Koordination:** Eine konsolidierte Behebungskarte **t_ddfe7b03** an `coding_debug` enthält M1–M5 und die eng begrenzten Minor-Nacharbeiten. Sie hängt graphgemäß von dieser Reviewkarte ab und ist noch nicht gestartet. Die Schwesterprüfung meldet unabhängig ebenfalls innere Blog-/Kristall-Textausbrüche ohne Dokumentoverflow sowie fehlenden Bildzugang; ihre gemeldeten 74 PNGs und Pixelvergleiche werden hier nicht als eigene nachgemessene Ergebnisse gezählt.

## 6. Verifizierte Wiederaufnahme am 31.10.2026

- Pages-API erneut gelesen: produktiv weiter `https://ingbms.github.io/Esoterik-Welt/`, `built`, `legacy/main/`. Sechs ausgelieferte Kerndateien stimmen beim frischen Retest **06:39 UTC** weiterhin bytegenau mit Reparaturcommit `24d8053` überein (`resume-check.json`).
- Erneut echtes Chromium **156.0.8078.4**, 375/768/1440 × 900, Reduced Motion: **30/30 Basisansichten bestanden**, reale Headernavigation auf allen drei Breiten ausgeführt. 30 zusätzliche Fullpage-PNGs in `resume-live/`, nicht über die Erstaufnahmen geschrieben. Dieser Test prüft Rendering/Styles/Initialisierung/Navigation und Dokumentoverflow, er erklärt innere Komponentenfehler nicht für behoben.
- Vier frische mobile Dialogflows zusätzlich mit Enter → 1800 ms → Tab geprüft und aufgenommen: Tarot hält den Fokus im Dialog; Kristalle/Runen/Wissen nicht. Runendialog weiterhin **345/325 px**; Kartenüberschrift „Energiezentrum“ weiter **163/84 px**. Bei breiterer DOM-Erfassung wurden 17 überlaufende h3/h4/p-Knoten bei Kristallen und 17 bei Wissen erfasst; das sind andere Selektoren als in der Schwesterprüfung, keine zusätzlichen deduplizierten Ursachen. Frischer isolierter Light-Kontrastscan bestätigt erneut **30** beanstandete Knoten.
- Insgesamt damit **154 echte PNGs**: ursprüngliche 120 plus 30 neue Basis- und vier neue Dialogaufnahmen. Die neuen Aufnahmen sind Wiederholungen des weiterhin fehlerhaften Zustands, **keine korrigierten Nachher-Belege**. Aktuelle Hash-/PNG-Prüfung im erneuerten `image-manifest.json`; bestehende zehn unabhängige Arbeitsdateien weiterhin gegen Erhaltungsmanifest geprüft.
- Bildzugang erneut tatsächlich versucht: `vision_analyze` lehnt das konfigurierte Modell `thinkingmachines/inkling-small:free` mit `model_not_found` für das Codex-/ChatGPT-Konto ab. Unabhängiger Bild-Delegationsversuch startet nicht, da Backend `model_map` nicht installiert ist. Keine Provideränderung oder kostenpflichtiger Ausweg vorgenommen. Deshalb weiterhin **keine gestalterische Sichtfreigabe**.
- Konkreter externer Blocker: Betreiber muss kompatiblen Bildzugang bereitstellen oder die Originalgalerie menschlich prüfen. Zusätzlich bleiben die korrigierten Nachher-Aufnahmen M1–M5 aus `t_ddfe7b03` offen. Diese Reviewkarte wird nicht allein zum Freigeben ihrer Behebungskarte fälschlich abgeschlossen; deren Abhängigkeit muss der Orchestrator bei gewünschter vorgezogener Behebung ausdrücklich umplanen. Keine doppelten Fixkarten angelegt.
- Reproduzierbarer Zusatz: `node scripts/verify-pages.cjs https://ingbms.github.io/Esoterik-Welt/ evidence/t_befcdea7/resume-live` und `node evidence/t_befcdea7/resume-check.cjs`. Die zuerst unvollständige neue Skriptausführung wurde korrigiert und vollständig erneut ausgeführt; der danach isolierte Kontrastscan verhindert einen durch ein offenes SPA-Overlay verdeckten falschen Nullbefund.

## 7. Reproduzierbarkeit und Artefakte

- Bericht: `docs/visueller-review-t_befcdea7.md`, identische Kopie `evidence/t_befcdea7/report.md`.
- Einstieg: `evidence/t_befcdea7/comparison.html`.
- Messdaten: `summary.json`, `live/results.json`, `token-layout.json`, `interactions.json`, `retest.json`, `axe-source.json`, `contrast.json`, `preserved-tests.json`, `image-manifest.json`.
- Skripte im gleichen Evidenzverzeichnis: `audit.cjs`, `retest.cjs`, `axe-source.cjs`, `package.py`.
- Reproduktion im Websiteprojekt: `node scripts/verify-pages.cjs https://ingbms.github.io/Esoterik-Welt/ evidence/t_befcdea7/live`; `node evidence/t_befcdea7/audit.cjs`; `node evidence/t_befcdea7/retest.cjs`; `node evidence/t_befcdea7/axe-source.cjs`; `python evidence/t_befcdea7/package.py`.
- Gesamtpaket: `evidence/t_befcdea7/esoterik-welt-style-review.zip` (Bericht, Galerie, Messdaten, Original-PNGs und reproduzierbare Skripte).
