/**
 * Browserprüfungen des TOC-Piloten (Desktop 1440×900 und Mobil 390×844).
 *
 * Unabhängig von `scripts/toc/verify-browser.mjs` des Implementierers:
 * eigene Messungen, eigene Assertions, eigene Screenshots.
 *
 * Ausgabe: evidence/qa-toc-436eeffb/browser-desktop.json, browser-mobile.json
 */
import { DIST, EVID, CONTRAST_FN, axTree, ensureDir, launchChromium, startServer, writeJson } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const results = [];
const check = (id, name, ok, detail) => {
  results.push({ id, name, ok: ok === true, detail });
  return ok === true;
};

ensureDir(EVID);
const server = await startServer(DIST);
const browser = await launchChromium();

/* ======================= Desktop 1440 × 900 ============================== */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
const externalRequests = [];
const failedRequests = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
page.on('request', (r) => {
  const url = r.url();
  if (!url.startsWith(server.base) && !url.startsWith('data:')) externalRequests.push(url);
});
await page.addInitScript(() => {
  window.__cls = 0;
  window.__clsEntries = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__clsEntries.push({
        value: Number(entry.value.toFixed(4)),
        hadRecentInput: entry.hadRecentInput,
        startTime: Math.round(entry.startTime),
        sources: (entry.sources || []).map((s) => (s.node ? `${s.node.nodeName}.${s.node.className || ''}` : '?')),
      });
      if (!entry.hadRecentInput) window.__cls += entry.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });
});

await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const headerHeight = await page.evaluate(() =>
  Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))
);
const metrics = await page.evaluate(() => {
  const aside = document.querySelector('aside.page-toc');
  const nav = document.querySelector('nav[aria-label="Inhaltsverzeichnis"]');
  const links = [...document.querySelectorAll('.page-toc__link')];
  const prose = document.querySelector('.page-body--toc > .prose');
  const body = document.querySelector('[data-toc-body]');
  const details = document.querySelector('[data-toc-details]');
  const summary = document.querySelector('.page-toc__summary');
  const box = (el) => (el ? el.getBoundingClientRect().toJSON() : null);
  return {
    asideCount: document.querySelectorAll('aside.page-toc').length,
    navCount: document.querySelectorAll('nav[aria-label="Inhaltsverzeichnis"]').length,
    allNavLabels: [...document.querySelectorAll('nav')].map((n) => n.getAttribute('aria-label') || n.className),
    linkCount: links.length,
    linkTexts: links.map((a) => a.textContent.replace(/\s+/g, ' ').trim()),
    hrefs: links.map((a) => a.getAttribute('href')),
    asideBox: box(aside),
    navBox: box(nav),
    proseBox: box(prose),
    bodyBox: box(body),
    summaryBox: box(summary),
    summaryDisplay: summary ? getComputedStyle(summary).display : null,
    detailsOpen: details ? details.open : null,
    asideHeight: aside ? aside.getBoundingClientRect().height : null,
    viewport: { w: innerWidth, h: innerHeight },
    docHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    zIndexAside: aside ? getComputedStyle(aside).zIndex : null,
    transitionMax: (() => {
      let max = 0;
      for (const el of [aside, nav, body, ...links]) {
        if (!el) continue;
        const cs = getComputedStyle(el);
        for (const v of [cs.transitionDuration, cs.animationDuration]) {
          if (!v) continue;
          for (const part of v.split(',')) {
            const s = part.trim().endsWith('ms') ? parseFloat(part) / 1000 : parseFloat(part);
            if (Number.isFinite(s)) max = Math.max(max, s);
          }
        }
      }
      return max;
    })(),
    linkHeights: links.map((a) => Number(a.getBoundingClientRect().height.toFixed(2))),
    linkClipping: links.map((a) => ({
      text: a.textContent.replace(/\s+/g, ' ').trim(),
      scrollWidth: a.scrollWidth,
      clientWidth: a.clientWidth,
      textOverflow: getComputedStyle(a).textOverflow,
    })),
    active: [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href')),
    activeCount: document.querySelectorAll('.page-toc__link[aria-current]').length,
    hash: location.hash,
  };
});

/* H3: CLS der Seite nach dem Laden (vor jeder Interaktion) ----------------- */
await page.waitForTimeout(2200);
const clsInitial = await page.evaluate(() => {
  const entries = (window.__clsEntries || []).filter((e) => !e.hadRecentInput);
  return { total: Number(entries.reduce((a, e) => a + e.value, 0).toFixed(4)), entries };
});
check('AK-H3', 'CLS 0 nach dem Laden', clsInitial.total === 0, clsInitial);

/* A1 / F1 / B1 / F2 ------------------------------------------------------- */
check('AK-A1', 'genau ein aside.page-toc und ein nav[aria-label="Inhaltsverzeichnis"]', metrics.asideCount === 1 && metrics.navCount === 1, {
  asideCount: metrics.asideCount,
  navCount: metrics.navCount,
  allNavLabels: metrics.allNavLabels,
});
check('AK-F1', 'genau ein Navigations-Landmark „Inhaltsverzeichnis“ auf der Pilotseite', metrics.navCount === 1, {
  navCount: metrics.navCount,
  labels: metrics.allNavLabels,
});
check('AK-B1', 'exakt 29 Einträge', metrics.linkCount === 29, { linkCount: metrics.linkCount });

const semantics = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Inhaltsverzeichnis"]');
  const lists = [...nav.querySelectorAll('ol')];
  const lis = [...nav.querySelectorAll('li')];
  const anchors = [...nav.querySelectorAll('a')];
  return {
    lists: lists.length,
    lis: lis.length,
    anchors: anchors.length,
    allInsideLi: anchors.every((a) => a.closest('li') !== null),
    roleOverrides: [...nav.querySelectorAll('[role]')].map((el) => el.getAttribute('role')),
    levels: [...nav.querySelectorAll('a')].map((a) => a.closest('li').className.match(/--(\d)/)?.[1] || null),
  };
});

