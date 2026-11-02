# Konkrete Integrationspunkte je Paket

Alle Zeilenanker beziehen sich auf `e44fa5c`. Die Dateien sind Prettier-formatiert;
nach dem ersten Edit verschieben sich Zeilennummern — dann über den genannten
Suchbegriff (in Klammern) navigieren, nicht über die Zahl.

## 0. Geteilte Einbaupunkte — einmal, nicht je Modul

Diese sechs Entscheidungen sind verbindlich, damit die Pakete 07–10 nicht
viermal dieselben Dateien anfassen:

| ID | Entscheidung | Begründung |
| --- | --- | --- |
| **D-A** | Die vier Werkstatt-Module sind **Unterrouten** von `#pendeln`: `#pendeln/labor`, `#pendeln/studio`, `#pendeln/experimente`, `#pendeln/journal` | `PENDELN_ROUTE` (`js/main.js:37`) fängt bereits jeden Pfad nach `pendeln` ab. Keine Änderung an `MAIN_PAGES` (`:22`), keine neunte Navigation, kein neues `<section>` in `index.html`. |
| **D-B** | **Ein** neuer Controller `js/modules/radiasthesie-werkstatt.js` verteilt auf vier Komponenten, die je eigene Dateien sind: `pendel-simulator.js`, `pendeltafel-studio.js`, `pendel-experiment.js`, `pendel-journal.js` | Nur **eine** neue Verzweigung in `radiasthesie.js:104-125` (`resolveView`) und **eine** neue Route in `radiasthesie-model.js:84-110`. Die vier Module bleiben einzeln schreibbar. |
| **D-C** | `ROUTE` in `js/modules/radiasthesie-format.js:24-33` bekommt vier Einträge (`labor`, `studio`, `experimente`, `journal`) | Eine Datei, ein Schreiber; alle Verweise (Teaser, Breadcrumb, Suche) nutzen dieselbe Quelle. |
| **D-D** | Moduldaten (Tafel-Presets, Versuchsdefinitionen, Stufen) liegen als **JS-Modul** unter `js/data/radiasthesie-werkstatt.js`, nicht als `fetch`-JSON | Die Offline-Edition bündelt `js/main.js` mit `dynamicImportMode: 'eager'` (`scripts/build-local.cjs:19-22`); `fetch` auf lokale Dateien scheitert unter `file://`. |
| **D-E** | CSS ausschließlich in `css/radiasthesie.css` mit Präfixen `.rad-lab-*`, `.rad-studio-*`, `.rad-exp-*`, `.rad-journal-*` | `index.html:48` verlinkt die Datei bereits; eine neue Stylesheet-Datei würde `<head>` und den Offline-Inliner anfassen. |
| **D-F** | Die Werkstatt-Module werden **nicht** als Seitenmodule in `state.modules` registriert | `tests/local-entry.cjs:37` prüft die Modulliste **exakt**; eine Registrierung dort bräche den Test ohne fachlichen Gewinn. |

### 0.1 Der eine Router-Eingriff (für 07–10 gemeinsam)

Kein Eingriff in `js/main.js` nötig. Der Weg ist bereits vorhanden:

1. `js/main.js:37` `PENDELN_ROUTE` splittet `#pendeln/labor` in `segments = ['labor']`.
2. `js/main.js:127-140` `parseRoute` erzeugt `type: 'pendeln'`.
3. `js/main.js:431-441` `applyRoute` ruft `navigateTo('pendeln', …, { subroute })`.
4. `js/main.js:450` `navigateTo` ruft `state.modules.pendeln.show(segments, query, { focus })`.
5. `js/modules/radiasthesie.js:79-99` `show` → `resolveView` (`:104-125`).

**Einziger neuer Zweig** in `resolveView`:

```js
case 'werkstatt':
  return renderWerkstatt(model, { tool: route.tool, anchor: route.anchor });
```

und in `js/modules/radiasthesie-model.js` (`resolve`, ab `:84`), vor dem
`notfound`-Fallback bei `:107`:

```js
const WERKSTATT = { labor: 'simulator', studio: 'studio', experimente: 'experiment', journal: 'journal' };
if (WERKSTATT[area]) return { view: VIEW.werkstatt, tool: WERKSTATT[area], params };
```

### 0.2 Build und Auslieferung

| Punkt | Verhalten | Konsequenz |
| --- | --- | --- |
| `scripts/build-pages.cjs:9-26` | kopiert `js/`, `css/`, `assets/`, `data/` rekursiv | Neue Dateien in diesen Bäumen werden **automatisch** ausgeliefert; keine Änderung am Build nötig |
| `scripts/build-local.cjs:19-22` | Webpack entry `./js/main.js`, `dynamicImportMode: 'eager'`, Regeln für `js/` und `data/` | Dynamische Importe aus `js/` werden inline gebündelt; Dateien außerhalb `js/`+`data/` werden **nicht** gebündelt |
| `index.html:811-815` | `HTTP-MODULES`-Kommentar: `main.js` importiert alles | Kein `<script>`-Tag je Modul; Import in `main.js` bzw. dynamischer Import im Controller genügt |
| `index.html:48` | `<link rel="stylesheet" href="css/radiasthesie.css" />` | D-E: kein zweites Stylesheet |
| Offline-Verbot | `build-local.cjs:37-45` entfernt Google-Fonts-Links und `@import` auf externe Hosts | Neue Module dürfen keine externen Ressourcen einbinden; `verify-pages.cjs:143-148` prüft Assets außerhalb der Basis als Fehler |

---

## 2.1 RAD-02 — Quellenbibliothek

| Aspekt | Ort |
| --- | --- |
| Quelle der Wahrheit | `docs/radiasthesie-konzept/recherche/quellen.json` (Schema 1.0, `sources[33]`) |
| Generator | `scripts/generate-radiasthesie-data.cjs` — parst das Quellenverzeichnis, bricht bei unbekannter `Qxx` ab |
| Ausgabe | `js/data/radiasthesie.js:942-1484` (`sources`), `:1485-1502` (`sourceLegend`) |
| Ansicht | `renderQuellen` (`js/modules/radiasthesie-views.js:440-518`) |
| Test | `tests/radiasthesie.mjs` — „Quellenverzeichnis ist vollständig und ohne Platzhalter“, „jeder Quellenmarker löst auf“ |
| Einbaupunkt | Neue Quelle = Eintrag in `quellen.json` **plus** Zeile in `inhalte/quellenverzeichnis.md`; danach `npm run data:radiasthesie`. Kein Code-Edit. |
| Offen | `coverage_gaps` bleibt Doku, nicht UI. Wenn Lücken sichtbar werden sollen: eigener Block auf `renderMethodik` (`:519-591`) — **eine** Stelle, nicht je Themenseite. |

## 2.2 RAD-03 — Taxonomie und Datenmodell

| Aspekt | Ort / Ist |
| --- | --- |
| Datenform | `js/data/radiasthesie.js` — `module`, `counts`, `levels`, `topics{slug → {slug,title,eyebrow,subtitle,metaLine,status,seoTitle,description,heading,lead,wordCount,chapterCount,figure,cardText,facts,sections[]}}` |
| Kapitel | `sections[]` mit `id`, `number`, `title`, `period`, `chips`, `blocks[]` (`type: p | list | callout | steps`), `words` |
| Modell | `createModel` (`js/modules/radiasthesie-model.js:44-83`) — indiziert Themen, Quellen, Glossar, Suche |
| Generator | `scripts/generate-radiasthesie-data.cjs` — Frontmatter + Kapitelmarkup, bricht bei unerwartetem Markup ab |
| Test | `tests/radiasthesie.mjs` (Kapitelinventar, Quellenauflösung, Glossar) |
| Einbaupunkt | **Additive** Felder auf oberster Ebene: `instrumente[]`, `methoden[]`, `studien[]`, `medien[]`, `experimente[]`; je `id, slug, title, category, summary, body, tags[], relatedTopics[], references[], images[], evidenceStatus, reviewStatus, lastReviewed`. Ablage im Generator als vierter Frontmatter-Block, nicht als Handedit in `js/data`. |
| Risiko | `counts` (`:21-27`) und `tests/radiasthesie.mjs` prüfen feste Zahlen (3/30/5/33/13). Neue Top-Level-Felder dürfen `counts` **nicht** verändern, sonst wird die Kapitelprüfung rot. |
| Offen | JSON-Schema-Datei (z. B. `docs/radiasthesie-konzept/schema/radiasthesie.schema.json`) und Validierung im Generator; Muster: `docs/astrologie-konzept/schema/astrologie.schema.json`. |

