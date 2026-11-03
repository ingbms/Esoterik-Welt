# Informationsarchitektur — „Farbwelten & Farbtherapie“

Stand: 3. November 2026 · Status: verbindliche Umsetzungsvorgabe
Grundlage: Master-Auftrag §2 (Taxonomie), §5 (Farbseiten), §6 (Chakren),
§10 (Interaktion), Bestandsaufnahme in `01-bestandsaufnahme.md`.

Geltungsbereich: **zwölf Farbwelten** — acht Spektralfarben (Rot, Orange, Gelb,
Grün, Türkis, Blau, Indigo, Violett), zwei nichtspektrale Mischfarben (Magenta,
Rosa) und zwei Neutralfarben (Weiß, Schwarz) — dazu die Chakrenseite und die
Wissensseite „Lichtfrequenzen“. Paletten und Kontraste: `03`.

## 1. Ziel und Nicht-Ziele

Der Bereich erklärt Farben in fünf getrennten Perspektiven — Physik, Wahrnehmung,
Psychologie, Tradition, medizinisch untersuchte Lichtwirkung — und macht die
Unterschiede zwischen ihnen sichtbar, ohne sie zu vermischen.

**Nicht Ziele:** keine zweite Hauptnavigation, keine zweite Artikelliste, keine
echten Pfade ohne Router, keine Heilversprechen, keine erfundenen Chakra- oder
Krebs-Heilfrequenzen, keine Duplizierung der Kristall- oder Blogdaten.

## 2. Routen

Die Website ist eine Ein-Dokument-Anwendung (Hash-Routen, siehe `01` §1). Der
Bereich bekommt **eine** Hauptroute mit Unterrouten; die Unterrouten sind
Ansichten von `index.html`, keine eigenen Dokumente.

| Route | Ansicht | Inhalt | Status |
| --- | --- | --- | --- |
| `#farbwelten` | Einstieg | Hero, Farbtafel (12 Bänder), Farbregister (12), zwei Einstiege (Chakren, Lichtfrequenzen), Methodenhinweis | Pflicht |
| `#farbwelten/rot` | Farbdetail | Skelett A–H, siehe §5 | Pflicht |
| `#farbwelten/orange` | Farbdetail | dito | Pflicht |
| `#farbwelten/gelb` | Farbdetail | dito | Pflicht |
| `#farbwelten/gruen` | Farbdetail | dito | Pflicht |
| `#farbwelten/tuerkis` | Farbdetail | dito; Spektralfarbe im Übergangsbereich 490–520 nm (Konvention) | Pflicht |
| `#farbwelten/blau` | Farbdetail | dito | Pflicht |
| `#farbwelten/indigo` | Farbdetail | dito | Pflicht |
| `#farbwelten/violett` | Farbdetail | dito | Pflicht |
| `#farbwelten/magenta` | Farbdetail | dito; nicht spektral, ohne Wellenlängenangabe | Pflicht |
| `#farbwelten/rosa` | Farbdetail | dito; nicht spektral, ohne Wellenlängenangabe | Pflicht |
| `#farbwelten/weiss` | Farbdetail | dito; Neutralfarbe, ohne Wellenlängenangabe | Pflicht |
| `#farbwelten/schwarz` | Farbdetail | dito; Neutralfarbe, ohne Wellenlängenangabe | Pflicht |
| `#farbwelten/chakren` | Übersicht | 7 Chakren, Farbe–Chakra-Zuordnung, interaktive Figur, historische Einordnung | Pflicht |
| `#farbwelten/lichtfrequenzen` | Wissensseite | Spektrum, Frequenz-/Energierechnung, Lichttherapie-Einordnung, Disclaimer-Platzhalter | Pflicht |
| `#chakren` | Alias | leitet auf `#farbwelten/chakren` um (replace) | Kompatibilität |
| `#lichtfrequenzen` | Alias | leitet auf `#farbwelten/lichtfrequenzen` um (replace) | Kompatibilität |

Das sind **14 Routen**: zwölf Farbdetailseiten plus Chakren- und Wissensseite;
die beiden Alias-Routen kommen ohne eigene Ansicht hinzu.

