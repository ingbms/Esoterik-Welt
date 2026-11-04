# QA-Bericht: Automatisches Seiten-Inhaltsverzeichnis (TOC-Pilot)

**Aufgabe:** Kanban `t_436eeffb` — unabhängige Verifikation gegen Spezifikation und Design
**Geprüfter Stand:** Commit `ea13948` (`af2cee4011ca7055ebd172f9d0e8590b61ac877a`), Basis `9d14d37`
**Pilot:** ausschließlich `/frequenzen/quellen.html` (29 Einträge)
**Prüfdatum:** 4. November 2026
**Ergebnis:** **51 von 55 Abnahmekriterien bestanden, 3 fehlgeschlagen, 1 nicht geprüft.
Keine Freigabe in der vorliegenden Form — ein funktionaler Defekt (D-1) blockiert die Abnahme.**

---

## 1. Prüfgegenstand, Fixierung und Umgebung

| Punkt | Wert |
|---|---|
| Arbeitskopie | `C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_436eeffb` |
| Branch/Commit | Prüfung auf `ea13948` (detached); QA-Nachweis als Commit auf `wt/t_436eeffb` direkt über `ea13948` (nur `docs/` + `evidence/`, keine Produktänderung) |
| Commit-Tree | `af2cee40…` (vor und nach allen Läufen unverändert) |
| Basis des Commits | `9d14d37` (Astro-Migrationsstand) |
| Verhältnis zu `main` | `main` (`9f58439`) ist **Vorfahre** von `ea13948` (Fast-Forward möglich, 16 Commits) |
| `origin/main` | `9f584397…`; `ea13948` ist **nicht gepusht** → kein PR-/Integrationsstatus |
| Build | `npm ci` + `npm run build`: 144 Seiten, 145 HTML-Dateien |
| Werkzeuge | Node 24.13.0, npm 11.8.0, Playwright 1.64.1 (Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2), Lighthouse 12.6.1, axe-core 4.14.0, Astro 7.4.5 |
| Host | Windows 11, Prüfung headless, static Server im selben Node-Prozess (Port 0, `no-store`) |

**Methode.** Alle Messungen stammen aus eigenen Prüfskripten, die unter
`docs/qa-velarkana-toc/skripte/` versioniert sind (von ESLint/Prettier ausgenommen, weil `docs/**`
in `eslint.config.cjs` und `.prettierignore` ignoriert wird; die Messwerte liegen unter
`evidence/qa-toc-436eeffb/`). Die Selbsttests des Implementierers (`npm run test:toc`, `verify:toc`,
`verify-browser`) wurden nur als Kreuzprobe ausgeführt (Ergebnis: 21/21, 18/18, 32/32), **nicht** als
Abnahmebeleg. Jede Aussage „unverändert/kein Regressionsbefund“ beruht auf einem eigenen
Vergleichsbuild von `9d14d37` ohne TOC (gleiche Werkzeuge, gleiche Messpunkte). Für den
Zeilenhash-Vergleich wurde der inhaltsabhängige CSS-Bundle-Name normalisiert
(`_astro/BaseLayout.<hash>.css`), weil die CSS-Änderung sonst alle 145 Seiten als „geändert“ erscheinen
lässt.

**Abgrenzung.** Keine Änderung am Produktcode. Angelegt wurden ausschließlich
`docs/qa-velarkana-toc/skripte/` (Prüfskripte; Fixtures werden zur Laufzeit in `dist/__qa__/` erzeugt)
und `evidence/qa-toc-436eeffb/` (Messwerte, Screenshots). Der Lauf der Implementierer-Suite hat
`evidence/velarkana-toc/browser-check.json` neu geschrieben; die Datei wurde auf `HEAD` zurückgesetzt.

---

## 2. Ergebnis je Abnahmekriterium

Legende: **✔** bestanden · **✘** fehlgeschlagen · **⚠** nicht bzw. nur teilweise geprüft

### A — Aktivierung und Abgrenzung

