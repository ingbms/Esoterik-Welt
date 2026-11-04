#!/usr/bin/env node
/**
 * Erzeugt die Redirect-Map für die alten Hash-Adressen.
 *
 * Warum generiert und nicht getippt: Der Bestand hat 140 (Stand A) bzw. 152
 * (Stand B) Hash-Ansichten. Eine handgepflegte Liste wäre beim ersten neuen
 * Glossarbegriff falsch. Quelle sind dieselben Datenmodule, aus denen die
 * Seiten gebaut werden — damit kann keine Ansicht ohne Ziel bleiben.
 *
 * Ausgabe:
 *   1. src/lib/legacy-routes.generated.ts  — die Map für den Client-Shim
 *   2. docs/redirects.md                   — die Tabelle für Menschen
 *
 * Aufruf: node scripts/generate-legacy-map.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const dataUrl = (file) => pathToFileURL(path.join(root, 'js/data', file)).href;

/** Alle Artikel-Slugs aus den migrierten Markdown-Dateien (legacyId → slug). */
function articleSlugs() {
  const dir = path.join(root, 'src/content/articles');
  const map = new Map();
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    const id = /^legacyId:\s*(\d+)$/m.exec(text);
    if (id) map.set(Number(id[1]), file.replace(/\.md$/, ''));
  }
  return map;
}

/** Slug-Liste eines Astrologie-Bereichs. */
function astrologieFamily(entries) {
  return entries.map((entry) => entry.slug);
}

