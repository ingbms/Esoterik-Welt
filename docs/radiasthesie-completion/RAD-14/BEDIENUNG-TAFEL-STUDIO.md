# Bedienungsanleitung — Pendeltafel-Studio

**Route:** `#pendeln/studio` · **Paket:** RAD-08 · **Export:** SVG, JSON-Konfiguration, Druck/PDF
**Voraussetzungen:** JavaScript aktiv, aktueller Browser; für den PDF-Weg der Druckdialog des Browsers.

## 1. Wozu das Werkzeug da ist

Das Studio stellt eine Pendeltafel zusammen: Vorlage wählen, Segmente beschriften,
Farbstil wählen, als SVG herunterladen oder über die Druckansicht auf Papier
bringen. Es ist ein **Gestaltungswerkzeug**, kein Messinstrument.

Was es **nicht** tut: Es misst nichts, es beantwortet nichts, und es behauptet
nicht, dass eine Tafel eine Antwort erzeugt. Die Bedeutung der Segmente bleibt
eine Vereinbarung der Person, die die Tafel benutzt — dieser Satz steht auch auf
der Seite.

## 2. Aufbau der Seite

| Bereich | Inhalt |
| --- | --- |
| Editor | Vorlage (`ptfPreset`), Überschrift der Tafel (max. 60 Zeichen), Farbstil (Messing, Salbei, Nachtrose, Papier), Beschriftungen — eine Zeile je Segment |
| Aktionen | `SVG herunterladen`, `Konfiguration (JSON)`, `Drucken / PDF` |
| Import | `JSON-Datei` oder „oder JSON einfügen“, dann `Importieren` (max. 32 KiB) |
| Vorschau | gerenderte Tafel im Farbstil, mit Status- und Fehlerbereich |
| Druckfläche | A4-Seite im DOM, nur beim Drucken sichtbar |

## 3. Erste Schritte

1. `#pendeln/studio` öffnen (Startseite → Werkstatt → „Pendeltafel-Studio“).
2. Vorlage wählen — z. B. `Ja/Nein-Tafel` (JA links, NEIN rechts) oder
   `Buchstabentafel A–Z` (26 Segmente, A oben).
3. Überschrift ändern; sie erscheint im Bild und in der Druckansicht.
4. Farbstil wählen; die Vorschau wechselt sofort.
5. Beschriftungen bearbeiten — **eine Zeile pro Segment**, Reihenfolge im Kreis.
   Weichen die Zeilen von der Vorlage ab, zeigt das Auswahlfeld
   „Eigene Beschriftungen“; die Vorlage bleibt als Schema-Angabe erhalten.
6. `SVG herunterladen` für die Weiterverarbeitung, `Konfiguration (JSON)` für
   spätere Änderungen, `Drucken / PDF` für Papier oder „Als PDF speichern“.

## 4. Vorlagen

| Vorlage | Segmente | Aufbau |
| --- | --- | --- |
| Ja/Nein-Tafel | 2 | zwei Hälften, JA links, NEIN rechts |
| Zahlenkreis 0–9 | 10 | Ziffern 0–9, 0 oben |
| Buchstabentafel A–Z | 26 | A–Z, A oben |
| Segmenttafel · vier Felder | 4 | JA, NEIN, UNKLAR, OFFEN |
| Segmenttafel · sechs Felder | 6 | 1–6, 1 oben |
| Segmenttafel · zwölf Felder | 12 | 1–12, 1 oben |

Frei beschriftbar sind 2 bis 48 Segmente. Die zulässige Zeichenlänge je
Beschriftung hängt von der Segmentzahl ab, damit nichts überlappt: bei 2
Segmenten 38 Zeichen, bei 12 zwölf, bei 26 sechs, bei 48 drei (zusätzlich gilt
eine harte Obergrenze von 40 Zeichen).

## 5. Exportwege und was sie enthalten

| Ausgabe | Format | Inhalt | Geeignet für |
| --- | --- | --- | --- |
| `SVG herunterladen` | SVG, `viewBox 600 × 660` | Titel, Beschreibung, Segmente, Fußzeile; Texte XML-escaped | Druck, Weiterverarbeitung, Weitergabe als Zeichnung |
| `Konfiguration (JSON)` | JSON | `schema`, `preset`, `title`, `palette`, `labels` | erneutes Laden, Weitergabe ohne Zeichnung |
| `Drucken / PDF` | Browserdruck, `@page A4` | A4-Fläche mit Überschrift, Tafel, Fußzeile | Papier, „Als PDF speichern“ |

