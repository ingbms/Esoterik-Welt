# Reparaturbericht t_b5861420 — Artikel-/Skip-Link-Routing, Sitemap, tote UI-Verweise

**Scope:** `C:/Users/mas/Arbeit/Esoterik-Welt` (ingbms/Esoterik-Welt), lokaler Stand.
**Kein Commit, kein Push, kein Deploy.** HEAD bleibt `24d8053ebc1bc4438a35a1c52b5d6f8c1718594e`.
**Basis:** lokaler Build vom 2026-11-01 nach `npm run build` (bestehender Build, keine Sicherheitsflags).
**Prüfbrowser:** Chromium 156.0.8078.4 (Playwright), Windows, Viewports 375/768/1440 × 900.

## 1. Ausgangslage (gemessen, nicht angenommen)

Der eingefrorene Vorzustand wurde als eigener Build-Snapshot gesichert
(`evidence/t_b5861420/snapshot-before/`, identisch zu `dist/Esoterik-Welt/` vor jeder Änderung)
und mit demselben Harness wie der Nachzustand gemessen
(`evidence/t_b5861420/results-before.json`, `summary-before.json`).

| Befund | Vorher gemessen |
|---|---|
| M8a Artikel-Deep-Links `#blog/1`…`#blog/10` | **0/20** korrekt (HTTP 0/10, `file://` 0/10): `activeSeiten=[]`, `mainText=0`, nur Header/Footer |
| M8b Skip-Link + echte Enter-Taste | **0/8** korrekt (4 Routen × HTTP/Datei): danach `#main`, alle `.page` hidden, `mainHeight=0`, `mainTextLen=0` |
| M8c unbekannte Route / Artikel-ID | 8/8 leer (`#unbekannte-route-xyz`, `#blog/99`, `#blog/abc`, `#main` je HTTP/Datei, `mainTextLen=0`) |
| M9 Sitemap | 17 `<loc>`, **17/17 falsche Origin** (`https://esoterik-welt.github.io/`), 16 Fragment-Einträge; Live-GET aller 17 URLs **404** |
| robots.txt | `Sitemap: https://esoterik-welt.github.io/sitemap.xml` (404) |
| L1 Footer | 3 × `href="#"` (Einsteiger-Guide, Glossar, Quellen) |
| L2 „Mehr laden“ | sichtbar, klickbar, 10 → 10 Karten, **0 neue IDs** |
| L3 OG-Bild | `og:image` + `twitter:image` → `assets/og-preview.png` = **404** |
| N7 rohe Rechtsseiten (`file://`) | transparent, Times New Roman, Stylesheets laden nicht |

## 2. Ursachen und Entscheidungen

**M8 (ein Ursachenkomplex):** `js/main.js` benutzte `location.hash.replace('#','')` direkt als
`pageId`. Jeder Hash, der keine `.page`-ID ist (`blog/1`, `main`, Tippfehler), traf
`page.classList.toggle('active', page.id === pageId)` für **alle** Seiten falsch → alle
`.page` hidden. `#main` (Skip-Anker) wurde damit zur Pseudo-Seite.

Umgesetzt in `js/main.js`:

* `parseRoute(hash)` liefert genau einen Typ: `page` (home/tarot/crystals/moon/runes/blog),
  `article` (`blog/<id>`), `skip` (`#main`) oder `unknown`.
* `applyRoute(route, opts)` ist der einzige Einstieg für Kaltstart, `hashchange` und `popstate`.
* `#main` ist **kein** Routentyp-Ziel: Klick auf `.skip-link` wird abgefangen, die aktuelle
  Seite bleibt aktiv, `main` erhält Fokus (`focusMain()`), Scrollposition wird unter dem
  Sticky-Header ausgerichtet. Der Skip-Link schreibt bewusst **keine** History.
* Unbekannte Route: aktuelle Seite bleibt stehen (Kaltstart → `home`), zusätzlich erscheint
  eine ehrliche Meldung `„#…“ gehört zu keiner Seite dieser Website.` mit Rückweg
  „Zur Startseite“. Die URL wird dabei nicht umgeschrieben (kein History-Eingriff).
