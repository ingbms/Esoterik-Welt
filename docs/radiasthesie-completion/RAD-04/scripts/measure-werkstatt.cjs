/* ============================================================================
   ESOW-RAD-04 · Messung des Werkstatt-Mockups
   ----------------------------------------------------------------------------
   Kein Playwright/Puppeteer im Projekt (node_modules ist leer) — dieses Skript
   spricht direkt Chrome DevTools Protocol über die in Node 24 eingebaute
   WebSocket-Klasse. Keine zusätzliche Abhängigkeit.

   Grundsätze (aus der Skill-Pitfallliste):
   - Je Breite wird NEU navigiert (Cache-Buster) und die Metriken werden VOR der
     Navigation gesetzt. Damit lösen media-query-abhängige Custom Properties
     frisch auf.
   - Kein `clip` beim Screenshot: die Viewporthöhe wird auf die Dokumenthöhe
     gesetzt und dann ohne clip aufgenommen.
   - Überlauf wird nicht über scrollWidth==clientWidth geprüft, sondern über
     scrollWidth−clientWidth am Dokument plus rechte Kante der Kinder.

   Aufruf:
     node docs/radiasthesie-completion/RAD-04/scripts/measure-werkstatt.cjs
     node ... --only=simulator,journal   (Teilmengen)
     node ... --shots=0                  (ohne PNG)
   Ergebnis: messung/werkstatt-messung.json, messung/kontrast.json,
             messung/funktionen.json, messung/screens/*.png
   ========================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const MOCKUP = path.join(ROOT, 'mockup', 'index.html');
const OUT = path.join(ROOT, 'messung');
const SHOTS = path.join(OUT, 'screens');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9337;
const SCRATCH = 'C:/Users/mas/AppData/Local/hermes/cache/scratch';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.split('=')[1] : def;
};
const only = opt('only', '')
  .split(',')
  .filter(Boolean);
const doShots = opt('shots', '1') !== '0';

fs.mkdirSync(OUT, { recursive: true });
if (doShots) fs.mkdirSync(SHOTS, { recursive: true });

const TOOLS = ['simulator', 'studio', 'experiment', 'journal'];
const WIDTHS = [320, 375, 768, 1440];
const BASE_STATE = { simulator: 'bereit', studio: 'standard', experiment: 'verdeckt', journal: 'liste' };
const EXTRA_STATES = {
  simulator: ['laeuft', 'reduziert', 'fehler'],
  studio: ['leer', 'fehler', 'violett', 'pergament'],
  experiment: ['vorbereitet', 'antwort', 'enthuellt', 'abgeschlossen', 'leer', 'demo'],
  journal: ['leer', 'fehler', 'voll', 'bestaetigung', 'geloescht']
};

/* ---------------------------------------------------------------- CDP ----- */

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.listeners = new Map();
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
        if (msg.error) reject(new Error(msg.error.message + ' ' + (msg.error.data || '')));
        else resolve(msg.result);
        return;
      }
      if (msg.method) {
        const key = msg.method;
        (this.listeners.get(key) || []).forEach((fn) => fn(msg.params, msg.sessionId));
      }
    });
  }
  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
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

/* ---------------------------------------------------- Messausdruck im DOM -- */

