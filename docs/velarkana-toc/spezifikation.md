# Spezifikation: Automatisches Seiten-Inhaltsverzeichnis (TOC) für VELARKANA

**Status:** Entwurf zur Umsetzung · **Version:** 1.0 · **Stand:** 4. November 2026
**Aufgabe:** Kanban `t_5edc1d8c` (Teil von `t_296b0496`, Pilot „Automatisches Seiten-Inhaltsverzeichnis“)
**Rolle:** Principal Software Architect (Spezifikation, keine Implementierung)
**Geltungsbereich:** Astro-Projekt VELARKANA, Pilotseite `/frequenzen/quellen.html`; Komponente zur späteren Wiederverwendung
**Codebasis der Untersuchung:** `ingbms/velarkana-dev`, Branch `astro-migration`, Commit `9d14d37`
(lokaler Worktree `C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_7ad19549`, Astro 7.4.5)
**Ablage:** `docs/velarkana-toc/spezifikation.md`; Messwerkzeug `scripts/toc/heading-inventory.cjs`

**Herkunft und Übergabe.** Diese beiden Dateien liegen im Aufgaben-Workspace
`C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_5edc1d8c` (Branch `wt/t_5edc1d8c`, Basis `9f58439`), weil
die Karte dort ausgeführt wurde. Die untersuchte und für die Umsetzung maßgebliche Codebasis ist
jedoch `ingbms/velarkana-dev`, Branch `astro-migration`, Commit `9d14d37` (identisch mit dem Worktree
`…/.worktrees/t_7ad19549`). Beide Dateien sind unverändert in diesen Branch zu übernehmen; die
Seitenintegration erfolgt ausschließlich dort. Der Aufgabenbranch enthält keine Änderung an
Produktionscode.

> **Kurzfassung.** Das TOC wird serverseitig aus den gerenderten Überschriften der Seite aufgebaut
> (Astro-Content-Collections liefern `headings`), als `<aside>` mit nativem `<details>` gerendert und
> per minimalem JavaScript um Scroll-Spy und Mobil-Verhalten ergänzt. Anker-IDs bleiben unverändert;
> fehlende IDs werden nach der normativen Slug-Regel (github-slugger 2.0.0) deterministisch erzeugt.
> Der Pilot läuft ausschließlich auf `/frequenzen/quellen.html` (29 Einträge, alle IDs vorhanden).
> Die vier Werkzeugseiten des Bereichs Frequenzen sind ausdrücklich **nicht** Teil des Piloten, weil
> ihre Überschriften erst im Browser entstehen (46 h3 ohne ID auf `/frequenzen/`).

---

## 1. Zweck und Geltung

Diese Spezifikation legt fest, **was** das automatische Seiten-Inhaltsverzeichnis leisten muss, **wie**
Überschriften ausgewählt, verankert und verschachtelt werden und **womit** Implementierung und
unabhängige QA das Ergebnis prüfen. Sie enthält keine Gestaltungsentscheidung jenseits der
funktionalen und barrierefreien Grenzen; die visuelle Ausarbeitung liefert das Design-Dokument
(`t_fd9d97f0`). Bei Widerspruch gilt: diese Spezifikation für Verhalten, Anker, Zustände und
Abnahmekriterien; das Design-Dokument für Typografie, Farben, Abstände und Mockups.

**Verbindlichkeit der Wörter:** „muss“ ist abnahmerelevant, „soll“ ist Regel mit begründeter Ausnahme,
„kann“ ist optional. Jedes Muss-Kriterium trägt eine ID (`AK-…`) und ist in §8 einem Testfall
zugeordnet.

**Keine Produktionsänderung:** Dieses Dokument ändert weder Seiten noch Komponenten. Es beschreibt den
Sollzustand für `t_3c130426` (Implementierung) und die Prüfbasis für `t_436eeffb` (QA).

---

## 2. Ausgangslage und Belege

### 2.1 Untersuchter Korpus

Gemessen an der gebauten Astro-Ausgabe (`dist/`, 145 HTML-Dateien, 144 Seiten) mit
`scripts/toc/heading-inventory.cjs`:

| Kennzahl | Wert |
|---|---|
| HTML-Dateien (ohne `_astro/`) | 145 |
| Überschriften h1–h6 im `<main>` | 1.101 |
| TOC-Kandidaten (h2–h6, ohne `sr-only`/`hidden`) | 946 |
| Kandidaten ohne ID | 474 (überwiegend clientseitig gerenderte Such-/Werkzeugvorlagen) |
| h4, h5, h6 | **0** |
| Seiten mit doppelten IDs | 1 (`farbwelten/index.html`) |
| Seiten mit doppelten Überschriftentexten | 2 (`farbwelten/index.html`, `pendeln/suche.html`) |
| Seiten ohne h2–h6 im Hauptinhalt | `404.html`; Werkzeugseiten serverseitig ohne Artikelüberschriften |

**Folgerung:** Standardebenen sind h2 und h3. h4 ist konfigurierbar, aber nicht Standard, weil im
gesamten Bestand keine h4 existiert und jede automatische Aufnahme derzeit wirkungslos wäre.
Doppelte IDs existieren bereits heute und dürfen durch das TOC nicht vermehrt werden.

### 2.2 Stichproben (kurz/lang, Ebenen, Duplikate, Umlaute)

| Seite | Typ | Überschriften | Befund |
|---|---|---|---|
| `/frequenzen/quellen.html` | langer Fließtext (Pilot) | 14×h2, 15×h3 = **29 Kandidaten** | alle 29 mit ID; Umlaute (`6-einzelprüfungen`), Sonderzeichen (`≠`, `–`, `/`), längster Text 63 Zeichen; keine JS-Überschriften |
| `/frequenzen/` | Werkzeugseite | serverseitig 0, nach JS **51** (4×h2, 46×h3) | **46 h3 ohne ID**, 45 Bibliothekseinträge → für ein TOC ungeeignet |
| `/frequenzen/labor.html` | Werkzeugseite | serverseitig 0, nach JS 9×h2 | alle IDs vorhanden (`fq-…-title`) |
| `/frequenzen/cymatics.html` | Werkzeugseite | nach JS 2×h2 | IDs vorhanden |
| `/frequenzen/meditation.html` | Werkzeugseite | nach JS 3×h2 | IDs vorhanden |
| `/farbwelten/rot.html` | mittellanger Artikel | 8×h2 im Artikel | keine h3, keine Duplikate |
| `/farbwelten/index.html` | Übersicht | 15×h2 im main | **doppelte ID `entries-title`** aus zweimal `EntryIndex` (`sr-only`); doppelte Texte „Zwölf Farbwelten“, „Themenseiten“ |
| `/radiasthesie/pendeln.html` | Artikel mit bestehendem TOC | 13×h2, 5×h3 (Server), 22 nach JS | bestehendes TOC: 10 Links, `nav aria-label="Inhaltsverzeichnis"`, **kein `aria-current`**, Sticky wirkungslos (siehe R-2) |
| `/radiasthesie/quellen.html` | sehr langer Text | 3×h2, 66×h3 | längste Überschrift **235 Zeichen** |
| `/index.html` | Startseite | 3×h2, 9×h3 im main | 9 h3 ohne ID; Kartenraster |
| `/404.html` | Fehlerseite | 0 | Leerzustand-Fall |

### 2.3 Warum die Pilotseite `/frequenzen/quellen.html` ist

Die Aufgabe verlangt den Pilotbereich Frequenzen und dort **eine repräsentative längere Artikelseite**.
`/frequenzen/quellen.html` ist die einzige Seite des Bereichs, deren Inhalt serverseitig als
zusammenhängender Artikel gerendert wird (Markdown-Collection `dokumente` → `render(entry)`), mit
29 Überschriften, echten IDs und ohne nachgeladene Inhaltsbereiche. Die vier Werkzeugseiten rendern
ihre Inhalte erst im Browser (siehe 2.2); ein serverseitiges TOC wäre dort leer oder falsch. Ein
clientseitiger Aufbau für diese Seiten ist als Erweiterung definiert (§6.11), aber **nicht Teil des
Piloten**.

### 2.4 Bereits vorhandene Muster (nicht ändern, aber beachten)

