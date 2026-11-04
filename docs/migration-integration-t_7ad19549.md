# Integration und Release der Astro-Migration (t_7ad19549)

**Stand:** 4. November 2026
**Aufgabe:** VELARKANA – Migration der bestehenden Website auf Astro + TypeScript (Root-Task)
**Basis:** `9f58439` (veröffentlichter Stand, Tag `baseline/rubriken-2026-11-03`)
**Integrationsbranch:** `esoterik-welt/t_7ad19549-velarkana-migration-der-bestehenden-webs`

## 1. Ausgangslage

Die Migration lag in zwei Geschwisterbranches vor, die sich in vier Dateien
gegenseitig ausschlossen (`BaseLayout`, `SiteHeader`, `SiteFooter`,
`index.astro`). Das unabhängige Review (`t_747a7674`) und die QA (`t_e931ca05`)
kamen übereinstimmend zum Urteil **nicht abnahmefähig** mit sieben Blockern.
Dieser Task hat daraus **einen** Integrationsstand gebaut, die Blocker behoben
und den Stand veröffentlicht.

## 2. Integrationsstand

| Schritt | Commit | Inhalt |
|---|---|---|
| Basis | `e1be7cf` | Merge der Inhalts-/Routen-/SEO-Migration (`9e28573`) inkl. Gerüst (`5d9c554`) und Plan (`682f560`) |
| Komponenten | `53ee6d5` | Merge der Layout-/Komponentenschicht (`e934596`), Konflikte in vier Dateien inhaltlich aufgelöst |
| Blockerfixes | `8b7ff84` | B-2 bis B-7, M-1 bis M-12 |
| Deployment | `338dd93` | Pages-Artefakt, Pfadpräfix, Prüfung |
| Abschluss | `ef2f6b5` | Integrationsbericht, Lint-/Format-Gates, idempotenter Deploy |

**Entscheidungen der Konfliktauflösung:**

* `BaseLayout` trägt die Vereinigung beider Schnittstellen: `trail`, `jsonLd`,
  `exactTitle`, `omitCanonical` (Inhaltsbranch) **und** `ogType`, `ogImage`,
  `headerVariant`, `footerVariant`, `mainClass` (Komponentenbranch).
* CSS wird vollständig aus dem Bestand eingebunden (`css/design-system.css`,
  `css/main.css`, `css/frequenzlabor.css`, `css/radiasthesie.css`,
  `css/farbwelten.css`). Der CSS-Split des Komponentenbranches deckte nur
  557 von 3.876 Zeilen `main.css` ab und hätte Artikel- und Bereichsseiten
  ungestylt gelassen; er ist nicht mehr im Build.
* Marke: genau eine Quelle (`SITE_NAME` in `src/lib/site.ts`), Wert
  `VELARKANA`; `jsonld.ts` und `data/site.ts` importieren sie (M-4).
* Prüfseite `src/pages/komponenten.astro` gelöscht (M-7).

## 3. Behobene Blocker

| ID | Befund | Lösung | Nachweis |
|---|---|---|---|
| B-1 | kein Integrationsstand, 4 Merge-Konflikte | ein Branch, ein Layout, eine Komponentenschicht | `astro check` 0 Fehler, Build 144 Seiten |
| B-2 | Radiästhesie −15 % bis −40 % Text | sieben Dokumente 1:1 aus dem Bestandsgenerator als Content-Fragmente (`src/content/radiasthesie/*.body.html`), erzeugt von `scripts/migration/extract-radiasthesie-bodies.cjs` | Textvergleich: **0,0 %** Abweichung auf allen sieben Seiten |
| B-3 | Pendeln ohne Inhaltsverzeichnis | Fragment enthält Kapitel und „Auf dieser Seite“ samt Ankern | Anker 10/10, Links 145/145 (Textparität) |
| B-4 | Startseite: Kachelraster statt Zeilenliste | `FeatureList` aus `e934596`, Bestandstexte | Dokumenthöhe 3664 px (1440) / 5384 px (390); Bestand 3712/5410 (−1,3 %/−0,5 %) |
| B-5 | mobiler Header 169 px, kein Burger | `SiteHeader` aus `e934596` | Header 390 px: **85 px**, Burger sichtbar, Escape und Favoritenzähler aktiv |
| B-6 | `_astro/` ohne `.nojekyll` | `public/.nojekyll`; Deploy-Artefakt enthält es | Build-Audit: `.nojekyll` vorhanden; live `_astro/` wird ausgeliefert |
| B-7 | keine Interaktionen | Werkzeug-Inseln: Bestandsmarkup + Bestandsmodule (Vanilla) | 12/12 Werkzeuge im Browser geprüft, 0 Konsolenfehler |

