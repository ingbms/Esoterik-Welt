# RAD-08 — Pendeltafel-Studio: Checkpoint

**Stand:** 3. November 2026
**Karte:** t_afc913b7 · Master t_878c59c7 / ESOW-RAD-000
**Arbeitsbaum:** `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul`
**Basis:** `3ef7939` (RAD-07-Doku)
**Feature-Commit:** `2d1a1de`
**Nachbesserung:** `1e0d55f` (Randabstand der Beschriftungen, ehrliche Vorlagenanzeige)
**Dokumentationscommit:** RAD-08-Doku; SHA über `git log -1 -- docs/radiasthesie-completion/RAD-08/CHECKPOINT.md`
**Kein Push, kein Deployment, keine Veröffentlichung.**

## 1. Was umgesetzt ist

Echte Route `#pendeln/studio` („Pendeltafel-Studio“) mit:

| Anforderung | Umsetzung | Nachweis |
| --- | --- | --- |
| Klassische Ja/Nein-Tafel | Vorlage `janain`, zwei Hälften, JA links, NEIN rechts | `tests/pendeltafel-studio.mjs` (Geometrie), Browsertest „alle sechs Vorlagen“ |
| Zahlenkreis | Vorlage `zahlenkreis`, 0–9, 0 oben | Modul- und Browsertest |
| Buchstabentafel | Vorlage `buchstaben`, A–Z, A oben, 26 Segmente | Modul- und Browsertest, Evidenzbild |
| Verschiedene Segmenttafeln | `segmente4`, `segmente6`, `segmente12` (4/6/12 Felder) | Browsertest über alle Vorlagen |
| Frei konfigurierbare Beschriftungen | Textfeld, eine Zeile je Segment, 2–48 Segmente | Browsertest „freie Beschriftungen“ inkl. Umlaute |
| Wählbare Farbstile | Messing, Salbei, Nachtrose, Papier (Tokens des Designsystems) | Browsertest je Stil, Kontrasttest ≥ 4,5:1 / ≥ 3:1 |
| SVG-Export | Eigenständige Datei, `viewBox 600 × 660`, Titel/`desc`, Segmente, Fußzeile | Browsertest mit Download und Inhaltsprüfung |
| Druckansicht und PDF | A4-Fläche im DOM, `@page A4`, eigener Druck-CSS-Pfad, `window.print()` | Browsertest Print-Medien + echte PDF-Datei (1 Seite, A4) |
| Escaping und Importvalidierung | Schema, Größe, Zeichenlängen, Steuerzeichen, Markup; zusätzliches XML-Escaping | 37 Modultests, XSS-Browsertests |
| Optik des Projekts | Serifen-Titel, Messing-Linien, nächtlicher Grund, Papier-Variante, Tokens statt Rohwerte | Evidenzbilder, Kontrastmessung |

Zusätzlich:

* Import aus Datei **und** aus eingefügtem JSON, beide über denselben Prüfpfad.
* JSON-Export der Konfiguration als Gegenstück zum Import (Export → Reimport → identische Zeichnung).
* Statusmeldungen (`role="status"`, `aria-live="polite"`), Fehlerliste (`role="alert"`),
  `aria-invalid` an den betroffenen Feldern.
* Das Auswahlfeld zeigt „Eigene Beschriftungen“, sobald die Zeilen von der geladenen
  Vorlage abweichen; die Konfiguration behält dabei die Vorlage als Schema-Angabe.
* Werkstatt-Karte der Startseite auf „Verfügbar“ mit Link `#pendeln/studio`; Fakt des
  Themas Pendeln von „(in Vorbereitung)“ auf „Pendellabor und Tafel-Studio“ korrigiert;
  Redaktionstext in `docs/radiasthesie-konzept/inhalte/pendeln.md` entsprechend angepasst.
* Das Studio wird beim Routenwechsel über `destroy()` beendet (Entpreller, Listener,
  `html.ptf-print-active`), damit kein Zustand auf eine andere Ansicht wirkt.

## 2. Dateien

### Neu

| Datei | Inhalt |
| --- | --- |
| `js/modules/pendeltafel-model.js` | Vorlagen, Paletten, Grenzen, Prüfung, Geometrie, SVG-Erzeugung, Kontrastfunktion — ohne DOM |
| `js/modules/pendeltafel-studio.js` | Bedienung: Vorschau, Vorlagenwechsel, Import, Export, Druck, Status/Fehler |
| `tests/pendeltafel-studio.mjs` | 37 Modultests (Node, ohne Browser) |
| `tests/pendeltafel-studio.spec.js` | 17 Browsertests (Playwright/Chromium) |
| `docs/radiasthesie-completion/RAD-08/CHECKPOINT.md` | dieser Bericht |
| `docs/radiasthesie-completion/RAD-08/EXPORTE.md` | dokumentierte Exportwege, Formate, Grenzen |
| `docs/radiasthesie-completion/RAD-08/evidence/` | Screenshots und PDF-Nachweis |

