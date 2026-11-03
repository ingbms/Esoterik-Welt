// Fasst den Playwright-JSON-Report knapp zusammen: Fehlerkopf je Testfall.
const fs = require('fs');
const path = process.argv[2] || 'test-results/qa-report.json';
const report = JSON.parse(fs.readFileSync(path, 'utf8'));

function walk(suite, out) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const result = (test.results || [])[0];
      out.push({
        project: test.projectName,
        title: spec.title,
        ok: spec.ok,
        status: result && result.status,
        error: result && result.error ? result.error.message.split('\n').slice(0, 14).join('\n') : '',
      });
    }
  }
  for (const child of suite.suites || []) walk(child, out);
}

const out = [];
for (const suite of report.suites) walk(suite, out);
const failed = out.filter((t) => !t.ok);
console.log(`TOTAL=${out.length} PASS=${out.filter((t) => t.ok).length} FAIL=${failed.length}`);
for (const test of failed) {
  console.log('\n### ' + test.project + ' :: ' + test.title);
  console.log(test.error);
}
