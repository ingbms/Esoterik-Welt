// Second deck: the Gartenbrevier V2 ships as an optional choice next to the
// default Nachtatelier deck. Both decks share the same 78 card ids, so this
// suite checks the mappings (78 x 2 = 156), the shipped bytes, the picker,
// persistence, deck switching inside the dialog and inside a draw, the fallback
// for an unknown stored id, the asset failure state and the file:// edition.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const localUrl = pathToFileURL(path.join(root, 'Lokal.html')).href;
const DECKS = {
  'nachtatelier-v1': { label: 'Nachtatelier', dir: 'assets/tarot/nachtatelier-v1' },
  'gartenbrevier-v2': { label: 'Gartenbrevier', dir: 'assets/tarot/gartenbrevier-v2' },
};
const LEVELS = { thumb: ['300', 300, 500], detail: ['600', 600, 1000], zoom: ['1200', 1200, 2000] };
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function loadRegistry() {
  const source = fs.readFileSync(path.join(root, 'js/data/tarot-decks.js'), 'utf8');
  const stripped = source.replace(/^export (const|function)/gm, '$1');
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(
    stripped +
      '\nmodule.exports = { listDecks, getDeck, resolveDeckId, cardAssetPath, backAssetPath, deckPreviewPath, DEFAULT_DECK_ID, SUPPORTED_DECK_IDS, TAROT_DECK_STORAGE_KEY, isSupportedDeckId, readStoredDeckId, storeDeckId };',
    sandbox
  );
  return sandbox.module.exports;
}

const registry = loadRegistry();

function deckManifest(deckId) {
  return JSON.parse(fs.readFileSync(path.join(root, DECKS[deckId].dir, 'manifest.json'), 'utf8'));
}

// ---------------------------------------------------------------------------
// Registry and shipped bytes
// ---------------------------------------------------------------------------
test('registry: two decks, V1 stays the default, both carry the same 78 ids', () => {
  // The registry is evaluated in its own vm realm: serialise before comparing.
  const decks = JSON.parse(JSON.stringify(registry.listDecks()));
  const ids = [];
  for (const deck of decks) ids.push(deck.id);
  assert.deepEqual(ids, ['nachtatelier-v1', 'gartenbrevier-v2'], 'registry order: default first, V2 second');
  assert.equal(registry.DEFAULT_DECK_ID, 'nachtatelier-v1', 'Nachtatelier remains the default');
  assert.equal(registry.getDeck('gartenbrevier-v2').basePath, 'assets/tarot/gartenbrevier-v2/');
  assert.equal(registry.getDeck(undefined).id, 'nachtatelier-v1', 'undefined resolves to the default');
  assert.equal(registry.resolveDeckId('unknown-deck'), 'nachtatelier-v1');
  assert.equal(registry.isSupportedDeckId('gartenbrevier-v2'), true);
  assert.equal(registry.isSupportedDeckId('nachtatelier-v1'), true);
  assert.equal(registry.isSupportedDeckId('gartenbrevier-v3'), false);
  for (const deck of decks) {
    assert.equal(deck.cardCount, 78);
    assert.equal(deck.aspect, '3:5');
    assert.deepEqual(Object.keys(deck.levels).sort(), ['detail', 'thumb', 'zoom']);
    assert.ok(deck.label && deck.meta && deck.badge, `label/meta/badge for ${deck.id}`);
  }
});