| Kriterium | Status | Beleg |
|---|---|---|
| AK-A1 genau ein `aside.page-toc` und ein `nav[aria-label="Inhaltsverzeichnis"]` | ✔ | DOM-Zählung 1440 (1/1) |
| AK-A2 keine TOC-Spuren auf den übrigen 144 Seiten; bestehende TOCs unverändert | ✔ | Hash-Vergleich Baseline↔Pilot: nur `frequenzen/quellen.html` abweichend; Radiästhesie-TOC 10 Links identisch |
| AK-A3 `TOC_DISABLED=1` → kein TOC, Build fehlerfrei | ✔ | eigener Notaus-Build: 145 HTML, 0 Seiten mit `page-toc` |
| AK-A4 ohne `headings` / unter `minHeadings` kein Markup | ✔ | Unit (`null` bei 0/2 Einträgen, auch bei `minHeadings:0`), Fixture `dynamic-min.html` (Aside entfernt sich) |
| AK-A5 Werkzeugseiten `/frequenzen/`, `labor`, `cymatics`, `meditation` ohne TOC | ✔ | Inventar aller 145 Dateien: 0 `page-toc` |

### B — Inhalt und Struktur

| Kriterium | Status | Beleg |
|---|---|---|
| AK-B1 exakt 29 Einträge | ✔ | 29 |
| AK-B2 Reihenfolge/Texte exakt nach §14.1 | ✔ | maschineller Soll/Ist-Vergleich: 0 Abweichungen (29/29) |
| AK-B3 `levels={[2]}` → 14 Einträge, alle h2 | ✔ | Unit-Test mit 14 h2 + 15 h3 |
| AK-B4 `levels={[2,3,4]}` → 29, kein Fehler | ✔ | Unit-Test (Bestand ohne h4) |
| AK-B5 h1/Footer/`sr-only` nicht enthalten | ✔ | DOM-Prüfung: 0 Treffer |
| AK-B6 h3 unter vorangehendem h2, kein Einrückungssprung, valide `ol`-Struktur | ✔ | 4 `ol`, 29 `li`, Tiefen 2/3, Sprünge 0; übersprungene Ebene (2→4) ergibt genau **eine** Stufe (Unit) |
| AK-B7 kein Eintrag abgeschnitten | ✔ | `scrollWidth ≤ clientWidth`, kein `text-overflow: ellipsis`; Volltexte = Überschriftentexte |
| AK-B8 `/404.html` und `/frequenzen/labor.html` ohne TOC/leere `aside` | ✔ (mit Hinweis) | beide ohne `page-toc`; die Komponente ist dort nicht eingebunden, der Leerzustand wurde über Unit + `dynamic-min` geprüft |

### C — Anker und Slugs

| Kriterium | Status | Beleg |
|---|---|---|
| AK-C1 alle 29 Fragmente lösen zu genau einem Element auf | ✔ | 29/29, Duplikate 0 |
| AK-C2 IDs vor/nach identisch (byte-gleich) | ✔ | Baseline-IDs = Pilot-IDs (29/29, Typ und Reihenfolge) |
| AK-C3 Slug-Testvektoren §14.3 | ✔ | 8/8 Vektoren (inkl. `6-einzelprüfungen`, `51-physikalisch--physiologisch`, `612-…-174285963-hz`) |
| AK-C4 Duplikate → `…`, `…-1`, `…-2`, keine doppelte ID | ✔ | Unit + SSR-Fixture mit drei gleichen Überschriften (drei eigene Ziele, drei verschiedene Dokumentpositionen) |
| AK-C5 fehlende IDs deterministisch und link-/zielgleich | ✔ | `dynamic`-Fixture: 5 IDs erzeugt, Link=Ziel, keine Duplikate; zwei Builds byte-identisch |
| AK-C6 prozentkodierter und roher Hash gleich | ✔ | `#6-einzelpr%C3%BCfungen` vs. `#6-einzelprüfungen`: gleiche Position, gleicher aktiver Eintrag; zusätzlich Umlaut-Fixture |
| AK-C7 Überschrift nur aus Satzzeichen → `abschnitt-<n>` | ✔ | Unit: `abschnitt-1`, `abschnitt-2` |

### D — Scroll-Spy und Navigation

