#!/usr/bin/env node
/**
 * Einmalige Inhaltsübernahme von der Bestandsstruktur in Astro-Content.
 *
 * Warum als Skript und nicht von Hand: Die Übernahme soll nachvollziehbar und
 * wiederholbar sein (Migrationsplan P2/P3). Das Skript liest ausschließlich
 * vorhandene Quellen und schreibt daraus Markdown-Fragmente:
 *
 *   1. js/data/articles.js      → src/content/articles/<slug>.md   (10 Artikel)
 *   2. content/farbwelten/*.md  → src/content/farbwelten/*.md      (18 Dokumente, 1:1)
 *   3. impressum.html / datenschutz.html / haftung.html
 *                               → src/content/legal/<name>.html    (Rechtstexte 1:1)
 *
 * Die Rechtstexte bleiben bewusst HTML: Sie enthalten Auszeichnungen
 * (Bildnachweis-Listen mit Lizenz-Links), die eine Markdown-Umwandlung
 * verlustbehaftet machen würde. Der Migrationsplan fordert für P2
 * „byte-gleiche Textsubstanz“ — deshalb wird der Inhalt von `<main>`
 * unverändert übernommen und nur die Wurzel relativ gemachter Links
 * (`href="./"` → `href="/"`) umgeschrieben.
 *
 * Aufruf: node scripts/migrate-content.cjs   (idempotent)
 */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');

const ARTICLES_DIR = path.join(root, 'src/content/articles');
const FARB_DIR = path.join(root, 'src/content/farbwelten');
const LEGAL_DIR = path.join(root, 'src/content/legal');

const LEGAL_SOURCES = [
  { file: 'impressum.html', target: 'impressum.html' },
  { file: 'datenschutz.html', target: 'datenschutz.html' },
  { file: 'haftung.html', target: 'haftung.html' },
];