check('AK-F2', 'Listen-Semantik ol > li > a ohne Rollen-Ersatz', semantics.lists === 4 && semantics.lis === 29 && semantics.anchors === 29 && semantics.allInsideLi && semantics.roleOverrides.length === 0, semantics);

/* B6: Verschachtelung, kein Sprung über eine Stufe ------------------------ */
const nesting = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Inhaltsverzeichnis"]');
  const anchors = [...nav.querySelectorAll('a')];
  const infos = anchors.map((a) => {
    const li = a.closest('li');
    const depth = (() => {
      let d = 0;
      let node = li;
      while (node && node !== nav) {
        if (node.tagName === 'LI') d += 1;
        node = node.parentElement;
      }
      return d;
    })();
    return { id: a.getAttribute('href'), depth, tag: (document.getElementById(a.getAttribute('href').slice(1)) || {}).tagName || null };
  });
  let jumps = 0;
  for (let i = 1; i < infos.length; i += 1) if (infos[i].depth - infos[i - 1].depth > 1) jumps += 1;
  return { infos, jumps };
});
check('AK-B6', 'h3 unter vorangehendem h2, kein Sprung über eine Einrückungsstufe', nesting.jumps === 0, {
  jumps: nesting.jumps,
  depths: nesting.infos.map((i) => i.depth).join(','),
});

/* B5: h1/Footer/sr-only nicht enthalten ----------------------------------- */
const excluded = await page.evaluate(() => {
  const texts = [...document.querySelectorAll('.page-toc__link')].map((a) => a.textContent.trim());
  const h1 = document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim();
  const footerHeads = [...document.querySelectorAll('footer h2, footer h3, footer h4')].map((h) => h.textContent.trim());
  const srOnly = [...document.querySelectorAll('.sr-only')].map((el) => el.textContent.replace(/\s+/g, ' ').trim());
  const bad = texts.filter((t) => t === h1 || footerHeads.includes(t) || srOnly.includes(t));
  return { bad, h1, footerHeads, srOnlyCount: srOnly.length };
});
check('AK-B5', 'h1, Footer-Überschriften und sr-only nicht im Verzeichnis', excluded.bad.length === 0, excluded);

/* B7: nicht gekürzt ------------------------------------------------------- */
const clipped = metrics.linkClipping.filter((l) => l.textOverflow.includes('ellipsis') || l.scrollWidth > l.clientWidth + 1);
check('AK-B7', 'kein Eintrag wird abgeschnitten (Volltext, kein ellipsis)', clipped.length === 0, { clipped, sample: metrics.linkClipping.slice(0, 3) });

/* C1: alle Anker lösen zu genau einem Element auf ------------------------ */
const anchors = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.page-toc__link')];
  const out = [];
  for (const a of links) {
    const href = a.getAttribute('href') || '';
    let id = href.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* roh lassen */
    }
    const el = document.getElementById(id);
    const dupCount = el ? document.querySelectorAll(`[id="${CSS.escape(id)}"]`).length : 0;
    out.push({ href, id, found: !!el, dupCount, tag: el ? el.tagName : null, text: el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null });
  }
  return out;
});
const dead = anchors.filter((a) => !a.found || a.dupCount !== 1);
check('AK-C1', '29 Anker lösen zu genau einem Element auf', dead.length === 0 && anchors.length === 29, { dead, count: anchors.length });

/* H6: keine doppelte ID, kein doppeltes Label ---------------------------- */
const idDup = await page.evaluate(() => {
  const counts = new Map();
  for (const el of document.querySelectorAll('[id]')) counts.set(el.id, (counts.get(el.id) || 0) + 1);
  const dups = [...counts.entries()].filter(([, n]) => n > 1);
  const labels = [...document.querySelectorAll('nav[aria-label]')].map((n) => n.getAttribute('aria-label'));
  return { dups, labels };
});
check('AK-H6', 'keine doppelte ID, kein doppeltes nav-Label', idDup.dups.length === 0 && idDup.labels.filter((l) => l === 'Inhaltsverzeichnis').length === 1, idDup);

/* E1: Spaltenbreiten ------------------------------------------------------ */
const gap = metrics.asideBox && metrics.proseBox
  ? Number((metrics.asideBox.left - (metrics.proseBox.left + metrics.proseBox.width)).toFixed(2))
  : null;
