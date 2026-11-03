# Komponenten-Spezifikation

Stand: 2. November 2026 · Referenzimplementierung: `mockup/index.html` mit
`mockup/farbwelten.css` (Prüfungen in `07-accessibility.md`).

Geltungsbereich: **zwölf Farbwelten** (Registerreihenfolge und Routen: `02` §2/§11).
Die Referenzimplementierung `mockup/index.html` zeigt den **Stand der ersten
Ausbaustufe (7 Farbwelten)**; wo die Produktionsfassung (`css/farbwelten.css`)
abweicht, stehen hier die Werte der Produktionsfassung, und die Abweichung ist
am Baustein benannt. Messwerte aus dem Mockup-Audit sind als solche
gekennzeichnet.

Konvention: Maße in px, Farben ausschließlich über Tokens, Zustände explizit.
Jede Komponente nennt Zweck, Aufbau, Maße, Zustände, Barrierefreiheit und
Inhaltsregeln.

## 1. Hero der Einstiegsseite

**Zweck:** Thema setzen und in die Erkundung führen, ohne zu überladen.

**Aufbau (Desktop ≥1101 px):** zweispaltig, links Text (7 Teile), rechts
Farbtafel (5 Teile), 64 px Abstand, 96 px oben / 64 px unten.

```html
<section class="fw-hero" aria-labelledby="farbwelten-title">
  <div>
    <p class="label fw-hero__eyebrow">Farben / Licht / Bedeutung</p>
    <h1 id="farbwelten-title">Die Welt der Farben – Licht, Schwingung und <em>verborgene</em> Bedeutungen</h1>
    <p class="fw-hero__lede">…</p>
    <div class="fw-actions">
      <a class="btn btn-primary" href="#farbwelten/register">Farbwelten entdecken</a>
      <a class="textlink" href="#farbwelten/chakren">Chakren &amp; Farben <span aria-hidden="true">↗</span></a>
    </div>
  </div>
  <figure class="fw-tafel-wrap">…Farbtafel…</figure>
</section>
```

- H1 max. 15 ch, 4 Zeilen bei 80 px; genau **ein** kursives Wort (Sand).
- Genau eine Hauptaktion (`btn-primary`, 48 px hoch); der zweite Weg ist ein
  Textlink, keine zweite Schaltfläche.
- Lede max. 52 ch; keine Aufzählung im Hero.
- Mobil: Text zuerst, Tafel darunter (DOM-Reihenfolge bleibt).

## 2. Farbtafel (`fw-tafel`)

**Zweck:** Alle zwölf Welten auf einen Blick, als Materialprobe.

| Eigenschaft | Wert |
| --- | --- |
| Container | `display:grid; grid-template-rows:repeat(12, minmax(44px, auto))` — zwölf Bänder in Registerreihenfolge, Mindesthöhe 44 px; 1-px-Rahmen `--color-line-strong`, Fläche `--color-bg-card`. Kein festes Seitenverhältnis mehr (die Vorgabe der ersten Ausbaustufe war `repeat(7,1fr)` mit `aspect-ratio:4/5`) |
| Band | `display:flex`, 1-px-Trenner `--color-bg-deep`, letztes Band ohne Trenner |
| Farbfeld | `flex:0 0 40%`, Verlauf `--band-core → --band-deep` (90°) |
| Beschriftungsplatte | `flex:1 1 auto`, rechtsbündig, 12 px Innenabstand, Fläche `--band-deep` |
| Inhalt | Mono-Wellenlänge (`--text-xs`, sekundär) + Name (Fraunces `--text-lg`, primär); Magenta, Rosa, Weiß und Schwarz tragen in der Mono-Zeile das Typ-Label („nicht spektral“, „Neutralfarbe“) statt einer Wellenlänge |
| Mobil | Bandhöhe folgt dem Inhalt (Mindesthöhe 44 px); Name ab ≤700 px `--text-base` |

**Regel:** Text steht **nur** auf der Platte (`--band-deep`), nie auf dem
Verlauf. Kontrast dadurch messbar: 13,59–13,89:1 (Name) und 8,91–9,11:1
(Wellenlänge) über alle zwölf `-deep`-Flächen, siehe `03` §4.

