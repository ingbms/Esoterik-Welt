// Abnahme t_1cf8b61c — Prüfpunkte 2, 3 (Teil) und 4:
// Physik/Spektrum, Werkzeuge (Kompass, Meditation, Zeitleiste) inklusive
// Tastaturbedienung, Reduced Motion, Netzwerk- und Speicherverhalten.
// Aufruf: node probe-tools.mjs <root> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './lib.mjs';

const rootDir = process.argv[2] || 'dist/Esoterik-Welt';
const out = process.argv[3] || 'evidence/t_1cf8b61c/probe/tools.json';
const { server, base } = await startServer(rootDir, 3291);
const browser = await chromium.launch();
const findings = [];
const notes = {};

const record = (id, severity, message, repro) => findings.push({ id, severity, message, repro });

// --- Prüfpunkt 2: Physik -----------------------------------------------------
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push({ url: page.url(), text: m.text() });
});
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push({ url: page.url(), text: String(e) }));

const NON_SPECTRAL = ['magenta', 'rosa', 'weiss', 'schwarz'];
const physics = {};
for (const id of [...NON_SPECTRAL, 'tuerkis', 'rot']) {
  await page.goto(`${base}/#farbwelten/${id}`);
  await page.waitForTimeout(250);
  physics[id] = await page.evaluate(() => {
    const root = document.getElementById('farbweltenRoot');
    const rows = [...root.querySelectorAll('dt')].map((dt) => ({
      label: dt.textContent.trim(),
      value: dt.nextElementSibling?.textContent.trim() || '',
    }));
    const factsText = rows.map((row) => `${row.label}: ${row.value}`).join(' | ');
    return {
      rows,
      factsText,
      typLabel: (root.querySelector('.fw-detail__band .label')?.textContent || '').trim(),
    };
  });
}
for (const id of NON_SPECTRAL) {
  const info = physics[id];
  // Nur die Messwertzeilen zählen: Prosa darf Bereiche erklären.
  const measuredRows = info.rows.filter((row) => /Wellenlänge|Frequenz|Photonenenergie/i.test(row.label));
  const fabricated = measuredRows.filter((row) => /\d/.test(row.value) && !/keine/i.test(row.value));
  if (fabricated.length)
    record(
      'P2-1',
      'blocking',
      `${id}: Messwertzeile mit Zahl (${fabricated.map((row) => `${row.label}=${row.value}`).join('; ')})`,
      `#farbwelten/${id}`
    );
  if (!info.rows.some((row) => /keine eigene Wellenlänge|keine Wellenlänge/i.test(row.value)))
    record('P2-1b', 'major', `${id}: kein Hinweis „keine eigene Wellenlänge“ in den Fakten`, `#farbwelten/${id}`);
}
notes.physics = physics;

// Spektrum-Explorer: Achse 380–780, nichtspektrale Farben nicht auf der Achse.
await page.goto(`${base}/#farbwelten/lichtfrequenzen`);
await page.waitForTimeout(300);
const explorer = await page.evaluate(() => {
  const root = document.getElementById('farbweltenRoot');
  const slider = root.querySelector('#fwWavelength');
  const offaxis = root.querySelector('.fw-spectrum__offaxis');
  const axisLabels = [...root.querySelectorAll('.fw-spectrum__axis *')].map((n) => n.textContent.trim()).filter(Boolean);
  return {
    min: slider?.getAttribute('min'),
    max: slider?.getAttribute('max'),
    value: slider?.value,
    offaxisText: offaxis ? offaxis.innerText.replace(/\s+/g, ' ').trim() : null,
    offaxisLinks: offaxis ? [...offaxis.querySelectorAll('a')].map((a) => a.getAttribute('href')) : [],
    axisLabels,
    axisText: root.querySelector('.fw-spectrum__axis')?.innerText.replace(/\s+/g, ' ').trim() || '',
  };
});
notes.explorer = explorer;
if (explorer.min !== '380' || explorer.max !== '780')
  record('P2-2', 'blocking', `λ-Achse ${explorer.min}–${explorer.max} nm statt 380–780`, '#farbwelten/lichtfrequenzen');
