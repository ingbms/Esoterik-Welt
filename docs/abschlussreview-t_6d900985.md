# Abschlussreview t_6d900985 — Esoterik-Welt (visuell, Links, Vollständigkeit, Stil)

**Karte:** t_6d900985 · **Profil:** design_critique · **Scope:** ausschließlich `C:/Users/mas/Arbeit/Esoterik-Welt` (nicht das Router-Repo)
**Erstellt:** 2026-11-01, Messfenster 16:21–16:35 UTC (17:21–17:35 lokal) · **Modellroute dieses Laufs:** deepseek/deepseek-flash
**Rolle dieses Dokuments:** Konsolidierung der Teilkarten t_4977995f, t_c0ac2da9, t_ddfe7b03, t_befcdea7. **Keine** Produkt-, Design- oder Release-Freigabe; das positive technische Gate ist t_676d2563, die Veröffentlichung t_32e80593.

---

## 1. Geprüfter Stand und Reproduzierbarkeit

| Punkt | Wert |
|---|---|
| Geprüfter Build | `dist/Esoterik-Welt`, gebaut 2026-11-01 17:15 lokal (16:15 UTC) |
| Snapshot | eingefrorene Kopie unter `<scratch>/t_6d900985-snap/Esoterik-Welt` (47 Dateien) |
| Snapshot-Hashes | `index.html deeb68c3…`, `css/main.css e09858da…`, `js/main.js 44c493b1…`, `sitemap.xml e308c8bd…`, `js/modules/crystals.js 35761ba8…`, `js/modules/blog.js 81c14a1e…` |
| Stabilität | `dist`-Hashes vor und nach allen Messungen identisch → Befunde sind nicht durch Parallelarbeit an `dist` verfälscht |
| Browser | Chromium 156.0.8078.4 (Playwright), Viewports 375/768/1440 × 900, `reducedMotion: no-preference`, Service Worker blockiert, HTTP-Preview **und** echtes `file://` |
| Skripte (nachprüfbar) | `evidence/t_6d900985/recheck.cjs`, `recheck2.cjs`, `recheck3.cjs`, `recheck4.cjs`, `recheck5.cjs`, `recheck6.cjs`, `recheck7.cjs`, `recheck8.cjs`, `production-check.cjs` |
| Rohdaten | `recheck-results.json`, `recheck-detail.json`, `recheck-coldstart-dialogs.json`, `recheck-focus-return.json`, `recheck-structure.json`, `recheck-offline-legal.json`, `recheck-wrap.json`, `recheck-contrast-elements.json`, `production-check.json` |
| Screenshots | 54 echte Browser-PNGs in `evidence/t_6d900985/`, davon 32 in diesem Lauf neu erzeugt (u. a. `recheck-http-blog-1-375.png`, `recheck-http-home-skip-after-375.png`, `recheck2-http-crystal-modal-375.png`, `recheck3-file-blog-cold-375.png`, `production-blog-1-375.png`) |

**Produktdateien wurden von mir nicht verändert.** `git status` zeigt vor und nach dem Lauf dieselben 17 `M`-Einträge und dieselben `D`-Einträge; meine Schreibvorgänge liegen ausschließlich unter `evidence/t_6d900985/` und in dieser Datei. Die uncommitteten Änderungen stammen aus t_ddfe7b03/t_44b8b6dd/t_9ff78898 und wurden erhalten. Parallel angelegt (nicht von mir) ist inzwischen `docs/tarot-deck-nachtatelier/`.

## 2. Lokaler Stand vs. Produktion (sauber getrennt)

* `HEAD` = `24d8053ebc1bc4438a35a1c5…` = `origin/main` = veröffentlichte GitHub-Pages-Version.
* Live `css/main.css`: SHA-256 `9247de56…` — lokal/`dist`: `e09858da…`. **Kein lokaler Fix ist veröffentlicht.**
* Live nachgeprüft am 2026-11-01 16:30 UTC: `#blog/1` leer, unbekannte Route leer, Skip-Link→`#main` leer, Sitemap falsche Origin, 3 Footer-`href="#"`, `assets/og-preview.png` 404, „Mehr laden“ vorhanden.
  → **Diese Defekte sind heute für Nutzer live erlebbar**, nicht nur lokal-theoretisch.

## 3. Ergebnis in einem Satz

