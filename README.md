# Esoterik-Welt

Statistische Website zu Tarot, Kristallen, Runen und Mondphasen — bewusst ohne medizinische Wirkungsaussagen, mit Design-Tokens, Hash-Routing und echten Datenquellen.

## Quickstart

```bash
npm ci
npx playwright install chromium   # einmalig für die Browser-Prüfung
npm run build     # statische Pages-Quellen nach dist/Esoterik-Welt/
npm run preview   # http://localhost:3000/Esoterik-Welt/
npm run test:pages
npm test -- --runInBand --runTestsByPath tests/api.test.js
npm run verify:pages -- http://localhost:3000/Esoterik-Welt/ evidence/preview
```

## Architektur-Entscheidungen

- **Eine kanonische Website:** GitHub Pages veröffentlicht `main:/` mit `index.html`, `css/`, `js/`, `data/` und `assets/`. `npm run build` verpackt dieselben Quellen; die Express-Vorschau verwendet `/Esoterik-Welt/` statt des veralteten `public/`-Platzhalters. `npm start` baut vorher automatisch. Kein Astro/Vite/Tailwind/PostCSS und kein Webpack-Einstieg erforderlich.
- **Live-Prüfung:** `npm run verify:pages -- https://ingbms.github.io/Esoterik-Welt/ evidence/live` erzeugt Screenshots, CSS-/JS-MIME- und Netzwerk-/Console-Protokolle für zehn Ansichten bei 375/768/1440 px. Bestehende `test-results/` und andere Tests werden nicht überschrieben. Screenshots separat prüfen; historische QA-Aussagen unten sind kein Beleg für einen aktuellen Deploy.

- **Hash-Routing:** Keine Server-Side-Routing nötig; statisches Hosting reicht. Routen: `#tarot`, `#crystals`, `#runes`, `#blog`, `#moon`, `#astrologie`, `#frequenzen`, `#frequenzen/labor`, `#home`. Der Alias `#frequenzlabor` wird auf `#frequenzen/labor` normalisiert.
- **Vanilla JS + ES-Module:** Keine Framework-Abhängigkeit; `blog.js`/`moon.js` nutzen `import/export`; `main.js` lädt dynamisch.
- **Daten-Modell:** JSON/JS-Exports (`data/articles.js`, `data/crystals.json`, `data/runes.json`, `data/moon-phases.js`, `data/moon.js`).
- **Design-System (`css/design-system.css`):** CSS-Variablen, Typografie (Cinzel, Inter), Reduced-Motion / Print / Kontrast.
- **A11y:** Skip-Link (`#main`), sichtbarer Fokus, `aria-label`, `de`, Keyboard-Menü, Fokus-Restore, `prefers-reduced-motion`.

## Datenquellen

- **Tarot:** Rider-Waite-Smith — Public Domain (78 Karten). Keine medizinischen/prognostischen Aussagen.
- **Kristalle:** Mindat.org (Mohs-Härte, chemische Formeln). Keine Heilversprechen.
- **Runen:** Elder Futhark (`data/runes.json`, `js/data/runes.js`).
- **Mond:** Synodische Periode 29,53059 d; Referenz 2000-01-06; 42-Tage-Grid; iCal-Export `.ics`. Astronomische Formel, keine astrologische Prognose.
- **Blog:** 10 reale Artikel (`js/data/articles.js`) mit Markdown-Inhalten.

## Frequenzlabor-Audio-Engine

`js/modules/frequenz-engine.js` ist die einzige Audioquelle der Seite: reines Browser-ES-Modul ohne DOM-, Daten- oder UI-Bezug. Verbindlich sind [ADR §4](docs/adr-frequenzlabor.md) (Semantik, Zahlen, Fehlerfälle) und `js/modules/frequenz-engine.d.ts` (Typen).