Der PDF-Weg nutzt ausschließlich den Druckdialog des Browsers; im Projekt gibt es
keine PDF-Bibliothek (Entscheidung E6 in RAD-08). Ein echtes PDF wurde über
`page.pdf()` (Chromium, Druck-CSS) erzeugt und geprüft: eine Seite, MediaBox
594,96 × 841,92 pt. Der interaktive Dialog selbst wurde nicht bedient.

## 6. Import

- Zwei Wege, ein Prüfpfad: Datei (`JSON-Datei`) oder eingefügter Text
  („oder JSON einfügen“), dann `Importieren`.
- Akzeptiert wird **nur** das eigene Schema mit den Feldern `schema`, `preset`,
  `title`, `palette`, `labels`. Unbekannte Felder — auch `onload`, `href`,
  `style`, `__proto__` — führen zur Ablehnung.
- Grenzen: 32 KiB, 2–48 Segmente, Überschrift ≤ 60 Zeichen, keine Steuerzeichen,
  kein `<` und `>` in Beschriftungen.
- Fehler erscheinen als Liste (`role="alert"`), betroffene Felder werden mit
  `aria-invalid` markiert; die Vorschau bleibt beim letzten gültigen Stand.
- **SVG-Import gibt es nicht.** Fremdes SVG kann nicht in die Anwendung gelangen;
  das ist die wichtigste Sicherheitsentscheidung dieses Werkzeugs.
- Export → Reimport ergibt dieselbe Zeichnung (getestet).

## 7. Bedienung ohne Maus

- `Tab` erreicht Auswahlfeld, Textfeld, Farbwahl, Aktionsknöpfe, Importfelder.
- Die Tafelvorschau ist ein Bild mit `role="img"` und Beschreibung; die
  Segmenttexte stehen zusätzlich im Formular.
- Statusmeldungen laufen über `role="status"`/`aria-live="polite"`.
- Beim Verlassen der Route räumt `destroy()` Listener und die Druckklasse
  `html.ptf-print-active` ab; der Ausdruck anderer Seiten bleibt unberührt.

## 8. Grenzen

- **Keine Messung, keine Antwort.** Die Tafel ist ein Ordnungsschema.
- **Kein teilbarer Link.** Die Konfiguration steht bewusst nicht in der Adresse
  (Entscheidung E4); weitergegeben wird per Datei.
- **Druck/PDF über den Browser.** Kein eigener PDF-Renderer, keine
  Druckertreiber-Prüfung.
- **Nur Chromium geprüft** (17 Browsertests, 37 Modultests).
- **Kein Screenreader-Lauf**; Labels, Fokus und `aria-invalid` sind geprüft.
- **Kein Speicher.** Nichts wird im Browser abgelegt; ein Reload verwirft die
  Tafel. Das ist Absicht und wird im Tagebuch-Hinweis nicht als Datenverlust
  geführt.

## 9. Wenn etwas nicht funktioniert

| Beobachtung | Ursache / Abhilfe |
| --- | --- |
| „Importieren“ meldet einen Fehler | Datei ist kein eigenes Schema, zu groß oder enthält unbekannte Felder; Fehlerliste lesen, Feldpfad ist genannt |
| Beschriftung wird abgeschnitten | Zeichenlänge für diese Segmentzahl zu groß; kürzen oder Segmentzahl ändern |
| Auswahlfeld springt auf „Eigene Beschriftungen“ | gewollt, sobald die Zeilen von der Vorlage abweichen |
| Druck zeigt leere Seiten | Studio-Ansicht muss gerendert sein; `Drucken / PDF` aus der Studio-Route verwenden |
| SVG öffnet sich nicht in einem Editor | Datei ist eigenständiges SVG ohne externe Referenzen; Editor prüfen |

## 10. Datenschutz

Kein Speicher, kein Cookie, keine Netzwerkanfrage. Exporte entstehen ausschließlich
auf Anklicken und bleiben lokal; es wird nichts hochgeladen.