test('shipped assets: 156 card mappings exist with declared bytes, hashes and 3:5 sizes', () => {
  const paths = new Set();
  let checked = 0;
  for (const [deckId, meta] of Object.entries(DECKS)) {
    const manifest = deckManifest(deckId);
    assert.equal(manifest.deck_id, deckId);
    assert.equal(manifest.card_count, 78);
    assert.deepEqual(
      manifest.cards.map((card) => card.id),
      Array.from({ length: 78 }, (_, index) => index),
      `${deckId}: ids 0..77`
    );
    assert.equal(manifest.cards.filter((card) => card.arcana === 'major').length, 22, `${deckId}: 22 majors`);
    for (const suit of ['wands', 'cups', 'swords', 'pentacles']) {
      assert.equal(manifest.cards.filter((card) => card.suit === suit).length, 14, `${deckId}: ${suit}`);
    }
    for (const card of manifest.cards) {
      for (const [level, [folder, width, height]] of Object.entries(LEVELS)) {
        const entry = card.files[level];
        const file = path.join(root, meta.dir, entry.path);
        assert.ok(fs.existsSync(file), `missing ${meta.dir}/${entry.path}`);
        assert.equal(fs.statSync(file).size, entry.bytes, `bytes ${meta.dir}/${entry.path}`);
        assert.equal(sha256(file), entry.sha256, `hash ${meta.dir}/${entry.path}`);
        assert.deepEqual(entry.size, [width, height], `pixel size ${meta.dir}/${entry.path}`);
        assert.match(entry.path, new RegExp(`^${folder}/\\d{2}\\.jpg$`));
        if (level === 'thumb') {
          assert.equal(entry.path, `${folder}/${String(card.id).padStart(2, '0')}.jpg`);
          paths.add(`${deckId}:${entry.path}`);
        }
        checked += 1;
      }
    }
    for (const [level, [folder, width, height]] of Object.entries(LEVELS)) {
      const back = manifest.back.files[level];
      const file = path.join(root, meta.dir, back.path);
      assert.ok(fs.existsSync(file), `missing back ${meta.dir}/${back.path}`);
      assert.equal(sha256(file), back.sha256, `back hash ${meta.dir}/${back.path}`);
      assert.deepEqual(back.size, [width, height], `back size ${meta.dir}/${back.path}`);
      assert.equal(back.path, `${folder}/Ruecken.jpg`);
    }
  }
  assert.equal(checked, 468, '2 decks x 78 cards x 3 levels');
  assert.equal(paths.size, 156, '156 distinct card mappings over both decks');
});

test('registry paths and filesystem agree for all 156 mappings and both card backs', () => {
  for (const deck of registry.listDecks()) {
    for (let id = 0; id < 78; id += 1) {
      for (const level of Object.keys(LEVELS)) {
        const assetPath = registry.cardAssetPath(deck, id, level);
        const onDisk = path.join(root, assetPath);
        assert.ok(fs.existsSync(onDisk), `registry path without file: ${assetPath}`);
      }
    }
    for (const level of Object.keys(LEVELS)) {
      assert.ok(fs.existsSync(path.join(root, registry.backAssetPath(deck, level))));
    }
    assert.ok(fs.existsSync(path.join(root, registry.deckPreviewPath(deck))), 'picker preview exists');
  }
  const all = [];
  for (const deck of registry.listDecks()) {
    for (let id = 0; id < 78; id += 1) all.push(registry.cardAssetPath(deck, id, 'thumb'));
  }
  assert.equal(new Set(all).size, 156, 'no path collisions between the decks');
});

test('V1 deck is untouched by the second deck (manifest, bytes and card count)', () => {
  const v1 = deckManifest('nachtatelier-v1');
  assert.equal(v1.deck_id, 'nachtatelier-v1');
  assert.equal(v1.card_count, 78);
  // Fingerprint recorded before the V2 integration (evidence/t_937ab9cf/baseline.txt).
  assert.equal(
    sha256(path.join(root, 'assets/tarot/nachtatelier-v1/manifest.json')),
    'e3d0548a1db46cc135e05697ef4805823724dcbed4c5efa58f2cc54d86330a80',
    'V1 manifest is byte-identical to the published state'
  );
});