```js
import { getFrequencyEngine } from './modules/frequenz-engine.js';

const engine = getFrequencyEngine(); // erzeugt noch keinen AudioContext
engine.subscribe((state) => render(state)); // jede Änderung ist ein neuer, eingefrorener Schnappschuss

button.addEventListener('click', () => engine.play(440)); // Ton startet im Nutzer-Task
// Weitere Aufrufe, ebenfalls nur aus einem Ereignis heraus:
//   await engine.playTones([440, 444]);                 // Schwebung im selben Kanal
//   await engine.playBinaural({ carrierHz: 200, deltaHz: 8 });
//   await engine.sweep(200, 800, 5);                    // exponentiell, Promise am Ende
//   engine.setGain(-30); engine.setWaveform('triangle'); // synchron, ohne Kontext-Erzeugung
//   await engine.stop();                                 // 20 ms Fade-out, Nodes freigegeben
```

Verbindliche Eigenschaften:

- **Kein Ton ohne Nutzerinteraktion.** Der AudioContext entsteht ausschließlich in `play()`, `playTones()` und `playBinaural()` — synchron vor dem ersten `await` im auslösenden Ereignis. Setter und `isSupported()` erzeugen nie einen Kontext.
- **Pegel-Deckel:** Start −20 dBFS, harte Grenze −6 dBFS (die Engine klemmt selbst, unabhängig von der UI), Rechteck/Sägezahn −6 dB. Bei `n` Stimmen erhält jede `1/n`; die Summe bleibt rechnerisch ≤ 0,501 und damit clippingfrei.
- **Frequenzbereich:** 20–20.000 Hz. Endliche Werte außerhalb werden geklemmt; `NaN`, `Infinity` und `≤ 0` lehnen mit `FrequencyEngineError('invalid_frequency')` ab.
- **Fehlercodes statt Texten:** `unsupported`, `context_blocked`, `context_closed`, `invalid_frequency`, `invalid_argument`, `invalid_state`, `internal`. Die deutschen UI-Texte liegen im Controller (ADR §4.7).
- **Aufräumen:** `stop()` blendet aus, stoppt und trennt alle Oszillatoren; `dispose()` schließt den Kontext und leert die Listener. `subscribe()` liefert eine idempotente Abmeldefunktion.

Tests ohne Audiogerät — E1–E20 der Abnahmematrix plus Signal-Render über einen nachgebauten Offline-Graphen (FFT-Peak ±1 Hz, Spitzenamplitude ≤ 0,501, monotone Flanken):

```bash
npm run test:frequenz
```

## Frequenzlabor-Oberfläche

Die Kategorie `#frequenzen` ist der Hub (Erklärstück, Bibliothek, Quellen, Disclaimer), `#frequenzen/labor` das Werkzeug. Beide Ansichten rendert `js/modules/frequenzlabor.js` in `#frequenzlaborRoot`; `js/modules/frequenzlabor-loader.js` ist der einzige statische Import im Initialpfad und lädt den Rest per `import()` erst beim ersten Aufruf.

| Datei | Aufgabe |
| --- | --- |
| `js/modules/frequenzlabor.js` | Controller/View: Slider, Presets, Transport, Sweep, Schwebung, binaural, 432/440, Fokus, Fehlertexte |
| `js/modules/frequenz-presets.js` | `data/frequencies.json` laden/validieren, Wiedergabe-Mapping, Präferenzen in `localStorage` |
| `js/modules/frequenz-visualisierung.js` | Canvas-Oszillogramm aus `getAnalyserData()`, statische Welle bei `prefers-reduced-motion` |
| `js/modules/frequenz-flags.js` | Feature-Flags; URL-Override nur auf `localhost`/`file:` |
| `css/frequenzlabor.css` | `.fq-*`-Styles, ausschließlich Design-Tokens |

**Wiedergabe-Regeln (ADR §8.2):** Ein gültiges `playback`-Feld gewinnt. Ohne `playback` werden nur die Solfeggio-Töne sowie 432/440 Hz als Einzelton angeboten; `partner_hz` erzeugt zwei Stimmen mit halbiertem Gain. Alles andere — Schumann-Resonanzen, EEG-Bänder, 40-Hz-Stimulation, Obertonreihe, Ultraschall — bleibt `mode: "none"` und wird als „Zahlenwert zur Einordnung“ gekennzeichnet. Die binaurale Schwebung (440/444 Hz) läuft kanalgetrennt, weil der Datenbestand sie so beschreibt.

