// Radiästhesie — versionierte Datenverträge (ESM, ohne DOM).
//
// Verbindliche Schnittstelle zwischen den redaktionellen Daten
// (docs/radiasthesie-konzept/daten/taxonomie.json), den generierten Daten
// (js/data/radiasthesie.js) und den Werkstatt-Modulen RAD-07 bis RAD-10.
// Keine Netzwerkzugriffe, kein DOM, keine eigene Zeitquelle: `now` und `rng`
// werden injiziert, damit alles in Node und im Browser gleich prüfbar ist.
//
// Vertragsstand: 1.0 (CONTRACT_VERSION). Speicher-/Exportumschlag: 1
// (STORAGE_SCHEMA). Beide werden bei inkompatiblen Änderungen erhöht; ein
// unbekannter höherer Stand wird abgelehnt, nicht überschrieben.
//
// Begriffe:
// - Entität: Datensatz der Taxonomie (Instrument, Methode, Ereignis,
//   Erklärungsmodell, Studie, Medium, Experiment).
// - Lauf (run): Serie von n verblindeten Versuchen nach einem Protokoll.
// - Versuch (trial): Ziel-Commitment + gesperrte Vorhersage + Enthüllung.
//
// Die statistische Auswertung (exakter Binomialtest, Wilson-Intervall) ist
// NICHT Teil dieses Moduls. Hier wird nur das Protokoll verbindlich geprüft:
// feste Fallzahl n, Abbruchregel, Testart und Basiswahrscheinlichkeit 1/k.
// Die Rechenkerne gehören zu RAD-09 (KOMPONENTENGRENZEN.md §4).

export const CONTRACT_VERSION = '1.0';
export const STORAGE_SCHEMA = 1;
export const APP_ID = 'esoterik-welt';

export const TOPIC_IDS = ['radiasthesie', 'pendeln', 'orakel'];
export const EVIDENCE_LEVELS = ['A', 'B', 'C', 'D', 'E'];
export const REVIEW_STATUS = ['draft', 'reviewed', 'approved'];

export const COLLECTIONS = {
  instrumente: 'instrument',
  methoden: 'methode',
  ereignisse: 'ereignis',
  erklaerungsmodelle: 'erklaerungsmodell',
  studien: 'studie',
  medien: 'medium',
  experimente: 'experiment',
};

export const ENTITY_LABELS = {
  instrument: 'Instrument',
  methode: 'Methode',
  ereignis: 'Historisches Ereignis',
  erklaerungsmodell: 'Erklärungsmodell',
  studie: 'Studie',
  medium: 'Medium',
  experiment: 'Experiment',
};

export const INSTRUMENT_TYPES = ['rute', 'winkelrute', 'einhandrute', 'biotensor', 'pendel', 'tafel', 'skala'];
export const METHOD_TYPES = ['feldmutung', 'pendeln', 'tafelarbeit', 'kartenpendeln', 'diagnostik', 'pruefung'];
export const MODEL_TYPES = ['physiologisch', 'psychologisch', 'statistisch', 'geologisch'];
export const STUDY_TYPES = ['experiment', 'reanalyse', 'review', 'feldtest', 'uebersicht'];
export const MEDIA_TYPES = ['svg', 'photo'];
export const MEDIA_STATUS = ['available', 'planned'];
export const TEST_TYPES = ['jaNein', 'richtung', 'zahl', 'symbol'];
export const STOP_RULES = ['fixed-n'];
export const ANALYSIS_METHODS = ['binomial-exact', 'wilson-95'];
export const RUN_STATUS = ['running', 'complete'];
export const MODES = ['demo', 'test'];

export const EXPORT_KINDS = ['journal', 'experiment', 'tafel'];
export const MAX_IMPORT_BYTES = 1024 * 1024;

export const JOURNAL_LIMITS = {
  question: 200,
  prediction: 200,
  result: 500,
  review: 500,
  method: 60,
};

// --- Prüfbausteine --------------------------------------------------------

// Steuerzeichen außer \t, \n, \r. Bewusst als Zeichenprüfung statt als
// RegExp mit Steuerzeichen (ESLint no-control-regex) — gleiche Semantik.
function hasControlChars(value, multiline) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code === 0 || code === 127) return true;
    if (code < 32) {
      if (multiline && (code === 9 || code === 10 || code === 13)) continue;
      return true;
    }
  }
  return false;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isInteger(value) {
  return typeof value === 'number' && Number.isInteger(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isSourceRef(value) {
  return typeof value === 'string' && /^Q\d{2}$/.test(value);
}

export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isIsoDateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return false;
  return Number.isFinite(new Date(value).getTime());
}

function push(errors, path, rule, message) {
  errors.push({ path, rule, message: `${path}: ${message}` });
  return false;
}

function checkText(errors, path, value, options = {}) {
  const { required = true, min = 1, max = 1000, multiline = false, label = 'Text' } = options;
  if (value === undefined || value === null || value === '') {
    if (required) return push(errors, path, 'required', `${label} fehlt`);
    return true;
  }
  if (typeof value !== 'string') return push(errors, path, 'type', `${label} muss Text sein`);
  if (value.trim() === '') {
    if (required) return push(errors, path, 'required', `${label} ist leer`);
    return true;
  }
  if (value.trim() !== value) push(errors, path, 'trim', `${label} darf nicht mit Leerzeichen beginnen oder enden`);
  if (value.length < min) push(errors, path, 'minLength', `${label} ist zu kurz (min. ${min})`);
  if (value.length > max) push(errors, path, 'maxLength', `${label} ist zu lang (max. ${max})`);
  if (hasControlChars(value, multiline)) {
    push(errors, path, 'controlChars', `${label} enthält Steuerzeichen`);
  }
  return true;
}

function checkEnum(errors, path, value, allowed, label) {
  if (!allowed.includes(value)) {
    return push(errors, path, 'enum', `${label} muss einer von ${allowed.join(', ')} sein (war: ${String(value)})`);
  }
  return true;
}

function checkStringList(errors, path, value, options = {}) {
  const { minItems = 0, maxItems = 12, itemMax = 200, pattern = null, label = 'Liste' } = options;
  if (!Array.isArray(value)) return push(errors, path, 'type', `${label} muss ein Array sein`);
  if (value.length < minItems) push(errors, path, 'minItems', `${label} braucht mindestens ${minItems} Einträge`);
  if (value.length > maxItems) push(errors, path, 'maxItems', `${label} hat zu viele Einträge (max. ${maxItems})`);
  const seen = new Set();
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (typeof entry !== 'string' || entry.trim() === '') {
      push(errors, entryPath, 'type', 'Eintrag muss nicht-leerer Text sein');
      return;
    }
    if (entry.length > itemMax) push(errors, entryPath, 'maxLength', `Eintrag zu lang (max. ${itemMax})`);
    if (pattern && !pattern.test(entry)) push(errors, entryPath, 'format', `ungültiges Format: ${entry}`);
    if (seen.has(entry)) push(errors, entryPath, 'duplicate', `doppelter Eintrag: ${entry}`);
    seen.add(entry);
  });
  return true;
}

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

