# Barrierefreiheit — Prüfung und Nachweise

Stand: 2. November 2026 · Zielstandard: **WCAG 2.2 AA**, soweit auf die
Konzept- und Mockup-Ebene anwendbar.

## 1. Prüfumgebung und Grenzen

- Chromium (Playwright 1.64.1, Build 1208) unter Windows 11, ohne Erweiterungen.
- Gerendert: `mockup/index.html` mit den echten Projektstylesheets
  (`css/design-system.css`, `css/main.css`) und `mockup/farbwelten.css`.
- Breiten: 1440, 1100, 900, 768, 390, 320 px; zusätzlich Kopfzeilenmessung bei
  781/800/840/900/901/920/960/1024/1120/1200/1440 px.
- Reproduktion: `node docs/farbwelten-konzept/scripts/audit-mockup.cjs`,
  `node docs/farbwelten-konzept/scripts/measure-header.cjs`,
  `python docs/farbwelten-konzept/scripts/generate-palette.py`.
  Rohdaten: `messung/mockup-audit.json`, `messung/nav-9-ziele-farben.json`,
  `messung/palette.json`.
- **Nicht geprüft:** kein Screenreader-Lauf (NVDA/JAWS/VoiceOver), kein
  axe-/Lighthouse-Lauf, keine Nutzertests mit behinderten Personen, keine
  Simulation von Farbfehlsichtigkeit. Diese Punkte stehen in §8 als offen.

## 2. Kontrast (gemessen)

### 2.1 Paletten

Alle Text- und Linienpaare der sieben Farbwelten: siehe `03` §4.
Kurzfassung: `-ink` 4,81–5,99:1 auf den drei dunklen Flächen, Fließtext
8,96–13,81:1, funktionale Linien 3,22–3,35:1. Alle Prüfungen bestanden
(`messung/palette.json` → `checks`).

### 2.2 Gerendertes Mockup (1440 px, berechnete Farben)

| Element | Vordergrund | Hintergrund | Kontrast |
| --- | --- | --- | ---: |
| H1 | `#eae6dc` | `#0b1012` | 15,36:1 |
| Hero-Lede | `#babdb7` | `#0b1012` | 10,07:1 |
| Register-Name | `#eae6dc` | `#0b1012` | 15,36:1 |
| Register-Metadaten | `#babdb7` | `#0b1012` | 10,07:1 |
| Register-Pfeil | `#c6b38e` | `#0b1012` | 9,33:1 |
| Kartentext | `#babdb7` | `#141c1f` | 9,09:1 |
| Kartentitel | `#eae6dc` | `#141c1f` | 13,86:1 |
| Chakra-Titel | `#eae6dc` | `#0b1012` | 15,36:1 |
| Chakra-Sanskrit | `#babdb7` | `#0b1012` | 10,07:1 |
| Vergleichstext | `#babdb7` | `#141c1f` | 9,09:1 |
| Vergleichs-Fußnote | `#babdb7` | `#141c1f` | 9,09:1 |
| Detail-Absatz | `#babdb7` | `#141c1f` | 9,09:1 |
| Tafel-Name | `#eae6dc` | `#281715` (Rot `-deep`) | 13,77:1 |
| Tafel-Wellenlänge | `#babdb7` | `#281715` | 9,03:1 |
| Chakra-Knoten (Zahl) | `#eae6dc` | `#0b1012` | 15,36:1 |
| Chip „Historisch“ | `#c0a889` | `#141c1f` | 7,57:1 |
| Chip „Empirie“ | `#9db3c4` | `#141c1f` | 7,96:1 |
| Chip „Deutungstradition“ | `#c6b38e` | `#141c1f` | 8,42:1 |

Zwei Elemente liegen auf einem CSS-Verlauf: Detail-H2/Lede und die
Farbwelt-Beschriftung. Für die Detail-Band gilt: beide Endpunkte sind geprüft
(`#281715` und `#141c1f`), der Verlauf liegt dazwischen; die Beschriftung der
Farbtafel liegt nach Umbau **nicht** auf dem Verlauf, sondern auf der festen
`-deep`-Platte (13,77:1 / 9,03:1 gemessen).

## 3. Fokus

- Autorenregel: `outline: 2px solid #c6b38e; outline-offset: 4px` auf
  `.fw-node:focus-visible` und `.fw-register__link:focus-visible`; global
  dieselbe Regel für alle interaktiven Elemente.
