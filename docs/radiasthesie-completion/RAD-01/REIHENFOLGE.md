# Reihenfolge und Single-Writer-Regel

Die 14 Pakete teilen sich eine Handvoll Dateien. Diese Karte legt fest, **in
welcher Reihenfolge** gearbeitet wird und **wer** eine Datei in einem Zeitfenster
schreiben darf. Ziel ist nicht Parallelität um jeden Preis, sondern ein
jederzeit grüner, baubarer Stand.

## 1. Grundregel

> Je Datei und Zeitfenster genau **ein** Schreiber. Die generierte Datei
> `js/data/radiasthesie.js` wird **nie** von Hand editiert, sondern nur über
> `scripts/generate-radiasthesie-data.cjs` erzeugt.

Die 14 Delta-Karten des Masters existieren bereits. Diese Reihenfolge ist eine
**Ausführungs- und Kollisionsregel**, keine weitere Zerlegung: Es werden keine
neuen Karten angelegt, nur die vorhandenen in eine konfliktfreie Folge gebracht.

Begründung aus dem Bestand, nicht aus der Theorie: Im Arbeitsbaum liegt bereits
ein halb angewandter Änderungssatz (QA-Behebung B1/B3/B4/B5/B9), der
`js/data/radiasthesie.js`, `js/modules/radiasthesie-views.js`,
`tests/radiasthesie.mjs`, `tests/radiasthesie.spec.js`, `css/radiasthesie.css`
und drei Markdown-Dateien gleichzeitig berührt und dabei einen Test rot
hinterlässt (`model.topics.radiaesthesie` existiert nicht). Genau dieses Muster
verhindert die Reihenfolge unten.

## 2. Wellen

| Welle | Inhalt | Schreiber | Warum hier |
| --- | --- | --- | --- |
| **W0** | RAD-01: `docs/radiasthesie-completion/RAD-01/` | diese Karte | isoliertes Verzeichnis, kollidiert mit nichts |
| **W1** | Entscheidungen + Arbeitsbaum bereinigen: U1 (Fremdänderungen committen oder verwerfen), U2 (PDF-Weg), U3 (Foto-Lizenzen), U4 (Vernetzungsziele) | Maintainer/Orchestrator, **kein** Modul-Worker | ohne U1 ist jeder weitere Testlauf nicht aussagekräftig |
| **W2** | RAD-06: B1 (Bovis), B5 (Seitenzuordnung), redaktionelle Gegenlesung | ein Worker | berührt `inhalte/radiaesthesie.md`, `quellenverzeichnis.md`, generierte Daten, Tests |
| **W3** | RAD-02: Quellen ergänzen/tiefenprüfen | derselbe oder ein zweiter Worker **nach** W2 | schreibt `quellen.json` **und** generierte Daten — dieselbe Datei wie W2 |
| **W4** | RAD-03: Datenmodell additiv erweitern + Schema + Generator-Validierung + Tests | ein Worker | Generator ist 707 Z.; Schemaentscheidung wirkt auf alle späteren Pakete |
| **W5a** | RAD-05 Vorbereitung: Lizenzen prüfen, Bilder laden, Varianten, `media-manifest.json` unter `assets/radiasthesie/` | ein Worker, **parallel zu W4 möglich** | schreibt nur `assets/` und `docs/…/recherche/` |
| **W5b** | RAD-05 Einbau: `figure`-Daten, Attributionsroute | **nach** W6 | braucht `ROUTE` und `views.js` |
| **W6** | **Werkstatt-Gerüst**: `ROUTE`-Einträge, `WERKSTATT`-Zweig in `model.resolve`, `case 'werkstatt'` in `resolveView`, `renderWerkstatt`, CSS-Skelett, `js/data/radiasthesie-werkstatt.js`, Teaser-`href` | **genau ein** Worker | ein Eingriff in fünf geteilte Dateien; danach sind die vier Module isoliert |
| **W7** | RAD-07 Simulator | ein Worker | kein Speicher, keine Statistik — kleinstes Modul, kalibriert das Gerüst |
| **W8** | RAD-08 Studio | ein Worker, **nach** W7 | teilt CSS-Datei und Browser-Spec mit W7 |
| **W9** | RAD-09 Experimentierlabor | ein Worker, **nach** W8 | führt Speicher-, RNG- und Statistikvertrag ein |
| **W10** | RAD-10 Tagebuch | ein Worker, **nach** W9 | konsumiert den Experiment-Vertrag (`experimentId`) |
| **W11** | RAD-11: Teilmodule und verwandte Themen integrieren (keine Routen erfinden, Lücken dokumentieren, Nav/Deep-Links/Offline/Attributionen prüfen) | ein Worker (Karte `t_6955196e`) | braucht alle Werkzeuge und Medien, sonst werden Verweise auf Nicht-Existierendes gesetzt |
| **W12** | RAD-12: **statische HTML-Seiten aus derselben Datenquelle** + Canonical/Sitemap/JSON-LD + `og:image` + Titelbudget (Karte `t_9e4cd9bb`) | ein Worker | setzt endgültige Inhalte (W2/W3) und Vernetzung (W11) voraus; Hash-Router bleibt unangetastet |
| **W13** | RAD-13: alle Suiten, No-JS-/Sitemap-/Canonical-Prüfung, CI-Schritt `test:radiasthesie`, axe/Lighthouse soweit verfügbar | ein Worker (Prüferolle) | prüft den Endstand, darf nicht selbst Produktionscode ändern |
| **W14** | RAD-14: Medienverzeichnis, Bedienungsanleitungen, Änderungsübersicht, Architekturübersicht | ein Worker | dokumentiert den fertigen Stand |