(async () => {
  const astro = await import(dataUrl('astrologie.js'));
  const farb = await import(dataUrl('farbwelten.js'));
  const rad = await import(dataUrl('radiasthesie.js'));
  const RAD = rad.RADIASTHESIE;

  /** @type {Map<string, string>} */
  const map = new Map();
  const set = (hash, target, note = '') => {
    if (map.has(hash)) throw new Error(`Doppelter Hash: ${hash}`);
    map.set(hash, target);
    notes.set(hash, note);
  };
  /** @type {Map<string, string>} */
  const notes = new Map();

  // --- Hauptbereiche -------------------------------------------------------
  set('home', '/', 'Startseite');
  set('tarot', '/tarot.html', 'Tarot-Katalog');
  set('crystals', '/kristalle.html', 'Kristall-Katalog');
  set('moon', '/mondphasen.html', 'Mondphasen');
  set('runes', '/runen.html', 'Runen');
  set('blog', '/wissen/', 'Artikel-Liste');
  set('astrologie', '/astrologie/', 'Astrologie-Hub');
  set('frequenzen', '/frequenzen/', 'Frequenzen-Hub');
  set('pendeln', '/radiasthesie/', 'Bereichs-Landing (Entscheidung E2)');
  set('farbwelten', '/farbwelten/', 'Farbwelten-Landing');

  // --- Artikel -------------------------------------------------------------
  const articles = articleSlugs();
  for (const [id, slug] of [...articles].sort((a, b) => a[0] - b[0])) {
    set(`blog/${id}`, `/wissen/${slug}.html`, `Artikel ${id}`);
  }

  // --- Astrologie ----------------------------------------------------------
  const families = [
    { key: 'lernpfad', entries: astro.LERNPFAD, hub: '/astrologie/lernpfad/', label: 'Lernpfad' },
    { key: 'zeichen', entries: astro.ZEICHEN, hub: '/astrologie/zeichen/', label: 'Zeichen' },
    { key: 'faktoren', entries: astro.FAKTOREN, hub: '/astrologie/faktoren/', label: 'Faktoren' },
    { key: 'haeuser', entries: astro.HAEUSER, hub: '/astrologie/haeuser/', label: 'Häuser' },
    { key: 'aspekte', entries: astro.ASPEKTE, hub: '/astrologie/aspekte/', label: 'Aspekte' },
    { key: 'grundlagen', entries: astro.GRUNDLAGEN, hub: '/astrologie/grundlagen/', label: 'Grundlagen' },
    { key: 'beispiele', entries: astro.BEISPIELE, hub: '/astrologie/beispiele/', label: 'Lehrbeispiele' },
  ];
  for (const family of families) {
    set(`astrologie/${family.key}`, family.hub, `${family.label}-Index`);
    for (const slug of astrologieFamily(family.entries)) {
      set(`astrologie/${family.key}/${slug}`, `${family.hub}${slug}.html`, `${family.label}: ${slug}`);
    }
  }
  for (const page of ['faq', 'glossar', 'quellen', 'methodik', 'suche']) {
    set(`astrologie/${page}`, `/astrologie/${page}.html`, `Astrologie ${page}`);
  }

  // --- Frequenzen ----------------------------------------------------------
  set('frequenzen/labor', '/frequenzen/labor.html', 'Frequenzlabor');
  set('frequenzlabor', '/frequenzen/labor.html', 'Alias aus dem Bestand (history.replaceState)');
  set('frequenzen/quellen', '/frequenzen/quellen.html', 'Quellendokument');
  set('frequenzen/cymatics', '/frequenzen/cymatics.html', 'Chladni-Muster');
  set('frequenzen/meditation', '/frequenzen/meditation.html', 'Meditationssitzung');

  // --- Pendeln / Radiästhesie ---------------------------------------------
  for (const [slug, topic] of Object.entries(RAD.topics)) {
    set(`pendeln/${slug}`, `/radiasthesie/${slug}.html`, `Themenseite ${topic.title}`);
    for (const section of topic.sections) {
      set(`pendeln/${slug}/${section.id}`, `/radiasthesie/${slug}.html#${section.id}`, `Kapitel ${section.number}`);
    }
  }
  set('pendeln/glossar', '/radiasthesie/glossar.html', 'Glossar (Buchstabenfilter → Anker)');
  set('pendeln/quellen', '/radiasthesie/quellen.html', 'Quellen');
  set('pendeln/methodik', '/radiasthesie/methodik.html', 'Methodik');
  for (const tool of ['labor', 'studio', 'experiment', 'journal', 'suche']) {
    set(`pendeln/${tool}`, `/pendeln/${tool}.html`, `Werkstatt: ${tool}`);
  }

  // --- Farbwelten ----------------------------------------------------------
  for (const world of farb.FARBWELTEN) {
    const slug = world.route.replace(/^#/, '').replace(/^farbwelten\//, '');
    set(`farbwelten/${slug}`, `/farbwelten/${slug}.html`, `Farbseite ${world.name}`);
    for (const section of farb.SECTION_ORDER) {
      // Die Abschnittsanker heißen auf der neuen Seite wie die Markdown-Überschriften;
      // deshalb wird auf die Seite verwiesen, nicht auf einen geratenen Anker.
      set(`farbwelten/${slug}/${section.key}`, `/farbwelten/${slug}.html`, `Abschnitt ${section.label}`);
    }
  }
  for (const topic of farb.TOPIC_PAGES) {
    set(`farbwelten/${topic.slug}`, `/farbwelten/${topic.slug}.html`, `Themenseite ${topic.title}`);
  }
  set('farbwelten/chakren', '/farbwelten/chakren.html', 'Chakren-Sonderseite');
  set('chakren', '/farbwelten/chakren.html', 'Alias aus dem Bestand');
  set('farbwelten/lichtfrequenzen', '/farbwelten/lichtfrequenzen.html', 'Lichtfrequenzen');
  set('lichtfrequenzen', '/farbwelten/lichtfrequenzen.html', 'Alias aus dem Bestand');
  set('farbwelten/kompass', '/farbwelten/kompass.html', 'Farbkompass');
  set('farbwelten/farbmeditation', '/farbwelten/farbmeditation.html', 'Farbmeditation');
  set('farbwelten/zeitleiste', '/farbwelten/zeitleiste.html', 'Zeitleiste');
  for (const anchor of ['register', 'einstiege', 'methodik']) {
    set(`farbwelten/${anchor}`, '/farbwelten/', `Landing-Abschnitt ${anchor} (Anker: ${anchor})`);
  }

  // --- Ausgabe -------------------------------------------------------------
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de'));
  const ts = [
    '// GENERIERT von scripts/generate-legacy-map.cjs — nicht von Hand bearbeiten.',
    '// Quelle: js/data/{astrologie,farbwelten,radiasthesie}.js und src/content/articles.',
    '',
    'export const LEGACY_ROUTE_MAP: Readonly<Record<string, string>> = {',
    ...entries.map(([hash, target]) => `  ${JSON.stringify(hash)}: ${JSON.stringify(target)},`),
    '};',
    '',
    `export const LEGACY_ROUTE_COUNT = ${entries.length};`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'src/lib/legacy-routes.generated.ts'), ts, 'utf8');

  const familiesSummary = [
    ['Startseite und Bereiche', entries.filter(([h]) => !h.includes('/'))],
    ['Artikel', entries.filter(([h]) => h.startsWith('blog/'))],
    ['Astrologie', entries.filter(([h]) => h.startsWith('astrologie/'))],
    ['Frequenzen', entries.filter(([h]) => h.startsWith('frequenz'))],
    ['Pendeln / Radiästhesie', entries.filter(([h]) => h.startsWith('pendeln/'))],
    ['Farbwelten', entries.filter(([h]) => h.startsWith('farbwelten/') || h === 'chakren' || h === 'lichtfrequenzen')],
  ];

  const md = [
    '# Redirects und Altlink-Zuordnung',
    '',
    'Stand: generiert aus `scripts/generate-legacy-map.cjs` (nicht von Hand pflegen).',
    '',
    '## Warum es keine Server-Redirects gibt',
    '',
    'Der Bestand adressiert seine Ansichten über den URL-**Hash** (`#astrologie/zeichen/widder`).',
    'Fragmente werden vom Browser ausgewertet und **nie an den Server gesendet** — GitHub Pages,',
    'Netlify oder ein beliebiger Reverse-Proxy sehen nur `/`. Eine `_redirects`-Datei oder ein',
    '301 kann eine Hash-Route deshalb grundsätzlich nicht umleiten (Migrationsplan Risiko R1).',
    '',
    'Die Migration löst das an der einzigen Stelle, die den Hash sieht: ein Client-Shim im Layout',
    '(`src/lib/legacy-routes.ts`) prüft `location.hash` und ersetzt die Adresse per',
    '`location.replace()` durch die neue URL. Die Map ist generiert und deckt jede Adresse ab,',
    'die der Bestand routen konnte.',
    '',
    '## Dokumentadressen (unverändert)',
    '',
    "Die zwölf bestehenden Dokumente behalten ihren Pfad (Entscheidung E1, `build.format: 'file'`).",
    'Für sie sind **keine** Redirects nötig — das ist der Grund, warum die Migration ohne',
    '301-Kette auskommt:',
    '',
    '| Bestand | Neu | Status |',
    '|---|---|---|',
    '| `/` | `/` | identisch |',
    '| `/404.html` | `/404.html` | identisch |',
    '| `/impressum.html` | `/impressum.html` | identisch |',
    '| `/datenschutz.html` | `/datenschutz.html` | identisch |',
    '| `/haftung.html` | `/haftung.html` | identisch |',
    '| `/radiasthesie/` | `/radiasthesie/` | identisch |',
    '| `/radiasthesie/radiasthesie.html` | dito | identisch |',
    '| `/radiasthesie/pendeln.html` | dito | identisch |',
    '| `/radiasthesie/orakel.html` | dito | identisch |',
    '| `/radiasthesie/glossar.html` | dito | identisch |',
    '| `/radiasthesie/quellen.html` | dito | identisch |',
    '| `/radiasthesie/methodik.html` | dito | identisch |',
    '',
    '## Altlink-Map (Hash → neue URL)',
    '',
    `Gesamtzahl: **${entries.length}** Adressen.`,
    '',
    '| Familie | Anzahl | Beispiel |',
    '|---|---|---|',
    ...familiesSummary.map(([label, list]) => {
      const sample = list[0] ? `\`#${list[0][0]}\` → \`${list[0][1]}\`` : '—';
      return `| ${label} | ${list.length} | ${sample} |`;
    }),
    '',
    '### Vollständige Liste',
    '',
    '| Hash-Adresse | Neue Adresse | Anmerkung |',
    '|---|---|---|',
    ...entries.map(([hash, target]) => `| \`#${hash}\` | \`${target}\` | ${notes.get(hash) ?? ''} |`),
    '',
    '## Query-Parameter',
    '',
    'Die Shim-Funktion hängt eine vorhandene Query unverändert an das Ziel an',
    '(`#astrologie/glossar?q=mond` → `/astrologie/glossar.html?q=mond`). Seiten, die',
    'ihre Filter bislang aus der Query lasen, behalten damit ihre Adresse; die Auswertung',
    'erfolgt in der jeweiligen Seite (Suchseiten sind derzeit statische Verzeichnisse,',
    'siehe `docs/migration-offene-punkte.md`).',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'docs/redirects.md'), md, 'utf8');

  console.log(JSON.stringify({ entries: entries.length, file: 'src/lib/legacy-routes.generated.ts' }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