* `#blog/<id>` mit gültiger ID 1–10: Blog-Seite aktiv **und** Artikeldialog mit genau diesem
  Artikel. Unbekannte ID (`#blog/99`, `#blog/abc`): Blog-Seite bleibt sichtbar, Meldung
  `Der Artikel „#blog/99“ existiert nicht.` + „Alle Artikel ansehen“.
* Dialog/URL-Zustand (bewusst spezifiziert): Ein per Karte geöffneter Artikel ist ein eigener
  History-Eintrag (`{articleEntry:true}`); Schließen (×, Escape, Backdrop) geht per
  `history.back()` auf `#blog` zurück. Vorwärts öffnet den Artikel wieder, Reload auf
  `#blog/<id>` öffnet ihn erneut. Ein bereits vorhandener Deep-Link-Eintrag wird beim
  Schließen stattdessen auf `#blog` umgeschrieben. Routenwechsel schließt den Dialog ohne
  URL-Nachbesserung (`suppressArticleUrlSync`).

`js/dialog.js` erhielt dafür einen optionalen `onClose`-Hook (rein additiv; alle vier Dialoge
nutzen weiter dieselbe Lifecycle-Logik). `js/modules/blog.js` erhielt `findArticle()`,
`openArticleModal(id, {updateUrl})` und den Hook `onArticleOpened`.

**M9:** `sitemap.xml` listet jetzt nur real crawl­bare Dokumente unter der tatsächlichen
Pages-Basis: `/`, `/impressum.html`, `/datenschutz.html`, `/haftung.html` (4 `<loc>`,
keine Fragmente). Fragment-Deep-Links bleiben als SPA-Routen nutzbar, werden aber nicht mehr
als eigene Dokumente behauptet. `robots.txt` verweist auf
`https://ingbms.github.io/Esoterik-Welt/sitemap.xml`; die `Disallow`-Pfade sind auf die
Projektbasis qualifiziert. Rechtsseiten erhielten `rel=canonical` auf ihre echten Dokument-URLs.

**L1:** „Einsteiger-Guide“ verlinkt zielgenau auf den vorhandenen Artikel 6
(`#blog/6`, Titel „Einsteiger-Guide: Wie du mit Tarot, Kristallen und Runen beginnst“).
„Glossar“/„Quellen“ hatten kein Ziel und wurden entfernt, statt `href="#"` zu behalten.

**L2:** Es gibt keine zweite Artikel-Seite. Der „Mehr laden“-Knopf ist im Markup `hidden` +
`disabled`, wird von `syncArticleStatus()` immer deaktiviert gehalten, und an seiner Stelle
steht der ehrliche Statustext „Alle 10 Artikel werden angezeigt.“ (bei Filter z. B.
„2 von 10 Artikeln werden angezeigt.“). Kein Re-Render derselben Karten mehr.

**L3:** `assets/og-preview.png` existiert nicht und es wird in dieser Karte kein Bild erzeugt.
Deshalb wurden die kaputten Bildmetadaten entfernt (`og:image`, `twitter:image`) und
`twitter:card` auf `summary` gesetzt; `og:url`/`canonical` bleiben korrekt.

**N7:** `impressum.html`, `datenschutz.html`, `haftung.html` haben jetzt denselben
`LOCAL-ENTRY`-Block wie `index.html`: unter `file:` wird auf das generierte
`Lokal-<name>.html` umgeleitet (Hash/Search werden mitgenommen). Der Block wird vom bestehenden
`scripts/build-local.cjs` aus den generierten Dateien entfernt; die HTTP-Fassung behält
`<base href="/Esoterik-Welt/">`.

## 3. Nachher-Messung (frischer Build)

Quelle: `evidence/t_b5861420/summary-after.json`, `results-after.json`, `extras-after.json`,
`views-after.json`. Rohdaten enthalten jeden Einzelwert; hier die Aggregate.

