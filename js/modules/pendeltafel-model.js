// Pendeltafel-Studio — Datenmodell, Prüfung und SVG-Erzeugung (RAD-08).
//
// Dieses Modul kennt weder DOM noch Browser: Es beschreibt die Tafel, prüft
// importierte Konfigurationen und erzeugt eine eigenständige SVG-Datei. Damit
// ist es in Node vollständig prüfbar (tests/pendeltafel-studio.mjs) und im
// Browser unverändert nutzbar.
//
// Sicherheitsmodell (bewusst doppelt abgesichert):
//
// 1. Jede importierte Konfiguration wird gegen ein festes Schema geprüft:
//    nur bekannte Felder, fester Schema-Bezeichner, feste Palette, 2–48
//    Segmente, 1–40 Zeichen je Beschriftung, höchstens 32 KiB Importgröße.
//    Markup-Zeichen (< >) und Steuerzeichen werden abgelehnt. Unbekannte
//    Felder werden abgelehnt, damit z. B. „onload“ oder „href“ gar nicht erst
//    in die Erzeugung gelangen.
//
// 2. Die SVG-Ausgabe setzt ausschließlich geprüfte Texte als Textinhalt ein
//    und escaped sie zusätzlich (escapeXml). Geometrie, Farben und Attribute
//    stammen aus diesem Modul, nie aus der Eingabe. Es gibt kein <script>,
//    keinen Eventhandler, kein <foreignObject>, kein <image>, kein <use> und
//    keine externe Referenz.
//
// Die Datei ist bewusst frei von Zufall und Zeit: gleiche Konfiguration ergibt
// dieselbe Zeichenkette, damit Export, Reimport und Tests vergleichbar sind.

export const BOARD_SCHEMA = 'esow.pendeltafel/1';

export const BOARD_LIMITS = Object.freeze({
  // Importgröße der JSON-Konfiguration in Bytes (UTF-8).
  maxBytes: 32 * 1024,
  minSegments: 2,
  maxSegments: 48,
  // Harte Obergrenze unabhängig von der Segmentzahl; je nach Segmentzahl
  // greift zusätzlich die geometrische Grenze (maxLabelLengthFor).
  maxLabelLength: 40,
  maxTitleLength: 60,
});

// Zeichenfläche: 600 × 660 Einheiten. Der Kreis liegt bei (300, 340) mit
// Radius 258; darüber die Überschrift, darunter zwei Zeilen Fußtext.
export const BOARD_GEOMETRY = Object.freeze({
  width: 600,
  height: 660,
  cx: 300,
  cy: 340,
  radius: 258,
  innerRing: 248,
  medallion: 78,
  minFont: 10,
  maxFont: 34,
  // Konservative Breitenschätzung für Proportionalschrift (Bezug: Geviert).
  charWidth: 0.58,
  // Anteil der Sehnenlänge, den ein Text höchstens füllen darf. Der Rest ist
  // Luft zum Ring: Beschriftungen wie „Süd & West“ sollen den Rand nicht
  // berühren, auch wenn die Breitenschätzung ungenau ist.
  fitFactor: 0.78,
});

// Farbstile aus den Tokens des Designsystems (css/design-system.css):
// Sand/Messing, Salbei, Nachtrose und eine helle Papier-Variante für den
// Druck. Jeder Stil hat geprüfte Kontraste; tests/pendeltafel-studio.mjs
// rechnet sie nach (Text ≥ 4,5:1, Linien ≥ 3:1).
export const PALETTES = Object.freeze({
  messing: Object.freeze({
    id: 'messing',
    label: 'Messing',
    note: 'Sand und Messing auf Nachtgrund — der Standard des Bereichs.',
    bg: '#141c1f',
    disk: '#1a2427',
    ring: '#c6b38e',
    line: '#82928e',
    text: '#eae6dc',
    muted: '#babdb7',
    accent: '#d5c4a2',
  }),
  salbei: Object.freeze({
    id: 'salbei',
    label: 'Salbei',
    note: 'Grünlich gedämpft, wie die Aufrecht-Kennzeichnung des Moduls.',
    bg: '#101a17',
    disk: '#16241f',
    ring: '#9db3a4',
    line: '#6e7c79',
    text: '#e7eee8',
    muted: '#b9c6bb',
    accent: '#c3d2c4',
  }),
  nacht: Object.freeze({
    id: 'nacht',
    label: 'Nachtrose',
    note: 'Tiefes Blau mit roséfarbenen Linien.',
    bg: '#0d141b',
    disk: '#131d26',
    ring: '#c09489',
    line: '#5f6f7a',
    text: '#e8e6e1',
    muted: '#b6bdc1',
    accent: '#d3b3a9',
  }),
  papier: Object.freeze({
    id: 'papier',
    label: 'Papier',
    note: 'Helle Fläche mit dunkler Schrift — für Druck und PDF gedacht.',
    bg: '#fbf9f4',
    disk: '#f2ede1',
    ring: '#6b5b3e',
    line: '#8a7b5f',
    text: '#2b2a26',
    muted: '#5a564c',
    accent: '#4a3f2c',
  }),
});