// --- Entitäten ------------------------------------------------------------

function validateBase(entity, path, errors) {
  if (!isObject(entity)) return push(errors, path, 'type', 'Entität muss ein Objekt sein');
  if (!isSlug(entity.id)) push(errors, `${path}.id`, 'format', 'id muss kleingeschriebener Slug sein');
  if (!isSlug(entity.slug)) push(errors, `${path}.slug`, 'format', 'slug muss kleingeschriebener Slug sein');
  if (isSlug(entity.id) && entity.id !== entity.slug) {
    push(errors, `${path}.slug`, 'identity', 'slug muss der id entsprechen (stabile Adressierung)');
  }
  checkText(errors, `${path}.title`, entity.title, { min: 3, max: 120, label: 'Titel' });
  checkText(errors, `${path}.category`, entity.category, { min: 3, max: 60, label: 'Kategorie' });
  checkText(errors, `${path}.summary`, entity.summary, { min: 20, max: 400, label: 'Zusammenfassung' });
  checkText(errors, `${path}.body`, entity.body, { required: false, max: 4000, multiline: true, label: 'Fließtext' });
  checkStringList(errors, `${path}.tags`, entity.tags, {
    minItems: 1,
    maxItems: 8,
    itemMax: 40,
    pattern: /^[a-z0-9-]+$/,
    label: 'Tags',
  });
  checkStringList(errors, `${path}.relatedTopics`, entity.relatedTopics, {
    minItems: 1,
    maxItems: 3,
    itemMax: 20,
    label: 'relatedTopics',
  });
  (entity.relatedTopics || []).forEach((topic, index) => {
    if (!TOPIC_IDS.includes(topic))
      push(errors, `${path}.relatedTopics[${index}]`, 'enum', `unbekanntes Thema: ${topic}`);
  });
  checkStringList(errors, `${path}.references`, entity.references, {
    minItems: 0,
    maxItems: 20,
    itemMax: 3,
    pattern: /^Q\d{2}$/,
    label: 'references',
  });
  checkStringList(errors, `${path}.images`, entity.images, {
    minItems: 0,
    maxItems: 6,
    itemMax: 64,
    label: 'images',
  });
  checkEnum(errors, `${path}.evidenceStatus`, entity.evidenceStatus, EVIDENCE_LEVELS, 'evidenceStatus');
  checkEnum(errors, `${path}.reviewStatus`, entity.reviewStatus, REVIEW_STATUS, 'reviewStatus');
  if (!isIsoDate(entity.lastReviewed)) {
    push(errors, `${path}.lastReviewed`, 'date', 'lastReviewed muss ein gültiges Datum YYYY-MM-DD sein');
  }
  return true;
}

function validateInstrument(entity, path, errors) {
  checkEnum(errors, `${path}.instrumentType`, entity.instrumentType, INSTRUMENT_TYPES, 'instrumentType');
  checkStringList(errors, `${path}.material`, entity.material, {
    minItems: 1,
    maxItems: 6,
    itemMax: 60,
    label: 'material',
  });
  checkText(errors, `${path}.usage`, entity.usage, { min: 3, max: 200, label: 'Verwendung' });
  checkText(errors, `${path}.assessment`, entity.assessment, { min: 20, max: 400, label: 'Einordnung' });
}

function validateMethode(entity, path, errors) {
  checkEnum(errors, `${path}.methodType`, entity.methodType, METHOD_TYPES, 'methodType');
  checkStringList(errors, `${path}.procedure`, entity.procedure, {
    minItems: 1,
    maxItems: 8,
    itemMax: 200,
    label: 'procedure',
  });
  checkText(errors, `${path}.assessment`, entity.assessment, { min: 20, max: 400, label: 'Einordnung' });
}

function validateEreignis(entity, path, errors) {
  const hasYear = isInteger(entity.year);
  const hasPeriod = typeof entity.period === 'string' && entity.period.trim() !== '';
  if (entity.year !== null && entity.year !== undefined && !isInteger(entity.year)) {
    push(errors, `${path}.year`, 'type', 'year muss eine ganze Zahl oder null sein');
  }
  if (!hasYear && !hasPeriod) push(errors, `${path}.year`, 'required', 'year oder period muss gesetzt sein');
  if (hasYear && (entity.year < -3000 || entity.year > 2100)) {
    push(errors, `${path}.year`, 'range', 'year liegt außerhalb des zulässigen Bereichs');
  }
  if (entity.period !== undefined && entity.period !== null) {
    checkText(errors, `${path}.period`, entity.period, { required: false, max: 60, label: 'Zeitraum' });
  }
  checkText(errors, `${path}.place`, entity.place, { required: false, max: 120, label: 'Ort' });
  checkStringList(errors, `${path}.actors`, entity.actors, { minItems: 0, maxItems: 8, itemMax: 120, label: 'actors' });
  if (typeof entity.dateDispute !== 'boolean')
    push(errors, `${path}.dateDispute`, 'type', 'dateDispute muss boolean sein');
  if (entity.dateDispute === true) {
    checkText(errors, `${path}.dateNote`, entity.dateNote, { min: 10, max: 300, label: 'Datierungsvermerk' });
  }
}

function validateErklaerungsmodell(entity, path, errors) {
  checkEnum(errors, `${path}.modelType`, entity.modelType, MODEL_TYPES, 'modelType');
  checkStringList(errors, `${path}.explains`, entity.explains, {
    minItems: 1,
    maxItems: 6,
    itemMax: 200,
    label: 'explains',
  });
  checkText(errors, `${path}.assessment`, entity.assessment, { min: 20, max: 400, label: 'Einordnung' });
}

