// Farbwelten & Farbtherapie — Bereichsmodul.
//
// Rendert in #farbweltenRoot. Der Router (js/main.js) übergibt nur Segmente;
// dieses Modul entscheidet über die Ansicht, setzt Titel/Description und den
// Fokus. Alle Redaktionstexte stammen aus js/data/farbwelten.js und werden
// ausschließlich mit textContent gerendert — kein innerHTML mit Inhalten.
// innerHTML wird nur für konstante Zeichenketten (SVG-Figur) verwendet.

import { CHAKREN_PAGE, FARBWELTEN, LANDING, LIGHT_PAGE, SECTION_ORDER, SOURCES } from '../data/farbwelten.js';
import { CHAKRA_POSITIONS, CHAKREN } from '../data/chakren.js';
import { ROUTE, VIEW, resolveView, spectrumAt } from './farbwelten-model.js';

const JSON_LD_ID = 'farbwelten-breadcrumb-ld';
const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
const COLOUR_IDS = new Set(FARBWELTEN.map((world) => world.id));

// --- DOM-Bausteine --------------------------------------------------------

function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html')
      node.innerHTML = value; // nur konstante Zeichenketten
    else if (key.startsWith('on') && typeof value === 'function')
      node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

// Relative Redaktionslinks zeigen auf Markdown-Dateien; sie werden auf die
// echten Routen abgebildet. Alles andere bleibt Text (keine Linkziele raten).
function resolveHref(href) {
  const value = String(href || '').trim();
  if (value.startsWith('#')) return value;
  if (/^https:\/\//i.test(value)) return value;
  const file = /^(?:\.\/)?([a-z-]+)\.md$/i.exec(value);
  if (file) {
    const name = file[1];
    if (name === 'farbwelten') return ROUTE.base;
    if (name === 'chakren') return ROUTE.chakren();
    if (name === 'lichtfrequenzen') return ROUTE.light();
    if (COLOUR_IDS.has(name)) return ROUTE.color(name);
  }
  return null;
}

/** Setzt Markdown-lite (**fett**, *kursiv*, [Text](url)) als DOM-Knoten. */
function appendInline(parent, text) {
  const source = String(text == null ? '' : text);
  let last = 0;
  let match;
  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(source)) !== null) {
    if (match.index > last) parent.append(document.createTextNode(source.slice(last, match.index)));
    const token = match[0];
    if (token.startsWith('**')) {
      parent.append(h('strong', { text: token.slice(2, -2) }));
    } else if (token.startsWith('*')) {
      parent.append(h('em', { text: token.slice(1, -1) }));
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const href = link ? resolveHref(link[2]) : null;
      if (href) {
        parent.append(
          h('a', {
            href,
            rel: /^https:/i.test(href) ? 'noopener' : null,
            text: link[1],
          })
        );
      } else {
        parent.append(document.createTextNode(token));
      }
    }
    last = INLINE_PATTERN.lastIndex;
  }
  if (last < source.length) parent.append(document.createTextNode(source.slice(last)));
  return parent;
}

function paragraph(text, className) {
  const node = h('p', { class: className });
  return appendInline(node, text);
}

function facts(rows) {
  const list = h('dl', { class: 'fw-facts' });
  for (const [label, value] of rows) {
    list.append(h('div', { class: 'fw-facts__row' }, [h('dt', { text: label }), h('dd', { text: value })]));
  }
  return list;
}

function timeline(items) {
  const list = h('ol', { class: 'fw-timeline' });
  for (const item of items) {
    const separator = item.indexOf(':');
    const year = separator > 0 && separator < 12 ? item.slice(0, separator) : '';
    const text = year ? item.slice(separator + 1).trim() : item;
    const body = h('p');
    appendInline(body, text);
    list.append(h('li', {}, [year ? h('span', { class: 'fw-timeline__year', text: year }) : null, body]));
  }
  return list;
}

function table(block) {
  const node = h('table', { class: 'fw-table' });
  const head = h('thead');
  const headRow = h('tr');
  for (const cell of block.head || []) headRow.append(h('th', { scope: 'col', text: cell }));
  head.append(headRow);
  const body = h('tbody');
  for (const row of block.rows || []) {
    const tr = h('tr');
    row.forEach((cell, index) => {
      const world =
        index === 0 ? FARBWELTEN.find((entry) => entry.name.toLowerCase() === String(cell).toLowerCase()) : null;
      const content = world ? h('a', { href: ROUTE.color(world.id), text: cell }) : document.createTextNode(cell);
      tr.append(index === 0 ? h('th', { scope: 'row' }, [content]) : h('td', {}, [content]));
    });
    body.append(tr);
  }
  node.append(head, body);
  return node;
}

function swatch(world) {
  const field = (role, label) =>
    h('span', {
      class: 'fw-swatch__tone',
      style: `background: var(--fw-${world.id}-${role})`,
      title: label,
      'aria-hidden': 'true',
    });
  const strip = h('div', { class: 'fw-swatch__strip', 'aria-hidden': 'true' }, [
    field('soft', 'heller Ton'),
    field('core', 'Grundton'),
    field('core-deep', 'Tiefe'),
    field('deep', 'getönte Nachtfläche'),
  ]);
  const figure = h('figure', { class: 'fw-swatch' }, [
    strip,
    h('figcaption', {
      text: 'Vier Töne dieser Farbwelt: heller Verlauf, Grundton, Tiefe und getönte Nachtfläche. Die Flächen sind eine Bildschirmannäherung, kein monochromatisches Licht.',
    }),
  ]);
  return figure;
}

