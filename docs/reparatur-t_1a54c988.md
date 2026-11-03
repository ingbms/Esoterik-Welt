# t_1a54c988 — Ansichts-`h1`, Titel pro Route, Light-Reserve, Titel-Hierarchie, Repo-Hygiene

Lokale Umsetzungsetappe im Repo `C:/Users/mas/Arbeit/Esoterik-Welt` (ingbms/Esoterik-Welt).
HEAD bleibt `24d8053ebc1bc4438a35a1c52b5d6f8c1718594e`; **kein Commit, kein Push, kein Deploy**, keine neuen Assets, keine bezahlten APIs.
Technische Freigabe bleibt t_676d2563, Release t_32e80593 — dieser Bericht ist keine Freigabe.

## 1. Ausgangslage (vor der Änderung selbst gemessen)

Messmatrix: 6 Routen × 3 Breiten (375/768/1440) × 2 Modi (HTTP-Preview `/Esoterik-Welt/` aus `dist/Esoterik-Welt`, echte Offline-Datei über `index.html` → `Lokal.html`) = 36 Ansichten, plus 4 Dokumente (Impressum, Datenschutz, Haftung, 404) × 3 Breiten × 2 Modi = 24 Dokumentmessungen. Chromium 156.

| Befund | Vorher |
|---|---|
| `h1` in der aktiven Ansicht | 6/36 Ansichten (nur `home`), 30/36 ohne; Accessibility-Tree (`Accessibility.getFullAXTree`) `h1` = 0 für tarot/crystals/moon/runes/blog |
| `document.title` | auf allen 6 Routen identisch (`Esoterik-Welt \| Tarot, Kristalle, Runen, Mondphasen & Mehr`) |
| `meta description` / `og:title` | ebenfalls route-unabhängig, behaupteten überall die Startseite |
| Überschriften-Sprünge (Ebenensprung > 1) | tarot 1× (`h2`→`h4` Footer), crystals 1× (`h2`→`h4`), übrige 0 |
| Rechtsseiten-`h1` | 22.5 px @375, 46.08 px @768, 56 px @1440 — kleiner als die Abschnitts-/Starttitel (33.75 px bzw. 56 px) und kleiner als die `h2` der Hauptseiten (40 px ab 1440) |
| 404-`h1` | 56 px auch @375 (V05-Abweichung) |
| `[data-theme="light"]` | 12 Tokens im Stylesheet, **kein** HTML/JS setzt `data-theme` → toter, unerreichbarer Zustand |
| `pages/`, `articles/` | leere Verzeichnisse, von keinem Build-/Testskript erwartet |
| Kontrast (composited, inkl. Gradientstops) | CTA-Minimum 5.01, Start-Titel 16.74 |

Rohdaten: `evidence/t_1a54c988/results-before.json`, `wrap-before.json`, `manifest-before.txt` (Hashes + `git status` vor Beginn).

**Methodikhinweis:** Die erste Zeilenmessung (Zeichen-y gerundet) erzeugte an Zeilenumbrüchen Phantome wie `"Datenschutze"/"rklärung"`. Ersetzt durch echte Zeilenboxen (`Range.getClientRects()`); maßgeblich für Titelumbrüche sind daher `wrap-before.json` / `wrap-after.json`.

## 2. Umsetzung

### N8 — genau eine sichtbare `h1` pro Ansicht, Titel pro Route
- `index.html`: Tarot, Kristalle, Mondphasen, Runen, Wissen tragen jetzt `h1.page-title` (vorher `h2`); Startseiten-`h1` ebenfalls `page-title`.
- Unterüberschriften der Ansichten auf `h2` gehoben (`Deine Ziehung`, `Monatsübersicht`, `Rituale für die aktuelle Phase`, `Deine Runen`, `Alle Runen des älteren Futhark`), damit kein Ebenensprung entsteht.
- Karten-/Gruppentitel eine Ebene angehoben (`js/modules/*.js`): Tarot-/Kristall-/Artikel-/Runenkarten `h2`, gezogene Karten und Wurfrunen `h3`, Ritualkarten `h3`, Runen-Deutung `h3`/`h4`, Runen-Verlauf `h2`, Kristall-Filtergruppen `h2`; Footer-Spalten `h2`. Die visuellen Größen bleiben unverändert, weil die Klassen (`.tarot-name`, `.crystal-name`, `.rune-name`, `.article-title`, `.ritual-title`) bzw. die Filter-/Footer-Regeln sie explizit setzen.
- `js/main.js`: `PAGE_META` + `applyRouteMeta()` setzen `document.title`, `meta[name=description]`, `og:title`, `og:description`, `twitter:title`, `twitter:description` bei jeder Routenänderung; Artikel-Deep-Links und kartengeöffnete Artikel setzen den Artikeltitel, Schließen/`history.back()` stellt den Listentitel wieder her. `og:url`/`canonical` bleiben unverändert (ein Dokument, keine erfundene Route-URL).
- Versteckte Ansichten bleiben über `hidden` (→ `display:none`) aus dem Baum: 0 px Höhe, nicht fokussierbar, im Accessibility-Tree nicht vorhanden.

