# Tastatur, Fokus und reduzierte Bewegung

Gemessen mit `scripts/measure-werkstatt.cjs`: für jedes Werkzeug wird ab
`document.body` 16-mal `Tab` gesendet (CDP `Input.dispatchKeyEvent`, echte
Tastaturereignisse), danach `document.activeElement` mit Größe, Kontur und
Sichtbarkeit protokolliert. Zusätzlich wird `prefers-reduced-motion` über
`Emulation.setEmulatedMedia` gesetzt und die berechnete Animation gelesen.

> Einschränkung des Protokolls: das Feld `name` im Protokoll ist ein
> Ersatzname (`aria-label` → Textinhalt → Wert). Es ist **kein** vollständiger
> Accessible-Name-Test. Die Beschriftungsprüfung erfolgt separat über
> `structure.unlabeledInputs` (Prüfung auf `aria-label`, `aria-labelledby`,
> `label[for]` oder umschließendes `label`) — dort ist das Ergebnis für alle 52
> Messpunkte `[]`.

## 1 · Fokusring

```css
:focus-visible { outline: 2px solid var(--color-primary); }   /* #c6b38e */
.rad-ws-title:focus-visible { outline-offset: 6px; }
.rad-ws-error:focus-visible { outline-offset: 4px; }
#radWerkzeug:focus        { outline: 2px solid var(--color-primary); outline-offset: 2px; }
/* P4: Datumsfeld, Fokus im Shadow-Tree (Tag/Monat/Jahr/Kalenderknopf) */
.rad-ws-input:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
  border-color: var(--color-primary);
}
```

Gemessen an **126 Element-Schritten** (8 Protokolle: 4 Werkzeuge × 1440/375,
je 16 Tab-Schritte, davon je ein abschließender `body`-Schritt — im Simulator
enden beide Läufe mit `body`, daher dort je 15 Element-Schritte):
`outline: solid 2px rgb(198, 179, 142)`, also exakt `--color-primary`, ohne
eigene Farbe. Nach der P4-Korrektur tragen **126 von 126** Element-Schritten den
Sand-Ring; vor der Korrektur waren es 124 (die beiden Datumsfeld-Läufe je
1440 und 375 fehlten, siehe §6).

Kontrast des Rings gegen beide Untergründe (in diesem Lauf mit der
WCAG-Formel aus den Tokens nachgerechnet): `#c6b38e` auf `#0b1012` = 9,33:1,
auf `#141c1f` = 8,42:1, auf der Hover-Fläche `#1a2427` = 7,72:1. Der Ring liegt
damit über der 3:1-Anforderung für nicht-textliche Kontraste.

## 2 · Sprunglink

```html
<a class="rad-ws-skip" href="#radWerkzeug">Direkt zum Werkzeug</a>
<div id="radWerkzeug" tabindex="-1"> … </div>
```

Unsichtbar (`position:absolute; left:-9999px`), bei Tastaturfokus sichtbar
(`position:static`), 167 × 50 px, erster Fokusschritt jeder Ansicht. Ohne ihn
kostet jeder Werkzeugwechsel acht Schritte durch Brotkrümel, Einordnungsband und
Werkzeugnavigation.

## 3 · Fokusreihenfolge (gemessen, 1440 px)

### Simulator

| # | Element | Größe | Ring |
|---|---|---|---|
| 1 | Link „Direkt zum Werkzeug“ | 167 × 50 | 2 px Sand |
| 2–4 | Brotkrümel Start / Pendeln / Werkstatt | 30 / 51 / 59 × 44 | 2 px Sand |
| 5 | „Wie die Kennzeichnung funktioniert“ (Inline-Link im Einordnungsband) | 223 × 20 | 2 px Sand |
| 6–9 | Werkzeugkacheln 01–04 | 328 × 56 | 2 px Sand |
| 10–12 | Regler Fadenlänge, Auslenkung, Dämpfung | 426 × 44 | 2 px Sand |
| 13 | Radiogruppe „Darstellung“ (nur das gewählte Feld ist im Tab-Lauf) | 18 × 18 | 2 px Sand |
| 14–15 | Start, Zurücksetzen | 176 / 238 × 48 | 2 px Sand |
| 16 | `body` (Ende der Seite) | — | — |

### Tafel-Studio

