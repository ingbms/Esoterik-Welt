# ADR-0001 — Frequenzlabor: Architektur und Schnittstellenvertrag

- **Status:** angenommen (verbindlich für die Umsetzung)
- **Datum:** 2026-11-02
- **Repository:** `ingbms/Esoterik-Welt`, Basis `origin/main` @ `b18bdb3`
- **Ticket:** Kanban `t_d06845ef` (Architektur), Master `t_ffb2fea6`
- **Betroffene Tickets:** `t_2b60eff1` (Daten), `t_2ce71bc5` (Engine), `t_6b8164b3` (UI), `t_835bd1e9` (QA), `t_a0f14bb2` (Review)

Diese Entscheidung ist bindend. Abweichungen brauchen eine begründete Änderung dieses Dokuments im selben Pull Request, in dem sie entstehen. Der Vertrag in §4 ist die einzige Wahrheit für die Engine; der Code-Block in §4.1 ist bis auf den Dateikopf byte-gleich mit `js/modules/frequenz-engine.d.ts`.

**Änderungsnachweis 2026-11-03 (`t_f2a0868c`, Review `t_a0f14bb2`):** Der Nachtrag in §4.4/§4.5 präzisiert erstens die sichtbare Pause-/Weiter-Bedienung, die der Master-Auftrag §3.2 („Play, Pause und Stop“) fordert und die §4.4 bisher nur als Abbildung auf `stop()` beschrieb, ohne dass die UI sie anbot (Befund B3). Zweitens dokumentiert er vier Festlegungen der Engine-Implementierung (`js/modules/frequenz-engine.js`, PR #5), die von der ursprünglichen Formulierung abweichen (Befund B7). Beides ändert weder den Vertragsblock in §4.1 (weiterhin byte-gleich, 9.395 B) noch die Methodensignaturen; §1 verlangt für solche Abweichungen eine begründete Änderung dieses Dokuments, die hiermit vorliegt.

---

## 1. Ziel und Abgrenzung

Das Frequenzlabor ergänzt die statische Website um eine Hauptkategorie **„Frequenzen & Schwingungen“** mit:

1. einer quellenbasierten Frequenzbibliothek (Datenlieferung `t_2b60eff1`),
2. einem clientseitigen Tongenerator (Web Audio API),
3. einer Live-Visualisierung (Oszillogramm, optional Spektrum),
4. einem binauralen Generator (kanalgetrennt),
5. einem kontrollierten 432/440-Hz-Hörvergleich.

Nicht in dieser Stufe: Chladni/Cymatics (P9) und Meditationssitzungen (P10). Beide werden über Feature-Flags vorbereitet, aber nicht implementiert.

**Leitplanken aus dem Master-Auftrag, die die Architektur erzwingen:**

- keine Framework-Migration, keine unnötigen Abhängigkeiten,
- vollständig clientseitig, keine externen Requests, kein Tracking,
- `file://`-Offline-Build muss weiter funktionieren,
- keine Audioausgabe ohne bewusste Nutzerinteraktion,
- keine Heilversprechen und keine irreführenden Wirkaussagen,
- Schumann-Resonanzen, EEG-Bänder und Rife-Frequenzen dürfen nicht als hörbare Töne ausgegeben werden, nur weil ihre Zahlen im Hörbereich liegen.

---

## 2. Ist-Zustand (verifiziert am 2026-11-02, `origin/main` @ `b18bdb3`)

Alle Angaben wurden im Repository mit den genannten Befehlen erhoben; es sind keine Schätzwerte.

### 2.1 Stack und Build

| Bereich | Befund | Beleg |
| --- | --- | --- |
| Hosting | GitHub Pages, Projektpfad `/Esoterik-Welt/`, `main:/` als Quelle | `README.md`, `<base href="/Esoterik-Welt/" />` in `index.html:39` |
| Sprache | Statisches HTML, CSS, Vanilla JavaScript (ES-Module); `package.json` → `"type": "commonjs"` | `package.json:65` |
| Laufzeitabhängigkeit | nur `express` (lokale Vorschau) | `package.json` |
| Build | `npm run build` → `scripts/build-pages.cjs`: kopiert `index.html`, Legal-Seiten, `css/`, `js/`, `data/`, `assets/` nach `dist/Esoterik-Welt/` und ruft `build-local.cjs` | `scripts/build-pages.cjs:1-37` |
| Offline-Build | Webpack-IIFE aus `js/main.js`, CSS und Fonts werden inline gestellt, erzeugt `Lokal.html` und `Lokal-*.html` | `scripts/build-local.cjs:1-105` |
| Kein Bundler im HTTP-Pfad | Browser lädt ES-Module direkt; kein Vite/Astro/Tailwind | `README.md` |
| TypeScript | kein `tsc`, kein `tsconfig.json`; `js/types.ts` und `js/types.js` sind ungenutzte Dokumentation | `grep -rn "types.ts"` findet nur `dist/` und `evidence/` |
| Audio | kein `AudioContext` im gesamten Quellbaum | `grep -rIl AudioContext --include='*.js'` → 0 Treffer (ohne `node_modules`, `dist`) |

### 2.2 Routing und Seitenmodell

| Bereich | Befund | Beleg |
| --- | --- | --- |
| Router | `js/main.js` (532 Zeilen), Hash-Routing ohne Server | `js/main.js:1-532` |
| Seiten-IDs | `home, tarot, crystals, moon, runes, astrologie, blog` (7) | `js/main.js:21` |
| Navigation | 7 `a.nav-link[data-page]`-Einträge | `index.html:69-75` |
| Seitencontainer | 7 `<section class="page" id="…">`, nicht aktive Seiten `hidden` | `index.html:98,222,328,432,571,591,645` |
| Metadaten | `PAGE_META` mit Titel/Description je Seite; `applyRouteMeta()` schreibt `document.title`, `meta[name=description]`, OG/Twitter | `js/main.js:36-91` |
| Sub-Routen | Astrologie hat ein eigenes Muster `ASTROLOGIE_ROUTE` mit Segmenten und Query | `js/main.js:30, 93-110` |
| Modul-Lebenszyklus | `navigateTo()` ruft `module.show(segments, query, {focus})` oder `module.onShow()`; **es gibt kein `onHide()`** | `js/main.js:402-449` |
| Deep-Link-Verhalten | `popstate` + `hashchange`, `history.scrollRestoration = 'manual'`, unbekannte Fragmente zeigen eine Route-Notice statt einer leeren Seite | `js/main.js:262-305, 366-399` |
| Startseite | Feature-Register mit 6 Karten aus `populateFeatureGrid()`, Label „Sechs Zugänge“ | `js/main.js:462-518`, `index.html:141-144` |
| Footer | „Tools“-Spalte mit 4 Links | `index.html:698-706` |

### 2.3 Styling und Designsystem

| Bereich | Befund | Beleg |
| --- | --- | --- |
| Tokens | `css/design-system.css` (1387 Zeilen); normative Palette Basalt/Kreide/Sand, Typografie Fraunces/Manrope, 4px-Raster, `--radius-*: 2px` | `css/design-system.css:42-135` |
| Seiten-CSS | `css/main.css` (3849 Zeilen), BEM-nahe, überwiegend element-/bereichsbezogene Selektoren | `wc -l css/main.css` |
| Reduced Motion | global `prefers-reduced-motion` (Animationen/Transitions aus, `scroll-behavior: auto`) | `css/design-system.css:220-233` |
| Formularelemente | keine Gestaltung für `input[type="range"]` vorhanden | `grep -n 'input\[type="range"\]' css/*.css` → 0 Treffer |
| Offline-CSS | `build-local.cjs` inlined jedes Stylesheet mit `href="css/…"` und bricht bei `url(` ab, außer lokalen Fonts | `scripts/build-local.cjs:66-82` |

### 2.4 Tests und CI

| Bereich | Befund | Beleg |
| --- | --- | --- |
| Jest | `testEnvironment: node`, nur `tests/**/*.test.js` (API/Unit, kein Browser) | `jest.config.cjs` |
| node:test | Vertrags- und Inhaltstests als `.cjs`/`.mjs` (u. a. Seitenregression, Kristalle, Astrologie, Tarot, Mond, Offline-Datei) | `package.json` → `test:*` |
| Playwright | `tests/**/*.spec.js`, Chromium, 1 Worker, Basis-URL `/Esoterik-Welt`, `webServer: node index.js` | `playwright.config.cjs` |
| Testumfang | 27 Dateien in `tests/` | `ls tests/*` |
| CI | 4 Jobs: `lint` (ESLint 9.39.1 + Prettier 3.6.2), `unit-test` (Build + Jest + alle node:test-Suiten), `build` (Build + `verify-pages`), `browser-e2e` (Playwright) | `.github/workflows/ci.yml:14,46,94,129` |
| Node | 20 in allen Jobs | `.github/workflows/ci.yml:23,55,104,139` |
| Trigger | Push auf `main`, `wt/*`, `feature/*`; Pull Requests gegen `main` | `.github/workflows/ci.yml:3-8` |
| Branch-Schutz | `main` ist **nicht** geschützt (API: „Branch not protected“) | `gh api repos/ingbms/Esoterik-Welt/branches/main/protection` |
| Prettier/ESLint | `docs/**` und `*.ts` werden ignoriert; geprüft werden `js,cjs,mjs,html,css` | `.prettierignore`, `eslint.config.cjs` |

### 2.5 Daten und Offline-Muster

| Bereich | Befund | Beleg |
| --- | --- | --- |
| Daten | `data/crystals.json`, `data/runes.json`, `data/tarot.json`, `data/moon-astro.mjs`, `js/data/*.js` | `ls data js/data` |
| Kristalle-Muster | HTTP: `fetch('./data/crystals.json')`; `file://`: eingebettetes `<script id="local-crystals-data" type="application/json">` | `js/modules/crystals.js:31-32`, `scripts/build-local.cjs:38,82` |
| Frequenzdaten | `data/frequencies.json` existiert noch nicht (Lieferung `t_2b60eff1`) | `ls data` |

### 2.6 Gemessene Ausgangsgrößen (für das Budget in §7.1)

| Größe | Wert | Messung |
| --- | --- | --- |
| Initialer JS-Graph (16 rekursiv statisch geladene Dateien ab `js/main.js`) | **287.228 B raw / 84.275 B gzip -9** | Traversierung der statischen `import`-Kanten, `gzip -9` je Datei |
| davon größte Einzeldatei `js/data/tarot.js` | 43.658 B raw / 12.294 B gzip | Messung |
| CSS gesamt | 23.352 B gzip -9 | `design-system.css` 7.895 + `main.css` 15.457 |
| `js/main.js` | 19.982 B raw / 6.412 B gzip | `wc -c`, `gzip -9` (Arbeitsbaum @ `b18bdb3`) |

Die Summe der Einzeldateien ist eine Obergrenze, kein Bundle-Messwert (gemeinsame Gzip-Wörterbücher fehlen); sie dient nur als Vergleichsbasis für die Delta-Budgets. Der Graph enthält bereits `js/data/tarot.js`, `js/data/tarot-decks.js`, `js/data/moon.js` und `js/article-content.js`; `data/moon-astro.mjs` und die Astrologie-Daten werden dynamisch geladen und zählen nicht dazu.

### 2.7 Zwänge, die aus dem Ist-Zustand folgen

1. **Kein Framework, kein TypeScript-Build.** Der Vertrag muss als Typdokumentation plus JSDoc im JavaScript leben; CI kann ihn nicht kompilieren.
2. **Ein Dokument, ein Router.** Eine neue Kategorie ist eine neue `page`-ID plus Modul; kein zweiter Router.
3. **Offline-Build ist ein separater Pfad.** Jede neue Ressource braucht eine `file://`-Strategie; dynamische Imports werden von Webpack `eager` inlined.
4. **Kein `onHide()`.** Ohne additive Router-Erweiterung kann eine Seite beim Verlassen nicht zuverlässig Audio stoppen — das ist ein Sicherheitskriterium (kein Hintergrundton).
5. **Initiale Ladezeit ist bereits gemessen.** Neue Audio-Funktionalität darf den Initialpfad praktisch nicht vergrößern.
6. **Hash-Routen sind keine indexierbaren Dokumente.** SEO für die Kategorie ist eine separate Entscheidung (§3, AD-8).

---

## 3. Architekturentscheidungen

Format: Entscheidung → Begründung → verworfene Alternativen → Folgen.

### AD-1: Web Audio API direkt, keine Wrapper-Bibliothek

**Entscheidung:** Die Engine spricht die Web Audio API direkt an (`AudioContext`, `OscillatorNode`, `GainNode`, `StereoPannerNode`, `AnalyserNode`, `ChannelSplitterNode`). Keine Laufzeitabhängigkeit.

**Begründung:**

- Der Master-Auftrag verbietet unnötige Abhängigkeiten; das Projekt hat heute genau eine Laufzeitabhängigkeit (`express`, nur Vorschau).
- Die geforderten Funktionen (Sinus/Oszillator, Gain-Rampe, Sweep, Analyser, kanalgetrennte Töne) sind API-Primitive. Eine Bibliothek liefert darüber hinaus keinen Vertrag, den wir nicht selbst präziser definieren.
- Der Offline-Build bündelt `js/main.js` mit Webpack; jede Bibliothek vergrößert den einen `local.js`-Bundle und damit `Lokal.html`. Das 100-kB-Budget und die Ladezeit sprechen dagegen.
- Der Vertrag muss deterministisch testbar sein. Direkte API-Aufrufe lassen sich mit einem Fake-Context exakt auf Parameter und Zeitpunkte prüfen; Bibliotheks-Interna nicht.

**Verworfen:**

- *Tone.js*: Komfortabler Scheduler, aber ein großer eigener Abhängigkeitsbaum, eigene Konzepte (`Transport`, `Synth`) und ein eigenes Zeitmodell. Für einen Oszillator mit Gain-Rampe ist das unverhältnismäßig; die Bibliothek müsste zusätzlich offline gebündelt und lizenziert werden.
- *Howler.js*: Ist eine Wiedergabe-Bibliothek für Samples, keine Synthese-Engine. Für Oszillatoren und `AudioParam`-Rampen ungeeignet.
- *Eigenes Miniframework*: würde nur die API umbenennen und die Testbarkeit verschlechtern.

**Folgen:** Mehr Verantwortung für Lebenszyklus und Pegel im eigenen Code; dafür vollständige Kontrolle, keine Fremdupdates und ein prüfbarer Vertrag.

### AD-2: Rendering — statische HTML-Hülle plus clientseitiges Rendering, kein SSR

**Entscheidung:** Die Seite ist eine neue `<section class="page" id="frequenzen">` in `index.html` (HTML-Hülle mit `<noscript>`-Zusammenfassung). Alle interaktiven Teile rendert ein ES-Modul im Browser. Kein SSR, kein Prerendering, keine separate Framework-Route.

**Begründung:**

- GitHub Pages liefert statische Dateien; SSR ist technisch nicht verfügbar und wäre eine Infrastrukturänderung.
- Alle bestehenden Bereiche funktionieren nach diesem Muster (HTML-Container + Modulklasse + Router-ID). Ein Sonderweg für eine Seite wäre inkonsistent.
- Die Hülle erlaubt sofortiges Layout ohne JavaScript; die interaktive Fläche erscheint erst nach dem lazy geladenen Modul.

**Verworfen:**

- *Separate statische Landingpage `frequenzen.html`*: würde Inhalte duplizieren, Canonical-Konflikte erzeugen und die Navigation spalten (siehe AD-8).
- *Clientseitiges Framework (React/Vue)*: ausdrücklich unzulässig und für eine Seite unwirtschaftlich.

**Folgen:** Ohne JavaScript bleibt nur die `<noscript>`-Zusammenfassung sichtbar; das ist für ein Audio-Werkzeug akzeptabel und wird im Text klar benannt.

### AD-3: State-Management — modul-lokaler Controller, Engine als autoritativer Audiozustand

**Entscheidung:** Kein globaler Store, kein Event-Bus. Der Controller `FrequenzlaborModule` hält den UI-Zustand (gewählte Ansicht, Preset-ID, Formularwerte, Fokus). Die Engine hält den Audiozustand und ist für Status, aktive Frequenzen und Fehler autoritativ. Die UI abonniert `engine.subscribe()` und rendert daraus; umgekehrt ruft sie nur Engine-Methoden auf.

**Begründung:**

- Das Projekt kennt nur Modulklassen mit eigenem Zustand (`TarotModule`, `MoonModule`, `AstrologieModule`). Ein globaler Store hätte genau einen Konsumenten.
- Zwei Wahrheiten für denselben Wert (z. B. „läuft der Ton?“) führen zu Desynchronisation. Deshalb: Audiozustand nur in der Engine, UI-Zustand nur im Controller.
- Die Engine ist ohne DOM testbar; der Controller ist ohne Audio testbar, wenn er die Engine als Parameter erhält.

**Verworfen:**

- *Zentraler Store mit Reducern*: zusätzliche Abstraktion ohne zweiten Konsumenten.
- *DOM als State* (Werte aus Inputs lesen): bei asynchronen Rampen und Fehlern nicht belastbar.

**Folgen:** Der Controller muss Engine-Events in Rendering übersetzen; das ist eine dünne, explizite Schicht.

### AD-4: Persistenz — `localStorage`, versioniert und validiert, nur Präferenzen

**Entscheidung:** Präferenzen liegen unter dem Schlüssel `esoterik-welt:frequenzlabor:v1` in `localStorage`. Gespeichert werden ausschließlich: `freqHz`, `waveform`, `gainDb`, `presetId`, `view`, `binaural: {carrierHz, deltaHz}`, `sweep: {seconds, curve}` und `favorites: string[]`. Keine Analysedaten, keine Audiodaten, keine Zeitstempel-Verläufe.

**Begründung:**

- Die Datenmenge ist klein (< 2 kB), lokal und unkritisch; `localStorage` ist synchron und in allen Zielbrowsern verfügbar.
- Ein versionierter Schlüssel erlaubt spätere Schemaänderungen ohne Migrationsterror: Bei unbekannter Version wird der Eintrag ignoriert und überschrieben.
- `localStorage` kann blockiert sein (Datenschutzmodus, `file://` in einigen Browsern). Lesen/Schreiben laufen daher in `try/catch`; ein Fehler deaktiviert nur die Persistenz, nie das Labor.

**Verworfen:**

- *IndexedDB*: asynchroner Lebenszyklus für wenige Skalare unverhältnismäßig.
- *Cookies*: würden bei jeder Anfrage mitgesendet und sind für rein lokale Präferenzen falsch.
- *Server/Session*: widerspricht „keine Registrierung, keine Cloudanbindung“.

**Folgen:** Presets sind geräte-/browserlokal; das wird in der UI als solches benannt. Kein Sync, kein Export in dieser Stufe.

### AD-5: Feature-Flags — statische Konstanten, lokale URL-Overrides, dynamische Imports

**Entscheidung:** `js/modules/frequenz-flags.js` exportiert ein eingefrorenes Objekt:

```js
export const FEATURES = Object.freeze({
  labor: true,
  binaural: true,
  visualisierung: true,
  vergleich432440: true,
  cymatics: false, // P9, nicht implementiert
  meditation: false, // P10, nicht implementiert
});
```

Deaktivierte Features werden **nicht importiert** (dynamic `import()` erst hinter dem Flag). Ein URL-Override `?fq=+cymatics,-binaural` ist nur auf `localhost`, `127.0.0.1` und `file:` erlaubt; auf der Produktionsdomain wird er ignoriert. Flags werden nie persistiert.

**Begründung:**

- Kein Remote-Config-Dienst, kein Netzwerk: Flags sind Teil des Builds und damit offline verfügbar.
- Der Master-Auftrag verlangt gestufte Auslieferung (P9/P10 optional). Ein Flag ohne dynamischen Import würde toten Code in jedes Bundle ziehen; der Import hinter dem Flag kostet 0 Byte, solange das Feature aus ist.
- Produktions-Overrides wären ein unkontrollierter Schalter; die Einschränkung auf lokale Origins hält die öffentliche Seite deterministisch.

**Verworfen:** Remote-Flags (Netzwerk), `localStorage`-Flags (nicht reproduzierbar), Build-Varianten (GitHub Pages baut nur `main`).

**Folgen:** Ein Flag wird entfernt, sobald das Feature vollständig ausgeliefert ist; spätestens nach zwei Releases. Flags sind kein dauerhafter Konfigurationsmechanismus.

### AD-6: Routen — `#frequenzen` als Kategorie, `#frequenzen/labor` als Werkzeug, `#frequenzlabor` als Alias

**Entscheidung:**

- **`#frequenzen`** ist die Hauptkategorie (Bibliothek, Erklärstück, Disclaimer, Einstieg ins Labor). Sie ist die neue `page`-ID `frequenzen` und erscheint in Hauptnavigation, Footer und Startseiten-Register.
- **`#frequenzen/labor`** ist die Werkzeugansicht (Slider, Presets, Play/Stop, Sweep, Visualisierung, Binaural, 432/440).
- **`#frequenzlabor`** (und `#frequenzlabor/...`) ist ein Alias und wird per `history.replaceState()` auf `#frequenzen/labor` normalisiert, ohne zusätzlichen History-Eintrag.
- Weitere Unterseiten gibt es nicht. Abschnitte innerhalb des Labors sind Sprungmarken, keine Routen.

**Begründung:**

- Der Master-Auftrag nennt `#frequenzen` ausdrücklich als direkten Zugang.
- Das UI-Ticket `t_6b8164b3` nennt „Route /frequenzlabor“. Der Alias löst den Widerspruch ohne doppelte Ansicht und ohne toten Deep-Link.
- Die Astrologie zeigt das Muster „eine Seite, Sub-Routen vom Modul gerendert“ bereits vor; das wird übernommen, statt einen zweiten Router zu bauen.

**Verworfen:** zwei unabhängige Seiten (`#frequenzen` und `#frequenzlabor`), reine Query-Parameter (`#frequenzen?view=labor`) — schlechter lesbar und nicht dem bestehenden Muster entsprechend.

**Folgen:** `MAIN_PAGES` wächst um `frequenzen` (8 IDs), die Navigation um einen Eintrag. `parseRoute()` bekommt ein Frequenz-Muster; die Detailintegration steht in §6.2.

### AD-7: Datenladen — `fetch` auf HTTP, eingebettetes JSON auf `file://`

**Entscheidung:** `frequenz-presets.js` lädt `data/frequencies.json` unter HTTP per `fetch(new URL('data/frequencies.json', document.baseURI))`. Im Offline-Build liest es `<script id="local-frequencies-data" type="application/json">`. Fehlt beides, arbeitet das Labor mit leerer Preset-Liste weiter; der manuelle Generator bleibt funktionsfähig.

**Begründung:**

- Das ist exakt das etablierte Kristalle-Muster (`#local-crystals-data`), inklusive Build-Erweiterung.
- `import … with { type: 'json' }` ist browserabhängig und im Webpack-Offline-Pfad zusätzlicher Konfigurationsaufwand.
- Eine duplizierte JS-Datenkopie (`data/frequencies.json` + `js/data/frequenzen.js`) würde bei jeder Datenänderung auseinanderlaufen; das Repo hat dieses Problem bei Runen bereits und soll es nicht wiederholen.

**Folgen:** `scripts/build-local.cjs` wird um ein optionales Einbetten erweitert (§6.4); fehlt die Datei, wird gewarnt und kein Skript-Tag erzeugt.

### AD-8: SEO — keine separate Landingpage in dieser Stufe

**Entscheidung:** Die Kategorie bleibt eine Hash-Ansicht von `index.html`. Es wird **keine** eigene `frequenzen.html` angelegt und `sitemap.xml` bleibt unverändert. Die SEO-Bewertung einer eigenen indexierbaren Seite ist ein separates Ticket (P11) und keine Voraussetzung für das Labor.

**Begründung:**

- Eine zweite Seite mit demselben Inhalt erzeugt Duplicate Content und widersprüchliche Canonicals; das Repo hat bereits eine kanonische Startseite.
- Hash-Routen sind keine eigenständigen Dokumente — das ist im Repo dokumentiert (`sitemap.xml`-Kommentar) und im Master-Auftrag ausdrücklich als Bewertungsfrage, nicht als Pflicht formuliert.
- Die Kategorie ist über Navigation, Footer und Startseiten-Register intern verlinkt; das ist für die Auffindbarkeit in dieser Stufe ausreichend.

**Folgen:** Keine neuen indexierbaren URLs. Wenn P11 eine statische Landingpage beschließt, muss sie kanonisch auf `/Esoterik-Welt/` zeigen oder die Hash-Ansicht ersetzen — dann ist dieses ADR zu ändern.

---

## 4. Schnittstellenvertrag der Audio-Engine (verbindlich)

### 4.1 TypeScript-Typen

Kanonische Datei: `js/modules/frequenz-engine.d.ts`. Der folgende Block ist **byte-gleich** mit dieser Datei ohne den einleitenden Dateikopf-Kommentar. Bei Änderungen werden beide Stellen gemeinsam angepasst; die Prüfung steht in §12.

```ts
/** Erlaubte Oszillator-Wellenformen. */
export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth';

/** Verlauf eines Frequenz-Sweeps. */
export type SweepCurve = 'linear' | 'exponential';

/** Analysator-Kanal: Summe (mono) oder einzelne Stereoseite. */
export type AnalyserChannel = 'mix' | 'left' | 'right';

/**
 * `idle`     – keine Stimmen; ein AudioContext darf fehlen.
 * `starting` – play()/playBinaural() läuft, Kontext wird erzeugt/resumiert.
 * `running`  – Stimmen laufen.
 * `unsupported` – Web Audio API fehlt; play() lehnt ab.
 * `error`    – letzter Startversuch ist fehlgeschlagen; play() darf erneut versuchen.
 * `disposed` – Instanz ist endgültig beendet; play() lehnt ab.
 */
export type EngineStatus = 'idle' | 'starting' | 'running' | 'unsupported' | 'error' | 'disposed';

/** Stabile Fehlercodes. Die UI übersetzt Codes, niemals `message`. */
export type EngineErrorCode =
  | 'unsupported'
  | 'context_blocked'
  | 'context_closed'
  | 'invalid_frequency'
  | 'invalid_argument'
  | 'invalid_state'
  | 'internal';

/** Serialisierbarer Fehlerzustand in `EngineState.lastError`. */
export interface FrequencyEngineErrorInfo {
  readonly code: EngineErrorCode;
  /** Technischer Text (englisch); nicht ungefiltert als UI-Text rendern. */
  readonly message: string;
  /** true, wenn ein erneuter Versuch nach Nutzerinteraktion sinnvoll ist. */
  readonly recoverable: boolean;
}

export interface BinauralState {
  readonly carrierHz: number;
  /** Differenzfrequenz; immer positiv. */
  readonly deltaHz: number;
  /** Linker Kanal; identisch mit carrierHz. */
  readonly leftHz: number;
  /** Rechter Kanal; leftHz + deltaHz, auf maxHz begrenzt. */
  readonly rightHz: number;
}

export interface SweepState {
  readonly fromHz: number;
  readonly toHz: number;
  readonly seconds: number;
  readonly curve: SweepCurve;
  /** Zeitbasis `performance.now()` beim Start; den Fortschritt rechnet die UI. */
  readonly startedAtMs: number;
}

/**
 * Unveränderlicher Zustands-Schnappschuss. Jede Emission erhöht `revision`
 * um genau eins; `state` wird bei jeder Änderung ersetzt, nie mutiert.
 */
export interface EngineState {
  readonly status: EngineStatus;
  /** null, solange keine Stimmen laufen. */
  readonly mode: 'tone' | 'binaural' | null;
  /** Primärfrequenz bzw. Trägerfrequenz; immer auf [minHz, maxHz] geklemmt. */
  readonly freqHz: number;
  /** Aktive Stimmen in Hz (1..maxVoices); bei binaural [leftHz, rightHz]; sonst []. */
  readonly frequenciesHz: ReadonlyArray<number>;
  readonly waveform: WaveformType;
  /** Auf [minGainDb, hardCapGainDb] geklemmt. */
  readonly gainDb: number;
  readonly binaural: BinauralState | null;
  readonly sweep: SweepState | null;
  readonly contextState: 'none' | 'suspended' | 'running' | 'closed';
  /** Bleibt bis zur nächsten erfolgreichen Operation gesetzt. */
  readonly lastError: FrequencyEngineErrorInfo | null;
  readonly revision: number;
}

export interface PlayOptions {
  readonly waveform?: WaveformType;
  readonly gainDb?: number;
  /** Einblendzeit in ms; auf [0, 1000] geklemmt, Standard `fadeMs`. */
  readonly fadeInMs?: number;
}

export interface BinauralOptions {
  readonly carrierHz: number;
  readonly deltaHz: number;
  readonly waveform?: WaveformType;
  readonly gainDb?: number;
  readonly fadeInMs?: number;
}

export interface StopOptions {
  /** Ausblendzeit in ms; auf [0, 1000] geklemmt, Standard `fadeMs`. */
  readonly fadeOutMs?: number;
}

export interface RampOptions {
  /** Rampendauer in ms; auf [0, 1000] geklemmt, Standard `rampMs`. */
  readonly rampMs?: number;
}

export interface SweepOptions {
  readonly curve?: SweepCurve;
  readonly rampMs?: number;
}

export interface SweepResult {
  /** false, wenn der Sweep durch stop(), cancelSweep() oder dispose() endete. */
  readonly completed: boolean;
  readonly endedAtHz: number;
}

export interface FrequencyEngineOptions {
  /**
   * Nur für Tests: ersetzt `new AudioContext()`. Ein `OfflineAudioContext`
   * schaltet den Testmodus ein (kein resume(), Status wird direkt `running`).
   * `null` simuliert eine fehlende Web-Audio-API.
   */
  readonly audioContextFactory?: () => AudioContext | OfflineAudioContext | null;
  /** Nur für Tests: Zeitquelle für `SweepState.startedAtMs`; Standard performance.now. */
  readonly now?: () => number;
}

export interface FrequencyEngineLimits {
  readonly minHz: number;
  readonly maxHz: number;
  readonly defaultHz: number;
  readonly minGainDb: number;
  readonly defaultGainDb: number;
  readonly hardCapGainDb: number;
  readonly fadeMs: number;
  readonly rampMs: number;
  readonly maxVoices: number;
  readonly fftSize: number;
  readonly analyserSmoothing: number;
  readonly minSweepSeconds: number;
  readonly maxSweepSeconds: number;
  readonly minBinauralDeltaHz: number;
  readonly maxBinauralDeltaHz: number;
}

/** Normative Zahlenwerte; siehe ADR §4.3. */
export declare const FREQUENCY_LIMITS: FrequencyEngineLimits;

/** Pegelabsenkung je Wellenform in dB: sine 0, triangle 0, square -6, sawtooth -6. */
export declare const WAVEFORM_TRIM_DB: Readonly<Record<WaveformType, number>>;

/** Fehlerklasse für synchrone Setter und abgelehnte Promises. */
export declare class FrequencyEngineError extends Error {
  readonly code: EngineErrorCode;
  readonly recoverable: boolean;
  constructor(code: EngineErrorCode, message: string, recoverable?: boolean);
}

export type StateListener = (state: EngineState) => void;

/**
 * Einzige Audioquelle der Seite. Es existiert höchstens eine Instanz pro
 * Dokument (`getFrequencyEngine()`); alle Methoden laufen auf derselben
 * Zustandsmaschine.
 */
export interface FrequencyEngine {
  /** Aktueller Schnappschuss; nie mutieren. */
  readonly state: EngineState;

  /** Prüft die Web Audio API, ohne einen AudioContext zu erzeugen. */
  isSupported(): boolean;

  /**
   * Startet einen Ton oder übernimmt die Parameter, wenn bereits ein
   * Ein-Ton-Lauf aktiv ist. Kurzform für `playTones([freqHz])`. Ohne `freqHz`
   * gilt `state.freqHz` (Standard 440 Hz). Der erste Aufruf muss aus einem
   * Nutzerereignis heraus erfolgen.
   */
  play(freqHz?: number, options?: PlayOptions): Promise<void>;

  /**
   * Startet 1 bis `maxVoices` Stimmen im selben Kanal (z. B. 440 + 444 Hz für
   * eine Schwebung). Leere Liste oder mehr als `maxVoices` Einträge werden mit
   * `invalid_argument` abgelehnt.
   */
  playTones(frequenciesHz: ReadonlyArray<number>, options?: PlayOptions): Promise<void>;

  /** Startet zwei kanalgetrennte Töne (Kopfhörer nötig, wird nicht geprüft). */
  playBinaural(options: BinauralOptions): Promise<void>;

  /** Blendet aus und gibt alle Stimmen frei; idempotent. Parameter bleiben erhalten. */
  stop(options?: StopOptions): Promise<void>;

  /** Setzt die Primärfrequenz (bei mehreren Stimmen proportional skaliert). */
  setFrequency(freqHz: number, options?: RampOptions): void;

  /** Setzt die Wellenform aller Stimmen; darf keinen AudioContext erzeugen. */
  setWaveform(type: WaveformType): void;

  /** Setzt den Gesamtpegel in dBFS; klemmt auf [minGainDb, hardCapGainDb]. */
  setGain(gainDb: number): void;

  /** Ändert die Differenzfrequenz im Binaural-Modus; sonst `invalid_state`. */
  setBeatDelta(deltaHz: number, options?: RampOptions): void;

  /**
   * Fährt die Primärstimme von `fromHz` nach `toHz`. Nur im Ein-Ton-Modus;
   * startet den Ton, wenn noch keiner läuft. Das Promise löst beim Ende des
   * Rampen aus (auch bei Abbruch), `SweepResult.completed` unterscheidet die Fälle.
   */
  sweep(fromHz: number, toHz: number, seconds: number, options?: SweepOptions): Promise<SweepResult>;

  /** Bricht einen laufenden Sweep ab; idempotent. */
  cancelSweep(): void;

  /**
   * Zeitbereichsdaten des Analysators (Float32, [-1, 1], Länge `fftSize`).
   * Ohne laufenden Ton: Nullarray. Ein übergebenes `target` wird nur benutzt,
   * wenn seine Länge exakt `fftSize` ist; sonst wird der interne Puffer
   * zurückgegeben, der bei jedem Aufruf überschrieben wird.
   */
  getAnalyserData(channel?: AnalyserChannel, target?: Float32Array): Float32Array;

  /**
   * Spektraldaten in dBFS (Float32, Länge `fftSize / 2`), wie
   * `AnalyserNode.getFloatFrequencyData`. Ohne laufenden Ton: -Infinity.
   */
  getSpectrumData(channel?: AnalyserChannel, target?: Float32Array): Float32Array;

  /** Einzelner Handler; wird nach allen `subscribe`-Listenern aufgerufen. */
  onstatechange: StateListener | null;

  /** Mehrfach-Abonnement; gibt eine idempotente Abmeldefunktion zurück. */
  subscribe(listener: StateListener): () => void;

  /** Beendet Stimmen, schließt den AudioContext und leert alle Listener. */
  dispose(): Promise<void>;
}

/** Fabrik für Tests und Isolation; erzeugt genau eine Engine. */
export declare function createFrequencyEngine(options?: FrequencyEngineOptions): FrequencyEngine;

/** Prozessweite Singleton-Instanz (eine pro Dokument). */
export declare function getFrequencyEngine(): FrequencyEngine;

/** Modulweite Support-Prüfung ohne Seiteneffekte. */
export declare function isWebAudioSupported(): boolean;
`````````

Die menschenlesbaren Bedeutungen der Felder stehen als Kommentar in der `.d.ts`; die verbindliche Semantik steht in §4.2 bis §4.7.

### 4.2 Normative Konstanten

| Konstante | Wert | Bedeutung |
| --- | --- | --- |
| `minHz` | 20 | untere Grenze; darunter wird geklemmt |
| `maxHz` | 20000 | obere Grenze; darüber wird geklemmt |
| `defaultHz` | 440 | Startwert ohne Angabe |
| `minGainDb` | −60 | untere Pegelgrenze; darunter gilt Stille |
| `defaultGainDb` | −20 dBFS | sicherer Startpegel |
| `hardCapGainDb` | −6 dBFS | harte Obergrenze, auch bei direkten Aufrufen |
| `fadeMs` | 20 | Ein-/Ausblendung gegen Knackser |
| `rampMs` | 25 | Standard-Rampe für Frequenz-/Gain-Änderungen |
| `maxVoices` | 4 | maximale gleichzeitige Stimmen |
| `fftSize` | 2048 | Analysator-Zeitfenster (≈ 42,7 ms bei 48 kHz) |
| `analyserSmoothing` | 0,8 | `smoothingTimeConstant` für das Spektrum |
| `minSweepSeconds` | 0,1 | kürzester Sweep |
| `maxSweepSeconds` | 60 | längster Sweep |
| `minBinauralDeltaHz` | 0,1 | kleinste Differenzfrequenz |
| `maxBinauralDeltaHz` | 100 | größte Differenzfrequenz (darüber: Rauigkeit, kein Schwebeton) |

`WAVEFORM_TRIM_DB`: `sine: 0`, `triangle: 0`, `square: −6`, `sawtooth: −6`. Begründung: Rechteck/Sägezahn haben bei gleichem Spitzenwert eine höhere effektive Leistung und deutlich mehr Harmonische; die Absenkung verhindert Lautheitssprünge und schützt das Gehör.

**Klemmen statt Ablehnen:** Endliche Zahlen außerhalb eines Bereichs werden geklemmt. Abgelehnt wird nur Nicht-Endliches (`NaN`, `Infinity`), falscher Typ, unbekannte Enum-Werte und `≤ 0` bei Frequenzen (`invalid_frequency`). `0 Hz` ist Stille, kein Ton, und wird nicht als Frequenz akzeptiert.

### 4.3 Audio-Graph und Pegelregel

```
Tone-Modus, n Stimmen (1 ≤ n ≤ 4):
  Oscillator_i → voiceGain_i → mixBus → masterGain → destination
                                   │
                                   ├→ analyserMix            (Kanal "mix")
                                   └→ ChannelSplitter(2) → analyserL / analyserR

Binaural-Modus:
  OscL → voiceGain_L → StereoPanner(-1) ─┐
  OscR → voiceGain_R → StereoPanner(+1) ─┴→ mixBus → masterGain → destination
                                                        │
                                                        ├→ analyserMix
                                                        └→ ChannelSplitter(2) → analyserL / analyserR
```

**Pegel-Invariante (arithmetisch, ohne Kompressor):**

- `masterGain.gain = 10^(gainDb / 20)` mit `gainDb ≤ −6` → maximal 0,501.
- `voiceGain_i = 10^(trim_i / 20) / n` mit `n = aktive Stimmen`.
- Damit gilt für die Summe aller Stimmen im schlechtesten Fall (gleiche Phase, `n` Stimmen): `0,501 × n × (1/n) = 0,501` → **kein Clipping durch Konstruktion**. Bei zwei Stimmen im selben Kanal (z. B. 440 + 444 Hz) bleibt der Spitzenwert ≤ −6 dBFS.
- Ein `DynamicsCompressorNode` wird bewusst nicht verwendet: Er würde die Pegelgarantie verdecken, Latenz und Klangfarbe verändern und die Prüfbarkeit erschweren.

**Kein `gainDb`-Wert der UI kann die harte Grenze überschreiten:** Die Engine klemmt selbst; die UI klemmt zusätzlich für die sichtbare Anzeige (Defense in Depth).

### 4.4 Methodensemantik

Alle Setter sind synchron und dürfen **niemals** einen `AudioContext` erzeugen. Nur `play()` und `playBinaural()` dürfen ihn erzeugen oder fortsetzen.

| Methode | Vorbedingung | Wirkung | Fehler |
| --- | --- | --- | --- |
| `isSupported()` | keine | prüft `window.AudioContext`/`webkitAudioContext`; mit injizierter Factory `true`; erzeugt nichts | – |
| `play(freqHz?, opts?)` | Status ≠ `disposed` | Kurzform für `playTones([freqHz])`; startet genau eine Stimme oder übernimmt Parameter bei laufendem Ein-Ton-Modus; Context im selben Task erzeugen/resumen; Einblendung `fadeInMs` | `unsupported`, `context_blocked`, `context_closed`, `invalid_frequency`, `invalid_argument` |
| `playTones(freqs, opts?)` | Status ≠ `disposed`; 1 ≤ Länge ≤ 4 | startet eine Stimme je Frequenz im selben Kanal (Schwebung/Intervall); jede Frequenz geklemmt; Voice-Gain 1/n; Context wie `play()` | wie `play()`; `invalid_argument` bei leerer Liste oder > 4 Einträgen |
| `playBinaural(opts)` | Status ≠ `disposed` | zwei Stimmen, `leftHz = carrierHz`, `rightHz = carrierHz + deltaHz`; Panner hart ±1; Einblendung | zusätzlich `invalid_argument` bei `rightHz > maxHz` nach Klemmen |
| `stop(opts?)` | keine | blendet `fadeOutMs` aus, stoppt und trennt alle Oszillatoren; Status `idle`; Parameter bleiben erhalten | – (idempotent) |
| `setFrequency(f, opts?)` | – | Ton-Modus: eine Stimme → `f`; mehrere Stimmen → alle proportional skaliert (Intervalle bleiben, Ziele werden einzeln geklemmt; am Bereichsrand können Intervalle stauchen). Binaural: setzt `carrierHz`, `rightHz` folgt | `invalid_frequency`, `invalid_argument` |
| `setWaveform(type)` | – | setzt `oscillator.type` aller Stimmen; im Idle nur den Zustand | `invalid_argument` bei unbekanntem Wert |
| `setGain(db)` | – | klemmt und rampt `masterGain` über `rampMs`; im Idle nur den Zustand | `invalid_argument` |
| `setBeatDelta(delta, opts?)` | Modus = `binaural` | rampt beide Oszillatoren auf neuen Abstand; `carrierHz` bleibt | `invalid_state` außerhalb binaural; `invalid_argument` |
| `sweep(from, to, seconds, opts?)` | Modus ≠ binaural, Stimmen ≤ 1 | startet bei Bedarf einen Ton und rampt `from → to` über `seconds`; Promise löst am Ende oder Abbruch | `invalid_state` bei binaural/mehreren Stimmen; `invalid_frequency`, `invalid_argument` |
| `cancelSweep()` | – | bricht Rampe ab, `SweepResult.completed = false`, Ton bleibt auf letzter Frequenz | – |
| `getAnalyserData(ch?, target?)` | – | Zeitbereich, Länge `fftSize`, Werte [−1, 1]; ohne Ton Nullen | – |
| `getSpectrumData(ch?, target?)` | – | dBFS, Länge `fftSize / 2`; ohne Ton `−Infinity` | – |
| `subscribe(fn)` | – | meldet Listener an; gibt idempotente Abmeldefunktion zurück | – |
| `onstatechange` | – | einzelner Handler, wird nach allen `subscribe`-Listenern aufgerufen | – |
| `dispose()` | – | stoppt, schließt Context, leert Listener, Status `disposed` | – |

**Serialisierung:** `play()`, `playTones()`, `playBinaural()`, `stop()`, `sweep()` und `dispose()` laufen über eine interne FIFO-Kette. Zwei schnelle Klicks dürfen nie zwei Oszillator-Sätze erzeugen; der spätere Aufruf gewinnt. Setter werden sofort angewandt und sind von der Kette nicht betroffen.

**Wiederverwendung statt Neubau:** Läuft bereits ein Ton-Modus mit derselben Stimmenzahl, werden die vorhandenen Oszillatoren umgestimmt (`setFrequency`-Pfad) statt neu erzeugt. Bei Moduswechsel oder anderer Stimmenzahl wird alt in 20 ms ausgeblendet und neu eingeblendet.

**Pause ist keine Engine-Methode.** Die UI bildet „Pause“ als `stop()` ab und behält die Parameter im Controller; „Weiter“ ruft `play()` mit den gemerkten Werten. Damit gibt es keinen dritten Audiozustand, keine hängenden Oszillatoren und keine Race-Condition zwischen Pause und Stop. Die Buttons werden aus `state.status` abgeleitet und sind während `starting` deaktiviert.

**Nachtrag 2026-11-03 — sichtbare Pause-/Weiter-Bedienung (Review B3, Master-Auftrag §3.2).** Die Transportleiste hat drei Knöpfe; „Pause“ und „Weiter“ sind derselbe Knopf in zwei Beschriftungen:

| Knopf | Beschriftung | Aktiv bei Status | Aktion |
| --- | --- | --- | --- |
| `#fqPlay` | „Ton starten“ | `idle`, `error`, `unsupported` | `play()` mit Frequenz, Wellenform und Pegel aus dem Controller |
| `#fqPause` | „Pause“ | `running`, `starting` | `stop()` (20 ms Ausblenden); der Controller merkt „pausiert“ |
| `#fqPause` | „Weiter“ | pausiert (Engine `idle`) | `play()` mit den Werten, die der Controller hält |
| `#fqStop` | „Stopp“ | `running`, `starting`, pausiert | `stop()` und Pause-Merkzeichen löschen |

- Das Pause-Merkzeichen ist reiner UI-Zustand. `state.status` bleibt `idle`; es gibt **keine** dritte Stufe in `STATE_TEXTS`, keine neue Engine-Methode und keinen zusätzlichen Audiozustand.
- Ansage über `#fqStatus` (`role="status"`, NFR-15): „Ton pausiert bei <Hz>. ‚Weiter‘ setzt mit denselben Werten fort.“ bzw. „Weiter: Ton läuft: <Hz>, <dBFS>.“
- Beide Knöpfe sind native `<button>` und damit per Enter/Leertaste bedienbar (NFR-13); der Fokus bleibt beim Umschalten der Beschriftung auf dem Knopf.
- Jedes andere Starten (Preset, Sweep, Schwebung, binaural, 432/440) setzt das Merkzeichen zurück, ebenso jedes Stoppen von außen (`visibilitychange → hidden`, `pagehide`, Routenwechsel über `onHide`).
- Wird die Frequenz oder der Pegel während der Pause verändert, gilt für „Weiter“ der dann sichtbare Wert: Quelle ist der Controller, nicht ein Schnappschuss vom Pause-Zeitpunkt.
- Playwright-Fall U16 (§9.3) prüft Pause → `idle` ohne Stimmen, erhaltene Parameter, Ansage, fehlende dritte Statusstufe, Weiter per Tastatur mit denselben Werten und das Zurücksetzen durch „Stopp“.

**Nachtrag 2026-11-03 — vier Festlegungen der Engine-Implementierung (Review B7).** Sie präzisieren §4.3–§4.5, ohne den Vertragsblock (§4.1) oder Signaturen zu ändern; `js/modules/frequenz-engine.js` setzt sie um, `tests/frequenz-engine.mjs` prüft sie:

1. **`mixBus` ist explizit zweikanalig.** `mixBus.channelCount = 2`, `channelCountMode = 'explicit'`, `channelInterpretation = 'speakers'`. Grund: die Analysatorkanäle `left`/`right` sollen auch im Ton-Modus Signal sehen; mit `channelCountMode = 'max'` füllt ein Mono-Oszillator nur einen Kanal. Reine Graph-Detailentscheidung, kein Vertragsbestandteil.
2. **Aufrufe nach `dispose()` enden mit `context_closed`.** `play()`, `playTones()`, `playBinaural()`, `sweep()` sowie `setFrequency`, `setWaveform`, `setGain` und `setBeatDelta` werfen synchron `FrequencyEngineError('context_closed')`; `stop()` lehnt das Promise damit ab. Grund: ein stiller Erfolg würde einen beendeten Audiozustand vortäuschen; §4.5 lässt `disposed` nur als Endzustand zu. Ausnahmen: `dispose()` ist idempotent, `subscribe()` nimmt weiterhin Listener an (sie werden nicht mehr aufgerufen) und die Leser `getState()`, `getAnalyserData()` und `getSpectrumData()` liefern den letzten Zustand bzw. Nullen.
3. **`setFrequency()` während eines Sweeps bricht den Sweep ab.** Der Sweep-Promise löst mit `completed: false` auf, der Ton bleibt auf dem neuen Wert. Grund: zwei konkurrierende `AudioParam`-Automationen auf demselben Oszillator sind nicht deterministisch. `cancelSweep()` bleibt der ausdrückliche Weg; ein Setter darf ihn nicht unbemerkt überholen.
4. **`getFrequencyEngine()` erzeugt nach `dispose()` eine frische Instanz.** Grund: die beendete Instanz würde jeden Start mit `context_closed` ablehnen; das Singleton ist an einen nutzbaren Context gebunden, nicht an das Modul-Lebensende.


**Autoplay-Invariante:** `play()` erzeugt den Context synchron vor dem ersten `await`; zwischen dem auslösenden Nutzerereignis und der Context-Erzeugung darf kein `await` liegen. Deshalb werden Preset-Daten beim Betreten der Seite geladen, nicht im Klick-Handler.

**Safari/iOS:** Der Context wird mit `new AudioContext()` erzeugt und sofort `resume()` aufgerufen. Bleibt `ctx.state === 'suspended'`, ist das ein `context_blocked`-Fehler, kein stiller Erfolg.

### 4.5 Zustandsautomat

| Von | Ereignis | Nach | Bemerkung |
| --- | --- | --- | --- |
| `idle` | `play()` erfolgreich | `starting` → `running` | `starting` ist nur während des Context-Resume sichtbar |
| `idle` | `play()` ohne Support | `unsupported` | Promise lehnt mit `unsupported` ab; Status bleibt |
| `idle` | `play()` blockiert | `error` (mit `lastError`) | `recoverable: true`; erneuter Klick darf es versuchen |
| `starting` | Resume scheitert | `error` | keine Oszillatoren bleiben zurück |
| `running` | `stop()` | `idle` | nach `fadeOutMs`; Parameter bleiben |
| `running` | `sweep()` | `running` (`sweep ≠ null`) | Ende → `running` (`sweep = null`) |
| `running` (mit Sweep) | `setFrequency()` | `running` (`sweep = null`) | Sweep endet mit `completed: false` (Nachtrag §4.4, Punkt 3) |
| `running` | `cancelSweep()` | `running` | `SweepResult.completed = false` |
| `running` | `dispose()` | `disposed` | Context geschlossen |
| `error` | `play()` | `starting` | neuer Versuch erlaubt |
| `unsupported` | `play()` | `unsupported` | Promise lehnt mit `unsupported` ab; kein neuer Versuch |
| `disposed` | jeder Start | `disposed` | Promise lehnt mit `context_closed` ab |

`revision` startet bei 0 und wird bei **jeder** Emission um genau 1 erhöht. `state` ist ein neuer Schnappschuss; Listener dürfen ihn nicht mutieren. Eine Listener-Ausnahme wird geloggt und bricht die Benachrichtigung anderer Listener nicht ab.

### 4.6 Timing, Rampen und Sweep

- **Einblenden:** `masterGain.gain.setValueAtTime(0, now)` → `linearRampToValueAtTime(ziel, now + fadeInMs/1000)`.
- **Ausblenden:** aktuellen Wert mit `cancelAndHoldAtTime(now)` (Fallback: `cancelScheduledValues` + `setValueAtTime(currentValue)`) halten, dann linear auf 0 über `fadeOutMs`; Oszillatoren erst danach `stop()` und `disconnect()`.
- **Frequenzänderung:** `cancelAndHoldAtTime` → `linearRampToValueAtTime(ziel, now + rampMs/1000)`. Kein `setValueAtTime`-Sprung, damit keine Zipper-Geräusche entstehen.
- **Gain:** linear in **Amplitude**, nicht in dB, über `rampMs`. Die dB→Amplitude-Umrechnung erfolgt vor der Rampe.
- **Sweep exponentiell (Standard):** `exponentialRampToValueAtTime(toHz, start + seconds)`. Beide Endpunkte müssen > 0 sein (durch Klemmen auf ≥ 20 Hz erfüllt). Bei `curve: 'linear'` stattdessen `linearRampToValueAtTime`.
- **Sweep-Dauer:** `seconds` wird auf `[0.1, 60]` geklemmt. Das Promise löst nach `seconds × 1000 + rampMs` ms (Wanduhr); bei `cancelSweep()`, `stop()` oder `dispose()` wird der Timer gelöscht und mit `completed: false` aufgelöst.
- **Sweep-Zustand:** `SweepState.startedAtMs = now()` beim Start. Die UI berechnet den Fortschritt aus `performance.now() - startedAtMs`; die Engine emittiert **nicht** pro Frame. Das vermeidet Timer-Last und Zustandsflut.
- **Analysator:** `fftSize = 2048`, `smoothingTimeConstant = 0.8`, `minDecibels = -100`, `maxDecibels = 0`. `getAnalyserData()` nutzt `getFloatTimeDomainData`, `getSpectrumData()` nutzt `getFloatFrequencyData`.

### 4.7 Fehlerfälle und UI-Zuordnung

| Code | Auslöser | `recoverable` | UI-Text (deutsch, verbindlich) |
| --- | --- | --- | --- |
| `unsupported` | Web Audio API fehlt | nein | „Dieser Browser unterstützt die Web Audio API nicht. Das Frequenzlabor zeigt die Inhalte ohne Ton.“ |
| `context_blocked` | `resume()` abgelehnt, Context bleibt `suspended` | ja | „Der Browser hat die Audioausgabe blockiert. Bitte erneut auf ‚Ton starten‘ tippen.“ |
| `context_closed` | Context geschlossen / `dispose()` | nein | „Die Audioausgabe ist beendet. Bitte die Seite neu laden.“ |
| `invalid_frequency` | `NaN`, `Infinity` oder `≤ 0` | ja | „Diese Frequenz ist ungültig. Erlaubt sind 20 bis 20.000 Hz.“ |
| `invalid_argument` | unbekannte Wellenform, falscher Typ | ja | „Einstellung nicht gültig.“ |
| `invalid_state` | z. B. `setBeatDelta` im Ton-Modus | ja | „Diese Aktion ist in der aktuellen Betriebsart nicht verfügbar.“ |
| `internal` | unerwarteter Fehler | ja | „Die Audioausgabe ist fehlgeschlagen. Bitte erneut versuchen.“ |

Die Engine liefert **keine** deutschen UI-Texte; `message` ist ein technischer englischer Text für Logs. Die Zuordnung oben lebt im Controller.

**Browser-Ausnahmen werden klassifiziert:** `NotAllowedError` → `context_blocked`; `InvalidStateError` beim Schließen → `context_closed`; `NotSupportedError` → `unsupported`; alles andere → `internal` mit ursprünglicher `message` im Log (nicht im Zustand).

### 4.8 Testmodus mit `OfflineAudioContext`

Die Engine akzeptiert eine injizierte Factory, die auch einen `OfflineAudioContext` liefern darf. Erkennung: `typeof ctx.startRendering === 'function'`. In diesem Modus:

- wird **kein** `resume()` aufgerufen und nicht auf `state === 'running'` gewartet;
- wird der Graph normal aufgebaut und der Status auf `running` gesetzt;
- rendert der Test selbst mit `ctx.startRendering()`;
- sind `stop()`/`dispose()` weiterhin aufräumend, aber ohne Echtzeit-Wirkung.

Damit sind deterministische Signalprüfungen möglich (FFT-Peak, Amplitude, Fade-Form), ohne ein Audiogerät. Der Testmodus ist ausschließlich für Tests; die Produktion erzeugt immer `new AudioContext()`.

---

## 5. Komponenten- und Dateilayout

```
Esoterik-Welt/
├── index.html                                  # + nav/footer/page-shell (UI-Ticket)
├── css/
│   ├── design-system.css                       # unverändert (Tokens)
│   ├── main.css                                # unverändert
│   └── frequenzlabor.css                       # NEU: .fq-* Styles, nur Tokens
├── data/
│   └── frequencies.json                        # NEU: Datenlieferung t_2b60eff1
├── docs/
│   └── adr-frequenzlabor.md                    # NEU: dieses Dokument
├── js/
│   ├── main.js                                 # + page-id, Meta, onHide, Loader-Import
│   ├── modules/
│   │   ├── frequenzlabor-loader.js             # NEU: winziger Lazy-Proxy
│   │   ├── frequenzlabor.js                    # NEU: Controller/View (DOM)
│   │   ├── frequenz-engine.js                  # NEU: Engine (kein DOM)
│   │   ├── frequenz-engine.d.ts                # NEU: Vertrag (Typen, ungeprüft)
│   │   ├── frequenz-visualisierung.js          # NEU: Canvas-Renderer
│   │   ├── frequenz-presets.js                 # NEU: Daten + Mapping + localStorage
│   │   └── frequenz-flags.js                   # NEU: FEATURES/URL-Override
│   └── types.ts                                # unverändert (Altbestand)
├── scripts/
│   ├── build-local.cjs                         # + optionales Embed von frequencies.json
│   └── check-frequenz-budget.cjs               # NEU: Budget-Gate
└── tests/
    ├── frequenz-engine.mjs                     # NEU: node:test + Fake/Offline-Context
    ├── frequenz-presets.mjs                    # NEU: Mapping, Validierung, Storage
    └── frequenzlabor.spec.js                   # NEU: Playwright E2E
```

### 5.1 Verantwortlichkeiten und Importregeln

| Datei | Darf importieren | Darf nicht | Verantwortung |
| --- | --- | --- | --- |
| `frequenz-engine.js` | nichts (nur Browser-APIs) | DOM-Module, UI, Daten | Audio-Graph, Lebenszyklus, Pegel, Fehler, Zustand |
| `frequenz-engine.d.ts` | – | – | Typvertrag, keine Laufzeit |
| `frequenzlabor-loader.js` | nichts statisch außer `frequenzlabor.js` (dynamisch) | Engine, DOM | Seite → Modul laden, `show()`/`onHide()` delegieren |
| `frequenzlabor.js` | Engine, Presets, Visualisierung, Flags | globale Stores | DOM, Events, Fokus, Routing-View, Fehlertexte; stoppt Audio bei Ansichtswechsel und in `onHide()` |
| `frequenz-presets.js` | keine UI | Engine | JSON laden, Einträge validieren, Playback-Mapping, localStorage |
| `frequenz-visualisierung.js` | Engine (nur lesend) | DOM außer `canvas` | rAF-Loop, Zeichnen, Reduced-Motion-Statik |
| `frequenz-flags.js` | nichts | alles | Konstanten + lokaler URL-Override |

Keine Zyklen. Die Engine kennt weder Frequenzdaten noch Presets; sie nimmt nur Hertz-Zahlen und Optionen.

### 5.2 Ladegraph

```
index.html
 ├─ <script type="module"> → js/main.js            (Initialpfad, ~6,4 kB gz)
 │    └─ statisch: bestehende Module + frequenzlabor-loader.js (~0,6 kB gz)
 └─ bei erster Navigation zu #frequenzen:
      loader.show() → import('./frequenzlabor.js')  (Lazy-Chunk)
        ├─ frequenz-engine.js
        ├─ frequenz-presets.js
        ├─ frequenz-visualisierung.js
        └─ frequenz-flags.js
```

Der Initialpfad wächst nur um den Loader und wenige Router-Zeilen. Die Engine wird **nicht** geladen, wenn die Kategorie nie geöffnet wird.

---

## 6. Integration in den Bestand (exakte Änderungspunkte)

### 6.1 `index.html`

1. **Navigation** (`index.html:69-75`), nach „Astrologie“:

   ```html
   <li><a href="#frequenzen" class="nav-link" data-page="frequenzen">Frequenzen</a></li>
   ```

2. **Footer „Tools“** (`index.html:698-706`), nach „Mondkalender“:

   ```html
   <li><a href="#frequenzen">Frequenzlabor</a></li>
   ```

3. **Startseiten-Register:** Label „Sechs Zugänge“ → „Sieben Zugänge“ (`index.html:142`); Hero-Intro (`index.html:105`) um „Frequenzen“ ergänzen. Die Karte kommt aus `populateFeatureGrid()`; das Grid ist eine einspaltige Liste, ein siebter Eintrag bricht das Layout nicht.

4. **Neue Seite** vor `#runes` (`index.html:591`):

   ```html
   <section id="frequenzen" class="page" aria-labelledby="frequenzen-title" hidden>
     <div class="container">
       <div class="section-header mb-8">
         <p class="label">Frequenzen / Schwingungen</p>
         <h1 id="frequenzen-title" class="page-title" tabindex="-1">Frequenzen &amp; Schwingungen</h1>
         <p class="text-muted">…</p>
       </div>
       <noscript>…Kurzfassung ohne Ton…</noscript>
       <div id="frequenzlaborRoot" class="fq-root"></div>
     </div>
   </section>
   ```

5. **Stylesheet** innerhalb von `<template id="http-resources">` (`index.html:44-47`), nach `main.css`:

   ```html
   <link rel="stylesheet" href="css/frequenzlabor.css" />
   ```

   Dadurch inlined `build-local.cjs` die Datei automatisch in `Lokal.html`. Die Datei darf kein `url(` außer lokalen Fonts enthalten (Build-Prüfung).

### 6.2 `js/main.js`

1. `MAIN_PAGES` um `'frequenzen'` erweitern (acht IDs). `PAGE_META.frequenzen` ergänzen:

   ```js
   frequenzen: {
     title: 'Frequenzen & Schwingungen — Bibliothek und Frequenzlabor | Esoterik-Welt',
     description:
       'Frequenzbibliothek mit Evidenzstatus und interaktives Frequenzlabor: Tongenerator, Oszillogramm, binaurale Demonstration und 432/440-Vergleich.',
   },
   ```

2. Neue Muster neben `ASTROLOGIE_ROUTE`:

   ```js
   const FREQUENZ_ROUTE = /^frequenzen(?:\/([^?]*))?(?:\?(.*))?$/;
   const FREQUENZ_ALIAS = /^frequenzlabor(?:\/([^?]*))?(?:\?(.*))?$/;
   ```

3. `parseRoute()`: Vor dem `PAGE_IDS.has(raw)`-Zweig prüfen. `frequenzen` liefert `{ type: 'frequenzen', page: 'frequenzen', segments, query, raw }`; der Alias liefert dieselbe Form mit `segments: ['labor']` und `alias: true`. Der Alias wird **nicht** als eigene Seite geführt. Leere `segments` bedeuten Hub; ein unbekanntes Segment rendert den Hub mit einem sichtbaren Hinweis, ohne die URL zu ändern.

4. `applyRoute()`: neuer Zweig

   ```js
   if (route.type === 'frequenzen') {
     clearRouteNotice();
     navigateTo('frequenzen', route.alias ? true : replace, {
       fromHistory,
       instant,
       silent,
       hash: route.alias ? '#frequenzen/labor' : `#${route.raw}`,
       subroute: { segments: route.segments, query: route.query },
     });
     return;
   }
   ```

   `replace: true` beim Alias ersetzt den Alias-Eintrag, statt einen zweiten History-Eintrag zu erzeugen. **Kaltstart:** `init()` ruft `applyRoute(..., { silent: true })` auf; dabei schreibt `navigateTo()` die URL nicht. Deshalb muss `init()` nach dem ersten `applyRoute` bei `initialRoute.alias` einmalig `history.replaceState({ page: 'frequenzen' }, '', '#frequenzen/labor')` ausführen, damit auch ein aufgerufener `#frequenzlabor`-Deep-Link kanonisch in der Adresszeile steht.

