// Statische Themenseiten — Prüfung der erzeugten HTML-Dokumente ohne Browser.
//
// Geprüft wird, was tatsächlich in radiasthesie/*.html steht: Metadaten,
// Canonicals, strukturierte Daten, Brotkrümel, Überschriften, Bildtexte,
// interne Ziele und die Sitemap. Die Inhalte werden gegen den generierten
// Datensatz gehalten — eine veraltete Seite fällt damit auf.
//
// Die Dateien entstehen mit `npm run build` (bzw. direkt über
// scripts/generate-radiasthesie-pages.cjs) und liegen im Repository, weil
// GitHub Pages das Wurzelverzeichnis veröffentlicht.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DOCS = [
  ['landing', 'radiasthesie/index.html', 'radiasthesie/'],
  ['radiasthesie', 'radiasthesie/radiasthesie.html', 'radiasthesie/radiasthesie.html'],
  ['pendeln', 'radiasthesie/pendeln.html', 'radiasthesie/pendeln.html'],
  ['orakel', 'radiasthesie/orakel.html', 'radiasthesie/orakel.html'],
  ['glossar', 'radiasthesie/glossar.html', 'radiasthesie/glossar.html'],
  ['quellen', 'radiasthesie/quellen.html', 'radiasthesie/quellen.html'],
  ['methodik', 'radiasthesie/methodik.html', 'radiasthesie/methodik.html'],
];

const SITE = 'https://ingbms.github.io/Esoterik-Welt/';
let data;
let seo;
let pages;

const text = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');
const attr = (html, pattern) => {
  const match = pattern.exec(html);
  return match ? match[1] : null;
};

