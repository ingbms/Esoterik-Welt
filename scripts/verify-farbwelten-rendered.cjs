// Farbwelten — Nachweis im tatsächlich gerenderten Modul (Browser).
//
// Prüft je Route den sichtbaren Text: S16-Vorgabetext, vollständige Quellen
// (Register statt Kurzverweis), bestätigte Korrekturen (B1/B4/B6/N7/N8) und
// das Fehlen wörtlicher roter Aussagen.
//
// Aufruf:
//   node scripts/verify-farbwelten-rendered.cjs [base-url] [--json datei]
// Standard-base: http://127.0.0.1:8099/index.html
// Voraussetzung: gebaute Seite (dist/Esoterik-Welt) wird unter dieser URL
// ausgeliefert; die Routen sind Hash-Routen.

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base = (
  process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://127.0.0.1:8099/index.html'
).replace(/#.*$/, '');
const jsonIndex = process.argv.indexOf('--json');
const jsonTarget = jsonIndex >= 0 ? process.argv[jsonIndex + 1] : null;

const COLOURS = [
  'rot',
  'orange',
  'gelb',
  'gruen',
  'tuerkis',
  'blau',
  'indigo',
  'violett',
  'magenta',
  'rosa',
  'weiss',
  'schwarz',
];
// Farben ohne Wellenlänge: im gerenderten Text darf keine Messwertzeile
// erscheinen, dafür das Typ-Label.
const OHNE_WELLENLAENGE = {
  magenta: 'nicht spektral',
  rosa: 'nicht spektral',
  weiss: 'Neutralfarbe',
  schwarz: 'Neutralfarbe',
};
// Themenseiten (FW-10/FW-11): eigene Seiten ohne A–H-Skelett.
const TOPICS = [
  { id: 'farbtherapie', hash: '#farbwelten/farbtherapie' },
  { id: 'farbpsychologie', hash: '#farbwelten/farbpsychologie' },
  { id: 'lichtmedizin', hash: '#farbwelten/lichtmedizin' },
];
const ROUTES = [
  { id: 'farbwelten', hash: '#farbwelten' },
  ...COLOURS.map((id) => ({ id, hash: `#farbwelten/${id}` })),
  { id: 'chakren', hash: '#farbwelten/chakren' },
  { id: 'lichtfrequenzen', hash: '#farbwelten/lichtfrequenzen' },
  ...TOPICS.map((topic) => ({ ...topic, topic: true })),
];

const DISCLAIMER =
  'Diese Inhalte ersetzen keine medizinische Diagnose oder Behandlung. Bei gesundheitlichen Beschwerden wenden Sie sich an eine medizinische Fachkraft. Farbtherapie als Krankheitsbehandlung ist medizinisch nicht belegt [9].';

const FORBIDDEN = [
  /heilt die Schilddrüse/i,
  /öffnet das dritte Auge/i,
  /Violett heilt/i,
  /Rot heilt/i,
  /Grün heilt das Herz/i,
  /Organfrequenz/i,
  /Weitere Kurzverweise/,
];

const normalise = (text) => text.replace(/\s+/g, ' ').trim();

const failures = [];
const results = [];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  for (const route of ROUTES) {
    await page.goto(`${base}${route.hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const text = normalise(await page.locator('body').innerText());
    const headings = await page.locator('h1:visible').count();
    const quellenItems = await page.locator('#quellen .fw-sources > li').count();
    const sourceIds = await page
      .locator('#quellen .fw-sources > li')
      .evaluateAll((nodes) => nodes.map((node) => node.id.replace('quelle-', '')));
    // Die Bibliografie rendert Label und Link getrennt: DOI/URL stehen im href.
    const sourceLinks = await page
      .locator('#quellen .fw-sources a')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') || ''));
    const linkIndex = sourceLinks.join(' ');
    const registerRows = await page.locator('#farbweltenRoot .fw-register__row').count();
    const offAxisLinks = await page.locator('#farbweltenRoot .fw-spectrum__offaxis a[href^="#farbwelten/"]').count();

    const entry = { route: route.id, h1: headings, quellenItems, sourceIds, failures: [] };
    const record = (message) => {
      entry.failures.push(message);
      failures.push(`${route.id}: ${message}`);
    };

    if (headings !== 1) record(`${headings} H1 statt 1`);
    if (route.topic) {
      // Die Themenseiten tragen ihren eigenen Health-Disclaimer als letzten
      // Absatz des Quellenabschnitts (Redaktionsstand FW-10/FW-11).
      const paragraphs = await page
        .locator('#farbweltenRoot .fw-topic__quellen p')
        .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
      const last = paragraphs.at(-1) || '';
      if ((last.match(/Health-Disclaimer:/g) || []).length !== 1)
        record(`Health-Disclaimer nicht genau einmal am Seitenende: „${last.slice(0, 60)}“`);
      if (!/medizinische Diagnose oder Behandlung/.test(last))
        record('Health-Disclaimer ohne Hinweis auf medizinische Diagnose/Behandlung');
    } else {
      const disclaimerHits = text.split(DISCLAIMER).length - 1;
      if (disclaimerHits !== 1) record(`S16-Vorgabetext ${disclaimerHits}× statt 1×`);
    }
    if (quellenItems < 5) record(`nur ${quellenItems} gerenderte Quellen`);
    for (const pattern of FORBIDDEN) if (pattern.test(text)) record(`verbotene Aussage ${pattern}`);

    // Jede im Fließtext zitierte Nummer muss als gerenderte Quelle erscheinen.
    const bodyWithoutSources = text.split('Quellen')[0];
    const cited = [...new Set([...bodyWithoutSources.matchAll(/\[(\d{1,2})\]/g)].map((match) => match[1]))];
    const missing = cited.filter((id) => !sourceIds.includes(id));
    if (missing.length) record(`zitiert, nicht gerendert: ${missing.map((id) => `[${id}]`).join(' ')}`);

    if (route.id === 'chakren') {
      if (!text.includes('Element- und Lotosfarben')) record('B4: „Element- und Lotosfarben" fehlt');
      if (text.includes('ohne Farbzuordnung')) record('B4: „ohne Farbzuordnung" steht weiterhin');
    }
    if (route.id === 'indigo') {
      // B6: Der Evidenzabsatz muss gerendert sein, das wörtliche Zitat nicht.
      if (!text.includes('Für eine Heilwirkung von Indigo')) record('B6: Evidenzabsatz fehlt');
      if (/öffnet das dritte Auge/i.test(text)) record('B6: wörtliches Zitat „öffnet das dritte Auge" steht weiterhin');
    }
    if (route.id === 'violett') {
      if (!/\b3\d\d\s*(–|-|bis)\s*\d\d\d\s*nm\b/.test(text)) record('N8: Wellenlängenangabe fehlt');
      if (!/THz/.test(text)) record('N8: Frequenzangabe fehlt');
      if (/Indigo-Bereich|420\s*(–|-|bis)\s*450/.test(text)) record('N7: Indigo-Absatz auf der Violettseite');
    }
    if (route.id === 'rot') {
      // B2: 555-nm-Empfindlichkeitsmaximum und Purkinje-Verschiebung.
      if (!/555\s*nm/.test(text)) record('B2: 555-nm-Maximum fehlt');
      if (!/abnehmendem Licht/.test(text)) record('B2: Purkinje-Verschiebung fehlt');
    }
    if (route.id === 'gelb' || route.id === 'orange') {
      // B3: Spektralbereich statt Mischbereich, Metamerie benannt.
      if (!/Spektralbereich/.test(text)) record('B3: „Spektralbereich" fehlt');
      if (!/Metamer/.test(text)) record('B3: Metamerie fehlt');
    }
    if (route.id === 'blau') {
      // B5: circadiane Wirkung differenziert benannt.
      if (!/circadian/i.test(text)) record('B5: circadiane Einordnung fehlt');
    }
    if (route.id === 'farbwelten') {
      if (registerRows !== COLOURS.length) record(`Register: ${registerRows} Zeilen statt ${COLOURS.length}`);
      if (!text.includes('keine Wellenlänge')) record('Register: Kennzeichnung „keine Wellenlänge" fehlt');
    }
    if (route.id === 'lichtfrequenzen') {
      if (offAxisLinks !== 4) record(`Nichtspektrale Verweise im Explorer: ${offAxisLinks} statt 4`);
      if (!text.includes('380 bis 780 nm')) record('λ-Achse: Bereich 380 bis 780 nm nicht benannt');
    }
    if (OHNE_WELLENLAENGE[route.id]) {
      if (!text.includes(OHNE_WELLENLAENGE[route.id])) record(`Typ-Label „${OHNE_WELLENLAENGE[route.id]}" fehlt`);
      if (!text.includes('keine eigene Wellenlänge')) record('Physik: „keine eigene Wellenlänge" fehlt');
      if (/Wellenlängenbereich\s/.test(text)) record('Physik: Wellenlängenzeile trotz fehlender Wellenlänge');
    }
    if (route.id === 'tuerkis') {
      if (!/490\s*–\s*520\s*nm/.test(text)) record('Türkis: Bereich 490–520 nm fehlt');
      if (!/Konvention/.test(text)) record('Türkis: Kennzeichnung als Konvention fehlt');
    }
    if (COLOURS.includes(route.id)) {
      // B8: korrigierte Kennungen müssen als gerenderter Link erscheinen.
      if (!/10\.1177\/0956797620948810/.test(linkIndex)) record('B8: DOI [4] fehlt in der Bibliografie');
      if (!/10\.3758\/s13423-020-01772-1/.test(linkIndex)) record('B8: DOI [7] fehlt in der Bibliografie');
      if (!/conprueba\.es/.test(linkIndex)) record('B8: OSTEBA-URL [9] fehlt in der Bibliografie');
    }

    results.push(entry);
  }

  if (consoleErrors.length) failures.push(`Konsole: ${consoleErrors.slice(0, 3).join(' | ')}`);

  await browser.close();

  const report = {
    checkedAt: new Date().toISOString(),
    base,
    routes: results,
    consoleErrors,
    failures,
  };
  if (jsonTarget) {
    const target = path.resolve(jsonTarget);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  console.log(`Gerendert geprüft: ${results.length} Routen, ${failures.length} Fehler`);
  for (const failure of failures) console.log(`  FEHLER ${failure}`);
  if (failures.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
