# Komponenten-Spezifikation — Themenmodul „Radiästhesie, Pendeln und Orakel“

Stand: 2. November 2026 · Status: Implementierungsvorgabe
Quelle der Werte: `mockup/index.html` + `mockup/rad.css`, gemessen mit
`scripts/capture.cjs` bei 1440, 1024, 900, 768, 390 und 360 px.
Rohdaten: `messung/mockup-messung.json`, Übersicht: `messung/uebersicht.md`.

## 0. Grundlagen

### 0.1 Was wiederverwendet wird (nicht neu bauen)

Der Wissensbereich-Baukasten existiert bereits in `css/main.css` (Abschnitt
„Astrologie — Wissensbereich“, ab Zeile ~2683) und wird unverändert benutzt:

| Klasse | Rolle | Herkunft |
| --- | --- | --- |
| `.astro-breadcrumb` | Brotkrümel | main.css |
| `.astro-head`, `.astro-title`, `.astro-subtitle`, `.astro-lead`, `.astro-badges` | Seitenkopf | main.css |
| `.astro-layout`, `.astro-main`, `.astro-aside`, `.astro-aside-box` | Zweispaltiges Artikellayout, sticky ab 1200 px | main.css |
| `.astro-toc` | Aufklappbares Inhaltsverzeichnis | main.css |
| `.astro-section`, `.astro-text`, `.astro-list`, `.astro-note` | Abschnitte und Fließtext | main.css |
| `.astro-callout`, `.astro-callout--limit` | Hinweisbox | main.css |
| `.astro-step-list`, `.astro-step` | Schrittliste | main.css |
| `.astro-details` | Aufklappbereiche | main.css |
| `.astro-source`, `.astro-source-list`, `.astro-panel-note` | Quellenpanel | main.css |
| `.astro-glossgroup`, `.astro-glosslist`, `.astro-term` | Glossar | main.css |
| `.astro-letters`, `.astro-letter` | Buchstabenleiste | main.css |
| `.astro-search`, `.input`, `.btn`, `.btn-primary`, `.btn-secondary` | Suche und Aktionen | main.css / design-system.css |
| `.rad-*` | Nur die in diesem Dokument beschriebenen Modulelemente | `mockup/rad.css` |

**Regel:** Keine Kopie einer `.astro-*`-Regel unter neuem Namen. Wenn eine
Anpassung nötig ist, wird sie `.rad`-skopiert überschrieben (Beispiel:
Zeilenlänge, §0.4).

### 0.2 Tokens (unverändert aus `css/design-system.css`)

| Token | Wert | Verwendung im Modul |
| --- | --- | --- |
| `--color-bg-deep` | `#0b1012` | Seitenhintergrund, Instrumentenfläche in Karten |
| `--color-bg-card` | `#141c1f` | Karten, Tafeln, Hinweisboxen, aktives Mobilmenü |
| `--color-text-primary` | `#eae6dc` | H1–H3, Aussagen, Links in Fließtext |
| `--color-text-secondary` | `#babdb7` | Fließtext, Legenden, Metazeilen |
| `--color-primary` | `#c6b38e` | Sand: Aktionen, aktives Ziel, Stufen B, Fokusring |
| `--color-hover` | `#d5c4a2` | Hover auf Aktionen |
| `--color-border` | `#3c484b` | dekorative 1-px-Trenner |
| `--color-line-strong` | `#82928e` | funktionale Rahmen, Hover-Rahmen von Karten |
| `--color-accent-rose` | `#c09489` | Stufe E (widerlegt), Einschränkungen |
| `--color-accent-emerald` | `#9db3a4` | Stufe D (Befund) |
| `--text-xs…--text-4xl` | 13–44 px | siehe §0.3 |
| `--space-1…--space-24` | 4–96 px | 4-px-Raster |
| `--radius-sm` | 2 px | alle Flächen (keine Pillen) |

Zwei zusätzliche Textfarben nur für Stufen-Chips, beide bereits im Projekt
verwendet (`#c0a889` in `.astro-badge--historisch`, `#9db3c4` in
`.astro-badge--empirie`): **Stufe A `#c0a889`**, **Stufe C `#9db3c4`**.
Kontrast auf Karte 7,57:1 bzw. 7,96:1 (`messung/kontrast.json`).

