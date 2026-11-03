# Architekturübersicht

**Stand:** Commit `5fe5301`, Branch `feature/radiasthesie-modul`
**Bezug:** RAD-01 (`docs/radiasthesie-completion/RAD-01/`), RAD-03, RAD-12 — diese Übersicht fasst zusammen und wiederholt die dortigen Verträge nicht.

## 1. Grundentscheidung

Esoterik-Welt ist eine **statische Website ohne Anwendungsframework**. Sie wird aus
dem Repository-Wurzelverzeichnis über GitHub Pages ausgeliefert; es gibt keinen
Server, keine Datenbank, kein Konto und keine Laufzeit-Abhängigkeit außer dem
Browser. Das Themenmodul Radiästhesie fügt sich in dieses Modell ein:

- Inhalte werden **zur Buildzeit** aus Markdown- und JSON-Quellen in ein
  ES-Modul (`js/data/radiasthesie.js`) erzeugt.
- Ansichten werden **im Browser** aus diesem Modul gerendert (Hash-Router).
- Zusätzlich werden **sieben statische HTML-Dokumente** aus derselben Datenquelle
  und denselben Renderfunktionen erzeugt — lesbar ohne JavaScript, indexierbar.
- Interaktive Werkzeuge rechnen **vollständig lokal**; gespeichert wird nur im
  `localStorage` des Browsers. Es gibt keine Netzwerkanfrage im Modul.

Damit gibt es bewusst **keine** API, keine Session, keine serverseitige
Personalisierung und keine Telemetrie.

## 2. Schichten

| # | Schicht | Ort | Aufgabe |
| --- | --- | --- | --- |
| 1 | Redaktion | `docs/radiasthesie-konzept/inhalte/*.md`, `recherche/quellen.json`, `daten/taxonomie.json` | Fließtext mit Quellenmarkern `[Qxx]`, Quellenregister, Taxonomie |
| 2 | Medien | `assets/radiasthesie/media/media-manifest.json` + `original/`, `520/`, `1040/` | Fotos, Varianten, Lizenzen, Alt-Texte (RAD-05) |
| 3 | Datengenerator | `scripts/generate-radiasthesie-data.cjs` (982 Z.) | parst Markdown, validiert Quellen/Taxonomie/Medien, schreibt das Datenmodul |
| 4 | Datenmodul | `js/data/radiasthesie.js` (255 kB, generiert) | `module`, `counts`, `levels`, `topics`, `glossary`, `sources`, `vernetzung`, `media`, `legal`, `taxonomie` |
| 5 | Modell | `js/modules/radiasthesie-model.js` (249 Z.) | Route → Zustand, Filter, Suche, Auswahl |
| 6 | Format | `js/modules/radiasthesie-format.js` (207 Z.) | `ROUTE`-Vokabular, Escaping, Stufen-Chips, Datums- und Zahlenformat |
| 7 | Verträge | `js/modules/radiasthesie-vertraege.js` (1 201 Z.) | Schemata, Lauf-/Journal-Lebenszyklus, Import/Export, Prüfungen (DOM-frei) |
| 8 | Ansichten | `js/modules/radiasthesie-views.js` (1 649 Z.) | Rendering aller Modulrouten inkl. Werkzeuggerüste |
| 9 | Werkzeuge | `pendel-simulator.js`, `pendeltafel-model.js` + `-studio.js`, `experiment-*.js`, `journal-speicher.js` + `pendel-journal.js` | je ein DOM-freier Rechenteil und ein Bedienteil mit `mount`/`destroy` |
| 10 | Einstieg | `js/modules/radiasthesie.js` (344 Z.) | `RadiasthesieModule`: Mount je Route, Metadaten, Fokus, Teardown |
| 11 | Seitenrahmen | `js/main.js`, `index.html` | Hash-Router der Gesamtseite, Navigation, Modulwechsel |
| 12 | Gestaltung | `css/radiasthesie.css` (3 078 Z.), `css/radiasthesie-statisch.css` (171 Z.), `css/design-system.css` | Tokens und Modulstile |
| 13 | Statische Ausgabe | `scripts/generate-radiasthesie-pages.cjs` (509 Z.) → `radiasthesie/*.html`, `sitemap.xml` | sieben Dokumente ohne JavaScript |
| 14 | Build | `scripts/build-pages.cjs`, `scripts/build-local.cjs` | `dist/Esoterik-Welt/` (Pages-Ursprung) und `Lokal.html` (Offline-Einzeldatei) |
| 15 | Vorschau | `index.js` (Express) | liefert `dist/Esoterik-Welt/` unter `/Esoterik-Welt/`, nur lokal |

