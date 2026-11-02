# Informationsarchitektur und Lesekonzept — Astrologiebereich

Stand: 2026-11-01 · Status: Implementierungsvorgabe für die Folgekarte (coding_debug), keine Produktivänderung in diesem Paket.

## 1. Ziel und Grenzen

Der Astrologiebereich ist ein eigenständiges, sichtbares Hauptnavigationsziel. Er führt Anfänger in die westliche tropische Astrologie ein, macht Tradition und Evidenz unterscheidbar und bietet ein belastbares Nachschlagewerk für zwölf Zeichen, zehn Faktoren, zwölf Häuser, fünf Hauptaspekte, Glossar und FAQ.

Nicht enthalten und nicht zu simulieren:

- keine Radix-, Transit- oder Aszendentberechnung,
- keine Geburtseingaben, Konten, Tracker oder personalisierten Horoskope,
- keine erfundenen Gradangaben, Horoskopgrafiken oder Live-Positionen,
- keine medizinischen, finanziellen, rechtlichen oder existenziellen Prognosen,
- keine wissenschaftliche Wirksamkeitsbehauptung.

Die Inhalte liegen in `docs/astrologie-konzept/content/*.json`; `generated/` ist nur Prüf- und Druckfassung. Die Website soll die JSON-Daten rendern, nicht das Markdown parsen.

## 2. Informationsarchitektur

```
Startseite
└─ Hauptnavigation: Astrologie
   ├─ Übersicht (#astrologie)                      ← Hub, 4 Einstiege
   │  ├─ Lernpfad (#astrologie/lernpfad)
   │  │  └─ Stufe 1–6 (#astrologie/lernpfad/{slug})
   │  ├─ Nachschlagen
   │  │  ├─ Zeichen (#astrologie/zeichen) → Detail {slug}
   │  │  ├─ Faktoren (#astrologie/faktoren) → Detail {slug}
   │  │  ├─ Häuser (#astrologie/haeuser) → Detail {slug}
   │  │  └─ Aspekte (#astrologie/aspekte) → Detail {slug}
   │  ├─ Grundlagen (#astrologie/grundlagen) → Detail {slug}
   │  └─ Synthese
   │     ├─ Beispiele (#astrologie/beispiele) → Detail {slug}
   │     └─ FAQ (#astrologie/faq)
   └─ Werkzeuge
      ├─ Glossar (#astrologie/glossar)
      ├─ Quellen & Claims (#astrologie/quellen)
      └─ Methodik & Grenzen (#astrologie/methodik)
```

Vier Einstiege auf der Übersicht, in dieser Reihenfolge:

1. **Neu hier?** → Lernpfad Stufe 1 (Orientierung, 25 Minuten).
2. **Etwas nachschlagen** → Zeichen/Faktoren/Häuser/Aspekte mit Suche und Filtern.
3. **Verstehen, warum** → Grundlagen: Ekliptik, tropisch/siderisch, Zeichen vs. Sternbilder, Evidenz.
4. **Vorsichtig lesen** → Methodik & Grenzen, FAQ, Quellenledger.

Die Reihenfolge folgt dem didaktischen Prinzip: kurze Orientierung → Vergleich/Details → Beispiele → Grenzen. Kein Bereich beginnt mit einer langen Textwand.

## 3. Routen und Zustand

Bestehender Hash-Router; alle Routen müssen als Kaltstart, per Zurück/Vorwärts und per direktem Link funktionieren.

