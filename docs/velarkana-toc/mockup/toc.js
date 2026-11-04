/**
 * VELARKANA · Seiten-Inhaltsverzeichnis — Interaktionsentwurf (Mockup)
 * ---------------------------------------------------------------------
 * NICHT PRODUKTIV. Referenzverhalten für die Spezifikation t_5edc1d8c §6.5
 * und für die Umsetzung in t_3c130426. Abhängigkeitsfrei, idempotent.
 *
 * Grenzen aus der Spezifikation, die dieses Skript einhält:
 *  - kein `preventDefault` auf Ankerlinks, kein eigenes Smooth-Scrolling;
 *    Positionierung und Bewegung übernehmen `scroll-padding-top` und
 *    `scroll-behavior` (CSS);
 *  - genau ein `aria-current="location"`, zusätzlich Klasse `is-active`;
 *  - Scroll-Linie = `--header-height` + 24 px, Aktivierung nach Regel
 *    „letzte Überschrift auf oder oberhalb der Linie“;
 *  - Neuberechnung nach `resize`, `document.fonts.ready` und Wechsel des
 *    `details`-Zustands;
 *  - Mobil (< 1200 px) ist das Disclosure zu, sofern die Nutzerin es nicht
 *    selbst geöffnet hat.
 *
 * Zwei Ergänzungen aus dem Design (dokumentiert in 01-design.md §6):
 *  - Der aktive Eintrag bleibt im Scrollbereich der Liste sichtbar.
 *  - Nach einer Aktivierung erhält die Zielüberschrift den Fokus
 *    (`preventScroll`), damit Tastatur und Screenreader dort weiterlaufen.
 */

const DESKTOP = '(min-width: 1200px)';
const SPY_EXTRA = 24; // Spezifikation §6.5 Nr. 1

function initToc(root) {
  const details = root.querySelector('[data-toc-details]');
  const body = root.querySelector('[data-toc-body]');
  const links = [...root.querySelectorAll('.page-toc__link')];
  if (!details || !body || links.length === 0) return;

  const targets = links
    .map((link) => {
      const id = decodeURIComponent((link.getAttribute('href') || '').replace(/^#/, ''));
      const heading = id ? document.getElementById(id) : null;
      return heading ? { id, heading, link } : null;
    })
    .filter(Boolean);
  if (targets.length === 0) return;

  const mq = window.matchMedia(DESKTOP);
  let userToggled = false;

  const headerHeight = () =>
    Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 100;

  /* --- 1. Ausgangszustand (D-9) ------------------------------------------ */
  const applyViewportState = () => {
    if (mq.matches) {
      if (!details.open) details.open = true;
    } else if (!userToggled) {
      details.open = false;
    }
    updateOverflow();
  };
  applyViewportState();
  mq.addEventListener('change', applyViewportState);

  details.addEventListener('toggle', () => {
    userToggled = details.open;
    // Der Layoutwechsel verschiebt alle Ankerpunkte.
    measure();
    onScroll();
    updateOverflow();
  });

  /* --- 2. Aktiver Abschnitt (F-5) ---------------------------------------- */
  let offsets = [];
  const measure = () => {
    offsets = targets.map(({ id, heading }) => ({
      id,
      top: heading.getBoundingClientRect().top + window.scrollY,
    }));
  };

  let lastActive = null;
  const setActive = (id) => {
    if (id === lastActive) return;
    lastActive = id;
    let activeLink = null;
    for (const { id: targetId, link } of targets) {
      if (targetId === id) {
        link.setAttribute('aria-current', 'location');
        link.classList.add('is-active');
        activeLink = link;
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('is-active');
      }
    }
    // Bei langen Verzeichnissen muss der aktive Eintrag im Scrollbereich
    // sichtbar bleiben (gemessen: bei 29 Einträgen lag er sonst 267 px unter
    // der Liste, während der Artikel bei Abschnitt 11 stand).
    if (activeLink && body.clientHeight > 0 && body.scrollHeight > body.clientHeight + 1) {
      const linkBox = activeLink.getBoundingClientRect();
      const bodyBox = body.getBoundingClientRect();
      if (linkBox.top < bodyBox.top || linkBox.bottom > bodyBox.bottom) {
        activeLink.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      }
    }
  };

  const computeActive = () => {
    const line = window.scrollY + headerHeight() + SPY_EXTRA;
    let activeId = offsets.length ? offsets[0].id : null;
    for (const item of offsets) {
      if (item.top <= line + 1) activeId = item.id;
      else break;
    }
    // Am Dokumentende gewinnt der letzte Abschnitt (Nr. 4).
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom && offsets.length) activeId = offsets[offsets.length - 1].id;
    return activeId;
  };

  // Deep-Link: Eintrag ist sofort aktiv und bleibt es, bis eine echte
  // Scrollbewegung einsetzt (Nr. 5).
  let spyLockedUntil = 0;

  let scheduled = false;
  const runActive = () => {
    if (!scheduled) return;
    scheduled = false;
    if (Date.now() < spyLockedUntil) return;
    const id = computeActive();
    if (id) setActive(id);
    updateOverflow();
  };
  const onScroll = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(runActive);
    // Fallback: in Hintergrund-Tabs werden rAF-Rückrufe gedrosselt oder ausgesetzt.
    window.setTimeout(runActive, 120);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener(
    'resize',
    () => {
      measure();
      onScroll();
    },
    { passive: true },
  );
  window.addEventListener('hashchange', () => {
    spyLockedUntil = 0;
    markHashTarget();
    onScroll();
  });

  /* --- 3. Aktivierung: nur Begleitverhalten, kein Eingriff ins Scrollen --- */
  root.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('.page-toc__link') : null;
    if (!link) return;
    // Panel vor der Standardaktion schließen, damit der Ankersprung die
    // endgültige Layoutlage trifft (sonst landet das Ziel um Panelhöhe daneben).
    if (!mq.matches) details.open = false;
    const id = decodeURIComponent((link.getAttribute('href') || '').replace(/^#/, ''));
    const target = document.getElementById(id);
    if (!target) return;
    window.setTimeout(() => {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }, 0);
  });

  /* --- 4. Scroll-Hinweis -------------------------------------------------- */
  function updateOverflow() {
    const scrollable = body.scrollHeight > body.clientHeight + 1;
    if (!scrollable) {
      body.removeAttribute('data-overflow');
      return;
    }
    const atTop = body.scrollTop <= 1;
    const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
    body.dataset.overflow = atTop ? 'bottom' : atEnd ? 'top' : 'both';
  }
  body.addEventListener('scroll', updateOverflow, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(updateOverflow).observe(body);
    const scope = document.querySelector('[data-toc-scope]');
    if (scope) {
      new ResizeObserver(() => {
        measure();
        onScroll();
      }).observe(scope);
    }
  }

  /* --- 5. Hash-Ziel markieren -------------------------------------------- */
  const markHashTarget = () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return false;
    if (!targets.some((t) => t.id === id)) return false;
    setActive(id);
    return true;
  };

  /* --- 6. Start ----------------------------------------------------------- */
  measure();
  if (window.location.hash && markHashTarget()) {
    spyLockedUntil = Date.now() + 700;
  } else {
    setActive(computeActive());
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measure();
      onScroll();
    });
  }
}

for (const root of document.querySelectorAll('[data-toc]')) initToc(root);
