# Komponenten- und CSS-Spezifikation: `.page-toc`

**Status:** Entwurf zur Umsetzung · **Version:** 1.0 · **Stand:** 4. November 2026
**Bezug:** Gestaltung `01-design.md` (t_fd9d97f0), Verhalten `spezifikation.md` (t_5edc1d8c)
**Nicht produktiv.** Referenzimplementierung des Entwurfs: `mockup/toc.css`, `mockup/toc.js`.

---

## 1. Markup

```html
<div class="page-body page-body--toc">
  <aside class="page-toc" data-toc aria-labelledby="page-toc-title">
    <details class="page-toc__details" data-toc-details open>
      <summary class="page-toc__summary" id="page-toc-title">Auf dieser Seite</summary>

      <nav class="page-toc__nav" aria-label="Inhaltsverzeichnis">
        <!-- rein visuell: auf dem Desktop ist das Summary ausgeblendet -->
        <p class="page-toc__title" aria-hidden="true">Auf dieser Seite</p>

        <div class="page-toc__body" data-toc-body>
          <ol class="page-toc__list">
            <li class="page-toc__item page-toc__item--2">
              <a class="page-toc__link" href="#1-zweck-und-geltungsbereich">1. Zweck und Geltungsbereich</a>
            </li>
            <li class="page-toc__item page-toc__item--2">
              <a class="page-toc__link" href="#5-claim-quelle-matrix">5. Claim-Quelle-Matrix</a>
              <ol class="page-toc__list">
                <li class="page-toc__item page-toc__item--3">
                  <a class="page-toc__link" href="#51-physikalisch--physiologisch">5.1 Physikalisch / physiologisch</a>
                </li>
              </ol>
            </li>
          </ol>
        </div>
      </nav>
    </details>
  </aside>

  <article class="prose" data-toc-scope> … </article>
</div>
```

**Regeln**

* Genau ein `nav[aria-label="Inhaltsverzeichnis"]` je Seite, genau ein `aside.page-toc`
  (Spezifikation AK-A1/AK-F1).
* Das `aside` steht im DOM **vor** dem Artikel (Lesereihenfolge = visuelle Reihenfolge auf
  schmalen Viewports).
* `details` wird serverseitig mit `open` gerendert; nur JavaScript schließt es unter 1200 px (D-9).
* `p.page-toc__title` ist der einzige Zusatz gegenüber §6.4 der Spezifikation (Begründung G-7 in
  `01-design.md`): Auf dem Desktop ist das Summary `display:none`, das `nav` braucht trotzdem eine
  sichtbare Überschrift. `aria-hidden="true"`, weil das Landmark bereits benannt ist.
* Kein `role`, kein zusätzliches `aria-label` am `details`, keine Nummerierung im Linktext,
  keine Kürzung im DOM.

---

## 2. Props (aus der Spezifikation, unverändert)

| Prop | Typ | Default | Wirkung auf die Gestaltung |
|---|---|---|---|
| `headings` | `{depth, slug, text}[]` | — | Quelle der Liste; ohne Wert rendert die Komponente nichts |
| `title` | `string` | `'Auf dieser Seite'` | Text von Summary **und** `.page-toc__title` (beide aus einer Quelle, damit sie nie auseinanderlaufen) |
| `levels` | `number[]` | `[2, 3]` | steuert Einrückung: `depth - min(levels)` bestimmt `page-toc__item--<depth>` |
| `minHeadings` | `number` | `3` | unter Schwelle kein Markup (kein leerer Container) |
| `stickyOffset` | `string` | `calc(var(--header-height) + var(--space-6))` | überschreibt `--toc-sticky-offset` der Komponente |
| `dynamic` | `boolean` | `false` | im Piloten aus; keine Auswirkung auf CSS |

**Design-Variablen** (auf `.page-body--toc`, überschreibbar):

| Variable | Wert | Bedeutung |
|---|---|---|
| `--toc-rail-width` | `260px` | Breite der Randspalte (Spezifikation: 240–280) |
| `--toc-sticky-offset` | `calc(var(--header-height) + var(--space-6))` | `top` der Rail |
| `--toc-item-min` | `32px` (`44px` bei `pointer: coarse`) | Mindesthöhe eines Eintrags |
| `--toc-inset` | `var(--space-3)` = 12 px | Textkante + Raum für die 2-px-Marke |
| `--toc-title-block` | `34px` | Höhe des Rail-Labels inkl. Abstand (für das Höhenbudget) |

