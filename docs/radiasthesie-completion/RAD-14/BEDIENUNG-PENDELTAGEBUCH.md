# Bedienungsanleitung — Pendeltagebuch

**Route:** `#pendeln/journal` · **Paket:** RAD-10 · **Speicher:** `localStorage` unter `esot_rad_journal_v1`
**Voraussetzungen:** JavaScript aktiv. Für dauerhafte Speicherung ein Browser, der `localStorage` für die Seite zulässt (im privaten Modus nicht dauerhaft).

## 1. Wozu das Werkzeug da ist

Das Tagebuch hält eigene Versuche fest: Frage, Vorhersage, gefühlte Sicherheit,
tatsächliches Ergebnis und eine spätere Bewertung. Es speichert **ausschließlich
lokal** — ohne Konto, ohne Server, ohne Tracker und ohne Netzwerkanfrage. Es ist
damit das Gegenstück zum Experimentierlabor: dort die geprüfte Reihe, hier die
eigene Beobachtung.

Was es nicht leistet: keine Diagnose, keine Vorhersage, keine Bewertung der
Methode. „Was dieses Tagebuch nicht leistet“ steht als Abschnitt auf der Seite.

## 2. Felder und Regeln

| Feld | Pflicht | Regel |
| --- | --- | --- |
| Datum | ja | ISO `YYYY-MM-DD`, gültiges Kalenderdatum, Tag der Beobachtung (nicht der Eintragung) |
| Frage oder Versuch | ja | 3–200 Zeichen |
| Verwendete Methode | nein | Auswahl aus dem Methodenkatalog der Werkstatt |
| Eigene Vorhersage | ja | 1–200 Zeichen |
| Subjektive Sicherheit | nein | ganze Zahl 1–5 mit Textlabel („4 von 5 · eher sicher“) |
| Tatsächliches Ergebnis | nein | bis 500 Zeichen, mehrzeilig |
| Spätere Bewertung | nein | bis 500 Zeichen, mehrzeilig |
| Experimentbezug | nein | `experimentId` + `runId`, nur gemeinsam und nur auf einen vorhandenen Lauf |

## 3. Erste Schritte

1. `#pendeln/journal` öffnen (Startseite → Werkstatt → „Pendeltagebuch“).
2. `Neuer Eintrag`, Felder ausfüllen, `Eintrag speichern`.
3. Der Eintrag erscheint in der Liste, nach Datum absteigend, aufklappbar
   (`<details>`).
4. `Bearbeiten` ändert den Eintrag; `Bearbeiten beenden` schließt das Formular.
5. Löschen ist **zweistufig**: erster Klick schaltet scharf (sichtbarer
   Warnhinweis), zweiter Klick löscht den Eintrag.
6. Filter `alle` / `mit Experimentbezug` grenzt die Liste ein.
7. `Formular leeren` verwirft Eingaben ohne zu speichern.

## 4. Einen Lauf aus dem Experimentierlabor übernehmen

- Das Tagebuch bietet abgeschlossene, vollständig enthüllte Läufe aus
  `esot_rad_experiment_v1` an.
- `Ins Tagebuch übernehmen` erzeugt über `entryFromRun` einen Eintrag mit stabilem
  `experimentId`/`runId`; Vorhersage und Ergebnis stammen aus dem Protokoll.
- Der Lauf wird **nicht** verändert (im Test byteweise verglichen) und ist nur
  **einmal** übernehmbar; danach steht „Bereits übernommen“.
- `Bezug entfernen` löst die Verbindung; der Eintrag bleibt als Text erhalten.
- Wird ein Lauf später gelöscht, bleibt der Bezug im Eintrag als Text stehen und
  der Eintrag bearbeitbar (Struktur wird geprüft, Existenz nicht).

## 5. Export und Import

| Aktion | Format | Inhalt |
| --- | --- | --- |
| `Alle Einträge (JSON)` | JSON, Umschlag `kind:"journal"` | alle Einträge, schema-versioniert |
| `Alle Einträge (CSV)` | UTF-8 mit BOM, `;`, CRLF, RFC-4180-Quoting | eine Zeile je Eintrag |
| `Experimentläufe (JSON)` | JSON | die gespeicherten Läufe, weil die vollständige Löschung sie mit entfernt |
| `Einträge importieren` | nur eigenes JSON | ≤ 1 MiB, ≤ 500 Einträge, atomar |

