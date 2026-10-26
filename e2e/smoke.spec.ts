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
    const startX = (await hook(page))?.player?.x ?? 0;
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1200);
    await page.keyboard.up('ArrowRight');
    const endX = (await hook(page))?.player?.x ?? 0;
    expect(endX).toBeGreaterThan(startX + 20);
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

/** View width the game should pick for a window size (mirrors viewWidthFor in src/config.ts). */
const expectedViewWidth = (w: number, h: number) => Math.min(512, Math.max(256, Math.round((224 * (w / h)) / 2) * 2));

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
    // Keyboard activation of the button must not reach the game either.
    await toggle.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    expect((await hook(page))?.scene).toBe('Title');
    // After leaving full screen with the button, a later game tap must not force it back on.
    if (await page.evaluate(() => !!document.fullscreenElement)) await toggle.tap();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    await page.locator('canvas').tap();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
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