function validateStudie(entity, path, errors, ctx) {
  checkEnum(errors, `${path}.studyType`, entity.studyType, STUDY_TYPES, 'studyType');
  if (entity.year !== null && !isInteger(entity.year)) {
    push(errors, `${path}.year`, 'type', 'year muss eine ganze Zahl oder null sein');
  }
  if (entity.year === null) {
    checkText(errors, `${path}.yearNote`, entity.yearNote, { min: 5, max: 200, label: 'Jahresvermerk' });
  }
  checkStringList(errors, `${path}.authors`, entity.authors, {
    minItems: 1,
    maxItems: 8,
    itemMax: 120,
    label: 'authors',
  });
  checkText(errors, `${path}.design`, entity.design, { min: 10, max: 300, label: 'Design' });
  checkText(errors, `${path}.result`, entity.result, { min: 20, max: 400, label: 'Ergebnis' });
  checkText(errors, `${path}.limits`, entity.limits, { min: 20, max: 400, label: 'Grenzen' });
  if (typeof entity.peerReviewed !== 'boolean')
    push(errors, `${path}.peerReviewed`, 'type', 'peerReviewed muss boolean sein');
  if (!isSourceRef(entity.sourceId)) {
    push(errors, `${path}.sourceId`, 'format', 'sourceId muss eine Quellen-ID Qxx sein');
  } else if (ctx.sourceIds && !ctx.sourceIds.has(entity.sourceId)) {
    push(errors, `${path}.sourceId`, 'reference', `unbekannte Quelle: ${entity.sourceId}`);
  } else if (!(entity.references || []).includes(entity.sourceId)) {
    push(errors, `${path}.sourceId`, 'reference', 'sourceId muss auch in references stehen');
  }
}

function validateMedium(entity, path, errors) {
  checkEnum(errors, `${path}.mediaType`, entity.mediaType, MEDIA_TYPES, 'mediaType');
  checkEnum(errors, `${path}.status`, entity.status, MEDIA_STATUS, 'status');
  checkText(errors, `${path}.alt`, entity.alt, { min: 10, max: 200, label: 'Alt-Text' });
  checkText(errors, `${path}.caption`, entity.caption, { min: 10, max: 300, label: 'Bildunterschrift' });
  checkText(errors, `${path}.creator`, entity.creator, { min: 3, max: 120, label: 'Urheber' });
  checkText(errors, `${path}.license`, entity.license, { min: 3, max: 120, label: 'Lizenz' });
  checkText(errors, `${path}.sourceUrl`, entity.sourceUrl, { required: false, max: 300, label: 'Quell-URL' });
  checkText(errors, `${path}.sourceNote`, entity.sourceNote, { required: false, max: 200, label: 'Quellvermerk' });
  if (
    !Array.isArray(entity.widths) ||
    entity.widths.length === 0 ||
    entity.widths.some((w) => !isInteger(w) || w < 16)
  ) {
    push(errors, `${path}.widths`, 'type', 'widths muss eine nicht-leere Liste ganzer Pixelbreiten sein');
  }
  if (typeof entity.ratio !== 'string' || !/^\d{1,3}:\d{1,3}$/.test(entity.ratio)) {
    push(errors, `${path}.ratio`, 'format', 'ratio muss wie 4:3 oder 520:400 geschrieben sein');
  }
  if (entity.status === 'available') {
    if (!/^assets\/radiasthesie\/[a-z0-9-]+\.(svg|webp|jpg|png)$/.test(entity.file || '')) {
      push(
        errors,
        `${path}.file`,
        'format',
        'verfügbares Medium braucht einen lokalen Dateipfad unter assets/radiasthesie/'
      );
    }
  } else if (entity.file !== '') {
    push(errors, `${path}.file`, 'state', 'geplantes Medium darf keinen Dateipfad vortäuschen');
  }
}

function validateExperiment(entity, path, errors) {
  const protocol = {
    testType: entity.testType,
    k: entity.k,
    n: entity.n,
    stopRule: entity.stopRule,
    analysis: entity.analysis,
    baseProbability: entity.baseProbability,
  };
  errors.push(...validateProtocol(protocol, path).errors);
  checkText(errors, `${path}.hypothesis`, entity.hypothesis, { min: 20, max: 300, label: 'Hypothese' });
  checkText(errors, `${path}.instructions`, entity.instructions, { min: 20, max: 500, label: 'Anleitung' });
  if (entity.mode !== 'test') {
    push(
      errors,
      `${path}.mode`,
      'enum',
      'Katalogexperimente sind Testmodus (mode: test); demo ist eine Laufzeitvariante'
    );
  }
}

const TYPE_VALIDATORS = {
  instrument: validateInstrument,
  methode: validateMethode,
  ereignis: validateEreignis,
  erklaerungsmodell: validateErklaerungsmodell,
  studie: validateStudie,
  medium: validateMedium,
  experiment: validateExperiment,
};

/**
 * Validiert eine einzelne Entität.
 * @returns {{ok: boolean, errors: Array<{path: string, rule: string, message: string}>}}
 */
export function validateEntity(type, entity, ctx = {}) {
  const errors = [];
  if (!Object.prototype.hasOwnProperty.call(TYPE_VALIDATORS, type)) {
    push(errors, String(type), 'unknownType', `unbekannter Entitätstyp: ${String(type)}`);
    return { ok: false, errors };
  }
  const path = ctx.path || type;
  if (validateBase(entity, path, errors)) {
    TYPE_VALIDATORS[type](entity, path, errors, ctx);
  }
  return { ok: errors.length === 0, errors };
}