- Gemessen (ohne reduzierte Bewegung, Tastatur-Tab): **2 px solid
  rgb(198,179,142), Offset 4 px** → 9,33:1 gegen `#0b1012` (Anforderung 3:1).
- Gemessen mit `prefers-reduced-motion: reduce`: Chromium zeichnet zusätzlich
  seinen nativen Ring (3 px, `#eae6dc`, 15,36:1). Beide Ringe sind sichtbar;
  der Zustand „ausgewählt“ nutzt Rahmen + Innenkante, damit er nicht mit dem
  Fokusring kollidiert.
- Fokus wird nie entfernt (`outline:none` kommt im Modul nicht vor).

## 4. Tastatur

Ablauf im Mockup geprüft (`messung/mockup-audit.json` → `keyboard`):

1. `Tab` vom Dokumentstart: Skip-Link → Logo → neun Navigationsziele →
   Zähler → Hero-Aktionen → Registerzeilen → Karten → sieben Chakra-Knoten →
   Chakra-Link → Inhaltsverzeichnis.
2. Auf einem Chakra-Knoten wechseln `↑ ↓ ← →` zur Nachbarposition; Fokus und
   Auswahl folgen (gemessen: `root` → `sacral`, Panel und Link aktualisiert).
3. Burger-Menü: `<button aria-expanded>`, `aria-label` wechselt zwischen
   „Menü öffnen“/„Menü schließen“.
4. Keine Tastaturfalle, keine Abkürzungen mit Einzelzeichen, keine
   Zeigergesten erforderlich.

## 5. Struktur und Semantik

| Prüfpunkt | Ergebnis | Nachweis |
| --- | --- | --- |
| Genau eine H1 je Ansicht | erfüllt (1 H1) | `mockup-audit.json` → `h1Count` |
| Überschriften ohne Sprünge | H1 → H2 → H3 | `headings`-Liste im Audit |
| Landessprache | `<html lang="de">` | Markup |
| Hauptbereiche | `header/nav/main/footer`, Skip-Link auf `#main` | Markup |
| Chakra-Auswahl | sieben `<button aria-pressed>`, genau einer gedrückt | Audit `pressedCount: 1` |
| SVG | `<title>` + `<desc>`, `role="img"` | Audit `svgTitle: true` |
| Bilder ohne Alt | 0 (keine `<img>` im Mockup) | Audit `imagesWithoutAlt: 0` |
| Farbe nie allein | Register/Chakra tragen Text, Auswahl trägt `aria-pressed`, Navigation `aria-current` | Konstruktion |
| Ziele ≥ 24 px | Chakra-Knoten 44 px (≥901), 36 px (401–700), 32 px (≤400); Buttons 48 px | Audit `nodeSizes` |
| Reflow 320 px | kein horizontaler Überlauf | Audit `docOverflowX: 0` bei 320 |
| Kartenhöhen je Reihe | differenzfrei (443 px bei 1440) | Audit `cardHeights`/`cardTops` |
| Konsolenfehler | keine | Audit `errors` |

## 6. Bewegung und Reize

- Globale Regel setzt Animationen und Übergänge bei `prefers-reduced-motion`
  auf 0,01 ms; das Modul fügt keine Ausnahme hinzu.
- Kein Autoplay, kein Blinken, kein dauerhaftes Pulsieren.
- Die optionale Chakra-Hervorhebung ist ein einmaliger, statischer Schein
  (200 ms); ohne Bewegung bleibt die Auswahl über Rahmen und Text erkennbar.
- Spektrum-Slider (FW-07) aktualisiert Werte ohne Animation.

## 7. Prüftabelle (WCAG 2.2 AA, Auszug)

Status: **E** = erfüllt und gemessen · **K** = erfüllt durch Konstruktion ·
**T** = teilweise · **N** = nicht anwendbar.

