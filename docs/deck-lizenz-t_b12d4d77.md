# Deck-Lizenzangabe t_b12d4d77 — CC BY-SA 4.0 der Deckfassung, Lizenzlink, Impressum-Abschnitt, Radio-Label

Karte: `t_b12d4d77` (design_web_layout) · Grundlage: Release `t_c8943c1e` (Commit `5d327ed`)
Arbeitsbaum: `C:/Users/mas/Arbeit/Esoterik-Welt`, Branch `main`
Kein Commit, kein Push, kein Deploy in dieser Karte. Die Änderungen liegen ausschließlich im Arbeitsbaum
plus den neu erzeugten `Lokal*.html` aus `npm run build` / `npm run build:local`.

## 1. Auftrag und Ausgangsbefunde

| Befund | Repro (vorher) | Beobachtung |
| --- | --- | --- |
| B1 | `index.html`, `.tarot-deck-note` | nennt Quelle (Pamela Colman Smith) und CC BY-SA 4.0 der Textur, aber nicht die ShareAlike-Lizenz der bearbeiteten Deckfassung; kein Lizenzlink |
| B2 | `impressum.html` | kein Tarot-/Deck-Abschnitt (nur Hero-Fotografie, Orion-Grafik, Schriften) |
| B3 | `js/modules/tarot.js`, `renderDeckPicker()` | Badge und Name sind benachbarte Spans ohne Trenner: Accessible Name „NachtatelierStandard 78 Karten · 3:5“ |

Belege vorher: `evidence/t_c8943c1e/live/live-browser.json` (`picker.options[].labelText`),
`docs/release-t_c8943c1e.md` §9.2/§9.3.

## 2. Geplant (Abnahmekriterien vor der Arbeit festgelegt)

1. Fußnote nennt die Lizenz der **bearbeiteten Deckfassung** (CC BY-SA 4.0) und verlinkt den Lizenztext.
2. Impressum hat einen Abschnitt mit Quellen, Urhebern, Lizenz und Änderungshinweis für **beide** Decks.
3. Accessible Name der Radios liest sich wie „Nachtatelier — Standard, 78 Karten, 3:5“, ohne Verkettung.
4. Keine Änderung an Registry-Semantik, Deutungstexten, Bildern; keine Druckfreigabe impliziert.
5. Kein Layout- oder Konsolenfehler bei 375/768/1440 px, Offline-Ausgabe funktionsfähig.

## 3. Ausgeführt

### 3.1 `index.html` — Fußnote im Tarot-Bereich

Ergänzt: „Die bearbeitete Deckfassung steht wegen dieser ShareAlike-Textur ebenfalls unter
**CC BY-SA 4.0** und darf unter denselben Bedingungen weitergegeben werden.“ Der Lizenztext ist verlinkt
(`https://creativecommons.org/licenses/by-sa/4.0/`, `target="_blank" rel="noopener"`), am Ende verweist
„Quellen, Urheber, Lizenzen und Änderungen: Impressum“ auf `impressum.html#tarot-decks`.
Für V2 zusätzlich klargestellt: „keine Fremdlizenzen an den Motiven“.

### 3.2 `impressum.html` — neuer Abschnitt „Tarotdecks“

`<h2 id="tarot-decks">Tarotdecks: „Nachtatelier“ (Standard) und „Gartenbrevier“ (optional)</h2>` mit
Einleitung (gemeinsame IDs/Deutungstexte, nur Web-Derivate, keine Druckfreigabe) und je einem `<h3>`:

- **Nachtatelier:** Umfang, Bildvorlagen (RWS, Pamela Colman Smith 1878–1951, gemeinfrei, Commons-Abruf
  01.11.2026, Prüfsummen-Manifest), Mineraltextur (Didier Descouens, CC BY-SA 4.0), Änderungen
  (Ausschnitt/Titelzeile, Fragmentkante, Tönung, Bühne/Sockel/Stufen, Textur in Graustufen, Nummer/Titel neu
  gesetzt), **Lizenz der bearbeiteten Fassung CC BY-SA 4.0** (Link), eigene Texte/Layout/Skripte CC BY 4.0,
  empfohlene Namensnennung.
- **Gartenbrevier:** eigene codegenerierte Vektoren, keine fremden Bilddateien/Scans/Stockbilder/KI-Dienste,
  Kartenidentitäten und Deutungstexte unverändert aus `js/data/tarot.js`, Rechte: Eigengestaltung — und
  ausdrücklich: eine weitergehende Lizenzierung der V2-Motive ist im Quellenmanifest **nicht erklärt**.