| Muster | Vorkommen | Merkmale |
|---|---|---|
| `.astro-toc` | Radiästhesie/Pendeln (7 Fragmente) | `<details open><summary>Auf dieser Seite</summary><nav aria-label="Inhaltsverzeichnis"><ol>…`; Sidebar `.astro-aside`, ab 1200 px `position: sticky`; **kein Scroll-Spy**; `align-self` fehlt → Sticky greift nicht |
| `.fw-toc` | Farbwelten-CSS (ungenutzt im Astro-Build) | `position: sticky`, `align-self: start`, `max-height`, `overflow:auto`; unter 900 px statisch mit `details`-Summary |
| `.fq-nav` | Frequenzbereich | Bereichsnavigation mit `aria-current="page"`, **kein** Seiten-TOC |

Das neue TOC verwendet **eine eigene Klasse** (`.page-toc`) und die Semantik von `.astro-toc`, aber
nicht dessen defektes Sticky-Verhalten. Bestehende TOCs bleiben unangetastet (AK-R2).

### 2.5 Relevante technische Vorbedingungen (gemessen)

* Globale Anker-/Scrollregel vorhanden: `html { scroll-behavior: smooth; scroll-padding-top: calc(var(--header-height) + var(--space-4)); }`, `prefers-reduced-motion` setzt `scroll-behavior: auto` (`src/styles/design-system.css`, Zeilen 22–31).
* Headerhöhe: `--header-height: 100px` (Desktop), `84px` (mobil); gemessen 101 px bzw. 85 px.
* Pilotseite bei 1440 px: `.prose` = 720 px breit, Container 1360 px → ausreichend Platz für eine 240–280-px-Spalte.
* Pilotseite bei 390 px: **bestehender** horizontaler Überlauf durch eine Tabelle (516 px; `scrollWidth` 540 statt 390). Das ist ein vorbestehender Defekt (R-1), nicht Folge des TOC.
* `headings` aus `render(entry)` ist in Astro 7 für Content-Collections verfügbar; die im Build erzeugten IDs entsprechen exakt github-slugger 2.0.0 (versionsgepinnt als Astro-Abhängigkeit, `node_modules/github-slugger`).

---

## 3. Scope und Nicht-Ziele

### 3.1 Im Scope

1. Wiederverwendbare Komponente `TableOfContents.astro` plus Auslieferungs-Skript für Scroll-Spy,
   ID-Härtung und Mobil-Zustand.
2. Integration **ausschließlich** auf `/frequenzen/quellen.html`.
3. Konfiguration (Titel, Ebenen, Mindestanzahl, Sticky-Offset, globaler Schalter).
4. Anker- und Slug-Regeln inklusive Duplikaten, Umlauten und Sonderzeichen.
5. Barrierefreiheit, No-JS-Fallback, Mobile-Verhalten, Leerzustand, Performance-Budgets.
6. Abnahmekriterien und Testfälle (dieses Dokument).
7. Messwerkzeug `scripts/toc/heading-inventory.cjs` (reproduzierbare Kandidatenprüfung).

### 3.2 Nicht-Ziele

* Keine Aktivierung auf weiteren Seiten oder Bereichen (kein globaler Rollout).
* Keine Änderung an Inhalten, Überschriften, IDs bestehender Seiten oder an bestehenden TOCs.
* Keine Gestaltungsentscheidung (Farben, Typografie, Abstände) über die in §6.7/§6.8 genannten Grenzen hinaus.
* Kein Ersatz/Migration des statischen Radiästhesie-TOC.
* Kein TOC für clientseitig gerenderte Werkzeugseiten im Piloten.
* Keine Suche, Filter, Druckverzeichnis, PDF-Erzeugung, Fortschrittsanzeige, „Zurück nach oben“-Button.
* Keine Persistenz des Auf-/Zuklappzustands, keine Nutzerpräferenzen, keine Analytics.
* Keine Änderung an `BaseLayout`, `SiteHeader`, `SiteFooter` oder am globalen Seitenraster anderer Seiten.
* Keine neuen externen Ressourcen, CDNs, Fonts oder Tracker.

---

## 4. Entscheidungen (Architektur)

| ID | Entscheidung | Begründung |
|---|---|---|
| D-1 | Pilotseite ist `/frequenzen/quellen.html`. | Einzige serverseitig gerenderte lange Artikelseite des Bereichs (29 Kandidaten, 29 IDs). |
| D-2 | Die vier Werkzeugseiten bleiben im Piloten ohne TOC. | Überschriften entstehen erst im Browser; 46 h3 ohne ID auf `/frequenzen/`. |
| D-3 | Die Komponente wird **auf Seitenebene** eingebunden, `BaseLayout` bleibt unverändert. | Kein Eingriff in das geteilte Layout = kein Regressionsrisiko für 144 Seiten. |
| D-4 | Standardebenen sind h2 und h3; h4–h6 sind per Konfiguration zuschaltbar. | Kein h4 im Bestand; h2/h3 tragen die Gliederung. |
| D-5 | Anker-IDs werden nie umgeschrieben. Fehlende IDs werden mit github-slugger 2.0.0 erzeugt. | Deep-Link-Stabilität; identische Regel wie Astro-Markdown. |
| D-6 | Die Liste wird serverseitig gerendert; JavaScript ergänzt nur IDs, Scroll-Spy und Mobil-Zustand. | No-JS-Navigation, kein Layoutsprung, minimale Client-Last. |
| D-7 | Markup: `<aside class="page-toc">` → `<details>` → `<summary>` + `<nav aria-label="Inhaltsverzeichnis">` → `<ol>`. | Semantik des bestehenden, abgenommenen Musters; eigene Klasse gegen Kollisionen. |
| D-8 | Desktop ab 1200 px: Sticky-Sidebar rechts mit `align-self:start`, `max-height`, eigenem Scrollbereich. Darunter: statisch oberhalb des Artikels. | Gleicher Breakpoint wie `.astro-layout`/`.fw-toc`; behebt den Sticky-Fehler des Bestands. |
| D-9 | Auf < 1200 px ist das `<details>` standardmäßig zu (mit JavaScript); ohne JavaScript bleibt es offen. | Kompakt mobil, ohne die No-JS-Nutzbarkeit zu verlieren. |
| D-10 | Feature-Schalter: `src/lib/toc.ts` mit Defaults und Umgebungs-Killswitch `TOC_DISABLED=1`; Aktivierung je Seite durch Einbinden der Komponente. | Versehentlicher Rollout unmöglich; Notaus ohne Codeänderung. |
| D-11 | Keine Kürzung von Einträgen im DOM, keine Nummerierung, kein „mehr anzeigen“. | Screenreader und Tastatur erhalten den vollständigen Text; Auswahl erfolgt über Ebenen. |
| D-12 | Überschriften in `sr-only`, `hidden`, `aria-hidden="true"` oder `[data-toc-skip]` werden übersprungen. | Verhindert Duplikate wie `entries-title` und unsichtbare Einträge. |

---

## 5. Datenmodell und Konfiguration

### 5.1 Typen

```ts
// src/lib/toc.ts
export interface TocHeading {
  depth: number; // 2..6
  slug: string;  // vorhandene oder erzeugte ID
  text: string;  // sichtbarer Text, Whitespace normalisiert
}

export interface TocOptions {
  title: string;          // sichtbarer Titel, Default: 'Auf dieser Seite'
  levels: number[];       // Default: [2, 3]
  minHeadings: number;    // Default: 3
  stickyOffset: string;   // CSS-Ausdruck, Default: 'calc(var(--header-height) + var(--space-6))'
  dynamic: boolean;       // Default: false (siehe §6.11)
}

export const TOC_DEFAULTS: TocOptions = {
  title: 'Auf dieser Seite',
  levels: [2, 3],
  minHeadings: 3,
  stickyOffset: 'calc(var(--header-height) + var(--space-6))',
  dynamic: false,
};

export const TOC_ENABLED = process.env.TOC_DISABLED !== '1';
```

`Astro`-`headings` aus `render(entry)` sind strukturell kompatibel (`depth`, `slug`, `text`) und werden
unverändert übergeben. Eine Umschlüsselung darf nur diese drei Felder übernehmen.

