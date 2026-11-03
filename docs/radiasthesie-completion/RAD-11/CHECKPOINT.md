# RAD-11 — Checkpoint: Themenvernetzung

Karte: t_6955196e · Branch: `feature/radiasthesie-modul`
Stand: 3. November 2026 · Status: **umgesetzt und verifiziert, kein Push**
Commits: `8e3070e` (Code), `50c389f` (Checkpoint/Evidenz), `e46e2dd` (Einleitungstext); Doku-Nachträge folgen als eigene Commits.
Basis: `708ced9` (Parent RAD-06)

## 1. Ergebnis in einem Absatz

Die acht Themenfelder aus ESOW-RAD-11 sind vollständig verortet: sieben mit
funktionierendem internem Link (Frequenzkapitel, Chakren, Tarot, Runen, I Ging,
Astrologie, Delphi), Geomantie und Kraftorte als benannte Lücke mit
dokumentierter Zielentscheidung und **ohne** erfundene Route. Ein neues
Grenzkapitel trennt physikalische Frequenz, symbolische Schwingung und
Bovis-Skala. Startseite und Seitenenden speisen sich aus einer einzigen
Registry (`taxonomie.json` → `vernetzung`); der Generator bricht bei toten
Ankern ab. Kaltstart-Deep-Links im Pendeln-Bereich setzen jetzt den Fokus auf
die Zielüberschrift (vorher `<body>`).

## 2. Geänderte Dateien (dieser Commit)

| Datei | Änderung |
| --- | --- |
| `docs/radiasthesie-konzept/inhalte/radiaesthesie.md` | neues Kapitel 9 „Frequenz, Schwingung, Skala“ (A/D), Kapitel 10/11 neu nummeriert |
| `docs/radiasthesie-konzept/daten/taxonomie.json` | `vernetzung` mit 9 Einträgen (7 verfügbar, 2 offen mit Zielentscheidung) |
| `scripts/generate-radiasthesie-data.cjs` | Registry lesen, Routen gegen Kapitel auflösen, Pflichtthemen prüfen, `topic.related` ableiten, Anker `frequenz` |
| `js/modules/radiasthesie-vertraege.js` | additive Vertragsprüfung `vernetzung` (Status/Kind/href/decision/topics) |
| `js/modules/radiasthesie-model.js` | `vernetzung` im Modell |
| `js/modules/radiasthesie-format.js` | `relatedList` rendert Lücken ohne `<a>` (`.rad-related-item--pending`) |
| `js/modules/radiasthesie-views.js` | Landing „Verwandte Themen“ + „Bewusste Lücken“; Weiterlesen aus Registry; Methodik-Satz zu Lücken |
| `js/main.js` | `deepLinkFocus` für Pendeln-Unterrouten (Kaltstart-Fokus, IA §8) |
| `css/radiasthesie.css` | Stil für Lückenkarten und Zwischenüberschrift |
| `tests/radiasthesie.mjs` | 5 neue Tests (Matrix, Routen, Landing/Lücken, ≥2 Fremdmodule, Frequenztrennung) |
| `tests/radiasthesie-vertraege.mjs` | neuer Vertragstest für ungültige Vernetzung |
| `tests/radiasthesie-vernetzung.spec.js` | neu: 6 Browsertests (Startseite, Lücken, Zurück/Vorwärts, Deep-Links, mobil) |
| `tests/radiasthesie.spec.js` | zwei veraltete Zählungen aus RAD-06 korrigiert (17 Begriffe, 66 Quellen) |
| `tests/offline-file.cjs` | Offline-Prüfung für Grenzkapitel und Querverweise |
| `docs/radiasthesie-konzept/ia-konzept.md`, `komponenten-specs.md`, `IMPLEMENTIERUNG.md` | Umsetzungsstand, C14-Lückenzustand, Mengenregel, Zählungen |
| `docs/radiasthesie-completion/RAD-11/` | INTEGRATION.md, Checkpoint, Evidence (Screenshots, `report.json`, `results.json`), Capture-Skript |
| `assets/radiasthesie/media/` | RAD-05-Bestand erstmals versioniert (6 Originale, 24 Varianten, Manifest, Attribution) |
| `docs/radiasthesie-completion/RAD-02`, `RAD-05` | bislang untracked, jetzt versioniert (Bildpfade und Quellenbelege vollständig) |
| `Lokal.html` | neu erzeugt (Offline-Fassung mit dem neuen Kapitel) |

Nicht angefasst: `js/modules/tarot.js`, `runes.js`, `crystals.js`,
`astrologie*.js`, `moon.js`; `css/main.css`, `css/design-system.css`;
`index.html`; `sitemap.xml`; fremde Completion-Ordner (siehe §6).

