# Farbwelten & Farbtherapie — IA- und Designkonzept

Kanban-Task: `t_15ca49af` · Assignee: `design_web_layout` ·
Stand: 2. November 2026 · Status: **Lieferung fertig, Umsetzung offen**

Dieses Paket legt fest, wie die neue Sektion „Farbwelten & Farbtherapie“ in
Esoterik-Welt aussieht, wie sie strukturiert ist und wie sie barrierefrei
umgesetzt wird. Es enthält keine Produktionsänderung an der Website.

## 1. Inhalt des Pakets

| Datei | Zweck |
| --- | --- |
| `01-bestandsaufnahme.md` | Architektur, Navigation, Tokens, Komponenten, Risiken — mit Screenshots |
| `02-informationsarchitektur.md` | Routen, Navigationsentscheidung (gemessen), Seitenskelett, Datenmodell, SEO |
| `03-farbwelten-und-paletten.md` | 7 Paletten mit Hex-Werten, Rollen, geprüfte Kontraste, Token-Ausgabe |
| `04-typografie-layout-bildsprache.md` | Typo-Hierarchie, Raster, Breakpoints, Bildsprache, Bewegung |
| `05-komponenten-specs.md` | Hero, Farbtafel, Register, Farbkarte, Chakra-Explorer, Vergleichsbox, Chips |
| `06-wireframes.md` | ASCII-Wireframes je Seitentyp und Zustandstabelle |
| `07-accessibility.md` | WCAG-2.2-AA-Prüfung, gemessene Werte, offene Punkte |
| `08-umsetzungsleitfaden.md` | Dateien, Router-Patch, Block-Renderer, Tests, Definition of Done |
| `mockup/index.html` + `farbwelten.css` + `palette.css` | lauffähiges Mockup der Einstiegsseite mit Chakra-Explorer |
| `scripts/` | Palettengenerator, Kontrastrechner, Kopfzeilenmessung, Mockup-Audit, Tabellenexport |
| `messung/` | Rohdaten (JSON), Screenshots, generierte Tabellen |

## 2. Kernentscheidungen (kurz)

1. **Eine Hauptroute mit Unterrouten**: `#farbwelten`, `#farbwelten/<farbe>`
   (7), `#farbwelten/chakren`, `#farbwelten/lichtfrequenzen`; Aliase
   `#chakren` und `#lichtfrequenzen`. Keine neuen Dokumente, keine Sitemap-
   Einträge — die Website ist eine Hash-Router-Anwendung.
2. **Neuntes Navigationsziel „Farben“**, Mobilmenü-Grenze von 780 auf 900 px.
   Begründung und Messung: `02` §3. Ohne die Grenzänderung läuft die Kopfzeile
   bei 781 px um 16,2 px über; mit ihr bleiben ab 901 px 50,31 px Reserve.
3. **Farbe als Pigmentfläche, nie als Textgrund**: sieben gedeckte Paletten in
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
| Palettenkontraste (7 × 10 Paare) | alle ≥ Ziel, 0 Verstöße | `messung/palette.json`, `scripts/generate-palette.py` |
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

## 6. Offene Entscheidungen (bewusst nicht getroffen)

1. **Weiß/Schwarz** als eigene Kategorie „Neutraltöne“ — braucht eine
   redaktionelle Entscheidung, keine Designentscheidung (`03` §5).
2. **Ob „Farben“ oder „Farbwelten“** im Navigationslabel: Messung spricht für
   „Farben“ (50,31 px statt 25,31 px Reserve). Wenn die Redaktion den
   Markennamen in der Kopfzeile will, muss die Grenze weiter auf 960 px.
3. **Zahl der Farbkarten** auf der Einstiegsseite: drei Beispiele sind gesetzt;
   sieben Karten würden die Fläche dominieren (`04` §6).
4. **Inhaltsquelle** (Markdown → Datenmodul) ist als Weg beschrieben; das
   endgültige Format entscheidet die Implementierung mit den gelieferten Texten.

## 7. Grenzen dieses Pakets

- Es ist ein Konzept mit prüfbarem Mockup, keine Produktionsimplementierung.
  Routen, Module und Tokens sind beschrieben, aber nicht in `index.html`
  eingebaut.
- Die Inhalte der Farbseiten fehlen bewusst; sie kommen aus Recherche und
  Redaktion. Das Mockup enthält kurze Beispieltexte zur Formprüfung.
- Die Screenshots zeigen das Mockup, nicht die Live-Site; die
  Bestandsaufnahme zeigt die Live-Site vor der Erweiterung.