function blocks(container, list, world) {
  for (const block of list) {
    switch (block.type) {
      case 'p':
        container.append(paragraph(block.text));
        break;
      case 'list': {
        const ul = h('ul', { class: 'fw-list' });
        for (const item of block.items) {
          const li = h('li');
          appendInline(li, item);
          ul.append(li);
        }
        container.append(ul);
        break;
      }
      case 'facts':
        container.append(facts(block.rows));
        break;
      case 'table':
        container.append(
          h('div', { class: 'fw-table-wrap', role: 'region', 'aria-label': 'Tabelle', tabindex: '0' }, [table(block)])
        );
        break;
      case 'quote': {
        const quote = h('blockquote', { class: 'fw-quote' });
        quote.append(paragraph(block.text));
        container.append(quote);
        break;
      }
      case 'h3':
        container.append(h('h3', { class: 'fw-subhead', text: block.text }));
        break;
      case 'timeline':
        container.append(timeline(block.items));
        break;
      case 'swatch':
        if (world) container.append(swatch(world));
        break;
      case 'gap':
        container.append(h('div', { class: 'fw-gap' }, [paragraph(block.text)]));
        break;
      default:
        // Unbekannte Blocktypen werden nicht stillschweigend gerendert.
        console.warn('Farbwelten: unbekannter Blocktyp', block.type);
    }
  }
  return container;
}

function levelChips(labels) {
  const map = {
    Deutungstradition: 'astro-badge--deutungstradition',
    'Empirie begrenzt': 'astro-badge--empirie',
    Empirie: 'astro-badge--empirie',
    Konvention: 'astro-badge--konvention',
    Historisch: 'astro-badge--historisch',
  };
  const wrap = h('span', { class: 'fw-chips' });
  for (const label of labels) {
    wrap.append(h('span', { class: `astro-badge ${map[label] || 'astro-badge--konvention'}`, text: label }));
  }
  return wrap;
}

function breadcrumb(trail) {
  const nav = h('nav', { class: 'fw-breadcrumb', 'aria-label': 'Brotkrümelnavigation' });
  const list = h('ol');
  trail.forEach((entry, index) => {
    const last = index === trail.length - 1;
    list.append(
      h('li', {}, [
        last
          ? h('span', { 'aria-current': 'page', text: entry.label })
          : h('a', { href: entry.href, text: entry.label }),
      ])
    );
  });
  nav.append(list);
  return nav;
}

function toc(entries, ariaLabel) {
  const list = h('ol');
  for (const entry of entries) {
    list.append(h('li', {}, [h('a', { href: entry.href, text: entry.label })]));
  }
  return h('details', { class: 'astro-toc fw-toc', open: true }, [
    h('summary', { text: 'Auf dieser Seite' }),
    h('nav', { 'aria-label': ariaLabel }, [list]),
  ]);
}

function sourcesSection(ids, { title = 'Quellen', headingId = 'quellen-title' } = {}) {
  // Bewusst <ul>: die Kennung [n] steht im Eintrag selbst. Eine <ol> hätte eine
  // zweite, konkurrierende Nummerierung, die mit den Kennungen nicht übereinstimmt.
  const resolution = h('ul', { class: 'fw-sources', role: 'list' });
  for (const id of ids) {
    const source = SOURCES[id];
    if (!source) continue;
    const li = h('li', { id: `quelle-${id}` });
    const label = h('span', { class: 'fw-sources__label', text: `[${id}] ${source.label}` });
    if (source.url) {
      li.append(h('a', { href: source.url, rel: 'noopener' }, [label]));
    } else {
      li.append(label);
    }
    resolution.append(li);
  }
  return h('section', { class: 'fw-detail__section', id: 'quellen', 'aria-labelledby': headingId }, [
    h('p', { class: 'label', text: 'Quellen' }),
    h('h2', { id: headingId, tabindex: '-1', text: title }),
    resolution,
  ]);
}

// --- Ansichten ------------------------------------------------------------

function hero() {
  const tafel = h('div', {
    class: 'fw-tafel',
    role: 'img',
    'aria-label': `Farbtafel: ${FARBWELTEN.map((world) => `${world.name} ${world.wavelength.label}`).join(', ')}`,
  });
  for (const world of FARBWELTEN) {
    tafel.append(
      h(
        'div',
        {
          class: 'fw-tafel__band',
          style: `--band-core: var(--fw-${world.id}-core); --band-deep: var(--fw-${world.id}-deep)`,
        },
        [
          h('span', { class: 'fw-tafel__field', 'aria-hidden': 'true' }),
          h('span', { class: 'fw-tafel__plate' }, [
            h('span', { class: 'fw-tafel__nm', text: world.wavelength.label }),
            h('span', { class: 'fw-tafel__name', text: world.name }),
          ]),
        ]
      )
    );
  }
  return h('section', { class: 'fw-hero', 'aria-labelledby': 'farbwelten-title' }, [
    h('div', { class: 'fw-hero__copy' }, [
      h('p', { class: 'label fw-hero__eyebrow', text: 'Farben / Licht / Bedeutung' }),
      h('h1', { id: 'farbwelten-title', tabindex: '-1', text: LANDING.title }),
      paragraph(LANDING.lede, 'fw-hero__lede'),
      h('div', { class: 'fw-actions' }, [
        h('a', { class: 'btn btn-primary', href: ROUTE.landing('register'), text: 'Farbwelten entdecken' }),
        h('a', { class: 'textlink', href: ROUTE.chakren() }, [
          document.createTextNode('Chakren & Farben '),
          h('span', { 'aria-hidden': 'true', text: '↗' }),
        ]),
      ]),
    ]),
    h('figure', { class: 'fw-tafel-wrap' }, [
      tafel,
      h('figcaption', {
        class: 'fw-tafel__hint',
        text: 'Wellenlängenbereiche sind konventionelle Näherungen; die Grenzen zwischen Farbnamen sind fließend.',
      }),
    ]),
  ]);
}

