# TESTBERICHT — ESOW-RAD-13: unabhängige technische Abnahme der Pakete RAD-01…12

| Feld | Wert |
| --- | --- |
| Karte | `t_29535d62` (ESOW-RAD-13), Master `t_878c59c7` / ESOW-RAD-000 |
| Prüfobjekt | Commit `9bf5f73` („test(radiasthesie): Ueberschriftenordnung und eindeutige IDs der statischen Dokumente“), Branch `feature/radiasthesie-modul` |
| Prüfbaum | eigener, detached Worktree `C:/Users/mas/Arbeit/esow-qa-rad13`, `git status` leer, `npm ci` (852 Pakete) |
| Kanonischer Arbeitsbaum | unverändert (kein Build, kein Branchwechsel, keine Datei angefasst) |
| Datum | 2026-11-03 |
| Prüfer | Profil `tester` (unabhängig; Worker-Checkpoints nur als Soll-Angabe gelesen, nicht als Ergebnis übernommen) |
| Umgebung | Windows 11, Node v24.13.0, npm 11.8.0, Playwright 1.64 (Chromium headless), axe-core 4.14.0, git-bash |
| Basis-URL | `http://127.0.0.1:<freier Port>/Esoterik-Welt/` — eigener In-Process-Server im Prüfbaum (`dist/Esoterik-Welt`), kein Fremdserver, `CI=1` |
| Ergebnis in einem Satz | **NICHT ABGENOMMEN** — Build, alle Suiten (249 Node-Tests, 147 Playwright-Tests), alle vier Breiten, Konsole/Netz, XSS/Import/Löschung und die Statistik sind belegt in Ordnung; **ein** WCAG-1.4.1-Befund (axe `link-in-text-block`, „serious“, 7 von 12 Ansichten) und zwei kleine Bild-/SEO-Restpunkte stehen dagegen. |

## 1. Vorgehen

1. Isolierte, bytegleiche Prüfkopie des Kandidaten (`git worktree add --detach … 9bf5f73`), frische Abhängigkeiten (`npm ci`), eigener Port, `CI=1` (kein `reuseExistingServer`).
2. Alle vorhandenen Gates selbst ausgeführt (Build, Lint, Format, Jest, 15 Node-Suiten, Offline, `verify:build`, vollständige Playwright-Suite).
3. Eigene, unabhängig geschriebene Sonden (Skripte unter `scripts/`, Evidenz unter `evidence/`):
   - `rad13-static-probe.mjs` — 8 HTML-Dokumente: Titel/Description/Canonical/og:url/robots, JSON-LD (Parse + `@context` + Typen), H1/Überschriftenordnung, 604 interne Links inkl. Sprungmarken, Bilder/Alt/Srcset, externe Ressourcen in HTML und CSS, Kein-JS-Textmenge, Platzhalter, Sitemap, B1-Formulierungen.
   - `rad13-browser-routes.mjs` — 20 Ansichten × 4 Breiten (320/375/768/1440) = **80 Läufe**: Überlauf, Konsole, PageError, HTTP≥400, fehlgeschlagene Requests, externe Requests, sichtbare H1, defekte Bilder, Bildauflösung, `<picture>`-Kandidaten.
   - `rad13-a11y.mjs` — axe-core 4.14.0 auf 12 Ansichten, Tastaturdurchlauf (alle fokussierbaren Elemente), Fokusindikator, reduzierte Bewegung (`reducedMotion: 'reduce'`).
   - `rad13-functional.mjs` / `rad13-functional2.mjs` — Skip-Link, Journal-XSS/Export/Löschung, Studio-Import (ungültig/übergroß/hostil), SVG-Export, Statistik gegen unabhängige exakte Bruchrechnung.
4. Jeder Befund hat Reproduktionsschritte, Messwert und Evidenzdatei. Keine Meldung wurde unterdrückt; die Playwright-Konfiguration und alle Tests blieben unverändert.

## 2. Matrix der 14 Pakete (Status je Paket)

Lesart: **Pass** = im geprüften Stand belegt · **Fail** = Defekt mit Befund · **Open** = nicht abschließend geprüft oder bewusst außerhalb dieses Laufs. RAD-13 ist dieser Lauf, RAD-14 ist ausdrücklich **offen** (Dokumentationslauf nach diesem Bericht).