### 0.3 Typografie

| Rolle | Größe / Zeilenhöhe | Schrift | Gemessen |
| --- | --- | --- | --- |
| H1 Landingpage | `clamp(34px, 4.2vw, 56px)` / 1.04 | Fraunces 400 | 56 px bei 1440, 43 px bei 1024, 34 px bei 390 |
| H1 Themenseite/Glossar | `clamp(30px, 5vw, 56px)` / 1.05 | Fraunces 400 | 56 / 51,2 / 45 / 38,4 / 30 px |
| H2 Landingpage | `clamp(26px, 3vw, 34px)` / 1.15 | Fraunces 400 | 34 px |
| H2 Artikel | 28 px / 1.2 | Fraunces 400 | `.astro-section h2` |
| H3 | 16 px / 1.4 halbfett | Manrope 600 | |
| Fließtext | 16 px / 1.65 | Manrope 400 | 69 Zeichen je Zeile bei 1440 |
| Lead | 18 px / 1.6 | Manrope 400 | 63–64 Zeichen je Zeile |
| Metazeile, Stufen, IDs | 13 px / 1.8 | Mono | |
| Kartenfließtext | 14 px / 1.6 | Manrope 400 | |
| Glossardefinition | 14 px / 1.6 | Manrope 400 | 75 Zeichen je Zeile |

Keine Schriftgröße unter 13 px. Keine `font-weight` unter 300.

### 0.4 Zeilenlänge (gemessen, nicht geschätzt)

`.astro-text` bricht mit `max-width: 72ch` auf **86 Zeichen je Zeile** (Manrope 16 px,
1440 px). Deshalb begrenzt das Modul Fließtext auf **60 ch**:

```css
.rad .astro-text,
.rad .astro-lead,
.rad .astro-callout p,
.rad .astro-details-body p,
.rad .rad-claim-text,
.rad .astro-term dd,
.rad .astro-entry p {
  max-width: 60ch;
}
```

Ergebnis: 69 Zeichen/Zeile bei 16 px, 75 bei 14 px (Glossar), 38 bei 390 px.
Zielkorridor 62–72 Zeichen für 16 px ist damit eingehalten.

### 0.5 Raster und Abstände

| Größe | Desktop (≥1101) | Tablet (≤1100) | Mobil (≤700) |
| --- | --- | --- | --- |
| Satzspiegel | max. 1360 px | 1360 px | 1360 px |
| Gutter | 64 px | 32 px | 24 px |
| Seitenabstand oben/unten | 48 / 64 px (`--space-12/16`) | gleich | 48 / 64 px |
| Abschnittsabstand (Landing) | 64 px | 64 px | 48 px |
| Abschnittsabstand (Artikel) | 40 px (`.astro-section`) | 40 px | 40 px |
| Kopfzeilenhöhe | 100 px (+1 px Linie = 101) | 100 | 84 (+1 = 85) |
| Kartenabstand | 24 px | 24 px | 16–24 px |

---

## C1 · Kopfzeile mit acht Navigationszielen

**Vorkommen:** global, in `index.html`.

**Markup:** siehe `ia-konzept.md` §3.4; Position zwischen „Runen“ und „Wissen“.

**Maße (gemessen):** Ziele 48 px hoch, `min-width: 44px`, Abstand 20 px
(≤1120 px: 8 px, ≤900 px: 4 px), Schrift 14 px (≤1120 px: 13 px), Logo 28 px
(≤900 px: 24 px). Reserve bei acht Zielen plus dreistelligem Favoritenzähler:
31,8 px bei 781 px, 88,3 px bei 1121 px, 407 px bei 1440 px.

**Zustände:** Default `--color-text-secondary`; Hover `--color-hover`; aktiv
`--color-primary` + 1-px-Unterlinie in Sand + `aria-current="page"`; Fokus 2 px
Sand, Offset 4 px; geöffnetes Mobilmenü: Liste als Spalte, Zeilen 342 × 48 px
bei 390 px, linksbündig, Trennlinie 1 px `--color-border`, aktives Ziel in Sand
mit Sand-Unterlinie.

