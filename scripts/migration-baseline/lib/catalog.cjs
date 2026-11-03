'use strict';
// Gemeinsame Regeln fuer Design- und Inhalts-Katalog.
// Verbindliche Fassung: docs/migration-baseline/00-schema-und-scope.md (Version 1.0.0).
// Bewusst ohne Abhaengigkeiten: laeuft mit dem Node-Stand des Projekts (>= 20), ohne npm ci.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CATALOG_DIR = path.join(ROOT, 'docs', 'migration-baseline');

const SCHEMA_VERSION = '1.0.0';
const SCOPE_DOCUMENT = 'docs/migration-baseline/00-schema-und-scope.md';

// Typ -> ID-Code. Wer einen neuen Typ braucht, erweitert Schema und Tabelle gemeinsam.
const TYPE_CODES = {
  design: {
    'token-color': 'TOK',
    'token-typography': 'TOK',
    'token-space': 'TOK',
    'token-radius': 'TOK',
    'token-motion': 'TOK',
    'token-shadow': 'TOK',
    'token-z': 'TOK',
    'token-size': 'TOK',
    component: 'CMP',
    layout: 'LAY',
    pattern: 'PAT',
    state: 'STA',
    icon: 'ICO',
    illustration: 'ILL',
    breakpoint: 'BP',
  },
  content: {
    page: 'PAG',
    area: 'ARE',
    subroute: 'SUB',
    article: 'ART',
    legal: 'LEG',
    'ui-string': 'STR',
    metadata: 'MET',
    'error-message': 'ERR',
    glossary: 'GLO',
    'source-list': 'SRC',
    tool: 'TOOL',
  },
};

const ENUMS = {
  status: ['final', 'entwurf', 'offen', 'veraltet'],
  releaseRelevance: ['must', 'should', 'none'],
  delivery: ['shipped', 'source-only', 'excluded'],
  owners: ['structured_output', 'design_web_layout', 'design_critique', 'writer', 'review_approval', 'architect', 'default'],
  states: ['default', 'hover', 'focus', 'active', 'disabled', 'error', 'empty', 'loading', 'selected', 'expanded'],
  claimKinds: ['number', 'date', 'name', 'attribution', 'effect', 'legal', 'other'],
  verification: ['verified', 'unverified', 'unverifiable'],
  licenseStatus: ['geklaert', 'ungeklaert', 'nicht_erforderlich'],
};

