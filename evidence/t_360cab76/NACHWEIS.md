# Nachweis t_360cab76 — Restdoku auf zwölf Farbwelten

Karte: `t_360cab76` · Branch `esoterik-welt/t_360cab76-farbwelten-restdoku-04-07-08-umsetzungsd`
Arbeitsbasis: `d0fe111` (Fast-Forward von `30a2f62`; die Kartenbasis lag vor dem
Zwölf-Farben-Commit). Kein Push, kein Deploy.

## 1. Geltungsprüfung (Kartenauftrag Punkt 1)

| Dokument | Einstufung | Behandlung |
| --- | --- | --- |
| `02`, `03`, `06` | verbindliche Vorgabe, Stand `d0fe111` | unverändert (Referenz) |
| `04`, `05`, `07`, `08` | verbindliche Vorgabe | auf zwölf Farbwelten gezogen, Messwerte der 7-Farben-Stufe gekennzeichnet |
| `README.md` | Einstieg/Vorgabe | neue §0 „Geltung und Stand“ mit Einstufung aller Artefakte; Zählungen korrigiert |
| `01-bestandsaufnahme.md` | historische Bestandsaufnahme (2.11.2026) | unverändert, in README §0 als nicht fortgeschrieben markiert |
| `docs/farbwelten-umsetzung-t_2275e7ad.md` | Lieferprotokoll erste Ausbaustufe | als 7-Farben-Messstand gekennzeichnet, neuer §13 mit Zwölf-Farben-Stand |
| `mockup/index.html`, `mockup/farbwelten.css` | Design-Mockup | **nicht** nachgezogen, als historischer Messstand markiert |
| `mockup/palette.css` | generiert (`generate-palette.py`) | unverändert; enthält bereits zwölf Welten |
| `messung/mockup-audit.json` | Messrohdaten | `stand`-Feld ergänzt; Zahlen unverändert |
| `messung/palette.json` | Palettenmessung | bereits zwölf Welten, unverändert |

Entscheidung: Das Mockup wird **nicht** aktiv auf zwölf Bänder/Zeilen
nachgezogen. Es ist der Design-Nachweis der ersten Ausbaustufe; ein Nachziehen
würde die in `04` §2, `05` §2, `07` §2.2/§5 und README §3 zitierten Messwerte
(96-px-Registerzeilen, 443-px-Karten, Kopfzeilenreserve, Screenshots)
entwerten, ohne dass dafür ein Design-Auftrag besteht. Produktionsreferenz sind
`css/farbwelten.css` + `js/data/farbwelten.js`.

## 2. Änderungsliste

1. `docs/farbwelten-konzept/04-typografie-layout-bildsprache.md`
   - Kopf: Geltungsbereich zwölf Farbwelten + Kennzeichnung aller Messwerte als
     „Messung erste Ausbaustufe (7 Farbwelten)“.
   - §2: Messblock als 7-Farben-Messung ausgewiesen, „(7 Zeilen im Messstand)“.
   - §4: Farbtafel-Zeile von „7 Bänder“ auf „12 Bänder in Registerreihenfolge“
     plus Regel für Typ-Label statt nm-Angabe bei nichtspektralen/neutralen
     Welten; „sieben Farbwelten“ → „zwölf“ (kein Fremdbild nötig).
   - §6: „Sieben Farbkarten … sieben gesättigte Flächen“ → „Zwölf … zwölf“.
2. `docs/farbwelten-konzept/05-komponenten-specs.md` (nicht in der Kartenliste,
   gleicher Defekt, verbindliche Komponentenspezifikation)
   - Kopf: Geltungsbereich zwölf; Mockup = Stand erste Ausbaustufe; bei
     Abweichung gelten die Werte der Produktionsfassung.
   - §2 Farbtafel: „Alle sieben Welten“ → zwölf; Container-Spezifikation von
     `repeat(7,1fr)`/`aspect-ratio:4/5` auf die implementierten Werte
     (`repeat(12, minmax(44px, auto))`, kein Seitenverhältnis, Fläche
     `--color-bg-card`), Feld/Platte nach `css/farbwelten.css` (`flex:0 0 40%`,
     `flex:1 1 auto`, 12 px Innenabstand), Mobil-Regel ≤700 px; Kontrastangaben
     auf die zwölf Werte aus `03` §4 (13,59–13,89:1 bzw. 8,91–9,11:1);
     aria-label/`<ul>` auf zwölf.
   - §3 Register: „Einstieg in die sieben Detailseiten“ → zwölf.