**Breakpoints:** ≤780 px Umschaltknopf (48 × 48 px) und gestapelte Liste;
781–900 px kompaktes Logo und engerer Abstand; 901–1120 px engerer Abstand;
>1120 px volle Abstände.

**Barrierefreiheit:** `<nav aria-label="Hauptnavigation">`, geordnete `<ul>`,
Schaltfläche mit `aria-expanded` und wechselndem `aria-label` („Menü öffnen“ /
„Menü schließen“), Ziele als echte Links, kein `tabindex > 0`.

**Nicht tun:** Label „Radiästhesie“ verwenden (sprengt 781 px), neunte Ziele
ergänzen ohne neue Messung, Navigationsziele aus dem Menü in ein Select verwandeln.

---

## C2 · Hero der Landingpage

**Vorkommen:** `#pendeln`, einmal pro Seitenaufruf.

**Markup:**

```html
<div class="rad-hero">
  <div class="rad-hero-grid">
    <div class="rad-hero-copy">
      <p class="label">Themenmodul · Instrumente und Deutung</p>
      <h1 id="pendeln-title" class="rad-hero-title">Radiästhesie, Pendeln und <em>Orakel</em></h1>
      <p class="rad-hero-lead">…</p>
      <div class="rad-hero-actions">
        <a class="btn btn-primary" href="#pendeln/radiasthesie">Mit Radiästhesie beginnen</a>
        <a class="textlink" href="#pendeln/methodik">Einordnung lesen <span aria-hidden="true">↓</span></a>
      </div>
      <dl class="rad-hero-facts">
        <div class="rad-hero-fact"><dt>Bereiche</dt><dd>3 Themen</dd></div>
        …
      </dl>
    </div>
    <figure class="rad-plate">…</figure>
  </div>
</div>
```

**Maße (1440):** Grid `6.4fr / 5.6fr`, Gap 64 px; Textspalte 666 px; H1 drei
Zeilen, 116 px hoch; Lead max. 58 ch; Aktionen 48 px hoch, Gap 12 px; Kennzahlen
mit 1-px-Trennlinie darüber, Abstand 32 px; Hero-Padding 24/48 px, Unterlinie
1 px, Abstand zum nächsten Block 32 px.

**Zustände:** keine eigenen; Aktionen erben `.btn`/`.textlink`.

**Breakpoints:** ≤900 px einspaltig, Tafel unter dem Text, Gap 32 px; ≤700 px
Padding oben 8 px.

**Barrierefreiheit:** genau eine H1; `<em>` nur für ein Wort, nicht für den
halben Titel; Kennzahlen als `<dl>`; dekorative Pfeile `aria-hidden="true"`.

**Nicht tun:** H1 mit `--text-h1` (80 px) setzen — das ist der Startseiten-Hero;
kein zweiter Hero auf derselben Seite; kein Video, kein Parallax.

---

## C3 · Instrumententafel (`.rad-plate`)

**Vorkommen:** Hero (Landing), Artikel (Themenseite), optional in Karten.

**Markup:**

```html
<figure class="rad-plate">
  <div class="rad-plate-frame">
    <img src="../assets/pendel-geometrie.svg" width="520" height="400"
         alt="Schematische Zeichnung eines Pendels: Aufhängepunkt, Faden der Länge L, ausgelenkter Pendelkörper und der Winkel Alpha." />
  </div>
  <figcaption><strong>Pendelgeometrie.</strong> Länge L, Auslenkung α, Schwingungsdauer T. Eigene Zeichnung, kein Messgerät.</figcaption>
</figure>
```

**Maße:** Rahmen 1 px, Innenabstand 20 px (≤480 px: 16 px), Fläche
`--color-bg-card`; Bild `width: 100%; height: auto` (kein Beschnitt, keine
Verzerrung); Bildunterschrift 13 px Mono, Abstand 12 px. Gemessen: Hero
540 × 416 px, Artikel 638 × 491 px.

**Zustände:** keine.

**Breakpoints:** folgt der Spalte; ≤480 px Innenabstand 16 px.

**Barrierefreiheit:** `<figure>` + `<figcaption>`; Alt-Text beschreibt das
Motiv (nicht die Deutung); `width`/`height` gegen Layoutsprung; SVG mit
`role="img"` und `<title>`/`<desc>` im Asset selbst.

