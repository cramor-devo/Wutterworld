import { expect, type Page, test } from '@playwright/test';

interface Hook {
  scene: string;
  level?: string;
  player?: { x: number; y: number };
  hearts?: number;
  touch?: boolean;
  difficulty?: string;
  enemies?: number;
  viewWidth?: number;
  wind?: string;
  renderer?: string;
  storyPanel?: { x: number; y: number; w: number; h: number };
}

const hook = (page: Page) => page.evaluate(() => (window as unknown as { __wutter?: Hook }).__wutter);

async function waitForScene(page: Page, scene: string, timeout = 15_000) {
  await expect.poll(async () => (await hook(page))?.scene, { timeout }).toBe(scene);
}

/** Taps (mobile) or clicks (desktop) the middle of the game canvas. */
async function tapCanvas(page: Page, isMobile: boolean) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('canvas not found');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (isMobile) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/** Holds the right arrow until Wutter has moved at least 20 px; polling keeps slow CI runners from flaking. */
async function expectWalksRight(page: Page) {
  const startX = (await hook(page))?.player?.x ?? 0;
  await page.keyboard.down('ArrowRight');
  try {
    await expect.poll(async () => (await hook(page))?.player?.x ?? 0, { timeout: 5_000 }).toBeGreaterThan(startX + 20);
  } finally {
    await page.keyboard.up('ArrowRight');
  }
}

test('boots, plays the intro story and starts the reef tutorial', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('./');
  await waitForScene(page, 'Title');
  // Devoteam AI Augmented badge is shown and actually loaded on the title screen.
  const logo = page.locator('img.brand-logo');
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(128);
  await tapCanvas(page, isMobile);
  await waitForScene(page, 'Story');
  await expect(logo).toHaveCount(0);

  // Advance the intro panels until the first level starts.
  await expect
    .poll(
      async () => {
        await tapCanvas(page, isMobile);
        await page.waitForTimeout(150);
        await tapCanvas(page, isMobile);
        return (await hook(page))?.level;
      },
      { timeout: 30_000, intervals: [300] },
    )
    .toBe('reef-tutorial');

  await waitForScene(page, 'Level');
  const state = await hook(page);
  expect(state?.hearts).toBe(5);
  expect(state?.difficulty).toBe('normal');
  expect(state?.touch).toBe(isMobile);

  if (!isMobile) {
    await page.waitForTimeout(600);
    await expectWalksRight(page);
  }

  expect(errors).toEqual([]);
});

test('level shortcut loads Coral Gardens directly', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?level=coral-gardens');
  await waitForScene(page, 'Level');
  expect((await hook(page))?.level).toBe('coral-gardens');
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

test('difficulty shortcut: hard adds enemies, easy gives 10 hearts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?level=coral-gardens&difficulty=normal');
  await waitForScene(page, 'Level');
  const normal = await hook(page);
  expect(normal?.difficulty).toBe('normal');

  await page.goto('./?level=coral-gardens&difficulty=hard');
  await waitForScene(page, 'Level');
  const hard = await hook(page);
  expect(hard?.difficulty).toBe('hard');
  expect(hard?.enemies ?? 0).toBeGreaterThan(normal?.enemies ?? 0);

  await page.goto('./?level=coral-gardens&difficulty=easy');
  await waitForScene(page, 'Level');
  expect((await hook(page))?.hearts).toBe(10);
  expect(errors).toEqual([]);
});

test('level shortcut loads Beach Escape and Wutter can walk (issue #7)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?level=beach');
  await waitForScene(page, 'Level');
  expect((await hook(page))?.level).toBe('beach');
  if (!isMobile) {
    await page.waitForTimeout(600);
    await expectWalksRight(page);
  }
  expect(errors).toEqual([]);
});

test('level shortcut loads the Night Market and Wutter can walk (issue #14)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?level=night-market');
  await waitForScene(page, 'Level');
  expect((await hook(page))?.level).toBe('night-market');
  if (!isMobile) {
    await page.waitForTimeout(600);
    await expectWalksRight(page);
  }
  expect(errors).toEqual([]);
});

test('level shortcut loads Jiufen and Wutter can walk up the street (issue #15)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?level=jiufen');
  await waitForScene(page, 'Level');
  expect((await hook(page))?.level).toBe('jiufen');
  if (!isMobile) {
    await page.waitForTimeout(600);
    await expectWalksRight(page);
  }
  // Let the crowd and the masked spirit stroll for a moment.
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test('level shortcut loads the Typhoon, Wutter can walk in the calm and the wind warns before a gust (issue #16)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?level=typhoon');
  await waitForScene(page, 'Level');
  const start = await hook(page);
  expect(start?.level).toBe('typhoon');
  expect(start?.wind).toBe('calm');
  if (!isMobile) {
    await page.waitForTimeout(400);
    await expectWalksRight(page);
  }
  // The first calm is about 4.5 s; then the warning comes and a gust follows.
  await expect.poll(async () => (await hook(page))?.wind, { timeout: 10_000 }).toBe('warning');
  await expect.poll(async () => (await hook(page))?.wind, { timeout: 5_000 }).toBe('gust');
  expect(errors).toEqual([]);
});

