# Offene Punkte der Astro-Migration

Stand: 4. November 2026 · Aufgabe `t_a3fc82b3`

Diese Liste ist bewusst vollständig: Alles, was die Migration **nicht** leistet,
steht hier mit Grund und Aufwandsschätzung. Kein Punkt ist „vergessen“.

## 1. Interaktive Inseln (größter offener Block)

Der Bestand ist eine Single-Page-Application; die Inhalte sind migriert, die
Bedienlogik nicht. Betroffen sind zehn Werkzeuge, deren Daten und Texte bereits
als Dokument vorliegen:

| Werkzeug | Route | Bestandsmodul | Was fehlt |
|---|---|---|---|
| Tarot-Ziehung | `/tarot.html` | `js/modules/tarot.js`, `js/dialog.js` | Ziehen, Tageskarte, 3-Karten-Legung, Deckwahl, Verlauf |
| Kristallfilter | `/kristalle.html` | `js/modules/crystals.js` | Suche/Filter, Favoriten (`localStorage`) |
| Mondrechner | `/mondphasen.html` | `js/modules/moon.js`, `data/moon-astro.mjs` | aktuelle Phase, Kalender, iCal-Export |
| Runenwurf | `/runen.html` | `js/modules/runes.js` | Wurf, Historie |
| Frequenzlabor | `/frequenzen/labor.html` | `frequenz-engine.js`, `frequenzlabor.js` | Audio, Sweep, Schwebung, Oszillogramm |
| Chladni-Muster | `/frequenzen/cymatics.html` | `frequenz-chladni.js`, `-cymatics-view.js` | Canvas-Darstellung |
| Meditationssitzung | `/frequenzen/meditation.html` | `frequenz-meditation-model.js`, `-view.js` | Timer, Fade, Favoriten |
| Pendellabor | `/pendeln/labor.html` | `pendel-simulator.js` | Simulation |
| Tafel-Studio | `/pendeln/studio.html` | `pendeltafel-model.js`, `-studio.js` | Editor, SVG-/Druckausgabe |
| Experimentierlabor | `/pendeln/experiment.html` | `experiment-labor.js`, `-statistik.js`, `-zufall.js` | Testreihe, Auswertung, Export |
| Pendeltagebuch | `/pendeln/journal.html` | `pendel-journal.js`, `journal-speicher.js` | Formular, lokale Speicherung |

**Empfohlener Weg:** Astro-Inseln mit den vorhandenen Vanilla-Modulen
(Entscheidung E3: kein UI-Framework). Die DOM-freien Modelle
(`frequenz-engine`, `pendeltafel-model`, `experiment-statistik`,
`journal-speicher`) sind bereits testbar getrennt und können unverändert
übernommen werden. Aufwand laut Plan P4: 12–20 Personentage für alle Bereiche.

**Warum nicht in dieser Aufgabe:** Der Auftrag umfasst Inhalte, Routen, Redirects
und SEO. Die Inseln brauchen die Komponenten- und Interaktionsschicht aus
`t_2d9fbecf` sowie eigene Browser-Tests; ohne diese Tests wäre „funktioniert“
eine Behauptung.

## 2. Suche ohne JavaScript

`/astrologie/suche.html` und `/pendeln/suche.html` funktionieren ohne
JavaScript als vollständiges Verzeichnis; der Filter ist eine progressive
Verbesserung. Eine echte Volltextsuche (Index, Ranking) fehlt weiterhin — der
Bestand hatte sie auch nicht (er filterte die bereits geladene Liste).

## 3. `localStorage` beim Domainwechsel (R2, F2)

Acht Schlüssel sind origin-gebunden (`esot_crystals_fav`,
`esoterik_tarot_deck`, `esoterik_tarot_history`, `esoterik_runes_history`,
`esoterik-welt:frequenzlabor:v1`, `…:meditation:v1`, `esot_rad_experiment_v1`,
`esot_rad_journal_v1`). Beim Wechsel von `ingbms.github.io` auf `velarkana.de`
sind die Daten der Vorgängerversion für Nutzer unsichtbar. Ein Export/Import
je Speicher ist nicht umgesetzt (Entscheidung des Eigentümers offen).

## 4. Toolchain-Hinweise

- `astro check` meldet 20 **Hinweise** (keine Fehler/Warnungen): Das von
  `astro:schema` exportierte `z` ist in Astro 7 als veraltet markiert; der
  Nachfolgepfad wird erst mit Astro 8 stabil. Beim Upgrade prüfen.
- `npm run build` erzeugt 68 MB `dist/` (davon 57 MB Tarot-Bilder). Solange die
  Tarot-Insel fehlt, werden diese Bilder mit ausgeliefert, aber von keiner Seite
  referenziert. Nach der Insel-Portierung: `astro:assets` mit responsiven
  `srcset`-Stufen (R6) statt aller drei Auflösungen.
- Der `og:image`-Wunsch (F6) ist offen: `assets/og-preview.png` existiert nicht,
  es wird kein `og:image` ausgegeben (wie im Bestand).

## 5. Nicht geprüft (bewusst offengelegt)

- Keine vollständige Sichtprüfung über alle 144 Seiten und keine Screenshot-Serie
  als Abnahme. Stichproben im Browser (Chromium, `astro preview`, Port 4410):
  Startseite (1280 px), Zeichen-Detailseite (769 px), Farbseite (390 px mobil)
  — Header, Navigation, Brotkrumen, Tokens und Schrift rendern; 10
  Navigationsziele sichtbar. Die Startseite zeigt die neun Zugänge.
- Der Legacy-Shim wurde im Browser mit fünf Fällen geprüft:
  `#astrologie/zeichen/widder` → `/astrologie/zeichen/widder.html`,
  `#pendeln/pendeln/tafeln` → `/radiasthesie/pendeln.html#tafeln`,
  `#blog/6` → `/wissen/06-einsteiger-guide-wie-du-mit.html`,
  `#frequenzlabor` → `/frequenzen/labor.html`, und ein `hashchange` ohne
  Neuladen (`#astrologie/glossar` → `/astrologie/glossar.html`).
- Keine Lighthouse-/axe-Messung (Plan P6, eigener Schritt).
- Layout: Es ist noch das Gerüst aus `t_5a343e3c` plus die Komponenten dieser
  Aufgabe; die vollständige Komponentenportierung läuft in `t_2d9fbecf`.
