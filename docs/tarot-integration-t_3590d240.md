# Tarot-Integration — Nachtatelier-Deck in allen Tarotansichten

Karte: `t_3590d240` · Profil: `coding_debug` · Stand: 2. November 2026
Scope: `C:/Users/mas/Arbeit/Esoterik-Welt` (Remote `ingbms/Esoterik-Welt`) · Basis-Commit `1f2726c`
Status: lokal implementiert, alle Gates selbst gefahren, **kein Commit/Push/Deploy** (Review-Handoff).
Unabhängiger Review: `design_critique` (angefordert über `kanban_request_review`).

## 1. Ergebnis in einem Absatz

Das freigegebene Deck liegt jetzt als Standarddeck in der Website: 78 Karten mit stabilen IDs 0–77, je
eigenem Bild in drei Webstufen, eigenen Stichwörtern, eigener Bildsprache und je einer eigenen Deutung
für aufrecht und umgekehrt. Die Galerie zeigt die Karten als 3:5-Tafeln mit Beschriftungsband (nichts wird
abgeschnitten), Suche und Filter arbeiten auf Name, Numeral und Stichwörtern, der Dialog zeigt Bild,
Bildsprache, beide Deutungen, einen Umschalter für die Orientierung und einen Zoom auf die 1200-px-Stufe.
Die Legungen nutzen die Kartenrückseite als Mischphase und behalten die tatsächlich gezogene Orientierung.
Der bekannte Generatorfehler (ID 23 hieß „1 der Stäbe“ statt „2 der Stäbe“) ist an der Wurzel behoben.

## 2. Kanonische Identitäten und Mapping

- Quelle der Identitäten: `docs/tarot-deck-nachtatelier/manifest-assets.json` (IDs, Namen, Numerale, Farben,
  Ränge, Dateien, Hashes).
- Quelle der Inhalte: `docs/tarot-deck-nachtatelier/_work/texts.py`, exportiert nach
  `docs/tarot-deck-nachtatelier/_work/texts.json` (`python _work/export_texts.py`, prüft 0–77, Pflichtfelder,
  Mindestlängen, doppelte Deutungen).
- `texts.py` führt die Karten in der Reihenfolge des Deck-Autors: 0–21 Große Arkana, dann je Farbe die zehn
  Zahlenkarten, danach die vier Hofkarten. Die Website-IDs sind farbweise fortlaufend. Das Mapping ist deshalb
  eine explizite Regel in `scripts/generate-tarot-data.cjs`:

  | Texte | Website-IDs | Bereich |
  |---|---|---|
  | 0–21 | 0–21 | Große Arkana |
  | 22–31 | 22–31 | Stäbe 1–10 |
  | 32–41 | 36–45 | Kelche 1–10 |
  | 42–51 | 50–59 | Schwerter 1–10 |
  | 52–61 | 64–73 | Münzen 1–10 |
  | 62–65 | 32–35 | Stäbe Bube–König |
  | 66–69 | 46–49 | Kelche Bube–König |
  | 70–73 | 60–63 | Schwerter Bube–König |
  | 74–77 | 74–77 | Münzen Bube–König |

  Abgesichert ist das nicht durch Vertrauen, sondern durch Prüfungen im Generator: jede Hofkarte muss ihr
  Rollenwort (Bote/Ritter/Königin/König) in der Bildsprache tragen, jede Zahlenkarte ihre Farbe benennen.
  Genau eine Ausnahme bleibt und ist inhaltlich richtig: ID 68 „5 der Münzen“ zeigt im historischen Motiv
  zwei Menschen im Schnee und **keine** Münze – der Generator meldet das als Warnung, nicht als Fehler.
- Namenskorrektur: Anzeigename wird aus `number` abgeleitet, nie aus dem nullbasierten Schleifenindex.
  Geprüft: `manifest.cards[23].name === '2 der Stäbe'`, und für jede Zahlenkarte stimmt die Zahl im Namen
  mit `number` überein.

## 3. Was in der Oberfläche geändert wurde

