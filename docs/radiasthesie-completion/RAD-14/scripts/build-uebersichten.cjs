#!/usr/bin/env node
/**
 * RAD-14 — erzeugt die beiden Übersichten, die ausschließlich aus Daten stammen:
 *   docs/radiasthesie-completion/RAD-14/QUELLENBIBLIOTHEK.md
 *   docs/radiasthesie-completion/RAD-14/MEDIEN-LIZENZEN.md
 *
 * Quellen: js/data/radiasthesie.js (generiert aus den Redaktionsquellen) und
 * assets/radiasthesie/media/media-manifest.json.
 * Aufruf: node docs/radiasthesie-completion/RAD-14/scripts/build-uebersichten.cjs
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../../../..');
const outDir = path.join(root, 'docs/radiasthesie-completion/RAD-14');
const manifestFile = path.join(root, 'assets/radiasthesie/media/media-manifest.json');

const cell = (value) => String(value == null || value === '' ? '—' : value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const kb = (bytes) => {
  const n = (v) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(v);
  if (bytes >= 1024 * 1024) return `${n(bytes / (1024 * 1024))} MB`;
  return `${n(bytes / 1024)} kB`;
};

async function main() {
  const { RADIASTHESIE: d } = await import(pathToFileURL(path.join(root, 'js/data/radiasthesie.js')).href);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

  const sources = d.sources;
  const byVerification = {};
  for (const s of sources) byVerification[s.verification] = (byVerification[s.verification] || 0) + 1;
  const levels = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const s of sources) for (const l of s.levels || []) if (l in levels) levels[l] += 1;

  const quellen = [
    '# Quellenbibliothek — Radiästhesie, Pendeln und Orakel',
    '',
    `Stand: ${d.updated} · erzeugt aus \`js/data/radiasthesie.js\` (Schema ${d.schemaVersion}) · Generator: \`scripts/build-uebersichten.cjs\``,
    '',
    '## 1. Woher diese Liste kommt',
    '',
    'Diese Datei ist **keine** zweite Quelle der Wahrheit. Sie ist eine aus den Daten',
    'erzeugte Lesefassung des Bestands, der auch die Seite `radiasthesie/quellen.html`',
    'und die Modulroute `#pendeln/quellen` speist:',
    '',
    '| Ebene | Datei | Rolle |',
    '| --- | --- | --- |',
    '| Redaktion | `docs/radiasthesie-konzept/recherche/quellen.json` | Quelldatei mit bibliografischen Angaben und Prüfvermerken (RAD-02) |',
    '| Erzeugung | `scripts/generate-radiasthesie-data.cjs` | prüft Pflichtfelder, Referenzen und Stufen, schreibt das Datenmodul |',
    '| Auslieferung | `js/data/radiasthesie.js` | `sources` im ausgelieferten Datenmodul |',
    '| Anzeige | `#pendeln/quellen`, `radiasthesie/quellen.html` | Quellenverzeichnis mit Filter und Interessenvermerk |',
    '',
    '## 2. Bestand in Zahlen',
    '',
    `- **${sources.length} Quellen** (Q01–Q${String(sources.length).padStart(2, '0')}).`,
    `- Prüftiefe: ${Object.entries(byVerification).map(([k, v]) => `${cell(k)} ${v}`).join(' · ')}.`,
    `- Stufenverweise: ${Object.entries(levels).map(([k, v]) => `${k} ${v}`).join(' · ')} (eine Quelle kann mehrere Stufen tragen).`,
    `- Typen: ${new Set(sources.map((s) => s.type)).size} verschiedene Angaben, von Behördenpublikation bis Vereinsseite.`,
    '',
    'Die Stufe gilt **je Aussage**, nicht je Quelle; dieselbe Quelle kann eine',
    'historische Tatsache (A) belegen und eine Bewertung (D) tragen. Die',
    'Bedeutung der Kürzel steht auf `#pendeln/methodik` und in',
    '`docs/radiasthesie-konzept/inhalte/modul-einstieg.md`.',
    '',
    '## 3. Verzeichnis',
    '',
    '| ID | Kurzname | Typ | Jahr | Stufen | Prüftiefe | Fundstelle |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...sources.map(
      (s) =>
        `| ${cell(s.id)} | ${cell(s.shortName)} | ${cell(s.type)} | ${cell(s.year)} | ${cell((s.levels || []).join(', '))} | ${cell(s.verification)} | ${cell(s.url)} |`
    ),
    '',
    '## 4. Was diese Bibliothek nicht belegt',
    '',
    '1. **Keine neue Erreichbarkeitsprüfung.** Die Prüftiefen stammen aus RAD-02',
    '   (Abruf 2026-11-03); RAD-14 hat keine URL erneut geöffnet. Ein `VL` heißt',
    '   „Volltext zum Zeitpunkt der Recherche geprüft“, nicht „heute online“.',
    '2. **Keine inhaltliche Bürgschaft.** Die Zuordnung Aussage → Quelle ist eine',
    '   redaktionelle Leistung. Geprüft ist, dass die Hauptquelle im zugeordneten',
    '   Kapitel zitiert wird (RAD-06, `verify_rad06.cjs`), nicht dass der Satz die',
    '   Quelle erschöpfend wiedergibt.',
    '3. **Widersprüche bleiben sichtbar.** RAD-02 markiert zwei Aussagen als',
    '   widersprüchlich und drei als unbelegt; sie stehen so im Text, statt',
    '   geglättet zu werden (RAD-02 `CLAIM-QUELLE-MATRIX.md`).',
    '4. **Keine Lizenzprüfung der Quellen.** Es werden keine fremden Texte',
    '   übernommen; Zitate sind kurz und belegt. Die Lizenz der eigenen Inhalte',
    '   ist projektweit offen (siehe `MEDIEN-LIZENZEN.md` §5).',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'QUELLENBIBLIOTHEK.md'), quellen, 'utf8');

  const items = manifest.items;
  const own = manifest.own_assets;
  const variantCount = items.reduce((n, it) => n + (it.varianten || []).length, 0);
  const originalBytes = items.reduce((n, it) => n + (it.original ? it.original.bytes : 0), 0);

  const medien = [
    '# Medien- und Lizenzverzeichnis',
    '',
    `Stand: ${manifest.retrieved_at} · Manifest: \`assets/radiasthesie/media/media-manifest.json\` (Schema ${manifest.schema_version}) · Generator: \`scripts/build-uebersichten.cjs\``,
    '',
    '## 1. Umfang',
    '',
    `- **${items.length} Fotos** aus Wikimedia Commons, ${variantCount} abgeleitete Varianten (520 px und 1040 px, WebP + AVIF, Ouija zusätzlich PNG).`,
    `- **${own.length} eigene SVG-Zeichnungen** (unverändert, geprüft).`,
    `- Originale: ${kb(originalBytes)} (davon das Ouija-PNG allein rund 22 MB) — bewusst unverändert abgelegt, damit die SHA-1-Prüfung gegen Commons nachweisbar bleibt.`,
    '- Ablage: `assets/radiasthesie/media/{original,520,1040}/`, Nachweise in `ATTRIBUTION.md` und `bildnachweis.html` (beide aus dem Manifest erzeugt).',
    '',
    '## 2. Lizenzregel',
    '',
    `Zulässig: ${manifest.license_policy.allowed.join(', ')}.`,
    '',
    `Ausgeschlossen: ${manifest.license_policy.excluded.join(', ')}.`,
    '',
    manifest.license_policy.rationale,
    '',
    '## 3. Fotos',
    '',
    '| ID | Motiv | Einsatz | Urheber | Lizenz | Quelle (Dateiseite) | Original | Varianten |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...items.map((it) => {
      const liz = it.lizenz || {};
      const orig = it.original ? `${it.original.breite}×${it.original.hoehe} px, ${kb(it.original.bytes)}` : '—';
      const vars = (it.varianten || []).map((v) => `${v.breite} px ${v.format.toUpperCase()}`).join(', ') || '—';
      return `| ${cell(it.id)} | ${cell(it.motiv)} | ${cell(it.einsatz)} | ${cell(it.urheber && it.urheber.name)} | ${cell(liz.kurz)} | ${cell(it.quelle && it.quelle.dateiseite)} | ${cell(orig)} | ${cell(vars)} |`;
    }),
    '',
    '### 3.1 Attributionszeilen (so stehen sie auf der Seite)',
    '',
    ...items.map((it) => `- ${cell(it.attribution_text)}`),
    '',
    '### 3.2 Einordnung je Motiv',
    '',
    '| ID | Alt-Text | Bildunterschrift | Rechtehinweis |',
    '| --- | --- | --- | --- |',
    ...items.map((it) => {
      const r = it.rechte || {};
      const hinweis = [r.laenderhinweis, r.marken ? `Marke: ${r.marken}` : '', r.bedenken].filter(Boolean).join(' ');
      return `| ${cell(it.id)} | ${cell(it.alt)} | ${cell(it.caption)} | ${cell(hinweis)} |`;
    }),
    '',
    '## 4. Eigene Zeichnungen',
    '',
    '| Datei | Motiv | Bytes | Sicherheitsprüfung |',
    '| --- | --- | --- | --- |',
    ...own.map(
      (a) =>
        `| \`${cell(a.datei)}\` | ${cell(a.motiv)} | ${cell(a.bytes)} | ${a.sicherheitspruefung && a.sicherheitspruefung.fehler === 0 ? '0 Fehler, keine Skripte/externen Referenzen, `title`/`desc`/`viewBox` vorhanden' : 'siehe Manifest'} |`
    ),
    '',
    '## 5. Offene Lizenzpunkte',
    '',
    'Stand dieses Verzeichnisses ist RAD-14 nach RAD-06/RAD-11/RAD-12. Die Liste',
    'unterscheidet, was inzwischen erledigt ist, von dem, was offen bleibt; die',
    'Rohliste des Manifests (`open_issues`) ist der Stand von RAD-05 und daher',
    'teilweise überholt.',
    '',
    '| Punkt | Stand | Beleg |',
    '| --- | --- | --- |',
    '| Fotos im Datenmodell | erledigt (RAD-06) | `media.items` in `js/data/radiasthesie.js`, zwei Fotos je Themenseite |',
    '| AVIF-Auslieferung | erledigt (RAD-06) | `<picture>` mit `<source type="image/avif">` in `js/modules/radiasthesie-views.js`; 6 AVIF-Verweise in `radiasthesie/pendeln.html` |',
    '| Bildnachweis im Seitenbau | erledigt (RAD-06) | Abschnitt „Bildnachweise und Lizenzen“ auf `#pendeln/methodik` und in `radiasthesie/methodik.html` |',
    '| Share-Alike sichtbar | erledigt (RAD-06) | Absatz „Share-Alike“ auf der Methodik-Seite; die Attributionszeilen nennen CC BY-SA 3.0 und die Änderung |',
    '| Keine `LICENSE`-Datei im Repository | **offen** | `package.json` nennt `"license": "MIT"`, es gibt aber keinen Lizenztext; die Rechte der eigenen SVGs und Inhalte sind damit nicht wirksam geregelt |',
    '| Ouija-Logo bei 520 px nicht lesbar | **offen, bewusst** | Alt-Text beschreibt das Logo, statt es zu entziffern |',
    '| Zuschreibung Wünschelrute (Pennant) unsicher | **offen, bewusst** | Die Bildunterschrift nennt die Publikation, nicht einen Zeichner |',
    '| Pfadabweichung zu RAD-01 §2.5 | **entschieden** | eine Manifestdatei unter `assets/radiasthesie/media/`; eine zweite Kopie wäre eine zweite Wahrheit |',
    '| Repo-Gewicht 26,3 MB Originale | **offen** | Prüfsummen gegen Commons bleiben nur mit unveränderten Originalen nachweisbar; Git LFS wäre die Alternative |',
    '',
    '## 6. Verwendung im Modul',
    '',
    '- Fotoeinbau über `<picture>` (AVIF, WebP, `<img>`-Rückfall) in den drei Themenseiten, zwei Fotos je Thema (RAD-06).',
    '- Maße und Seitenverhältnisse stammen aus dem Manifest; es wird nicht beschnitten und nicht über die Originalbreite skaliert (Ausnahme: `radiasthesierute` endet bei 520 px, weil das Original 566 px breit ist).',
    '- Bildnachweise und Lizenzen stehen als Abschnitt auf der Methodik-Seite (`#pendeln/methodik`); die statische Seite `radiasthesie/methodik.html` enthält denselben Abschnitt.',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'MEDIEN-LIZENZEN.md'), medien, 'utf8');

  console.log(
    `QUELLENBIBLIOTHEK.md: ${sources.length} Quellen · MEDIEN-LIZENZEN.md: ${items.length} Fotos, ${own.length} SVGs, ${variantCount} Varianten`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