| Route | Ansicht | Pflichtinhalt |
|---|---|---|
| `#astrologie` | Hub | 4 Einstiege, Kurzbeschreibung, Kennzeichnungslegende, „Keine Berechnung“-Hinweis |
| `#astrologie/lernpfad` | Lernpfad-Index | 6 Stufen, Lesezeit, Ziel, Fortschritt ohne Speicherung |
| `#astrologie/lernpfad/{slug}` | Stufe | Ziel, Schritte, Materiallinks, Verständnisfragen, nächste Stufe |
| `#astrologie/zeichen` | Zeichen-Index | 12 Karten, Filter Element/Modalität, Suche |
| `#astrologie/zeichen/{slug}` | Zeichen-Detail | Kurztext, Langtext, Metatabelle, Stärken/Spannungen, Fragen, Quellen |
| `#astrologie/faktoren` | Faktoren-Index | 10 Karten, Gruppierung Leuchtkörper/Planeten/Zwergplanet |
| `#astrologie/faktoren/{slug}` | Faktor-Detail | Astronomie-Tabelle, Deutung, Herrschaft, Zyklus, Fragen |
| `#astrologie/haeuser` | Häuser-Index | 12 nummerierte Karten, Winkel/Sukzedent/Kadent |
| `#astrologie/haeuser/{slug}` | Haus-Detail | Feld, Kategorie, Themen, Fragen, Grenze |
| `#astrologie/aspekte` | Aspekt-Index | 5 Karten mit Winkel und Orbis |
| `#astrologie/aspekte/{slug}` | Aspekt-Detail | Winkel, Qualität, Orbis, Schulhinweis, Missdeutung |
| `#astrologie/grundlagen` | Grundlagen-Index | Gruppiert nach Grundlagen/Vertiefung/Nachschlagen |
| `#astrologie/grundlagen/{slug}` | Grundlagen-Detail | Langtext, Kernpunkte, Querverweise, Quellen |
| `#astrologie/beispiele` | Beispiel-Index | 4 fiktive Beispiele, deutliches Fiktiv-Badge |
| `#astrologie/beispiele/{slug}` | Beispiel-Detail | Annahmen, Schritte, Synthese, Alternativen, Grenzen, Disclaimer |
| `#astrologie/faq` | FAQ | 15 Fragen, aufklappbar oder als Ankerliste |
| `#astrologie/glossar` | Glossar | 65 Begriffe, alphabetisch, Suche, Siehe-auch |
| `#astrologie/quellen` | Quellen & Claims | Quellenledger mit Abrufstatus, Claim-Tabelle |
| `#astrologie/methodik` | Methodik | Arbeitsannahme, Kennzeichnung, Evidenzlage, Datenschutz, keine Prognose |
| `#astrologie/suche?q=` | Suche | Ergebnisliste über alle Typen, Trefferzahl, Leerzustand |

Routing-Regeln:

- **Unbekannter Slug** → bereichsinterne Fehleransicht mit „Zur Übersicht“, „Zur Suche“ und Vorschlägen; niemals leere Seite.
- **Unbekannter Hash** → dieselbe Fehleransicht; niemals stiller Fallback auf die Startseite ohne Hinweis.
- **Skip-Link** darf nicht über den Hash-Router laufen. Ziel muss ein echtes Element mit `id="main-content"` sein, nicht `#main` als Router-ID.
- **Deep-Link-Kaltstart** muss den Inhalt rendern, bevor Fokus gesetzt wird. Der Router darf beim Setzen des Fokus nicht alle `.page`-Elemente verstecken.
- **Fokus nach Navigation:** `h1` der Zielansicht erhält `tabindex="-1"` und Fokus; `document.title` wird pro Route gesetzt.
- **Zurück/Vorwärts:** Filter- und Suchzustand soll über URL-Parameter erhalten bleiben, damit Zurück nicht überraschend filtert.

## 4. Komponenten und progressive Offenlegung

### Hub
- Hero mit einem Satz Orientierung und drei Faktenchips: „12 Zeichen · 10 Faktoren · 12 Häuser“.
- Vier Einstiegskarten (Lernpfad, Nachschlagen, Grundlagen, Methodik).
- Kennzeichnungslegende als kompakte Tabelle (Tradition, Astronomie, Konvention, Empirie, Historisch).
- Hinweisbox: „Keine Berechnung, keine Geburtsdaten, keine Prognose.“

### Indexseiten
- Suchfeld (clientseitig, diakritik-insensitiv: „gross“ findet „groß“).
- Filter-Chips mit `aria-pressed`; Ergebniszähler in `aria-live="polite"`.
- Karten mit Titel, Kurztext (max. 2 Zeilen), Badge (Element/Modalität bzw. Typ), Link „Mehr lesen“.
- Keine horizontal scrollenden Tabellen. Bei 375 px werden Metatabellen zu Definitionslisten (Label über Wert).

