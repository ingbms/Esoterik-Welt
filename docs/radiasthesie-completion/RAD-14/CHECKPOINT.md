# Checkpoint RAD-14 — Dokumentation und Übergabe

| Feld | Wert |
| --- | --- |
| Paket | ESOW-RAD-14 (Dokumentation und Übergabe) |
| Karte | `t_10d41018`, Master `t_878c59c7` / ESOW-RAD-000 |
| Profil / Modell | `writer` / deepseek-flash (Kartenvorgabe) |
| Arbeitsbaum | `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`, Branch `feature/radiasthesie-modul` |
| Bezugsstand | `5fe5301` (`git rev-parse HEAD` bei Beginn der Dokumentation) |
| Stand | 3. November 2026 |
| Dokumentationscommit | der Commit, der diesen Ordner enthält (`git log -1 -- docs/radiasthesie-completion/RAD-14/`) |
| Push / Deployment | keiner |

## 1. Ergebnis

Die Übergabe liegt vollständig vor: Architektur, Seitenübersicht, Datenmodell,
Quellenbibliothek, Medien- und Lizenzverzeichnis, vier Bedienungsanleitungen,
Testprotokolle, Änderungsübersicht, Grenzen, Ausbaustufen und Paketmatrix —
zusammen mit `docs/radiasthesie-completion/RELEASE-CANDIDATE.md` und diesem
Checkpoint.

**Freigabestatus: nicht freigegeben.** Die unabhängige Abnahme (`t_29535d62`)
lautet **NICHT ABGENOMMEN**; F1 (WCAG 1.4.1) ist blockierend und wird in
`t_b1641fc1` bearbeitet. RAD-14 dokumentiert diesen Stand, statt ihn zu glätten.

## 2. Dateien und SHA-256 (Stand dieses Checkpoints)

Alle Hashes gelten für den Arbeitsbaum (UTF-8, LF). Ein frischer Windows-Checkout
mit `core.autocrlf=true` erzeugt CRLF und damit andere Hashes — das ist kein
Unterschied im Inhalt.

| Datei | Bytes | SHA-256 |
| --- | --- | --- |
| `README.md` | 3 978 | `decd655b6f4827c60c0cf442d6c164cc001abd2e5dcf7fd3c8026fad95495a48` |
| `ARCHITEKTUR.md` | 10 546 | `7611d0a7c20d2587f742c489ab50ab30249787e47114d5f6112d32b5455c543e` |
| `SEITEN.md` | 6 177 | `b5f1cf66142f85224eedbd1bd1efe8e00e1b3214a85808604ac3c4bd55e19dc8` |
| `DATENMODELL.md` | 9 209 | `f36c5b3e92f5e289c513311f898e29671f91a54b516d5b2ec854559c71b1c4cb` |
| `QUELLENBIBLIOTHEK.md` | 12 167 | `95fd4ce5fdaf7a622a507cbef289cc7a3c085eb563f29320bd512fbcb14fc61d` |
| `MEDIEN-LIZENZEN.md` | 12 426 | `e432dfa015aa1aad465c8f1c3a0c77fe63f01a18b206089837e9f049b02b631a` |
| `BEDIENUNG-PENDELLABOR.md` | 5 586 | `98c3fee1bc4cf833e4bac501a0633c2a42793142087178ac183116d14f64387f` |
| `BEDIENUNG-TAFEL-STUDIO.md` | 6 329 | `fa173c28feec2751bef95452ffcf14f65dc65205ce6e585d23727334ac3248db` |
| `BEDIENUNG-EXPERIMENTIERLABOR.md` | 7 670 | `3bcc301414f59f80dfc0c00a9da6b3f4e0adafde5aa225610cd08c313ffaaf4c` |
| `BEDIENUNG-PENDELTAGEBUCH.md` | 6 878 | `262250694f482a19b083633adbb88f0ccb9f71afcb79eecc45093992777693e1` |
| `TESTPROTOKOLLE.md` | 11 099 | `6c161cc3f77d6bab348d4ae7412fd84752851d19385445a174fc7e4d61e77ec8` |
| `AENDERUNGEN.md` | 7 500 | `9ce40bbf013bc2ce84da60aacb117648a13e641b69bb70d9f7ec8912f62d9a9b` |
| `GRENZEN.md` | 7 838 | `8136b036588d95e3b549acf4917cd980648b51bec6be5bfdb20fc3d77670d586` |
| `AUSBAUSTUFEN.md` | 5 458 | `2da6c6fa0cfbf76a3f7f774d7cea107a411f9d1cc256f331a91978ee2ca0ebda` |
| `PAKETMATRIX.md` | 6 482 | `1843c3cfdc57abc5691fa7763c9c851d460fb9f05d3f38a0a074bf146b2c4b45` |
| `scripts/build-uebersichten.cjs` | 10 858 | `2d2acaa453f8cb46260f80080f974f09acd6a3f73c88ecea87a4cd2025e5f726` |
| `../RELEASE-CANDIDATE.md` | 5 252 | `fd02dc8c8c6a8b4ea8a08814641f68d451cc044c8f71b4948f636360efc56e09` |

