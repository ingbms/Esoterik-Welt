// Radiästhesie-Modul — Modell ohne DOM.
//
// Aufgaben: Route auflösen, Suche, Glossarfilter, Quellenzuordnung. Die
// Ansichten (radiasthesie-views.js) bekommen dieses Modell und geben HTML
// zurück; der Controller (radiasthesie.js) hängt es nur ins Dokument.

export const ROUTE_SLUGS = ['radiasthesie', 'pendeln', 'orakel'];

const VIEW = {
  landing: 'landing',
  topic: 'topic',
  glossar: 'glossar',
  quellen: 'quellen',
  methodik: 'methodik',
  suche: 'suche',
  labor: 'labor',
  studio: 'studio',
  notfound: 'notfound',
};

/** Vergleichsform für Suche: Kleinschreibung, Umlaute gefaltet, Satzzeichen weg. */
export function normalize(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sourceIdsIn(text) {
  return (String(text).match(/\bQ\d{2}\b/g) || []).filter((id, index, all) => all.indexOf(id) === index);
}

function blocksToText(blocks) {
  return (blocks || [])
    .map((block) =>
      block.type === 'ul' ? block.items.join(' ') : block.type === 'callout' ? block.paragraphs.join(' ') : block.text
    )
    .join(' ');
}

export function createModel(raw) {
  const data = raw && raw.RADIASTHESIE ? raw.RADIASTHESIE : raw;
  if (!data || !data.topics) throw new Error('Radiästhesie-Daten fehlen');

  const topics = data.topics;
  const topicList = Object.values(topics);
  const sourceById = new Map((data.sources || []).map((entry) => [entry.id, entry]));

  // Welche Quelle wird in welchem Thema zitiert? Aus den Texten abgeleitet,
  // nicht gepflegt — so kann die Zuordnung nicht veralten.
  const topicSources = {};
  const sourceTopics = new Map();
  for (const topic of topicList) {
    const text = [
      topic.lead,
      ...topic.sections.map((sectionEntry) => `${sectionEntry.title} ${blocksToText(sectionEntry.blocks)}`),
    ].join(' ');
    const ids = sourceIdsIn(text).filter((id) => sourceById.has(id));
    topicSources[topic.slug] = ids;
    for (const id of ids) {
      if (!sourceTopics.has(id)) sourceTopics.set(id, []);
      if (!sourceTopics.get(id).includes(topic.slug)) sourceTopics.get(id).push(topic.slug);
    }
  }

  const glossaryTerms = (data.glossary || []).flatMap((group) =>
    group.terms.map((term) => ({ ...term, letter: group.letter }))
  );

  const stats = {
    topics: topicList.length,
    chapters: topicList.reduce((sum, topic) => sum + topic.sections.length, 0),
    sources: (data.sources || []).length,
    glossary: glossaryTerms.length,
    levels: (data.levels || []).length,
    withYear: (data.sources || []).filter((entry) => /^\d{4}$/.test(String(entry.year))).length,
    crossref: (data.sources || []).filter((entry) => /doi\.org/.test(entry.url)).length,
    isbn: (data.sources || []).filter((entry) => /^ISBN/i.test(entry.url)).length,
  };

  function resolve(segments = [], query = '') {
    const params = new URLSearchParams(query || '');
    const [area, ...rest] = segments;
    if (!area) return { view: VIEW.landing, params };

    if (Object.prototype.hasOwnProperty.call(topics, area)) {
      const topic = topics[area];
      const requested = rest[0] || '';
      const anchor = topic.sections.some((entry) => entry.id === requested) ? requested : '';
      return { view: VIEW.topic, topic, anchor, params };
    }
    switch (area) {
      case 'glossar':
        return { view: VIEW.glossar, letter: params.get('b') || '', params };
      case 'quellen': {
        const id = rest[0] || '';
        return { view: VIEW.quellen, sourceId: sourceById.has(id) ? id : '', params };
      }
      case 'methodik':
        return { view: VIEW.methodik, params };
      // Werkstatt-Route des Pendellabors (RAD-07). Bewusst ohne Query-Zustand:
      // die Parameter liegen in den Reglern und werden nicht in die Adresse
      // geschrieben, damit ein Deep-Link nie eine andere Bewegung vortäuscht.
      case 'labor':
        return { view: VIEW.labor, params };
      // Werkstatt-Route des Pendeltafel-Studios (RAD-08). Ebenfalls ohne
      // Query-Zustand: die Tafel entsteht im Browser aus Vorlage, Text und
      // Farbstil; eine URL würde nur einen fremden Stand vortäuschen.
      case 'studio':
        return { view: VIEW.studio, params };
      case 'suche':
        return { view: VIEW.suche, q: params.get('q') || '', params };
      default:
        return { view: VIEW.notfound, slug: segments.join('/'), params };
    }
  }

  /** Glossar: optional auf einen Buchstaben eingegrenzt, optional gefiltert. */
  function glossary(query = '', letter = '') {
    const needle = normalize(query);
    return (data.glossary || [])
      .map((group) => ({
        ...group,
        terms: group.terms.filter((term) => {
          if (letter && group.letter !== letter) return false;
          if (!needle) return true;
          return normalize(`${term.term} ${term.definition}`).includes(needle);
        }),
      }))
      .filter((group) => group.terms.length > 0);
  }

  /**
   * Clientseitige Suche über Themen, Kapitel, Glossar und Quellen.
   * Bewertet Titel-Treffer höher als Fließtext-Treffer und liefert
   * höchstens `limit` Ergebnisse.
   */
  function search(query, limit = 50) {
    const needle = normalize(query);
    if (!needle) return [];
    const terms = needle.split(' ').filter(Boolean);
    const results = [];

    const score = (haystack, weight) => {
      const value = normalize(haystack);
      if (!value) return 0;
      if (!terms.every((term) => value.includes(term))) return 0;
      return weight + (value.startsWith(needle) ? 3 : 0);
    };

    for (const topic of topicList) {
      const titleScore = score(`${topic.title} ${topic.subtitle}`, 6);
      if (titleScore) {
        results.push({
          type: 'Thema',
          title: topic.title,
          href: `#pendeln/${topic.slug}`,
          text: topic.lead,
          score: titleScore,
        });
      }
      for (const section of topic.sections) {
        const sectionScore = score(section.title, 5);
        const bodyScore = sectionScore || score(blocksToText(section.blocks), 1);
        if (!bodyScore) continue;
        results.push({
          type: `${topic.title} · Kapitel ${String(section.number).padStart(2, '0')}`,
          title: section.title + (section.period ? ` — ${section.period}` : ''),
          href: `#pendeln/${topic.slug}/${section.id}`,
          text: blocksToText(section.blocks).slice(0, 180) + '…',
          score: bodyScore,
        });
      }
    }

    for (const term of glossaryTerms) {
      const termScore = score(term.term, 4) || score(term.definition, 1);
      if (!termScore) continue;
      results.push({
        type: 'Glossar',
        title: term.term,
        href: `#pendeln/glossar?b=${encodeURIComponent(term.letter)}`,
        text: term.definition,
        score: termScore,
      });
    }

    for (const source of data.sources || []) {
      const sourceScore = score(`${source.id} ${source.citation}`, 3) || score(source.note, 1);
      if (!sourceScore) continue;
      results.push({
        type: `Quelle ${source.id}`,
        title: source.citation,
        href: `#pendeln/quellen/${source.id}`,
        text: source.interestNote || source.type,
        score: sourceScore,
      });
    }

    return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'de')).slice(0, limit);
  }

  function topicBySlug(slug) {
    return topics[slug] || null;
  }

  function sourcesForTopic(slug) {
    return (topicSources[slug] || []).map((id) => sourceById.get(id)).filter(Boolean);
  }

  function topicsForSource(id) {
    return (sourceTopics.get(id) || []).map((slug) => topics[slug]);
  }

  return {
    data,
    topics,
    topicList,
    levels: data.levels || [],
    sources: data.sources || [],
    sourceById,
    sourceLegend: data.sourceLegend || [],
    glossaryTerms,
    stats,
    resolve,
    search,
    glossary,
    topicBySlug,
    sourcesForTopic,
    topicsForSource,
  };
}