export const PALETTE_IDS = Object.freeze(Object.keys(PALETTES));

const LETTERS = Object.freeze('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));

// Vorlagen. `labels` ist die vollständige Beschriftung; die Segmentzahl ergibt
// sich daraus. `rotation` ist der Startwinkel des ersten Segments in Grad
// (0° = rechts, 90° = unten in SVG-Koordinaten).
export const BOARD_PRESETS = Object.freeze([
  Object.freeze({
    id: 'janain',
    title: 'Ja/Nein-Tafel',
    labels: Object.freeze(['JA', 'NEIN']),
    rotation: 90,
    description: 'Zwei Hälften: JA links, NEIN rechts.',
  }),
  Object.freeze({
    id: 'zahlenkreis',
    title: 'Zahlenkreis 0–9',
    labels: Object.freeze(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
    description: 'Zehn Zahlen im Kreis, 0 oben.',
  }),
  Object.freeze({
    id: 'buchstaben',
    title: 'Buchstabentafel A–Z',
    labels: LETTERS,
    description: '26 Buchstaben, A oben.',
  }),
  Object.freeze({
    id: 'segmente4',
    title: 'Segmenttafel · vier Felder',
    labels: Object.freeze(['JA', 'NEIN', 'UNKLAR', 'OFFEN']),
    description: 'Vier gleich große Segmente mit freien Beschriftungen.',
  }),
  Object.freeze({
    id: 'segmente6',
    title: 'Segmenttafel · sechs Felder',
    labels: Object.freeze(['1', '2', '3', '4', '5', '6']),
    description: 'Sechs Segmente, 1 oben.',
  }),
  Object.freeze({
    id: 'segmente12',
    title: 'Segmenttafel · zwölf Felder',
    labels: Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']),
    description: 'Zwölf Segmente wie die Tafel im Thema Pendeln.',
  }),
]);

export const PRESET_IDS = Object.freeze(BOARD_PRESETS.map((preset) => preset.id));

const PRESET_BY_ID = new Map(BOARD_PRESETS.map((preset) => [preset.id, preset]));

const SCHEMA_KEYS = Object.freeze(['schema', 'preset', 'title', 'palette', 'labels']);

/** Fehler mit maschinenlesbarer Liste; die Oberfläche zeigt `errors` an. */
export class BoardValidationError extends TypeError {
  constructor(errors) {
    super(errors.join(' '));
    this.name = 'BoardValidationError';
    this.errors = errors;
  }
}

export function escapeXml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}

function utf8Bytes(value) {
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(value).length;
  let bytes = 0;
  for (const character of value) bytes += character.codePointAt(0) > 0x7f ? 3 : 1;
  return bytes;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasControlCharacter(value) {
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

function hasMarkupCharacter(value) {
  return value.includes('<') || value.includes('>');
}

/** Radius, auf dem die Beschriftungen sitzen (Anteil des Kreisradius). */
export function labelRadiusFor(segments) {
  const factor = segments <= 4 ? 0.55 : segments <= 12 ? 0.68 : 0.78;
  return BOARD_GEOMETRY.radius * factor;
}

/** Sehnenlänge zwischen zwei Segmentmitten am Beschriftungsradius. */
export function chordFor(segments) {
  return 2 * labelRadiusFor(segments) * Math.sin(Math.PI / segments);
}

/**
 * Wie viele Zeichen passen bei dieser Segmentzahl noch lesbar in ein Segment?
 * Grundlage ist die kleinste zulässige Schriftgröße (10 Einheiten); die harte
 * Obergrenze von 40 Zeichen gilt zusätzlich.
 */
export function maxLabelLengthFor(segments) {
  const count = Math.max(1, Math.min(BOARD_LIMITS.maxSegments, Math.floor(segments) || 0));
  const fit = Math.floor(
    (chordFor(count) * BOARD_GEOMETRY.fitFactor) / (BOARD_GEOMETRY.minFont * BOARD_GEOMETRY.charWidth)
  );
  return Math.max(1, Math.min(BOARD_LIMITS.maxLabelLength, fit));
}

/** Schriftgröße der Segmentbeschriftungen: gleich für alle Segmente. */
export function labelFontSize(segments, longestLabel) {
  const characters = Math.max(1, Number(longestLabel) || 1);
  const cap = segments >= 20 ? 28 : BOARD_GEOMETRY.maxFont;
  const size = (chordFor(segments) * BOARD_GEOMETRY.fitFactor) / (characters * BOARD_GEOMETRY.charWidth);
  return Math.round(Math.max(BOARD_GEOMETRY.minFont, Math.min(cap, size)) * 10) / 10;
}

function fitSingleLine(text, maxWidth, baseSize, minSize) {
  const characters = Math.max(1, [...String(text)].length);
  return Math.max(minSize, Math.min(baseSize, Math.floor(maxWidth / (characters * BOARD_GEOMETRY.charWidth))));
}

export function presetById(id) {
  return PRESET_BY_ID.get(String(id || '')) || null;
}

/** Frische Kopie der Vorlage als Konfiguration (Standard-Palette: messing). */
export function defaultConfigForPreset(id, palette = 'messing') {
  const preset = presetById(id) || BOARD_PRESETS[0];
  return freezeConfig({
    schema: BOARD_SCHEMA,
    preset: preset.id,
    title: preset.title,
    palette: PALETTES[palette] ? palette : 'messing',
    labels: [...preset.labels],
  });
}

function freezeConfig(config) {
  return Object.freeze({
    schema: BOARD_SCHEMA,
    preset: config.preset,
    title: config.title,
    palette: config.palette,
    labels: Object.freeze([...config.labels]),
  });
}

function validateText(value, { field, min, max }) {
  const errors = [];
  if (typeof value !== 'string') {
    errors.push(`${field} muss Text sein.`);
    return { errors, value: '' };
  }
  const trimmed = value.trim();
  if (trimmed.length < min) errors.push(`${field} darf nicht leer sein.`);
  if (trimmed.length > max) errors.push(`${field} ist zu lang: ${trimmed.length} Zeichen, erlaubt sind ${max}.`);
  if (hasControlCharacter(trimmed)) errors.push(`${field} enthält Steuerzeichen oder Zeilenumbrüche.`);
  if (hasMarkupCharacter(trimmed)) errors.push(`${field}: Die Zeichen < und > sind nicht erlaubt.`);
  return { errors, value: trimmed };
}

/**
 * Prüft eine Konfiguration vollständig. Rückgabe:
 *   { ok, errors: string[], warnings: string[], value: frozen config|null }
 * `value` ist nur bei ok gesetzt und dann eingefroren.
 */
export function validateBoard(input) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(input)) {
    return { ok: false, errors: ['Die Konfiguration muss ein JSON-Objekt sein.'], warnings, value: null };
  }

  for (const key of Object.keys(input)) {
    if (!SCHEMA_KEYS.includes(key)) {
      errors.push(`Unbekanntes Feld „${key}“ — erlaubt sind ${SCHEMA_KEYS.join(', ')}.`);
    }
  }

  if (input.schema !== BOARD_SCHEMA) {
    errors.push(`Feld „schema“ muss „${BOARD_SCHEMA}“ sein.`);
  }

  const preset = typeof input.preset === 'string' ? presetById(input.preset) : null;
  if (!preset) {
    errors.push(`Feld „preset“ muss eine der Vorlagen sein: ${PRESET_IDS.join(', ')}.`);
  }

  if (!PALETTES[input.palette]) {
    errors.push(`Feld „palette“ muss einer der Farbstile sein: ${PALETTE_IDS.join(', ')}.`);
  }

  const title = validateText(input.title, {
    field: 'Überschrift',
    min: 1,
    max: BOARD_LIMITS.maxTitleLength,
  });
  errors.push(...title.errors);

  const labels = Array.isArray(input.labels) ? input.labels : null;
  const checkedLabels = [];
  if (!labels) {
    errors.push('Feld „labels“ muss eine Liste von Beschriftungen sein.');
  } else {
    if (labels.length < BOARD_LIMITS.minSegments) {
      errors.push(`Mindestens ${BOARD_LIMITS.minSegments} Segmente sind nötig; übergeben wurden ${labels.length}.`);
    }
    if (labels.length > BOARD_LIMITS.maxSegments) {
      errors.push(`Höchstens ${BOARD_LIMITS.maxSegments} Segmente sind erlaubt; übergeben wurden ${labels.length}.`);
    }
    const lengthLimit = Math.min(BOARD_LIMITS.maxLabelLength, maxLabelLengthFor(labels.length));
    labels.forEach((label, index) => {
      const number = index + 1;
      if (typeof label !== 'string') {
        errors.push(`Beschriftung ${number} muss Text sein.`);
        checkedLabels.push('');
        return;
      }
      const trimmed = label.trim();
      checkedLabels.push(trimmed);
      if (!trimmed) errors.push(`Beschriftung ${number} ist leer.`);
      if (trimmed.length > lengthLimit) {
        errors.push(
          `Beschriftung ${number} ist zu lang: ${trimmed.length} Zeichen; bei ${labels.length} Segmenten sind höchstens ${lengthLimit} möglich.`
        );
      }
      if (hasControlCharacter(trimmed)) {
        errors.push(`Beschriftung ${number} enthält Steuerzeichen oder Zeilenumbrüche.`);
      }
      if (hasMarkupCharacter(trimmed)) {
        errors.push(`Beschriftung ${number}: Die Zeichen < und > sind nicht erlaubt.`);
      }
    });
    const seen = new Set();
    for (const label of checkedLabels) {
      if (!label) continue;
      if (seen.has(label)) warnings.push(`Die Beschriftung „${label}“ kommt mehrfach vor.`);
      seen.add(label);
    }
  }

  if (errors.length > 0) return { ok: false, errors, warnings, value: null };

  return {
    ok: true,
    errors,
    warnings,
    value: freezeConfig({
      preset: preset.id,
      title: title.value,
      palette: input.palette,
      labels: checkedLabels,
    }),
  };
}

/**
 * Liest eine JSON-Konfiguration mit Größenprüfung und Schema-Prüfung.
 * Rückgabe wie validateBoard, zusätzlich `bytes`.
 */
export function parseBoardJson(text) {
  const raw = typeof text === 'string' ? text.replace(/^\uFEFF/, '') : '';
  const bytes = utf8Bytes(raw);
  const base = { bytes, warnings: [], value: null };
  if (!raw.trim()) return { ...base, ok: false, errors: ['Der Import ist leer.'] };
  if (bytes > BOARD_LIMITS.maxBytes) {
    return {
      ...base,
      ok: false,
      errors: [
        `Der Import ist ${bytes} Bytes groß; erlaubt sind höchstens ${BOARD_LIMITS.maxBytes} Bytes (${Math.round(
          BOARD_LIMITS.maxBytes / 1024
        )} KiB).`,
      ],
    };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    const detail = String(error && error.message ? error.message : error).slice(0, 120);
    return { ...base, ok: false, errors: [`Kein gültiges JSON: ${detail}`] };
  }
  const result = validateBoard(data);
  return { ...result, bytes };
}

/** Kanonische JSON-Darstellung der Konfiguration (für Export und Reimport). */
export function serializeBoard(config) {
  const checked = validateBoard(config);
  if (!checked.ok) throw new BoardValidationError(checked.errors);
  return (
    JSON.stringify(
      {
        schema: checked.value.schema,
        preset: checked.value.preset,
        title: checked.value.title,
        palette: checked.value.palette,
        labels: [...checked.value.labels],
      },
      null,
      2
    ) + '\n'
  );
}

/** Dateiname ohne Endung, aus der Überschrift abgeleitet. */
export function fileStem(title) {
  const slug = String(title || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `pendeltafel-${slug || 'tafel'}`;
}

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Geometrie der Tafel: Segmentwinkel, Beschriftungspositionen, Schriftgröße
 * und Trennlinien. Reine Rechnung, keine Zeichenkette.
 *
 * Startwinkel: bei zwei Segmenten 90° (JA links, NEIN rechts), sonst so
 * gedreht, dass die erste Beschriftung mittig oben steht.
 */
export function layoutBoard(config) {
  const checked = validateBoard(config);
  if (!checked.ok) throw new BoardValidationError(checked.errors);
  const value = checked.value;
  const segments = value.labels.length;
  const step = 360 / segments;
  const preset = presetById(value.preset);
  const usesPresetRotation = preset && preset.labels.length === segments;
  const rotation = usesPresetRotation && preset.rotation !== undefined ? preset.rotation : -90 - 180 / segments;
  const labelRadius = labelRadiusFor(segments);
  const longest = Math.max(...value.labels.map((label) => [...label].length));
  const fontSize = labelFontSize(segments, longest);

  const entries = value.labels.map((label, index) => {
    const startAngle = rotation + index * step;
    const endAngle = startAngle + step;
    const midAngle = startAngle + step / 2;
    const radians = toRadians(midAngle);
    return {
      index,
      label,
      startAngle,
      endAngle,
      midAngle,
      x: Math.round((BOARD_GEOMETRY.cx + labelRadius * Math.cos(radians)) * 100) / 100,
      y: Math.round((BOARD_GEOMETRY.cy + labelRadius * Math.sin(radians)) * 100) / 100,
    };
  });

  return {
    geometry: BOARD_GEOMETRY,
    segments,
    step,
    rotation,
    labelRadius,
    fontSize,
    entries,
    boundaries: entries.map((entry) => entry.startAngle),
    maxChars: maxLabelLengthFor(segments),
  };
}

function segmentLines(layout) {
  return layout.boundaries
    .map((angle) => {
      const radians = toRadians(angle);
      const x = BOARD_GEOMETRY.cx + BOARD_GEOMETRY.innerRing * Math.cos(radians);
      const y = BOARD_GEOMETRY.cy + BOARD_GEOMETRY.innerRing * Math.sin(radians);
      return `<line x1="${BOARD_GEOMETRY.cx}" y1="${BOARD_GEOMETRY.cy}" x2="${Number(x.toFixed(2))}" y2="${Number(
        y.toFixed(2)
      )}"></line>`;
    })
    .join('');
}

/**
 * Erzeugt die vollständige, eigenständige SVG-Datei.
 * Prüft die Konfiguration selbst (nicht nur der Aufrufer) und wirft bei
 * ungültigen Eingaben BoardValidationError.
 *
 * `caption: false` lässt die sichtbare Überschrift und die Fußzeile weg — die
 * Druckansicht setzt beides als HTML, damit es nicht doppelt erscheint.
 * `<title>` und `<desc>` bleiben immer erhalten: Sie sind die zugängliche
 * Beschreibung der Grafik und werden nicht gezeichnet.
 */
export function buildSvg(config, { caption = true } = {}) {
  const checked = validateBoard(config);
  if (!checked.ok) throw new BoardValidationError(checked.errors);
  const value = checked.value;
  const palette = PALETTES[value.palette];
  const layout = layoutBoard(value);
  const { width, height, cx, cy, radius } = BOARD_GEOMETRY;
  const titleSize = fitSingleLine(value.title, width - 80, 26, 13);
  const description =
    `Kreisrunde Pendeltafel „${value.title}“ mit ${layout.segments} gleich großen Segmenten: ` +
    `${value.labels.join(', ')}. Die Tafel ordnet die Bedeutung der Segmente; sie misst nichts.`;

  const labels = layout.entries
    .map(
      (entry) =>
        `<text x="${entry.x}" y="${entry.y}" dy=".35em" font-size="${layout.fontSize}">${escapeXml(entry.label)}</text>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="ptf-title ptf-desc">
  <title id="ptf-title">${escapeXml(value.title)}</title>
  <desc id="ptf-desc">${escapeXml(description)}</desc>
  <rect x="0" y="0" width="${width}" height="${height}" fill="${palette.bg}"></rect>
  ${
    caption
      ? `<text x="${cx}" y="48" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" letter-spacing="0.6" fill="${palette.text}">${escapeXml(
          value.title
        )}</text>`
      : ''
  }
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${palette.disk}"></circle>
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${palette.ring}" stroke-width="3"></circle>
  <circle cx="${cx}" cy="${cy}" r="${BOARD_GEOMETRY.innerRing}" fill="none" stroke="${palette.ring}" stroke-width="1" opacity="0.6"></circle>
  <g stroke="${palette.line}" stroke-width="1.2" opacity="0.85">${segmentLines(layout)}</g>
  <circle cx="${cx}" cy="${cy}" r="${BOARD_GEOMETRY.medallion}" fill="none" stroke="${palette.ring}" stroke-width="1.2" opacity="0.7"></circle>
  <circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="${palette.ring}" stroke-width="1" opacity="0.5"></circle>
  <circle cx="${cx}" cy="${cy}" r="5" fill="${palette.accent}"></circle>
  <g fill="${palette.text}" font-family="Georgia, 'Times New Roman', serif" font-weight="500" text-anchor="middle" letter-spacing="1">${labels}</g>
  ${
    caption
      ? `<text x="${cx}" y="620" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="11" fill="${palette.muted}">Esoterik-Welt · Pendeltafel-Studio</text>
  <text x="${cx}" y="638" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="11" fill="${palette.muted}">Die Tafel ordnet die Bedeutung der Segmente — sie misst nichts.</text>`
      : ''
  }
</svg>
`;
}

/** WCAG-Kontrastverhältnis zweier Hex-Farben (#rrggbb), für die Prüfung der Stile. */
export function contrastRatio(foreground, background) {
  const luminance = (hex) => {
    const value = String(hex).replace('#', '');
    const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
    const [r, g, b] = channels.map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
