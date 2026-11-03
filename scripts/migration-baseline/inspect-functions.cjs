#!/usr/bin/env node
// Zeigt Routen, Speicher, Requests, SEO, Build-Skripte und Generatoren aus der
// Messung docs/migration-baseline/evidence/functions/functions-baseline.json.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const data = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'docs', 'migration-baseline', 'evidence', 'functions', 'functions-baseline.json'),
    'utf8'
  )
);

console.log('## Routen');
console.log('main_pages:', data.routes.main_pages.map((p) => p.id + '@L' + p.line).join(', '));
console.log('skip_anchor:', JSON.stringify(data.routes.skip_anchor));
console.log('article_route:', JSON.stringify(data.routes.article_route));
for (const r of data.routes.area_routes) console.log('area:', r.area, r.pattern, 'L' + r.line);
console.log('aliases:', JSON.stringify(data.routes.aliases));

console.log('\n## page_meta');
for (const p of data.routes.page_meta) console.log(`  ${p.key} L${p.line} :: ${p.title}`);

console.log('\n## Subrouten');
for (const [area, v] of Object.entries(data.subroutes)) {
  console.log(`  ${area} (${v.module}): ${v.views.map((x) => x.value + '@L' + x.line).join(', ')}`);
}

console.log('\n## Speicher');
for (const s of data.storage) console.log(`  ${s.file}:L${s.line} ${s.key} resolved=${s.resolved}`);

console.log('\n## Externe Requests');
for (const r of data.requests) console.log(`  ${r.file}:L${r.line} ${r.snippet}`);

console.log('\n## SEO', JSON.stringify(data.seo, null, 2));

console.log('\n## Build-Skripte');
for (const b of data.build_scripts) console.log(`  ${b.name} = ${b.command}`);

console.log('\n## Generatoren');
for (const g of data.generators) console.log(`  ${g.file} <- ${g.path_literals.join(', ')}`);
