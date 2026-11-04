# Funktions-Katalog der Baseline

**Produktbaseline:** Git-Tag `baseline/rubriken-2026-11-03` @ `9f584397f8cc86a261fccdfc36dfbb8999f55ea7`
**Arbeitsstand:** Branch `wt/t_cbbf71e0`, gemeinsamer Katalog-Worktree
**Erhoben am:** 2026-11-03
**Verbindliche Struktur:** `docs/migration-baseline/00-schema-und-scope.md` §9 (Funktions-Katalog)

Dieser Katalog beschreibt **Verhalten**, nicht Gestaltung und nicht Text. Er beantwortet die Frage,
was ein Besucher auf der ausgelieferten Website tun kann, wo es im Code steht und wie es geprüft wird.
Jede Zeile nennt eine belegte Datei mit Zeilenbereich oder einen ausführbaren Befehl. Es wurde nichts
rekonstruiert: alle Angaben stammen aus dem Release-Stand und sind mit
`scripts/migration-baseline/measure-functions.cjs` reproduzierbar.

## 0. Aufbau und Abgrenzung

§9.1 verlangt eine Tabelle je Bereich mit zehn Spalten. Das sind die Bereiche `GLO`, `TAR`, `KRY`,
`MON`, `AST`, `FRQ`, `RUN`, `PEN`, `FBW`, `BLG`; sie stehen geschlossen in Kapitel 2. Die sechs
Sachabschnitte des Auftrags (Routing, Interaktive Module, Datenquellen und Generatoren, Externe Dienste
und Requests, Speicher und Browserfunktionen, SEO und Metadaten) sind die Kapitel 1 und 3–6.

| Kapitel | Inhalt | Warum getrennt |
| --- | --- | --- |
| 1 | Routing | Adressvertrag; gilt für alle Bereiche gemeinsam |
| 2 | Interaktive Module (zehn Bereichstabellen nach §9.1) | Verhalten je Rubrik |
| 3 | Datenquellen und Generatoren | Erzeugerkette, nicht Besucherverhalten |
| 4 | Externe Dienste und Requests | Netzgrenze; heute zwei Requests, keine Drittanbieter |
| 5 | Speicher und Browserfunktionen | lokale Zustände; acht Schlüssel, kein Server |
| 6 | SEO und Metadaten | Dokumente, Canonicals, strukturierte Daten |
| 7 | Befunde | Widersprüche, nicht geglättet |
| 8 | Nicht erfasst | bewusste Abgrenzung nach §9.2 |
| 9 | Prüfverfahren | wie man diesen Katalog nachrechnet |
| 10 | Offene Fragen | was eine Eigentümerentscheidung braucht |
| 11 | Anhang: Modulübersicht | eine Zeile je ausgelieferter Moduldatei, generiert |

**Notation.** `L<start>-L<ende>` ist ein Zeilenbereich in der Baseline (1-basiert, einschließlich).
`js/modules/…` ist repo-relativ. `cmd:` ist ein ausführbarer Nachweis. Ein Eintrag ohne Testpfad
trägt einen `cmd:`-Nachweis und ist in §9.3 als Testlücke ausgewiesen.

**Nicht Gegenstand:** Gestaltung (Design-Katalog), Texte (Inhalts-Katalog), Medienrechte
(Medien-Katalog). Interne Hilfsfunktionen ohne sichtbare Wirkung sind nach §9.2 ausgeschlossen
(Begründung in Kapitel 8).

## 1. Routing

Eine einzige HTML-Datei trägt alle Ansichten; die Adresse ist ein Hash-Fragment. Es gibt keine
serverseitige Route und keinen Router-Dienst.

| Route | Ziel | Quelle | Verhalten | Nachweis |
| --- | --- | --- | --- | --- |
| (leer) | `#home` | `js/main.js` · `parseRoute` · L167-L244 | Leeres Fragment wird zur Startseite, nicht zu „unbekannt“ | `tests/pages-regression.cjs` |
| `#home`, `#tarot`, `#crystals`, `#moon`, `#astrologie`, `#frequenzen`, `#runes`, `#pendeln`, `#farbwelten`, `#blog` | zehn Hauptseiten | `js/main.js` · `MAIN_PAGES` · L24-L35 | Genau eine `.page` ist aktiv; `aria-current="page"` sitzt am passenden Navigationslink | `cmd: grep -n "const MAIN_PAGES" js/main.js` |
| `#main` | Sprungziel im Dokument | `js/main.js` · `SKIP_ANCHOR` · L37 | Wird nie Seiten-ID; fokussiert `#main` | `js/main.js` · `focusMain` · L469-L476 |
| `#blog/<id>` | Artikel-Dialog | `js/main.js` · `ARTICLE_ROUTE` · L38 | Artikel öffnet als Dialog mit eigener History-Station; unbekannte ID zeigt Bereichshinweis | `js/main.js` · `resolveArticle` · L246-L251 |
| `#astrologie/…` | Unterrouten des Bereichs | `js/main.js` · `ASTROLOGIE_ROUTE` · L44 | Segmente und Query gehen an das Bereichsmodul; unbekannter Slug zeigt Bereichs-Fehleransicht | `tests/astrologie.spec.js` |
| `#frequenzen/…` | Unterrouten des Bereichs | `js/main.js` · `FREQUENZ_ROUTE` · L48 | `hub`, `labor`, `quellen`, `cymatics`, `meditation` | `tests/frequenzlabor.spec.js` |
| `#frequenzlabor` | Alias auf `#frequenzen/labor` | `js/main.js` · `FREQUENZ_ALIAS` · L49 | Alte Links werden per `history.replaceState` auf die kanonische Adresse umgeschrieben, ohne zweite Seite | `cmd: grep -n "FREQUENZ_ALIAS" js/main.js` |
| `#pendeln/…` | Unterrouten des Bereichs | `js/main.js` · `PENDELN_ROUTE` · L55 | Themen-Slugs, `glossar`, `quellen`, `methodik`, `labor`, `studio`, `experiment`, `journal`, `suche` | `tests/radiasthesie.spec.js` |
| `#farbwelten/…` | Unterrouten des Bereichs | `js/main.js` · `FARBWELTEN_ROUTE` · L60 | Landing, zwölf Farbseiten, drei Themenseiten, `chakren`, `lichtfrequenzen`, `kompass`, `farbmeditation`, `zeitleiste` | `tests/farbwelten.spec.js` |
| `#chakren`, `#lichtfrequenzen` | Alias auf Farbwelt-Unterrouten | `js/main.js` · `FARBWELTEN_ALIASES` · L63 | Auftragsadressen bleiben gültig und werden auf `#farbwelten/…` normalisiert | `cmd: grep -n "FARBWELTEN_ALIASES" js/main.js` |
| unbekanntes Fragment | Bereichshinweis | `js/main.js` · `showRouteNotice` · L478-L487 | `#routeNotice` erscheint mit Text und Rücklink `#home`; keine Seite wird versteckt | `cmd: grep -n "routeNotice" index.html js/main.js` |

Zwei Regeln, die im Code begründet sind und beim Testen leicht übersehen werden:

1. **Ankerrouten scrollen selbst.** `isAnchorRoute` (`js/main.js` L70-L76) unterdrückt den generischen
   Scroll nach oben, wenn eine Route ein zweites Segment hat oder ein Einstiegsanker ist
   (`register`, `einstiege`, `methodik`, L65). Sonst würde jeder Ankerklick die Seite zurücksetzen.
2. **Scroll-Restauration ist manuell.** `history.scrollRestoration = 'manual'` (in
   `setupNavigation`, L397-L467) verhindert, dass der Browser bei Deep-Links eine alte Position
   wiederherstellt.

## 2. Interaktive Module

Zehn Bereichstabellen nach §9.1. Spaltenreihenfolge und Bedeutung sind unverändert übernommen:
`ID`, `Funktion`, `Auslöser`, `Quelle`, `Zustände`, `Prüfkriterium`, `Status`, `Release`, `Owner`,
`Nachweis`.

Die Bereiche werden nach §9.2 vollständig erfasst, auch die drei lazy geladenen (`FRQ`, `PEN`, `FBW`),
weil der Ladepfad Teil des Verhaltens ist.

**Zuordnungsregel `Owner`** (nach §5.4): Interaktion, Filter, Werkzeuge und Dialoge →
`design_web_layout`; reine Text- und Dokumentansichten → `writer`; Routing, Ladevertrag und
strukturierte Daten → `architect`; Build, Generatoren und Katalogprüfung → `structured_output`.