/** Prüft ein Experimentprotokoll (auch für Laufzeitläufe). */
export function validateProtocol(protocol, path = 'protocol') {
  const errors = [];
  if (!isObject(protocol)) {
    push(errors, path, 'type', 'Protokoll muss ein Objekt sein');
    return { ok: false, errors };
  }
  checkEnum(errors, `${path}.testType`, protocol.testType, TEST_TYPES, 'testType');
  checkEnum(errors, `${path}.stopRule`, protocol.stopRule, STOP_RULES, 'stopRule');
  if (!isInteger(protocol.k) || protocol.k < 2 || protocol.k > 10) {
    push(errors, `${path}.k`, 'range', 'k (Zielraum) muss eine ganze Zahl von 2 bis 10 sein');
  }
  if (!isInteger(protocol.n) || protocol.n < 10 || protocol.n > 200) {
    push(errors, `${path}.n`, 'range', 'n (geplante Versuche) muss eine ganze Zahl von 10 bis 200 sein');
  }
  if (!Array.isArray(protocol.analysis) || protocol.analysis.length === 0) {
    push(errors, `${path}.analysis`, 'required', 'analysis muss die Testart nennen');
  } else {
    protocol.analysis.forEach((method, index) => {
      if (!ANALYSIS_METHODS.includes(method))
        push(errors, `${path}.analysis[${index}]`, 'enum', `unbekannte Testart: ${method}`);
    });
    if (!protocol.analysis.includes('binomial-exact')) {
      push(errors, `${path}.analysis`, 'required', 'exakter Binomialtest (binomial-exact) ist Pflicht');
    }
    if (new Set(protocol.analysis).size !== protocol.analysis.length) {
      push(errors, `${path}.analysis`, 'duplicate', 'Testarten dürfen sich nicht wiederholen');
    }
  }
  if (!isFiniteNumber(protocol.baseProbability)) {
    push(errors, `${path}.baseProbability`, 'type', 'baseProbability muss eine Zahl sein');
  } else if (isInteger(protocol.k) && Math.abs(protocol.baseProbability - 1 / protocol.k) > 1e-9) {
    push(
      errors,
      `${path}.baseProbability`,
      'consistency',
      `baseProbability muss 1/k sein (${(1 / protocol.k).toFixed(6)} bei k=${protocol.k})`
    );
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Validiert die gesamte Taxonomie inklusive referenzieller Integrität.
 * @param {object} taxonomie Rohdaten aus taxonomie.json bzw. data.taxonomie
 * @param {{sourceIds?: Iterable<string>, topicIds?: string[]}} ctx
 */
export function validateTaxonomie(taxonomie, ctx = {}) {
  const errors = [];
  if (!isObject(taxonomie)) {
    push(errors, 'taxonomie', 'type', 'Taxonomie muss ein Objekt sein');
    return { ok: false, errors, counts: {} };
  }
  if (taxonomie.$schema_version !== CONTRACT_VERSION) {
    push(
      errors,
      'taxonomie.$schema_version',
      'version',
      `erwartet ${CONTRACT_VERSION}, gefunden ${String(taxonomie.$schema_version)}`
    );
  }
  const sourceIds = ctx.sourceIds ? new Set(ctx.sourceIds) : null;
  const topicIds = ctx.topicIds || TOPIC_IDS;

  const mediaIds = new Set();
  for (const entry of taxonomie.medien || []) {
    if (isObject(entry) && isSlug(entry.id)) mediaIds.add(entry.id);
  }

  const ids = new Map();
  const slugs = new Map();
  const counts = {};

  for (const [key, type] of Object.entries(COLLECTIONS)) {
    const list = taxonomie[key];
    if (!Array.isArray(list)) {
      push(errors, `taxonomie.${key}`, 'type', `${key} muss ein Array sein`);
      continue;
    }
    counts[key] = list.length;
    list.forEach((entity, index) => {
      const path = `${key}[${index}]`;
      errors.push(...validateEntity(type, entity, { sourceIds, path }).errors);
      if (!isObject(entity)) return;
      for (const topic of entity.relatedTopics || []) {
        if (!topicIds.includes(topic))
          push(errors, `${path}.relatedTopics`, 'reference', `unbekanntes Thema: ${topic}`);
      }
      for (const image of entity.images || []) {
        if (!mediaIds.has(image)) push(errors, `${path}.images`, 'reference', `unbekanntes Medium: ${image}`);
      }
      if (sourceIds) {
        for (const ref of entity.references || []) {
          if (!sourceIds.has(ref)) push(errors, `${path}.references`, 'reference', `unbekannte Quelle: ${ref}`);
        }
      }
      if (isSlug(entity.id)) {
        if (ids.has(entity.id))
          push(errors, `${path}.id`, 'duplicate', `id "${entity.id}" ist bereits in ${ids.get(entity.id)} vergeben`);
        else ids.set(entity.id, path);
      }
      if (isSlug(entity.slug)) {
        if (slugs.has(entity.slug))
          push(
            errors,
            `${path}.slug`,
            'duplicate',
            `slug "${entity.slug}" ist bereits in ${slugs.get(entity.slug)} vergeben`
          );
        else slugs.set(entity.slug, path);
      }
    });
  }

  return { ok: errors.length === 0, errors, counts };
}

/**
 * Prüft den generierten Gesamtdatensatz (Artikelmodell + Taxonomie).
 * Das bestehende Artikel-/Quellenmodell wird nicht ersetzt, sondern als
 * Referenzraum für die neuen Entitäten geprüft.
 */
export function validateDataset(data) {
  const errors = [];
  if (!isObject(data)) {
    push(errors, 'data', 'type', 'Datensatz muss ein Objekt sein');
    return { ok: false, errors };
  }
  if (data.schemaVersion !== CONTRACT_VERSION) {
    push(
      errors,
      'data.schemaVersion',
      'version',
      `erwartet ${CONTRACT_VERSION}, gefunden ${String(data.schemaVersion)}`
    );
  }
  if (!isObject(data.topics)) push(errors, 'data.topics', 'required', 'Artikelthemen fehlen');
  if (!Array.isArray(data.sources)) push(errors, 'data.sources', 'required', 'Quellen fehlen');
  const sourceIds = new Set((data.sources || []).map((source) => source && source.id));
  for (const source of data.sources || []) {
    if (!isSourceRef(source && source.id))
      push(errors, 'data.sources', 'format', `ungültige Quellen-ID: ${String(source && source.id)}`);
  }
  const result = validateTaxonomie(data.taxonomie, {
    sourceIds,
    topicIds: Object.keys(data.topics || {}),
  });
  for (const error of result.errors) {
    errors.push({ ...error, path: error.path.startsWith('taxonomie') ? error.path : `taxonomie.${error.path}` });
  }
  return { ok: errors.length === 0, errors, counts: result.counts };
}

// --- Experimentläufe: Commit-Reveal ---------------------------------------

function defaultNow() {
  return new Date();
}

function defaultRng() {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject && typeof cryptoObject.getRandomValues === 'function') {
    return () => cryptoObject.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
  }
  return () => Math.random();
}

function randomIndex(k, rng) {
  const limit = Math.floor(0x100000000 / k) * k;
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const value = rng();
    if (!isFiniteNumber(value) || value < 0 || value >= 1) throw new Error('Zufallsquelle muss Werte in [0,1) liefern');
    const raw = Math.floor(value * 0x100000000);
    if (raw < limit) return raw % k;
  }
  throw new Error('Zufallsquelle liefert keine verwendbaren Werte (Rejection Sampling)');
}

function randomHex(rng, bytes = 16) {
  const parts = [];
  for (let index = 0; index < bytes; index += 1) parts.push(randomIndex(256, rng).toString(16).padStart(2, '0'));
  return parts.join('');
}

async function sha256Hex(text) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle || typeof subtle.digest !== 'function') {
    throw new Error('SHA-256 ist in dieser Umgebung nicht verfügbar (Web Crypto fehlt)');
  }
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function commitmentPayload(runId, trialIndex, salt, targetIndex) {
  return `${runId}|${trialIndex}|${salt}|${targetIndex}`;
}

