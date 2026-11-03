# Deck V2 „Gartenbrevier" als optionale Auswahl — Integration (t_937ab9cf)

Stand: 02.11.2026 · Karte: `t_937ab9cf` · Workspace: `C:/Users/mas/Arbeit/Esoterik-Welt`
Status: **lokal implementiert, selbst verifiziert, zur unabhängigen Prüfung** — kein Commit, kein Push,
kein Deploy aus dieser Karte.

## 1. Freigabegrundlage

| Voraussetzung | Beleg | Stand |
|---|---|---|
| Menschliche Freigabe des Mustersatzes und der Stilfamilie | `evidence/t_76bc5bda/FREIGABE-2026-11-02.md` (02.11.2026, 00:26 CET) | liegt vor |
| Vollständiges V2-Paket (78 Karten, 606 Dateien) | `docs/tarot-deck-v2/HANDOFF.md`, `manifest.json` (SHA `4ec12733…`, 419.867.280 B) | unverändert |
| Unabhängiger Review des Pakets (Linse Ausführung, Runde 2) | Karte `t_cd00e0a8`, `review_outcome: approved` | bestanden |
| Veröffentlichter V1-Stand als Basis | Commit `6a3eee1` (Pages-Live 02.11.2026 03:52:50 UTC) | unverändert |

Die Karte war damit ausführbar. Eine separate menschliche Sichtfreigabe **des vollen Decks** ist auf dem
Board nicht dokumentiert; die Karte verlangt die Musterfreigabe, und die liegt vor. Diesen Punkt führt der
Review als Prüffrage mit (siehe §7).

## 2. Baseline vor Beginn

`evidence/t_937ab9cf/baseline.txt` (02.11.2026 05:05:18): HEAD `6a3eee1`, Branch `main`, 47 unverfolgte
Einträge, keine veränderten verfolgten Dateien. SHA-256 unter anderem:

| Datei | SHA-256 (vorher) |
|---|---|
| `index.html` | `f00d53e9…` |
| `js/modules/tarot.js` | `8bd4942c…` |
| `js/data/tarot-decks.js` | `779b1ab5…` |
| `js/data/tarot.js` | `99f6d262…` (unverändert geblieben) |
| `css/main.css` | `8a7f3c29…` |
| `assets/tarot/nachtatelier-v1/manifest.json` | `e3d0548a…` (unverändert geblieben) |

**Fremde Parallelarbeit:** Die QA-Karte `t_67334ff1` arbeitet gleichzeitig im selben Arbeitsbaum
(`js/modules/moon.js`, `js/modules/tarot.js`, `css/main.css`, `package.json`, `ci.yml`). Beide Sätze
Änderungen liegen unverändert nebeneinander; es wurde nichts überschrieben. Die Kollisionsdateien sind in
§7 benannt und auf dem Board als `hotspot:` markiert.

## 3. Umfang der Integration

### 3.1 Deck-Registry (`js/data/tarot-decks.js`)

- Zwei Decks: `nachtatelier-v1` (unverändert, `DEFAULT_DECK_ID`) und `gartenbrevier-v2`.
- Neue Felder je Deck: `meta` (Picker-Zusatzzeile), `badge` (Standard/Optional), `previewCardId`.
- Neue Helfer: `listDecks()` (Registry-Reihenfolge = Picker-Reihenfolge), `deckPreviewPath(deck)`.
- Unbekannte gespeicherte IDs fallen weiterhin auf `nachtatelier-v1` zurück und heilen den Speicherwert.
- Keine Dateipfade außerhalb der Registry; beide Decks nutzen dasselbe Pfadschema
  `<basePath><level>/NN.jpg` und `Ruecken.jpg`.

### 3.2 Deckwähler (`js/modules/tarot.js`, `index.html`, `css/main.css`)

- Aus der Registry erzeugtes `<fieldset><legend>Deck wählen</legend>` mit zwei nativen Radios; jedes Radio
  ist mit seinem sichtbaren Label verbunden (Deckname, Badge, „78 Karten · 3:5"/„Farbvariante …") und zeigt
  eine Miniaturvorschau (Karte 00 des jeweiligen Decks, 300 px, `loading="lazy"`).
