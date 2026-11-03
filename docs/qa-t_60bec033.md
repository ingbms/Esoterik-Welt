# Unabhängige Gesamt-QA — Nachtatelier, 78er-Tarot, Mond, Astrologie (t_60bec033)

Stand: 02.11.2026 · Prüfer-Profil `design_critique` · Modellroute `deepseek/deepseek-flash`
Prüfstand: Arbeitsbaum `C:/Users/mas/Arbeit/Esoterik-Welt`, HEAD `1f2726c` (= `origin/main`), 93 uncommittete Einträge aus den Vorgängerkarten.
Kein Commit, kein Push, kein Deploy in dieser Karte. Veröffentlichung ist der Folgerelease `t_3ad4ec40` vorbehalten.

## 1. Auftrag und Vorgehen

Geprüft wurde der **tatsächlich gebaute** Stand, nicht die Handoff-Prosa: eigene Probes mit Chromium 1.64.1 gegen den frischen
Produktionsbuild (`dist/Esoterik-Welt` unter `http://127.0.0.1:4173/Esoterik-Welt/`), gegen das entpackte Weitergabepaket
(`:4180`), gegen echtes `file://` (Repo-Wurzel und Paketkopie) und gegen die Live-Seite. Viewports 375/768/1440 zzgl.
Kopfzeilenband 781–1121 px. Alle Messskripte, Rohdaten und Screenshots liegen in `evidence/t_60bec033/`.

Vor und nach der Prüfung wurden `git status` (93 Einträge) und die Hashes der produktiven Schlüsseldateien verglichen:
`index.html`, `js/main.js`, `css/main.css`, `js/data/{tarot,moon,astrologie}.js`, `js/modules/{tarot,moon,astrologie}.js` —
alle unverändert (`pre-state-hashes.txt`, `sha256sum -c` → 9/9 OK). Diese Karte hat keine Produktivdatei angefasst.

## 2. Pflichtgates (frisch ausgeführt, nicht übernommen)

| Gate | Ergebnis | Beleg |
|---|---|---|
| `npm run build` | exit 0, `dist/Esoterik-Welt` 38.551.595 B | `gate-build.txt` |
| `npm run lint` | exit 0, 0 Warnungen | `gate-lint.txt` |
| `npm run format:check` | alle Dateien konform | `gate-format-check.txt` |
| `npm test` (Jest) | 2/2 | `gate-test.txt` |
| `npm run test:pages` | 6/6 | `gate-test-pages.txt` |
| `npm run test:astrologie` | **21/21** | `gate-test-astrologie.txt` |
| `npm run test:tarot` | **10/10** | `gate-test-tarot.txt` |
| `npm run test:moon` | **14/14** | `gate-test-moon.txt` |
| `npm run test:offline` | 2/2 | `gate-test-offline.txt` |
| `npm run test:local` | 12 pass / 0 fail / 2 vorbestehende Skips | `gate-test-local.txt` |
| `npm run verify:build` | 33 Seiten/Viewports, 0 Fehler | `gate-verify-build.txt` |
| `npx playwright test` | **74/74** | `gate-playwright.txt` |
| `generate-astrologie-data.cjs --check` | PASS, 206 IDs, 268.999 B | Laufprotokoll unten |
| `generate-tarot-data.cjs --check` | ok, 78 Karten, 1 dokumentierte Warnung (ID 68) | Laufprotokoll unten |

```
PASS js/data/astrologie.js is current (206 ids, 268999 bytes)
{ "ok": true, "changed": false, "cards": 78,
  "warnings": ["id 68: pip text does not name its suit (pentacles) – check mapping by hand"] }
```

Die Warnung zu ID 68 ist inhaltlich richtig: „5 der Münzen“ zeigt im kanonischen Motiv zwei Menschen im Schnee und keine
Münze. Das Motiv wurde gesichtet (Kontaktbogen 6), es ist kein Fehler.

## 3. Tarot: 78 Karten vollständig, nicht stichprobenartig

**Vertrag** (`tarot-contract.json`, eigenes Hash-/JPEG-Prüfskript):