function registerSection() {
  const list = h('ul', { class: 'fw-register' });
  FARBWELTEN.forEach((world, index) => {
    const chakra = CHAKREN.find((entry) => entry.colorId === world.id);
    list.append(
      h('li', { class: 'fw-register__row' }, [
        h('a', { class: 'fw-register__link', href: ROUTE.color(world.id) }, [
          h('span', {
            class: 'fw-register__field',
            style: `background: var(--fw-${world.id}-core)`,
            'aria-hidden': 'true',
          }),
          h('span', { class: 'fw-register__text' }, [
            h('span', { class: 'fw-register__name', text: `${String(index + 1).padStart(2, '0')} ${world.name}` }),
            h('span', {
              class: 'fw-register__meta',
              text: `${world.wavelength.label} · ${world.frequency.label} · ${world.spectral ? 'spektral' : 'Mischfarbe'}`,
            }),
          ]),
          h('span', { class: 'fw-register__chakra', text: `${chakra ? chakra.name : 'Chakra'} (moderne Zuordnung)` }),
          h('span', { class: 'fw-register__arrow', 'aria-hidden': 'true', text: '→' }),
        ]),
      ])
    );
  });
  return h('section', { class: 'fw-section', id: 'register', 'aria-labelledby': 'register-title' }, [
    h('div', { class: 'fw-section__head' }, [
      h('h2', { id: 'register-title', text: 'Sieben Farbwelten' }),
      h('p', { class: 'label', text: 'Farbregister' }),
    ]),
    paragraph(
      'Jede Farbwelt verbindet Physik, Wahrnehmung, Kultur und Tradition — getrennt gekennzeichnet, wo die Quellenlagen auseinandergehen.',
      'fw-section__lede'
    ),
    list,
    h('p', {
      class: 'fw-note',
      text: 'Frequenzwerte berechnet mit f = c/λ (c = 299 792 458 m/s) für die genannten Grenzwellenlängen, gerundet. Die Zuordnung Farbe–Chakra folgt dem verbreiteten modernen Regenbogenmodell und ist keine historisch einheitliche Überlieferung.',
    }),
  ]);
}

function entrySection() {
  const card = (id, title, text, href) =>
    h('article', { class: 'fw-card' }, [
      h('div', { class: 'fw-card__body' }, [
        h('h3', { class: 'fw-card__title', text: title }),
        paragraph(text, 'fw-card__text'),
        h('p', { class: 'fw-card__footer' }, [
          h('a', { class: 'textlink', href }, [
            document.createTextNode(`${title} öffnen `),
            h('span', { 'aria-hidden': 'true', text: '↗' }),
          ]),
        ]),
      ]),
    ]);
  return h('section', { class: 'fw-section', id: 'einstiege', 'aria-labelledby': 'einstiege-title' }, [
    h('div', { class: 'fw-section__head' }, [
      h('h2', { id: 'einstiege-title', text: 'Zwei Wege in das Thema' }),
      h('p', { class: 'label', text: 'Einstiege' }),
    ]),
    h('div', { class: 'fw-card-grid' }, [
      card(
        'chakren',
        'Chakren & Farben',
        'Sieben Zentren, ihre Farbzuordnung und die Geschichte des Regenbogenmodells — als Deutungstradition gekennzeichnet.',
        ROUTE.chakren()
      ),
      card(
        'lichtfrequenzen',
        'Lichtfrequenzen',
        'Wellenlänge, Frequenz und Photonenenergie berechnen; belegte Lichtmedizin von nicht belegter Chromotherapie trennen.',
        ROUTE.light()
      ),
    ]),
  ]);
}

function methodSection() {
  return h('section', { class: 'fw-section', id: 'methodik', 'aria-labelledby': 'methodik-title' }, [
    h('div', { class: 'fw-section__head' }, [
      h('h2', { id: 'methodik-title', text: 'Wie diese Sektion kennzeichnet' }),
      h('p', { class: 'label', text: 'Methode' }),
    ]),
    h('div', { class: 'astro-callout astro-callout--limit' }, [
      paragraph(
        'Tradition und Forschung stehen nebeneinander, nicht gleichwertig. Jede Seite nennt die Wellenlänge als Messwert, kennzeichnet Assoziationen als Assoziationen und trennt medizinisch untersuchte Lichttherapie von nicht belegter Chromotherapie.'
      ),
      h('p', {}, [
        h('a', { class: 'textlink', href: ROUTE.light() }, [
          document.createTextNode('Zur wissenschaftlichen Einordnung '),
          h('span', { 'aria-hidden': 'true', text: '↗' }),
        ]),
      ]),
    ]),
  ]);
}