### 2.1 GLO — global

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-GLO-001 | Seite über die Adresse öffnen | Hash-Fragment, Navigationslink | `js/main.js` · `parseRoute` · L167-L244; `applyRoute` · L531-L637 | Seite aktiv, Artikel, unbekannt, Sprungziel | `#tarot` setzt genau eine `.page` auf `active`, blendet alle anderen aus und setzt `aria-current="page"` am Tarot-Link | final | must | architect | `tests/pages-regression.cjs` |
| FUN-GLO-002 | Unbekanntes Fragment abfangen | beliebige unbekannte Adresse | `js/main.js` · `showRouteNotice` · L478-L487 | Hinweis sichtbar, Hinweis ausgeblendet | `#gibtsnicht` zeigt `#routeNotice` mit Text und Link auf `#home`; die zuletzt aktive Seite bleibt sichtbar | final | must | architect | `cmd: grep -n "gehört zu keiner Seite" js/main.js` |
| FUN-GLO-003 | Zum Hauptinhalt springen | `Tab` auf der Seite, dann `Enter` | `index.html` L64; `js/main.js` · `focusMain` · L469-L476 | Fokus auf `#main` | Erstes `Tab` fokussiert den Sprunglink; `Enter` setzt den Fokus auf `#main` und scrollt die Kopfzeilenhöhe aus | final | must | design_web_layout | `tests/pages-regression.cjs` |
| FUN-GLO-004 | Hauptnavigation auf schmalen Viewports umschalten | `#navToggle` | `js/main.js` · `setupNavigation` · L397-L467 | offen, geschlossen | Klick setzt `aria-expanded="true"`, `aria-label="Menü schließen"` und die Klasse `open`; ein zweiter Klick setzt alle drei zurück; `Escape` schließt und legt den Fokus auf `#navToggle` | final | must | design_web_layout | `tests/pages-regression.cjs` |
| FUN-GLO-005 | Unterroute eines Bereichs ansteuern | Adresse mit zweitem Segment | `js/main.js` · `applyRoute` · L531-L637 | Bereichsansicht, Anker, unbekannter Slug | `#astrologie/zeichen/widder` rendert die Widder-Detailseite; `#astrologie/gibtsnicht` rendert die Bereichs-Fehleransicht statt der Seitennotiz | final | must | architect | `tests/astrologie.spec.js` |
| FUN-GLO-006 | Alten Frequenzlabor-Link normalisieren | `#frequenzlabor` | `js/main.js` · `FREQUENZ_ALIAS` · L49; `js/main.js` · `applyRoute` · L531-L637 | Alias erkannt, kanonische Adresse | Aufruf öffnet `#frequenzen/labor`, die Adresszeile zeigt danach `#frequenzen/labor`, und die Zurück-Taste führt nicht auf eine Zwischenseite | final | must | architect | `cmd: grep -n "FREQUENZ_ALIAS" js/main.js` |
| FUN-GLO-007 | Farbwelt-Alias öffnen | `#chakren`, `#lichtfrequenzen` | `js/main.js` · `FARBWELTEN_ALIASES` · L63; `js/main.js` · `parseRoute` · L167-L244 | Alias, kanonische Adresse | `#chakren` rendert die Chakren-Ansicht und ersetzt die Adresse durch `#farbwelten/chakren` | final | must | architect | `tests/farbwelten.spec.js` |
| FUN-GLO-008 | Artikel als Deep-Link öffnen | `#blog/<id>` oder Klick auf eine Artikelkarte | `js/main.js` · `resolveArticle` · L246-L251; `js/main.js` · `init` · L279-L394 | Dialog offen, Artikel unbekannt | `#blog/3` öffnet Artikel 3 im Dialog; Browser-Zurück schließt ihn; `#blog/999` zeigt den Bereichshinweis statt eines leeren Dialogs | final | must | architect | `tests/pages-regression.cjs` |
| FUN-GLO-009 | Dialog schließen | `Escape`, Schließen-Schaltfläche, Klick auf den Hintergrund | `js/dialog.js` · `DialogController` · L4-L90 | offen, geschlossen, Fokus zurückgegeben | `Escape` schließt den obersten Dialog; der Fokus kehrt zum auslösenden Element zurück; der Hintergrund ist während des Dialogs `inert` | final | must | design_web_layout | `cmd: grep -n "inert" js/dialog.js` |
| FUN-GLO-010 | Startseiten-Kacheln benutzen | `#featureGrid` | `js/main.js` · `populateFeatureGrid` · L734-L792 | neun Kacheln | Neun Kacheln erscheinen; `Enter` und Klick auf eine Kachel navigieren zur jeweiligen Seite; jede Kachel ist per `Tab` erreichbar | final | should | design_web_layout | `cmd: grep -c "data-page" js/main.js` |
| FUN-GLO-011 | Offline-Ausgabe erzeugen | `npm run build:local` | `scripts/build-local.cjs` · L10-L120 | Datei erzeugt, Daten eingebettet | Erzeugt `Lokal.html` und vier `Lokal-*.html`; die Datei lädt ohne Modul-, `fetch`- oder Schriftanfrage | final | should | structured_output | `tests/offline-file.cjs` |
| FUN-GLO-012 | Produktionsseiten bauen | `npm run build` | `scripts/build-pages.cjs` · L14-L65 | Abbild erzeugt | `dist/Esoterik-Welt/` enthält `index.html`, vier Rechtsseiten, `radiasthesie/`, `css`, `js`, `data`, `assets`, `content`; `*.bak*` und `_*` werden nicht kopiert | final | must | structured_output | `tests/pages-regression.cjs` |
| FUN-GLO-013 | Bereichsmodul erst nachladen | erster Aufruf einer Bereichsroute | `js/modules/frequenzlabor-loader.js` · `load` · L11-L20; `radiasthesie-loader.js` · L12-L21; `farbwelten-loader.js` · L11-L20 | nicht geladen, lädt, geladen, Fehler | Erster Aufruf lädt das Modul einmal; ein zweiter Aufruf verwendet die vorhandene Instanz; ein Ladefehler schreibt eine Bereichsmeldung in den Wurzelcontainer | final | must | architect | `tests/frequenzlabor.spec.js` |

### 2.2 TAR — Tarot

Zwei Decks mit identischen 78 Karten-IDs: `nachtatelier-v1` (Standard, Version 1.0.0) und
`gartenbrevier-v2` (Farbvariante, Stand 2026-11-02), registriert in `js/data/tarot-decks.js` L15-L45.

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-TAR-001 | Kartenübersicht ansehen | `#tarot` | `js/modules/tarot.js` · `renderGrid` · L174-L188 | 78 Karten, gefiltert, leer | Die Übersicht rendert 78 Karten; jede Karte hat einen zugänglichen Namen; Bilder werden erst beim Sichtbarwerden geladen | final | must | design_web_layout | `cmd: node --test tests/tarot-deck.cjs` |
| FUN-TAR-002 | Karten suchen und nach Arcana filtern | `#tarotSearch`, `#arcanaFilter` | `tarot.js` · `setSearch` · L273-L278; `filterCards` · L280-L284; `updateResultStatus` · L286-L302 | Treffer, keine Treffer, Filter zurückgesetzt | Eingabe „Mond“ reduziert die Übersicht auf passende Karten und schreibt die Trefferzahl in `#tarotResultCount`; `#tarotResetFilters` stellt den Vollbestand her | final | must | design_web_layout | `cmd: grep -n "tarotResultCount" index.html js/modules/tarot.js` |
| FUN-TAR-003 | Tageskarte ziehen | `#drawCardBtn` | `tarot.js` · `drawCard` · L540-L542; `runDraw` · L548-L571 | Knopf gesperrt, Mischen, Ergebnis | Klick sperrt den Knopf mit `aria-busy`, zeigt nach dem Mischen genau eine Karte und öffnet danach den Detaildialog | final | must | design_web_layout | `cmd: grep -n "drawCardBtn" index.html js/modules/tarot.js` |
| FUN-TAR-004 | Drei-Karten-Legung ziehen | `#drawThreeBtn` | `tarot.js` · `drawThree` · L544-L546; `runDraw` · L548-L571 | Knopf gesperrt, Mischen, drei Karten | Klick zeigt genau drei verschiedene Karten in `#drawnCards` und öffnet die erste im Dialog; der Knopf ist danach wieder bedienbar | final | must | design_web_layout | `cmd: grep -n "drawThreeBtn" index.html js/modules/tarot.js` |
| FUN-TAR-005 | Deck wählen | Auswahlfeld `#tarotDeckPicker` | `tarot.js` · `renderDeckPicker` · L90-L133; `setDeck` · L149-L165 | Standard, Farbvariante | Die Auswahl erscheint nur bei mindestens zwei Decks; ein Wechsel aktualisiert Galerie, Ziehung und Detail; die Wahl überlebt einen Neuladen | final | must | design_web_layout | `tests/tarot-decks-v2.cjs` |
| FUN-TAR-006 | Karten-Detail lesen | Klick auf eine Karte | `tarot.js` · `renderDetail` · L330-L404 | offen, Bild lädt, Bildfehler | Der Dialog nennt Kartenname, Arcana und Deutung; ein fehlendes Bild führt zu einer Textalternative statt zu einem leeren Rahmen | final | must | design_web_layout | `tests/tarot-decks-v2.cjs` |
| FUN-TAR-007 | Kartenbild vergrößern | Schaltfläche im Detaildialog | `tarot.js` · `toggleZoom` · L513-L536 | normal, vergrößert | Umschalten wechselt auf die Zoomstufe und zurück; `Escape` schließt weiterhin den Dialog | final | should | design_web_layout | `cmd: grep -n "toggleZoom" js/modules/tarot.js` |
| FUN-TAR-008 | Ziehungshistorie ansehen | `#tarot`-Bereich nach einer Ziehung | `tarot.js` · `loadHistory` · L621-L629; `renderHistory` · L645-L671 | leer, gefüllt | Nach einer Ziehung erscheint ein Eintrag; die Liste ist auf 50 Einträge begrenzt; ein Neuladen erhält sie | final | should | design_web_layout | `cmd: grep -n "esoterik_tarot_history" js/modules/tarot.js` |

### 2.3 KRY — Kristalle

Der Bereich lädt `data/crystals.json` (30 Steine). `js/data/crystals.js` (36 Steine) wird von keinem
Modul importiert; der Widerspruch steht in §7.

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-KRY-001 | Steine nach Chakra filtern | `#chakraFilter` | `js/modules/crystals.js` · `buildFilterUI` · L176-L238; `applyFilters` · L284-L303 | alle, gefiltert, leer | Auswahl eines Chakras reduziert das Raster auf Steine mit diesem Chakra und zeigt einen aktiven Filter-Chip | final | must | design_web_layout | `cmd: grep -n "chakraFilter" index.html js/modules/crystals.js` |
| FUN-KRY-002 | Steine nach Farbe filtern | `#colorFilter` | `crystals.js` · `applyFilters` · L284-L303; `renderFilterChips` · L240-L282 | alle, gefiltert | Auswahl einer Farbe reduziert das Raster; die Kombination mit dem Chakra-Filter wirkt als Schnittmenge | final | must | design_web_layout | `cmd: grep -n "colorFilter" index.html js/modules/crystals.js` |
| FUN-KRY-003 | Steine suchen | `#crystalSearch` | `crystals.js` · `applyFilters` · L284-L303 | Treffer, keine Treffer | Eingabe filtert über Name und Stichwörter; ohne Treffer erscheint ein leerer Zustand statt eines leeren Rasters | final | must | design_web_layout | `cmd: grep -n "crystalSearch" index.html js/modules/crystals.js` |
| FUN-KRY-004 | Steindetail öffnen | Klick auf eine Steinkarte | `crystals.js` · `openCrystalModal` · L501-L533 | offen, Bildfehler | Der Dialog zeigt Name, Chakra, Farbe, Wirkung und Bildnachweis; ein Bildfehler hinterlässt keinen leeren Platzhalter | final | must | design_web_layout | `tests/crystals-attribution.cjs` |
| FUN-KRY-005 | Stein als Favorit merken | Favoriten-Schaltfläche an der Karte | `crystals.js` · `toggleFavorite` · L149-L155; `saveFavorites` · L142-L147 | nicht gemerkt, gemerkt | Umschalten erhöht `#favCounter`; die Wahl überlebt ein Neuladen; ein defekter Speicherwert führt zu einer leeren Liste statt zu einem Absturz | final | should | design_web_layout | `cmd: grep -n "esot_crystals_fav" js/modules/crystals.js` |
| FUN-KRY-006 | Zwischen Raster- und Listenansicht wechseln | `#viewGridBtn`, `#viewListBtn` | `crystals.js` · `setViewMode` · L462-L469 | Raster, Liste | Der aktive Knopf trägt `aria-pressed="true"`; genau eine Ansicht ist sichtbar | final | should | design_web_layout | `cmd: grep -n "viewGridBtn" index.html` |

