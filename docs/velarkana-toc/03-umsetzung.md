# Umsetzung: Automatisches Seiten-Inhaltsverzeichnis (Pilot)

**Status:** umgesetzt und geprüft · **Stand:** 4. November 2026
**Aufgabe:** Kanban `t_3c130426` (Teil von `t_296b0496`, Pilot „Automatisches Seiten-Inhaltsverzeichnis“)
**Grundlagen:** `spezifikation.md` (Verhalten, Anker, Abnahmekriterien; `t_5edc1d8c`) und
`01-design.md` / `02-komponenten-spezifikation.md` (Gestaltung; `t_fd9d97f0`)
**Arbeitsbasis:** Branch `astro-migration`, Commit `9d14d37` (Astro 7.4.5), Aufgabenbranch `wt/t_3c130426`
**Pilot:** ausschließlich `/frequenzen/quellen.html` — 29 Einträge, alle IDs vorhanden

---

## 1. Was umgesetzt ist

Das Verzeichnis wird **serverseitig** aus den gerenderten Überschriften der Seite gebaut
(`headings` aus `render(entry)`), als `<aside class="page-toc">` mit nativem `<details>` ausgegeben
und durch ein kleines, gebündeltes Skript um Scroll-Spy und Mobilverhalten ergänzt. Bestehende
Anker-IDs bleiben unverändert; fehlende IDs entstehen deterministisch über `github-slugger` 2.0.0 —
dieselbe Regel, mit der Astro Markdown-Überschriften verankert.

| Bereich | Ergebnis |
|---|---|
| Liste | 29 Einträge, Reihenfolge und Texte exakt nach Spezifikation §14.1; 14 h2 mit 15 untergeordneten h3 (drei verschachtelte `ol`) |
| Anker | 29/29 lösen im Dokument auf; ID-Liste vor/nach der Änderung identisch (Baseline `9d14d37`) |
| Desktop ≥ 1200 px | Randspalte rechts, 260 px, 64 px Abstand, `position: sticky` mit `align-self: start`, eigener Scrollbereich, Höhe im Budget |
| Mobil < 1200 px | Block über dem Artikel, mit JavaScript geschlossen, Summary 44 px, Sandkante, Liste max. 56–60 dvh mit eigenem Scrollen |
| Scroll-Spy | genau ein `aria-current="location"`, letzte Überschrift auf/oberhalb der Linie (Header + 24 px), Dokumentende → letzter Eintrag, Deep-Link sofort aktiv |
| No-JS | alle 29 Links im HTML, `<details>` offen und nativ bedienbar, kein `aria-current` |
| Leerzustand | ohne `headings`, unter `minHeadings` oder bei `TOC_DISABLED=1` entsteht **kein** Markup |
| Abgrenzung | keine Änderung an `BaseLayout`, `SiteHeader`, `SiteFooter`, an bestehenden TOCs oder an anderen Seiten |

## 2. Dateien

**Neu**

| Datei | Inhalt |
|---|---|
| `src/lib/toc.ts` | Typen, Defaults, `TOC_ENABLED`, reine Logik: Textnormalisierung, Slug-Erzeugung (`TocSlugger`), Filterung, Verschachtelung, Markup-Erzeugung |
| `src/components/TableOfContents.astro` | Props, Leerzustand, SSR-Markup, `data-*`-Haken, gebündeltes Skript |
| `src/scripts/toc.ts` | Scroll-Spy, Mobilzustand, Überlaufhinweis, Aktivierung; ID-Härtung **nur** bei `dynamic` |
| `tests/toc-unit.mjs` | 21 Unit-Tests (Slug-Vektoren, Ebenen, Verschachtelung, Leerzustand, Escaping, Schalter) |
| `scripts/toc/verify-toc.cjs` | Build-Prüfung der gebauten Ausgabe (18 Kriterien; `--expect-disabled` für den Notaus) |
| `scripts/toc/verify-browser.mjs` | Browser-Prüfung mit Chromium (32 Kriterien, Screenshots, Messwerte) |
| `scripts/toc/heading-inventory.cjs` | Überschriften-Inventar je Seite (aus `t_5edc1d8c` übernommen) |
| `docs/velarkana-toc/03-umsetzung.md` | dieses Dokument |
| `evidence/velarkana-toc/` | Prüfberichte, Lighthouse-Vergleich, Baseline der Pilotseite, Screenshots |

