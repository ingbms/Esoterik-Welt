# Farbwelten — Integrationsstand und Behebung B1–B4 (Karte t_98b085bc)

**Ergebnis: B1, B2, B3 behoben; B4 auf den integrierten Stand gehoben; alle geforderten Prüfungen grün.**
Kein Push, kein Deployment.

| Feld | Wert |
| --- | --- |
| Arbeitsbaum | `C:\Users\mas\Arbeit\Esoterik-Welt\.worktrees\t_98b085bc` |
| Branch | `esoterik-welt/t_98b085bc-farbwelten-integrationsstand-herstellen` |
| Integrationsbasis | `e1ec91b` (Fast-Forward von `30a2f62`; enthält `d099cd1` → `29c7c67` → `b3a76fe` → `e1ec91b` der Abnahme t_1cf8b61c) |
| Umgebung | Windows 11, Node v24.13.0, Playwright 1.64.1 (Chromium), axe-core 4.14.0 |
| Eigene Sonden | `evidence/t_98b085bc/probe/*.mjs` (eigener Static-Server, keine Übernahme von Abnahme-Code) |

## Integrationsstand

Die drei Implementierungsbranches lagen bereits als Konflikt-aufgelöster Stand im
Abnahme-Worktree (`e1ec91b`). Dieser Stand wurde per `git merge --ff-only e1ec91b`
unverändert auf den Kartenbranch übernommen (keine neuen Merge-Konflikte, keine
Änderung an `content/farbwelten/*.md`). Alle Korrekturen unten setzen darauf auf.

## B1 — Farben-Kompass bricht für fünf Farbwelten (behoben)

**Entscheidung:** `COMPASS.worlds` auf alle zwölf Farbwelten erweitert (nicht die
Auswahl begrenzt). Gründe: Der Datenvertrag in `tests/farbwelten.mjs` verlangt
bereits `COMPASS.worlds` == alle `FARBWELTEN`; die Werkzeugbeschreibung nennt den
Vergleich der Farbwelten, und die fünf Farbseiten führen die nötigen Aussagen
bereits belegt im Redaktionstext.

- `scripts/generate-farbwelten-data.cjs`: `COMPASS_ASSOCIATIONS`, `COMPASS_CULTURE`,
  `COMPASS_HINTS` um `tuerkis`, `magenta`, `rosa`, `weiss`, `schwarz` ergänzt;
  Texte sind Verdichtungen der jeweiligen `psychologie`-/`tradition`-Abschnitte
  und zitieren nur Registernummern (`[1] [2] [3] [4] [31]`, `assertToolSources`
  läuft fehlerfrei). `COMPASS.sources` um `[31]` ergänzt. Tool-Beschreibung
  „Sieben Farbwelten" → „Zwölf Farbwelten".
- `js/data/farbwelten.js`: mit `npm run data:farbwelten` neu erzeugt (12 Farbwelten,
  3 Themenseiten, 16 Registereinträge).
- `js/modules/farbwelten.js`: `compassPanel()` nutzt jetzt `world.typeLabel` und
  gibt bei fehlender Wellenlänge `· keine Wellenlänge` aus (vorher `world.spectral ?
  'Spektralfarbe' : 'Mischfarbe'` plus unbedingter Zugriff auf `world.wavelength.label`);
  `renderKompass()` beschriftet die Auswahl mit `${FARBWELTEN.length} Farbwelten`.
- `js/main.js`: Landing-Beschreibung „Sieben Farbwelten" → „Zwölf Farbwelten"
  (die Einstiegsseite führt seit dem Integrationsstand zwölf Farbwelten).

Messung (eigene Sonde, `kompass-touch.json`): 12 Auswahloptionen, Label „12 Farbwelten".
Maus **und** Pfeiltaste für alle fünf betroffenen Farbwelten:

| Farbwelt | Panel-Typzeile | Assoziation im Panel | Status (`role="status"`) | Maus | Pfeiltaste |
| --- | --- | --- | --- | --- | --- |
| Türkis | `Spektralfarbe · 490–520 nm · 577–612 THz` | GREEN–BLUE | „Türkis (Cyan): …" | PASS | PASS |
| Magenta | `nicht spektral · keine Wellenlänge` | bestärkend | „Magenta: …" | PASS | PASS |
| Rosa | `nicht spektral · keine Wellenlänge` | Sanftheit | „Rosa: …" | PASS | PASS |
| Weiß | `Neutralfarbe · keine Wellenlänge` | Klarheit | „Weiß: …" | PASS | PASS |
| Schwarz | `Neutralfarbe · keine Wellenlänge` | Macht | „Schwarz: …" | PASS | PASS |