---

## 3. CSS-Vertrag

### 3.1 Raster

```css
.page-body--toc {
  --toc-rail-width: 260px; --toc-item-min: 32px;
  --toc-inset: var(--space-3); --toc-title-block: 34px;
  display: grid; grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6); align-items: start;
}
@media (min-width: 1200px) {
  .page-body--toc { grid-template-columns: minmax(0, 1fr) var(--toc-rail-width); gap: var(--space-16); }
  .page-body--toc > .page-toc { grid-column: 2; grid-row: 1; }
  .page-body--toc > .prose   { grid-column: 1; grid-row: 1; min-width: 0; }
}
/* erste Überschrift ohne Top-Margin (Befund F-2) */
.page-body--toc .prose > :first-child { margin-top: 0; }
```

Die explizite Spaltenzuweisung ist Pflicht: Das `aside` ist das erste Kind und würde sonst links
landen. Die DOM-Reihenfolge darf dafür **nicht** geändert werden.

### 3.2 Klassen

| Klasse | Kernwerte | Anmerkung |
|---|---|---|
| `.page-toc` | Desktop: `position: sticky; top: var(--toc-sticky-offset); align-self: start; max-height: calc(100dvh - var(--header-height) - var(--space-24) - 1px); border-left: 1px solid var(--color-border); padding-left: var(--space-6); z-index: 0` | `align-self:start` behebt den Sticky-Fehler des Bestands (R-2); `-1px` für die Header-Unterkante (F-4); `z-index: 0` hält die Rail unter dem Header (`--z-sticky: 200`) |
| `.page-toc__details` | Mobil: `border-left: 2px solid var(--color-primary); background: var(--color-bg-card)`; Desktop: `border: 0; background: none` | Sandkante statt Rahmen (G-6) |
| `.page-toc__summary` | `display:flex; align-items:center; min-height:44px; padding: var(--space-2) var(--space-4); font: var(--text-xs) var(--font-mono); letter-spacing:.06em; text-transform:uppercase; color: var(--color-text-secondary); cursor:pointer; list-style:none` | `::-webkit-details-marker { display:none }`, `::marker { content:'' }`; Desktop `display:none` |
| `.page-toc__summary::after` | `content:'+'; margin-left:auto; font-size:16px; color:var(--color-primary)`; `[open] > …::after { content:'–' }` | reines Textzeichen, kein Icon-Asset |
| `.page-toc__title` | `display:none`; ab 1200 px `display:block; font: 13px var(--font-mono); uppercase; letter-spacing:.06em; color: var(--color-text-secondary); margin:0 0 var(--space-4)` | nur Desktop |
| `.page-toc__body` | Mobil `max-height:60dvh` (≤699 px: `56dvh`), `overflow-y:auto; overscroll-behavior:contain; padding: var(--space-1) var(--space-4) var(--space-4); scrollbar-width:thin`; Desktop `max-height: calc(100dvh - header - var(--space-24) - var(--toc-title-block)); padding: 0 var(--space-1) 0 0` | eigener Scrollbereich (E3) |
| `.page-toc__list` | `margin:0; padding:0; list-style:none; display:grid; gap:0` | verschachtelte `ol` erben; keine Trennlinien |
| `.page-toc__link` | `display:flex; align-items:center; min-height:var(--toc-item-min); padding:6px var(--space-1) 6px var(--toc-inset); border-left:2px solid transparent; font-size:var(--text-sm); line-height:1.45; color:var(--color-text-secondary); overflow-wrap:anywhere; hyphens:auto` | 2-px-Raum ist immer reserviert |
| `.page-toc__item--3 > .page-toc__link` | `padding-left: calc(var(--toc-inset) + var(--space-4))` | 16 px Einrückung, gleiche Größe |
| `.page-toc__link:hover` | `color: var(--color-primary)` | keine Unterstreichung |
| `.page-toc__link:focus-visible` | `outline:2px solid var(--color-text-primary); outline-offset:2px; margin-inline:-6px; padding-inline: calc(var(--toc-inset) + 6px) calc(var(--space-1) + 6px)` | Ring bleibt im Scrollbereich sichtbar, Textkante bleibt bündig |
| `.page-toc__link[aria-current='location'], .page-toc__link.is-active` | `color: var(--color-text-primary); font-weight: 500; border-left-color: var(--color-primary)` | Marke + Farbe + Gewicht (nicht nur Farbe) |
| `.page-toc__body[data-overflow='top'\|'bottom'\|'both']` | `mask-image`-Verlauf 16 px oben / 24 px unten | nur bei echtem Überlauf; ohne JS kein Verlauf |

