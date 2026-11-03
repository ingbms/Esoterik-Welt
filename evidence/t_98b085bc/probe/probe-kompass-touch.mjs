// Nachweis B1: Farben-Kompass für alle zwölf Farbwelten, Maus und Pfeiltaste.
// Nachweis B3: Trefferfläche der Fließtext-Links bei 390 px.
// Aufruf: node probe-kompass-touch.mjs <base-url> <ausgabe.json>
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:8137/Esoterik-Welt/';
const output = process.argv[3] || 'evidence/t_98b085bc/kompass-touch.json';

// Erwartung je Farbwelt: Name, Typ-Zeile, erste Assoziation.
const EXPECT = {
  tuerkis: { name: 'Türkis (Cyan)', type: 'Spektralfarbe', assoc: 'GREEN–BLUE' },
  magenta: { name: 'Magenta', type: 'nicht spektral', assoc: 'bestärkend' },
  rosa: { name: 'Rosa', type: 'nicht spektral', assoc: 'Sanftheit' },
  weiss: { name: 'Weiß', type: 'Neutralfarbe', assoc: 'Klarheit' },
  schwarz: { name: 'Schwarz', type: 'Neutralfarbe', assoc: 'Macht' },
};
const ORDER = ['rot', 'orange', 'gelb', 'gruen', 'tuerkis', 'blau', 'indigo', 'violett', 'magenta', 'rosa', 'weiss', 'schwarz'];

const browser = await chromium.launch();
const report = { base, options: 0, mouse: [], keys: [], touch: {}, errors: [], failures: [] };
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
});

await page.goto(`${base}#farbwelten/kompass`, { waitUntil: 'networkidle' });
report.options = await page.locator('input[name="fwCompassColor"]').count();
report.label = await page.locator('#kompass .label').first().textContent();
if (report.options !== 12) report.failures.push(`Kompass-Optionen: ${report.options} statt 12`);

const panelState = async () =>
  page.evaluate(() => ({
    name: document.querySelector('#fwCompassName')?.textContent || '',
    meta: document.querySelector('.fw-kompass__meta')?.textContent || '',
    assoc: [...document.querySelectorAll('.fw-kompass__assoc li')].map((node) => node.textContent),
    status: document.querySelector('#fwCompassSummary')?.textContent || '',
  }));

// --- Maus: jede der fünf Farbwelten direkt anklicken ------------------------
for (const id of Object.keys(EXPECT)) {
  const expected = EXPECT[id];
  await page.locator(`input[name="fwCompassColor"][value="${id}"]`).check();
  await page.waitForTimeout(60);
  const state = await panelState();
  const entry = { id, ...state, ok: true };
  const check = (condition, message) => {
    if (!condition) {
      entry.ok = false;
      report.failures.push(`${id} (Maus): ${message}`);
    }
  };
  check(state.name === expected.name, `Name „${state.name}“ statt „${expected.name}“`);
  check(state.meta.startsWith(expected.type), `Typ-Zeile „${state.meta}“ ohne „${expected.type}“`);
  check(state.meta.includes('nm') === (expected.type === 'Spektralfarbe'), `Messwertzeile in „${state.meta}“`);
  check(state.assoc.some((label) => label.includes(expected.assoc)), `Assoziation „${expected.assoc}“ fehlt`);
  check(state.status.startsWith(`${expected.name}:`), `Status „${state.status.slice(0, 40)}“ nennt die alte Farbe`);
  report.mouse.push(entry);
}

// --- Tastatur: erster Radio, dann Pfeilrechts bis zur Zielposition ----------
await page.goto(`${base}#farbwelten/kompass`, { waitUntil: 'networkidle' });
await page.locator('input[name="fwCompassColor"]').first().focus();
let index = 0;
for (const id of Object.keys(EXPECT)) {
  const target = ORDER.indexOf(id);
  while (index < target) {
    await page.keyboard.press('ArrowRight');
    index += 1;
    await page.waitForTimeout(40);
  }
  const expected = EXPECT[id];
  const state = await panelState();
  const checked = await page.locator('input[name="fwCompassColor"]:checked').getAttribute('value');
  const focused = await page.evaluate(() => document.activeElement?.value || '');
  const entry = { id, checked, focused, ...state, ok: true };
  const check = (condition, message) => {
    if (!condition) {
      entry.ok = false;
      report.failures.push(`${id} (Pfeiltaste): ${message}`);
    }
  };
  check(checked === id, `ausgewählt ist „${checked}“`);
  check(focused === id, `fokussiert ist „${focused}“`);
  check(state.name === expected.name, `Name „${state.name}“ statt „${expected.name}“`);
  check(state.meta.startsWith(expected.type), `Typ-Zeile „${state.meta}“ ohne „${expected.type}“`);
  check(state.assoc.some((label) => label.includes(expected.assoc)), `Assoziation „${expected.assoc}“ fehlt`);
  check(state.status.startsWith(`${expected.name}:`), `Status „${state.status.slice(0, 40)}“ nennt die alte Farbe`);
  report.keys.push(entry);
}

// --- B3: Trefferflächen der Fließtext-Links bei 390 px ---------------------
const touchContext = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
const touchPage = await touchContext.newPage();
touchPage.on('pageerror', (error) => report.errors.push(`pageerror(390): ${error.message}`));
const links = [];
for (const slug of ['farbtherapie', 'farbpsychologie', 'lichtmedizin']) {
  await touchPage.goto(`${base}#farbwelten/${slug}`, { waitUntil: 'networkidle' });
  const found = await touchPage.evaluate(() =>
    [...document.querySelectorAll('#farbweltenRoot a.fw-inline-link')].map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        text: node.textContent.trim(),
        href: node.getAttribute('href'),
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        decoration: style.textDecorationLine,
        underlineOffset: style.textUnderlineOffset,
      };
    })
  );
  for (const link of found) links.push({ route: slug, ...link });
}
report.touch.links = links;
report.touch.minHeight = links.length ? Math.min(...links.map((link) => link.height)) : null;
const tooSmall = links.filter((link) => link.height < 32);
if (tooSmall.length) report.failures.push(`Touch-Ziele unter 32 px: ${tooSmall.length}`);
const withoutUnderline = links.filter((link) => !link.decoration.includes('underline'));
if (withoutUnderline.length) report.failures.push(`Links ohne Unterstreichung: ${withoutUnderline.length}`);
if (!links.length) report.failures.push('keine Fließtext-Links gefunden');

await browser.close();
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      options: report.options,
      label: report.label,
      mouse: report.mouse.map((entry) => `${entry.id}:${entry.ok ? 'PASS' : 'FAIL'} ${entry.meta}`),
      keys: report.keys.map((entry) => `${entry.id}:${entry.ok ? 'PASS' : 'FAIL'} ${entry.meta}`),
      touch: { count: links.length, minHeight: report.touch.minHeight },
      errors: report.errors,
      failures: report.failures,
    },
    null,
    2
  )
);
if (report.failures.length || report.errors.length) process.exitCode = 1;