## 2.4 RAD-04 — UX/UI

| Aspekt | Ort |
| --- | --- |
| Tokens | `css/design-system.css` (nicht ändern) |
| Modul-CSS | `css/radiasthesie.css` (1.005 Z.), Klassen `.rad-*` |
| Spezifikation | `docs/radiasthesie-konzept/komponenten-specs.md` C1–C19, `a11y-checkliste.md`, `responsive-checkliste.md` |
| Messung | `docs/radiasthesie-konzept/messung/{kontrast.json,modul/}`, `scripts/probe-modul.cjs` |
| Einbaupunkt für 07–10 | Neue Werkstatt-Ansichten nutzen bestehende Primitives (`astro-panel`, `astro-callout`, `btn`, `rad-chip`) und ergänzen nur `.rad-lab-*`/`.rad-studio-*`/`.rad-exp-*`/`.rad-journal-*`; Fokusring und `prefers-reduced-motion` sind Pflicht, keine neuen Farben außer `--color-accent-gold`/`--color-secondary-text`. |
| Offen | **RAD-04 ist damit nicht erledigt:** Werkstatt-Komponentenspecs für 07–10 fehlen (mobil, Tastatur, reduzierte Bewegung), ebenso axe-/Lighthouse-Nachweis (U5) und Textzoom 200 % (systemweit). |

## 2.5 RAD-05 — Bildbibliothek und Lizenzen

| Aspekt | Ort / Muster |
| --- | --- |
| Zielverzeichnis | `assets/radiasthesie/` (4 SVG vorhanden; Fotos als `assets/radiasthesie/fotos/`) |
| Muster im Projekt | `docs/kristalle/image-sources.json` → `image-sources.evidence.json` → `image-sources.validation.json` → `scripts/sync-crystal-attribution.cjs` → `docs/kristalle/BILDQUELLEN.md` + `impressum-snippet.html` |
| Anzeige | `figure` je Thema (`js/data/radiasthesie.js:78-84`), gerendert in `renderTopic` (`views.js:278-353`) |
| Attribution | Footer-/Impressum-Verweis; `index.html:751` zeigt bereits externe Links mit `rel="noopener"` |
| Einbaupunkt | 1) `media-manifest.json` unter `docs/radiasthesie-konzept/` (Quelle) **und** `assets/radiasthesie/media-manifest.json` (Auslieferung) — eine Datei, zwei Pfade sind zu vermeiden: besser nur `assets/radiasthesie/media-manifest.json`, vom Build automatisch kopiert. 2) Generator liest Manifest und schreibt `figure`-Daten. 3) Attributionsseite als Route `#pendeln/bilder` (neuer `ROUTE`-Eintrag, Ansicht `renderBildnachweis`) — **oder** Abschnitt in `renderMethodik`; Entscheidung nötig, siehe U3. |
| Offen | Lizenzprüfung je Dateiseite; Varianten (WebP/AVIF + PNG-Fallback) mit `srcset`; Alt/Caption; Share-alike-Hinweis bei CC BY-SA 3.0. |

## 2.6 RAD-06 — Themenseiten