5. **`onHide`-Hook** in `navigateTo()` (additiv, vor dem Umschalten der Seiten):

   ```js
   if (pageId !== state.currentPage) {
     const previous = state.modules[state.currentPage];
     if (previous && typeof previous.onHide === 'function') previous.onHide();
   }
   ```

   Ohne diesen Hook kann das Labor beim Verlassen der Seite nicht garantieren, dass kein Ton weiterläuft. Der Hook ist für alle Module optional und rückwärtskompatibel.

6. **Loader registrieren:** `import { FrequenzlaborLoader } from './modules/frequenzlabor-loader.js';` und in `init()`:

   ```js
   state.modules.frequenzen = new FrequenzlaborLoader(document.getElementById('frequenzlaborRoot'));
   ```

7. **Feature-Karte** in `populateFeatureGrid()` ergänzen:

   ```js
   { id: 'frequenzen', title: 'Frequenzen', desc: 'Frequenzbibliothek, Tongenerator, Oszillogramm und Hörvergleich' },
   ```

8. **Debug-Handle** für QA/Tests ergänzen: `window.EsoterikWelt.frequenz = { getState, getAnalyserData }` (nur lesend, keine Steuerung). Das ist die Messschnittstelle für `t_835bd1e9`.

### 6.3 `js/modules/frequenzlabor-loader.js` (Vertrag)

