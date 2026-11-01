// Tarot Data — 78 Cards (Major + Minor Arcana)
export const tarotCards = [
  // Major Arcana (0-21)
  {
    id: 0,
    name: 'Der Narr',
    arcana: 'major',
    number: 0,
    keywords: ['Neuanfang', 'Spontanität', 'Vertrauen', 'Unbekanntes'],
    meaning_up: 'Ein neuer Zyklus beginnt. Vertraue dem Unbekannten.',
    meaning_rev: 'Unüberlegtheit, Risiko, Naivität.',
  },
  {
    id: 1,
    name: 'Der Magier',
    arcana: 'major',
    number: 1,
    keywords: ['Manifestation', 'Willenskraft', 'Fähigkeiten', 'Handlung'],
    meaning_up: 'Du hast alle Werkzeuge. Handle jetzt.',
    meaning_rev: 'Manipulation, ungenutztes Potenzial, Täuschung.',
  },
  {
    id: 2,
    name: 'Die Hohepriesterin',
    arcana: 'major',
    number: 2,
    keywords: ['Intuition', 'Geheimnis', 'Inneres Wissen', 'Passivität'],
    meaning_up: 'Hör auf deine innere Stimme. Wissen ruht in dir.',
    meaning_rev: 'Unterdrückte Intuition, Oberflächlichkeit, Geheimnisse.',
  },
  {
    id: 3,
    name: 'Die Herrscherin',
    arcana: 'major',
    number: 3,
    keywords: ['Fülle', 'Kreativität', 'Mutterschaft', 'Natur'],
    meaning_up: 'Fruchtbare Phase. Pflege deine Projekte.',
    meaning_rev: 'Kreative Blockade, Vernachlässigung, Überfürsorge.',
  },
  {
    id: 4,
    name: 'Der Herrscher',
    arcana: 'major',
    number: 4,
    keywords: ['Autorität', 'Struktur', 'Kontrolle', 'Stabilität'],
    meaning_up: 'Übernimm Verantwortung. Schaffe Ordnung.',
    meaning_rev: 'Tyrannei, Starrheit, Kontrollverlust.',
  },
  {
    id: 5,
    name: 'Der Hierophant',
    arcana: 'major',
    number: 5,
    keywords: ['Tradition', 'Spirituelle Führung', 'Konvention', 'Lehre'],
    meaning_up: 'Suche Weisheit in bewährten Systemen.',
    meaning_rev: 'Dogmatik, Rebellion, unkonventioneller Weg.',
  },
  {
    id: 6,
    name: 'Die Liebenden',
    arcana: 'major',
    number: 6,
    keywords: ['Liebe', 'Wahl', 'Harmonie', 'Partnerschaft'],
    meaning_up: 'Wichtige Entscheidung aus dem Herzen.',
    meaning_rev: 'Disharmonie, falsche Wahl, Wertekonflikt.',
  },
  {
    id: 7,
    name: 'Der Wagen',
    arcana: 'major',
    number: 7,
    keywords: ['Sieg', 'Entschlossenheit', 'Kontrolle', 'Vorwärtskommen'],
    meaning_up: 'Fokus und Wille führen zum Erfolg.',
    meaning_rev: 'Richtungslosigkeit, Aggression, Kontrollverlust.',
  },
  {
    id: 8,
    name: 'Die Kraft',
    arcana: 'major',
    number: 8,
    keywords: ['Mut', 'Geduld', 'Innerer Stärke', 'Mitgefühl'],
    meaning_up: 'Sanfte Kraft zähmt wilde Natur.',
    meaning_rev: 'Selbstzweifel, Schwäche, Unterdrückte Wut.',
  },
  {
    id: 9,
    name: 'Der Eremit',
    arcana: 'major',
    number: 9,
    keywords: ['Rückzug', 'Suche', 'Weisheit', 'Innere Führung'],
    meaning_up: 'Zeit für Reflexion. Das Licht ist in dir.',
    meaning_rev: 'Isolation, Einsamkeit, Verweigerung.',
  },
  {
    id: 10,
    name: 'Das Rad des Schicksals',
    arcana: 'major',
    number: 10,
    keywords: ['Wandel', 'Zyklen', 'Schicksal', 'Glück'],
    meaning_up: 'Wende zum Besseren. Alles dreht sich.',
    meaning_rev: 'Unglück, Widerstand gegen Wandel, Pechsträhne.',
  },
  {
    id: 11,
    name: 'Die Gerechtigkeit',
    arcana: 'major',
    number: 11,
    keywords: ['Ausgleich', 'Wahrheit', 'Karma', 'Entscheidung'],
    meaning_up: 'Gerechter Ausgang. Cause & Effect.',
    meaning_rev: 'Ungerechtigkeit, Vorurteil, Ausweichverhalten.',
  },
  {
    id: 12,
    name: 'Der Gehängte',
    arcana: 'major',
    number: 12,
    keywords: ['Opfer', 'Perspektivwechsel', 'Loslassen', 'Warten'],
    meaning_up: 'Neue Sicht durch Hingabe. Pause.',
    meaning_rev: 'Opferbereitschaft verweigert, Stagnation.',
  },
  {
    id: 13,
    name: 'Der Tod',
    arcana: 'major',
    number: 13,
    keywords: ['Ende', 'Transformation', 'Neubeginn', 'Unvermeidlich'],
    meaning_up: 'Alte Strukturen sterben für Neues.',
    meaning_rev: 'Widerstand gegen Wandel, nicht loslassen können.',
  },
  {
    id: 14,
    name: 'Die Mäßigkeit',
    arcana: 'major',
    number: 14,
    keywords: ['Balance', 'Geduld', 'Heilung', 'Integration'],
    meaning_up: 'Mittelweg finden. Alchemie der Gegensätze.',
    meaning_rev: 'Extremismus, Ungeduld, Disharmonie.',
  },
  {
    id: 15,
    name: 'Der Teufel',
    arcana: 'major',
    number: 15,
    keywords: ['Sucht', 'Materialismus', 'Schatten', 'Befreiung'],
    meaning_up: 'Erkenne deine Ketten. Befreiung ist möglich.',
    meaning_rev: 'Loslösung, Bewusstwerdung, Schattenarbeit.',
  },
  {
    id: 16,
    name: 'Der Turm',
    arcana: 'major',
    number: 16,
    keywords: ['Plötzlicher Wandel', 'Erschütterung', 'Befreiung', 'Wahrheit'],
    meaning_up: 'Falsche Strukturen stürzen ein. Notwendiger Bruch.',
    meaning_rev: 'Angst vor Wandel, Katastrophe vermeiden, innerer Turm.',
  },
  {
    id: 17,
    name: 'Der Stern',
    arcana: 'major',
    number: 17,
    keywords: ['Hoffnung', 'Inspiration', 'Heilung', 'Führung'],
    meaning_up: 'Hoffnung kehrt zurück. Du wirst geführt.',
    meaning_rev: 'Hoffnungslosigkeit, Selbstzweifel, Trennung.',
  },
  {
    id: 18,
    name: 'Der Mond',
    arcana: 'major',
    number: 18,
    keywords: ['Illusion', 'Angst', 'Unbewusstes', 'Intuition'],
    meaning_up: 'Nicht alles ist wie es scheint. Vertraue Intuition.',
    meaning_rev: 'Ängste überwinden, Klarheit, Täuschung endet.',
  },
  {
    id: 19,
    name: 'Die Sonne',
    arcana: 'major',
    number: 19,
    keywords: ['Freude', 'Erfolg', 'Lebendigkeit', 'Klarheit'],
    meaning_up: 'Strahlender Erfolg. Kindliche Freude.',
    meaning_rev: 'Vorübergehende Trübung, Ego, Übermut.',
  },
  {
    id: 20,
    name: 'Das Gericht',
    arcana: 'major',
    number: 20,
    keywords: ['Erwachen', 'Rechenschaft', 'Vergebung', 'Berufung'],
    meaning_up: 'Innerer Ruf. Vergebung und Neubeginn.',
    meaning_rev: 'Selbstkritik, Verweigerung, Schuldgefühle.',
  },
  {
    id: 21,
    name: 'Die Welt',
    arcana: 'major',
    number: 21,
    keywords: ['Vollendung', 'Integration', 'Reiseende', 'Ganzheit'],
    meaning_up: 'Zyklus vollendet. Ganzheit erreicht.',
    meaning_rev: 'Unvollendet, Verlust, offene Enden.',
  },

  // Minor Arcana — Wands (Stäbe)
  ...Array.from({ length: 14 }, (_, i) => ({
    id: 22 + i,
    name: `${i === 0 ? 'Ass' : i === 10 ? 'Bube' : i === 11 ? 'Ritter' : i === 12 ? 'Königin' : i === 13 ? 'König' : i} der Stäbe`,
    arcana: 'minor',
    suit: 'wands',
    number: i + 1,
    keywords:
      i === 0
        ? ['Inspiration', 'Potenzial']
        : i === 1
          ? ['Planung', 'Entscheidung']
          : i === 2
            ? ['Überblick', 'Führung']
            : i === 3
              ? ['Feiern', 'Teamwork']
              : i === 4
                ? ['Konkurrenz', 'Konflikt']
                : i === 5
                  ? ['Siege', 'Anerkennung']
                  : i === 6
                    ? ['Verteidigung', 'Standhaftigkeit']
                    : i === 7
                      ? ['Schnelligkeit', 'Handlung']
                      : i === 8
                        ? ['Ausdauer', 'Letzte Meile']
                        : i === 9
                          ? ['Last', 'Verantwortung']
                          : i === 10
                            ? ['Entdeckung', 'Neugier']
                            : i === 11
                              ? ['Energie', 'Aktion']
                              : i === 12
                                ? ['Charisma', 'Magnetismus']
                                : ['Visionär', 'Meisterschaft'],
    meaning_up: 'Feuer-Energie: Kreativität, Wille, Aktion.',
    meaning_rev: 'Blockierte Energie, Impulsivität, Burnout.',
  })),

  // Minor Arcana — Cups (Kelche)
  ...Array.from({ length: 14 }, (_, i) => ({
    id: 36 + i,
    name: `${i === 0 ? 'Ass' : i === 10 ? 'Bube' : i === 11 ? 'Ritter' : i === 12 ? 'Königin' : i === 13 ? 'König' : i} der Kelche`,
    arcana: 'minor',
    suit: 'cups',
    number: i + 1,
    keywords:
      i === 0
        ? ['Neue Liebe', 'Intuition']
        : i === 1
          ? ['Partnerschaft', 'Verbindung']
          : i === 2
            ? ['Freude', 'Freundschaft']
            : i === 3
              ? ['Nostalgie', 'Vergessenes']
              : i === 4
                ? ['Enttäuschung', 'Trauer']
                : i === 5
                  ? ['Vergangenheit', 'Loslassen']
                  : i === 6
                    ? ['Träumerei', 'Illusionen']
                    : i === 7
                      ? ['Weiterziehen', 'Suche']
                      : i === 8
                        ? ['Wunsch', 'Erfüllung']
                        : i === 9
                          ? ['Harmonie', 'Familie']
                          : i === 10
                            ? ['Botschaft', 'Angebot']
                            : i === 11
                              ? ['Romantik', 'Idealismus']
                              : i === 12
                                ? ['Mitgefühl', 'Heilung']
                                : ['Emotionale Reife', 'Balance'],
    meaning_up: 'Wasser-Energie: Gefühle, Beziehungen, Intuition.',
    meaning_rev: 'Emotionale Blockade, Rückzug, Übersensibilität.',
  })),

  // Minor Arcana — Swords (Schwerter)
  ...Array.from({ length: 14 }, (_, i) => ({
    id: 50 + i,
    name: `${i === 0 ? 'Ass' : i === 10 ? 'Bube' : i === 11 ? 'Ritter' : i === 12 ? 'Königin' : i === 13 ? 'König' : i} der Schwerter`,
    arcana: 'minor',
    suit: 'swords',
    number: i + 1,
    keywords:
      i === 0
        ? ['Klarheit', 'Durchbruch']
        : i === 1
          ? ['Abwägung', 'Stillstand']
          : i === 2
            ? ['Herzschmerz', 'Trennung']
            : i === 3
              ? ['Erholung', 'Ruhe']
              : i === 4
                ? ['Ruhe', 'Rückzug']
                : i === 5
                  ? ['Übergang', 'Reise']
                  : i === 6
                    ? ['Täuschung', 'Strategie']
                    : i === 7
                      ? ['Mut', 'Entschlossenheit']
                      : i === 8
                        ? ['Einschränkung', 'Gedankenfalle']
                        : i === 9
                          ? ['Albträume', 'Angst']
                          : i === 10
                            ? ['Neugier', 'Wachsamkeit']
                            : i === 11
                              ? ['Handlung', 'Direktheit']
                              : i === 12
                                ? ['Unabhängigkeit', 'Klarheit']
                                : ['Autorität', 'Intellekt'],
    meaning_up: 'Luft-Energie: Verstand, Konflikt, Wahrheit.',
    meaning_rev: 'Konfusion, Grausamkeit, Selbstbetrug.',
  })),

  // Minor Arcana — Pentacles (Münzen)
  ...Array.from({ length: 14 }, (_, i) => ({
    id: 64 + i,
    name: `${i === 0 ? 'Ass' : i === 10 ? 'Bube' : i === 11 ? 'Ritter' : i === 12 ? 'Königin' : i === 13 ? 'König' : i} der Münzen`,
    arcana: 'minor',
    suit: 'pentacles',
    number: i + 1,
    keywords:
      i === 0
        ? ['Chance', 'Wohlstand']
        : i === 1
          ? ['Balance', 'Flexibilität']
          : i === 2
            ? ['Handwerk', 'Teamarbeit']
            : i === 3
              ? ['Meisterschaft', 'Perfektion']
              : i === 4
                ? ['Sicherheit', 'Besitz']
                : i === 5
                  ? ['Mangel', 'Großzügigkeit']
                  : i === 6
                    ? ['Geduld', 'Investition']
                    : i === 7
                      ? ['Einschätzung', 'Qualität']
                      : i === 8
                        ? ['Fertigkeit', 'Hingabe']
                        : i === 9
                          ? ['Fülle', 'Erbe']
                          : i === 10
                            ? ['Lernen', 'Neuanfang']
                            : i === 11
                              ? ['Routine', 'Pflicht']
                              : i === 12
                                ? ['Fürsorge', 'Praxis']
                                : ['Meisterschaft', 'Wohlstand'],
    meaning_up: 'Erde-Energie: Materie, Arbeit, Manifestation.',
    meaning_rev: 'Verschwendung, Gier, Stagnation, Vernachlässigung.',
  })),
];

export function getRandomCards(count, allowReversed = true) {
  const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    reversed: allowReversed && Math.random() < 0.3,
  }));
}

export function getCardById(id) {
  return tarotCards.find((c) => c.id === id);
}

export function getCardsBySuit(suit) {
  return tarotCards.filter((c) => c.suit === suit);
}

export function getMajorArcana() {
  return tarotCards.filter((c) => c.arcana === 'major');
}