**Geändert**

| Datei | Änderung |
|---|---|
| `src/pages/frequenzen/quellen.astro` | `headings` aus `render(entry)` übergeben, Raster-Wrapper `page-body--toc`, `data-toc-scope` am Artikel |
| `src/styles/content.css` | Abschnitt `.page-body--toc` / `.page-toc*` (nur Tokens, +699 B gzip im bestehenden Bundle) |
| `package.json` / `package-lock.json` | `github-slugger` **2.0.0** als direkte Abhängigkeit; Skripte `test:toc`, `verify:toc`, `verify:toc:browser` |
| `eslint.config.cjs` | Node- und Browser-Globals nur für `scripts/toc/verify-browser.mjs` (führt Code in `page.evaluate()`-Callbacks aus) |

Nicht geändert: `BaseLayout.astro`, `SiteHeader.astro`, `SiteFooter.astro`, die Radiästhesie-Fragmente,
`css/farbwelten.css`, alle anderen Seiten.

## 3. Architektur

```
Markdown  ──render(entry)──►  headings[]  ──buildTocTree()──►  TocTree  ──renderTocList()──►  <ol>…</ol> (SSR)
             (astro:content)      depth/slug/text      Filter, Ebenen,         escaped HTML
                                                        Slug, Verschachtelung
Browser:  <script type="module">  ──  Scroll-Spy, Mobilzustand, Überlaufhinweis
                                    └─ nur bei data-toc-dynamic="true": dynamischer Import
                                       von src/lib/toc.ts (Slug-Bibliothek) + Neuaufbau
```

* **Eine Quelle für beide Pfade.** Server-Rendering und der (nicht im Piloten genutzte)
  `dynamic`-Modus verwenden dieselben Funktionen — dadurch stimmen Link und Ziel-ID immer überein.
* **Markup-Erzeugung an genau einer Stelle.** `renderTocList()` escaped Text und Attribut; die
  Komponente gibt das Ergebnis über `set:html` aus. Es gibt keine zweite Stelle, die Text in Markup setzt.
* **Slug-Bibliothek nicht im Piloten-Bundle.** Sie wird ausschließlich im `dynamic`-Zweig dynamisch
  importiert (eigener Chunk, im Browser-Test als „nicht geladen“ geprüft).
* **`level` statt h-Ebene für die Einrückung.** `level` ist die strukturelle Tiefe (2 = oberste Liste).
  Wird eine Ebene übersprungen (`levels={[2, 4]}`), entsteht deshalb genau **eine** sichtbare
  Einrückungsstufe statt zweier (§6.2 Nr. 3).

## 4. Aktivierung auf weiteren Seiten

```astro
---
import { getEntry, render } from 'astro:content';
import TableOfContents from '../../components/TableOfContents.astro';

const entry = await getEntry('dokumente', 'mein-dokument');
const { Content, headings } = await render(entry);
---
<BaseLayout title="…">
  <div class="page-body page-body--toc">
    <TableOfContents headings={headings} />
    <article class="prose" data-toc-scope>
      <Content />
    </article>
  </div>
</BaseLayout>
```

Konfiguration je Seite (alle Props optional):

| Prop | Default | Wirkung |
|---|---|---|
| `headings` | — | Quelle der Liste; ohne Wert rendert die Komponente nichts |
| `title` | `'Auf dieser Seite'` | sichtbarer Titel (Summary **und** Rail-Label) |
| `levels` | `[2, 3]` | einzubeziehende h-Ebenen (2–6) |
| `minHeadings` | `3` | darunter kein Markup |
| `stickyOffset` | `calc(var(--header-height) + var(--space-6))` | `top` der klebenden Randspalte |
| `dynamic` | `false` | Liste clientseitig aus `[data-toc-scope]` aufbauen und fehlende IDs erzeugen (§6.11) |

**Notaus ohne Codeänderung:** `TOC_DISABLED=1 npm run build` — der Build enthält dann auf der
Pilotseite kein TOC (`evidence/velarkana-toc/build-check-disabled.json`).

**Vor der Aktivierung prüfen** (Spezifikation §12): Überschriften serverseitig? →
`node scripts/toc/heading-inventory.cjs dist --page <seite>`; kein bereits vorhandenes TOC auf der
Seite; Kandidatenzahl ≥ 3; bei vielen h3 `levels={[2]}` erwägen.