```js
export class FrequenzlaborLoader {
  constructor(root) {
    this.root = root;
    this.instance = null;
    this.loading = null;
  }

  async load() {
    if (this.instance) return this.instance;
    if (!this.loading) {
      this.loading = import('./frequenzlabor.js').then(({ FrequenzlaborModule }) => {
        this.instance = new FrequenzlaborModule(this.root);
        return this.instance;
      });
    }
    return this.loading;
  }

  show(segments, query, options) {
    return this.load().then(
      (module) => module.show(segments, query, options),
      (error) => {
        this.root.textContent =
          'Das Frequenzlabor konnte nicht geladen werden. Bitte die Seite neu laden.';
        throw error;
      }
    );
  }

  onHide() {
    if (this.instance) this.instance.onHide();
  }
}
```

Der Loader ist der einzige statische Import des Features. Er darf nicht mehr als ~30 Zeilen enthalten; alles andere ist Lazy-Chunk.

### 6.4 `scripts/build-local.cjs`

Beim Erzeugen von `index.html` zusätzlich einbetten, analog zu `#local-crystals-data`:

```js
const freqPath = path.join(root, 'data/frequencies.json');
const freqJson = fs.existsSync(freqPath)
  ? JSON.stringify(JSON.parse(read('data/frequencies.json'))).replace(/</g, '\\u003c')
  : null;
```