**Nicht tun:** Fotos als „Beweis“ für Wirkung einsetzen; Alt-Text wie
„Pendelbild“; Bildunterschrift ohne Grenze formulieren.

---

## C4 · Einordnungsband (`.rad-status`) — Pflicht

**Vorkommen:** Landingpage und jede Themenseite, direkt unter dem Kopf, **vor**
dem ersten Abschnitt; nicht schließbar, nicht einklappbar.

**Markup:**

```html
<aside class="rad-status" aria-labelledby="status-label-1">
  <span class="rad-status-label" id="status-label-1">Einordnung</span>
  <p class="rad-status-body">
    <strong>Alle Verfahren dieses Bereichs stammen aus Tradition und Anwenderberichten.</strong>
    Eine physikalische Wirkung ist nicht belegt; kontrollierte Tests fanden keine Treffer über dem Zufall.
    <a class="rad-status-link" href="#pendeln/methodik">So funktioniert die Kennzeichnung</a>.
  </p>
</aside>
```

**Maße (1440):** Höhe 103 px; Grid `auto 1fr`, Gap 12/16 px; Padding 16 px oben/
unten, 20 px links; linke Kante 2 px Sand; oben und unten 1 px
`--color-line-strong`; Text 14 px / 1.65, max. 78 ch.

**Zustände:** keine. Kein Schließen, kein Speichern, kein „nicht mehr anzeigen“.

**Breakpoints:** ≤700 px einspaltig (Label über Text), Label `justify-self: start`.

**Barrierefreiheit:** `<aside>` mit `aria-labelledby`; Text enthält die Aussage
selbst (nicht nur „mehr Infos“); Link mit sichtbarem Ziel; Kontrast 9,09:1
(Sekundärtext auf Karte) bzw. 13,86:1 für die fette Zeile.

**Nicht tun:** Band unterhalb des ersten Abschnitts platzieren; Text kürzen, bis
die Aussage verschwindet; Farbe allein als Signal.

---

## C5 · Themenkarte (`.rad-topic`)

**Vorkommen:** Landingpage, drei Stück (Radiästhesie, Pendeln, Orakel).

**Markup:**

```html
<ul class="rad-topics">
  <li>
    <article class="rad-topic">
      <figure class="rad-topic-figure"><img src="…" alt="…" /></figure>
      <div class="rad-topic-body">
        <p class="rad-topic-meta">Thema 1 · Instrument</p>
        <h3 class="rad-topic-title"><a href="#pendeln/radiasthesie">Radiästhesie</a></h3>
        <p class="rad-topic-text">…</p>
        <ul class="rad-topic-facts"><li>Rute, Winkelrute, Biotensor</li>…</ul>
        <p class="rad-topic-cta"><a href="#pendeln/radiasthesie">Zum Thema Radiästhesie <span aria-hidden="true">→</span></a></p>
      </div>
    </article>
  </li>
  …
</ul>
```

**Maße (1440):** Karte 421 × 644 px; Bildfläche 421 × 316 px (4:3), Innenabstand
20 px; Textbereich 20 px Padding, Gap 8 px; Titel 28 px; Meta und Stichworte
13 px Mono; CTA-Link 44 px hoch; Kartenhöhen gleich (`height: 100%`).

**Zustände:** Hover/Focus-within → Rahmen `--color-line-strong` (gemessen
`rgb(130,146,142)`); Fokusring 2 px Sand, Offset 4 px; Übergang 120 ms, bei
`prefers-reduced-motion` abgeschaltet.

**Breakpoints:** ≥901 px drei Spalten (421 / 368 / 304 px); 701–900 px Liste
(Karte volle Breite, Bild links 5fr, Text 7fr, Bild 4:3); ≤700 px gestapelt
(342 px bei 390 px).

**Barrierefreiheit:** `<ul>/<li>` als Liste; genau ein Link pro Karte (Titel),
CTA ist derselbe Link (Doppelung erlaubt, weil er dasselbe Ziel hat — beide mit
identischem zugänglichem Namen führen würde; deshalb CTA-Text abweichend
„Zum Thema …“); Bild dekorativ nur, wenn der Titel das Motiv schon nennt —
sonst Alt-Text.

