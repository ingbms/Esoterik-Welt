# Nachabnahme und RAD-14-Wiederaufnahme

**Kandidat:** `ceddc84cfca44d53f1995dfd0981b7d70a554724`.
**Fix:** `b420a79994b61761715d4c12dd4c241ae43ada28`.
**Erste Übergabe:** `1f78942` (die zwischenzeitlichen Amend-Hashes sind überholt).
**Datum:** 3. November 2026.

## 1. Bestätigtes unabhängiges Reviewer-Verdikt

Quelle: [REVIEW-F1-F2.md](evidence/REVIEW-F1-F2.md), Karte `t_b1641fc1`.

> Urteil: F1/F2 freigegeben. Keine Gesamt- oder Veröffentlichungsfreigabe. RAD-14 bleibt offen.

Die ursprüngliche Vollumfangsprüfung [RAD-13](../RAD-13/TESTBERICHT.md)
auf `9bf5f73` bleibt als historisches **NICHT ABGENOMMEN** erhalten. Der spätere
Review bestätigt gezielt, dass F1 und F2 behoben sind. Daraus wird kein neues,
vom Reviewer nie ausgesprochenes Gesamtverdikt konstruiert.

| Prüfbereich | Unabhängig bestätigtes Ergebnis auf dem Kandidaten |
| --- | --- |
| F1, axe-core 4.14.0 | 16 Ansichten × 2 Breiten = 32 Läufe, 0 Verstöße; 372 tatsächlich unterstrichene Linkinstanzen |
| F2, Bildmessung | 6 Routen × 10 Breiten = 60 Läufe, 120 geladene Fotos, alle 6 Motive; 0 IMG-RES, 0 echte Hochskalierung, 0 Überlauf (DPR 1) |
| `test:all` | Exit 0: Jest 2/2, Node 242/242, Playwright 147/147, 0 Fehler/übersprungen/flaky |
| Weitere Gates | frisches npm ci, Build, Lint, Format; verify:build 36/36 + 7/7 grün |
| Browser | Chromium headless 156.0.8078.4; 0 pageerror / requestfailed |
| Arbeitsbaum | isolierter Reviewer-Checkout abschließend sauber; gemeinsamer Implementierungsbaum ausdrücklich nicht sauber |

Die Begrenzung von `rad-media-03` auf 520 CSS px ist ausdrücklich akzeptiert,
weil nur die 520er-Webvariante verfügbar ist. Die teilweise konservative
`sizes`-Formel erzeugt im geprüften Bereich keine zu kleine Bildauswahl.

[Originale Review-Evidenz](evidence/RAD-13-F1-F2-REVIEW-EVIDENZ.zip): 47 Einträge,
ZIP-Integrität erneut geprüft, SHA-256
`398fac79e6579d5ecfee15a58f8fa093aa1e0dea220ef94361c2546f5dd99684`.
Bericht und Archiv sind unverändert aus dem dauerhaften Kartenanhang übernommen.

## 2. RAD-14 hat den Kandidaten erneut ausgeführt

Windows 11 / Git Bash, Node v24.13.0, npm 11.8.0. Eigener detached Prüfbaum
`C:/Users/mas/AppData/Local/hermes/cache/scratch/rad14-v2` auf der SHA oben.
TMP/TEMP/TMPDIR explizit `C:/Users/mas/AppData/Local/hermes/cache/scratch`.
Bestehendes `node_modules` per Junction mitbenutzt, **kein frisches npm ci** in
diesem Autorenlauf; dieses ist nur durch den unabhängigen Review belegt.
Port 39641 vor Browserstart durch TCP-Bind-Versuch als frei geprüft, `CI=1`.
Keine Testdatei geändert, keine Fehler durch Ausgabe-Pipes maskiert.

