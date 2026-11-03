# Farbwelten-Synchronisation — Checkpoint t_d76d0853

Stand: 2026-11-03, Branch `feature/farbwelten-modul`, Ausgangs-Commit `466eb6c`.

## Ergebnis

Für alle zehn Seiten ist die Kette **Quelle → `content/farbwelten` → `js/data/farbwelten.js` → gerendertes Modul** belegt: Quellen vollständig, die fachlich bestätigten Korrekturen angekommen, S16-Disclaimer je Seite genau einmal. **Eine inhaltliche Freigabe ist damit nicht ausgesprochen** — die unabhängige Nachprüfung des zusammengeführten Stands läuft als eigene Karte `t_d12db88e` (fact_checking).

## 1. Inventar und Ausgangslage

| Punkt | Wert |
|---|---|
| Repository | `C:/Users/mas/Arbeit/Esoterik-Welt` |
| Branch | `feature/farbwelten-modul` (kein Wechsel, kein Reset, kein Stash) |
| HEAD bei Arbeitsbeginn | `466eb6c` „redaktion(indigo,violett): Abschnitt C Farbpsychologie ergänzt" (aus t_f611ba88) |
| Vorgänger | `ee81d03` (Doku t_2275e7ad), `fb280e1` (Implementierung t_2275e7ad) |
| Prüfquelle | `.../workspaces/t_bad71f2c/*.md` (Stand t_bc152d77, Rework nach t_3d7d0d71) |
| Manifest des Ausgangsstands | `docs/board-workspace-recovery/farbwelten-source-files.json` |

Fremde Änderungen im Arbeitsbaum, **nicht angefasst und nicht committet**: `Lokal.html`, `Lokal-404.html`, `Lokal-datenschutz.html`, `Lokal-haftung.html`, `Lokal-impressum.html`, `js/modules/tarot.js`, `tests/tarot-decks-v2.cjs`, `build-local.cjs` sowie die vielen untracked `docs/`- und `evidence/`-Ordner anderer Linien. Der Radiästhesie-Worktree wurde nicht betreten.

## 2. Befund: der Rework-Stand war älter als HEAD

`content/farbwelten` und der Prüf-Workspace waren vor der Übernahme bei allen zehn Dateien bytegleich (Nachweis: `cmp_integration.py`, 10/10). Der Rework hatte aber eine **gekürzte Revision** als Basis: Gegenüber HEAD fehlten 22 H2-Abschnitte.

| Seite | H2 HEAD | H2 Rework | im Rework fehlend |
|---|---:|---:|---|
| blau | 9 | 6 | Übung, Anmerkung zur ehrlichen Einordnung, Interkulturelle Anmerkungen |
| gruen | 8 | 5 | Praktische Übung, Anmerkung, Interkulturelle Anmerkungen |
| orange | 8 | 5 | Übung, Anmerkung, Interkulturelle Anmerkungen |
| gelb | 7 | 5 | Praktische Übung, Ergänzende Anmerkung zur Tradition |
| indigo | 9 | 4 | Farbpsychologie, Rot-Tabu, Übung, Anmerkung, Interkulturelle, Traditionshistorische Einordnung |
| violett | 9 | 4 | Farbpsychologie, Übung, Anmerkung, Interkulturelle, Physikalisch und traditionell |
| chakren / farbwelten / lichtfrequenzen / rot | 6/6/6/7 | 6/6/6/7 | — (nur Inhalte/Quellen) |

Ein blindes Kopieren hätte diese Abschnitte von der Website entfernt, darunter die in `466eb6c` gerade ergänzte Farbpsychologie für Indigo und Violett. Deshalb **Merge statt Kopie**.

## 3. Vorgehen

**Basis** war der geprüfte Rework-Text (B1/B4/B6/S16/N7/N8, vollständige Bibliografien). Darauf aufbauend:

