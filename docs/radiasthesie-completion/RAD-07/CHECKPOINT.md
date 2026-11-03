# RAD-07 — Checkpoint Pendelsimulator

Stand: 3. November 2026, 03:55 lokal · Branch `feature/radiasthesie-modul`
Basis-Commit: `bfca75b` · Arbeitsbaum: `C:/Users/mas/Arbeit/esow-rad-t_878c59c7`
Umfang: **Delta-Karte** auf dem bestehenden Modul, kein Neustart. Kein Push,
keine Veröffentlichung, kein Deployment.

## Was jetzt existiert

Eine echte Route `#pendeln/labor` im vorhandenen `#pendeln`-Router:

- Regler für Pendellänge (5–200 cm), Anfangsauslenkung (0–80°) und
  Dämpfungsgrad ζ (0–0,200), jeweils mit `<label for>`, `<output for>` und
  `aria-describedby`-Hinweis.
- Start/Stop als Button mit `aria-pressed`, Zurücksetzen, im reduzierten Modus
  „Schritt 0,5 s“ statt Dauerlauf.
- Drei Pendeldarstellungen (Messingkegel, Stahlkugel, Metallring) als
  SVG-Gruppen; dieselbe Physik, nur andere Zeichnung.
- Reale Anzeige: simulierte Zeit, aktuelle Auslenkung, gemessene
  Schwingungsdauer (Nulldurchgänge, interpoliert) und T₀ der
  Kleinwinkelformel zum Vergleich.
- Modell dokumentiert auf der Seite und in `MODELL.md`: nichtlineare
  Bewegungsgleichung, RK4 mit festem Schritt 1/480 s, Akkumulator,
  Gültigkeitsbereich, Dämpfungsformel.
- Betriebs-/Lebenszyklus: `requestAnimationFrame` wird bei Stop, beim
  Neu-Rendern der Modulansicht, bei `hashchange` weg von der Route und bei
  `pagehide` beendet.
- Werkstatt-Karte der Startseite: „Verfügbar“ + Link ins Labor (Generator
  erzeugt den Zustand, nicht handgepflegte Daten).

## Dateien und SHA-256

| Datei | SHA-256 |
| --- | --- |
| `js/modules/pendel-simulator.js` (neu) | `8272ad5b89f5c1548ed91ec1607f4cd948abd445118d72c2f2a0976384df0f11` |
| `js/modules/radiasthesie.js` | `1780fa7b3cb213a03025ffb1b69548f4cc6ea7008f01ab0eea97620191b2ca33` |
| `js/modules/radiasthesie-views.js` | `ea11059fca8d963a8ea544626a727d34d7a0fcffa0318d72815f413f1d0a5a2c` |
| `js/modules/radiasthesie-model.js` | `bcf1eaea757b1d619ebcf2e9a82ca5f6ff8ba25f96c685a9290d43a21dfb68e9` |
| `js/modules/radiasthesie-format.js` | `b75d552d64c1e2e200ed4dd2fa054e98b63058358eff28904607009364c9dc69` |
| `js/data/radiasthesie.js` (generiert) | `9b009720ab62a3078df23be177e51baee636dfa51422d607f989d8915708001a` |
| `scripts/generate-radiasthesie-data.cjs` | `3ad7bd5ba5130d93b58644b6d7a2ff33d8e1cdc0cc383998b0ee9231271c9964` |
| `css/radiasthesie.css` | `30d5210f7a85b3eccc9f2ac0e4a7f5fe32be3e0ccb026e668b5453cb3880f1a6` |
| `tests/radiasthesie-simulator.mjs` (neu) | `3b5e368d6db2cef7135659139fa44b94a4b51644b91339a7b49dfe5362d7b826` |
| `tests/radiasthesie-simulator.spec.js` (neu) | `e20ba603042b0f71eb1bb223f1c632b83ff384dc8141baf856c94d1f90f16fe4` |
| `package.json` | `6afb64375feee19009e7b8c8e5c6af68068a98fbb0ee7353e5076669bcc89378` |
| `Lokal.html` (generiert) | `4319a8845630dee3626a5ce6d61416b15ec95342fa5bd7b3501d71581cd3d47c` |

`Lokal.html` ist bewusst mitcommittet: `npm run build` erzeugt die Datei aus
den Quellen, und der file://-Build ist Teil der Abnahme. `dist/` bleibt
untracked. Fremde, untracked gebliebene Pfade (`assets/radiasthesie/media/`,
`docs/radiasthesie-completion/RAD-02/`, `RAD-05/`, `evidence/`) wurden nicht
angefasst.

## Ausgeführte Tests (alle in diesem Lauf)

