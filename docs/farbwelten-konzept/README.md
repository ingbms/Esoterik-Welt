# Farbwelten & Farbtherapie — IA- und Designkonzept

Kanban-Task: `t_15ca49af` · Assignee: `design_web_layout` ·
Stand: 2. November 2026 · Konzeptstand · **Umsetzung der zwölf Farbwelten im
Arbeitsbaum erfolgt (`c2b70f4`, `d0fe111`), Abnahme offen**

Dieses Paket legt fest, wie die Sektion „Farbwelten & Farbtherapie“ in
Esoterik-Welt aussieht, wie sie strukturiert ist und wie sie barrierefrei
umgesetzt wird.

## 0. Geltung und Stand (Stand 3. November 2026)

Der Bereich umfasst **zwölf Farbwelten und 14 Routen**. Verbindliche Vorgabe
sind `02`–`08`; Referenz für den Zwölf-Farben-Stand sind `02` §2/§11, `03` und
`06` (Commit `d0fe111`). Alles Übrige ist Nachweis oder Messstand einer
früheren Stufe und als solcher gekennzeichnet:

| Datei / Artefakt | Rolle | Bezug auf die Farbzahl |
| --- | --- | --- |
| `01-bestandsaufnahme.md` | Bestandsaufnahme vom 2. November 2026 (vor der Sektion) | nennt den damaligen Planungsstand (sieben Seiten); nicht fortgeschrieben |
| `02`–`08` | verbindliche Umsetzungsvorgabe | zwölf Farbwelten, 14 Routen |
| `docs/farbwelten-umsetzung-t_2275e7ad.md` | Lieferprotokoll der ersten Ausbaustufe | Messungen der 7-Farben-Stufe, gekennzeichnet; Zwölf-Farben-Nachzug in §13 |
| `mockup/index.html`, `mockup/farbwelten.css` | Design-Mockup der Einstiegsseite | **Messstand erste Ausbaustufe (7 Farbwelten)**, historisch |
| `mockup/palette.css` | generierte Tokens (`scripts/generate-palette.py`) | aktuell: zwölf Welten (12 × 7 Tokens) |
| `messung/mockup-audit.json`, `messung/mockup/*.png` | Rohdaten und Bilder der Mockup-Messung | **Messstand erste Ausbaustufe (7 Farbwelten)**, historisch |
| `messung/palette.json`, `messung/palette-tabellen.md` | Paletten- und Kontrastmessung | aktuell: zwölf Welten |
| `messung/nav-9-ziele-*.json` | Kopfzeilenmessung | unabhängig von der Farbzahl |

## 1. Inhalt des Pakets

| Datei | Zweck |
| --- | --- |
| `01-bestandsaufnahme.md` | Architektur, Navigation, Tokens, Komponenten, Risiken — mit Screenshots |
| `02-informationsarchitektur.md` | Routen, Navigationsentscheidung (gemessen), Seitenskelett, Datenmodell, SEO |
| `03-farbwelten-und-paletten.md` | 12 Paletten mit Hex-Werten, Rollen, geprüfte Kontraste, Token-Ausgabe |
| `04-typografie-layout-bildsprache.md` | Typo-Hierarchie, Raster, Breakpoints, Bildsprache, Bewegung |
| `05-komponenten-specs.md` | Hero, Farbtafel, Register, Farbkarte, Chakra-Explorer, Vergleichsbox, Chips |
| `06-wireframes.md` | ASCII-Wireframes je Seitentyp und Zustandstabelle |
| `07-accessibility.md` | WCAG-2.2-AA-Prüfung, gemessene Werte, offene Punkte |
| `08-umsetzungsleitfaden.md` | Dateien, Router-Patch, Block-Renderer, Tests, Definition of Done |
| `mockup/index.html` + `farbwelten.css` + `palette.css` | lauffähiges Mockup der Einstiegsseite mit Chakra-Explorer (Markup = Messstand erste Ausbaustufe, 7 Farbwelten; `palette.css` wird mit zwölf Welten erzeugt) |
| `scripts/` | Palettengenerator, Kontrastrechner, Kopfzeilenmessung, Mockup-Audit, Tabellenexport |
| `messung/` | Rohdaten (JSON), Screenshots, generierte Tabellen |

## 2. Kernentscheidungen (kurz)

1. **Eine Hauptroute mit Unterrouten**: `#farbwelten`, `#farbwelten/<farbe>`
   (12), `#farbwelten/chakren`, `#farbwelten/lichtfrequenzen` — zusammen
   14 Routen; Aliase `#chakren` und `#lichtfrequenzen`. Keine neuen Dokumente,
   keine Sitemap-Einträge — die Website ist eine Hash-Router-Anwendung.
2. **Neuntes Navigationsziel „Farben“**, Mobilmenü-Grenze von 780 auf 900 px.
   Begründung und Messung: `02` §3. Ohne die Grenzänderung läuft die Kopfzeile
   bei 781 px um 16,2 px über; mit ihr bleiben ab 901 px 50,31 px Reserve.
3. **Farbe als Pigmentfläche, nie als Textgrund**: zwölf gedeckte Paletten in
   OKLCH konstruiert, jede Rolle kontrastgeprüft (Text ≥ 4,81:1, Linien ≥ 3,22:1).
4. **Evidenz statt Wirkversprechen**: vorhandene `astro-badge`-Chips,
   „Tradition und Forschung“-Kasten mit Pflicht-Fußzeile zur asymmetrischen
   Evidenz, Disclaimer-Platzhalter auf der Lichtfrequenzseite.
5. **Wiederverwendung statt Neubau**: Container, Karten, Badges, Callouts, TOC,
   Fokusregeln und Typografie stammen aus dem Nachtatelier-System; neu sind nur
   die `fw-*`-Bausteine und die Paletten-Tokens.
