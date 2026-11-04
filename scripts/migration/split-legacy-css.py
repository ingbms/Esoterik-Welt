"""Zerlegt die Legacy-Stylesheets in die Astro-Quellen unter src/styles/.

Einmaliger Migrationsschritt (t_2d9fbecf). Die Bloecke werden zeilengenau aus
css/design-system.css und css/main.css uebernommen, damit die visuelle Paritaet
nicht durch Abschreiben entsteht.

Aufruf (aus dem Projektwurzelverzeichnis):
    python scripts/migration/split-legacy-css.py          # schreiben
    python scripts/migration/split-legacy-css.py --check  # nur pruefen

`--check` vergleicht die erzeugten Inhalte mit den vorhandenen Dateien und
endet mit Exit-Code 1, sobald eine Abweichung besteht. Damit bleibt belegbar,
dass src/styles/*.css weiterhin die Vorlage sind (siehe .prettierignore).
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC_STYLES = ROOT / "src" / "styles"

FONTS_HEADER = """\
/*
 * Schriften — unveraendert aus css/design-system.css uebernommen.
 *
 * Die Schriftdateien liegen wie im Bestand in assets/fonts (SIL OFL 1.1,
 * Lizenztexte daneben). Der Pfad ist jetzt wurzelabsolut, weil Astro das
 * Stylesheet nach /_astro/ buendelt und relative Pfade sonst brechen wuerden.
 * Geaendert wurde ausschliesslich das Pfadpraefix (`../assets/` -> `/assets/`).
 */
"""

DESIGN_HEADER = """\
/* ============================================================================
   Design System — Komponenten-, Layout- und Utility-Schicht
   ----------------------------------------------------------------------------
   Zeilengenaue Uebernahme aus dem Bestand (css/design-system.css, Abschnitt
   "Base" bis "Print"). Tokens stehen in tokens.css, Schriften in fonts.css.
   Nicht umformulieren: die Datei ist die visuelle Referenz fuer den
   Side-by-Side-Vergleich mit der Bestandsseite.
   ============================================================================ */
"""

SHELL_HEADER = """\
/* ============================================================================
   Seiten-Shell — Hero, Abschnittskoepfe, Pfadregister, Kosmos-Tafel
   ----------------------------------------------------------------------------
   Zeilengenaue Uebernahme aus dem Bestand (css/main.css: "Shared document
   shell", "Hero", "Section heads", "Home: path register", "Cosmos" sowie das
   Materialband der Startseite). Bereichs-spezifische Modulstyles (Tarot,
   Kristalle, Mond, ...) bleiben bis zur Portierung ihrer Seiten in
   css/main.css.

   Minimal-invasiv geaendert:
   - `#featureGrid` -> `.feature-list` (kein SPA-Id-Selektor mehr),
   - Link-Normalisierung fuer `.feature-card` (im Bestand ein <article
     role="link">; in Astro ein echtes <a>),
   - Feld- und Hero-Bausteine der neuen Komponenten, siehe Dateiende.
   ============================================================================ */
"""

SHELL_ASTRO_BLOCK = """
/* --- Astro-Anpassung: Pfadregister als echte Links ------------------------
   Im Bestand war die Zeile ein <article role="link" tabindex="0"> mit
   JS-Navigation. In Astro ist sie ein <a href>, also gelten die globalen
   Link-Regeln (Sandfarbe, Unterstreichung im Hover). Beides wird hier auf den
   Bestand zurueckgesetzt, damit die Zeile unveraendert aussieht.

   Das Register ist jetzt ein <ol> (Reihenfolge ist Inhalt), deshalb muss die
   Listenformatierung entfallen — die Nummer steht schon in .feature-icon.
   `:where()` haelt die Spezifitaet bei 0, damit Abstands-Utilities wie `mt-8`
   am Aufrufer weiterhin greifen; mit einer normalen Klassenregel wuerde die
   hier deklarierte Null-Margin den Utility-Wert ueberschreiben. */
.feature-card {
  color: inherit;
  text-decoration: none;
}
.feature-card:hover {
  color: inherit;
  text-decoration: none;
}
:where(.feature-list) {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* --- Neu in Astro: Feld-Bausteine -----------------------------------------
   Der Bestand beschriftet Filterfelder per aria-label oder sr-only-Label und
   kennt deshalb keine sichtbare Feldbeschriftung. Die Komponenten TextField
   und SelectField bringen eine mit; sie nutzt dieselben Tokens wie .label,
   aber ohne die Versalien der Gestaltungssprache (die bleibt dem .label-Titel
   vorbehalten). Fehlerfarbe ist der funktionale Signalton des Design-Systems. */
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}
.field-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  color: var(--color-text-secondary);
}
.field .input,
.field .select {
  width: 100%;
}
.field-hint {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.55;
  color: var(--color-text-secondary);
}
.field-error {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.55;
  color: var(--color-accent-rose);
}

/* --- Neu in Astro: Seitenrahmen -------------------------------------------
   Im Bestand ist jede Ansicht ein `.page`-Container mit 64 px Bodenabstand
   (`padding: var(--space-12) 0 var(--space-16)`, Startseite ohne oberen Teil).
   In Astro ist die Seite selbst der Container; ohne diesen Abstand endet der
   letzte Abschnitt 64 px hoeher als in der Vorlage. Der Wert gilt in beiden
   Viewports, weil der Bestand ihn nicht responsive anpasst. */
