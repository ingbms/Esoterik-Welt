# ESOW-RAD-10 — Checkpoint: Pendeltagebuch

Stand: 3. November 2026 · Arbeitsbaum `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`,
Branch `feature/radiasthesie-modul` · kein Push, kein Deployment.

## 1. Was jetzt existiert

Echte Route **`#pendeln/journal`** mit einem persönlichen Experimentierjournal.
Es speichert ausschließlich lokal, ohne Konto, ohne Server, ohne Tracker und
ohne Netzwerkanfrage.

| Feld | Regel |
| --- | --- |
| Datum | Pflicht, ISO `YYYY-MM-DD`, gültiges Kalenderdatum (Tag der Beobachtung) |
| Frage oder Versuch | Pflicht, 3–200 Zeichen |
| Verwendete Methode | optional, Auswahl aus dem Methodenkatalog (`WERKSTATT.methoden`) |
| Eigene Vorhersage | Pflicht, 1–200 Zeichen |
| Subjektive Sicherheit | optional, ganze Zahl 1–5 mit Textlabel („4 von 5 · eher sicher“) |
| Tatsächliches Ergebnis | optional, bis 500 Zeichen, mehrzeilig |
| Spätere Bewertung | optional, bis 500 Zeichen, mehrzeilig |
| Experimentbezug | optional `experimentId` + `runId`, nur gemeinsam und nur auf einen vorhandenen Lauf |

Weiteres Verhalten:

- **Liste** nach Datum absteigend, Eintrag aufklappbar (`<details>`), Filter
  „alle / mit Experimentbezug“, Bearbeiten und einzelnes Löschen (zweistufig).
- **Zusammenarbeit mit RAD-09:** Abgeschlossene, vollständig enthüllte Läufe
  aus `esot_rad_experiment_v1` werden angeboten. „Ins Tagebuch übernehmen“
  erzeugt über `entryFromRun` einen Eintrag mit stabilem `experimentId`/`runId`;
  Vorhersage und Ergebnis stammen aus dem Protokoll. Der Lauf wird **nicht**
  verändert (im Test byteweise verglichen). Ein Lauf ist nur einmal übernehmbar.
- **Export:** alle Einträge als JSON (eigener Umschlag `kind: journal`) und als
  CSV (UTF-8 mit BOM, `;`, RFC-4180-Quoting, CRLF). Zusätzlich die gespeicherten
  Experimentläufe als JSON, weil die vollständige Löschung sie mit entfernt.
- **Import:** nur eigenes JSON, ≤ 1 MiB, ≤ 500 Einträge, atomar (ein ungültiger
  Eintrag lehnt die ganze Datei ab), unbekannte Felder werden verworfen. CSV-
  Import ist bewusst nicht vorgesehen (Typverlust) und wird im UI gesagt.
- **Vollständige Löschung:** zweistufig bestätigt; entfernt jeden Schlüssel mit
  Präfix `esot_rad_` — Tagebuch, Experimentläufe, Tafelkonfiguration und
  Sicherungskopien defekter Stände. Fremde Schlüssel bleiben (getestet).
- **Datensparsamkeit:** keine Namen, keine E-Mail, kein Standort, keine
  Gerätekennung, kein Cookie, keine Telemetrie. Gespeichert werden nur die
  Vertragsfelder plus `id` und `createdAt`; Zusatzfelder aus einem Import werden
  nicht übernommen (`sanitizeEntry`).

### Speicherverhalten (Vertrag §6)

| Fall | Verhalten |
| --- | --- |
| leer | Leerzustand, keine Meldung |
| defektes JSON / falscher Umschlag | Rohwert unter `esot_rad_corrupt_esot_rad_journal_v1_<stamp>` gesichert, Schlüssel geleert, Meldung in der Live-Region, kein Throw |
| Schema > 1 | wird **nicht** überschrieben: Speichern, Import und Laufübernahme sind blockiert, bis die neuere Version geladen ist |
| Quota voll | Meldung „Speicher voll — exportieren und alte Einträge löschen“; Eintrag gilt sichtbar nur für die Sitzung |
| kein `localStorage` (privat, `file://` gesperrt) | In-Memory-Fallback, sichtbarer Hinweis „nur für diese Sitzung“ |
| > 500 Einträge in der Datei | lädt die ersten 500 und meldet das; Schreiben über 500 wird abgelehnt |

### Vertragsentscheidungen dieser Karte

1. **Route `#pendeln/journal`** (nicht `journal/…`), ohne Query-Zustand: Einträge
   liegen im Browser und dürfen nicht über eine teilbare Adresse erscheinen.
2. **Löschung nach Präfix** `esot_rad_` statt nur des Journal-Schlüssels — so
   verlangt es `KOMPONENTENGRENZEN.md` §5/§6; die UI nennt die Mitlöschung der
   Experimentläufe ausdrücklich.