| Aspekt | Ort |
| --- | --- |
| Texte | `docs/radiasthesie-konzept/inhalte/{modul-einstieg,radiaesthesie,pendeln,orakel,glossar,quellenverzeichnis,disclaimer}.md` |
| Generator | `scripts/generate-radiasthesie-data.cjs` (Metadescription >160 Zeichen ⇒ Abbruch) |
| Ansichten | `renderTopic` (`views.js:278`), `renderLanding` (`:159`) |
| Test | `tests/radiasthesie.mjs` (Kapitelzahl 8/10/12, keine `**`-Reste, keine Dossier-Verweise), `tests/radiasthesie.spec.js` (H1, TOC, Quellenmarker) |
| Einbaupunkt | Nur Markdown + `npm run data:radiasthesie`; kein Code. Für die B1-Korrektur reicht `inhalte/radiaesthesie.md` (Bovis-Absatz). Für B5 Seitenzuordnung: `topics`-Feld je Quelle in `quellen.json` ergänzen, Generator schreibt „Verwendet in“. |
| Risiko | Der Generator ist strikt: neue Blocktypen (z. B. Tabelle) brechen den Lauf — dann Generator **und** `renderBlock` (`format.js:105-119`) gemeinsam erweitern, nie stillschweigend. |

## 2.7 RAD-07 — Pendelsimulator

| Aspekt | Konkret |
| --- | --- |
| Route | `#pendeln/labor` (D-A), Deep-Link je Parameterzustand nicht nötig; Zustand lokal |
| Controller | `js/modules/radiasthesie-werkstatt.js` → `mountSimulator(el)` |
| Komponente | `js/modules/pendel-simulator.js` — reine Physikfunktionen exportieren (`period(lengthM, g)`, `step(state, dt, damping)`), DOM-Teil getrennt halten |
| Physik | Kleine Auslenkung: `T = 2π·√(L/g)`; gedämpft: `θ'' = −(g/L)·θ − 2ζω₀·θ'`; Integrator mit festem `dt` (z. B. 1/240 s) und Akkumulator, damit die Periode reproduzierbar bleibt |
| Rendering | SVG (Linie + Kreis) statt Canvas, damit `prefers-reduced-motion` und Skalierung ohne Pixeltricks funktionieren; bei `reduce` statische Ruhelage + Messwerte |
| Bedienung | `<input type="range">` mit `<label>`, Start/Stopp als `<button>`, Tastatur (`Space`, Pfeile), Touch-Ziele ≥ 44 px |
| Daten | Pendelgrafiken aus `assets/radiasthesie/` (vorhanden) + zwei Varianten als SVG |
| Erklärtext | Kurzer Abschnitt „Mechanik“ mit Formel und Hinweis „Simulation zeigt Mechanik, nicht Information“ — als `astro-callout` |
| Tests | `tests/radiasthesie-simulator.mjs` (Periode bei L=0,25 m ≈ 1,003 s auf ±1 %, Dämpfung monoton, `dt`-Unabhängigkeit), `tests/radiasthesie.spec.js` (Start/Stopp, reduzierter Modus, Tastatur) |
| Einbaupunkt Teaser | `landing.workshop` (`js/data/radiasthesie.js:758-763`) bekommt `href: '#pendeln/labor'`; `views.js:196-204` rendert `href` statt `<span>` — **eine** Änderung für alle vier Werkzeuge |

## 2.8 RAD-08 — Pendeltafel-Studio

| Aspekt | Konkret |
| --- | --- |
| Route | `#pendeln/studio` |
| Komponente | `js/modules/pendeltafel-studio.js` — Tafeltypen als Datenobjekte (`ja/nein`, `zahlenkreis`, `buchstaben`, `segmente`), Renderer erzeugt SVG-String aus kontrollierten Bausteinen |
| SVG-Export | `new Blob([svg], {type: 'image/svg+xml'})` + `URL.createObjectURL` + `<a download>`; Objekt-URL nach Klick `revokeObjectURL` (Muster: `js/modules/moon.js:610-627`) |
| Druck / PDF | `@media print` in `css/radiasthesie.css` (nur die Tafel, Kopfzeile aus) + `window.print()`; **keine** PDF-Bibliothek (U2) |
| Eingabevalidierung | Beschriftungen max. 40 Zeichen, max. 24 Segmente, keine Steuerzeichen; Ausgabe **immer** über `escapeHtml` (`format.js:19`), nie `innerHTML` mit Rohdaten; Import nur JSON ≤ 1 MB gegen Schema, kein `eval` |
| Farbstile | ausschließlich Tokens (`--color-accent-gold`, `--color-primary`, `--color-secondary-text`, `--color-bg-card`) |
| Tests | Snapshot-freie Strukturtests: Anzahl Segmente, Escaping von `<script>`, Export-String enthält `<title>`, Import weist ungültige Schemata ab |
| Einbaupunkt | `renderWerkstatt` (neu) rendert Kopf + Werkzeug-Container + Brotkrümel; die Komponente mountet in `#radWerkzeug` |

