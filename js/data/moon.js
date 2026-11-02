// Inhalte für den Mondbereich.
//
// Wichtig: Diese Datei enthält KEINE Rechenlogik und keine Scheinwerte.
// Alle Zahlen (Phase, Beleuchtung, Zeiten) kommen aus data/moon-astro.mjs und
// sind dort gegen USNO bzw. JPL Horizons geprüft. Hier stehen ausschließlich
// Texte — astronomische Erklärungen, klar getrennte kulturelle Deutungen und
// Reflexionsideen.

export const PHASE_CONTENT = {
  neumond: {
    key: 'neumond',
    name: 'Neumond',
    sector: 'Phase 1 von 8',
    appearance:
      'Der Mond steht zwischen Sonne und Erde. Seine uns zugewandte Seite liegt im Dunkeln, er steht tagsüber am Himmel und ist mit bloßem Auge praktisch unsichtbar.',
    geometry:
      'Sonne, Mond und Erde stehen fast auf einer Linie, der Mond aber zwischen uns und der Sonne. Der Winkel Sonne–Mond–Erde ist nahe 0°, deshalb wird fast keine der uns zugewandten Mondseiten beleuchtet.',
    numbers: '0–2 % beleuchtet · Mondalter 0–1 Tag · Aufgang und Untergang etwa mit der Sonne.',
    culture:
      'In vielen Kalendern und Traditionen gilt der Neumond als Anfang: Lunisolare Monate beginnen mit ihm, Fastenzeiten und Aussaat wurden danach gelegt. Die astrologische Lesart deutet ihn als Setzpunkt — was jetzt begonnen wird, trägt durch den Zyklus.',
    reflection:
      'Eine Frage zum Aufschreiben, keine Aufgabe: Was möchtest du in den nächsten vier Wochen wachsen sehen — und was hat gerade noch keine Form?',
  },
  'zunehmende-sichel': {
    key: 'zunehmende-sichel',
    name: 'Zunehmende Sichel',
    sector: 'Phase 2 von 8',
    appearance:
      'Eine Sichel am Abendhimmel, rechts beleuchtet (Nordhalbkugel) — schmal kurz nach dem Neumond, breiter zum Viertel hin. Sie geht kurz nach der Sonne unter, ist also in der Dämmerung tief im Westen zu sehen.',
    geometry:
      'Der Winkel Sonne–Mond–Erde wächst von 0° auf etwa 90°. Von uns aus gesehen wandert die Lichtgrenze (Terminator) über die Scheibe, die beleuchtete Fläche nimmt zu.',
    numbers: '2–45 % beleuchtet · Mondalter etwa 1–7 Tage · sichtbar am Abend.',
    culture:
      'Die zunehmende Sichel gilt in vielen Kulturen als Zeichen für Wachstum und ersten Aufbruch. Rituell wird sie oft mit dem ersten konkreten Schritt verbunden, nicht mit dem großen Plan.',
    reflection:
      'Wähle eine kleine, heute machbare Handlung, die zu deinem Vorsatz vom Neumond passt. Nicht mehr als eine.',
  },
  'erstes-viertel': {
    key: 'erstes-viertel',
    name: 'Erstes Viertel',
    sector: 'Phase 3 von 8',
    appearance:
      'Etwa die rechte Hälfte der Scheibe ist beleuchtet — im Moment des Viertels exakt die Hälfte. Der Mond steht am Nachmittag und Abend hoch am Himmel und geht ungefähr um Mitternacht unter.',
    geometry:
      'Sonne, Erde und Mond bilden einen rechten Winkel (90°). Deshalb sehen wir exakt die halbe beleuchtete Seite — die Hälfte der uns zugewandten Scheibe bleibt dunkel.',
    numbers: '45–55 % beleuchtet, exakt 50 % im Moment des Viertels · Mondalter etwa 7 Tage.',
    culture:
      'Als „Halbmond“ wird dieser Punkt oft als Prüfstein gedeutet: Der Anfang ist vorbei, die Richtung steht zur Entscheidung. In der Astrologie gilt er als Spannungspunkt zwischen Vorhaben und Widerstand.',
    reflection: 'Was hält dich gerade auf — und ist es ein Hindernis, das du umgehen kannst, oder eine Information?',
  },
  'zunehmender-mond': {
    key: 'zunehmender-mond',
    name: 'Zunehmender Mond (Gibbous)',
    sector: 'Phase 4 von 8',
    appearance:
      'Mehr als die Hälfte ist beleuchtet, die dunkle Sichel wird schmaler. Der Mond ist fast die ganze Nacht am Himmel, am Abend hoch im Süden.',
    geometry:
      'Der Winkel Sonne–Mond–Erde wächst über 90° hinaus in Richtung 180°. Die beleuchtete Fläche nimmt weiter zu, die Terminatorlinie liegt jetzt auf der linken Seite.',
    numbers: '55–98 % beleuchtet · Mondalter etwa 7–15 Tage.',
    culture:
      'Diese Phase wird mit Ausdauer, Nacharbeit und Detail verbunden: nicht mehr der Aufbruch, sondern das Dranbleiben. Kulturell oft die Zeit des „Feinschliffs“ vor dem Höhepunkt.',
    reflection: 'Was an deinem Vorhaben ist fast fertig und braucht nur noch einen letzten Durchgang?',
  },
  vollmond: {
    key: 'vollmond',
    name: 'Vollmond',
    sector: 'Phase 5 von 8',
    appearance:
      'Die volle Scheibe steht die ganze Nacht am Himmel: Sie geht bei Sonnenuntergang im Osten auf und bei Sonnenaufgang im Westen unter.',
    geometry:
      'Die Erde steht zwischen Sonne und Mond (Opposition, Winkel 180°). Wir sehen die gesamte beleuchtete Seite — 100 % der Scheibe, aber weiterhin nur die Hälfte des Mondes: Die andere Hälfte ist auch jetzt beleuchtet und nur abgewandt.',
    numbers: '98–100 % beleuchtet · Mondalter etwa 15 Tage.',
    culture:
      'Der Vollmond ist der bekannteste Mondtermin und der am stärksten aufgeladene. Überliefert sind Erntedank- und Gemeinschaftsfeste; in der Astrologie gilt er als Höhe- und Wendepunkt, an dem etwas sichtbar wird.',
    reflection: 'Was ist in diesem Zyklus tatsächlich sichtbar geworden — auch das, was du nicht geplant hattest?',
  },
  'abnehmender-mond': {
    key: 'abnehmender-mond',
    name: 'Abnehmender Mond (Gibbous)',
    sector: 'Phase 6 von 8',
    appearance:
      'Noch fast voll, aber die rechte Seite beginnt dunkel zu werden. Der Mond geht später am Abend auf und steht am Morgen noch am Himmel.',
    geometry:
      'Der Winkel Sonne–Mond–Erde läuft von 180° zurück in Richtung 90°. Die beleuchtete Fläche nimmt ab; die Terminatorlinie wandert wieder über die Scheibe.',
    numbers: '55–98 % beleuchtet · Mondalter etwa 15–22 Tage.',
    culture:
      'In der Überlieferung ist das die Phase des Teilens und Integrierens: Ernte wird verteilt, Wissen weitergegeben. Die astrologische Deutung betont Dankbarkeit und das Ordnen von Ergebnissen.',
    reflection: 'Wem könntest du etwas von dem weitergeben, was du in diesem Zyklus gelernt hast?',
  },
  'letztes-viertel': {
    key: 'letztes-viertel',
    name: 'Letztes Viertel',
    sector: 'Phase 7 von 8',
    appearance:
      'Wieder etwa eine Hälfte — diesmal die linke, im Moment des Viertels exakt die Hälfte. Der Mond geht etwa zur Mitte der Nacht auf und steht am Morgen hoch am Himmel.',
    geometry:
      'Erneut ein rechter Winkel zwischen Sonne, Erde und Mond, nur auf der anderen Seite des Zyklus. Die halbe Scheibe ist beleuchtet, und die beleuchtete Seite liegt jetzt links.',
    numbers: '45–55 % beleuchtet, exakt 50 % im Moment des Viertels · Mondalter etwa 22 Tage.',
    culture:
      'Das letzte Viertel gilt als Phase des Abschlusses und der Prüfung: Was hat getragen, was nicht? In der Astrologie wird es mit Loslassen und Klärung verbunden.',
    reflection: 'Was kannst du in diesem Zyklus bewusst beenden, damit es nicht unerledigt in den nächsten wandert?',
  },
  'abnehmende-sichel': {
    key: 'abnehmende-sichel',
    name: 'Abnehmende Sichel',
    sector: 'Phase 8 von 8',
    appearance:
      'Eine Sichel am Morgenhimmel, links beleuchtet — breit direkt nach dem Viertel, schmal vor dem Neumond. Sie geht kurz vor der Sonne auf und steht tief im Osten in der Morgendämmerung.',
    geometry:
      'Der Winkel Sonne–Mond–Erde fällt unter 45° und läuft auf 0° zu. Die beleuchtete Fläche wird schmal, bis der Mond im Neumond ganz verschwindet.',
    numbers: '2–45 % beleuchtet · Mondalter etwa 22–29 Tage · sichtbar am Morgen.',
    culture:
      'Die letzte Sichel ist in vielen Traditionen die stille Phase: Rückzug, Reinigung, Vorbereitung. Praktisch jede Kultur mit Mondkalender kennt sie als Zeit vor dem Neubeginn.',
    reflection:
      'Was brauchst du in den nächsten Tagen an Ruhe, damit der nächste Anfang nicht nur ein Neustart aus Erschöpfung wird?',
  },
};