**Bedienung und Barrierefreiheit:** Frequenz-Slider logarithmisch (20–20.000 Hz) mit gekoppeltem Zahlenfeld und sichtbarer Einheit, Wellenform-Auswahl, Pegel-Slider mit sichtbarem Deckel (−6 dBFS) und Startpegel (−20 dBFS), Play/Stopp, Sweep mit Fortschrittsbalken, Schwebungs-Demo, binaurale Presets und ein 432/440-Vergleich einzelner Sinustöne. Alles ist per Tastatur bedienbar, Statusmeldungen laufen über `role="status"` (maximal eine Ansage pro Sekunde), das Canvas ist `aria-hidden` und hat eine Textentsprechung, Fokus landet nach dem Ansichtswechsel auf der H1, `prefers-reduced-motion` schaltet die Animationsschleife ab. Der Ton stoppt bei jedem Routenwechsel (`onHide`), bei `visibilitychange → hidden` und bei `pagehide`.

**Tests und Budget:**

```bash
npm run test:frequenz          # Engine (E1–E20) + Presets/Flags (P1–P8)
npx playwright test tests/frequenzlabor.spec.js   # U1–U14
npm run check:frequenz-budget  # NFR-1/2/3: Initialgraph, Feature-JS, Feature-CSS
```

Die Messwerte, Screenshots und die Lighthouse-Accessibility-Prüfung stehen in `docs/frequenzlabor-ui.md` und `evidence/t_6b8164b3/`.

## Projektstruktur

```
esoterik-welt/
├── index.html, 404.html, robots.txt, sitemap.xml
├── css/design-system.css, css/main.css, css/frequenzlabor.css
├── js/main.js, js/index.js, js/modules/*.js (u. a. frequenzlabor.js, frequenz-engine.js), js/data/*.js
├── data/*.json, data/*.js
├── docs/polish-review.md, docs/design-tokens.md
├── assets/favicon.svg
└── tests/
```

## Deploy-Anleitung

- **GitHub Pages:** Repo-Einstellungen → Pages → Deploy from Branch `main` / (root). URL: `https://ingbms.github.io/Esoterik-Welt/`
- **Netlify:** `netlify deploy --prod --dir=.` oder Drag-and-Drop.
- **Vercel:** `vercel --prod` — statische Dateien automatisch erkannt.
- **Static Host (Surge):** `npx surge . esoterik-welt.surge.sh`

404-Seite (`404.html`) wird von GitHub Pages bei unbekannten Pfaden ausgeliefert.

## QA-Status (Task 10)

- **Cross-Browser:** Chrome, Firefox, Edge (Desktop + Mobile) verifiziert; Safari + echte Touch-Simulation als Limitation dokumentiert. Keine kritischen Rendering-Bugs; 320 px Mobile-Layout geprüft.
- **JS-Features:** LocalStorage, ES-Module, `IntersectionObserver`, Touch-Events geprüft; kein Fehler in Production-Build.
- **Console-Errors:** Keine in Production-Build; `_tarot_old.js` unverwendet.
- **Lighthouse-CI (`lhci autorun`, `.lighthouserc.json`):** Performance 0,87 (Warnung, Budget ≥0,90 nicht eingehalten — bekanntes Risiko); Accessibility/Best Practices/SEO ohne Assertion-Fehler (Budgets erfüllt).
- **SEO:** `robots.txt`, `sitemap.xml` (6 Routen + 10 Artikel), `404.html`, OG/Twitter/Canonical in `index.html` vorhanden.
- **A11y (axe-core 4.10.3):** 0 WCAG-Verstöße auf 6 Routen (Task 9).

## Bekannte Limitations

- **Performance-Budget:** 0,87 < 0,90 (Fonts/Assets, kein funktionaler Defekt).
- **Safari / Touch:** Keine automatisierten Tests; manuelle 320-px-Prüfung.
- **Crystal-Dropdown:** Design-Kritik separat vorgemerkt; keine HTML-Änderung ohne Abnahme.
- **Inline-Tokens:** Task 71 migriert; `blog.js` + `moon.js` unberührt.
- **OG-Image:** `assets/og-preview.png` referenziert, nicht im Repo.

## Lizenz

MIT — siehe `LICENSE`. Datenquellen mit jeweiligen Lizenzen referenziert; keine medizinischen Wirkungsaussagen.
