# Bekannte Einschränkungen

**Stand:** `ceddc84cfca44d53f1995dfd0981b7d70a554724` · Diese Datei sammelt, was das Modul **nicht** kann oder nicht
belegt — unabhängig davon, ob es sich beheben lässt. Nichts hier ist eine
Vermutung: jede Zeile nennt Beleg oder Prüfstand.

## 1. Verblindung und Aussagekraft (Forschung)

| # | Einschränkung | Beleg |
| --- | --- | --- |
| F-1 | Die Verblindung ist **clientseitig umgehbar**. Entwicklerwerkzeuge können Skripte anhalten und den Speicher lesen; das Ziel ist vor der Enthüllung nur als SHA-256-Commitment gespeichert, aber der Salt liegt im Arbeitsspeicher. | RAD-09 §1, §5 |
| F-2 | Es gibt **keinen unabhängigen Zeitstempel** und keine externe Instanz. Wer die Uhr stellt oder den Speicher manipuliert, verändert die Rohdaten. | RAD-09 |
| F-3 | Die Fallzahlen sind **didaktisch** (16, 20, 25), nicht inferenzstark. Kleine Stichproben erzeugen fragile p-Werte. | RAD-09 |
| F-4 | Mehrere Läufe werden **nicht** auf Mehrfachtests korrigiert; die Einordnung nennt nur die Zahl bekannter Läufe. Bewusste Entscheidung. | RAD-09 §5 |
| F-5 | Das Modul belegt **keine** Wirkung von Radiästhesie, Pendeln oder Orakeln. Es kennzeichnet Aussagen nach Herkunft (A–E) und sagt bei kontrollierten Tests, dass keine Treffer über dem Zufall gefunden wurden. | `#pendeln/methodik`, `modul-einstieg.md` |
| F-6 | Die Zuordnung Aussage → Quelle ist **redaktionell**, nicht messbar. Geprüft ist die Zitierung der Hauptquelle im Kapitel, nicht die vollständige Wiedergabe. | RAD-06 §5.5 |
| F-7 | Externe Quellen wurden **nicht erneut abgerufen**; Prüftiefen gelten für den Recherchestand 2026-11-03. | RAD-02, RAD-06 §5.4 |

## 2. Speicher und Datenhaltung

| # | Einschränkung | Beleg |
| --- | --- | --- |
| S-1 | `localStorage` ist **unverschlüsselt**. Wer das Browserprofil lesen kann, liest Tagebuch und Experimentläufe. | RAD-10 §6.5 |
| S-2 | **Kein Konto, kein Sync, kein Mehrbenutzerbetrieb.** Zwei Tabs überschreiben sich (Last-Write-Wins), es gibt keinen `storage`-Handler. | RAD-10 §1 |
| S-3 | **`file://`-Dauerhaftigkeit ist browserabhängig**; der Test akzeptiert persistenten Eintrag oder Sitzungshinweis. | RAD-10 §6.7 |
| S-4 | **Quota** ist nur mit Speicher-Attrappe geprüft, nicht mit einem tatsächlich vollen Browser-Speicher. | RAD-09 §5.5, RAD-10 §6.4 |
| S-5 | Vollständige Löschung entfernt **alle** `esot_rad_`-Schlüssel, also auch Experimentläufe und Sicherungskopien. Das ist gewollt, aber unwiderruflich. | RAD-10 §1 |
| S-6 | Ein Lauf ist nur **einmal** ins Tagebuch übernehmbar; ein Duplikat ist nicht vorgesehen. | RAD-10 |
| S-7 | CSV-**Import** fehlt bewusst (Typverlust); nur JSON. | RAD-10 §1 |

## 3. Barrierefreiheit (F1 behoben, weitere Prüfgrenzen)

| # | Einschränkung | Status |
| --- | --- | --- |
| A-1 | Ursprünglich F1 (P2, WCAG 1.4.1, Link-Erkennbarkeit). | **behoben, unabhängig bestätigt** auf `ceddc84`: 32 axe-Läufe ohne Verstoß; [Review](evidence/REVIEW-F1-F2.md) |
| A-2 | `color-contrast` bleibt bei dekorativen Glyphen und SVG-Text im Studio „incomplete“ (kein Fehler, aber auch keine Freigabe). | offen, F4 |
| A-3 | **Kein echter Screenreader-Lauf** in irgendeinem Paket. Geprüft sind Struktur, Labels, `aria-*`, Live-Regionen und Fokusreihenfolge — nicht die Ansage. | RAD-04, 07, 08, 09, 10, 12, 13 |
| A-4 | Keine Prüfung mit **Zoom 200/400 %**, Forced Colors oder Windows-Kontrastmodus. | RAD-04 §6 |
| A-5 | Kein Touch-/Gestentest auf echten Geräten; mobile Läufe sind Chromium-Emulation bei 390 px. | RAD-04, RAD-09, RAD-10 |

## 4. Browser und Plattform