**Nicht tun:** ganze Karte klickbar machen (verschachtelte Ziele); vierte Karte
ergänzen (Raster ist auf drei ausgelegt); unterschiedliche Kartenhöhen zulassen.

---

## C6 · Stufen-Chip A–E (`.rad-chip--a…e`)

**Vorkommen:** Stufenlegende, Evidenztafel, Artikelkopf, Glossarbegriff.

**Markup:** `<span class="rad-chip rad-chip--b">B · Tradition</span>`

**Maße:** 13 px Mono, Padding 1 px 8 px, Rahmen 1 px `currentColor`, Radius 2 px,
`white-space: nowrap`.

**Farben / Kontrast (gemessen, Karte `#141c1f`):**

| Stufe | Text | Kontrast |
| --- | --- | ---: |
| A · Historisch | `#c0a889` | 7,57:1 |
| B · Tradition | `#c6b38e` | 8,42:1 |
| C · Hypothese | `#9db3c4` | 7,96:1 |
| D · Befund | `#9db3a4` | 7,75:1 |
| E · Widerlegt | `#c09489` | 6,45:1 |

**Regel:** Textmarke ist Pflicht („A · Historisch“), Farbe ist Zusatz. Ein Chip
ohne Buchstabe und Wort ist unzulässig.

**Zustände:** keine interaktiven Zustände; Chips sind keine Buttons.

**Barrierefreiheit:** Kontrast ≥ 4,5:1 (alle ≥ 6,45:1); nicht nur Farbe;
in der Legende als `<dt>` mit Erklärung im `<dd>`.

---

## C7 · Evidenztafel (`.rad-claims`)

**Vorkommen:** Themenseite, Kapitel „Was Untersuchungen zeigen“.

**Markup:**

```html
<ul class="rad-claims">
  <li class="rad-claim">
    <span class="rad-claim-id"><span class="rad-chip rad-chip--a">A</span> H-01</span>
    <p class="rad-claim-text">Ruten wurden historisch bei Wasser- und Erzsuche eingesetzt.</p>
    <p class="rad-claim-note">In Quellen des 16. bis 19. Jahrhunderts dokumentiert. …</p>
  </li>
</ul>
```

**Maße:** Grid `8.5rem / 1.6fr / 1fr`, Gap 8/16 px; Zeile mit 16 px Padding oben/
unten, 1-px-Trennlinie; Aussage 16 px Primärtext, Einordnung 14 px Sekundärtext.

**Zustände:** keine.

**Breakpoints:** ≤480 px alles einspaltig — Stufe/ID, Aussage, Einordnung als drei
Zeilen; kein horizontaler Scroll, keine zusammengeführten Zellen.

**Barrierefreiheit:** semantisch eine Liste; die Stufe steht als Text in der Zeile,
nicht in einem `title`-Attribut; Kennungen (`H-01`) sind Text, keine Grafik.

**Nicht tun:** Stufen nur als Farbpunkt; Aussage und Einordnung in eine Zeile
pressen; Quelle ohne Kennung verlinken.

---

## C8 · Artikelkopf (Brotkrümel, Kopf, Metazeile)

**Markup:** `.astro-breadcrumb` → `.astro-head` mit `.label`, `.astro-title`
(`tabindex="-1"`), `.astro-subtitle`, `.astro-lead`, `.astro-badges` (Chips) und
`ul.rad-meta`.

**Maße (1440):** H1 56/58,8 px, Abstand darunter 16 px; Lead 18 px, 63 Zeichen/
Zeile; Chips 13 px, Gap 8 px; Metazeile 13 px Mono mit 4-px-Rauten als
Aufzählungszeichen, Gap 4/16 px; Kopf mit 1-px-Unterlinie, 32 px Abstand.

**Zustände:** Fokus auf H1 nach Navigation (`tabindex="-1"`), Fokusring 2 px
Sand, Offset 6 px (`.astro-title:focus-visible`).

**Breakpoints:** H1 folgt `clamp(30px, 5vw, 56px)`; ≤480 px 30 px; Lead wird 16 px.

