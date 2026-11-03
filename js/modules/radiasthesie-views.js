// Radiästhesie-Modul — Ansichten.
//
// Reine Funktionen: Modell + Route hinein, HTML und Seitentitel heraus. Kein
// DOM, kein Zustand, keine Navigation — damit sind die Ansichten in Node
// vollständig prüfbar (tests/radiasthesie.mjs).
//
// Aufbau folgt docs/radiasthesie-konzept/komponenten-specs.md: vorhandene
// `.astro-*`-Bausteine, nur die Modulelemente `.rad-*` sind neu.

import {
  ROUTE,
  breadcrumb,
  disclaimerBox,
  escapeHtml,
  inlineText,
  levelChip,
  levelChips,
  metaList,
  paragraph,
  relatedList,
  renderBlocks,
  statusBand,
} from './radiasthesie-format.js';

const SITE = 'Esoterik-Welt';
const UPDATED_LABEL = 'Stand 2. November 2026';
const H1_ID = 'pendeln-title';

const TITLES = {
  glossar: 'Glossar — Radiästhesie, Pendeln und Orakel von A bis Z',
  quellen: 'Quellen und Belege — Radiästhesie und Pendeln',
  methodik: 'Methodik und Grenzen — wie dieser Bereich prüft',
  suche: 'Suche — Radiästhesie, Pendeln und Orakel',
  notfound: 'Seite nicht gefunden — Radiästhesie, Pendeln und Orakel',
};

const DESCRIPTIONS = {
  glossar:
    'Begriffe aus Radiästhesie, Pendeln und Orakel kurz erklärt — mit Evidenzstufe A–E und Quellenverweis, ohne Wirkungsversprechen.',
  quellen:
    'Alle 33 Quellen des Themenmoduls mit Typ, Jahr, Prüftiefe, Interessenvermerk und, wo einschlägig, den Seiten, die sie belegen.',
  methodik: 'Wie dieses Modul prüft: Arbeitsannahme, Kennzeichnung A–E, Quelleninteressen, Grenzen und Datenschutz.',
  suche: 'Volltextsuche über Themen, Kapitel, Glossar und Quellen des Moduls Radiästhesie, Pendeln und Orakel.',
  notfound: 'Diese Adresse gehört nicht zum Themenmodul. Drei Wege zurück zu den Inhalten.',
};

// --- Bausteine ------------------------------------------------------------

function heroTitle(title) {
  const parts = String(title).trim().split(' ');
  if (parts.length < 2) return escapeHtml(title);
  const last = parts.pop();
  return `${escapeHtml(parts.join(' '))} <em>${escapeHtml(last)}</em>`;
}

function plate(figure, { className = '' } = {}) {
  if (!figure) return '';
  return `<figure class="rad-plate${className ? ' ' + className : ''}">
    <div class="rad-plate-frame">
      <img src="${escapeHtml(figure.src)}" width="520" height="400" alt="${escapeHtml(figure.alt)}" loading="lazy" decoding="async" />
    </div>
    <figcaption>${inlineText(figure.caption)}</figcaption>
  </figure>`;
}

