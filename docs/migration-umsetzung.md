# Umsetzung der Astro-Migration (Inhalte, Routen, Redirects, SEO)

Stand: 4. November 2026 · Aufgabe `t_a3fc82b3`
Basis: `9f58439` (veröffentlichter Stand) + Gerüst `5d9c554` + Migrationsplan `682f560`
Nachweis: `npm run build` und `npm run verify:migration` → `docs/verifikation-migration.md`

Dieses Dokument beschreibt, **was tatsächlich gebaut wurde**, welche Entscheidungen
davon abweichen und was bewusst offen bleibt. Der Plan (`docs/migration-plan.md`) bleibt
die Referenz für Inventar, Risiken und die offenen Eigentümerentscheidungen F1–F8.

## 1. Ergebnis in Zahlen

| Gegenstand | Bestand | Build |
|---|---|---|
| Adressierbare HTML-Dokumente | 12 | 145 Dateien (inkl. 1 Kopie eines Nachweises unter `assets/`) |
| Seiten (Astro-Routen) | — | 144 |
| Hash-Ansichten (Stand A) | 140 | 274 Altadressen in der Redirect-Map aufgelöst |
| Sitemap-Einträge | 11 | 142 |
| Artikel | 10 | 10 (Content Collection, Markdown) |
| Farbwelten | 18 Markdown | 18 Collection-Einträge + 3 Werkzeugseiten |
| Astrologie-Unterseiten | 85 Ansichten | 86 Dokumente |

## 2. Aufbau

```
src/
  content.config.ts        Zod-Schemas: articles, farbwelten, dokumente
  content/articles/        10 Markdown-Artikel (erzeugt aus js/data/articles.js)
  content/farbwelten/      18 Markdown-Dokumente (aus content/farbwelten/)
  content/dokumente/       frequenz-quellen.md (aus docs/, Links umgeschrieben)
  content/legal/           impressum/datenschutz/haftung als HTML-Fragment (1:1)
  data/legacy.ts           typisierte Grenze zu js/data/*.js und data/*.json
  data/types.ts            Interfaces für die dort gelesenen Formen
  layouts/BaseLayout.astro Kopf, Navigation, Fuß, JSON-LD, Legacy-Shim
  components/              Header, Footer, Breadcrumbs, Blocks, Prose, EntryIndex,
                           AreaNav, SourceList, EvidenceLegend, JsonLd
  lib/site.ts              Marke, Titelregel, absolute Adressen (eine Quelle)
  lib/routes.ts-frei       Adressen entstehen in den Seiten aus den Daten
  lib/legacy-routes.ts     Shim-Logik + generierte Map
  lib/jsonld.ts            WebPage/BreadcrumbList/DefinedTermSet/Article
  pages/                   alle Routen (Dokumente, Bereiche, Detailseiten)
  styles/)                 global.css, content.css + CSS des Bestands
scripts/
  migrate-content.cjs      Artikel, Farbwelten, Rechtstexte, Frequenz-Dokument
  generate-legacy-map.cjs  Altlink-Map + docs/redirects.md
  sync-public-assets.cjs   assets/ → public/assets (gitignoriert)
  verify-migration.cjs     Routen, Mengen, SEO-Parität, Links, Sitemap, Köpfe
astro-plugins/
  sitemap-file-paths.mjs   Sitemap-Adressen auf Dateipfade korrigieren
```

## 3. Entscheidungen (mit Begründung)

1. **`build.format: 'preserve'` statt `'file'`** (Abweichung vom Gerüst).
   Mit `'file'` wurde `src/pages/radiasthesie/index.astro` zu `/radiasthesie.html`;
   die kanonische Adresse des Bestands ist aber `/radiasthesie/`. `'preserve'`
   erhält beide Formen: Verzeichnisrouten bleiben Verzeichnisse, Detailseiten
   bleiben `.html`-Dateien. Ohne diese Änderung hätte der Bereichs-Hub seine
   indexierte Adresse verloren.
2. **Datenmodule bleiben die Quelle, Content Collections sind die Redaktionsquelle.**
   Artikel und Farbwelten wurden einmalig nach Markdown überführt (Plan P3:
   „Markdown ist die einzige Redaktionsquelle“). Astrologie, Radiästhesie,
   Tarot, Runen, Mond und Kristalle werden build-seitig aus `js/data/` gelesen —
   sie abzutippen wäre die von R4 beschriebene Drift-Quelle. Die Generator-
   Umstellung bleibt eigene Aufgabe.
3. **Keine handgeschriebene Routenliste.** Detailseiten entstehen über
   `getStaticPaths()` aus den Daten; die Redirect-Map wird aus denselben Daten
   generiert. Dadurch kann keine Ansicht „vergessen“ werden, und die Prüfung
   vergleicht Build gegen Daten, nicht gegen eine dritte Liste.
4. **Rechtstexte als HTML-Fragment, nicht als Markdown.** 30 KB Bild- und
   Schriftennachweise mit Lizenz-Links verlieren bei einer Markdown-Konvertierung
   Struktur. Der Inhalt von `<main>` wird unverändert übernommen und nur der
   Wurzel-Link (`href="./"` → `href="/"`) umgeschrieben (Plan P2: „byte-gleiche
   Textsubstanz“).
