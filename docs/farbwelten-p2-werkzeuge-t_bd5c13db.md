# Farbwelten — P2-Werkzeuge (FW-12)

Umsetzung der drei interaktiven Elemente aus Master-Auftrag §10 auf Basis von
`fcfe190`. Keine Änderung an `content/farbwelten/*.md`, kein Push, kein Deploy.

## Routen

| Route | Ansicht | H1 |
| --- | --- | --- |
| `#farbwelten/kompass` | Farben-Kompass | Farben-Kompass |
| `#farbwelten/farbmeditation` | Farbmeditation | Farbmeditation |
| `#farbwelten/zeitleiste` | Zeitleiste | Zeitleiste der Farbforschung |

Alle drei sind Unterrouten der Sektion und laufen durch dieselbe Auflösung wie
`chakren` und `lichtfrequenzen` (`js/modules/farbwelten-model.js`). Unbekannte
Slugs ergeben weiterhin die In-Area-Ansicht „Diese Farbwelt gibt es nicht“.
Breadcrumb und JSON-LD-Breadcrumb sind je Ansicht gesetzt.

## Datenvertrag (`js/data/farbwelten.js`)

Die Datei bleibt generiert. Die drei neuen Exporte sind **kuratierte Konstanten
des Generators** (`scripts/generate-farbwelten-data.cjs`), damit ein erneutes
`npm run data:farbwelten` sie nicht verliert. Der Generator bricht ab, wenn eine
zitierte Nummer nicht im Register steht, ein Strang unbekannt ist, ein Ereignis
keine Quelle hat oder die Reihenfolge nicht chronologisch ist.

### `COMPASS`

```
{
  title, seoTitle, meta: { title, description },
  lede, note,
  worlds: {
    <farbId>: {
      associations: string[],   // häufige Assoziationen, belegt mit [3][4]
      kulturell: string,        // kulturelle Varianten, belegt mit [3][4]
      hinweis: string | null,   // Einschränkung (Indigo, Violett)
      quellen: string[]         // immer ['3','4']
    }
  },
  sources: string[]             // Register-Nummern der Seite
}
```

Tradition und wissenschaftliche Einordnung werden **nicht** dupliziert, sondern
aus `FARBWELTEN[i].compare` gelesen (bereits als Deutungstradition gekennzeichnet
bzw. als Forschungsstand formuliert). Die Chakra-Zuordnung kommt aus
`js/data/chakren.js` über `colorId`.

### `MEDITATION`

```
{
  title, seoTitle, meta,
  lede, einordnung, ablauf: string[], reflexionHinweis,
  dauer: { min: 1, max: 20, default: 5, step: 1 },
  disclaimer,                   // Health-Disclaimer, [9]
  sources: string[]
}
```

Die optionale Reflexionsanlage wird zur Laufzeit aus dem Abschnitt `uebung` der
gewählten Farbseite gelesen — kein neuer Redaktionstext.

### `TIMELINE`

```
{
  title, seoTitle, meta,
  lede, hinweis, fallback,
  strands: [{ id, label }],     // chakra, psychologie, chromotherapie,
                                // lichtmedizin, spektrum
  events: [{
    year: number, label: string, strand: string,
    title: string, text: string, sources: string[]
  }],
  sources: string[]
}
```

17 Ereignisse von 1577 bis 2025, jedes mit mindestens einer Nummer aus dem
Register. Nicht aufgenommen sind Newton und Goethe: Für sie liegt im Bestand
keine Quelle vor; die Seite benennt diese Lücke im Methodenabschnitt, statt
Daten zu erfinden.

## Verhalten und Barrierefreiheit

- **Kompass:** native Radio-Gruppe (7 Optionen) in einem `fieldset` mit
  `legend`; Pfeiltasten wechseln die Auswahl. Das Panel wird aus den Daten neu
  aufgebaut, der Fokus bleibt auf dem Radio. Eine screenreader-only
  `role="status"`-Zeile meldet die gewählte Farbwelt kompakt; das Panel selbst
  ist keine Live-Region (sonst würde jeder Pfeiltastendruck den ganzen Block
  vorlesen). Pflichtsatz zur Grenze von Assoziationen steht vor der Auswahl.
- **Farbmeditation:** Start nur auf Klick (kein Autoplay), Dauer 1–20 min über
  beschrifteten Slider mit `output`, Start/Pause/Beenden als native Buttons.
  Der Timer nutzt `Date.now()`-Deltas (kein Tick-Driften) und
  `role="timer"` mit `aria-live="off"`; Zustandswechsel laufen über eine
  separate `role="status"`-Zeile. Kein `localStorage`, kein `sessionStorage`,
  keine Cookies, keine Netzwerkzugriffe, keine Musik. Bei
  `prefers-reduced-motion: reduce` ist die Fläche vollständig statisch; die
  langsame Bewegung (90 s) läuft nur unter `no-preference`. Beim Verlassen der
  Route wird das Intervall gelöscht.
- **Zeitleiste:** vollständige, chronologisch geordnete `<ol>` mit Jahr,
  Strang, Titel, Text und Quellenverweisen. Die Filterleiste (`role="group"`,
  Buttons mit `aria-pressed`) blendet nur aus und ist keine Voraussetzung zum
  Lesen; ein `role="status"` meldet „x von 17 Ereignissen“. Quellenverweise
  sind externe Links auf die Register-URL (keine Hash-Links, damit der Router
  nicht auf `#quelle-n` umschaltet).
- Wiederverwendet: Tokens, `fw-`-Präfix, Karten, Callouts, Fokusregeln aus
  `css/design-system.css`; neue Styles ausschließlich in `css/farbwelten.css`.
  Touch-Ziele: Chips 48 px, Filter/Buttons ≥ 44 px.

## Prüfungen (Ist-Stand)

| Prüfung | Ergebnis |
| --- | --- |
| `npm run build` | grün (`dist/Esoterik-Welt` + Offline-Edition) |
| `npm run lint` | 0 Warnungen |
| `npm run format:check` | grün |
| `npm run test:farbwelten` | 17/17 |
| `npx playwright test tests/farbwelten.spec.js` | 22/22 |
| `node scripts/verify-farbwelten.cjs` | 77 PASS, 0 FAIL (14 Routen × 5 Breiten, Interaktion, 6 Kopfzeilen) |
| `node scripts/verify-farbwelten-rendered.cjs` | 10 Routen, 0 Fehler |
| `node scripts/verify-farbwelten-sync.cjs` | 10 Quellen, 16 Registereinträge, 0 Fehler |
| `npm run test:pages` / `npm run test:offline` | 6/6 · 2/2 |

## Grenzen

- Die Sektion ist eine SPA: „ohne JavaScript lesbar“ heißt hier, dass die
  Zeitleiste als vollständiges, geordnetes Markup vorliegt und die Filter nur
  zusätzlich ausblenden — nicht, dass eine statische HTML-Variante existiert.
  Eine solche würde Redaktionstext in `index.html` duplizieren und dem
  bestehenden Architekturtest widersprechen.
- Der Meditations-Timer läuft im Vordergrund-Tab; bei stark gedrosselten
  Hintergrund-Tabs kann die Anzeige nachhinken, weil sie aus Zeitdeltas neu
  berechnet wird (die Restzeit bleibt korrekt).
- Kein Screenreader-Lauf, keine echten Mobilgeräte, kein Lighthouse in dieser
  Karte — diese Prüfungen gehören zur technischen Abnahme (`t_1cf8b61c`).
