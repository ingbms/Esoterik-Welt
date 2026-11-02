# Barrierefreiheits-Checkliste — Themenmodul „Radiästhesie, Pendeln und Orakel“

Stand: 2. November 2026 · Zielstandard: **WCAG 2.2 AA**, soweit auf die
implementierten Komponenten anwendbar.

## 1. Prüfumgebung und Grenzen

- **Browser:** Chromium (Playwright 1.64.1, Build 1208), Windows 11, ohne
  Browser-Erweiterungen. Auflösungen 1440, 1024, 900, 768, 390, 360 und 320 px.
- **Gerendert:** `docs/radiasthesie-konzept/mockup/index.html` mit den echten
  Projektstylesheets (`css/design-system.css`, `css/main.css`) und `rad.css`.
- **Nicht geprüft:** kein Screenreader-Lauf (NVDA/JAWS/VoiceOver), kein
  axe-/Lighthouse-Lauf, keine Nutzertests mit behinderten Personen. Diese drei
  Punkte stehen in §7 als offene Posten und sind **keine** erledigten Häkchen.
- **Reproduktion:** `node docs/radiasthesie-konzept/scripts/audit-structure.cjs`,
  `…/audit-a11y-extra.cjs`, `…/contrast.cjs`, `…/capture.cjs`. Rohdaten in
  `messung/struktur-audit.json`, `messung/a11y-zusatz.json`,
  `messung/kontrast.json`.

## 2. Kontrast (gemessen, WCAG-Formel)

Alle Werte aus `messung/kontrast.json`, berechnet aus den tatsächlich
verwendeten Farbwerten gegen die beiden Flächen des Moduls.

| Vordergrund | auf `#0b1012` | auf `#141c1f` | AA (4,5:1) |
| --- | ---: | ---: | :---: |
| Text primär `#eae6dc` | 15,36:1 | 13,86:1 | ja |
| Text sekundär `#babdb7` | 10,07:1 | 9,09:1 | ja |
| Sand `#c6b38e` | 9,33:1 | 8,42:1 | ja |
| Sand Hover `#d5c4a2` | 11,16:1 | 10,07:1 | ja |
| Funktionale Linie `#82928e` | 5,88:1 | 5,31:1 | ja |
| Stufe A `#c0a889` | 8,39:1 | 7,57:1 | ja |
| Stufe C `#9db3c4` | 8,82:1 | 7,96:1 | ja |
| Stufe D `#9db3a4` | 8,58:1 | 7,75:1 | ja |
| Stufe E `#c09489` | 7,14:1 | 6,45:1 | ja |
| Buttonlabel `#0b1012` auf Sandfläche | – | 9,33:1 | ja |
| Fokusring `#c6b38e` gegen `#0b1012` | 9,33:1 | – | ja (3:1 für UI) |

Dekorative Linie `#3c484b` hat 2,02:1 und ist **kein** Bedienelement; sie trennt
nur Abschnitte. Alle funktionalen Rahmen (Karten-Hover, Eingabefelder,
Einordnungsband, Tafeln) nutzen `#82928e` mit ≥ 5,31:1.

## 3. Prüftabelle (WCAG 2.2 AA)

Status: **E** = erfüllt und gemessen · **K** = erfüllt durch Konstruktion
(nachgesehen im Markup/CSS) · **T** = teilweise · **N** = nicht anwendbar.