| Ansicht | Änderung |
|---|---|
| Galerie (`#tarotGrid`) | echte Kartenbilder statt Platzhalter, 3:5-Tafel + Beschriftungsband (Numeral · Name · Arkana), Titel als Live-Text, `alt=""` (der Button trägt das Label), Karten sind native Buttons ohne `tabindex`-Doppelung |
| Suche | neues Feld `#tarotSearch` (Name, Numeral, Arkana-Label, Stichwörter, UND-Verknüpfung mehrerer Begriffe) |
| Filter | bestehendes `#arcanaFilter` unverändert in der Funktion, jetzt mit Ergebniszeile (`aria-live`) und „Filter zurücksetzen“ |
| Leerzustand | sichtbarer Hinweis, wenn Suche/Filter nichts treffen (`#tarotEmptyState`) |
| Einzelkarte/Dialog | Bild 600 px, Kicker/Name, Numerale- und Orientierungsbadge, Umschalter „Umgekehrt/Aufrecht deuten“, Stichwörter, Bildsprache, beide Deutungen (aktive hervorgehoben), ausführliche Deutung für den Mond, Disclaimer |
| Zoom | Klick auf das Bild lädt die 1200-px-Stufe und stellt den Dialog auf volle Breite; zweiter Klick zurück. `aria-pressed`, Hinweistext wechselt |
| Legungen | Mischphase zeigt die Kartenrückseite (`300/Ruecken.jpg`), danach Karte 1–3 mit Name und der zur Orientierung passenden Deutung; der Dialog übernimmt exakt die gezogene Orientierung (vorher wurde sie zufällig neu gewürfelt) |
| Verlauf | heißt jetzt „Ziehungsverlauf“, wird nur noch bei echten Ziehungen gefüllt, Einträge werden über die stabile ID aufgelöst (alte Namen werden dadurch korrekt angezeigt) |
| Ladezustand | Karte ist `is-loading`, bis das Bild wirklich dekodiert ist; ein fehlendes Bild wird als „Bild nicht verfügbar“ benannt statt als leerer Rahmen |
| Lazy loading | `data-src` + `IntersectionObserver` (400 px Vorlauf), Fallback ohne Observer: sofort laden |
| Seitenfuß der Sektion | Hinweis „Symbolische, traditionelle Deutung … keine Vorhersage und kein Heil- oder Wirkversprechen“ |

Bewusste Entscheidung: Die umgekehrte Karte wird **nicht** um 180° gedreht. Das Motiv trägt Titel und
Numeral als Live-Text im Bild; eine Drehung würde die Beschriftung unlesbar machen. Die Orientierung wird
stattdessen über Badge, Umschalter und die aktive Deutung eindeutig benannt.

## 4. Deck-Architektur (Vorbereitung für V2, ohne V2 anzubieten)

- `js/data/tarot-decks.js` ist eine Registry, geschlüsselt nach Deck-ID. Sie enthält genau ein Deck
  (`nachtatelier-v1`) mit Label, Version, 3:5-Maßen, Basispfad und den drei Webstufen. Ein zweites Deck
  wird **nicht** registriert, nicht angeboten und nicht angedeutet.
- Bilder werden ausschließlich über `cardAssetPath(deck, id, level)` / `backAssetPath(deck, level)` gebildet;
  Pfade sind relativ (`assets/tarot/nachtatelier-v1/…`), damit sie über `<base href="/Esoterik-Welt/">` im
  HTTP-Betrieb und über das Dokumentverzeichnis im `file://`-Betrieb identisch funktionieren.
- Gespeicherte Deck-ID: `localStorage['esoterik_tarot_deck']`. Ein unbekannter oder fehlender Wert fällt auf
  `nachtatelier-v1` zurück **und wird auf v1 zurückgeschrieben** (kein stiller Dauerzustand). Getestet mit
  `nachtatelier-v2-preview`.
- Kartenfavoriten/Verlauf: Die IDs bleiben stabil, gespeicherte Einträge werden über `id` aufgelöst. Ein alter
  Eintrag mit dem fehlerhaften Namen „1 der Stäbe“ (ID 23) zeigt danach „2 der Stäbe“ – ohne Datenverlust.

## 5. Payload (gemessen, nicht geschätzt)

Gemessen mit `performance.getEntriesByType('resource')` im Chromium der Testsuite, Cache leer, pro Viewport
ein frischer Kontext (`evidence/t_3590d240/probe-http.json`):

| Viewport | Karten | Thumbnails im Erstaufbau | Bytes Erstaufbau | 600-px | 1200-px |
|---|---|---|---|---|---|
| 1440 × 900 | 78 | 12 | 326 448 | 0 | 0 |
| 768 × 900 | 78 | 6 | 166 306 | 0 | 0 |
| 375 × 900 | 78 | 2 | 51 238 | 0 | 0 |

Nach allen Interaktionen (3 Dialoge + 1 Zoom) im selben Lauf: 1440 → 76 × 300er (1,88 MB) + 3 × 600er
(260 kB) + 1 × 1200er (317 kB). Die 1200-px-Stufe wird also erst durch den Zoom geladen; die Testsuite
prüft das explizit (`payload: first view loads no 1200 px master, zoom does`).