und im `</body>`-Ersatz:

```js
`${freqJson ? `<script id="local-frequencies-data" type="application/json">${freqJson}</script>` : ''}
 <script>${bundle}</script>`
```

Fehlt die Datei, wird eine Warnung geloggt und kein Skript-Tag erzeugt; der Build bleibt grün. `tests/offline-file.cjs` wird um eine Prüfung ergänzt, dass `#local-frequencies-data` vorhanden ist, sobald die Datei existiert.

### 6.5 `package.json` und CI

Neue Skripte (Engine-Ticket bzw. UI-Ticket):

```json
"test:frequenz": "node --test tests/frequenz-engine.mjs tests/frequenz-presets.mjs",
"check:frequenz-budget": "node scripts/check-frequenz-budget.cjs"
```

`test:all` und der CI-Job `unit-test` rufen beide auf. Der Playwright-Spec läuft automatisch über `test:e2e` (`testMatch: '**/*.spec.js'`). Die CI-Änderung ist Teil des UI-/Integrations-PRs, nicht dieses ADR-PRs.

### 6.6 Test- und Doku-Anpassungen (zwingend, sonst rotes CI)

Die folgenden Stellen zählen heute sechs Startseiten-Karten bzw. fünf Module. Sie müssen im UI-PR auf sieben Karten bzw. sechs Module angepasst werden. Das ist keine Abschwächung: die Tests prüfen weiterhin, dass **alle** Karten und Module rendern; nur die erwartete Anzahl ändert sich, weil ein siebter Bereich ausgeliefert wird.

