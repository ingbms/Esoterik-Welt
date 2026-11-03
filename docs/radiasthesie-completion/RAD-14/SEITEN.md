# Übersicht der Seiten

**Stand:** Commit `5fe5301` · Zahlen aus dem erzeugten Stand (`npm run build` in dieser Sitzung)

Das Modul hat **zwei Ausgabeformen**: sieben statische HTML-Dokumente (ohne
JavaScript lesbar, indexierbar) und dreizehn Modulrouten im Hash-Router der
Gesamtseite (dazu die Fehleransicht). Beide speisen sich aus derselben Datei
`js/data/radiasthesie.js`.

## 1. Statische Dokumente

Erzeugt von `scripts/generate-radiasthesie-pages.cjs` aus den Renderfunktionen
der Modulansicht; versioniert unter `radiasthesie/`, weil GitHub Pages das
Wurzelverzeichnis veröffentlicht.

| Adresse | Datei | Bytes | `<title>` | `<h2>` | Kanonisch |
| --- | --- | --- | --- | --- | --- |
| `radiasthesie/` | `radiasthesie/index.html` | 21 838 | Radiästhesie, Pendeln und Orakel — Tradition und Prüfstand | 6 | `…/radiasthesie/` |
| `radiasthesie/radiasthesie.html` | dito | 79 341 | Radiästhesie — Ruten, Geschichte und Forschungsstand | 13 | `…/radiasthesie/radiasthesie.html` |
| `radiasthesie/pendeln.html` | dito | 55 216 | Pendeln — Arten, Materialien, Tafeln und Bovis-Skalen | 13 | `…/pendeln.html` |
| `radiasthesie/orakel.html` | dito | 37 302 | Orakel — Pendelorakel, Tarot, Runen und I Ging im Vergleich | 15 | `…/orakel.html` |
| `radiasthesie/glossar.html` | dito | 20 834 | Glossar — Radiästhesie, Pendeln und Orakel von A bis Z | 10 | `…/glossar.html` |
| `radiasthesie/quellen.html` | dito | 61 796 | Quellen und Belege — Radiästhesie und Pendeln | 3 | `…/quellen.html` |
| `radiasthesie/methodik.html` | dito | 18 549 | Methodik und Grenzen — wie dieser Bereich prüft | 8 | `…/methodik.html` |

Eigenschaften dieser Dokumente:

- vollständig ohne JavaScript lesbar; die vier Werkzeuge sind hier bewusst **nicht** enthalten (sie brauchen JavaScript),
- je ein `<h1>`, keine Überschriftensprünge (RAD-12-Nachbesserung `9bf5f73`),
- `meta description` 102–149 Zeichen, Titel 45–59 Zeichen (Generatorausgabe),
- BreadcrumbList als JSON-LD, Canonical ohne Fragment,
- Verweis auf `css/radiasthesie-statisch.css`, keine Modul-Skripte.

Die Sitemap (`sitemap.xml`) enthält **11 Einträge**: Startseite, drei Rechtsseiten
und die sieben Radiästhesie-Dokumente. Fragmente (`#…`) kommen nicht vor.

## 2. Modulrouten im Hash-Router

Alle Routen liegen unter `#pendeln` und werden von `js/modules/radiasthesie-model.js`
aufgelöst. `#pendeln` ist die Startseite des Moduls; die Werkzeuge haben bewusst
**keinen** Query-Zustand, damit eine Adresse keinen Versuch, keine Tafel und
keinen fremden Tagebucheintrag vortäuschen kann.

