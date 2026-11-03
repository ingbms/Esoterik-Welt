// Reproduktion des m-3-Szenarios: ein fremder/veralteter Vorschau-Server, der
// auf /api/health mit 200 antwortet (wie ein echter index.js-Lauf), sonst aber
// fremden Inhalt liefert. Aufruf: node evidence/t_8e62434e/fremder-server.cjs 3100
const http = require('node:http');

const port = Number(process.argv[2] || 3100);
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/health')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'fremder-vorschauserver' }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><title>Fremder Vorschauserver</title><h1>FREMDER SERVER – kein Frequenzlabor</h1>');
});
server.listen(port, '127.0.0.1', () => console.log(`fremder Server auf ${port}`));
