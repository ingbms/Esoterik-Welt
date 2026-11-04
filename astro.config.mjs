// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import sitemapFilePaths from './astro-plugins/sitemap-file-paths.mjs';

/**
 * Kanonische Produktionsadresse.
 *
 * `velarkana.de` ist registriert, aber (Stand Migration) noch nicht mit GitHub
 * Pages verbunden. Damit Canonicals, `sitemap.xml` und OpenGraph-URLs während
 * der Übergangsphase nicht auf eine tote Domain zeigen, lässt sich die Adresse
 * pro Lauf überschreiben:
 *
 *   ASTRO_SITE=https://ingbms.github.io/velarkana npm run build
 *
 * Nach der DNS-/Pages-Umschaltung ist der Default die richtige Adresse.
 */
const site = process.env.ASTRO_SITE ?? 'https://velarkana.de';

export default defineConfig({
  site,

  // Reine statische Ausgabe: GitHub Pages stellt keine Server-Laufzeit bereit
  // (Master-Auftrag §7). Kein Adapter, keine SSR-Routen.
  output: 'static',

  // URL-Parität: Der Bestand liefert Dateien wie /impressum.html und
  // /radiasthesie/pendeln.html aus. `format: 'preserve'` erzeugt beim Build
  // genau diese Dateinamen und hält gleichzeitig Verzeichnisrouten als
  // Verzeichnis (`radiasthesie/index.astro` → `/radiasthesie/`, nicht
  // `/radiasthesie.html`) — mit `format: 'file'` würde der Bereichs-Hub seine
  // kanonische Adresse aus dem Bestand verlieren (Migrationsplan §6.3).
  build: { format: 'preserve' },

  integrations: [
    sitemap({
      // Die Fehlerseite gehört nicht in eine Sitemap (kein kanonischer Inhalt).
      filter: (page) => !page.endsWith('/404.html'),
    }),
    // Sitemap-Adressen auf die ausgelieferten Dateipfade bringen (`/x` → `/x.html`).
    sitemapFilePaths(),
  ],
});
