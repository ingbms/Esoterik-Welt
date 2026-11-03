# Vorschläge für weitere Ausbaustufen

**Stand:** `5fe5301` · Reihung nach Nutzen für die Abnahme, nicht nach Attraktivität.
Aufwandsangaben sind Schätzungen aus dem Umfang der betroffenen Dateien, keine
Messung. Nichts hier ist beauftragt oder begonnen.

## 1. Vor jedem Ausbau: die Abnahme schließen

| Nr. | Vorhaben | Aufwand | Warum zuerst |
| --- | --- | --- | --- |
| V-1 | **F1 beheben** (Link-Erkennbarkeit im Fließtext, WCAG 1.4.1) und **nachabnehmen** | S | blockiert die Abnahme; Korrekturkarte `t_b1641fc1` läuft |
| V-2 | **Radiästhesie-Suiten in die CI aufnehmen** (`test:radiasthesie*`, Playwright) | S | ohne Pipeline sind rote Modultests unsichtbar (T-1) |
| V-3 | **Datenschutzerklärung um die lokalen Speicher ergänzen** (`esot_rad_*`, Zweck, Löschweg) | S | Rechtsseite ist derzeit unvollständig (R-7) |
| V-4 | **Lizenz der eigenen Inhalte und SVGs klären** (`LICENSE` oder ausdrücklicher Vermerk) | S, Entscheidung des Eigentümers | ohne Lizenztext ist „MIT“ in `package.json` wirkungslos (R-1) |

Diese vier Punkte sind keine Ausbaustufen, sondern Abschlussarbeiten. Solange sie
offen sind, ist jede Erweiterung zusätzliche Fläche ohne Freigabe.

## 2. Qualität und Messbarkeit

| Nr. | Vorhaben | Aufwand | Nutzen | Risiko |
| --- | --- | --- | --- | --- |
| Q-1 | **Firefox und WebKit** in die Playwright-Konfiguration aufnehmen und die 147 Tests dort fahren | M | deckt B-1 auf; `::details-content` und Druckpfade sind browserabhängig | neue Flakes, längere Laufzeit |
| Q-2 | **Screenreader-Prüfung** (NVDA/VoiceOver) für die vier Werkzeuge und die Quellenseite | M | A-3 ist die größte ungemessene Fläche | braucht geschulte Bedienung, nicht automatisierbar |
| Q-3 | **Lighthouse CI** mit Budgets (LCP, CLS, JS-Größe) | M | T-3; das Datenmodul mit 255 kB ist der wahrscheinlichste Befund | Budgets können den Build blockieren, bevor Optimierung passiert |
| Q-4 | **F2 beheben** (`sizes` an 680 px messen) und Bildmessung wiederholen | S | behebt die 1,31-fache Hochskalierung | keine |
| Q-5 | **`og:image`** als freigegebenes Rastermotiv (1200×630) erzeugen und einbinden | S–M | F3/B7; Social-Preview fehlt projektweit | braucht eine Freigabeentscheidung, kein Agent darf sie erfinden |

## 3. Architektur und Performance

| Nr. | Vorhaben | Aufwand | Nutzen | Risiko |
| --- | --- | --- | --- | --- |
| A-1 | **Taxonomie separat laden** (eigenes Modul oder JSON, bedarfsgeladen) | M | Datenmodul schrumpft um ~93 kB (T-4) | zweite Ladequelle, Offline-Build muss sie einbetten |
| A-2 | **`radiasthesie-views.js` nach Routen teilen** (Themen, Register, Werkzeuge) | M | 1 649 Zeilen werden handhabbar | Kollisionsrisiko während paralleler Arbeit; nur mit Single-Writer |
| A-3 | **CSS bündeln und bereinigen** (Purge, Critical CSS) | M | 3 078 Zeilen Modul-CSS werden ungebündelt ausgeliefert | Purge kann dynamisch erzeugte Klassen (`ptf-*`, `exp-*`, `jr-*`) entfernen |
| A-4 | **Statische Suche** als eigenes Dokument (`radiasthesie/suche.html`) | M | Suchfunktion auch ohne JavaScript | zweiter Index, der veralten kann |
| A-5 | **Bildoriginale nach Git LFS** verschieben | S–M | 26,3 MB weniger im Klon (R-3) | Prüfsummen gegen Commons bleiben, LFS-Abdeckung muss überall greifen |

## 4. Inhalt

| Nr. | Vorhaben | Aufwand | Nutzen | Risiko |
| --- | --- | --- | --- | --- |
| I-1 | **Orakel-Cluster ausbauen** (1 042 → realistisch 2 500 Wörter) mit eigener Quellenrecherche | L | behebt die dünnste Stelle (R-6) | braucht neue, belegbare Quellen; keine Erfindung |
| I-2 | **Geomantie und Kraftorte** als eigene Seiten | L | schließt zwei benannte Lücken der Vernetzung | neue Recherche, neue Bilder, neue Rechteklärung |
| I-3 | **Chakren-Anschluss prüfen** (derzeit auf `#crystals` verlinkt) | S | redaktionelle Genauigkeit der Vernetzung | keine |
| I-4 | **Datierungskonflikt Münchner Versuche** (1986–1988 vs. 1987–1989) abschließend klären | S | der Konflikt steht heute korrekt, aber unbefriedigend im Text | braucht Quellenzugang, nicht nur Fleiß |

## 5. Werkzeuge (nur mit klarer Grenze)

| Nr. | Vorhaben | Aufwand | Nutzen | Risiko |
| --- | --- | --- | --- | --- |
| W-1 | **Tab-Synchronisierung** des Tagebuchs über `storage`-Events | S | zwei Tabs überschreiben sich heute (S-2) | Konfliktauflösung nötig, sonst Datenverlust |
| W-2 | **Import-Warnung bei Schema-Abweichung** statt harter Ablehnung | S | freundlicher bei Gerätewechsel | Darf die Atomarität nicht aufweichen |
| W-3 | **Druckvorlage für das Tagebuch** (Ausdruck der Einträge) | S | Papierarchiv ohne Export | Druck-CSS darf andere Seiten nicht treffen |
| W-4 | **Verschlüsselung des lokalen Speichers** | L | wäre die einzige Antwort auf S-1 | **nicht empfohlen ohne Konzept**: eine Passphrase im Browser erzeugt schnell ein falsches Sicherheitsversprechen; die ehrliche Alternative bleibt „lokal, unverschlüsselt, löschbar“ |

## 6. Nicht vorgeschlagen

- **Kein Server, kein Konto, kein Sync-Dienst.** Das Modul ist bewusst statisch;
  ein Backend würde Datenschutz, Betrieb und Haftung neu aufwerfen.
- **Keine KI-generierten Bilder oder Texte** als Lückenfüller. Wo Quellen fehlen,
  bleibt die Lücke sichtbar (I-2).
- **Keine Wirkungsversprechen** in neuen Inhalten. Die Kennzeichnung A–E ist
  Pflicht, nicht Dekoration.
- **Kein Deployment** als Teil eines Ausbaus. Veröffentlichung ist eine
  Eigentümerentscheidung nach bestandener Abnahme.
