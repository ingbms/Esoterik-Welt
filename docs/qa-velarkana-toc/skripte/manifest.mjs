/**
 * Manifest eines Build-Verzeichnisses: normalisierte Hashes aller HTML-Dateien
 * (CSS-Bundle-Name entfernt), Überschriften-IDs der Pilotseite, Asset-Größen.
 * Aufruf: node qa-toc-436eeffb/manifest.mjs <label>
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DIST, EVID, writeJson } from './lib.mjs';

const label = process.argv[2] || 'build';

function listHtml(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === '__qa__') continue;
      out.push(...listHtml(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.html')) out.push(rel);
  }
  return out.sort();
}

const normalize = (html) => html.replace(/_astro\/BaseLayout\.[A-Za-z0-9_-]+\.css/g, '_astro/BaseLayout.CSS.css');

const files = {};
for (const rel of listHtml(DIST)) {
  const html = fs.readFileSync(path.join(DIST, rel), 'utf8');
  files[rel] = crypto.createHash('sha256').update(normalize(html), 'utf8').digest('hex');
}

const pilotPath = path.join(DIST, 'frequenzen', 'quellen.html');
const pilot = fs.readFileSync(pilotPath, 'utf8');
const pilotIds = [...pilot.matchAll(/<h([23])\s+id="([^"]+)"/g)].map((m) => ({ depth: Number(m[1]), id: m[2] }));
const cssFile = fs.readdirSync(path.join(DIST, '_astro')).filter((f) => f.startsWith('BaseLayout.') && f.endsWith('.css'));
const gzipSize = async (file) => {
  const zlib = await import('node:zlib');
  return zlib.gzipSync(fs.readFileSync(file)).length;
};
const assets = {
  css: await Promise.all(cssFile.map(async (f) => ({ file: f, bytes: fs.statSync(path.join(DIST, '_astro', f)).size, gzip: await gzipSize(path.join(DIST, '_astro', f)) }))),
  tocScript: await Promise.all(
    fs
      .readdirSync(path.join(DIST, '_astro'))
      .filter((f) => f.startsWith('TableOfContents') && f.endsWith('.js'))
      .map(async (f) => ({ file: f, bytes: fs.statSync(path.join(DIST, '_astro', f)).size, gzip: await gzipSize(path.join(DIST, '_astro', f)) }))
  ),
  chunks: await Promise.all(
    fs
      .readdirSync(path.join(DIST, '_astro'))
      .filter((f) => f.endsWith('.js') && fs.statSync(path.join(DIST, '_astro', f)).size < 40000)
      .map(async (f) => ({ file: f, bytes: fs.statSync(path.join(DIST, '_astro', f)).size, gzip: await gzipSize(path.join(DIST, '_astro', f)) }))
  ),
};

const out = { label, generatedAt: new Date().toISOString(), htmlFiles: Object.keys(files).length, files, pilotIds, pilotLength: pilot.length, assets };
writeJson(`manifest-${label}.json`, out);
console.log(label, 'html', out.htmlFiles, 'pilotIds', pilotIds.length, 'css', JSON.stringify(assets.css), 'tocScript', JSON.stringify(assets.tocScript));