function relatedSection() {
  return h('section', { class: 'fw-section', id: 'weiterlesen', 'aria-labelledby': 'weiterlesen-title' }, [
    h('h2', { id: 'weiterlesen-title', text: 'Weiterlesen' }),
    h('ul', { class: 'fw-list fw-list--links' }, [
      h('li', {}, [h('a', { href: '#crystals', text: 'Kristalle nach Farbe und Chakra' })]),
      h('li', {}, [h('a', { href: '#blog', text: 'Artikel zu Symbolik und Geschichte' })]),
    ]),
  ]);
}

function renderLanding() {
  const fragment = document.createDocumentFragment();
  fragment.append(hero(), registerSection());
  for (const section of LANDING.sections) {
    if (!section.blocks.length) continue;
    const container = h('section', { class: 'fw-section', 'aria-labelledby': `${section.key}-title` }, [
      h('div', { class: 'fw-section__head' }, [
        h('h2', { id: `${section.key}-title`, text: section.title }),
        h('p', { class: 'label', text: 'Farbwelten' }),
      ]),
    ]);
    blocks(container, section.blocks);
    fragment.append(container);
  }
  fragment.append(
    entrySection(),
    methodSection(),
    sourcesSection(LANDING.sources, { title: 'Quellen dieses Bereichs' }),
    relatedSection()
  );
  return fragment;
}

function renderColor(world) {
  const index = FARBWELTEN.findIndex((entry) => entry.id === world.id) + 1;
  const fragment = document.createDocumentFragment();
  fragment.append(
    breadcrumb([{ label: 'Start', href: '#home' }, { label: 'Farben', href: ROUTE.base }, { label: world.name }])
  );
  fragment.append(
    h('header', { class: 'fw-detail__band' }, [
      h('p', {
        class: 'label',
        text: `Farbwelt ${String(index).padStart(2, '0')} / 07 · ${world.spectral ? 'spektral' : 'Mischfarbe'}`,
      }),
      h('h1', { id: 'farbwelten-title', tabindex: '-1', text: world.name }),
      paragraph(world.lede, 'fw-detail__lede'),
      h('div', { class: 'astro-kennzeichnung' }, [
        h('span', { class: 'label', text: 'Kennzeichnung' }),
        levelChips(['Konvention', 'Deutungstradition', 'Empirie begrenzt']),
        h('span', {
          class: 'astro-kennzeichnung-text',
          text: 'Messwerte, Assoziationen und Deutungstradition sind getrennt gekennzeichnet. Keine Aussage ist eine medizinische Empfehlung.',
        }),
      ]),
    ])
  );
  const main = h('div', { class: 'fw-detail__main' });
  SECTION_ORDER.forEach((section, position) => {
    if (section.key === 'quellen') return;
    const list = world.sections[section.key] || [];
    const container = h(
      'section',
      { class: 'fw-detail__section', id: section.anchor, 'aria-labelledby': `${section.anchor}-title` },
      [
        h('p', { class: 'label', text: String(position + 1).padStart(2, '0') }),
        h('h2', { id: `${section.anchor}-title`, tabindex: '-1', text: section.label }),
      ]
    );
    blocks(container, list, world);
    if (section.key === 'anwendung') container.append(compareBox(world));
    main.append(container);
  });
  main.append(sourcesSection(world.sources));
  if (world.shortRefs.length) {
    main.append(
      h('p', {
        class: 'fw-note',
        text: `Weitere Kurzverweise (${world.shortRefs.map((id) => `[${id}]`).join(' ')}) sind im Evidenzreport t_2dd7d588 aufgelöst.`,
      })
    );
  }
  main.append(
    h('section', { class: 'fw-detail__section', 'aria-labelledby': 'verwandt-title' }, [
      h('h2', { id: 'verwandt-title', text: 'Verwandte Themen' }),
      h('ul', { class: 'fw-list fw-list--links' }, [
        h('li', {}, [h('a', { href: ROUTE.chakren(), text: 'Chakra-Zuordnung prüfen' })]),
        h('li', {}, [h('a', { href: ROUTE.light(), text: 'Physik und Lichtmedizin vertiefen' })]),
        h('li', {}, [h('a', { href: '#crystals', text: 'Kristalle nach Farbe und Chakra' })]),
        h('li', {}, [h('a', { href: '#blog', text: 'Artikel im Wissensbereich' })]),
      ]),
    ])
  );
  const tocEntries = SECTION_ORDER.map((section) => ({
    href: ROUTE.color(world.id, section.anchor),
    label: section.label,
  }));
  fragment.append(h('div', { class: 'fw-detail__body' }, [main, toc(tocEntries, 'Inhalt dieser Farbseite')]));
  fragment.append(otherColors(world.id));
  return fragment;
}

