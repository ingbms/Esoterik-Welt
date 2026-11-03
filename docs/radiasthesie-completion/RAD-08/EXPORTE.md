# Pendeltafel-Studio — Exportwege und Formate (RAD-08)

Diese Datei beschreibt, **was** das Studio ausgibt, **wie** man es bedient und **welche
Grenzen** gelten. Sie ist die Nutzerdokumentation zu `#pendeln/studio`.

## Überblick

| Weg | Knopf | Ergebnis | Enthält | Nicht enthalten |
| --- | --- | --- | --- | --- |
| SVG | „SVG herunterladen“ | eine Datei `pendeltafel-<titel>.svg` | Überschrift, Segmente, Beschriftungen, Fußzeile, Farben | Skripte, Eventhandler, externe Verweise |
| JSON | „Konfiguration (JSON)“ | eine Datei `pendeltafel-<titel>.json` | Schema, Vorlage, Überschrift, Farbstil, Beschriftungen | Zeichnung, Farbwerte, Geometrie |
| Druck / PDF | „Drucken / PDF“ | A4-Seite im Druckdialog, dort „Als PDF speichern“ | Überschrift, Tafel, Fußzeile | Navigation, Regler, Hinweise, Skripte |

Die Vorschau rechts neben den Reglern **ist** die SVG-Datei: derselbe Aufruf erzeugt
beide. Die Druckansicht zeigt dieselbe Zeichnung ohne die im Bild eingebackene
Überschrift und Fußzeile — beides steht dort als HTML, damit es nicht doppelt erscheint.

## 1. SVG-Datei

**Bedienung:** „SVG herunterladen“. Bei ungültiger Eingabe wird nichts ausgegeben; die
Fehlerliste erscheint und die Vorschau bleibt beim letzten gültigen Stand.

**Dateiname:** aus der Überschrift abgeleitet, Umlaute transliteriert, alles andere zu
Bindestrichen: `Ja/Nein-Tafel` → `pendeltafel-ja-nein-tafel.svg`,
`Größen & Maße` → `pendeltafel-groessen-masse.svg`. Fällt nichts übrig, gilt
`pendeltafel-tafel.svg`.

**Aufbau der Datei**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 660" width="600" height="660"
     role="img" aria-labelledby="ptf-title ptf-desc">
  <title id="ptf-title">…</title>
  <desc id="ptf-desc">Kreisrunde Pendeltafel „…“ mit n gleich großen Segmenten: …</desc>
  <rect … fill="<Grundfarbe>"/>
  <text …>Überschrift</text>          <!-- sichtbar, nur im Export -->
  <circle …/>                          <!-- Scheibe, Ringe, Mittelmedaillon -->
  <line …/>                            <!-- Segmentgrenzen -->
  <text …>Beschriftung 1</text> …      <!-- je Segment eine Zeile -->
  <text …>Esoterik-Welt · Pendeltafel-Studio</text>
  <text …>Die Tafel ordnet die Bedeutung der Segmente — sie misst nichts.</text>
