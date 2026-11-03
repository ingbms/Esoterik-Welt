# Checkpoint RAD-14 — Dokumentation und Übergabe

| Feld | Wert |
| --- | --- |
| Paket | ESOW-RAD-14 (Dokumentation und Übergabe) |
| Karte | `t_10d41018`, Master `t_878c59c7` / ESOW-RAD-000 |
| Profil / Modell | `writer`; Kartenvorgabe deepseek-flash, Laufzeitabweichung dieser Wiederaufnahme siehe NACHABNAHME.md §4 |
| Arbeitsbaum | `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul` |
| Bezugsstand | `ceddc84cfca44d53f1995dfd0981b7d70a554724`; Erstübergabe `1f78942` |
| Stand | 3. November 2026 |
| Dokumentationscommit | der Commit, der diesen Ordner enthält (`git log -1 -- docs/radiasthesie-completion/RAD-14/`) |
| Push / Deployment | keiner |

## 1. Ergebnis

Die Übergabe liegt vollständig vor: Architektur, Seitenübersicht, Datenmodell,
Quellenbibliothek, Medien- und Lizenzverzeichnis, vier Bedienungsanleitungen,
Testprotokolle, Änderungsübersicht, Grenzen, Ausbaustufen und Paketmatrix —
zusammen mit `docs/radiasthesie-completion/RELEASE-CANDIDATE.md` und diesem
Checkpoint.

**Status:** Übergabe aktualisiert. F1/F2 sind auf dem Kandidaten unabhängig
freigegeben, siehe [Nachabnahme](NACHABNAHME.md). Das historische negative
Gesamtverdikt wird nicht umgeschrieben. Gesamt-DoD und Veröffentlichung sind
weiterhin getrennte Entscheidungen des Masters bzw. Eigentümers.

## 2. Dateien und SHA-256

Aktuelle Dateiliste, Größen und SHA-256 stehen maschinell erzeugt in
[SHA256SUMS.txt](SHA256SUMS.txt). Textdateien werden vor Größen-/Hashberechnung
auf LF normalisiert, das ZIP wird bytegenau geprüft. Das verhindert Unterschiede
durch Windows-Checkout-CRLF. Ausgenommen sind dieses Summenverzeichnis,
die Checkpoints und der sich selbst beschreibende Prüfbericht. Diese sind über
den Dokumentationscommit identifizierbar (`git log -1 -- docs/radiasthesie-completion/RAD-14`).

Die Produktfingerabdrücke verwenden Git-Blob-Bytes des geprüften Kandidaten,
nicht plattformabhängige CRLF/LF-Checkout-Bytes:
[product-sha256.json](evidence/product-sha256.json).
Die historische Hash-Tabelle des Erstlaufs bleibt in `1f78942` abrufbar;
sie ist kein aktueller Integritätsnachweis.

Die beiden erzeugten Dateien (`QUELLENBIBLIOTHEK.md`, `MEDIEN-LIZENZEN.md`)
entstehen reproduzierbar mit:

```bash
node docs/radiasthesie-completion/RAD-14/scripts/build-uebersichten.cjs
```

Der Lauf meldet: `QUELLENBIBLIOTHEK.md: 66 Quellen · MEDIEN-LIZENZEN.md: 6 Fotos,
4 SVGs, 24 Varianten`.

## 3. Ausgeführte Prüfungen

Aktueller Autoren-Nachtest auf dem Kandidaten: Lint/Format/Build/verify grün,
167/167 Modultests; vollständiger `test:all`-Nachlauf mit Jest 2/2,
Node 242/242, Playwright 147/147. Erster Gesamtlauf Exit 1 (Tarot-Fokus-Timeout),
zwei Einzelläufe danach grün. Rohlogs und getrennte Review-Ergebnisse:
[NACHABNAHME.md](NACHABNAHME.md). Übergabeprüfung:
`scripts/verify-handoff.py`, Ergebnis in `evidence/handoff-validation.json`.
Kein Docs-Renderer im Projekt; Markdown-Struktur geprüft, Darstellung nicht
als in einem Docs-Renderer getestet behauptet.

Die folgende Tabelle dokumentiert nur den historischen Erstlauf auf `5fe5301`:

| Prüfung | Ergebnis |
| --- | --- |
| `node docs/.../build-uebersichten.cjs` | Exit 0, 66 Quellen, 6 Fotos, 4 SVGs, 24 Varianten |
| `npx prettier --check` auf den Generator | konform |
| `npm run lint` (vor Erscheinen der Fremd-Proben) | Exit 0, 0 Fehler / 0 Warnungen |
| 7 Node-Suiten | 164/164, Exit 0 |
| `npm run build` | Exit 0, 7 Dokumente, Sitemap 11, `Lokal.html`, `dist/` |
| `npm run verify:build` | Exit 0, 36 Seiten/Viewports + 7 Dokumente, 0 Fehler |
| `CI=1 E2E_PORT=3455 npx playwright test` | 147/147, Exit 0 (2,1 min) |
| Markdown-Darstellung | **nicht** in einem Renderer dargestellt (das Projekt hat keinen Docs-Renderer); 68 Tabellen maschinell auf gleiche Spaltenzahl je Tabelle geprüft, Pfadangaben stichprobenartig gegen den Arbeitsbaum geprüft |

Details, Umgebung und Datei-Fingerabdrücke: `TESTPROTOKOLLE.md`.

## 4. Arbeitsbaum und Provenienz

F1/F2 wurden in `b420a79` committet und auf `ceddc84` unabhängig nachgeprüft.
Die früheren temporären Probenskripte/Lintfehler sind kein aktueller Zustand;
der Nachtest ist lint-grün. Der gemeinsame Arbeitsbaum enthält sieben geänderte
versionierte PDF/PNG-Evidenzdateien und unversioniertes `evidence/`. Die Tests
schreiben selbst dieselben Ziele, daher keine pauschale Herkunftsbehauptung
„fremd“. Diese Dateien wurden in dieser Wiederaufnahme nicht verändert,
gestaged, gelöscht oder zurückgesetzt. Prüfungen liefen isoliert.

## 5. Restpunkte und nächster Schritt

1. F1/F2 **erledigt, unabhängig bestätigt**. F3/B7 und F4 sowie frühere
   Nicht-F1/F2-Restpunkte bleiben offen.
2. R-1 (Lizenz), R-7 (Datenschutz) und T-1 (CI) brauchen Entscheidungen;
   keine daraus abgeleitete Veröffentlichungsfreigabe.
3. Kein neuer Screenreader-/Firefox-/Safari-/Touch-/DPR>1-/Lighthouse-Nachweis.
   Forschungs-, Verblindungs- und Speichergrenzen bleiben dokumentiert.
4. Sporadischer Tarot-Fokus-Timeout an `t_73ccd862` (`tester`) übergeben;
   vollständiger unveränderter Nachlauf grün, erster Fehler nicht gelöscht.
5. Bestehenden Master `t_878c59c7` für die abschließende 14-Pakete-DoD freigeben;
   diese Karte schließt nur die Übergabephase, nicht den Master.
6. Kein Push/Deployment. Erst ausdrückliche Eigentümerentscheidung erlaubt
   Veröffentlichung. Aktuelle Matrix und Review-Nachweise sind verlinkt.