function protocolFromExperiment(experiment) {
  return {
    testType: experiment.testType,
    k: experiment.k,
    n: experiment.n,
    stopRule: experiment.stopRule,
    analysis: [...experiment.analysis],
    baseProbability: experiment.baseProbability,
  };
}

/**
 * Legt einen Lauf an. Das Ziel wird NICHT im Lauf gespeichert: nur ein
 * SHA-256-Commitment über (runId, trialIndex, Salt, Zielindex). Das Salt lebt
 * ausschließlich im Rückgabewert von `beginTrial` und gehört in den Speicher
 * des Moduls, nicht in `localStorage`.
 */
export async function createRun(experiment, options = {}) {
  const { now = defaultNow, runId = null, batchId = 'lokal', mode = 'test', rng = defaultRng() } = options;
  const validation = validateEntity('experiment', experiment);
  if (!validation.ok) throw new Error(`Experiment ist kein gültiges Protokoll: ${validation.errors[0].message}`);
  if (!MODES.includes(mode)) throw new Error(`Unbekannter Modus: ${mode}`);
  const timestamp = now();
  if (!(timestamp instanceof Date) || !Number.isFinite(timestamp.getTime()))
    throw new Error('now muss ein gültiges Date liefern');
  const iso = timestamp.toISOString();
  const resolvedRunId = runId || `run-${iso.replace(/[-:.TZ]/g, '').slice(0, 14)}-${randomHex(rng, 3)}`;
  if (!/^run-[a-z0-9-]{6,}$/.test(resolvedRunId)) throw new Error('runId muss dem Muster run-… entsprechen');
  return freezeDeep({
    schema: STORAGE_SCHEMA,
    runId: resolvedRunId,
    experimentId: experiment.id,
    protocol: protocolFromExperiment(experiment),
    mode,
    batchId,
    createdAt: iso,
    status: 'running',
    trials: [],
  });
}

/**
 * Beginnt den nächsten Versuch: zieht das Ziel verdeckt und liefert Lauf plus
 * geheimes Ziel (`secret`). Das Secret darf nur im Modulspeicher leben und
 * muss bei aufgegebenem Lauf verworfen werden.
 */
export async function beginTrial(run, options = {}) {
  assertRun(run);
  const { rng = defaultRng(), now = defaultNow } = options;
  if (run.trials.length >= run.protocol.n) throw new Error('Alle geplanten Versuche sind bereits angelegt');
  const trialIndex = run.trials.length + 1;
  const targetIndex = randomIndex(run.protocol.k, rng);
  const salt = randomHex(rng, 16);
  const committedAt = now().toISOString();
  const digest = await sha256Hex(commitmentPayload(run.runId, trialIndex, salt, targetIndex));
  const trial = {
    index: trialIndex,
    targetCommitment: { algorithm: 'sha256', digest, committedAt },
    predictionLocked: null,
    resultRevealed: null,
  };
  return {
    run: freezeDeep({ ...run, trials: [...run.trials, trial] }),
    secret: freezeDeep({ runId: run.runId, trialIndex, targetIndex, salt }),
  };
}

/**
 * Sperrt die Antwort. Ab hier ist sie unveränderlich; eine zweite Sperre oder
 * eine Sperre nach der Enthüllung ist ein Vertragsbruch und wirft.
 */
export function lockPrediction(run, trialIndex, answerIndex, options = {}) {
  assertRun(run);
  const { now = defaultNow } = options;
  const position = run.trials.findIndex((trial) => trial.index === trialIndex);
  if (position < 0) throw new Error(`Versuch ${trialIndex} existiert nicht`);
  const trial = run.trials[position];
  if (trial.resultRevealed) throw new Error('Antwort kann nach der Enthüllung nicht mehr gesperrt werden');
  if (trial.predictionLocked) throw new Error('Antwort ist bereits gesperrt und unveränderlich');
  if (trialIndex !== run.trials.length) throw new Error('Es kann nur der aktuelle Versuch beantwortet werden');
  if (!isInteger(answerIndex) || answerIndex < 0 || answerIndex >= run.protocol.k) {
    throw new Error(`Antwort muss ein Index von 0 bis ${run.protocol.k - 1} sein`);
  }
  const lockedAt = now().toISOString();
  const next = {
    ...run,
    trials: run.trials.map((entry, index) =>
      index === position ? { ...entry, predictionLocked: { answerIndex, lockedAt, locked: true } } : entry
    ),
  };
  const check = validateRun(next);
  if (!check.ok) throw new Error(`Lauf wäre ungültig: ${check.errors[0].message}`);
  return freezeDeep(next);
}

/**
 * Enthüllt das Ziel. Setzt eine gesperrte Vorhersage voraus, prüft das
 * Commitment gegen das Secret und berechnet den Treffer.
 */
export async function revealResult(run, trialIndex, secret, options = {}) {
  assertRun(run);
  const { now = defaultNow } = options;
  const position = run.trials.findIndex((trial) => trial.index === trialIndex);
  if (position < 0) throw new Error(`Versuch ${trialIndex} existiert nicht`);
  const trial = run.trials[position];
  if (!trial.predictionLocked) throw new Error('Enthüllung ohne gesperrte Vorhersage ist nicht zulässig');
  if (trial.resultRevealed) throw new Error('Versuch ist bereits enthüllt');
  if (!isObject(secret) || secret.runId !== run.runId || secret.trialIndex !== trialIndex) {
    throw new Error('Secret gehört nicht zu diesem Versuch');
  }
  if (!isInteger(secret.targetIndex) || secret.targetIndex < 0 || secret.targetIndex >= run.protocol.k) {
    throw new Error('Secret enthält kein gültiges Ziel');
  }
  const digest = await sha256Hex(commitmentPayload(run.runId, trialIndex, secret.salt, secret.targetIndex));
  if (digest !== trial.targetCommitment.digest)
    throw new Error('Commitment-Prüfung fehlgeschlagen — Ziel oder Salt manipuliert');
  const revealedAt = now().toISOString();
  const answerIndex = trial.predictionLocked.answerIndex;
  const hit = answerIndex === secret.targetIndex;
  const nextTrials = run.trials.map((entry, index) =>
    index === position ? { ...entry, resultRevealed: { targetIndex: secret.targetIndex, revealedAt, hit } } : entry
  );
  const complete = nextTrials.length === run.protocol.n && nextTrials.every((entry) => entry.resultRevealed);
  const next = { ...run, trials: nextTrials, status: complete ? 'complete' : 'running' };
  const check = validateRun(next);
  if (!check.ok) throw new Error(`Lauf wäre ungültig: ${check.errors[0].message}`);
  return { run: freezeDeep(next), hit };
}

