/**
 * robots.txt als Build-Artefakt.
 *
 * Warum generiert: Die Sitemap-Adresse hängt an `Astro.site` (ein Wechsel der
 * Domain soll nicht zwei Dateien nachziehen müssen). Der Bestand verbot
 * `/Esoterik-Welt/tests/` und `/Esoterik-Welt/src/` — beides Verzeichnisse, die
 * es im Build nicht mehr gibt; Repo-Interna sind mit der Migration strukturell
 * nicht mehr ausgeliefert (Migrationsplan R11, §2.4).
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://velarkana.de')).href.replace(/\/$/, '');
  const body = [
    '# VELARKANA — alle ausgelieferten Inhalte sind indexierbar.',
    '# Repo-Interna (docs/, tests/, qa/, evidence/) liegen nicht im Deploy-Ordner.',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${origin}/sitemap-index.xml`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