## 2.9 RAD-09 — Verblindetes Experimentierlabor

| Aspekt | Konkret |
| --- | --- |
| Route | `#pendeln/experimente` |
| Komponente | `js/modules/pendel-experiment.js` |
| Zufall | `crypto.getRandomValues` (gleichverteilt, ohne Modulo-Bias: Rejection Sampling); **injizierbarer** RNG für Tests (mulberry32 mit Seed) |
| Ablauf (verbindlich) | 1) Protokoll festlegen (Testart, n, Zielraum, Abbruchregel) → 2) Ziel ziehen und **nur** im Speicher verdeckt halten → 3) Antwort erfassen und **sofort** persistieren (`status: 'answered'`, `revealedAt: null`) → 4) erst danach `reveal()` → 5) Auswertung |
| Unveränderlichkeit | Nach dem Speichern ist der Lauf `locked: true`; UI bietet nur „neuer Lauf“, kein Nachtrag der Antwort |
| Statistik | Trefferquote, Zufallserwartung `1/k`, exakter zweiseitiger Binomialtest, Wilson-95 %-Intervall; Rundung auf 4 Nachkommastellen; Formeln im Modul dokumentiert |
| Mehrfachtests | Feld `protocol.batch` + Hinweis, dass mehrere Läufe die Fehlerrate erhöhen; keine automatische Alpha-Korrektur ohne Vorregistrierung |
| Modi | `mode: 'demo' | 'test'`; Demo-Läufe werden **nicht** in die Statistik gezählt und sind in der Liste markiert |
| Export | JSON (vollständig, schema-versioniert) und CSV (UTF-8 BOM, `;`-Trennung für deutsches Excel) |
| Persistenz | `esot_rad_experiment_v1` (siehe `KOMPONENTENGRENZEN.md` §5) |
| Tests | Statistik gegen bekannte Werte (z. B. 60/100 bei p=0,5 ⇒ p≈0,056), Blinding-Reihenfolge (Antwort gespeichert **vor** `revealedAt`), RNG-Gleichverteilung, CSV-Escaping |
| Einbaupunkt | `SELECT`-Zielanzahl aus `data`, keine freie Eingabe des Zielraums im Testmodus |

## 2.10 RAD-10 — Pendeltagebuch

| Aspekt | Konkret |
| --- | --- |
| Route | `#pendeln/journal` |
| Komponente | `js/modules/pendel-journal.js` |
| Felder | `date` (ISO), `question` (≤200), `method` (Auswahl), `prediction` (≤200), `confidence` (1–5), `result` (≤500), `review` (≤500), `experimentId?` |
| Speicher | `esot_rad_journal_v1`, lokal, kein Konto, kein Netzwerk |
| Export | JSON + CSV; Import nur eigenes Schema |
| Löschung | „Alle Einträge löschen“ mit Bestätigung (`dialog.js`-Muster) entfernt **alle** Schlüssel des Präfixes `esot_rad_` — nicht nur das Journal |
| Zusammenarbeit mit 09 | Ein Experimentlauf kann als Journal-Eintrag übernommen werden (`experimentId`-Verweis, Vorhersage = Antwort, Ergebnis = Treffer) |
| Tests | Round-trip (schreiben → lesen → exportieren → importieren), Grenzlängen, Löschung entfernt alle Präfix-Schlüssel, Speicher voll ⇒ verständliche Meldung statt Throw |
| Einbaupunkt | Kein Eingriff in `js/main.js`; nur `renderWerkstatt`-Zweig |

## 2.11 RAD-11 — Integration verwandte Themen

