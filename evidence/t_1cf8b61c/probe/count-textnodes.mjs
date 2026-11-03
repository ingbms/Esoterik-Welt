// Summiert die geprüften Textknoten aus a11y.json.
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rows = data.summary.measuredText;
const total = rows.reduce((sum, row) => sum + row.checked, 0);
const min = Math.min(...rows.map((row) => row.min));
console.log(JSON.stringify({ views: rows.length, textNodes: total, minContrast: min, rows }));
