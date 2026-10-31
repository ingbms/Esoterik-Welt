const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
const site = path.join(__dirname, 'dist', 'Esoterik-Welt');
app.use('/Esoterik-Welt', express.static(site));
app.use('/Esoterik-Welt', (req, res) => {
  res.status(404).sendFile(path.join(site, '404.html'));
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(site, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'esoterik-welt' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Esoterik-Welt preview: http://localhost:${PORT}/Esoterik-Welt/`);
  });
}
module.exports = app;