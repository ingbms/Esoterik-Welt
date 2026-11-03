# Unabhängiger Review — t_280f3753 (Nachtatelier-Stilpaket anwenden)

Review-Runde: **1** (Linse: Artefakt/Abnahme gegen das genehmigte Stilpaket, anschließend Ausführung)
Reviewer: `design_critique` · Lauf 255 · Stand 02.11.2026, 00:10
Geprüfter Stand: Arbeitsbaum `C:/Users/mas/Arbeit/Esoterik-Welt`, HEAD `1f2726c`, uncommittete Änderungen des Implementierers (kein Commit/Push/Deploy — wie beauftragt).
Verdikt: **Änderungen erforderlich** (4 Befunde, alle klein und chirurgisch behebbar).

## 1. Methode (eigene Messungen, keine Übernahme der Handoff-Zahlen)

- Eigener Build (`npm run build`) und eigener Preview-Server (`PORT=4187 node index.js`), eigene Playwright-Proben
  (`probe-http.cjs`, `probe-behaviour.cjs`, `probe-moon.cjs`, `probe-toggle.cjs` in `evidence/t_280f3753-review/`).
- 8 Router-Ansichten + 4 statische Seiten × 375/768/1440 = 36 Läufe; zusätzlich echter `file://`-Doppelklick,
  Kaltaufruf unbekannter Route, Dialognutzung per Maus und Tastatur.
- Kontrast mit Canvas-Farbnormalisierung auf tatsächlich gemalten Flächen (auch `color(srgb …)`),
  Schriftnachweis über CDP `CSS.getPlatformFontsForNode`, Emoji-Farbe über echte Pixelabtastung des Screenshots.
- Alle Gates selbst nachgefahren.

## 2. Unabhängig bestätigt (kein Befund)

