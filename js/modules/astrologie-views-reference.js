// Astrologie — Ansichten für Grundlagen, Beispiele, FAQ, Glossar, Quellen,
// Methodik, Suche und Fehlerzustände. Reine Funktionen wie astrologie-views.js.

import {
  ROUTE,
  badge,
  bulletList,
  escapeHtml,
  inlineText,
  kennzeichnung,
  metaList,
  numberedList,
  richText,
} from './astrologie-format.js';
import { CATEGORY, label } from './astrologie-model.js';
import { crossReferences, pageShell, section, sourcesPanel } from './astrologie-views.js';

// --- Grundlagen -----------------------------------------------------------

const LEVELS = [
  { key: 'grundlagen', title: 'Grundlagen', hint: 'Begriffe und erste Orientierung' },
  { key: 'vertiefung', title: 'Vertiefung', hint: 'Zusammenhänge und Systemfragen' },
  { key: 'nachschlagen', title: 'Nachschlagen', hint: 'Evidenz, Ethik, Berechnung' },
];

export function renderGrundlagenIndex(ctx, { level = 'all', q = '' } = {}) {
  const items = ctx.filterGrundlagen(level, q);
  const chip = (value, text) => {
    const active = value === level;
    const params = new URLSearchParams();
    if (value !== 'all') params.set('ebene', value);
    if (q) params.set('q', q);
    const query = params.toString();
    return `<a class="astro-filter-chip${active ? ' is-active' : ''}" href="${ROUTE.grundlagen()}${query ? `?${query}` : ''}"${
      active ? ' aria-current="true"' : ''
    }>${escapeHtml(text)}</a>`;
  };
  const body = `
    <div class="astro-controls">
      <form class="astro-search" role="search" data-astro-form="grundlagen">
        <label class="sr-only" for="astro-grundlagen-q">Grundlagen durchsuchen</label>
        <input class="input" id="astro-grundlagen-q" name="q" type="search" value="${escapeHtml(q)}" placeholder="Begriff suchen, z. B. Ekliptik …" autocomplete="off" />
        <button class="btn btn-secondary btn-sm" type="submit">Suchen</button>
        ${q ? `<a class="textlink" href="${ROUTE.grundlagen()}">Suche zurücksetzen</a>` : ''}
      </form>
      <div class="astro-filter" role="group" aria-label="Nach Ebene filtern">
        <p class="astro-filter-label">Stufe</p>
        ${chip('all', 'Alle')}${LEVELS.map((entry) => chip(entry.key, entry.title)).join('')}
      </div>
      <p class="astro-result-count" id="astro-result-count" role="status" aria-live="polite">${items.length} von ${ctx.counts.grundlagen} Texten</p>
    </div>
    ${LEVELS.map((entry) => {
      const list = items.filter((item) => item.level === entry.key);
      if (!list.length) return '';
      return `<section class="astro-group" aria-labelledby="astro-ebene-${entry.key}">
        <h2 id="astro-ebene-${entry.key}">${escapeHtml(entry.title)} <span class="astro-group-count">${list.length}</span></h2>
        <p class="astro-group-hint">${escapeHtml(entry.hint)}</p>
        <ul class="astro-text-list">${list
          .map(
            (item) => `<li>
              <h3><a href="${ROUTE.grundlagen(item.slug)}">${escapeHtml(item.title || item.name)}</a></h3>
              <p>${inlineText(item.short)}</p>
            </li>`
          )
          .join('')}</ul>
      </section>`;
    }).join('')}
    <p class="astro-empty" ${items.length ? 'hidden' : ''}>Keine Texte für diese Auswahl. <a href="${ROUTE.grundlagen()}">Filter zurücksetzen</a></p>`;

  return {
    title: 'Grundlagen der Astrologie — Ekliptik, Zeichen, Evidenz',
    html: pageShell({
      eyebrow: 'Astrologie / Grundlagen',
      title: 'Grundlagen und Vertiefung',
      subtitle: `${ctx.counts.grundlagen} Texte in drei Stufen`,
      lead: 'Warum die Zeichen keine Sternbilder sind, was ein Orbis ist, wie Häusersysteme funktionieren und warum die Evidenzlage zur Trennung von Tradition und Wissen zwingt.',
      badges: badge('Grundlagen', 'neutral') + badge('Vertiefung', 'neutral') + badge('Nachschlagen', 'neutral'),
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Grundlagen' }],
      body,
    }),
  };
}