| Kriterium | Status | Beleg |
|---|---|---|
| AK-D1 höchstens ein `aria-current` | ✔ | nach Laden, nach Scroll, nach Klick, nach Deep-Link je genau 1; DOM und AX-Baum konsistent |
| AK-D2 ohne Hash erster Eintrag aktiv | ✔ | aktiv = erster `href` |
| AK-D3 Scrollen abwärts/aufwärts markiert Abschnitt *k* | ✘ | Desktop 1440: 3/3 Stichproben + Zwischenposition korrekt. **< 1200 px bei geöffnetem Panel: Seite springt zum Verzeichnis zurück, Markierung fällt auf Eintrag 1** → Defekt **D-1** |
| AK-D4 Dokumentende → letzter Eintrag | ✔ | letzter Eintrag aktiv |
| AK-D5 Deep-Link: Ziel in `[header+4, header+40]`, sofort aktiv | ✔ | 1440: top 115,6 bei header 100; 390: top 100 bei header 84; aktiv sofort |
| AK-D6 `hashchange` ohne Reload | ✔ | echter `location.hash`-Wechsel aktualisiert Markierung |

### E — Layout, Sticky, Mobil, Druck

| Kriterium | Status | Beleg |
|---|---|---|
| AK-E1 1440: Sidebar 240–280, Prose 718–722, Abstand ≥ 32 | ✔ | 260 / 720 / 252 px |
| AK-E2 Sticky-Abstand = header + 24 ± 2, nicht gestreckt | ✔ | top 124 bei header 100; Höhe 703 px statt Layout 22.219 px; `position: sticky`, `align-self: start` |
| AK-E3 Höhe im Budget, eigener Scrollbereich, letzter Eintrag per Tastatur | ✔ | 703 ≤ 704; Body 670/1322 `overflow-y:auto`; letzter Link fokussierbar und sichtbar |
| AK-E4 390: TOC über Artikel, geschlossen (JS), Summary ≥ 44 | ✔ | asideTop 557,5 < proseTop 625,5; `details.open=false`; Summary 44 px |
| AK-E5 390: kein **zusätzlicher** Überlauf | ✔ | `scrollWidth` 540 in Baseline **und** Pilot (vorbestehend, R-1); TOC-intern kein Überlauf |
| AK-E6 Umschaltung genau bei 1200, keine Überlappung | ✔ | 1200: Sidebar rechts (`sideBySide`), 1199/1024: Block oben; kein Überlauf |
| AK-E7 320 px und 200 % Zoom bedienbar, kein Clipping | ✔ (simuliert) | 320 px und 160 px CSS-Breite: `clipped=false`, kein TOC-Überlauf; echter Browser-Zoom nicht geprüft |
| AK-E8 Druck: TOC ausgeblendet | ✔ | `display:none` in Print-Emulation |
| AK-E9 TOC überdeckt Header nicht | ✔ | top 124 > headerBottom 101; `z-index 0` < Header |

### F — Barrierefreiheit

| Kriterium | Status | Beleg |
|---|---|---|
| AK-F1 genau ein Navigations-Landmark „Inhaltsverzeichnis“ | ✔ | DOM 1; AX-Baum: `navigation` = „Inhaltsverzeichnis“ (neben Haupt-/Brotkrümel-/Bereichsnavigation) |
| AK-F2 Listen-Semantik `ol > li > a`, keine Rollen-Ersetzung | ✔ | 4 `ol`, 29 `li`, 29 `a`, kein `role`-Override; AX-Baum identisch |
| AK-F3 Tab erreicht Summary und alle 29 Links; Enter/Space; Fokusring ≥ 2 px, ≥ 3:1 | ✔ | Desktop: 29 Links in Dokumentreihenfolge; Mobil: Summary per Tab, Enter öffnet, Space schließt; Ring 2 px, Kontrast 15,36:1 |
| AK-F4 Kontrast Linktext/aktiv/Fokus ≥ 4,5 bzw. 3:1 (Dark/Light) | ✔ | Dark: 10,07 (normal), 13,67 (aktiv), 10,07 (Titel); Light-Reserve: 7,22 / 14,31; Ring 15,36 |
| AK-F5 `prefers-reduced-motion` → `scroll-behavior: auto`, keine erzwungene Bewegung | ✔ | `auto`, Übergänge < 0,01 s |
| AK-F6 Summary ≥ 44, Links ≥ 24 (fein) / ≥ 44 (grob) | ✔ | Summary 44; Desktop-Links 32; Touch-Links 44–60,6 |
| AK-F7 Screenreader-Grundprüfung (Landmark, Liste, aktueller Eintrag, keine Doppellabels) | ⚠ | AX-Baum belegt Landmark/Liste/Namen; **kein echter Screenreader-Lauf** (TF-22 bleibt offen). Zusatzbefund **D-2** |

