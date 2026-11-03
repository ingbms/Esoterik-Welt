# QA-Nachbesserung t_67334ff1 — Tarot-Bildfehler, Mond-Trenner, Moon-CI-Schritt

Karte: `t_67334ff1` (coding_debug) · Grundlage: Gesamt-QA `t_60bec033`
Ausgangsstand: Commit `6a3eee1` (veröffentlicht in `t_3ad4ec40`), Arbeitsbaum `C:/Users/mas/Arbeit/Esoterik-Welt`
Kein Commit, kein Push, kein Deploy in dieser Karte — die Änderungen liegen ausschließlich im Arbeitsbaum.

## 0. Wichtig: paralleler Arbeitsbaum (Kollisionshinweis)

Während dieser Karte hat ein **zweiter Lauf** im selben Repo das Gartenbrevier-Deck mit Deck-Auswahl
hinzugefügt (`index.html`, `js/data/tarot-decks.js`, `css/main.css`, `js/modules/tarot.js`,
`tests/tarot-decks-v2.cjs`, `assets/tarot/gartenbrevier-v2/`). Dieser Lauf hat Dateien zwischen meinen
Messungen verändert. Konsequenzen für die Abnahme:

- Alle Änderungen dieser Karte sind **additiv** und auf klar benannte Stellen begrenzt (Abschnitt 2–5).
- `js/modules/tarot.js` und `css/main.css` enthalten jetzt **beides**: Deck-Auswahl (fremder Lauf) und
  die Nachbesserungen dieser Karte. Der Diff dieser Dateien ist daher größer als diese Karte.
- `npm run format:check` war während der ersten Messung rot — ausschließlich wegen `index.html` und
  `tests/tarot-decks-v2.cjs` aus dem Deck-Lauf (Nachweis in Abschnitt 7). Der Deck-Lauf hat beide Dateien
  inzwischen formatiert; der repoweite Lauf ist seit dem Review zu Runde 1 **grün** (Abschnitt 6).
- Während der Arbeit wurde versehentlich `git checkout --` auf fünf getrackte Dateien angewendet; die
  Änderungen des Deck-Laufs in `js/modules/tarot.js` und `css/main.css` wurden dabei kurzzeitig
  zurückgesetzt und unmittelbar danach aus einer vorher gesicherten Kopie wiederhergestellt
  (`evidence/t_67334ff1/patched/`). `index.html` und `js/data/tarot-decks.js` waren davon nicht betroffen.
  Kein fremder Inhalt ist verloren gegangen; das ist unten in Abschnitt 8 als Risiko vermerkt.

## 1. Ausgangsbefunde (am gebauten Stand reproduziert)

| Befund | Repro | Beobachtung vorher |
| --- | --- | --- |
| F1 | `page.route('**/600/13.jpg', abort)` → `#tarot`, Karte 13 | kein Fallback, `<img>` bleibt `display:block` mit `naturalWidth 0` (Broken-Image-Icon), Zoom-Status unverändert `false` |
| F1 | `page.route('**/1200/15.jpg', abort)` → Karte 15, Zoom | `aria-pressed="true"`, `is-zoomed`, Hint „Verkleinern“, Bild `naturalWidth 0` — Zustand behauptet eine Vergrößerung, die es nicht gibt |
| F2 | `#moon` bei 375 px | Beleuchtungszeile bricht als `47 % beleuchtet` / `· abnehmend` |
| F2 | `#moon` bei 768 px | Bildunterschrift endet mit `Nordhalbkugel-Darstellung ·`; Phasenleiste endet mit `2026 ·` bzw. `in 7 Tagen ·` |
| F3 | `grep -n "test:moon" .github/workflows/ci.yml package.json` | kein CI-Schritt, `test:all` ohne `test:tarot`/`test:moon` |

Rohdaten: `evidence/t_67334ff1/probe/before-lines.json`, `summary.txt`, Screenshots in `probe/shots/`.

## 2. F1 — Tarot-Dialog nennt ein fehlendes Bild

`js/modules/tarot.js`

- `bindDetailControls()` (Zeilen 392–397): `load`- und `error`-Listener am `.tarot-detail-image`; zusätzlich
  wird ein bereits gecachter Fehlschlag (`complete && naturalWidth === 0`) sofort als Fehler behandelt, weil
  dann kein Ereignis mehr feuert.