**Reihenfolge der zwölf Farben** (verbindlich, Register und Farbtafel folgen
dem Array in `js/data/farbwelten.js`): Rot, Orange, Gelb, Grün, Türkis, Blau,
Indigo, Violett, Magenta, Rosa, Weiß, Schwarz. Sie folgt dem Spektralverlauf
und hängt die nichtspektralen (Magenta, Rosa) und neutralen Farben (Weiß,
Schwarz) hinten an — die λ-Achse bleibt davon unberührt (§8).

**Warum Unterrouten statt eigener Seiten:** Das Radiästhesie-Modul hat dasselbe
Muster (`#pendeln/<thema>`) eingeführt; der Router versteht bereits Segmente
(`parseRoute` → `PENDELN_ROUTE`). Ein zweites Muster würde zwei Routerpfade,
zwei Fokuslogiken und zwei Dokumentationswege erzeugen. Die vom Auftrag
genannten Pfade `/farbwelten`, `/chakren`, `/lichtfrequenzen` werden über die
Alias-Routen erreichbar; echte Pfade würden einen Static-Site-Router und neue
Dokumente erfordern — beides ist mit der bestehenden Architektur nicht vereinbar.

## 3. Einstieg in der Hauptnavigation

### 3.1 Entscheidung

**Neuntes Hauptziel, Label „Farben“**, Position zwischen „Pendeln“ und „Wissen“.

Begründung: „Farben“ ist der kürzeste belastbare Begriff (6 Zeichen) und passt
zum Muster der übrigen Ziele (Start, Tarot, Runen, Wissen). Der volle Titel
„Farbwelten“ steht als H1 und als Breadcrumb-Wurzel.

### 3.2 Messung (Chromium 1208, Windows 11, frisch geladen je Breite)

Reserve = Innenbreite `.header-inner` minus Summe aller sichtbaren Kindbreiten
minus Zwischenabstände; der Favoritenzähler ist als Kind enthalten.

| Breite | 8 Ziele, ♥0 | 8 Ziele, ♥128 | 9 Ziele „Farben“, ♥128 | 9 Ziele „Farbwelten“, ♥128 |
| ---: | ---: | ---: | ---: | ---: |
| 781 | 45,33 | 31,80 | **−16,20** | −41,20 |
| 800 | 64,33 | 50,80 | **2,80** | −22,20 |
| 840 | 104,33 | 90,80 | 42,80 | 17,80 |
| 900 | 164,33 | 150,80 | 102,80 | 77,80 |
| 901 | 115,84 | 102,31 | 50,31 | 25,31 |
| 960 | 174,84 | 161,31 | 109,31 | 84,31 |
| 1120 | 270,84 | 257,31 | 205,31 | 180,31 |
| 1440 | 420,84 | 407,31 | 335,31 | 310,31 |

Der Wert **31,80 px bei 781 px** für acht Ziele reproduziert exakt die im
Radiästhesie-Konzept dokumentierte Reserve (`docs/radiasthesie-konzept/messung/
nav-8-ziele.json`) — die Messmethode ist damit gegen den bestehenden Stand
validiert. Rohdaten: `messung/nav-9-ziele-farben.json`,
`messung/nav-9-ziele-farbwelten.json`, Zusammenfassung über
`python docs/farbwelten-konzept/scripts/summary-nav.py`.

### 3.3 Verworfene Varianten

| Variante | Ergebnis | Grund der Ablehnung |
| --- | --- | --- |
| 9 Ziele, bestehende Regeln | −16,20 px bei 781 px | Überlauf, Zähler und Font-Fallbacks verschärfen ihn |
| 9 Ziele + Logo 22 px, Abstand 4/12 px, Zählerrand 0 | 3,55 px bei 781 px | zu wenig Puffer für Plattform-Fonts |
| 9 Ziele + 12-px-Navigation | 43,08 px | verletzt die 13-px-Untergrenze des Systems |
| Label „Farbwelten“ statt „Farben“ | 25,31 px bei 901 px | 25 px teurer ohne inhaltlichen Gewinn in der Kopfzeile |
| Neunter Punkt in „Wissen“ verstecken | – | Hauptthema wäre nicht auffindbar; Master-Auftrag fordert eigenen Bereich |