| Kriterium | Umsetzung im Modul | Nachweis | Status |
| --- | --- | --- | :---: |
| 1.1.1 Nicht-Text-Inhalt | Alle `<img>` mit beschreibendem Alt-Text; dekorative Pfeile `aria-hidden="true"`; SVGs mit `<title>`/`<desc>` | `struktur-audit.json`: 5 Bilder, 0 ohne Alt | E |
| 1.3.1 Info und Beziehungen | `header/nav/main/aside/footer`, `<ol>` für Brotkrümel, `<dl>` für Kennzahlen und Stufen, `<ul>` für Karten und Aussagen, `<details>` für Quellen | Audit: 0 Überschriften-Sprünge, 0 doppelte IDs | E |
| 1.3.2 Bedeutungstragende Reihenfolge | Seitenleiste steht im DOM **vor** dem Text und wird auf Desktop per `grid-area` nach rechts gestellt | `mockup/index.html` (Kommentar am `.astro-layout`), `rad.css` | K |
| 1.3.3 Sensorische Eigenschaften | Anweisungen nennen nie nur „links/rechts“ oder Farbe; Stufen tragen Buchstabe und Wort | Chips „A · Historisch“ usw. | K |
| 1.3.4 Ausrichtung | Kein Festhalten an Hoch-/Querformat | – | N |
| 1.4.1 Farbe allein | Stufen: Buchstabe + Wort; aktives Navigationsziel: Farbe **und** Unterlinie **und** `aria-current`; Einschränkungen: Text, nicht nur Rosen-Kante | Screenshots `messung/zustaende/` | K |
| 1.4.3 Kontrast Text | siehe §2, alle Paare ≥ 6,45:1 (Minimum gefordert 4,5:1) | `kontrast.json` | E |
| 1.4.4 Textgröße 200 % | Seitenzoom 200 % entspricht 720 px Breite: kein Überlauf; **Textzoom allein skaliert nicht**, weil die Typografie in px definiert ist | `uebersicht.md` (720 nicht separat, 768/390 geprüft), `a11y-zusatz.json` Reflow 320 | T |
| 1.4.10 Reflow (320 px) | Kein horizontaler Scroll bei 320 px in allen drei Ansichten | `a11y-zusatz.json`: `docOverflowX: 0` | E |
| 1.4.11 Nicht-Text-Kontrast | Fokusring 9,33:1, Eingaberahmen 5,31:1, Karten-Hover 5,31:1, Sand-Button 9,33:1 | §2 | E |
| 1.4.12 Textabstände | 1,5 Zeilenhöhe, 0,12em Buchstaben-, 0,16em Wortabstand, 2em Absatzabstand: 0 Überläufe, 0 abgeschnittene Elemente bei 1440 und 390 px | `a11y-zusatz.json` | E |
| 1.4.13 Inhalte bei Hover/Fokus | Keine Tooltips mit Pflichtinformation; `title` wird nirgends als einzige Quelle benutzt | Markup | K |
| 2.1.1 Tastatur | Alle Funktionen per Tastatur: Navigation, Menü (Button), Inhaltsverzeichnis (`summary`), Quellenpanel (`details`), Suche | Tastaturprotokoll §4 | E |
| 2.1.2 Keine Tastaturfalle | Keine Modale im Modul; `details` und Menü lassen sich mit Tab verlassen | §4 | E |
| 2.1.4 Einzelzeichen-Tastenkürzel | Keine Tastenkürzel implementiert | – | N |
| 2.2.1 Zeitbegrenzung | Keine Zeitlimits | – | N |
| 2.2.2 Pause/Stop/Ausblenden | Keine bewegten Inhalte, keine Autoplay-Elemente | – | N |
| 2.3.1 Blitzschwelle | Keine Blitze | – | N |
| 2.4.1 Blöcke umgehen | Skip-Link „Zum Hauptinhalt springen“ als erstes fokussierbares Element, Ziel `#main` mit `tabindex="-1"` | `struktur-audit.json`: `skipLinkTargetExists: true` | E |
| 2.4.2 Seitentitel | `document.title` je Route (Modul setzt ihn), Muster siehe `ia-konzept.md` §7 | `ia-konzept.md` | K |
| 2.4.3 Fokusreihenfolge | Skip → Logo → acht Navigationsziele → Inhalt; keine `tabindex > 0` | §4, Audit `tabindex>0: 0` | E |
| 2.4.4 Linkzweck | Linktexte benennen das Ziel („Geschichte der Radiästhesie“), keine „hier klicken“; CTA und Titel teilen dasselbe Ziel, der CTA-Text ist ausgeschrieben | Markup | K |
| 2.4.6 Überschriften und Beschriftungen | Genau eine H1 je Ansicht; H2 für Kapitel, H3 für Schritte und Karten; Formularfeld mit `<label class="sr-only">` | Audit: 1 H1, 0 Sprünge | E |
| 2.4.7 Fokus sichtbar | `outline: 2px solid #c6b38e; outline-offset: 4px` auf allen interaktiven Elementen; nie `outline: none` | `zustaende.json`: 2 px solid rgb(198,179,142), Offset 4 px | E |
| 2.4.11 Fokus nicht verdeckt | Fokussierte Ziele im Text liegen bei 486 px, Kopfzeile 101 px → nicht verdeckt; globales `scroll-padding-top: 116 px` | `a11y-zusatz.json` | E |
| 2.5.1 Zeigergesten | Keine Mehrpunkt-/Wischgesten | – | N |
| 2.5.3 Beschriftung im Namen | Sichtbarer Text = zugänglicher Name; Icon-Buttons (Menü) haben `aria-label`, das die Aktion nennt („Menü öffnen“/„Menü schließen“) | `zustaende.json` | E |
| 2.5.7 Ziehen | Keine Drag-and-drop-Funktion | – | N |
| 2.5.8 Zielgröße (24 px) | 31 von 33 Zielen ≥ 24 px; zwei **Inline-Links im Satz** mit 20–22 px Höhe — Ausnahme für Inline-Ziele nach 2.5.8 | `a11y-zusatz.json` | T (Ausnahme) |
| 3.1.1 Sprache | `<html lang="de">` | Audit: `lang de` | E |
| 3.2.1 Bei Fokus | Fokus löst keine Navigation oder Zustandsänderung aus | Tastaturprotokoll | K |
| 3.2.2 Bei Eingabe | Suche erst nach Absenden (Formular), kein Auto-Navigieren | Markup | K |
| 3.2.3 Konsistente Navigation | Navigationsreihenfolge auf allen Ansichten identisch | Mockup | K |
| 3.2.4 Konsistente Kennzeichnung | Einordnung, Stufen, Quellen heißen überall gleich | Komponenten-Specs | K |
| 3.2.6 Konsistente Hilfe | Kein Hilfe-/Kontaktangebot im Modul | – | N |
| 3.3.1 Fehlererkennung | Leere Suche: Text „Bitte Suchbegriff eingeben“ + Vorschläge, kein stiller Leerzustand | `ia-konzept.md` §8 | K |
| 3.3.2 Beschriftungen | Suchfeld mit Label (sr-only) und Placeholder als Beispiel, nicht als Labelersatz | Audit: 0 Inputs ohne Label | E |
| 3.3.7 Redundante Eingabe | Keine mehrstufigen Formulare | – | N |
| 3.3.8 Barrierefreie Authentifizierung | Keine Anmeldung | – | N |
| 4.1.2 Name, Rolle, Wert | Semantische Elemente (`button`, `details`, `summary`, `a`), `aria-expanded` am Menüknopf, `aria-current` am aktiven Ziel | Audit, `zustaende.json` | E |
| 4.1.3 Statusmeldungen | Trefferzahl der Suche in `aria-live="polite"`; keine unangekündigten Statuswechsel | `ia-konzept.md` §5.6 | K |