| Paket | Prüfgegenstand | Evidenz | Status |
| --- | --- | --- | --- |
| 01 Bestandsaufnahme/Architektur | Integrationspunkte, Matrix, Abgrenzung | `docs/radiasthesie-completion/RAD-01/` gelesen; Route/Datei-Zuordnung im Prüfbaum nachgezogen (20 Routen erreichbar) | **Pass** |
| 02 Fachrecherche/Quellen | 66 Quellenkarten, Typ/Prüftiefe/Interessenvermerk, Zitationsauflösung | `static-probe.json` (66 IDs, 0 Platzhalter), `radiasthesie/quellen.html` 99 interne Links, 0 tote; Sitemap-Ziele 200 | **Pass** (Tiefenprüfung einzelner Belege nur stichprobenartig, siehe §5) |
| 03 Taxonomie/Datenmodell | additive Felder, Schema, Generatorvalidierung | `npm run build` deterministisch, `rad-node` 24/24, `rad-vertraege` 20/20, `rad-statisch` 12/12 | **Pass** |
| 04 UX/UI + Werkstatt-UX | Layout, mobile Bedienbarkeit, Tokens, Fokus | 80 Läufe: 0 px Überlauf bei 320/375/768/1440, 0 Konsolenfehler, sichtbare H1 = 1; axe ohne Struktur-/Namensverstöße | **Pass** mit Befund F1 (Link-Erkennbarkeit) |
| 05 Bildbibliothek/Lizenzen | 6 Fotos, Varianten, Manifest, Attribution, Alt/Caption | 4 `<picture>`-Blöcke je Themenseite, Alt-Texte vorhanden, 0 defekte Bilder, 0 externe Bild-Requests; Lizenz-/Share-Alike-Texte auf `methodik.html` (Node-Test 24/24) | **Pass** mit Befund F2 (Auflösung) |
| 06 Redaktionelle Themenseiten | 3 Themenseiten, 32 Kapitel, indexierbarer Text, B1/B5 | 7 statische Dokumente ohne JavaScript lesbar (`main`-Text 3.551–36.616 Zeichen), B1/B5 nachgetestet, 0 tote Links | **Pass** |
| 07 Pendelsimulator | Physik, Bedienung, Tastatur, reduzierte Bewegung | `rad-simulator` 21/21, `radiasthesie-simulator.spec.js` 11/11, Tastatur erreicht `#psimLength`, reduced motion 0,01 ms | **Pass** |
| 08 Pendeltafel-Studio | Tafeln, Farben, SVG-Export, Druck, Import-Validierung | `rad-tafeln` 37/37, `pendeltafel-studio.spec.js` 17/17; Import ungültig/übergroß/hostil abgewiesen (Meldungen belegt), SVG-Export ohne Skript/Handler | **Pass** |
| 09 Verblindetes Experimentierlabor | Commitment, Sperre, Statistik, Export | `rad-experiment` 24/24, `experiment-labor.spec.js` 7/7; **Statistik unabhängig nachgerechnet**: 10 Fälle, max. Abweichung 2,0e-15 (p-Wert und Wilson-Intervall), Wilson-Invarianten 0 Verstöße | **Pass** |
| 10 Pendeltagebuch | lokal, Export, vollständige Löschung, XSS | `rad-journal` 26/26, `pendel-journal.spec.js` 10/10; eigener XSS-Test: `<img src=x onerror=…>` bleibt Text, `window.__xss` null; „alles löschen“ entfernt den Schlüssel restlos | **Pass** (Exportinhalt nur teilweise geprüft, §5) |
| 11 Integration verwandte Themen | 7 Anschlüsse + 2 benannte Lücken, Frequenz ≠ „Schwingung“ | `radiasthesie.mjs` (Vernetzungstests grün), `radiasthesie-vernetzung.spec.js` 6/6, Bovis/Frequenz-Trennung im Text | **Pass** |
| 12 SEO/GEO/strukturierte Daten | 7 indexierbare Dokumente, Sitemap, Canonical, JSON-LD, Titel | Sitemap 11 Einträge, 0 Fragmente, 11/11 Ziele vorhanden; Canonical je Dokument eindeutig, `og:url` = Canonical, keine Hash-Adresse in Canonical/JSON-LD; JSON-LD `@context` = schema.org, Typen WebPage/CollectionPage/BreadcrumbList/DefinedTermSet; Titel 45–59 Zeichen, Descriptions 93–149 | **Pass** mit offenem B7 (`og:image`) |
| 13 Qualitätskontrolle | dieser Bericht | siehe §6 | **dieser Lauf** |
| 14 Dokumentation/Übergabe | Architektur, Medienverzeichnis, Bedienungsanleitungen, Testprotokolle | nicht Gegenstand dieses Laufs; RAD-12-Checkpoint nennt Medien-/Werkstattdokumentation als vorhanden | **Open (ausstehend, RAD-14)** |

