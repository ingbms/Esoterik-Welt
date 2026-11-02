// Mondberechnung für Esoterik-Welt — offline, ohne Fremd-API, ohne Abhängigkeit.
//
// Methodik (bewusst konservativ, damit jede Zahl belegbar bleibt):
//   * Zeitpunkte der vier Hauptphasen: Jean Meeus, "Astronomical Algorithms",
//     2. Auflage, Kapitel 49 ("Phases of the Moon"), Tafeln 49.A/49.B.
//     Ausgabe in TT (JDE); Umrechnung nach UTC über ΔT nach Espenak/Meeus.
//     Kontrolliert gegen USNO (Astronomical Applications Department) und
//     JPL Horizons — siehe tests/moon-astro.cjs und docs/mond-t_f7b2af0a.md.
//   * Beleuchtungsgrad: Meeus, Kapitel 48, Näherung 48.4 für den Phasenwinkel
//     i und k = (1 + cos i) / 2 (Gl. 48.1).
//   * Zeitzone: Europe/Berlin ist die dokumentierte Startannahme. Intern wird
//     ausschließlich in UTC-Instanten gerechnet; die Anzeige erfolgt über
//     Intl.DateTimeFormat, damit Sommer-/Winterzeit (DST) korrekt bleibt.
//
// Was dieses Modul absichtlich NICHT liefert:
//   * Mondauf-/-untergang (standortabhängig, ohne Standort nicht seriös),
//   * Mondzeichen/astrologische Position (dafür wäre eine geprüfte Ephemeride
//     nötig; wir raten nicht),
//   * Finsternis-Prognosen (andere Rechnung: Knotenlage + Syzygien).

export const SYNODIC_MONTH_DAYS = 29.530588853;
export const DEFAULT_TIME_ZONE = 'Europe/Berlin';

// k = 0 entspricht dem Neumond vom 2000-01-06 (Meeus, Kap. 49).
const NEW_MOON_EPOCH_JD = 2451550.09765;
const UNIX_EPOCH_JD = 2440587.5;
const MS_PER_DAY = 86400000;
const D2R = Math.PI / 180;

const sinDeg = (x) => Math.sin(x * D2R);
const cosDeg = (x) => Math.cos(x * D2R);
const norm360 = (x) => ((x % 360) + 360) % 360;

/** ΔT = TT − UT in Sekunden, Polynom von Espenak/Meeus für 2005–2050. */
export function deltaTSeconds(year) {
  const t = year - 2000;
  return 62.92 + 0.32217 * t + 0.005589 * t * t;
}