// ---------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------
async function withServer(run) {
  const app = require('../index.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/Esoterik-Welt/`;
  try {
    return await run(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function openTarot(page, base) {
  await page.goto(base + '#tarot', { waitUntil: 'load' });
  await page.locator('#tarot.active').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.tarotMod && window.tarotMod.deck);
  await page.locator('#tarotGrid .tarot-card').first().waitFor({ state: 'visible' });
}

const pickerState = (page) =>
  page.evaluate(() => {
    const host = document.getElementById('tarotDeckPicker');
    return {
      visible: !host.hidden,
      legend: host.querySelector('legend')?.textContent.trim() || null,
      options: [...host.querySelectorAll('.tarot-deck-option')].map((option) => ({
        value: option.querySelector('input').value,
        checked: option.querySelector('input').checked,
        selectedClass: option.classList.contains('is-selected'),
        text: option.innerText.replace(/\s+/g, ' ').trim(),
        preview: option.querySelector('img').getAttribute('src'),
      })),
      deck: window.tarotMod.deck.id,
      stored: localStorage.getItem('esoterik_tarot_deck'),
      status: document.getElementById('tarotDeckStatus')?.textContent.trim() || '',
    };
  });

// ---------------------------------------------------------------------------
// HTTP edition
// ---------------------------------------------------------------------------
test('picker: labeled previews, V1 selected by default, gallery uses V1', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const problems = [];
      page.on('pageerror', (error) => problems.push('pageerror: ' + error.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push('console: ' + msg.text());
      });
      await openTarot(page, base);
      // Both previews are lazy images: wait for the real decode event before
      // asserting, never for a fixed timeout.
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll('#tarotDeckPicker img')].every(
            (image) => image.complete && image.naturalWidth > 0
          ),
        null,
        { timeout: 5000 }
      );
      const state = await pickerState(page);
      assert.equal(state.visible, true, 'picker is rendered');
      assert.equal(state.legend, 'Deck wählen');
      assert.deepEqual(
        state.options.map((option) => option.value),
        ['nachtatelier-v1', 'gartenbrevier-v2']
      );
      assert.equal(state.options[0].checked, true, 'default deck is preselected');
      assert.equal(state.options[0].selectedClass, true);
      assert.equal(state.options[1].checked, false);
      assert.match(state.options[0].text, /Nachtatelier/);
      assert.match(state.options[0].text, /Standard/i);
      assert.match(state.options[1].text, /Gartenbrevier/);
      assert.match(state.options[1].text, /78 Karten/);
      assert.equal(state.options[0].preview, 'assets/tarot/nachtatelier-v1/300/00.jpg');
      assert.equal(state.options[1].preview, 'assets/tarot/gartenbrevier-v2/300/00.jpg');
      assert.equal(state.deck, 'nachtatelier-v1');
      assert.equal(state.stored, 'nachtatelier-v1');

      const radios = await page.getByRole('radio').count();
      assert.equal(radios, 2, 'two native radios, no custom roles');
      const names = await page
        .getByRole('radio')
        .evaluateAll((nodes) => nodes.map((node) => node.closest('label').innerText.replace(/\s+/g, ' ').trim()));
      assert.ok(names[0].includes('Nachtatelier') && names[1].includes('Gartenbrevier'), 'radios carry the labels');
      // The accessible name is one properly separated string; the visual badge and
      // meta line must never be concatenated ("NachtatelierStandard 78 Karten · 3:5").
      for (const name of [
        'Nachtatelier — Standard, 78 Karten, 3:5',
        'Gartenbrevier — Optional, Farbvariante, 78 Karten, 3:5',
      ]) {
        const matched = await page.getByRole('radio', { name, exact: true }).count();
        assert.equal(matched, 1, `radio accessible name: ${name}`);
      }
      const previews = await page
        .locator('#tarotDeckPicker img')
        .evaluateAll((nodes) =>
          nodes.map((node) => ({ loaded: node.complete && node.naturalWidth > 0, width: node.naturalWidth }))
        );
      assert.deepEqual(
        previews.map((preview) => preview.loaded),
        [true, true],
        'both previews decoded'
      );
      assert.deepEqual(
        previews.map((preview) => preview.width),
        [300, 300]
      );

      const grid = await page
        .locator('#tarotGrid .tarot-card img')
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.src || node.getAttribute('src')));
      assert.equal(grid.length, 78);
      assert.ok(
        grid.every((src) => src.includes('/nachtatelier-v1/300/')),
        'gallery shows the default deck'
      );
      assert.deepEqual(problems, []);
    } finally {
      await browser.close();
    }
  });
});

