# Migrationsplan VELARKANA — Bestandsaufnahme und Weg zu Astro + TypeScript

Status: **Entwurf zur Abnahme** (Aufgabe `t_d86acafa`, Planner)
Datum: 4. November 2026
Gegenstand: vollständige Inventarisierung der heute veröffentlichten Website und Migrationsplan für die VELARKANA-Umstellung.

Dieses Dokument enthält **keinen Code-Umbau**. Es beschreibt den Ist-Zustand mit Nachweisen, die Zielstruktur jeder Route und die Reihenfolge der Migration.

---

## 0. Nachweisbasis (was tatsächlich geprüft wurde)

| Gegenstand | Wert / Ergebnis | Ermittlung |
|---|---|---|
| Repository | `https://github.com/ingbms/Esoterik-Welt` (privat) | `git remote -v` |
| Arbeitskopie | Worktree `C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_d86acafa`, Branch `wt/t_d86acafa` | `git status` |
| Geprüfter Commit | `9f584397f8cc86a261fccdfc36dfbb8999f55ea7` („Reparatur: vollständige Rubriken und geprüfter Vorschau-Stand (#18)") | `git log -1` |
| `main` = `origin/main` | ja, beide `9f58439` | `git ls-remote origin refs/heads/main`, `git rev-parse origin/main` |
| Baseline-Tag | `baseline/rubriken-2026-11-03` | `git tag` |
| Pages-Quelle | Branch `main`, Pfad `/`, `build_type: legacy`, `status: built`, Build-ID `1338198022`, Commit `9f58439` | `gh api repos/ingbms/Esoterik-Welt/pages{,/builds/latest}` |
| Domain | keine eigene Domain (`cname: null`), `https_enforced: true`, `custom_404: true` | `gh api .../pages` |
| Deploy = Repo (Stichprobe) | `index.html` und `radiasthesie/pendeln.html` live **byte-identisch** zum Commit (SHA-256 verglichen) | `curl` + `sha256sum` |
| Live-Erreichbarkeit | `/`, `/radiasthesie/`, `/sitemap.xml`, `/robots.txt`, `/404`-Fallback geprüft | Browser-Aufruf gegen `https://ingbms.github.io/Esoterik-Welt/` |

> Hinweis zur Prüfmethode: In der Browser-Sitzung erschienen Seitentitel mit einem vorangestellten Emoji. Ein direkter `curl`-Abgleich zeigt, dass **kein** Emoji im Repository oder in der ausgelieferten Datei steht (beide `sha256 8286ee85…f708`). Die Abweichung stammt aus der Browserumgebung, nicht aus der Website. Für die SEO-Baseline gilt der `curl`-Befund.

**Reproduktion der Kernprüfungen:**

```bash
git -C C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_d86acafa log -1 --format=%H
gh api repos/ingbms/Esoterik-Welt/pages | jq '{status,source,cname,custom_404}'
curl -s https://ingbms.github.io/Esoterik-Welt/ | sha256sum
sha256sum index.html
curl -s -o /dev/null -w '%{http_code}\n' https://ingbms.github.io/Esoterik-Welt/Lokal.html
```

### 0.1 Zwei Stände — und welcher hier gilt

Diese Aufgabe wurde in einem Worktree des **Esoterik-Welt**-Repositories ausgeführt. Der verbindliche Arbeitsordner des Gesamtprojekts ist laut Auftrag dagegen `C:/Users/mas/Arbeit/velarkana`. Beide wurden geprüft; sie unterscheiden sich nur in Branding, Basis-Pfad und Veröffentlichungswerkzeug, **nicht** in Routen, Daten oder Inhalten:

| | **A: veröffentlichte Website (Ist-Live)** | **B: verbindliches Arbeitsprojekt** |
|---|---|---|
| Ordner | `C:/Users/mas/Arbeit/Esoterik-Welt` (Worktree `wt/t_d86acafa`) | `C:/Users/mas/Arbeit/velarkana` |
| Commit | `9f58439` (= `origin/main`) | `28d9c47` (main, „docs(migration): Abschluss- und Push-Nachweis") |
| Marke in `<title>` | „Esoterik-Welt" | **„VELARKANA"** (114 Dateien enthalten den neuen Namen) |
| Basis-Pfad | `/Esoterik-Welt/` | `/velarkana/` (`config/site.json`, `robots.txt`, `sitemap.xml`) |
| Kanonische Origin | `https://ingbms.github.io/Esoterik-Welt/` | `https://ingbms.github.io/velarkana/` (`config/site.json` → `"environment": "interim"`, Ziel `velarkana.de` noch nicht aktiv) |
| Veröffentlichung | Push auf `main` → Pages-Build (kein Deploy-Job) | eigener Workflow `.github/workflows/publish-pages.yml` (Tags `release/**` oder manuell; Kette build → build:publish → check:public → check:secrets → Dry-run) in das öffentliche Repo `ingbms/velarkana` |
| Git-Dateien | 1.838 | 1.984 (u. a. `config/site.json`, `.nvmrc`, Issue-Templates, `docs/betrieb/`, `docs/VELARKANA_STRUCTURE_SPEC.md`) |
| Live erreichbar | ja, geprüft | nein: `gh api repos/ingbms/velarkana` → 404, `https://ingbms.github.io/velarkana/` → 404 |

**Konsequenz für dieses Dokument:** Route-Matrix, Asset- und Inhaltsinventar gelten für beide Stände, mit **einer** inhaltlichen Abweichung: Stand B führt **22 Blogartikel** (10 kuratierte + 12 aus Markdown generierte), Stand A nur 10. Alles andere ist gleich (identische `MAIN_PAGES`, 11 Sitemap-Ziele, 30 Kristalle, 18 Farbwelten-Quellen, 7 Radiästhesie-Dokumente). Die **SEO-Baseline in §6.1 zitiert den Live-Stand A**, weil nur er indexiert ist; die Titel des Arbeitsprojekts B und alle weiteren Deltas stehen in §11.5. Migrationsziel ist B mit eigener Domain.

---

## 1. Ausgangslage in einem Absatz

Die Website ist eine **Single-Page-Application ohne Framework**: eine einzige `index.html` (40.651 Byte) mit zehn `<section class="page">`-Blöcken, die über den URL-**Hash** geroutet werden (`js/main.js`, 802 Zeilen, eigener `parseRoute()`). Dazu kommen **11 eigenständige HTML-Dokumente** (3 Rechtsseiten, 404, 7 generierte Radiästhesie-Seiten) und 5 CSS-Dateien. Die Inhalte liegen in **11 JS-Datenmodulen** (`js/data/`, zusammen 852 KB Quelltext) und 18 Markdown-Redaktionsquellen, aus denen ein Generator `js/data/farbwelten.js` erzeugt. Ausgeliefert wird direkt aus dem Repository-Wurzelverzeichnis über GitHub Pages; ein Bundler läuft nur für die Offline-Einzeldatei (`Lokal.html`, 1,6 MB). Es gibt **keinen Server, keine Formular-Endpunkte, keine Tracker, keine externen Embeds**. Der gesamte Nutzerzustand liegt in `localStorage`.

Damit ist die Migration keine Framework-Ablösung, sondern eine **Architektur-Umstellung von „ein Dokument, viele Ansichten" auf „viele Dokumente"** — mit den entsprechenden SEO-, Routing- und Test-Folgen.

---

## 2. Route-Matrix

### 2.1 Veröffentlichte Dokumente (echte HTML-Dateien)

Alles hier ist direkt adressierbar und wird von GitHub Pages als Datei ausgeliefert. `Typ: statisch` = fertige Datei; `generiert` = beim Build erzeugt.

| # | Route (Ist) | Quelle / Datei | Typ | Zweck | Geplante Astro-Zielstruktur |
|---|---|---|---|---|---|
| D1 | `/` (auch `/index.html`) | `index.html` (40.651 B) | statisch, SPA-Shell | Startseite + Container für 10 Hash-Ansichten, 4 Dialoge, Footer | `src/pages/index.astro` (Startseite) + Legacy-Hash-Shim (s. §7 P5) |
| D2 | `/404.html` | `404.html` (1.366 B) | statisch | Fehlerseite für unbekannte Pfade (Pages-Custom-404) | `src/pages/404.astro` |
| D3 | `/impressum.html` | `impressum.html` (29.936 B) | statisch | Impressum, Bild-/Schriftennachweise (umfangreichste Rechtsseite) | `src/pages/impressum.astro` |
| D4 | `/datenschutz.html` | `datenschutz.html` (3.049 B) | statisch | Datenschutzerklärung (keine Tracker, lokale Speicherung) | `src/pages/datenschutz.astro` |
| D5 | `/haftung.html` | `haftung.html` (2.797 B) | statisch | Haftungsausschluss (keine medizinische/rechtliche Beratung) | `src/pages/haftung.astro` |
| D6 | `/radiasthesie/` | `radiasthesie/index.html` (21.838 B) | generiert | Bereichs-Landing Radiästhesie/Pendeln/Orakel | `src/pages/radiasthesie/index.astro` (aus den Daten von `js/modules/radiasthesie-seo.js`) |
| D7 | `/radiasthesie/radiasthesie.html` | 79.423 B | generiert | Themenseite Radiästhesie (10 Kapitel) | `src/pages/radiasthesie/radiasthesie.astro` |
| D8 | `/radiasthesie/pendeln.html` | 55.268 B | generiert | Themenseite Pendeln (10 Kapitel) | `src/pages/radiasthesie/pendeln.astro` |
| D9 | `/radiasthesie/orakel.html` | 37.354 B | generiert | Themenseite Orakel (12 Kapitel) | `src/pages/radiasthesie/orakel.astro` |
| D10 | `/radiasthesie/glossar.html` | 20.834 B | generiert | Glossar A–Z (9 Buchstabengruppen, 17 Begriffe) | `src/pages/radiasthesie/glossar.astro` |
| D11 | `/radiasthesie/quellen.html` | 61.796 B | generiert | Quellen & Belege (66 Quellen, Prüftiefe, Interessenvermerk) | `src/pages/radiasthesie/quellen.astro` |
| D12 | `/radiasthesie/methodik.html` | 18.549 B | generiert | Methodik & Grenzen (Evidenzstufen A–E) | `src/pages/radiasthesie/methodik.astro` |

Die sieben Radiästhesie-Dokumente werden von `scripts/generate-radiasthesie-pages.cjs` aus `js/data/radiasthesie.js` und der Adressliste `js/modules/radiasthesie-seo.js` (`STATIC_DOCS`, `ROOT_DOCS`) erzeugt. **Entscheidung D1:** Diese sieben Pfade bleiben als kanonische Adressen unverändert (sie stehen so in der Sitemap und sind indexiert). Astro erzeugt sie über `build.format: 'file'` als identische `.html`-Dateien.

### 2.2 Hash-Routen (Ansichten von `index.html`)

Alle folgenden Routen sind **keine Dokumente**: Sie teilen sich eine URL, ein Canonical und ein HTML-Dokument. Anzahl ohne Query- und Anker-Varianten: **140 Ansichten in Stand A**, **152 in Stand B** (Stand B hat 12 Artikel mehr, siehe §11.5).

| # | Route (Ist) | Quelle | Typ | Zweck | Anzahl | Geplante Astro-Zielstruktur |
|---|---|---|---|---|---|---|
| H1 | `#home` | `index.html` + `js/main.js` | statisch (SPA) | Startseite: Hero, 9 Startseitenkarten, 4 Themenblöcke | 1 | `src/pages/index.astro` |
| H2 | `#tarot` | `js/modules/tarot.js`, `js/data/tarot.js` | dynamisch (Client) | 78 Karten, Tageskarte, 3-Karten-Legung, Deckauswahl (2 Decks), Verlauf | 1 | `src/pages/tarot.astro` + Insel `TarotDraw` |
| H3 | `#crystals` | `js/modules/crystals.js`, `data/crystals.json` | dynamisch | Katalog 30 Steine, Filter (Chakra/Farbe/Suche), Favoriten | 1 | `src/pages/kristalle.astro` + Insel `CrystalCatalog` |
| H4 | `#moon` | `js/modules/moon.js`, `data/moon-astro.mjs` | dynamisch | Mondphase heute, Zeitachse, Monatskalender, iCal-Export, 8 Phasen | 1 | `src/pages/mondphasen.astro` + Insel `MoonCalendar` |
| H5 | `#runes` | `js/modules/runes.js`, `js/data/runes.js` | dynamisch | 24 Runen (3 Ættir), 3-Runen-Wurf, Wurf-Historie | 1 | `src/pages/runen.astro` + Insel `RuneCast` |
| H6 | `#blog` | `js/modules/blog.js`, `js/data/articles.js` | dynamisch | Artikelliste mit Suche/Kategoriefilter, „mehr laden" | 1 | `src/pages/wissen/index.astro` |
| H7 | `#blog/1` … `#blog/10` (A) bzw. `#blog/1` … `#blog/22` (B) | `js/data/articles.js`, `js/article-content.js`; in B zusätzlich `js/data/articles-markdown.js` | dynamisch | Einzelartikel als Dialog über der Liste | 10 (A) / **22** (B) | `src/pages/wissen/[slug].astro` (Content Collection `articles`, 22 Einträge) |
| H8 | `#astrologie` | `js/modules/astrologie.js` + `js/data/astrologie.js` | dynamisch | Bereichs-Hub (Zeichen, Faktoren, Häuser, Aspekte, Lernpfad …) | 1 | `src/pages/astrologie/index.astro` |
| H8a | `#astrologie/lernpfad`, `/lernpfad/<slug>` | dito | dynamisch | Lernpfad-Index + 6 Stufen | 7 | `astrologie/lernpfad/index.astro`, `astrologie/lernpfad/[slug].astro` |
| H8b | `#astrologie/zeichen`, `/zeichen/<slug>` (`?element=`,`?modality=`,`?q=`) | dito | dynamisch | Index + 12 Zeichen-Detailseiten | 13 | `astrologie/zeichen/index.astro`, `astrologie/zeichen/[slug].astro` |
| H8c | `#astrologie/faktoren`, `/faktoren/<slug>` (`?q=`) | dito | dynamisch | Index + 10 Deutungsfaktoren | 11 | `astrologie/faktoren/index.astro`, `astrologie/faktoren/[slug].astro` |
| H8d | `#astrologie/haeuser`, `/haeuser/<slug>` | dito | dynamisch | Index + 12 Häuser | 13 | `astrologie/haeuser/index.astro`, `astrologie/haeuser/[slug].astro` |
| H8e | `#astrologie/aspekte`, `/aspekte/<slug>` | dito | dynamisch | Index + 5 Hauptaspekte | 6 | `astrologie/aspekte/index.astro`, `astrologie/aspekte/[slug].astro` |
| H8f | `#astrologie/grundlagen`, `/grundlagen/<slug>` (`?ebene=`,`?q=`) | dito | dynamisch | Index + 24 Grundlagen-/Vertiefungstexte | 25 | `astrologie/grundlagen/index.astro`, `astrologie/grundlagen/[slug].astro` |
| H8g | `#astrologie/beispiele`, `/beispiele/<slug>` | dito | dynamisch | Index + 4 fiktive Lehrbeispiele | 5 | `astrologie/beispiele/index.astro`, `astrologie/beispiele/[slug].astro` |
| H8h | `#astrologie/faq` | dito | dynamisch | 15 FAQ-Einträge | 1 | `astrologie/faq.astro` |
| H8i | `#astrologie/glossar` (`?q=`, `#claim-*`-Sprungziele) | dito | dynamisch | Glossar mit 65 Begriffen | 1 | `astrologie/glossar.astro` |
| H8j | `#astrologie/quellen` (`?quelle=`,`?claim=`) | dito | dynamisch | 25 Quellen, 28 Claims, Rechtehinweise | 1 | `astrologie/quellen.astro` |
| H8k | `#astrologie/methodik` | dito | dynamisch | Arbeitsannahme, Kennzeichnung, Grenzen | 1 | `astrologie/methodik.astro` |
| H8l | `#astrologie/suche` (`?q=`) | dito | dynamisch | Bereichssuche (clientseitig, max. 50 Treffer) | 1 | `astrologie/suche.astro` (Ergebnis clientseitig) |
| H9 | `#frequenzen` | `js/modules/frequenzlabor.js` | dynamisch | Frequenz-Hub: Erklärstück, Bibliothek, Disclaimer | 1 | `src/pages/frequenzen/index.astro` |
| H9a | `#frequenzen/labor` (Alias `#frequenzlabor`) | dito + `js/modules/frequenz-engine.js` | dynamisch | Tongenerator (Slider, Presets, Sweep, Schwebung, binaural) | 1 | `frequenzen/labor.astro` + Insel `FrequencyLab` |
| H9b | `#frequenzen/quellen` | dito, lädt `docs/frequenz-quellen.md` per `fetch` | dynamisch | Quellendokument, gerendert über `js/modules/markdown-lite.js` | 1 | `frequenzen/quellen.astro` (Content Collection, Build-Zeit-Rendering) |
| H9c | `#frequenzen/cymatics` (Feature-Flag) | `js/modules/frequenz-chladni.js`, `js/modules/frequenz-cymatics-view.js` | dynamisch | Chladni-Muster (Canvas) | 1 | `frequenzen/cymatics.astro` + Insel |
| H9d | `#frequenzen/meditation` (Feature-Flag) | `js/modules/frequenz-meditation-model.js`, `js/modules/frequenz-meditation-view.js` | dynamisch | Meditationssitzung mit Timer | 1 | `frequenzen/meditation.astro` + Insel |
| H10 | `#pendeln` | `js/modules/radiasthesie.js` + `js/data/radiasthesie.js` | dynamisch | Bereichs-Landing (Duplikat von D6, anderer Weg) | 1 | → Redirect auf `/radiasthesie/` (Entscheidung D1) |
| H10a | `#pendeln/radiasthesie`, `/pendeln/pendeln`, `/pendeln/orakel` | dito | dynamisch | 3 Themenseiten (Duplikate von D7–D9) | 3 | → Redirect auf `/radiasthesie/<thema>.html` |
| H10b | `#pendeln/<thema>/<abschnitt>` | dito | dynamisch | 32 Kapitelanker (10/10/12) | (32 Anker) | Anker auf den Dokumenten D7–D9 (`id`-Parität) |
| H10c | `#pendeln/glossar` (`?b=A` … `?b=Z`, `?q=`) | dito | dynamisch | Glossar (17 Begriffe, 9 Gruppen) | 1 | → `/radiasthesie/glossar.html` |
| H10d | `#pendeln/quellen` (`?quelle=Q01` …) | dito | dynamisch | Quellenverzeichnis (66 Quellen) | 1 | → `/radiasthesie/quellen.html` |
| H10e | `#pendeln/methodik` | dito | dynamisch | Methodik & Grenzen | 1 | → `/radiasthesie/methodik.html` |
| H10f | `#pendeln/labor` | `js/modules/pendel-simulator.js` | dynamisch | Pendellabor (Simulation) | 1 | `pendeln/labor.astro` + Insel |
| H10g | `#pendeln/studio` | `js/modules/pendeltafel-model.js`, `js/modules/pendeltafel-studio.js` | dynamisch | Pendeltafel-Studio (Formular `#ptfForm`) | 1 | `pendeln/studio.astro` + Insel |
| H10h | `#pendeln/experiment` | `js/modules/experiment-labor.js`, `js/modules/experiment-statistik.js`, `js/modules/experiment-zufall.js` | dynamisch | Experimentierlabor (3 Experimente) | 1 | `pendeln/experiment.astro` + Insel |
| H10i | `#pendeln/journal` | `js/modules/pendel-journal.js`, `js/modules/journal-speicher.js` | dynamisch | Pendeltagebuch (Formular `#jrForm`, lokal) | 1 | `pendeln/journal.astro` + Insel |
| H10j | `#pendeln/suche` (`?q=`) | `js/modules/radiasthesie-model.js` | dynamisch | Bereichssuche | 1 | `pendeln/suche.astro` |
| H11 | `#farbwelten` | `js/modules/farbwelten.js` + `js/data/farbwelten.js` | dynamisch | Landing (Einführung, Register, Einstiege, Methodik) | 1 | `src/pages/farbwelten/index.astro` |
| H11a | `#farbwelten/register`, `/einstiege`, `/methodik`, `/…/<abschnitt>` | dito | dynamisch | 3 Einstiegsanker der Landing | (3 Anker) | Anker auf `farbwelten/index.astro` |
| H11b | `#farbwelten/<farbe>` (12 Farben) | dito | dynamisch | Farbseiten mit 8 Abschnitten (erleben, physik, psychologie, tradition, anwendung, geschichte, uebung, quellen) | 12 | `farbwelten/[slug].astro` (`getStaticPaths`: 12 Farben + 3 Themen) |
| H11c | `#farbwelten/<farbe>/<abschnitt>` | dito | dynamisch | 8 Abschnittsanker je Farbseite | (96 Anker) | Anker auf H11b |
| H11d | `#farbwelten/farbtherapie`, `/farbpsychologie`, `/lichtmedizin` | `content/farbwelten/*.md` → `js/data/farbwelten.js` | dynamisch | 3 Themenseiten mit eigener Bibliografie | 3 | `farbwelten/[slug].astro` (gleiche Route wie H11b) |
| H11e | `#farbwelten/chakren` (Alias `#chakren`), `/lichtfrequenzen` (Alias) | dito | dynamisch | 2 Sonderseiten (Chakren-Zuordnung, Lichtfrequenzen) | 2 | `farbwelten/chakren.astro`, `farbwelten/lichtfrequenzen.astro` |
| H11f | `#farbwelten/kompass`, `/farbmeditation`, `/zeitleiste` | dito | dynamisch | 3 Werkzeugseiten (Spektrum, Meditation, Zeitachse) | 3 | `farbwelten/kompass.astro`, `farbmeditation.astro`, `zeitleiste.astro` |

Summen: 10 Hauptseiten + Artikel (10 in A, 22 in B) + 85 Astrologie-Unterrouten + 4 Frequenz-Unterrouten + 11 Pendeln-Unterrouten + 20 Farbwelten-Unterrouten = **140 Hash-Ansichten (A) bzw. 152 (B)**. Mit den 12 Dokumenten sind das **152 (A) bzw. 164 (B) adressierbare Ziele**.

### 2.3 Fehler- und Sonderfälle

| Fall | Ist-Verhalten | Quelle | Astro-Ziel |
|---|---|---|---|
| Unbekannter Pfad | `404.html` mit Status 404 (Pages `custom_404: true`) | `404.html` | `src/pages/404.astro` (Status 404) |
| Unbekannter Hash | Bereich bleibt stehen, `#routeNotice` mit Link „Zur Startseite" | `js/main.js`, `showRouteNotice()` | `src/pages/index.astro`-Shim: unbekannten Hash auf `/404` bzw. Bereichsanfang leiten |
| Unbekannte Astro-Unterroute | bereichsinterne Fehleransicht (`renderNotFound`) | `js/modules/astrologie.js`, `js/modules/farbwelten.js` | `astro`-Fallback je Bereich + `404.astro` |
| Unbekannte Pendeln-Unterroute | bereichsinterne Fehleransicht | `js/modules/radiasthesie-model.js` (`VIEW.notfound`) | dito |
| Unbekannter Artikel | Hinweis „Der Artikel `#blog/<id>` existiert nicht" | `js/main.js` | 404 mit Suchhinweis |
| Alias `#frequenzlabor` | wird auf `#frequenzen/labor` normalisiert (`history.replaceState`) | `js/main.js` | Redirect-Map im Shim |
| Alias `#chakren`, `#lichtfrequenzen` | auf `#farbwelten/…` normalisiert | `js/main.js` | Redirect-Map im Shim |
| Skip-Link `#main` | eigenes Routenziel, nie Seiten-ID | `js/main.js` | normales `<a href="#main">` |

### 2.4 Unbeabsichtigt öffentliche Artefakte (Befund)

Weil Pages das **Repository-Wurzelverzeichnis** ausliefert, sind auch Nicht-Website-Dateien erreichbar. Geprüft mit `curl` (Statuscodes):

| Pfad | Status | Bewertung |
|---|---|---|
| `/Lokal.html`, `/Lokal-404.html`, `/Lokal-impressum.html`, `/Lokal-datenschutz.html`, `/Lokal-haftung.html` | 200 | **Doppelter Inhalt** der ganzen Website (1,6 MB Einzeldatei) unter zweiter URL |
| `/public/index.html`, `/public/styles.css`, 15 weitere Dateien | 200 | veralteter Vorgänger-Build, vollständig abrufbar |
| `/docs/frequenz-quellen.md`, `/docs/polish-review.md`, `/docs/design-tokens.md`, `/docs/adr-frequenzlabor.md` u. a. | 200 | interne Dokumentation öffentlich |
| `/AGENTS.md`, `/README.md`, `/package.json`, `/eslint.config.cjs` | 200 | Projektinterna öffentlich |
| `/tests/api.test.js`, `/qa/01-funktional.spec.js` | 200 | Testcode öffentlich |
| `/evidence/reparatur-codex/pruefnachweis.json` | 200 | Prüfnachweise öffentlich |
| `/content/farbwelten/rot.md` | **404** | Jekyll rendert die Datei zu `rot.html` (200) — siehe Risiko R9 |
| `/.gitignore` | 404 | Punktdateien werden von Pages nicht ausgeliefert |

`robots.txt` verbietet nur `/Esoterik-Welt/tests/` und `/Esoterik-Welt/src/` — `src/` existiert nicht, `docs/`, `evidence/`, `qa/`, `content/`, `public/`, `Lokal*.html` sind **nicht** ausgeschlossen. Für die Migration ist das ein Mitnahmeeffekt: Astro liefert nur `dist/`, damit entfällt die Exposure strukturell.

---

## 3. Asset-Inventar

Gesamt: **644 Dateien, 94 MB** unter `assets/` (plus `data/crystals.json` mit Bildmetadaten).

| Gruppe | Pfad | Anzahl | Volumen | Format / Breiten | Nutzungskontext | Astro-Ziel |
|---|---|---|---|---|---|---|
| Tarot-Deck 1 | `assets/tarot/nachtatelier-v1/{300,600,1200}/` | 79 × 3 = 237 | 34 MB | JPG, 300/600/1200 px, 78 Karten + `Ruecken.jpg` | `cardAssetPath()` in `js/data/tarot-decks.js`; Karte, Detail, Zoom | `src/assets/tarot/nachtatelier-v1/` + `astro:assets` (`<Image>`/`<Picture>`) |
| Tarot-Deck 2 | `assets/tarot/gartenbrevier-v2/{300,600,1200}/` | 79 × 3 = 237 | 23 MB | JPG, gleiche Stufen | Deckauswahl (`SUPPORTED_DECK_IDS`) | dito |
| Tarot-Manifeste | `assets/tarot/*/manifest.json` | 2 | 120 KB | JSON (bytegenau getestet) | Prüfsummen/Deck-Metadaten | `src/data/tarot-decks.ts` (typisiert) |
| Kristalle | `assets/crystals/{320,640,960,1280}/` | 30 × 4 = 120 + `assets/crystals/manifest.json` | 6,6 MB | WebP | `data/crystals.json` → `image`, `image_stem`; Katalog + Detail | `src/assets/crystals/` + `astro:assets` |
| Radiästhesie-Fotos | `assets/radiasthesie/media/{520,1040}/` | 13 + 11 | 2,9 MB | WebP + AVIF (AVIF noch ungenutzt), 1 PNG | Figuren in Themenseiten (`<picture>`-fähig) | `src/assets/radiasthesie/` + `<Picture formats={['avif','webp']}>` |
| Radiästhesie-Originale | `assets/radiasthesie/media/original/` | 6 | 27 MB | JPG/PNG (6–22 MB) | Nur Quelle für Ableitungen, **nicht ausgeliefert nötig** | `_sources/` außerhalb `public/` (nicht deployen) |
| Radiästhesie-Zeichnungen | `assets/radiasthesie/*.svg` | 4 | ~40 KB | SVG (eigene Zeichnungen) | Instrumente/Pendeltafel/Orakelkarten | `src/assets/radiasthesie/` |
| Bildnachweise | `assets/radiasthesie/media/{ATTRIBUTION.md,bildnachweis.html,media-manifest.json}` | 3 | ~45 KB | MD/HTML/JSON | Nachweispflicht (Impressum), Manifest mit Begründungen | Content Collection `attribution` + `impressum.astro` |
| Schriften | `assets/fonts/` | 5 | 944 KB | Fraunces (TTF, +Italic), Manrope (TTF), 2 × OFL-Text | `@font-face` in `css/design-system.css`; Preload in `index.html` | `src/assets/fonts/` + `<link rel=preload>` im Layout; Lizenztexte nach `impressum` |
| Symbolbilder Startseite | `assets/mineral/` (2), `assets/cosmos/` (2) | 4 | 580 KB | JPG (2400/1000 px), SVG + JSON | Hero/Startseitenblöcke (`index.html` `<img src=…>`) | `src/assets/` + `astro:assets` |
| Favicon | `assets/favicon.svg` | 1 | <1 KB | SVG | alle Dokumente | `public/favicon.svg` |
| **Fehlend** | `assets/og-preview.png` | 0 | — | — | README nennt sie als „referenziert, nicht im Repo"; im aktuellen `index.html` gibt es **kein** `og:image` | Neu erzeugen (offene Frage F6) |

Nicht-Assets, aber Auslieferungsbestandteil: `css/` (5 Dateien, 252.534 B), `js/` (1,8 MB Quelltext), `data/` (204 KB), `content/` (180 KB), `public/` (193 KB, **Altlast**).

**Toter Bestand (Kandidaten für Nicht-Übernahme):** `public/` (kompletter Vorgänger-Build), `js/main.js.bak`, `js/modules/tarot.js.bak`, `js/modules/runes.js.bak2`, `js/modules/_tarot_old.js`, `data/articles/article-010.md.bak`, `merge_runes.py`, `write_runes.py`, `js/data/crystals.js` (36 Steine, von keinem Modul importiert — die UI liest `data/crystals.json` mit 30 Steinen), `data/runes.json` und `data/tarot.json` (nur von `merge_runes.py`/README referenziert, zur Laufzeit unbenutzt).

**Externe Embeds: keine.** Geprüft: kein `<script src="http…">`, kein `<iframe>`, kein `@import url(http…)`, keine Analytics-, Consent-, Karten- oder Video-Einbettung. Externe `http(s)`-Vorkommen sind ausschließlich **ausgehende Quellenlinks** (DOI, Wikipedia, GWUP, USGS …) in Zitaten und Bildnachweisen. Schriften liegen lokal.

---

## 4. Inhalts-Inventar

### 4.1 Seiten und Bereiche

- **Startseite:** Hero, „Pfade der Erkenntnis" mit **9** nummerierten Zugängen (Tarot, Kristalle, Mondphasen, Astrologie, Frequenzen, Runen, Pendeln, Farben, Wissen), 4 Themenblöcke (Stein, Kosmos, Tarot-Ziehung, Mond), Footer mit 3 Spalten (Tools, Wissen, Rechtliches).
- **Hauptnavigation:** **10** Ziele (`#home`, `#tarot`, `#crystals`, `#moon`, `#astrologie`, `#frequenzen`, `#runes`, `#pendeln`, `#farbwelten`, `#blog`).
- **4 Dialoge:** Karten-Detail, Kristall-Detail, Runen-Detail, Artikel (jeweils `role="dialog"`, Fokusfalle in `js/dialog.js`).

### 4.2 Datenbestände (jeweils mit Quelle im Repo)

| Bereich | Datei | Umfang (verifiziert) | Inhalt |
|---|---|---|---|
| Tarot | `js/data/tarot.js` (42 KB) | 78 Karten, 22 Major Arcana, `TAROT_DECK_ID = nachtelier-v1` | Rider-Waite-Smith, Public Domain, Disclaimer-Konstante |
| Tarot-Decks | `js/data/tarot-decks.js` | 2 Decks × 78 Karten, 3 Größenstufen | Deckauswahl, `localStorage`-Schlüssel |
| Kristalle | `data/crystals.json` (47 KB, **vom Modul geladen**) + `js/data/crystals.js` (17 KB, **totes Duplikat**) | **30** Steine im Katalog (mit Bild); die ältere Datei `js/data/crystals.js` enthält 36 Steine, wird aber von keinem Modul importiert | Formel, Mohs-Härte, Chakra, Farbe, Wirkungstext, Bild + vollständiger Bildnachweis je Stein |
| Runen | `js/data/runes.js` | **24** Runen, 3 Ættir (je 8) | Elder Futhark, Deutung |
| Mond | `js/data/moon.js`, `data/moon-astro.mjs` | 8 Phasen, 4 Vertiefungsblöcke, 3 Quellen | synodische Periode 29,53059 d, Referenz 2000-01-06, iCal-Export (Blob) |
| Astrologie | `js/data/astrologie.js` (272 KB, generiert) | Zeichen 12, Faktoren 10, Häuser 12, Aspekte 5, Grundlagen 24, Beispiele 4, FAQ 15, Glossar 65, Lernpfad 6, Quellen 25, Claims 28 | Stand `2026-11-01`, Version `1.0.0`, Kennzeichnung Tradition/Astronomie/Konvention/Empirie |
| Frequenzen | `data/frequencies.json` (32 KB) | Presets + Evidenzstatus + Playback-Mapping | Solfeggio, Schumann, EEG-Bänder, binaural |
| Farbwelten | `content/farbwelten/*.md` (18 Dateien) → `js/data/farbwelten.js` (212 KB) | **12** Farben, **3** Themenseiten, 5 Landing-Abschnitte, 8 Abschnitte je Farbe, 16 Quellen | Redaktionsquelle mit YAML-Frontmatter; Generator `scripts/generate-farbwelten-data.cjs`, Sync-Guard `scripts/verify-farbwelten-sync.cjs` |
| Radiästhesie | `js/data/radiasthesie.js` (255 KB) | 3 Themen, 32 Kapitel, 66 Quellen, 17 Glossarbegriffe, 5 Evidenzstufen, 6 Fotos, 4 Zeichnungen, Stand `2026-11-03` | generiert aus Redaktionsquellen, inkl. Rechtstexten |
| Radiästhesie-Werkstatt | `js/data/radiasthesie-werkstatt.js` | 7 Instrumente, 7 Studien, 3 Experimente, 10 Medien | Verträge für Simulation/Studio/Experiment/Journal |
| Chakren | `js/data/chakren.js` | 7 Chakren | Position/Farbe/Zuordnung (Farbwelten-Sonderseite) |
| Artikel | `js/data/articles.js` + `js/article-content.js`; in B zusätzlich `js/data/articles-markdown.js` (Generator `scripts/generate-articles-data.cjs`) | Stand A: **10** registrierte Artikel (IDs 1–10), 6 Kategorien. Stand B: **22** (10 kuratiert + 12 generierte, IDs 11–22) | Markdown-Inhalte, Titel, Excerpt, Datum; in B aus 12 Markdown-Dateien erzeugt |

**Befund Artikelbestand:** In Stand A liegen `data/articles/article-11.md` und `data/articles/article-12.md` als Redaktionsdateien vor, sind aber in `js/data/articles.js` **nicht registriert** und damit nicht erreichbar. Stand B hat das gelöst: alle 12 Markdown-Dateien werden zu den Artikeln 11–22 generiert und im Blog-Modul mit den kuratierten 10 zusammengeführt (`this.articles = [...curated.articles, ...markdown.articlesMarkdown].sort(…)`). Dabei überlappen die Themen der beiden Bestände stark (z. B. „Chakren & Kristalle" ↔ „Kristalle für jedes Chakra", „Runenwerfen: Die drei Positionen" ↔ „Runenlesen: Die 3-Runen-Legung") — siehe Risiko R15.

### 4.3 Wiederverwendete Textbausteine

| Baustein | Vorkommen | Migrationsziel |
|---|---|---|
| Design-Tokens (Farben, Typografie, Radien, Schatten) | `css/design-system.css` (40.881 B) | `src/styles/tokens.css` (eine Quelle) |
| Disclaimer „keine medizinische Wirkaussage" | Tarot (`TAROT_DISCLAIMER`), Kristalle, Farbwelten (Health-Disclaimer je Farbseite), Radiästhesie (`legal`) | `<Disclaimer variant="…">`-Komponente mit zentralem Textregister |
| Evidenzstufen-Legende A–E | Radiästhesie (methodik + Themenseiten), Astrologie (Kennzeichnungstypen) | `<EvidenceLegend>`-Komponente, Daten in `radiasthesie.levels` |
| Brotkrumen/Trail je Bereich | Astrologie, Radiasthesie (mit `breadcrumbList`-JSON-LD) | `<Breadcrumbs>` + automatisches `BreadcrumbList` |
| Bereichs-Navigation (Unterrouten) | Astrologie, Pendeln, Frequenzen, Farbwelten (`renderViewNav`) | `<AreaNav>` je Bereich |
| Quellen-/Zitationsdarstellung | Astrologie (25 Quellen/28 Claims), Radiästhesie (66), Farbwelten (16 + lokale Register) | `<Citation>`, `<SourceList>`; Bibliografie je Dokument (Register dürfen lokal abweichen) |
| Rechtstexte | `impressum.html`, `datenschutz.html`, `haftung.html` | Content Collection `legal` (Markdown), 1:1 übernommen |

### 4.4 Formulare und Endpunkte

**Es gibt kein Formular-Backend.** Kein `<form action=…>`, kein `method`, kein `fetch` auf einen eigenen Endpunkt. Alle „Formulare" sind clientseitig:

| Formular | Ort | Wirkung | Persistenz |
|---|---|---|---|
| Suche Zeichen/Faktoren/Grundlagen/Glossar/Astrologie-Suche | `js/modules/astrologie-views.js` (`data-astro-form`) | `history.replaceState` + Neurendern | URL-Query |
| Suche Glossar/Bereichssuche Pendeln | `js/modules/radiasthesie-views.js` (`data-rad-form`) | dito | URL-Query |
| Artikelsuche | `#articleSearch` (Startseite) | Filter der Liste | keiner |
| Kristallsuche | `#crystalSearch` | Filter des Katalogs | keiner |
| Pendeltafel-Editor | `#ptfForm` | Tafel im Browser erzeugen | keiner (bewusst nicht in URL) |
| Pendeltagebuch | `#jrForm` | Eintrag anlegen | `localStorage` `esot_rad_journal_v1` |
| iCal-Export | `#icalBtn` | Blob-Download `mondphasen-<jahr>.ics` | keiner |

`localStorage`-Schlüssel (Origin-gebunden!): `esot_crystals_fav`, `esoterik_tarot_deck`, `esoterik_tarot_history`, `esoterik_runes_history`, `esoterik-welt:frequenzlabor:v1`, `esoterik-welt:frequenzlabor:meditation:v1`, `esot_rad_experiment_v1`, `esot_rad_journal_v1`.

Der Express-Vorschauserver (`index.js`) bietet nur `GET /api/health` und statische Auslieferung von `dist/Esoterik-Welt`; er ist **nicht** der Produktionsserver.

---

## 5. Technische Abhängigkeiten

### 5.1 Architektur

| Aspekt | Ist-Zustand |
|---|---|
| Framework | **keines** (Vanilla JS, native ES-Module, IIFE-freier Einstieg `js/main.js`) |
| Template-Engine | keine; HTML steht in `index.html` und wird zur Laufzeit per `innerHTML` aus JS-Strings erzeugt |
| Build (Produktion) | `scripts/build-pages.cjs`: erzeugt zuerst die 7 Radiästhesie-Seiten, kopiert dann Whitelist (`index/impressum/datenschutz/haftung/404/robots/sitemap/css/js/data/assets/radiasthesie/content`) + `docs/frequenz-quellen.md` nach `dist/Esoterik-Welt` und ruft den Offline-Build auf |
| Build (Offline) | `scripts/build-local.cjs`: **webpack 5** bündelt `js/main.js` zu einer IIFE-Datei, bettet `data/crystals.json`, `data/frequencies.json` und `docs/frequenz-quellen.md` ein → `Lokal.html` (1,64 MB) |
| CSS-Ansatz | handgeschriebenes CSS mit Custom Properties, 5 Dateien, kein Tailwind/PostCSS/Sass; `prefers-reduced-motion`, Print- und Kontrastvarianten in `css/design-system.css` |
| Daten-Generatoren | 4: `scripts/generate-astrologie-data.cjs`, `scripts/generate-radiasthesie-data.cjs`, `scripts/generate-farbwelten-data.cjs`, `scripts/generate-tarot-data.cjs` + `scripts/generate-radiasthesie-pages.cjs`; mehrere Byte-Vergleichstests (`verify:sync`) |
| Routen | Hash-Routing, `parseRoute()` in `js/main.js`; Bereiche parsen eigene Untersegmente + Query |
| Typen | nur punktuell: `js/modules/frequenz-engine.d.ts`, `js/types.ts`, `js/types.js` |
| A11y | Skip-Link, Fokusfalle in Dialogen, `aria-current`, `role="status"`-Ansagen, `prefers-reduced-motion` |
| Sicherheit | keine Serverlogik, keine Authentifizierung, keine Secrets im Frontend |

### 5.2 npm-Abhängigkeiten und Versionen (`package.json`)

| Paket | Version | Rolle |
|---|---|---|
| `express` | `^4.18.0` | **einzige** Laufzeitabhängigkeit (Vorschauserver `index.js`, nicht produktiv) |
| `eslint` / `@eslint/js` | `9.39.1` (gepinnt) | Lint, `--max-warnings 0` |
| `prettier` | `3.6.2` (gepinnt) | Formatprüfung |
| `jest` | `^29.0.0` | Unit-/API-Tests |
| `playwright` | `^1.64.1` | 224 Browsertests + Screenshots + Offline-Prüfung |
| `webpack` / `webpack-cli` | `^5.0.0` | nur Offline-Bundle |
| `@lhci/cli` | `^0.15.1` | Lighthouse-CI |
| `supertest` | `^7.3.1` | API-Test des Vorschauservers |
| `nodemon` | `^3.0.0` | Entwicklung |
| `globals` | `16.5.0` | ESLint-Umgebungen |

Node-Version in CI: **20**. Skripte: **52** npm-Skripte, davon 20 Test-/Prüfkommandos (`test:all` verkettet sie).

### 5.3 Hosting, Deploy, Domain

| Aspekt | Ist-Zustand |
|---|---|
| Hosting (Stand A, live) | GitHub Pages, Branch `main`, Pfad `/`, `build_type: legacy` (Jekyll-Pipeline aktiv) |
| URL (Stand A) | `https://ingbms.github.io/Esoterik-Welt/` (Projektpfad, `base = /Esoterik-Welt/`) |
| Domain/DNS | **keine eigene Domain aktiv** (`cname: null`), kein `CNAME`-File, HTTPS erzwungen. Ziel laut Auftrag: `velarkana.de` bei INWX, noch nicht konnektiert — DNS-Änderung erst nach Freigabe |
| Deploy-Automatik (Stand A) | keine; Push auf `main` löst den Pages-Build aus (kein Deploy-Job in `.github/workflows/ci.yml`) |
| Deploy-Automatik (Stand B) | `.github/workflows/publish-pages.yml`: Auslöser Tag `release/**` oder manueller Lauf; Kette build → build:publish → check:public → check:secrets → Dry-run, dann Push des Artefakts in das öffentliche Repo `ingbms/velarkana`; Secret `VELARKANA_PUBLISH_TOKEN`, fail-closed bei fehlenden Voraussetzungen |
| Konfiguration (Stand B) | `config/site.json` ist die eine Quelle für Produkt, Origin und Basis-Pfad: `{"product":"VELARKANA","origin":"https://ingbms.github.io","basePath":"/velarkana/","environment":"interim","repositories":{"source":"…/velarkana-dev","publish":"…/velarkana"}}` |
| Veröffentlichungs-Repos | Quelle privat `ingbms/velarkana-dev`; Ziel öffentlich `ingbms/velarkana` — **existiert noch nicht** (`gh api` → 404, Pages unter `/velarkana/` → 404) |
| CI | 4 Jobs: `lint`, `unit-test`, `build` (mit `verify:build`), `browser-e2e`; Commit-Statuses `ci/lint`, `ci/unit-test`, `ci/build`, `ci/browser-e2e` |
| Alternative Wege (dokumentiert, ungenutzt) | Netlify, Vercel, Surge (`README.md` §Deploy) |
| Qualitätsbudgets | Lighthouse: Performance ≥ 0,90 (Ist **0,87**, bekanntes Risiko), A11y ≥ 0,95, Best Practices/SEO ≥ 0,90; Frequenz-NFR: 92.000 B gzip Gesamt (Ist 89.171 B), 100.000 B Feature-JS, 6.000 B Feature-CSS |
| Jekyll-Effekt | Markdown **mit** YAML-Frontmatter wird zu `.html` gerendert (`content/farbwelten/rot.md` → `rot.html`), Markdown **ohne** Frontmatter bleibt roh (`docs/*.md` mit `text/markdown`) |

---

## 6. SEO-Baseline (Abgleichsbasis für Parität)

### 6.1 Dokumente, Titel, Descriptions, Canonicals

Zitiert wird **Stand A (live, indexiert)**. Stand B (Arbeitsprojekt) trägt dieselben Texte mit „VELARKANA" statt „Esoterik-Welt"; Abweichungen stehen in §11.5. Vor der Paritätsprüfung (P6) ist die Baseline auf den dann tatsächlich veröffentlichten Stand umzustellen.

| URL | `<title>` (Ist, live verifiziert) | Meta-Description | Canonical | JSON-LD |
|---|---|---|---|---|
| `/` | `Esoterik-Welt \| Tarot, Kristalle, Runen, Mondphasen & Mehr` | „Esoterik-Welt — Deine Pforte zu Tarot, Kristallen, Runen, Mondphasen und esoterischem Wissen." | `https://ingbms.github.io/Esoterik-Welt/` | – |
| `/impressum.html` | `Impressum — Esoterik-Welt` | „Impressum, Bild- und Schriftennachweise der Esoterik-Welt." | `…/impressum.html` | – |
| `/datenschutz.html` | `Datenschutz — Esoterik-Welt` | „Datenschutzerklärung der Esoterik-Welt: keine Tracker, keine Cookies, lokale Speicherung." | `…/datenschutz.html` | – |
| `/haftung.html` | `Haftungsausschluss — Esoterik-Welt` | „Haftungsausschluss der Esoterik-Welt: Information, keine medizinische oder rechtliche Beratung." | `…/haftung.html` | – |
| `/404.html` | `Seite nicht gefunden — Esoterik-Welt` | „Die angeforderte Seite existiert nicht. Zurück zur Startseite oder Suche." | – | – |
| `/radiasthesie/` | `Radiästhesie, Pendeln und Orakel — Tradition und Prüfstand` | „…Instrumente, Geschichte und Forschungsstand — mit Kennzeichnung von Tradition und Befund, ohne Wirkungsversprechen." | `…/radiasthesie/` | 1 Block |
| `/radiasthesie/radiasthesie.html` | `Radiästhesie — Ruten, Geschichte und Forschungsstand` | „…Begriffsgeschichte, Instrumente, Erdstrahlen und Forschungsstand — mit Evidenzstufen A–E und offenem Datierungskonflikt." | eigene URL | 1 |
| `/radiasthesie/pendeln.html` | `Pendeln — Arten, Materialien, Tafeln und Bovis-Skalen` | „…Geschichte seit 371 n. Chr., Arten, Antwortkonventionen und Mechanik — kontrollierte Tests und offene Fragen…" | eigene URL | 1 |
| `/radiasthesie/orakel.html` | `Orakel — Pendelorakel, Tarot, Runen und I Ging im Vergleich` | „…Tarot seit den 1440ern, I Ging, Runen und Delphi — Geschichte, Praxis und Forschungslage, ohne Prognoseversprechen." | eigene URL | 1 |
| `/radiasthesie/glossar.html` | `Glossar — Radiästhesie, Pendeln und Orakel von A bis Z` | „…mit Evidenzstufe A–E und Quellenverweis, ohne Wirkungsversprechen." | eigene URL | 1 |
| `/radiasthesie/quellen.html` | `Quellen und Belege — Radiästhesie und Pendeln` | „Alle 66 Quellen des Themenmoduls mit Typ, Jahr, Prüftiefe, Interessenvermerk…" | eigene URL | 1 |
| `/radiasthesie/methodik.html` | `Methodik und Grenzen — wie dieser Bereich prüft` | „Wie dieses Modul prüft: Arbeitsannahme, Kennzeichnung A–E, Quelleninteressen, Grenzen und Datenschutz." | eigene URL | 1 |

Die sieben Radiästhesie-Dokumente tragen zusätzlich `<meta name="robots" content="index,follow">`.

### 6.2 Titel/Descriptions der Hash-Ansichten (`PAGE_META` in `js/main.js`)

Diese Meta-Daten werden **zur Laufzeit** in `document.title` und die Meta-Tags geschrieben; im ausgelieferten HTML stehen sie nicht. Für Crawler existiert genau **ein** Titel- und Description-Satz pro Dokument.

| Ansicht | Laufzeit-Titel | Laufzeit-Description |
|---|---|---|
| `#home` | Esoterik-Welt \| Tarot, Kristalle, Runen, Mondphasen & Mehr | …Deine Pforte zu Tarot, Kristallen, Runen, Mondphasen und esoterischem Wissen. |
| `#tarot` | Tarot — 78 Karten, Tageskarte & Legungen \| Esoterik-Welt | Tarot-Karten ziehen und deuten: 78 Karten der Major und Minor Arcana, Tageskarte und 3-Karten-Legung. |
| `#crystals` | Kristalle & Steine — Chakra, Farbe, Wirkung \| Esoterik-Welt | Kristall-Katalog mit Chakra-, Farb- und Wirkungsfilter… |
| `#moon` | Mondphasen, Kalender & Deutung \| Esoterik-Welt | Aktuelle Mondphase mit Beleuchtungsgrad, Zeitachse… und iCal-Export. |
| `#runes` | Runen — Das ältere Futhark \| Esoterik-Welt | 24 Runen des älteren Futhark: 3-Runen-Wurf, Einzelrune, Deutung und Wurf-Historie. |
| `#astrologie` | Astrologie — Zeichen, Faktoren, Häuser, Aspekte \| Esoterik-Welt | Astrologie lernen und nachschlagen: zwölf Zeichen, zehn Faktoren, zwölf Häuser, fünf Hauptaspekte… |
| `#blog` | Wissen & Artikel — Esoterik, Rituale, Geschichte \| Esoterik-Welt | Artikel zu Esoterik, Spiritualität und alter Weisheit… |
| `#frequenzen` | Frequenzen & Schwingungen — Bibliothek und Frequenzlabor \| Esoterik-Welt | Frequenzbibliothek mit Evidenzstatus und interaktives Frequenzlabor… |
| `#frequenzen/quellen` | Quellen & Methodik der Frequenzbibliothek \| Esoterik-Welt | Quellendokument zum Frequenzbereich: Suchstrategie, Aufnahmekriterien… |
| `#pendeln` | Radiästhesie, Pendeln und Orakel — Tradition und Prüfstand | Radiästhesie, Pendeln und Orakel: Instrumente, Geschichte und Handhabung… |
| `#farbwelten` | Farbwelten — Bedeutung, Physik und Tradition der Farben \| Esoterik-Welt | Zwölf Farbwelten zwischen Licht, Wahrnehmung und Tradition… |
| Artikel (offen) | `<Artikeltitel> — Esoterik-Welt` | Artikel-Excerpt |

Farbwelten setzt zusätzlich pro Farb-/Themenseite eigene Titel/Descriptions und JSON-LD; Astrologie setzt **nur** `document.title`, keine eigene Description, kein Canonical, kein JSON-LD.

### 6.3 Sitemap, robots, strukturierte Daten

- **`sitemap.xml`:** **11 `<loc>`-Einträge** (Startseite, 3 Rechtsseiten, 7 Radiästhesie-Dokumente), `lastmod` 2026-11-01…2026-11-03, keine `<priority>`/`<changefreq>`, keine Hash-URLs. Live ausgeliefert und inhaltlich identisch.
- **`robots.txt`:** `Allow: /`; `Disallow: /Esoterik-Welt/tests/`, `/src/` (existiert nicht), `/node_modules/`; `Sitemap:`-Verweis. **Nicht** ausgeschlossen: `docs/`, `evidence/`, `qa/`, `content/`, `public/`, `Lokal*.html`, `package.json`.
- **Strukturierte Daten:** 7 JSON-LD-Blöcke (je einer in den 7 Radiästhesie-Dokumenten) (`BreadcrumbList` mit Fehler bei Fragmentadressen, Bereichs-/Dokumenttyp), dynamisch erzeugte JSON-LD in Farbwelten (`ColorWorld`/`Topic`/`Chakra`/`Compendium`-ähnliche Knoten) — **nicht** im HTML-Quelltext, also crawlerabhängig. Startseite und Astrologie: **kein** JSON-LD im ausgelieferten HTML.
- **Canonical-Strategie:** Alle 140 Hash-Ansichten zeigen auf `https://ingbms.github.io/Esoterik-Welt/`. Farbwelten setzt `CANONICAL_ORIGIN#farbwelten/<slug>` — das ist für Suchmaschinen **dieselbe** URL wie `/` (Fragmente werden ignoriert). Astrologie setzt gar kein eigenes Canonical.
- **Origin fest verdrahtet:** `https://ingbms.github.io/Esoterik-Welt/` steht in 19 Dateien (u. a. `sitemap.xml` 11×, `js/main.js`, `js/modules/farbwelten.js` 9×, `js/modules/radiasthesie-seo.js`, `scripts/generate-radiasthesie-pages.cjs` 6×). Ein Domainwechsel erfordert Änderungen an allen Stellen — in Astro eine Konstante (`PUBLIC_SITE_ORIGIN`) plus `import.meta.env.BASE_URL`.

### 6.4 SEO-Schwächen des Ist-Zustands (Ausgangspunkt der Migration)

1. **140 Ansichten, 1 Dokument:** Nur 12 URLs sind als Dokumente indexierbar. Astrologie (85 Unterseiten), Farbwelten (20), Frequenz-Werkzeuge, Artikel und Tarot/Kristalle/Runen/Mond existieren für Crawler nicht als eigene Seiten.
2. **Meta-Tags zur Laufzeit:** Titel/Descriptions der Hash-Ansichten sind für Crawler ohne JS-Rendering unsichtbar.
3. **Canonical-Kollaps:** Alle Ansichten zeigen auf `/`; Farbwelten-Canonicials mit `#` sind wirkungslos.
4. **JSON-LD nur dynamisch** (Farbwelten) oder gar nicht (Startseite, Astrologie).
5. **Doppelter Inhalt** unter `/Lokal*.html` und `/public/`.
6. **`og:image` fehlt** (`assets/og-preview.png` nicht vorhanden).
7. **Performance 0,87** unter dem eigenen Budget 0,90 (Fonts/Assets).

---

## 7. Migrationsplan: Phasen und Reihenfolge

Aufwandsangaben sind **Spannen mit Annahmen**, keine Zusagen: 1 Entwickler:in, vorhandene Tests und Daten werden weiterverwendet, kein neues Design, keine neuen Inhalte.

| Phase | Inhalt | Ergebnis | Abnahmegate | Aufwand |
|---|---|---|---|---|
| **P0 Inventar** (diese Aufgabe) | Route-, Asset-, Inhalts-, Abhängigkeits- und SEO-Inventar; Migrationsplan | `docs/migration-plan.md` | Dokument vorhanden, jede Route hat Zielstruktur, Risiken benannt | erledigt |
| **P1 Gerüst** | Astro + TypeScript (`strict`), Verzeichnisstruktur, `PUBLIC_SITE_ORIGIN`/`BASE_PATH`, Layout-Shell (Header/Nav/Footer) aus `index.html`, Design-Tokens als eine CSS-Quelle, CI-Jobs (lint/typecheck/build/test) | baubares Projekt, das `/` und `/404.html` erzeugt; Deploy-Preview auf separater Pages-URL | `astro build` grün, `tsc --noEmit` grün, Titel/Description der Startseite identisch zur Baseline (§6.1) | 2–3 PT |
| **P2 Dokumente** | 12 Dokumente aus §2.1 portieren: Rechtsseiten (1:1), 7 Radiästhesie-Seiten aus derselben Datenquelle wie heute (`js/modules/radiasthesie-seo.js` → `src/data/radiasthesie-seo.ts`), 404 | 12 URLs mit byte-gleicher Textsubstanz, identischen Titeln/Descriptions/Canonicals und JSON-LD | Sitemap-Parität (11 `<loc>`), Canonical-Diff = 0, `robots`-Meta der 7 Dokumente erhalten | 3–5 PT |
| **P3 Daten- und Content-Schicht** | `js/data/*.js` → typisierte Module/Content Collections mit Zod-Schemas; `content/farbwelten/*.md` (18) als Collection; 10 Artikel als Collection (`article-11/12` klären); `data/crystals.json`, `data/frequencies.json` validiert; Generatoren durch Build-Schritte ersetzen; Attribution als Collection | Build erzeugt dieselben Datensätze wie heute, ohne Byte-Vergleichstests | Anzahlvergleich gegen §4.2 (12/10/12/5/24/4/15/65/6/25/28, 30 Steine, 24 Runen, 78 Karten, 66 Quellen, 18 Farbdokumente), Zod validiert alles | 4–6 PT |
| **P4 Bereichsportierung** | Reihenfolge nach Risiko: (a) Astrologie (85 textlastige Seiten), (b) Farbwelten (20 Seiten + 3 Werkzeuge), (c) Artikel/Wissen (23 Ansichten in B), (d) Tarot/Kristalle/Runen/Mond (Inseln), (e) Frequenzlabor (Audio-Budget!), (f) Pendeln-Werkzeuge (Simulator, Studio, Experiment, Journal) | jede Hash-Ansicht hat eine eigene URL mit eigenem Titel/Description/Canonical | Route-Parität 164/164 (Stand B), je Bereich ein Smoke-Test, Kerninteraktionen je Bereich nachgewiesen | 12–20 PT |
| **P5 Redirects & Deep-Links** | Legacy-Hash-Shim auf `/` (Map `#…` → neue URL, inkl. Aliase `#frequenzlabor`, `#chakren`, `#lichtfrequenzen`); `<link rel="canonical">` je Seite; neue `sitemap.xml` (alle neuen URLs), `robots.txt` ohne Repo-Interna; `404` mit Suchhinweis | alte Links landen auf der richtigen Seite; Sitemap enthält alle kanonischen URLs | 20 Stichproben alter Links (auch `#blog/5`, `#astrologie/zeichen/widder`, `#pendeln/glossar?b=R`, `#farbwelten/rot/physik`) führen zum Ziel | 2–3 PT |
| **P6 Parität & Abnahme** | automatisierte Paritätstests: Routenliste, Titel/Description/Canonical je URL, JSON-LD-Validierung, Anker-IDs, Lighthouse-Budgets, axe-Scan, Linkcheck; dazu Sichtprüfung 375/768/1440 px | messbarer Paritätsbericht | jedes Abnahmekriterium in §10 mit Beleg | 4–6 PT |
| **P7 Cutover** | Pages-Quelle auf Astro-Build umstellen (oder neue Domain), alte Artefakte (`Lokal*.html`, `public/`, `docs/`, `tests/`, `qa/`, `evidence/`, `package.json`) aus dem Deploy-Pfad entfernen, `sitemap`/`robots` live prüfen, Suchkonsole beobachten | veröffentlichte VELARKANA-Site, Baseline-Stand nachweislich ersetzt | Live-Prüfung: 12+ neue URLs 200, keine Repo-Interna 200, Sitemap live = Build, Rich-Results-Test für 3 Dokumente | 1–2 PT |

**Gesamtspanne: 28–45 Personentage** (Annahmen s. o.; ohne Redaktionsarbeit an Inhalten).

**Reihenfolgebegründung:** P2 vor P3, weil die 7 generierten Dokumente die einzige SEO-Parität sind, die heute schon existiert — sie müssen zuerst byte-nah stehen. Astrologie vor Farbwelten, weil Astrologie die größte Zahl textlastiger Seiten ohne Interaktion hat (höchster SEO-Gewinn pro Aufwand); Frequenzlabor und Pendeln-Werkzeuge zuletzt, weil sie Audio-, Canvas- und Speicherlogik tragen und die Budgets (92.000 B gzip) am ehesten sprengen.

---

## 8. Risiken

| ID | Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|---|
| **R1** | **Hash-Routen sind nicht server-seitig umleitbar.** GitHub Pages kennt kein `_redirects`/301. Alte Deep-Links (`#astrologie/zeichen/widder`) treffen nach dem Umbau eine Seite ohne diesen Anker. | Backlinks und geteilte Links laufen ins Leere; Nutzer sehen 404 statt Inhalt | Client-Shim auf `/` (Map + `location.replace`), vollständige Map in `src/lib/legacy-routes.ts`, Test über alle Familien; zusätzlich `canonical` auf der Zielseite. Restrisiko: Nutzer ohne JS. |
| **R2** | **Domainwechsel löscht Nutzerdaten.** Alle 8 `localStorage`-Schlüssel sind origin-gebunden. Wechsel von `ingbms.github.io` auf `velarkana.de` macht Favoriten, Tarot-Verlauf, Frequenz-/Meditationspräferenzen, Experiment- und Journaldaten unsichtbar. | Datenverlust aus Nutzersicht, Supportfälle | Migrationshinweis im UI („Daten aus der Vorgängerversion übernehmen"), optional Export/Import-JSON je Speicher; Entscheidung nötig (F2) |
| **R3** | **SEO-Kollaps auflösen heißt URL-Vermehrung.** Aus 12 Dokumenten werden > 150 URLs. Falsche Canonicals, doppelte Inhalte oder unvollständige Sitemap können bestehende Rankings verwässern. | Sichtbarkeitsverlust in der Übergangszeit | Paritätstests für Titel/Description/Canonical je URL, Sitemap aus einer Quelle, `robots`-Prüfung, Search-Console-Begleitung 4 Wochen |
| **R4** | **Doppelte Inhaltsquellen.** Farbwelten existieren als 18 Markdown-Dateien **und** als generiertes 212-KB-JS-Modul; Astrologie/Radiästhesie sind ebenfalls generiert. Wird eine Quelle gepflegt und die andere nicht, entsteht stiller Inhaltsdrift. | falsche oder veraltete Inhalte nach Migration | P3 macht Markdown zur einzigen Quelle, Generatoren entfallen; ein Sync-Test bleibt als Guard |
| **R5** | **Testkopplung an DOM-IDs.** 224 Playwright-Fälle und 361 Node-/Jest-Fälle hängen an heutigen Selektoren (`#articleSearch`, `#ptfForm`, `.fq-*`). | Migration wirkt „grün", obwohl Tests ersetzt statt übertragen wurden — oder Rot ohne Aussage | Tests bereichsweise portieren, Abdeckungsmatrix je Bereich, kein Bereich gilt ohne seine Interaktionstests als migriert |
| **R6** | **Performance-Budget.** Ist 0,87 < 0,90; 94 MB Assets, Tarot allein 57 MB mit 3 Größenstufen. | Budget bleibt gerissen, Migration wird dafür verantwortlich gemacht | `astro:assets` (responsive `srcset`, AVIF/WebP), Lazy Loading, Font-Subsetting; Budget je Seite in CI |
| **R7** | **Frequenz-NFR (92.000 B gzip).** Das Frequenzlabor hält nur 2.829 B Reserve. Astro-Overhead, Insel-Hydration oder doppelte Bundles sprengen das Limit. | Gate rot, Feature muss nachgebessert werden | Inseln ohne UI-Framework, `client:visible`/`client:idle`, Budget-Check aus `scripts/check-frequenz-budget.cjs` in CI übernehmen |
| **R8** | **Audio-/Canvas-Verhalten.** Kein Ton ohne Nutzerinteraktion, Kontext nur im Ereignis, Stopp bei Routenwechsel/`visibilitychange`/`pagehide`, Pegeldeckel −6 dBFS. Eine MPA-Navigation (statt SPA) ändert die Lebensdauer des `AudioContext`. | Autoplay-Blocker, hängende Töne, Browser-Konsolenfehler, A11y-Regression | Insel kapselt Engine unverändert; `pagehide`/`astro:before-swap`-Hook; Nachweis: Engine-Tests E1–E20 unverändert grün |
| **R9** | **Jekyll-Verhalten der Pages-Pipeline.** Heute rendert Pages Markdown **mit** Frontmatter zu `.html` (`content/farbwelten/rot.html` ist erreichbar). Nach der Migration liefert Astro nur `dist/`; übrig gebliebene `.md`-Dateien könnten anders oder gar nicht erscheinen. | tote Links auf `.html`-Ableitungen von Markdown | Deploy-Pfad auf `dist/` beschränken, `.nojekyll` setzen, Linkcheck gegen den echten Build |
| **R10** | **Offline-Einzeldatei (`Lokal.html`).** Der webpack-Build bettet Daten, Quellen und Assets ein; Tests prüfen `file://`. Ob VELARKANA diese Funktion behält, ist ungeklärt. | Feature-Verlust oder zusätzlicher Build-Zweig mit eigenem Risiko | Entscheidung F5; falls behalten: eigener Build-Schritt + `file://`-Test, nicht in den Astro-Hauptpfad mischen |
| **R11** | **Öffentliche Repo-Interna.** `docs/`, `evidence/`, `qa/`, `tests/`, `package.json`, `AGENTS.md`, `Lokal*.html`, `public/` sind heute abrufbar. | interne Bewertungen und Prüfnachweise öffentlich; doppelter Inhalt | P7: nur `dist/` deployen; `robots.txt` bereinigen; alte URLs bewusst 404en |
| **R12** | **Bildlizenzen/Attribution.** 30 Kristallfotos tragen individuelle Lizenzen inkl. **ShareAlike** (CC BY-SA 2.5/3.0/4.0) und geforderte Änderungsangaben; Radiästhesie-Fotos eigene Nachweise. | Lizenzverstoß bei Verlust der Nachweistexte | Attribution als Content Collection mit Pflichtfeldern (`attribution_text_required`), Test: jeder Bildpfad hat einen Nachweis; Impressum rendert daraus |
| **R13** | **Keine echte Berechnung, aber Erwartungsdruck.** Astrologie/Nummerologie-Tools könnten „echte" Berechnung verlangen; heute bewusst ausgeschlossen (`keine Berechnung`, `keine Geburtsdaten`). | Scope-Creep, Datenschutzrisiko | Scope-Grenze in `AGENTS.md`/ADR fortschreiben, keine Geburtsdaten erheben |
| **R14** | **Zwei Stände laufen auseinander.** Live (A, Esoterik-Welt) und Arbeitsprojekt (B, VELARKANA) haben getrennte Commits, Basis-Pfade und Brandings; B hat 22 statt 10 Artikel. Wird die Parität gegen A gemessen, ist sie für B falsch (und umgekehrt). | Abnahme gegen den falschen Stand; doppelte Pflege | Baseline verbindlich auf B festlegen (§0.1, §11.5) und A nur als „zuletzt veröffentlicht" führen; ein Skript vergleicht beide Routenlisten |
| **R15** | **Themen-Duplikate im Artikelbestand.** In B stehen 22 Artikel, davon 12 generierte, die thematisch die kuratierten 10 überlappen (Kristalle/Chakra, Runen-Legung, Mondrituale). | Kannibalisierung der Keywords, dünne Inhalte, doppelte Redaktionspflege | Redaktion entscheidet vor P3: zusammenführen, kanonisieren (eine URL pro Thema, `canonical` auf den stärkeren Artikel) oder bewusst als Serie behalten |

---

## 9. Offene Fragen und Entscheidungsbedarf

Bereits getroffene Entscheidungen (vom Planner, mit Begründung) — Widerspruch möglich, dann bitte im Ticket kommentieren:

- **E1 URL-Parität vor URL-Schönheit.** Die 12 bestehenden Dokumentpfade bleiben unverändert, inklusive `.html`-Endung (`build.format: 'file'`). Begründung: sie sind indexiert und in der Sitemap; ein Umbau auf `/pendeln/`-Pfade bringt keinen messbaren Gewinn, kostet aber Redirects. Neue Bereiche erhalten ebenfalls `.html`-Pfade (`/tarot.html`, `/astrologie/zeichen/widder.html`), damit **eine** Regel gilt.
- **E2 Radiästhesie-Dokumente bleiben kanonisch.** `#pendeln` und `#pendeln/<thema>` verweisen künftig auf `/radiasthesie/…`, statt eine zweite Dokumentfamilie zu erzeugen.
- **E3 Kein UI-Framework in der ersten Ausbaustufe.** Interaktivität über Astro-Inseln mit den vorhandenen Vanilla-Modulen (DOM-freie Modelle sind bereits sauber getrennt: `frequenz-engine`, `pendeltafel-model`, `experiment-statistik`, `journal-speicher`). Ein Framework wird nur eingeführt, wenn ein konkreter Bedarf belegt ist.
- **E4 Eine Origin-Konstante.** Keine hartcodierten `https://ingbms.github.io/Esoterik-Welt/`-Literale mehr in Komponenten; `PUBLIC_SITE_ORIGIN` + `import.meta.env.BASE_URL`.
- **E5 Marke ist im Arbeitsprojekt bereits gesetzt.** Stand B trägt „VELARKANA" in Titeln, Footer und `config/site.json`; die Paritätsprüfung misst daher gegen B. Der Wechsel der **Live-Adresse** von `/Esoterik-Welt/` auf `/velarkana/` bzw. `velarkana.de` ist Teil des Cutovers (P7), keine Textänderung.

Vom Eigentümer zu entscheiden:

| ID | Frage | Warum sie blockiert | Vorschlag |
|---|---|---|---|
| **F1** | Wann wird `velarkana.de` aktiviert, und wie wird der Basis-Pfad-Wechsel `/velarkana/` → `/` vollzogen? | bestimmt `base`, DNS, Redirect-Strategie und alle Canonicals | Erst Parität auf `/velarkana/` herstellen, dann Domain mit `base: '/'` aktivieren; alte `/Esoterik-Welt/`-URLs per Client-Shim und `canonical` überleiten |
| **F2** | Sollen Nutzerdaten aus `localStorage` beim Domainwechsel übernommen werden? | entscheidet über Export/Import-Funktion (R2) | Ja: kleiner Export/Import je Speicher vor Cutover |
| **F3** | Bleiben die deutschen Bereichs-IDs (`#crystals`) als Altlast-Links wichtig, oder darf die Map nur die öffentlichen Deep-Links abdecken? | Umfang der Redirect-Map | Volle Map inkl. aller Familien und Aliase |
| **F4** | Bleiben alle 22 Artikel (10 kuratiert + 12 generiert) im Bestand, oder werden thematisch überlappende Paare zusammengeführt? | bestimmt Artikelzahl, URLs und Redaktionsaufwand in P3/P4 (R15) | Zusammenführen der klar überlappenden Paare; Rest als Serie behalten |
| **F5** | Bleibt die Offline-Einzeldatei (`Lokal.html`) ein Produktfeature? | eigener Build-Zweig, eigener Test (R10) | Nein für die Website, ja optional als „Offline-Export" im Backlog |
| **F6** | Soll ein `og:image` erzeugt werden (heute fehlt es)? | Social-Preview, kleiner Aufwand | Ja: 1200×630 aus Hero-Motiv, in P2 |
| **F7** | Braucht VELARKANA Analytics/Consent? | heute bewusst keine Tracker; Einführung ändert Datenschutzerklärung und Rechtsseiten | Nein in der Migration; separat entscheiden |
| **F8** | Bleiben die Frequenz-Feature-Flags (`cymatics`, `meditation`) und die URL-Overrides auf `localhost` erhalten? | beeinflusst Routing und Tests | Ja, als Build-Zeit-Flags |

---

## 10. Definition of Done

Die Migration gilt als abgeschlossen, wenn **alle** Punkte mit Beleg vorliegen:

**Struktur und Parität**
1. `npm run build` erzeugt einen Deploy-Ordner, der **ausschließlich** Website-Dateien enthält (kein `docs/`, `tests/`, `qa/`, `evidence/`, `public/`, `Lokal*.html`, `package.json`).
2. Route-Parität: 12/12 Dokumente und 152/152 Hash-Ansichten (Stand B: 164/164 adressierbare Ziele) sind unter ihrer Zielstruktur erreichbar — Nachweis als Liste `Route → HTTP-Status` im Repository.
3. Jede der 12 bestehenden Dokument-URLs liefert **denselben Titel, dieselbe Description und dasselbe Canonical** wie in §6.1.
4. `sitemap.xml` enthält alle kanonischen URLs (mindestens die 11 bisherigen + die neuen Bereiche), `robots.txt` verweist darauf und schließt keine Website-Inhalte aus.
5. 20 Stichproben alter Deep-Links (inkl. Aliase) landen auf der inhaltlich richtigen Seite.
6. `404.html` liefert Status 404 und eine Suche/Einstiege.

**Inhalt und Daten**
7. Mengenparität gegen §4.2: 78 Tarotkarten × 2 Decks, 30 Kristalle, 24 Runen, 8 Mondphasen, 12 Zeichen/10 Faktoren/12 Häuser/5 Aspekte/24 Grundlagen/6 Lernpfadstufen/4 Beispiele/15 FAQ/65 Glossar/25 Quellen/28 Claims, 12 Farben + 3 Themenseiten, 3 Pendelthemen mit 32 Kapiteln/66 Quellen/17 Begriffen, **22 Artikel (Stand B; 10 kuratiert + 12 generiert)**.
8. Markdown ist die einzige Redaktionsquelle für Farbwelten und Artikel; Generatoren sind entfernt oder durch Build-Schritte ersetzt.
9. Jedes Bild hat einen Attributionseintrag; das Impressum rendert ihn vollständig.

**Qualität**
10. `tsc --noEmit` (strict) und ESLint laufen ohne Warnungen im CI.
11. Lighthouse je Bereich: Performance ≥ 0,90 (mindestens Startseite, Astrologie-Detail, Farbseite), A11y ≥ 0,95, SEO ≥ 0,90.
12. Frequenz-Budget eingehalten (Gesamt ≤ 92.000 B gzip, Feature-JS ≤ 100.000 B, Feature-CSS ≤ 6.000 B).
13. axe-Scan ohne WCAG-Verstoß auf mindestens 6 Routen; Tastaturbedienung für Navigation, Dialoge, Frequenzlabor, Tarot-Ziehung geprüft.
14. Audio-Regeln nachgewiesen: kein Ton ohne Interaktion, Stop bei `pagehide`/Routenwechsel, Pegel ≤ −6 dBFS.

**Betrieb**
15. CI prüft Lint, Typen, Build, Parität und Browserfälle am exakten Commit; kein Job ist leer.
16. Veröffentlichung ist nachvollziehbar dokumentiert: Commit, Build-ID, Live-Prüfung (Sitemap live = Build, Stichproben 200/404 korrekt).
17. `docs/migration-plan.md` ist auf den Endstand aktualisiert (Abweichungen begründet).

---

## 11. Anhang

### 11.1 Konkrete Slug-Listen (aus den Datenmodulen extrahiert)

- **Astrologie-Zeichen (12):** widder, stier, zwillinge, krebs, loewe, jungfrau, waage, skorpion, schuetze, steinbock, wassermann, fische
- **Faktoren (10):** sonne, mond, merkur, venus, mars, jupiter, saturn, uranus, neptun, pluto
- **Häuser (12):** erstes-haus … zwoelftes-haus
- **Aspekte (5):** konjunktion, sextil, quadrat, trigon, opposition
- **Grundlagen (24):** was-astrologie-ist, geschichte, ekliptik-und-himmelssphaere, tropisch-und-siderisch, zeichen-und-sternbilder, element-feuer/-erde/-luft/-wasser, modalitaet-kardinal/-fix/-veraenderlich, herrschaft-und-wuerden, aspekte-und-orben, haeusersysteme, aszendent-und-mc, radix-lesen, transite, ruecklaeufigkeit, grenzen-der-sonnenzeichen, mond-verstehen, evidenz-und-grenzen, ethik-und-grenzen, echte-berechnung
- **Lernpfad (6):** orientierung, die-zwoelf-zeichen, faktoren-und-aspekte, haeuser-und-achsen, synthese-und-grenzen, nachschlagen-und-vertiefen
- **Beispiele (4):** beispiel-mira, beispiel-tobias, beispiel-nora, beispiel-selin
- **Farben (12):** rot, orange, gelb, gruen, tuerkis, blau, indigo, violett, magenta, rosa, weiss, schwarz
- **Farb-Themenseiten (3):** farbtherapie, farbpsychologie, lichtmedizin
- **Farb-Abschnitte (8):** erleben, physik, psychologie, tradition, anwendung, geschichte, uebung, quellen
- **Pendelthemen (3):** radiasthesie, pendeln, orakel (Kapitel 10/10/12)
- **Frequenz-Ansichten (5):** hub, labor, quellen, cymatics, meditation
- **Artikel (10):** IDs 1–10, Kategorien tarot, crystals, runes, moon, history, rituals

### 11.2 Wiederverwendbare Prüfkommandos (Ist-Stand als Referenz)

```bash
npm run build            # dist/Esoterik-Welt inkl. generierter Radiästhesie-Seiten
npm run verify:build     # Build gegen lokalen Server prüfen
npm run verify:pages -- http://localhost:3000/Esoterik-Welt/ evidence/preview
npm run test:pages       # Seiten-/Routen-Regression
npm run test:all         # vollständige Suite (20 Teilkommandos)
npm run check:frequenz-budget
npm run verify:sync      # Farbwelten-Quellen ↔ generierte Daten
npx lhci autorun         # Lighthouse-Budgets aus .lighthouserc.json
```

### 11.3 Nicht Gegenstand dieser Aufgabe

- Kein Code-Umbau, keine neuen Inhalte, keine Redaktionsentscheidungen (F4), keine Domain-/DNS-Änderung (F1), keine Veröffentlichung.
- Nicht geprüft (bewusst offengelegt): Safari/iOS, echter Screenreader, Touch-Geräte, Suchmaschinen-Indexierungsstand (keine Search-Console-Daten vorhanden), Lösch-/Aufbewahrungsfristen für `localStorage`-Daten.

### 11.4 Dokumentarischer Drift (Befund, für die Doku-Pflege)

- `README.md` behauptet ein referenziertes `assets/og-preview.png` — die Datei existiert nicht und `index.html` setzt kein `og:image`.
- `README.md` nennt „10 reale Artikel" — korrekt für Stand A; Stand B führt 22 Artikel (10 kuratiert + 12 generiert).
- `README.md` beschreibt `#tarot … #home` als Routenliste; die tatsächliche Menge umfasst 140 Ansichten in Stand A, 152 in Stand B (dieses Dokument).
- `README.md` nennt `data/moon-phases.js`; real existiert `data/moon-astro.mjs` + `js/data/moon.js`.
- `README.md` nennt Kristalle „30+"; im Katalog (`data/crystals.json`) stehen 30, in der ungenutzten Altdatei `js/data/crystals.js` 36.
- `robots.txt` verbietet `/Esoterik-Welt/src/` (Stand A) bzw. `/velarkana/src/` (Stand B) — ein Verzeichnis, das es in beiden Ständen nicht gibt.

### 11.5 Bestandsdelta A (live) → B (Arbeitsprojekt)

Belegt durch Datei- und Commit-Vergleich (`C:/Users/mas/Arbeit/Esoterik-Welt@9f58439` gegen `C:/Users/mas/Arbeit/velarkana@28d9c47`):

| Gegenstand | Stand A (live, `Esoterik-Welt`) | Stand B (Arbeitsprojekt, `velarkana`) |
|---|---|---|
| Startseiten-Titel | `Esoterik-Welt \| Tarot, Kristalle, Runen, Mondphasen & Mehr` | `VELARKANA \| Tarot, Kristalle, Runen, Mondphasen & Mehr` |
| Rechtsseiten-Titel | `Impressum/Datenschutz/Haftungsausschluss/Seite nicht gefunden — Esoterik-Welt` | dieselben Texte mit `— VELARKANA` |
| Laufzeit-Metas (`PAGE_META`) | „… \| Esoterik-Welt" | „… \| VELARKANA" (z. B. `blog`, `tarot`) |
| Kanonische Origin | `https://ingbms.github.io/Esoterik-Welt/` | `https://ingbms.github.io/velarkana/` (auch in allen 7 Radiästhesie-Dokumenten und in `js/modules/radiasthesie-seo.js` als `SITE_PATH`) |
| `robots.txt` / `sitemap.xml` | `/Esoterik-Welt/…`, 11 `<loc>` | `/velarkana/…`, 11 `<loc>` (gleiche Dokumentliste) |
| Zentrale Konfiguration | keine | `config/site.json` (Produkt, Origin, `basePath`, `environment: interim`, Quell-/Publish-Repo) |
| Veröffentlichung | kein Deploy-Job; Push auf `main` veröffentlicht | `.github/workflows/publish-pages.yml` mit Tag-/Manual-Trigger und Prüfkette |
| Jekyll-Steuerung | keine `_config.yml` | `_config.yml` mit `exclude` (u. a. `data/articles/`, `node_modules`), damit Markdown nicht als Zweitseite erscheint |
| Node-Version | in CI gepinnt (`20`) | zusätzlich `.nvmrc` = `20` |
| Artikel | 10 registriert; `data/articles/article-11.md` und `data/articles/article-12.md` unregistriert | **22**: 10 kuratiert + 12 generiert (`js/data/articles-markdown.js`, `scripts/generate-articles-data.cjs`) |
| Paketname | `esoterik-welt` | `velarkana` (`private`, `engines.node >= 20`) |
| Git-Dateien | 1.838 | 1.984 |
| Verbleibender Altlink | — | `js/modules/frequenzlabor.js`: `REPOSITORY_BLOB = 'https://github.com/ingbms/Esoterik-Welt/blob/main/'` zeigt noch auf das alte Repository (auf `velarkana-dev` umzustellen) |

**Nicht** abweichend: Routenlogik (`MAIN_PAGES`, `parseRoute`, alle Bereichs-Unterseiten), Asset-Bestand (644 Dateien, 94 MB), Datenmodule (Astrologie, Radiästhesie, Farbwelten, Tarot, Runen, Mond, Kristalle), CSS-Dateien, Testsuite und die 12 Dokumente. Die Inventare in §2–§4 gelten daher für B unverändert, mit der Artikel-Ausnahme.

**Offener Koordinationspunkt:** Dieses Dokument liegt im zugewiesenen Worktree des Esoterik-Welt-Repositories. Für die Weiterarbeit gehört es in das Arbeitsprojekt `C:/Users/mas/Arbeit/velarkana` (dort `docs/`), weil nur dieses die verbindliche Quelle ist. Der Inhalt ist so geschrieben, dass er ohne Änderung dorthin übernommen werden kann; lediglich §6.1 wäre dann von Stand A auf Stand B umzustellen.