### 2.4 MON — Mondphasen

Berechnung im Browser nach Meeus, Kapitel 48–49, Zeitzone Europe/Berlin. Kein Server, keine
Ephemeridendatei.

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-MON-001 | Aktuelle Phase mit Beleuchtungsgrad sehen | `#moon` | `js/modules/moon.js` · `renderNow` · L203-L279 | geladen, Fehler | Die Ansicht nennt Phase, Beleuchtungsgrad in Prozent, Mondalter und Tage bis zur nächsten Hauptphase; die Werte stimmen mit `moon-astro.cjs` überein | final | must | writer | `tests/moon-astro.cjs` |
| FUN-MON-002 | Zeitachse der vier Hauptphasen lesen | `#moonTimeline` | `moon.js` · `renderTimeline` · L281-L308 | gefüllt, leer | Vier Hauptphasen erscheinen in chronologischer Reihenfolge mit Datum und Uhrzeit | final | must | writer | `cmd: grep -n "moonTimeline" index.html` |
| FUN-MON-003 | Monatskalender ansehen | `#moonCalendar` | `moon.js` · `renderCalendar` · L331-L399 | Monat geladen | Der Kalender enthält jeden Tag des Monats mit Phasensymbol; Wochenenden und Leerzellen sind unterscheidbar | final | must | design_web_layout | `tests/moon-calendar.spec.js` |
| FUN-MON-004 | Tagesdetail im Kalender öffnen | Klick auf einen Kalendertag | `moon.js` · `selectDay` · L449-L464; `renderDayDetail` · L417-L447 | Tag gewählt, Detail sichtbar | Klick füllt `#moonDayDetail` mit Datum, Phase und Beleuchtung des gewählten Tages; der gewählte Tag trägt `aria-pressed="true"` und ist als gewählt markiert | final | must | design_web_layout | `tests/moon-calendar.spec.js` |
| FUN-MON-005 | Monat wechseln oder zu heute springen | `#moonPrevMonth`, `#moonNextMonth`, `#moonTodayBtn` | `moon.js` · `shiftMonth` · L466-L495; `goToday` · L506-L514 | Vormonat, Folgemonat, aktueller Monat | Monatswechsel ändert die Beschriftung in `#moonCalendarLabel` und die Tageszellen; „Heute“ stellt den aktuellen Monat wieder her | final | must | design_web_layout | `tests/moon-calendar.spec.js` |
| FUN-MON-006 | Mondphasen als iCal-Datei exportieren | `#icalBtn` | `moon.js` · `setupIcal` · L605-L632 | Export bereit, Fehler | Der Export erzeugt eine `text/calendar`-Datei mit den Hauptphasen der nächsten zwölf Monate; `#icalStatus` meldet den Erfolg | final | should | structured_output | `cmd: grep -n "icalBtn" index.html js/modules/moon.js` |
| FUN-MON-007 | Phasendeutungen und Rituale lesen | `#moon` | `moon.js` · `renderRituals` · L310-L328 | gefüllt | Die acht Phasen sind mit Deutung und Ritualhinweis beschrieben; die Texte sind als Tradition gekennzeichnet | final | should | writer | `cmd: grep -n "moonRituals" index.html` |
| FUN-MON-008 | Ausfall der Mondberechnung anzeigen | `#moon` bei Rechenfehler | `moon.js` · `renderFailure` · L682-L693 | Fehler sichtbar | `#moonError` erscheint mit verständlichem Text; die Seite bleibt bedienbar und zeigt keine stillen Platzhalter | final | must | design_web_layout | `cmd: grep -n "moonError" js/modules/moon.js` |

### 2.5 AST — Astrologie

Ein Bereich mit zwölf Unterrouten (siehe Kapitel 1). Alle Ansichten sind statisch: keine Berechnung,
keine Geburtsdaten, keine Live-Positionen. Der Bereich lädt seinen Datenbestand beim ersten Aufruf
(`js/modules/astrologie.js` · `load` · L68-L82) und rendert ihn danach ohne weiteren Netzzugriff.

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-AST-001 | Bereichsübersicht öffnen | `#astrologie` | `js/modules/astrologie-views.js` · `renderHub` · L139-L259 | geladen, Ladefehler | Die Übersicht zeigt Einstiege zu Zeichen, Faktoren, Häusern, Aspekten, Lernpfad, Glossar und FAQ; bei fehlenden Daten erscheint `renderFailure` statt einer leeren Seite | final | must | writer | `tests/astrologie.spec.js` |
| FUN-AST-002 | Zeichen nachschlagen | `#astrologie/zeichen`, `#astrologie/zeichen/<slug>` | `astrologie-views.js` · `renderZeichenIndex` · L359-L437; `renderZeichenDetail` · L439-L502 | Index, gefiltert, Detail | Der Index listet zwölf Zeichen; Element- und Modalitätsfilter sowie `?q=` grenzen ein; ein unbekannter Slug rendert die Bereichs-Fehleransicht | final | must | writer | `tests/astrologie.spec.js` |
| FUN-AST-003 | Faktoren nachschlagen | `#astrologie/faktoren` | `astrologie-views.js` · `renderFaktorenIndex` · L506-L558; `renderFaktorenDetail` · L560-L610 | Index, Suche, Detail | Der Index listet die zehn Faktoren; die Suche filtert; jeder Faktor hat eine Detailseite mit Quellenpanel | final | must | writer | `tests/astrologie.spec.js` |
| FUN-AST-004 | Häuser nachschlagen | `#astrologie/haeuser` | `astrologie-views.js` · `renderHaeuserIndex` · L614-L644; `renderHaeuserDetail` · L646-L691 | Index, Detail | Zwölf Häuser erscheinen in numerischer Reihenfolge; jedes Detail nennt Thema und zugeordnete Zeichen | final | must | writer | `tests/astrologie.spec.js` |
| FUN-AST-005 | Aspekte nachschlagen | `#astrologie/aspekte` | `astrologie-views.js` · `renderAspekteIndex` · L695-L721; `renderAspekteDetail` · L723-L766 | Index, Detail | Fünf Hauptaspekte erscheinen; jedes Detail nennt Winkel und Orbis | final | must | writer | `tests/astrologie.spec.js` |
| FUN-AST-006 | Lernpfad durchlaufen | `#astrologie/lernpfad` | `astrologie-views.js` · `renderLernpfadIndex` · L263-L298; `renderLernpfadDetail` · L300-L355 | Index, Stufe, unbekannte Stufe | Der Index listet die Stufen in Reihenfolge; eine Stufe verlinkt auf die nächste; eine unbekannte Stufe rendert die Fehleransicht | final | should | writer | `tests/astrologie.spec.js` |
| FUN-AST-007 | Grundlagen und Beispiele lesen | `#astrologie/grundlagen`, `#astrologie/beispiele` | `astrologie-views-reference.js` · `renderGrundlagenIndex` · L26-L82; `renderGrundlagenDetail` · L84-L116; `renderBeispieleIndex` · L120-L148; `renderBeispieleDetail` · L150-L203 | Index, Suche, Detail | Beide Register filtern per `?q=`; jede Detailseite trägt Kennzeichnung und Quellen | final | should | writer | `tests/astrologie.spec.js` |
| FUN-AST-008 | FAQ lesen | `#astrologie/faq` | `astrologie-views-reference.js` · `renderFaq` · L207-L243 | zu, offen | Jede Frage ist ein `details`-Element; Öffnen zeigt die Antwort ohne Seitenwechsel; der Zustand überlebt einen Reload nicht | final | should | writer | `tests/astrologie.spec.js` |
| FUN-AST-009 | Glossar durchsuchen | `#astrologie/glossar`, `?q=`, Buchstabensprung | `astrologie-views-reference.js` · `renderGlossar` · L249-L331 | alle, gefiltert, Buchstabe | Buchstabensprung fokussiert die passende Gruppe; `?q=` filtert Begriffe und Definitionen; „gross“ findet „groß“ | final | must | writer | `tests/astrologie.spec.js` |
| FUN-AST-010 | Astrologie durchsuchen | `#astrologie/suche`, Formular `data-astro-form="suche"` | `astrologie-views-reference.js` · `renderSuche` · L487-L551; `astrologie.js` · `bind` · L205-L273 | keine Suche, Treffer, keine Treffer | Die Suche durchsucht alle Typen und gruppiert Treffer nach Bereich; ohne Treffer erscheinen benannte Einstiege; die Eingabe bleibt beim Nachrendern erhalten | final | must | design_web_layout | `tests/astrologie.spec.js` |
| FUN-AST-011 | Quellen und Claims prüfen | `#astrologie/quellen` | `astrologie-views-reference.js` · `renderQuellen` · L335-L396 | Liste, ausgewählte Quelle | Jede belegte Aussage erscheint als Claim mit Evidenztyp und Quelle; `?quelle=` hebt die zugehörigen Aussagen hervor | final | must | writer | `tests/astrologie.spec.js` |
| FUN-AST-012 | Methodik und Grenzen lesen | `#astrologie/methodik` | `astrologie-views-reference.js` · `renderMethodik` · L400-L483 | statisch | Die Seite nennt Arbeitsannahme, Kennzeichnungssystem, Evidenzlage und die drei Ausschlüsse (keine Berechnung, keine Geburtsdaten, keine Prognose) | final | must | writer | `tests/astrologie.spec.js` |
| FUN-AST-013 | Ladefehler des Bereichs anzeigen | `#astrologie` ohne Daten | `astrologie-views-reference.js` · `renderFailure` · L596-L612 | Fehler | Bei fehlgeschlagenem Laden erscheint eine verständliche Meldung im Bereich; die übrige Seite bleibt bedienbar | final | must | design_web_layout | `cmd: grep -n "renderFailure" js/modules/astrologie.js` |

