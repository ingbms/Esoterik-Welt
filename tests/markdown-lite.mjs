// Vertragstests für den Markdown-Leser der Quellen-Ansicht (#frequenzen/quellen).
// Der Leser ist bewusst klein; die Tests halten die Grenzen fest: erlaubte
// Konstrukte werden gerendert, alles andere bleibt escapter Text, und ein
// manipuliertes Ziel darf kein Skript ausführen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml, renderInline, renderMarkdown } from '../js/modules/markdown-lite.js';

const root = path.resolve(import.meta.dirname, '..');

test('escapeHtml maskiert alle fünf Sonderzeichen', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});

test('Überschriften werden um headingOffset angehoben und behalten ihren Text', () => {
  const html = renderMarkdown('# Titel\n\n## Abschnitt\n\n### Unterabschnitt', { headingOffset: 1 });
  assert.match(html, /<h2>Titel<\/h2>/);
  assert.match(html, /<h3>Abschnitt<\/h3>/);
  assert.match(html, /<h4>Unterabschnitt<\/h4>/);
  assert.doesNotMatch(html, /#/);
});

test('Fett, Kursiv, Inline-Code und Fokus-Text werden gerendert', () => {
  const html = renderMarkdown('**fett** und *kursiv* und `hz = null` bleiben Text.');
  assert.match(html, /<strong>fett<\/strong>/);
  assert.match(html, /<em>kursiv<\/em>/);
  assert.match(html, /<code>hz = null<\/code>/);
  assert.doesNotMatch(html, /\*\*/);
});

test('Inline-Code schützt Markdown-Zeichen vor der Auszeichnung', () => {
  const html = renderMarkdown('Ein `**kein fett**` und `a | b` bleiben Code.');
  assert.match(html, /<code>\*\*kein fett\*\*<\/code>/);
  assert.match(html, /<code>a \| b<\/code>/);
  assert.doesNotMatch(html, /<strong>/);
});

test('Text wird escaped, Links nur mit sicheren Zielen ausgegeben', () => {
  const html = renderMarkdown('Weniger als <20 Hz und [Daten](../data/frequencies.json).');
  assert.match(html, /&lt;20 Hz/);
  assert.match(html, /<a href="\.\.\/data\/frequencies\.json">Daten<\/a>/);

  const unsafe = renderMarkdown('[klick](javascript:alert(1))');
  assert.doesNotMatch(unsafe, /<a /);
  assert.doesNotMatch(unsafe, /javascript:/);
  assert.match(unsafe, /klick/);
});

test('Externe Links öffnen nicht im selben Tab und sind als extern markiert', () => {
  const html = renderMarkdown('Siehe [ISO 16](https://www.iso.org/standard/3601.html).');
  assert.match(
    html,
    /<a href="https:\/\/www\.iso\.org\/standard\/3601\.html" target="_blank" rel="noopener noreferrer">/
  );
});

test('Nackte URLs werden verlinkt, Satzzeichen bleiben außerhalb des Links', () => {
  const html = renderMarkdown('Quelle: https://example.org/a (Abruf 2026-11-02).');
  assert.match(html, /<a href="https:\/\/example\.org\/a"[^>]*>https:\/\/example\.org\/a<\/a> \(Abruf 2026-11-02\)\./);
  assert.doesNotMatch(html, />https:\/\/example\.org\/a\)/);
});

test('Tabellen bekommen Kopfzellen mit scope, Ausrichtung und eine beschriftete Region', () => {
  const html = renderMarkdown(
    ['| Status | Regel |', '|---|---:|', '| `belegt` | direkt |', '| `traditionell` | überliefert |'].join('\n')
  );
  assert.match(html, /role="region" tabindex="0" aria-label="Tabelle 1: Status"/);
  assert.match(html, /<th scope="col">Status<\/th>/);
  assert.match(html, /<th scope="col" class="fq-align-right">Regel<\/th>/);
  assert.equal((html.match(/<tr>/g) || []).length, 3);
  assert.match(html, /<td><code>belegt<\/code><\/td>/);
});

test('Pipes in Inline-Code zerlegen keine Tabellenzelle', () => {
  const html = renderMarkdown(['| Feld | Werte |', '|---|---|', '| `kategorie` | `a | b` |'].join('\n'));
  assert.match(html, /<td><code>kategorie<\/code><\/td>/);
  assert.match(html, /<td><code>a \| b<\/code><\/td>/);
});