- 78 IDs exakt 0–77, 22 Große Arkana, vier Farben mit je 14 Karten, Numeralien 1–14 je Farbe, ID 23 = „2 der Stäbe“.
- 237 JPEG (79 je Stufe inkl. Rückseite), zusammen **35.033.700 B**; alle Dateien vorhanden, SHA-256 eindeutig
  (78/78 unterschiedliche Thumbnails), Maße 300×500 / 600×1000 / 1200×2000; Rückseite in allen drei Stufen.
- Inhalte: 78 individuelle Stichwortlisten (≥ 3), 78 individuelle Bildsprachen, 78 individuelle auf-/umgekehrte Deutungen,
  keine Duplikate; Manifest- und Datenmodul-Identitäten (Name, Nummer, Numeral, Arkana, Farbe) stimmen für alle 78 überein.
- V2 ist **nicht** registriert und **nicht** ausgeliefert: `assets/tarot/` enthält nur `nachtatelier-v1`, die Registry nur ein Deck.

**Alle 78 Motive gesichtet** (7 Kontaktbögen à 12 Karten aus den echten 300-px-Dateien, `contact-1..7.png`): jedes Motiv
ist eigenständig, trägt lesbare Numeral/Titel und passt zur Beschriftung. Zusätzlich 78/78 Karten im Browser geöffnet und
gegen das Datenmodul geprüft (Name, Titel, Numeral-Badge, Stichwörter, Bildsprache, beide Deutungen, 600-px-Bild mit
600×1000, kein Innenüberlauf, Fokus nach Escape auf der auslösenden Karte). `probe-tarot-ui.json`: 0 Abweichungen.

**Interaktion** (375/768/1440): Galerie 78; Suche „Sonne“ trifft; Filter 22/14/14/14/14/78; Leerzustand sichtbar und
bedienbar; „Filter zurücksetzen“ → 78. Zoom wächst real von 275→375 px (1,36×) bzw. 298→412 px (1,38×), `aria-pressed`
und Label wechseln, die 1200-px-Stufe wird **erst** durch den Zoom geladen (`probe-tarot-ui.json`, `probe-payload.json`).
Tastatur: Enter öffnet, Fokus im Dialog, Escape schließt und gibt den Fokus zurück. Reduced Motion: 3-Karten-Legung in
153 ms, 0 laufende Keyframe-Animationen.

## 4. Mond: Fixtures, Klarheit, Grenzfälle

| Fall | Ergebnis |
|---|---|
| Exakter Neumond 09.11.2026 08:01 MEZ (0 %) | „Neumond“, „0 % beleuchtet“, **kein** Lit-Pfad im SVG, Mondalter 0,0 Tage |
| Erstes Viertel 17.11.2026 12:47 | „50 %“, per Punktsampling gemessene Lit-Fläche **49,5 %** |
| Vollmond 24.11.2026 15:53 | „100 %“, Lit-Fläche **100 %** |
| Tageswechsel 02.11. 23:59 → 03.11. 00:00 | Stempel „Dienstag, 03. November 2026 · 00:00“, Heute-Marker auf `2026-11-03` |
| Geblätterter Monat über Mitternacht | „Februar 2027“ bleibt nach 70 s erhalten (kein Rücksprung) |
| DST-Ende 25./26.10.2026 | 25.10. 23:30 → „morgen“, 26.10. 00:30 → „heute“ (Kalendertage, nicht Stunden) |
| Mobil 375 px | 30 Zellen, keine Zelle überläuft, Zelltext 13 px, kein Dokumentüberlauf |

Der 0-%-Fall zeigt den dunklen Disc ohne Lit-Sliver (Screenshot `moon-375-newmoon.png`).

## 5. Astrologie: Umfang, Quellen, Kennzeichnung, Suche/Filter

| Datensatz | Erwartet | Gerendert |
|---|---|---|
| Zeichen | 12 | 12 |
| Faktoren | 10 | 10 |
| Häuser | 12 | 12 |
| Aspekte | 5 | 5 |
| Grundlagen | 24 | 24 |
| Lernpfad | 6 | 6 |
| Beispiele | 4 | 4 |
| FAQ | 15 | 15 |
| Glossar | 65 | 65 |
| Quellen | 25 | 25 |
| Claims | 28 | 28 |