3. `docs/farbwelten-konzept/07-accessibility.md`
   - Kopf: Geltungsbereich zwölf + Kennzeichnung der Messungen als Stand erste
     Ausbaustufe + Verweis auf `npm run verify:farbwelten` für die Produktion.
   - §1: Prüfobjekt als 7-Farben-Messung markiert.
   - §2.1: zwölf Paletten mit den echten Wertebereichen aus `03` §4; alter
     7-Farben-Bereich als Vergleichswert ausdrücklich stehen gelassen.
   - §2.2/§5: Überschrift bzw. Vorspann „Messung erste Ausbaustufe
     (7 Farbwelten)“.
   - §8: neuer offener Punkt 6 (kein erneutes Mockup-Audit/Lighthouse für die
     zwölf Farbwelten).
   - §9: Bilder als 7-Farben-Messstand markiert.
4. `docs/farbwelten-konzept/08-umsetzungsleitfaden.md`
   - Kopf: Geltungsbereich zwölf Farbwelten / 14 Routen.
   - §1: `js/data/farbwelten.js` „7 Farbwelten“ → 12 in Registerreihenfolge;
     `verify-pages.cjs`-Routen auf die Liste aus `02` §2.
   - §2: PAGE_META-Description auf „Zwölf Farbwelten …“ (wortgleich `02` §10)
     plus dokumentierte Abweichung im Ist-Stand (`js/main.js`).
   - §4: „alle Blöcke der sieben Welten“ → zwölf.
   - §7: Routenaufnahme auf 14 Routen; Testdatei `tests/farbwelten.cjs` →
     `.mjs` (Ist-Stand); „sieben Farbseiten“ → zwölf.
   - §8: Abnahmekriterium „Einstieg, zwölf Farbseiten, Chakren,
     Lichtfrequenzen (14 Routen) …“.
   - §9: Risiko „Sieben Seiten …“ → „Zwölf Seiten …“.
5. `docs/farbwelten-konzept/README.md`
   - Kopfstatus: Umsetzung der zwölf Farbwelten erfolgt (`c2b70f4`, `d0fe111`),
     Abnahme offen; Satz „enthält keine Produktionsänderung“ entfernt.
   - neue §0 „Geltung und Stand“ (Einstufungstabelle, s. o.).
   - §1: „7 Paletten“ → 12; Mockup-Zeile mit Messstand-Hinweis.
   - §2.1: Routen „(7)“ → „(12)“, 14 Routen; §2.3: „sieben gedeckte Paletten“
     → zwölf.
   - §3: „(7 × 10 Paare)“ → „zwölf Paletten, 12 Messpaare und 5 Prüfpunkte je
     Welt“ (Werte aus `palette.json` gezählt) + Hinweis auf 7-Farben-Messstand.
   - §6: offene Entscheidung Weiß/Schwarz als entschieden/umgesetzt markiert;
     „sieben Karten“ → zwölf.
   - §7: Grenze „keine Produktionsimplementierung“ auf den aktuellen Stand
     gebracht.
