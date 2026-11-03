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
import { BOARD_LIMITS, BOARD_PRESETS, PALETTES, PALETTE_IDS } from './pendeltafel-model.js';
import { WERKSTATT } from '../data/radiasthesie-werkstatt.js';
import { ALPHA, TRIAL_LIMITS, answerLabels, formatPercent, testTypeLabel } from './experiment-statistik.js';

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
        <span class="rad-werk-state${entry.href ? ' rad-werk-state--ready' : ' rad-werk-state--planned'}">${escapeHtml(
          entry.state
        )}</span>
        <h3>${
          entry.href
            ? `<a class="rad-werk-link" href="${escapeHtml(entry.href)}">${escapeHtml(entry.title)}</a>`
            : escapeHtml(entry.title)
        }</h3>
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

/**
 * Pendellabor (RAD-07): echte Route mit Reglern, Bühne und Erklärtext.
 * Die Bühne ist reines Markup; die Physik und die Ereignisse hängt
 * js/modules/pendel-simulator.js beim Rendern an (#pendelLabor).
 */
export function renderLabor() {
  const html = `<div class="rad">
    ${breadcrumb([{ label: 'Pendeln', href: ROUTE.base }, { label: 'Pendellabor' }])}
    ${pageHead({
      eyebrow: 'Werkstatt · Mechanik',
      title: 'Pendellabor',
      subtitle: 'Fadenpendel: Länge, Auslenkung, Dämpfung',
      lead: 'Ein Pendel, das nach einer Gleichung schwingt — nicht nach einer Antwort. Länge, Startauslenkung und Dämpfung sind einstellbar; die Anzeige vergleicht die gemessene Schwingungsdauer mit der Kleinwinkelformel.',
      meta: [
        'Modell: nichtlineares Fadenpendel, Punktmasse am masselosen Faden',
        'Integrator: Runge-Kutta 4. Ordnung, fester Schritt 1/480 s',
        'Simulation, keine Messung und keine Informationsgewinnung',
      ],
    })}

    <section class="psim-section" aria-labelledby="psim-heading">
      <p class="rad-kicker">01 · Simulator</p>
      <h2 id="psim-heading" tabindex="-1">Bewegung einstellen und ablesen</h2>
      <p class="rad-section-lead">Die Bewegung startet erst auf Klick. Ohne Dämpfung bleibt die Amplitude erhalten, mit Dämpfung klingt sie ab. Die gemessene Dauer stammt aus der berechneten Bewegung, nicht aus der Formel.</p>
      <noscript><p class="astro-text">Der Simulator braucht JavaScript. Die Gleichungen, Grenzwerte und die Einordnung darunter stehen auch ohne Skript.</p></noscript>

      <div class="psim" id="pendelLabor" data-psim-state="idle">
        <div class="psim-stage">
          <div class="psim-scene" id="psimScene" tabindex="0" role="group" aria-label="Pendelbühne. Leertaste oder Eingabetaste startet und pausiert.">
            <svg class="psim-svg" viewBox="0 0 480 360" role="img" aria-labelledby="psimSvgTitle psimSvgDesc" focusable="false">
              <title id="psimSvgTitle">Fadenpendel mit Aufhängepunkt, Faden und Pendelkörper</title>
              <desc id="psimSvgDesc">Das Pendel schwingt aus der senkrechten Ruhelage heraus. Die Grafik zeigt die berechnete Bewegung, keine Messung und keine Anzeige verborgener Informationen.</desc>
              <defs>
                <radialGradient id="psimBrass" cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stop-color="#e9dbba"></stop>
                  <stop offset="60%" stop-color="#c6b38e"></stop>
                  <stop offset="100%" stop-color="#8b7957"></stop>
                </radialGradient>
                <radialGradient id="psimSteel" cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stop-color="#e6e9e4"></stop>
                  <stop offset="55%" stop-color="#9aa5a1"></stop>
                  <stop offset="100%" stop-color="#5d6a66"></stop>
                </radialGradient>
              </defs>
              <g class="psim-rig" aria-hidden="true">
                <line class="psim-beam" x1="88" y1="52" x2="392" y2="52"></line>
                <line class="psim-support" x1="120" y1="52" x2="120" y2="26"></line>
                <line class="psim-support" x1="360" y1="52" x2="360" y2="26"></line>
                <line class="psim-guide" x1="240" y1="52" x2="240" y2="336"></line>
                <circle class="psim-pivot" cx="240" cy="52" r="5"></circle>
              </g>
              <path class="psim-arc" id="psimArc" d="" aria-hidden="true"></path>
              <g class="psim-arm" id="psimArm" aria-hidden="true">
                <line class="psim-thread" id="psimThread" x1="240" y1="52" x2="240" y2="148"></line>
                <g data-psim-bob="klassisch" data-active transform="translate(240 148)">
                  <path class="psim-bob-brass" fill="url(#psimBrass)" d="M-9,-9 L9,-9 L0,10 Z"></path>
                  <circle class="psim-bob-cap" cx="0" cy="-10.5" r="3.5"></circle>
                </g>
                <g data-psim-bob="kugel" transform="translate(240 148)">
                  <circle class="psim-bob-steel" fill="url(#psimSteel)" r="15"></circle>
                  <circle class="psim-bob-shine" cx="-5" cy="-5" r="4"></circle>
                </g>
                <g data-psim-bob="ring" transform="translate(240 148)">
                  <circle class="psim-bob-ring" r="13"></circle>
                  <circle class="psim-bob-core" r="3"></circle>
                </g>
              </g>
            </svg>
          </div>
          <p class="psim-hint">Tastatur: Tab erreicht die Regler und die Bühne; Leertaste oder Eingabetaste auf der Bühne startet und pausiert.</p>

          <dl class="psim-readout" aria-label="Messwerte der Simulation">
            <div><dt>Simulierte Zeit</dt><dd><output id="psimTime">0,00 s</output></dd></div>
            <div><dt>Auslenkung</dt><dd><output id="psimTheta">25,0°</output></dd></div>
            <div><dt>Schwingungsdauer gemessen</dt><dd><output id="psimPeriodMeasured">—</output></dd></div>
            <div><dt>Schwingungsdauer T₀ (Kleinwinkel)</dt><dd><output id="psimPeriodIdeal">1,003 s</output></dd></div>
          </dl>
          <p class="psim-status" id="psimStatus" role="status" aria-live="polite">Ruhelage bei 25,0°. Start setzt die Bewegung in Gang.</p>
        </div>

        <div class="psim-controls">
          <fieldset class="psim-field">
            <legend>Parameter</legend>
            <div class="psim-control">
              <label for="psimLength">Pendellänge</label>
              <input type="range" id="psimLength" name="psimLength" min="5" max="200" step="1" value="25" aria-describedby="psimLengthHint" />
              <output class="psim-value" id="psimLengthValue" for="psimLength">25 cm</output>
              <p class="psim-hint" id="psimLengthHint">5 bis 200 cm. Die Länge steht unter der Wurzel: vierfache Länge, doppelte Dauer.</p>
            </div>
            <div class="psim-control">
              <label for="psimAmplitude">Anfangsauslenkung</label>
              <input type="range" id="psimAmplitude" name="psimAmplitude" min="0" max="80" step="1" value="25" aria-describedby="psimAmplitudeHint" />
              <output class="psim-value" id="psimAmplitudeValue" for="psimAmplitude">25,0°</output>
              <p class="psim-hint" id="psimAmplitudeHint">0 bis 80 Grad. Ab etwa 15 Grad weicht die Dauer messbar von der Kleinwinkelformel ab.</p>
            </div>
            <div class="psim-control">
              <label for="psimDamping">Dämpfungsgrad ζ</label>
              <input type="range" id="psimDamping" name="psimDamping" min="0" max="0.2" step="0.005" value="0.02" aria-describedby="psimDampingHint" />
              <output class="psim-value" id="psimDampingValue" for="psimDamping">0,020</output>
              <p class="psim-hint" id="psimDampingHint">0 bis 0,20. Bei 0 schwingt das Pendel ungedämpft weiter, darüber klingt die Amplitude ab.</p>
            </div>
          </fieldset>

          <fieldset class="psim-field">
            <legend>Pendeldarstellung</legend>
            <label class="psim-choice"><input type="radio" name="psimStyle" value="klassisch" checked /> <span>Klassisch — Faden und Messingkegel</span></label>
            <label class="psim-choice"><input type="radio" name="psimStyle" value="kugel" /> <span>Kugel — Faden und Stahlkugel</span></label>
            <label class="psim-choice"><input type="radio" name="psimStyle" value="ring" /> <span>Ring — Faden und Metallring</span></label>
          </fieldset>

          <div class="psim-actions">
            <button type="button" class="btn btn-primary" id="psimToggle" aria-pressed="false">Start</button>
            <button type="button" class="btn btn-secondary" id="psimReset">Zurücksetzen</button>
            <button type="button" class="btn btn-secondary" id="psimStep" hidden>Schritt 0,5 s</button>
          </div>
          <p class="psim-hint">Die Darstellung ändert nur die Zeichnung. Alle drei Varianten rechnen dasselbe Modell.</p>
        </div>
      </div>
    </section>

    <section class="astro-section" id="psim-modell" aria-labelledby="psim-modell-title">
      <p class="rad-kicker">02 · Modell</p>
      <h2 id="psim-modell-title" tabindex="-1">Wie die Bewegung berechnet wird</h2>
      <p class="astro-text">Das Pendel ist als Punktmasse an einem masselosen Faden modelliert. Die Rückstellkraft ist proportional zu sin θ, nicht zu θ — deshalb ist die Bewegung bei großen Auslenkungen nicht mehr exakt harmonisch. Gerechnet wird mit der vollen Gleichung, nicht mit der Näherung.</p>
      <h3>Bewegungsgleichung</h3>
      <p class="psim-formula">θ″(t) = −(g/L) · sin θ(t) − 2ζω₀ · θ′(t)</p>
      <p class="astro-text">Dabei ist θ der Winkel gegen die Senkrechte, L die Fadenlänge, g die Fallbeschleunigung und ω₀ = √(g/L) die Eigenkreisfrequenz. Der zweite Term beschreibt eine viskose Dämpfung, die proportional zur Winkelgeschwindigkeit wirkt.</p>
      <h3>Kleinwinkel-Näherung als Vergleichswert</h3>
      <p class="psim-formula">T₀ = 2π · √(L/g)</p>
      <p class="astro-text">Für θ → 0 gilt sin θ ≈ θ, und die Dauer hängt nur noch von der Länge ab. Diese Formel steht als Vergleich in der Anzeige. Bei 25 Grad liegt die echte Dauer rund 1,2 Prozent darüber, bei 60 Grad rund 7,3 Prozent, bei 80 Grad rund 13,7 Prozent. Wer die Abweichung sieht, sieht auch, warum die Näherung nur für kleine Winkel taugt.</p>
      <h3>Numerische Integration</h3>
      <p class="astro-text">Die Gleichung wird mit Runge-Kutta 4. Ordnung und einem festen Zeitschritt von 1/480 Sekunde (etwa 2,08 ms) integriert. Ein Akkumulator sammelt die verstrichene Echtzeit ein und führt nur ganze Schritte aus. Dadurch hängt das Ergebnis weder von der Bildrate noch von der Frame-Aufteilung ab: 30 und 144 Bilder pro Sekunde liefern nach derselben simulierten Zeit denselben Zustand.</p>
      <h3>Dämpfung</h3>
      <p class="psim-formula">T_ζ = 2π / (ω₀ · √(1 − ζ²))</p>
      <p class="astro-text">Der Dämpfungsgrad ζ ist dimensionslos. Bei ζ = 0 bleibt die Amplitude erhalten (abgesehen vom kleinen Fehler des Integrators), bei ζ = 0,05 verliert das Pendel pro Periode etwa 27 Prozent seiner Auslenkung. Die angezeigte gemessene Dauer ist die Zeit zwischen zwei Nulldurchgängen der berechneten Bewegung.</p>
      ${plate(
        {
          src: 'assets/radiasthesie/pendel-geometrie.svg',
          alt: 'Schematische Zeichnung eines Pendels: Aufhängepunkt, Faden der Länge L, ausgelenkter Pendelkörper und der Winkel Theta zwischen Ruhelage und Faden.',
          caption:
            '**Pendelgeometrie.** Länge L, Auslenkung θ, Schwingungsdauer T. Eigene Zeichnung; sie zeigt die Modellgrößen und ist keine Messung.',
        },
        { className: 'rad-plate--article' }
      )}
    </section>

    <section class="astro-section" id="psim-grenzen" aria-labelledby="psim-grenzen-title">
      <p class="rad-kicker">03 · Grenzen</p>
      <h2 id="psim-grenzen-title" tabindex="-1">Gültigkeitsbereich und Annahmen</h2>
      <dl class="psim-limits">
        <div><dt>Pendellänge L</dt><dd>0,05 bis 2,00 m</dd></div>
        <div><dt>Anfangsauslenkung θ₀</dt><dd>0 bis 80°</dd></div>
        <div><dt>Dämpfungsgrad ζ</dt><dd>0 bis 0,20</dd></div>
        <div><dt>Fallbeschleunigung g</dt><dd>9,81 m/s², fest gesetzt — keine Ortsabhängigkeit, kein Eingabefeld</dd></div>
        <div><dt>Modell</dt><dd>Punktmasse, masseloser Faden, viskose Dämpfung proportional zur Winkelgeschwindigkeit</dd></div>
        <div><dt>Nicht enthalten</dt><dd>Fadenmasse, elastische Aufhängung, Luftwiderstand als quadratischer Term, Antrieb, chaotische Anregung</dd></div>
        <div><dt>Zeitschritt</dt><dd>1/480 s fest; ein Frame verarbeitet höchstens 0,25 s, damit ein Tab-Wechsel keinen Sprung erzeugt</dd></div>
        <div><dt>Reproduzierbarkeit</dt><dd>gleiche Parameter und gleiche simulierte Zeit ergeben denselben Zustand, unabhängig von der Bildrate</dd></div>
      </dl>
      <p class="astro-text">Die Anzeige „gemessen“ meint die Dauer der berechneten Bewegung, nicht die Dauer eines physischen Pendels. Ein reales Pendel weicht zusätzlich durch Luftwiderstand, Steifigkeit des Fadens und die Ausdehnung des Pendelkörpers ab.</p>
      ${paragraph(
        'Ein von Hand gehaltenes Pendel folgt dieser Gleichung nicht allein: Unwillkürliche Handbewegungen durch Erwartung und Aufmerksamkeit (Carpenter-Effekt) und eine Muskelkontraktion nach vorheriger Spannung und visueller Fixierung (Kohnstamm-Effekt) erklären den Ausschlag, ohne dass eine Information übertragen wird [Q03, Q07]. Dieses Labor zeigt den freien, nicht angetriebenen Fall — nicht die Hand.'
      )}
    </section>

    <aside class="rad-disclaimer" aria-labelledby="psim-nicht-title">
      <h2 class="rad-disclaimer-title" id="psim-nicht-title">Was diese Simulation nicht tut</h2>
      <p><strong>Keine Informationsgewinnung:</strong> Das Pendel bewegt sich nach einer Differentialgleichung. Es beantwortet keine Fragen, zeigt keine verborgenen Felder und liefert keine Angaben über Personen, Orte oder Ereignisse.</p>
      <p><strong>Keine Vorhersage:</strong> Die Ausgabe ist aus den eingestellten Parametern berechenbar. Wer die Regler kennt, kennt das Ergebnis; es gibt keinen zusätzlichen Kanal.</p>
      <p><strong>Kein Messgerät:</strong> Die Zahlen sind Simulationswerte. Sie sagen nichts über radiästhetische Praktiken aus und ersetzen keine Untersuchung.</p>
    </aside>

    <p class="astro-text psim-links">
      <a class="btn btn-secondary" href="${ROUTE.topic('pendeln')}">Zum Thema Pendeln</a>
      <a class="textlink" href="${ROUTE.methodik}">Methodik &amp; Prüfregeln lesen</a>
    </p>
  </div>`;

  return {
    html,
    title: 'Pendellabor — Mechanik des Fadenpendels',
    description:
      'Interaktiver Pendelsimulator: Länge, Auslenkung und Dämpfung einstellen, Dauer messen und mit der Kleinwinkelformel vergleichen — ohne Wirkungsversprechen.',
    h1: 'Pendellabor',
    simulator: true,
  };
}

