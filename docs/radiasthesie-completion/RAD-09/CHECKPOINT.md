# ESOW-RAD-09 — Checkpoint: Verblindetes Experimentierlabor

Stand: 3. November 2026 · Arbeitsbaum `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`,
Branch `feature/radiasthesie-modul` · kein Push, kein Deployment.

## 1. Was jetzt existiert

Echte Route **`#pendeln/experiment`** mit zwei strikt getrennten Modi:

| Modus | Verhalten |
| --- | --- |
| **Testmodus** | Drei vorregistrierte Experimente (Ja/Nein n=20, acht Orte n=16, Zahlen 1–5 n=25). Protokoll (Zielraum, Fallzahl, Abbruchregel, primäre Auswertung) steht **vor** dem Start im Dokument. Ziel wird gezogen und nur als SHA-256-Commitment gespeichert, Antwort gesperrt und persistiert, **erst danach** enthüllt. Auswertung, Trial-Tabelle, JSON-/CSV-Export, Löschen nur ganzer Läufe. |
| **Spielmodus** | Sofortiges Feedback, kein Speicher, keine Statistik, kein Export; sichtbar als „zählt nicht“ gekennzeichnet. |

Der Moduswechsel mitten im Lauf verändert weder Versuchszähler noch gespeicherte
Versuche (getestet). Ein neuer Lauf ist erst nach Abschluss oder Unterbrechung
des vorigen möglich; abgeschlossene Läufe bleiben in der Liste.

### Ablauf (Vertrag, nicht UI-Detail)

Ziel ziehen → verdeckt halten → Antwort erfassen → **Sperre + Speicherung +
Rückleseprüfung** → enthüllen → auswerten. `lockPrediction` ist unveränderlich;
ein zweiter Klick, eine Korrektur oder eine Sperre nach der Enthüllung werfen.
Die Sperre wird vor der Enthüllung geschrieben und per `verifyStored` gegen den
gespeicherten Stand geprüft; scheitert der Speicher (Quota, privater Modus),
erscheint eine sichtbare Warnung, der Lauf gilt nur für die Sitzung.

### Statistik (vor dem Start festgelegt)

- Basiswahrscheinlichkeit `p = 1/k` aus dem Protokoll,
- Erwartung `n/k`, Trefferquote `h/n`,
- **exakter zweiseitiger Binomialtest**: Summe aller Ausgänge mit
  `P(X=i) ≤ P(X=h)`, ohne Normalapproximation, p auf vier Nachkommastellen,
- **Wilson-95-%-Intervall** (ohne Stetigkeitskorrektur),
- Einordnung nennt Richtung (über/unter der Erwartung), die Schwelle 0,05, den
  Mehrfachtest-Hinweis und ausdrücklich „Hinweis, kein Nachweis“.

### Zufall, Verblindung, Speicher

- Ziel und Salt über `crypto.getRandomValues`; **kein `Math.random`-Fallback**
  (fehlt Web Crypto, startet kein Test — sichtbare Meldung). Rejection Sampling
  wie im Vertrag; deterministische Folgen (mulberry32) nur in Tests.
- Vor der Enthüllung stehen weder Zielindex noch Salt im DOM, im Seitentitel
  oder im gespeicherten Lauf (Commitment genügt). Automatisiert geprüft.
- Speicher `esot_rad_experiment_v1` mit Umschlag `{schema:1, savedAt, data}`,
  Grenze 2.000 Antworten, defensives Lesen (Backup `esot_rad_corrupt_…`,
  neueres Schema wird nicht überschrieben, In-Memory-Fallback mit Hinweis).
- Ein gezogenes, aber **unbeantwortetes** Ziel wird beim Fortsetzen verworfen
  (keine Antwort gespeichert, ohne Salt nicht enthüllbar). Eine **gesperrte,
  aber nicht enthüllte** Antwort bleibt gesperrt; der Lauf ist dann als
  „unterbrochen — nicht auswertbar“ markiert und nur ganz löschbar.

