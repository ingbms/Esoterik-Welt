# Astrologiebereich — Implementierungsbericht und Checkpoint

- **Task:** `t_cc4fc7d7`
- **Lauf:** 2026-11-02, Run 271, Profil `coding_debug`, Modellroute `deepseek/deepseek-flash`
- **Scope:** `C:/Users/mas/Arbeit/Esoterik-Welt` (Arbeitsbaum, Remote `ingbms/Esoterik-Welt`)
- **Grundlage:** freigegebenes Inhalts-/Schemapaket `docs/astrologie-konzept/` (Task `t_f81e9094`, Review Runde 4), Nachtatelier-Stilpaket (Task `t_280f3753`), Mondbereich `t_f7b2af0a`
- **Status:** lokale Implementierung fertig und selbst geprüft. **Kein Commit, kein Push, kein Deploy.** Unabhängige Gesamt-QA: Karte `t_60bec033`.
- **HEAD während des Laufs unverändert:** `1f2726c` („ci: make the release gate green on a clean checkout“)

## 1. Ausgangslage und Bewahrung fremder Arbeit

Der Arbeitsbaum war beim Start bereits stark verändert (29 modifizierte, viele unversionierte Dateien aus den Karten `t_280f3753`, `t_3590d240`, `t_cd00e0a8`, `t_f7b2af0a`, `t_f81e9094`, `t_774c3023`, `t_62b99637`, `t_32e80593`, `t_b5861420`).

- `git status` und `git log` wurden vor dem ersten Schreibzugriff erhoben (`evidence/t_cc4fc7d7/pre-state.md`).
- Es wurde **keine** fremde Datei zurückgesetzt, umgeschrieben oder gelöscht. Änderungen an bestehenden Dateien sind additiv (neue Zeilen/Blöcke), die vorhandene Struktur und Reihenfolge bleibt erhalten.
- Ein vollständiger Byte-Snapshot des schmutzigen Arbeitsbaums vor dem ersten Schreibzugriff existiert nicht. Diese Grenze wird offen benannt; belastbar ist der unveränderte HEAD (`1f2726c`) als Vergleichsbasis für committete Blobs.
- **Offengelegter Zwischenfall:** Das Paketwerkzeug `docs/astrologie-konzept/scripts/validate.cjs` schreibt seinen Prüfbericht fest nach `evidence/t_f81e9094/validation-report.json`. Ein Aufruf zur Nachprüfung der Kartenanforderung „JSON-/Schema-/Vollständigkeitsprüfung“ hat diese fremde Evidenzdatei mit neuem `generated_at` überschrieben (Inhalt sonst identisch, Hash dadurch anders). Details und Bewertung: `evidence/t_f81e9094/NOTICE-overwritten-by-t_cc4fc7d7.md`. Die Paketdaten sind nachweislich unverändert (`manifest.cjs --check` pass, Content-Aggregat `2f812b91…` wie dokumentiert).

## 2. Was gebaut wurde

### Neue Dateien

| Datei | Zeilen | Zweck |
|---|---:|---|
| `scripts/generate-astrologie-data.cjs` | 245 | erzeugt das Datenmodul aus dem freigegebenen JSON-Paket und prüft dabei Vertrag, Zählungen, IDs, Querverweise, Quellen, Marker und Platzhalter; `--check` erkennt veraltete Builds |
| `js/data/astrologie.js` | generiert, 271.541 B | ES-Modul mit den 10 Datensätzen (12/10/12/5/24/6/4/15/65 + 25 Quellen, 28 Claims), 206 IDs |
| `js/modules/astrologie-format.js` | 156 | reine Formatierung: HTML-Escaping, Absätze, `**fett**`, `[Sxx]`-Marker als Links, Kennzeichnungs-Badges, Metadatenlisten, Brotkrümel, Routen |
| `js/modules/astrologie-model.js` | 285 | Indizes über ID **und** Slug, Querverweis-Auflösung, Suchindex (diakritikfrei), Filter für Zeichen/Faktoren/Grundlagen/Glossar |
| `js/modules/astrologie-views.js` | 766 | Ansichten Hub, Lernpfad, Zeichen, Faktoren, Häuser, Aspekte (Index + Detail) |
| `js/modules/astrologie-views-reference.js` | 614 | Ansichten Grundlagen, Beispiele, FAQ, Glossar, Quellen/Claims, Methodik, Suche, Fehler |
| `js/modules/astrologie.js` | 310 | Bereichsmodul: Router-Segmente → Ansicht, bedarfsgerechtes Laden, Live-Filter, Fokus, Sprungmarken |
| `tests/astrologie.mjs` | 454 | 21 Node-Tests: Vertrag, Vollständigkeit, komplettes Rendering aller Datensätze inkl. Beispielen, Suche/Filter, Fehlerzustände |
| `tests/astrologie.spec.js` | 269 | 15 Playwright-Tests: Navigation, Kaltstart-Deeplinks, Zurück/Vorwärts, Filter/Suche, Tastatur/Fokus, Überlauf 375/768/1440, Kontrast, bedarfsgerechtes Laden |
| `docs/astrologie-t_cc4fc7d7.md` | – | dieser Bericht |

