# Arbeitsregeln für Esoterik-Welt

## Projekt und Arbeitsstand zuerst feststellen

- Das primäre Website-Repository liegt unter `C:/Users/mas/Arbeit/Esoterik-Welt`. Der Ordner `C:/Users/mas/Documents/ChatGPT/Esoterik-Welt` enthält die Codex-Bestandsaufnahme; er ist kein zweiter Website-Checkout.
- Vor Änderungen Arbeitsverzeichnis, Repository-Wurzel, gemeinsamen Git-Ordner, Branch, HEAD und vorhandene Änderungen prüfen. Der Name eines Ordners belegt keinen aktuellen Integrationsstand.
- Im Hauptordner war am 03.11.2026 `feature/farbwelten-modul` ausgecheckt. Nicht unterstellen, dass dort `main` oder die veröffentlichte Website liegt. Den lokalen `main` vor Verwendung mit dem vorhandenen `origin/main` vergleichen.
- Vorhandenen passenden Aufgaben-Worktree wiederverwenden. Keine zusätzlichen Geschwisterklone oder Arbeitskopien ohne ausdrücklichen Nutzerauftrag anlegen. Bestehende Arbeitskopien bei dieser Prüfung nicht löschen.

## Integration und Übergabe

- Fachlich abgenommen, im Branch gespeichert, in den Integrationszweig übernommen und veröffentlicht sind unterschiedliche Zustände. Bei jeder Übergabe Quellpfad, Branch, exakten Commit, Zielzweig und Prüfnachweise nennen.
- Andere freigegebene Rubriken beim Integrieren erhalten. Navigation, Router, Startseitenkarten, Datenmodule, statische Seiten, Sitemap und Offline-Ausgabe zusammen prüfen. Konflikte in gemeinsamen Dateien inhaltlich zusammenführen.
- Alle freigegebenen Bereiche prüfen, nicht nur das gerade bearbeitete Feature. Für die aktuelle Reparatur sind insbesondere Frequenzen, Pendeln/Radiästhesie und Farbwelten gemeinsam erforderlich; zu Farbwelten gehören auch die zusätzlichen Farb- und Themenseiten.
- Erzeugte `Lokal*.html` nach erfolgreicher Integration aus den zugehörigen Quellen neu bauen. Alte Ausgaben aus Prüfklonen nicht als neue Quelländerungen übernehmen.
- Fremde uncommittete Änderungen erhalten. Im Hauptordner bestehen unter anderem eigene Tarot-Änderungen und umfangreiche noch nicht versionierte Dokumente und Bildnachweise. Kein pauschales Staging, Reset, Clean oder Überschreiben.
- Prüfungen gelten nur für den tatsächlich geprüften Commit und Arbeitsbaum. Historische Screenshots sind keine aktuelle Abnahme. Eine Karte nicht allein aufgrund grüner Feature-Tests als vollständige Website-Integration abschließen.
- Wiederverwendbare Prüfskripte und notwendige Belege mit Herkunft sichern; wiederholte Prüfungen in vorhandenen Prüfumgebungen ausführen. Vor späterer Bereinigung Änderungen, untracked Dateien, ignorierte Dateien und noch laufende Aufgaben prüfen.

## Hermes und Fortsetzung

- Das Esoterik-Board heißt technisch weiterhin `hermes-adaptive-router`; sein Repository ist nicht das Router-Pluginprojekt. Board bei CLI-Aufrufen ausdrücklich angeben. Technische Karten-IDs sind `t_...`.
- Das bestehende Esoterik-Board wurde am 03.11.2026 auf Nutzerwunsch während der Verzeichnisanalyse pausiert. Vorherige Zustände und Nachweise liegen unter `docs/arbeitsverzeichnis-analyse-2026-11-03/`.
- Nach Prüfung der lokalen Vorschau hat der Nutzer am 03.11.2026 Veröffentlichung, Festschreiben des Stands und das Fortsetzen der logisch nächsten Board-Aufgaben ausdrücklich freigegeben. Reihenfolge: Reparaturabschluss und veröffentlichte Baseline → vollständiger Katalog samt Review und Freigabe → VELARKANA-Umstellung. Bestehende Aufgaben und Arbeitskopien wiederverwenden; keine Ersatzaufgaben oder neuen Geschwisterklone anlegen.
- Die Rubriken-Reparatur wird im vorhandenen Zweig `feature/rubriken-vollstaendig` bearbeitet. Ihr überprüfbarer Abschlussnachweis ist `docs/reparatur-codex-t_33cdf5ec.md`; den tatsächlichen PR-/Integrationsstatus daraus und aus Git feststellen. Historische Bestandsaufnahmen sind keine aktuelle Freigabe.