### Detailseiten
- Breadcrumb: Astrologie → Kategorie → Item.
- `h1` mit Name und Symbol (dekoratives Symbol `aria-hidden="true"`).
- Kurztext als Lead, dann Langtext in Abschnitten.
- Metatabelle (Zeichen: Zeitraum, Element, Modalität, Herrscher, Haus, Gegenpol; Faktor: Art, Umlauf, Sichtbarkeit; Aspekt: Winkel, Orbis).
- Aufklappbare Bereiche „Vertiefung“, „Querverweise“, „Quellen & Claims“. Standard: Kurztext und ein Abschnitt offen; Details per `<details>` oder Button mit `aria-expanded`. Kein Accordion-Zwang für den Haupttext.
- Querverweise als echte Links auf die Zielrouten; kein „kommt später“-Platzhalter.
- Quellenpanel: Quelle, Typ, Abrufdatum, Kurzzitat, Grenzen; Claims als Liste mit Evidenztyp. Interne Marker `[Sxx]` werden zu Links auf `#astrologie/quellen`-Anker. Das Panel speist sich aus `item.sources`; `validate.cjs` erzwingt deshalb die Invariante „jeder Inline-Marker eines Items steht in `item.sources`“ (`counts.inlineSourcesCoverage`), damit kein Textmarker ohne Link im Panel bleibt. Umgekehrt gilt bewusst keine Pflicht: Eine Quelle darf im Panel stehen, ohne dass jeder Deutungssatz einen Marker trägt — reine Traditionsdeutung bleibt unmarkiert (siehe `review-checkliste.md` §D), die Quelle ist dann über den Claim des Items belegt. Das Panel sollte solche Einträge nicht als „unbenutzt“ ausblenden.
- Kennzeichnungs-Badge an jedem längeren Text, nicht nur einmal pro Seite.

### Beispiele
- Permanentes Badge „Fiktives Lehrbeispiel“.
- Block „Gesetzte Annahmen“ vor der Deutung.
- Explizite Zeile: „Keine berechnete Radix, keine realen Personen, keine Gradangaben.“
- Schritte als nummerierte Liste mit Materiallinks.
- Grenzen und alternative Lesart sichtbar, nicht in einem versteckten Tooltip.

### Glossar und Suche
- Glossar alphabetisch, Buchstaben-Sprungnavigation, Suche.
- Suche durchsucht Titel, Kurztext, Keywords und Glossarbegriffe; Treffer nach Typ gruppiert; maximal 50 Treffer, danach „Suche verfeinern“.
- Leerzustand: „Keine Treffer für …“, Reset-Button, Vorschläge (Zeichen, Glossar, FAQ).

## 5. Datenintegration

- JSON-Dateien sind die Quelle. Für den Offline-/`file://`-Build dürfen sie nicht per `fetch()` geladen werden.
- Empfohlen: Build-Schritt erzeugt `js/modules/astrologie-data.js` als ES-Modul mit eingefrorenen Objekten und einem vorberechneten Suchindex. Das Modul wird in das bestehende Bundle aufgenommen.
- Alternativ: pro Typ eine JS-Datei; Detaildaten erst bei Bedarf laden, aber ohne Netzwerkzugriff (dynamischer Import auf lokale Datei funktioniert bei `file://` nicht zuverlässig, daher bevorzugt ein Modul).
- IDs und Slugs sind stabil; sie dürfen nicht aus Anzeigetexten generiert werden.
- Anzeigetexte enthalten Markdown-light: Absätze durch Leerzeilen, `**fett**`, `[Sxx]`-Marker. Ein kleiner Renderer muss Absätze, Fettschrift und Quellenmarker unterstützen; kein `innerHTML` mit ungeprüften Daten.
- Keine externen Fonts, Skripte, Tracker oder Bilder in diesem Bereich. Symbole als Unicode oder lokale SVG-Sprites.
- Payload-Budget: Das Gesamtpaket umfasst rund 208.000 Zeichen JSON (≈ 28.000 Wörter). Vor dem Bundling gzipen und messen; Ziel < 120 KB gzip für den Erstkontakt. Falls überschritten: Indexdaten (Kurztexte) sofort laden, Langtexte pro Detailroute nachladen.

## 6. Mobiles Lesen (375/768/1440)

