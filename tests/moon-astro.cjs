// Berechnungstests Mond — Referenz-Fixtures von USNO und JPL Horizons.
//
// Die Fixtures sind mit scripts/build-moon-fixtures.cjs aus den gesicherten
// Rohantworten in evidence/t_f7b2af0a-moon/sources/ erzeugt. Kein Testwert ist
// hier von Hand eingetragen: alles stammt aus einer der beiden Quellen oder ist
// eine Eigenschaft der Berechnung (Ordnung, Mittelwert, Zeitzonenlogik).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const phaseFixture = JSON.parse(
  fs.readFileSync(path.join(root, 'tests/fixtures/moon/phases-usno-2024-2027.json'), 'utf8')
);
const illuminationFixture = JSON.parse(
  fs.readFileSync(path.join(root, 'tests/fixtures/moon/illumination-horizons-2025-2026.json'), 'utf8')
);

let astro;
test.before(async () => {
  astro = await import(pathToFileURL(path.join(root, 'data/moon-astro.mjs')).href);
});

test('Fixture-Dateien tragen ihre Herkunft', () => {
  assert.match(phaseFixture.source, /aa\.usno\.navy\.mil/);
  assert.match(illuminationFixture.source, /ssd\.jpl\.nasa\.gov/);
  assert.equal(phaseFixture.entries.length, 192);
  assert.ok(illuminationFixture.entries.length >= 700);
});

test('alle 192 Hauptphasen 2024–2027 liegen innerhalb 60 s der USNO-Zeit', () => {
  const deviations = [];
  for (const entry of phaseFixture.entries) {
    const reference = new Date(entry.utc);
    const around = astro.principalPhases(
      new Date(reference.getTime() - 2 * 86400000),
      new Date(reference.getTime() + 2 * 86400000)
    );
    const match = around.find((event) => event.type === entry.type);
    assert.ok(match, `keine ${entry.type}-Phase nahe ${entry.utc}`);
    const seconds = Math.abs(match.date.getTime() - reference.getTime()) / 1000;
    deviations.push({ utc: entry.utc, type: entry.type, seconds });
    assert.ok(
      seconds <= 60,
      `${entry.type} ${entry.utc}: Abweichung ${seconds.toFixed(1)} s > 60 s (berechnet ${match.date.toISOString()})`
    );
  }
  const max = Math.max(...deviations.map((d) => d.seconds));
  assert.ok(max <= 60, `Maximalabweichung ${max.toFixed(1)} s`);
});

test('Beleuchtungsgrad weicht höchstens 1 Prozentpunkt von JPL Horizons ab', () => {
  let max = 0;
  let worst = null;
  for (const entry of illuminationFixture.entries) {
    const computed = astro.illuminationAt(new Date(entry.utc)).fraction * 100;
    const delta = Math.abs(computed - entry.illuminatedPercent);
    if (delta > max) {
      max = delta;
      worst = { utc: entry.utc, expected: entry.illuminatedPercent, computed: Number(computed.toFixed(2)) };
    }
    assert.ok(delta <= 1, `${entry.utc}: berechnet ${computed.toFixed(2)} %, Referenz ${entry.illuminatedPercent} %`);
  }
  assert.ok(max <= 0.5, `Erwartet ≤ 0,5 Prozentpunkte, gemessen ${max.toFixed(2)} (${JSON.stringify(worst)})`);
});

test('Phasenfolge ist streng aufsteigend und hält die Viertel-Abstände ein', () => {
  const events = astro.principalPhases(new Date('2025-12-01T00:00:00Z'), new Date('2027-02-01T00:00:00Z'));
  assert.ok(events.length >= 56, `zu wenige Ereignisse: ${events.length}`);
  for (let i = 1; i < events.length; i++) {
    assert.ok(
      events[i].date > events[i - 1].date,
      `Reihenfolge verletzt: ${events[i - 1].type} ${events[i - 1].date.toISOString()} -> ${events[i].type}`
    );
    const days = (events[i].date - events[i - 1].date) / 86400000;
    assert.ok(days > 5.5 && days < 9.5, `Viertelabstand ${days.toFixed(2)} Tage unplausibel`);
  }
});

