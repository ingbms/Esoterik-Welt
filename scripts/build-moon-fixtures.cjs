// Erzeugt die Prüf-Fixtures für tests/moon-astro.cjs aus den gesicherten
// Rohquellen in evidence/t_f7b2af0a-moon/sources/ (USNO-API bzw. JPL Horizons).
//
// Die Umrechnung ist bewusst rein mechanisch (JSON-Felder -> ISO-Zeitstempel),
// damit die Fixtures ohne eigene Astronomie-Logik nachvollziehbar bleiben.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sources = path.join(root, 'evidence', 't_f7b2af0a-moon', 'sources');
const target = path.join(root, 'tests', 'fixtures', 'moon');

const TYPE_MAP = {
  'New Moon': 'neumond',
  'First Quarter': 'erstes-viertel',
  'Full Moon': 'vollmond',
  'Last Quarter': 'letztes-viertel',
};

const phaseFixtures = [];
for (const year of [2024, 2025, 2026, 2027]) {
  const raw = JSON.parse(fs.readFileSync(path.join(sources, `usno-phases-${year}.json`), 'utf8'));
  for (const entry of raw.phasedata) {
    const type = TYPE_MAP[entry.phase];
    if (!type) throw new Error('Unbekannte Phase: ' + entry.phase);
    const [hh, mm] = entry.time.split(':').map(Number);
    phaseFixtures.push({
      type,
      utc: new Date(Date.UTC(entry.year, entry.month - 1, entry.day, hh, mm, 0)).toISOString(),
      sourceTime: `${entry.year}-${String(entry.month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')} ${entry.time} UT`,
    });
  }
}

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const illuminationFixtures = [];
for (const year of [2025, 2026]) {
  const text = fs.readFileSync(path.join(sources, `horizons-illu-${year}.txt`), 'utf8');
  const block = text.split('$$SOE')[1]?.split('$$EOE')[0] ?? '';
  for (const line of block.split('\n')) {
    const match = /^\s*(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})\s+([\d.]+)\s+([\d.]+)\s*$/.exec(line);
    if (!match) continue;
    illuminationFixtures.push({
      utc: new Date(
        Date.UTC(Number(match[1]), MONTHS[match[2]], Number(match[3]), Number(match[4]), Number(match[5]))
      ).toISOString(),
      illuminatedPercent: Number(match[6]),
    });
  }
}

fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(
  path.join(target, 'phases-usno-2024-2027.json'),
  JSON.stringify(
    {
      description:
        'Zeiten der vier Hauptphasen in UTC, übernommen aus der USNO-API (Astronomical Applications Department, API 4.0.1). Minutenwerte.',
      source: 'https://aa.usno.navy.mil/api/moon/phases/date (date=<Jahr>-01-01&nump=48)',
      retrieved: '2026-11-02',
      raw: 'evidence/t_f7b2af0a-moon/sources/usno-phases-<Jahr>.json',
      entries: phaseFixtures,
    },
    null,
    2
  ) + '\n'
);
fs.writeFileSync(
  path.join(target, 'illumination-horizons-2025-2026.json'),
  JSON.stringify(
    {
      description:
        'Beleuchtungsgrad des Mondes (Prozent) für 00:00 UT, ausgewertet mit NASA/JPL Horizons (Ziel 301, geozentrisch, Größe 10).',
      source: 'https://ssd.jpl.nasa.gov/api/horizons.api (COMMAND=301, CENTER=500@399, QUANTITIES=10)',
      retrieved: '2026-11-02',
      raw: 'evidence/t_f7b2af0a-moon/sources/horizons-illu-<Jahr>.txt',
      entries: illuminationFixtures,
    },
    null,
    2
  ) + '\n'
);

console.log(
  `Fixtures geschrieben: ${phaseFixtures.length} Phasenzeiten, ${illuminationFixtures.length} Beleuchtungswerte.`
);
if (phaseFixtures.length !== 192) throw new Error('Erwartet: 192 Phasenzeiten');
if (illuminationFixtures.length < 700) throw new Error('Zu wenige Beleuchtungswerte');
