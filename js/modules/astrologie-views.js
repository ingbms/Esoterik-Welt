// Astrologie — Ansichten für Hub, Lernpfad, Zeichen, Faktoren, Häuser, Aspekte.
//
// Reine Funktionen: Modell + Filterzustand hinein, HTML-Zeichenkette plus
// Seitentitel heraus. Kein DOM, kein Zustand, keine Navigation — damit sind
// diese Ansichten in Node vollständig prüfbar (tests/astrologie.mjs).

import {
  ROUTE,
  breadcrumb,
  details,
  escapeHtml,
  inlineText,
  kennzeichnung,
  metaList,
  richText,
  badge,
  bulletList,
  numberedList,
  textGlyph,
} from './astrologie-format.js';
import { CATEGORY, label } from './astrologie-model.js';

// --- Gemeinsame Hülle -----------------------------------------------------

/**
 * Einheitlicher Seitenaufbau: Brotkrümel, Kopf mit genau einer h1, optionales
 * Inhaltsverzeichnis, Hauptspalte.
 * @param {{trail?: Array, eyebrow: string, title: string, lead?: string, badges?: string[], toc?: Array, body: string, aside?: string}} options
 */
export function pageShell({
  trail,
  eyebrow,
  title,
  lead,
  badges = '',
  toc = [],
  body,
  aside = '',
  subtitle = '',
  route = ROUTE.hub,
}) {
  const tocMarkup = toc.length
    ? `<details class="astro-toc" open>
        <summary>Auf dieser Seite</summary>
        <nav aria-label="Inhaltsverzeichnis">
          <ol>${toc
            .map(
              (entry) =>
                `<li><a href="${entry.href || route}" data-astro-scroll="${entry.id}">${escapeHtml(entry.title)}</a></li>`
            )
            .join('')}</ol>
        </nav>
      </details>`
    : '';
  return `<div class="astro">
    ${breadcrumb(trail)}
    <header class="astro-head">
      <p class="label">${escapeHtml(eyebrow)}</p>
      <h1 id="astro-title" class="astro-title" tabindex="-1">${title}</h1>
      ${subtitle ? `<p class="astro-subtitle">${subtitle}</p>` : ''}
      ${lead ? `<p class="astro-lead">${inlineText(lead)}</p>` : ''}
      ${badges ? `<p class="astro-badges">${badges}</p>` : ''}
    </header>
    <div class="astro-layout">
      <div class="astro-main">${body}</div>
      ${aside || tocMarkup ? `<aside class="astro-aside">${tocMarkup}${aside}</aside>` : ''}
    </div>
  </div>`;
}

/** Abschnitt mit stabiler ID und eigener Überschrift (für Inhaltsverzeichnis). */
export function section(id, title, body, { className = '' } = {}) {
  return `<section class="astro-section ${className}" id="${escapeHtml(id)}" aria-labelledby="${escapeHtml(id)}-title">
    <h2 id="${escapeHtml(id)}-title">${escapeHtml(title)}</h2>
    ${body}
  </section>`;
}

/** Quellen- und Claim-Panel eines Items. Liefert nur, was das Item nennt. */
export function sourcesPanel(ctx, item) {
  const sources = (item.sources || []).map((id) => ctx.find(id)).filter((hit) => hit && hit.dataset === 'quellen');
  const claims = (item.claims || []).map((id) => ctx.find(id)).filter((hit) => hit && hit.dataset === 'claims');
  if (!sources.length && !claims.length) return '';
  const list = sources
    .map(
      (hit) => `<li class="astro-source" id="panel-${escapeHtml(hit.item.id)}">
        <a href="${ROUTE.quellen(hit.item.id)}">${escapeHtml(hit.item.id)} · ${escapeHtml(hit.item.titel)}</a>
        <span class="astro-source-meta">${escapeHtml(hit.item.herausgeber)} · ${escapeHtml(hit.item.typ)} · abgerufen ${escapeHtml(hit.item.abgerufen_am)} · ${escapeHtml(hit.item.abrufstatus)}</span>
      </li>`
    )
    .join('');
  const claimList = claims
    .map(
      (hit) => `<li class="astro-claim">
        <span class="astro-claim-id">${escapeHtml(hit.item.id)}</span>
        <span class="astro-claim-text">${inlineText(hit.item.aussage)}</span>
        <span class="astro-claim-type">${escapeHtml(hit.item.evidenztyp)} · Sicherheit ${escapeHtml(hit.item.sicherheit)}</span>
      </li>`
    )
    .join('');
  return details(
    `Quellen & Belege (${sources.length} Quelle${sources.length === 1 ? '' : 'n'}, ${claims.length} Claim${claims.length === 1 ? '' : 's'})`,
    `<ul class="astro-source-list">${list || '<li class="astro-source">Quellenangabe fehlt.</li>'}</ul>
     ${claimList ? `<ul class="astro-claim-list">${claimList}</ul>` : ''}
     <p class="astro-panel-note">Marker im Text wie [S11] springen in das <a href="${ROUTE.quellen()}">Quellenverzeichnis</a>.</p>`,
    { className: 'astro-details--sources' }
  );
}