### 3.3 Breakpoints

| Bereich | Verhalten |
|---|---|
| ≥ 1200 px | Randspalte rechts, sticky, dauerhaft offen, eigenes Scrollen, Label im `nav` |
| 700–1199 px | Block über dem Artikel, volle Breite, `<details>` mit JS geschlossen, `max-height: 60dvh` |
| ≤ 699 px | wie oben, `max-height: 56dvh`, kleinere Innenabstände |
| `pointer: coarse` | Einträge ≥ 44 px (unabhängig von der Breite) |
| `prefers-reduced-motion` | keine Transition, `scroll-behavior: auto` (globale Regel) |
| `print` | `.page-toc { display: none }` |

**Reihenfolge im Stylesheet:** Basisregeln zuerst, Desktop-Overrides am Ende. Medienabfragen
erhöhen keine Spezifität; im ersten Entwurf überschrieb die spätere Basisregel `display:flex` des
Summary die Desktop-Regel `display:none`, und `.page-toc__title` blieb 0 × 0.

---

## 4. JavaScript-Vertrag

| Aufgabe | Vorgabe | Referenz in `toc.js` |
|---|---|---|
| Ausgangszustand | < 1200 px: `details.open = false`, sofern die Nutzerin nicht selbst getoggelt hat; ≥ 1200 px: offen | `applyViewportState()` |
| Scroll-Spy | Linie = `--header-height` + 24 px; letzte Überschrift auf/über der Linie; am Ende der letzte Eintrag | `computeActive()` |
| Markierung | genau ein `aria-current="location"` **und** `.is-active`; Entfernen beim Wechsel | `setActive()` |
| Kurzschluss | keine DOM-Schreibvorgänge, wenn der aktive Eintrag gleich bleibt | `lastActive` |
| Liste mitführen | aktiven Eintrag per `scrollIntoView({block:'nearest', behavior:'auto'})` in die Fläche holen, wenn er außerhalb liegt | `setActive()` |
| Aktivierung | **kein** `preventDefault`, **kein** eigenes Smooth-Scrolling (Spezifikation §6.5 Nr. 9); auf < 1200 px das Panel **vor** der Standardaktion schließen; danach Fokus auf die Zielüberschrift mit `focus({preventScroll:true})` | Klick-Handler |
| Deep-Link | Eintrag sofort aktiv; Position nach `document.fonts.ready` einmal korrigieren, ohne Fokus zu stehlen | `hashchange`, `markHashTarget()` |
| Neuberechnung | `resize`, `document.fonts.ready`, `details`-Toggle, `ResizeObserver` auf `[data-toc-scope]` | `measure()` |
| Drosselung | `scroll` passiv; Arbeit in `requestAnimationFrame` **plus** 120-ms-Timer-Fallback (Hintergrund-Tabs setzen rAF aus) | `onScroll()` |
| Überlaufhinweis | `data-overflow` (`top`/`bottom`/`both`) aus `scrollTop`, `clientHeight`, `scrollHeight` | `updateOverflow()` |

**Nicht** selbst scrollen, **nicht** den Hash per `pushState` setzen, **nicht** die Liste neu
aufbauen (der Pilot ist serverseitig gerendert, `dynamic: false`).

---

## 5. Barrierefreiheit (Prüfliste)

