# Gestaltung: Seiten-Inhaltsverzeichnis (TOC) für VELARKANA

**Status:** Entwurf zur Umsetzung · **Version:** 1.0 · **Stand:** 4. November 2026
**Aufgabe:** Kanban `t_fd9d97f0` (Teil von `t_296b0496`, Pilot „Automatisches Seiten-Inhaltsverzeichnis“)
**Rolle:** Senior Web Interface Designer (Gestaltung, keine Produktionsimplementierung)
**Pilotseite:** `/frequenzen/quellen.html` (29 Einträge, h2/h3)
**Untersuchte Codebasis:** `ingbms/velarkana-dev`, Branch `astro-migration`, Commit `9d14d37`
(lokaler Worktree `…/.worktrees/t_7ad19549`, Astro 7.4.5)
**Verhaltensgrenzen:** `docs/velarkana-toc/spezifikation.md` (Task `t_5edc1d8c`, Commit `69a514f`)

> **Kurzfassung.** Auf Desktop ab 1200 px steht das Verzeichnis als ruhige Randspalte rechts
> (260 px, 1-px-Haarlinie, sticky unter dem Header, eigener Scrollbereich). Unter 1200 px wird es
> zum kompakten `<details>`-Block über dem Artikel, mit JS geschlossen. Typografie: Mono-Label
> 13 px, Einträge 14 px in Manrope, h3 um 16 px eingerückt, aktiver Eintrag mit 2-px-Sandmarke
> und `aria-current="location"`. Alle Werte stammen aus den bestehenden Tokens; gemessen an der
> echten Pilotseite bei 1440/1200/1024/768/390/320 px. Kein neues Farb-, Schrift- oder
> Schattenvokabular, keine Änderung an anderen Seiten.

---

## 1. Auftrag und Abgrenzung

Die Spezifikation `t_5edc1d8c` legt Verhalten, Anker, A11y und Abnahmekriterien fest. Dieses
Dokument entscheidet **die Optik innerhalb dieser Grenzen**: Platzierung, Typografie, Abstände,
Zustandsdarstellung, Auf-/Zuklappen, Dark/Light, Breakpoints und die Umsetzung als
CSS-Klassenvertrag. Bei Widerspruch gilt die Spezifikation für Verhalten, dieses Dokument für
Typografie, Farben und Abstände (§1 der Spezifikation).

**Im Scope:** Gestaltungskonzept, Wireframes, annotiertes Mockup, Komponenten-/CSS-Spezifikation
mit Props, Zuständen und Breakpoints, Messnachweise.

**Nicht im Scope:** Produktionscode, Änderungen an `BaseLayout`, `SiteHeader`, `SiteFooter`,
bestehenden TOCs (`.astro-toc`, `.fw-toc`), Inhalten, Überschriften oder IDs; Aktivierung auf
weiteren Seiten; Persistenz des Aufklappzustands.

---

## 2. Bestandsanalyse (gemessen, nicht angenommen)

### 2.1 Gestaltungssystem

| Element | Wert | Quelle |
|---|---|---|
| Flächen | `--color-bg-deep #0b1012`, `--color-bg-card #141c1f` | `css/design-system.css` |
| Text | `--color-text-primary #eae6dc`, `--color-text-secondary #babdb7` | dito |
| Akzent | `--color-primary #c6b38e`, Hover `#d5c4a2` | dito |
| Linien | `--color-border #3c484b` (dekorativ), `--color-line-strong #82928e` (funktional) | dito |
| Schriften | `--font-display` Fraunces, `--font-body` Manrope, `--font-mono` System-Mono | dito |
| Textgrößen | `--text-xs 13px`, `--text-sm 14px`, `--text-base 16px` | dito |
| Raster | 4 px; `--space-1…24` (4…96) | dito |
| Radien | `--radius-sm/md/lg 2px`, `--radius-xl/2xl 4px` | dito |
| Elevation | alle `--shadow-*: none` | dito |
| Header | `position: sticky`, `min-height: 100px`, mobil 84 px; gemessen 101/85 px (1-px-Unterkante) | dito |
| Fokus | `outline: 2px solid var(--color-text-primary); outline-offset: 2px` | `a/button/summary:focus-visible` |
| Anker | `scroll-padding-top: calc(var(--header-height) + var(--space-4))`, `scroll-behavior: smooth`, bei `prefers-reduced-motion` `auto` | dito |

**Konsequenz für den Entwurf:** Das Verzeichnis darf keine Karte mit Schatten, keine Pille und
keine zweite Display-Schrift einführen. Es lebt von einer Haarlinie, einem Mono-Label und
Sand als einzigem Akzent — dieselbe Sprache wie Brotkrumen, `.label` und `.astro-toc`.

