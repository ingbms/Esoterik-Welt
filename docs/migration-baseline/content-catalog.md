# ESOW Inhalts-Katalog

> Erzeugt von `scripts/migration-baseline/render-catalogs.cjs` aus `content-catalog.json`. Nicht von Hand bearbeiten — Aenderungen gehoeren in die JSON-Quelle.
> Stand: 2026-11-03 · Basis-Commit: 9f584397f8cc86a261fccdfc36dfbb8999f55ea7 · Struktur: docs/migration-baseline/00-schema-und-scope.md (Version 1.0.0)

## Kennzahlen

| Merkmal | Werte |
| --- | --- |
| Eintraege | 33 |
| Aussagen (Claims) | 6 |
| Status | entwurf 1 · fehlt 1 · final 29 · offen 2 |
| Release-Relevanz | must 32 · should 1 |
| Auslieferung | (leer) 2 · missing 1 · shipped 30 |
| Typen | article 1 · claims 1 · glossary 2 · legal 2 · page 10 · subroute 12 · topic-page 3 · ui-string 2 |
| Sprache | de 33 |

## Seiten und Bereiche (22)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-PAG-001 | Startseite (#home) | #home | index.html · `#home` · L110 | index.html#home | 2026-11-03 | final | must | writer | Wurzel-URL zeigt #home als aktive Seite; Titel/Description entsprechen PAGE_META.home in js/main.js. |
| CNT-PAG-003 | Tarot (#tarot) | #tarot | index.html · `#tarot` | index.html#tarot | 2026-11-03 | final | must | writer | Route zeigt Tarot-Inhalt; 78 Kartenobjekte in Datenquellen verifizierbar. |
| CNT-PAG-004 | Kristalle und Steine (#crystals) | #crystals | index.html · `#crystals` | index.html#crystals | 2026-11-03 | offen | must | writer | Seitenzahl muss mit masgeblicher Kristallquelle uebereinstimmen; offene Quelle entscheiden. |
| CNT-PAG-005 | Mond und Mondzyklen (#moon) | #moon | index.html · `#moon` | index.html#moon | 2026-11-03 | final | must | writer | — |
| CNT-PAG-006 | Astrologie (#astrologie) | #astrologie | index.html · `#astrologie` | index.html#astrologie | 2026-11-03 | final | must | writer | — |
| CNT-PAG-007 | Frequenzen (#frequenzen) | #frequenzen | index.html · `#frequenzen` | index.html#frequenzen | 2026-11-03 | final | must | writer | — |
| CNT-PAG-008 | Runen (#runes) | #runes | index.html · `#runes` | index.html#runes | 2026-11-03 | final | must | writer | — |
| CNT-PAG-009 | Pendeln / Radiästhesie (#pendeln) | #pendeln | index.html · `#pendeln` | index.html#pendeln | 2026-11-03 | final | must | writer | — |
| CNT-PAG-010 | Farbwelten (#farbwelten) | #farbwelten | index.html · `#farbwelten` | index.html#farbwelten | 2026-11-03 | final | must | writer | — |
| CNT-PAG-011 | Blog / Artikel (#blog) | #blog | index.html · `#blog` | index.html#blog | 2026-11-03 | final | must | writer | — |
| CNT-SUB-101 | Farbwelt Rot (#farbwelten/rot) | #farbwelten/rot | content/farbwelten/rot.md · `h1` · L10 | content/farbwelten/rot.md#L10 | 2026-11-03 | final | must | writer | #farbwelten/rot zeigt H1 Rot und Lede; Seite nennt 620-750 nm und 400-484 THz. |
| CNT-SUB-102 | Farbwelt Tuerkis (#farbwelten/tuerkis) | #farbwelten/tuerkis | content/farbwelten/tuerkis.md · `h1` | content/farbwelten/tuerkis.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-103 | Farbwelt Magenta (#farbwelten/magenta) | #farbwelten/magenta | content/farbwelten/magenta.md · `h1` | content/farbwelten/magenta.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-104 | Farbwelt Rose (#farbwelten/rosa) | #farbwelten/rosa | content/farbwelten/rosa.md · `h1` | content/farbwelten/rosa.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-105 | Farbwelt Weiss (#farbwelten/weiss) | #farbwelten/weiss | content/farbwelten/weiss.md · `h1` | content/farbwelten/weiss.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-106 | Farbwelt Schwarz (#farbwelten/schwarz) | #farbwelten/schwarz | content/farbwelten/schwarz.md · `h1` | content/farbwelten/schwarz.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-107 | Farbwelt Blau (#farbwelten/blau) | #farbwelten/blau | content/farbwelten/blau.md · `h1` | content/farbwelten/blau.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-108 | Farbwelt Gruen (#farbwelten/gruen) | #farbwelten/gruen | content/farbwelten/gruen.md · `h1` | content/farbwelten/gruen.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-109 | Farbwelt Gelb (#farbwelten/gelb) | #farbwelten/gelb | content/farbwelten/gelb.md · `h1` | content/farbwelten/gelb.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-110 | Farbwelt Violett (#farbwelten/violett) | #farbwelten/violett | content/farbwelten/violett.md · `h1` | content/farbwelten/violett.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-111 | Farbwelt Orange (#farbwelten/orange) | #farbwelten/orange | content/farbwelten/orange.md · `h1` | content/farbwelten/orange.md | 2026-11-03 | final | must | writer | — |
| CNT-SUB-112 | Farbwelt Braun (#farbwelten/braun) | #farbwelten/braun | content/farbwelten/braun.md · `h1` | content/farbwelten/braun.md | 2026-11-03 | final | must | writer | — |

## Artikel (1)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-ART-001 | Die 78 Tarot-Karten: Eine Reise durch die Major & Minor Arcana | #blog/1 | js/data/articles.js · `articles[0]` · L3-L27 | js/data/articles.js#L3-L27 | 2026-11-03 | final | must | writer | #blog/1 zeigt Titel/Excerpt aus articles[0]; unbekannte ID bleibt auf Artikelliste mit Hinweis. |

## Rechtstexte (2)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-LEG-001 | Impressum | impressum.html | impressum.html · `h1` · L34 | impressum.html#L34 | 2026-11-03 | final | must | writer | Direkt erreichbar, nicht im Hash-Routing, im Footer verlinkt. |
| CNT-LEG-002 | Datenschutzerklaerung (Verweis / nicht separater Eintrag) | impressum.html | impressum.html · `footer` | impressum.html#footer | 2026-11-03 | fehlt | must | writer | Wenn erforderlich, eigene Seite oder klarer Verweis etablieren; aktuell nicht als eigenstaendiges Dokument ausgewiesen. |

## UI-Texte, Metadaten und Fehlermeldungen (2)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-STR-001 | Sprunglink „Zum Hauptinhalt springen“ | — | index.html · `.skip-link` · L64 | index.html#L64 | 2026-11-03 | final | must | writer | Erstes Tab-Ereignis fokussiert Sprunglink, Enter -> #main; Text wortgleich. |
| CNT-UI-002 | Navigation Hauptbereiche (10 Eintraege) | — | index.html · `nav.main-nav` | index.html#nav | 2026-11-03 | final | must | writer | — |

## Glossar, Quellenlisten und Werkzeuge (2)

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-GLO-001 | Radiästhesie-Glossar | radiasthesie/glossar.html | radiasthesie/glossar.html · `h1` · L44 | radiasthesie/glossar.html#L44 | 2026-11-03 | final | must | writer | Direkt erreichbar, in sitemap.xml, Kopfanzahl entspricht model.stats.glossary. |
| CNT-GLO-002 | Tarot-Glossar (implizit, nicht als eigene Seite) | — | data/tarot.json · `entries[0]` | — | 2026-11-03 | entwurf | should | writer | — |

## Aussagen (Claims) (6)

| ID | Aussage | Art | Belegstelle | Pruefstatus | Zitat | Status | Release | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CLM-001 | 78 Tarot-Karten: 22 Grosse Arkana und vier Farben mit je 14 Karten | number | index.html#L240 / data/tarot.json | verified | data/tarot.json und js/data/tarot.js enthalten je 78 Kartenobjekte; README Datenquellen (Rider-Waite-Smith, Public Domain). | final | must | writer |
| CLM-002 | 30 Kristalle im Katalog | number | index.html#crystals | unverified | data/crystals.json = 30 Objekte; js/data/crystals.js = 36 Objekte — welche Quelle masgeblich? | offen | must | writer |
| CLM-003 | Rot ist die Farbe mit der laengsten Wellenlaenge im sichtbaren Spektrum (620-750 nm) | number | content/farbwelten/rot.md | unverified | Physikalische Standardwert; Seite nennt 620-750 nm und 400-484 THz, ohne explizite Quelle. | entwurf | must | writer |
| CLM-004 | 10 gerenderte Blogartikel (js/data/articles.js) und 12 Markdown-Artikel (data/articles/*.md) | number | js/data/articles.js / data/articles/*.md | verified (Zeilenzahlen; Inhalte nicht voll geprueft) | inventory-baseline.json: articles_rendered=10, articles_markdown=12; js/data/articles.js hat 10 Eintraege. | final | must | writer |
| CLM-005 | 12 Farbwelten mit 18 Markdown-Quellen und 3 Themenseiten | number | content/farbwelten/*.md / inventory-baseline.json | verified | inventory-baseline.json: farbwelten=12, farbwelten_markdown_sources=18, farbwelten_topic_pages=3. | final | must | writer |
| CLM-006 | 7 Radiästhesie-Dokumente unter radiasthesie/ (Glossar, Anleitung, Werkzeuge) | number | radiasthesie/ | verified | inventory-baseline.json: radiathesie_documents=7. | final | must | writer |

## Unbelegte Aussagen

- `CLM-002` (unverified) — 30 Kristalle im Katalog
- `CLM-003` (unverified) — Rot ist die Farbe mit der laengsten Wellenlaenge im sichtbaren Spektrum (620-750 nm)
- `CLM-004` (verified (Zeilenzahlen; Inhalte nicht voll geprueft)) — 10 gerenderte Blogartikel (js/data/articles.js) und 12 Markdown-Artikel (data/articles/*.md)

## Nicht abgeschlossen oder fehlend

- `CNT-CLAIMS` (offen) Claim-Liste (Inhalt / Zahlen / Quellen)
- `CNT-GLO-002` (entwurf) Tarot-Glossar (implizit, nicht als eigene Seite)
- `CNT-PAG-004` (offen) Kristalle und Steine (#crystals) — Welche Quelle ist masgeblich: data/crystals.json (30, via fetch) oder js/data/crystals.js (36, nicht importiert)? Text-Zahl muss vor Release entschieden werden.