## 4. Tastaturprotokoll (gemessen)

Reihenfolge der ersten 14 Fokussierungen auf der Landingpage
(`messung/mockup-messung.json` → `keyboard`):

**1440 px:** Skip-Link → Logo → Start → Tarot → Kristalle → Mondphasen →
Astrologie → Runen → **Pendeln** → Wissen → „Mit Radiästhesie beginnen“ →
„Einordnung lesen“ → „so funktioniert die Kennzeichnung“ → erster Kartentitel.

**390 px:** Skip-Link → Logo → Menüknopf → „Mit Radiästhesie beginnen“ →
„Einordnung lesen“ → „so funktioniert die Kennzeichnung“ → Kartentitel →
Karten-CTA → nächster Kartentitel …

Jeder dieser Schritte hat einen sichtbaren Fokusring (2 px Sand, Offset 4 px).
Das Mobilmenü lässt sich mit Enter/Leertaste öffnen, `aria-expanded` wechselt auf
`true`, das `aria-label` auf „Menü schließen“; die Ziele sind 342 × 48 px, links-
bündig (`messung/zustaende/menue-offen-390.png`).

## 5. Reflow, Textabstände, Zielgrößen

| Prüfung | Ergebnis | Quelle |
| --- | --- | --- |
| Reflow bei 320 px (Landing, Thema, Glossar) | 0 px horizontaler Überlauf | `a11y-zusatz.json` |
| Textabstände nach 1.4.12 (1440 und 390) | 0 Überläufe, 0 abgeschnittene Elemente | `a11y-zusatz.json` |
| Zielgrößen | 31/33 ≥ 24 px; 2 Inline-Links (Ausnahme) | `a11y-zusatz.json` |
| Fokus nicht verdeckt | 5 Stichproben im Text, keine verdeckt | `a11y-zusatz.json` |
| Reduzierte Bewegung | Übergänge 0,00001 s, Animationen 0,00001 s | `probe-motion-print.cjs` |

