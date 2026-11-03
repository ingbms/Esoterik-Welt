# Esoterik-Welt – Reparatur und Live-Nachweis

## Ergebnis

- Produktiv: https://ingbms.github.io/Esoterik-Welt/
- Reparatur-Commit: `24d8053ebc1bc4438a35a1c52b5d6f8c1718594e` auf `origin/main`; Remote-SHA und ausgelieferte Inhalte nachgelesen.
- Bestehender **pages build and deployment** erfolgreich: https://github.com/ingbms/Esoterik-Welt/actions/runs/41159464673 (Build und Deploy erfolgreich, Deploy abgeschlossen am 2026-10-31 um 02:19:58 UTC).
- Anschließende Live-Chromium-Prüfung: **30/30 Ansichten erfolgreich**, abgeschlossen `2026-10-31T02:21:26.470Z`. Start, Tarot, Kristalle, Mondphasen, Runen, Wissen, Impressum, Datenschutz, Haftung und 404 jeweils bei **375 / 768 / 1440 px**. Full-Page-PNGs in `evidence/t_9ff78898/after/`.
- Keine erfassten Console-Errors, Pageerrors oder fehlgeschlagenen Requests in diesen 30 Ansichten; kein horizontaler Dokumentüberlauf. Geladene lokale CSS-Regeln, berechnete Hintergrundfarben und Schriftfamilien geprüft – nicht nur HTTP 200.
- Hauptmenü einschließlich mobilem Auf-/Zuklappen, Hero-Link, Feature-Karte, Logo, Footer-Rechtelinks und Rücknavigation zusätzlich tatsächlich geklickt, auf allen drei Breiten ohne JavaScript-Fehler.
- Elf zentrale ausgelieferte Dokumente/Assets mit den Dateien dieses Git-Commits verglichen (nur CRLF/LF normalisiert): alle identisch, richtige MIME-Typen. Echter unbekannter verschachtelter Pfad liefert die gestaltete Fehlerseite mit HTTP 404.

## Was vor der Reparatur tatsächlich reproduziert wurde

Ausgangsstand: `1c28c5294767a8a48b2c985ef2a87836ed858ded`, unveränderte versionierte Dateien. Vorhandene unversionierte `tests/*.spec.js` und `test-results/` wurden nicht überschrieben oder gelöscht. Andere parallel entstandene Dokumente unter `docs/stilkonzepte-t_4cec9218/` wurden weder verändert noch mitcommittet. Ausschließlich das Website-Repo `C:/Users/mas/Arbeit/Esoterik-Welt` wurde bearbeitet, kein Plugin-Repo.

**Wichtig:** Die vollständig weiße kanonische Startseite war zum Messzeitpunkt nicht reproduzierbar. Ihr dunkles CSS wurde bereits korrekt geladen. Reproduzierbar waren dagegen komplett ungestylte Rechteseiten und ein abgebrochener App-Aufbau. Dies wurde auch durch eine unabhängig zugestellte Live-Diagnose aus der Stilkonzept-Aufgabe bestätigt; sie ersetzt nicht den noch ausstehenden visuellen Review.

