# Umsetzung Review-Runde 1 → 2 — t_3590d240 (Tarot, Nachtatelier-Deck)

Datum: 2. November 2026, 01:4x · Profil: `coding_debug` · Bezug: `docs/review-t_3590d240-round1.md`
Ergebnis: beide Befunde an der Ursache behoben, in HTTP und `file://` nachgemessen, alle Gates erneut grün.
Kein Commit, kein Push, kein Deploy.

Die Grundlage dieser Runde ist die vollständige Nachmessung, nicht die frühere Behauptung: Runde 1 hat
zu Recht beanstandet, dass §6 des Handoffs den Filterblock als „korrigiert“ ausgab, obwohl er es nicht war.
Der Satz ist in `docs/tarot-integration-t_3590d240.md` §6 richtiggestellt und in §6a durch Messwerte ersetzt.

---

## B1 — Leerraum zwischen Suche und Filter bei ≤ 480 px

**Ursache (bestätigt):** `.tarot-filter-row { flex: 1 1 360px }` (`css/main.css:496`) wirkt in der
Column-Richtung von `.tarot-controls` als **Höhe**. Die frühere Korrektur überschrieb nur die Basis des
Kindes (`.tarot-search`), nicht die der Zeile.

**Änderung** (`css/main.css`, `@media (max-width: 480px)`):

```css
.tarot-filter-row { flex: 0 0 auto; flex-direction: column; align-items: stretch; }
.tarot-search     { flex: 0 0 auto; width: 100%; }
```

**Messung nachher** (`evidence/t_3590d240-round2/probe.json`, HTTP, Viewport 812 hoch):

| Breite | `.tarot-controls` | `.tarot-search` | Abstand Feld→Select | Select-Oberkante | erste Karte | im Erstaufbau sichtbar |
|---|---|---|---|---|---|---|
| 320 | 480 → **232 px** | 298 → **50 px** | 260 → **12 px** | 859 → **611** | 993 → **745** | **ja** |
| 375 | 480 → **232 px** | 298 → **50 px** | 260 → **12 px** | 832 → **584** | 966 → **718** | **ja** |
| 414 | 480 → **232 px** | 298 → **50 px** | 260 → **12 px** | 832 → **584** | 966 → **718** | **ja** |
| 480 | 480 → **232 px** | 298 → **50 px** | 260 → **12 px** | 768 → **520** | 902 → **654** | **ja** |
| 481 | 110 px (unverändert) | 50 px | −50 px (Zeile läuft weiter) | 398 | 532 | ja |

Die Werte decken sich mit der Erwartung aus dem Review (Select ≈ 584, `.tarot-controls` ≈ 232, erste Karte
≈ y 700). Bildsicht: `gallery-top-375.png`, `gallery-top-320.png`, `gallery-controls-375.png`.
`file://` (`Lokal.html`) liefert dieselben Zahlen (`probe-file.json`: 375 → 232 px, Abstand 12 px, erste
Karte 718).

## B2 — „Vergrößern“ vergrößert bei 375 px nicht

**Ursache (bestätigt):** `.modal.is-zoomed .tarot-detail-figure { width: min(100%, calc((100vh - 230px) * 0.6)) }`.
Bei 375 px ist `100%` = 277 px kleiner als der zweite Term (349 px), `min()` ändert also nichts.

**Änderung** (`css/main.css`):

- `@media (max-width: 900px)`: Der Zoom wird eine echte Vollbildansicht. `.modal.is-zoomed` verlässt den
  Flex-Backdrop (`position: fixed; inset: 0; height: 100dvh; max-height: none; border: 0`), Kopfzeile
  bleibt als schmale Leiste mit dem 44×44-Schließen-Knopf, `.tarot-detail-text` und
  `.tarot-detail-caption` werden ausgeblendet, das Bild nutzt
  `width: min(100vw, calc((100dvh - 72px) * 0.6))` (= größtmögliche unbeschnittene 3:5-Karte).
- Über 900 px: `width: min(100%, calc((100dvh - 210px) * 0.6))` statt `(100vh - 230px)`, also der
  verfügbare Rahmen statt eines geschätzten Abzugs.