### 2.6 FRQ — Frequenzen

Ein Bereich mit fünf Ansichten: `hub` (Bibliothek), `labor`, `quellen`, `cymatics`, `meditation`.
Alle Feature-Flags stehen im Release auf `true` (`js/modules/frequenz-flags.js` L10-L17); die
Flags wirken nur auf lokalen Origins als Kill-Switch. Der Ton stoppt bei Routenwechsel, bei
`visibilitychange → hidden` und bei `pagehide`.

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-FRQ-001 | Frequenzbibliothek ansehen | `#frequenzen` | `js/modules/frequenzlabor.js` · `renderHub` · L375-L456; `renderLibrary` · L525-L540 | geladen, leer, Fehler | Die Bibliothek listet die Einträge mit Evidenzstatus; jeder Eintrag nennt Quelle und Frequenzbereich | final | must | writer | `tests/frequencies-data.cjs` |
| FUN-FRQ-002 | Ton erzeugen und Frequenz einstellen | `#frequenzen/labor`, Schieber und Zahlenfeld | `frequenzlabor.js` · `renderLab` · L658-L808; `bindLab` · L856-L927; `setFrequency` · L945-L956 | gestoppt, spielt, pausiert, Fehler | Der Schieber ist logarithmisch über 20–20.000 Hz; das Zahlenfeld folgt dem Schieber und umgekehrt; ein Wert außerhalb des Bereichs wird geklemmt und gemeldet | final | must | design_web_layout | `tests/frequenz-engine.mjs` |
| FUN-FRQ-003 | Sweep starten und abbrechen | Schaltflächen im Labor | `frequenzlabor.js` · `startSweep` · L1072-L1093 | läuft, abgebrochen, fertig | Der Sweep zeigt einen Fortschritt; „Abbrechen“ beendet ihn mit Ansage; nach dem Ende steht der Regler auf dem Zielwert | final | must | design_web_layout | `tests/frequenzlabor.spec.js` |
| FUN-FRQ-004 | Schwebung demonstrieren | Schaltfläche „Schwebung“ | `frequenzlabor.js` · `playBeat` · L982-L993; `updateBeatInfo` · L1155-L1160 | gestoppt, spielt | Zwei Töne werden mit der eingestellten Differenz abgespielt; die angezeigte Schwebungsfrequenz entspricht der Differenz | final | must | design_web_layout | `tests/frequenzlabor.spec.js` |
| FUN-FRQ-005 | Binaurale Demonstration starten | Auswahl und Schaltfläche im Labor | `frequenzlabor.js` · `playBinaural` · L995-L1012 | gestoppt, spielt, nicht unterstützt | Trägerfrequenz und Differenz werden getrennt je Ohr ausgegeben; ohne Stereofähigkeit erscheint ein Hinweis statt eines stummen Knopfs | final | should | design_web_layout | `tests/frequenzlabor.spec.js` |
| FUN-FRQ-006 | 432/440 Hz vergleichen | Schaltflächen „432 Hz“ und „440 Hz“ | `frequenzlabor.js` · `playFixed` · L970-L980 | gestoppt, 432, 440 | Beide Schaltflächen spielen genau den angegebenen Ton; die Anzeige nennt die aktive Frequenz | final | should | design_web_layout | `tests/frequenzlabor.spec.js` |
| FUN-FRQ-007 | Oszillogramm ansehen | Ansicht `#frequenzen/labor` | `js/modules/frequenz-visualisierung.js` · `FrequenzVisualisierung` · L9-L179 | läuft, pausiert, reduziert | Das Canvas zeichnet die Wellenform und ist `aria-hidden`; eine Textentsprechung nennt Frequenz und Wellenform; `prefers-reduced-motion` stoppt die Animationsschleife | final | must | design_web_layout | `tests/frequenzlabor.spec.js` |
| FUN-FRQ-008 | Chladni-Muster ansehen | Ansicht `#frequenzen/cymatics` | `js/modules/frequenz-chladni.js` · `buildField` · L66-L83; `frequenzlabor.js` · `renderCymatics` · L287-L296; `frequenz-cymatics-view.js` · `CymaticsView` · L51-L279 | Modus gewählt, Feld berechnet | Das Muster folgt dem gewählten Modus (n, m); die Knotenlinien stimmen mit `frequenz-chladni.mjs` überein; das Modell ist als idealisiert gekennzeichnet | final | must | design_web_layout | `tests/frequenz-chladni.mjs` |
| FUN-FRQ-009 | Geführte Frequenzmeditation starten | Ansicht `#frequenzen/meditation` | `js/modules/frequenz-meditation-view.js` · `MeditationView` · L53-L640; `frequenzlabor.js` · `renderMeditation` · L298-L308 | bereit, läuft, pausiert, beendet | Start setzt den Timer in Gang; Pause hält ihn an; ein Neuladen beendet die Sitzung; die Sitzung wird lokal gespeichert | final | should | design_web_layout | `tests/frequenz-meditation.mjs` |
| FUN-FRQ-010 | Preset auswählen und speichern | Auswahlfeld und Schaltfläche im Hub | `js/modules/frequenz-presets.js` · `createPreferenceStore` · L223-L288 | kein Preset, gespeichert, defekt | Ein gewähltes Preset bleibt nach einem Neuladen erhalten; ein defekter Speicherwert fällt auf den Standard zurück, ohne zu werfen | final | should | design_web_layout | `tests/frequenz-presets.mjs` |
| FUN-FRQ-011 | Quellen und Methodik der Bibliothek lesen | `#frequenzen/quellen` | `frequenzlabor.js` · `loadQuellen` · L597-L602; `readQuellen` · L604-L616; `renderQuellen` · L619-L654 | geladen, Offline-Ersatz, Fehler | Die Ansicht lädt `docs/frequenz-quellen.md` per `fetch`; im Offline-Build wird der eingebettete Text verwendet; ein Ladefehler zeigt eine Meldung im Bereich | final | must | writer | `tests/markdown-lite.mjs` |
| FUN-FRQ-012 | Zwischen den Frequenzansichten wechseln | Navigationsleiste des Bereichs | `js/modules/frequenz-nav.js` · `renderViewNav` · L21-L29 | aktiv, inaktiv | Die Leiste zeigt nur aktivierte Features; der aktive Eintrag trägt `aria-current`; ein Wechsel stoppt den laufenden Ton | final | must | design_web_layout | `tests/frequenzlabor.spec.js` |
| FUN-FRQ-013 | Bereich erst beim ersten Aufruf laden | `#frequenzen…` | `js/modules/frequenzlabor-loader.js` · `load` · L11-L20 | nicht geladen, lädt, geladen, Fehler | Der Initialgraph enthält nur den Loader; der erste Aufruf lädt das Modul einmal; ein Ladefehler schreibt eine Bereichsmeldung | final | must | architect | `tests/frequenzlabor.spec.js` |

### 2.7 RUN — Runen

Vierundzwanzig Runen des älteren Futhark. Die Wurf-Historie liegt im lokalen Speicher
(`esoterik_runes_history`), nicht auf einem Server.

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-RUN-001 | Runenübersicht ansehen | `#runes` | `js/modules/runes.js` · `renderGrid` · L59-L76 | 24 Runen | Die Übersicht rendert 24 Runen; jede ist per Tastatur erreichbar und hat einen zugänglichen Namen | final | must | design_web_layout | `cmd: grep -c "runeGrid" index.html` |
| FUN-RUN-002 | Einzelrune ziehen | `#castSingleRuneBtn` | `runes.js` · `castSingle` · L115-L122; `showSpread` · L123-L146 | Knopf gesperrt, Ergebnis | Klick zeigt genau eine Rune mit Lage (aufrecht oder umgekehrt) und Deutung | final | must | design_web_layout | `cmd: grep -n "castSingleRuneBtn" index.html js/modules/runes.js` |
| FUN-RUN-003 | Drei-Runen-Wurf ausführen | `#castRunesBtn` | `runes.js` · `castThree` · L107-L114; `showSpread` · L123-L146 | Knopf gesperrt, Ergebnis | Klick zeigt genau drei Runen in den Positionen Vergangenheit, Gegenwart, Zukunft; keine Rune erscheint doppelt | final | must | design_web_layout | `cmd: grep -n "castRunesBtn" index.html js/modules/runes.js` |
| FUN-RUN-004 | Runendeutung lesen | Klick auf eine Rune | `runes.js` · `openRuneModal` · L77-L83 | offen, geschlossen | Der Dialog nennt Name, Lautwert, Bedeutung und Kehrseite; `Escape` schließt ihn | final | must | writer | `cmd: grep -n "runeModalBody" index.html` |
| FUN-RUN-005 | Wurf-Historie ansehen | `#runesHistory` | `runes.js` · `saveHistory` · L147-L159; `renderHistory` · L168-L189 | leer, gefüllt | Nach einem Wurf erscheint ein Eintrag mit Zeitstempel und Runen; ein Neuladen erhält die Liste | final | should | design_web_layout | `cmd: grep -n "esoterik_runes_history" js/modules/runes.js` |
| FUN-RUN-006 | Notiz zu einer Rune speichern | Formular im Wurf-Ergebnis | `runes.js` · `saveNoteFromForm` · L160-L167 | leer, gespeichert | Eine eingegebene Notiz wird dem Historieneintrag zugeordnet und nach einem Neuladen wieder angezeigt | final | should | design_web_layout | `cmd: grep -n "runeNote" index.html js/modules/runes.js` |
| FUN-RUN-007 | Einzelnen Historieneintrag löschen | Lösch-Schaltfläche am Eintrag | `runes.js` · `deleteHistory` · L190-L197 | vorhanden, gelöscht | Klick entfernt genau den gewählten Eintrag aus Liste und Speicher; die übrigen bleiben | final | should | design_web_layout | `cmd: grep -n "deleteHistory" js/modules/runes.js` |

### 2.8 PEN — Pendeln und Radiästhesie

