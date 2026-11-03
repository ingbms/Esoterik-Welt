// Farbwelten — reine Logik: Routenauflösung und Spektrumrechnung.
//
// Kein DOM, keine Seiteneffekte: Damit prüft tests/farbwelten.mjs dieselben
// Regeln, die im Browser laufen (Stützwerte 650/530/420 nm).

export const ROUTE = {
  base: '#farbwelten',
  landing: (anchor) => (anchor ? `#farbwelten/${anchor}` : '#farbwelten'),
  color: (id, anchor) => `#farbwelten/${id}${anchor ? `/${anchor}` : ''}`,
  chakren: (anchor) => `#farbwelten/chakren${anchor ? `/${anchor}` : ''}`,
  light: (anchor) => `#farbwelten/lichtfrequenzen${anchor ? `/${anchor}` : ''}`,
  topic: (slug, anchor) => `#farbwelten/${slug}${anchor ? `/${anchor}` : ''}`,
  compass: () => '#farbwelten/kompass',
  meditation: () => '#farbwelten/farbmeditation',
  timeline: () => '#farbwelten/zeitleiste',
};

export const VIEW = {
  LANDING: 'landing',
  COLOR: 'color',
  CHAKREN: 'chakren',
  LIGHT: 'light',
  TOPIC: 'topic',
  COMPASS: 'kompass',
  MEDITATION: 'meditation',
  TIMELINE: 'zeitleiste',
  NOTFOUND: 'notfound',
};

// In-Page-Ziele der Einstiegsseite. Sie sind echte Routen, damit ein
// Deep-Link auf „Farbregister“ nicht als unbekannte Seite endet.
export const LANDING_ANCHORS = ['register', 'einstiege', 'methodik'];

export const VIRTUAL_PAGES = ['chakren', 'lichtfrequenzen', 'kompass', 'farbmeditation', 'zeitleiste'];

// Werkzeug-Routen der Sektion. Sie tragen keinen Anker: der Fokus landet auf
// der H1, nicht auf einem Sprungziel.
const TOOL_ROUTES = {
  kompass: VIEW.COMPASS,
  farbmeditation: VIEW.MEDITATION,
  zeitleiste: VIEW.TIMELINE,
};

const C = 299792458; // m/s
const PLANCK_EV_NM = 1239.841984; // eV·nm

/**
 * @param {string[]} segments Pfadsegmente hinter #farbwelten
 * @param {Array<{id:string}>} worlds
 * @param {string[]} sectionKeys Abschnittsschlüssel der Farbseiten
 * @param {Array<{slug:string, sections:Array<{anchor:string}>}>} topics Themenseiten
 */
export function resolveView(segments, worlds, sectionKeys = [], topics = []) {
  const [first, second] = segments || [];
  if (!first) return { view: VIEW.LANDING, anchor: '' };
  if (first === 'chakren') return { view: VIEW.CHAKREN, anchor: second || '', raw: 'chakren' };
  if (first === 'lichtfrequenzen') return { view: VIEW.LIGHT, anchor: second || '', raw: 'lichtfrequenzen' };
  if (TOOL_ROUTES[first]) return { view: TOOL_ROUTES[first], anchor: '', raw: first };
  // Themenseiten haben kein festes Skelett; ihr Anker ist ein Abschnitt ihrer
  // eigenen H2-Reihenfolge.
  const topic = (topics || []).find((entry) => entry.slug === first);
  if (topic) {
    const anchors = (topic.sections || []).map((section) => section.anchor);
    return { view: VIEW.TOPIC, topic, anchor: anchors.includes(second) ? second : '', raw: first };
  }
  const world = (worlds || []).find((entry) => entry.id === first);
  if (world) {
    return {
      view: VIEW.COLOR,
      world,
      anchor: sectionKeys.includes(second) ? second : '',
    };
  }
  if (LANDING_ANCHORS.includes(first) && !second) {
    return { view: VIEW.LANDING, anchor: first };
  }
  return { view: VIEW.NOTFOUND, slug: first };
}

/** Frequenz in THz (f = c/λ). */
export function frequencyThz(nm) {
  return C / (Number(nm) * 1e-9) / 1e12;
}

/** Photonenenergie in eV (E = hc/λ, mit hc in eV·nm). */
export function photonEnergyEv(nm) {
  return PLANCK_EV_NM / Number(nm);
}

/**
 * Sekunden → mm:ss für die Meditationsuhr. Negative oder ungültige Werte
 * ergeben 00:00; gerundet wird auf ganze Sekunden.
 */
export function formatClock(seconds) {
  const value = Number(seconds);
  const total = Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

// Farbnamen-Grenzen: konventionelle Näherung, keine kolorimetrische Aussage.
const BANDS = [
  { id: 'violett', name: 'Violett', max: 425 },
  { id: 'indigo', name: 'Indigo', max: 450 },
  { id: 'blau', name: 'Blau', max: 490 },
  { id: 'gruen', name: 'Grün', max: 570 },
  { id: 'gelb', name: 'Gelb', max: 590 },
  { id: 'orange', name: 'Orange', max: 620 },
  { id: 'rot', name: 'Rot', max: 750 },
];

export function bandFor(nm) {
  const value = Number(nm);
  const band = BANDS.find((entry) => value <= entry.max);
  if (!band) {
    return {
      id: 'infrarot',
      name: 'Infrarot',
      spectral: false,
      note: 'außerhalb des sichtbaren Bereichs',
    };
  }
  if (value < 380) {
    return { id: 'ultraviolett', name: 'Ultraviolett', spectral: false, note: 'außerhalb des sichtbaren Bereichs' };
  }
  return { ...band, spectral: true, note: 'innerhalb des sichtbaren Bereichs' };
}

/**
 * Wellenlänge → sRGB-Näherung nach Dan Bruton. Dient nur der Vorschaufläche;
 * ein Bildschirm erzeugt damit kein monochromatisches Licht.
 */
export function wavelengthToRgb(nm) {
  const wavelength = Math.min(780, Math.max(380, Number(nm)));
  let r = 0;
  let g = 0;
  let b = 0;
  if (wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    b = 1;
  } else if (wavelength < 490) {
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength < 510) {
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
  } else if (wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
  } else {
    r = 1;
  }
  let factor = 1;
  if (wavelength < 420) factor = 0.3 + (0.7 * (wavelength - 380)) / 40;
  else if (wavelength > 700) factor = 0.3 + (0.7 * (780 - wavelength)) / 80;
  const gamma = 0.8;
  const channel = (value) =>
    Math.round(255 * Math.pow(Math.max(0, Math.min(1, value * factor)), gamma))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function spectrumAt(nm) {
  const wavelength = Math.round(Number(nm));
  const band = bandFor(wavelength);
  const frequency = frequencyThz(wavelength);
  const energy = photonEnergyEv(wavelength);
  const decimal = (value) => value.toFixed(1).replace('.', ',');
  return {
    wavelength,
    band,
    frequency,
    energy,
    hex: wavelengthToRgb(wavelength),
    frequencyLabel: `${decimal(frequency)} THz`,
    energyLabel: `${energy.toFixed(2).replace('.', ',')} eV`,
    valueText: `${wavelength} Nanometer, ${band.name}, ${decimal(frequency)} Terahertz, ${energy
      .toFixed(2)
      .replace('.', ',')} Elektronenvolt`,
  };
}