### 2.2 Platzverhältnisse der Pilotseite

| Messung | Wert | Bedingung |
|---|---|---|
| Seite/Container | `.page-body` 1360 px außen, 1232 px Inhalt (Padding 64 px) | 1440×900 |
| Fließtext | `.prose` 720 px (`max-width: 72ch`) | 1440×900, nach `document.fonts.ready` |
| Artikelhöhe | 22.250 px | 1440 |
| Header-Inhalt | Logo links bei x = 64, Navigation rechts bis x = 1269 | 1440 (Scrollleiste 15 px) |
| Seite/Container | `.page-body` 1056 px Inhalt | 1199 |
| Fließtext | 689 px | 768 |
| Bestehender Überlauf | `scrollWidth` 540 statt 390 | 390 (vorbestehend, siehe §9 F-1) |

**Befund zur Rahmenbreite:** `.page-body` ist um 128 px schmaler als der Header-Container
(`.header-inner` nutzt `calc(container-max + gutter×2)`, `.page-body` nur `container-max`). Der
Fließtext beginnt deshalb 97 px vom Fensterrand, die Kopfzeile 64 px. Das ist Bestand und wird
nicht verändert; die Randspalte endet an der Innenkante von `.page-body` (x = 1329 bei 1440) und
ist damit **symmetrisch zur Textkante links** (97 px links, 96 px rechts inklusive Scrollleiste).

### 2.3 Vorhandene Muster

| Muster | Befund | Konsequenz |
|---|---|---|
| `.astro-toc` (Radiästhesie) | `<details open>` + `<summary>` + `<nav><ol>`; klebt als Karte; **kein** Scroll-Spy; `.astro-aside` ist gestreckt → Sticky faktisch wirkungslos (Spezifikation R-2) | Semantik übernehmen, Gestaltung und Sticky neu lösen; bestehendes Muster nicht anfassen |
| `.fw-toc` (Farbwelten-CSS) | sticky mit `align-self:start` und `max-height`, aber ungenutzt | nur als technischer Hinweis, nicht als Vorlage |
| Bereichsnavigation `.area-nav` | Pillen mit 999-px-Radius (außerhalb der Radius-Tokens) | nicht kopieren; TOC bleibt eckig und listenbasiert |
| `.block-quote` | `border-left: 3px solid var(--color-primary)` + Kartenfläche | Vorbild für die Sandkante der Mobil-Variante |

---

## 3. Gestaltungsentscheidungen