Quellen: `docs/tarot-deck-nachtatelier/QUELLEN-RECHTS-MANIFEST.md` (§1, §2, §3, §5),
`docs/tarot-deck-v2/QUELLEN-RECHTS-MANIFEST.md` (§1–§5).

### 3.3 `js/modules/tarot.js` — Accessible Name der Deck-Radios

`deckAccessibleName(deck)` erzeugt aus der Registry einen Satz mit echten Trennern
(`meta` mit `·` → `, `):

- `Nachtatelier — Standard, 78 Karten, 3:5`
- `Gartenbrevier — Optional, Farbvariante, 78 Karten, 3:5`

Das Radio trägt diesen Namen als `aria-label`; die visuelle Kopie (`.tarot-deck-copy`) ist `aria-hidden`.
Grund für diese Form: ein zusätzlicher `sr-only`-Text neben dem Radio erschien im Accessibility-Tree als
**zweiter Textknoten** (doppelte Ansage derselben Zeichenfolge, im ersten Lauf belegt). Registry, Auswahl-
Logik, Persistenz und Deutungstexte sind unverändert; das sichtbare Markup (Name, Badge, Meta-Zeile) ist
byte-gleich geblieben.

### 3.4 `css/main.css` — zwei Regeln (Link-Unterscheidung, Untertitel-Größe)

`.tarot-deck-note a, .deck-credits a { text-decoration: underline; text-underline-offset: 0.2em }`.
Grund: im Dunkel-Theme liegen Linkfarbe (`rgb(198,179,142)`) und Fließtextfarbe (`rgb(186,189,183)`) bei
**1,08 : 1**; ohne Unterstreichung wären beide neuen Links nur farblich unterscheidbar (WCAG 1.4.1).
Das war die einzige Stiländerung der Runde 1; Farben, Abstände und Typografie blieben unangetastet.
In Runde 2 kam eine zweite Regel hinzu (`.legal-prose h3`, siehe §8).

### 3.5 `tests/tarot-decks-v2.cjs` — Regression

Die bestehende Wächter-Suite prüft jetzt zusätzlich die beiden exakten Accessible Names über
`getByRole('radio', { name, exact: true })` (Playwright-accname, nicht `textContent`).

### 3.6 Build-Ausgaben

`npm run build` und `npm run build:local` neu gelaufen; `Lokal.html`, `Lokal-impressum.html`,
`Lokal-404.html`, `Lokal-datenschutz.html`, `Lokal-haftung.html` sind erzeugt, nicht von Hand editiert.
Die drei juristischen Seiten ändern sich nur, weil `css/main.css` inline eingebettet wird (+7 Zeilen).
`Lokal.html` enthält die Fußnote und den umgeschriebenen Link `Lokal-impressum.html#tarot-decks`.

## 4. Geprüft (ausgeführt, nicht behauptet)

Reproduktion: `bash evidence/t_b12d4d77/run-gates.sh` (je Gate ein Log in `evidence/t_b12d4d77/logs/`,
Ergebnis in `evidence/t_b12d4d77/gates.json`), Messungen in `evidence/t_b12d4d77/probe.cjs` und
`probe-link.cjs`, Rohdaten in `evidence/t_b12d4d77/live/`.

| Prüfung | Ergebnis |
| --- | --- |
| Accessible Names 375/768/1440 px + `file://` | 2/2 exakt, alte verkettete Form 0 Treffer |
| AX-Tree des Wählers | `group "Deck wählen"` → 2 Radios mit Namen, keine doppelten Textknoten |
| Fußnote: Links, Attribute, Rewrite offline | Lizenzlink `…/by-sa/4.0/` (`_blank`, `noopener`), Impressum-Link → `Lokal-impressum.html#tarot-decks` |
| Kontrast Fußnotenlink | 9,33 : 1 zum Hintergrund, 10,07 : 1 Fließtext, 1,08 : 1 Link↔Text → unterstrichen |
| Tastatur | Link fokussierbar, Fokusring 2 px `rgb(198,179,142)` |
| Label-Trefferfläche | Klick auf den sichtbaren Decknamen wechselt das Deck (hin und zurück) |
| Impressum-Abschnitt | `h2#tarot-decks` + 2 `h3`, 10 Listeneinträge, Anker-Sprung sichtbar, 0 Überlauf bei 375/768/1440 |
| Layout Tarot-Bereich | 0 px Dokument- und 0 px Fieldset-Überlauf bei 375/768/1440, 0 Konsolen-/Seitenfehler |
| `npm run lint` / `format:check` | exit 0 / alle Dateien formatiert |
| Weitere Gates | Jest 2/2, pages 6/6, astrologie 21/21, tarot_decks 12/12, moon 14/14, offline 2/2, verify:build 33/33 |
| Playwright e2e | 74/74 |

