# Nachtatelier auf der gesamten Website — Umsetzung und Handoff (t_280f3753)

Karte: `t_280f3753` · Assignee `coding_debug` · Modellroute `deepseek/deepseek-flash`
Stand: 01.11.2026 · Basis-Commit `1f2726c` (main, = `origin/main`) · Status: **lokal umgesetzt, geprüft, nicht committet/veröffentlicht**

Kein Deploy, kein Commit, kein Push: das darf nur eine explizite Releasekarte.
Dieses Dokument ist ein technischer Handoff an den unabhängigen Review
(`design_critique`), nicht die Abnahme.

## 1. Auftrag in einem Satz

Das menschlich genehmigte Stilpaket `docs/art-direction-nachtatelier/` auf Shell,
Startseite, Navigation, Karten/Buttons/Formulare, alle Modulansichten, Dialoge,
Rechteseiten und 404 anwenden — ohne Inhalte oder Funktionen zu ersetzen und
ohne neue Stilrunde.

## 2. Gelesene Grundlagen (tatsächlich geöffnet)

- `docs/art-direction-nachtatelier/STYLEGUIDE.md`, `DESIGN.md`, `tokens.json`,
  `styles.css`, `index.html`, `QUELLEN.md`, `docs/art-direction-nachtatelier/sources/orion-coordinates.json`
- `css/design-system.css`, `css/main.css`, `index.html`, `404.html`, `impressum.html`,
  `datenschutz.html`, `haftung.html` (Ausgangsstand)
- `js/main.js`, `js/modules/{tarot,crystals,runes,moon,blog}.js`, `data/*.json`
- `build-local.cjs`, `scripts/build-local.cjs`, `scripts/build-pages.cjs`,
  `scripts/verify-pages.cjs`, `tests/{local-entry,offline-file,pages-regression}.cjs`

## 3. Eingangsstand gesichert

`git status` vor Beginn (unverändert vorgefunden, nicht überschrieben):

```
 M docs/ci-cd-pipeline.md        (mtime 2026-10-31 03:36, fremd)
 M docs/design-tokens.md         (mtime 2026-11-01 19:27, fremd — inhaltlich erweitert, s. §8)
 M js/modules/_tarot_old.js      (mtime 2026-11-01 23:08, fremd; build-exkludiert via `_`-Präfix)
?? docs/… (16 Dokumentordner), evidence/, build-local.cjs, Lokal*.html-Quellen
```

Hashes der drei fremden Dateien stehen in `evidence/t_280f3753/manifest.json`
(`protectedForeignFiles`). `js/modules/_tarot_old.js` ist byte-identisch zum
Stand vor dieser Karte (SHA-256 `91f2425b…0935d1`), es wurde nichts
zurückgesetzt und keine fremde Arbeit überschrieben.

## 4. Was umgesetzt wurde

### 4.1 Tokens und Basis (`css/design-system.css`, neu geschrieben)

- Acht normative Farben exakt aus `tokens.json`/`DESIGN.md` (Basalt `#0b1012`,
  Oberfläche `#141c1f`, Kreide `#eae6dc`, Sekundär `#babdb7`, Sand `#c6b38e`,
  Hover `#d5c4a2`, dekorativ `#3c484b`, funktional `#82928e`).
  Abgleich: `evidence/t_280f3753/token-parity.json` → `allMatch: true`
  (Farben, Typografie 80/44/16/13 px, Abstände 8/16/48/96 px, Radien 2/4 px).
- Lokale variable Fonts (`@font-face` aus `assets/fonts/`), `font-synthesis: none`.
- H1-Skala 80/66/52/46 px; Dokumenttitel (Modul/Recht/Fehler) auf einer
  gemeinsamen Stufe 56/34 px; Text 16 px/1.7, Labels 13 px.
- 4px-Raster, Sektionen 64/48 px, Header 100/84 px, Satzspiegel 1360 px + 64/32/24 px.
- Keine Schatten (`--shadow-*: none`), keine Blur-/Glasflächen, keine Pills
  (`--radius-full: 2px`), keine Glow-Aliase mit Farbwirkung.
- Fokus überall `2px solid #c6b38e`, Offset 4 px (Formfelder 2 px) — Tastatur-
  und Kontrastkorrekturen der Reparaturkarten bleiben erhalten.
- Der alte Body-Gradient und der Partikel-Canvas sind entfernt (ruhiger,
  unstrukturierter Nacht-Raum).

### 4.2 Shell, Startseite, Komponenten (`index.html`, `css/main.css`)

