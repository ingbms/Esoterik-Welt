# Schnittstellen

Verträge zwischen UX-Konzept, Produktionscode und Prüfung. Alles hier ist
entweder im Mockup belegt (`mockup/`, `messung/`) oder ausdrücklich als
Produktionsaufgabe markiert.

---

## 1 · DOM-Vertrag

### 1.1 Stabile Anker (IDs)

| ID | Rolle | Element | Zweck |
|---|---|---|---|
| `radWerkstattSeite` | — | `main.container.rad-ws` | Wurzel der Werkstattansicht |
| `radWerkzeug` | — | `div` | Container der vier Panels |
| `wsKicker` | — | `p` | „Werkstatt · Werkzeug n von 4“ |
| `wsTitel` | — | `h1[tabindex="-1"]` | Fokusziel beim Werkzeugwechsel |
| `wsLead` | — | `p.astro-lead` | Einleitung |
| `wsStatus` | `role="status"` `aria-live="polite"` | `p` | **einzige** Live-Region |
| `simLaenge`, `simAmp`, `simDaempfung` | `range` | `input` | Parameter |
| `simLaengeOut`, `simAmpOut`, `simDaempfungOut` | `output[for]` | `output` | Wertanzeige |
| `simPeriode`, `simTheorie`, `simAbw`, `simZeta` | — | `dd` | Messwerte |
| `simBuehne` | `data-running` | `div.rad-lab-stage` | Bewegungszustand |
| `studioFehler` | `role="alert"` `tabindex="-1"` | `div` | Fehlerzusammenfassung |
| `studioTitelFeld` | `maxlength="60"` | `input` | Tafel-Titel |
| `studioLabelList` | `aria-labelledby` | `ul` | Beschriftungen |
| `studioCount` | `data-over` | `span` | „2 von 24“ |
| `studioPlate`, `studioPrintPlate` | `data-style` | `div.rad-studio-plate` | Vorschau / Druckblatt |
| `studioLeerGrund` | — | `p` | Grund für gesperrten Export |
| `expZaehler`, `expBar` | `--p` | `span` | Fortschritt |
| `expStage`, `expZiel`, `expStageText` | `data-hidden` | `div`/`span`/`p` | Bühne |
| `expAnswers` | `fieldset` | — | Antwortknöpfe (`aria-pressed`) |
| `expResult`, `expStats` | `data-hit` | `div`/`dl` | Ergebnis, Statistik |
| `expSperre` | — | `p` | Erklärung der Sperre |
| `journalFrage`, `journalVorhersage`, `journalMethode`, `journalDatum` | — | `input`/`select` | Formular |
| `journalListe` | `ol` | — | Einträge |
| `journalDlgTitel` | `role="dialog"` | `div`/`dialog` | Löschbestätigung |

IDs sind **stabil**. Kein Skript darf eine ID umbenennen; neue Elemente bekommen
eine neue ID, bestehende behalten ihre.

### 1.2 Zustandsattribute

| Attribut | Werte | Bedeutung |
|---|---|---|
| `data-toolpanel="simulator\|studio\|experiment\|journal"` | — | Panelzuordnung; inaktive Panels tragen `hidden` |
| `data-show-in="bereit,laeuft"` | Liste von Zuständen | Sichtbarkeit im Zustand; CSS blendet aus, wenn der aktuelle Zustand nicht in der Liste steht |
| `data-running="true\|false"` | — | Pendelanimation an/aus |
| `data-hidden="true"` | — | Ziel verdeckt (nur Darstellung, **nicht** der Datenspeicher) |
| `data-style="gold\|violett\|pergament"` | — | Tafelstil |
| `data-over="true"` | — | Zähler über Grenze |
| `data-hit="true\|false"` | — | Ergebnis Treffer/Nicht-Treffer |
| `body[data-tool]` | Werkzeugname | steuert die Drucksicht (Studio druckt nur das Blatt) |
| `aria-current="page"` | — | aktive Werkzeugkachel |
| `aria-pressed` | — | Start/Stopp und Antwortknöpfe |