**Befund zur Kopfzeile bei 320 px:** Ohne die Regel aus `rad.css`
(`@media (max-width: 360px)`) läuft die Kopfzeile um 2 px über; auf der
Produktivseite mit Favoritenzähler sind es **19 px** (gemessen mit
`probe-live-header.cjs`: `scrollWidth 339` bei `clientWidth 320`). Der Überlauf
existiert also schon vor dem Modul. Die Regel ist als empfohlene, globale
Korrektur dokumentiert; mit ihr ist der Überlauf 0.

## 6. Druck und reduzierte Bewegung

- Druck: Kopfzeile, Fußzeile, Buttons, Skip-Link und Inhaltsverzeichnis werden
  ausgeblendet; Einordnungsband bleibt sichtbar (Höhe 103 px, Rahmen `#777`);
  URLs externer Links erscheinen in Klammern; Karten und Kästen brechen nicht um.
- `prefers-reduced-motion`: global auf 0,01 ms gesetzt, im Modul zusätzlich
  `.rad-topic { transition: none }`.

## 7. Offene Posten (bewusst nicht als erledigt markiert)

1. **Screenreader-Test** (NVDA + Firefox, VoiceOver + Safari) — nicht durchgeführt.
   Erwartete Prüfpunkte: Ansage der Stufen-Chips, `<details>`-Status, Fokus nach
   Routenwechsel.
2. **Automatisierter Achsen-Lauf** (axe-core/Lighthouse) — nicht durchgeführt,
   weil im Projekt nicht installiert. Nach der Implementierung nachholen.
3. **Textzoom ohne Seitenzoom** (Firefox „nur Text“) skaliert nicht, weil die
   Typografie in px definiert ist. Seitenzoom 200 % ist geprüft (Reflow). Wenn
   Textzoom gefordert wird, muss das Design-System auf `rem` umgestellt werden —
   eine globale Entscheidung, nicht Teil dieses Moduls.
4. **Kontrast bei Hover/Fokus** ist nur für die Ruhefarben gerechnet; die
   Hover-Farbe `#d5c4a2` ist heller und damit unkritisch, ein Nachweis für
   `:active` fehlt (kein eigener `:active`-Stil definiert).
5. **Keine Nutzertests** mit sehbeeinträchtigten oder motorisch eingeschränkten
   Personen.

## 8. Abhakliste für die Implementierung

Vor dem Merge:

- [ ] `node docs/radiasthesie-konzept/scripts/contrast.cjs` → alle Textpaare ≥ 4,5:1.
- [ ] `…/audit-structure.cjs` → je Ansicht 1 H1, 0 Sprünge, 0 doppelte IDs, 0 Bilder ohne Alt, 0 Inputs ohne Label.
- [ ] `…/audit-a11y-extra.cjs` → Reflow 0, Textabstände 0, keine Ziele < 24 px außer Inline-Links.
- [ ] Tastaturdurchlauf: Skip → Navigation → Inhalt; Fokusring überall sichtbar; Mobilmenü per Enter bedienbar.
- [ ] Screenreader-Stichprobe (offener Posten §7.1) durchgeführt und protokolliert.
- [ ] Druckvorschau: Einordnungsband sichtbar, TOC ausgeblendet, keine abgeschnittenen Tabellen.