| Datei | Stelle | Änderung |
| --- | --- | --- |
| `tests/local-entry.cjs` | Zeilen 11, 34, 257, 278 | `#featureGrid`-Kinder: `6` → `7` |
| `tests/local-entry.cjs` | Zeile 36 | Modulliste: `['astrologie','blog','frequenzen','moon','runes','tarot']` |
| `tests/local-entry.cjs` | Zeilen 40, 259 | Routenliste um `frequenzen` ergänzen |
| `tests/offline-file.cjs` | Zeilen 35, 63, 70 | `features`: `6` → `7`; Routenliste um `frequenzen` ergänzen |
| `tests/astrologie.spec.js` | Zeile 42 | `#featureGrid > *`: `toBe(6)` → `toBe(7)` |
| `scripts/verify-pages.cjs` | Zeilen 9, 123, 158 | `routes` um `frequenzen`; `featureCount`: `6` → `7`; Loop um `frequenzen` |
| `README.md` | Architektur-/Routenabschnitt | `#frequenzen` und `js/modules/frequenz-*` aufnehmen |

Zusätzlich prüft `tests/pages-regression.cjs` alle dynamischen Importe in `js/modules/`; der Loader-Import `./frequenzlabor.js` muss deshalb im selben PR existieren, in dem der Loader eingeführt wird.

