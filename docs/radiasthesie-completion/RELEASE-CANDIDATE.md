# Release-Kandidat — ESOW-RAD (Radiästhesie, Pendeln und Orakel)

**Stand:** geprüfter Kandidat `ceddc84cfca44d53f1995dfd0981b7d70a554724` · Branch `feature/radiasthesie-modul` · Basis `e44fa5c`
**Dokumentation:** [RAD-14-Index](RAD-14/README.md), [Nachabnahme](RAD-14/NACHABNAHME.md), [Paketmatrix](RAD-14/PAKETMATRIX.md)
**Aktualisiert:** 3. November 2026, RAD-14-Wiederaufnahme

## 1. Urteil

> ### KEINE VERÖFFENTLICHUNGSFREIGABE
>
> Die ursprüngliche Vollumfangsprüfung (`t_29535d62`, `9bf5f73`) lautete
> **NICHT ABGENOMMEN**. Der unabhängige Nachreview (`t_b1641fc1`) bestätigt auf
> `ceddc84cfca44d53f1995dfd0981b7d70a554724`: **F1/F2 freigegeben. Keine Gesamt-
> oder Veröffentlichungsfreigabe. RAD-14 bleibt offen.** F1/F2 sind damit
> nicht mehr offene Blocker. Die Übergabe ist hiermit aktualisiert; die
> abschließende Master-DoD und Eigentümerentscheidungen werden nicht vorweggenommen.

Dieses Dokument beschreibt, **was** ein Release wäre, **warum** es derzeit keines
ist und **welche Bedingungen** gelten. Aus ihm folgt **kein** Recht zu pushen,
zu veröffentlichen oder zu deployen.

## 2. Was in einem Release stecken würde

| Bestandteil | Umfang |
| --- | --- |
| Themenseiten | 3 Themen, 32 Kapitel, 6 346 Wörter, Kennzeichnung A–E je Kapitel |
| Quellen | 66 Einträge mit Prüftiefe, Interessenvermerk, Aussagenzuordnung |
| Glossar | 17 Begriffe, 9 Buchstabengruppen |
| Statische Dokumente | 7 Seiten ohne JavaScript, Sitemap mit 11 Einträgen |
| Werkzeuge | Pendellabor, Pendeltafel-Studio, Experimentierlabor, Pendeltagebuch |
| Medien | 6 Fotos (CC0/PD/CC BY-SA 3.0), 24 Varianten, 4 eigene SVGs |
| Bildrechte | Manifest, Attributionsseite, Share-Alike-Absatz auf der Methodik-Seite |
| Datenmodell | Schema 1.0, 7 Entitätstypen, Verträge, Speicher-/Exportschemata |
| Tests | aktueller RAD-14-Nachtest: 167 Modultests; test:all-Wiederholung Jest 2/2, Node 242/242, Playwright 147/147 auf `ceddc84`; erster Tarot-Fokus-Timeout separat dokumentiert |
| Dokumentation | RAD-01…RAD-14, Testberichte, Evidenz, diese Übergabe |

**Umfang des Kandidaten-Diffs `e44fa5c..ceddc84`:** 463 Dateien,
+107 893 / −665 Zeilen, 31 Commits (per Git ermittelt). Die nachfolgende
RAD-14-Dokumentationsaktualisierung ist noch nicht Teil dieser Kandidatenzahlen.

## 3. Blockierende und offene Befunde

| ID | Schwere | Befund | Status | Karte |
| --- | --- | --- | --- | --- |
| F1 | P2, ursprünglich blockierend | Link-Erkennbarkeit WCAG 1.4.1 | **behoben, unabhängig bestätigt**: 32 axe-Läufe, 0 Verstöße | `t_b1641fc1` |
| F2 | P3 | Foto-Slot und Dateiauswahl | **behoben, unabhängig bestätigt**: 60 Bildläufe/120 Fotos, 0 IMG-RES/Hochskalierung (DPR 1) | `t_b1641fc1` |
| F3 / B7 | P3 | `og:image` fehlt in allen 8 Dokumenten | offen, bewusst | RAD-12 |
| F4 | – | `color-contrast` bleibt bei dekorativen Glyphen/SVG-Text „incomplete“ | offen | RAD-13 |
| R-1 | P2 (rechtlich) | keine `LICENSE`-Datei; Rechte der eigenen Inhalte ungeklärt | offen, Eigentümerentscheidung | RAD-05/14 |
| R-7 | P2 (rechtlich) | `datenschutz.html` nennt die lokalen Speicher (`esot_rad_*`) nicht | offen | RAD-04/14 |
| T-1 | P2 (Betrieb) | CI ruft die Radiästhesie-Suiten nicht auf | offen | RAD-01/03/07/09/10 |

