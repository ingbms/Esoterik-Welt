const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
(async () => {
  const out = path.join(root, 'evidence/t_4f0ebfc2');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, 'initial-status.txt'),
    require('node:child_process').execFileSync('git', ['status', '--short'], { cwd: root })
  );
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const [name, url] of [
      ['file', pathToFileURL(path.join(root, 'index.html')).href],
      ['preview', 'http://localhost:4178/Esoterik-Welt/'],
      ['pages', 'https://ingbms.github.io/Esoterik-Welt/'],
    ]) {
      const page = await browser.newPage({ reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('requestfailed', (req) => errors.push(req.url() + ': ' + req.failure()?.errorText));
      page.on('response', (res) => {
        if (res.status() >= 400) errors.push(res.status() + ' ' + res.url());
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      const metrics = await page.evaluate(() => ({
        url: location.href,
        base: document.baseURI,
        features: document.querySelector('#featureGrid')?.children.length,
        crystals: document.querySelector('#crystalGrid')?.children.length,
        background: getComputedStyle(document.body).backgroundColor,
        modules: Object.keys(window.EsoterikWelt?.state.modules || {}),
      }));
      results.push({ name, metrics, errors });
      console.log(JSON.stringify(results.at(-1), null, 2));
      await page.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, 'baseline.json'), JSON.stringify(results, null, 2));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