/** Reihenfolge der acht Abschnitte im Zyklus (Neumond zuerst). */
export const PHASE_ORDER = [
  'neumond',
  'zunehmende-sichel',
  'erstes-viertel',
  'zunehmender-mond',
  'vollmond',
  'abnehmender-mond',
  'letztes-viertel',
  'abnehmende-sichel',
];

/**
 * Reflexionsideen je Phase. Bewusst als Angebot formuliert, nicht als Anweisung,
 * und ohne Wirkversprechen.
 */
export const moonRituals = {
  neumond: [
    {
      title: 'Drei Sätze für den Anfang',
      description: 'Schreibe drei Sätze auf: was du beginnen willst, was du dafür brauchst, was du dafür loslässt.',
      duration: '10 Min',
      items: ['Papier', 'Stift'],
    },
    {
      title: 'Leere sichtbar machen',
      description:
        'Räume eine kleine Fläche frei — Regal, Tisch, Notiz-App. Der Neumond ist der Moment der Leere, nicht des Programms.',
      duration: '15 Min',
      items: ['eine Fläche deiner Wahl'],
    },
  ],
  'zunehmende-sichel': [
    {
      title: 'Der erste kleine Schritt',
      description:
        'Formuliere aus deinem Vorsatz eine Handlung, die höchstens zehn Minuten dauert. Führe sie heute aus.',
      duration: '10 Min',
      items: ['Notizbuch', 'Kalender'],
    },
    {
      title: 'Sichel am Abendhimmel',
      description:
        'Geh nach Sonnenuntergang nach draußen und suche die Sichel im Westen. Notiere, wie viel du tatsächlich siehst.',
      duration: '15 Min',
      items: ['freier Westhorizont'],
    },
  ],
  'erstes-viertel': [
    {
      title: 'Hindernis benennen',
      description:
        'Schreibe den einen Punkt auf, der gerade blockiert. Prüfe dann: Ist es Zeit, Können, Geld — oder eine Annahme?',
      duration: '20 Min',
      items: ['Papier', 'Stift'],
    },
    {
      title: 'Entscheidung mit Frist',
      description: 'Setze eine offene Entscheidung auf einen konkreten Tag in dieser Woche.',
      duration: '10 Min',
      items: ['Kalender'],
    },
  ],
  'zunehmender-mond': [
    {
      title: 'Feinschliff statt Neubau',
      description: 'Nimm dir das, was fast fertig ist, und verbessere genau eine Sache daran.',
      duration: '20 Min',
      items: ['dein laufendes Projekt'],
    },
    {
      title: 'Energie-Check',
      description: 'Wo fließt gerade Kraft ab, ohne dass etwas entsteht? Notiere es, ohne es sofort zu ändern.',
      duration: '15 Min',
      items: ['Journal'],
    },
  ],
  vollmond: [
    {
      title: 'Sichtbar gewordenes notieren',
      description: 'Schreibe auf, was in diesem Zyklus tatsächlich passiert ist — geplant und ungeplant.',
      duration: '20 Min',
      items: ['Papier', 'Stift'],
    },
    {
      title: 'Zehn Minuten draußen stehen',
      description: 'Geh nach Sonnenuntergang nach draußen und sieh dir den Mond an, ohne etwas dabei zu tun.',
      duration: '10 Min',
      items: ['Jacke'],
    },
    {
      title: 'Dankbarkeit in Zahlen',
      description:
        'Nenne dreizehn Dinge, für die du dankbar bist. Dreizehn, weil die Liste dann über das Offensichtliche hinausgeht.',
      duration: '15 Min',
      items: ['Notizbuch'],
    },
  ],
  'abnehmender-mond': [
    {
      title: 'Weitergeben',
      description: 'Teile eine Erkenntnis aus diesem Zyklus mit jemandem, der davon profitiert.',
      duration: 'variabel',
      items: ['Zeit'],
    },
    {
      title: 'Integrations-Journal',
      description: 'Was hat der Zyklus gebracht, was nimmst du mit, was war nur Lärm?',
      duration: '20 Min',
      items: ['Journal', 'Stift'],
    },
  ],
  'letztes-viertel': [
    {
      title: 'Abschluss statt Abbruch',
      description: 'Beende eine Sache förmlich: letzte Nachricht, letzter Haken, klare Ansage an dich selbst.',
      duration: '30 Min',
      items: ['Aufgabenliste'],
    },
    {
      title: 'Brief, der nicht abgeschickt wird',
      description: 'Schreibe auf, was offen ist. Danach weg damit — der Brief ist für dich, nicht für den Empfänger.',
      duration: '20 Min',
      items: ['Papier', 'Stift'],
    },
  ],
  'abnehmende-sichel': [
    {
      title: 'Stille statt Programm',
      description: 'Eine Stunde ohne Bildschirm, ohne Input. Wenn das zu viel ist: zehn Minuten.',
      duration: '10–60 Min',
      items: ['Ruhe'],
    },
    {
      title: 'Traum notieren',
      description: 'Stift neben das Bett legen und morgens die ersten drei Sätze aufschreiben, ohne sie zu bewerten.',
      duration: 'morgens, 5 Min',
      items: ['Notizbuch am Bett'],
    },
  ],
};

