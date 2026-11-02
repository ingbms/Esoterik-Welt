# Komponentengrenzen und Verträge für die Werkstatt-Module

Gilt für RAD-07 (Simulator), RAD-08 (Tafel-Studio), RAD-09 (Experimentierlabor),
RAD-10 (Tagebuch). Ziel: vier Module, die einzeln schreibbar, einzeln testbar und
gemeinsam auslieferbar sind — ohne dass eines die Dateien des anderen anfassen muss.

## 1. Gemeinsame Grenzen

### 1.1 Modulvertrag (jede Komponente)

```js
// js/modules/pendel-<werkzeug>.js
export function mount(root, { data, storage, rng, now, onStatus } = {}) {
  // root: HTMLElement, gehört der Komponente für ihre Lebensdauer
  // data: unveränderliche Konfiguration aus js/data/radiasthesie-werkstatt.js
  // storage: Objekt nach §6 (injizierbar → Tests ohne localStorage)
  // rng: () => float in [0,1) (injizierbar → reproduzierbare Tests)
  // now: () => Date (injizierbar → keine fake timers nötig)
  // onStatus: (text, { assertive }) => void  → schreibt in die Live-Region
  return { destroy, getState };
}
```

- **Eine** Komponente = **eine** Datei. Keine Komponente importiert eine andere.
- `destroy()` entfernt alle Listener, bricht `requestAnimationFrame` ab und ruft
  `URL.revokeObjectURL` für erzeugte Blobs. Ohne `destroy()` ist ein
  Routenwechsel ein Leak.
- Komponenten kennen **kein** `history`, **keine** Route und **kein**
  `document.title`. Das bleibt beim Controller (`js/modules/radiasthesie.js`).
- Komponenten schreiben **nicht** in `localStorage` direkt, sondern nutzen den
  injizierten `storage`.

### 1.2 Was der Controller (Werkstatt-Ansicht) besitzt

| Verantwortung | Ort |
| --- | --- |
| H1, Brotkrümel, Einordnungsband, Werkzeugnavigation | `renderWerkstatt` (neu in `radiasthesie-views.js`) |
| Mounten/Unmounten der Komponente | `radiasthesie-werkstatt.js` |
| Fokus nach Routenwechsel auf die H1 | `radiasthesie.js:159-174` (bestehend) |
| Live-Region für Statusmeldungen | `renderWerkstatt` legt **eine** `role="status" aria-live="polite"`-Region an; Komponenten schreiben nur hinein |
| Titel/Description/JSON-LD | `applyMeta` / `placeStructuredData` (bestehend) |

Damit gilt: **eine H1 je Ansicht**, kein Sprung in der Überschriftenhierarchie,
keine zweite Live-Region.

### 1.3 Was keine Komponente darf

- Netzwerkanfragen (kein `fetch`, kein `XMLHttpRequest`, keine externen Bilder,
  keine Fonts) — `verify-pages.cjs` wertet Anfragen außerhalb der Basis als Fehler.
- `innerHTML` mit Nutzereingaben; `eval`, `new Function`, `setTimeout('…')`.
- Neue Design-Tokens oder neue Farbwerte; nur bestehende Tokens.
- Schreiben in `js/data/radiasthesie.js` (generierte Datei).
- Eigene `<script>`-Tags in `index.html`.

## 2. Simulator (RAD-07)

| Grenze | Festlegung |
| --- | --- |
| Verantwortung | Ein Pendel mit einstellbarer Länge, Anfangsauslenkung und Dämpfung simulieren, Bewegung und Schwingungsdauer anzeigen, Mechanik erklären |
| Nicht zuständig | Keine Aussage über „Ausschlagen auf etwas“, keine Zielerkennung, keine Bewertung von Antworten, kein Bezug zu RAD-09 |
| Eingaben | `lengthM` 0,05–1,00 m (Schritt 0,01), `amplitudeDeg` 2–30°, `damping` 0–0,2 (ζ), Start/Stopp, Pendelstil (3 Varianten) |
| Ausgaben | Winkel über Zeit (SVG), aktuelle Periode (s), theoretische Periode `2π√(L/g)`, Abweichung in Prozent, Status (läuft/gestoppt) |
| Physik | Kleine Auslenkung; `g = 9,81 m/s²`; Integrator halbimplizites Euler mit festem `dt = 1/240 s`, Akkumulator gegen Frame-Jitter; bei `prefers-reduced-motion` statische Ruhelage + Werte |
| Fehlerfälle | `lengthM ≤ 0` ⇒ Bereichsgrenzen erzwingen, nie `NaN` rendern; `document.hidden` ⇒ Loop pausieren |
| Testbare Kerne | `period(lengthM, g)`, `step(state, dt, damping, g)`, `deviation(measured, theoretical)` — reine Funktionen, ohne DOM |
| A11y | Slider mit `<label for>`, Werte als Text neben dem Regler, Start/Stopp als `<button>` mit `aria-pressed`, Status über `onStatus` |