| Befehl | Exit | Ergebnis |
| --- | --- | --- |
| `node --test tests/radiasthesie-simulator.mjs` | 0 | 21/21 |
| `npm run test:radiasthesie:simulator` | 0 | 21/21 (neuer Skripteintrag) |
| `node --test tests/radiasthesie.mjs` | 0 | 16/16 (Bestand) |
| `node --test tests/radiasthesie-vertraege.mjs` | 0 | 19/19 (Bestand) |
| `npm run lint` | 0 | 0 Fehler, 0 Warnungen |
| `npx prettier --check` (9 geänderte JS/CSS/MJS/JSON-Dateien) | 0 | konform |
| `npm run data:radiasthesie` | 0 | idempotent; Diff nur `landing.workshop` |
| `npm run build` | 0 | Offline-Datei + `dist/Esoterik-Welt` |
| `npm run test:pages` | 0 | 6/6 |
| `npm run test:offline` | 0 | 2/2 |
| `npm run verify:build` | 0 | 36 Seiten/Viewports, 0 Fehler |
| `npx playwright test tests/radiasthesie-simulator.spec.js` | 0 | 11/11 |
| `npx playwright test` (Gesamtsuite) | 0 | 98/98 (mehrfach, siehe Flake-Hinweis) |

Physikalische Nachweise (Auszug, vollständig in `MODELL.md`):

- T₀(0,25 m) = 1,003033 s; gemessen bei 2°: 1,003108 s (Fehler −0,0002 %).
- Exakte Periode über AGM bei 60°: 1,076437 s; gemessen 1,076434 s.
- Abweichung der Kleinwinkelformel: +1,203 % (25°), +7,318 % (60°),
  +13,749 % (80°).
- Gedämpfte Periode bei ζ = 0,05: gemessen 1,555843 s, T_ζ = 1,555839 s.
- Zeit-/FPS-Unabhängigkeit: < 1e-9 Differenz bei 1/60, 1/144 und 0,25 s
  Zustellung; Energie-Drift ungedämpft über 30 s: −1,21e-10.
- rAF-Nachweis im Browser: Frame-Zähler steigt nach Stop und nach
  Routenwechsel nicht weiter (zwei eigene Tests).

## Sichtprüfung (Belege in `evidence/`)

| Bild | Inhalt |
| --- | --- |
| `desktop-labor-idle.png` | Seite im Ruhezustand, 1440 × 1000 |
| `desktop-simulator-idle.png` | Bühne + Regler, 25 cm / 25° / ζ 0,020 |
| `desktop-simulator-running.png` | laufend, Kugel-Darstellung, 100 cm / 60° |
| `desktop-reduced-step.png` | reduzierter Modus nach zwei Schritten (1,00 s) |
| `desktop-modell.png` | Modell- und Formelabschnitt |
| `mobile-simulator.png`, `mobile-labor.png` | 390 × 844, Touch-Kontext |

Geprüft wurde: Winkelbogen und Pendelseite zeigen in dieselbe Richtung,
Zahlenwerte stehen rechts neben den Reglerbeschriftungen, keine Überläufe,
Messwerte lesbar, Formeln begrenzt auf Textbreite, Modellzeichnung auf 680 px.
Kontrast (berechnet, Tokens): Primär auf `--color-bg-card` 8,42:1, Sekundärtext
9,09:1, Primärtext 13,86:1; dekorative Rahmen 1,83:1 (kein Steuerelement).

## Grenzen und offene Punkte

- **Nur Chromium 155** (Playwright-Bundle). Firefox/Safari nicht gefahren.
- **Kein Screenreader-Lauf.** Geprüft sind Struktur (Labels, `role="status"`,
  `aria-live`, ein H1, keine Überschriftensprünge), nicht die Ansage.
- **Druck/PDF nicht real geprüft**; `@media print` blendet nur die Bedienung
  aus.
- **Lighthouse nicht gefahren.**
- **Bestehender Flake, nicht durch RAD-07 verursacht:** In einem von vier
  Gesamtläufen schlug `tests/radiasthesie.spec.js` › „Tastatur: Skip-Link,
  Fokusring und Esc-freie Navigation“ fehl (`#pendelnRoot h1` nicht fokussiert);
  isoliert 3× hintereinander und im Folgelauf 98/98 grün. Ursache ist die
  Timing-Abhängigkeit von `page.goto` mit reinem Fragment-Wechsel; die Datei
  gehört zu RAD-03 und wurde nicht verändert.
- **CI ruft die Radiästhesie-Tests weiterhin nicht auf** (bekannt aus RAD-03).
  Der neue Skripteintrag `test:radiasthesie:simulator` ist in `test:all`
  verdrahtet, aber `test:all` läuft nicht in der CI.
- **Werkstatt-Karten 2 und 3** (Tafel-Studio, Experimentierlabor) bleiben
  „In Vorbereitung“ — RAD-08/RAD-09.
- **Seed/Zufall** existiert nicht und wird nicht gebraucht: die Simulation ist
  deterministisch aus den Reglern.

## Nächster Schritt

RAD-08 (Pendeltafel-Studio) kann demselben Muster folgen: Route
`#pendeln/studio`, Generator-Zustand der Werkstatt-Karte auf „Verfügbar“,
eigenes Modul mit reinen Funktionen + Mount, eigener Unit- und Browser-Spec.
Für RAD-09/10 bleibt `WERKSTATT` die Laufzeit-Fassade; das Pendellabor braucht
sie nicht (Entscheidung D6 in `MODELL.md`).

Commit: `fca1ffe` (Code + Tests + Dokumentation). Kein Push.