## 3. Datenfluss

```
docs/radiasthesie-konzept/inhalte/*.md ─┐
recherche/quellen.json ─────────────────┼─► generate-radiasthesie-data.cjs ─► js/data/radiasthesie.js
daten/taxonomie.json ───────────────────┤        (validiert, bricht bei Fehlern ab)         │
assets/radiasthesie/media/*.json ───────┘                                                   │
                                                                                            ├─► Browser: main.js → RadiasthesieModule → views (Hash-Routen)
                                                                                            └─► Build: generate-radiasthesie-pages.cjs → radiasthesie/*.html + sitemap.xml
                                                                                                                                   │
                                                                                                    build-pages.cjs ─► dist/Esoterik-Welt/  ─► GitHub Pages
                                                                                                    build-local.cjs ─► Lokal.html (file://)
```

Der Generator ist **streng**: fehlt eine Quelle, zeigt ein `relatedTopics` ins
Leere oder widerspricht die Taxonomie dem Vertrag, endet er mit Exit 1 und
schreibt nichts (RAD-03, Negativpfad belegt). Er ist **deterministisch**: zwei
Läufe erzeugen byte-identische Dateien (RAD-12).

## 4. Laufzeit

1. `index.html` lädt `js/main.js` als ES-Modul. `main.js` importiert **alle**
   Themenmodule statisch, darunter `radiasthesie.js`; dieses importiert die vier
   Werkzeugmodule. Es gibt kein Code-Splitting — das Modul wird beim ersten
   Seitenaufruf mitgeladen.
2. `main.js` wertet den Hash aus und schaltet die Bereichscontainer um. Für den
   Radiästhesie-Bereich delegiert es an `RadiasthesieModule.render(route)`.
3. `RadiasthesieModule` löst die Route über `createModel()` auf, rendert in
   `#pendelnRoot` und **mountet** bei Werkzeugrouten das jeweilige Modul. Bei
   Routenwechsel, `hashchange` weg vom Bereich und `pagehide` wird `destroy()`
   aufgerufen; `requestAnimationFrame`-Schleifen und Listener enden dort.
4. Tiefe Links (`#pendeln/pendeln/tafeln`) setzen den Fokus auf die
   Zielüberschrift, auch beim Kaltstart (RAD-11, `deepLinkFocus` in `main.js`).
5. Canonical, `og:url`, Titel und BreadcrumbList setzt das Modul je Route über
   `radiasthesie-seo.js`; die statischen Dokumente tragen dieselben Werte
   serverseitig im HTML (RAD-12).

## 5. Statische Dokumente neben dem Router

`generate-radiasthesie-pages.cjs` ruft dieselben Renderfunktionen wie der Browser
auf, entfernt die Interaktionsgerüste und schreibt vollständiges HTML mit
`<title>`, `meta description`, Canonical, BreadcrumbList und Verweisen auf
`css/radiasthesie-statisch.css`. Die Dokumente liegen versioniert unter
`radiasthesie/`, weil GitHub Pages das Wurzelverzeichnis veröffentlicht. Der
Hash-Router bleibt unverändert; die Ausgabe ist additiv.

Preis dieser Doppelung: zwei Ausgabewege müssen konsistent bleiben. Abgesichert
ist das durch `tests/radiasthesie-statisch.mjs` (12 Prüfungen ohne Server),
`tests/radiasthesie-statisch.spec.js` (9 Browsertests, davon 7 mit deaktiviertem
JavaScript) und `verify:build` (7/7 Dokumente).

## 6. Werkzeuge: ein Muster für alle vier