## 3. Ausgeführte Prüfungen (echte Läufe)

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Datengenerator | `npm run data:radiasthesie` | Exit 0 — 3 Themen, 32 Kapitel, 66 Quellen, 17 Glossarbegriffe, 9 Vernetzungseinträge |
| Unit/Ansichten | `node --test tests/radiasthesie.mjs tests/radiasthesie-vertraege.mjs` | 43/43 pass (23 + 20) |
| Werkstatt-Suiten | `node --test tests/radiasthesie-simulator.mjs tests/pendeltafel-studio.mjs tests/experiment-statistik.mjs tests/journal-speicher.mjs` | 108/108 pass |
| Lint | `npx eslint . --max-warnings 0` | 0 Fehler, 0 Warnungen |
| Format | `npx prettier --check <geänderte Dateien>` | alle konform |
| Build | `npm run build` | Exit 0 (Pages + Offline) |
| Build-Prüfung | `npm run verify:build` | 36/36 Seiten/Viewports, 0 Fehler |
| Seiten-Regression | `node --test tests/pages-regression.cjs tests/local-entry.cjs` | 12 pass, 0 fail, 2 skipped |
| Offline | `node --test tests/offline-file.cjs` | 2/2 pass (keine Netzabrufe, Kapitel + Links offline) |
| Browser Modul | `npx playwright test tests/radiasthesie.spec.js tests/radiasthesie-vernetzung.spec.js` | 19 + 6 = 25/25 pass |
| Browser Werkstatt | `npx playwright test tests/pendel-journal.spec.js tests/pendeltafel-studio.spec.js tests/radiasthesie-simulator.spec.js tests/experiment-labor.spec.js` | 45/45 pass |
| Browser Astrologie (Nachbar) | `npx playwright test tests/astrologie.spec.js` | 15/15 pass |
| Lokale Seitenprüfung | `node scripts/verify-pages.cjs http://127.0.0.1:3191/Esoterik-Welt/ docs/radiasthesie-completion/RAD-11/evidence/live` | 36/36, 0 Fehler |
| Browser-Evidenz | `docs/radiasthesie-completion/RAD-11/scripts/capture-evidence.cjs` | 1440/390: 7 Links, 2 Lücken, Overflow 0, Konsole 0 Fehler, Fokus `frequenz-title` |

Umgebung: Windows 11, Node 24.13, Chromium (Playwright 1.64), Server lokal auf
Port 3191. Kein Firefox, kein Safari, kein Screenreader, kein echter Druck.

## 4. Inhaltliche Nachweise

- **Matrix:** `INTEGRATION.md` §2 ordnet alle acht Auftragsthemen einem Ziel
  oder einer Lücke zu; §3 begründet, warum kein Text dupliziert wurde.
- **Trennung Frequenz/Schwingung/Bovis:** Kapitel `#frequenz` mit A/D,
  Quellen Q51/Q12; Test lehnt Bovis und `Hz`/`Hertz`/`Tesla` im selben Absatz ab.
- **Keine erfundenen Routen:** Generator löst `#pendeln/...` gegen vorhandene
  Kapitel und Modulseiten auf; offene Einträge dürfen kein `href` tragen
  (Vertragstest).
- **Duplikatfrei:** ein Eintrag je Thema, eine Registry für Startseite und
  Seitenenden; Themenseiten drei bis fünf Karten.
- **Zugang/History/Offline:** siehe INTEGRATION.md §5, Browsertests oben.

## 5. Restpunkte

1. **Farbwelten/Frequenzlabor nicht integriert.** `feature/farbwelten-modul`
   (`30a2f62`) und die `feature/frequenzlabor-*`-Branches wurden nicht
   geprüft und nicht cherry-gepickt. Merge-Reihenfolge, gemeinsame Dateien und
   Nacharbeiten stehen in `INTEGRATION.md` §6.
2. **Geomantie und Kraftorte bleiben Lücken.** Eine eigene Seite wäre eine
   Erweiterung des Gesamtangebots; kein Link auf Erdstrahlen oder Delphi.
3. **Kopfzeile nach dem Farbwelten-Merge neu messen.** Dort kommt ein neuntes
   Navigationsziel; die IA-Reserve (31,8 px bei 781 px) gilt für acht Ziele.
   `tests/radiasthesie.spec.js` erwartet auf diesem Branch acht Zeilen.
4. **Nur Chromium.** Keine Aussage zu Firefox/Safari, Screenreader oder Druck.
5. **Repo-Gewicht:** 27 MB Bildoriginale sind jetzt versioniert (bewusste
   Entscheidung aus RAD-05, Prüfsummen gegen Commons). Git LFS bleibt Option.
6. **Zwei veraltete E2E-Zählungen korrigiert** (17 Begriffe, 66 Quellen). Sie
   stammten aus RAD-06 und waren nicht durch RAD-11 verursacht.
7. **`verify:pages` gegen die Produktions-URL** bleibt rot, bis der Branch
   deployt ist — kein Regressionsbefund, nur ein nicht existierendes Ziel.
8. **Fremde Arbeitsbaum-Änderungen** (RAD-08/09/10-Evidence, `evidence/`)
   wurden nicht gestaged, nicht zurückgesetzt und nicht verändert.

## 6. Nächster Schritt

1. Merge-Entscheidung für `feature/farbwelten-modul` (Reihenfolge in
   `INTEGRATION.md` §6); danach Chakren-/Lichtfrequenz-Ziele prüfen und
   gegebenenfalls die Registry umstellen.
2. Neunte Navigationszeile messen und `tests/radiasthesie.spec.js` anpassen.
3. Danach RAD-12 (statisches HTML ohne JS) auf dem zusammengeführten Stand
   bewerten; der Vertrag liegt in `docs/radiasthesie-completion/RAD-06/HANDOFF-RAD-12.md`.