3. **Historischer Laufbezug:** Wird ein Eintrag bearbeitet, dessen Lauf
   inzwischen gelöscht wurde, bleibt der Bezug als Text erhalten und die
   Bearbeitung möglich (Struktur wird geprüft, Existenz nicht). Neue Bezüge
   werden gegen die vorhandenen Läufe geprüft. Export und Import prüfen
   ebenfalls nur die Struktur, damit ein Gerätewechsel das eigene Tagebuch
   nicht unlesbar macht.
4. **Kein automatischer Export, kein automatischer Download.** Jeder Export ist
   eine Nutzeraktion; die Löschung exportiert nichts von selbst.
5. **Kein Konto, kein Sync, kein Mehrbenutzerbetrieb.** Zwei Tabs überschreiben
   sich nach dem Last-Write-Wins-Prinzip; das ist ein bewusst offener Restpunkt.

## 2. Dateien

| Datei | Zeilen | Inhalt |
| --- | --- | --- |
| `js/modules/journal-speicher.js` | 491 | Umschlag, Defekt-/Schema-/Quota-Behandlung, Listenoperationen, `buildEntry`, CSV/JSON, Import, Zusammenführung, Löschung (DOM-frei) |
| `js/modules/pendel-journal.js` | 938 | Bedienung: Formular, Liste, Bearbeiten, Löschen, Export/Import, Laborübernahme, Schema-Schutz, Live-Region, `destroy()` |
| `tests/journal-speicher.mjs` | 646 | 26 Node-Tests (Speicher, CRUD-Hilfen, Vertrag, Laufbezug, CSV/JSON, Import, Löschung, Route/Ansicht) |
| `tests/pendel-journal.spec.js` | 555 | 10 Browsertests (CRUD, Grenzen/XSS, Export/Import, Löschung, Laborübernahme, mobil, gesperrter Speicher, neueres Schema, `file://`) |

Geändert: `radiasthesie-views.js` (`renderJournal`), `radiasthesie-model.js`
(Route), `radiasthesie-format.js` (`ROUTE.journal`), `radiasthesie.js`
(Mount/Teardown), `css/radiasthesie.css` (`.jr-*`, ~440 Zeilen),
`scripts/generate-radiasthesie-data.cjs` + `js/data/radiasthesie.js`
(Werkstatt-Karte „Pendeltagebuch“ → 4 verfügbare Werkzeuge),
`docs/radiasthesie-konzept/inhalte/pendeln.md` (§10), `package.json`
(`test:radiasthesie:journal`, `test:all`), `tests/radiasthesie.mjs`
(Kopierliste + Route), `tests/radiasthesie-simulator.mjs` und
`tests/experiment-statistik.mjs` (Werkstattzahl 3 → 4), `tests/radiasthesie.spec.js`
(Route + Werkstattzahl), `Lokal.html` (generiert).

SHA-256 (Kurzform, committeter Stand): `journal-speicher.js`
`b0980168706df717`, `pendel-journal.js` `1d86e341a796f7b5`,
`css/radiasthesie.css` `a70c74560d303dc8`, `radiasthesie-views.js`
`36e8d83e9f4b3888`.

## 3. Commits

| Commit | Inhalt |
| --- | --- |
| `de93baa` | Feature, Tests, Werkstatt-Karte/Inhalt, generierter Offline-Build |
| `5a9b3e0` | Fix: neueres Schema blockiert Schreiben, Import und Übernahme; neuer Browsertest |
| `ac143e7` | Checkpoint und erste Browser-Nachweise |
| dieser Commit | aktualisierte Nachweise und Testzahlen |

Basis: `589a387` (RAD-09 Checkpoint). Kein Push. Weitere Commits dieser Karte
(Textkorrekturen, aktualisierte Nachweise) stehen in
`git log --oneline 589a387..HEAD`.

## 4. Wirklich ausgeführt

Alles unten wurde in diesem Lauf ausgeführt; Ausgaben sind nicht rekonstruiert.

| Prüfung | Ergebnis |
| --- | --- |
| `node --test tests/journal-speicher.mjs` | **26/26** |
| `npx playwright test tests/pendel-journal.spec.js` (E2E_PORT=3418) | **10/10** |
| `npm run test:unit` (Jest) | 2/2 |
| `npm run test:pages` | 6/6 |
| `npm run test:crystals` / `test:astrologie` | 9/9 · 21/21 |
| `npm run test:radiasthesie` | 16/16 |
| `npm run test:radiasthesie:vertraege` | 19/19 |
| `npm run test:radiasthesie:simulator` | 21/21 |
| `npm run test:radiasthesie:tafeln` | 37/37 |
| `npm run test:radiasthesie:experiment` | 24/24 |
| `npm run test:tarot` / `:decks` / `test:moon` | 11/11 · 12/12 · 14/14 |
| `npm run test:offline` | 2/2 (Chromium, `file://`) |
| `E2E_PORT=3418 npm run test:e2e` | **132/132** (122 bestehende + 10 neue RAD-10) |
| `npm run lint` | 0 Fehler, 0 Warnungen |
| `npx prettier --check` (alle eigenen Dateien) | sauber |
| `npm run build` / `build:local` | grün, genau ein Offline-Bundle |
| `npm run verify:build` | 36 Seiten/Viewports, 0 Fehler |

