// Tarot deck integration: every one of the 78 Nachtatelier cards must open with
// its own asset, numeral, name and interpretation — in the HTTP edition and in
// the double-clicked file:// edition — plus filters, draws, orientation, deck-id
// fallback and the initial payload.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const deckDir = path.join(root, 'assets/tarot/nachtatelier-v1');
const manifest = JSON.parse(fs.readFileSync(path.join(deckDir, 'manifest.json'), 'utf8'));
const localUrl = pathToFileURL(path.join(root, 'Lokal.html')).href;
const SUITS = { wands: 'Stäbe', cups: 'Kelche', swords: 'Schwerter', pentacles: 'Münzen' };
const COURTS = ['Bube', 'Ritter', 'Königin', 'König'];

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// ---------------------------------------------------------------------------
// Static deck manifest
// ---------------------------------------------------------------------------
test('deck manifest: 78 stable ids, 22 + 4x14, no duplicates, canonical names', () => {
  assert.equal(manifest.card_count, 78);
  assert.equal(manifest.cards.length, 78);
  assert.deepEqual(
    manifest.cards.map((card) => card.id),
    Array.from({ length: 78 }, (_, index) => index)
  );
  assert.equal(manifest.cards.filter((card) => card.arcana === 'major').length, 22);
  for (const [suit, label] of Object.entries(SUITS)) {
    const cards = manifest.cards.filter((card) => card.suit === suit);
    assert.equal(cards.length, 14, `${suit} has ${cards.length} cards`);
    assert.deepEqual(
      cards.map((card) => card.number),
      Array.from({ length: 14 }, (_, index) => index + 1),
      `${suit} numbers 1..14`
    );
    for (const card of cards) {
      const expected =
        card.number === 1
          ? `Ass der ${label}`
          : card.number <= 10
            ? `${card.number} der ${label}`
            : `${COURTS[card.number - 11]} der ${label}`;
      assert.equal(card.name, expected, `id ${card.id} name`);
      // The generator defect (ID 23 "1 der Stäbe", number 2) must not survive:
      // for numbered cards the numeral in the name has to equal `number`.
      const numeralInName = card.name.match(/^(\d+) der /);
      if (numeralInName) assert.equal(Number(numeralInName[1]), card.number, `id ${card.id} name vs number`);
    }
  }
  assert.equal(manifest.cards[23].name, '2 der Stäbe', 'ID 23 is the two of wands');
  assert.equal(new Set(manifest.cards.map((card) => card.name)).size, 78, 'card names are unique');
});

test('deck manifest: every declared file exists with the declared hash, bytes and 3:5 size', () => {
  const expectedSize = { thumb: [300, 500], detail: [600, 1000], zoom: [1200, 2000] };
  for (const card of manifest.cards) {
    for (const [level, size] of Object.entries(expectedSize)) {
      const file = path.join(deckDir, card.files[level].path);
      assert.ok(fs.existsSync(file), `missing ${card.files[level].path}`);
      const stats = fs.statSync(file);
      assert.equal(stats.size, card.files[level].bytes, `bytes ${card.files[level].path}`);
      assert.equal(sha256(file), card.files[level].sha256, `hash ${card.files[level].path}`);
      assert.deepEqual(card.files[level].size, size, `pixel size ${card.files[level].path}`);
    }
  }
  for (const level of ['thumb', 'detail', 'zoom']) {
    const back = path.join(deckDir, manifest.back.files[level].path);
    assert.ok(fs.existsSync(back), `missing back ${level}`);
    assert.equal(sha256(back), manifest.back.files[level].sha256, `back hash ${level}`);
  }
});