Bestand: `assets/tarot/nachtatelier-v1/` = 237 JPEG (79 je Stufe inkl. Rückseite) + `manifest.json`,
zusammen 35 033 700 Byte. Der komplette Build (`dist/Esoterik-Welt`) wiegt 37 MB. Die 966 MB
Produktionsrohdaten des Decks (`karten/`, `layers/`, `motive/`, `editierbar/`, `sources/`, `Vorschauen/`)
bleiben unverändert außerhalb des Website-Ordners und werden nicht mitgeliefert.

## 6. Tests und Gates (alle selbst gefahren)

| Gate | Ergebnis |
|---|---|
| `npm run lint` | exit 0, 0 Warnungen |
| `npm run format:check` | alle Dateien entsprechen Prettier |
| `npm test` (Jest) | 2 / 2 |
| `npm run test:pages` | 6 / 6 |
| `npm run test:offline` | 2 / 2 |
| `npm run test:local` | 12 bestanden / 0 fehlgeschlagen / 2 vorbestehende Skips |
| `npm run test:tarot` (neu) | 10 / 10 |
| `npm run verify:build` | 30 Seiten/Viewports, 0 Fehler |
| `npx playwright test` | 56 / 56 |

Die neue Suite `tests/tarot-deck.cjs` (in `package.json` als `test:tarot`, in der CI als eigener Schritt im
Job `unit-test`) prüft:

1. Manifest: 78 IDs 0–77, 22 Große Arkana, 4 × 14, Numerale 1–14 je Farbe, kanonische Namen, ID 23 = „2 der Stäbe“.
2. Jede deklarierte Datei existiert mit deklariertem Byte-Stand, SHA256 und Pixelmaß (300 × 500, 600 × 1000, 1200 × 2000), Rückseite in allen drei Stufen.
3. Inhalte: 78 individuelle Stichwortlisten (≥ 3), 78 individuelle Bildsprachen, 78 individuelle aufrechte und 78 individuelle umgekehrte Deutungen, Disclaimer, Mond-Tiefentext, kein generischer Farbsatz.
4. HTTP: alle 78 Karten werden per echtem Klick geöffnet und einzeln gegen die Daten geprüft (Name, Numerale, Keywords, beide Deutungen, Bildsprache, 600-px-Asset, Alttext, kein Innenüberlauf), 0 Konsolenfehler/fehlgeschlagene Requests.
5. `file://`: dieselben 78 Karten offline aus `Lokal.html`, plus Dekodierprobe aller 234 Kartenbilder (78 × 3 Stufen) und 0 Netzwerkanfragen.
6. Suche/Filter: 22 / 56 / 14 / 14 / 14 / 14 / 78, Treffer über Namen und Stichwort, Leerzustand, Zurücksetzen.
7. Legungen: Rückseite in der Mischphase, vier Runden 3-Karten-Legung + eine Einzelziehung, Dialog-orientierung == gezogene Orientierung, Verlaufseintrag.
8. Tastatur/Reduzierte Bewegung: Enter öffnet, Fokus liegt im Dialog, Escape gibt den Fokus an die auslösende Karte zurück, Ziehen ohne Wartezeit.
9. Deck-ID-Fallback und alter Verlaufseintrag (siehe §4).
10. Payload (siehe §5).

Zusätzlich visuell geprüft (Bildsicht, `evidence/t_3590d240/*.png`): Galerie, Dialog und Zoom bei 375, 768,
1440 sowie die `file://`-Ausgabe. Ein früherer Versuch, den leeren Block zwischen Suche und Filter auf 375 px
zu beheben, hat nur die Basis des Kindes (`.tarot-search`) überschrieben, nicht die der Zeile
(`.tarot-filter-row`) — der Block blieb 360 px hoch, und die Behauptung „korrigiert“ war falsch
(Review-Runde 1, Befund B1). Erst Runde 2 behebt ihn messbar; siehe §6a.

## 6a. Review-Runde 1 → 2 (Korrekturen und Nachmessung)

Review-Runde 1 (`docs/review-t_3590d240-round1.md`) hat zwei Befunde ergeben; beide sind an der Ursache
behoben und in HTTP und `file://` nachgemessen (`evidence/t_3590d240-round2/`, `probe.json`,
`probe-file.json`, `probe-a11y.json`).

