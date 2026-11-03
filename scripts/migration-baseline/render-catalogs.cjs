'use strict';
// Erzeugt aus den kanonischen JSON-Katalogen die lesbaren Fassungen und die Token-Projektion.
// Damit koennen Markdown-Tabellen und Token-Datei nicht vom JSON wegdriften.
//
//   node scripts/migration-baseline/render-catalogs.cjs                       # schreiben
//   node scripts/migration-baseline/render-catalogs.cjs --check               # nur pruefen
//   node scripts/migration-baseline/render-catalogs.cjs --input <dir> --out <dir>
//
// Erzeugte Dateien: design-tokens.json, design-system.md, content-catalog.md

const fs = require('node:fs');
const path = require('node:path');
const catalog = require('./lib/catalog.cjs');

const HEADER_NOTE = 'Erzeugt von `scripts/migration-baseline/render-catalogs.cjs` aus';

const DESIGN_SECTIONS = [
  { title: 'Tokens', types: ['token-color', 'token-typography', 'token-space', 'token-radius', 'token-motion', 'token-shadow'] },
  { title: 'Komponenten', types: ['component'] },
  { title: 'Layouts und Seitenvorlagen', types: ['layout'] },
  { title: 'Wiederverwendete Muster', types: ['pattern'] },
  { title: 'Zustaende', types: ['state'] },
  { title: 'Icons und Illustrationen', types: ['icon', 'illustration'] },
  { title: 'Breakpoints', types: ['breakpoint'] },
];

const CONTENT_SECTIONS = [
  { title: 'Seiten und Bereiche', types: ['page', 'area', 'subroute'] },
  { title: 'Artikel', types: ['article'] },
  { title: 'Rechtstexte', types: ['legal'] },
  { title: 'UI-Texte, Metadaten und Fehlermeldungen', types: ['ui-string', 'metadata', 'error-message'] },
  { title: 'Glossar, Quellenlisten und Werkzeuge', types: ['glossary', 'source-list', 'tool'] },
];

function parseArgs(argv) {
  const options = { check: false, input: null, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--input') {
      options.input = argv[i + 1];
      i += 1;
    } else if (arg === '--out') {
      options.out = argv[i + 1];
      i += 1;
    } else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unbekannte Option: ${arg}`);
  }
  return options;
}

function cell(value) {
  return String(value === undefined || value === null || value === '' ? '—' : value)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function sourceCell(source) {
  if (!source) return '—';
  const parts = [];
  if (source.path) parts.push(source.path);
  if (source.url) parts.push(source.url);
  if (source.selector) parts.push(`\`${source.selector}\``);
  if (source.lines) parts.push(source.lines);
  return parts.join(' · ');
}

function countLine(label, counts) {
  const parts = Object.entries(counts).map(([key, value]) => `${key} ${value}`);
  return `| ${label} | ${parts.length ? parts.join(' · ') : '—'} |`;
}