function compareBox(world) {
  const compare = world.compare;
  return h('div', { class: 'fw-compare' }, [
    h('div', { class: 'fw-compare__col' }, [
      h('p', { class: 'label', text: 'Tradition' }),
      h('h3', { text: compare.traditionTitle }),
      paragraph(compare.traditionText),
      levelChips(compare.traditionChips),
    ]),
    h('div', { class: 'fw-compare__col' }, [
      h('p', { class: 'label', text: 'Forschung' }),
      h('h3', { text: compare.researchTitle }),
      paragraph(compare.researchText),
      levelChips(compare.researchChips),
    ]),
    paragraph(compare.note, 'fw-compare__foot'),
  ]);
}

function otherColors(currentId) {
  const index = FARBWELTEN.findIndex((world) => world.id === currentId);
  const others = [1, 2, 3].map((step) => FARBWELTEN[(index + step) % FARBWELTEN.length]);
  return h('section', { class: 'fw-section', 'aria-labelledby': 'weitere-title' }, [
    h('div', { class: 'fw-section__head' }, [
      h('h2', { id: 'weitere-title', text: 'Weitere Farben' }),
      h('p', { class: 'label', text: 'Farbregister' }),
    ]),
    h(
      'div',
      { class: 'fw-card-grid' },
      others.map((world) =>
        h('article', { class: 'fw-card' }, [
          h('div', {
            class: 'fw-card__field',
            style: `background: linear-gradient(135deg, var(--fw-${world.id}-soft) 0%, var(--fw-${world.id}-core) 58%, var(--fw-${world.id}-deep) 100%)`,
            'aria-hidden': 'true',
          }),
          h('div', { class: 'fw-card__body' }, [
            h('h3', { class: 'fw-card__title' }, [h('a', { href: ROUTE.color(world.id), text: world.name })]),
            paragraph(`${world.wavelength.label} · ${world.frequency.label}`, 'fw-card__text'),
            h('p', { class: 'fw-card__footer' }, [
              h('a', { class: 'textlink', href: ROUTE.color(world.id) }, [
                document.createTextNode(`${world.name} öffnen `),
                h('span', { 'aria-hidden': 'true', text: '↗' }),
              ]),
            ]),
          ]),
        ])
      )
    ),
  ]);
}

function chakraFigure() {
  const stage = h('div', { class: 'fw-figure__stage' });
  stage.innerHTML = `<svg viewBox="0 0 200 420" role="img" aria-labelledby="fw-fig-title fw-fig-desc">
  <title id="fw-fig-title">Stilisierte menschliche Silhouette mit sieben Chakra-Positionen</title>
  <desc id="fw-fig-desc">Die sieben Positionen sind zusätzlich als nummerierte Schaltflächen per Tastatur erreichbar; die Nummernfolge entspricht Wurzel- bis Kronenchakra.</desc>
  <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="100" cy="54" r="23" />
    <path d="M90 76 L90 88" /><path d="M110 76 L110 88" />
    <path d="M62 104 C78 92 122 92 138 104 C146 150 142 205 128 252 L72 252 C58 205 54 150 62 104 Z" />
    <path d="M62 104 C50 150 46 200 44 244" /><path d="M138 104 C150 150 154 200 156 244" />
    <path d="M80 252 L76 330 L72 404" /><path d="M120 252 L124 330 L128 404" />
    <path d="M72 252 C88 260 112 260 128 252" />
  </g>
  <g stroke="currentColor" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="2 6">
    <line x1="36" y1="22" x2="164" y2="22" /><line x1="36" y1="50" x2="164" y2="50" />
    <line x1="36" y1="88" x2="164" y2="88" /><line x1="36" y1="132" x2="164" y2="132" />
    <line x1="36" y1="174" x2="164" y2="174" /><line x1="36" y1="212" x2="164" y2="212" />
    <line x1="36" y1="252" x2="164" y2="252" />
  </g>
</svg>`;
  for (const chakra of CHAKREN) {
    stage.append(
      h(
        'button',
        {
          class: 'fw-node',
          type: 'button',
          'data-chakra': chakra.id,
          'aria-pressed': chakra.id === 'root' ? 'true' : 'false',
          'aria-label': `${chakra.name}, ${chakra.colorName}, Position ${chakra.number}`,
          style: `left: 50%; top: ${CHAKRA_POSITIONS[chakra.id]}%`,
        },
        [
          h('span', {
            class: 'fw-node__dot',
            style: `background: var(--fw-${chakra.colorId}-core)`,
            'aria-hidden': 'true',
          }),
          String(chakra.number),
        ]
      )
    );
  }
  return h('figure', { class: 'fw-figure' }, [
    stage,
    h('figcaption', {
      text: 'Stilisierte Figur, keine anatomische Darstellung. Positionen und Farben folgen dem verbreiteten modernen Chakra-Modell.',
    }),
  ]);
}

function chakraPanel() {
  const first = CHAKREN[0];
  return h('div', { class: 'fw-chakra__panel', id: 'fwChakraPanel', 'aria-live': 'polite' }, [
    h('p', { class: 'label', text: 'Ausgewählt' }),
    h('h3', { id: 'fwChakraName', text: `${first.sanskrit} — ${first.name}` }),
    h('p', { class: 'fw-chakra__sanskrit', id: 'fwChakraSanskrit', text: `${first.meaning} · ${first.position}` }),
    facts([
      ['Symbolfarbe', first.colorName],
      ['Typische Themen', first.themes.join(', ')],
      ['Einordnung', first.einordnung],
    ]),
    h('p', { class: 'fw-chakra__history', id: 'fwChakraHistory', text: first.historie }),
    h('p', { id: 'fwChakraLinkWrap' }, [
      h('a', { class: 'textlink', id: 'fwChakraLink', href: ROUTE.color(first.colorId) }, [
        document.createTextNode(`Farbwelt ${first.colorName} öffnen `),
        h('span', { 'aria-hidden': 'true', text: '↗' }),
      ]),
    ]),
  ]);
}

