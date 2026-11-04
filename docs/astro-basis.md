# Migrationsplan VELARKANA (Astro + TypeScript)

Dieses Dokument sammelt die verbindlichen technischen Entscheidungen der
Migration von der statischen HTML-Site auf Astro. Es wird von den
Migrationskarten fortgeschrieben; die Bestandsaufnahme (Routen-Matrix,
Content-Inventar, SEO-Baseline) liefert t_d86acafa und ergänzt dieses Dokument.

## 1. Astro-Basis (t_5a343e3c)

**Arbeitsstand:** Branch `wt/t_5a343e3c`, Ausgangscommit `9f58439`
(veröffentlichter Reparatur-Stand). Das Gerüst liegt im Projektwurzelverzeichnis,
weil Astro `src/pages`, `public/` und `dist/` dort erwartet.

| Baustein | Version / Wert | Begründung |
| --- | --- | --- |
| Astro | 7.4.5 (exakt) | aktuelle stabile Version; `output: 'static'`, kein Adapter |
| TypeScript | 6.0.3 (exakt) | `@astrojs/check` erlaubt `^5 || ^6`; TS 7 ist noch nicht unterstützt |
| `@astrojs/sitemap` | 3.7.4 | Sitemap aus den tatsächlich gebauten Routen statt handgepflegter XML |
| ESLint | 9.39.1 (unverändert) | Legacy-Kette bleibt gepinnt; `eslint-plugin-astro` 1.7.0 ist die letzte Version mit ESLint-9-Peer |
| Prettier | 3.6.2 + `prettier-plugin-astro` 1.1.2 | formatiert `.astro`-Dateien mit |
| Node | `>=22.23.4` (`engines`) | Mindestanforderung von Astro 7 |

`cookie@2.0.1` ist als direkte Dependency eingetragen: Astro 7 importiert die
ESM-Variante, während `express@4` (Legacy-Vorschau) `cookie@0.7.2` (CJS) nach
`node_modules/` hochzieht. Ohne die direkte Abhängigkeit schlägt der Astro-Build
mit `Named export 'parseCookie' not found` fehl. Entfällt, sobald die
Express-Vorschau entfernt ist.

### Verzeichnisse

```
src/pages/        Routen (index.astro als Gerüstseite)
src/layouts/      BaseLayout.astro (head, Canonical, Skip-Link, Slot)
src/components/   leer, wird in t_2d9fbecf gefüllt
src/content/      leer, Content Collections folgen in t_a3fc82b3
src/styles/       global.css (Basisschicht + Tokens)
public/           statische Dateien für Astro (aktuell nur assets/favicon.svg)
legacy/public/    archivierter Vor-Astro-Platzhalter, nicht im Build
```

### TypeScript

`tsconfig.json` erweitert `astro/tsconfigs/strict` und setzt `strict: true`
explizit. Pfad-Alias `@/*` → `src/*`. Der Gültigkeitsbereich ist bewusst auf
`src/**/*` und `astro.config.mjs` begrenzt (`include`), damit `astro check`
nicht die untypisierte Legacy-JS-Kette prüft.

### CSS-Ansatz: plain CSS (kein Tailwind)

Der Bestand ist handgeschriebenes CSS mit einem geprüften Token-System
(`css/design-system.css`, dokumentiert in `docs/design-tokens.md`,
Paritätsnachweis `evidence/t_280f3753/`). Der Auftrag verlangt einen
Technologie-Austausch ohne Designänderung. Utility-Klassen würden jede
Markup-Zeile neu schreiben und damit visuelle Drift und zusätzliche
Abhängigkeiten erzeugen; Astro bündelt und minimiert plain CSS ohne weiteres
Werkzeug. Die Legacy-Stylesheets werden in t_2d9fbecf unverändert nach
`src/styles/` übernommen; `src/styles/global.css` enthält bis dahin nur die
Basisschicht und eine wörtliche Kopie der normativen Farb-/Raster-Tokens.

### URLs und Site-Adresse

- `site` = `https://velarkana.de` (per `ASTRO_SITE` überschreibbar, solange die
  Domain nicht mit GitHub Pages verbunden ist).
- `build.format: 'file'`: erzeugt `/impressum.html` statt `/impressum/index.html`
  und erhält damit die bestehenden URLs. Das ist Voraussetzung für
  Link-Parität ohne Redirects (Master-Auftrag §6/§11.3).
- Trailing-Slash-Verhalten bleibt bei Astros Default (`ignore`), weil der
  Bestand direkt auf `.html`-Dateien verlinkt.

### npm-Scripts

| Script | Bedeutung |
| --- | --- |
| `dev` | Astro-Dev-Server |
| `build` | Astro-Produktionsbuild nach `dist/` |
| `preview` | Astro-Preview des Builds |
| `check` | `astro check` (TypeScript + Astro-Diagnostik) |
| `sync` | generiert `.astro/types.d.ts` (gitignoriert) |
| `lint` / `lint:fix` | ESLint inkl. Astro- und TS-Regeln, `--max-warnings 0` |
| `format` / `format:check` | Prettier inkl. `.astro` |
| `build:legacy` | bisheriger Build (`scripts/build-pages.cjs` → `dist/Esoterik-Welt/`) |
| `dev:legacy`, `preview:legacy` | bisheriger Nodemon-/Express-Betrieb |
| `start` | Legacy-Express-Vorschau (baut vorher via `build:legacy`) |

Damit ist `build` der Astro-Build; die Legacy-Werkzeuge bleiben für den
Vergleich mit der Referenzsite und für die bestehenden Regressionstests
erreichbar (`test:pages`, `test:e2e`, `test:local` nutzen `build:legacy`).

## 2. Offene Punkte für die Folgekarten

- **t_2d9fbecf (erledigt, siehe `docs/astro-layout-komponenten-t_2d9fbecf.md`):**
  `css/design-system.css` und die Shell-Abschnitte aus `css/main.css` liegen als
  `src/styles/{fonts,tokens,design-system,shell}.css` vor; Header, Navigation,
  Fußzeile, Hero, Abschnittsköpfe, Karten, Schaltflächen, Abzeichen,
  Pfadregister und Formularfelder sind typisierte `.astro`-Komponenten.
  Offen bleiben Detaildialoge (Fokus-Falle als Insel) und die Zielrouten der
  Navigation.
- **t_a3fc82b3:** Routen-Matrix auf `src/pages` abbilden, Content Collections mit
  Zod-Schema, `robots.txt`/Sitemap gegen die generierte `sitemap-index.xml`
  prüfen. Die Legacy-`sitemap.xml` im Wurzelverzeichnis wird dabei ersetzt.
- **Deployment:** Sobald die Zieladresse feststeht, `ASTRO_SITE` bzw. `site`
  anpassen und `base` nur setzen, wenn die Site unter einem Unterpfad läuft.
- **ESLint 10:** Upgrade inkl. `eslint-plugin-astro` 3.x ist ein eigener Schritt
  (betrifft die Legacy-Konfiguration).