/**
 * Pendeltafel-Studio (RAD-08): echte Route mit Vorlagen, freien
 * Beschriftungen, Farbstilen, SVG-/JSON-Export und Druckansicht.
 *
 * Das Markup ist die Bedienfläche; js/modules/pendeltafel-studio.js hängt
 * Vorschau, Prüfung, Export und Import an #pendeltafelStudio. Ohne JavaScript
 * bleiben Vorlagenbeschreibung, Exportwege und Grenzen lesbar.
 */
export function renderStudio() {
  const presetOptions = BOARD_PRESETS.map(
    (preset, index) =>
      `<option value="${escapeHtml(preset.id)}"${index === 0 ? ' selected' : ''}>${escapeHtml(
        preset.title
      )} — ${preset.labels.length} Segmente</option>`
  ).join('');

  const paletteChoices = PALETTE_IDS.map((id, index) => {
    const palette = PALETTES[id];
    return `<label class="ptf-choice">
      <input type="radio" name="ptfPalette" value="${escapeHtml(id)}"${index === 0 ? ' checked' : ''} />
      <span class="ptf-choice-body">
        <span class="ptf-choice-head">
          <span class="ptf-swatch ptf-swatch--${escapeHtml(id)}" aria-hidden="true"></span>
          <span class="ptf-choice-name">${escapeHtml(palette.label)}</span>
        </span>
        <span class="ptf-choice-note">${escapeHtml(palette.note)}</span>
      </span>
    </label>`;
  }).join('');

  const presetNotes = BOARD_PRESETS.map(
    (preset) => `<li><strong>${escapeHtml(preset.title)}</strong> — ${escapeHtml(preset.description)}</li>`
  ).join('');

  const html = `<div class="rad">
    ${breadcrumb([{ label: 'Pendeln', href: ROUTE.base }, { label: 'Pendeltafel-Studio' }])}
    ${pageHead({
      eyebrow: 'Werkstatt · Tafel',
      title: 'Pendeltafel-Studio',
      subtitle: 'Ja/Nein, Zahlenkreis, Buchstaben und freie Segmente',
      lead: 'Eine Tafel ordnet, welche Antwort gemeint ist — sie misst nichts. Hier lassen sich Vorlage, Beschriftungen und Farbstil festlegen und als SVG oder Druckvorlage ausgeben. Die Bedeutung der Segmente bleibt eine vorher getroffene Vereinbarung.',
      meta: [
        'Export: SVG-Datei, JSON-Konfiguration, Druck bzw. PDF über den Browser',
        `Grenzen: ${BOARD_LIMITS.minSegments}–${BOARD_LIMITS.maxSegments} Segmente, ${BOARD_LIMITS.maxTitleLength} Zeichen Überschrift, 32 KiB Import`,
        'Keine Speicherung, keine Übertragung: alles bleibt im Browser',
      ],
    })}

    <section class="ptf-section" aria-labelledby="ptf-heading">
      <p class="rad-kicker">01 · Werkstatt</p>
      <h2 id="ptf-heading" tabindex="-1">Tafel aufbauen, beschriften, ausgeben</h2>
      <p class="rad-section-lead">Die Vorschau zeigt genau die Zeichnung des SVG-Downloads. Änderungen wirken sofort und ohne Server.</p>
      <noscript><p class="astro-text">Das Studio braucht JavaScript. Die Vorlagen, Exportwege und Grenzen stehen darunter auch ohne Skript.</p></noscript>

      <div class="ptf" id="pendeltafelStudio">
        <form class="ptf-editor" id="ptfForm" novalidate>
          <fieldset class="ptf-fieldset">
            <legend>Tafel</legend>
            <div class="ptf-control">
              <label for="ptfPreset">Vorlage</label>
              <select id="ptfPreset" name="ptfPreset">${presetOptions}<option value="custom">Eigene Beschriftungen</option></select>
              <p class="ptf-hint" id="ptfPresetHint">Eine Vorlage laden ersetzt Überschrift und Beschriftungen. Eigene Zeilen stehen als „Eigene Beschriftungen“.</p>
            </div>
          </fieldset>

          <fieldset class="ptf-fieldset">
            <legend>Farbstil</legend>
            <div class="ptf-choices">${paletteChoices}</div>
          </fieldset>

          <div class="ptf-control">
            <label for="ptfTitle">Überschrift der Tafel</label>
            <input type="text" id="ptfTitle" name="ptfTitle" maxlength="${BOARD_LIMITS.maxTitleLength}" value="Ja/Nein-Tafel" autocomplete="off" aria-describedby="ptfTitleHint" />
            <p class="ptf-hint" id="ptfTitleHint">Bis ${BOARD_LIMITS.maxTitleLength} Zeichen. Steht im Bild und in der Druckansicht.</p>
          </div>

          <div class="ptf-control">
            <label for="ptfLabels">Beschriftungen — eine pro Zeile</label>
            <textarea id="ptfLabels" name="ptfLabels" rows="8" spellcheck="false" autocomplete="off" aria-describedby="ptfLabelsHint ptfLimits">JA
NEIN</textarea>
            <p class="ptf-hint" id="ptfLabelsHint">Jede Zeile ist ein Segment. ${BOARD_LIMITS.minSegments} bis ${BOARD_LIMITS.maxSegments} Zeilen; wie viele Zeichen je Segment passen, hängt von der Segmentzahl ab.</p>
            <p class="ptf-hint" id="ptfLimits" data-ptf-limits>2 Segmente · höchstens 38 Zeichen je Beschriftung</p>
            <p class="ptf-error" id="ptfLabelError" role="alert" hidden></p>
          </div>

          <div class="ptf-actions">
            <button type="button" class="btn btn-primary" id="ptfDownloadSvg">SVG herunterladen</button>
            <button type="button" class="btn btn-secondary" id="ptfDownloadJson">Konfiguration (JSON)</button>
            <button type="button" class="btn btn-secondary" id="ptfPrint">Drucken / PDF</button>
          </div>

          <details class="ptf-import" id="ptf-import">
            <summary>Konfiguration importieren</summary>
            <div class="ptf-import-body">
              <div class="ptf-control">
                <label for="ptfImportFile">JSON-Datei</label>
                <input type="file" id="ptfImportFile" accept=".json,application/json" aria-describedby="ptfImportHint" />
              </div>
              <div class="ptf-control">
                <label for="ptfImportText">oder JSON einfügen</label>
                <textarea id="ptfImportText" rows="4" spellcheck="false" autocomplete="off" aria-describedby="ptfImportHint"></textarea>
              </div>
              <button type="button" class="btn btn-secondary" id="ptfImportApply">Importieren</button>
              <p class="ptf-hint" id="ptfImportHint">Höchstens ${Math.round(
                BOARD_LIMITS.maxBytes / 1024
              )} KiB. Erwartet wird ein Objekt mit den Feldern schema, preset, title, palette und labels. Unbekannte Felder und Markup-Zeichen werden abgelehnt.</p>
            </div>
          </details>

          <ul class="ptf-errors" id="ptfErrors" role="alert" hidden></ul>
          <p class="ptf-status" id="ptfStatus" role="status" aria-live="polite">Bereit. Die Vorschau zeigt den aktuellen Stand.</p>
        </form>

        <div class="ptf-preview">
          <h3 id="ptfPreviewTitle">Vorschau</h3>
          <div class="ptf-canvas" id="ptfPreview" aria-labelledby="ptfPreviewTitle"></div>
          <p class="ptf-hint">Die Vorschau ist die Exportdatei im Browser. Sie enthält keine Skripte und keine externen Verweise.</p>
        </div>
      </div>

      <section class="ptf-printblock" aria-labelledby="ptf-print-title">
        <h3 id="ptf-print-title">Druckansicht</h3>
        <p class="ptf-print-note">Genau diese Seite erscheint im Druckdialog: eine A4-Seite mit Überschrift, Tafel und Fußzeile, ohne Navigation und ohne Bedienelemente. Für Papier empfiehlt sich der Farbstil „Papier“.</p>
        <div class="ptf-sheet" id="ptfSheet">
          <div class="ptf-sheet-head">
            <p class="ptf-sheet-kicker">Esoterik-Welt · Pendeltafel-Studio</p>
            <p class="ptf-sheet-title" id="ptfSheetTitle">Ja/Nein-Tafel</p>
          </div>
          <div class="ptf-sheet-board" id="ptfSheetBoard"></div>
          <div class="ptf-sheet-foot">
            <p>Die Tafel ordnet die Bedeutung der Segmente. Sie misst nichts, beantwortet keine Fragen und ersetzt keine Untersuchung.</p>
            <p>Stand: <span id="ptfSheetDate">—</span> · Farbstil: <span id="ptfSheetPalette">Messing</span> · Beschriftungen selbst festgelegt</p>
          </div>
        </div>
        <p class="ptf-hint">PDF: im Druckdialog als Ziel „Als PDF speichern“ wählen. Der Dateiname stammt aus dem Seitentitel; die Tafel selbst bleibt eine Vektorgrafik.</p>
      </section>
    </section>

    <section class="astro-section" id="ptf-export" aria-labelledby="ptf-export-title">
      <p class="rad-kicker">02 · Ausgabe</p>
      <h2 id="ptf-export-title" tabindex="-1">Drei Exportwege und was sie enthalten</h2>
      <dl class="ptf-export-list">
        <div><dt>SVG-Datei</dt><dd>Eigenständige Vektorgrafik mit Überschrift, Segmenten und Fußzeile. Enthält Text als Text, keine Skripte, keine Eventhandler und keine externen Verweise. Geeignet für Druck, Vektorgrafik-Programme und als Vorlage für eigene Anpassungen.</dd></div>
        <div><dt>JSON-Konfiguration</dt><dd>Überschrift, Vorlage, Farbstil und Beschriftungen als Daten — nicht die Zeichnung. Dieselbe Datei lässt sich im Studio wieder importieren; sie wird dabei vollständig geprüft. Für eigene Werkzeuge und zur Weitergabe einer Tafel an andere.</dd></div>
        <div><dt>Druck / PDF</dt><dd>Eine A4-Seite über den Druckdialog des Browsers. Die Druckansicht blendet Navigation, Regler und Hinweise aus; übrig bleiben Überschrift, Tafel und Fußzeile. Die PDF-Ausgabe ist der Druckweg des Browsers, keine eigene PDF-Bibliothek.</dd></div>
      </dl>
      <p class="astro-text">Der SVG-Export ist bewusst eine Datei und kein Daten-URL: Sie lässt sich mit einem Bildbetrachter, einem Vektorprogramm oder im Browser öffnen, ohne dass die Seite geladen wird. Gedruckt wird die Tafel in der Größe der Druckansicht; für eine andere Größe empfiehlt sich der SVG-Export.</p>
    </section>

    <section class="astro-section" id="ptf-vorlagen" aria-labelledby="ptf-vorlagen-title">
      <p class="rad-kicker">03 · Vorlagen</p>
      <h2 id="ptf-vorlagen-title" tabindex="-1">Vier Tafelarten, ein Aufbau</h2>
      <p class="astro-text">Alle Vorlagen sind gleich aufgebaut: gleiche Segmentgröße, gleiche Schrift, gleicher Mittelpunkt. Unterschiedlich sind nur Anzahl und Beschriftung der Segmente. Maße und Bedeutung bleiben Vereinbarung — die Tafel ist kein Messgerät.</p>
      <ul class="astro-list">${presetNotes}</ul>
      <p class="astro-text">Die Beschriftungen sind frei: Zahlen, Buchstaben, Wörter, Farbnamen oder Kategorien. Doppelte Beschriftungen sind erlaubt, aber schwer zu unterscheiden; das Studio weist darauf hin.</p>
    </section>

    <section class="astro-section" id="ptf-pruefung" aria-labelledby="ptf-pruefung-title">
      <p class="rad-kicker">04 · Prüfung</p>
      <h2 id="ptf-pruefung-title" tabindex="-1">Was der Import prüft</h2>
      <p class="astro-text">Eine importierte Konfiguration wird nicht ausgeführt, sondern gegen ein festes Schema geprüft. Abgelehnt werden: unbekannte Felder, ein falscher Schema-Bezeichner, unbekannte Vorlagen oder Farbstile, weniger als ${BOARD_LIMITS.minSegments} oder mehr als ${BOARD_LIMITS.maxSegments} Segmente, leere oder zu lange Beschriftungen, Steuerzeichen und die Markup-Zeichen &lt; und &gt;. Zusätzlich gilt eine Obergrenze von ${Math.round(
        BOARD_LIMITS.maxBytes / 1024
      )} KiB für die Datei.</p>
      <p class="astro-text">Alle übernommenen Texte werden bei der Ausgabe zusätzlich escaped. Die SVG-Datei enthält kein <code>&lt;script&gt;</code>, keinen Eventhandler, kein <code>&lt;foreignObject&gt;</code>, kein <code>&lt;image&gt;</code> und keine externe Referenz — Attribute und Geometrie stammen ausschließlich aus dem Studio, nie aus der Eingabe.</p>
      <p class="astro-text">Geprüft wurden unter anderem XSS-Eingaben wie <code>&lt;script&gt;alert(1)&lt;/script&gt;</code> in Beschriftung und Überschrift, Umlaute und Sonderzeichen, der Export mit anschließendem Reimport sowie die Druckansicht. Die Nachweise stehen im Prüfbericht zu RAD-08.</p>
    </section>

    <aside class="rad-disclaimer" aria-labelledby="ptf-nicht-title">
      <h2 class="rad-disclaimer-title" id="ptf-nicht-title">Was diese Tafel nicht tut</h2>
      <p><strong>Keine Messung:</strong> Die Segmente sind eine vereinbarte Ordnung. Die Tafel zeigt keine Felder, Strahlungen oder Zustände an.</p>
      <p><strong>Keine Antwort:</strong> Welches Segment „gilt“, entscheidet die Person, die die Tafel benutzt — nicht die Grafik.</p>
      <p><strong>Kein Standard:</strong> Es gibt kein normiertes Tafellayout. Die Ausgabe ist ein Gestaltungsvorschlag, keine Reproduktion einer historischen Vorlage.</p>
    </aside>

    <p class="astro-text psim-links">
      <a class="btn btn-secondary" href="${ROUTE.topic('pendeln')}">Zum Thema Pendeln</a>
      <a class="textlink" href="${ROUTE.labor}">Pendellabor öffnen</a>
    </p>
  </div>`;

  return {
    html,
    title: 'Pendeltafel-Studio — Tafeln beschriften und exportieren',
    description:
      'Pendeltafeln selbst gestalten: Ja/Nein, Zahlenkreis, Buchstaben und freie Segmente, vier Farbstile, SVG-Export und Druckansicht — ohne Wirkungsversprechen.',
    h1: 'Pendeltafel-Studio',
    studio: true,
  };
}