- 17 Detailseiten (12 Zeichen + 5 Aspekte) einzeln geprüft: h1 nennt den Datensatz, Kennzeichnungs-Badge vorhanden,
  Quellenmarker verlinken ausnahmslos ins Quellenverzeichnis (0 fehlgeleitete Marker), Textmenge je Seite > 800 Zeichen.
- Quellenpanel: 25 Karten mit Herausgeber, Typ, Abrufdatum, Abrufstatus, Grenzen und Rechtehinweis; 28 Claims mit
  Evidenztyp und Sicherheit. Deep-Link `#astrologie/quellen?quelle=S11` hebt genau eine Quelle hervor.
- Suche: „Mond“ → 11 Treffer, Suchfeld behält den Fokus; Unsinnsquery → sichtbarer Leerzustand; Filter
  `element=element-feuer` → Widder/Löwe/Schütze (3), aktiver Chip „Feuer“; kombinierter unmöglicher Filter → Leerzustand
  mit Reset. In-Page-Sprungmarken scrollen und fokussieren ohne Hash-Wechsel.
- Kein Geburtsdatenfeld, kein Datums-/Zeitfeld, kein Berechnen-Button, keine Rechenausgabe; der Bereich sagt selbst, dass
  er nichts rechnet. Die 271.541 B Datendatei wird **erst** beim ersten Öffnen des Bereichs geladen, nicht auf der Startseite.

## 6. Navigation, Dialoge, Tastatur, Overflow

**Design-Token (Stichprobe am gerenderten Stand):** Die acht normativen Farben stehen exakt wie in `tokens.json`
(Basalt `#0b1012`, Oberfläche `#141c1f`, Kreide `#eae6dc`, Sekundär `#babdb7`, Sand `#c6b38e`, Hover `#d5c4a2`,
dekorativ `#3c484b`, funktional `#82928e`). Hero-H1 misst 52/66/80 px bei 375/768/1440, Modultitel 30–56 px,
Fließtext 16 px, Labels 13 px; Fokus 2 px Sand mit 4 px Offset; keine Schatten, keine Pillen. Radien: 2 px (`sm`) und
4 px (`rounded.md`, im CSS als `--radius-xl` benannt und in `docs/design-tokens.md` dokumentiert). Schriften werden
lokal geladen (Fraunces/Manrope, `document.fonts` = loaded), keine Fremdfont-Requests.

- Sieben Hauptziele (Start, Tarot, Kristalle, Mondphasen, Astrologie, Runen, Wissen); je Ansicht genau **eine** sichtbare h1;
  keine Konsolenfehler, Pageerrors, fehlgeschlagenen Requests oder Fremdanfragen in 21 Seiten-/Breitenläufen.
- Kaltstart-Deeplinks `#tarot`, `#moon`, `#astrologie`, `#astrologie/zeichen/widder`, `#astrologie/glossar`,
  `#astrologie/quellen`, `#crystals`, `#runes`, `#blog` bei 375 und 1440: jeweils richtige Ansicht, Text vorhanden, 0 Überlauf.
- Skip-Link: echtes Tab+Enter → Fokus auf `<main>`, Startseite bleibt sichtbar (1.847 Zeichen), kein Router-Verschlucken.
- Kopfzeile 781/850/900/1000/1100/1121 px mit sieben Zielen: `scrollWidth == innerWidth`, kein Überlauf.
- Dialoge Kristall/Rune/Artikel: Fokus im Dialog, Escape schließt, Fokus kehrt zum Auslöser zurück; Artikel synchronisiert
  `#blog/1` und schließt auf `#blog`; kein Innenüberlauf, Panel bleibt im Viewport (375 und 1440).
- Dokument- und Komponentenüberlauf: 0 in allen geprüften Ansichten (u. a. 78 Tarot-Tafeln, Astro-Karten, Mondzellen,
  Rechtstexte, 404).
- 404: echter HTTP-404-Status für unbekannte Pfade, nutzbare Fehlerseite mit h1, Erklärung und zwei Rückwegen (375/768/1440).