6. **Barrierefreiheit als Bauvorgabe**: Chakra-Auswahl über echte Buttons mit
   `aria-pressed`, Pfeiltasten, Fokuskontrolle; Farbe nie allein; Reflow bis
   320 px ohne Überlauf.

## 3. Nachweis-Status

| Prüfung | Ergebnis | Datei |
| --- | --- | --- |
| Palettenkontraste (zwölf Paletten, 12 Messpaare und 5 Prüfpunkte je Welt) | alle ≥ Ziel, 0 Verstöße | `messung/palette.json`, `scripts/generate-palette.py` |
| Gerendertes Mockup, 6 Breiten | 0 Konsolenfehler, 0 Überlauf, 1 H1, Karten zeilengleich | `messung/mockup-audit.json` |
| Fokus (Tastatur, ohne reduced motion) | 2 px Sand, 4 px Offset, 9,33:1 | `messung/mockup-audit.json` → `focusDefault` |
| Tastatur Chakra-Auswahl | Pfeiltaste wechselt Auswahl + Panel + Link | `messung/mockup-audit.json` → `keyboard` |
| Kopfzeile mit 9 Zielen | 781 px: −16,20 px (verworfen); 901 px: 50,31 px | `messung/nav-9-ziele-farben.json` |
| Mobilmenü 9 Ziele | 9 × 48 px, 457 px hoch, kein Überlauf | `messung/nav-9-ziele-farben.json` → `mobileMenu` |
| Bestands-Screenshots | Start 1440/390, Kristalle 1440, Mobilmenü | `messung/bestand/` |
| Mockup-Screenshots | 1440, 1100, 900, 768, 390, 320, Fokus | `messung/mockup/` |

**Nicht verifiziert:** Screenreader-Lauf, axe/Lighthouse, Nutzertests,
Farbfehlsichtigkeits-Simulation, Textzoom 200 % ohne Breitenänderung. Diese
Punkte stehen in `07` §8 und sind nicht als erledigt markiert.

Die Mockup-Messungen dieser Tabelle (`mockup-audit.json`,
`nav-9-ziele-farben.json`, Screenshots) sind der **Messstand der ersten
Ausbaustufe (7 Farbwelten)**; die Palettenzeile gilt für zwölf Paletten.
Prüfzahlen des Zwölf-Farben-Stands (12/12 Vertragstests, 87/0 und 66/0 in den
Browserprüfungen): `docs/farbwelten-umsetzung-t_2275e7ad.md` §13.

## 4. Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
python docs/farbwelten-konzept/scripts/generate-palette.py      # Paletten + Kontraste
python docs/farbwelten-konzept/scripts/render-tables.py         # Tabellen
python -m http.server 8138 --bind 127.0.0.1                     # im Elternordner starten
node docs/farbwelten-konzept/scripts/measure-header.cjs         # Kopfzeile + Bestand
node docs/farbwelten-konzept/scripts/audit-mockup.cjs           # Mockup messen
```

Der HTTP-Server muss im **Elternordner** (`C:/Users/mas/Arbeit`) laufen, weil
`index.html` ein `<base href="/Esoterik-Welt/">` setzt.

Mockup ansehen:
`http://127.0.0.1:8138/Esoterik-Welt/docs/farbwelten-konzept/mockup/index.html`

## 5. Übergabe an die Umsetzung

Reihenfolge: Recherche (`t_2dd7d588`) und Texte (`t_1ca468df`) liefern die
Inhalte; die Implementierung (`t_2275e7ad`) setzt dieses Paket um.

Verbindlich für die Umsetzung:

- `02` §3.4: die drei CSS-Änderungen an der Kopfzeile sind **nicht optional**;
  ohne sie läuft die Navigation über.
- `03` §7: Paletten nur als Tokens, keine Hex-Literale in Komponenten.
- `05`: Komponentenmarkup und Zustände; `06`: Reihenfolge der Abschnitte.
- `08`: Dateiliste, Router-Patch, Block-Renderer, Testfälle, Definition of Done.

## 6. Entscheidungen: offen und inzwischen entschieden

1. **Entschieden — Weiß/Schwarz** als eigene Kategorie „Neutraltöne“: als
   Neutralfarben umgesetzt (`03` §5, `02` §2; Karte `t_747ba46a`).
2. **Ob „Farben“ oder „Farbwelten“** im Navigationslabel: Messung spricht für
   „Farben“ (50,31 px statt 25,31 px Reserve). Wenn die Redaktion den
   Markennamen in der Kopfzeile will, muss die Grenze weiter auf 960 px.
3. **Zahl der Farbkarten** auf der Einstiegsseite: drei Beispiele sind gesetzt;
   zwölf Karten würden die Fläche dominieren (`04` §6).
4. **Inhaltsquelle** (Markdown → Datenmodul) ist als Weg beschrieben; das
   endgültige Format entscheidet die Implementierung mit den gelieferten Texten.

## 7. Grenzen dieses Pakets

- Es ist ein Konzept mit prüfbarem Mockup; die Umsetzung der zwölf Farbwelten
  liegt inzwischen im Arbeitsbaum (`c2b70f4`, `d0fe111`) und ist in
  `docs/farbwelten-umsetzung-t_2275e7ad.md` protokolliert. Dieses Paket bleibt
  die Vorgabe; das Mockup zeigt weiterhin die erste Ausbaustufe (§0).
- Die Inhalte der Farbseiten fehlen bewusst; sie kommen aus Recherche und
  Redaktion. Das Mockup enthält kurze Beispieltexte zur Formprüfung.
- Die Screenshots zeigen das Mockup, nicht die Live-Site; die
  Bestandsaufnahme zeigt die Live-Site vor der Erweiterung.
