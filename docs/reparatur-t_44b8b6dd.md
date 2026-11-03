# Reparatur t_44b8b6dd — Restmängel M6/M7, N5/N6

Lokaler, unveröffentlichter Stand in `C:/Users/mas/Arbeit/Esoterik-Welt` (Remote `ingbms/Esoterik-Welt`).
Kein Commit, kein Push, kein Deploy. Keine Produktdatei außerhalb der vier Mängelbereiche geändert.

- Basis: lokaler Stand nach `t_ddfe7b03`, HEAD `24d8053ebc1bc4438a35a1c52b5d6f8c1718594e`
- Ausgangsmanifest (5027 Dateien, SHA-256, vor jeder Änderung dieser Karte):
  `evidence/t_44b8b6dd/baseline-manifest.json`
- Auftrag: Behebung von M6 (Major), M7 (Major), N5 (Minor), N6 (Minor) aus dem unabhängigen
  Review `t_befcdea7`. M1–M5 gelten dort als bestanden und durften nicht zurückgesetzt werden.

---

## 1. Ausgangsbefund (unabhängig gemessen, nicht übernommen)

Alle vier Mängel wurden vor der Korrektur mit eigenen Messungen und echter Bildsicht am
unveränderten Stand reproduziert. Der unbearbeitete Quellstand liegt als Snapshot unter
`evidence/t_44b8b6dd/original/` (`css/main.css`, `js/main.js`, `js/modules/{crystals,blog,tarot}.js`,
`Lokal*.html`, `datenschutz.html`, `haftung.html`) und enthält nachweislich keine der Korrekturen
(kein `crystal-detail-layout`, kein `settleRouteScroll`, kein `hyphens`).

| Mangel | Reproduktion am Ausgangsstand | Beleg |
|---|---|---|
| M6 | `1fr 2fr` erzwungen + `min-height:240px` + quadratischem Bild → Bild 240 px breit in 84,33 px-Spalte; Rechtecküberlappung Bild/Info **131,671875 × 240 px** bei 375 | `before/http-375-no-preference-crystal.png` |
| M7 | echter `file://`-Kaltstart auf `#blog`: `scrollY = 72`, Header `0..72`, Bereichstitel `top = 48` → **24 px verdeckt** | `before/file-{375,768,1440}-no-preference-cold-blog.png` |
| N5 | `HAFTUNGSAUSSCHLU` / **`SS`**; `DATENSCHUTZERKLÄ` / `RUNG`; `DIE` / `HOHEPRIESTERI` / **`N`** | `before/http-375-no-preference-{haftung,datenschutz,tarot}.png` |
| N6 | `## Die Struktur des Tarot`, `- **22 Major Arcana** …` als Rohtext; Artikeltitel doppelt (Dialogkopf + `h2` im Body) | `before/http-375-no-preference-article.png` |

Wichtige Nebenbeobachtung: M7 ist ein **reiner `file://`-Defekt**. Über HTTP lag der Kaltstart
bereits bei `scrollY = 0` / Titel `y = 120`; die HTTP-Bilder zeigen den Fehler daher korrekt *nicht*.
Die N5-Titelumbrüche treten in beiden Modi auf, aber mit unterschiedlicher Fontmetrik (HTTP nutzt
Cinzel, die Offline-Edition System-Fallbacks), weshalb für N5 ein eigener Vorher-Lauf nötig war.

Gegenprobe zur Baseline: Die unabhängige Originalaufnahme des Reviews
`evidence/t_befcdea7/recovery-20261101/http/crystals-modal-375.png` zeigt denselben Zustand
(Bildpanel x ≈ 51–277, Infospalte ab x ≈ 146, Überdeckung ≈ 131 px) wie mein Vorher-Bild
`before/http-375-no-preference-crystal.png`. Der hier verwendete Vorher-Zustand ist also der
tatsächlich reviewte Stand, keine Rekonstruktion.

---

## 2. Ursachenanalyse

### M6 — Kristalldetail: Grid und Bild entkoppelt
Der Dialog setzte sein Layout als Inline-Style `grid-template-columns:1fr 2fr` **und** gab dem
Bildcontainer `aspect-ratio:1` plus `min-height:240px`. Bei 375 px bleibt für die Bildspalte nach
Abzug von Dialogrand und `gap` nur 84,33 px; `min-height:240px` und die intrinsische Bildbreite
zwingen den Container dennoch auf 240 px, sodass er in die zweite Spalte hineinragt. Weil das
Erzeugen keines horizontalen `scrollWidth`-Overflows resultiert, waren die alten grünen
Overflow-Tests kein Widerspruch — sie prüften die falsche Größe (Dokumentbreite statt
Rechtecküberschneidung zweier Geschwister).