- **375 px:** einspaltig, 16 px Fließtext, 1.6 Zeilenabstand, 24 px Rand. Metatabellen als Definitionslisten. Filter-Chips umbrechen, kein horizontales Scrollen. Sticky Bottom-Bar vermeiden; Breadcrumb darf horizontal scrollen, aber mit sichtbarem Fokus und ohne Seiten-Overflow.
- **768 px:** zweispaltige Kartenraster für Indizes, Detailseiten weiter einspaltig mit max. 68 Zeichen Zeilenlänge.
- **1440 px:** Detailseite mit sticky Inhaltsverzeichnis links (ab 1200 px) und max. 72 Zeichen Textbreite; keine überbreiten Textzeilen.
- **Inhaltsverzeichnis:** auf Mobil als `<details>` „Auf dieser Seite“, auf Desktop sticky.
- **Tabellen:** nie horizontal scrollen; bei Bedarf in Definitionslisten umwandeln. `overflow-wrap: anywhere` für lange URLs im Quellenpanel.
- **Touch-Ziele:** mindestens 44 × 44 px für Chips, Accordion-Buttons und Links in Listen.
- **Reduced Motion:** keine Scroll-Animation, keine automatischen Übergänge; `prefers-reduced-motion` respektieren.

## 7. Tastatur, Fokus, Dialoge

- Alle Filter, Accordions, Suchfelder und Links sind per Tab erreichbar; sichtbarer Fokusring mit mindestens 2 px und Kontrast ≥ 3:1 gegen den Hintergrund.
- Filter-Chips: `button` mit `aria-pressed`, nicht `div` mit Click-Handler.
- Accordions: `button` mit `aria-expanded` und `aria-controls`; Inhalt bleibt im DOM.
- Falls ein Quellen-Dialog verwendet wird: Fokusfalle, `Escape` schließt, Fokus kehrt zum Auslöser zurück, `inert` für den Hintergrund. Ein Dialog ist nicht nötig; ein aufklappbares Panel ist robuster.
- Skip-Link führt zu `#main-content` (echtes Element), nicht zu einer Router-Route. Nach Enter muss der Hauptinhalt sichtbar bleiben.
- Nach Routenwechsel: Fokus auf `h1`, `document.title` aktualisieren, `aria-live`-Ansage der neuen Ansicht.
- Keine Tastaturfalle; keine Fokusverluste bei Filterwechsel.

## 8. Fehler- und Leerzustände

| Situation | Anzeige |
|---|---|
| Unbekannter Slug | „Diese Seite gibt es nicht (mehr).“ + Zur Übersicht + Suche + drei Vorschläge |
| Unbekannter Hash | Wie oben, plus Hinweis „Der Link ist möglicherweise veraltet.“ |
| Leeres Suchergebnis | „Keine Treffer für ‚…‘“ + Filter zurücksetzen + Vorschläge |
| Fehlende Quelle | Quellenpanel zeigt „Quellenangabe fehlt“ statt eines toten Links; kein stilles Entfernen |
| Fehlende Daten | Bereichsinterne Fehlerkarte mit Retry-freiem Hinweis (statische Daten) |
| Kein JavaScript | Statischer Fallback mit Lernpfad-Kurzfassung, FAQ und Glossar; mindestens die Startseite muss lesbar bleiben |

## 9. Druckkonzept

- `@media print`: A4, 2 cm Rand, 11 pt Fließtext, 1.4 Zeilenabstand.
- Navigation, Filter, Suchfelder, Footer-Navigation und „Nach oben“ ausblenden.
- Jede Detailseite druckt Breadcrumb, Titel, Kurztext, Langtext, Metatabelle, Querverweise als Text und Quellen als nummerierte Liste am Ende.
- `break-inside: avoid` für Karten, Tabellen und Beispiele; `orphans: 3; widows: 3`.
- Externe Links im Druck mit URL in Klammern, aber nur wenn die URL nicht länger als 80 Zeichen ist; sonst Kurzform.
- Quellenmarker `[Sxx]` im Druck als hochgestellte Nummer mit Quellenverzeichnis am Ende.
- Kein Druck eines „Horoskops“, keiner Grafik und keiner personalisierten Daten.
- Druckfreigabe ist mit diesem Konzept nicht erteilt; sie ist ein eigener Prüfschritt.

## 10. Barrierefreiheit und Qualitätskriterien

