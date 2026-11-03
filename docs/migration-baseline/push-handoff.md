# Übergabe an den Push — Katalogpaket

**Karte:** `t_9c2a7824` · **Basis:** `baseline/rubriken-2026-11-03` (`9f58439`) · **Branch:** `wt/t_cbbf71e0`
**Entscheidung:** GO mit Auflagen (siehe `release-gate.md`)
**Zweck:** Diese Seite beantwortet die fünf Fragen, die beim Push sonst gestellt würden.

---

## 1. Was wird ausgeliefert?

Nur Dokumentation und Prüfwerkzeuge. Kein Produktivcode.

| Pfad | Inhalt |
| --- | --- |
| `docs/migration-baseline/00-schema-und-scope.md` | verbindliche Katalogstruktur und Scope |
| `docs/migration-baseline/schema/catalog.schema.json` | JSON Schema für beide Kataloge |
| `docs/migration-baseline/design-catalog.json` | 277 Design-Einträge (170 Tokens, 59 Komponenten, 12 Zustände, 10 Layouts, 5 Muster, 2 Icons, 6 Illustrationen, 13 Umbruchpunkte) |
| `docs/migration-baseline/content-catalog.json` | 54 Inhalts-Einträge (10 Seiten, 15 Unterrouten, 22 Artikel, 3 Rechtstexte, 2 UI-Texte, 2 Glossare) + 6 Claims |
| `docs/migration-baseline/content-catalog-meta.json` | Lokalisierung, Tonalität, Lücken, Herkunft (bewusst außerhalb des Katalogschemas) |
| `docs/migration-baseline/media-catalog.csv` | 644 Mediendateien mit Maßen, Hashes, Lizenzstatus |
| `docs/migration-baseline/funktionen-katalog.md` + `function-catalog.md` | 96 Funktionen in 10 Bereichen |
| `docs/migration-baseline/design-system.md`, `design-tokens.json`, `content-catalog.md` | generierte Fassungen (Quelle: JSON) |
| `docs/migration-baseline/design-review*.md/json`, `design-katalog-luecken.md` | unabhängige Prüfung und Lückenliste |
| `docs/migration-baseline/inventory-baseline.json` | Bestandsaufnahme der Baseline |
| `docs/migration-baseline/release-gate.md`, `push-handoff.md` | Freigabeentscheidung und diese Übergabe |
| `docs/migration-baseline/evidence/**` | Belegdateien (Messungen, Screenshots, Reparaturprotokolle) |
| `scripts/migration-baseline/**` | Validatoren, Renderer, Mess- und Prüfwerkzeuge |

## 2. Was ist bewusst ausgenommen?

| Ausgenommen | Grund |
| --- | --- |
| `index.html`, `css/`, `js/`, `data/`, `assets/`, `dist/` | Produktdateien; in diesem Arbeitspaket nicht verändert |
| `public/` (17 Dateien) | wird von `build-pages.cjs` nicht kopiert, daher nicht öffentlich |
| `data/articles/article-01…12.md` | eigener Textbestand ohne Route; Entscheidung E-03 offen (A-5) |
| Fünf Altdateien (33 KB) | von der Baseline nicht genutzt, als Restbestand dokumentiert |
| Unversionierte Entwürfe unter `docs/` und `evidence/` | nicht freigegeben; nur lesend für Herkunft geprüft |
| VELARKANA-Umbenennung, Repository-Anlage | eigenes Arbeitspaket nach diesem Gate |

## 3. Was muss vor dem PR noch passieren?

1. **Nichts Blockierendes.** `node scripts/migration-baseline/verify-release-gate.cjs` muss auf dem
   PR-Kopf `ok: true` liefern.
2. **Unabhängige Nachprüfung durch den Master** — dieselbe Datei ist die Empfehlung der
   Reparaturkarte, nicht die Freigabe einer zweiten Instanz.
3. Die drei Katalogwarnungen (`CNT-LEG-002`, `CLM-003`, `MED-0130`) sind beabsichtigt und in
   `release-gate.md` Abschnitt 4 als Auflagen A-2, A-3, A-4 mit Owner und Termin hinterlegt.

## 4. Wie wird geprüft?

```bash
node scripts/migration-baseline/verify-release-gate.cjs            # Gesamturteil, ~90 s
node scripts/migration-baseline/verify-release-gate.cjs --self-test # 5/5 Negativkontrolle
```

Erwartete Ausgabe: `"ok": true`, `"must_failed": []`, `"structural_errors": 0`.
Kennzahlen: 331 Katalogeinträge, 6 Claims, 644 Medienzeilen, 96 Funktionen, 39 geprüfte Routen.

## 5. Was ist der Rückweg?

Der Branch ist nicht gepusht, `main` ist unberührt. Ein Rückweg ist daher nur nötig, wenn der PR
zurückgenommen wird: Branch löschen, keine Produktdatei betroffen, keine Migration ausgeführt.
Es wurden keine produktiven Dateien, Zugangsdaten oder externen Dienste verändert.

---

**Unterschriftsreife Kurzfassung:** Das Katalogpaket ist vollständig, schema-konform, gegen die
veröffentlichte Baseline reproduzierbar und ohne Produktänderung prüfbar. Es kann über einen
separaten PR konsolidiert werden; die fünf Auflagen betreffen den nächsten Produkt- bzw.
VELARKANA-Push, nicht diesen PR.