const e1ok =
  metrics.asideBox.width >= 240 && metrics.asideBox.width <= 280 &&
  metrics.proseBox.width >= 718 && metrics.proseBox.width <= 722 && gap >= 32;
check('AK-E1', 'Sidebar 240–280 px, Prose 718–722 px, Abstand ≥ 32 px', e1ok, {
  asideWidth: metrics.asideBox.width,
  proseWidth: metrics.proseBox.width,
  gap,
  asideLeft: metrics.asideBox.left,
  proseRight: Number((metrics.proseBox.left + metrics.proseBox.width).toFixed(2)),
});

/* D2: ohne Hash ist der erste Eintrag aktiv ------------------------------- */
check('AK-D2', 'ohne Hash ist der erste Eintrag aktiv', metrics.activeCount === 1 && metrics.active[0] === metrics.hrefs[0], {
  active: metrics.active,
  first: metrics.hrefs[0],
  activeCount: metrics.activeCount,
});

/* Screenshot Start -------------------------------------------------------- */
await page.screenshot({ path: `${EVID}/1440-start.png`, fullPage: false });

/* E2: Sticky nach 1500 px Scroll ----------------------------------------- */
await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
await page.waitForTimeout(400);
const sticky = await page.evaluate(() => {
  const aside = document.querySelector('aside.page-toc');
  const r = aside.getBoundingClientRect();
  const cs = getComputedStyle(aside);
  return { top: Number(r.top.toFixed(2)), height: Number(r.height.toFixed(2)), position: cs.position, alignSelf: cs.alignSelf, stickyOffset: getComputedStyle(aside).top, layoutHeight: document.querySelector('.page-body--toc').getBoundingClientRect().height, scrollY: window.scrollY };
});
const e2ok = Math.abs(sticky.top - (headerHeight + 24)) <= 2 && sticky.position === 'sticky' && sticky.height < sticky.layoutHeight;
check('AK-E2', 'Sticky-Oberkante = headerHeight + 24 ± 2, nicht gestreckt', e2ok, { headerHeight, sticky });

/* E3: Höhenbudget und eigener Scrollbereich ------------------------------ */
const budget = await page.evaluate(() => {
  const body = document.querySelector('[data-toc-body]');
  const aside = document.querySelector('aside.page-toc');
  return {
    asideHeight: Number(aside.getBoundingClientRect().height.toFixed(2)),
    bodyClient: body.clientHeight,
    bodyScroll: body.scrollHeight,
    overflowY: getComputedStyle(body).overflowY,
    dataOverflow: body.getAttribute('data-overflow'),
    maxAllowed: Number((innerHeight - Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) - 96).toFixed(2)),
  };
});
check('AK-E3a', 'TOC-Höhe ≤ viewportHeight − headerHeight − 96', budget.asideHeight <= budget.maxAllowed, budget);

/* Letzten Eintrag per Tastatur erreichen --------------------------------- */
const lastFocus = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.page-toc__link')];
  const last = links[links.length - 1];
  const body = document.querySelector('[data-toc-body]');
  const before = body.scrollTop;
  last.focus();
  const after = body.scrollTop;
  const lastBox = last.getBoundingClientRect();
  const bodyBox = body.getBoundingClientRect();
  return { before, after, inView: lastBox.top >= bodyBox.top - 1 && lastBox.bottom <= bodyBox.bottom + 1, focusVisible: last.matches(':focus-visible') || document.activeElement === last };
});
check('AK-E3b', 'letzter Eintrag per Tastatur erreichbar und im Scrollbereich sichtbar', lastFocus.inView, lastFocus);

/* E9: Header nicht überdeckt --------------------------------------------- */
const overlap = await page.evaluate(() => {
  const header = document.querySelector('header') || document.querySelector('.site-header');
  const aside = document.querySelector('aside.page-toc');
  const h = header.getBoundingClientRect();
  const a = aside.getBoundingClientRect();
  return {
    headerBottom: Number(h.bottom.toFixed(2)),
    asideTop: Number(a.top.toFixed(2)),
    overlap: h.bottom > a.top + 0.5,
    headerZ: getComputedStyle(header).zIndex,
    asideZ: getComputedStyle(aside).zIndex,
  };
});
check('AK-E9', 'TOC überdeckt den Header nicht', !overlap.overlap && Number(overlap.asideZ) < Number(overlap.headerZ), overlap);