test('card content: individual keywords and both interpretations for all 78 cards', () => {
  const source = fs.readFileSync(path.join(root, 'js/data/tarot.js'), 'utf8');
  const stripped = source.replace(/^export (const|function)/gm, '$1');
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(
    stripped + '\nmodule.exports = { tarotCards, TAROT_DISCLAIMER, SUIT_LABELS, TAROT_CARD_COUNT };',
    sandbox
  );
  const { tarotCards, TAROT_DISCLAIMER, TAROT_CARD_COUNT } = sandbox.module.exports;

  assert.equal(TAROT_CARD_COUNT, 78);
  assert.equal(tarotCards.length, 78);
  assert.match(TAROT_DISCLAIMER, /keine Vorhersage/);
  assert.equal(new Set(tarotCards.map((card) => card.meaning_up)).size, 78, 'upright meanings are individual');
  assert.equal(new Set(tarotCards.map((card) => card.meaning_rev)).size, 78, 'reversed meanings are individual');
  assert.equal(new Set(tarotCards.map((card) => card.symbolism)).size, 78, 'image language is individual');
  assert.deepEqual(
    // The module is evaluated in its own vm realm; normalise before comparing.
    JSON.parse(JSON.stringify(tarotCards.map((card) => [card.id, card.name, card.numeral]))),
    manifest.cards.map((card) => [card.id, card.name, card.numeral]),
    'generated data and deck manifest agree on every identity'
  );
  for (const card of tarotCards) {
    assert.ok(card.keywords.length >= 3, `keywords for ${card.name}`);
    assert.ok(
      card.keywords.every((keyword) => keyword.trim().length > 2),
      `empty keyword in ${card.name}`
    );
    assert.ok(card.symbolism.length > 40, `image language for ${card.name}`);
    assert.ok(card.meaning_up.length > 30 && card.meaning_rev.length > 20, `interpretations for ${card.name}`);
    assert.doesNotMatch(card.meaning_up, /Heilung garantiert|garantiert|Prognose|wird eintreten/);
  }
  // The old generic suit sentence ("Feuer-Energie: Kreativität, Wille, Aktion.")
  // must not come back for any card.
  const generic = /(Feuer|Wasser|Luft|Erde)-Energie:/;
  assert.equal(tarotCards.filter((card) => generic.test(card.meaning_up + card.meaning_rev)).length, 0);
  const moon = tarotCards.find((card) => card.id === 18);
  assert.match(moon.deep, /Nachtseite/, 'the Moon keeps its extended interpretation');
  assert.ok(moon.deep.length > 500);
  assert.equal(tarotCards.filter((card) => card.deep).length, 1, 'only the Moon carries the long-form text');
});

// ---------------------------------------------------------------------------
// Browser: every card, HTTP and file://
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

async function deckData(page) {
  return page.evaluate(() =>
    window.tarotMod.cards.map((card) => ({
      id: card.id,
      name: card.name,
      numeral: card.numeral,
      arcana: card.arcana,
      suit: card.suit,
      number: card.number,
      up: card.meaning_up,
      rev: card.meaning_rev,
      keywords: card.keywords,
    }))
  );
}

async function openAllCards(page, cards) {
  const results = [];
  for (const card of cards) {
    await page.locator(`#tarotGrid .tarot-card[data-id="${card.id}"]`).click();
    await page.locator('#cardModal.open').waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForFunction(
      () => {
        const image = document.querySelector('.tarot-detail-image');
        return Boolean(image && image.complete && image.naturalWidth > 0);
      },
      null,
      { timeout: 5000 }
    );
    const shown = await page.evaluate(() => {
      const body = document.getElementById('cardModalBody');
      const image = body.querySelector('.tarot-detail-image');
      return {
        title: document.getElementById('cardModalTitle').textContent,
        name: body.querySelector('.tarot-detail-name').textContent,
        kicker: body.querySelector('.tarot-detail-kicker').textContent,
        numeral: body.querySelector('.tarot-tags') ? null : null,
        badges: [...body.querySelectorAll('.tarot-detail-badges .badge')].map((badge) => badge.textContent.trim()),
        keywords: [...body.querySelectorAll('.tarot-tags li')].map((item) => item.textContent.trim()),
        meanings: [...body.querySelectorAll('.tarot-meaning p')].map((paragraph) => paragraph.textContent),
        symbolism: body.querySelector('.tarot-symbolism').textContent,
        imageSrc: image.currentSrc,
        natural: [image.naturalWidth, image.naturalHeight],
        alt: image.getAttribute('alt'),
        disclaimer: body.querySelector('.tarot-disclaimer').textContent,
        overflow: body.scrollWidth - body.clientWidth,
      };
    });
    results.push({ card, shown });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('cardModal').classList.contains('open'));
  }
  return results;
}

