'use strict';
// Unabhaengige Gegenpruefung des Design-Katalogs gegen die ausgelieferten CSS-Dateien.
//
//   node scripts/migration-baseline/verify-design-catalog-independent.cjs
//
// Dieses Skript benutzt bewusst KEINE Funktion aus verify-design-catalog.cjs,
// lib/catalog.cjs oder inventory-baseline.cjs: es liest den Katalog und die CSS-Dateien
// mit eigenen Parsern, damit ein Fehler in der Erhebung nicht durch denselben Code
// "bestaetigt" wird. Ergebnis:
//   docs/migration-baseline/evidence/design-review/catalog-crosscheck.json
//
// Geprueft wird nur, was aus dem Katalog selbst ableitbar ist:
//   T1 Token-Name existiert in :root von css/design-system.css
//   T2 Token-Wert stimmt mit der CSS-Deklaration ueberein (normalisiert)
//   T3 Token-Zeile zeigt auf die Deklaration
//   C1 Komponente/Layout/Muster/Zustand: Quelldatei existiert
//   C2 Selektor steht im angegebenen Zeilenfenster
//   B1 Umbruchbreite steht in mindestens zwei CSS-Dateien

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const CATALOG = path.join(ROOT, 'docs', 'migration-baseline', 'design-catalog.json');
const OUT = path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'design-review');
const CSS_DIR = path.join(ROOT, 'css');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function cssFiles() {
  return fs
    .readdirSync(CSS_DIR)
    .filter((name) => name.endsWith('.css'))
    .map((name) => ({ name, text: read(path.join(CSS_DIR, name)) }));
}

// :root-Block(e) mit eigener Klammerzaehlung lesen (keine Regex auf den ganzen Block).
function rootDeclarations(text) {
  const declarations = [];
  const lines = text.split(/\r?\n/);
  let depth = 0;
  let inRoot = false;
  let rootStart = -1;
  lines.forEach((line, index) => {
    const selectorMatch = line.match(/(^|\})([^{}]*)\{\s*$/);
    if (depth === 0 && /:root\b/.test(line) && !inRoot) {
      inRoot = true;
      rootStart = index + 1;
    }
    for (const char of line) {
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (inRoot && depth === 0) inRoot = false;
      }
    }
    const decl = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/i);
    if (inRoot && decl) {
      declarations.push({ name: decl[1], value: decl[2].trim(), line: index + 1, rootStart });
    }
    if (selectorMatch) {
      // nur zur Vollstaendigkeit gelesen; die Zuordnung erfolgt ueber :root-Test oben
    }
  });
  return declarations;
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^#([0-9a-f]{3})$/, (_, hex) => `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`)
    .trim();
}

function lineWindow(spec) {
  if (!spec) return null;
  const numbers = String(spec).match(/\d+/g);
  if (!numbers) return null;
  const values = numbers.map(Number);
  if (values.length === 1) return [values[0] - 2, values[0] + 2];
  const sorted = values.sort((a, b) => a - b);
  return [sorted[0] - 2, sorted[1] + 2];
}

function selectorOccurrences(text, selector) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/["']/g, ''));
  const hits = [];
  // Selektorlisten wie "em, .italic" werden getrennt geprueft; Anfuehrungszeichen werden auf
  // beiden Seiten entfernt, weil das CSS einfache und doppelte Schreibweise mischt.
  const candidates = String(selector)
    .replace(/["']/g, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  candidates.forEach((candidate) => {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`);
    lines.forEach((line, index) => {
      if (pattern.test(line) && !hits.includes(index + 1)) hits.push(index + 1);
    });
  });
  return hits.sort((a, b) => a - b);
}

