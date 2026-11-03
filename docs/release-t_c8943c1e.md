# Release t_c8943c1e — optionale Tarot-Deckauswahl V2 (Gartenbrevier) veröffentlicht

Stand: 02.11.2026 · Release-Karte `t_c8943c1e` · Profil `coding_debug` · Modellroute `deepseek/deepseek-flash`
Freigabegrundlage: unabhängiger Review `t_937ab9cf` (Urteil **approved**, Linse Artefakt, Runde 1) und menschliche
V2-Musterfreigabe `evidence/t_76bc5bda/FREIGABE-2026-11-02.md` (02.11.2026 00:26 CET, 8 Muster + Stilfamilie).
Kein separates manuelles Release-Okay eingeholt; der veröffentlichte Stand ist gegenüber dem geprüften Stand
unverändert (siehe §3).

## 1. Ergebnis in einer Zeile

Die geprüfte optionale Deckauswahl ist als **Commit `5d327ed`** auf `main` veröffentlicht: GitHub Pages liefert
**474/474** Tarotdateien beider Decks byte-identisch aus (**156 Kartenmappings** × 3 Stufen + 6 Rücken), CI und
Deploy sind grün, und die Live-Bedienung bei **375/768/1440 px** wurde real durchgeklickt (Deckwechsel, Persistenz,
Dialog, Zoom, 3er-Legung). **Nachtatelier V1 bleibt Standard**, Gartenbrevier V2 ist als „Optional“ beschriftet.