1 Sprunglink · 2–4 Brotkrümel · 5 Einordnungs-Link · 6–9 Kacheln ·
10 Tafeltyp (Radiogruppe, 1 Schritt) · 11 Titel · 12 Beschriftung 1 ·
13 „Beschriftung 1 entfernen“ (48 × 48) · 14 Beschriftung 2 ·
15 „Beschriftung 2 entfernen“ · 16 „+ Beschriftung hinzufügen“ (239 × 48).

### Test-/Demo-Labor

1 Sprunglink · 2–4 Brotkrümel · 5 Einordnungs-Link · 6–9 Kacheln ·
10–13 Antwortknöpfe 1–4 (199 × 56) · 14 „Antwort speichern“ (820 × 48) ·
15 Modus (Radiogruppe) · 16 Testart (Radiogruppe).

### Journal

1 Sprunglink · 2–4 Brotkrümel · 5 Einordnungs-Link · 6–9 Kacheln ·
10–13 **Datumsfeld** (vier Schritte, siehe §6) · 14 Frage · 15 Methode ·
16 Vorhersage.

Die Reihenfolge folgt der DOM-Reihenfolge; es gibt kein `tabindex` > 0.
Radiogruppen sind je **ein** Tab-Schritt (das gewählte Feld), die Auswahl
innerhalb der Gruppe läuft mit den Pfeiltasten — nativ, nicht nachgebaut.

## 4 · Tastenverhalten der Bedienelemente

| Element | Tasten | Verhalten | Herkunft |
|---|---|---|---|
| Regler (`input[type=range]`) | ←/→, Home/End, PageUp/Down | Wert ändern; Messwerte und Diagramm folgen sofort | nativ |
| Radiogruppe | ←/→/↑/↓ | Auswahl wechselt, ein Tab-Stopp je Gruppe | nativ |
| Start/Stopp | Enter/Space | `aria-pressed` wechselt `false` ⇄ `true`, Statuszeile meldet | Skript |
| Antwortknöpfe | Enter/Space | genau einer `aria-pressed="true"`; nach dem Speichern gesperrt | Skript |
| Journal-Eintrag (`<details>`) | Enter/Space | auf/zu, `+`/`−` sichtbar | nativ |
| Löschdialog | Escape | schließt, Fokus zurück zum Auslöser | `<dialog>` (Produktion) / `aria-modal="false"` im Mockup |
| Sprunglink | Enter | Fokus auf `#radWerkzeug` | Anker + `tabindex="-1"` |

Der Dialog im Mockup ist ein statischer Block (kein Fixoverlay), damit
Screenshots reproduzierbar bleiben; im Betrieb ist es ein `<dialog>` mit
Fokusfalle. Das ist im Markup ausdrücklich vermerkt.

## 5 · Fehlerfokus

- `role="alert"` + `tabindex="-1"`: Nach dem Absenden eines fehlerhaften
  Formulars wandert der Fokus auf die Zusammenfassung, nicht in das erste Feld.
  Grund: erst hören, was falsch ist, dann springen.
- Jeder Fehlerpunkt ist ein Link (`href="#feldId"`), der das Feld fokussiert.
- Der Fokusring der Zusammenfassung hat 4 px Abstand, damit er den Rahmen des
  Bandes nicht überdeckt (gemessen: `outline-offset` 4 px am Fehlerband).

## 6 · Befund P4: Datumsfeld hat vier Tab-Stopps

`input[type=date]` erzeugt in Chromium vier Fokusschritte innerhalb **eines**
Elements (Tag, Monat, Jahr, Kalender-Knopf). Gemessen im Journal, 1440 px,
drei Runden (`messung/diag/datum-fokus.json`, Skript
`scripts/diag-datum-fokus.cjs`):

| Schritt | Element | `:focus` | `:focus-within` | Host-`outline` **vor** P4 |
|---|---|---|---|---|
| 10–12 | `input[type=date]` (Tag/Monat/Jahr) | true | true | `solid 2px rgb(198,179,142)` / 4 px |
| 13 | dasselbe Feld (Kalender-Knopf) | **false** | true | **`none 3px rgb(234,230,220)`** |

Der Befund war reproduzierbar (3 von 3 Runden, und ein früherer Lauf, gesichert
als `messung/diag/fokus-datum-vorlauf-0132.json`): im letzten Stopp liegt der
Fokus im Shadow-Tree, `:focus-visible` greift am Host nicht mehr.