Screenshots: `evidence/t_b12d4d77/live/shots/` (`picker-*`, `deck-note-*`, `impressum-tarot-*`, `note-focus-1280`).

## 5. Unabhängig bestätigt vs. selbst geprüft

- **Selbst geprüft:** alle Zahlen in Abschnitt 4 (eigene Skripte, eigener Chromium-Lauf).
- **Nicht unabhängig bestätigt:** Screenreader-Lauf (kein NVDA/JAWS/VoiceOver in dieser Karte), zweite
  Person/Review steht aus (`request_review` mit reviewer `design_critique`).

## 6. Beobachtungen ohne Blockwirkung

1. **Flake in `tests/tarot-deck.cjs:449`** (`focus moves into the dialog`): im Sammellauf einmal rot,
   zwei direkte Wiederholungsläufe 11/11. Der Test liest `document.activeElement` einmal direkt nach
   `#cardModal.open` statt zu warten — vorbestehender Timing-Race, nicht durch diese Karte verursacht
   (Logs: `logs/tarot.log`, `logs/tarot-rerun-1.log`, `logs/tarot-rerun-2.log`).
2. **Erster e2e-Lauf rot (2 Tests):** die Site-Regel „externe Links auf der Startseite öffnen in neuem Tab“
   gilt auch für den neuen Lizenzlink; ergänzt um `target="_blank"`, danach 74/74.
3. **V2-Lizenz:** das Quellenmanifest erklärt für die V2-Motive keine Ergebnislizenz. Das Impressum sagt das
   ausdrücklich, statt eine CC-BY-4.0-Angabe zu unterstellen. Wenn V2 wie die übrigen Eigenarbeiten unter
   CC BY 4.0 gestellt werden soll, ist das eine Produktentscheidung (eine Zeile im Impressum + Manifest).
4. **Vorbestehend, nicht angefasst:** außerhalb von Fußnote und Deck-Credits bleiben Inline-Links der Seite
   farbbasiert (gleiches 1,08 : 1). Eine site-weite Unterstreichung wäre ein eigener Designschritt.
5. `320 px` bleibt wie im Release außerhalb der Abnahmebreiten; nicht erneut geprüft.

## 7. Offene Punkte für Review und Release

1. Review-Entscheidung, ob der Accessible Name per `aria-label` (visuelle Kopie `aria-hidden`) so bleiben
   soll — Alternative wäre ein reiner Leerzeichen-Trenner ohne `aria-label`, dann läse der Name
   „Nachtatelier Standard 78 Karten · 3:5“.
2. Die eine CSS-Regel (Unterstreichung) ist bewusst außerhalb von „nur Text“ — sie ist für 1.4.1 nötig und
   mit einem Einzeiler rücknehmbar.
3. Commit/Push/Deploy und Live-Abnahme gehören in eine separate Releasekarte.
4. Keine Druckfreigabe: die Decks sind Web-Derivate (sRGB-JPEG), unverändert.

## 8. Runde 2 — Review-Befund B1 behoben (Überschriftenhierarchie im Impressum)

**Befund (design_critique, Runde 1):** Im Abschnitt `#tarot-decks` renderten die neuen `<h3>` mit der globalen
Regel `h3 { font-size: var(--text-2xl) }` = **28 px/32,2 px**, der Abschnitts-`<h2>` aber mit
`var(--text-xl)` = **20 px/22,4 px**. Die Unterüberschrift war damit größer als ihr Abschnittstitel; zusätzlich
fehlte den Decktiteln die Obenluft, die Abschnitte sonst bekommen (16 px statt 32 px zum vorigen Block).

**Änderung (eine CSS-Regel, `css/main.css` direkt nach `.legal-prose h2`):**

```css
.legal-prose h3 {
  font-size: var(--text-lg);         /* 18 px, eine Stufe unter dem h2 (20 px) */
  line-height: 1.3;
  letter-spacing: 0;
  margin-block: var(--space-6) var(--space-2);  /* 24 px oben, 8 px unten */
}
```

