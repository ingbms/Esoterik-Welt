// Moon Data — Mondphasen Berechnung & Rituale
export const moonPhases = [
  { key: 'new', name: 'Neumond', icon: '🌑', illumination: 0, description: 'Neubeginn, Intentionen setzen, Stille' },
  {
    key: 'waxing-crescent',
    name: 'Zunehmender Sichelmond',
    icon: '🌒',
    illumination: 0.25,
    description: 'Wachstum, erste Schritte, Hoffnung',
  },
  {
    key: 'first-quarter',
    name: 'Erstes Viertel',
    icon: '🌓',
    illumination: 0.5,
    description: 'Entscheidung, Handlung, Hindernisse überwinden',
  },
  {
    key: 'waxing-gibbous',
    name: 'Zunehmender Mond',
    icon: '🌔',
    illumination: 0.75,
    description: 'Verfeinerung, Feinschliff, Durchhaltevermögen',
  },
  {
    key: 'full',
    name: 'Vollmond',
    icon: '🌕',
    illumination: 1,
    description: 'Kulmination, Klarheit, Loslassen, Feier',
  },
  {
    key: 'waning-gibbous',
    name: 'Abnehmender Mond',
    icon: '🌖',
    illumination: 0.75,
    description: 'Dankbarkeit, Teilen, Integration',
  },
  {
    key: 'last-quarter',
    name: 'Letztes Viertel',
    icon: '🌗',
    illumination: 0.5,
    description: 'Loslassen, Vergebung, Abschluss',
  },
  {
    key: 'waning-crescent',
    name: 'Abnehmende Sichel',
    icon: '🌘',
    illumination: 0.25,
    description: 'Ruhe, Reflexion, Vorbereitung auf Neues',
  },
];

export const zodiacSigns = [
  { key: 'aries', name: 'Widder', element: 'Feuer', dates: '21.3.–20.4.' },
  { key: 'taurus', name: 'Stier', element: 'Erde', dates: '21.4.–20.5.' },
  { key: 'gemini', name: 'Zwillinge', element: 'Luft', dates: '21.5.–21.6.' },
  { key: 'cancer', name: 'Krebs', element: 'Wasser', dates: '22.6.–22.7.' },
  { key: 'leo', name: 'Löwe', element: 'Feuer', dates: '23.7.–23.8.' },
  { key: 'virgo', name: 'Jungfrau', element: 'Erde', dates: '24.8.–23.9.' },
  { key: 'libra', name: 'Waage', element: 'Luft', dates: '24.9.–23.10.' },
  { key: 'scorpio', name: 'Skorpion', element: 'Wasser', dates: '24.10.–22.11.' },
  { key: 'sagittarius', name: 'Schütze', element: 'Feuer', dates: '23.11.–21.12.' },
  { key: 'capricorn', name: 'Steinbock', element: 'Erde', dates: '22.12.–20.1.' },
  { key: 'aquarius', name: 'Wassermann', element: 'Luft', dates: '21.1.–19.2.' },
  { key: 'pisces', name: 'Fische', element: 'Wasser', dates: '20.2.–20.3.' },
];

