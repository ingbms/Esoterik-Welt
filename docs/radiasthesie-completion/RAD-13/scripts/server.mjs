// Minimaler statischer Server fuer den Pruefbaum (kein Kindprozess, kein Portkonflikt)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'C:/Users/mas/Arbeit/esow-qa-rad13';
const SITE = join(ROOT, 'dist', 'Esoterik-Welt');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

export async function startServer(port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(url.pathname);
      if (p === '/api/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end('{"status":"ok"}');
      }
      if (p === '/' || p === '') p = '/Esoterik-Welt/';
      if (!p.startsWith('/Esoterik-Welt/')) {
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
        return res.end((await readFile(join(SITE, '404.html'))) || '');
      }
      let rel = p.slice('/Esoterik-Welt/'.length);
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      let file = join(SITE, rel);
      try {
        await stat(file);
      } catch {
        const notFound = join(SITE, '404.html');
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
        return res.end(await readFile(notFound));
      }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'content-length': body.length });
      res.end(body);
    } catch (e) {
      res.writeHead(500);
      res.end('server error: ' + e.message);
    }
  });
  await new Promise((resolve, reject) => server.listen(port, '127.0.0.1', resolve).on('error', reject));
  return { server, port: server.address().port, close: () => new Promise((r) => server.close(r)) };
}