- Tastatur: native Radiogruppe (Pfeiltasten wechseln, ein Tabstopp), `:focus-within`-Ring 2 px, zusätzlich
  Goldrahmen am gewählten Feld.
- Statusmeldung `#tarotDeckStatus` (`role="status"`, `aria-live="polite"`): „Deck gewechselt: …".
- Der Wähler erscheint nur, wenn mehr als ein Deck registriert ist (`listDecks().length > 1`), sonst bleibt
  der Container `hidden`.
- `setDeck(deckId)` ist die einzige Umschaltstelle: speichert die Wahl (`esoterik_tarot_deck`), rendert die
  Galerie neu, aktualisiert eine bestehende Legung (gleiche IDs, gleiche Orientierung) und – falls offen –
  den Dialog (gleiche Karte, gleiche Orientierung, Zoom-Zustand und Fokus bleiben erhalten).
- Bildpfade kommen ausschließlich aus `cardAssetPath`/`backAssetPath`; der Alt-Text und die Bildunterschrift
  nennen das aktive Deck statt fest „Nachtatelier".
- Lazy Loading unverändert: nur sichtbare Karten werden nachgeladen, 600/1200 px erst im Dialog/Zoom.
- `renderGrid()` baut die Galerie nur noch neu, wenn sich Deck, Filter, Suche oder Trefferzahl ändern. Der
  Aufruf `onShow()` direkt nach `init()` hatte die 78 Buttons bisher ein zweites Mal erzeugt und dabei den
  Tastaturfokus verworfen; der Schlüssel `deck|filter|suche|anzahl` verhindert diesen Doppelaufbau. Für den
  Nutzer ändert sich nichts außer einem stabileren Fokus.

### 3.3 Texte

- Einleitung des Tarot-Bereichs nennt beide Decks (Standard/Variante).
- Fußnote nennt die Herkunft beider Decks getrennt: Nachtatelier = eigene Bühnen/Mineraltexturen nach
  gemeinfreien historischen Fragmenten von Pamela Colman Smith (Textur Didier Descouens, CC BY-SA 4.0);
  Gartenbrevier = eigener, codegenerierter Vektor ohne fremde Bildvorlagen. Karten-IDs und Deutungstexte
  sind in beiden Decks identisch. Grundlage: `docs/tarot-deck-nachtatelier/QUELLEN-RECHTS-MANIFEST.md`,
  `docs/tarot-deck-v2/QUELLEN-RECHTS-MANIFEST.md`.
- Druckfreigabe bleibt ausdrücklich unberührt.

## 4. Bilder im Site-Baum (`assets/tarot/gartenbrevier-v2/`)

Erzeugt mit `scripts/sync-gartenbrevier-v2-assets.py` (idempotent, `--check` prüft ohne zu schreiben):

| Ebene | Quelle | Verfahren |
|---|---|---|
| `300/` | `docs/tarot-deck-v2/web/karten-300` | byte-identische Kopie, SHA gegen das Paketmanifest geprüft |
| `600/` | `docs/tarot-deck-v2/web/karten-600` | byte-identische Kopie, SHA gegen das Paketmanifest geprüft |
| `1200/` | `docs/tarot-deck-v2/karten/NN.png` (1200 × 2000, freigegebene Master) | JPEG q84, progressiv, optimize — dieselben Encoder-Parameter wie die freigegebenen 300/600-Derivate |

Ergebnis (gemessen, `assets/tarot/gartenbrevier-v2/manifest.json`, SHA `fbdf855a…`):

- 79 Dateien je Ebene (78 Karten + `Ruecken.jpg`), 237 Dateien, **23.077.582 Bytes**
  (300: 1,8 MB · 600: 5,1 MB · 1200: 16 MB).
- 78 IDs 0–77, 22 Große Arkana, je 14 Karten pro Farbe, alle 3:5.
- Wiederholungslauf: `copied 0 · unchanged 237 · generated 0`, identischer Manifest-Hash (deterministisch).
- V1-Baum unangetastet (`assets/tarot/nachtatelier-v1/manifest.json` SHA unverändert `e3d0548a…`).

## 5. Prüfungen (alle real ausgeführt am 02.11.2026)