/** Prüft einen gespeicherten Lauf vollständig, inklusive Reihenfolge und Leckfreiheit. */
export function validateRun(run) {
  const errors = [];
  if (!isObject(run)) {
    push(errors, 'run', 'type', 'Lauf muss ein Objekt sein');
    return { ok: false, errors };
  }
  if (run.schema !== STORAGE_SCHEMA)
    push(errors, 'run.schema', 'version', `erwartet ${STORAGE_SCHEMA}, gefunden ${String(run.schema)}`);
  if (typeof run.runId !== 'string' || !/^run-[a-z0-9-]{6,}$/.test(run.runId))
    push(errors, 'run.runId', 'format', 'runId fehlt oder ist ungültig');
  if (typeof run.experimentId !== 'string' || !/^exp-[a-z0-9-]+$/.test(run.experimentId)) {
    push(errors, 'run.experimentId', 'format', 'experimentId muss auf ein Katalogexperiment verweisen');
  }
  errors.push(...validateProtocol(run.protocol, 'run.protocol').errors);
  if (!MODES.includes(run.mode)) push(errors, 'run.mode', 'enum', 'mode muss demo oder test sein');
  checkText(errors, 'run.batchId', run.batchId, { min: 1, max: 60, label: 'batchId' });
  if (!isIsoDateTime(run.createdAt)) push(errors, 'run.createdAt', 'date', 'createdAt muss ein ISO-Zeitstempel sein');
  if (!RUN_STATUS.includes(run.status)) push(errors, 'run.status', 'enum', 'status muss running oder complete sein');
  if (!Array.isArray(run.trials)) {
    push(errors, 'run.trials', 'type', 'trials muss ein Array sein');
    return { ok: errors.length === 0, errors };
  }
  const n = isInteger(run.protocol && run.protocol.n) ? run.protocol.n : 0;
  const k = isInteger(run.protocol && run.protocol.k) ? run.protocol.k : 0;
  if (run.trials.length > n) push(errors, 'run.trials', 'maxItems', 'mehr Versuche als geplant');
  let revealedSeen = 0;
  run.trials.forEach((trial, index) => {
    const path = `run.trials[${index}]`;
    if (!isObject(trial)) {
      push(errors, path, 'type', 'Versuch muss ein Objekt sein');
      return;
    }
    const allowed = ['index', 'targetCommitment', 'predictionLocked', 'resultRevealed'];
    for (const key of Object.keys(trial)) {
      if (!allowed.includes(key))
        push(
          errors,
          `${path}.${key}`,
          'forbidden',
          'unerlaubtes Feld — Ziel darf vor der Enthüllung nicht im Lauf stehen'
        );
    }
    if (trial.index !== index + 1)
      push(errors, `${path}.index`, 'sequence', 'Versuchsnummern müssen lückenlos ab 1 laufen');
    const commitment = trial.targetCommitment;
    if (!isObject(commitment)) {
      push(errors, `${path}.targetCommitment`, 'required', 'Ziel-Commitment fehlt');
    } else {
      if (commitment.algorithm !== 'sha256')
        push(errors, `${path}.targetCommitment.algorithm`, 'enum', 'nur sha256 ist zulässig');
      if (typeof commitment.digest !== 'string' || !/^[0-9a-f]{64}$/.test(commitment.digest)) {
        push(errors, `${path}.targetCommitment.digest`, 'format', 'digest muss ein SHA-256-Hexwert sein');
      }
      if (!isIsoDateTime(commitment.committedAt))
        push(errors, `${path}.targetCommitment.committedAt`, 'date', 'committedAt fehlt');
    }
    if (trial.predictionLocked) {
      const locked = trial.predictionLocked;
      if (locked.locked !== true)
        push(errors, `${path}.predictionLocked.locked`, 'state', 'gesperrte Vorhersage braucht locked: true');
      if (!isInteger(locked.answerIndex) || locked.answerIndex < 0 || (k && locked.answerIndex >= k)) {
        push(errors, `${path}.predictionLocked.answerIndex`, 'range', `answerIndex muss 0..${k - 1} sein`);
      }
      if (!isIsoDateTime(locked.lockedAt)) push(errors, `${path}.predictionLocked.lockedAt`, 'date', 'lockedAt fehlt');
      if (commitment && commitment.committedAt && locked.lockedAt < commitment.committedAt) {
        push(errors, `${path}.predictionLocked.lockedAt`, 'sequence', 'Sperre muss nach dem Commitment liegen');
      }
    }
    if (trial.resultRevealed) {
      const revealed = trial.resultRevealed;
      if (!trial.predictionLocked)
        push(errors, `${path}.resultRevealed`, 'sequence', 'Enthüllung ohne gesperrte Vorhersage');
      if (!isInteger(revealed.targetIndex) || revealed.targetIndex < 0 || (k && revealed.targetIndex >= k)) {
        push(errors, `${path}.resultRevealed.targetIndex`, 'range', `targetIndex muss 0..${k - 1} sein`);
      }
      if (!isIsoDateTime(revealed.revealedAt))
        push(errors, `${path}.resultRevealed.revealedAt`, 'date', 'revealedAt fehlt');
      if (trial.predictionLocked && revealed.hit !== (trial.predictionLocked.answerIndex === revealed.targetIndex)) {
        push(errors, `${path}.resultRevealed.hit`, 'consistency', 'hit stimmt nicht mit Antwort und Ziel überein');
      }
      if (trial.predictionLocked && revealed.revealedAt < trial.predictionLocked.lockedAt) {
        push(errors, `${path}.resultRevealed.revealedAt`, 'sequence', 'Enthüllung muss nach der Sperre liegen');
      }
      revealedSeen += 1;
      if (revealedSeen - 1 !== index) push(errors, path, 'sequence', 'Versuche müssen in Reihenfolge enthüllt werden');
    }
  });
  if (run.status === 'complete' && revealedSeen !== n)
    push(errors, 'run.status', 'state', 'complete erfordert n enthüllte Versuche');
  if (run.status === 'running' && revealedSeen === n && n > 0)
    push(errors, 'run.status', 'state', 'alle Versuche enthüllt — Status muss complete sein');
  return { ok: errors.length === 0, errors };
}

