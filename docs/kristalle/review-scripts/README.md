# Review-Skripte zu `REVIEW-t_385afa1e.md`

Unabhängige Prüfskripte dieser Review (nicht identisch mit `docs/kristalle/scripts/` des Implementierers).

| Skript | Zweck | Abhängigkeiten |
|---|---|---|
| `commons_verify.py` | 30 Dateien gegen Wikimedia-Commons-`extmetadata` (Lizenz, Lizenz-URL, Artist, AttributionRequired, Restrictions, sha1) | Python-Stdlib, Netz |
| `provenance_check.py` | alle 30 Recherche-Renditionen erneut laden, SHA-256/Bytes/Maße gegen `image-sources.json` prüfen; Lizenz- und Quell-URLs per HEAD | Python-Stdlib, Pillow, Netz |
| `integrity.py` | alle 120 ausgelieferten WebP: Bytes + SHA-256 gegen Manifest; `data/crystals.json` vs Manifest | Python-Stdlib |
| `image_geometry.py` | 1:1-Maße, Eck-/Randpixel gegen `#0b1012`, Inhaltsfläche vs Quell-Seitenverhältnis (Verzerrungs-/Beschnittprüfung) | Pillow, NumPy |
| `verify-browser.cjs` | 10 Viewports, Nachweis-Sichtbarkeit/-Beschnitt, Textgleichheit mit `data/crystals.json`, srcset/sizes, Überlauf, Konsole/Netzwerk, Tastatur/Dialog/Liste | Node, Playwright (`node_modules` des Projekts) |
| `verify-dialog-impressum.cjs` | Dialog 360/390/768/1440 (Beschnitt, Scroll, CLS), BY-SA-Nachweise, Impressum | Node, Playwright |
| `verify-impressum.cjs` | Impressum: 30 Einträge, Linkabgleich gegen Manifest | Node, Playwright |

Messergebnisse des Laufs liegen als JSON daneben (`commons_verify.json`, `provenance.json`,
`browser-report.json`, `dialog-impressum-report.json`, `impressum-report.json`).

Die Skripte enthalten absolute Pfade des Prüflaufs (`C:/Users/mas/Arbeit/Esoterik-Welt`,
Scratch-Verzeichnis des Reviewer-Profils) — für einen erneuten Lauf ggf. oben im Skript anpassen.
Der Browser-Teil erwartet den Build unter `http://127.0.0.1:8188/Esoterik-Welt/`:

```bash
npm run build
python -m http.server 8188 --bind 127.0.0.1 --directory dist
node docs/kristalle/review-scripts/verify-browser.cjs
```

Screenshots der Sichtprüfung: als Task-Attachments von `t_385afa1e` abgelegt.