### 5.2 Komponenten-Schnittstelle

```astro
<TableOfContents
  headings={headings}          <!-- Pflicht -->
  title="Auf dieser Seite"     <!-- optional -->
  levels={[2, 3]}              <!-- optional -->
  minHeadings={3}              <!-- optional -->
  stickyOffset="calc(var(--header-height) + var(--space-6))"
  dynamic={false}
/>
```

* Ohne `headings` oder bei `TOC_ENABLED === false` rendert die Komponente **nichts** (kein Kommentar, kein leerer Container).
* Wenn nach Filterung weniger als `minHeadings` Einträge bleiben, rendert sie **nichts**.
* Ein zusätzlicher `BaseLayout`-Prop ist nicht erforderlich; die Seitenintegration erfolgt im
  Seiten-Template (siehe §9.1).

### 5.3 Aktivierung je Seite

```astro
---
const entry = await getEntry('dokumente', 'frequenz-quellen');
const { Content, headings } = await render(entry);
---
<BaseLayout …>
  <div class="page-body page-body--toc">
    <TableOfContents headings={headings} />
    <article class="prose" data-toc-scope>
      <Content />
    </article>
  </div>
</BaseLayout>
```

* `data-toc-scope` kennzeichnet den Bereich, aus dem JavaScript IDs ergänzt bzw. (bei `dynamic`) Einträge liest.
* Die Komponente steht im DOM **vor** dem Artikel (Lesereihenfolge = visuelle Reihenfolge auf Mobil; auf Desktop per Grid rechts). Das entspricht der begründeten Reihenfolge des bestehenden Radiästhesie-Musters (WCAG 1.3.2).

---

## 6. Funktionale Anforderungen

### 6.1 Auswahl der Überschriften (F-1)

1. Quelle sind ausschließlich die der Komponente übergebenen `headings` (serverseitig) bzw. – nur bei
   `dynamic` – die Überschriften im `[data-toc-scope]`-Bereich.
2. Einbezogen werden genau die Ebenen aus `levels` (Default 2, 3) in Dokumentreihenfolge.
3. Nicht einbezogen werden:
   * `h1`,
   * Überschriften mit `class="sr-only"`, `hidden`, `aria-hidden="true"` oder `[data-toc-skip]`,
   * Überschriften außerhalb des Scope-Bereichs (Kopf, Fuß, Navigation, Breadcrumbs),
   * Überschriften ohne Text nach Normalisierung.
4. Textnormalisierung: Inline-Markup entfernen, HTML-Entitäten auflösen, Folgen von Whitespace zu
   einem Leerzeichen, außen trimmen. Der Text wird **nicht** gekürzt.
5. Bleiben weniger als `minHeadings` Einträge, wird kein TOC gerendert (Leerzustand, §6.6).

### 6.2 Reihenfolge und Verschachtelung (F-2)

1. Die Reihenfolge ist exakt die Dokumentreihenfolge; es wird nicht sortiert oder gruppiert.
2. Die Verschachtelung folgt der Überschriftenhierarchie: Eine Überschrift der Ebene *n+1* wird Kind
   der letzten eingeschlossenen Überschrift einer niedrigeren Ebene.
3. Wird eine Ebene übersprungen (z. B. h2 → h4, weil h3 nicht in `levels` ist), wird die tiefere
   Überschrift Kind der nächsthöheren eingeschlossenen Überschrift. Es entstehen **keine** leeren
   Zwischenebenen und kein Sprung um mehr als eine sichtbare Einrückungsstufe.
4. Beginnt der Artikel mit h3, wird dieser Eintrag auf oberster Ebene geführt.
5. Die Liste bleibt eine geordnete Liste (`<ol>`), auch wenn sie nur eine Ebene hat.

### 6.3 Anchor-IDs (F-3, normativ)

1. **Bestehende IDs sind unveränderlich.** Das TOC übernimmt `slug` unverändert; die ID-Liste der
   Pilotseite vor und nach der Änderung muss identisch sein (29 IDs, §14.1).
2. **Fehlende IDs** werden deterministisch erzeugt:
   * Algorithmus: `github-slugger` **2.0.0**, Modus „neue Instanz pro Dokument“, Aufruf in Dokumentreihenfolge.
   * Der Slug wird aus dem normalisierten Text gebildet.
   * Ist das Ergebnis ein leerer String (z. B. Text nur aus `???` oder Emoji), wird `abschnitt-<n>` verwendet (`n` = 1-basierter Index im Scope); Kollisionen werden nach Regel 3 behandelt.
   * Die ID wird sowohl am Ziel (`<h2 id=…>`) als auch im Link (`href="#…"`) aus **demselben** Wert gesetzt.
3. **Duplikate:** Die zweite Vergabe eines bereits vorhandenen Slugs erhält `-1`, die dritte `-2` usw.
   (github-slugger-Verhalten). Die Deduplizierung berücksichtigt **alle** bereits im Dokument
   vorhandenen IDs, nicht nur die TOC-Kandidaten.
4. **Umlaute und Sonderzeichen bleiben erhalten** (keine ASCII-Transliteration), weil die bestehenden
   Markdown-IDs sie enthalten. Beispiele: `6-einzelprüfungen`, `einführung-warum-farben-uns-berühren`,
   `51-physikalisch--physiologisch`.
5. IDs dürfen mit einer Ziffer beginnen (`6-einzelprüfungen` ist gültig). Implementierungen dürfen
   deshalb **nicht** `querySelector('#…')` mit ungeschütztem Slug verwenden, sondern
   `document.getElementById()` oder `CSS.escape()`.
6. Der Hash wird nicht prozentkodiert in das `href` geschrieben; Browser und Server verarbeiten
   UTF-8-Fragmente. Ein prozentkodierter Aufruf (`#6-einzelpr%C3%BCfungen`) muss dasselbe Ziel
   erreichen (Browser-Standardverhalten, nachzuweisen).
7. Führende/abschließende Bindestriche aus github-slugger (z. B. bei Emoji am Textanfang) werden
   **nicht** geglättet, solange die Regel dadurch deckungsgleich mit Astro-Markdown bleibt.

### 6.4 Markup und Zustände (F-4)

```html
<aside class="page-toc" data-toc aria-labelledby="page-toc-title">
  <details class="page-toc__details" data-toc-details open>
    <summary class="page-toc__summary" id="page-toc-title">Auf dieser Seite</summary>
    <nav class="page-toc__nav" aria-label="Inhaltsverzeichnis">
      <ol class="page-toc__list">
        <li class="page-toc__item page-toc__item--2"><a href="#1-zweck-und-geltungsbereich">1. Zweck und Geltungsbereich</a></li>
        …
      </ol>
    </nav>
  </details>
</aside>
```

* Genau **ein** `nav` mit `aria-label="Inhaltsverzeichnis"` je Seite.
* Der sichtbare Titel ist konfigurierbar; das Landmark-Label bleibt fest „Inhaltsverzeichnis“, damit
  Screenreader-Nutzer und Tests unabhängig vom Titel navigieren können.
* Der aktive Eintrag erhält `aria-current="location"` und eine Klasse (`is-active`); höchstens ein
  Eintrag ist gleichzeitig aktiv.
* Keine ARIA-Rollen, die `<nav>`/`<ol>`/`<li>` ersetzen. Kein `role="navigation"` zusätzlich.
* Zustände: `default`, `hover`, `focus-visible`, `active` (Scroll-Spy), `open`/`closed` (`details`).

### 6.5 Scroll-Spy / aktiver Abschnitt (F-5)

Normatives Ergebnis (Mechanismus ist Implementierungssache; `IntersectionObserver` ist zulässig):

1. Offset-Linie = `--header-height` + 24 px (entspricht `stickyOffset`), Toleranz ±8 px.
2. Aktiv ist die **letzte** Überschrift, deren obere Kante auf oder oberhalb der Offset-Linie liegt.
3. Liegt keine Überschrift oberhalb der Linie (Seitenanfang), ist der erste Eintrag aktiv.
4. Ist das Dokumentende erreicht (`scrollY + innerHeight >= scrollHeight - 2`), ist der letzte Eintrag
   aktiv, damit die letzte Sektion erreichbar markiert werden kann.