## 7. Kontrast, Ziele, Reduced Motion

Eigene Berechnung mit Canvas-Farbauflösung (auch `color(srgb …)`, Alpha-Komposition über Vorfahrenflächen, Gradienten-
Stops einzeln):

| Bereich | Minimum | Maximum |
|---|---|---|
| Start | 9,33 : 1 | 15,36 : 1 |
| Tarot | 10,07 : 1 | 15,36 : 1 |
| Mond | 9,33 : 1 | 15,36 : 1 |
| Astrologie | 9,33 : 1 | 15,36 : 1 |
| Quellen | 9,33 : 1 | 15,36 : 1 |
| Impressum/Datenschutz | ≥ 9,33 : 1 | 15,36 : 1 |

Damit liegen alle gemessenen Text/Hintergrund-Paare deutlich über 4,5 : 1 (Großtext über 3 : 1). Fokus via echtem Tab:
`2px solid rgb(198, 179, 142)`, Offset 4 px, auf allen geprüften Seiten sichtbar. Reduced Motion: 0 Keyframe-Animationen,
0 Transitions > 0,5 s, `scroll-behavior: auto` auf Start/Tarot/Mond/Astrologie.

## 8. Payload (gemessen, Cache leer, je Viewport frischer Kontext)

| Messung | 375 | 768 | 1440 |
|---|---|---|---|
| Erster Aufruf gesamt | 1.964.376 B / 28 Requests | dito | dito |
| davon Hero-Foto | 423.428 B | 423.428 B | 423.428 B |
| davon lokale Fonts (3 TTF) | 940.944 B | 940.944 B | 940.944 B |
| Tarot-Galerie Erstaufbau | 4 Thumbs / 110.233 B | 6 / 166.306 B | 12 / 326.448 B |
| 600-px-Bilder im Erstaufbau | 0 | 0 | 0 |
| 1200-px-Bilder im Erstaufbau | 0 | 0 | 0 |
| Astro-Datenmodul | erst beim Bereichsaufruf: 271.541 B | dito | dito |
| Offline-Einstieg `Lokal.html` | 629.050 B, 0 Fremdanfragen | dito | dito |

Die Fonts und das Hero-Foto dominieren den Erstaufruf. Das ist ein Optimierungspotenzial (Hero ohne `srcset`,
TTF statt WOFF2), kein Gate-Fehler; die Tarot- und Astro-Last ist bedarfsgerecht.

## 9. Offline, Weitergabepaket, Produktionsbasis

- **file://-Doppelklick** aus Repo-Wurzel und aus einer frisch entpackten Kopie: `index.html` → `Lokal.html`, 375/768/1440,
  alle sieben Bereiche gerendert, 78 Tarotkarten, Astro-Kaltstart-Deeplink „♈︎ Widder“ (5.029 Zeichen, 0 Modulrequests),
  600-px-Karte dekodiert offline (600×1000), Mond 30 Zellen, Glossar 65 Begriffe, **0** Nicht-`file://`-Requests.
- **Entpacktes Paket** (`dist/Esoterik-Welt` nach `evidence/t_60bec033/probe/package/` kopiert) über HTTP unter
  `/Esoterik-Welt/`: alle Routen, h1, Fonts geladen, 0 Konsole-/Page-/Request-Fehler, 0 Überlauf; 16 lokale Referenzen
  geprüft (die vier „fehlenden“ sind Artefakte des Prüfskripts: Site-Wurzel-Link und CSS-relative Fontpfade).
- **Produktionspreview** `PORT=4173 node index.js`: `/Esoterik-Welt/` 200, Assets mit korrektem MIME
  (`image/jpeg`, `text/css`, `font/ttf`, `application/javascript`), 404-Fallback mit 404-Status.
- Paket-Hygiene: keine `docs/`, `evidence/`, `node_modules/`, `.git`, `.bak`; nur ein Deck (`nachtatelier-v1`);
  Gesamtgröße 38,5 MB. Die mitgelieferten `data/articles/*.md` und `css/README.md` sind Inhalte, keine privaten Daten.

