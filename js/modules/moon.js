// Moon Module — an reale Datenquellen angebunden (data/moon-phases.js + js/data/moon.js)
export class MoonModule {
  constructor() {}

  async init() {
    this.mp = await import('../data/moon-phases.js');
    this.data = await import('../data/moon.js');
    this.renderMoonPhase();
    this.renderCalendar();
    this.renderRituals();
    this.setupIcal();
  }

  renderMoonPhase() {
    const current = this.mp.getCurrentPhase ? this.mp.getCurrentPhase() : null;
    const phaseNameEl = document.getElementById('moonPhaseName');
    const illuminationEl = document.getElementById('moonIllumination');
    const zodiacEl = document.getElementById('moonZodiac');
    const nextPhaseEl = document.getElementById('moonDaysUntil');
    const svgContainer = document.getElementById('moonSvg');

    if (current && current.label) {
      if (phaseNameEl) phaseNameEl.textContent = current.label;
      if (illuminationEl) illuminationEl.textContent = 'Beleuchtung: ' + (current.illumination || 0) + '%';
    } else {
      if (phaseNameEl) phaseNameEl.textContent = 'Neumond';
      if (illuminationEl) illuminationEl.textContent = 'Beleuchtung: 0%';
    }

    const now = new Date();
    const signs = this.data.zodiacSigns || [];
    let sign = signs[5] || null;
    if (signs.length) {
      const m = now.getMonth() + 1, d = now.getDate();
      const idx = Math.min(11, Math.floor((m - 1 + d / 31) % 12));
      sign = signs[idx] || sign;
    }
    if (zodiacEl) zodiacEl.textContent = (sign ? sign.name + ' (' + sign.element + ')' : 'Zwillinge (Luft)');

    const next = this.mp.getNextEvent ? this.mp.getNextEvent(new Date()) : null;
    if (nextPhaseEl) {
      if (next) {
        const typeLabel = next.type === 'neumond' ? 'Neumond' : 'Vollmond';
        nextPhaseEl.textContent = 'Nächste: ' + typeLabel + ' in ' + (next.days || '?') + ' Tagen';
      } else {
        nextPhaseEl.textContent = 'Nächste Phase in ca. 7 Tagen';
      }
    }

    const illumination = current ? (current.illumination || 50) : 50;
    if (svgContainer) {
      svgContainer.innerHTML = '<svg class="moon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Mondphase ' + (current ? current.label : 'Vollmond') + '" role="img"><defs><radialGradient id="moonGrad" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#f8fafc"/><stop offset="60%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#94a3b8"/></radialGradient><radialGradient id="shadowGrad" cx="60%" cy="50%" r="55%"><stop offset="0%" stop-color="#64748b" stop-opacity="0.7"/><stop offset="100%" stop-color="#334155" stop-opacity="0.9"/></radialGradient></defs><circle cx="50" cy="50" r="45" fill="url(#moonGrad)" stroke="#64748b" stroke-width="1"/><circle cx="50" cy="50" r="45" fill="url(#shadowGrad)" opacity="' + (0.3 + (100 - illumination) / 120) + '"/></svg>';
    }
  }

  renderCalendar() {
    const calendar = document.getElementById('moonCalendar');
    if (!calendar) return;
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const cal = this.mp.getMonthCalendar ? this.mp.getMonthCalendar(year, month) : [];
    const phases = (this.data.moonPhases || []);
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    let header = '<div class="moon-calendar-header">' + weekdays.map(w => '<div class="moon-calendar-day"><span class="day-name">' + w + '</span></div>').join('') + '</div>';
    let daysHtml = '';
    for (let i = 0; i < cal.length; i++) {
      const item = cal[i];
      const isToday = item && item.date === now.toISOString().split('T')[0];
      if (!item) {
        daysHtml += '<div class="moon-calendar-day" aria-hidden="true"><span class="day-number"> </span></div>';
      } else {
        const phaseKey = item.phase || 'new';
        const phaseInfo = phases.find(p => p.key === phaseKey) || phases[0];
        daysHtml += '<div class="moon-calendar-day ' + (isToday ? 'today' : '') + '" aria-label="' + (phaseInfo ? phaseInfo.name : phaseKey) + ' — ' + (item.illumination || 0) + '% Beleuchtung"><span class="day-number">' + item.day + '</span><span class="day-phase" aria-label="' + (phaseInfo ? phaseInfo.name : phaseKey) + '">' + (phaseInfo ? phaseInfo.icon : '🌑') + '</span></div>';
      }
    }
    calendar.innerHTML = header + daysHtml;
  }

  renderRituals() {
    const container = document.getElementById('moonRituals');
    if (!container) return;
    const current = this.mp.getCurrentPhase ? this.mp.getCurrentPhase() : null;
    const ritualsMap = (this.data.moonRituals || {});
    let key = 'full';
    if (current && current.phase) {
      if (current.phase === 'neumond') key = 'new';
      else if (current.phase === 'vollmond') key = 'full';
      else if (current.phase === 'erstes_viertel') key = 'first-quarter';
      else if (current.phase === 'letztes_viertel') key = 'last-quarter';
      else if (current.phase === 'zunehmend') key = 'waxing-crescent';
      else if (current.phase === 'zunehmend_gibb') key = 'waxing-gibbous';
      else if (current.phase === 'abnehmend_gibb') key = 'waning-gibbous';
      else if (current.phase === 'abnehmend') key = 'waning-crescent';
    }
    const rituals = ritualsMap[key] || ritualsMap['full'] || [];
    container.innerHTML = rituals.map(r => '<div class="card ritual-card"><div class="ritual-icon">✦</div><h4 class="ritual-title">' + r.title + '</h4><p class="ritual-desc">' + r.description + '</p><div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-2);">Dauer: ' + r.duration + ' · ' + (r.items ? r.items.join(', ') : '') + '</div></div>').join('');
  }

  setupIcal() {
    const btn = document.getElementById('icalBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const now = new Date();
      const year = now.getUTCFullYear();
      const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Esoterik-Welt//Mondkalender//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Mondkalender', 'X-WR-TIMEZONE:UTC'];
      for (let m = 1; m <= 12; m++) {
        const cal = this.mp.getMonthCalendar ? this.mp.getMonthCalendar(year, m) : [];
        for (const item of cal) {
          if (!item || !item.phase) continue;
          const dt = new Date(Date.UTC(year, m - 1, item.day));
          const uid = 'moon-' + dt.toISOString().split('T')[0] + '-' + item.phase + '@esoterik';
          const label = (this.data.moonPhases || []).find(p => p.key === item.phase)?.name || item.phase;
          lines.push('BEGIN:VEVENT');
          lines.push('UID:' + uid);
          lines.push('DTSTART;VALUE=DATE:' + dt.toISOString().split('T')[0].replace(/-/g, ''));
          lines.push('DTEND;VALUE=DATE:' + dt.toISOString().split('T')[0].replace(/-/g, ''));
          lines.push('SUMMARY:Monphase ' + label);
          lines.push('DESCRIPTION:Illumination ' + (item.illumination || 0) + '%');
          lines.push('END:VEVENT');
        }
      }
      lines.push('END:VCALENDAR');
      const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mondkalender-' + year + '.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  onShow() {
    this.renderMoonPhase();
  }
}