5. Beim direkten Aufruf mit Hash ist der zugehörige Eintrag sofort aktiv, auch bevor gescrollt wird;
   die Regel aus 2 darf ihn erst nach einer echten Nutzer-Scrollbewegung ablösen.
6. `hashchange` (Klick auf TOC-Link, manuelle Adressänderung, Zurück/Vorwärts) aktualisiert die
   Aktivierung ohne Neuladen.
7. Neuberechnung nach `resize` (entprellt ≤150 ms), nach `document.fonts.ready`, nach Wechsel des
   `details`-Zustands und nach einem dynamischen Neuaufbau.
8. DOM-Schreibvorgänge nur bei Änderung des aktiven Eintrags; Scroll-Handler `passive`, Arbeit in
   `requestAnimationFrame`, Lesezugriffe gebündelt (kein Layout-Thrashing).
9. Kein `preventDefault` auf Ankerlinks, kein eigenes Smooth-Scrolling. Die vorhandene CSS-Regel
   (`scroll-padding-top` + `scroll-behavior`) übernimmt Positionierung und Bewegung.

### 6.6 Leerzustand (F-6)

* Keine Kandidaten, weniger als `minHeadings` oder alle gefiltert → **kein** `<aside>`, kein `<nav>`,
  kein Platzhalter, keine Meldung im DOM. Die Seite bleibt layoutgleich zur Ausgangsversion.
* Das gilt auch bei deaktiviertem Feature-Schalter und bei fehlenden `headings`.

### 6.7 Sticky, Collapse, Mobile (F-7)

**Desktop (≥ 1200 px):**
* `<aside class="page-toc">` steht in der rechten Grid-Spalte, `position: sticky`,
  `top: var(--toc-sticky-offset)`, `align-self: start` (kein Strecken auf Zeilenhöhe),
  `max-height: calc(100dvh - var(--header-height) - var(--space-12))`, `overflow-y: auto`,
  `overscroll-behavior: contain`.
* Der TOC überdeckt weder Header noch Artikel; `z-index` bleibt unter dem Header.
* Breite 240–280 px; bei 1440 px bleibt die Prose-Breite 720 px (±2 px).

**Mobil/Tablet (< 1200 px):**
* Keine rechte Spalte; das TOC steht als eigener Block **oberhalb** des Artikels, volle Inhaltsbreite.
* `<details>` ist mit JavaScript geschlossen (sofern die Nutzerin es nicht bereits geöffnet hat);
  ohne JavaScript bleibt das serverseitige `open` bestehen (D-9).
* Summary ist Touch-Ziel ≥ 44 × 44 px; die geöffnete Liste schiebt den Artikel nach unten und
  überdeckt ihn nicht.
* Kein horizontaler Überlauf durch das TOC (`overflow-wrap: anywhere` für lange Einträge, keine
  feste Breite, keine negative Margin).

**Grenzfälle:** 1200 px (Umschaltpunkt genau einmal, keine Überlappung), 320 px (Reflow ohne Clipping),
200 % Zoom (bedienbar), Druck (`@media print`: TOC `display:none`).

### 6.8 Barrierefreiheit (F-8)

1. `<nav aria-label="Inhaltsverzeichnis">` als Navigations-Landmark; genau eine Instanz.
2. Liste mit `<ol>`/`<li>`; Linktext = sichtbarer Überschriftentext; vollständig, ohne Ellipse im
   zugänglichen Namen.
3. Tastatur: Summary per Tab erreichbar, Enter/Leertaste toggelt (nativ), alle Links in
   Dokumentreihenfolge per Tab erreichbar, Fokus sichtbar (≥ 2 px, Kontrast ≥ 3:1), keine Falle.
4. `aria-current="location"` genau am aktiven Link; Entfernen beim Wechsel.
5. Kontrast: Linktext ≥ 4,5:1, aktiver Link ≥ 4,5:1, Fokusindikator ≥ 3:1 – in allen vorhandenen
   Themes (Dark/Light) mit den bestehenden Design-Tokens.
6. `prefers-reduced-motion: reduce`: keine erzwungene Bewegung; `scroll-behavior` bleibt `auto`.
7. Zielgrößen: Summary ≥ 44 px Höhe; Links ≥ 24 px Höhe (WCAG 2.2 AA), bei grobem Zeiger ≥ 44 px.
8. Beim Öffnen/Schließen kein Fokusverlust, kein Scroll-Sprung; der Fokus bleibt auf dem Summary.
9. Das TOC ist keine zweite Hauptnavigation: keine Doppelung der Bereichsnavigation, kein
   `aria-current="page"`.

### 6.9 No-JS (F-9)

* Die vollständige Liste wird serverseitig gerendert (29 Links auf der Pilotseite) und ist ohne
  JavaScript sichtbar und bedienbar.
* `<details>` funktioniert nativ; ohne JavaScript ist es auf allen Breiten geöffnet.
* Ankerlinks funktionieren nativ; die Zielposition berücksichtigt den Header über die globale
  `scroll-padding-top`-Regel.
* Ohne JavaScript gibt es **kein** `aria-current` (kein Scroll-Spy) – das ist zulässig und getestet.

### 6.10 Performance (F-10)

* Zusätzliches JavaScript ≤ **5 KB gzip** (inklusive Slug-Bibliothek); CSS-Ergänzung ≤ **1,5 KB gzip**
  im bereits geladenen Stylesheet (kein zusätzlicher CSS-Request).
* Keine neuen Netzwerk-Anfragen außer dem gebündelten Komponenten-Skript; keine externen Ressourcen.
* Kein Layoutsprung (CLS-Beitrag 0): Die Sidebar-Spalte ist serverseitig im Grid reserviert.
* Keine langen Tasks > 50 ms durch das TOC; Scroll-Arbeit ≤ 1 Frame.
* Lighthouse Accessibility 1,0; Performance nicht schlechter als Baseline − 2 Punkte; 0 Konsolenfehler.

### 6.11 Dynamische Überschriften (F-11, außerhalb des Piloten)

* Nur wenn `dynamic` gesetzt ist, darf das Skript fehlende IDs im Scope ergänzen und die Liste aus dem
  DOM neu aufbauen. Es gilt dieselbe Slug-Regel (§6.3), inklusive Deduplizierung gegen alle
  vorhandenen IDs.
* Ohne `dynamic` werden fehlende IDs **nicht** im Browser erzeugt; die serverseitige Liste bleibt
  maßgeblich. (Auf der Pilotseite gibt es keine fehlenden IDs.)
* Für Werkzeugseiten ist `levels={[2]}` vorgesehen, damit die 45 Bibliothekseinträge von
  `/frequenzen/` nicht zu einem unbrauchbaren TOC führen. Diese Aktivierung ist eine spätere
  Entscheidung (O-3).
* Bei `dynamic` und deaktiviertem JavaScript bleibt die serverseitige Liste (falls vorhanden) stehen;
  fehlt sie, gibt es kein TOC.

---

## 7. Abnahmekriterien

Jedes Kriterium ist binär prüfbar. „Nachweis“ nennt das erwartete Artefakt (Testlauf, Messwert,
Screenshot, DOM-Auszug). Die Prüfmethoden sind in §8 als Testfälle ausformuliert.

### 7.1 Aktivierung und Abgrenzung

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-A1 | Auf der Pilotseite existiert genau ein `nav[aria-label="Inhaltsverzeichnis"]` und genau ein `aside.page-toc`. | DOM-Zählung |
| AK-A2 | Auf allen anderen 143 Seiten existiert **kein** `aside.page-toc` und kein zusätzliches `nav[aria-label="Inhaltsverzeichnis"]`; bestehende TOCs (Radiästhesie) bleiben bei 10 Links. | Inventar + DOM-Zählung |
| AK-A3 | Bei `TOC_DISABLED=1` enthält der Build auf der Pilotseite kein TOC; Build und alle Seiten bleiben fehlerfrei. | Build + DOM |
| AK-A4 | Ohne `headings`/bei `minHeadings`-Unterschreitung rendert die Komponente kein Markup (kein leerer Container). | Unit-Test |
| AK-A5 | Die vier Werkzeugseiten `/frequenzen/`, `/frequenzen/labor.html`, `/frequenzen/cymatics.html`, `/frequenzen/meditation.html` bleiben ohne TOC. | DOM-Zählung nach JS |