/** Aufgelöste Querverweise als echte Links (keine Platzhalter). */
export function crossReferences(ctx, item) {
  const refs = (item.cross_refs || []).map((ref) => ctx.resolve(ref));
  if (!refs.length) return '';
  return `<nav class="astro-refs" aria-label="Querverweise"><h3>Querverweise</h3><ul>${refs
    .map((ref) =>
      ref.found
        ? `<li><a href="${ref.href}">${escapeHtml(ref.label)}</a> <span class="astro-refs-type">${escapeHtml(CATEGORY[ref.dataset].title)}</span></li>`
        : `<li><span class="astro-refs-missing">${escapeHtml(ref.label)} (nicht verlinkt)</span></li>`
    )
    .join('')}</ul></nav>`;
}

/** Zwei-Spalten-Liste Stärken/Spannungen. */
function pairList(leftTitle, left, rightTitle, right) {
  return `<div class="astro-pair">
    <section><h3>${escapeHtml(leftTitle)}</h3>${bulletList(left)}</section>
    <section><h3>${escapeHtml(rightTitle)}</h3>${bulletList(right)}</section>
  </div>`;
}

const card = (href, title, text, badges = '', extra = '') => `<article class="astro-card${extra ? ' ' + extra : ''}">
  <h3 class="astro-card-title"><a href="${href}">${escapeHtml(title)}</a></h3>
  ${badges ? `<p class="astro-card-badges">${badges}</p>` : ''}
  <p class="astro-card-text">${inlineText(text)}</p>
</article>`;

// --- Hub ------------------------------------------------------------------