export function renderGrundlagenDetail(ctx, item) {
  const body = `
    ${kennzeichnung(item)}
    ${section('astro-grund-kurz', 'Kurz gesagt', `<p class="astro-text">${inlineText(item.short)}</p>`)}
    ${section('astro-grund-lang', 'Vertiefung', richText(item.long))}
    ${section('astro-grund-kern', 'Kernpunkte', bulletList(item.key_points))}
    ${section('astro-grund-weiter', 'Weiterlesen', crossReferences(ctx, item))}`;

  return {
    title: `${item.title || item.name} — Astrologie-Grundlagen`,
    html: pageShell({
      eyebrow: `Astrologie / Grundlagen / ${label(item.level)}`,
      title: escapeHtml(item.title || item.name),
      subtitle: label(item.level),
      lead: item.short,
      badges: badge(label(item.level), 'small'),
      trail: [
        { label: 'Astrologie', href: ROUTE.hub },
        { label: 'Grundlagen', href: ROUTE.grundlagen() },
        { label: item.name },
      ],
      toc: [
        { id: 'astro-grund-kurz', title: 'Kurz gesagt' },
        { id: 'astro-grund-lang', title: 'Vertiefung' },
        { id: 'astro-grund-kern', title: 'Kernpunkte' },
        { id: 'astro-grund-weiter', title: 'Weiterlesen' },
      ],
      route: ROUTE.grundlagen(item.slug),
      body,
      aside: sourcesPanel(ctx, item),
    }),
  };
}

// --- Beispiele ------------------------------------------------------------

export function renderBeispieleIndex(ctx) {
  const items = ctx.datasets.beispiele;
  const body = `
    <div class="astro-callout astro-callout--fiction">
      <p><strong>Fiktive Lehrbeispiele.</strong> Alle Figuren und Annahmen sind erfunden und gesetzt — nicht berechnet. Es gibt keine Geburtsdaten, keine Gradangaben und keine reale Person hinter diesen Texten.</p>
    </div>
    <div class="astro-card-grid">${items
      .map(
        (item) => `<article class="astro-card">
          <h3 class="astro-card-title"><a href="${ROUTE.beispiele(item.slug)}">${escapeHtml(item.titel)}</a></h3>
          <p class="astro-card-badges">${badge('Fiktives Lehrbeispiel', 'fiction')}${badge(`${item.schritte.length} Schritte`, 'small')}</p>
          <p class="astro-card-text">${inlineText(item.annahmen[0])}</p>
        </article>`
      )
      .join('')}</div>`;

  return {
    title: 'Synthesebeispiele — fiktive Lehrbeispiele | Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Synthese',
      title: 'Synthese in Beispielen',
      subtitle: `${ctx.counts.beispiele} fiktive Beispiele · ohne Berechnung`,
      lead: 'Wie aus Zeichen, Faktoren, Häusern und Aspekten eine vorsichtige Lesart wird — gezeigt an erfundenen Figuren, mit gesetzten Annahmen und ausdrücklich benannten Grenzen.',
      badges: badge('Fiktiv', 'fiction') + badge('keine Radix', 'neutral'),
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Synthesebeispiele' }],
      body,
    }),
  };
}

