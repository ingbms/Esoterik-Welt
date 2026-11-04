# A-5 — Zwölf Markdown-Artikel als Blogartikel 11–22

**Karte:** `t_44e58074` · **Datum:** 2026-11-03 (UTC-Tag des Laufs; lokal bereits 04.11.)
**Branch:** `esoterik-welt/t_44e58074-esow-a-5-zw-lf-markdown-artikel-als-blog`
**Eingang:** `a3ffe38` = `main` `9f58439` (Tag `baseline/rubriken-2026-11-03`) + Katalog-PR #19 (`de9f3cc`)
**Umsetzung:** `a3fe4cb` · **Nachweis:** der Commit, der diese Datei enthält
**Auslieferung:** eigener PR gegen `main`; kein direkter Push auf `main`.

## 1. Entscheidung

E-03 ist entschieden (Eigentümer, 2026-11-03, Variante A): Die zwölf Markdown-Artikel unter
`data/articles/` werden **veröffentlicht**, nicht entfernt. Damit entfallen die Auflage A-5 und die
Gate-Punkte S9 (Entscheidung) und S10 (Altlast `article-010.md.bak`).

## 2. Datenpipeline

| Baustein | Datei | Vertrag |
| --- | --- | --- |
| Quelle | `data/articles/article-01.md` … `article-12.md` | Frontmatter (`title`, `date`, `category`, `tags`, `readTime`, `relatedPosts`) + Body mit genau einer H1 |
| Generator | `scripts/generate-articles-data.cjs` | liest, prüft, erzeugt `js/data/articles-markdown.js`; IDs 11–22 in Dateireihenfolge |
| Erzeugnis | `js/data/articles-markdown.js` | `export const articlesMarkdown = [...]` mit `id, title, category, date, readTime, excerpt, tags, content` |
| Schreiben | `npm run data:articles` | Generator im Schreibmodus |
| Prüfen | `npm run verify:articles` | `--check` (bytegenau, Exit 1 bei Abweichung) + `--self-test` (12 Prüfungen) |
| CI | `.github/workflows/ci.yml` (Job `unit-test`) | Schritt „Check article data“ nach den Jest-Tests |

`js/data/articles.js` bleibt unverändert: Die zehn kuratierten Einträge sind kein Generatorprodukt.