### 2.1 Warum 07 → 08 → 09 → 10 und nicht parallel

| Grund | Konkret |
| --- | --- |
| gemeinsame CSS-Datei | `.rad-lab-*`, `.rad-studio-*`, `.rad-exp-*`, `.rad-journal-*` liegen alle in `css/radiasthesie.css`; parallele Editoren erzeugen denselben Hunk-Konflikt |
| gemeinsame Browser-Spec | neue Specs gehören in `tests/radiasthesie.spec.js` (Playwright sammelt `**/*.spec.js`, aber ein gemeinsamer Serverlauf mit `workers: 1`) |
| wachsende Ansicht | `renderWerkstatt` wächst mit jedem Werkzeug; wer gleichzeitig schreibt, verliert die H1-/Fokus-Invarianten |
| Vertragsabhängigkeit | RAD-10 übernimmt Läufe aus RAD-09; ohne fertigen Lauf-Datensatz ist das Journal nicht testbar |
| Reihenfolge nach Risiko | Simulator (reine Physik) → Studio (Export/Escaping) → Experimente (Statistik/Blinding) → Journal (Persistenz) — jedes Modul prüft einen Teil des Vertrags aus `KOMPONENTENGRENZEN.md`, bevor der nächste ihn voraussetzt |

**Zulässig parallel:** W5a (Assets) neben W4; Dokumentationsarbeit (W13-Vorbereitung)
neben W7–W10, solange sie nur `docs/` schreibt.

**Nicht zulässig parallel:** zwei Worker in `js/main.js`, `js/data/radiasthesie.js`,
`js/modules/radiasthesie*.js`, `tests/radiasthesie*.{mjs,spec.js}`,
`index.html`, `css/radiasthesie.css`, `sitemap.xml`, `scripts/generate-radiasthesie-data.cjs`.

## 3. Dateikollisionskarte