### M7 — Fragment-Scroll des Browsers überschreibt die SPA-Route
Der Browser führt seinen nativen Fragment-Scroll **nach** `DOMContentLoaded` und **vor** `load` aus.
Bei der Offline-Edition (ein einziges IIFE-Bundle) ist die App zu diesem Zeitpunkt schon
initialisiert: `navigateTo()` lief noch im Modul-Scope, der native Fragment-Sprung setzte danach
`scrollY = header-height` (72). Über HTTP wird das Modul erst nach dem nativen Scroll ausgewertet,
deshalb trat der Fehler dort nicht auf. Eine bloße Umstellung auf `behavior:'instant'` behebt ihn
nicht — belegt durch `scroll-probe.json`: identischer Ablauf mit `instant` endet ebenfalls bei
`scrollY = 72`. Die Ursache ist die **Reihenfolge**, nicht die Animation.

### N5 — harte Worttrennung ohne Trennregeln
`.legal-content h1` und `.tarot-name` hatten weder `hyphens` noch eine sinnvolle
`overflow-wrap`-Strategie; bei fehlendem Trennpunkt bricht der Browser dann beliebig — bis zum
isolierten Buchstaben.

### N6 — Markdown als Rohtext
`openArticleModal()` setzte den Artikel per `innerHTML` mit `${content.replace(/\n/g,'<br>')}`
ein und rendert damit `##`/`**` wörtlich; zusätzlich stand der Titel sowohl im Dialogkopf als auch
als `h2` im Body.

---

## 3. Korrektur (minimal, vier Stellen)

### M6 — `js/modules/crystals.js` + `css/main.css`
Inline-Grid durch die Klasse `.crystal-detail-layout` ersetzt, Bild in `.crystal-detail-image`.
Das Layout entscheidet jetzt über eine **Container Query auf den Dialogbody** statt über die
Viewportbreite:

```css
#crystalModalBody { container-type: inline-size; }
.crystal-detail-layout { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--space-6); align-items:start; }
.crystal-detail-layout > * { min-width: 0; }
.crystal-detail-image { width:100%; aspect-ratio:1; … }
.crystal-detail-image img { display:block; width:100%; height:100%; min-width:0; object-fit:cover; }
@container (min-width: 36rem) { .crystal-detail-layout { grid-template-columns: minmax(0,1fr) minmax(0,2fr); } }
```
`min-height:240px` ist entfallen; das Bild ist an die Breite seiner eigenen Spalte gebunden
(`width:100%`, `min-width:0`) und wird nicht überdeckt oder abgeschnitten. Zweispaltig wird es
ausschließlich, wenn der Dialogbody real ≥ 576 px (36 rem) misst.

### M7 — `js/main.js`
```js
if (document.readyState !== 'complete')
  await new Promise(r => window.addEventListener('load', r, { once: true }));
const initialPage = location.hash.replace('#','') || 'home';
if (initialPage && initialPage !== 'home') { navigateTo(initialPage, true, { instant:true }); settleRouteScroll(initialPage); }
```
`settleRouteScroll()` setzt die Position in einem `requestAnimationFrame` **nach** dem nativen
Fragment-Sprung, ohne Fokus zu verschieben, den Hash zu ändern oder eine spätere Route zu stören.
`navigateTo(pageId, replace, { fromHistory, instant })` behält seine bisherige Signatur; die neuen
Optionen sind rein additiv. Popstate/Hashchange teilen sich jetzt `restoreRoute()`, das
`fromHistory:true` setzt und damit **keinen** neuen History-Eintrag erzeugt. `scrollRestoration`
steht auf `manual`, Reduced Motion wird weiterhin auf `instant` abgebildet.