function pageHead({ trail, eyebrow, title, subtitle, lead, chips, meta }) {
  return `${breadcrumb(trail)}
  <header class="astro-head">
    <p class="label">${escapeHtml(eyebrow)}</p>
    <h1 id="${H1_ID}" class="astro-title" tabindex="-1">${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="astro-subtitle">${escapeHtml(subtitle)}</p>` : ''}
    ${lead ? `<p class="astro-lead">${inlineText(lead)}</p>` : ''}
    ${chips && chips.length ? `<div class="astro-badges">${levelChips(chips)}</div>` : ''}
    ${meta && meta.length ? metaList(meta) : ''}
  </header>`;
}

function toc(sections, slug) {
  if (!sections.length) return '';
  return `<details class="astro-toc" open>
    <summary>Auf dieser Seite</summary>
    <nav aria-label="Inhaltsverzeichnis">
      <ol>${sections
        .map(
          (entry) =>
            `<li><a href="${ROUTE.topic(slug, entry.id)}">${escapeHtml(entry.title)}${
              entry.period ? ` <span class="rad-toc-period">${escapeHtml(entry.period)}</span>` : ''
            }</a></li>`
        )
        .join('')}</ol>
    </nav>
  </details>`;
}

function topicSection(entry) {
  const headingId = `${entry.id}-title`;
  return `<section class="astro-section" id="${entry.id}" aria-labelledby="${headingId}">
    <p class="rad-kicker">Kapitel ${String(entry.number).padStart(2, '0')}${entry.period ? ` · ${escapeHtml(entry.period)}` : ''}</p>
    <h2 id="${headingId}" tabindex="-1">${escapeHtml(entry.title)}</h2>
    ${entry.chips.length ? `<p class="rad-section-levels">${levelChips(entry.chips)}</p>` : ''}
    ${renderBlocks(entry.blocks)}
  </section>`;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function firstHttpUrl(value) {
  const match = /(https?:\/\/[^\s;]+)/i.exec(String(value || ''));
  return match ? match[1] : '';
}

function locatorNote(source) {
  if (!source.locator || isHttpUrl(source.locator)) return '';
  return `<p class="astro-source-meta">${escapeHtml(source.locator)}</p>`;
}

function sourceItem(source) {
  const href = firstHttpUrl(source.url) || firstHttpUrl(source.locator);
  const label = `${escapeHtml(source.id)} · ${escapeHtml(source.citation)}`;
  const link = href ? `<a href="${escapeHtml(href)}" rel="noopener">${label}</a>` : `<span>${label}</span>`;
  return `<li class="astro-source" id="quelle-${escapeHtml(source.id)}">
    ${link}
    <span class="astro-source-meta">${escapeHtml(
      [source.type, source.year && source.year !== '—' ? source.year : '', source.verification]
        .filter(Boolean)
        .join(' · ')
    )}</span>
    ${locatorNote(source)}
  </li>`;
}

function sourcesPanel(sources, chapters) {
  if (!sources.length) return '';
  return `<details class="astro-details astro-details--sources" id="quellen">
    <summary>Quellen &amp; Belege (${sources.length} ${sources.length === 1 ? 'Quelle' : 'Quellen'}, ${chapters} Kapitel)</summary>
    <div class="astro-details-body">
      <ul class="astro-source-list">${sources.map(sourceItem).join('')}</ul>
      <p class="astro-panel-note">Die Kennungen verweisen auf das <a href="${ROUTE.quellen()}">Quellenverzeichnis</a>. Jede Zeile nennt Herausgeber, Typ und Prüftiefe; die Stufen A–E stehen am Kapitel.</p>
    </div>
  </details>`;
}

function aiDisclosure(topic, id) {
  return disclaimerBox({
    id,
    title: 'Einordnung dieser Seite',
    paragraphs: [
      { label: 'Tradition', text: topic.disclaimer.tradition },
      { label: 'Evidenz', text: topic.disclaimer.evidenz },
      { label: 'Konsequenz', text: topic.disclaimer.konsequenz },
    ],
  });
}

// --- Ansichten ------------------------------------------------------------

export function renderLanding(model) {
  const data = model.data;
  const counts = model.stats;
  const landing = data.landing;
  const meta = data.module;

  const topics = landing.topics
    .map(
      (topic) => `<li>
      <article class="rad-topic">
        <figure class="rad-topic-figure">
          <img src="${escapeHtml(topic.figure.src)}" width="520" height="400" alt="${escapeHtml(
            topic.figure.alt
          )}" loading="lazy" decoding="async" />
        </figure>
        <div class="rad-topic-body">
          <p class="rad-topic-meta">${escapeHtml(topic.metaLine)}</p>
          <h3 class="rad-topic-title"><a href="${ROUTE.topic(topic.slug)}">${escapeHtml(topic.title)}</a></h3>
          <p class="rad-topic-text">${inlineText(topic.text)}</p>
          <ul class="rad-topic-facts">${topic.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>
          <p class="rad-topic-cta"><a href="${ROUTE.topic(topic.slug)}">Zum Thema ${escapeHtml(
            topic.title
          )} <span aria-hidden="true">→</span></a></p>
        </div>
      </article>
    </li>`
    )
    .join('');

  const levels = data.levels
    .map(
      (level) => `<div class="rad-level">
        <dt>${levelChip(level.key)}</dt>
        <dd>${escapeHtml(level.definition)} — ${escapeHtml(level.examples)}</dd>
      </div>`
    )
    .join('');

  const workshop = landing.workshop
    .map(
      (entry) => `<li class="rad-werk">
        <span class="rad-werk-state rad-werk-state--planned">${escapeHtml(entry.state)}</span>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${inlineText(entry.text)}</p>
      </li>`
    )
    .join('');

  const open = data.introduction.openQuestions;

  const html = `<div class="rad">
    <div class="rad-hero">
      <div class="rad-hero-grid">
        <div class="rad-hero-copy">
          <p class="label">${escapeHtml(meta.eyebrow)}</p>
          <h1 id="${H1_ID}" class="rad-hero-title" tabindex="-1">${heroTitle(meta.title)}</h1>
          <p class="rad-hero-lead">${inlineText(meta.lead)}</p>
          <div class="rad-hero-actions">
            <a class="btn btn-primary" href="${ROUTE.topic('radiasthesie')}">Mit Radiästhesie beginnen</a>
            <a class="textlink" href="${ROUTE.methodik}">Einordnung lesen <span aria-hidden="true">↓</span></a>
          </div>
          <dl class="rad-hero-facts">
            <div class="rad-hero-fact"><dt>Bereiche</dt><dd>${counts.topics} Themen</dd></div>
            <div class="rad-hero-fact"><dt>Kapitel</dt><dd>${counts.chapters}</dd></div>
            <div class="rad-hero-fact"><dt>Kennzeichnung</dt><dd>${counts.levels} Stufen</dd></div>
          </dl>
        </div>
        ${plate({
          src: 'assets/radiasthesie/pendel-geometrie.svg',
          alt: 'Schematische Zeichnung eines Pendels: Aufhängepunkt, Faden der Länge L, ausgelenkter Pendelkörper und der Winkel Alpha zwischen Ruhelage und Faden.',
          caption:
            '**Pendelgeometrie.** Länge L, Auslenkung α, Schwingungsdauer T. Eigene Zeichnung, kein Messgerät und kein Beleg für eine Fernwirkung.',
        })}
      </div>
    </div>

    ${statusBand(meta.status, { id: 'rad-status-landing' })}

    <section class="rad-section" aria-labelledby="rad-zugang-title">
      <p class="rad-kicker">01 · Einstiege</p>
      <h2 id="rad-zugang-title" tabindex="-1">Drei Zugänge, ein Zusammenhang</h2>
      <p class="rad-section-lead">Radiästhesie ist der Oberbegriff für die Arbeit mit Rute und Pendel. Orakel ist der weitere Bereich der Deutung. Die Seiten trennen beides, statt es zu einem Sammelthema zu verrühren.</p>
      <ul class="rad-topics">${topics}</ul>
    </section>

    <section class="rad-section" aria-labelledby="rad-stufen-title">
      <p class="rad-kicker">02 · Lesart</p>
      <h2 id="rad-stufen-title" tabindex="-1">Fünf Stufen der Kennzeichnung</h2>
      <p class="rad-section-lead">Jede längere Aussage trägt eine dieser Marken. Sie sagt, auf welcher Ebene die Aussage gilt — nicht, wie überzeugend sie ist. Reine Traditionsdeutung bleibt unmarkiert und steht im Fließtext.</p>
      <dl class="rad-levels">${levels}</dl>
    </section>

    <section class="rad-section" aria-labelledby="rad-offen-title">
      <p class="rad-kicker">03 · Prüfstand</p>
      <h2 id="rad-offen-title" tabindex="-1">Was offen bleibt</h2>
      <p class="rad-section-lead">Lücken werden benannt, nicht geglättet. Diese Punkte sind in der Recherche offen geblieben und stehen so auch in den Quellen.</p>
      <ul class="astro-list">${open.map((item) => `<li>${inlineText(item)}</li>`).join('')}</ul>
    </section>

    <section class="rad-section" aria-labelledby="rad-werkstatt-title">
      <p class="rad-kicker">04 · Werkstatt</p>
      <h2 id="rad-werkstatt-title" tabindex="-1">Werkzeuge zum Ausprobieren</h2>
      <p class="rad-section-lead">Die Werkstatt zeigt Mechanik und Statistik, nicht verborgene Informationen. Jede Karte nennt ihren Stand, bevor sie angeklickt wird.</p>
      <ul class="rad-workshop">${workshop}</ul>
    </section>

    <section class="rad-section" aria-labelledby="rad-verwandt-title">
      <p class="rad-kicker">05 · Nachbarschaft</p>
      <h2 id="rad-verwandt-title" tabindex="-1">Verwandte Bereiche</h2>
      <p class="rad-section-lead">Getrennte Systeme, keine Vermischung: Diese Bereiche werden verlinkt, nicht eingemeindet.</p>
      ${relatedList(landing.related)}
    </section>

    ${disclaimerBox({ id: 'rad-disclaimer-landing', title: landing.disclaimer.title, paragraphs: landing.disclaimer.paragraphs })}
  </div>`;

  return { html, title: meta.seoTitle, description: meta.seoDescription, h1: meta.title };
}

export function renderTopic(model, topic, { anchor = '' } = {}) {
  const sources = model.sourcesForTopic(topic.slug);
  // Stufen in fester Reihenfolge A–E: sortiert ist schneller zu lesen als in
  // der Reihenfolge, in der die Kapitel sie zufällig verwenden.
  const chips = [...new Set(topic.sections.flatMap((entry) => entry.chips))].sort();
  const others = model.topicList.filter((entry) => entry.slug !== topic.slug);
  // „Pendeln / Pendeln“ wäre ein doppelter Brotkrümel; dort heißt die
  // übergeordnete Seite „Übersicht“.
  const parentLabel = topic.slug === 'pendeln' ? 'Übersicht' : 'Pendeln';

  const related = [
    ...others.map((entry) => ({
      type: 'Thema',
      title: entry.title,
      href: ROUTE.topic(entry.slug),
      text: entry.cardText,
    })),
    {
      type: 'Nachschlagen',
      title: 'Glossar',
      href: ROUTE.glossar(),
      text: 'Begriffe des Moduls in Kurzform, mit Stufe und Quellenverweis.',
    },
  ];

  const html = `<div class="rad">
    ${breadcrumb([{ label: parentLabel, href: ROUTE.base }, { label: topic.title }])}
    ${pageHead({
      eyebrow: topic.eyebrow,
      title: topic.title,
      subtitle: topic.subtitle,
      lead: topic.lead,
      chips,
      meta: [UPDATED_LABEL, `${topic.sections.length} Kapitel`, `${sources.length} Quellen`],
    })}

    ${statusBand(topic.status, { id: `rad-status-${topic.slug}` })}

    <div class="astro-layout">
      <!-- DOM-Reihenfolge: Seitenleiste vor dem Text; auf Desktop steht sie per
           grid-area rechts. Lesereihenfolge = visuelle Reihenfolge (WCAG 1.3.2). -->
      <aside class="astro-aside">
        ${toc(topic.sections, topic.slug)}
        <div class="astro-aside-box">
          <h2>Auf einen Blick</h2>
          <ul class="astro-facts">
            <li><strong>${topic.sections.length}</strong> Kapitel</li>
            <li><strong>${sources.length}</strong> Quellen</li>
            <li><strong>${chips.length}</strong> Kennzeichnungsstufen</li>
            <li><strong>${model.data.introduction.openQuestions.length}</strong> offene Fragen im Modul</li>
          </ul>
          <p class="astro-panel-note"><a href="${ROUTE.methodik}">Methodik &amp; Prüfregeln</a></p>
        </div>
      </aside>
      <div class="astro-main">
        ${topic.sections.map((entry) => topicSection(entry)).join('')}
        ${sourcesPanel(sources, topic.sections.length)}
        ${plate(topic.figure, { className: 'rad-plate--article' })}
        <section class="astro-section" aria-labelledby="rad-weiter-title">
          <h2 id="rad-weiter-title" tabindex="-1">Weiterlesen</h2>
          ${relatedList(related)}
        </section>
        ${aiDisclosure(topic, `rad-disclaimer-${topic.slug}`)}
      </div>
    </div>
  </div>`;

  return {
    html,
    title: topic.seoTitle,
    description: topic.description,
    h1: topic.title,
    anchor,
  };
}

export function renderGlossar(model, { letter = '', query = '' } = {}) {
  const groups = model.glossary(query, letter);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const available = new Set((model.data.glossary || []).map((group) => group.letter));

  const letterNav = letters
    .map((value) =>
      available.has(value)
        ? `<a class="astro-letter" href="${ROUTE.glossar(value)}"${
            value === letter ? ' aria-current="page"' : ''
          }>${value}</a>`
        : `<span class="astro-letter is-empty" aria-hidden="true">${value}</span>`
    )
    .join('');

  const total = groups.reduce((sum, group) => sum + group.terms.length, 0);

  const body = groups.length
    ? groups
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
              (term) => `<div class="astro-term" data-term="${escapeHtml(term.term.toLowerCase())}">
            <dt>${escapeHtml(term.term)} ${levelChips(term.levels, { short: true })}</dt>
            <dd>${inlineText(term.definition)}${
              term.sources.length
                ? `<span class="astro-term-links">Quellen ${term.sources
                    .map((id) => `<a href="${ROUTE.quellen(id)}">${escapeHtml(id)}</a>`)
                    .join(', ')}</span>`
                : ''
            }</dd>
          </div>`
            )
            .join('')}
        </dl>
      </section>`
        )
        .join('')
    : `<div class="astro-callout">
        <p><strong>Kein Begriff gefunden.</strong> Die Suche prüft Begriff und Definition. Versuche einen kürzeren Suchbegriff oder hebe die Buchstabenauswahl auf.</p>
      </div>`;

  const html = `<div class="rad">
    ${breadcrumb([{ label: 'Pendeln', href: ROUTE.base }, { label: 'Glossar' }])}
    ${pageHead({
      eyebrow: 'Service · Nachschlagen',
      title: 'Glossar',
      lead: 'Begriffe aus Radiästhesie, Pendeln und Orakel — kurz erklärt, mit Verweis auf die Stelle, an der sie ausführlich stehen. Die Stufe nennt die Herkunft des Begriffs, nicht seine Gültigkeit.',
      meta: [`${model.stats.glossary} Begriffe`, UPDATED_LABEL],
    })}

    <div class="astro-controls">
      <form class="astro-search" role="search" data-rad-form="glossar">
        <label class="sr-only" for="glossarSuche">Begriff suchen</label>
        <input class="input" id="glossarSuche" type="search" name="q" value="${escapeHtml(
          query
        )}" placeholder="Begriff suchen, z. B. Biotensor" autocomplete="off" />
        <button class="btn btn-secondary" type="submit">Suchen</button>
      </form>
      <nav class="astro-letters" aria-label="Sprung zu Buchstaben">${letterNav}</nav>
    </div>

    <p class="astro-note" role="status" aria-live="polite" data-rad-count>${total} ${
      total === 1 ? 'Begriff' : 'Begriffe'
    }${letter ? ` unter „${escapeHtml(letter)}“` : ''}${query ? ` für „${escapeHtml(query)}“` : ''}</p>

    ${body}

    <section class="astro-section" aria-labelledby="rad-glossar-weiter-title">
      <h2 id="rad-glossar-weiter-title" tabindex="-1">Begriffe fehlen?</h2>
      <p class="astro-text">Das Glossar wächst mit der Redaktion. Jeder Begriff nennt seine Quellen, damit nachvollziehbar bleibt, worauf die Definition beruht.</p>
      <p class="astro-text"><a class="btn btn-secondary" href="${ROUTE.topic('radiasthesie')}">Zu den Themenseiten</a></p>
    </section>
  </div>`;

  return { html, title: TITLES.glossar, description: DESCRIPTIONS.glossar, h1: 'Glossar' };
}