| Route | Ansicht | Inhalt | Ohne JavaScript |
| --- | --- | --- | --- |
| `#pendeln` | `landing` | Modul-Startseite: drei Themen, Kennzeichnung A–E, Werkstatt (4 Karten), bewusste Lücken | statisches Pendant `radiasthesie/` |
| `#pendeln/radiasthesie` | `topic` | Themenseite Radiästhesie, 10 Kapitel | `radiasthesie/radiasthesie.html` |
| `#pendeln/pendeln` | `topic` | Themenseite Pendeln, 10 Kapitel | `radiasthesie/pendeln.html` |
| `#pendeln/orakel` | `topic` | Themenseite Orakel, 12 Kapitel | `radiasthesie/orakel.html` |
| `#pendeln/<thema>/<anker>` | `topic` | Kapitel-Deep-Link, z. B. `#pendeln/pendeln/tafeln` | Anker im jeweiligen Dokument |
| `#pendeln/glossar?b=<Buchstabe>` | `glossar` | 17 Begriffe, Buchstabenfilter | `radiasthesie/glossar.html` |
| `#pendeln/quellen` · `#pendeln/quellen/<Qxx>` | `quellen` | 66 Quellen, Filter, Einzelquelle fokussierbar | `radiasthesie/quellen.html` |
| `#pendeln/suche?q=<Text>` | `suche` | Volltextsuche über Themen, Kapitel, Glossar, Quellen | – (nur interaktiv) |
| `#pendeln/methodik` | `methodik` | Prüfregeln, Kennzeichnung, Bildnachweise, Datenschutz | `radiasthesie/methodik.html` |
| `#pendeln/labor` | `labor` | Pendellabor (RAD-07) | – |
| `#pendeln/studio` | `studio` | Pendeltafel-Studio (RAD-08) | – |
| `#pendeln/experiment` | `experiment` | Experimentierlabor (RAD-09) | – |
| `#pendeln/journal` | `journal` | Pendeltagebuch (RAD-10) | – |
| sonst | `notfound` | „Die Inhalte konnten nicht geladen werden.“ mit Rückweg | – |

Die Suche ist bewusst nicht statisch: Sie filtert im Browser und hat keine
eigene Adresse in der Sitemap.

## 3. Inhalt der drei Themenseiten

Wortzahlen aus `wordCount` des Datenmoduls, Kapitel-IDs aus der Redaktionsquelle.

| Thema | Kapitel | Wörter | Kapitel-IDs |
| --- | --- | --- | --- |
| Radiästhesie | 10 | 3 134 | `was`, `geschichte-1`, `geschichte-2`, `geschichte-3`, `instrumente`, `erdstrahlen`, `geologie`, `bovis`, `frequenz`, `befunde` |
| Pendeln | 10 | 2 170 | `was`, `geschichte`, `arten`, `lernen`, `tafeln`, `biotensor`, `karten`, `mechanismen`, `forschung`, `labor` |
| Orakel | 12 | 1 042 | `divination`, `tarot-1`, `tarot-2`, `tarot-3`, `iging`, `iging-west`, `runen`, `runen-20`, `orakelkarten`, `delphi`, `delphi-ethylen`, `forer` |
| **Summe** | **32** | **6 346** | |

Jede Themenseite trägt zwei Fotos (RAD-06), eine Kennzeichnung A–E je Kapitel und
einen Abschluss mit „Weiterlesen“ aus der Vernetzungs-Registry.

Das Orakel-Cluster ist mit rund 1 042 Wörtern deutlich dünner als Radiästhesie
(3 134). Das ist im Einstiegstext benannt und in `GRENZEN.md` §4 geführt — keine
Kosmetik, sondern eine offene Redaktionslücke.

## 4. Kleinere Bausteine

- **Glossar:** 17 Begriffe in 9 Buchstabengruppen (`B`, `D`, `E`, `F`, `I`, `O`, `P`, `R`, `T`), je mit Stufe und Quellenverweis.
- **Quellen:** 66 Einträge mit Typ, Jahr, Prüftiefe, Interessenvermerk und Verweis auf die Seiten, die sie belegen.
- **Werkstatt:** vier Karten auf der Startseite, alle „Verfügbar“ und verlinkt:
  Pendellabor (`#pendeln/labor`), Pendeltafel-Studio (`#pendeln/studio`),
  Experimentierlabor (`#pendeln/experiment`), Pendeltagebuch (`#pendeln/journal`).
- **Vernetzung:** neun Einträge — sieben mit funktionierendem Link
  (Frequenzkapitel, Chakren, Tarot, Runen, I Ging, Astrologie, historische
  Orakelorte), zwei als benannte Lücke ohne Link (Geomantie, Kraftorte).
- **Rechtsseiten:** `impressum.html`, `datenschutz.html`, `haftung.html` bleiben
  unverändert; sie sind **nicht** Teil dieses Moduls (siehe `GRENZEN.md` §5).
