// Liest Lighthouse-JSON-Reports und fasst Kategorien und Audits zusammen.
// Aufruf: node summarize-lighthouse.mjs <datei...>
import fs from 'node:fs';
for (const file of process.argv.slice(2)) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  const scores = Object.fromEntries(
    Object.entries(report.categories || {}).map(([key, value]) => [key, Math.round((value.score ?? 0) * 100)])
  );
  const failures = Object.values(report.audits || {})
    .filter((audit) => audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== 'informative' && audit.scoreDisplayMode !== 'notApplicable')
    .filter((audit) => ['accessibility', 'best-practices', 'seo'].some((cat) => (report.categories?.[cat]?.auditRefs || []).some((ref) => ref.id === audit.id)))
    .map((audit) => ({ id: audit.id, score: audit.score, title: audit.title }));
  console.log(
    JSON.stringify(
      {
        file: file.split(/[\\/]/).pop(),
        finalUrl: report.finalDisplayedUrl,
        scores,
        failures,
        external: (report.audits?.['third-party-summary']?.details?.items || []).map((item) => item.entity),
      },
      null,
      2
    )
  );
}