**Barrierefreiheit:** genau eine H1; Brotkrümel als `<nav aria-label="Brotkrümelnavigation">`
mit `<ol>`; letztes Element `aria-current="page"`, nicht verlinkt; Metazeile als
Liste, nicht als Fließtext mit Trennzeichen.

**Nicht tun:** Untertitel als H2; Brotkrümel als Fließtext; Metaangaben ohne
Prüfstatus („Mustertext“ / „geprüft am …“).

---

## C9 · Inhaltsverzeichnis und Seitenleiste

**Markup:** `aside.astro-aside` mit `details.astro-toc[open]` und optional
`.astro-aside-box`.

**Maße (1440):** Spalte 280 px, Gap 64 px; TOC-Rahmen 1 px, Summary 44 px hoch,
12/16 px Padding; Links 14 px mit 8 px Abstand; Box mit 16 px Padding und
Kennzahlen in Mono.

**Verhalten:** ab 1200 px `position: sticky`, `top: calc(100px + 24px) = 124px`
(gemessen: `position: sticky`); unter 1200 px steht die Leiste vor dem Text.
Die Seitenleiste steht dafür **im DOM vor** `.astro-main` und wird auf Desktop
per `grid-template-areas: 'main aside'` nach rechts gestellt. Damit stimmen
Lesereihenfolge, Fokusreihenfolge und visuelle Reihenfolge überein (WCAG 1.3.2) —
eine reine `order`-Umsortierung würde den Text vor der Leiste lesen lassen,
obwohl die Leiste oben steht.

```css
.rad .astro-layout { grid-template-areas: 'aside' 'main'; }
.rad .astro-main { grid-area: main; }
.rad .astro-aside { grid-area: aside; order: 0; }
@media (min-width: 1200px) {
  .rad .astro-layout { grid-template-areas: 'main aside'; }
}
```

**Zustände:** `<details>` offen/geschlossen über das native Dreieck-Ersatzzeichen
(`+` / `–` in Sand); Links Hover mit Sand-Unterlinie; Fokusring 2 px.

**Barrierefreiheit:** `<summary>` ist bedienbar (Enter/Leertaste); `nav` mit
`aria-label="Inhaltsverzeichnis"`; Sprungziele sind die `<section id>`; die
Reihenfolge im DOM entspricht der Lesereihenfolge.

**Nicht tun:** TOC zusätzlich im Text wiederholen (im Mockup zunächst doppelt
vorhanden — bewusst entfernt, siehe `CHECKPOINT.md`); Sticky ohne
`scroll-padding-top` (bereits global gesetzt: `calc(100px + 16px)`).

---

## C10 · Schrittliste (`.astro-step-list`)

**Markup:** `<ol class="astro-step-list">` mit `<li class="astro-step"><h3>…</h3><p class="astro-text">…</p></li>`.

**Maße:** Gap 24 px; Schritt mit 20 px linker Linie (1 px `--color-border`);
H3 16 px halbfett, direkt darüber ohne Abstand.

**Regel:** Schritte sind Handlungen („Fassen“, „Ruhen“, „Lesen“), keine Kapitel.

**Breakpoints:** einspaltig in allen Breiten.

**Barrierefreiheit:** `<ol>`, weil Reihenfolge inhaltlich relevant; H3 als
Überschrift, nicht als fette Zeile.

---

## C11 · Hinweisbox (`.astro-callout`, `.astro-callout--limit`)

**Maße:** Padding 20 px (≤480 px 16 px), Rahmen 1 px `--color-line-strong`,
linke Kante 2 px; Fläche `--color-bg-card`; Text 16 px / 1.65, 60 ch.

**Varianten:** Standard (Begriffsgrenze, Methodenhinweis) mit Sand-Kante;
`--limit` (Einschränkung, „kein Ersatz für ärztliche Prüfung“) mit Rosen-Kante
`--color-accent-rose`.

**Barrierefreiheit:** kein `role="alert"` (statischer Inhalt); Rosen-Kante nie
alleiniges Signal — die Überschrift/der erste Satz nennt die Einschränkung.

---

## C12 · Quellenpanel (`.astro-details` + `.astro-source`)

**Markup:**

