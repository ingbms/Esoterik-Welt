/**
 * No-JS-Fallback (AK-G1–G4): JavaScript aus, Desktop und Mobil.
 * Ausgabe: evidence/qa-toc-436eeffb/nojs.json
 */
import { DIST, EVID, launchChromium, startServer, writeJson } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const results = [];
const check = (id, name, ok, detail) => results.push({ id, name, ok: ok === true, detail });

const server = await startServer(DIST);
const browser = await launchChromium();

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
const page = await ctx.newPage();
await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.waitForTimeout(300);

const initial = await page.evaluate(() => {
  const details = document.querySelector('[data-toc-details]');
  const links = [...document.querySelectorAll('.page-toc__link')];
  const aside = document.querySelector('aside.page-toc');
  return {
    links: links.length,
    detailsOpen: details ? details.open : null,
    ariaCurrent: document.querySelectorAll('[aria-current]').length,
    tocAriaCurrent: document.querySelectorAll('.page-toc__link[aria-current]').length,
    ariaCurrentWhere: [...document.querySelectorAll('[aria-current]')].map((el) => `${el.tagName}.${el.className}:${el.getAttribute('aria-current')}`),
    asideVisible: aside ? getComputedStyle(aside).display !== 'none' : false,
    listVisibleHeight: document.querySelector('[data-toc-body]')?.getBoundingClientRect().height ?? 0,
    summaryDisplay: document.querySelector('.page-toc__summary') ? getComputedStyle(document.querySelector('.page-toc__summary')).display : null,
    tocTitleDisplay: document.querySelector('.page-toc__title') ? getComputedStyle(document.querySelector('.page-toc__title')).display : null,
  };
});
check('AK-G1', 'ohne JavaScript sind alle 29 Links im HTML', initial.links === 29, initial);
check('AK-G4', 'ohne JavaScript kein aria-current im Verzeichnis', initial.tocAriaCurrent === 0, initial);
check('NOJS-1', 'Desktop ohne JS: Liste offen und sichtbar', initial.detailsOpen === true && initial.listVisibleHeight > 0 && initial.asideVisible, initial);
await page.screenshot({ path: `${EVID}/1440-nojs.png` });

/* Klick ohne JS: Ziel unter dem Header (3 Stichproben) -------------------- */
const jumps = [];
for (const index of [3, 12, 25]) {
  await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
  await page.waitForTimeout(200);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const href = await page.evaluate((i) => document.querySelectorAll('.page-toc__link')[i].getAttribute('href'), index);
  await page.click(`.page-toc__link >> nth=${index}`);
  await page.waitForTimeout(500);
  const out = await page.evaluate(() => {
    const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
    const hash = decodeURIComponent(location.hash.slice(1));
    const el = hash ? document.getElementById(hash) : null;
    return {
      hash,
      scrollY: Math.round(window.scrollY),
      top: el ? Math.round(el.getBoundingClientRect().top) : null,
      header,
      belowHeader: el ? el.getBoundingClientRect().top >= header - 1 : false,
      visibleInViewport: el ? el.getBoundingClientRect().top < window.innerHeight : false,
    };
  });
  jumps.push({ index, href, ...out });
}
check('AK-G2', 'ohne JavaScript springen alle Stichproben unter den Header und sind sichtbar', jumps.every((j) => j.belowHeader && j.visibleInViewport && j.scrollY > 0 && decodeURIComponent(j.href.slice(1)) === j.hash), jumps);

/* Mobil ohne JS: Summary öffnet/schließt nativ --------------------------- */
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, hasTouch: true });
const mp = await mctx.newPage();
await mp.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await mp.waitForTimeout(300);
const mobileNoJs = await mp.evaluate(() => ({
  links: document.querySelectorAll('.page-toc__link').length,
  detailsOpen: document.querySelector('[data-toc-details]').open,
  summaryHeight: Math.round(document.querySelector('.page-toc__summary').getBoundingClientRect().height),
  ariaCurrent: document.querySelectorAll('[aria-current]').length,
  scrollWidth: document.documentElement.scrollWidth,
}));
await mp.click('.page-toc__summary');
await mp.waitForTimeout(250);
const closed = await mp.evaluate(() => document.querySelector('[data-toc-details]').open);
await mp.click('.page-toc__summary');
await mp.waitForTimeout(250);
const reopened = await mp.evaluate(() => document.querySelector('[data-toc-details]').open);
check('AK-G3', 'ohne JavaScript öffnet und schließt das Summary die Liste nativ', mobileNoJs.detailsOpen === true && closed === false && reopened === true, { ...mobileNoJs, closed, reopened });
await mp.screenshot({ path: `${EVID}/390-nojs.png` });

/* Mobil ohne JS: Klick springt ------------------------------------------ */
const mjump = await mp.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const link = document.querySelectorAll('.page-toc__link')[8];
  const id = decodeURIComponent(link.getAttribute('href').slice(1));
  return { id };
});
await mp.click('.page-toc__link >> nth=8');
await mp.waitForTimeout(500);
const mtarget = await mp.evaluate((id) => {
  const el = document.getElementById(id);
  const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
  return { top: Math.round(el.getBoundingClientRect().top), header, belowHeader: el.getBoundingClientRect().top >= header - 1, scrollY: Math.round(window.scrollY) };
}, mjump.id);
check('AK-G2b', 'ohne JavaScript (390 px) springt der Link unter den Header', mtarget.belowHeader && mtarget.scrollY > 0, { ...mjump, ...mtarget });

const failed = results.filter((r) => !r.ok);
writeJson('nojs.json', { generatedAt: new Date().toISOString(), results, initial, jumps, mobileNoJs, mtarget });
console.log(`nojs checks: ${results.length}, failed: ${failed.length}`);
for (const f of failed) console.log('FAIL', f.id, JSON.stringify(f.detail).slice(0, 500));
await browser.close();
await server.close();