### N10 — Light-Variante: als reserviert gekennzeichnet (Entscheidung des Auftrags)
- `css/design-system.css`: Block als `RESERVED — NOT A USER-REACHABLE STATE` kommentiert (kein Setter, kein Toggle, keine Speicherung, keine `prefers-color-scheme`-Regel, keine Kontrastfreigabe).
- `docs/design-tokens.md`: Abschnitt „Light-Reserve (bewusst nicht erreichbar)“ ersetzt die bisherige Anleitung `<html data-theme="light">`; `css/README.md` entsprechend präzisiert.
- Keine Theme-UI, keine neuen Nutzerzustände, keine Light-Kontrastaussagen.

### N11 — Rechtsseiten-Titel auf Hauptseiten-Niveau
- Neues Token `--text-page-title: clamp(var(--text-2xl), 9vw, var(--text-4xl))` im Design-System (33.75 px @375, 56 px ab ~623 px).
- Verwendet von `.page-title`, `.legal-content h1` und `.error-card h1`; die alte Rohwert-Regel `clamp(var(--text-xl), 6vw, var(--text-4xl))` und die doppelte `.hero h1`-Medienregel entfallen.
- `hyphens: auto` + `&shy;` in „Datenschutz&shy;erklärung“ bleiben erhalten; 404-Titel liegt jetzt auf derselben Stufe (behebt zugleich die V05-Größenabweichung).

### N12 — Repo-Hygiene
- `pages/` und `articles/` entfernt (leer, nicht versioniert). `scripts/build-pages.cjs` und `scripts/build-local.cjs` erwarten keinen der Pfade (geprüft, unverändert).

## 3. Nachmessung (Abnahme)

`evidence/t_1a54c988/verify.cjs` prüft 30 Kriterien gegen die Rohdaten: **30/30 bestanden, 0 Fehler**.

| Kriterium | Ergebnis |
|---|---|
| `h1` sichtbar je aktiver Ansicht | 36/36 = genau 1 |
| `h1` im Accessibility-Tree | 36/36 = genau 1, Name = Titel der aktiven Ansicht |
| Titel/Beschreibung pro Route | 6/6 eindeutig in HTTP **und** `file://` (live-Navigation: 6/6 unique) |
| Artikel-Route-Metadaten | 4/4 offen (Deep-Link + Kartenklick) setzen Artikeltitel; 4/4 nach Schließen/Zurück wieder Listentitel |
| Überschriften-Sprünge | 0 in 36/36 Ansichten (vorher tarot/crystals je 1) |
| Versteckte Ansichten | max. 0 px, nicht fokussierbar; nur die aktive `h1` ist fokussierbar |
| Rechtsseiten-`h1` | 33.75 / 56 / 56 px = exakt die Größe der Hauptseiten-Titel; Token statt Rohwert |
| Titel-Umbruch @375 | „Datenschutz­-/erklärung“, „Haftungs-/ausschluss“; 0 Einzelzeichenzeilen, 0 Überlauf |
| N5 Tarot | 78 Namen, 0 Einzelzeichenzeilen, 0 Clipping (4/4 Läufe) |
| Overflow | 0 Dokument-, 0 Elementüberläufe in 36/36 |
| Kontrast composited | Minimum 5.01 (CTA) unverändert; Titel 16.74 |
| Kaltstart | `scrollY` 0, verborgene Pixel 0, Titel unter dem Header (6/6) |
| Skip-Link (echte Enter-Taste) | 6/6 Inhalt bleibt, `main` fokussiert |
| Laufzeit | 0 `pageerror`, 0 `console.error` |
| Bestandstest | `npm run test:pages` 6/6 |

