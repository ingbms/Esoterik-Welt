# RAD-06 — Checkpoint: Themenseiten erweitert, Delta quellengetreu eingebunden

Stand: 3. November 2026 · Branch `feature/radiasthesie-modul` · Basis `90704be`
Commit: `8c48b70` (25 Dateien) · Karte: t_d7d2de78 (Writer, Modell deepseek/deepseek-flash) · kein Push, kein Deployment.

## 1. Was diese Karte geliefert hat

Delta auf dem vorhandenen Stand — die drei Themenseiten und 30 Kapitel wurden
**nicht neu geschrieben**, sondern erweitert:

1. **Quellenbasis 33 → 66.** Der RAD-02-Bestand (Q34–Q66) ist in
   `docs/radiasthesie-konzept/recherche/quellen.json` übernommen, in das
   Bestandsschema überführt und um Prüftiefe, Interessensvermerk, Datenqualität
   und Aussagen-IDs ergänzt. Die 31 unveränderten Bestandseinträge sind
   programmatisch gegen einen Schnappschuss geprüft; die zwei beauftragten
   Korrekturen (K03 an Q01, K04 an Q30) sind einzeln protokolliert.
2. **Inhalte.** Radiästhesie: drei neue Absätze in Kapitel 1, Agricola und
   Freiberg in Kapitel 2, Institutionen und Datierungskonflikt in Kapitel 3,
   Soziologie und Aufbaudaten der Münchner Versuche in Kapitel 4, Biotensor und
   Instrumententypologie in Kapitel 5, Gesundheits- und Physikbehauptungen in
   Kapitel 6, **neues Kapitel 9 „Untersuchungen“** (schließt den IA-Anker
   `#befunde`, der im IA-Konzept §6 vorgesehen, aber nie angelegt war),
   überarbeitete Einordnung. Pendeln: Mechanik, Militärprüfungen, Formen und
   Materialien, Chevreul-Quantifizierung, Negativbefund Homöopathie,
   Werkzeug-Anleitungen der vier implementierten Werkzeuge. Orakel: die
   Ankündigung eines „interaktiven Vergleichs“ ist entfernt (er existiert
   nicht).
3. **Medien.** Sechs Commons-Fotos aus RAD-05 sind über das Medien-Manifest in
   das Datenmodell eingebunden (zwei je Themenseite), mit `<picture>`
   (AVIF + WebP), Maßen aus dem Manifest und Attributionszeile je Bild.
   Bildunterschriften und Alt-Texte stammen unverändert aus dem Manifest.
4. **Bildnachweise und Lizenzen** als neuer Abschnitt der Methodik-Seite:
   alle sechs Fotos mit Urheber, Lizenzlink, Änderung, Länder-/Markenhinweisen,
   Share-Alike-Absatz für die zwei CC-BY-SA-3.0-Motive, Hinweis auf die fehlende
   LICENSE-Datei für die eigenen Zeichnungen.
5. **Datenschutz korrigiert.** Die Methodik-Seite behauptete „keine Speicherung
   von Eingaben“; das Pendeltagebuch (RAD-10) speichert lokal. Der Absatz nennt
   jetzt Schlüsselpräfix, fehlende Verschlüsselung, fehlende Übertragung und die
   vollständige Löschmöglichkeit.
6. **Glossar 13 → 17 Begriffe** (Biotensor, Einhandrute/Tensor, Fernmutung,
   Ideomotorik), je mit Stufe und Quelle.
7. **Einstiegstext**: Quellenbasis, Prüftiefen-Verteilung, Wortbudgets und
   dreizehn offene Fragen statt sechs (RAD-02-Lücken aufgenommen).

## 2. Dateien (mit SHA-256, Stand dieser Karte)

```
e3625137066e02b0be0b79902b386cc66c7a6ec24f593c54fd6313dcfb22896c  docs/radiasthesie-konzept/inhalte/radiaesthesie.md
5d6b045a65e9fa1d07958e5cabd4ae2ab9ad3d866aba656de7e6dc93ea018848  docs/radiasthesie-konzept/inhalte/pendeln.md
270a81d1629a31b3a839afefd495a2d7ed96dfdc122b9ee18a7fca3c12bdb853  docs/radiasthesie-konzept/inhalte/orakel.md
86d05470c7ab0aa08a1e0711ac5f1565c0745b0413e76c46cd0a144dd3036239  docs/radiasthesie-konzept/inhalte/modul-einstieg.md
3c4f05144b2928dd588d933145f9318a07736ee8295498fd76986814732f9ed4  docs/radiasthesie-konzept/inhalte/glossar.md
a4f97650698ffd880899f023ef85d069523a5da76015fa2f4e53b50551615fc2  docs/radiasthesie-konzept/inhalte/quellenverzeichnis.md
5fc889e0e066f2d20279444b64f6e3afe5724703c800dde731ea621f8dc4faf4  docs/radiasthesie-konzept/recherche/quellen.json
cc6c522077d95bfb107be3b35ceb8535619193b5b2356723908d0ba342bfe1cc  docs/radiasthesie-konzept/daten/taxonomie.json
ab2778358343689d1a6b0f32222661ade6c8de8293135ecdbbda13c7044b3891  scripts/generate-radiasthesie-data.cjs
03b5c3a50c60d9e4831cb37cb21d9de515cd6e9ddf0f272f2e2980391c41cdf6  js/data/radiasthesie.js (generiert)
73a4a9a26babcb2a65dc2ae9000395378e63c1023a22e1a8267cf1ae17637590  js/modules/radiasthesie-views.js
cf9276a8ee160c0dca21da23efa3b737e0072426ce3903b917fee2faf46e0d0d  css/radiasthesie.css
4711a16038374cddf7bf59eaf6a3b8334762daf959c2d103604155caa93df0a8  tests/radiasthesie.mjs
15fa6001851a0e3afae43e8d8294c5517744ee5ce03417dd488e251acd51c8dd  tests/radiasthesie-vertraege.mjs
b6977af2695b0c024cc7bd0e434a31adf7cb4ecd2f24fb8e97134c0cd1dfe50d  Lokal.html (generiert)
```