**Was dort trotzdem sichtbar war** (Bildprüfung, nicht berechnet):
`messung/diag/vorher/datum-schritt13-ohne-sandring.png` zeigt **keinen** Ring um
das Feld, aber einen weißen Kasten des Browsers am Kalendersymbol
(`vorher/datum-schritt10-mit-sandring.png` zeigt zum Vergleich den Sand-Ring).
Die Aussage des Vorgängerstands („Chrome zeichnet dort seinen eigenen
Indikator“) war also richtig — aber der Indikator ist nicht der Sand-Ring des
Design Systems, sondern ein UA-Kasten an einem 16-px-Symbol. Das ist sichtbar,
aber nicht die dokumentierte Regel „Fokus ist immer 2 px Sand“.

**Korrektur (additiv, nur im Mockup):**

```css
.rad-ws-input:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
  border-color: var(--color-primary);
}
```

Nach der Korrektur meldet Schritt 13 `outline: solid 2px rgb(198,179,142) /
offset 4px` bei `:focus` false und `:focus-within` true — in allen drei Runden
gleich; Bild: `messung/diag/datum-fix-schritt13.png` (Sand-Ring um das ganze
Feld, UA-Kasten am Symbol bleibt).

Grenzen dieses Belegs:

- Der UA-Kasten am Kalendersymbol ist zusätzlich sichtbar; er wird nicht
  entfernt (`::-webkit-calendar-picker-indicator` bleibt unangetastet).
- Die Bildbytes sind **nicht** über alle Runden identisch: die erste Runde nach
  Browserstart weicht von Runde 2 und 3 ab (erster Paint), Runde 2 und 3 sind
  byte-gleich. Belegt sind daher die berechneten `outline`-Werte (in allen
  Runden gleich) plus Sichtprüfung, keine Pixelgleichheit.
- `Page.captureScreenshot` mit `clip` lieferte leere Bilder (881 Byte), siehe
  `MESSUNG.md` §12 Nr. 7; die Bilder sind Vollbild-Aufnahmen, geprüft wurde die
  Feldregion.
- Nur Chromium 155. In Firefox/Safari kann die Zahl der Tab-Stopps und der
  UA-Indikator abweichen — dort ist nichts gemessen.

## 7 · Reduzierte Bewegung

Regel im Design System (`css/design-system.css`):

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Werkstatt-spezifisch: `.rad-lab-arm` bekommt `animation: none` und die statische
Ruhelage (`rotate(-12deg)`); die Statuszeile sagt ausdrücklich, dass nichts in
Bewegung gesetzt wurde.

Gemessen (`messung/werkstatt-messung.json` → `reducedMotion`):

| Fall | `animationName` | `animationDuration` | `transform` |
|---|---|---|---|
| Ruhe (ohne Bewegung) | `none` | `0s` | `matrix(0.978148, -0.207912, …)` = Ruhelage |
| `reduce` + Start | `none` | `0s` | unverändert statisch |
| ohne `reduce` + Start | **`radSwing`** | **2,6 s** | animiert |

Wichtig: **Die Messwerte bleiben in allen drei Fällen ablesbar** (Periode,
Theorie, Abweichung, Dämpfung werden unabhängig von der Animation berechnet).
Reduzierte Bewegung ist damit kein Informationsverlust.

## 8 · Was nicht geprüft wurde

- **Kein Screenreader-Test.** Behauptet wird nur, was das DOM hergibt: eine
  Live-Region (`liveRegions: 1` in allen 52 Messpunkten), keine
  Überschriften-Sprünge (`headingJumps: 0`), genau eine H1 (`h1Count: 1`),
  keine Bilder ohne `alt` (`imgsNoAlt: 0`), keine unbeschrifteten Felder.
- **Fokus nur über `Tab`.** `Shift+Tab`, Pfeiltasten in Radiogruppen und
  `Escape` im Dialog sind beschrieben (§4), aber in diesem Lauf nicht
  protokolliert.
- **UA-Indikator nicht farblich gemessen.** Vom weißen Kasten am
  Kalendersymbol (§6) sind Bild und Sichtprüfung vorhanden, kein gemessener
  RGB-Wert und damit kein berechneter Kontrast.
- **Kein Zoom-/Reflow-Test bei 200 %** und kein Windows-Forced-Colors-Test.
- **Kein Safari/Firefox.** Alle Zahlen gelten für Chrome 155.0.8059.85.
- **Keine WCAG-Zertifizierung.** Die Zahlen sind Messwerte für benannte Paare
  und Zustände; eine Konformitätsaussage ist damit nicht verbunden.
