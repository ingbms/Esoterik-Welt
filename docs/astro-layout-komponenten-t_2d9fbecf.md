# Layout und UI-Komponenten in Astro (t_2d9fbecf)

Stand: 04.11.2026 · Branch `wt/t_2d9fbecf` · Basis `5d9c554` (Astro-Gerüst) +
`682f560` (Migrationsplan) · kein Push.

## Ziel und Ergebnis

Das Grundgerüst der Website — Kopfzeile, Hauptnavigation, Fußzeile,
Seiten-Layout und die wiederverwendbaren Bausteine — steht als
Astro/TypeScript-Portierung und rendert im Dev-Server wie im Build. Die
Gestaltung stammt zeilengenau aus dem Bestand: `css/design-system.css` und die
Shell-Abschnitte von `css/main.css` werden nicht nachgebaut, sondern in
`src/styles/` übernommen. Damit ist der Side-by-Side-Vergleich kein
Geschmacksurteil, sondern ein Messvorgang (siehe „Verifikation“).

## Dateien

| Pfad | Inhalt |
| --- | --- |
| `src/layouts/BaseLayout.astro` | `<head>` (Titel/Description als Props, Canonical, OpenGraph, Twitter-Card, Schrift-Preloads), Skip-Link, Kopfzeile, `main#main`, Fußzeile, Slot |
| `src/components/SiteHeader.astro` | Kopfzeile in zwei Varianten (`primary` mit zehn Navigationszielen, Burger, Favoritenzähler; `minimal` mit Rückweg) inkl. gebündeltem Verhalten (Menü, `scrolled`, Escape, Zähler) |
| `src/components/SiteFooter.astro` | Fußzeile `full` (Marke + drei Spalten) und `compact` (Pflichtlinks der Rechtsseiten) |
| `src/components/Hero.astro` | Hero-Band im 5:7-Raster, ein betontes Titelwort als eigenes Prop, Materialfotografie mit Bildunterschrift, Aktions-Slot |
| `src/components/PageHeader.astro` | Seitenkopf für Modul-/Rechtseiten (Label, H1 auf `--text-page-title`, Einleitung) |
| `src/components/SectionHead.astro` | Abschnittskopf der Startseite (Titel links, Label rechts, Lede) |
| `src/components/FeatureList.astro` | Pfadregister der neun Zugänge als `<ol>` mit echten Links |
| `src/components/Card.astro` | Karte mit optionalem Kopf-/Fuß-Slot, `as`-Prop und Interaktiv-Zustand |
| `src/components/Button.astro` | Schaltfläche (`primary`/`secondary`/`ghost`, `sm`/`md`/`lg`, Link oder `<button>`, `aria-pressed`) |
| `src/components/TextLink.astro` | Textlink mit Pfeil |
| `src/components/Badge.astro` | Abzeichen in fünf Varianten |
| `src/components/TextField.astro` | Text-/Suchfeld mit Label, Hinweis, Fehlertext (`aria-describedby`, `aria-invalid`) |
| `src/components/SelectField.astro` | Auswahlfeld mit typisierter Optionsliste |
| `src/data/site.ts` | Markenname, Fußzeilen-Daten, Navigation mit Zielrouten, Aktiv-Erkennung |
| `src/lib/cx.ts` | Klassen-Helfer für bedingte `class`-Props |
| `src/pages/index.astro` | Startseite: Hero, Pfadregister, Materialband, Kosmos-Tafel |
| `src/pages/komponenten.astro` | **temporäre** Prüfseite (`noindex`), zeigt jede Komponente in allen Varianten; wird mit P6 entfernt |
| `src/styles/fonts.css`, `tokens.css`, `design-system.css`, `shell.css` | Übernahme aus dem Bestand (erzeugt von `scripts/migration/split-legacy-css.py`) |
| `src/styles/global.css` | einziger Einstiegspunkt, nur `@import` in fester Reihenfolge |
| `public/assets/…` | Schriften (mit OFL-Texten), Favicon, die drei Motive der Startseite |
| `scripts/migration/*` | CSS-Zerlegung (mit `--check`), Screenshot-Vergleich, Metrik- und A11y-Prüfungen |