/** Julianisches Datum (UTC) eines Date-Objekts. */
function jdFromDate(date) {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

/** Date (UTC) aus einem Julianischen Datum. */
function dateFromJd(jd) {
  return new Date((jd - UNIX_EPOCH_JD) * MS_PER_DAY);
}

// --- Meeus, Kap. 49: Korrekturterme -------------------------------------
// Alle Terme in Tagen. E = Exzentrizitätsfaktor des Sonnenlaufs.

function newMoonCorrection(E, M, Mp, F, Om) {
  return (
    -0.4072 * sinDeg(Mp) +
    0.17241 * E * sinDeg(M) +
    0.01608 * sinDeg(2 * Mp) +
    0.01039 * sinDeg(2 * F) +
    0.00739 * E * sinDeg(Mp - M) +
    -0.00514 * E * sinDeg(Mp + M) +
    0.00208 * E * E * sinDeg(2 * M) +
    -0.00111 * sinDeg(Mp - 2 * F) +
    -0.00057 * sinDeg(Mp + 2 * F) +
    0.00056 * E * sinDeg(2 * Mp + M) +
    -0.00042 * sinDeg(3 * Mp) +
    0.00042 * E * sinDeg(M + 2 * F) +
    0.00038 * E * sinDeg(M - 2 * F) +
    -0.00024 * E * sinDeg(2 * Mp - M) +
    -0.00017 * sinDeg(Om) +
    -0.00007 * sinDeg(Mp + 2 * M) +
    0.00004 * sinDeg(2 * Mp - 2 * F) +
    0.00004 * sinDeg(3 * M) +
    0.00003 * sinDeg(Mp + M - 2 * F) +
    0.00003 * sinDeg(2 * Mp + 2 * F) +
    -0.00003 * sinDeg(Mp + M + 2 * F) +
    0.00003 * sinDeg(Mp - M + 2 * F) +
    -0.00002 * sinDeg(Mp - M - 2 * F) +
    -0.00002 * sinDeg(3 * Mp + M) +
    0.00002 * sinDeg(4 * Mp)
  );
}

function fullMoonCorrection(E, M, Mp, F, Om) {
  return (
    -0.40614 * sinDeg(Mp) +
    0.17302 * E * sinDeg(M) +
    0.01614 * sinDeg(2 * Mp) +
    0.01043 * sinDeg(2 * F) +
    0.00734 * E * sinDeg(Mp - M) +
    -0.00515 * E * sinDeg(Mp + M) +
    0.00209 * E * E * sinDeg(2 * M) +
    -0.00111 * sinDeg(Mp - 2 * F) +
    -0.00057 * sinDeg(Mp + 2 * F) +
    0.00056 * E * sinDeg(2 * Mp + M) +
    -0.00042 * sinDeg(3 * Mp) +
    0.00042 * E * sinDeg(M + 2 * F) +
    0.00038 * E * sinDeg(M - 2 * F) +
    -0.00024 * E * sinDeg(2 * Mp - M) +
    -0.00017 * sinDeg(Om) +
    -0.00007 * sinDeg(Mp + 2 * M) +
    0.00004 * sinDeg(2 * Mp - 2 * F) +
    0.00004 * sinDeg(3 * M) +
    0.00003 * sinDeg(Mp + M - 2 * F) +
    0.00003 * sinDeg(2 * Mp + 2 * F) +
    -0.00003 * sinDeg(Mp + M + 2 * F) +
    0.00003 * sinDeg(Mp - M + 2 * F) +
    -0.00002 * sinDeg(Mp - M - 2 * F) +
    -0.00002 * sinDeg(3 * Mp + M) +
    0.00002 * sinDeg(4 * Mp)
  );
}

function quarterCorrection(E, M, Mp, F, Om) {
  // Hauptterme der Viertel (Meeus 49.A) ...
  const base =
    -0.62801 * sinDeg(Mp) +
    0.17172 * E * sinDeg(M) +
    -0.01183 * E * sinDeg(Mp + M) +
    0.00862 * sinDeg(2 * Mp) +
    0.00804 * sinDeg(2 * F) +
    0.00454 * E * sinDeg(Mp - M) +
    0.00204 * E * E * sinDeg(2 * M) +
    -0.0018 * sinDeg(Mp - 2 * F) +
    -0.0007 * sinDeg(Mp + 2 * F) +
    -0.0004 * sinDeg(3 * Mp) +
    -0.00034 * E * sinDeg(2 * Mp - M) +
    0.00032 * E * sinDeg(M + 2 * F) +
    0.00032 * E * sinDeg(M - 2 * F) +
    -0.00028 * E * E * sinDeg(Mp + 2 * M) +
    0.00027 * E * sinDeg(2 * Mp + M) +
    -0.00017 * sinDeg(Om) +
    -0.00005 * sinDeg(Mp - M - 2 * F) +
    0.00004 * sinDeg(2 * Mp + 2 * F) +
    -0.00004 * sinDeg(Mp + M + 2 * F) +
    0.00004 * sinDeg(Mp - 2 * M) +
    0.00003 * sinDeg(Mp + M - 2 * F) +
    0.00003 * sinDeg(3 * M) +
    0.00002 * sinDeg(2 * Mp - 2 * F) +
    0.00002 * sinDeg(Mp - M + 2 * F) +
    -0.00002 * sinDeg(3 * Mp + M);
  // ... plus W, das je nach erstem oder letztem Viertel addiert/subtrahiert wird.
  const W =
    0.00306 -
    0.00038 * E * cosDeg(M) +
    0.00026 * cosDeg(Mp) -
    0.00002 * cosDeg(Mp - M) +
    0.00002 * cosDeg(Mp + M) +
    0.00002 * cosDeg(2 * F);
  return { base, W };
}

// Zusatzterme der Planetenstörungen (Meeus 49, A1…A14).
const PLANETARY_TERMS = [
  { a0: 299.77, a1: 0.107408, a2: -0.009173, coeff: 0.000325 },
  { a0: 251.88, a1: 0.016321, a2: 0, coeff: 0.000165 },
  { a0: 251.83, a1: 26.651886, a2: 0, coeff: 0.000164 },
  { a0: 349.42, a1: 36.412478, a2: 0, coeff: 0.000126 },
  { a0: 84.66, a1: 18.206239, a2: 0, coeff: 0.00011 },
  { a0: 141.74, a1: 53.303771, a2: 0, coeff: 0.000062 },
  { a0: 207.14, a1: 2.453732, a2: 0, coeff: 0.00006 },
  { a0: 154.84, a1: 7.30686, a2: 0, coeff: 0.000056 },
  { a0: 34.52, a1: 27.261239, a2: 0, coeff: 0.000047 },
  { a0: 207.19, a1: 0.121824, a2: 0, coeff: 0.000042 },
  { a0: 291.34, a1: 1.844379, a2: 0, coeff: 0.00004 },
  { a0: 161.72, a1: 24.198154, a2: 0, coeff: 0.000037 },
  { a0: 239.56, a1: 25.513099, a2: 0, coeff: 0.000035 },
  { a0: 331.55, a1: 3.592518, a2: 0, coeff: 0.000023 },
];

function planetaryCorrection(k, T) {
  let sum = 0;
  for (const term of PLANETARY_TERMS) {
    sum += term.coeff * sinDeg(term.a0 + term.a1 * k + term.a2 * T * T);
  }
  return sum;
}

export const PHASE_TYPES = ['neumond', 'erstes-viertel', 'vollmond', 'letztes-viertel'];

const PHASE_OFFSETS = { neumond: 0, 'erstes-viertel': 0.25, vollmond: 0.5, 'letztes-viertel': 0.75 };

/**
 * Zeitpunkt einer Hauptphase als Date (UTC) für Lunationsindex n
 * (n ganzzahlig = Neumond; +0.25 erstes Viertel; +0.5 Vollmond; +0.75 letztes Viertel).
 */
function phaseInstant(k) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  const jde0 = NEW_MOON_EPOCH_JD + SYNODIC_MONTH_DAYS * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = norm360(2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3);
  const Mp = norm360(201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4);
  const F = norm360(160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4);
  const Om = norm360(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3);

  const frac = ((k % 1) + 1) % 1;
  let correction;
  let type;
  if (Math.abs(frac) < 1e-9) {
    type = 'neumond';
    correction = newMoonCorrection(E, M, Mp, F, Om);
  } else if (Math.abs(frac - 0.5) < 1e-9) {
    type = 'vollmond';
    correction = fullMoonCorrection(E, M, Mp, F, Om);
  } else {
    const { base, W } = quarterCorrection(E, M, Mp, F, Om);
    if (Math.abs(frac - 0.25) < 1e-9) {
      type = 'erstes-viertel';
      correction = base + W;
    } else {
      type = 'letztes-viertel';
      correction = base - W;
    }
  }

  const jde = jde0 + correction + planetaryCorrection(k, T);
  const year = 2000 + k / 12.3685;
  const jdUtc = jde - deltaTSeconds(year) / 86400;
  return { type, k, date: dateFromJd(jdUtc), jde };
}