for (const id of NON_SPECTRAL) {
  const onAxis = new RegExp(id, 'i').test(explorer.axisText);
  if (onAxis) record('P2-3', 'blocking', `${id} steht auf der λ-Achse`, '#farbwelten/lichtfrequenzen');
  if (!(explorer.offaxisLinks || []).includes(`#farbwelten/${id}`))
    record('P2-4', 'minor', `${id} fehlt in der Liste „nicht spektral / Neutralfarbe“`, '#farbwelten/lichtfrequenzen');
}
if (!/Übergang|Übergangsbereich/i.test(physics.tuerkis.typLabel + physics.tuerkis.factsText))
  record('P2-5', 'major', 'Türkis ohne Kennzeichnung als Übergangsbereich', '#farbwelten/tuerkis');

// Slider-Rechnung: f = c/λ, E = hc/λ an drei Stützwerten.
const C = 299792458;
const sliderSamples = [];
for (const nm of [420, 530, 650]) {
  await page.goto(`${base}/#farbwelten/lichtfrequenzen`);
  await page.waitForTimeout(250);
  const readout = await page.evaluate((value) => {
    const root = document.getElementById('farbweltenRoot');
    const slider = root.querySelector('#fwWavelength');
    slider.value = String(value);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      readout: root.querySelector('#fwSpectrumReadout')?.innerText.replace(/\s+/g, ' ').trim(),
      valueText: slider.getAttribute('aria-valuetext'),
      value: slider.value,
    };
  }, nm);
  const expectedThz = C / (nm * 1e-9) / 1e12;
  const expectedEv = 1239.841984 / nm;
  const thzMatch = /([\d.,]+)\s*(?:THz|Terahertz)/.exec(readout.readout || '');
  const evMatch = /([\d.,]+)\s*(?:eV|Elektronenvolt)/.exec(readout.readout || '');
  const parse = (text) => Number(String(text).replace(/\./g, '').replace(',', '.'));
  const gotThz = thzMatch ? parse(thzMatch[1]) : null;
  const gotEv = evMatch ? parse(evMatch[1]) : null;
  const sample = { nm, expectedThz, expectedEv, gotThz, gotEv, ...readout };
  sliderSamples.push(sample);
  if (gotThz === null || Math.abs(gotThz - expectedThz) > Math.max(0.5, expectedThz * 0.005))
    record('P2-6', 'blocking', `${nm} nm: Frequenz ${gotThz} statt ${expectedThz.toFixed(1)} THz`, '#farbwelten/lichtfrequenzen Slider');
  if (gotEv === null || Math.abs(gotEv - expectedEv) > 0.02)
    record('P2-7', 'blocking', `${nm} nm: Photonenenergie ${gotEv} statt ${expectedEv.toFixed(2)} eV`, '#farbwelten/lichtfrequenzen Slider');
}
notes.slider = sliderSamples;

// --- Prüfpunkt 3/4: Werkzeuge ----------------------------------------------
// Kompass: Radio-Gruppe, Datenabdeckung, Pfeiltasten, Statuszeile.
await page.goto(`${base}/#farbwelten/kompass`);
await page.waitForTimeout(300);
const compass = await page.evaluate(() => {
  const root = document.getElementById('farbweltenRoot');
  const radios = [...root.querySelectorAll('input[name="fwCompassColor"]')];
  const live = [...root.querySelectorAll('[aria-live]')].map((n) => ({
    live: n.getAttribute('aria-live'),
    role: n.getAttribute('role'),
    id: n.id,
    text: n.textContent.trim().slice(0, 80),
  }));
  return {
    radios: radios.map((r) => ({ value: r.value, label: r.closest('label')?.textContent.trim() })),
    live,
    panelName: root.querySelector('#fwCompassName')?.textContent.trim(),
    statusText: root.querySelector('[role="status"]')?.textContent.trim(),
    blocks: root.querySelectorAll('.fw-kompass__block').length,
  };
});
notes.compass = compass;

const compassPanels = [];
for (const id of ['rot', 'tuerkis', 'magenta', 'rosa', 'weiss', 'schwarz']) {
  const result = await page.evaluate((colour) => {
    const root = document.getElementById('farbweltenRoot');
    const input = root.querySelector(`input[name="fwCompassColor"][value="${colour}"]`);
    if (!input) return { missing: true };
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return new Promise((resolve) => {
      requestAnimationFrame(() =>
        resolve({
          name: root.querySelector('#fwCompassName')?.textContent.trim(),
          text: (root.querySelector('.fw-kompass__panel')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300),
          blocks: root.querySelectorAll('.fw-kompass__block').length,
          status: root.querySelector('[role="status"]')?.textContent.trim(),
        })
      );
    });
  }, id);
  compassPanels.push({ id, ...result });
  if (result.missing) record('P3-1', 'major', `Kompass: keine Auswahl für ${id}`, '#farbwelten/kompass');
  else if (!result.text || result.text.length < 40)
    record('P3-2', 'blocking', `Kompass: Panel für ${id} leer (${JSON.stringify(result.text)})`, `#farbwelten/kompass → ${id}`);
  else if (/undefined|null/.test(result.text))
    record('P3-3', 'blocking', `Kompass: Panel für ${id} enthält undefined/null`, `#farbwelten/kompass → ${id}`);
}
notes.compassPanels = compassPanels;