### 3.4 Verbindliche CSS-Änderungen (minimal, begründet)

1. `css/design-system.css`: Mobilmenü-Grenze von 780 px auf **900 px** anheben
   (`@media (max-width: 780px)` → `(max-width: 900px)`, Block mit `.nav-toggle`,
   `.nav-list`, `.nav-link`, `.logo`).
2. `css/main.css`: Kompaktblock von `(min-width: 781px)` auf `(min-width: 901px)`
   verschieben.
3. `css/main.css`: den Block `@media (min-width: 781px) and (max-width: 900px)`
   (Logo 24 px, Listenabstand 4 px) **entfernen** — er wird durch Schritt 1
   gegenstandslos.

Wirkung: 781–900 px erhalten das gestapelte Menü (9 Zeilen à 48 px, gemessen:
457 px Listenhöhe bei 844 px Viewporthöhe, kein Überlauf). Ab 901 px bleiben
alle neun Ziele sichtbar, mit **50,31 px** Reserve im Worst Case.

Markup des Zieleintrags:

```html
<li>
  <a href="#farbwelten" class="nav-link" data-page="farbwelten">Farben</a>
</li>
```

## 4. Bereichsnavigation innerhalb der Sektion

Keine zweite horizontale Leiste. Drei Orientierungsmittel, die die bestehende
Seite schon kennt:

1. **Breadcrumb** (`<nav aria-label="Brotkrümelnavigation"><ol>`):
   `Start › Farben › Rot` — auf jeder Unterroute, letzte Stufe `aria-current="page"`.
2. **Farbregister** auf der Einstiegsseite (12 Zeilen, durchnummeriert 01–12) und
   als „Weitere Farben“ (3 Karten) am Ende jeder Farbdetailseite. Die drei Karten
   sind die nächsten Einträge der Registerreihenfolge (zyklisch), nicht die
   Verwandtschaftsliste; die steht im Register selbst als Text („Verwandt: …“).
3. **Inhaltsverzeichnis** (`<details class="astro-toc">` mobil, sticky Spalte
   ≥1100 px) auf Farbdetail- und Wissensseiten.

Damit bleibt die Hauptnavigation ein Ziel pro Bereich, wie bei „Pendeln“.

## 5. Seiten-Skelett der Farbdetailseiten (A–H)

Jede der zwölf Seiten nutzt exakt dieselben acht Abschnitte in derselben
Reihenfolge; nur Inhalt, Typ-Label und Palettenvariable wechseln.

| # | Abschnitt | Anker | Pflichtinhalt | Evidenz |
| --- | --- | --- | --- | --- |
| A | Die Farbe erleben | `#erleben` | Farbfläche, 3–5 Nuancen, Wellenlängenbereich (nur Spektralfarben), Typ-Label (Spektralfarbe / nicht spektral / Neutralfarbe) | Fakten |
| B | Physikalische Eigenschaften | `#physik` | bei Spektralfarben Wellenlänge, Frequenz, Photonenenergie; bei nichtspektralen und neutralen Farben stattdessen Entstehung (Mischung, Additivität, Remission/Absorption), jeweils ohne erfundene Messwerte | Messwert bzw. Erklärung |
| C | Farbpsychologie | `#psychologie` | typische Assoziationen, Kontext, kulturelle Unterschiede, Stand der Forschung | Empirie |
| D | Spirituelle Bedeutung | `#tradition` | traditionelle Symbolik, Chakra-Zuordnung, Meditationsbezug, Herkunft der Zuordnung | Deutungstradition |
| E | Farbtherapeutische Anwendung | `#anwendung` | traditionelle Praxis, behauptete Wirkungen, untersuchte Ansätze, Grenzen | gemischt, je Aussage markiert |
| F | Kultur und Geschichte | `#geschichte` | historische Verwendung, Kunst/Religion/Alltag, regionale Unterschiede | historisch |
| G | Entdecken und ausprobieren | `#uebung` | freiwillige Reflexionsübung, Dauer, Abbrechen, kein Heilsversprechen | Erfahrung |
| H | Quellen und verwandte Themen | `#quellen` | Quellenliste mit Datum, interne Links (Chakren, Lichtfrequenzen, Kristalle, Blog) | Beleg |