| Nr. | Entscheidung | Begründung | Verworfene Alternative |
|---|---|---|---|
| G-1 | **Rechte Randspalte ab 1200 px**, 260 px breit, 64 px Abstand zur Textspalte | Spezifikation AK-E1 fordert 240–280 px und ≥ 32 px Abstand; 260 px trägt die längsten Einträge (63 Zeichen) in drei Zeilen. 64 px entspricht `--space-16` und dem bestehenden `.astro-layout` | 240 px (zu eng für 63-Zeichen-Einträge), 280 px (drückt die Textspalte bei 1200 px auf 697 px) |
| G-2 | **Randspalte ohne Karte**, nur 1-px-Haarlinie links + Mono-Label | Die Seite kennt keine schwebenden Karten; eine Box würde wie ein Widget wirken und mit der Artikeltypografie konkurrieren | Karte wie `.astro-toc` (Rahmen, Fläche) — zu schwer, doppelt die Karten der Artikel |
| G-3 | **Typografie: Mono-Label 13 px uppercase, Einträge 14 px Manrope** | Labels der Seite sind mono/uppercase (`--text-xs`, `.label`); 14 px hält 29 Einträge kompakt, ohne unter die 13-px-Untergrenze zu gehen | 16 px (zu laut, verdrängt den Artikel), 13 px (zu klein für lange deutsche Komposita) |
| G-4 | **Hierarchie über Einrückung, nicht über Schriftgrad**; h3 = 16 px eingerückt, gleiche Größe | Zwei Schriftgrade in 260 px erzeugen Unruhe; Einrückung ist auch ohne Farbe lesbar | h3 kleiner (11–12 px) → unterschreitet die Mindestgröße |
| G-5 | **Aktiver Eintrag: 2-px-Sandmarke links + Textfarbe primary + Gewicht 500** | Farbe allein wäre WCAG 1.4.1-verletzend; die Marke ist immer reserviert, damit nichts springt (gemessen: keine Verschiebung) | Nur Farbwechsel; Unterstreichung (kollidiert mit Link-Hover der Seite) |
| G-6 | **Mobile: `<details>`-Block über dem Artikel, Sandkante links, kein Rahmen** | Eine Rahmenlösung ist themenabhängig: `--color-border` liegt bei 2,02:1 (auch im Dunkeln), `--color-line-strong` im Dunkeln bei 5,88:1, in der Light-Reserve aber nur bei 2,45:1. Die Sandkante trägt in beiden Themes (9,33:1 dunkel, 6,50:1 hell) und entspricht `.block-quote` | Umlaufender 1-px-Rahmen (`--color-line-strong` im Dunkeln konform, in Light nicht) |
| G-7 | **Auf Desktop ist das Summary ausgeblendet**, das Verzeichnis dauerhaft offen; eine rein visuelle Überschrift im `nav` trägt das Label | Ein Schalter, der eine 260-px-Spalte ein- und ausklappt, verschiebt den Artikel und irritiert; das `aside` bleibt über `aria-labelledby` benannt | Summary auch auf Desktop sichtbar (Doppelrolle als Titel und Schalter) |
| G-8 | **Keine Vorschau des aktuellen Abschnitts im geschlossenen Summary** | Das Summary ist laut Spezifikation §6.4 der Titel (`id="page-toc-title"`, namensgebend für das `aside`). Eine mitlaufende Abschnittsangabe würde den zugänglichen Namen bei jedem Scroll ändern | „Auf dieser Seite · 6.2 Hörbereich“ (verworfen, siehe G-8) |
| G-9 | **Keine Kürzung, Umbruch mit Silbentrennung** (`overflow-wrap:anywhere`, `hyphens:auto`) | Spezifikation AK-B7/R-8: vollständiger Text bis 235 Zeichen; gemessen 10 Zeilen, 195 px, kein Überlauf | `text-overflow: ellipsis` (verletzt AK-B7) |
| G-10 | **Scroll-Hinweis als Verlauf**, nur wenn tatsächlich abgeschnitten | Bei 29 Einträgen ist der Scrollbereich nicht selbsterklärend; der Verlauf erscheint erst mit `data-overflow` aus dem Skript, ohne JS bleibt er aus | Permanenter Verlauf (behauptet Überlauf, der nicht existiert), Scrollbalken allein (im Dunkeln kaum sichtbar) |
| G-11 | **Aktiver Eintrag bleibt im Scrollbereich sichtbar** (`scrollIntoView block:'nearest'`, instant) | Ohne diese Regel stand der aktive Eintrag bei Abschnitt 11 gemessen 267 px unter der Liste | Liste nicht mitführen (Orientierung verloren) |
| G-12 | **Fokus nach Aktivierung auf die Zielüberschrift** (`preventScroll`) | Tastatur und Screenreader landen sonst weiter im Verzeichnis; ohne `preventScroll` würde der Fokus den Ankersprung stören | Fokus im TOC lassen (schlechtere Weiterführung) |

---

## 4. Layout

### 4.1 Desktop (≥ 1200 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  VELARKANA            Start  Tarot  …  Farben                         ♥ 0   │  Header, sticky, 101 px
├──────────────────────────────────────────────────────────────────────────────┤
│  Start › Frequenzen › Quellen & Methodik                                     │
│  BELEGE                                                                      │
│  Quellen und Methodik                                   ┌──────────────────┐ │
│  Für jeden Eintrag des Frequenzlabors …                 │ AUF DIESER SEITE │ │  ← Mono 13 px
│  (Bibliothek) (Frequenzlabor) …                         │▌Frequenzen: Qu…  │ │  ← aktiv: 2-px-Marke
│                                                          │ 1. Zweck …       │ │
│  Frequenzen: Quellen, Evidenzstatus und Methodik         │ 2. Suchstrategie │ │
│  Stand: …                                                │   5.1 Physik …   │ │  ← h3 +16 px
│  Dieses Dokument belegt …                                │   5.2 Esoterik … │ │
│  …                                                       │ ░ Verlauf ░      │ │  ← nur bei Überlauf
│  (720 px Textspalte, linksbündig)                        └──────────────────┘ │
│                                                            260 px, sticky     │
└──────────────────────────────────────────────────────────────────────────────┘
   ← 64 →                                      ← 64 →  ← 64 →      ← 64 →
