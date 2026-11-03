'use strict';
// Artikel — Redaktionsquelle (Markdown) → Datensatz für den Blog.
//
// Die zwölf Artikel liegen als Markdown unter data/articles/ und bleiben die
// Quelle. Dieses Skript liest Frontmatter und Body und erzeugt daraus
// js/data/articles-markdown.js mit den IDs 11–22 (Katalog CNT-ART-011 …
// CNT-ART-022). js/data/articles.js bleibt unangetastet: Die zehn kuratierten
// Einträge sind kein Generatorprodukt.
//
// Aufruf:
//   node scripts/generate-articles-data.cjs            # schreiben
//   node scripts/generate-articles-data.cjs --check    # nur prüfen, Exit 1 bei Abweichung
//   node scripts/generate-articles-data.cjs --self-test
//
// Abgeleitete Felder (bewusst nicht im Frontmatter, damit es nur eine Wahrheit gibt):
//   readTime = ceil(Wörter / 200) im Format "N Min"
//   excerpt  = erster Absatz, an Satzgrenzen auf 200–240 Zeichen geschnitten
//   category = deutscher Frontmatter-Wert über CATEGORY_MAP auf den Filterwert
//
// Der Renderer (js/article-content.js) versteht nur #–###, Listen, **fett**,
// *kursiv* und `code`. Nicht unterstützte Konstrukte werden hier mit
// Datei:Zeile abgelehnt, statt sie still durchzureichen.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'articles');
const TARGET = path.join(ROOT, 'js', 'data', 'articles-markdown.js');

const FIRST_ID = 11;
const ARTICLE_COUNT = 12;
const WORDS_PER_MINUTE = 200;
const EXCERPT_MIN = 200;
const EXCERPT_MAX = 240;

// Deutsche Frontmatter-Kategorie → Filterwert in #categoryFilter.
// "Vergleich" ist der Tarot-vs.-Runen-Artikel und läuft unter Tarot; das hält
// ihn im Filter sichtbar, ohne eine achte Kategorie ohne zweite Quelle anzulegen.
const CATEGORY_MAP = {
  tarot: 'tarot',
  kristalle: 'crystals',
  mond: 'moon',
  runen: 'runes',
  praxis: 'rituals',
  astrologie: 'astrologie',
  vergleich: 'tarot',
};

const FORBIDDEN = [
  { name: 'Blockquote (> …)', test: (line) => /^>\s?/.test(line) || line === '>' },
  { name: 'Tabelle (| … |)', test: (line) => line.startsWith('|') },
  { name: 'Bild (![…])', test: (line) => /^!\[/.test(line) },
  { name: 'Link (](…))', test: (line) => line.includes('](') },
  { name: 'Trennlinie (---, ***, ___)', test: (line) => /^(-{3,}|\*{3,}|_{3,})$/.test(line) },
  { name: 'Codeblock (```)', test: (line) => line.startsWith('```') },
];

const REQUIRED_FIELDS = ['title', 'date', 'category', 'tags'];

class ArticleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ArticleError';
  }
}

function fail(file, line, message) {
  const where = line ? `${file}:${line}` : file;
  throw new ArticleError(`${where}: ${message}`);
}

/** Zerlegt einen Frontmatter-Wert: "…", '…', [a, b] oder nackter Skalar. */
function parseValue(raw) {
  const text = String(raw).trim();
  if (text.startsWith('[') && text.endsWith(']')) {
    const inner = text.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(',')
      .map((part) => parseValue(part))
      .filter((part) => part !== '');
  }
  if (
    (text.startsWith('"') && text.endsWith('"') && text.length >= 2) ||
    (text.startsWith("'") && text.endsWith("'") && text.length >= 2)
  ) {
    return text.slice(1, -1);
  }
  return text;
}

/**
 * Liest YAML-Frontmatter (bewusst nur die eingesetzte Teilmenge: key: wert,
 * key: [a, b], key: "wert") und gibt Body samt erster Body-Zeile zurück.
 */