</svg>
```

* Maße: `viewBox 0 0 600 660`, Kreis bei `(300, 340)` mit Radius 258. Die Datei ist
  skalierbar; für den Druck empfiehlt sich die Druckansicht (A4) oder eine Skalierung im
  Vektorprogramm.
* Farben und Geometrie stammen ausschließlich aus dem Studio, nie aus der Eingabe.
* `title` und `desc` sind die zugängliche Beschreibung; sie werden nicht gezeichnet.
* Getestet: keine `<script>`-Elemente, keine `on*`-Attribute, kein `javascript:`, kein
  `data:`, kein `<foreignObject>`, `<image>`, `<use>`, `<style>`, kein `xlink:href`,
  kein `@import`. Genau eine URL steht im Dokument: der XML-Namespace.
* Beschriftungen mit `&`, Umlauten und Sonderzeichen werden escaped (`&amp;`) und bleiben
  im gerenderten Bild korrekt lesbar.

**Nicht vorgesehen:** SVG-Import. Das Studio erzeugt SVG nur selbst; fremde Zeichnungen
werden nicht eingelesen. Damit entfällt der Pfad „fremdes SVG mit Skripten“.

## 2. JSON-Konfiguration

**Bedienung:** „Konfiguration (JSON)“. Die Datei enthält nur Daten, keine Zeichnung, und
lässt sich über „Konfiguration importieren“ wieder einlesen.

**Schema `esow.pendeltafel/1`**

```json
{
  "schema": "esow.pendeltafel/1",
  "preset": "segmente6",
  "title": "Farbkategorien",
  "palette": "salbei",
  "labels": ["Rot", "Orange", "Gelb", "Grün", "Blau", "Violett"]
}
```

| Feld | Pflicht | Regel |
| --- | --- | --- |
| `schema` | ja | exakt `esow.pendeltafel/1` |
| `preset` | ja | `janain`, `zahlenkreis`, `buchstaben`, `segmente4`, `segmente6`, `segmente12` |
| `title` | ja | Text, 1–60 Zeichen nach Trimmen, keine Steuerzeichen, kein `<`/`>` |
| `palette` | ja | `messing`, `salbei`, `nacht`, `papier` |
| `labels` | ja | Liste mit 2–48 Texten, je 1–40 Zeichen; zusätzlich geometrisch begrenzt (siehe unten) |

`preset` bezeichnet die zuletzt geladene Vorlage. Weichen die Zeilen davon ab, zeigt das
Studio im Auswahlfeld „Eigene Beschriftungen“; in der Datei bleibt die Vorlage stehen,
weil sie zum Schema gehört. Welche Vorlage aktiv ist, ist für die Zeichnung ohne
Bedeutung — die Segmente ergeben sich allein aus `labels`.

**Grenzen**

* Importgröße: **32 KiB (32.768 Bytes)** UTF-8, geprüft **vor** dem Parsen — auch bei der
  Dateiauswahl, ohne die Datei zu lesen.
* Segmentzahl: 2–48. Bei 48 Segmenten passen höchstens **3 Zeichen** je Beschriftung,
  bei 26 Segmenten 6, bei 12 Segmenten 12, bei 6 Segmenten 23, bei 2 Segmenten 38. Die
  Grenze ergibt sich aus der Sehnenlänge bei der kleinsten zulässigen Schriftgröße
  (10 Einheiten); die harte Obergrenze von 40 Zeichen gilt zusätzlich.
* Doppelte Beschriftungen sind erlaubt, werden aber als Hinweis gemeldet.

**Abgelehnt werden:** unbekannte Felder (auch `onload`, `href`, `html`, `style`,
`__proto__`), falscher Schema-Bezeichner, unbekannte Vorlage oder Palette, zu wenige oder
zu viele Segmente, leere/zu lange Beschriftungen, Steuerzeichen und Zeilenumbrüche,
die Zeichen `<` und `>`.

**Verhalten bei Fehlern:** Die Tafel bleibt unverändert, die Fehlerliste erscheint
(`role="alert"`, konkret benannt), das betroffene Feld erhält `aria-invalid="true"`, die
Statuszeile meldet „abgelehnt“. Es wird nichts gespeichert oder gesendet.

**Reimport:** Export → Import ergibt dieselbe Konfiguration und **dieselbe Zeichnung**
(deterministisch, ohne Zufall und ohne Zeitstempel im SVG). Getestet in Modul- und
Browsertest, inklusive Byte-Vergleich der SVG-Ausgabe.

## 3. Druckansicht und PDF

**Bedienung:** „Drucken / PDF“ öffnet den Druckdialog des Browsers. Dort als Ziel
„Als PDF speichern“ wählen und bestätigen. Ein eigener PDF-Export ist bewusst nicht
implementiert; die PDF-Ausgabe ist der Druckweg des Browsers.

**Was gedruckt wird:** genau die A4-Fläche unter der Werkstatt — Überschrift
(„Esoterik-Welt · Pendeltafel-Studio“, Tafelname), die Tafel und eine Fußzeile mit
Einordnung, Datum, Farbstil und dem Hinweis, dass die Beschriftungen selbst festgelegt
sind. Navigation, Regler, Statuszeile und Hinweistexte sind im Druck ausgeblendet.

**Seitenformat:** `@page { size: A4 portrait; margin: 0 }`, Fläche 210 × 296 mm mit
16 mm/18 mm Innenabstand. Das ist bewusst 1 mm kürzer als A4, damit nicht durch Rundung
ein zweites, leeres Blatt entsteht. Getestet: PDF mit **genau einer Seite**.

**Farben:** Der Druck übernimmt den gewählten Farbstil (`print-color-adjust: exact`).
Für Papier ist der Stil **„Papier“** gedacht (helle Fläche, dunkle Schrift); die dunklen
Stile drucken als dunkle Fläche und verbrauchen entsprechend Tinte. Die Farben der
Überschrift und Fußzeile folgen dem Farbstil — die Druckoptimierung des Hauptstylesheets
setzt `p`/`span` sonst auf Schwarz und würde sie auf dunklem Grund unsichtbar machen.

**Getestete Umgebung:** Chromium 155 (Playwright 1.64), headless, `page.pdf()` mit
`printBackground`, `preferCSSPageSize`. Nachweis:
`evidence/pendeltafel-studio-druck.pdf` — `%PDF-1.4`, 73.968 Bytes,
MediaBox 594,96 × 841,92 pt (A4), 1 Seite; dazu `evidence/print-flaeche-papier-a4.png`.
Firefox und Safari wurden nicht geprüft.

**Grenzen:** Der interaktive Druckdialog (GUI, „Als PDF speichern“) wurde nicht automatisiert
bedient; der Knopf ruft `window.print()` nachweislich genau einmal auf, und die
Druckdarstellung wurde über die Print-Medien und die echte PDF-Ausgabe geprüft. Der
PDF-Dateiname wird vom Browser aus dem Seitentitel vorgeschlagen. Inhalte mit sehr vielen
Segmenten bleiben lesbar, werden aber klein; für große Ausdrucke ist der SVG-Export die
bessere Wahl.

## 4. Reproduktion der Nachweise

```bash
# Modultests (Prüfung, Geometrie, Escaping, Reimport, Route, Druck-CSS)
node --test tests/pendeltafel-studio.mjs

# Browsertests (Route, Vorlagen, Farben, XSS, Import/Export, Druck, PDF, mobil, offline)
E2E_PORT=3411 npx playwright test tests/pendeltafel-studio.spec.js

# Build und Offline-Ausgabe
npm run build
npm run test:offline
```

Die Evidenzbilder liegen unter `docs/radiasthesie-completion/RAD-08/evidence/`:
`desktop-studio-ja-nein.png`, `desktop-studio-buchstaben.png`,
`desktop-studio-umlaute.png`, `desktop-studio-nachtrose.png`, `mobile-studio.png`,
`print-ansicht-a4.png`, `print-flaeche-a4.png`, `print-flaeche-papier-a4.png`,
`pendeltafel-studio-druck.pdf`.
