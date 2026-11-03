// ESOW-RAD-13 — statische Struktur-, SEO- und Platzhalterpruefung (unabhaengig)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve as rp, normalize } from 'node:path';

const ROOT = 'C:/Users/mas/Arbeit/esow-qa-rad13';
const OUT = 'C:/Users/mas/AppData/Local/hermes/cache/scratch/rad13-evidence/static-probe.json';
const BASE = 'https://ingbms.github.io/Esoterik-Welt/';

const docs = [
  'radiasthesie/index.html',
  'radiasthesie/radiasthesie.html',
  'radiasthesie/pendeln.html',
  'radiasthesie/orakel.html',
  'radiasthesie/glossar.html',
  'radiasthesie/quellen.html',
  'radiasthesie/methodik.html',
  'index.html',
];

const findings = [];
const fail = (id, msg, detail) => findings.push({ id, severity: 'fail', msg, detail });
const note = (id, msg, detail) => findings.push({ id, severity: 'info', msg, detail });

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripScripts(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
}

function textOf(html) {
  return decodeEntities(stripScripts(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function headingOrder(html) {
  const out = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html))) out.push({ level: Number(m[1]), text: textOf(m[2]).slice(0, 80) });
  return out;
}

const report = { generated: new Date().toISOString(), docs: {}, sitemap: {}, data: {}, findings };

// ---------- Sitemap ----------
const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
report.sitemap.count = locs.length;
report.sitemap.withFragment = locs.filter((u) => u.includes('#'));
report.sitemap.entries = locs.map((u) => {
  const rel = u.replace(BASE, '');
  const target = rel === '' ? 'index.html' : rel.endsWith('/') ? rel + 'index.html' : rel;
  return { url_ok: u.startsWith(BASE), rel, target, exists: existsSync(join(ROOT, target)) };
});
if (report.sitemap.withFragment.length) fail('SEO-SITEMAP-FRAGMENT', 'Sitemap enthaelt Fragmentadressen', report.sitemap.withFragment);
const missing = report.sitemap.entries.filter((e) => !e.exists);
if (missing.length) fail('SEO-SITEMAP-TARGET', 'Sitemap-Ziel fehlt lokal', missing);

