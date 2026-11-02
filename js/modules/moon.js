// Mondbereich — Anzeige und Bedienung.
//
// Alle Zahlen kommen aus data/moon-astro.mjs (Meeus Kap. 48/49, gegen USNO und
// JPL Horizons geprüft). Dieses Modul rendert nur: Heute-Überblick, Zeitachse,
// Monatskalender mit Tagesdetails, die acht Phasen, Deutungstexte und Quellen.
// Es rechnet nichts selbst nach und erfindet keine Werte.
//
// Der Rechenbaustein wird bewusst dynamisch geladen (nicht per static import):
// Scheitert er — blockierte Datei, alter Cache, defekter Deploy —, degradiert
// nur dieser Bereich sichtbar (siehe renderFailure), statt den gesamten
// SPA-Einstieg mitzureißen. Die reinen Texte (js/data/moon.js) bleiben statisch.

import { DEEP_DIVE, PHASE_CONTENT, PHASE_ORDER, SOURCES, moonRituals } from '../data/moon.js';

// Wird in init() aus dem dynamischen Import gesetzt.
let api = null;

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
// Offen dokumentierte Startannahme (siehe docs/mond-t_f7b2af0a.md).
const TZ = 'Europe/Berlin';
const MIN_MONTH = { year: 2020, month: 1 };
const MAX_MONTH = { year: 2050, month: 12 };

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const percent = (value) => Math.round(value);

/**
 * Pfad der beleuchteten Fläche mit echter Terminator-Geometrie.
 * k = beleuchteter Anteil; der Terminator ist eine Ellipse mit der
 * Halbachse r·|1 − 2k|. Grundform: Licht rechts (zunehmend). Für den
 * abnehmenden Mond wird derselbe Pfad gespiegelt — deshalb kommt das
 * Spiegel-Flag getrennt zurück und landet als SVG-transform, nicht im
 * d-Attribut.
 */
