/**
 * Astro-Integration: Sitemap-Einträge auf die tatsächlich ausgelieferten
 * Dateipfade bringen.
 *
 * Problem: Der Bestand adressiert seine Dokumente als Dateien
 * (`/impressum.html`, `/radiasthesie/pendeln.html`), erzeugt mit
 * `build.format: 'preserve'`. Die Sitemap-Integration arbeitet dagegen mit
 * Routenpfaden (`/impressum`) — als `<loc>` wäre das ein 404, weil ein
 * statischer Host ohne Rewrites die Datei `/impressum` nicht kennt.
 *
 * Lösung: Nach dem Build (`astro:build:done`) werden die `<loc>`-Werte gegen das
 * erzeugte Dateisystem geprüft und auf die existierende Adresse gesetzt:
 *   - `seite`        → `seite.html`, wenn `seite.html` existiert
 *   - `verzeichnis`  → `verzeichnis/`, wenn `verzeichnis/index.html` existiert
 * Nichts wird geraten: Was sich nicht auflösen lässt, bricht den Build ab.
 */
import { statSync } from 'node:fs';
import { join } from 'node:path';

function exists(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export default function sitemapFilePaths() {
  return {
    name: 'sitemap-file-paths',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root =
          dir.pathname.startsWith('/') && process.platform === 'win32' ? dir.pathname.slice(1) : dir.pathname;
        const sitemapName = 'sitemap-0.xml';
        const sitemapPath = join(root, sitemapName);
        const fs = await import('node:fs/promises');
        let xml;
        try {
          xml = await fs.readFile(sitemapPath, 'utf8');
        } catch {
          logger.warn(`${sitemapName} nicht gefunden — Sitemap-Pfade unverändert.`);
          return;
        }

        let rewritten = 0;
        let unresolved = 0;
        const next = xml.replace(/<loc>([^<]+)<\/loc>/g, (match, loc) => {
          const url = new URL(loc);
          const pathname = decodeURIComponent(url.pathname);
          if (pathname.endsWith('/')) return match;
          const candidates = [
            { file: `${pathname}.html`, path: `${pathname}.html` },
            { file: `${pathname}/index.html`, path: `${pathname}/` },
          ];
          for (const candidate of candidates) {
            if (exists(join(root, candidate.file))) {
              url.pathname = candidate.path;
              rewritten += 1;
              return `<loc>${url.href}</loc>`;
            }
          }
          unresolved += 1;
          return match;
        });

        await fs.writeFile(sitemapPath, next, 'utf8');
        logger.info(`Sitemap: ${rewritten} Adressen an Dateipfade angepasst, ${unresolved} unverändert.`);
        if (unresolved > 0) {
          throw new Error(`${unresolved} Sitemap-Adressen haben keine Datei im Build — Build abgebrochen.`);
        }
      },
    },
  };
}