### 7.2 Inhalt, Reihenfolge, Verschachtelung

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-B1 | Die Pilotseite hat exakt **29** Einträge. | DOM-Zählung |
| AK-B2 | Reihenfolge und Texte entsprechen exakt der Liste in §14.1 (29/29). | Textvergleich |
| AK-B3 | Mit `levels={[2]}` entstehen exakt **14** Einträge, alle h2. | Unit-/DOM-Test |
| AK-B4 | Bei `levels={[2,3,4]}` bleiben 29 Einträge (keine h4 vorhanden), ohne Fehler. | Unit-Test |
| AK-B5 | h1, Footer-Überschriften („Tools“, „Wissen“, „Rechtliches“) und `sr-only`-Überschriften sind nicht enthalten. | DOM-Test |
| AK-B6 | h3-Einträge sind Kinder des vorangehenden h2; kein Eintrag springt um mehr als eine Einrückungsstufe; `ol`-Struktur ist valide. | DOM-Struktur-Test |
| AK-B7 | Kein Eintrag ist im DOM gekürzt (kein `text-overflow`-Abschneiden des zugänglichen Namens). | Code-Review + DOM |
| AK-B8 | Leerzustand: `/404.html` und `/frequenzen/labor.html` (serverseitig 0 Kandidaten) haben kein TOC und keine leere `aside`. | DOM |

### 7.3 Anker und Slugs

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-C1 | Alle 29 `href`-Fragmente lösen im selben Dokument zu genau einem Element auf (0 tote Anker). | Link-Test |
| AK-C2 | Die 29 bestehenden IDs sind vor/nach der Änderung identisch (Liste byte-gleich). | Inventar-Diff |
| AK-C3 | Die Slug-Testvektoren aus §14.3 werden exakt erzeugt. | Unit-Test |
| AK-C4 | Zwei gleiche Überschriften erzeugen `…`, `…-1`; drei erzeugen zusätzlich `…-2`; keine ID doppelt im Dokument. | Fixture-Test |
| AK-C5 | Eine Überschrift ohne ID erhält deterministisch dieselbe ID in Ziel und Link; zwei Builds erzeugen identische IDs. | Fixture + Doppelbuild |
| AK-C6 | Aufruf mit prozentkodiertem Hash (`#6-einzelpr%C3%BCfungen`) und mit rohem Hash landen am selben Ziel und markieren denselben Eintrag. | Playwright |
| AK-C7 | Eine Überschrift nur aus Satzzeichen/Emoji erhält `abschnitt-<n>` statt einer leeren ID. | Unit-Test |

### 7.4 Scroll-Spy

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-D1 | Bei aktivem JavaScript ist zu jedem Zeitpunkt höchstens ein Link `aria-current="location"`; nach dem Laden ist genau einer gesetzt. | Playwright |
| AK-D2 | Ohne Hash ist nach dem Laden der erste Eintrag aktiv. | Playwright |
| AK-D3 | Nach Scrollen zu Überschrift *k* (Abwärtsscroll) ist Eintrag *k* aktiv (Toleranz ±8 px); beim Hochscrollen analog. | Playwright, 3 Stichproben |
| AK-D4 | Am Dokumentende ist der letzte Eintrag aktiv. | Playwright |
| AK-D5 | Deep-Link auf `#6-einzelprüfungen`: Ziel liegt im Fenster `[header+4, header+40]`; Eintrag ist sofort aktiv. | Playwright |
| AK-D6 | `hashchange` ohne Reload aktualisiert die Aktivierung. | Playwright |

### 7.5 Layout, Sticky, Mobile

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-E1 | Bei 1440×900 ist die Sidebar 240–280 px breit, die Prose-Spalte 718–722 px, der Abstand ≥ 32 px. | Messung |
| AK-E2 | Nach 1.500 px Scroll beträgt der Abstand TOC-Oberkante zu Viewport-Oberkante `headerHeight + 24 ± 2` px; die Sidebar ist sichtbar und nicht gestreckt (`height ≈ Inhalt`, nicht `≈ Layouthöhe`). | Messung |
| AK-E3 | Die TOC-Höhe ist ≤ `viewportHeight − headerHeight − 96`; bei Überlauf ist der eigene Scrollbereich nutzbar und der letzte Eintrag per Tastatur erreichbar. | Messung + Tastatur |
| AK-E4 | Bei 390×844 steht das TOC oberhalb des Artikels, ist geschlossen (JS) und öffnet per Summary; die Summary-Höhe ist ≥ 44 px. | Screenshot + Messung |
| AK-E5 | Bei 390 px erzeugt das TOC keinen zusätzlichen horizontalen Überlauf: `scrollWidth` ist nicht größer als der Ausgangswert der Seite (Baseline 540 px; nach Behebung von R-1 ≤ 390 px). | Messung |
| AK-E6 | Bei 1200 px wechselt das Layout genau einmal (Sidebar rechts ↔ Block oben); keine Überlappung von Header, TOC und Artikel. | Messung/Screenshot |
| AK-E7 | Bei 320 px und 200 % Zoom bleibt das TOC bedienbar; kein Clipping, keine horizontale Scrollbar durch das TOC. | Messung |
| AK-E8 | Im Druck ist das TOC ausgeblendet. | Print-Emulation |
| AK-E9 | Das TOC überdeckt den Header nicht (`z-index` unter Header; kein Fixelement über der Kopfzeile). | Screenshot |

### 7.6 Barrierefreiheit

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-F1 | Genau ein Navigations-Landmark „Inhaltsverzeichnis“; Name stammt aus `aria-label`. | DOM/A11y-Baum |
| AK-F2 | Listen-Semantik `ol > li > a` ist vollständig; keine ersetzenden Rollen. | DOM |
| AK-F3 | Tab erreicht Summary und alle 29 Links in Reihenfolge; Enter/Leertaste toggelt; Fokusring sichtbar (≥ 2 px, ≥ 3:1). | Tastatur-Protokoll |
| AK-F4 | Kontrast Linktext/aktiv/Fokus erfüllt 4,5:1 bzw. 3:1 in Dark und Light. | Messung (Design-Tokens) |
| AK-F5 | `prefers-reduced-motion: reduce` → `scroll-behavior: auto`; keine Transition > 0 s, die Bewegung erzwingt. | Computed Style |
| AK-F6 | Summary ≥ 44 px, Links ≥ 24 px hoch; bei `pointer: coarse` ≥ 44 px. | Messung |
| AK-F7 | Screenreader-Grundprüfung: Landmark, Liste, aktueller Eintrag werden korrekt angesagt; keine doppelten Labels. | Manuelles Protokoll |

### 7.7 No-JS

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-G1 | Mit deaktiviertem JavaScript enthält das HTML alle 29 Links. | `javaScriptEnabled:false` |
| AK-G2 | Ohne JavaScript navigieren alle Links korrekt; Ziel liegt unterhalb des Headers. | Playwright, 3 Stichproben |
| AK-G3 | Ohne JavaScript öffnet/schließt das Summary die Liste nativ. | Playwright |
| AK-G4 | Ohne JavaScript ist kein `aria-current` gesetzt und kein leerer/defekter Bereich sichtbar. | DOM |

### 7.8 Performance und Regression

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-H1 | `npm run build`, `npm run check`, `npm run lint`, `npm run format:check` sind grün; 144 Seiten/145 HTML bleiben. | CI-Log |
| AK-H2 | Zusätzliches JS ≤ 5 KB gzip; CSS-Ergänzung ≤ 1,5 KB gzip; 0 neue externe Requests. | Bundle-/Netzwerkmessung |
| AK-H3 | CLS 0; kein sichtbarer Sprung beim Laden (Sidebar-Spalte reserviert). | Lighthouse/PerformanceObserver |
| AK-H4 | Lighthouse der Pilotseite: Accessibility 1,0, Performance ≥ Baseline − 2; 0 Konsolenfehler. | Lighthouse-Bericht |
| AK-H5 | Andere Seiten unverändert: `aside.page-toc`-Anzahl 0; Radiästhesie-TOC weiterhin 10 Links; `farbwelten/index` behält ihre Struktur. | Inventar + Stichprobe |
| AK-H6 | Kein doppeltes `nav`-Label und keine doppelte ID durch das TOC auf der Pilotseite. | DOM |

