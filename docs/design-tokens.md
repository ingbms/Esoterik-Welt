# Esoterik-Welt — Design-System Tokens

Dokumentation der CSS Custom Properties in `css/design-system.css`.
Wiederverwendbar über `:root` und `[data-theme="light"]`.

## Farbtokens (Dunkel / Mystisch)
- `--color-bg-deep` `#0a0512`
- `--color-bg-card` `#120a1f`; `--color-bg-card-hover` `#1a102d`
- `--color-primary` `#bb86fc`; `--color-primary-light` `#d4b8fc`; `--color-primary-dark` `#9a5cf5`
- `--color-secondary` `#03dac6`; `--color-secondary-dark` `#00b8a4`
- `--color-accent-gold` `#f5c542`; `--color-accent-rose` `#f57c9e`; `--color-accent-emerald` `#4ade80`
- `--color-text-primary` `#f0e6ff`; `--color-text-secondary` `#c4b5d6`; `--color-text-muted` `#7a6a94`
- Chakra-Farben: root `#e53935`, sacral `#fb8c00`, solar `#fdd835`, heart `#43a047`, throat `#1e88e5`, third-eye `#5e35b1`, crown `#8e24aa`

## Typografie
- Display: `--font-display: 'Cinzel', Georgia, serif`
- Body: `--font-body: 'Inter', system-ui, sans-serif`
- Mono: `--font-mono: 'JetBrains Mono', 'Fira Code', monospace`
- Scale: `--text-xs` … `--text-4xl` (0.7rem → 3.5rem)

## Spacing (8px-Basis)
`--space-0` … `--space-24` (0 → 6rem)

## Komponenten
Buttons (`.btn`, `.btn-primary`, `.btn-secondary`), Cards (`.card`, `.card-interactive`), Modals (`.modal-backdrop`, `.modal`), Tooltips (`.tooltip`, z-layer `--z-tooltip: 500`), Toggle (`.nav-toggle`), Dark/Light via `[data-theme="light"]`.

## Toggle
`<html data-theme="light">` oder Script-Umschalter; Tokens werden automatisch überschrieben.