export function renderQuellen(model, { sourceId = '' } = {}) {
  const sources = model.sources;
  const cards = sources
    .map((source) => {
      const usedIn = model.topicsForSource(source.id);
      return `<article class="astro-source-card${source.id === sourceId ? ' is-target' : ''}" id="quelle-${escapeHtml(
        source.id
      )}">
      <p class="astro-source-id">${escapeHtml(source.id)} ${levelChips(source.levels, { short: true })}</p>
      <h3>${
        firstHttpUrl(source.url) || firstHttpUrl(source.locator)
          ? `<a href="${escapeHtml(firstHttpUrl(source.url) || firstHttpUrl(source.locator))}" rel="noopener">${escapeHtml(source.citation)}</a>`
          : escapeHtml(source.citation)
      }</h3>
      <p class="astro-source-meta">${escapeHtml(
        [source.type, source.year && source.year !== '—' ? source.year : 'ohne Jahr', source.verification]
          .filter(Boolean)
          .join(' · ')
      )}</p>
      ${locatorNote(source)}
      ${source.interestNote ? `<p>${inlineText(source.interestNote)}</p>` : ''}
      ${source.note ? `<p class="astro-panel-note"><strong>Anmerkung:</strong> ${inlineText(source.note)}</p>` : ''}
      ${
        usedIn.length
          ? `<p class="astro-source-meta">Verwendet in ${usedIn
              .map((topic) => `<a href="${ROUTE.topic(topic.slug)}">${escapeHtml(topic.title)}</a>`)
              .join(', ')}</p>`
          : `<p class="astro-source-meta">Nicht im Fließtext zitiert — Kontext- und Referenzliteratur.</p>`
      }
    </article>`;
    })
    .join('');

  const legend = (model.sourceLegend || [])
    .map((entry) => `<li><strong>${escapeHtml(entry.label)}:</strong> ${inlineText(entry.text)}</li>`)
    .join('');

  const html = `<div class="rad">
    ${breadcrumb([{ label: 'Pendeln', href: ROUTE.base }, { label: 'Quellen & Belege' }])}
    ${pageHead({
      eyebrow: 'Prüfstand · Nachweise',
      title: 'Quellen & Belege',
      lead: 'Jede Quelle mit Typ, Jahr, Prüftiefe und Interessenvermerk. Die Stufen A–E am Anfang jeder Zeile sagen, wofür die Quelle im Text verwendet wird.',
      meta: [`${model.stats.sources} Quellen`, `${model.stats.crossref} mit DOI`, UPDATED_LABEL],
    })}

    <section class="astro-section" aria-labelledby="rad-pruefstand-title">
      <h2 id="rad-pruefstand-title" tabindex="-1">Wie geprüft wurde</h2>
      <ul class="astro-facts">
        <li><strong>${model.stats.sources}</strong> Quellen, davon <strong>${model.stats.crossref}</strong> mit Crossref-geprüfter DOI</li>
        <li><strong>${model.stats.isbn}</strong> Bücher mit ISBN, <strong>${model.stats.withYear}</strong> Quellen mit gesichertem Jahr</li>
        <li><strong>${model.stats.chapters}</strong> Kapitel über drei Themenseiten</li>
      </ul>
      <div class="astro-callout">
        <p><strong>Prüftiefe statt Sammelbeleg.</strong> „Volltext geprüft“ bedeutet, dass die Seite gelesen wurde. Wo nur Abstract oder Register vorlagen, steht das in der Anmerkung — ebenso fehlende Volltexte und Datierungskonflikte.</p>
      </div>
      ${legend ? `<ul class="astro-list rad-legend-list">${legend}</ul>` : ''}
    </section>

    <section class="astro-section" aria-labelledby="rad-quellenliste-title">
      <h2 id="rad-quellenliste-title" tabindex="-1">Alle Quellen</h2>
      <div class="astro-source-cards">${cards}</div>
    </section>

    <section class="astro-section" aria-labelledby="rad-quellen-weiter-title">
      <h2 id="rad-quellen-weiter-title" tabindex="-1">Zurück zu den Texten</h2>
      <p class="astro-text">Quellenmarker im Fließtext springen direkt auf die passende Zeile dieser Liste. Die Kennzeichnung A–E wird auf der <a href="${ROUTE.methodik}">Methodik-Seite</a> erklärt.</p>
    </section>
  </div>`;

  return {
    html,
    title: TITLES.quellen,
    description: DESCRIPTIONS.quellen,
    h1: 'Quellen & Belege',
    target: sourceId,
  };
}