export function renderBeispieleDetail(ctx, item) {
  const steps = item.schritte
    .map(
      (step, index) => `<li class="astro-step">
        <h3>${index + 1}. ${escapeHtml(step.titel)}</h3>
        <p>${inlineText(step.denkweg)}</p>
        <p class="astro-step-refs">Material: ${(step.refs || [])
          .map((ref) => ctx.resolve(ref))
          .filter((ref) => ref.found)
          .map((ref) => `<a href="${ref.href}">${escapeHtml(ref.label)}</a>`)
          .join(' · ')}</p>
      </li>`
    )
    .join('');

  const body = `
    ${kennzeichnung(item)}
    <div class="astro-callout astro-callout--fiction">
      <p><strong>Fiktives Lehrbeispiel.</strong> ${inlineText(item.disclaimer)}</p>
      <p class="astro-fiction-rule">Keine berechnete Radix, keine realen Personen, keine Gradangaben.</p>
    </div>
    ${section('astro-beispiel-annahmen', 'Gesetzte Annahmen', `${bulletList(item.annahmen)}<p class="astro-note">Figuren: ${escapeHtml((item.figuren || []).join(' · '))}</p>`)}
    ${section('astro-beispiel-schritte', `Der Denkweg in ${item.schritte.length} Schritten`, `<ol class="astro-step-list">${steps}</ol>`)}
    ${section('astro-beispiel-synthese', 'Synthese', `<p class="astro-text">${inlineText(item.synthese)}</p>`)}
    ${section('astro-beispiel-alternative', 'Alternative Lesart', `<p class="astro-text">${inlineText(item.alternative_lesart)}</p>`)}
    ${section('astro-beispiel-grenzen', 'Grenzen des Beispiels', bulletList(item.grenzen))}
    ${section('astro-beispiel-weiter', 'Weiterlesen', crossReferences(ctx, item))}`;

  return {
    title: `${item.titel} — fiktives Lehrbeispiel | Astrologie`,
    html: pageShell({
      eyebrow: 'Astrologie / Synthese / Beispiel',
      title: escapeHtml(item.titel),
      subtitle: 'Fiktives Lehrbeispiel · gesetzte Annahmen',
      lead: 'Ein durchgerechneter Denkweg ohne Rechnung: Annahmen, Schritte, Synthese, Gegenprobe und Grenzen.',
      badges: badge('Fiktives Lehrbeispiel', 'fiction') + badge('ohne Gradangaben', 'neutral'),
      trail: [
        { label: 'Astrologie', href: ROUTE.hub },
        { label: 'Synthesebeispiele', href: ROUTE.beispiele() },
        { label: 'Beispiel' },
      ],
      toc: [
        { id: 'astro-beispiel-annahmen', title: 'Annahmen' },
        { id: 'astro-beispiel-schritte', title: 'Denkweg' },
        { id: 'astro-beispiel-synthese', title: 'Synthese' },
        { id: 'astro-beispiel-alternative', title: 'Alternative Lesart' },
        { id: 'astro-beispiel-grenzen', title: 'Grenzen' },
      ],
      route: ROUTE.beispiele(item.slug),
      body,
      aside: sourcesPanel(ctx, item),
    }),
  };
}

// --- FAQ ------------------------------------------------------------------

export function renderFaq(ctx, selectedSlug = '') {
  const items = ctx.datasets.faq;
  const body = `
    <div class="astro-faq">${items
      .map((item) => {
        const open = item.slug === selectedSlug;
        const related = (item.related || [])
          .map((ref) => ctx.resolve(ref))
          .filter((ref) => ref.found)
          .map((ref) => `<a href="${ref.href}">${escapeHtml(ref.label)}</a>`)
          .join(' · ');
        const sources = (item.sources || [])
          .map((id) => `<a href="${ROUTE.quellen(id)}">${escapeHtml(id)}</a>`)
          .join(', ');
        return `<details class="astro-details astro-faq-item" id="faq-${escapeHtml(item.slug)}"${open ? ' open' : ''}>
          <summary>${escapeHtml(item.frage)}</summary>
          <div class="astro-details-body">
            <p class="astro-faq-short">${inlineText(item.short_answer)}</p>
            ${richText(item.long_answer)}
            <p class="astro-faq-meta">${related ? `Weiterlesen: ${related}` : ''}${related && sources ? ' · ' : ''}${sources ? `Quellen: ${sources}` : ''}</p>
          </div>
        </details>`;
      })
      .join('')}</div>`;

  return {
    title: 'FAQ Astrologie — häufige Fragen',
    html: pageShell({
      eyebrow: 'Astrologie / FAQ',
      title: 'Häufige Fragen',
      subtitle: `${ctx.counts.faq} Fragen mit kurzer und langer Antwort`,
      lead: 'Kurze Antwort zuerst, ausführliche Antwort darunter. Wo die Antwort von der Forschung abhängt, steht das dabei.',
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'FAQ' }],
      body,
    }),
  };
}