## 3. Nachtest der Befunde B1–B11

| Befund | Erwartung | Ist im geprüften Stand | Evidenz | Urteil |
| --- | --- | --- | --- | --- |
| **B1** Bovis „6.500 = gut“ | Aussage durch zitierte Quellen gedeckt oder ohne Zahlenwert | `6.500 = gut`: **0 Treffer** in Datendatei und allen HTML-Dokumenten; „6.500 … neutral“ 4 Treffer | `static-probe.json` (`data.bovisWrong=0`, `bovisNeutral=4`) | **behoben** |
| **B2** Kopfzeilen-Sprung (Burger) | Zähler reserviert Platz, Test nicht abgeschwächt | `#favCounter` statisch im Markup, `min-width`; vollständige Suite 147/147 in einem Lauf, B2-Regressionstest grün | `playwright.log`, `playwright-report.json` | **behoben** (ein Lauf; Wiederholungslauf nicht durchgeführt, §5) |
| **B3** H1→H3 auf Fehleransicht | keine Überschriften-Sprünge | 7 statische Dokumente: 0 Sprünge, je genau eine H1 | `static-probe.json` | **behoben** für statische Dokumente; SPA-Fehleransicht nicht separat geprüft (Open) |
| **B4** ISBN/Jahr/Kataloglink | ISBN sichtbar, Locator gerendert | `978-3-406-69119-5` in `quellen.html`, lobid-Kataloglink vorhanden | `radiasthesie/quellen.html` | **behoben** |
| **B5** Quellen ohne Seitenzuordnung | Kennzeichnung statt Schweigen | 6 × „Nicht im Fließtext zitiert“ | `radiasthesie/quellen.html` | **behoben** |
| **B6** keine indexierbare URL | echte Dokumente + Sitemap | 7 Dokumente, 11 Sitemap-Einträge, 0 Fragmente, Kein-JS-Text belegt | `static-probe.json` | **behoben** |
| **B7** `og:image` fehlt | Bild vorhanden | in allen 8 geprüften Dokumenten `ogImage = null` | `static-probe.json` | **offen** |
| **B8** Titel 61–75 Zeichen | ≤ 60 Zeichen | Modulansichten und Dokumente 45–59 Zeichen; Titel eindeutig | `static-probe.json`, `browser-routes.log` | **behoben** (im Radiästhesie-Bereich; andere Module unverändert) |
| **B9** `tarot-decks-v2` CRLF | auf frischem Checkout grün | 12/12 auf frischem `npm ci`-Baum | `log-tarot-decks-v2.txt` | **behoben** |
| **B10** Glossar 15 vs. 13 | Frontmatter = Lieferumfang | Frontmatter „17 Begriffe“, Daten 17, gerendert 17 | `inhalte/glossar.md`, `rad-node` | **behoben** |
| **B11** unbekannter Kapitel-Slug | Fehleransicht oder Hinweis | Verhalten unverändert (still auf Themenseite), im Checkpoint dokumentiert | QAFIX-Checkpoint §1 | **offen (dokumentiert)** |

**Releasepflichtige Befunde B1/B2 sind damit durch eigene Nachprüfung erledigt** — nicht durch die frühere FREIGABE-Empfehlung.

## 4. Prüfpunkte des Originalauftrags RAD-13