function moonPath(illumination, waxing, { cx = 50, cy = 50, r = 45 } = {}) {
  const k = Math.min(1, Math.max(0, illumination / 100));
  if (k <= 0.004) return { d: '', mirror: false };
  if (k >= 0.996) {
    return {
      d: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`,
      mirror: false,
    };
  }
  // Der Terminator ist eine Ellipse mit der Halbachse r·|1 − 2k|. Bei exakt
  // 50 % ist sie 0: der Bogen entartet zur Geraden (SVG behandelt einen Arc mit
  // Radius 0 als Liniensegment), die Fläche ist dann genau die halbe Scheibe.
  // Früher klemmte hier ein Mindestradius von 0,6 px; das zeichnete am exakten
  // Viertel 46,5 % statt 50 % (Review-Hinweis N1).
  const rx = r * Math.abs(1 - 2 * k);
  const sweep = k < 0.5 ? 0 : 1;
  return {
    d: `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx.toFixed(2)} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`,
    mirror: !waxing,
  };
}

const mirrorTransform = (boxWidth) => `translate(${boxWidth} 0) scale(-1 1)`;

function moonDisc(illumination, waxing, { size = 160, withCraters = true, gradientId = 'moonLit' } = {}) {
  const { d, mirror } = moonPath(illumination, waxing);
  const transform = mirror ? ` transform="${mirrorTransform(100)}"` : '';
  const craters = withCraters
    ? `<g clip-path="url(#${gradientId}-clip)" opacity="0.22" fill="#4c5654">
         <circle cx="38" cy="36" r="6.5"/><circle cx="60" cy="52" r="9"/><circle cx="44" cy="66" r="4.5"/>
         <circle cx="66" cy="30" r="3.2"/><circle cx="33" cy="55" r="2.6"/>
       </g>`
    : '';
  return `<svg class="moon-svg" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="${gradientId}" cx="38%" cy="34%" r="70%">
        <stop offset="0%" stop-color="#f7f4ea"/><stop offset="62%" stop-color="#ddd8c9"/><stop offset="100%" stop-color="#b3ada0"/>
      </radialGradient>
      <clipPath id="${gradientId}-clip">${mirror ? `<path d="${d}" transform="${mirrorTransform(100)}"/>` : `<path d="${d || 'M 50 5'}"/>`}</clipPath>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#20282a"/>
    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-line-strong)" stroke-width="1.5"/>
    ${d ? `<path d="${d}"${transform} fill="url(#${gradientId})"/>` : ''}
    ${craters}
  </svg>`;
}

/** Kleine geometrische Phasengrafik für Kalenderzellen und Legende. */
function phaseGlyph(illumination, waxing, size = 18) {
  const { d, mirror } = moonPath(illumination, waxing, { cx: 10, cy: 10, r: 8.5 });
  const transform = mirror ? ` transform="${mirrorTransform(20)}"` : '';
  return `<svg class="moon-glyph" viewBox="0 0 20 20" width="${size}" height="${size}" aria-hidden="true" focusable="false">
    <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
    ${d ? `<path d="${d}"${transform} fill="currentColor"/>` : `<circle cx="10" cy="10" r="8.5" fill="currentColor" opacity="0.08"/>`}
  </svg>`;
}

// Relativtag aus Kalendertagen, nicht aus verstrichenen Stunden: sonst steht
// neben „01. November 2026" ein „heute", obwohl dort schon der 2. ist.
function relativeDays(date, now) {
  const days = api.calendarDayDifference(now, date, TZ);
  const abs = Math.abs(days);
  if (abs === 0) return 'heute';
  if (abs === 1) return days > 0 ? 'morgen' : 'gestern';
  return days > 0 ? `in ${abs} Tagen` : `vor ${abs} Tagen`;
}

function eventStamp(date) {
  // Geschütztes Leerzeichen: "21:28 MEZ" soll nie getrennt umbrechen.
  return `${api.formatDateLong(date, TZ)} · ${api.formatTime(date, TZ)}\u00A0${api.timeZoneAbbreviation(date, TZ)}`;
}

function sampleIllumination(key) {
  switch (key) {
    case 'neumond':
      return 0;
    case 'zunehmende-sichel':
      return 22;
    case 'erstes-viertel':
      return 50;
    case 'zunehmender-mond':
      return 78;
    case 'vollmond':
      return 100;
    case 'abnehmender-mond':
      return 78;
    case 'letztes-viertel':
      return 50;
    default:
      return 22;
  }
}

function sampleWaxing(key) {
  return ['neumond', 'zunehmende-sichel', 'erstes-viertel', 'zunehmender-mond'].includes(key);
}

export class MoonModule {
  constructor() {
    this.view = null;
    this.monthData = null;
    this.selectedKey = null;
    this.todayKey = null;
    // Solange true, zieht der Minutentakt den Kalender beim Mitternachtswechsel
    // in den aktuellen Monat; nach Nutzer-Blättern bleibt er stehen.
    this.followToday = true;
    this.timer = null;
    this.els = {};
  }

  async init() {
    this.els = {
      phaseName: document.getElementById('moonPhaseName'),
      illumination: document.getElementById('moonIllumination'),
      age: document.getElementById('moonAge'),
      cyclePos: document.getElementById('moonCyclePos'),
      nextIn: document.getElementById('moonDaysUntil'),
      nextStamp: document.getElementById('moonNextPhase'),
      stamp: document.getElementById('moonNowStamp'),
      svg: document.getElementById('moonSvg'),
      caption: document.getElementById('moonFigureCaption'),
      timeline: document.getElementById('moonTimeline'),
      calendar: document.getElementById('moonCalendar'),
      calendarLabel: document.getElementById('moonCalendarLabel'),
      dayDetail: document.getElementById('moonDayDetail'),
      legend: document.getElementById('moonLegend'),
      phaseGrid: document.getElementById('moonPhaseGrid'),
      deepDive: document.getElementById('moonDeepDive'),
      cultureNow: document.getElementById('moonCultureNow'),
      cultureDive: document.getElementById('moonCultureDive'),
      rituals: document.getElementById('moonRituals'),
      sources: document.getElementById('moonSourceList'),
      icalBtn: document.getElementById('icalBtn'),
      icalStatus: document.getElementById('icalStatus'),
      error: document.getElementById('moonError'),
      tzLabel: document.getElementById('moonTzLabel'),
    };

    try {
      // Texte zuerst: sie brauchen keine Rechnung und bleiben auch dann stehen,
      // wenn der Rechenbaustein nicht geladen werden kann.
      this.renderStaticContent();
      api = await import('../../data/moon-astro.mjs');
      const now = new Date();
      const parts = api.zonedParts(now, TZ);
      this.view = { year: parts.year, month: parts.month };
      this.selectedKey = api.localDateKey(now, TZ);
      this.todayKey = this.selectedKey;
      this.renderNow(now);
      this.renderCalendar();
      this.bindControls();
      this.setupIcal();
      this.startClock();
    } catch (error) {
      this.renderFailure(error);
    }
  }

  // --- Heute-Überblick --------------------------------------------------
  renderNow(now = new Date()) {
    const state = api.getState(now);
    const content = PHASE_CONTENT[state.phaseKey];
    const tzAbbr = api.timeZoneAbbreviation(now, TZ);
    const next = state.next;

    if (this.els.stamp) {
      this.els.stamp.textContent = `${api.formatWeekdayDate(now, TZ)} · ${api.formatTime(now, TZ)} ${tzAbbr} · ${TZ}`;
    }
    if (this.els.tzLabel) this.els.tzLabel.textContent = `${TZ}, ${tzAbbr}`;

    if (this.els.phaseName) this.els.phaseName.textContent = content ? content.name : state.phaseKey;
    if (this.els.illumination) {
      // „·“ bleibt mit dem folgenden Wort zusammen, damit das Trennzeichen bei
      // 375 px nicht allein am Zeilenende steht (Review-Hinweis N2).
      this.els.illumination.textContent = `${percent(state.illumination)} % beleuchtet ·\u00A0${state.waxing ? 'zunehmend' : 'abnehmend'}`;
    }
    if (this.els.age) {
      this.els.age.textContent =
        state.ageDays === null ? '—' : `${state.ageDays.toFixed(1).replace('.', ',')} Tage seit Neumond`;
    }
    if (this.els.cyclePos && content) {
      this.els.cyclePos.textContent = `${content.sector} · ${Math.round(state.cycleFraction * 100)} % des Zyklus`;
    }

    if (this.els.nextIn) {
      this.els.nextIn.textContent = next ? `${api.EVENT_LABELS[next.type]} ${relativeDays(next.date, now)}` : '—';
    }
    if (this.els.nextStamp) {
      // Der Abschnittsname (z. B. „Letztes Viertel") gilt für rund 3,7 Tage.
      // Deshalb steht daneben, wann der exakte Phasenpunkt war und wann der
      // nächste kommt — sonst wirkt „45 % beleuchtet" wie ein Widerspruch.
      const previous = state.previous;
      const parts = [];
      if (previous) {
        parts.push(
          `<span class="moon-next-prev">Zuletzt: ${escapeHtml(api.EVENT_LABELS[previous.type])} am ${escapeHtml(eventStamp(previous.date))} · ${escapeHtml(relativeDays(previous.date, now))}</span>`
        );
      }
      if (next) {
        parts.push(
          `<span class="moon-next-main">Nächstes: ${escapeHtml(api.EVENT_LABELS[next.type])} am ${escapeHtml(eventStamp(next.date))} · ${escapeHtml(relativeDays(next.date, now))}</span>`
        );
      }
      this.els.nextStamp.innerHTML = parts.join('');
    }

    if (this.els.svg) {
      const label = `${content ? content.name : state.phaseKey}, ${percent(state.illumination)} Prozent beleuchtet, ${state.waxing ? 'zunehmend, Licht von rechts' : 'abnehmend, Licht von links'}`;
      this.els.svg.innerHTML = moonDisc(state.illumination, state.waxing, { size: 176 });
      const svg = this.els.svg.querySelector('svg');
      if (svg) {
        svg.removeAttribute('aria-hidden');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', `Mondphase: ${label}`);
      }
    }
    if (this.els.caption) {
      this.els.caption.textContent = `Nordhalbkugel-Darstellung · ${state.waxing ? 'Licht von rechts' : 'Licht von links'}`;
    }

    this.renderTimeline(now, state);
    this.renderRituals(state);
    if (this.els.cultureNow && content) {
      this.els.cultureNow.textContent = content.culture;
    }
  }

  renderTimeline(now, state) {
    const list = this.els.timeline;
    if (!list) return;

    const past = state.events.filter((event) => event.date <= now).slice(-2);
    const upcoming = api.nextPhases(now, 3);
    const items = [
      ...past.map((event) => ({ event, past: true })),
      ...upcoming.map((event) => ({ event, past: false })),
    ];

    list.innerHTML = items
      .map(({ event, past }) => {
        const isNext = !past && event === upcoming[0];
        const glyphIllumination = event.type === 'vollmond' ? 100 : event.type === 'neumond' ? 0 : 50;
        const glyphWaxing =
          event.type === 'neumond' || event.type === 'erstes-viertel' || event.type === 'zunehmende-sichel';
        return `<li class="moon-timeline-item${past ? ' is-past' : ''}${isNext ? ' is-next' : ''}">
          <span class="moon-timeline-marker" aria-hidden="true">${phaseGlyph(glyphIllumination, glyphWaxing, 20)}</span>
          <span class="moon-timeline-body">
            <span class="moon-timeline-name">${escapeHtml(api.EVENT_LABELS[event.type])}</span>
            <span class="moon-timeline-when">${escapeHtml(eventStamp(event.date))}</span>
            <span class="moon-timeline-rel">${escapeHtml(relativeDays(event.date, now))}${isNext ? ' · nächste Hauptphase' : ''}</span>
          </span>
        </li>`;
      })
      .join('');
  }

  renderRituals(state) {
    const container = this.els.rituals;
    if (!container) return;
    const ideas = moonRituals[state.phaseKey] || [];
    const content = PHASE_CONTENT[state.phaseKey];
    const cards = ideas
      .map(
        (idea) => `<article class="moon-ritual">
          <h4 class="moon-ritual-title">${escapeHtml(idea.title)}</h4>
          <p class="moon-ritual-text">${escapeHtml(idea.description)}</p>
          <p class="moon-ritual-meta">${escapeHtml(idea.duration)}${idea.items && idea.items.length ? ' · ' + escapeHtml(idea.items.join(', ')) : ''}</p>
        </article>`
      )
      .join('');
    const question = content
      ? `<p class="moon-reflection"><span class="moon-reflection-label">Frage für heute</span>${escapeHtml(content.reflection)}</p>`
      : '';
    container.innerHTML = cards + question;
  }

  // --- Kalender ---------------------------------------------------------
  renderCalendar() {
    const grid = this.els.calendar;
    if (!grid || !this.view) return;
    const { year, month } = this.view;
    const now = new Date();
    const todayKey = api.localDateKey(now, TZ);
    const data = api.monthDays(year, month, TZ, todayKey);
    const withinMonth = (key) => Boolean(key) && data.days.some((day) => day.key === key);
    // Invariante: genau eine Zelle des angezeigten Monats ist ausgewählt und
    // trägt tabindex="0". Liegt die bisherige Auswahl außerhalb (Monatswechsel,
    // Tageswechsel), wird heute gewählt — sonst der Monatserste. Ohne diese
    // Klammer hatte nach dem Blättern keine Zelle mehr Fokus und das Detail
    // zeigte einen Tag, der nirgends markiert war.
    const selectedKey = withinMonth(this.selectedKey)
      ? this.selectedKey
      : withinMonth(todayKey)
        ? todayKey
        : data.days[0].key;
    this.selectedKey = selectedKey;
    this.todayKey = todayKey;

    if (this.els.calendarLabel) {
      this.els.calendarLabel.textContent = `${this.monthName(month)} ${year}`;
    }
    this.monthData = data;

    const head = WEEKDAYS.map(
      (name) => `<div class="moon-calendar-weekday" aria-hidden="true"><span>${name}</span></div>`
    ).join('');

    const blanks = Array.from(
      { length: data.firstWeekday },
      () => '<div class="moon-calendar-blank" aria-hidden="true"></div>'
    ).join('');

    const cells = data.days
      .map((day) => {
        const isSelected = day.key === selectedKey;
        const phaseName = PHASE_CONTENT[day.phaseKey] ? PHASE_CONTENT[day.phaseKey].name : day.phaseKey;
        const eventLabel = day.events.length
          ? ', ' +
            day.events
              .map((event) => {
                const label = api.EVENT_LABELS[event.type];
                return `${label === phaseName ? 'exakt' : label} um ${api.formatTime(event.date, TZ)}`;
              })
              .join(', ')
          : '';
        const label = `${day.day}. ${this.monthName(month)} ${year}: ${phaseName}, ${percent(day.illumination)} Prozent beleuchtet${eventLabel}`;
        const classes = [
          'moon-calendar-day',
          day.isToday ? 'is-today' : '',
          isSelected ? 'is-selected' : '',
          day.events.length ? 'has-event' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `<button type="button" class="${classes}" data-day="${day.key}" aria-pressed="${isSelected}" aria-label="${escapeHtml(label)}" tabindex="${isSelected ? 0 : -1}">
          <span class="moon-cell-number">${day.day}</span>
          <span class="moon-cell-glyph">${phaseGlyph(day.illumination, day.waxing, 20)}</span>
          <span class="moon-cell-meta">${percent(day.illumination)} %</span>
        </button>`;
      })
      .join('');

    grid.innerHTML = head + blanks + cells;
    this.renderLegend();
    this.renderDayDetail(selectedKey);
  }

  monthName(month) {
    return new Intl.DateTimeFormat('de-DE', { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2026, month - 1, 1))
    );
  }

  renderLegend() {
    const legend = this.els.legend;
    if (!legend) return;
    legend.innerHTML = `
      <li class="moon-legend-item"><span class="moon-legend-swatch is-today" aria-hidden="true"></span>heute</li>
      <li class="moon-legend-item"><span class="moon-legend-swatch is-selected" aria-hidden="true"></span>ausgewählt</li>
      <li class="moon-legend-item"><span class="moon-legend-swatch is-event" aria-hidden="true"></span>Hauptphase</li>
      <li class="moon-legend-item"><span class="moon-legend-swatch is-glyph" aria-hidden="true">${phaseGlyph(35, true, 16)}</span>Fläche = Beleuchtungsgrad</li>`;
  }

  renderDayDetail(key) {
    const panel = this.els.dayDetail;
    if (!panel || !this.monthData) return;
    const day = this.monthData.days.find((entry) => entry.key === (key || this.selectedKey));
    if (!day) {
      panel.innerHTML = '<p class="moon-empty">Für diesen Tag liegt keine Berechnung vor.</p>';
      return;
    }
    const content = PHASE_CONTENT[day.phaseKey];
    const dateLabel = api.formatWeekdayDate(
      new Date(
        Date.UTC(Number(day.key.slice(0, 4)), Number(day.key.slice(5, 7)) - 1, Number(day.key.slice(8, 10)), 12)
      ),
      'UTC'
    );
    const events = day.events.length
      ? day.events
          .map(
            (event) =>
              `${api.EVENT_LABELS[event.type]} um ${api.formatTime(event.date, TZ)} ${api.timeZoneAbbreviation(event.date, TZ)}`
          )
          .join(' · ')
      : 'keine Hauptphase an diesem Tag';

    panel.innerHTML = `
      <h3 class="moon-detail-title">${escapeHtml(dateLabel)}</h3>
      <p class="moon-detail-phase">${escapeHtml(content ? content.name : day.phaseKey)} · ${percent(day.illumination)} % beleuchtet ·\u00A0${day.waxing ? 'zunehmend' : 'abnehmend'}</p>
      <p class="moon-detail-event">${escapeHtml(events)}</p>
      ${content ? `<p class="moon-detail-text">${escapeHtml(content.appearance)}</p>` : ''}
      ${content ? `<p class="moon-detail-interp"><span class="moon-mode-label is-inline">Deutung</span>${escapeHtml(content.culture)}</p>` : ''}`;
  }

  selectDay(key, { focus = false } = {}) {
    // Nur Tage des angezeigten Monats: sonst könnte wieder eine Zelle ohne
    // Gegenstück im Raster ausgewählt werden.
    if (!this.monthData || !this.monthData.days.some((day) => day.key === key)) return;
    this.selectedKey = key;
    const grid = this.els.calendar;
    if (!grid) return;
    for (const button of grid.querySelectorAll('button[data-day]')) {
      const isSelected = button.dataset.day === key;
      button.setAttribute('aria-pressed', String(isSelected));
      button.classList.toggle('is-selected', isSelected);
      button.tabIndex = isSelected ? 0 : -1;
      if (isSelected && focus) button.focus();
    }
    this.renderDayDetail(key);
  }

  shiftMonth(delta) {
    if (!this.view) return;
    let { year, month } = this.view;
    month += delta;
    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }
    const beforeMin = year < MIN_MONTH.year || (year === MIN_MONTH.year && month < MIN_MONTH.month);
    const afterMax = year > MAX_MONTH.year || (year === MAX_MONTH.year && month > MAX_MONTH.month);
    if (beforeMin || afterMax) return;
    this.view = { year, month };
    // Geblättert wird vom Nutzer: der Minutentakt folgt ab jetzt nicht mehr
    // automatisch dem aktuellen Monat, sonst springt die Ansicht nach ≤ 60 s
    // zurück (Review-Befund B1).
    this.followToday = false;
    const now = new Date();
    const parts = api.zonedParts(now, TZ);
    // Auswahl ausdrücklich auf den neuen Monat setzen (heute, wenn er ihn
    // enthält, sonst der 1.) statt auf null — B2.
    this.selectedKey =
      parts.year === year && parts.month === month
        ? api.localDateKey(now, TZ)
        : `${year}-${String(month).padStart(2, '0')}-01`;
    this.renderCalendar();
    this.focusFirstDay();
  }

  focusFirstDay() {
    const grid = this.els.calendar;
    if (!grid) return;
    // renderCalendar() hat die Auswahl bereits gesetzt; hier wird nur noch
    // fokussiert, was tabindex="0" trägt.
    const target = grid.querySelector('button[data-day][tabindex="0"]');
    if (target) target.focus();
  }

  goToday() {
    const now = new Date();
    const parts = api.zonedParts(now, TZ);
    this.view = { year: parts.year, month: parts.month };
    this.selectedKey = api.localDateKey(now, TZ);
    this.followToday = true;
    this.renderCalendar();
    this.selectDay(this.selectedKey, { focus: true });
  }

  bindControls() {
    const grid = this.els.calendar;
    if (grid) {
      grid.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-day]');
        if (!button) return;
        this.selectDay(button.dataset.day);
      });
      grid.addEventListener('keydown', (event) => {
        const button = event.target.closest('button[data-day]');
        if (!button) return;
        const buttons = [...grid.querySelectorAll('button[data-day]')];
        const index = buttons.indexOf(button);
        let target = null;
        if (event.key === 'ArrowRight') target = buttons[index + 1];
        else if (event.key === 'ArrowLeft') target = buttons[index - 1];
        else if (event.key === 'ArrowDown') target = buttons[index + 7];
        else if (event.key === 'ArrowUp') target = buttons[index - 7];
        else if (event.key === 'Home') target = buttons[0];
        else if (event.key === 'End') target = buttons[buttons.length - 1];
        if (!target) return;
        event.preventDefault();
        this.selectDay(target.dataset.day, { focus: true });
      });
    }

    const prev = document.getElementById('moonPrevMonth');
    const next = document.getElementById('moonNextMonth');
    const today = document.getElementById('moonTodayBtn');
    if (prev) prev.addEventListener('click', () => this.shiftMonth(-1));
    if (next) next.addEventListener('click', () => this.shiftMonth(1));
    if (today) today.addEventListener('click', () => this.goToday());
  }

  // --- Statische Inhalte ------------------------------------------------
  renderStaticContent() {
    if (this.els.phaseGrid) {
      this.els.phaseGrid.innerHTML = PHASE_ORDER.map((key, index) => {
        const item = PHASE_CONTENT[key];
        return `<article class="moon-phase-card">
          <div class="moon-phase-card-head">
            <span class="moon-phase-figure" aria-hidden="true">${phaseGlyph(sampleIllumination(key), sampleWaxing(key), 34)}</span>
            <div>
              <h3 class="moon-phase-name">${escapeHtml(item.name)}</h3>
              <p class="moon-phase-index">${index + 1} von 8 · ${escapeHtml(item.numbers)}</p>
            </div>
          </div>
          <p class="moon-phase-text">${escapeHtml(item.appearance)}</p>
          <p class="moon-phase-geometry">${escapeHtml(item.geometry)}</p>
          <p class="moon-phase-interp"><span class="moon-mode-label is-inline">Deutung</span>${escapeHtml(item.culture)}</p>
        </article>`;
      }).join('');
    }

    if (this.els.deepDive) {
      this.els.deepDive.innerHTML = ['geometry', 'eclipse']
        .map((key) => {
          const block = DEEP_DIVE[key];
          return `<details class="moon-details">
            <summary>${escapeHtml(block.title)}</summary>
            <div class="moon-details-body">${block.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</div>
          </details>`;
        })
        .join('');
    }

    if (this.els.cultureDive) {
      this.els.cultureDive.innerHTML = ['culture', 'zodiac']
        .map((key) => {
          const block = DEEP_DIVE[key];
          return `<details class="moon-details">
            <summary>${escapeHtml(block.title)}</summary>
            <div class="moon-details-body">${block.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</div>
          </details>`;
        })
        .join('');
    }

    if (this.els.sources) {
      this.els.sources.innerHTML = SOURCES.map(
        (source) => `<li class="moon-source">
          <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>
          <span class="moon-source-note">${escapeHtml(source.note)}</span>
        </li>`
      ).join('');
    }
  }

  // --- iCal -------------------------------------------------------------
  setupIcal() {
    const button = this.els.icalBtn;
    if (!button) return;
    button.addEventListener('click', () => {
      try {
        const now = new Date();
        const ics = api.buildIcs({ from: now, months: 12, timeZone: TZ });
        const count = (ics.match(/BEGIN:VEVENT/g) || []).length;
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mondphasen-${api.zonedParts(now, TZ).year}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (this.els.icalStatus) {
          this.els.icalStatus.textContent = `${count} Termine exportiert — Zeiten in UTC, der Kalender zeigt sie in deiner Zeitzone.`;
        }
      } catch (error) {
        if (this.els.icalStatus) {
          this.els.icalStatus.textContent = 'Export fehlgeschlagen. Bitte Seite neu laden und erneut versuchen.';
        }
        console.error('iCal-Export fehlgeschlagen', error);
      }
    });
  }

  startClock() {
    if (!api) return;
    this.todayKey = api.localDateKey(new Date(), TZ);
    this.timer = window.setInterval(() => {
      try {
        this.syncClock(new Date());
      } catch (error) {
        this.renderFailure(error);
      }
    }, 60000);
  }

  /**
   * Minutentakt: Aktualisiert den Heute-Überblick und — nur beim echten
   * Mitternachtswechsel — den Kalender. Ein vom Nutzer geblätterter Monat
   * bleibt stehen (B1); die Ansicht wandert nur mit, solange sie dem heutigen
   * Monat folgt (`followToday`, gesetzt von goToday(), gelöscht von
   * shiftMonth()).
   */
  syncClock(now) {
    this.renderNow(now);
    const todayKey = api.localDateKey(now, TZ);
    if (todayKey === this.todayKey) return;
    this.todayKey = todayKey;
    if (this.followToday && this.view) {
      const parts = api.zonedParts(now, TZ);
      if (this.view.year !== parts.year || this.view.month !== parts.month) {
        this.view = { year: parts.year, month: parts.month };
        this.selectedKey = todayKey;
      }
    }
    if (!this.view) return;
    // Der Kalender hängt nur über die Heute-Markierung vom Kalendertag ab.
    // Zeigt die Ansicht einen anderen Monat, bleibt er unangetastet — sonst
    // ginge bei jedem Mitternachtswechsel ein Tastaturfokus im Raster verloren.
    const viewPrefix = `${this.view.year}-${String(this.view.month).padStart(2, '0')}`;
    if (!todayKey.startsWith(viewPrefix)) return;
    const grid = this.els.calendar;
    const focusedDay = grid && grid.contains(document.activeElement) ? document.activeElement.dataset.day : null;
    this.renderCalendar();
    // Fokus nach dem Neuaufbau zurückgeben (die Zellen sind neue Knoten).
    if (focusedDay && grid) {
      const target =
        grid.querySelector(`button[data-day="${focusedDay}"]`) || grid.querySelector('button[data-day][tabindex="0"]');
      if (target) target.focus();
    }
  }

  renderFailure(error) {
    console.error('Mondbereich konnte nicht berechnet werden', error);
    if (this.els.error) this.els.error.hidden = false;
    if (this.els.phaseName) this.els.phaseName.textContent = 'Berechnung nicht verfügbar';
    if (this.els.illumination) this.els.illumination.textContent = 'Die Monddaten konnten nicht geladen werden.';
    if (this.els.calendar && !this.els.calendar.children.length) {
      this.els.calendar.innerHTML = '<p class="moon-empty">Der Kalender konnte nicht berechnet werden.</p>';
    }
    if (this.els.rituals && !this.els.rituals.children.length) {
      this.els.rituals.innerHTML = '<p class="moon-empty">Keine Reflexionsideen verfügbar.</p>';
    }
  }

  onShow() {
    if (!api) return;
    try {
      this.syncClock(new Date());
    } catch (error) {
      this.renderFailure(error);
    }
  }
}