## Entscheidungen

1. **CSS wird kopiert, nicht umgeschrieben.** `scripts/migration/split-legacy-css.py`
   schneidet Tokens, Base-/Komponentenschicht und Shell-Abschnitte zeilengenau
   aus dem Bestand. Die vier Ergebnisdateien stehen deshalb in `.prettierignore`;
   `--check` belegt stattdessen, dass sie unverändert sind. Grund: Der Auftrag
   verlangt Technologie-Austausch ohne Designänderung, und ein Utility-Umbau
   würde jede Regel neu interpretieren.
2. **Keine UI-Framework-Insel.** Es ist kein React/Vue/Svelte installiert; das
   Verhalten von Menü, `scrolled`-Zustand und Favoritenzähler liegt als
   gebündeltes `<script>` in `SiteHeader.astro`. `client:*`-Direktiven gelten nur
   für Framework-Komponenten und wären hier eine leere Geste. Astro bündelt das
   Modul, es läuft ohne Abhängigkeit und ohne Konsolenfehler.
3. **Navigation zielt auf die neuen Routen.** `src/data/site.ts` verlinkt die in
   `docs/migration-plan.md` §2 festgelegten Zieladressen (`/tarot.html`,
   `/wissen/`, `/radiasthesie/` …). Bis die Seiten in t_a3fc82b3/P2–P4 entstehen,
   laufen diese Links im Dev-Server ins Astro-404 — bewusst, statt auf die alten
   `#`-Routen zurückzugreifen, die es in Astro nicht mehr gibt.
4. **Markenname bleibt „Esoterik-Welt“.** Der Bestand rendert diesen Namen; die
   Umbenennung auf VELARKANA ist die offene Entscheidung F1 des Migrationsplans.
   Für den Paritätsvergleich ist der veröffentlichte Name die richtige Basis;
   ein Wechsel ist eine Änderung an `SITE.name`.
5. **Canonical-Host kommt aus `site`.** `https://velarkana.de` (per `ASTRO_SITE`
   überschreibbar) ist die technische Festlegung des Gerüsts; der Bestand zeigt
   auf `ingbms.github.io/Esoterik-Welt/`. Die Host-Umstellung ist F1, nicht Teil
   dieser Karte — Titel, Description und Pfadform (`/impressum.html`) entsprechen
   der Baseline.
6. **Pfadregister als echte Links.** Im Bestand war jede Zeile ein
   `<article role="link" tabindex="0">` mit JS-Navigation. In Astro ist sie ein
   `<a>` in einem `<ol>`: gleiche Optik (siehe „Abweichungen“), aber ohne Skript
   bedienbar, mit korrekter Semantik und ohne `role`-Ersatz.

## Abweichungen zum Bestand (vollständig)

Alle übrigen Regeln sind unverändert übernommen.

| Abweichung | Grund |
| --- | --- |
| `@font-face`-Pfade `../assets/…` → `/assets/…` | Astro bündelt das Stylesheet nach `/_astro/`; relative Pfade würden brechen |
| `#featureGrid` → `.feature-list` | kein SPA-Id-Selektor mehr; die Startseite setzt die Id weiterhin als Anker |
| `.feature-card` erhält `color: inherit; text-decoration: none` | die Zeile ist jetzt ein `<a>` und würde sonst Sandfarbe + Hover-Unterstreichung erben |
| `:where(.feature-list)` statt `.feature-list` für den Listen-Reset | Spezifität 0, damit Abstands-Utilities (`mt-8`) am Aufrufer greifen |
| `.page-shell` (neu, 64 px Bodenabstand) | Ersatz für den `.page`-Container des Bestands; ohne ihn endet die Seite 64 px höher |
| `.hero-grid--copy-only` (neu) | Hero ohne Fotografie fällt auf eine Spalte zurück statt eine leere 7/12-Spalte zu lassen |
| `.field`, `.field-label`, `.field-hint`, `.field-error` (neu) | sichtbare Feldbeschriftung; der Bestand nutzt nur `aria-label`/`sr-only` |
| Druckregeln für Hero (neu in `shell.css`) | aus `main.css` übernommen, damit der Ausdruck dem Bestand entspricht |