const COMMON_REQUIRED = [
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

const DESIGN_REQUIRED = COMMON_REQUIRED;
const CONTENT_REQUIRED = COMMON_REQUIRED.concat(['text_ref', 'language']);

const CLAIM_REQUIRED = ['id', 'claim', 'kind', 'text_ref', 'verification', 'status', 'owner', 'release_relevance'];

const MEDIA_COLUMNS = [
  'id',
  'path',
  'used_on',
  'width_px',
  'height_px',
  'format',
  'bytes',
  'alt_text',
  'caption',
  'credit',
  'license',
  'license_status',
  'sha256',
  'status',
  'release_relevance',
  'delivery',
];

const MEDIA_VECTOR_FORMATS = new Set(['svg', 'ttf', 'otf', 'woff', 'woff2', 'json', 'txt']);

const ID_PATTERNS = {
  design: /^DES-(TOK|CMP|LAY|PAT|STA|ICO|ILL|BP)-[0-9]{3}$/,
  content: /^CNT-(PAG|ARE|SUB|ART|LEG|STR|MET|ERR|GLO|SRC|TOOL)-[0-9]{3}$/,
  claim: /^CLM-[0-9]{3}$/,
  media: /^MED-[0-9]{4}$/,
  token: /^DES-TOK-[0-9]{3}$/,
};

const TEXT_REF = /^[A-Za-z0-9._/-]+#(L[0-9]+(-L[0-9]+)?|[a-z0-9-]+)$/;
const REPO_PATH = /^(?!\/)(?!.*(^|\/)\.\.(\/|$))[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;
const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const ROUTE = /^(#[A-Za-z0-9/_-]+|[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*\.html)$/;
const SHA256 = /^[0-9a-f]{64}$/;

function report() {
  const errors = [];
  const warnings = [];
  const add = (level, code, where, message) => {
    (level === 'error' ? errors : warnings).push({ level, code, where, message });
  };
  return {
    errors,
    warnings,
    error: (code, where, message) => add('error', code, where, message),
    warn: (code, where, message) => add('warning', code, where, message),
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function relToRoot(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function sha256(relPath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relPath))).digest('hex');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Minimaler CSV-Leser: versteht Anführungszeichen, doppelte Anführungszeichen als Escape und Zeilenumbrüche in Feldern.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell !== ''));
}

function checkSource(entry, kind, out, options, where) {
  const source = entry.source;
  if (!isPlainObject(source)) {
    out.error('SOURCE_SHAPE', where, 'source muss ein Objekt mit path oder url sein.');
    return;
  }
  const hasPath = typeof source.path === 'string' && source.path !== '';
  const hasUrl = typeof source.url === 'string' && source.url !== '';
  if (!hasPath && !hasUrl) {
    out.error('SOURCE_MISSING_REF', where, 'source braucht path oder url.');
  }
  if (hasPath) {
    if (!REPO_PATH.test(source.path)) {
      out.error('SOURCE_PATH_FORMAT', where, `${source.path} ist kein repo-relativer POSIX-Pfad.`);
    } else if (options.fs && !exists(source.path)) {
      out.error('SOURCE_NOT_FOUND', where, `${source.path} existiert im Release-Stand nicht.`);
    }
  }
  if (hasUrl && !/^https?:\/\/\S+$/.test(source.url)) {
    out.error('SOURCE_URL_FORMAT', where, `${source.url} ist keine http(s)-URL.`);
  }
  if (source.lines !== undefined && !/^L[0-9]+(-L[0-9]+)?$/.test(source.lines)) {
    out.error('SOURCE_LINES_FORMAT', where, `lines muss L<start> oder L<start>-L<ende> sein, nicht ${source.lines}.`);
  }
  if (source.selector !== undefined && (typeof source.selector !== 'string' || !source.selector.trim())) {
    out.error('SOURCE_SELECTOR_FORMAT', where, 'selector muss nicht-leerer Text sein.');
  }
}

function checkProducedBy(entry, out, options, where) {
  if (entry.produced_by === undefined) return;
  const produced = entry.produced_by;
  if (!isPlainObject(produced)) {
    out.error('PRODUCED_SHAPE', where, 'produced_by muss ein Objekt mit command und from sein.');
    return;
  }
  if (typeof produced.command !== 'string' || produced.command.trim().length < 3) {
    out.error('PRODUCED_COMMAND', where, 'produced_by.command fehlt oder ist zu kurz.');
  }
  if (!Array.isArray(produced.from) || produced.from.length === 0) {
    out.error('PRODUCED_FROM', where, 'produced_by.from muss mindestens einen Eingangspfad nennen.');
    return;
  }
  for (const input of produced.from) {
    if (!REPO_PATH.test(input)) {
      out.error('PRODUCED_FROM_FORMAT', where, `${input} ist kein repo-relativer Pfad.`);
    } else if (options.fs && !exists(input)) {
      out.error('PRODUCED_FROM_NOT_FOUND', where, `Eingangsdatei ${input} existiert nicht.`);
    }
  }
}

function checkCommon(entry, kind, out, options, index) {
  const where = entry && typeof entry.id === 'string' ? entry.id : `${kind}[${index}]`;
  if (!isPlainObject(entry)) {
    out.error('ENTRY_SHAPE', where, 'Eintrag muss ein Objekt sein.');
    return where;
  }

  const required = kind === 'design' ? DESIGN_REQUIRED : CONTENT_REQUIRED;
  for (const key of required) {
    if (entry[key] === undefined || entry[key] === null || entry[key] === '') {
      out.error('REQUIRED', where, `Pflichtfeld ${key} fehlt.`);
    }
  }

  if (typeof entry.id === 'string' && !ID_PATTERNS[kind].test(entry.id)) {
    out.error('ID_PATTERN', where, `ID entspricht nicht dem Muster für ${kind}.`);
  }
  if (typeof entry.id === 'string' && typeof entry.type === 'string') {
    const expected = TYPE_CODES[kind][entry.type];
    if (!expected) {
      out.error('TYPE_UNKNOWN', where, `Typ ${entry.type} ist nicht definiert.`);
    } else if (!entry.id.startsWith(`DES-${expected}-`) && !entry.id.startsWith(`CNT-${expected}-`)) {
      out.error('ID_TYPE_MISMATCH', where, `Typ ${entry.type} verlangt den Code ${expected}, ID ist ${entry.id}.`);
    }
  }
  if (typeof entry.name === 'string' && (entry.name.length < 3 || entry.name.length > 120)) {
    out.error('NAME_LENGTH', where, 'name muss 3 bis 120 Zeichen lang sein.');
  }
  if (typeof entry.description === 'string' && (entry.description.length < 10 || entry.description.length > 400)) {
    out.error('DESCRIPTION_LENGTH', where, 'description muss 10 bis 400 Zeichen lang sein.');
  }
  if (typeof entry.stand === 'string') {
    if (!ISO_DATE.test(entry.stand)) {
      out.error('STAND_FORMAT', where, `stand muss YYYY-MM-DD sein, nicht ${entry.stand}.`);
    } else if (entry.stand > today()) {
      out.error('STAND_FUTURE', where, `stand ${entry.stand} liegt in der Zukunft.`);
    }
  }
  for (const [field, allowed] of [
    ['status', ENUMS.status],
    ['release_relevance', ENUMS.releaseRelevance],
    ['delivery', ENUMS.delivery],
    ['owner', ENUMS.owners],
  ]) {
    if (typeof entry[field] === 'string' && !allowed.includes(entry[field])) {
      out.error('ENUM', where, `${field}="${entry[field]}" ist nicht erlaubt (${allowed.join('|')}).`);
    }
  }
  if (typeof entry.acceptance_check === 'string') {
    if (entry.acceptance_check.length < 10 || entry.acceptance_check.length > 300) {
      out.error('ACCEPTANCE_LENGTH', where, 'acceptance_check muss 10 bis 300 Zeichen lang sein.');
    }
    if (!/[a-zäöüß]/i.test(entry.acceptance_check)) {
      out.warn('ACCEPTANCE_VAGUE', where, 'acceptance_check enthält keinen prüfbaren Text.');
    }
  }
  if (entry.evidence !== undefined && (!Array.isArray(entry.evidence) || entry.evidence.length === 0)) {
    out.error('EVIDENCE_EMPTY', where, 'evidence muss, wenn gesetzt, mindestens einen Nachweis enthalten.');
  }
  if (entry.open_questions !== undefined && (!Array.isArray(entry.open_questions) || entry.open_questions.length === 0)) {
    out.error('OPEN_QUESTIONS_EMPTY', where, 'open_questions muss, wenn gesetzt, mindestens einen Punkt enthalten.');
  }
  if (entry.status === 'offen' && entry.open_questions === undefined) {
    out.warn('OPEN_STATUS_WITHOUT_QUESTION', where, 'status=offen ohne open_questions: Grund der Lücke fehlt.');
  }
  if (entry.release_relevance === 'must' && entry.status !== 'final') {
    out.warn('BLOCKER_NOT_FINAL', where, `release_relevance=must bei status=${entry.status} — Blocker für das Release-Gate.`);
  }
  if (entry.delivery === 'excluded' && entry.release_relevance === 'must') {
    out.error('EXCLUDED_MUST', where, 'delivery=excluded verträgt sich nicht mit release_relevance=must.');
  }

  checkSource(entry, kind, out, options, where);
  checkProducedBy(entry, out, options, where);

  if (kind === 'design') {
    const isToken = typeof entry.type === 'string' && entry.type.startsWith('token-');
    const valueAllowed = isToken || entry.type === 'breakpoint';
    if (isToken && (typeof entry.value !== 'string' || !entry.value.trim())) {
      out.error('TOKEN_VALUE', where, 'Token-Eintrag braucht einen realen value.');
    }
    if (!valueAllowed && entry.value !== undefined) {
      out.warn('VALUE_WITHOUT_TOKEN', where, 'value ist nur für token-* und breakpoint vorgesehen.');
    }
    if (valueAllowed && typeof entry.value === 'string' && entry.value.length > 120) {
      out.error('VALUE_LENGTH', where, 'value darf hoechstens 120 Zeichen haben.');
    }
    if (entry.states !== undefined) {
      if (!Array.isArray(entry.states) || entry.states.length === 0) {
        out.error('STATES_SHAPE', where, 'states muss ein nicht-leeres Array sein.');
      } else {
        for (const state of entry.states) {
          if (!ENUMS.states.includes(state)) out.error('STATE_UNKNOWN', where, `Zustand ${state} ist nicht definiert.`);
        }
      }
    }
    if (entry.uses_tokens !== undefined) {
      if (!Array.isArray(entry.uses_tokens)) out.error('USES_TOKENS_SHAPE', where, 'uses_tokens muss ein Array sein.');
      else
        for (const tokenId of entry.uses_tokens) {
          if (!ID_PATTERNS.token.test(tokenId)) out.error('USES_TOKENS_PATTERN', where, `${tokenId} ist keine Token-ID.`);
        }
    }
  }

  if (kind === 'content') {
    if (entry.language !== undefined && entry.language !== 'de') {
      out.error('LANGUAGE', where, 'language muss "de" sein; weitere Sprachen sind nicht im Scope.');
    }
    if (typeof entry.text_ref === 'string' && !TEXT_REF.test(entry.text_ref)) {
      out.error('TEXT_REF_FORMAT', where, `text_ref ${entry.text_ref} verlangt <pfad>#L<a>-L<b> oder <pfad>#<slug>.`);
    }
    if (entry.route !== undefined && (typeof entry.route !== 'string' || !ROUTE.test(entry.route))) {
      out.error('ROUTE_FORMAT', where, `route ${entry.route} ist weder #route noch *.html.`);
    }
    if (entry.media_ids !== undefined && !Array.isArray(entry.media_ids)) {
      out.error('MEDIA_IDS_SHAPE', where, 'media_ids muss ein Array sein.');
    }
    if (entry.claims !== undefined && !Array.isArray(entry.claims)) {
      out.error('CLAIMS_REF_SHAPE', where, 'claims muss ein Array von CLM-IDs sein.');
    }
    if (entry.source && typeof entry.source.path === 'string' && typeof entry.text_ref === 'string') {
      const refPath = entry.text_ref.split('#')[0];
      if (refPath !== entry.source.path) {
        out.warn('TEXT_REF_PATH_MISMATCH', where, `text_ref zeigt auf ${refPath}, source.path auf ${entry.source.path}.`);
      }
    }
  }

  return where;
}

function checkUnique(entries, kind, out) {
  const seen = new Map();
  for (const entry of entries) {
    if (!isPlainObject(entry) || typeof entry.id !== 'string') continue;
    if (seen.has(entry.id)) {
      out.error('DUPLICATE_ID', entry.id, `ID doppelt vergeben (zweiter Eintrag Index ${entries.indexOf(entry)}).`);
    }
    seen.set(entry.id, entry);
  }
  return seen;
}

function checkTokenRefs(entries, out) {
  const tokenIds = new Set(entries.filter((e) => typeof e.id === 'string' && e.id.startsWith('DES-TOK-')).map((e) => e.id));
  for (const entry of entries) {
    if (!Array.isArray(entry.uses_tokens)) continue;
    for (const tokenId of entry.uses_tokens) {
      if (!tokenIds.has(tokenId)) out.error('TOKEN_REF_MISSING', entry.id, `uses_tokens verweist auf ${tokenId}, das fehlt.`);
    }
  }
}

function checkClaims(claims, out, options) {
  const ids = new Set();
  for (const claim of claims) {
    const where = isPlainObject(claim) && typeof claim.id === 'string' ? claim.id : 'claims';
    if (!isPlainObject(claim)) {
      out.error('CLAIM_SHAPE', where, 'Claim muss ein Objekt sein.');
      continue;
    }
    for (const key of CLAIM_REQUIRED) {
      if (claim[key] === undefined || claim[key] === '') out.error('REQUIRED', where, `Pflichtfeld ${key} fehlt.`);
    }
    if (typeof claim.id === 'string') {
      if (!ID_PATTERNS.claim.test(claim.id)) out.error('ID_PATTERN', where, 'Claim-ID muss CLM-### sein.');
      if (ids.has(claim.id)) out.error('DUPLICATE_ID', where, 'Claim-ID doppelt vergeben.');
      ids.add(claim.id);
    }
    if (typeof claim.kind === 'string' && !ENUMS.claimKinds.includes(claim.kind)) {
      out.error('ENUM', where, `kind ${claim.kind} ist nicht erlaubt.`);
    }
    if (typeof claim.verification === 'string' && !ENUMS.verification.includes(claim.verification)) {
      out.error('ENUM', where, `verification ${claim.verification} ist nicht erlaubt.`);
    }
    if (claim.verification === 'verified' && !claim.citation) {
      out.error('CLAIM_CITATION', where, 'verified ohne citation ist nicht zulässig.');
    }
    if (typeof claim.text_ref === 'string' && !TEXT_REF.test(claim.text_ref)) {
      out.error('TEXT_REF_FORMAT', where, `text_ref ${claim.text_ref} ist nicht wohlgeformt.`);
    }
    if (typeof claim.status === 'string' && !ENUMS.status.includes(claim.status)) {
      out.error('ENUM', where, `status ${claim.status} ist nicht erlaubt.`);
    }
    if (typeof claim.release_relevance === 'string' && !ENUMS.releaseRelevance.includes(claim.release_relevance)) {
      out.error('ENUM', where, `release_relevance ${claim.release_relevance} ist nicht erlaubt.`);
    }
    if (typeof claim.owner === 'string' && !ENUMS.owners.includes(claim.owner)) {
      out.error('ENUM', where, `owner ${claim.owner} ist kein bekanntes Profil.`);
    }
    if (claim.release_relevance === 'must' && claim.verification !== 'verified') {
      out.warn('CLAIM_BLOCKER_UNBELEGT', where, `release_relevance=must bei verification=${claim.verification} — Blocker für das Release-Gate.`);
    }
    if (claim.verification === 'verified' && claim.evidence === undefined && options.fs) {
      out.warn('CLAIM_EVIDENCE', where, 'verified ohne evidence — Nachweis fehlt.');
    }
  }
  return ids;
}

function validateDesign(doc, options = {}) {
  const opts = { fs: true, ...options };
  const out = report();
  if (!isPlainObject(doc)) {
    out.error('DOC_SHAPE', 'design-catalog.json', 'Wurzel muss ein Objekt sein.');
    return out;
  }
  if (doc.schema_version !== SCHEMA_VERSION) out.error('SCHEMA_VERSION', 'design-catalog.json', `schema_version muss ${SCHEMA_VERSION} sein.`);
  if (doc.catalog !== 'design') out.error('CATALOG_KIND', 'design-catalog.json', 'catalog muss "design" sein.');
  if (typeof doc.base_commit !== 'string' || !/^[0-9a-f]{7,40}$/.test(doc.base_commit)) {
    out.error('BASE_COMMIT', 'design-catalog.json', 'base_commit fehlt oder ist kein Git-Commit-Hash.');
  }
  if (typeof doc.stand !== 'string' || !ISO_DATE.test(doc.stand)) {
    out.error('STAND_FORMAT', 'design-catalog.json', 'stand muss YYYY-MM-DD sein.');
  }
  if (!Array.isArray(doc.entries) || doc.entries.length === 0) {
    out.error('ENTRIES_SHAPE', 'design-catalog.json', 'entries muss ein nicht-leeres Array sein.');
    return out;
  }
  doc.entries.forEach((entry, index) => checkCommon(entry, 'design', out, opts, index));
  checkUnique(doc.entries, 'design', out);
  checkTokenRefs(doc.entries, out);
  return withSummary(out, doc.entries);
}

function validateContent(doc, options = {}) {
  const opts = { fs: true, ...options };
  const out = report();
  if (!isPlainObject(doc)) {
    out.error('DOC_SHAPE', 'content-catalog.json', 'Wurzel muss ein Objekt sein.');
    return out;
  }
  if (doc.schema_version !== SCHEMA_VERSION) out.error('SCHEMA_VERSION', 'content-catalog.json', `schema_version muss ${SCHEMA_VERSION} sein.`);
  if (doc.catalog !== 'content') out.error('CATALOG_KIND', 'content-catalog.json', 'catalog muss "content" sein.');
  if (typeof doc.base_commit !== 'string' || !/^[0-9a-f]{7,40}$/.test(doc.base_commit)) {
    out.error('BASE_COMMIT', 'content-catalog.json', 'base_commit fehlt oder ist kein Git-Commit-Hash.');
  }
  if (typeof doc.stand !== 'string' || !ISO_DATE.test(doc.stand)) {
    out.error('STAND_FORMAT', 'content-catalog.json', 'stand muss YYYY-MM-DD sein.');
  }
  if (!Array.isArray(doc.entries) || doc.entries.length === 0) {
    out.error('ENTRIES_SHAPE', 'content-catalog.json', 'entries muss ein nicht-leeres Array sein.');
    return out;
  }
  if (!Array.isArray(doc.claims)) out.error('CLAIMS_SHAPE', 'content-catalog.json', 'claims muss ein Array sein (leer erlaubt).');

  const entries = doc.entries;
  entries.forEach((entry, index) => checkCommon(entry, 'content', out, opts, index));
  checkUnique(entries, 'content', out);
  const claimIds = Array.isArray(doc.claims) ? checkClaims(doc.claims, out, opts) : new Set();

  for (const entry of entries) {
    if (!Array.isArray(entry.claims)) continue;
    for (const claimId of entry.claims) {
      if (!ID_PATTERNS.claim.test(claimId)) out.error('CLAIM_REF_PATTERN', entry.id, `${claimId} ist keine Claim-ID.`);
      else if (!claimIds.has(claimId)) out.error('CLAIM_REF_MISSING', entry.id, `verweist auf ${claimId}, das in claims[] fehlt.`);
    }
  }
  // Jede Aussage muss von mindestens einem Eintrag referenziert sein, sonst ist sie im Katalog verwaist.
  if (Array.isArray(doc.claims)) {
    for (const claim of doc.claims) {
      const referenced = entries.some((entry) => Array.isArray(entry.claims) && entry.claims.includes(claim.id));
      if (!referenced) out.warn('CLAIM_ORPHAN', claim.id, 'kein Katalogeintrag verweist auf diesen Claim.');
    }
  }
  return withSummary(out, entries);
}

function validateMedia(rows, options = {}) {
  const opts = { fs: true, ...options };
  const out = report();
  if (!Array.isArray(rows) || rows.length < 2) {
    out.error('MEDIA_EMPTY', 'media-catalog.csv', 'CSV braucht Kopfzeile und mindestens eine Datenzeile.');
    return withSummary(out, []);
  }
  const header = rows[0];
  if (header.length !== MEDIA_COLUMNS.length || header.some((cell, index) => cell !== MEDIA_COLUMNS[index])) {
    out.error('MEDIA_HEADER', 'media-catalog.csv', `Kopfzeile muss exakt sein: ${MEDIA_COLUMNS.join(',')}`);
    return withSummary(out, []);
  }
  const seen = new Set();
  const entries = [];
  rows.slice(1).forEach((cells, index) => {
    const row = {};
    header.forEach((column, columnIndex) => {
      row[column] = (cells[columnIndex] || '').trim();
    });
    const where = `${row.id || 'media'}#Zeile ${index + 2}`;
    entries.push(row);
    if (!ID_PATTERNS.media.test(row.id)) out.error('ID_PATTERN', where, 'Medien-ID muss MED-#### sein.');
    if (seen.has(row.id)) out.error('DUPLICATE_ID', where, 'Medien-ID doppelt vergeben.');
    seen.add(row.id);
    if (!REPO_PATH.test(row.path)) {
      out.error('SOURCE_PATH_FORMAT', where, `${row.path} ist kein repo-relativer POSIX-Pfad.`);
    } else if (opts.fs && !exists(row.path)) {
      out.error('SOURCE_NOT_FOUND', where, `${row.path} existiert nicht.`);
    }
    if (!ENUMS.status.includes(row.status)) out.error('ENUM', where, `status ${row.status} ist nicht erlaubt.`);
    if (!ENUMS.releaseRelevance.includes(row.release_relevance))
      out.error('ENUM', where, `release_relevance ${row.release_relevance} ist nicht erlaubt.`);
    if (!ENUMS.licenseStatus.includes(row.license_status))
      out.error('ENUM', where, `license_status ${row.license_status} ist nicht erlaubt.`);
    if (!ENUMS.delivery.includes(row.delivery)) out.error('ENUM', where, `delivery ${row.delivery} ist nicht erlaubt.`);
    if (!SHA256.test(row.sha256)) out.error('SHA256_FORMAT', where, 'sha256 muss 64 Hexzeichen sein.');
    else if (opts.fs && REPO_PATH.test(row.path) && exists(row.path)) {
      const actual = sha256(row.path);
      if (actual !== row.sha256) out.error('SHA256_MISMATCH', where, `sha256 passt nicht zu ${row.path}.`);
    }
    const size = Number(row.bytes);
    if (!Number.isInteger(size) || size <= 0) out.error('BYTES_FORMAT', where, 'bytes muss eine positive Ganzzahl sein.');
    else if (opts.fs && REPO_PATH.test(row.path) && exists(row.path)) {
      const actualSize = fs.statSync(path.join(ROOT, row.path)).size;
      if (actualSize !== size) out.error('BYTES_MISMATCH', where, `bytes=${size}, Datei hat ${actualSize}.`);
    }
    const isVector = MEDIA_VECTOR_FORMATS.has(row.format.toLowerCase());
    for (const dimension of ['width_px', 'height_px']) {
      const value = row[dimension];
      if (isVector) {
        if (value !== 'n/a' && !/^[0-9]+$/.test(value)) out.error('DIMENSION_FORMAT', where, `${dimension} muss "n/a" oder eine Zahl sein.`);
      } else if (!/^[0-9]+$/.test(value) || Number(value) <= 0) {
        out.error('DIMENSION_MISSING', where, `${dimension} fehlt für Rasterformat ${row.format}.`);
      }
    }
    if (!row.alt_text) out.error('ALT_TEXT', where, 'alt_text fehlt (bei dekorativen Dateien "dekorativ" oder "n/a (Grund)" eintragen).');
    if (!row.used_on) out.error('USED_ON', where, 'used_on fehlt.');
    if (!row.license) out.error('LICENSE', where, 'license fehlt; ungeklärt als "ungeklaert" eintragen.');
    if (row.license_status === 'ungeklaert') {
      out.warn('LICENSE_OPEN', where, `${row.path}: Lizenz ungeklärt — vor Push klären oder bewusst als Restrisiko führen.`);
    }
    if (!row.sha256 && row.status === 'final') out.warn('MEDIA_UNHASHED', where, 'final ohne sha256.');
  });
  return withSummary(out, entries);
}

function withSummary(out, entries) {
  const countBy = (field) => {
    const map = new Map();
    for (const entry of entries) {
      if (!isPlainObject(entry)) continue;
      const key = entry[field] === undefined || entry[field] === '' ? '(leer)' : entry[field];
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
  };
  const total = entries.filter(isPlainObject).length;
  return {
    total,
    byStatus: countBy('status'),
    byRelevance: countBy('release_relevance'),
    byDelivery: countBy('delivery'),
    byType: countBy('type'),
    errors: out.errors,
    warnings: out.warnings,
    ok: out.errors.length === 0,
  };
}

function printResult(label, result, options = {}) {
  const verbose = options.verbose !== false;
  const lines = [];
  lines.push(`${label}: ${result.total} Einträge — Status ${formatCounts(result.byStatus)}`);
  if (verbose) {
    lines.push(`  Release-Relevanz: ${formatCounts(result.byRelevance)}`);
    lines.push(`  Auslieferung: ${formatCounts(result.byDelivery)}`);
  }
  for (const item of result.warnings) lines.push(`  WARNUNG [${item.code}] ${item.where}: ${item.message}`);
  for (const item of result.errors) lines.push(`  FEHLER  [${item.code}] ${item.where}: ${item.message}`);
  lines.push(`  → ${result.ok ? 'OK' : `${result.errors.length} Fehler`}, ${result.warnings.length} Warnungen`);
  console.log(lines.join('\n'));
}

function formatCounts(counts) {
  const parts = Object.entries(counts).map(([key, value]) => `${key}=${value}`);
  return parts.length ? parts.join(', ') : 'keine';
}

module.exports = {
  ROOT,
  CATALOG_DIR,
  SCHEMA_VERSION,
  SCOPE_DOCUMENT,
  TYPE_CODES,
  ENUMS,
  MEDIA_COLUMNS,
  ID_PATTERNS,
  readJson,
  parseCsv,
  relToRoot,
  exists,
  sha256,
  validateDesign,
  validateContent,
  validateMedia,
  printResult,
  formatCounts,
};