/**
 * Experimentierlabor (RAD-09): echte Route mit zwei getrennten Modi.
 *
 * Das Markup enthält ausschließlich Protokoll und Bedienfläche. Ziel,
 * Commitment und Antworten leben im Controller (experiment-labor.js); die
 * Ansicht kennt kein Ziel und schreibt keines ins Dokument. Ohne JavaScript
 * bleiben Protokoll, Auswertungsverfahren und Grenzen lesbar.
 */
export function renderExperiment() {
  const experiments = WERKSTATT.experimente;
  const demoTypes = ['jaNein', 'richtung', 'zahl'];

  const choices = experiments
    .map(
      (experiment, index) => `<label class="exp-choice">
        <input type="radio" name="expExperiment" value="${escapeHtml(experiment.id)}"${index === 0 ? ' checked' : ''} />
        <span class="exp-choice-body">
          <span class="exp-choice-head">${escapeHtml(experiment.title)}</span>
          <span class="exp-choice-note">${escapeHtml(testTypeLabel(experiment.testType))} · k = ${
            experiment.k
          } Ziele · n = ${experiment.n} Versuche · p = ${formatPercent(experiment.baseProbability)}</span>
          <span class="exp-choice-text">${escapeHtml(experiment.summary)}</span>
        </span>
      </label>`
    )
    .join('');

  const protocols = experiments
    .map((experiment, index) => {
      const labels = answerLabels(experiment.testType, experiment.k).join(', ');
      return `<div class="exp-protocol-block" data-exp-protocol="${escapeHtml(experiment.id)}"${
        index === 0 ? '' : ' hidden'
      }>
        <table class="exp-protocol">
          <caption>Vorregistriertes Protokoll: ${escapeHtml(experiment.title)}</caption>
          <tbody>
            <tr><th scope="row">Testart</th><td>${escapeHtml(testTypeLabel(experiment.testType))} (${escapeHtml(
              experiment.testType
            )})</td></tr>
            <tr><th scope="row">Zielraum</th><td>${experiment.k} gleich wahrscheinliche Ziele: ${escapeHtml(
              labels
            )}</td></tr>
            <tr><th scope="row">Basiswahrscheinlichkeit</th><td>${formatPercent(
              experiment.baseProbability,
              1
            )} je Versuch (1/${experiment.k})</td></tr>
            <tr><th scope="row">Geplante Fallzahl</th><td>${experiment.n} Versuche</td></tr>
            <tr><th scope="row">Abbruchregel</th><td>Nach genau ${experiment.n} Versuchen endet der Lauf. Keine Zwischenauswertung, kein vorzeitiger Abbruch, keine Nachlese.</td></tr>
            <tr><th scope="row">Primäre Auswertung</th><td>Exakter zweiseitiger Binomialtest der Trefferzahl gegen p = ${formatPercent(
              experiment.baseProbability,
              1
            )}, Schwelle α = ${formatPercent(ALPHA, 0).replace(/\s/g, '')}; zusätzlich Wilson-95-%-Intervall der Trefferquote.</td></tr>
            <tr><th scope="row">Hypothese</th><td>${escapeHtml(experiment.hypothesis)}</td></tr>
            <tr><th scope="row">Ablauf</th><td>${escapeHtml(experiment.instructions)}</td></tr>
          </tbody>
        </table>
      </div>`;
    })
    .join('');

  const demoOptions = demoTypes
    .map(
      (type) =>
        `<option value="${escapeHtml(type)}">${escapeHtml(testTypeLabel(type))} — ${answerLabels(type, type === 'richtung' ? 8 : type === 'zahl' ? 5 : 2).length} Ziele</option>`
    )
    .join('');

  const html = `<div class="rad">
    ${breadcrumb([{ label: 'Pendeln', href: ROUTE.base }, { label: 'Experimentierlabor' }])}
    ${pageHead({
      eyebrow: 'Werkstatt · Prüfung',
      title: 'Experimentierlabor',
      subtitle: 'Verdecktes Ziel, gesperrte Antwort, feste Auswertung',
      lead: 'Hier lässt sich prüfen, ob eine Antwort das verdeckte Ziel häufiger trifft als der Zufall. Das Ziel wird unabhängig gezogen und verdeckt gehalten; die Antwort wird gespeichert, bevor das Ziel erscheint. Spielmodus und auswertbarer Testmodus sind getrennt.',
      meta: [
        'Protokoll vor dem Start: Zielraum, Fallzahl, Abbruchregel und Auswertung stehen fest',
        'Zufall: Web Crypto (crypto.getRandomValues), kein Math.random',
        `Testarten: ${experiments.length} vorregistrierte Läufe · Zielraum ${TRIAL_LIMITS.minK}–${TRIAL_LIMITS.maxK}`,
      ],
    })}

    <section class="exp-section" aria-labelledby="exp-heading">
      <p class="rad-kicker">01 · Labor</p>
      <h2 id="exp-heading" tabindex="-1">Modus wählen und Versuche durchführen</h2>
      <p class="rad-section-lead">Der Spielmodus zeigt sofort ein Ergebnis und zählt nichts. Der Testmodus folgt einem vorregistrierten Protokoll, speichert jede gesperrte Antwort und wertet erst nach der festen Fallzahl aus.</p>
      <noscript><p class="astro-text">Das Labor braucht JavaScript: Zufallsziel, Sperre und Auswertung laufen im Browser. Protokoll, Verfahren und Grenzen stehen darunter auch ohne Skript.</p></noscript>

      <div class="exp" id="experimentLabor">
        <fieldset class="exp-modes">
          <legend>Modus</legend>
          <label class="exp-mode">
            <input type="radio" name="expMode" value="test" checked />
            <span class="exp-mode-body">
              <span class="exp-mode-name">Testmodus</span>
              <span class="exp-mode-note">Vorregistriert, gespeichert, exportierbar. Zählt in die Auswertung.</span>
            </span>
          </label>
          <label class="exp-mode">
            <input type="radio" name="expMode" value="demo" />
            <span class="exp-mode-body">
              <span class="exp-mode-name">Spielmodus (Demo)</span>
              <span class="exp-mode-note">Sofortiges Feedback, keine Speicherung, keine Statistik.</span>
            </span>
          </label>
        </fieldset>

        <div class="exp-panel" data-exp-panel="demo" hidden>
          <p class="exp-badge">Spielmodus — zählt nicht, wird nicht gespeichert und nicht exportiert.</p>
          <div class="exp-control">
            <label for="expDemoType">Testart im Spielmodus</label>
            <select id="expDemoType">${demoOptions}</select>
          </div>
          <p class="exp-question">Welches Ziel wurde gezogen?</p>
          <div class="exp-answers" id="expDemoAnswers" role="group" aria-label="Antwort im Spielmodus"></div>
          <p class="exp-feedback" id="expDemoFeedback" role="status" aria-live="polite">Wähle eine Antwort. Das Ziel erscheint sofort.</p>
          <p class="exp-demo-counter" id="expDemoCounter">0 Versuche · 0 Treffer</p>
          <button type="button" class="btn btn-secondary" id="expDemoReset">Spielstand zurücksetzen</button>
        </div>

        <div class="exp-panel" data-exp-panel="test">
          <fieldset class="exp-experiments" id="expExperimentField">
            <legend>Vorregistriertes Experiment</legend>
            ${choices}
          </fieldset>

          <div class="exp-protocols" id="expProtocols">${protocols}</div>

          <div class="exp-start">
            <button type="button" class="btn btn-primary" id="expStart">Lauf starten</button>
            <p class="exp-hint">Mit dem Start stehen Zielraum, Fallzahl, Abbruchregel und Auswertung fest. Ein begonnener Lauf wird gespeichert; die Antwort jedes Versuchs ist nach dem Sperren unveränderlich.</p>
            <p class="exp-error" id="expStartError" role="alert" hidden></p>
          </div>

          <div class="exp-trial" id="expTrialPanel" hidden>
            <p class="exp-trial-meta"><span id="expTrialCounter">Versuch 1 von 20</span> · <span id="expRunLabel">Lauf —</span></p>
            <h3 id="expQuestion" tabindex="-1">Welches Ziel wurde gezogen?</h3>
            <p class="exp-question-note">Das Ziel wurde vor dieser Anzeige gezogen und als Commitment gespeichert. Es steht nicht im Dokument, nicht im Seitentitel und nicht im Speicher.</p>
            <div class="exp-answers" id="expAnswers" role="group" aria-labelledby="expQuestion"></div>
            <div class="exp-lock">
              <button type="button" class="btn btn-primary" id="expLock" disabled>Antwort endgültig sperren</button>
              <p class="exp-hint" id="expLockHint">Erst nach dem Sperren wird das Ziel enthüllt. Die Antwort lässt sich danach nicht ändern; es gibt keine Korrektur einzelner Versuche.</p>
            </div>
            <div class="exp-reveal" id="expReveal" hidden>
              <p class="exp-reveal-text" id="expRevealText"></p>
              <button type="button" class="btn btn-secondary" id="expNext">Nächster Versuch</button>
            </div>
            <p class="exp-status" id="expStatus" role="status" aria-live="polite"></p>
          </div>

          <section class="exp-results" id="expResults" aria-labelledby="expResultsTitle">
            <h3 id="expResultsTitle" tabindex="-1">Auswertung</h3>
            <dl class="exp-stats">
              <div><dt>Treffer</dt><dd id="expStatHits">—</dd></div>
              <div><dt>Erwartung bei Zufall</dt><dd id="expStatExpected">—</dd></div>
              <div><dt>Trefferquote</dt><dd id="expStatRate">—</dd></div>
              <div><dt>95-%-Intervall</dt><dd id="expStatInterval">—</dd></div>
              <div><dt>Exakter Binomialtest</dt><dd id="expStatP">—</dd></div>
              <div><dt>Status</dt><dd id="expStatStatus">Noch kein Lauf</dd></div>
            </dl>
            <p class="exp-verdict" id="expVerdict" role="status">Sobald ein Versuch enthüllt ist, erscheint hier die Einordnung.</p>
            <p class="exp-note" id="expMultiple"></p>
            <div class="exp-actions">
              <button type="button" class="btn btn-secondary" id="expExportJson" disabled>Rohdaten (JSON)</button>
              <button type="button" class="btn btn-secondary" id="expExportCsv" disabled>Rohdaten (CSV)</button>
              <button type="button" class="btn btn-secondary exp-danger" id="expDeleteRun" disabled>Lauf löschen</button>
            </div>
            <p class="exp-hint" id="expStorageNote" role="status"></p>
          </section>

          <div class="exp-tablewrap" id="expTableWrap" hidden>
            <table class="exp-table">
              <caption>Versuche dieses Laufs</caption>
              <thead>
                <tr><th scope="col">Versuch</th><th scope="col">Antwort</th><th scope="col">Ziel</th><th scope="col">Treffer</th><th scope="col">Enthüllt</th></tr>
              </thead>
              <tbody id="expTrialBody"></tbody>
            </table>
          </div>

          <section class="exp-runs" aria-labelledby="expRunsTitle">
            <h3 id="expRunsTitle">Gespeicherte Läufe</h3>
            <p class="exp-hint" id="expRunsHint">Läufe liegen ausschließlich im lokalen Speicher dieses Browsers. Es gibt kein Konto, keine Übertragung und keinen Abgleich.</p>
            <ul class="exp-runlist" id="expRuns"></ul>
            <button type="button" class="btn btn-secondary" id="expResume" hidden>Gespeicherten Lauf fortsetzen</button>
          </section>
        </div>
      </div>
    </section>

    <section class="astro-section" id="exp-protokoll" aria-labelledby="exp-protokoll-title">
      <p class="rad-kicker">02 · Protokoll</p>
      <h2 id="exp-protokoll-title" tabindex="-1">Was vor dem ersten Versuch feststeht</h2>
      <p class="astro-text">Ein Test, dessen Auswertung erst nach den Daten gewählt wird, ist kein Test. Deshalb legt jeder Lauf vor dem Start vier Dinge fest: den <strong>Zielraum</strong> (wie viele gleich wahrscheinliche Ziele), die <strong>Fallzahl</strong> (wie viele Versuche gezählt werden), die <strong>Abbruchregel</strong> (hier: genau die geplante Zahl, keine Zwischenauswertung) und die <strong>primäre Auswertung</strong> (exakter zweiseitiger Binomialtest mit Schwelle 5 %, dazu ein Wilson-95-%-Intervall).</p>
      <p class="astro-text">Der Ablauf ist Vertrag und nicht Bedienelement: Ziel ziehen → verdeckt halten → Antwort erfassen → Antwort sperren und speichern → Ziel enthüllen → auswerten. Die Sperre ist endgültig; einzelne Antworten lassen sich nicht korrigieren oder löschen, nur ein ganzer Lauf.</p>
      <p class="astro-text">Gezählt werden alle Versuche des Laufs. Wer nach einem Treffer aufhört oder erfolglose Versuche streicht, zerstört die Auswertung — das Labor verhindert es, so gut es clientseitig möglich ist.</p>
    </section>

    <section class="astro-section" id="exp-statistik" aria-labelledby="exp-statistik-title">
      <p class="rad-kicker">03 · Statistik</p>
      <h2 id="exp-statistik-title" tabindex="-1">Trefferquote, Erwartung und Intervall</h2>
      <p class="astro-text">Die <strong>Zufallserwartung</strong> ist die Anzahl der Treffer, die bei reinem Raten zu erwarten wäre: n geteilt durch die Zahl der Ziele. Bei 20 Versuchen mit zwei Zielen sind das 10 Treffer, bei 16 Versuchen mit acht Orten 2 Treffer.</p>
      <p class="astro-text">Der <strong>exakte zweiseitige Binomialtest</strong> beantwortet die Frage, wie wahrscheinlich eine Trefferzahl ist, die mindestens so weit von der Erwartung abweicht wie die beobachtete — unter der Annahme, dass nur geraten wird. Gerechnet wird als Summe der Wahrscheinlichkeiten aller Ausgänge, die höchstens so wahrscheinlich sind wie der beobachtete; es gibt keine Normalapproximation, damit auch kleine Fallzahlen korrekt bleiben. Der p-Wert ist <em>kein</em> Nachweis: Bei einer Schwelle von 5 % ist etwa jeder zwanzigste reine Zufallslauf auffällig.</p>
      <p class="astro-text">Das <strong>Wilson-95-%-Intervall</strong> beschreibt die Unsicherheit der Trefferquote. Es ist auch bei wenigen Versuchen und bei Werten nahe 0 oder 100 % brauchbar, anders als die einfache Normalapproximation. Ein Intervall, das die Zufallswahrscheinlichkeit einschließt, ist mit Raten vereinbar; ein Intervall ganz darüber wäre auffällig — und bleibt trotzdem ein Hinweis, kein Beweis.</p>
      <p class="astro-text"><strong>Mehrfachtests und Selektionsfehler:</strong> Wer mehrere Läufe macht und nur den auffälligsten zeigt, erhöht die Fehlerrate mit jedem Lauf. Das Labor korrigiert dafür nicht und darf es nicht nachträglich: Eine Korrektur (etwa Bonferroni) müsste vor der Auswertung feststehen. Es zählt stattdessen die bekannten Läufe und nennt sie im Ergebnis.</p>
    </section>

    <section class="astro-section" id="exp-grenzen" aria-labelledby="exp-grenzen-title">
      <p class="rad-kicker">04 · Grenzen</p>
      <h2 id="exp-grenzen-title" tabindex="-1">Informationslecks und was diese Verblindung leistet</h2>
      <p class="astro-text">Die Verblindung ist <strong>clientseitig</strong> und damit begrenzt. Das Ziel wird mit Web Crypto gezogen, nur als SHA-256-Commitment gespeichert und erst nach dem Sperren der Antwort enthüllt. Vor der Enthüllung steht es weder im Dokument noch im Seitentitel noch im lokalen Speicher — das prüfen die automatisierten Tests.</p>
      <p class="astro-text">Was das <em>nicht</em> verhindert: Wer die Entwicklerwerkzeuge des Browsers bedient, kann Skripte anhalten, Speicher auslesen oder die Seite verändern. Ein Browser kann kein manipulationssicheres Labor garantieren. Für eine belastbare Prüfung bräuchte es eine unabhängige Instanz, die das Ziel zieht und die Antwort entgegennimmt — dieses Modul ist eine ehrliche Übung, kein Zertifikat.</p>
      <p class="astro-text">Zweite Grenze: Das Salt eines noch nicht enthüllten Versuchs lebt nur im Arbeitsspeicher der Seite. Wird die Seite genau zwischen Sperre und Enthüllung neu geladen, lässt sich dieser Versuch nicht mehr enthüllen; der Lauf bleibt als unvollständig gekennzeichnet und ist nicht auswertbar. Das ist der Preis dafür, dass das Ziel nicht im Speicher liegt. Ein bereits gezogenes, aber noch nicht beantwortetes Ziel wird beim Fortsetzen verworfen — es wurde keine Antwort gespeichert, und ohne das Salt wäre es ohnehin nicht mehr enthüllbar.</p>
      <p class="astro-text">Dritte Grenze: Das Modul misst nur, ob Antworten mit einem verdeckten Zufallsziel übereinstimmen. Es sagt nichts über Ursachen, Fähigkeiten oder Personen — und ein negatives Ergebnis widerlegt eine Behauptung nicht, es zeigt nur, dass sie in dieser Prüfung nicht sichtbar wurde.</p>
    </section>

    <section class="astro-section" id="exp-export" aria-labelledby="exp-export-title">
      <p class="rad-kicker">05 · Rohdaten</p>
      <h2 id="exp-export-title" tabindex="-1">Export und was darin steht</h2>
      <p class="astro-text">Der JSON-Export enthält den vollständigen Lauf nach Vertrag: Kennung, Experiment, Modus, Protokoll, je Versuch das Commitment, die gesperrte Antwort mit Zeitstempel und das enthüllte Ergebnis. Salt und Ziel eines nicht enthüllten Versuchs sind nie enthalten. Die Datei lässt sich mit <code>importEnvelope</code> wieder prüfen.</p>
      <p class="astro-text">Der CSV-Export enthält eine Zeile je enthülltem Versuch: Lauf, Experiment, Modus, Basiswahrscheinlichkeit, Versuchsnummer, Antwort, Ziel, Treffer und beide Zeitstempel. Format nach Vertrag: UTF-8 mit BOM, Semikolon als Trenner, Anführungszeichen verdoppelt, CRLF als Zeilenende — direkt in Tabellenprogrammen lesbar.</p>
      <p class="astro-text">Es gibt keine Namen, keine Gerätekennung, keine Netzwerkanfrage und keine Telemetrie. Gespeichert wird ausschließlich im lokalen Speicher des Browsers; Löschen entfernt den ganzen Lauf.</p>
    </section>

    <aside class="rad-disclaimer" aria-labelledby="exp-nicht-title">
      <h2 class="rad-disclaimer-title" id="exp-nicht-title">Was dieses Labor nicht leistet</h2>
      <p><strong>Kein Nachweis:</strong> Ein auffälliger Lauf ist ein Hinweis, kein Beleg für eine Fähigkeit. Ein unauffälliger Lauf ist kein Beweis dagegen.</p>
      <p><strong>Keine Diagnose:</strong> Das Modul prüft Antworten gegen Zufall. Es stellt keine gesundheitlichen, geologischen oder persönlichen Fragen und bewertet keine Personen.</p>
      <p><strong>Keine Sicherheit gegen Manipulation:</strong> Wer den Browser kontrolliert, kontrolliert das Labor. Die Verblindung schützt vor unbeabsichtigtem Sehen, nicht vor absichtlichem Nachsehen.</p>
    </aside>

    <p class="astro-text psim-links">
      <a class="btn btn-secondary" href="${ROUTE.topic('pendeln')}">Zum Thema Pendeln</a>
      <a class="textlink" href="${ROUTE.studio}">Pendeltafel-Studio öffnen</a>
    </p>
  </div>`;

  return {
    html,
    title: 'Experimentierlabor — verblindete Testreihe mit Statistik',
    description:
      'Verblindetes Experimentierlabor: verdecktes Zufallsziel, gesperrte Antwort, feste Fallzahl, exakter Binomialtest, Wilson-Intervall und Rohdatenexport — ohne Wirkungsversprechen.',
    h1: 'Experimentierlabor',
    experiment: true,
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