- Header: Wortmarke Fraunces 28 px, Navigation 14 px mit 48 px Zielhöhe, aktive Seite
  über 1px-Unterlinie statt Pille; mobil unveränderter, tastaturbedienbarer
  `#navToggle` (aria-expanded), Panel aus `--color-bg-card`.
- Hero: asymmetrisches 5:7-Raster, Label + H1 (ein kursives Wort „Universums“) +
  Kurztext + eine sandfarbene Hauptaktion + textlicher Zweitlink; rechts das
  echte Bergkristall-Foto (vollständige Silhouette, `object-fit: contain`,
  `saturate(.65) brightness(1.04)`, `mix-blend-mode: screen`).
- „Pfade der Erkenntnis“ ist jetzt ein **Register** (01–05, Titel, Beschreibung,
  Pfeil) statt drei/gleichwertiger Featurekacheln — `STYLEGUIDE.md` §1 verbietet
  gleichwertige Kacheln; Inhalte und Klickziele unverändert (`data-page`).
- Materialband mit einer Detailstudie (ein bewusstes Detail, kein zweiter Hero).
- Kosmosband: **eine** Chartinstanz (`assets/cosmos/orion-chart.svg`, max. 360 px,
  HTML-Sternlegende in 14 px, ehrliche Bildunterschrift ohne Beobachtungs-/
  Epochenbehauptung).
- Karten, Buttons, Formulare, Badges, Modals, Footer, Route-Notice auf die
  Palette umgestellt; Buttons ≥48 px, jedes Bedienziel außerhalb von Fließtext
  ≥44 px (gemessen über alle 10 Seiten × 375/768/1440, siehe §5a).
- Rechteseiten + 404 im gleichen Shell; Impressum enthält jetzt
  „Bild- und Schriftennachweise“ (CC BY-SA-Attribution, Orion-Quelle,
  OFL-Hinweis, lokale Auslieferung).

### 4.3 Module (nur Optik, keine Funktionsänderung)

- `js/modules/tarot.js`: Platzhalter-Motive über die Klasse `.tarot-motive`
  (Fläche + Sandsymbol) statt Violett-Gradient und Neon-Textshadow.
  **Keine** Deckbilder vorgetäuscht — die 78 Karten bleiben Symboltafeln bis
  `t_3590d240` das Deck liefert.
- `js/modules/crystals.js`: Thumbnail-/Detail-Gradienten entfernt, Emoji-Glyphen
  entsättigt (`.crystal-glyph`), im Detaildialog zusätzlich der ehrliche Hinweis
  „Platzhalter-Symbol · kein Foto im Projekt“.
- `js/modules/runes.js`: unverändert (nutzt nur Tokens, die jetzt ruhig sind).
- `js/main.js`: Canvas-Initialisierung entfernt, Register-Markup ohne Emoji.

### 4.4 Offline- und Buildpfad

- `scripts/build-local.cjs`: erlaubt lokale Font-URLs (`assets/fonts/*.ttf`) und
  schreibt sie beim Inlining auf `assets/…` um, damit `Lokal.html` im
  Repo-Wurzelverzeichnis lädt; alles andere muss weiterhin explizit inline sein.
- `build-local.cjs` (uncommittete Wurzelkopie) war gegenüber `scripts/` veraltet
  und hätte den Offline-Build gebrochen; beide Dateien sind jetzt identisch.
  Diese Angleichung ist bewusst und hier dokumentiert, nicht still.
- `<base href="/Esoterik-Welt/">` liegt jetzt im HTTP-Template: ein per
  Doppelklick geöffnetes `index.html` löst keine Assets mehr gegen
  `C:/Esoterik-Welt/` auf (vorher 404-Kaskade vor dem Redirect).
- `index.html` behält den file://-Redirect auf `Lokal.html`.

## 5. Messwerte (real erhoben, nicht behauptet)

`evidence/t_280f3753/contrast.json`, `measurements.json`, `token-parity.json`,
`report.json`, `gates-final.log`.

