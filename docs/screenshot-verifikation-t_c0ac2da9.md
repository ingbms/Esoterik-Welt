# Screenshot-Verifikation Esoterik-Welt – t_c0ac2da9

## Ergebnis und Freigabegrenze

**Automatisierte Aufnahme-/Diff-Lieferung abgeschlossen. Keine gestalterische Schlussfreigabe; Website hat dokumentierte Restmängel.**

Ausschließlich geprüftes Projekt: `C:/Users/mas/Arbeit/Esoterik-Welt`, Remote `https://github.com/ingbms/Esoterik-Welt.git`. Produktivziel aus `gh api repos/ingbms/Esoterik-Welt/pages`: https://ingbms.github.io/Esoterik-Welt/. Geprüfter Produktionscommit: `24d8053ebc1bc4438a35a1c52b5d6f8c1718594e`. Der Plugin-Worktree wurde nicht verändert.

- Originalaufnahmen: 2026-10-31, 02:34:35–02:38:18 UTC; tatsächliches Chromium-Rendering, 375/768/1440 × 900 CSS px, DPR 1.
- 30 Basisbilder, 30 Wiederholungen, 14 Detail-/Menüzustände und drei ergänzende Runendialogbilder: **77 Original-Browseraufnahmen**.
- Erneute Live-Validierung am 2026-10-31 bis 06:32:35 UTC: **30/30 Ansichten erfolgreich gerendert**, Deploy-Commit unverändert; drei zusätzliche neue Home-Full-Page-PNGs unter `revalidation/`. Diese ersetzen nicht die zeitlich älteren Originale.
- 60 pixelgenaue Vergleiche erneut ausgeführt und zusätzlich durch unabhängige RGB-Bytevergleiche bestätigt: **60/60 exakt identisch**, damit innerhalb **0,1 %** zulässiger abweichender Pixel. 30 Paare messen Wiederholbarkeit, 30 vergleichen gegen unfreigegebene Reparatur-after-Belege. **Kein historischer Sollbildnachweis.**
- HTML-Report im realen Chromium geöffnet: **60 Tabellenzeilen, 60 Vergleichsgalerien, acht Befundgruppen**, keine JavaScript-Fehler.
- Sämtliche PNGs des Aufnahmemanifests dekodiert; ZIP-CRC, Dateizahlen, Pflichtbilder und SHA-256 geprüft. Zwölf zuvor vorhandene Dateien unter tests/test-results per Hash unverändert bestätigt.

## Abdeckung

Je drei Viewports: Home, Tarot, Kristalle, Mond, Runen, Wissen/Blog, Impressum, Datenschutz, Haftung und echte verschachtelte benutzerdefinierte 404. Navigation in allen Breiten per echten Klicks nachgewiesen; Dialoge und mobile Menüs ergänzend aufgenommen.

Die Website hat keinen Shop/Produktpfad; vorhandene Werkzeug-/Katalogseiten wurden stattdessen vollständig erfasst. Es existieren keine eigenständige Kontaktseite, kein Kontaktformular und kein authentifiziertes Dashboard. Der Kontaktverweis im Impressum ist erfasst. Nicht existente Seiten werden nicht erfunden und nicht als erfolgreich getestet ausgegeben.

## Baseline-Status

Keine freigegebene historische Bildbaseline in versionierten Dateien oder inventarisierten GitHub-Bildartefakten gefunden. Reparatur-before/after sind Diagnostik, keine Designfreigabe. `baseline-candidate.json` enthält 30 gehashte Initialzustände mit **accepted=false**. Bekannte Fehler dürfen nicht durch Baseline-Promotion legitimiert werden.

Vergleich ohne Skalierung, ohne Anti-Aliasing-Ausnahme, RGBA-kanalgenau: mindestens ein ungleicher Kanal zählt als abweichender Pixel. Toleranz `different_pixels / total_pixels <= 0.001`. Originale, Wiederholungen, Referenzen und Heatmaps bleiben getrennt.

## Befunde

Acht deduplizierte Gruppen, davon vier Medium und vier Low. Alle konkreten Stellen mit Selektoren, Koordinaten, Originalbild und gegebenenfalls Messcrop stehen in `anomalies.json` und im HTML-/Markdown-Vollbericht. Koordinaten sind x/y/Breite/Höhe in Dokument-CSS-Pixeln, bei DPR 1 gleich PNG-Pixeln; Dialogbeleg ausdrücklich Viewportkoordinaten.

