'use strict';
// Vertragstests für den Artikel-Generator (data/articles/*.md → js/data/articles-markdown.js).
// Der Generator ist die einzige Brücke zwischen Redaktionsquelle und Blog; hier wird
// geprüft, was er zusichert: IDs, Frontmatter, Datums- und readTime-Regel, Excerpt an
// Satzgrenzen, Renderer-Konformität, Ablehnung nicht unterstützter Konstrukte und
// Idempotenz von --check.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const gen = require('../scripts/generate-articles-data.cjs');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'data', 'articles');
// Fester Bezugstag: Die Zukunftsprüfung darf nicht am Kalender des Testrechners hängen.
const NOW = new Date('2026-11-04T12:00:00Z');
const FIRST_ID = 11;

const readSource = (name) => fs.readFileSync(path.join(sourceDir, name), 'utf8');
const sourceFiles = fs
  .readdirSync(sourceDir)
  .filter((name) => /^article-\d+\.md$/.test(name))
  .sort((a, b) => Number.parseInt(a.replace(/\D+/g, ''), 10) - Number.parseInt(b.replace(/\D+/g, ''), 10));

const FIXTURE_meta = (index) =>
  [
    '---',
    `title: "Testartikel ${index}"`,
    `date: "2026-10-${String(index + 10).padStart(2, '0')}"`,
    'category: "Praxis"',
    'tags: ["test", "fixture"]',
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
  '',
].join('\n');

function writeFixtures(dir, count, overrides = {}) {
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= count; i += 1) {
    const name = `article-${String(i).padStart(2, '0')}.md`;
    const body = overrides[name] !== undefined ? overrides[name] : FIXTURE_BODY;
    fs.writeFileSync(path.join(dir, name), `${FIXTURE_meta(i)}${body}`, 'utf8');
  }
}