| Prüfpunkt | Ergebnis | Evidenz |
| --- | --- | --- |
| Build und Typprüfung | `npm run build` grün, deterministisch (Offline-Build byte-gleich reproduziert, `local-entry` 6/8 + 2 umgebungsbedingt übersprungen); `verify:build` 36/36 Seitenansichten + 7/7 statische Dokumente, 0 Fehler. Keine TypeScript-Typprüfung im Projekt vorhanden → **nicht anwendbar**, nicht ersetzt | `log-build.txt`, `log-verify-build.txt` |
| Alle neuen Seiten und Routen | 20 Ansichten × 4 Breiten erreichbar, je genau eine sichtbare H1, Titel eindeutig | `browser-routes.json` |
| Interne Links | 604 interne Ziele in 8 Dokumenten: 0 tote Datei-/Ankerziele (Hash-Routen der SPA separat als App-Routen gezählt) | `static-probe.json` |
| Bildauflösung und Lizenzen | 0 defekte Bilder, Alt-Texte vollständig, Lizenz-/Share-Alike-Angaben vorhanden; **1 Befund**: 520-px-Dateien werden 680 CSS px breit gerendert (F2) | `browser-routes.json`, F2 |
| Responsivität / Mobile Layouts | 80 Läufe, `scrollWidth − clientWidth = 0` in **allen** Läufen (Maximum 0 px) | `browser-routes.json` |
| Tastaturbedienbarkeit | Tab erreicht alle geprüften Bedienelemente der Werkzeuge (`#psimLength`, `#jrQuestion`, Studio-Felder); 0 fokussierbare Elemente ohne sichtbaren Fokusring; Skip-Link auf statischen Dokumenten funktional (Tab nach Enter landet im `main`) | `a11y-probe.json`, `functional-probe2.json` |
| Barrierefreiheit (WCAG 2.2 AA, soweit anwendbar) | axe 4.14.0, 12 Ansichten: **1 Regelverstoß** `link-in-text-block` (serious) auf 7 Ansichten (F1); keine Verstöße gegen Namen/Rollen/Landmarks/Überschriften/aria; 3 `color-contrast`-Fälle von axe als „incomplete“ markiert (dekorative `aria-hidden`-Glyphen, SVG-Text im Studio) → **nicht abschließend geprüft** | `a11y-1440.log`, F1 |
| Reduzierte Bewegung | `prefers-reduced-motion: reduce`: maximale Transition-/Animationsdauer 0,00001 s (0,01 ms) auf allen 12 Ansichten | `a11y-probe.json` |
| Performance | **nicht gemessen** — Lighthouse/@lhci im Prüfbaum vorhanden, aber in diesem Lauf nicht ausgeführt (Zeitbudget); keine Zahl behauptet | — (Open) |
| Statistische Berechnungen | exakter zweiseitiger Binomialtest und Wilson-95-%-Intervall gegen unabhängige BigInt-Bruchrechnung: 10 Fälle, max. Abweichung **2,0e-15**; Intervall-Invarianten (0 ≤ low ≤ h/n ≤ high ≤ 1) in 0 von 120 geprüften Fällen verletzt | `functional-probe2.json` |
| Sicherheit von Benutzereingaben | Journal: `<img src=x onerror=…>` + `<script>` bleiben Text, kein `img[src=x]` im DOM, `window.__xss` null; Studio-Import: ungültiges JSON, >32 KiB und unbekannte Felder werden mit sichtbarer Meldung abgewiesen; SVG-Export ohne `<script>`/`on*` | `functional-probe.json`, `functional-probe2.json` |
| Reproduzierbarkeit der Experimente | Statistik deterministisch (reine Funktionen), Commitment/Sperre laut Suite (`experiment-labor.spec.js` 7/7); Unabhängigkeitsprüfung der Zielziehung nicht neu implementiert → **nicht abschließend geprüft** | `playwright-report.json` |
| Quellenverfügbarkeit | 66 Quellenkarten, 0 Platzhalter, 99 interne Quellenlinks ohne totes Ziel; externe HTTP-Erreichbarkeit in diesem Lauf **nicht** erneut abgefragt (frühere Prüfung: 8/8 DOIs auflösbar, 6 Bot-Schutz-Codes) | `static-probe.json`; externe Erreichbarkeit: Open |
| Sachliche Konsistenz | B1 korrigiert; Bovis nicht als SI-Größe, Frequenz ≠ esoterische „Schwingung“ (Texte + `rad-node`-Tests); keine Wirkversprechen in den geprüften Passagen | `rad-node`, `static-probe.json` |
| Fehlende Inhalte und Platzhalter | 0 `TODO`/`FIXME`/`Lorem ipsum`/„Platzhalter“ in Daten und Dokumenten; 0 „in Vorbereitung“ im Modul (alle Werkzeuge implementiert) | `static-probe.json` |
| Unbeabsichtigte externe Requests | **0** externe Requests in 80 Läufen; **0** externe `<script>/<link>/<img>/<iframe>` und **0** externe `url()` in den Stylesheets | `browser-routes.json`, `static-probe.json` |
| Regressionen vorhandener Funktionalität | Jest 2/2, Seiten-Regression 6/6, Kristalle 9/9, Astrologie 21/21, Tarot 11/11, Decks 12/12, Mond 14/14, Offline 2/2, Playwright gesamt 147/147 (0 fehlgeschlagen, 0 übersprungen) | `suites.tsv`, `playwright-report.json` |

