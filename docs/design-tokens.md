# Esoterik-Welt — Design-System Tokens (Nachtatelier)

Dokumentation der CSS Custom Properties in `css/design-system.css`.

**Normative Quelle** für Palette, Typografie und Raster ist das menschlich
genehmigte Paket `docs/art-direction-nachtatelier/` (`STYLEGUIDE.md`,
`DESIGN.md`, `tokens.json`). Diese Datei beschreibt die tatsächliche
Implementierung; bei Abweichungen gilt das Paket, nicht dieses Dokument.

**Abgleich (geprüft, nicht behauptet):** `node evidence/t_280f3753/token-parity.cjs`
vergleicht die acht normativen Farben, vier Typografiestufen, vier
Abstandswerte und zwei Radien zwischen `tokens.json`, dem JSON-Frontmatter von
`DESIGN.md` und `css/design-system.css`. Letzter Lauf:
`evidence/t_280f3753/token-parity.json` → `allMatch: true`.

Wiederverwendbar über `:root`. Zusätzlich existiert ein reservierter
V1-Light-Block (`[data-theme="light"]`), den keine Seite setzt — siehe
„Light-Reserve“ unten.

## Farbtokens (Basalt / Kreide / Sand)

| Token | Wert | Rolle |
| --- | --- | --- |
| `--color-bg-deep` | `#0b1012` | Hintergrund, gesamter Nacht-Raum |
| `--color-bg-card` | `#141c1f` | Oberfläche, zweite Ebene, astronomische Tafel |
| `--color-text-primary` | `#eae6dc` | Titel und Haupttext |
| `--color-text-secondary` | `#babdb7` | Legenden, Beschreibungen, Sekundärtext |
| `--color-primary` | `#c6b38e` | Sand: Hauptaktion, ein kursives Titelwort |
| `--color-hover` | `#d5c4a2` | aktivierte Hauptaktion |
| `--color-border` | `#3c484b` | dekorative 1px-Trenner (kein Bedienelement) |
| `--color-line-strong` | `#82928e` | funktionale Linien, Rahmen, Fokus-Orientierung |

Abgeleitete bzw. semantische Tokens (kein zusätzlicher Farbakzent):

- `--color-bg-card-hover` `#1a2427` — eine Stufe hellere Fläche für Hover/Skeletons.
- `--color-accent-emerald` `#9db3a4` — Signal „Aufrecht“;
  `--color-accent-rose` `#c09489` — Signal „Verkehrt“/destruktiv. Beide nur als
  Text-/Rahmenfarbe, low-chroma, geprüft (6.45:1 bzw. 7.75:1 auf `--color-bg-card`).
- Chakra-Farben (`--color-chakra-*`, root `#e53935`, sacral `#fb8c00`, solar
  `#fdd835`, heart `#43a047`, throat `#1e88e5`, third-eye `#5e35b1`, crown
  `#8e24aa`) sind **Inhaltsdaten** der Mineral-Zuordnung, keine UI-Akzente. Die
  UI färbt Chakra-Badges neutral (`--color-line-strong`).
- Legacy-Aliase (`--color-primary-light`, `--color-primary-dark`,
  `--color-secondary`, `--color-text-muted`, `--color-border-glow`,
  `--surface-ghost`, `--shadow-glow`, …) bleiben definiert, weil `js/modules/`
  Inline-Styles über diese Namen setzt. Sie zeigen auf die Werte oben; es gibt
  keine zweite Palette.

Kontrast (gemessen, `evidence/t_280f3753/contrast.json`): Text 15.36:1,
Sekundärtext 10.07:1, Sandtext 9.33:1, Buttonlabel 9.33:1, funktionale Linie
5.88:1. Dekorative Linie 2.02:1 — laut `STYLEGUIDE.md` §2 ausdrücklich kein
kontrasttragendes Bedienelement.

## Typografie

- Display: `--font-display: 'Fraunces', Georgia, 'Times New Roman', serif`
  (lokale variable TTF, inkl. echter Kursivdatei; `font-synthesis: none`).