function parseFrontmatter(text, file) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') fail(file, 1, 'Frontmatter muss mit "---" beginnen');
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === '---') {
      end = i;
      break;
    }
  }
  if (end < 0) fail(file, 1, 'Frontmatter ohne schließendes "---"');
  const meta = {};
  for (let i = 1; i < end; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.trim().startsWith('#')) continue;
    const match = /^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!match) fail(file, i + 1, `Frontmatter-Zeile nicht lesbar: ${line.trim()}`);
    meta[match[1]] = parseValue(match[2]);
  }
  return { meta, body: lines.slice(end + 1), bodyStartLine: end + 2 };
}

/** Prüft jede Body-Zeile gegen die Konstrukte, die der Renderer nicht kennt. */
function assertSupportedConstructs(lines, firstLine, file) {
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    for (const rule of FORBIDDEN) {
      if (rule.test(trimmed)) fail(file, firstLine + index, `${rule.name} wird vom Renderer nicht unterstützt`);
    }
  });
}

/** Zählt Wörter als Folgen aus Buchstaben und Ziffern (keine Markdown-Zeichen). */
function countWords(text) {
  const matches = String(text).match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
}

function readTimeFor(words) {
  return `${Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))} Min`;
}

/** Zerlegt einen Absatz in ganze Sätze (Satzzeichen bleibt am Satz). */
function splitSentences(paragraph) {
  const parts = String(paragraph).match(/[^.!?]+[.!?]+["'“”‘’)\]]*|[^.!?]+$/g);
  return (parts || [paragraph]).map((part) => part.trim()).filter(Boolean);
}

/**
 * Kürzt den ersten Absatz an einer Satzgrenze auf 200–240 Zeichen.
 * Kein Schnitt mitten im Wort: Es werden nur ganze Sätze angehängt.
 */
function buildExcerpt(paragraph) {
  const sentences = splitSentences(paragraph);
  let excerpt = '';
  for (const sentence of sentences) {
    if (countWords(excerpt) && excerpt.length >= EXCERPT_MIN) break;
    excerpt = excerpt ? `${excerpt} ${sentence}` : sentence;
    if (excerpt.length >= EXCERPT_MIN) break;
  }
  return { excerpt, length: excerpt.length, sentences: sentences.length };
}

/** Erster Absatz des Bodys (erste zusammenhängende Nicht-Überschriften-Zeilen). */
function firstParagraph(lines) {
  const collected = [];
  let started = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (started) break;
      continue;
    }
    if (/^#{1,6}\s/.test(trimmed) || /^(?:[-*]|\d+\.)\s/.test(trimmed)) {
      if (started) break;
      continue;
    }
    started = true;
    collected.push(trimmed);
  }
  return collected.join(' ');
}

/**
 * Baut aus einem Quelldokument einen Blogeintrag.
 * Prüft Pflichtfelder, Datum, Kategorie, H1=title und die Renderer-Grenzen.
 */
