// Moon Module
export class MoonModule {
  constructor() {}

  async init() {
    await import('../data/moon.js');
    this.renderMoonPhase();
    this.renderCalendar();
    this.renderRituals();
  }

  renderMoonPhase() {
    // Update displayed phase based on current date (simplified)
    const phaseName = document.getElementById('moonPhaseName');
    const illumination = document.getElementById('moonIllumination');
    const zodiac = document.getElementById('moonZodiac');
    const nextPhase = document.getElementById('moonNextPhase');
    const svgContainer = document.getElementById('moonSvg');

    // For demo: show full moon as default
    if (phaseName) phaseName.textContent = "Vollmond";
    if (illumination) illumination.textContent = "Beleuchtung: 100%";
    if (zodiac) zodiac.textContent = "Zwillinge (Luft)";
    if (nextPhase) nextPhase.textContent = "Nächste: Abnehmender Mond in 3 Tagen";

    // Simple SVG moon visualization
    if (svgContainer) {
      svgContainer.innerHTML = `
        <svg class="moon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#f8fafc"/>
              <stop offset="60%" stop-color="#e2e8f0"/>
              <stop offset="100%" stop-color="#94a3b8"/>
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#moonGrad)" stroke="#64748b" stroke-width="1"/>
          <circle cx="35" cy="35" r="8" fill="#64748b" opacity="0.2"/>
          <circle cx="65" cy="55" r="5" fill="#64748b" opacity="0.15"/>
          <circle cx="40" cy="65" r="4" fill="#64748b" opacity="0.2"/>
        </svg>`;
    }
  }

  renderCalendar() {
    const calendar = document.getElementById('moonCalendar');
    if (!calendar) return;

    const days = [
      { day: 1, phase: 'new', icon: '🌑', illumination: 0, isToday: false },
      { day: 2, phase: 'new', icon: '🌑', illumination: 2, isToday: false },
      { day: 5, phase: 'waxing-crescent', icon: '🌒', illumination: 15, isToday: false },
      { day: 9, phase: 'first-quarter', icon: '🌓', illumination: 50, isToday: false },
      { day: 14, phase: 'waxing-gibbous', icon: '🌔', illumination: 85, isToday: true },
      { day: 16, phase: 'full', icon: '🌕', illumination: 100, isToday: false },
      { day: 20, phase: 'waning-gibbous', icon: '🌖', illumination: 85, isToday: false },
      { day: 23, phase: 'last-quarter', icon: '🌗', illumination: 50, isToday: false },
      { day: 27, phase: 'waning-crescent', icon: '🌘', illumination: 15, isToday: false },
      { day: 29, phase: 'new', icon: '🌑', illumination: 0, isToday: false }
    ];

    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    calendar.innerHTML = `
      <div class="moon-calendar-header">
        ${weekdays.map(w => `<div class="moon-calendar-day"><span class="day-name">${w}</span></div>`).join('')}
      </div>
      ${days.map(d => `
        <div class="moon-calendar-day ${d.isToday ? 'today' : ''}" aria-label="${d.phase} — ${d.illumination}%">
          <span class="day-number">${d.day}</span>
          <span class="day-phase" aria-label="${d.phase}">${d.icon}</span>
        </div>
      `).join('')}
    `;
  }

  renderRituals() {
    const ritualsContainer = document.getElementById('moonRituals');
    if (!ritualsContainer) return;

    const rituals = window.getMoonRituals ? window.getMoonRituals('full') : [
      { title: "Vollmond-Loslass-Ritual", description: "Schreibe auf, was du loslassen möchtest. Verbrenne das Papier im Vollmondlicht.", duration: "20 Min", items: ["Papier", "Stift", "Kerze"] },
      { title: "Vollmond-Wasser", description: "Stelle Wasser in den Vollmond. Nutze es für Reinigung und Trinken.", duration: "Über Nacht", items: ["Glas", "Wasser"] },
      { title: "Dankbarkeits-Zeremonie", description: "Nenne 13 Dinge, für die du dankbar bist. Feiere deine Errungenschaften.", duration: "15 Min", items: ["Kerzen", "Räucherwerk"] }
    ];

    ritualsContainer.innerHTML = rituals.map(r => `
      <div class="card ritual-card">
        <div class="ritual-icon">✦</div>
        <h4 class="ritual-title">${r.title}</h4>
        <p class="ritual-desc">${r.description}</p>
        <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-2);">
          Dauer: ${r.duration} · ${r.items ? r.items.join(', ') : ''}
        </div>
      </div>
    `).join('');
  }

  onShow() {
    this.renderMoonPhase();
  }
}
