# Release-Kandidat — ESOW-RAD (Radiästhesie, Pendeln und Orakel)

**Stand:** Commit `5fe5301` · Branch `feature/radiasthesie-modul` · Basis `e44fa5c`
**Dokumentation:** `docs/radiasthesie-completion/RAD-14/` (15 Dateien + Generator)
**Erstellt:** 3. November 2026, RAD-14

## 1. Urteil

> ### NICHT FREIGEGEBEN
>
> Die unabhängige Abnahme von RAD-01…12 (`t_29535d62`, Stand `9bf5f73`) endete mit
> **NICHT ABGENOMMEN**. Blockierend ist **F1**: Links im Fließtext sind nur
> farblich unterschieden (WCAG 1.4.1), axe-core 4.14.0 meldet
> `link-in-text-block` in 7 von 12 Ansichten. Die Korrektur läuft unter
> `t_b1641fc1`; eine Nachabnahme hat noch nicht stattgefunden.

Dieses Dokument beschreibt, **was** ein Release wäre, **warum** es derzeit keines
ist und **welche Bedingungen** gelten. Aus ihm folgt **kein** Recht zu pushen,
zu veröffentlichen oder zu deployen.

## 2. Was in einem Release stecken würde

| Bestandteil | Umfang |
| --- | --- |
| Themenseiten | 3 Themen, 32 Kapitel, 6 346 Wörter, Kennzeichnung A–E je Kapitel |
| Quellen | 66 Einträge mit Prüftiefe, Interessenvermerk, Aussagenzuordnung |
| Glossar | 17 Begriffe, 9 Buchstabengruppen |
| Statische Dokumente | 7 Seiten ohne JavaScript, Sitemap mit 11 Einträgen |
| Werkzeuge | Pendellabor, Pendeltafel-Studio, Experimentierlabor, Pendeltagebuch |
| Medien | 6 Fotos (CC0/PD/CC BY-SA 3.0), 24 Varianten, 4 eigene SVGs |
| Bildrechte | Manifest, Attributionsseite, Share-Alike-Absatz auf der Methodik-Seite |
| Datenmodell | Schema 1.0, 7 Entitätstypen, Verträge, Speicher-/Exportschemata |
| Tests | 164 Node-Tests (7 Suiten), 147 Browsertests (16 Specs) auf `5fe5301` |
| Dokumentation | RAD-01…RAD-14, Testberichte, Evidenz, diese Übergabe |

**Umfang des Diffs gegen `e44fa5c`:** 431 Dateien, +99 983 / −664 Zeilen, 28 Commits.
Davon 328 Dateien allein Dokumentation und Evidenz.

## 3. Blockierende und offene Befunde

| ID | Schwere | Befund | Status | Karte |
| --- | --- | --- | --- | --- |
| F1 | P2, **blockierend** | Links im Fließtext nur farblich unterschieden (WCAG 1.4.1), 7/12 Ansichten | offen, in Arbeit | `t_b1641fc1` |
| F2 | P3 | Foto-`sizes` deklariert 520 px bei 680 CSS px Layoutbreite (12 Messungen) | offen | `t_b1641fc1` |
| F3 / B7 | P3 | `og:image` fehlt in allen 8 Dokumenten | offen, bewusst | RAD-12 |
| F4 | – | `color-contrast` bleibt bei dekorativen Glyphen/SVG-Text „incomplete“ | offen | RAD-13 |
| R-1 | P2 (rechtlich) | keine `LICENSE`-Datei; Rechte der eigenen Inhalte ungeklärt | offen, Eigentümerentscheidung | RAD-05/14 |
| R-7 | P2 (rechtlich) | `datenschutz.html` nennt die lokalen Speicher (`esot_rad_*`) nicht | offen | RAD-04/14 |
| T-1 | P2 (Betrieb) | CI ruft die Radiästhesie-Suiten nicht auf | offen | RAD-01/03/07/09/10 |

Vollständige Liste mit Belegen: `RAD-14/GRENZEN.md`.

## 4. Was grün belegt ist (Bezugsstand)

| Prüfung | Ergebnis | Quelle |
| --- | --- | --- |
| Build, Lint, Format | grün | RAD-14-Lauf, RAD-13 |
| Node-Tests | 164/164 auf `5fe5301`; 249 über 15 Suiten auf `9bf5f73` | `RAD-14/TESTPROTOKOLLE.md` §2, RAD-13 |
| Browsertests | 147/147 (2,1 min), 0 failed, 0 skipped | RAD-14-Lauf |
| `verify:build` | 36 Seiten/Viewports + 7 statische Dokumente, 0 Fehler | RAD-14-Lauf |
| Breiten 320/375/768/1440 | 80 Läufe, 0 Überlauf | RAD-13 |
| Konsolen/Netz | 0 Fehler, 0 externe Requests | RAD-13 |
| Interne Links | 604 Ziele, kein totes Ziel | RAD-13 |
| Statistik | 10 Fälle gegen BigInt-Referenz, max. 2,0e-15 | RAD-13 |
| Sicherheit | Journal-XSS, Studio-Import, SVG-Export, Löschung | RAD-13, RAD-08/10 |
| reduzierte Bewegung | wirkt | RAD-13 |

## 5. Bedingungen für ein Release

1. **F1 behoben** und per axe-Lauf über die 12 Ansichten ohne
   `link-in-text-block` belegt.
2. **F2 behoben** und Bildmessung ohne `IMG-RES`-Befund wiederholt.
3. **Regression grün:** `CI=1 npx playwright test` 147/147, `npm run test:all`
   grün, Arbeitsbaum sauber.
4. **Nachabnahme** durch `tester` auf dem neuen Commit — nicht durch den
   Umsetzer selbst.
5. **R-1 und R-7 entschieden** (Lizenztext, Datenschutzerklärung). Beides ist
   eine Eigentümerentscheidung; ein Agent darf sie nicht erfinden.
6. **T-1 entschieden** (CI-Aufnahme) oder ausdrücklich als Risiko akzeptiert.
7. **Aktualisierung** von `RAD-14/TESTPROTOKOLLE.md` (§2, §6) und
   `RAD-14/PAKETMATRIX.md` auf den neuen Commit.
8. **Freigabe zur Veröffentlichung** durch den Eigentümer. Bis dahin: kein Push,
   kein Deployment.

## 6. Rücknahme (falls doch veröffentlicht würde)

Der Branch ist nicht gepusht; `main` ist unberührt. Ein Release wäre ein
Fast-Forward oder Merge dieses Branches. Rücknahme wäre ein Revert des
Merge-Commits; Daten außerhalb des Repositories existieren nicht (kein Server,
keine Datenbank). Nutzerseitig gespeicherte Tagebuch- und Experimentdaten liegen
ausschließlich im Browser und wären von einem Rückbau nicht betroffen.

## 7. Verhältnis zum Master

Der Master `t_878c59c7` / ESOW-RAD-000 darf **erst** geschlossen werden, wenn
alle 14 Pakete ihre DoD belegt haben und die Nachabnahme positiv ist. RAD-14
liefert dafür die Nachweise, nicht die Freigabe. Ein „Dokumentation existiert“
ist kein Abnahmekriterium für die anderen 13 Pakete.
