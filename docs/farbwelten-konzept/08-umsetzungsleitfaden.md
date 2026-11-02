# Umsetzungsleitfaden für die Entwicklung

Stand: 2. November 2026 · Ziel: die Sektion ohne Rückfragen in das bestehende
Projekt einbauen. Alle Entscheidungen sind hier oder in `02`–`07` belegt.

## 1. Dateien

**Neu:**

| Datei | Inhalt | Größe (Richtwert) |
| --- | --- | --- |
| `css/farbwelten.css` | Komponenten aus `05` | 8–10 KB |
| `js/modules/farbwelten.js` | Router-Ansicht, Rendering, Chakra-Auswahl | 6–8 KB |
| `js/data/farbwelten.js` | 7 Farbwelten, Blöcke, Quellen | Inhalt |
| `js/data/chakren.js` | 7 Chakren, Positionen, Einordnung | 2 KB |
| `js/data/evidence.js` | `ResearchEvidence`-Liste (optional, sonst in `farbwelten.js`) | Inhalt |
| `content/farbwelten/*.md` | Redaktionsquelle (Task 3), nicht im Build | – |

**Geändert (minimal):**

| Datei | Änderung |
| --- | --- |
| `index.html` | Navigationspunkt, `<section id="farbwelten" class="page" hidden><div class="container" id="farbweltenRoot"></div></section>` |
| `js/main.js` | Import, `MAIN_PAGES`, `FARBWELTEN_ROUTE`, `parseRoute`, `applyRoute`, `PAGE_META`, `init` |
| `css/design-system.css` | `--fw-*`-Block, Mobilmenü-Grenze 780 → 900 px |
| `css/main.css` | Kompaktblock 781 → 901 px; 781–900-Block entfernen |
| `scripts/verify-pages.cjs` | Routen `farbwelten`, `farbwelten/rot`, `farbwelten/chakren`, `farbwelten/lichtfrequenzen` |
| `scripts/build-pages.cjs` | keine Änderung nötig (kopiert `css`, `js`, `data`) |

`js/data/farbwelten.js` liegt unter `js/`, damit der bestehende Kopierschritt
greift; ein separates `data/`-Verzeichnis wäre ebenfalls möglich (dann `fetch`).

## 2. Router-Patch (konkret)

```js
// js/main.js — Importe
import { FarbweltenModule } from './modules/farbwelten.js';

// Konstanten
const MAIN_PAGES = ['home', 'tarot', 'crystals', 'moon', 'runes', 'astrologie', 'blog', 'pendeln', 'farbwelten'];
const FARBWELTEN_ROUTE = /^farbwelten(?:\/([^?]*))?(?:\?(.*))?$/;

// Aliase vor der PAGE_IDS-Prüfung, damit alte Links nicht ins Leere laufen
if (raw === 'chakren') return { type: 'farbwelten', page: 'farbwelten', segments: ['chakren'], query: '', raw };
if (raw === 'lichtfrequenzen') return { type: 'farbwelten', page: 'farbwelten', segments: ['lichtfrequenzen'], query: '', raw };

const farbwelten = FARBWELTEN_ROUTE.exec(raw);
if (farbwelten) {
  return {
    type: 'farbwelten',
    page: 'farbwelten',
    segments: String(farbwelten[1] || '').split('/').filter(Boolean),
    query: farbwelten[2] || '',
    raw,
  };
}

// applyRoute(): analog zum Pendeln-Block
if (route.type === 'farbwelten') {
  clearRouteNotice();
  navigateTo('farbwelten', replace, {
    fromHistory, instant, silent,
    hash: `#${route.raw}`,
    subroute: { segments: route.segments, query: route.query },
  });
  return;
}

// PAGE_META
farbwelten: {
  title: 'Farbwelten — Bedeutung, Physik und Tradition der Farben | Esoterik-Welt',
  description:
    'Sieben Farbwelten zwischen Licht, Wahrnehmung und Tradition: Wellenlängen, Assoziationen, Chakren und Forschungsstand differenziert erklärt.',
},