test('Jahresgrenze: Dezember 2025 geht ohne Lücke in Januar 2026 über', () => {
  const events = astro.principalPhases(new Date('2025-12-01T00:00:00Z'), new Date('2026-02-01T00:00:00Z'));
  const window = events.filter(
    (event) => event.date >= new Date('2025-12-20T00:00:00Z') && event.date <= new Date('2026-01-12T00:00:00Z')
  );
  assert.deepEqual(
    window.map((event) => event.type),
    ['neumond', 'erstes-viertel', 'vollmond', 'letztes-viertel']
  );
  // Der darauf folgende Neumond (18.01.2026, 19:52 UTC) muss der nächste sein.
  const januaryNewMoon = events.find(
    (event) => event.type === 'neumond' && event.date.getUTCMonth() === 0 && event.date.getUTCDate() === 18
  );
  assert.ok(januaryNewMoon, 'Neumond am 18.01.2026 fehlt');
  assert.equal(astro.localDateKey(januaryNewMoon.date, 'Europe/Berlin'), '2026-01-18');
  // Anzeige auf die Minute; die Rechnung liegt ≤ 1 Minute neben dem USNO-Minutenwert.
  const minutes =
    Number(astro.formatTime(januaryNewMoon.date, 'Europe/Berlin').split(':')[0]) * 60 +
    Number(astro.formatTime(januaryNewMoon.date, 'Europe/Berlin').split(':')[1]);
  assert.ok(
    Math.abs(minutes - (20 * 60 + 52)) <= 1,
    `angezeigt ${astro.formatTime(januaryNewMoon.date, 'Europe/Berlin')}`
  );
});

test('Mittlerer synodischer Monat aus der eigenen Berechnung liegt bei 29,53 Tagen', () => {
  const newMoons = astro
    .principalPhases(new Date('2024-01-01T00:00:00Z'), new Date('2027-01-01T00:00:00Z'))
    .filter((event) => event.type === 'neumond');
  const mean = (newMoons[newMoons.length - 1].date - newMoons[0].date) / 86400000 / (newMoons.length - 1);
  // Einzelne Lunationen schwanken um ±0,3 Tage (Ellipsenbahn); auch der Mittelwert
  // über wenige Jahre weicht deshalb leicht vom Langzeitmittel 29,530588853 ab.
  assert.ok(Math.abs(mean - 29.530588853) < 0.05, `Mittel ${mean.toFixed(4)} Tage`);
});

test('Zeitzone Europe/Berlin: DST-Wechsel wird korrekt umgesetzt', () => {
  // Sommerzeit beginnt am 29.03.2026 um 02:00 MEZ -> 03:00 MESZ
  assert.equal(
    astro.zonedTimeToUtc({ year: 2026, month: 3, day: 29, hour: 1, minute: 30 }, 'Europe/Berlin').toISOString(),
    '2026-03-29T00:30:00.000Z'
  );
  assert.equal(
    astro.zonedTimeToUtc({ year: 2026, month: 3, day: 29, hour: 3, minute: 30 }, 'Europe/Berlin').toISOString(),
    '2026-03-29T01:30:00.000Z'
  );
  // Winterzeit beginnt am 25.10.2026 um 03:00 MESZ -> 02:00 MEZ
  assert.equal(
    astro.zonedTimeToUtc({ year: 2026, month: 10, day: 25, hour: 1, minute: 30 }, 'Europe/Berlin').toISOString(),
    '2026-10-24T23:30:00.000Z'
  );
  assert.equal(
    astro.zonedTimeToUtc({ year: 2026, month: 10, day: 25, hour: 2, minute: 30 }, 'Europe/Berlin').toISOString(),
    '2026-10-25T01:30:00.000Z'
  );
  assert.equal(astro.timeZoneAbbreviation(new Date('2026-03-28T12:00:00Z'), 'Europe/Berlin'), 'MEZ');
  assert.equal(astro.timeZoneAbbreviation(new Date('2026-04-02T12:00:00Z'), 'Europe/Berlin'), 'MESZ');
});

test('Tagesgrenze: Vollmond am 29.06.2026 23:56 UTC ist in Berlin der 30. Juni', () => {
  const reference = new Date('2026-06-29T23:56:37.103Z');
  assert.notEqual(astro.localDateKey(reference, 'Europe/Berlin'), reference.toISOString().slice(0, 10));
  assert.equal(astro.localDateKey(reference, 'Europe/Berlin'), '2026-06-30');
  assert.equal(astro.formatTime(reference, 'Europe/Berlin'), '01:56');
});

