# Farbwelten & Farbtherapie — Umsetzung

Stand: 3. November 2026 · Karte `t_2275e7ad` · Branch `feature/farbwelten-modul`

Diese Datei dokumentiert, wie das IA-/Designkonzept (`docs/farbwelten-konzept/`)
und die Redaktionstexte (`content/farbwelten/`, Task 3) in den bestehenden
Website-Code überführt wurden — einschließlich jeder Abweichung, der
Build-/Testkommandos und der Nachweise.

## 1. Ergebnis in einem Absatz

Die Sektion ist als neuntes Hauptziel „Farben“ eingebaut. Sie hat eine
Einstiegsroute, sieben Farbdetailseiten mit dem vollständigen A–H-Skelett,
eine Chakrenseite mit tastaturbedienbarem Chakra-Explorer und eine
Lichtfrequenzseite mit Spektrum-Explorer. Alle Texte liegen in
`js/data/farbwelten.js` (erzeugt aus den Markdown-Dateien), nicht im Markup.
Paletten sind Tokens in `css/design-system.css`, Komponenten in
`css/farbwelten.css`. Build, Lint, Jest, alle Node-Suiten, alle 100
Playwright-Tests und vier Lighthouse-Läufe (A11y/BP/SEO je 100) sind grün.

## 2. Build- und Testkommandos