| Werkzeug | Route | Rechenteil (DOM-frei) | Bedienteil | Speicher |
| --- | --- | --- | --- | --- |
| Pendellabor | `#pendeln/labor` | `pendel-simulator.js` (625 Z.) | dito, `mountPendulumSimulator` | keiner |
| Pendeltafel-Studio | `#pendeln/studio` | `pendeltafel-model.js` (590 Z.) | `pendeltafel-studio.js` (350 Z.) | keiner (Export/Import als Datei) |
| Experimentierlabor | `#pendeln/experiment` | `experiment-statistik.js` (349), `-zufall.js` (66) | `experiment-labor.js` (793) | `esot_rad_experiment_v1` |
| Pendeltagebuch | `#pendeln/journal` | `journal-speicher.js` (491) | `pendel-journal.js` (938) | `esot_rad_journal_v1` |

Gemeinsam ist allen: reine Funktionen ohne DOM im Rechenteil, ein Bedienteil mit
`mount`/`destroy`, deutsche Beschriftungen mit `<label for>`/`<output for>`,
Statusmeldungen in `role="status"`/`aria-live`, Fehler in `role="alert"`,
Tastaturbedienung und ein reduzierter Modus (`prefers-reduced-motion`).

## 7. Build und Auslieferung

| Befehl | Wirkung |
| --- | --- |
| `npm run data:radiasthesie` | erzeugt `js/data/radiasthesie.js` neu und formatiert sie |
| `npm run build` | erzeugt die sieben Dokumente, `Lokal.html` und `dist/Esoterik-Welt/` |
| `npm run build:local` | nur die Offline-Einzeldatei |
| `npm run verify:build` | prüft 36 Seiten/Viewports und 7 statische Dokumente, 0 Fehler erwartet |
| `npm start` | baut und startet den Express-Vorschauserver auf `dist/Esoterik-Welt/` |
| `npx playwright test` | Browsersuite (147 Tests); `E2E_PORT` setzen, wenn Port 3100 belegt ist |

**Deployment:** GitHub Pages veröffentlicht das Wurzelverzeichnis. Es gibt **kein**
Deployment in diesem Lauf; der Branch ist nicht gepusht, `main` unberührt.

**CI:** `.github/workflows/ci.yml` läuft, ruft aber die Radiästhesie-Suiten nicht
auf (`test:all` enthält sie, der Workflow nicht). Das ist ein offener Punkt aus
RAD-01/03/07/09/10 und in `GRENZEN.md` §6 geführt.

## 8. Sicherheits- und Datenschutzmodell

- **Kein Serverkontakt im Modul.** RAD-13 maß 0 externe Anfragen über alle
  geprüften Ansichten; RAD-04 maß 52 Messpunkte ohne externe Anfrage.
- **Ausgabe-Escaping.** Alle Textwerte laufen durch `escapeHtml` (HTML) bzw.
  `escapeXml` (SVG-Export); das Studio erzeugt SVG ausschließlich selbst und
  importiert kein fremdes SVG.
- **Import-Grenzen.** Journal und Studio prüfen Schema, Größe, Feldlängen und
  unbekannte Felder; Verstöße lehnen die ganze Datei ab (atomar).
- **Speicher.** Nur `localStorage`, unverschlüsselt, ohne Konto und ohne
  Synchronisierung. Schlüsselpräfix `esot_rad_`; „alle eigenen Daten löschen“
  entfernt jeden Schlüssel mit diesem Präfix.
- **Keine CSP-Meta.** Es werden keine externen Skripte, Schriften oder Bilder
  geladen; die einzigen externen URLs im Dokument sind Verweise (Lizenz, Repository,
  Startadresse), keine Ressourcen.

## 9. Architektonische Schulden (bewusst, nicht versteckt)

1. **Ein Datenmodul von 255 kB** wird mit dem Themenmodul geladen, obwohl die
   Taxonomie (~93 kB) nur für Detailansichten gebraucht wird (RAD-03, Restpunkt).
2. **`radiasthesie-views.js` mit 1 649 Zeilen** ist die größte Datei des Moduls;
   eine Aufteilung nach Routen wäre möglich, erhöht aber das Kollisionsrisiko
   (RAD-01 §Single-Writer).
3. **Zwei Ausgabewege** (Browser-Renderer und statischer Generator) müssen
   synchron bleiben; sie teilen die Renderfunktionen, nicht den Rahmen.
4. **CSS ohne Baustufe**: `radiasthesie.css` (3 078 Zeilen) wird ungebündelt
   ausgeliefert; es gibt kein Purge und keine Critical-CSS-Stufe.
5. **CI-Abdeckung**: Die Radiästhesie-Tests laufen nur lokal, nicht in der
   Pipeline.