// --- Glossar --------------------------------------------------------------

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function renderGlossar(ctx, { q = '', selectedSlug = '' } = {}) {
  const items = ctx
    .filterGlossar(q)
    .slice()
    .sort((a, b) => a.term.localeCompare(b.term, 'de'));
  const selected = selectedSlug ? ctx.findBySlug('glossar', selectedSlug) : null;
  const groups = new Map();
  for (const item of items) {
    const letter = item.term.charAt(0).toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(item);
  }
  const body = `
    <div class="astro-controls">
      <form class="astro-search" role="search" data-astro-form="glossar">
        <label class="sr-only" for="astro-glossar-q">Glossar durchsuchen</label>
        <input class="input" id="astro-glossar-q" name="q" type="search" value="${escapeHtml(q)}" placeholder="Begriff suchen, z. B. Orbis …" autocomplete="off" />
        <button class="btn btn-secondary btn-sm" type="submit">Suchen</button>
        ${q ? `<a class="textlink" href="${ROUTE.glossar()}">Suche zurücksetzen</a>` : ''}
      </form>
      <p class="astro-result-count" id="astro-result-count" role="status" aria-live="polite">${items.length} von ${ctx.counts.glossar} Begriffen</p>
    </div>
    <nav class="astro-letters" aria-label="Sprungmarken nach Anfangsbuchstaben">
      ${LETTERS.map((letter) => {
        const has = groups.has(letter);
        return has
          ? `<button type="button" class="astro-letter" data-astro-letter="${letter}">${letter}</button>`
          : `<span class="astro-letter is-empty" aria-hidden="true">${letter}</span>`;
      }).join('')}
    </nav>
    ${
      selected
        ? `<article class="astro-term astro-term--selected" id="gloss-${escapeHtml(selected.slug)}">
            <h2>${escapeHtml(selected.term)}</h2>
            <p>${inlineText(selected.definition)}</p>
            <p class="astro-term-links">Siehe auch: ${(selected.see_also || [])
              .map((ref) => ctx.resolve(ref))
              .filter((ref) => ref.found)
              .map((ref) => `<a href="${ref.href}">${escapeHtml(ref.label)}</a>`)
              .join(' · ')}</p>
          </article>`
        : ''
    }
    ${[...groups.entries()]
      .map(
        ([
          letter,
          list,
        ]) => `<section class="astro-glossgroup" id="glossar-${letter}" aria-labelledby="glossar-${letter}-title">
          <h2 id="glossar-${letter}-title">${letter}</h2>
          <dl class="astro-glosslist">${list
            .map(
              (item) => `<div class="astro-term" id="gloss-${escapeHtml(item.slug)}">
                <dt><a href="${ROUTE.glossar(item.slug)}">${escapeHtml(item.term)}</a></dt>
                <dd>${inlineText(item.definition)}${
                  (item.see_also || []).length
                    ? `<span class="astro-term-links">Siehe auch: ${(item.see_also || [])
                        .map((ref) => ctx.resolve(ref))
                        .filter((ref) => ref.found)
                        .map((ref) => `<a href="${ref.href}">${escapeHtml(ref.label)}</a>`)
                        .join(' · ')}</span>`
                    : ''
                }</dd>
              </div>`
            )
            .join('')}</dl>
        </section>`
      )
      .join('')}
    <p class="astro-empty" ${items.length ? 'hidden' : ''}>Keine Begriffe für „${escapeHtml(q)}“. <a href="${ROUTE.glossar()}">Suche zurücksetzen</a></p>`;

  return {
    title: 'Glossar Astrologie — Begriffe von Aszendent bis Zyklus',
    html: pageShell({
      eyebrow: 'Astrologie / Nachschlagen',
      title: 'Glossar',
      subtitle: `${ctx.counts.glossar} Begriffe`,
      lead: 'Kurze Definitionen der Fachbegriffe — von Aszendent bis Mondknoten. Jeder Begriff hat einen eigenen Link und verweist auf verwandte Stellen.',
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Glossar' }],
      body,
    }),
  };
}

