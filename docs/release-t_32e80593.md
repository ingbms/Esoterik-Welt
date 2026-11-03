# Release t_32e80593 — Esoterik-Welt: geprüfte Reparaturen veröffentlicht und live abgenommen

Stand: 2026-11-02 (UTC+1), Scope: ausschließlich `C:/Users/mas/Arbeit/Esoterik-Welt`, Remote `ingbms/Esoterik-Welt`.

## Ergebnis

Die Reparaturen aus `t_44b8b6dd`, `t_b5861420`, `t_774c3023`, `t_1a54c988`, `t_62b99637` (technische Gesamtfreigabe `t_676d2563-r2`, positiv) sind auf `main` veröffentlicht und auf der Live-Site byte-identisch abgenommen.

| Punkt | Wert |
| --- | --- |
| Produktions-SHA | `1f2726ceb660a01e63d97cacfaad1e730cae1d7d` |
| Site-Commit (58 Dateien) | `3e5cc33050617385fcce5e9d411ba682b62658b4` |
| CI-Gate-Commit (2 Dateien) | `1f2726ceb660a01e63d97cacfaad1e730cae1d7d` |
| Live-URL | https://ingbms.github.io/Esoterik-Welt/ |
| CI-Lauf (grün) | 41355636870 — Lint, Unit Tests, Static Build, Browser E2E alle `success` |
| Commit-Statuses | `ci/lint`, `ci/unit-test`, `ci/build`, `ci/browser-e2e` → `success` |
| Pages-Deploy | `pages-build-deployment` 41355636378 → `success` |
| Vorheriger grüner Stand (Rollback) | `24d8053ebc1bc4438a35a1c52b5d6f8c1718594e` |

## Was der abgebrochene Worker-Lauf offen ließ — und warum die Karte blockiert war

Der Lauf von `coding_debug` (Run 252) hat den Allowlist-Commit `3e5cc33` erstellt und erfolgreich gepusht, dann ist der Prozess an einem Gateway-/Owner-Verbindungsfehler gestorben (`pid 41776 exit 1: Kanban owner refused: Gateway connection failed`). Der Dispatcher hat nach zwei Fehlversuchen aufgegeben (`gave_up`, 2/2) → Karte `blocked`. Das war **kein fachlicher Blocker**, sondern ein Infrastruktur-Abbruch.

Tatsächlicher Zustand bei Wiederaufnahme: Push war durch, Pages-Deploy war durch, aber der vorgeschriebene Pflicht-CI-Lauf `41351766673` auf `3e5cc33` war **rot**:

1. **Lint-Job rot** — `prettier --check` scheiterte an `js/modules/_tarot_old.js`.
   Ursache: Die Datei ist ein Altmodul, das `scripts/build-pages.cjs` über die `_`-Präfix-Konvention ohnehin aus dem Build filtert (nicht ausgeliefert). Die lokale Prettier-Formatierung aus `t_62b99637` war nicht Teil der Release-Allowlist, also lagen im Commit weiter die historischen Bytes — lokal grün, auf dem frischen Checkout rot. Diesen Widerspruch hat der Gesamt-QA-Lauf nicht gesehen, weil er auf dem formatierten Arbeitsbaum maß.
2. **Unit-Test-Job rot** — `jest` `GET / should serve index.html`: `expected 200 "OK", got 404`.
   Ursache: `index.js` bedient `/` aus `dist/Esoterik-Welt/`. `dist/` ist gitignored und existiert auf einem frischen CI-Checkout nicht; lokal lag ein Build herum, deshalb war der Test dort grün.
3. Build- und Browser-E2E-Jobs wurden wegen `needs: [unit-test]` gar nicht erst gestartet (`skipped`) — der 56er-Playwright-Lauf war in CI also nie belegt.

Beide Ursachen wurden auf dem gepushten Baum reproduziert (4/4: rot ohne Fix, grün mit Fix) und dann behoben:

- `.prettierignore`: `js/modules/_tarot_old.js` ausgenommen, mit Begründung im Dateikommentar (Build-Konvention + Schutz der historischen Bytes, die Evidence-Baselines als geschützte Datei hashen — Hash `068d0027…` bleibt unverändert).
- `.github/workflows/ci.yml`, Job `unit-test`: `npm run build` vor `npm test`, weil die API-Tests den Preview-Server gegen `dist/` prüfen.

Kein Force-Push, keine History-Umschreibung, keine Hostermigration, keine Testdeaktivierung.

## Prüfliste (real gemessen, nicht behauptet)

Lokal auf dem Release-Baum:

