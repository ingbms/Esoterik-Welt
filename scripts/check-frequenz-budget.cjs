// Budget-Gate des Frequenzlabors (ADR §7.1, NFR-1/2/3).
//
// NFR-1  initialer statischer JS-Graph ≤ 90.000 B + 2.000 B gzip-9
//        (Basis 84.275 B bis 03.11.2026; Erhöhung durch Eigentümerentscheidung
//        nach der Rubriken-Integration, ADR §14. Gesamtlimit 92.000 B.)
// NFR-2  gesamtes Feature-JS (js/modules/frequenz*.js) ≤ 100.000 B gzip-9
// NFR-3  Feature-CSS (css/frequenzlabor.css) ≤ 6.000 B gzip-9
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const gzip = (buffer) => zlib.gzipSync(buffer, { level: 9 }).length;
const BASELINE_GZIP = 90000;
const INITIAL_HEADROOM = 2000;
const FEATURE_JS_LIMIT = 100000;
const FEATURE_CSS_LIMIT = 6000;
// Warnschwelle (NFR-1-Reserve, QA-Befund m-5): ab 95 % Auslastung bleibt das
// Gate grün, meldet aber eine Warnung im Log. Die Reserve des Initialgraphen ist
// bewusst klein und wird deshalb dauerhaft beobachtet (docs/frequenzlabor-ui.md).
const WARN_RATIO = 0.95;

function staticGraph(entry) {
  const seen = new Set();
  const walk = (absolute) => {
    const resolved = path.resolve(absolute);
    if (seen.has(resolved) || !fs.existsSync(resolved)) return;
    seen.add(resolved);
    const source = fs.readFileSync(resolved, 'utf8');
    for (const match of source.matchAll(/import\s+(?:[^'"]*?\s+from\s+)?['"](\.[^'"]+)['"]/g)) {
      walk(path.resolve(path.dirname(resolved), match[1]));
    }
  };
  walk(entry);
  return [...seen];
}

function featureFiles() {
  const dir = path.join(root, 'js/modules');
  return fs
    .readdirSync(dir)
    .filter((name) => /^frequenz.*\.js$/.test(name) && !name.endsWith('.d.ts'))
    .sort()
    .map((name) => path.join(dir, name));
}

const failures = [];

const graph = staticGraph(path.join(root, 'js/main.js'));
const graphRaw = graph.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const graphGzip = graph.reduce((sum, file) => sum + gzip(fs.readFileSync(file)), 0);
const graphLimit = BASELINE_GZIP + INITIAL_HEADROOM;

const features = featureFiles();
if (!features.length) failures.push('keine js/modules/frequenz*.js gefunden');
const featureSource = features
  .map((file) => fs.readFileSync(file))
  .reduce((a, b) => Buffer.concat([a, b]), Buffer.alloc(0));
const featureGzip = features.length ? gzip(featureSource) : 0;

const cssPath = path.join(root, 'css/frequenzlabor.css');
const cssGzip = fs.existsSync(cssPath) ? gzip(fs.readFileSync(cssPath)) : 0;
if (!fs.existsSync(cssPath)) failures.push('css/frequenzlabor.css fehlt');

if (graphGzip > graphLimit) failures.push(`NFR-1 verletzt: ${graphGzip} B > ${graphLimit} B`);
if (featureGzip > FEATURE_JS_LIMIT) failures.push(`NFR-2 verletzt: ${featureGzip} B > ${FEATURE_JS_LIMIT} B`);
if (cssGzip > FEATURE_CSS_LIMIT) failures.push(`NFR-3 verletzt: ${cssGzip} B > ${FEATURE_CSS_LIMIT} B`);

const rows = [
  ['NFR-1 Initialgraph (statisch)', `${graph.length} Dateien`, graphRaw, graphGzip, graphLimit],
  ['NFR-2 Feature-JS', `${features.length} Dateien`, featureSource.length, featureGzip, FEATURE_JS_LIMIT],
  [
    'NFR-3 Feature-CSS',
    'css/frequenzlabor.css',
    fs.existsSync(cssPath) ? fs.statSync(cssPath).size : 0,
    cssGzip,
    FEATURE_CSS_LIMIT,
  ],
];

console.log('Budget-Prüfung Frequenzlabor (gzip -9)');
for (const [name, scope, raw, gz, limit] of rows) {
  const state = gz > limit ? 'FAIL' : gz > limit * WARN_RATIO ? 'WARN' : 'ok  ';
  console.log(
    `${state} ${name.padEnd(32)} ${scope.padEnd(24)} ${String(raw).padStart(7)} B roh ${String(gz).padStart(7)} B gz  Limit ${limit} B`
  );
}

const warnings = [];
for (const [name, , , gz, limit] of rows) {
  if (gz <= limit && gz > limit * WARN_RATIO) {
    const reserve = limit - gz;
    const used = ((gz / limit) * 100).toFixed(1).replace('.', ',');
    warnings.push(`${name}: ${used} % ausgelastet, Reserve ${reserve} B (${gz} B / ${limit} B)`);
  }
}
for (const warning of warnings) {
  console.warn(`⚠ Reserve unter ${Math.round((1 - WARN_RATIO) * 100)} %: ${warning}`);
}

if (failures.length) {
  for (const failure of failures) console.error('✗ ' + failure);
  process.exitCode = 1;
} else if (warnings.length) {
  console.warn(
    `✓ Alle Budgets eingehalten, aber ${warnings.length} Warnung(en) wegen kleiner Reserve ` +
      `(bewusst überwacht, siehe docs/frequenzlabor-ui.md §2.1 „Budget und Reserve").`
  );
} else {
  console.log(`✓ Alle Budgets eingehalten (Reserve überall größer als ${Math.round((1 - WARN_RATIO) * 100)} %).`);
}
