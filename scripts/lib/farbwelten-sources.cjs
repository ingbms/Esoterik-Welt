// Einzige Quelle der Wahrheit für den Quellenabgleich der Farbwelten-Seiten.
//
// Jede Redaktionsseite unter content/farbwelten/*.md führt ihre eigene
// Bibliografie. `scripts/generate-farbwelten-data.cjs` (`registerSources`)
// übernimmt je Kennung nur *einen* Kandidaten und entscheidet bei mehreren
// stillen Fassungen nach `(url ? 100000 : 0) + label.length`. Führt eine
// Altseite dieselbe Kennung mit anderem Label oder anderer URL, gewinnt
// schlicht die längere Zeichenkette — die sachlich falsche Fassung kann das
// Register überschreiben, ohne dass irgendein Test anschlägt. Genau das ist
// bei [24]/[31] (t_e3ecc54e) und [19] (t_6dc6b194) passiert.
//
// Dieses Modul vergleicht deshalb alle Fassungen je Kennung und meldet
// Abweichungen, statt sie zu sortieren. Es ändert nichts: reine Erkennung.
//
// Fehler (blockierend) — die Fassungen bezeichnen unterschiedliche Dokumente:
//   url-konflikt          verschiedene normalisierte URLs (auch: URL vs. keine URL)
//   identitaetskonflikt   gleiche URL, aber abweichende Jahres-/Band-/ISBN-Angaben
//   register-abweichung   js/data/farbwelten.js führt nicht den vollständigsten
//                         Kandidaten der Dokumente (veraltete Daten)
//   register-fremd        Registerfassung (Label+URL) kommt in keinem Dokument vor
//
// Hinweise (nicht blockierend, werden gezählt und ausgegeben):
//   label-variante        gleiche URL, nur unterschiedlich ausführliche Labels
//   gleichstand           zwei Kandidaten mit gleichem Score (stiller Tie-Break)
//   kettung               „- [1][2][3] – siehe …" ist keine bibliografische Angabe
//
// Die Trennung ist sachlich begründet: bei identischer URL zeigen alle Seiten
// dasselbe Dokument, der Tie-Break wählt deterministisch die ausführlichste
// Schreibweise. Bei abweichender URL oder abweichenden Jahres-/Bandangaben
// behaupten die Seiten unterschiedliche Quellen — das ist der Defekt, der
// [24]/[31]/[19] produziert hat.
//
// Aufruf als Modul:   require('./scripts/lib/farbwelten-sources.cjs')
// Aufruf als CLI:     node scripts/lib/farbwelten-sources.cjs [--strict-labels] [--json <datei>]

'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Diese Seiten rendern eigene Bibliografien statt des gemeinsamen SOURCES-Registers.
const LOCAL_SOURCE_DOCUMENTS = ['farbtherapie', 'farbpsychologie', 'lichtmedizin'];

// Wie in scripts/generate-farbwelten-data.cjs: kürzere „Labels" sind keine
// bibliografische Angabe, sondern Verweisreste.
const MIN_LABEL_LENGTH = 10;
const ID_PATTERN = /^\[(\d{1,2})\]\s*(.+)$/;
const CHAIN_PATTERN = /^\[\d{1,2}\]/;
const LIST_PATTERN = /^\s*-\s+(.*\S)\s*$/;
const YEAR_PATTERN = /\b(?:1[5-9]\d{2}|20\d{2})\b/g;
const VOLUME_PATTERN = /\b(?:vol|bd|band|jhrg|jahrgang)\.?\s*(\d{1,4}[a-z]?)/gi;
const ISBN_PATTERN = /\bisbn[:\s-]*([0-9xX-]{10,17})/g;

/**
 * Vergleichsform eines Labels: Groß-/Kleinschreibung, Anführungszeichen,
 * Gedankenstriche, Auslassungspunkte, Markdown-Betonung und Satzzeichen am
 * Rand sind keine inhaltliche Abweichung.
 */
function normalizeLabel(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[*_]{1,3}/g, '')
    .replace(/[„“”‟«»″]/g, '"')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[–—−‒]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/(?:\.{3,}|…)/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:]+/, '')
    .replace(/[\s.,;:]+$/, '')
    .trim()
    .toLowerCase();
}

