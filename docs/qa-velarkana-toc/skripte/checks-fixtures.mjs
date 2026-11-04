/**
 * Fixture-Prüfungen: doppelte Überschriften, Umlaute, Sonderzeichen,
 * Inline-Markup (SSR-Pfad) und `dynamic`-Modus (AK-I1).
 *
 * Ausgabe: evidence/qa-toc-436eeffb/fixtures-result.json
 */
import { DIST, EVID, launchChromium, startServer, writeJson } from './lib.mjs';

const results = [];
const check = (id, name, ok, detail) => results.push({ id, name, ok: ok === true, detail });

const server = await startServer(DIST);
const browser = await launchChromium();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

/* ---------------- SSR: Duplikate, Umlaute, Sonderzeichen ---------------- */
await page.goto(`${server.base}/__qa__/ssr-duplikate.html`, { waitUntil: 'load' });
await page.waitForTimeout(500);
const ssr = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.page-toc__link')];
  return {
    linkCount: links.length,
    entries: links.map((a, i) => {
      const href = a.getAttribute('href');
      const id = decodeURIComponent(href.slice(1));
      const targets = document.querySelectorAll(`[id="${CSS.escape(id)}"]`);
      const el = targets[0];
      return {
        i,
        href,
        id,
        text: a.textContent.replace(/\s+/g, ' ').trim(),
        targetCount: targets.length,
        targetTag: el ? el.tagName : null,
        targetTop: el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null,
        targetText: el ? el.textContent.replace(/\s+/g, ' ').trim() : null,
        innerHtml: a.innerHTML,
      };
    }),
    nestedLists: document.querySelectorAll('.page-toc__list .page-toc__list').length,
    h3ParentText: document.querySelectorAll('.page-toc__item--3 > a')[0]?.textContent?.trim(),
    current: [...document.querySelectorAll('.page-toc__link[aria-current]')].length,
  };
});
const dupOk = ssr.entries.slice(0, 3).every((e) => e.targetCount === 1) &&
  new Set(ssr.entries.slice(0, 3).map((e) => e.id)).size === 3 &&
  ssr.entries[0].targetTop < ssr.entries[1].targetTop && ssr.entries[1].targetTop < ssr.entries[2].targetTop;
check('FIX-C4', 'drei gleiche Überschriften → drei eigene, auflösende Anker in Dokumentreihenfolge', dupOk, ssr.entries.slice(0, 3));
const umlaut = ssr.entries.find((e) => e.id.startsWith('prüfung'));
check('FIX-UM', 'Umlaut-ID wird unverändert übernommen und löst auf', umlaut && umlaut.targetCount === 1 && umlaut.targetText === 'Prüfung: Umlaute äöü ß', umlaut || null);
const special = ssr.entries.find((e) => e.id.startsWith('sonderzeichen'));
check('FIX-SZ', 'Sonderzeichen/Inline-Markup: Text ohne Markup, Anker löst auf', special && special.targetCount === 1 && special.innerHtml === 'Sonderzeichen »Zitat« &amp; kursiv', special || null);
check('FIX-B6', 'h3 ist eingerückt und dem letzten h2 untergeordnet', ssr.nestedLists === 1 && ssr.h3ParentText === 'Unterpunkt', { nestedLists: ssr.nestedLists, h3ParentText: ssr.h3ParentText });