/** Sicht für die Oberfläche: enthält kein Ziel, solange nicht enthüllt. */
export function publicSnapshot(run) {
  return {
    runId: run.runId,
    experimentId: run.experimentId,
    mode: run.mode,
    batchId: run.batchId,
    createdAt: run.createdAt,
    status: run.status,
    protocol: { ...run.protocol },
    trials: run.trials.map((trial) => ({
      index: trial.index,
      hasTargetCommitment: Boolean(trial.targetCommitment),
      locked: Boolean(trial.predictionLocked),
      revealed: Boolean(trial.resultRevealed),
      ...(trial.resultRevealed
        ? {
            targetIndex: trial.resultRevealed.targetIndex,
            hit: trial.resultRevealed.hit,
            revealedAt: trial.resultRevealed.revealedAt,
          }
        : {}),
    })),
  };
}

/** Fortschritt/Auswertungsfähigkeit — die Statistik selbst gehört zu RAD-09. */
export function runSummary(run) {
  const revealed = run.trials.filter((trial) => trial.resultRevealed);
  const hits = revealed.filter((trial) => trial.resultRevealed.hit).length;
  return {
    planned: run.protocol.n,
    started: run.trials.length,
    answered: run.trials.filter((trial) => trial.predictionLocked).length,
    revealed: revealed.length,
    hits,
    expectedHits: revealed.length * run.protocol.baseProbability,
    baseProbability: run.protocol.baseProbability,
    testType: run.protocol.testType,
    stopRule: run.protocol.stopRule,
    analysis: [...run.protocol.analysis],
    complete: revealed.length === run.protocol.n,
    evaluable: revealed.length === run.protocol.n,
  };
}

function assertRun(run) {
  const check = validateRun(run);
  if (!check.ok) throw new Error(`Ungültiger Lauf: ${check.errors[0].message}`);
}

// --- Tagebuch -------------------------------------------------------------

function validateJournalBase(entry, errors, ctx) {
  if (!isObject(entry)) return push(errors, 'journal', 'type', 'Eintrag muss ein Objekt sein');
  if (ctx.requireId !== false && (typeof entry.id !== 'string' || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(entry.id))) {
    push(errors, 'id', 'format', 'id fehlt oder ist kein stabiler Slug');
  }
  if (!isIsoDate(entry.date)) push(errors, 'date', 'date', 'date muss ein gültiges Datum YYYY-MM-DD sein');
  checkText(errors, 'question', entry.question, { min: 3, max: JOURNAL_LIMITS.question, label: 'Frage' });
  checkText(errors, 'prediction', entry.prediction, { min: 1, max: JOURNAL_LIMITS.prediction, label: 'Vorhersage' });
  if (entry.method !== undefined && entry.method !== null && entry.method !== '') {
    checkText(errors, 'method', entry.method, { required: false, max: JOURNAL_LIMITS.method, label: 'Methode' });
    if (Array.isArray(ctx.methodIds) && !ctx.methodIds.includes(entry.method)) {
      push(errors, 'method', 'enum', `unbekannte Methode: ${entry.method}`);
    }
  }
  if (entry.confidence !== undefined && entry.confidence !== null) {
    if (!isInteger(entry.confidence) || entry.confidence < 1 || entry.confidence > 5) {
      push(errors, 'confidence', 'range', 'confidence muss eine ganze Zahl von 1 bis 5 sein');
    }
  }
  checkText(errors, 'result', entry.result, {
    required: false,
    max: JOURNAL_LIMITS.result,
    multiline: true,
    label: 'Ergebnis',
  });
  checkText(errors, 'review', entry.review, {
    required: false,
    max: JOURNAL_LIMITS.review,
    multiline: true,
    label: 'Bewertung',
  });
  if (entry.experimentId !== undefined && entry.experimentId !== null && entry.experimentId !== '') {
    if (typeof entry.experimentId !== 'string' || !/^exp-[a-z0-9-]+$/.test(entry.experimentId)) {
      push(errors, 'experimentId', 'format', 'experimentId muss auf ein Katalogexperiment verweisen (exp-…)');
    }
  }
  if (entry.runId !== undefined && entry.runId !== null && entry.runId !== '') {
    if (typeof entry.runId !== 'string' || !/^run-[a-z0-9-]{6,}$/.test(entry.runId)) {
      push(errors, 'runId', 'format', 'runId muss auf einen Lauf verweisen (run-…)');
    } else if (Array.isArray(ctx.runs)) {
      const run = ctx.runs.find((candidate) => candidate && candidate.runId === entry.runId);
      if (!run) {
        push(errors, 'runId', 'reference', `unbekannter Lauf: ${entry.runId}`);
      } else if (entry.experimentId && run.experimentId !== entry.experimentId) {
        push(errors, 'experimentId', 'reference', 'experimentId passt nicht zum referenzierten Lauf');
      }
    }
  }
  if (entry.runId && !entry.experimentId) push(errors, 'experimentId', 'required', 'runId erfordert experimentId');
  if (entry.createdAt !== undefined && !isIsoDateTime(entry.createdAt)) {
    push(errors, 'createdAt', 'date', 'createdAt muss ein ISO-Zeitstempel sein');
  }
  return errors.length === 0;
}

/** Prüft einen Tagebucheintrag. Unbekannte Felder werden ignoriert (§7.3). */
export function validateJournalEntry(entry, ctx = {}) {
  const errors = [];
  validateJournalBase(entry, errors, ctx);
  return { ok: errors.length === 0, errors };
}

/** Erzeugt einen Eintrag; ungültige Eingaben werden nicht übernommen. */
export function createEntry(input, options = {}) {
  const { now = defaultNow, rng = defaultRng(), methodIds = null, runs = null } = options;
  const stamp = now();
  const source = isObject(input) ? input : {};
  const id =
    typeof source.id === 'string' && source.id
      ? source.id
      : `jr-${stamp
          .toISOString()
          .replace(/[-:.TZ]/g, '')
          .slice(0, 14)}-${randomHex(rng, 2)}`;
  const entry = {
    id,
    date: source.date || stamp.toISOString().slice(0, 10),
    question: source.question,
    prediction: source.prediction,
    ...(source.method ? { method: source.method } : {}),
    ...(source.confidence !== undefined && source.confidence !== null ? { confidence: source.confidence } : {}),
    ...(source.result ? { result: source.result } : {}),
    ...(source.review ? { review: source.review } : {}),
    ...(source.experimentId ? { experimentId: source.experimentId } : {}),
    ...(source.runId ? { runId: source.runId } : {}),
    createdAt: stamp.toISOString(),
  };
  const check = validateJournalEntry(entry, { methodIds, runs, requireId: true });
  if (!check.ok) return { ok: false, entry: null, errors: check.errors };
  return { ok: true, entry: freezeDeep(entry), errors: [] };
}