function hardcodedColors(files) {
  // Kommentare leeren (Zeilennummern erhalten): Farbnamen in Kommentaren sind keine Deklarationen.
  const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  const skipSelector = /(:root\b|\[data-theme=['"]light['"]\]|@media[^{]*print)/;
  // Nur echte Farbwerte: 3/4/6/8 Hex-Ziffern als eigenes Token. #featureGrid ist keine Farbe.
  const colorPattern = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w-])/gi;
  const found = [];
  for (const file of files) {
    const lines = stripComments(file.text).split(/\r?\n/);
    let depth = 0;
    let skipDepth = null;
    lines.forEach((line, index) => {
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;
      if (skipDepth === null && skipSelector.test(line) && opens > 0) {
        skipDepth = depth;
      }
      if (skipDepth === null) {
        const matches = line.match(colorPattern);
        if (matches) {
          for (const match of matches) found.push({ file: file.name, line: index + 1, color: match.toLowerCase() });
        }
      }
      depth += opens - closes;
      if (skipDepth !== null && depth <= skipDepth) skipDepth = null;
    });
  }
  const colors = [...new Set(found.map((item) => item.color))];
  return {
    occurrences: found.length,
    distinct: colors.length,
    colors,
    detail: found,
  };
}

function main() {
  const negative = process.argv.includes('--negative');
  const catalog = JSON.parse(read(CATALOG));
  let entries = catalog.entries || [];
  if (negative) {
    // Negativkontrolle: vier kuenstliche Fehler, die der Pruefer finden MUSS.
    entries = entries.concat([
      {
        id: 'NEG-01',
        name: '.gibt-es-nicht',
        type: 'component',
        source: { path: 'css/design-system.css', selector: '.gibt-es-nicht', lines: 'L1–L5' },
      },
      {
        id: 'NEG-02',
        name: '--color-bg-deep',
        type: 'token-color',
        value: '#123456',
        source: { path: 'css/design-system.css', selector: ':root', lines: 'L42' },
      },
      {
        id: 'NEG-03',
        name: '--token-den-es-nicht-gibt',
        type: 'token-color',
        value: '#000000',
        source: { path: 'css/design-system.css', selector: ':root', lines: 'L42' },
      },
      {
        id: 'NEG-04',
        name: '999px',
        value: '999px',
        type: 'breakpoint',
        source: { path: 'css/design-system.css', selector: '@media', lines: 'L1' },
      },
    ]);
  }
  const files = cssFiles();
  const mainCss = files.find((file) => file.name === 'design-system.css');
  if (!mainCss) {
    console.error('css/design-system.css fehlt');
    process.exit(2);
  }
  const rootDecls = rootDeclarations(mainCss.text);
  const rootByName = new Map(rootDecls.map((decl) => [decl.name, decl]));

  const findings = [];
  const checked = { tokens: 0, components: 0, breakpoints: 0 };
  const tokenTypes = new Set([
    'token-color',
    'token-space',
    'token-radius',
    'token-shadow',
    'token-font',
    'token-z',
    'token-size',
    'token-breakpoint',
    'token',
  ]);

  for (const entry of entries) {
    const type = String(entry.type || '');
    const source = entry.source || {};
    if (type.startsWith('token')) {
      checked.tokens += 1;
      const name = entry.name;
      const decl = rootByName.get(name);
      if (!decl) {
        findings.push({ check: 'T1', id: entry.id, level: 'error', detail: `Token ${name} fehlt in :root` });
        continue;
      }
      if (entry.value !== undefined && normalize(entry.value) !== normalize(decl.value)) {
        findings.push({
          check: 'T2',
          id: entry.id,
          level: 'error',
          detail: `Katalogwert ${entry.value} != CSS ${decl.value} (${name})`,
        });
      }
      const window = lineWindow(source.lines);
      if (window && (decl.line < window[0] || decl.line > window[1])) {
        findings.push({
          check: 'T3',
          id: entry.id,
          level: 'warn',
          detail: `${name}: Katalogzeile ${source.lines}, CSS-Zeile ${decl.line}`,
        });
      }
      continue;
    }

    if (type === 'breakpoint') {
      checked.breakpoints += 1;
      const width = String(entry.value || entry.name || '').match(/(\d{3,4})/);
      if (!width) {
        findings.push({ check: 'B1', id: entry.id, level: 'warn', detail: 'keine Breite erkennbar' });
        continue;
      }
      const px = width[1];
      // Nur Treffer in einer Media-Query zaehlen: 999px als border-radius ist kein Umbruchpunkt.
      const hits = files.filter((file) =>
        file.text.split(/\r?\n/).some((line) => /@media/.test(line) && new RegExp(`${px}px`).test(line))
      );
      if (hits.length < 2) {
        findings.push({
          check: 'B1',
          id: entry.id,
          level: 'error',
          detail: `${px}px nur in ${hits.map((hit) => hit.name).join(', ') || 'keiner Datei'}`,
        });
      }
      continue;
    }

    // Komponenten, Layouts, Muster, Zustaende, Icons, Illustrationen
    checked.components += 1;
    if (!source.path) {
      findings.push({ check: 'C1', id: entry.id, level: 'warn', detail: 'source.path fehlt' });
      continue;
    }
    const file = path.join(ROOT, source.path);
    if (!fs.existsSync(file)) {
      findings.push({
        check: 'C1',
        id: entry.id,
        level: 'error',
        detail: `${source.path} existiert nicht`,
      });
      continue;
    }
    if (!source.selector) continue;
    const text = read(file);
    const hits = selectorOccurrences(text, source.selector);
    if (!hits.length) {
      // Mehrzeiliges Markup: ein Attributselektor wie svg[aria-hidden="true"] steht im HTML
      // nie in einer Zeile. Dann genuegt, dass Tag und Attribut in der Datei vorkommen.
      const attribute = String(source.selector).match(/^([a-z0-9]+)\[([a-z-]+)/i);
      if (attribute) {
        const [, tag, attr] = attribute;
        if (new RegExp(`<${tag}\\b`, 'i').test(text) && new RegExp(attr, 'i').test(text)) {
          continue;
        }
      }
      findings.push({
        check: 'C2',
        id: entry.id,
        level: 'error',
        detail: `Selektor ${source.selector} nicht in ${source.path}`,
      });
      continue;
    }
    const window = lineWindow(source.lines);
    if (window && !hits.some((line) => line >= window[0] && line <= window[1])) {
      findings.push({
        check: 'C2',
        id: entry.id,
        level: 'warn',
        detail: `${source.selector}: Katalog ${source.lines}, Treffer ${hits.slice(0, 4).join('/')}`,
      });
    }
  }

  const result = {
    generated_at: new Date().toISOString(),
    catalog: path.relative(ROOT, CATALOG).replace(/\\/g, '/'),
    base_commit: catalog.base_commit || null,
    entries: entries.length,
    root_tokens_in_css: rootDecls.length,
    checked,
    counts_by_type: entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {}),
    status_counts: entries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {}),
    hardcoded_colors: (() => {
      const scan = hardcodedColors(files);
      return { occurrences: scan.occurrences, distinct: scan.distinct, colors: scan.colors };
    })(),
    findings,
    errors: findings.filter((finding) => finding.level === 'error').length,
    warnings: findings.filter((finding) => finding.level === 'warn').length,
  };
  fs.mkdirSync(OUT, { recursive: true });
  // Die Negativkontrolle darf den sauberen Beleg nicht ueberschreiben: sonst zeigt
  // catalog-crosscheck.json die mutierten Zahlen (279 Eintraege, 4 erwartete Fehler)
  // statt des geprueften Katalogs und der naechste Leser haelt den Katalog fuer fehlerhaft.
  const outFile = negative ? 'catalog-crosscheck-negative.json' : 'catalog-crosscheck.json';
  fs.writeFileSync(path.join(OUT, outFile), `${JSON.stringify(result, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        entries: result.entries,
        rootTokensInCss: result.root_tokens_in_css,
        checked: result.checked,
        countsByType: result.counts_by_type,
        statusCounts: result.status_counts,
        errors: result.errors,
        warnings: result.warnings,
        sample: findings.slice(0, 12),
      },
      null,
      2
    )
  );
  if (negative) {
    // In der Negativkontrolle sind Fehler das erwartete Ergebnis: Erfolg heisst,
    // dass alle vier kuenstlichen Fehler erkannt wurden.
    const caught = new Set(
      findings.filter((finding) => /^NEG-\d+$/.test(finding.id || '')).map((finding) => finding.id)
    );
    console.log(JSON.stringify({ negative: true, caught: [...caught].sort(), expected: 4 }));
    process.exit(caught.size === 4 ? 0 : 1);
  }
  process.exit(result.errors ? 1 : 0);
}

main();