---

## 7. Nicht-funktionale Anforderungen

### 7.1 Lazy-Loading und Bundle-Budget

| ID | Anforderung | Grenze | Prüfung |
| --- | --- | --- | --- |
| NFR-1 | Initialer statischer JS-Graph (`js/main.js` + rekursive statische Imports) wächst nur um Loader und Router-Zeilen | **≤ 84.275 B + 2.000 B gzip -9** (Basis §2.6) | Graphmessung §12 |
| NFR-2 | Gesamtes Feature-JS (alle `js/modules/frequenz*.js`) | **≤ 100.000 B gzip -9** | `check-frequenz-budget.cjs` |
| NFR-3 | Feature-CSS | **≤ 6.000 B gzip -9** | dieselbe Prüfung (CSS optional im Skript) |
| NFR-4 | Neue Laufzeitabhängigkeiten | **0** | `package.json`-Diff |
| NFR-5 | Engine/Visualisierung werden erst bei `#frequenzen` geladen | Netzwerk-Trace enthält vor Navigation keinen `frequenz-engine.js`-Request | Playwright: Request-Liste |
| NFR-6 | Ausgeschaltete Flags kosten 0 Byte | `cymatics`/`meditation` erzeugen keinen Request | Playwright mit `?fq=+cymatics` lokal |

