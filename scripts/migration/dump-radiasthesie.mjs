import { RADIASTHESIE as R } from '../../js/data/radiasthesie.js';

const keys = (o) => Object.keys(o);
console.log('TOP:', keys(R));
console.log('module:', keys(R.module));
console.log('landing:', keys(R.landing));
console.log('landing.intro?', keys(R.landing.introduction || {}));
console.log('counts:', R.counts);
console.log('updated:', R.updated);
for (const t of R.landing.topics) console.log('topic', t.slug, keys(t));
console.log('workshop0', keys(R.landing.workshop[0]));
for (const k of Object.keys(R.landing)) console.log('landing.' + k + ':', JSON.stringify(R.landing[k]).slice(0, 300));
