# Nachweis — Quelle [19] auf Ledger-Stand (IARC 2012, Vol. 100D)

Karte: `t_6dc6b194` · Branch: `esoterik-welt/t_6dc6b194-farbwelten-quelle-19-auf-ledger-stand-zi`
Arbeitsbaum: `C:\Users\mas\Arbeit\Esoterik-Welt\.worktrees\t_6dc6b194`
Basis: vom Dispatcher auf `30a2f62` angelegt (Projekt-HEAD `feature/farbwelten-modul`); vor der
Arbeit per Fast-Forward auf `d0fe111` gezogen (= Stand der Elternkarte `t_e3ecc54e`, enthält
`c2b70f4` mit den fünf neuen Farbseiten und die `[24]`/`[31]`-Korrekturen). Ohne diesen Schritt
hätte die Karte gegen einen Stand ohne Ledger-Fassung gearbeitet.

## 1. Sachänderung

Ledger-Fassung (`docs/farbwelten-pruefbericht-t_207023c2.md` §B5, wortgleich mit dem Quellenblock
der fünf neuen Seiten):

```
- [19] IARC 2012, Monographs Vol. 100D Radiation. https://publications.iarc.who.int/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Radiation-2012
```

Alt → Neu in vier Altseiten, zeichengleich:

| Datei | Zeile | Alt |
| --- | ---: | --- |
| `content/farbwelten/farbwelten.md` | 64 | `- [19] IARC (2023). Monograph on artificial optical radiation. https://www.iarc.who.int` |
| `content/farbwelten/violett.md` | 58 | dito |
| `content/farbwelten/chakren.md` | 61 | dito |
| `content/farbwelten/lichtfrequenzen.md` | 53 | dito |

`grep -n "IARC" content/farbwelten/*.md` zeigt danach neun Treffer mit identischem Wortlaut
(4 korrigierte Altseiten + 5 neue Seiten). Keine Restvorkommen von `IARC (2023)` oder
`www.iarc.who.int` in `content/`, `js/`, `scripts/` oder `tests/`.

Diff: 4 × 1 Zeile in `content/farbwelten/*.md`, 6 Zeilen in `js/data/farbwelten.js`
(`SOURCES[19]`-Label, `SOURCES[19]`-URL, `[19]`-Item in der violett-Bibliografie) — nichts sonst.

## 2. Textstellenprüfung (Kartenpunkt 2)

`grep -n "IARC" content/farbwelten/*.md` findet außerhalb der Bibliografie-Zeilen nur Prosa ohne
Jahresangabe; es gibt keine Stelle, die [19] als „IARC (2023)" beschreibt. Alle [19]-Verweise sind
gegen Vol. 100D (Radiation, inkl. UV/optische Strahlung) inhaltlich weiterhin korrekt:

- `chakren.md:40` — „UV außerhalb sichtbar [19]"
- `farbwelten.md:40` — Health-Disclaimer, Lichttherapien `[14][19]`
- `lichtfrequenzen.md:37` — „UV-Strahlung als Gruppe-1-Karzinogen [19]"
- `violett.md:16`, `:34`, `:42` — UV-Bereich / Grenze des sichtbaren Spektrums / keine Heilwirkung
- neue Seiten (`tuerkis.md:37`, `magenta.md:37`, `weiss.md:39`) — „IARC-Monographie [19]
  adressiert künstliche optische Strahlung"

Keine Prosaänderung nötig; die Kartenauflage „Diff zeigt nur die [19]-Zeilen" bleibt erfüllt.
Die Ledger-URL antwortet live mit HTTP 200 (Abruf 2026-11-03).

Nicht angefasst: `docs/board-workspace-recovery/farbwelten-rework-t_e64ae631/CHECKPOINT.md`
nennt „IARC (2023)" als damaligen Befundstand. Das ist ein historischer Checkpoint, kein
Redaktionstext — eine Umschreibung würde den Verlauf verfälschen.

## 3. Regeneration und Zähler