/**
 * Alle Hauptphasen zwischen zwei Zeitpunkten (UTC), aufsteigend sortiert.
 * @returns {Array<{type: string, k: number, date: Date}>}
 */
export function principalPhases(from, to) {
  const kFrom = Math.floor((jdFromDate(from) - NEW_MOON_EPOCH_JD) / SYNODIC_MONTH_DAYS) - 2;
  const kTo = Math.ceil((jdFromDate(to) - NEW_MOON_EPOCH_JD) / SYNODIC_MONTH_DAYS) + 2;
  const out = [];
  for (let n = kFrom; n <= kTo; n++) {
    for (const type of PHASE_TYPES) {
      const instant = phaseInstant(n + PHASE_OFFSETS[type]);
      if (instant.date >= from && instant.date <= to) out.push(instant);
    }
  }
  return out.sort((a, b) => a.date - b.date);
}

/** Phasenwinkel i in Grad und Beleuchtungsgrad k für einen Zeitpunkt (Meeus 48.1/48.4). */
export function illuminationAt(date) {
  const jd = jdFromDate(date);
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  // Mittlere Elongation, mittlere Anomalien (Meeus 47.2 ff., Grad).
  const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000);
  const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000);
  const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000);

  const phaseAngle =
    180 -
    D -
    6.289 * sinDeg(Mp) +
    2.1 * sinDeg(M) -
    1.274 * sinDeg(2 * D - Mp) -
    0.658 * sinDeg(2 * D) -
    0.214 * sinDeg(2 * Mp) -
    0.11 * sinDeg(D);

  const k = (1 + cosDeg(phaseAngle)) / 2;
  return { phaseAngle, fraction: Math.min(1, Math.max(0, k)) };
}

