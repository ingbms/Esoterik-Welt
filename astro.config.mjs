// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
  // /radiasthesie/pendeln.html aus. `format: 'file'` erzeugt beim Build genau
  // diese Dateinamen, damit die Migration keine Redirects und keine geänderten
  // URLs benötigt (Master-Auftrag §6/§11.3).
  build: { format: 'file' },

  integrations: [sitemap()],
});
