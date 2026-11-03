# RAD-13 — Korrektur der Befunde F1 und F2

Bezug: unabhängige Abnahme ESOW-RAD-13 (Karte t_29535d62, Commit 9bf5f73),
Bericht `TESTBERICHT.md`, Evidenz `evidence/a11y-probe.json` und
`evidence/browser-routes.json`. Bearbeitet in Karte t_b1641fc1.

Grundlage: `feature/radiasthesie-modul` (Ausgangsstand 5fe5301). Kein Push.

## F1 — Links im Fließtext nur farblich unterschieden (WCAG 1.4.1, P2)

**Ursache.** Die Modul- und Dokument-Stylesheets gaben Links im Fließtext nur
`color: var(--color-primary)` (#c6b38e) ohne Unterstreichung. Gegenüber dem
umgebenden Sekundärtext (#babdb7) ergibt das 1,07:1 statt der geforderten 3:1.
Betroffen waren fünf Kontexte, nicht nur die im Bericht genannten Beispiele.

**Korrektur.** Additive Regel in `css/radiasthesie.css` (wird von der
Einzeldokument-Anwendung *und* von den statischen Dokumenten geladen):

```css
.astro-source-meta a,
.rad-photo-credit a,
.astro-text a:not(.btn):not(.textlink),
.astro-panel-note a,
.rad-media-credits a {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
```

Dazu in `css/radiasthesie-statisch.css` dieselbe Kennzeichnung für die
Absätze ohne `.astro-text`-Klasse und für die Fußzeile
(`.rad-static-main p a:not(.btn):not(.textlink)`, `.rad-static-footer a`).
Bedienflächen mit eigener Form (`.btn`, `.textlink`, `.rad-status-link` mit
Unterkante) bleiben unverändert.

**Nachweis (axe-core 4.14.0, Regelsatz wcag2a/2aa/21a/21aa/22aa/best-practice,
Breiten 1440 und 375, 16 Ansichten = die 12 aus `qa-rad13/rad13-a11y.mjs`
plus die vier weiteren statischen Dokumente):**

| Stand | Ansichten × Breiten | `link-in-text-block`-Knoten | übrige Verstöße |
| --- | --- | --- | --- |
| vorher | 16 × 2 | 144 (72 je Breite) | 0 |
| nachher | 16 × 2 | 0 | 0 |

Der frühere Lauf meldete 51 Knoten, weil er je Ansicht nur vier Knoten
ausgab und nur zwölf Ansichten prüfte; vollständig ausgezählt sind es 144.

## F2 — Foto-Varianten über deklarierter Breite skaliert (P3)

**Ursache 1 (Größenangabe).** `photoFigure()` deklarierte
`sizes="(max-width: 640px) 100vw, 520px"`. Gemessen ist der Foto-Slot
`.rad-plate--photo` 680 CSS px breit ab 768 px Viewport, darunter
`100vw − 48px` (320 → 272, 375 → 327, 640 → 592). Der Browser wählte deshalb
die 520er-Datei und skalierte sie 1,31-fach hoch.

**Ursache 2 (fehlende Variante).** Das Motiv `rad-media-03`
(Radiästhesierute, Original 566 px) hat nur eine 520er-Variante. Eine
`1040`er-Datei gibt es nicht, weil die Quelle schmaler ist. Mit korrigierter
`sizes`-Angabe allein bliebe dieses eine Foto weiterhin hochskaliert.

**Korrektur.** `js/modules/radiasthesie-views.js`:

- `sizes="(max-width: 728px) calc(100vw - 48px), 680px"` (gemessene Slotbreite),
- Ermittlung der größten verfügbaren Variante aus den `w`-Deskriptoren; liegt
  sie unter 680 px, setzt die Figur `style="--rad-photo-max:<breite>px"`,
- `css/radiasthesie.css` nutzt `max-width: var(--rad-photo-max, 680px)`
  sowohl in `.rad .astro-main .rad-plate` (dort hatte die spezifischere Regel
  die Begrenzung zuvor überstimmt) als auch in `.rad-plate--photo`.

Damit wird kein Foto mehr über seine Quelldaten hinaus skaliert; die übrigen
fünf Motive nutzen ihre 1040er-Variante. Die statischen Dokumente unter
`radiasthesie/` sind mit `npm run build` neu erzeugt.

**Nachweis (Chromium, devicePixelRatio 1, alle Lazy-Bilder vor der Messung
geladen; echte Pixelbreite der geladenen Datei gegen die dargestellte
CSS-Breite, nicht die density-normierte `naturalWidth`-Angabe):**

| Stand | Messungen | hochskaliert (> 1,02) | schlimmster Fall |
| --- | --- | --- | --- |
| vorher | 6 Routen × 4 Breiten (320/375/768/1440) | 24 | 680 px Slot, 520-px-Datei → 1,31 |
| nachher | 6 Routen × 8 Breiten (320/375/414/640/768/900/1024/1440) | 0 | – |

Zusätzlich mit dem Filter aus `rad13-browser-routes.mjs` (`nw + 8 < dw`,
20 Routen × 4 Breiten, Lazy-Bilder geladen): vorher 24 Befunde, nachher 0.
Die frühere Zählung von 12 erklärt sich daraus, dass je Messlauf zwei Bilder
noch nicht geladen waren und damit übersprungen wurden.

Grenze: `rad-media-03` wird jetzt mit 520 CSS px dargestellt (vorher 680 px).
Ohne ein größeres Quellbild ist das die einzige Variante ohne Hochskalierung;
ein 680-px-Slot wäre für dieses Motiv nur mit einer künstlich vergrößerten
Datei zu füllen.

## Regressionstests

Zwei neue Prüfungen, die auf dem Ausgangsstand fehlschlagen (geprüft durch
zeitweises Zurücksetzen der `sizes`-Angabe, Fehlermeldung
„sizes passt nicht zur gemessenen Slotbreite“ bzw. „alte Slotbreite“):

- `tests/radiasthesie.mjs`: Foto-Slot deklariert die gemessene Layoutbreite
  und begrenzt Motive ohne große Variante auf ihre Quellbreite.
- `tests/radiasthesie-statisch.mjs`: erzeugte Dokumente tragen die gemessene
  Slotbreite; die Unterstreichungsregeln für F1 stehen in beiden Stylesheets.

## Prüfungen

- `npm run test:all`: alle Node-Suiten grün (u. a. Radiästhesie 25, statisch 14).
- `CI=1 npx playwright test`: 147/147 in 2,1 min (auf freiem Port 3899, weil
  auf Port 3100 ein fremder Server lauschte — Testumgebung, nicht der Code).
- `npm run lint`, `npm run format:check`: grün.
- `npm run build`: 7 Dokumente, Sitemap 11 Einträge, `dist/` erzeugt.

Nachprüfung auf dem Commit (Messskripte aus `evidence-fixes/` gegen den
erzeugten Stand): axe 0 Verstöße, Bildfilter 0 Befunde (20 Routen ×
320/375/768/1440), echte Pixelbreite 0 Hochskalierungen.


## Evidenz

`docs/radiasthesie-completion/RAD-13/evidence-fixes/`:

| Datei | Inhalt |
| --- | --- |
| `axe-vorher.json` | 144 `link-in-text-block`-Knoten mit Zielselektor und Kontrastangabe |
| `axe-nachher.json` | 0 Verstöße, 16 Ansichten × 1440/375 |
| `bildmessung-vorher.json` | 24 Untergrößen-Befunde (Filter `nw + 8 < dw`) |
| `bildmessung-nachher.json` | 0 Befunde, 20 Routen × 320/375/768/1440 |
| `pixelmessung-zwischenstand.json` | 10 Hochskalierungen nach der `sizes`-Korrektur, aber vor der Spezifitätskorrektur — Beleg, warum `--rad-photo-max` auch in `.rad .astro-main .rad-plate` greifen muss |
| `pixelmessung-nachher.json` | echte Pixelbreite gegen CSS-Breite, 0 Hochskalierungen |
| `playwright-147.txt`, `node-suiten.txt` | Testläufe |
| `probe-*.mjs` | Messskripte (Nachbau; Pfad `ROOT` oben in der Datei anpassen) |