test('keyboard switch: arrow key changes deck, persists across reload, gallery follows', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const requests = [];
      page.on('request', (request) => {
        if (/\/assets\/tarot\//.test(request.url())) requests.push(request.url());
      });
      await openTarot(page, base);
      await page.waitForTimeout(400);
      const initial = requests.filter(
        (url) =>
          /\/\d{2}\.jpg$/.test(url) &&
          url !== base + 'assets/tarot/nachtatelier-v1/300/00.jpg' &&
          url !== base + 'assets/tarot/gartenbrevier-v2/300/00.jpg'
      );
      assert.ok(initial.length > 0, 'thumbnails are requested');
      assert.ok(
        initial.every((url) => url.includes('/nachtatelier-v1/')),
        'first view stays on V1'
      );
      assert.equal(
        requests.filter((url) => /gartenbrevier-v2/.test(url)).length,
        1,
        'only the V2 picker preview is fetched before the switch'
      );
      assert.equal(requests.filter((url) => /\/1200\//.test(url)).length, 0, 'no 1200 px master on first view');

      await page.locator('#tarotDeck-nachtatelier-v1').focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => window.tarotMod.deck.id === 'gartenbrevier-v2');
      await page.waitForFunction(() =>
        [...document.querySelectorAll('#tarotGrid .tarot-card img')].every((image) =>
          (image.dataset.src || image.getAttribute('src')).includes('/gartenbrevier-v2/300/')
        )
      );
      const after = await pickerState(page);
      assert.equal(after.options[1].checked, true, 'radio follows the selection');
      assert.equal(after.options[1].selectedClass, true);
      assert.equal(after.options[0].checked, false);
      assert.equal(after.stored, 'gartenbrevier-v2');
      assert.match(after.status, /Deck gewechselt: Gartenbrevier/);
      const focused = await page.evaluate(() => document.activeElement.value);
      assert.equal(focused, 'gartenbrevier-v2', 'focus stays on the chosen radio');
      const grid = await page
        .locator('#tarotGrid .tarot-card img')
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.src || node.getAttribute('src')));
      assert.ok(
        grid.every((src) => src.includes('/gartenbrevier-v2/300/')),
        'all 78 cards switch deck'
      );
      assert.equal(new Set(grid).size, 78, 'each card has its own V2 asset');

      await page.reload({ waitUntil: 'load' });
      await page.locator('#tarot.active').waitFor({ state: 'visible' });
      await page.waitForFunction(() => window.tarotMod.deck.id === 'gartenbrevier-v2');
      const reloaded = await pickerState(page);
      assert.equal(reloaded.deck, 'gartenbrevier-v2', 'selection survives the reload');
      assert.equal(reloaded.options[1].checked, true);
      const firstImage = await page.locator('#tarotGrid .tarot-card img').first().getAttribute('src');
      assert.match(firstImage, /gartenbrevier-v2\/300\/00\.jpg$/);
      await context.close();
    } finally {
      await browser.close();
    }
  });
});