/** Umlaute und Sonderzeichen so umschreiben, dass URLs stabil und lesbar bleiben. */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[–—]/g, '-')
    .replace(/[„“”"'`()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Erste sinnvolle Wörter eines Titels als Slug — max. 6 Wörter, max. 60 Zeichen. */
function articleSlug(title, legacyId) {
  const words = slugify(title).split('-').filter(Boolean);
  const short = [];
  for (const word of words) {
    if (short.length >= 5) break;
    if ([...short, word].join('-').length > 55) break;
    short.push(word);
  }
  const slug = short.join('-') || `artikel-${legacyId}`;
  return slug;
}

/** YAML-Wert sicher quoten (Titel enthalten Doppelpunkte und Gedankenstriche). */
function yamlString(value) {
  return JSON.stringify(String(value));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function writeArticles() {
  const modulePath = pathToFileURL(path.join(root, 'js/data/articles.js')).href;
  const { articles } = await import(modulePath);
  ensureDir(ARTICLES_DIR);
  const mapping = [];
  for (const article of articles) {
    const slug = `${String(article.id).padStart(2, '0')}-${articleSlug(article.title, article.id)}`;
    const frontmatter = [
      '---',
      `legacyId: ${article.id}`,
      `title: ${yamlString(article.title)}`,
      `category: ${yamlString(article.category)}`,
      `date: ${yamlString(article.date)}`,
      `readTime: ${yamlString(article.readTime)}`,
      `excerpt: ${yamlString(article.excerpt)}`,
      'tags:',
      ...article.tags.map((tag) => `  - ${yamlString(tag)}`),
      '---',
      '',
    ].join('\n');
    const body = `${String(article.content).trim()}\n`;
    fs.writeFileSync(path.join(ARTICLES_DIR, `${slug}.md`), frontmatter + body, 'utf8');
    mapping.push({ legacyId: article.id, slug, category: article.category, title: article.title });
  }
  return mapping;
}

/**
 * Redaktions-Beiwerk entfernen, das für Leser nicht gedacht ist.
 *
 * Die Farbwelt-Quellen beginnen mit `# <Farbe>` und einem Blockquote
 * „SEO-Metadaten: …“. Auf der Seite ist die H1 bereits gesetzt (Titel aus dem
 * Frontmatter), und der SEO-Block ist eine Arbeitsnotiz der Redaktion. Beides
 * wird entfernt — sonst stünde eine doppelte H1 und eine Meta-Notiz im
 * sichtbaren Text (im Bestand blendete die Client-Ansicht diese Zeilen aus).
 */
function stripEditorialChrome(text) {
  return text.replace(/^\s*#\s+[^\n]*\n/, '').replace(/^\s*(?:>\s*[^\n]*\n?)+/, '');
}

/** Farbwelten-Markdown übernehmen (Frontmatter erfüllt das Zod-Schema). */
function copyFarbwelten() {
  const source = path.join(root, 'content/farbwelten');
  ensureDir(FARB_DIR);
  const files = fs.readdirSync(source).filter((name) => name.endsWith('.md'));
  const known = new Set(files.map((file) => file.replace(/\.md$/, '')));
  for (const file of files) {
    const target = path.join(FARB_DIR, file);
    const text = fs.readFileSync(path.join(source, file), 'utf8');
    const frontmatterEnd = text.indexOf('---', 3);
    const frontmatter = frontmatterEnd >= 0 ? text.slice(0, frontmatterEnd + 3) : '';
    const body = frontmatterEnd >= 0 ? text.slice(frontmatterEnd + 3) : text;
    fs.writeFileSync(target, `${frontmatter}\n${rewriteLinks(stripEditorialChrome(body), known)}`, 'utf8');
  }
  return files.sort();
}

/**
 * Links der Redaktionsquellen auf die neuen Adressen umschreiben.
 *
 * Notwendig, weil `.md`-Dateien im Build nicht mehr ausgeliefert werden: Ein
 * unveränderter Verweis `[Orange](orange.md)` wäre nach der Migration ein 404.
 * Regeln (bewusst eng, nichts wird geraten):
 * 1. `<bekannter-slug>.md` → `/farbwelten/<slug>.html` (bekannt = Datei im selben Verzeichnis).
 * 2. Andere relative Verweise auf Repo-Dateien (`../data/…`, `../tests/…`) verlieren
 *    nur ihr Ziel; der Linktext bleibt als Text stehen.
 */
function rewriteLinks(text, knownSlugs) {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
    const md = /^([\w-]+)\.md(#[^#]*)?$/.exec(href);
    if (md && knownSlugs.has(md[1])) {
      // Die Landing liegt auf `/farbwelten/`, nicht auf `/farbwelten/farbwelten.html`.
      if (md[1] === 'farbwelten') return `[${label}](/farbwelten/${md[2] ?? ''})`;
      return `[${label}](/farbwelten/${md[1]}.html${md[2] ?? ''})`;
    }
    if (/^(\.{1,2}\/|\/)/.test(href)) return label;
    return match;
  });
}

/** Inhalt von `<main>` aus einer Bestandsseite schneiden und Links normalisieren. */
function extractMain(html) {
  const match = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  if (!match) throw new Error('Kein <main>-Element gefunden');
  let inner = match[1].trim();
  // Relative Wurzel-Links der Bestandsseiten zeigen auf das Projektverzeichnis;
  // in Astro ist die Startseite `/`.
  inner = inner.replace(/href="\.\/"/g, 'href="/"');
  inner = inner.replace(/href="\.\.\/"/g, 'href="/"');
  return inner;
}

function writeLegal() {
  ensureDir(LEGAL_DIR);
  const written = [];
  for (const entry of LEGAL_SOURCES) {
    const html = fs.readFileSync(path.join(root, entry.file), 'utf8');
    const inner = extractMain(html);
    fs.writeFileSync(path.join(LEGAL_DIR, entry.target), `${inner}\n`, 'utf8');
    written.push({ source: entry.file, target: entry.target, bytes: Buffer.byteLength(inner) });
  }
  return written;
}

/**
 * Einzeldokumente, die im Bestand per `fetch` zur Laufzeit geladen wurden
 * (`docs/frequenz-quellen.md` für `#frequenzen/quellen`). Sie werden in die
 * Content-Collection kopiert, damit der Build sie rendert statt der Browser —
 * mit umgeschriebenen Verweisen (die Quelle selbst bleibt unverändert).
 */
function copyDokumente() {
  const source = path.join(root, 'docs/frequenz-quellen.md');
  const targetDir = path.join(root, 'src/content/dokumente');
  ensureDir(targetDir);
  const text = fs.readFileSync(source, 'utf8');
  fs.writeFileSync(path.join(targetDir, 'frequenz-quellen.md'), rewriteLinks(text, new Set()), 'utf8');
  return ['frequenz-quellen.md'];
}

(async () => {
  const articles = await writeArticles();
  const farbwelten = copyFarbwelten();
  const dokumente = copyDokumente();
  const legal = writeLegal();
  console.log(JSON.stringify({ articles, farbwelten, dokumente, legal }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
