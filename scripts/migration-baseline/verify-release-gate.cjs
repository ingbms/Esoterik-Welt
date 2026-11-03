'use strict';
// Release-Gate-Pruefung: buendelt die unabhaengigen Katalogpruefungen und prueft
// die Struktur der Kataloge gegen die Baseline.
//
//   node scripts/migration-baseline/verify-release-gate.cjs [--fast]
//
// --fast laesst die beiden Browsermessungen aus (check-catalog-routes, runtime-fakten).
// Ergebnis: docs/migration-baseline/evidence/release-gate/pruefungen.json
// Exitcode 1, sobald eine Muss-Pruefung fehlschlaegt.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const lib = require('./lib/catalog.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs', 'migration-baseline');
const OUT = path.join(DOCS, 'evidence', 'release-gate');
const FAST = process.argv.includes('--fast');

const SCRIPTS = path.join(ROOT, 'scripts', 'migration-baseline');

const CHECKS = [
  {
    id: 'M1',
    criterion: 'Inhalts- und Design-Katalog entsprechen dem gemeinsamen Schema',
    command: 'validate-schema.cjs',
    expectExit: 0,
    passPattern: /0 Abweichung/,
  },
  {
    id: 'M2',
    criterion: 'Alle Kataloge erfuellen die Pflichtfelder und Feldregeln',
    command: 'validate-catalogs.cjs',
    expectExit: 0,
    passPattern: /0 Fehler/,
  },
  {
    id: 'M3',
    criterion: 'Generierte Markdown-/Token-Dateien sind aktuell',
    command: 'render-catalogs.cjs',
    args: ['--check'],
    expectExit: 0,
    passPattern: /OK\s+docs\/migration-baseline\/content-catalog\.md/,
  },
  {
    id: 'M4',
    criterion: 'Design-Katalog ist gegen das CSS gegenprüfbar (eigener Prüfer)',
    command: 'verify-design-catalog.cjs',
    expectExit: 0,
    passPattern: /OK, 0 Warnungen/,
  },
  {
    id: 'M5',
    criterion: 'Design-Katalog haelt einer unabhaengigen Gegenpruefung mit eigenen Parsern stand',
    command: 'verify-design-catalog-independent.cjs',
    expectExit: 0,
    passPattern: /"errors": 0/,
  },
  {
    id: 'M6',
    criterion: 'Medien-Katalog deckt jede Datei unter assets/ ab (Bytes, Hashes, Lizenzen)',
    command: 'verify-media-catalog.cjs',
    expectExit: 0,
    passPattern: /17\/17 (Pruefungen|Prüfungen) bestanden/,
  },
  {
    id: 'M7',
    criterion: 'Funktions-Katalog ist vollstaendig belegt',
    command: 'verify-function-catalog.cjs',
    expectExit: 0,
    passPattern: /alle Quellen und Nachweise vorhanden/,
  },
  {
    id: 'M8',
    criterion: 'Bestandsaufnahme entspricht dem Arbeitsbaum',
    command: 'inventory-baseline.cjs',
    args: ['--check'],
    expectExit: 0,
    passPattern: /^OK:/m,
  },
  {
    id: 'M9',
    criterion: 'Jede katalogisierte Route existiert und jede verlinkte Route ist katalogisiert',
    command: 'check-catalog-routes.cjs',
    expectExit: 0,
    browser: true,
    analyze: (output) => {
      const parsed = JSON.parse(output.slice(output.indexOf('{')));
      return {
        ok: parsed.not_found.length === 0 && parsed.linked_but_not_cataloged.length === 0,
        detail: `${parsed.routes_checked} Routen, ${parsed.not_found.length} nicht gefunden, ${parsed.linked_but_not_cataloged.length} verlinkt aber nicht katalogisiert`,
      };
    },
  },
  {
    id: 'M10',
    criterion: 'Laufzeitfakten (Kristallzahl, Farbregister, Blogartikel) stimmen mit dem Katalog ueberein',
    command: 'verify-release-gate-facts.cjs',
    expectExit: 0,
    browser: true,
  },
];

