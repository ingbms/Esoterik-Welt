'use strict';
// Prueft design-catalog.json gegen den tatsaechlichen Quellbestand der Baseline.
// Der Katalogpruefer (validate-catalogs.cjs) prueft nur Form und Enums; dieses Skript
// prueft die Vollstaendigkeit und die Belegbarkeit:
//
//   1. Token-Vollstaendigkeit: jede Custom Property in :root hat genau einen Eintrag,
//      Wert und Zeile stimmen mit css/design-system.css ueberein (170 Tokens).
//   2. Light-Block: die 14 Overrides erhalten keinen eigenen Eintrag, sind aber am
//      zugehoerigen Token vermerkt.
//   3. Umbruchpunkte: genau die 13 Breiten, die in mindestens zwei CSS-Dateien vorkommen.
//   4. Klassen-Praefixe: jedes der 38 Praefixe ist katalogisiert oder in der
//      Ausschlusstabelle von docs/migration-baseline/design-katalog-luecken.md begruendet.
//   5. Quellen: Datei existiert, Zeilen liegen im Dokument, CSS-Selektor steht im
//      angegebenen Zeilenbereich.
//   6. Nachweise: repo-relative Pfade in evidence[] existieren.
//
//   node scripts/migration-baseline/verify-design-catalog.cjs
//   node scripts/migration-baseline/verify-design-catalog.cjs --json
//
// Exit 1 bei mindestens einem Befund.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const CATALOG = path.join(ROOT, 'docs', 'migration-baseline', 'design-catalog.json');
const INVENTORY = path.join(ROOT, 'docs', 'migration-baseline', 'inventory-baseline.json');
const DESIGN_CSS = 'css/design-system.css';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function lines(rel) {
  return read(rel).split(/\r?\n/);
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// --- :root-Block (erste Definition) und Light-Block lesen
function rootTokens() {
  const text = read(DESIGN_CSS);
  const all = text.split(/\r?\n/);
  const startIndex = all.findIndex((line) => /^:root \{/.test(line));
  if (startIndex < 0) throw new Error(':root-Block nicht gefunden');
  const tokens = [];
  for (let i = startIndex + 1; i < all.length; i += 1) {
    const line = all[i];
    if (/^\}/.test(line)) break;
    const match = line.match(/^\s*(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/);
    if (match) tokens.push({ name: match[1], value: match[2].trim(), line: i + 1 });
  }
  return tokens;
}

function lightTokens() {
  const text = read(DESIGN_CSS);
  const all = text.split(/\r?\n/);
  const startIndex = all.findIndex((line) => /^\[data-theme='light'\] \{/.test(line));
  if (startIndex < 0) throw new Error('Light-Block nicht gefunden');
  const tokens = [];
  for (let i = startIndex + 1; i < all.length; i += 1) {
    if (/^\}/.test(all[i])) break;
    const match = all[i].match(/^\s*(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/);
    if (match) tokens.push({ name: match[1], value: match[2].trim(), line: i + 1 });
  }
  return tokens;
}

function parseRange(value) {
  const match = /^L(\d+)(?:-L(\d+))?$/.exec(value || '');
  if (!match) return null;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  return { start, end };
}

function normalise(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function main() {
  const findings = [];
  const add = (level, code, where, message) => findings.push({ level, code, where, message });
  const doc = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const inventory = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const entries = doc.entries;

  if (doc.base_commit !== inventory.base_commit) {
    add(
      'error',
      'BASE_COMMIT',
      'design-catalog.json',
      `base_commit ${doc.base_commit} passt nicht zum Inventar ${inventory.base_commit}`
    );
  }

  // --- 1. Tokens
  const source = rootTokens();
  const tokens = entries.filter((entry) => entry.type.startsWith('token-'));
  const byName = new Map();
  for (const token of tokens) {
    if (byName.has(token.name)) add('error', 'TOKEN_DOUBLE', token.id, `${token.name} ist doppelt katalogisiert`);
    byName.set(token.name, token);
  }
  for (const token of source) {
    const entry = byName.get(token.name);
    if (!entry) {
      add('error', 'TOKEN_MISSING', token.name, `:root-Token ohne Katalogeintrag (L${token.line})`);
      continue;
    }
    if (entry.value !== token.value)
      add(
        'error',
        'TOKEN_VALUE',
        entry.id,
        `${token.name}: Katalogwert "${entry.value}" != Quelle "${token.value}" (L${token.line})`
      );
    if (entry.source.path !== DESIGN_CSS)
      add('error', 'TOKEN_SOURCE', entry.id, `${token.name}: Quelle ist ${entry.source.path}, erwartet ${DESIGN_CSS}`);
    const range = parseRange(entry.source.lines);
    if (!range || range.start !== token.line)
      add('error', 'TOKEN_LINE', entry.id, `${token.name}: Zeile ${entry.source.lines} != L${token.line}`);
  }
  for (const name of byName.keys()) {
    if (!source.some((token) => token.name === name))
      add('error', 'TOKEN_ORPHAN', byName.get(name).id, `${name} steht nicht in :root (veralteter Eintrag?)`);
  }
  if (tokens.length !== 170)
    add('error', 'TOKEN_COUNT', 'design-catalog.json', `${tokens.length} Token-Eintraege, erwartet 170`);

  // Typklassifikation gegen den Namen pruefen
  const expectedType = (name) => {
    if (
      name.startsWith('--fw-') ||
      name.startsWith('--color-') ||
      name === '--surface-ghost' ||
      name === '--border-glow-subtle'
    )
      return 'token-color';
    if (name.startsWith('--font-') || name.startsWith('--text-') || name.startsWith('--font-weight-'))
      return 'token-typography';
    if (name.startsWith('--space-') || name === '--gutter') return 'token-space';
    if (name.startsWith('--radius-')) return 'token-radius';
    if (name.startsWith('--shadow-')) return 'token-shadow';
    if (name.startsWith('--transition-')) return 'token-motion';
    if (name.startsWith('--z-')) return 'token-z';
    return 'token-size';
  };
  for (const token of tokens) {
    if (token.type !== expectedType(token.name))
      add('error', 'TOKEN_TYPE', token.id, `${token.name} ist ${token.type}, erwartet ${expectedType(token.name)}`);
  }

  // --- 2. Light-Block
  const light = lightTokens();
  for (const override of light) {
    const entry = byName.get(override.name);
    if (!entry) {
      add('error', 'LIGHT_ENTRY', override.name, `Light-Override ohne Token-Eintrag (L${override.line})`);
      continue;
    }
    if (!/light/i.test(entry.notes || ''))
      add(
        'error',
        'LIGHT_NOTES',
        entry.id,
        `${override.name}: Light-Override in L${override.line} ist nicht in notes vermerkt`
      );
  }
  if (light.length !== inventory.design_tokens.light_block_token_count) {
    add(
      'error',
      'LIGHT_COUNT',
      DESIGN_CSS,
      `${light.length} Light-Overrides, Inventar nennt ${inventory.design_tokens.light_block_token_count}`
    );
  }
  for (const entry of tokens) {
    if (
      light.some((override) => override.name === entry.name) &&
      entry.source.lines === `L${light.find((o) => o.name === entry.name).line}`
    ) {
      add('error', 'LIGHT_AS_SOURCE', entry.id, `${entry.name}: source zeigt auf den Light-Block statt auf :root`);
    }
  }

  // --- 3. Umbruchpunkte
  const breakpoints = entries.filter((entry) => entry.type === 'breakpoint');
  const expectedWidths = inventory.breakpoints.widths_used_in_two_or_more_files.map((row) => row.width);
  const covered = new Set();
  for (const entry of breakpoints) {
    const match = /(\d+)px/.exec(entry.value || '');
    if (!match) {
      add('error', 'BP_VALUE', entry.id, `value ohne Breite: ${entry.value}`);
      continue;
    }
    const width = `${match[1]}px`;
    if (!expectedWidths.includes(width))
      add('error', 'BP_UNEXPECTED', entry.id, `${width} kommt nicht in zwei CSS-Dateien vor`);
    if (covered.has(width)) add('error', 'BP_DOUBLE', entry.id, `${width} ist doppelt`);
    covered.add(width);
  }
  for (const width of expectedWidths) {
    if (!covered.has(width)) add('error', 'BP_MISSING', width, 'Umbruchpunkt fehlt im Katalog');
  }

  // --- 4. Klassen-Praefixe
  const prefixes = inventory.design_tokens.class_prefixes;
  const selectors = entries.map((entry) => (entry.source && entry.source.selector) || '').join(' ');
  const gapsText = exists('docs/migration-baseline/design-katalog-luecken.md')
    ? read('docs/migration-baseline/design-katalog-luecken.md')
    : '';
  const excluded = new Set([...gapsText.matchAll(/^\| `([a-z]+)` \|/gm)].map((m) => m[1]));
  for (const prefix of prefixes) {
    const inCatalog = new RegExp(`\\.${prefix}(?![A-Za-z0-9])`).test(selectors);
    const inExclusions = excluded.has(prefix);
    if (inCatalog && inExclusions)
      add('error', 'PREFIX_CONFLICT', prefix, `Praefix ist katalogisiert und gleichzeitig ausgeschlossen`);
    if (!inCatalog && !inExclusions)
      add(
        'error',
        'PREFIX_UNDECIDED',
        prefix,
        `Praefix .${prefix}-* ist weder katalogisiert noch begruendet ausgeschlossen`
      );
  }
  for (const prefix of excluded) {
    if (!prefixes.includes(prefix))
      add('warning', 'PREFIX_UNKNOWN', prefix, 'Ausschluss nennt ein Praefix, das im Inventar nicht vorkommt');
  }

  // --- 5. Quellen und Zeilen
  for (const entry of entries) {
    const src = entry.source || {};
    if (!src.path) continue;
    if (!exists(src.path)) {
      add('error', 'SOURCE_NOT_FOUND', entry.id, `${src.path} existiert nicht`);
      continue;
    }
    if (!src.lines) continue;
    const range = parseRange(src.lines);
    if (!range) {
      add('error', 'LINES_FORMAT', entry.id, `lines ${src.lines} ist nicht L<a> oder L<a>-L<b>`);
      continue;
    }
    const fileLines = lines(src.path);
    if (range.end > fileLines.length || range.start < 1) {
      add(
        'error',
        'LINES_RANGE',
        entry.id,
        `${src.lines} liegt ausserhalb von ${src.path} (${fileLines.length} Zeilen)`
      );
      continue;
    }
    if (src.path.endsWith('.css') && src.selector) {
      // Token-Eintraege belegen eine Zeile innerhalb von :root; der Selektor steht am Blockanfang.
      if (src.selector !== ':root') {
        const candidates = src.selector.split(',').map((part) => normalise(part));
        const window = normalise(fileLines.slice(range.start - 1, range.end).join(' '));
        const hit = candidates.some((candidate) => candidate && window.includes(candidate));
        if (!hit)
          add(
            'error',
            'SELECTOR_RANGE',
            entry.id,
            `Selektor "${src.selector}" steht nicht in ${src.path} ${src.lines}`
          );
      }
    }
  }

  // --- 6. Nachweise
  const evidencePaths = new Set();
  for (const entry of entries) {
    for (const item of entry.evidence || []) {
      if (/^cmd: /.test(item) || /^https?:\/\//.test(item)) continue;
      const cleaned = item.replace(/#.*$/, '');
      if (!cleaned) continue;
      evidencePaths.add(cleaned);
      if (!exists(cleaned)) add('error', 'EVIDENCE_NOT_FOUND', entry.id, `Nachweis ${cleaned} existiert nicht`);
    }
  }
  for (const shot of [
    'home-1440.png',
    'home-1024.png',
    'home-780.png',
    'home-390.png',
    'modal-tarot-1440.png',
    'nav-offen-390.png',
    'focus-skiplink-1440.png',
    'farbwelten-rot-1440.png',
    'farbwelten-rot-390.png',
    'frequenzlabor-1440.png',
    'radiasthesie-glossar-1440.png',
    'messung.json',
    'messung-seiten.json',
  ]) {
    const rel = `docs/migration-baseline/evidence/design/${shot}`;
    if (!exists(rel)) add('error', 'SHOT_MISSING', shot, `${rel} fehlt`);
    if (!evidencePaths.has(rel))
      add('warning', 'SHOT_UNUSED', shot, `${rel} wird von keinem Eintrag als Nachweis genannt`);
  }

  const errors = findings.filter((item) => item.level === 'error');
  const warnings = findings.filter((item) => item.level === 'warning');
  const summary = {
    entries: entries.length,
    tokens: tokens.length,
    breakpoints: breakpoints.length,
    prefixes: prefixes.length,
    excludedPrefixes: excluded.size,
    errors: errors.length,
    warnings: warnings.length,
    ok: errors.length === 0,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ summary, findings }, null, 2));
  } else {
    console.log('Design-Katalog Gegenprobe gegen die Baseline');
    console.log(
      `  Eintraege ${summary.entries} · Tokens ${summary.tokens} · Umbruchpunkte ${summary.breakpoints} · Praefixe ${summary.prefixes} (davon ausgeschlossen ${summary.excludedPrefixes})`
    );
    for (const item of warnings) console.log(`  WARNUNG [${item.code}] ${item.where}: ${item.message}`);
    for (const item of errors) console.log(`  FEHLER  [${item.code}] ${item.where}: ${item.message}`);
    console.log(`  → ${summary.ok ? 'OK' : `${errors.length} Fehler`}, ${warnings.length} Warnungen`);
  }
  process.exit(summary.ok ? 0 : 1);
}

main();