// --- Quellen & Claims -----------------------------------------------------

export function renderQuellen(ctx, { quelle = '', claim = '' } = {}) {
  const sources = ctx.datasets.quellen;
  const claims = ctx.datasets.claims;
  const sourceCards = sources
    .map(
      (
        item
      ) => `<article class="astro-source-card${item.id === quelle ? ' is-target' : ''}" id="quelle-${escapeHtml(item.id)}">
        <h3><span class="astro-source-id">${escapeHtml(item.id)}</span> ${escapeHtml(item.titel)}</h3>
        ${metaList([
          { label: 'Herausgeber', value: item.herausgeber },
          { label: 'Typ', value: item.typ },
          { label: 'Abgerufen', value: item.abgerufen_am },
          { label: 'Abrufstatus', value: item.abrufstatus },
          { label: 'Sprache', value: item.sprache },
          { label: 'Einsatz', value: (item.einsatz || []).join(' · ') },
          { label: 'Kurzzitat', value: item.kurzzitat },
          { label: 'Grenzen', value: item.grenzen },
          { label: 'Rechte', value: item.rechte_hinweis },
        ])}
        <p class="astro-source-link"><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.url)}</a></p>
      </article>`
    )
    .join('');
  const claimCards = claims
    .map(
      (
        entry
      ) => `<li class="astro-claim-card${entry.id === claim ? ' is-target' : ''}" id="claim-${escapeHtml(entry.id)}">
        <p class="astro-claim-head"><span class="astro-claim-id">${escapeHtml(entry.id)}</span>
          ${badge(entry.evidenztyp, 'small')} ${badge(`Sicherheit ${entry.sicherheit}`, 'small')}</p>
        <p>${inlineText(entry.aussage)}</p>
        <p class="astro-claim-meta">Quellen: ${(entry.quellen || [])
          .map((id) => `<a href="${ROUTE.quellen(id)}">${escapeHtml(id)}</a>`)
          .join(', ')}${entry.hinweis ? ` · ${inlineText(entry.hinweis)}` : ''}</p>
      </li>`
    )
    .join('');

  const body = `
    <p class="astro-text">Die Quellen wurden am ${escapeHtml(ctx.meta.stand)} abgerufen; der Abrufstatus steht bei jedem Eintrag. Kurzzitate dienen der Nachprüfbarkeit, es werden keine längeren Fremdtexte übernommen.</p>
    ${section('astro-quellen-ledger', `Quellen (${sources.length})`, `<div class="astro-source-cards">${sourceCards}</div>`)}
    ${section('astro-quellen-claims', `Claims (${claims.length})`, `<ul class="astro-claim-cards">${claimCards}</ul>`)}
    ${section(
      'astro-quellen-rechte',
      'Rechte und Grenzen',
      `<p class="astro-text">NASA-Inhalte gelten überwiegend als gemeinfrei; Britannica, Nature, Astrodienst und Collins sind urheberrechtlich geschützt und werden nur kurz zitiert; Wikipedia-Inhalte stehen unter CC BY-SA 4.0 und wurden nur faktenweise ausgewertet.</p>
       <p class="astro-note">Diese Seite erteilt keine Rechtsfreigabe für Dritte und keine Druckfreigabe. Bei einer Veröffentlichung sind die Rechtehinweise je Quelle erneut zu prüfen.</p>`
    )}`;

  return {
    title: 'Quellen und Claims — Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Methodik',
      title: 'Quellen und Claims',
      subtitle: `${sources.length} Quellen · ${claims.length} Aussagen`,
      lead: 'Jede belegte Aussage steht als Claim mit Evidenztyp, Quelle und Sicherheit. Wo nur ein Suchsnippet vorlag, steht das im Abrufstatus.',
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Quellen' }],
      body,
    }),
  };
}