| Gate | Ergebnis |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm run format:check` | exit 0 |
| `npm test` (Jest) | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` (echtes `file://`) | 2/2 |
| `npm run verify:build` | 30 Seiten/Viewports, 0 Fehler |
| `npm run test:e2e` (Playwright) | 56/56 |
| Reproduktion ohne Fix | Jest 1 failed/1 passed, format:check 1 Datei rot |

CI auf dem veröffentlichten SHA: alle vier Jobs `success`, alle vier Commit-Statuses `success`, Pages-Deploy `success`.

Live-Abnahme (`evidence/t_32e80593/live-final/`): 18/18 Ansichten (6 Routen × 375/768/1440) fehlerfrei, 0 `pageerror`, 0 fehlgeschlagene Requests, je genau eine sichtbare `h1`, kein Kartenüberlauf, Stylesheet geladen; Artikel-Deeplink `#blog/1` öffnet den Dialog mit echtem Inhalt (755 Zeichen, 2 Absätze, kein Rohmarkdown); Skip-Link setzt Fokus auf `main` ohne Inhaltsverlust; unbekannte Route zeigt Seite + ehrliche Meldung; Sitemap 4 kanonische Dokumente am richtigen Origin ohne Fragmente; `robots.txt` mit korrekter Sitemap-Zeile.

Byte-Abgleich veröffentlicht vs. `HEAD` (cache-busted, SHA-256 identisch): `index.html`, `css/main.css`, `js/main.js`, `js/article-content.js`, `js/dialog.js`, `data/crystals.json`, `data/moon-phases.js`, `sitemap.xml`, `robots.txt`, `404.html`, `datenschutz.html`, `impressum.html`, `haftung.html` — 13/13 `MATCH`.

Sichtprüfung (Bildsicht): Startseite 375 px vollständig gestylt (Nachtatelier-Palette, Header, Hero, CTAs), Artikel-Dialog mit strukturiertem Text.

## Allowlist und geschützte Reste

- `3e5cc33`: 58 Dateien, exakt die in `evidence/t_32e80593/release-summary.json` gelistete Allowlist (Produktdateien, `Lokal*.html`-Builds, geprüfte CI-/Testdateien; Entfernung der fremden `hermes-adaptive-router`-Deploy-Workflows, in der History erhalten).
- `1f2726c`: ausschließlich `.prettierignore` und `.github/workflows/ci.yml`.
- Bewusst **nicht** committet (fremde/unfertige Arbeit bleibt unangetastet): 30 Einträge, u. a. `docs/ci-cd-pipeline.md`, `docs/design-tokens.md`, `js/modules/_tarot_old.js` (lokale Formatierung), `build-local.cjs` im Root, sämtliche `docs/*`-Review-/Stilpaketordner und `evidence/`. Vollständige Liste in `release-summary.json → protected_rest`.
- Nicht enthalten: Nachtatelier-/Deck-V2-/Feature-Dateien (separate Karten), keine privaten Daten, keine neuen Bild-Assets, keine OG-Bildmetas (bewusst entfernt statt 404-Verweis).

## Rollback

`git revert 1f2726c 3e5cc33 && git push origin main` — Pages baut `main` automatisch neu. Alternativ `git revert` auf `24d8053` zurücksetzen; beide Commits bleiben in der History, kein Force-Push nötig.

## Grenzen

Chromium-only (Windows lokal, ubuntu-latest in CI), kein Safari/Firefox/Realgerät, keine Lighthouse-/Performance-/CLS-Messung, kein WCAG-Zertifikat (Axe-Befund `label-content-name-mismatch` vorbestehend), Light-Theme bleibt bewusst reserviert, CI-Annotation zur Node-20-Abkündigung der Action-Versionen ist nicht blockierend. Druckfreigabe nicht impliziert.

## Belege

- `evidence/t_32e80593/release-summary.json` (maschinenlesbar: SHAs, CI-Läufe, Statuses, Hash-Abgleich, Live-Abnahme, Allowlist, Rollback)
- `evidence/t_32e80593/live-final/live-acceptance.json` + `live-final/shots/*.png` (Live-Abnahme nach dem frischen Deploy)
- `evidence/t_32e80593/live/` (Abnahme des ersten Deploy-Stands, unverändert erhalten)
- `docs/qa-t_676d2563-r2.md`, `docs/reparatur-t_44b8b6dd.md`, `docs/reparatur-t_b5861420.md`, `docs/ci-runner-t_774c3023.md`, `docs/reparatur-t_1a54c988.md`, `docs/t_62b99637.md` (vorgelagerte Gate-Belege)