## 10. Datenschutz, Lizenz, Attribution, Liveabgrenzung

- Keine Fremdanfragen in irgendeinem Lauf (0 externe Requests). Keine Analytics-/Tracking-Strings (`gtag`, `analytics`,
  `matomo`, `plausible`, `hotjar`, …) in HTML/JS. Lokale Fonts, OFL-Texte im Paket (`Fraunces-OFL.txt`, `Manrope-OFL.txt`).
- Impressum nennt Fotografie Didier Descouens (CC BY-SA 4.0, Bearbeitung ebenfalls CC BY-SA), Orion-Sternliste (Wikimedia,
  Abrufdatum) und die SIL-OFL-Schriften; Startseite und Bildunterschriften tragen dieselbe Attribution. Tarot nennt
  „Motive nach gemeinfreien historischen Vorlagen“. Astro-Quellen zeigen Rechtehinweise je Quelle.
- **Livealtstand getrennt:** `https://ingbms.github.io/Esoterik-Welt/` liefert 200, `Last-Modified` 01.11.2026 22:09,
  sechs Navigationsziele, **kein** Astrologiebereich, **0** Tarotbilder, Body `rgb(10, 5, 18)`, Schrift Inter.
  Der geprüfte Lokalstand hat sieben Ziele, Astrologie, 78 Bilder, `#0b1012`, Fraunces/Manrope. `origin/main` = `1f2726c`,
  der Prüfstand ist uncommittet; die Live-Seite ist nachweislich der alte Stand (`live/index.html` SHA-256 `b8878278…`).

## 11. Befunde

Kein Blocker. Drei kleine, reproduzierbare Nachbesserungen (nicht releasekritisch, als Folgekarte `t_67334ff1` verknüpft). Das Gate „fehlendesBild“ ist für den in der Tarot-Spezifikation dokumentierten Galeriepfad erfüllt (Fallback „Bild nicht verfügbar“ gemessen); die Lücke betrifft nur die Detail-/Zoomsicht (F1).

| Nr. | Severity | Befund | Repro | Wirkung | Abhilfe |
|---|---|---|---|---|---|
| F1 | niedrig | Tarot-Detail und Vollbild-Zoom haben keinen sichtbaren Fehlertext, wenn die 600-/1200-px-Datei fehlt; es bleibt das Browser-Broken-Image mit Alttext. Die Galerie benennt „Bild nicht verfügbar“ korrekt. | `route.abort('**/600/13.jpg')` → Karte 13 öffnen; `**/1200/15.jpg` → Karte 15 zoomen (`missing-image.json`, `missing-*.png`) | Nur bei Netzwerk-/Dateifehler; Kartentext bleibt lesbar, Alttext vorhanden | `error`-Handler am `.tarot-detail-image`: Bild ausblenden, `.tarot-image-fallback` „Bild nicht verfügbar“ einfügen, Zoom-Status zurücksetzen |
| F2 | kosmetisch | Bei 375 px bricht die Beleuchtungszeile vor dem Trenner, sodass die zweite Zeile mit „· zunehmend“ beginnt (z. B. „0 % beleuchtet“ / „· zunehmend“). | Mond bei 375 px, `moon-375-newmoon.png` | Typografischer Makel, keine Funktionsstörung | Geschütztes Leerzeichen auch vor „·“ oder `white-space: nowrap` für „· zunehmend“ |
| F3 | niedrig (Pipeline) | `npm run test:moon` (14 Rechentests) läuft nicht in der CI und nicht in `test:all`; die CI ist auch ohne diese Suite grün. | `grep -n "test:moon" .github/workflows/ci.yml package.json` → CI-Schritte: Jest, pages, astrologie, offline, tarot; Playwright deckt nur die Kalender-Interaktion ab | Mond-Ephemeridenregressionen würden von der CI nicht erkannt | CI-Schritt `npm run test:moon` im `unit-test`-Job ergänzen (eine Zeile) |