/**
 * Übernimmt einen abgeschlossenen Lauf ins Tagebuch. Die Vorhersage ist das
 * vorregistrierte Protokoll (die Einzelantworten sind bereits im Lauf
 * unveränderlich gespeichert und werden nicht dupliziert).
 */
export function entryFromRun(run, input, options = {}) {
  const check = validateRun(run);
  if (!check.ok) return { ok: false, entry: null, errors: check.errors };
  const summary = runSummary(run);
  if (!summary.evaluable) {
    return {
      ok: false,
      entry: null,
      errors: [{ path: 'run', rule: 'state', message: 'run: Lauf ist noch nicht vollständig enthüllt' }],
    };
  }
  const { now = defaultNow, rng = defaultRng(), methodIds = null } = options;
  const source = isObject(input) ? input : {};
  const prediction = `Vorregistriert: ${run.experimentId}, n=${summary.planned}, k=${run.protocol.k}, p=${summary.baseProbability}`;
  const result =
    source.result || `${summary.hits}/${summary.planned} Treffer bei Zufallserwartung ${summary.expectedHits}`;
  return createEntry(
    {
      question: source.question,
      prediction: source.prediction || prediction,
      method: source.method,
      confidence: source.confidence,
      result: source.result || result,
      review: source.review,
      experimentId: run.experimentId,
      runId: run.runId,
    },
    { now, rng, methodIds, runs: [run] }
  );
}

// --- Export / Import ------------------------------------------------------

function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

/**
 * Baut den Exportumschlag (§7.1). Prüft vorher alle Einträge; bei einem Fehler
 * wird nichts exportiert.
 */
export function exportEnvelope(kind, data, options = {}) {
  const { now = defaultNow, methodIds = null, runs = null } = options;
  const errors = [];
  if (!EXPORT_KINDS.includes(kind)) {
    push(errors, 'kind', 'enum', `unbekannte Exportart: ${String(kind)}`);
    return { ok: false, envelope: null, errors };
  }
  if (kind === 'tafel') {
    if (!isObject(data)) push(errors, 'data', 'type', 'Tafel-Export erwartet ein Objekt');
  } else if (!Array.isArray(data)) {
    push(errors, 'data', 'type', 'Export erwartet ein Array');
  } else {
    data.forEach((entry, index) => {
      const result = kind === 'journal' ? validateJournalEntry(entry, { methodIds, runs }) : validateRun(entry);
      for (const error of result.errors) errors.push({ ...error, path: `data[${index}].${error.path}` });
    });
  }
  if (errors.length) return { ok: false, envelope: null, errors };
  return {
    ok: true,
    envelope: {
      schema: STORAGE_SCHEMA,
      app: APP_ID,
      kind,
      exportedAt: now().toISOString(),
      data,
    },
    errors: [],
  };
}

export function serializeEnvelope(kind, data, options = {}) {
  const result = exportEnvelope(kind, data, options);
  if (!result.ok) return { ok: false, text: '', errors: result.errors };
  return { ok: true, text: JSON.stringify(result.envelope, null, 2), errors: [] };
}

/**
 * Liest einen Exportumschlag atomar ein: ein einziger ungültiger Eintrag führt
 * dazu, dass nichts übernommen wird. Unbekannte Felder werden ignoriert.
 */
export function importEnvelope(text, options = {}) {
  const { kind = null, maxBytes = MAX_IMPORT_BYTES, methodIds = null, runs = null } = options;
  const errors = [];
  if (typeof text !== 'string') {
    push(errors, 'text', 'type', 'Import erwartet Text');
    return { ok: false, value: null, errors };
  }
  const size = byteLength(text);
  if (size > maxBytes) {
    push(errors, 'text', 'maxBytes', `Import ist zu groß (${size} > ${maxBytes} Bytes)`);
    return { ok: false, value: null, errors };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    push(errors, 'text', 'json', `JSON nicht lesbar: ${error.message}`);
    return { ok: false, value: null, errors };
  }
  if (!isObject(parsed)) {
    push(errors, 'envelope', 'type', 'Umschlag muss ein Objekt sein');
    return { ok: false, value: null, errors };
  }
  if (parsed.app !== APP_ID) push(errors, 'app', 'value', `app muss ${APP_ID} sein`);
  if (parsed.schema !== STORAGE_SCHEMA) {
    push(
      errors,
      'schema',
      'version',
      `Schema ${STORAGE_SCHEMA} erwartet, gefunden ${String(parsed.schema)} — nicht überschrieben`
    );
  }
  if (!EXPORT_KINDS.includes(parsed.kind)) push(errors, 'kind', 'enum', `unbekannte Exportart: ${String(parsed.kind)}`);
  if (kind && parsed.kind !== kind)
    push(errors, 'kind', 'mismatch', `erwartet ${kind}, gefunden ${String(parsed.kind)}`);
  if (!isIsoDateTime(parsed.exportedAt))
    push(errors, 'exportedAt', 'date', 'exportedAt fehlt oder ist kein ISO-Zeitstempel');
  if (parsed.kind === 'tafel') {
    if (!isObject(parsed.data)) push(errors, 'data', 'type', 'Tafel-Daten müssen ein Objekt sein');
  } else if (parsed.kind === 'journal' || parsed.kind === 'experiment') {
    if (!Array.isArray(parsed.data)) {
      push(errors, 'data', 'type', 'Daten müssen ein Array sein');
    } else {
      parsed.data.forEach((entry, index) => {
        const result =
          parsed.kind === 'journal' ? validateJournalEntry(entry, { methodIds, runs }) : validateRun(entry);
        for (const error of result.errors) errors.push({ ...error, path: `data[${index}].${error.path}` });
      });
    }
  }
  if (errors.length) return { ok: false, value: null, errors };
  return {
    ok: true,
    value: {
      schema: parsed.schema,
      app: parsed.app,
      kind: parsed.kind,
      exportedAt: parsed.exportedAt,
      data: parsed.data,
    },
    errors: [],
  };
}

export function journalMethods(taxonomie) {
  return ((taxonomie && taxonomie.methoden) || []).map((method) => method.id);
}

export default {
  CONTRACT_VERSION,
  STORAGE_SCHEMA,
  APP_ID,
  COLLECTIONS,
  JOURNAL_LIMITS,
  validateEntity,
  validateProtocol,
  validateTaxonomie,
  validateDataset,
  validateRun,
  validateJournalEntry,
  createRun,
  beginTrial,
  lockPrediction,
  revealResult,
  publicSnapshot,
  runSummary,
  createEntry,
  entryFromRun,
  exportEnvelope,
  serializeEnvelope,
  importEnvelope,
  journalMethods,
};