`data-show-in` ist **Darstellung**, nicht Wahrheit. Der Zustand wird im
State-Objekt geführt; das Attribut ist nur die Folge davon.

### 1.3 Fokus- und Fehlerregeln

- Jede Fehlerzusammenfassung: `role="alert"`, `tabindex="-1"`, erste Aktion nach
  dem Absenden ist `element.focus()`.
- Jeder Fehlerlisteneintrag ist ein `<a href="#feldId">`.
- Der H1 hat `tabindex="-1"` und erhält den Fokus beim Werkzeugwechsel.
- Der Dialog setzt den Fokus auf die Überschrift, hält ihn im Dialog, gibt ihn
  beim Schließen an den Auslöser zurück.

---

## 2 · Zustandsobjekt und Adresse

Mockup (Messbarkeit, keine Speicherung):

```js
state = { tool: 'simulator', state: 'bereit', ziel: 3, antwort: null, versuch: 0, treffer: 12, n: 40 }
// gelesen aus: ?tool=<id>&state=<zustand>&w=<breite>&cb=<cachebuster>
```

Produktion (Vorschlag, konsistent mit dem bestehenden Router):

```js
const ROUTE = {
  …bestehend,
  werkstatt: '#pendeln/werkstatt',
  werkzeug: (id) => `#pendeln/werkstatt/${id}`,   // simulator|studio|experiment|journal
};
```

`resolveView()` bekommt einen Fall `werkstatt`; `model.resolve()` prüft
`segments[0] === 'werkstatt'` **vor** der Themenauflösung. Kollision ist
ausgeschlossen: die vorhandenen Themen-Slugs sind `radiasthesie`, `pendeln`,
`orakel` (`js/data/radiasthesie.js`), `werkstatt` ist frei.

Der UI-Zustand (z. B. „Ziel verdeckt“) gehört **nicht** in die Adresse. Die
Adresse nennt das Werkzeug, nicht den Schritt — sonst wäre ein geteilter Link
ein halb ausgeführter Test.

---

## 3 · Speichervertrag (localStorage)

Drei Schlüssel, alle mit Versionssuffix. Kein Konto, keine Kennung, kein Netz.

| Schlüssel | Inhalt | Geschrieben von | Gelöscht von |
|---|---|---|---|
| `esot_rad_journal_v1` | Array von Einträgen | Journal | „Alle Einträge löschen“ |
| `esot_rad_experiment_v1` | Array abgeschlossener Läufe | Test-Labor | dieselbe Löschaktion |
| `esot_rad_studio_v1` | zuletzt genutzte Tafel | Tafel-Studio | dieselbe Löschaktion |

### 3.1 Journal-Eintrag

```json
{
  "id": "jr-2026-11-02-1",
  "date": "2026-11-02",
  "question": "Finde ich den verlorenen Schlüssel im Flur?",
  "method": "Pendel über Tafel",
  "prediction": "Ja, im Flur",
  "confidence": 4,
  "result": "Nicht im Flur gefunden, lag im Auto.",
  "experiment": "exp-2026-10-21-01"
}
```

Regeln: `question` und `prediction` sind Pflicht (1–200 Zeichen), `confidence`
ganzzahlig 1–5, `date` ISO `YYYY-MM-DD`, `result` darf leer bleiben (noch offen),
`experiment` ist `null` oder eine Lauf-ID.

### 3.2 Experiment-Lauf

```json
{
  "id": "exp-2026-10-21-01",
  "mode": "test",
  "kind": "richtung",
  "n": 40,
  "targets": 4,
  "hits": 12,
  "p": 0.4668,
  "ci95": [0.1807, 0.4543],
  "startedAt": "2026-10-21T18:02:00Z",
  "trials": [{ "i": 1, "ziel": 3, "antwort": 3, "t": "2026-10-21T18:02:41Z" }]
}
```

Regeln: `mode: "demo"` wird **nicht** gespeichert und nicht exportiert.
`trials` enthält Ziel und Antwort erst nach dem Aufdecken.

### 3.3 Studio-Tafel

```json
{
  "type": "jaNein",
  "title": "Pendeltafel",
  "labels": ["Ja", "Nein"],
  "style": "gold",
  "numbering": true,
  "savedAt": "2026-11-03T00:12:00Z"
}
```

`type ∈ {jaNein, zahlenkreis, buchstaben, segmente}`; `labels` 2–24 Einträge,
je ≤ 40 Zeichen, Steuerzeichen verboten; `title` ≤ 60 Zeichen.

### 3.4 Schreibfehler

- `QuotaExceededError` → Zustand `voll`, Meldung, **Eingaben bleiben stehen**,
  kein Datenverlust durch stilles Verwerfen.
- Ungültiges JSON beim Lesen → der Schlüssel wird nicht überschrieben, der
  Zustand ist `leer`, die Meldung nennt den beschädigten Schlüssel.
- Schreibvorgänge sind atomar pro Schlüssel (ein `setItem` je Aktion).

---

## 4 · Exportverträge

### 4.1 SVG (Tafel-Studio)

Eine eigenständige Datei, kein Verweis nach außen:

- `<?xml version="1.0" encoding="UTF-8"?>` + `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img">`
- `<title>` und `<desc>` **immer** vorhanden (Zugänglichkeit ohne Kontext)
- Farben ausschließlich über `var(--plate-*)` → beim Export werden die
  aufgelösten Werte geschrieben; keine `url(#…)`-Referenzen nach außen