| Aspekt | Ort |
| --- | --- |
| Ist | `landing.related` (`js/data/radiasthesie.js:775-796`): Tarot `#tarot`, Astrologie `#astrologie`, Kristalle `#crystals`; gerendert via `relatedList` (`format.js:177-189`) |
| Textbezüge | I Ging/Runen/Tarot in `topics.orakel`; Chakren nur im Kristall-Modul |
| Einbaupunkt | `related`-Array erweitern, sobald Ziel existiert. Fehlt das Ziel, **kein** toter Link: Einordnungssatz im Text (z. B. auf `renderMethodik`) statt Link. |
| Tabu | Keine Gleichsetzung „Frequenz = Schwingung“; Bovis bleibt Stufe B/E (`levels`, `glossary`). Prüfbar: `tests/radiasthesie.mjs` enthält bereits einen Bovis-Test. |
| Offen | U4 — Frequenzen/Geomantie/Kraftorte/Chakren: **keine Routen erfinden** (Karte `t_6955196e`). Vorhandene Kapitel verlinken oder die Zielentscheidung als Lücke dokumentieren. |

## 2.12 RAD-12 — SEO, GEO, strukturierte Daten (inkl. statischer HTML-Ausgabe)

Verbindlich ist Karte `t_9e4cd9bb`: **statische echte HTML-Seiten aus derselben
Datenquelle**, integriert in `build-pages`/`build-local`/`verify-pages`, ohne den
Hash-Router zu ersetzen (der bleibt für Interaktion, Werkzeuge und Offline).

| Aspekt | Ort / Maßnahme |
| --- | --- |
| Datenquelle (unverändert) | `js/data/radiasthesie.js` — bereits als ESM importierbar; die Ansichten `radiasthesie-views.js` sind **reine Funktionen** und im Node-Prozess wiederverwendbar |
| Neuer Generator | `scripts/build-radiasthesie-pages.cjs`: `await import('../js/data/radiasthesie.js')` + `import('../js/modules/radiasthesie-views.js')`, schreibt je Zielseite eine vollständige HTML-Datei |
| Zielpfade (Vorschlag, U7) | `radiasthesie/index.html` (Landing), `radiasthesie/radiasthesie.html`, `radiasthesie/pendeln.html`, `radiasthesie/orakel.html`, `radiasthesie/glossar.html`, `radiasthesie/quellen.html`, `radiasthesie/methodik.html` |
| Pfadproblem | Die Ansichten erzeugen heute `assets/…` und `#pendeln/...`. Für statische Seiten braucht der Generator einen Präfix-Resolver: Asset-Pfade `../assets/…`, interne Links `../index.html#pendeln/…`. **Eine** Erweiterung in `format.js` (`ROUTE`-Fabrik mit `prefix`) und eine Option in `renderTopic`/`renderLanding` — nicht Post-Processing des HTML |
| Canonical | Statische Seite trägt **sich selbst** als Canonical; die SPA-Ansichten setzen per `applyMeta` das Canonical auf die jeweilige statische URL (kleine Ergänzung in `radiasthesie.js:126-142`). Damit gibt es keinen Duplikat-/Canonical-Widerspruch zwischen `/#pendeln/radiasthesie` und `/radiasthesie/radiasthesie.html` |
| Sitemap | `sitemap.xml` bekommt echte `<url>`-Einträge für die statischen Seiten (keine Fragmente), `lastmod` aus `data.updated`; die bestehende Startseiten-URL bleibt |
| Strukturierte Daten | `BreadcrumbList` mit absoluten URLs der statischen Seiten; `Article` nur, wenn eine sichtbare Autoren-/Datumsangabe existiert (heute nicht — dann **weglassen**); `FAQPage` weiterhin nicht |
| Build | `scripts/build-pages.cjs:9-21` um `'radiasthesie'` erweitern; `build-local.cjs` bleibt unverändert (Offline-Edition nutzt weiter die Hash-Routen, keine statischen Dateien) |
| Prüfung | `scripts/verify-pages.cjs`: statische Routen in `routes` aufnehmen **und** ein Kontext mit `javaScriptEnabled: false`, der Kerntext, genau eine H1, Canonical und JSON-LD prüft; `tests/radiasthesie-static.mjs` prüft das erzeugte HTML ohne Browser |
| Titelbudget (B8) | Sachlich messen statt runden: Zeichenlänge **und** grobe Pixelbreite bei 20 px im vorhandenen Font; Budget so setzen, dass die bestehenden Titel gekürzt werden — **kein** Testabschwächen |
| `og:image` (B7) | projektweit in `index.html` `<head>` plus Override je statischer Seite; sinnvoll erst mit RAD-05 |
| Werkzeuge (07–10) | **keine** statischen Dokumente: Sie sind Funktionen, keine Inhalte. Statische Seiten verlinken auf `../index.html#pendeln/labor` usw. |
| Nicht tun | Hash-Routen abschalten, SPA-Inhalte duplizieren ohne Canonical, Sitemap-Fragmente, `Article`/`FAQPage` ohne sichtbaren Inhalt |