**Barrierefreiheit:** Container `role="img"` mit `aria-label`, das alle zwölf
Namen und — wo vorhanden — Wellenlängen nennt; die inneren Elemente sind für
Screenreader dekorativ (`aria-hidden` am Farbfeld). Alternativ als `<ul>` mit
zwölf `<li>`— dann ohne `role="img"`.

## 3. Farbregister (`fw-register`)

**Zweck:** Schnelle Übersicht und Einstieg in die zwölf Detailseiten.

```html
<ul class="fw-register">
  <li class="fw-register__row">
    <a class="fw-register__link" href="#farbwelten/rot">
      <span class="fw-register__field" style="background: var(--fw-rot-core)" aria-hidden="true"></span>
      <span>
        <span class="fw-register__name">Rot</span>
        <span class="fw-register__meta">620–750 nm · 400–484 THz · spektral</span>
      </span>
      <span class="fw-register__chakra">Wurzelchakra (moderne Zuordnung)</span>
      <span class="fw-register__arrow" aria-hidden="true">→</span>
    </a>
  </li>
  <!-- 6 weitere -->
</ul>
```

- Zeile 96 px hoch (mobil 80 px), 1-px-Trenner, kein Schatten, kein Lift.
- Hover/Fokus: Fläche `--color-bg-card`; Fokus zusätzlich 2 px Sand außen.
- Das Farbfeld ist 96 × 64 px, 1-px-Rahmen `--color-line-strong` (damit auch
  Gelb auf Schwarz eine Kante hat).
- Chakra-Spalte entfällt ≤900 px (kein Informationsverlust: steht auf der
  Detailseite und im Chakra-Abschnitt).
- Kein `color`-Wechsel des Namens beim Hover — Farbe ist kein Zustandsträger.

## 4. Farbkarte (`fw-card`)

**Zweck:** Teaser, „weitere Farben“, Chakren-Zuordnung.

| Teil | Maß/Regel |
| --- | --- |
| Karte | `display:flex; flex-direction:column; height:100%`, 1-px-Rahmen `--color-border`, Radius 2 px, Fläche `--color-bg-card` |
| Farbfeld | `aspect-ratio:16/9`, Verlauf `soft → core 58% → deep`, 1-px-Unterkante `--color-line-strong` |
| Inhalt | 24 px Innenabstand, 12 px Abstand, Titel `h3` 28 px |
| Text | 14 px/1.6, sekundär, 3–4 Zeilen |
| Chips | `.astro-badge`, max. 2 pro Karte |
| Fuß | `margin-top:auto` + `padding-top` → Karten einer Reihe gleich hoch |

**Zustände:** Nur wenn die ganze Karte verlinkt ist, wird sie interaktiv
(`a.fw-card` oder `class="card-interactive"`); dann Hover = Rahmen
`--color-line-strong`, Titel unterstrichen. Keine Karte ohne Ziel verlinken.

**Inhaltsregel:** Der Text nennt eine belegbare Aussage, keine Wirkversprechen.
Beispiel Rot: „Langwelliges Licht am Rand des sichtbaren Bereichs …“ statt
„Rot aktiviert die Durchblutung“.

## 5. Chakra-Explorer (`fw-chakra`, `fw-figure`, `fw-node`)

**Zweck:** Farbe–Chakra-Zuordnung räumlich und per Tastatur erfahrbar machen.

**Aufbau:** zweispaltig (Figur max. 420 px + Textspalte max. 62 ch).
Die Figur ist eine eigene SVG (`viewBox="0 0 200 420"`) mit `<title>`/`<desc>`;
die sieben Positionsschaltflächen liegen als echte `<button>` **über** der SVG
im selben Positionierungscontainer.

