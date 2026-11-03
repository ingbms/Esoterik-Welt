// Exklusiver Vorschau-Server für die Playwright-Browser-Suiten (QA-Befund m-3).
//
// Playwright startet dieses Skript als `webServer`. Es prüft zuerst, ob der
// Zielport frei ist, und bricht mit einer eindeutigen Meldung ab, wenn dort
// bereits ein Prozess lauscht. Damit kann ein fremder oder veralteter Server
// weder übernommen (reuse) noch überschrieben werden — der Lauf endet sichtbar
// mit Fehler statt mit stillen Falschmeldungen gegen einen anderen Build.
const net = require('node:net');
const path = require('node:path');

const { E2E_PORT } = require(path.join(__dirname, '..', 'tests', 'helpers', 'e2e-target.cjs'));
const PORT = E2E_PORT;
let shuttingDown = false;

function fail(message) {
  console.error(`[e2e-server] ✗ ${message}`);
  process.exit(1);
}

function portTaken() {
  fail(
    `Port ${PORT} ist bereits belegt. Die Browser-Suite startet bewusst keinen Lauf gegen einen fremden ` +
      `Server (QA-Befund m-3). Belegenden Prozess beenden oder mit E2E_PORT einen freien Port wählen.`
  );
}

const probe = net.createServer();
probe.once('error', (error) => {
  if (error.code === 'EADDRINUSE') portTaken();
  fail(`Portprüfung auf ${PORT} fehlgeschlagen: ${error.code || error.message}`);
});
probe.once('listening', () => {
  probe.close(() => {
    // index.js exportiert die Express-App und lauscht nur als Hauptmodul; hier
    // wird sie bewusst selbst gebunden, damit der Port geprüft werden konnte.
    const app = require(path.join(__dirname, '..', 'index.js'));
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`[e2e-server] exklusiv auf http://127.0.0.1:${PORT}/Esoterik-Welt/ (kein Server-Reuse)`);
    });
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') portTaken();
      fail(`Serverstart auf ${PORT} fehlgeschlagen: ${error.code || error.message}`);
    });
    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 2000).unref();
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  });
});
probe.listen(PORT);