// --- Methodik -------------------------------------------------------------

export function renderMethodik(ctx) {
  const annahmen = ctx.meta.arbeitsannahme;
  const legend = [
    [
      'Deutungstradition',
      'deutungstradition',
      'Aussage der astrologischen Überlieferung, keine empirische Behauptung.',
    ],
    ['Astronomie', 'astronomie', 'Belegter astronomischer Sachverhalt.'],
    ['Konvention', 'konvention', 'Definition oder Fachkonvention, keine Naturtatsache.'],
    ['Empirie', 'empirie', 'Empirischer Befund oder Forschungsstand.'],
    ['Historisch', 'historisch', 'Historische Einordnung.'],
    ['Gemischt', 'gemischt', 'Mehrere Ebenen; im Text getrennt.'],
  ]
    .map(([name, key, text]) => `<li>${badge(name, key)} ${escapeHtml(text)}</li>`)
    .join('');

  const body = `
    ${section(
      'astro-methodik-annahme',
      'Arbeitsannahme',
      `<p class="astro-text">Dieser Bereich arbeitet mit der westlichen tropischen, geozentrischen Astrologie. Die Zeichen sind gleiche 30-Grad-Sektoren ab dem Frühlingspunkt, keine Sternbilder. Siderische Systeme, Ayanamsa und Häuserschulen werden erklärt und benannt, aber nicht unmarkiert eingemischt.</p>
      ${metaList([
        { label: 'Zeichen', value: annahmen.zeichen },
        { label: 'Faktoren', value: annahmen.faktoren },
        { label: 'Häuser', value: annahmen.haeuser },
        { label: 'Aspekte', value: annahmen.aspekte },
        { label: 'Grundlagen', value: annahmen.grundlagen },
        { label: 'Beispiele', value: annahmen.beispiele },
        { label: 'FAQ', value: annahmen.faq },
        { label: 'Glossar', value: annahmen.glossar },
        { label: 'Lernpfad', value: annahmen.lernpfad },
        { label: 'Quellen', value: annahmen.quellen },
      ])}`
    )}
    ${section('astro-methodik-kennzeichnung', 'Kennzeichnung', `<ul class="astro-legend">${legend}</ul>`)}
    ${section(
      'astro-methodik-evidenz',
      'Evidenzlage',
      `<p class="astro-text">Astrologie gilt in der modernen Wissenschaft als Pseudoscience. Kontrollierte Tests stützen Persönlichkeits- und Ereignisbehauptungen nicht. Dieser Bereich macht die Tradition verständlich, ohne ihre Wirkbehauptungen zu übernehmen — und ohne sie zu verspotten.</p>
      <p class="astro-text">Die ausführliche Einordnung steht unter <a href="${ROUTE.grundlagen('evidenz-und-grenzen')}">Evidenz und Grenzen</a>; die einzelne Aussagen mit Evidenztyp stehen im <a href="${ROUTE.quellen()}">Quellenverzeichnis</a>.</p>`
    )}
    ${section(
      'astro-methodik-berechnung',
      'Was hier nicht passiert',
      `<div class="astro-callout">
        <p><strong>Keine Berechnung.</strong> Es gibt keine Radix, keine Transite, keine Aszendentbestimmung und keine Live-Positionen. Datumsangaben der Zeichen sind Näherungen, keine Berechnungen für einen bestimmten Tag.</p>
        <p><strong>Keine Geburtsdaten.</strong> Es werden keine Geburtszeit, kein Geburtsort und keine personenbezogenen Daten abgefragt, gespeichert oder übertragen.</p>
        <p><strong>Keine Prognose.</strong> Keine gesundheitlichen, finanziellen, rechtlichen oder existenziellen Vorhersagen; keine Diagnosen.</p>
        <p>Was eine belastbare Berechnung bräuchte — Ephemeride, Lizenz, Zeitzonen, Datenschutz — steht unter <a href="${ROUTE.grundlagen('echte-berechnung')}">Echte Berechnung</a>. Sie ist ein eigener, noch nicht umgesetzter Folgescope.</p>
      </div>`
    )}
    ${section(
      'astro-methodik-datenschutz',
      'Datenschutz und Druck',
      `<p class="astro-text">Der Bereich ist statisch: keine Cookies, keine Tracker, keine externen Schriften oder Bilder. Alle Texte und Symbole liegen im Projekt.</p>
      <p class="astro-text">Eine Druckfassung ist über die Browser-Druckfunktion möglich und blendet Navigation und Filter aus. Eine Druckfreigabe ist damit nicht erteilt — sie wäre ein eigener Prüfschritt.</p>`
    )}
    ${section(
      'astro-methodik-stand',
      'Stand und Herkunft der Daten',
      `<p class="astro-text">Inhaltsstand: ${escapeHtml(ctx.meta.stand)} · Datenversion ${escapeHtml(ctx.meta.version)}. Die Texte stammen aus dem geprüften Inhalts- und Schemapaket des Projekts; die Website rendert diese Daten, statt eigene Deutungen zu erfinden.</p>`
    )}`;

  return {
    title: 'Methodik und Grenzen — Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Methodik',
      title: 'Methodik und Grenzen',
      subtitle: 'Arbeitsannahme · Kennzeichnung · Evidenz · Datenschutz',
      lead: 'Wie dieser Bereich arbeitet, was die Kennzeichnungen bedeuten und wo die Grenzen liegen — vor dem Lesen genauso wichtig wie danach.',
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Methodik' }],
      toc: [
        { id: 'astro-methodik-annahme', title: 'Arbeitsannahme' },
        { id: 'astro-methodik-kennzeichnung', title: 'Kennzeichnung' },
        { id: 'astro-methodik-evidenz', title: 'Evidenzlage' },
        { id: 'astro-methodik-berechnung', title: 'Keine Berechnung' },
        { id: 'astro-methodik-datenschutz', title: 'Datenschutz' },
      ],
      route: ROUTE.methodik,
      body,
    }),
  };
}

