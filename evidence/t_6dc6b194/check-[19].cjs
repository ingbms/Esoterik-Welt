// Nachweis [19] über alle betroffenen Farbwelten-Routen:
// keine Altfassung (IARC (2023) / iarc.who.int), Ledger-Fassung im Quellenblock.
const { chromium } = require('playwright');
const fs = require('node:fs');

const base = process.argv[2] || 'http://127.0.0.1:3198/Esoterik-Welt/';
const LEDGER_LABEL = 'IARC 2012, Monographs Vol. 100D Radiation';
const LEDGER_URL =
  'https://publications.iarc.who.int/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Radiation-2012';
const ROUTES = [
  'farbwelten',
  'farbwelten/violett',
  'farbwelten/chakren',
  'farbwelten/lichtfrequenzen',
  'farbwelten/tuerkis',
  'farbwelten/magenta',
  'farbwelten/rosa',
  'farbwelten/weiss',
  'farbwelten/schwarz',
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const rows = [];

  for (const route of ROUTES) {
    await page.goto('about:blank');
    await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => {
      const visible = (el) => el.offsetParent !== null;
      const h1 = [...document.querySelectorAll('h1')].find(visible)?.textContent.trim() || null;
      const bodyText = document.body.innerText;
      const iarcAnchors = [...document.querySelectorAll('a[href*="iarc"]')]
        .filter(visible)
        .map((a) => ({ text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') }));
      const oldDomain = [...document.querySelectorAll('a[href="https://www.iarc.who.int"]')].filter(visible).length;
      const sourceItems = [...document.querySelectorAll('li')]
        .filter((li) => visible(li) && /^\[\d{1,2}\]/.test(li.textContent.trim()))
        .map((li) => {
          const a = li.querySelector('a[href^="http"]');
          return { text: li.textContent.replace(/\s+/g, ' ').trim(), href: a ? a.getAttribute('href') : null };
        });
      return { h1, bodyText, iarcAnchors, oldDomain, sourceItems };
    });

    const iarcSources = data.sourceItems.filter((s) => /IARC/.test(s.text));
    const checks = {
      h1_present: Boolean(data.h1),
      kein_altjahr_im_text: !/IARC \(2023\)/.test(data.bodyText),
      keine_altdomain: data.oldDomain === 0 && !/www\.iarc\.who\.int/.test(data.bodyText),
      iarc_anker_mit_ledger_url: data.iarcAnchors.every((a) => a.href === LEDGER_URL),
      quellenblock_ledger_label: iarcSources.every((s) => s.text.includes(LEDGER_LABEL) && s.href === LEDGER_URL),
      quellenblock_vorhanden: iarcSources.length > 0,
    };
    rows.push({
      route,
      h1: data.h1,
      iarcAnchors: data.iarcAnchors,
      quellenIarc: iarcSources,
      quellenGesamt: data.sourceItems.length,
      checks,
      pass: Object.values(checks).every(Boolean),
    });
  }

  await browser.close();
  fs.writeFileSync('evidence/t_6dc6b194/check-[19].json', JSON.stringify(rows, null, 2));
  for (const r of rows) {
    const fails = Object.entries(r.checks).filter(([, ok]) => !ok).map(([k]) => k);
    console.log(
      `${r.pass ? 'PASS' : 'FAIL'} #${r.route}  H1="${r.h1}"  Quellen=${r.quellenGesamt}  IARC-Links=${r.iarcAnchors.length}` +
        (fails.length ? `  offen: ${fails.join(', ')}` : ''),
    );
  }
  const failed = rows.filter((r) => !r.pass).length;
  console.log(`RESULT: ${rows.length - failed}/${rows.length} Routen PASS, ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
})();