```html
<details class="astro-details astro-details--sources" id="quellen">
  <summary>Quellen &amp; Belege (3 Quellen, 5 Aussagen)</summary>
  <div class="astro-details-body">
    <ul class="astro-source-list">
      <li class="astro-source" id="quelle-S1">
        <a href="https://…" rel="noopener">S1 · USGS, Water Science School: Water Dowsing</a>
        <span class="astro-source-meta">Herausgeber · Typ · abgerufen 2.11.2026 · Volltext geprüft</span>
      </li>
    </ul>
    <p class="astro-panel-note">…</p>
  </div>
</details>
```

**Maße:** Summary 48 px Mindesthöhe, 16/20 px Padding; Quelle mit 12 px Padding
oben/unten, 1-px-Trennlinie; Link 16 px Primärtext; Meta 13 px Mono.

**Zustände:** geschlossen (Default), offen; `+`/`–` in Sand; Hover auf Quelle Sand.

**Barrierefreiheit:** `<details>`/`<summary>` nativ bedienbar; jede Quelle mit
`id="quelle-Sxx"` als Sprungziel für Marker; externe Links `rel="noopener"`.

**Inhaltspflicht je Quelle:** Herausgeber, Typ, Abrufdatum, Prüftiefe
(Volltext / Abstract / Snippet), Interessenvermerk, falls vorhanden.

**Nicht tun:** Quellen nur als Zahlenliste; Links ohne Abrufdatum; „geprüft“
behaupten, wenn nur das Abstract gelesen wurde.

---

## C13 · Einordnungskasten (`.rad-disclaimer`)

**Vorkommen:** Landingpage und jede Themenseite am Ende.

**Markup:**

```html
<aside class="rad-disclaimer" aria-labelledby="disclaimer-1">
  <h2 class="rad-disclaimer-title" id="disclaimer-1">Einordnung dieser Seite</h2>
  <p><strong>Tradition:</strong> …</p>
  <p><strong>Evidenz:</strong> …</p>
  <p><strong>Konsequenz:</strong> …</p>
</aside>
```

**Maße:** Padding 20/24 px (≤480 px 16 px), Rahmen 1 px `--color-line-strong`,
linke Kante 2 px Sand, Fläche `--color-bg-card`; Überschrift 13 px Mono,
Versalien, Sand; Absätze 16 px / 1.65, 60–72 ch; Abstand 32 px zum Vorblock.

**Inhalt:** drei feste Absätze — was hier steht, was nicht behauptet wird, wie
man es prüfen kann. Reihenfolge nicht ändern.

**Barrierefreiheit:** `<aside>` mit `aria-labelledby`; H2 in der
Überschriftenordnung (kein Sprung); Text ohne Farbcodierung.

---

## C14 · Verwandte Themen (`.rad-related`)

**Markup:** `<ul class="rad-related">` mit `<li class="rad-related-item">`,
Typzeile, `<h3><a>…</a></h3>`, ein Satz.

**Maße:** Grid `auto-fit minmax(min(100%, 260px), 1fr)`, Gap 16 px; Element mit
16 px Padding (`--space-4`) und 1-px linker Linie `--color-line-strong`; Link
44 px Mindesthöhe; Typzeile 13 px Mono Sand.

**Breakpoints:** drei Spalten bei 1440 (421 px), zwei bei 900, eine bei 390.

**Barrierefreiheit:** H3-Ebene unter dem Abschnitts-H2; Linktext nennt das Ziel
(„Geschichte der Radiästhesie“), nicht „hier klicken“.

**Nicht tun:** Modul auf sich selbst verlinken; Kacheln wie die Themenkarten
gestalten (Verwechslungsgefahr).

---

## C15 · Werkstatt-Teaser (`.rad-workshop`, `.rad-werk`)

**Markup:** `<ul class="rad-workshop">` mit drei `<li class="rad-werk">`:
Zustand-Chip (`.rad-werk-state`, `--planned` gestrichelt), H3, ein bis zwei Sätze.

**Maße:** drei Spalten, Gap 16 px, Padding 20 px, Rahmen 1 px `--color-border`;
Zustand 13 px Mono; Titel 20 px Fraunces.

