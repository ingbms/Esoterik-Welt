# Datenschutz

Die Werkstatt speichert Nutzereingaben. Das ist der einzige Bereich des Moduls,
in dem personenbezogene Daten entstehen können — eine Frage im Pendeltagebuch
kann alles enthalten. Deshalb hier die Regeln und der Beleg.

## 1 · Grundsatz

> Alles bleibt auf diesem Gerät: kein Konto, keine Übertragung, vollständige
> Löschung auf Wunsch.

Dieser Satz steht als Lead des Journals und ist keine Behauptung im Dokument,
sondern eine überprüfbare Eigenschaft: die Messung hat über **52 Messpunkte**
(4 Werkzeuge × 4 Breiten + 36 Zustände) **0 externe Anfragen**, **0
fehlgeschlagene Anfragen** und **0 Konsolenfehler** ergeben
(`messung/werkstatt-messung.json` → `errors`). Die Erhebung lauscht auf
`Network.requestWillBeSent` und verwirft `file://`, `data:` und `blob:`;
jede andere URL würde im Feld `externalRequests` erscheinen.

## 2 · Welche Daten entstehen

| Datenart | Wo | Sensibilität | Speicherung |
|---|---|---|---|
| Frage, Vorhersage, Ergebnis | Journal | **hoch** — freier Text über Privates | `localStorage` |
| Datum, Methode, Sicherheit 1–5 | Journal | mittel | `localStorage` |
| Testläufe (Ziel, Antwort, Treffer) | Test-Labor | niedrig | `localStorage` |
| Tafel (Typ, Titel, Beschriftungen) | Studio | niedrig | `localStorage` |
| Reglerwerte | Simulator | keine | **nicht gespeichert** |

Keine IP-Adresse, keine Kennung, kein Gerätefingerabdruck, kein Cookie, kein
`sessionStorage`, kein `IndexedDB`, kein Service Worker.

## 3 · Schlüssel und Lebensdauer

| Schlüssel | Format | Gelöscht durch |
|---|---|---|
| `esot_rad_journal_v1` | JSON-Array | „Alle Einträge löschen“ (mit Bestätigung) |
| `esot_rad_experiment_v1` | JSON-Array | dieselbe Aktion |
| `esot_rad_studio_v1` | JSON-Objekt | dieselbe Aktion |

- Die Löschaktion nennt **vorher** genau diese drei Schlüssel und dass sie nicht
  wiederherstellbar sind.
- Sie löscht **nur** diese drei, nicht den übrigen Browserspeicher der Seite
  (Kristall-Favoriten, Runen-Historie bleiben unberührt).
- Ein Export vor dem Löschen ist möglich und wird im Dialog angeboten.

## 4 · Was die Oberfläche zusagt — und was sie nicht zusagt

**Zugesagt (und im UI sichtbar):**

1. Kein Konto, keine Anmeldung.
2. Keine Übertragung: die Werkstatt funktioniert ohne Netzwerkverbindung.
3. Vollständige Löschung auf Wunsch, mit Bestätigung.
4. Einträge sind weg, wenn der Browserspeicher geleert wird — das steht im
   Leerzustand, nicht nur in der Datenschutzerklärung.

**Nicht zugesagt (und darf auch nicht behauptet werden):**

- Keine Verschlüsselung. `localStorage` liegt im Klartext im Browserprofil.
- Kein Schutz auf einem geteilten Gerät oder Benutzerprofil.
- Kein Schutz gegen Browser-Synchronisierung, wenn der Nutzer das Profil
  synchronisiert.
- Kein Schutz gegen Erweiterungen mit Zugriff auf den Seitenspeicher.
- Keine Wiederherstellung nach dem Leeren des Speichers.

## 5 · Formulierungen im UI (verbindlich)

| Ort | Text |
|---|---|
| Journal-Kopf (Lead) | „Alles bleibt auf diesem Gerät: kein Konto, keine Übertragung, vollständige Löschung auf Wunsch.“ |
| Journal, Speicherhinweis | „Speicherorte: `esot_rad_journal_v1`, `esot_rad_experiment_v1`, `esot_rad_studio_v1`. Kein Netzwerkzugriff, keine Kennung, kein Konto.“ |
| Journal, Leerzustand | „Einträge bleiben auf diesem Gerät: kein Konto, keine Übertragung. Wenn Sie den Browser-Speicher leeren, sind sie weg — exportieren Sie regelmäßig.“ |
| Löschdialog | „Gelöscht werden alle Daten dieses Werkzeugs auf diesem Gerät: Tagebucheinträge, Experimentläufe und die zuletzt genutzte Tafel. Das lässt sich nicht rückgängig machen. Ein Export vorher ist möglich.“ |
| Speicher voll | „Der lokale Speicher ist voll. Der Eintrag wurde **nicht** gespeichert. Exportieren Sie Ihre Einträge und löschen Sie alte Einträge …“ |

Diese Texte stehen so im Mockup und sind die Vorlage für die Produktion. Kein
Text verspricht mehr, als die Technik hält.

## 6 · Export ist die Grenze der Kontrolle

Mit dem Export verlässt die Datei den Browser. Ab diesem Punkt gilt die
Zusage „bleibt auf diesem Gerät“ **nicht mehr**. Deshalb:

- Der Export ist eine bewusste Aktion (Knopf), kein Automatismus.
- CSV enthält dieselben Felder wie JSON — keine Zusatzspalten mit Zeitstempeln
  des Geräts, keine Kennungen.
- Es gibt keinen „Teilen“-Knopf, keine Zwischenablage-Integration, keine
  automatische Wolke.

## 7 · Einordnung (rechtlich, ohne Rechtsberatung)

- Die Verarbeitung findet ausschließlich lokal im Browser statt; der Betreiber
  erhält keine Kenntnis von den Inhalten.
- Für die Datenschutzerklärung der Seite ist ein Absatz zu ergänzen, der die
  drei Schlüssel und die Löschaktion benennt. `datenschutz.html` beschreibt
  heute nur „Kristall-Favoriten und Runen-Historie“ — die Werkstatt fehlt dort.
- Ob für freie Texte über Dritte eine Löschfrist nötig ist, entscheidet der
  Betreiber; technisch ist die Löschung vollständig und sofort.

## 8 · Offene Punkte

1. `datenschutz.html` muss um die drei Werkstatt-Schlüssel ergänzt werden
   (Produktionsaufgabe, nicht in dieser Karte).
2. Kein Test auf einem Gerät mit synchronisiertem Profil.
3. Kein Test mit aktivierten Browser-Erweiterungen, die `localStorage` lesen.
4. Kein Nachweis über einen Netzwerk-Mitschnitt außerhalb der Messumgebung
   (die Messung erhebt im Browser, nicht auf der Leitung).