### 7.9 Dynamik (nicht Pilot, aber Vertrag)

| ID | Kriterium | Nachweis |
|---|---|---|
| AK-I1 | Fixture mit `dynamic`: nach dem Rendern der Überschriften entsteht ein korrektes TOC; fehlende IDs werden nach §6.3 erzeugt; keine Duplikate. | Playwright-Fixture |
| AK-I2 | Ohne `dynamic` und ohne serverseitige `headings` entsteht kein TOC und kein Fehler. | Fixture |
| AK-I3 | `dynamic` ist auf den Pilotseiten nicht aktiv (`data-toc-dynamic` fehlt). | DOM |

---

## 8. Testfälle

Werkzeuge: `node --test`/Jest für Unit-Tests, Playwright (`tests/*.spec.js`) für Browserfälle,
`scripts/toc/heading-inventory.cjs` für Korpusvergleiche, Lighthouse CI für Performance.
Basis-URL im Test: der gebaute Astro-Build (Base-Pfad je Deployment, Anker sind hash-relativ und
damit unabhängig vom Präfix).

| TF | AK | Vorgehen | Erwartung |
|---|---|---|---|
| TF-01 | A1, A5 | Build, alle 145 HTML prüfen: `aside.page-toc`, `nav[aria-label="Inhaltsverzeichnis"]` zählen | Pilot: 1/1; alle anderen: 0 |
| TF-02 | A2, H5 | Inventar vor/nach; Radiästhesie-TOC-Linkzahl; `farbwelten/index`-Struktur | unverändert |
| TF-03 | A3 | `TOC_DISABLED=1 npm run build`; Pilotseite prüfen | kein TOC, Build grün |
| TF-04 | A4, B8 | Komponenten-Unit-Test mit 0/1/2/3 Einträgen; 404 und labor im Build prüfen | 0/1/2 → kein Markup; 3 → Markup |
| TF-05 | B1, B2 | Pilotseite: `ol a` extrahieren und mit §14.1 vergleichen | 29/29, Reihenfolge gleich |
| TF-06 | B3, B4 | `levels={[2]}` bzw. `[2,3,4]` rendern | 14 bzw. 29 |
| TF-07 | B5 | DOM: h1/Footer/sr-only nicht in Liste | 0 Treffer |
| TF-08 | B6 | DOM: `li`-Verschachtelung und Einrückungsstufen | valide, kein Sprung > 1 |
| TF-09 | C1 | Alle `href^="#"` gegen `getElementById` prüfen | 29/29, 0 tot |
| TF-10 | C2 | Inventar-ID-Liste vor/nach (Diff) | identisch |
| TF-11 | C3, C7 | Unit-Test der Slug-Funktion gegen §14.3 inkl. leerem Slug | exakt |
| TF-12 | C4 | Fixture mit 2×/3× „Test“ und vorhandener ID | `test`, `test-1`, `test-2` |
| TF-13 | C5 | Fixture ohne IDs, Build zweimal, IDs vergleichen | identisch, Link = Ziel |
| TF-14 | C6 | Playwright: URL mit `%C3%BC` und rohem Umlaut | gleiches Ziel, gleicher aktiver Eintrag |
| TF-15 | D1–D4 | Playwright: laden, scrollen (3 Positionen), Ende | genau 1 `aria-current`, korrekt |
| TF-16 | D5, D6 | Deep-Link laden; Hash per `location.hash` ändern | Ziel im Offsetfenster; Aktivierung folgt |
| TF-17 | E1, E2 | 1440×900 messen; 1.500 px scrollen | Breiten/Top wie §7.5 |
| TF-18 | E3 | TOC-Höhe bei 900/700/500 px Viewporthöhe; Tastatur bis letzter Eintrag | ≤ Budget; erreichbar |
| TF-19 | E4, E5, E7 | 390×844, 320×640, 200 % Zoom: Position, `scrollWidth`, Summary-Höhe | oben, kein neuer Überlauf, ≥ 44 px |
| TF-20 | E6, E8, E9 | 1200 px, Print-Emulation, Scroll-Screenshot | ein Wechsel, aus im Druck, kein Overlay |
| TF-21 | F1–F6 | A11y-Baum, Tastatur, Kontrastmessung, reduced motion, Zielgrößen | wie §7.6 |
| TF-22 | F7 | Manueller Screenreader-Durchlauf (NVDA/VoiceOver) | Protokoll ohne Befund |
| TF-23 | G1–G4 | Playwright mit `javaScriptEnabled:false` | 29 Links, Navigation, Details, kein aria-current |
| TF-24 | H1–H4 | CI + Lighthouse + Netzwerk-/Bundle-Messung | Budgets eingehalten |
| TF-25 | I1, I2 | Fixture mit nachgeladenen h2/h3 (`dynamic`) | TOC korrekt; ohne dynamic kein TOC |
| TF-26 | I3 | Pilotseite und Werkzeugseiten | kein `data-toc-dynamic` |

---

## 9. Umsetzungshinweise (verbindlich für `t_3c130426`)

### 9.1 Dateien und Schnittstellen

| Datei | Änderung |
|---|---|
| `src/lib/toc.ts` | neu: Typen, Defaults, `TOC_ENABLED`, Slug-Helfer (Wrapper um github-slugger), Filter-/Verschachtelungslogik (pur, testbar) |
| `src/components/TableOfContents.astro` | neu: SSR-Markup, Props, Leerzustand, `data-*`-Haken |
| `src/scripts/toc.ts` (oder gleichwertig) | neu: Scroll-Spy, ID-Härtung nur bei `dynamic`, Mobil-Zustand; als gebündeltes `<script>` der Komponente |
| `src/styles/content.css` | Ergänzung `.page-body--toc`, `.page-toc*`; ausschließlich Tokens |
| `src/pages/frequenzen/quellen.astro` | `headings` aus `render(entry)` übergeben, Grid-Wrapper, `data-toc-scope` |
| `package.json` | `github-slugger` als direkte Abhängigkeit in exakt `2.0.0` (bereits im Lockfile) |
| `tests/toc-*.spec.js`, `tests/toc-unit.mjs` | Unit- und Browserfälle gemäß §8 |

**Nicht ändern:** `BaseLayout.astro`, `SiteHeader.astro`, `SiteFooter.astro`, bestehende
Radiästhesie-Fragmente, Farbwelten-CSS, andere Seiten.

### 9.2 Reihenfolge

1. `src/lib/toc.ts` mit reinen Funktionen + Unit-Tests (Slug, Filter, Verschachtelung, Leerzustand).
2. Komponente + CSS; Pilotseite integrieren.
3. Scroll-Spy und Mobil-Zustand; Browser-Tests.
4. QA-Übergabe mit Screenshots (1440/390), DOM-Auszug, Lighthouse-Bericht, Bundle-Größe.

### 9.3 Nachweisformat für die Übergabe

* Commit-Hash und Branch (Basis `astro-migration`/`9d14d37` oder neuer Integrationsstand).
* Liste der geänderten Dateien.
* `node scripts/toc/heading-inventory.cjs dist --page frequenzen/quellen.html` (29 Kandidaten, 0 ohne ID).
* Playwright-Ergebnis je TF, Lighthouse-JSON, Bundle-Größe.
* Screenshots 1440×900 und 390×844 (offen/geschlossen), Sticky-Zustand nach Scroll.
* Bekannte Abweichungen mit Schweregrad.

---

## 10. Offene Fragen