Beobachtungen ohne Befundcharakter: (a) das mobile Menü schließt nur über den Toggle bzw. einen Link, nicht über Escape/
Außenklick — `aria-expanded` ist korrekt, kein WCAG-Verstoß; (b) einige eigenständige Astro-Links sind 23 px hoch
(Abstand > 24 px, damit WCAG-2.5.8-Ausnahme „Spacing“ erfüllt); (c) Erstaufruf 1,96 MB durch Fonts/Hero (siehe §8).

## 12. Urteil

**Die Pflichtgates sind am geprüften Stand erfüllt.** Build, Lint/Format, alle Testsuites, Datenfrische, 78/78-Kartenvertrag,
78/78-Bildsicht, Mond-Fixtures inkl. 0 %/Tageswechsel/DST, Astrologie-Vollständigkeit inkl. Quellen/Claims, Navigation,
Deeplinks, Suche/Filter/Leerzustände, Dialogfokus, Kontraste, Overflow, Reduced Motion, `file://`, Paket und Produktions-
preview sind mit echten Messungen belegt. Die drei Befunde sind niedrig priorisiert und blockieren die Veröffentlichung
des geprüften Stands nicht; sie sind als Folgekarte an `coding_debug` übergeben (nach dem Release, damit keine parallele
Quelländerung den geprüften Stand verschiebt).

Folgerelease `t_3ad4ec40` ist damit freigegeben. **Kein Deploy in dieser Karte.**

## 13. Grenzen

- Nur Chromium (Playwright 1.64.1, headless); kein Firefox/Safari, kein Screenreader-/axe-Lauf, kein 200-%-Textzoom.
- Keine Druckfreigabe, kein CMYK/ICC-Proof, kein Probedruck.
- Keine Nutzertests; Verständlichkeit redaktionell geprüft, nicht empirisch.
- Keine neue Rechtsfreigabe; Rechtehinweise stammen aus dem freigegebenen Astro-Paket.
- Live-Abnahme und Commit/Push/Pages-Deploy sind Sache von `t_3ad4ec40`, nicht dieser Karte.

## 14. Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
npm run build && npm run lint && npm run format:check
npm test && npm run test:pages && npm run test:astrologie
npm run test:tarot && npm run test:moon && npm run test:offline && npm run test:local
npm run verify:build && npx playwright test
PORT=4173 node index.js   # http://127.0.0.1:4173/Esoterik-Welt/
node evidence/t_60bec033/probe/probe-ui.mjs
node evidence/t_60bec033/probe/probe-tarot-contract.mjs
node evidence/t_60bec033/probe/probe-contact-sheet.mjs
node evidence/t_60bec033/probe/probe-tarot-ui.mjs
node evidence/t_60bec033/probe/probe-moon.mjs
node evidence/t_60bec033/probe/probe-astro.mjs
node evidence/t_60bec033/probe/probe-a11y.mjs
node evidence/t_60bec033/probe/probe-modals.mjs
node evidence/t_60bec033/probe/probe-extra.mjs
node evidence/t_60bec033/probe/probe-payload.mjs
node evidence/t_60bec033/probe/probe-offline-package.mjs
node evidence/t_60bec033/probe/probe-file-extra.mjs
node evidence/t_60bec033/probe/probe-live.mjs
```

## 15. Artefakte

- `evidence/t_60bec033/summary.json` — maschinenlesbare Zusammenfassung (Gates, Zähler, Messwerte, Befunde)
- `evidence/t_60bec033/findings.csv` — Befundliste mit Severity/Repro
- `evidence/t_60bec033/probe/*.json` — alle Rohmessungen; `probe/*.mjs` — die Prüfskripte
- `evidence/t_60bec033/probe/contact-1..7.png` — Sichtprüfung aller 78 Motive
- `evidence/t_60bec033/probe/shots/*.png`, `moon-375-newmoon.png`, `missing-*.png`, `live-{375,1440}.png`,
  `file-{root,package}-*.png`, `package-*.png`, `legal-*.png` — Bildbelege
- `evidence/t_60bec033/live/` — Live-Altstand (HTML/CSS/Header) und Hashes
- `evidence/t_60bec033/pre-state-hashes.txt` — Vorher-Hashes der produktiven Schlüsseldateien