- `js/modules/tarot.js`: Neu-Rendern des Dialogs (Orientierungsumschalter) entfernt `is-zoomed`; das
  `aria-label` des Zoom-Knopfs wechselt mit dem Zustand.

**Messung nachher** (`probe.json`; „vorher“ = 600-px-Ansicht, „nachher“ = nach dem Klick):

| Viewport | Anzeige vorher | Anzeige nachher | Faktor | Text sichtbar | Panel |
|---|---|---|---|---|---|
| 320 × 568 | 220 px | **298 px** | **1,35 ×** | nein | fixed 320×568 |
| 375 × 812 | 275 px | **375 px** | **1,36 ×** | nein | fixed 375×812 |
| 414 × 896 | 314 px | **414 px** | **1,32 ×** | nein | fixed 414×896 |
| 768 × 800 | 298 px | **437 px** | **1,47 ×** | nein | fixed 768×800 |
| 1024 × 768 | 298 px | **333 px** | **1,12 ×** | ja | relative 976×720 |
| 1440 × 900 | 298 px | **412 px** | **1,38 ×** (vorher 400) | ja | relative 1080×852 |

- Das 1200er-Bitmap wird weiterhin ausschließlich durch diesen Klick geladen: **0 B** vor dem Klick,
  **317 055 B** danach (`bytes1200Before/After` je Lauf), `naturalWidth` 600 → 1200.
- `file://` (`Lokal.html`) bestätigt: 375 → 275 → **375 px (1,36 ×)**, 768 → **437 (1,47 ×)**,
  1440 → **412 (1,38 ×)**, Escape schließt jeweils (`probe-file.json`, `file-zoom-375.png`).
- Bildsicht: `zoom-375x812.png` (Karte randlos, unbeschnitten, Schließen sichtbar, Hinweis „Verkleinern“),
  `zoom-768x800.png`, `zoom-1440x900.png`.
- Tastatur (`probe-a11y.json`): Fokus bleibt im Dialog, Zyklus Schließen (44×44) ↔ Kartenfläche (375×625),
  `Shift+Tab` innerhalb, Escape schließt. Kontraste: Titel/Schließen **10,07 : 1**, Zoom-Hinweis **15,36 : 1**.

**Ehrliche Grenze:** Die Vollbildansicht ist die größte unbeschnittene 3:5-Darstellung, die der Viewport
zulässt. Auf kurzen Fenstern ist die Höhe die bindende Grenze (480 × 812 → 1,17 ×, 1024 × 768 → 1,12 ×);
dort wächst die Anzeige weniger, bleibt aber größer als vor dem Klick und ohne Beschnitt. Nach oben offen
ist sie konstruktiv nicht, ohne das Motiv zu beschneiden oder zu drehen (die Titel/Numeralien liegen als
Live-Text im Motiv, siehe §3 des Handoffs).

## Gates (alle erneut selbst gefahren, nach `npm run build`)

| Gate | Ergebnis |
|---|---|
| `npm run lint` | exit 0, 0 Warnungen |
| `npm run format:check` | alle Dateien konform |
| Jest | 2 / 2 |
| `npm run test:tarot` | 10 / 10 |
| `npm run test:pages` | 6 / 6 |
| `npm run test:offline` | 2 / 2 |
| `npm run test:local` | 12 bestanden / 0 fehlgeschlagen / 2 vorbestehende Skips |
| `npm run verify:build` | 30 Seiten/Viewports, 0 Fehler |
| `npx playwright test` | 56 / 56 |

## Unverändert / nicht angefasst

- Keine fremde Datei überschrieben: `docs/ci-cd-pipeline.md` und `js/modules/_tarot_old.js` bleiben
  byte-gleich (siehe Handoff §8).
- Kein Commit, kein Push, kein Deploy; keine Druckfreigabe.
- Deck, Assets, Manifest, Inhalte und Deck-Registry sind in dieser Runde unverändert.

## Reproduktion

```bash
npm run build
node evidence/t_3590d240-round2/probe.cjs       # HTTP: Layout 320–481 px + Zoom 320–1440 px
node evidence/t_3590d240-round2/probe-file.cjs  # file://: Lokal.html
node evidence/t_3590d240-round2/probe-a11y.cjs  # Fokusfalle + Kontraste im Vollbild
```