| Befund | Ursache | Änderung | Messung nachher |
|---|---|---|---|
| B1: Leerraum zwischen Suche und Filter ≤ 480 px, erste Karte unter dem Fold | `.tarot-filter-row{flex:1 1 360px}` wird in der Column-Richtung von `.tarot-controls` zu einer 360-px-**Höhe**; `.tarot-search{flex:1 1 auto}` wuchs auf 298 px | `css/main.css` @media ≤480: `.tarot-filter-row{flex:0 0 auto}`, `.tarot-search{flex:0 0 auto}` | 320/375/414/480 px: `.tarot-controls` 480 → **232 px**, Feldhöhe 298 → **50 px**, Abstand Feld→Select 260 → **12 px**, Select-Oberkante 375 px: 832 → **584**, erste Karte 966 → **718** (im Erstaufbau sichtbar); 481 px unverändert (110 px, Abstand −50 px = Zeile läuft weiter) |
| B2: „Vergrößern“ ändert die Anzeigegröße nicht (375 px Δ 0) | `.modal.is-zoomed .tarot-detail-figure{width:min(100%,…)}`: `100%` (277 px) war schon die kleinere Bedingung; der Dialog ist dort ohnehin voll breit | Unter 900 px wird der Zoom zur **echten Vollbildansicht**: `.modal.is-zoomed` verlässt den Flex-Backdrop (`position:fixed; inset:0`), Text und Bildunterschrift werden ausgeblendet, das Bild nutzt `min(100vw, (100dvh − 72px) × 0,6)`; über 900 px wächst der Rahmen auf `(100dvh − 210px) × 0,6` | 375 px: 275 → **375 px (1,36 ×)**, Panel 327×764 → **375×812**; 320 px 220 → 298 (1,35 ×), 414 px 314 → 414 (1,32 ×), 768 px 298 → **437 (1,47 ×)**, 1440 px 298 → **412 (1,38 ×, vorher 400)**. Die 1200er-Stufe wird weiterhin **nur** durch diesen Klick geladen (0 B vorher, 317 055 B nachher) |

Zusätzlich in Runde 2 gehärtet (verhindert Folgefehler, keine neue Zusage):

- Ein Neu-Rendern des Dialogs (Aufrecht-/Umgekehrt-Umschalter) setzt die Zoom-Ansicht zurück, statt ein
  `is-zoomed`-Panel mit 600-px-Bild stehen zu lassen.
- `aria-label` des Zoom-Knopfs wechselt mit dem Zustand („Karte vergrößern: …“ ↔ „Karte verkleinern: …“);
  Runde 1 hatte beobachtet, dass es konstant blieb.
- Tastatur im Vollbild (375 px): Fokus bleibt im Dialog, Zyklus Schließen (44×44) ↔ Kartenfläche (375×625),
  `Shift+Tab` ebenfalls innerhalb; Escape schließt. Kontraste: Dialogtitel/Schließen 10,07 : 1,
  Zoom-Hinweis 15,36 : 1.

Grenze der Vollbildansicht: Sie zeigt die Karte so groß, wie ein 3:5-Motiv ohne Beschnitt in den Viewport
passt (`min(100vw, (100dvh − 72px) × 0,6)`). Auf kurzen Fenstern (z. B. 480×812, 1024×768) ist damit die
Höhe die bindende Grenze; dort fällt der Zuwachs kleiner aus (1,17 × bzw. 1,12 ×), bleibt aber positiv und
ohne Beschnitt.

### Gates nach Runde 2 (alle erneut selbst gefahren)

`npm run lint` exit 0 · `npm run format:check` alle Dateien konform · Jest 2/2 · `test:tarot` 10/10 ·
`test:pages` 6/6 · `test:offline` 2/2 · `test:local` 12 bestanden / 0 fehlgeschlagen / 2 vorbestehende Skips ·
`verify:build` 30/30 · `npx playwright test` 56/56. Kein Commit, kein Push, kein Deploy.

## 7. Grenzen und offene Punkte

- **Kein Deploy, kein Commit, kein Push.** Veröffentlichung gehört auf die Release-Karte.
- **Druckfreigabe bleibt offen** (sRGB-Webmaster, kein CMYK/ICC-Proof, kein Beschnitt) — unverändert aus dem Deck-Handoff.
- Nur **Chromium** geprüft; keine Crossbrowser-, Screenreader- oder 200-%-Textprüfung. Kein axe/Lighthouse-Lauf.
- Die Bildqualität der 300-px-Stufe ist eine Eigenschaft des Deck-Stils (feine Fragmente), keine Fehlfunktion.
- `js/data/tarot.js` ist **generiert**. Inhaltliche Korrekturen gehören in `texts.py` → `export_texts.py` → `generate-tarot-data.cjs`, nicht in die JS-Datei.
- Der 966-MB-Produktionsordner `docs/tarot-deck-nachtatelier/` liegt weiterhin ungetrackt im Arbeitsbaum; für die Website gebraucht wird nur `assets/tarot/nachtatelier-v1/`.
- **V2** ist weder registriert noch angeboten; das bleibt das menschliche Gate `t_76bc5bda`.
- Mond-/Astrologieinhalte außerhalb der Karte 18 sind **nicht** Teil dieser Karte (die bekannten Mond-Defekte liegen in `t_f7b2af0a`).

