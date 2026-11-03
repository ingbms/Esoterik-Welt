# Informationsarchitektur — Themenmodul „Radiästhesie, Pendeln und Orakel“

Stand: 2. November 2026 · Status: Implementierungsvorgabe · keine Produktivänderung in diesem Paket
Grundlage: Master-Task ESOW-RAD-000 (§4 Informationsarchitektur), Bestandsaufnahme des
bestehenden Codes (`index.html`, `js/main.js`, `css/design-system.css`, `css/main.css`,
`js/modules/astrologie*.js`).

## 1. Ziel und Nicht-Ziele

Das Modul ist ein eigenständiges Hauptnavigationsziel. Es führt in drei verwandte,
aber getrennte Praktiken ein, macht Tradition und Prüfstand unterscheidbar und bietet
ein Nachschlagewerk (Glossar, Quellen, Methodik).

Nicht enthalten und nicht zu simulieren:

- keine Wirkungsbehauptung für Rute, Pendel oder Tafel,
- keine erfundenen Messwerte, Bovis-Zahlen als „Messung“ oder Feldstärken,
- keine Diagnosen, Heil-, Geld- oder Existenzprognosen,
- keine Gesundheits- oder Standortdaten der Besucher,
- keine Vermischung von Radiästhesie und Divination in einer Seite,
- keine zweite Navigation oder konkurrierende Seiten zu Tarot/Astrologie.

## 2. Struktur

```
Startseite
└─ Hauptnavigation: Pendeln                      ← achtes Ziel, Label „Pendeln“
   ├─ Übersicht (#pendeln)                       ← Landingpage, 3 Einstiege
   │  ├─ Radiästhesie (#pendeln/radiasthesie)    ← Thema 1, Kapitel als Anker
   │  ├─ Pendeln (#pendeln/pendeln)              ← Thema 2, Kapitel als Anker
   │  └─ Orakel (#pendeln/orakel)                ← Thema 3, Kapitel als Anker
   ├─ Glossar (#pendeln/glossar)
   ├─ Quellen & Belege (#pendeln/quellen)
   ├─ Methodik & Grenzen (#pendeln/methodik)
   └─ Suche (#pendeln/suche?q=…)
```

Sieben Routen, drei davon Themenseiten. Kapitel stehen als `<section id>` **innerhalb**
der Themenseite, nicht als eigene Route: Der Bereich soll nicht in dünne Einzelseiten
zerfallen, und die Hauptnavigation darf nicht doppelt auf dieselben Inhalte zeigen.
Eine Ausnahme ist ausdrücklich erlaubt und in §5 geregelt (Kapitel über 1.500 Wörter).

## 3. Einstieg in der Hauptnavigation

### 3.1 Label und Position

**Label: „Pendeln“.** Position: zwischen „Runen“ und „Wissen“.

Begründung: „Radiästhesie“ (12 Zeichen) ist der Oberbegriff, aber für Einsteiger der
unbekanntere Begriff; „Pendeln“ ist die konkrete Praxis und passt in das kurze
Labelmuster der bestehenden Ziele (Start, Tarot, Kristalle, Mondphasen, Astrologie,
Runen, Wissen). Der volle Modultitel steht als H1 auf der Landingpage.

### 3.2 Messung: acht Ziele in der Kopfzeile

Gemessen mit `scripts/measure-nav.cjs` an einer Probe mit acht Zielen, Favoritenzähler
und dreistelligem Zähler (`♥ 128`, Worst Case), je Breite frisch geladen
(`messung/nav-8-ziele.json`):

| Breite | Modus | Reserve im Kopfzeilen-Innenraum |
| ---: | --- | ---: |
| 780 | Mobile Menü | – |
| 781 | horizontal, kompakt | **31,8 px** (engster Punkt) |
| 800 | horizontal, kompakt | 50,8 px |
| 840 | horizontal, kompakt | 90,8 px |
| 900 | horizontal, kompakt | 150,8 px |
| 960 | horizontal | 161,3 px |
| 1100 | horizontal | 301,3 px |
| 1121 | horizontal (Gap springt auf 20 px) | **88,3 px** (zweitengster Punkt) |
| 1200 | horizontal | 167,3 px |
| 1440 | horizontal | 407,3 px |