test('dialog and draw: 156 dialog mappings follow the deck, draw keeps ids and orientation', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const problems = [];
      page.on('pageerror', (error) => problems.push('pageerror: ' + error.message));
      await openTarot(page, base);

      // Every card of both decks must open with its own 600 px asset and a 1200 px
      // zoom source of the same deck — 78 x 2 mappings, checked without waiting
      // for a decode because the mapping is the contract here.
      const mappings = [];
      for (const deckId of ['nachtatelier-v1', 'gartenbrevier-v2']) {
        await page.evaluate((id) => window.tarotMod.setDeck(id), deckId);
        for (let id = 0; id < 78; id += 1) {
          const entry = await page.evaluate((cardId) => {
            window.tarotMod.openModalById(cardId);
            const image = document.querySelector('.tarot-detail-image');
            const zoomButton = document.querySelector('.tarot-detail-zoom');
            const record = {
              deck: window.tarotMod.deck.id,
              id: cardId,
              src: image.getAttribute('src'),
              zoomSrc: zoomButton.dataset.zoomSrc,
              alt: image.getAttribute('alt'),
            };
            window.tarotMod.closeModal();
            return record;
          }, id);
          mappings.push(entry);
        }
      }
      assert.equal(mappings.length, 156, '156 dialog mappings');
      const expected = [];
      for (const deckId of ['nachtatelier-v1', 'gartenbrevier-v2']) {
        for (let id = 0; id < 78; id += 1) {
          const file = String(id).padStart(2, '0') + '.jpg';
          expected.push({
            deck: deckId,
            id,
            src: `assets/tarot/${deckId}/600/${file}`,
            zoomSrc: `assets/tarot/${deckId}/1200/${file}`,
          });
        }
      }
      for (const [index, record] of mappings.entries()) {
        assert.equal(record.deck, expected[index].deck);
        assert.equal(record.src, expected[index].src, `detail asset ${record.deck}/${record.id}`);
        assert.equal(record.zoomSrc, expected[index].zoomSrc, `zoom asset ${record.deck}/${record.id}`);
        assert.match(record.alt, record.deck === 'gartenbrevier-v2' ? /Gartenbrevier/ : /Nachtatelier/);
      }
      // The 156 detail files referenced above exist on disk with real bytes.
      for (const record of mappings) {
        const file = path.join(root, record.src);
        assert.ok(fs.existsSync(file), 'missing detail asset ' + record.src);
        assert.ok(fs.statSync(file).size > 5000, 'detail asset is a real image ' + record.src);
        assert.ok(fs.existsSync(path.join(root, record.zoomSrc)), 'missing zoom asset ' + record.zoomSrc);
      }

      // Draw while V1 is active, then switch decks mid-flight.
      await page.evaluate(() => window.tarotMod.setDeck('nachtatelier-v1'));
      await page.locator('#drawThreeBtn').click();
      await page.waitForFunction(() => document.querySelectorAll('#drawnCards > *').length === 3);
      await page.waitForFunction(() => document.querySelectorAll('#drawnCards .is-shuffling').length === 0, null, {
        timeout: 8000,
      });
      await page.locator('#cardModal.open').waitFor({ state: 'visible', timeout: 8000 });
      const drawnBefore = await page.evaluate(() =>
        [...document.querySelectorAll('#drawnCards > *')].map((element) => ({
          id: element.dataset.id,
          reversed: element.dataset.reversed,
          name: element.querySelector('.drawn-card-name').textContent,
          image: element.querySelector('img').getAttribute('src'),
        }))
      );
      assert.ok(drawnBefore.every((card) => card.image.includes('/nachtatelier-v1/300/')));
      const dialogBefore = await page.evaluate(() => ({
        id: window.tarotMod.currentCardId,
        src: document.querySelector('.tarot-detail-image').getAttribute('src'),
      }));

      // Switch deck while the dialog is open.
      await page.evaluate(() => window.tarotMod.setDeck('gartenbrevier-v2'));
      const dialogAfter = await page.evaluate(() => ({
        id: window.tarotMod.currentCardId,
        src: document.querySelector('.tarot-detail-image').getAttribute('src'),
        zoomSrc: document.querySelector('.tarot-detail-zoom').dataset.zoomSrc,
      }));
      assert.equal(dialogAfter.id, dialogBefore.id, 'the open card stays the same card');
      assert.match(dialogAfter.src, /\/gartenbrevier-v2\/600\//, 'open dialog switches its artwork');
      assert.match(dialogAfter.zoomSrc, /\/gartenbrevier-v2\/1200\//);

      const drawnAfter = await page.evaluate(() =>
        [...document.querySelectorAll('#drawnCards > *')].map((element) => ({
          id: element.dataset.id,
          reversed: element.dataset.reversed,
          name: element.querySelector('.drawn-card-name').textContent,
          image: element.querySelector('img').getAttribute('src'),
        }))
      );
      assert.deepEqual(
        drawnAfter.map((card) => [card.id, card.reversed, card.name]),
        drawnBefore.map((card) => [card.id, card.reversed, card.name]),
        'draw keeps ids, orientation and names'
      );
      assert.ok(
        drawnAfter.every((card) => card.image.includes('/gartenbrevier-v2/300/')),
        'drawn cards switch their artwork'
      );

      // Interpretation data is deck independent: the same card keeps every text.
      const texts = await page.evaluate(() => {
        const card = window.tarotMod.cards[18];
        return [card.name, card.meaning_up, card.meaning_rev, card.keywords.join('|'), card.symbolism];
      });
      await page.evaluate(() => window.tarotMod.setDeck('nachtatelier-v1'));
      const textsAgain = await page.evaluate(() => {
        const card = window.tarotMod.cards[18];
        return [card.name, card.meaning_up, card.meaning_rev, card.keywords.join('|'), card.symbolism];
      });
      assert.deepEqual(textsAgain, texts, 'meanings do not depend on the deck');

      // Zoom keeps working on the switched deck and returns to the 600 px image.
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('cardModal').classList.contains('open'));
      await page.evaluate(() => window.tarotMod.setDeck('gartenbrevier-v2'));
      await page.locator('#tarotGrid .tarot-card').nth(4).click();
      await page.locator('#cardModal.open').waitFor({ state: 'visible' });
      await page.locator('.tarot-detail-zoom').click();
      await page.waitForFunction(() => {
        const image = document.querySelector('.tarot-detail-image');
        return image && image.getAttribute('src').includes('/1200/') && image.complete && image.naturalWidth > 0;
      });
      const zoomed = await page.evaluate(() => {
        const image = document.querySelector('.tarot-detail-image');
        return { src: image.getAttribute('src'), natural: [image.naturalWidth, image.naturalHeight] };
      });
      assert.match(zoomed.src, /gartenbrevier-v2\/1200\/04\.jpg$/);
      assert.deepEqual(zoomed.natural, [1200, 2000], 'the generated 1200 px step is a real 1200 x 2000 image');
      await page.locator('.tarot-detail-zoom').click();
      await page.waitForFunction(() =>
        document.querySelector('.tarot-detail-image').getAttribute('src').includes('/600/')
      );
      assert.deepEqual(problems, []);
    } finally {
      await browser.close();
    }
  });
});

