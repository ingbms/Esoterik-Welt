// Erzeugt die statischen, ohne JavaScript lesbaren Dokumente des Themenmoduls
// „Radiästhesie, Pendeln und Orakel“ — aus derselben Datenquelle wie die
// Modulansicht (js/data/radiasthesie.js) und mit denselben Renderfunktionen.
//
// Warum überhaupt: Die Anwendung ist eine Einzeldokument-SPA mit Hash-Routen.
// Suchmaschinen und KI-Antwortsysteme sehen dort nur index.html; die Inhalte
// hängen an Fragmenten, die nicht als eigene Dokumente gelten. Dieses Skript
// schreibt deshalb echte HTML-Dateien unter radiasthesie/ — additiv, ohne den
// Hash-Router oder die Offline-Ausgabe zu ersetzen.
//
// Regeln:
// - Keine erfundenen Inhalte: Texte, Kapitel, Quellen und Bilder kommen aus
//   dem generierten Datensatz. Nur Rahmen (Kopf, Brotkrümel, Fuß) ist neu.
// - Kanonische Adresse ist das Dokument selbst; Hash-Adressen erscheinen weder
//   in Canonical noch in der Sitemap.
// - Kein Article (kein belegtes Veröffentlichungsdatum, kein Redaktionskonto),
//   kein FAQPage (es gibt keine Frage-Antwort-Seite). BreadcrumbList,
//   CollectionPage/WebPage und DefinedTermSet (Glossar) sind belegt.
// - Titel und Beschreibungen werden gegen die Projektgrenzen geprüft; ein
//   Verstoß bricht den Lauf ab, statt still ein zu langes Meta zu schreiben.
//
// Aufruf: node scripts/generate-radiasthesie-pages.cjs

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const dataFile = path.join(root, 'js/data/radiasthesie.js');
const formatFile = path.join(root, 'js/modules/radiasthesie-format.js');
const modelFile = path.join(root, 'js/modules/radiasthesie-model.js');
const seoFile = path.join(root, 'js/modules/radiasthesie-seo.js');
const viewsFile = path.join(root, 'js/modules/radiasthesie-views.js');
const outputDir = path.join(root, 'radiasthesie');
const sitemapFile = path.join(root, 'sitemap.xml');

const UPDATED = '2026-11-03';
const UPDATED_LABEL = 'Stand 3. November 2026';

function fail(message) {
  const error = new Error(message);
  error.reported = true;
  throw error;
}