```

* Raster: `.page-body--toc { grid-template-columns: minmax(0,1fr) 260px; gap: 64px; }`
* Das `aside` steht im DOM **vor** dem Artikel, wird per `grid-column: 2` nach rechts gesetzt.
* `position: sticky`, `top: calc(var(--header-height) + 24px)`, `align-self: start`,
  `max-height: calc(100dvh - var(--header-height) - 96px)`; innen scrollt `.page-toc__body`.
* Linke Haarlinie `1px solid var(--color-border)`, Innenabstand links 24 px. Die Haarlinie ist
  dekorativ (2,02:1) und trennt nur die Randspalte; sie identifiziert kein Bedienelement.

**Gemessene Werte**

| Viewport | Textspalte | Randspalte | Abstand | TOC-Höhe | Budget (vh − header − 96) | Sticky-Top nach Scroll |
|---|---|---|---|---|---|---|
| 1920×1080 | 720 | 260 | 252 | 883 | 883 | 124 |
| 1440×900 | 720 | 260 | 252 | 703 | 703 | 124 |
| 1280×800 | 720 | 260 | 157 | 603 | 603 | 124 |
| 1200×800 | 720 | 260 | 77 | 603 | 603 | 124 |

Der Abstand wächst mit dem Viewport, weil der Text bei 72ch gedeckelt ist und die Spalte am
rechten Containerrand bleibt. Bei 1200 px sitzt die Randspalte direkt am Text (77 px), bei 1440 px
entsteht Luft. Diese Asymmetrie ist bewusst: die Randspalte fluchtet mit dem Seitenrahmen
(rechts), der Text mit der linken Textkante — beide Kanten sind in §2.2 gemessen.

### 4.2 Inline-Variante (< 1200 px)

```
┌───────────────────────────────────────────────┐
│  Start › Frequenzen › Quellen & Methodik      │
│  BELEGE                                       │
│  Quellen und Methodik                         │
│  Für jeden Eintrag …                          │
│  (Bibliothek) (Frequenzlabor) …               │
│ ┃ AUF DIESER SEITE                          + │  ← 44 px, Sandkante 2 px
│                                               │
│  Frequenzen: Quellen, Evidenzstatus …         │  ← Artikel beginnt darunter
└───────────────────────────────────────────────┘

