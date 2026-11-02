# Prüfprotokoll t_a0f14bb2 — Frequenzlabor-Abschlussreview

Stand: 2026-11-03 · Prüfobjekt `580ed53` (Produkt), `b1bf1df` (QA) · Arbeitsbaum `C:\Users\mas\Arbeit\Esoterik-Welt-review`, Branch `docs/review-frequenzlabor`

Alle Angaben sind Ergebnisse eigener Läufe in diesem Arbeitsbaum; nichts wurde aus den Umsetzer- oder QA-Berichten übernommen.

## 1. Umgebung

```
OS: Windows 11 (git-bash/MSYS)
Node: v24.13.0   npm: 11.8.0   Playwright: 1.64.1
Build: npm run build  ->  dist/Esoterik-Welt/ + Lokal.html
Server: PORT=3466 node index.js  ->  http://127.0.0.1:3466/Esoterik-Welt/
```

## 2. Testläufe

| Befehl | Ergebnis |
| --- | --- |
| `npm run test:frequencies` | tests 12 · pass 12 · fail 0 · cancelled 0 |
| `npm run test:frequenz` | tests 34 · pass 34 · fail 0 · cancelled 0 |
| `E2E_PORT=3455 npx playwright test tests/frequenzlabor.spec.js` | 14 passed (14,4 s), U1–U14 |
| `npm run lint` | eslint `--max-warnings 0`, keine Ausgabe = 0 Fehler |
| `npm run check:frequenz-budget` | NFR-1 17 Dateien 291 343 B roh / 85 613 B gz (Limit 86 275) · NFR-2 6 Dateien 108 533 B roh / 27 882 B gz (Limit 100 000) · NFR-3 13 733 B roh / 2 903 B gz (Limit 6 000) · „Alle Budgets eingehalten" |

## 3. Vertragsdrift ADR §4.1 vs. `js/modules/frequenz-engine.d.ts`

Skript: `%LOCALAPPDATA%\hermes\profiles\reviewer\cache\scratch\check-contract.cjs` (entfernt nur den `.d.ts`-Dateikopf, vergleicht dann byte-gleich).

```
adr_block_bytes 9395 dts_bytes 9395
VERTRAG IDENTISCH
```

## 4. Cousto-Nachrechnung (awk, Perioden aus astronomischen Daten)

```
Erdentag  194.18 (soll 194.18)
Erdjahr   136.10 (soll 136.10)
Mond syn  210.42 (soll 210.42)
Merkur    141.27 (soll 141.27)
Venus     221.23 (soll 221.23)
Mars      144.72 (soll 144.72)
Jupiter   183.58 (soll 183.58)
Saturn    147.85 (soll 147.85)
```
Formel: `f = (1/T) * 2^n` mit T in Sekunden; n so, dass der Ton im von Cousto genutzten Bereich liegt.

## 5. Quellen-Stichproben (curl, 2026-11-03)

```
200 https://openstax.org/books/college-physics-2e/pages/17-6-hearing
200 https://pmc.ncbi.nlm.nih.gov/articles/PMC6333694/
200 https://pmc.ncbi.nlm.nih.gov/articles/PMC10198548/
403 https://www.iso.org/standard/3601.html                (Bot-Schutz)
200 https://pubmed.ncbi.nlm.nih.gov/31031095/
200 https://science.nasa.gov/wp-content/uploads/2023/05/154_48a5766284d47dc2523cb38d856654f6_STOLCVIKTOR.pdf
200 https://planetware.de/octave/The_CoOc_Tuning.pdf
200 https://pmc.ncbi.nlm.nih.gov/articles/PMC5656389/
200 https://www.nibib.nih.gov/science-education/science-topics/ultrasound
200 https://openstax.org/books/university-physics-volume-1/pages/17-4-normal-modes-of-a-standing-sound-wave
200 http://library.pyramidal-foundational-information.com/books/Healing%20Codes%20for%20the%20Biological%20Apocalypse%20Puleo.pdf
200 https://www.encyclopedia.com/arts/dictionaries-thesauruses-pictures-and-press-releases/pitch
403 https://www.iso.org/files/live/sites/isoorg/files/news/magazine/ISO%20Focus+%20(2010-2013)/en/2012/ISO%20Focus+,%20Nov.-Dec.%202012.pdf
```