/** Vertiefungstexte (immer sichtbarer Inhalt, keine leeren Aufklapper). */
export const DEEP_DIVE = {
  geometry: {
    title: 'Lichtgeometrie: warum es Phasen gibt',
    paragraphs: [
      'Die Sonne beleuchtet immer genau eine Hälfte des Mondes — das gilt bei jeder Phase. Sichtbar wird für uns nur der Teil dieser Hälfte, der gerade zur Erde zeigt.',
      'Entscheidend ist der Winkel Sonne–Mond–Erde. Bei 0° (Neumond) fällt das Licht auf die abgewandte Seite, bei 180° (Vollmond) auf die zugewandte. Dazwischen wandert die Lichtgrenze — der Terminator — als Halbellipse über die Scheibe.',
      'Der beleuchtete Anteil k der sichtbaren Scheibe folgt aus dem Phasenwinkel i: k = (1 + cos i) / 2. Bei i = 90° ergibt das exakt 0,5 — die Hälfte, also „Halbmond“.',
      'Aus demselben Grund zeigt der Mond uns immer dieselbe Seite: Er dreht sich in 27,3 Tagen einmal um sich selbst und braucht für einen Umlauf um die Erde genauso lange (gebundene Rotation). Der Zyklus der Phasen dauert mit 29,53 Tagen etwas länger, weil die Erde sich inzwischen selbst weiterbewegt.',
    ],
  },
  eclipse: {
    title: 'Phase ist nicht Finsternis',
    paragraphs: [
      'Bei jeder Phase steht der Mond irgendwo zwischen Sonne und Erde (Neumond) oder dahinter (Vollmond) — trotzdem gibt es nicht jeden Monat eine Finsternis.',
      'Der Grund: Die Mondbahn ist um etwa 5,1° gegen die Erdbahn geneigt. Meist zieht der Mond bei Neumond knapp über oder unter der Sonne vorbei und bei Vollmond knapp über oder unter dem Erdschatten.',
      'Eine Finsternis braucht zusätzlich die Nähe zu einem der beiden Bahnknoten: eine Sonnenfinsternis bei Neumond bis etwa 17° Knotenabstand, eine Mondfinsternis bei Vollmond bis etwa 12°. Diese Grenzen sind Näherungswerte und hängen von den aktuellen Entfernungen ab.',
      'Deshalb zeigt diese Seite keine Finsternisse an: Dafür müsste man Knotenlage und Entfernungen gesondert rechnen. Die Phasenzeiten hier sind davon unabhängig korrekt.',
    ],
  },
  culture: {
    title: 'Kulturelle und astrologische Deutungen — und ihre Grenze',
    paragraphs: [
      'Mondphasen sind astronomisch eindeutig. Was Menschen in sie hineingelesen haben, ist es nicht: Fast jede Kultur mit Mondkalender hat eigene Namen, Feste und Regeln an die Phasen gehängt.',
      'Bekannt sind etwa die englischsprachigen Almanach-Namen für Vollmonde (Erntemond, Jägermond). Sie sind regional und historisch unterschiedlich und beschreiben Jahreszeiten, nicht die Phase selbst. Im deutschsprachigen Raum sind Lostage und Bauernregeln verbreitet, deren Bezug zum Mond oft nachträglich hergestellt wurde.',
      'Die moderne Astrologie deutet den Zyklus als Ablauf von Setzen, Aufbauen, Prüfen und Loslassen. Das ist eine Deutungstradition, keine Messung: Es gibt keine belastbare Evidenz dafür, dass Mondphasen menschliches Erleben steuern.',
      'Diese Seite trennt beides sichtbar. Alles, was mit Prozent, Uhrzeit und Datum arbeitet, ist berechnet und geprüft; alles, was Bedeutung zuschreibt, ist als Deutung gekennzeichnet und als Angebot gemeint.',
    ],
  },
  zodiac: {
    title: 'Warum hier kein Mondzeichen steht',
    paragraphs: [
      'Bis vor Kurzem zeigte diese Seite ein „Mond im Zeichen“ — abgeleitet aus Kalendermonat und Tag. Das war kein Messwert, sondern eine Näherung, die zufällig ungefähr richtig lag.',
      'Ein echtes Mondzeichen ist die geozentrische ekliptikale Länge des Mondes, bezogen auf ein tropisches oder siderisches System. Dafür braucht es eine geprüfte Ephemeride (ELP/VSOP-Koeffizienten oder eine Bibliothek mit dokumentierter Genauigkeit) — und die Angabe des Systems, weil sich tropische und siderische Tierkreiszeichen um etwa 24° unterscheiden.',
      'Solange das nicht im Projekt steckt, lassen wir das Feld lieber weg, als eine Zahl zu zeigen, die wie eine Messung aussieht. Der Astrologie-Bereich des Projekts behandelt Zeichen und Häuser getrennt als Deutungssystem.',
    ],
  },
};

/** Quellenregister für den Bereich „Woher die Zahlen kommen". */
export const SOURCES = [
  {
    label: 'USNO — Astronomical Applications Department, Moon Phases API',
    url: 'https://aa.usno.navy.mil/api/moon/phases/date',
    note: 'Referenz für die Zeiten der vier Hauptphasen (192 Stichproben 2024–2027, Abweichung höchstens 44 s).',
  },
  {
    label: 'NASA/JPL Horizons (DE441)',
    url: 'https://ssd.jpl.nasa.gov/api/horizons.api',
    note: 'Referenz für den Beleuchtungsgrad (732 Tageswerte 2025–2026, Abweichung höchstens 0,33 Prozentpunkte).',
  },
  {
    label: 'Jean Meeus, Astronomical Algorithms, 2. Aufl., Kap. 48–49',
    url: 'https://www.willbell.com/math/mc1.htm',
    note: 'Verfahren für Phasenzeiten (Tafeln 49.A/49.B) und Phasenwinkel; Grundlage der Berechnung im Browser.',
  },
];