- Eine `h1` pro Ansicht; Heading-Hierarchie ohne Sprünge.
- Kontrast: Fließtext ≥ 4.5:1, große Überschriften ≥ 3:1, Fokusring ≥ 3:1. Werte mit Tool messen, nicht schätzen.
- Semantisches HTML: `nav`, `main`, `article`, `section`, `table` mit `caption`, `th scope`.
- Badges mit Text, nicht nur Farbe oder Symbol. Farbe nie als einziger Bedeutungsträger.
- `lang="de"` am Dokument; englische Zitate mit `lang="en"`.
- Formulierung: keine Diagnosen, keine sicheren Prognosen, keine Angstmache, keine kulturellen Stereotype.
- Quellen und Kennzeichnung müssen im gerenderten Bereich sichtbar sein, nicht nur im Repository.

## 11. Abnahmekriterien für die Implementierung

1. Alle 12 Zeichen, 10 Faktoren, 12 Häuser, 5 Aspekte, 4 Beispiele, 15 FAQ und 65 Glossarbegriffe werden tatsächlich gerendert; keine Teaser-Stubs.
2. Jede Detailroute ist per Kaltstart, Zurück/Vorwärts und direktem Hash-Link erreichbar und zeigt Inhalt.
3. Alle Querverweise führen auf existierende Ziele; keine toten Links, keine leeren Anker.
4. Filter und Suche liefern korrekte Trefferzahlen; Leerzustand und Reset funktionieren.
5. 375/768/1440 px: kein horizontaler Dokument- oder Komponenten-Overflow; Text bricht sauber.
6. Tastatur: alle interaktiven Elemente erreichbar; Fokus sichtbar; Accordions korrekt; Skip-Link zerstört den Inhalt nicht.
7. Kontraste gemessen und dokumentiert; keine Farbe als einziger Bedeutungsträger.
8. `file://`-Doppelklick, synchroner Build und Produktionsbasis `/Esoterik-Welt/` funktionieren.
9. Quellen und Kennzeichnung sind im Bereich sichtbar; Methodik-Seite erklärt die Grenzen.
10. Keine Geburtseingaben, keine Berechnung, keine erfundenen Positionen, keine Prognoseversprechen.
11. Screenshots und Messwerte als Evidenz; keine Abnahme über HTTP 200 allein.
12. Bestehende Router-Defekte (leere Artikel-Deep-Links, Skip-Link, unbekannter Hash) werden nicht reproduziert.

## 12. Bekannte Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Hash-Router versteckt beim Skip-Link alle `.page` | Skip-Ziel als echtes Element außerhalb der Routenlogik; Test mit echter Enter-Taste |
| Deep-Link-Kaltstart rendert leer | Router-Initialisierung vor Fokus; Testmatrix mit frischem Browserkontext |
| Unbekannter Hash bleibt leer | explizite NotFound-Ansicht im Astrologiebereich |
| Große Textmengen auf Mobil | progressive Offenlegung, Kurztext zuerst, Langtext in Abschnitten |
| Quellenpanel wird zur Datenwand | aufklappbar, pro Item nur die verwendeten Quellen, Claims separat |
| Schema-Drift zwischen JSON und UI | Build bricht bei fehlenden Pflichtfeldern; Validator vor Render |
| Scheingenauigkeit | keine Berechnung, keine Gradangaben, keine „Live“-Zeitangaben |

## 13. Offene Entscheidungen für die Implementierungskarte

- Wird der Bereich als eigene Route-Gruppe im bestehenden Router oder als eigener Unter-Router umgesetzt? Empfehlung: Route-Gruppe, damit Hauptnavigation und Verlauf konsistent bleiben.
- Wird das Datenmodul vollständig oder pro Typ gebündelt? Empfehlung: ein Modul mit Indexdaten plus dynamischer Import pro Typ, falls die Dateigröße es erlaubt; sonst ein Modul und Lazy-Render der Langtexte.
- Wird das Glossar als eigene Seite oder als Overlay geführt? Empfehlung: eigene Seite mit Deep-Links, damit Begriffe verlinkbar bleiben.
- Wird die Druckansicht über `@media print` oder eine separate Route erzeugt? Empfehlung: `@media print` auf denselben Routen, keine zweite Datenquelle.
