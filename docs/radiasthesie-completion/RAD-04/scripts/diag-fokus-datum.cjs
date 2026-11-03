/* ============================================================================
   ESOW-RAD-04 · Diagnose: Fokusindikator des Datumsfelds im Journal
   ----------------------------------------------------------------------------
   Befund aus der Messung: 2 von 126 Element-Schritten im Tab-Protokoll zeigen
   keinen Sand-Ring (`outline-style: none`) — beide Male `input[type=date]`.
   Dieses Skript prüft gezielt nach, ob das Feld trotzdem einen sichtbaren
   Fokusindikator hat (Rahmen, box-shadow, ::-webkit-datetime-edit) und legt
   zwei Vergleichsbilder ab (fokussiert / nicht fokussiert).

   Aufruf:
     node docs/radiasthesie-completion/RAD-04/scripts/diag-fokus-datum.cjs
   Ergebnis: messung/diag/fokus-datum.json + fokus-datum-{fokussiert,ruhe}.png
   ========================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const MOCKUP = path.join(ROOT, 'mockup', 'index.html');
const OUT = path.join(ROOT, 'messung', 'diag');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9338;
const SCRATCH = 'C:/Users/mas/AppData/Local/hermes/cache/scratch';

fs.mkdirSync(OUT, { recursive: true });

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
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
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('CDP timeout: ' + method));
        }
      }, 30000);
    });
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      /* noch nicht bereit */
    }
    await sleep(150);
  }
  throw new Error('Chrome DevTools nicht erreichbar: ' + url);
}

(async () => {
  const userDataDir = path.join(SCRATCH, 'chrome-rad04-diag-' + Date.now());
  const chrome = spawn(
    CHROME,
    ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + userDataDir,
     '--no-first-run', '--no-default-browser-check', '--disable-extensions',
     '--disable-background-networking', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'],
    { stdio: 'ignore' }
  );
  const cleanup = () => {
    try {
      chrome.kill();
    } catch {
      /* egal */
    }
  };
  process.on('exit', cleanup);

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

  const evaluate = async (expression) => {
    const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (res.exceptionDetails) throw new Error('eval: ' + (res.exceptionDetails.text || ''));
    return res.result.value;
  };
  const setViewport = (w, h) =>
    cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }, sessionId);
  await cdp.send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, sessionId);

  await setViewport(1440, 900);
  const url = 'file:///' + MOCKUP.replace(/\\/g, '/') + '?tool=journal&state=liste&w=1440&cb=' + Date.now();
  await cdp.send('Page.navigate', { url }, sessionId);
  await sleep(900);
  await evaluate('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 200)))');

  const probe = `(() => {
    const el = document.activeElement;
    if (!el) return { none: true };
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      type: el.type || '',
      id: el.id,
      cls: el.className,
      focus: el.matches(':focus'),
      focusVisible: el.matches(':focus-visible'),
      focusWithin: el.matches(':focus-within'),
      outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor + ' offset ' + s.outlineOffset,
      boxShadow: s.boxShadow,
      border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor,
      borderRadius: s.borderRadius,
      rect: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }
    };
  })()`;

  await evaluate('document.body.focus(); if (document.activeElement) document.activeElement.blur(); window.scrollTo(0,0);');
  const steps = [];
  let hit = null;
  for (let i = 0; i < 16; i++) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', winVirtualKeyCode: 9, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }, sessionId);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', winVirtualKeyCode: 9, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }, sessionId);
    await sleep(60);
    const p = await evaluate(probe);
    steps.push({ step: i + 1, ...p });
    if (p.tag === 'input' && p.type === 'date') hit = { step: i + 1, ...p };
  }

  // Zusätzlich: programmatischer Fokus (kein Tastaturkontext) zum Vergleich
  const prog = await evaluate(`(() => {
    const el = document.getElementById('journalDatum');
    el.focus();
    const s = getComputedStyle(el);
    return { focus: el.matches(':focus'), focusVisible: el.matches(':focus-visible'),
      outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor + ' offset ' + s.outlineOffset,
      boxShadow: s.boxShadow, border: s.borderTopColor };
  })()`);

  // Vergleichsbilder: fokussiert (Tastatur) und Ruhe
  const shoot = async (file) => {
    const h = await evaluate('Math.max(document.documentElement.scrollHeight, 600)');
    await setViewport(1440, Math.min(h, 6000));
    await sleep(150);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    await setViewport(1440, 900);
    fs.writeFileSync(path.join(OUT, file), Buffer.from(data, 'base64'));
    return file;
  };

  // erneut zum Datumsfeld tabben und dort das Bild aufnehmen
  await evaluate('document.body.focus(); if (document.activeElement) document.activeElement.blur(); window.scrollTo(0,0);');
  for (let i = 0; i < 16; i++) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', winVirtualKeyCode: 9, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }, sessionId);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', winVirtualKeyCode: 9, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }, sessionId);
    await sleep(50);
    const tag = await evaluate("document.activeElement && document.activeElement.type === 'date'");
    if (tag) break;
  }
  const shotFocus = await shoot('fokus-datum-fokussiert.png');

  /* Ursachenprobe: Liegt der sichtbare Ring am Host-Input (dann verschwindet er
     beim Überschreiben von `outline` mit Rot) oder malt ihn die UA im
     Shadow-Tree des Datumsfelds? */
  const before = await evaluate(
    "(() => { const el = document.getElementById('journalDatum'); el.style.outline = '3px solid rgb(255,0,0)'; el.style.outlineOffset = '0px'; return getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineColor; })()"
  );
  const shotRed = await shoot('fokus-datum-rotprobe.png');
  await evaluate("(() => { const el = document.getElementById('journalDatum'); el.style.outline = ''; el.style.outlineOffset = ''; })()");

  await evaluate('document.activeElement.blur(); document.body.focus();');
  await sleep(120);
  const shotRest = await shoot('fokus-datum-ruhe.png');

  const out = {
    generatedAt: new Date().toISOString(),
    target: 'input#journalDatum (type=date) im Journal, Zustand liste, 1440 px',
    tabSteps: steps,
    dateStep: hit,
    programmaticFocus: prog,
    redProbe: { applied: before, file: shotRed },
    shots: [shotFocus, shotRest],
    conclusion:
      hit && !hit.focus
        ? 'Im Tastaturfokus liegt der Fokus im Shadow-Tree des Datumsfelds: activeElement ist das Input, aber :focus/:focus-visible melden false und der berechnete outline des Hosts ist "none". Ob der sichtbare Ring vom Host oder von der UA gemalt wird, entscheidet die Rotprobe (fokus-datum-rotprobe.png) — Bildvergleich nötig.'
        : 'Host-Input ist fokussiert und trägt den Sand-Ring — siehe Werte.'
  };

  fs.writeFileSync(path.join(OUT, 'fokus-datum.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('Datumsfeld-Schritt:', JSON.stringify(hit, null, 1));
  console.log('Programmatisch:', JSON.stringify(prog, null, 1));
  console.log('Fazit:', out.conclusion);
  cleanup();
  process.exit(0);
})().catch((err) => {
  console.error('FEHLER:', err.message);
  process.exit(1);
});