Der Bereich hat zehn Ansichten und vier eingebettete Werkzeuge. Alle Werkzeuge arbeiten lokal; es gibt
keinen Server, kein Konto und keine Übertragung von Eingaben. Zusätzlich existieren sieben statische,
indexierbare Dokumente unter `radiasthesie/` (Kapitel 6).

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-PEN-001 | Bereichsübersicht lesen | `#pendeln` | `js/modules/radiasthesie-views.js` · `renderLanding` · L213-L349 | geladen, Fehler | Die Übersicht führt zu den drei Themen und zu den Werkzeugen; Kennzeichnungen (Tradition, Hypothese, Befund) sind sichtbar | final | must | writer | `tests/radiasthesie.spec.js` |
| FUN-PEN-002 | Thema lesen | `#pendeln/<slug>` | `radiasthesie-views.js` · `renderTopic` · L351-L436; `radiasthesie-model.js` · `createModel` · L48-L249 | Thema, Anker, unbekannter Slug | Drei Themen sind erreichbar; ein Abschnittsanker scrollt zum Abschnitt; ein unbekannter Slug rendert die Bereichs-Fehleransicht | final | must | writer | `tests/radiasthesie.mjs` |
| FUN-PEN-003 | Pendel-Simulator bedienen | `#pendeln/radiasthesie` | `js/modules/pendel-simulator.js` · `mountPendulumSimulator` · L302-L625; `radiasthesie-views.js` · `renderLabor` · L443-L624 | bereit, läuft, pausiert, Grenzwerte verletzt | Länge, Amplitude, Dämpfung und Schwerkraft sind einstellbar; Start/Pause/Reset wirken; ein Wert außerhalb der Grenzen wird abgelehnt und gemeldet | final | must | design_web_layout | `tests/radiasthesie-simulator.mjs` |
| FUN-PEN-004 | Pendeltafel-Studio öffnen | `#pendeln/studio` | `js/modules/pendeltafel-studio.js` · `mountPendeltafelStudio` · L49-L350; `radiasthesie-views.js` · `renderStudio` · L634-L814 | leer, belegt, exportiert | Aufruf öffnet die Tafel innerhalb des Bereichs; Beschriftungen und Farbstil sind einstellbar; ein zweiter Aufruf verwendet die geladene Instanz statt neu zu laden | final | must | design_web_layout | `tests/pendeltafel-studio.mjs` |
| FUN-PEN-005 | Experimentierlabor durchführen | `#pendeln/experiment` | `js/modules/experiment-labor.js` · `mountExperimentLabor` · L56-L793; `experiment-statistik.js` · `analyseRun` · L138-L157 | bereit, Lauf, ausgewertet, verworfen | Ein Lauf erzeugt Treffer und Nicht-Treffer; die Auswertung nennt Trefferquote, Wilson-Intervall und exakten p-Wert; ein abgebrochener Lauf wird nicht gespeichert | final | must | design_web_layout | `tests/experiment-statistik.mjs` |
| FUN-PEN-006 | Pendeltagebuch führen | `#pendeln/journal` | `js/modules/pendel-journal.js` · `mountPendelJournal` · L75-L938; `journal-speicher.js` · `writeEntries` · L228-L256 | leer, gefüllt, Speicherfehler | Einträge werden lokal gespeichert und nach einem Neuladen angezeigt; ein defekter Speicherstand wird gesichert und gemeldet, nicht verworfen | final | must | design_web_layout | `tests/journal-speicher.mjs` |
| FUN-PEN-007 | Glossar durchsuchen | `#pendeln/glossar`, `?b=<Buchstabe>`, `?q=` | `radiasthesie-views.js` · `renderGlossar` · L1276-L1360; `radiasthesie-model.js` · `createModel` · L48-L249 | alle, Buchstabe, Suche | Der Buchstabenfilter zeigt nur Begriffe dieses Buchstabens; die Suche faltet Umlaute; ein leerer Treffer zeigt einen leeren Zustand | final | must | writer | `tests/radiasthesie.mjs` |
| FUN-PEN-008 | Quellen zu einem Befund lesen | `#pendeln/quellen` | `radiasthesie-views.js` · `renderQuellen` · L1362-L1439 | Liste, ausgewählte Quelle | Jede Quelle nennt Herkunft und Abrufstatus; `?quelle=<id>` hebt die zitierenden Themen hervor | final | must | writer | `tests/radiasthesie.mjs` |
| FUN-PEN-009 | Methodik und Grenzen lesen | `#pendeln/methodik` | `radiasthesie-views.js` · `renderMethodik` · L1441-L1558 | statisch | Die Seite trennt Tradition, Hypothese und geprüften Befund und nennt die Grenzen der Aussagen | final | must | writer | `tests/radiasthesie-statisch.mjs` |
| FUN-PEN-010 | Bereich durchsuchen | `#pendeln/suche`, `?q=` | `radiasthesie-views.js` · `renderSuche` · L1560-L1629 | keine Suche, Treffer, keine Treffer | Die Suche findet Themen, Kapitel, Glossar und Quellen; Treffer sind nach Typ gruppiert; ohne Treffer erscheinen Einstiege | final | must | design_web_layout | `tests/radiasthesie.mjs` |
| FUN-PEN-011 | Statische Unterseiten erzeugen | `npm run build` | `scripts/generate-radiasthesie-pages.cjs` · `buildStaticPages` · L351-L498; `js/modules/radiasthesie-seo.js` · `STATIC_DOCS` · L31-L91 | sieben Dokumente | Der Bau erzeugt sieben Dokumente unter `radiasthesie/`; jedes trägt eigenen Titel, Description und Canonical | final | must | structured_output | `tests/radiasthesie-statisch.mjs` |
| FUN-PEN-012 | Bereich erst beim ersten Aufruf laden | `#pendeln…` | `js/modules/radiasthesie-loader.js` · `load` · L12-L21 | nicht geladen, lädt, geladen, Fehler | Der Initialgraph enthält nur den Loader; der erste Aufruf lädt das Modul einmal; ein Ladefehler schreibt eine Bereichsmeldung | final | must | architect | `tests/radiasthesie.spec.js` |

### 2.9 FBW — Farbwelten

Zwölf Farbwelten, drei Themenseiten und fünf Werkzeug- bzw. Registerrouten. Die Daten stammen aus
`content/farbwelten/*.md` (18 Quellen) und werden nach `js/data/farbwelten.js` erzeugt (Kapitel 3).

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-FBW-001 | Farbwelt-Explorer benutzen | `#farbwelten` | `js/modules/farbwelten.js` · `renderLanding` · L570-L592; `bind` · L1672-L1740 | Übersicht, gefiltert | Die Einstiegsseite zeigt das Farbregister, die Einstiege und die Methodik; die Auswahl einer Farbe öffnet deren Seite | final | must | design_web_layout | `tests/farbwelten.mjs` |
| FUN-FBW-002 | Farbseite lesen | `#farbwelten/<farbe>` | `farbwelten.js` · `renderColor` · L594-L670 | Abschnitt, Anker, unbekannte Farbe | Alle zwölf Farbseiten sind erreichbar; Abschnittsanker springen zum Abschnitt; eine unbekannte Farbe rendert die Bereichs-Fehleransicht | final | must | writer | `tests/farbwelten.mjs` |
| FUN-FBW-003 | Themenseite lesen | `#farbwelten/<thema>` | `farbwelten.js` · `renderTopic` · L991-L1025; `farbwelten-model.js` · `resolveView` · L53-L78 | Thema, Anker | Drei Themenseiten sind erreichbar; ihre Anker stammen aus der H2-Reihenfolge der Seite | final | must | writer | `tests/farbwelten.mjs` |
| FUN-FBW-004 | Chakren-Zuordnung ansehen | `#farbwelten/chakren`, `#chakren` | `farbwelten.js` · `renderChakren` · L802-L855 | Übersicht, gewähltes Chakra | Die Seite ordnet den sieben Hauptchakren Farben zu; die Auswahl eines Chakras zeigt dessen Zuordnung | final | must | writer | `tests/farbwelten.mjs` |
| FUN-FBW-005 | Lichtfrequenzen und Spektrum erkunden | `#farbwelten/lichtfrequenzen` | `farbwelten.js` · `renderLight` · L945-L986; `spectrumExplorer` · L863-L943; `farbwelten-model.js` · `wavelengthToRgb` · L134-L166 | Regler bewegt, Wert berechnet | Der Regler über 380–750 nm zeigt Wellenlänge, Frequenz in THz und Photonenenergie in eV; die Werte folgen `frequencyThz` und `photonEnergyEv` | final | must | design_web_layout | `tests/farbwelten.mjs` |
| FUN-FBW-006 | Farben-Kompass vergleichen | `#farbwelten/kompass` | `farbwelten.js` · `renderKompass` · L1166-L1222; `selectCompass` · L1744-L1754 | Farbe gewählt | Eine gewählte Farbwelt zeigt Assoziationen, Tradition, kulturelle Varianten und Forschungsstand nebeneinander; ein Wechsel aktualisiert alle vier Felder | final | should | design_web_layout | `tests/farbwelten.spec.js` |
| FUN-FBW-007 | Farbmeditation durchführen | `#farbwelten/farbmeditation` | `farbwelten.js` · `renderMeditation` · L1233-L1349; `initMeditation` · L1758-L1770; `tickMeditation` · L1804-L1814 | bereit, läuft, pausiert, beendet | Dauer und Farbe sind wählbar; Start/Pause/Stopp wirken; der Timer zeigt die Restzeit; nach dem Ende erscheint ein Abschlusszustand | final | should | design_web_layout | `tests/farbwelten.spec.js` |
| FUN-FBW-008 | Zeitleiste filtern | `#farbwelten/zeitleiste` | `farbwelten.js` · `renderTimeline` · L1365-L1446; `filterTimeline` · L1890-L1904 | alle, ein Themenstrang | Die Filterknöpfe tragen `aria-pressed`; die Auswahl eines Strangs zeigt nur dessen Stationen; „Alle“ stellt den Vollbestand her | final | should | design_web_layout | `tests/farbwelten.spec.js` |
| FUN-FBW-009 | Breadcrumb als strukturierte Daten ausgeben | Aufruf einer Farbwelt-Route | `farbwelten.js` · `placeStructuredData` · L1581-L1631 | Skript eingefügt | Genau ein `application/ld+json`-Block vom Typ `BreadcrumbList` steht im Bereich; die Positionen sind fortlaufend | final | should | architect | `cmd: grep -n "BreadcrumbList" js/modules/farbwelten.js` |
| FUN-FBW-010 | Bereich erst beim ersten Aufruf laden | `#farbwelten…` | `js/modules/farbwelten-loader.js` · `load` · L11-L20 | nicht geladen, lädt, geladen, Fehler | Der Initialgraph enthält nur den Loader; der erste Aufruf lädt das Modul einmal; ein Ladefehler schreibt eine Bereichsmeldung | final | must | architect | `tests/farbwelten.spec.js` |