- **kein** `<script>`, **kein** `xlink:href`, **keine** externen Fonts
- Text wird escaped (`&`, `<`, `>`); ein Label mit `<b>` erscheint als Text
- deterministisch: zwei Exporte derselben Tafel sind byte-identisch

Gemessen (`messung/funktionen.json`, Lauf 2026-11-03T01:55Z):
`bytes = 1097`, `hasTitle = true`, `hasDesc = true`, `hasXmlns = true`,
`externalRefs = 0`, `hasScriptTag = false`, `hasXlink = false`,
`escapedNoRawTag = true`, `escapedText = true`, `deterministic = true`.

Dateiname: `radiasthesie-tafel-<typ>-<YYYY-MM-DD>.svg`.

### 4.2 JSON (Journal, Experiment)

- UTF-8, `\n`, zwei Leerzeichen Einrückung, abschließender Zeilenumbruch.
- Journal-Export: `{ "version": 1, "exportedAt": "…", "entries": [ … ] }`
- Experiment-Export: der Lauf aus §3.2, ohne `demo`.

### 4.3 CSV (Journal)

- Trennzeichen `;`, Kodierung UTF-8 **mit BOM** (Excel-Kompatibilität), `\n`.
- Spalten: `datum;frage;methode;vorhersage;sicherheit;ergebnis;experiment`
- Felder mit `;`, `"` oder Zeilenumbruch werden in `"…"` gesetzt, `"` wird zu `""`.
- Dezimaltrennzeichen in Zahlenfeldern: Komma (`sicherheit` ist ganzzahlig).

### 4.4 PDF

Kein PDF-Paket. PDF entsteht ausschließlich über den Browser-Druckdialog; die
Druckregeln stehen in `DRUCK-SVG-PDF.md`.

---

## 5 · Berechnungsvertrag

Reine Funktionen, im Mockup unter `window.RadWerkstatt` prüfbar:

| Funktion | Vertrag | Geprüfter Wert |
|---|---|---|
| `simValues()` | `T_theorie = 2π√(L/g)` mit `g = 9,81`; gedämpfte Periode `T = 2π/ω_d`, `ω_d = ω_0√(1−ζ²)`, `ζ` auf ≥ 0,0001 begrenzt | L = 0,25 m → 1,003 s, angezeigt „1,00 s“ |
| `binomialExactP(h, n, p)` | exakter zweiseitiger Binomialtest, log-Skalierung, `p = 1/4` | h = 12, n = 40 → 0,46681 |
| `wilsonInterval(h, n, z)` | Wilson-Score-Intervall, `z = 1,95996…`, Rückgabe [0,1] bei n = 0 | 12/40 → 0,1807–0,4543 |
| `validateTafel({labels,title})` | siehe §3.3; Rückgabe `{ok, errors:[{field,message}]}` | leer → 1 Fehler, Label > 40 → 1, Steuerzeichen → 1, Titel > 60 → 1 |
| `buildTafel(type, options)` | erzeugt SVG 600×600 mit `role="img"`, `title`, `desc` | 2 Segmente (Ja/Nein) |
| `exportString(svg)` | §4.1 | 1097 Byte, deterministisch |