### Geändert

| Datei | Änderung |
| --- | --- |
| `js/modules/radiasthesie-views.js` | `renderStudio()`, Import der Tafel-Daten |
| `js/modules/radiasthesie.js` | Mount/Teardown des Studios, Fall `studio` |
| `js/modules/radiasthesie-model.js` | Route `studio` (ohne Query-Zustand) |
| `js/modules/radiasthesie-format.js` | `ROUTE.studio` |
| `css/radiasthesie.css` | `.ptf-*`, A4-Druckfläche, Druckregeln nur bei gerendertem Studio |
| `scripts/generate-radiasthesie-data.cjs` | Werkstatt-Karte verfügbar, Themen-Fakt, Redaktionstext |
| `js/data/radiasthesie.js` | neu erzeugt (`npm run data:radiasthesie`) |
| `docs/radiasthesie-konzept/inhalte/pendeln.md` | „in Vorbereitung“ → „Tafel-Studio in der Werkstatt“ |
| `package.json` | `test:radiasthesie:tafeln`, Aufnahme in `test:all` |
| `tests/radiasthesie.mjs` | zusätzliche Moduldatei im isolierten Import |
| `tests/radiasthesie-simulator.mjs` | Werkstatt-Erwartung auf zwei verfügbare Werkzeuge aktualisiert (RAD-07 + RAD-08) |
| `Lokal.html` | Offline-Build neu erzeugt |

## 3. Ausgeführte Tests (echte Läufe)

| Befehl | Ergebnis |
| --- | --- |
| `node --test tests/pendeltafel-studio.mjs` | **37/37 pass**, Exit 0 |
| `E2E_PORT=3411 npx playwright test tests/pendeltafel-studio.spec.js` | **17/17 pass**, Exit 0 |
| `node --test tests/radiasthesie.mjs` | 16/16 |
| `node --test tests/radiasthesie-vertraege.mjs` | 19/19 |
| `node --test tests/radiasthesie-simulator.mjs` | 21/21 |
| `node --test tests/pendeltafel-studio.mjs` (Gesamtlauf) | 37/37 |
| `npm run test:unit` | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:crystals` | grün |
| `npm run test:astrologie` | grün |
| `npm run test:tarot` | 11/11 |
| `npm run test:tarot:decks` | 12/12 |
| `npm run test:moon` | 14/14 |
| `npm run test:offline` | 2/2 (Offline-Datei, alle Routen ohne Netz) |
| `E2E_PORT=3411 npx playwright test` (alle Specs) | **115/115 pass** |
| `npm run lint` | 0 Fehler |
| `npx prettier --check` (geänderte Dateien) | konform |
| `npm run build` | grün, `Lokal.html` ohne Netzbezug |
| `node scripts/verify-pages.cjs http://127.0.0.1:3345/Esoterik-Welt/ test-results/verify-local` | 36 Seiten/Viewports, 0 Fehler (inkl. Navigationsklicks) |
| `npm run verify:build` | grün |
| PDF-Nachweis `evidence/pendeltafel-studio-druck.pdf` | `%PDF-1.4`, 73.968 Bytes, MediaBox 594,96 × 841,92 pt, **1 Seite** |

Hinweis: `npm run verify:pages` **ohne** Basisargument prüft die veröffentlichte Seite
`https://ingbms.github.io/Esoterik-Welt/`. Dort fehlt RAD-08 (kein Push), deshalb schlägt
die Pendeln-Route dort fehl. Mit der lokalen Build-Basis ist der Lauf vollständig grün;
so ist es oben dokumentiert.

## 4. Sicherheitsmodell (geprüft)

1. **Kein SVG-Import.** Das Studio erzeugt SVG ausschließlich selbst; fremdes SVG kann
   nicht in die Anwendung gelangen. Damit entfällt der gefährlichste Pfad (Skripte,
   Eventhandler, externe Referenzen in importierten Zeichnungen).
2. **Strenge Schema-Prüfung** der JSON-Konfiguration: nur `schema`, `preset`, `title`,
   `palette`, `labels`; unbekannte Felder werden abgelehnt (auch `onload`, `href`, `html`,
   `style`, `__proto__`).
3. **Grenzen:** ≤ 32 KiB Importgröße (vor dem Parsen geprüft), 2–48 Segmente,
   ≤ 60 Zeichen Überschrift, Zeichenlänge je Beschriftung zusätzlich geometrisch begrenzt
   (bei 48 Segmenten 3 Zeichen), keine Steuerzeichen, keine Zeichen `<` und `>`.