| Eigenschaft | Wert |
| --- | --- |
| Knoten | 44 × 44 px (≤700: 36, ≤400: 32), 1-px-Rahmen `--color-line-strong`, Fläche `--color-bg-deep`, Radius `--radius-full` (2 px) |
| Position | `left:50%`, `top` = y/420 × 100 % — Wurzel 60 %, Sakral 50,48 %, Solar 41,43 %, Herz 31,43 %, Hals 20,95 %, Stirn 11,9 %, Krone 5,24 % |
| Nummer | Mono 13 px, plus 10-px-Farbpunkt (`aria-hidden`) |
| Auswahl | `aria-pressed="true"`, Rahmen 2 px Sand + Innenkante `--color-bg-deep`; **nicht** über `outline` (sonst Kollision mit Fokus) |
| Fokus | 2 px Sand, 4 px Offset, zusätzlich zum Auswahlrahmen sichtbar |
| Pfeiltasten | ↑/↓/←/→ wechseln zur Nachbarposition, Fokus folgt |
| Panel | `aria-live="polite"`; Name, Sanskrit, Position, Symbolfarbe, Themen, Einordnung, Link zur Farbwelt |

**Inhaltsregeln:**

- Die Nummernfolge ist Wurzel (1) → Krone (7); die DOM-Reihenfolge entspricht
  der Nummernfolge, nicht der visuellen Höhe.
- Die Einordnung sagt klar: „Spirituelle Deutungstradition, keine medizinische
  Größe“.
- Kein Heilversprechen, keine „Aktivierungs“-Sprache.
- Die Figur ist als stilisiert gekennzeichnet; keine anatomischen Details.

## 6. Hinweiskasten „Tradition und Forschung“ (`fw-compare`)

**Zweck:** Widersprüchliche Aussagen nebeneinander zeigen, ohne sie
gleichzugewichten.

```html
<div class="fw-compare">
  <div class="fw-compare__col">
    <p class="label">Tradition</p>
    <h3>Rotes Licht und Wärme</h3>
    <p>…</p>
    <span class="astro-badge astro-badge--deutungstradition">Deutungstradition</span>
  </div>
  <div class="fw-compare__col">
    <p class="label">Forschung</p>
    <h3>Was tatsächlich untersucht ist</h3>
    <p>…</p>
    <span class="astro-badge astro-badge--empirie">Empirie begrenzt</span>
  </div>
  <p class="fw-compare__foot">Die Evidenzlage ist nicht symmetrisch: …</p>
</div>
```

- Zwei gleiche Spalten (kein „richtig/falsch“-Layout), 1-px-Trenner; linke
  Kante 2 px Sand markiert den Block als Hinweis.
- Die Fußzeile ist **Pflicht**, wenn die Evidenz ungleich ist; sie verhindert
  die Lesart „beide Seiten gleich stark“.
- Mobil gestapelt, Trenner waagerecht.
- Keine Farbe pro Spalte (kein Grün/Rot); die Kennzeichnung leisten die Chips.

## 7. Evidenz-Chips

Vorhandene Klassen (`css/main.css`), keine neuen Farben:

| Stufe | Klasse | Verwendung |
| --- | --- | --- |
| Gesichert / gut belegt | `.astro-badge--empirie` | z. B. „Blau und circadiane Rhythmik“ |
| Untersucht, Evidenz begrenzt | `.astro-badge--empirie` + Text „begrenzt“ | Photobiomodulation |
| Historische Überlieferung | `.astro-badge--historisch` | Farbenlehre, historische Praxis |
| Deutungstradition | `.astro-badge--deutungstradition` | Chakra-Zuordnung, Symbolik |
| Konvention | `.astro-badge--konvention` | Wellenlängengrenzen, Farbnamen |
| Hypothese / spekulativ | `.astro-badge--konvention` mit `border-style:dashed` + Text „Hypothese“ | nur wenn ausdrücklich spekulativ |

Regeln: Chiptext ist immer ausgeschrieben („Empirie begrenzt“, nicht „E2“);
Chips stehen am Ende des Absatzes, nicht als Dekoration am Titel; maximal zwei
pro Abschnitt.

## 8. Farbdetail-Kopf (`fw-detail`)

- Band mit Verlauf `--fw-current-deep → --color-bg-card`, 1-px-Unterkante.
- Label in `--fw-current-ink` (4,8–5,3:1 auf `deep`), H1/H2 in
  `--color-text-primary`, Lede in `--color-text-secondary`.
- Innenabstand 48 px Desktop, 32 px mobil (Containerrhythmus), 64 px oben.
- Rechts daneben (≥1100 px) das Inhaltsverzeichnis; darunter eine
  Kennzeichnungszeile mit den Evidenzstufen der Seite.

## 9. Inhaltsverzeichnis (`fw-detail__toc`)