### 2.10 BLG — Wissen und Artikel

Zehn kuratierte Artikel liegen gerendert in `js/data/articles.js`; zwölf weitere entstehen über
`npm run data:articles` aus `data/articles/article-01…12.md` und stehen als
`js/data/articles-markdown.js` bereit. Beide Bestände werden im Blog zu 22 Artikeln zusammengeführt
(Routen `#blog/1`–`#blog/22`); die Katalogführung der zwölf Markdown-Artikel ist `CNT-ART-011…022`.

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-BLG-001 | Artikelliste ansehen | `#blog` | `js/modules/blog.js` · `renderCards` · L34-L70 | gefüllt, leer | Die Liste zeigt alle 22 Artikel (zehn kuratiert, zwölf aus Markdown) mit Titel, Kategorie, Datum und Lesezeit, sortiert nach Datum absteigend; ohne Artikel erscheint ein leerer Zustand | final | must | writer | `tests/blog-articles.spec.js` |
| FUN-BLG-002 | Nach Kategorie filtern | `#categoryFilter` | `blog.js` · `filterArticles` · L131-L145; `setupEventListeners` · L123-L129 | alle, eine Kategorie | Die Auswahl einer Kategorie zeigt nur deren Artikel und aktualisiert die Statuszeile; die sieben Filterwerte (`tarot`, `crystals`, `runes`, `moon`, `astrologie`, `rituals`, `history`) liefern je mindestens einen Treffer | final | must | design_web_layout | `tests/blog-articles.spec.js` |
| FUN-BLG-003 | Artikel durchsuchen | `#articleSearch` | `blog.js` · `filterArticles` · L131-L145 | Treffer, keine Treffer | Die Eingabe filtert nach 300 ms Entprellung über Titel und Tags; „keine Treffer“ wird als Text ausgegeben, nicht als leere Fläche | final | must | design_web_layout | `tests/blog-articles.spec.js` |
| FUN-BLG-004 | Artikel lesen | Klick auf eine Artikelkarte, `#blog/<id>` | `blog.js` · `openArticleModal` · L96-L121; `findArticle` · L92-L94; `js/article-content.js` · `renderArticleContent` · L16-L63 | offen, Markdown gerendert | Der Dialog rendert Überschriften, Listen und Absätze aus Markdown; die Adresse wird zu `#blog/<id>`; Schließen stellt die Liste wieder her und gibt den Fokus an die Karte zurück | final | must | writer | `tests/blog-articles.spec.js` |
| FUN-BLG-005 | Ergebnisstand anzeigen | nach Filter, Suche oder Erstaufbau | `blog.js` · `syncArticleStatus` · L74-L90; `updateGrid` · L147-L157 | Statuszeile gefüllt | `#articleListStatus` nennt die sichtbare Anzahl („Alle 22 Artikel werden angezeigt.“ bzw. „N von 22 Artikeln werden angezeigt.“); der Knopf `#loadMoreArticles` bleibt verborgen und deaktiviert, weil alle Artikel sofort gerendert werden | final | should | design_web_layout | `tests/blog-articles.spec.js` |
| FUN-BLG-006 | Ergebnisstand aktualisieren | nach Filter oder Suche | `blog.js` · `updateGrid` · L147-L157 | Statuszeile gefüllt | `#articleListStatus` nennt die sichtbare Anzahl; die Zeile ist `aria-live="polite"` und wird bei jeder Änderung aktualisiert | final | should | design_web_layout | `cmd: grep -n "articleListStatus" index.html` |

## 3. Datenquellen und Generatoren

Drei Datenmodule werden aus Redaktionsquellen erzeugt; die Erzeuger sind idempotent und werden in
Tests bytegenau geprüft. `produced_by` folgt §5.6.

| Artefakt | Erzeuger (Befehl) | Eingang | Prüfung | Stand |
| --- | --- | --- | --- | --- |
| `js/data/farbwelten.js` | `npm run data:farbwelten` (`scripts/generate-farbwelten-data.cjs`) | `content/farbwelten/*.md` (18 Dateien) | `tests/farbwelten.mjs`, `npm run verify:sync` | erzeugt |
| `js/data/astrologie.js` | `npm run data:astrologie` (`scripts/generate-astrologie-data.cjs`) | `docs/astrologie-konzept/content/*.json` | `tests/astrologie.mjs` (Bytevergleich gegen Neuerzeugung) | erzeugt |
| `js/data/radiasthesie.js` | `npm run data:radiasthesie` (`scripts/generate-radiasthesie-data.cjs`) | `docs/radiasthesie-konzept/inhalte/*.md`, `…/recherche/quellen.json`, `…/daten/taxonomie.json` | `tests/radiasthesie.mjs` | erzeugt |
| `radiasthesie/*.html` (7 Dokumente) | `node scripts/generate-radiasthesie-pages.cjs` (aus `npm run build`) | `js/data/radiasthesie.js`, `js/modules/radiasthesie-seo.js` | `tests/radiasthesie-statisch.mjs` | erzeugt |
| `dist/Esoterik-Welt/**` | `npm run build` (`scripts/build-pages.cjs`) | Repository-Wurzel, ohne `*.bak*` und `_*` | `tests/pages-regression.cjs` | erzeugt |
| `Lokal.html`, `Lokal-*.html` | `npm run build:local` (`scripts/build-local.cjs`) | `index.html`, Module, `data/crystals.json`, CSS, Schriften | `tests/offline-file.cjs` | erzeugt |
| `js/data/tarot.js` | `node scripts/generate-tarot-data.cjs` | `docs/tarot-deck-nachtatelier/…` — **fehlt im Release** | `--check` schlägt fehl (B-01) | blockiert |
| `data/crystals.json` | von Hand gepflegt; `node scripts/sync-crystal-attribution.cjs` schreibt nur die Attributionsfelder | `assets/crystals/manifest.json` | `tests/crystals-attribution.cjs` | gepflegt |
| `js/data/articles-markdown.js` | `npm run data:articles` (`scripts/generate-articles-data.cjs`) | `data/articles/article-01…12.md` | `npm run verify:articles`, `tests/generate-articles-data.test.js` | erzeugt |

Weitere Datenbestände ohne Erzeuger: `js/data/articles.js` (10 kuratierte gerenderte Artikel),
`js/data/tarot-decks.js` (Deck-Registry), `js/data/chakren.js`, `js/data/moon.js`, `js/data/runes.js`,
`js/data/radiasthesie-werkstatt.js`.

## 4. Externe Dienste und Requests

Es gibt **keine Drittanbieter zur Laufzeit**: keine Analyse, keine Werbung, keine externen Schriften,
keine Karten, keine CDNs, keine Cookies (`document.cookie` kommt im Quellcode nicht vor).

| Request | Ziel | Art | Quelle | Verhalten |
| --- | --- | --- | --- | --- |
| Kristalldaten | `./data/crystals.json` | gleiche Origin, `fetch` | `js/modules/crystals.js` · `loadData` · L28-L40 | Im HTTP-Betrieb geladen; im Offline-Build aus `#local-crystals-data` gelesen, ohne Netz |
| Frequenzquellen | `docs/frequenz-quellen.md` | gleiche Origin, `fetch` | `js/modules/frequenzlabor.js` · `readQuellen` · L604-L616 | Im HTTP-Betrieb geladen; im Offline-Build als eingebetteter Text |
| Bereichsmodule | dynamische Importe der Loader | gleiche Origin, ES-Modul | `frequenzlabor-loader.js` L11-L20, `radiasthesie-loader.js` L12-L21, `farbwelten-loader.js` L11-L20 | Erst beim ersten Aufruf; genau einmal je Sitzung |
| Suchmaschinen-Abruf | keine | — | — | Es werden keine Daten an Dritte übertragen |

Ausgehende Verweise (keine Requests, nur Links): `nasa.gov`, `openstax.org`, `iso.org`, `github.com`,
`creativecommons.org`, `ingbms.github.io`. Lighthouse CI lädt Berichte zu
`temporary-public-storage` hoch (`.lighthouserc.json` L20) — das ist ein CI-Schritt, kein
Laufzeitdienst der Website.

## 5. Speicher und Browserfunktionen

Acht benannte Schlüssel und ein Sicherungsmuster. Alles liegt in `localStorage`; es gibt keinen
Server, kein Konto und keine Synchronisierung.

| Schlüssel | Inhalt | Grenze | Quelle |
| --- | --- | --- | --- |
| `esoterik_tarot_deck` | gewähltes Tarot-Deck | ein Wert | `js/data/tarot-decks.js` · L74, L87 |
| `esoterik_tarot_history` | letzte Ziehungen | 50 Einträge (`slice(0, 50)`) | `js/modules/tarot.js` · L631-L637 |
| `esoterik_runes_history` | Runenwürfe mit Notizen | keine harte Grenze | `js/modules/runes.js` · L147-L159 |
| `esot_crystals_fav` | Favoriten-IDs | keine harte Grenze | `js/modules/crystals.js` · L132-L147 |
| `esoterik-welt:frequenzlabor:v1` | Frequenz, Wellenform, Pegel, Preset | ein Objekt | `js/modules/frequenz-presets.js` · L223-L288 |
| `esoterik-welt:frequenzlabor:meditation:v1` | letzte Meditationssitzung | ein Objekt | `js/modules/frequenz-meditation-model.js` · L226-L274 |
| `esot_rad_journal_v1` | Pendeltagebuch | Schema 1, Löschtimer | `js/modules/journal-speicher.js` · L22, L151-L245 |
| `esot_rad_experiment_v1` | Experimentläufe | `MAX_ANSWERS = 2000` | `js/modules/experiment-speicher.js` · L14-L16 |
| `esot_rad_corrupt_<KEY>_<stamp>` | Sicherung eines unlesbaren Speicherstands | ein Eintrag je Vorfall | `experiment-speicher.js` L113, `journal-speicher.js` L201 |

Browserfunktionen ohne Speicher: Vollbild-agnostische Dialoge (`js/dialog.js`), `prefers-reduced-motion`
in Ziehungen und Visualisierung, `history.pushState`/`replaceState` für Routen, `inert` für den
Dialoghintergrund. **Löschfunktion:** `deleteAllStoredData` (`journal-speicher.js` · L466-L491) entfernt
alle Schlüssel mit Präfix `esot_rad_`; sie ist die Datenschutz-Zusage des Bereichs.