test('Codeblöcke werden escaped und nicht als Markdown gelesen', () => {
  const html = renderMarkdown(['```json', '{ "hz": 440, "x": "<b>" }', '```'].join('\n'));
  assert.match(html, /<pre class="fq-code" tabindex="0"><code class="language-json">/);
  assert.match(html, /&quot;hz&quot;: 440/);
  assert.match(html, /&lt;b&gt;/);
  assert.doesNotMatch(html, /<b>/);
});

test('Listen: ungeordnet, geordnet mit start und eine verschachtelte Ebene', () => {
  const html = renderMarkdown(['- eins', '- zwei', '  - zwei-a', '', '1. erster', '2. zweiter'].join('\n'));
  assert.match(html, /<ul><li>eins<\/li><li>zwei<ul><li>zwei-a<\/li><\/ul><\/li><\/ul>/);
  assert.match(html, /<ol><li>erster<\/li><li>zweiter<\/li><\/ol>/);

  const withStart = renderMarkdown(['3. drei', '4. vier'].join('\n'));
  assert.match(withStart, /<ol start="3">/);
});

test('Zitat, Trennlinie und Absätze werden als Blöcke ausgegeben', () => {
  const html = renderMarkdown(['> Ein Hinweis', '', '---', '', 'Erster Satz.', 'Zweiter Satz.'].join('\n'));
  assert.match(html, /<blockquote><p>Ein Hinweis<\/p><\/blockquote>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<p>Erster Satz\. Zweiter Satz\.<\/p>/);
});

test('Unbekannte Blöcke bleiben Text statt zu verschwinden', () => {
  const html = renderMarkdown('::: warning\nDas ist kein unterstützter Block.');
  assert.match(html, /::: warning Das ist kein unterstützter Block\./);
});

test('Das echte Quellendokument rendert vollständig und ohne Markdown-Reste', () => {
  const file = path.join(root, 'docs', 'frequenz-quellen.md');
  const source = fs.readFileSync(file, 'utf8');
  const html = renderMarkdown(source, { headingOffset: 1 });

  // Jede Überschrift außerhalb der Codeblöcke erscheint genau einmal als
  // HTML-Überschrift (Kommentarzeilen in ```-Blöcken zählen nicht).
  const outsideFences = [];
  let inFence = false;
  for (const line of source.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    else if (!inFence) outsideFences.push(line);
  }
  const markdownHeadings = outsideFences.filter((line) => /^#{1,3}\s/.test(line));
  assert.ok(markdownHeadings.length >= 20, 'Das Dokument hat mindestens 20 Überschriften');
  const renderedHeadings = html.match(/<h[2-4][ >]/g) || [];
  assert.equal(renderedHeadings.length, markdownHeadings.length);
  assert.match(html, /<h2>Frequenzen: Quellen, Evidenzstatus und Methodik<\/h2>/);
  assert.match(html, /<h3>12\. Quellenverzeichnis<\/h3>/);

  // Keine Blockmarker am Zeilenanfang (Listen-, Zitat- und Tabellenreste);
  // Codeblöcke enthalten legitim `#`-Kommentarzeilen und bleiben außen vor.
  const withoutCode = html.replace(/<pre[\s\S]*?<\/pre>/g, '');
  const leftovers = withoutCode.split('\n').filter((line) => /^(#{1,6}\s|>\s|\|\s?-{3,})/.test(line));
  assert.deepEqual(leftovers, []);

  // Tabellen, Code, Zitat und Quellenlinks sind vorhanden.
  assert.ok((html.match(/<table>/g) || []).length >= 5, 'mindestens fünf Tabellen');
  assert.ok((html.match(/<th scope="col"/g) || []).length >= 15, 'Tabellenkopfzellen');
  assert.ok((html.match(/<pre class="fq-code"/g) || []).length >= 2, 'Codeblöcke');
  assert.match(html, /<blockquote>/);
  const hrefs = [...html.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(
    hrefs.some((href) => href.startsWith('https://openstax.org/')),
    'Quellen-URLs sind Links'
  );
  assert.ok(
    hrefs.every((href) => /^(?:https?:|mailto:|tel:|\/|\.{1,2}\/|#)/.test(href)),
    'nur sichere Ziele'
  );
});

test('resolveHref schreibt Ziele für die Ansicht um', () => {
  const html = renderInline('[Test](../tests/x.cjs)', {
    resolveHref: (href) => href.replace('../', 'https://example.org/'),
  });
  assert.match(html, /<a href="https:\/\/example\.org\/tests\/x\.cjs"/);
});
