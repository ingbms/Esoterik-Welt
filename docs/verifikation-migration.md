# Verifikation der Astro-Migration

Automatisch erzeugt von `scripts/verify-migration.cjs` gegen `dist/`.
Nicht von Hand bearbeiten — Skript erneut ausführen.

- Basis-Commit: siehe `git log -1`
- Geprüfte HTML-Dateien: 145
- Befunde: 0

## 1. Routenabdeckung (Altlink-Map → Build)

| Gegenstand | Erwartet | Gebaut | Status |
|---|---|---|---|
| Altadressen gesamt | 0 | alle auflösbar |
| Kapitelanker geprüft | 0 | alle vorhanden |
| HTML-Dateien im Build | 145 |  |

## 2. Mengenparität (Datenmodule → Build)

| Gegenstand | Erwartet | Gebaut | Status |
|---|---|---|---|
| Zeichen (12 + Index) | 13 | 13 | ok |
| Faktoren (10 + Index) | 11 | 11 | ok |
| Häuser (12 + Index) | 13 | 13 | ok |
| Aspekte (5 + Index) | 6 | 6 | ok |
| Grundlagen (24 + Index) | 25 | 25 | ok |
| Lehrbeispiele (4 + Index) | 5 | 5 | ok |
| Lernpfad (6 + Index) | 7 | 7 | ok |
| Farbwelten (18 Collection + 3 Werkzeuge) | 21 | 21 | ok |
| Artikel | 11 | 11 | ok |
| Radiästhesie-Dokumente | 7 | 7 | ok |
| Frequenzen (5) | 5 | 5 | ok |
| Pendeln-Werkzeuge (5) | 5 | 5 | ok |
| Kristalle (Datenbestand) | 30 | 30 | ok |
| Frequenzeinträge (Datenbestand) | 41 | 41 | ok |

## 3. SEO-Parität der zwölf Dokumente

| Gegenstand | Erwartet | Gebaut | Status |
|---|---|---|---|
| index.html | Titel | gleich |  |
| index.html | Description | gleich |  |
| index.html | Canonical | gleich |  |
| 404.html | Titel | gleich |  |
| 404.html | Description | gleich |  |
| 404.html | Canonical | gleich |  |
| impressum.html | Titel | gleich |  |
| impressum.html | Description | gleich |  |
| impressum.html | Canonical | gleich |  |
| datenschutz.html | Titel | gleich |  |
| datenschutz.html | Description | gleich |  |
| datenschutz.html | Canonical | gleich |  |
| haftung.html | Titel | gleich |  |
| haftung.html | Description | gleich |  |
| haftung.html | Canonical | gleich |  |
| radiasthesie/index.html | Titel | gleich |  |
| radiasthesie/index.html | Description | gleich |  |
| radiasthesie/index.html | Canonical | gleich |  |
| radiasthesie/radiasthesie.html | Titel | gleich |  |
| radiasthesie/radiasthesie.html | Description | gleich |  |
| radiasthesie/radiasthesie.html | Canonical | gleich |  |
| radiasthesie/pendeln.html | Titel | gleich |  |
| radiasthesie/pendeln.html | Description | gleich |  |
| radiasthesie/pendeln.html | Canonical | gleich |  |
| radiasthesie/orakel.html | Titel | gleich |  |
| radiasthesie/orakel.html | Description | gleich |  |
| radiasthesie/orakel.html | Canonical | gleich |  |
| radiasthesie/glossar.html | Titel | gleich |  |
| radiasthesie/glossar.html | Description | gleich |  |
| radiasthesie/glossar.html | Canonical | gleich |  |
| radiasthesie/quellen.html | Titel | gleich |  |
| radiasthesie/quellen.html | Description | gleich |  |
| radiasthesie/quellen.html | Canonical | gleich |  |
| radiasthesie/methodik.html | Titel | gleich |  |
| radiasthesie/methodik.html | Description | gleich |  |
| radiasthesie/methodik.html | Canonical | gleich |  |

## 4. Link-Check

| Gegenstand | Erwartet | Gebaut | Status |
|---|---|---|---|
| geprüfte interne Verweise | 6688 |  |
| externe Verweise (nicht geprüft) | 431 |  |
| Fragment-/mailto-/data-Verweise | 238 |  |
| tote interne Ziele | 0 | keine |

## 5. Sitemap und robots

| Gegenstand | Erwartet | Gebaut | Status |
|---|---|---|---|
| `<loc>`-Einträge | 143 | alle auflösbar |
| Sitemap-Datei | dist/sitemap-0.xml | index vorhanden |

## 5b. Kopfprüfung aller Seiten

| Gegenstand | Erwartet | Gebaut | Status |
|---|---|---|---|
| Seiten ohne <title> | 0 | keine |
| Seiten ohne Description | 0 | keine |
| Seiten ohne Canonical (außer 404) | 0 | keine |

## Hinweise

- Altlink-Map: 0 Adressen, 0 davon mit Anker.
- Vergleich normalisiert Marke (Esoterik-Welt → VELARKANA) und Origin (https://ingbms.github.io/Esoterik-Welt/ → https://velarkana.de/): der Domainwechsel ist Entscheidung E5/F1, keine Textänderung.

## Befunde

Keine. Alle geprüften Kriterien sind erfüllt.