| ID | Priorität | Kategorie / Befund | Beispielkoordinate |
|---|---|---|---|
| V01 | Medium | Textoverflow in mobilen Kristallkarten | 375 px: x=57, y=3853.08, w=170, h=15 |
| V02 | Medium | Lange Wörter in mobilen Wissenskarten verlassen Kartenrand | 375 px: x=57, y=4091.56, w=163, h=25 |
| V03 | Medium | Runendialog mobil horizontal abgeschnitten/scrollbar | 375 px: x=226, y=489.08, w=144, h=191.63; scrollWidth 345/clientWidth 325 |
| V04 | Medium | Aufbauverschiebungen beim kalten Kristall-Deeplink | 1440 px, betroffener Sichtbereich x=144, y=0, w=1152, h=900; zeitliche Quellen im JSON |
| V05 | Low | 404 mit abweichender Gold-/Cormorant-Gestaltung | 375 px: x=73, y=209.45, w=229, h=64 |
| V06 | Low | Drei Wissenslinks im Footer sind Platzhalter | 375 px: Einsteiger-Guide x=24, y=2518.11, w=104, h=16 |
| V07 | Low | „Mehr laden“ bleibt ohne zusätzliche Artikel | 375 px: x=127.5, y=5727.75, w=120, h=42; zehn Artikel vor/nach echtem Klick |
| V08 | Low | OG-Vorschaubild fehlt (404) | Keine Bildschirmkoordinate: Metadaten-Asset, nicht im Layout gerendert |

V04 basiert auf PerformanceObserver, nicht auf dem statischen Endbild. Die protokollierten Shift-Summen sind **kein** normgerecht session-window-berechneter Web-Vitals-CLS. 0 Dokumentoverflow und 0 defekte sichtbare IMG-Elemente beweisen keine fehlerfreien inneren Karten/Dialoge. Vorhandene Emoji-/Gradientflächen sind nicht pauschal als fehlende Assets klassifiziert.

## Download und Reproduktion

Im Verzeichnis `evidence/t_c0ac2da9/`:

- `esoterik-welt-375px.zip`, `esoterik-welt-768px.zip`, `esoterik-welt-1440px.zip`: Full-Page-Originale je Breite, Detailzustände, Wiederholungen, Reparaturreferenzen, Heatmaps, Messcrops, HTML-/Markdown-Berichte, Manifeste und reproduzierbare Skripte. Alle drei ZIPs **in dasselbe Verzeichnis entpacken**, damit alle Originalbildlinks des gemeinsamen HTML-Reports auflösbar sind. Jedes Archiv liegt unter 25.000.000 Byte und wurde per CRC geprüft.
- `report.html`: zusätzlich separat nutzbarer Report mit eingebetteten Vorschauen/Messcrops; Originalauflösung in ZIPs.
- `report.md`, `anomalies.json`, `baseline-candidate.json`: vollständige Methodik, Befundkoordinaten, unfreigegebener Initialstand.
- `final-verification.json`, `revalidation.json`, `distribution-manifest.json`: abschließende Prüfnachweise und SHA-256 der Downloadarchive.

Im Website-Projekt wurden tatsächlich erfolgreich ausgeführt:

```bash
python evidence/t_c0ac2da9/compare.py
'C:/Users/mas/AppData/Local/hermes/tools/node-26.12.1-win32-x64/node.exe' evidence/t_c0ac2da9/revalidate.cjs
python evidence/t_c0ac2da9/verify-deliverables.py
python evidence/t_c0ac2da9/package-viewports.py
```

Die vollständigen Aufnahmeskripte `capture.cjs`, `confirm.cjs`, `confirm-modal.cjs` liegen ebenfalls bei. Sie schreiben nur eigene Task-Evidenz und benötigen das vorhandene Playwright und Pillow. Vor erneutem Aufnehmen bestehende Task-Originale archivieren; ein historischer Erfassungszeitpunkt darf nicht stillschweigend als neu ausgegeben werden.

## Grenzen und Handoff

`vision_analyze` erneut versucht: `model_not_found`, das konfigurierte Hilfsmodell `thinkingmachines/inkling-small:free` wird vom aktuellen Codex-ChatGPT-Account nicht unterstützt. Keine kostenpflichtigen Providerwechsel vorgenommen. Daher **keine semantische Bildsicht-/menschliche Designfreigabe behauptet**. Geometrie, berechnete Styles, Browseraktionen, echte Pixeldateien und exakte Diffs sind überprüft. Nur Windows Chromium; keine echten Mobilgeräte/Safari/Firefox. Aufnahmen im Default-/Dark-State; Light-/Kontrast-/Fokusprüfung gehört zum separaten Review t_befcdea7.

Keine App-Dateien, vorhandenen Tests oder parallelen DevOps-Änderungen verändert; kein Commit/Push/Deploy durch diese Aufgabe. Die reine Screenshot-/Diff-Phase ist fertig und gibt die vorbestehende nachgelagerte Gesamtprüfung **t_6d900985** frei, ohne deren Designabnahme vorwegzunehmen. Für gemeinsame Karten-/Dialog-/404-Stellen existiert bereits die konsolidierte Behebung **t_ddfe7b03** aus **t_befcdea7**; keine duplizierten Fixkarten angelegt. Die zusätzlichen Befunde V04/V06–V08 sind an den Gesamt-Review zur Priorisierung übergeben. Bildzugang und reparierte Nachher-Belege bleiben Voraussetzungen für eine gestalterische Schlussabnahme.