Begründung der Werte: `--text-lg` (18 px) ist die nächste Stufe unter dem h2 und hält Abstand zur Fließtextgröße
(16 px, Fraunces statt Manrope trägt die Unterscheidung); `--text-xl` (20 px) hätte h2 und h3 gleichgestellt.
`margin-block: var(--space-6) var(--space-2)` folgt der Hausreferenz `.article-prose h3` (main.css:2183–2190).
`letter-spacing: 0` wie bei `.legal-prose h2`, weil negatives Tracking bei 18 px nur Unruhe erzeugt.
Kein `!important`, keine Änderung an `h1`/`h2`, keine Änderung an `design-system.css` — andere Rechtsseiten
(`datenschutz.html`, `haftung.html`) enthalten kein `<h3>` in `.legal-prose` und bleiben dadurch unberührt
(per Dateiprüfung bestätigt).

**Gemessen (`evidence/t_b12d4d77/probe-headings.cjs`, `review/round2-headings.json`):**

| Kontext | h1 | h2 `#tarot-decks` | h3 Deck | h2 der Nachbarabschnitte | Überlauf |
| --- | --- | --- | --- | --- | --- |
| 375 px | 34 px | 20 px | 18 px / 23,4 px | 20 px (unverändert) | 0 |
| 768 px | 56 px | 20 px | 18 px / 23,4 px | 20 px | 0 |
| 1440 px | 56 px | 20 px | 18 px / 23,4 px | 20 px | 0 |
| `file://` Lokal-impressum.html, 1280 px | 56 px | 20 px | 18 px / 23,4 px | 20 px | 0 |

- Abstand über den Decktiteln: **24 px** (vorher 16 px), darunter 16 px zur Liste (8 px `margin-block-end` +
  8 px Listenabstand). Der zweite Decktitel ist damit klar vom Ende der V1-Liste getrennt.
- Kontrast der h3 gegen den Kartenhintergrund: **13,86 : 1** (Farbe unverändert `rgb(234,230,220)`).
- Anker aus der Fußnote: Ziel-Oberkante 116 px (375 px: 100 px), Sticky-Header endet bei 101 px (85 px) →
  **15 px Luft**, online und offline identisch (`review/round2-anchor.json`).
- Beide Decktitel gleich groß, beide kleiner als der Abschnittstitel, h2-Größe identisch mit den h2 der
  Abschnitte Fotografie/Grafik/Schriften (`h2UnchangedVsOtherH2: true`).

**Unverändert gelassen:** Radio-Markup, Accessible Names, Fußnotentext, Impressum-Inhalte, Registry,
Deutungstexte, Bilder. Der Re-Run von `probe.cjs` bestätigt die in Runde 1 abgenommenen Punkte erneut:
exakte Namen 2/2 bei 375/768/1440 und offline, alte verkettete Form 0 Treffer, 0 px Überlauf, 0 Konsolenfehler.

**Gates nach der Änderung (erneut gelaufen, nicht übernommen):** lint 0, format:check 0, Jest 2/2, pages 6/6,
astrologie 21/21, tarot:decks 12/12, moon 14/14, offline 2/2, verify:build 33/33, e2e 74/74 — je Gate ein Log in
`evidence/t_b12d4d77/logs2/`, aus den Logs automatisch gesammelt in `evidence/t_b12d4d77/gates2.json`
(`python evidence/t_b12d4d77/gates2.py`).
`npm run build` + `npm run build:local` erzeugen alle fünf `Lokal*.html` und `dist/Esoterik-Welt/css/main.css`
byte-identisch zum vorherigen Lauf (sha256-Vergleich), `dist/` enthält die neue Regel.

**Bewusst nicht angefasst (vom Review als nicht blockierend eingestuft):**

1. `<code>`-Pfade rendern in Browser-Monospace statt Manrope — reine Typografie-Optik, kein Fehler.
2. Der Satz „Eigene Texte, Layoutgeometrie und Skripte: CC BY 4.0“ ist wörtlich aus dem Deck-Manifest übernommen
   und steht unter dem Deckabschnitt; er könnte als Aussage über die Website-Skripte (MIT laut `package.json`)
   gelesen werden. Eine Eingrenzung auf die Deck-Erzeugung wäre eine Textänderung am bereits abgenommenen
   Impressumstext und bleibt deshalb offen — Empfehlung für eine eigene Karte, falls gewünscht.
3. Screenreader-Lauf (NVDA/JAWS/VoiceOver) weiterhin nicht möglich in dieser Karte; Belege sind
   Playwright-Accessibility-Tree + accname-Engine (Chromium).