function assertAllCards(cards, results) {
  assert.equal(results.length, 78);
  for (const { card, shown } of results) {
    const id = String(card.id).padStart(2, '0');
    assert.ok(shown.title.startsWith(card.name), `dialog title for ${card.name}`);
    assert.equal(shown.name, card.name, `dialog headline for ${card.name}`);
    assert.equal(shown.badges[0], card.numeral, `numeral badge for ${card.name}`);
    assert.match(shown.kicker, card.arcana === 'major' ? /Große Arkana/ : new RegExp(SUITS[card.suit]));
    assert.deepEqual(shown.keywords, card.keywords, `keywords for ${card.name}`);
    assert.equal(shown.meanings[0], card.up, `upright meaning for ${card.name}`);
    assert.equal(shown.meanings[1], card.rev, `reversed meaning for ${card.name}`);
    assert.ok(shown.symbolism.length > 40, `image language for ${card.name}`);
    assert.match(shown.disclaimer, /keine Vorhersage/);
    assert.match(
      shown.imageSrc,
      new RegExp(`/tarot/nachtatelier-v1/600/${id}\\.jpg$`),
      `detail asset for ${card.name}`
    );
    assert.deepEqual(shown.natural, [600, 1000], `detail image decoded for ${card.name}`);
    assert.match(shown.alt, new RegExp(card.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `alt text for ${card.name}`);
    assert.equal(shown.overflow, 0, `dialog content overflow for ${card.name}`);
  }
}

test('HTTP edition: all 78 cards open with their own asset, name, numeral and interpretation', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const problems = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push('console: ' + msg.text());
      });
      page.on('pageerror', (error) => problems.push('pageerror: ' + error.message));
      page.on('requestfailed', (request) => problems.push('requestfailed: ' + request.url()));
      await page.goto(base + '#tarot', { waitUntil: 'load' });
      await page.locator('#tarot.active').waitFor({ state: 'visible' });
      const cards = await deckData(page);
      assert.equal(cards.length, 78);

      const results = await openAllCards(page, cards);
      assertAllCards(cards, results);
      assert.deepEqual(problems, []);
    } finally {
      await browser.close();
    }
  });
});

test('file:// edition: all 78 cards open offline from Lokal.html', async () => {
  assert.ok(fs.existsSync(path.join(root, 'Lokal.html')), 'Lokal.html missing — run npm run build:local');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, offline: true });
    const page = await context.newPage();
    const problems = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') problems.push('console: ' + msg.text());
    });
    page.on('pageerror', (error) => problems.push('pageerror: ' + error.message));
    page.on('requestfailed', (request) => problems.push('requestfailed: ' + request.url()));
    page.on('request', (request) => {
      if (/^https?:/i.test(request.url())) problems.push('network request: ' + request.url());
    });
    await page.goto(localUrl + '#tarot', { waitUntil: 'load' });
    await page.locator('#tarot.active').waitFor({ state: 'visible' });
    const cards = await deckData(page);
    const results = await openAllCards(page, cards);
    assertAllCards(cards, results);

    // All three web steps must be readable from disk, not just the ones the
    // visible grid happened to request.
    const decodable = await page.evaluate(async () => {
      const paths = [];
      for (const card of window.tarotMod.cards) {
        const id = String(card.id).padStart(2, '0');
        for (const step of ['300', '600', '1200']) paths.push(`assets/tarot/nachtatelier-v1/${step}/${id}.jpg`);
      }
      const failures = [];
      await Promise.all(
        paths.map(
          (src) =>
            new Promise((resolve) => {
              const image = new Image();
              image.onload = () => resolve();
              image.onerror = () => {
                failures.push(src);
                resolve();
              };
              image.src = src;
            })
        )
      );
      return { checked: paths.length, failures };
    });
    assert.equal(decodable.checked, 234);
    assert.deepEqual(decodable.failures, []);
    assert.deepEqual(problems, []);
  } finally {
    await browser.close();
  }
});