Der lokale Reparaturstand ist gegenüber der Ausgangslage deutlich verbessert (M6, M7, N5, N6, Karten-Overflow und Dialog-Tastaturbedienung sind unabhängig als bestanden reproduziert), aber **nicht releasefähig**: ein SPA-Router-Komplex (Artikel-Deep-Links, Skip-Link, unbekannte Routen) und die Sitemap sind weiterhin defekt — jeweils auch in der aktuellen Produktion. 0 Critical, **3 Major offen**, 8 Minor offen; 1 Rest (N3 Bildsprache) ist per QA-Karte ausdrücklich zulässig.

## 4. Unabhängig als BESTANDEN nachgewiesen (Nachher-Stand)

| Prüfung | Messung | Ergebnis |
|---|---|---|
| M6 Kristalldialog Bild/Text | 375/768/1440 × HTTP/Datei, Rechtecküberschneidung Bild↔Info = `0.00 × 0.00` in 6/6; Dialog öffnet (`hidden=false`, `.open`), Fokus im Dialog, Escape schließt | **bestanden** |
| M7 Kalter Datei-/Deep-Link-Start | 5 Routen (#blog/#crystals/#runes/#tarot/#moon) × HTTP/Datei × 3 Breiten = 30/30: `scrollY = 0`, kein Titel unter dem Sticky-Header (`hiddenPx = 0`) | **bestanden** |
| V01/V02 Karten-Innenoverflow | 142 Karten × 4 Läufe (HTTP/Datei × 375/1440): 0 Karten mit innerem oder äußerem Overflow | **bestanden** |
| N5 Wortumbrüche 375 px | alle 78 Tarotnamen: 0 Einzel-/Zweizeichenzeilen; Rechtsseiten-Titel brechen am weichen Trennzeichen (`Datenschutz|erklärung`), `hyphens: auto` | **bestanden** |
| N6 Artikel-Auszeichnung | 4/4: kein rohes `##`/`**` mehr, 2 Listen, semantische Überschriften, Titel genau 1× (vorher doppelt), `aria-labelledby="articleModalTitle"` | **bestanden** |
| Dialog-Tastatur (Tarot/Runen/Kristalle) | 6/6 (HTTP/Datei): Enter öffnet, 4× Tab bleibt im Dialog, 2× Shift+Tab bleibt im Dialog, Escape schließt, **Fokus kehrt zum Auslöser zurück**, `inert` vollständig zurückgesetzt, `body.overflow` wiederhergestellt | **bestanden** |
| Kontrast (dark, gemessen) | composited über echte Vorfahrenflächen, Gradienten farbstop-weise: Titel 16.04, Kartentext 7.45, Untertitel 7.77, Badges 10.04, Nav 7.57, Sekundärbutton 7.60, **Minimum 5.01** (CTA `#0a0512` auf `#bb86fc→#9a5cf5`) | **AA bestanden** (kein AAA-Anspruch) |
| Hauptseiten 375/768/1440 | 18/18 Ansichten korrekt aktiv, kein Dokument-Overflow, Hintergrund `rgb(10,5,18)`, Cinzel+Inter tatsächlich geladen (`document.fonts.check`) | **bestanden** |
| Kataloge vollständig | 78 Tarotkarten, 30 Kristalle, 24 Runen, 10 Artikel in allen Breiten | **bestanden** |
| Mobile Navigation | Toggle vorhanden, öffnet (6 Links klickbar), `aria-expanded` true→false | **bestanden** |
| Doppelte IDs / Alt-Texte | 0 doppelte IDs auf 6 Ansichten; 0 Bilder ohne Alt (Karten nutzen derzeit keine `<img>`) | **bestanden** |
| `aria-current` | pro Route korrekt gesetzt (`Tarot:page`, `Kristalle:page`, …) | **bestanden** |

## 5. Offene technische Mängel (lokal **und** live)

### Major

**M8a — Artikel-Deep-Links `#blog/1`…`#blog/10` zeigen eine leere Seite.**
20/20 Kaltaufrufe (HTTP `/Esoterik-Welt/` und echtes `file://…/index.html→Lokal.html`) bei 375 px: `activePages = []`, `#articleModal` nicht geöffnet, Fließtext im `main` = 0 Zeichen. Sichtbeleg `recheck-http-blog-1-375.png` zeigt nur Header und Footer — die Bildsicht beschreibt diesen Footer irrtümlich als „volle Navigation“; maßgeblich ist die DOM-Messung (`main`-Text 0, `main`-Höhe 0). Live identisch (`production-blog-1-375.png`).

**M8b — Skip-Link zerstört den Seiteninhalt.**
`.skip-link` fokussiert (verifiziert: `a.skip-link|#main`), echte **Enter**-Taste → URL `…/#main`, alle `.page` `hidden`, `main`-Höhe 0, `main`-Text 0. 6/6: home/blog/crystals × HTTP/Datei. Ursache: der Hash-Router behandelt `main` als Seiten-ID. Live identisch.

**M8c — Unbekannte Hashes lassen die Seite leer.**
`#unbekannte-route-xyz` → 2/2 lokal, 1/1 live: alle Seiten `hidden`, kein Fehler-/Rückweg. Kein horizontaler Overflow, deshalb alte grüne Tests kein Gegenbeweis.

**M9 — Sitemap mit falscher Origin (17/17).**
`dist/sitemap.xml` und `sitemap.xml`: alle 17 `<loc>` zeigen `https://esoterik-welt.github.io/…`; korrekte Basis ist `https://ingbms.github.io/Esoterik-Welt/`. **0/17 richtig**, 16 davon sind Fragment-Einträge (`#tarot`, `#blog/1`…), nur **1** tatsächlich crawlbares Dokument. `robots.txt` verweist mit derselben falschen Origin auf `sitemap.xml`. Live identisch (live-sitemap geprüft).

### Minor

**L1** Footer „Einsteiger-Guide“, „Glossar“, „Quellen“ sind `href="#"` (3 Platzhalter; live identisch).
**L2** „Mehr laden“ fügt nichts hinzu: 10 → 10 Artikel, 0 neue IDs, 4/4 Läufe (HTTP/Datei × 375/1440); Button bleibt sichtbar, obwohl alle vorhandenen Artikel angezeigt sind.
**L3** `assets/og-preview.png` → 404, wird aber von `og:image` und `twitter:image` referenziert (lokal **und** live).
**N7 (neu)** Rechtsseiten als **rohe** Datei per Doppelklick sind ungestylt: `impressum.html`, `datenschutz.html`, `haftung.html` haben `<base href="/Esoterik-Welt/">`, was unter `file://` zu `file:///C:/Esoterik-Welt/css/…` führt → Times New Roman, transparenter Hintergrund, Rücklinks zeigen auf ein nicht existierendes Verzeichnis. Die generierten `Lokal-*.html` sind korrekt gestylt (`rgb(10,5,18)`, Inter) und verlinken auf `Lokal.html`. `index.html` hat den `file:`-Redirect, die Rechtsseiten nicht. Über HTTP sind alle drei Seiten und ihre Rücklinks fehlerfrei (3/3, 200).
**N8 (neu)** Pro Ansicht fehlt eine `h1`: `h1` im Dokument = 1, aber nur im versteckten `#home`; für tarot/crystals/moon/runes/blog ist `h1` in der aktiven Ansicht = 0 (Titel sind `h2`). Zusätzlich bleibt `document.title` (und Meta-Description/OG) auf allen 6 Ansichten identisch.
**N10 (neu)** `[data-theme="light"]` ist im Design-System definiert (12 Tokens, erzwungen korrekt: `rgb(248,245,252)`), aber **kein** HTML/JS setzt je `data-theme` — die Light-Variante ist toter CSS-Zustand ohne UI-Zugang. Kontrastaussagen „für Light“ beziehen sich damit auf einen für Nutzer nicht erreichbaren Zustand.
**N11 (neu)** Hierarchie-Inversion zwischen Dokumenttypen: Rechtsseiten-`h1` 22.5 px bei 375 px, Abschnitts-`h2` der Hauptseiten 33.75 px, Startseiten-`h1` 56 px (Desktop 56/40/18 px).
**N12 (neu)** Leeres `pages/`-Verzeichnis im Repo (0 Dateien); zusätzlich leeres `articles/` neben `data/articles/`.
**N13** Breiter Jest-Lauf (`node node_modules/jest/bin/jest.js --runInBand`, Exit 1) scheitert an 7 unveränderten Playwright-ESM-Specs (Discovery-Konflikt, vorbestehend); `node --test tests/pages-regression.cjs` = 6/6 grün.

### Ausdrücklich zulässiger Rest

**N3 — Bildsprache:** Karten nutzen keine `<img>`, sondern Symbol-/Emoji-Altbilder (Bildsicht: im Kristalldialog ein generisches violettes Herz statt einer Amethyst-Illustration). Das ist laut t_676d2563 der **erlaubte** Rest; die Nachtatelier-/Deck-Pipeline ist separat genehmigt und **nicht** Teil dieses Reviews.

## 6. Korrekturen an den Elternbefunden (unabhängig nachgeprüft)

| Behauptung | Prüfung | Ergebnis |
|---|---|---|
| t_4977995f: „Fehlende Assets `crystals.json`, `moon-phases.js`“ | `data/crystals.json`, `data/moon-phases.js`, `js/modules/moon.js` → HTTP 200; 30 Kristallkarten rendern, Dialog öffnet | **widerlegt** — die 404 stammten aus falschen Pfad-Probes (`js/data/…`) |
| t_4977995f: „16/17 Sitemap-URLs unerreichbar“ | Origin-Auswertung aller 17 `<loc>` | **präzisiert:** 17/17 falsche Origin, 16 Fragment-Einträge, 1 Dokument |
| t_4977995f: „Absolute Pfade in rechtlichen Seiten brechen“ | HTTP 3/3 Seiten + Rücklinks 200; `file://` rohe Datei ungestylt, `Lokal-*` korrekt | **nur für rohe `file://`-Datei zutreffend** → als N7 neu gefasst |
| t_4977995f: „Kristall-Dialog FAIL (fehlende Daten)“ | 6/6 Dialoge öffnen mit Bild + Infos | **widerlegt** |
| t_c0ac2da9: V01/V02 Kartenüberlauf | 0/142 Karten | **behoben** |
| t_c0ac2da9: V03 Runendialog-Clipping, V04 Aufbaushift | Runendialog: Fokus/Tab/Escape/Restore 2/2 grün, kein Clipping gemessen; V04 als Shift-Summe kein CLS | **V03 nicht reproduziert**, V04 bleibt Messgröße ohne Normbezug |
| t_befcdea7: Kontrast dark_min 8.526 | eigene gradientenbewusste Messung: Minimum **5.01** (CTA) | **Methodendifferenz, keine Regression** — beide ≥ AA |
| t_c0ac2da9: V05 404-Stilabweichung | 404 hat Header, Footer, `h1`, dunklen Hintergrund; Abweichung nur in der Titelgröße (N11) | **abgeschwächt** |

## 7. Stil- und Konsistenzbewertung (messbar)

* **Design-System-Disziplin gut:** 407 `var(--…)`-Verwendungen in 1498 CSS-Zeilen, nur 3 hartkodierte Farben (`#000` ×2, `#fff` ×1) außerhalb der Token-Blöcke, Radien ausschließlich über `--radius-*`, 8 `@keyframes`, `@media print` vorhanden, 8 Breakpoints.
* **Typo-Skala:** `--text-xs` 0.7 rem bis `--text-4xl` 3.5 rem; gemessen 56/40/18 px (h1/h2/h3) auf der Startseite, Zeilenhöhen 1.25; Fließtext 13.2–16 px mit 1.6 Zeilenhöhe.
* **Konsistenz der Flächen:** alle Hauptansichten `rgb(10,5,18)`, Karten `rgb(18,10,31)`, Header `rgb(10,6,18)`; Rechtsseiten und 404 im selben Schema.
* **Schwächen:** fehlende `h1` pro Ansicht + konstante `document.title` (N8); Titelgrößen-Inversion zwischen Dokumenttypen (N11); tote Light-Variante (N10); Emoji-/Symbolbildsprache (N3).
* **Bildsicht (vision_analyze in diesem Lauf erfolgreich, 3 echte PNGs):** Kristalldialog 375 px — Bild im eigenen Container oben, Text darunter, keine Überlappung, großzügige konsistente Abstände, gute Hierarchie; Kristall-Filteransicht 375 px — konsistentes dunkles Schema, einheitliche Radien, klare Stufen Marke→Titel→Untertitel→Filter; „kontrastarm“ genannte Filtertexte messen 7.45–16.04 und sind damit **nicht** kontrastarm (Eindruck durch Messung widerlegt). Die Bildsicht ist Stichprobe, **keine** historische Sollbaseline und keine Design-Deckfreigabe.

## 8. Links- und Vollständigkeitsprüfung

* Startseite: 22 `a[href]`; 3 Platzhalter (`#`); 3 interne Rechtslinks 200; 1 externer Link (`github.com/ingbms/Esoterik-Welt`) 200.
* Dokumente im Build: `index.html`, `Lokal.html`, `404.html`, `Lokal-404.html`, `impressum/datenschutz/haftung` + jeweilige `Lokal-*` = 10 HTML-Dateien; keine eigenständige Produkt-, Kontakt-, Login- oder Dashboardseite (bewusst, Kontakt über Impressum).
* Ressourcen: `data/crystals.json`, `data/moon-phases.js`, `js/modules/moon.js`, `sitemap.xml`, `robots.txt` → 200; `assets/og-preview.png` → 404.
* Rechtstexte: Meta-Description fehlt auf allen drei Rechtsseiten, Canonical fehlt, `robots`-Meta fehlt; `404.html` hat Description, aber kein Canonical.
* Kataloge vollständig (78/30/24/10), Artikeltexte 336–748 Zeichen je ID, alle 10 mit Inhalt.

## 9. Was der Nutzer entscheiden muss

**Nichts Technisches — und keine Geschmacksfragen aus technischen Mängeln.** Gebündelt:

1. **Veröffentlichung:** bereits genehmigt (Entscheid 01.11.2026) — sie ist aber fachlich an das **positive** Ergebnis der unabhängigen Gesamt-QA **t_676d2563** gebunden; Ausführung übernimmt die Releasekarte **t_32e80593**. Diese Karte veröffentlicht nicht.
2. **Nachtatelier-Stilpaket und Tarot-Mustersatz:** bereits genehmigt; Umsetzung läuft separat und ist **nicht** Gegenstand dieses Reviews.
3. **Deck V2:** eigenes, späteres menschliches Sichtgate — hier nicht implizit freigegeben.

## 10. Kartengraph (Ist-Stand)

```
t_6d900985 (diese Konsolidierung)
   ├─ t_b5861420  M8/M9/L1–L3 + N7  (coding_debug, todo; wartet auf diese Karte + t_44b8b6dd)
   └─ t_1a54c988  N8/N10/N11/N12    (coding_debug, todo; nach t_b5861420, kein Release-Gate)
t_befcdea7 → t_44b8b6dd  M6/M7/N5/N6 (coding_debug, running)
t_44b8b6dd, t_b5861420, t_774c3023, t_6d900985 → t_676d2563 (unabhängige Gesamt-QA, design_critique)
t_676d2563 → t_32e80593 (Release)
```

Hotspots bleiben `js/main.js` und `js/modules/blog.js` (Router + Artikel-Dialog). t_44b8b6dd und t_b5861420 sind deshalb serialisiert; kein paralleles Implementieren derselben Dateien.

## 11. Grenzen dieser Prüfung

* Nur Chromium 156/Windows; kein Safari, kein echtes Mobilgerät, kein systematischer Zoom-/Print-/Performance-Lauf, keine Felddaten, kein CLS.
* Geprüft wurde ein **eingefrorener** Build-Snapshot (16:15 UTC); spätere Änderungen aus t_44b8b6dd/t_b5861420 sind nicht enthalten und müssen in t_676d2563 neu gemessen werden.
* Keine Axe-/WCAG-Zertifizierung; Kontrast und Tastatur wurden manuell gemessen, nicht zertifiziert.
* Bildsicht ist eine Stichprobe von 3 Ansichten mit echten PNGs; keine vollständige Sichtprüfung aller 78 Kartenobjekte.
* Keine historische Design-Sollbaseline, keine Aussage über „Designqualität“ als Geschmacksurteil.

## 12. Verifikations-Checkliste

- [x] Kritische Flows und Viewports reproduzierbar dokumentiert (Skripte + Rohdaten + PNGs, `dist`-Hashes stabil)
- [x] A11y/Kontrast mit Werkzeug und dokumentierten Bedingungen gemessen (composited Farben, Gradienten farbstop-weise)
- [x] Jeder offene Befund hat konkrete Abhilfe (in t_b5861420 spezifiziert) und einen Retest-Pfad (t_676d2563)
- [x] Zahlen mit Werkzeugen berechnet; Elternbefunde stichprobenartig unabhängig geprüft, inklusive Widerlegungen
- [x] Produktionsstand am exakten Ziel nachgelesen (Live-Hashes, Live-DOM-Messungen), lokal getrennt ausgewiesen
- [x] Keine Produktdatei geändert, kein Commit/Push/Deploy, keine menschliche Freigabe behauptet