### Geänderte Dateien (additiv)

| Datei | Änderung |
|---|---|
| `index.html` | siebtes Hauptnavigationsziel „Astrologie“, Startseiten-Hero-Link, Abschnitt `#astrologie` mit `#astrologieRoot` und `<noscript>`-Kurzfassung, Footer-Link, „Sechs Zugänge“ |
| `js/main.js` | Route `#astrologie[/…][?query]` in `parseRoute`, Modulinstanz, Übergabe der Segmente an `show()`, Vorladen des Datenmoduls beim Kaltstart, siebter Eintrag im Pfad-Register |
| `css/main.css` | rund 1.100 Zeilen Astrologie-Komponenten (Tokens, Filter, Karten, Details, TOC, Quellenpanel, Druck), Nachbarbereiche, Band 781–1120 px für die Kopfzeile |
| `package.json` | `test:astrologie`, `data:astrologie`; `test:all` ruft die neuen Tests mit auf |
| `.prettierignore` | generiertes Datenmodul ausgenommen (Ein-Zeilen-JSON, Frische wird getestet) |
| `.github/workflows/ci.yml` | Schritt `npm run test:astrologie` im Unit-Test-Job |
| `scripts/verify-pages.cjs` | Route `astrologie`, sechs Feature-Kacheln, Container-Prüfung nur auf der eigenen Route |
| `tests/local-entry.cjs` | sechs Kacheln, Modulliste mit `astrologie`, Route in beiden Schleifen, Kaltstart `#astrologie/zeichen/widder` offline |
| `tests/offline-file.cjs` | sechs Kacheln, Route und Kaltstart-Deeplink im Doppelklick-Build |

Die Anpassungen an `verify-pages.cjs`, `local-entry.cjs` und `offline-file.cjs` sind keine Abschwächungen: Die erwartete Zahl steigt von fünf auf sechs, die Astrologie wird zusätzlich inhaltlich geprüft (gerenderte h1, Textmenge > 800 bzw. > 3000 Zeichen, Deeplink-Titel „Widder“).

## 3. Architekturentscheidungen