## 3. Tafel-Studio (RAD-08)

| Grenze | Festlegung |
| --- | --- |
| Verantwortung | Vier Tafeltypen erzeugen, Beschriftungen und Farbstil wählen, als SVG exportieren, Druckansicht anbieten |
| Nicht zuständig | Keine Deutung der Tafel, keine Wahrscheinlichkeitsaussage, kein PDF-Rendering im Browser (nur Druckdialog) |
| Tafeltypen | `jaNein` (2 Segmente + Mitte), `zahlenkreis` (1–9 oder 1–12), `buchstaben` (A–Z, optional Umlaute), `segmente` (freie Liste, 2–24) |
| Eingaben | Segmentliste (je ≤40 Zeichen), Titel (≤60), Farbstil `gold | violett | pergament`, optional Nummerierung |
| Ausgaben | SVG-String (deterministisch, mit `<title>`/`<desc>`, ohne externe Referenzen), Download, Druckseite |
| Validierung | Anzahl 2–24, keine Steuerzeichen (`\u0000-\u001F`, `\u007F`), keine Leerstrings nach `trim`, Duplikate erlaubt aber sichtbar durchnummeriert |
| Escaping | Jede Beschriftung durch `escapeHtml`; SVG-Textknoten zusätzlich über `textContent`, nicht per String-Konkatenation mit Rohdaten |
| Import | Nur eigenes JSON (Schema §7.2), ≤1 MB, unbekannte Felder werden ignoriert, fehlende Pflichtfelder ⇒ Abbruch mit Feldnamen |
| Druck/PDF | `@media print`: nur Tafel + Titel, Navigation/Footer `display:none`; `window.print()` als einziger PDF-Weg (U2) |
| Testbare Kerne | `buildTafel(type, options)` → `{ segments, svg }`, `validateTafel(input)` → `{ ok, errors[] }` |

## 4. Experimentierlabor (RAD-09)

| Grenze | Festlegung |
| --- | --- |
| Verantwortung | Verblindete Testreihe mit vorab festgelegtem Protokoll, unveränderlicher Antwort, Auswertung und Export |
| Nicht zuständig | Keine Aussage „Pendeln funktioniert“, keine Diagnose, kein Personenbezug, kein Vergleich zwischen Nutzern |
| Protokoll (vor Start) | `testType` (z. B. `richtung`, `zahl`, `symbol`), `k` (Zielraum 2–10), `n` (geplante Versuche 10–200), `stopRule` (`fixed-n`), `analysis` (`binomial-exact`, `wilson-95`) |
| Ablauf | Ziel ziehen → verdeckt halten → Antwort erfassen → **persistieren** → enthüllen → auswerten. Die Reihenfolge ist Vertrag, nicht UI-Detail |
| Unveränderlichkeit | Nach dem Speichern `locked: true`; keine Korrektur, kein Löschen einzelner Antworten (nur ganzer Lauf) |
| Zufall | `crypto.getRandomValues` mit Rejection Sampling; im Test mulberry32 mit Seed |
| Statistik | Treffer `h`, Erwartung `n/k`, exakter zweiseitiger Binomialtest, Wilson-95 %-Intervall, `p` auf 4 Nachkommastellen; keine Normalapproximation bei kleinem `n` |
| Mehrfachtests | `batchId` je Sitzung; Hinweis im Ergebnis, dass mehrere Läufe die Fehlerrate erhöhen; keine automatische Korrektur |
| Modi | `demo` (frei spielbar, klar beschriftet, **nicht** in Statistik) und `test` (protokolliert, exportierbar) |
| Informationsleck | Ziel darf vor dem Speichern der Antwort nicht im DOM, nicht im `storage` und nicht im Seitentitel stehen; Test prüft das |
| Testbare Kerne | `drawTarget(k, rng)`, `binomialExactP(h, n, p)`, `wilsonInterval(h, n)`, `createRun(protocol)`, `answer(run, value)`, `reveal(run)` |

## 5. Pendeltagebuch (RAD-10)