- `settleDetailImage(image, state)` (Zeilen 416–451):
  - `loaded`: Bild einblenden, vorhandenen Fallback entfernen, Erfolgsfall einer Vergrößerung räumt den Hinweis ab.
  - `error`: Bild ausblenden, `.tarot-image-fallback.tarot-detail-fallback` mit **„Bild nicht verfügbar“**
    einfügen (`role="img"`, `aria-label`), Zoom-Zustand zurücksetzen (`aria-pressed="false"`,
    Label „Karte vergrößern: …“, `is-zoomed` entfernt, Hint „Vergrößern“) und die Quelle auf den
    600-px-Stand zurückstellen, damit der nächste Klick sauber neu versucht.
  - Schlägt nur der 1200-px-Zoom fehl, bleibt die lesbare 600-px-Karte stehen und der Fehlschlag wird
    als Text benannt (`Vergrößerte Ansicht nicht verfügbar.`) — eine funktionierende Karte wird nicht durch
    eine Fehlerfläche ersetzt.
- `setDetailNote(text)` (Zeilen 453–471): legt den Hinweis als `<p class="tarot-detail-note" role="status">`
  unter die Bildunterschrift und entfernt ihn wieder, sobald eine Vergrößerung gelingt.

`css/main.css`

- `.tarot-detail-image[hidden] { display: none; }` (Zeile 645): nötig, weil `display:block` der Klasse das
  `hidden`-Attribut sonst überstimmt und das Broken-Image-Icon stehen bliebe.
- `.tarot-detail-fallback` (Zeile 649): hält die 3:5-Fläche, damit der Dialog beim Fehler nicht springt.
- `.tarot-detail-note` (Zeile 743): kleiner Statusblock unter der Bildunterschrift.

Galerie-Pfad (`observeImages`, `.tarot-image-fallback`) wurde **nicht** angefasst.

### Nachweis F1 (nach der Änderung, `evidence/t_67334ff1/probe/after-lines.json`)

| Fall | Ergebnis |
| --- | --- |
| 600 px blockiert, Karte 13, 1280 px | Fallback „Bild nicht verfügbar“ sichtbar (298×497 px), `<img>` `hidden`, `display:none`, `brokenIconVisible:false`, `aria-pressed:"false"`, Hint „Vergrößern“, kein Dokumentüberlauf |
| Escape danach | Fokus zurück auf `.tarot-card[data-id=13]` |
| 600 px blockiert, Karte 13, 375 px | Fallback sichtbar (275×458 px), kein Broken-Image, kein Überlauf |
| 1200 px blockiert, Karte 15, Zoom | Hinweis „Vergrößerte Ansicht nicht verfügbar.“ sichtbar, `aria-pressed:"false"`, `is-zoomed:false`, Hint „Vergrößern“, 600-px-Karte mit `naturalWidth 600` bleibt sichtbar, genau **eine** 1200-px-Anfrage, kein Broken-Image |
| Galerie (300/00 blockiert) | unverändert: `tarot-card is-missing`, Fallback „Bild nicht verfügbar“, Bild `display:none` (`probe/gallery-fallback.json`) |

Screenshots: `probe/shots/after-missing-detail-600.png`, `after-missing-detail-375.png`,
`zoom-note-1280.png`, `gallery-fallback.png`.

## 3. F2 — Trenner „·“ steht an keinem gemessenen Zeilenrand

`js/modules/moon.js`

- Neuer Helfer (Zeilen 111–114): `SEP = '\u00A0·\u00A0'`, `withSeparators(text)` ersetzt jedes ` · ` durch
  geschützte Leerzeichen auf **beiden** Seiten des Trenners.
- Angewendet auf: Datums-Eyebrow `#moonNowStamp` (210, nachgetragen in Review-Runde 1 → Abschnitt 3a),
  Beleuchtungszeile (218), Zyklusposition (227), „Zuletzt“/„Nächstes“ (243/248),
  Phasenleiste relativ (299), Ritual-Metazeile (316), Tagesdetail (439), Phasen-Index (556).