export const moonRituals = {
  new: [
    {
      title: 'Neumond-Intentionen',
      description: 'Schreibe 3–7 Wünsche/Ziele auf Papier. Verbrenne oder vergrabe sie.',
      duration: '15 Min',
      items: ['Papier', 'Stift', 'Kerze', 'Feuerfeste Schale'],
    },
    {
      title: 'Neumond-Bad',
      description: 'Salzbad mit ätherischen Ölen für energetische Reinigung.',
      duration: '20 Min',
      items: ['Meersalz', 'Lavendelöl', 'Kerzen'],
    },
    {
      title: 'Vision Board',
      description: 'Erstelle ein Vision Board für den neuen Zyklus.',
      duration: '30 Min',
      items: ['Zeitschriften', 'Schere', 'Kleber', 'Pappe'],
    },
  ],
  'waxing-crescent': [
    {
      title: 'Erste Schritte Ritual',
      description: 'Definiere 3 konkrete erste Aktionen für deine Neumond-Intention.',
      duration: '10 Min',
      items: ['Notizbuch', 'Kalender'],
    },
    {
      title: 'Saatgut-Pflanzen',
      description: 'Pflanze symbolisch Samen (Kräuter/Blumen) für dein Wachstum.',
      duration: '15 Min',
      items: ['Töpfe', 'Erde', 'Samen'],
    },
  ],
  'first-quarter': [
    {
      title: 'Hindernis-Analyse',
      description: 'Identifiziere Blockaden und plane Lösungen.',
      duration: '20 Min',
      items: ['Papier', 'Stift'],
    },
    {
      title: 'Entscheidungs-Meditation',
      description: 'Meditiere über anstehende Entscheidungen. Ziehe eine Tarot-Karte.',
      duration: '15 Min',
      items: ['Tarot', 'Kerze'],
    },
  ],
  'waxing-gibbous': [
    {
      title: 'Feinschliff',
      description: 'Überprüfe Fortschritte. Justiere nach. Perfektioniere Details.',
      duration: '20 Min',
      items: ['Projekt-Liste', 'Stift'],
    },
    {
      title: 'Energie-Check',
      description: 'Wo fließt Energie? Wo blockiert es? Justiere.',
      duration: '15 Min',
      items: ['Journal'],
    },
  ],
  full: [
    {
      title: 'Vollmond-Loslass-Ritual',
      description: 'Schreibe auf, was du loslassen möchtest. Verbrenne das Papier im Vollmondlicht.',
      duration: '20 Min',
      items: ['Papier', 'Stift', 'Feuerfeste Schale', 'Vollmondlicht'],
    },
    {
      title: 'Vollmond-Wasser',
      description: 'Stelle Wasser in den Vollmond. Nutze es für Reinigung/Trinken.',
      duration: 'Über Nacht',
      items: ['Glasgefäß', 'Wasser', 'Kristalle (optional)'],
    },
    {
      title: 'Dankbarkeits-Zeremonie',
      description: 'Nenne 13 Dinge, für die du dankbar bist. Feiere Errungenschaften.',
      duration: '15 Min',
      items: ['Kerzen', 'Räucherwerk'],
    },
  ],
  'waning-gibbous': [
    {
      title: 'Wissens-Teilen',
      description: 'Teile Erkenntnisse mit anderen. Lehre, was du gelernt hast.',
      duration: 'Variabel',
      items: ['Community', 'Plattform'],
    },
    {
      title: 'Integration-Journaling',
      description: 'Reflektiere: Was hat der Zyklus gebracht? Was integrierst du?',
      duration: '20 Min',
      items: ['Journal', 'Stift'],
    },
  ],
  'last-quarter': [
    {
      title: 'Vergebungs-Ritual',
      description: 'Vergebe dir und anderen. Schreibe Briefe (nicht abschicken). Verbrenne sie.',
      duration: '30 Min',
      items: ['Papier', 'Umschläge', 'Feuer'],
    },
    {
      title: 'Abschluss-Zeremonie',
      description: 'Schließe Projekte ab. Räume auf. Mache Platz für Neues.',
      duration: '30 Min',
      items: ['Aufräum-Utensilien'],
    },
  ],
  'waning-crescent': [
    {
      title: 'Rückzug & Stille',
      description: 'Digital Detox. Meditation. Ruhe vor dem Neumond.',
      duration: '1–2 Stunden',
      items: ['Ruhe', 'Meditation'],
    },
    {
      title: 'Traumarbeit',
      description: 'Notiere Träume. Der Schleier ist dünn. Intuition ist stark.',
      duration: 'Morgens',
      items: ['Traumtagebuch', 'Stift am Bett'],
    },
  ],
};

export function getCurrentMoonPhase() {
  const now = new Date();
  const phase = calculateMoonPhase(now);
  const phaseData = moonPhases.find((p) => p.key === phase.key);
  const zodiac = getMoonZodiac(now);
  const daysUntilNext = getDaysUntilNextPhase(now);

  return {
    ...phaseData,
    date: now.toISOString().split('T')[0],
    zodiac,
    illumination: Math.round(phaseData.illumination * 100),
    daysUntilNext,
  };
}

export function calculateMoonPhase(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Simplified moon phase calculation (accurate enough for display)
  const c = year - 1900;
  const y = Math.floor(c / 19) * 19;
  const a = c - y;
  const b = Math.floor((a * 11) % 30);
  const d = (b + month + day) % 30;

  const phaseIndex = Math.floor(d / 3.75) % 8;
  return moonPhases[phaseIndex];
}

export function getMoonZodiac(date) {
  // Simplified - in reality needs ephemeris
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const zodiacIndex = Math.floor((dayOfYear + 80) / 30.44) % 12;
  return zodiacSigns[zodiacIndex];
}

export function getDaysUntilNextPhase(date) {
  const phase = calculateMoonPhase(date);
  const phaseIndex = moonPhases.findIndex((p) => p.key === phase.key);
  return Math.ceil((8 - phaseIndex) * 3.75); // Rough estimate
}

export function getMoonCalendar(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendar = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const phase = calculateMoonPhase(date);
    calendar.push({
      day,
      date: date.toISOString().split('T')[0],
      phase: phase.key,
      phaseName: phase.name,
      icon: phase.icon,
      illumination: Math.round(phase.illumination * 100),
      isToday: date.toDateString() === new Date().toDateString(),
    });
  }
  return calendar;
}

export function getRitualsForPhase(phaseKey) {
  return moonRituals[phaseKey] || [];
}