geöffnet:
│ ┃ AUF DIESER SEITE                          – │
│ ┃  Frequenzen: Quellen, Evidenzstatus und     │  ← max-height 56dvh,
│ ┃  Methodik                                    │    eigener Scrollbereich
│ ┃  1. Zweck und Geltungsbereich                │
│ ┃    5.1 Physikalisch / physiologisch          │
└───────────────────────────────────────────────┘
```

* Volle Inhaltsbreite (327 px bei 390, 945 px bei 1024), Abstand zum Artikel 24 px.
* `border-left: 2px solid var(--color-primary)`, Fläche `--color-bg-card`, kein Radius.
* Summary-Höhe 44 px (gemessen), Label mono/uppercase 13 px, Plus/Minus als Textzeichen.
* Geöffnet: `.page-toc__body { max-height: 56dvh; overflow-y: auto; }` — der Artikel wird
  nach unten geschoben, nie überdeckt.

**Gemessene Werte**

| Viewport | Blockbreite | Summary | Listenfläche | Scrollbereich innen | Überlauf im TOC |
|---|---|---|---|---|---|
| 1199×800 | 1056 | 44 | 480 (60dvh) | 1044/1044 | nein |
| 1024×768 | 945 | 44 | 461 | 933/933 | nein |
| 768×1024 | 689 | 44 | 614 | 677/677 | nein |
| 390×844 | 327 | 44 | 473 | 315/315 | nein |
| 320×640 | 257 | 44 | 358 | 245/245 | nein |
| 720×450 (200 % Zoom auf 1440) | 641 | 44 | 270 | 629/629 | nein |

### 4.3 Umschaltpunkt

Bei 1200 px: Randspalte rechts, sticky, offen (gemessen x = 861, 260 px, `position: sticky`).
Bei 1199 px: Block oben, volle Breite, `position: static`, geschlossen (Summary 44 px).
Kein Zwischenzustand, keine Überlappung mit Header oder Artikel (gemessen `overlapHeader: false`).

---

## 5. Typografie, Abstände, Farben

| Element | Spezifikation |
|---|---|
| Rail-Label / Summary | `--font-mono`, 13 px, `letter-spacing: .06em`, uppercase, `--color-text-secondary`, Ziffern ohne Nummerierung |
| Eintrag h2 | `--font-body`, 14 px / 1.45, `--color-text-secondary` |
| Eintrag h3 | wie h2, `padding-left: calc(12px + 16px)` (28 px) |
| Aktiver Eintrag | `--color-text-primary`, `font-weight: 500`, `border-left: 2px solid var(--color-primary)` |
| Hover | `--color-primary` |
| Zeilenabstand im Eintrag | min. 32 px Zielhöhe (Desktop), 44 px bei `pointer: coarse` |
| Abstand Label → Liste | 16 px (`--space-4`) |
| Abstand Einträge | 0; Trennung ausschließlich über Zeilenlänge (keine Trennlinien) |
| Innenabstand Liste (Desktop) | rechts 4 px, sonst 0 (bündig zur Haarlinie + 24 px) |
| Innenabstand Liste (Mobil) | 16 px seitlich, 4/16 px vertikal |
| Radius | 0 (Rail), 0 (Mobil-Block) — die Seite kennt nur 2/4 px an Karten und Knöpfen |
| Schatten | keiner |
| Silbentrennung | `hyphens: auto` (lang=de), `overflow-wrap: anywhere` |

**Kontrast (berechnet mit `mockup/contrast.py`, WCAG 2.x, sRGB):**

| Paar | Dunkel | Light-Reserve | Soll |
|---|---|---|---|
| Link Ruhe (secondary auf bg-deep) | **10,07:1** | 7,22:1 | ≥ 4,5 |
| Link Ruhe im Panel (secondary auf bg-card) | **9,09:1** | 7,79:1 | ≥ 4,5 |
| Link Hover (primary auf bg-deep) | **9,33:1** | 6,50:1 | ≥ 4,5 |
| Aktiver Link (text-primary auf bg-deep) | **15,36:1** | 14,31:1 | ≥ 4,5 |
| Fokusring (text-primary auf bg-deep) | **15,36:1** | 14,31:1 | ≥ 3,0 |
| Aktivmarke 2 px (primary auf bg-deep) | **9,33:1** | 6,50:1 | ≥ 3,0 |
| Sandkante Mobil (primary auf bg-card) | **8,42:1** | 7,01:1 | ≥ 3,0 |
| Rail-Haarlinie (dekorativ, border auf bg-deep) | 2,02:1 | 1,51:1 | — (dekorativ) |
| Rahmen-Alternative `--color-line-strong` (verworfen) | 5,88:1 | 2,45:1 | themenabhängig, siehe G-6 |

**Dark/Light:** Es gibt **kein ausgeliefertes Light-Theme**. `[data-theme='light']` ist eine
unverifizierte V1-Studie (`tokens.css`, „RESERVED V1 STUDY — NOT A USER-REACHABLE STATE“); keine
Seite setzt `data-theme`. Der Entwurf verwendet ausschließlich semantische Tokens, sodass ein
späteres Theme automatisch folgt; die Light-Spalte oben ist eine **Vorabrechnung auf den
Studienwerten**, keine Abnahme eines ausgelieferten Themes. Würde Light aktiviert, wären alle
Text- und Fokuspaare bereits konform; die Haarlinie müsste dann auf `--color-line-strong`
wechseln (dort 2,45:1 → für eine dekorative Linie ausreichend, für eine Containergrenze nicht).

---

## 6. Interaktion und Zustände

### 6.1 Zustandsmatrix

| Zustand | Auslöser | Darstellung | Gemessen |
|---|---|---|---|
| `default` | Seite geladen, Eintrag nicht aktiv | secondary, 14 px, keine Marke | 10,07:1 |
| `hover` | Zeiger über Eintrag | primary, keine Unterstreichung | 9,33:1 |
| `focus-visible` | Tastaturfokus | 2-px-Ring `--color-text-primary`, Offset 2 px, Innenpuffer gegen Clipping | 15,36:1, Ring 2 px |
| `active` (Scroll-Spy) | Abschnitt an der Offset-Linie | primary-Text, Gewicht 500, 2-px-Sandmarke, `aria-current="location"` + `.is-active` | genau 1 Element |
| `open` | Summary geöffnet | Minus, Liste sichtbar, Verlauf wenn nötig | 44 px Summary |
| `closed` | < 1200 px nach JS | Plus, Liste nicht im Layout | 44 px |
| `overflow` | Liste höher als Fläche | weicher Verlauf oben/unten, eigener Scrollbalken (8 px, `--color-border`) | 29 Einträge → 1.383 px Inhalt in 670 px |
| `reduced-motion` | Systemeinstellung | keine Transition, `scroll-behavior: auto` | bestätigt |
| `print` | Druck | Verzeichnis `display: none` | bestätigt |

### 6.2 Scroll-Spy

Offset-Linie = `--header-height` + 24 px (Spezifikation §6.5). Aktiv ist die letzte Überschrift auf
oder oberhalb der Linie; am Dokumentende der letzte Eintrag. Geprüft bei 1440 px:

| Aktion | erwartet | gemessen |
|---|---|---|
| Laden ohne Hash | erster Eintrag aktiv | „Frequenzen: Quellen, Evidenzstatus und Methodik“ |
| Scroll zu `4-datenschema` | Eintrag 4 | „4. Datenschema“ |
| Scroll zu `6-einzelprüfungen` | Eintrag 6 | „6. Einzelprüfungen“ |
| Scroll zu `11-…` | Eintrag 11 | „11. Hinweise für UI und Audio-Engine“, Liste auf 649 px mitgeführt |
| Aufwärts zu 6, dann 2 | 6, dann 2 | „6. Einzelprüfungen“, „2. Suchstrategie und Aufnahmekriterien“ |
| Dokumentende | letzter Eintrag | „13. Änderungslog“ |
| genau ein `aria-current` | 1 | 1 (bei jeder Messung) |

### 6.3 Aktivierung und Ankersprung

Die Spezifikation verbietet `preventDefault` und eigenes Smooth-Scrolling (§6.5 Nr. 9). Der
Entwurf hält sich daran: Der Klick schließt auf schmalen Viewports **vor** der Standardaktion das
Panel, danach springt der Browser mit `scroll-padding-top`.

| Fall (390 px, Header 85 px) | erwartet | gemessen |
|---|---|---|
| Klick auf Eintrag 8 (Panel vorher offen) | Ziel bei 84 + 16 = 100 ± Toleranz | **100**; Panel zu, Hash gesetzt, Fokus auf `h2` |
| Direktaufruf `#6-einzelpr%C3%BCfungen` | Ziel bei 100, Eintrag sofort aktiv | **100**, „6. Einzelprüfungen“, `aria-current` = 1 |
| Ohne JavaScript, Klick auf Eintrag 8 | Ziel unter dem Header | **100**, `aria-current` = 0 |
| 1440 px, Klick auf Eintrag 11 | Ziel bei 117 | 116 (Header 101 + 16) |