| Prüfung | Vorgabe | Nachweis im Entwurf |
|---|---|---|
| Landmark | genau ein `nav[aria-label="Inhaltsverzeichnis"]`, Name aus `aria-label` | 1/1 gezählt |
| Liste | `ol > li > a`, keine ersetzenden Rollen | 29 Links, 3 verschachtelte `ol` |
| Aktiver Eintrag | `aria-current="location"`, genau einer, plus `.is-active` | in jeder Messung 1 |
| Tastatur | Summary per Tab, Enter/Space toggelt, Fokus bleibt, alle Links erreichbar | `tabIndex 0`, Enter/Space geprüft |
| Fokusring | ≥ 2 px, ≥ 3:1 | 2 px, 9,33:1 (Sand) bzw. 15,36:1 (Desktop-Ring) |
| Kontrast Text | ≥ 4,5:1 (Dark und Light) | 9,09–15,36 (Dark), 6,50–15,45 (Light-Reserve) |
| Zielgrößen | Summary ≥ 44 px, Links ≥ 24 px, bei coarse ≥ 44 px | 44 / 32 / 44 |
| Reduced Motion | keine erzwungene Bewegung | `scroll-behavior:auto`, `transition:none` |
| Keine Kürzung | vollständiger Text im zugänglichen Namen | 29/29 `scrollWidth = clientWidth`, 235-Zeichen-Fall 10 Zeilen ohne Überlauf |
| Keine Doppelung | kein `aria-current="page"` im TOC | nur `location` |

---

## 6. Umsetzungsfallen (im Entwurf real aufgetreten)

1. **Medienabfrage-Reihenfolge** — siehe §3.3. Immer Basis → Overrides.
2. **`display: contents` auf `<details>`** ist in Chromium nicht verlässlich; nicht verwenden.
   Stattdessen Desktop: Summary `display:none`, `details` bleibt `open`.
3. **`max-height` auf `.page-toc` *und* `.page-toc__body`**: das Budget gilt für die Gesamthöhe
   (Label + Liste). Nur `body` begrenzen reicht nicht; nur `aside` begrenzen lässt die Liste das
   Label überschieben.
4. **`72ch` misst die Ersatzschrift**, solange Manrope nicht geladen ist: 648 px vor, 720 px nach
   `document.fonts.ready`. Messungen erst nach `fonts.ready`; für CLS das Maß in px festlegen.
5. **Header ist 101 px** (100 + 1-px-Unterkante). Höhenbudget mit `-1px` rechnen, sonst
   überschreitet AK-E3 das Budget um genau 1 px.
6. **Panel schließen vor dem Ankersprung**: geschieht das nach der Standardaktion, verschiebt sich
   das Ziel um die Panelhöhe. Reihenfolge im Handler: `details.open = false` → Standardaktion.
7. **Fokus mit `preventScroll`** setzen, sonst bricht der Fokus den Ankersprung.
8. **`scrollIntoView` in der Liste** darf nur bei echtem Überlauf laufen und muss `behavior:'auto'`
   nutzen, sonst entsteht eine zweite Scrollanimation.
9. **rAF in Hintergrund-Tabs** wird gedrosselt/ausgesetzt; der Timer-Fallback hält den Scroll-Spy
   auch in Tests und beim Zurückkehren in den Tab aktuell.
10. **`scroll-padding-top` nicht doppelt anwenden**: keine `scroll-margin-top` auf Überschriften
    ergänzen, die globale Regel deckt den Header bereits ab (gemessen 100 px bei 390, 116 px bei
    1440).

---

## 7. Budget und Prüfbefehle

| Posten | Gemessen | Budget | Status |
|---|---|---|---|
| CSS (minifiziert, gzip) | 1.233 B | 1,5 KB | eingehalten |
| JS (minifiziert, gzip) | 1.685 B | 5 KB | eingehalten |
| Neue externe Requests | 0 | 0 | eingehalten |

```bash
# Mockup neu bauen (nach Änderungen an den Quellseiten)
python docs/velarkana-toc/mockup/build-mockup.py

# Kontrast und Budget neu messen
python docs/velarkana-toc/mockup/contrast.py
python docs/velarkana-toc/mockup/budget.py

# Mockup ansehen (Static-Server über der Repo-Wurzel)
python -m http.server 8791 --bind 127.0.0.1
# → http://127.0.0.1:8791/docs/velarkana-toc/mockup/quellen.html
# → …/quellen.html?annotate=1   (annotiert)
# → …/blau.html, …/stress.html
```

Die Messwerte des Entwurfs stehen in `evidence/messung-breakpoints.json` und
`evidence/kontrast.json`; die Screenshots in `evidence/`.
