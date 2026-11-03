# RAD-13 F1/F2 – unabhängiger Review / Nachtest

**Urteil: F1/F2 freigegeben. Keine Gesamt- oder Veröffentlichungsfreigabe. RAD-14 bleibt offen.**

- Karte: `t_b1641fc1`, Review-Runde 1 (Artefaktprüfung, zusätzlich vollständige Ausführung).
- Geprüfter SHA: `ceddc84cfca44d53f1995dfd0981b7d70a554724`, Fix `b420a79994b61761715d4c12dd4c241ae43ada28`.
- Basis der Änderung: `1f78942`. Produktdiff, erzeugte Dokumente und hinzugefügte Tests unabhängig gelesen; keine bestehende Prüfung entfernt oder abgeschwächt.
- Windows 11 / Git Bash; Node `v24.13.0`; Chromium headless `156.0.8078.4`; axe-core `4.14.0`.
- Neuer detached Prüfbaum: `review/` neben diesem Bericht; frisches `npm ci`, eigener Build, keinerlei Übernahme des Serverprozesses des Implementierers. Gate-Port `39633` wurde vor Benutzung per Bind-Versuch geprüft; `CI=1` erzwingt `reuseExistingServer: false`. Die eigene Sonde nutzt einen zusätzlichen Port 0 und `/Esoterik-Welt/` als echtes Präfix.

## Abnahmematrix

| Bedingung | Ergebnis | Unabhängige Evidenz im ZIP |
| --- | --- | --- |
| Nur F1/F2, Tests nicht abschwächen | Bestanden: CSS-Ergänzungen für Textlinks; responsive Foto-Slots; abgeleitete Dokumente; zusätzliche Regressionstests. Keine manuelle Produktkorrektur durch Reviewer. | gelesener Diff `1f78942..ceddc84`; `all.log` |
| F1: ursprüngliche 12 Ansichten ohne `link-in-text-block` | Bestanden, zusätzlich vier weitere statische Ansichten, jeweils 1440 und 375 px: **32 axe-Läufe, 0 Verstöße insgesamt**. Ergänzend **372 Linkinstanzen** in den gezielt korrigierten Metazeilen/Attributionen mit tatsächlicher berechneter Unterstreichung geprüft. | `probe.json`, `probe.log` |
| F2: erneute Bildmessung ohne IMG-RES | Bestanden: **6 Routen × 10 Breiten = 60 Läufe, 120 geladene Foto-Darstellungen**, alle sechs Motive erfasst. **0 IMG-RES** mit `naturalWidth + 8 < CSS-Breite`; zusätzlich **0 echte Hochskalierungen** (Dateipixel über separates `Image` ohne `srcset` gemessen). **0 Überläufe** auf diesen Routen. | `probe.json`, Fotos 375/1440 |
| Playwright 147/147 | Bestanden: **147 erwartet/bestanden, 0 unerwartet, 0 übersprungen, 0 flaky**, als unveränderter Bestandteil von `npm run test:all`. | `playwright.json`, `all.log` |
| `npm run test:all` | Exit 0. Jest **2/2**; Node-Testläufe summiert **242/242**, 0 Fehler, 0 übersprungen; darin Radiästhesie 25, statisch 14. Anschließend vollständige Playwright-Suite. | `all.log`, `summary.json` |
| Build / Lint / Format | Neuer Build mit 7 Dokumenten und 11 Sitemap-Einträgen; Lint und Format jeweils Exit 0. | `all.log`, `lint.log`, `format.log`, `gate-results.json` |
| Zusätzliche Regression | `verify:build`: **36/36** Seiten/Breiten und **7/7** statische Dokumente ohne Fehler. Eigene Browser-Sonde: 0 `pageerror` und 0 fehlgeschlagene Requests. | `verify.log`, `probe.json` |
| Sauberer Arbeitsbaum | **Geprüfter detached Kandidatenbaum am Ende sauber**, `git diff --exit-code` Exit 0. Testgenerierte Dateien vorher gesichert und ausschließlich im eigenen Prüfbaum wiederhergestellt. **Gemeinsamer Implementierungsbaum weiterhin nicht sauber**, siehe unten; kein pauschales Clean-Urteil dafür. | `final-status.json`, `generated-diff.txt`, `test-generated/` |
| Kein Push / kein Gesamtabschluss vor RAD-14 | Reviewer hat weder gepusht noch deployt noch den Master geschlossen. Es erfolgt nur Freigabe dieser Korrekturkarte. | Kanban-Handoff |

Die Bildbreiten waren 320, 375, 414, 640, 728, 729, 768, 900, 1024 und 1440 px, DPR 1. Bilder vor Messung einzeln gescrollt und `decode()` abgewartet; fehlende Bilder führen zu Fehler statt zu leer bestandener Messung.

## Prüfung der sichtbaren Entscheidung für rad-media-03

Die Begrenzung auf 520 CSS px ist fachlich passend zum Auftrag „keine Hochskalierung“: dieses Motiv hat nur die 520er-Variante, während die anderen Motive ab ausreichend breitem Layout die 1040er-Datei verwenden. Bei Mobile bleibt das Bild im vorhandenen Container; bei breiter Ansicht wird es bewusst kleiner dargestellt. Screenshots bei 375 und 1440 zeigen keine zusätzliche Verzerrung oder Layoutüberläufe; Attribution und Link sind lesbar und der Link unterstrichen.

Die deklarierte `sizes`-Formel ist geringfügig konservativ: an 728 px ist die gemessene Foto-Breite wegen des Layout-Breakpoints 664 statt der deklarierten 680 px; bei der auf 520 begrenzten Figur ist die Deklaration ebenfalls größer als der Slot. Das verursacht in den geprüften Daten keine zu kleine Bildauswahl, keine zusätzlichen Dateien für das Ein-Kandidaten-Motiv und keine Hochskalierung. Es ist kein blockierender Rest des ursprünglichen F2.

