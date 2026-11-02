// Regressionstest für die Kristall-Attribution (Review t_385afa1e, Befund P1.1/P2.2).
//
// Prüft, dass der ausgelieferte Lizenznachweis ausschließlich aus der
// Ableitungsregel stammt und keine der früheren Falschangaben zurückkehrt:
//   - kein behaupteter Beschnitt, keine drei Stufen, kein JPEG
//   - `credit.changes` wörtlich enthalten
//   - Retusche genannt, wenn `production.retouch` gesetzt ist
//   - Manifest, data/crystals.json und Sammelnachweis stimmen überein
//
// Ausführen: node --test tests/crystals-attribution.cjs

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildAttributionText,
  attributionRequired,
  checkAttributionText,
} = require('../scripts/lib/crystal-attribution.cjs');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets', 'crystals');
const manifest = JSON.parse(fs.readFileSync(path.join(ASSETS, 'manifest.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'crystals.json'), 'utf8'));
const ledger = fs.readFileSync(path.join(ROOT, 'docs', 'kristalle', 'QUELLEN-RECHTS-MANIFEST.md'), 'utf8');

const images = manifest.images;
const byId = new Map(data.crystals.map((crystal) => [crystal.id, crystal]));

test('30 Bilder mit vier Ausgabestufen und vorhandenen WebP-Dateien', () => {
  assert.equal(images.length, 30);
  for (const image of images) {
    assert.deepEqual(Object.keys(image.levels).sort(), ['1280', '320', '640', '960'], image.id);
    for (const level of ['320', '640', '960', '1280']) {
      const file = path.join(ASSETS, image.levels[level]);
      assert.ok(fs.existsSync(file), `${image.id}: Datei fehlt (${image.levels[level]})`);
      assert.equal(fs.statSync(file).size, image.bytes[level], `${image.id}: Bytezahl ${level}`);
    }
  }
});

test('attribution_text_required ist aus credit/production generiert (0 Abweichungen)', () => {
  const deviations = [];
  for (const image of images) {
    const problems = checkAttributionText(image, image.attribution_text_required);
    if (problems.length) deviations.push(`${image.id}: ${problems.join('; ')}`);
  }
  assert.deepEqual(deviations, []);
});

test('änderungsbezogene Falschangaben sind ausgeschlossen', () => {
  for (const image of images) {
    const prose = image.attribution_text_required.replace(/https?:\/\/\S+/g, '');
    assert.ok(!/beschnitt|zuschnitt/i.test(prose), `${image.id}: behauptet einen Beschnitt`);
    assert.ok(!/jpe?g/i.test(prose), `${image.id}: nennt JPEG`);
    assert.ok(!/320\/640\/1280\s*px/.test(prose), `${image.id}: nennt nur drei Ausgabestufen`);
    assert.match(prose, /320\/640\/960\/1280 px \(WebP\)/, `${image.id}: vier Stufen fehlen`);
  }
});

test('credit.changes steht wörtlich im Nachweis, Retusche wird genannt', () => {
  for (const image of images) {
    const changes = image.credit.changes.trim();
    assert.ok(changes.length > 0, `${image.id}: credit.changes leer`);
    assert.ok(
      image.attribution_text_required.includes(changes),
      `${image.id}: credit.changes nicht wörtlich enthalten`
    );
    if (image.production.retouch) {
      assert.match(
        image.attribution_text_required,
        /retusch|entfernt|bereinigt/i,
        `${image.id}: Retusche (${image.production.retouch}) nicht genannt`
      );
    }
  }
});

test('namensnennungspflichtige Bilder sind vollständig und ShareAlike ausgewiesen', () => {
  const required = images.filter((image) => attributionRequired(image));
  assert.equal(required.length, 11, '11 BY/BY-SA-Bilder erwartet');
  for (const image of required) {
    assert.match(image.attribution_text_required, /lizenziert unter/, image.id);
    assert.match(image.attribution_text_required, /Quelle: https?:\/\//, image.id);
    assert.ok(image.credit.author, `${image.id}: Urheber fehlt`);
    assert.ok(image.credit.license_url, `${image.id}: Lizenz-URL fehlt`);
  }
  const shareAlike = images.filter((image) => image.credit.share_alike);
  assert.equal(shareAlike.length, 5, '5 ShareAlike-Bilder erwartet');
  for (const image of shareAlike) {
    assert.match(image.attribution_text_required, /ShareAlike/, image.id);
    assert.ok(image.adaptation_license, `${image.id}: adaptation_license fehlt`);
    assert.equal(image.adaptation_license.url, image.credit.license_url, image.id);
  }
  for (const image of images.filter((entry) => !entry.credit.share_alike)) {
    assert.equal(image.adaptation_license, null, image.id);
  }
});

test('data/crystals.json und Sammelnachweis spiegeln das Manifest', () => {
  for (const image of images) {
    const crystal = byId.get(image.id);
    assert.ok(crystal, `${image.id}: fehlt in data/crystals.json`);
    assert.equal(
      crystal.attribution_text_required,
      image.attribution_text_required,
      `${image.id}: data/crystals.json weicht ab`
    );
    assert.equal(crystal.image_alt, image.credit.alt, `${image.id}: Alt-Text weicht ab`);
    assert.equal(crystal.image_credit.changes, image.credit.changes, `${image.id}: Änderungstext weicht ab`);
    assert.ok(
      ledger.includes(`- Pflicht-Namensnennung: ${image.attribution_text_required}`),
      `${image.id}: Sammelnachweis weicht ab`
    );
  }
});

test('Alt-Texte widersprechen der gemessenen Grundhelligkeit nicht (P2.2)', () => {
  const measured = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'kristalle', 'plate-ground.json'), 'utf8'));
  for (const image of images) {
    const ground = measured.images[image.id];
    assert.ok(ground, `${image.id}: keine Messung in plate-ground.json`);
    const alt = image.credit.alt;
    if (ground.ground_class === 'hell') {
      assert.ok(!/dunklem Grund/.test(alt), `${image.id}: Alt-Text nennt dunklen Grund, Messung hell`);
    }
    if (ground.ground_class === 'dunkel') {
      assert.ok(!/hellem Grund/.test(alt), `${image.id}: Alt-Text nennt hellen Grund, Messung dunkel`);
    }
  }
});

test('Generator und Sync-Skript erzeugen denselben Text', () => {
  for (const image of images) {
    assert.equal(buildAttributionText(image), image.attribution_text_required, image.id);
  }
});