Ohne die beiden Regeln aus §3.3 ist die Reserve bei 781 px **−21,4 px**: Die Kopfzeile
läuft über, sobald ein Besucher Kristall-Favoriten gespeichert hat (der Zähler wird von
`js/modules/crystals.js` dynamisch in `.header-inner` gehängt). Das ist der Grund, warum
die folgenden zwei Regeln verbindlich sind.

### 3.3 Zwei Regeln in gemeinsamen Dateien (verbindlich)

**a) `css/main.css`** — direkt nach dem bestehenden Block
`@media (min-width: 781px) and (max-width: 1120px)` (Zeile ~3832, Kommentar
„Kopfzeile mit sieben Navigationszielen“):

```css
/* Achtes Navigationsziel: zwischen 781 und 900 px fehlten 21 px, sobald der
   Favoritenzähler sichtbar ist. Kleineres Logo und engerer Listenabstand
   schaffen 53 px Reserve; bei 781 px bleiben 31,8 px (dreistelliger Zähler). */
@media (min-width: 781px) and (max-width: 900px) {
  .logo {
    font-size: 24px;
  }
  .nav-list {
    gap: var(--space-1);
  }
}
```

**b) `css/design-system.css`** — im Block `@media (max-width: 780px)`:

```css
/* Gestapeltes Menü: align-items erbt sonst `center` aus der Desktop-Regel,
   wodurch die Ziele auf Textbreite schrumpfen und mittig stehen. */
.nav-list {
  align-items: stretch;
}
```

Wirkung geprüft: Mobilmenü bei 390 px — acht Zeilen à 342 × 48 px, linksbündig,
Trennlinie über die volle Breite, aktives Ziel in Sand mit Sand-Unterlinie
(`messung/zustaende/menue-offen-390.png`).

### 3.4 Markup des Zieleintrags

```html
<li>
  <a href="#pendeln" class="nav-link" data-page="pendeln">Pendeln</a>
</li>
```

`js/main.js` setzt `.active` und `aria-current="page"` beim Navigieren selbst
(`navigateTo`, Zeile ~316). Kein `aria-current` im statischen Markup der Startseite.

## 4. Router-Integration (`js/main.js`)

Vier Einfügepunkte, analog zum Astrologiebereich. Zeilennummern beziehen sich auf den
Stand vom 2. November 2026.

**a) Seitenliste (Zeile 21):**

```js
const MAIN_PAGES = ['home', 'tarot', 'crystals', 'moon', 'runes', 'astrologie', 'blog', 'pendeln'];
```

**b) Bereichsroute (nach Zeile 30):**

```js
// Das Themenmodul ist eine Seite mit eigenen Unterrouten:
// #pendeln, #pendeln/radiasthesie, #pendeln/glossar, #pendeln/suche?q=pendel …
// Alles nach „pendeln“ bekommt das Modul; unbekannte Slugs beantwortet es mit
// einer bereichsinternen Fehleransicht statt mit dem globalen Routenhinweis.
const PENDELN_ROUTE = /^pendeln(?:\/([^?]*))?(?:\?(.*))?$/;
```

**c) `parseRoute` (nach dem Astrologie-Block, vor `if (PAGE_IDS.has(raw))`):**

```js
const pendeln = PENDELN_ROUTE.exec(raw);
if (pendeln) {
  return {
    type: 'pendeln',
    page: 'pendeln',
    segments: String(pendeln[1] || '').split('/').filter(Boolean),
    query: pendeln[2] || '',
    raw,
  };
}
```

**d) `applyRoute` (nach dem Astrologie-Zweig):**