// Kompass per Tastatur (Pfeiltaste) und Fokusprüfung.
await page.goto(`${base}/#farbwelten/kompass`);
await page.waitForTimeout(250);
const keyboard = {};
await page.locator('input[name="fwCompassColor"]').first().focus();
const focusBefore = await page.evaluate(() => document.activeElement?.value);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(120);
keyboard.compass = await page.evaluate(() => ({
  checked: document.querySelector('input[name="fwCompassColor"]:checked')?.value,
  focused: document.activeElement?.value,
  name: document.getElementById('fwCompassName')?.textContent.trim(),
}));
if (keyboard.compass.checked !== 'orange' || keyboard.compass.focused !== 'orange')
  record('P3-4', 'major', `Kompass: Pfeiltaste wirkt nicht (${JSON.stringify(keyboard.compass)})`, '#farbwelten/kompass');
notes.keyboard = keyboard;

// Sichtbarer Fokus auf Auswahl und Buttons.
const focusVisible = await page.evaluate(() => {
  const input = document.querySelector('input[name="fwCompassColor"]');
  input.focus();
  const style = getComputedStyle(input);
  const label = input.closest('label');
  const labelStyle = label ? getComputedStyle(label) : null;
  return {
    outlineStyle: style.outlineStyle,
    outlineWidth: style.outlineWidth,
    boxShadow: style.boxShadow,
    labelOutline: labelStyle ? labelStyle.outlineStyle : null,
    labelShadow: labelStyle ? labelStyle.boxShadow : null,
  };
});
notes.focusVisible = focusVisible;
if (
  focusVisible.outlineStyle === 'none' &&
  (focusVisible.outlineWidth === '0px' || focusVisible.outlineWidth === '') &&
  (!focusVisible.boxShadow || focusVisible.boxShadow === 'none') &&
  (!focusVisible.labelShadow || focusVisible.labelShadow === 'none') &&
  focusVisible.labelOutline === 'none'
)
  record('P3-5', 'major', 'Kein sichtbarer Fokus am Kompass-Radio', '#farbwelten/kompass');

// Meditation: Start/Pause/Ende per Tastatur, Timer, Status, keine Speicherung.
const storageCalls = [];
await page.goto(`${base}/#home`);
await page.addInitScript(() => {
  window.__storage = [];
  for (const api of ['localStorage', 'sessionStorage']) {
    const proto = window[api];
    for (const method of ['setItem', 'getItem', 'removeItem', 'clear']) {
      const original = proto[method].bind(proto);
      proto[method] = (...args) => {
        window.__storage.push({ api, method, key: args[0] });
        return original(...args);
      };
    }
  }
});
// Grundlast der bestehenden Module (Tarot, Kristalle, Runen) getrennt erfassen,
// damit nur Schreibzugriffe der neuen Werkzeuge bewertet werden.
await page.goto(`${base}/#home`);
await page.waitForTimeout(300);
const baselineStorage = await page.evaluate(() => {
  const calls = window.__storage || [];
  window.__storage = [];
  return calls.filter((call) => call.method !== 'getItem');
});
await page.goto(`${base}/#farbwelten/farbmeditation`);
await page.waitForTimeout(300);
const medStart = await page.evaluate(() => {
  const start = document.getElementById('fwMedStart');
  return { exists: Boolean(start), label: start?.textContent.trim(), duration: document.getElementById('fwMedDuration')?.value };
});
await page.locator('#fwMedStart').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
const medRunning = await page.evaluate(() => ({
  timer: document.getElementById('fwMedTimer')?.textContent.trim(),
  status: document.getElementById('fwMedStatus')?.textContent.trim(),
  pauseVisible: Boolean(document.getElementById('fwMedPause')?.offsetParent),
  stopVisible: Boolean(document.getElementById('fwMedStop')?.offsetParent),
  live: [...document.querySelectorAll('#farbweltenRoot [aria-live]')].map((n) => ({
    live: n.getAttribute('aria-live'),
    role: n.getAttribute('role'),
    id: n.id,
  })),
}));
await page.locator('#fwMedPause').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const medPaused = await page.evaluate(() => ({
  timer: document.getElementById('fwMedTimer')?.textContent.trim(),
  status: document.getElementById('fwMedStatus')?.textContent.trim(),
  pauseLabel: document.getElementById('fwMedPause')?.textContent.trim(),
}));
await page.waitForTimeout(1200);
const medPausedLater = await page.evaluate(() => document.getElementById('fwMedTimer')?.textContent.trim());
await page.locator('#fwMedStop').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
const medStopped = await page.evaluate(() => ({
  timer: document.getElementById('fwMedTimer')?.textContent.trim(),
  status: document.getElementById('fwMedStatus')?.textContent.trim(),
  storage: window.__storage || [],
}));
notes.meditation = { medStart, medRunning, medPaused, medPausedLater, medStopped };
if (!medStart.exists) record('P4-1', 'blocking', 'Meditation: Startknopf fehlt', '#farbwelten/farbmeditation');
if (medRunning.timer === medStart.duration + ':00') record('P4-2', 'major', 'Meditation: Timer läuft nicht', '#farbwelten/farbmeditation');
if (medPaused.timer !== medPausedLater) record('P4-3', 'major', 'Meditation: Pause hält den Timer nicht an', '#farbwelten/farbmeditation');
if (!/beendet|gestoppt|Zurückgesetzt|bereit/i.test(medStopped.status || ''))
  record('P4-4', 'minor', `Meditation: Status nach Ende unklar („${medStopped.status}“)`, '#farbwelten/farbmeditation');