function escapeAttribute(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Markdown-Reste und Quellenmarker für JSON-LD-Text entfernen. */
function plainText(value) {
  return String(value == null ? '' : value)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[(Q\d{2}(?:\s*[,/]\s*Q\d{2})*)\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstHttpUrl(value) {
  const match = /(https?:\/\/[^\s;]+)/i.exec(String(value || ''));
  return match ? match[1] : '';
}

// --- Dokumentinhalte ------------------------------------------------------

/**
 * Glossar als statische Seite. Die Modulansicht enthält ein Suchformular und
 * eine Buchstabenfilterung, die ohne JavaScript nichts tun würden; hier stehen
 * deshalb alle Begriffe mit Sprungmarken je Buchstabe — ohne tote Bedienelemente.
 */
function renderStaticGlossar(model, { escapeHtml, inlineText, levelChips }) {
  const groups = model.glossary('', '');
  if (!groups.length) fail('Glossar ist leer');

  const letterNav = groups
    .map((group) => `<a class="astro-letter" href="#g-${group.letter.toLowerCase()}">${escapeHtml(group.letter)}</a>`)
    .join('');

  const body = groups
    .map(
      (
        group
      ) => `<section class="astro-glossgroup" id="g-${group.letter.toLowerCase()}" aria-labelledby="g-${group.letter.toLowerCase()}-title">
        <div class="rad-gloss-head">
          <h2 id="g-${group.letter.toLowerCase()}-title" tabindex="-1">${escapeHtml(group.letter)}</h2>
          <p class="rad-gloss-count">${group.terms.length} ${group.terms.length === 1 ? 'Begriff' : 'Begriffe'}</p>
        </div>
        <dl class="astro-glosslist">
          ${group.terms
            .map(
              (term) => `<div class="astro-term">
            <dt>${escapeHtml(term.term)} ${levelChips(term.levels, { short: true })}</dt>
            <dd>${inlineText(term.definition)}${
              term.sources.length
                ? `<span class="astro-term-links">Quellen ${term.sources
                    .map((id) => `<a href="quellen.html#quelle-${escapeHtml(id)}">${escapeHtml(id)}</a>`)
                    .join(', ')}</span>`
                : ''
            }</dd>
          </div>`
            )
            .join('')}
        </dl>
      </section>`
    )
    .join('');

  const html = `<div class="rad">
    <header class="astro-head">
      <p class="label">Service · Nachschlagen</p>
      <h1 id="pendeln-title" class="astro-title" tabindex="-1">Glossar</h1>
      <p class="astro-lead">Begriffe aus Radiästhesie, Pendeln und Orakel — kurz erklärt, mit Verweis auf die Stelle, an der sie ausführlich stehen. Die Stufe nennt die Herkunft des Begriffs, nicht seine Gültigkeit.</p>
      <ul class="rad-meta"><li>${model.stats.glossary} Begriffe</li><li>${UPDATED_LABEL}</li></ul>
    </header>
    <nav class="astro-letters" aria-label="Sprung zu Buchstaben">${letterNav}</nav>
    ${body}
    <section class="astro-section" aria-labelledby="rad-glossar-weiter-title">
      <h2 id="rad-glossar-weiter-title" tabindex="-1">Begriffe fehlen?</h2>
      <p class="astro-text">Das Glossar wächst mit der Redaktion. Jeder Begriff nennt seine Quellen, damit nachvollziehbar bleibt, worauf die Definition beruht.</p>
      <p class="astro-text">Die ausführlichen Kapitel stehen unter <a href="radiasthesie.html">Radiästhesie</a>, <a href="pendeln.html">Pendeln</a> und <a href="orakel.html">Orakel</a>.</p>
    </section>
  </div>`;

  return { html, title: null, description: null, h1: 'Glossar', kind: 'glossar' };
}

// --- Adressen umschreiben -------------------------------------------------

/**
 * Hash-Routen der SPA in statische Adressen übersetzen. Jede unbekannte
 * Modulroute bricht ab: Ein toter Link ist schlimmer als ein Build-Fehler.
 */
function createLinkRewriter({ doc, topics, glossaryLetters, sourceIds }) {
  const app = (hash) => `../${hash}`;

  function resolve(href) {
    const [rawPath, query] = href.slice(1).split('?');
    const segments = rawPath.split('/');
    if (segments[0] !== 'pendeln') {
      if (rawPath === 'home') return '../';
      return app(href);
    }
    const area = segments[1];
    if (!area) return './';
    if (area === 'glossar') {
      const letter = query ? new URLSearchParams(query).get('b') : '';
      if (letter) {
        const key = letter.toLowerCase();
        if (!glossaryLetters.has(key)) fail(`unbekannter Glossarbuchstabe: ${href}`);
        return `glossar.html#g-${key}`;
      }
      return 'glossar.html';
    }
    if (area === 'quellen') {
      const id = segments[2];
      if (id) {
        if (!sourceIds.has(id)) fail(`unbekannte Quelle: ${href}`);
        return `quellen.html#quelle-${id}`;
      }
      return 'quellen.html';
    }
    if (area === 'methodik') return 'methodik.html';
    if (['suche', 'labor', 'studio', 'experiment', 'journal'].includes(area)) return app(href);
    const topic = topics[area];
    if (topic) {
      const chapter = segments[2];
      const samePage = doc.kind === 'topic' && doc.slug === area;
      if (chapter) {
        if (!topic.has(chapter)) fail(`unbekannter Kapitelanker: ${href}`);
        return samePage ? `#${chapter}` : `${area}.html#${chapter}`;
      }
      return samePage ? './' : `${area}.html`;
    }
    fail(`unbekannte Modulroute: ${href}`);
  }

  return (html) => html.replace(/\bhref="(#[^"]*)"/g, (match, href) => `href="${resolve(href)}"`);
}

/** Bildpfade liegen im Dokument eine Ebene tiefer als im Modul. */
function rebaseAssets(html) {
  return html.replace(/\b(src|srcset|poster)="([^"]*)"/g, (match, attribute, value) => {
    const rebased = value.replace(/(^|,\s*)(?:\.\/)?assets\//g, '$1../assets/');
    return `${attribute}="${rebased}"`;
  });
}

