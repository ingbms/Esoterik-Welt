// ES-Modul: Mondphasen (synodischer Monat = 29.53059 Tage, Referenz: Neumond 2000-01-06 18:14 UTC)
const SYNODIC = 29.53059;
const REF_NEWMOON = Date.UTC(2000, 0, 6, 18, 14);

const PHASE_NAMES = [
  { key: 'neumond', label: 'Neumond', ritualCategory: 'Neumond' },
  { key: 'zunehmend', label: 'Zunehmender Mond', ritualCategory: 'Zunehmend' },
  { key: 'erstes_viertel', label: 'Erstes Viertel', ritualCategory: 'Zunehmend' },
  { key: 'zunehmend_gibb', label: 'Zunehmender Mond (Gibbous)', ritualCategory: 'Zunehmend' },
  { key: 'vollmond', label: 'Vollmond', ritualCategory: 'Vollmond' },
  { key: 'abnehmend_gibb', label: 'Abnehmender Mond (Gibbous)', ritualCategory: 'Abnehmend' },
  { key: 'letztes_viertel', label: 'Letztes Viertel', ritualCategory: 'Abnehmend' },
  { key: 'abnehmend', label: 'Abnehmender Mond', ritualCategory: 'Abnehmend' },
];

function daysSinceRef(date) {
  const d = date instanceof Date ? date : new Date(date);
  return (d.getTime() - REF_NEWMOON) / (1000 * 60 * 60 * 24);
}

export function getPhaseForDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const days = daysSinceRef(d);
  const cycleDay = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const pct = cycleDay / SYNODIC;
  let idx;
  if (pct < 0.0625) idx = 0;
  else if (pct < 0.1875) idx = 1;
  else if (pct < 0.3125) idx = 2;
  else if (pct < 0.4375) idx = 3;
  else if (pct < 0.5625) idx = 4;
  else if (pct < 0.6875) idx = 5;
  else if (pct < 0.8125) idx = 6;
  else idx = 7;
  const info = PHASE_NAMES[idx];
  const illumination = Math.round(pct < 0.5 ? pct * 2 * 100 : (1 - pct) * 2 * 100);
  return {
    phase: info.key,
    label: info.label,
    pct: Math.round(pct * 100),
    date: d.toISOString().split('T')[0],
    illumination,
    category: info.ritualCategory,
  };
}

export function getCurrentPhase() {
  return getPhaseForDate(new Date());
}

export function getMonthCalendar(year, month) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startDay = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const calendar = [];
  for (let p = 0; p < startDay; p++) calendar.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(year, month - 1, d));
    calendar.push({ day: d, ...getPhaseForDate(dt) });
  }
  while (calendar.length < 42) calendar.push(null);
  return calendar;
}

export function getNextEvent(fromDate = new Date()) {
  const d = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
  const days = daysSinceRef(d);
  const cycleDay = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const toNeumond = (SYNODIC - cycleDay) % SYNODIC;
  const toVollmond = (0.5 * SYNODIC - cycleDay + SYNODIC) % SYNODIC;
  const nextNeumond = new Date(d.getTime() + toNeumond * 86400000);
  const nextVollmond = new Date(d.getTime() + toVollmond * 86400000);
  if (toNeumond <= toVollmond) {
    return { type: 'neumond', date: nextNeumond, days: Math.round(toNeumond) };
  }
  return { type: 'vollmond', date: nextVollmond, days: Math.round(toVollmond) };
}

export function getDaysUntil(fromDate = new Date()) {
  return getNextEvent(fromDate).days;
}

export { PHASE_NAMES, SYNODIC };