| ID | Frage | Empfehlung | Auswirkung |
|---|---|---|---|
| O-1 | Soll der erste h2, der den Seitentitel wiederholt („Frequenzen: Quellen, Evidenzstatus und Methodik“), im TOC erscheinen? | Ja, unverändert aufnehmen; bei Bedarf später `[data-toc-skip]` am Inhalt. | Ein Eintrag mehr/weniger; keine Technikänderung. |
| O-2 | Soll h4 künftig Standard sein? | Nein, derzeit 0 h4 im Bestand; bei Bedarf per `levels`. | Keine. |
| O-3 | Sollen `/frequenzen/labor` (9 h2), `/cymatics` (2), `/meditation` (3) nach dem Pilot ein TOC erhalten? | Labor ja (9 h2, statisch nach JS), cymatics/meditation nein (unter Mindestanzahl). Eigene Entscheidung nach Pilot. | Aktivierung weiterer Seiten. |
| O-4 | Soll `/frequenzen/` (46 h3 ohne ID) ein dynamisches TOC mit `levels={[2]}` erhalten? | Nein im Piloten; erst nach stabilem `dynamic`-Modus und UX-Entscheidung. | Clientseitiger Aufbau, 4 Einträge. |
| O-5 | Soll der bestehende Radiästhesie-TOC auf die Komponente migriert werden? | Späterer eigener Task; im Piloten unangetastet (10 Links, kein Scroll-Spy). | Vereinheitlichung, aber Regressionsrisiko. |
| O-6 | Tablet 768–1199 px: geschlossen oder offen? | Geschlossen (konsistent zu „keine dauerhafte Spalte“). | Nur Zustand, kein Layout. |
| O-7 | Aufklappzustand merken? | Nein (keine Persistenz, keine Cookies). | Keine. |
| O-8 | TOC bei genau 2 Einträgen? | Nein (`minHeadings: 3`); 2 Einträge rechtfertigen keine Navigation. | Keine. |

---

## 11. Risiken und Vorbedingungen

| ID | Risiko | Befund/Massnahme |
|---|---|---|
| R-1 | **Vorbestehender horizontaler Überlauf der Pilotseite bei 390 px** | Tabelle 516 px breit → `scrollWidth` 540 statt 390. Nicht durch das TOC verursacht. Muss vor AK-E5 behoben werden (z. B. Tabellen-Wrapper mit `overflow-x:auto` oder `table { display:block; overflow-x:auto }` im Prose-Kontext) oder ausdrücklich als Vorbedingung dokumentiert/gewährt werden. |
| R-2 | **Sticky-Fehler des bestehenden Musters** | `.astro-aside` ist 10.747 px hoch (= Layouthöhe), weil `align-self` fehlt; nach 1.500 px Scroll liegt der TOC bei `top = −680 px`. Das neue TOC muss `align-self:start` + `max-height` + `overflow:auto` setzen; ein bloßes Kopieren von `.astro-toc` erfüllt AK-E2 nicht. |
| R-3 | Kollision mit bestehenden TOCs | Radiästhesie-Fragmente rendern eigene `nav[aria-label="Inhaltsverzeichnis"]`; automatische Aktivierung dort würde doppeln. Pilot bewusst nur auf `quellen.html`; AK-A2/A5 prüfen. |
| R-4 | Design-Dokument läuft parallel (`t_fd9d97f0`) | Diese Spezifikation fixiert nur funktionale Grenzen (Breite, Abstände, Zustände); visuelle Tokens kommen aus dem Design. Bei Konflikt entscheidet das Design über Optik, diese Spezifikation über Verhalten/A11y. |
| R-5 | Deployment-Basispfad (`/velarkana/` vs. `/`) | Anker sind hash-relativ; keine Pfadabhängigkeit. Tests müssen trotzdem gegen den gebauten Base-Pfad laufen (Playwright-Basis-URL). |
| R-6 | `headings`-Form kann sich mit Astro-Version ändern | Implementierung kapselt die Übernahme in `src/lib/toc.ts` (nur `depth/slug/text`) und testet die Struktur. |
| R-7 | Stiller Datenverlust bei JS-Überschriften | Ohne `dynamic` würden nachgeladene Überschriften fehlen. Deshalb Pflicht: Aktivierung nur auf Seiten mit serverseitigen `headings`; `dynamic` explizit. |
| R-8 | Lange Überschriften (bis 235 Zeichen) | Volle Umbrüche, `overflow-wrap:anywhere`, keine Kürzung; Test mit Fixture und realer Seite. |

---

## 12. Enablement-Leitfaden (nach dem Piloten)

1. Seite prüfen: Werden alle Überschriften serverseitig gerendert? (`heading-inventory` und Browser-DevTools vergleichen.)
2. Kandidatenzahl und Duplikate prüfen: `node scripts/toc/heading-inventory.cjs <dist> --page <seite>`.
3. Bestehendes TOC auf der Seite? → nicht zusätzlich aktivieren.
4. Ebenen wählen (Default `[2,3]`; bei vielen h3 nur `[2]`).
5. `headings` aus `render(entry)` übergeben und Komponente einbinden; `data-toc-scope` am Artikel.
6. Abnahmekriterien §7 (mindestens A, B, C, E, F, G) und die zugehörigen Testfälle ausführen.
7. Erst nach dokumentierter Freigabe die nächste Seite aktivieren (kein globaler Schalter).

---

## 13. Abgrenzung: geänderte vs. unveränderte Zustände

| Zustand | Vor der Umsetzung | Nach der Umsetzung |
|---|---|---|
| Pilotseite | 29 Überschriften mit IDs, kein TOC, Prose 720 px, Dokument ohne Aside | TOC mit 29 Einträgen, gleiche IDs, Prose 720 ± 2 px, Sidebar rechts ab 1200 px |
| Übrige 143 Seiten | unverändert | unverändert (AK-A2/H5) |
| Radiästhesie-TOC | 10 Links, kein `aria-current`, Sticky faktisch wirkungslos | unverändert (kein Eingriff) |
| Werkzeugseiten Frequenzen | kein TOC, JS-Überschriften | unverändert, kein TOC (AK-A5) |
| Globale CSS/JS-Bundles | bestehende Bundles | ein zusätzliches Komponenten-Skript ≤ 5 KB gzip, CSS-Ergänzung im bestehenden Stylesheet |

---

## 14. Anhang

### 14.1 Erwartete TOC-Liste der Pilotseite (29 Einträge, Dokumentreihenfolge)

| # | Ebene | ID | Text |
|---:|---|---|---|
| 01 | h2 | `frequenzen-quellen-evidenzstatus-und-methodik` | Frequenzen: Quellen, Evidenzstatus und Methodik |
| 02 | h2 | `1-zweck-und-geltungsbereich` | 1. Zweck und Geltungsbereich |
| 03 | h2 | `2-suchstrategie-und-aufnahmekriterien` | 2. Suchstrategie und Aufnahmekriterien |
| 04 | h2 | `3-evidenzstatus-im-einzelnen` | 3. Evidenzstatus im Einzelnen |
| 05 | h2 | `4-datenschema` | 4. Datenschema |
| 06 | h2 | `5-claim-quelle-matrix` | 5. Claim-Quelle-Matrix |
| 07 | h3 | `51-physikalisch--physiologisch` | 5.1 Physikalisch / physiologisch |
| 08 | h3 | `52-esoterisch--traditionell` | 5.2 Esoterisch / traditionell |
| 09 | h2 | `6-einzelprüfungen` | 6. Einzelprüfungen |
| 10 | h3 | `61-eeg-bänder-warum-bereiche-und-keine-punktwerte` | 6.1 EEG-Bänder: Warum Bereiche und keine Punktwerte |
| 11 | h3 | `62-hörbereich-und-infraschall` | 6.2 Hörbereich und Infraschall |
| 12 | h3 | `63-stimmton-historie` | 6.3 Stimmton-Historie |
| 13 | h3 | `64-schwebung-binaurale-beats-und-die-entrainment-frage` | 6.4 Schwebung, binaurale Beats und die Entrainment-Frage |
| 14 | h3 | `65-solfeggio-primärquelle-und-beweislage` | 6.5 Solfeggio: Primärquelle und Beweislage |
| 15 | h3 | `66-planetenfrequenzen-rechnung-nachvollziehbar-deutung-nicht` | 6.6 Planetenfrequenzen: Rechnung nachvollziehbar, Deutung nicht |
| 16 | h3 | `67-432-hz-kleiner-effekt-keine-gesundheitswirkung` | 6.7 432 Hz: kleiner Effekt, keine Gesundheitswirkung |
| 17 | h3 | `68-40-hz-mausmodell--therapie` | 6.8 40 Hz: Mausmodell ≠ Therapie |
| 18 | h3 | `69-rife-und-bioresonanz-zahlen-ohne-wirknachweis` | 6.9 Rife und Bioresonanz: Zahlen ohne Wirknachweis |
| 19 | h3 | `610-cymatics-und-chladni-figuren-figur-statt-frequenz` | 6.10 Cymatics und Chladni-Figuren: Figur statt Frequenz |
| 20 | h3 | `611-klangschalen-mantras-chakren` | 6.11 Klangschalen, Mantras, Chakren |
| 21 | h3 | `612-solfeggio-erweiterungen-174285963-hz` | 6.12 Solfeggio-Erweiterungen 174/285/963 Hz |
| 22 | h2 | `7-bewusst-nicht-aufgenommene-einträge` | 7. Bewusst nicht aufgenommene Einträge |
| 23 | h3 | `71-bewusst-aufgenommene-grenzfälle-nachtrag-zu-befund-b2` | 7.1 Bewusst aufgenommene Grenzfälle (Nachtrag zu Befund B2) |
| 24 | h2 | `8-widersprüche-grenzen-offene-punkte` | 8. Widersprüche, Grenzen, offene Punkte |
| 25 | h2 | `9-disclaimer-verbindlicher-text` | 9. Disclaimer (verbindlicher Text) |
| 26 | h2 | `10-reproduktion-und-prüfung` | 10. Reproduktion und Prüfung |
| 27 | h2 | `11-hinweise-für-ui-und-audio-engine` | 11. Hinweise für UI und Audio-Engine |
| 28 | h2 | `12-quellenverzeichnis` | 12. Quellenverzeichnis |
| 29 | h2 | `13-änderungslog` | 13. Änderungslog |