test('Monatsraster November 2026: Wochentage, Phasenvielfalt und Ereignisse', () => {
  const month = astro.monthDays(2026, 11, 'Europe/Berlin', '2026-11-02');
  assert.equal(month.daysInMonth, 30);
  // 1. November 2026 ist ein Sonntag: 6 Leerzellen vor der ersten Zelle (Mo = 0).
  assert.equal(month.firstWeekday, 6);
  assert.equal(month.days.length, 30);
  assert.deepEqual(
    month.events.map((event) => event.type),
    ['letztes-viertel', 'neumond', 'erstes-viertel', 'vollmond']
  );
  assert.equal(month.days.filter((day) => day.isToday).length, 1);
  assert.equal(month.days.find((day) => day.isToday).key, '2026-11-02');

  const distinct = new Set(month.days.map((day) => day.phaseKey));
  assert.ok(distinct.size >= 5, `nur ${distinct.size} verschiedene Phasen im Monat`);
});

test('Regression: kein Tag mit hoher Beleuchtung wird als Neumond gelabelt', () => {
  for (const month of [
    [2026, 11],
    [2026, 6],
    [2025, 12],
    [2027, 1],
  ]) {
    const raster = astro.monthDays(month[0], month[1], 'Europe/Berlin', null);
    for (const day of raster.days) {
      if (day.illumination > 5 && day.phaseKey === 'neumond') {
        assert.fail(`${day.key}: Neumond bei ${day.illumination.toFixed(1)} % Beleuchtung`);
      }
      if (day.illumination < 95 && day.phaseKey === 'vollmond' && !day.events.some((e) => e.type === 'vollmond')) {
        assert.fail(`${day.key}: Vollmond bei nur ${day.illumination.toFixed(1)} %`);
      }
    }
  }
});

test('Zustand am 02.11.2026 02:15 MEZ stimmt mit Kalender und nächstem Ereignis überein', () => {
  const state = astro.getState(new Date('2026-11-02T01:15:00Z'));
  // 48 % und wenige Stunden nach dem exakten Viertel: der Name kommt aus dem
  // Beleuchtungsband (48–52 %), nicht aus einem gleich langen Zyklusabschnitt.
  assert.equal(state.phaseKey, 'letztes-viertel');
  assert.equal(state.waxing, false);
  assert.ok(Math.abs(state.illumination - 48) < 1, `Beleuchtung ${state.illumination.toFixed(2)}`);
  assert.equal(state.previous.type, 'letztes-viertel');
  assert.equal(astro.formatTime(state.previous.date, 'Europe/Berlin'), '21:28');
  assert.equal(state.next.type, 'neumond');
  assert.equal(astro.localDateKey(state.next.date, 'Europe/Berlin'), '2026-11-09');
  assert.equal(astro.formatTime(state.next.date, 'Europe/Berlin'), '08:01');
  assert.ok(Math.abs(state.ageDays - 22.4) < 0.3, `Mondalter ${state.ageDays}`);
});

test('Phasenname folgt dem Beleuchtungsband und widerspricht der Prozentzahl nie', () => {
  const expectations = [
    [0.5, true, 'neumond'],
    [9, true, 'zunehmende-sichel'],
    [30, true, 'zunehmende-sichel'],
    [50, true, 'erstes-viertel'],
    [70, true, 'zunehmender-mond'],
    [99, true, 'vollmond'],
    [70, false, 'abnehmender-mond'],
    [50, false, 'letztes-viertel'],
    [9, false, 'abnehmende-sichel'],
  ];
  for (const [k, waxing, expected] of expectations) {
    assert.equal(astro.phaseKeyFor(k, waxing), expected, `${k} % waxing=${waxing}`);
  }
  // Über einen ganzen Monat darf kein Tageswert seinen eigenen Namen widerlegen.
  const raster = astro.monthDays(2026, 11, 'Europe/Berlin', null);
  for (const day of raster.days) {
    if (day.phaseKey === 'neumond') assert.ok(day.illumination < 2.5, `${day.key}: Neumond bei ${day.illumination}`);
    if (day.phaseKey === 'vollmond') assert.ok(day.illumination > 97.5, `${day.key}: Vollmond bei ${day.illumination}`);
    if (day.phaseKey === 'erstes-viertel' || day.phaseKey === 'letztes-viertel') {
      assert.ok(day.illumination >= 44.5 && day.illumination <= 55.5, `${day.key}: Viertel bei ${day.illumination}`);
    }
  }
});