6. `docs/farbwelten-umsetzung-t_2275e7ad.md`
   - Kopf: Geltungsstand erste Ausbaustufe (7 Farbwelten, 11 Ansichten), Zahlen
     werden nicht umgedeutet, Verweis auf §13.
   - §1/§3/§4/§6/§7/§8: „sieben Farbdetailseiten/seiten“, „7 Farbwelten“,
     „49 Palettentokens“ mit „(erste Ausbaustufe; heute …)“ gekennzeichnet.
   - neuer §13 „Nachzug zwölf Farbwelten (Stand `d0fe111`)“: Vergleichstabelle
     (7 → 12 Farben, 11 → 14 Routen, 49 → 84 Tokens, 66 → 153 KB) und die neu
     gefahrenen Prüfungen, dazu vier offene Punkte.
7. `docs/farbwelten-konzept/mockup/index.html`
   - HTML-Kommentar vor `<html>`: Messstand erste Ausbaustufe, nicht Referenz für
     zwölf, `palette.css` wird mit zwölf Welten erzeugt. Markup unverändert.
8. `docs/farbwelten-konzept/messung/mockup-audit.json`
   - Top-Level-Feld `stand` mit derselben Kennzeichnung; Messzahlen unverändert.
9. `docs/farbwelten-konzept/scripts/audit-mockup.cjs`
   - schreibt das `stand`-Feld mit, damit die Kennzeichnung eine Neumessung
     überlebt (sonst nur Kommentar in der Doku).

Nicht angefasst: `content/farbwelten/*.md`, `js/data/farbwelten.js`,
`docs/farbwelten-konzept/01/02/03/06`, `mockup/palette.css`,
`messung/palette.json`.

## 3. Prüfungen (real gefahren)

| Prüfung | Kommando | Ergebnis |
| --- | --- | --- |
| Vertrags-/Rechentests | `npm run test:farbwelten` | 12/12 pass, 0 fail |
| Quellen-Registersync | `node scripts/verify-farbwelten-sync.cjs` | 15 Quellen, 16 Registereinträge, 0 Fehler |
| Produktionsbuild | `npm run build` | grün (`dist/Esoterik-Welt/`), `Lokal*.html` danach zurückgesetzt |
| Browserprüfung Farbwelten | `node scripts/verify-farbwelten.cjs http://127.0.0.1:3207/Esoterik-Welt/` | 87 PASS / 0 FAIL |
| Seiten-/Routenprüfung | `node scripts/verify-pages.cjs http://127.0.0.1:3207/Esoterik-Welt/` | 66 Seiten/Viewports, 0 Fehler |
| Mockup rendert unverändert | Playwright-Lauf auf `mockup/index.html` (file://) | 7 Bänder, 7 Registerzeilen, Tafel 520×650, 0 Konsolenfehler |
| JSON-Gültigkeit | `patch`/Lint auf `mockup-audit.json` | gültig |

Der Build- und Testlauf hat `evidence/farbwelten/*` und `Lokal*.html`
überschrieben; beides wurde per `git checkout` zurückgesetzt, die neu
entstandenen Screenshots (`schwarz-*.png`, `tuerkis-*.png`) entfernt.

## 4. Befunde außerhalb des Kartenumfangs

1. `js/main.js` → `PAGE_META.farbwelten.description` lautet weiterhin
   „Sieben Farbwelten …“, verbindlich ist `02` §10 („Zwölf …“). Codeänderung,
   nicht in dieser Karte; in `08` §2 als Abweichung dokumentiert.
2. `js/data/farbwelten.js` ist mit 153 KB über dem in `08` §9.2 genannten
   Richtwert von 150 KB; die dort beschriebene Auslagerung auf
   `data/farbwelten/*.json` ist damit fällig.
3. `docs/farbwelten-konzept/06-wireframes.md` Zeile 79 und 152 schreiben
   „spektraalfarbe“ (ein zusätzliches A nach „Spektra“) statt
   „spektralfarbe“ — Tippfehler aus `d0fe111`; `06` ist Referenzdatei dieser
   Karte und blieb unberührt.
4. `02` §2 nennt 14 Routen, `scripts/verify-pages.cjs` prüft davon 10
   (Einstieg, sieben Typenvertreter, Chakren, Licht) — Deckung ausreichend, aber
   nicht vollständig; in `08` §1/§7 als Soll formuliert.
