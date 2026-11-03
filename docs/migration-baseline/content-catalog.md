# ESOW Inhalts-Katalog

> Erzeugt von `scripts/migration-baseline/render-catalogs.cjs` aus `content-catalog.json`. Nicht von Hand bearbeiten — Aenderungen gehoeren in die JSON-Quelle.
> Stand: 2026-11-03 · Basis-Commit: 9f584397f8cc86a261fccdfc36dfbb8999f55ea7 · Struktur: docs/migration-baseline/00-schema-und-scope.md (Version 1.0.0)

## Kennzahlen

| Merkmal | Werte |
| --- | --- |
| Eintraege | 54 |
| Aussagen (Claims) | 6 |
| Status | entwurf 2 · final 40 · offen 12 |
| Release-Relevanz | must 41 · none 12 · should 1 |
| Auslieferung | shipped 41 · source-only 13 |
| Typen | article 22 · glossary 2 · legal 3 · page 10 · subroute 15 · ui-string 2 |
| Sprache | de 54 |

## Seiten und Bereiche (25)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-PAG-001 | Startseite (#home) | #home | index.html · `#home` · L110 | index.html#home | 2026-11-03 | final | must | writer | Wurzel-URL zeigt #home als aktive Seite; Titel/Description entsprechen PAGE_META.home in js/main.js. |
| CNT-PAG-003 | Tarot (#tarot) | #tarot | index.html · `#tarot` | index.html#tarot | 2026-11-03 | final | must | writer | Route zeigt Tarot-Inhalt; 78 Kartenobjekte in Datenquellen verifizierbar. |
| CNT-PAG-004 | Kristalle und Steine (#crystals) | #crystals | index.html · `#crystals` | index.html#crystals | 2026-11-03 | final | must | writer | Seite rendert 30 Karten aus data/crystals.json; keine Karte fehlt gegenueber der Datenquelle und der Filter reduziert ohne Datenverlust. |
| CNT-PAG-005 | Mond und Mondzyklen (#moon) | #moon | index.html · `#moon` | index.html#moon | 2026-11-03 | final | must | writer | Mondmodul zeigt aktuelle Phase mit Beleuchtungsgrad, Kalender und iCal-Export; Monatswechsel rendert ohne Konsolenfehler. |
| CNT-PAG-006 | Astrologie (#astrologie) | #astrologie | index.html · `#astrologie` | index.html#astrologie | 2026-11-03 | final | must | writer | Bereich laedt zwoelf Zeichen, zehn Faktoren, zwoelf Haeuser und fuenf Hauptaspekte; Suche liefert Treffer ohne Geburtsdaten. |
| CNT-PAG-007 | Frequenzen (#frequenzen) | #frequenzen | index.html · `#frequenzen` | index.html#frequenzen | 2026-11-03 | final | must | writer | Bibliothek listet Eintraege mit Evidenzstatus; Labor laedt Tongenerator und Oszillogramm ohne externen Dienst. |
| CNT-PAG-008 | Runen (#runes) | #runes | index.html · `#runes` | index.html#runes | 2026-11-03 | final | must | writer | 24 Runen des aelteren Futhark sind waehlbar; 3-Runen-Wurf erzeugt eine Deutung, Historie bleibt lokal. |
| CNT-PAG-009 | Pendeln / Radiästhesie (#pendeln) | #pendeln | index.html · `#pendeln` | index.html#pendeln | 2026-11-03 | final | must | writer | Bereich laedt Werkzeuge, Methodik und Orakel; das Radiästhesie-Glossar ist von hier aus verlinkt. |
| CNT-PAG-010 | Farbwelten (#farbwelten) | #farbwelten | index.html · `#farbwelten` | index.html#farbwelten | 2026-11-03 | final | must | writer | Register zeigt zwoelf Farbwelten inklusive Indigo und drei Themenseiten; jede Farbe oeffnet ihre eigene Route. |
| CNT-PAG-011 | Blog / Artikel (#blog) | #blog | index.html · `#blog` | index.html#blog | 2026-11-03 | final | must | writer | Artikelliste zeigt zehn gerenderte Artikel; #blog/6 oeffnet den sechsten Artikel im Dialog. |
| CNT-SUB-101 | Farbwelt Rot (#farbwelten/rot) | #farbwelten/rot | content/farbwelten/rot.md · `h1` · L10 | content/farbwelten/rot.md#L10 | 2026-11-03 | final | must | writer | #farbwelten/rot zeigt H1 Rot und Lede; Seite nennt 620-750 nm und 400-484 THz. |
| CNT-SUB-102 | Farbwelt Tuerkis (#farbwelten/tuerkis) | #farbwelten/tuerkis | content/farbwelten/tuerkis.md · `h1` | content/farbwelten/tuerkis.md#L10 | 2026-11-03 | final | must | writer | Route #farbwelten/tuerkis zeigt H1 Tuerkis und die Lede aus content/farbwelten/tuerkis.md. |
| CNT-SUB-103 | Farbwelt Magenta (#farbwelten/magenta) | #farbwelten/magenta | content/farbwelten/magenta.md · `h1` | content/farbwelten/magenta.md#L10 | 2026-11-03 | final | must | writer | Route #farbwelten/magenta zeigt H1 Magenta und die Lede aus content/farbwelten/magenta.md. |
| CNT-SUB-104 | Farbwelt Rose (#farbwelten/rosa) | #farbwelten/rosa | content/farbwelten/rosa.md · `h1` | content/farbwelten/rosa.md#L10 | 2026-11-03 | final | must | writer | Route #farbwelten/rosa zeigt H1 Rosa und die Lede aus content/farbwelten/rosa.md. |
| CNT-SUB-105 | Farbwelt Weiss (#farbwelten/weiss) | #farbwelten/weiss | content/farbwelten/weiss.md · `h1` | content/farbwelten/weiss.md#L10 | 2026-11-03 | final | must | writer | Route #farbwelten/weiss zeigt H1 Weiss und die Lede aus content/farbwelten/weiss.md. |
| CNT-SUB-106 | Farbwelt Schwarz (#farbwelten/schwarz) | #farbwelten/schwarz | content/farbwelten/schwarz.md · `h1` | content/farbwelten/schwarz.md#L10 | 2026-11-03 | final | must | writer | Route #farbwelten/schwarz zeigt H1 Schwarz und die Lede aus content/farbwelten/schwarz.md. |
| CNT-SUB-107 | Farbwelt Blau (#farbwelten/blau) | #farbwelten/blau | content/farbwelten/blau.md · `h1` | content/farbwelten/blau.md#L9 | 2026-11-03 | final | must | writer | Route #farbwelten/blau zeigt H1 Blau und die Lede aus content/farbwelten/blau.md. |
| CNT-SUB-108 | Farbwelt Gruen (#farbwelten/gruen) | #farbwelten/gruen | content/farbwelten/gruen.md · `h1` | content/farbwelten/gruen.md#L9 | 2026-11-03 | final | must | writer | Route #farbwelten/gruen zeigt H1 Gruen und die Lede aus content/farbwelten/gruen.md. |
| CNT-SUB-109 | Farbwelt Gelb (#farbwelten/gelb) | #farbwelten/gelb | content/farbwelten/gelb.md · `h1` | content/farbwelten/gelb.md#L9 | 2026-11-03 | final | must | writer | Route #farbwelten/gelb zeigt H1 Gelb und die Lede aus content/farbwelten/gelb.md. |
| CNT-SUB-110 | Farbwelt Violett (#farbwelten/violett) | #farbwelten/violett | content/farbwelten/violett.md · `h1` | content/farbwelten/violett.md#L9 | 2026-11-03 | final | must | writer | Route #farbwelten/violett zeigt H1 Violett und die Lede aus content/farbwelten/violett.md. |
| CNT-SUB-111 | Farbwelt Orange (#farbwelten/orange) | #farbwelten/orange | content/farbwelten/orange.md · `h1` | content/farbwelten/orange.md#L9 | 2026-11-03 | final | must | writer | Route #farbwelten/orange zeigt H1 Orange und die Lede aus content/farbwelten/orange.md. |
| CNT-SUB-112 | Farbwelt Indigo (#farbwelten/indigo) | #farbwelten/indigo | content/farbwelten/indigo.md · `h1` · L9 | content/farbwelten/indigo.md#L9 | 2026-11-03 | final | must | writer | Route #farbwelten/indigo zeigt H1 Indigo und die Lede aus content/farbwelten/indigo.md. |
| CNT-SUB-201 | Farbtherapie und Chromotherapie (#farbwelten/farbtherapie) | #farbwelten/farbtherapie | content/farbwelten/farbtherapie.md · `h1` · L8 | content/farbwelten/farbtherapie.md#L8 | 2026-11-03 | final | must | writer | Route #farbwelten/farbtherapie zeigt H1 Farbtherapie und Chromotherapie mit ihren Abschnittsankern und ist direkt adressierbar. |
| CNT-SUB-202 | Farbpsychologie (#farbwelten/farbpsychologie) | #farbwelten/farbpsychologie | content/farbwelten/farbpsychologie.md · `h1` · L8 | content/farbwelten/farbpsychologie.md#L8 | 2026-11-03 | final | must | writer | Route #farbwelten/farbpsychologie zeigt H1 Farbpsychologie mit ihren Abschnittsankern und ist direkt adressierbar. |
| CNT-SUB-203 | Lichtmedizin und Photobiologie (#farbwelten/lichtmedizin) | #farbwelten/lichtmedizin | content/farbwelten/lichtmedizin.md · `h1` · L8 | content/farbwelten/lichtmedizin.md#L8 | 2026-11-03 | final | must | writer | Route #farbwelten/lichtmedizin zeigt H1 Lichtmedizin und Photobiologie mit ihren Abschnittsankern und ist direkt adressierbar. |

## Artikel (22)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-ART-001 | Die 78 Tarot-Karten: Eine Reise durch die Major & Minor Arcana | #blog/1 | js/data/articles.js · `articles[0]` · L3-L27 | js/data/articles.js#L3-L27 | 2026-11-03 | final | must | writer | #blog/1 zeigt Titel/Excerpt aus articles[0]; unbekannte ID bleibt auf Artikelliste mit Hinweis. |
| CNT-ART-002 | Kristalle als Werkzeuge: Wie Steine unsere Energie beeinflussen | #blog/2 | js/data/articles.js · `articles[1]` · L29-L43 | js/data/articles.js#L29-L43 | 2026-11-03 | final | must | writer | Route #blog/2 oeffnet Artikel 2 im Dialog; Titel und Excerpt stammen aus articles[1]. |
| CNT-ART-003 | Runenwerfen: Die drei Positionen der Vergangenheit, Gegenwart und Zukunft | #blog/3 | js/data/articles.js · `articles[2]` · L44-L62 | js/data/articles.js#L44-L62 | 2026-11-03 | final | must | writer | Route #blog/3 oeffnet Artikel 3 im Dialog; Titel und Excerpt stammen aus articles[2]. |
| CNT-ART-004 | Die Mondphasen: Von Neumond bis Vollmond — Rituale für jeden Zyklus | #blog/4 | js/data/articles.js · `articles[3]` · L63-L82 | js/data/articles.js#L63-L82 | 2026-11-03 | final | must | writer | Route #blog/4 oeffnet Artikel 4 im Dialog; Titel und Excerpt stammen aus articles[3]. |
| CNT-ART-005 | Die Geschichte des Tarot: Von Spielkarten zur spirituellen Praxis | #blog/5 | js/data/articles.js · `articles[4]` · L83-L97 | js/data/articles.js#L83-L97 | 2026-11-03 | final | must | writer | Route #blog/5 oeffnet Artikel 5 im Dialog; Titel und Excerpt stammen aus articles[4]. |
| CNT-ART-006 | Einsteiger-Guide: Wie du mit Tarot, Kristallen und Runen beginnst | #blog/6 | js/data/articles.js · `articles[5]` · L98-L116 | js/data/articles.js#L98-L116 | 2026-11-03 | final | must | writer | Route #blog/6 oeffnet Artikel 6 im Dialog; Titel und Excerpt stammen aus articles[5]. |
| CNT-ART-007 | Chakren & Kristalle: Welche Steine für welches Energiezentrum | #blog/7 | js/data/articles.js · `articles[6]` · L117-L137 | js/data/articles.js#L117-L137 | 2026-11-03 | final | must | writer | Route #blog/7 oeffnet Artikel 7 im Dialog; Titel und Excerpt stammen aus articles[6]. |
| CNT-ART-008 | Die Bedeutung des Futhark: Von Fehu bis Othala | #blog/8 | js/data/articles.js · `articles[7]` · L138-L156 | js/data/articles.js#L138-L156 | 2026-11-03 | final | must | writer | Route #blog/8 oeffnet Artikel 8 im Dialog; Titel und Excerpt stammen aus articles[7]. |
| CNT-ART-009 | Rituale für jede Mondphase: Ein praktischer Kalender | #blog/9 | js/data/articles.js · `articles[8]` · L157-L173 | js/data/articles.js#L157-L173 | 2026-11-03 | final | must | writer | Route #blog/9 oeffnet Artikel 9 im Dialog; Titel und Excerpt stammen aus articles[8]. |
| CNT-ART-010 | Moldavit: Der Meteorit unter den Kristallen | #blog/10 | js/data/articles.js · `articles[9]` · L174-L199 | js/data/articles.js#L174-L199 | 2026-11-03 | final | must | writer | Route #blog/10 oeffnet Artikel 10 im Dialog; Titel und Excerpt stammen aus articles[9]. |
| CNT-ART-011 | Die Major Arcana: Vom Narr bis zur Welt | — | data/articles/article-01.md · `h1` · L10 | data/articles/article-01.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-012 | Minor Arcana: Die vier Suits verstehen | — | data/articles/article-02.md · `h1` · L10 | data/articles/article-02.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-013 | Kristalle für jedes Chakra: Ein Leitfaden | — | data/articles/article-03.md · `h1` · L10 | data/articles/article-03.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-014 | Mondphasen-Rituale für Anfänger | — | data/articles/article-04.md · `h1` · L10 | data/articles/article-04.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-015 | Runenlesen: Die 3-Runen-Legung erklärt | — | data/articles/article-05.md · `h1` · L10 | data/articles/article-05.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-016 | Tarot vs. Runen: Unterschiede und Gemeinsamkeiten | — | data/articles/article-06.md · `h1` · L10 | data/articles/article-06.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-017 | Wie man einen Kristall reinigt und auflädt | — | data/articles/article-07.md · `h1` · L10 | data/articles/article-07.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-018 | Die Bedeutung der Mondknoten in der Astrologie | — | data/articles/article-08.md · `h1` · L10 | data/articles/article-08.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-019 | Tageskarte ziehen: Eine Morgenroutine | — | data/articles/article-09.md · `h1` · L10 | data/articles/article-09.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-020 | Ein eigenes Orakel-Deck erstellen | — | data/articles/article-10.md · `h1` · L10 | data/articles/article-10.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-021 | Schattenarbeit mit Tarot | — | data/articles/article-11.md · `h1` · L10 | data/articles/article-11.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |
| CNT-ART-022 | Kristall-Grids für Manifestation | — | data/articles/article-12.md · `h1` · L10 | data/articles/article-12.md#L10 | 2026-11-03 | offen | none | writer | Datei bleibt unveraendert im Bestand; keine ausgelieferte Seite verlinkt sie. |

## Rechtstexte (3)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-LEG-001 | Impressum | impressum.html | impressum.html · `h1` · L34 | impressum.html#L34 | 2026-11-03 | final | must | writer | Direkt erreichbar, nicht im Hash-Routing, im Footer verlinkt. |
| CNT-LEG-002 | Datenschutzerklaerung | datenschutz.html | datenschutz.html · `h1` · L37 | datenschutz.html#L37 | 2026-11-03 | entwurf | must | writer | datenschutz.html ist im Footer verlinkt, direkt erreichbar und nennt alle tatsaechlich verwendeten localStorage-Bereiche. |
| CNT-LEG-003 | Haftungsausschluss | haftung.html | haftung.html · `h1` · L37 | haftung.html#L37 | 2026-11-03 | final | must | writer | haftung.html ist im Footer verlinkt und direkt erreichbar; der Text bleibt unveraendert gegenueber der Baseline. |

## UI-Texte, Metadaten und Fehlermeldungen (2)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-STR-001 | Sprunglink „Zum Hauptinhalt springen“ | — | index.html · `.skip-link` · L64 | index.html#L64 | 2026-11-03 | final | must | writer | Erstes Tab-Ereignis fokussiert Sprunglink, Enter -> #main; Text wortgleich. |
| CNT-STR-002 | Navigation Hauptbereiche (10 Eintraege) | — | index.html · `nav.main-nav` | index.html#nav | 2026-11-03 | final | must | writer | Die Hauptnavigation zeigt zehn Bereiche in fester Reihenfolge; jeder Eintrag setzt aria-current auf der aktiven Seite. |

## Glossar, Quellenlisten und Werkzeuge (2)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-GLO-001 | Radiästhesie-Glossar | radiasthesie/glossar.html | radiasthesie/glossar.html · `h1` · L44 | radiasthesie/glossar.html#L44 | 2026-11-03 | final | must | writer | Direkt erreichbar, in sitemap.xml, Kopfanzahl entspricht model.stats.glossary. |
| CNT-GLO-002 | Tarot-Glossar (implizit, nicht als eigene Seite) | — | data/tarot.json · `entries[0]` | data/tarot.json#L1 | 2026-11-03 | entwurf | should | writer | Kein eigener Glossareintrag und keine eigene Route; Begriffserklaerungen erscheinen nur im Karten-Dialog. |

## Aussagen (Claims) (6)

| ID | Aussage | Art | Belegstelle | Pruefstatus | Zitat | Status | Release | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CLM-001 | 78 Tarot-Karten: 22 Grosse Arkana und vier Farben mit je 14 Karten | number | index.html#L240 | verified | data/tarot.json und js/data/tarot.js enthalten je 78 Kartenobjekte; README Datenquellen (Rider-Waite-Smith, Public Domain). | final | must | writer |
| CLM-002 | 30 Kristalle im Katalog | number | index.html#crystals | verified | data/crystals.json enthaelt 30 Objekte; js/modules/crystals.js L32 laedt ./data/crystals.json. In Chromium gemessen: 30 Karten auf #crystals (evidence/release-gate/runtime-fakten.json). js/data/crystals.js (36) laedt keine Seite. | final | must | writer |
| CLM-003 | Rot ist die Farbe mit der laengsten Wellenlaenge im sichtbaren Spektrum (620-750 nm) | number | content/farbwelten/rot.md#L10 | unverified | content/farbwelten/rot.md L10 nennt 620-750 nm und 400-484 THz ohne Quellenangabe; der Wert entspricht dem physikalischen Standardbereich fuer Rot, die Seite belegt ihn nicht. | entwurf | must | writer |
| CLM-004 | 10 gerenderte Blogartikel (js/data/articles.js) und 12 Markdown-Artikel (data/articles/*.md) | number | js/data/articles.js#L3-L189 | verified | js/data/articles.js enthaelt 10 Artikelobjekte (articles[0..9]); data/articles/ enthaelt 12 Markdown-Dateien; inventory-baseline.json L417-L432: rendered_count 10, markdown_count 12. | final | must | writer |
| CLM-005 | 12 Farbwelten mit 18 Markdown-Quellen und 3 Themenseiten | number | docs/migration-baseline/inventory-baseline.json#L302-L415 | verified | inventory-baseline.json L302-L415: zwoelf Farbwelten, 18 Markdown-Quellen (markdown_sources_count), drei Themenseiten (topic_pages_count). | final | must | writer |
| CLM-006 | 7 Radiästhesie-Dokumente unter radiasthesie/ (Glossar, Anleitung, Werkzeuge) | number | docs/migration-baseline/inventory-baseline.json#L183-L220 | verified | inventory-baseline.json L183-L220 listet sieben Radiästhesie-Dokumente (radiasthesie_documents_count 7). | final | must | writer |

## Unbelegte Aussagen

- `CLM-003` (unverified) — Rot ist die Farbe mit der laengsten Wellenlaenge im sichtbaren Spektrum (620-750 nm)

## Nicht abgeschlossen oder fehlend

- `CNT-ART-011` (offen) Die Major Arcana: Vom Narr bis zur Welt — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-012` (offen) Minor Arcana: Die vier Suits verstehen — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-013` (offen) Kristalle für jedes Chakra: Ein Leitfaden — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-014` (offen) Mondphasen-Rituale für Anfänger — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-015` (offen) Runenlesen: Die 3-Runen-Legung erklärt — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-016` (offen) Tarot vs. Runen: Unterschiede und Gemeinsamkeiten — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-017` (offen) Wie man einen Kristall reinigt und auflädt — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-018` (offen) Die Bedeutung der Mondknoten in der Astrologie — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-019` (offen) Tageskarte ziehen: Eine Morgenroutine — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-020` (offen) Ein eigenes Orakel-Deck erstellen — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-021` (offen) Schattenarbeit mit Tarot — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-ART-022` (offen) Kristall-Grids für Manifestation — Veroeffentlichen oder entfernen? Beides ist vertretbar, aber nicht beides gleichzeitig (E-03).
- `CNT-GLO-002` (entwurf) Tarot-Glossar (implizit, nicht als eigene Seite)
- `CNT-LEG-002` (entwurf) Datenschutzerklaerung — Die Erklaerung nennt Kristall-Favoriten, Runen-Historie, Frequenzlabor und Meditation, aber nicht das Radiästhesie-Journal (esot_rad_journal_v) und die Experimentlaeufe (esot_rad_experiment_v).