| Kriterium | Umsetzung | Status |
| --- | --- | :---: |
| 1.1.1 Nicht-Text-Inhalt | SVG mit Titel/Beschreibung, dekorative Flächen `aria-hidden` | E |
| 1.3.1 Info und Beziehungen | Überschriften, Listen, `<dl>` für Kennwerte, `<table>` für Farbe–Chakra | K |
| 1.3.2 Bedeutungstragende Reihenfolge | DOM folgt Lesefluss; Chakra-Nummern 1–7 in DOM-Reihenfolge | K |
| 1.3.3 Sensorische Eigenschaften | keine Anweisungen wie „die rote Karte links“ | K |
| 1.4.1 Farbe allein | Text + `aria-pressed` + Rahmen; Chips mit Wortlaut | E |
| 1.4.3 Kontrast Text | alle Paare ≥ 4,81:1 | E |
| 1.4.4 Textgröße 200 % | Zoom entspricht 720 px Breite; kein Überlauf (768/390 geprüft), reiner Textzoom **nicht** separat geprüft | T |
| 1.4.10 Reflow | 320 px ohne Überlauf | E |
| 1.4.11 Nicht-Text-Kontrast | Fokus 9,33:1, Linien ≥ 3,22:1, Kartenrahmen 5,31:1 | E |
| 1.4.12 Textabstände | keine festen Höhen auf Textcontainern | K |
| 2.1.1 Tastatur | alle Funktionen per Tastatur | E |
| 2.1.2 Keine Tastaturfalle | kein Modal im Modul | N |
| 2.2.1 Zeitbegrenzung | keine | N |
| 2.2.2 Pause/Stop | keine bewegten Inhalte | N |
| 2.3.1 Blitzschwelle | keine Blitze | N |
| 2.4.1 Blöcke umgehen | Skip-Link als erstes fokussierbares Element | K |
| 2.4.2 Seitentitel | je Route eigener Titel (Tabelle in `02` §10) | K |
| 2.4.3 Fokusreihenfolge | DOM-Reihenfolge, kein `tabindex > 0` | E |
| 2.4.4 Linkzweck | Linktexte benennen Ziel („Farbwelt Rot öffnen“) | K |
| 2.4.6 Überschriften und Labels | genau eine H1, keine Sprünge | E |
| 2.4.7 Fokus sichtbar | 2 px Sand, 4 px Offset; gemessen | E |
| 2.4.11 Fokus nicht verdeckt | `scroll-padding-top` des Systems; sticky Kopfzeile 100/84 px | K |
| 2.5.1 Zeigergesten | keine Mehrpunktgesten | N |
| 2.5.3 Beschriftung im Namen | sichtbarer Text = zugänglicher Name; Icon-Button „Menü“ hat `aria-label` | K |
| 2.5.7 Ziehen | kein Drag-and-drop | N |
| 2.5.8 Zielgröße 24 px | alle Ziele ≥ 32 px, Ausnahmen nur Inline-Links im Satz | E |
| 3.1.1 Sprache | `lang="de"` | E |
| 3.2.1 Bei Fokus | Fokus löst keine Navigation aus | K |
| 3.3.1 Fehlerkennzeichnung | keine Formulare im Modul (Übung ohne Eingabefelder) | N |
| 4.1.2 Name, Rolle, Wert | Buttons mit `aria-pressed`, `aria-label` | E |
| 4.1.3 Statusmeldungen | Panel `aria-live="polite"` | K |

## 8. Offene Punkte (nicht als erledigt gewertet)

1. Screenreader-Lauf (NVDA/JAWS/VoiceOver) auf Einstieg, Farbdetail und
   Chakrenseite — fehlt.
2. Automatisierter axe- oder Lighthouse-Audit — fehlt; die Kontraste sind
   rechnerisch und im gerenderten DOM geprüft, nicht per Regelwerk.
3. Textzoom 200 % (nur Zoom, ohne Breitenänderung) — nicht separat gemessen,
   weil die Typografie in px definiert ist; bei der Umsetzung mit `rem` prüfen.
4. Farbfehlsichtigkeit: Die Gestaltung vermeidet Farbe als alleinigen Träger,
   eine Simulation (Deuteranopie/Protanopie) wurde nicht durchgeführt.
5. Die Übung (Abschnitt G) ist im Mockup nicht implementiert; ihre
   Bedienbarkeit (Start/Pause/Ende, kein Autoplay) ist Vorgabe, nicht Nachweis.

## 9. Nachweise (Bilder)

| Bild | Inhalt |
| --- | --- |
| `messung/mockup/farbwelten-1440.png` | Gesamtseite ohne Kopfzeile |
| `messung/mockup/farbwelten-1440-viewport.png` | Hero mit neun Navigationszielen |
| `messung/mockup/farbwelten-768.png`, `-390.png`, `-320.png` | Reflow |
| `messung/mockup/fokus-chakra-1440.png` | Fokusring am Chakra-Knoten |
| `messung/bestand/mobil-menue-9-ziele-390.png` | Mobilmenü mit neun Zielen |
