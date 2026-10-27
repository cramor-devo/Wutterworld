import type Phaser from 'phaser';
import { bandedGradient, canvasTexture, mulberry32, px } from './canvas';
import { glow, paperLantern } from './market';

/**
 * Jiufen's backdrop at dusk (blue hour): a sky fading from indigo to a last orange glow over the Pacific (base),
 * Keelung Mountain and the hillside town with lit windows, opening onto the sea (far), and Shuqi Road's teahouses
 * hung with red lanterns (mid). Every layer tiles seamlessly sideways and stays darker than the play layer.
 */
export function jiufenBackdropTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'bg-dusk', 256, 224, 1, duskSky);
  canvasTexture(scene, 'bg-jiufen-far', FAR_W, FAR_H, 1, hillsideFar);
  canvasTexture(scene, 'bg-jiufen-mid', MID_W, MID_H, 1, teahousesMid);
}

const FAR_W = 512;
/** Keep in sync with the jiufen row in settings.ts. */
const FAR_H = 200;
const MID_W = 1024;
const MID_H = 150;
/** The sea's horizon in the base picture, and the same line in the far layer (which starts 24 px lower). */
const HORIZON = 130;
const FAR_HORIZON = HORIZON - (224 - FAR_H);

// ---------- base: blue-hour sky over the sea ----------

function duskSky(ctx: CanvasRenderingContext2D): void {
  bandedGradient(ctx, 256, HORIZON, ['#141a44', '#1c2258', '#2a2a68', '#3e3270', '#5a3a72', '#84466e', '#b45a62', '#e08a5a']);
  const rnd = mulberry32(151);
  for (let i = 0; i < 30; i++) px(ctx, rnd() < 0.2 ? '#fff6c9' : '#c9c4ff', Math.floor(rnd() * 256), Math.floor(rnd() * 50));
  // The sea: dark and calm, with the last light glinting on it.
  px(ctx, '#2a3a6a', 0, HORIZON, 256, 94);
  px(ctx, '#22305a', 0, HORIZON + 20, 256, 30);
  px(ctx, '#1a264a', 0, HORIZON + 50, 256, 44);
  px(ctx, '#f2a86a', 0, HORIZON, 256, 1);
  for (let i = 0; i < 24; i++) px(ctx, '#e08a5a', Math.floor(rnd() * 256), HORIZON + 3 + Math.floor(rnd() * 60), 2 + Math.floor(rnd() * 5), 1);
  // Keelung Islet: a little hump out at sea, with its lighthouse lit.
  for (let x = 0; x < 30; x++) {
    const h = Math.round(9 - Math.abs(x - 12) * 0.6);
    if (h > 0) px(ctx, '#2a2650', 180 + x, HORIZON - h, 1, h);
  }
  px(ctx, '#fff1b0', 190, HORIZON - 12, 1, 2);
  // Squid boats' lights far out on the water.
  for (const [x, y] of [[40, 4], [96, 8], [228, 5]]) px(ctx, '#fff6c9', x, HORIZON + y, 1, 1);
}

// ---------- far: Keelung Mountain and the hillside town ----------

/** Shortest sideways distance on a texture that wraps around. */
function wrapDist(a: number, b: number, w: number): number {
  const d = Math.abs(a - b) % w;
  return Math.min(d, w - d);
}

/** Top of the land at column `x`: Keelung Mountain's cone and a lower shoulder of hill, with the sea between them. */
function landTop(x: number): number {
  const mountain = 18 + wrapDist(x, 110, FAR_W) * 0.75;
  const shoulder = 92 + wrapDist(x, 400, FAR_W) * 0.6;
  return Math.round(Math.min(mountain, shoulder));
}

function hillsideFar(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(173);
  for (let x = 0; x < FAR_W; x++) {
    const top = landTop(x);
    if (top >= FAR_HORIZON) continue;
    px(ctx, '#2a3058', x, top, 1, 2);
    px(ctx, '#1e2444', x, top + 2, 1, FAR_H - top - 2);
  }
  // The town clings to the slopes: little houses with lit windows, densest lower down.
  for (let x = 2; x < FAR_W - 4; x += 5) {
    const top = landTop(x);
    if (top >= FAR_HORIZON - 4) continue;
    for (let y = Math.max(top + 10, 40); y < FAR_H - 4; y += 7) {
      if (rnd() > 0.45) continue;
      px(ctx, '#262c50', x - 1, y - 2, 6, 2);
      px(ctx, rnd() < 0.75 ? '#ffcf7a' : '#ff8a5c', x + 1, y, 2, 2);
    }
  }
  // Red lanterns along the town's lanes.
  for (let x = 6; x < FAR_W; x += 23) {
    const top = landTop(x);
    if (top < FAR_HORIZON - 20) px(ctx, '#e63946', x, top + 18 + (x % 3) * 9, 1, 1);
  }
}

// ---------- mid: Shuqi Road's teahouses ----------

function teahousesMid(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(191);
  let x = 0;
  while (x < MID_W) {
    const w = Math.min(MID_W - x, 64 + Math.floor(rnd() * 48));
    teahouse(ctx, x, w, 18 + Math.floor(rnd() * 34), rnd);
    x += w;
  }
}

/** A wooden teahouse with a grey-tiled roof, glowing windows, a balcony and a row of red lanterns under the eaves. */
function teahouse(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, rnd: () => number): void {
  const wall = rnd() < 0.5 ? '#3a2a2e' : '#2e2a3a';
  px(ctx, wall, x + 2, top + 8, w - 4, MID_H - top - 8);
  // Roof: dark tiles with upturned eaves.
  px(ctx, '#2a2c3e', x, top, w, 8);
  px(ctx, '#4a4c62', x, top, w, 1);
  px(ctx, '#1a1a28', x - 1, top + 7, 3, 2);
  px(ctx, '#1a1a28', x + w - 2, top + 7, 3, 2);
  for (let tx = x + 2; tx < x + w - 2; tx += 4) px(ctx, '#202232', tx, top + 2, 1, 5);
  // Lanterns under the eaves, glowing warm against the dusk.
  for (let lx = x + 6; lx < x + w - 8; lx += 12) {
    glow(ctx, lx + 3, top + 14, 7, '#ff7a4a');
    paperLantern(ctx, lx, top + 8, 6);
  }
  // Storeys of windows with wooden lattices; a balcony on the upper floor.
  for (let y = top + 22; y < MID_H - 20; y += 26) {
    for (let wx = x + 8; wx < x + w - 14; wx += 18) {
      const lit = rnd() < 0.8;
      px(ctx, lit ? '#e8a050' : '#3a3448', wx, y, 10, 10);
      px(ctx, wall, wx + 4, y, 1, 10);
      px(ctx, wall, wx, y + 4, 10, 1);
    }
    px(ctx, '#5a3a2a', x + 4, y + 12, w - 8, 2);
    for (let bx = x + 5; bx < x + w - 5; bx += 3) px(ctx, '#4a2e22', bx, y + 14, 1, 4);
  }
  // A narrow alley gap between houses.
  px(ctx, '#151220', x + w - 2, top + 8, 2, MID_H - top - 8);
}