4. **Escaping:** Jeder Text wird vor der Ausgabe über `escapeXml` escaped (`& < > " '`);
   im XML steht z. B. `Größen &amp; Maße`, nie ein rohes `&`.
5. **Ausgabe-Whitelist:** Attribute, Farben und Geometrie stammen nur aus dem Modul.
   Getestet: kein `<script`, kein `on*=`-Attribut, kein `javascript:`, kein `data:`,
   kein `<foreignObject>`, `<image>`, `<use>`, `<style>`, kein `xlink:href`, kein `@import`.
   Genau eine URL im Dokument: der XML-Namespace.
6. **XSS-Tests** über Tippen und über Import (Datei und Textfeld): Payload wird abgelehnt,
   Vorschau bleibt beim letzten gültigen Stand, kein Dialog, keine Ausführung, kein Download.

## 5. Entscheidungen und Abweichungen

| Nr. | Entscheidung | Begründung |
| --- | --- | --- |
| E1 | Route `#pendeln/studio` (Masterprompt nennt keinen Pfad) | Werkstatt-Sprache des Moduls, kollidiert nicht mit Themen-Ankern (`#pendeln/pendeln/tafeln`) |
| E2 | Fünf Vorlagen plus Ja/Nein = sechs Einträge: `janain`, `zahlenkreis` (0–9), `buchstaben` (A–Z), `segmente4/6/12` | Deckt die vier geforderten Tafelarten ab; 0–9 ist der übliche Zahlenkreis, 1–12 steht als Segmenttafel bereit |
| E3 | Zeichenlänge hängt von der Segmentzahl ab (bei 48 Segmenten 3, bei 26 sechs, bei 12 zwölf, bei 2 achtunddreißig) | Eine feste Grenze von 40 Zeichen würde bei 48 Segmenten unlesbare Tafeln erzeugen; die Grenze folgt der Sehnenlänge bei kleinster Schrift mit Luft zum Ring |
| E4 | Kein Query-Zustand in der Adresse | Eine URL würde eine Tafel vortäuschen, die nur im Browser entsteht; Export/Import übernimmt die Weitergabe |
| E5 | JSON-Export zusätzlich zum geforderten SVG-Export | Macht Export → Reimport prüfbar und erlaubt Weitergabe ohne Zeichnung |
| E6 | Druck/PDF über den Browserdruck (ausdrücklich zulässig) | Keine PDF-Bibliothek im Projekt; A4-Regeln, echter PDF-Nachweis, Grenzen dokumentiert |
| E7 | Druckansicht ohne eingebackene Bildüberschrift | Überschrift und Fußzeile stehen als HTML auf der A4-Fläche; der SVG-Export behält beides |
| E8 | Druckregeln nur bei gerendertem Studio (`html.ptf-print-active`) | Der Ausdruck anderer Seiten bleibt unverändert; ohne diese Klammer würde die lange Seite in leere Blätter zerfallen |
| E9 | Redaktionstext und Werkstatt-Karte angepasst | Der Satz „ist in Vorbereitung“ wäre nach der Auslieferung falsch |

## 6. Offene Punkte

* Nur **Chromium** (Playwright 1.64) geprüft; Firefox und Safari sind offen.
* Kein Screenreader-Lauf; Tastatur, Fokus, Labels und `aria-invalid` sind browsergetestet.
* PDF wurde über `page.pdf()` (Chromium, headless, Druck-CSS) **real erzeugt und geprüft**
  (Signatur, A4-MediaBox, genau eine Seite, Screenshot der Druckfläche). Der interaktive
  Druckdialog („Als PDF speichern“ per GUI) wurde nicht bedient; der Knopf ruft
  `window.print()` nachweislich genau einmal auf.
* `npm run verify:pages` prüft ohne Argument die veröffentlichte Seite; dort fehlt RAD-08
  erwartungsgemäß (kein Push). Lokal 0 Fehler.
* Lighthouse nicht gefahren.
* Der aus RAD-07 bekannte Flake in `tests/radiasthesie.spec.js` (Tastatur/Fokus) kann
  weiterhin auftreten; im Gesamtlauf war er nicht reproduzierbar (115/115 grün).
* CI ruft die Radiasthesie-Tests weiterhin nicht auf; `test:all` enthält jetzt auch
  `test:radiasthesie:tafeln`.
* Werkstatt-Karte „Experimentierlabor“ bleibt „In Vorbereitung“ (RAD-09).

## 7. Nächster Schritt

RAD-09 (t_99500d31): verblindetes Experimentierlabor mit Statistik. Wegen desselben
Router-/CSS-Schreibers bleibt die Single-Writer-Kette bestehen; zuerst
`kanban_show` der Karte, dann Protokoll und Statistik testgetrieben, danach die
Werkstatt-Karte auf „Verfügbar“ setzen.