Umgebungsbefund: Auf Port 3100 und 3210 laufen **fremde, ältere Vorschau-
Server** (IPv6-Wildcard) mit einem alten `dist`-Stand. Sie wurden nicht
angefasst; alle Browserläufe liefen deshalb mit `E2E_PORT=3418`.

## 5. Browser-Nachweise

`docs/radiasthesie-completion/RAD-10/evidence/`:

| Bild | Zeigt |
| --- | --- |
| `desktop-leerzustand.png` | leere Liste, deaktivierte Exporte, Speicherhinweis „0 von 500“ |
| `desktop-eintrag.png` | Eintrag mit Datum, Methode, Sicherheit, Ergebnis, Bewertung (aufgeklappt) |
| `desktop-labor-uebernahme.png` | übernommener RAD-09-Lauf mit Trefferzahl, Abschlusszeit und „Bereits übernommen“ |
| `desktop-loeschen-scharf.png` | scharf geschaltete Löschung mit lesbarem Text und Warnhinweis |
| `mobile-tagebuch.png` | 390 px, einspaltig, keine Überläufe, Ziele ≥ 44 px |
| `file-offline-tagebuch.png` | `file://`-Build mit gespeichertem Eintrag nach Reload |

Geprüft wurden darin unter anderem: Anlegen/Lesen/Bearbeiten/Löschen über
Reload hinweg, Literal-Anzeige von `<script>` (kein `window.__jrXss`, escaped),
Ablehnung von leerem Datum, zu kurzer Frage und fehlender Vorhersage, JSON-
und CSV-Download (Envelope, BOM, `;`, CRLF, Quoting), Import per Textarea und
Datei, atomare Ablehnung, Löschung aller `esot_rad_`-Schlüssel bei Erhalt
fremder Schlüssel, Übernahme eines echten 20-Versuche-Laufs ohne Veränderung
des Laufs, gesperrter `localStorage` mit Sitzungshinweis, neueres Schema ohne
Überschreiben.

## 6. Restpunkte / offene Befunde

1. Nur Chromium 155 geprüft; kein Firefox/Safari-Lauf.
2. Kein Screenreader-Lauf; Tastaturreihenfolge und Live-Region sind geprüft,
   die Ansage selbst nicht mit einem echten Screenreader.
3. Lighthouse nicht gefahren.
4. Quota ist mit Speicher-Attrappe geprüft, nicht mit einem tatsächlich vollen
   Browser-Speicher.
5. `localStorage` ist **nicht verschlüsselt**; wer den Browserprofil-Ordner
   lesen kann, liest die Einträge. Das ist die Grenze einer rein lokalen
   Speicherung ohne Konto und steht so auf der Speicherkarte der Seite.
6. Zwei Tabs synchronisieren nicht; der letzte Schreibvorgang gewinnt. Kein
   `storage`-Event-Handler, bewusst außerhalb dieses Pakets.
7. `file://`-Dauerhaftigkeit ist browserabhängig. Der Test akzeptiert daher
   entweder den persistenten Eintrag oder den sichtbaren Sitzungshinweis; in
   Chromium 155 blieb der Eintrag nach Reload erhalten.
8. CSV-Import fehlt absichtlich (Vertrag §7.3).
9. „Alle eigenen Daten löschen“ entfernt auch Experimentläufe und
   Sicherungskopien; das ist im UI benannt und getestet.
10. `npm run test:e2e` nutzt ohne `E2E_PORT` Port 3100 und würde dort den
    fremden alten Server wiederverwenden. Für reproduzierbare Läufe
    `E2E_PORT=3418` setzen (siehe §4).
11. Der CI-Workflow ruft die Radiästhesie-Tests weiterhin nicht auf
    (`test:all` enthält `test:radiasthesie:journal`, der Workflow nicht).
12. Fremde, uncommittete Änderungen wurden nicht angefasst:
    `docs/radiasthesie-completion/RAD-08/evidence/pendeltafel-studio-druck.pdf`,
    die RAD-09-Evidence-PNGs, `assets/radiasthesie/media/`,
    `docs/radiasthesie-completion/RAD-02/`, `RAD-05/`, `evidence/`.

## 7. Nächster Schritt

RAD-10 ist umgesetzt und verifiziert. Für die Abnahme der 14 Pakete bleibt die
Gesamtmatrix offen (u. a. Störfeld-Landkarte und die redaktionellen Pakete nach
RAD-10); dieser Checkpoint ist **keine** Abnahme des Gesamtvorhabens. Die
Werkstatt der Landingpage hat jetzt vier verfügbare Werkzeuge, alle verlinkt.
