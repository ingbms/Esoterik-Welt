/* Breiten der Hauptelemente je Werkzeug bei 1440/768/375 prüfen. */
'use strict';
const path = require('node:path');
const { spawn } = require('node:child_process');
const MOCKUP = path.resolve(__dirname, '..', 'mockup', 'index.html');
const PORT = 9341;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let id = 0;
const pend = new Map();

(async () => {
  const dir = 'C:/Users/mas/AppData/Local/hermes/cache/scratch/chrome-w-' + Date.now();
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + dir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let v;
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); if (r.ok) { v = await r.json(); break; } } catch {}
    await sleep(200);
  }
  const ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res, { once: true }));
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
  const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const { result: t } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: a } = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  const sid = a.sessionId;
  await send('Page.enable', {}, sid);
  await send('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, sid);

  for (const tool of ['simulator', 'studio', 'experiment', 'journal']) {
    for (const width of [1440, 768, 375]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
      await send('Page.navigate', { url: 'file:///' + MOCKUP.replace(/\\/g, '/') + '?tool=' + tool + '&w=' + width + '&cb=' + Date.now() }, sid);
      await sleep(700);
      const r = await send('Runtime.evaluate', {
        expression: `(() => {
          const w = (sel) => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); };
          return { main: w('.rad-ws-main:not([hidden])'), grid: w('.rad-ws-grid:not([hidden])'), figure: w('.rad-ws-stage:not([hidden])'), instrument: w('.rad-lab-stage, .rad-studio-plate, .rad-exp-stage'), chart: w('.rad-lab-chart svg'), readout: w('.rad-ws-readout'), panel: w('.rad-ws-panel:not([hidden])'), list: w('.rad-journal-list'), figcaptionH: w('.rad-ws-stage figcaption') };
        })()`, returnByValue: true
      }, sid);
      console.log(tool, width, JSON.stringify(r.result.result.value));
    }
  }
  chrome.kill();
  process.exit(0);
})();