## 5. Befunde

### F1 — Links im Fließtext sind nur durch Farbe erkennbar (WCAG 1.4.1) · **P2** · Barrierefreiheit
**Ort:** `#pendeln/quellen` (17 Knoten), `radiasthesie/quellen.html` (19), `#pendeln/methodik` (6), `#pendeln/pendeln` (2), `radiasthesie/index.html` (2), `radiasthesie/pendeln.html` (4), `#pendeln/journal` (1).
**Erwartet:** Links innerhalb von Textblöcken sind nicht ausschließlich durch Farbe unterschieden (Unterstreichung oder ≥ 3:1 Farbunterschied zum umgebenden Text).
**Ist:** axe-core 4.14.0 meldet `link-in-text-block` mit Impact „serious“: z. B. `#quelle-Q03 > .astro-source-meta:nth-child(6) > a[href$="#pendeln/pendeln"]`, `.rad-photo-credit > a`, `#nachweis-rad-media-01 > a`.
**Reproduktion:** Prüfbaum, eigener Server, `node qa-rad13/rad13-a11y.mjs` → `a11y-probe.json` → `runs[].axe.violations`.
**Bewertung:** Kein Layout-, Funktions- oder Screenreader-Strukturfehler, aber ein AA-relevanter Verstoß (Level A) auf 7 von 12 geprüften Ansichten. Ursache liegt in `css/radiasthesie.css` (Metazeilen/Linkklassen ohne `text-decoration`).
**Empfehlung:** Unterstreichung für Links in Fließtext/Metazeilen (z. B. `.astro-source-meta a, .rad-photo-credit a { text-decoration: underline; text-underline-offset: .15em }`) oder Kontrast zum Umgebungstext auf ≥ 3:1 anheben; danach axe erneut laufen lassen.

### F2 — Foto-Varianten werden über ihre deklarierte Breite hinaus skaliert · **P3** · Bildauflösung
**Ort:** `radiasthesie/*.html` und SPA-Themenseiten, `<picture><source sizes="(max-width: 640px) 100vw, 520px">`.
**Ist:** Bei 768 und 1440 px Viewport rendert das Foto 680 CSS px breit, der Browser wählt wegen `sizes` aber die 520-px-Datei (`520/klassisches-pendel.avif`, `naturalWidth 520`) → 1,31-fache Hochskalierung. 12 Messungen (6 Fotos × SPA/statisch) in `browser-routes.json` (`findings[id=IMG-RES]`).
**Erwartet:** `sizes` beschreibt die tatsächliche Layoutbreite (≈ 680 px), sodass die 1040-px-Variante gewählt wird.
**Empfehlung:** `sizes="(max-width: 900px) 100vw, 680px"` (Wert an der realen Layoutbreite messen), danach Messung wiederholen.

### F3 — `og:image` fehlt weiterhin projektweit · **P3** · SEO/Social
In allen 8 geprüften Dokumenten kein `og:image`; `twitter:card` = `summary`. Aus RAD-12 bewusst offen gelassen, hier bestätigt (`static-probe.json`, Feld `ogImage`).

### F4 — axe-`color-contrast` „incomplete“ nicht abschließend geklärt · **offen** · Barrierefreiheit
Betroffen: dekorative Pfeil-Glyphen in `.textlink > span[aria-hidden]`, ausgegraute Buchstaben `.astro-letter.is-empty` und SVG-Text im Studio-Vorschau-SVG (`text[y="48"]`, `fill="#eae6dc"`). axe kann den Hintergrund nicht bestimmen; eine eigene Kontrastrechnung gegen den tatsächlichen Verlauf/SVG-Hintergrund wurde in diesem Lauf **nicht** durchgeführt. Kein Freigabehemmnis, aber als offener Prüfpunkt zu führen.

## 6. Urteil und Konsequenz