/* Klick auf jeden Duplikat-Anker: unterschiedliche Ziele ----------------- */
const clicks = [];
for (let i = 0; i < 3; i += 1) {
  await page.goto(`${server.base}/__qa__/ssr-duplikate.html`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const out = await page.evaluate(async (index) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const link = document.querySelectorAll('.page-toc__link')[index];
    link.click();
    await new Promise((r) => setTimeout(r, 400));
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const el = document.getElementById(id);
    return {
      id,
      hash: decodeURIComponent(location.hash.slice(1)),
      top: Math.round(el.getBoundingClientRect().top),
      docTop: Math.round(el.getBoundingClientRect().top + window.scrollY),
      scrollY: Math.round(window.scrollY),
      active: [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href')),
      otherTargets: [...document.querySelectorAll('h2, h3')].filter((h) => h.id === id).length,
    };
  }, i);
  clicks.push(out);
}
const clickOk = clicks.every((c) => c.hash === c.id && c.otherTargets === 1 && c.active.length === 1 && c.active[0] === `#${c.id}`) &&
  new Set(clicks.map((c) => c.docTop)).size === 3;
check('FIX-C4b', 'Klick auf jeden der drei gleichen Einträge springt zum jeweils eigenen Ziel', clickOk, clicks);
await page.screenshot({ path: `${EVID}/fixture-ssr-duplikate.png` });

/* Prozentkodierter Hash auf Umlaut-Ziel -------------------------------- */
await page.goto(`${server.base}/__qa__/ssr-duplikate.html#pr%C3%BCfung-umlaute-%C3%A4%C3%B6%C3%BC-%C3%9F`, { waitUntil: 'load' });
await page.waitForTimeout(500);
const enc = await page.evaluate(() => ({
  top: Math.round(document.getElementById('prüfung-umlaute-äöü-ß').getBoundingClientRect().top),
  active: [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href')),
}));
check('FIX-UM2', 'prozentkodierter Umlaut-Hash aktiviert den richtigen Eintrag', enc.active.length === 1 && enc.active[0] === '#prüfung-umlaute-äöü-ß', enc);

/* ---------------- Dynamic-Modus (AK-I1) -------------------------------- */
await page.goto(`${server.base}/__qa__/dynamic.html`, { waitUntil: 'load' });
await page.waitForTimeout(900);
const dyn = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.page-toc__link')];
  const headings = [...document.querySelectorAll('[data-toc-scope] h2, [data-toc-scope] h3')];
  return {
    links: links.length,
    entries: links.map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim() })),
    headings: headings.map((h) => ({ tag: h.tagName, id: h.id, text: h.textContent.trim() })),
    idDuplicates: (() => {
      const counts = new Map();
      for (const el of document.querySelectorAll('[id]')) counts.set(el.id, (counts.get(el.id) || 0) + 1);
      return [...counts.entries()].filter(([, n]) => n > 1);
    })(),
    current: [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href')),
    dynamicFlag: document.querySelector('aside.page-toc')?.getAttribute('data-toc-dynamic'),
  };
});
const dynIdsOk = dyn.headings.every((h) => h.id) && dyn.idDuplicates.length === 0;
const dynLinksOk = dyn.links === 5 && dyn.entries.every((e, i) => decodeURIComponent(e.href.slice(1)) === dyn.headings[i].id);
check('AK-I1', 'dynamic: Liste aus DOM-Überschriften, fehlende IDs erzeugt, keine Duplikate', dynIdsOk && dynLinksOk, dyn);
check('AK-I1b', 'dynamic: genau ein aktiver Eintrag', dyn.current.length === 1, dyn.current);
const dynClick = await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const link = document.querySelectorAll('.page-toc__link')[2];
  link.click();
  await new Promise((r) => setTimeout(r, 400));
  const id = decodeURIComponent(link.getAttribute('href').slice(1));
  const el = document.getElementById(id);
  return { id, hash: decodeURIComponent(location.hash.slice(1)), top: Math.round(el.getBoundingClientRect().top), active: [...document.querySelectorAll('.page-toc__link[aria-current]')].map((a) => a.getAttribute('href')), scrollY: Math.round(window.scrollY) };
});
check('AK-I1c', 'dynamic: Klick springt zum erzeugten Anker', dynClick.hash === dynClick.id && dynClick.scrollY > 0 && dynClick.top >= 100 && dynClick.top <= 200, dynClick);

/* dynamic: zu wenige Überschriften → Komponente entfernt sich ----------- */
await page.goto(`${server.base}/__qa__/dynamic-min.html`, { waitUntil: 'load' });
await page.waitForTimeout(900);
const dynFew = await page.evaluate(() => ({
  asideExists: !!document.querySelector('aside.page-toc'),
  headingIds: [...document.querySelectorAll('[data-toc-scope] h2')].map((h) => h.id),
  bodyHtml: document.querySelector('[data-toc-scope]')?.innerHTML.slice(0, 60),
}));
check('AK-I2', 'dynamic: unter minHeadings verschwindet das Verzeichnis', dynFew.asideExists === false, dynFew);

check('FIX-CONSOLE', 'keine Konsolenfehler in den Fixtures', errors.length === 0, { errors });

const failed = results.filter((r) => !r.ok);
writeJson('fixtures-result.json', { generatedAt: new Date().toISOString(), results, ssr, clicks, dyn, dynClick, errors });
console.log(`fixture checks: ${results.length}, failed: ${failed.length}`);
for (const f of failed) console.log('FAIL', f.id, JSON.stringify(f.detail).slice(0, 700));
await browser.close();
await server.close();