export function renderHub(ctx) {
  const c = ctx.counts;
  const entries = [
    {
      href: ROUTE.lernpfad('orientierung'),
      title: 'Neu hier? Lernpfad',
      text: `Sechs Stufen von „Was Astrologie ist“ bis zur Synthese. Stufe 1 dauert etwa 25 Minuten, ohne Vorwissen.`,
      badge: badge('Einstieg', 'primary'),
    },
    {
      href: ROUTE.zeichen(),
      title: 'Etwas nachschlagen',
      text: `${c.zeichen} Zeichen, ${c.faktoren} Faktoren, ${c.haeuser} Häuser und ${c.aspekte} Hauptaspekte — mit Suche und Filtern.`,
      badge: badge('Nachschlagen', 'neutral'),
    },
    {
      href: ROUTE.grundlagen(),
      title: 'Verstehen, warum',
      text: `${c.grundlagen} Grundlagen- und Vertiefungstexte: Ekliptik, tropisch und siderisch, Zeichen und Sternbilder, Evidenz.`,
      badge: badge('Hintergrund', 'neutral'),
    },
    {
      href: ROUTE.methodik,
      title: 'Vorsichtig lesen',
      text: 'Arbeitsannahme, Kennzeichnung, Evidenzlage, Datenschutz — und was dieser Bereich bewusst nicht tut.',
      badge: badge('Grenzen', 'neutral'),
    },
  ];

  const body = `
    ${section(
      'astro-hub-entries',
      'Vier Einstiege',
      `<div class="astro-entry-grid">${entries
        .map(
          (entry) => `<article class="astro-entry">
            <h3><a href="${entry.href}">${escapeHtml(entry.title)}</a></h3>
            <p>${inlineText(entry.text)}</p>
            <p class="astro-entry-badge">${entry.badge}</p>
          </article>`
        )
        .join('')}</div>`
    )}
    ${section(
      'astro-hub-umfang',
      'Was hier vollständig steht',
      `<ul class="astro-facts">
        <li><strong>${c.zeichen}</strong> Zeichen mit Element, Modalität, Herrschaft</li>
        <li><strong>${c.faktoren}</strong> Faktoren von Sonne bis Pluto</li>
        <li><strong>${c.haeuser}</strong> Häuser als Lebensfelder</li>
        <li><strong>${c.aspekte}</strong> Hauptaspekte mit Winkel und Orbis</li>
        <li><strong>${c.beispiele}</strong> fiktive Synthesebeispiele</li>
        <li><strong>${c.glossar}</strong> Glossarbegriffe, <strong>${c.faq}</strong> Antworten im FAQ</li>
        <li><strong>${c.quellen}</strong> Quellen und <strong>${c.claims}</strong> einzeln geprüfte Aussagen</li>
      </ul>
      <p class="astro-note">Alle Zahlen sind eine Bestandsaufnahme der redaktionellen Daten, keine Messung am Himmel.</p>`
    )}
    ${section(
      'astro-hub-kennzeichnung',
      'So sind die Texte gekennzeichnet',
      `<p class="astro-text">Jeder längere Text trägt eine Kennzeichnung. Sie sagt, auf welcher Ebene die Aussage gilt — nicht, wie überzeugend sie ist.</p>
      <ul class="astro-legend">
        <li>${badge('Deutungstradition', 'deutungstradition')} Aussage der astrologischen Überlieferung, keine empirische Behauptung.</li>
        <li>${badge('Astronomie', 'astronomie')} Belegter astronomischer Sachverhalt.</li>
        <li>${badge('Konvention', 'konvention')} Definition oder Fachkonvention, keine Naturtatsache.</li>
        <li>${badge('Empirie', 'empirie')} Empirischer Befund oder Forschungsstand.</li>
        <li>${badge('Historisch', 'historisch')} Historische Einordnung.</li>
        <li>${badge('Gemischt', 'gemischt')} Mehrere Ebenen; im Text getrennt.</li>
      </ul>`
    )}
    ${section(
      'astro-hub-grenzen',
      'Keine Berechnung, keine Geburtsdaten',
      `<div class="astro-callout">
        <p><strong>Dieser Bereich rechnet nichts.</strong> Es gibt keine Radix, keine Live-Positionen, keine erfundenen Gradangaben und keine Prognose. Deine Zeichen lassen sich hier nachlesen, nicht berechnen.</p>
        <p>Für einen persönlichen Lernpfad brauchst du keine Geburtsdaten: Der Lernpfad arbeitet mit gesetzten, ausdrücklich fiktiven Beispielen. Es werden keine Eingaben gespeichert oder übertragen.</p>
        <p>Wie eine echte Berechnung aussehen müsste — Ephemeride, Lizenz, Zeitzone, Datenschutz — steht unter <a href="${ROUTE.grundlagen('echte-berechnung')}">Echte Berechnung</a>.</p>
      </div>`
    )}
    ${section(
      'astro-hub-nachbar',
      'Nachbarbereiche',
      `<p class="astro-text">Zwei Bereiche der Website berühren dieselben Wörter, meinen aber anderes. Beide bleiben getrennt, damit aus einer Symbolsprache keine Behauptung über den Himmel wird.</p>
      <dl class="astro-neighbours">
        <div>
          <dt><a href="#moon">Mondphasen</a></dt>
          <dd>Dort werden Phasen und Zeitpunkte astronomisch berechnet (Meeus, Genauigkeit etwa ±1 Minute). Hier steht nur, was die Tradition mit dem Mond verbindet — die Berechnung sagt nichts über Menschen aus.</dd>
        </div>
        <div>
          <dt><a href="#tarot">Tarot</a></dt>
          <dd>Tarot ist ein eigenes Bildsystem mit eigenen Karten und Deutungen. Gemeinsamkeiten in der Symbolsprache sind kulturgeschichtlich erklärbar, kein Beleg für eine gemeinsame Wirkung.</dd>
        </div>
      </dl>`
    )}`;

  return {
    title: 'Astrologie — Zeichen, Faktoren, Häuser, Aspekte | Esoterik-Welt',
    html: pageShell({
      eyebrow: 'Astrologie / Nachschlagen und Lernen',
      title: 'Astrologie <em>verstehen</em>',
      subtitle: `${c.zeichen} Zeichen · ${c.faktoren} Faktoren · ${c.haeuser} Häuser · ${c.aspekte} Hauptaspekte`,
      lead: 'Ein Lern- und Nachschlagebereich für die westliche tropische Astrologie: erst die Grundbegriffe, dann die Vergleichstabellen, dann die Beispiele — und an jeder Stelle die Grenze zwischen Überlieferung und belegtem Wissen.',
      body,
      aside: `<div class="astro-aside-box">
        <h2>Direkt springen</h2>
        <ul class="astro-jump">
          <li><a href="${ROUTE.zeichen()}">Zeichen</a></li>
          <li><a href="${ROUTE.faktoren()}">Faktoren</a></li>
          <li><a href="${ROUTE.haeuser()}">Häuser</a></li>
          <li><a href="${ROUTE.aspekte()}">Aspekte</a></li>
          <li><a href="${ROUTE.grundlagen()}">Grundlagen</a></li>
          <li><a href="${ROUTE.beispiele()}">Synthesebeispiele</a></li>
          <li><a href="${ROUTE.faq()}">FAQ</a></li>
          <li><a href="${ROUTE.glossar()}">Glossar</a></li>
          <li><a href="${ROUTE.suche()}">Suche</a></li>
          <li><a href="${ROUTE.quellen()}">Quellen</a></li>
        </ul>
      </div>`,
    }),
  };
}

// --- Lernpfad -------------------------------------------------------------