/* D3 / D4: Scroll-Spy ---------------------------------------------------- */
const spy = await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
  const links = [...document.querySelectorAll('.page-toc__link')];
  const targets = links.map((a) => ({ id: decodeURIComponent(a.getAttribute('href').slice(1)), el: document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))) }));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const activeId = () => {
    const cur = document.querySelectorAll('.page-toc__link[aria-current]');
    return { count: cur.length, id: cur[0] ? decodeURIComponent(cur[0].getAttribute('href').slice(1)) : null };
  };
  const out = { samples: [], end: null };
  for (const index of [10, 3, 24]) {
    const el = targets[index].el;
    const top = el.getBoundingClientRect().top + window.scrollY - header - 24;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    await wait(350);
    out.samples.push({ index, expected: targets[index].id, ...activeId() });
  }
  // Dokumentende
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  await wait(400);
  out.end = { expected: targets[targets.length - 1].id, ...activeId() };
  // Aufwärts: von unten zurück zu Eintrag 12
  const el = targets[12].el;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header - 24, behavior: 'instant' });
  await wait(350);
  out.up = { index: 12, expected: targets[12].id, ...activeId() };
  // Zwischenposition: 40 % zwischen Eintrag 5 und 6
  const a = targets[5].el;
  const b = targets[6].el;
  const ta = a.getBoundingClientRect().top + window.scrollY;
  const tb = b.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: ta + (tb - ta) * 0.4 - header - 24, behavior: 'instant' });
  await wait(350);
  out.between = { expected: targets[5].id, ...activeId() };
  return out;
});
const spyOk = spy.samples.every((s) => s.id === s.expected && s.count === 1) && spy.end.id === spy.end.expected && spy.end.count === 1 && spy.up.id === spy.up.expected && spy.between.id === spy.between.expected;
check('AK-D1/D3/D4', 'Scroll-Spy abwärts, aufwärts, zwischen Abschnitten, Dokumentende; genau ein aria-current', spyOk, spy);

/* Screenshot sticky ------------------------------------------------------- */
await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
await page.waitForTimeout(300);
await page.screenshot({ path: `${EVID}/1440-sticky-aktiv.png` });

/* D5: Deep-Link ----------------------------------------------------------- */
await page.goto(`${server.base}${PILOT}#6-einzelpr%C3%BCfungen`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
const deep = await page.evaluate(() => {
  const id = '6-einzelprüfungen';
  const el = document.getElementById(id);
  const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
  const top = el.getBoundingClientRect().top;
  const cur = [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href'));
  return { top: Number(top.toFixed(2)), header, windowOk: top >= header + 4 && top <= header + 40, current: cur, href: location.hash };
});
check('AK-D5', 'Deep-Link: Ziel im Fenster [header+4, header+40], Eintrag sofort aktiv', deep.windowOk && deep.current.length === 1 && deep.current[0] === '#6-einzelprüfungen', deep);

/* C6: prozentkodiert vs. roh --------------------------------------------- */
const encTop = deep.top;
await page.goto(`${server.base}${PILOT}#6-einzelprüfungen`, { waitUntil: 'load' });
await page.waitForTimeout(500);
const raw = await page.evaluate(() => {
  const el = document.getElementById('6-einzelprüfungen');
  const cur = [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href'));
  return { top: Number(el.getBoundingClientRect().top.toFixed(2)), current: cur, href: location.hash };
});
check('AK-C6', 'prozentkodierter und roher Hash landen am selben Ziel und markieren denselben Eintrag', Math.abs(raw.top - encTop) <= 2 && raw.current.length === 1 && raw.current[0] === '#6-einzelprüfungen', { encTop, raw });

/* D6: hashchange ohne Reload --------------------------------------------- */
const hashchange = await page.evaluate(async () => {
  const before = [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href'));
  const target = document.querySelectorAll('.page-toc__link')[20];
  const href = target.getAttribute('href');
  location.hash = href; // echter Hash-Wechsel: Scroll + hashchange
  await new Promise((r) => setTimeout(r, 900));
  const after = [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href'));
  return { before, href, after, hash: location.hash };
});
check('AK-D6', 'hashchange ohne Reload aktualisiert die Aktivierung', hashchange.after.length === 1 && hashchange.after[0] === hashchange.href && hashchange.before[0] !== hashchange.href, hashchange);

/* Klick auf Eintrag: Ziel, Hash, Fokus ------------------------------------ */
await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.waitForTimeout(400);
const clickResult = await page.evaluate(async () => {
  const link = document.querySelectorAll('.page-toc__link')[9];
  const id = decodeURIComponent(link.getAttribute('href').slice(1));
  link.click();
  await new Promise((r) => setTimeout(r, 700));
  const el = document.getElementById(id);
  const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
  const top = el.getBoundingClientRect().top;
  return {
    id,
    hash: location.hash,
    top: Number(top.toFixed(2)),
    header,
    windowOk: top >= header + 4 && top <= header + 60,
    activeElement: document.activeElement ? `${document.activeElement.tagName}#${document.activeElement.id}` : null,
    current: [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href')),
  };
});
check('AK-D5b', 'Klick auf Eintrag: richtige Position, Hash gesetzt, Ziel fokussiert', clickResult.windowOk && clickResult.hash.length > 1 && clickResult.current[0] === `#${clickResult.id}` && clickResult.activeElement === `H3#${clickResult.id}`, clickResult);

/* Tastatur: 29 Links in Reihenfolge, Fokusring ---------------------------- */
await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.evaluate(() => {
  document.activeElement?.blur();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.body.focus();
});
const tabOrder = [];
for (let i = 0; i < 90; i += 1) {
  await page.keyboard.press('Tab');
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { tag: 'BODY' };
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: el.className && typeof el.className === 'string' ? el.className : '',
      href: el.getAttribute ? el.getAttribute('href') : null,
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      outlineStyle: cs.outlineStyle,
      boxShadow: cs.boxShadow,
    };
  });
  tabOrder.push(info);
}
const tocTabbed = tabOrder.filter((t) => typeof t.cls === 'string' && t.cls.includes('page-toc__link'));
const focusRing = tocTabbed[0];
check('AK-F3a', 'Tab erreicht alle 29 TOC-Links in Dokumentreihenfolge', tocTabbed.length === 29 && tocTabbed.every((t, i) => t.href === metrics.hrefs[i]), {
  count: tocTabbed.length,
  order: tocTabbed.map((t) => t.href).slice(0, 5),
  expected: metrics.hrefs.slice(0, 5),
});
check('AK-F3b', 'sichtbarer Fokusring ≥ 2 px', focusRing && parseFloat(focusRing.outlineWidth) >= 2 && focusRing.outlineStyle !== 'none', focusRing || null);

/* F4: Kontraste ----------------------------------------------------------- */
await page.addScriptTag({ content: CONTRAST_FN });
const contrast = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.page-toc__link')];
  const normal = links.map((a) => window.__qaContrast(a));
  const activeLink = document.querySelector('.page-toc__link[aria-current]') || links[0];
  activeLink.setAttribute('aria-current', 'location');
  const active = window.__qaContrast(activeLink);
  const hoverTarget = links[5];
  const title = document.querySelector('.page-toc__title');
  const ring = getComputedStyle(links[0]);
  return {
    normal: normal.map((n) => n.ratio),
    normalMin: Math.min(...normal.map((n) => n.ratio)),
    active,
    title: window.__qaContrast(title),
    ringColor: ring.outlineColor,
    ringStyle: ring.outlineWidth,
    sample: normal[0],
  };
});
const focusRingContrast = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.page-toc__link')];
  links[3].focus();
  const cs = getComputedStyle(links[3]);
  const bg = window.__qaContrast(links[3]);
  // Kontrast der Ringfarbe gegen den Untergrund
  const probe = document.createElement('span');
  probe.style.color = cs.outlineColor;
  document.body.appendChild(probe);
  const ringColor = getComputedStyle(probe).color;
  probe.remove();
  return { outlineColor: cs.outlineColor, outlineWidth: cs.outlineWidth, textBg: bg.bg, ringColor };
});
const e4ok = contrast.normalMin >= 4.5 && contrast.active.ratio >= 4.5 && contrast.title.ratio >= 4.5;
check('AK-F4', 'Kontrast Linktext/aktiv ≥ 4,5:1 (Dark)', e4ok, contrast);