test('stored deck id: unknown value falls back to V1, heals the key and keeps history', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
      await context.addInitScript(() => {
        localStorage.setItem('esoterik_tarot_deck', 'gartenbrevier-v3-preview');
        localStorage.setItem(
          'esoterik_tarot_history',
          JSON.stringify([{ id: 23, name: '1 der Stäbe', reversed: false, timestamp: '2026-10-31T20:00:00.000Z' }])
        );
      });
      const page = await context.newPage();
      await openTarot(page, base);
      const state = await pickerState(page);
      assert.equal(state.deck, 'nachtatelier-v1', 'unknown id falls back to the default deck');
      assert.equal(state.stored, 'nachtatelier-v1', 'the stored value is healed');
      assert.equal(state.options[0].checked, true);
      assert.equal(await page.locator('#tarotGrid .tarot-card').count(), 78);
      assert.equal(await page.locator('#tarotHistoryBox li').count(), 1);
      assert.equal(
        (await page.locator('#tarotHistoryBox .tarot-history-name').textContent()).trim(),
        '2 der Stäbe',
        'old history keeps its id and the corrected name'
      );
      await context.close();
    } finally {
      await browser.close();
    }
  });
});

test('payload: no second master set, no double initial load; the deck lazily loads its own thumbs', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await openTarot(page, base);
      await page.waitForTimeout(1500);
      const initial = await page.evaluate(() => {
        const entries = performance
          .getEntriesByType('resource')
          .filter((entry) => /\/assets\/tarot\/.+\.jpg/.test(entry.name));
        const byDeck = {};
        for (const entry of entries) {
          const deck = (entry.name.match(/tarot\/([^/]+)\//) || [null, '?'])[1];
          const level = (entry.name.match(/tarot\/[^/]+\/(\d+)\//) || [null, 'back'])[1];
          const bucket = (byDeck[deck] = byDeck[deck] || { files: 0, bytes: 0, levels: new Set() });
          bucket.files += 1;
          bucket.bytes += entry.encodedBodySize || entry.transferSize || 0;
          bucket.levels.add(level);
        }
        for (const bucket of Object.values(byDeck)) bucket.levels = [...bucket.levels];
        return byDeck;
      });
      assert.ok(initial['nachtatelier-v1'].files > 0, 'V1 thumbnails load');
      assert.equal(
        initial['nachtatelier-v1'].files < 78,
        true,
        `only visible V1 thumbs load (${initial['nachtatelier-v1'].files})`
      );
      assert.deepEqual(initial['nachtatelier-v1'].levels, ['300'], 'V1 loads no 600/1200 master up front');
      assert.equal(initial['gartenbrevier-v2'].files, 1, 'V2 contributes exactly one preview image');
      assert.deepEqual(initial['gartenbrevier-v2'].levels, ['300']);
      assert.ok(
        initial['gartenbrevier-v2'].bytes < 200_000,
        `V2 preview payload is small (${initial['gartenbrevier-v2'].bytes} bytes)`
      );

      await page.evaluate(() => window.tarotMod.setDeck('gartenbrevier-v2'));
      await page.waitForTimeout(1500);
      const after = await page.evaluate(() => {
        const entries = performance
          .getEntriesByType('resource')
          .filter((entry) => /\/assets\/tarot\/.+\.jpg/.test(entry.name));
        const levels = new Set();
        for (const entry of entries) {
          if (!entry.name.includes('gartenbrevier-v2')) continue;
          levels.add((entry.name.match(/gartenbrevier-v2\/(\d+)\//) || [null, 'back'])[1]);
        }
        return {
          v2Files: entries.filter((entry) => entry.name.includes('gartenbrevier-v2')).length,
          v2Levels: [...levels],
          v1After: entries.filter((entry) => entry.name.includes('nachtatelier-v1')).length,
        };
      });
      assert.deepEqual(after.v2Levels.sort(), ['300'], 'switching loads only the V2 thumbnails');
      assert.ok(after.v2Files < 156, `no full deck set loaded (${after.v2Files} V2 files)`);
      assert.equal(after.v1After < 78, true, 'the previous deck is not re-fetched');
    } finally {
      await browser.close();
    }
  });
});

test('missing asset: a broken V2 thumbnail is named instead of showing a broken icon', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const problems = [];
      page.on('pageerror', (error) => problems.push('pageerror: ' + error.message));
      await page.route('**/assets/tarot/gartenbrevier-v2/300/05.jpg', (route) => route.abort());
      await openTarot(page, base);
      await page.evaluate(() => window.tarotMod.setDeck('gartenbrevier-v2'));
      await page.waitForFunction(() => window.tarotMod.deck.id === 'gartenbrevier-v2');
      const card = page.locator('#tarotGrid .tarot-card[data-id="5"]');
      await card.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () => {
          const node = document.querySelector('#tarotGrid .tarot-card[data-id="5"]');
          return node && node.classList.contains('is-missing');
        },
        null,
        { timeout: 5000 }
      );
      const state = await card.evaluate((node) => ({
        missing: node.classList.contains('is-missing'),
        fallback: node.querySelector('.tarot-image-fallback')?.textContent || '',
        imageHidden: node.querySelector('img').hidden,
      }));
      assert.equal(state.missing, true);
      assert.match(state.fallback, /Bild nicht verfügbar/);
      assert.equal(state.imageHidden, true);
      // The other 77 cards keep their artwork: exactly one card is marked missing
      // and carries the named fallback, the grid itself stays complete.
      const afterFailure = await page.evaluate(() => ({
        cards: document.querySelectorAll('#tarotGrid .tarot-card').length,
        missing: document.querySelectorAll('#tarotGrid .tarot-card.is-missing').length,
        fallbacks: document.querySelectorAll('#tarotGrid .tarot-image-fallback').length,
        othersWithSource: [...document.querySelectorAll('#tarotGrid .tarot-card img')].filter(
          (node) => !node.hidden && (node.getAttribute('src') || node.dataset.src)
        ).length,
      }));
      assert.equal(afterFailure.cards, 78, 'the gallery keeps all 78 cards');
      assert.equal(afterFailure.missing, 1, 'exactly one card is marked missing');
      assert.equal(afterFailure.fallbacks, 1);
      assert.equal(afterFailure.othersWithSource, 77, 'the other 77 cards still carry their source');
      assert.deepEqual(problems, []);
    } finally {
      await browser.close();
    }
  });
});