function renderChakren() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    breadcrumb([{ label: 'Start', href: '#home' }, { label: 'Farben', href: ROUTE.base }, { label: 'Chakren' }]),
    h('header', { class: 'fw-detail__band' }, [
      h('p', { class: 'label', text: 'Übersicht · Deutungstradition' }),
      h('h1', { id: 'farbwelten-title', tabindex: '-1', text: CHAKREN_PAGE.title }),
      paragraph(CHAKREN_PAGE.lede, 'fw-detail__lede'),
    ])
  );
  const explorer = h('section', { class: 'fw-section', id: 'explorer', 'aria-labelledby': 'explorer-title' }, [
    h('div', { class: 'fw-section__head' }, [
      h('h2', { id: 'explorer-title', text: 'Die sieben Zentren' }),
      h('p', { class: 'label', text: 'Auswahl per Tastatur' }),
    ]),
    h('div', { class: 'fw-chakra' }, [chakraFigure(), chakraPanel()]),
  ]);
  fragment.append(explorer);
  const sections = [
    { id: 'geschichte', title: 'Geschichte der Zentren', list: CHAKREN_PAGE.timeline },
    { id: 'modell', title: 'Das Regenbogenmodell', list: CHAKREN_PAGE.model },
    {
      id: 'tabelle',
      title: 'Farbe, Chakra und Einordnung',
      list: [{ type: 'table', ...CHAKREN_PAGE.table }],
      caption: CHAKREN_PAGE.table.caption,
    },
    { id: 'wissenschaft', title: 'Wissenschaftliche Einordnung', list: CHAKREN_PAGE.science },
  ];
  for (const section of sections) {
    const container = h(
      'section',
      { class: 'fw-detail__section', id: section.id, 'aria-labelledby': `${section.id}-title` },
      [
        h('p', { class: 'label', text: 'Chakren' }),
        h('h2', { id: `${section.id}-title`, tabindex: '-1', text: section.title }),
      ]
    );
    if (section.caption) {
      container.append(
        h('div', { class: 'fw-table-wrap', role: 'region', 'aria-label': 'Tabelle Farbe und Chakra', tabindex: '0' }, [
          tableWithCaption({ ...CHAKREN_PAGE.table, caption: section.caption }),
        ])
      );
    }
    blocks(
      container,
      section.list.filter((block) => block.type !== 'table')
    );
    fragment.append(container);
  }
  fragment.append(sourcesSection(CHAKREN_PAGE.sources));
  return fragment;
}

function tableWithCaption(block) {
  const node = table(block);
  node.prepend(h('caption', { text: block.caption }));
  return node;
}

function spectrumExplorer() {
  const section = h('section', { class: 'fw-section', id: 'spektrum', 'aria-labelledby': 'spektrum-title' }, [
    h('div', { class: 'fw-section__head' }, [
      h('h2', { id: 'spektrum-title', text: 'Spektrum-Explorer' }),
      h('p', { class: 'label', text: '380–780 nm' }),
    ]),
    paragraph(
      'Wellenlänge, Frequenz und Photonenenergie hängen zusammen (f = c/λ, E ≈ 1239,842/λ). Die Vorschau ist eine Simulation, kein monochromatisches Licht.'
    ),
  ]);
  const preview = h('div', { class: 'fw-spectrum__preview', id: 'fwSpectrumPreview', 'aria-hidden': 'true' });
  const readout = h('p', { class: 'fw-spectrum__readout', id: 'fwSpectrumReadout', 'aria-live': 'polite' });
  const list = facts([
    ['Wellenlänge', ''],
    ['Frequenz', ''],
    ['Photonenenergie', ''],
    ['Farbname', ''],
    ['Einordnung', ''],
  ]);
  const values = list.querySelectorAll('dd');
  section.append(
    h('div', { class: 'fw-spectrum' }, [
      preview,
      h('div', { class: 'fw-spectrum__controls' }, [
        h('label', { for: 'fwWavelength', class: 'label', text: 'Wellenlänge in Nanometern' }),
        h('input', {
          type: 'range',
          id: 'fwWavelength',
          min: '380',
          max: '780',
          step: '1',
          value: '530',
          'aria-describedby': 'fwWavelengthHint',
        }),
        h('p', {
          id: 'fwWavelengthHint',
          class: 'fw-note',
          text: 'Pfeiltasten ±1 nm, Umschalttaste ±10 nm, Pos1/Ende an die Grenzen.',
        }),
        readout,
        list,
      ]),
    ])
  );
  section.update = (nm) => {
    const value = spectrumAt(nm);
    preview.style.background = value.hex;
    readout.textContent = value.valueText;
    values[0].textContent = `${value.wavelength} nm`;
    values[1].textContent = value.frequencyLabel;
    values[2].textContent = value.energyLabel;
    values[3].textContent = value.band.name;
    values[4].textContent = `${value.band.note}${value.band.spectral ? ' · Spektralfarbe' : ''}`;
    const input = section.querySelector('#fwWavelength');
    if (input) input.setAttribute('aria-valuetext', value.valueText);
  };
  return section;
}