// init()
state.modules.farbwelten = new FarbweltenModule(document.getElementById('farbweltenRoot'));
// laden, sobald die Route aktiv ist (Muster wie astrologie/pendeln):
if (state.currentPage === 'farbwelten') await state.modules.farbwelten.load();
```

Die Alias-Rückgabe muss **vor** `if (PAGE_IDS.has(raw))` stehen; `raw` ist
bereits um `#` bereinigt. Für Alias-Routen im `applyRoute`-Block
`history.replaceState` verwenden, damit `#chakren` nicht in der History bleibt
(optional; ohne Ersatz ist es nur ein doppelter Eintrag).

## 3. Modul-Skelett

```js
// js/modules/farbwelten.js
import { FARBWELTEN } from '../data/farbwelten.js';
import { CHAKREN } from '../data/chakren.js';

export class FarbweltenModule {
  constructor(root) {
    this.root = root;
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    this.loaded = true;
    this.root.innerHTML = this.renderOverview();
    this.bindChakra();
  }

  // segments: [] | ['rot'] | ['chakren'] | ['lichtfrequenzen']
  show(segments = [], query = '', { focus = true } = {}) {
    const [first] = segments;
    if (!first) this.root.innerHTML = this.renderOverview();
    else if (first === 'chakren') this.root.innerHTML = this.renderChakren();
    else if (first === 'lichtfrequenzen') this.root.innerHTML = this.renderLight();
    else {
      const world = FARBWELTEN.find((w) => w.id === first);
      this.root.innerHTML = world ? this.renderColor(world) : this.renderNotFound(first);
    }
    this.root.dataset.farbwelt = first && FARBWELTEN.some((w) => w.id === first) ? first : '';
    this.bindChakra();
    if (focus) this.focusHeading();
  }

  focusHeading() {
    const h1 = this.root.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
  }
}
```

**Kein `innerHTML` mit Redaktionstext.** Blöcke werden mit
`document.createElement` und `textContent` gerendert; nur bekannte
Blocktypen erzeugen Markup. Links erhalten `rel="noopener"` bei externen
Zielen, `href` wird gegen `https://` geprüft.

## 4. Block-Renderer (Vertrag)

| Block | Felder | HTML |
| --- | --- | --- |
| `p` | `text` | `<p>` (Text mit `textContent`, Absätze getrennt) |
| `list` | `items[]` | `<ul><li>` |
| `facts` | `rows[[label, value]]` | `<dl>` mit `<dt>/<dd>` |
| `compare` | `tradition{title,text,chips[]}`, `research{...}`, `note` | `.fw-compare` aus `05` §6 |
| `evidence` | `level`, `text` | Chip + Textzeile |
| `quote` | `text`, `source` | `<blockquote>` + `<cite>` |
| `figure` | `svg`, `caption` | Inline-SVG + `<figcaption>` |

Unbekannte Blocktypen werden **nicht** stillschweigend gerendert, sondern
lösen im Entwicklungsmodus `console.warn` aus und werden ausgelassen; ein Test
prüft, dass alle Blöcke der sieben Welten einen bekannten Typ haben.

## 5. Farbwelt-Scoping

- Detailseite: `root.dataset.farbwelt = world.id` und
  `[data-farbwelt="rot"] { --fw-current-*: var(--fw-rot-*) }` (siehe `03` §7).
- Keine Inline-Styles im Markup; Ausnahmen nur für berechnete Verläufe
  (`style="--band-core: …"`), wie im Mockup.
- `prefers-reduced-motion` nicht überschreiben.

## 6. Inhalte aus Task 3

1. Redaktion liefert Markdown je Farbe mit den Abschnitten A–H (Überschriften
   exakt wie in `02` §5).
2. Übersetzung nach `js/data/farbwelten.js` mit einem einmaligen Importskript
   (H2 → Abschnittsschlüssel, H3 → Unterabschnitt, Absätze → `p`, Listen →
   `list`, `> ` → `quote`).
