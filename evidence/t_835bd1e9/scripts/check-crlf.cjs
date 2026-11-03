// Prüft, ob der Tarot-Manifest-Hash nur wegen CRLF abweicht.
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const file = path.join(__dirname, '..', '..', '..', 'assets/tarot/nachtatelier-v1/manifest.json');
const raw = fs.readFileSync(file);
const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const lf = Buffer.from(raw.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
console.log('raw  sha256:', hash(raw));
console.log('LF   sha256:', hash(lf));
console.log('CRLF-Vorkommen:', (raw.toString('utf8').match(/\r\n/g) || []).length);
console.log('Erwartet     : e3d0548a1db46cc135e05697ef4805823724dcbed4c5efa58f2cc54d86330a80');
console.log('git index hash:', require('child_process').execSync('git hash-object -- ' + JSON.stringify(file), { cwd: path.join(__dirname, '..', '..', '..') }).toString().trim());
console.log('git config autocrlf:', require('child_process').execSync('git config --get core.autocrlf', { cwd: path.join(__dirname, '..', '..', '..') }).toString().trim());