**B-7 im Detail.** Statt die Oberflächen neu zu bauen, rendert Astro das
Bestandsmarkup und initialisiert dieselben Module:

| Werkzeug | Modul | Ergebnis im Browser |
|---|---|---|
| Tarot | `tarot.js` + `dialog.js` | 78 Karten, Deckwahl, Suche, Filter, Ziehung, Detaildialog |
| Kristalle | `crystals.js` | 30 Steine, Chakra-/Farb-/Wirkungsfilter, Favoriten, Dialog |
| Mondphasen | `moon.js` | aktuelle Phase, Zeitachse, Monatskalender, iCal, Rituale |
| Runen | `runes.js` | 24 Runen, 3-Runen-Wurf, Einzelrune, Historie |
| Frequenzen | `frequenzlabor.js` | Bibliothek (19.967 Zeichen), Labor, Chladni, Meditation |
| Pendeln | `radiasthesie.js` | Labor, Tafel-Studio, Experimentierlabor, Tagebuch |

Die Fragmente liegen in `src/content/tools/*.html` und werden mit
`node scripts/migration/extract-tools.cjs` aus `index.html` erzeugt
(`--check` belegt Aktualität). Relative Bestandsassets werden zur Laufzeit
über `src/lib/rebase-assets.ts` auf `app-base` abgebildet — nötig, weil die
Werkzeuge auf Unterseiten liegen und GitHub Pages unter `/velarkana/` ausliefert.

## 4. Behobene Majors

* **M-1:** 31 Seiten mit sichtbaren Migrationshinweisen — entfernt; Build-Audit
  findet 0 Vorkommen.
* **M-2:** genau ein `<h1>` je Seite (Rechtsseiten: `sr-only`-Dublette entfernt,
  Frequenz-Quellendokument auf `##` normalisiert); Build-Audit 0 Verstöße.
* **M-3:** genau ein `WebPage`-Knoten je Seite (Seitenknoten ersetzt den
  generischen, `@id` bleibt); Build-Audit 0 Verstöße.
* **M-4:** eine Markenquelle.
* **M-5:** CI führt jetzt `format:check`, `verify:migration` und
  `scripts/migration/audit-build.cjs` aus.
* **M-11:** `footerVariant="compact"` auf Impressum, Datenschutz, Haftung, 404.
* **M-12:** `overflow-wrap: anywhere` für Fließtext-/Quellenlisten; 390-px-Messung:
  `/wissen/` 390 (vorher 423), `/farbwelten/` 390 (vorher 516).
* **M-13:** nicht behoben; das Performance-Budget bleibt offen (siehe §7).

## 5. Verifikation (Integrationsbranch)

| Prüfung | Ergebnis |
|---|---|
| `npm run check` | 0 errors / 0 warnings / 20 hints |
| `npm run build` | 144 Seiten, 145 HTML-Dateien, Sitemap 142 `<loc>` |
| `npm run verify:migration` | 0 Befunde (Routen, Mengen, SEO 36/36, 6.688 Links) |
| `scripts/migration/audit-build.cjs` | 0 mehrfache H1, 0 mehrfache WebPage-Knoten, 0 Migrationshinweise, `.nojekyll` vorhanden |
| `npm run lint` / `format:check` | grün |
| Textparität Radiästhesie | 7/7 Dokumente 0,0 % Abweichung |
| Paritätsmessung Startseite | 1440: 3664/3712 px; 390: 5384/5410 px; Header 101/85 px; Footer 433/1145 px |
| Werkzeug-Suite | 12/12 Seiten mit gerendertem Inhalt, Bedienelementen, 0 Konsolenfehlern |
| Interne Verweise im Artefakt | 6.885 geprüft, 0 unauflösbar |
| Verbotene Dateien im Artefakt | 0 (kein `src/`, `tests/`, `docs/`, `*.ts`, `*.astro`) |
| Live-Routen | 10/10 HTTP 200; `_astro/`, Fonts, Bilder ohne 404 |