1. **Ein Datenmodul statt `fetch()`.** Der Offline-Build muss per Doppelklick ohne Netz laufen; `fetch()` und dynamische Imports auf `file://` sind dort unzuverlässig. `scripts/generate-astrologie-data.cjs` erzeugt deshalb `js/data/astrologie.js` aus `docs/astrologie-konzept/content/*.json`. Das JSON bleibt die einzige Quelle, das Modul ist reproduzierbar (`--check`, zusätzlich als Test).
2. **Bedarfsgerechtes Laden unter HTTP, Inlining offline.** `js/modules/astrologie.js` lädt das Datenmodul über `import('../data/astrologie.js')`. Unter HTTP wird die Datei erst beim ersten Öffnen des Bereichs geholt; im Offline-Build inlined webpack sie wegen `dynamicImportMode: 'eager'` in die eine `local.js` (vorab mit einem Minimalbeispiel geprüft: `evidence/t_cc4fc7d7/probe-eager-import.cjs`). Gemessen: erster Seitenaufruf ohne Datenmodul, erster Astrologie-Aufruf +271.541 B (75.531 B gzip).
3. **Route-Gruppe im bestehenden Router, kein Unter-Router.** `#astrologie` ist eine siebte `.page`; alles nach dem Präfix wird als Segmente an das Bereichsmodul gegeben. Unbekannte Pfade beantwortet der Bereich selbst („Diese Seite gibt es nicht (mehr)“), statt die globale Todeslink-Meldung zu zeigen. Kaltstart, Zurück/Vorwärts und direkte Links laufen über denselben `parseRoute`-Pfad wie die übrigen Seiten.
4. **In-Page-Sprungmarken laufen nicht über den Hash.** Inhaltsverzeichnis und Buchstabensprung benutzen `<a href="<eigene Route>" data-astro-scroll="…">`; der Klick wird abgefangen und scrollt/fokussiert. Ein `href="#abschnitt"` würde den Router auf eine unbekannte Route schicken — der Test „internal links only use known area routes“ hält das dauerhaft fest.
5. **Filter- und Suchzustand in der Adresse, aber ohne Verlaufsspam.** Jede Filteränderung schreibt `history.replaceState` mit `?element=…&q=…`; Zurück führt damit zur vorigen Seite, nicht zum vorigen Tastendruck. Live-Filterung rendert nur den Bereich neu und stellt Fokus plus Cursor im Suchfeld wieder her.
6. **Kennzeichnung und Quellen sind Teil der Ansicht, nicht des Repositorys.** Jede Detailseite rendert die Kennzeichnung als Text-Badge mit Hinweis; das Quellenpanel zeigt je Item genau die genannten Quellen mit Herausgeber, Typ, Abrufdatum, Abrufstatus und Grenzen, dazu die Claims mit Evidenztyp und Sicherheit. `[Sxx]`-Marker werden zu Links in das Quellenverzeichnis (`?quelle=S11`, Ziel wird hervorgehoben).
7. **Keine Berechnung, keine Eingaben.** Es gibt kein Eingabefeld für Geburtsdaten, keine Positionsberechnung, keine Gradangaben, keine „Live“-Werte. Zeitspannen der Zeichen sind als Näherung gekennzeichnet; die Methodikseite benennt Ephemeride, Lizenz, Zeitzone und Datenschutz als Voraussetzungen einer echten Berechnung (eigener Folgescope).
8. **Symbole als Textzeichen.** Unicode-Zeichen wie ♈/☌ wurden von Chromium als Farb-Emoji gerendert. `U+FE0E` plus `font-variant-emoji: text` und eine System-Symbolschrift halten sie in der Nachtatelier-Palette (vorher/nachher im Screenshot-Vergleich geprüft).
9. **Kopfzeile bleibt vollständig.** Mit sieben Zielen lief die horizontale Navigation zwischen 781 und ca. 1120 px um bis zu 74 px über. Statt die Mobile-Navigation früher einzuschalten, rücken die Links in diesem Band enger zusammen (`gap`, `text-xs`). Gemessen: 0 px Überlauf bei 781/850/900/1000/1100 px.

## 4. Abdeckung der Kartenanforderungen