```js
if (route.type === 'pendeln') {
  clearRouteNotice();
  navigateTo('pendeln', replace, {
    fromHistory,
    instant,
    silent,
    hash: `#${route.raw}`,
    subroute: { segments: route.segments, query: route.query },
  });
  return;
}
```

**e) Metadaten (`PAGE_META`):**

```js
pendeln: {
  title: 'Radiästhesie, Pendeln und Orakel — Tradition und Prüfstand | Esoterik-Welt',
  description:
    'Radiästhesie, Pendeln und Orakel: Instrumente, Geschichte und Handhabung im Überblick — mit Kennzeichnung von Tradition, Hypothese und geprüftem Befund, ohne Wirkungsversprechen.',
},
```

**f) Modul (bei den übrigen Modulen in `init()`):**

```js
state.modules.pendeln = new RadiasthesieModule(document.getElementById('pendelnRoot'));
```

und für den Kaltstart, analog zu `initialRoute.type === 'astrologie'`:

```js
if (initialRoute.type === 'pendeln') {
  try {
    await state.modules.pendeln.load();
  } catch (error) {
    console.error('Radiästhesie-Daten nicht verfügbar', error); // Modul zeigt eigene Fehleransicht
  }
}
```

**Modulvertrag:** `show(segments, query, { focus })` — der Router ruft es in
`navigateTo` auf (Zeile ~296) und fängt ein Promise ab. Das Modul rendert in
`#pendelnRoot`, setzt `document.title` je Route, verschiebt den Fokus auf die H1
(`tabindex="-1"`) und schreibt **nie** selbst in `history` (das bleibt im Router).

**HTML-Gerüst in `index.html`** (zwischen Runen- und Blog-Abschnitt):

```html
<section id="pendeln" class="page" aria-label="Radiästhesie, Pendeln und Orakel" hidden>
  <div class="container">
    <noscript>
      <div class="astro-callout astro-callout--limit">
        <p><strong>Dieser Bereich braucht JavaScript.</strong> Die Inhalte liegen als lokale
        Datendatei im Projekt; es wird nichts nachgeladen und nichts übertragen.</p>
        <p>Kurzfassung ohne Skript: Radiästhesie ist der Oberbegriff für Ruten- und
        Pendelpraxis; der Bereich beschreibt Instrumente, Geschichte und Forschungsstand,
        ohne eine Wirkung zu behaupten.</p>
      </div>
    </noscript>
    <div id="pendelnRoot" class="rad-root"></div>
  </div>
</section>
```

## 5. Seitenvorlagen

### 5.1 Landingpage `#pendeln`

Reihenfolge (verbindlich):

1. Hero: Eyebrow, H1, Lead (max. 58 Zeichen je Zeile), Primäraktion, Textlink,
   3 Kennzahlen, Instrumententafel.
2. **Einordnungsband** (Pflicht, nicht schließbar).
3. Drei Themenkarten (Radiästhesie, Pendeln, Orakel) mit Instrument, drei Stichworten
   und einem Link.
4. Stufenlegende A–E.
5. Werkstatt-Teaser (drei Karten mit Zustand im Text).
6. Verwandte Themen mit Typzeile: sieben vorhandene Anschlüsse und die zwei
   benannten Lücken (Geomantie, Kraftorte) ohne Link.
7. Einordnungskasten (drei Absätze).

Kein Inhaltsverzeichnis auf der Landingpage — sie ist kurz genug, und ein
Verzeichnis würde die drei Einstiege konkurrenzieren.

### 5.2 Themenseite `#pendeln/{radiasthesie|pendeln|orakel}`

1. Brotkrümel: „Pendeln / {Thema}“.
2. Seitenkopf: Label, H1, Untertitel (Mono), Lead, Stufen-Chips (2–4), Metazeile
   (Stand, Muster-/Prüfstatus).
3. **Einordnungsband**.
4. Zweispaltiges Layout: Textspalte + Seitenleiste (Inhaltsverzeichnis, Kasten
   „Auf einen Blick“).
5. Kapitel als `<section>` mit H2, Fließtext, ggf. Instrumententafel, Hinweisbox,
   Schrittliste, Evidenztafel.
6. Aufklappbares Quellenpanel.
7. „Weiterlesen“ (drei bis fünf Verweise: verknüpfte Themen mit Abgrenzung,
   ein Nachbarthema, Glossar).
8. Einordnungskasten.
9. Seitenleiste: Inhaltsverzeichnis (sticky ab 1200 px), Kasten mit vier Kennzahlen
   und Link auf die Methodik.

### 5.3 Glossar `#pendeln/glossar`

1. Brotkrümel.
2. Seitenkopf (Dokumenttitel 56 px, Lead erklärt die Stufen).
3. Suche (max. 560 px) + Buchstabenleiste (44 × 44 px).
4. Buchstabengruppen mit Kopf und Zähler; je Begriff: Begriff, Stufen-Chip,
   Definition (60 ch), „Siehe“-Verweis.