export function renderLernpfadIndex(ctx) {
  const stages = ctx.datasets.lernpfad;
  const total = stages.reduce((sum, stage) => sum + (stage.reading_time_min || 0), 0);
  const body = `
    <p class="astro-text">${inlineText(ctx.data.LERNPFAD_INTRO)}</p>
    ${section(
      'astro-lernpfad-stufen',
      `Sechs Stufen · zusammen etwa ${total} Minuten`,
      `<ol class="astro-stage-list">${stages
        .map(
          (stage, index) => `<li class="astro-stage">
            <p class="astro-stage-index">Stufe ${index + 1} · ${escapeHtml(label(stage.level))} · ${stage.reading_time_min} Minuten</p>
            <h3><a href="${ROUTE.lernpfad(stage.slug)}">${escapeHtml(stage.title)}</a></h3>
            <p>${inlineText(stage.goal)}</p>
            <p class="astro-stage-meta">${stage.steps.length} Schritte · ${stage.check_questions.length} Verständnisfragen</p>
          </li>`
        )
        .join('')}</ol>`
    )}
    ${section(
      'astro-lernpfad-hinweis',
      'Ohne Anmeldung, ohne Speicherung',
      `<p class="astro-text">Der Pfad merkt sich keinen Fortschritt: Es gibt kein Konto, keine Eingabe und keinen Tracker. Wer eine Stufe abschließt, entscheidet selbst, ob er weiterliest. Die Reihenfolge ist eine Empfehlung, kein Zwang — jede Stufe lässt sich einzeln lesen.</p>`
    )}`;
  return {
    title: 'Lernpfad Astrologie — in sechs Stufen | Esoterik-Welt',
    html: pageShell({
      eyebrow: 'Astrologie / Lernpfad',
      title: 'Lernpfad: Astrologie in sechs Stufen',
      lead: `Von der Frage „Was ist das überhaupt?“ bis zur vorsichtigen Synthese. ${total} Minuten Lesezeit insgesamt, jede Stufe mit konkreten Leseschritten und Verständnisfragen.`,
      badges: badge('Einsteiger', 'primary') + badge('ohne Vorkenntnisse', 'neutral'),
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Lernpfad' }],
      body,
    }),
  };
}

export function renderLernpfadDetail(ctx, stage) {
  const index = ctx.datasets.lernpfad.findIndex((entry) => entry.slug === stage.slug);
  const next = stage.next ? ctx.find(stage.next) : null;
  const steps = stage.steps
    .map(
      (step, i) => `<li class="astro-step">
        <h3>${i + 1}. ${escapeHtml(step.title)}</h3>
        <p>${inlineText(step.task)}</p>
        <p class="astro-step-refs">Material: ${(step.refs || [])
          .map((ref) => ctx.resolve(ref))
          .filter((ref) => ref.found)
          .map((ref) => `<a href="${ref.href}">${escapeHtml(ref.label)}</a>`)
          .join(' · ')}</p>
      </li>`
    )
    .join('');

  const body = `
    ${section('astro-lernziel', 'Ziel dieser Stufe', `<p class="astro-text">${inlineText(stage.goal)}</p>`)}
    ${section('astro-lernschritte', `${stage.steps.length} Schritte`, `<ol class="astro-step-list">${steps}</ol>`)}
    ${section(
      'astro-lernfragen',
      'Verständnisfragen',
      `<p class="astro-text">Diese Fragen lassen sich nach der Stufe beantworten. Wer sie nicht beantworten kann, muss nicht zurückblättern — die verlinkten Seiten stehen daneben.</p>${numberedList(stage.check_questions)}`
    )}
    ${section(
      'astro-lernweiter',
      'Weiterlesen',
      `<p class="astro-text">${next ? `Nächste Stufe: <a href="${ROUTE.lernpfad(next.item.slug)}">${escapeHtml(next.item.title)}</a>` : `Das ist die letzte Stufe. Zum Nachschlagen: <a href="${ROUTE.glossar()}">Glossar</a> und <a href="${ROUTE.faq()}">FAQ</a>.`}</p>
       <p class="astro-text"><a href="${ROUTE.lernpfad()}">Alle Stufen im Überblick</a></p>`
    )}`;

  return {
    title: `${stage.title} — Lernpfad Astrologie | Esoterik-Welt`,
    html: pageShell({
      eyebrow: `Astrologie / Lernpfad / Stufe ${index + 1} von ${ctx.datasets.lernpfad.length}`,
      title: escapeHtml(stage.title),
      lead: stage.goal,
      subtitle: `Lesezeit ${stage.reading_time_min} Minuten`,
      badges: badge(label(stage.level), 'neutral'),
      trail: [
        { label: 'Astrologie', href: ROUTE.hub },
        { label: 'Lernpfad', href: ROUTE.lernpfad() },
        { label: stage.title },
      ],
      toc: [
        { id: 'astro-lernziel', title: 'Ziel' },
        { id: 'astro-lernschritte', title: 'Schritte' },
        { id: 'astro-lernfragen', title: 'Verständnisfragen' },
        { id: 'astro-lernweiter', title: 'Weiterlesen' },
      ],
      route: ROUTE.lernpfad(stage.slug),
      body,
    }),
  };
}

// --- Zeichen --------------------------------------------------------------