## 4. Geänderte Dateien (11)

`index.html`, `css/main.css`, `css/design-system.css`, `css/README.md`, `js/main.js`, `js/modules/blog.js`, `js/modules/crystals.js`, `js/modules/moon.js`, `js/modules/runes.js`, `js/modules/tarot.js`, `docs/design-tokens.md`.
Nur über den bestehenden Build erzeugt: `dist/Esoterik-Welt/**`, `Lokal*.html`.
Hashes vorher/nachher: `evidence/t_1a54c988/product-delta.json`; keine der Dateien wurde committet.

## 5. Grenzen und offene Punkte

- Nur Chromium 156 / Windows; kein Safari, Firefox, Realgerät, Zoom, Print, Performance-Lauf. Keine axe-/WCAG-Zertifizierung — die `h1`-Aussagen stützen sich auf den Chromium-Accessibility-Tree.
- Route-spezifische Titel/Beschreibungen werden clientseitig gesetzt; Crawler ohne JS sehen weiterhin die Startseiten-Metadaten (Hash-Routen sind keine eigenen Dokumente).
- Mit geladener Display-Schrift bricht der Datenschutz-Titel bei 768 px zweizeilig (ohne Webload einzeilig) — beide Varianten ohne Einzelzeichenzeile und ohne Überlauf.
- Der 404-Titel ist jetzt bewusst auf dem gemeinsamen Titel-Niveau (vorher 56 px @375); das ist eine sichtbare Änderung außerhalb der Rechtsseiten, aber genau die N11-Angleichung der Dokumenttypen.
- Footer-Spalten und Kristall-Filterlabels sind jetzt `h2` (Semantik), optisch unverändert.
- Der Light-Block bleibt als dokumentierte Reserve im Stylesheet; er ist weiterhin kein Nutzerzustand.
- **Parallelaktivität im Repo:** Während dieser Karte hat ein anderer Lauf im selben Arbeitsverzeichnis geschrieben (u. a. `.prettierrc.json`, `.prettierignore`, `package.json`-Skripte `lint`/`format:check`, `.gitignore`, `.github/workflows/ci.yml`, `docs/astrologie-konzept/**`, `docs/tarot-deck-nachtatelier/**`). Diese Änderungen stammen nicht aus dieser Karte und wurden nicht bewertet oder zurückgesetzt. Der gemessene Zustand ist über die Hashes in `results-after.json`, `product-delta.json` und `wrap-after.json` gepinnt; `dist/Esoterik-Welt/**` war zum Messzeitpunkt bytegleich zu den Quellen.

## 6. Evidenz

Verzeichnis `evidence/t_1a54c988/`:

- `manifest-before.txt` — `git status` + SHA-256 vor Beginn
- `results-before.json`, `results-after.json` — 36 Ansichten, 24 Dokumente, Tarot-Wrap, Kaltstarts, Skip-Läufe, Kontrast, AX-Baum
- `wrap-before.json`, `wrap-after.json` — Titelumbrüche der Rechts-/Fehlerseiten (echte Zeilenboxen)
- `article-meta.json` — Routen-Metadaten inkl. Artikel-Deep-Links, Schließen, Zurück, unbekannte Route
- `checks.json` (30 Kriterien), `summary.json` (kompakt), `summary.txt`, `product-delta.json`
- `snapshot-before/` — Quellstand vor der Änderung (Vergleichsbasis)
- `before-*.png` / `after-*.png` — Vorher/Nachher je Route (375/1440, HTTP und Datei) und je Rechtsseite (375)
- Skripte: `measure.cjs`, `wrap-check.cjs`, `article-meta.cjs`, `verify.cjs`, `summary.cjs`, `product-delta.cjs` sowie die Diagnose-Proben `probe-*.cjs`

Reproduktion:

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
npm run build                                   # erzeugt dist/ + Lokal*.html
PHASE=after node evidence/t_1a54c988/measure.cjs
node evidence/t_1a54c988/wrap-check.cjs dist/Esoterik-Welt after http,file
node evidence/t_1a54c988/article-meta.cjs
node evidence/t_1a54c988/verify.cjs             # 30/30
```