// --- Suche ----------------------------------------------------------------

export function renderSuche(ctx, query = '') {
  const result = ctx.search(query);
  const groups = new Map();
  for (const hit of result.results) {
    if (!groups.has(hit.dataset)) groups.set(hit.dataset, []);
    groups.get(hit.dataset).push(hit);
  }
  const body = `
    <form class="astro-search astro-search--page" role="search" data-astro-form="suche">
      <label class="sr-only" for="astro-suche-q">Astrologie durchsuchen</label>
      <input class="input" id="astro-suche-q" name="q" type="search" value="${escapeHtml(query)}" placeholder="Zeichen, Faktor, Haus, Begriff …" autocomplete="off" />
      <button class="btn btn-primary" type="submit">Suchen</button>
    </form>
    <p class="astro-result-count" id="astro-result-count" role="status" aria-live="polite">${
      query
        ? `${result.total} Treffer für „${escapeHtml(query)}“${result.truncated ? ' (erste 50)' : ''}`
        : 'Noch keine Suche'
    }</p>
    ${
      query && result.total
        ? [...groups.entries()]
            .map(
              ([dataset, hits]) => `<section class="astro-group" aria-labelledby="astro-suche-${dataset}">
                <h2 id="astro-suche-${dataset}">${escapeHtml(CATEGORY[dataset].title)} <span class="astro-group-count">${hits.length}</span></h2>
                <ul class="astro-text-list">${hits
                  .map(
                    (hit) =>
                      `<li><h3><a href="${hit.href}">${escapeHtml(hit.title)}</a></h3><p>${inlineText(
                        String(hit.short || '').slice(0, 220)
                      )}</p></li>`
                  )
                  .join('')}</ul>
              </section>`
            )
            .join('')
        : ''
    }
    ${
      query && !result.total
        ? `<div class="astro-empty-state">
            <p><strong>Keine Treffer für „${escapeHtml(query)}“.</strong></p>
            <p>Prüfe die Schreibweise, suche kürzer — oder beginne bei einem der Einstiege.</p>
            <ul class="astro-empty-suggestions">
              <li><a href="${ROUTE.zeichen()}">Alle zwölf Zeichen</a></li>
              <li><a href="${ROUTE.glossar()}">Glossar (65 Begriffe)</a></li>
              <li><a href="${ROUTE.faq()}">FAQ</a></li>
            </ul>
            <p><a class="btn btn-secondary btn-sm" href="${ROUTE.suche()}">Suche zurücksetzen</a></p>
          </div>`
        : ''
    }
    ${!query ? `<p class="astro-text">Die Suche durchsucht Zeichen, Faktoren, Häuser, Aspekte, Grundlagen, Beispiele, FAQ, Glossar und Lernpfad. Groß- und Kleinschreibung sowie Umlaute spielen keine Rolle: „gross“ findet „groß“.</p>` : ''}`;

  return {
    title: query ? `Suche: ${query} — Astrologie` : 'Suche — Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Suche',
      title: 'Im Astrologiebereich suchen',
      subtitle: 'Zeichen · Faktoren · Häuser · Aspekte · Grundlagen · Glossar',
      lead: 'Eine Suche über alle Typen. Treffer sind nach Bereich gruppiert, damit ein „Mond“-Treffer als Faktor und als Glossarbegriff unterscheidbar bleibt.',
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Suche' }],
      body,
    }),
  };
}