/* Light-Reserve ----------------------------------------------------------- */
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
await page.waitForTimeout(200);
const lightContrast = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.page-toc__link')];
  const normal = links.map((a) => window.__qaContrast(a));
  const active = window.__qaContrast(document.querySelector('.page-toc__link[aria-current]') || links[0]);
  return { normalMin: Math.min(...normal.map((n) => n.ratio)), active, sample: normal[0] };
});
await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
check('AK-F4b', 'Kontrast ≥ 4,5:1 in der Light-Reserve', lightContrast.normalMin >= 4.5 && lightContrast.active.ratio >= 4.5, lightContrast);

/* F6: Zielgrößen (feiner Zeiger) ------------------------------------------ */
const minLink = Math.min(...metrics.linkHeights);
check('AK-F6a', 'Links ≥ 24 px hoch (feiner Zeiger)', minLink >= 24, { minLink, maxLink: Math.max(...metrics.linkHeights) });

/* F5: reduced motion ------------------------------------------------------ */
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(400);
const reduced = await page.evaluate(() => {
  const aside = document.querySelector('aside.page-toc');
  const body = document.querySelector('[data-toc-body]');
  const cs = getComputedStyle(document.documentElement);
  const transitions = [aside, body, document.querySelector('.page-toc__link')]
    .filter(Boolean)
    .map((el) => getComputedStyle(el).transitionDuration);
  return { scrollBehavior: cs.scrollBehavior, transitions, scrollPaddingTop: cs.scrollPaddingTop };
});
check('AK-F5', 'prefers-reduced-motion: reduce → scroll-behavior auto, keine erzwungene Bewegung', reduced.scrollBehavior === 'auto' && reduced.transitions.every((t) => t.split(',').every((part) => parseFloat(part) < 0.01)), reduced);
await page.emulateMedia({ reducedMotion: 'no-preference' });

/* E8: Druck --------------------------------------------------------------- */
await page.emulateMedia({ media: 'print' });
const print = await page.evaluate(() => {
  const aside = document.querySelector('aside.page-toc');
  return { display: getComputedStyle(aside).display };
});
await page.emulateMedia({ media: 'screen' });
check('AK-E8', 'im Druck ist das TOC ausgeblendet', print.display === 'none', print);

