// @ts-check
// Plays To the Wedding to the finale (ceremonies complete in place, then See the whole deck), by pointer and by keyboard, at desktop and phone sizes
// (see the projects in playwright.config.js). Any console error, page error or failed
// request fails the test. Also checks that public/cards.json is well formed.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ---- Fail on console errors, uncaught exceptions and failed requests ----
let problems = [];
test.beforeEach(async ({ page }) => {
  problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', r => problems.push(`request failed: ${r.url()}`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
});
test.afterEach(() => {
  expect(problems, 'console errors, page errors or failed requests').toEqual([]);
});

/** The game exposes its state for tests; we only read it to know which royal goes where. */
const spreadIds = page => page.evaluate(() => window.__game.state.spread.map(c => c.id));
const isRoyal = id => id[0] === 'K' || id[0] === 'Q';

async function expectFinale(page) {
  await expect(page.locator('#finale')).toBeVisible();
  await expect(page.locator('#finTitle')).toHaveText('The wedding is complete.');
  await expect(page.locator('#couples .couple')).toHaveCount(4);
  await expect(page.locator('#fans .mini')).toHaveCount(44);
}

test('plays a full game to the finale by pointer', async ({ page, isMobile }) => {
  const press = loc => (isMobile ? loc.tap() : loc.click());
  await page.goto('/');
  await press(page.locator('#startBtn'));
  await expect(page.locator('#play')).toBeVisible();

  let placed = 0;
  for (let turn = 0; placed < 8; turn++) {
    expect(turn, 'game should finish within 60 turns').toBeLessThan(60);
    const royal = (await spreadIds(page)).find(isRoyal);
    if (!royal) { await press(page.locator('#dealBtn')); continue; }

    const rank = royal[0], suit = royal.slice(-1);
    await press(page.locator(`#spread .card[data-id="${royal}"]`));
    await expect(page.locator(`#niches .slot.glow[data-rank="${rank}"]`).first()).toBeVisible();
    await press(page.locator(`#niches .slot[data-suit="${suit}"][data-rank="${rank}"]`));
    await expect(page.locator(`#niches .slot.filled[data-suit="${suit}"][data-rank="${rank}"]`)).toBeVisible();
    placed++;

    if (await page.evaluate(s => window.__game.state.placed[s].K && window.__game.state.placed[s].Q, suit)) {
      // Ceremony complete plays in place: the niche locks and celebrates, and play stays on screen.
      const niche = page.locator(`#niches .niche[data-suit="${suit}"]`);
      await expect(niche).toHaveClass(/locked/);
      await expect(niche).toHaveClass(/celebrate/);
      await expect(niche.locator('.cheer')).toHaveText(suit === 'H' ? 'Just Married!' : 'Ceremony complete');
      await expect(page.locator('#play')).toBeVisible();
    }
  }
  await expect(page.locator('#dealBtn')).toBeHidden();
  await press(page.locator('#finaleBtn'));
  await expectFinale(page);
});

test('plays a full game to the finale by keyboard', async ({ page }) => {
  const focused = () => page.evaluate(() => {
    const a = document.activeElement;
    return { id: a.id, cls: a.className, data: { ...a.dataset }, pressed: a.getAttribute('aria-pressed') };
  });
  const tabUntil = async (want, max = 40) => {
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab');
      const f = await focused();
      if (want(f)) return f;
    }
    throw new Error('Tab never reached the target');
  };

  await page.goto('/');
  await tabUntil(f => f.id === 'startBtn');
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();

  let placed = 0;
  for (let turn = 0; placed < 8; turn++) {
    expect(turn, 'game should finish within 60 turns').toBeLessThan(60);
    if (!(await spreadIds(page)).some(isRoyal)) {
      await tabUntil(f => f.id === 'dealBtn');
      await page.keyboard.press('Enter');
      continue;
    }
    // Tab to a royal, Enter to pick it up
    const card = await tabUntil(f => f.cls.includes('card') && f.cls.includes('royal'));
    const id = card.data.id, rank = id[0], suit = id.slice(-1);
    await page.keyboard.press('Enter');
    expect((await focused()).pressed).toBe('true');

    if (placed === 0) {
      // Escape from a slot puts the card back and returns focus to it
      await page.keyboard.press('Tab');
      expect((await focused()).cls).toContain('slot');
      await page.keyboard.press('Escape');
      expect(await focused()).toMatchObject({ data: { id }, pressed: 'false' });
      await page.keyboard.press('Enter');
    }

    // Tab to its slot, Enter to place
    await tabUntil(f => f.cls.includes('slot') && f.data.suit === suit && f.data.rank === rank, 10);
    await page.keyboard.press('Enter');
    placed++;
    await expect(page.locator('#announce')).toContainText('placed');
    // Focus lands back in the game, never lost on the page body
    await expect.poll(async () => { const f = await focused(); return f.cls.includes('card') || f.id === 'dealBtn' || f.id === 'finaleBtn'; }).toBe(true);
  }
  // After the fourth pair, focus is on See the whole deck
  await expect(page.locator('#finaleBtn')).toBeFocused();
  await page.keyboard.press('Enter');
  await expectFinale(page);
});

test('every card and slot has a screen-reader name', async ({ page }) => {
  await page.goto('/');
  await page.locator('#startBtn').click();
  await expect(page.locator('#spread .card')).toHaveCount(6);
  for (const el of await page.locator('#spread .card, #niches .slot').all()) {
    await expect(el).toHaveAttribute('aria-label', /\S/);
  }
  await page.locator('#play [data-go="deck"]').click();
  await expect(page.locator('#finale .mini')).toHaveCount(52);
  for (const el of await page.locator('#finale .mini').all()) {
    await expect(el).toHaveAttribute('aria-label', /\S/);
  }
});

test('cards.json lists all 52 cards and every image exists', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'file check runs once');
  const dir = path.join(__dirname, '..', 'public');
  let data;
  expect(() => { data = JSON.parse(fs.readFileSync(path.join(dir, 'cards.json'), 'utf8')); }, 'cards.json is valid JSON').not.toThrow();

  const expected = [];
  for (const s of 'DCHS') for (const r of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']) expected.push(r + s);
  const ids = data.cards.map(c => c.card);
  expect(ids.slice().sort(), 'one entry for every card, no duplicates').toEqual(expected.slice().sort());

  for (const c of data.cards) {
    for (const f of ['label', 'meaning', 'image', 'alt']) {
      expect(typeof c[f], `${c.card}.${f} is text ("" when blank)`).toBe('string');
    }
    if (c.image) {
      expect(fs.existsSync(path.join(dir, 'cards', c.image)), `${c.card}: image "${c.image}" exists in public/cards/`).toBe(true);
    }
  }
});