`check-frequenz-budget.cjs` (verpflichtend im UI-Ticket):

- liest alle Dateien `js/modules/frequenz*.js` (nicht `.d.ts`),
- konkateniert sie in definierter Reihenfolge und komprimiert mit `zlib.gzipSync(buffer, { level: 9 })`,
- prüft NFR-2 und NFR-3,
- gibt eine Tabelle mit Bytes aus und beendet mit Exit-Code 1 bei Überschreitung.

### 7.2 Lautstärke und Gehörschutz

| ID | Anforderung |
| --- | --- |
| NFR-7 | Startpegel **−20 dBFS**; die UI zeigt den Wert in dBFS und den harten Deckel **−6 dBFS** sichtbar an |
| NFR-8 | Die Engine klemmt jeden `gainDb` auf `[−60, −6]`; ein UI-Fehler kann die Grenze nicht umgehen |
| NFR-9 | Ein-/Ausblenden und Pegeländerungen laufen als lineare Rampen ≥ 20 ms; keine direkten Wert-Sprünge auf dem Hörpfad |
| NFR-10 | Rechteck/Sägezahn werden um 6 dB abgesenkt; Sinus ist Standard |
| NFR-11 | Dauerhafter Hinweis „Tief starten, Gehör schützen, Kopfhörer nur bei binaural nötig“ und ein sichtbarer Hinweis, dass 20 kHz für viele Menschen unhörbar ist |
| NFR-12 | Kein Ton ohne Nutzerinteraktion; beim Verlassen der Seite, bei `visibilitychange → hidden` und bei `pagehide` wird gestoppt |

### 7.3 Autoplay-Verbot

- `AudioContext` wird ausschließlich in `play()`/`playBinaural()` erzeugt.
- Kein `AudioContext` beim Laden der Route, beim Laden der Daten oder beim Aufbau der Visualisierung.
- `play()` wird direkt im Klick-/Tastatur-Handler aufgerufen; Daten sind vorher geladen.
- Ein blockierter Context führt zu einer sichtbaren, wiederholbaren Fehlermeldung — nicht zu einem stillen Fehlschlag.
- E2E-Test: `AudioContext`-Konstruktor vor dem ersten Klick mitzählen (`page.addInitScript`), Erwartung **0**.

### 7.4 Barrierefreiheit

| ID | Anforderung |
| --- | --- |
| NFR-13 | Vollständige Tastaturbedienung: alle Bedienelemente sind native `<button>`/`<input>`; keine Drag-only-Interaktion |
| NFR-14 | Frequenz-Slider logarithmisch (20–20.000 Hz), gekoppelt mit numerischem Feld (Hz) und sichtbarer Einheit; beide mit `<label for>` |
| NFR-15 | Statusmeldungen in `role="status"`/`aria-live="polite"`, **maximal 1 Ansage pro Sekunde** (Slider-Eingaben werden nicht pro Pixel angesagt) |
| NFR-16 | Canvas ist `aria-hidden="true"`; die zugängliche Entsprechung ist der numerische Readout (Frequenz, Periode, Pegel) im DOM |
| NFR-17 | Fokus nach Ansichtswechsel auf die H1 (`tabindex="-1"`, `focus({preventScroll:true})`), Fokusverlust vermeiden; sichtbarer Fokusring bleibt |
| NFR-18 | `prefers-reduced-motion`: keine rAF-Animation; statische Erklärung (Periode/Wellenlänge) plus einmalige Messwerte |
| NFR-19 | Kontrast ≥ 4,5:1 für Text und Badges; Evidenzstatus nie nur über Farbe, immer mit Textlabel |
| NFR-20 | Touch-Ziele ≥ 44 × 44 px; Slider-Daumen ≥ 24 px sichtbar; kein Horizontal-Scroll bei 360 px |
| NFR-21 | Keine Autoplay-/Alert-Dialoge; Fehler werden inline und über `role="status"` gemeldet |

### 7.5 Mobile und Performance

| ID | Anforderung |
| --- | --- |
| NFR-22 | Bedienbar ab 360 px Breite; Transportleiste bleibt beim Scrollen erreichbar (sticky innerhalb der Seite) |
| NFR-23 | Visualisierung: `requestAnimationFrame` nur bei sichtbarer Seite und laufendem Ton; DPR auf 2 begrenzt; keine Allokation pro Frame außer dem wiederverwendeten `Float32Array` |
| NFR-24 | Kein `ScriptProcessorNode`, kein `AudioWorklet`, kein `OfflineAudioContext` im Produktivpfad |
| NFR-25 | Keine externen Requests, keine Fonts/CDNs/Tracker; `data/frequencies.json` ist same-origin |
| NFR-26 | `localStorage`-Fehler dürfen die Seite nicht brechen; Schreiben höchstens bei `change`/`blur`, nicht bei jedem `input`-Event |
| NFR-27 | Sichtbare Pause-/Weiter-Bedienung (Master-Auftrag §3.2, Nachtrag §4.4): „Pause“ = `stop()`, „Weiter“ = `play()` mit den Werten des Controllers, „Stopp“ löscht den Pause-Zustand; kein dritter Audiozustand, keine neue Statusstufe, Ansage über die Live-Region, Tastaturbedienung; Playwright U16 |

### 7.6 Sicherheit und Datenschutz

- Keine Geheimnisse, keine Tokens, keine Benutzerkonten.
- Daten aus `data/frequencies.json` werden als **nicht vertrauenswürdig** behandelt: Typen prüfen, Strings begrenzen (Name ≤ 120, Beschreibung ≤ 500 Zeichen), URLs nur mit `https://` und `rel="noopener noreferrer"` ausgeben, `javascript:`/`data:` ablehnen, Ausgabe mit `textContent`/Escaping, kein `innerHTML` mit Rohdaten.
- Keine Übertragung von Nutzungsdaten; keine Cookies; keine Analytics.
- Die Engine gibt keine Dateien, Streams oder Mikrofonzugriffe aus; sie erzeugt ausschließlich Oszillatoren.

---

## 8. Datenvertrag und Wiedergabe-Mapping

### 8.1 Erwartetes Schema (`data/frequencies.json`, Lieferung `t_2b60eff1`)

Pflichtfelder je Eintrag: `id`, `name`, `hz` (Zahl oder `null`), `range_hz_min`, `range_hz_max`, `kategorie`, `evidenzstatus` (`belegt` \| `plausibel` \| `nicht belegt` \| `traditionell`), `beschreibung_kurz`, `quelle_url`, `warnhinweis` (bool).

**Additiv empfohlen** (vom Labor ausgewertet, nicht vorausgesetzt). Erlaubte `mode`-Werte sind `tone`, `binaural` und `none`; Beispiel:

```json
"playback": {
  "mode": "tone",
  "hz": 440,
  "carrier_hz": 200,
  "delta_hz": 8,
  "from_hz": 430,
  "to_hz": 450
}
```

### 8.2 Playback-Regeln (verbindlich, in `frequenz-presets.js`)

1. `playback` vorhanden und gültig → dieses Mapping gewinnt.
2. Ohne `playback` gilt eine **enge Allowlist** für hörbare Einzeltöne:
   - Solfeggio: `174, 285, 396, 417, 528, 639, 741, 852, 963` Hz,
   - Referenztöne: `432` und `440` Hz.
   Diese Werte werden nur dann als Ton angeboten, wenn `hz` exakt passt und endlich ist.
3. **Alles andere ist standardmäßig `mode: "none"`** — auch wenn `hz` im Hörbereich liegt. Das betrifft ausdrücklich Schumann-Resonanzen (7,83 Hz), EEG-Bänder, Rife-Frequenzen und „Planetenfrequenzen“. Diese Einträge erhalten den Hinweis: „Zahlenwert zur Einordnung; keine hörbare Entsprechung im Sinne dieses Labors.“
4. Bei `warnhinweis: true` steht der Hinweis vor dem Play-Button; ein automatischer Start ist ohnehin ausgeschlossen.
5. `quelle_url` wird als Link gerendert, aber nur bei `https://`; sonst Text ohne Link.
6. Fehlt `data/frequencies.json` oder ist sie ungültig, zeigt die Bibliothek eine sichtbare Fehlermeldung und das Labor bleibt mit dem manuellen Generator bedienbar.

**Begründung der Allowlist:** Der Master-Auftrag nennt Solfeggio und 432/440 ausdrücklich als Töne. Bei allen anderen Themen ist die Zuordnung „Zahl → hörbarer Ton“ fachlich falsch oder umstritten; eine explizite Datenentscheidung ist die einzige saubere Grundlage. Die Allowlist ist klein, prüfbar und ohne Interpretationsspielraum.

### 8.3 Binaurale Presets (UI-Konstanten, nicht aus den Daten)

`frequenz-presets.js` exportiert:

```js
export const BINAURAL_PRESETS = Object.freeze([
  { id: 'delta', label: 'Delta (2 Hz)', carrierHz: 200, deltaHz: 2 },
  { id: 'theta', label: 'Theta (6 Hz)', carrierHz: 200, deltaHz: 6 },
  { id: 'alpha', label: 'Alpha (10 Hz)', carrierHz: 200, deltaHz: 10 },
  { id: 'beta', label: 'Beta (20 Hz)', carrierHz: 200, deltaHz: 20 },
]);
```

Label und Begleittext müssen klarstellen: „Demonstration einer Differenzfrequenz; keine belegte EEG-Wirkung.“ Die Zuordnung zu EEG-Bändern ist eine Konvention, keine Wirkaussage.

### 8.4 432/440-Vergleich

Der Vergleich ist eine UI-Funktion auf Basis von `play(432)`/`play(440)` mit identischem Gain, Wellenform und Dauer. Optional verdeckte A/B-Zuordnung (randomisiert, nicht persistiert). Die Beschriftung muss sagen, dass einzelne Sinustöne verglichen werden, **nicht** vollständige Stimmungen. Kein Engine-Sonderweg.

---

## 9. Test- und Abnahmematrix

### 9.1 Node-Tests der Engine (`tests/frequenz-engine.mjs`)

Fake-Context mit Aufzeichnung aller Aufrufe (`createOscillator`, `createGain`, `createStereoPanner`, `createAnalyser`, `createChannelSplitter`, `resume`, `close`, `currentTime`) und ein `OfflineAudioContext` für Signalprüfungen.

| Nr. | Fall | Erwartung |
| --- | --- | --- |
| E1 | Import/Konstruktion | kein `AudioContext` erzeugt |
| E2 | `play(440)` | ein Oszillator, Frequenz 440, Gain-Rampe 0 → Ziel über 20 ms, Status `running` |
| E3 | `play(5)` / `play(25000)` | geklemmt auf 20 / 20000; `state.freqHz` entsprechend |
| E4 | `play(NaN)` / `play(0)` | Promise lehnt mit `invalid_frequency` ab; keine Oszillatoren |
| E5 | `setGain(10)` | `gainDb = −6`, `masterGain`-Rampe auf 0,501 |
| E6 | `setGain(-100)` | `gainDb = −60` |
| E7 | `setWaveform('square')` | `oscillator.type = 'square'`; Voice-Gain mit −6 dB Trim |
| E8 | `sweep(200, 800, 2)` | `exponentialRampToValueAtTime(800, start + 2)`; Promise löst nach Ende; `SweepResult.completed = true` |
| E9 | `stop()` während Sweep | `completed: false`, Oszillator gestoppt und getrennt, Status `idle` |
| E10 | `stop()` zweimal | idempotent, keine Fehler |
| E11 | `playBinaural({carrierHz: 200, deltaHz: 8})` | zwei Oszillatoren (200/208), Panner −1/+1, Voice-Gain je 1/2 |
| E12 | `setBeatDelta(12)` im Ton-Modus | wirft `FrequencyEngineError('invalid_state')` |
| E13 | blockierter Context (`resume()` → `NotAllowedError`) | `context_blocked`, Status `error`, keine Oszillatoren |
| E14 | fehlende API (`factory` → `null`) | `play()` lehnt mit `unsupported` ab; Status bleibt `unsupported` |
| E15 | `dispose()` | Context geschlossen, Listener geleert, danach `play()` → `context_closed` |
| E16 | `subscribe`/`onstatechange`/`unsubscribe` | Reihenfolge, `revision` +1 je Emission, Abmelden wirkt |
| E17 | `getAnalyserData()` idle | `Float32Array(2048)`, alle 0; `getSpectrumData()` alle `-Infinity` |
| E18 | Offline-Render 440 Hz, 1 s, 48 kHz | FFT-Peak bei 440 Hz ± 1 Hz; Spitzenamplitude ≤ 0,501; Fade-In/Out monoton |
| E19 | `playTones([440, 444])` | zwei Oszillatoren, `frequenciesHz = [440, 444]`, Voice-Gain je 1/2, Summenamplitude ≤ 0,501; `state.mode = 'tone'` |
| E20 | `playTones([])` / 5 Frequenzen | Promise lehnt mit `invalid_argument` ab; keine Oszillatoren |