### Grenzen (stehen auch auf der Seite)

Clientseitige Verblindung ist begrenzt: Entwicklerwerkzeuge können Skripte
anhalten und Speicher lesen. Das Modul sagt das offen und verspricht keine
manipulationssichere Prüfung.

## 2. Dateien

| Datei | Zeilen | Inhalt |
| --- | --- | --- |
| `js/modules/experiment-statistik.js` | 349 | Binomialtest, Wilson-Intervall, Auswertung, CSV, Labels, Formatierung (DOM-frei) |
| `js/modules/experiment-zufall.js` | 66 | Web-Crypto-RNG, `drawIndex` mit Rejection Sampling, Batch-Token |
| `js/modules/experiment-speicher.js` | 176 | Umschlag, Defekt-/Schema-Behandlung, Quota, `verifyStored` |
| `js/modules/experiment-labor.js` | 793 | Bedienung beider Modi, Lauf-Lebenszyklus, Export, Lauf-Liste |
| `tests/experiment-statistik.mjs` | 544 | 24 Node-Tests (Statistik, Vertrag, Speicher, Route, RNG) |
| `tests/experiment-labor.spec.js` | 353 | 7 Browsertests der echten Route |

Geändert: `radiasthesie-views.js` (Ansicht `renderExperiment`), `radiasthesie-model.js`
(Route), `radiasthesie-format.js` (`ROUTE.experiment`), `radiasthesie.js`
(Mount/Teardown), `css/radiasthesie.css` (`.exp-*`), `scripts/generate-radiasthesie-data.cjs`
+ `js/data/radiasthesie.js` (Werkstatt-Karte „Verfügbar“), `docs/…/inhalte/pendeln.md`,
`tests/radiasthesie.mjs` (Kopierliste), `tests/radiasthesie-simulator.mjs`
(Werkstatt-Erwartung), `package.json` (`test:radiasthesie:experiment`, `test:all`),
`Lokal.html` (generiert).

**Router-Korrektur `js/main.js`:** Die beim Start geparste Route wurde nach den
asynchronen Modulinitialisierungen erneut angewendet. Änderte sich der Hash
währenddessen (Deep-Link, Zurück), blendete das die frische Ansicht wieder aus
und setzte den Fokus auf ein verstecktes Element. Jetzt wird die Startadresse
gemerkt und nur bei unverändertem Hash abgeschlossen. Der bisher sporadisch
scheiternde Fokustest in `tests/radiasthesie.spec.js` ist damit stabil
(2×13 Läufe grün, danach Gesamtsuite 122/122).

SHA-256 (Kurzform): `experiment-statistik.js` `7c1ce8209797876a`,
`experiment-labor.js` `5e7ab9bddab73bcc`.

## 3. Commits

| Commit | Inhalt |
| --- | --- |
| `36fc605` | Feature + Tests + Daten/Werkstatt-Karte + generierter Offline-Build |
| dieser Commit | Checkpoint und Nachweise (Screenshots) |

Basis: `9a7a5db` (RAD-08). Kein Push.

## 4. Wirklich ausgeführt

Alles unten wurde in diesem Lauf ausgeführt; Ausgaben sind nicht rekonstruiert.