| Grenze | Festlegung |
| --- | --- |
| Verantwortung | Persönliche Einträge lokal erfassen, ansehen, exportieren, vollständig löschen |
| Nicht zuständig | Kein Konto, kein Sync, kein Teilen, keine Auswertung „Ihrer Trefferquote“ (die gehört zu RAD-09) |
| Felder | `date` (ISO `YYYY-MM-DD`), `question` ≤200, `method` (Auswahl aus fester Liste), `prediction` ≤200, `confidence` 1–5, `result` ≤500, `review` ≤500, `experimentId?` |
| Pflichtfelder | `date`, `question`, `prediction`; alles andere optional |
| Anzeige | Liste nach Datum absteigend, Filter „alle / mit Experimentbezug“, Eintrag aufklappbar (`<details>`) |
| Löschung | „Alle Einträge löschen“ entfernt **alle** Schlüssel mit Präfix `esot_rad_` nach Bestätigung; Erfolg wird in der Live-Region gemeldet |
| Zusammenarbeit mit 09 | Übernahme eines Laufs erzeugt Eintrag mit `experimentId`; Vorhersage = gegebene Antwort, Ergebnis = Treffer/Nicht-Treffer; keine Rückwirkung auf den Lauf |
| Testbare Kerne | `createEntry(input)`, `validateEntry(input)`, `toCsv(entries)`, `fromJson(text)` |

## 6. Speichervertrag

### 6.1 Schlüssel und Umschlag

| Schlüssel | Inhalt | Max. Einträge |
| --- | --- | --- |
| `esot_rad_journal_v1` | Tagebucheinträge | 500 |
| `esot_rad_experiment_v1` | Experimentläufe (inkl. Antworten) | 2.000 Antworten gesamt |
| `esot_rad_studio_v1` | zuletzt genutzte Tafelkonfiguration | 1 Objekt (kein Verlauf) |

Umschlag, immer:

```json
{ "schema": 1, "savedAt": "2026-11-03T00:00:00.000Z", "data": [] }
```

- `schema` ist eine Ganzzahl und wird bei inkompatiblen Änderungen erhöht;
  unbekannte höhere Schemata werden **nicht** überschrieben, sondern gemeldet.
- Lesen: `JSON.parse` in `try/catch`; bei Fehler oder falschem Umschlag wird der
  Rohwert unter `esot_rad_corrupt_<key>_<timestamp>` gesichert und der Schlüssel
  geleert — kein stiller Datenverlust, kein Throw in die UI.
- Schreiben: `try/catch` um `setItem`; `QuotaExceededError` ⇒ Meldung „Speicher
  voll — exportieren und alte Einträge löschen“, Zustand bleibt im Speicher.
- Kein `localStorage` (Datei-Edition, privater Modus) ⇒ In-Memory-Fallback mit
  sichtbarem Hinweis „Einträge gelten nur für diese Sitzung“.
- Kein Debounce unter 300 ms; Schreiben erst nach erfolgreicher Validierung.

### 6.2 Datensparsamkeit

- Keine Namen, E-Mail-Adressen, Standorte, Geburtsdaten als Pflichtfelder.
- Kein Feld „Gerätekennung“, kein Zeitstempel außer `savedAt`/`date`.
- Kein Netzwerk, keine Telemetrie, kein Cookie; nichts verlässt den Browser.
- Vollständige Löschung ist ein **Feature**, nicht ein verstecktes Menü.

## 7. Exportvertrag

### 7.1 Formate

| Format | Erzeugung | Regeln |
| --- | --- | --- |
| JSON | `JSON.stringify({schema, exportedAt, app: 'esoterik-welt', kind, data}, null, 2)` | UTF-8, keine Funktionswerte, stabile Schlüsselreihenfolge |
| CSV | eigener Serializer | UTF-8 **mit BOM**, Trenner `;`, Quoting nach RFC 4180 (`"` → `""`), Zeilenende `\r\n` |
| SVG | String aus `buildTafel` | `<title>`/`<desc>`, keine externen Referenzen, keine Skripte |
| PNG | Canvas aus dem SVG | nur wenn ohne Zusatzabhängigkeit möglich; sonst weglassen und dokumentieren |
| PDF | `window.print()` mit `@media print` | keine PDF-Bibliothek (U2); Hinweis „Im Druckdialog als PDF speichern“ |

### 7.2 Dateinamen und Download

```
radiasthesie-<kind>-<YYYY-MM-DD>.<ext>      z. B. radiasthesie-journal-2026-11-03.json
```

Ablauf: `Blob` → `URL.createObjectURL` → `<a download>` → Klick → **sofort**
`setTimeout(() => URL.revokeObjectURL(url), 0)`; Status in der Live-Region
(„12 Einträge exportiert“). Kein automatischer Download ohne Nutzeraktion.

### 7.3 Import

Nur JSON, ≤1 MB, `schema` muss zur erwarteten Version passen; Validierung vor
dem Schreiben; bei Teilfehlern **nichts** schreiben (atomar) und die erste
fehlerhafte Stelle nennen. CSV-Import ist **nicht** vorgesehen (Verlust von
Typen), das wird im UI gesagt.