Neu in diesem Paket: `docs/radiasthesie-completion/RAD-06/` (dieser Checkpoint,
`INHALT-QUELLEN-BILD-MATRIX.md`, `matrix.json`, `HANDOFF-RAD-12.md`,
`quellen-merge-report.json`, `scripts/merge_quellen_delta.cjs`,
`scripts/verify_rad06.cjs`, `CHECKSUMMEN.sha256`).

## 3. Ausgeführte Prüfungen (echte Läufe, keine Absichtserklärungen)

| Prüfung | Ergebnis |
|---|---|
| `node docs/radiasthesie-completion/RAD-06/scripts/merge_quellen_delta.cjs` | Exit 0 — 66 Quellen, 31 Bestandseinträge unverändert, 2 beauftragte Korrekturen, 5 Stufen-Abbildungen |
| `node scripts/generate-radiasthesie-data.cjs` | Exit 0 — 3 Themen, **31 Kapitel**, **66 Quellen**, **17 Glossarbegriffe**, 6 Fotos, 4 eigene Zeichnungen |
| `node --test tests/radiasthesie.mjs` | 18/18 |
| `node --test tests/radiasthesie-vertraege.mjs tests/radiasthesie-simulator.mjs tests/pendeltafel-studio.mjs tests/experiment-statistik.mjs tests/journal-speicher.mjs` | 127/127 |
| `npx eslint . --max-warnings 0` | 0 Fehler, 0 Warnungen |
| `npx prettier --write` auf den geänderten Dateien | ausgeführt |
| `node docs/radiasthesie-completion/RAD-06/scripts/verify_rad06.cjs` | **211 Prüfungen, 0 Fehler** — Inhalts-, Aussagen-, Bild- und Linkmatrix, WebP-Maße am Dateikopf geprüft, 114 interne Linkziele aufgelöst |
| `node docs/radiasthesie-completion/RAD-06/scripts/check_bestand.cjs` | 203 Sätze der Vorfassung geprüft, **185 wortgleich erhalten**, 18 begründete Abweichungen (Exit 1, weil Abweichungen existieren — nicht als Fehler zu lesen) |
| `npm run build` | Exit 0 — `Lokal.html` und `dist/Esoterik-Welt/` neu erzeugt |
| `npm run verify:build` | 36 Seiten/Viewports, 0 Fehler (darunter `pendeln` bei 1440 px) |
| `node scripts/verify-pages.cjs http://localhost:3478/Esoterik-Welt/` | 36 Seiten/Viewports, 0 Fehler — Navigation Tarot→…→Pendeln→Blog→Home real durchgeklickt |
| `node scripts/verify-pages.cjs` ohne Argument (Produktions-URL) | **schlägt fehl** — die veröffentlichte Seite unter ingbms.github.io enthält das Pendeln-Ziel noch nicht; das ist der Vor-Deployment-Zustand, kein Regressionsbefund dieser Karte |

## 4. Bewusste Entscheidungen (dokumentiert statt stillschweigend)

- **Kein Beschnitt, kein fester 520×400-Slot für Fotos.** Der bestehende
  Zeichnungs-Slot hätte die Fotos beschnitten; die Höhe folgt dem echten
  Seitenverhältnis aus dem Manifest. `object-fit: cover` aus dem RAD-05-Hinweis
  wird deshalb *nicht* gesetzt — Begründung im Code-Kommentar von
  `photoFigure()`.
- **AVIF wird ausgeliefert** (`<source type="image/avif">`), WebP als zweite
  Quelle, `<img>` als Rückfall. RAD-05 hatte AVIF erzeugt, aber nicht
  eingebunden.