// --- Fehlerzustände -------------------------------------------------------

export function renderNotFound(ctx, raw = '') {
  const suggestions = ctx.datasets.zeichen.slice(0, 3);
  const body = `
    <div class="astro-callout astro-callout--limit">
      <p><strong>„#${escapeHtml(raw)}“ gehört zu keiner Seite dieses Bereichs.</strong> Der Link ist möglicherweise veraltet oder enthält einen Tippfehler.</p>
    </div>
    ${section(
      'astro-nicht-gefunden-ziele',
      'Weiter zu',
      `<ul class="astro-jump">
        <li><a href="${ROUTE.hub}">Übersicht Astrologie</a></li>
        <li><a href="${ROUTE.suche()}">Suche</a></li>
        <li><a href="${ROUTE.lernpfad()}">Lernpfad</a></li>
        <li><a href="${ROUTE.glossar()}">Glossar</a></li>
      </ul>`
    )}
    ${section(
      'astro-nicht-gefunden-vorschlaege',
      'Vielleicht gesucht',
      `<ul class="astro-text-list">${suggestions
        .map(
          (item) =>
            `<li><h3><a href="${ROUTE.zeichen(item.slug)}">${escapeHtml(item.name)}</a></h3><p>${inlineText(item.short)}</p></li>`
        )
        .join('')}</ul>`
    )}`;

  return {
    title: 'Seite nicht gefunden — Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Fehler',
      title: 'Diese Seite gibt es nicht (mehr)',
      subtitle: 'Unbekannter Pfad im Astrologiebereich',
      lead: 'Der Bereich bleibt lesbar: Wähle einen Einstieg oder suche direkt.',
      badges: badge('Unbekannter Link', 'neutral'),
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Nicht gefunden' }],
      body,
    }),
  };
}

export function renderFailure(message) {
  return {
    title: 'Astrologie nicht verfügbar — Esoterik-Welt',
    html: pageShell({
      eyebrow: 'Astrologie / Fehler',
      title: 'Der Astrologiebereich konnte nicht geladen werden',
      subtitle: 'Daten nicht verfügbar',
      lead: 'Die Inhalte dieses Bereichs konnten nicht geladen werden. Die übrige Website funktioniert weiter.',
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Fehler' }],
      body: `<div class="astro-callout astro-callout--limit">
      <p>${escapeHtml(message || 'Unbekannter Fehler')}</p>
      <p>Die Daten liegen als lokales Modul im Projekt; ein erneuter Aufruf der Seite lädt es neu. Es werden keine Daten nachgeladen und keine Eingaben übertragen.</p>
      <p><a class="btn btn-secondary btn-sm" href="${ROUTE.hub}">Zur Übersicht</a></p>
    </div>`,
    }),
  };
}

export { numberedList };