/**
 * Vergleichsform einer URL: Protokoll und Pfad bleiben unterscheidend,
 * `www.`-Präfix, Fragment und abschließender Schrägstrich nicht.
 */
function normalizeUrl(value) {
  const raw = String(value || '')
    .trim()
    .replace(/[).,;'"]+$/, '');
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return raw.toLowerCase();
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return raw.toLowerCase();
  const host = parsed.host.toLowerCase().replace(/^www\./, '');
  const pathname = parsed.pathname.replace(/\/+$/, '');
  return `${parsed.protocol}//${host}${pathname}${parsed.search}`;
}

/** Zerlegt „- [19] Label. https://…" in Kennung, Label und URL. */
function parseEntry(item) {
  const match = ID_PATTERN.exec(String(item || '').trim());
  if (!match) return null;
  const [, rawId, rest] = match;
  // Themenseiten ergänzen nach URL/DOI eine redaktionelle Einordnung.
  // Auch dort bleibt der Link eine Quellenadresse, kein Teil des Labels.
  const urlMatch = /https?:\/\/[^\s<>]+/.exec(rest);
  const doiMatch = !urlMatch && /\bDOI:\s*(10\.\d{4,9}\/[^\s]+)/i.exec(rest);
  const reference = urlMatch || doiMatch;
  const rawUrl = urlMatch ? urlMatch[0] : doiMatch ? `https://doi.org/${doiMatch[1]}` : null;
  const rawLabel = reference
    ? rest.slice(0, reference.index).replace(/\bURL:\s*$/i, '') + rest.slice(reference.index + reference[0].length)
    : rest;
  return {
    id: String(Number(rawId)),
    rawId,
    raw: rest.trim(),
    label: rawLabel
      .replace(/\*+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.\s]+$/, ''),
    url: rawUrl ? rawUrl.replace(/[).,;]+$/, '') : null,
    // Verweisketten und Reste sind keine bibliografischen Angaben; der
    // Generator überspringt sie ebenfalls, deshalb dürfen sie hier nicht als
    // abweichende Fassung zählen.
    chain: CHAIN_PATTERN.test(rawLabel.trim()) || rawLabel.trim().length < MIN_LABEL_LENGTH,
  };
}

/** Zeilen des Abschnitts „## Quellen" einer Redaktionsseite. */
function quellenLines(source) {
  const lines = String(source || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  let inQuellen = false;
  let hasQuellen = false;
  const collected = [];
  for (const [index, line] of lines.entries()) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      inQuellen = /^quellen/i.test(heading[1].trim());
      hasQuellen = hasQuellen || inQuellen;
      continue;
    }
    if (inQuellen) collected.push({ line, number: index + 1 });
  }
  return { hasQuellen, lines: collected };
}

/** Alle bibliografischen Einträge einer Seite in Dokumentreihenfolge. */
function readDocument(name, source) {
  const { hasQuellen, lines } = quellenLines(source);
  const entries = [];
  for (const { line, number } of lines) {
    const list = LIST_PATTERN.exec(line);
    if (!list) continue;
    const entry = parseEntry(list[1]);
    if (!entry) continue;
    entries.push({ file: name, line: number, ...entry });
  }
  return { name, hasQuellen, entries };
}

/** Alle Seiten eines Verzeichnisses (standardmäßig content/farbwelten). */
function loadDocuments(directory) {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => ({
      name: file.replace(/\.md$/, ''),
      sourceScope: LOCAL_SOURCE_DOCUMENTS.includes(file.replace(/\.md$/, '')) ? file.replace(/\.md$/, '') : null,
      source: fs.readFileSync(path.join(directory, file), 'utf8'),
    }));
}

function identityTokens(entry) {
  const haystack = `${entry.label} ${entry.url || ''}`;
  const tokens = new Set();
  for (const match of haystack.matchAll(YEAR_PATTERN)) tokens.add(`jahr:${match[0]}`);
  for (const match of haystack.matchAll(VOLUME_PATTERN)) tokens.add(`band:${match[1].toLowerCase()}`);
  for (const match of haystack.matchAll(ISBN_PATTERN)) {
    const isbn = match[1].replace(/[^0-9xX]/g, '').toLowerCase();
    if (isbn.length >= 10) tokens.add(`isbn:${isbn}`);
  }
  return tokens;
}