## 5. Verhalten im Detail

* **Scroll-Spy** (§6.5): Aktiv ist die letzte Überschrift, deren Oberkante auf oder oberhalb von
  `--header-height + 24 px` liegt; am Dokumentende der letzte Eintrag; Deep-Link sofort aktiv, bis
  eine echte Scrollbewegung einsetzt. Neuberechnung nach `resize` (passiv), `document.fonts.ready`,
  `details`-Toggle und per `ResizeObserver` auf `[data-toc-scope]`. Scrollarbeit in
  `requestAnimationFrame` mit 120-ms-Timer-Fallback; DOM wird nur bei geändertem Aktivposten geschrieben.
* **Aktivierung** (§6.5 Nr. 9): kein `preventDefault`, kein eigenes Smooth-Scrolling. Auf schmalen
  Viewports schließt der Klick das Panel **vor** der Standardaktion, damit der Ankersprung die
  endgültige Layoutlage trifft; danach erhält die Zielüberschrift den Fokus (`preventScroll`).
* **Mobil** (D-9): serverseitig `open`, JavaScript schließt unter 1200 px — ohne JavaScript bleibt
  die Liste offen und bedienbar. Ein vom Nutzer geöffnetes Panel bleibt offen.
* **Überlauf** (Design G-10): `data-overflow` (`top`/`bottom`/`both`) steuert den Verlaufshinweis am
  Rand des Scrollbereichs; ohne JavaScript gibt es keinen Verlauf.
* **Barrierefreiheit** (§6.8): ein `nav[aria-label="Inhaltsverzeichnis"]`, `ol > li > a`, vollständiger
  Linktext ohne Kürzung, `aria-current="location"` nur am aktiven Eintrag, Fokusring 2 px,
  Zielgrößen 44 px (Summary, Touch) bzw. 32 px, `prefers-reduced-motion` ohne erzwungene Bewegung.
* **Druck**: `.page-toc { display: none }`.

## 6. Prüfungen

```bash
npm run build                 # 144 Seiten, 145 HTML-Dateien
npm run check                 # astro check: 0 Fehler, 0 Warnungen (20 Hinweise wie Baseline)
npm run lint                  # eslint --max-warnings 0
npm run format:check          # prettier
npm run test:toc              # 21 Unit-Tests
npm run verify:toc            # 18 Build-Kriterien
npm run verify:toc:browser    # 32 Browser-Kriterien + Screenshots
TOC_DISABLED=1 npm run build && node scripts/toc/verify-toc.cjs dist --expect-disabled
```

Ergebnisse (4. November 2026, Branch `wt/t_3c130426`):

| Prüfung | Ergebnis | Beleg |
|---|---|---|
| Unit-Tests | **21/21** | `node --test tests/toc-unit.mjs` |
| Build wie spezifiziert | **18/18** | `evidence/velarkana-toc/build-check.json` |
| Build mit `TOC_DISABLED=1` | **6/6** | `evidence/velarkana-toc/build-check-disabled.json` |
| Browser (Chromium) | **32/32** | `evidence/velarkana-toc/browser-check.json` |
| `astro check` / `lint` / `format:check` | grün | Konsolenausgabe des Laufs |

Abgedeckte Browser-Kriterien (Auszug): Layout 1440 (Randspalte 260 px, Prose 720 px, Abstand ≥ 32 px),
Sticky-Oberkante `Header + 24 ± 2` nach 1.500 px Scroll, Höhe im Budget, Scroll-Spy abwärts/aufwärts/
Dokumentende, Klick- und Deep-Link-Ziel im Offsetfenster, prozentkodierter Hash, `hashchange`,
Fokusring, kein abgeschnittener Eintrag, Kontrast ≥ 4,5:1, keine externen Requests, keine
Konsolenfehler, Druck ausgeblendet, `prefers-reduced-motion`, Umschaltpunkt 1200/1199 px,
390 px (Position, geschlossen, Summary 44 px, Öffnen, Sprung), 320 px (kein Clipping), No-JS.
Screenshots: `1440-start.png`, `1440-sticky-aktiv.png`, `1200-rail.png`, `1024-offen.png`,
`390-zu.png`, `390-offen.png`, `390-nach-klick.png`, `390-nojs.png`.

### Budgets