Regeln:

- Abschnitte C–F tragen je einen **„Tradition und Forschung“**-Kasten, wenn
  eine konkrete Behauptung sowohl traditionell als auch untersucht existiert.
  Kein Kasten ohne konkreten Anlass (keine Dekoration).
- Jede Seite beginnt mit einer **Kennzeichnungszeile** (Evidenzstufen der Seite,
  `astro-kennzeichnung`), nicht mit einer Farbe.
- Die Übung (G) ist immer abbrechbar, ohne Speicherung personenbezogener Daten.
- Quellen (H) nennen Publikationstyp und Datum; keine DOI ohne Prüfung.

**Nichtspektrale und neutrale Farben:** Magenta und Rosa (Typ „nicht spektral“)
sowie Weiß und Schwarz (Typ „Neutralfarbe“) tragen in A das Typ-Label statt
eines Wellenlängenbereichs; in B erklären Faktenzeilen und Absätze Mischung,
Additivität, Remission und Absorption. `wavelength`, `frequency` und
`photonEv` bleiben dort leer — `verify-farbwelten-sync` wertet jeden Wert als
Fehler. Türkis ist Spektralfarbe und wird mit 490–520 nm als Konvention geführt
(Übergangsbereich, Überschneidung mit Grün und Blau wird benannt).

## 6. Einstiegsseite `#farbwelten` — Reihenfolge

1. Hero: H1, Lede, eine Hauptaktion („Farbwelten entdecken“), Farbtafel rechts —
   **zwölf Bänder** in Registerreihenfolge, je Band Farbfeld (40 %) und
   Labelplatte mit Wellenlängenbereich bzw. Typ-Label und Name. Keine feste
   4:5-Box mehr; jedes Band hat mindestens 44 px Höhe, die Platte wächst mit
   dem Inhalt (kein Überlauf ab 320 px).
2. Farbregister: **zwölf Zeilen**, durchnummeriert 01–12 (Name,
   Wellenlänge/Frequenz bzw. „keine Wellenlänge“, Chakra-Zuordnung,
   Kurzbeschreibung, Verwandte, Pfeil).
3. Zwei Einstiege: „Chakren & Farben“, „Lichtfrequenzen & Einordnung“.
4. Methodenhinweis: warum Tradition und Forschung getrennt markiert werden;
   Link auf `#farbwelten/lichtfrequenzen`.
5. Abschluss: Verweis auf Kristalle (Farbe → Material) und Blog.

## 7. Chakrenseite `#farbwelten/chakren`

- H1 „Chakren & Farben“, Lede mit dem Hinweis, dass die Regenbogenfolge eine
  moderne Standardisierung ist.
- Interaktive Figur (7 Schaltflächen) + Detailspalte (Name, Sanskrit, Position,
  Symbolfarbe, Themen, Einordnung, Link zur Farbwelt).
- Tabelle „Farbe–Chakra“ als `<table>` mit `<caption>` (nicht als Bild).
- Abschnitt „Warum haben die sieben Chakren die Farben des Regenbogens?“ mit
  historischer Einordnung (Quellen aus der Recherche).
- Abschnitt „Wissenschaftliche Einordnung“: Was Chakren sind (Deutungsmodell),
  was nicht (anatomische Organe, messbare Energiezentren).

## 8. Wissensseite `#farbwelten/lichtfrequenzen`

- H1 „Lichtfrequenzen und wissenschaftliche Einordnung“.
- Spektrum-Explorer (Slider 380–780 nm, Frequenz-/Energieanzeige, Kennzeichnung
  als Simulation) — Pflichtfunktion des Master-Auftrags, Umsetzung in FW-07.
- Die **λ-Achse bleibt 380–780 nm** und führt ausschließlich Wellenlängen.
  Nichtspektrale und neutrale Farben (Magenta, Rosa, Weiß, Schwarz) liegen
  nicht auf der Achse; sie werden oberhalb als verlinkte Liste mit Typ-Label
  geführt. Türkis erscheint nicht als eigene Achsenstufe, sondern ist als
  Übergangsbereich 490–520 nm (Konvention) benannt.
