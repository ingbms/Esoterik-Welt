// Gemeinsame Helfer der Abnahme-Sonden: eigener Static-Server im Prozess.
// Der Server wird mit dem Prüfskript gestartet und beendet, damit keine
// fremden oder veralteten Instanzen auf dem Port beantwortet werden.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

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
  '.md': 'text/markdown; charset=utf-8',
};

export function startServer(rootDir, port) {
  const root = path.resolve(rootDir);
  const server = http.createServer((req, res) => {
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
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        fs.readFile(path.join(root, '404.html'), (err2, body) => {
          res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
          res.end(err2 ? 'not found' : body);
        });
        return;
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${port}${PREFIX}` }));
  });
}

export function base64File(file) {
  return fs.readFileSync(file, 'base64');
}

// WCAG-Kontrastrechnung für gemessene Farbpaare.
export function contrastRatio(rgb1, rgb2) {
  const luminance = ([r, g, b]) => {
    const channel = (value) => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}