| Grenze | Vorher-Befund | Ursache und minimale Korrektur |
|---|---|---|
| HTML → CSS auf Rechteseiten | Impressum, Datenschutz und Haftung nur Browser-Standardtext auf Weiß; kein Viewport, kein CSS | Drei Einzeilen-Dokumente hatten keine Stylesheet-Links. Vorhandenes Design-System und Main-CSS eingebunden, vorhandene Inhalte unverändert in bestehende Header-/Card-Klassen gefasst, neun gezielte CSS-Regeln/Deklarationszeilen ergänzt; kein Redesign. |
| Modul → Datenquelle | `/Esoterik-Welt/js/data/moon-phases.js` HTTP 404, `text/html`, dynamischer Import schlägt fehl | `../data/moon-phases.js` relativ zu `js/modules/moon.js` zeigte an den falschen Ort. Import ist jetzt `../../data/moon-phases.js`, passend zur vorhandenen Datei `data/moon-phases.js`. |
| Kristallfilter → DOM | `Cannot read properties of undefined (reading 'style')` | Tippfehler `h4.style.h4.style.fontSize` zu `h4.style.fontSize` korrigiert. Der Fehler wurde wegen verzögerter Modulinitialisierung ebenfalls als frühe Ausnahme erfasst. |
| Initialisierung → Inhalt | Null statt fünf Feature-Karten, Mondansicht wirft Folgefehler | Die zwei vorstehenden Ursachen verhinderten den erfolgreichen Abschluss des bestehenden Initialisierungspfads. Kein neues Placeholder-HTML, keine erfundenen Daten und keine neuen Ersatzinhalte. |
| Navigation → Pages-Basis | Footer verlinkte `/impressum.html` usw., Rücklinks und 404-Links `/` | Footer auf basisrelative Rechteseiten, Rechteseiten mit `/Esoterik-Welt/` als Base und Rücklink `./`, 404-Rücklinks projektabsolut; letzteres funktioniert auch unter unbekannten verschachtelten Pfaden. |
| Lokaler Server → Produktionsquelle | Express verwendete alten `public/`-Platzhalter; Pages veröffentlicht dagegen `main:/` | Build verpackt die kanonischen Root-Dateien nach `dist/Esoterik-Welt/`. Express verwendet diese Dateien unter derselben Basis. Alte `public/`-Dateien bleiben erhalten, werden von der Vorschau aber nicht mehr verwendet. |
| Build | `npm run build` scheiterte an fehlendem Webpack-Einstieg `./src` | Tatsächlich handelt es sich um Vanilla-HTML/CSS/ES-Module, ohne Astro, Vite, Tailwind oder PostCSS. Ein einfacher Allowlist-Kopierbuild ersetzt den funktionslosen Webpack-Aufruf. Produktions-Pages-Quelle und bestehende Pages-Pipeline unverändert. |
| Mobiler Kristallkatalog | Nach funktionierender Dateninitialisierung ragten lange Namen/Favoriten aus 375-px-Karten | Im echten Browser auf die Titel-/Favoriten-Flexzeile minimiert; Titel darf schrumpfen/umbrechen, Favoritenknopf bleibt nutzbar. Kein globales Abschneiden mittels `overflow-x:hidden`. |

CSP war in den erfassten Antworten nicht gesetzt; es gab keinen Hinweis auf eine CSP-Blockade. CSS-/JS-Status und MIME stehen pro Request in den JSON-Protokollen. Das Startseiten-CSS war somit nicht durch eine neue globale Base-/CSP-Änderung zu ersetzen.

## Reproduzierbare Prüfungen

```bash
npm ci
npx playwright install chromium
npm run build
npm run test:pages
npm test -- --runInBand --runTestsByPath tests/api.test.js
PORT=4178 npm run preview
node scripts/verify-pages.cjs http://localhost:4178/Esoterik-Welt/ evidence/preview
node scripts/verify-pages.cjs https://ingbms.github.io/Esoterik-Welt/ evidence/live
```

Ausgeführte Ergebnisse:

- Vor Implementierung: fünf Quellenregressionen rot (drei Rechteseiten, fehlender Modulimport, basisverletzende Links). Zusätzlich Live-Fehler in Console/Netzwerk erfasst und als Screenshots gesichert.
- Verschachtelte lokale 404 separat zuerst rot (`Cannot GET ...`), nach Korrektur grün; Log `404-red.log`.
- Produktionsbuild: erfolgreich, Ausgabe `Static production build ready: dist/Esoterik-Welt/`.
- Neue Quellen-/Preview-Regression: **6 bestanden, 0 fehlgeschlagen**.
- Vorhandene API-Tests: **2 bestanden, 0 fehlgeschlagen**. Vorher fehlte `supertest`; als Dev-Abhängigkeit ergänzt. Express exportiert die App jetzt testbar und startet nur bei direktem Aufruf einen Listener.
- Lokale Chromium-Produktionsvorschau: **30 bestanden, 0 fehlgeschlagen** bei der echten Basis.
- Live-Chromium: **30 bestanden, 0 fehlgeschlagen**, zusätzlich drei erfolgreiche reale Navigationsläufe.
- Alle Inhaltsbereiche gefüllt: 78 Tarot-Karten, 30 Kristalle, 24 Runen, 10 anfänglich geladene Artikel, Kalender mit 42 Tageszellen plus Kopfzeile, zwei zur gemessenen Phase passende Rituale; fünf Startseiten-Features.
- `git diff --cached --check`: erfolgreich. Automatische Prüfung hinzugefügter Zeilen auf Secrets/gefährliche Ausführungsformen: keine Treffer. Explizite Stage-Allowlist mit 15 Dateien, kein `git add -A`.
- Zehn vorhandene Arbeitsdateien (sieben unversionierte Specs und drei Dateien in `test-results/`) per SHA-256-Manifest vor Commit und am Ende verglichen: unverändert. Diese Hash-Sicherung stammt aus dem laufenden Reparaturversuch, nicht aus einer erfundenen historischen Baseline.

