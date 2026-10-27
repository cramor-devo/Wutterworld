import type Phaser from 'phaser';

/** Small deterministic RNG so procedural art looks the same on every device. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Draw = (ctx: CanvasRenderingContext2D, frame: number) => void;

export function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, frames: number, draw: Draw): void {
  const tex = scene.textures.createCanvas(key, w * frames, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  for (let f = 0; f < frames; f++) {
    ctx.save();
    ctx.translate(f * w, 0);
    draw(ctx, f);
    ctx.restore();
    tex.add(f, 0, f * w, 0, w, h);
  }
  tex.refresh();
}

export function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** SNES-style banded gradient with a checkerboard dither between bands. */
export function bandedGradient(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[]): void {
  const band = h / colors.length;
  colors.forEach((c, i) => px(ctx, c, 0, Math.floor(i * band), w, Math.ceil(band)));
  for (let i = 1; i < colors.length; i++) {
    const y0 = Math.floor(i * band) - 2;
    for (let y = y0; y < y0 + 4; y++) for (let x = (y % 2); x < w; x += 2) px(ctx, colors[y < i * band ? i : i - 1], x, y);
  }
}