function renderLight() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    breadcrumb([
      { label: 'Start', href: '#home' },
      { label: 'Farben', href: ROUTE.base },
      { label: 'Lichtfrequenzen' },
    ]),
    h('header', { class: 'fw-detail__band' }, [
      h('p', { class: 'label', text: 'Wissen · Einordnung' }),
      h('h1', { id: 'farbwelten-title', tabindex: '-1', text: LIGHT_PAGE.title }),
      paragraph(LIGHT_PAGE.lede, 'fw-detail__lede'),
    ])
  );
  const explorer = spectrumExplorer();
  fragment.append(explorer);
  for (const section of LIGHT_PAGE.sections) {
    if (!section.blocks.length) continue;
    const container = h(
      'section',
      { class: 'fw-detail__section', id: section.key, 'aria-labelledby': `${section.key}-title` },
      [
        h('p', { class: 'label', text: 'Lichtmedizin' }),
        h('h2', { id: `${section.key}-title`, tabindex: '-1', text: section.title }),
      ]
    );
    blocks(container, section.blocks);
    if (section.key === 'disclaimer') container.classList.add('fw-disclaimer');
    fragment.append(container);
  }
  fragment.append(sourcesSection(LIGHT_PAGE.sources));
  fragment.append(
    h('section', { class: 'fw-detail__section', 'aria-labelledby': 'light-related-title' }, [
      h('h2', { id: 'light-related-title', text: 'Zurück zu den Farbwelten' }),
      h('ul', { class: 'fw-list fw-list--links' }, [
        h('li', {}, [h('a', { href: ROUTE.chakren(), text: 'Chakren und Farben' })]),
        ...FARBWELTEN.map((world) => h('li', {}, [h('a', { href: ROUTE.color(world.id), text: world.name })])),
      ]),
    ])
  );
  return { fragment, explorer };
}

function renderNotFound(slug) {
  return h('section', { class: 'fw-section', 'aria-labelledby': 'notfound-title' }, [
    h('p', { class: 'label', text: 'Unbekannte Farbwelt' }),
    h('h1', { id: 'notfound-title', tabindex: '-1', text: 'Diese Farbwelt gibt es nicht' }),
    paragraph(`„${slug}“ ist keine der sieben Farbwelten. Das Farbregister führt alle verfügbaren Seiten.`),
    h('p', {}, [h('a', { class: 'btn btn-secondary', href: ROUTE.base, text: 'Zum Farbregister' })]),
  ]);
}

// --- Modul ----------------------------------------------------------------

export class FarbweltenModule {
  constructor(root) {
    this.root = root;
    this.data = null;
    this.selectedChakra = 'root';
    this.renderToken = 0;
    if (root) this.bind();
  }

  async load() {
    if (this.data) return this.data;
    this.data = { FARBWELTEN, SECTION_ORDER, SOURCES, LANDING, CHAKREN_PAGE, LIGHT_PAGE };
    return this.data;
  }

  async show(segments = [], query = '', { focus = false } = {}) {
    if (!this.root) return;
    // Die Sektion hat keine Filter; der Query-String wird nur festgehalten,
    // damit der Aufrufvertrag der Bereichsmodule (Router → show) gleich bleibt.
    this.query = String(query || '');
    const token = ++this.renderToken;
    await this.load();
    if (token !== this.renderToken) return;
    const route = resolveView(
      segments,
      FARBWELTEN,
      SECTION_ORDER.map((section) => section.anchor)
    );
    const view = this.render(route);
    this.root.replaceChildren(view.fragment);
    this.root.dataset.farbwelt = route.view === VIEW.COLOR ? route.world.id : '';
    this.applyMeta(route);
    this.placeStructuredData(route);
    if (view.explorer) this.syncExplorer(view.explorer, 530);
    if (focus) this.focusHeading(route);
    else this.scrollToAnchor(route);
  }

  render(route) {
    switch (route.view) {
      case VIEW.COLOR:
        return { fragment: renderColor(route.world) };
      case VIEW.CHAKREN:
        return { fragment: renderChakren() };
      case VIEW.LIGHT: {
        const view = renderLight();
        return { fragment: view.fragment, explorer: view.explorer };
      }
      case VIEW.NOTFOUND:
        return { fragment: renderNotFound(route.slug) };
      case VIEW.LANDING:
      default:
        return { fragment: renderLanding() };
    }
  }

  metaFor(route) {
    if (route.view === VIEW.COLOR) return route.world.meta;
    if (route.view === VIEW.CHAKREN) return CHAKREN_PAGE.meta;
    if (route.view === VIEW.LIGHT) return LIGHT_PAGE.meta;
    if (route.view === VIEW.NOTFOUND)
      return { title: 'Unbekannte Farbwelt | Esoterik-Welt', description: 'Diese Farbwelt ist nicht vorhanden.' };
    return LANDING.meta;
  }

  applyMeta(route) {
    const meta = this.metaFor(route);
    document.title = meta.title;
    const setMeta = (selector, value) => {
      const element = document.querySelector(selector);
      if (element && value != null) element.setAttribute('content', value);
    };
    setMeta('meta[name="description"]', meta.description);
    setMeta('meta[property="og:title"]', meta.title);
    setMeta('meta[property="og:description"]', meta.description);
    setMeta('meta[name="twitter:title"]', meta.title);
    setMeta('meta[name="twitter:description"]', meta.description);
  }

