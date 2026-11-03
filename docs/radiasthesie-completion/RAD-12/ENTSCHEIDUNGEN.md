# RAD-12 — Entscheidungen

Kurz festgehalten, was bewusst so und nicht anders gebaut ist. Jede Entscheidung
nennt Option, Grund und Folge.

## 1. Additive statische Dokumente statt Router-Ersatz

- **Optionen:** (a) Hash-Router beibehalten und nur Metadaten verbessern,
  (b) Router durch History-API/Server-Routing ersetzen, (c) zusätzliche statische
  Dokumente aus derselben Datenquelle erzeugen.
- **Entscheidung:** (c). Die SPA bleibt unverändert nutzbar (Deep-Links, Offline,
  Werkzeuge); die Dokumente sind additiv.
- **Grund:** Die Karte verlangt echte indexierbare Dokumente, keine
  Scope-Reduktion auf dynamische Metadaten. Ein Router-Ersatz hätte Offline-Build,
  Fokuslogik und alle Bestandstests getroffen — Risiko ohne Zusatznutzen.
- **Folge:** Zwei Adressen zeigen denselben Text. Deshalb setzt die Ansicht ihren
  Canonical auf das Dokument; es gibt keine widersprüchliche Doppelbewertung.

## 2. Eine Adressliste für Generator, Modul, Sitemap und Tests

- **Entscheidung:** `js/modules/radiasthesie-seo.js` führt `STATIC_DOCS`,
  Canonical-Zuordnung, Titelgrenze und `breadcrumbList`.
- **Grund:** Sitemap, Canonical und Dokumentpfade müssen übereinstimmen. Vier
  getrennte Listen wären vier Gelegenheiten, auseinanderzulaufen.
- **Folge:** Ein neues Dokument braucht einen Eintrag; Tests prüfen
  Eindeutigkeit und Erreichbarkeit.

## 3. Kein `Article`-Markup

- **Optionen:** `Article` mit `author`/`datePublished` ergänzen oder weglassen.
- **Entscheidung:** weglassen, stattdessen `WebPage`/`CollectionPage`.
- **Grund:** Es gibt kein belegtes Veröffentlichungsdatum und kein benanntes
  Redaktionskonto. Ein erfundenes `datePublished` wäre eine Falschangabe; die
  IA-Regel (§7) verlangt beides ausdrücklich. `dateModified` allein trägt kein
  Article-Rich-Result.
- **Folge:** Kein Article-Rich-Result. Die Dokumente bleiben über
  `WebPage`, `BreadcrumbList`, `hasPart` und `citation` sauber ausgezeichnet.

## 4. Kein `FAQPage`

- **Entscheidung:** kein FAQ-Markup.
- **Grund:** Es gibt Fragen im Modul („offene Fragen“ der Forschung), aber keine
  Antworten im Sinne einer FAQ-Seite. Ein FAQPage mit unbeantworteten Fragen wäre
  irreführend und würde gegen die Rich-Result-Regeln verstoßen.
- **Folge:** Offene Fragen bleiben sichtbarer Text auf der Übersicht.

## 5. `DefinedTermSet` nur für das Glossar

- **Entscheidung:** Glossar als `DefinedTermSet` mit allen Begriffen und
  Definitionen; `hasDefinedTerm` wird aus derselben Datenquelle erzeugt und gegen
  den sichtbaren Text geprüft.
- **Grund:** Der Seitentyp passt tatsächlich (Begriff + Definition), und die
  Auszeichnung ist vollständig durch sichtbaren Inhalt gedeckt.
- **Folge:** Keine zusätzlichen Behauptungen; ein Test vergleicht Datensatz,
  JSON-LD und sichtbaren Text.

## 6. Titelgrenze: 60 Zeichen ist eine Näherung, keine Google-Regel

- **Sachprüfung:** Google kürzt den Titel nach Pixelbreite (Desktop rund 600 px),
  nicht nach Zeichen. 60 Zeichen ist eine Faustregel; 59 Zeichen messen in
  Chromium 419 px (16 px Arial) bzw. 537 px (20 px), liegen also im sicheren
  Bereich.
- **Entscheidung:** 60 Zeichen als Projektgrenze beibehalten, zusätzlich die
  Pixelbreite im Browser messen. Markensuffix nur, wenn der Gesamttitel ≤ 60
  bleibt; sonst entfällt er (QA-Empfehlung B8: „Markensuffix nur auf der
  Startseite führen“).
- **Folge:** Modultitel wie „Pendeltafel-Studio …“ verlieren den Suffix; ein
  exakter Test wurde auf den neuen Wert umgestellt (nicht abgeschwächt: er
  prüft weiterhin exakt). 60 Zeichen werden nicht als Ranking-Garantie
  dargestellt.

## 7. Sitemap wird erzeugt, nicht gepflegt

- **Entscheidung:** `sitemap.xml` entsteht im Generator aus `ROOT_DOCS` +
  `STATIC_DOCS`; `lastmod` nur dort, wo sich eine Datei tatsächlich ändert.
- **Grund:** Handpflege driftet genau dann, wenn neue Dokumente dazukommen.
- **Folge:** Elf Einträge, keine Fragmente, jeder Eintrag wird im Build gegen
  das Artefakt geprüft. Produktions-`loc`-Adressen werden beim lokalen Lauf auf
  denselben Pfad unter der lokalen Basis abgebildet.

## 8. Glossar ohne Suchformular in der statischen Fassung

- **Entscheidung:** eigene, schlanke Glossar-Ausgabe mit Buchstabensprüngen statt
  der Modulansicht mit Suchformular und Buchstabenfilter.
- **Grund:** Ein Formular ohne JavaScript würde nichts tun — ein totes
  Bedienelement. Die Modulansicht bleibt unverändert.
- **Folge:** Alle 17 Begriffe stehen offen auf der Seite; die Suche bleibt der
  Anwendung vorbehalten.

## 9. Links werden übersetzt, nicht neu getippt

- **Entscheidung:** Der Generator übersetzt die Hash-Routen der Ansichten in
  statische Adressen (`quellen.html#quelle-Q09`, `../#pendeln/labor`, …) und
  bricht bei unbekannten Routen oder Ankern ab.
- **Grund:** Ein doppelt gepflegter Linkbestand driftet; ein toter Link wäre
  schlimmer als ein Build-Fehler.
- **Folge:** Test und `verify-pages` prüfen jedes interne Ziel und jede
  Sprungmarke; `href="#pendeln…"` darf im Dokument nicht mehr vorkommen.

## 10. Was ausdrücklich nicht behauptet wird

- Keine Rankings, keine „KI-Zitation“, keine Reichweitenversprechen.
- Keine Wirkungsaussagen zu Rute, Pendel oder Tafel; jede Themenseite trägt die
  Einordnung und die Evidenzstufen aus dem Bestand.
- Kein `og:image` mit einem eigens erzeugten Motiv, solange keine Freigabe
  vorliegt (Befund B7 bleibt offen).