export function renderZeichenIndex(ctx, { element = 'all', modality = 'all', q = '' } = {}) {
  const items = ctx.filterZeichen({ element, modality, q });
  const elements = ['all', 'element-feuer', 'element-erde', 'element-luft', 'element-wasser'];
  const modalities = ['all', 'modalitaet-kardinal', 'modalitaet-fix', 'modalitaet-veraenderlich'];
  const filterUrl = (next) => {
    const params = new URLSearchParams();
    if (next.element && next.element !== 'all') params.set('element', next.element);
    if (next.modality && next.modality !== 'all') params.set('modality', next.modality);
    if (next.q) params.set('q', next.q);
    const query = params.toString();
    return ROUTE.zeichen() + (query ? `?${query}` : '');
  };
  const cardList = items
    .map((item) =>
      card(
        ROUTE.zeichen(item.slug),
        `${item.symbol && item.symbol.glyph ? textGlyph(item.symbol.glyph) + ' ' : ''}${item.name}`,
        item.short,
        [
          label(item.element),
          label(item.modality),
          `${item.date_range_tropical.from.slice(3)}.${item.date_range_tropical.from.slice(0, 2)}. – ${item.date_range_tropical.to.slice(3)}.${item.date_range_tropical.to.slice(0, 2)}.`,
        ]
          .map((text) => badge(text, 'small'))
          .join('')
      )
    )
    .join('');

  const body = `
    <div class="astro-controls">
      <form class="astro-search" role="search" data-astro-form="zeichen">
        <label class="sr-only" for="astro-zeichen-q">Zeichen durchsuchen</label>
        <input class="input" id="astro-zeichen-q" name="q" type="search" value="${escapeHtml(q)}" placeholder="Zeichen oder Stichwort suchen …" autocomplete="off" />
        <button class="btn btn-secondary btn-sm" type="submit">Suchen</button>
        ${q ? `<a class="textlink" href="${filterUrl({ element, modality })}">Suche zurücksetzen</a>` : ''}
      </form>
      <div class="astro-filter-groups">
        <div class="astro-filter" role="group" aria-label="Nach Element filtern">
          <p class="astro-filter-label">Element</p>
          ${elements
            .map((value) => {
              const text = value === 'all' ? 'Alle' : label(value);
              const active = value === element;
              return `<a class="astro-filter-chip${active ? ' is-active' : ''}" href="${filterUrl({ element: value, modality, q })}"${active ? ' aria-current="true"' : ''}>${escapeHtml(text)}</a>`;
            })
            .join('')}
        </div>
        <div class="astro-filter" role="group" aria-label="Nach Modalität filtern">
          <p class="astro-filter-label">Modalität</p>
          ${modalities
            .map((value) => {
              const text = value === 'all' ? 'Alle' : label(value);
              const active = value === modality;
              return `<a class="astro-filter-chip${active ? ' is-active' : ''}" href="${filterUrl({ element, modality: value, q })}"${active ? ' aria-current="true"' : ''}>${escapeHtml(text)}</a>`;
            })
            .join('')}
        </div>
      </div>
      <p class="astro-result-count" id="astro-result-count" role="status" aria-live="polite">${items.length} von ${ctx.counts.zeichen} Zeichen</p>
    </div>
    <div class="astro-card-grid" id="astro-cards" data-astro-list="zeichen">${cardList}</div>
    <p class="astro-empty" id="astro-empty" ${items.length ? 'hidden' : ''}>
      Keine Zeichen für diese Auswahl. <a href="${ROUTE.zeichen()}">Filter zurücksetzen</a>
    </p>`;

  return {
    title: 'Zeichen — zwölf Tierkreiszeichen | Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Nachschlagen',
      title: 'Die zwölf Zeichen',
      subtitle: `${ctx.counts.zeichen} Zeichen · Element · Modalität · Herrschaft`,
      lead: 'Die tropischen Zeichen sind gleiche 30-Grad-Sektoren ab dem Frühlingspunkt, keine Sternbilder. Die Zeiträume sind Näherungen: Der genaue Wechsel verschiebt sich jährlich.',
      badges: badge('12 Zeichen', 'primary') + badge('Zeitraum = Näherung', 'neutral'),
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Zeichen' }],
      body,
    }),
  };
}

