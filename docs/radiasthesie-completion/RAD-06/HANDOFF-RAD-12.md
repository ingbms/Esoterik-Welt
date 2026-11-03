# Handoff RAD-06 → RAD-12: indexierbare HTML-Ausgabe

Stand 3. November 2026. Diese Datei beantwortet die eine Frage, die RAD-06 nicht
selbst entscheiden darf: **Was fehlt, damit die Themenseiten ohne JavaScript als
echte HTML-Dokumente indexierbar sind — und was liefert RAD-06 dafür bereits?**

## 1. Gemessener Ist-Zustand (nicht behauptet, geprüft)

| Artefakt | Kerntext ohne JS? | Messung |
|---|---|---|
| `dist/Esoterik-Welt/index.html` (statischer Build) | **nein** | „Agricola“, „Untersuchungen“, „Biotensor“, „Carpenter“ → je 0 Treffer; 38.274 Bytes SPA-Hülle |
| `Lokal.html` (Offline-Einzeldatei) | ja, aber nicht pro Route | dieselben Begriffe → je 1 Treffer; 1.161.534 Bytes; alle Seiten liegen versteckt im selben Dokument |

Damit ist die RAD-12-Anforderung „erzeugtes HTML enthält Kerntexte ohne JS“
offen. RAD-06 hat sie nicht erfüllt und behauptet sie nicht.

## 2. Was RAD-12 bereits nutzen kann

- **Reine Funktionen.** `js/modules/radiasthesie-views.js` exportiert
  `renderLanding(model)`, `renderTopic(model, topic, {anchor})`,
  `renderGlossar`, `renderQuellen`, `renderMethodik`, `renderSuche`,
  `renderNotFound` — jede liefert `{ html, title, description, h1 }`. Kein DOM,
  kein Zustand, kein `fetch`. In Node ohne Browser aufrufbar (so macht es
  `tests/radiasthesie.mjs` und `scripts/verify_rad06.cjs`).
- **Datenmodell als JSON-Modul.** `js/data/radiasthesie.js` ist ein
  ES-Modul mit einem Objekt: `topics` (31 Kapitel mit Blöcken, Stufen, Fotos),
  `sources` (66), `glossary` (17), `media` (6 Fotos + 4 Zeichnungen),
  `levels`, `legal`, `introduction.openQuestions`. Keine Laufzeitabhängigkeit.
- **BreadcrumbList** existiert als `breadcrumbStructuredData(trail)` und ist
  bereits getestet („BreadcrumbList ist gültiges JSON-LD“).
- **Titel/Beschreibung je Route** liegen als `seoTitle`/`description` je Thema
  vor (≤160 Zeichen, vom Generator erzwungen).
- **Interne Links** sind relativ-hashbasiert (`#pendeln/…`). Für statische
  Dokumente müssen sie auf echte Pfade umgeschrieben werden; die Routenlogik
  dafür steht in `js/modules/radiasthesie-model.js` (`resolve(segments)`).

## 3. Was RAD-12 entscheiden und bauen muss

1. **Dokument pro Route** (mindestens `#pendeln`, `/radiasthesie`, `/pendeln`,
   `/orakel`, `/glossar`, `/quellen`, `/methodik`). Empfohlen: Präfix
   `/pendeln/radiasthesie.html` o. ä.; die Hash-Routen bleiben als
   Sprungmarken-Inside-Links erhalten oder werden auf Anker umgeschrieben.
2. **Canonical je Dokument** auf die kanonische Dokument-URL — **nicht** auf
   die Hash-Variante; sonst entstehen Duplikate (heute ist die Modul-URL
   Canonical für alle Ansichten).
3. **Sitemap ohne Fragmente** (`#`-URLs sind keine eigenen Dokumente).
4. **Structured Data**: `BreadcrumbList` je Dokument ist zulässig und
   vorhanden. `Article` nur, wenn ein Veröffentlichungs- und Änderungsdatum
   sichtbar ist — `generatedAt` (2026-11-03) und `updated` liegen im Datensatz.
   **Kein FAQPage**: Es gibt keine ausgezeichnete FAQ-Seite.
5. **Bild-Einbindung**: `media.items[].web` enthält `src`, `srcset`,
   `srcsetAvif`, `width`, `height`; die Dateien liegen unter
   `assets/radiasthesie/media/{520,1040}/`. Absolute Pfade im statischen
   Dokument müssen auf die Deployment-Wurzel zeigen (`/Esoterik-Welt/…`).
6. **Prerender-Haken**: `scripts/build-pages.cjs` erzeugt heute eine
   SPA-Hülle. Der minimale Eingriff ist ein zusätzlicher Schritt, der je Route
   `renderX(model).html` in ein Dokument mit `<title>`, `<meta name="description">`,
   Canonical, JSON-LD und `<noscript>`-freiem Inhalt schreibt. Die Ansichten
   sind dafür bereits ohne DOM lauffähig; es fehlt nur der Dateischritt und die
   Link-Umschreibung.
7. **Numerische Titelgrenze sachlich prüfen** (nicht Test abschwächen): Die
   drei SEO-Titel messen 52, 53 und 59 Zeichen, der Modultitel 58 — alle unter
   60. Der lange Landingpage-Titel aus dem Markdown-H1 (67 Zeichen) wird nicht
   als `<title>` verwendet; `module.seoTitle` ist die Kurzform. Eine harte
   60-Zeichen-Prüfung ist damit erfüllbar, ohne Inhalte zu verstümmeln.

## 4. Was RAD-06 ausdrücklich **nicht** getan hat

- keine Änderung an `build-pages.cjs`, `build-local.cjs`, `verify-pages.cjs`
- keine Canonicals, keine Sitemap, keine strukturierten Daten außer dem
  bestehenden BreadcrumbList-Helfer
- keine Aussage über Rankings oder KI-Zitierbarkeit

## 5. Abhängigkeit, die vor RAD-12 geklärt sein muss

`assets/radiasthesie/media/` (RAD-05) und `docs/radiasthesie-completion/RAD-02/`
sind im Arbeitsbaum **untracked**. Ein statischer Build, der die Fotos
referenziert, läuft ins Leere, solange diese Dateien nicht im Commit sind. Das
ist Aufgabe der Integration (RAD-11), nicht von RAD-12.