### G — No-JS

| Kriterium | Status | Beleg |
|---|---|---|
| AK-G1 ohne JS alle 29 Links im HTML | ✔ | 29 |
| AK-G2 ohne JS navigieren alle Links, Ziel unter dem Header | ✔ | 3 Stichproben Desktop + 1 Mobil: Ziel unter Header, sichtbar |
| AK-G3 ohne JS öffnet/schließt das Summary nativ | ✔ | offen → zu → offen |
| AK-G4 ohne JS kein `aria-current` im TOC | ✔ | 0 (die 3 `aria-current` der Seite sind Brotkrümel/Bereichsnavigation, unverändert) |

### H — Build, Budgets, Performance, Regression

| Kriterium | Status | Beleg |
|---|---|---|
| AK-H1 Build/`astro check`/`lint`/`format:check` grün; 144 Seiten/145 HTML | ✔ | 145 HTML; check 0 Fehler/0 Warnungen/20 Hinweise; ESLint und Prettier über alle **versionierten** Dateien grün (eigene untracked Prüfdateien ausgenommen) |
| AK-H2 JS ≤ 5 KB gzip, CSS ≤ 1,5 KB gzip, 0 externe Requests | ✔ | TOC-Skript 4.509 B roh / **2.018 B gzip**; CSS **+700 B gzip**; dynamischer Chunk 4.683 B gzip **nicht geladen**; 0 externe Requests |
| AK-H3 CLS 0, kein sichtbarer Sprung | ✘ | In-Page-CLS **0,0763** (Median aus 5 Läufen; Baseline 0,0632), Lighthouse-CLS 0,094 (Baseline 0,076). Ursache Font-Swap (#text/NAV auch in der Baseline), TOC-Anteil ≈ 0,013; kein Sprung der Artikelspalte. Mobil (390) CLS 0 → Abweichung **D-3** |
| AK-H4 Lighthouse Accessibility 1,0, Performance ≥ Baseline − 2, 0 Konsolenfehler | ✘ | Accessibility **0,91** (Baseline 0,91) — zwei **vorbestehende** Befunde (`color-contrast` in `pre code`, `link-in-text-block` in `article ol`), kein TOC-Befund; Performance 0,53 (Baseline 0,54); 0 Konsolenfehler → Abweichung **D-4** |
| AK-H5 andere Seiten unverändert | ✔ | 144/145 Dateien hashgleich; Radiästhesie-TOC 10 Links; `farbwelten/index` unverändert (inkl. vorbestehender doppelter `entries-title`-ID) |
| AK-H6 keine doppelte ID / kein doppeltes `nav`-Label | ✔ | 0 doppelte IDs, genau ein TOC-Nav-Label |

### I — Dynamik

| Kriterium | Status | Beleg |
|---|---|---|
| AK-I1 `dynamic`: Liste aus DOM, fehlende IDs nach §6.3, keine Duplikate | ✔ (Fixture) | eigener Fixture-Lauf mit gebündeltem `src/scripts/toc.ts`: 5 Einträge, 5 erzeugte IDs, link=ziel, keine Duplikate |
| AK-I2 ohne `dynamic` und ohne `headings` kein TOC/kein Fehler | ✔ | Unit + `dynamic-min`-Fixture (2 Überschriften → Aside entfernt) |
| AK-I3 `dynamic` auf der Pilotseite nicht aktiv | ✔ | kein `data-toc-dynamic` im HTML; Chunk wird nicht geladen |

---

## 3. Defekte und Abweichungen

### D-1 — Scroll-Sprung zum Verzeichnis bei < 1200 px mit geöffnetem Panel
**Schweregrad: hoch (funktional, blockierend für die Abnahme)**

* **Reproduktion** (Chromium 156, Firefox 157, WebKit 27.2; Viewport 390×844 oder 1199×900):
  1. `/frequenzen/quellen.html` laden, Summary antippen → Panel offen.
  2. Seite nach unten scrollen (z. B. auf 29.812 px, Abschnitt „6.7 432 Hz“).
  3. Beobachtung: Die Seite springt sofort auf ≈ 501 px (390) bzw. ≈ 376 px (1199) zurück — die
     Position des Verzeichnisblocks —, und `aria-current` fällt auf den **ersten** Eintrag.
* **Erwartet:** Die Seite bleibt an der Scrollposition; der zum Abschnitt gehörende Eintrag ist aktiv (AK-D3).
* **Ursache:** `src/scripts/toc.ts`, `setActive()`: Liegt der aktive Eintrag außerhalb des inneren
  Scrollbereichs (`[data-toc-body]`), wird `activeLink.scrollIntoView({block:'nearest'})` aufgerufen.
  `scrollIntoView` scrollt **auch das Fenster**, weil das Verzeichnis bei < 1200 px im normalen Fluss
  oberhalb des Artikels steht und aus dem Sichtfeld gescrollt ist. Desktop ist nicht betroffen
  (Rail ist `position: sticky`, bleibt sichtbar).
* **Nachweis:** `evidence/qa-toc-436eeffb/defect-scrolljump.json` — identischer Ablauf mit
  gestubbter `scrollIntoView`-Methode: Position bleibt (29.812), Markierung korrekt
  (`#67-432-hz-…`), genau 1 Aufruf. Ohne Stub: Rücksprung 29.311 px (390) bzw. 29.436 px (1199),
  Markierung falsch. In allen drei Engines reproduziert (`…/mobile-cls-deeplink.json`,
  `crossbrowser.json`).
* **Warum die Implementierer-Suite das nicht findet:** `verify-browser.mjs` prüft Mobil nur den
  Klickpfad (Panel schließt vor dem Sprung). Der Fall „Panel offen + Seitenscrollung“ fehlt.
* **Behebungsrichtung (nicht Teil dieses Auftrags):** ausschließlich den inneren Container scrollen
  (`body.scrollTop = …`) statt `Element.scrollIntoView`, oder `scrollIntoView` nur zulassen, wenn
  das Verzeichnis die aktive Zeile tatsächlich verdeckt; danach gezielter Retest.

### D-2 — Dekoratives Zeichen im zugänglichen Namen des Aufklappers
**Schweregrad: gering (A11y-Qualität, kein WCAG-Verstoß nach axe)**

* Mobil heißt der Disclosure-Knopf im AX-Baum „AUF DIESER SEITE +“ (geschlossen) bzw.
  „AUF DIESER SEITE –“ (offen): das per `::after` erzeugte Plus/Minus wird in den Namen gerechnet
  und ändert ihn mit dem Zustand. Screenreader lesen damit ein Zustandszeichen als Teil des Labels.
* Beleg: `a11y-extra.json`, `browser-desktop.json` (AX-Name).
* Empfehlung: Symbol als `<span aria-hidden="true">` ausgeben oder `aria-label="Inhaltsverzeichnis"`/
  statischen Namen am `summary` setzen.

### D-3 — CLS nicht 0 (Abweichung von AK-H3)
**Schweregrad: gering**

* In-Page: 0,0763 (Pilot) vs. 0,0632 (Baseline) — reproduzierbar (5 Läufe je Build).
  Lighthouse: 0,094–0,129 vs. 0,076.
* Quellen der Verschiebung: Textknoten und die Hauptnavigation der Seite (Font-Swap Manrope/Fraunces),
  im Piloten zusätzlich zwei `H2`. Die Artikelspalte und die Sidebar selbst springen nicht; die
  Sidebar-Breite ist reserviert.
* Bewertung: überwiegend vorbestehend; der TOC-Anteil (~0,013) entsteht durch die Höhenänderung des
  Verzeichnisses nach Font-Load innerhalb der gemeinsamen Rasterzeile. Mobil ist CLS 0.

### D-4 — Lighthouse-Accessibility 0,91 statt 1,0 (Abweichung von AK-H4)
**Schweregrad: gering, vorbestehend**

* Zwei Befunde im Artikel selbst, in Baseline und Pilot identisch:
  `color-contrast` in `pre.astro-code` (Syntaxhervorhebung) und `link-in-text-block` für
  `article.prose ol li a` (WCAG 1.4.1). Kein Befund im TOC-Teilbaum (axe über `.page-toc` an
  1440 px sowie 390 px zu/offen: 0 Verstöße). Performance 0,53 vs. Baseline 0,54 (Rauschen).

### Prüflücken (keine Defekte)

| Lücke | Konsequenz |
|---|---|
| Echter Screenreader-Lauf (NVDA/VoiceOver) fehlt | AK-F7 bleibt „nicht geprüft“; AX-Baum belegt nur Rollen/Namen/Struktur, nicht Aussprache/Ansagereihenfolge |
| `aria-current` ist in Chromium-CDP nicht als AX-Property auslesbar | Exposition im AX-Baum nicht belegbar (DOM-Attribut korrekt) |
| Safari/iOS nicht getestet; WebKit läuft unter Windows | WebKit-Smoke bestanden, ist aber kein Safari-Ersatz; echtes Touch-Gerät fehlt |
| 200 % Zoom über 160 px CSS-Viewport simuliert | kein echter Browser-Zoom/keine OS-Skalierung geprüft |
| `dynamic` nur gegen Fixture geprüft | auf keiner Produktivseite aktiv (bewusst, D-2 der Spezifikation) |

---

## 4. Positiv belegte Kernpunkte

* **Abgrenzung sauber:** Von 145 HTML-Dateien unterscheidet sich nur `frequenzen/quellen.html`
  (hashnormalisiert). Alle Überschriften-IDs der Pilotseite sind vor/nach identisch (29/29).
* **Zwei Builds byte-identisch** (gleiche CSS-/JS-Hashes) → deterministisch.
* **Notaus funktioniert:** `TOC_DISABLED=1` entfernt das TOC vollständig, Build bleibt bei 144 Seiten.
* **Budgets eingehalten:** +700 B CSS gzip, 2.018 B JS gzip, dynamischer Chunk (4.683 B) nicht geladen,
  0 externe Requests, 0 Konsolenfehler.
* **Layout messgenau:** Rail 260 px, Prose 720 px, Abstand 252 px, Sticky-Top 124 px, Höhe 703 px
  (Budget 704), Umschaltung exakt bei 1200 px.
* **Anker-Navigation vollständig:** 29/29 Anker, Klick/Deep-Link/Hash-Wechsel, Umlaute roh und
  prozentkodiert, Fokus auf dem Ziel.
* **No-JS vollständig:** 29 Links, natives Auf-/Zuklappen, korrekte Sprünge, kein `aria-current`.
* **Tastatur und Kontrast:** 29 Links in Reihenfolge, Summary per Enter/Space, Ring 2 px/15,36:1,
  Textkontraste 10,07–14,31:1.
* **Cross-Browser-Smoke:** Firefox 157 und WebKit 27.2 zeigen dieselben Messwerte (Rail 260,
  Sticky 124, Klickziel 116), keine Konsolenfehler.

---

## 5. Freigabeempfehlung

**Keine Freigabe (Ablehnung) in der vorliegenden Form.**

Begründung: AK-D3 ist auf allen Viewports < 1200 px reproduzierbar verletzt, sobald das Panel
geöffnet bleibt und der Nutzer scrollt (D-1). Der Fehler ist in drei Engines reproduziert, die
Ursache ist lokalisiert und die Behebung klein. Alles Übrige ist bestanden oder als vorbestehende,
dokumentierte Abweichung eingeordnet.

**Bedingungen für eine Freigabe:**

1. **D-1 beheben** (Pflicht) und mit dem Szenario „Panel offen + Seitenscrollung“ bei 390/1024/1199 px
   nachweisen; Retest durch QA.
2. **D-2 beheben** (empfohlen, geringer Aufwand, gleiche Komponente).
3. **D-3/D-4** können als vorbestehende Abweichungen akzeptiert werden, wenn der Auftraggeber CLS 0,076
   und Accessibility 0,91 (statt 1,0) ausdrücklich billigt; andernfalls sind es eigene, vom TOC
   unabhängige Aufgaben (Font-Swap bzw. Artikel-Kontraste/Unterstreichung).
4. **Restrisiken** vor einer Veröffentlichung klären: echter Screenreader-Lauf, Safari/iOS.

**Integrationshinweis:** `ea13948` ist lokal; `main` (`9f58439`) ist Vorfahre, ein Fast-Forward wäre
möglich, `origin` kennt den Astro-Zweig nicht. Veröffentlichung ist nicht Teil dieses Auftrags.

---

## 6. Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_436eeffb
git checkout ea13948 && npm ci && npm run build
cd docs/qa-velarkana-toc/skripte

# eigene Prüfungen
node checks-static.mjs pilot
node checks-unit.mjs
node build-fixtures.mjs && node checks-fixtures.mjs
node checks-browser.mjs
node checks-nojs.mjs
node checks-a11y-extra.mjs
node checks-crossbrowser.mjs
node defect-scrolljump.mjs
node cls-repeat.mjs pilot 5
node manifest.mjs pilot && node baseline-probe.mjs pilot
node lighthouse.mjs pilot

# Vergleichsbuild ohne TOC
git checkout 9d14d37 && npm run build
cd docs/qa-velarkana-toc/skripte
node manifest.mjs baseline && node baseline-probe.mjs baseline
node lighthouse.mjs baseline && node compare.mjs
```

---

## 7. Evidenz

| Datei | Inhalt |
|---|---|
| `docs/qa-velarkana-toc/skripte/` | alle Prüfskripte (reproduzierbar, von Lint/Format ausgenommen) |
| `static-inventory-pilot.json` / `-baseline.json` | Inventar aller 145 HTML-Dateien, Überschriften, doppelte IDs, bestehende TOCs |
| `static-summary-pilot.json` / `-baseline.json` | Soll/Ist-Vergleich der 29 Einträge, Leerzustände, Radiästhesie, Farbwelten |
| `unit.json` / `unit-disabled.json` | 12 Logikprüfungen (Slugs, Duplikate, Ebenen, Escaping, Schalter) |
| `fixtures.json` / `fixtures-result.json` | Fixtures für Duplikate, Umlaute, Sonderzeichen, `dynamic`; 11 Prüfungen |
| `browser-desktop.json` / `browser-mobile.json` | 44 Browserprüfungen (Layout, Sticky, Scroll-Spy, Tastatur, Kontrast, axe, AX) |
| `nojs.json` | 6 No-JS-Prüfungen |
| `a11y-extra.json` | Fokusring, axe 390 px (zu/offen), 1024 px, AX-Name des Summary |
| `crossbrowser.json` | Firefox- und WebKit-Smoke |
| `defect-scrolljump.json` | Nachweis D-1 mit/ohne gestubbte `scrollIntoView` |
| `mobile-cls-deeplink.json` | Mobil-CLS (0) und Deep-Link-Landeposition |
| `cls-pilot.json` / `cls-baseline.json` | CLS-Wiederholungsmessung (5 Läufe je Build) mit Quellen |
| `lighthouse-pilot.json` / `lighthouse-baseline.json` | Lighthouse 12.6.1 (Desktop-Preset), Scores/Befunde |
| `manifest-pilot.json` / `-pilot2.json` / `-baseline.json` + `compare.json` | Determinismus, Seitenvergleich, Budgets |
| `baseline-probe-pilot.json` / `-baseline.json` | axe-Verstöße, Überlauf, CLS, TOC-Zählung je Build |
| `*.png` | Screenshots 1440/1200/1199/1024/390/320/160, No-JS, Fixtures, Firefox/WebKit |