Die beiden erzeugten Dateien (`QUELLENBIBLIOTHEK.md`, `MEDIEN-LIZENZEN.md`)
entstehen reproduzierbar mit:

```bash
node docs/radiasthesie-completion/RAD-14/scripts/build-uebersichten.cjs
```

Der Lauf meldet: `QUELLENBIBLIOTHEK.md: 66 Quellen · MEDIEN-LIZENZEN.md: 6 Fotos,
4 SVGs, 24 Varianten`.

## 3. Ausgeführte Prüfungen

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

## 4. Was während der Arbeit im Arbeitsbaum passierte

Die Korrekturkarte `t_b1641fc1` arbeitet parallel im selben Baum. Sie hat
während dieser Dokumentation F1/F2 umgesetzt (Unterstreichung für Fließtext-Links,
`--rad-photo-max` statt fester Breite), die statischen Dokumente neu erzeugt und
Diagnoseskripte unter `probe-t_b1641fc1/` abgelegt. Diese Änderungen sind
**uncommittet**, gehören **nicht** zu diesem Commit und sind in den Testprotokollen
nicht enthalten. Folge: `npm run lint` auf dem heutigen Arbeitsbaum schlägt mit
34 Fehlern in diesen Probenskripten fehl; RAD-14 hat keine davon verursacht und
keine angefasst.

Fremde, bereits vorher vorhandene Änderungen (RAD-08/09/10-Evidenz, `evidence/`)
wurden nicht gestaged, nicht resettet und nicht verändert.

## 5. Restpunkte

1. **F1 ist offen** (WCAG 1.4.1, 7/12 Ansichten); ohne Nachabnahme kein Release.
2. **F2** (`sizes`) und **F3** (`og:image`) sind offen, F3 bewusst.
3. **R-1** (keine `LICENSE`-Datei) und **R-7** (Datenschutzerklärung nennt die
   lokalen Speicher nicht) sind Eigentümerentscheidungen.
4. **T-1**: CI ruft die Radiästhesie-Suiten nicht auf.
5. **Keine Prüfung** von Firefox/Safari, Screenreader, Lighthouse oder echtem
   Druck in diesem Lauf.
6. Nach der F1-Korrektur sind `TESTPROTOKOLLE.md` (§2, §6) und `PAKETMATRIX.md`
   auf den neuen Commit zu aktualisieren.

## 6. Nächster Schritt

1. `t_b1641fc1` abschließen (F1 + F2, Regression 147/147 + `test:all`).
2. Nachabnahme durch `tester` auf dem neuen Commit.
3. RAD-14-Dokumente auf den neuen SHA nachziehen (Testprotokolle, Matrix,
   Release-Kandidat).
4. Erst danach Master-Entscheidung; Veröffentlichung bleibt eine separate
   Eigentümerentscheidung — aus dieser Dokumentation folgt kein Recht dazu.
