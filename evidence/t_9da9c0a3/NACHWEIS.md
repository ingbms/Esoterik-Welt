# Nachweis t_9da9c0a3 — Farbwelten: drei Themenseiten als eigene Routen

Stand: 2026-11-03, Branch `esoterik-welt/t_9da9c0a3-farbwelten-drei-themenseiten-als-eigene`
(Basis `30a2f62`, aufbauend auf `feature/farbwelten-modul`). Kein Push, kein Deployment.

## Was eingebunden wurde

- Neue Routen `#farbwelten/farbtherapie`, `#farbwelten/farbpsychologie`,
  `#farbwelten/lichtmedizin` (plus Sprungmarken `#farbwelten/<slug>/<abschnitt>`).
- Generischer Renderer `renderTopic`: H1, Lede und H2-Abschnitte in der Reihenfolge der
  Redaktionsdatei, mit Sprungmarken, TOC, Brotkrümeln und Fokus auf der Zielüberschrift.
  Abschnittstypen `p`, `list`, `table`, `quote`, `h3`, `timeline`, ergänzt um `sources`
  (Bibliografie des Quellenabschnitts).
- Inhalte ausschließlich aus `content/farbwelten/{farbtherapie,farbpsychologie,lichtmedizin}.md`
  über `scripts/generate-farbwelten-data.cjs` → `js/data/farbwelten.js` (`TOPIC_PAGES`).
  Im Modul steht kein Prosa-Text der drei Seiten (per Test geprüft).
- Register: zweite Gruppe „Themen“ mit drei Zeilen; Einstiege auf der Landing
  (Untergruppen „Übersichten“ und „Themenseiten“); Querverweise von allen sieben
  Farbseiten (nur Links, kein Eingriff in deren Text).
- Meta je Seite: Title ≤ 60, Description ≤ 155, Canonical und `og:url`
  `https://ingbms.github.io/Esoterik-Welt/#farbwelten/<slug>`, OG/Twitter,
  `BreadcrumbList` mit den drei sichtbaren Stationen (Start › Farben › Seitentitel).
  `sitemap.xml` unverändert (Hash-Ansichten sind keine Dokumente).

## Befehle und Ergebnisse

| Befehl | Ergebnis |
| --- | --- |
| `npm run data:farbwelten` | 7 Farbwelten, 3 Themenseiten (6/7/7 Abschnitte, 9/6/9 Quellen), 16 Registereinträge |
| `npm run build` | grün (`dist/Esoterik-Welt`, `Lokal.html`) |
| `npm run lint` | 0 Warnungen |
| `npm run format:check` | „All matched files use Prettier code style!“ |
| `npm run test:farbwelten` | 12/12 |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2 |
| `npx playwright test tests/farbwelten.spec.js` | 22/22 |
| `node scripts/verify-farbwelten-sync.cjs` | 13 Quellen, 16 Registereinträge, 0 Fehler |
| `node scripts/verify-farbwelten-rendered.cjs` | 13 Routen, 0 Fehler |
| `node scripts/verify-farbwelten.cjs` | 76 Prüfungen + 6 Kopfzeilenbreiten, 82 PASS / 0 FAIL |

Browserbasis: eigener lokaler Preview auf Port **3231** (`node index.js` gegen `dist/`).
Die Standardports 3100 und 3111 waren zu Beginn des Laufs durch fremde, veraltete
Preview-Server belegt (ihr `dist` kennt die Themenseiten nicht); deshalb
`E2E_BASE`/`BASE_URL` auf 3231 und für die Prüfskripte Port 8099.

Die beiden eigenen Preview-Server (`127.0.0.1:8099`, `127.0.0.1:3231`) laufen nach
diesem Lauf weiter: ein Beenden war in dieser Sitzung gesperrt (`taskkill`). Sie
liefern nur den lokalen Build aus und können jederzeit beendet werden.

## Befunde im übernommenen Redaktionsstand (korrigiert, ohne neue Inhalte)

1. `farbtherapie.md` zitierte `[25]` (Rollier), ohne die Quelle zu listen. Es gibt im
   geprüften Bestand keinen Eintrag `[25]`; statt eine Angabe zu erfinden, ist die
   Kennung entfernt (Aussage bleibt, Quelle offen). Empfehlung an die Redaktion:
   Belegstelle nachziehen.
2. `farbpsychologie.md`: „dezent perceptioniert“ → „dezent wahrgenommen“.
3. `farbtherapie.md`: „als medizinisches Verfahren zugelassen; Die Herstellerangaben“ →
   kleingeschrieben nach dem Semikolon.
4. `lichtmedizin.md` hatte CRLF-Zeilenenden; auf LF normalisiert (wie die übrigen Dateien).

## Bewusst nicht geändert

- Kein Eingriff in `Lokal*.html`, `js/modules/tarot.js`, `tests/tarot-decks-v2.cjs`,
  `scripts/build-local.cjs`; die vom Build neu erzeugten `Lokal*.html` sind
  zurückgesetzt.
- Keine inhaltliche Freigabe, kein Push, kein Deploy.
- Die drei Seiten enthalten keinen `blockquote`; die Quellenangabe von Zitaten ist im
  Renderer (`<cite>` bei `cite`) und im Generator („Zitattext — [n]“) umgesetzt, aber
  durch den aktuellen Textbestand nicht belegt.

## Nachweise in diesem Verzeichnis

- `verify-farbwelten/report.md`, `verify-farbwelten/results.json` — Browserprüfung
  (H1, Überschriftenfolge, Überlauf, Kontraste, TOC-Sprung, Headerbreiten).
- `verify-farbwelten-sync.json`, `verify-farbwelten-rendered.json` — Quelle→Daten und
  gerenderter Text.
- `register-1440.png`, `einstiege-1440.png` — Registergruppe „Themen“ und Kartengruppe.
- `verify-farbwelten/*-1440.png`, `*-390.png` — Seitenaufnahmen der drei Themenseiten
  und der bestehenden Ansichten.
- `probe-render.cjs`, `probe-elements.cjs` — die Skripte hinter den Aufnahmen.