test('mobile 375/768: picker fits, switches, and the gallery stays inside the viewport', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      for (const width of [375, 768]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await openTarot(page, base);
        const layout = await page.evaluate(() => {
          const host = document.getElementById('tarotDeckPicker');
          const options = [...host.querySelectorAll('.tarot-deck-option')];
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            innerOverflow: host.scrollWidth - host.clientWidth,
            visible: !host.hidden && host.getBoundingClientRect().height > 80,
            optionWidths: options.map((option) => Math.round(option.getBoundingClientRect().width)),
            stacked:
              options.length === 2 && options[0].getBoundingClientRect().top < options[1].getBoundingClientRect().top,
            optionOverflow: options.map((option) => option.scrollWidth - option.clientWidth),
          };
        });
        assert.equal(layout.visible, true, `picker visible at ${width}`);
        assert.equal(layout.overflow, 0, `no horizontal document overflow at ${width}`);
        assert.equal(layout.innerOverflow, 0, `picker does not overflow at ${width}`);
        assert.deepEqual(layout.optionOverflow, [0, 0], `options fit at ${width}`);
        if (width === 375) assert.equal(layout.stacked, true, 'options stack on a phone');
        else assert.equal(layout.stacked, false, 'options sit side by side on a tablet');

        await page.locator('#tarotDeck-gartenbrevier-v2').click();
        await page.waitForFunction(() => window.tarotMod.deck.id === 'gartenbrevier-v2');
        await page.waitForFunction(
          () => document.querySelectorAll('#tarotGrid .tarot-card img[src*="/gartenbrevier-v2/300/"]').length > 0
        );
        const afterSwitch = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          first: document.querySelector('#tarotGrid .tarot-card img').getAttribute('src'),
        }));
        assert.equal(afterSwitch.overflow, 0, `still no overflow after switching at ${width}`);
        assert.match(afterSwitch.first, /gartenbrevier-v2\/300\//);
        await context.close();
      }
    } finally {
      await browser.close();
    }
  });
});