| Lauf | Exit | Tatsächliches Ergebnis | Rohbeleg |
| --- | --- | --- | --- |
| Lint / Format / Build / verify:build | jeweils 0 | 0 Lintfehler; Format konform; 7 Dokumente, Sitemap 11; 36/36 + 7/7 | [gates.log](evidence/recheck/gates.log) |
| 7 Radiästhesie-Node-Suiten | 0 | 167/167, 0 Fehler/übersprungen (25 allgemein, 14 statisch, 20 Verträge, 21 Simulator, 37 Studio, 24 Experiment, 26 Journal) | [gates.log](evidence/recheck/gates.log) |
| `CI=1 E2E_PORT=39641 npm run test:all`, erster Versuch | **1** | Tarot-Tastaturtest: Fokus nach Escape, `waitForFunction` Timeout 2000 ms, Kette abgebrochen | [testall-first.log](evidence/recheck/testall-first.log) |
| `npm run test:tarot`, zwei unveränderte Wiederholungen | 0 / 0 | jeweils 11/11 | [tarot-1.log](evidence/recheck/tarot-1.log), [tarot-2.log](evidence/recheck/tarot-2.log) |
| Tarot-Decks / Mond / Offline einzeln | jeweils 0 | 12/12, 14/14, 2/2 | [rest.log](evidence/recheck/rest.log) |
| zusätzliche Playwright-Suite | 0 | 147/147, 2,1 min | [playwright.log](evidence/recheck/playwright.log) |
| vollständiger `test:all`-Wiederholungslauf | **0** | Jest 2/2, Node 242/242, Playwright 147/147 (2,2 min), 0 Fehler/übersprungen | [testall-retry.log](evidence/recheck/testall-retry.log) |

Der zweite grüne Gesamtlauf löscht den ersten Fehler nicht. Nachfolgekarte
`t_73ccd862` (`tester`) untersucht den sporadischen Tarot-Fokus-Timeout; RAD-14
ändert dafür weder Produktcode noch Testbedingungen. Keine Behauptung dauerhafter
Fehlerfreiheit aus einem einzelnen grünen Lauf.

## 3. Reproduzierbare Befehle

```bash
# In einem neuen eigenen Prüfbaum auf dem Kandidaten:
export TMPDIR=C:/Users/mas/AppData/Local/hermes/cache/scratch
export TEMP=$TMPDIR TMP=$TMPDIR
npm ci
npm run lint
npm run format:check
npm run build
# Freien Port vorab durch Bind-Versuch bestätigen, Beispiel aus dem Autorenlauf:
CI=1 E2E_PORT=39641 npm run test:all
npm run verify:build

# Im Arbeitsbaum der aktualisierten Übergabe:
node docs/radiasthesie-completion/RAD-14/scripts/build-uebersichten.cjs
python docs/radiasthesie-completion/RAD-14/scripts/verify-handoff.py
```

`CI=1` ist wichtig: `E2E_PORT` allein verhindert keine Fremdserver-Wiederverwendung.
Die Prüfskripte/Portermittlung des unabhängigen Reviews liegen zusätzlich im ZIP.

## 4. Verbleibende Grenzen und Provenienz

- F3/B7 (`og:image`), B11 und die bisherigen Nicht-F1/F2-Restpunkte sind nicht
  stillschweigend erledigt. Lizenz-/Datenschutz-/CI-Entscheidungen bleiben offen.
- `color-contrast incomplete` ist keine vollständige WCAG-AA-Freigabe. Kein neuer
  echter Screenreader-, Firefox/WebKit/Safari-/Touch-/DPR>1- oder Lighthouse-Test.
- Kein erneuter externer Quellenabruf; keine neue Datenschutz-/Sicherheitsfreigabe.
  Der unabhängige `npm ci`-Lauf meldete 43 Audit-Hinweise; keine Paketänderung.
- Im gemeinsamen Baum bleiben sieben geänderte versionierte PDF/PNG-Dateien aus
  RAD-08…10 und unversioniertes `evidence/`. Tests schreiben selbst dieselben
  Ziele; pauschale Herkunft „fremd“ ist nicht belegt. Nichts davon wurde bereinigt,
  gestaged oder in die neue Übergabe übernommen.
- Keine Veröffentlichung, kein Push, kein Deployment. Der bestehende Master
  entscheidet nach belegter DoD aller 14 Pakete; diese Karte schließt ihn nicht.
- Laufzeitmodell: Start `deepseek-flash/deepseek` gemäß Kartenvorgabe; laut
  Betreiberhinweis vom 03.11.2026 nach zwei DeepSeek-HTTP-503 die eingebaute
  Fallback-Kette um 10:52:19 auf `gpt-6.1-sol/openai-codex` (ChatGPT-Abonnement,
  keine OpenAI-API-Abrechnung). Keine Modelländerung an der Karte, keine
  Profilkonfiguration geändert und keine eigenständige Eskalation ausgelöst.