export function renderMethodik(model) {
  const levels = model.levels
    .map(
      (level) => `<div class="rad-level">
        <dt>${levelChip(level.key)}</dt>
        <dd>${escapeHtml(level.definition)} — ${escapeHtml(level.examples)}</dd>
      </div>`
    )
    .join('');

  const html = `<div class="rad">
    ${breadcrumb([{ label: 'Pendeln', href: ROUTE.base }, { label: 'Methodik & Grenzen' }])}
    ${pageHead({
      eyebrow: 'Transparenz · Prüfregeln',
      title: 'Methodik & Grenzen',
      lead: 'Wie dieser Bereich arbeitet: was als Aussage gilt, wie sie gekennzeichnet wird, was hier nicht behauptet wird — und welche Daten die Seite erhebt.',
      meta: [UPDATED_LABEL],
    })}

    <div class="astro-main">
      <section class="astro-section" id="arbeitsannahme" aria-labelledby="arbeitsannahme-title">
        <h2 id="arbeitsannahme-title" tabindex="-1">Arbeitsannahme</h2>
        <p class="astro-text">Radiästhesie, Pendeln und Orakel werden als kulturell überlieferte Praktiken beschrieben. Die Beschreibung ist keine Bestätigung: Ein Text kann eine Handhabung korrekt wiedergeben, ohne dass die behauptete Wirkung existiert.</p>
        <p class="astro-text">Deshalb steht die Binnensicht zuerst — wie Praktizierende arbeiten und warum — und die Einordnung folgt. Umgekehrt liest sich der Bereich als Abwehr und nicht als Information.</p>
        <p class="astro-text">An etablierte und alternative Erklärungen wird derselbe Maßstab angelegt. Eine ungewöhnliche Hypothese wird nicht wegen ihrer Ungewöhnlichkeit verworfen; sie braucht aber dieselbe Prüfung wie jede andere.</p>
      </section>

      <section class="astro-section" id="kennzeichnung" aria-labelledby="kennzeichnung-title">
        <h2 id="kennzeichnung-title" tabindex="-1">Kennzeichnung A–E</h2>
        <p class="astro-text">Jedes Kapitel trägt eine oder mehrere Stufen. Die Stufe sagt, auf welcher Ebene die Aussage gilt — nicht, wie überzeugend sie ist.</p>
        <dl class="rad-levels">${levels}</dl>
      </section>

      <section class="astro-section" id="pruefung" aria-labelledby="pruefung-title">
        <h2 id="pruefung-title" tabindex="-1">Was geprüft wird</h2>
        <p class="astro-text">Die Quellenbasis umfasst ${model.stats.sources} Einträge: ${model.stats.crossref} mit Crossref-geprüfter DOI, ${model.stats.isbn} Bücher mit ISBN, dazu Behörden-, Museums- und Fachquellen sowie Enzyklopädien als Sekundärquellen.</p>
        <p class="astro-text">Zu jeder Quelle stehen Typ, Jahr, Prüftiefe und — wo vorhanden — ein Interessenvermerk. Fehlende Volltexte, Datierungskonflikte und Lücken in der Forschungslage werden in der Anmerkung benannt. Wo keine Untersuchung existiert, steht das als Feststellung und nicht als Beweis für oder gegen eine Wirkung.</p>
        <p class="astro-text"><a href="${ROUTE.quellen()}">Zum vollständigen Quellenverzeichnis</a></p>
      </section>

      <section class="astro-section" id="grenzen" aria-labelledby="grenzen-title">
        <h2 id="grenzen-title" tabindex="-1">Was dieser Bereich nicht tut</h2>
        <ul class="astro-list">
          <li>Keine Heil-, Therapie- oder Gesundheitsempfehlung — auch nicht in verneinter Form.</li>
          <li>Keine finanzielle, rechtliche oder sicherheitsbezogene Prognose.</li>
          <li>Keine Darstellung von Bovis-Werten als physikalische Messgröße; die Skala ist ein Ordnungsschema der Szene.</li>
          <li>Keine Gleichsetzung von Radiästhesie und Divination: Radiästhesie ist der Oberbegriff für Ruten- und Pendelpraxis, Divination der weitere Bereich der Deutung.</li>
          <li>Keine scheinbaren Messwerte: Ein Ausschlag ist kein Messwert, solange Kalibrierung, Blindprotokoll und Fehlerbereich fehlen.</li>
        </ul>
      </section>

      <section class="astro-section" id="quelleninteressen" aria-labelledby="quelleninteressen-title">
        <h2 id="quelleninteressen-title" tabindex="-1">Umgang mit Quelleninteressen</h2>
        <p class="astro-text">Behörden, Museen, Fachvereine, Skeptikerorganisationen, kommerzielle Autoren und Befürworter werden unterschieden. Der Interessenvermerk ist kein Werturteil, sondern Kontext: Er sagt, welche Position ein Text einnimmt und welcher Prüfung er sich gestellt hat.</p>
        <p class="astro-text">Skeptische und befürwortende Texte werden mit demselben Maßstab behandelt. Wo eine Quelle nur als Position zitierbar ist, steht das in der Anmerkung.</p>
      </section>

      <section class="astro-section" id="datenschutz" aria-labelledby="datenschutz-title">
        <h2 id="datenschutz-title" tabindex="-1">Datenschutz</h2>
        <p class="astro-text">Der Bereich ist eine statische Seite. Die Inhalte liegen als Datendatei im Projekt und werden im Browser gerendert; es gibt keine Anmeldung, kein Konto und keine Speicherung von Eingaben. Suchbegriffe und Buchstabenfilter stehen nur in der Adresse.</p>
        <p class="astro-text">Es werden keine externen Skripte, Schriften oder Zähler nachgeladen. Auch die Quellen werden nur als Link geöffnet, wenn Sie darauf klicken.</p>
      </section>

      <section class="astro-section" id="rechtliches" aria-labelledby="rechtliches-title">
        <h2 id="rechtliches-title" tabindex="-1">${escapeHtml(model.data.legal.title)}</h2>
        ${model.data.legal.paragraphs.map((text) => paragraph(text)).join('')}
      </section>
    </div>
  </div>`;

  return { html, title: TITLES.methodik, description: DESCRIPTIONS.methodik, h1: 'Methodik & Grenzen' };
}

