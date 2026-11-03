// Build gate: serve the freshly built dist/ exactly like the Pages host and run
// scripts/verify-pages.cjs against that local origin.
// The previous CI step ran verify-pages without arguments, which silently
// audited the live production site instead of the artifact just built.
const { spawn } = require('node:child_process');
const path = require('node:path');
const app = require('../index.js');

const output = process.argv[2] || 'test-results/verify-pages';

const server = app.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/Esoterik-Welt/`;
  console.log(`Verifying local build at ${base} (output: ${output})`);
  // Prüfe sowohl jede Seite als auch das gemeinsame Rubriken-Zielbild.
  // So kann ein Feature nicht mit fehlender Navigation veröffentlicht werden.
  const checks = [
    ['verify-pages.cjs', base, output],
    ['verify-rubriken.cjs', base, path.join(output, 'rubriken')],
  ];
  const next = () => {
    const args = checks.shift();
    if (!args) return server.close(() => process.exit(0));
    const child = spawn(process.execPath, [path.join(__dirname, args[0]), ...args.slice(1)], { stdio: 'inherit' });
    child.on('error', (error) => {
      console.error(error);
      server.close(() => process.exit(1));
    });
    child.on('exit', (code) => {
      if (code !== 0) server.close(() => process.exit(code ?? 1));
      else next();
    });
  };
  next();
});

server.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
