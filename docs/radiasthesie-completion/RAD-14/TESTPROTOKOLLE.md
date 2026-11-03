# Testprotokolle

**Aktueller geprüfter Kandidat:** `ceddc84cfca44d53f1995dfd0981b7d70a554724`, Branch `feature/radiasthesie-modul`. Der erste Dokumentationslauf unten gilt historisch für `5fe5301`; aktuelle Nachtests und Reviewer-Verdikt sind getrennt in §2 und [NACHABNAHME.md](NACHABNAHME.md) belegt.
**Vollständig qualifizierter historischer Laufkontext (`5fe5301`):** Windows 11 · Node v24.13.0 · npm 11.8.0 · Chromium 155 (Playwright 1.64) · `TMPDIR=TEMP=TMP=C:/Users/mas/AppData/Local/hermes/cache/scratch` · `CI=1 E2E_PORT=3455`.

Die Tabelle des Erstlaufs ist historisch. Aktuelle §2-Läufe und der unabhängige
Review sind zusätzlich mit Rohlogs in NACHABNAHME.md belegt. Exitcodes wurden
nicht durch Pipes maskiert. §3 beschreibt die ursprüngliche Prüfung, §4 die
Paketnachweise, §5 die historischen Prüfgrenzen.

## 1. Reproduktion

```bash
cd C:/Users/mas/Arbeit/esow-rad-t_878c59c7
export TMPDIR=C:/Users/mas/AppData/Local/hermes/cache/scratch
export TEMP=$TMPDIR TMP=$TMPDIR

npm run lint                                   # ESLint, 0 Warnungen erlaubt
node --test tests/radiasthesie.mjs \
            tests/radiasthesie-vertraege.mjs \
            tests/radiasthesie-simulator.mjs \
            tests/pendeltafel-studio.mjs \
            tests/experiment-statistik.mjs \
            tests/journal-speicher.mjs \
            tests/radiasthesie-statisch.mjs    # 164 Tests
npm run build                                  # 7 Dokumente, Sitemap, Lokal.html, dist/
npm run verify:build                           # 36 Seiten/Viewports + 7 Dokumente
CI=1 E2E_PORT=3455 npx playwright test         # 147 Browsertests
```

`E2E_PORT` ist nötig, weil auf Port 3100 ein fremder Vorschauserver eines anderen
Arbeitsbaums laufen kann; ohne den Parameter würde Playwright einen fremden
Build prüfen (belegt in RAD-03, RAD-09, RAD-10, RAD-12).

Der Generator ist separat prüfbar:

```bash
npm run data:radiasthesie    # validiert Quellen, Taxonomie, Medien; deterministisch
```

## 2. Aktueller Nachtest auf `ceddc84cfca44d53f1995dfd0981b7d70a554724`

RAD-14 hat erneut ausgeführt: Lint, Format, Build, verify:build (36/36 + 7/7),
167/167 Modultests und 147/147 Playwright. Erster `test:all`-Versuch Exit 1
(Tarot-Fokus-Timeout); zwei unveränderte Tarot-Wiederholungen jeweils 11/11,
vollständiger `test:all`-Nachlauf Exit 0: Jest 2/2, Node 242/242,
Playwright 147/147. Alle Rohlogs, Umgebung und Reproduktionsbefehle:
[NACHABNAHME.md](NACHABNAHME.md). Flake-Nachfolgekarte `t_73ccd862`.

### Historischer Erstlauf auf `5fe5301` (nicht auf neue SHA übertragbar)

| # | Befehl | Exit | Ergebnis |
| --- | --- | --- | --- |
| 1 | `npm run lint` | 0 | 0 Fehler, 0 Warnungen (`--max-warnings 0`) |
| 2 | `node --test tests/radiasthesie.mjs` | 0 | 24/24 |
| 3 | `node --test tests/radiasthesie-vertraege.mjs` | 0 | 20/20 |
| 4 | `node --test tests/radiasthesie-simulator.mjs` | 0 | 21/21 |
| 5 | `node --test tests/pendeltafel-studio.mjs` | 0 | 37/37 |
| 6 | `node --test tests/experiment-statistik.mjs` | 0 | 24/24 |
| 7 | `node --test tests/journal-speicher.mjs` | 0 | 26/26 |
| 8 | `node --test tests/radiasthesie-statisch.mjs` | 0 | 12/12 |
| 9 | `npm run build` | 0 | „Statische Seiten geschrieben: 7 Dokumente, Titel 45–59 Zeichen, Sitemap 11 Einträge“; `Lokal.html` und `dist/Esoterik-Welt/` erzeugt |
| 10 | `npm run verify:build` | 0 | „36 pages/viewports checked; 0 failures; 7 statische Dokumente, 0 Fehler“ |
| 11 | `CI=1 E2E_PORT=3455 npx playwright test` | 0 | **147 passed** (2,1 min), 0 failed, 0 skipped |

