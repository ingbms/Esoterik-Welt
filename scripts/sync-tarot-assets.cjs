// Copy the approved Nachtatelier deck web derivatives into the site asset tree
// and write the shipped deck manifest (identity + bytes + SHA256 + pixel size).
//
// The deck production folder stays the source of truth for the artwork; this
// script never regenerates or resamples an image. It copies byte-identical files
// and fails if a target hash differs from the source hash.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const deckDir = path.join(root, 'docs/tarot-deck-nachtatelier');
const targetDir = path.join(root, 'assets/tarot/nachtatelier-v1');
const sourceManifest = JSON.parse(fs.readFileSync(path.join(deckDir, 'manifest-assets.json'), 'utf8'));

const LEVELS = [
  { key: 'thumb', from: 'web/karten-300', to: '300' },
  { key: 'detail', from: 'web/karten-600', to: '600' },
  { key: 'zoom', from: 'web/master', to: '1200' },
];

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pad = (id) => String(id).padStart(2, '0');

// Minimal JPEG SOF parser (baseline + progressive) so dimensions are measured
// from the bytes instead of trusted from the deck metadata.
function jpegSize(file) {
  const buffer = fs.readFileSync(file);
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error('not a JPEG: ' + file);
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return [buffer.readUInt16BE(offset + 7), buffer.readUInt16BE(offset + 5)];
    }
    offset += 2 + length;
  }
  throw new Error('no SOF marker: ' + file);
}

const problems = [];
const copied = [];
const unchanged = [];

for (const level of LEVELS) {
  const sourceDir = path.join(deckDir, level.from);
  const outDir = path.join(targetDir, level.to);
  if (!fs.existsSync(sourceDir)) {
    problems.push('missing source level: ' + level.from);
    continue;
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of fs.readdirSync(sourceDir).filter((file) => file.endsWith('.jpg'))) {
    const source = path.join(sourceDir, name);
    const target = path.join(outDir, name);
    const sourceHash = sha256(source);
    if (fs.existsSync(target) && sha256(target) === sourceHash) {
      unchanged.push(`${level.to}/${name}`);
      continue;
    }
    fs.copyFileSync(source, target);
    if (sha256(target) !== sourceHash) problems.push(`hash mismatch after copy: ${level.to}/${name}`);
    copied.push(`${level.to}/${name}`);
  }
}

const cards = sourceManifest.cards.map((card) => {
  const files = {};
  for (const level of LEVELS) {
    const name = pad(card.id) + '.jpg';
    const file = path.join(targetDir, level.to, name);
    if (!fs.existsSync(file)) {
      problems.push(`missing target: ${level.to}/${name}`);
      continue;
    }
    const [width, height] = jpegSize(file);
    files[level.key] = {
      path: `${level.to}/${name}`,
      bytes: fs.statSync(file).size,
      sha256: sha256(file),
      size: [width, height],
    };
    if (width * 5 !== height * 3) problems.push(`aspect not 3:5: ${level.to}/${name} (${width}x${height})`);
  }
  for (const [metaKey, levelKey] of [
    ['web_300', 'thumb'],
    ['web_600', 'detail'],
    ['web_1200', 'zoom'],
  ]) {
    const declared = card.files && card.files[metaKey];
    if (!declared || !files[levelKey]) continue;
    if (declared.sha256 !== files[levelKey].sha256)
      problems.push(`${metaKey} hash differs from deck metadata: ${card.id}`);
  }
  return {
    id: card.id,
    name: card.name,
    numeral: card.numeral,
    number: card.number,
    arcana: card.arcana,
    suit: card.suit,
    suit_label: card.suit_label,
    files,
  };
});

const backSource = sourceManifest.back;
const backFiles = {};
for (const level of LEVELS) {
  const file = path.join(targetDir, level.to, 'Ruecken.jpg');
  if (!fs.existsSync(file)) {
    problems.push(`missing back: ${level.to}/Ruecken.jpg`);
    continue;
  }
  const [width, height] = jpegSize(file);
  backFiles[level.key] = {
    path: `${level.to}/Ruecken.jpg`,
    bytes: fs.statSync(file).size,
    sha256: sha256(file),
    size: [width, height],
  };
}

const ids = cards.map((card) => card.id).sort((a, b) => a - b);
if (ids.length !== 78 || ids.some((id, index) => id !== index)) problems.push('card ids are not 0..77');
const majors = cards.filter((card) => card.arcana === 'major').length;
if (majors !== 22) problems.push('major arcana count is not 22');
for (const suit of ['wands', 'cups', 'swords', 'pentacles']) {
  const count = cards.filter((card) => card.suit === suit).length;
  if (count !== 14) problems.push(`suit ${suit} count is ${count}`);
}

const manifest = {
  deck_id: 'nachtatelier-v1',
  label: 'Nachtatelier',
  version: sourceManifest.deck_version,
  card_count: cards.length,
  aspect: '3:5',
  color_space: sourceManifest.color_space,
  source_deck: 'docs/tarot-deck-nachtatelier',
  source_manifest: 'manifest-assets.json',
  naming_note: sourceManifest.naming_note,
  levels: { thumb: '300', detail: '600', zoom: '1200' },
  back: { sha256_source: backSource.sha256, files: backFiles },
  cards,
};

if (problems.length) {
  console.error(JSON.stringify({ ok: false, problems }, null, 1));
  process.exit(1);
}

fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
const totalBytes = LEVELS.reduce(
  (sum, level) =>
    sum +
    fs
      .readdirSync(path.join(targetDir, level.to))
      .reduce((bytes, name) => bytes + fs.statSync(path.join(targetDir, level.to, name)).size, 0),
  0
);
console.log(
  JSON.stringify(
    {
      ok: true,
      copied: copied.length,
      unchanged: unchanged.length,
      cards: cards.length,
      total_bytes: totalBytes,
      levels: Object.fromEntries(
        LEVELS.map((level) => [
          level.to,
          fs
            .readdirSync(path.join(targetDir, level.to))
            .reduce((bytes, name) => bytes + fs.statSync(path.join(targetDir, level.to, name)).size, 0),
        ])
      ),
    },
    null,
    1
  )
);