- **Taxonomie bleibt bei „planned“ für die Fotos.** Der Vertrag
  (`radiasthesie-vertraege.js`) verlangt für `available` einen flachen
  SVG-Pfad unter `assets/radiasthesie/`. Statt den Vertrag zu lockern oder eine
  zweite Wahrheit zu schaffen, verweist `taxonomie.note` auf das Manifest als
  maßgebliche Quelle für Fotos.
- **Kapitelzahl 30 → 31.** Neues Kapitel `befunde` schließt den im IA-Konzept
  §6 vorgesehenen, aber fehlenden Anker.
- **Textkorrekturen am Bestand** (jeweils inhaltlich begründet, nicht
  stillschweigend): „Wünnscher“ → „Rutengänger oder Wünscher“; Q05-Zeile auf
  Mayer 2003 (K01); Q01-Jahr (K03); Q30-ISBN/Verifikation (K04);
  Q02-Dublette vermerkt (K02); Verlag Betz/König als Selbstverlag (K05);
  „404“-Formulierung entschärft (K06); Orakel-Ankündigung eines interaktiven
  Vergleichs entfernt.
- **Datierungskonflikt bei den Münchner Versuchen offen benannt:** Die
  Vorfassung schrieb „1987–1989“, die RAD-02-Aussage C04 belegt „1986–1988“
  (aus Q42). Beide Angaben stehen jetzt im Text — keine stillschweigende
  Ersetzung, keine Glättung.
- **Erhalt der Vorfassung gemessen:** Ein Satzvergleich gegen `HEAD~1`
  (Skript im Scratch, Ergebnis unten) findet 185 von 203 Sätzen der drei
  Themenseiten wortgleich wieder. Die 18 Abweichungen sind: eine Typokorrektur,
  vier Verweis-Umbauten („Abschnitt 5“ → „Kapitel 9“, „Abschnitt 9“ →
  „Orakel-Seite“), die Datierungsergänzung, die Q05/Q43-Präzisierung, zwei
  zusammengelegte Absätze im Pendel-Kapitel 10, die Neufassung der
  Einordnungsabsätze und des SEO-Fußblocks, das entfernte Orakel-Versprechen
  und Anführungszeichen-Normalisierungen.

## 5. Offene Punkte und Restrisiken

1. **RAD-12 ist nicht erledigt und war nicht zu erledigen.** Das statische
   `dist/Esoterik-Welt/index.html` enthält die Kerntexte **nicht** ohne
   JavaScript (gemessen: „Agricola“, „Untersuchungen“, „Biotensor“, „Carpenter“
   je 0 Treffer im ausgelieferten HTML; in `Lokal.html` je 1 Treffer). Die
   Daten- und Ansichtsschicht ist dafür vorbereitet — Vertrag in
   `HANDOFF-RAD-12.md`.
2. **Medien und RAD-02-Dokumente sind im Arbeitsbaum untracked**:
   `assets/radiasthesie/media/` (RAD-05), `docs/radiasthesie-completion/RAD-02/`,
   `RAD-05/`, `evidence/`. Diese Karte committet sie nicht (fremde Deliverables);
   ohne sie sind die Bildverweise im Commit toter Pfad. RAD-11 muss sie
   zusammen mit diesem Commit stagen.
3. **Nur Chromium 155 geprüft**, kein Firefox/Safari, kein Screenreader,
   kein echter Drucker. `verify:pages` misst Layout und Navigation, keine
   Sprachausgabe.
4. **Externe Quellen nicht neu abgerufen.** Die Locator-Prüfung stammt aus
   RAD-02 (33 Locators, 403/406 als Publisher-Sperren belegt). Diese Karte hat
   keine neuen Netzabrufe gemacht; Lizenz-URLs wurden nur auf HTTPS geprüft,
   nicht erneut geöffnet.
5. **Die Aussagen-Zuordnung ist eine redaktionelle Leistung, keine Messung.**
   `verify_rad06.cjs` prüft, dass die Hauptquelle einer Aussage im zugeordneten
   Kapitel zitiert wird — nicht, dass der Satz die Quelle erschöpfend
   wiedergibt. Die Stufe gilt je Aussage; RAD-02 markiert zwei Aussagen als
   widersprüchlich (C05, C29) und drei als unbelegt (C17, C18, C24) — genau so
   stehen sie im Text.
6. **Orakel-Cluster bleibt dünn** (~1.050 Wörter gegenüber ~2.900 bei
   Radiästhesie). Das Delta hatte keine Orakel-Quellen; die Lücke ist im
   Einstiegstext benannt und nicht kaschiert.
7. **`verify:pages` gegen die Produktions-URL schlägt fehl**, bis das Modul
   deployt ist. Der lokale Lauf gegen `dist/` ist grün. Nicht als Erfolg
   umgedeutet.

## 6. Nächster Schritt

RAD-11 (Integration): Medienordner und RAD-02/RAD-05-Belege stagen, Staging nur
über die Radiästhesie-Allowlist, danach RAD-12 mit dem Handoff-Vertrag
(statische Dokumente je Route, Canonical, BreadcrumbList, Sitemap ohne
Fragmente). Kein Push auf `main`.