export function renderZeichenDetail(ctx, item) {
  const ruler = ctx.resolve(item.ruler_traditional);
  const rulerModern = ctx.resolve(item.ruler_modern);
  const house = ctx.resolve(item.natural_house);
  const opposite = ctx.resolve(item.opposite);
  const period = `${item.date_range_tropical.from.slice(3)}.${item.date_range_tropical.from.slice(0, 2)}. – ${item.date_range_tropical.to.slice(3)}.${item.date_range_tropical.to.slice(0, 2)}.`;

  const body = `
    ${kennzeichnung(item)}
    ${section('astro-zeichen-bild', 'Kurz gesagt', `<p class="astro-text">${inlineText(item.short)}</p>`)}
    ${section('astro-zeichen-lang', 'Vertiefung', richText(item.long))}
    ${section(
      'astro-zeichen-meta',
      'Auf einen Blick',
      metaList([
        { label: 'Zeitraum (tropisch, Näherung)', value: period },
        { label: 'Element', value: label(item.element) },
        { label: 'Modalität', value: label(item.modality) },
        { label: 'Polarität', value: label(item.polarity) },
        { label: 'Herrscher (traditionell)', value: ruler.found ? ruler.label : '—' },
        { label: 'Herrscher (modern)', value: rulerModern.found ? rulerModern.label : '—' },
        { label: 'Natürliches Haus', value: house.found ? house.label : '—' },
        { label: 'Gegenpol', value: opposite.found ? opposite.label : '—' },
        { label: 'Bildsprache', value: item.symbol.bildsprache },
      ]) + `<p class="astro-note">${escapeHtml(item.date_range_tropical.note)}</p>`
    )}
    ${section('astro-zeichen-kraefte', 'Stärken und Spannungen', pairList('Stärken', item.strengths, 'Spannungen', item.tensions))}
    ${section('astro-zeichen-fragen', 'Reflexionsfragen', numberedList(item.reflection_questions))}
    ${section(
      'astro-zeichen-missverstaendnis',
      'Häufiges Missverständnis',
      `<div class="astro-callout"><p>${inlineText(item.common_misreading)}</p></div>`
    )}
    ${section('astro-zeichen-weiter', 'Weiterlesen', crossReferences(ctx, item))}`;

  return {
    title: `${item.name} — Zeichen im Überblick | Astrologie`,
    html: pageShell({
      eyebrow: `Astrologie / Zeichen / ${item.name}`,
      title: `<span class="astro-title-glyph" aria-hidden="true">${escapeHtml(textGlyph(item.symbol.glyph))}</span> ${escapeHtml(item.name)}`,
      subtitle: `${period} · ${label(item.element)} · ${label(item.modality)}`,
      lead: item.short,
      badges: [label(item.element), label(item.modality), label(item.polarity), `Herrscher: ${ruler.label}`]
        .map((text) => badge(text, 'small'))
        .join(''),
      trail: [
        { label: 'Astrologie', href: ROUTE.hub },
        { label: 'Zeichen', href: ROUTE.zeichen() },
        { label: item.name },
      ],
      toc: [
        { id: 'astro-zeichen-bild', title: 'Kurz gesagt' },
        { id: 'astro-zeichen-lang', title: 'Vertiefung' },
        { id: 'astro-zeichen-meta', title: 'Auf einen Blick' },
        { id: 'astro-zeichen-kraefte', title: 'Stärken und Spannungen' },
        { id: 'astro-zeichen-fragen', title: 'Reflexionsfragen' },
        { id: 'astro-zeichen-missverstaendnis', title: 'Missverständnis' },
      ],
      route: ROUTE.zeichen(item.slug),
      body,
      aside: sourcesPanel(ctx, item),
    }),
  };
}

// --- Faktoren -------------------------------------------------------------

export function renderFaktorenIndex(ctx, { q = '' } = {}) {
  const items = ctx.filterFaktoren(q);
  const groups = [
    { key: 'leuchtkoerper', title: 'Leuchtkörper' },
    { key: 'planet', title: 'Planeten' },
    { key: 'zwergplanet', title: 'Zwergplanet' },
  ];
  const body = `
    <div class="astro-controls">
      <form class="astro-search" role="search" data-astro-form="faktoren">
        <label class="sr-only" for="astro-faktoren-q">Faktoren durchsuchen</label>
        <input class="input" id="astro-faktoren-q" name="q" type="search" value="${escapeHtml(q)}" placeholder="Faktor oder Stichwort suchen …" autocomplete="off" />
        <button class="btn btn-secondary btn-sm" type="submit">Suchen</button>
        ${q ? `<a class="textlink" href="${ROUTE.faktoren()}">Suche zurücksetzen</a>` : ''}
      </form>
      <p class="astro-result-count" id="astro-result-count" role="status" aria-live="polite">${items.length} von ${ctx.counts.faktoren} Faktoren</p>
    </div>
    ${groups
      .map((group) => {
        const list = items.filter((item) => item.kind === group.key);
        if (!list.length) return '';
        return `<section class="astro-group" aria-labelledby="astro-faktoren-${group.key}">
          <h2 id="astro-faktoren-${group.key}">${escapeHtml(group.title)} <span class="astro-group-count">${list.length}</span></h2>
          <div class="astro-card-grid">${list
            .map((item) =>
              card(
                ROUTE.faktoren(item.slug),
                item.name,
                item.short,
                [
                  badge(label(item.kind), 'small'),
                  ...(item.keywords || []).slice(0, 2).map((keyword) => badge(keyword, 'small')),
                ].join('')
              )
            )
            .join('')}</div>
        </section>`;
      })
      .join('')}
    <p class="astro-empty" ${items.length ? 'hidden' : ''}>Keine Faktoren für diese Suche. <a href="${ROUTE.faktoren()}">Suche zurücksetzen</a></p>`;

  return {
    title: 'Faktoren — Sonne, Mond und Planeten | Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Nachschlagen',
      title: 'Die zehn Faktoren',
      subtitle: `${ctx.counts.faktoren} Faktoren · 2 Leuchtkörper · 8 Planeten und Zwergplanet`,
      lead: 'Sonne und Mond sind Leuchtkörper, die acht weiteren Faktoren sind Planeten beziehungsweise Pluto als Zwergplanet. Astronomie und Deutung stehen getrennt nebeneinander.',
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Faktoren' }],
      body,
    }),
  };
}