| Anforderung | Umsetzung | Nachweis |
|---|---|---|
| Eigenes sichtbares Hauptnavigationsziel | siebtes `.nav-link` „Astrologie“ | Playwright „main navigation opens the area“, `verify:build` |
| Startseitenzugang | Hero-Link „Astrologie lernen“, sechste Pfad-Kachel, Footer-Link | Playwright (6 Kacheln), Sichtprüfung |
| Direkte Hash-/URL-Landungen im echten Router | `#astrologie[/bereich[/slug]][?query]` | Playwright Kaltstart-Tests, `test:local`, `test:offline` |
| Einsteiger-Lernpfad, navigierbar | 6 Stufen mit Ziel, Lesezeit, Schritten, Materiallinks, Verständnisfragen, „nächste Stufe“ | Node-Tests, Playwright |
| Inhaltsverzeichnis | je Detailseite, mobil `<details>`, ab 1200 px sticky | Playwright Tastaturtest |
| Stufen Grundlagen/Vertiefung/Nachschlagen | Grundlagen-Index mit drei Gruppen und Filter | Node-Test (10/11/3), Screenshot |
| Interaktive Übersichten mit Filter/Suche | Zeichen (Element/Modalität/Suche), Faktoren, Grundlagen, Glossar, Volltextsuche | Playwright Filter-/Suchtest, Node-Tests |
| Querverweise | 300+ aufgelöste Referenzen, alle als echte Links | Node-Test „every id, slug and cross reference resolves“ |
| ≥ 3 Synthesebeispiele | 4 fiktive Beispiele mit Annahmen, Schritten, Synthese, Alternativlesart, Grenzen | Node-Test, Playwright |
| 12/10/12/5 + Glossar + FAQ vollständig | alle gerendert, keine Teaser | Node-Tests (Zählung im DOM-String), Playwright (DOM-Zählung) |
| Progressive Details, keine Überlauftabellen | `<details>`-Panels, Metadaten als Definitionslisten | Layout-Probe (112 Messungen), Playwright |
| Stabile Back-/Forward-/Deeplinks | Router-Traversal + `replaceState` für Filter | Playwright „detail, back and forward“ |
| Tastatur, Fokus, Leer-/Fehlerzustände | Fokus auf h1 je Route, sichtbarer Fokusring, Leerzustand mit Reset, bereichsinterne Fehleransicht, Ladefehler-Ansicht | Playwright Tastatur-/Fehlertests |
| Quellen und Kennzeichnung lesbar im Bereich | Badges, Quellenpanel, Quellen-/Claim-Ledger, Methodik | Node-Tests, Screenshots |
| Kein Scheingenauigkeitsrechner | keine Eingaben, keine Berechnung, explizite Hinweise | Code-Review, Node-Test auf „keine Berechnung“-Texte |
| Links zu Mond/Tarot nur inhaltlich sinnvoll | Hub-Abschnitt „Nachbarbereiche“ mit Abgrenzung, keine Kausalaussage | Node-Test (erlaubte Cross-Area-Ziele), Sichtprüfung |
| Einbindung in Offline-/Preview-/Pagesbasis | Build kopiert `js/`; Offline-Bundle inlined; `/Esoterik-Welt/`-Basis | `test:local`, `test:offline`, `verify:build` |
| JSON-/Schema-/Vollständigkeits-/Browsertests | Generator-Prüfungen + 21 Node-Tests + 15 Playwright-Tests | siehe §5 |
| Keine Rechtfreigabe erfunden | Rechtehinweise je Quelle aus dem Paket gerendert; Methodik nennt die Grenze | Node-Test, Quellenansicht |

## 5. Verifikation (tatsächlich ausgeführt am 2026-11-02)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Lint | `npm run lint` | exit 0, 0 Warnungen |
| Format | `npm run format:check` | „All matched files use Prettier code style!“ |
| Datenfrische | `node scripts/generate-astrologie-data.cjs --check` | pass, 206 IDs, 268.999 B |
| Jest | `npm test` | 2/2 |
| Pages-Regression | `npm run test:pages` | 6/6 |
| Astrologie-Vertrag/Rendering | `npm run test:astrologie` | **21/21** |
| Tarot | `npm run test:tarot` | 10/10 |
| Mond | `npm run test:moon` | 14/14 |
| Offline-Datei | `npm run test:offline` | 2/2 |
| Lokaler Einstieg + Pages | `npm run test:local` | 12 pass, 0 fail, 2 vorbestehende Skips |
| Build-Verifikation | `npm run verify:build` | 33 Seiten/Viewports, 0 Fehler |
| Browser-Suite | `npx playwright test` | **74/74** (59 vorher + 15 neu) |
| Paketvalidator (fremd) | `node docs/astrologie-konzept/scripts/validate.cjs` | pass, 12/10/12/5, 4/15/65/6, 28.120 Wörter |
| Paketmanifest (fremd) | `node docs/astrologie-konzept/scripts/manifest.cjs --check` | pass, 34 Dateien |
| Content-Aggregat | sha256 über `content/*.json` | `2f812b91…c8a9b` (unverändert) |

Rohprotokolle der Läufe: `evidence/t_cc4fc7d7/gates-unit.txt` und `gates-browser.txt`.

