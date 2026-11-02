// Einzige Quelle der Wahrheit für `attribution_text_required`.
//
// Das Feld wird ausschließlich aus `credit` (Urheber, Lizenz, Lizenz-URL, Quelle,
// ShareAlike, `credit.changes`) plus `production.mode`/`production.retouch`
// erzeugt. Der früher aus der Bildrecherche übernommene Text behauptete einen
// quadratischen Beschnitt, drei statt vier Ausgabestufen und JPEG-Kodierung –
// alles unzutreffend (Review t_385afa1e, Befund P1.1).
//
// Aufruf als CLI (stdin: JSON-Array von Bildobjekten, stdout: JSON-Array Texte):
//   node scripts/lib/crystal-attribution.cjs < bilder.json

'use strict';

const FREE_LICENSE = /(^|[\s(])(public domain|pd-self|cc0|gemeinfrei)/i;

/** Dateititel ohne "File:"-Präfix und ohne Dateiendung. */
function displayTitle(fileTitle) {
  return String(fileTitle || '')
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|tiff?|webp|gif)$/i, '')
    .trim();
}

/** Zusatzangaben, die `credit.changes` noch nicht enthält (mode/retouch). */
function missingProductionNotes(image) {
  const changes = String((image.credit && image.credit.changes) || '');
  const production = image.production || {};
  const notes = [];
  if (production.mode === 'matte' && !/freigestellt/i.test(changes)) {
    notes.push('Motiv freigestellt');
  }
  if (production.retouch && !/retusch|entfernt|bereinigt/i.test(changes)) {
    notes.push(`Retusche (${production.retouch})`);
  }
  return notes;
}

/** Änderungstext: `credit.changes` ist führend, fehlende Produktionsangaben folgen. */
function changesSentence(image) {
  const base = String((image.credit && image.credit.changes) || '')
    .trim()
    .replace(/\.$/, '');
  const extra = missingProductionNotes(image);
  const parts = base ? [base, ...extra] : extra;
  return parts.join(', ');
}

/** true, wenn eine Namensnennung lizenzrechtlich erforderlich ist (BY/BY-SA). */
function attributionRequired(image) {
  const license = String((image.credit && image.credit.license) || '');
  return !FREE_LICENSE.test(license);
}

function buildAttributionText(image) {
  const credit = image.credit || {};
  const title = displayTitle(image.title);
  const source = credit.source_url || '';
  const licenseUrl = credit.license_url || '';
  const license = credit.license || '';
  const head = `„${title}“ – ${credit.author}`;
  const licensePart = attributionRequired(image)
    ? `lizenziert unter ${license}${licenseUrl ? ` — ${licenseUrl}` : ''}`
    : `${license}${licenseUrl ? ` — ${licenseUrl}` : ''}`;
  const changes = changesSentence(image);
  const parts = [`${head}, ${licensePart}.`, `Quelle: ${source}.`];
  if (changes) parts.push(`Änderungen: ${changes}.`);
  if (credit.share_alike) {
    parts.push('Bearbeitete Bildfassungen werden unter derselben Lizenz weitergegeben (ShareAlike).');
  } else if (!attributionRequired(image)) {
    parts.push('Namensnennung ist rechtlich nicht erforderlich, wird im Projekt aber ausgewiesen.');
  }
  return parts.join(' ');
}

/**
 * Prüft einen ausgelieferten Text gegen seine Ableitungsregel.
 * @returns {string[]} Liste der Abweichungen (leer = konform).
 */
function checkAttributionText(image, text) {
  const problems = [];
  if (typeof text !== 'string' || !text) {
    return ['attribution_text_required fehlt'];
  }
  const expected = buildAttributionText(image);
  if (text !== expected) problems.push('weicht vom generierten Text ab');
  const changes = String((image.credit && image.credit.changes) || '').trim();
  if (changes && !text.includes(changes)) problems.push('enthält credit.changes nicht wörtlich');
  if ((image.production || {}).retouch && !/retusch|entfernt|bereinigt/i.test(text)) {
    problems.push('nennt die Retusche nicht');
  }
  // URLs ausblenden: die Quell-URL endet auf ".jpg" und ist kein Formatbeleg.
  const prose = text.replace(/https?:\/\/\S+/g, '');
  if (/beschnitt|zuschnitt/i.test(prose)) problems.push('behauptet einen Beschnitt');
  if (/jpe?g/i.test(prose)) problems.push('nennt JPEG');
  if (/320\/640\/1280\s*px/.test(prose)) problems.push('nennt nur drei Ausgabestufen');
  return problems;
}

function buildAll(images) {
  return images.map((image) => buildAttributionText(image));
}

module.exports = {
  displayTitle,
  changesSentence,
  attributionRequired,
  buildAttributionText,
  checkAttributionText,
  buildAll,
};

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    raw += chunk;
  });
  process.stdin.on('end', () => {
    const images = JSON.parse(raw);
    process.stdout.write(JSON.stringify(buildAll(images), null, 0));
  });
}