| Kriterium | Ergebnis |
|---|---|
| Artikel-Deep-Links (HTTP `/Esoterik-Welt/` + echtes `file://` über `index.html`→`Lokal.html`) | **20/20** korrekt: Blog aktiv, Dialog offen, Titel identisch zur Karte (10/10 HTTP, 10/10 Datei) |
| Skip-Link, echte Enter-Taste (home/blog/crystals/tarot × HTTP/Datei) | **8/8**: Seite bleibt aktiv, `mainTextLen>0`, `main` fokussiert |
| Unbekannte Route / ID | `#unbekannte-route-xyz` → home sichtbar (616 Zeichen) + Meldung; `#blog/99`, `#blog/abc` → Blog sichtbar (3423 Zeichen) + Meldung; kein leerer Zustand mehr (vorher 0) |
| Unbekannt **in** laufender Sitzung (`#tarot` → `#gibt-es-nicht`) | Tarot bleibt aktiv (2991→3062 Zeichen inkl. Meldung), Meldung sichtbar, „Zur Startseite“ führt zu home, Back zeigt die Meldung erneut |
| Dialog-Tastatur/Fokus | Fokus im Dialog, 6× Tab bleibt im Dialog, Panel passt in 375/1440, Schließen stellt Fokus wieder her |
| Back / Forward / Reload / Close | `#blog/3` → Back `#blog` (zu) → Forward `#blog/3` (offen) → Reload `#blog/3` (offen) → Escape `#blog` (zu); Deep-Link `#blog/7` → × → `#blog` — identisch in HTTP und Datei |
| Footer | 0 Platzhalter; Wissen-Spalte: „Artikel-Archiv“ (`#blog`), „Einsteiger-Guide“ (`#blog/6`); Klick öffnet Artikel 6 in HTTP **und** Datei |
| „Mehr laden“ | `hidden=true`, `disabled=true`, nicht sichtbar; Status „Alle 10 Artikel werden angezeigt.“; 10 → 10 Karten, 0 neue IDs |
| OG/Twitter | 0 Bild-Metas (vorher 2 × 404), `twitter:card=summary`; `og:url`/`canonical` = `https://ingbms.github.io/Esoterik-Welt/` |
| Sitemap | 4 `<loc>`, 0 falsche Origin, 0 Fragmente, alle 4 lokal **200**; Live-GET aller 4 URLs auf `https://ingbms.github.io/Esoterik-Welt/…` = **200**; Gegenprobe `https://esoterik-welt.github.io/…` = **404** |
| robots.txt | `Sitemap` = `https://ingbms.github.io/Esoterik-Welt/sitemap.xml` (Formatprüfung grün) |
| N7 rohe Rechtsseiten `file://` | leiten auf `Lokal-impressum/datenschutz/haftung.html` um: Hintergrund `rgb(10, 5, 18)`, Fließtext Inter, Überschrift Cinzel, Rücklinks auf `Lokal.html` |
| Kanonischer Einstieg `/Esoterik-Welt/` (ohne Fragment) | home aktiv, Text 538 Zeichen, **URL bleibt ohne Hash** (kein künstliches `#home`), `og:url`/`canonical` korrekt |

## 4. Erhaltene Nachher-Eigenschaften (M1–M7/N5/N6)

| Prüfung | Ergebnis |
|---|---|
| Routenrendering 6 × 3 Viewports | 18/18 aktiv, 0 Dokument-Overflow, Hintergrund `rgb(10, 5, 18)` |
| M7 Kaltstart | `scrollY=0` in allen 18 Ansichten; Titelabstand 48 px unter dem Header bei tarot/crystals/moon/runes/blog (alle 3 Breiten). Zusatz: auch `#home` startet jetzt bei `scrollY=0` (vorher 72 px durch native Fragmentnavigation) |
| M6 Kristalldialog | Bild/Info-Überlappung 0 × 0 px² in 375/768/1440, Escape schließt |
| Kartenüberlauf | 0 bei Artikel- und Kristallkarten (1440) |
| N6 Artikelmarkup | Titel genau 1× im Dialog, kein Rohmarkdown, `aria-labelledby` unverändert |
| Kontrast (sichtbare Elemente) | Minimum **10.035** — identisch vorher/nachher |
| Laufzeitfehler | 0 `pageerror`, 0 `console.error` über alle Messläufe |
| Projekt-Tests | `npm run test:pages` 6/6 pass |