export function renderFaktorenDetail(ctx, item) {
  const rulerships = (item.rulerships || [])
    .map((entry) => `${label(entry.system)}: ${ctx.resolve(entry.sign).label}`)
    .join(' · ');
  const body = `
    ${kennzeichnung(item)}
    ${section('astro-faktor-kurz', 'Kurz gesagt', `<p class="astro-text">${inlineText(item.short)}</p>`)}
    ${section('astro-faktor-lang', 'Vertiefung', richText(item.long))}
    ${section(
      'astro-faktor-astronomie',
      'Astronomie',
      metaList([
        { label: 'Art', value: label(item.kind) },
        { label: 'Umlauf / Periode', value: item.astronomy.orbital_period_text },
        { label: 'Entdeckung', value: item.astronomy.discovery },
        { label: 'Sichtbarkeit', value: item.astronomy.visibility },
        { label: 'Hinweis', value: item.astronomy.note },
        { label: 'Herrschaft', value: rulerships || '—' },
        { label: 'Zyklus im Tierkreis', value: item.cycle_text },
      ])
    )}
    ${section('astro-faktor-themen', 'Themen und Fragen', `${bulletList(item.themes)}<h3>Reflexionsfragen</h3>${numberedList(item.questions)}`)}
    ${section('astro-faktor-missverstaendnis', 'Häufige Missverständnisse', bulletList(item.misreadings))}
    ${section('astro-faktor-weiter', 'Weiterlesen', crossReferences(ctx, item))}`;

  return {
    title: `${item.name} — Faktor im Überblick | Astrologie`,
    html: pageShell({
      eyebrow: `Astrologie / Faktoren / ${item.name}`,
      title: escapeHtml(item.name),
      subtitle: `${label(item.kind)} · ${(item.themes || []).slice(0, 3).join(' · ')}`,
      lead: item.short,
      badges: badge(label(item.kind), 'small') + badge('keine Positionsangabe', 'neutral'),
      trail: [
        { label: 'Astrologie', href: ROUTE.hub },
        { label: 'Faktoren', href: ROUTE.faktoren() },
        { label: item.name },
      ],
      toc: [
        { id: 'astro-faktor-kurz', title: 'Kurz gesagt' },
        { id: 'astro-faktor-lang', title: 'Vertiefung' },
        { id: 'astro-faktor-astronomie', title: 'Astronomie' },
        { id: 'astro-faktor-themen', title: 'Themen und Fragen' },
        { id: 'astro-faktor-missverstaendnis', title: 'Missverständnisse' },
      ],
      route: ROUTE.faktoren(item.slug),
      body,
      aside: sourcesPanel(ctx, item),
    }),
  };
}

// --- Häuser ---------------------------------------------------------------

export function renderHaeuserIndex(ctx) {
  const items = ctx.datasets.haeuser;
  const body = `
    <p class="astro-text">Häuser sind Lebensfelder. Anders als die Zeichen hängen sie von Zeit und Ort ab: Ohne Geburtszeit und Häusersystem gibt es keine Hauspositionen — dieser Bereich zeigt deshalb nur, wofür die zwölf Felder traditionell stehen.</p>
    <div class="astro-card-grid astro-card-grid--houses">${items
      .map((item) =>
        card(
          ROUTE.haeuser(item.slug),
          item.name,
          item.short,
          [
            badge(label(item.angularity), 'small'),
            badge(`natürlich ${ctx.resolve(item.natural_sign).label}`, 'small'),
          ].join('')
        )
      )
      .join('')}</div>`;

  return {
    title: 'Häuser — zwölf Lebensfelder | Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Nachschlagen',
      title: 'Die zwölf Häuser',
      subtitle: `${ctx.counts.haeuser} Häuser · Winkel-, Sukzedenten- und Kadentenhäuser`,
      lead: 'Winkelhäuser (1, 4, 7, 10) gelten traditionell als besonders prägnant; Sukzedenten- und Kadentenhäuser liegen dazwischen. Die Zuordnung zu Lebensfeldern ist Überlieferung, die Lage am Himmel ist eine Konvention der Berechnung.',
      badges: badge('zeit- und ortsabhängig', 'neutral'),
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Häuser' }],
      body,
    }),
  };
}