describe('Artikel-Generator gegen den echten Bestand', () => {
  let entries;
  let stats;

  beforeAll(() => {
    ({ entries, stats } = gen.collectEntries(sourceDir, { now: NOW }));
  });

  test('liest zwölf Artikel in Dateireihenfolge und vergibt die IDs 11–22', () => {
    expect(entries).toHaveLength(12);
    expect(entries.map((entry) => entry.id)).toEqual(Array.from({ length: 12 }, (_, index) => FIRST_ID + index));
    expect(entries[0].title).toBe('Die Major Arcana: Vom Narr bis zur Welt');
    expect(entries[11].title).toBe('Kristall-Grids für Manifestation');
  });

  test('übernimmt Titel, Datum und Tags aus dem Frontmatter', () => {
    const { meta } = gen.parseFrontmatter(readSource('article-05.md'), 'article-05.md');
    expect(meta.title).toBe('Runenlesen: Die 3-Runen-Legung erklärt');
    expect(meta.date).toBe('2026-10-27');
    expect(meta.category).toBe('Runen');
    expect(meta.tags).toEqual(['runen', 'elder-futhark', 'legung', 'orakel', 'symbol']);
    const entry = entries.find((item) => item.id === 15);
    expect(entry).toMatchObject({
      title: meta.title,
      date: meta.date,
      tags: meta.tags,
      category: 'runes',
    });
  });

  test('bildet die deutschen Kategorien auf die Filterwerte ab', () => {
    expect(gen.CATEGORY_MAP).toEqual({
      tarot: 'tarot',
      kristalle: 'crystals',
      mond: 'moon',
      runen: 'runes',
      praxis: 'rituals',
      astrologie: 'astrologie',
      vergleich: 'tarot',
    });
    const seen = new Set(entries.map((entry) => entry.category));
    // Alle Filterwerte, die die Markdown-Artikel belegen können, müssen vorkommen.
    for (const category of ['tarot', 'crystals', 'moon', 'runes', 'rituals', 'astrologie']) {
      expect(seen.has(category)).toBe(true);
    }
  });

  test('datiert ohne Zukunft und hält Reihenfolge und Tagesabstand ein', () => {
    const dates = entries.map((entry) => entry.date);
    expect(dates).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    ]);
    for (const date of dates) expect(new Date(`${date}T00:00:00Z`) <= NOW).toBe(true);
    for (let i = 1; i < dates.length; i += 1) {
      const previous = new Date(`${dates[i - 1]}T00:00:00Z`).getTime();
      const current = new Date(`${dates[i]}T00:00:00Z`).getTime();
      expect(current - previous).toBe(24 * 60 * 60 * 1000);
    }
  });

  test('berechnet readTime aus der Wortzahl (200 Wörter/Minute, aufgerundet)', () => {
    for (const item of stats) {
      const index = Number.parseInt(item.file.replace(/\D+/g, ''), 10) - 1;
      const entry = entries[index];
      const expected = `${Math.max(1, Math.ceil(item.words / 200))} Min`;
      expect(entry.readTime).toBe(expected);
      expect(entry.readTime).toMatch(/^\d+ Min$/);
    }
  });

  test('erzeugt Excerpts aus dem ersten Absatz: 200–240 Zeichen, ganzer Satz', () => {
    for (const [index, entry] of entries.entries()) {
      const text = readSource(sourceFiles[index]);
      const { body } = gen.parseFrontmatter(text, sourceFiles[index]);
      const heading = body.findIndex((line) => /^#\s+/.test(line.trim()));
      const paragraphLines = [];
      let started = false;
      for (const line of body.slice(heading + 1)) {
        const trimmed = line.trim();
        if (!trimmed) {
          if (started) break;
          continue;
        }
        started = true;
        paragraphLines.push(trimmed);
      }
      const paragraph = paragraphLines.join(' ');
      expect(entry.excerpt.length).toBeGreaterThanOrEqual(200);
      expect(entry.excerpt.length).toBeLessThanOrEqual(240);
      expect(paragraph.startsWith(entry.excerpt)).toBe(true);
      expect(entry.excerpt).toMatch(/[.!?]$/);
    }
  });

  test('liefert renderer-konforme Inhalte ohne H1', () => {
    for (const entry of entries) {
      expect(entry.content.startsWith('# ')).toBe(false);
      for (const line of entry.content.split('\n')) {
        const trimmed = line.trim();
        expect(trimmed.startsWith('>')).toBe(false);
        expect(trimmed.startsWith('|')).toBe(false);
        expect(trimmed.startsWith('![')).toBe(false);
        expect(trimmed.startsWith('```')).toBe(false);
        expect(trimmed).not.toContain('](');
        expect(/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)).toBe(false);
      }
      // Der Dialog setzt den Titel selbst; eine zweite H1 im Body wäre eine Dublette.
      expect(entry.content).not.toMatch(/^# /m);
    }
  });

  test('hat für jede Quelle genau einen Eintrag und umgekehrt (keine Waisen)', () => {
    expect(entries).toHaveLength(sourceFiles.length);
    const titles = new Map();
    for (const name of sourceFiles) {
      const { body } = gen.parseFrontmatter(readSource(name), name);
      const h1 = body.find((line) => /^#\s+/.test(line.trim()));
      titles.set(h1.trim().replace(/^#\s+/, ''), name);
    }
    for (const [index, entry] of entries.entries()) {
      expect(titles.get(entry.title)).toBe(sourceFiles[index]);
    }
    for (const name of sourceFiles) {
      const { meta } = gen.parseFrontmatter(readSource(name), name);
      expect(entries.filter((entry) => entry.title === meta.title)).toHaveLength(1);
    }
  });

  test('führt keine .bak- oder Fremddateien mehr in data/articles', () => {
    const others = fs.readdirSync(sourceDir).filter((name) => !/^article-\d+\.md$/.test(name));
    expect(others).toEqual([]);
  });

  test('hält die Artikelquellen aus dem Jekyll-Auslieferungspfad', () => {
    // Ohne Ausschluss rendert GitHub Pages aus jeder .md-Datei eine zweite
    // HTML-Seite (data/articles/article-01.html) — derselbe Text unter zwei URLs.
    const config = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
    expect(config).toMatch(/^exclude:/m);
    expect(config).toMatch(/^\s+-\s+data\/articles\/\s*$/m);
    // Eine eigene exclude-Liste ersetzt Jekylls Vorgabe: node_modules muss bleiben.
    expect(config).toMatch(/^\s+-\s+node_modules\s*$/m);
  });

  test('erreicht die Redaktionslänge von 600 bis 900 Wörtern', () => {
    for (const item of stats) {
      expect(item.words).toBeGreaterThanOrEqual(600);
      expect(item.words).toBeLessThanOrEqual(900);
    }
  });
});

describe('Ablehnung nicht unterstützter Konstrukte', () => {
  const cases = [
    ['Tabelle', '| a | b |', /Tabelle/],
    ['Blockquote', '> Hinweis', /Blockquote/],
    ['Link', 'Ein [Link](https://example.org).', /Link/],
    ['Bild', '![Alt](bild.png)', /Bild/],
    ['Trennlinie', '---', /Trennlinie/],
    ['Codeblock', '```js', /Codeblock/],
  ];

  test.each(cases)('%s wird mit Datei und Zeile abgelehnt', (label, snippet, pattern) => {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'articles-reject-'));
    try {
      writeFixtures(dir, 12, { 'article-03.md': `${FIXTURE_BODY}\n${snippet}\n` });
      expect(() => gen.collectEntries(dir, { now: NOW })).toThrow(pattern);
      // Die Meldung nennt die Datei und die konkrete Zeile.
      expect(() => gen.collectEntries(dir, { now: NOW })).toThrow(/article-03\.md:\d+/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('lehnt ein Datum in der Zukunft ab', () => {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'articles-future-'));
    try {
      writeFixtures(dir, 12);
      fs.writeFileSync(
        path.join(dir, 'article-02.md'),
        `${FIXTURE_meta(2).replace('2026-10-12', '2027-01-01')}${FIXTURE_BODY}`,
        'utf8'
      );
      expect(() => gen.collectEntries(dir, { now: NOW })).toThrow(/Zukunft/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('lehnt eine unbekannte Kategorie ab', () => {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'articles-category-'));
    try {
      writeFixtures(dir, 12);
      fs.writeFileSync(
        path.join(dir, 'article-02.md'),
        `${FIXTURE_meta(2).replace('category: "Praxis"', 'category: "Unbekannt"')}${FIXTURE_BODY}`,
        'utf8'
      );
      expect(() => gen.collectEntries(dir, { now: NOW })).toThrow(/nicht zugeordnet/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('--check und Excerpt-Kürzung', () => {
  test('--check ist nach dem Schreiben idempotent und erkennt Abweichungen', () => {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'articles-check-'));
    const target = path.join(dir, 'articles-markdown.js');
    try {
      writeFixtures(dir, 12);
      const { entries } = gen.collectEntries(dir, { now: NOW });
      fs.writeFileSync(target, gen.serialize(entries), 'utf8');
      const read = () => fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
      expect(read()).toBe(gen.serialize(entries).replace(/\r\n/g, '\n'));
      fs.appendFileSync(target, '\n// Manipulation\n', 'utf8');
      expect(read()).not.toBe(gen.serialize(entries).replace(/\r\n/g, '\n'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('kürzt nur an Satzgrenzen und nie mitten im Wort', () => {
    const paragraph =
      'Der erste Satz ist bewusst so lang gewählt, dass er allein schon einen erheblichen Teil der Zielmarke füllt. ' +
      'Der zweite Satz ergänzt das Bild um eine weitere Beobachtung, die für den Zusammenhang wichtig ist. ' +
      'Ein dritter Satz darf nur dann im Excerpt landen, wenn die Marke noch nicht erreicht ist.';
    const { excerpt, length } = gen.buildExcerpt(paragraph);
    expect(length).toBeGreaterThanOrEqual(200);
    expect(length).toBeLessThanOrEqual(240);
    expect(paragraph.startsWith(excerpt)).toBe(true);
    expect(excerpt).toMatch(/[.!?]$/);
    const rest = paragraph.slice(excerpt.length).trimStart();
    expect(rest === '' || /^[A-ZÄÖÜ]/.test(rest)).toBe(true);
  });

  test('serialisiert Sonderzeichen verlustfrei (Backtick, ${}, Backslash)', () => {
    const entry = {
      id: 11,
      title: "Titel mit 'Apostroph'",
      category: 'tarot',
      date: '2026-10-23',
      readTime: '4 Min',
      excerpt: 'Ein Excerpt mit `Code` und ${Variable}.',
      tags: ['a', 'b'],
      content: 'Zeile mit `code` und ${x} und \\ Backslash.',
    };
    const text = gen.serialize([entry]);
    // Das Modul muss gültiges JavaScript bleiben: Backtick und ${ sind escaped.
    expect(text).toContain('\\`code\\`');
    expect(text).toContain('\\${x}');
    // Und beim Auswerten kommt derselbe Inhalt zurück (Template-Literal-Roundtrip).
    const evaluator = new Function(`${text.replace('export const articlesMarkdown =', 'return')}`);
    const list = evaluator();
    expect(list[0].content).toBe(entry.content);
    expect(list[0].excerpt).toBe(entry.excerpt);
    expect(list[0].title).toBe(entry.title);
  });
});