function sameTokens(left, right) {
  if (left.size !== right.size) return false;
  for (const token of left) if (!right.has(token)) return false;
  return true;
}

function describeForm(form) {
  return `„${form.rawLabel}“${form.rawUrl ? ` <${form.rawUrl}>` : ' (ohne URL)'}`;
}

/**
 * Vergleicht je Kennung alle Fassungen innerhalb desselben Quellenregisters.
 * Farbseiten teilen ein Register; Themenseiten nutzen ihren eigenen sourceScope.
 *
 * @param {Array<{name: string, source: string, sourceScope?: string}>} documents
 * @param {{strictLabels?: boolean}} [options]
 * @returns {{ids: object[], errors: object[], warnings: object[], documents: string[], chains: object[]}}
 */
function analyseDocuments(documents, options = {}) {
  const strictLabels = Boolean(options.strictLabels);
  const errors = [];
  const warnings = [];
  const chains = [];
  const byId = new Map();

  for (const document of documents) {
    const parsed = readDocument(document.name, document.source);
    for (const entry of parsed.entries) {
      if (entry.chain) {
        chains.push(entry);
        continue;
      }
      const scope = document.sourceScope || null;
      const key = `${scope || ''}\u0000${entry.id}`;
      if (!byId.has(key)) byId.set(key, []);
      byId.get(key).push({ ...entry, scope });
    }
  }

  const ids = [];
  for (const key of [...byId.keys()].sort((a, b) => a.localeCompare(b, 'de', { numeric: true }))) {
    const list = byId.get(key);
    const { id, scope } = list[0];
    const forms = [];
    for (const entry of list) {
      const label = normalizeLabel(entry.label);
      const url = normalizeUrl(entry.url);
      const key = `${label}\u0000${url || ''}`;
      let form = forms.find((candidate) => candidate.key === key);
      if (!form) {
        form = { key, label, url, rawLabel: entry.label, rawUrl: entry.url, files: [], entries: [] };
        forms.push(form);
      }
      if (!form.files.includes(entry.file)) form.files.push(entry.file);
      form.entries.push(entry);
    }

    for (const form of forms) form.tokens = identityTokens({ label: form.label, url: form.url || '' });

    const record = {
      id,
      scope,
      forms,
      files: [...new Set(list.map((entry) => entry.file))],
      identical: forms.length === 1,
      codes: [],
    };

    if (forms.length > 1) {
      const urls = new Set(forms.map((form) => form.url));
      if (urls.size > 1) {
        record.codes.push('url-konflikt');
        errors.push({
          code: 'url-konflikt',
          id,
          files: record.files,
          forms,
          message: `[${id}] verschiedene Dokumente: ${forms
            .map((form) => `${form.files.join('/')} → ${describeForm(form)}`)
            .join(' | ')}`,
        });
      } else {
        const tokens = forms.map((form) => form.tokens);
        const divergentTokens = tokens.some((tokensOfForm) => !sameTokens(tokensOfForm, tokens[0]));
        if (divergentTokens) {
          record.codes.push('identitaetskonflikt');
          errors.push({
            code: 'identitaetskonflikt',
            id,
            files: record.files,
            forms,
            message: `[${id}] gleiche URL, aber abweichende Jahres-/Bandangabe: ${forms
              .map((form) => `${form.files.join('/')} → ${describeForm(form)}`)
              .join(' | ')}`,
          });
        } else {
          record.codes.push(strictLabels ? 'label-variante-strict' : 'label-variante');
          const report = {
            code: 'label-variante',
            id,
            files: record.files,
            forms,
            message: `[${id}] gleiche URL, unterschiedlich ausführliche Labels: ${forms
              .map((form) => `${form.files.join('/')} → „${form.rawLabel}“`)
              .join(' | ')}`,
          };
          if (strictLabels) errors.push(report);
          else warnings.push(report);
        }
      }
    }

    // Stiller Tie-Break: zwei Kandidaten mit identischem Score, aber
    // unterschiedlicher Schreibweise. Der Generator entscheidet dann über die
    // Einfügereihenfolge — das muss sichtbar sein, auch wenn die URL gleich ist.
    const scored = list.map((entry) => ({
      entry,
      score: (entry.url ? 100000 : 0) + entry.label.length,
    }));
    const best = scored.reduce((max, candidate) => Math.max(max, candidate.score), -Infinity);
    const winners = scored.filter((candidate) => candidate.score === best);
    const winnerLabels = new Set(winners.map((candidate) => normalizeLabel(candidate.entry.label)));
    if (winnerLabels.size > 1) {
      record.codes.push('gleichstand');
      warnings.push({
        code: 'gleichstand',
        id,
        files: [...new Set(winners.map((winner) => winner.entry.file))],
        message: `[${id}] Gleichstand im Score (${best}): ${winners
          .map((winner) => `${winner.entry.file} → „${winner.entry.label}“`)
          .join(' | ')}`,
      });
    }
    record.expected = winners[0].entry;
    record.expectedScore = best;
    ids.push(record);
  }

  const analysedDocuments = documents
    .map((document) => readDocument(document.name, document.source))
    .filter((document) => document.hasQuellen)
    .map((document) => document.name);

  return { ids, errors, warnings, chains, documents: analysedDocuments, strictLabels };
}

