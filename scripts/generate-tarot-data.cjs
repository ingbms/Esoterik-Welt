// Generate the canonical card data module and the deck registry check data from
// the approved Nachtatelier deck. Content source: docs/tarot-deck-nachtatelier.
//
//   node scripts/generate-tarot-data.cjs [--check]
//
// --check only verifies that the checked-in files match what would be generated.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const deckDir = path.join(root, 'docs/tarot-deck-nachtatelier');
const assets = JSON.parse(fs.readFileSync(path.join(deckDir, 'manifest-assets.json'), 'utf8'));
const texts = JSON.parse(fs.readFileSync(path.join(deckDir, '_work/texts.json'), 'utf8'));
const checkOnly = process.argv.includes('--check');

const SUITS = ['wands', 'cups', 'swords', 'pentacles'];
const SUIT_LABELS = { wands: 'Stäbe', cups: 'Kelche', swords: 'Schwerter', pentacles: 'Münzen' };
const SUIT_WORDS = {
  wands: /Stab|Stäbe|Stäben/,
  cups: /Kelch|Kelche|Kelchen/,
  swords: /Schwert|Schwerter|Schwertern/,
  pentacles: /Münze|Münzen/,
};
const COURT_WORDS = { 11: 'Bote', 12: 'Ritter', 13: 'Königin', 14: 'König' };

// texts.py keeps the deck author's own order: 0-21 major, then per suit the ten
// numbered cards followed by the four court cards. The site ids are suit-major
// with the court cards inside their suit (22-35 wands, 36-49 cups, ...).
function textKeyFor(card) {
  const suitIndex = SUITS.indexOf(card.suit);
  if (card.arcana === 'major') return card.id;
  if (card.number >= 1 && card.number <= 10) return 22 + 10 * suitIndex + (card.number - 1);
  if (card.number >= 11 && card.number <= 14) return 62 + 4 * suitIndex + (card.number - 11);
  throw new Error('unmapped card ' + JSON.stringify(card));
}

const problems = [];
const warnings = [];
const usedTextKeys = new Set();
const cards = assets.cards
  .slice()
  .sort((a, b) => a.id - b.id)
  .map((card) => {
    const textKey = textKeyFor(card);
    if (usedTextKeys.has(textKey)) problems.push(`text key used twice: ${textKey}`);
    usedTextKeys.add(textKey);
    const text = texts.cards[String(textKey)];
    if (!text) {
      problems.push(`missing text for id ${card.id} (text key ${textKey})`);
      return null;
    }
    if (card.arcana === 'minor' && card.number <= 10 && !SUIT_WORDS[card.suit].test(text.sym + text.up + text.rev))
      warnings.push(`id ${card.id}: pip text does not name its suit (${card.suit}) – check mapping by hand`);
    if (card.arcana === 'minor' && card.number >= 11 && !text.sym.includes(COURT_WORDS[card.number]))
      problems.push(`id ${card.id}: court text lacks role word ${COURT_WORDS[card.number]}`);
    return {
      id: card.id,
      name: card.name,
      numeral: card.numeral,
      arcana: card.arcana,
      suit: card.suit || null,
      number: card.number,
      rank: card.rank,
      keywords: text.key,
      symbolism: text.sym,
      meaning_up: text.up,
      meaning_rev: text.rev,
      ...(text.tief ? { deep: text.tief } : {}),
    };
  });

if (cards.some((card) => !card)) problems.push('incomplete card list');
if (usedTextKeys.size !== 78) problems.push(`expected 78 text keys, used ${usedTextKeys.size}`);
const ids = cards.filter(Boolean).map((card) => card.id);
if (ids.length !== 78 || ids.some((id, index) => id !== index)) problems.push('ids are not 0..77 in order');
if (new Set(cards.filter(Boolean).map((card) => card.name)).size !== 78) problems.push('card names are not unique');
for (const field of ['meaning_up', 'meaning_rev']) {
  const values = cards.filter(Boolean).map((card) => card[field]);
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length) problems.push(`${field} repeats ${duplicates.length} time(s): ${duplicates[0]}`);
}
if (cards.filter(Boolean).some((card) => !card.keywords || card.keywords.length < 3))
  problems.push('every card needs at least three keywords');

if (problems.length) {
  console.error(JSON.stringify({ ok: false, problems, warnings }, null, 1));
  process.exit(1);
}

const q = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
const line = (key, value) => `    ${key}: ${value},`;

const body = cards
  .map((card) => {
    const lines = [
      '  {',
      line('id', card.id),
      line('name', q(card.name)),
      line('numeral', q(card.numeral)),
      line('arcana', q(card.arcana)),
      line('suit', card.suit ? q(card.suit) : 'null'),
      line('number', card.number),
      line('rank', q(card.rank)),
      '    keywords: [',
      ...card.keywords.map((keyword) => `      ${q(keyword)},`),
      '    ],',
      line('symbolism', q(card.symbolism)),
      line('meaning_up', q(card.meaning_up)),
      line('meaning_rev', q(card.meaning_rev)),
    ];
    if (card.deep) lines.push(line('deep', q(card.deep)));
    lines.push('  },');
    return lines.join('\n');
  })
  .join('\n');

const output = `// GENERATED FILE — do not edit by hand.
// Source: docs/tarot-deck-nachtatelier/manifest-assets.json (identities, 78 stable ids)
//         docs/tarot-deck-nachtatelier/_work/texts.json   (keywords, image language, upright/reversed)
// Regenerate: node scripts/generate-tarot-data.cjs
// The interpretations are symbolic/traditional readings, not predictions and not
// medical or therapeutic advice.
export const TAROT_DECK_ID = 'nachtatelier-v1';
export const TAROT_CARD_COUNT = 78;

export const TAROT_DISCLAIMER =
  'Symbolische, traditionelle Deutung — ein Angebot zum Nachdenken, keine Vorhersage und kein Heil- oder Wirkversprechen.';

export const SUIT_LABELS = ${JSON.stringify(SUIT_LABELS, null, 0).replace(/"/g, "'").replace(/,/g, ', ')};

export const tarotCards = [
${body}
];

export function deckCardLabel(card) {
  const arcana = card.arcana === 'major' ? 'Große Arkana' : \`Kleine Arkana · \${SUIT_LABELS[card.suit] || ''}\`.trim();
  return \`\${card.name} · \${card.numeral} · \${arcana}\`;
}

export function getRandomCards(count, allowReversed = true) {
  const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    reversed: allowReversed && Math.random() < 0.3,
  }));
}

export function getCardById(id) {
  return tarotCards.find((card) => card.id === id);
}

export function getCardsBySuit(suit) {
  return tarotCards.filter((card) => card.suit === suit);
}

export function getMajorArcana() {
  return tarotCards.filter((card) => card.arcana === 'major');
}
`;

const target = path.join(root, 'js/data/tarot.js');

async function main() {
  const prettier = require('prettier');
  const config = (await prettier.resolveConfig(target)) || {};
  const formatted = await prettier.format(output, { ...config, filepath: target });
  const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (previous === formatted) {
    console.log(JSON.stringify({ ok: true, changed: false, cards: cards.length, warnings }, null, 1));
    return;
  }
  if (checkOnly) {
    console.error(JSON.stringify({ ok: false, reason: 'js/data/tarot.js is stale', warnings }, null, 1));
    process.exitCode = 1;
    return;
  }
  fs.writeFileSync(target, formatted);
  console.log(
    JSON.stringify({ ok: true, changed: true, cards: cards.length, bytes: formatted.length, warnings }, null, 1)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