Hinweis: Die Tabelle ist der Sollzustand; sie wurde aus dem Build `9d14d37` ausgelesen (Browser-DOM,
`main article h2/h3`) und ist zugleich Testvektor für TF-05.

### 14.2 Reproduktion der Messungen

```bash
# Build der Astro-Ausgabe (Worktree des Integrationsstands)
cd C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_7ad19549
npm run build           # 144 Seiten, 145 HTML-Dateien

# Korpus-Inventar (Kandidaten, fehlende/doppelte IDs, h4+)
node scripts/toc/heading-inventory.cjs dist

# Pilotseite im Detail
node scripts/toc/heading-inventory.cjs dist --page frequenzen/quellen.html   # 29 Kandidaten, 0 ohne ID

# Hinweis: Im Aufgabenbranch liegt das Skript unter
# C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_5edc1d8c/scripts/toc/heading-inventory.cjs;
# nach Übernahme in den Astro-Branch gilt der relative Aufruf oben.

# Browser-Messungen (Beispiele, gegen lokalen Static-Server auf dist/)
#  - /frequenzen/quellen.html: 14 h2 + 15 h3, alle mit ID
#  - /frequenzen/index.html nach JS: 51 Überschriften, 46 h3 ohne ID
#  - /radiasthesie/pendeln.html: bestehendes TOC 10 Links, kein aria-current
#  - Header: 101 px (1440), 85 px (390)
#  - Pilotseite 390 px: Tabelle 516 px → scrollWidth 540 (vorbestehend, R-1)
```

Gemessene Werte (4. November 2026, Astro-Build `9d14d37`):

| Messung | Wert |
|---|---|
| Pilotseite, Prose bei 1440 px | 720 px (Container 1360 px) |
| Pilotseite, Artikelhöhe (Prose) | 22.250 px (1440), 47.116 px (390) |
| Pilotseite, Scrollbreite 390 px | 540 px (Tabelle; Baseline, nicht TOC) |
| Hervorhebung im Bestand (Pendeln) | 10 Links, 0 `aria-current` |
| Bestehende Sidebar (Pendeln) | Höhe 10.747 px = Layouthöhe → Sticky unwirksam |
| h4–h6 im gesamten Build | 0 |
| Doppelte IDs im Build | 1 (`entries-title`, `farbwelten/index.html`) |

### 14.3 Slug-Testvektoren (github-slugger 2.0.0)

| Eingabe (normalisierter Text) | Erwartete ID |
|---|---|
| `6. Einzelprüfungen` | `6-einzelprüfungen` |
| `6.1 EEG-Bänder: Warum Bereiche und keine Punktwerte` | `61-eeg-bänder-warum-bereiche-und-keine-punktwerte` |
| `5.1 Physikalisch / physiologisch` | `51-physikalisch--physiologisch` |
| `Einführung: Warum Farben uns berühren` | `einführung-warum-farben-uns-berühren` |
| `Lichtmedizin und Chromotherapie – der entscheidende Unterschied` | `lichtmedizin-und-chromotherapie--der-entscheidende-unterschied` |
| `40 Hz: Mausmodell ≠ Therapie` | `40-hz-mausmodell--therapie` |
| `«Café» & Crème — 100 %` | `café--crème--100-` |
| `Straße/Öl (2026)` | `straßeöl-2026` |
| `Wissen` (1./2./3. Vorkommen) | `wissen`, `wissen-1`, `wissen-2` |
| `???` (leerer Slug) | `abschnitt-<n>` (pro Dokument fortlaufend) |

Die Vektoren 1–6 sind gegen den realen Build geprüft (IDs in `dist/frequenzen/quellen.html` und
`dist/farbwelten/index.html`); die Vektoren 7–10 (Sonderzeichen, Duplikate, leerer Slug) sind normativ
festgelegt und durch Unit-Tests abzusichern.

### 14.4 Zuordnung zu den Anforderungen der Aufgabe

| Anforderung aus `t_296b0496`/`t_5edc1d8c` | Fundstelle |
|---|---|
| Überschriften automatisch ermitteln | §6.1, §5.3 |
| Standard h2/h3, konfigurierbar | D-4, §5.1, AK-B3/B4 |
| Hierarchische Darstellung | §6.2, AK-B6 |
| Bestehende IDs nutzen, fehlende deterministisch erzeugen | §6.3, AK-C2/C5 |
| Dynamische Überschriften | §6.11, AK-I1–I3 |
| Keine manuellen Listen | §6.1 |
| Konfiguration je Seite | §5.2/5.3, AK-A3 |
| Kein Starlight, keine externen Ressourcen | §3.2, F-10 |
| Serverseitig, minimal JS | D-6, §6.9/6.10 |
| Rechts, Sticky, Scrollbereich, aktiver Abschnitt | §6.7, §6.5, AK-E1–E3, D1–D4 |
| Mobil kompakt aufklappbar | §6.7, AK-E4 |
| Gestaltung aus bestehenden Tokens | §9.1, §6.8 Nr. 5 |
| Anchor-Klick, Header-Offset, Hash, Deep-Link | §6.5 Nr. 9, AK-D5/C6/G2 |
| Barrierefreiheit | §6.8, AK-F1–F7 |
| Leerzustand | §6.6, AK-B8 |
| Tests (Desktop/Tablet/Mobile, lange Überschrift, viele Punkte, IDs, No-JS, reduced motion, Regression) | §8 (TF-01–TF-26) |
| Keine Produktionsänderung durch diese Aufgabe | Kopf, §3.2 |

---

## 15. Prüfvermerk dieser Spezifikation

* **Ausgeführt:** Korpus-Inventar über 145 HTML-Dateien; Browser-Stichproben auf 8 Seiten bei 1440/390 px;
  Slug-Gegenprobe gegen den Build mit github-slugger 2.0.0; Messung von Header, Prose, TOC-Verhalten.
* **Nicht ausgeführt (bewusst):** Implementierung, visuelle Abnahme, Screenreader-Lauf (Aufgabe der QA,
  TF-22), Last-/Performance-Messung (Aufgabe der Implementierung, TF-24).
* **Grenzen:** Das Inventar liest serverseitiges HTML; clientseitig erzeugte Überschriften wurden
  separat im Browser erhoben (§2.2). Die Ad-hoc-Browserläufe nutzen Chromium; Safari/iOS bleiben
  offener Restpunkt der QA.
* **Offene Entscheidungen:** O-1 bis O-8 (blockieren die Umsetzung nicht; Empfehlungen sind genannt).