before(async () => {
  data = await import(pathToFileURL(path.join(root, 'js/data/radiasthesie.js')).href);
  seo = await import(pathToFileURL(path.join(root, 'js/modules/radiasthesie-seo.js')).href);
  pages = new Map();
  for (const [id, file, url] of DOCS) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} fehlt — npm run build ausführen`);
    pages.set(id, { id, file, url, html: fs.readFileSync(path.join(root, file), 'utf8') });
  }
});

test('sieben Dokumente, je ein Titel unter 60 Zeichen, eindeutig', () => {
  assert.equal(pages.size, seo.STATIC_DOCS.length);
  const titles = new Set();
  for (const page of pages.values()) {
    const title = attr(page.html, /<title>([^<]+)<\/title>/);
    assert.ok(title, `${page.id}: <title> fehlt`);
    assert.ok(title.length <= 60, `${page.id}: Titel ${title.length} Zeichen`);
    assert.ok(!titles.has(title), `${page.id}: doppelter Titel`);
    titles.add(title);
    const h1 = [...page.html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(h1.length, 1, `${page.id}: genau eine H1`);
    assert.ok(text(h1[0][1]).trim().length > 3, `${page.id}: H1 leer`);
  }
});

test('Meta-Description, Canonical und Open Graph sind konsistent', () => {
  for (const page of pages.values()) {
    const description = attr(page.html, /<meta name="description" content="([^"]*)"/);
    assert.ok(description, `${page.id}: Beschreibung fehlt`);
    assert.ok(description.length >= 100 && description.length <= 160, `${page.id}: ${description.length} Zeichen`);
    const canonical = attr(page.html, /<link rel="canonical" href="([^"]+)"/);
    assert.equal(canonical, SITE + page.url, `${page.id}: Canonical`);
    const ogUrl = attr(page.html, /<meta property="og:url" content="([^"]+)"/);
    assert.equal(ogUrl, canonical, `${page.id}: og:url`);
    const ogTitle = attr(page.html, /<meta property="og:title" content="([^"]+)"/);
    assert.equal(ogTitle, attr(page.html, /<title>([^<]+)<\/title>/), `${page.id}: og:title`);
    assert.equal(attr(page.html, /<meta property="og:type" content="([^"]+)"/), 'website');
    assert.equal(attr(page.html, /<meta name="robots" content="([^"]+)"/), 'index,follow');
    assert.equal(attr(page.html, /<html lang="([^"]+)"/), 'de');
    assert.ok(page.html.includes('<meta name="viewport"'));
  }
  assert.equal(
    new Set([...pages.values()].map((p) => attr(p.html, /<link rel="canonical" href="([^"]+)"/))).size,
    pages.size
  );
});

test('nur JSON-LD als Skript — keine JavaScript-Abhängigkeit', () => {
  for (const page of pages.values()) {
    const scripts = [...page.html.matchAll(/<script\b([^>]*)>/g)].map((match) => match[1]);
    assert.equal(scripts.length, 1, `${page.id}: genau ein Skript`);
    assert.match(scripts[0], /type="application\/ld\+json"/, `${page.id}: nur JSON-LD`);
    assert.ok(!/<script\b(?![^>]*application\/ld\+json)/i.test(page.html), `${page.id}: JavaScript gefunden`);
    assert.ok(!/onclick=|onload=/i.test(page.html), `${page.id}: Inline-Handler gefunden`);
    // Kerntext steht im Dokument, nicht in einer Datenablage.
    assert.ok(text(page.html).length > 3000, `${page.id}: zu wenig Text im HTML`);
  }
});

test('strukturierte Daten: WebPage/CollectionPage und BreadcrumbList ohne Fragmente', () => {
  for (const page of pages.values()) {
    const raw = attr(page.html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(raw, `${page.id}: JSON-LD fehlt`);
    const json = JSON.parse(raw);
    assert.equal(json['@context'], 'https://schema.org');
    const types = json['@graph'].map((node) => node['@type']);
    const expected = page.id === 'landing' ? 'CollectionPage' : 'WebPage';
    assert.ok(types.includes(expected), `${page.id}: ${expected} fehlt`);
    assert.ok(types.includes('BreadcrumbList'), `${page.id}: BreadcrumbList fehlt`);
    assert.ok(!types.includes('Article'), `${page.id}: Article ohne Veröffentlichungsdatum`);
    assert.ok(!types.includes('FAQPage'), `${page.id}: FAQPage ohne Frage-Antwort-Inhalte`);
    const pageNode = json['@graph'].find((node) => node['@id'] && node['@id'].endsWith('#webpage'));
    assert.ok(pageNode, `${page.id}: WebPage-Knoten fehlt`);
    assert.equal(pageNode.url, SITE + page.url);
    assert.equal(pageNode.inLanguage, 'de');
    assert.ok(pageNode.name && pageNode.description);
    const crumb = json['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
    assert.ok(crumb.itemListElement.length >= 2);
    const positions = crumb.itemListElement.map((entry) => entry.position);
    assert.deepEqual(
      positions,
      positions.map((_, index) => index + 1)
    );
    for (const entry of crumb.itemListElement) {
      assert.ok(entry.name && entry.name.trim().length > 2, `${page.id}: Brotkrümelname fehlt`);
      if (entry.item) {
        assert.ok(entry.item.startsWith(SITE), `${page.id}: relative Brotkrümeladresse`);
        assert.ok(!entry.item.includes('#'), `${page.id}: Fragment im Brotkrümel`);
      }
    }
    assert.equal(crumb.itemListElement.at(-1).item, undefined, `${page.id}: aktuelle Seite mit Adresse`);
    assert.ok(!JSON.stringify(json).includes('"#pendeln'), `${page.id}: Hash-Adresse im JSON-LD`);
  }
});

test('Themenseiten: Kapitel und Kerntexte stehen vollständig im HTML', () => {
  for (const slug of ['radiasthesie', 'pendeln', 'orakel']) {
    const page = pages.get(slug);
    const topic = data.RADIASTHESIE.topics[slug];
    const json = JSON.parse(attr(page.html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/));
    const node = json['@graph'].find((entry) => entry['@id'] && entry['@id'].endsWith('#webpage'));
    assert.equal(node.hasPart.length, topic.sections.length, `${slug}: hasPart`);
    for (const chapter of topic.sections) {
      assert.ok(page.html.includes(`id="${chapter.id}"`), `${slug}: Anker ${chapter.id} fehlt`);
      const heading = text(page.html).includes(chapter.title.replace(/\s+/g, ' '));
      assert.ok(heading, `${slug}: Kapitelüberschrift „${chapter.title}“ fehlt`);
      assert.ok(node.hasPart.some((part) => part.url === `${SITE}${page.url}#${chapter.id}`));
    }
    const firstParagraph = topic.sections
      .flatMap((chapter) => chapter.blocks)
      .find((block) => block.type === 'p' && block.text.length > 120);
    assert.ok(firstParagraph, `${slug}: kein Absatz gefunden`);
    const normalize = (value) =>
      String(value)
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-zA-Z#0-9]+;/g, ' ')
        .replace(/[^0-9A-Za-zÄÖÜäöüß ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const probe = normalize(firstParagraph.text).slice(0, 90);
    assert.ok(normalize(page.html).includes(probe), `${slug}: Kerntext nicht im HTML`);
    // Quellenmarker sind echte Links auf das Quellenverzeichnis.
    assert.ok(page.html.includes('quellen.html#quelle-Q'), `${slug}: Quellenverweise fehlen`);
  }
});