`npm run data:farbwelten` → „Quellen im Register: 16 · Farbwelten: 12, Abschnitte je Seite: 8".

`SOURCES[19]` in `js/data/farbwelten.js` entspricht jetzt dem Ledger:

```js
19: {
  id: '19',
  label: 'IARC 2012, Monographs Vol. 100D Radiation',
  url: 'https://publications.iarc.who.int/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Radiation-2012',
  shortRef: false,
},
```

Damit ist die Ursache der Fehlbewertung beseitigt: Der Generator nimmt bei gleicher URL-Präsenz
das längere Label (`(url ? 100000 : 0) + label.length`); vorher gewann die 53-Zeichen-Altlabel
gegen die 44-Zeichen-Ledgerlabel. Jetzt sind alle Varianten zeichengleich, es gibt nichts zu
bevorzugen.

`node scripts/verify-farbwelten-sync.cjs` → `Farbwelten-Sync: 15 Quellen, 16 Registereinträge,
0 Fehler` (Exit 0).

## 4. Ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `npm run data:farbwelten` | grün, idempotent (danach `git status` nur Sachänderung) |
| `npm run test:farbwelten` | 12/12 pass, 0 fail |
| `node scripts/verify-farbwelten-sync.cjs` | 15 Quellen, 16 Registereinträge, 0 Fehler |
| `npm run build` | grün (`dist/Esoterik-Welt/`), danach Build-Artefakte zurückgesetzt |
| `node scripts/verify-farbwelten.cjs http://127.0.0.1:3198/Esoterik-Welt/` | 81 Prüfungen + 6 Kopfzeilenbreiten, **0 fehlgeschlagen** (`evidence/t_6dc6b194/verify-farbwelten/report.md`) |
| `node scripts/verify-pages.cjs http://127.0.0.1:3198/Esoterik-Welt/` | 66 Seiten/Viewports, **0 failures** (Wiederholung; Erstlauf: 1 transienter `ERR_CONNECTION_REFUSED` auf `tarot`/`moon.js`, siehe §6) |
| gezielte Registerprüfung `evidence/t_6dc6b194/check-[19].cjs` | **9/9 Routen PASS** (`farbwelten`, `violett`, `chakren`, `lichtfrequenzen`, `tuerkis`, `magenta`, `rosa`, `weiss`, `schwarz`) |
| Ledger-URL | HTTP 200 |

Gezielte Registerprüfung (Playwright gegen den Build auf Port 3198), je Route geprüft:
kein `IARC (2023)` im Text, keine Alt-Domain `www.iarc.who.int`, jeder IARC-Link auf die
Ledger-URL, Quellenblock-Eintrag mit Ledger-Label — Ergebnis in
`evidence/t_6dc6b194/check-[19].json`. Die Einstiegsseite rendert **15 Quellen**, davon
`[19] IARC 2012, Monographs Vol. 100D Radiation` mit Ledger-URL.

## 5. Auflagen

Kein Push, kein Deploy. Commit nur im eigenen Worktree-Branch.

## 6. Grenzen und Beobachtungen

- `verify-pages` lief gegen einen lokalen Build (`http://127.0.0.1:3198/Esoterik-Welt/`), nicht
  gegen die Live-Seite. Im ersten Lauf schlug `tarot`/1440 mit `ERR_CONNECTION_REFUSED` für
  `js/data/moon.js` fehl (1 von 66); die Wiederholung war 66/0 grün, die Ursache ist der
  Python-`http.server`, nicht die Änderung.
- Playwright-E2E-Suite (`tests/farbwelten.spec.js`) nicht erneut gefahren; `test:farbwelten`,
  `verify-farbwelten` und die gezielte Registerprüfung decken Quellen und Rendering ab.
- Der Generator bleibt bei seiner Heuristik „längeres Label gewinnt". Solange alle Seiten
  denselben Wortlaut führen, ist das folgenlos; ein Sync-Guard gegen abweichende Labels je
  Kennung ist als Folgekarte angelegt.