| Zweck | Kommando | Ergebnis |
| --- | --- | --- |
| Produktionsbuild (Pages-Quellen + Offline-Edition) | `npm run build` | grün, `dist/Esoterik-Welt/` + `Lokal.html` |
| Lint | `npm run lint` | grün, 0 Warnungen |
| Formatprüfung der neuen Dateien | `npx prettier --check <dateien>` | grün |
| Datensatz neu erzeugen | `npm run data:farbwelten` | schreibt `js/data/farbwelten.js` + Prettier |
| Vertrags-/Rechentests (Node) | `npm run test:farbwelten` | 10/10 |
| Browsertests der Sektion | `npx playwright test tests/farbwelten.spec.js` | 14/14 |
| Bestehende Suiten | `npm run test:unit`, `test:pages`, `test:crystals`, `test:astrologie`, `test:radiasthesie`, `test:tarot`, `test:tarot:decks`, `test:moon` | 2 + 6 + 9 + 21 + 16 + 11 + 12 + 14, alle grün |
| Offline-Edition (file://, inkl. neuer Route) | `npm run test:offline` | 2/2 |
| Alle Browsertests | `npx playwright test` | 100/100 |
| A11y-/Layout-/Kontrastprüfung | `npm run verify:farbwelten` | 56 Prüfungen + 6 Kopfzeilenbreiten, 0 Fehler |
| dieselbe Prüfung gegen die gebaute Fassung | `PORT=3200 node index.js` + `node scripts/verify-farbwelten.cjs http://127.0.0.1:3200/Esoterik-Welt/` | 56 Prüfungen + 6 Breiten, 0 Fehler (`report-dist.md`) |
| Lighthouse (4 Routen) | `npx lighthouse <url> --only-categories=accessibility,seo,best-practices` | 100/100/100 |

`npm run test:all` führt alle Suiten inklusive `test:offline` und `test:e2e`
aus. Die Browsertests brauchen einen Build; `playwright.config.cjs` startet
`node index.js` und liefert `dist/Esoterik-Welt` unter `/Esoterik-Welt/` aus.

## 3. Dateien

**Neu**

| Datei | Inhalt |
| --- | --- |
| `css/farbwelten.css` | Komponenten: Hero, Farbtafel, Register, Karten, Detailband, TOC, Fakten, Zeitleiste, Farbfläche, Chakra-Explorer, Vergleichskasten, Quellen, Tabelle, Spektrum-Explorer, Responsiv-/Druckregeln |
| `js/modules/farbwelten.js` | Bereichsmodul: Ansichten, sichere Textausgabe, Chakra-Auswahl, Spektrumrechner, Metadaten, strukturierte Daten |
| `js/modules/farbwelten-model.js` | reine Logik: Routenauflösung, Frequenz-/Energie-/Farbnamenberechnung, Wellenlänge→sRGB |
| `js/data/farbwelten.js` | erzeugter Datensatz: 7 Farbwelten, 8 Abschnitte je Seite, Quellenregister, Einstieg, Chakrenseite, Lichtseite |
| `js/data/chakren.js` | 7 Chakren mit Sanskrit, Position, Themen, Einordnung, Herkunftssatz |
| `scripts/generate-farbwelten-data.cjs` | Markdown→Daten-Importer (einmalig, reproduzierbar) |
| `scripts/verify-farbwelten.cjs` | Browserprüfung: H1, Überschriften, A–H, Überlauf, Kontrast, Tastatur, Alias, Kopfzeile, Screenshots |
| `scripts/summarize-lighthouse.cjs` | Lighthouse-JSON auswerten |
| `tests/farbwelten.mjs` | 10 Vertrags-/Rechentests ohne Browser |
| `tests/farbwelten.spec.js` | 14 Browsertests der Sektion |
| `content/farbwelten/*.md` | Redaktionsquelle (10 Dateien, unverändert aus Task 3) |
| `evidence/farbwelten/` | Prüfbericht, JSON-Rohdaten, 8 Screenshots, 4 Lighthouse-Reports |

**Geändert**

| Datei | Änderung |
| --- | --- |
| `index.html` | neuntes Navigationsziel „Farben“, Sektion `#farbwelten`, Stylesheet-Link, Footer-Link |
| `js/main.js` | Import, `MAIN_PAGES`, `FARBWELTEN_ROUTE`, Alias-Routen, `PAGE_META`, Modulinitialisierung, Initial-Load, `applyRoute`-Zweig |
| `css/design-system.css` | 49 `--fw-*`-Palettentokens, `[data-farbwelt]`-Scoping, Mobilmenü-Grenze 780 → 900 px |
| `css/main.css` | Kompaktblock 781 → 901 px; 781–900-px-Sonderblock entfernt |
| `scripts/verify-pages.cjs` | vier neue Routen, `farbweltenRoot`, Seitenvergleich für Unterrouten |
| `tests/offline-file.cjs` | Farben im Navigationslauf + Kaltstart `#farbwelten/rot` offline |
| `tests/radiasthesie.spec.js` | Mobilmenü: 9 statt 8 Ziele |
| `package.json` | `test:farbwelten`, `data:farbwelten`, `verify:farbwelten`, Aufnahme in `test:all` |

## 4. Routen

| Route | Ansicht |
| --- | --- |
| `#farbwelten` | Einstieg: Hero, Farbtafel, Register, Inhalte, zwei Einstiege, Methodenhinweis, Quellen |
| `#farbwelten/rot` … `/violett` | sieben Farbseiten, A–H |
| `#farbwelten/rot/physik` | Farbseite mit Sprungmarke (jeder A–H-Anker) |
| `#farbwelten/chakren` | Chakrenübersicht mit Explorer und Tabelle |
| `#farbwelten/lichtfrequenzen` | Spektrum-Explorer, Lichtmedizin, Disclaimer |
| `#chakren`, `#lichtfrequenzen` | Aliasse, werden per `replaceState` auf die kanonische Route umgeschrieben |

**Abweichung 1 (dokumentiert):** Die Karte nennt `/farbwelten`,
`/farbwelten/<farbe>`, `/chakren`, `/lichtfrequenzen` als Pfade. Das IA-/Design-
Konzept (`02` §2) entscheidet verbindlich Hash-Unterrouten, weil die Website
eine Ein-Dokument-Anwendung ohne Static-Site-Router ist; echte Pfade würden
neue Dokumente und einen zweiten Routerpfad erzeugen. Die vom Auftrag
genannten Adressen sind über die Aliasse erreichbar. `/farbwelten` als echter
Pfad existiert nicht — bewusst, nicht als Lücke.

**Abweichung 2 (dokumentiert):** Die Karte verlangt Sitemap-Einträge; das IA
(`02` §10, `08` §8) schließt sie aus, weil Hash-Ansichten keine eigenen
Dokumente sind und Doppelindexierung vermieden werden soll. `sitemap.xml`
bleibt unverändert (im Test geprüft). Canonical bleibt die Startseite.

## 5. Inhalte: Markdown → Daten

`scripts/generate-farbwelten-data.cjs` liest `content/farbwelten/*.md` und
erzeugt `js/data/farbwelten.js`. Es gibt **keine** handkopierten Texte im
Modul und **keine** Prosa im Markup; ein Test prüft, dass `index.html` keine
Redaktionstexte enthält.

Der Importer bricht ab, wenn eine H2-Überschrift keiner Regel zugeordnet ist —
so kann kein Absatz still verschwinden. Ausgelassene Abschnitte werden
protokolliert.

### 5.1 Zuordnung der gelieferten Abschnitte

| Redaktion (Task 3) | Abschnitt im Skelett |
| --- | --- |
| Einstiegstext („## Einführung“) | Lede im Seitenkopf + A |
| „Traditionelle / esoterische Bedeutung“ | D |
| „Farbpsychologie …“ | C |
| „Anwendung …“, „Was nicht verwendet wird“, „Blaulicht …“, „Was Wissenschaft sagt“ | E (als Unterabschnitte, in Originalreihenfolge) |
| „Interkulturelle …“, „Traditionshistorische …“, „Physikalisch und traditionell“ | F |
| „Praktische Übung“ / „Übung“ | G |
| „Quellen …“ | H (Register) |
| „Anmerkung zur ehrlichen Einordnung“ | nicht ausgeliefert (Meta-Text über den Seitenaufbau, kein Inhalt über die Farbe) |

### 5.2 Ergänzte Abschnitte (nur aus vorhandenen Daten)

* **A „Die Farbe erleben“:** Farbfläche mit vier Tönen (Tokens `-soft`,
  `-core`, `-core-deep`, `-deep`), Wellenlängenbereich und Einordnung. Die
  Werte stammen aus den Paletten- und Wellenlängendaten, nicht aus neuen
  Behauptungen.
* **B „Physikalische Eigenschaften“:** Wellenlänge, Frequenz (`f = c/λ`),
  Photonenenergie (`1239,842/λ`), Entstehung, plus Hinweis auf Metamerie
  (`[24][31]`). Die Werte werden im Generator berechnet.
* **F „Kultur und Geschichte“:** gemeinsame, belegte Zeitleiste 1577/1919/
  1920er/1977 aus `chakren.md` (`[1][2]`) — für alle Farbwelten identisch, weil
  die Redaktion keine eigene Kulturgeschichte je Farbe geliefert hat. Keine
  erfundenen regionalen Erzählungen.
* **Vergleichskasten „Tradition und Forschung“:** genau einer je Farbseite, in
  Abschnitt E, weil dort die konkrete Behauptung (Farbe als Heilmittel) steht.
  Die Fußzeile benennt die asymmetrische Evidenz (IA `05` §6).

### 5.3 Redaktionelle Lücke (sichtbar, nicht kaschiert)

Für **Indigo** und **Violett** enthält der Redaktionsstand keinen Abschnitt zur
Farbpsychologie. Statt Inhalte zu erfinden, zeigt Abschnitt C einen
gekennzeichneten Redaktionshinweis („Für diese Farbwelt enthält der
Redaktionsstand keinen Abschnitt zur Farbpsychologie …“). Das A–H-Skelett und
die Sprungmarken bleiben vollständig. Die Ergänzung ist ein redaktioneller
Auftrag, kein Implementierungsfehler.

### 5.4 Quellen

`farbwelten.md` liefert die vollständige Bibliografie (`[1]`–`[32]`). Der
Generator baut daraus ein Register; jede Seite rendert die von ihr zitierten
Einträge. Nummern, die im gelieferten Text nur als Kurzverweis erscheinen
(`[14]`, `[16]`–`[19]`), sind als solche gekennzeichnet; nicht aufgelöste
Nummern (`[20]`, `[32]`) erscheinen als Fußnote mit Verweis auf den
Evidenzreport `t_2dd7d588`. Es wurden keine bibliografischen Angaben ergänzt
oder erfunden.

## 6. Design und Tokens

* 49 Palettentokens (`--fw-<welt>-{ink,core,core-deep,soft,line,deep,deep-alt}`)
  in `css/design-system.css`, Werte unverändert aus `palette.css` /
  `03-farbwelten-und-paletten.md`.
* `[data-farbwelt="<id>"]` setzt `--fw-current-*`; das Modul setzt nur das
  Attribut, keine Inline-Farben. Ein Test/`grep` auf `#rrggbb` in
  `css/farbwelten.css` findet keine Literale.
* **Abweichung 3:** Der Hero ist `align-items: center` statt `end`. Grund: der
  Redaktions-H1 ist eine Zeile („Farbwelten“), das Mockup hatte vier; mit
  `end` entstand ein 300-px-Loch über der Überschrift. Dokumentiert im CSS.
* Kopfzeile: neuntes Ziel, Mobilmenü bis 900 px, Kompaktblock ab 901 px
  (gemessene Reserve 50,31 px, `02` §3).

## 7. Accessibility

Automatisiert geprüft (`npm run verify:farbwelten`, alle Breiten 1440/1100/
900/390/320):

| Prüfpunkt | Ergebnis |
| --- | --- |
| Genau eine H1 je Ansicht | 11/11 Routen |
| Keine Überschriftsprünge (H1→H2→H3) | 0 Sprünge |
| A–H-Sprungmarken sichtbar | 8/8 auf allen sieben Farbseiten |
| Horizontaler Überlauf | 0 px an allen Breiten (Reflow 320) |
| Kontraste (Text/Linien, berechnet im DOM) | alle geprüften Paare ≥ 4,5:1 (min. 9,09:1 im DOM-Sample); Paletten-Ink 4,81:1 separat in `messung/palette.json` belegt |
| Fokusring | 2 px `#c6b38e`, Offset 4 px (Site-Standard), nie entfernt |
| Chakra-Auswahl | 7 Buttons, genau einer `aria-pressed`, Pfeiltasten wechseln Fokus + Auswahl + Panel |
| Spektrum-Slider | `aria-valuetext` (z. B. „530 Nanometer, Grün, 565,6 Terahertz …“), Pfeiltasten ±1 nm, Shift ±10 nm |
| SVG | `<title>` + `<desc>`, `role="img"` |
| Bilder ohne Alt | 0 (keine `<img>`) |
| `prefers-reduced-motion` | keine Animationen im Modul; globale Regel greift |
| Sprache/Landmarks | `lang="de"`, header/nav/main/footer, Skip-Link |

**Lighthouse 12.6.1** (Chromium 155, lokal): `#farbwelten`,
`#farbwelten/rot`, `#farbwelten/chakren`, `#farbwelten/lichtfrequenzen` —
Accessibility **100**, Best Practices **100**, SEO **100**, keine Befunde
unter 1,0. Rohdaten: `evidence/farbwelten/lighthouse-*.json`.

**Nicht geprüft (offen):** ein echter Screenreader-Lauf (NVDA/JAWS/VoiceOver);
Lighthouse nur für vier der elf Ansichten; Performance nicht bewertet (die
Sektion lädt ein 66-KB-Datenmodul dynamisch); Textzoom 200 % nicht separat
(Reflow bei 320 px ist geprüft).

## 8. SEO

* Titel und Beschreibungen je Route exakt aus IA `02` §10 (ein Test prüft
  Länge und Site-Suffix).
* `document.title`, `meta[name=description]`, `og:title`, `og:description`,
  `twitter:title`, `twitter:description` folgen der aktiven Unterroute.
* `BreadcrumbList` als JSON-LD, nur wo ein sichtbarer Breadcrumb steht; kein
  `Article`/`FAQPage` ohne Autor/Datum bzw. echte Fragen.
* Interne Verlinkung: jede Farbseite → Chakren, Lichtfrequenzen, Kristalle,
  Blog; Chakren → alle sieben Farbwelten; Lichtseite → alle Farbwelten;
  Einstieg → beide Hauptpfade; Footer → Farbwelten.
* `sitemap.xml` unverändert, Canonical unverändert (siehe Abweichung 2).

## 9. Nachweise

* `evidence/farbwelten/report.md` — Prüftabelle (Route × Breite, Kontraste,
  Kopfzeilenreserve) gegen die Quellen im Pages-Layout.
* `evidence/farbwelten/report-dist.md` + `results-dist.json` — dieselbe
  Prüfung gegen `dist/Esoterik-Welt` (ausgelieferte Build-Fassung).
* `evidence/farbwelten/results.json` — Rohdaten inkl. gemessener Farbwerte.
* `evidence/farbwelten/*.png` — Landing, Rot, Chakren, Lichtfrequenzen bei
  1440 und 390 px.
* `evidence/farbwelten/lighthouse-*.json` — vier Lighthouse-Läufe.

## 10. Rollback

Ein `git revert` des Feature-Commits entfernt Navigation, Route, Modul, Styles,
Daten, Tests und Doku. Es gibt keine Migration, keinen externen Dienst, keine
Änderung an `sitemap.xml` oder am Canonical. Der Offline-Build wird aus dem
Quellcode neu erzeugt (`npm run build`).

## 11. Offene Punkte und Hinweise für den Merge

1. **Redaktion:** Abschnitt C (Farbpsychologie) fehlt für Indigo und Violett;
   die Seiten zeigen bis dahin einen gekennzeichneten Hinweis.
2. **Screenreader:** kein NVDA/JAWS/VoiceOver-Lauf; die Struktur ist
   automatisiert geprüft (eine H1, keine Sprünge, `aria-pressed`,
   `aria-valuetext`, SVG-Titel).
3. **Lighthouse:** vier von elf Ansichten geprüft, nur A11y/BP/SEO (keine
   Performance-Bewertung).
4. **Offline-Artefakte:** `npm run build` schreibt `Lokal*.html` auch in den
   Arbeitsbaum. Diese Dateien waren bereits vor dieser Karte durch eine andere
   Arbeitslinie (Tarot V2) geändert und enthalten daher fremde, nicht
   committete Änderungen; sie wurden bewusst **nicht** mitcommittet. Nach dem
   Merge dieser Linie einmal `npm run build` ausführen und die generierten
   Dateien separat committen. Die Build-Fassung in `dist/` und die
   file://-Prüfung (`npm run test:offline`) sind grün.

## 12. Redaktioneller Nachlauf (nicht Teil dieser Karte)

`content/farbwelten/` enthält den Redaktionsstand aus Task 3. Die fachlich
geprüften Korrekturen aus `t_bad71f2c` (B1–B7) und `t_18afe77f` liegen als
Board-Anhänge vor und sind hier **noch nicht** eingearbeitet — das übernimmt
eine separate, abhängige Übergabekarte (Vorgabe des Operateurs, keine parallele
Doppelkorrektur).

Ablauf für diese Übergabe:

1. Korrigierte Markdown-Dateien nach `content/farbwelten/` übernehmen.
2. `npm run data:farbwelten` — der Generator liest die neuen Texte; neue
   Abschnitte (z. B. vollständige Bibliografien in B1) erscheinen automatisch,
   sofern ihre H2-Überschriften einer Regel in `SECTION_MAP` zugeordnet sind.
   Greift keine Regel, bricht der Generator mit Datei- und Überschriftenname ab
   — dann `SECTION_MAP` in `scripts/generate-farbwelten-data.cjs` ergänzen.
3. `npm run test:farbwelten` und `npx playwright test tests/farbwelten.spec.js`.
4. Abschnitt C für Indigo/Violett ergänzen, sobald die Übergabe gelandet ist
   (Karte `t_f611ba88`, bis dahin blockiert); der sichtbare Redaktionshinweis
   verschwindet automatisch, sobald der Abschnitt Blöcke enthält.
