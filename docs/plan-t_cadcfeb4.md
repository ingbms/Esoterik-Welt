# Änderungsplan t_cadcfeb4 — Esoterik-Welt CI/Deploy-Bereinigung

## Istzustand (verifiziert am Workspace C:/Users/mas/Arbeit/Esoterik-Welt)

- Repo: ingbms/Esoterik-Welt (privat)
- Produktion: GitHub Pages legacy `main:/` (URL https://ingbms.github.io/Esoterik-Welt/), kein SSH/Container/Vercel
- Bestehende Pipeline (grün bei t_9ff78898): `scripts/build-pages.cjs` → statischer Build; `tests/pages-regression.cjs` (node:test); `jest` (Tests); Playwright für Browser-Checks; `index.js` (Express-Server für lokale Vorschau)
- Neu hinzugefügte fachfremde Dateien (alle vom Plugin hermes-adaptive-router):
  - `.github/workflows/ci.yml` — TypeScript (`.ts,.tsx`), Vitest, Prettier mit `**/*.{ts,tsx}` (Project hat kein TS), `npm run build -- --mode production` (falsche Flags), Slack/Discord-Notifikationen mit `secrets.SLACK_WEBHOOK_URL`, `secrets.DISCORD_WEBHOOK_URL`, Referenz auf `ingbms/hermes-adaptive-router`; `|| true` bei Rollback/SSH
  - `.github/workflows/deploy-staging.yml` — Python-Build (`python -m build`), SSH-Deploy (`secrets.SSH_KEY`, `secrets.STAGING_HOST`), Vercel (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`), Staging-URL auf `.local`, Rollback mit `|| true`
  - `.github/workflows/deploy-production.yml` — Python-Build, SSH-Deploy (`secrets.PROD_HOST`), geschützte Umgebung (`production` env approval), Benchmark (`adaptive_router.quality_engine`), Slack/Discord, `|| true`
  - `.github/workflows/test-broken-notification.yml` — absichtlich kaputt, nur für Notifikations-Test
  - `docs/ci-cd-pipeline.md` — Plugin-Pipeline-Spezifikation (258 Zeilen)

- Rot vor Reparatur:
  - CI-Run 41155213391: 28 Prettier-Abweichungen (Dateien passen nicht zum Pattern `.ts,.tsx`); TypeScript/Vitest passen nicht zu Jest/Browser-Projekt
  - Staging-Run 41155213425: SSH/Vercel-Secrets nicht gesetzt, Python-Build schlägt fehl

- Keine Secrets (SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL, SSH_KEY, STAGING_HOST, PROD_HOST, VERCEL_TOKEN) im Repo verfügbar; Aufgabe verbietet Nutzung von Secrets/paid APIs.
- Keine Migration auf neue Hoster; bestehende Pages-Pipeline und Produktiv-URL (`https://ingbms.github.io/Esoterik-Welt/`) erhalten.

## Anforderungen (aus Kanban-Task und Eltern-Handoff t_9ff78898)

1. Tatsächliche Website-CI/Deploy-Anforderungen klären und dokumentieren.
2. Fachfremde Schritte ersetzen oder sauber separieren (keine Vermischung mit Plugin-Dateien).
3. Reale Tests/Build prüfen (`jest`, `node --test`, `scripts/build-pages.cjs`, `scripts/verify-pages.cjs`, Playwright).
4. Keine Gates mit `|| true` umgehen (fehlgeschlagene Tests dürfen nicht als Erfolg gewertet werden).
5. Bestehende Pages-Pipeline und Produktions-URL bewahren.
6. Keine neuen Hoster (kein Vercel-Container-Deploy, kein SSH-Staging).
7. Keine großflächige Formatierung nebenbei (nur gezielte Änderungen an Workflow-Dateien und Dokumentation).

## Änderungsplan

### Phase 1: Dokumentation (sofort)
- Diese Datei (`docs/plan-t_cadcfeb4.md`) erstellen und als Nachweis ablegen.
- Bestehende `docs/ci-cd-pipeline.md` (Plugin-Spezifikation) als referenzierte, aber fachfremde Spezifikation kennzeichnen (z. B. durch Hinweis-Header oder Umbennen), nicht als aktive Pipeline für dieses Repo nutzen.

### Phase 2: CI-Workflow (`.github/workflows/ci.yml`)
- Ersetzen durch einen Workflow, der zur tatsächlichen Website passt:
  - `lint`: ESLint/Prettier nur für `.js`/`.cjs` und `.html` (wenn Prettier konfiguriert); kein `|| true` bei ESLint; kein TypeScript (`.ts`/`.tsx`)
  - `typecheck`: Entweder entfernen (kein TypeScript-Projekt) oder als leere/nicht-relevante Prüfung kennzeichnen (nicht als Gate erzwingen)
  - `unit-test`: `npm test` (Jest) statt Vitest; `tests/pages-regression.cjs` als `node --test` (separat oder zusätzlich); keine Coverage-Artifact-Pflicht
  - `build`: `npm run build` (ohne `--mode production`) oder `node scripts/build-pages.cjs`; Erfolg prüfen, kein `|| true`
  - `notify`: Slack/Discord-Notifikationen entfernen oder als optional kennzeichnen (da keine Secrets verfügbar und Aufgabe dies verbietet)
  - Status-Posting (`github-script`) beibehalten, wenn relevant, aber ohne Plugin-Referenzen (`hermes-adaptive-router` ersetzen durch `Esoterik-Welt`)

### Phase 3: Staging- und Produktions-Deploy (`.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-production.yml`)
- Da Produktion GitHub Pages (`main:/`) ist und kein SSH/Container/Vercel-Staging benötigt wird:
  - Option A (bevorzugt): Dateien als fachfremd kennzeichnen und nicht als aktive Workflows im Repo belassen; stattdessen als Referenz-Notiz (`docs/deploy-ref-plugin.md`) archivieren
  - Option B (falls Referenz erhalten bleiben soll): Dateien umbenennen zu `.github/workflows/deploy-staging-ref.yml` (inaktiv, nicht als Workflow ausgeführt) oder in `docs/` verschieben
- Keine `secrets.SSH_KEY`, `secrets.STAGING_HOST`, `VERCEL_TOKEN`, `PROD_HOST` als Pflicht im Workflow
- Kein `python -m build`, kein `dashboard/`-Build
- Kein `|| true` in Rollback-Schritten; Rollback entweder explizit als manuelle Prüfung dokumentieren oder als separaten Referenzschritt (nicht als automatischer Erfolg)

### Phase 4: Bereinigung und Verifikation
- `test-broken-notification.yml`: Löschen oder als inaktiv kennzeichnen (kein Broken-Workflow als Pflicht)
- `docs/ci-cd-pipeline.md`: Hinweis hinzufügen, dass diese Datei die Plugin-Architektur beschreibt und nicht die aktive Website-Pipeline ist
- Reale Tests/Build prüfen (lokal und in CI): `npm test`, `npm run test:pages`, `node scripts/build-pages.cjs`, `node scripts/verify-pages.cjs`
- Keine neuen Abhängigkeiten hinzufügen, keine Massenformatierung durchführen
- Keine Migration auf neue Hoster; keine Änderung der GitHub Pages-Quelle (`main:/`)

## Offene Risiken

- Vorbestehende 39 Dependency-Vulnerabilities (unverändert; keine Massenaktualisierung gemäß Aufgabe)
- Keine unabhängige visuelle Review durch diesen Worker; nur automatisierte Regression (Jest/Playwright) und Build-Prüfung
- Keine echte SSH/Vercel-Umgebung für Staging; wenn später ein echtes Staging benötigt wird, muss ein separater Workflow für dieses spezifische Projekt erstellt werden (nicht vom Plugin übernommen)

## Nachweis der Prüfung

Nach Umsetzung: Commit mit geändertem Zustand und Verifikationsergebnis (Build/Test-Ergebnis) als Nachweis ablegen. Keine erfundenen Testergebnisse; echte Ausführung von `npm test` und `npm run build` dokumentieren.