// ---------------------------------------------------------------------------
// Filters, search, draws, deck fallback, payload
// ---------------------------------------------------------------------------
test('filters and search: 22 / 56 / 14 per suit, empty state, reset', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
      await page.goto(base + '#tarot', { waitUntil: 'load' });
      await page.locator('#tarot.active').waitFor({ state: 'visible' });
      const count = () => page.locator('#tarotGrid .tarot-card').count();
      assert.equal(await count(), 78);
      for (const [value, expected] of [
        ['major', 22],
        ['minor', 56],
        ['wands', 14],
        ['cups', 14],
        ['swords', 14],
        ['pentacles', 14],
        ['all', 78],
      ]) {
        await page.selectOption('#arcanaFilter', value);
        await page.waitForFunction((n) => document.querySelectorAll('#tarotGrid .tarot-card').length === n, expected);
        assert.ok((await page.locator('#tarotResultCount').textContent()).includes(`${expected}`));
      }
      await page.selectOption('#arcanaFilter', 'major');
      await page.fill('#tarotSearch', 'stern');
      await page.waitForFunction(() => document.querySelectorAll('#tarotGrid .tarot-card').length === 1);
      assert.equal(
        (await page.locator('#tarotGrid .tarot-name').first().textContent()).trim(),
        'Der Stern',
        'search finds by card name'
      );
      await page.fill('#tarotSearch', 'Täuschung');
      await page.waitForFunction(() => document.querySelectorAll('#tarotGrid .tarot-card').length > 0);
      const keywordNames = await page.locator('#tarotGrid .tarot-name').allTextContents();
      assert.ok(
        keywordNames.some((name) => name.trim() === 'Der Mond'),
        'search finds a card by its keyword'
      );
      await page.fill('#tarotSearch', 'zzz');
      await page.waitForFunction(() => !document.getElementById('tarotEmptyState').hidden);
      assert.equal(await count(), 0);
      assert.match(await page.locator('#tarotEmptyState').textContent(), /Keine Karte/);
      await page.locator('#tarotResetFilters').click();
      await page.waitForFunction(() => document.querySelectorAll('#tarotGrid .tarot-card').length === 78);
      assert.equal(await page.inputValue('#tarotSearch'), '');
      assert.equal(await page.inputValue('#arcanaFilter'), 'all');
    } finally {
      await browser.close();
    }
  });
});