/**
 * Prüft das generierte Register (SOURCES) gegen die Dokumentfassungen:
 * vollständigster Kandidat, vorhandene URL, vorhandenes Label.
 */
function topicRegisters(pages) {
  return Object.fromEntries(
    (pages || []).map((page) => [
      page.slug,
      Object.fromEntries(
        page.sections
          .flatMap((section) => section.blocks)
          .filter((block) => block.type === 'sources')
          .flatMap((block) => block.items)
          .map((entry) => [entry.id, entry])
      ),
    ])
  );
}

function checkRegister(analysis, sources, localRegisters = {}) {
  const errors = [];
  const warnings = [];
  for (const record of analysis.ids) {
    const register = record.scope ? localRegisters[record.scope] : sources;
    const source = register && register[record.id];
    if (!source) {
      (record.scope ? errors : warnings).push({
        code: 'register-fehlt',
        id: record.id,
        files: record.files,
        message: `[${record.id}] in ${record.files.join('/')} gelistet, aber nicht im Register (Kurzverweis?)`,
      });
      continue;
    }
    if (source.shortRef) continue;
    const sourceLabel = normalizeLabel(source.label);
    const sourceUrl = normalizeUrl(source.url);

    const matching = record.forms.find((form) => form.label === sourceLabel && form.url === sourceUrl);
    if (!matching) {
      errors.push({
        code: 'register-fremd',
        id: record.id,
        files: record.files,
        message: `[${record.id}] Register führt eine Fassung, die in keinem Dokument steht: „${source.label}“ <${source.url || 'ohne URL'}>; Dokumente: ${record.forms
          .map((form) => `${form.files.join('/')} → ${describeForm(form)}`)
          .join(' | ')}`,
      });
      continue;
    }
    // Der Tie-Break darf nur zwischen zeichengleichen Fassungen laufen; sonst
    // wäre die Registerfassung nicht mehr reproduzierbar. Ein Gleichstand ist
    // bereits als Hinweis gemeldet worden.
    if (record.expected && !record.codes.includes('gleichstand')) {
      const expectedLabel = normalizeLabel(record.expected.label);
      const expectedUrl = normalizeUrl(record.expected.url);
      if (sourceLabel !== expectedLabel || sourceUrl !== expectedUrl) {
        errors.push({
          code: 'register-abweichung',
          id: record.id,
          files: [record.expected.file],
          message: `[${record.id}] Register ist veraltet: führt „${source.label}“, vollständigster Kandidat der Dokumente ist „${record.expected.label}“ (${record.expected.file})`,
        });
      }
    }
  }
  return { errors, warnings };
}

module.exports = {
  MIN_LABEL_LENGTH,
  LOCAL_SOURCE_DOCUMENTS,
  topicRegisters,
  normalizeLabel,
  normalizeUrl,
  parseEntry,
  quellenLines,
  readDocument,
  loadDocuments,
  identityTokens,
  analyseDocuments,
  checkRegister,
};