- Desktop: rechte Spalte, 1-px-Linie links, 280 px breit, Links unterstrichen.
- Mobil: `<details class="astro-toc">` mit `<summary>` „Auf dieser Seite“.
- Ankerziele sind die Abschnitts-IDs (`#erleben` … `#quellen`); keine leeren
  Sprungziele.
- Aktiver Abschnitt wird nicht farblich markiert (kein Scrollspy-Zwang).

## 9. Brotkrümel und Chakra-Tabelle

### 9.1 Brotkrümel

```html
<nav class="fw-breadcrumb" aria-label="Brotkrümelnavigation">
  <ol>
    <li><a href="#home">Start</a></li>
    <li><a href="#farbwelten">Farben</a></li>
    <li><span aria-current="page">Rot</span></li>
  </ol>
</nav>
```

- 14 px, `--color-text-secondary`; Trenner `›` als `::before` (aria-hidden),
  keine Icons.
- Aktuelle Seite ist Text, kein Link; `aria-current="page"`.
- Steht zwischen Kopfzeile und Hero-Band, 16 px Abstand nach unten.
- Auf der Einstiegsseite entfällt der Brotkrümel (die Seite ist die Wurzel).

### 9.2 Tabelle Farbe–Chakra

```html
<table class="fw-table">
  <caption>Zuordnung der sieben Chakren zu Farbwelten (modernes Regenbogenmodell)</caption>
  <thead>
    <tr><th scope="col">Chakra</th><th scope="col">Sanskrit</th><th scope="col">Position</th><th scope="col">Farbe</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row"><a href="#farbwelten/chakren">Wurzelchakra</a></th><td>Mūlādhāra</td><td>Steißbeinbereich</td><td><a href="#farbwelten/rot">Rot</a></td></tr>
    <!-- 6 weitere -->
  </tbody>
</table>
```

- 1-px-Trenner `--color-border`, Kopfzeile `--color-text-secondary` 13 px
  uppercase, Zellen 16 px; auf Mobil horizontal scrollbar in einem
  `role="region" aria-label="Tabelle Farbe und Chakra" tabindex="0"`.
- Farbname immer als Textlink, nicht als Farbpunkt allein.
- `<caption>` ist sichtbar (13 px, sekundär) und nennt die Quelle der Zuordnung.

## 10. Spektrum-Explorer (FW-07, Spezifikation)

Noch nicht im Mockup; Vorgaben für die Umsetzung:

- Slider `<input type="range" min="380" max="780" step="1">` mit sichtbarem
  Label „Wellenlänge in Nanometern“ und `aria-valuetext` („530 Nanometer,
  Grün, 565,6 Terahertz“).
- Anzeige: Wellenlänge, Frequenz (`299792,458 / λ`), Photonenergie
  (`1239,842 / λ`), Farbname, Einordnung spektral/Mischfarbe.
- Farbfläche als Simulation gekennzeichnet; kein Anspruch auf monochromatisches
  Licht.
- Tastatur: Pfeiltasten ±1 nm, Shift ±10 nm, Home/End an die Grenzen.
- `prefers-reduced-motion`: keine laufende Aktualisierungsanimation.
- Werte werden berechnet, nicht als Tabelle dupliziert; Tests prüfen
  Stützwerte (650 nm → 461,2 THz, 530 nm → 565,6 THz).

## 11. Farbmeditation (FW-12, Spezifikation)

- Freiwillig, Start/Pause/Beenden, Dauer 1–10 Minuten, keine Musik, kein Blinken.
- Fläche wechselt höchstens alle 20 s und nur zwischen zwei Tönen derselben
  Farbwelt; `prefers-reduced-motion` → statische Fläche.
- Text nennt sie „Reflexions- bzw. Visualisierungsübung“, nicht Behandlung.
- Keine Speicherung von Eingaben, keine Cookies, kein Tracking.

## 12. Was nicht gebaut wird

- Keine Karussells, keine automatisch rotierenden Farbspektren.
- Keine Icon-Reihen als Ersatz für Text.
- Keine „Heilfrequenz“-Rechner, keine Chakra-Frequenztabellen.
- Keine Modalfenster für Farbinhalte (die Seiten sind eigenständige Routen).