| Prüfung | Ergebnis |
|---|---|
| `npm run test:tarot:decks` (neu, `tests/tarot-decks-v2.cjs`) | **12/12** |
| `npm run test:tarot` (bestehend, 78 Karten/HTTP/file://) | **11/11** |
| `npm test` (Jest) | **2/2** |
| `npm run test:pages` | **6/6** |
| `npm run test:astrologie` | **21/21** |
| `npm run test:moon` | **14/14** |
| `npm run test:offline` | **2/2** |
| `npm run test:e2e` (Playwright) | **74/74** |
| `npm run verify:build` | **33 Seiten/Viewports, 0 Fehler** |
| `npm run lint` | exit 0 |
| `npm run format:check` | alle Dateien formatiert |

Reproduzierbar: `bash evidence/t_937ab9cf/run-gates.sh` schreibt je Gate ein Log nach
`evidence/t_937ab9cf/logs/` und `gates.json`; die Zusammenfassung steht in
`evidence/t_937ab9cf/summary.json`.

Zwei Umgebungsdetails, die den Lauf betreffen (kein Codefehler):

- Der Arbeitsbaum wird parallel von `t_67334ff1` benutzt. Zwei Build-Versuche scheiterten an einem
  Windows-Dateilock auf `dist/` (`EPERM`), während dort ein fremder Build/Server lief; der dokumentierte
  Lauf ist der erfolgreiche Wiederholungslauf, und `e2e` lief über `E2E_PORT=3211`, damit der eigene
  Playwright-WebServer nicht mit dem parallel laufenden Server kollidiert.
- `tests/tarot-deck.cjs` wurde an zwei Stellen gegen bestehende Timing-Races gehärtet: die erste
  Galerie-Kachel wird über `data-src || src` geprüft (die Lazy-Promotion läuft asynchron), und die
  Fokus-Pflicht („Karte ist fokussierbar", „Fokus kehrt zur Karte zurück") wird gewartet statt an einem
  einzelnen Zeitpunkt abgelesen. Die Zusicherungen selbst sind unverändert.

Inhalt der neuen Suite (`tests/tarot-decks-v2.cjs`):

1. Registry: zwei Decks, V1 Default, gemeinsame 78 IDs, unbekannte ID → Default.
2. 156 Mappings (78 × 2) über drei Ebenen = 468 Dateien mit deklarierten Bytes, SHA-256 und 3:5-Maßen;
   zusätzlich 2 × 3 Rückenbilder.
3. Registry-Pfad ↔ Dateisystem für alle 156 Kartenpfade und beide Rücken; 156 eindeutige Pfade.
4. V1-Manifest byte-identisch zum veröffentlichten Stand.
5. Browser: Wähler sichtbar, zwei benannte Radios, beide Vorschaubilder dekodiert (300 px), V1 vorausgewählt,
   Galerie 78 × V1.
6. Tastatur: Pfeiltaste wechselt, Fokus bleibt auf dem Radio, Speicherwert gesetzt, Statusmeldung, alle 78
   Karten wechseln ihr Bild, Reload stellt die Wahl wieder her.
7. Dialog und Legung: **156 Dialog-Mappings** (jede Karte in jedem Deck mit eigenem 600-px-Bild und
   1200-px-Zoomquelle, Dateien existieren real und sind > 5 kB); Wechsel bei offenem Dialog und bei
   bestehender 3-Karten-Legung: gleiche IDs/Orientierung/Namen, nur das Bild wechselt; Deutungen identisch;
   Zoom liefert echte 1200 × 2000 px.
8. Unbekannte gespeicherte ID (`gartenbrevier-v3-preview`) → V1, Speicher geheilt, alter Verlauf bleibt.
9. Payload: erster Aufruf lädt nur V1-Thumbnails (< 78 Dateien, nur Ebene 300) plus **genau ein**
   V2-Vorschaubild (< 200 kB); kein 1200-px-Master; nach dem Wechsel nur V2-Thumbnails, kein erneutes
   Laden des alten Decks.
10. Fehlerzustand: ein abgebrochener V2-Request → genau eine Karte `is-missing` mit „Bild nicht verfügbar",
    77 Karten intakt, keine Konsolenfehler.
11. Mobil 375/768 px: Wähler sichtbar, kein Dokument- oder Komponentenoverflow, Optionen gestapelt (375) bzw.
    nebeneinander (768), Wechsel ohne Overflow.
12. `file://` (Lokal.html, offline): 312 Bilder beider Decks (300/600) dekodieren von Platte, Wechsel und
    Reload mit gespeicherter Wahl funktionieren, keine Netzwerk-Requests, keine Fehler.

Kartenfavoriten gibt es im Tarot-Bereich nicht (nur im Kristall-Katalog); deckunabhängig stabil bleiben die
Deutungen, Stichwörter, Bildsprache, Karten-IDs und der Ziehungsverlauf — im Test 7 ausdrücklich geprüft.

Zusätzliche Messungen (`evidence/t_937ab9cf/probe-a11y.json`):

- Effektive Kontraste im Wähler: Legende 16,85 : 1 · Deckname 16,85 : 1 · Badge 10,24 : 1 ·
  Zusatzzeile 11,05 : 1 · Hinweistext 11,05 : 1 (alle ≥ 4,5 : 1; kein Wert unter der Grenze).
- Accessibility-Tree: zwei Radios mit den Namen „Nachtatelier STANDARD 78 Karten · 3:5" und
  „Gartenbrevier OPTIONAL Farbvariante · 78 Karten · 3:5", Gruppe „Deck wählen".
- Fokusring 2 px sichtbar (`:focus-within`), Screenshots `shots/a11y-{375,768,1440}.png`,
  `shots/a11y-focus.png`, `shots/picker-{375,768,1440}.png`, `shots/picker-v2-{375,768,1440}.png`.

## 6. Geänderte und neue Dateien

| Datei | Änderung |
|---|---|
| `js/data/tarot-decks.js` | zweites Deck, `listDecks`, `deckPreviewPath`, `meta`/`badge`/`previewCardId` |
| `js/modules/tarot.js` | Deckwähler, `setDeck`/`syncDeckPicker`/`announceDeck`, Dialog-Rerender, Legungs-Rerender, deckabhängiger Alt-Text/Bildunterschrift |
| `index.html` | Container `#tarotDeckPicker`, Einleitung und Deck-Fußnote |
| `css/main.css` | Block „Deck picker" (nur angehängt, fremder Block unverändert) |
| `tests/tarot-decks-v2.cjs` | neue Suite (12 Tests) |
| `tests/tarot-deck.cjs` | zwei Timing-Races der bestehenden Suite gehärtet (keine Zusicherung abgeschwächt) |
| `scripts/sync-gartenbrevier-v2-assets.py` | Asset-Sync + Manifest, `--check` |
| `assets/tarot/gartenbrevier-v2/**` | 237 Bilder + `manifest.json` |
| `package.json` | `test:tarot:decks`, in `test:all` aufgenommen |
| `.github/workflows/ci.yml` | CI-Schritt für die neue Suite |

Bewusst **nicht** geändert: `js/data/tarot.js` (Deutungen), `assets/tarot/nachtatelier-v1/**`,
`docs/tarot-deck-v2/**` (freigegebenes Paket), Pages-Pipeline, Hosting.

## 7. Offene Punkte für Review und Release

1. **Menschliche Sichtfreigabe des vollen V2-Decks** ist nicht separat dokumentiert (nur Musterfreigabe +
   bestandener unabhängiger Review). Der Review soll entscheiden, ob das für die optionale Auswahl genügt.
2. **Kollisionsdateien mit `t_67334ff1`** (parallel laufende QA-Karte im selben Arbeitsbaum):
   `js/modules/tarot.js`, `css/main.css`, `package.json`, `.github/workflows/ci.yml`. Beide Änderungssätze
   sind derzeit gemeinsam grün; ein Release muss den Endstand erneut prüfen.
3. **1200-px-Zoomstufe** ist eine neue Ableitung (JPEG aus den freigegebenen 1200 × 2000-Mastern), keine
   neue Zeichnung; Verfahren und Hashes stehen im Manifest.
4. **Kein Deploy** in dieser Karte. Commit/Push/Deploy und Live-Abnahme übernimmt `t_c8943c1e`, inklusive
   vollständiger 156er-Assetprüfung im Live-Deployment.
5. Druckfreigabe ist nicht erteilt und wird hier nicht impliziert.