  placeStructuredData(route) {
    const previous = document.getElementById(JSON_LD_ID);
    if (previous) previous.remove();
    const trail = [
      { name: 'Start', item: 'https://ingbms.github.io/Esoterik-Welt/#home' },
      { name: 'Farben', item: 'https://ingbms.github.io/Esoterik-Welt/#farbwelten' },
    ];
    if (route.view === VIEW.COLOR)
      trail.push({
        name: route.world.name,
        item: `https://ingbms.github.io/Esoterik-Welt/#farbwelten/${route.world.id}`,
      });
    if (route.view === VIEW.CHAKREN)
      trail.push({ name: 'Chakren & Farben', item: 'https://ingbms.github.io/Esoterik-Welt/#farbwelten/chakren' });
    if (route.view === VIEW.LIGHT)
      trail.push({
        name: 'Lichtfrequenzen',
        item: 'https://ingbms.github.io/Esoterik-Welt/#farbwelten/lichtfrequenzen',
      });
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: entry.name,
        item: entry.item,
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSON_LD_ID;
    script.textContent = JSON.stringify(data);
    this.root.append(script);
  }

  focusHeading(route) {
    if (route.anchor) {
      const heading = document.getElementById(`${route.anchor}-title`);
      if (heading) {
        // Sprungziele sind Überschriften ohne eigenes Tab-Stopp; tabindex="-1"
        // macht sie programmatisch fokussierbar, ohne sie in die Tab-Reihenfolge
        // aufzunehmen.
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ behavior: 'instant', block: 'start' });
        return;
      }
    }
    if (route.view === VIEW.LANDING && route.anchor) {
      const target = document.getElementById(route.anchor);
      if (target) {
        const heading = target.querySelector('h2');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        return;
      }
    }
    const title = this.root.querySelector('h1');
    if (title) title.focus({ preventScroll: true });
  }

  scrollToAnchor(route) {
    if (!route.anchor) return;
    requestAnimationFrame(() => this.focusHeading(route));
  }

  syncExplorer(section, nm) {
    if (typeof section.update === 'function') section.update(nm);
  }

  /** Delegierte Handler überleben jedes Neu-Rendern (Container bleibt stabil). */
  bind() {
    const root = this.root;
    root.addEventListener('click', (event) => {
      const node = event.target.closest('.fw-node');
      if (!node) return;
      this.selectChakra(node.dataset.chakra);
    });
    root.addEventListener('keydown', (event) => {
      const node = event.target.closest('.fw-node');
      if (!node) return;
      const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const nodes = [...root.querySelectorAll('.fw-node')];
      const index = nodes.indexOf(node);
      let next;
      if (event.key === 'Home') next = nodes[0];
      else if (event.key === 'End') next = nodes[nodes.length - 1];
      else {
        const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
        next = nodes[(index + step + nodes.length) % nodes.length];
      }
      if (!next) return;
      next.focus();
      this.selectChakra(next.dataset.chakra);
    });
    root.addEventListener('input', (event) => {
      const input = event.target.closest('#fwWavelength');
      if (!input) return;
      const section = input.closest('.fw-section');
      if (section && typeof section.update === 'function') section.update(input.value);
    });
    root.addEventListener('keydown', (event) => {
      if (!event.target.closest('#fwWavelength')) return;
      if (!event.shiftKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const input = event.target;
      const step = event.key === 'ArrowRight' ? 10 : -10;
      const next = Math.min(780, Math.max(380, Number(input.value) + step));
      input.value = String(next);
      const section = input.closest('.fw-section');
      if (section && typeof section.update === 'function') section.update(next);
    });
  }

  selectChakra(id) {
    const chakra = CHAKREN.find((entry) => entry.id === id);
    if (!chakra) return;
    this.selectedChakra = id;
    for (const node of this.root.querySelectorAll('.fw-node'))
      node.setAttribute('aria-pressed', String(node.dataset.chakra === id));
    const panel = {
      name: this.root.querySelector('#fwChakraName'),
      sanskrit: this.root.querySelector('#fwChakraSanskrit'),
      history: this.root.querySelector('#fwChakraHistory'),
      link: this.root.querySelector('#fwChakraLink'),
    };
    if (panel.name) panel.name.textContent = `${chakra.sanskrit} — ${chakra.name}`;
    if (panel.sanskrit) panel.sanskrit.textContent = `${chakra.meaning} · ${chakra.position}`;
    if (panel.history) panel.history.textContent = chakra.historie;
    const list = this.root.querySelector('#fwChakraPanel .fw-facts');
    if (list) {
      const values = list.querySelectorAll('dd');
      if (values[0]) values[0].textContent = chakra.colorName;
      if (values[1]) values[1].textContent = chakra.themes.join(', ');
      if (values[2]) values[2].textContent = chakra.einordnung;
    }
    if (panel.link) {
      panel.link.href = ROUTE.color(chakra.colorId);
      panel.link.textContent = `Farbwelt ${chakra.colorName} öffnen `;
      const arrow = h('span', { 'aria-hidden': 'true', text: '↗' });
      panel.link.append(arrow);
    }
  }
}
