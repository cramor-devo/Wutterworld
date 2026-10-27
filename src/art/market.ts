import type Phaser from 'phaser';
import { canvasTexture, mulberry32, px } from './canvas';

/** Taipei night market: murky puddles, lanterns, the gate and the night backdrop. */
export function marketTextures(scene: Phaser.Scene): void {
  // A murky rain puddle in the asphalt, brown-green with an oily shimmer. It still refills the water tank.
  canvasTexture(scene, 'puddle-market', 16, 16, 1, (ctx) => {
    px(ctx, '#2b2d33', 0, 0, 16, 16);
    px(ctx, '#5b6a3c', 1, 5, 14, 11);
    px(ctx, '#46512e', 1, 11, 14, 5);
    px(ctx, '#8f9a6a', 2, 5, 12, 1);
    px(ctx, '#a07ad0', 4, 7, 3, 1);
    px(ctx, '#5fb0b8', 7, 7, 2, 1);
    px(ctx, '#c9c08a', 10, 9, 2, 1);
  });

  // Stinky tofu: fuzzy with springy mould hairs (0), thinning after a bounce (1), bald and glossy-sticky (2).
  canvasTexture(scene, 'tofu', 16, 16, 3, (ctx, f) => stinkyTofu(ctx, f));
  canvasTexture(scene, 'stink', 6, 6, 1, (ctx) => {
    px(ctx, '#b6d98a', 1, 0, 4, 6);
    px(ctx, '#b6d98a', 0, 1, 6, 4);
    px(ctx, '#e4f5c8', 1, 1, 2, 2);
  });

  // Soft pixel halo for lanterns and bulbs (drawn additively and tinted in the scene).
  canvasTexture(scene, 'glow', 32, 32, 1, (ctx) => glow(ctx, 16, 16, 16, '#ffffff'));

  // A red paper lantern hanging from a wooden post.
  canvasTexture(scene, 'market-lantern', 20, 40, 1, (ctx) => {
    px(ctx, '#4a2e1f', 8, 4, 2, 34);
    px(ctx, '#6b4430', 8, 4, 1, 34);
    px(ctx, '#4a2e1f', 8, 4, 10, 2);
    px(ctx, '#7a7f88', 6, 37, 6, 3);
    paperLantern(ctx, 11, 7, 8);
  });
}

/** Concentric pixel rings that fade out: a cheap, pixel-art friendly glow. */
export function glow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.fillStyle = color;
  for (const [f, a] of [[1, 0.12], [0.75, 0.16], [0.5, 0.22], [0.3, 0.3]]) {
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(cx, cy, r * f, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Round red paper lantern with gold caps and a tassel; `x`, `y` is the top-left of its string, `w` its width. */
export function paperLantern(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const h = Math.round(w * 1.2);
  px(ctx, '#2a1a12', x + w / 2 - 0.5, y, 1, 2);
  px(ctx, '#f2c94c', x + 2, y + 2, w - 4, 1);
  px(ctx, '#e63946', x + 1, y + 3, w - 2, h - 2);
  px(ctx, '#e63946', x, y + 5, w, h - 6);
  px(ctx, '#ff8a5c', x + 2, y + 5, Math.max(1, w / 2 - 1), h - 6);
  px(ctx, '#b52a36', x + w - 2, y + 5, 1, h - 6);
  px(ctx, '#f2c94c', x + 2, y + h + 1, w - 4, 1);
  px(ctx, '#f2c94c', x + w / 2 - 0.5, y + h + 2, 1, 3);
}

/** A deep-fried tofu cube on its tile; the body in LevelScene is the 14x13 block from (1,3). */
function stinkyTofu(ctx: CanvasRenderingContext2D, frame: number): void {
  const bald = frame === 2;
  const rand = mulberry32(77);
  // Crispy golden crust; bald tofu is darker and glazed with sticky brine.
  px(ctx, '#3a2212', 1, 3, 14, 13);
  px(ctx, bald ? '#9a5e22' : '#c88a3a', 2, 4, 12, 11);
  px(ctx, bald ? '#b8783a' : '#e2ab5c', 2, 4, 12, 3);
  px(ctx, bald ? '#6e3f16' : '#9a6428', 12, 7, 2, 8);
  for (let i = 0; i < 9; i++) px(ctx, bald ? '#7a4519' : '#a86e2c', 3 + Math.floor(rand() * 9), 8 + Math.floor(rand() * 6));
  if (bald) {
    px(ctx, '#f6dc9a', 3, 5, 4, 1);
    px(ctx, '#f6dc9a', 4, 9, 1, 2);
    px(ctx, '#5a3010', 6, 15, 2, 1);
    px(ctx, '#5a3010', 10, 15, 1, 1);
    return;
  }
  // Pale green-white mould hairs on top and fuzz on the sides; fewer after the first bounce.
  const hairs = frame === 0 ? [2, 3, 5, 6, 8, 9, 11, 12, 13] : [3, 6, 9, 12];
  for (const x of hairs) {
    const h = 1 + ((x * 7) % 3);
    px(ctx, (x * 5) % 3 === 0 ? '#9cc88a' : '#e2f2d2', x, 3 - h, 1, h);
  }
  const fuzz = frame === 0 ? [5, 8, 11, 13] : [8, 12];
  for (const y of fuzz) {
    px(ctx, '#e2f2d2', 0, y);
    px(ctx, '#9cc88a', 15, y - 1);
  }
}