export function renderHaeuserDetail(ctx, item) {
  const body = `
    ${kennzeichnung(item)}
    ${section('astro-haus-kurz', 'Kurz gesagt', `<p class="astro-text">${inlineText(item.short)}</p>`)}
    ${section('astro-haus-lang', 'Vertiefung', richText(item.long))}
    ${section(
      'astro-haus-meta',
      'Auf einen Blick',
      metaList([
        { label: 'Nummer', value: String(item.number) },
        { label: 'Kategorie', value: label(item.angularity) },
        { label: 'Hemisphäre', value: label(item.hemisphere) },
        { label: 'Natürliches Zeichen', value: ctx.resolve(item.natural_sign).label },
        { label: 'Themen', value: (item.themes || []).join(' · ') },
      ])
    )}
    ${section('astro-haus-fragen', 'Reflexionsfragen', numberedList(item.questions))}
    ${section('astro-haus-grenze', 'Grenze der Aussage', `<div class="astro-callout astro-callout--limit"><p>${inlineText(item.caution)}</p></div>`)}
    ${section('astro-haus-weiter', 'Weiterlesen', crossReferences(ctx, item))}`;

  return {
    title: `${item.name} — Haus im Überblick | Astrologie`,
    html: pageShell({
      eyebrow: `Astrologie / Häuser / ${item.name}`,
      title: escapeHtml(item.name),
      subtitle: `${label(item.angularity)} · ${label(item.hemisphere)} · natürlich ${ctx.resolve(item.natural_sign).label}`,
      lead: item.short,
      badges: badge(label(item.angularity), 'small') + badge('Hausspitze zeitabhängig', 'neutral'),
      trail: [
        { label: 'Astrologie', href: ROUTE.hub },
        { label: 'Häuser', href: ROUTE.haeuser() },
        { label: item.name },
      ],
      toc: [
        { id: 'astro-haus-kurz', title: 'Kurz gesagt' },
        { id: 'astro-haus-lang', title: 'Vertiefung' },
        { id: 'astro-haus-meta', title: 'Auf einen Blick' },
        { id: 'astro-haus-fragen', title: 'Reflexionsfragen' },
        { id: 'astro-haus-grenze', title: 'Grenze' },
      ],
      route: ROUTE.haeuser(item.slug),
      body,
      aside: sourcesPanel(ctx, item),
    }),
  };
}

// --- Aspekte --------------------------------------------------------------

export function renderAspekteIndex(ctx) {
  const items = ctx.datasets.aspekte;
  const body = `
    <p class="astro-text">Fünf Hauptaspekte: Konjunktion (0°), Sextil (60°), Quadrat (90°), Trigon (120°) und Opposition (180°). Der Winkel ist eine Definition; der erlaubte Spielraum — der Orbis — ist eine Fachkonvention und unterscheidet sich zwischen Schulen.</p>
    <div class="astro-card-grid">${items
      .map((item) =>
        card(
          ROUTE.aspekte(item.slug),
          `${textGlyph(item.glyph)} ${item.name}`,
          item.short,
          [badge(`${item.angle_deg}°`, 'primary'), badge('Hauptaspekt', 'small')].join('')
        )
      )
      .join('')}</div>`;

  return {
    title: 'Aspekte — fünf Hauptwinkel | Astrologie',
    html: pageShell({
      eyebrow: 'Astrologie / Nachschlagen',
      title: 'Die fünf Hauptaspekte',
      subtitle: '0° · 60° · 90° · 120° · 180°',
      lead: 'Aspekte beschreiben Winkelabstände zwischen zwei Faktoren. Ohne berechnete Positionen gibt es hier keine Aspekte zu sehen — nur ihre Definition, ihre traditionelle Bewertung und die Orb-Konventionen.',
      trail: [{ label: 'Astrologie', href: ROUTE.hub }, { label: 'Aspekte' }],
      body,
    }),
  };
}

export function renderAspekteDetail(ctx, item) {
  const body = `
    ${kennzeichnung(item)}
    ${section('astro-aspekt-kurz', 'Kurz gesagt', `<p class="astro-text">${inlineText(item.short)}</p>`)}
    ${section('astro-aspekt-lang', 'Vertiefung', richText(item.long))}
    ${section(
      'astro-aspekt-meta',
      'Winkel und Orbis',
      metaList([
        { label: 'Winkel', value: `${item.angle_deg} Grad` },
        { label: 'Zeichen der Qualität', value: item.traditionelle_qualitaet },
        { label: 'Orbis (modern typisch)', value: item.orb.modern_typisch },
        { label: 'Orbis (Spanne)', value: item.orb.spanne },
        { label: 'Schulhinweis', value: item.orb.schulhinweis },
      ])
    )}
    ${section('astro-aspekt-missverstaendnis', 'Häufiges Missverständnis', `<div class="astro-callout"><p>${inlineText(item.common_misreading)}</p></div>`)}
    ${section('astro-aspekt-weiter', 'Weiterlesen', crossReferences(ctx, item))}`;

  return {
    title: `${item.name} — Aspekt im Überblick | Astrologie`,
    html: pageShell({
      eyebrow: `Astrologie / Aspekte / ${item.name}`,
      title: `<span class="astro-title-glyph" aria-hidden="true">${escapeHtml(textGlyph(item.glyph))}</span> ${escapeHtml(item.name)}`,
      subtitle: `${item.angle_deg} Grad · ${item.orb.modern_typisch}`,
      lead: item.short,
      badges: badge(`${item.angle_deg}°`, 'primary') + badge('Orbis = Konvention', 'neutral'),
      trail: [
        { label: 'Astrologie', href: ROUTE.hub },
        { label: 'Aspekte', href: ROUTE.aspekte() },
        { label: item.name },
      ],
      toc: [
        { id: 'astro-aspekt-kurz', title: 'Kurz gesagt' },
        { id: 'astro-aspekt-lang', title: 'Vertiefung' },
        { id: 'astro-aspekt-meta', title: 'Winkel und Orbis' },
        { id: 'astro-aspekt-missverstaendnis', title: 'Missverständnis' },
      ],
      route: ROUTE.aspekte(item.slug),
      body,
      aside: sourcesPanel(ctx, item),
    }),
  };
}
