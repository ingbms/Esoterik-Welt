/**
 * Unabhängige Prüfung der reinen Logik (src/lib/toc.ts) gegen die
 * Spezifikation: Slug-Vektoren §14.3, Duplikate (AK-C4), leere Texte (AK-C7),
 * Ebenen (AK-B3/B4), Verschachtelung, Escaping, Leerzustand (AK-A4).
 *
 * Ausgabe: evidence/qa-toc-436eeffb/unit.json
 */
import * as toc from './fixture/lib/toc.ts';
import { writeJson } from './lib.mjs';

const { buildTocTree, flattenToc, normalizeTocText, renderTocList, slugifyHeading, TOC_ENABLED } = toc;

const results = [];
const check = (id, name, ok, detail) => results.push({ id, name, ok: ok === true, detail });

/* §14.3 Slug-Testvektoren (aus der Spezifikation gelesen) ------------------ */
const vectors = [
  ['Frequenzen: Quellen, Evidenzstatus und Methodik', 'frequenzen-quellen-evidenzstatus-und-methodik'],
  ['1. Zweck und Geltungsbereich', '1-zweck-und-geltungsbereich'],
  ['5.1 Physikalisch / physiologisch', '51-physikalisch--physiologisch'],
  ['6.8 40 Hz: Mausmodell ≠ Therapie', '68-40-hz-mausmodell--therapie'],
  ['6.11 Klangschalen, Mantras, Chakren', '611-klangschalen-mantras-chakren'],
  ['6.12 Solfeggio-Erweiterungen 174/285/963 Hz', '612-solfeggio-erweiterungen-174285963-hz'],
  ['6. Einzelprüfungen', '6-einzelprüfungen'],
  ['7. Bewusst nicht aufgenommene Einträge', '7-bewusst-nicht-aufgenommene-einträge'],
];
const vectorResults = vectors.map(([text, expected]) => ({ text, expected, actual: slugifyHeading(text), ok: slugifyHeading(text) === expected }));
check('AK-C3', 'Slug-Testvektoren aus §14.3', vectorResults.every((v) => v.ok), vectorResults);

/* Normalisierung ---------------------------------------------------------- */
const norm = [
  ['  Zwei   Wörter  ', 'Zwei Wörter'],
  ['<em>Ein</em> Titel', 'Ein Titel'],
  ['A &amp; B', 'A & B'],
  ['Zeile\u00a0mit&nbsp;NBSP', 'Zeile mit NBSP'],
];
const normResults = norm.map(([input, expected]) => ({ input, expected, actual: normalizeTocText(input), ok: normalizeTocText(input) === expected }));
check('AK-B7/NORM', 'Textnormalisierung (Markup, Entitäten, Whitespace)', normResults.every((n) => n.ok), normResults);

/* Duplikate (AK-C4) ------------------------------------------------------- */
const dup2 = buildTocTree([
  { depth: 2, text: 'Wiederholung' },
  { depth: 2, text: 'Wiederholung' },
  { depth: 2, text: 'Drittes' },
]);
const dup2Ids = flattenToc(dup2.items).map((i) => i.slug);
const dup3 = buildTocTree([
  { depth: 2, text: 'Gleich' },
  { depth: 2, text: 'Gleich' },
  { depth: 2, text: 'Gleich' },
]);
const dup3Ids = flattenToc(dup3.items).map((i) => i.slug);
check('AK-C4', 'zwei gleiche Überschriften → … und …-1; drei → zusätzlich …-2', dup2Ids.join(',') === 'wiederholung,wiederholung-1,drittes' && dup3Ids.join(',') === 'gleich,gleich-1,gleich-2', { dup2Ids, dup3Ids });

/* Kollision mit vorhandener ID ------------------------------------------- */
const collision = buildTocTree(
  [
    { depth: 2, text: 'Vorhanden', slug: 'vorhanden' },
    { depth: 2, text: 'Vorhanden' },
  ],
  { minHeadings: 2 }
);
const collisionIds = flattenToc(collision.items).map((i) => i.slug);
check('K-1', 'vorbelegte ID wird nicht doppelt vergeben', collisionIds.join(',') === 'vorhanden,vorhanden-1', { collisionIds });