## 8. Dateien

Neu:

- `assets/tarot/nachtatelier-v1/{300,600,1200}/*.jpg` + `manifest.json` (byte-identisch aus dem Deck, 237 Dateien)
- `js/data/tarot-decks.js` — Deck-Registry, Fallback, Pfadbildung
- `tests/tarot-deck.cjs` — die Suite aus §6
- `scripts/sync-tarot-assets.cjs` — kopiert die Webstufen, prüft Hashes/Maße, schreibt das Website-Manifest
- `scripts/generate-tarot-data.cjs` — erzeugt `js/data/tarot.js` aus Deck-Manifest + `texts.json` (mit `--check`)
- `docs/tarot-deck-nachtatelier/_work/export_texts.py` + `texts.json` — Export der Karteninhalte
- `evidence/t_3590d240/` — Probes, Screenshots, `evidence.json`
- `evidence/t_3590d240-round2/` — Nachmessung der Review-Runde 1: `probe.cjs` (HTTP, 320/375/414/480/481 px
  und Zoom bei 320–1440), `probe-file.cjs` (`file://`, `Lokal.html`), `probe-a11y.cjs` (Fokusfalle, Kontraste),
  `probe.json`, `probe-file.json`, `probe-a11y.json`, Screenshots `gallery-top-*.png`, `gallery-controls-*.png`,
  `zoom-*.png`, `file-zoom-375.png`
- `docs/tarot-integration-t_3590d240-round2.md` — Bericht dieser Runde

Geändert (Runde 2, zusätzlich zu den Einträgen der Runde 1):

- `css/main.css` — `@media (max-width:480px)`: `flex:0 0 auto` für `.tarot-filter-row` und `.tarot-search`;
  `@media (max-width:900px)`: Vollbild-Zoom; Zoom-Rahmen über 900 px auf `(100dvh − 210px) × 0,6`
- `js/modules/tarot.js` — Zoom-Zustand wird beim Neu-Rendern zurückgesetzt, `aria-label` folgt dem Zustand

Geändert:

- `js/data/tarot.js` — jetzt generiert: 78 Einträge mit `symbolism`, `meaning_up`, `meaning_rev`, `deep` (Mond); die sechs generischen Farbsätze sind weg
- `js/modules/tarot.js` — Galerie, Suche, Dialog, Zoom, Legungen, Verlauf, Lade-/Fehlerzustand
- `index.html` — Tarot-Sektion (Intro, Suche, Statuszeile, Leerzustand, Legungshinweis, Disclaimer)
- `css/main.css` — Tarot-Block (Tafel, Beschriftungsband, Suche/Status, Legungen, Dialog, Zoom, Verlauf) und die beiden Umbruchkorrekturen
- `tests/local-entry.cjs` — Fokus-Test an die neue Modulform angepasst (mehrzeilige Imports, Deck-Helfer, `querySelector`-Stub); die geprüfte Zusicherung ist unverändert
- `package.json` (`test:tarot`), `.github/workflows/ci.yml` (CI-Schritt)

**Fremde Arbeit bleibt unangetastet.** Die beiden im Eltern-Handoff geschützten Dateien sind byte-gleich:
`docs/ci-cd-pipeline.md` = `673cce50…7dbbb7d3`, `js/modules/_tarot_old.js` = `91f2425b…50935d1`.
Der `git diff` gegen `1f2726c` enthält weiterhin die uncommitteten Änderungen früherer Karten
(Stilpaket `t_280f3753`, Deck `t_374f1434`, Reparaturkarten). Diese Karte hat ausschließlich die oben
genannten Stellen geändert; es wurden keine fremden Dateien überschrieben oder neu formatiert.

## 9. Reproduktion

```bash
node scripts/sync-tarot-assets.cjs        # Assets + Website-Manifest (Hash-geprüft)
python docs/tarot-deck-nachtatelier/_work/export_texts.py
node scripts/generate-tarot-data.cjs      # js/data/tarot.js (Prettier-formatiert)
npm run build                             # dist/Esoterik-Welt + Lokal.html
npm run test:tarot                        # 10 Prüfungen, HTTP + file://
```

Hashes aller geänderten Dateien und die Messwerte stehen in `evidence/t_3590d240/evidence.json`.
