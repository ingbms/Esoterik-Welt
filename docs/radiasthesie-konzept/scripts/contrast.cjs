// Kontrastprüfung der Radiästhesie-Oberfläche nach WCAG 2.x.
// Rechnet mit den normativen Nachtatelier-Tokens (css/design-system.css) und
// den für die Evidenzstufen A–E vorgesehenen Textfarben. Kein Screenshot-Wert:
// Kontrast hängt nur von den gerenderten Farbwerten ab, nicht von der Fläche.
const fs = require('node:fs');
const path = require('node:path');

const hex = (value) => {
  const v = value.replace('#', '').trim();
  const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const luminance = (color) => {
  const [r, g, b] = hex(color).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

const bgDeep = '#0b1012';
const bgCard = '#141c1f';
const surfaces = { bg_deep: bgDeep, bg_card: bgCard };

const foregrounds = {
  'text-primary': '#eae6dc',
  'text-secondary': '#babdb7',
  sand: '#c6b38e',
  'sand-hover': '#d5c4a2',
  'line-strong': '#82928e',
  'accent-rose': '#c09489',
  'accent-emerald': '#9db3a4',
  'level-A-historisch': '#c0a889',
  'level-C-hypothese': '#9db3c4',
  'level-E-widerlegt': '#c09489',
  'button-label-on-sand': '#0b1012',
};

const results = [];
for (const [surfaceName, surface] of Object.entries(surfaces)) {
  for (const [name, fg] of Object.entries(foregrounds)) {
    if (name === 'button-label-on-sand') continue;
    const r = ratio(fg, surface);
    results.push({
      surface: surfaceName,
      foreground: name,
      fg,
      bg: surface,
      ratio: r,
      aa_text: r >= 4.5,
      aaa_text: r >= 7,
      ui_3to1: r >= 3,
    });
  }
}
results.push({
  surface: 'sand-area',
  foreground: 'button-label-on-sand',
  fg: '#0b1012',
  bg: '#c6b38e',
  ratio: ratio('#0b1012', '#c6b38e'),
  aa_text: ratio('#0b1012', '#c6b38e') >= 4.5,
  aaa_text: ratio('#0b1012', '#c6b38e') >= 7,
  ui_3to1: ratio('#0b1012', '#c6b38e') >= 3,
});
results.push({
  surface: 'focus-ring',
  foreground: 'sand-outline',
  fg: '#c6b38e',
  bg: '#0b1012',
  ratio: ratio('#c6b38e', bgDeep),
  ui_3to1: ratio('#c6b38e', bgDeep) >= 3,
});

const outPath = path.join(__dirname, '..', 'messung', 'kontrast.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      erzeugt: new Date().toISOString(),
      norm: 'WCAG 2.2 · AA: 4.5:1 Text <24px bzw. <18.66px fett, 3:1 für Bedienelemente/Fokus',
      results,
    },
    null,
    2
  )
);
console.table(results.map((r) => ({ surface: r.surface, fg: r.foreground, ratio: r.ratio, AA: r.aa_text ? 'ja' : 'NEIN' })));
console.log('Datei: docs/radiasthesie-konzept/messung/kontrast.json');