**Wichtig:** Der frühere Entwurf wich auf eigenes Scrollen aus, weil eine Messung 325 px daneben
lag. Ursache war eine zu kurz bemessene Wartezeit während des nativen Smooth-Scrolls über 19.000 px,
nicht das Verhalten. Mit ausreichender Wartezeit landet der native Sprung exakt im Toleranzfenster
(AK-D5: `[header+4, header+40]`). Der Entwurf bleibt damit spezifikationskonform.

### 6.4 Tastatur

| Schritt | Ergebnis |
|---|---|
| `<summary>` im Tab-Fokus | `tabIndex 0`, erreichbar |
| Enter auf Summary | schließt, Fokus bleibt auf Summary |
| Leertaste auf Summary | öffnet, Fokus bleibt |
| Fokusring | 2 px, `#c6b38e`, `:focus-visible` |
| Tab aus Summary | erster Eintrag der Liste (DOM-Reihenfolge) |
| Alle 29 Links | einzeln per Tab erreichbar, kein Fokusverlust beim Auf-/Zuklappen |

### 6.5 No-JS

| Prüfung | Ergebnis |
|---|---|
| `<details>` | offen (Server-Markup), Summary 44 px |
| Links | 29, vollständig im HTML |
| `aria-current` im TOC | 0 (kein Scroll-Spy, zulässig) |
| Ankersprung | funktioniert nativ, Ziel bei 100 px (390) |
| Überlauf/leerer Bereich | keiner |

---

## 7. Annotiertes Mockup

`mockup/quellen.html?annotate=1` zeigt fünf Marken im leeren Raum links der Randspalte
(Screenshot: `evidence/1440-annotiert.png`). Auf schmalen Viewports wird nicht annotiert: dort
bleiben links nur 24 px Rand, die Marken lägen außerhalb des Viewports.

| Marke | Stelle | Vorgabe |
|---|---|---|
| 1 | `aside.page-toc` | Randspalte 260 px, sticky, `align-self:start`, max-height-Budget |
| 2 | `.page-toc__title` | Mono 13 px, uppercase, 16 px Abstand zur Liste; nur Desktop |
| 3 | aktiver Eintrag | 2-px-Sandmarke, primary-Text, Gewicht 500, `aria-current` |
| 4 | h3-Eintrag | 16 px zusätzliche Einrückung, gleiche Größe |
| 5 | `.page-toc__body` | eigener Scrollbereich, Verlauf als Überlaufhinweis |
| 6 | `.page-toc__summary` | 44 px Ziel, Plus/Minus, Sandkante; nur < 1200 px (im Desktop-Screenshot ausgeblendet, daher nicht markiert) |

Weitere Screenshots (alle in `evidence/`): `1440-start.png`, `1440-sticky-aktiv.png`,
`1200-rail.png`, `1024-offen.png`, `390-zu.png`, `390-offen.png`, `1440-kurz.png`,
`1440-stress-lang.png`, `390-nach-klick.png`, `390-deeplink.png`.

