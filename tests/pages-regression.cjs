const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('production preview serves the designed 404 for nested unknown paths', async () => {
  const app = require('../index.js');
  const server = app.listen(0);
  try {
    const response = await fetch(`http://localhost:${server.address().port}/Esoterik-Welt/missing/nested`);
    assert.equal(response.status, 404);
    assert.match(await response.text(), /Seite nicht gefunden/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

for (const file of ['impressum.html', 'datenschutz.html', 'haftung.html']) {
  test(`${file} shares the existing theme and stays within the Pages project`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /name="viewport"/);
    // Prettier serialises void elements as `<base … />`; assert the target, not the slash.
    assert.match(html, /<base href="\/Esoterik-Welt\/"\s*\/?>/);
    assert.match(html, /rel="stylesheet" href="css\/design-system.css"/);
    assert.match(html, /rel="stylesheet" href="css\/main.css"/);
    assert.doesNotMatch(html, /href="\/(?!Esoterik-Welt\/)/);
  });
}
test('all local module imports resolve to shipped files', () => {
  for (const file of fs
    .readdirSync(path.join(root, 'js/modules'))
    .filter((f) => f.endsWith('.js') && !f.startsWith('_'))) {
    const source = fs.readFileSync(path.join(root, 'js/modules', file), 'utf8');
    for (const [, target] of source.matchAll(/(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g)) {
      assert.ok(fs.existsSync(path.resolve(root, 'js/modules', target)), `${file}: missing ${target}`);
    }
  }
});
test('footer and error-page navigation preserve the project base', () => {
  for (const file of ['index.html', '404.html']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /href="\/(?!Esoterik-Welt\/)/);
  }
});