## Prüfsonden: Abgrenzung von Fehlalarmen

1. Das ursprüngliche `qa-rad13/rad13-a11y.mjs` wurde vor der erneuten isolierten Abnahme bei 1440/375 ausgeführt: ebenfalls 0 axe-Verstöße. Die dortige Zusatzheuristik meldet `FOCUS-VISIBLE` am nativen Datumsfeld. Eigene gezielte Tastatur-/Screenshot-Gegenprobe zeigt: beim vierten Teilfokus verschwindet die CSS-Outline des Hosts, **der Kalenderknopf erhält aber einen sichtbaren nativen rechteckigen Fokusrahmen**. Die vorigen Datumssegmente haben CSS-Outline und markiertes Segment. Daher kein bestätigter neuer Produktfehler aus `getComputedStyle(input).outline` allein. Beleg: `date-focus.json`, `date-tab-2.png` und `date-tab-3.png`.
2. Eine zusätzliche anfängliche Linkheuristik betrachtete nur `text-decoration` und Farbkontrast. Ihre Treffer an `.rad-cite` sind nicht als Fehler gewertet: die vorhandene sichtbare untere Border und abweichende Schrift sind zusätzliche Kennzeichnungen. axe erkennt diese zutreffend. Maßgeblich sind hier der vollständige axe-Lauf und die gezielten echten Unterstreichungsprüfungen.
3. Eine erste eigene kombinierte Sonde wurde wegen Laufzeitüberschreitung verworfen. Es werden daraus keine Bestehenswerte abgeleitet; maßgeblich ist die vollständig beendete, gespeicherte Sonde `review-probe.mjs`.

## Arbeitsbaum / Herkunft der Testartefakte

Der gemeinsame Implementierungsbaum hatte vor und nach dem Review sieben geänderte versionierte PDF/PNG-Dateien unter RAD-08…10 sowie ein unversioniertes `evidence/`. Diese Dateien wurden von diesem Review nicht zurückgesetzt, gelöscht oder übernommen.

**Wichtige Präzisierung zum Implementierer-Handoff:** „fremde, vorbestehende Änderungen“ ist als Herkunftsbehauptung nicht belegt. Die vorhandenen Playwright-Tests schreiben selbst genau diese versionierten Screenshot-/PDF-Ziele. Ein Lauf im zuvor sauberen eigenen Prüfbaum erzeugt dieselben sieben binären Änderungen. Weitere sichtbare Statuszeilen der HTML-/Sitemap-Dateien sind nach der Generierung reine Zeilenenden-Unterschiede; keine inhaltlichen Produktänderungen. Darum ist die sachgerechte Aussage: *sauberer, lokal reproduzierbarer Kandidatencommit; gemeinsamer Arbeitsbaum enthält separat zu bewahrende Testartefakte*. Nicht: *gemeinsamer Arbeitsbaum sauber*.

Der Reviewer hat die eigenen Testausgaben unter `test-generated/` gesichert und dann nur die explizit geprüften, durch den eigenen Lauf erzeugten Pfade im isolierten Prüfbaum wiederhergestellt. `final-status.json` enthält leeren Status und den exakten SHA. Keine Reviewer-Änderung an der Implementierung wurde eingecheckt.

## Reproduktion

```sh
# Frischer Prüfbaum auf ceddc84cfca44d53f1995dfd0981b7d70a554724
npm ci
npm run build
CI=1 E2E_PORT=<nachweislich freier Port> npm run test:all
npm run lint
npm run format:check
npm run verify:build
```

`run-gates.cjs` ermittelt den freien Port, setzt TMP/TEMP/TMPDIR und speichert unverfälschte Exitcodes. `review-probe.mjs` liegt neben dem Prüfbaum und lädt Playwright aus dessen `package.json`; für eine andere Umgebung ROOT/OUT und den Pfad zu axe-core anpassen. `summarize.mjs` aggregiert gespeicherte tatsächliche Ergebnisse, keine handgezählten Summen.

## Grenzen und Handoff an RAD-14

- Diese Freigabe hebt die Blockade **F1/F2** auf; sie ersetzt nicht den gesamten ursprünglichen RAD-13-Bericht und nicht RAD-14.
- axe `color-contrast` bleibt in mehreren Ansichten `incomplete`; daraus folgt keine vollständige WCAG-AA-Zertifizierung. F3 (`og:image`) und bisher dokumentierte Restpunkte bleiben außerhalb dieser Korrekturkarte.
- Keine neue Prüfung mit echtem Screenreader, Safari/iOS, Firefox oder Touchgerät; DPR > 1 nicht Teil dieser Bildskalierungsabnahme.
- `npm ci` meldet Abhängigkeitswarnungen (43 Audit-Hinweise); keine Pakete oder Lockfiles durch den Reviewer geändert, keine zusätzliche Sicherheitsfreigabe daraus abgeleitet.
- RAD-14 muss Paketmatrix, TESTPROTOKOLLE und RELEASE-CANDIDATE auf den geprüften SHA und dieses **gezielte Reviewer-Verdikt** aktualisieren; Restgrenzen und der nicht bereinigte gemeinsame Artefaktbestand sind offen auszuweisen. Kein Push/Deployment-Recht daraus ableiten.

Alle Review-Nachweise werden als Kanban-Artefakte an dieser Karte dauerhaft abgelegt; nach Scratch-Bereinigung über `kanban_attachments(task_id="t_b1641fc1")` abrufbar.