- Zwei Stellen vertrugen kein geschütztes Leerzeichen, weil ihre Spalte zu schmal ist (176 px bzw. 106 px);
  dort ist der Trenner durch ein Komma ersetzt, sodass die Zeile gar nicht mehr an einem Trenner brechen kann:
  - `eventStamp()` (Zeilen 104–109): `01. November 2026, 21:28 MEZ` statt `… 2026 · 21:28 MEZ`
    (betrifft Phasenleiste und die „Zuletzt/Nächstes“-Zeilen).
  - Bildunterschrift (Zeile 267): `Nordhalbkugel-Darstellung, Licht von links` (Box ist auf 22ch begrenzt).

### Nachweis F2 (pro Textblock gemessen, nicht pro Abschnitt)

| Breite | Blöcke mit Trenner | Zeilen, die mit „·“ beginnen/enden |
| --- | --- | --- |
| 375 px vorher | 24 | 8 Blöcke (Beleuchtung `· abnehmend`, Tagesdetail, 6× Phasen-Index) |
| 375 px nachher | 19 | **0** |
| 768 px vorher | 24 | 7 Blöcke (Bildunterschrift, 5× Phasenleiste, `in 7 Tagen ·`) |
| 768 px nachher | 19 | **0** |

Zusätzlich: Dokumentüberlauf 0 bei 375 und 768; Tagesdetail (`moon-detail-phase`) ohne Trenner am Rand.
Messverfahren: jedes Leaf-Element mit „·“ wird einzeln in Wörter zerlegt, Wörter über Range-Rects zu
Zeilen gruppiert und Zeilenanfang/-ende geprüft (`evidence/t_67334ff1/probe/measure-lines.cjs`) — dadurch
entstehen keine Scheinzeilen aus nebeneinanderliegenden Raster-Spalten.

### 3a. Review-Runde 1, B1 — Datums-Eyebrow `#moonNowStamp` nachgezogen

Der Review (design_critique, Runde 1) hat eine sichtbare Zeile gefunden, die den Trenner noch ungeschützt
führte: `js/modules/moon.js:210` schrieb `#moonNowStamp` (`.moon-eyebrow`, direkt über dem Phasennamen) mit
normalen Leerzeichen. Bei 360/412/414/428 px stand „·“ dadurch am Zeilenrand, obwohl 375/768 zufällig
sauber brachen — die erste Messung hatte nur diese beiden Breiten geprüft.

Korrektur: dieselbe Template-Zeile läuft jetzt durch `withSeparators()` (Zeilen 209–214). Keine
Wortlautänderung, keine CSS-Änderung.

Nachweis (`evidence/t_67334ff1/probe/stamp-b1.json`): pro Breite der gebaute Stand (nachher) gegen denselben
Text ohne geschützte Leerzeichen, im DOM eingesetzt (vorher, Quelle unberührt); Zeilen aus Wort-Rects.

| Breite | vorher: Zeilenaufteilung | vorher Offender | nachher: Zeilenaufteilung | nachher Offender | Innen-/Dokumentüberlauf |
| --- | --- | --- | --- | --- | --- |
| 320 | `… November 2026 ·` / `05:30 MEZ · Europe/Berlin` | 1 | `Montag, 02. November` / `2026 · 05:30` / `MEZ · Europe/Berlin` | 0 | 0 / 19 (19 = vorbestehend, Header-Badge) |
| 360 | `… November 2026 ·` / `05:30 MEZ · Europe/Berlin` | 1 | `Montag, 02. November` / `2026 · 05:30 MEZ · Europe/Berlin` | 0 | 0 / 0 |
| 375 | `… 2026 · 05:30` / `MEZ · Europe/Berlin` | 0 | unverändert | 0 | 0 / 0 |
| 390 | wie 375 | 0 | unverändert | 0 | 0 / 0 |
| 412 | `… 05:30 MEZ` / `· Europe/Berlin` | 1 | `Montag, 02. November 2026 · 05:30` / `MEZ · Europe/Berlin` | 0 | 0 / 0 |
| 414 | `… 05:30 MEZ ·` / `Europe/Berlin` | 1 | wie 412 | 0 | 0 / 0 |
| 428 | wie 414 | 1 | wie 412 | 0 | 0 / 0 |
| 768 | eine Zeile | 0 | unverändert | 0 | 0 / 0 |

