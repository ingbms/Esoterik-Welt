#!/usr/bin/env node
// Erzeugt docs/migration-baseline/media-catalog.csv aus dem ausgelieferten Bestand.
//
// Quelle der Wahrheit ist der Dateibaum unter assets/ (Build-Wurzel = Repository-
// Wurzel, §2.9/§3.1 in 00-schema-und-scope.md) plus die vorhandenen Rechte-Nachweise:
//   assets/crystals/manifest.json            (30 Motive, 4 Stufen, Urheber, Lizenz)
//   data/crystals.json                       (Alt-Texte, wie sie die Oberfläche rendert)
//   assets/tarot/*/manifest.json             (zwei Decks, 78 Karten, 3 Stufen)
//   assets/radiasthesie/media/media-manifest.json (6 Motive, Varianten, eigene Zeichnungen)
//   js/data/radiasthesie.js                  (Alt, Caption, topic je Motiv – Laufzeitquelle)
//   impressum.html                           (Deck-Lizenzen, Hero-Foto, Orion-Tafel)
//   assets/fonts/*-OFL.txt                   (Schriftlizenzen)
//   README.md                                (Projektlizenz)
//
// bytes und sha256 werden gerechnet, nie geschätzt. Breite/Höhe werden aus den
// Datei-Headern gelesen und gegen die Manifeste geprüft.
//
// Aufruf:
//   node scripts/migration-baseline/build-media-catalog.cjs          # schreiben
//   node scripts/migration-baseline/build-media-catalog.cjs --check  # nur vergleichen
//   node scripts/migration-baseline/build-media-catalog.cjs --list-unmatched

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const lib = require('./lib/catalog.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_CSV = path.join(ROOT, 'docs', 'migration-baseline', 'media-catalog.csv');
const OUT_GAPS = path.join(ROOT, 'docs', 'migration-baseline', 'medien-katalog-luecken.md');

const COLUMNS = [
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

// ---------------------------------------------------------------- Dateizugriff

function rel(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else if (entry.isFile()) out.push(rel(abs));
  }
  return out;
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

// ------------------------------------------------------------ Bild-Dimensionen

function dimsJpeg(buf) {
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    const length = buf.readUInt16BE(offset + 2);
    // SOF0..SOF15 ohne DHT (C4), JPG (C8) und DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return null;
}

function dimsPng(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function dimsWebp(buf) {
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (kind === 'VP8X') {
    return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  }
  return null;
}

function dimsAvif(buf) {
  const idx = buf.indexOf('ispe');
  if (idx < 0) return null;
  return { width: buf.readUInt32BE(idx + 8), height: buf.readUInt32BE(idx + 12) };
}

function dimensions(relPath) {
  const format = path.extname(relPath).slice(1).toLowerCase();
  if (['svg', 'ttf', 'otf', 'woff', 'woff2', 'json', 'txt', 'md', 'html'].includes(format)) return null;
  const buf = fs.readFileSync(path.join(ROOT, relPath));
  const parsed = { jpg: dimsJpeg, jpeg: dimsJpeg, png: dimsPng, webp: dimsWebp, avif: dimsAvif }[format];
  if (!parsed) throw new Error(`Unbekanntes Rasterformat: ${relPath}`);
  const result = parsed(buf);
  if (!result) throw new Error(`Maße nicht lesbar: ${relPath}`);
  return result;
}

// ---------------------------------------------------------------------- Quellen

const PROJECT_LICENSE = 'MIT (Projektlizenz laut README.md; LICENSE-Datei fehlt im Repository)';

function buildMeta() {
  const meta = new Map();
  const problems = [];

  const put = (relPath, value) => {
    if (meta.has(relPath)) problems.push(`doppelt belegt: ${relPath}`);
    meta.set(relPath, value);
  };

  // --- Kristalle: 30 Motive x 4 Stufen -------------------------------------
  const crystals = readJson('assets/crystals/manifest.json');
  const crystalData = readJson('data/crystals.json');
  const altById = new Map(crystalData.crystals.map((c) => [c.id, c.image_alt]));
  for (const image of crystals.images) {
    const alt = altById.get(image.id);
    if (!alt) problems.push(`Alt-Text fehlt für ${image.id}`);
    if (!image.credit || !image.credit.license) problems.push(`Lizenz fehlt für ${image.id}`);
    for (const [level, relLevelPath] of Object.entries(image.levels)) {
      const usedOn =
        level === '960' ? '#crystals (Detaildialog, 960 px)' : `#crystals (Kartenraster, srcset ${level} px)`;
      put(`assets/crystals/${relLevelPath}`, {
        used_on: usedOn,
        alt_text: alt,
        caption: '',
        credit: `${image.credit.author} via Wikimedia Commons`,
        license: `${image.credit.license} (assets/crystals/manifest.json ${image.id}; impressum.html#kristalle-fotos)`,
        license_status: 'geklaert',
        status: 'final',
        release_relevance: ['640', '960'].includes(level) ? 'must' : 'should',
        source: `manifest ${image.id} Stufe ${level}`,
      });
    }
  }
  put('assets/crystals/manifest.json', {
    used_on: 'impressum.html#kristalle-fotos (verlinkter, maschinenlesbarer Rechtenachweis)',
    alt_text: 'n/a (JSON-Rechtenachweis)',
    caption: '',
    credit: 'Esoterik-Welt (Projekt)',
    license: 'nicht_erforderlich (Projekt-Metadaten, eigenes Werk)',
    license_status: 'nicht_erforderlich',
    status: 'final',
    release_relevance: 'none',
    source: 'Projektdatei',
  });

  // --- Tarot: zwei Decks x (78 Karten x 3 Stufen + Ruecken x 3) ------------
  const deckLicense = {
    'nachtatelier-v1': {
      credit: 'Esoterik-Welt Art Direction, nach Pamela Colman Smith (gemeinfrei); Mineraltextur Didier Descouens',
      license: 'CC BY-SA 4.0 (bearbeitete Deckfassung wegen ShareAlike der Textur; impressum.html#tarot-decks)',
      license_status: 'geklaert',
    },
    'gartenbrevier-v2': {
      credit: 'Esoterik-Welt (Eigengestaltung, codegenerierte Vektoren)',
      license:
        'Eigengestaltung Esoterik-Welt, keine fremden Rechte berührt (impressum.html#tarot-decks); Weiterlizenzierung nicht erklärt',
      license_status: 'geklaert',
    },
  };

  for (const deckId of ['nachtatelier-v1', 'gartenbrevier-v2']) {
    const manifest = readJson(`assets/tarot/${deckId}/manifest.json`);
    const rights = deckLicense[deckId];
    const label = manifest.label;
    const add = (relFile, { used_on, alt_text, status, relevance }) =>
      put(`assets/tarot/${deckId}/${relFile}`, {
        used_on,
        alt_text,
        caption: '',
        credit: rights.credit,
        license: rights.license,
        license_status: rights.license_status,
        status,
        release_relevance: relevance,
        source: `assets/tarot/${deckId}/manifest.json`,
      });

    for (const [level, file] of Object.entries(manifest.back.files)) {
      add(file.path, {
        used_on: `#tarot (Kartenrücken im Deck-Umschalter, ${level} ${file.size[0]} px)`,
        alt_text: 'dekorativ (Kartenrücken; im Umschalter steht der Deckname im zugänglichen Namen)',
        status: 'final',
        relevance: 'should',
      });
    }
    for (const card of manifest.cards) {
      for (const [level, file] of Object.entries(card.files)) {
        const usedOn =
          level === 'thumb'
            ? '#tarot (Kartenraster, 300 px)'
            : level === 'detail'
              ? '#tarot (Detaildialog, 600 px)'
              : '#tarot (Zoom im Detaildialog, 1200 px)';
        const alt =
          level === 'thumb'
            ? 'dekorativ (leerer Alt-Text im Kartenraster; Kartenname und Nummer stehen im Link)'
            : `${card.name} · ${card.numeral} — Karte aus dem Deck „${label}“`;
        add(file.path, {
          used_on: usedOn,
          alt_text: alt,
          status: 'final',
          relevance: level === 'zoom' ? 'should' : 'must',
        });
      }
    }
    put(`assets/tarot/${deckId}/manifest.json`, {
      used_on: `#tarot (Deck-Registry js/data/tarot-decks.js; Manifest nicht zur Laufzeit geladen)`,
      alt_text: 'n/a (JSON-Metadaten)',
      caption: '',
      credit: 'Esoterik-Welt (Projekt)',
      license: 'nicht_erforderlich (Projekt-Metadaten, eigenes Werk)',
      license_status: 'nicht_erforderlich',
      status: 'final',
      release_relevance: 'none',
      source: 'Projektdatei',
    });
  }

  // --- Radiästhesie: Fotos + eigene Zeichnungen ----------------------------
  const rad = readJson('assets/radiasthesie/media/media-manifest.json');
  const radRuntime = fs.readFileSync(path.join(ROOT, 'js', 'data', 'radiasthesie.js'), 'utf8');
  for (const item of rad.items) {
    const runtimeTopic = radRuntime.includes(`id: '${item.id}'`) ? item.einsatz : null;
    if (!runtimeTopic) problems.push(`Motiv ${item.id} nicht in js/data/radiasthesie.js gefunden`);
    for (const variant of item.varianten) {
      const isAvif = variant.format === 'avif';
      const isPng = variant.format === 'png';
      const isSmall = variant.breite === 520;
      put(variant.pfad, {
        used_on: `#pendeln/${item.einsatz} (Figurenbild, ${variant.breite} px, ${variant.format})`,
        alt_text: item.alt,
        caption: item.caption,
        credit: `${item.urheber.name} via Wikimedia Commons`,
        license: `${item.lizenz.name} (${item.lizenz.url}; assets/radiasthesie/media/media-manifest.json ${item.id})`,
        license_status: 'geklaert',
        status: 'final',
        release_relevance: isSmall && !isAvif && !isPng ? 'must' : 'should',
        source: `media-manifest ${item.id}`,
      });
    }
    if (item.original && item.original.pfad && fs.existsSync(path.join(ROOT, item.original.pfad))) {
      put(item.original.pfad, {
        used_on: 'n/a (Quellfassung; keine Ansicht referenziert sie, öffentlich abrufbar)',
        alt_text: 'n/a (Quellfassung ohne Alt-Text, in keiner Ansicht eingebunden)',
        caption: '',
        credit: `${item.urheber.name} via Wikimedia Commons`,
        license: `${item.lizenz.name} (${item.lizenz.url}; assets/radiasthesie/media/media-manifest.json ${item.id})`,
        license_status: 'geklaert',
        status: 'final',
        release_relevance: 'none',
        source: `media-manifest ${item.id} original`,
      });
    }
  }
  for (const own of rad.own_assets) {
    put(own.datei, {
      used_on: `#pendeln/${own.einsatz} (Themenbild)`,
      alt_text: own.alt,
      caption: own.caption || '',
      credit: 'Esoterik-Welt (Projekt)',
      license: `${PROJECT_LICENSE} (assets/radiasthesie/media/ATTRIBUTION.md: Eigenwerk)`,
      license_status: 'geklaert',
      status: 'final',
      release_relevance: 'must',
      source: 'media-manifest own_assets',
    });
  }
  put('assets/radiasthesie/media/media-manifest.json', {
    used_on: 'Quelle von assets/radiasthesie/media/bildnachweis.html und ATTRIBUTION.md',
    alt_text: 'n/a (JSON-Rechtenachweis)',
    caption: '',
    credit: 'Esoterik-Welt (Projekt)',
    license: 'nicht_erforderlich (Projekt-Metadaten, eigenes Werk)',
    license_status: 'nicht_erforderlich',
    status: 'final',
    release_relevance: 'none',
    source: 'Projektdatei',
  });
  put('assets/radiasthesie/media/ATTRIBUTION.md', {
    used_on: 'assets/radiasthesie/media/bildnachweis.html (Bildnachweisseite; nicht aus der Navigation verlinkt)',
    alt_text: 'n/a (Markdown-Nachweis)',
    caption: '',
    credit: 'Esoterik-Welt (Projekt)',
    license: 'nicht_erforderlich (Projekt-Metadaten, eigenes Werk)',
    license_status: 'nicht_erforderlich',
    status: 'final',
    release_relevance: 'none',
    source: 'Projektdatei',
  });
  put('assets/radiasthesie/media/bildnachweis.html', {
    used_on: 'direkte URL assets/radiasthesie/media/bildnachweis.html (nicht aus der Navigation verlinkt)',
    alt_text: 'n/a (generierte HTML-Nachweisseite)',
    caption: '',
    credit: 'Esoterik-Welt (Projekt)',
    license: 'nicht_erforderlich (Projekt-Metadaten, eigenes Werk)',
    license_status: 'nicht_erforderlich',
    status: 'final',
    release_relevance: 'should',
    source: 'Projektdatei',
  });

  // --- Startseiten-Bilder (Markup-Quelle, wortgleich) ----------------------
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const imgTag = (src) => {
    const re = new RegExp(`<img[^>]*src="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?/>`);
    const match = indexHtml.match(re);
    if (!match) throw new Error(`img-Tag nicht gefunden: ${src}`);
    const tag = match[0];
    const attr = (name) => {
      const m = tag.match(new RegExp(`${name}="([^"]*)"`));
      return m ? m[1] : '';
    };
    return { alt: attr('alt'), width: attr('width'), height: attr('height') };
  };

  const hero = imgTag('assets/mineral/quartz-light-2400.jpg');
  put('assets/mineral/quartz-light-2400.jpg', {
    used_on: '#home (Startseite, Hero-Abschnitt)',
    alt_text: hero.alt,
    caption:
      'Bergkristall · Fotografie: Didier Descouens · CC BY-SA 4.0 — Gewachsene Form, gerichtete Reflexe, echte Einschlüsse.',
    credit: 'Didier Descouens',
    license: 'CC BY-SA 4.0 (impressum.html#bildnachweise; Quelle File:Quartz Brésil.jpg bei Wikimedia Commons)',
    license_status: 'geklaert',
    status: 'final',
    release_relevance: 'must',
    source: 'index.html figcaption',
  });

  const detail = imgTag('assets/mineral/mineral-detail-1000.jpg');
  put('assets/mineral/mineral-detail-1000.jpg', {
    used_on: '#home (Startseite, Abschnitt Material)',
    alt_text: detail.alt,
    caption: 'Detailstudie · Fotografie: Didier Descouens · CC BY-SA 4.0',
    credit: 'Didier Descouens',
    license: 'CC BY-SA 4.0 (nur Figcaption in index.html; kein Quelleintrag im Impressum)',
    license_status: 'ungeklaert',
    status: 'final',
    release_relevance: 'must',
    source: 'index.html figcaption',
  });

  const chart = imgTag('assets/cosmos/orion-chart.svg');
  put('assets/cosmos/orion-chart.svg', {
    used_on: '#home (Startseite, Abschnitt Kosmos)',
    alt_text: chart.alt,
    caption:
      'Orion · sieben Hauptsterne · Deklination +10° bis −10° — Schematische Projektion, keine Beobachtungsvorhersage. Eigene Vektorzeichnung.',
    credit: 'Esoterik-Welt (Projekt)',
    license: 'CC BY 4.0 (eigene Zeichnung; impressum.html Abschnitt „Grafik: Orion-Koordinatenstudie“)',
    license_status: 'geklaert',
    status: 'final',
    release_relevance: 'should',
    source: 'index.html figcaption',
  });

  put('assets/cosmos/orion-coordinates.json', {
    used_on: '#home (Datenquelle der Orion-Tafel; nicht zur Laufzeit geladen)',
    alt_text: 'n/a (JSON-Datenquelle)',
    caption: '',
    credit: 'Esoterik-Welt (Projekt), Koordinaten aus der Wikipedia-Sternliste Orion',
    license: 'CC BY-SA 4.0 (Datenübernahme Wikipedia „List of stars in Orion“; Fakten selbst gemeinfrei)',
    license_status: 'geklaert',
    status: 'final',
    release_relevance: 'none',
    source: 'assets/cosmos/orion-coordinates.json source',
  });

  // --- Favicon und Schriften ----------------------------------------------
  put('assets/favicon.svg', {
    used_on: 'alle Seiten (Favicon)',
    alt_text: 'n/a (Favicon)',
    caption: '',
    credit: 'Esoterik-Welt (Projekt)',
    license: PROJECT_LICENSE,
    license_status: 'geklaert',
    status: 'final',
    release_relevance: 'must',
    source: 'index.html link rel=icon',
  });

  const fonts = [
    {
      file: 'assets/fonts/Fraunces.ttf',
      usedOn: 'alle Seiten (Display-Schrift „Fraunces“, css/design-system.css Z. 19-22)',
      ofl: 'assets/fonts/Fraunces-OFL.txt',
      holder: 'The Fraunces Project Authors (Undercase Type)',
    },
    {
      file: 'assets/fonts/Fraunces-Italic.ttf',
      usedOn: 'alle Seiten (Display-Kursiv, css/design-system.css Z. 25-29)',
      ofl: 'assets/fonts/Fraunces-OFL.txt',
      holder: 'The Fraunces Project Authors (Undercase Type)',
    },
    {
      file: 'assets/fonts/Manrope.ttf',
      usedOn: 'alle Seiten (Fließtext-Schrift „Manrope“, css/design-system.css Z. 32-36)',
      ofl: 'assets/fonts/Manrope-OFL.txt',
      holder: 'The Manrope Project Authors',
    },
  ];
  for (const font of fonts) {
    put(font.file, {
      used_on: font.usedOn,
      alt_text: 'n/a (Schriftdatei)',
      caption: '',
      credit: font.holder,
      license: `SIL Open Font License 1.1 (${font.ofl})`,
      license_status: 'geklaert',
      status: 'final',
      release_relevance: 'must',
      source: font.ofl,
    });
  }
  for (const ofl of ['assets/fonts/Fraunces-OFL.txt', 'assets/fonts/Manrope-OFL.txt']) {
    put(ofl, {
      used_on: `n/a (Lizenztext zu ${ofl.replace('-OFL.txt', '.ttf')})`,
      alt_text: 'n/a (Lizenztext)',
      caption: '',
      credit: ofl.includes('Fraunces') ? 'The Fraunces Project Authors' : 'The Manrope Project Authors',
      license: 'SIL Open Font License 1.1 (Lizenztext selbst)',
      license_status: 'geklaert',
      status: 'final',
      release_relevance: 'none',
      source: 'Lizenzdatei',
    });
  }

  return { meta, problems };
}

// ------------------------------------------------- Gegenprobe aus den Manifesten
// Die Manifeste führen für jede Variante Byte, SHA-256 und Maße unabhängig von
// diesem Skript. Weichen die hier gerechneten Werte ab, ist der Leser falsch –
// dann bricht die Erzeugung ab, statt eine plausible Tabelle zu schreiben.
function buildExpectations() {
  const out = new Map();
  const add = (relPath, expect) => out.set(relPath, expect);

  const crystals = readJson('assets/crystals/manifest.json');
  for (const image of crystals.images) {
    for (const [level, relLevelPath] of Object.entries(image.levels)) {
      add(`assets/crystals/${relLevelPath}`, {
        bytes: image.bytes[level],
        sha256: image.sha256[level],
        width: Number(level),
        height: Number(level),
      });
    }
  }

  for (const deckId of ['nachtatelier-v1', 'gartenbrevier-v2']) {
    const manifest = readJson(`assets/tarot/${deckId}/manifest.json`);
    for (const file of Object.values(manifest.back.files)) {
      add(`assets/tarot/${deckId}/${file.path}`, {
        bytes: file.bytes,
        sha256: file.sha256,
        width: file.size[0],
        height: file.size[1],
      });
    }
    for (const card of manifest.cards) {
      for (const file of Object.values(card.files)) {
        add(`assets/tarot/${deckId}/${file.path}`, {
          bytes: file.bytes,
          sha256: file.sha256,
          width: file.size[0],
          height: file.size[1],
        });
      }
    }
  }

  const rad = readJson('assets/radiasthesie/media/media-manifest.json');
  for (const item of rad.items) {
    for (const variant of item.varianten) {
      add(variant.pfad, {
        bytes: variant.bytes,
        sha256: variant.sha256,
        width: variant.breite,
        height: variant.hoehe,
      });
    }
    if (item.original && item.original.pfad) {
      add(item.original.pfad, {
        bytes: item.original.bytes,
        sha256: item.original.sha256,
        width: item.original.breite,
        height: item.original.hoehe,
      });
    }
  }

  return out;
}

function compareWithManifests(rows) {
  const expectations = buildExpectations();
  const mismatches = [];
  for (const row of rows) {
    const expect = expectations.get(row.path);
    if (!expect) continue;
    if (expect.bytes !== undefined && Number(row.bytes) !== expect.bytes) {
      mismatches.push(`${row.path}: bytes ${row.bytes} != Manifest ${expect.bytes}`);
    }
    if (expect.sha256 && row.sha256 !== expect.sha256) {
      mismatches.push(`${row.path}: sha256 weicht vom Manifest ab`);
    }
    if (expect.width && row._dim && (row._dim.width !== expect.width || row._dim.height !== expect.height)) {
      mismatches.push(
        `${row.path}: Maße ${row._dim.width}x${row._dim.height} != Manifest ${expect.width}x${expect.height}`
      );
    }
    if (expect.width && !row._dim) mismatches.push(`${row.path}: Maße erwartet, aber als Vektor behandelt`);
  }
  return { mismatches, checked: rows.filter((row) => expectations.has(row.path)).length };
}

// ------------------------------------------------------------------- CSV-Ausgabe

function csvCell(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildRows() {
  const files = walk(path.join(ROOT, 'assets')).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const { meta, problems } = buildMeta();
  const unmatched = files.filter((file) => !meta.has(file));
  const stale = [...meta.keys()].filter((key) => !files.includes(key));
  if (problems.length) throw new Error(`Quellenprobleme:\n- ${problems.join('\n- ')}`);

  const rows = files.map((file, index) => {
    const info = meta.get(file);
    if (!info) return null;
    const format = path.extname(file).slice(1).toLowerCase();
    // Textformate mit LF rechnen: CRLF-Checkouts dürfen die Katalogwerte nicht ändern.
    const content = lib.canonicalBytes(file);
    const size = content.length;
    const dim = dimensions(file);
    const sha = crypto.createHash('sha256').update(content).digest('hex');
    return {
      id: `MED-${String(index + 1).padStart(4, '0')}`,
      path: file,
      used_on: info.used_on,
      width_px: dim ? String(dim.width) : 'n/a',
      height_px: dim ? String(dim.height) : 'n/a',
      format,
      bytes: String(size),
      alt_text: info.alt_text,
      caption: info.caption || '',
      credit: info.credit,
      license: info.license,
      license_status: info.license_status,
      sha256: sha,
      status: info.status,
      release_relevance: info.release_relevance,
      delivery: 'shipped',
      _dim: dim,
      _source: info.source,
    };
  });

  return { rows, unmatched, stale, files };
}

function toCsv(rows) {
  const lines = [COLUMNS.join(',')];
  for (const row of rows) lines.push(COLUMNS.map((column) => csvCell(row[column])).join(','));
  return `${lines.join('\n')}\n`;
}

// ------------------------------------------------------------ Lückenliste (MD)

function formatBytes(bytes) {
  const mib = bytes / (1024 * 1024);
  return `${mib.toFixed(1).replace('.', ',')} MiB`;
}

function buildGapDoc(rows) {
  const by = (fn) => rows.reduce((acc, row) => acc.set(fn(row), (acc.get(fn(row)) || 0) + 1), new Map());

  const groups = new Map();
  for (const row of rows) {
    const parts = row.path.split('/');
    const key = parts.length > 2 ? `${parts[0]}/${parts[1]}` : row.path;
    const entry = groups.get(key) || { files: 0, bytes: 0 };
    entry.files += 1;
    entry.bytes += Number(row.bytes);
    groups.set(key, entry);
  }
  const groupRows = [...groups.entries()].sort((a, b) => b[1].bytes - a[1].bytes);

  const statusCounts = by((row) => row.license_status);
  const relevanceCounts = by((row) => row.release_relevance);
  const openRows = rows.filter((row) => row.license_status === 'ungeklaert');
  const mustOpen = openRows.filter((row) => row.release_relevance === 'must');
  const tarot = rows.filter((row) => row.path.startsWith('assets/tarot/'));
  const originals = rows.filter((row) => row.path.includes('/original/'));

  const lines = [];
  lines.push('# Medien-Katalog: Lückenliste und Risiken');
  lines.push('');
  lines.push('Stand: Baseline `9f58439` (`baseline/rubriken-2026-11-03`), Branch `wt/t_cbbf71e0`.');
  lines.push('Erzeugt mit `node scripts/migration-baseline/build-media-catalog.cjs`; alle Zahlen sind am');
  lines.push('Dateibaum gemessen, nicht geschätzt. Prüfung: `node scripts/migration-baseline/validate-catalogs.cjs`');
  lines.push('und `node scripts/migration-baseline/verify-media-catalog.cjs` (17 Abnahmeprüfungen).');
  lines.push('');
  lines.push('## 1. Umfang');
  lines.push('');
  lines.push(`- Zeilen im Katalog: **${rows.length}** (eine Zeile je Datei unter \`assets/\`, §3.2/§8 Regel 1).`);
  lines.push(
    `- Gesamtgröße: **${rows.reduce((sum, row) => sum + Number(row.bytes), 0).toLocaleString('de-DE')} Byte** (${formatBytes(rows.reduce((sum, row) => sum + Number(row.bytes), 0))}).`
  );
  lines.push(`- \`license_status\`: ${[...statusCounts.entries()].map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  lines.push(`- \`release_relevance\`: ${[...relevanceCounts.entries()].map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  lines.push(
    `- \`delivery\`: alle ${rows.length} Dateien \`shipped\` (Pages liefert die Repository-Wurzel aus, §2.9).`
  );
  lines.push('');
  lines.push('### 1.1 Gewicht je Gruppe');
  lines.push('');
  lines.push('| Gruppe | Dateien | Byte | Anteil |');
  lines.push('| --- | ---: | ---: | ---: |');
  for (const [key, entry] of groupRows) {
    const share = ((entry.bytes / rows.reduce((sum, row) => sum + Number(row.bytes), 0)) * 100).toFixed(1);
    lines.push(`| \`${key}\` | ${entry.files} | ${entry.bytes.toLocaleString('de-DE')} | ${share} % |`);
  }
  lines.push('');
  lines.push('## 2. Ungeklärte Lizenzen — jede Zeile einzeln');
  lines.push('');
  if (!openRows.length) {
    lines.push('Keine Zeile mit `license_status: ungeklaert`.');
  } else {
    lines.push(`**${openRows.length} Zeile(n)** mit \`license_status: ungeklaert\`, davon **${mustOpen.length}** mit`);
    lines.push('`release_relevance: must` — das ist laut §8 Regel 3 ein Gate-Punkt vor dem nächsten Push.');
    lines.push('');
    lines.push('| ID | Pfad | Verwendung | Relevanz | Eigentümer | Nächster Schritt |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const row of openRows) {
      lines.push(
        `| ${row.id} | \`${row.path}\` | ${row.used_on} | ${row.release_relevance} | Eigentümer (Markus/ingbms) | Quelle und Lizenz im Impressum belegen oder Bild ersetzen; danach \`license\`/\`license_status\` im Katalog nachziehen |`
      );
    }
  }
  lines.push('');
  lines.push('## 3. Rechte-Risiken bei formal geklärten Zeilen');
  lines.push('');
  lines.push('Diese Zeilen sind `geklaert`, weil ein Nachweis im Repository existiert. Der Nachweis ist aber');
  lines.push('unvollständig — bewusst als Risiko geführt, nicht als stille Annahme:');
  lines.push('');
  lines.push('| Befund | Betroffene Zeilen | Eigentümer | Nächster Schritt |');
  lines.push('| --- | --- | --- | --- |');
  lines.push(
    `| \`README.md\` nennt MIT „siehe \`LICENSE\`“; eine \`LICENSE\`-Datei existiert im Baseline-Commit nicht (auch nicht in der Git-Historie). Projekt-eigene Dateien hängen damit an einer Textaussage ohne Lizenzdatei. | ${rows.filter((row) => row.license.startsWith('MIT')).length} (Favicon und die 4 eigenen Radiästhesie-Zeichnungen) | Eigentümer | \`LICENSE\` (MIT) anlegen oder README korrigieren; danach Lizenzangabe auf die Datei stützen |`
  );
  lines.push(
    '| `assets/radiasthesie/media/ATTRIBUTION.md` führt als offenen Punkt: „Keine LICENSE-Datei im Repository: die Lizenz der eigenen SVGs und der Projektinhalte ist nicht formal festgelegt.“ Das widerspricht der MIT-Angabe im README. | 4 eigene Zeichnungen | Eigentümer | Widerspruch zugunsten einer Quelle auflösen (LICENSE-Datei) |'
  );
  lines.push(
    '| Gartenbrevier: „Eine über die Nutzung auf dieser Website hinausgehende Weiterlizenzierung der V2-Motive ist … nicht erklärt“ (`impressum.html#tarot-decks`). Für die Auslieferung geklärt, für Dritte nicht. | 238 | Eigentümer | Entscheiden, ob die V2-Motive auslizenzierbar sein sollen |'
  );
  lines.push(
    '| Mineral-Detailfoto: Figcaption nennt Urheber und Lizenz (Didier Descouens, CC BY-SA 4.0), das Impressum dokumentiert aber nur „Quartz Brésil“ (Hero). Ohne Quellen-URL ist die Attribution für CC BY-SA unvollständig. | 1 | Eigentümer | Quelle im Impressum ergänzen oder Bild durch eine belegte Fassung ersetzen |'
  );
  lines.push('');
  lines.push('## 4. Technische Risiken am Medienbestand');
  lines.push('');
  lines.push('| Befund | Zahlen | Eigentümer | Nächster Schritt |');
  lines.push('| --- | --- | --- | --- |');
  lines.push(
    `| Tarot-Decks dominieren die Auslieferung und liegen ausschließlich als JPEG vor (kein WebP/AVIF). | ${tarot.length} Dateien, ${tarot.reduce((sum, row) => sum + Number(row.bytes), 0).toLocaleString('de-DE')} Byte (${formatBytes(tarot.reduce((sum, row) => sum + Number(row.bytes), 0))}) | Eigentümer/Performance | Moderne Formate für die 300/600-Stufen prüfen; Byte-Effekt vor Umstellung messen |`
  );
  lines.push(
    `| Quellfassungen der Radiästhesie-Fotos liegen unter \`assets/radiasthesie/media/original/\` und sind damit öffentlich abrufbar, obwohl keine Ansicht sie referenziert. | ${originals.length} Dateien, ${originals.reduce((sum, row) => sum + Number(row.bytes), 0).toLocaleString('de-DE')} Byte (${formatBytes(originals.reduce((sum, row) => sum + Number(row.bytes), 0))}) | Eigentümer | Aus dem Auslieferungspfad nehmen (z. B. \`docs/\`) oder bewusst als Quellbeleg führen |`
  );
  lines.push(
    '| `assets/radiasthesie/media/bildnachweis.html` und `ATTRIBUTION.md` stehen im Auslieferungspfad, sind aber aus der Navigation nicht verlinkt; die Pflicht-Namensnennung für CC BY-SA 3.0 (zwei Motive) hängt damit an einem unverlinkten Dokument und am Impressum. | 2 Dokumente, 2 CC-BY-SA-3.0-Motive | Eigentümer | Bildnachweis aus dem Impressum verlinken oder Motive tauschen |'
  );
  lines.push(
    '| `README.md` verweist auf `assets/og-preview.png` als OG-Image; die Datei existiert im Baseline-Commit nicht. Im Markup (`index.html`) ist kein `og:image` gesetzt — die Dokumentation ist hier falsch, nicht die Auslieferung. | 0 Dateien betroffen | Eigentümer | README-Zeile korrigieren oder OG-Bild ergänzen |'
  );
  lines.push(
    '| `assets/radiasthesie/media/ATTRIBUTION.md` sagt „Die Bilder sind noch nicht in `js/data/radiasthesie.js` eingebunden“ — das ist am Baseline-Stand falsch: alle sechs Motive sind als Figuren eingebunden (`js/data/radiasthesie.js`, u. a. Z. 175, 301, 622, 658, 995). | 6 Motive | Eigentümer | Nachweistext neu erzeugen, damit der Nachweis zum Stand passt |'
  );
  lines.push('');
  lines.push('## 5. Prüfmittel-Korrekturen');
  lines.push('');
  lines.push('| Änderung | Grund | Nachweis |');
  lines.push('| --- | --- | --- |');
  lines.push(
    '| `scripts/migration-baseline/lib/catalog.cjs`: `MEDIA_VECTOR_FORMATS` um `md` und `html` erweitert. | §8 verlangt `n/a` für Nicht-Rasterformate; der Prüfer kannte nur Vektor- und Schriftformate und verlangte für `ATTRIBUTION.md` und `bildnachweis.html` Pixelmaße (`DIMENSION_MISSING`). Die Erweiterung ändert nur Textformate; Rasterformate verlangen weiterhin Maße (Negativfall geprüft). | `node scripts/migration-baseline/validate-catalogs.cjs` |'
  );
  lines.push('');
  lines.push('## 6. Erfassungsregeln, die man beim Lesen kennen muss');
  lines.push('');
  lines.push('| Regel | Warum | Nachweis |');
  lines.push('| --- | --- | --- |');
  lines.push(
    '| Kristall-Stufen 320/640/1280 tragen den Alt-Text des Motivs, obwohl das Kartenraster `alt=""` rendert. | Der Raster-Alt ist bewusst leer, weil die Kartenüberschrift den Stein schon nennt; der beschreibende Alt existiert im Detaildialog desselben Motivs. Er wird wortgleich übernommen statt neu formuliert (§8 Regel 4). | `js/modules/crystals.js` figureHtml vs. figureDetailHtml; `data/crystals.json` `image_alt` |'
  );
  lines.push(
    '| Tarot-Thumbnails sind als `dekorativ` geführt, Detail und Zoom mit beschreibendem Alt. | Im Raster ist `alt=""` gesetzt (der Link trägt den Namen), im Detaildialog steht „Name · Nummer — Karte aus dem Deck …“. | `js/modules/tarot.js` Z. 197, 356-360 |'
  );
  lines.push(
    '| Quellfassungen unter `assets/radiasthesie/media/original/` stehen als `status: final`, `release_relevance: none`, `delivery: shipped`. | Sie sind fertige Belege, aber von keiner Ansicht referenziert — öffentlich abrufbar bleiben sie trotzdem. | `delivery` ist technisch (§5.10), nicht wertend |'
  );
  lines.push(
    '| `used_on` nennt bei Radiästhesie-Fotos `#pendeln/<topic>`, auch wenn das `#pendeln/pendeln` ergibt. | Der Router baut die Route als `#pendeln/${topic.slug}`; der Themen-Slug heißt tatsächlich `pendeln`. | `js/modules/radiasthesie-model.js` Z. 173 |'
  );
  lines.push('');
  lines.push('## 7. Was dieser Katalog nicht leistet');
  lines.push('');
  lines.push(
    '- Keine juristische Freigabe. `geklaert` heißt: ein Nachweis im Repository existiert und ist hier verlinkt.'
  );
  lines.push('- Keine Bewertung der Bildqualität oder der Motivwahl, nur Erfassung und Rechte-Nachweis.');
  lines.push(
    '- Keine Messung der Ladezeit. Die Byte-Summen sind Dateigrößen; der Lighthouse-Wert ist eine getrennte Prüfung.'
  );
  lines.push('');
  return `${lines.join('\n')}\n`;
}

// ------------------------------------------------------------------------ Main

function main() {
  const argv = new Set(process.argv.slice(2));
  const { rows, unmatched, stale } = buildRows();

  const { mismatches, checked } = compareWithManifests(rows);
  if (mismatches.length) {
    console.error(`Gegenprobe gegen die Manifeste fehlgeschlagen (${mismatches.length}):`);
    for (const line of mismatches.slice(0, 20)) console.error(' -', line);
    process.exitCode = 1;
    return;
  }

  if (argv.has('--list-unmatched')) {
    console.log('Nicht zugeordnet:', unmatched.length);
    for (const file of unmatched) console.log(' -', file);
    console.log('Verwaiste Quellen:', stale.length);
    for (const file of stale) console.log(' +', file);
    return;
  }

  const csv = toCsv(rows);
  if (argv.has('--check')) {
    if (!fs.existsSync(OUT_CSV)) {
      console.error('media-catalog.csv fehlt.');
      process.exitCode = 1;
      return;
    }
    const current = fs.readFileSync(OUT_CSV, 'utf8');
    if (current !== csv) {
      console.error('media-catalog.csv weicht von der Erzeugung ab.');
      process.exitCode = 1;
      return;
    }
    console.log(`OK: ${rows.length} Zeilen, media-catalog.csv ist aktuell.`);
    return;
  }

  fs.writeFileSync(OUT_CSV, csv);
  fs.writeFileSync(OUT_GAPS, buildGapDoc(rows));

  const totalBytes = rows.reduce((sum, row) => sum + Number(row.bytes), 0);
  const byStatus = rows.reduce(
    (acc, row) => acc.set(row.license_status, (acc.get(row.license_status) || 0) + 1),
    new Map()
  );
  const byRelevance = rows.reduce(
    (acc, row) => acc.set(row.release_relevance, (acc.get(row.release_relevance) || 0) + 1),
    new Map()
  );
  console.log(`media-catalog.csv: ${rows.length} Zeilen, ${totalBytes} Byte`);
  console.log(`Gegenprobe Manifeste: ${checked} Dateien gegen Byte/SHA-256/Maße geprüft, 0 Abweichungen.`);
  console.log(`license_status: ${[...byStatus].map(([k, v]) => `${k}=${v}`).join(' ')}`);
  console.log(`release_relevance: ${[...byRelevance].map(([k, v]) => `${k}=${v}`).join(' ')}`);
  if (unmatched.length) console.log(`WARNUNG nicht zugeordnet: ${unmatched.join(', ')}`);
  if (stale.length) console.log(`WARNUNG verwaiste Quellen: ${stale.join(', ')}`);
  console.log('medien-katalog-luecken.md geschrieben.');
}

main();