5. **Markdown-Verweise werden bei der Übernahme umgeschrieben**, nicht per
   rehype-Plugin zur Build-Zeit: Astro 7 rendert Markdown mit einem eigenen
   Prozessor; `markdown.rehypePlugins` verlangt die Zusatzinstallation von
   `@astrojs/markdown-remark`. Das Umschreiben in `migrate-content.cjs` hält die
   Abhängigkeitsliste unverändert und macht die Collection self-contained.
6. **Assets werden kopiert, nicht eingecheckt.** `public/assets/` ist
   gitignoriert und wird von `scripts/sync-public-assets.cjs` vor `dev`/`build`
   aus `assets/` erzeugt (638 Dateien, 68 MB). Originale unter
   `assets/radiasthesie/media/original/` bleiben außen vor (nur Quelle für
   Ableitungen).
7. **Sitemap bleibt die offizielle Integration**, wird aber nach dem Build auf
   Dateipfade korrigiert (`astro-plugins/sitemap-file-paths.mjs`): Die Integration
   schreibt Routenpfade (`/impressum`), ausgeliefert wird `/impressum.html`.
   Der Hook bricht ab, wenn eine `<loc>` keine Datei hat.
8. **Titel der Radiästhesie-Dokumente ohne Markensuffix** (`exactTitle`). Die
   Baseline führt sie ohne Marke; die Paritätsprüfung vergleicht Zeichen für
   Zeichen.

## 4. SEO-Parität

Verglichen werden die zwölf Dokumente des Bestands mit ihren Build-Gegenstücken:
Titel, Description und Canonical. Normalisiert werden **nur** zwei Dinge:

- die Marke (`Esoterik-Welt` → `VELARKANA`, Entscheidung E5/§11.5),
- der Origin (`https://ingbms.github.io/Esoterik-Welt/` → `https://velarkana.de/`,
  Entscheidung E4/F1; per `ASTRO_SITE` umstellbar).

Ergebnis: 36 von 36 Feldern gleich (siehe `docs/verifikation-migration.md`).
Zusätzlich hat **jede** Seite Titel, Description und Canonical; nur `404.html`
trägt bewusst keinen Canonical und `noindex, follow`.

Neu gegenüber dem Bestand: JSON-LD auf allen Seiten (`WebPage`/`CollectionPage`,
`BreadcrumbList`, `Article` für Artikel, `DefinedTermSet` für beide Glossare,
`FAQPage` für die Astrologie-FAQ). Der Bestand hatte JSON-LD nur in sieben
Dokumenten — und dort mit beschädigtem `@context` (`"https://***@graph"`).

## 5. Redirects

Siehe `docs/redirects.md` (generiert). Kurzfassung:

- Die zwölf Dokumentadressen bleiben unverändert — keine 301 nötig.
- 274 Hash-Adressen werden über einen Client-Shim im Layout aufgelöst
  (`src/lib/legacy-routes.ts`), inklusive Aliase `#frequenzlabor`, `#chakren`,
  `#lichtfrequenzen` und der 32 Kapitelanker.
- Server-Redirects für Fragmente sind technisch unmöglich (R1) — dokumentiert.

## 6. Formulare und Endpunkte

Der Bestand hat **kein Formular-Backend** (kein `action`, kein `fetch` auf eigene
Endpunkte). Übernommen wurden die clientseitigen Funktionen:

| Formular | Neue Umsetzung |
|---|---|
| Astrologie-Suche (`?q=`) | `/astrologie/suche.html`: Verzeichnis + Filter im Browser, Query wird per `replaceState` geführt |
| Pendeln-Suche (`?q=`) | `/pendeln/suche.html`: dito über Kapitel, Glossar, Quellen, Werkstatt |
| Artikelsuche, Kristallfilter, Tafel-Editor, Tagebuch, iCal-Export | noch nicht portiert (Client-Inseln) — siehe `docs/migration-offene-punkte.md` |

Es werden weiterhin **keine** Daten an einen Server gesendet; es gibt keine
Tracker und keine externen Embeds (im Bestand geprüft, unverändert).

## 7. Was diese Aufgabe nicht abdeckt

- Interaktive Inseln (Tarot-Ziehung, Kristallfilter, Mondrechner, Runenwurf,
  Frequenzlabor, Pendelsimulator, Tafel-Studio, Experiment, Tagebuch, iCal).
  Die Inhalte und Datengrundlagen dieser Bereiche sind vollständig als Dokument
  vorhanden; die Bedienlogik fehlt.
- Domain-/DNS-Umschaltung (F1), `localStorage`-Übernahme (F2/R2), Analytics (F7),
  Offline-Einzeldatei (F5/R10), `og:image` (F6).
- Redaktionsentscheidungen zu überlappenden Artikeln (F4/R15) — die 10 Artikel
  des Stands A sind unverändert übernommen.
