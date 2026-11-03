// Liest den Playwright-JSON-Bericht und gibt nur die Fehlschläge aus.
import fs from 'node:fs';
const file = process.argv[2];
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const lines = [];
const walk = (suite, trail) => {
  const path = [...trail, suite.title].filter(Boolean);
  for (const spec of suite.specs || []) {
    if (spec.ok !== false) continue;
    lines.push(`FAIL ${spec.title} (${path.join(' > ')})`);
    for (const test of spec.tests || [])
      for (const result of test.results || [])
        for (const error of result.errors || []) lines.push((error.message || '').slice(0, 1500));
  }
  for (const child of suite.suites || []) walk(child, path);
};
for (const suite of report.suites || []) walk(suite, []);
const stats = { passed: 0, failed: 0 };
const count = (suite) => {
  for (const spec of suite.specs || []) {
    if (spec.ok === false) stats.failed += 1;
    else stats.passed += 1;
  }
  for (const child of suite.suites || []) count(child);
};
for (const suite of report.suites || []) count(suite);
console.log(`passed=${stats.passed} failed=${stats.failed}`);
console.log(lines.join('\n'));
