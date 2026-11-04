/**
 * Automatisches Seiten-Inhaltsverzeichnis — clientseitige Ergänzung.
 *
 * Wird als gebündeltes `<script>` der Komponente `TableOfContents.astro`
 * ausgeliefert. Grenzen und Regeln: `docs/velarkana-toc/spezifikation.md` §6.5
 * (Scroll-Spy) und §6.11 (nur bei `dynamic` werden IDs ergänzt und die Liste
 * neu aufgebaut); Gestaltung: `docs/velarkana-toc/02-komponenten-spezifikation.md`
 * §4.
 *
 * Bewusste Grenzen:
 *  - kein `preventDefault` auf Ankerlinks und kein eigenes Smooth-Scrolling;
 *    Positionierung und Bewegung übernehmen `scroll-padding-top` und
 *    `scroll-behavior` aus `css/design-system.css` (§6.5 Nr. 9);
 *  - genau ein `aria-current="location"`, zusätzlich die Klasse `is-active`;
 *  - ohne `dynamic` liest das Skript keine Überschriften aus dem DOM und
 *    erzeugt keine IDs; die serverseitige Liste bleibt maßgeblich.
 *
 * Der Slug-Algorithmus wird nur im `dynamic`-Pfad nachgeladen (dynamischer
 * Import), damit der Pilot ohne `github-slugger` im Client-Bundle auskommt.
 */

const DESKTOP_QUERY = '(min-width: 1200px)';
/** Abstand der Scroll-Linie unter dem Header (§6.5 Nr. 1). */
const SPY_EXTRA_PX = 24;
/** Überschriften, die kein Verzeichnisziel sind (§6.1 Nr. 3). */
const SKIP_SELECTOR = '.sr-only, [hidden], [aria-hidden="true"], [data-toc-skip]';
const SCOPE_SELECTOR = '[data-toc-scope]';

interface TocTarget {
  id: string;
  heading: HTMLElement;
  link: HTMLAnchorElement;
}

interface TocOffset {
  id: string;
  top: number;
}

/** Fragment einer Anker-URL ohne Prozentkodierung; toleriert defekte URLs. */
function decodeFragment(href: string): string {
  const raw = href.replace(/^#/, '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function readLevels(root: HTMLElement): number[] {
  const raw = root.dataset.tocLevels ?? '';
  const levels = raw
    .split(',')
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value) && value >= 2 && value <= 6);
  return levels.length > 0 ? levels : [2, 3];
}