| Feld | Wert |
| --- | --- |
| URL | https://ingbms.github.io/Esoterik-Welt/ (Tarot: `#tarot`) |
| Commit | `5d327ed034d39c67d064b6760506daf03c512568` (Elterncommit `6a3eee1`) |
| Umfang | 253 Einträge, 5.232 Insertions, 37 Deletions, 24,55 MB Allowlist-Nutzdaten |
| CI-Pflichtlauf | [Run 41392893797](https://github.com/ingbms/Esoterik-Welt/actions/runs/41392893797) — **success**, 4/4 Jobs |
| Pages-Deploy | [Run 41392893057](https://github.com/ingbms/Esoterik-Welt/actions/runs/41392893057) — **success** (build/report/deploy); Pages-Build `1334043389`, Status `built`, 05:15:36 UTC |
| Live-`Last-Modified` | `Mon, 02 Nov 2026 05:15:35 GMT` (index und V2-Manifest identisch) |
| Hosting | unverändert GitHub Pages, Legacy-Build aus `main`/`/` — keine Migration, kein Force-Push |

## 2. Freigabekette

1. **Menschliche Sichtfreigabe** der V2-Stilfamilie: `evidence/t_76bc5bda/FREIGABE-2026-11-02.md`, 02.11.2026
   00:26 CET, bestätigt an `karten/00,01,02,17,18,19,34,38` + `manifest.json` (94/94 Einträge SHA- und bytegeprüft).
   Ausdrücklich **keine** Druckfreigabe.
2. **Unabhängiger Review** der V2-Integration: `t_937ab9cf`, Runde 1, Linse Artefakt, **approved**. Der Reviewer hat
   unabhängig nachgemessen: 237 Assets / 23.077.582 B mit 237/237 Manifest-Treffern, 474 Live-Requests SHA-gleich,
   Lazy-First-Load, Konsistenz bei Dialog/Legung, Fallbacks, Tastatur/Screenreader, 360–1440 px, file://.
3. **Reparaturen aus der Gesamt-QA** (`t_67334ff1`: Tarot-Dialog-Bildfehler, Mond-Trenner, 320-px-Überlauf) sind im
   selben Arbeitsbaum enthalten und mitveröffentlicht; sie waren Teil des vom Reviewer geprüften Kombistands.
4. Diese Karte hat **keinen Produktcode geändert**. Der veröffentlichte Baum entspricht dem geprüften Stand; die
   einzige Abweichung wäre eine Änderung gewesen, die hier nicht stattgefunden hat (§3).

## 3. Was veröffentlicht wurde (Commit-Allowlist)

Die Allowlist wurde per Skript erzeugt (`evidence/t_c8943c1e/build-allowlist.cjs`), nicht per `git add -A`. Sie
enthält ausschließlich Dateien, die Build, Tests, CI oder die Dateimodus-Ausgabe tatsächlich lesen, plus das
freigegebene V2-Assetpaket und sein Ableitungsskript:

- **Geändert (13):** `.github/workflows/ci.yml` (neue Schritte `test:tarot:decks`, `test:moon`), `Lokal*.html`
  (fünf Dateimodus-Seiten, aus `index.html` gebaut), `css/main.css`, `index.html`, `js/data/tarot-decks.js`,
  `js/modules/{tarot,moon}.js`, `package.json`, `tests/tarot-deck.cjs`.
- **Neu (240):** `assets/tarot/gartenbrevier-v2/` (238 Dateien: 237 JPEG + `manifest.json`),
  `scripts/sync-gartenbrevier-v2-assets.py`, `tests/tarot-decks-v2.cjs` (753 Zeilen, 12 Tests).
- **Summe:** 253 Dateien, 24.550.473 B Allowlist-Volumen; V2-Anteil 23.139.408 B im Arbeitsbaum
  (davon 23.077.582 B Bilder + Manifest).
- **Bewusst nicht veröffentlicht** (lokal, in `allowlist.json` als Ausschluss dokumentiert): `evidence/`, alle
  `docs/`-Werkstätten (`tarot-deck-v2`, `tarot-deck-v2-pilot`, `tarot-deck-v3`, Stilkonzepte, Art Direction), die
  Prozessnotizen `docs/{qa,review,release,reparatur,plan}-*.md` und die Streukopie `build-local.cjs`.
- **Datenschutz-Scan** vor dem Commit (`privacy-scan.cjs`, 16 textliche von 253 Dateien; Rest binär): **0 Treffer**
  für Windows-/Home-Pfade, Tokens, Schlüssel, E-Mails (`evidence/t_c8943c1e/privacy-scan.json`).
- Allowlist-Selbstprüfung: keine Überschneidung mit Ausschlüssen, **keine** gelistete Datei ohne echte Änderung.

Der Arbeitsbaum enthielt darüber hinaus unveränderte fremde Arbeit aus früheren Karten (u. a. `docs/tarot-deck-*`,
`evidence/`). Sie wurde weder gestaged noch überschrieben.

## 4. Gates auf dem veröffentlichten Arbeitsbaum

Alle Pflichtgates vor dem Commit, vollständige Logs in `evidence/t_c8943c1e/logs/`:

| Gate | Ergebnis | Log |
| --- | --- | --- |
| `npm run build` | exit 0, `dist/Esoterik-Welt` | `01-build.log` |
| `npm run lint` | exit 0, 0 Warnungen | `02-lint.log` |
| `npm run format:check` | exit 0 | `03-format.log` |
| `npx jest --ci` | 2/2 | `04-jest.log` |
| `npm run test:pages` | 6/6 | `05-pages.log` |
| `npm run test:astrologie` | 21/21 | `06-astrologie.log` |
| `npm run test:tarot` | 11/11 (davon file://-Einstieg) | `07-tarot.log` |
| `npm run test:tarot:decks` | **12/12** (156 Mappings, Wähler, Persistenz, Dialog/Legung, Fallback, fehlendes Bild, file://) | `08-tarot-decks.log` |
| `npm run test:moon` | 14/14 | `09-moon.log` |
| `npm run test:offline` | 2/2 (Doppelklick-Einstieg) | `10-offline.log` |
| `npm run verify:build` | 33 Seiten/Viewports, 0 Fehler | `11-verify-build.log` |
| `npx playwright test` | **74/74** | `12-e2e.log` |
| `npm run build:local` | exit 0 | `13-build-local.log` |

## 5. Live-Prüfung: was die Produktion tatsächlich ausliefert

### 5.1 Assets — 156 Mappings, 474 Dateien, alle SHA-gleich

Jede der **474** ausgelieferten Dateien (2 Decks × 78 Karten × 3 Stufen = 468 + 6 Rücken) wurde einzeln geladen und
gegen die Datei im Release-Commit geprüft (`live/live-http.json`):

| Deck | Dateien | 200 | SHA-gleich | Bilder-Bytes | falscher MIME | falsche Maße |
| --- | --- | --- | --- | --- | --- | --- |
| Nachtatelier V1 | 237 | 237 | **237** | 35.033.700 | 0 | 0 |
| Gartenbrevier V2 | 237 | 237 | **237** | 23.077.582 | 0 | 0 |
| **Summe** | **474** | **474** | **474** | **58.111.282** | **0** | **0** |

Bildmaße direkt aus den SOF-Markern der gelieferten Bytes: je 79× `300×500`, `600×1000`, `1200×2000` pro Deck,
0 Abweichungen; Content-Type durchgehend `image/jpeg`. Beide `manifest.json` sind byte-identisch mit dem jeweiligen
Blob bei `HEAD` (V1 `61394` B, V2 `58886` B), deklarieren `card_count: 78` und die IDs `0…77`.

**156 Kartenmappings** = 78 stabile IDs × 2 Decks; pro Mapping existieren alle drei Stufen, keine Lücke.

### 5.2 Quellen gegen den Commit

14 ausgelieferte Dateien (u. a. `index.html`, `Lokal.html`, `css/main.css`, `js/data/tarot-decks.js`,
`js/modules/{tarot,moon}.js`, `404.html`, Rechtstexte, `sitemap.xml`, `robots.txt`) wurden geholt und mit dem
**Blob bei HEAD** verglichen: **14/14 byte-identisch**. (Vergleich gegen den Blob, nicht gegen die Arbeitsdatei:
dieser Windows-Checkout hat CRLF in Textdateien, veröffentlicht wird der LF-Blob — siehe §9.1.)

Echter Fehlerseiten-Test: unbekannte URL → HTTP **404** mit HTML-Fehlerseite und `<h1>404`.

### 5.3 Live-Bedienung bei 375 / 768 / 1440 px

Echte Chromium-Navigation gegen die Produktion, je Breite ein frischer Browserkontext
(`live/live-browser.json`, Screenshots in `live/shots/`):

| Prüfung | 375 | 768 | 1440 |
| --- | --- | --- | --- |
| genau eine sichtbare `h1` („Tarot — Der Spiegel der Seele") | ✔ | ✔ | ✔ |
| Wähler sichtbar, Legende „Deck wählen“, 2 benannte Radios | ✔ | ✔ | ✔ |
| Standard beim Erstaufruf: **Nachtatelier V1**, `localStorage` = `nachtatelier-v1`, Galerie 78/78 V1 | ✔ | ✔ | ✔ |
| Erstaufruf-Netz: nur sichtbare V1-Thumbs (2/6/12) + **1** V2-Vorschau, **0** Master (600/1200) | ✔ | ✔ | ✔ |
| Tastatur: Fokusring 2 px, `ArrowDown` wählt V2, Statusmeldung „Deck gewechselt: Gartenbrevier …“ | ✔ | ✔ | ✔ |
| Galerie wechselt vollständig auf `gartenbrevier-v2/300/…`, 78 eindeutige IDs | ✔ | ✔ | ✔ |
| Dialog: `600/37.jpg` (600×1000), Alt-Text „… Karte aus dem Deck „Gartenbrevier““ | ✔ | ✔ | ✔ |
| Zoom: `1200/37.jpg` (1200×2000), `aria-pressed=true`, Hinweis „Verkleinern“ | ✔ | ✔ | ✔ |
| Escape schließt, Fokus zurück auf die auslösende Karte (id 37) | ✔ | ✔ | ✔ |
| 3er-Legung: nach Deckwechsel gleiche IDs, gleiche Titel, nur Bildpfade wechseln | ✔ | ✔ | ✔ |
| Persistenz: Reload behält Gartenbrevier (Radio + Speicher + Galerie) | ✔ | ✔ | ✔ |
| Dokument- und Komponentenüberlauf (Wähler, Fieldset, Optionen, Galerie, Buttons) | 0 px | 0 px | 0 px |
| Konsole/Pageerror/fehlgeschlagene/externe Requests | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |

**Attribution in der Fußnote** (live gelesen, identisch in allen drei Breiten): nennt „Nachtatelier“ (Standard) mit
„gemeinfreien historischen Fragmenten von Pamela Colman Smith, Textur von Didier Descouens (CC BY-SA 4.0)“ und
„Gartenbrevier“ (optional) als „eigenen, codegenerierten Vektor, keine fremden Bildvorlagen“; zusätzlich sind
Karten-IDs und Deutungstexte als identisch benannt. Grundlage der Formulierung:
`docs/tarot-deck-nachtatelier/QUELLEN-RECHTS-MANIFEST.md`, `docs/tarot-deck-v2/QUELLEN-RECHTS-MANIFEST.md`,
`docs/tarot-deck-v2-integration.md` §3.3. Einschränkung siehe §9.2.

## 6. CI und Deploy

- **CI `41392893797`** (Push auf `main`, SHA `5d327ed`): **success**, 4/4 Jobs —
  Lint 05:15:31, Unit 05:16:25, Build 05:17:57, Browser-E2E 05:17:59 UTC.
  Die beiden **neuen** Schritte liefen auf dem frischen Runner erfolgreich:
  „Run tarot deck choice (156 mappings, picker, persistence, dialog/draw switch, file://)“ und
  „Run moon ephemeris contracts“ — der Workflow-Nachtrag ist damit nicht nur lokal, sondern in CI belegt.
- **Pages `41392893057`**: success (build/report-build-status/deploy), Pages-Build `1334043389`, `status: built`,
  `commit: 5d327ed`, `updated_at 05:15:36Z`; ausgeliefertes `Last-Modified` 05:15:35 GMT.

## 7. file://-Doppelklick-Einstieg

Der veröffentlichte Baum enthält die neu gebaute Dateimodus-Ausgabe (`Lokal.html` u. a.). Am selben Commit belegen:
`test:tarot:decks` 12/12 (enthält den file://-Fall mit **beiden** Decks, inkl. Speicherung der Wahl über Reload)
und `test:offline` 2/2 (Doppelklick-Einstieg, 0 Nicht-`file://`-Requests). Beide Suiten laufen in der CI mit
(`unit-test`-Job, Schritte „offline file entry“ und „tarot deck choice“).

## 8. Rückfallanleitung

**Fall A — Website auf den vorherigen Stand zurück (ohne Force-Push):**

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
git revert --no-edit 5d327ed
git push origin main
```

Pages baut automatisch neu; der vorherige Live-Stand entspricht `6a3eee1` (nur ein Deck, kein Wähler). Erkennungs-
merkmal: `js/data/tarot-decks.js` registriert dann wieder genau ein Deck und `assets/tarot/gartenbrevier-v2/` fehlt.

**Fall B — nur lokal zurück:** `git switch --detach 6a3eee1`, danach `npm run build` (sonst bleibt `Lokal*.html` auf
dem neuen Stand). Kein Force-Push, keine Hostermigration, keine Änderung an der Pages-Konfiguration.

## 9. Beobachtungen ohne Blockwirkung

1. **CRLF im Arbeitsbaum vs. LF im Blob.** `Lokal.html`, `css/main.css`, `sitemap.xml`, `robots.txt` und das
   V2-`manifest.json` liegen auf diesem Windows-Rechner mit CRLF (bzw. das Manifest mit CRLF, während der Blob LF
   hat); ausgeliefert wird der Blob. Deshalb vergleicht die Live-Prüfung gegen `git cat-file blob HEAD:<datei>`.
   Inhaltlich identisch, JSON wird geparst, kein Test vergleicht Manifest-Bytes. Wer Hashwerte aus dem Arbeitsbaum
   mit der Produktion vergleicht, sieht hier sonst falsche Abweichungen.
2. **V1-Lizenzangabe ist knapp.** Die Fußnote nennt Quelle und Lizenz der Mineraltextur (CC BY-SA 4.0), sagt aber
   nicht ausdrücklich, dass die **bearbeitete Deckfassung** selbst unter CC BY-SA 4.0 steht (so das
   `QUELLEN-RECHTS-MANIFEST.md` wegen ShareAlike), und verlinkt die Lizenz nicht. Das Impressum hat keinen
   Tarot-Abschnitt. Für die Veröffentlichung ausreichend (Herkunft, Urheber, Lizenz benannt); eine Ergänzung wäre
   ein eigener Inhalts-/Rechtstext-Schritt und wurde hier **nicht** stillschweigend geändert, weil das den geprüften
   Stand verändert hätte. Als Folgekarte `t_b12d4d77` angelegt.
3. **Accessible Name der Radios** enthält die Badge ohne Leerzeichen („NachtatelierStandard 78 Karten · 3:5“), weil
   Badge und Name benachbarte Inline-Elemente sind. Screenreader verstehen den Sinn, die Trennung wäre aber sauberer
   (Folgekarte zusammen mit Punkt 2).
4. **320 px** hat weiterhin den vorbestehenden 4-px-Überlauf im Fieldset bzw. 19 px Dokumentüberlauf; außerhalb der
   Abnahmebreiten (375/768/1440) und nicht durch diese Änderung entstanden.
5. **Keine Druckfreigabe** — unverändert offen; die Karten sind Web-Derivate (sRGB, JPEG), kein CMYK/ICC-Proof.

## 10. Grenzen dieser Abnahme

- Nur Chromium (Playwright 1.64.1, headless); kein Firefox/Safari, kein Screenreader-Lauf (AX-Baum wurde im Review
  geprüft, hier nur Rollen/Fokusring/Statusmeldung), kein 200-%-Textzoom.
- Kontraste wurden in dieser Karte nicht neu berechnet; der Review hat 8,42–13,86 : 1 am identischen CSS gemessen
  (AA erfüllt). Ausgeliefertes `css/main.css` ist byte-identisch mit dem Commit.
- Live geprüft wurde der ausgelieferte Stand zum Zeitpunkt 05:15–05:25 UTC; spätere CDN-/Provider-Störungen sind
  nicht abgedeckt.
- Keine Nutzertests, keine neue Rechtsprüfung, keine Aussage über Druckqualität.

## 11. Belege

- `evidence/t_c8943c1e/pre-git-status.txt`, `pre-head.txt`, `pre-hashes.txt` — Zustand vor Beginn
- `evidence/t_c8943c1e/allowlist.json`, `allowlist.txt`, `staged-stat.txt`, `release-commit.txt`
- `evidence/t_c8943c1e/privacy-scan.json`
- `evidence/t_c8943c1e/logs/*.log`, `logs/gates.tsv` — alle Gates am veröffentlichten Baum
- `evidence/t_c8943c1e/live/live-http.json` — 474 Dateien, Manifeste, 14 Quellen, 404
- `evidence/t_c8943c1e/live/live-browser.json` — 3 Breiten, Wähler, Dialog, Zoom, Legung, Persistenz, Overflow
- `evidence/t_c8943c1e/live/shots/*.png` — 375/768/1440: Wähler mit V2, Zoom-Dialog, Reload mit gespeicherter Wahl
- `evidence/t_c8943c1e/pages-build-latest.json` — Pages-Build-Objekt
- `evidence/t_c8943c1e/summary.json` — maschinenlesbare Zusammenfassung