test('Glossar: DefinedTermSet deckt alle Begriffe ab, keine Suchmaske ohne Funktion', () => {
  const page = pages.get('glossar');
  assert.ok(!page.html.includes('type="search"'), 'Suchformular würde ohne JavaScript nichts tun');
  const json = JSON.parse(attr(page.html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/));
  const set = json['@graph'].find((node) => node['@type'] === 'DefinedTermSet');
  assert.ok(set, 'DefinedTermSet fehlt');
  const terms = data.RADIASTHESIE.glossary.flatMap((group) => group.terms);
  assert.equal(set.hasDefinedTerm.length, terms.length);
  for (const term of terms) {
    assert.ok(
      set.hasDefinedTerm.some((entry) => entry.name === term.term),
      `${term.term} fehlt im DefinedTermSet`
    );
    assert.ok(text(page.html).includes(term.term), `${term.term} fehlt im sichtbaren Glossar`);
  }
});

test('Brotkrümel im HTML entsprechen der JSON-LD-Hierarchie', () => {
  for (const page of pages.values()) {
    const nav = attr(page.html, /<nav class="astro-breadcrumb" aria-label="Brotkrümelnavigation">([\s\S]*?)<\/nav>/);
    assert.ok(nav, `${page.id}: Brotkrümel fehlt`);
    const labels = [...nav.matchAll(/<(?:a|span)[^>]*>([^<]+)</g)].map((match) =>
      match[1]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim()
    );
    const json = JSON.parse(attr(page.html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/));
    const crumb = json['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
    assert.deepEqual(
      labels,
      crumb.itemListElement.map((entry) => entry.name),
      `${page.id}: Brotkrümel weichen ab`
    );
    assert.equal(
      labels.at(-1),
      text(attr(page.html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/)).trim(),
      `${page.id}: letzter Brotkrümel ist nicht die H1`
    );
  }
});

test('Überschriftenordnung und IDs sind eindeutig', () => {
  for (const page of pages.values()) {
    const ids = [...page.html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page.id}: doppelte IDs`);
    const levels = [...page.html.matchAll(/<h([1-3])\b[^>]*>/g)].map((match) => Number(match[1]));
    assert.ok(levels.length >= 2, `${page.id}: zu wenige Überschriften`);
    let previous = levels[0];
    for (const level of levels) {
      assert.ok(level - previous <= 1, `${page.id}: Überschriftensprung h${previous} → h${level}`);
      previous = level;
    }
  }
});

test('Bilder: Alt-Text vorhanden, Dateien existieren, Maße gesetzt', () => {
  for (const page of pages.values()) {
    const images = [...page.html.matchAll(/<img\b([^>]*)>/g)].map((match) => match[1]);
    if (['landing', 'radiasthesie', 'pendeln', 'orakel'].includes(page.id)) {
      assert.ok(images.length >= 1, `${page.id}: keine Bilder`);
    }
    for (const image of images) {
      const alt = attr(image, /\balt="([^"]*)"/);
      const src = attr(image, /\bsrc="([^"]+)"/);
      assert.ok(alt && alt.trim().length > 20, `${page.id}: Alt-Text zu kurz (${src})`);
      assert.ok(!/^https?:/.test(src), `${page.id}: externes Bild`);
      const target = path.resolve(path.dirname(path.join(root, page.file)), src);
      assert.ok(fs.existsSync(target), `${page.id}: Bilddatei fehlt: ${src}`);
      assert.ok(/\bwidth="\d+"/.test(image) && /\bheight="\d+"/.test(image), `${page.id}: Maße fehlen (${src})`);
    }
  }
});

test('interne Links und Sprungziele sind auflösbar', () => {
  for (const page of pages.values()) {
    const docPath = path.join(root, page.file);
    const ids = new Set([...page.html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
    const links = [...page.html.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(links.length > 20, `${page.id}: zu wenige Links`);
    for (const href of links) {
      if (/^(?:https?:|mailto:|tel:|data:)/.test(href) || href === '#') continue;
      assert.ok(!href.startsWith('#pendeln'), `${page.id}: Hash-Route ${href}`);
      const [pathPart, fragment] = href.split('#');
      if (pathPart === '') {
        assert.ok(fragment && ids.has(fragment), `${page.id}: Sprungziel #${fragment} fehlt`);
        continue;
      }
      const target = path.resolve(path.dirname(docPath), pathPart);
      assert.ok(fs.existsSync(target), `${page.id}: Ziel fehlt: ${href}`);
      const stat = fs.statSync(target);
      const file = stat.isDirectory() ? path.join(target, 'index.html') : target;
      assert.ok(fs.existsSync(file), `${page.id}: Ziel ohne index.html: ${href}`);
      if (fragment) {
        // Fragmente in index.html sind SPA-Routen (#pendeln/labor, #tarot),
        // keine Sprungmarken; alles andere muss als id existieren.
        if (path.basename(file) !== 'index.html') {
          const targetHtml = fs.readFileSync(file, 'utf8');
          assert.ok(targetHtml.includes(`id="${fragment}"`), `${page.id}: Sprungziel ${href} fehlt`);
        }
      }
    }
  }
});

