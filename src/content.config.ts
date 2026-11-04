/**
 * Content Collections mit typisiertem Zod-Schema.
 *
 * Warum Content Collections: Der Bestand hielt Artikel als JS-Objekte in
 * `js/data/articles.js` (10 Artikel) und Farbseiten als Markdown in
 * `content/farbwelten/*.md` (18 Dokumente, von Jekyll zu `.html` gerendert).
 * Beide Formen werden hier zu Markdown-Collections mit validiertem Frontmatter:
 * Markdown ist damit die einzige Redaktionsquelle (Migrationsplan P3, R4), und
 * ein fehlendes Pflichtfeld bricht den Build ab, statt still eine leere Seite
 * zu erzeugen.
 *
 * Die Umwandlung der Artikel aus `js/data/articles.js` ist einmalig geschehen
 * (`scripts/migrate-content.cjs`); die erzeugten Dateien liegen unter
 * `src/content/articles/` und sind ab dann die Quelle.
 *
 * Import von `z` aus `astro:schema` statt `astro:content`: In Astro 7 ist das
 * `z`, das `astro:content` re-exportiert, als veraltet markiert (20 Hinweise im
 * `astro check`). `astro:schema` ist der dokumentierte Nachfolgepfad; er zeigt
 * intern auf `astro/zod` und wird laut Astro-Quellkommentar in Astro 8 entfernt.
 * Bleibt als offener Punkt notiert (docs/migration-offene-punkte.md).
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

/** Artikel: ehemals `js/data/articles.js`, jetzt Markdown mit Frontmatter. */
const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    /** Ursprüngliche Artikel-ID aus dem Bestand — Anker für die Altlink-Zuordnung. */
    legacyId: z.number().int().positive(),
    title: z.string().min(10),
    category: z.enum(['tarot', 'crystals', 'runes', 'moon', 'history', 'rituals']),
    /** Veröffentlichungsdatum des Bestands, unverändert übernommen. */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss YYYY-MM-DD sein'),
    readTime: z.string().min(2),
    excerpt: z.string().min(40),
    tags: z.array(z.string().min(1)).min(1),
  }),
});

/**
 * Farbwelten: 18 Markdown-Dokumente aus `content/farbwelten/`.
 * `seite` unterscheidet Farbseite, Themenseite, Einstieg, Übersicht und
 * Einordnung — die Navigation und die Titelbildung hängen daran.
 */
const farbwelten = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/farbwelten' }),
  schema: z.object({
    title: z.string().min(10),
    description: z.string().min(20).max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug nur a–z, 0–9 und Bindestrich'),
    seite: z.enum(['farbe', 'thema', 'einstieg', 'uebersicht', 'einordnung']),
    farbe: z.string().optional(),
    chakra_modern: z.string().optional(),
    darkmode: z.boolean().optional(),
  }),
});

/**
 * Einzeldokumente, die im Bestand als Markdown ausgeliefert wurden und im
 * Build gerendert werden (statt per `fetch` im Browser):
 * `docs/frequenz-quellen.md` (heute `#frequenzen/quellen`, lädt per fetch).
 * Die Datei wird von `scripts/migrate-content.cjs` in die Collection kopiert
 * (dort werden relative Verweise auf die neuen Adressen umgeschrieben); die
 * Quelle bleibt `docs/frequenz-quellen.md`.
 */
const dokumente = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/dokumente' }),
  schema: z.object({}).passthrough(),
});

export const collections = { articles, farbwelten, dokumente };