### N5 — `css/main.css` + `datenschutz.html`/`haftung.html`
```css
.legal-content h1 { font-size: clamp(var(--text-xl), 6vw, var(--text-4xl)); hyphens:auto; overflow-wrap:break-word; }
.tarot-name { hyphens:auto; overflow-wrap:break-word; }
@media (max-width:480px) { .tarot-name { font-size: var(--text-sm); } .tarot-overlay { padding: var(--space-3); } }
```
Zusätzlich je ein sprachlich korrekter weicher Trennpunkt `&shy;` an der einzig sinnvollen Stelle:
`Datenschutz&shy;erklärung`, `Haftungs&shy;ausschluss`. `hyphens:auto` greift, weil alle Seiten
`<html lang="de">` tragen; System-Fallbacks ohne Trennwörterbuch fallen auf den `&shy;`-Punkt
zurück. Keine Token-, Marken- oder Textänderung, kein Abschneiden.

### N6 — `js/modules/blog.js` + neu `js/article-content.js`
`openArticleModal()` baut den Inhalt nur noch über DOM-Knoten (`createElement`,
`textContent`, `replaceChildren`). Der Renderer unterstützt eine bewusst kleine Teilmenge
(`##`/`###`-Überschriften, Absätze, `-`/`1.`-Listen, `**fett**`, `*kursiv*`, `` `code` ``) und
erzeugt ausschließlich `h3/h4/p/ul/ol/li/strong/em/code` mit Textknoten — **kein** `innerHTML`
aus Artikeltext, keine Links, Bilder, Attribute oder Roh-HTML. Der Titel steht nur noch im
Dialogkopf (`articleModalTitle`, weiterhin `aria-labelledby` des Dialogs).

---

## 4. Verifikation (eigene Läufe, nach vollständigem Neubau)

Build ausschließlich über den bestehenden Weg: `npm run build` → `scripts/build-pages.cjs` →
`scripts/build-local.cjs` (erzeugt `Lokal*.html` und `dist/Esoterik-Welt/`).

| Prüfung | Umfang | Ergebnis |
|---|---|---|
| `restmaengel.cjs reverify-final` (M6/M7/N5/N6, normal motion) | 97 Checks, HTTP **und** `file://`, 375/768/1440 | **97 / 0 Fehler** |
| `restmaengel.cjs reverify-reduce` (`prefers-reduced-motion: reduce`) | 61 Checks | **61 / 0 Fehler** |
| `regression-verify.cjs` HTTP + `file`, je 375/768/1440 | 328 Checks (M1–M5, Dark/Light, Dialoge, Navigation, Axe) | **328 / 0 Fehler**, 0 Konsole-/Seiten-/Request-Fehler |
| `node --test tests/local-entry.cjs tests/pages-regression.cjs` | 14 Tests | **12 pass, 0 fail**, 2 vorbestehend übersprungen |

### M6 — geometrische Nichtüberlappung (ausdrücklich assertiert)
Rechtecküberschneidung Bild/Info, in allen 12 Kontexten (HTTP+Datei × 3 Breiten):

| Kontext | Bild | Info-x | Spalten | Überlappung |
|---|---|---|---|---|
| 375 | 49,00..326,00 (277 breit) | 49,00 | `277px` | `{x:277, y:0}` → **0 px²** |
| 768 | 109,00..659,00 (550 breit) | 109,00 | `550px` | `{x:550, y:0}` → **0 px²** |
| 1440 | 445,00..995,00 (550 breit) | 445,00 | `550px` | `{x:550, y:0}` → **0 px²** |

Bild und Info liegen in allen Fällen in derselben Spalte bei identischem linkem Rand; die
Überlappungsfläche ist exakt 0 (vorher 31 601 px² bei 375). Zusätzlich `M6-image-fits-track`:
das Bild bleibt innerhalb seines Containers. Der Dialogbody misst auch bei 1440 nur 550 px, also
unter der 576-px-Schwelle — das Layout bleibt dort bewusst einspaltig.

### M7 — Kaltstart-Tiefenlink
Alle 18 Kombinationen (HTTP/Datei × 375/768/1440 × `#blog`/`#crystals`/`#runes`), gemessen nach
1800 ms: `scrollY = 0`, Header `bottom = 72`, Bereichstitel `top = 120` → **48 px Abstand**,
Titel vollständig sichtbar. Zusätzlich grün: `M7-back`, `M7-forward`,
`M7-history-not-appended` (kein doppelter History-Eintrag), `M7-native-hash` (nachträgliches
Setzen von `location.hash` aktiviert die Route und hält den Titel unter dem Header).

