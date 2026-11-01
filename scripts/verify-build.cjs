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
  const child = spawn(process.execPath, [path.join(__dirname, 'verify-pages.cjs'), base, output], {
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    server.close(() => process.exit(code ?? 1));
  });
});

server.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