**Build-Treue:** `extras-after.json` → 12/12 ausgelieferte Dateien (`index/impressum/
datenschutz/haftung/404`, `js/main.js`, `js/modules/blog.js`, `js/dialog.js`, `css/main.css`,
`css/design-system.css`, `sitemap.xml`, `robots.txt`) sind Root↔`dist/Esoterik-Welt` bytegleich.
`Lokal.html` enthält kein `<base>`, keine `HTTP-*`/`LOCAL-ENTRY`-Marker und keine
Google-Font-Referenz; `Lokal-impressum.html` enthält keinen `LOCAL-ENTRY`-Block mehr.

## 5. Geänderte Produktdateien

| Datei | Änderung |
|---|---|
| `js/main.js` | Router (`parseRoute`/`applyRoute`), Skip-Anker, Fehlerhinweis, History-Führung |
| `js/modules/blog.js` | `findArticle`, `openArticleModal(id,{updateUrl})`, `onArticleOpened`, `syncArticleStatus`, gemeinsames `renderCards`, „Mehr laden“ entfernt |
| `js/dialog.js` | optionaler `onClose`-Hook |
| `index.html` | `#routeNotice` in `<main>`, Statuszeile + `hidden disabled` „Mehr laden“, Footer-Links, OG/Twitter-Bildmetadaten entfernt |
| `css/main.css` | `.route-notice`-Shell |
| `impressum.html`, `datenschutz.html`, `haftung.html` | `LOCAL-ENTRY`-Umleitung für `file:`, `rel=canonical` |
| `sitemap.xml` | 4 crawl­bare Dokumente, korrekte Origin, keine Fragmente |
| `robots.txt` | Sitemap-Origin korrigiert, Pfade auf Projektbasis |
| `Lokal*.html`, `dist/**` | ausschließlich über `npm run build` neu erzeugt |

Unverändert: `scripts/build-pages.cjs`, `scripts/build-local.cjs`, `404.html` (Hash-Identität
in `baseline-hashes.txt` ↔ `after-hashes.txt`).

## 6. Reproduktion

```bash
cd C:/Users/mas/Arbeit/Esoterik-Welt
npm run build
PHASE=after node evidence/t_b5861420/measure2.cjs     # Sektionen A–H, resumierbar via STAGE=
node evidence/t_b5861420/summarize.cjs after
PHASE=after node evidence/t_b5861420/extras.cjs
PHASE=after node evidence/t_b5861420/views.cjs
npm run test:pages
```

Vorzustand: identische Skripte mit `PHASE=before SITE=evidence/t_b5861420/snapshot-before`.
Der Harness startet einen lokalen Express-Server unter `/Esoterik-Welt/` (gleiche Basis wie
GitHub Pages) und öffnet zusätzlich echte `file://`-URLs; Produktdateien werden nicht
geschrieben.

## 7. Grenzen

* Nur Chromium 156/Windows; kein Safari/Firefox, kein Realgerät, kein Zoom/Print/Performance.
* Skip-Link mit echter Enter-Aktivierung wurde bei 375 px auf 4 Routen × 2 Modi geprüft,
  nicht zusätzlich bei 768/1440.
* Die Live-Prüfung belegt Origin/Base-Korrektheit (200 auf `ingbms.github.io/Esoterik-Welt/…`,
  404 auf `esoterik-welt.github.io/…`), **nicht** eine Veröffentlichung: die Live-Site liefert
  weiterhin den alten Stand (`24d8053`), weil diese Karte nicht deployt.
* `tests/local-entry.cjs` wurde nicht ausgeführt: es schreibt nach `evidence/t_4f0ebfc2`
  (Evidenz einer fremden Karte) und hätte diese überschrieben. Die Datei-/Offline-Abdeckung
  erfolgt stattdessen über Sektion A/B/C/D/G des Harness.
* Jest (`npm test`) bleibt bei der bekannten Discovery-Grenze (N13) — nicht Teil dieser Karte.
* Keine Aussage über Screenreader, WCAG-Zertifizierung oder reale Nutzerführung.