/* Leerer/satzzeichenfreier Text (AK-C7) ---------------------------------- */
const emptySlug = buildTocTree([
  { depth: 2, text: '!!!' },
  { depth: 2, text: '???' },
  { depth: 2, text: 'Echter Titel' },
]);
const emptyIds = flattenToc(emptySlug.items).map((i) => i.slug);
check('AK-C7', 'Überschrift aus Satzzeichen erhält abschnitt-<n>', emptyIds[0] === 'abschnitt-1' && emptyIds[1] === 'abschnitt-2', { emptyIds });

/* Ebenen (AK-B3/B4) ------------------------------------------------------ */
const pilotHeadings = [];
for (let i = 0; i < 14; i += 1) pilotHeadings.push({ depth: 2, text: `H2 ${i + 1}` });
const withH3 = [...pilotHeadings.slice(0, 5), ...Array.from({ length: 15 }, (_, i) => ({ depth: 3, text: `H3 ${i + 1}` })), ...pilotHeadings.slice(5)];
const levels2 = buildTocTree(withH3, { levels: [2] });
const levels23 = buildTocTree(withH3, { levels: [2, 3] });
const levels234 = buildTocTree(withH3, { levels: [2, 3, 4] });
check('AK-B3', 'levels={[2]} → nur h2', levels2.count === 14 && flattenToc(levels2.items).every((i) => i.depth === 2), { count: levels2.count });
check('AK-B4', 'levels={[2,3,4]} ohne h4 → unverändert', levels234.count === levels23.count, { count234: levels234.count, count23: levels23.count });

/* Übersprungene Ebene → eine Einrückungsstufe --------------------------- */
const skipped = buildTocTree([{ depth: 2, text: 'A' }, { depth: 4, text: 'B' }], { levels: [2, 4], minHeadings: 2 });
const skippedFlat = flattenToc(skipped.items);
check('AK-B6b', 'übersprungene Ebene erzeugt genau eine Einrückungsstufe', skippedFlat[1].level === 3 && skippedFlat[1].depth === 4, skippedFlat.map((i) => ({ depth: i.depth, level: i.level })));

/* h3 ohne vorangehendes h2 ------------------------------------------------ */
const orphan = buildTocTree([{ depth: 3, text: 'A' }, { depth: 3, text: 'B' }, { depth: 3, text: 'C' }]);
check('K-2', 'führende h3 werden oberste Ebene, kein Einrückungssprung', flattenToc(orphan.items).every((i) => i.level === 2), flattenToc(orphan.items).map((i) => i.level));

/* Leerzustand (AK-A4) ---------------------------------------------------- */
const none = buildTocTree([]);
const two = buildTocTree([{ depth: 2, text: 'A' }, { depth: 2, text: 'B' }]);
const twoMin0 = buildTocTree([{ depth: 2, text: 'A' }, { depth: 2, text: 'B' }], { minHeadings: 0 });
const emptyMin0 = buildTocTree([], { minHeadings: 0 });
const undef = buildTocTree(undefined);
check('AK-A4', 'ohne headings / unter minHeadings kein Baum (kein leeres Markup)', none === null && two === null && undef === null && emptyMin0 === null && twoMin0 !== null, { none, two: two === null, undef: undef === null, emptyMin0: emptyMin0 === null, twoMin0: twoMin0 !== null });

/* Escaping (§6.4) -------------------------------------------------------- */
const nasty = buildTocTree([
  { depth: 2, text: 'A <script>alert(1)</script> & "Zitat"' },
  { depth: 2, text: 'B' },
  { depth: 2, text: 'C' },
]);
const html = renderTocList(nasty.items);
check('K-3', 'Markup escaping (& und " im Text, kein rohes Tag im Markup)', !html.includes('<script>') && html.includes('&amp;') && html.includes('&quot;') && !/"[^>]*"/.test('') && html.includes('alert(1)'), { html: html.slice(0, 220) });

/* TOC_ENABLED ------------------------------------------------------------ */
const expectedEnabled = process.env.TOC_DISABLED !== '1';
check('K-4', `TOC_ENABLED folgt dem Schalter (TOC_DISABLED=${process.env.TOC_DISABLED ?? '0'})`, TOC_ENABLED === expectedEnabled, { TOC_ENABLED, expectedEnabled, env: process.env.TOC_DISABLED ?? null });

const failed = results.filter((r) => !r.ok);
writeJson(process.env.TOC_DISABLED === '1' ? 'unit-disabled.json' : 'unit.json', { generatedAt: new Date().toISOString(), results, failed: failed.length });
console.log(`unit checks: ${results.length}, failed: ${failed.length}`);
for (const f of failed) console.log('FAIL', f.id, JSON.stringify(f.detail).slice(0, 400));