5. Abschluss „Begriffe fehlen?“ mit Rückweg zur Themenseite.

### 5.4 Quellen `#pendeln/quellen`

Liste aller Quellen (S1…Sn) mit Herausgeber, Typ, Abrufdatum, Prüftiefe
(Volltext/Abstract/Snippet), Interessenvermerk und den zugehörigen Aussagen-IDs.
Format wie `.astro-source-card`; je Quelle ein Anker `#quelle-S1`.

### 5.5 Methodik `#pendeln/methodik`

Sechs Abschnitte in fester Reihenfolge: Arbeitsannahme · Kennzeichnung A–E ·
Was geprüft wird · Was dieser Bereich nicht tut · Umgang mit Quelleninteressen ·
Datenschutz (keine Erhebung, keine Konten).

### 5.6 Suche `#pendeln/suche?q=`

Clientseitig über Titel, Kurztext, Stichwörter und Glossarbegriffe. Treffer nach Typ
gruppiert, Trefferzahl in `aria-live="polite"`, maximal 50 Treffer, danach Hinweis
„Suche verfeinern“. Leerzustand nennt drei Vorschläge und verlinkt die Landingpage.

## 6. Kapitelinventar (Zuordnung der Redaktionsaufträge)

Die zehn Inhalte aus ESOW-RAD-00 §4 werden auf drei Themenseiten verteilt. Jedes
Kapitel ist eine `<section id="…">` und steht im Inhaltsverzeichnis.

| Kapitel (Master-Auftrag) | Route | Anker |
| --- | --- | --- |
| Übersichtsseite | `#pendeln` | – |
| Was ist Radiästhesie? | `#pendeln/radiasthesie` | `#was` |
| Ruten, Winkelruten, Biotensoren | `#pendeln/radiasthesie` | `#instrumente` |
| Geschichte der Radiästhesie | `#pendeln/radiasthesie` | `#geschichte` |
| Wissenschaftliche Erklärungen und Untersuchungen | `#pendeln/radiasthesie` | `#befunde` |
| Pendeln lernen | `#pendeln/pendeln` | `#lernen` |
| Pendelarten und Materialien | `#pendeln/pendeln` | `#arten` |
| Pendeltafeln und radiästhetische Skalen | `#pendeln/pendeln` | `#tafeln` |
| Kartenpendeln und Fernmutung | `#pendeln/pendeln` | `#karten` |
| Orakel und Divination (inkl. Tarot, Runen, I Ging) | `#pendeln/orakel` | `#orakel` |
| Interaktives Pendellabor | eigene Route der Werkstatt (`#pendeln/labor`, Karte ESOW-RAD-07) | – |

**Regel für ausgegliederte Kapitel:** Übersteigt ein Kapitel 1.500 Wörter, darf es eine
eigene Route `#pendeln/{thema}/{kapitel}` bekommen. Dann gilt: Kapitel-Teaserkarte auf
der Themenseite, Inhaltsverzeichnis verlinkt auf die Route, keine Doppelung des Textes.
Die Entscheidung trifft die Redaktion, nicht die Implementierung.

## 7. SEO/GEO

- **Titel je Route** (Setzung im Modul, nicht im statischen `<title>`):
  - `#pendeln`: „Radiästhesie, Pendeln und Orakel — Tradition und Prüfstand“
  - `#pendeln/radiasthesie`: „Radiästhesie — Ruten, Geschichte und Forschungsstand“
  - `#pendeln/pendeln`: „Pendeln — Arten, Materialien, Tafeln und Bovis-Skalen“
  - `#pendeln/orakel`: „Orakel — Pendelorakel, Tarot, Runen und I Ging im Vergleich“
  - `#pendeln/glossar`: „Glossar — Radiästhesie, Pendeln und Orakel von A bis Z“
  - `#pendeln/quellen`: „Quellen und Belege — Radiästhesie und Pendeln“
  - `#pendeln/methodik`: „Methodik und Grenzen — wie dieser Bereich prüft“