| Prüfung | Ergebnis |
| --- | --- |
| `node --test tests/experiment-statistik.mjs` | 24/24 |
| `node --test tests/radiasthesie.mjs` | 16/16 |
| `node --test tests/radiasthesie-vertraege.mjs` | 19/19 |
| `node --test tests/radiasthesie-simulator.mjs` | 21/21 |
| `node --test tests/pendeltafel-studio.mjs` | 37/37 |
| `npm test` (Jest) | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:crystals` / `test:astrologie` | 9/9 · 21/21 |
| `npm run test:tarot` / `:decks` / `test:moon` | 11/11 · 12/12 · 14/14 |
| `npm run test:offline` | 2/2 (Chromium, `file://`) |
| `npm run test:local` | 12 grün, 2 übersprungen, 0 Fehler |
| `CI=1 E2E_PORT=3432 npx playwright test` | **122/122** (davon 7 neue RAD-09) |
| `npm run lint` | 0 Fehler, 0 Warnungen |
| `npx prettier --check` (alle eigenen Dateien) | sauber |
| `npm run build` / `build:local` | grün, genau ein Offline-Bundle |
| `npm run verify:build` | 36 Seiten/Viewports, 0 Fehler |

Statistik-Referenzen wurden **unabhängig** mit exakter Bruchrechnung (Python,
`fractions`) erzeugt und im Test als Konstanten hinterlegt, u. a.
`p(15|20, ½) = 5425/131072`, `p(5|16, ⅛) = 0,04066189058827874`,
`p(8|25, ⅕) = 0,1365125215956743`, Wilson(15,20) = [0,531299122381256,
0,8881382985923343]. Toleranz 1e-12.

Browser-Nachweise: `desktop-moduswahl.png`, `desktop-versuch-verdeckt.png`,
`desktop-auswertung.png`, `mobile-versuch.png` (in `evidence/`).
Geprüft wurden darin unter anderem: Leckfreiheit vor der Sperre (DOM, Titel,
`localStorage`), Doppelklick auf „Sperren“ legt keinen zweiten Versuch an,
Moduswechsel ohne Wirkung, Reload mit Fortsetzen bzw. „unterbrochen“,
20 vollständige Versuche mit Abschlussauswertung, JSON-/CSV-Download
(Envelope, BOM, Semikolon, CRLF, 21 Zeilen), mobile 390 px ohne Überlauf,
Start per Tastatur, `file://`-Build.

## 5. Restpunkte / offene Befunde

1. Nur Chromium 155 geprüft; kein Firefox/Safari-Lauf.
2. Kein Screenreader-Lauf; Tastatur und Fokussierung sind geprüft, die
   Ansage der Live-Regionen nicht mit einem echten Screenreader.
3. Lighthouse nicht gefahren.
4. Die Verblindung bleibt clientseitig umgehbar (DevTools) — bewusst
   dokumentiert, kein Fehler, aber auch kein Sicherheitsversprechen.
5. Quota-Verhalten ist im Unit-Test mit Speicher-Attrappe geprüft, nicht mit
   einem tatsächlich vollen Browser-Speicher.
6. Mehrere offene Läufe nebeneinander sind erlaubt; der Mehrfachtest-Hinweis
   nennt die Zahl bekannter Läufe, korrigiert aber nicht (bewusst).
7. CI ruft die Radiästhesie-Tests weiterhin nicht auf (`test:all` enthält
   `test:radiasthesie:experiment`, der Workflow nicht).
8. `npx prettier --check` meldet weiterhin die **fremde** Datei
   `assets/radiasthesie/media/bildnachweis.html` (untracked, anderer Agent);
   nicht angefasst.
9. Der bekannte Fokus-Flake in `tests/radiasthesie.spec.js` ist über die
   Router-Korrektur behoben; ein Restrisiko bei sehr langsamen Rechnern bleibt
   (die Ursache — doppeltes Anwenden einer Route — ist beseitigt).

## 6. Nächster Schritt

RAD-09 ist damit abgeschlossen. Für die Gesamtabnahme fehlen aus der
14-Paket-Matrix weiterhin die Pakete nach RAD-09 (u. a. Pendeltagebuch RAD-10
mit `entryFromRun` auf Basis dieses Labors, Störfeld-Landkarte). Die
Werkstatt-Karte „Experimentierlabor“ ist jetzt „Verfügbar“ und verlinkt; der
Werkstatt-Abschnitt der Landingpage hat damit drei verfügbare Werkzeuge.