### N5 — lange Titel
| Ort | vorher | nachher |
|---|---|---|
| Haftung 375 HTTP | `HAFTUNGSAUSSCHLU` / `SS` | `Haftungsausschluss` (eine Zeile) |
| Datenschutz 375 HTTP | `DATENSCHUTZERKLÄ` / `RUNG` | `DATENSCHUTZ-` / `ERKLÄRUNG` |
| Datenschutz 375 Datei | `Datenschutzerklärun` / `G` | `Datenschutzerklärung` (eine Zeile) |
| Tarot 375 HTTP | `DIE` / `HOHEPRIESTERI` / `N` | `Die Hohepriesterin` (eine Zeile) |

`scrollWidth == clientWidth` in allen Messungen (kein Abschneiden).

### N6 — Markdown
0 sichtbare `##`/`###`/`**`, Titel genau einmal, `aria-labelledby` unverändert
`articleModalTitle`, Absätze/Listen/`strong` als echte Elemente. Zusätzlich ein
Injektionstest über den echten Dialogpfad: `<img onerror>`, `<svg onload>`, `<iframe>`,
`<script>`, `[bad](javascript:…)` in Titel, Kategorie, Tags und Content erzeugen **0**
`script/img/svg/iframe/a/[onerror]/[onload]`-Knoten und **0** ausgeführte Handler.

### Regressionen M1–M5, Kontrast, Tastatur
- `document-reflow` 120/120, `M1` 48/48, `M2` 24/24, `M3` 12/12, `M4` 12/12, `M5` 24/24,
  `navigation` 36/36, `N4` 6/6, `axe-selected` 40/40 (WCAG 2A/2AA/2.1AA, 375 px), `runtime` 6/6.
- Kontrast (Canvas/sRGB, alpha-komponiert über tatsächliche Vorfahren, 30 Karten je Lauf):
  **Dark min 8,526 : 1**, **Light min 5,754 : 1** — identisch zum Parentreview, keine Regression.
- `M5` deckt Enter → Dialog, Tab, Shift+Tab, Fokus im Dialog, `inert` auf Header/Main/Footer,
  Escape → Dialog zu, Hintergrund wieder bedienbar, Fokus zurück auf den Auslöser.

### Bildsicht (vision_analyze, echte PNGs)
22 erfolgreiche Aufrufe auf Originaldateien, u. a. `before/…crystal-375` (Überlappung) vs.
`reverify-final/…crystal-375` (sauber gestapelt), `before/file-375|768-cold-blog` (Titel unter
Header) vs. `reverify-final/…` (48 px Abstand), `before/http-375-haftung` (`SS`) vs. nachher,
`before/…article-375` (Rohtext + doppelter Titel) vs. nachher (semantisch, Titel einmal).

---

## 5. Was hier ausdrücklich **nicht** gemacht wurde

- Kein Commit, kein Push, kein Deploy, keine Veröffentlichung; Produktion bleibt auf
  `24d8053` (alter, separat verifizierter Stand).
- Keine Nachtatelier-/Tarot-Stil-Migration, keine Token-/Markenänderung, keine Bilderzeugung
  (N3 Emoji/Illustrationen bleiben offen).
- Keine Umsetzung der Konsolidierungsthemen aus `t_b5861420` (`#blog/1–10`-Deep-Links,
  Skip-Link, Sitemap-Origin, Footeranker, „Mehr laden“, OG) und kein Eingriff in deren Hotspots.
- Kein Clipping-„Fix“ am Artikeldialog: Das Ende war bereits per Dialogscroll erreichbar. Die
  vermutete Kollision des Close-Buttons ist **nicht** bestätigt und wurde nicht als Fehler behandelt.

## 6. Grenzen dieser Prüfung

- Nur Chromium (156.0.8078.4) unter Windows; kein Safari/Firefox, kein Realgerät, kein
  Zoom-/Print-/Performance-Lauf.
- Keine historische, freigegebene Sollbaseline vorhanden — Vorher-Zustand ist der gemessene
  Ist-Stand nach `t_ddfe7b03`.
- Die Bildsicht stützt sich auf ausgewählte Originalaufnahmen (16 Aufrufe) plus
  Kontaktbelege, nicht auf alle 49 Einzelbilder je Lauf.
- Dieser Bericht ist eine Implementierungs- und Selbstprüfungsetappe, **keine** Produkt- oder
  Releasefreigabe. Diese erteilt erst die unabhängige Gesamt-QA `t_676d2563`.