Reproduzierbar mit:

```bash
npm ci && npm run check && npm run build && npm run verify:migration
node scripts/migration/audit-build.cjs
node scripts/migration/compare-text.py ../Esoterik-Welt/radiasthesie dist/radiasthesie
node scripts/migration/measure-parity.cjs   # benötigt Bestand + dist als Server
node scripts/migration/tool-suite.cjs       # benötigt laufenden Server
node scripts/deploy-pages.cjs --push        # Artefakt bauen und veröffentlichen
```

## 6. Veröffentlichung

| Punkt | Wert |
|---|---|
| Privates Entwicklungs-Repository | `ingbms/velarkana-dev`, Branch `astro-migration`, Commit `ef2f6b5` (Remote geprüft) |
| Öffentliches Website-Repository | `ingbms/velarkana` (public, neu angelegt) |
| Veröffentlichungsbranch | `main`, Repository-Wurzel, GitHub Pages `build_type=legacy` |
| Website | https://ingbms.github.io/velarkana/ |
| Artefakt | 145 HTML-Seiten, 72 MB inkl. Fonts/Bilder, `.nojekyll` |
| Canonical im Artefakt | `https://ingbms.github.io/velarkana/…` bis zur Domainkonnektierung |
| Domain | `velarkana.de` registriert (INWX), **nicht** konnektiert, keine DNS-Änderung |

Der Deploy-Schritt (`scripts/deploy-pages.cjs`) ist idempotent: Er baut aus
`dist/`, schreibt Domain und Wurzelpfade um, prüft Verweise und Dateitypen und
pusht erst dann. `CNAME` wurde bewusst nicht angelegt, solange die Domain nicht
auf Pages zeigt.

## 7. Offen (nicht release-blockierend, aber ehrlich benannt)

1. **Farbwelten-Hub:** `/farbwelten/` nutzt die statische Redaktionsseite; der
   Bestand rendert dort die App (`farbweltenRoot`). Die Detailseiten sind
   inhaltlich vollständig, der Hub ist kürzer (6437 vs. 9158 px bei 1440).
   Eine Angleichung würde die App-Insel auf Kosten der statischen Crawlbarkeit
   setzen — Entscheidung für den Eigentümer.
2. **`/wissen/`-Übersicht:** 3960 vs. 2469 px, weil die Migration alle zehn
   Artikel als Textlistung zeigt; der Bestand nutzte Karten. Kein Textverlust.
3. **Performance:** Lighthouse mobil 0,86 (Budget 0,90) aus der QA; Ursachen
   sind TTF-Schriften und das 413-KB-Hero-Foto. Nicht Teil dieses Fixlaufs.
4. **`og:image`** fehlt weiterhin (F6).
5. **localStorage-Migration** beim Domainwechsel (F2) ist nicht umgesetzt.
6. **Artikelumfang:** 10 Artikel migriert; das Arbeitsprojekt B nennt 22 (F4).
7. **Unit-Tests** für `src/lib` (M-6) fehlen; abgesichert ist das Endergebnis
   über `verify:migration`, `audit-build` und die Werkzeug-Suite.
8. **Astrologie-Suche** bleibt das statische Filterformular; die
   Astrologie-App (86 Seiten) ist bewusst als Dokumente migriert.
9. **`astro check`-Hinweise:** 20 × `z`-Deprecation aus `astro:schema`
   (Astro 8 stellt den Nachfolgepfad bereit).

## 8. Nicht Teil dieses Tasks

* DNS-/Domainumstellung auf `velarkana.de` (ausdrücklich untersagt).
* Redaktionelle Änderungen, neue Inhalte, CMS.
* Löschen der bestehenden GitHub-Pages-Seite `ingbms/Esoterik-Welt`; sie bleibt
  unverändert online.