- **Keine kritischen (P1) Fehler.** Build, alle Suiten, alle Breiten, Konsole/Netz, Eingabesicherheit und Statistik sind belegt.
- **Ein P2-Befund (F1)** verhindert die Abnahme nach eigenem Maßstab „WCAG 2.2 AA, soweit anwendbar“: `link-in-text-block` auf 7 von 12 Ansichten.
- **Gesamturteil: NICHT ABGENOMMEN.** Nach Behebung von F1 (und nach Möglichkeit F2/F3) ist eine **erneute Abnahme** dieser Karte erforderlich; kein Gesamtabschluss vor RAD-14.
- Es wurde **keine** Implementierung durch den Reviewer vorgenommen; der Prüfbaum ist ein separater Worktree und enthält nur Bericht, Evidenz und Prüfskripte.

## 7. Nicht geprüft / Restrisiken

| Punkt | Grund | Restrisiko |
| --- | --- | --- |
| Lighthouse/Performance-Budgets | in diesem Lauf nicht ausgeführt (Werkzeug `@lhci/cli` vorhanden) | niedrig–mittel: Ladezeiten/CLS auf Mobilgerät unbelegt |
| Echter Screenreader (NVDA/JAWS/VoiceOver) | im Prüfumfeld nicht verfügbar | mittel: nur AX-Struktur, Namen, Fokus und Live-Regionen ersetzt geprüft; Ansagereihenfolge offen |
| Firefox/WebKit/Safari/iOS, Touch-Geräte | nur Chromium (Playwright) | mittel: Layout-/Fokusunterschiede in anderen Engines offen |
| Zweiter Playwright-Vollauf (Flake-Aussage zu B2) | Zeitbudget | niedrig: ein Lauf 147/147, B2-Test enthält Negativkontrolle |
| Journal-Exportinhalt | Export-Download im zweiten Lauf nicht ausgelöst (Pflichtfelder), Inhalt daher nicht zeilenweise geprüft | niedrig: XSS-Anzeige und Löschung sind belegt |
| Externe Quellen-Erreichbarkeit (HTTP/DOI) | in diesem Lauf nicht erneut abgefragt | niedrig: Daten und interne Verlinkung geprüft; externe Bot-Schutz-Codes unverändert möglich |
| SPA-Fehleransicht (B3) und unbekannter Kapitel-Slug (B11) | nicht Teil der automatisierten Sonden | niedrig: B3 im statischen Satz behoben, B11 dokumentiert |
| Inhaltliche Vollprüfung aller 32 Kapitel | Stichproben + Konsistenzregeln | mittel: Einzelaussagen können trotz sauberem Belegapparat abweichen |

## 8. Ausgeführte Befehle (Auszug, Prüfbaum `C:/Users/mas/Arbeit/esow-qa-rad13`)

```bash
git -C "C:/Users/mas/Arbeit/Esoterik-Welt" worktree add --detach "C:/Users/mas/Arbeit/esow-qa-rad13" 9bf5f73
cd "C:/Users/mas/Arbeit/esow-qa-rad13" && npm ci                      # 852 Pakete, Exit 0
npm run build && npm run lint && npm run format:check                  # je Exit 0
npm run test:unit && node --test tests/*.cjs|*.mjs (15 Suiten)        # 249 Tests, 0 Fehler
npm run build:local && node --test tests/offline-file.cjs             # 2/2
npm run verify:build                                                   # 36/36 + 7/7, 0 Fehler
CI=1 E2E_PORT=<frei> npx playwright test                               # 147 passed (2.1m)
node qa-rad13/rad13-static-probe.mjs                                   # 8 Dokumente, 1 offener Punkt (og:image)
node qa-rad13/rad13-browser-routes.mjs                                 # 80 Läufe, 0 Überlauf/Fehler
node qa-rad13/rad13-a11y.mjs                                           # axe 4.14.0, 12 Ansichten
node qa-rad13/rad13-functional.mjs; node qa-rad13/rad13-functional2.mjs # XSS/Import/Export/Statistik
```

## 9. Evidenzdateien

`evidence/static-probe.json`, `evidence/browser-routes.json`, `evidence/a11y-probe.json`, `evidence/functional-probe.json`, `evidence/functional-probe2.json`, `evidence/playwright-report.json`, `evidence/playwright.log`, `evidence/suites.tsv`, `evidence/log-*.txt` (21 Gate-Logs), `evidence/a11y-1440.log`, `evidence/browser-routes.log`, `scripts/` (alle sieben Sonden).