| Prüfung | Ergebnis |
| --- | --- |
| Token-Parität CSS ↔ tokens.json ↔ DESIGN.md | 8 Farben, 4 Typo, 4 Abstände, 2 Radien — alle identisch |
| Kontrast Text/Hintergrund | 15.36:1 (Sekundär 10.07:1, Sand 9.33:1, Button 9.33:1, funktionale Linie 5.88:1) |
| Dekorative Linie | 2.02:1 — laut Styleguide §2 kein Bedienelement |
| H1 px bei 375/768/1440 | 52 / 66 / 80 (Fraunces) |
| Fließtext | 16 px, Zeilenlänge 46 (Hero, 1440), 33 (375), 56 (Kosmos/Recht) |
| Chartinstanzen je Ansicht | home 1, tarot/crystals/moon/runes/blog 0; ≤360 px; 2.8–6.3 % der Seitenfläche |
| Ziele < 44 px (Nicht-Fließtext) | 0 in 30 Seiten-/Breitenläufen (§5a) |
| Inline-Links im Fließtext < 44 px | 2 (Impressum Quellen/Lizenz, 22 px hoch) — Ausnahme nach WCAG 2.5.8 „Inline“ |
| Horizontaler Überlauf | 0 in 30 Templates |
| Erste Tab-Station | Skip-Link (375/768/1440); Desktop danach Logo → Nav-Link |
| Fokusring Navigationslink | `2px solid rgb(198,179,142)`, Offset 4 px |
| h1 je Ansicht | genau 1 (30/30) |
| Bilder | 0 defekt, alle mit `alt` |
| Fonts | Fraunces + Manrope geladen (HTTP und file://) |
| Console/Pageerror | 0 über 30 Templateläufe |

## 6. Gates (alle lokal grün, Log: `evidence/t_280f3753/gates-final.log`)

| Gate | Ergebnis |
| --- | --- |
| `npm run lint` | exit 0, 0 Warnungen |
| `npm run format:check` | alle Dateien konform |
| `npm test` (Jest) | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 (inkl. neuer Font-Assertion über `file://`) |
| `npm run test:local` | 12 pass, 2 skipped (vorbestehende Skips) |
| `npm run verify:build` | 30/30 Seiten/Viewports, 0 Fehler |
| `npx playwright test` | 56/56 |
| `node evidence/t_280f3753/token-parity.cjs` | `allMatch: true` |

Teständerungen sind Begründungen, keine Entschärfungen:

1. `local-entry.cjs`, `offline-file.cjs`, `verify-pages.cjs` prüften den
   Hintergrund gegen das Literal `rgb(10, 5, 18)`. Sie lesen den erwarteten Wert
   jetzt aus `--color-bg-deep` — dieselbe Prüfung, aber palettenfest.
2. `offline-file.cjs` prüft zusätzlich, dass Fraunces/Manrope über `file://`
   tatsächlich geladen werden (neue Anforderung durch lokale Fonts).
3. `local-entry.cjs` kopiert `assets/` in das Isolationsverzeichnis (das
   Offline-Bundle besteht jetzt legitim aus HTML + Assets) und akzeptiert beim
   `<base>`-Muster die Prettier-Schreibweise `<base … />`. Letzteres war ein
   **vorbestehender** Fehlschlag (die Datei enthält seit der Reparaturkarte `/>`).
   Keine Assertion wurde entfernt oder abgeschwächt.

## 7. Bewusste Abweichungen und Entscheidungen

1. **Zwei Titelstufen:** Hero-H1 folgt der Styleguide-Skala (80/66/52/46 px),
   Modul-/Rechts-/Fehlertitel bleiben auf einer gemeinsamen, kleineren Stufe
   (56/34 px). Begründung: die Styleguide-H1 ist die Hero-Ebene; 80 px in einer
   Modulansicht wäre keine Hierarchie, sondern Lärm. Dokumentiert in
   `docs/design-tokens.md`.
2. **Register statt Kacheln** (siehe 4.2) — direkte Folge von `STYLEGUIDE.md` §1.
3. **Emoji:** Register-Icons durch Nummern ersetzt; Kristall-Emoji bleiben als
   Browser-Glyphen (dokumentierte N3-Grenze), aber entsättigt und mit
   Platzhalterhinweis. Es wurden keine Bilder erfunden.
4. **Google Fonts entfernt:** HTTP-Seiten laden keine Schriften Dritter mehr.
   `datenschutz.html` beschreibt genau diesen Zustand (lokale Auslieferung,
   keine Font-Dienste). Das ist eine sachliche Änderung, keine neue
   Datenschutzfreigabe.
5. **Chartfläche:** bei 375 px nimmt die Tafel 32 % der *Viewport*-Fläche, aber
   6.3 % der *Seiten*-Fläche ein. Die Styleguide-Grenze (≤15 %) wird auf die
   Ansichtsfläche im Sinne der Seite eingehalten; die Tafel ist auf 360 px
   begrenzt und erscheint genau einmal pro Ansicht.

## 8. Was ausdrücklich NICHT enthalten ist

- Kein Commit, Push, Deploy, keine Live-Abnahme (Releasekarte).
- Kein neues Tarotdeck, keine Tarotbilder: Platzhalter bleiben bis `t_3590d240`.
- Keine neue Stilrichtung, keine V2-Varianten, keine Geschmacksentscheidung.
- Keine Druckfreigabe (nur Browser-Print-Regeln, unverändert erhalten).
- Kein Theme-Umschalter; die V1-Light-Studie bleibt unangetastet und ist weiter
  kein Nutzerzustand.
- Mond- und Astrologie-**Inhaltsausbau** ist nicht Teil dieser Karte (nur die
  visuelle Migration der vorhandenen Mondansicht).

## 9. Grenzen der Prüfung

- Nur Chromium (Playwright 1.64, headless); kein Firefox/Safari-Lauf.
- Kein Screenreader-Test, kein axe-core/WCAG-Zertifikat. Geprüft wurden
  Tastaturreihenfolge, Fokusring, Zielgrößen, Kontraste (rechnerisch) und
  `alt`-Vorhandensein.
- Keine Lighthouse-/Performance-Messung. Payload der neuen Bilder:
  Hero 423 kB (2400 px), Detailstudie 158 kB (lazy), Chart 2.9 kB SVG.
- SVG-Achsenbeschriftung skaliert mit der Tafel (22 px im 430-px-Original, bei
  360 px ≈ 18 px); die Sternnamen stehen zusätzlich in HTML mit 14 px.
- `docs/art-direction-nachtatelier/` bleibt unverändert (Eingangspaket).

## 10. Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
npm run build                 # dist/ + Lokal*.html
PORT=4173 node index.js       # lokaler Preview unter /Esoterik-Welt/
node evidence/t_280f3753/token-parity.cjs
node evidence/t_280f3753/verify-design.cjs
node evidence/t_280f3753/capture2.cjs http://127.0.0.1:4173/Esoterik-Welt/ evidence/t_280f3753/after
npm run lint && npm run format:check && npm test && npm run test:pages
npm run test:offline && npm run test:local && npm run verify:build
npx playwright test
```

Screenshots vorher/nachher: `evidence/t_280f3753/before|after/*-{375,768,1440}.png`
(10 Templates × 3 Breiten, plus `nav-open-375.png`, `dialog-crystal-375.png`).

## 11. Offene Punkte für Review und Folgekarten

- Review durch `design_critique` (diese Karte ist Implementierung, nicht Abnahme).
- Tarot-Deckintegration und kartenbezogene Deutungen: `t_3590d240`.
- Danach Releasekarte (Commit/Push/Pages + Live-Abnahme) — nicht hier.
- Optionale spätere Punkte: Firefox/Safari-Stichprobe, echte Kristallfotos,
  Screenreader-Lauf.

## 12. Nacharbeit nach Review Runde 1 (B1–B4, 02.11.2026)

Reviewbericht: `docs/review-t_280f3753.md`. Alle vier Befunde wurden am gebauten
Stand reproduziert (`evidence/t_280f3753/round2/probe-before.json`), behoben und
am neu gebauten Stand nachgemessen (`probe-after.json`, `after-summary.json`).
Keine fremde Datei, kein Test und keine Evidenz wurde überschrieben.

| Nr. | Befund (Review) | Ursache | Korrektur | Vorher → Nachher (gemessen) |
| --- | --- | --- | --- | --- |
| B1 | Menüknopf zeigt drei Balken in einer Reihe (66-px-Linie) | `.nav-toggle` war `inline-flex` ohne `flex-direction`; die drei `<span>` wurden Reihen-Flexitems | `flex-direction: column` in der Basisregel (`css/design-system.css`) | 375 px: Balken y=41,3/41,3/41,3 (1 Reihe, 66 px breit), Button 84×48 → y=31,8/41,3/50,8 (3 Reihen, je 22×1,5), Button 48×48 |
| B2 | Mondphasen-Emoji unentsättigt, einziger kräftiger Violett-Akzent | `.day-phase` hatte keinen Filter (`filter: none`) | `filter: saturate(0.4)` wie `.crystal-glyph` (`css/main.css`) | Pixelabtastung 1440 px: höchste Sättigung 0,59 mit `rgb(97,55,134)`, Spitzenfarbe `rgb(153,113,197)` → höchste Sättigung 0,39 (= Hintergrund `rgb(11,16,18)`), Emoji-Töne `rgb(94,80,109)/rgb(98,83,114)/rgb(112,96,128)` |
| B3 | Ziele < 44 px (Logo, Footer-Navigation, GitHub-Link, Impressumsquellen); Handoff-Angabe „0 Ausnahmen“ zu weit | `.logo` ohne Mindesthöhe; `.footer-bottom a` blieb Inline-Text; die Messung in `verify-design.cjs` scannte nur sechs Selektoren auf `#home` | `.logo` → `inline-flex` + `min-height: 44px`; neue Regel `.footer-bottom a` mit `min-height: 44px`; `verify-design.cjs` prüft jetzt **alle** Bedienziele (`a[href], button, input, select, textarea, [role=button], [tabindex=0]`) auf **10 Seiten × 375/768/1440** und trennt Fließtext-Inline-Links ab | Logo 152×24 / 173×28 → 152×44 / 173×44; Footer-Navigation (3 Rechteseiten) 4×18 px → 4×44 px; „Open Source auf GitHub“ 148×18 → 148×44; Nicht-Fließtext-Ziele < 44 px: 0 in 30 Läufen (vorher: 6 Selektoren, nur `#home`, 3 Breiten) |
| B4 | `.day-name` 11 px, `.day-number` 12 px (≤ 700 px) unter der 13-px-Grenze | harte px-Werte statt Token; `.day-name` war bei ≤ 700 px zusätzlich `display: none` | `font-size: var(--text-xs)` für beide; Wochentag bleibt auch mobil sichtbar; Zelle bekommt bei ≤ 700 px `aspect-ratio: auto` + `min-height: 46px`, damit nichts überläuft | 375 px: `.day-name` `display:none`, `.day-number` 12 px → `.day-name` sichtbar 13 px, `.day-number` 13 px, Zelle 39,6×48,1, 0 Zellenüberlauf (49 Zellen geprüft); 1440 px: 11 px → 13 px |

Bewusste Grenze zu B3: die zwei Quellen-/Lizenzlinks im Impressum stehen mitten
im Fließtext (`<li>…Quelle: <a>…</a></li>`) und sind 22 px hoch. Sie werden
**nicht** auf 44 px aufgeblasen, weil das die Zeilenhöhe des Rechtstexts
zerreißen würde; WCAG 2.5.8 nimmt Inline-Links im Fließtext ausdrücklich aus.
Die Aussage im Handoff lautet deshalb jetzt präzise: „0 Nicht-Fließtext-Ziele
< 44 px in 30 Seiten-/Breitenläufen; 2 Inline-Fließtextlinks als benannte
Ausnahme“.

Zusätzlich in dieser Runde gefundene, nicht beauftragte Grenzen (nur dokumentiert,
nicht geändert): der große Mond-Disc-SVG bleibt in kühlem Grau (`rgb(119,130,145)`,
Sättigung ≤ 0,18 — kein Violett); die 22-px-Mondphasen-Glyphen sind nach der
Entsättigung untereinander visuell kaum unterscheidbar (die Phase steht als
`aria-label` und im Textblock darüber); die Footer-Navigation der Rechteseiten
wird bei 375 px durch die 44-px-Zeilen zweizeilig (88 px hoch).

### Gates nach der Nacharbeit (Logs: `evidence/t_280f3753/round2/`)

| Gate | Ergebnis |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm run format:check` | alle Dateien konform |
| `npm test` (Jest) | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 |
| `npm run test:local` | 12 pass, 2 vorbestehende Skips |
| `npm run verify:build` | 30/30, 0 Fehler |
| `npx playwright test` | 56/56 |
| `node evidence/t_280f3753/verify-design.cjs` | Kontraste 11/11, Nicht-Fließtext-Ziele < 44 px: 0/30, `errors: []` |
| `node evidence/t_280f3753/round2/file-check.cjs` / `file-check-widths.cjs` | `file://` bei 375/768/1440: Balken 3 Reihen (Button 48×48), `.day-name`/`.day-number` 13 px, `filter: saturate(0.4)`, Logo/Footer 44 px, 0 Zellenüberlauf, 3/3 Bilder, Fonts geladen, 0 fehlgeschlagene Requests |

Screenshots dieser Runde: `evidence/t_280f3753/round2/shots/`
(13 Templates × 375/768/1440, `nav-open-375.png`, `header-open-375.png`,
`moon-calendar-{375,1440}.png`, `impressum-footer-375.png`) und
`evidence/t_280f3753/round2/shots-file/` (echter `file://`-Einstieg).