## 2.13 RAD-13 — Qualitätskontrolle

| Prüfung | Befehl | Einbaupunkt |
| --- | --- | --- |
| Build | `npm run build` | `scripts/build-pages.cjs`; erzeugt `dist/` **und** `Lokal.html` |
| Radiästhesie-Daten/Views | `npm run test:radiasthesie` | `package.json:25` |
| Browser | `npx playwright test tests/radiasthesie.spec.js` | `playwright.config.cjs` (Port 3100, Chromium) |
| Offline | `npm run test:offline` | `tests/offline-file.cjs:70-81` |
| Lokaler Einstieg | `npm run test:local` | `tests/local-entry.cjs:37-51` |
| Seiten/Überläufe | `npm run verify:pages` | `scripts/verify-pages.cjs:9-20,125-130` |
| **Statische Seiten ohne JS** | `javaScriptEnabled: false`-Kontext in `verify-pages.cjs` + `tests/radiasthesie-static.mjs` | Kerntext je statischer Seite, genau eine H1, Canonical self-reference, JSON-LD valide, alle Sitemap-URLs 200 |
| **Sitemap/Canonical real** | eigener Prüfschritt nach `npm run build` | jede `<loc>` erreichbar, kein Fragment, Canonical der statischen Seite = ihre URL, SPA-Canonical zeigt auf dieselbe URL |
| **CI-Lücke** | `test:radiasthesie` fehlt in `.github/workflows/ci.yml` (Job `unit-test`) | Schritt ergänzen: `run: npm run test:radiasthesie`; zusätzlich `tests/radiasthesie-static.mjs` im selben Schritt |
| Neue Testdateien | `package.json:25` auf `node --test tests/radiasthesie*.mjs` erweitern | sonst laufen `radiasthesie-simulator.mjs` usw. nie |
| A11y | axe nicht installiert | entweder `@axe-core/playwright` als devDependency (Entscheidung nötig) oder dokumentiert ersatzgeprüft lassen (U5) |

## 2.14 RAD-14 — Dokumentation und Übergabe

| Dokument | Ort | Status |
| --- | --- | --- |
| Architekturübersicht | `BESTANDSAUFNAHME.md` + `INTEGRATIONSPUNKTE.md` (dieser Lauf) | **neu** |
| Seitenübersicht | `BESTANDSAUFNAHME.md` §3/§4 | **neu**, kompakt |
| Datenmodelldokumentation | `MATRIX-14-PAKETE.md` §2.2 + `KOMPONENTENGRENZEN.md` | **neu**, Lücken benannt |
| Medien-/Lizenzverzeichnis | fehlt (RAD-05) | offen |
| Quellenbibliothek | `recherche/quellen.json` + `inhalte/quellenverzeichnis.md` | vorhanden |
| Bedienungsanleitungen 07–10 | fehlen | offen bis Umsetzung |
| Testprotokolle | `qa-t_d84585a8/TESTBERICHT.md` (nur kanonischer Baum), `NACHWEIS-WORKTREE.md` (dieser Lauf) | teilweise |
| Änderungsübersicht | `IMPLEMENTIERUNG.md` §2 | vorhanden, je Paket fehlt |
| Einschränkungen / Ausbaustufen | `IMPLEMENTIERUNG.md` §9 | vorhanden |
