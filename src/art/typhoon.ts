import type Phaser from 'phaser';
import { bandedGradient, canvasTexture, mulberry32, px } from './canvas';
import { glow } from './market';
import { drawPuddle } from './puddle';

/**
 * The typhoon on the northeast coast: a storm sky over a churning sea (base), dark mountains with Jiufen's lights far
 * away (far), the windswept rocky coast with bent palms (mid), plus the rain, the wind streaks and the windsock that
 * warns of a gust. Every backdrop layer tiles seamlessly sideways and stays darker than the play layer.
 */
export function typhoonTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'bg-storm', 256, 224, 1, stormSky);
  canvasTexture(scene, 'bg-typhoon-far', FAR_W, FAR_H, 1, mountainsFar);
  canvasTexture(scene, 'bg-typhoon-mid', MID_W, MID_H, 1, coastMid);
  // A rain puddle in a hollow of the wet rock; it refills the water tank like seawater.
  canvasTexture(scene, 'puddle-typhoon', 16, 16, 1, (ctx) =>
    drawPuddle(ctx, {
      ground: '#4a5462',
      edge: '#8a98a8',
      rim: '#2a323e',
      water: '#4a7a96',
      deep: '#36607a',
      shine: '#a8c8dc',
      glints: [
        ['#e8f4ff', 4, 3, 3],
        ['#e8f4ff', 10, 5, 2],
      ],
    }),
  );
  canvasTexture(scene, 'rain', RAIN_SIZE, RAIN_SIZE, 1, rain);
  canvasTexture(scene, 'wind-streaks', 128, 64, 1, windStreaks);
  canvasTexture(scene, 'windsock', WINDSOCK_W, WINDSOCK_H, WINDSOCK_FRAMES, windsock);
}

const FAR_W = 512;
/** Keep in sync with the typhoon row in settings.ts. */
const FAR_H = 170;
const MID_W = 1024;
const MID_H = 110;
const HORIZON = 150;
/** Rain tile; it repeats over the whole screen and scrolls down and to the left. */
export const RAIN_SIZE = 64;
/** The windsock under the HUD: frame 0 hangs limp, 1 lifts in the warning, 2-3 flap straight out in a gust. */
export const WINDSOCK_W = 24;
export const WINDSOCK_H = 16;
export const WINDSOCK_FRAMES = 4;

// ---------- base: storm sky over a churning sea ----------

function stormSky(ctx: CanvasRenderingContext2D): void {
  bandedGradient(ctx, 256, HORIZON, ['#1a1e28', '#222834', '#2a3240', '#323c4c', '#3c4858', '#465464']);
  const rnd = mulberry32(503);
  // Heavy, low clouds racing past in dark rolls.
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(rnd() * 256);
    const y = 10 + Math.floor(rnd() * 90);
    const w = 30 + Math.floor(rnd() * 50);
    for (let dx = -w; dx <= w; dx += 256) {
      px(ctx, '#151922', x + dx, y, w, 5);
      px(ctx, '#202632', x + dx + 6, y - 3, w - 12, 3);
      px(ctx, '#3a4454', x + dx + 4, y + 5, w - 8, 1);
    }
  }
  // A far flash of lightning in the clouds.
  px(ctx, '#8a96aa', 60, 40, 30, 2);
  px(ctx, '#c8d0e0', 72, 42, 2, 10);
  px(ctx, '#c8d0e0', 70, 52, 2, 8);
  // The sea, dark and rough, with whitecaps everywhere.
  px(ctx, '#2a3a48', 0, HORIZON, 256, 74);
  px(ctx, '#22303c', 0, HORIZON + 18, 256, 30);
  px(ctx, '#1a2630', 0, HORIZON + 48, 256, 26);
  px(ctx, '#56687a', 0, HORIZON, 256, 1);
  for (let i = 0; i < 60; i++) px(ctx, rnd() < 0.5 ? '#c8d6e2' : '#8aa0b4', Math.floor(rnd() * 254), HORIZON + 3 + Math.floor(rnd() * 66), 2 + Math.floor(rnd() * 5), 1);
  // Grey curtains of rain sweeping across the sky.
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 120; i++) {
    const x = Math.floor(rnd() * 256);
    const y = Math.floor(rnd() * (HORIZON + 40));
    for (let s = 0; s < 6; s++) px(ctx, '#aab8c8', (x - s * 2 + 256) % 256, y + s * 2, 1, 2);
  }
  ctx.globalAlpha = 1;
}

// ---------- far: the mountains, with Jiufen lit up on the slopes ----------

function wrapDist(a: number, b: number, w: number): number {
  const d = Math.abs(a - b) % w;
  return Math.min(d, w - d);
}

/** Top of the mountains at column `x`: two peaks with a saddle; Jiufen sits on the slopes of the taller one. */
function ridgeTop(x: number): number {
  const peak = 40 + wrapDist(x, 150, FAR_W) * 0.55;
  const second = 70 + wrapDist(x, 400, FAR_W) * 0.5;
  return Math.round(Math.min(peak, second, 110));
}