- Rechenwege als Text: `f = c/λ`, `E ≈ 1239,842/λ`; Einheiten und Grenzen.
- Lichttherapie/Photobiologie: kurze, quellenbelegte Einordnung, keine Anwendungstipps.
- **Disclaimer-Platzhalter** (verbindlich, Text von der Redaktion zu füllen):
  `[DISCLAIMER-PLATZHALTER: keine medizinische Beratung, keine Heilversprechen,
  Lichtexposition mit UV/Laser nur fachlich begleitet.]`
- Verweis auf Farbpsychologie-Forschung und auf die Farbseiten.

## 9. Interne Verlinkung (Pflichtkanten)

| Von | Nach | Grund |
| --- | --- | --- |
| jede Farbseite D | `#farbwelten/chakren` | Chakra-Zuordnung prüfen |
| jede Farbseite B | `#farbwelten/lichtfrequenzen` | Physik vertiefen |
| Chakrenseite | die sieben Farbseiten mit Chakra-Zuordnung (Rot bis Violett) | Zuordnung Farbe–Chakra |
| Lichtfrequenzen | alle zwölf Farbseiten („Zurück zu den Farbwelten“) | Rückweg |
| Lichtfrequenzen (Explorer) | Magenta, Rosa, Weiß, Schwarz | nicht auf der λ-Achse, deshalb verlinkt statt eingezeichnet |
| Farbseiten | `#crystals` (gefiltert nach Farbe/Chakra, falls Filter-URL vorhanden) | Materialbezug |
| Farbseiten | `#blog` (passende Artikel) | Redaktion |
| Einstieg | `#farbwelten/chakren`, `#farbwelten/lichtfrequenzen` | zwei Hauptpfade |

Keine Links in neue, leere Ziele; jede Kante muss zum Redaktionsschluss auf
existierenden Inhalt zeigen.

## 10. Titel, Meta und strukturierte Daten