// --- Zeitzonen ----------------------------------------------------------
// Interne Speicherung bleibt UTC; jede Anzeige geht durch Intl.

const partsFormatterCache = new Map();
function partsFormatter(timeZone) {
  let formatter = partsFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Wanduhr-Werte eines Zeitpunkts in einer Zeitzone. */
export function zonedParts(date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = {};
  for (const part of partsFormatter(timeZone).formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** UTC-Offset (ms) einer Zeitzone zum gegebenen Zeitpunkt. */
function zoneOffsetMs(date, timeZone) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** UTC-Instant zu einer Wanduhr-Zeit in einer Zeitzone (DST-fest, zwei Durchläufe). */
export function zonedTimeToUtc({ year, month, day, hour = 0, minute = 0 }, timeZone = DEFAULT_TIME_ZONE) {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = naive - zoneOffsetMs(new Date(naive), timeZone);
  guess = naive - zoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess);
}

/** Kalendertag (YYYY-MM-DD) eines Zeitpunkts in der Zeitzone. */
export function localDateKey(date, timeZone = DEFAULT_TIME_ZONE) {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/**
 * Differenz in Kalendertagen von `a` nach `b` in der Zeitzone.
 *
 * Bewusst über die lokalen Kalendertags-Keys gerechnet und nicht über
 * verstrichene Millisekunden: 23:30 und 00:30 liegen eine Stunde, aber einen
 * Kalendertag auseinander. `Math.round(ms / 86400000)` macht daraus fälschlich
 * "heute". 2026-11-01 21:28 MEZ → 2026-11-02 02:45 MEZ ergibt 1 Tag.
 */
export function calendarDayDifference(a, b, timeZone = DEFAULT_TIME_ZONE) {
  const dayNumber = (date) => {
    const p = zonedParts(date, timeZone);
    return Date.UTC(p.year, p.month - 1, p.day) / 86400000;
  };
  return Math.round(dayNumber(b) - dayNumber(a));
}

/** Mitternacht (UTC-Instant) des lokalen Kalendertags. */
export function startOfLocalDay(date, timeZone = DEFAULT_TIME_ZONE) {
  const p = zonedParts(date, timeZone);
  return zonedTimeToUtc({ year: p.year, month: p.month, day: p.day, hour: 0, minute: 0 }, timeZone);
}

function cachedFormatter(key, locale, options) {
  let formatter = cachedFormatter.cache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    cachedFormatter.cache.set(key, formatter);
  }
  return formatter;
}
cachedFormatter.cache = new Map();

/** "24. November 2026" in der Zeitzone. */
export function formatDateLong(date, timeZone = DEFAULT_TIME_ZONE, locale = 'de-DE') {
  return cachedFormatter(`long|${timeZone}|${locale}`, locale, {
    timeZone,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** "Montag, 2. November 2026". */
export function formatWeekdayDate(date, timeZone = DEFAULT_TIME_ZONE, locale = 'de-DE') {
  return cachedFormatter(`wday|${timeZone}|${locale}`, locale, {
    timeZone,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** "14:36" (24h) in der Zeitzone. */
export function formatTime(date, timeZone = DEFAULT_TIME_ZONE) {
  return cachedFormatter(`time|${timeZone}`, 'de-DE', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

/** Kurzname der Zeitzone zum Zeitpunkt, z. B. "MEZ" oder "MESZ". */
export function timeZoneAbbreviation(date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('de-DE', { timeZone, timeZoneName: 'short' }).formatToParts(date);
  const found = parts.find((p) => p.type === 'timeZoneName');
  return found ? found.value : timeZone;
}

// --- Phasenlogik --------------------------------------------------------

export const PHASE_META = [
  {
    key: 'neumond',
    name: 'Neumond',
    short: 'Neumond',
    octant: 0,
    waxing: null,
    range: [0, 2],
    summary: 'Mond zwischen Sonne und Erde — die erdzugewandte Seite bleibt unbeleuchtet.',
  },
  {
    key: 'zunehmende-sichel',
    name: 'Zunehmende Sichel',
    short: 'Zunehmend',
    octant: 1,
    waxing: true,
    range: [2, 45],
    summary: 'Schmale Sichel am Abendhimmel, rechts beleuchtet.',
  },
  {
    key: 'erstes-viertel',
    name: 'Erstes Viertel',
    short: 'Erstes Viertel',
    octant: 2,
    waxing: true,
    range: [45, 55],
    summary: 'Halbmond: Sonne–Erde–Mond bilden einen rechten Winkel.',
  },
  {
    key: 'zunehmender-mond',
    name: 'Zunehmender Mond (Gibbous)',
    short: 'Zunehmend',
    octant: 3,
    waxing: true,
    range: [55, 98],
    summary: 'Mehr als halb beleuchtet, wächst weiter Richtung Vollmond.',
  },
  {
    key: 'vollmond',
    name: 'Vollmond',
    short: 'Vollmond',
    octant: 4,
    waxing: null,
    range: [98, 100],
    summary: 'Erde zwischen Sonne und Mond — die volle Scheibe liegt uns gegenüber.',
  },
  {
    key: 'abnehmender-mond',
    name: 'Abnehmender Mond (Gibbous)',
    short: 'Abnehmend',
    octant: 5,
    waxing: false,
    range: [55, 98],
    summary: 'Noch fast voll, nimmt seitlich sichtbar ab.',
  },
  {
    key: 'letztes-viertel',
    name: 'Letztes Viertel',
    short: 'Letztes Viertel',
    octant: 6,
    waxing: false,
    range: [45, 55],
    summary: 'Wieder Halbmond, diesmal links beleuchtet und morgens sichtbar.',
  },
  {
    key: 'abnehmende-sichel',
    name: 'Abnehmende Sichel',
    short: 'Abnehmend',
    octant: 7,
    waxing: false,
    range: [2, 45],
    summary: 'Schmale Sichel am Morgenhimmel, links beleuchtet.',
  },
];

/**
 * Phasenname aus Beleuchtungsgrad und Richtung.
 *
 * Bewusst NICHT über acht gleich lange Zyklusabschnitte: Dann hieße ein Tag
 * mit 9 % Beleuchtung „Neumond" und ein Tag mit 30 % „Neumond" — Name und Zahl
 * würden sich widersprechen. Die vier Hauptphasen sind exakte Zeitpunkte mit
 * einem schmalen Fenster (Neumond/Vollmond < 2 %, Viertel 45–55 % um den
 * exakten Punkt); Sichel und Gibbous beschreiben die Bögen dazwischen.
 */
export function phaseKeyFor(illumination, waxing) {
  if (illumination < 2) return 'neumond';
  if (illumination >= 98) return 'vollmond';
  if (illumination >= 45 && illumination <= 55) return waxing ? 'erstes-viertel' : 'letztes-viertel';
  if (waxing) return illumination < 50 ? 'zunehmende-sichel' : 'zunehmender-mond';
  return illumination > 50 ? 'abnehmender-mond' : 'abnehmende-sichel';
}

/**
 * Vollständiger Zustand des Mondes zu einem Zeitpunkt.
 * @returns {{
 *   date: Date, phaseKey: string, phase: object, illumination: number,
 *   waxing: boolean, ageDays: number, cycleFraction: number,
 *   previous: object|null, next: object|null, events: Array<object>
 * }}
 */
export function getState(date = new Date()) {
  const t = date.getTime();
  const windowStart = new Date(t - 40 * MS_PER_DAY);
  const windowEnd = new Date(t + 40 * MS_PER_DAY);
  const events = principalPhases(windowStart, windowEnd);

  let prevIndex = -1;
  for (let i = 0; i < events.length; i++) {
    if (events[i].date.getTime() <= t) prevIndex = i;
    else break;
  }
  // Im unwahrscheinlichen Fall, dass kein Ereignis vor dem Zeitpunkt liegt,
  // auf den Anfang des Fensters zurückfallen statt zu raten.
  const prev = prevIndex >= 0 ? events[prevIndex] : events[0] || null;
  const next = prevIndex + 1 < events.length ? events[prevIndex + 1] : null;

  let cycleFraction = 0;
  if (prev && next) {
    const span = next.date.getTime() - prev.date.getTime();
    const progress = span > 0 ? (t - prev.date.getTime()) / span : 0;
    cycleFraction = (PHASE_OFFSETS[prev.type] + progress * 0.25) % 1;
  }

  const { fraction } = illuminationAt(date);
  const waxing = cycleFraction < 0.5;
  let phaseKey = phaseKeyFor(fraction * 100, waxing);
  let phase = PHASE_META.find((p) => p.key === phaseKey);

  // Exakt auf einer Hauptphase (innerhalb einer Minute) diese benennen.
  const exact = events.find((event) => Math.abs(event.date.getTime() - t) < 60000);
  if (exact) {
    phaseKey = exact.type;
    phase = PHASE_META.find((p) => p.key === phaseKey);
  }

  const previousNewMoon = [...events].reverse().find((event) => event.type === 'neumond' && event.date <= date);

  return {
    date,
    phaseKey,
    phase,
    illumination: fraction * 100,
    waxing,
    ageDays: previousNewMoon ? (t - previousNewMoon.date.getTime()) / MS_PER_DAY : null,
    cycleFraction,
    previous: prev,
    next,
    events,
  };
}

/** Die nächsten n Hauptphasen ab einem Zeitpunkt. */
export function nextPhases(date = new Date(), count = 4) {
  const span = new Date(date.getTime() + 80 * MS_PER_DAY);
  return principalPhases(date, span).slice(0, count);
}

/**
 * Kalendertage eines Monats mit Phasenlage, gerechnet für 12:00 Uhr Ortszeit.
 * Der Stichtagswert ist bewusst als „Mittagswert" dokumentiert: an Tagen mit
 * Phasenwechsel steht der Wechsel zusätzlich als Ereignis in `events`.
 */
export function monthDays(year, month, timeZone = DEFAULT_TIME_ZONE, todayKey = null) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // Montag = 0
  const days = [];
  const monthStart = zonedTimeToUtc({ year, month, day: 1 }, timeZone);
  const monthEnd = zonedTimeToUtc(
    month === 12 ? { year: year + 1, month: 1, day: 1 } : { year, month: month + 1, day: 1 },
    timeZone
  );
  const events = principalPhases(monthStart, monthEnd);

  for (let day = 1; day <= daysInMonth; day++) {
    const noon = zonedTimeToUtc({ year, month, day, hour: 12 }, timeZone);
    const state = getState(noon);
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({
      day,
      key,
      weekdayIndex: (firstWeekday + day - 1) % 7,
      isToday: todayKey === key,
      phaseKey: state.phaseKey,
      phase: state.phase,
      illumination: state.illumination,
      waxing: state.waxing,
      events: events
        .filter((event) => localDateKey(event.date, timeZone) === key)
        .map((event) => ({ type: event.type, date: event.date })),
    });
  }

  return { year, month, firstWeekday, daysInMonth, days, events };
}

/** Nächstes Hauptphasen-Ereignis ab jetzt. */
export function nextEvent(date = new Date()) {
  const span = new Date(date.getTime() + 40 * MS_PER_DAY);
  return principalPhases(date, span)[0] || null;
}

/** Deutsche Bezeichnung einer Phasenart. */
export const EVENT_LABELS = {
  neumond: 'Neumond',
  'erstes-viertel': 'Erstes Viertel',
  vollmond: 'Vollmond',
  'letztes-viertel': 'Letztes Viertel',
};

function icsEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsUtcStamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * iCalendar-Datei mit allen Hauptphasen der nächsten `months` Monate.
 * Zeiten stehen in UTC (Z) — dadurch ist keine VTIMEZONE nötig und jeder
 * Kalender zeigt den Termin in seiner eigenen Zeitzone korrekt an.
 */
export function buildIcs({ from = new Date(), months = 12, timeZone = DEFAULT_TIME_ZONE } = {}) {
  const end = new Date(from.getTime());
  end.setUTCMonth(end.getUTCMonth() + months);
  const events = principalPhases(from, end);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Esoterik-Welt//Mondphasen//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mondphasen (Hauptphasen)',
    `X-WR-TIMEZONE:${timeZone}`,
    `X-WR-CALDESC:${icsEscape('Zeiten der vier Hauptphasen, berechnet nach Meeus Kap. 49; Genauigkeit ±1 Minute.')}`,
  ];
  for (const event of events) {
    const label = EVENT_LABELS[event.type];
    const stamp = icsUtcStamp(event.date);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${stamp}-${event.type}@esoterik-welt`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${stamp}`,
      `DTEND:${icsUtcStamp(new Date(event.date.getTime() + 15 * 60000))}`,
      `SUMMARY:${icsEscape(label)}`,
      `DESCRIPTION:${icsEscape(`Hauptphase laut Berechnung (Meeus Kap. 49, ΔT-korrigiert). Ortszeit: ${formatTime(event.date, timeZone)} ${timeZoneAbbreviation(event.date, timeZone)}.`)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