function mountainsFar(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(521);
  for (let x = 0; x < FAR_W; x++) {
    const top = ridgeTop(x);
    px(ctx, '#2e3644', x, top, 1, 2);
    px(ctx, '#222a36', x, top + 2, 1, FAR_H - top - 2);
  }
  // Jiufen: a warm cluster of windows on the mountainside, glowing through the rain.
  for (let x = 110; x < 196; x += 4) {
    const top = ridgeTop(x);
    for (let y = top + 8; y < top + 50; y += 5) {
      if (rnd() > 0.5) continue;
      px(ctx, '#2a2e3c', x - 1, y - 1, 5, 1);
      px(ctx, rnd() < 0.7 ? '#ffcf7a' : '#ff8a5c', x, y, 2, 2);
    }
  }
  glow(ctx, 152, 70, 30, '#ff9a4a');
  // A few lonely lights along the coast road.
  for (let x = 20; x < FAR_W; x += 37) px(ctx, '#ffe2a0', x, ridgeTop(x) + 30 + (x % 4) * 6, 1, 1);
  // Mist rolling over the ridges.
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rnd() * FAR_W);
    px(ctx, '#5a6676', x, 60 + Math.floor(rnd() * 60), 40 + Math.floor(rnd() * 40), 3);
  }
  ctx.globalAlpha = 1;
}

// ---------- mid: the windswept rocky coast ----------

function coastMid(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(547);
  // Spray from the breakers beyond the rocks.
  for (let x = 0; x < MID_W; x += 3) {
    const h = 6 + Math.round(Math.abs(Math.sin(x / 23)) * 14);
    px(ctx, '#7a8ea0', x, 60 - h, 2, h);
    px(ctx, '#a8bccc', x, 60 - h, 2, 1);
  }
  // Jagged rocks of the shore, darker toward the bottom.
  for (let x = 0; x < MID_W; x++) {
    const top = 52 + Math.round(Math.abs(Math.sin(x / 17)) * 10 + Math.abs(Math.sin(x / 5.3)) * 4);
    px(ctx, '#3a4250', x, top, 1, 2);
    px(ctx, '#2a303c', x, top + 2, 1, MID_H - top - 2);
  }
  // Palms bent hard to the left by the wind, their fronds streaming out.
  for (let x = 40; x < MID_W - 40; x += 140 + Math.floor(rnd() * 60)) bentPalm(ctx, x);
  // Grass flattened by the wind.
  for (let x = 2; x < MID_W; x += 4 + Math.floor(rnd() * 4)) px(ctx, '#3a5040', x - 2, 70 + Math.floor(rnd() * 20), 3, 1);
}

function bentPalm(ctx: CanvasRenderingContext2D, x: number): void {
  // The trunk leans over to the left as it rises.
  for (let y = 0; y < 40; y++) px(ctx, '#3a3428', x - Math.round((y * y) / 90), 90 - y, 3, 1);
  const tx = x - Math.round(1600 / 90);
  const ty = 50;
  for (let i = 0; i < 4; i++) {
    for (let l = 0; l < 18; l++) px(ctx, '#2e4a34', tx - l, ty - 2 + i * 2 + Math.round(l * (i - 1.5) * 0.12), 2, 1);
  }
}

// ---------- rain, wind and the windsock ----------

/** Thin slanted streaks: the rain falls down and to the left, with the wind. The tile wraps both ways. */
function rain(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(563);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rnd() * RAIN_SIZE);
    const y = Math.floor(rnd() * RAIN_SIZE);
    const len = 3 + Math.floor(rnd() * 3);
    const color = rnd() < 0.5 ? '#b8c8dc' : '#8aa0ba';
    for (let s = 0; s < len; s++) px(ctx, color, (x - s + RAIN_SIZE) % RAIN_SIZE, (y + s * 2) % RAIN_SIZE, 1, 2);
  }
}

/** Long, faint horizontal dashes that race across the screen when the wind picks up. */
function windStreaks(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(577);
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rnd() * 128);
    const y = 2 + Math.floor(rnd() * 60);
    const w = 10 + Math.floor(rnd() * 22);
    for (let s = 0; s < w; s++) px(ctx, s < 3 ? '#a8b8c8' : '#e8f0f8', (x + s) % 128, y, 1, 1);
  }
}

/** An orange-and-white windsock on a pole; the wind fills it and it points left, toward the land. */
function windsock(ctx: CanvasRenderingContext2D, f: number): void {
  const poleX = WINDSOCK_W - 3;
  px(ctx, '#2a2a30', poleX, 1, 2, WINDSOCK_H - 1);
  px(ctx, '#d8d8e0', poleX, 1, 2, 1);
  const stripes = ['#ff7a2a', '#f4f0e8', '#ff7a2a', '#f4f0e8', '#ff7a2a'];
  if (f === 0) {
    // Limp: hanging straight down from the pole.
    stripes.forEach((c, i) => px(ctx, c, poleX - 4 + (i > 2 ? 1 : 0), 2 + i * 2, 4 - (i > 2 ? 1 : 0), 2));
    return;
  }
  // Lifting (frame 1) or flying out with a ripple (frames 2 and 3).
  const droop = f === 1 ? 1 : 0;
  stripes.forEach((c, i) => {
    const x = poleX - 4 - i * 4;
    const ripple = f === 3 && i % 2 === 1 ? 1 : 0;
    const y = 2 + i * droop + ripple;
    const h = 5 - Math.floor(i / 2);
    px(ctx, c, x, y + Math.floor((5 - h) / 2), 4, h);
  });
}