/* E6: Umschaltpunkt 1200 / 1199 ------------------------------------------ */
const breakpoint = {};
for (const width of [1440, 1200, 1199, 1024]) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(350);
  breakpoint[width] = await page.evaluate(() => {
    const aside = document.querySelector('aside.page-toc');
    const prose = document.querySelector('.page-body--toc > .prose');
    const details = document.querySelector('[data-toc-details]');
    const a = aside.getBoundingClientRect();
    const p = prose.getBoundingClientRect();
    return {
      asideLeft: Number(a.left.toFixed(1)),
      asideTop: Number(a.top.toFixed(1)),
      proseLeft: Number(p.left.toFixed(1)),
      proseTop: Number(p.top.toFixed(1)),
      sideBySide: a.left > p.left + p.width - 1,
      above: a.top < p.top,
      detailsOpen: details.open,
      asideWidth: Number(a.width.toFixed(1)),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      docScrollWidth: document.documentElement.scrollWidth,
    };
  });
  await page.screenshot({ path: `${EVID}/${width}-layout.png` });
}
const e6ok =
  breakpoint[1200].sideBySide && !breakpoint[1199].sideBySide && breakpoint[1199].above && breakpoint[1024].above &&
  !breakpoint[1200].overflowX;
check('AK-E6', 'Umschaltung genau bei 1200 px, keine Überlappung, kein Überlauf', e6ok, breakpoint);

/* Klicks bei 1199 (Inline-Disclosure) ------------------------------------- */
await page.setViewportSize({ width: 1199, height: 900 });
await page.waitForTimeout(300);
const inlineState = await page.evaluate(async () => {
  const details = document.querySelector('[data-toc-details]');
  const summary = document.querySelector('.page-toc__summary');
  const before = details.open;
  summary.click();
  await new Promise((r) => setTimeout(r, 250));
  const afterOpen = details.open;
  const summaryHeight = Number(summary.getBoundingClientRect().height.toFixed(1));
  const body = document.querySelector('[data-toc-body]');
  const overhead = Number(body.getBoundingClientRect().height.toFixed(1));
  summary.click();
  await new Promise((r) => setTimeout(r, 250));
  return { before, afterOpen, afterClose: details.open, summaryHeight, bodyHeightOpen: overhead };
});
check('AK-E4b', '1199 px: Inline-Disclosure schließt/öffnet, Summary 44 px', inlineState.before === false && inlineState.afterOpen === true && inlineState.afterClose === false && inlineState.summaryHeight >= 44, inlineState);
await page.screenshot({ path: `${EVID}/1199-inline.png` });

/* Kontext für AX und axe wieder auf 1440 × 900 mit offenem TOC ------------ */
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

const perf = await page.evaluate(() => ({
  cls: window.__cls,
  entries: (window.__clsEntries || []).filter((e) => !e.hadRecentInput),
  detailsOpen: document.querySelector('[data-toc-details]').open,
  resources: performance.getEntriesByType('resource').map((r) => r.name.replace(location.origin, '')).filter((n) => /\.(js|css)(\?|$)/.test(n)),
}));
check('AK-H4b', 'keine Konsolenfehler, keine fehlgeschlagenen oder externen Requests', consoleErrors.length === 0 && failedRequests.length === 0 && externalRequests.length === 0, {
  consoleErrors,
  failedRequests,
  externalRequests,
  scriptCss: perf.resources,
});

/* AX-Baum (Screenreader-Grundlage) --------------------------------------- */
const nodes = await axTree(page);
const byId = new Map(nodes.map((n) => [n.nodeId, n]));
const navNodes = nodes.filter((n) => n.role?.value === 'navigation');
const tocNavNode = navNodes.find((n) => n.name?.value === 'Inhaltsverzeichnis');
const descendants = [];
const walkAx = (node) => {
  for (const childId of node.childIds || []) {
    const child = byId.get(childId);
    if (!child) continue;
    descendants.push(child);
    walkAx(child);
  }
};
if (tocNavNode) walkAx(tocNavNode);
const countRole = (role) => descendants.filter((n) => n.role?.value === role).length;
const complementary = nodes.filter((n) => n.role?.value === 'complementary');
const ax = {
  navigation: navNodes.map((n) => n.name?.value),
  tocNav: tocNavNode ? 1 : 0,
  tocNavRoles: { list: countRole('list'), listitem: countRole('listitem'), link: countRole('link') },
  tocLinkNames: descendants.filter((n) => n.role?.value === 'link').map((n) => n.name?.value).slice(0, 3),
  allLinkProperties: [...new Set(descendants.filter((n) => n.role?.value === 'link').flatMap((n) => (n.properties || []).map((p) => p.name)))],
  complementary: complementary.map((n) => n.name?.value),
};
check('AK-F1b', 'AX-Baum: genau ein Navigations-Landmark mit Namen „Inhaltsverzeichnis“', ax.tocNav === 1 && ax.navigation.filter((n) => n === 'Inhaltsverzeichnis').length === 1, ax);
check('AK-F2b', 'AX-Baum: 4 Listen, 29 Listeneinträge, 29 Links im TOC', ax.tocNavRoles.list === 4 && ax.tocNavRoles.listitem === 29 && ax.tocNavRoles.link === 29, ax);

