'use strict';
/* Zusammensetzung des Journal-Panels: welche Blöcke ergeben die gemessene Höhe?
   Hintergrund: Die Doku führt 1154 px (320 px), die Messung 1406 px — Differenz
   252 px. Dieses Skript listet die sichtbaren Kinder mit Höhe auf. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const MOCKUP = 'C:/Users/mas/Arbeit/esow-rad-t_878c59c7/docs/radiasthesie-completion/RAD-04/mockup/index.html';
const OUTJ = 'C:/Users/mas/Arbeit/esow-rad-t_878c59c7/docs/radiasthesie-completion/RAD-04/messung/diag/journal-panel.json';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9339;
const SCRATCH = 'C:/Users/mas/AppData/Local/hermes/cache/scratch';

class CDP {
  constructor(ws) { this.ws = ws; this.seq = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id);
        if (m.error) reject(new Error(m.error.message)); else resolve(m.result); } }); }
  send(method, params = {}, sessionId) { const id = ++this.seq; const p = { id, method, params }; if (sessionId) p.sessionId = sessionId;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify(p)); }); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(url) { for (let i = 0; i < 100; i++) { try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {} await sleep(150); } throw new Error('CDP nicht erreichbar'); }

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + path.join(SCRATCH, 'chrome-rad04-panel-' + Date.now()),
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
  process.on('exit', () => { try { chrome.kill(); } catch {} });
  const v = await waitFor('http://127.0.0.1:' + PORT + '/json/version');
  const ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  const cdp = new CDP(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  const evaluate = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sessionId); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };

  const out = { generatedAt: new Date().toISOString(), widths: {} };
  for (const width of [320, 1440]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    const url = 'file:///' + MOCKUP + '?tool=journal&state=liste&w=' + width + '&cb=' + Date.now();
    await cdp.send('Page.navigate', { url }, sessionId);
    await sleep(800);
    out.widths[width] = await evaluate(`(() => {
      const vis = (el) => { const s = getComputedStyle(el); return !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0; };
      const panel = [...document.querySelectorAll('.rad-ws-panel')].find(vis);
      const pb = panel.getBoundingClientRect();
      const kids = [...panel.children].filter(vis).map((el) => {
        const b = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), cls: el.className, h: Math.round(b.height), txt: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60) };
      });
      const pcs = getComputedStyle(panel);
      return {
        panelH: Math.round(pb.height), padding: pcs.padding, rowGap: pcs.rowGap, display: pcs.display,
        docH: Math.round(document.documentElement.scrollHeight),
        children: kids, sumChildren: kids.reduce((a, k) => a + k.h, 0)
      };
    })()`);
  }
  fs.writeFileSync(OUTJ, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
})().catch((e) => { console.error('FEHLER:', e.message); process.exit(1); });