3. Jede Aussage, die eine Wirkung behauptet, bekommt `evidence.level` aus der
   Ampelliste der Recherche (Task 1). Fehlt die Einstufung, wird die Aussage
   nicht übernommen.
4. Der Disclaimer-Platzhalter auf `#farbwelten/lichtfrequenzen` bleibt als
   sichtbarer Text stehen, bis die Redaktion ihn ersetzt; er darf nicht
   „versteckt“ in einem Kommentar liegen.

## 7. Build und Tests

```bash
npm run build            # dist/Esoterik-Welt inkl. Lokal-*.html
npm run test:pages       # Routen-/Regressionsprüfung
npm run test:all         # nur wenn lokal alle Suiten laufen; Dauer beachten
npm run verify:pages     # Playwright-Lauf gegen die gebaute Fassung
```

Ergänzungen, die mit der Implementierung kommen müssen:

- `scripts/verify-pages.cjs`: die vier neuen Routen in `routes` aufnehmen.
- Neuer Test `tests/farbwelten.cjs`: prüft
  1. sieben Farbseiten rendern je eine H1 und die acht Abschnitts-IDs,
  2. Alias `#chakren` landet auf `#farbwelten/chakren`,
  3. Chakra-Auswahl setzt `aria-pressed` und aktualisiert das Panel,
  4. Frequenzberechnung an drei Stützwerten (650/530/420 nm),
  5. keine `console.error` beim Durchlauf aller Routen.
- Kopfzeilen-Test bei 781, 901, 1440 px: kein horizontaler Überlauf, neun
  sichtbare Ziele ab 901 px, Burger darunter.

## 8. Abnahmekriterien (Definition of Done)

| Kriterium | Nachweis |
| --- | --- |
| Einstieg, 7 Farbseiten, Chakren, Lichtfrequenzen erreichbar | `verify-pages`-Lauf, Screenshots |
| Einheitliches Skelett A–H auf allen Farbseiten | Test zählt Abschnitts-IDs |
| Paletten als Tokens, keine Hex-Literale in Komponenten | `grep -n "#[0-9a-f]\{6\}" css/farbwelten.css` → nur Token-Datei |
| Kontraste AA | `generate-palette.py` + `audit-mockup.cjs` grün |
| Fokus, Tastatur, reduced motion | `audit-mockup.cjs` (Fokus, Pfeiltasten, 0 Überlauf) |
| Chakra-Diagramm interaktiv, mobil ohne Abschneiden | Screenshots 390/320, `docOverflowX: 0` |
| Keine Regression der bestehenden Seiten | `test:pages` + `verify:pages` |
| Texte nicht im Markup dupliziert | Inhalte ausschließlich aus `js/data/farbwelten.js` |
| Keine externen Requests, keine Tracker | Netzwerk-Log im `verify-pages`-Lauf |
| Sitemap unverändert, Canonical korrekt | `sitemap.xml` diff = leer |

## 9. Bekannte Risiken

1. **Kopfzeile**: Die Grenze 900 px ist gemessen, aber plattformabhängig
   (Font-Fallbacks). Nach der Umsetzung bei 901 px und 781 px nachmessen; wenn
   die Reserve unter 30 px fällt, Logo auf 22 px reduzieren (nicht die Schrift).
2. **Datenmenge**: Sieben Seiten mit je acht Abschnitten erzeugen viel Text im
   ES-Modul. Wenn die Datei > 150 KB wird, auf `data/farbwelten/*.json` mit
   `fetch` wechseln — dann ist ein Ladezustand nötig (`aria-busy`).
3. **`innerHTML`**: Der Modulcode darf Redaktionstext niemals als HTML
   einsetzen; sonst entsteht eine XSS-Fläche über Inhalte.
4. **Navigation**: Die Breakpoint-Änderung betrifft alle Seiten; die
   bestehenden Tests decken 375/768/1440 px ab, 781–900 px sind neu zu prüfen.
5. **Chakra-Farben**: Die alten `--color-chakra-*`-Werte nicht für Flächen
   verwenden; sie sind Kristalldaten und heller als die neuen Paletten.