/* axe-core --------------------------------------------------------------- */
const axeSource = (await import('node:fs')).readFileSync(new URL('../../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
await page.addScriptTag({ content: axeSource });
const axeResult = await page.evaluate(async () => {
  const result = await window.axe.run(document.querySelector('.page-toc'), { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] });
  return {
    violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')) })),
    incomplete: result.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    passes: result.passes.length,
  };
});
check('AXE-TOC', 'axe-core (WCAG 2.1 AA) ohne Verstöße im TOC-Teilbaum', axeResult.violations.length === 0, axeResult);

const axePage = await page.evaluate(async () => {
  const result = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
  return {
    violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) })),
  };
});
check('AXE-PAGE', 'axe-core (WCAG 2.1 AA) auf der ganzen Pilotseite ohne Verstöße', axePage.violations.length === 0, axePage);


/* ======================= Mobil 390 × 844 (Touch) ========================= */
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: false });
const mpage = await mctx.newPage();
const mErrors = [];
mpage.on('pageerror', (e) => mErrors.push(e.message));
mpage.on('console', (m) => {
  if (m.type() === 'error') mErrors.push(m.text());
});
await mpage.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await mpage.evaluate(() => document.fonts.ready);
await mpage.waitForTimeout(400);
const mobile = await mpage.evaluate(() => {
  const aside = document.querySelector('aside.page-toc');
  const prose = document.querySelector('.page-body--toc > .prose');
  const details = document.querySelector('[data-toc-details]');
  const summary = document.querySelector('.page-toc__summary');
  const body = document.querySelector('[data-toc-body]');
  const a = aside.getBoundingClientRect();
  const p = prose.getBoundingClientRect();
  const s = summary.getBoundingClientRect();
  return {
    above: a.top < p.top,
    asideTop: Number(a.top.toFixed(1)),
    proseTop: Number(p.top.toFixed(1)),
    detailsOpen: details.open,
    summaryHeight: Number(s.height.toFixed(1)),
    summaryWidth: Number(s.width.toFixed(1)),
    bodyHeight: Number(body.getBoundingClientRect().height.toFixed(1)),
    bodyScrollHeight: body.scrollHeight,
    linkHeights: [...document.querySelectorAll('.page-toc__link')].map((l) => Number(l.getBoundingClientRect().height.toFixed(1))),
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    activeCount: document.querySelectorAll('.page-toc__link[aria-current]').length,
    tocInnerOverflow: body.scrollWidth > body.clientWidth + 1,
  };
});
check('AK-E4', '390 px: TOC oberhalb des Artikels, mit JS geschlossen, Summary ≥ 44 px', mobile.above && mobile.detailsOpen === false && mobile.summaryHeight >= 44, mobile);

/* AX-Name des Aufklappers (Screenreader-Befund) -------------------------- */
const mAxNodes = await axTree(mpage);
const disclosure = mAxNodes.filter((n) => n.role?.value === 'DisclosureTriangle').map((n) => ({
  name: n.name?.value,
  expanded: (n.properties || []).find((p) => p.name === 'expanded')?.value?.value,
}));
check('AX-NAME-SUMMARY', 'Summary-Name enthält kein dekoratives Zeichen', disclosure.every((d) => d && d.name && !/[+–-]\s*$/.test(d.name)), disclosure);
check('AK-F6b', 'Touch: Links ≥ 44 px hoch', Math.min(...mobile.linkHeights) >= 44, { min: Math.min(...mobile.linkHeights), heights: mobile.linkHeights.slice(0, 5) });
check('AK-E5', '390 px: kein zusätzlicher horizontaler Überlauf durch das TOC', mobile.scrollWidth <= 540 && mobile.tocInnerOverflow === false, { scrollWidth: mobile.scrollWidth, baseline: 540, innerOverflow: mobile.tocInnerOverflow });
await mpage.screenshot({ path: `${EVID}/390-zu.png` });

/* Mobil: Öffnen per Summary, Klick springt und schließt ------------------- */
const mobClick = await mpage.evaluate(async () => {
  const details = document.querySelector('[data-toc-details]');
  const summary = document.querySelector('.page-toc__summary');
  summary.click();
  await new Promise((r) => setTimeout(r, 300));
  const opened = details.open;
  const links = [...document.querySelectorAll('.page-toc__link')];
  const link = links[12];
  const id = decodeURIComponent(link.getAttribute('href').slice(1));
  link.click();
  await new Promise((r) => setTimeout(r, 900));
  const el = document.getElementById(id);
  const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
  const top = el.getBoundingClientRect().top;
  return {
    opened,
    closedAfterClick: !details.open,
    id,
    hash: location.hash,
    top: Number(top.toFixed(2)),
    header,
    windowOk: top >= header + 2 && top <= header + 60,
    activeCount: document.querySelectorAll('.page-toc__link[aria-current]').length,
    active: [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href')),
    activeElement: document.activeElement ? `${document.activeElement.tagName}#${document.activeElement.id}` : null,
  };
});
check('AK-E4b2', '390 px: Summary öffnet, Klick springt zum Ziel, Panel schließt', mobClick.opened && mobClick.closedAfterClick && mobClick.windowOk && mobClick.active.length === 1, mobClick);
await mpage.screenshot({ path: `${EVID}/390-nach-klick.png` });

/* Mobil: Summary per Tastatur --------------------------------------------- */
await mpage.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await mpage.waitForTimeout(300);
await mpage.evaluate(() => document.activeElement?.blur());
let summaryTab = null;
for (let i = 0; i < 40; i += 1) {
  await mpage.keyboard.press('Tab');
  const info = await mpage.evaluate(() => {
    const el = document.activeElement;
    return { tag: el?.tagName, cls: typeof el?.className === 'string' ? el.className : '', id: el?.id || '', text: (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
  });
  if (info.cls.includes('page-toc__summary')) {
    summaryTab = info;
    break;
  }
}
const keyboardToggle = { found: !!summaryTab };
if (summaryTab) {
  keyboardToggle.beforeOpen = await mpage.evaluate(() => document.querySelector('[data-toc-details]').open);
  await mpage.keyboard.press('Enter');
  await mpage.waitForTimeout(250);
  keyboardToggle.afterEnter = await mpage.evaluate(() => document.querySelector('[data-toc-details]').open);
  await mpage.keyboard.press('Space');
  await mpage.waitForTimeout(250);
  keyboardToggle.afterSpace = await mpage.evaluate(() => document.querySelector('[data-toc-details]').open);
  keyboardToggle.focusRing = await mpage.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor };
  });
}
check('AK-F3c', 'Mobil: Summary per Tab erreichbar, Enter und Leertaste toggeln', summaryTab && keyboardToggle.afterEnter === true && keyboardToggle.afterSpace === false, keyboardToggle);