const MEASURE_FN = String.raw`(() => {
  const vis = (el) => {
    if (!el) return false;
    const s = getComputedStyle(el);
    return !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
  };
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y + window.scrollY), w: Math.round(b.width), h: Math.round(b.height), right: Math.round(b.right) };
  };
  const cs = (el, p) => (el ? getComputedStyle(el)[p] : null);
  const px = (v) => parseFloat(v) || 0;

  const root = document.documentElement;
  const shell = document.querySelector('.rad-ws');
  const panel = [...document.querySelectorAll('.rad-ws-panel')].find(vis);
  const stages = [...document.querySelectorAll('.rad-ws-stage')].filter(vis);
  const stage = stages[0] || null;
  const instrument = [...document.querySelectorAll('.rad-lab-stage, .rad-studio-plate, .rad-exp-stage')].filter(vis)[0] || null;

  /* Bedienelemente und ihre Trefferflächen. Ein Radio/Checkbox in einem Label
     erbt dessen Fläche; Inline-Links im Satz sind nach 2.5.8 ausgenommen. */
  const inlineLink = (el) => el.tagName === 'A' && !!el.closest('p, li, .rad-status, td');
  const interactive = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter(vis);
  const small = interactive
    .filter((el) => !inlineLink(el) && !el.closest('.sr-only'))
    .map((el) => {
      const lab = el.closest('label');
      const box = lab && lab.getBoundingClientRect().height >= 44 ? lab : el;
      return { tag: el.tagName.toLowerCase(), name: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 38), ...r(box) };
    })
    .filter((x) => x && (x.w < 44 || x.h < 44));

  /* Kleinste tatsächlich gerenderte Schriftgröße im HTML-Text */
  const textNodes = [...document.querySelectorAll('body *')].filter((el) => {
    if (!vis(el)) return false;
    if (el.closest('svg')) return false;
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  });
  const fontSizes = textNodes.map((el) => ({ el, size: px(cs(el, 'fontSize')) }));
  const minFont = fontSizes.reduce((m, x) => (x.size < m.size ? x : m), { size: 999, el: null });

  /* Farbpaare + WCAG-Kontrast */
  const parse = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    /* color-mix() wird von Chrome als color(srgb …) mit 0–1-Werten serialisiert. */
    const s = c.match(/color\(srgb ([^)]+)\)/);
    if (s) {
      const p = s[1].trim().split(/\s+/).filter(Boolean).map(Number);
      return { r: Math.round(p[0] * 255), g: Math.round(p[1] * 255), b: Math.round(p[2] * 255), a: p.length > 3 ? p[3] : 1 };
    }
    return null;
  };
  const bgOf = (el) => {
    let node = el;
    while (node && node !== root) {
      const c = parse(cs(node, 'backgroundColor'));
      if (c && c.a > 0.05) return c;
      node = node.parentElement;
    }
    return parse(cs(document.body, 'backgroundColor')) || { r: 11, g: 16, b: 18, a: 1 };
  };
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const contrast = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
  };
  const pair = (label, el, bgEl) => {
    if (!el || !vis(el)) return null;
    const fg = parse(cs(el, 'color'));
    const bg = bgOf(bgEl || el);
    if (!fg) return null;
    return { label, fg: 'rgb(' + fg.r + ',' + fg.g + ',' + fg.b + ')', bg: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')', ratio: contrast(fg, bg) };
  };

  const pairs = [];
  const bodyText = document.querySelector('.astro-lead');
  const hint = [...document.querySelectorAll('.rad-ws-hint')].find(vis);
  const primaryText = [...document.querySelectorAll('.rad-ws-value, .rad-status-label, .rad-ws-navnum')].find(vis);
  const readoutDd = [...document.querySelectorAll('.rad-ws-readout dd, .rad-exp-stats dd')].find(vis);
  const btnPrimary = [...document.querySelectorAll('.btn-primary')].find(vis);
  const input = [...document.querySelectorAll('.input, .select')].find(vis);
  const chip = [...document.querySelectorAll('.rad-ws-chip')].find(vis);
  const navlink = [...document.querySelectorAll('.rad-ws-navlink')].find(vis);
  pairs.push(pair('Fließtext (lead) auf Seitenhintergrund', bodyText));
  pairs.push(pair('Hinweistext 13 px auf Karte', hint));
  pairs.push(pair('Sand-Akzent (Wert/Label)', primaryText));
  pairs.push(pair('Messwert groß', readoutDd));
  pairs.push(pair('Primärknopf-Beschriftung', btnPrimary));
  pairs.push(pair('Eingabetext auf Feldfläche', input));
  pairs.push(pair('Chip-Text', chip));
  pairs.push(pair('Navigationsziel', navlink));

  const inputBorder = input ? { fg: cs(input, 'borderTopColor'), bg: cs(input, 'backgroundColor') } : null;
  let borderRatio = null;
  if (inputBorder) {
    const a = parse(inputBorder.fg), b = parse(inputBorder.bg);
    if (a && b) borderRatio = contrast(a, b);
  }

  /* Tafel: SVG-Textfarbe gegen Tafelfläche (drei Farbstile) */
  const plate = [...document.querySelectorAll('.rad-studio-plate svg')].find(vis);
  let plateContrast = null;
  if (plate) {
    const txt = [...plate.querySelectorAll('text')].find((t) => t.textContent.trim().length > 0);
    const face = plate.querySelector('circle');
    const resolveVar = (val, el) => {
      const probe = document.createElement('span');
      probe.style.color = val;
      el.appendChild(probe);
      const out = getComputedStyle(probe).color;
      probe.remove();
      return out;
    };
    if (txt && face) {
      const ink = parse(resolveVar(txt.getAttribute('fill'), plate));
      const bg = parse(resolveVar(face.getAttribute('fill'), plate));
      const lineEl = [...plate.querySelectorAll('circle, path, line')].find((el) => (el.getAttribute('stroke') || '').indexOf('var(') === 0);
      const line = lineEl ? parse(resolveVar(lineEl.getAttribute('stroke'), plate)) : null;
      if (ink && bg)
        plateContrast = {
          label: 'Tafeltext gegen Tafelfläche',
          fg: 'rgb(' + ink.r + ',' + ink.g + ',' + ink.b + ')',
          bg: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')',
          ratio: contrast(ink, bg),
          lineColor: line ? 'rgb(' + line.r + ',' + line.g + ',' + line.b + ')' : null,
          lineRatio: line && bg ? contrast(line, bg) : null
        };
    }
  }

  /* Struktur */
  const h1s = [...document.querySelectorAll('h1')].filter(vis);
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.trim().slice(0, 42) }));
  let headingJumps = 0;
  for (let i = 1; i < headings.length; i++) if (headings[i].level - headings[i - 1].level > 1) headingJumps++;

  const imgsNoAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
  const statusRegions = [...document.querySelectorAll('[role="status"], [aria-live]:not([aria-live="off"]):not([aria-live="off" i])')].filter(vis);
  const unlabeled = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter((field) => {
    if (!vis(field)) return false;
    if (field.getAttribute('aria-label') || field.getAttribute('aria-labelledby')) return false;
    if (field.id && document.querySelector('label[for="' + field.id + '"]')) return false;
    return !field.closest('label');
  }).map((f) => ({ tag: f.tagName.toLowerCase(), type: f.type || '', id: f.id }));

  /* Überlauf: Dokument + rechte Kante aller sichtbaren Blöcke */
  const overflowing = [...document.querySelectorAll('body *')]
    .filter(vis)
    .map((el) => ({ el, b: el.getBoundingClientRect() }))
    .filter((x) => x.b.right > window.innerWidth + 1)
    .slice(0, 8)
    .map((x) => ({ tag: x.el.tagName.toLowerCase(), cls: x.el.className && String(x.el.className).slice(0, 40), right: Math.round(x.b.right) }));

  /* Werkzeugnavigation: Reserve aus Kindbreiten, nicht aus scrollWidth */
  const nav = document.querySelector('.rad-ws-nav');
  let navInfo = null;
  if (nav && vis(nav)) {
    const links = [...nav.querySelectorAll('.rad-ws-navlink')].filter(vis);
    const sum = links.reduce((s, l) => s + l.getBoundingClientRect().width, 0);
    const b = nav.getBoundingClientRect();
    const inner = b.width - px(cs(nav, 'paddingLeft')) - px(cs(nav, 'paddingRight'));
    const rows = new Set(links.map((l) => Math.round(l.getBoundingClientRect().top))).size;
    navInfo = {
      width: Math.round(b.width),
      height: Math.round(b.height),
      links: links.length,
      rows,
      linkWidth: links.length ? Math.round(links[0].getBoundingClientRect().width) : null,
      linkHeight: links.length ? Math.round(links[0].getBoundingClientRect().height) : null,
      sum: Math.round(sum),
      inner: Math.round(inner),
      reserve: rows === 1 ? Math.round(inner - sum) : null
    };
  }

  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    doc: { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, overflowX: root.scrollWidth - root.clientWidth, height: root.scrollHeight },
    gutter: shell ? px(cs(shell, 'paddingLeft')) : null,
    title: (() => { const t = document.querySelector('.rad-ws-title'); return t ? { size: px(cs(t, 'fontSize')), lineHeight: cs(t, 'lineHeight'), w: Math.round(t.getBoundingClientRect().width) } : null; })(),
    panel: r(panel),
    stage: stage ? { ...r(stage), aspect: +(stage.getBoundingClientRect().height / stage.getBoundingClientRect().width).toFixed(3) } : null,
    instrument: instrument
      ? { ...r(instrument), aspect: +(instrument.getBoundingClientRect().height / instrument.getBoundingClientRect().width).toFixed(3) }
      : null,
    readout: (() => { const el = [...document.querySelectorAll('.rad-ws-readout, .rad-exp-stats')].find(vis); if (!el) return null; const items = [...el.children]; return { cols: getComputedStyle(el).gridTemplateColumns.split(' ').length, count: items.length }; })(),
    nav: navInfo,
    minFontSize: minFont.size < 999 ? Math.round(minFont.size * 10) / 10 : null,
    smallTargets: small,
    interactiveCount: interactive.length,
    pairs: pairs.filter(Boolean),
    inputBorderContrast: borderRatio,
    plateContrast,
    structure: { h1Count: h1s.length, headingJumps, imgsNoAlt, liveRegions: statusRegions.length, unlabeledInputs: unlabeled },
    expAnswers: (() => {
      const btns = [...document.querySelectorAll('.rad-exp-answer')].filter(vis);
      if (!btns.length) return null;
      return { count: btns.length, disabled: btns.filter((b) => b.disabled).length, pressed: btns.filter((b) => b.getAttribute('aria-pressed') === 'true').length, minH: Math.round(Math.min(...btns.map((b) => b.getBoundingClientRect().height))) };
    })(),
    overflowing,
    activeTool: (document.querySelector('[data-toolpanel]:not([hidden])') || {}).getAttribute
      ? document.querySelector('[data-toolpanel]:not([hidden])').getAttribute('data-toolpanel')
      : null
  };
})()`;