// ---------- Pro Dokument ----------
for (const rel of docs) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) {
    fail('DOC-MISSING', `Dokument fehlt: ${rel}`);
    continue;
  }
  const html = readFileSync(p, 'utf8');
  const d = { file: rel, bytes: Buffer.byteLength(html) };

  d.title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
  d.titleLen = decodeEntities(d.title).length;
  d.description = decodeEntities(
    (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [, ''])[1]
  );
  d.descriptionLen = d.description.length;
  d.canonical = (html.match(/<link rel="canonical" href="([^"]+)"/i) || [, ''])[1];
  d.ogUrl = (html.match(/<meta property="og:url" content="([^"]+)"/i) || [, ''])[1];
  d.ogImage = (html.match(/<meta property="og:image" content="([^"]+)"/i) || [, ''])[1] || null;
  d.robots = (html.match(/<meta name="robots" content="([^"]+)"/i) || [, ''])[1] || null;

  // JSON-LD
  d.jsonld = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const raw = m[1].trim();
    try {
      const obj = JSON.parse(raw);
      const ctx = obj['@context'];
      const graph = obj['@graph'] || [];
      const types = graph.map((n) => n['@type']);
      const urls = JSON.stringify(obj).match(/https?:\/\/[^"\\]+/g) || [];
      d.jsonld.push({
        parse: 'ok',
        context: ctx,
        types,
        nodeCount: graph.length,
        hashUrls: urls.filter((u) => u.includes('#')).filter((u) => !u.includes('#')) /* placeholder */,
        urlsWithHash: urls.filter((u) => /#/.test(u.split('//')[1] || '')),
      });
      if (ctx !== 'https://schema.org') fail('SEO-JSONLD-CONTEXT', `${rel}: @context != schema.org`, ctx);
    } catch (e) {
      d.jsonld.push({ parse: 'error', error: String(e).slice(0, 200) });
      fail('SEO-JSONLD-PARSE', `${rel}: JSON-LD nicht parsebar`, String(e).slice(0, 200));
    }
  }
  if (!d.jsonld.length) fail('SEO-JSONLD-MISSING', `${rel}: kein JSON-LD`);

  // H1 / Ueberschriftenordnung
  const heads = headingOrder(html);
  d.headings = heads.map((h) => `H${h.level}: ${h.text}`);
  d.h1Count = heads.filter((h) => h.level === 1).length;
  // H1/JSON-LD-Pflicht gilt fuer die generierten statischen Dokumente; die SPA wird im Browser geprueft.
  if (rel.startsWith('radiasthesie/')) {
    if (d.h1Count !== 1) fail('HTML-H1', `${rel}: ${d.h1Count} H1`, d.headings.filter((h) => h.startsWith('H1')));
    if (!d.jsonld.length) fail('SEO-JSONLD-MISSING', `${rel}: kein JSON-LD`);
  }
  let prev = 0;
  const skips = [];
  for (const h of heads) {
    if (prev && h.level > prev + 1) skips.push(`H${prev}->H${h.level}: ${h.text}`);
    prev = h.level;
  }
  d.headingSkips = skips;
  if (skips.length) fail('HTML-HEADING-SKIP', `${rel}: Ueberschriftssprung`, skips);

  // Interne Links + Sprungmarken
  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const internal = hrefs.filter((h) => !/^(https?:|mailto:|tel:)/.test(h));
  const broken = [];
  for (const h of internal) {
    const [pathPart, frag] = h.split('#');
    let target = pathPart === '' ? rel : pathPart.startsWith('/') ? pathPart.slice(1) : join(dirname(rel), pathPart);
    target = normalize(target).replace(/\\/g, '/');
    if (target === '' || target === '.' || target.endsWith('/')) target = target === './' || target === '' || target === '.' ? 'index.html' : target + 'index.html';
    const abs = join(ROOT, target);
    if (!existsSync(abs)) {
      broken.push({ href: h, reason: 'datei-fehlt', target });
      continue;
    }
    if (frag) {
      // Ziele auf die SPA (index.html) sind Hash-Routen der Anwendung, keine Sprungmarken.
      if (target === 'index.html') {
        d.appRoutes = d.appRoutes || [];
        d.appRoutes.push(h);
        continue;
      }
      const t = readFileSync(abs, 'utf8');
      const re = new RegExp(`id="${frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
      if (!re.test(t)) broken.push({ href: h, reason: 'anker-fehlt', target });
    }
  }
  d.internalLinks = internal.length;
  d.brokenLinks = broken;
  if (broken.length) fail('LINK-BROKEN', `${rel}: tote interne Ziele`, broken.slice(0, 10));

  // Bilder
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  d.images = imgs.map((tag) => ({
    src: (tag.match(/src="([^"]+)"/) || [, ''])[1],
    hasSrcset: /srcset=/.test(tag),
    alt: decodeEntities((tag.match(/alt="([^"]*)"/) || [, ''])[1] || ''),
    hasWidth: /width="/.test(tag),
    hasHeight: /height="/.test(tag),
    loading: (tag.match(/loading="([^"]+)"/) || [, ''])[1] || null,
  }));
  d.imagesWithoutAlt = d.images.filter((i) => !i.alt);
  d.missingImageFiles = d.images
    .map((i) => i.src)
    .filter((s) => s && !/^https?:/.test(s))
    .filter((s) => !existsSync(join(ROOT, dirname(rel), decodeURIComponent(s.split('?')[0]))));
  if (d.imagesWithoutAlt.length) fail('A11Y-ALT', `${rel}: Bilder ohne Alt-Text`, d.imagesWithoutAlt);
  if (d.missingImageFiles.length) fail('MEDIA-MISSING', `${rel}: Bilddatei fehlt`, d.missingImageFiles);

  // Externe Ressourcen (Skripte/Styles/Bilder/Fonts) — nicht Quellenlinks (<a>)
  const extRes = [];
  for (const tag of ['script', 'link', 'img', 'iframe', 'source', 'video', 'audio']) {
    const re = new RegExp(`<${tag}\\b[^>]*?(?:src|href)="(https?://[^"]+)"[^>]*>`, 'gi');
    for (const m of html.matchAll(re)) {
      if (!m[1].startsWith(BASE)) extRes.push({ tag, url: m[1] });
    }
  }
  d.externalResources = extRes;
  if (extRes.length) fail('EXT-REQUEST', `${rel}: externe Ressource eingebunden`, extRes);

  // CSS url()
  const cssFiles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
  d.css = [];
  for (const c of cssFiles) {
    const cssPath = join(ROOT, dirname(rel), c);
    if (!existsSync(cssPath)) {
      d.css.push({ file: c, exists: false });
      fail('CSS-MISSING', `${rel}: Stylesheet fehlt`, c);
      continue;
    }
    const css = readFileSync(cssPath, 'utf8');
    const urls = [...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)].map((m) => m[2]);
    const ext = urls.filter((u) => /^https?:/.test(u));
    d.css.push({ file: c, exists: true, urlCount: urls.length, externalUrls: ext });
    if (ext.length) fail('EXT-REQUEST-CSS', `${c}: externe url()`, ext);
  }

  // No-JS-Kerntext: alle <main>-Absaetze muessen ohne Skript im HTML stehen
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [''])[0];
  d.mainTextNoJs = textOf(main).length;
  d.mainParagraphs = (main.match(/<p\b/g) || []).length;
  d.hasNoscript = /<noscript/i.test(html);
  if (d.mainTextNoJs < 2000) fail('NOJS-TEXT', `${rel}: wenig Text ohne JavaScript (${d.mainTextNoJs} Zeichen)`);

  // Platzhalter
  const txt = textOf(html);
  d.placeholders = {
    todo: (txt.match(/\bTODO\b|\bFIXME\b|\bXXX\b|Lorem ipsum|Platzhalter/gi) || []).slice(0, 5),
    inVorbereitung: (txt.match(/in Vorbereitung/gi) || []).length,
  };

  report.docs[rel] = d;
}

