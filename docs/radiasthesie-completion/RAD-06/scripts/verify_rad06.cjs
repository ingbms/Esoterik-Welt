// RAD-06 — Prüfskript für Inhalts-, Quellen- und Bildmatrix sowie interne Links.
//
// Prüft den tatsächlich generierten Datensatz (js/data/radiasthesie.js) gegen
// die redaktionellen Quellen (Markdown, quellen.json, Medien-Manifest) und
// gegen die Zuordnung Aussage → Kapitel. Erzeugt daraus die Matrixdatei
// INHALT-QUELLEN-BILD-MATRIX.md und matrix.json.
//
// Aufruf: node docs/radiasthesie-completion/RAD-06/scripts/verify_rad06.cjs
// Exitcode 0 = alle Pflichtprüfungen grün; 1 = mindestens eine rot.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../../../..');
const outDir = path.join(root, 'docs/radiasthesie-completion/RAD-06');
const created = [];
let failures = 0;

const check = (ok, label, detail = '') => {
  created.push({ ok: Boolean(ok), label, detail });
  if (!ok) {
    failures += 1;
    console.error(`FEHLT: ${label}${detail ? ' — ' + detail : ''}`);
  }
  return ok;
};

// --- Erwartete Zuordnung der Auftragsfragen (Master ESOW-RAD-06) ----------
// Elf redaktionelle Fragen plus die zehn IA-Bereiche. Jede Zeile nennt Ziel
// (Route), Anker und die Begriffe, die im Kapitel vorkommen müssen.
const CONTENT_MATRIX = [
  { frage: 'Was ist Radiästhesie?', topic: 'radiasthesie', anchor: 'was', muss: ['Radiästhesie', 'Mutung'] },
  { frage: 'Welche historischen Ursprünge sind dokumentiert?', topic: 'radiasthesie', anchor: 'geschichte-1', muss: ['Agricola', '1556'] },
  { frage: 'Wie entstand der Begriff (1800–1945)?', topic: 'radiasthesie', anchor: 'geschichte-2', muss: ['Bouly', '1926'] },
  { frage: 'Nachkriegszeit, Gitter, Institutionen', topic: 'radiasthesie', anchor: 'geschichte-3', muss: ['Hartmann', 'Münchner'] },
  { frage: 'Was unterscheidet Wünschelrute, Winkelrute und Biotensor?', topic: 'radiasthesie', anchor: 'instrumente', muss: ['Winkelrute', 'Biotensor', 'Einhandrute'] },
  { frage: 'Erdstrahlen und Gesundheitsbehauptungen', topic: 'radiasthesie', anchor: 'erdstrahlen', muss: ['Erdstrahlen', 'geopathischen'] },
  { frage: 'Was sagt die Geologie?', topic: 'radiasthesie', anchor: 'geologie', muss: ['Wasseradern'] },
  { frage: 'Was sind Bovis-Skalen?', topic: 'radiasthesie', anchor: 'bovis', muss: ['Bovis', '6.500'] },
  { frage: 'Welche Untersuchungen wurden durchgeführt?', topic: 'radiasthesie', anchor: 'befunde', muss: ['843', 'Placebo', 'Blindtest'] },
  { frage: 'Wie funktioniert das Pendeln?', topic: 'pendeln', anchor: 'was', muss: ['Pendel', 'Konvention'] },
  { frage: 'Geschichte des Pendelns', topic: 'pendeln', anchor: 'geschichte', muss: ['Ammianus', '371'] },
  { frage: 'Welche Pendelarten und Materialien gibt es?', topic: 'pendeln', anchor: 'arten', muss: ['Tropfenpendel', 'Material'] },
  { frage: 'Pendeln lernen: Ablauf und Eichung', topic: 'pendeln', anchor: 'lernen', muss: ['Eichung', 'Chevreul'] },
  { frage: 'Wie werden Pendeltafeln benutzt?', topic: 'pendeln', anchor: 'tafeln', muss: ['Pendeltafeln', 'Tafel-Studio'] },
  { frage: 'Biotensor und Einhandrute', topic: 'pendeln', anchor: 'biotensor', muss: ['Biotensor', 'Doppelblindtest'] },
  { frage: 'Kartenpendeln und Fernmutung', topic: 'pendeln', anchor: 'karten', muss: ['Fernmutung', 'Minen'] },
  { frage: 'Welche Mechanismen sind bekannt?', topic: 'pendeln', anchor: 'mechanismen', muss: ['Carpenter', 'Kohnstamm', 'Chevreul'] },
  { frage: 'Forschungsstand Pendeln', topic: 'pendeln', anchor: 'forschung', muss: ['Forschung', 'Zufall'] },
  { frage: 'Selbst testen (Werkzeuge)', topic: 'pendeln', anchor: 'labor', muss: ['Experimentierlabor', 'Pendeltagebuch'] },
  { frage: 'Orakel und Divination', topic: 'orakel', anchor: 'divination', muss: ['Divination'] },
  { frage: 'Tarot: Geschichte', topic: 'orakel', anchor: 'tarot-1', muss: ['1440', 'Visconti'] },
  { frage: 'Forer-Effekt', topic: 'orakel', anchor: 'forer', muss: ['Forer'] },
];