/* Mobil: Scroll-Spy bei geöffnetem Panel ---------------------------------- */
await mpage.evaluate(async () => {
  const details = document.querySelector('[data-toc-details]');
  details.open = true;
  await new Promise((r) => setTimeout(r, 200));
  const links = [...document.querySelectorAll('.page-toc__link')];
  const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
  const el = document.getElementById(decodeURIComponent(links[15].getAttribute('href').slice(1)));
  document.documentElement.style.scrollBehavior = 'auto'; // Messung ohne Smooth-Animation
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - header - 24);
  await new Promise((r) => setTimeout(r, 600));
});
const mobSpy = await mpage.evaluate(() => {
  const cur = [...document.querySelectorAll('.page-toc__link[aria-current]')];
  return { count: cur.length, href: cur[0]?.getAttribute('href') || null, scrollY: window.scrollY };
});
check('AK-D3b', 'Mobil: Scroll-Spy markiert Abschnitt 16 (67-432-hz)', mobSpy.count === 1 && mobSpy.href === '#67-432-hz-kleiner-effekt-keine-gesundheitswirkung', mobSpy);
await mpage.screenshot({ path: `${EVID}/390-offen-aktiv.png` });

/* Mobil: 320 px und 200 % Zoom ------------------------------------------- */
const narrow = {};
for (const width of [320, 160]) {
  await mpage.setViewportSize({ width, height: 800 });
  await mpage.waitForTimeout(350);
  narrow[width] = await mpage.evaluate(() => {
    const aside = document.querySelector('aside.page-toc');
    const summary = document.querySelector('.page-toc__summary');
    const link = document.querySelector('.page-toc__link');
    const a = aside.getBoundingClientRect();
    const s = summary.getBoundingClientRect();
    const l = link.getBoundingClientRect();
    return {
      asideLeft: Number(a.left.toFixed(1)),
      asideRight: Number(a.right.toFixed(1)),
      viewport: innerWidth,
      clipped: a.left < -0.5 || a.right > innerWidth + 0.5,
      summaryWidth: Number(s.width.toFixed(1)),
      linkWidth: Number(l.width.toFixed(1)),
      tocHorizontalScrollbar: document.querySelector('[data-toc-body]').scrollWidth > document.querySelector('[data-toc-body]').clientWidth + 1,
      docScrollWidth: document.documentElement.scrollWidth,
      summaryHeight: Number(s.height.toFixed(1)),
    };
  });
  await mpage.screenshot({ path: `${EVID}/${width}-narrow.png` });
}
check('AK-E7', '320 px und 200 % Zoom (160 px CSS): TOC bedienbar, kein Clipping', !narrow[320].clipped && !narrow[160].clipped && !narrow[320].tocHorizontalScrollbar && !narrow[160].tocHorizontalScrollbar, narrow);
check('MOBIL-CONSOLE', 'keine Konsolenfehler mobil', mErrors.length === 0, { errors: mErrors });

/* Abschluss */
await mctx.close();
await ctx.close();
await browser.close();
await server.close();

writeJson('browser-desktop.json', { generatedAt: new Date().toISOString(), viewport: '1440x900', results, metrics: { headerHeight, asideWidth: metrics.asideBox?.width, proseWidth: metrics.proseBox?.width, linkCount: metrics.linkCount, summaryDisplay: metrics.summaryDisplay } });
writeJson('browser-mobile.json', { generatedAt: new Date().toISOString(), viewport: '390x844', results: results.filter((r) => /E4|E5|E7|F3c|F6b|D3b|MOBIL|E6|E8|F4|F5/.test(r.id)), mobile, mobClick, keyboardToggle, mobSpy, narrow, breakpoint });

const failed = results.filter((r) => !r.ok);
console.log(`checks: ${results.length}, failed: ${failed.length}`);
for (const f of failed) console.log('FAIL', f.id, f.name, JSON.stringify(f.detail).slice(0, 600));