## Verifikation (tatsächlich ausgeführt)

```
python scripts/migration/split-legacy-css.py --check   # alle vier Dateien identisch
npm run check                                          # 20 Dateien, 0 errors / 0 warnings / 0 hints
npm run lint                                           # exit 0 (--max-warnings 0)
npm run format:check                                   # alle Dateien konform
npm run build                                          # /index.html + /komponenten.html + sitemap
npx astro dev --port 4402                              # HTTP 200
node scripts/migration/screenshot-parity.cjs <dir>     # Desktop 1440 + Mobile 390, keine Konsolenfehler
node scripts/migration/parity-diagnostics.cjs          # Messwerte unten
node scripts/migration/component-checks.cjs            # 9/9 Prüfungen
```

Gemessener Vergleich Bestand (Commit 9f58439, `dist/Esoterik-Welt/`) gegen Astro:

| Messwert | 1440 px | 390 px |
| --- | --- | --- |
| Dokumenthöhe | 3712 / 3712 | 5410 / 5410 |
| Kopfzeile | 101 px / 101 px | 85 px / 85 px |
| Fußzeile | 433 px / 433 px | 1145 px / 1145 px |
| Dokumentbreite (kein Überlauf) | 1440 / 1440 | 390 / 390 |
| H1, Hero-Intro, Abschnittskopf, Pfadzeile, Navigationslink | identisch (Schriftgröße, Zeilenhöhe, Farbe, Box) | identisch |

`component-checks.cjs` belegt zusätzlich: Skip-Link erhält den ersten
Tab-Fokus, Burger setzt `aria-expanded` und öffnet die volle Breite, Escape
schließt und gibt den Fokus zurück, Navigationslinks haben einen sichtbaren
Fokusring, der Favoritenzähler liest `esot_crystals_fav`, die Seite hat
`header`/`main`/`footer`, eine benannte Navigation und genau eine H1, und die
Prüfseite rendert ohne Konsolenfehler.

Die Vollbild-Screenshots beider Stände sind bei beiden Viewports
byte-identisch (sha256, 1440×3712: `bf689081fd15c2358861cef6491bca78db80b00d50432ea43facefbf8f1caa2f`,
390×5410: `286a55330661b76c2de321bb20f49d808e2797c38b9f2a32156b433e323e55b7`).
Voraussetzung dafür ist das Durchscrollen vor der Aufnahme: beide Seiten laden
das Materialband per `loading="lazy"` nach.

## Offene Punkte für die Folgekarten

- Zielrouten der Navigation entstehen mit t_a3fc82b3 (P2–P4); bis dahin sind
  `/tarot.html` usw. 404. Der Footer-Eintrag „Einsteiger-Guide“ zeigt auf
  `/wissen/`, weil die Slug-Entscheidung der Artikel noch offen ist (F4).
- Rechtsseiten und `404.html` (P2) nutzen die vorhandenen Varianten
  `headerVariant="minimal"` / `footerVariant="compact"`; die Seiten selbst sind
  nicht Teil dieser Karte.
- Detaildialoge (Tarot/Kristalle/Runen/Artikel) sind noch nicht portiert: Sie
  brauchen die Fokus-Falle aus `js/dialog.js` als Insel. Die Styles
  (`.modal*`) liegen bereits in `src/styles/design-system.css`.
- `og:image` fehlt weiter im Bestand (offene Frage F6); `BaseLayout` unterstützt
  ein `ogImage`-Prop, sobald das Motiv existiert.
- Die Prüfseite `src/pages/komponenten.astro` wird mit dem Paritäts-Paket (P6)
  gelöscht.
