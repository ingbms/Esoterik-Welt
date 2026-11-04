import * as toc from './fixture/lib/toc.ts';

console.log('keys', Object.keys(toc));
const t = toc.buildTocTree([{ depth: 2, text: 'A' }, { depth: 2, text: 'B' }, { depth: 2, text: 'C' }]);
console.log('tree', JSON.stringify(t));
console.log('min3', JSON.stringify(toc.buildTocTree([{ depth: 2, text: 'A' }, { depth: 2, text: 'B' }, { depth: 2, text: 'C' }], { minHeadings: 1 })));
console.log('slug', toc.slugifyHeading('6. Einzelprüfungen'));
console.log('enabled', toc.TOC_ENABLED);
console.log('default export?', typeof toc.default);