Inhaltsprüfungen:
- PMC6333694: „alpha … most frequently defined in the range of 8–13 Hz (85/84 % of studies)" — deckt die Angabe im Datensatz.
- PLOS ONE Ingendoh et al. 2023: systematisches Review, Wirkungen „inconclusive at best" — Datensatz sagt „Wirkungen umstritten".
- PubMed 31031095: 432 Hz senkt Herzfrequenz stärker als 440 Hz (Pilotstudie, Autoren fordern größere Stichprobe) — Status `plausibel` korrekt.
- WHO „Safe listening": 80 dB über 40 Stunden/Woche (WHO-ITU H.870) — Disclaimer-Angabe korrekt.

## 6. Browser-Prüfung (lokaler Build, Chromium über Browser-Harness)

Hub `#frequenzen`:
```
title: Frequenzen & Schwingungen — Bibliothek und Frequenzlabor | Esoterik-Welt
h1: Frequenzen & Schwingungen
Einträge: 32          Label: "32 Einträge · 10 hörbar"
Quellenlinks (https): 26
Kurz-Disclaimer sichtbar: ja
Lang-Disclaimer sichtbar: ja, 842 Zeichen, enthält "80 dB"
Filter Evidenz = "nicht belegt": 6 von 32 sichtbar
```

Labor `#frequenzen/labor`:
```
Deckel-Label: "Deckel: −6 dBFS"
Gehörschutz-Hinweis: "Startpegel −20 dBFS. Tief starten, Gehör schützen, Pausen machen.
                      Kopfhörer sind nur für binaurale Töne nötig."
Kurz-Disclaimer: "Bildungs- und Experimentierangebot, kein Medizinprodukt.
                  Keine Heil- oder Gesundheitsversprechen. Leise hören, Pausen machen."
Binaural-Hinweis: "Zwei kanalgetrennte Töne (links/rechts). Nur mit Kopfhörern hörbar.
                   Demonstration einer Differenzfrequenz; keine belegte EEG-Wirkung."
```

M-1-Reproduktion (Slider `#fqFreqRange` fokussiert, zweimal Pfeil rechts):
```
readout: "444,7 Hz"
number:  "440"
slider:  "449"
```
→ Befund B1 bestätigt: Slider und Zahlenfeld divergieren.

## 7. Weitere Code-Prüfungen

- `git grep -nIE "ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY"` → keine Treffer.
- `git diff b18bdb3..HEAD -- package.json` → nur npm-Skripte (`test:frequencies`, `test:frequenz`, `check:frequenz-budget`, `test:all`), keine neue Laufzeitabhängigkeit.
- `playwright.config.cjs:38` → `reuseExistingServer: !process.env.CI` (m-3 bestätigt).
- `startSweep()` in `js/modules/frequenzlabor.js` → keine Ansage beim Start, nur `announce` nach Ende (m-1 bestätigt).
- `data/frequencies.json:9` → „begrenzt die Ausgabe hart auf -20 dBFS" (m-2 bestätigt).
- `git ls-tree origin/main js/modules/` → `_tarot_old.js`, `runes.js.bak`, `runes.js.bak2` sind vorbestehend, nicht Teil dieses Features.
- Link `docs/frequenz-quellen.md` im gebauten Preview: `curl` → 404, weil `scripts/build-pages.cjs` `docs/` nicht nach `dist/` kopiert; auf GitHub Pages (Quelle `main:/`) existiert die Datei, wird aber als Markdown ausgeliefert (B6).

## 8. Screenshots

`C:/tmp/review-hub-1440.png`, `C:/tmp/review-lab-1440.png` (Playwright-CLI, 1440×900, lokaler Build). Nicht im Repo eingecheckt; die QA-Belege unter `evidence/t_835bd1e9/screens/` decken 360/768/1440 px ab.