.page-shell {
  padding-bottom: var(--space-16);
}

/* --- Neu in Astro: Hero ohne Abbildung ------------------------------------
   Das Bestandsraster ist auf 5:7 mit Fotografie ausgelegt. Fehlt die Figure,
   wuerde die Kopie in einer 5/12-Spalte stehen und daneben eine leere Flaeche
   bleiben; deshalb faellt das Raster dann auf eine Spalte zurueck. */
.hero-grid--copy-only {
  grid-template-columns: minmax(0, 1fr);
}
"""

RESPONSIVE_BLOCK = """/* --- Grundregeln aus dem Bestand -------------------------------------------
   Uebernommen aus css/main.css, Abschnitt "Grundregeln": ohne `min-width: 0`
   sprengt eine lange Zeile auf Mobile die Rasterspalte. */
.grid > * {
  min-width: 0;
}
.feature-card {
  overflow-wrap: anywhere;
}

/* --- Responsive Shell ------------------------------------------------------
   Uebernommen aus css/main.css, Abschnitt "Responsive" (1100/900/700 px) und
   dem Druckblock: Hero stapelt auf Mobile (Text vor Bild), das Pfadregister
   verliert seine drei Spalten, die Kosmos-Tafel wird einspaltig. */
@media (max-width: 1100px) {
  .hero-grid {
    grid-template-columns: 1fr 1.2fr;
    gap: var(--space-6);
  }
  .cosmos-grid {
    gap: var(--space-10);
  }
  .hero h1 {
    max-width: 18ch;
  }
}
@media (max-width: 900px) {
  .cosmos-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-8);
  }
}
@media (max-width: 700px) {
  .hero {
    padding-block: var(--space-8) var(--space-12);
  }
  .hero-grid {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-6);
  }
  .hero h1 {
    max-width: none;
  }
  .hero-intro {
    max-width: none;
  }
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .hero-actions .btn {
    width: 100%;
    min-width: 0;
  }
  .specimen .caption {
    text-align: left;
    margin-top: var(--space-3);
  }
  .section-head {
    display: block;
  }
  .section-head .label {
    display: block;
    text-align: left;
    margin-top: var(--space-3);
  }
  .feature-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .feature-card {
    grid-template-columns: 40px minmax(0, 1fr) 20px;
    gap: var(--space-3);
  }
  .feature-title {
    font-size: 20px;
  }
}
@media print {
  .hero {
    display: block;
  }
  .hero-grid {
    display: block;
  }
}

"""

MATERIAL_BLOCK = """/* --- Home: Materialband (eine bewusste Detailstudie) ----------------------
   Uebernommen aus css/main.css, Abschnitt "Home: material detail band". */
.material-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-16);
  align-items: center;
}
.material-figure {
  margin: 0;
  min-width: 0;
}
.detail {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: contain;
  filter: saturate(0.65) brightness(1.04);
  mix-blend-mode: screen;
}
@media (max-width: 900px) {
  .material-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-6);
  }
}

"""


def slice_lines(lines: list[str], start: int, end: int) -> str:
    """1-basierte, inklusive Zeilenbereiche."""
    return "".join(lines[start - 1 : end])


def generate() -> dict[str, str]:
    ds = (ROOT / "css" / "design-system.css").read_text(encoding="utf-8").splitlines(keepends=True)
    mn = (ROOT / "css" / "main.css").read_text(encoding="utf-8").splitlines(keepends=True)

    if "Nachtatelier" not in ds[1] or ":root {" not in ds[39] or "RESERVED V1 STUDY" not in ds[289]:
        raise SystemExit("design-system.css hat sich verschoben — Zeilenbereiche pruefen")
    if "Shared document shell" not in mn[6] or "Hero: asymmetric" not in mn[121]:
        raise SystemExit("main.css hat sich verschoben — Zeilenbereiche pruefen")

    fonts = FONTS_HEADER + slice_lines(ds, 17, 38).replace("url('../assets/", "url('/assets/")
    tokens = slice_lines(ds, 1, 15) + slice_lines(ds, 40, 425)
    design = DESIGN_HEADER + "\n" + slice_lines(ds, 427, len(ds)).lstrip("\n")

    shell = SHELL_HEADER + "\n"
    shell += slice_lines(mn, 7, 96) + "\n"
    shell += slice_lines(mn, 122, 259) + "\n"
    shell += slice_lines(mn, 274, 340).replace("#featureGrid {", ".feature-list {")
    shell += "\n" + slice_lines(mn, 342, 391) + "\n"
    shell += RESPONSIVE_BLOCK
    shell += MATERIAL_BLOCK
    shell += SHELL_ASTRO_BLOCK

    return {
        "fonts.css": fonts,
        "tokens.css": tokens,
        "design-system.css": design,
        "shell.css": shell,
    }


def main() -> int:
    check_only = "--check" in sys.argv[1:]
    generated = generate()
    status = 0

    for name, content in generated.items():
        path = SRC_STYLES / name
        if check_only:
            current = path.read_text(encoding="utf-8") if path.exists() else ""
            if current != content:
                print(f"ABWEICHUNG: {path.relative_to(ROOT)}")
                status = 1
            else:
                print(f"identisch: {path.relative_to(ROOT)}")
            continue
        path.write_text(content, encoding="utf-8", newline="\n")
        print(f"{name}: {len(content.splitlines())} Zeilen")

    return status


if __name__ == "__main__":
    sys.exit(main())