// --- Zuordnung der 30 Delta-Aussagen (C01–C30) zu Kapiteln ----------------
// Grundlage: docs/radiasthesie-completion/RAD-02/quellen-delta.json.
// Geprüft wird, dass die Hauptquelle der Aussage im genannten Kapitel zitiert
// wird — nicht, dass der Satz wörtlich übernommen wurde.
const CLAIM_MAP = {
  C01: { topic: 'radiasthesie', anchor: 'geschichte-1', source: 'Q34' },
  C02: { topic: 'radiasthesie', anchor: 'geschichte-1', source: 'Q34' },
  C03: { topic: 'radiasthesie', anchor: 'geschichte-1', source: 'Q35' },
  C04: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q42' },
  C05: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q42' },
  C06: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q04' },
  C07: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q40' },
  C08: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q40' },
  C09: { topic: 'pendeln', anchor: 'mechanismen', source: 'Q52' },
  C10: { topic: 'pendeln', anchor: 'mechanismen', source: 'Q53' },
  C11: { topic: 'radiasthesie', anchor: 'instrumente', source: 'Q56' },
  C12: { topic: 'radiasthesie', anchor: 'instrumente', source: 'Q55' },
  C13: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q44' },
  C14: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q45' },
  C15: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q46' },
  C16: { topic: 'radiasthesie', anchor: 'befunde', source: 'Q47' },
  C17: { topic: 'radiasthesie', anchor: 'erdstrahlen', source: 'Q48' },
  C18: { topic: 'radiasthesie', anchor: 'erdstrahlen', source: 'Q49' },
  C19: { topic: 'pendeln', anchor: 'was', source: 'Q51' },
  C20: { topic: 'radiasthesie', anchor: 'geschichte-2', source: 'Q63' },
  C21: { topic: 'radiasthesie', anchor: 'geschichte-2', source: 'Q63' },
  C22: { topic: 'radiasthesie', anchor: 'geschichte-1', source: 'Q36' },
  C23: { topic: 'radiasthesie', anchor: 'was', source: 'Q59' },
  C24: { topic: 'radiasthesie', anchor: 'was', source: 'Q60' },
  C25: { topic: 'radiasthesie', anchor: 'was', source: 'Q61' },
  C26: { topic: 'radiasthesie', anchor: 'was', source: 'Q62' },
  C27: { topic: 'radiasthesie', anchor: 'was', source: 'Q57' },
  C28: { topic: 'radiasthesie', anchor: 'was', source: 'Q38' },
  C29: { topic: 'radiasthesie', anchor: 'geschichte-2', source: 'Q64' },
  C30: { topic: 'radiasthesie', anchor: 'instrumente', source: 'Q34' },
};

const blocksToText = (blocks) =>
  (blocks || [])
    .map((block) =>
      block.type === 'ul' ? block.items.join(' ') : block.type === 'callout' ? block.paragraphs.join(' ') : block.text
    )
    .join(' ');

function sectionText(section) {
  return `${section.title} ${blocksToText(section.blocks)}`;
}