## 8. Eingabevalidierungsvertrag

| Regel | Wert | Durchsetzung |
| --- | --- | --- |
| Maximallängen | Beschriftung 40 · Titel 60 · Frage 200 · Vorhersage 200 · Ergebnis 500 · Bewertung 500 | `maxlength` **und** Prüfung im Modell (Attribut ist umgehbar) |
| Steuerzeichen | `\u0000-\u001F`, `\u007F` ablehnen (außer `\n` in mehrzeiligen Feldern) | `validate*` |
| Leerzeichen | `trim()`, leer ⇒ Pflichtfeldverletzung | `validate*` |
| HTML | nicht filtern, sondern **escapen** und literal anzeigen | `escapeHtml` (`format.js:19`), `textContent` für SVG |
| Zahlen | `Number.isFinite`, Bereichsgrenzen, keine `parseInt`-Toleranz | `validate*` |
| Datum | `^\d{4}-\d{2}-\d{2}$` und gültiges Kalenderdatum | `validate*` |
| Import | Schema, Größe, Typen; unbekannte Felder ignorieren; Pflichtfelder prüfen | `fromJson` |
| Fehlermeldung | Feldname + Regel, in der Live-Region; Fokus auf das erste fehlerhafte Feld | UI-Schicht |

**Verboten:** `eval`, `new Function`, `innerHTML` mit Nutzerdaten, `document.write`,
String-Konkatenation von SVG mit ungeprüften Werten.

## 9. Barrierefreiheit als Vertrag

- Jedes Bedienelement per Tastatur erreichbar; Fokusreihenfolge = DOM-Reihenfolge.
- Statusänderungen (Start/Stopp, gespeichert, exportiert, Fehler) über **eine**
  `role="status"`-Region; Fehler zusätzlich `aria-live="assertive"` nur bei
  Datenverlustgefahr.
- `prefers-reduced-motion: reduce` ⇒ keine Daueranimation; Werte bleiben sichtbar.
- Touch-Ziele ≥ 44 × 44 px; Slider zusätzlich mit Zahleneingabe.
- Farbe nie allein: Treffer/Fehler mit Text („Treffer“, „kein Treffer“).

## 10. Was Tests mindestens festhalten müssen

| Bereich | Prüfung |
| --- | --- |
| Physik | `period(0,25) ≈ 1,003 s` (±1 %), Dämpfung verkürzt Amplitude monoton, `dt`-Wechsel ändert Ergebnis nicht |
| Statistik | `binomialExactP(60,100,0.5) ≈ 0,056`, `wilsonInterval(0,10)` untere Grenze 0, `wilsonInterval(10,10)` obere Grenze 1 |
| Blinding | Nach `answer()` ist der Lauf persistiert und `revealedAt === null`; `reveal()` ohne Antwort wirft |
| Validierung | `<script>` in einer Beschriftung erscheint escaped im SVG/HTML; 41 Zeichen werden abgelehnt; Steuerzeichen abgelehnt |
| Speicher | Korrupter Wert ⇒ Sicherungsschlüssel existiert, kein Throw; voller Speicher ⇒ Meldung, In-Memory-Zustand bleibt |
| Export | CSV mit BOM und `;`, Anführungszeichen verdoppelt; JSON round-trip gleich; Objekt-URL wird freigegeben |
| Lebenszyklus | `destroy()` entfernt Listener und bricht `rAF` ab (Zähler nach `destroy()` konstant) |

## 11. Verhältnis zur statischen Ausgabe (RAD-12)

Die Werkzeuge 07–10 sind **Funktionen, keine Dokumente**. Daraus folgt:

- Statische HTML-Seiten enthalten den redaktionellen Text und verweisen für die
  Werkzeuge auf `../index.html#pendeln/labor` (bzw. `…/studio`, `…/experimente`,
  `…/journal`). Kein Werkzeug-Markup in statischen Seiten, keine zweite
  Bedienoberfläche.
- Werkzeug-Zustand (Journal, Experimentläufe) ist **nie** Teil der statischen
  Ausgabe und wird nicht vorgerendert — sonst entstünde ein Datenschutzproblem
  und ein Canonical-Duplikat.
- Die statischen Seiten tragen `BreadcrumbList` auf sich selbst; die
  SPA-Ansichten setzen ihr Canonical auf die jeweilige statische URL
  (`INTEGRATIONSPUNKTE.md` §2.12). Damit bleibt der Hash-Router
  Interaktionsschicht, ohne mit den Dokumenten zu konkurrieren.