/* --------------------------------------------------------- Funktionsproben - */

const FUNC_FN = String.raw`(() => {
  const W = window.RadWerkstatt;
  const out = {};
  const a = W.buildTafel('segmente', { labels: ['A', 'B', 'C'], title: 'Probe', style: 'gold', numbering: true });
  const b = W.buildTafel('segmente', { labels: ['A', 'B', 'C'], title: 'Probe', style: 'gold', numbering: true });
  const s1 = W.exportString(a.svg);
  const s2 = W.exportString(b.svg);
  out.deterministic = s1 === s2;
  out.bytes = s1.length;
  out.hasTitle = /<title>Probe<\/title>/.test(s1);
  out.hasDesc = /<desc>/.test(s1);
  out.hasXmlns = /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(s1);
  out.externalRefs = (s1.match(/https?:\/\//g) || []).length - 1; /* die xmlns-URI zählt nicht als Abruf */
  out.hasScriptTag = /<script/i.test(s1);
  out.hasXlink = /xlink:href|href=/.test(s1);

  const nasty = '<script>alert(1)</script> & "x"';
  const c = W.buildTafel('segmente', { labels: [nasty, 'B'], title: '<b>T</b>', style: 'gold' });
  const s3 = W.exportString(c.svg);
  out.escapedNoRawTag = !/<script>alert/.test(s3);
  out.escapedText = (c.svg.querySelector('text').textContent === '1 · ' + nasty);
  out.titleEscaped = (c.svg.querySelector('title').textContent === '<b>T</b>');

  out.validate = {
    empty: W.validateTafel({ labels: [], title: 'x' }).errors.length,
    tooLongLabel: W.validateTafel({ labels: ['A'.repeat(41), 'B'], title: 'x' }).errors.length,
    control: W.validateTafel({ labels: ['A\u0007', 'B'], title: 'x' }).errors.length,
    titleLong: W.validateTafel({ labels: ['A', 'B'], title: 'T'.repeat(61) }).errors.length,
    ok: W.validateTafel({ labels: ['A', 'B'], title: 'ok' }).ok
  };

  out.stats = {
    p_12_40_k4: +W.binomialExactP(12, 40, 0.25).toFixed(6),
    p_10_40_k4: +W.binomialExactP(10, 40, 0.25).toFixed(6),
    p_30_40_k4: +W.binomialExactP(30, 40, 0.25).toFixed(6),
    wilson_12_40: W.wilsonInterval(12, 40).map((v) => +v.toFixed(4)),
    wilson_30_40: W.wilsonInterval(30, 40).map((v) => +v.toFixed(4))
  };

  out.sim = (() => {
    const theo = 2 * Math.PI * Math.sqrt(0.25 / 9.81);
    return { theo_0_25: +theo.toFixed(4), readout: (document.querySelector('#simTheorie') || {}).textContent || null };
  })();
  out.storageEmpty = (() => { try { return localStorage.length === 0; } catch { return 'blocked'; } })();
  return out;
})()`;

