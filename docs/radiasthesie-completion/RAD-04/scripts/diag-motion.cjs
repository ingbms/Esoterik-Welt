/* Diagnose: warum läuft die Pendelanimation im Messlauf nicht? */
'use strict';
const path = require('node:path');
const { spawn } = require('node:child_process');
const fs = require('node:fs');

const MOCKUP = path.resolve(__dirname, '..', 'mockup', 'index.html');
const PORT = 9339;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const dir = 'C:/Users/mas/AppData/Local/hermes/cache/scratch/chrome-diag-' + Date.now();
  const chrome = spawn(
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + dir, '--hide-scrollbars', '--no-first-run', 'about:blank'],
    { stdio: 'ignore' }
  );
  let v;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + PORT + '/json/version');
      if (r.ok) { v = await r.json(); break; }
    } catch { /* warte */ }
    await sleep(200);
  }
  const ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res, { once: true }));
  let id = 0;
  const pend = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

  const { result: t } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: a } = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  const sid = a.sessionId;
  await send('Page.enable', {}, sid);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
  await send('Page.navigate', { url: 'file:///' + MOCKUP.replace(/\\/g, '/') + '?tool=simulator&state=laeuft' }, sid);
  await sleep(1200);
  const evalx = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sid);
    if (r.result && r.result.exceptionDetails) return { error: r.result.exceptionDetails };
    return r.result.result ? r.result.result.value : r.result;
  };

  console.log(JSON.stringify(await evalx(`(() => {
    const arm = document.querySelector('.rad-lab-arm');
    const stage = document.querySelector('.rad-lab-stage');
    const s = getComputedStyle(arm);
    const rules = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const rule of list) {
        const text = rule.cssText || '';
        if (/rad-lab-arm|radSwing|rad-lab-stage/.test(text)) rules.push({ href: sheet.href && sheet.href.split('/').pop(), text: text.slice(0, 220) });
        if (rule.cssRules) {
          for (const inner of rule.cssRules) {
            if (/rad-lab-arm|radSwing/.test(inner.cssText || '')) rules.push({ href: sheet.href && sheet.href.split('/').pop(), media: rule.conditionText, text: inner.cssText.slice(0, 220) });
          }
        }
      }
    }
    return {
      dataRunning: stage && stage.getAttribute('data-running'),
      animation: s.animation,
      animationName: s.animationName,
      animationDuration: s.animationDuration,
      transition: s.transition,
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      sheets: [...document.styleSheets].map((x) => x.href && x.href.split('/').slice(-1)[0]),
      rules
    };
  })()`), null, 1));

  chrome.kill();
  process.exit(0);
})();