test('draws: single and three-card spread keep the drawn orientation and the back image', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
      await page.goto(base + '#tarot', { waitUntil: 'load' });
      await page.locator('#tarot.active').waitFor({ state: 'visible' });

      await page.locator('#drawThreeBtn').click();
      await page.waitForFunction(() => document.querySelectorAll('#drawnCards > *').length === 3);
      const backs = await page.evaluate(() =>
        [...document.querySelectorAll('#drawnCards img')].map((image) => image.getAttribute('src'))
      );
      assert.equal(backs.length, 3);
      for (const src of backs) assert.match(src || '', /300\/Ruecken\.jpg$/, 'shuffle shows the card back');

      for (let round = 0; round < 4; round += 1) {
        await page.waitForFunction(() => document.querySelectorAll('#drawnCards .is-shuffling').length === 0, null, {
          timeout: 8000,
        });
        await page.locator('#cardModal.open').waitFor({ state: 'visible', timeout: 8000 });
        const drawn = await page.evaluate(() => {
          const cards = [...document.querySelectorAll('#drawnCards > *')].map((element) => ({
            id: element.dataset.id,
            reversed: element.dataset.reversed === 'true',
            name: element.querySelector('.drawn-card-name').textContent,
            image: element.querySelector('img').getAttribute('src'),
          }));
          const body = document.getElementById('cardModalBody');
          return {
            cards,
            title: document.getElementById('cardModalTitle').textContent,
            badge: body.querySelector('.badge-upright, .badge-reversed').textContent.trim(),
            active: body.querySelector('.tarot-meaning.is-active h5').textContent,
            history: document.querySelectorAll('#tarotHistoryBox li').length,
          };
        });
        assert.equal(drawn.cards.length, 3);
        assert.equal(drawn.cards[0].id, String(await page.evaluate(() => window.tarotMod.currentCardId)));
        assert.equal(
          drawn.badge,
          drawn.cards[0].reversed ? 'Umgekehrt' : 'Aufrecht',
          'dialog matches drawn orientation'
        );
        assert.equal(drawn.active.includes(drawn.cards[0].reversed ? 'umgekehrt' : 'aufrecht'), true);
        assert.equal(drawn.title, drawn.cards[0].name + (drawn.cards[0].reversed ? ' (umgekehrt)' : ''));
        for (const card of drawn.cards) {
          assert.match(card.image, /\/300\/\d{2}\.jpg$/, 'drawn card shows its own asset');
          assert.ok(card.name.length > 2);
        }
        if (round === 0) assert.ok(drawn.history >= 1, 'draw is recorded in the history');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.getElementById('cardModal').classList.contains('open'));
        if (round < 3) {
          await page.locator('#drawThreeBtn').click();
          await page.waitForFunction(() => document.querySelectorAll('#drawnCards .is-shuffling').length === 3);
        }
      }

      // Single card draw
      await page.locator('#drawCardBtn').click();
      await page.waitForFunction(() => document.querySelectorAll('#drawnCards > *').length === 1);
      await page.waitForFunction(() => document.querySelectorAll('#drawnCards .is-shuffling').length === 0, null, {
        timeout: 8000,
      });
      await page.locator('#cardModal.open').waitFor({ state: 'visible', timeout: 8000 });
      assert.equal(await page.locator('#drawnCards > *').count(), 1);
    } finally {
      await browser.close();
    }
  });
});

test('keyboard and reduced motion: Enter opens, Escape restores focus, draw settles instantly', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(base + '#tarot', { waitUntil: 'load' });
      await page.locator('#tarot.active').waitFor({ state: 'visible' });

      const card = page.locator('#tarotGrid .tarot-card').nth(17);
      await card.focus();
      assert.equal(await card.evaluate((node) => node === document.activeElement), true, 'card is focusable');
      await page.keyboard.press('Enter');
      await page.locator('#cardModal.open').waitFor({ state: 'visible' });
      const focusInside = await page.evaluate(
        () => document.getElementById('cardModal').contains(document.activeElement) === true
      );
      assert.equal(focusInside, true, 'focus moves into the dialog');
      assert.equal(await page.locator('#cardModalTitle').textContent(), 'Der Stern');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('cardModal').classList.contains('open'));
      const restored = await page.evaluate(() => {
        const active = document.activeElement;
        return active && active.classList.contains('tarot-card') && active.dataset.id === '17';
      });
      assert.equal(restored, true, 'focus returns to the card that opened the dialog');

      // With reduced motion the shuffle phase is skipped instead of waiting 1.2 s.
      const started = Date.now();
      await page.locator('#drawCardBtn').click();
      await page.locator('#cardModal.open').waitFor({ state: 'visible', timeout: 3000 });
      assert.ok(Date.now() - started < 1200, 'reduced motion draw opens immediately');
      await page.keyboard.press('Escape');
      await context.close();
    } finally {
      await browser.close();
    }
  });
});