Vollständige Liste mit Belegen: `RAD-14/GRENZEN.md`.

## 4. Historische Prüfnachweise (aktueller Nachtest siehe §5 und RAD-14/NACHABNAHME.md)

| Prüfung | Ergebnis | Quelle |
| --- | --- | --- |
| Build, Lint, Format | grün | RAD-14-Lauf, RAD-13 |
| Node-Tests | 164/164 auf `5fe5301`; 249 über 15 Suiten auf `9bf5f73` | `RAD-14/TESTPROTOKOLLE.md` §2, RAD-13 |
| Browsertests | 147/147 (2,1 min), 0 failed, 0 skipped | RAD-14-Lauf |
| `verify:build` | 36 Seiten/Viewports + 7 statische Dokumente, 0 Fehler | RAD-14-Lauf |
| Breiten 320/375/768/1440 | 80 Läufe, 0 Überlauf | RAD-13 |
| Konsolen/Netz | 0 Fehler, 0 externe Requests | RAD-13 |
| Interne Links | 604 Ziele, kein totes Ziel | RAD-13 |
| Statistik | 10 Fälle gegen BigInt-Referenz, max. 2,0e-15 | RAD-13 |
| Sicherheit | Journal-XSS, Studio-Import, SVG-Export, Löschung | RAD-13, RAD-08/10 |
| reduzierte Bewegung | wirkt | RAD-13 |

## 5. Bedingungen für ein Release

1. **Erfüllt:** F1/F2 behoben und unabhängig nachgeprüft auf dem exakten
   Kandidaten (32 axe-Läufe, 60 Bildläufe).
2. **Erfüllt mit offengelegter Wiederholung:** test:all grün (Jest 2/2,
   Node 242/242, Playwright 147/147); erster Autorenlauf mit Tarot-Fokus-Timeout
   bleibt belegt, Folgekarte `t_73ccd862`. Keine Testabschwächung.
3. **Erfüllt:** gezieltes unabhängiges Reviewer-Verdikt und aktualisierte
   Testprotokolle/Fingerabdrücke/Paketmatrix. Der isolierte Reviewer-Checkout
   war sauber; der gemeinsame Baum enthält weiterhin Testartefakte.
4. **Offen:** abschließende Master-DoD einschließlich RAD-14. Kein separates
   unabhängiges Inhaltsverdikt für die Übergabe ist vorhanden.
5. **Offen:** Eigentümerentscheidungen zu R-1 (Lizenz), R-7 (Datenschutz) und
   T-1 (CI-Aufnahme oder ausdrücklich akzeptiertes Risiko).
6. **Offen:** ausdrückliche Veröffentlichungsfreigabe. Bis dahin kein Push,
   kein Deployment; F3/F4 und weitere dokumentierte Grenzen bleiben sichtbar.

Aktuelle Rohbelege, Reproduktionsbefehle und genaue Abgrenzung:
[RAD-14/NACHABNAHME.md](RAD-14/NACHABNAHME.md).

## 6. Rücknahme (falls doch veröffentlicht würde)

Der Branch ist nicht gepusht; `main` ist unberührt. Ein Release wäre ein
Fast-Forward oder Merge dieses Branches. Rücknahme wäre ein Revert des
Merge-Commits; Daten außerhalb des Repositories existieren nicht (kein Server,
keine Datenbank). Nutzerseitig gespeicherte Tagebuch- und Experimentdaten liegen
ausschließlich im Browser und wären von einem Rückbau nicht betroffen.

## 7. Verhältnis zum Master

Der Master `t_878c59c7` / ESOW-RAD-000 darf **erst** geschlossen werden, wenn
alle 14 Pakete ihre DoD belegt haben und die Nachabnahme positiv ist. RAD-14
liefert dafür die Nachweise, nicht die Freigabe. Ein „Dokumentation existiert“
ist kein Abnahmekriterium für die anderen 13 Pakete.
