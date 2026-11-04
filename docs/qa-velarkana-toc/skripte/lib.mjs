/**
 * QA-Hilfen für die unabhängige Abnahme des TOC-Piloten (t_436eeffb).
 *
 * Eigener Static-Server (node:http, Port 0) und Browser-Start. Kein Kindprozess,
 * kein externer Server: die Prüfung läuft im selben Node-Prozess.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const QA_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(QA_DIR, '../../..');
export const DIST = path.join(ROOT, 'dist');
export const EVID = path.join(ROOT, 'evidence', 'qa-toc-436eeffb');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeJson(name, data) {
  ensureDir(EVID);
  fs.writeFileSync(path.join(EVID, name), JSON.stringify(data, null, 2) + '\n', 'utf8');
  return path.join(EVID, name);
}

export function writeText(name, text) {
  ensureDir(EVID);
  fs.writeFileSync(path.join(EVID, name), text, 'utf8');
  return path.join(EVID, name);
}

/** Static-Server über ein Verzeichnis; Verzeichnisse liefern index.html. */
export function startServer(root = DIST) {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(root, path.normalize(rel).replace(/^([/\\])+/, ''));
    if (!file.startsWith(root)) {
      res.statusCode = 403;
      res.end('forbidden');
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.statusCode = 404;
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(`<!doctype html><title>404</title><p>404 ${rel}</p>`);
        return;
      }
      res.statusCode = 200;
      res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
      res.setHeader('cache-control', 'no-store');
      res.end(buf);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        base: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

export async function launchChromium() {
  const { chromium } = await import('playwright');
  const attempts = [
    {},
    { channel: 'chromium' },
    { executablePath: process.env.QA_CHROMIUM },
  ];
  let lastError;
  for (const opts of attempts) {
    if (opts.executablePath && !opts.executablePath) continue;
    try {
      return await chromium.launch({ headless: true, ...opts });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Volle Accessibility-Baum-Knoten der Seite. */
export async function axTree(page) {
  const client = await page.context().newCDPSession(page);
  const { nodes } = await client.send('Accessibility.getFullAXTree');
  await client.detach();
  return nodes;
}

/** Farb- und Kontrastrechnung im Browser-Kontext. */
export const CONTRAST_FN = `
window.__qaContrast = (() => {
  const parse = (value) => {
    const m = /rgba?\\(([^)]+)\\)/.exec(value || '');
    if (!m) return null;
    const parts = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  };
  const effectiveBg = (el) => {
    let node = el;
    let bg = null;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      const parsed = parse(cs.backgroundColor);
      if (parsed && parsed.a > 0) {
        bg = bg ? over(bg, parsed) : parsed;
        if (bg.a === 1) return bg;
      }
      node = node.parentElement;
    }
    const root = parse(getComputedStyle(document.body).backgroundColor);
    if (bg) return root ? over(bg, root.a === 0 ? { r: 255, g: 255, b: 255, a: 1 } : root) : bg;
    return root && root.a > 0 ? root : { r: 255, g: 255, b: 255, a: 1 };
  };
  return (el) => {
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    const bg = effectiveBg(el);
    const solid = fg && fg.a < 1 ? over(fg, bg) : fg;
    return { ratio: solid ? Number(ratio(solid, bg).toFixed(2)) : null, fg: cs.color, bg: \`rgb(\${bg.r}, \${bg.g}, \${bg.b})\`, fontSize: cs.fontSize, fontWeight: cs.fontWeight };
  };
})();
`;