| Prüfung | Ergebnis |
| --- | --- |
| `npm run lint` / `format:check` | exit 0 / alle Dateien konform |
| `npm test` | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 (inkl. echter Font-Assertion über `file://`) |
| `npm run test:local` | 12 pass / 0 fail / 2 vorbestehende Skips |
| `npm run verify:build` | 30 Seiten/Viewports, 0 Fehler |
| `npx playwright test` | **56/56** |
| Token-Parität | 8 normative Farben in `tokens.json` = `DESIGN.md`-Frontmatter = `css/design-system.css` (manuell gegengeprüft); Typo 80/44/16/13 px; Radien 2/4 px (Namenszuordnung `md`→`--radius-xl` dokumentiert) |
| Kontrast (neu gerechnet) | Text 15.36:1, Sekundär 10.07:1, Sand 9.33:1, Buttonlabel 9.33:1, Sand auf Fläche 8.42:1, funktionale Linie 5.88:1 — schlechtester Wert 8.42, alles ≥ 4.5 |
| Überlauf | 0 Dokumentüberlauf **und** 0 innerer Komponentenüberlauf in 36 Läufen |
| Konsole | 0 Console-/Pageerror in 36 Läufen |
| Fonts | `h1` = Fraunces; Fließtext = Manrope mit echter Variable-Achse (Breite 871/899/932 px bei 200/400/600 — Achse greift, Plattformname „Manrope ExtraLight" ist nur der Name-Table-Eintrag) |
| Titel/Hierarchie | genau 1 sichtbare `h1` je Ansicht (36/36); Hero 80/66/52 px gemessen |
| Skip-Link | erste Tab-Station (1440/375), Enter → Fokus auf `<main>`, Hauptinhalt bleibt sichtbar (1744 Zeichen, Home nicht durch den Hashrouter versteckt); auf Rechtsseiten ebenso (1581 Zeichen) |
| Tastatur | Nav-Fokusring `2px solid rgb(198,179,142)`, Offset 4 px; Pfad-Register per Tab + Enter bedienbar (`#crystals` öffnet); Mobilmenü `aria-expanded` false→true→false, Label wechselt |
| Dialoge | Kristall- und Tarot-Dialog öffnen per Maus **und** per Enter, Fokus im Dialog, Escape schließt; `#blog/1`, `#blog/3`, `#blog/6` öffnen den Artikel dialog; unbekannte Route zeigt sichtbaren Hinweis und behält die Seite |
| `file://` | Doppelklick-Einstieg leitet auf `Lokal.html`, Fraunces+Manrope geladen, 3/3 Bilder, 1744 Zeichen Inhalt, 0 fehlgeschlagene Requests, 0 Konsolenfehler |
| Ehrlichkeit der Bildstände | Tarot nur Symboltafeln, Kristalle entsättigte Glyphen + „Platzhalter-Symbol · kein Foto im Projekt", Orion als belegte Koordinatenstudie mit `title`/`desc`, Attribution im Impressum (Urheber, Quelle, Lizenzlink, Änderungen, OFL-Hinweis) |
| Teständerungen | nicht entschärft: Hintergrundvergleich gegen `--color-bg-deep` statt Literal, Font-Assertion ergänzt, `<base>`-Regex nur auf Prettier-Schreibweise erweitert |

## 3. Befunde (Änderungen erforderlich)

### B1 — Mobiler Menüknopf ist kein Hamburger mehr (Regression dieser Karte)

`css/design-system.css:522-541`: `.nav-toggle` ist jetzt `display: inline-flex` mit `align-items/justify-content: center`;
die drei `<span>`-Balken werden dadurch zu **Flex-Items in einer Reihe**. Gemessen bei 375 px:
Button 84×48, Balken bei x=217/239/261, jeweils 22×1,5 px auf **derselben** y=41 → sie verschmelzen zu einer
durchgehenden 66-px-Linie. Vorher (`git show HEAD:css/design-system.css`, `.nav-toggle{display:block}`) stapelten
sie sich zu drei Balken. Sichtbar in der eigenen Aufnahme des Implementierers
(`evidence/t_280f3753/after/nav-open-375.png`) und in `evidence/t_280f3753-review/shots/x-nav-open-375.png`.
Wirkung: die primäre Navigation auf Mobilgeräten sieht wie ein Eingabefeld mit Strich aus, nicht wie ein Menü.
**Fix:** `flex-direction: column` (oder `display: block` + Zentrierung) — danach 3 Balken, Zielgröße bleibt ≥ 44 px.

### B2 — Violette Mondpunkte im Kalender

`js/modules/moon.js:93` setzt das Mondphasen-Emoji (`🌑 …`) als Text; `css/main.css:640-643` (`.moon-calendar-day .day-phase`)
gibt nur Größe, **keinen** Filter. Gemessene Pixel im 1440er Screenshot: `rgb(84,60,120)`, `rgb(108,72,144)`,
`rgb(156,120,204)` — also Violett in allen 31 Tageszellen. Das ist der einzige kräftige Kaltakzent der Seite und
widerspricht der genehmigten Regel (Basalt/Kreide/Sand, „kein generisches violettes Neon"). Die Karte behandelt
dasselbe Problem anderswo bereits richtig (`.crystal-glyph`, `.article-placeholder` → `saturate(0.4)`).
**Fix:** gleiche Entsättigung auf `.day-phase` anwenden oder ein Sand-/Grau-Glyph zeichnen; Sichtprüfung danach.

### B3 — Ziele unter 44 px und die Behauptung „0 Ausnahmen" stimmt nicht

Gemessen (eigener Scan über `a[href], button, input, select, textarea, summary, [role=button], [tabindex]`):
Logo-Link 152×24 (375) bzw. 173×28 (1440); Footer-Navigation der Rechtsseiten
(Startseite/Impressum/Datenschutz/Haftungsausschluss) **18 px** hoch auf allen drei Rechtsseiten und allen Breiten;
„Open Source auf GitHub" 18 px; die zwei Quellen-/Lizenzlinks im Impressum 22 px.
`docs/art-direction-nachtatelier/STYLEGUIDE.md` §4 verlangt „alle Mobilziele mindestens 44px"; der Handoff nennt
„alle Ziele ≥ 44 px (gemessen: 0 Ausnahmen)". Die Messung des Implementierers (`evidence/t_280f3753/verify-design.cjs:112`)
prüft nur `.nav-link, .btn, .input, .select, .footer-links a, .textlink` **auf `#home`** — Logo, `.footer-bottom`-Links
und die Rechtsseiten sind nicht im Scope der Prüfung, die Aussage im Handoff ist daher zu weit.
**Fix:** `min-height: 44px` (inline-flex) für Logo und die Footer-Navigationszeilen, oder die Aussage auf die
tatsächlich geprüften Selektoren einschränken und die Inline-Link-Ausnahme begründen.

### B4 — Schrift unter der 13-px-Untergrenze im Mondkalender

`.moon-calendar-day .day-name` (Wochentagskürzel) = **11 px** (vorher 10,4 px), `.day-number` = **12 px** bei ≤700 px.
`STYLEGUIDE.md` §3: „keine Pflichtinformation kleiner als 13px". Wochentag und Tageszahl sind Pflichtinformation
eines Kalenders. Nicht neu eingeführt, aber im Rahmen der Typo-Migration nicht gehoben.
**Fix:** auf ≥ 13 px anheben (Zelle bietet bei 375 px 38,7 px Breite — „Mo" passt bei 13 px).

## 4. Nicht blockierende Beobachtungen

- **Bildunterschrift vs. sichtbares Bild:** Hero-Element 747×498 mit 2400×2045-Quelle und `object-fit: contain`
  ⇒ sichtbares Bild 584×498; die rechtsbündige Caption endet am Element-, nicht am Bildrand (~81 px daneben).
  Materialband: Element 624×468, sichtbares Bild 468×468 ⇒ Caption beginnt ~78 px links der Bildkante.
  Fix optional: `aspect-ratio: 1/1` für das quadratische Detail bzw. Caption am Motiv ausrichten.
- Nach Dialog-Schließen geht der Fokus auf `#main`/einen generischen Button, nicht auf den Auslöser.
- `.star-key` trägt `aria-label` ohne Rolle (wird von AT ignoriert; die sichtbaren Sternnamen sind Text).
- Mondkalender rendert immer 42 Zellen ⇒ 11 leere, aber gerahmte Zellen unter dem 30.; „Nächste: —" als Platzhalter.
  Beides vorbestehend (in `evidence/t_280f3753/before/moon-1440.png` identisch) — nur im neuen Rahmen sichtbarer.
- **Provenienz `js/modules/_tarot_old.js`:** Arbeitsbaum weicht von HEAD ab (reine Prettier-Formatierung, 31/16 Zeilen),
  mtime 23:08 liegt im Laufzeitfenster dieser Karte, der veröffentlichte SHA-256 `91f2425b…0935d1` entspricht dem
  aktuellen Byte-Stand. Ein Vorher-Hash existiert in keiner Evidenz, „byte-identisch zum Stand vor dieser Karte"
  ist damit nicht unabhängig beweisbar. Inhaltlich nur Formatierung, Datei ist build-exkludiert (`_`-Präfix).
  Kein Änderungsauftrag, aber als Grenze im Handoff zu führen.

## 5. Grenzen dieses Reviews

- Nur Chromium (Playwright 1.64, headless). Kein Firefox/Safari, kein Screenreader-Lauf, kein axe/WCAG-Zertifikat.
- Keine Lighthouse-/Performance-Messung (Payload nur aus Dateigrößen bekannt).
- Emoji-Farbe ist plattformabhängig (Windows/Chromium geprüft); der Befund gilt für die tatsächlich gerenderte Seite
  und ist durch die fehlende Entsättigung unabhängig davon behebbar.
- Keine Druckfreigabe, keine Geschmacksfreigabe (Stil ist bereits menschlich genehmigt; geprüft wurde die Umsetzung).

## 6. Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
npm run build && PORT=4187 node index.js &
node evidence/t_280f3753-review/probe-http.cjs        # 36 Läufe: Überlauf, Ziele, Kontrast, Fonts, Bilder
node evidence/t_280f3753-review/probe-behaviour.cjs   # Skip-Link, Mobilmenü, Dialoge, Deeplinks, file://
node evidence/t_280f3753-review/probe-toggle.cjs      # B1: Balken-Geometrie des Menüknopfs
node evidence/t_280f3753-review/probe-moon.cjs        # B2: Emoji-Pixelfarben, B4: Schriftgrade
```

Die Proben schreiben ihre Ausgabe per `OUT`-Umgebungsvariable (Default: Reviewer-Scratch); mit
`OUT=$PWD/evidence/t_280f3753-review` entstehen die JSON-/PNG-Belege in place.

Artefakte: `evidence/t_280f3753-review/` (`probe-*.json`, `probe-*.cjs`, `shots/`).
