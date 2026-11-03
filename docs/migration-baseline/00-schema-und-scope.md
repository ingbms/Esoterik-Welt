# ESOW Katalog — Schema und Scope

**Struktur-Version:** 1.0.0
**Stand:** 2026-11-03
**Baseline:** Tag `baseline/rubriken-2026-11-03` — Commit `9f584397f8cc86a261fccdfc36dfbb8999f55ea7`
**Vorgänger-Quelle:** `f1760b581d76088ff611a267ea7f8ade869e2318` (PR #18, CI-Lauf `41665161061`, alle vier Jobs grün)
**Veröffentlicht unter:** https://ingbms.github.io/Esoterik-Welt/
**Owner:** `structured_output` (Struktur), `design_web_layout` (Design-Teil), `writer` (Inhaltsteil)

Dieses Dokument ist die verbindliche Vorlage für den ESOW Design- und Inhaltskatalog. Es
legt Felddefinitionen, Pflichtfelder, ID-Schemata, Ausgabeformat, Ablageort und die
Scope-Abgrenzung fest. Die nachgelagerten Karten füllen den Katalog **nach dieser Vorlage**,
ohne Rückfragen zur Struktur.

---

## 1. Zweck, Geltung und Baseline

### 1.1 Zweck

Der Katalog beantwortet für jeden Design- und Inhaltsbestandteil der veröffentlichten
Website drei Fragen: **Was ist es** (Typ, ID), **wo steht es** (belegbare Quelle mit
Dateipfad und Zeile), und **ist es release-fähig** (Status, Release-Relevanz,
Prüfkriterium, Nachweis). Er ist die Grundlage für die VELARKANA-Umstellung: Was nicht im
Katalog steht, wird bei der Umstellung nicht vermisst.

### 1.2 Verbindlichkeit und Widerspruchsregel

Bei Widersprüchen gilt strikt diese Reihenfolge:

1. **Die veröffentlichte Baseline** (`9f584397…`) — der Quellcode ist die Wahrheit über den
   Ist-Stand, nicht der Katalog.
2. **`docs/migration-baseline/schema/catalog.schema.json`** — die formale Fassung.
3. **Dieses Dokument** — die fachliche Erläuterung.
4. `docs/migration-baseline/examples/*` — Beispiele, niemals der Katalog selbst.

Ein Katalogeintrag, der der Baseline widerspricht, ist ein **Fehler im Eintrag**, nicht in
der Baseline. Die Baseline wird in diesem Arbeitspaket nicht verändert.

### 1.3 Was dieses Dokument nicht ist

- Kein Ersatz für den Katalog. Es enthält Beispielzeilen, keine vollständigen Erhebungen.
- Keine Design- oder Redaktionsentscheidung. Es beschreibt, **wie** erfasst wird, nicht
  **was** gestalterisch oder inhaltlich richtig ist.
- Keine Freigabe unversionierter Entwürfe. Inhalte unter `docs/` und `evidence/`, die nicht
  im Baseline-Commit liegen, sind Herkunftshinweise, keine Quelle (siehe §12 A-03).

### 1.4 Erhebungsmethode

Alle Zahlen in §2 sind **Messwerte des Arbeitsbaums zum Baseline-Commit**, erhoben mit:

```bash
node scripts/migration-baseline/inventory-baseline.cjs --summary
GIT_COMMIT=9f584397f8cc86a261fccdfc36dfbb8999f55ea7 \
GIT_TAG=baseline/rubriken-2026-11-03 \
  node scripts/migration-baseline/inventory-baseline.cjs --write
```

Ergebnis: `docs/migration-baseline/inventory-baseline.json`. `--check` bricht mit Exit 1 ab,
sobald die Datei nicht mehr zum Arbeitsbaum passt. Wer eine Zahl aus §2 im Katalog
verwendet, muss sie nicht glauben — sie ist nachrechenbar.

---

## 2. Ist-Bestand (gemessen, Baseline `9f58439`)

### 2.1 Seiten und Navigation

| Merkmal | Wert | Quelle |
| --- | --- | --- |
| Hauptseiten (Rubriken) | **10** | `js/main.js` → `MAIN_PAGES` |
| Startseitenzugänge in der Navigation | **10** Einträge, davon **9** Zielrubriken neben „Start" | `index.html` → `nav.nav-list` |
| Dokument <title> je Rubrik | 10 | `js/main.js` → `PAGE_META` |
| `index.html` Zeilen | 880 | Messung |

Die Rubriken in Reihenfolge der Navigation (Zugang → Route → `<section>`-Zeile):

| # | Navigationslabel | Route | Seite | `<section>` ab Zeile |
| --- | --- | --- | --- | --- |
| 1 | Start | `#home` | `home` | 110 |
| 2 | Tarot | `#tarot` | `tarot` | 234 |
| 3 | Kristalle | `#crystals` | `crystals` | 340 |
| 4 | Mondphasen | `#moon` | `moon` | 444 |
| 5 | Astrologie | `#astrologie` | `astrologie` | 583 |
| 6 | Frequenzen | `#frequenzen` | `frequenzen` | 603 |
| 7 | Runen | `#runes` | `runes` | 633 |
| 8 | Pendeln | `#pendeln` | `pendeln` | 687 |
| 9 | Farben | `#farbwelten` | `farbwelten` | 707 |
| 10 | Wissen | `#blog` | `blog` | 727 |

`#main` ist Sprungziel, **keine** Seite; unbekannte Fragmente dürfen nie alle Bereiche
ausblenden (`js/main.js`, Kommentar zu `MAIN_PAGES`). Ein Katalogeintrag mit `route: "#main"`
ist ein Fehler.

### 2.2 Statische Dokumente

| Gruppe | Anzahl | Dateien |
| --- | --- | --- |
| Wurzeldokumente | 4 (+ `index.html`) | `impressum.html`, `datenschutz.html`, `haftung.html`, `404.html` |
| Radiästhesie-Dokumente | **7** | `radiasthesie/index.html`, `radiasthesie.html`, `pendeln.html`, `orakel.html`, `glossar.html`, `quellen.html`, `methodik.html` |
| Sitemap-URLs | **11** | `sitemap.xml` |

Die sieben Radiästhesie-Dokumente sind **generiert**: `scripts/generate-radiasthesie-pages.cjs`
(`buildStaticPages`), aufgerufen über `npm run build`. Eingangsdaten sind
`js/data/radiasthesie.js` und die Module `radiasthesie-model.js`, `-views.js`, `-format.js`,
`-seo.js`. Sie tragen `produced_by` (§5.6), nicht nur `source`.

### 2.3 Farbwelten

| Merkmal | Wert | Quelle |
| --- | --- | --- |
| Farbwelten | **12** | `js/data/farbwelten.js` → `FARBWELTEN` |
| Themenseiten | **3** (`farbtherapie`, `farbpsychologie`, `lichtmedizin`) | `js/data/farbwelten.js` → `TOPIC_PAGES` |
| Einstiegsseite | 1 Hub | `LANDING` |
| Übersichtsseiten | 2 (`chakren`, `lichtfrequenzen`) | `CHAKREN_PAGE`, `LIGHT_PAGE` |
| Redaktionsquellen (Markdown) | **18** | `content/farbwelten/*.md` |

Die zwölf Farben: `rot`, `orange`, `gelb`, `gruen`, `tuerkis`, `blau`, `indigo`, `violett`,
`magenta`, `rosa`, `weiss`, `schwarz` — je Route `#farbwelten/<slug>`.

Jede der 18 Markdown-Dateien führt im Frontmatter `slug` und `seite`
(`farbe` 12×, `thema` 3×, `einstieg` 1×, `uebersicht` 1×, `einordnung` 1×). Der Abgleich
`slug` ↔ Dateiname ist Teil der Prüfung (§10). Die Markdown-Dateien werden **zur Bauzeit**
in `js/data/farbwelten.js` kompiliert (`scripts/generate-farbwelten-data.cjs`, Befehl
`npm run data:farbwelten`) und zur Laufzeit **nicht** per `fetch` geladen.

### 2.4 Artikel — zwei getrennte Bestände

| Merkmal | Wert | Quelle |
| --- | --- | --- |
| Gerenderte Artikel | **10** | `js/data/articles.js` (`articles[0..9]`, `id` 1–10) |
| Markdown-Artikel | **12** | `data/articles/article-01.md` … `article-12.md` |
| Gemeinsame Titel | **0** | Stichprobe aller Titel, siehe §7.5 |

Die beiden Bestände sind **nicht** Quelle und Ableitung voneinander: `article-01.md` heißt
„Die Major Arcana: Vom Narr bis zur Welt", `articles[0]` heißt „Die 78 Tarot-Karten: Eine
Reise durch die Major & Minor Arcana". Keine Markdown-Datei wird von `js/modules/blog.js`
gelesen; auf `data/articles/` verweist im ausgelieferten Code nichts. Die Dateien sind
trotzdem öffentlich abrufbar (19.798 Byte), weil GitHub Pages das Repository-Wurzel­verzeichnis
ausliefert.

### 2.5 Design-Bestand

| Merkmal | Wert | Quelle |
| --- | --- | --- |
| CSS-Dateien | 6 (+ `README.md`) | `css/` |
| Custom Properties in `:root` | **170** | `css/design-system.css` ab Zeile 40 |
| Token-Familien | color 28 · space 13 · text 10 · font 8 · radius 6 · shadow 6 · z 6 · transition 3 · container 1 · sonstige 89 | Messung |
| davon Farbwelt-Tokens `--fw-*` | 84 (12 Farben × 7) | Messung |
| Reservierter Light-Block | 14 Tokens, alle Overrides von `:root`, 0 eigene | `[data-theme='light']` ab Zeile 297 |
| Light-Block von einer Seite gesetzt? | **nein** (`data-theme` kommt in `index.html` nicht vor) | Messung |
| Klassen-Selektoren (oberste Ebene) | 115 | Messung |
| Klassen-Präfixe (vor dem ersten `-`) | 38 | Messung |
| Verschiedene Umbruchbreiten | **22** | alle `css/*.css` |
| Breiten in ≥ 2 CSS-Dateien | **13** | Messung |
| Häufigste Breite | `700px`, 14 Vorkommen in 5 Dateien | Messung |

### 2.6 Medien

| Merkmal | Wert |
| --- | --- |
| Dateien unter `assets/` | **644** |
| Gesamtgröße | 96.961.218 Byte (≈ 92,5 MiB) |
| `assets/tarot` (zwei Decks à 238 Dateien) | 476 |
| `assets/crystals` | 121 |
| `assets/radiasthesie` | 37 |
| `assets/fonts` | 5 |
| `assets/cosmos`, `assets/mineral`, Favicon | 2 / 2 / 1 |
| Formate | jpg 481 · webp 131 · avif 11 · svg 6 · json 5 · ttf 3 · png 3 · txt 2 · md 1 · html 1 |

Zwei Tarot-Decks sind registriert (`js/data/tarot-decks.js`): `nachtatelier-v1` (Standard)
und `gartenbrevier-v2` (Farbvariante), beide 78 Karten in drei Auflösungsstufen
(300/600/1200).

### 2.7 Code- und Datenbestand

| Merkmal | Wert |
| --- | --- |
| Module unter `js/modules/` | 42 `.js`-Dateien (davon eine Altdatei `_tarot_old.js`; `*.bak`/`*.bak2` nicht mitgezählt) |
| Datenmodule unter `js/data/` | 11 |
| Statische Daten unter `data/` | 5 (`crystals.json`, `frequencies.json`, `moon-astro.mjs`, `runes.json`, `tarot.json`) |
| Versionierte Dateien im Repository | 1838 |
| Lazy geladene Bereiche | 3 (`frequenzen`, `pendeln`, `farbwelten` über eigene Loader) |

### 2.8 Restbestand — versioniert und öffentlich abrufbar

| Pfad | Byte | Charakter |
| --- | --- | --- |
| `js/main.js.bak` | 9.616 | Sicherung |
| `js/modules/tarot.js.bak` | 11.526 | Sicherung |
| `js/modules/runes.js.bak2` | 5.570 | Sicherung |
| `js/modules/_tarot_old.js` | 5.897 | Altmodul |
| `data/articles/article-010.md.bak` | 777 | Sicherung eines Artikels |
| **Summe** | **33.386** | |

Diese fünf Dateien sind versioniert und werden von GitHub Pages **mit ausgeliefert**. Sie
sind kein Design- und kein Inhaltsartefakt im Sinne des Katalogs (§3.3) und werden deshalb
nicht als Katalogeinträge geführt. Sie sind ein eigener Punkt im Release-Gate.

### 2.9 Was GitHub Pages tatsächlich ausliefert

`scripts/build-pages.cjs` kopiert 13 Einträge nach `dist/Esoterik-Welt/` und ergänzt
`docs/frequenz-quellen.md`. **Für die Veröffentlichung maßgeblich ist aber nicht `dist/`,
sondern das Repository-Wurzelverzeichnis** — der Kommentar in `build-pages.cjs` sagt das
ausdrücklich. Daraus folgt für `delivery` (§5.10): eine versionierte Datei ist öffentlich
abrufbar, auch wenn sie nicht in `dist/` landet.

---

## 3. Scope-Abgrenzung

### 3.1 Definition „im Release"

Ein Artefakt ist **im Release**, wenn es unter der Pages-Wurzel öffentlich abrufbar ist oder
durch `npm run build` erzeugt dorthin gelangt. Das ist die einzige Definition, die im
Katalog verwendet wird; „im Release" heißt nicht „für gut befunden".

### 3.2 Im Katalog

| Katalogteil | Umfang | Primärquelle |
| --- | --- | --- |
| **Design-Katalog** (§6) | Tokens, Komponenten, Layouts, Muster, Zustände, Icons/Illustrationen, Umbruchpunkte | `css/*.css` |
| **Inhalts-Katalog** (§7) | Alle abrufbaren Texte: Rubriken, Unterseiten, Artikel, Rechtstexte, UI-Texte, Metadaten, Fehlermeldungen, Glossar, Quellenlisten, Werkzeugseiten | `index.html`, `content/`, `data/`, `js/data/`, `radiasthesie/*.html`, `*.html` |
| **Medien-Katalog** (§8) | Alle Dateien unter `assets/` inklusive Schriften und beider Tarot-Decks | `assets/` |
| **Funktions-Katalog** (§9) | Interaktive Funktionen und Bereichsmodule | `js/modules/`, `js/main.js` |

### 3.3 Nicht im Katalog, aber im Release-Gate

Diese Bestände sind öffentlich abrufbar, aber weder Design noch Inhalt. Sie werden im
Abschlussbericht als Gate-Punkte geführt, nicht als Einträge:

| Bestand | Begründung | Gate-Frage |
| --- | --- | --- |
| `js/main.js.bak`, `js/modules/tarot.js.bak`, `runes.js.bak2`, `_tarot_old.js` | Implementierung, keine Gestaltung | Sollen sie vor dem nächsten Push entfernt werden? |
| `data/articles/article-010.md.bak` | Duplikat eines Inhalts | Löschen oder als `veraltet` katalogisieren, wenn der Inhalt abrufbar bleiben soll |
| `package.json`, `package-lock.json`, `jest.config.cjs`, `playwright*.cjs`, `eslint.config.cjs` | Werkzeugkonfiguration | nicht release-relevant |
| `.github/`, `config/default.env` | CI und lokale Konfiguration | keine Geheimnisse im öffentlichen Raum |
| `Lokal*.html` | Offline-Ausgabe, aus den Quellen gebaut | wird nicht von Hand gepflegt |
| 22 Breiten in nur einer CSS-Datei | bereichslokal, keine Systementscheidung | siehe §6.3 |

### 3.4 Nicht im Release

| Bestand | Begründung |
| --- | --- |
| `docs/` (576 versionierte Dateien) | Interne Dokumentation. Ausnahme: `docs/frequenz-quellen.md` wird einzeln ausgeliefert, weil die Ansicht `#frequenzen/quellen` sie per `fetch` lädt und verlinkt |
| `evidence/` (379 Dateien) | Prüfnachweise, keine Produktinhalte |
| `scripts/`, `tests/`, `qa/` | Werkzeuge und Tests |
| `node_modules/`, `dist/` | nicht versioniert (`.gitignore`), nicht Teil des Repository-Baums |
| `.worktrees/` | Arbeitskopien |
| `public/` (17 Dateien) | **Alter Platzhalter.** Enthält `public/index.html`, `public/styles.css`, `public/app.js` und Kopien von `css/`, `js/`. `build-pages.cjs` kopiert ihn nicht. Wird **nicht** ausgeliefert und **nicht** katalogisiert — sonst entstünden doppelte Einträge für Dateien, die niemand sieht |

### 3.5 Grenzfälle mit verbindlicher Entscheidung

| Grenzfall | Entscheidung | Begründung |
| --- | --- | --- |
| `content/farbwelten/*.md` | **Quelle**, kein eigener Katalogeintrag. Sie sind `source.path` der jeweiligen Farbwelt-Unterroute | Der Text erscheint genau einmal in der Oberfläche; ein eigener Eintrag würde denselben Text doppelt zählen |
| `js/data/farbwelten.js` | Kein eigener Eintrag; erscheint als `produced_by` der Farbwelt-Einträge | Generierte Projektion der Markdown-Quellen |
| `data/articles/*.md` (12) | **Eigene** Inhalts-Einträge, Typ `article`, `status: offen`, `release_relevance: none` | Anderer Text als die gerenderten Artikel, öffentlich abrufbar, aber in der Oberfläche nicht erreichbar (§7.5) |
| `js/data/articles.js` (10) | Eigene Inhalts-Einträge, Typ `article`, `status: final` | Das ist der Blog, den Besucher lesen |
| `radiasthesie/*.html` | Eigene Einträge mit `route` als **nested** Pfad (`radiasthesie/glossar.html`) | Sie sind indexierbare Dokumente mit eigener URL in `sitemap.xml`, keine Hash-Routen |
| Light-Block `[data-theme='light']` | **Kein** eigener Token-Eintrag; die 14 Overrides stehen als `notes` beim jeweiligen `:root`-Token | Keine Seite setzt `data-theme`; ein eigener Eintrag würde einen Zustand behaupten, den es nicht gibt |
| `js/modules/*.js` | Kein Eintrag, außer als `source.path` eines Funktions-Eintrags (§9) | Implementierung, nicht Gestaltung oder Text |
| `404.html` | Inhalts-Eintrag, Typ `error-message` | Es ist der einzige sichtbare Fehlertext der Website |
| `docs/frequenz-quellen.md` | Inhalts-Eintrag, Typ `source-list`, `delivery: shipped` | Wird ausgeliefert und ist über die Oberfläche verlinkt |
| `sitemap.xml`, `robots.txt` | Kein Inhalts-Eintrag; `sitemap.xml` ist Prüfnachweis für die Dokument-URLs | Maschinenlesbare Konfiguration, kein Text für Besucher |

---

## 4. Ausgabeformat, Ablageort und Namenskonvention

### 4.1 Ablageort

Alle Ergebnisse liegen im Repository, nicht in einem Scratch-Ordner:

```
docs/migration-baseline/
  00-schema-und-scope.md              ← dieses Dokument (verbindlich, von Hand gepflegt)
  schema/catalog.schema.json          ← formale Fassung, JSON Schema 2020-12
  inventory-baseline.json             ← gemessener Ist-Bestand (generiert)
  design-catalog.json                 ← Design-Katalog (kanonisch)
  content-catalog.json                ← Inhalts-Katalog (kanonisch)
  media-catalog.csv                   ← Medien-Katalog
  funktionen-katalog.md               ← Funktions-Katalog
  design-system.md                    ← lesbare Fassung des Design-Katalogs (generiert)
  design-tokens.json                  ← Token-Projektion (generiert)
  content-catalog.md                  ← lesbare Fassung des Inhalts-Katalogs (generiert)
  examples/
    design-catalog.example.json       ← Beispiel, kein Katalog
    content-catalog.example.json      ← Beispiel, kein Katalog
    media-catalog.example.csv         ← Beispiel, kein Katalog

scripts/migration-baseline/
  validate-catalogs.cjs               ← Prüfer
  render-catalogs.cjs                 ← erzeugt die lesbaren Fassungen
  inventory-baseline.cjs              ← erhebt den Ist-Bestand
  lib/catalog.cjs                     ← gemeinsame Regeln, ohne Abhängigkeiten
```

### 4.2 Ausgabeformat — JSON und Markdown als Paar

| Teil | Kanonisches Format | Lesbare Fassung | Begründung |
| --- | --- | --- | --- |
| Design | `design-catalog.json` | `design-system.md` + `design-tokens.json` | JSON ist maschinell prüfbar und diffbar; die Markdown-Tabelle ist lesbar; die Token-Projektion ist die Brücke zur Umstellung |
| Inhalt | `content-catalog.json` | `content-catalog.md` | dito; `claims[]` braucht eine eigene, prüfbare Struktur |
| Medien | `media-catalog.csv` | keine | 644 Zeilen mit 16 gleichartigen Spalten sind in CSV pflegbar, in JSON unhandlich; CSV ist in Tabellenkalkulation und Skript prüfbar |
| Funktionen | `funktionen-katalog.md` | — | Wenige Einträge, viel Prosa je Eintrag; eine Markdown-Tabelle mit Absätzen ist hier robuster als JSON |

**Regel:** Die Markdown-Fassungen und `design-tokens.json` sind **Erzeugnisse**. Änderungen
gehören ausschließlich in die JSON- bzw. CSV-Quelle; danach
`node scripts/migration-baseline/render-catalogs.cjs`. `--check` schlägt fehl, sobald eine
erzeugte Datei von der Quelle abweicht.

### 4.3 Namenskonvention und ID-Schema

| Katalogteil | Muster | Beispiel | Bedeutung des Mittelteils |
| --- | --- | --- | --- |
| Design | `DES-<CODE>-<NNN>` | `DES-TOK-001` | siehe §6.1 |
| Inhalt | `CNT-<CODE>-<NNN>` | `CNT-PAG-001` | siehe §7.1 |
| Aussage | `CLM-<NNN>` | `CLM-001` | laufende Nummer, keine Bedeutung |
| Medien | `MED-<NNNN>` | `MED-0001` | vierstellig, fortlaufend |
| Funktion | `FUN-<BEREICH>-<NNN>` | `FUN-PEN-002` | siehe §9.2 |

Regeln für alle IDs:

1. `<NNN>` ist dreistellig mit führenden Nullen (`001`, nicht `1`).
2. IDs werden **einmal** vergeben und nie neu belegt. Wird ein Eintrag entfernt, bleibt die
   Nummer verbraucht; Lücken sind zulässig und erwünscht.
3. Der Typcode im ID-Mittelteil **muss** zum Feld `type` passen — der Prüfer erzwingt das
   (`ID_TYPE_MISMATCH`).
4. Sortierung: aufsteigend nach ID. Vergabe in der Reihenfolge des Vorkommens in der
   Baseline (Dokumentreihenfolge), nicht alphabetisch.
5. Ein Eintrag beschreibt **genau ein** Artefakt. Zwei Einträge dürfen nicht dieselbe
   Quelle mit demselben Selektor beschreiben (`DUPLICATE_ID` prüft nur die ID; die
   Quelleneindeutigkeit prüft die Karte).

### 4.4 Datums- und Zahlenformate

| Feld | Format | Regel |
| --- | --- | --- |
| `stand`, `stand` im Kopf | `YYYY-MM-DD` | kein Zeitanteil, keine Zukunft (`STAND_FUTURE`) |
| `version` | `X.Y.Z` oder `X.Y.Z-suffix` | nur setzen, wenn die Quelle eine Version führt |
| `base_commit` | 7–40 Hexzeichen | Commit, **gegen den erhoben wurde** — nicht der Arbeitsstand |
| `value` | Freitext ≤ 120 Zeichen | reale CSS-Werte unverändert, inklusive Einheit |

---

## 5. Gemeinsame Felder beider Kataloge

Jeder Eintrag in `design-catalog.json` und `content-catalog.json` hat die folgenden Felder.
`P` = Pflicht, `O` = optional, `B` = bedingt pflichtig.

### 5.1 `id` — P

Eindeutige Kennung nach §4.3. Muster wird vom Prüfer und vom JSON Schema erzwungen.
**Beispiel:** `DES-TOK-001`, `CNT-PAG-001`.

### 5.2 `name` und `description` — P

| Feld | Regel |
| --- | --- |
| `name` | 3–120 Zeichen. Der Name, unter dem das Artefakt im Projekt genannt wird: CSS-Variablenname, Klassenname, Seitentitel oder Dateiname. Keine Erfindung, keine Übersetzung |
| `description` | 10–400 Zeichen. Was das Artefakt **tut** oder **aussagt**, nicht wie es aussieht. Bei Tokens: Rolle im Layout. Bei Texten: Inhalt in einem Satz |

**Gutes Beispiel:** `name: "--color-bg-deep"`, `description: "Hintergrundfarbe des gesamten
Nacht-Raums; Grundfläche aller Seiten."`
**Schlechtes Beispiel:** `name: "Hintergrund"`, `description: "dunkle Farbe"` — nicht
auffindbar, nicht prüfbar.

### 5.3 `type` — P

Der Typ bestimmt ID-Code, Pflicht-Zusatzfelder und die Gliederung der lesbaren Fassung.
Design-Typen in §6.1, Inhaltstypen in §7.1. Ein Typ, der in der Tabelle fehlt, ist nicht
erlaubt (`TYPE_UNKNOWN`); ein neuer Typ erfordert eine Änderung von Schema, `lib/catalog.cjs`
und diesem Dokument **im selben Commit**.

### 5.4 `owner` — P

Verantwortliches Hermes-Profil. Der Wert muss einem existierenden Profil entsprechen; der
Prüfer akzeptiert nur diese Liste:

| Wert | Zuständig für |
| --- | --- |
| `structured_output` | Struktur, Schema, Prüfung, Katalog-Konsistenz |
| `design_web_layout` | Tokens, Komponenten, Layouts, Umbruchpunkte |
| `design_critique` | Gestalterische Bewertung, Widersprüche im Designsystem |
| `writer` | Inhalte, Metadaten, Claims, Rechtstexte |
| `review_approval` | Unabhängige Abnahme |
| `architect` | Übergreifende Entscheidungen, Schnittstellen |
| `default` | Auffangwert, wenn keine Fachzuordnung möglich ist |

**Regel:** `owner` ist die Person, die den Eintrag inhaltlich verantwortet — nicht die, die
ihn abgetippt hat. Bei unklarer Zuständigkeit `architect` eintragen und den Punkt in
`open_questions` führen.

### 5.5 `source` — P

Belegstelle des Eintrags. Mindestens `path` **oder** `url`.

| Unterfeld | P | Regel |
| --- | --- | --- |
| `path` | B | Repo-relativer POSIX-Pfad, kein führendes `./`, kein `..`, 3–200 Zeichen. Muss im Release-Stand existieren (`SOURCE_NOT_FOUND`) |
| `selector` | O | CSS-Selektor, HTML-`id`, Markdown-Überschrift oder Array-Index, der den Eintrag **in dieser Datei eindeutig** lokalisiert. 1–160 Zeichen |
| `lines` | O | `L<start>` oder `L<start>-L<ende>`, 1-basiert, auf die **Baseline** bezogen |
| `url` | B | `http(s)://…`, wenn die maßgebliche Quelle extern ist |

**Regel:** `path` zeigt auf die maßgebliche Datei, nicht auf eine Kopie. Bei generierten
Dateien zeigt `path` auf die **Quelle**, und `produced_by` nennt den Erzeuger.

**Zeilennummern sind baseline-gebunden.** Ändert sich die Datei, sind sie neu zu erheben —
der Prüfer kann sie nicht validieren (§10.4). Wo Zeilen nicht stabil sind, ist ein
`selector` die bessere Wahl.

### 5.6 `produced_by` — B

Pflicht, wenn die Datei hinter `source.path` nicht von Hand gepflegt wird.

| Unterfeld | P | Regel |
| --- | --- | --- |
| `command` | P | Exakt ausführbarer Befehl aus `package.json`, z. B. `npm run build` |
| `from` | P | Mindestens ein Eingangspfad; jeder muss existieren (`PRODUCED_FROM_NOT_FOUND`) |

**Beispiel:** `{"command": "npm run build", "from": ["js/data/radiasthesie.js",
"js/modules/radiasthesie-model.js"]}`

### 5.7 `version` und `stand` — `stand` P, `version` O

| Feld | Regel |
| --- | --- |
| `stand` | Datum der letzten inhaltlichen Änderung des Artefakts in der Baseline, `YYYY-MM-DD`. **Nicht** das Datum der Katalogisierung |
| `version` | Nur setzen, wenn die Quelle selbst eine Version führt (z. B. Tarot-Deck `1.0.0`, `2026-11-02`) |

### 5.8 `status` — P

| Wert | Bedeutung | Konsequenz |
| --- | --- | --- |
| `final` | Vorhanden und abgenommen | darf `release_relevance: must` tragen |
| `entwurf` | Vorhanden, nicht abgenommen | `must` erzeugt eine Warnung (`BLOCKER_NOT_FINAL`) |
| `offen` | Nicht vorhanden oder nicht erreichbar | `must` erzeugt eine Warnung; `open_questions` ist Pflicht (`OPEN_STATUS_WITHOUT_QUESTION`) |
| `veraltet` | Vorhanden, aber nicht mehr der Stand | `release_relevance` ist `none` oder der Eintrag ist ein Gate-Punkt |

`status` beschreibt das **Artefakt**, nicht den Katalog. Ein Eintrag ist nicht deshalb
`final`, weil er korrekt erfasst wurde.

### 5.9 `release_relevance` — P

| Wert | Bedeutung |
| --- | --- |
| `must` | Blocker für den nächsten Push. Fällt der Eintrag aus, ist das Release nicht abgeschlossen |
| `should` | Vor dem Push anzustreben; Nachbesserung zulässig und zu begründen |
| `none` | Nicht release-relevant; bleibt als Nachweis im Katalog |

**Regel:** `must` nur setzen, wenn der Ausfall des Artefakts eine Rubrik oder einen
Rechtstext unbrauchbar macht. Alles andere ist `should` oder `none`. `delivery: excluded`
zusammen mit `must` ist ein Fehler (`EXCLUDED_MUST`).

### 5.10 `delivery` — P

| Wert | Bedeutung |
| --- | --- |
| `shipped` | Unter der Pages-Wurzel öffentlich abrufbar oder von `build-pages.cjs` dorthin erzeugt (§2.9) |
| `source-only` | Im Repository vorhanden, nicht öffentlich abrufbar |
| `excluded` | Bewusst nicht im Release (z. B. `public/`) |

`delivery` ist eine **technische** Aussage. Sie sagt nichts über Qualität. Eine Datei kann
`shipped` und `status: veraltet` sein — genau das trifft auf den Restbestand aus §2.8 zu.

### 5.11 `acceptance_check` — P

Prüfbares Kriterium im Imperativ, 10–300 Zeichen, mit Bezug auf die **Wirkung** im
Ergebnis. Kein Optimierungsziel, keine Absichtserklärung.

| Gut | Schlecht |
| --- | --- |
| „Im gerenderten Seitenhintergrund steht `rgb(11, 16, 18)`; kein ausgeliefertes CSS setzt `--color-bg-deep` außerhalb von `:root` und dem reservierten Light-Block." | „Farbe sieht gut aus." |
| „Erstes Tab-Ereignis fokussiert den Sprunglink, `Enter` setzt den Fokus auf `#main`." | „Barrierefrei." |

**Regel:** Ein Kriterium, das ein Skript, ein `grep` oder ein Blick in die Seite nicht
entscheiden kann, ist kein Kriterium. Formulierungen wie „angemessen", „modern", „korrekt"
sind zu ersetzen.

### 5.12 `evidence` — O, aber empfohlen

Nicht-leeres Array aus Nachweisen. Jeder Eintrag ist ein repo-relativer Pfad, eine
`http(s)`-URL oder `cmd: <befehl>`. 3–300 Zeichen.

**Beispiel:** `["cmd: grep -n -- '--color-bg-deep:' css/design-system.css", "index.html#L63"]`

### 5.13 `open_questions` und `notes` — O, aber `open_questions` bei `status: offen` P

| Feld | Regel |
| --- | --- |
| `open_questions` | Nicht-leeres Array offener Punkte, je ≥ 5 Zeichen. **Pflicht**, wenn `status: offen` |
| `notes` | Ein Absatz ≤ 600 Zeichen. Nur Zusatzwissen, das in kein anderes Feld passt: Sonderfälle, verworfene Alternativen, Querbezüge |

Offene Fragen werden nicht mit „später prüfen" abgetan, sondern benennen **die Entscheidung
und ihren Auslöser**.

### 5.14 Pflichtfelder-Matrix

| Feld | Design | Inhalt | Aussage |
| --- | --- | --- | --- |
| `id` | P | P | P |
| `name` | P | P | — |
| `description` | P | P | — |
| `type` | P | P | P (`kind`) |
| `source` | P | P | — |
| `produced_by` | B | B | — |
| `version` | O | O | — |
| `stand` | P | P | — |
| `status` | P | P | P |
| `owner` | P | P | P |
| `release_relevance` | P | P | P |
| `delivery` | P | P | — |
| `acceptance_check` | P | P | — |
| `evidence` | O | O | O |
| `open_questions` | B | B | O |
| `notes` | O | O | — |
| `text_ref` | — | P | P |
| `language` | — | P | — |
| `claims` | — | O | — |
| `claim`, `kind`, `verification`, `citation` | — | — | P |

---

## 6. Design-Katalog

### 6.1 Typen und ID-Codes

| `type` | Code | Umfang | Pflicht-Zusatzfelder |
| --- | --- | --- | --- |
| `token-color` | `TOK` | Farbvariablen | `value` |
| `token-typography` | `TOK` | Schriftfamilie, Größe, Gewicht, Laufweite | `value` |
| `token-space` | `TOK` | Abstandsraster | `value` |
| `token-radius` | `TOK` | Eckenradien | `value` |
| `token-motion` | `TOK` | Dauer, Kurven | `value` |
| `token-shadow` | `TOK` | Schatten und Glow | `value` |
| `token-z` | `TOK` | Stapelreihenfolge (z-index) | `value` |
| `token-size` | `TOK` | Feste Maße außerhalb des Abstandsrasters (Rahmenbreite, Kopfzeilenhöhe, Fußzeilenhöhe) | `value` |
| `component` | `CMP` | Wiederverwendbarer Baustein (`.btn`, `.card`, `.badge`, `.nav`, `.modal`, …) | `states` empfohlen, `uses_tokens` empfohlen |
| `layout` | `LAY` | Seitenvorlage, Raster, Bereichsaufbau | `uses_tokens` empfohlen |
| `pattern` | `PAT` | Wiederkehrendes Muster ohne eigene Klasse (Kartenraster, Timeline, Filterleiste) | — |
| `state` | `STA` | Globaler Zustand (`:focus-visible`, `:disabled`, `[hidden]`, `prefers-reduced-motion`) | `states` |
| `icon` | `ICO` | Symbol aus dem Bestand | — |
| `illustration` | `ILL` | Gezeichnetes Element, Hero-Grafik | — |
| `breakpoint` | `BP` | Umbruchpunkt | `value` |

Welche Zusatzfelder **maschinell** erzwungen werden: `value` bei allen `token-*`-Typen
(Schema und Prüfer, `TOKEN_VALUE`). `states`, `uses_tokens`, `produced_by` sind fachlich
Pflicht, wo die Tabelle sie nennt, werden aber nicht vom Prüfer erzwungen — sie fallen in
die Abnahme (§10.4 Punkt 3).

**Vollständigkeitsregel für Tokens:** Jede Custom Property in `:root` erhält **genau einen**
Eintrag. Für Baseline `9f58439` sind das **170**. Die 84 `--fw-*`-Werte sind Teil des
Designsystems und werden einzeln geführt, nicht als Sammelposten. Die 14 Overrides im
reservierten Light-Block erhalten **keinen** eigenen Eintrag; sie stehen als `notes` beim
zugehörigen `:root`-Token, weil keine Seite `data-theme` setzt.

**Vollständigkeitsregel für Komponenten:** `inventory-baseline.json` listet 38
Klassen-Präfixe. Jedes Präfix ist entweder als `component`, `layout` oder `pattern`
katalogisiert **oder** in einer Ausschlusstabelle der Karte mit Grund geführt
(Hilfsklasse, Container, Typografie-Utility). Ein Präfix ohne Entscheidung ist ein offener
Punkt, kein stiller Ausschluss.

Die 38 Präfixe: `absolute`, `animate`, `badge`, `btn`, `card`, `container`, `crystal`,
`fixed`, `flex`, `footer`, `gap`, `grid`, `h`, `header`, `input`, `inset`, `italic`,
`items`, `justify`, `label`, `logo`, `mb`, `modal`, `mt`, `mx`, `nav`, `overflow`,
`relative`, `rounded`, `section`, `select`, `skip`, `sr`, `stagger`, `text`, `textarea`,
`tooltip`, `w`.

### 6.2 `value` — bedingt pflichtig

Pflicht bei allen `token-*`-Typen (`TOKEN_VALUE`), zulässig zusätzlich bei `breakpoint`.
Nicht zulässig bei Komponenten und Layouts (`VALUE_WITHOUT_TOKEN`-Warnung).

Der Wert wird **unverändert** aus der Quelle übernommen: `#0b1012`, `12px`, `2px`,
`'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
`max-width: 700px`. Keine Normalisierung, keine Umrechnung, keine gerundeten Zahlen.

### 6.3 Umbruchpunkte — Entscheidung

**Gemessen:** 22 verschiedene Breiten in sechs CSS-Dateien; 13 davon kommen in mindestens
zwei Dateien vor; `700px` ist mit 14 Vorkommen in fünf Dateien die tragende Breite.

**Entscheidung:** Der Design-Katalog führt **eine** `breakpoint`-Zeile je Breite, die in
**mindestens zwei CSS-Dateien** vorkommt — für diese Baseline **13 Einträge** (`700`, `900`,
`480`, `360`, `1100`, `1000`, `640`, `1024`, `400`, `560`, `720`, `780`, `1200` px). Die 9
Breiten, die nur in einer Datei vorkommen (`380`, `420`, `520`, `632`, `701`, `768`, `781`,
`901`, `1199` px), sind bereichslokal und werden **nicht** als eigener Eintrag geführt; sie
erscheinen in `notes` des betroffenen Layout- oder Komponenteneintrags.

Begründung: Eine Breite, die nur ein Bereichsstylesheet verwendet, ist eine
Implementierungsentscheidung dieses Bereichs, keine Systementscheidung. Sie als
Design-Token zu führen, würde eine Verbindlichkeit behaupten, die sie nicht hat.

Aufbau je Eintrag:

| Feld | Inhalt |
| --- | --- |
| `id` | `DES-BP-001` … `DES-BP-013`, aufsteigend nach Breite |
| `name` | `Umbruchpunkt 700px` |
| `type` | `breakpoint` |
| `value` | `max-width: 700px` (bzw. `min-width`, wenn die Quelle `min-width` nutzt) |
| `source` | Die **führende** Datei mit Zeile: `css/main.css` L1933, sonst `css/design-system.css` |
| `notes` | Alle Dateien mit Vorkommen und deren Anzahl, z. B. „5 Dateien: design-system, farbwelten, frequenzlabor, main, radiasthesie; 14 Vorkommen" |
| `acceptance_check` | „Bei 699px gilt das einspaltige Layout, bei 701px das zweispaltige; kein horizontaler Überlauf bei 390px." |
| `release_relevance` | `should` |
| `owner` | `design_web_layout` |

### 6.4 `states` — optional, empfohlen bei Komponenten

Nicht-leeres Array, eindeutige Werte aus: `default`, `hover`, `focus`, `active`,
`disabled`, `error`, `empty`, `loading`, `selected`, `expanded`.

**Regel:** Nur Zustände eintragen, die im CSS **tatsächlich** existieren. Ein Zustand, den
man sich wünscht, ist eine offene Frage, kein `state`. `focus` gehört nur dann in die Liste,
wenn die Komponente eigene Fokusregeln hat — der globale `:focus-visible`-Block
(`css/design-system.css` ab Zeile 549) ist ein eigener `state`-Eintrag, keine
Komponenteneigenschaft.

### 6.5 `uses_tokens` — optional

Array von `DES-TOK-###`-IDs **desselben** Katalogs. Jede referenzierte ID muss existieren
(`TOKEN_REF_MISSING`). Die Liste ist die Grundlage der Token-Abhängigkeitsprüfung bei der
Umstellung: Ein Token ohne Verwendung ist ein Kandidat zum Entfernen.

### 6.6 Beispielzeilen

Vollständiger Eintrag (Token):

```json
{
  "id": "DES-TOK-001",
  "name": "--color-bg-deep",
  "description": "Hintergrundfarbe des gesamten Nacht-Raums; Grundflaeche aller Seiten.",
  "type": "token-color",
  "source": { "path": "css/design-system.css", "selector": ":root", "lines": "L42" },
  "value": "#0b1012",
  "version": "1.0.0",
  "stand": "2026-11-03",
  "status": "final",
  "owner": "design_web_layout",
  "release_relevance": "must",
  "delivery": "shipped",
  "acceptance_check": "Im gerenderten Seitenhintergrund steht rgb(11, 16, 18); kein ausgeliefertes CSS setzt --color-bg-deep ausserhalb von :root und dem reservierten Light-Block.",
  "evidence": ["cmd: grep -n -- '--color-bg-deep:' css/design-system.css"],
  "notes": "Zweite Definition in L298 gehoert zum reservierten Block [data-theme='light']; keine Seite setzt data-theme, daher kein eigener Eintrag."
}
```

Vollständiger Eintrag (Zustand):

```json
{
  "id": "DES-STA-001",
  "name": "Globaler Tastaturfokus (:focus-visible)",
  "description": "Einheitlicher Fokusring fuer alle bedienbaren Elemente; erscheint nur bei Tastaturbedienung, nicht bei Mausklick.",
  "type": "state",
  "source": { "path": "css/design-system.css", "selector": "a:focus-visible", "lines": "L549-L556" },
  "stand": "2026-11-03",
  "status": "final",
  "owner": "design_web_layout",
  "release_relevance": "must",
  "delivery": "shipped",
  "acceptance_check": "Tab durch die Startseite zeigt an jedem Link und jeder Schaltflaeche einen sichtbaren Fokusring; ein Mausklick erzeugt keinen Ring.",
  "states": ["focus"],
  "evidence": ["cmd: grep -n ':focus-visible' css/design-system.css"]
}
```

Zeile in der lesbaren Fassung (`design-system.md`), erzeugt von `render-catalogs.cjs`:

| ID | Name | Wert | Quelle | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DES-TOK-001 | `--color-bg-deep` | `#0b1012` | `css/design-system.css` · `:root` · L42 | 2026-11-03 | final | must | `design_web_layout` | Im gerenderten Seitenhintergrund steht rgb(11, 16, 18) … |

---

## 7. Inhalts-Katalog

### 7.1 Typen und ID-Codes

| `type` | Code | Umfang | Route |
| --- | --- | --- | --- |
| `page` | `PAG` | Rubrik der Einzelseite (`#home` … `#blog`) | immer |
| `area` | `ARE` | Bereichsmodul innerhalb einer Rubrik mit eigener Ansicht (Frequenzlabor, Pendeltafel) | empfohlen |
| `subroute` | `SUB` | Adressierbare Unteransicht einer Rubrik (`#farbwelten/rot`, `#astrologie/zeichen/widder`, `#blog/1`) | immer |
| `article` | `ART` | Blogartikel — gerendert oder als Markdown abrufbar | gerendert: ja |
| `legal` | `LEG` | Impressum, Datenschutz, Haftung | immer |
| `ui-string` | `STR` | Sichtbarer Bedientext (Sprunglink, Schaltflächenlabel, Leerzustand) | optional |
| `metadata` | `MET` | `<title>`, `meta description`, `og:*` je Adresse | optional |
| `error-message` | `ERR` | Sichtbare Fehlertexte (`404.html`, Routing-Hinweis, Bereichsfehler) | immer |
| `glossary` | `GLO` | Glossar (Radiästhesie, Astrologie) | immer |
| `source-list` | `SRC` | Quellen- und Belegliste (Frequenzen, Radiästhesie, Mond) | immer |
| `tool` | `TOOL` | Werkzeugseite, die eine Funktion trägt (Pendeln, Frequenzlabor) | immer |

### 7.2 `text_ref` — P

Eindeutige Referenz auf den Originaltext. Zwei Formen:

| Form | Muster | Wann |
| --- | --- | --- |
| Zeilen | `<pfad>#L<a>` oder `<pfad>#L<a>-L<b>` | **Standard.** Immer, wenn der Text in einer Datei mit stabilen Zeilen liegt |
| Anker | `<pfad>#<ascii-slug>` | Nur wenn ein stabiler ASCII-Anker existiert (`#home`, `#crystals`) |

**Regel:** `text_ref` zeigt auf den **Originaltext**, nie auf eine Paraphrase. Bei
Überschriften mit Umlauten (`## Einführung`) ist die Zeilenform zu verwenden, weil der
Slug `einführung` nicht dem ASCII-Muster entspricht. Weicht das Pfadpräfix von
`source.path` ab, warnt der Prüfer (`TEXT_REF_PATH_MISMATCH`); die Abweichung ist dann zu
begründen oder zu korrigieren.

### 7.3 `route` — O, aber empfohlen

Öffentliche Adresse des Eintrags. Zwei Formen:

| Form | Muster | Beispiel |
| --- | --- | --- |
| Hash-Route | `#` + Pfad aus `[A-Za-z0-9/_-]` | `#home`, `#farbwelten/rot`, `#blog/1` |
| Dokument | Pfad aus `[A-Za-z0-9._-]`, optional mit Verzeichnissen, Endung `.html` | `impressum.html`, `radiasthesie/glossar.html` |

**Wichtig:** Die Dokumentform erlaubt **verschachtelte Pfade**. Das ist eine Korrektur
gegenüber der ersten Fassung, die nur flache `.html`-Dateien zuließ — die Baseline liefert
sieben Dokumente unter `radiasthesie/` mit eigener URL in `sitemap.xml`; ohne diese
Erweiterung wären sie nicht katalogisierbar gewesen (siehe §13).

Für `radiasthesie/index.html` wird die Dateiform eingetragen, nicht die Verzeichnis-URL
`…/radiasthesie/`: Die Datei ist damit prüfbar vorhanden.

### 7.4 `headings`, `links`, `components`, `media_ids` — alle optional

| Feld | Regel |
| --- | --- |
| `headings` | Inhaltsstruktur in Dokumentreihenfolge als `{level, text}`. `level` 1–6. Nur echte Überschriften, in der Reihenfolge des gerenderten Dokuments. `text` ohne Inline-Markup, aber wortgleich |
| `links` | `{internal: […], external: […]}`. `internal` als Route oder Anker, `external` als `http(s)`-URL. Nur Links, die der Eintrag **selbst** setzt |
| `components` | Verwendete `DES-`-IDs aus `design-catalog.json`. Diese Liste macht die Umstellung prüfbar: Ändert sich eine Komponente, sind die Nutzer bekannt |
| `media_ids` | Verwendete `MED-####`-IDs aus `media-catalog.csv` |

### 7.5 Artikel — Entscheidung

Die Baseline enthält **zwei voneinander unabhängige Artikelbestände** (§2.4). Die frühere
Fassung dieses Abschnitts ließ die Frage offen; sie ist hiermit entschieden:

| Bestand | Einträge | `type` | `route` | `status` | `release_relevance` |
| --- | --- | --- | --- | --- | --- |
| `js/data/articles.js`, `articles[0..9]` | 10 | `article` | `#blog/1` … `#blog/10` | `final` | `must` |
| `data/articles/article-01.md` … `-12.md` | 12 | `article` | **keine** (nicht adressierbar) | `offen` | `none` |

Begründung: Es handelt sich um **verschiedene Texte**, nicht um Quelle und Ableitung. Die
Markdown-Dateien sind öffentlich abrufbar (weil `data/` ausgeliefert wird), aber von der
Oberfläche aus nicht erreichbar — keine Datei im ausgelieferten Code verweist auf sie. Sie
zu verschweigen wäre falsch, sie als Release-Blocker zu führen wäre ebenfalls falsch. Der
Eintrag hält den Befund fest und macht ihn entscheidbar.

Umsetzung: `source.path` = jeweilige Datei, `text_ref` = Überschrift-Zeile des Artikels,
`notes` = „Nicht gerendert; keine Referenz aus `js/modules/blog.js`. Entscheidung über
Veröffentlichung oder Entfernung offen." Die ID-Gruppe `CNT-ART-011` … `CNT-ART-022` ist
für diesen Bestand reserviert, damit die gerenderten Artikel ihre Nummern 001–010 behalten.

### 7.6 `claims` — Aussagen

Der Inhalts-Katalog führt neben `entries[]` ein Array `claims[]` mit prüfbaren Aussagen:
Zahlen, Daten, Namenszuschreibungen, Wirkungsbehauptungen, Rechtsangaben.

| Feld | P | Regel |
| --- | --- | --- |
| `id` | P | `CLM-###` |
| `claim` | P | **Wörtliche** Aussage, 5–300 Zeichen, nicht paraphrasiert |
| `kind` | P | `number`, `date`, `name`, `attribution`, `effect`, `legal`, `other` |
| `text_ref` | P | Wie §7.2 — wo die Aussage steht |
| `verification` | P | `verified` (durch Quelle belegt), `unverified` (Beleg fehlt), `unverifiable` (nicht prüfbar, bleibt als solches gekennzeichnet) |
| `citation` | B | Pflicht bei `verified` (`CLAIM_CITATION`) |
| `status`, `owner`, `release_relevance` | P | wie §5.8–§5.9 |

Regeln:

1. Jede Zahl, jedes Datum und jede Wirkungsbehauptung im Fließtext bekommt eine Aussage.
2. `verified` ohne `citation` ist nicht zulässig; `verified` ohne `evidence` erzeugt eine
   Warnung (`CLAIM_EVIDENCE`).
3. `release_relevance: must` bei `verification: unverified` ist ein **Blocker** und erzeugt
   eine Warnung (`CLAIM_BLOCKER_UNBELEGT`). Genau so ist `CLM-002` („30 Kristalle") heute
   eingestuft.
4. Eine Aussage ohne referenzierenden Eintrag ist verwaist (`CLAIM_ORPHAN`-Warnung).
5. `unverifiable` ist eine zulässige, ehrliche Einstufung — sie darf nur nicht als
   `verified` getarnt werden.

### 7.7 Beispielzeilen

Vollständiger Eintrag (Rubrik):

```json
{
  "id": "CNT-PAG-001",
  "name": "Startseite (#home)",
  "description": "Einstiegsseite mit Hero, Themenuebersicht und Wegweiser in die neun Hauptbereiche; Traeger der Seitenmetadaten fuer die Wurzel-URL.",
  "type": "page",
  "source": { "path": "index.html", "selector": "#home", "lines": "L110" },
  "text_ref": "index.html#home",
  "route": "#home",
  "language": "de",
  "stand": "2026-11-03",
  "status": "final",
  "owner": "writer",
  "release_relevance": "must",
  "delivery": "shipped",
  "acceptance_check": "Aufruf der Wurzel-URL zeigt die Sektion #home als aktive Seite; <title> entspricht PAGE_META.home in js/main.js.",
  "headings": [
    { "level": 1, "text": "Entdecke die verborgene Sprache des Universums" },
    { "level": 2, "text": "Ein leiser Bezug zum großen Ganzen." }
  ],
  "links": {
    "internal": ["#tarot", "#crystals", "#moon", "#astrologie", "#frequenzen", "#runes", "#pendeln", "#farbwelten", "#blog"]
  },
  "evidence": ["index.html#L116", "js/main.js#L83"]
}
```

Vollständiger Eintrag (Unterroute mit generierter Datenquelle):

```json
{
  "id": "CNT-SUB-001",
  "name": "Farbwelt Rot (#farbwelten/rot)",
  "description": "Farbseite zu Rot: Physik (620-750 nm), kulturelle Assoziationen, Chakra-Zuordnung und die Grenzen farbtherapeutischer Aussagen.",
  "type": "subroute",
  "source": { "path": "content/farbwelten/rot.md", "selector": "h1", "lines": "L10" },
  "produced_by": { "command": "npm run data:farbwelten", "from": ["content/farbwelten/rot.md"] },
  "text_ref": "content/farbwelten/rot.md#L10",
  "route": "#farbwelten/rot",
  "language": "de",
  "stand": "2026-11-03",
  "status": "final",
  "owner": "writer",
  "release_relevance": "must",
  "delivery": "shipped",
  "acceptance_check": "Aufruf #farbwelten/rot zeigt H1 Rot und den Lede-Text aus dem Markdown; die Seite nennt 620-750 nm und 400-484 THz.",
  "claims": ["CLM-003"],
  "evidence": ["content/farbwelten/rot.md#L10", "js/data/farbwelten.js"]
}
```

Zeile in der lesbaren Fassung (`content-catalog.md`):

| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CNT-SUB-001 | Farbwelt Rot | `#farbwelten/rot` | `content/farbwelten/rot.md` · `h1` · L10 | `content/farbwelten/rot.md#L10` | 2026-11-03 | final | must | `writer` | Aufruf #farbwelten/rot zeigt H1 Rot … |

---

## 8. Medien-Katalog (`media-catalog.csv`)

CSV mit Semikolon-freier Kommasyntax, Kopfzeile **exakt** in dieser Reihenfolge. Der Prüfer
verwirft jede andere Kopfzeile (`MEDIA_HEADER`).

| # | Spalte | P | Regel |
| --- | --- | --- | --- |
| 1 | `id` | P | `MED-NNNN`, vierstellig, eindeutig |
| 2 | `path` | P | Repo-relativer Pfad, muss existieren (`SOURCE_NOT_FOUND`) |
| 3 | `used_on` | P | Wo die Datei erscheint: Route(n) oder Seitenname. Mehrere durch `;` |
| 4 | `width_px` | P | Pixelbreite als Ganzzahl; bei Vektor- und Schriftformaten `n/a` |
| 5 | `height_px` | P | wie `width_px`. Bei Rasterformaten Pflicht (`DIMENSION_MISSING`) |
| 6 | `format` | P | Endung in Kleinschreibung (`jpg`, `webp`, `avif`, `svg`, `ttf`, …) |
| 7 | `bytes` | P | Dateigröße; wird gegen die Datei geprüft (`BYTES_MISMATCH`) |
| 8 | `alt_text` | P | Alternativtext, wortgleich wie im HTML. Bei dekorativen Dateien `dekorativ` oder `n/a (Grund)` |
| 9 | `caption` | O | Bildunterschrift, falls vorhanden |
| 10 | `credit` | P | Urheber/Nachweis. Bei Eigenproduktion `Esoterik-Welt (Projekt)` |
| 11 | `license` | P | Lizenz mit Quelle, z. B. `SIL Open Font License 1.1 (assets/fonts/Fraunces-OFL.txt)` |
| 12 | `license_status` | P | `geklaert`, `ungeklaert`, `nicht_erforderlich`. `ungeklaert` erzeugt eine Warnung (`LICENSE_OPEN`) |
| 13 | `sha256` | P | 64 Hexzeichen; wird gegen die Datei geprüft (`SHA256_MISMATCH`) |
| 14 | `status` | P | `final`, `entwurf`, `offen`, `veraltet` |
| 15 | `release_relevance` | P | `must`, `should`, `none` |
| 16 | `delivery` | P | `shipped`, `source-only`, `excluded` |

Regeln:

1. **Eine Zeile je Datei.** 644 Dateien unter `assets/` ergeben 644 Zeilen. Verzeichnisse
   werden nicht zusammengefasst; die Tarot-Decks sind 476 Einzelzeilen.
2. `sha256` und `bytes` werden **berechnet**, nicht geschätzt. Der Prüfer vergleicht beide
   mit der Datei; eine Zeile, die nicht passt, ist ein Fehler, keine Warnung.
3. `license_status: ungeklaert` ist zulässig, aber sichtbar. Ein `must`-Medium mit
   ungeklärter Lizenz ist ein Gate-Punkt.
4. `alt_text` ist Pflicht, auch bei dekorativen Dateien — dort mit `dekorativ` und Grund.
   Ein leerer Alt-Text ist ein Befund, keine Auslassung.
5. Felder mit Komma, Anführungszeichen oder Zeilenumbruch werden nach RFC 4180 in
   Anführungszeichen gesetzt; `"` wird verdoppelt. Der Prüfer parst das korrekt.

Beispielzeile (nur der `sha256`-Wert ist auf acht Zeichen gekürzt; alle 16 Spalten sind da):

```csv
id,path,used_on,width_px,height_px,format,bytes,alt_text,caption,credit,license,license_status,sha256,status,release_relevance,delivery
MED-0001,assets/favicon.svg,alle Seiten (Favicon),n/a,n/a,svg,250,n/a (Favicon),,Esoterik-Welt (Projekt),MIT (Projektlizenz README),geklaert,61fd9f6a…,final,must,shipped
```

---

## 9. Funktions-Katalog (`funktionen-katalog.md`)

Der Funktions-Katalog beschreibt **Verhalten**, nicht Gestaltung und nicht Text. Er ist die
Brücke zwischen Design-Katalog (wie sieht es aus) und Inhalts-Katalog (was steht da) und
beantwortet: was kann der Besucher tun, und wie ist es geprüft.

### 9.1 Format

Markdown mit einer Tabelle je Bereich. Bereiche: `GLO` (global), `TAR` (Tarot), `KRY`
(Kristalle), `MON` (Mondphasen), `AST` (Astrologie), `FRQ` (Frequenzen), `RUN` (Runen),
`PEN` (Pendeln/Radiästhesie), `FBW` (Farbwelten), `BLG` (Wissen/Blog).

Spalten, in dieser Reihenfolge:

| Spalte | Regel |
| --- | --- |
| `ID` | `FUN-<BEREICH>-<NNN>` |
| `Funktion` | Was der Besucher tun kann, im Infinitiv („Tageskarte ziehen") |
| `Auslöser` | Route und Bedienelement, das die Funktion öffnet |
| `Quelle` | Modul und Funktion, `js/modules/<datei>.js`, mit Zeilenbereich |
| `Zustände` | Relevante Zustände: leer, Lade, Fehler, Ergebnis, gespeichert |
| `Prüfkriterium` | Prüfbares Ergebnis, wie §5.11 |
| `Status` | wie §5.8 |
| `Release` | wie §5.9 |
| `Owner` | wie §5.4 |
| `Nachweis` | Testpfad aus `tests/` oder `cmd:`-Befehl |

### 9.2 Umfang

Erfasst wird jede Funktion, die

1. ein eigenes Bedienelement hat **oder** eine eigene Route ansteuert, **und**
2. im ausgelieferten Code implementiert ist (`js/modules/`, `js/main.js`).

Nicht erfasst werden interne Hilfsfunktionen ohne sichtbare Wirkung. Drei Bereiche werden
lazy geladen (`frequenzen`, `pendeln`, `farbwelten` über eigene Loader in `js/main.js`
ab Zeile 10–12); ihre Funktionen sind trotzdem vollständig zu erfassen, weil der Ladepfad
Teil des Verhaltens ist (erster Aufruf lädt nach, Fehlerfall zeigt eine Bereichsmeldung).

**Mindestumfang je Bereich** (die Karte ergänzt, was sie im Code findet, und begründet
Lücken):

| Bereich | Belegte Funktionselemente |
| --- | --- |
| `GLO` | Hash-Routing mit unbekanntem Fragment, Sprunglink, Navigationsumschalter, Skip-Ziel `#main`, Offline-Ausgabe `Lokal.html` |
| `TAR` | Kartenübersicht, Tageskarte, Legung, Deckauswahl (`nachtatelier-v1`, `gartenbrevier-v2`), Detaildialog |
| `KRY` | Filter nach Chakra und Farbe, Detaildialog, Favoriten |
| `MON` | Aktuelle Phase mit Beleuchtungsgrad, Zeitachse, Monatskalender, iCal-Export |
| `AST` | Nachschlagen von Zeichen, Faktoren, Häusern, Aspekten; Suche; Lernpfad; Glossar; FAQ |
| `FRQ` | Bibliothek, Frequenzlabor, Visualisierung, Meditation, Presets, Quellenansicht |
| `RUN` | Einzelrune, 3-Runen-Wurf, Wurf-Historie |
| `PEN` | Radiästhesie-Übersicht, Pendel-Simulator, Pendeltafel-Studio, Journal, Experiment-Labor, Glossar, Suche |
| `FBW` | Farbwelt-Explorer, 12 Farbseiten, 3 Themenseiten, Chakren, Lichtfrequenzen |
| `BLG` | Artikelliste, Artikelansicht, Filter/Suche |

### 9.3 Beispielzeile

| ID | Funktion | Auslöser | Quelle | Zustände | Prüfkriterium | Status | Release | Owner | Nachweis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUN-PEN-002 | Pendeltafel-Studio öffnen | `#pendeln/radiasthesie` → Schaltfläche „Pendeltafel" | `js/modules/pendeltafel-studio.js` | Lade, Ergebnis, Fehler | Aufruf öffnet die Tafel innerhalb des Bereichs; ein zweiter Aufruf verwendet die geladene Instanz statt neu zu laden | final | must | `design_web_layout` | `tests/pendeltafel-studio.mjs` |

---

## 10. Prüfverfahren

### 10.1 Werkzeuge

```bash
# Struktur und Inhalte der echten Kataloge prüfen
node scripts/migration-baseline/validate-catalogs.cjs

# Beispiele prüfen (ändern nie den Katalog)
node scripts/migration-baseline/validate-catalogs.cjs --examples

# ohne Dateisystemprüfung (z. B. für Entwürfe gegen einen anderen Stand)
node scripts/migration-baseline/validate-catalogs.cjs --no-fs

# maschinenlesbar
node scripts/migration-baseline/validate-catalogs.cjs --json

# fehlende Dateien als Fehler statt Hinweis
node scripts/migration-baseline/validate-catalogs.cjs --strict

# lesbare Fassungen erzeugen bzw. Abweichung prüfen
node scripts/migration-baseline/render-catalogs.cjs
node scripts/migration-baseline/render-catalogs.cjs --check

# unabhaengige Gegenprobe gegen das JSON Schema (ajv, draft 2020-12)
node scripts/migration-baseline/validate-schema.cjs --examples
node scripts/migration-baseline/validate-schema.cjs            # echte Kataloge
node scripts/migration-baseline/validate-schema.cjs --negativ  # Negativfaelle

# Ist-Bestand erheben bzw. Abweichung prüfen
node scripts/migration-baseline/inventory-baseline.cjs --summary
node scripts/migration-baseline/inventory-baseline.cjs --check
```

Zwei voneinander unabhängige Prüfungen sind Absicht: `validate-catalogs.cjs` läuft ohne
Abhängigkeiten und ist die Prüfung, die immer verfügbar ist; `validate-schema.cjs` prüft
gegen `catalog.schema.json` mit einem echten JSON-Schema-Validator und belegt mit 14
Negativfällen, dass das Schema fehlerhafte Kataloge tatsächlich ablehnt. Weichen die beiden
voneinander ab, ist das ein Fehler in der Struktur, nicht im Katalog.

### 10.2 Fehlercodes

| Code | Bedeutung | Behebung |
| --- | --- | --- |
| `REQUIRED` | Pflichtfeld fehlt oder ist leer | Feld füllen |
| `ID_PATTERN` | ID entspricht nicht dem Muster | §4.3 beachten |
| `ID_TYPE_MISMATCH` | Typcode im ID-Mittelteil passt nicht zu `type` | ID oder Typ korrigieren |
| `TYPE_UNKNOWN` | Typ nicht in §6.1/§7.1 | Typ korrigieren oder Schema erweitern |
| `DUPLICATE_ID` | ID doppelt | neue Nummer vergeben |
| `ENUM` | Wert außerhalb der erlaubten Liste | §5.4, §5.8–§5.10 |
| `SOURCE_MISSING_REF` | weder `path` noch `url` | Quelle ergänzen |
| `SOURCE_PATH_FORMAT` | kein repo-relativer POSIX-Pfad | `./` und `..` entfernen |
| `SOURCE_NOT_FOUND` | Datei existiert nicht im Release-Stand | Pfad korrigieren |
| `SOURCE_LINES_FORMAT` | Zeilenangabe nicht `L<a>`/`L<a>-L<b>` | Format korrigieren |
| `STAND_FORMAT` / `STAND_FUTURE` | Datum falsch oder in der Zukunft | Datum korrigieren |
| `TOKEN_VALUE` | Token ohne `value` | Wert aus der CSS-Quelle eintragen |
| `VALUE_WITHOUT_TOKEN` | `value` bei Nicht-Token | Feld entfernen |
| `STATES_SHAPE` / `STATE_UNKNOWN` | Zustandsliste leer oder unbekannter Zustand | §6.4 |
| `USES_TOKENS_PATTERN` / `TOKEN_REF_MISSING` | ungültige oder fehlende Token-Referenz | Token-ID prüfen |
| `TEXT_REF_FORMAT` | Textreferenz nicht wohlgeformt | §7.2 |
| `ROUTE_FORMAT` | Route weder `#…` noch `*.html` mit optionalem Pfad | §7.3 |
| `CLAIM_CITATION` | `verified` ohne `citation` | Belegzitat eintragen |
| `CLAIM_REF_MISSING` / `CLAIM_REF_PATTERN` | Eintrag verweist auf unbekannte Aussage | `claims[]` ergänzen |
| `EXCLUDED_MUST` | `delivery: excluded` mit `release_relevance: must` | Widerspruch auflösen |
| `MEDIA_HEADER` | falsche CSV-Kopfzeile | §8 exakt übernehmen |
| `SHA256_FORMAT` / `SHA256_MISMATCH` | Hash fehlt oder passt nicht | neu berechnen |
| `BYTES_FORMAT` / `BYTES_MISMATCH` | Größe fehlt oder passt nicht | neu messen |
| `DIMENSION_MISSING` | Rasterbild ohne Maße | Maße eintragen |
| `ALT_TEXT` | Alt-Text fehlt | §8 Regel 4 |
| `LICENSE` | Lizenz fehlt | eintragen oder `ungeklaert` |

Wichtige **Warnungen** (Exit bleibt 0): `BLOCKER_NOT_FINAL`, `CLAIM_BLOCKER_UNBELEGT`,
`LICENSE_OPEN`, `CLAIM_ORPHAN`, `OPEN_STATUS_WITHOUT_QUESTION`, `TEXT_REF_PATH_MISMATCH`,
`VALUE_WITHOUT_TOKEN`, `CLAIM_EVIDENCE`, `ACCEPTANCE_VAGUE`.

### 10.3 Exit-Codes

| Code | Bedeutung |
| --- | --- |
| 0 | keine Fehler (Warnungen möglich) |
| 1 | mindestens ein Fehler, oder `--strict` mit fehlender Datei |
| 2 | Aufruffehler (unbekannte Option, kein Katalog gefunden) |

### 10.4 Was der Prüfer nicht prüft

Diese Lücken sind bekannt und werden **nicht** durch Vertrauen geschlossen:

1. **Zeilennummern** — `L42` wird nicht gegen den Dateiinhalt geprüft. Driftet die Datei,
   bleibt der Eintrag formal gültig. Die Karte muss Zeilen beim Anlegen einmal gegen die
   Quelle halten.
2. **`selector`-Eindeutigkeit** — ein Selektor, der ins Leere zeigt, ist nicht erkennbar.
3. **Wahrheitsgehalt von `acceptance_check`** — geprüft wird nur Länge und Zeichenvorrat.
   Ob das Kriterium die Sache trifft, entscheidet die Abnahme.
4. **Vollständigkeit** — der Prüfer erkennt, dass ein Eintrag falsch ist, nicht dass einer
   fehlt. Vollständigkeit wird über `inventory-baseline.json` und die Regeln in §6.1, §7.1
   und §8 hergestellt, nicht über den Prüfer.
5. **JSON-Schema-Konformität** — `validate-catalogs.cjs` ist eine unabhängige,
   abhängigkeitsfreie Umsetzung. `catalog.schema.json` ist die formale Fassung;
   `validate-schema.cjs` prüft dagegen mit ajv. Beide müssen übereinstimmen. Änderungen an
   einer Seite erfordern einen Lauf der anderen (Nachweis in §13).

---

## 11. Offene Entscheidungen

| ID | Frage | Warum sie offen ist | Wer entscheidet | Auslöser |
| --- | --- | --- | --- | --- |
| E-01 | Ist `docs/art-direction-nachtatelier/` (STYLEGUIDE.md, DESIGN.md, tokens.json) die normative Quelle für Palette, Typografie und Raster — oder gilt für dieses Release `css/design-system.css`? | `docs/design-tokens.md` erklärt das Paket zur normativen Quelle, „bei Abweichungen gilt das Paket, nicht dieses Dokument". Das Paket liegt aber **nur unversioniert** im Haupt-Arbeitsbaum und **nicht** im Baseline-Commit. Ein Katalog, der sich darauf beruft, beruft sich auf etwas, das im Release nicht existiert | Eigentümer | Vor Beginn des Design-Katalogs |
| E-02 | Welcher `source` gilt für Design-Tokens: `css/design-system.css` (Implementierung) oder `tokens.json` (Absicht)? | Folgt aus E-01. Der Prüfer akzeptiert nur existierende Pfade; `tokens.json` existiert im Baseline-Commit nicht | Eigentümer | Mit E-01 |
| E-03 | Werden die 12 Markdown-Artikel unter `data/articles/` veröffentlicht oder entfernt? | Sie sind abrufbar, aber nicht erreichbar (§7.5). Beides ist vertretbar, aber nicht beides gleichzeitig | Eigentümer | Vor dem nächsten Push |
| E-04 | Bleibt der Restbestand (`*.bak`, `_tarot_old.js`, `article-010.md.bak`, 33.386 Byte) öffentlich abrufbar? | GitHub Pages liefert das Repository-Wurzelverzeichnis aus. Entfernen ist eine Produktänderung, kein Katalogschritt (§3.3) | Eigentümer | Vor dem nächsten Push |
| E-05 | Wird `public/` (17 Dateien, alter Platzhalter) gelöscht? | Katalogisierung schließt ihn aus; die Dateien bleiben aber im Repository und sind über Pages abrufbar | Eigentümer | Nach Katalogabschluss |
| E-06 | Sollen die 9 bereichslokalen Umbruchbreiten (§6.3) vereinheitlicht werden? | Der Katalog dokumentiert sie nur; eine Vereinheitlichung ist eine Designänderung mit Regressionsrisiko | `design_web_layout` | Nach dem Design-Katalog |
| E-07 | Ist `data/crystals.json` (30 Steine) oder `js/data/crystals.js` (36 Steine) die maßgebliche Kristallquelle? | `CLM-002` ist deshalb unbelegt und `must` — ein Release-Blocker | `writer` | Vor dem nächsten Push |
| E-08 | Wie viele Komponenten umfasst das Designsystem wirklich? | Die 38 Klassen-Präfixe enthalten Hilfsklassen (`flex`, `mt`, `text`). Die Zählung ist eine Kurationsentscheidung, keine Messung (§6.1) | `design_web_layout` | Beim Design-Katalog |

---

## 12. Annahmen

| ID | Annahme | Prüfbar durch |
| --- | --- | --- |
| A-01 | Baseline `9f58439` = veröffentlichter Stand | Tag `baseline/rubriken-2026-11-03`, `origin/main` = `9f58439`, https://ingbms.github.io/Esoterik-Welt/ |
| A-02 | GitHub Pages liefert das Repository-Wurzelverzeichnis aus | Kommentar in `scripts/build-pages.cjs`; `sitemap.xml` verweist auf Wurzelpfade |
| A-03 | Unversionierte Dateien unter `docs/` und `evidence/` sind Herkunftshinweise, keine Freigabe | Sie fehlen im Baseline-Commit (`git ls-tree 9f58439`) |
| A-04 | Deutsch ist die einzige Sprache des Releases | `language`-Enum ist auf `de` beschränkt; `docs/frequenz-quellen.md` und alle Seiten sind deutsch |
| A-05 | Der Katalog beschreibt den Stand, nicht die Absicht | `stand` ist das Änderungsdatum des Artefakts, `source` zeigt auf den Code |
| A-06 | IDs werden in Dokumentreihenfolge der Baseline vergeben | §4.3 Regel 4 |
| A-07 | Der Funktions-Katalog ist Markdown, weil JSON hier keinen Nutzen bringt | §4.2; wenige Einträge mit viel Prosa |
| A-08 | Alle sieben `owner`-Werte aus §5.4 sind vorhandene Hermes-Profile | Geprüft am 2026-11-03: `structured_output`, `design_web_layout`, `design_critique`, `writer`, `review_approval`, `architect`, `default` — sieben von sieben im Profilordner vorhanden. Der Prüfer akzeptiert nur diese Liste |

---

## 13. Korrekturprotokoll dieser Fassung

Gegenüber dem geprüften Entwurf vom 03.11.2026 (Basis `30a2f62`) wurden bei der Erhebung
gegen die neue Baseline folgende Fehler gefunden und behoben. Sie sind hier festgehalten,
weil sie zeigen, welche Aussagen des Entwurfs nicht belastbar waren:

| Nr. | Befund | Korrektur |
| --- | --- | --- |
| K-01 | `route` erlaubte nur flache `.html`-Dateien. Die sieben Dokumente unter `radiasthesie/` waren damit **nicht katalogisierbar** | Muster in `catalog.schema.json` und `lib/catalog.cjs` erlaubt jetzt verschachtelte Pfade (§7.3) |
| K-02 | `delivery: shipped` war als „wird nach `dist/` kopiert" definiert. Pages liefert aber die Repo-Wurzel aus — `*.bak`-Dateien sind öffentlich abrufbar, ohne in `dist/` zu landen | Definition in §5.10 und in der Schema-Beschreibung korrigiert |
| K-03 | Alle Zeilenangaben der Beispiele waren gegen `30a2f62` erhoben und nach der Reparatur falsch (`--space-3` L174 → L224, `.btn` L736 → L837, `--font-body` L148 → L198, Skip-Link L63 → L64, „78 Karten" L232 → L240) | Alle Beispiele neu erhoben gegen `9f58439` |
| K-04 | `CNT-PAG-001` führte als H1 den Dokument-`<title>`. Die tatsächliche H1 lautet „Entdecke die verborgene Sprache des Universums" (L116) | Beispiel korrigiert |
| K-05 | `CNT-PAG-001` listete 8 interne Ziele; die Navigation hat 10 Einträge, davon 9 Zielrubriken — `#frequenzen` fehlte | Linkliste korrigiert |
| K-06 | §6.3 (Umbruchpunkte) und §7.5 (Markdown-Artikel) waren als offene Fragen formuliert | Beide entschieden (§6.3, §7.5) |
| K-07 | Die Behauptung „Markdown-Fassungen der Artikel 01–12" legte nahe, sie seien Quelle der gerenderten Artikel. Sie sind es nicht (§2.4) | §7.5 ersetzt die Annahme durch den gemessenen Befund |
| K-08 | Der Prüfer stürzte bei Inhaltskatalogen ab (`void byId;` → `ReferenceError`) | Behoben; Ursache war ein Tippfehler im Entwurf |
| K-09 | Die Typenliste kannte keinen Typ für `--z-*` (6 Tokens) und `--container-max`/`--header-height`/`--footer-height` (3 Tokens). Ohne eigenen Typ wären 9 der 170 Tokens nur mit einer falschen Bedeutung (z. B. als Abstand) katalogisierbar gewesen | `token-z` und `token-size` in `catalog.schema.json`, `lib/catalog.cjs`, `render-catalogs.cjs` und §6.1 ergänzt. Die Struktur-Version bleibt `1.0.0`, weil diese Fassung die erste mit echten Katalogen ist; §14.4 greift ab der Veröffentlichung des Katalogs |

### 13.1 Ausgeführte Prüfungen dieser Fassung

Erhoben und geprüft am 2026-11-03 im Arbeitsbaum auf Branch `wt/t_cbbf71e0`,
HEAD `9f584397f8cc86a261fccdfc36dfbb8999f55ea7`, Node v24.13.0.

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Handgeschriebener Prüfer, Beispiele | `node scripts/migration-baseline/validate-catalogs.cjs --examples` | 3 Dateien, **0 Fehler**, 2 Warnungen. Beide Warnungen sind beabsichtigt und dokumentiert: `BLOCKER_NOT_FINAL` (CNT-PAG-002), `CLAIM_BLOCKER_UNBELEGT` (CLM-002). Exit 0 |
| JSON-Schema-Prüfung, Beispiele | `node scripts/migration-baseline/validate-schema.cjs --examples` | 2 Dokumente OK gegen `#/$defs/designCatalog` bzw. `#/$defs/contentCatalog`. Exit 0 |
| Schema lehnt fehlerhafte Kataloge ab | `node scripts/migration-baseline/validate-schema.cjs --negativ` | **14 von 14** Negativfällen abgelehnt, 0 durchgelassen. Exit 0 |
| Ist-Bestand konsistent | `node scripts/migration-baseline/inventory-baseline.cjs --check` | OK — Datei entspricht dem Arbeitsbaum. Exit 0 |
| Echte Kataloge prüfen | `node scripts/migration-baseline/validate-catalogs.cjs` | Exit 2 mit Hinweis „nicht vorhanden — design-catalog.json, content-catalog.json, media-catalog.csv". **Erwartet:** die kanonischen Kataloge sind Aufgabe der Folgekarten |
| Lesbare Fassungen prüfen | `node scripts/migration-baseline/render-catalogs.cjs --check` | Exit 2, gleicher Grund. **Erwartet**, solange keine kanonischen Kataloge existieren |

Was damit **nicht** belegt ist: dass die Beispiele den vollständigen Bestand abdecken (sie
sind Beispiele), und dass die Scope-Zahlen für einen anderen als den Baseline-Commit gelten
(sie sind commit-gebunden).

---

## 14. Pflege und Freigabe

1. **Wer füllt was.** Design-Katalog `design_web_layout`, Inhalts-Katalog `writer`,
   Medien-Katalog `design_web_layout` mit Lizenzprüfung durch `review_approval`,
   Funktions-Katalog `design_web_layout`. Struktur und Prüfung: `structured_output`.
2. **Kein Eintrag ohne Quelle.** Ein Eintrag, dessen `source.path` nicht existiert, ist ein
   Fehler und kein Entwurf.
3. **Strukturänderungen** (neuer Typ, neues Feld, neues ID-Muster) erfordern in **einem**
   Commit: `catalog.schema.json`, `lib/catalog.cjs`, dieses Dokument, einen Prüflauf gegen
   die Beispiele und eine Zeile im Korrekturprotokoll.
4. **Versionierung.** Solange kein echter Katalog existiert, bleibt die Struktur-Version
   `1.0.0`. Sobald `design-catalog.json` und `content-catalog.json` gefüllt sind, erhöht
   jede Erweiterung der erlaubten Werte die Minor-Version, jede Einschränkung die
   Major-Version.
5. **Abnahme.** Der Katalog gilt als abgenommen, wenn `validate-catalogs.cjs`,
   `validate-schema.cjs`, `render-catalogs.cjs --check` und `inventory-baseline.cjs --check`
   fehlerfrei laufen und die Vollständigkeitsregeln aus §6.1, §7.1 und §8 nachweislich
   erfüllt sind.
6. **Ort.** Alle Ergebnisse liegen unter `docs/migration-baseline/`, alle Werkzeuge unter
   `scripts/migration-baseline/`. Ergebnisse in einem Scratch-Ordner sind keine Ergebnisse.