Vollständiger Leaf-Scan aller Textblöcke mit „·“ auf `#moon` (Übersicht **und** Tagesdetail,
`evidence/t_67334ff1/probe/moon-all-widths.json`): 19 Blöcke je Breite, **0 Offender** bei 320/360/375/390/
412/414/428/768, Innenüberlauf 0 (Ausnahme 320 px, siehe Abschnitt 8.6), Dokumentüberlauf 0 außer 320 px
(vorbestehender Header-Badge, identisch vor und nach der Änderung).

## 4. F3 — Mond-Tests in CI und `test:all`

- `.github/workflows/ci.yml`, Job `unit-test`, direkt nach dem Tarot-Schritt (Zeilen 75–76):
  `- name: Run moon ephemeris contracts … / run: npm run test:moon`
- `package.json`, `test:all` (Zeile 25) enthält jetzt `test:tarot` und `test:moon`
  (Reihenfolge: unit → pages → astrologie → tarot → tarot:decks → moon → offline → e2e;
  `test:tarot:decks` stammt aus dem parallelen Deck-Lauf).
- Bestehende Assertions wurden nicht abgeschwächt; der Mond-Schritt läuft unverändert mit 14 Tests.

## 5. Regressionstest (vorher rot, nachher grün)

`tests/tarot-deck.cjs`, neuer Test „missing artwork: the dialog names the failure instead of a broken icon“
(Zeile 559 ff.) prüft beide Fälle: blockierter 600er (Fallback-Text, Höhe der 3:5-Fläche, `display:none`,
Zoom-Status, kein Überlauf, Escape-Fokus) und blockierter 1200er (Hinweis, Reset von `aria-pressed`,
Label, Hint, `is-zoomed`, 600er bleibt geladen, genau eine Zoom-Anfrage, kein Fehlerbild).
Der Test läuft im bestehenden CI-Schritt `npm run test:tarot` mit und schlägt ohne die Änderung fehl
(vorher: kein `.tarot-image-fallback` im Dialog, `aria-pressed` blieb `true`).

## 6. Gate-Lauf (lokal, nach `npm run build`, Stand nach Review-Runde 1)

| Gate | Ergebnis |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm run format:check` (repoweit) | exit 0 — „All matched files use Prettier code style!“ (der Deck-Lauf hat seine beiden Dateien inzwischen formatiert) |
| `npm run test:moon` | 14/14 pass |
| `npm run test:tarot` | 11/11 pass (10 bestehende + 1 neuer Test) |
| `npm run test:tarot:decks` | 12/12 pass (Deck-Lauf, nicht Teil dieser Karte, aber im selben Baum) |
| `npx playwright test` | 74/74 pass |
| `npx prettier --check` auf die geänderten Dateien | grün |

In der ersten Runde war `npm run format:check` rot, ausschließlich wegen `index.html` und
`tests/tarot-decks-v2.cjs` aus dem parallelen Deck-Lauf
(`evidence/t_67334ff1/probe/prettier-index.html.txt`, `prettier-tarot-decks-v2.txt`); fremde Dateien wurden
bewusst nicht umformatiert. Dieser Punkt ist inzwischen erledigt.

## 7. Reproduktion

```bash
cd /c/Users/mas/Arbeit/Esoterik-Welt
npm run build
node evidence/t_67334ff1/probe/measure-lines.cjs after evidence/t_67334ff1/probe/after-lines.json
node evidence/t_67334ff1/probe/stamp-b1.cjs            # B1: Eyebrow 320–768, vorher/nachher
node evidence/t_67334ff1/probe/moon-all-widths.cjs     # alle Trenner-Blöcke 320–768
node evidence/t_67334ff1/probe/illumination-overflow.cjs  # Restbefund 320 px (Abschnitt 8.6)
node evidence/t_67334ff1/probe/gallery-fallback.cjs
node evidence/t_67334ff1/probe/shots.cjs
node evidence/t_67334ff1/probe/summarize.cjs
npm run lint && npm run format:check && npm run test:moon && npm run test:tarot && npx playwright test
```

`measure-lines.cjs before <datei>` misst denselben Satz gegen einen Stand ohne die Änderungen
(vorheriges Ergebnis: `before-lines.json`, erzeugt nach `git checkout --` der fünf Quelldateien und
`npm run build`, danach Wiederherstellung aus `evidence/t_67334ff1/patched/`).

## 8. Grenzen und offene Punkte

1. **Paralleler Deck-Lauf:** Solange dieser Lauf `js/modules/tarot.js`, `css/main.css`, `package.json`
   und `.github/workflows/ci.yml` weiterbearbeitet, können die Zeilen dieser Karte beim nächsten
   Vollschreiben überschrieben werden. Die Änderungen sind deshalb zusätzlich als Kopie gesichert
   (`evidence/t_67334ff1/patched/`), damit sie ohne Neuentwicklung wieder eingesetzt werden können.
2. **`format:check` ist inzwischen grün** — der Deck-Lauf hat `index.html` und `tests/tarot-decks-v2.cjs`
   formatiert. Der erste Handoff meldete zu Recht rot; der Stand ist überholt.
3. **Wortlautänderungen:** „Nordhalbkugel-Darstellung, Licht von links“ und
   „01. November 2026, 21:28 MEZ“ ersetzen zwei Trennzeichen durch Kommas. Das ist eine typografische
   Entscheidung (schmale Spalten), keine Inhaltsänderung; die Prüfung darauf ist Teil des Reviews.
4. **Zoom-Fehlerfall:** Die 600-px-Karte bleibt sichtbar und der Fehlschlag wird als Textzeile benannt,
   statt die Karte durch eine Fehlerfläche zu ersetzen. Falls die Gestaltung dort eine andere Lösung will,
   ist nur `settleDetailImage()` betroffen.
5. Nicht geprüft (außerhalb des Auftrags): Live-Stand `https://ingbms.github.io/Esoterik-Welt/` — die
   Änderungen sind noch nicht veröffentlicht.