Zusätzliche eigene Messungen (Skripte in `evidence/t_cc4fc7d7/`):

- **Layout:** `probe-layout.mjs` — 14 Breiten (360/375/390/480/640/768/781/850/900/1000/1100/1200/1440/1920) × 8 Ansichten = 112 Messungen, **0 Überläufe** (Dokument, Kopfzeile, innere Komponenten). Vor der Kopfzeilen-Korrektur: 74 px Überlauf bei 781–900 px.
- **Kontrast:** `probe-contrast.mjs` — Fließtext 10,07:1; Titel 15,36:1; Metadaten-Label 9,33:1; Badge 10,07:1; aktiver Filter-Chip 9,33:1; Links im Quellenpanel 15,36:1 (alle ≥ 4,5:1).
- **Payload:** erster Aufruf ohne `js/data/astrologie.js`; erster Astrologie-Aufruf lädt genau diese eine Datei zusätzlich (271.541 B, gzip 75.531 B). Die Ansichtsmodule (ca. 78 kB) liegen im Hauptstrang, weil sie zum Bereichsmodul gehören.
- **Marker/Quellen:** `probe-markers.mjs` — 7 Marker je Zeichen-Detail, keiner bleibt als Rohtext stehen.

## 6. Grenzen und bewusst nicht Geprüftes

- **Keine reale Berechnung.** Der Bereich erklärt und rendert Daten; Radix/Transite bleiben ein eigener, ungeprüfter Folgescope (so auch in der Kartenvorgabe).
- **Keine Druckfreigabe.** Es gibt `@media print`-Regeln (Navigation/Filter aus, Quellen als Liste, `break-inside`), aber keine Druckabnahme und keinen Probedruck.
- **Kein Screenreader-/Axe-Lauf.** Geprüft wurden DOM-Struktur (genau eine h1 pro Ansicht), Fokusführung, Tastaturbedienung, Kontrast und `aria`-Attribute; ein echter Screenreader-Test steht aus (wie in den Vorgängerkarten).
- **Nur Chromium** (Playwright/Chromium, wie die bestehende Suite). Firefox/Safari sind nicht gemessen.
- **Keine Nutzertests.** Verständlichkeit wurde redaktionell gelesen, nicht empirisch geprüft.
- **Rechtsprechung:** Rechtehinweise stammen aus dem freigegebenen Paket und werden nur angezeigt; keine neue Rechtsfreigabe.
- **Fremde Evidenz:** siehe §1 (Validator-Überschreibung) — offengelegt, Paketdaten unverändert.

## 7. Handoff

- **Unabhängige Gesamt-QA:** Karte `t_60bec033` (`design_critique`) prüft den gesamten Featurestand. Für den Astrologiebereich sind die Ansatzpunkte: `tests/astrologie.mjs`, `tests/astrologie.spec.js`, `evidence/t_cc4fc7d7/layout-probe.json`, `contrast.json`, Screenshots `astro-*.png` und `screens-*.png`.
- **Release:** nur durch eine explizite Releasekarte. Kein Commit/Push/Deploy aus dieser Karte.
- **Wiederherstellung/Neuaufbau:** `npm run data:astrologie` (Datenmodul aus JSON), `npm run build` (dist + Lokal.html), `npm run test:astrologie`, `npx playwright test tests/astrologie.spec.js`.
- **Bekannte Nicht-Blockser:** Der Fokusring um die h1 ist nach jeder Navigation sichtbar (gewollte Fokusführung, in Screenshots als heller Rahmen zu sehen). Die Suche ist auf 50 Treffer gekappt und sagt das im Ergebniszähler. Das Datenmodul ist 271 kB roh; eine Aufteilung nach Datentyp wäre möglich, wenn die Ladezeit auf Mobil zum Thema wird.

## 8. Reproduktion der Prüfungen

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
npm run data:astrologie -- --check
npm run lint && npm run format:check
npm test && npm run test:pages && npm run test:astrologie
npm run build && npm run test:offline && npm run test:local && npm run verify:build
npx playwright test
node evidence/t_cc4fc7d7/probe-layout.mjs
node evidence/t_cc4fc7d7/probe-contrast.mjs
```
