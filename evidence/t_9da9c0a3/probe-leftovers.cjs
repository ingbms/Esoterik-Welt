// Sucht Markdown-Reste und listet Links im gesamten Root je Themenseite.
const { chromium } = require('playwright');

const base = 'http://127.0.0.1:8099/Esoterik-Welt/';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const slug of ['farbtherapie', 'farbpsychologie', 'lichtmedizin']) {
    await page.goto('about:blank');
    await page.goto(`${base}#farbwelten/${slug}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#farbweltenRoot h1'));
    const info = await page.evaluate(() => {
      const root = document.getElementById('farbweltenRoot');
      const leftovers = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode.nodeValue;
        if (/\]\(|\*\*/.test(text)) leftovers.push(text.trim().slice(0, 160));
      }
      return {
        links: [...root.querySelectorAll('a')].map((node) => `${node.textContent.trim().slice(0, 34)} -> ${node.getAttribute('href')}`),
        leftovers,
      };
    });
    console.log(slug, JSON.stringify(info, null, 1));
  }
  await browser.close();
})();
