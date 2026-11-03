// Single source of truth for the target of the Playwright browser suites.
//
// The specs used to default to port 3100 — the same port `node index.js` uses
// for a manual preview. Together with `reuseExistingServer: !CI` Playwright then
// adopted whatever server was already listening there; a stale preview build
// produced 14 false failures (QA finding m-3). The E2E suite therefore owns a
// dedicated port that no preview server uses, `scripts/serve-e2e.cjs` refuses to
// start when the port is taken, and every spec derives its base URL here so none
// of them can drift back to 3100.
//
// Overrides:
//   E2E_PORT  port of the local build (default 3310)
//   BASE_URL  full base URL, e.g. https://ingbms.github.io/Esoterik-Welt
const DEFAULT_E2E_PORT = 3310;

function readPort() {
  const raw = process.env.E2E_PORT;
  if (raw === undefined || raw === '') return DEFAULT_E2E_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`E2E_PORT muss eine Portnummer zwischen 1 und 65535 sein, war: "${raw}"`);
  }
  return port;
}

const E2E_PORT = readPort();
const E2E_BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${E2E_PORT}/Esoterik-Welt`;

module.exports = { DEFAULT_E2E_PORT, E2E_PORT, E2E_BASE_URL };