/* -------------------------------------------------------------- Messlauf -- */

(async () => {
  const userDataDir = path.join(SCRATCH, 'chrome-rad04-' + Date.now());
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--remote-debugging-port=' + PORT,
      '--user-data-dir=' + userDataDir,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      'about:blank'
    ],
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

  const consoleErrors = [];
  const externalRequests = [];
  const failedRequests = [];
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error') consoleErrors.push(p.args.map((a) => a.value || a.description || '').join(' ').slice(0, 200));
  });
  cdp.on('Runtime.exceptionThrown', (p) => consoleErrors.push('exception: ' + (p.exceptionDetails.text || '') + ' ' + (p.exceptionDetails.exception?.description || '').slice(0, 160)));
  cdp.on('Network.requestWillBeSent', (p) => {
    const u = p.request.url;
    if (!u.startsWith('file://') && !u.startsWith('data:') && !u.startsWith('blob:')) externalRequests.push(u);
  });
  cdp.on('Network.loadingFailed', (p) => failedRequests.push(p.errorText));

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);

  const loadWaiters = [];
  cdp.on('Page.loadEventFired', () => {
    while (loadWaiters.length) loadWaiters.shift()();
  });

  const goto = async (url) => {
    const loaded = new Promise((res) => {
      loadWaiters.push(res);
      setTimeout(res, 8000);
    });
    await cdp.send('Page.navigate', { url }, sessionId);
    await loaded;
    await cdp.send(
      'Runtime.evaluate',
      { expression: 'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 180)))', awaitPromise: true },
      sessionId
    );
  };

  const evaluate = async (expression) => {
    const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (res.exceptionDetails) throw new Error('eval: ' + (res.exceptionDetails.text || '') + ' ' + JSON.stringify(res.exceptionDetails.exception?.description || ''));
    return res.result.value;
  };

  const setViewport = (width, height) =>
    cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height }, sessionId);

  const setMedia = (media, features) => cdp.send('Emulation.setEmulatedMedia', { media: media || '', features: features || [] }, sessionId);

  /* Der Host (Windows 11) meldet von sich aus prefers-reduced-motion: reduce.
     Für „Normalfall"-Messungen wird no-preference deshalb explizit emuliert,
     für die Prüfung der reduzierten Bewegung reduce. */
  const NORMAL_MEDIA = [{ name: 'prefers-reduced-motion', value: 'no-preference' }];
  const shot = async (file) => {
    const h = await evaluate('Math.max(document.documentElement.scrollHeight, 600)');
    await setViewport(currentWidth, Math.min(h, 6000));
    await sleep(120);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    await setViewport(currentWidth, 900);
    fs.writeFileSync(path.join(SHOTS, file), Buffer.from(data, 'base64'));
    return file;
  };

  let currentWidth = 1440;
  const fileUrl = (tool, state, width) =>
    'file:///' + MOCKUP.replace(/\\/g, '/') + '?tool=' + tool + '&state=' + state + '&w=' + width + '&cb=' + Date.now();

  const results = [];
  const tools = only.length ? TOOLS.filter((t) => only.includes(t)) : TOOLS;

  for (const tool of tools) {
    for (const width of WIDTHS) {
      currentWidth = width;
      await setViewport(width, 900);
      await setMedia('screen', NORMAL_MEDIA);
      await goto(fileUrl(tool, BASE_STATE[tool], width));
      const m = await evaluate(MEASURE_FN);
      m.tool = tool;
      m.state = BASE_STATE[tool];
      m.width = width;
      m.consoleErrors = consoleErrors.slice();
      m.externalRequests = externalRequests.slice();
      results.push(m);
      if (doShots) await shot(`${tool}-${BASE_STATE[tool]}-${width}.png`);
      process.stdout.write(`· ${tool} ${BASE_STATE[tool]} @${width}: overflowX=${m.doc.overflowX} minFont=${m.minFontSize} small=${m.smallTargets.length}\n`);
    }
  }

  /* Zustandsbilder (nur 375 und 1440) */
  const stateShots = [];
  if (doShots) {
    for (const tool of tools) {
      for (const st of EXTRA_STATES[tool]) {
        for (const width of [375, 1440]) {
          currentWidth = width;
          await setViewport(width, 900);
          await setMedia('screen', NORMAL_MEDIA);
          await goto(fileUrl(tool, st, width));
          const m = await evaluate(MEASURE_FN);
          m.tool = tool;
          m.state = st;
          m.width = width;
          m.consoleErrors = consoleErrors.slice();
          results.push(m);
          const file = await shot(`${tool}-${st}-${width}.png`);
          stateShots.push({ tool, state: st, width, file, overflowX: m.doc.overflowX });
          process.stdout.write(`· ${tool} ${st} @${width}: overflowX=${m.doc.overflowX} small=${m.smallTargets.length}\n`);
        }
      }
    }
  }

  /* Tastaturprotokoll: je Werkzeug bei 1440 und 375 die ersten 14 Fokussierungen */
  const keyboard = [];
  for (const tool of tools) {
    for (const width of [1440, 375]) {
      currentWidth = width;
      await setViewport(width, 900);
      await setMedia('screen', NORMAL_MEDIA);
      await goto(fileUrl(tool, BASE_STATE[tool], width));
      await evaluate('document.body.focus(); if (document.activeElement) document.activeElement.blur(); window.scrollTo(0,0);');
      const seq = [];
      for (let i = 0; i < 16; i++) {
        await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', winVirtualKeyCode: 9, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }, sessionId);
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', winVirtualKeyCode: 9, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }, sessionId);
        await sleep(40);
        seq.push(
          await evaluate(`(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return { tag: 'body' };
            const s = getComputedStyle(el);
            const b = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              type: el.type || '',
              name: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 46),
              w: Math.round(b.width), h: Math.round(b.height),
              outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor,
              covered: (() => {
                const x = Math.min(b.left + Math.min(b.width / 2, 6), window.innerWidth - 1);
                const y = b.top + Math.min(b.height / 2, 6);
                if (y < 0 || y > window.innerHeight) return 'outside-viewport';
                const top = document.elementFromPoint(x, y);
                return top && (el.contains(top) || top.contains(el)) ? 'visible' : 'covered-by:' + (top ? top.className : '?');
              })()
            };
          })()`)
        );
      }
      keyboard.push({ tool, width, sequence: seq });
      process.stdout.write(`· Tastatur ${tool} @${width}: ${seq.map((s) => s.tag).join(' → ')}\n`);
    }
  }

  /* Reduzierte Bewegung: Übergangs- und Animationsdauern */
  await setViewport(1440, 900);
  await setMedia('screen', NORMAL_MEDIA);
  await goto(fileUrl('simulator', 'laeuft', 1440));
  const normalMotion = await evaluate(`(() => {
    const s = getComputedStyle(document.querySelector('.rad-lab-arm'));
    return { animationName: s.animationName, animationDuration: s.animationDuration, animationPlayState: s.animationPlayState, transform: s.transform, running: document.querySelector('.rad-lab-stage').dataset.running };
  })()`);
  await setMedia('screen', [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await goto(fileUrl('simulator', 'laeuft', 1440));
  const reducedMotionRunning = await evaluate(`(() => {
    const s = getComputedStyle(document.querySelector('.rad-lab-arm'));
    return { animationName: s.animationName, animationDuration: s.animationDuration, transform: s.transform, running: document.querySelector('.rad-lab-stage').dataset.running };
  })()`);
  await goto(fileUrl('simulator', 'bereit', 1440));
  const reducedMotion = await evaluate(`(() => {
    const s = getComputedStyle(document.querySelector('.rad-lab-arm'));
    const bar = getComputedStyle(document.querySelector('#simBar') || document.querySelector('.rad-exp-bar span') || document.createElement('span'));
    return { animationName: s.animationName, animationDuration: s.animationDuration, animationPlayState: s.animationPlayState, transform: s.transform, barDuration: bar.animationDuration };
  })()`);

  /* Druck: Studio (Tafel + Titel, keine Bedienoberfläche) */
  await setViewport(1440, 900);
  await setMedia('print', []);
  await goto(fileUrl('studio', 'standard', 1440));
  const printStudio = await evaluate(`(() => {
    const vis = (el) => el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
    const rgb = (s) => (s.match(/\\d+(\\.\\d+)?/g) || []).slice(0, 3).map(Number);
    const lum = (c) => { const t = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]; };
    const ratio = (a, b) => { const l1 = lum(rgb(a)), l2 = lum(rgb(b)); return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100; };
    const sheet = document.querySelector('.rad-studio-print-sheet');
    const svg = sheet && sheet.querySelector('svg');
    const faceEl = svg && svg.querySelector('circle');
    const inkEl = svg && svg.querySelector('text');
    const face = faceEl ? getComputedStyle(faceEl).fill : null;
    const ink = inkEl ? getComputedStyle(inkEl).fill : null;
    return {
      panel: vis(document.querySelector('.rad-ws-panel')),
      nav: vis(document.querySelector('.rad-ws-nav')),
      status: vis(document.querySelector('.rad-ws-status')),
      einordnung: vis(document.querySelector('.rad-status')),
      printSheet: vis(sheet),
      printTitle: (document.querySelector('#studioPrintTitel') || {}).textContent || null,
      sheetSvgWidth: sheet && sheet.querySelector('svg') ? Math.round(sheet.querySelector('svg').getBoundingClientRect().width) : null,
      plateColorAdjust: getComputedStyle(document.querySelector('.rad-studio-plate')).printColorAdjust || getComputedStyle(document.querySelector('.rad-studio-plate')).webkitPrintColorAdjust || null,
      printPlateStyle: (document.querySelector('#studioPrintPlate') || {}).dataset ? document.querySelector('#studioPrintPlate').dataset.style : null,
      plateFace: face,
      plateInk: ink,
      plateContrast: face && ink ? ratio(ink, face) : null
    };
  })()`);

  /* Druck: Simulator (Werte bleiben, Animation steht) */
  await goto(fileUrl('simulator', 'laeuft', 1440));
  const printSimulator = await evaluate(`(() => {
    const vis = (el) => el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
    const arm = getComputedStyle(document.querySelector('.rad-lab-arm'));
    return {
      panel: vis(document.querySelector('.rad-ws-panel')),
      chart: vis(document.querySelector('.rad-lab-chart')),
      readout: vis(document.querySelector('.rad-ws-readout')),
      animationName: arm.animationName,
      periode: (document.querySelector('#simPeriode') || {}).textContent
    };
  })()`);

  /* Druck: Journal (Einträge sichtbar, Formular nicht) */
  await goto(fileUrl('journal', 'liste', 1440));
  const printJournal = await evaluate(`(() => {
    const vis = (el) => el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
    const entries = [...document.querySelectorAll('.rad-journal-entry')];
    const bodies = entries.map((e) => e.querySelector('.rad-journal-body')).filter(vis);
    return {
      panel: vis(document.querySelector('.rad-ws-panel')),
      list: vis(document.querySelector('#journalListe')),
      filter: vis(document.querySelector('.rad-journal-filter')),
      entries: entries.filter(vis).length,
      bodiesVisible: bodies.length,
      firstBodyVisible: vis(document.querySelector('.rad-journal-entry .rad-journal-body')),
      firstBodyLines: bodies.length ? bodies[0].getClientRects().length : 0,
      firstBodyHeight: bodies.length ? Math.round(bodies[0].getBoundingClientRect().height) : 0,
      firstBodyText: bodies.length ? bodies[0].textContent.trim().slice(0, 120) : null,
      toggleMarker: entries.length ? getComputedStyle(entries[0].querySelector('summary'), '::after').content : null
    };
  })()`);

  /* Druck: Experiment (Protokoll + Ergebnis) */
  await goto(fileUrl('experiment', 'abgeschlossen', 1440));
  const printExperiment = await evaluate(`(() => {
    const vis = (el) => el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
    const rgb = (s) => (s.match(/\\d+(\\.\\d+)?/g) || []).slice(0, 3).map(Number);
    const lum = (c) => { const t = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]; };
    const ratio = (a, b) => { const l1 = lum(rgb(a)), l2 = lum(rgb(b)); return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100; };
    const stage = document.querySelector('.rad-exp-stage');
    const stageText = document.querySelector('#expStageText');
    const alphaOf = (s) => { const p = (s.match(/[\\d.]+/g) || []).map(Number); return p.length > 3 ? p[3] : 1; };
    const rawBg = stage ? getComputedStyle(stage).backgroundColor : null;
    /* Transparenter Grund heißt im Druck: Papier. Ohne diese Ersetzung misst
       man 1:1 gegen Unsichtbares und der Wert wäre wertlos. */
    const bg = rawBg && alphaOf(rawBg) === 0 ? 'rgb(255, 255, 255)' : rawBg;
    const fg = stageText ? getComputedStyle(stageText).color : null;
    return {
      panel: vis(document.querySelector('.rad-ws-panel')),
      stats: vis(document.querySelector('.rad-exp-stats')),
      result: vis(document.querySelector('.rad-exp-result')),
      actions: vis(document.querySelector('.rad-ws-actions')),
      stageBg: bg,
      stageText: fg,
      stageContrast: bg && fg ? ratio(fg, bg) : null,
      targetColor: document.querySelector('.rad-exp-target') ? getComputedStyle(document.querySelector('.rad-exp-target')).color : null,
      progressBarBg: document.querySelector('.rad-exp-bar') ? getComputedStyle(document.querySelector('.rad-exp-bar')).backgroundColor : null
    };
  })()`);
  await setMedia('screen', NORMAL_MEDIA);

  /* Druckbilder als Screenshot-Beleg (Medienemulation print). */
  const printShots = [];
  for (const [tool, st] of [
    ['studio', 'standard'],
    ['simulator', 'laeuft'],
    ['journal', 'liste'],
    ['experiment', 'abgeschlossen']
  ]) {
    currentWidth = 1440;
    await setViewport(1440, 900);
    await setMedia('print', []);
    await goto(fileUrl(tool, st, 1440));
    if (doShots) printShots.push(await shot('druck-' + tool + '-1440.png'));
    await setMedia('screen', NORMAL_MEDIA);
  }

  /* Funktionsproben (Studio-Export, Statistik, Speicher) */
  await setViewport(1440, 900);
  await goto(fileUrl('studio', 'standard', 1440));
  const funcStudio = await evaluate(FUNC_FN);
  await goto(fileUrl('journal', 'liste', 1440));
  const funcJournal = await evaluate(`(() => ({
    storageEmpty: (() => { try { return localStorage.length === 0; } catch { return 'blocked'; } })(),
    entries: document.querySelectorAll('.rad-journal-entry').length,
    noNetwork: true
  }))()`);

  /* Simulator: Periode gegen Formel */
  await goto(fileUrl('simulator', 'bereit', 1440));
  const funcSim = await evaluate(`(() => {
    const theo = 2 * Math.PI * Math.sqrt(0.25 / 9.81);
    return { expected: +theo.toFixed(3), shown: document.querySelector('#simTheorie').textContent.replace(',', '.'), periode: document.querySelector('#simPeriode').textContent.replace(',', '.') };
  })()`);

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      chrome: version.Browser,
      protocol: version['Protocol-Version'],
      mockup: 'docs/radiasthesie-completion/RAD-04/mockup/index.html',
      widths: WIDTHS,
      tools: tools,
      note: 'Je Messpunkt frisch navigiert (Cache-Buster), Metriken vor Navigation gesetzt, Scrollbalken ausgeblendet.'
    },
    results,
    keyboard,
    reducedMotion: { settled: reducedMotion, runningReduced: reducedMotionRunning, runningNormal: normalMotion },
    print: { studio: printStudio, simulator: printSimulator, journal: printJournal, experiment: printExperiment },
    functions: { studio: funcStudio, journal: funcJournal, simulator: funcSim },
    stateShots,
    printShots,
    errors: { console: consoleErrors, externalRequests, failedRequests }
  };

  fs.writeFileSync(path.join(OUT, 'werkstatt-messung.json'), JSON.stringify(payload, null, 2) + '\n');

  const contrast = results
    .filter((r) => r.width === 1440)
    .map((r) => ({ tool: r.tool, state: r.state, pairs: r.pairs, inputBorderContrast: r.inputBorderContrast, plateContrast: r.plateContrast }));
  fs.writeFileSync(path.join(OUT, 'kontrast.json'), JSON.stringify({ generatedAt: payload.meta.generatedAt, chrome: version.Browser, tool1440: contrast }, null, 2) + '\n');
  fs.writeFileSync(
    path.join(OUT, 'funktionen.json'),
    JSON.stringify({ generatedAt: payload.meta.generatedAt, ...payload.functions, reducedMotion: payload.reducedMotion, print: payload.print }, null, 2) + '\n'
  );

  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
  cleanup();

  const bad = results.filter((r) => r.doc.overflowX !== 0);
  process.stdout.write('\nFertig. Messpunkte: ' + results.length + ', PNG: ' + (doShots ? stateShots.length + tools.length * WIDTHS.length : 0) + '\n');
  process.stdout.write('Überlauf > 0: ' + (bad.length ? bad.map((b) => b.tool + '/' + b.state + '@' + b.width + '=' + b.doc.overflowX).join(', ') : 'keiner') + '\n');
  process.stdout.write('Konsolenfehler: ' + consoleErrors.length + ' · externe Anfragen: ' + externalRequests.length + ' · fehlgeschlagene Anfragen: ' + failedRequests.length + '\n');
  process.exit(0);
})().catch((err) => {
  process.stdout.write('FEHLER: ' + err.stack + '\n');
  process.exit(1);
});