Summe der Node-Suiten (2–8): **164 Tests, 164 bestanden, 0 Fehler, 0 übersprungen.**

### 2.1 Browsersuite nach Dateien (Lauf 11)

| Spec | Tests |
| --- | --- |
| `pendeltafel-studio.spec.js` | 17 |
| `astrologie.spec.js` | 15 |
| `smoke-test-production.spec.js` | 14 |
| `f4-fixes-verification.spec.js` | 14 |
| `radiasthesie.spec.js` | 13 |
| `radiasthesie-simulator.spec.js` | 11 |
| `pendel-journal.spec.js` | 10 |
| `capture-screenshots.spec.js` | 10 |
| `radiasthesie-statisch.spec.js` | 9 |
| `experiment-labor.spec.js` | 7 |
| `regression-f4-links-staging.spec.js` | 6 |
| `regression-f4-links.spec.js` | 6 |
| `radiasthesie-vernetzung.spec.js` | 6 |
| `moon-calendar.spec.js` | 3 |
| `link-check.spec.js` | 3 |
| `console-check.spec.js` | 3 |
| **Summe** | **147** |

Davon gehören 73 Tests direkt zum Radiästhesie-Modul (17 + 13 + 11 + 10 + 9 + 7 + 6);
die übrigen prüfen Nachbarmodule und die Gesamtseite.

## 3. Unabhängige Abnahme RAD-13 (Commit `9bf5f73`)

Bericht: `docs/radiasthesie-completion/RAD-13/TESTBERICHT.md` · Checkpoint:
`docs/radiasthesie-completion/RAD-13/CHECKPOINT.md` · Evidenz:
`docs/radiasthesie-completion/RAD-13/evidence/` (21 Gate-Logs, 6 JSON-Sonden,
Playwright-Report) · Prüfskripte `docs/radiasthesie-completion/RAD-13/scripts/`.

**Urteil: NICHT ABGENOMMEN.** Belegt grün:

| Prüfung | Ergebnis |
| --- | --- |
| Build, Lint, Format | grün |
| Node-Suiten | 15 Suiten, 249 Tests, 0 Fehler (8 umgebungsbedingt übersprungen) |
| Playwright | 147/147 (0 failed, 0 skipped, 2,1 min) |
| `verify:build` | 36/36 Seitenansichten + 7/7 statische Dokumente |
| Breitenläufe | 20 Ansichten × 320/375/768/1440 px = 80 Läufe, 0 Überlauf |
| Konsole/Netz | 0 Konsolenfehler, 0 Netzfehler, 0 externe Requests |
| Interne Links | 604 Ziele, kein totes Ziel |
| Statistik | 10 Fälle gegen unabhängige BigInt-Referenz, max. Abweichung 2,0e-15 |
| Sicherheit | Journal-XSS, Studio-Import, SVG-Export, Löschung |
| Bewegung | `prefers-reduced-motion` wirkt |

**Blockierend:** F1 (P2) — axe-core 4.14.0 meldet `link-in-text-block`
(WCAG 1.4.1) in 7 von 12 Ansichten: Links im Fließtext unterscheiden sich nur
durch Farbe (< 3:1) und sind nicht unterstrichen. Korrekturkarte **`t_b1641fc1`**
(damals in Arbeit; inzwischen gezielt unabhängig freigegeben, siehe
[Nachabnahme](NACHABNAHME.md)). Der folgende Befundtext ist historisch,
kein aktueller Offenstatus für F1/F2.

**Weitere Befunde:** F2 (P3) `picture`-`sizes` unterschätzt die Layoutbreite
(520 px deklariert, 680 CSS px gemessen, 12 Messungen); F3 (P3) `og:image` fehlt
in allen 8 Dokumenten; F4 `color-contrast` bleibt bei dekorativen Glyphen und
SVG-Text im Studio „incomplete“ (kein Fehler, keine Freigabe).

**Befunde B1–B11:** B1, B2, B4, B5, B6, B8, B9, B10 nachgetestet und behoben;
B3 in den statischen Dokumenten behoben (SPA-Fehleransicht offen); B7 (`og:image`)
und B11 offen dokumentiert.

## 4. Nachweise je Paket (Kurzfassung)