// ---------------------------------------------------------------------------
// file:// edition
// ---------------------------------------------------------------------------
test('file:// edition: both decks decode from disk, switch and reload work offline', async () => {
  assert.ok(fs.existsSync(path.join(root, 'Lokal.html')), 'Lokal.html missing — run npm run build:local');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, offline: true });
    const page = await context.newPage();
    const problems = [];
    page.on('pageerror', (error) => problems.push('pageerror: ' + error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') problems.push('console: ' + msg.text());
    });
    page.on('request', (request) => {
      if (/^https?:/i.test(request.url())) problems.push('network request: ' + request.url());
    });
    await page.goto(localUrl + '#tarot', { waitUntil: 'load' });
    await page.locator('#tarot.active').waitFor({ state: 'visible' });
    await page.waitForFunction(() => window.tarotMod && window.tarotMod.deck);

    const result = await page.evaluate(async () => {
      const decks = ['nachtatelier-v1', 'gartenbrevier-v2'];
      const failures = [];
      let checked = 0;
      for (const deck of decks) {
        for (const level of ['300', '600']) {
          for (let id = 0; id < 78; id += 1) {
            const src = `assets/tarot/${deck}/${level}/${String(id).padStart(2, '0')}.jpg`;
            checked += 1;
            await new Promise((resolve) => {
              const image = new Image();
              image.onload = () => resolve();
              image.onerror = () => {
                failures.push(src);
                resolve();
              };
              image.src = src;
            });
          }
        }
      }
      return { checked, failures };
    });
    assert.equal(result.checked, 312, 'both decks x 78 cards x 300/600 px');
    assert.deepEqual(result.failures, []);

    // Switch to V2 offline and reload with the stored preference.
    await page.evaluate(() => window.tarotMod.setDeck('gartenbrevier-v2'));
    await page.waitForFunction(() => window.tarotMod.deck.id === 'gartenbrevier-v2');
    await page.waitForFunction(() =>
      [...document.querySelectorAll('#tarotGrid .tarot-card img')].every((image) =>
        (image.dataset.src || image.getAttribute('src')).includes('/gartenbrevier-v2/300/')
      )
    );
    await page.reload({ waitUntil: 'load' });
    await page.locator('#tarot.active').waitFor({ state: 'visible' });
    await page.waitForFunction(() => window.tarotMod && window.tarotMod.deck.id === 'gartenbrevier-v2');
    const offline = await page.evaluate(() => ({
      deck: window.tarotMod.deck.id,
      stored: localStorage.getItem('esoterik_tarot_deck'),
      first: (() => {
        const image = document.querySelector('#tarotGrid .tarot-card img');
        return image.dataset.src || image.getAttribute('src');
      })(),
      picker: !document.getElementById('tarotDeckPicker').hidden,
    }));
    assert.equal(offline.deck, 'gartenbrevier-v2');
    assert.equal(offline.stored, 'gartenbrevier-v2');
    assert.match(offline.first, /gartenbrevier-v2\/300\/00\.jpg$/);
    assert.equal(offline.picker, true, 'picker works in the offline edition');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await browser.close();
  }
});