| Posten | Messwert | Vorgabe | Status |
|---|---|---|---|
| Komponenten-Skript (gzip) | **2.094 B** | ≤ 5 KB | eingehalten |
| Dynamischer Chunk (nur `dynamic`) | 4.683 B gzip | nicht im Piloten geladen | geprüft (`AK-H2c`) |
| CSS-Ergänzung im bestehenden Bundle (gzip) | **+699 B** (27.362 → 28.061 B) | ≤ 1,5 KB | eingehalten |
| Neue externe Requests | 0 | 0 | eingehalten |
| Layoutsprung (CLS) | 0 | 0 | eingehalten |

### Lighthouse (lokal, headless Chromium, Standard-Throttling)

| Lauf | Accessibility | Performance | CLS |
|---|---|---|---|
| Baseline `9d14d37` ohne TOC | 0,91 | 0,62 | 0,002 |
| Pilot mit TOC | **0,92** | **0,62** | **0** |

Beide Läufe scheitern an denselben **vorbestehenden** Befunden im Artikel selbst:
`color-contrast` in `pre astro-code` (Syntaxhervorhebung) und `link-in-text-block` für
`article.prose > ol > li > a`. Kein Befund betrifft `.page-toc`; die Punktzahl steigt leicht, weil
ein zusätzliches Navigations-Landmark vorhanden ist. Einzelheiten:
`evidence/velarkana-toc/lighthouse-summary.json`.

## 7. Bekannte Abweichungen und offene Punkte

| Punkt | Status |
|---|---|
| **AK-H4 „Accessibility 1,0“** | nicht erreicht (0,92), Ursache sind zwei **vorbestehende** Kontrast-/Link-Befunde im Artikel (Baseline ebenfalls betroffen). Kein TOC-Befund. Behebung wäre eine Inhalts-/CSS-Änderung außerhalb dieses Auftrags. |
| **R-1 Seitenüberlauf bei 390/320 px** | vorbestehend (`scrollWidth` 540 durch Codeblöcke und eine lange h2), auch in der Baseline ohne TOC. AK-E5 ist im Sinne „kein **zusätzlicher** Überlauf durch das TOC“ erfüllt und so geprüft. |
| **`dynamic`-Modus** | implementiert und durch Unit-Tests abgedeckt (Slug-Erzeugung, Verschachtelung, Escaping), aber auf **keiner** Seite aktiv und nicht gegen eine echte Werkzeugseite erprobt — bewusst, weil die Werkzeugseiten im Piloten ausgeschlossen sind (D-2/O-3). |
| **Screenreader-Lauf (TF-22)** | nicht durchgeführt (manuelle Prüfung, Aufgabe der QA `t_436eeffb`). |
| **Playwright-MobilEmulation** | Die Prüfungen laufen im 390-/320-px-Viewport **ohne** `isMobile`: der vorbestehende Überlauf bläht im Emulationsmodus das Layout-Viewport auf 540 px auf und verschiebt das visuelle Viewport (gemessen `offsetTop` 325) — Anker und Höhen würden dann falsch gemessen. Das Mockup zeigt dasselbe Verhalten, der Befund liegt also nicht am TOC. |
| **Radiästhesie-TOC** | unangetastet (weiterhin 10 Links, kein `aria-current`); Vereinheitlichung ist O-5. |
| **Persistenz des Aufklappzustands** | bewusst nicht umgesetzt (O-7). |
| **Erster h2 wiederholt den Seitentitel** | unverändert aufgenommen (O-1). |

## 8. Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_3c130426
npm ci
npm run build
npm run test:toc && npm run verify:toc && npm run verify:toc:browser

# Baseline der Pilotseite neu erzeugen (Build 9d14d37, ohne TOC):
#   node scripts/toc/verify-toc.cjs dist --write-baseline=<pilotseite.html>