| Datei | Schreiber (Pakete) | Regel |
| --- | --- | --- |
| `js/main.js` | RAD-01 (lesen), RAD-12 (`PAGE_META`), RAD-13 (keine) | max. **ein** Edit nach W6; Router-Anker `:22,37,105,127,388,431,450,206,244` nicht verschieben |
| `index.html` | RAD-12 (`<head>`), RAD-05/11 (nur wenn neue Seite) | ein Editfenster, danach einfrieren |
| `js/modules/radiasthesie.js` | W6 (`resolveView`), sonst niemand | nach W6 unverändert |
| `js/modules/radiasthesie-model.js` | W6 (`resolve`), RAD-03 (Indizes) | RAD-03 **vor** W6 abschließen |
| `js/modules/radiasthesie-views.js` | W2 (B3), W5b (Bildnachweis), W6 (`renderWerkstatt`), RAD-11 (related) | strikt sequenziell |
| `js/modules/radiasthesie-format.js` | W6 (`ROUTE`), RAD-03 (falls neue Blocktypen) | sequenziell |
| `js/data/radiasthesie.js` | **nur** Generator | nie von Hand; nach jedem Generatorlauf `npm run data:radiasthesie` |
| `scripts/generate-radiasthesie-data.cjs` | W2, W3, W4 | ein Schreiber je Welle; Tests danach |
| `js/data/radiasthesie-werkstatt.js` | W6 anlegen, W7–W10 ergänzen | je Werkzeug ein eigener Objektzweig, keine Umstrukturierung |
| `css/radiasthesie.css` | W2 (Kleinigkeiten), W6, W7, W8, W9, W10 | je Modul **ein** Block am Dateiende, davor eine Kommentarmarke |
| `tests/radiasthesie.mjs` | W2, W3, W4 | Assertions ergänzen, nie bestehende abschwächen |
| `tests/radiasthesie.spec.js` | W2, W7–W10 | dito; `workers: 1`, kein Test darf von einem anderen abhängen |
| `tests/radiasthesie-*.mjs` (neu) | W7, W8, W9, W10 | je Modul eigene Datei; `package.json:25` muss den Glob `tests/radiasthesie*.mjs` nutzen |
| `tests/local-entry.cjs` | niemand (Modulliste bleibt `['astrologie','blog','moon','pendeln','runes','tarot']`) | Werkstatt-Module sind **keine** Seitenmodule |
| `tests/offline-file.cjs` | RAD-13 (nur wenn neue Route kaltstartfähig geprüft werden soll) | optional, additiv |
| `scripts/verify-pages.cjs` | RAD-12 (statische Routen, No-JS-Kontext), RAD-13 | additiv; bestehende 12 Routen bleiben |
| `sitemap.xml` | RAD-12 | echte `<url>`-Einträge für statische Seiten, **keine** Fragmente |
| `radiasthesie/*.html` (neu, generiert) | RAD-12 | nur über `scripts/build-radiasthesie-pages.cjs` erzeugen, nie von Hand editieren |
| `scripts/build-radiasthesie-pages.cjs` (neu) | RAD-12 | ein Schreiber; nutzt `js/data` + `radiasthesie-views.js` unverändert |
| `scripts/build-pages.cjs` | RAD-12 | `'radiasthesie'` in die Kopierliste (`:9-21`), sonst nichts |
| `tests/radiasthesie-static.mjs` (neu) | RAD-12 | prüft erzeugtes HTML ohne Browser |
| `.github/workflows/ci.yml` | RAD-13 | ein Schritt `npm run test:radiasthesie` |
| `package.json` | RAD-13 (`test:radiasthesie`-Glob) | ein Edit |
| `assets/radiasthesie/**` | W5a | nur neue Dateien, bestehende vier SVGs nicht ersetzen |

## 4. Definition of Ready / Done je Welle

**Ready:** Vorgängerwelle committet; `npm run test:radiasthesie` grün; Arbeitsbaum
ohne fremde uncommittete Änderungen an den Dateien, die die Welle schreibt;
Entscheidungen der Welle (U-Liste) beantwortet.

**Done:** Code + Tests im selben Commit; `npm run build` grün (erzeugt `dist/`
und `Lokal.html`); betroffene Suiten grün; `docs/radiasthesie-completion/<Paket>/CHECKPOINT.md`
geschrieben; keine fremden Dateien im Commit (`git add` nur mit expliziten Pfaden).

## 5. Wann eine Eskalation gerechtfertigt ist

Die Karte erlaubt Codex nur als gezielte, begründete Eskalation über die
bestehende `codex_escalation`-Route. Sinnvoll sind genau zwei Fälle:

1. **Statistik in RAD-09** (exakter Binomialtest, Wilson-Intervall, Blinding-Reihenfolge):
   eine unabhängige Zweitprüfung der Formeln gegen Referenzwerte.
2. **Generator-Umbau** (RAD-02/RAD-03/RAD-12), wenn sich zeigt, dass das strikte
   Markup-Parsing die neuen Entitäten oder die statische Ausgabe nicht tragen kann.

Nicht gerechtfertigt: UI-Feinheiten, Textformulierungen, CSS-Abstände — dafür
genügt der bestehende Mess- und Testapparat.
