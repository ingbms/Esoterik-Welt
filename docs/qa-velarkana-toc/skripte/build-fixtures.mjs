/**
 * Baut zwei Prüf-Fixtures in `dist/__qa__/` (gitignoriert, keine Produktdatei):
 *
 * 1. `ssr-duplikate.html` — serverseitiger Pfad mit doppelten Überschriften,
 *    Umlauten, Sonderzeichen und Inline-Markup; TOC-Liste wird mit der echten
 *    Funktion `renderTocList()` erzeugt.
 * 2. `dynamic.html` — `dynamic`-Modus (AK-I1): Überschriften ohne IDs,
 *    Liste wird clientseitig mit dem gebündelten `src/scripts/toc.ts` aufgebaut.
 *
 * Grundlage ist die echte Pilotseite (Kopf, Header, Footer, CSS), nur der
 * Seitenkörper wird ersetzt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DIST, QA_DIR, launchChromium, writeJson } from './lib.mjs';
import * as toc from './fixture/lib/toc.ts';

const { buildTocTree, flattenToc, renderTocList } = toc;
const OUT = path.join(DIST, '__qa__');
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(QA_DIR, 'fixture', 'scripts'), path.join(OUT, 'scripts'), { recursive: true });

const pilotHtml = fs.readFileSync(path.join(DIST, 'frequenzen', 'quellen.html'), 'utf8');

/* --- SSR-Fixture --------------------------------------------------------- */
const ssrHeadings = [
  { depth: 2, text: 'Gleicher Titel' },
  { depth: 2, text: 'Gleicher Titel' },
  { depth: 2, text: 'Gleicher Titel' },
  { depth: 2, text: 'Prüfung: Umlaute äöü ß' },
  { depth: 2, text: 'Sonderzeichen »Zitat« & <em>kursiv</em>' },
  { depth: 3, text: 'Unterpunkt' },
];
const ssrTree = buildTocTree(ssrHeadings);
const ssrNodes = flattenToc(ssrTree.items);
const ssrList = renderTocList(ssrTree.items);
const ssrArticle = ssrHeadings
  .map((h, i) => `<h${h.depth} id="${ssrNodes[i].slug}">${h.text}</h${h.depth}>\n<p>Absatz ${i + 1}: Probeinhalt für den Ankersprung.</p>`)
  .join('\n');

/* --- Dynamic-Fixture ----------------------------------------------------- */
const dynHeadings = [
  [2, 'Gleicher Titel'],
  [2, 'Gleicher Titel'],
  [2, 'Prüfung äöü'],
  [2, 'Sonderzeichen !!!'],
  [3, 'Unterpunkt'],
];
const dynArticle = dynHeadings
  .map(([d, text], i) => `<h${d}>${text}</h${d}>\n<p>Absatz ${i + 1}: Probeinhalt für den Ankersprung.</p>`)
  .join('\n');

const browser = await launchChromium();
const page = await browser.newPage();
await page.setContent(pilotHtml);

const build = async (asideListHtml, articleHtml, dynamic) => {
  return page.evaluate(({ listHtml, article, isDynamic }) => {
    const wrapper = document.querySelector('.page-body--toc');
    const aside = wrapper.querySelector('aside.page-toc');
    if (isDynamic) {
      aside.setAttribute('data-toc-dynamic', 'true');
      aside.querySelector('.page-toc__body').innerHTML = '';
    } else {
      aside.querySelector('.page-toc__body').innerHTML = listHtml;
    }
    wrapper.querySelector('.prose').innerHTML = article;
    // Komponentenskript der echten Seite entfernen (sonst doppelte Initialisierung)
    for (const s of [...document.querySelectorAll('script[src*="TableOfContents"]')]) s.remove();
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/__qa__/scripts/toc.js';
    document.body.appendChild(script);
    return `<!doctype html>\n${document.documentElement.outerHTML}`;
  }, { listHtml: asideListHtml, article: articleHtml, isDynamic: dynamic });
};

const ssrHtml = await build(ssrList, ssrArticle, false);
const dynHtml = await build('', dynArticle, true);
const dynMinHtml = await build('', '<h2>Nur eine</h2>\n<p>Probeinhalt.</p>\n<h2>Nur zwei</h2>\n<p>Probeinhalt.</p>', true);
await browser.close();

fs.writeFileSync(path.join(OUT, 'ssr-duplikate.html'), ssrHtml, 'utf8');
fs.writeFileSync(path.join(OUT, 'dynamic.html'), dynHtml, 'utf8');
fs.writeFileSync(path.join(OUT, 'dynamic-min.html'), dynMinHtml, 'utf8');

writeJson('fixtures.json', {
  generatedAt: new Date().toISOString(),
  ssr: {
    url: '/__qa__/ssr-duplikate.html',
    headings: ssrHeadings.map((h, i) => ({ depth: h.depth, text: h.text, expectedId: ssrNodes[i].slug })),
    listHtml: ssrList,
  },
  dynamic: {
    url: '/__qa__/dynamic.html',
    headings: dynHeadings.map(([depth, text]) => ({ depth, text, expectedId: toc.slugifyHeading(text) })),
    bundle: '/__qa__/scripts/toc.js',
  },
});
console.log('fixtures written:', path.join(OUT, 'ssr-duplikate.html'), path.join(OUT, 'dynamic.html'));
console.log('SSR-IDs:', ssrNodes.map((n) => n.slug).join(' | '));