0 `pageerror`, 0 Konsolenfehler während der gesamten Sitzung (Maus, Tastatur, 390 px).

## B2 — axe `link-in-text-block` auf den Themenseiten (behoben)

- `js/modules/farbwelten.js`: Inline-Links aus Markdown erhalten die Klasse
  `fw-inline-link`.
- `css/farbwelten.css`: `.fw-inline-link` unterstreicht (`text-decoration: underline`,
  Stärke 0,07 em, Offset 0,18 em) — nicht-farbliches Merkmal nach WCAG 1.4.1.

axe-core 4.14.0 (Chromium, Tags wcag2a/2aa/21a/21aa/best-practice):

| Route | Verstöße |
| --- | ---: |
| `#farbwelten/farbtherapie` | 0 |
| `#farbwelten/farbpsychologie` | 0 |
| `#farbwelten/lichtmedizin` | 0 |
| `#farbwelten/kompass` | 0 |
| `#farbwelten/tuerkis` | 0 |

5 Fließtext-Links geprüft, 5 mit `text-decoration-line: underline`.

## B3 — Touch-Ziel unter 32 px (behoben)

`.fw-inline-link` erhält `padding-block: 0.4em` (Inline-Padding vergrößert die
Trefferfläche, ohne den Zeilenfluss zu verschieben). Messung bei 390 px über
`farbtherapie`, `farbpsychologie`, `lichtmedizin`: 5 Fließtext-Links,
**minimale Höhe 34,8 px** (vorher 24 px; der Link „Farbtherapie und Chromotherapie"
liegt damit über der Kartenvorgabe von 32 px).

## B4 — Zählannahmen auf den integrierten Stand (behoben)

| Datei | vorher | jetzt |
| --- | --- | --- |
| `tests/farbwelten.spec.js:214` | 10 Registerzeilen | 15 (12 Farbwelten + 3 Themen) |
| `tests/farbwelten.spec.js:376` | 7 Kompass-Optionen | 12 |
| `tests/farbwelten.mjs:442` | Testname „alle sieben" | „alle zwölf" |
| `scripts/verify-farbwelten.cjs` | Register 12 / Kompass 7 / Screenshotliste ohne magenta, rosa, weiss | `REGISTER_ROWS` (12+3) / `COLOURS.length` / Screenshotliste ergänzt |
| `scripts/verify-farbwelten-rendered.cjs:163` | Register 12 | 12 + 3 Themen |

## Nachweise (Ist-Zahlen, alle im Arbeitsbaum ausgeführt)

| Prüfung | Ergebnis |
| --- | --- |
| `npm run build` | OK (`dist/Esoterik-Welt/`, Offline-Datei) |
| `npm run lint` | 0 Warnungen |
| `npm run format:check` | alle Dateien Prettier-konform |
| `npm run test:farbwelten` | 21/21 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 |
| `E2E_PORT=3157 CI=1 npx playwright test tests/farbwelten.spec.js` | **37/37** (Abnahme: 35/37) |
| `node scripts/verify-farbwelten.cjs` | 116 Prüfungen, 0 Fehler; Kopfzeile 6/6 |
| `node scripts/verify-farbwelten-rendered.cjs` | 18 Routen, 0 Fehler |
| `node scripts/verify-farbwelten-sync.cjs` | 18 Quellen, 16 Registereinträge, 0 Fehler |
| eigene Sonde Kompass/Touch | 12 Optionen, 10/10 Interaktionen PASS, 0 Seitenfehler, min. 34,8 px |
| eigene Sonde axe-core | 5 Ansichten, 0 Verstöße |

`Lokal*.html` wurde nach den Builds auf den Stand des Commits zurückgesetzt
(`git checkout -- Lokal*.html`), damit der Build keine generierten Dateien
hinterlässt.

## Abgrenzung und offene Punkte

- Keine inhaltliche Neubewertung der Redaktionstexte; `content/farbwelten/*.md`
  unverändert. Die neuen Kompass-Texte sind Generator-Konstanten und zitieren
  ausschließlich Registernummern.
- Die Zuordnung „Chakra-Zuordnung" im Kompass folgt weiterhin `world.chakra`
  (Weiß/Schwarz ohne Zentrum), obwohl die Weiß-Farbseite die moderne
  Sahasrāra-Zuordnung erklärt. Das war nicht Teil von B1–B4 und bleibt der
  Redaktion vorbehalten.
- Nicht geprüft (wie in der Abnahme): Screenreader, echte Mobilgeräte, Safari,
  Lighthouse-Lauf. Die Abnahme hatte diese Punkte bereits belegt; an ihnen hat
  sich durch die Korrekturen nichts geändert.