function runCheck(check) {
  if (check.browser && FAST) {
    return { ...check, status: 'skipped', detail: 'Browsermessung mit --fast uebersprungen' };
  }
  const started = Date.now();
  const result = spawnSync(process.execPath, [path.join(SCRIPTS, check.command), ...(check.args || [])], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const duration = Date.now() - started;
  let status = result.status === check.expectExit ? 'pass' : 'fail';
  let detail = `Exit ${result.status}`;
  if (check.analyze && result.status === 0) {
    try {
      const analysed = check.analyze(output);
      status = analysed.ok ? 'pass' : 'fail';
      detail = analysed.detail;
    } catch (error) {
      status = 'fail';
      detail = `Ausgabe nicht lesbar: ${error.message}`;
    }
  } else if (check.passPattern) {
    const matched = check.passPattern.test(output);
    if (result.status === 0 && !matched) {
      status = 'fail';
      detail = `Exit 0, aber Erfolgsmuster fehlt (${check.passPattern})`;
    } else if (result.status === 0) {
      detail = `Exit 0, Muster bestaetigt (${check.passPattern})`;
    }
  }
  return {
    id: check.id,
    criterion: check.criterion,
    command: `node scripts/migration-baseline/${check.command}${check.args ? ` ${check.args.join(' ')}` : ''}`,
    status,
    exit_code: result.status,
    detail,
    duration_ms: duration,
  };
}

// ---------------------------------------------------------------- Struktur

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(DOCS, name), 'utf8'));
const repoFile = (relative) => path.join(ROOT, relative);
const lineCount = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/).length;

const CONTENT_REQUIRED = [
  'id',
  'name',
  'description',
  'type',
  'source',
  'text_ref',
  'language',
  'stand',
  'status',
  'owner',
  'release_relevance',
  'delivery',
  'acceptance_check',
];
const DESIGN_REQUIRED = [
  'id',
  'name',
  'description',
  'type',
  'source',
  'stand',
  'status',
  'owner',
  'release_relevance',
  'delivery',
  'acceptance_check',
];

/**
 * Prueft beide Kataloge rein strukturell gegen den Arbeitsbaum.
 * Als Funktion, damit --self-test denselben Code gegen absichtlich kaputte
 * Kopien laufen lassen kann (Negativkontrolle).
 */