// ---------- Datendatei: Platzhalter, B1, Quellen ----------
const dataSrc = readFileSync(join(ROOT, 'js/data/radiasthesie.js'), 'utf8');
report.data.bytes = Buffer.byteLength(dataSrc);
report.data.bovisWrong = (dataSrc.match(/6\.500\s*=\s*gut/g) || []).length;
report.data.bovisNeutral = (dataSrc.match(/6\.500[^.]{0,80}neutral/gi) || []).length;
report.data.placeholders = {
  todo: (dataSrc.match(/\bTODO\b|\bFIXME\b|\bXXX\b|Lorem ipsum/gi) || []).slice(0, 5),
  inVorbereitung: (dataSrc.match(/in Vorbereitung/gi) || []).length,
};
report.data.sourceCount = new Set([...dataSrc.matchAll(/id:\s*'(Q\d+)'/g)].map((m) => m[1])).size;
if (report.data.bovisWrong) fail('B1-REGRESSION', 'B1-Formulierung "6.500 = gut" wieder vorhanden');
if (report.data.bovisNeutral === 0) fail('B1-UNVERIFIED', 'Belegte Lesart "6.500 ... neutral" nicht gefunden');

// ---------- Zusatzpruefungen: Canonical, Titel-Eindeutigkeit, Inline-Handler ----------
{
  const titles = new Map();
  const canonicals = new Map();
  for (const [rel, d] of Object.entries(report.docs)) {
    titles.set(d.title, [...(titles.get(d.title) || []), rel]);
    canonicals.set(d.canonical, [...(canonicals.get(d.canonical) || []), rel]);
    const expectUrl = BASE + (rel === 'index.html' ? '' : rel.replace(/index\.html$/, ''));
    if (rel.startsWith('radiasthesie/') && d.canonical !== expectUrl)
      fail('SEO-CANONICAL', `${rel}: canonical != eigene Dokument-URL`, { canonical: d.canonical, expect: expectUrl });
    if (d.canonical !== d.ogUrl) fail('SEO-OGURL', `${rel}: og:url != canonical`, { og: d.ogUrl, canonical: d.canonical });
    if (d.canonical.includes('#')) fail('SEO-CANONICAL-FRAGMENT', `${rel}: canonical mit Fragment`, d.canonical);
    if (rel.startsWith('radiasthesie/') && !/index,follow/.test(d.robots || ''))
      fail('SEO-ROBOTS', `${rel}: robots nicht index,follow`, d.robots);
    if (d.descriptionLen < 70 || d.descriptionLen > 160)
      fail('SEO-DESCRIPTION-LEN', `${rel}: Description ${d.descriptionLen} Zeichen (Soll 70-160)`);
    const inlineHandlers = [
      ...readFileSync(join(ROOT, rel), 'utf8').matchAll(/\son(?:click|error|load|mouseover|focus)\s*=/gi),
    ].length;
    d.inlineHandlers = inlineHandlers;
    if (inlineHandlers) fail('SEC-INLINE-HANDLER', `${rel}: ${inlineHandlers} Inline-Event-Handler`);
  }
  report.canonicalUnique = [...canonicals.entries()].filter(([, v]) => v.length > 1);
  report.titleDuplicates = [...titles.entries()].filter(([, v]) => v.length > 1);
  if (report.canonicalUnique.length) fail('SEO-CANONICAL-DUPLICATE', 'Canonical nicht eindeutig', report.canonicalUnique);
  if (report.titleDuplicates.length) fail('SEO-TITLE-DUPLICATE', 'Titel nicht eindeutig', report.titleDuplicates);
}

writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log('doctor');
for (const [k, v] of Object.entries(report.docs)) {
  console.log(
    `${k}: title=${v.titleLen} desc=${v.descriptionLen} h1=${v.h1Count} skips=${v.headingSkips.length} links=${v.internalLinks} broken=${v.brokenLinks.length} imgs=${v.images.length} noAlt=${v.imagesWithoutAlt.length} ext=${v.externalResources.length} jsonld=${v.jsonld.map((j) => j.types.join(',')).join('|')} notes=${v.mainTextNoJs}`
  );
}
console.log('sitemap:', report.sitemap.count, 'fragments:', report.sitemap.withFragment.length, 'missing:', report.sitemap.entries.filter((e) => !e.exists).length);
console.log('data:', JSON.stringify({ sources: report.data.sourceCount, bovisWrong: report.data.bovisWrong, bovisNeutral: report.data.bovisNeutral, inVorbereitung: report.data.placeholders.inVorbereitung }));
console.log('FAILS:', findings.filter((f) => f.severity === 'fail').length);
for (const f of findings.filter((f) => f.severity === 'fail')) console.log('  FAIL', f.id, f.msg, JSON.stringify(f.detail ?? null).slice(0, 300));