| Paket | Zentraler Nachweis | Beleg |
| --- | --- | --- |
| RAD-01 Architektur | 14/14 Pakete zugeordnet, Ist/Soll-Matrix | `RAD-01/MATRIX-14-PAKETE.md` |
| RAD-02 Quellen | 66 Quellen, Locator-Prüfung, Lücken markiert | `RAD-02/CHECKPOINT.md`, `CLAIM-QUELLE-MATRIX.md` |
| RAD-03 Datenmodell | 19 Vertragstests, Generator-Negativpfad (Q99 → Exit 1) | `RAD-03/CHECKPOINT.md` |
| RAD-04 UX/UI | 52 Messpunkte, 22 Zustände, 126/126 Fokusringe, 0 externe Anfragen | `RAD-04/MESSUNG.md` |
| RAD-05 Medien | 6/6 SHA-1 gegen Commons, 24 Varianten, Negativkontrolle 3/3 | `RAD-05/CHECKPOINT.md` |
| RAD-06 Redaktion | 211 Prüfungen, 185/203 Sätze wortgleich erhalten, 114 Linkziele | `RAD-06/CHECKPOINT.md` |
| RAD-07 Pendellabor | 21 Modultests, 11 Browsertests, Physik gegen AGM-Referenz | `RAD-07/MODELL.md` |
| RAD-08 Tafel-Studio | 37 Modultests, 17 Browsertests, echtes PDF (1 Seite A4) | `RAD-08/CHECKPOINT.md`, `EXPORTE.md` |
| RAD-09 Experiment | 24 Modultests, 7 Browsertests, Statistik gegen Bruchrechnung | `RAD-09/CHECKPOINT.md` |
| RAD-10 Tagebuch | 26 Modultests, 10 Browsertests, Löschung/XSS/Import | `RAD-10/CHECKPOINT.md` |
| RAD-11 Vernetzung | 9 Einträge, 7 Links, 2 Lücken, 5 neue Tests, 6 Browsertests | `RAD-11/INTEGRATION.md` |
| RAD-12 SEO/statisch | 12+9 Prüfungen, 7 Dokumente, Titelbreite gemessen | `RAD-12/CHECKPOINT.md`, `ENTSCHEIDUNGEN.md` |
| RAD-13 QA | siehe §3 | `RAD-13/TESTBERICHT.md` |
| RAD-14 Übergabe | diese Sammlung, 164 Node-Tests + 147 Browsertests erneut ausgeführt | `RAD-14/`, `../RELEASE-CANDIDATE.md` |

## 5. Was im historischen Erstlauf nicht ausgeführt wurde

Aktuelle Abgrenzung: `test:all` ist nun vollständig grün wiederholt;
F1/F2-axe/Bildmessung sind unabhängig nachgetestet. Die damalige Liste unten
bleibt historische Laufdokumentation, keine aktuelle F1-Blockade.
Siehe [Nachabnahme](NACHABNAHME.md) für alle neuen Ergebnisse und Grenzen.

| Prüfung | Grund / Status |
| --- | --- |
| `npm run test:all` (Gesamtkette inkl. Jest, Tarot, Mond, Offline) | in dieser Sitzung **nicht** gefahren; RAD-13 belegt 249 Node-Tests über 15 Suiten auf `9bf5f73` |
| axe-/Barrierefreiheitslauf | nicht erneut gefahren; RAD-13-Beleg gilt für `9bf5f73`, F1 offen |
| Lighthouse/Performance | nie ausgeführt (RAD-07/09/10/12 nennen das ausdrücklich) |
| Firefox, WebKit, Touch-Geräte | nie ausgeführt; nur Chromium 155 |
| echter Screenreader | nie ausgeführt; Struktur und Live-Regionen sind geprüft, die Ansage nicht |
| externer Link-/Quellencheck | nicht erneut abgerufen (RAD-02-Stand 2026-11-03) |
| Deployment-/Produktionsprüfung | kein Push, kein Deployment; `verify:pages` gegen die Produktions-URL ist erwartungsgemäß rot |
| Journal-Export zeilenweise | Exportstruktur geprüft, Inhalt nicht Zeile für Zeile nachgerechnet |

### 5.1 Historischer Parallelzustand während des Erstlaufs

**Heute überholt:** F1/F2 sind in `b420a79` committed und auf `ceddc84`
unabhängig nachgeprüft. Aktueller Lintlauf Exit 0. Der folgende Text beschreibt
nur den Erstlauf. Die Herkunft der sieben PDF/PNG-Änderungen ist nicht pauschal
„fremd“: die Tests schreiben diese Ziele selbst (Review-Korrektur).