test('Sitemap: nur echte Dokumente, vollständig, ohne Fragmente', () => {
  const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locs.length, 11);
  assert.equal(new Set(locs).size, locs.length, 'doppelte Sitemap-Adressen');
  for (const loc of locs) {
    assert.ok(loc.startsWith(SITE), `fremde Adresse: ${loc}`);
    assert.ok(!loc.includes('#'), `Fragment in der Sitemap: ${loc}`);
    const relative = loc.slice(SITE.length);
    const file = relative === '' || relative.endsWith('/') ? `${relative}index.html` : relative;
    assert.ok(fs.existsSync(path.join(root, file)), `Sitemap-Ziel fehlt: ${loc}`);
  }
  for (const page of pages.values()) {
    assert.ok(locs.includes(SITE + page.url), `${page.id}: fehlt in der Sitemap`);
  }
  assert.ok(xml.includes('<lastmod>'), 'lastmod fehlt');
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${SITE}sitemap.xml`));
});

test('Fotos deklarieren die gemessene Slotbreite (RAD-13/F2)', () => {
  // Gemessen im Browser: 680 CSS px ab 768 px Viewport, darunter 100vw - 48 px.
  // Die alte Angabe „(max-width: 640px) 100vw, 520px“ ließ den Browser die
  // 520er-Datei in einen 680er-Slot laden (1,31-fache Hochskalierung).
  const sizes = '(max-width: 728px) calc(100vw - 48px), 680px';
  let quellen = 0;
  for (const page of pages.values()) {
    assert.doesNotMatch(page.html, /sizes="\(max-width: 640px\) 100vw, 520px"/, `${page.id}: alte Slotbreite`);
    for (const match of page.html.matchAll(/<source [^>]*sizes="([^"]+)"/g)) {
      quellen += 1;
      assert.equal(match[1], sizes, `${page.id}: sizes passt nicht zur gemessenen Slotbreite`);
    }
  }
  assert.ok(quellen >= 8, `zu wenige Bildquellen geprüft: ${quellen}`);
});

test('Fließtext-Links sind zusätzlich zur Farbe erkennbar (WCAG 1.4.1, RAD-13/F1)', () => {
  // axe-core meldete link-in-text-block mit 1,07:1 Kontrast; Unterstreichung
  // ist die zulässige zweite Kennzeichnung. Die Regeln müssen in beiden
  // Stylesheets stehen, weil Modul und statische Dokumente sie laden.
  const modul = fs.readFileSync(path.join(root, 'css/radiasthesie.css'), 'utf8');
  for (const selektor of [
    '.astro-source-meta a',
    '.rad-photo-credit a',
    '.astro-text a:not(.btn):not(.textlink)',
    '.astro-panel-note a',
    '.rad-media-credits a',
  ]) {
    assert.ok(modul.includes(selektor), `css/radiasthesie.css: Regel für ${selektor} fehlt`);
  }
  assert.match(modul, /\.astro-source-meta a,[\s\S]{0,400}?text-decoration: underline/);
  const statisch = fs.readFileSync(path.join(root, 'css/radiasthesie-statisch.css'), 'utf8');
  assert.match(statisch, /\.rad-static-footer a \{[^}]*text-decoration: underline/);
  assert.match(statisch, /\.rad-static-main p a[^{]*\{[^}]*text-decoration: underline/);
});

test('keine erfundenen Titel- oder Beschreibungsbehauptungen', () => {
  for (const page of pages.values()) {
    const content = text(page.html).toLowerCase();
    assert.ok(
      !/garantiert|garantierte|platz 1|ranking|zitiert von ki|garantiert zitiert/.test(content),
      `${page.id}: Werbeversprechen`
    );
    // Evidenz statt Wirkungsversprechen.
    if (['radiasthesie', 'pendeln', 'orakel', 'landing'].includes(page.id)) {
      assert.ok(/nicht belegt|keine .*beleg|ohne wirkungsversprechen/i.test(content), `${page.id}: Einordnung fehlt`);
    }
  }
});