Die Produktion muss dieselben Funktionen in getesteten Modulen führen
(`js/modules/radiasthesie-*.js`), nicht im View-Template.

---

## 6 · Einbaupunkte in die Produktion

Additiv, ohne Redesign des Wissensmoduls:

1. **Route** — `js/modules/radiasthesie-format.js`: `werkstatt`, `werkzeug(id)`
   ergänzen; `resolve()` in `radiasthesie-model.js` um den Zweig `werkstatt`
   erweitern; `resolveView()` in `radiasthesie.js` um `case 'werkstatt'`.
2. **Container** — die Werkstatt braucht einen eigenen Wurzelknoten im
   Modul-Template (`#radWerkstattSeite`) statt in `#pendelnRoot` zu hängen;
   sonst würde jeder Werkzeugwechsel die Modulnavigation neu aufbauen.
3. **Landing-Kacheln** — `js/data/radiasthesie.js` → `landing.workshop` hat
   heute **drei** Einträge (Pendellabor, Pendeltafel-Studio,
   Experimentierlabor), alle `state: 'In Vorbereitung'`; das vierte Werkzeug
   (Pendeltagebuch) fehlt. Das Raster `.rad-workshop` steht auf
   `repeat(3, minmax(0,1fr))` (≥ 1101 px), `repeat(2, …)` (701–1100 px) und
   einer Spalte (≤ 700 px). Mit vier Karten: 2 × 2 ab 701 px, eine Spalte
   darunter, `repeat(4, …)` **nicht** (bei 1440 px blieben 316 px je Karte,
   unter der gemessenen Mindestbreite für Instrument + Text).
4. **Kachelinhalt** — Zustandstext statt pauschal „In Vorbereitung“:
   `Fertig`, `In Arbeit`, `Geplant`; das Statusabzeichen `.rad-werk-state`
   bleibt, `--planned` (gestrichelter Rahmen) nur für `Geplant`.
5. **CSS** — `werkstatt.css` als vierte Datei nach `css/radiasthesie.css`
   einbinden oder die Regeln in `css/radiasthesie.css` überführen. Tokens
   bleiben ausschließlich in `css/design-system.css`.
6. **Nicht ändern** — `.astro-*`-Klassen, `.rad-hero`, `.rad-topic`,
   `.rad-status`, `.rad-plate`, Glossar, Suche, Methodik, Quellen.

**Prüfregel für den Einbau:** Kein Diff in `css/main.css`, keine neuen
Farbwerte, keine Änderung an `#pendelnRoot`-Struktur; die vorhandenen Tests
(`tests/radiasthesie.mjs`, `tests/radiasthesie.spec.js`) müssen unverändert
grün bleiben.

---

## 7 · Testvertrag (was die Produktion prüfen muss)

| Test | Prüft |
|---|---|
| Route | `#pendeln/werkstatt` rendert die Werkstatt; unbekanntes Werkzeug → „nicht gefunden“, kein leerer Rahmen |
| Zustandswechsel Labor | Aufdecken ohne gespeicherte Antwort ist unmöglich; Statuszeile nennt den Grund |
| Sperren | Während eines Laufs sind Testart/Zielraum/n änderbar? → nein |
| Storage | Quota-Fehler führt zu `voll`, Eingaben bleiben, kein stiller Verlust |
| Export SVG | deterministisch, `title`/`desc`/`xmlns`, keine externen Referenzen |
| Export CSV | Spalten, `;`-Quoting, BOM |
| Tastatur | Tab-Reihenfolge wie in `TASTATUR-FOKUS-MOTION.md` §2; Escape im Dialog |
| reduced-motion | `animationName = none`, Werte bleiben ablesbar |
| Druck | Panel ausgeblendet, Tafel Papierweiß, Journal-Körper sichtbar |
