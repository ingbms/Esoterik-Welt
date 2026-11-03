/* ============================================================================
   ESOW-RAD-04 · Nachweis: Fokusindikator im Datumsfeld (Journal, 1440 px)

   Offene Frage aus dem Vorgängerstand: ein Tab-Schritt im Datumsfeld meldet
   `outline: none` (TASTATUR-FOKUS-MOTION.md §6 behauptet, Chrome zeichne dort
   "seinen eigenen Indikator" — dieser Beleg fehlte).

   Dieses Skript beantwortet die Frage mit Pixeln und Wiederholungen:
   - Ruhezustand des Feldes als Ausschnitt (clip, nur der Feldkasten) aufnehmen;
   - 16 Tab-Schritte, bei jedem Schritt im Datumsfeld sofort ein Ausschnitt;
   - Byte-Vergleich Ruhe vs. Schritt: gleiche Bytes => kein sichtbarer
     Unterschied zwischen "nicht fokussiert" und "fokussiert".
   - Drei Runden, weil die Fokuslage im Shadow-Tree nicht in jeder Runde gleich
     ist (beobachtet: Schritt mit `:focus` true und einmal mit `:focus` false).
   - Gegenprobe der Korrektur: Regel `.rad-ws-input:focus-within` zur Laufzeit
     injizieren, gleichen Schritt wiederholen, computed outline + Bild prüfen.

   Aufruf:
     node docs/radiasthesie-completion/RAD-04/scripts/diag-datum-fokus.cjs
   Ergebnis: messung/diag/datum-*.png, messung/diag/datum-fokus.json
   ========================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const MOCKUP = path.join(ROOT, 'mockup', 'index.html');
const OUT = path.join(ROOT, 'messung', 'diag');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9341;
const SCRATCH = 'C:/Users/mas/AppData/Local/hermes/cache/scratch';

fs.mkdirSync(OUT, { recursive: true });

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }
      }, 30000);
    });
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(url, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch { /* noch nicht */ }
    await sleep(150);
  }
  throw new Error('Chrome DevTools nicht erreichbar: ' + url);
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(SCRATCH, 'chrome-rad04-datum-' + Date.now()),
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', '--hide-scrollbars',
    '--force-device-scale-factor=1', 'about:blank'
  ], { stdio: 'ignore' });
  process.on('exit', () => { try { chrome.kill(); } catch { /* egal */ } });

  const version = await waitFor('http://127.0.0.1:' + PORT + '/json/version');
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const cdp = new CDP(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  const evaluate = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.text || ''));
    return r.result.value;
  };
  await cdp.send('Emulation.setEmulatedMedia',
    { media: '', features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride',
    { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

  const probe = `(() => {
    const el = document.activeElement;
    if (!el) return { none: true };
    const s = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(), type: el.type || '', id: el.id,
      focus: el.matches(':focus'), focusVisible: el.matches(':focus-visible'),
      focusWithin: el.matches(':focus-within'),
      outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor + ' / offset ' + s.outlineOffset,
      outlineColor: s.outlineColor,
      border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor
    };
  })()`;

  const tab = async () => {
    await cdp.send('Input.dispatchKeyEvent',
      { type: 'rawKeyDown', winVirtualKeyCode: 9, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }, sessionId);
    await cdp.send('Input.dispatchKeyEvent',
      { type: 'keyUp', winVirtualKeyCode: 9, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }, sessionId);
    await sleep(60);
  };

  let clip = null;
  const computeClip = async () => evaluate(`(() => {
    const el = document.getElementById('journalDatum');
    const b = el.getBoundingClientRect();
    return { x: Math.max(0, Math.round(b.x + window.scrollX - 8)),
             y: Math.max(0, Math.round(b.y + window.scrollY - 8)),
             width: Math.round(b.width + 16), height: Math.round(b.height + 16) };
  })()`);

  const shoot = async (file) => {
    await sleep(120);
    // Bewusst ohne `clip`: der geclippte Ausschnitt lieferte gleichmäßige
    // 881-Byte-Bilder (leer). Volle Viewport-Aufnahme, Region wird im Bild
    // geprüft; der Skill-Pitfall nennt Hänger bei clip außerhalb des Viewports.
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync(path.join(OUT, file), buf);
    return { file, sha256: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16), bytes: buf.length };
  };

  const navigate = async () => {
    const url = 'file:///' + MOCKUP.replace(/\\/g, '/') + '?tool=journal&state=liste&w=1440&cb=' + Date.now();
    await cdp.send('Page.navigate', { url }, sessionId);
    await sleep(850);
    await evaluate('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 200)))');
  };

  const rounds = [];
  for (let round = 1; round <= 3; round++) {
    clip = null;
    await navigate();
    await evaluate('window.scrollTo(0,0); document.body.focus(); if (document.activeElement) document.activeElement.blur();');
    const rest = await shoot('datum-ruhe-r' + round + '.png');
    const steps = [];
    const trace = [];
    for (let i = 1; i <= 16; i++) {
      await tab();
      const p = await evaluate(probe);
      trace.push(i + ':' + p.tag + (p.type ? '[' + p.type + ']' : '') + (p.id ? '#' + p.id : ''));
      if (p.tag === 'input' && p.type === 'date') {
        const s = await shoot('datum-r' + round + '-schritt' + i + '.png');
        steps.push({ step: i, ...p, ...s, wieRuhe: s.sha256 === rest.sha256 });
      }
    }
    rounds.push({ round, rest, trace, dateSteps: steps });
  }

  // Gegenprobe: der Regelzusatz steht jetzt in mockup/werkstatt.css (nicht
  // mehr zur Laufzeit injiziert) — derselbe Schritt wird ohne Injection
  // wiederholt, damit der Beleg zur ausgelieferten Datei gehört.
  clip = null;
  await navigate();
  const targetStep = rounds[rounds.length - 1].dateSteps.slice(-1)[0].step;
  await evaluate('window.scrollTo(0,0); document.body.focus(); if (document.activeElement) document.activeElement.blur();');
  for (let i = 0; i < targetStep; i++) await tab();
  const fixProbe = await evaluate(probe);
  const fixShot = await shoot('datum-fix-schritt' + targetStep + '.png');

  const out = {
    generatedAt: new Date().toISOString(),
    target: 'input#journalDatum (type=date), Journal Zustand liste, 1440 px',
    chrome: version.Browser,
    clip,
    rounds,
    fixProbe: { rule: '.rad-ws-input:focus-within', step: targetStep, ...fixProbe, ...fixShot }
  };
  fs.writeFileSync(path.join(OUT, 'datum-fokus.json'), JSON.stringify(out, null, 2) + '\n');

  for (const r of rounds) {
    console.log('Runde ' + r.round + ' | ' + r.trace.join(' '));
    console.log('  Ruhe=' + r.rest.sha256 + ' | ' + r.dateSteps.map((s) => 'S' + s.step + ':' + (s.focus ? 'focus' : 'nofocus') +
        '/' + (s.focusVisible ? 'fv' : 'keinFV') + '/' + (s.wieRuhe ? 'wieRuhe' : 'anders') +
        '/' + s.sha256 + '/' + s.bytes + 'B').join(' '));
  }
  console.log('Fixprobe:', targetStep, fixProbe.outline, fixShot.sha256);
  process.exit(0);
})().catch((err) => {
  console.error('FEHLER:', err.message);
  process.exit(1);
});