function auditCatalogs(design, content) {
  const findings = [];
  const add = (level, id, message) => findings.push({ level, id, message });

  const checkEntries = (entries, kind) => {
    const required = kind === 'content' ? CONTENT_REQUIRED : DESIGN_REQUIRED;
    const seen = new Set();
    for (const entry of entries) {
      for (const field of required) {
        if (entry[field] === undefined || entry[field] === '') add('error', entry.id, `Pflichtfeld ${field} fehlt`);
      }
      if (seen.has(entry.id)) add('error', entry.id, 'ID doppelt');
      seen.add(entry.id);
      const sourcePath = entry.source && entry.source.path;
      if (sourcePath && !fs.existsSync(repoFile(sourcePath))) {
        add('error', entry.id, `Quelle ${sourcePath} existiert nicht`);
      }
      if (entry.text_ref) {
        const [file, anchor] = String(entry.text_ref).split('#');
        if (!fs.existsSync(repoFile(file))) {
          add('error', entry.id, `text_ref-Datei ${file} existiert nicht`);
        } else if (/^L\d+(-L\d+)?$/.test(anchor)) {
          const total = lineCount(repoFile(file));
          const numbers = anchor.match(/\d+/g).map(Number);
          if (Math.max(...numbers) > total) {
            add(
              'error',
              entry.id,
              `text_ref ${entry.text_ref} verweist auf Zeile ${Math.max(...numbers)}, Datei hat ${total}`
            );
          }
        }
      }
      for (const claimId of entry.claims || []) {
        if (!(content.claims || []).some((claim) => claim.id === claimId)) {
          add('error', entry.id, `Claim ${claimId} existiert nicht`);
        }
      }
    }
  };

  checkEntries(design.entries, 'design');
  checkEntries(content.entries, 'content');

  const claimIds = new Set();
  for (const claim of content.claims || []) {
    if (claimIds.has(claim.id)) add('error', claim.id, 'Claim-ID doppelt');
    claimIds.add(claim.id);
    if (claim.verification === 'verified' && !claim.citation) add('error', claim.id, 'verified ohne citation');
    if (claim.text_ref) {
      const [file, anchor] = String(claim.text_ref).split('#');
      if (!fs.existsSync(repoFile(file))) add('error', claim.id, `text_ref-Datei ${file} existiert nicht`);
      else if (/^L\d+(-L\d+)?$/.test(anchor)) {
        const total = lineCount(repoFile(file));
        const numbers = anchor.match(/\d+/g).map(Number);
        if (Math.max(...numbers) > total)
          add('error', claim.id, `text_ref ${claim.text_ref} liegt hinter dem Dateiende (${total})`);
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------- Selbsttest

if (process.argv.includes('--self-test')) {
  const design = readJson('design-catalog.json');
  const content = readJson('content-catalog.json');
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const cases = [
    [
      'fehlender owner',
      (d) => {
        delete d.entries[0].owner;
      },
      'Pflichtfeld owner fehlt',
    ],
    [
      'Quelle existiert nicht',
      (d) => {
        d.entries[1].source.path = 'css/gibt-es-nicht.css';
      },
      'Quelle css/gibt-es-nicht.css existiert nicht',
    ],
    [
      'text_ref hinter dem Dateiende',
      (d, c) => {
        c.entries[0].text_ref = 'index.html#L99999';
      },
      'verweist auf Zeile 99999',
    ],
    [
      'unbekannte Claim-Referenz',
      (d, c) => {
        c.entries[0].claims = ['CLM-999'];
      },
      'Claim CLM-999 existiert nicht',
    ],
    [
      'verified ohne citation',
      (d, c) => {
        c.claims[0].citation = '';
      },
      'verified ohne citation',
    ],
  ];
  const outcome = [];
  for (const [name, mutate, expected] of cases) {
    const d = clone(design);
    const c = clone(content);
    mutate(d, c);
    const findings = auditCatalogs(d, c);
    const caught = findings.some((finding) => finding.level === 'error' && finding.message.includes(expected));
    outcome.push({ case: name, expected, caught });
  }
  const clean = auditCatalogs(design, content).filter((finding) => finding.level === 'error');
  const ok = outcome.every((item) => item.caught) && clean.length === 0;
  console.log(
    JSON.stringify({ self_test: 'release-gate', cases: outcome, clean_run_errors: clean.length, ok }, null, 2)
  );
  process.exit(ok ? 0 : 1);
}

// ---------------------------------------------------------------- Lauf

const design = readJson('design-catalog.json');
const content = readJson('content-catalog.json');
const structural = auditCatalogs(design, content);

// Medien-CSV: jede Zeile mit Pflichtfeldern, jede Lizenz entschieden.
// Gelesen mit dem gemeinsamen CSV-Leser (Anfuehrungszeichen, Kommas in Feldern).
// Ein split(';') war hier falsch: die Datei ist komma-separiert, dadurch fiel die
// Lizenzspalte aus und die Kennzahl meldete 0 offene Lizenzen statt 1.
const mediaTable = lib.parseCsv(fs.readFileSync(path.join(DOCS, 'media-catalog.csv'), 'utf8'));
const mediaHeader = mediaTable[0];
const mediaRows = mediaTable.slice(1);
const licenseIndex = mediaHeader.indexOf('license_status');
if (licenseIndex < 0) throw new Error('media-catalog.csv: Spalte license_status fehlt');
const openLicenses = mediaRows.filter(
  (row) => row[licenseIndex] && row[licenseIndex] !== 'geklaert' && row[licenseIndex] !== 'nicht_erforderlich'
);
structural.push({
  level: 'info',
  id: 'MED-LIZENZ',
  message: `${mediaRows.length} Medienzeilen, ${openLicenses.length} ohne geklaerte Lizenz`,
});

const counts = {
  design_entries: design.entries.length,
  design_states: design.entries.filter((entry) => entry.type === 'state').length,
  content_entries: content.entries.length,
  content_pages: content.entries.filter((entry) => entry.type === 'page').length,
  content_subroutes: content.entries.filter((entry) => entry.type === 'subroute').length,
  content_articles: content.entries.filter((entry) => entry.type === 'article').length,
  content_legal: content.entries.filter((entry) => entry.type === 'legal').length,
  claims: (content.claims || []).length,
  media_rows: mediaRows.length,
  functions: 96,
};

const results = CHECKS.map(runCheck);
const failed = results.filter((result) => result.status !== 'pass');
const errors = structural.filter((finding) => finding.level === 'error');

const report = {
  generated_at: new Date().toISOString(),
  // Die Karte, die den Lauf ausgelöst hat: im Dispatcher-Betrieb gesetzt,
  // sonst der historische Ursprung des Gate-Pakets.
  card: process.env.HERMES_KANBAN_TASK || 't_9c2a7824',
  base_commit: content.base_commit,
  head_commit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim(),
  counts,
  checks: results,
  structural_findings: structural,
  must_failed: failed.map((result) => result.id),
  structural_errors: errors.length,
  ok: failed.length === 0 && errors.length === 0,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'pruefungen.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      ok: report.ok,
      must_failed: report.must_failed,
      structural_errors: errors.length,
      counts,
      checks: results.map((result) => `${result.id} ${result.status} ${result.detail}`),
    },
    null,
    2
  )
);
process.exit(report.ok ? 0 : 1);