Die Korrekturkarte `t_b1641fc1` arbeitet **parallel im selben Arbeitsbaum**. Während
RAD-14 dokumentierte, hat sie F1 (Unterstreichung für Links im Fließtext) und F2
(`--rad-photo-max` statt fester `max-width`) umgesetzt und die statischen Dokumente
neu erzeugt. Diese Änderungen sind **uncommittet** und **nicht** Teil dieses
Commits; die Läufe in §2 gelten für den davor liegenden Stand `5fe5301`.

Folge für die Reproduktion: Ein `npm run lint` auf dem heutigen Arbeitsbaum schlägt
mit 34 Fehlern fehl — ausschließlich in `probe-t_b1641fc1/*.mjs`, den
Diagnoseskripten der Korrekturkarte (`no-undef` für `process`, `document`,
`window`). Die Produktionsdateien und die RAD-14-Dateien sind lint-frei; der Lauf
in §2 (Zeile 1) fand vor dem Erscheinen dieser Skripte statt.

## 6. Datei-Fingerabdrücke

**Aktuell:** [product-sha256.json](evidence/product-sha256.json) enthält 16
SHA-256-Fingerabdrücke der exakten Git-Blob-Bytes von
`ceddc84cfca44d53f1995dfd0981b7d70a554724` (`git show SHA:path`). Die Prüfung
mit `scripts/verify-handoff.py` vermeidet CRLF/LF-Verwechslungen.
[SHA256SUMS.txt](SHA256SUMS.txt) verzeichnet separat die Übergabedateien
(Text auf LF normalisiert, ZIP bytegenau; Größen beziehen sich auf dieselben Bytes).

### Historische Arbeitsbaum-Fingerabdrücke (`5fe5301`)

SHA-256 im Arbeitsbaum (UTF-8/LF; ein frischer Windows-Checkout mit
`core.autocrlf=true` erzeugt CRLF und damit andere Hashes, siehe RAD-04 §2):

| Datei | SHA-256 |
| --- | --- |
| `js/data/radiasthesie.js` | `ee15e6f4887c3a9d766020dc3bf7febcdf09c93879bec9425a32dc46fd80b2ac` |
| `js/modules/radiasthesie-views.js` | `834d6d5b781c677901f2fdc10b29317c70cd7b5b5226ff59735f05b17ed47657` |
| `js/modules/radiasthesie-model.js` | `d8fae146238a2bf1c3f529505f5bffa320f639fe79be17f95e49ff9f520d4bd1` |
| `js/modules/radiasthesie-format.js` | `2ff788398ed63935f579e2708f1eaadc156a95e2a25885bb8302c4f9018e37be` |
| `js/modules/radiasthesie.js` | `9ed1ee0e5a1d57c6e1fed371d92050a7e48f61058c923be1f3494e0b05d715a1` |
| `js/modules/pendel-simulator.js` | `8272ad5b89f5c1548ed91ec1607f4cd948abd445118d72c2f2a0976384df0f11` |
| `js/modules/pendeltafel-model.js` | `9e3b122212a2e18635c42ee5955229864bb24500e9c4a64d11e131062dfd46b9` |
| `js/modules/pendeltafel-studio.js` | `ab108ac13e48d1c67ef21b7b6ed7322b43a8584c43525f8b19d76255ba023e0a` |
| `js/modules/experiment-statistik.js` | `7c1ce8209797876a87eb5e0852c1505cb0c9ac95f3786c5cc587be11d976e602` |
| `js/modules/experiment-labor.js` | `5e7ab9bddab73bcc79c83168abd64e39a7bd2d48420c5a96802a26ef9befc708` |
| `js/modules/journal-speicher.js` | `b0980168706df71754b3f38db731c94ead56f18db278bf861bda9b8b2819ae76` |
| `js/modules/pendel-journal.js` | `1d86e341a796f7b5dec738cdafa83568f1acbae0114870ff9106861c4dd61531` |
| `css/radiasthesie.css` | `1b9f2030beb3d491853de95833ade18ce3d450401c9149fda11930d6c8eeaf71` |
| `css/radiasthesie-statisch.css` | `3647f259afe5d119a0ad9d5bfb0f92507dac14d5ae7ef16af9cffcb0ff920bfd` |
| `scripts/generate-radiasthesie-data.cjs` | `59daa16deb4264b0f840b7445bbb8351c81b70939f8127faa44dcf721ef53348` |
| `scripts/generate-radiasthesie-pages.cjs` | `c91ec02835bde14145cf0b123717bde8b6ff794bf9bbc9c1d65bd628ebfba2eb` |

Die historische Tabelle gilt ausschließlich für den damaligen Arbeitsbaum.
Der erforderliche Nachtest und die neuen Git-Blob-Fingerabdrücke sind jetzt
oben sowie in [NACHABNAHME.md](NACHABNAHME.md) belegt; F1/F2 sind nicht mehr offen.