- Body: `--font-body: 'Manrope', -apple-system, …`
- Mono: `--font-mono` (System-Monospace, nur Formelanzeige).
- Skala: `--text-xs 13px` · `--text-sm 14px` · `--text-base 16px` · `--text-lg 18px`
  · `--text-xl 20px` · `--text-2xl 28px` · `--text-3xl 34px` · `--text-4xl 44px`.
- H1 (Hero): `--text-h1` 80px / 66px ≤1100px / 52px ≤700px / 46px ≤360px,
  `line-height 1.02`, `letter-spacing -0.03em`.
- Dokumenttitel (Modul-, Rechts- und Fehlerseite): `--text-page-title` 56px,
  ≤700px 34px; `.page-title`, `.legal-content h1` und `.error-card h1` teilen
  diese Stufe.
- Fließtext max. 62–68 Zeichen (`hero-intro`, `.cosmos-text`, `.legal-prose`,
  `.article-prose`); gemessen 31–46 Zeichen in der Hero-Spalte, 56 im
  Kosmos-/Rechtstext.

## Spacing und Form

- 4px-Raster: `--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 ·
  `--space-5` 20 · `--space-6` 24 · `--space-8` 32 · `--space-10` 40 ·
  `--space-12` 48 · `--space-16` 64 · `--space-20` 80 · `--space-24` 96.
- Sektionen 64px, ≤700px 48px; Header 100px, ≤700px 84px.
- Satzspiegel `--container-max: 1360px` plus `--gutter` 64px / 32px ≤1100 /
  24px ≤700.
- Radien: `--radius-sm 2px` (Buttons, Cards, Badges), `--radius-xl 4px`
  (`rounded.md`). Keine Pillen: `--radius-full` ist bewusst 2px.
- Keine UI-Schatten: alle `--shadow-*` sind `none`. Materialtiefe entsteht im
  Foto, nicht im CSS.
- Fokus: `2px solid var(--color-primary)`, Offset 4px (Formfelder 2px), nie nur
  ein Farbwechsel.

## Font- und Bildstrategie

- Schriften und Fotos werden **lokal** ausgeliefert (`assets/fonts`,
  `assets/mineral`, `assets/cosmos`). Es werden keine Font-/Bilddienste Dritter
  eingebunden; die früheren Google-Font-Links sind entfernt.
- Die Offline-Dateiausgabe inlined das CSS und behält die relativen
  `assets/fonts/*.ttf`-URLs bei (in der Datei um `../` bereinigt). Schriftladen
  über `file://` ist in `tests/offline-file.cjs` real geprüft.
- Kristall-Emoji sind weiterhin Browser-Glyphen als Platzhalter (N3), jetzt
  entsättigt und klein (`.crystal-glyph`), im Detaildialog mit dem Hinweis
  „Platzhalter-Symbol · kein Foto im Projekt“. Tarot- und Runentafeln bleiben
  Symbol-Platzhalter; echte Tarotbilder kommen erst mit der Deckkarte
  (`t_3590d240`) und werden hier nicht vorgetäuscht.

## Komponenten

Buttons (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`), Cards
(`.card`, `.card-interactive`), Modals (`.modal-backdrop`, `.modal`), Tooltips
(`.tooltip`, `--z-tooltip: 500`), Toggle (`.nav-toggle`), Pfad-Register
(`.feature-card`) und Kosmostafel (`.cosmos`, `img.chart`). Es gibt
ausschließlich den dunklen Nutzerzustand.

## Light-Reserve (V1-Studie, bewusst nicht erreichbar)

`[data-theme="light"]` bleibt als **unveränderte V1-Token-Skizze** im
Stylesheet, ist aber **kein Nutzerzustand**: kein HTML/JS setzt `data-theme`, es
gibt keinen Umschalter, keine Speicherung und keine `prefers-color-scheme`-Regel.
Die Werte wurden bei der Nachtatelier-Migration absichtlich nicht angepasst und
sind weder kontrastgeprüft noch als Freigabe zu behandeln; jede Aussage über
„Light-Kontrast“ im Betrieb wäre falsch. Ein tatsächliches Theme-Feature wäre
eine eigene, hier nicht beauftragte Änderung (UI, Persistenz, Kontrastprüfung).