function dropSpaBreadcrumb(html) {
  const removed = html.replace(/\s*<nav class="astro-breadcrumb"[\s\S]*?<\/nav>/, '');
  if (removed === html) fail('Brotkrümel der Modulansicht nicht gefunden');
  return removed;
}

// --- Strukturierte Daten --------------------------------------------------

function structuredData({ doc, title, description, trail, chapters, citations, glossaryTerms, breadcrumbList }) {
  const url = doc.url ? `${doc.url}` : '';
  const absolute = (value) => `https://ingbms.github.io/Esoterik-Welt/${value}`;
  const pageUrl = absolute(url);

  const page = {
    '@type': doc.kind === 'landing' ? 'CollectionPage' : 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description,
    inLanguage: 'de',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://ingbms.github.io/Esoterik-Welt/#website',
      url: 'https://ingbms.github.io/Esoterik-Welt/',
      name: 'Esoterik-Welt',
    },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
    dateModified: UPDATED,
    publisher: { '@type': 'Organization', name: 'Esoterik-Welt', url: 'https://ingbms.github.io/Esoterik-Welt/' },
  };
  if (chapters && chapters.length) {
    page.hasPart = chapters.map((chapter) => ({
      '@type': 'WebPageElement',
      name: chapter.title,
      url: `${pageUrl}#${chapter.id}`,
    }));
  }
  if (citations && citations.length) {
    page.citation = citations;
  }

  const breadcrumb = {
    ...breadcrumbList(trail),
    '@id': `${pageUrl}#breadcrumb`,
  };

  const graph = [page, breadcrumb];

  if (doc.kind === 'glossar') {
    graph.push({
      '@type': 'DefinedTermSet',
      '@id': `${pageUrl}#glossar`,
      name: 'Glossar Radiästhesie, Pendeln und Orakel',
      url: pageUrl,
      inLanguage: 'de',
      hasDefinedTerm: (glossaryTerms || []).map((term) => ({
        '@type': 'DefinedTerm',
        name: term.term,
        description: plainText(term.definition),
        inDefinedTermSet: `${pageUrl}#glossar`,
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

// --- Seitengerüst ---------------------------------------------------------

function renderShell({ doc, title, description, body, trail, jsonLd, docs }) {
  const absolute = `https://ingbms.github.io/Esoterik-Welt/${doc.url}`;
  const nav = docs
    .map((entry) => {
      const current = entry.id === doc.id;
      const href = entry.kind === 'landing' ? './' : `${entry.slug || entry.id}.html`;
      return `<li><a href="${href}"${current ? ' aria-current="page"' : ''}>${escapeAttribute(entry.nav)}</a></li>`;
    })
    .join('');

  const breadcrumb = `<nav class="astro-breadcrumb" aria-label="Brotkrümelnavigation"><ol>${trail
    .map((entry, index) => {
      const last = index === trail.length - 1;
      if (last) return `<li><span aria-current="page">${escapeAttribute(entry.label)}</span></li>`;
      return `<li><a href="${entry.href}">${escapeAttribute(entry.label)}</a></li>`;
    })
    .join('')}</ol></nav>`;

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeAttribute(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <link rel="canonical" href="${absolute}" />
    <meta name="robots" content="index,follow" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Esoterik-Welt" />
    <meta property="og:locale" content="de_DE" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${absolute}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />

    <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg" />
    <link rel="stylesheet" href="../css/design-system.css" />
    <link rel="stylesheet" href="../css/main.css" />
    <link rel="stylesheet" href="../css/radiasthesie.css" />
    <link rel="stylesheet" href="../css/radiasthesie-statisch.css" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>
  <body class="rad-static">
    <a class="skip-link" href="#main">Zum Hauptinhalt springen</a>
    <header class="rad-static-header">
      <div class="container rad-static-header-inner">
        <a class="rad-static-brand" href="../" aria-label="Esoterik-Welt Startseite">Esoterik-Welt</a>
        <nav class="rad-static-nav" aria-label="Bereichsnavigation">
          <ul>${nav}</ul>
        </nav>
        <a class="rad-static-app" href="../#pendeln">Interaktive Ansicht</a>
      </div>
    </header>
    <main id="main" class="container rad-root rad-static-main">
      ${breadcrumb}
      ${body}
      <footer class="rad-static-footer">
        <p><strong>${UPDATED_LABEL}.</strong> Jede längere Aussage trägt eine Evidenzstufe A–E; jede Quelle nennt Typ, Prüftiefe und Abrufdatum. <a href="methodik.html">Methodik und Grenzen</a>.</p>
        <p>Diese Seite ist ohne JavaScript lesbar. Die interaktiven Werkzeuge — Pendellabor, Tafel-Studio, Experimentierlabor und Pendeltagebuch — liegen in der <a href="../#pendeln">Anwendung</a>.</p>
        <p><a href="../impressum.html">Impressum</a> · <a href="../datenschutz.html">Datenschutz</a> · <a href="../haftung.html">Haftung</a> · <a href="quellen.html">Quellenverzeichnis</a></p>
      </footer>
    </main>
  </body>
</html>
`;
}

// --- Sitemap --------------------------------------------------------------

function renderSitemap(docs) {
  const urls = docs.map(
    (doc) =>
      `  <url><loc>https://ingbms.github.io/Esoterik-Welt/${doc.url}</loc><lastmod>${doc.lastmod}</lastmod></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Erzeugt von scripts/generate-radiasthesie-pages.cjs. Nur echte Dokumente,
     keine SPA-Fragmente (#tarot, #pendeln/radiasthesie, …). Die statischen
     Themenseiten sind die kanonischen Dokumente dieses Bereichs. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

// --- Lauf -----------------------------------------------------------------

async function buildStaticPages({ quiet = false } = {}) {
  const [dataModule, format, modelModule, seo, views] = await Promise.all([
    import(pathToFileURL(dataFile).href),
    import(pathToFileURL(formatFile).href),
    import(pathToFileURL(modelFile).href),
    import(pathToFileURL(seoFile).href),
    import(pathToFileURL(viewsFile).href),
  ]);

  const { RADIASTHESIE } = dataModule;
  if (!RADIASTHESIE) fail('js/data/radiasthesie.js exportiert RADIASTHESIE nicht');
  const model = modelModule.createModel(RADIASTHESIE);
  const { escapeHtml, inlineText, levelChips } = format;

  const topics = Object.fromEntries(
    Object.values(RADIASTHESIE.topics).map((topic) => [topic.slug, new Set(topic.sections.map((s) => s.id))])
  );
  const glossaryLetters = new Set((RADIASTHESIE.glossary || []).map((group) => group.letter.toLowerCase()));
  const glossaryTerms = (RADIASTHESIE.glossary || []).flatMap((group) => group.terms);
  const sourceIds = new Set((RADIASTHESIE.sources || []).map((source) => source.id));
  const moduleDoc = seo.STATIC_DOCS.find((doc) => doc.kind === 'landing');

  const documents = [];

  for (const doc of seo.STATIC_DOCS) {
    let rendered;
    let chapters = [];
    let citations = [];
    if (doc.kind === 'landing') {
      rendered = views.renderLanding(model);
    } else if (doc.kind === 'topic') {
      const topic = RADIASTHESIE.topics[doc.slug];
      if (!topic) fail(`Thema fehlt in den Daten: ${doc.slug}`);
      rendered = views.renderTopic(model, topic);
      chapters = topic.sections;
      citations = model
        .sourcesForTopic(doc.slug)
        .map((source) => firstHttpUrl(source.url) || firstHttpUrl(source.locator))
        .filter(Boolean);
    } else if (doc.kind === 'glossar') {
      rendered = renderStaticGlossar(model, { escapeHtml, inlineText, levelChips });
    } else if (doc.kind === 'quellen') {
      rendered = views.renderQuellen(model);
    } else if (doc.kind === 'methodik') {
      rendered = views.renderMethodik(model);
    } else {
      fail(`unbekannte Dokumentart: ${doc.kind}`);
    }

    const title = rendered.title || (doc.kind === 'glossar' ? views.TITLES.glossar : null);
    const description = rendered.description || (doc.kind === 'glossar' ? views.DESCRIPTIONS.glossar : null);
    if (!title || !description) fail(`${doc.file}: Titel oder Beschreibung fehlt`);

    const finalTitle = seo.pageTitle(title);
    if (finalTitle.length > seo.TITLE_LIMIT) {
      fail(`${doc.file}: Titel ${finalTitle.length} Zeichen > ${seo.TITLE_LIMIT}`);
    }
    if (description.length > seo.DESCRIPTION_LIMIT) {
      fail(`${doc.file}: Beschreibung ${description.length} Zeichen > ${seo.DESCRIPTION_LIMIT}`);
    }
    if (description.length < seo.DESCRIPTION_MIN) {
      fail(`${doc.file}: Beschreibung ${description.length} Zeichen < ${seo.DESCRIPTION_MIN}`);
    }

    let body = rendered.html;
    if (doc.kind !== 'landing' && doc.kind !== 'glossar') {
      body = dropSpaBreadcrumb(body);
    }
    const rewrite = createLinkRewriter({ doc, topics, glossaryLetters, sourceIds });
    body = rewrite(body);
    body = rebaseAssets(body);
    if (/href="#pendeln/.test(body)) fail(`${doc.file}: Hash-Route im Fließtext geblieben`);
    if (/\b(?:src|srcset)="assets\//.test(body)) fail(`${doc.file}: Assetpfad nicht umgeschrieben`);

    const trail = [
      { label: 'Start', href: '../', url: '' },
      ...(doc.kind === 'landing'
        ? [{ label: RADIASTHESIE.module.title, url: null }]
        : [
            { label: RADIASTHESIE.module.title, href: './', url: moduleDoc.url },
            { label: rendered.h1 || title, url: null },
          ]),
    ];

    const jsonLd = structuredData({
      doc,
      title: finalTitle,
      description,
      trail,
      chapters,
      citations,
      glossaryTerms,
      breadcrumbList: seo.breadcrumbList,
    });

    const html = renderShell({
      doc,
      title: finalTitle,
      description,
      body,
      trail,
      jsonLd,
      docs: seo.STATIC_DOCS,
    });

    documents.push({ doc, html, title: finalTitle, description, jsonLd, trail });
  }

  // Doppelte Canonicals oder Titel wären Widersprüche, keine Geschmacksfrage.
  const canonicals = new Set();
  const titles = new Set();
  for (const entry of documents) {
    if (canonicals.has(entry.doc.url)) fail(`doppelte kanonische Adresse: ${entry.doc.url}`);
    canonicals.add(entry.doc.url);
    if (titles.has(entry.title)) fail(`doppelter Seitentitel: ${entry.title}`);
    titles.add(entry.title);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  for (const entry of documents) {
    fs.writeFileSync(path.join(root, entry.doc.file), entry.html, 'utf8');
  }
  const sitemap = renderSitemap(seo.sitemapDocs(UPDATED));
  fs.writeFileSync(sitemapFile, sitemap, 'utf8');

  const report = {
    generatedAt: UPDATED,
    documents: documents.map((entry) => ({
      id: entry.doc.id,
      file: entry.doc.file,
      url: seo.absoluteUrl(entry.doc.url),
      title: entry.title,
      titleLength: entry.title.length,
      descriptionLength: entry.description.length,
      bytes: Buffer.byteLength(entry.html, 'utf8'),
    })),
    sitemapEntries: seo.sitemapDocs(UPDATED).map((doc) => seo.absoluteUrl(doc.url)),
  };
  if (!quiet) {
    console.log(
      `Statische Seiten geschrieben: ${report.documents.length} Dokumente, ` +
        `Titel ${Math.min(...report.documents.map((d) => d.titleLength))}–${Math.max(
          ...report.documents.map((d) => d.titleLength)
        )} Zeichen, Sitemap ${report.sitemapEntries.length} Einträge.`
    );
  }
  return report;
}

if (require.main === module) {
  buildStaticPages().catch((error) => {
    if (!error || !error.reported) {
      console.error('FEHLER: ' + (error && error.message ? error.message : String(error)));
    }
    process.exitCode = 1;
  });
}

module.exports = { buildStaticPages, renderSitemap };
