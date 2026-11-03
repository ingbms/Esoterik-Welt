# CHECKPOINT RAD-13 — unabhängige Abnahme des Masterumfangs

| Feld | Wert |
| --- | --- |
| Paket | ESOW-RAD-13 — Qualitätskontrolle |
| Karte | `t_29535d62`, Master `t_878c59c7` (ESOW-RAD-000) |
| Prüfobjekt | `9bf5f73` auf `feature/radiasthesie-modul` |
| Prüfbaum | `C:/Users/mas/Arbeit/esow-qa-rad13` (detached, eigener Worktree, `npm ci`) |
| Stand | 2026-11-03, Prüfung abgeschlossen, **Bericht liegt vor** |
| Ergebnis | **NICHT ABGENOMMEN** — 1 × P2 (WCAG 1.4.1 `link-in-text-block`), 2 × P3 (Bildauflösung, `og:image`), 4 offene Prüfpunkte |

## 1. Was dieser Lauf tatsächlich ausgeführt hat

| Prüfblock | Umfang | Ergebnis |
| --- | --- | --- |
| Build/Lint/Format | `npm run build`, `lint`, `format:check` | je Exit 0 |
| Node-Suiten | 15 Suiten (Jest + `node --test`) | **249 Tests, 0 Fehler** (8 Tests in 2 Suiten umgebungsbedingt übersprungen: Preview/GitHub Pages) |
| Offline/Offline-Bundle | `build:local`, `tests/offline-file.cjs` | 2/2 |
| Build-Verifikation | `npm run verify:build` | 36/36 Seitenansichten, 7/7 statische Dokumente, Sitemap 11/11, 0 Fehler |
| Browsersuite | `CI=1 npx playwright test` (eigener Port) | **147/147, 0 übersprungen, 2,1 min** |
| Eigene Struktur-/SEO-Sonde | 8 HTML-Dokumente | 0 tote Links (604 Ziele), 0 Platzhalter, Titel 45–59 Zeichen, Canonical eindeutig, JSON-LD gültig |
| Eigene Browser-Sonde | 20 Ansichten × 320/375/768/1440 px | 80 Läufe: 0 Überlauf, 0 Konsolenfehler, 0 HTTP≥400, 0 externe Requests, 0 defekte Bilder, je 1 sichtbare H1 |
| axe-core 4.14.0 | 12 Ansichten | 1 Regelverstoß (`link-in-text-block`, serious) auf 7 Ansichten; 3 `color-contrast`-Fälle „incomplete“ |
| Tastatur/reduzierte Bewegung | 12 Ansichten | alle Bedienelemente erreichbar, 0 fehlende Fokusringe, max. Bewegungsdauer 0,01 ms |
| Sicherheit/Funktion | Journal-XSS, Studio-Import (ungültig/übergroß/hostil), SVG-Export, Journal-Löschung | alle abgewiesen/escaped, Löschung restlos |
| Statistik | 10 Fälle exakter Binomialtest + Wilson gegen BigInt-Referenz | max. Abweichung 2,0e-15, 0 Invariantenverstöße |

## 2. Urteil je Paket

01 Pass · 02 Pass · 03 Pass · 04 Pass (F1) · 05 Pass (F2) · 06 Pass · 07 Pass · 08 Pass · 09 Pass · 10 Pass · 11 Pass · 12 Pass (F3 offen) · 13 dieser Lauf · **14 offen (ausstehend)**.

## 3. Befunde

| ID | Schwere | Kurz | Ort |
| --- | --- | --- | --- |
| F1 | **P2** | Links im Fließtext nur farblich unterschieden (WCAG 1.4.1), axe `link-in-text-block` serious, 7/12 Ansichten (17/19 Knoten auf den Quellenseiten) | `css/radiasthesie.css` (Metazeilen/Linkklassen) |
| F2 | P3 | `<picture>`-`sizes` unterschätzt Layoutbreite: 520-px-Datei auf 680 CSS px (1,31×) | `radiasthesie/*.html`, SPA-Themenseiten |
| F3 | P3 | `og:image` fehlt in allen 8 Dokumenten (aus RAD-12 bekannte Lücke) | `<head>` aller Dokumente |
| F4 | offen | axe-`color-contrast` „incomplete“ (dekorative Glyphen, SVG-Text im Studio) nicht abschließend gerechnet | Studio-Vorschau, Buchstabenleiste |

## 4. Restpunkte

1. **F1 beheben** (Unterstreichung oder ≥ 3:1), dann **erneute Abnahme** — ohne diesen Schritt keine Freigabe.
2. F2: `sizes` an reale Layoutbreite anpassen und Messung wiederholen.
3. F3: `og:image` projektweit entscheiden (bewusst offen aus RAD-12, kein Fehler dieses Laufs).
4. Nicht geprüft und im Bericht §7 benannt: Lighthouse/Performance, echter Screenreader, Firefox/WebKit/Touch, zweiter Playwright-Vollauf, externes HTTP der Quellen, SPA-Fehleransicht (B3) und B11.
5. **Kein Gesamtabschluss**: RAD-14 (Dokumentation/Übergabe) ist ausstehend und verwendet diesen Bericht.

## 5. Nächster Schritt

Korrekturkarte für F1 (und optional F2) an eine Implementierungskarte; danach Nachtest genau dieser Punkte plus Regression der 147 Browsertests. Danach RAD-14.

## 6. Dateien dieses Laufs

```
docs/radiasthesie-completion/RAD-13/TESTBERICHT.md   (vollständiger Bericht)
docs/radiasthesie-completion/RAD-13/CHECKPOINT.md    (dieser Stand)
docs/radiasthesie-completion/RAD-13/evidence/*        (21 Gate-Logs, 6 JSON-Sonden, Playwright-Report)
docs/radiasthesie-completion/RAD-13/scripts/*         (7 eigene Prüfskripte, reproduzierbar)
```

Keine Produktionsdatei geändert, kein Push, kein Deployment, kein Eingriff in den gemeinsamen Arbeitsbaum.