- **Wiederhergestellt aus HEAD** (Wortlaut dort entnommen): Übung/Praktische Übung auf blau, gelb, gruen, orange, indigo, violett; Farbpsychologie auf indigo/violett (t_f611ba88, Tippfehler „Grön"→„Grün", Selbstauskunft „(gelb, …)" entfernt, eine nicht belegte Kausalaussage gestrichen); Ergänzende Anmerkung zur Tradition (gelb); Interkulturelle Anmerkungen (blau, gruen, orange, je eine farbspezifische Einleitung gegen Paragraph-Duplikate); Traditionshistorische Einordnung (indigo, violett — neu gefasst ohne das wörtliche „drittes Auge" und mit der B4-konformen Lotosfarben-Aussage).
- **Bewusst nicht wiederhergestellt:** „Anmerkung zur ehrlichen Einordnung" (Meta-Selbstauskunft, vom Generator ohnehin verworfen, enthielt eine falsche Skelett-Behauptung), die doppelten Wahrnehmungsabsätze auf indigo/violett (Inhalt steckt in „Farbpsychologie"), „Physikalisch und traditionell" auf violett (Duplikat aus Einführung + Tradition) sowie der H2 „Was nicht verwendet wird (Rot-Tabu)" auf indigo und violett (die Substanz steht jeweils in „Was die Studienlage nicht hergibt").
- **Bereinigt:** interne Reportverweise in Bibliografien (`[24]`, `[31]`, `[17]`, `[18]`, „Report §5.1/§4.1") durch vollzitierte Einträge ersetzt; `[32]` (nur Meta-Verweis) entfernt und die Aussage auf `[24]` gestützt; doppelter Disclaimer auf der Einstiegsseite zu einem Block zusammengeführt; Ampel-/Redaktionssprache in sichtbaren H2 entfernt (lichtfrequenzen, violett) und der Satz „das ist eine rote Aussage (nicht verwendet)" in chakren geglättet; `[10]` auf allen Seiten einheitlich mit Journal und DOI.
- **Generator:** „Traditionshistorische Einordnung" wird jetzt `geschichte` zugeordnet. Vorher verschluckte die Regel `/^tradition/` den spezifischeren `traditionshistorisch`-Zweig; die neue Regel steht davor.

**Neu zitierte Quellen, live geprüft (Crossref, 2026-11-03):**
- `[17]` Bhutani, V. K., et al. (2011). Pediatrics 128(4), e1046–e1052. <https://doi.org/10.1542/peds.2011-1494>
- `[18]` Elmets, C. A., et al. (2019). J Am Acad Dermatol 81(3), 775–804. <https://doi.org/10.1016/j.jaad.2019.04.042>

## 4. Hashes (SHA-256, gekürzt; vollständig in `hashes.json`)

| Seite | HEAD 466eb6c | Rework t_bc152d77 | Workspace = content |
|---|---|---|---|
| blau | 49b09bd5ebc8 | 937e49416847 | b9f7f4c4fa97 |
| chakren | f240aae74972 | c1e52fa6f038 | 771ad5483e56 |
| farbwelten | 2e99adf716b8 | cb6dc0e0925c | 110776419387 |
| gelb | 8d4964aeb469 | c629478f4758 | 1ee9025b8777 |
| gruen | aba3cf85213a | 125d51340d4d | e7f4cc4ca759 |
| indigo | 40f7d2d6ea47 | 71fe1a29123b | b07f5dafcc2e |
| lichtfrequenzen | db581e4f7a8c | e1bbb7ac7b35 | 59bc5cebbc0b |
| orange | 36f9183eaee5 | 15e7da486e3d | 5043257eca2c |
| rot | 8389f4860940 | 0b5fa01917d1 | f45bf604dfa7 |
| violett | d8d2d9a65075 | 7257b8a2d5a6 | 81bfc6db3a12 |
| `js/data/farbwelten.js` | — | — | 34377129ef3b |
| `scripts/generate-farbwelten-data.cjs` | — | — | 2a4c27c68d9f |

## 5. Claim-Mapping: bestätigter Befund → Beleg

| Befund | Umsetzung | Nachweis (Quelle/Daten/gerendert) |
|---|---|---|
| **B1** zitiert ≠ gelistet (7/10) | fehlende IDs ergänzt ([14], [19], [20], [5], [11]); Register zieht jetzt Quellen aller Seiten | `verify_ids2`: 10/10 `missing=[]`; `verify-farbwelten-sync` 0 Fehler; gerendert: jede zitierte Nummer als `<li id="quelle-N">` |
| **B1** Bibliografie-Format | Einzeleinträge überall; Platzhalter/Kodierung (`00A7`, `03BB`) beseitigt; [10] mit Journal+DOI | `verify-farbwelten-sync` (≥5 Einzeleinträge je Seite, [10]-DOI) |
| **B2** rot 555 nm / Purkinje | Text der geprüften Fassung übernommen | gerendert: `555 nm`, „abnehmendem Licht" |
| **B3** gelb/orange Spektralbereich + Metamerie | „physikalischer Mischbereich" ersetzt | gerendert: „Spektralbereich", „Metamer" |
| **B4** chakren 1577 | Zeile mit „Element- und Lotosfarben … keine Regenbogenfolge [1][2]" | `verify_ids`; gerendert: Text vorhanden, „ohne Farbzuordnung" nirgends |
| **B5** blau circadian | differenzierte Fassung (Dosis/Zeitpunkt) | gerendert: „circadian" |
| **B6** indigo wörtliches Zitat | H2/Absatz „Was die Studienlage nicht hergibt" | gerendert: Evidenzabsatz vorhanden, „öffnet das dritte Auge" nicht |
| **B7** Disclaimer | S16-Block je Seite genau 1×, Doppelblöcke entfernt | `verify_ids` S16exact=1 (10/10); gerendert 1× |
| **B8** falsche DOI/URL | [4] 10.1177/0956797620948810, [7] 10.3758/s13423-020-01772-1, [9] conprueba.es | gerendert: als Link-Href auf allen Farbseiten |
| **S16** Vorgabetext | wortgleich auf allen 10 Seiten, je ein Block | `verify_ids` 10/10; gerendert 1× |
| **S8** 380–750 vs 380–780 nm | beide Seiten 380–780 nm | Quelltext + gerendert |
| **N7** violett trug Indigo-Absatz | eigener Absatz, 420–450 nm entfernt | gerendert: kein „Indigo-Bereich"/420–450 |
| **N8** violett ohne Wellenlänge | 380–450 nm / 666–789 THz im Intro | gerendert: nm- und THz-Angabe |

## 6. Ausgeführte Prüfungen (echte Läufe)

| Prüfung | Ort | Ergebnis |
|---|---|---|
| `npm run data:farbwelten` | Repo | 83,4 KB, 18 Registereinträge, Abschnitte je Seite 8 |
| `node scripts/verify-farbwelten-sync.cjs` | Repo | 10 Seiten, 18 Registereinträge, **0 Fehler** (`source-data-check.json`) |
| `npm run test:farbwelten` | Repo | **10/10** grün |
| Build `node scripts/build-pages.cjs` | isolierter Prüfbaum | dist + `Lokal.html` erzeugt, Repo-`Lokal*.html` unberührt |
| `node scripts/verify-farbwelten-rendered.cjs` | dist (8124) | **10 Routen, 0 Fehler** (`rendered.json`) |
| `node scripts/verify-farbwelten.cjs` | dist (8124) | 56 Prüfungen + 6 Kopfzeilen, **alle PASS** (`browser-report-dist.md`) |
| `playwright test tests/farbwelten.spec.js` | isolierter Prüfbaum | **14/14** |
| `npm run test:pages` | isolierter Prüfbaum | **6/6** |
| `npm run test:offline` | isolierter Prüfbaum | **2/2** (file://, inkl. Kaltstart `#farbwelten/rot`) |
| `jest` | isolierter Prüfbaum | **2/2** |
| `npm run lint` / `npm run format:check` | Repo | grün, 0 Warnungen |

Browser-Ebene misst den sichtbaren Text und die gerenderten Quellen-Links; sie prüft nicht die interne Datenstruktur — dafür stehen die Node-Ebenen.

## 7. Offene Punkte

1. **Inhaltliche Freigabe fehlt.** Der zusammengeführte Stand ist noch nicht unabhängig geprüft; dafür läuft `t_d12db88e` (fact_checking). Diese Karte ist **keine** Freigabe.
2. **Farbpsychologie Indigo/Violett** (aus `466eb6c`, t_f611ba88) war nie Gegenstand einer unabhängigen Prüfung und ist im neuen Kandidaten enthalten.
3. **Quellenprüfung** wurde nicht wiederholt (OSTEBA/DOI-Volltextprüfung aus t_15d4231f); neu live geprüft sind nur [17] und [18].
4. **Lighthouse** und Performance wurden nicht erneut gemessen.
5. `Lokal*.html` im Arbeitsbaum bleiben fremd geändert; ein Neubau/Commit dieser Dateien gehört zur Tarot-V2-Linie.
6. Kein Push, kein Deployment.

## 8. Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
npm run data:farbwelten
node scripts/verify-farbwelten-sync.cjs
npm run test:farbwelten
# isolierter Bau (Beispiel; node_modules per NODE_PATH)
cp -r . /pfad/pruefbaum   # ohne .git, dist, node_modules, Lokal*.html
cd /pfad/pruefbaum && NODE_PATH=<repo>/node_modules node scripts/build-pages.cjs
# Browser-Ebene gegen den gebauten dist (Server im dist-Wurzelverzeichnis)
node scripts/verify-farbwelten-rendered.cjs http://127.0.0.1:8124/Esoterik-Welt/index.html
node scripts/verify-farbwelten.cjs http://127.0.0.1:8124/Esoterik-Welt/
```

Der Merge selbst ist als Skript dokumentiert (`merge_sources.py`, Scratch-Ablage) und in Abschnitt 3 vollständig beschrieben; die Ziel-Dateien sind bytegleich in Workspace und `content/`.