| Route | `<title>` | Meta-Description (≤155 Zeichen) |
| --- | --- | --- |
| `#farbwelten` | Farbwelten — Bedeutung, Physik und Tradition der Farben \| Esoterik-Welt | Zwölf Farbwelten zwischen Licht, Wahrnehmung und Tradition: Wellenlängen, Assoziationen, Chakren und Forschungsstand differenziert erklärt. |
| `#farbwelten/rot` | Rot — Licht, Wirkung und Bedeutung \| Esoterik-Welt | Rot zwischen 620 und 750 nm: Physik, Farbpsychologie, kulturelle Symbolik, Chakra-Zuordnung und die Grenzen farbtherapeutischer Behauptungen. |
| `#farbwelten/orange` | Orange — Licht, Wirkung und Bedeutung \| Esoterik-Welt | Orange zwischen 590 und 620 nm: Wahrnehmung, Assoziationen, kulturelle Bedeutung, Sakralchakra und der Unterschied zwischen Tradition und Befund. |
| `#farbwelten/gelb` | Gelb — Licht, Wirkung und Bedeutung \| Esoterik-Welt | Gelb zwischen 570 und 590 nm: Helligkeitswirkung, Assoziationen, Symbolik, Solarplexuschakra und die Grenzen der Farbpsychologie. |
| `#farbwelten/gruen` | Grün — Licht, Wirkung und Bedeutung \| Esoterik-Welt | Grün zwischen 490 und 570 nm: Wahrnehmung, Beruhigungsassoziationen, Natur- und Herzsymbolik, Forschungslage und offene Fragen. |
| `#farbwelten/tuerkis` | Türkis (Cyan) — Übergang zwischen Grün und Blau \| Esoterik-Welt | Türkis (Cyan) als Übergangsbereich um 490–520 nm (Konvention): Physik, Assoziationen, Tradition und die Grenzen der Farbtherapie. |
| `#farbwelten/blau` | Blau — Licht, Wirkung und Bedeutung \| Esoterik-Welt | Blau zwischen 450 und 490 nm: Physik, Farbpsychologie, Halschakra und die gut untersuchte Rolle von Licht für die innere Uhr. |
| `#farbwelten/indigo` | Indigo — Licht, Wirkung und Bedeutung \| Esoterik-Welt | Indigo zwischen 425 und 450 nm: schmaler Spektralbereich, kulturelle Deutungen, Stirnchakra und die Herkunft der modernen Zuordnung. |
| `#farbwelten/violett` | Violett — Licht, Wirkung und Bedeutung \| Esoterik-Welt | Violett zwischen 380 und 425 nm: kurzwelliges Licht, Symbolik, Kronenchakra, Abgrenzung zu Magenta und der Stand der Forschung. |
| `#farbwelten/magenta` | Magenta — Mischfarbe aus Rot und Blau \| Esoterik-Welt | Magenta ist nicht spektral: additiver Rot-Blau-Mix, Physik, Farbpsychologie, Symbolik und die Grenzen therapeutischer Behauptungen. |
| `#farbwelten/rosa` | Rosa — Mischfarbe aus Rot und Weiß \| Esoterik-Welt | Rosa als Rot-Weiß-Mischung: Sättigung, Helligkeit, kulturelle Bedeutung und die Grenzen der Farbpsychologie — ohne Heilversprechen. |
| `#farbwelten/weiss` | Weiß — Neutralfarbe aus allen Wellenlängen \| Esoterik-Welt | Weiß als Superposition und Remission: warum es keine eigene Wellenlänge hat, was die Forschung sagt und was Tradition bleibt. |
| `#farbwelten/schwarz` | Schwarz — Neutralfarbe ohne Lichtreiz \| Esoterik-Welt | Schwarz als Absorption ohne Lichtreiz: Physik, kulturelle Deutungen, Farbpsychologie und die klaren Grenzen der Farbtherapie. |
| `#farbwelten/chakren` | Chakren und Farben — Zuordnung und Herkunft \| Esoterik-Welt | Die sieben Chakren, ihre Farbzuordnung und die Geschichte des Regenbogenmodells — als Tradition gekennzeichnet, wissenschaftlich eingeordnet. |
| `#farbwelten/lichtfrequenzen` | Lichtfrequenzen und wissenschaftliche Einordnung \| Esoterik-Welt | Wellenlänge, Frequenz und Photonenenergie berechnen; Lichttherapie und Photobiologie mit Quellen und klaren Evidenzgrenzen. |

Regeln:

- Pro Route genau eine H1, Titel und H1 dürfen sich unterscheiden.
- Canonical bleibt `https://ingbms.github.io/Esoterik-Welt/` (Hash-Ansichten
  erben sie); `sitemap.xml` erhält **keine** neuen Einträge — wie beim
  Radiästhesie-Modul dokumentiert.
- `BreadcrumbList` nur mit sichtbarem Breadcrumb; `Article` nur auf Seiten mit
  Autor/Datum; `FAQPage` nur bei echtem Frage-Antwort-Block.
- OpenGraph/Twitter wie im Bestand über `<meta>`; Bild optional (SVG-Farbtafel
  ist kein OG-Bild).

## 11. Datenmodell (verbindlich)

Ein Modul, eine Datenquelle, zwölf Ansichten. Umgesetzt als ES-Module in
`js/data/farbwelten.js` (erzeugt aus `content/farbwelten/*.md`); Paletten sind
CSS-Tokens in `css/design-system.css` und stehen nicht im Datenobjekt (`03` §7).