test('stored deck id: unknown value falls back to v1 and old history keeps working', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
      await context.addInitScript(() => {
        localStorage.setItem('esoterik_tarot_deck', 'nachtatelier-v2-preview');
        localStorage.setItem(
          'esoterik_tarot_history',
          JSON.stringify([
            // A record written by the old generator: wrong display name, stable id.
            { id: 23, name: '1 der Stäbe', reversed: false, timestamp: '2026-10-31T20:00:00.000Z' },
          ])
        );
      });
      const page = await context.newPage();
      await page.goto(base + '#tarot', { waitUntil: 'load' });
      await page.locator('#tarot.active').waitFor({ state: 'visible' });
      const state = await page.evaluate(() => ({
        stored: localStorage.getItem('esoterik_tarot_deck'),
        deckId: window.tarotMod.deck.id,
        cards: document.querySelectorAll('#tarotGrid .tarot-card').length,
        historyName: document.querySelector('#tarotHistoryBox .tarot-history-name').textContent,
        historyCount: document.querySelectorAll('#tarotHistoryBox li').length,
        firstImage: document.querySelector('#tarotGrid img').getAttribute('src'),
      }));
      assert.equal(state.deckId, 'nachtatelier-v1');
      assert.equal(state.stored, 'nachtatelier-v1');
      assert.equal(state.cards, 78);
      assert.equal(state.historyCount, 1);
      assert.equal(state.historyName, '2 der Stäbe', 'stored history keeps its id and shows the corrected name');
      assert.match(state.firstImage, /nachtatelier-v1\/300\/00\.jpg$/);
      await context.close();
    } finally {
      await browser.close();
    }
  });
});

test('payload: first view loads no 1200 px master, zoom does', async () => {
  await withServer(async (base) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(base + '#tarot', { waitUntil: 'load' });
      await page.locator('#tarot.active').waitFor({ state: 'visible' });
      await page.waitForTimeout(1500);
      const usage = () =>
        page.evaluate(() => {
          const entries = performance
            .getEntriesByType('resource')
            .filter((entry) => /\/assets\/tarot\/.+\.jpg/.test(entry.name));
          const byStep = {};
          for (const entry of entries) {
            const key = (entry.name.match(/\/nachtatelier-v1\/(\d+)\//) || [null, 'back'])[1];
            const bucket = byStep[key] || (byStep[key] = { files: 0, bytes: 0 });
            bucket.files += 1;
            bucket.bytes += entry.encodedBodySize || entry.transferSize || 0;
          }
          return { total: entries.length, byStep };
        });
      const initial = await usage();
      assert.equal(initial.byStep['1200'], undefined, 'no 1200 px master in the first view');
      assert.ok(initial.byStep['300'].files > 0, 'thumbnails are requested');
      assert.ok(initial.byStep['300'].bytes < 1_200_000, `thumbnail payload ${initial.byStep['300'].bytes} bytes`);

      await page.locator('#tarotGrid .tarot-card').first().click();
      await page.locator('#cardModal.open').waitFor({ state: 'visible' });
      await page.waitForTimeout(400);
      const withDialog = await usage();
      assert.equal(withDialog.byStep['1200'], undefined, 'the 600 px detail image is enough for the dialog');

      await page.locator('.tarot-detail-zoom').click();
      await page.waitForTimeout(800);
      const zoomed = await page.evaluate(() => {
        const image = document.querySelector('.tarot-detail-image');
        return {
          src: image.getAttribute('src'),
          natural: [image.naturalWidth, image.naturalHeight],
          displayed: [
            Math.round(image.getBoundingClientRect().width),
            Math.round(image.getBoundingClientRect().height),
          ],
          figure: Math.round(document.querySelector('.tarot-detail-figure').getBoundingClientRect().width),
        };
      });
      assert.match(zoomed.src, /\/1200\/00\.jpg$/);
      assert.deepEqual(zoomed.natural, [1200, 2000]);
      assert.ok(zoomed.displayed[0] >= 360, `zoomed image is displayed larger (${zoomed.displayed[0]} px)`);
      assert.ok(zoomed.displayed[0] <= 1200 && zoomed.displayed[1] <= 900, 'zoom stays inside the viewport');
    } finally {
      await browser.close();
    }
  });
});