6. **Restbefund 320 px (selbst verursacht, offen gemeldet):** Auf `#moonIllumination` ist seit der
   F2-Korrektur die Wortgruppe „beleuchtet · abnehmend“ durch geschützte Leerzeichen unteilbar. Bei 320 px
   ist die Spalte nur 230 px breit, die Gruppe braucht 242 px → **12 px Innenüberlauf** des Elements
   (`evidence/t_67334ff1/probe/illumination-overflow.json`; vorher 0, Dokumentüberlauf unverändert 19 px
   aus dem vorbestehenden Header-Badge). Der Text bleibt vollständig lesbar, wird nicht abgeschnitten
   (kein `overflow: hidden`) und erzeugt keinen Seiten-Scrollbalken; er ragt lediglich 12 px in die
   Kartenpolsterung. Ab 360 px tritt das nicht auf (0 px). Behebbar nur über Typografie (kleinere
   Schriftgröße unter ~340 px) oder Wortlaut („46 % · abnehmend“) — beides sind Gestaltungsentscheidungen
   außerhalb dieser Karte, deshalb hier bewusst nur dokumentiert und nicht eigenmächtig geändert.

## 9. Artefakte

- `evidence/t_67334ff1/probe/before-lines.json`, `after-lines.json` — Messreihen F1/F2
- `evidence/t_67334ff1/probe/stamp-b1.json` — B1: Eyebrow `#moonNowStamp` 320–768, vorher/nachher
- `evidence/t_67334ff1/probe/moon-all-widths.json` — alle Trenner-Blöcke `#moon` 320–768, inkl. Tagesdetail
- `evidence/t_67334ff1/probe/illumination-overflow.json` — Restbefund 320 px (Abschnitt 8.6)
- `evidence/t_67334ff1/probe/shots/b1-after-*.png` — Eyebrow je Breite (320–768)
- `evidence/t_67334ff1/probe/gallery-fallback.json` — Gegenprobe Galerie
- `evidence/t_67334ff1/summary.txt` — Zusammenfassung der Messreihen
- `evidence/t_67334ff1/probe/shots/` — Screenshots (375/768 Mondkopf, Dialog 600/1200 blockiert, Galerie)
- `evidence/t_67334ff1/pre-hashes.txt`, `post-hashes.txt` — Dateihashes vor/nach der Änderung
- `evidence/t_67334ff1/patched/` — Sicherung der fünf geänderten Dateien