if ((medStopped.storage || []).filter((entry) => entry.method !== 'getItem').length)
  record(
    'P4-5',
    'blocking',
    `Schreibzugriffe während der Meditation: ${JSON.stringify(medStopped.storage.filter((e) => e.method !== 'getItem'))}`,
    '#farbwelten/farbmeditation'
  );
notes.storageBaseline = baselineStorage;

// Reduced Motion: keine Animation an der Meditationsfläche, Timer läuft weiter.
const reduce = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const reducePage = await reduce.newPage();
await reducePage.goto(`${base}/#farbwelten/farbmeditation`);
await reducePage.waitForTimeout(300);
await reducePage.locator('#fwMedStart').click();
await reducePage.waitForTimeout(600);
const reduceState = await reducePage.evaluate(() => {
  const stage = document.getElementById('fwMeditationStage');
  const after = getComputedStyle(stage, '::after');
  const inner = stage?.firstElementChild ? getComputedStyle(stage.firstElementChild) : null;
  return {
    stageAnimation: getComputedStyle(stage).animationName,
    afterAnimation: after.animationName,
    innerAnimation: inner ? inner.animationName : null,
    running: stage.classList.contains('is-running'),
    timer: document.getElementById('fwMedTimer')?.textContent.trim(),
    status: document.getElementById('fwMedStatus')?.textContent.trim(),
    transitions: [...document.querySelectorAll('#farbweltenRoot *')]
      .map((node) => getComputedStyle(node).transitionDuration)
      .filter((value) => value && value !== '0s' && value !== '0s, 0s')
      .slice(0, 5),
  };
});
const timelineAnimations = await (async () => {
  await reducePage.goto(`${base}/#farbwelten/zeitleiste`);
  await reducePage.waitForTimeout(300);
  return reducePage.evaluate(() => ({
    animated: [...document.querySelectorAll('#farbweltenRoot *')]
      .map((node) => ({ node: node.className, animation: getComputedStyle(node).animationName }))
      .filter((entry) => entry.animation && entry.animation !== 'none')
      .slice(0, 5),
    marquee: Boolean(document.querySelector('marquee')),
    blink: [...document.querySelectorAll('#farbweltenRoot *')].filter((node) => /blink/i.test(getComputedStyle(node).animationName)).length,
  }));
})();
await reduce.close();
notes.reducedMotion = { reduceState, timelineAnimations };
if (reduceState.stageAnimation !== 'none' || reduceState.afterAnimation !== 'none' || (reduceState.innerAnimation && reduceState.innerAnimation !== 'none'))
  record('P4-6', 'blocking', `Reduced Motion: Animation läuft (${JSON.stringify(reduceState)})`, '#farbwelten/farbmeditation');
if (timelineAnimations.animated.length) record('P4-7', 'major', `Zeitleiste animiert unter Reduced Motion (${JSON.stringify(timelineAnimations.animated)})`, '#farbwelten/zeitleiste');
if (timelineAnimations.blink || timelineAnimations.marquee) record('P4-8', 'blocking', 'Blinkendes Element gefunden', '#farbwelten/zeitleiste');

