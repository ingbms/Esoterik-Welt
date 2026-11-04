/**
 * Vergleich der Build-Manifeste: Determinismus (pilot vs. pilot2) und
 * "andere Seiten unverändert" (baseline vs. pilot).
 * Ausgabe: evidence/qa-toc-436eeffb/compare.json + Konsolenauszug.
 */
import fs from 'node:fs';
import path from 'node:path';
import { EVID, writeJson } from './lib.mjs';

const load = (name) => JSON.parse(fs.readFileSync(path.join(EVID, `manifest-${name}.json`), 'utf8'));
const pilot = load('pilot');
const pilot2 = load('pilot2');
const baseline = load('baseline');

const diffKeys = (a, b) => {
  const keys = new Set([...Object.keys(a.files), ...Object.keys(b.files)]);
  const added = [];
  const removed = [];
  const changed = [];
  for (const key of keys) {
    if (!(key in a.files)) added.push(key);
    else if (!(key in b.files)) removed.push(key);
    else if (a.files[key] !== b.files[key]) changed.push(key);
  }
  return { added, removed, changed };
};

const determinism = diffKeys(pilot, pilot2);
const vsBaseline = diffKeys(baseline, pilot);

const idSet = (m) => m.pilotIds.map((i) => `${i.depth}:${i.id}`);
const baselineIds = idSet(baseline);
const pilotIds = idSet(pilot);

const staticBaseline = JSON.parse(fs.readFileSync(path.join(EVID, 'static-inventory-baseline.json'), 'utf8'));
const staticPilot = JSON.parse(fs.readFileSync(path.join(EVID, 'static-inventory-pilot.json'), 'utf8'));

const radiasthesieBaseline = Object.fromEntries(staticBaseline.radiasthesie.map((r) => [r.rel, r.asideLinks]));
const radiasthesiePilot = Object.fromEntries(staticPilot.radiasthesie.map((r) => [r.rel, r.asideLinks]));

const out = {
  generatedAt: new Date().toISOString(),
  determinism: {
    ...determinism,
    identicalToVerbatim: determinism.added.length + determinism.removed.length + determinism.changed.length === 0,
    css: { pilot: pilot.assets.css, pilot2: pilot2.assets.css },
    tocScript: { pilot: pilot.assets.tocScript, pilot2: pilot2.assets.tocScript },
  },
  otherPages: {
    htmlFilesPilot: pilot.htmlFiles,
    htmlFilesBaseline: baseline.htmlFiles,
    ...vsBaseline,
    onlyPilotChanged: vsBaseline.changed.length === 1 && vsBaseline.changed[0] === 'frequenzen/quellen.html' && vsBaseline.added.length === 0 && vsBaseline.removed.length === 0,
  },
  headingIds: {
    baselineCount: baselineIds.length,
    pilotCount: pilotIds.length,
    identical: JSON.stringify(baselineIds) === JSON.stringify(pilotIds),
    diff: baselineIds.filter((id, i) => id !== pilotIds[i]),
  },
  radiasthesie: { baseline: radiasthesieBaseline, pilot: radiasthesiePilot, identical: JSON.stringify(radiasthesieBaseline) === JSON.stringify(radiasthesiePilot) },
  farbwelten: {
    baseline: staticBaseline.dups.find((d) => d.rel === 'farbwelten/index.html') || null,
    pilot: staticPilot.dups.find((d) => d.rel === 'farbwelten/index.html') || null,
  },
  budgets: {
    cssBaselineGzip: baseline.assets.css.map((c) => c.gzip),
    cssPilotGzip: pilot.assets.css.map((c) => c.gzip),
    cssDeltaGzip: pilot.assets.css.reduce((a, c) => a + c.gzip, 0) - baseline.assets.css.reduce((a, c) => a + c.gzip, 0),
    tocScriptGzip: pilot.assets.tocScript.map((c) => c.gzip),
    tocScriptBytes: pilot.assets.tocScript.map((c) => c.bytes),
  },
};

writeJson('compare.json', out);
console.log(JSON.stringify({
  determinism: out.determinism.identicalToVerbatim,
  determinismDiff: out.determinism.changed,
  otherPagesOnlyPilotChanged: out.otherPages.onlyPilotChanged,
  changedPages: out.otherPages.changed,
  added: out.otherPages.added,
  removed: out.otherPages.removed,
  headingIdsIdentical: out.headingIds.identical,
  headingIdsDiff: out.headingIds.diff,
  radiasthesieIdentical: out.radiasthesie.identical,
  radiasthesie: out.radisthesie,
  farbwelten: out.farbwelten,
  budgets: out.budgets,
}, null, 2));