```js
// js/data/farbwelten.js — Auszug, Feldnamen wie implementiert
export const SOURCES = {
  24: { id: '24', label: 'NIST SP 330, SI-Broschüre', url: 'https://…', shortRef: false },
  // … 15 weitere
};

export const FARBWELTEN = [
  {
    id: 'rot',
    name: 'Rot',
    route: '#farbwelten/rot',
    type: 'spectral', // 'spectral' | 'non-spectral' | 'neutral'
    typeLabel: 'Spektralfarbe', // 'Spektralfarbe' | 'nicht spektral' | 'Neutralfarbe'
    spectral: true,
    wavelength: { min: 620, max: 750, label: '620–750 nm' },
    frequency: { min: 400, max: 484, label: '400–484 THz' },
    photonEv: { min: 1.653, max: 2, label: '1,65–2,00 eV' },
    chakra: 'root',
    summary: '…',
    meta: { title: '…', description: '…' },
    sections: {
      erleben: [/* Blöcke */],
      physik: [/* Blöcke */],
      /* … psychologie, tradition, anwendung, geschichte, uebung … */
      quellen: [/* type: 'list', items: ['[1] …', '…'] */],
    },
    sources: ['1', '2', '3', '4', '5', '7', '9', '10', '24', '31'],
    related: ['chakren', 'lichtfrequenzen', 'crystals'],
    verwandt: ['orange', 'magenta', 'rosa'],
    register: {
      id: 'rot',
      name: 'Rot',
      route: '#farbwelten/rot',
      kurz: '…',
      typLabel: 'Spektralfarbe',
      verwandt: ['orange', 'magenta', 'rosa'],
      chakra: 'root',
    },
  },
  // … elf weitere in Registerreihenfolge
];

// js/data/chakren.js — Felder entsprechen Master-Auftrag §6.2/§13.2
export const CHAKREN = [
  {
    id: 'root',
    sanskrit: 'Mūlādhāra',
    deutsch: 'Wurzelchakra',
    position: 'Steißbeinbereich',
    farbe: 'rot',
    farbweltId: 'rot',
    themen: ['Stabilität', 'Erdung', 'Sicherheit'],
    element: null,        // nur setzen, wenn traditionsbezogen belegbar
    mantra: null,         // dito
    historie: '…',        // Herkunft der Farbzuordnung, mit Quelle
    einordnung: 'Spirituelle Deutungstradition, keine medizinische Größe',
    quellen: ['…'],
  },
  // … sechs weitere
];
```

**Registerreihenfolge:** Rot, Orange, Gelb, Grün, Türkis, Blau, Indigo, Violett,
Magenta, Rosa, Weiß, Schwarz. Sie ist die Reihenfolge des Arrays und steuert
Farbtafel, Register (01–12) sowie die Karten „Weitere Farben“ (die jeweils
nächsten drei Einträge, zyklisch).

**Nichtspektrale und neutrale Welten** (Magenta, Rosa, Weiß, Schwarz) lassen
`wavelength`, `frequency` und `photonEv` weg; `typeLabel` trägt dort
„nicht spektral“ bzw. „Neutralfarbe“. `verify-farbwelten-sync` wertet jeden
Wert in diesen Feldern als Fehler; `verify-farbwelten` prüft im gerenderten
Register, dass für alle vier „keine Wellenlänge“ steht. Türkis ist `spectral`
mit 490–520 nm (Konvention).

Blocktypen (rendern ohne HTML-Injektion, Text bleibt Text):
`{ type: 'p', text }`, `{ type: 'list', items: [] }`, `{ type: 'facts', rows: [[label, value]] }`,
`{ type: 'compare', tradition: {...}, research: {...}, note }`,
`{ type: 'evidence', level, text }`, `{ type: 'quote', text, source }`.

`ResearchEvidence` (Master §13.2) wird nicht in die Farbseiten eingebettet,
sondern als eigene Liste `js/data/evidence.js` geführt; Farbseiten referenzieren
per `evidenceId`. So bleibt die Quellenprüfung an einer Stelle.

## 12. Zustände

| Zustand | Verhalten |
| --- | --- |
| Laden | Daten sind statisch importiert; kein Ladezustand nötig. Bei Fetch-Variante: Text „Inhalte werden geladen …“ + `aria-busy`. |
| Fehler | Route unbekannt → bestehende `showRouteNotice`-Meldung („gehört zu keiner Seite“). Fehlende Farbe → Hinweis + Link zum Farbregister. |
| Leer | Abschnitt ohne Inhalt wird nicht gerendert (keine leeren Überschriften). |
| Auswahl | Chakra-Knoten `aria-pressed`, Panel höflich (`aria-live="polite"`), Fokus bleibt am Knoten. |
| Reduced Motion | Übergänge 0,01 ms; keine bewegten Verläufe; Auswahl sofort sichtbar. |