**Mockup-Dateien** (nicht produktiv): `mockup/quellen.html` (Pilotseite, 29 Einträge),
`mockup/blau.html` (Kurzfall, 8 Einträge), `mockup/stress.html` (Fixture 235 Zeichen),
`mockup/toc.css`, `mockup/toc.js`, `mockup/build-mockup.py`, `mockup/contrast.py`,
`mockup/budget.py`.

---

## 8. Komponenten- und CSS-Vertrag (Kurzfassung)

Die vollständige Fassung steht in `02-komponenten-spezifikation.md`. Kern:

* Markup laut Spezifikation §6.4: `aside.page-toc[data-toc][aria-labelledby]` → `details.page-toc__details[data-toc-details][open]` → `summary.page-toc__summary#page-toc-title` + `nav.page-toc__nav[aria-label="Inhaltsverzeichnis"]` → `ol.page-toc__list`.
* Zusätzlich im `nav`: `p.page-toc__title[aria-hidden="true"]` als rein visuelle Rail-Überschrift
  (Desktop), weil das Summary dort ausgeblendet ist.
* Klassen: `page-toc__body`, `page-toc__item`, `page-toc__item--2`, `page-toc__item--3`,
  `page-toc__link`, `is-active`.
* Datenhaken: `data-toc`, `data-toc-details`, `data-toc-body`, `data-toc-scope` (Artikel),
  `data-overflow` (`top|bottom|both`, vom Skript gesetzt).
* Variablen (auf `.page-body--toc`): `--toc-rail-width: 260px`, `--toc-item-min: 32px`,
  `--toc-inset: 12px`, `--toc-title-block: 34px`.

**Budget (gemessen, `mockup/budget.py`):** CSS minifiziert 4.032 B, **gzip 1.233 B** (Budget
1,5 KB); JS minifiziert 4.788 B, **gzip 1.685 B** (Budget 5 KB).

---

## 9. Befunde und Vorbedingungen (nicht durch das TOC verursacht)

| Nr. | Befund | Messung | Wirkung | Empfehlung |
|---|---|---|---|---|
| F-1 | **Seitenüberlauf bei 390/320 px** durch Codeblöcke (`pre` 1.260 px) und ein 26-Zeichen-Kompositum in einer h2 (469 px) | `scrollWidth` 540 (Mockup **und** Baseline ohne TOC identisch) | AK-E5 „kein neuer Überlauf“ ist erfüllt (TOC trägt 0 bei), das globale „≤ 390“ nur nach Behebung von R-1 | `pre { overflow-x:auto }` und `overflow-wrap` für h2/h3 im Prose-Kontext — eigene Aufgabe, nicht Teil des TOC |
| F-2 | **Erste h2 hat 79,2 px Rand oben** (`.prose h2 { margin-top: 1.8em }`) | Textspalte beginnt 79 px unter dem Verzeichnis | Randspalte und Artikel starten auf unterschiedlicher Höhe | Auf Seiten mit TOC: `.page-body--toc .prose > :first-child { margin-top: 0 }` (im Entwurf umgesetzt, gemessen 448 = 448) |
| F-3 | **`max-width: 72ch` springt bei Schriftwechsel** | 648 px vor, 720 px nach `document.fonts.ready` | 72-px-Layoutsprung, CLS-Risiko, verfälschte Messungen | Messungen erst nach `document.fonts.ready`; für AK-H3 (CLS 0) Maß in px (720 px) oder `font-display: block` erwägen |
| F-4 | **Header ist 101 px, Token 100 px** | `min-height` + 1-px-Unterkante | Höhenbudget um 1 px überschritten | `max-height` mit `-1px` (im Entwurf), oder Token auf die Rahmenhöhe beziehen |
| F-5 | **`.page-body` ist 128 px schmaler als der Header-Container** | Textkante 97 px, Kopfzeile 64 px (1440) | Randspalte endet 32 px innerhalb der Kopfzeilenkante | Bestand belassen; wer die Rahmen vereinheitlicht, ändert alle Inhaltsseiten — eigene Entscheidung |
| F-6 | **Ruhender `.page-toc__summary`-Inhalt im geschlossenen `<details>`** | Chrome meldet `clientHeight 480` im zugeklappten Zustand | Kein Layout-Effekt (der Block bleibt 46 px hoch), aber Messungen dürfen sich nicht auf `body`-Höhen im geschlossenen Zustand stützen | Im Test immer `details.open` prüfen |
| F-7 | **Silbentrennung erzeugt viele Trennstriche** in 231 px Spalte | 235-Zeichen-Eintrag: 10 Zeilen, 195 px | Dichte Optik bei Extremfällen | Beibehalten; Alternative „ohne `hyphens`“ erzeugt Wortlücken durch `overflow-wrap` |

---

## 10. Abgleich mit den Abnahmekriterien (Designanteil)