function buildEntry({ file, text, id, now }) {
  const { meta, body, bodyStartLine } = parseFrontmatter(text, file);
  for (const field of REQUIRED_FIELDS) {
    if (meta[field] === undefined || meta[field] === '') fail(file, 1, `Pflichtfeld ${field} fehlt`);
  }

  const titleLines = body.map((line, index) => ({ line, index })).filter(({ line }) => /^#\s+/.test(line.trim()));
  const heading = body.findIndex((line) => /^#\s+/.test(line.trim()));
  if (heading < 0) fail(file, bodyStartLine, 'H1 mit dem Titel fehlt');
  assertSupportedConstructs(body, bodyStartLine, file);
  const h1 = body[heading].trim().replace(/^#\s+/, '');
  if (h1 !== meta.title) {
    fail(file, bodyStartLine + heading, `H1 ("${h1}") und Frontmatter-title ("${meta.title}") weichen ab`);
  }
  if (titleLines.length > 1) {
    fail(file, bodyStartLine + titleLines[1].index, 'Mehr als eine H1 im Body');
  }

  const contentLines = body.slice(heading + 1);
  while (contentLines.length && !contentLines[0].trim()) contentLines.shift();
  while (contentLines.length && !contentLines[contentLines.length - 1].trim()) contentLines.pop();
  const content = contentLines.join('\n');
  if (!content.trim()) fail(file, bodyStartLine + heading, 'Body enthält nach der H1 keinen Text');

  const date = String(meta.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(file, 1, `Datum "${date}" ist nicht im Format YYYY-MM-DD`);
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    fail(file, 1, `Datum "${date}" ist kein gültiger Kalendertag`);
  }
  const reference = now || new Date();
  const today = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  if (parsedDate > today)
    fail(file, 1, `Datum "${date}" liegt in der Zukunft (Stand ${today.toISOString().slice(0, 10)})`);

  const categoryRaw = String(meta.category).trim();
  const category = CATEGORY_MAP[categoryRaw.toLowerCase()];
  if (!category) {
    fail(file, 1, `Kategorie "${categoryRaw}" ist nicht zugeordnet (erlaubt: ${Object.keys(CATEGORY_MAP).join(', ')})`);
  }

  const tags = Array.isArray(meta.tags) ? meta.tags.map((tag) => String(tag)) : [];
  if (!tags.length) fail(file, 1, 'tags muss eine nicht-leere Liste sein');

  const paragraph = firstParagraph(body.slice(heading + 1));
  if (!paragraph) fail(file, bodyStartLine + heading, 'Erster Absatz für den Excerpt fehlt');
  const { excerpt, length: excerptLength } = buildExcerpt(paragraph);
  if (excerptLength < EXCERPT_MIN) {
    fail(
      file,
      bodyStartLine + heading,
      `Erster Absatz zu kurz für einen Excerpt (${excerptLength} < ${EXCERPT_MIN} Zeichen)`
    );
  }

  const words = countWords(content);
  const readTime = readTimeFor(words);
  if (meta.readTime !== undefined && String(meta.readTime) !== String(Number.parseInt(readTime, 10))) {
    fail(file, 1, `Frontmatter-readTime (${meta.readTime}) passt nicht zur Wortzahl (${words} Wörter → "${readTime}")`);
  }

  return {
    entry: {
      id,
      title: String(meta.title),
      category,
      date,
      readTime,
      excerpt,
      tags,
      content,
    },
    stats: { file, words, excerptLength, minutes: Number.parseInt(readTime, 10) },
  };
}

/** Liest alle Artikel in Dateireihenfolge und vergibt die IDs 11–22. */
function collectEntries(sourceDir, { now } = {}) {
  const files = fs
    .readdirSync(sourceDir)
    .filter((name) => /^article-\d+\.md$/.test(name))
    .sort((a, b) => Number.parseInt(a.replace(/\D+/g, ''), 10) - Number.parseInt(b.replace(/\D+/g, ''), 10));
  if (files.length !== ARTICLE_COUNT) {
    throw new ArticleError(
      `${path.relative(ROOT, sourceDir)}: ${files.length} Artikel gefunden, erwartet ${ARTICLE_COUNT}`
    );
  }
  files.forEach((name, index) => {
    const expected = `article-${String(index + 1).padStart(2, '0')}.md`;
    if (name !== expected) {
      throw new ArticleError(`${path.relative(ROOT, sourceDir)}: Dateiname ${name} erwartet ${expected}`);
    }
  });

  const entries = [];
  const stats = [];
  for (const [index, name] of files.entries()) {
    const file = path.join(sourceDir, name);
    const relative = path.relative(ROOT, file).split(path.sep).join('/');
    const built = buildEntry({ file: relative, text: fs.readFileSync(file, 'utf8'), id: FIRST_ID + index, now });
    entries.push(built.entry);
    stats.push(built.stats);
  }
  return { entries, stats };
}

function escapeTemplate(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function quote(text) {
  return `'${String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Serialisiert die Einträge als ES-Modul (stabile, prettierverträgliche Form). */
function serialize(entries) {
  const header = [
    '// GENERATED FILE — do not edit by hand.',
    '// Source: data/articles/article-01.md … article-12.md (Redaktionsquelle, versioniert)',
    '// Regenerate: npm run data:articles',
    '// Check: node scripts/generate-articles-data.cjs --check',
    '// IDs 11–22 entsprechen den Katalogeinträgen CNT-ART-011 … CNT-ART-022.',
    'export const articlesMarkdown = [',
  ].join('\n');
  const body = entries
    .map((entry) =>
      [
        '  {',
        `    id: ${entry.id},`,
        `    title: ${quote(entry.title)},`,
        `    category: ${quote(entry.category)},`,
        `    date: ${quote(entry.date)},`,
        `    readTime: ${quote(entry.readTime)},`,
        `    excerpt: ${quote(entry.excerpt)},`,
        `    tags: [${entry.tags.map(quote).join(', ')}],`,
        `    content: \`${escapeTemplate(entry.content)}\`,`,
        '  },',
      ].join('\n')
    )
    .join('\n');
  return `${header}\n${body}\n];\n`;
}

function normalize(text) {
  return String(text).replace(/\r\n/g, '\n');
}

function report(stats) {
  const rows = stats.map(
    (item) => `${item.file}: ${item.words} Wörter, ${item.minutes} Min, Excerpt ${item.excerptLength} Zeichen`
  );
  console.log(rows.join('\n'));
  const words = stats.map((item) => item.words);
  console.log(
    `\n${stats.length} Artikel, ${Math.min(...words)}–${Math.max(...words)} Wörter, ` +
      `${stats.filter((item) => item.words < 600).length} unter 600 Wörtern.`
  );
}

function runWrite({ sourceDir, target, now }) {
  const { entries, stats } = collectEntries(sourceDir, { now });
  fs.writeFileSync(target, serialize(entries), 'utf8');
  report(stats);
  console.log(`\nGeschrieben: ${path.relative(ROOT, target)}`);
}

function runCheck({ sourceDir, target, now }) {
  const { entries, stats } = collectEntries(sourceDir, { now });
  const expected = normalize(serialize(entries));
  if (!fs.existsSync(target)) {
    console.error(`FEHLER: ${path.relative(ROOT, target)} fehlt — "npm run data:articles" ausführen.`);
    return 1;
  }
  const actual = normalize(fs.readFileSync(target, 'utf8'));
  if (actual === expected) {
    report(stats);
    console.log(`\nOK: ${path.relative(ROOT, target)} ist aktuell.`);
    return 0;
  }
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const at = expectedLines.findIndex((line, index) => line !== actualLines[index]);
  const line = at < 0 ? Math.min(expectedLines.length, actualLines.length) : at;
  console.error(`FEHLER: ${path.relative(ROOT, target)} weicht von den Quellen ab (Zeile ${line + 1}).`);
  console.error(`  erwartet: ${(expectedLines[line] || '').slice(0, 160)}`);
  console.error(`  gefunden: ${(actualLines[line] || '').slice(0, 160)}`);
  console.error('  "npm run data:articles" ausführen und das Ergebnis committen.');
  return 1;
}

// ---------------------------------------------------------------- Selbsttest

function assert(condition, message) {
  if (!condition) throw new Error(`Selbsttest: ${message}`);
}

function expectRejected(label, files, pattern) {
  const dir = files.dir;
  try {
    collectEntries(dir, { now: files.now });
  } catch (error) {
    assert(error instanceof ArticleError, `${label}: falscher Fehlertyp (${error.message})`);
    assert(pattern.test(error.message), `${label}: Meldung ohne Erwartung (${error.message})`);
    return;
  }
  throw new Error(`Selbsttest: ${label} wurde nicht abgelehnt`);
}

const FIXTURE_META = (index) =>
  [
    '---',
    `title: "Testartikel ${index}"`,
    `date: "2026-10-${String(index + 10).padStart(2, '0')}"`,
    'category: "Praxis"',
    'tags: ["test", "fixture"]',
    'readTime: 1',
    '---',
    `# Testartikel ${index}`,
    '',
  ].join('\n');

const FIXTURE_BODY = [
  'Dies ist ein Testabsatz, der lang genug ist, um einen Excerpt zu erzeugen. Er enthält mehrere Sätze,',
  'damit die Kürzung an einer Satzgrenze geprüft werden kann. Der dritte und letzte Satz schließt den Absatz ab.',
  '',
  '## Abschnitt',
  '',
  '- ein Punkt',
  '- noch ein Punkt',
  '',
  'Ein **fetter** und ein *kursiver* Text mit `code`.',
  '',
].join('\n');

function writeFixtureDir(dir, count, extra = {}) {
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= count; i += 1) {
    const name = `article-${String(i).padStart(2, '0')}.md`;
    const body = extra[name] !== undefined ? extra[name] : FIXTURE_BODY;
    fs.writeFileSync(path.join(dir, name), `${FIXTURE_META(i)}${body}`, 'utf8');
  }
}

function selfTest() {
  const base = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'articles-selftest-'));
  const now = new Date('2026-11-04T12:00:00Z');
  let checks = 0;
  try {
    // 1) Frontmatter-Teilmenge
    const parsed = parseFrontmatter(FIXTURE_META(1) + FIXTURE_BODY, 'fixture.md');
    assert(parsed.meta.title === 'Testartikel 1', 'title nicht gelesen');
    assert(parsed.meta.category === 'Praxis', 'category nicht gelesen');
    assert(Array.isArray(parsed.meta.tags) && parsed.meta.tags.length === 2, 'tags nicht als Liste gelesen');
    assert(parsed.meta.readTime === '1', 'readTime nicht gelesen');
    assert(parsed.bodyStartLine === 8, `bodyStartLine falsch (${parsed.bodyStartLine})`);
    checks += 1;

    // 2) ID-Vergabe 11–22 in Dateireihenfolge
    const dir = path.join(base, 'ok');
    writeFixtureDir(dir, ARTICLE_COUNT);
    const { entries } = collectEntries(dir, { now });
    assert(entries.length === ARTICLE_COUNT, 'nicht alle Artikel gelesen');
    assert(
      entries.every((entry, index) => entry.id === FIRST_ID + index),
      'IDs nicht fortlaufend ab 11'
    );
    assert(entries[0].category === 'rituals', 'Kategorie Praxis nicht auf rituals abgebildet');
    assert(entries[0].content.startsWith('Dies ist ein Testabsatz'), 'H1 nicht aus dem Content entfernt');
    checks += 1;

    // 3) Ablehnung nicht unterstützter Konstrukte mit Datei:Zeile
    const cases = [
      ['Tabelle', '| a | b |\n|---|---|\n| 1 | 2 |', /article-03\.md:\d+: Tabelle/],
      ['Blockquote', '> Hinweis', /article-03\.md:\d+: Blockquote/],
      ['Link', 'Ein [Link](https://example.org).', /article-03\.md:\d+: Link/],
      ['Bild', '![Alt](bild.png)', /article-03\.md:\d+: Bild/],
      ['Trennlinie', '---', /article-03\.md:\d+: Trennlinie/],
      ['Codeblock', '```js', /article-03\.md:\d+: Codeblock/],
    ];
    for (const [label, snippet, pattern] of cases) {
      const caseDir = path.join(base, `bad-${label}`);
      writeFixtureDir(caseDir, ARTICLE_COUNT, { 'article-03.md': `${FIXTURE_BODY}\n${snippet}\n` });
      expectRejected(label, { dir: caseDir, now }, pattern);
      checks += 1;
    }

    // 4) Excerpt an Satzgrenzen, 200–240 Zeichen, kein Wortbruch
    const longParagraph =
      'Der erste Satz ist bewusst so lang gewählt, dass er allein schon einen erheblichen Teil der Zielmarke füllt. ' +
      'Der zweite Satz ergänzt das Bild um eine weitere Beobachtung, die für den Zusammenhang wichtig ist. ' +
      'Ein dritter Satz darf nur dann im Excerpt landen, wenn die Marke noch nicht erreicht ist.';
    const built = buildExcerpt(longParagraph);
    assert(built.length >= EXCERPT_MIN, `Excerpt zu kurz (${built.length})`);
    assert(built.length <= EXCERPT_MAX, `Excerpt zu lang (${built.length})`);
    assert(/[.!?]$/.test(built.excerpt), 'Excerpt endet nicht auf einem Satzzeichen');
    assert(longParagraph.includes(built.excerpt), 'Excerpt ist keine zusammenhängende Passage');
    checks += 1;

    // 5) --check ist idempotent und erkennt Abweichungen
    const target = path.join(base, 'articles-markdown.js');
    runWriteQuiet({ sourceDir: dir, target, now });
    assert(runCheckQuiet({ sourceDir: dir, target, now }) === 0, '--check meldet Abweichung nach dem Schreiben');
    fs.appendFileSync(target, '\n// verändert\n', 'utf8');
    assert(runCheckQuiet({ sourceDir: dir, target, now }) === 1, '--check erkennt Änderung nicht');
    fs.rmSync(target);
    assert(runCheckQuiet({ sourceDir: dir, target, now }) === 1, '--check erkennt fehlende Datei nicht');
    checks += 1;

    // 6) Datum in der Zukunft und unbekannte Kategorie werden abgelehnt
    const futureDir = path.join(base, 'future');
    writeFixtureDir(futureDir, ARTICLE_COUNT);
    fs.writeFileSync(
      path.join(futureDir, 'article-02.md'),
      `${FIXTURE_META(2).replace('2026-10-12', '2027-01-01')}${FIXTURE_BODY}`,
      'utf8'
    );
    expectRejected('Zukunftsdatum', { dir: futureDir, now }, /article-02\.md:1: Datum .* Zukunft/);
    const categoryDir = path.join(base, 'category');
    writeFixtureDir(categoryDir, ARTICLE_COUNT);
    fs.writeFileSync(
      path.join(categoryDir, 'article-02.md'),
      `${FIXTURE_META(2).replace('category: "Praxis"', 'category: "Unbekannt"')}${FIXTURE_BODY}`,
      'utf8'
    );
    expectRejected(
      'unbekannte Kategorie',
      { dir: categoryDir, now },
      /article-02\.md:1: Kategorie .* nicht zugeordnet/
    );
    checks += 2;

    console.log(`Selbsttest OK: ${checks} Prüfungen bestanden.`);
    return 0;
  } catch (error) {
    console.error(`Selbsttest FEHLGESCHLAGEN: ${error.message}`);
    return 1;
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
}

/** Wie runWrite, aber ohne Ausgabe (für den Selbsttest). */
function runWriteQuiet(options) {
  const { entries } = collectEntries(options.sourceDir, { now: options.now });
  fs.writeFileSync(options.target, serialize(entries), 'utf8');
}

/** Wie runCheck, aber ohne Ausgabe (für den Selbsttest). */
function runCheckQuiet(options) {
  const { entries } = collectEntries(options.sourceDir, { now: options.now });
  if (!fs.existsSync(options.target)) return 1;
  const expected = normalize(serialize(entries));
  const actual = normalize(fs.readFileSync(options.target, 'utf8'));
  return actual === expected ? 0 : 1;
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();
  const options = { sourceDir: SOURCE_DIR, target: TARGET };
  if (argv.includes('--check')) return runCheck(options);
  runWrite(options);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`FEHLER: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  CATEGORY_MAP,
  parseFrontmatter,
  assertSupportedConstructs,
  countWords,
  buildExcerpt,
  collectEntries,
  serialize,
  main,
};