### Grenzen der Messung

Das erste Diagnose-Harness markierte die bereits gestaltete 404 wegen transparentem `background-color` fälschlich rot; tatsächlich war ihr Gradient vorhanden. Das Harness wurde auf Farbe **oder** Hintergrundbild präzisiert. Auch 304-Antworten ohne MIME-Header erzeugten zunächst lokale Fehlalarme; die endgültige Prüfung deaktiviert den Browsercache und zeichnet frische Antworten auf. Die historischen Rohprotokolle werden nicht nachträglich verändert. Hash-Routen werden endgültig über `about:blank` frisch gestartet, damit ein vorhandenes Dokument keine Initialisierungsfehler verdeckt.

Die 60 Live-PNGs sind echte Browseraufnahmen. Alle 30 Nachher-PNGs wurden zusätzlich geöffnet und programmgesteuert auf richtige Breite, Höhe, dunklen Pixelanteil und mehr als 100 unterschiedliche Samplefarben geprüft; das belegt nichtleere gerenderte Bilder, **keinen** menschlichen Designentscheid. Das angebotene Vision-Werkzeug konnte seine konfigurierte Modell-ID nicht laden (`model_not_found`). Es wird daher keine unabhängige Bildsichtung oder pixelgenaue gestalterische Freigabe durch diesen Worker behauptet. Die vorhandenen nachgelagerten Review-Aufgaben prüfen dies unabhängig. Kein kostenpflichtiger Ersatzprovider wurde konfiguriert oder verwendet.

Nur Chromium automatisiert ausgeführt; Safari und echte Mobilgeräte sind nicht neu geprüft. Inhaltliche/rechtliche Aussagen der bestehenden Rechteseiten wurden nicht umgeschrieben oder juristisch geprüft. Das schon vorher fehlende OG-Vorschaubild und Platzhalter-Links für Glossar/Quellen wurden nicht als erledigte neue Funktionen ausgegeben.

## Dateien und Nachweise

Hauptbelegverzeichnis: `C:/Users/mas/Arbeit/Esoterik-Welt/evidence/t_9ff78898/`

- `before/`: 30 Original-PNGs und ursprüngliches Console-/Netzwerk-/Rendering-Protokoll.
- `after/`: 30 veröffentlichte Nachher-PNGs und vollständiges Protokoll.
- `comparison.html`: Vorher/Nachher-Galerie, Links zu unverkleinerten Full-Page-Dateien. **Vorher ist der beobachtete Fehlerzustand, keine akzeptierte historische Design-Baseline.**
- `build-tests.log`, `live-verification.log`, `live-extra.json`, `summary.json`, `screenshot-metrics.json`.
- `deployment.json`, `pages-source.json`, `actions.json` mit tatsächlichem Remotezustand.
- `precommit-audit.json`, `preserved-work-manifest.json` und reproduzierbare Zusatzprobes.

Der Bericht und das ZIP werden als Task-Artefakte angehängt; nicht benötigte Diagnose-/Screenshotdaten wurden nicht in die öffentliche Pages-Quelle committet.

## Noch separat zu bearbeiten

Die allgemeine CI und der Staging-Workflow sind weiterhin rot wie bereits vor dieser Reparatur. Sie wurden zuletzt mit Plugin-spezifischen Python-/Dashboard-/SSH-Schritten und fremder Zieladresse in das Website-Repo übernommen. Der tatsächliche **GitHub-Pages-Produktionsbuild ist erfolgreich**; dies darf nicht als vollständig grüne Gesamt-CI bezeichnet werden. Auch `npm install` meldet unverändert 39 Dependency-Vulnerabilities (6 low, 20 moderate, 13 high); keine riskante automatische Massenaktualisierung im Hotfix.

Folgekarte **t_cadcfeb4**, Profil `devops`, behandelt die fachfremden Workflows nach dieser Reparatur. Visuelle unabhängige Reviews: **t_befcdea7** und **t_c0ac2da9**. Diese Karten bleiben die zuständigen unabhängigen Abnahmelanes; keine zusätzliche gleichzeitige Same-Card-Review angelegt.

Rollback des isolierten Hotfixes wäre ein normaler `git revert 24d8053ebc1bc4438a35a1c52b5d6f8c1718594e` auf `main` mit erneuter Pages-/Live-Prüfung; **nicht ausgeführt**, kein Force-Push.