## 6. SEO und Metadaten

| Artefakt | Quelle | Umfang | Prüfung |
| --- | --- | --- | --- |
| Titel und Description je Route | `js/main.js` · `PAGE_META` · L83-L136 | elf Einträge (zehn Seiten plus `frequenzenQuellen`) | `applyRouteMeta` · L144-L161 setzt `title`, `description`, `og:*`, `twitter:*` und Canonical |
| Canonical des Einzeldokuments | `js/main.js` · `SITE_CANONICAL` · L82 | `https://ingbms.github.io/Esoterik-Welt/` | `cmd: grep -n "SITE_CANONICAL" js/main.js` |
| Open Graph und Twitter im Dokument | `index.html` | 5 `og:`- und 3 `twitter:`-Angaben, `rel="canonical"` L18 | `cmd: grep -c "property=\"og:" index.html` |
| Sitemap | `sitemap.xml` | 11 URLs: 4 Wurzel-Dokumente und 7 Radiästhesie-Dokumente | `cmd: grep -c "<loc>" sitemap.xml` |
| robots.txt | `robots.txt` | `User-agent: *` | `cmd: head -1 robots.txt` |
| Statische Dokumente des Pendelbereichs | `js/modules/radiasthesie-seo.js` · `STATIC_DOCS` · L37-L100 | 7 Dokumente mit eigenem Titel, Description und Canonical | `tests/radiasthesie-statisch.mjs` |
| Titel- und Description-Grenzen | `radiasthesie-seo.js` · L22-L24 | Titel ≤ 60 Zeichen, Description 100–160 Zeichen | `tests/radiasthesie-statisch.mjs` |
| Strukturierte Daten | `radiasthesie.js` · `placeStructuredData` · L228-L249; `farbwelten.js` · L1581-L1631 | `BreadcrumbList` je Bereichsroute, zur Laufzeit eingefügt | `cmd: grep -n "ld+json" js/modules/*.js` |
| Fehlerseite | `404.html` | eigenständige Seite ohne OG-Angaben | `cmd: ls -l 404.html` |
| Budgets | `.lighthouserc.json` L8-L18 | Performance ≥ 0.9, Accessibility ≥ 0.95, SEO ≥ 0.9 | CI, nicht Teil dieses Katalogs |

Hash-Routen sind Ansichten **eines** Dokuments und bekommen bewusst weder Canonical noch
Sitemap-Eintrag; das ist in `radiasthesie-seo.js` L7-L11 begründet und gilt für alle Bereiche.

## 7. Befunde

Widersprüche werden festgehalten, nicht geglättet. Jeder Befund nennt Datei, Nachweis und Wirkung.

### B-01 Tarot-Datenquelle fehlt im Release — Generatorprüfung schlägt fehl

* **Datei/Quelle:** `scripts/generate-tarot-data.cjs` L12 liest
  `docs/tarot-deck-nachtatelier/manifest-assets.json`.
* **Nachweis:** `node scripts/generate-tarot-data.cjs --check` endet mit Exit 1 und
  `ENOENT: no such file or directory, open '…/docs/tarot-deck-nachtatelier/manifest-assets.json'`.
  Das Verzeichnis `docs/tarot-deck-nachtatelier` existiert im Release-Stand nicht.
* **Wirkung:** `js/data/tarot.js` ist ausgeliefert und funktionsfähig, kann aber nicht mehr erzeugt
  oder geprüft werden. Die Prüfung ist kein Release-Gate, solange sie nicht in `test:all` steht —
  sie steht dort nicht.
* **Bewertung:** `should`; blockiert die Rubrik nicht, verhindert aber jede kontrollierte
  Neuerzeugung der Tarot-Daten.

### B-02 Zwei Steinbestände — `js/data/crystals.js` wird nicht gelesen

* **Dateien:** `js/data/crystals.js` (36 Steine, Kopfkommentar „30+ Steine“) und
  `data/crystals.json` (30 Steine).
* **Nachweis:** `js/modules/crystals.js` · `loadData` · L28-L40 liest
  `fetch('./data/crystals.json')` beziehungsweise den eingebetteten Block `#local-crystals-data`.
  `js/data/crystals.js` wird von keinem Modul, keinem Test und keinem Skript importiert.
* **Wirkung:** Zwei Bestände driften auseinander. Eine Pflege in `js/data/crystals.js` hat keine
  sichtbare Wirkung; sechs Steine existieren nur dort.
* **Bewertung:** `must` für die Migration: eine Quelle festlegen und die andere entfernen.

### B-03 Sitemap und README widersprechen sich

* **Dateien:** `sitemap.xml`, `README.md` L128 („sitemap.xml (6 Routen + 10 Artikel)“) und
  `README.md` L22 (zwölf Hash-Routen).
* **Nachweis:** `sitemap.xml` enthält 11 URLs (4 Wurzel-Dokumente, 7 Radiästhesie-Dokumente) und
  **keine** Artikel-URL. Die im README genannten Hash-Routen können dort nicht stehen, weil sie
  Ansichten eines Dokuments sind.
* **Wirkung:** Die Dokumentation nennt eine andere Menge als die ausgelieferte Sitemap. Wer die
  Sitemap als Vollständigkeitsnachweis liest, überschätzt die indexierten Seiten.
* **Bewertung:** `should`; die Aussage ist falsch, die Sitemap selbst ist technisch korrekt.

### B-04 Altlasten im Repository, aber nicht im Build

* **Dateien:** `js/main.js.bak`, `js/modules/_tarot_old.js`, `js/modules/runes.js.bak2`,
  `js/modules/tarot.js.bak`.
* **Nachweis:** `scripts/build-pages.cjs` L40 filtert `*.bak*` und `_*` aus dem Abbild. Die Dateien
  liegen aber im Repository; der Kommentar in `build-pages.cjs` L1 sagt, GitHub Pages veröffentlicht
  die Repository-Wurzel.
* **Wirkung:** Im `dist/`-Abbild fehlen sie; ob sie auf der Live-Domain abrufbar sind, hängt an der
  Pages-Konfiguration und wurde in dieser Karte **nicht** geprüft.
* **Bewertung:** `should` (Release-Gate, kein Funktionsfehler).

### B-05 Kommentar verspricht eine Tafelspeicherung, die es nicht gibt

* **Datei:** `js/modules/journal-speicher.js` L458-L462: „Löscht alle Schlüssel mit Präfix
  `esot_rad_` — Tagebuch, Experimentläufe, Tafelkonfiguration und Sicherungskopien.“
* **Nachweis:** `js/modules/pendeltafel-studio.js` enthält keinen Speicherzugriff; es gibt keinen
  Schlüssel für eine Tafelkonfiguration. `grep -rhoE "esot_rad_[a-z0-9_]+" js/` liefert nur
  `esot_rad_corrupt_`, `esot_rad_experiment_v1` und `esot_rad_journal_v1`.
* **Wirkung:** Die Löschfunktion ist vollständig für das, was existiert; der Kommentar nennt einen
  vierten Bestand, den niemand anlegt.
* **Bewertung:** `none` (Dokumentationsfehler), aber irreführend für Datenschutzaussagen.

### B-06 Zwei Typquellen für denselben Datenlayer

* **Dateien:** `js/types.js` (JSDoc-Typedefs) und `js/types.ts` (TypeScript-Interfaces).
* **Nachweis:** Beide liegen unter `js/` und werden als Teil des `js`-Verzeichnisses ausgeliefert;
  `js/types.ts` wird von keinem Build-Schritt kompiliert.
* **Wirkung:** Zwei Beschreibungen desselben Vertrags können auseinanderlaufen; die `.ts`-Datei ist
  öffentlich abrufbar, obwohl sie im Browser keine Rolle spielt.
* **Bewertung:** `should`.

### B-07 Zwölf Markdown-Artikel sind abrufbar, aber unerreichbar

* **Dateien:** `data/articles/*.md` (12 Dateien) gegenüber `js/data/articles.js` (10 gerenderte
  Artikel).
* **Nachweis:** Keine Ansicht verlinkt die Markdown-Dateien; die Artikelliste liest ausschließlich
  `js/data/articles.js` (`blog.js` · `renderCards` · L25-L61).
* **Wirkung:** Zwei Artikelbestände; der größere ist über die Oberfläche nicht erreichbar.
  Dieselbe Abgrenzung hat der Inhalts-Katalog in §7.5 getroffen.
* **Bewertung:** `should` (Inhaltsentscheidung, nicht Funktionsfehler).

## 8. Nicht erfasst (Abgrenzung nach §9.2)

Nicht aufgenommen, weil ohne eigenes Bedienelement und ohne eigene Route:

| Bestand | Grund |
| --- | --- |
| `js/modules/astrologie-format.js`, `astrologie-model.js` | reine Formatierung und Modellbildung; Wirkung erscheint in den AST-Zeilen |
| `js/modules/markdown-lite.js` | Renderer für Artikel- und Quellentext; Wirkung in FUN-BLG-004 und FUN-FRQ-011 |
| `js/modules/experiment-statistik.js`, `experiment-zufall.js` | Rechenkern des Experimentlabors; Wirkung in FUN-PEN-005 |
| `js/modules/radiasthesie-vertraege.js` | Datenvertrag und Validierung; keine eigene Ansicht |
| `js/modules/frequenz-engine.js` | Audio-Kern; Wirkung in FUN-FRQ-002 bis FUN-FRQ-006 |
| `js/modules/frequenz-chladni.js` (Rechenkern) | Wirkung in FUN-FRQ-008; das Feld selbst ist dort erfasst |
| `js/main.js.bak`, `js/modules/_tarot_old.js`, `js/modules/runes.js.bak2`, `js/modules/tarot.js.bak` | Altdateien, nicht ausgeliefert (B-04) |
| `public/` (17 Dateien) | wird von `build-pages.cjs` nicht kopiert; im Schema als `excluded` geführt |
| `404.html`, `impressum.html`, `datenschutz.html`, `haftung.html` | statische Rechts- und Fehlerseiten ohne Interaktion; im Inhalts-Katalog erfasst |

## 9. Prüfverfahren

### 9.1 Reproduktion der Messung