| # | Einschränkung | Beleg |
| --- | --- | --- |
| B-1 | **Nur Chromium** (historisch 155, unabhängiger F1/F2-Review 156.0.8078.4). Kein Firefox-/Safari-/WebKit-Nachweis. | [Review](evidence/REVIEW-F1-F2.md) |
| B-2 | Wiederholte Läufe sind grün, aber im ersten RAD-14-`test:all` trat ein Tarot-Fokus-Timeout auf. Zwei Einzelläufe und der vollständige Nachlauf bestanden ohne Teständerung. | [Nachabnahme](NACHABNAHME.md), Follow-up `t_73ccd862` |
| B-3 | **`::details-content`** wird je Browser unterschiedlich behandelt; für ältere Browser ist ein `beforeprint`-Weg eingebaut, aber nicht in diesen Browsern getestet. | RAD-04 §5 |
| B-4 | Der UA-Fokusring am Kalendersymbol im Datumsfeld ist Chromium-spezifisch. | RAD-04 §5.5 |

## 5. Inhalt und Recht

| # | Einschränkung | Beleg |
| --- | --- | --- |
| R-1 | **Keine `LICENSE`-Datei.** `package.json` nennt MIT, es gibt aber keinen Lizenztext; die Rechte der eigenen SVGs und Inhalte sind nicht wirksam geregelt. | RAD-05, `MEDIEN-LIZENZEN.md` §5 |
| R-2 | Zwei Fotos stehen unter **CC BY-SA 3.0**: Weitergabe unter gleichen Bedingungen. Attributionszeilen und Share-Alike-Absatz sind vorhanden. | RAD-05, RAD-06 |
| R-3 | **26,3 MB Bildoriginale** sind versioniert; das belastet Repository und Klone. Prüfsummen gegen Commons bleiben nur so nachweisbar. | RAD-05 §7, RAD-11 §5.5 |
| R-4 | Zuschreibung des Wünschelruten-Blattes an Thomas Pennant ist laut Dateiseite **unsicher**; die Bildunterschrift nennt die Publikation, nicht den Zeichner. | RAD-05 |
| R-5 | Das **Ouija-Logo** ist bei 520 px nicht lesbar; der Alt-Text beschreibt es, statt es zu entziffern. | RAD-05 |
| R-6 | Das Orakel-Cluster ist mit **1 042 Wörtern** deutlich dünner als Radiästhesie (3 134). Im Einstiegstext benannt, nicht kaschiert. | RAD-06 §5.6 |
| R-7 | **Datenschutzerklärung (`datenschutz.html`) nennt die lokalen Speicher nicht.** Die Methodik-Seite tut es; die Rechtsseite ist unverändert. | RAD-04 §5.3, RAD-14-Prüfung |
| R-8 | `og:image` fehlt in allen Dokumenten; die vier eigenen SVGs taugen nicht als Social-Preview, ein PNG ohne Freigabe wäre eine unbelegte Zusage. | Befund F3/B7 |
| R-9 | Kein `Article`- und kein `FAQPage`-Markup — bewusst, weil kein belegtes Veröffentlichungsdatum und keine Frage-Antwort-Seite existiert. | RAD-12 §Restpunkte |

## 6. Betrieb, Build und CI

| # | Einschränkung | Beleg |
| --- | --- | --- |
| T-1 | **CI führt die Radiästhesie-Tests nicht aus.** `test:all` enthält sie, `.github/workflows/ci.yml` ruft sie nicht auf. Ein roter Modultest wäre in der Pipeline unsichtbar. | RAD-01, 03, 07, 09, 10 |
| T-2 | **Kein Deployment.** Branch nicht gepusht, `main` unberührt; `verify:pages` gegen die Produktions-URL ist erwartungsgemäß rot. | RAD-08, RAD-11, RAD-12 |
| T-3 | **Lighthouse/Performance** wurde nie gefahren. Aussagen zu Ladezeit, LCP oder Bundlegröße fehlen. | RAD-07, 09, 10, 12 |
| T-4 | **Ein Datenmodul mit 255 kB** wird beim ersten Aufruf mitgeladen; die Taxonomie (~93 kB) wird nur für Detailansichten gebraucht. Kein Code-Splitting. | RAD-03 §5 |
| T-5 | **Zwei Ausgabewege** (Browser und statischer Generator) müssen synchron bleiben; abgesichert durch Tests, nicht durch Konstruktion. | RAD-12 |
| T-6 | `npm run test:e2e` nutzt ohne `E2E_PORT` Port 3100 und kann einen fremden Server wiederverwenden. | RAD-10 §6.10 |
| T-7 | Ursprünglich F2 (P3): zu kleine Bildauswahl/Hochskalierung. | **behoben, unabhängig bestätigt**: 60 Läufe/120 Fotos, 0 IMG-RES/Hochskalierung bei DPR 1; [Review](evidence/REVIEW-F1-F2.md) |
| T-8 | Statische Dokumente und `Lokal.html` sind **erzeugt und versioniert**; ein vergessener Build hinterlässt einen veralteten Stand im Repository. | RAD-12 |

## 7. Was daraus für die Übergabe folgt

1. **Kein Veröffentlichungsrecht.** A-1/F1 und T-7/F2 sind behoben und unabhängig
   nachgeprüft; die übrigen Grenzen und Betriebsentscheidungen bleiben bestehen.
2. **Keine Forschungsbehauptung.** F-1 bis F-5 sind keine Mängel, die man
   wegprogrammieren könnte, sondern Eigenschaften eines clientseitigen Werkzeugs.
   Sie stehen auf der Seite und in dieser Datei.
3. **Keine Datenschutzfreigabe ohne R-7.** Solange die Datenschutzerklärung die
   lokalen Speicher nicht nennt, ist die Rechtsseite unvollständig — unabhängig
   davon, wie gut die Methodik-Seite formuliert ist.