test('level shortcut loads the Midnight Zone and Wutter can swim through the deep sea (issue #17)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?level=abyss');
  await waitForScene(page, 'Level');
  const start = await hook(page);
  expect(start?.level).toBe('abyss');
  if (!isMobile) {
    await page.waitForTimeout(400);
    await expectWalksRight(page);
  }
  // Let the squids and anglerfish run their AI for a moment: no errors.
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('level shortcut loads the Festive Home Reef and Wutter can swim to the party (issue #18)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?level=festive-reef');
  await waitForScene(page, 'Level');
  const start = await hook(page);
  expect(start?.level).toBe('festive-reef');
  // Safe and easy: nobody to fight, not even on the default difficulty.
  expect(start?.enemies).toBe(0);
  if (!isMobile) {
    await page.waitForTimeout(400);
    await expectWalksRight(page);
  }
  // Let the party guests dance and hop for a moment: no errors.
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('leaving a scene with an empty gamepad slot still starts the next scene (issue #31)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Like Firefox desktop can: a pad at index 1 and nothing at index 0.
  await page.addInitScript(() => {
    const pad = { id: 'test pad', index: 1, connected: true, timestamp: 0, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [null, pad, null, null], configurable: true });
  });
  await page.goto('./');
  await waitForScene(page, 'Title');
  await tapCanvas(page, isMobile);
  await waitForScene(page, 'Story');
  expect(errors).toEqual([]);
});

/** View width the game should pick for a window size (mirrors viewWidthFor in src/config.ts). */
const expectedViewWidth = (w: number, h: number) => Math.min(576, Math.max(256, Math.round((256 * (w / h)) / 2) * 2));

test('renders with WebGL and the story panel art stays inside its frame (issue #39)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await waitForScene(page, 'Title');
  expect((await hook(page))?.renderer).toBe('WEBGL');
  await tapCanvas(page, isMobile);
  await waitForScene(page, 'Story');
  // The first panel's reef rocks reach below the panel; only the Mask filter keeps them out of the gap under the frame.
  await page.waitForTimeout(800);
  const h = await hook(page);
  if (!h?.storyPanel || !h.viewWidth) throw new Error('story panel not reported');
  const shot = (await page.locator('canvas').screenshot()).toString('base64');
  const odd = await page.evaluate(
    async ({ png, panel, viewWidth }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      if (!g) throw new Error('no 2d context');
      g.drawImage(img, 0, 0);
      const s = img.width / viewWidth;
      const px = (x: number, y: number) => g.getImageData(Math.floor((x + 0.5) * s), Math.floor((y + 0.5) * s), 1, 1).data;
      // Rows between the gold frame (3 px) and the story text (12 px below the panel) must be plain background.
      const bad: string[] = [];
      for (let y = panel.y + panel.h + 4; y < panel.y + panel.h + 10; y++) {
        for (let x = panel.x; x < panel.x + panel.w; x++) {
          const [r, gr, b] = px(x, y);
          if (Math.abs(r - 0x0b) + Math.abs(gr - 0x10) + Math.abs(b - 0x20) > 24) bad.push(`${x},${y}`);
        }
      }
      return bad;
    },
    { png: shot, panel: h.storyPanel, viewWidth: h.viewWidth },
  );
  expect(odd).toEqual([]);
  expect(errors).toEqual([]);
});

test('full-screen button shows on phones only, and tapping it does not start the game', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await waitForScene(page, 'Title');
  const toggle = page.locator('#fs-toggle');
  if (!isMobile) {
    await expect(toggle).toBeHidden();
  } else {
    await expect(toggle).toBeVisible();
    await toggle.tap();
    await page.waitForTimeout(500);
    expect((await hook(page))?.scene).toBe('Title');
  }
  // Only iPhones without the Fullscreen API get the Add to Home Screen hint.
  await expect(page.locator('#install-hint')).toBeHidden();
  expect(errors).toEqual([]);
});

test('rotating re-fits the view without a reload, on the title and during a level', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const viewWidth = async () => (await hook(page))?.viewWidth;
  const size = page.viewportSize();
  if (!size) throw new Error('no viewport');
  const turned = { width: size.height, height: size.width };

  await page.goto('./');
  await waitForScene(page, 'Title');
  await expect.poll(viewWidth).toBe(expectedViewWidth(size.width, size.height));
  await page.setViewportSize(turned);
  await expect.poll(viewWidth).toBe(expectedViewWidth(turned.width, turned.height));
  await waitForScene(page, 'Title');
  await expect(page.locator('img.brand-logo')).toHaveCount(1);

  await page.goto('./?level=coral-gardens');
  await waitForScene(page, 'Level');
  await expect.poll(viewWidth).toBe(expectedViewWidth(turned.width, turned.height));
  await page.setViewportSize(size);
  await expect.poll(viewWidth).toBe(expectedViewWidth(size.width, size.height));
  await page.waitForTimeout(500);
  expect((await hook(page))?.level).toBe('coral-gardens');
  expect(errors).toEqual([]);
});

test('the whole story connects: title, all eight levels, the finale and back to the title (issue #37)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'one browser is enough to walk the story chain');
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const order = ['reef-tutorial', 'coral-gardens', 'beach', 'night-market', 'jiufen', 'typhoon', 'abyss', 'festive-reef'];
  const played: string[] = [];

  await page.goto('./');
  await waitForScene(page, 'Title');
  await tapCanvas(page, false);
  await waitForScene(page, 'Story');
  for (;;) {
    const h = await hook(page);
    if (h?.scene === 'Title') break;
    if (h?.scene === 'Level' && h.level && played.at(-1) !== h.level) {
      played.push(h.level);
      await page.evaluate(() => (window as unknown as { __wutter: { finishLevel: () => void } }).__wutter.finishLevel());
      // Before the fix, leaving the level crashed and left a black screen.
      const current = h.level;
      await expect
        .poll(async () => {
          const next = await hook(page);
          return next?.scene === 'Story' || (next?.scene === 'Level' && next.level !== current);
        }, { timeout: 15_000 })
        .toBe(true);
    } else if (h?.scene === 'Story') {
      await tapCanvas(page, false);
      await page.waitForTimeout(250);
    } else {
      await page.waitForTimeout(250);
    }
    expect(errors).toEqual([]);
  }
  expect(played).toEqual(order);
  expect(errors).toEqual([]);
});