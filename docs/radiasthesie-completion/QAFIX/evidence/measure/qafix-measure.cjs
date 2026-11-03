// Misst die Position des Burgers vor und nach der Kristalle-Initialisierung.
// Die Kristalle-Daten werden verzoegert ausgeliefert, damit beide Zustaende
// deterministisch messbar sind (kein Timing-Zufall).
const path = require('node:path');
const repo = process.env.QAFIX_REPO || 'C:/Users/mas/Arbeit/esow-rad-t_878c59c7';
const { chromium } = require(path.join(repo, 'node_modules', 'playwright'));

const url = process.argv[2] || 'http://127.0.0.1:3399/Esoterik-Welt/#pendeln';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  await page.route('**/data/crystals.json', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const read = () =>
    page.evaluate(() => {
      const toggle = document.getElementById('navToggle');
      const counter = document.getElementById('favCounter');
      return {
        toggleX: Math.round(toggle.getBoundingClientRect().x),
        counter: counter ? Math.round(counter.getBoundingClientRect().width) : null,
        headerChildren: [...document.querySelector('.header-inner').children].map((n) => n.tagName.toLowerCase()),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

  const vorInit = await read();
  release();
  await page.waitForFunction(() => Boolean(window.crystalsModule?.favCounterEl), null, { timeout: 15000 });
  const nachInit = await read();

  console.log(JSON.stringify({ vorInit, nachInit, shift: nachInit.toggleX - vorInit.toggleX }, null, 1));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