function readMinHeadings(root: HTMLElement): number {
  const parsed = Number.parseInt(root.dataset.tocMin ?? '', 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 3;
}

/**
 * Baut die Liste aus den Überschriften im Scope neu auf und ergänzt fehlende
 * IDs (§6.11). Die Funktion läuft nur, wenn die Komponente
 * `data-toc-dynamic="true"` gesetzt hat.
 */
async function rebuildFromScope(root: HTMLElement): Promise<boolean> {
  const body = root.querySelector<HTMLElement>('[data-toc-body]');
  const scope = document.querySelector<HTMLElement>(SCOPE_SELECTOR);
  if (!body || !scope) return false;

  const { buildTocTree, flattenToc, normalizeTocText, renderTocList } = await import('../lib/toc');
  const levels = new Set(readLevels(root));

  const elements = [...scope.querySelectorAll<HTMLElement>('h2, h3, h4, h5, h6')].filter((heading) => {
    if (!levels.has(Number.parseInt(heading.tagName.slice(1), 10))) return false;
    // `closest` prüft auch das Element selbst (`sr-only`-Überschriften).
    if (heading.closest(SKIP_SELECTOR)) return false;
    return normalizeTocText(heading.textContent ?? '').length > 0;
  });

  if (elements.length === 0) {
    root.remove();
    return false;
  }

  const existingIds = [...document.querySelectorAll<HTMLElement>('[id]')].map((element) => element.id);
  const headings = elements.map((heading) => ({
    depth: Number.parseInt(heading.tagName.slice(1), 10),
    slug: heading.id,
    text: heading.textContent ?? '',
  }));

  const tree = buildTocTree(
    headings,
    {
      levels: readLevels(root),
      minHeadings: readMinHeadings(root),
      dynamic: true,
    },
    existingIds
  );

  if (!tree) {
    root.remove();
    return false;
  }

  // Ziel und Link erhalten denselben Wert (§6.3 Nr. 2): erst die IDs an die
  // Überschriften schreiben, dann die Liste aus denselben Knoten rendern.
  const nodes = flattenToc(tree.items);
  nodes.forEach((node, index) => {
    const heading = elements[index];
    if (heading && !heading.id) heading.id = node.slug;
  });
  body.innerHTML = renderTocList(tree.items);
  return true;
}

function collectTargets(root: HTMLElement): TocTarget[] {
  const targets: TocTarget[] = [];
  for (const link of root.querySelectorAll<HTMLAnchorElement>('.page-toc__link')) {
    const id = decodeFragment(link.getAttribute('href') ?? '');
    if (!id) continue;
    // `getElementById` statt `querySelector('#…')`: IDs dürfen mit einer Ziffer
    // beginnen (§6.3 Nr. 5).
    const heading = document.getElementById(id);
    if (!heading) continue;
    targets.push({ id, heading, link });
  }
  return targets;
}

async function initToc(root: HTMLElement): Promise<void> {
  if (root.dataset.tocDynamic === 'true') {
    const ready = await rebuildFromScope(root);
    if (!ready) return;
  }

  const details = root.querySelector<HTMLDetailsElement>('[data-toc-details]');
  const body = root.querySelector<HTMLElement>('[data-toc-body]');
  const targets = collectTargets(root);
  if (!details || !body || targets.length === 0) return;

  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  let userToggled = false;

  const headerHeight = (): number =>
    Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 100;

  /* --- Ausgangszustand (D-9, §6.7) -------------------------------------- */
  const applyViewportState = (): void => {
    if (mediaQuery.matches) {
      if (!details.open) details.open = true;
    } else if (!userToggled) {
      details.open = false;
    }
    updateOverflow();
  };

  /* --- Aktiver Abschnitt (§6.5) ----------------------------------------- */
  let offsets: TocOffset[] = [];

  const measure = (): void => {
    offsets = targets.map(({ id, heading }) => ({
      id,
      top: heading.getBoundingClientRect().top + window.scrollY,
    }));
  };

  let lastActive: string | null = null;

  const setActive = (id: string): void => {
    if (id === lastActive) return;
    lastActive = id;
    let activeLink: HTMLAnchorElement | null = null;
    for (const target of targets) {
      if (target.id === id) {
        target.link.setAttribute('aria-current', 'location');
        target.link.classList.add('is-active');
        activeLink = target.link;
      } else {
        target.link.removeAttribute('aria-current');
        target.link.classList.remove('is-active');
      }
    }
    // Bei langen Verzeichnissen bleibt der aktive Eintrag im Scrollbereich
    // sichtbar (Design G-11). Nur bei echtem Überlauf, ohne eigene Animation.
    if (activeLink && body.clientHeight > 0 && body.scrollHeight > body.clientHeight + 1) {
      const linkBox = activeLink.getBoundingClientRect();
      const bodyBox = body.getBoundingClientRect();
      if (linkBox.top < bodyBox.top || linkBox.bottom > bodyBox.bottom) {
        activeLink.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      }
    }
  };

  const computeActive = (): string | null => {
    const line = window.scrollY + headerHeight() + SPY_EXTRA_PX;
    let activeId: string | null = offsets.length > 0 ? offsets[0]!.id : null;
    for (const item of offsets) {
      if (item.top <= line + 1) activeId = item.id;
      else break;
    }
    // Dokumentende: der letzte Abschnitt gewinnt (§6.5 Nr. 4); sonst bliebe
    // die letzte Sektion unerreichbar markiert.
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom && offsets.length > 0) activeId = offsets[offsets.length - 1]!.id;
    return activeId;
  };

  // Deep-Link: der Zieleintrag bleibt aktiv, bis eine echte Scrollbewegung
  // einsetzt (§6.5 Nr. 5).
  let spyLockedUntil = 0;
  let scheduled = false;

  const updateOverflow = (): void => {
    const scrollable = body.scrollHeight > body.clientHeight + 1;
    if (!scrollable) {
      body.removeAttribute('data-overflow');
      return;
    }
    const atTop = body.scrollTop <= 1;
    const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
    body.dataset.overflow = atTop ? 'bottom' : atEnd ? 'top' : 'both';
  };

  const runActive = (): void => {
    if (!scheduled) return;
    scheduled = false;
    if (Date.now() < spyLockedUntil) return;
    const id = computeActive();
    if (id) setActive(id);
    updateOverflow();
  };

  const onScroll = (): void => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(runActive);
    // Fallback: in Hintergrund-Tabs werden rAF-Rückrufe ausgesetzt (§6.5 Nr. 7).
    window.setTimeout(runActive, 120);
  };

  const markHashTarget = (): boolean => {
    const id = decodeFragment(window.location.hash);
    if (!id) return false;
    if (!targets.some((target) => target.id === id)) return false;
    setActive(id);
    return true;
  };

  applyViewportState();
  mediaQuery.addEventListener('change', applyViewportState);

  details.addEventListener('toggle', () => {
    userToggled = details.open;
    measure();
    onScroll();
    updateOverflow();
  });

  const onResize = (): void => {
    measure();
    onScroll();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('hashchange', () => {
    spyLockedUntil = 0;
    markHashTarget();
    onScroll();
  });

  body.addEventListener('scroll', updateOverflow, { passive: true });

  // Aktivierung: nur Begleitverhalten. Auf schmalen Viewports wird das Panel
  // **vor** der Standardaktion geschlossen, damit der Sprung die endgültige
  // Layoutlage trifft (§6.7); danach erhält die Zielüberschrift den Fokus,
  // ohne den Sprung zu stören (Design G-12).
  root.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('.page-toc__link') : null;
    if (!(link instanceof HTMLAnchorElement)) return;
    if (!mediaQuery.matches) details.open = false;
    const id = decodeFragment(link.getAttribute('href') ?? '');
    const target = document.getElementById(id);
    if (!target) return;
    window.setTimeout(() => {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }, 0);
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(updateOverflow).observe(body);
    const scope = document.querySelector<HTMLElement>(SCOPE_SELECTOR);
    if (scope) new ResizeObserver(onResize).observe(scope);
  }

  /* --- Start ------------------------------------------------------------- */
  measure();
  if (window.location.hash && markHashTarget()) {
    spyLockedUntil = Date.now() + 700;
  } else {
    setActive(computeActive() ?? targets[0]!.id);
  }

  // Manrope wird nachgeladen; vor `fonts.ready` misst `72ch` zu schmal
  // (Design F-3), also danach neu messen.
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      measure();
      onScroll();
    });
  }
}

for (const root of document.querySelectorAll<HTMLElement>('[data-toc]')) {
  void initToc(root);
}