export function renderSuche(model, query = '') {
  const value = String(query || '').trim();
  const results = value ? model.search(value) : [];

  const grouped = new Map();
  for (const result of results) {
    if (!grouped.has(result.type)) grouped.set(result.type, []);
    grouped.get(result.type).push(result);
  }

  const list = results.length
    ? `<section class="astro-section" aria-labelledby="rad-treffer-title">
        <h2 id="rad-treffer-title" tabindex="-1">Treffer</h2>
        <ul class="astro-text-list">${results
          .map(
            (result) => `<li>
          <p class="rad-topic-meta">${escapeHtml(result.type)}</p>
          <h3><a href="${result.href}">${escapeHtml(result.title)}</a></h3>
          <p>${inlineText(result.text)}</p>
        </li>`
          )
          .join('')}</ul>
      </section>`
    : `<div class="astro-callout">
        <p><strong>${value ? 'Kein Treffer.' : 'Bitte einen Suchbegriff eingeben.'}</strong> ${
          value
            ? 'Die Suche prüft Themen, Kapitel, Glossar und Quellen.'
            : 'Einzelne Wörter liefern mehr Treffer als ganze Sätze.'
        }</p>
      </div>
      <ul class="rad-related">
        <li class="rad-related-item"><span class="rad-related-type">Vorschlag</span><h3><a href="${ROUTE.topic(
          'radiasthesie'
        )}">Radiästhesie</a></h3><p>Instrumente, Geschichte und Forschungsstand.</p></li>
        <li class="rad-related-item"><span class="rad-related-type">Vorschlag</span><h3><a href="${ROUTE.glossar()}">Glossar</a></h3><p>Begriffe von Bovis bis Wünschelrute.</p></li>
        <li class="rad-related-item"><span class="rad-related-type">Vorschlag</span><h3><a href="${ROUTE.topic(
          'orakel'
        )}">Orakel</a></h3><p>Tarot, I Ging, Runen und Delphi.</p></li>
      </ul>`;

  const html = `<div class="rad">
    ${breadcrumb([{ label: 'Pendeln', href: ROUTE.base }, { label: 'Suche' }])}
    ${pageHead({
      eyebrow: 'Service · Suche',
      title: 'Suche im Modul',
      lead: 'Durchsucht Themen, Kapitel, Glossar und Quellen. Die Suche läuft im Browser; es wird nichts übertragen.',
    })}

    <form class="astro-search astro-search--page" role="search" data-rad-form="suche">
      <label class="sr-only" for="radSuche">Suchbegriff</label>
      <input class="input" id="radSuche" type="search" name="q" value="${escapeHtml(
        value
      )}" placeholder="z. B. Wünschelrute, Bovis, Forer" />
      <button class="btn btn-secondary" type="submit">Suchen</button>
    </form>

    <p class="astro-note" role="status" aria-live="polite" data-rad-count>${results.length} Treffer${
      value ? ` für „${escapeHtml(value)}“` : ''
    }${grouped.size ? ` in ${grouped.size} Bereichen` : ''}</p>

    ${list}
  </div>`;

  return {
    html,
    title: value ? `Suche: ${value} — Radiästhesie, Pendeln und Orakel` : TITLES.suche,
    description: DESCRIPTIONS.suche,
    h1: 'Suche',
  };
}

