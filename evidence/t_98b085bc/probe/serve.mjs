// Eigener Static-Server der Rework-Karte t_98b085bc (unabhängig von der Abnahme).
// Liefert ein Verzeichnis unter dem Präfix /Esoterik-Welt/ aus, damit
// <base href="/Esoterik-Welt/"> und die Playwright-Struktur stimmen.
// Aufruf: node serve.mjs <root> <port>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2]);
const port = Number(process.argv[3] || 8137);
const PREFIX = '/Esoterik-Welt';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    if (!url.startsWith(PREFIX)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    let rel = url.slice(PREFIX.length) || '/';
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(root, path.normalize(rel).replace(/^([/\\])+/, ''));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        const notFound = path.join(root, '404.html');
        fs.readFile(notFound, (err2, body) => {
          res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
          res.end(err2 ? 'not found' : body);
        });
        return;
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`serve ${root} on http://127.0.0.1:${port}${PREFIX}/`));