**E18** ist die Grundlage für die Frequenzmessung in `t_835bd1e9`. **Wichtig:** Der Analysator mit `fftSize = 2048` ist ein Visualisierungsinstrument (Bin-Breite ≈ 23,4 Hz bei 48 kHz) und **kein** Messgerät für 1-Hz-Toleranzen. Die Präzisionsmessung erfolgt über den Offline-Render (1 s, Zero-Crossing oder 65.536-Punkt-FFT), nicht über `AnalyserNode`.

### 9.2 Node-Tests der Presets (`tests/frequenz-presets.mjs`)

| Nr. | Fall | Erwartung |
| --- | --- | --- |
| P1 | gültige Datei | alle Einträge normalisiert; Pflichtfelder vorhanden |
| P2 | Solfeggio-Allowlist | 9 Frequenzen als `tone` |
| P3 | Schumann/EEG/Rife | `mode: 'none'`, kein Play-Button, Hinweistext |
| P4 | `playback` überschreibt Allowlist | Mapping gewinnt |
| P5 | defekte Datei (kein JSON, falsche Typen) | Fehlerzustand, manueller Generator bleibt |
| P6 | `localStorage` blockiert | kein Throw, Persistenz deaktiviert |
| P7 | Schema-Version unbekannt | Eintrag ignoriert, Defaults gelten |
| P8 | Quellen-URL `javascript:` | kein Link, Text bleibt |

### 9.3 Playwright (`tests/frequenzlabor.spec.js`)

| Nr. | Fall | Erwartung |
| --- | --- | --- |
| U1 | `#frequenzen` direkt | Seite sichtbar, ein H1, Navigation aktiv, keine Konsole-Fehler |
| U2 | `#frequenzlabor` | URL wird zu `#frequenzen/labor`, Labor sichtbar |
| U3 | kein AudioContext vor Klick | Init-Skript zählt 0 Konstruktionen |
| U4 | Play → Stop | Status `running` → `idle`, keine Oszillatoren nach Stop (Debug-Handle) |
| U5 | Slider + Zahlenfeld | Werte synchron, Klemmen bei 20/20000, Einheit Hz |
| U6 | Gain-Deckel | Slider endet bei −6 dBFS, Anzeige nennt den Deckel |
| U7 | Preset aus Bibliothek | Klick startet genau die Allowlist-Frequenz |
| U8 | Schumann-Eintrag | kein Play-Button, Hinweis sichtbar |
| U9 | Tastatur | Tab-Reihenfolge, Enter/Leertaste auf Play, Fokus nach Ansichtswechsel auf H1 |
| U10 | `prefers-reduced-motion` | keine rAF-Schleife, statische Erklärung sichtbar |
| U11 | 360 px | kein horizontaler Scroll, Bedienelemente ≥ 44 px |
| U12 | Navigation weg | Audio stoppt (Status `idle`) |
| U13 | `file://` (`Lokal.html`) | Seite lädt, Presets aus eingebettetem JSON, Play funktioniert nach Klick |
| U14 | Bundle-Requests | vor `#frequenzen` kein `frequenz-engine.js`-Request |
| U16 | Pause/Weiter | Pause → Status `idle`, keine Stimmen, Parameter bleiben; „Weiter“ startet mit denselben Werten (Tastatur); keine dritte Statusstufe; „Stopp“ setzt zurück (B3/NFR-27) |

### 9.4 Abnahme je Ticket

- **`t_2ce71bc5` (Engine):** E1–E20 grün; `npm run test:frequenz`; keine neue Abhängigkeit; Engine exportiert `createFrequencyEngine`, `getFrequencyEngine`, `FREQUENCY_LIMITS`, `WAVEFORM_TRIM_DB`, `FrequencyEngineError`.
- **`t_6b8164b3` (UI):** U1–U14 grün; `npm run check:frequenz-budget` grün; Lighthouse Accessibility ≥ 95; keine Konsolenfehler; Screenshots 360/768/1440. (U15 kam mit `t_b78a89a5`, U16 mit `t_f2a0868c` hinzu.)
- **`t_f2a0868c` (Pause/Weiter + ADR-Nachtrag):** U16 grün; Nachtrag in §4.4/§4.5 vorhanden; `npm run test:frequenz`, `npx playwright test tests/frequenzlabor.spec.js` und `npm run lint` grün.
- **`t_835bd1e9` (QA):** Testplan mit Traceability; Messung nach §9.1/E18; zwei Browser; Autoplay-/Blocked-Szenario dokumentiert.
- **`t_a0f14bb2` (Review):** Abweichungen vom ADR sind begründet; keine Heilversprechen; Quellen und Disclaimer vorhanden.

---

## 10. Risiken, offene Punkte und Nicht-Scope

| Risiko | Auswirkung | Gegenmaßnahme |
| --- | --- | --- |
| `data/frequencies.json` fehlt oder hat kein `playback` | weniger Presets, aber kein Defekt | Allowlist (9 + 2 Frequenzen) und manueller Generator; UI zeigt fehlende Daten an |
| Kein TypeScript-Build | `.d.ts` kann veralten | ADR-Block und Datei byte-gleich; Abweichung ist ein Review-Befund |
| Autoplay-Regeln ändern sich | Start schlägt fehl | `context_blocked` ist sichtbar und wiederholbar; kein stiller Fehler |
| Safari/iOS-Resume | Ton startet nicht | Context-Erzeugung im Nutzer-Task; manueller iOS-Test im QA-Ticket |
| Zwei AudioContexts durch spätere Module | Grenzen (Safari) und Doppelton | Singleton `getFrequencyEngine()`; neue Features nutzen dieselbe Engine |
| Kopfhörer nicht vorhanden | binaurale Wirkung nicht hörbar | Pflichttext „Kopfhörer erforderlich“; keine Wirkbehauptung |
| Wahrnehmbare Lautheit vs. dBFS | Sicherheitsgefühl trügt | Startpegel −20 dBFS, Deckel −6 dBFS, Wellenform-Trims, Gehörschutz-Hinweis |
| `file://`-localStorage blockiert | Presets nicht gespeichert | `try/catch`, sichtbarer Hinweis, Labor bleibt funktionsfähig |
| Hash-Routen nicht indexierbar | SEO-Schwäche | bewusst akzeptiert (AD-8), separates P11-Ticket |

**Nicht-Scope dieser Architektur:** Chladni/Cymatics, Meditations-Timer, Audio-Export, Aufnahme, Mikrofon, serverseitige Speicherung, Native-Apps, räumliches Audio, MIDI.

**Offene Entscheidung für P11 (nicht blockierend):** Ob eine statische, indexierbare Landingpage für „Frequenzen“ sinnvoll ist. Dann muss sie kanonisch eindeutig sein und dieses ADR (AD-8) ersetzt werden.

---

## 11. Umsetzungsreihenfolge für die parallele Entwicklung

1. **Daten (läuft):** `t_2b60eff1` liefert `data/frequencies.json` und `docs/frequenz-quellen.md`. Optional `playback` je Eintrag.
2. **Engine (kann sofort starten):** `t_2ce71bc5` implementiert `frequenz-engine.js` gegen §4 und die `.d.ts`, dazu `tests/frequenz-engine.mjs`. Unabhängig von Daten und UI.
3. **UI (kann parallel starten):** `t_6b8164b3` baut Shell, CSS, Controller, Loader, Presets, Visualisierung und die Router-Integration nach §6. Die UI darf die Engine über die Typen aus §4 ansprechen, auch bevor die Implementierung gemergt ist (Stub mit identischen Signaturen).
4. **QA:** `t_835bd1e9` nach Engine + UI; Messmethodik §9.1/E18.
5. **Review:** `t_a0f14bb2` nach QA.

**Merge-Reihenfolge:** Daten → Engine → UI → QA-Dokument → Review. Die UI kann temporär mit leerer Preset-Liste laufen; die Engine kann ohne UI getestet werden. Kein Ticket blockiert ein anderes außer über die genannten Abhängigkeiten.

---

## 12. Belege und Reproduktion

Alle Befunde aus §2 lassen sich mit folgenden Befehlen im Repository nachvollziehen (Basis `b18bdb3`):

```bash
git rev-parse HEAD
git log -1 --format='%H %ad %s' --date=iso
wc -l js/main.js css/design-system.css css/main.css
grep -n "MAIN_PAGES" js/main.js
grep -c "nav-link" index.html
grep -c '<section id="[^"]*" class="page' index.html
grep -rIl "AudioContext" --include='*.js' . | grep -v node_modules | grep -v dist | wc -l
grep -n "onHide" js/main.js || echo "kein onHide"
grep -n 'input\[type="range"\]' css/*.css || echo "keine Range-Styles"
gzip -9 -c js/main.js | wc -c
```

Messung des Ist-JS-Graphen (Summe der Einzeldateien, `gzip -9`): **287.228 B raw / 84.275 B gzip** für 16 rekursiv statisch geladene Dateien; 23.352 B für CSS. Die Werte sind in §2.6 tabelliert. Reproduktion:

```bash
node - <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const seen = new Set();
function walk(rel) {
  const abs = path.resolve(rel);
  if (seen.has(abs)) return;
  seen.add(abs);
  const src = fs.readFileSync(abs, 'utf8');
  for (const m of src.matchAll(/import\s+(?:[^'"]*?\s+from\s+)?['"](\.[^'"]+)['"]/g)) {
    const target = path.resolve(path.dirname(abs), m[1]);
    if (fs.existsSync(target)) walk(target);
  }
}
walk('js/main.js');
let raw = 0;
let gz = 0;
for (const abs of seen) {
  const b = fs.readFileSync(abs);
  raw += b.length;
  gz += zlib.gzipSync(b, { level: 9 }).length;
}
console.log({ files: seen.size, raw, gz });
NODE
```

**Vertrags-Drift-Prüfung** (vor jedem Review):

```bash
node - <<'NODE'
const fs = require('node:fs');
const adr = fs.readFileSync('docs/adr-frequenzlabor.md', 'utf8');
const block = adr.split('```ts')[1].split('```')[0].trim();
const dts = fs
  .readFileSync('js/modules/frequenz-engine.d.ts', 'utf8')
  .replace(/^\/\*\*[\s\S]*?\*\/\s*/, '')
  .trim();
console.log(block === dts ? 'VERTRAG IDENTISCH' : 'ABWEICHUNG');
process.exit(block === dts ? 0 : 1);
NODE
```

Der Vergleich entfernt nur den Dateikopf-Kommentar der `.d.ts`; alle Feldkommentare sind Teil des Blocks und damit ebenfalls geschützt. Bei Änderungen gilt: erst §4.1, dann die Datei (oder umgekehrt), dann den Vergleich ausführen.