export function renderNotFound(model, slug) {
  const html = `<div class="rad">
    ${breadcrumb([{ label: 'Pendeln', href: ROUTE.base }, { label: 'Nicht gefunden' }])}
    ${pageHead({
      eyebrow: 'Fehlerseite · Bereichsintern',
      title: 'Diese Seite gibt es nicht',
      lead: `Die Adresse „#pendeln/${escapeHtml(slug || '…')}“ gehört nicht zu diesem Modul. Drei Wege führen zurück.`,
    })}
    <ul class="rad-related">
      <li class="rad-related-item"><span class="rad-related-type">Übersicht</span><h2><a href="${ROUTE.base}">Modul-Startseite</a></h2><p>Drei Themen, Kennzeichnung und Werkstatt.</p></li>
      <li class="rad-related-item"><span class="rad-related-type">Nachschlagen</span><h2><a href="${ROUTE.glossar()}">Glossar</a></h2><p>Begriffe mit Stufe und Quellenverweis.</p></li>
      <li class="rad-related-item"><span class="rad-related-type">Prüfstand</span><h2><a href="${ROUTE.methodik}">Methodik</a></h2><p>Wie hier gekennzeichnet und geprüft wird.</p></li>
    </ul>
  </div>`;

  return { html, title: TITLES.notfound, description: DESCRIPTIONS.notfound, h1: 'Diese Seite gibt es nicht' };
}

export function renderFailure(message) {
  return {
    html: `<div class="rad">
      <div class="astro-callout astro-callout--limit">
        <p><strong>Die Inhalte konnten nicht geladen werden.</strong> ${escapeHtml(message)}</p>
        <p><a class="btn btn-secondary" href="${ROUTE.base}">Erneut laden</a></p>
      </div>
    </div>`,
    title: 'Radiästhesie, Pendeln und Orakel',
    description: DESCRIPTIONS.notfound,
    h1: '',
  };
}

/** BreadcrumbList als strukturierte Daten (nur für echte Navigationshierarchie). */
export function breadcrumbStructuredData(trail) {
  const items = trail
    .filter((entry) => entry.href)
    .map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.label,
      item: `https://ingbms.github.io/Esoterik-Welt/${entry.href}`,
    }));
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export function siteName() {
  return SITE;
}