function counts(entries, field) {
  const map = new Map();
  for (const entry of entries) {
    const key = entry[field] === undefined || entry[field] === '' ? '(leer)' : entry[field];
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

function byId(a, b) {
  return String(a.id).localeCompare(String(b.id));
}

function documentHeader(title, doc, sourceName) {
  return [
    `# ${title}`,
    '',
    `> ${HEADER_NOTE} \`${sourceName}\`. Nicht von Hand bearbeiten — Aenderungen gehoeren in die JSON-Quelle.`,
    `> Stand: ${doc.stand} · Basis-Commit: ${doc.base_commit} · Struktur: ${catalog.SCOPE_DOCUMENT} (Version ${catalog.SCHEMA_VERSION})`,
    '',
  ].join('\n');
}

function designTables(entries) {
  const blocks = [];
  for (const section of DESIGN_SECTIONS) {
    const rows = entries.filter((entry) => section.types.includes(entry.type)).sort(byId);
    if (!rows.length) continue;
    blocks.push(`## ${section.title} (${rows.length})`);
    blocks.push('');
    if (section.types.every((type) => type.startsWith('token-'))) {
      blocks.push('| ID | Name | Wert | Quelle | Stand | Status | Release | Owner | Pruefkriterium |');
      blocks.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
      for (const row of rows) {
        blocks.push(
          `| ${cell(row.id)} | ${cell(row.name)} | ${cell(row.value)} | ${cell(sourceCell(row.source))} | ${cell(row.stand)} | ${cell(row.status)} | ${cell(row.release_relevance)} | ${cell(row.owner)} | ${cell(row.acceptance_check)} |`
        );
      }
    } else {
      blocks.push('| ID | Name | Typ | Quelle | Stand | Status | Release | Owner | Zustaende | Pruefkriterium |');
      blocks.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
      for (const row of rows) {
        const states = Array.isArray(row.states) && row.states.length ? row.states.join(', ') : '—';
        blocks.push(
          `| ${cell(row.id)} | ${cell(row.name)} | ${cell(row.type)} | ${cell(sourceCell(row.source))} | ${cell(row.stand)} | ${cell(row.status)} | ${cell(row.release_relevance)} | ${cell(row.owner)} | ${cell(states)} | ${cell(row.acceptance_check)} |`
        );
      }
    }
    blocks.push('');
    const open = rows.filter((row) => Array.isArray(row.open_questions) && row.open_questions.length);
    if (open.length) {
      blocks.push('Offene Punkte:');
      blocks.push('');
      for (const row of open) {
        for (const question of row.open_questions) blocks.push(`- \`${row.id}\` — ${question}`);
      }
      blocks.push('');
    }
  }
  return blocks;
}

function renderDesign(doc) {
  const entries = doc.entries.slice().sort(byId);
  const lines = [documentHeader('ESOW Design-Katalog', doc, 'design-catalog.json')];
  lines.push('## Kennzahlen');
  lines.push('');
  lines.push('| Merkmal | Werte |');
  lines.push('| --- | --- |');
  lines.push(`| Eintraege | ${entries.length} |`);
  lines.push(countLine('Status', counts(entries, 'status')));
  lines.push(countLine('Release-Relevanz', counts(entries, 'release_relevance')));
  lines.push(countLine('Auslieferung', counts(entries, 'delivery')));
  lines.push(countLine('Typen', counts(entries, 'type')));
  lines.push('');
  lines.push(...designTables(entries));
  const open = entries.filter((entry) => entry.status === 'offen' || entry.status === 'entwurf');
  lines.push('## Nicht abgeschlossen oder fehlend');
  lines.push('');
  if (open.length) {
    lines.push('| ID | Name | Status | Release | Grund |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const entry of open) {
      const reason = Array.isArray(entry.open_questions) && entry.open_questions.length ? entry.open_questions.join(' ') : '';
      lines.push(`| ${cell(entry.id)} | ${cell(entry.name)} | ${cell(entry.status)} | ${cell(entry.release_relevance)} | ${cell(reason)} |`);
    }
  } else {
    lines.push('Keine offenen oder Entwurfs-Eintraege.');
  }
  lines.push('');
  return lines.join('\n');
}

function renderTokens(doc) {
  const tokens = doc.entries.filter((entry) => entry.type.startsWith('token-')).sort(byId);
  const groups = {};
  for (const token of tokens) {
    const group = token.type.replace(/^token-/, '');
    groups[group] = groups[group] || {};
    groups[group][token.name] = token.value;
  }
  const payload = {
    $comment: 'Erzeugt von scripts/migration-baseline/render-catalogs.cjs aus design-catalog.json. Nicht von Hand bearbeiten.',
    schema_version: doc.schema_version,
    base_commit: doc.base_commit,
    stand: doc.stand,
    count: tokens.length,
    groups,
    tokens: tokens.map((token) => ({
      id: token.id,
      name: token.name,
      value: token.value,
      group: token.type.replace(/^token-/, ''),
      status: token.status,
      release_relevance: token.release_relevance,
      source: sourceCell(token.source),
    })),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function renderContent(doc) {
  const entries = doc.entries.slice().sort(byId);
  const claims = (doc.claims || []).slice().sort(byId);
  const lines = [documentHeader('ESOW Inhalts-Katalog', doc, 'content-catalog.json')];
  lines.push('## Kennzahlen');
  lines.push('');
  lines.push('| Merkmal | Werte |');
  lines.push('| --- | --- |');
  lines.push(`| Eintraege | ${entries.length} |`);
  lines.push(`| Aussagen (Claims) | ${claims.length} |`);
  lines.push(countLine('Status', counts(entries, 'status')));
  lines.push(countLine('Release-Relevanz', counts(entries, 'release_relevance')));
  lines.push(countLine('Auslieferung', counts(entries, 'delivery')));
  lines.push(countLine('Typen', counts(entries, 'type')));
  lines.push(countLine('Sprache', counts(entries, 'language')));
  lines.push('');
  for (const section of CONTENT_SECTIONS) {
    const rows = entries.filter((entry) => section.types.includes(entry.type));
    if (!rows.length) continue;
    lines.push(`## ${section.title} (${rows.length})`);
    lines.push('');
    lines.push('| ID | Name | Route | Quelle | Textreferenz | Stand | Status | Release | Owner | Pruefkriterium |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const row of rows) {
      lines.push(
        `| ${cell(row.id)} | ${cell(row.name)} | ${cell(row.route)} | ${cell(sourceCell(row.source))} | ${cell(row.text_ref)} | ${cell(row.stand)} | ${cell(row.status)} | ${cell(row.release_relevance)} | ${cell(row.owner)} | ${cell(row.acceptance_check)} |`
      );
    }
    lines.push('');
  }
  lines.push(`## Aussagen (Claims) (${claims.length})`);
  lines.push('');
  if (claims.length) {
    lines.push('| ID | Aussage | Art | Belegstelle | Pruefstatus | Zitat | Status | Release | Owner |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const claim of claims) {
      lines.push(
        `| ${cell(claim.id)} | ${cell(claim.claim)} | ${cell(claim.kind)} | ${cell(claim.text_ref)} | ${cell(claim.verification)} | ${cell(claim.citation)} | ${cell(claim.status)} | ${cell(claim.release_relevance)} | ${cell(claim.owner)} |`
      );
    }
  } else {
    lines.push('Keine Aussagen erfasst.');
  }
  lines.push('');
  const unresolved = claims.filter((claim) => claim.verification !== 'verified');
  if (unresolved.length) {
    lines.push('## Unbelegte Aussagen');
    lines.push('');
    for (const claim of unresolved) lines.push(`- \`${claim.id}\` (${claim.verification}) — ${claim.claim}`);
    lines.push('');
  }
  const openEntries = entries.filter((entry) => entry.status === 'offen' || entry.status === 'entwurf');
  if (openEntries.length) {
    lines.push('## Nicht abgeschlossen oder fehlend');
    lines.push('');
    for (const entry of openEntries) {
      const reason = Array.isArray(entry.open_questions) && entry.open_questions.length ? ` — ${entry.open_questions.join(' ')}` : '';
      lines.push(`- \`${entry.id}\` (${entry.status}) ${entry.name}${reason}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function writeOrCheck(file, content, options, reportLines) {
  if (options.check) {
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (existing === content) {
      reportLines.push(`OK        ${catalog.relToRoot(file)}`);
      return true;
    }
    reportLines.push(`ABWEICHUNG ${catalog.relToRoot(file)}${existing === null ? ' (fehlt)' : ''}`);
    return false;
  }
  fs.writeFileSync(file, content, 'utf8');
  reportLines.push(`geschrieben ${catalog.relToRoot(file)}`);
  return true;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  if (options.help) {
    console.log('Rendert design-system.md, design-tokens.json und content-catalog.md. Optionen: --check --input <dir> --out <dir>');
    return;
  }
  const inputDir = options.input ? path.resolve(catalog.ROOT, options.input) : catalog.CATALOG_DIR;
  const outDir = options.out ? path.resolve(catalog.ROOT, options.out) : inputDir;

  const designFile = path.join(inputDir, 'design-catalog.json');
  const contentFile = path.join(inputDir, 'content-catalog.json');
  const missing = [designFile, contentFile].filter((file) => !fs.existsSync(file));
  if (missing.length) {
    console.error(`Fehlende Quelle: ${missing.map((file) => catalog.relToRoot(file)).join(', ')}`);
    process.exit(2);
  }

  const design = catalog.readJson(designFile);
  const content = catalog.readJson(contentFile);
  fs.mkdirSync(outDir, { recursive: true });

  const reportLines = [];
  let ok = true;
  ok = writeOrCheck(path.join(outDir, 'design-tokens.json'), renderTokens(design), options, reportLines) && ok;
  ok = writeOrCheck(path.join(outDir, 'design-system.md'), renderDesign(design), options, reportLines) && ok;
  ok = writeOrCheck(path.join(outDir, 'content-catalog.md'), renderContent(content), options, reportLines) && ok;

  console.log(`Katalog-Render — ${catalog.relToRoot(inputDir)} → ${catalog.relToRoot(outDir)}`);
  console.log(reportLines.join('\n'));
  process.exit(options.check && !ok ? 1 : 0);
}

main();