| AK | Kriterium | Ergebnis |
|---|---|---|
| E1 | 1440: Sidebar 240–280, Prose 718–722, Abstand ≥ 32 | 260 / 720 / 252 — erfüllt |
| E2 | nach 1.500 px: Top = Header + 24 ± 2, nicht gestreckt | 124 (Header 101), Höhe 703 statt 22.250 — erfüllt |
| E3 | TOC-Höhe ≤ vh − Header − 96, eigener Scrollbereich | 703 = 703 bei 900; 883 = 883 bei 1080 — erfüllt |
| E4 | 390: Block oben, geschlossen, Summary ≥ 44 | Block bei y 557 vor Artikel 627, zu, 44 — erfüllt |
| E5 | 390: kein zusätzlicher Überlauf durch das TOC | TOC 315/315, Seite 540 = Baseline — erfüllt (R-1 offen) |
| E6 | 1200: genau ein Wechsel, keine Überlappung | 1200 sticky rechts / 1199 Block oben, `overlapHeader:false` — erfüllt |
| E7 | 320 px und 200 % Zoom bedienbar, kein Clipping durch das TOC | 245/245 bzw. 629/629 — erfüllt |
| E8 | Druck: TOC ausgeblendet | `display: none` — erfüllt |
| E9 | kein Overlay über dem Header | `z-index: 0`, `top: 124` — erfüllt |
| F3 | Tab, Enter/Space, Fokusring ≥ 2 px, ≥ 3:1 | Summary `tabIndex 0`, toggelt, Ring 2 px/9,33:1 — erfüllt |
| F4 | Kontrast Link/aktiv/Fokus 4,5 bzw. 3,0 in Dark und Light | Dark 9,09–15,36; Light-Reserve 6,50–15,45 — erfüllt (Light nicht ausgeliefert) |
| F5 | reduced motion ohne erzwungene Bewegung | `scroll-behavior: auto`, keine Transition — erfüllt |
| F6 | Summary ≥ 44, Links ≥ 24, bei coarse ≥ 44 | 44 / 32 / 44 — erfüllt |
| B7 | kein gekürzter zugänglicher Name | 29/29 Links ohne Überlauf (`scrollWidth = clientWidth`) — erfüllt |
| B6 | h3 Kinder des vorangehenden h2, valide `ol`-Struktur | 14 × `--2`, 15 × `--3`, 3 verschachtelte `ol` — erfüllt |

Nicht bewertet (Aufgabe der Implementierung/QA): A1–A5, C1–C7, D1–D6 als Automatisierung,
G1–G4 im Produktionsbuild, H1–H6, I1–I3, Screenreader-Lauf (TF-22).

---

## 11. Übergabe

**Für die Umsetzung (`t_3c130426`):**

1. `mockup/toc.css` ist der Gestaltungsentwurf, nicht der Produktionscode. Übernahme in
   `src/styles/content.css` mit dem Klassenvertrag aus `02-komponenten-spezifikation.md`;
   Kommentare und Mockup-spezifische Teile (`annotate`, `data-overflow`-Masken) prüfen.
2. Markup exakt nach Spezifikation §6.4 plus `p.page-toc__title` (Desktop-Label).
3. Die drei Gestaltungsregeln, die nicht aus der Spezifikation folgen:
   erste Prosa-Überschrift ohne Top-Margin (F-2), `-1px` im Höhenbudget (F-4),
   Sandkante statt Rahmen für die Inline-Variante (G-6).
4. Reihenfolge der CSS-Regeln: Basis zuerst, Desktop-Overrides danach (Medienabfragen erhöhen
   keine Spezifität — im Entwurf real Fehler verursacht).
5. Messungen nur nach `document.fonts.ready` (F-3).

**Offene Gestaltungsentscheidungen (nicht blockierend):**

* O-G1: Bei > 1600 px könnte die Randspalte näher an den Text rücken (z. B. `justify-self: end`
  im 1fr-Track). Der Entwurf bleibt am Rahmen, weil die Symmetrie der Seitenkanten Vorrang hat.
* O-G2: `hyphens: auto` in der Randspalte — bei extremen Komposita dichter, aber vollständig.
* O-G3: Der Kurzfall (8 Einträge, 333 px hoch) zeigt keine Überlaufkante; das ist gewollt, der
  Verlauf erscheint nur bei echtem Überlauf.

**Nachweise:** `evidence/messung-breakpoints.json`, `evidence/kontrast.json`,
`mockup/budget.txt`, Screenshots in `evidence/`. Reproduktion: Static-Server über der
Repo-Wurzel starten, `mockup/build-mockup.py` erneut ausführen, Seiten mit `?bp=<breite>` laden.
