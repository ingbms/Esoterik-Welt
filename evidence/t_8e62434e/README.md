# Evidenz `t_8e62434e` — Testinfrastruktur m-3 / m-4 / m-5

Prüfumgebung: Windows 11, Node v24.13.0, npm 11.8.0, `core.autocrlf=true`,
Arbeitsbaum `C:/Users/mas/Arbeit/Esoterik-Welt-testinfra`
(Branch `chore/frequenzlabor-testinfra`, Basis `fix/frequenzlabor-qa-m1` @ `71b895c`).

## m-3 — fremder Server auf 3100 / Portkollision

Der Nachweis braucht einen fremden Server, der sich wie ein Vorschau-Server verhält
(`/api/health` → 200, sonst fremder Inhalt). Das Skript liegt bei:
`evidence/t_8e62434e/fremder-server.cjs`.

```bash
node evidence/t_8e62434e/fremder-server.cjs 3100 &   # fremder Server auf dem alten Vorschau-Port
curl -s http://127.0.0.1:3100/api/health             # {"status":"ok","service":"fremder-vorschauserver"}
npm run test:e2e                                     # -> 89/89 auf 3310 (e2e-final-89.txt)
```

Die Zeile `[WebServer] [e2e-server] exklusiv auf http://127.0.0.1:3310/Esoterik-Welt/ (kein Server-Reuse)`
im Protokoll belegt, dass die Suite gegen den eigenen Build lief und nicht gegen 3100.

Kollision auf dem **Testport** (gleiches Skript auf 3310 gestartet):

| Lauf | Ergebnis | Protokoll |
| --- | --- | --- |
| `npx playwright test` | `Error: http://127.0.0.1:3310/api/health is already used …`, Exit 1, kein Test gestartet | `protokolle/e2e-m3-portkollision.txt` |
| `E2E_PORT=3310 node scripts/serve-e2e.cjs` | `[e2e-server] ✗ Port 3310 ist bereits belegt …`, Exit 1 | `protokolle/e2e-m3-waechter-kollision.txt` |
| fremder Server danach | antwortet unverändert | `protokolle/e2e-m3-fremder-server-3310-unveraendert.txt` |

## m-4 — CRLF im Tarot-Hash

`npm run test:tarot:decks` → `protokolle/tarot-decks-12-12.txt` (12/12, Exit 0).
Vor dem Fix: 11/12; der Fehlschlag war `V1 deck is untouched …`,
Roh-Hash `f50f46ef…` (CRLF) gegen erwartet `e3d0548a…` (LF), `git ls-files --eol`
zeigte `i/lf w/crlf`.

## m-5 — Budgetwarnung

`npm run check:frequenz-budget` → `protokolle/budget-warnung.txt`:
NFR-1 `WARN` 85 613 / 86 275 B (99,2 %, Reserve 662 B), NFR-2 28 167 / 100 000 B,
NFR-3 2 903 / 6 000 B, Exit 0.

## Weitere Läufe

`protokolle/lint-prettier-suites.txt` — `npm run lint` (0), `npm run format:check` (sauber),
`npm run test:frequenz` (34/34), `npm run test:pages` (6/6).