# Notaus prüfen
TOC_DISABLED=1 npm run build && node scripts/toc/verify-toc.cjs dist --expect-disabled
npm run build   # danach normal neu bauen
```

## 9. Nachtrag 4. November 2026: QA-Befunde D-1 und D-2 behoben

Die unabhängige Abnahme `t_436eeffb` (Commit `fd63e9d`, Bericht
`docs/qa-velarkana-toc/qa-bericht.md`) hat den Stand `ea13948` mit 51/55 erfüllten
Kriterien und einem blockierenden Befund bewertet. Beide TOC-Befunde sind in
Commit `25fe83b` dieses Branches behoben; die beiden übrigen Abweichungen sind
vorbestehend und unverändert.

### D-1 — Scroll-Sprung bei < 1200 px mit offenem Panel (behoben)

**Ursache:** `setActive()` rief `activeLink.scrollIntoView({block:'nearest'})` auf.
Unterhalb von 1200 px steht das Verzeichnis im normalen Fluss über dem Artikel;
sobald es aus dem Sichtfeld gescrollt war, scrollte `scrollIntoView` zusätzlich
das Fenster zurück zum Verzeichnis (390 px: 29.812 → 501 px) und `aria-current`
fiel auf den ersten Eintrag.

**Behebung:** `src/scripts/toc.ts` verschiebt bei Bedarf ausschließlich
`body.scrollTop` des inneren Verzeichnisbereichs. Die Bedingung bleibt dieselbe
(nur bei echtem Überlauf, ohne Animation); das Fenster wird nicht mehr bewegt.

### D-2 — Dekoratives +/- im zugänglichen Namen (behoben)

**Ursache:** Das Plus/Minus entstand über `summary::after { content: '+' }` und
wurde in die Namensberechnung des Disclosure-Knopfs einbezogen
(„AUF DIESER SEITE +“).

**Behebung:** Das Zeichen sitzt jetzt in
`<span class="page-toc__summary-marker" aria-hidden="true">`; die Regeln in
`src/styles/content.css` zeichnen `+`/`–` weiterhin per `::before`. Der
AX-Baum (Chromium-CDP) weist als Namen nur noch „AUF DIESER SEITE“ aus.

### Nachweise nach der Behebung

| Prüfung | Ergebnis | Beleg |
|---|---|---|
| Unit-Tests | 21/21 | `npm run test:toc` |
| Build-Prüfung | 18/18 | `evidence/velarkana-toc-fix/build-check.json` |
| Notaus `TOC_DISABLED=1` | 6/6 | `evidence/velarkana-toc-fix/build-check-disabled.json` |
| Browser-Prüfung (Chromium) | **36/36**, inkl. neuem `AK-D3c` für 390/1024/1199 px und `AK-H2d` (AX-Name) | `evidence/velarkana-toc-fix/browser-check.json` |
| QA-Szenario D-1 in drei Engines | **9/9** (Chromium 156, Firefox 157, WebKit 27.2; je 390/1024/1199 px, Sprung 0 px, genau ein `aria-current`) | `evidence/velarkana-toc-fix/scrollspy-engines.json` |
| Build-Determinismus | zwei Builds byte-identisch (Pilotseite und `_astro`) | `sha256`-Vergleich |
| `astro check` / `eslint` / `prettier` | 0 Fehler, 0 Warnungen / 0 Probleme / grün | Konsolenausgabe |
| Lighthouse (Pilot, mobil) | Accessibility 0,92, Performance 0,62, **CLS 0**; nur die zwei vorbestehenden Artikelbefunde | `evidence/velarkana-toc-fix/lighthouse-after.json` |

Neue Prüfskripte: `scripts/toc/verify-scrollspy-engines.mjs`
(`npm run verify:toc:engines`) und die erweiterten Fälle in
`scripts/toc/verify-browser.mjs`. Screenshots nach der Behebung:
`evidence/velarkana-toc-fix/1440-sticky-aktiv.png`,
`390-zu.png`, `390-offen.png`, `390-offen-tief-aktiv.png`.

### Verbleibende, nicht blockierende Abweichungen

| Punkt | Status |
|---|---|
| **D-3 CLS** | In-Page-CLS 0,0763 (Baseline 0,0632), Ursache Font-Swap; der Lighthouse-Lauf dieser Sitzung meldet CLS 0. Kein Sprung der Artikelspalte, mobil CLS 0. |
| **D-4 Lighthouse-A11y 0,91/0,92** | zwei vorbestehende Befunde im Artikel (`color-contrast`, `link-in-text-block`), identisch in der Baseline; kein TOC-Befund. |
| **Screenreader-Lauf (TF-22)** | weiterhin offen (manuelle Prüfung); AX-Baum und Namen sind geprüft. |
| **Safari/iOS** | nicht getestet; WebKit unter Windows ist ein Näherungswert. |