// Automatische Musik / Audio: keine AudioContext-Nutzung ohne Klick, keine media-Elemente mit autoplay.
const audio = await page.evaluate(() => ({
  autoplay: [...document.querySelectorAll('audio,video')].filter((n) => n.autoplay || !n.paused).length,
  media: document.querySelectorAll('audio,video').length,
}));
notes.audio = audio;
if (audio.autoplay) record('P4-9', 'blocking', 'Automatisch startendes Audio/Video', '#farbwelten');

// Zeitleiste: Filter per Tastatur, Statusmeldung, aria-pressed, Chronologie.
await page.goto(`${base}/#farbwelten/zeitleiste`);
await page.waitForTimeout(300);
const timeline = await page.evaluate(() => {
  const root = document.getElementById('farbweltenRoot');
  const events = [...root.querySelectorAll('.fw-timeline__event')];
  const years = events.map((node) => Number(node.dataset.year || node.querySelector('.fw-timeline__year')?.textContent.replace(/\D/g, '')));
  return {
    count: events.length,
    filters: [...root.querySelectorAll('.fw-tl-filter')].map((node) => ({
      strand: node.dataset.strand,
      pressed: node.getAttribute('aria-pressed'),
      label: node.textContent.trim(),
    })),
    years,
    sorted: years.every((year, index) => index === 0 || years[index - 1] <= year),
    status: document.getElementById('fwTimelineStatus')?.textContent.trim(),
    listTag: root.querySelector('.fw-timeline')?.tagName,
  };
});
await page.locator('.fw-tl-filter[data-strand="chakra"]').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
const timelineFiltered = await page.evaluate(() => {
  const root = document.getElementById('farbweltenRoot');
  return {
    pressed: [...root.querySelectorAll('.fw-tl-filter[aria-pressed="true"]')].map((n) => n.dataset.strand),
    visible: [...root.querySelectorAll('.fw-timeline__event')].filter((n) => !n.hidden).length,
    status: document.getElementById('fwTimelineStatus')?.textContent.trim(),
  };
});
notes.timeline = { timeline, timelineFiltered };
if (!timeline.sorted) record('P3-6', 'major', 'Zeitleiste nicht chronologisch', '#farbwelten/zeitleiste');
if (timelineFiltered.pressed[0] !== 'chakra') record('P3-7', 'major', 'Zeitleiste: Filter per Enter wirkt nicht', '#farbwelten/zeitleiste');
if (!/von \d+/.test(timelineFiltered.status || '')) record('P3-8', 'minor', `Zeitleiste: keine Statusmeldung („${timelineFiltered.status}“)`, '#farbwelten/zeitleiste');

// Netzwerkmonitor über alle neuen Ansichten: keine Fremdanfragen, keine Fonts.
const external = [];
page.on('request', (request) => {
  const url = request.url();
  if (!url.startsWith(base) && !url.startsWith('data:') && !url.startsWith('blob:')) external.push({ page: page.url(), url });
});
for (const hash of ['#farbwelten/kompass', '#farbwelten/farbmeditation', '#farbwelten/zeitleiste', '#farbwelten/tuerkis', '#farbwelten/magenta']) {
  await page.goto(`${base}/${hash}`);
  await page.waitForTimeout(250);
}
const fonts = await page.evaluate(() =>
  [...document.fonts].map((face) => ({ family: face.family, status: face.status })).slice(0, 10)
);
notes.network = { external, fonts };
if (external.length) record('P7-1', 'blocking', `Fremdanfragen: ${JSON.stringify(external.slice(0, 5))}`, 'neue Routen');
if (consoleErrors.length) record('P1-1', 'blocking', `Konsolenfehler: ${JSON.stringify(consoleErrors.slice(0, 5))}`, 'neue Routen');
if (pageErrors.length) record('P1-2', 'blocking', `Seitenfehler: ${JSON.stringify(pageErrors.slice(0, 5))}`, 'neue Routen');

await browser.close();
server.close();
const summary = {
  findings,
  blocking: findings.filter((f) => f.severity === 'blocking').length,
  major: findings.filter((f) => f.severity === 'major').length,
  minor: findings.filter((f) => f.severity === 'minor').length,
};
fs.writeFileSync(out, JSON.stringify({ summary, notes }, null, 2));
console.log(JSON.stringify(summary, null, 2));
