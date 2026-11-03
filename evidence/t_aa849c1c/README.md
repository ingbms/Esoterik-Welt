# Nachweise P9/P10 — Chladni-Muster und Meditationssitzungen

Ticket: `t_aa849c1c` · Branch `feature/frequenzlabor-p9-p10` · Basis `71b895c`

## Reproduktion

```bash
npm ci
npm run build
PORT=3902 node index.js &          # Vorschau unter http://127.0.0.1:3902/Esoterik-Welt/
BASE_URL=http://127.0.0.1:3902/Esoterik-Welt node evidence/t_aa849c1c/measure-p9-p10.cjs
npm run test:frequenz              # 51 Vertragstests (inkl. C1–C8, M1–M9)
E2E_PORT=3904 CI=1 npx playwright test tests/frequenzlabor-p9-p10.spec.js
npm run check:frequenz-budget
```

## Inhalt

| Datei | Aussage |
| --- | --- |
| `measurements.json` | axe-core-Ergebnis je Ansicht, Kontrastmessungen, Canvas-Messwerte vor/nach Moduswechsel, Touch-Ziele, Modul-Requests, 360-px-Überlauf |
| `p9-cymatics-desktop.png`, `p9-cymatics-mobile.png` | Ansicht bei 1440 × 1000 (ganze Seite) und 360 × 760 |
| `p10-meditation-desktop.png`, `p10-meditation-mobile.png` | Ansicht bei 1440 × 1000 (ganze Seite) und 360 × 760 |
| `measure-p9-p10.cjs` | Messskript (liest DOM, Canvas und Netzwerk; steuert nichts) |

## Ergebnisse (Lauf vom 2026-11-03, Chromium, lokaler Build)

- **axe-core, WCAG 2.0/2.1 A + AA:** 0 Verstöße auf `#frequenzen` in beiden Ansichten, auch `color-contrast`.
- **Kontrast:** kleinster gemessener Wert 9,09 : 1 (`#fqCyTextA`, `.fq-figcaption`, `.fq-figure-title`, `#fqMedPresetNote`), größter 15,36 : 1 (`#fqCyTitle`, `#fqMedTitle`). Gefordert sind 4,5 : 1 (bzw. 3 : 1 für große Schrift).
- **Canvas:** Knotenlinien messbar vorhanden (1.942 helle Pixel bei Modus n=2, m=3); nach Wechsel auf n=4,m=3 ändert sich das Bild (2.788 helle Pixel, andere Summe).
- **Touch-Ziele:** Start/Beenden 48 px, Auswahlfelder 50 px, „Einstellungen speichern“ 44 px (bei 360 px Breite).
- **360 px:** `scrollWidth === innerWidth` (360) in beiden Ansichten — kein horizontaler Überlauf.
- **Lazy Loading:** Beim direkten Aufruf von `#frequenzen/meditation` werden nur die Module der Kategorie plus `frequenz-meditation-view.js` und `frequenz-meditation-model.js` geladen; `frequenz-cymatics-view.js` und `frequenz-chladni.js` erscheinen nicht. Umgekehrt lädt `#frequenzen/cymatics` die Meditationsmodule nicht (E2E C6/M5 prüft zusätzlich den Fall „Flag aus“: dann entsteht gar kein Request).
- **Konsole:** keine Fehler oder Warnungen auf beiden Ansichten.

Die Testläufe selbst (51 Unit-Tests, 15 Browserfälle der Folgestufe, 104 Fälle der vollen Browser-Suite) sind in [`docs/frequenzlabor-p9-p10.md`](../../docs/frequenzlabor-p9-p10.md) tabelliert; die Ausgaben entstehen reproduzierbar mit den Befehlen oben.