**Regel:** Der Zustand steht **im Text** („In Vorbereitung“), nicht nur als Farbe
oder Punkt. Ein Teaser ohne Route bekommt keinen Link.

**Breakpoints:** ≤900 px zwei Spalten, ≤700 px eine Spalte.

**Barrierefreiheit:** Chip ist Text, kein Icon ohne Label; kein Link auf eine
nicht existierende Route.

---

## C16 · Glossar (Gruppen, Begriffe, Buchstaben, Suche)

**Markup:** `.astro-controls` mit `.astro-search` (Label `sr-only`, Input
`type="search"`, Button), `.astro-letters`, je Buchstabe
`.astro-glossgroup` + `.rad-gloss-head` + `.astro-glosslist` mit
`.astro-term` (`<dt>` Begriff + Chip, `<dd>` Definition, `.astro-term-links`).

**Maße (1440):** Suchfeld max. 560 px, Höhe 48 px; Buchstaben 44 × 44 px, Gap 4 px;
Gruppenkopf mit Zähler und 1-px-Unterlinie, 32 px Abstand zwischen Gruppen;
Begriff 16 px halbfett, Definition 14 px, 75 Zeichen/Zeile.

**Zustände:** leere Buchstaben als `<span>` (nicht fokussierbar, `opacity: .35`);
Hover auf Begriff/Link Sand; Fokusring 2 px; Suche mit `aria-live` für die
Trefferzahl.

**Breakpoints:** Suchfeld und Button unter 480 px je 100 % Breite; Buchstaben
brechen um, ohne Überlauf.

**Barrierefreiheit:** `<label class="sr-only" for="glossarSuche">`; Buchstaben als
Links nur, wenn ein Anker existiert; Definition als `<dl>`/`<dd>`.

---

## C17 · Zustände und Fokus (verbindlich)

| Element | Default | Hover | Fokus | Aktiv/Aktuell | Deaktiviert |
| --- | --- | --- | --- | --- | --- |
| Navigationsziel | Sekundärtext | `--color-hover` | 2 px Sand, Offset 4 px | Sand + Sand-Unterlinie + `aria-current` | – |
| Karte | Rahmen `--color-border` | Rahmen `--color-line-strong` | Ring 2 px Sand um die Karte | – | – |
| Button primär | Sandfläche, Label `--color-bg-deep` | `--color-hover` | 2 px Sand, Offset 4 px | – | `opacity .5`, kein Pointer |
| Textlink | Primärtext, 1-px-Unterlinie | Sand | 2 px Sand | – | – |
| Chip | Textfarbe der Stufe | – | – | – | – |
| Buchstabe leer | `opacity .35` | – | nicht fokussierbar | – | – |

Fokus ist **immer** `outline`, nie nur ein Farbwechsel, und wird nie entfernt
(`:focus-visible` ohne `outline: none`). Reduzierte Bewegung: alle Übergänge
≤ 120 ms werden auf 0,01 ms gesetzt (global bereits vorhanden).

---

## C18 · Druck

- Ausblenden: Inhaltsverzeichnis, Buchstabenleiste, Werkstatt-Teaser, Bedienleisten.
- Rahmen der Boxen: 1 px `#777`, Flächen transparent.
- URLs hinter Links in Klammern (`content: ' (' attr(href) ')'`), 9 pt.
- Keine Seitenumbrüche in Karten, Kästen und Tabellenzeilen.
- Einordnungskasten bleibt sichtbar — auch im Ausdruck.

---

## C19 · Was die Implementierung nicht ändern darf

1. Tokens, Schriften, Fokusfarbe und Radien.
2. Bestehende `.astro-*`-Regeln (nur `.rad`-skopierte Ergänzungen).
3. Die acht Navigationsziele in Anzahl und Reihenfolge (Messung in
   `ia-konzept.md` §3.2 gilt für genau diese Konstellation).
4. Die Pflichtreihenfolge Kopf → Einordnungsband → Inhalt.
5. Die drei Absätze des Einordnungskastens in ihrer Aussage.

Änderungen an einem dieser Punkte brauchen eine neue Messung und einen neuen
Screenshot-Satz; die Skripte in `scripts/` erzeugen beides in unter zwei Minuten.