- Jeder Export ist eine Nutzeraktion; es gibt **keinen** automatischen Download.
- Ein ungültiger Eintrag lehnt die **ganze** Datei ab; unbekannte Felder werden
  verworfen (`sanitizeEntry`).
- **CSV-Import gibt es nicht** (Typverlust) — das sagt die Oberfläche ausdrücklich.
- Import prüft nur die Struktur des Laufbezugs, nicht dessen Existenz, damit ein
  Gerätewechsel das Tagebuch nicht unlesbar macht.

## 6. Vollständige Löschung

`Alle eigenen Daten löschen` ist zweistufig bestätigt und entfernt **jeden**
Schlüssel mit Präfix `esot_rad_`: Tagebucheinträge, Experimentläufe und
Sicherungskopien defekter Stände. Fremde Schlüssel anderer Module bleiben
(getestet). Das UI nennt die Mitlöschung der Experimentläufe ausdrücklich.

## 7. Speicherverhalten in Randfällen

| Fall | Verhalten |
| --- | --- |
| leer | Leerzustand, keine Meldung |
| defektes JSON / falscher Umschlag | Rohwert unter `esot_rad_corrupt_esot_rad_journal_v1_<stempel>` gesichert, Schlüssel geleert, Meldung in der Live-Region, kein Throw |
| Schema > 1 | **nicht** überschrieben: Speichern, Import und Laufübernahme blockiert, bis die neuere Fassung geladen ist |
| Quota voll | Meldung „Speicher voll — exportieren und alte Einträge löschen“; Eintrag gilt sichtbar nur für die Sitzung |
| kein `localStorage` | In-Memory-Fallback mit Hinweis „nur für diese Sitzung“ |
| > 500 Einträge in der Datei | die ersten 500 werden geladen und das gemeldet; Schreiben über 500 wird abgelehnt |

## 8. Bedienung ohne Maus

- `Tab` erreicht Datumsfeld, Textfelder, Methode, Sicherheit, Speichern,
  Listenfilter, Einträge und Löschknöpfe in Lesereihenfolge.
- Einträge sind `<details>`/`<summary>` und damit per Tastatur aufklappbar.
- Der Fokus im Datumsfeld ist im Mockup gemessen und korrigiert (RAD-04, P4):
  sichtbarer Fokusring statt Browser-Standard.
- Live-Region für Speicher- und Löschmeldungen, `role="alert"` für Fehler.

## 9. Grenzen

- **Keine Verschlüsselung.** Wer den Browserprofil-Ordner lesen kann, liest die
  Einträge. Das ist die Grenze einer rein lokalen Speicherung ohne Konto und
  steht so auf der Speicherkarte der Seite.
- **Kein Konto, kein Sync, kein Mehrbenutzerbetrieb.** Zwei Tabs überschreiben
  sich nach Last-Write-Wins; es gibt keinen `storage`-Event-Handler (bewusst
  außerhalb dieses Pakets).
- **`file://`-Dauerhaftigkeit ist browserabhängig.** Der Test akzeptiert den
  persistenten Eintrag oder den sichtbaren Sitzungshinweis.
- **Kein CSV-Import**, kein automatischer Export, keine Wiederherstellung nach
  vollständiger Löschung.
- **Nur Chromium geprüft** (26 Modultests, 10 Browsertests), kein
  Screenreader-Lauf, kein Lighthouse.

## 10. Wenn etwas nicht funktioniert

| Beobachtung | Ursache / Abhilfe |
| --- | --- |
| Eintrag „nur für diese Sitzung“ | Speicher gesperrt oder voll; exportieren, alte Einträge löschen, Speicher freigeben |
| Speichern blockiert ohne Fehlertext | neueres Schema im Speicher; Hinweis lesen, neuere Fassung der Seite laden |
| Import wird komplett abgelehnt | ein Eintrag ist ungültig; die Meldung nennt den Feldpfad |
| Lauf erscheint nicht zur Übernahme | Lauf ist offen, unterbrochen oder bereits übernommen |
| Eintrag nach Reload weg | privater Modus oder `file://` ohne persistenten Speicher |

## 11. Datenschutz

Gespeichert werden nur die Vertragsfelder plus `id` und `createdAt`; keine Namen,
keine E-Mail, kein Standort, keine Gerätekennung, kein Cookie, keine Telemetrie.
Zusatzfelder aus einem Import werden nicht übernommen. Es gibt keine
Netzwerkanfrage.