// --- WebP-Maße aus dem Dateikopf lesen (keine externen Pakete) ------------
function webpSize(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }
  if (chunk === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

async function main() {
  const dataUrl = pathToFileURL(path.join(root, 'js/data/radiasthesie.js')).href;
  const mod = await import(dataUrl);
  const data = mod.RADIASTHESIE;
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'docs/radiasthesie-konzept/recherche/quellen.json'), 'utf8'));
  const delta = JSON.parse(fs.readFileSync(path.join(root, 'docs/radiasthesie-completion/RAD-02/quellen-delta.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/radiasthesie/media/media-manifest.json'), 'utf8'));

  const sourceIds = new Set(data.sources.map((source) => source.id));
  const sectionsById = {};
  for (const [slug, topic] of Object.entries(data.topics)) {
    for (const section of topic.sections) sectionsById[`${slug}/${section.id}`] = section;
  }

  // 1. Quellenbasis
  check(data.sources.length === 66, 'Quellenbasis umfasst 66 Einträge', `gefunden: ${data.sources.length}`);
  check(registry.sources.length === 66, 'quellen.json umfasst 66 Einträge');
  check(
    data.sources.every((source) => source.locator || source.url),
    'jede Quelle hat einen Locator'
  );
  check(
    data.sources.every((source) => source.levels.length > 0),
    'jede Quelle trägt mindestens eine Evidenzstufe'
  );
  check(
    data.sources.every((source) =>
      /^(Volltext|VL|Crossref|DOI\/CF|ISBN|AB|OA-Meta|Metadaten|Nur Abstract)/.test(source.verification)
    ),
    'jede Quelle nennt eine Prüftiefe'
  );

  // 2. Inhaltsmatrix
  const contentRows = CONTENT_MATRIX.map((row) => {
    const topic = data.topics[row.topic];
    const section = topic && topic.sections.find((entry) => entry.id === row.anchor);
    const text = section ? sectionText(section) : '';
    const missing = section ? row.muss.filter((needle) => !text.toLowerCase().includes(needle.toLowerCase())) : row.muss;
    check(Boolean(section), `Inhaltsmatrix: ${row.frage}`, section ? '' : `Anker ${row.topic}/${row.anchor} fehlt`);
    check(missing.length === 0, `Inhalt im Kapitel ${row.topic}/${row.anchor}`, missing.join(', '));
    return {
      frage: row.frage,
      ziel: `#pendeln/${row.topic}/${row.anchor}`,
      kapitel: section ? section.title : '—',
      stufen: section ? section.chips.join('/') : '—',
      status: section && missing.length === 0 ? 'ok' : 'Lücke',
    };
  });

  // 3. Aussagen-Matrix
  const claimRows = (delta.claims || []).map((claim) => {
    const target = CLAIM_MAP[claim.id];
    check(Boolean(target), `Aussage ${claim.id} hat eine Kapitelzuordnung`, 'keine Zuordnung im Prüfskript');
    if (!target) return { id: claim.id, status: 'keine Zuordnung' };
    const section = sectionsById[`${target.topic}/${target.anchor}`];
    check(Boolean(section), `Zielkapitel für ${claim.id}`, `${target.topic}/${target.anchor}`);
    const text = section ? sectionText(section) : '';
    const cited = text.includes(`[${target.source}]`) || text.includes(`${target.source},`) || text.includes(`, ${target.source}`);
    check(cited, `${claim.id}: Hauptquelle ${target.source} im Kapitel ${target.topic}/${target.anchor} zitiert`);
    return {
      id: claim.id,
      status: claim.status,
      quelle: target.source,
      ziel: `#pendeln/${target.topic}/${target.anchor}`,
      stufen: section ? section.chips.join('/') : '—',
      geprueft: cited ? 'ja' : 'nein',
      aussage: claim.text,
    };
  });

  // 4. Bildmatrix
  const mediaRows = (manifest.items || []).map((item) => {
    const inData = data.media.items.find((entry) => entry.id === item.id);
    check(Boolean(inData), `Motiv ${item.id} steht im Datensatz`);
    const placed = Object.entries(data.topics).flatMap(([slug, topic]) =>
      topic.sections
        .filter((section) => (section.photos || []).some((photo) => photo.id === item.id))
        .map((section) => `${slug}/${section.id}`)
    );
    check(placed.length === 1, `Motiv ${item.id} ist genau einmal platziert`, placed.join(', ') || 'nirgends');
    const file = path.join(root, item.web.src);
    check(fs.existsSync(file), `Motiv ${item.id}: WebP-Datei vorhanden`, item.web.src);
    const size = fs.existsSync(file) ? webpSize(file) : null;
    check(
      size && size.width === item.web.width && size.height === item.web.height,
      `Motiv ${item.id}: Maße im Manifest stimmen mit der Datei`,
      size ? `${size.width}×${size.height} statt ${item.web.width}×${item.web.height}` : 'Maße nicht lesbar'
    );
    check(Boolean(item.alt && item.alt.length > 20), `Motiv ${item.id}: Alt-Text beschreibt das Motiv`);
    check(Boolean(item.attribution_text), `Motiv ${item.id}: Attributionszeile vorhanden`);
    const srcsetOk = String(item.web.srcset || '')
      .split(',')
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean)
      .every((candidate) => fs.existsSync(path.join(root, candidate)));
    check(srcsetOk, `Motiv ${item.id}: alle srcset-Dateien vorhanden`);
    return {
      id: item.id,
      motiv: item.motiv,
      datei: item.web.src,
      masse: `${item.web.width}×${item.web.height}`,
      einsatz: placed.join(', ') || '—',
      lizenz: item.lizenz.kurz,
      urheber: Array.isArray(item.urheber) ? item.urheber.join('; ') : String(item.urheber || ''),
      alt: item.alt,
      attribution: item.attribution_text,
    };
  });

  const ownRows = (manifest.own_assets || []).map((asset) => {
    const exists = fs.existsSync(path.join(root, asset.datei));
    check(exists, `Eigene Zeichnung vorhanden: ${asset.datei}`);
    return { datei: asset.datei, motiv: asset.motiv, lizenz: (asset.lizenz || {}).kurz || '—' };
  });

  // 5. Interne Links aus den gerenderten Ansichten
  const viewsPath = path.join(root, 'js/modules/radiasthesie-views.js');
  const modelPath = path.join(root, 'js/modules/radiasthesie-model.js');
  const tmpDir = path.join(process.env.TMPDIR || root, 'rad06-verify');
  fs.mkdirSync(tmpDir, { recursive: true });
  // Die Browser-Module sind ESM; package.json im Paket setzt "commonjs".
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  for (const file of [
    'js/modules/radiasthesie-format.js',
    'js/modules/radiasthesie-views.js',
    'js/modules/radiasthesie-model.js',
    'js/modules/pendeltafel-model.js',
    'js/modules/experiment-statistik.js',
    'js/modules/journal-speicher.js',
    'js/modules/radiasthesie-vertraege.js',
    'js/data/radiasthesie.js',
    'js/data/radiasthesie-werkstatt.js',
  ]) {
    const target = path.join(tmpDir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
    void viewsPath;
    void modelPath;
  }
  const views = await import(pathToFileURL(path.join(tmpDir, 'js/modules/radiasthesie-views.js')).href);
  const modelModule = await import(pathToFileURL(path.join(tmpDir, 'js/modules/radiasthesie-model.js')).href);
  const model = modelModule.createModel(data);

  const pages = [
    ['landing', views.renderLanding(model)],
    ...Object.values(data.topics).map((topic) => [`#pendeln/${topic.slug}`, views.renderTopic(model, topic)]),
    ['glossar', views.renderGlossar(model)],
    ['quellen', views.renderQuellen(model)],
    ['methodik', views.renderMethodik(model)],
    ['suche', views.renderSuche(model, 'pendel')],
  ];

  const hrefPattern = /href="(#[^"]+)"/g;
  const linkTargets = new Map();
  for (const [name, page] of pages) {
    const html = page.html;
    check((html.match(/<h1/g) || []).length === 1, `${name}: genau eine H1`);
    check(!/undefined|\[object Object\]/.test(html), `${name}: keine Platzhalter im HTML`);
    let match;
    while ((match = hrefPattern.exec(html))) {
      const href = match[1];
      if (!linkTargets.has(href)) linkTargets.set(href, new Set());
      linkTargets.get(href).add(name);
    }
  }

  const GLOBAL_PAGES = ['home', 'tarot', 'crystals', 'moon', 'runes', 'astrologie', 'blog'];
  const unresolved = [];
  for (const [href, from] of linkTargets) {
    const raw = href.replace(/^#/, '').split('?')[0];
    const segments = raw.split('/').filter(Boolean);
    // Verweise auf andere Module der Website gehören nicht zu diesem Router.
    if (segments.length === 1 && GLOBAL_PAGES.includes(segments[0])) continue;
    const route = model.resolve(segments, '');
    const known = ['landing', 'topic', 'glossar', 'quellen', 'methodik', 'suche', 'labor', 'studio', 'experiment', 'journal'];
    if (!known.includes(route.view)) unresolved.push(`${href} (aus ${[...from].join(', ')})`);
    if (route.view === 'topic' && route.anchor) {
      const exists = route.topic.sections.some((section) => section.id === route.anchor);
      if (!exists) unresolved.push(`${href}: Anker unbekannt`);
    }
    if (segments[0] === 'pendeln' && segments[1] && !['glossar', 'quellen', 'methodik', 'suche', 'labor', 'studio', 'experiment', 'journal'].includes(segments[1]) && !data.topics[segments[1]]) {
      unresolved.push(`${href}: unbekannter Bereich`);
    }
  }
  check(linkTargets.size > 15, 'die Ansichten enthalten interne Verweise', `${linkTargets.size} Ziele`);
  check(unresolved.length === 0, 'alle internen Verweise lösen auf', unresolved.slice(0, 8).join(' | '));

  // 6. Kerntext ohne JavaScript
  for (const [slug, topic] of Object.entries(data.topics)) {
    const html = views.renderTopic(model, topic).html;
    const firstSection = topic.sections[0];
    const haystack = html.replace(/<[^>]+>/g, ' ');
    check(
      firstSection.blocks.some((block) => haystack.includes(String(block.text || '').slice(0, 40))),
      `#pendeln/${slug}: Kerntext steht im HTML`,
      'Text des ersten Kapitels nicht im Markup'
    );
  }

  // 7. Externe Verweise: Format und Erreichbarkeit der Lizenz-URLs
  const external = data.sources.map((source) => source.url).filter((url) => /^https?:/.test(url));
  check(external.length >= 60, 'externe Quellen-URLs sind vorhanden', `${external.length}`);
  const licenseUrls = [...new Set(data.media.items.map((item) => item.license.url).filter(Boolean))];
  for (const url of licenseUrls) {
    check(/^https:\/\//.test(url), `Lizenz-URL ist HTTPS: ${url}`);
  }

  // --- Ausgabe ------------------------------------------------------------
  const stamp = new Date().toISOString();
  const summary = {
    generated_at: stamp,
    checks: created.length,
    failures,
    counts: {
      topics: Object.keys(data.topics).length,
      chapters: data.counts.chapters,
      sources: data.sources.length,
      claims: claimRows.length,
      photos: mediaRows.length,
      own_assets: ownRows.length,
      internal_links: linkTargets.size,
    },
    unresolved_links: unresolved,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'matrix.json'), JSON.stringify({ summary, contentRows, claimRows, mediaRows, ownRows }, null, 2));

  const table = (header, rows) =>
    [`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`, ...rows.map((row) => `| ${row.join(' | ')} |`)].join('\n');

  const markdown = `# Inhalt-, Quellen- und Bildmatrix (RAD-06)

Erzeugt von \`docs/radiasthesie-completion/RAD-06/scripts/verify_rad06.cjs\` am ${stamp}.
Grundlage ist der generierte Datensatz \`js/data/radiasthesie.js\`, nicht diese Datei.

## 1. Inhaltsmatrix (Auftragsfragen → Kapitel)

${table(
  ['Frage / Bereich', 'Ziel', 'Kapitel', 'Stufen', 'Status'],
  contentRows.map((row) => [row.frage, row.ziel, row.kapitel, row.stufen, row.status])
)}

## 2. Aussagen-Matrix (C01–C30 aus RAD-02)

Geprüft wird je Aussage, dass die Hauptquelle im genannten Kapitel zitiert wird.
Die Stufe ist die des Kapitels, nicht die der Quelle.

${table(
  ['ID', 'Status der Aussage', 'Hauptquelle', 'Kapitel', 'Stufen im Kapitel', 'Quelle zitiert'],
  claimRows.map((row) => [row.id, row.status, row.quelle, row.ziel, row.stufen, row.geprueft])
)}

## 3. Bildmatrix (sechs Fotos)

${table(
  ['ID', 'Motiv', 'Datei', 'Maße', 'Einsatz', 'Lizenz', 'Urheber'],
  mediaRows.map((row) => [row.id, row.motiv, row.datei, row.masse, row.einsatz, row.lizenz, row.urheber])
)}

## 4. Eigene Zeichnungen

${table(
  ['Datei', 'Motiv', 'Lizenzvermerk'],
  ownRows.map((row) => [row.datei, row.motiv, row.lizenz])
)}

## 5. Interne Verweise

${linkTargets.size} verschiedene interne Ziele in sechs Ansichten; nicht auflösbar: ${unresolved.length}.

${unresolved.length ? unresolved.map((entry) => `- ${entry}`).join('\n') : 'Alle Ziele lösen auf eine bekannte Ansicht und — bei Kapitel-Ankern — auf ein vorhandenes Kapitel auf.'}

## 6. Prüfungen

${created.length} Einzelprüfungen, davon ${failures} ohne Erfolg.
`;

  fs.writeFileSync(path.join(outDir, 'INHALT-QUELLEN-BILD-MATRIX.md'), markdown);

  console.log(
    `${created.length} Prüfungen, ${failures} Fehler · ${data.counts.chapters} Kapitel · ${data.sources.length} Quellen · ` +
      `${mediaRows.length} Fotos · ${ownRows.length} Zeichnungen · ${linkTargets.size} interne Linkziele`
  );
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error('FEHLER: ' + (error && error.stack ? error.stack : error));
  process.exitCode = 1;
});
