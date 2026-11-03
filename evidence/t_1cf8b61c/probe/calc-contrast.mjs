// Rechnet die im Bericht genannten Kontrastwerte nach (WCAG 2.x).
const hex = (value) => {
  const text = value.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(text.slice(offset, offset + 2), 16));
};
const lum = ([r, g, b]) =>
  [r, g, b]
    .map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const ratio = (a, b) => {
  const [hi, lo] = lum(hex(a)) >= lum(hex(b)) ? [lum(hex(a)), lum(hex(b))] : [lum(hex(b)), lum(hex(a))];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};
const cases = [
  ['line-strong auf bg-deep', '#82928e', '#141c1f'],
  ['border dekorativ auf bg-deep', '#3c484b', '#141c1f'],
  ['Prosa-Link auf Fließtextfarbe', '#c6b38e', '#babdb7'],
  ['Prosa-Link auf bg-card', '#c6b38e', '#182124'],
];
for (const [label, a, b] of cases) console.log(`${label}: ${ratio(a, b)}:1`);