test('Kalendertag-Differenz: 23:30 → 00:30 ist ein Tag, nicht null', () => {
  const at = (iso) => new Date(iso);
  // 16.11.2026 23:30 MEZ -> 17.11.2026 00:30 MEZ: eine Stunde, aber ein Tag.
  assert.equal(astro.calendarDayDifference(at('2026-11-16T22:30:00Z'), at('2026-11-16T23:30:00Z')), 1);
  // Rückwärts: Ereignis am 01.11. 21:28 MEZ, "jetzt" ist der 02.11. 02:45 MEZ.
  assert.equal(astro.calendarDayDifference(at('2026-11-02T01:45:00Z'), at('2026-11-01T20:28:00Z')), -1);
  // Gleicher Kalendertag trotz knapp 23 Stunden Abstand.
  assert.equal(astro.calendarDayDifference(at('2026-11-01T23:05:00Z'), at('2026-11-02T22:55:00Z')), 0);
  // DST-Ende 25.10.2026: 24.10. 23:30 MESZ -> 25.10. 02:30 MEZ (25-Stunden-Tag).
  assert.equal(astro.calendarDayDifference(at('2026-10-24T21:30:00Z'), at('2026-10-25T01:30:00Z')), 1);
  // Jahresgrenze: 31.12.2026 23:30 MEZ -> 01.01.2027 00:30 MEZ.
  assert.equal(astro.calendarDayDifference(at('2026-12-31T22:30:00Z'), at('2026-12-31T23:30:00Z')), 1);
  // An echten Phasenzeiten: das Letzte Viertel vom 01.11. 21:28 MEZ liegt am
  // 02.11. einen Kalendertag zurück (vorher stand dort fälschlich "heute").
  const state = astro.getState(at('2026-11-02T01:45:00Z'));
  assert.equal(astro.calendarDayDifference(at('2026-11-02T01:45:00Z'), state.previous.date), -1);
  // 16.11. 23:30 MEZ -> Erstes Viertel am 17.11. 12:47 MEZ ist "morgen";
  // 17.11. 00:30 MEZ ist dasselbe Ereignis "heute" (vorher fälschlich "morgen").
  const beforeMidnight = astro.getState(at('2026-11-16T22:30:00Z'));
  const afterMidnight = astro.getState(at('2026-11-16T23:30:00Z'));
  assert.equal(astro.calendarDayDifference(at('2026-11-16T22:30:00Z'), beforeMidnight.next.date), 1);
  assert.equal(astro.calendarDayDifference(at('2026-11-16T23:30:00Z'), afterMidnight.next.date), 0);
  // Und ab dem 17.11. 23:30 MEZ ist dasselbe Ereignis "heute", nicht "gestern".
  const sameDay = astro.getState(at('2026-11-17T22:30:00Z'));
  assert.equal(astro.calendarDayDifference(at('2026-11-17T22:30:00Z'), sameDay.previous.date), 0);
});

test('iCal-Export: 49 Termine, CRLF, UTC-Zeitstempel, eindeutige UIDs', () => {
  const ics = astro.buildIcs({ from: new Date('2026-11-02T01:15:00Z'), months: 12 });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
  assert.ok(!ics.includes('\n\n'), 'keine Leerzeilen zwischen den Zeilen');
  const events = (ics.match(/BEGIN:VEVENT/g) || []).length;
  assert.equal(events, 49);
  const uids = new Set([...ics.matchAll(/^UID:(.+)$/gm)].map((match) => match[1].trim()));
  assert.equal(uids.size, events);
  assert.ok(/^DTSTART:\d{8}T\d{6}Z$/m.test(ics), 'DTSTART in UTC');
  assert.ok(ics.includes('PRODID:-//Esoterik-Welt//Mondphasen//DE'));
  for (const line of ics.split('\r\n')) {
    if (line.startsWith('SUMMARY:')) assert.ok(!line.includes(','), `Komma nicht escaped: ${line}`);
  }
});