Der Generator lehnt nicht unterstützte Markdown-Konstrukte mit **Datei:Zeile** ab: Tabelle (`| …`),
Blockquote (`> `), Link (`](`), Bild (`![`), Trennlinie (`---`, `***`, `___`) und Codeblock
(```` ``` ````). Zusätzlich geprüft: Pflichtfelder, gültiges Kalenderdatum, **kein Datum in der
Zukunft**, bekannte Kategorie, H1 = Frontmatter-Titel, `readTime` passend zur Wortzahl.

Abgeleitete Felder (bewusst nicht im Frontmatter, damit es nur eine Wahrheit gibt):

- `readTime` = `ceil(Wörter / 200)` im Format `"N Min"`; das Frontmatter-Feld wird dagegen validiert.
- `excerpt` = erster Absatz, an Satzgrenzen auf 200–240 Zeichen geschnitten; das frühere
  Frontmatter-Feld `excerpt` ist entfallen.
- `category` = deutscher Frontmatter-Wert über die Mapping-Tabelle des Generators.

## 3. Blog-Integration

- `js/modules/blog.js` lädt beide Module (`articles.js`, `articles-markdown.js`) und führt sie zu
  **22** Einträgen zusammen.
- **Sortierung geändert:** vorher Array-Reihenfolge, jetzt `date` absteigend (bei Gleichstand ID
  aufsteigend). Im Grid stehen daher zuerst 22…11, danach die kuratierten Einträge 10…1.
- `#categoryFilter` kennt zusätzlich `astrologie` (`index.html`).
- `#articleListStatus` meldet „Alle 22 Artikel werden angezeigt.“ bzw. „N von 22 Artikeln …“; der
  Knopf `#loadMoreArticles` bleibt verborgen und deaktiviert (alle Artikel werden sofort gerendert).
- `#blog/11` … `#blog/22` öffnen über `findArticle`/`applyRouteMeta` den richtigen Artikel; der
  Dialogtitel kommt aus `article.title`, der Body aus dem renderer-konformen Markdown.

Kategorie-Mapping und Verteilung:

| Frontmatter | Filterwert | Artikel (Markdown) | gesamt mit kuratiertem Bestand |
| --- | --- | --- | --- |
| Tarot | `tarot` | 11, 12, 16 (Vergleich), 21 | 6 |
| Kristalle | `crystals` | 13, 17, 22 | 6 |
| Mond | `moon` | 14 | 2 |
| Runen | `runes` | 15 | 3 |
| Praxis | `rituals` | 19, 20 | 3 |
| Astrologie | `astrologie` | 18 | 1 |
| Vergleich | `tarot` | 16 (Tarot-vs.-Runen) | — |
| — | `history` | — | 1 (kuratiert) |

Jede der sieben Filteroptionen liefert damit mindestens einen Treffer; die exakten Zahlen prüft
`tests/blog-articles.spec.js` gegen die Datenmodule.

## 4. Redaktion

- **Datumsreparatur (gesetzte Annahme):** Reihe von `2026-11-01 … 2026-11-12` auf
  `2026-10-23 … 2026-11-03` verschoben, Reihenfolge und 1-Tages-Abstand erhalten. Vorher lagen neun
  von zwölf Daten in der Zukunft.
- **`readTime`** neu berechnet (200 Wörter/Minute, aufgerundet): Ergebnis 3–4 Min statt 5–6 Min.
- **`excerpt`** aus dem ersten Absatz erzeugt, 201–239 Zeichen, jeweils ganze Sätze.
- **Textlänge:** 600–704 Wörter je Artikel (vorher 112–356). Erweitert wurde ausschließlich mit
  belegtem Material aus dem eigenen Bestand: Tarot-, Runen-, Kristall-, Mond- und Astrologiedaten,
  `radiasthesie/orakel.html` (Tarot-/Runen-Historie, Forer-Effekt) und `content/farbwelten`
  (Chakra-Regenbogenmodell 1977). Keine neuen Wirkungsbehauptungen; Tradition, Hypothese und Befund
  bleiben getrennt.
- **Renderer-Konformität:** Blockquote in `article-01.md` → Absatz „Hinweis zur Tradition:“;
  Tabelle in `article-06.md` → Liste. Der Renderer wurde nicht erweitert.
- **Redaktionelle Korrekturen:** Kartenamen an die Datenbasis angeglichen (Die Herrscherin/Der
  Herrscher, Der Eremit, Die Liebenden), Tag `achsamkeit` → `achtsamkeit`, Grammatikfehler
  („Die Nummerierung nicht willkürlich.“) behoben.

## 5. Auslieferung, Dubletten, Altlasten

- `data/articles/article-010.md.bak` ist entfernt (E-04/S10), im Build zusätzlich durch den
  bestehenden `*.bak*`-Filter ausgeschlossen.
- **`_config.yml` (neu):** GitHub Pages verarbeitet die Wurzel mit Jekyll und erzeugte aus jeder
  `.md`-Datei eine zweite HTML-Seite. `exclude: data/articles/` nimmt beide Varianten aus dem
  Auslieferungspfad; die Jekyll-Standardausschlüsse (`node_modules`, `Gemfile`, `vendor/…`) stehen
  vollständig darunter. Die Quellen bleiben versioniert und für den Generator lesbar.
- `.nojekyll` wurde bewusst **nicht** gesetzt: Es würde die Jekyll-Verarbeitung site-weit abschalten
  und damit auch `_`-Präfix-Dateien (`js/modules/_tarot_old.js`, `docs/…/_navprobe.html`)
  öffentlich machen.

HTTP-Status (gemessen, nicht abgeleitet):

| URL | live am 2026-11-03 (vor Merge) | lokal nach `npm run build` (dist) | GitHub Pages nach Merge (erwartet) |
| --- | --- | --- | --- |
| `/Esoterik-Welt/data/articles/article-01.html` | **200** `text/html` | **404** | **404** |
| `/Esoterik-Welt/data/articles/article-01.md` | 404 | 200 `text/markdown` | **404** (durch `_config.yml`) |
| `/Esoterik-Welt/data/articles/article-010.md.bak` | **200** `application/octet-stream` | **404** | **404** |
| `/Esoterik-Welt/index.html` | 200 `text/html` | 200 `text/html` | 200 `text/html` |

Die Live-Spalte wurde mit `curl` gegen `https://ingbms.github.io/Esoterik-Welt/…` erhoben, die
dist-Spalte gegen `node index.js` (`/Esoterik-Welt`-Präfix). Die Pages-Spalte folgt aus der
Jekyll-Regel; sie ist **nach dem Merge am deployten Commit zu wiederholen** — vor dem Merge lässt
sich Jekyll lokal nicht ausführen (kein Ruby/Jekyll im Arbeitsbaum).

## 6. Katalog und Dokumente

- `content-catalog.json`: `CNT-ART-011` … `CNT-ART-022` auf `status: final`, `release_relevance: must`,
  `delivery: shipped`, Routen `#blog/11` … `#blog/22`, `text_ref` auf die H1-Zeile (`L9`),
  `acceptance_check` je Eintrag, Überschriftenliste aus den Quellen.
- `content-catalog-meta.json`: E-03 als entschieden festgehalten („veröffentlicht“, Variante A),
  Lückenliste um E-03 und die `.bak`-Altlast bereinigt, Änderungsprotokoll mit Datums-,
  readTime-, Excerpt- und Längenkorrektur.
- `release-gate.md`: S9 und S10 auf „erledigt“, A-5 auf „entschieden/erledigt“ (2026-11-03).
- `push-handoff.md`: §2 führt die zwölf Artikel nicht mehr als ausgenommen.
- `katalog-abschluss.md`: A-5-Zeile nachgezogen.
- `funktionen-katalog.md`: BLG-Zeilen auf 22 Artikel, neue Zeilenspannen, Nachweis
  `tests/blog-articles.spec.js`; Testabdeckung 68/96 statt 65/96.
- `README.md`: Blog-Zeile auf 22 Artikel und die Pipeline umgestellt.

## 7. Prüfnachweise

| Prüfung | Ergebnis |
| --- | --- |
| `npm run verify:articles` | `--check`: „OK … ist aktuell“; `--self-test`: 12/12 Prüfungen |
| `npm run test:unit` (Jest) | 2 Suites, 24 Tests, alle grün (davon 22 Generator-Vertragstests) |
| `npm run test:pages` | 6/6 |
| `npm run test:offline` | 2/2; `#articleGrid` rendert **22** Karten aus `Lokal.html` |
| `npm run test:e2e` | 229 Tests: 228 grün; 1 Fehler war ein Umgebungsdefekt (`node_modules/axe-core` fehlte lokal, Paket steht in `package-lock.json`). Nach `npm i --no-save axe-core@4.14.0` lief die betroffene Spec 20/20 grün. CI installiert es über `npm ci`. |
| `npm run lint` | Exit 0, 0 Warnungen |
| `npm run format:check` | „All matched files use Prettier code style!“ |
| `npm run build` | 7 Dokumente, Sitemap 11 Einträge, dist + Lokal.html erzeugt |
| `validate-schema.cjs` | 16 Prüfungen, 0 Abweichungen |
| `validate-catalogs.cjs` | 0 Fehler, 3 benannte Warnungen (CLM-003, CNT-LEG-002, MED-0130) |
| `render-catalogs.cjs --check` | design-tokens, design-system, content-catalog OK |
| `check-catalog-routes.cjs` | **51** Routen, 0 nicht gefunden, 0 verlinkt-aber-nicht-katalogisiert |
| `verify-release-gate.cjs` | `ok: true`, `must_failed: []`, `structural_errors: 0`, 10/10 Muss-Kriterien |
| `verify-release-gate.cjs --self-test` | `ok: true`, `clean_run_errors: 0` |
| `verify-release-gate-facts.cjs` | 12/12 Erwartungen wahr, u. a. `blogListIs22`, `blog22Opens`, `blog22IsKristallGrids` |
| `verify-media-catalog.cjs` | 17/17 |
| `build-media-catalog.cjs --check` | 644 Zeilen, CSV aktuell |
| `inventory-baseline.cjs --check` | OK (Arbeitsbaum) |

## 8. Gesetzte Annahmen und bewusste Abweichungen

1. **Datumsreihe** `2026-10-23 … 2026-11-03` ist gesetzt (Auftrag), nicht aus den Quellen abgeleitet.
2. **Sortierung** im Blog ist jetzt Datum absteigend; die sichtbare Reihenfolge ändert sich dadurch
   auch für die zehn kuratierten Artikel (vorher Array-Reihenfolge).
3. **`excerpt` und `readTime`** sind abgeleitete Felder. Das Frontmatter-`excerpt` entfällt, damit es
   keine zweite Wahrheit gibt; `readTime` bleibt im Frontmatter und wird gegen die Wortzahl geprüft.
4. **`Vergleich` → `tarot`**: Der Tarot-vs.-Runen-Artikel bleibt so im Tarot-Filter sichtbar; eine
   achte Kategorie hätte nur einen einzigen Artikel und keine zweite Quelle.
5. **Quellen bleiben versioniert, sind aber öffentlich nicht abrufbar.** Das ist strenger als die
   Empfehlung der Karte („Rohdateien unschädlich“) und vermeidet jede Doppelauslieferung.
6. **Medienprüfung EOL-normalisiert** (gefundener Defekt): `media-catalog.csv` war gegen einen
   CRLF-Checkout gerechnet; auf einem LF-Checkout (Linux-CI) schlugen drei Zeilen fehl. `bytes` und
   `sha256` werden für Textformate jetzt mit LF gerechnet (Builder, Prüfer, Validator); die drei
   betroffenen Zeilen (`MED-0156…0158`) sind nachgezogen.
7. **`verify-release-gate.cjs`** schreibt die auslösende Karte aus `HERMES_KANBAN_TASK` ins
   Prüfprotokoll (Fallback: historische Karte `t_9c2a7824`), damit der Nachweis nicht die falsche
   Karte nennt.

## 9. Offene Punkte

- **Live-Verifikation nach dem Merge:** `data/articles/article-01.html` muss auf GitHub Pages 404
  liefern; die Prüfung ist am deployten Commit zu wiederholen. Vor dem Merge ist sie nicht möglich.
- Die drei Gate-Warnungen bleiben unverändert und sind nicht Gegenstand dieser Karte: `CLM-003`
  (Rot-Wellenlänge ohne Quelle), `CNT-LEG-002` (Datenschutz/Entwurf), `MED-0130` (offene Lizenz).
- Die Sitemap führt weiterhin nur `index.html`; die Artikel sind Hash-Routen (`#blog/11`) und damit
  keine eigenen URLs. Bewusst unverändert.

## 10. Datei-Hashes (sha256 des Commits)

Erzeugnisse und Kerndateien:

| Datei | sha256 |
| --- | --- |
| `js/data/articles-markdown.js` | `d74596992f12d157783fcade908992f2d4c61dd3f91236d354be385213bd4d32` |
| `scripts/generate-articles-data.cjs` | `d3eba55c7aafde1635001964ee4ea538d382699ade6f850dfd43d800103ac03c` |
| `js/modules/blog.js` | `54deda523543d7f7c59f8a843700d9b67118534fd58f65f2abc40cd49384b644` |
| `index.html` | `4a31329e96d6e868aebbf6e4856cc1b6c27889eb1485d5f0f664e329f87df266` |
| `_config.yml` | `915156c7a04f3afb6c209d0a097d9b3a1de6e56ef5b5de8f61e0d04b1a275c2a` |
| `tests/generate-articles-data.test.js` | `573f6fa475659f5936c3c1c76d4c8ccdb3a38d16333111ce0838290bf6077503` |
| `tests/blog-articles.spec.js` | `eae229070d2f2ecd60d186611bf1f59985add396902c2d648e623dd8abde1c29` |
| `docs/migration-baseline/content-catalog.json` | `28e559dcaf1f99f323e027101f92a6e261d238165ac9c0f72030711ab2890c36` |
| `docs/migration-baseline/content-catalog-meta.json` | `29ddc1711c7732cd43d58a60ddb919717f564498717245c4e63c70642e485f7a` |
| `docs/migration-baseline/funktionen-katalog.md` | `2c35fd1e345c9d352402669a111f07ce562ba3837f8062958d29c296ef586d87` |
| `docs/migration-baseline/release-gate.md` | `c650a71eed529e01f8035b1ec9ff8b1f05f5776e9daae8286f7c00c5fcf7cd1b` |
| `docs/migration-baseline/push-handoff.md` | `8b3af0d5d7b4fd162bb560a60104811c25e6da7a2910d891133f1982ac49c5cb` |

Redaktionsquellen:

| Datei | sha256 |
| --- | --- |
| `data/articles/article-01.md` | `489b58e937a0e20d1a5cc7a7a7d5198312e106544b3da7ee7bf32bd61d116753` |
| `data/articles/article-02.md` | `2e4865fc898455e1fb2ae3c3ca6dbbb3ac1202084ecfd129961644a742f739da` |
| `data/articles/article-03.md` | `e3edf8eb251e4d3ddc17ce7b136e5a50418e7d7d9e36a7864474d3ce39ef5898` |
| `data/articles/article-04.md` | `8538e89152fbf49c544ac0be9944c6dcfcfc8bbae67a1c7c849f01074a064ffd` |
| `data/articles/article-05.md` | `721ffd4a84f47862cac180b9d26993c479b6edad7121432b845a180cdc2184c1` |
| `data/articles/article-06.md` | `1798689b9163f734c59daa0e223552b87eb436bf4aed651fdb496f2387db43a2` |
| `data/articles/article-07.md` | `83e0bc7ce8378870ad26cb168714e98e61c50a466bb4014c83c7d4ef75e72787` |
| `data/articles/article-08.md` | `602bb3f8f70bdf4360843911c74c090aff55baa03ce602802cfd7c2c22c6e148` |
| `data/articles/article-09.md` | `ba3a50ed36286a1a85f16203440ac37ec01a56e8bb6da00145e1f83c94a60155` |
| `data/articles/article-10.md` | `41cb8c87d58692865d5b0349ae930c3f3aa5aaed0ccb6b6900ac6c02f52302d5` |
| `data/articles/article-11.md` | `f85f695ffcab3d8cdc11fe4d676dcd017f91cb717092542ae678ac3c54303ffb` |
| `data/articles/article-12.md` | `0f59b4e5f1875a4d27689dea22a3eb8b5f6e1935298f090a333168e87505a8ee` |

Die Hashes sind mit `git cat-file blob <commit>:<pfad> | sha256sum` reproduzierbar; für die
`.md`-Quellen und `js/data/articles-markdown.js` entsprechen sie den Bytes im Commit (keine
CRLF-Konvertierung im Blob).
