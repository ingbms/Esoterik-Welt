/** Sonde 5: Sweep-Fortschritt im Accessibility-Baum während eines laufenden Sweeps. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3333/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_4a8106de/probe5.json';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('DOM.enable');
await cdp.send('Accessibility.enable');
await page.goto(`${baseUrl}/#frequenzen/labor`, { waitUntil: 'networkidle' });
await page.waitForSelector('#fqSweepStart', { timeout: 20000 });

async function ax(selector) {
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const found = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector });
  if (!found.nodeId) return { selector, error: 'not found' };
  const tree = await cdp.send('Accessibility.getPartialAXTree', { nodeId: found.nodeId, fetchRelatives: false });
  const n = (tree.nodes || [])[0] || {};
  return {
    selector,
    role: n.role && n.role.value,
    name: n.name && n.name.value,
    value: n.value && n.value.value,
    ignored: Boolean(n.ignored),
    properties: Object.fromEntries(
      (n.properties || [])
        .filter((p) => ['valuemin', 'valuemax', 'valuenow', 'valuetext', 'disabled', 'live'].includes(p.name))
        .map((p) => [p.name, p.value && p.value.value])
    ),
  };
}

await page.fill('#fqSweepSeconds', '6');
await page.fill('#fqSweepFrom', '200');
await page.fill('#fqSweepTo', '2000');
await page.click('#fqSweepStart');
await page.waitForTimeout(1500);

const result = {
  duringSweep: {
    progress: await ax('#fqSweepProgress'),
    cancel: await ax('#fqSweepCancel'),
    status: await ax('#fqStatus'),
    statusText: await page.textContent('#fqStatus'),
    wrapHidden: await page.evaluate(() => document.getElementById('fqSweepWrap').hidden),
  },
};
await page.click('#fqSweepCancel');
await page.waitForTimeout(600);
result.afterCancel = {
  statusText: await page.textContent('#fqStatus'),
  progress: await ax('#fqSweepProgress'),
  wrapHidden: await page.evaluate(() => document.getElementById('fqSweepWrap').hidden),
};
await browser.close();
fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
process.exit(0);
