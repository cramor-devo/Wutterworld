import type Phaser from 'phaser';
import { bandedGradient, canvasTexture, mulberry32, px } from './canvas';
import { glow } from './market';

/**
 * The Midnight Zone: black-blue water with drifting marine snow and far-off sparks (base), a dim seamount ridge with
 * schools of lanternfish (far) and the deep-sea floor with glowing jellyfish, tube worms and a sunken wreck (mid).
 * Only living things glow down here; every layer stays darker than the play layer, which is never dimmed.
 */
export function abyssTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'bg-abyss', 256, 224, 1, deepWater);
  canvasTexture(scene, 'bg-abyss-far', FAR_W, FAR_H, 1, ridgeFar);
  canvasTexture(scene, 'bg-abyss-mid', MID_W, MID_H, 1, floorMid);
}

const FAR_W = 512;
/** Keep in sync with the abyss row in settings.ts. */
const FAR_H = 160;
const MID_W = 1024;
const MID_H = 110;

const SPARKS = ['#5affd0', '#7ad8ff', '#c89aff', '#ff8ac8'];

// ---------- base: black-blue water, marine snow and tiny sparks ----------

function deepWater(ctx: CanvasRenderingContext2D): void {
  bandedGradient(ctx, 256, 224, ['#0a1630', '#081228', '#060f22', '#050c1c', '#040a18', '#030814']);
  const rnd = mulberry32(601);
  // Marine snow: pale flakes sinking through the dark.
  for (let i = 0; i < 70; i++) px(ctx, rnd() < 0.5 ? '#2a3a5a' : '#3a4c70', Math.floor(rnd() * 256), Math.floor(rnd() * 224));
  // Far-off bioluminescent sparks.
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rnd() * 254);
    const y = Math.floor(rnd() * 220);
    const c = SPARKS[Math.floor(rnd() * SPARKS.length)];
    ctx.globalAlpha = 0.5;
    px(ctx, c, x, y, 1, 1);
    ctx.globalAlpha = 1;
  }
}

// ---------- far: a seamount ridge with schools of lanternfish ----------

function wrapDist(a: number, b: number, w: number): number {
  const d = Math.abs(a - b) % w;
  return Math.min(d, w - d);
}

function ridgeTop(x: number): number {
  const peak = 50 + wrapDist(x, 120, FAR_W) * 0.45;
  const second = 80 + wrapDist(x, 380, FAR_W) * 0.4;
  return Math.round(Math.min(peak, second, 120));
}

function ridgeFar(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(613);
  for (let x = 0; x < FAR_W; x++) {
    const top = ridgeTop(x);
    px(ctx, '#121c34', x, top, 1, 2);
    px(ctx, '#0c1428', x, top + 2, 1, FAR_H - top - 2);
  }
  // Schools of lanternfish: little lines of blue-green lights drifting together.
  for (let s = 0; s < 7; s++) {
    const sx = Math.floor(rnd() * FAR_W);
    const sy = 15 + Math.floor(rnd() * 70);
    for (let f = 0; f < 6; f++) {
      const x = (sx + f * 7 + Math.floor(rnd() * 3)) % FAR_W;
      const y = sy + Math.round(Math.sin(f) * 4);
      px(ctx, '#1a2a44', x, y, 3, 1);
      px(ctx, '#7ad8ff', x, y, 1, 1);
    }
  }
  // A few lone sparks along the ridge.
  for (let x = 13; x < FAR_W; x += 29) px(ctx, SPARKS[x % SPARKS.length], x, ridgeTop(x) + 12 + (x % 5) * 6, 1, 1);
}

// ---------- mid: the deep-sea floor, jellyfish, tube worms and a wreck ----------

function floorMid(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(631);
  // Glowing jellyfish drifting above the floor.
  for (let x = 60; x < MID_W - 30; x += 150 + Math.floor(rnd() * 70)) jellyfish(ctx, x, 14 + Math.floor(rnd() * 26), rnd() < 0.5 ? '#c89aff' : '#7ad8ff');
  // Rolling dark seabed.
  for (let x = 0; x < MID_W; x++) {
    const top = 70 + Math.round(Math.abs(Math.sin(x / 31)) * 10 + Math.abs(Math.sin(x / 7.7)) * 3);
    px(ctx, '#18223a', x, top, 1, 2);
    px(ctx, '#101a2e', x, top + 2, 1, MID_H - top - 2);
  }
  wreck(ctx, 520);
  // Tube worms by the vents, their red plumes glowing faintly.
  for (let x = 30; x < MID_W - 10; x += 90 + Math.floor(rnd() * 80)) {
    if (x > 480 && x < 640) continue;
    for (let t = 0; t < 4; t++) {
      const tx = x + t * 3;
      const h = 6 + ((t * 5 + x) % 7);
      px(ctx, '#3a4258', tx, 76 - h, 2, h);
      px(ctx, '#ff6a8a', tx, 75 - h, 2, 2);
    }
  }
  // Glowing specks on the floor.
  for (let i = 0; i < 40; i++) px(ctx, SPARKS[Math.floor(rnd() * SPARKS.length)], Math.floor(rnd() * MID_W), 80 + Math.floor(rnd() * 25));
}

function jellyfish(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  glow(ctx, x + 5, y + 4, 12, color);
  px(ctx, color, x + 2, y, 6, 1);
  px(ctx, color, x + 1, y + 1, 8, 3);
  px(ctx, '#ffffff', x + 3, y + 1, 2, 1);
  for (let t = 0; t < 4; t++) for (let l = 0; l < 8; l++) px(ctx, color, x + 1 + t * 2 + (l % 4 === 3 ? 1 : 0), y + 4 + l, 1, 1);
}

/** The broken bow of an old wooden ship, half-sunk into the silt. */
function wreck(ctx: CanvasRenderingContext2D, x: number): void {
  for (let i = 0; i < 70; i++) {
    const top = 52 + Math.round(Math.abs(i - 30) * 0.4);
    px(ctx, '#1e2236', x + i, top, 1, 30);
  }
  px(ctx, '#262c44', x, 56, 70, 1);
  // The broken mast leaning to one side.
  for (let y = 0; y < 34; y++) px(ctx, '#1e2236', x + 34 + Math.round(y * 0.35), 52 - y, 2, 1);
  // Portholes with a faint glow from something living inside.
  for (const ph of [12, 26, 48]) px(ctx, '#3affb0', x + ph, 64, 2, 2);
}