```bash
node scripts/migration-baseline/measure-functions.cjs          # schreibt evidence/functions/functions-baseline.json
node scripts/migration-baseline/measure-functions.cjs --check  # vergleicht, Commit-Hash ausgenommen
node scripts/migration-baseline/check-decl-ranges.cjs          # 676 Deklarationen: Start nennt den Namen, Ende schließt den Block
node scripts/migration-baseline/verify-function-catalog.cjs    # prüft diesen Katalog gegen den Code
node scripts/migration-baseline/verify-function-catalog-negatives.cjs  # 7 mutierte Kopien müssen abgelehnt werden
node scripts/migration-baseline/render-module-index.cjs --check        # Anhang gegen die Messung prüfen
```

Erwartete Ausgabe von `measure-functions.cjs`: 43 Moduldateien, 19.933 Zeilen, 17 Klassen,
372 exportierte Funktionen, 8 Speicherschlüssel, 1 Sicherungsmuster, 2 externe Request-Stellen,
43 Testdateien. `check-decl-ranges.cjs` meldet `OK: alle Zeilenbereiche enden auf einer schließenden
Klammerzeile.`

### 9.2 Prüfung dieses Dokuments

`verify-function-catalog.cjs` prüft maschinell: alle zehn Bereichstabellen vorhanden, Spaltenkopf
exakt in §9.1-Reihenfolge, IDs eindeutig und dem Bereich zugeordnet, `Status`/`Release`/`Owner` aus
den zulässigen Werten, jede zitierte Datei existiert, jeder Zeilenbereich liegt innerhalb der Datei,
jede `Quelle`-Angabe bezeichnet eine dort vorhandene Deklaration, und jeder `Nachweis` verweist auf
eine existierende Testdatei oder beginnt mit `cmd:`.

### 9.3 Testabdeckung

Der Katalog enthält 96 Funktionen. 68 davon sind über eine der 44 Testdateien abgedeckt; 28 haben
keinen verhaltensprüfenden Test und sind deshalb nur mit `cmd:`-Nachweis belegt: FUN-GLO-002,
FUN-GLO-006, FUN-GLO-009, FUN-GLO-010, FUN-TAR-002, FUN-TAR-003, FUN-TAR-004, FUN-TAR-007,
FUN-TAR-008, FUN-KRY-001, FUN-KRY-002, FUN-KRY-003, FUN-KRY-005, FUN-KRY-006, FUN-MON-002,
FUN-MON-006, FUN-MON-007, FUN-MON-008, FUN-AST-013, FUN-RUN-001 bis FUN-RUN-007, FUN-FBW-009,
FUN-BLG-006. Diese Lücke ist selbst ein Befund: die Zeilen
belegen die Verdrahtung, nicht das Verhalten. Ein späterer Regressionstest je Bereich sollte
mindestens eine Ziehung (TAR), einen Filter (KRY), einen Monatswechsel (MON), einen Wurf (RUN) und
den Artikel-Dialog (BLG) abdecken.

## 10. Offene Fragen

| Nr. | Frage | Betroffen | Vorschlag |
| --- | --- | --- | --- |
| F-01 | Welcher Steinbestand ist maßgeblich: 36 in `js/data/crystals.js` oder 30 in `data/crystals.json`? | B-02, KRY | `data/crystals.json` behalten (wird gerendert), die JS-Datei nach Migration entfernen |
| F-02 | Soll `scripts/generate-tarot-data.cjs --check` in `test:all` aufgenommen werden? | B-01 | Erst nach Wiederherstellung der Quelle; vorher würde die Suite dauerhaft rot |
| F-03 | Wird die Live-Domain aus der Repository-Wurzel oder aus `dist/` veröffentlicht? | B-04 | Eigentümerentscheidung; davon hängt ab, ob `.bak`-Dateien öffentlich sind |
| F-04 | Werden die zwölf Markdown-Artikel künftig verlinkt oder entfernt? | B-07 | Inhalts-Katalog §7.5 entscheiden lassen, nicht diesen Katalog |
| F-05 | Bleiben `js/types.js` und `js/types.ts` parallel bestehen? | B-06 | Eine Quelle wählen; die andere nach Migration entfernen |
| F-06 | Sollen die vier `cmd:`-only-Bereiche (RUN, BLG, KRY, TAR) je einen Browser-Test erhalten? | §9.3 | Ja; je Bereich ein Spec, der die Kernfunktion einmal ausführt |

## 11. Anhang: Modulübersicht

Eine Zeile je ausgelieferter Moduldatei, erzeugt aus derselben Messung wie der Katalog
(`scripts/migration-baseline/render-module-index.cjs --write`). Die Spalte „Importiert“ nennt die
Dateinamen der Modulabhängigkeiten; das erwartete Verhalten steht in den Funktionstabellen des
Kapitels 2, die das Modul zitieren. `--check` verhindert, dass diese Tabelle von der Messung abweicht.

<!-- MODULE-INDEX:START -->
| Modul | Zeilen | Einstiegspunkt (Klasse oder erste Deklaration) | Importiert | Nachweis |
| --- | --- | --- | --- | --- |
| `js/modules/astrologie-format.js` | 157 | kennzeichnung() (L54) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/astrologie-model.js` | 286 | normalize() (L97) | astrologie-format.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/astrologie-views-reference.js` | 615 | renderGrundlagenIndex() (L26) | astrologie-format.js, astrologie-model.js, astrologie-views.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/astrologie-views.js` | 767 | pageShell() (L30) | astrologie-format.js, astrologie-model.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/astrologie.js` | 311 | class AstrologieModule (L53) | astrologie-format.js, astrologie-model.js, astrologie-views-reference.js, astrologie-views.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/blog.js` | 152 | class BlogModule (L3) | article-content.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/crystals.js` | 556 | class CrystalsModule (L2) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/experiment-labor.js` | 794 | mountExperimentLabor() (L56) | experiment-speicher.js, experiment-statistik.js, experiment-zufall.js, radiasthesie-vertraege.js, radiasthesie-werkstatt.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/experiment-speicher.js` | 177 | getLocalStorage() (L19) | keine | tests/experiment-statistik.mjs |
| `js/modules/experiment-statistik.js` | 350 | binomialPmf() (L52) | keine | tests/experiment-statistik.mjs |
| `js/modules/experiment-zufall.js` | 67 | createCryptoRng() (L19) | keine | tests/experiment-statistik.mjs |
| `js/modules/farbwelten-loader.js` | 38 | class FarbweltenLoader (L4) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/farbwelten-model.js` | 187 | resolveView() (L53) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/farbwelten.js` | 1936 | class FarbweltenModule (L1461) | chakren.js, farbwelten-model.js, farbwelten.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenz-chladni.js` | 201 | isValidMode() (L30) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenz-cymatics-view.js` | 280 | class CymaticsView (L51) | frequenz-chladni.js, frequenz-nav.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenz-engine.js` | 1085 | class FrequencyEngineImpl (L104) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenz-flags.js` | 52 | resolveFeatures() (L25) | keine | tests/frequenz-presets.mjs |
| `js/modules/frequenz-meditation-model.js` | 283 | findPreset() (L83) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenz-meditation-view.js` | 641 | class MeditationView (L53) | frequenz-engine.js, frequenz-meditation-model.js, frequenz-nav.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenz-nav.js` | 30 | renderViewNav() (L21) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenz-presets.js` | 289 | safeSourceUrl() (L66) | keine | tests/frequenz-presets.mjs |
| `js/modules/frequenz-visualisierung.js` | 180 | class FrequenzVisualisierung (L9) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenzlabor-loader.js` | 38 | class FrequenzlaborLoader (L4) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/frequenzlabor.js` | 1243 | class FrequenzlaborModule (L144) | frequenz-engine.js, frequenz-flags.js, frequenz-nav.js, frequenz-presets.js, frequenz-visualisierung.js, markdown-lite.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/journal-speicher.js` | 492 | confidenceLabel() (L38) | radiasthesie-vertraege.js | tests/journal-speicher.mjs |
| `js/modules/markdown-lite.js` | 274 | escapeHtml() (L21) | keine | tests/markdown-lite.mjs |
| `js/modules/moon.js` | 704 | class MoonModule (L141) | moon.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/pendel-journal.js` | 939 | mountPendelJournal() (L75) | experiment-speicher.js, experiment-statistik.js, journal-speicher.js, radiasthesie-vertraege.js, radiasthesie-werkstatt.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/pendel-simulator.js` | 626 | validateLength() (L71) | keine | tests/radiasthesie-simulator.mjs |
| `js/modules/pendeltafel-model.js` | 591 | escapeXml() (L176) | keine | tests/pendeltafel-studio.mjs |
| `js/modules/pendeltafel-studio.js` | 351 | mountPendeltafelStudio() (L49) | pendeltafel-model.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/radiasthesie-format.js` | 208 | levelChip() (L55) | keine | tests/experiment-statistik.mjs, tests/journal-speicher.mjs, tests/pendeltafel-studio.mjs |
| `js/modules/radiasthesie-loader.js` | 43 | class RadiasthesieLoader (L5) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/radiasthesie-model.js` | 250 | normalize() (L24) | keine | tests/experiment-statistik.mjs, tests/journal-speicher.mjs, tests/pendeltafel-studio.mjs, tests/radiasthesie-simulator.mjs |
| `js/modules/radiasthesie-seo.js` | 178 | absoluteUrl() (L103) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/radiasthesie-vertraege.js` | 1202 | isSlug() (L105) | keine | tests/experiment-statistik.mjs, tests/journal-speicher.mjs |
| `js/modules/radiasthesie-views.js` | 1666 | renderLanding() (L213) | experiment-statistik.js, journal-speicher.js, pendeltafel-model.js, radiasthesie-format.js, radiasthesie-vertraege.js, radiasthesie-werkstatt.js | tests/experiment-statistik.mjs, tests/journal-speicher.mjs, tests/pendeltafel-studio.mjs, tests/radiasthesie-simulator.mjs |
| `js/modules/radiasthesie.js` | 345 | class RadiasthesieModule (L49) | experiment-labor.js, pendel-journal.js, pendel-simulator.js, pendeltafel-studio.js, radiasthesie-format.js, radiasthesie-model.js, radiasthesie-seo.js, radiasthesie-views.js | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/runes.js` | 200 | class RunesModule (L2) | keine | `cmd:`-Nachweis in Kapitel 2 |
| `js/modules/tarot.js` | 752 | class TarotModule (L56) | tarot-decks.js, tarot.js | `cmd:`-Nachweis in Kapitel 2 |
<!-- MODULE-INDEX:END -->