- **Beschreibungen**: 120–160 Zeichen, nennen den Prüfstand („ohne Wirkungsversprechen“).
- **H1**: genau eine je Ansicht, identisch mit dem Thema, keine Keyword-Stapel.
- **Semantik**: `<article>` je Themenseite ist nicht nötig; `<main>` → `<section>` →
  `<h2>` reicht. Brotkrümel als `<nav aria-label="Brotkrümelnavigation">` mit `<ol>`.
- **Strukturierte Daten**: `BreadcrumbList` für die Themenseiten ist zulässig und
  sinnvoll; `Article` nur, wenn ein Veröffentlichungsdatum und eine Redaktion
  tatsächlich existieren. Kein `FAQPage` ohne echte FAQ-Seite.
- **Bildtexte**: Alt-Text beschreibt das Motiv, nicht die Deutung; Bildunterschrift
  nennt Maß, Herkunft und Grenze (siehe `asset-liste.md`).
- **GEO**: Jede Aussage trägt eine Stufe (A–E), jede Quelle ein Abrufdatum. Damit sind
  Sätze zitierfähig, ohne dass die Seite Wirkung behauptet.

### Grenze der Hash-Routen (offen benannt)

Die Seite ist eine Einzeldokument-SPA mit Hash-Routen. Suchmaschinen indexieren
`#pendeln/radiasthesie` **nicht** als eigene Seite; Canonical bleibt die Modul-URL.
Wenn einzelne Themenseiten eigenständig ranken sollen, braucht es statische Dokumente
pro Route (eigener Build-Schritt) — das ist eine Architekturentscheidung außerhalb
dieses Pakets und muss vor der Content-Produktion entschieden werden. Der Entwurf
funktioniert in beiden Fällen unverändert, weil die Ansichten bereits als reine
Funktionen (Daten → HTML) gedacht sind.

## 8. Zustände und Fehler

| Situation | Verhalten |
| --- | --- |
| Unbekannter Slug (`#pendeln/xyz`) | Bereichsinterne Fehleransicht: „Diese Seite gibt es nicht“, drei Vorschläge, Link zur Übersicht; Fokus auf die H1 der Fehleransicht |
| Leere Suche (`?q=`) | Hinweis „Bitte Suchbegriff eingeben“ + Vorschläge, kein leeres Ergebnis |
| Keine Treffer | Ergebniszähler 0 in `aria-live`, drei Vorschläge, Link zum Glossar |
| Daten nicht ladbar | Modul zeigt Fehlerbox mit „Erneut laden“; restliche Website bleibt funktionsfähig |
| JavaScript aus | `<noscript>`-Kurzfassung im Abschnitt (siehe §4) |
| Direktlink/Kaltstart | Inhalt rendern, dann Fokus setzen; `document.title` vor dem Fokus setzen |
| Zurück/Vorwärts | Filter- und Suchzustand über Query-Parameter erhalten |

## 9. Interne Verlinkung

- Jede Themenseite verlinkt mindestens zwei andere Module (Tarot, Astrologie,
  Kristalle, Mondphasen) und **nie** auf sich selbst als „verwandt“.
- Verwandte Themen stehen am Artikelende als Liste mit Typzeile und einem Satz
  Abgrenzung — keine Kachelwand, keine Wiederholung der Hauptnavigation.
- Quellenmarker `[Sxx]` im Text sind Links auf `#pendeln/quellen` (Anker `#quelle-Sxx`).
- Jede Quellenkarte verlinkt zurück auf die Seiten, die sie verwenden.
- Keine Sackgassen: Fehleransicht, Suche und Glossar führen immer zurück zur Übersicht.

### Umsetzungsstand der Vernetzung (RAD-11)

Die Liste der verwandten Themen steht als `vernetzung` in
`docs/radiasthesie-konzept/daten/taxonomie.json`; der Generator löst jede Route
gegen die vorhandenen Kapitel auf und bricht bei einem toten Anker ab. Die
Startseite zeigt alle Einträge, jede Themenseite die für sie hinterlegten. Ein
Thema ohne Bestand (Geomantie, Kraftorte) ist als Lücke mit dokumentierter
Zielentscheidung geführt und wird **nicht** auf ein ähnliches Kapitel
umgebogen. Die Rückrichtung in das Modul trägt der websiteweite Footer
(„Radiästhesie & Pendeln“); die anderen Module bleiben unverändert.
